import {SCENES,getScene} from './scene-registry.js';
import {EXPORT_WIDTH,EXPORT_HEIGHT,randomGenerator} from './core.js';

const W=EXPORT_WIDTH,H=EXPORT_HEIGHT,TAU=2*Math.PI;
const between=(a,b,rng)=>a+(b-a)*rng();
const noZoom=true;

/**
 * Three intentionally independent photographic compositions:
 * dark editorial / blush botanical / gilded ballroom.
 * All motion is derived from normalized phase, and the exporter's
 * first/last cloned compressed frame still guarantees an exact seam.
 */
export class GalaScene{
 constructor(canvas,container){
  this.canvas=canvas;this.container=container;
  this.ctx=canvas.getContext('2d',{alpha:false});
  if(!this.ctx)throw new Error('Canvas 2D unavailable');
  this.photos=new Map();this.design=null;this.staticPlate=null;this.motion=[];
  this.exporting=false;this.phase=0;
  this.resizer=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.resize()):null;
  this.resizer?.observe(container);
  this.resize();
 }
 async load(){
  const assets=[...new Set(SCENES.flatMap(scene=>[scene.photo,scene.backdrop].filter(Boolean)))];
  await Promise.all(assets.map(async url=>{
   if(this.photos.has(url))return;
   const photo=new Image();
   await new Promise((resolve,reject)=>{
    photo.onload=resolve;
    photo.onerror=()=>reject(new Error('Cannot load the licensed scene image '+url));
    photo.src=url;
   });
   if(photo.naturalWidth<100||photo.naturalHeight<100)throw new Error('Scene photograph is empty: '+url);
   this.photos.set(url,photo);
  }));
 }
 setup(design){
  const scene=getScene(design.scene);
  if(!scene||!this.photos.has(scene.photo)||scene.backdrop&&!this.photos.has(scene.backdrop))
   throw new Error('Scene assets not loaded: '+design.scene);
  this.design=design;
  const rng=randomGenerator(design.seed);
  const count=scene.id==='golden-ballroom'?38:scene.id==='rose-garden'?32:48;
  this.motion=Array.from({length:count},(_,i)=>({
    x:between(45,1875,rng),y:between(60,1020,rng),
    rad:between(scene.id==='rose-garden'?2:3,scene.id==='rose-garden'?8:11,rng),
    opacity:between(.04,.19,rng),offset:rng(),sway:between(3,15,rng),
    speed:1+i%3,depth:i%4,angle:rng()*TAU
  }));
  this.rebuild();this.draw(0);
 }
 resize(){
  if(this.exporting)return;
  const width=Math.max(320,Math.round(this.container.clientWidth||800));
  const pixelRatio=Math.min(1.6,Math.max(1,window.devicePixelRatio||1));
  this.setSize(Math.round(width*pixelRatio),Math.round(width*9/16*pixelRatio));
 }
 setSize(w,h){
  if(this.canvas.width===w&&this.canvas.height===h)return;
  this.canvas.width=w;this.canvas.height=h;
  if(this.design&&this.photos.size){this.rebuild();this.draw(this.phase)}
 }
 setExportMode(enabled,options={}){
  this.exporting=enabled;
  if(enabled)this.setSize(options.width||W,options.height||H);
  else{
   const width=Math.max(320,Math.round(this.container.clientWidth||800));
   const pixelRatio=Math.min(1.6,Math.max(1,window.devicePixelRatio||1));
   this.setSize(Math.round(width*pixelRatio),Math.round(width*9/16*pixelRatio));
  }
 }
 canvasLayer(){
  const layer=document.createElement('canvas');layer.width=W;layer.height=H;return layer;
 }
 cover(c,img,x,y,w,h,fx=.5,fy=.5){
  const scale=Math.max(w/img.naturalWidth,h/img.naturalHeight);
  const sw=w/scale,sh=h/scale;
  const sx=Math.max(0,Math.min(img.naturalWidth-sw,(img.naturalWidth-sw)*fx));
  const sy=Math.max(0,Math.min(img.naturalHeight-sh,(img.naturalHeight-sh)*fy));
  c.drawImage(img,sx,sy,sw,sh,x,y,w,h);
 }
 maskedImage(c,img,rect,mask){
  const layer=this.canvasLayer(),ctx=layer.getContext('2d');
  this.cover(ctx,img,...rect);
  ctx.globalCompositeOperation='destination-in';
  ctx.fillStyle=mask(ctx);
  ctx.fillRect(0,0,W,H);
  ctx.globalCompositeOperation='source-over';
  c.drawImage(layer,0,0);
 }
 gradient(c,x1,y1,x2,y2,stops){
  const g=c.createLinearGradient(x1,y1,x2,y2);
  for(const [at,color] of stops)g.addColorStop(at,color);
  return g;
 }
 fit(c,text,initial,max,family,min=23){
  let size=initial;
  while(size>min){
   c.font=size+'px '+family;
   if(c.measureText(text).width<=max)break;
   size-=2;
  }
  return size;
 }
 type(c,x,y,width,opt){
  const [first,second]=this.design.lines;
  const family=opt.family||'Georgia,serif';
  c.save();
  c.textBaseline='alphabetic';c.textAlign='left';
  c.font='600 18px Arial,sans-serif';
  c.letterSpacing='2px';
  c.fillStyle=opt.labelColor;
  c.fillText(opt.kicker,x,y-172,width);
  c.letterSpacing='0px';
  const n=this.fit(c,first,opt.size||94,width,family,38);
  c.font=n+'px '+family;
  c.shadowBlur=opt.shadowBlur||0;
  c.shadowColor=opt.shadow||'transparent';
  c.fillStyle=opt.titleColor;
  c.fillText(first,x,y,width);
  c.shadowBlur=0;
  if(second){
   const m=this.fit(c,second,opt.secondSize||48,width,family,24);
   c.fillStyle=opt.secondColor||opt.titleColor;
   c.font='italic '+m+'px '+family;
   c.fillText(second,x,y+82,width);
  }
  const dividerY=y+164;
  c.fillStyle=opt.ruleColor;
  c.fillRect(x,dividerY,Math.min(width*.62,340),1);
  c.fillStyle=opt.labelColor;
  c.font='600 18px Arial,sans-serif';
  c.fillText('MUSIC BY',x,dividerY+50,width);
  const artistSize=this.fit(c,this.design.artist,opt.artistSize||42,width,family,23);
  c.font=artistSize+'px '+family;
  c.fillStyle=opt.artistColor||opt.secondColor||opt.titleColor;
  c.fillText(this.design.artist,x,dividerY+111,width);
  c.restore();
 }
 drawMidnight(c,scene){
  const img=this.photos.get(scene.photo);
  c.fillStyle='#100a11';c.fillRect(0,0,W,H);
  c.save();c.globalAlpha=.19;c.filter='blur(76px)';this.cover(c,img,0,0,W,H);c.restore();
  this.maskedImage(c,img,[690,0,1230,H],ctx=>this.gradient(ctx,690,0,1210,0,[
   [0,'rgba(255,255,255,0)'],[.6,'rgba(255,255,255,.78)'],[1,'white']
  ]));
  c.fillStyle=this.gradient(c,0,0,1500,0,[
   [0,'rgba(9,8,15,.98)'],[.36,'rgba(11,9,16,.86)'],
   [.67,'rgba(13,9,14,.22)'],[1,'rgba(13,7,9,.04)']
  ]);c.fillRect(0,0,W,H);
  c.fillStyle='#dfb979';c.fillRect(142,320,135,1);
  this.type(c,142,487,720,{kicker:'A NIGHT TO REMEMBER',size:100,
   labelColor:'#dabb8b',titleColor:'#f8e5cc',secondColor:'#f9e8d4',
   ruleColor:'rgba(222,183,127,.69)',artistColor:'#f9ebdd',shadow:'rgba(255,194,120,.22)',shadowBlur:16});
 }
 drawRose(c,scene){
  const img=this.photos.get(scene.photo);
  c.fillStyle='#e9d2cb';c.fillRect(0,0,W,H);
  c.fillStyle=this.gradient(c,0,0,W,H,[
   [0,'#d5b1b2'],[.48,'#f3dcd2'],[1,'#f7e6d9']
  ]);c.fillRect(0,0,W,H);
  this.maskedImage(c,img,[0,0,1260,H],ctx=>this.gradient(ctx,725,0,1460,0,[
   [0,'rgba(255,255,255,1)'],[.49,'rgba(255,255,255,.88)'],[1,'rgba(255,255,255,0)']
  ]));
  const warm=c.createLinearGradient(850,0,1800,H);
  warm.addColorStop(0,'rgba(251,226,222,.15)');
  warm.addColorStop(1,'rgba(252,236,223,.59)');
  c.fillStyle=warm;c.fillRect(750,0,1170,H);
  // Botanical lines, fine and secondary to the photographed cake.
  c.strokeStyle='rgba(136,77,86,.21)';c.lineWidth=2;c.beginPath();
  c.moveTo(1780,90);c.bezierCurveTo(1690,240,1855,335,1785,510);
  c.bezierCurveTo(1680,675,1836,769,1710,975);c.stroke();
  for(let i=0;i<9;i++){
   const y=190+i*86;
   c.beginPath();c.ellipse(1740+(i%2)*65,y,20,52,(i%2?-.52:.52),0,TAU);c.stroke();
  }
  c.fillStyle='#b57f8d';c.fillRect(1158,292,120,2);
  this.type(c,1158,445,620,{kicker:'THE ROSE GARDEN',size:89,
   labelColor:'#925d6e',titleColor:'#523440',secondColor:'#744755',
   ruleColor:'rgba(133,82,97,.56)',artistColor:'#543540'});
 }
 drawGolden(c,scene){
  const hall=this.photos.get(scene.backdrop),cake=this.photos.get(scene.photo);
  c.fillStyle='#26180f';c.fillRect(0,0,W,H);
  this.cover(c,hall,0,0,W,H,.5,.43);
  c.fillStyle='rgba(25,11,7,.66)';c.fillRect(0,0,W,H);
  c.fillStyle=this.gradient(c,0,0,1620,0,[
   [0,'rgba(20,9,10,.92)'],[.36,'rgba(27,15,13,.83)'],
   [.67,'rgba(28,16,14,.39)'],[1,'rgba(25,13,12,.23)']
  ]);c.fillRect(0,0,W,H);
  this.maskedImage(c,cake,[1030,65,835,960],ctx=>{
   const g=ctx.createRadialGradient(1450,515,240,1450,535,570);
   g.addColorStop(0,'rgba(255,255,255,1)');
   g.addColorStop(.57,'rgba(255,255,255,.99)');
   g.addColorStop(.83,'rgba(255,255,255,.68)');
   g.addColorStop(1,'rgba(255,255,255,0)');
   return g;
  });
  c.fillStyle=this.gradient(c,0,H*.69,0,H,[
   [0,'rgba(28,14,12,0)'],[1,'rgba(26,10,10,.49)']
  ]);c.fillRect(0,0,W,H);
  // Fine architectural gilt lines; no toy decorations.
  c.strokeStyle='rgba(226,183,108,.45)';c.lineWidth=2;
  c.strokeRect(55,53,1810,974);
  c.strokeStyle='rgba(226,183,108,.19)';c.strokeRect(74,71,1772,936);
  c.fillStyle='#e3bb7c';c.fillRect(149,307,143,2);
  this.type(c,151,490,760,{kicker:'AN EVENING IN GOLD',size:101,
   labelColor:'#e5bd86',titleColor:'#f7e6c7',secondColor:'#f3d5a2',
   ruleColor:'rgba(236,199,137,.58)',artistColor:'#f5e4cb',
   shadow:'rgba(250,198,107,.21)',shadowBlur:18});
 }
 drawStill(c){
  const scene=getScene(this.design.scene);
  if(scene.id==='midnight-gala')this.drawMidnight(c,scene);
  else if(scene.id==='rose-garden')this.drawRose(c,scene);
  else if(scene.id==='golden-ballroom')this.drawGolden(c,scene);
  else throw Error('No cinematic composition: '+scene.id);
  const v=c.createRadialGradient(985,515,310,985,510,1280);
  v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.36)');
  c.fillStyle=v;c.fillRect(0,0,W,H);
 }
 rebuild(){
  if(!this.design||this.photos.size<3)return;
  const plate=document.createElement('canvas');
  plate.width=this.canvas.width;plate.height=this.canvas.height;
  const c=plate.getContext('2d',{alpha:false});
  c.setTransform(plate.width/W,0,0,plate.height/H,0,0);
  this.drawStill(c);this.staticPlate=plate;
 }
 draw(phase=0){
  if(!this.staticPlate)return;
  this.phase=(phase%1+1)%1;
  const c=this.ctx;c.setTransform(1,0,0,1,0,0);
  c.drawImage(this.staticPlate,0,0);
  c.setTransform(this.canvas.width/W,0,0,this.canvas.height/H,0,0);
  const t=this.phase*TAU,scene=getScene(this.design.scene);
  c.save();
  const pulse=.06+.023*Math.sin(t+.3)+.011*Math.sin(2*t+1);
  const lx=scene.id==='rose-garden'?410:scene.id==='golden-ballroom'?1560:1390;
  const ly=scene.id==='rose-garden'?400:scene.id==='golden-ballroom'?340:390;
  const glow=c.createRadialGradient(lx,ly,25,lx,ly,460);
  if(scene.id==='rose-garden'){
   glow.addColorStop(0,'rgba(251,178,168,'+(pulse*.62)+')');
   glow.addColorStop(1,'rgba(255,193,190,0)');
  }else{
   glow.addColorStop(0,'rgba(255,207,139,'+pulse+')');
   glow.addColorStop(.50,'rgba(237,157,78,'+(pulse*.31)+')');
   glow.addColorStop(1,'rgba(255,140,64,0)');
  }
  c.fillStyle=glow;c.fillRect(lx-475,ly-475,950,950);
  const colors=scene.id==='rose-garden'?['#ffe6d5','#f6aab6','#fff1e0']:
    scene.id==='golden-ballroom'?['#ffe2aa','#eec588','#fff4d7']:
    ['#f5be80','#f4d49b','#ffd6bc'];
  for(let i=0;i<this.motion.length;i++){
   const d=this.motion[i],ph=t*d.speed+TAU*d.offset;
   const dx=d.x+Math.sin(ph)*d.sway,dy=d.y+Math.cos(ph+.8)*d.sway*.66;
   const alpha=d.opacity*(.55+.45*Math.sin(ph+.25)**2);
   const radius=d.rad*(.92+.08*Math.sin(ph*2));
   c.globalAlpha=alpha;
   if(scene.id==='rose-garden'&&d.depth===0){
    c.save();c.translate(dx,dy);c.rotate(d.angle+.12*Math.sin(ph));
    c.fillStyle=colors[i%3];c.beginPath();c.ellipse(0,0,radius*.76,radius*1.6,.12,0,TAU);c.fill();
    c.restore();continue;
   }
   const spark=c.createRadialGradient(dx,dy,0,dx,dy,radius*3.4);
   spark.addColorStop(0,colors[i%3]);
   spark.addColorStop(.21,colors[(i+1)%3]+'77');
   spark.addColorStop(1,'rgba(255,210,156,0)');
   c.fillStyle=spark;c.beginPath();c.arc(dx,dy,radius*3.4,0,TAU);c.fill();
  }
  c.restore();
  if(!noZoom)throw Error('Loop camera must stay fixed');
 }
 dispose(){this.resizer?.disconnect();this.staticPlate=null;this.photos.clear()}
}
