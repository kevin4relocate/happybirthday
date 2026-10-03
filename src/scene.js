import {ART_VARIANTS,EXPORT_WIDTH,EXPORT_HEIGHT,randomGenerator} from './core.js';

const W=EXPORT_WIDTH,H=EXPORT_HEIGHT,TAU=Math.PI*2;
const between=(lo,hi,rng)=>lo+(hi-lo)*rng();
const noZoom=true;

/** Cinematic still-life with photographic detail and native Canvas2D animation.
 *  There is only ONE art-directed room, intentionally not 1,000 random 3D toys.
 *  All variable motion is a periodic function of phase alone.
 */
export class GalaScene {
 constructor(canvas,container){
  this.canvas=canvas;this.container=container;
  this.ctx=canvas.getContext('2d',{alpha:false,willReadFrequently:false});
  if(!this.ctx)throw new Error('Canvas 2D unavailable');
  this.photo=null;this.design=null;this.staticPlate=null;this.motion=[];
  this.exporting=false;this.phase=0;
  this.resizer=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.resize()):null;
  this.resizer?.observe(container);
  this.resize();
 }
 async load(){
  if(this.photo)return;
  const img=new Image();
  await new Promise((resolve,reject)=>{
   img.onload=()=>resolve();
   img.onerror=()=>reject(new Error('The licensed cake photograph could not load.'));
   img.src='./assets/midnight-gala.jpg';
  });
  if(!img.naturalWidth||!img.naturalHeight)throw new Error('Hero photograph is empty');
  this.photo=img;
 }
 setup(design){
  if(!this.photo)throw new Error('The photo must finish loading before Generate.');
  this.design=design;
  const rng=randomGenerator(design.seed);
  this.motion=Array.from({length:48},(_,i)=>({
   x:between(i%4===0?930:75,i%4===0?1860:1890,rng),
   y:between(70,1010,rng),rad:between(3.6,11.0,rng),opacity:between(.045,.22,rng),
   speed:i%3+1,offset:rng(),sway:between(3,13,rng)
  }));
  this.rebuild();
  this.draw(0);
 }
 resize(){
  if(this.exporting)return;
  const width=Math.max(320,Math.round(this.container.clientWidth||800));
  const height=Math.round(width*9/16);
  const pixelRatio=Math.min(1.6,Math.max(1,window.devicePixelRatio||1));
  this.setSize(Math.round(width*pixelRatio),Math.round(height*pixelRatio));
 }
 setSize(w,h){
  if(this.canvas.width===w&&this.canvas.height===h)return;
  this.canvas.width=w;this.canvas.height=h;
  if(this.design&&this.photo){this.rebuild();this.draw(this.phase)}
 }
 setExportMode(enabled,options={}){
  this.exporting=enabled;
  if(enabled){this.setSize(options.width||W,options.height||H)}
  else{
   const width=Math.max(320,Math.round(this.container.clientWidth||800));
   const pixelRatio=Math.min(1.6,Math.max(1,window.devicePixelRatio||1));
   this.setSize(Math.round(width*pixelRatio),Math.round(width*9/16*pixelRatio));
  }
 }
 drawPhoto(c,photo){
  // Subject occupies the right two-thirds; a feathered edge forms genuine
  // typographic negative space, not a rectangle placed over the picture.
  const origin=680,drawWidth=1360;
  const ratio=Math.max(drawWidth/photo.naturalWidth,H/photo.naturalHeight);
  const sw=drawWidth/ratio,sh=H/ratio;
  const sx=Math.max(0,(photo.naturalWidth-sw)*.47);
  const sy=Math.max(0,(photo.naturalHeight-sh)*.49);
  const layer=document.createElement('canvas');layer.width=W;layer.height=H;
  const x=layer.getContext('2d');
  x.drawImage(photo,sx,sy,sw,sh,origin,0,drawWidth,H);
  x.globalCompositeOperation='destination-in';
  const fade=x.createLinearGradient(680,0,1140,0);
  fade.addColorStop(0,'rgba(255,255,255,0)');
  fade.addColorStop(.58,'rgba(255,255,255,.74)');
  fade.addColorStop(1,'rgba(255,255,255,1)');
  x.fillStyle=fade;x.fillRect(origin,0,drawWidth,H);
  x.globalCompositeOperation='source-over';
  c.drawImage(layer,0,0);
 }
 drawStill(c){
  const variant=ART_VARIANTS[this.design.variant];
  c.fillStyle='#100a11';c.fillRect(0,0,W,H);
  // A photograph, not cylinder meshes, gives the still-life real surface detail.
  // All expensive filters are composed once, never per animation frame.
  c.save();c.globalAlpha=.19;c.filter='blur(76px)';
  c.drawImage(this.photo,0,0,W,H);c.restore();
  this.drawPhoto(c,this.photo);
  const shade=c.createLinearGradient(0,0,1480,0);
  shade.addColorStop(0,'rgba(9,8,15,.96)');
  shade.addColorStop(.38,'rgba(11,9,16,.88)');
  shade.addColorStop(.60,'rgba(13,9,14,.34)');
  shade.addColorStop(1,'rgba(13,7,9,.04)');
  c.fillStyle=shade;c.fillRect(0,0,W,H);
  const vignette=c.createRadialGradient(1130,530,200,990,540,1280);
  vignette.addColorStop(0,'rgba(6,4,9,0)');
  vignette.addColorStop(1,'rgba(6,4,9,.62)');
  c.fillStyle=vignette;c.fillRect(0,0,W,H);
  c.fillStyle='rgba(9,8,13,'+(1-variant.dim)*.22+')';c.fillRect(0,0,W,H);
  this.drawEditorialType(c,variant);
  // Tiny foil accents are part of the set dressing, not a giant title box.
  c.fillStyle='rgba(211,180,125,.68)';
  c.fillRect(128,165,38,2);
  c.fillRect(128,869,44,2);
  c.fillRect(128,160,2,13);
  c.fillRect(128,864,2,13);
 }
 fitFont(c,text,initial,maxWidth,family,min=24){
  let size=initial;
  while(size>min){
   c.font='normal '+size+'px '+family;
   if(c.measureText(text).width<=maxWidth)break;
   size-=2;
  }
  return Math.max(min,size);
 }
 drawEditorialType(c,variant){
  const x=142,max=710;
  c.save();c.textAlign='left';c.textBaseline='alphabetic';
  c.font='600 22px Arial,sans-serif';
  c.fillStyle='rgba(240,203,152,.78)';
  c.fillText('A NIGHT TO REMEMBER',x,310);
  c.fillStyle='#e8c78f';c.fillRect(x,331,128,1.5);
  const [first,second]=this.design.lines;
  const titleSize=this.fitFont(c,first,102,max,'Georgia,serif',45);
  const gradient=c.createLinearGradient(x,370,x+640,595);
  gradient.addColorStop(0,'#fff3dc');
  gradient.addColorStop(.53,variant.ink);
  gradient.addColorStop(1,'#c8a76b');
  c.fillStyle=gradient;c.font='normal '+titleSize+'px Georgia,serif';
  c.shadowColor='rgba(246,204,139,.19)';c.shadowBlur=17;
  c.fillText(first,x,490,max);
  c.shadowBlur=0;
  if(second){
   const secondSize=this.fitFont(c,second,51,max,'Georgia,serif',28);
   c.font='italic '+secondSize+'px Georgia,serif';
   c.fillStyle='#f7e6d2';
   c.fillText(second,x,570,max);
  }
  const artistY=725;
  c.fillStyle='rgba(232,202,151,.72)';
  c.fillRect(x,artistY-59,388,1);
  c.font='600 20px Arial,sans-serif';
  c.fillText('MUSIC BY',x,artistY-22);
  c.fillStyle='#f7e8d6';
  const artistSize=this.fitFont(c,this.design.artist,43,655,'Georgia,serif',23);
  c.font='normal '+artistSize+'px Georgia,serif';
  c.fillText(this.design.artist,x,artistY+38,max);
  c.restore();
 }
 rebuild(){
  if(!this.photo||!this.design)return;
  const c=document.createElement('canvas');c.width=this.canvas.width;c.height=this.canvas.height;
  const x=c.getContext('2d',{alpha:false});
  x.setTransform(c.width/W,0,0,c.height/H,0,0);
  this.drawStill(x);
  this.staticPlate=c;
 }
 draw(phase=0){
  if(!this.staticPlate)return;
  this.phase=(phase%1+1)%1;
  const c=this.ctx;
  c.setTransform(1,0,0,1,0,0);
  c.drawImage(this.staticPlate,0,0);
  c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);
  const t=this.phase*TAU;
  const art=ART_VARIANTS[this.design.variant];
  c.save();
  // Localized practical candle glow, never a full-screen blinking layer.
  const warmth=.070+.030*Math.sin(t+.2)+.015*Math.sin(t*2+1);
  const glow=c.createRadialGradient(1390,390,23,1390,390,495);
  glow.addColorStop(0,'rgba(255,206,142,'+Math.max(.01,warmth)+')');
  glow.addColorStop(.5,'rgba(241,147,74,'+(warmth*.29)+')');
  glow.addColorStop(1,'rgba(255,131,73,0)');
  c.fillStyle=glow;c.fillRect(730,0,1190,940);
  for(const dust of this.motion){
   const ph=t*dust.speed+TAU*dust.offset;
   const dx=dust.x+Math.sin(ph)*dust.sway;
   const dy=dust.y+Math.sin(ph+1.3)*dust.sway*.7;
   const alpha=dust.opacity*(.6+.4*Math.sin(ph+.8)**2);
   c.globalAlpha=alpha;
   const r=dust.rad*(.91+.13*Math.cos(ph));
   const light=c.createRadialGradient(dx,dy,0,dx,dy,r*3.5);
   light.addColorStop(0,art.glow);
   light.addColorStop(.20,'rgba(242,184,118,.52)');
   light.addColorStop(1,'rgba(235,156,101,0)');
   c.fillStyle=light;c.beginPath();c.arc(dx,dy,r*3.5,0,TAU);c.fill();
  }
  c.restore();
  // Fixed camera. No zoom/pan. Every moving value is a function of phase.
  if(!noZoom)throw new Error('Camera motion is disabled for exact loops.');
 }
 dispose(){this.resizer?.disconnect();this.staticPlate=null;this.photo=null}
}
