import {DURATION_SECONDS,EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,fileSlug} from './core.js';
import {muxWebM} from './webm.js';

const FORMAT_CANDIDATES=[
 {mime:'video/webm;codecs=vp9',ext:'webm'},
 {mime:'video/webm;codecs=vp8',ext:'webm'},
 {mime:'video/webm',ext:'webm'},
 {mime:'video/mp4;codecs=avc1.42E01E',ext:'mp4'},
 {mime:'video/mp4',ext:'mp4'}
];
export function preferredFormat(Recorder=globalThis.MediaRecorder){
 if(!Recorder)return null;
 const matched=FORMAT_CANDIDATES.find(x=>{try{return Recorder.isTypeSupported(x.mime)}catch(_){return false}});
 return matched??{mime:'',ext:'webm'};
}
function isAborted(error){return error?.name==='AbortError'}
const abortError=()=>Object.assign(new Error('Video export canceled.'),{name:'AbortError'});
/**
 * Browser-local realtime recording. No server/video upload.
 * Animations are periodic and the same exact pose is submitted at t=0 and t=10s.
 * MediaRecorder controls actual encoded frame pacing; no invented frame-perfect claim.
 */

/**
 * Frame-by-frame export: WebCodecs assigns explicit timestamps to every frame.
 * This works on slow GPUs without the frame drops of real-time MediaRecorder.
 * CI uses a reduced fixture profile on localhost; production defaults to 1080p/30fps/10s.
 */
async function recordFrames(engine,{signal,onProgress=()=>{}},profile){
 const supported=await pickEncoder(profile);
 if(!supported)return null;
 const {codec,config}=supported;
 const total=Math.round(profile.fps*profile.durationSeconds);
 const frames=[];
 let failed=null,encoder=null,mode=false;
 try{
  engine.setExportMode(true,{width:profile.width,height:profile.height});mode=true;
  encoder=new VideoEncoder({
   output:chunk=>{
     const data=new Uint8Array(chunk.byteLength);
     chunk.copyTo(data);
     frames.push({timestamp:chunk.timestamp,data,key:chunk.type==='key'});
   },
   error:e=>{failed=e}
  });
  encoder.configure(config);
  const frameInterval=1000000/profile.fps;
  for(let i=0;i<total;i++){
   if(signal?.aborted)throw abortError();
   if(failed)throw failed;
   engine.draw(i/total);
   const timestamp=Math.round(i*frameInterval);
   const frame=new VideoFrame(engine.canvas,{timestamp,duration:Math.round(frameInterval)});
   try{encoder.encode(frame,{keyFrame:i===0||i%(profile.fps*3)===0})}
   finally{frame.close()}
   if(encoder.encodeQueueSize>=4)await encoder.flush();
   if(failed)throw failed;
   onProgress((i+1)/total);
   // Keep the browser UI responsive; the encoder runs in its own media thread.
   await new Promise(resolve=>setTimeout(resolve,0));
  }
  await encoder.flush();
  if(failed)throw failed;
  if(frames.length!==total)throw new Error('Encoder produced '+frames.length+' of '+total+' frames.');
  engine.draw(0);
  const blob=muxWebM({width:profile.width,height:profile.height,durationSeconds:profile.durationSeconds,codec,frames});
  return {blob,ext:'webm',width:profile.width,height:profile.height,duration:profile.durationSeconds,frames:frames.length,offline:true};
 }finally{
  encoder?.close();
  if(mode||engine.exporting)engine.setExportMode(false);
 }
}
async function pickEncoder(profile){
 if(typeof globalThis.VideoEncoder==='undefined'||typeof globalThis.VideoFrame==='undefined')return null;
 const codecs=['vp09.00.10.08','vp8'];
 for(const codec of codecs){
  const config={codec,width:profile.width,height:profile.height,bitrate:8_000_000,
    framerate:profile.fps,latencyMode:'quality'};
  try{const result=await VideoEncoder.isConfigSupported(config);if(result.supported)return {codec,config:result.config||config}}
  catch(_){}
 }
 return null;
}
function exportProfile(){
 const base={width:EXPORT_WIDTH,height:EXPORT_HEIGHT,fps:EXPORT_FPS,durationSeconds:DURATION_SECONDS};
 // Used exclusively by the local browser smoke test; not an end-user setting.
 const testing=globalThis.location?.hostname==='127.0.0.1'?globalThis.__BIRTHDAY_CI_EXPORT_PROFILE:null;
 if(!testing)return base;
 const data={...base,...testing};
 if(!Number.isInteger(data.width)||!Number.isInteger(data.height)||data.width<64||data.height<64||
    !Number.isInteger(data.fps)||data.fps<1||data.fps>60||data.durationSeconds<1||data.durationSeconds>20)return base;
 return data;
}

