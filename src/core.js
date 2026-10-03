export const DURATION_SECONDS=10;
export const EXPORT_WIDTH=1920;
export const EXPORT_HEIGHT=1080;
export const EXPORT_FPS=30;
export const SCENE_ID='midnight-gala';
export const ART_VARIANTS=Object.freeze([
 {name:'Candlelight',glow:'#ffbb79',ink:'#f7dfaa',dim:.92},
 {name:'Champagne Hour',glow:'#ffcc99',ink:'#eacb91',dim:.86},
 {name:'Velvet Night',glow:'#ffc2b1',ink:'#f7d8bd',dim:.94},
 {name:'Golden Memory',glow:'#ffc86b',ink:'#ecd6aa',dim:.90}
]);
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
export function newDesign(title,artist,previous=null,rng=Math.random){
 const seed=Math.max(1,Math.floor(rng()*0x7fffffff));
 let variant=Math.floor(rng()*ART_VARIANTS.length);
 if(previous&&ART_VARIANTS.length>1&&variant===previous.variant)
  variant=(variant+1)%ART_VARIANTS.length;
 return {scene:SCENE_ID,title:String(title).trim(),artist:String(artist).trim(),
  lines:splitTitle(title),seed,variant,variantName:ART_VARIANTS[variant].name};
}
