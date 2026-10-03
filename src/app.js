import {newDesign,EXPORT_FPS,DURATION_SECONDS} from './core.js';
import {GalaScene} from './scene.js';
import {recordLoop,saveVideo} from './export.js';

const $=id=>document.getElementById(id);
const nodes={form:$('creator-form'),song:$('song-title'),artist:$('artist-name'),
 generate:$('generate'),download:$('download'),cancel:$('cancel-export'),
 progress:$('export-progress'),bar:$('progress-bar'),
 canvas:$('stage'),viewport:$('viewport'),status:$('status'),
 caption:$('scene-caption'),stageName:$('stage-name'),placeholder:$('placeholder')};
let engine=null,design=null,ready=false,recording=false,controller=null,raf=0,started=0,last=0;
function say(msg,error=false){nodes.status.textContent=msg;nodes.status.dataset.error=String(error)}
function controls(busy){
 recording=busy;nodes.generate.disabled=busy;nodes.download.disabled=busy||!ready;
 nodes.song.disabled=busy;nodes.artist.disabled=busy;
 nodes.cancel.hidden=!busy;nodes.progress.hidden=!busy;
 if(!busy)nodes.bar.style.width='0%';
}
function invalidate(){
 ready=false;nodes.download.disabled=true;
 say('Details changed. Click Generate to update this scene.');
}
nodes.song.addEventListener('input',invalidate);
nodes.artist.addEventListener('input',invalidate);
function generate(){
 if(!engine||recording)return;
 const title=nodes.song.value.trim(),artist=nodes.artist.value.trim();
 if(!title||!artist){nodes.form.reportValidity();say('Enter a song and artist.',true);return}
 try{
  const next=newDesign(title,artist,design);
  engine.setup(next);design=next;ready=true;
  nodes.stageName.textContent=title;
  nodes.caption.textContent='MIDNIGHT GALA · '+next.variantName.toUpperCase();
  nodes.download.disabled=false;started=performance.now();
  nodes.placeholder.hidden=true;
  say('Your cinematic birthday scene is ready. Generate again for a fresh lighting mood.');
 }catch(error){ready=false;nodes.download.disabled=true;say(error.message,true);console.error(error)}
}
nodes.form.addEventListener('submit',event=>{event.preventDefault();generate()});
function animate(now){
 raf=requestAnimationFrame(animate);
 if(!ready||!engine||recording||document.hidden||now-last<33)return;
 last=now;engine.draw(((now-started)%(DURATION_SECONDS*1000))/(DURATION_SECONDS*1000));
}
nodes.cancel.addEventListener('click',()=>controller?.abort());
nodes.download.addEventListener('click',async()=>{
 if(!ready||recording)return;
 controller=new AbortController();controls(true);
 say('Encoding 300 frames. Keep the browser tab open; this can take longer than 10 seconds.');
 const snapshot=design;
 try{
  const result=await recordLoop(engine,{signal:controller.signal,
   onProgress:f=>{nodes.bar.style.width=(f*100).toFixed(1)+'%';
    say('Encoding '+Math.floor(100*f)+'% · frame-accurate 10-second loop');}});
  const filename=saveVideo(result,snapshot);
  say('Export complete: 300 frames · first/last frame identical. '+filename);
 }catch(error){
  say(error?.name==='AbortError'?'Export canceled.':('Could not export: '+error.message),error?.name!=='AbortError');
 }finally{controller=null;controls(false);started=performance.now();last=0}
});
window.addEventListener('beforeunload',()=>{cancelAnimationFrame(raf);controller?.abort();engine?.dispose()});
(async()=>{
 try{
  engine=new GalaScene(nodes.canvas,nodes.viewport);
  await engine.load();
  generate();
  raf=requestAnimationFrame(animate);
 }catch(error){
  say('Unable to load the flagship artwork: '+error.message,true);
  nodes.placeholder.textContent='Artwork unavailable. Please reload and try again.';
  console.error(error);
 }
})();