export async function recordLoop(engine,{signal,onProgress=()=>{}}={}){ 
 const profile=exportProfile();
 if(!signal?.aborted){
  const exact=await recordFrames(engine,{signal,onProgress},profile);
  if(exact)return exact;
 }

 if(!globalThis.MediaRecorder||typeof engine.canvas.captureStream!=='function'){
  throw new Error('Your browser cannot record this 3D canvas. Use a recent Chrome, Edge, or Safari.');
 }
 const selected=preferredFormat();
 if(signal?.aborted)throw abortError();
 let media=null,recorder=null,raf=null,visibility=null,abort=null,done=false;
 let modeChanged=false;
 const chunks=[];
 try{
  engine.setExportMode(true);modeChanged=true;
  engine.draw(0);
  media=engine.canvas.captureStream(EXPORT_FPS);
  recorder=new MediaRecorder(media,selected?.mime?{mimeType:selected.mime,videoBitsPerSecond:10_000_000}:{videoBitsPerSecond:10_000_000});
  const mime=(recorder.mimeType||selected?.mime||'video/webm').toLowerCase();
  const ext=mime.includes('mp4')?'mp4':'webm';
  const result=await new Promise((resolve,reject)=>{
   let failure=null,started=null;
   const finish=(err)=>{
    if(done)return;
    done=true;
    if(raf!==null)cancelAnimationFrame(raf);
    if(visibility)document.removeEventListener('visibilitychange',visibility);
    if(abort)signal?.removeEventListener('abort',abort);
    if(err){reject(err);return}
    const blob=new Blob(chunks,{type:mime.split(';')[0]});
    if(!blob.size){reject(new Error('Browser produced an empty video. Try again.'));return}
    resolve({blob,ext,width:EXPORT_WIDTH,height:EXPORT_HEIGHT,duration:DURATION_SECONDS});
   };
   recorder.ondataavailable=e=>{if(e.data?.size)chunks.push(e.data)};
   recorder.onerror=e=>{failure=e.error||new Error('Video encoder failed');if(recorder.state!=='inactive')recorder.stop();else finish(failure)};
   recorder.onstop=()=>finish(failure);
   visibility=()=>{
    if(document.hidden&&recorder.state==='recording'){
      failure=new Error('The browser tab became hidden during export. Keep it open and try again.');
      recorder.stop();
    }
   };
   abort=()=>{
     failure=abortError();
     if(recorder.state==='recording')recorder.stop();
     else finish(failure);
   };
   const tick=now=>{
    if(failure||done)return;
    if(started===null)started=now;
    const elapsed=(now-started)/1000;
    if(elapsed>=DURATION_SECONDS){
      // Return to the start pose for the loop seam before stopping the stream.
      engine.draw(0);
      onProgress(1);
      if(recorder.state==='recording')recorder.stop();else finish(new Error('Recorder stopped unexpectedly.'));
      return;
    }
    engine.draw(elapsed/DURATION_SECONDS);
    onProgress(Math.min(.999,elapsed/DURATION_SECONDS));
    raf=requestAnimationFrame(tick);
   };
   document.addEventListener('visibilitychange',visibility);
   signal?.addEventListener('abort',abort,{once:true});
   try{
    recorder.start(500);
    engine.draw(0);
    raf=requestAnimationFrame(tick);
   }catch(e){finish(e)}
  });
  return result;
 }catch(error){
  if(!isAborted(error))console.error('Birthday video export failed',error);
  throw error;
 }finally{
  if(raf!==null)cancelAnimationFrame(raf);
  if(visibility)document.removeEventListener('visibilitychange',visibility);
  if(abort)signal?.removeEventListener('abort',abort);
  if(recorder?.state==='recording')recorder.stop();
  media?.getTracks().forEach(track=>track.stop());
  if(modeChanged||engine.exporting)engine.setExportMode(false);
 }
}
export function saveVideo(result,design){
 const url=URL.createObjectURL(result.blob);
 const link=document.createElement('a');
 link.href=url;
 link.download=fileSlug(design.artist)+'-'+fileSlug(design.title)+'-'+fileSlug(design.scene)+'-'+design.seed+'.'+result.ext;
 document.body.appendChild(link);
 link.click();
 link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60_000);
 return link.download;
}
