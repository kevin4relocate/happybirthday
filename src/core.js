import {SCENES,getScene,pickScene} from './scene-registry.js';

export const DURATION_SECONDS=10;
export const EXPORT_WIDTH=1920;
export const EXPORT_HEIGHT=1080;
export const EXPORT_FPS=30;
export {SCENES};
export function randomGenerator(seed){
 let s=seed>>>0;
 return ()=>{s=(s+0x6D2B79F5)|0;let n=Math.imul(s^(s>>>15),1|s);n^=n+Math.imul(n^(n>>>7),61|n);return ((n^(n>>>14))>>>0)/4294967296};
}
export function splitTitle(value){
 const raw=String(value??'').trim().replace(/\s+/g,' ');
 if(!raw)return ['Happy Birthday'];
 const m=/^(happy\s+birthday)(?:\s*[,.:!;–—-]\s*|\s+|$)/i.exec(raw);
 if(m){const other=raw.slice(m[0].length).trim();return other?[m[1],other]:[m[1]]}
 const words=raw.split(' ');if(words.length<2)return [raw];
 let best=1,score=1e9;
 for(let i=1;i<words.length;i++){
  const a=words.slice(0,i).join(' '),b=words.slice(i).join(' ');
  const diff=Math.abs(Array.from(a).length-Array.from(b).length);
  if(diff<score){score=diff;best=i}
 }
 return [words.slice(0,best).join(' '),words.slice(best).join(' ')];
}
export function fileSlug(text){
 return String(text??'').normalize('NFKC')
   .replace(/[\u0000-\u001f\u007f]/g,'')
   .replace(/[^\p{L}\p{N}]+/gu,'-')
   .replace(/^-+|-+$/g,'').slice(0,70)||'birthday';
}
export function newDesign(title,artist,previous=null,rng=Math.random,recent=[]){
 // For a fresh install, showcase the existing flagship first. Subsequent
 // Generate clicks automatically rotate among distinct mastered compositions.
 const history=recent.length?recent:(previous?[previous.scene]:[]);
 const sceneId=history.length?pickScene(history,rng):SCENES[0].id;
 const scene=getScene(sceneId);
 if(!scene)throw new Error('Unknown scene');
 let variant=Math.floor(rng()*scene.moods.length);
 if(previous?.scene===sceneId&&previous.variant===variant)
  variant=(variant+1)%scene.moods.length;
 const seed=Math.max(1,Math.floor(rng()*0x7fffffff));
 return {scene:sceneId,title:String(title).trim(),artist:String(artist).trim(),
  lines:splitTitle(title),seed,variant,variantName:scene.moods[variant]};
}
const HISTORY_KEY='birthday-v4-scene-history';
export class SceneHistory{
 constructor(storage=null){
  this.storage=storage;
  try{
   const parsed=JSON.parse(storage?.getItem(HISTORY_KEY)||'[]');
   this.records=Array.isArray(parsed)?parsed.filter(id=>!!getScene(id)).slice(-60):[];
  }catch(_){this.records=[]}
 }
 add(sceneId){
  if(!getScene(sceneId))return;
  this.records.push(sceneId);
  if(this.records.length>60)this.records=this.records.slice(-60);
  try{this.storage?.setItem(HISTORY_KEY,JSON.stringify(this.records))}catch(_){}
 }
}
