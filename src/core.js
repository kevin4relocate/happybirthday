/**
 * Birthday Studio V2 — pure, testable generation logic.
 * No browser, Canvas or Three.js dependency.
 */
export const DURATION_SECONDS=10;
export const EXPORT_WIDTH=1920;
export const EXPORT_HEIGHT=1080;
export const EXPORT_FPS=30;
export const HISTORY_LIMIT=3000;
export const SCENES=Object.freeze([
  {id:'atelier',label:'The Golden Atelier',family:'luxury',palette:['#f1d4a0','#fff0d6','#ae7f4c'],back:0x281b2b,floor:0x3a2335,cake:0xf3e2d0,icing:0xfff6e6,metal:0xd8a85d,accent:0xcf8791},
  {id:'pastel',label:'Strawberry Daydream',family:'pastel',palette:['#ffb4c3','#fff0eb','#b6dadd'],back:0x4c3952,floor:0x6e526b,cake:0xe7a0ae,icing:0xffe3e7,metal:0xe9c0a4,accent:0xc4e0d2},
  {id:'moonlit',label:'Moonlight Wishes',family:'night',palette:['#d8c7fa','#f6dfaf','#8fcbe7'],back:0x0c1735,floor:0x172a4f,cake:0x8997c8,icing:0xc4cbed,metal:0xd9c994,accent:0x7b98d8},
  {id:'musicbox',label:'A Little Music Box',family:'nostalgia',palette:['#f5cb9b','#d7a37a','#b2bfba'],back:0x352332,floor:0x684536,cake:0xe8c39c,icing:0xf6e6cb,metal:0xc8a167,accent:0xab7a88},
  {id:'garden',label:'The Secret Birthday Garden',family:'botanical',palette:['#cde5bb','#efd1c6','#e4bb72'],back:0x163a35,floor:0x315a4b,cake:0xb8cbac,icing:0xe5efdb,metal:0xc7ae71,accent:0xe2a8b4},
  {id:'disco',label:'Midnight Party Lights',family:'party',palette:['#fd97d0','#e5b8ff','#91dcf5'],back:0x1a1034,floor:0x372354,cake:0x9c81b9,icing:0xf0d2ee,metal:0xddd0f3,accent:0xfe91cb}
]);
export const CAKE_STYLES=['two-tier','three-tier','heart','ripple','sundae','mini'];
export const FINISHES=['glossy','satin','sugar','velvet','marble','gold-leaf'];
export const DECOR=['pearls','strawberries','flowers','sugar-stars','sprinkles','gold-flakes'];
export const BANNERS=['arched','ribbon','beaded','star-garland'];
export const TEXT_FINISHES=['gold','ivory','rose','silver','glass'];
export const BALLOON_FINISHES=['pearl','metallic','matte','transparent'];
export const TITLE_STYLES=['sculpted','engraved','glowing','satin'];
const isObject=o=>o!==null&&typeof o==='object';
export function hashString(text){
  let h=2166136261;for(const ch of String(text)){h^=ch.codePointAt(0);h=Math.imul(h,16777619)}
  return h>>>0;
}
export function randomGenerator(seed){
  let a=seed>>>0;
  return ()=>{a=(a+0x6D2B79F5)|0;let t=Math.imul(a^(a>>>15),1|a);t^=t+Math.imul(t^(t>>>7),61|t);return ((t^(t>>>14))>>>0)/4294967296};
}
export function pick(items,rng=Math.random){return items[Math.floor(rng()*items.length)]}
export function intBetween(lo,hi,rng=Math.random){return lo+Math.floor(rng()*(hi-lo+1))}
export function splitTitle(title){
  const text=String(title??'').trim().replace(/\s+/g,' ');
  if(!text)return ['Happy Birthday'];
  const m=/^(happy\s+birthday)(?:\s*[,.:!;–—-]\s*|\s+|$)/i.exec(text);
  if(m){const rest=text.slice(m[0].length).trim();return rest?[m[1],rest]:[m[1]]}
  const words=text.split(' ');
  if(words.length<=3&&text.length<=29)return [text];
  if(words.length<2){const cps=Array.from(text),half=Math.ceil(cps.length/2);return [cps.slice(0,half).join(''),cps.slice(half).join('')].filter(Boolean)}
  let split=1,best=Infinity;
  for(let i=1;i<words.length;i++){
    const left=words.slice(0,i).join(' '),right=words.slice(i).join(' ');
    const balance=Math.abs(Array.from(left).length-Array.from(right).length);
    if(balance<best){best=balance;split=i}
  }
  return [words.slice(0,split).join(' '),words.slice(split).join(' ')];
}
export function fileSlug(value){
  const clean=String(value??'').normalize('NFKC').replace(/[\u0000-\u001f\u007f]/g,'').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,72);
  return clean||'birthday';
}
export function chooseDesign(title,artist,history=[],rng=Math.random){
  const previous=Array.isArray(history)?history:[];
  const fingerprints=new Set(previous.map(item=>typeof item==='string'?item:item?.signature).filter(Boolean));
  const latest=previous.slice(-3);
  const lastTwoScenes=new Set(latest.slice(-2).map(item=>item?.scene));
  const lastFamily=latest.at(-1)?.family;
  const lastFinishes=new Set(latest.slice(-2).map(item=>item?.finish));
  for(let tries=0;tries<600;tries++){
    const available=SCENES.filter(p=>!lastTwoScenes.has(p.id)&&p.family!==lastFamily);
    const scene=pick(available.length?available:SCENES,rng);
    const finish=pick(FINISHES.filter(x=>!lastFinishes.has(x)).length?FINISHES.filter(x=>!lastFinishes.has(x)):FINISHES,rng);
    const seed=intBetween(1,0x7fffffff,rng);
    const design={
      title:String(title||'Happy Birthday').trim(),
      artist:String(artist||'').trim(),
      lines:splitTitle(title),
      scene:scene.id,family:scene.family,
      seed,
      cakeStyle:pick(CAKE_STYLES,rng),
      finish,
      decorations:pick(DECOR,rng),
      accentVariant:intBetween(0,8,rng),
      candleCount:pick([3,5,7,9],rng),
      candlePalette:intBetween(0,3,rng),
      cakeScale:pick([.9,1,1.09,1.17],rng),
      balloonCount:pick([5,7,9,11],rng),
      balloonFinish:pick(BALLOON_FINISHES,rng),
      giftCount:pick([2,3,4],rng),
      arch:pick(BANNERS,rng),
      textFinish:pick(TEXT_FINISHES,rng),
      titleStyle:pick(TITLE_STYLES,rng),
      lightVariation:intBetween(0,7,rng)
    };
    // No seed in structural fingerprint: random position changes alone must not count as a new design.
    const signature=[design.scene,design.cakeStyle,design.finish,design.decorations,design.accentVariant,
      design.candleCount,design.candlePalette,design.cakeScale,design.balloonCount,design.balloonFinish,
      design.giftCount,design.arch,design.textFinish,design.titleStyle,design.lightVariation].join('|');
    if(fingerprints.has(signature))continue;
    design.signature=signature;
    return design;
  }
  throw new Error('No new structural design was available. Please try again.');
}
export class DesignHistory {
  constructor(storage=null,key='birthday-studio-v2-history'){this.storage=storage;this.key=key;this.records=[];this.load()}
  load(){
    try{const raw=this.storage?.getItem(this.key);const val=raw?JSON.parse(raw):[];
      this.records=Array.isArray(val)?val.filter(o=>isObject(o)&&typeof o.signature==='string').slice(-HISTORY_LIMIT):[];
    }catch(_){this.records=[]}
    return this.records;
  }
  add(d){
    if(!d?.signature||this.records.some(x=>x.signature===d.signature))return false;
    this.records.push({signature:d.signature,scene:d.scene,family:d.family,finish:d.finish});
    if(this.records.length>HISTORY_LIMIT)this.records.splice(0,this.records.length-HISTORY_LIMIT);
    try{this.storage?.setItem(this.key,JSON.stringify(this.records))}catch(_){/* Maintain in-memory anti-repeat if storage is full. */}
    return true;
  }
  has(sig){return this.records.some(x=>x.signature===sig)}
}
