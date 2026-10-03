import {DURATION_SECONDS,EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,fileSlug} from './core.js';
import {muxWebM} from './webm.js';
import {countFrames,frameTimestampUs,loopFramePhase,closeExactEncodedSeam} from './loop.js';

const abortError=()=>Object.assign(new Error('Video export canceled.'),{name:'AbortError'});

/** Strict export: no real-time MediaRecorder fallback because dropped frames break the loop. */
async function pickEncoder(profile){
 if(typeof globalThis.VideoEncoder==='undefined'||typeof globalThis.VideoFrame==='undefined')return null;
 for(const codec of ['vp09.00.10.08','vp8']){
  const config={codec,width:profile.width,height:profile.height,bitrate:8_000_000,
    framerate:profile.fps,latencyMode:'quality'};
  try{const test=await VideoEncoder.isConfigSupported(config);if(test.supported)return {codec,config:test.config||config}}
  catch(_){}
 }
 return null;
}
export function exportProfile(){
 const base={width:EXPORT_WIDTH,height:EXPORT_HEIGHT,fps:EXPORT_FPS,durationSeconds:DURATION_SECONDS};
 // Browser smoke tests can use a smaller fixture, only at localhost.
 const fixture=globalThis.location?.hostname==='127.0.0.1'?globalThis.__BIRTHDAY_CI_EXPORT_PROFILE:null;
 if(!fixture)return base;
 const value={...base,...fixture};
 if(!Number.isInteger(value.width)||!Number.isInteger(value.height)||value.width<64||value.height<64||
    !Number.isInteger(value.fps)||value.fps<1||value.fps>60||
    !Number.isFinite(value.durationSeconds)||value.durationSeconds<1||value.durationSeconds>20)return base;
 return value;
}
export async function recordLoop(engine,{signal,onProgress=()=>{}}={}){
 if(signal?.aborted)throw abortError();
 const profile=exportProfile();
 const supported=await pickEncoder(profile);
 if(!supported)throw new Error(
  'Exact seamless export requires WebCodecs VP8/VP9 encoding. Please use an up-to-date desktop Chrome or Edge.'
 );
 const {codec,config}=supported;
 const total=countFrames(profile.fps,profile.durationSeconds);
 const samples=[];
 let encoder=null,exportMode=false,failed=null;
 try{
  if(signal?.aborted)throw abortError();
  engine.setExportMode(true,{width:profile.width,height:profile.height});exportMode=true;
  encoder=new VideoEncoder({
   output:chunk=>{
    const data=new Uint8Array(chunk.byteLength);
    chunk.copyTo(data);
    samples.push({timestamp:chunk.timestamp,data,key:chunk.type==='key'});
   },
   error:error=>{failed=error}
  });
  encoder.configure(config);
  for(let i=0;i<total-1;i++){
   if(signal?.aborted)throw abortError();
   if(failed)throw failed;
   engine.draw(loopFramePhase(i,total));
   const timestamp=frameTimestampUs(i,profile.fps);
   const frame=new VideoFrame(engine.canvas,{timestamp,duration:Math.round(1e6/profile.fps)});
   try{encoder.encode(frame,{keyFrame:i===0||i%(profile.fps*3)===0})}
   finally{frame.close()}
   if(encoder.encodeQueueSize>=4)await encoder.flush();
   if(failed)throw failed;
   onProgress((i+1)/total);
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  await encoder.flush();
  if(signal?.aborted)throw abortError();
  if(failed)throw failed;
  const frames=closeExactEncodedSeam(samples,total,profile.fps);
  const first=frames[0].data,last=frames.at(-1).data;
  if(first.length!==last.length||first.some((v,i)=>v!==last[i])){
   throw new Error('Encoded loop seam differs; refusing to export.');
  }
  engine.draw(0);
  const blob=muxWebM({width:profile.width,height:profile.height,durationSeconds:profile.durationSeconds,codec,frames});
  onProgress(1);
  return {blob,ext:'webm',width:profile.width,height:profile.height,
    duration:profile.durationSeconds,fps:profile.fps,frames:total,exactSeam:true,codec};
 }finally{
  encoder?.close();
  if(exportMode||engine.exporting)engine.setExportMode(false);
 }
}
export function saveVideo(result,design){
 if(!result?.exactSeam)throw new Error('Refusing to download a video without a verified seam.');
 const url=URL.createObjectURL(result.blob);
 const link=document.createElement('a');
 link.href=url;
 link.download=fileSlug(design.artist)+'-'+fileSlug(design.title)+'-'+fileSlug(design.scene)+'-'+design.seed+'-seamless.'+result.ext;
 document.body.appendChild(link);
 link.click();
 link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60_000);
 return link.download;
}
