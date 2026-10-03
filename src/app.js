import {chooseDesign,DesignHistory,DURATION_SECONDS} from './core.js';
import {BirthdayScene} from './scene.js';
import {loadFont} from './type.js';
import {recordLoop,saveVideo,preferredFormat} from './export.js';

const dom={
 form:document.getElementById('creator-form'),
 song:document.getElementById('song-title'),
 artist:document.getElementById('artist-name'),
 generate:document.getElementById('generate'),
 download:document.getElementById('download'),
 cancel:document.getElementById('cancel-export'),
 progress:document.getElementById('export-progress'),
 bar:document.getElementById('progress-bar'),
 status:document.getElementById('status'),
 canvas:document.getElementById('stage'),
 viewport:document.getElementById('viewport'),
 loading:document.getElementById('stage-loading'),
 sceneName:document.getElementById('scene-caption'),
 headline:document.getElementById('stage-name'),
 format:document.getElementById('format-label')
};
const history=new DesignHistory(globalThis.localStorage);
let engine=null,font=null,design=null,abortController=null,recording=false,ready=false;
let raf=0,start=0,lastRender=-1;
function say(message,error=false){dom.status.textContent=message;dom.status.dataset.error=String(error)}
function cleanInputs(){return {title:dom.song.value.trim(),artist:dom.artist.value.trim()}}
function busy(on){recording=on;dom.generate.disabled=on;dom.song.disabled=on;dom.artist.disabled=on;dom.download.disabled=on||!ready;dom.cancel.hidden=!on;dom.progress.hidden=!on;if(!on)dom.bar.style.width='0%'}
function invalidate(){ready=false;dom.download.disabled=true;say('Update ready. Click Generate to apply your new song details.')}
dom.song.addEventListener('input',invalidate);
dom.artist.addEventListener('input',invalidate);

function frame(now){
 raf=requestAnimationFrame(frame);
 if(!engine||!ready||recording||document.hidden)return;
 if(now-lastRender<33)return;
 lastRender=now;
 const phase=((now-start)%(DURATION_SECONDS*1000))/(DURATION_SECONDS*1000);
 engine.draw(phase);
}
function generate(){
 if(recording||!engine)return;
 const {title,artist}=cleanInputs();
 if(!title||!artist){dom.form.reportValidity();say('Please enter both a song title and artist.',true);return}
 let candidate;
 try{
  candidate=chooseDesign(title,artist,history.records);
  engine.setup(candidate,font);
  design=candidate;
  history.add(candidate);
  ready=true;
  dom.download.disabled=false;
  start=performance.now();
  dom.sceneName.textContent=({atelier:'Golden Atelier',pastel:'Strawberry Daydream',moonlit:'Moonlight Wishes',musicbox:'A Little Music Box',garden:'Birthday Garden',disco:'Midnight Party Lights'})[design.scene]||'Birthday celebration';
  dom.headline.textContent=title;
  say('Your new 3D birthday scene is ready. Generate again for a different celebration.');
  dom.loading.hidden=true;
 }catch(error){
  ready=false;dom.download.disabled=true;
  say('Unable to build the scene: '+(error?.message||'Unknown error'),true);
  console.error(error);
 }
}
dom.form.addEventListener('submit',e=>{e.preventDefault();generate()});
dom.cancel.addEventListener('click',()=>abortController?.abort());
dom.download.addEventListener('click',async()=>{
 if(!ready||!design||recording)return;
 recording=true;abortController=new AbortController();
 busy(true);
 dom.cancel.textContent='Cancel export';
 dom.format.textContent='Rendering video…';
 say('Rendering your 10-second loop frame by frame. This may take longer on slower devices; keep the tab open.');
 let snapshot=design;
 try{
  const exported=await recordLoop(engine,{signal:abortController.signal,onProgress:p=>{dom.bar.style.width=(p*100).toFixed(1)+'%';say('Rendering '+Math.min(100,Math.floor(p*100))+'% — keep this tab visible.')}});
  const filename=saveVideo(exported,snapshot);
  dom.format.textContent='10 seconds · 1080p · '+exported.ext.toUpperCase();
  say('Video ready! Downloading '+filename);
 }catch(e){
  say(e?.name==='AbortError'?'Export canceled. Your scene is ready to try again.':'Video export failed: '+(e?.message||'Unknown error'),e?.name!=='AbortError');
 }finally{
  recording=false;abortController=null;busy(false);
  start=performance.now();lastRender=-1;
  if(!dom.format.textContent.includes('·')&&!dom.format.textContent.includes('1080p'))dom.format.textContent='10 seconds · 1080p · video only';
 }
});
dom.canvas.addEventListener('webglcontextlost',e=>{
 e.preventDefault();
 ready=false;dom.download.disabled=true;
 abortController?.abort();
 say('Graphics context was lost. Reload this page to recreate the 3D studio.',true);
});
window.addEventListener('beforeunload',()=>{cancelAnimationFrame(raf);abortController?.abort();engine?.dispose()});
async function init(){
 const format=preferredFormat();
 dom.format.textContent=format?'10 seconds · 1080p · '+format.ext.toUpperCase():'Browser recording unavailable';
 try{
  engine=new BirthdayScene(dom.canvas,dom.viewport);
  say('Preparing realistic candles, 3D lettering and lighting…');
  font=await loadFont();
  if(!font)say('Using scene-mounted lettering fallback. 3D scenes remain available.');
  generate();
  if(ready)raf=requestAnimationFrame(frame);
 }catch(error){
  dom.loading.innerHTML='<span class="loader-symbol" aria-hidden="true">✦</span><strong>3D studio unavailable</strong><span>Please try desktop Chrome or Edge.</span>';
  say('Could not initialize 3D rendering: '+(error?.message||'Unknown error'),true);
  console.error(error);
 }
}
init();
