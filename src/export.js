import {DURATION_SECONDS,EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,fileSlug} from './core.js';

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
export async function recordLoop(engine,{signal,onProgress=()=>{}}={}){
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
