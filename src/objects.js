import * as THREE from 'three';
import {randomGenerator} from './core.js';

const PI=Math.PI;
const TAU=Math.PI*2;
const pale=new THREE.Color('#fff4e6');
const metal=(color,roughness=.25)=>new THREE.MeshPhysicalMaterial({color,metalness:.78,roughness,clearcoat:.45,clearcoatRoughness:.22});
const ceramic=(color,roughness=.32)=>new THREE.MeshPhysicalMaterial({color,metalness:.04,roughness,clearcoat:.26,clearcoatRoughness:.2});
const frosting=(color)=>new THREE.MeshPhysicalMaterial({color,metalness:0,roughness:.27,clearcoat:.2});
const glass=(color,opacity=.75)=>new THREE.MeshPhysicalMaterial({color,metalness:.12,roughness:.1,transparent:true,opacity,depthWrite:false,clearcoat:1});
const emissive=(color,intensity=1.6)=>new THREE.MeshBasicMaterial({color});
const mesh=(geometry,material,shadows=true)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=shadows;m.receiveShadow=true;return m};
const cylinder=(r1,r2,h,mat,segments=64)=>mesh(new THREE.CylinderGeometry(r1,r2,h,segments),mat);
const sphere=(radius,mat,sw=20,sh=14)=>mesh(new THREE.SphereGeometry(radius,sw,sh),mat);
const box=(x,y,z,mat)=>mesh(new THREE.BoxGeometry(x,y,z),mat);
function torus(radius,tube,mat){const m=mesh(new THREE.TorusGeometry(radius,tube,10,90),mat);m.rotation.x=PI/2;return m}
function tube(points,radius,material){const curve=new THREE.CatmullRomCurve3(points);return mesh(new THREE.TubeGeometry(curve,Math.max(20,points.length*9),radius,7,false),material)}
function pos(m,x,y,z){m.position.set(x,y,z);return m}
function angle(s,range,rng){return s+(rng()-.5)*range}
function ringBeads(parent,count,radius,y,material,scale=.072){
 for(let i=0;i<count;i++){
  const a=i/count*TAU,bead=sphere(scale,material,10,8);
  bead.scale.set(1.1,.7,1.1);
  pos(bead,Math.cos(a)*radius,y,Math.sin(a)*radius);
  parent.add(bead);
 }
}
function tinyStar(material,scale=.13){
 const shape=new THREE.Shape();const points=10;
 for(let i=0;i<points;i++){
  const r=i%2?.42:1,a=-PI/2+i*PI/5;
  if(i===0)shape.moveTo(r*Math.cos(a),r*Math.sin(a));
  else shape.lineTo(r*Math.cos(a),r*Math.sin(a));
 }shape.closePath();
 const star=mesh(new THREE.ExtrudeGeometry(shape,{depth:.075,bevelEnabled:true,bevelSegments:1,steps:1,bevelThickness:.014,bevelSize:.022,curveSegments:4}),material);
 star.scale.setScalar(scale);return star;
}
function icingTier(parent,radius,height,centerY,design,color,highlight,metalMat){
 const cakeMat=ceramic(color);
 const tier=cylinder(radius,radius*1.012,height,cakeMat,80);tier.position.y=centerY;parent.add(tier);
 const bottom=centerY-height/2,top=centerY+height/2;
 const cap=cylinder(radius*1.009,radius*1.009,.075,frosting(highlight),80);cap.position.y=top+.014;parent.add(cap);
 const topRing=torus(radius*.98,.048,frosting(highlight));topRing.position.y=top+.057;parent.add(topRing);
 const lower=torus(radius*.97,.03,metalMat);lower.position.y=bottom+.12;parent.add(lower);
 const mid=cylinder(radius*1.01,radius*1.01,.022,metalMat,80);mid.position.y=bottom+.02;parent.add(mid);
 if(design.cakeStyle==='ripple'){
   for(let j=0;j<22;j++){const a=j*TAU/22;
    const stripe=tube([new THREE.Vector3(Math.cos(a)*radius,bottom+.1,Math.sin(a)*radius),new THREE.Vector3(Math.cos(a+.035)*radius,centerY,Math.sin(a+.035)*radius),new THREE.Vector3(Math.cos(a+.08)*radius,top-.09,Math.sin(a+.08)*radius)],.018,frosting(highlight));
    parent.add(stripe);
   }
 }
 const count=radius>1.3?64:42;
 ringBeads(parent,count,radius*.99,top+.085,frosting(highlight),radius>1.3?.065:.048);
 if(design.finish==='gold-leaf'||design.decorations==='gold-flakes'){
  for(let i=0;i<36;i++){
   const a=i*TAU/36+design.accentVariant,yy=bottom+.18+((i*7)%13)/13*(height-.32);
   const dot=sphere(.023,metalMat,8,6);pos(dot,Math.cos(a)*(radius+.022),yy,Math.sin(a)*(radius+.022));parent.add(dot)
  }
 }
 return top+.10;
}
function bow(parent,color,scale=.4){
 const silk=new THREE.MeshPhysicalMaterial({color,metalness:.07,roughness:.47,side:THREE.DoubleSide});
 const left=tube([new THREE.Vector3(0,0,0),new THREE.Vector3(-scale*.88,scale*.74,0),new THREE.Vector3(-scale*1.04,-scale*.08,0),new THREE.Vector3(0,0,0)],scale*.08,silk);
 const right=tube([new THREE.Vector3(0,0,0),new THREE.Vector3(scale*.88,scale*.74,0),new THREE.Vector3(scale*1.04,-scale*.08,0),new THREE.Vector3(0,0,0)],scale*.08,silk);
 parent.add(left,right);parent.add(pos(sphere(scale*.17,silk,12,10),0,0,.06));
}
function makeGift(parent,design,x,z,size,rng,idx,theme){
 const height=size*(.72+rng()*.48);
 const group=new THREE.Group();pos(group,x,-1.74+height/2,z);
 const giftColor=new THREE.Color(theme.palette[(idx+design.accentVariant)%theme.palette.length]);
 const wrap=ceramic(giftColor),ribbon=metal(theme.metal,.38);
 const pkg=box(size,height,size,wrap);pkg.rotation.y=rng()*.15;group.add(pkg);
 const strap1=box(size*.14,height+.018,size+.015,ribbon),strap2=box(size+.015,height+.018,size*.14,ribbon);
 group.add(strap1,strap2);
 const lid=box(size*1.1,size*.13,size*1.1,wrap);pos(lid,0,height*.53,0);group.add(lid);
 const b=new THREE.Group();pos(b,0,height*.64,size*.1);bow(b,theme.accent,size*.27);group.add(b);
 parent.add(group);return group;
}
function createCandles(parent,design,y,rng,theme){
 const lights=[];const pieces=[];const n=design.candleCount;
 const warm=new THREE.Color('#ffd284'),baseColor=new THREE.Color(theme.metal);
 for(let i=0;i<n;i++){
  const a=TAU*i/n,rr=n>5?.42:.33,x=Math.cos(a)*rr,z=Math.sin(a)*rr;
  const candle=cylinder(.043,.046,.38,ceramic(theme.palette[(i+design.candlePalette)%3]),14);pos(candle,x,y+.18,z);parent.add(candle);
  const spiral=torus(.0435,.007,metal(theme.palette[(i+1)%3]));spiral.rotation.x=0;spiral.position.set(x,y+.19,z);spiral.scale.z=2;parent.add(spiral);
  const wick=cylinder(.009,.01,.045,ceramic('#4e3432'),10);pos(wick,x,y+.395,z);parent.add(wick);
  const flame=sphere(.075,new THREE.MeshBasicMaterial({color:0xffcb73,transparent:true,opacity:.87}),16,12);
  flame.scale.set(.55,1.6,.52);pos(flame,x,y+.495,z);parent.add(flame);
  const center=sphere(.04,new THREE.MeshBasicMaterial({color:0xfff4bd,transparent:true,opacity:.88}),12,8);
  center.scale.set(.45,1.4,.48);pos(center,x,y+.48,z+.016);parent.add(center);
  pieces.push({flame,center,idx:i,baseY:y+.495});
  if(i<3){
    const light=new THREE.PointLight(warm,1.3,4.2,2);light.position.set(x,y+.5,z);parent.add(light);lights.push(light);
  }
 }
 return t=>{
  pieces.forEach(({flame,center,idx,baseY})=>{
    const v=Math.sin(TAU*(t+idx*.137)),v2=Math.sin(TAU*(t*2+idx*.218));
    flame.scale.y=1.48+v*.18+v2*.05;flame.scale.x=.55+v2*.06;
    flame.rotation.z=v*.12;
    center.scale.y=1.42+v*.12;
    flame.position.y=baseY+v*.02;center.position.y=baseY-.015+v*.02;
  });
  lights.forEach((light,i)=>{light.intensity=1.25+.24*Math.sin(TAU*(t+i*.143))});
 };
}
export function makeCake(root,design,theme){
 const rng=randomGenerator(design.seed^0x124845);
 const stand=new THREE.Group();
 const gold=metal(theme.metal,.3),base=metal(theme.floor,.42);
 const plate=cylinder(2.45,2.58,.23,gold,88);plate.position.y=-1.5;stand.add(plate);
 const foot=cylinder(1.52,1.72,.28,base,64);foot.position.y=-1.75;stand.add(foot);
 const rim=torus(2.48,.042,gold);rim.position.y=-1.37;stand.add(rim);
 const inset=torus(1.59,.024,gold);inset.position.y=-1.86;stand.add(inset);
 const cakeRoot=new THREE.Group();cakeRoot.scale.setScalar(design.cakeScale);
 const tiers=design.cakeStyle==='three-tier'?3:design.cakeStyle==='mini'?2:2;
 let top=-.32;
 const cakeColor=new THREE.Color(theme.cake);
 const variations=[1,.9,1.07,.94,1.03,.88],v=variations[design.accentVariant%6];
 cakeColor.multiplyScalar(v);
 const highlight=new THREE.Color(theme.icing),cakeMetal=metal(theme.metal,.23);
 top=icingTier(cakeRoot,1.87,.69,-.88,design,cakeColor,highlight,cakeMetal);
 top=icingTier(cakeRoot,tiers===3?1.30:1.32,.67,-.19,design,cakeColor.clone().multiplyScalar(.96),highlight,cakeMetal);
 if(tiers===3)top=icingTier(cakeRoot,.86,.48,.39,design,cakeColor.clone().multiplyScalar(1.05),highlight,cakeMetal);
 if(design.cakeStyle==='sundae'){
   const scoop=sphere(.42,frosting(theme.icing));pos(scoop,0,top+.05,0);scoop.scale.y=.8;cakeRoot.add(scoop);top+=.3;
 }
 const fruitsMaterial=ceramic(theme.accent),pearl=metal(theme.metal,.26);
 const toppings=design.decorations;
 for(let i=0;i<24;i++){
   const a=i*TAU/24+design.accentVariant,rad=tiers===3?.71:1.14;
   const x=Math.cos(a)*rad,z=Math.sin(a)*rad,y=top+.035;
   if(toppings==='strawberries'||toppings==='pearls'){
     const fruit=sphere(toppings==='strawberries'?.092:.061,toppings==='strawberries'?fruitsMaterial:pearl,12,10);
     fruit.scale.set(.9,.83,.9);pos(fruit,x,y,z);cakeRoot.add(fruit);
   }else if(toppings==='flowers'){
     for(let j=0;j<5;j++){
       const ang=j*TAU/5,petal=sphere(.06,frosting(theme.palette[(i+j)%3]),10,8);
       petal.scale.set(1,.28,.65);pos(petal,x+Math.cos(ang)*.06,y+.018,z+Math.sin(ang)*.06);cakeRoot.add(petal);
     }
     cakeRoot.add(pos(sphere(.027,pearl,8,6),x,y+.03,z));
   }else if(toppings==='sugar-stars'){
     const star=tinyStar(pearl,.1);pos(star,x,y,z);star.rotation.x=-PI/2;cakeRoot.add(star);
   }else{
     for(let j=0;j<3;j++){const spr=box(.045,.018,.016,ceramic(theme.palette[(i+j)%3]));
        pos(spr,x+(rng()-.5)*.13,y,z+(rng()-.5)*.13);spr.rotation.y=rng()*TAU;cakeRoot.add(spr)}
   }
 }
 const animateFlames=createCandles(cakeRoot,design,top,rng,theme);
 stand.add(cakeRoot);root.add(stand);
 return t=>{animateFlames(t)};
}
export function makeBalloons(root,design,theme){
 const rng=randomGenerator(design.seed^0xa19324),objects=[],metals=theme.palette.map(c=>design.balloonFinish==='metallic'?metal(c,.15):design.balloonFinish==='transparent'?glass(c,.6):ceramic(c,.28));
 const baseOffsets=[-3.65,3.65,-4.0,4.0,-3.35,3.35,-4.25,4.25,-3.85,3.85,-4.5];
 for(let i=0;i<design.balloonCount;i++){
  const x=baseOffsets[i]+(rng()-.5)*.36,y=.20+(i%4)*.53+rng()*.21,z=-.4-rng()*1.5;
  const balloon=new THREE.Group();balloon.position.set(x,y,z);
  const material=metals[(i+design.accentVariant)%metals.length];
  const body=sphere(.43,material,28,18);body.scale.set(.8,1.07,.75);balloon.add(body);
  const knot=new THREE.Mesh(new THREE.ConeGeometry(.064,.11,10),material);pos(knot,0,-.52,0);knot.rotation.z=PI;balloon.add(knot);
  const rope=tube([new THREE.Vector3(0,-.52,0),new THREE.Vector3(.12,-.8,0),new THREE.Vector3(-.07,-1.1,.04),new THREE.Vector3(0,-1.43,.06)],.007,ceramic('#d5c5b8'));
  balloon.add(rope);
  if(design.balloonFinish==='metallic'||design.balloonFinish==='pearl'){
    const highlight=sphere(.11,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.26}),12,10);
    highlight.scale.set(.6,1.4,.27);pos(highlight,-.15,.1,.26);balloon.add(highlight);
  }
  root.add(balloon);objects.push({balloon,seed:i+1,originalX:x,originalY:y});
 }
 return t=>objects.forEach(({balloon,seed,originalX,originalY})=>{
   const a=TAU*(t+seed*.181),b=TAU*(t*2+seed*.27);
   balloon.position.set(originalX+Math.sin(a)*.09,originalY+Math.sin(a)*.1,-.4-(seed%5)*.28);
   balloon.rotation.z=Math.sin(a)*.08;balloon.rotation.y=Math.sin(b)*.12;
 });
}
export function makeGifts(root,design,theme){
 const rng=randomGenerator(design.seed^0x998457);
 for(let i=0;i<design.giftCount;i++){
  const x=i%2===0?-2.75-(i>>1)*.24:2.75+(i>>1)*.28;
  makeGift(root,design,x,1.02+rng()*.8,.48+rng()*.35,rng,i,theme)
 }
}
export function makeParticleGarden(root,design,theme){
 const rng=randomGenerator(design.seed^0x72ab90),parts=[];
 const colors=[theme.metal,theme.accent,...theme.palette];
 const geom=new THREE.IcosahedronGeometry(.03,0);
 for(let i=0;i<80;i++){
  const mat=new THREE.MeshBasicMaterial({color:colors[i%colors.length],transparent:true,opacity:.5+rng()*.4});
  const p=new THREE.Mesh(geom,mat);const x=(rng()-.5)*10,y=-1.25+rng()*5.6,z=-1.7-rng()*2.5;
  p.position.set(x,y,z);root.add(p);parts.push({p,x,y,z,speed:i%3+1,offset:rng()});
 }
 return t=>parts.forEach(({p,x,y,z,speed,offset})=>{
   const ph=TAU*(t*speed+offset);
   p.position.set(x+Math.sin(ph)*.08,y+Math.sin(ph)*.18,z+Math.cos(ph)*.05);
   p.scale.setScalar(.8+.45*Math.sin(ph)**2);
   p.material.opacity=.25+.55*Math.sin(ph+.2)**2;
 });
}
export function makeFlowers(root,design,theme){
 const rng=randomGenerator(design.seed^0xff3870);
 const leaf=ceramic('#567966'),petalMaterials=theme.palette.map(c=>frosting(c)),core=metal('#f2cc80',.37);
 const plants=[];
 for(let side of [-1,1])for(let j=0;j<7;j++){
   const group=new THREE.Group();pos(group,side*(2.6+j*.19),-1.62,-.7+(j%3)*.24);
   group.rotation.y=rng()*TAU;
   const height=.6+rng()*.9;
   const stem=tube([new THREE.Vector3(0,0,0),new THREE.Vector3(.06,height*.43,0),new THREE.Vector3(-.06,height,0)],.016,leaf);
   group.add(stem);
   for(let k=0;k<5;k++){
     const a=k*TAU/5,petal=sphere(.14,petalMaterials[(j+k)%3],14,9);
     petal.scale.set(.65,.23,1.35);
     petal.position.set(Math.cos(a)*.13,height,Math.sin(a)*.13);
     petal.rotation.y=a;group.add(petal);
   }
   group.add(pos(sphere(.075,core,14,10),0,height,.035));
   root.add(group);plants.push({group,j,side});
 }
 return t=>plants.forEach(({group,j,side})=>{group.rotation.z=Math.sin(TAU*(t+j*.079))*.035*side});
}
export function makeMoon(root,theme){
 const mat=new THREE.MeshBasicMaterial({color:0xffefbf});
 const disk=sphere(.59,mat,36,24);pos(disk,2.66,2.45,-3.7);root.add(disk);
 const cut=sphere(.54,new THREE.MeshBasicMaterial({color:theme.back}));pos(cut,2.91,2.62,-3.51);root.add(cut);
 const ring=torus(.75,.014,metal(theme.metal));ring.position.set(2.66,2.45,-3.76);ring.rotation.x=0;root.add(ring);
 for(let i=0;i<18;i++){
   const s=tinyStar(metal(theme.palette[i%3],.37),.1+Math.random()*.03);
   s.position.set(-4.2+(i%9)*1.1,1.2+Math.floor(i/9)*1.7,-3.3);
   root.add(s);
 }
}
export function makeDisco(root,design,theme){
 const lights=[];const mat=metal('#d3a5f0',.12),glow=emissive('#ea9ff6');
 const discoBall=sphere(.42,mat,32,24);pos(discoBall,0,3.65,-1.8);root.add(discoBall);
 root.add(pos(cylinder(.014,.014,1.3,metal(theme.metal)),0,4.42,-1.8));
 for(let i=0;i<80;i++){
  const a=i/80*TAU,part=box(.09,.09,.02,i%3?mat:glow);
  part.position.set(Math.cos(a)*.415,3.65+Math.sin(a)*.32,-1.45);
  part.rotation.z=a;root.add(part);
 }
 for(let i=0;i<5;i++){
  const l=new THREE.SpotLight(theme.palette[i%3],13,12,PI/7,.8,.9);
  l.position.set((i-2)*1.7,3.5,-3.5);l.target.position.set((i-2)*.7,-1.6,1.5);
  root.add(l,l.target);lights.push(l);
 }
 return t=>{discoBall.rotation.y=t*TAU;lights.forEach((l,i)=>l.target.position.x=(i-2)*.7+Math.sin(TAU*(t+i*.18))*.5)};
}
export function makeMusicBox(root,design,theme){
 const ring=new THREE.Group();ring.position.y=-1.25;
 const brass=metal(theme.metal,.26),wood=ceramic('#9d694e');
 const track=torus(3.02,.06,brass);track.position.y=-.39;ring.add(track);
 const top=cylinder(3.15,3.24,.15,wood,88);top.position.y=-.53;ring.add(top);
 for(let i=0;i<12;i++){
   const a=i*TAU/12,knob=sphere(.075,brass,12,8);
   pos(knob,Math.cos(a)*3.04,-.48,Math.sin(a)*3.04);ring.add(knob);
 }
 root.add(ring);
 return t=>{ring.rotation.y=t*TAU};
}
export function makeSceneDecor(root,design,theme){
 const updates=[makeParticleGarden(root,design,theme)];
 if(design.scene==='garden')updates.push(makeFlowers(root,design,theme));
 if(design.scene==='moonlit')makeMoon(root,theme);
 if(design.scene==='disco')updates.push(makeDisco(root,design,theme));
 if(design.scene==='musicbox')updates.push(makeMusicBox(root,design,theme));
 return t=>updates.forEach(fn=>fn(t));
}
export function makeStage(root,theme,design){
 const main=ceramic(theme.floor,.6),m=metal(theme.metal,.33);
 const floor=mesh(new THREE.PlaneGeometry(100,100),main,false);floor.rotation.x=-PI/2;floor.position.y=-1.96;floor.receiveShadow=true;root.add(floor);
 const ring=cylinder(3.65,3.9,.18,m,100);ring.position.y=-1.79;root.add(ring);
 const trim=torus(3.69,.055,m);trim.position.y=-1.66;root.add(trim);
 const disk=cylinder(3.45,3.57,.16,ceramic(theme.floor,.5),96);disk.position.y=-1.63;root.add(disk);
 for(let i=0;i<54;i++){
  const a=i*TAU/54,gem=sphere(.038,metal(theme.palette[i%3],.2),10,6);
  pos(gem,Math.cos(a)*3.60,-1.55,Math.sin(a)*3.60);root.add(gem);
 }
}
export function makeBackdrop(root,theme,design){
 const rng=randomGenerator(design.seed^0x17ab1);
 const bg=document.createElement('canvas');bg.width=1024;bg.height=640;
 const c=bg.getContext('2d'),gradient=c.createRadialGradient(512,220,40,512,320,690);
 gradient.addColorStop(0,new THREE.Color(theme.back).lerp(new THREE.Color('#b09bb2'),.19).getStyle());
 gradient.addColorStop(.52,new THREE.Color(theme.back).getStyle());
 gradient.addColorStop(1,'#0a0a14');
 c.fillStyle=gradient;c.fillRect(0,0,1024,640);
 for(let i=0;i<135;i++){
   const x=rng()*1024,y=rng()*640,rad=.5+rng()*1.7;
   c.fillStyle='rgba(255,238,208,'+(.06+rng()*.20)+')';c.beginPath();c.arc(x,y,rad,0,TAU);c.fill();
 }
 const texture=new THREE.CanvasTexture(bg);texture.colorSpace=THREE.SRGBColorSpace;
 const backdrop=mesh(new THREE.PlaneGeometry(21,12),new THREE.MeshBasicMaterial({map:texture,depthWrite:false}),false);backdrop.position.set(0,1,-5.7);root.add(backdrop);
 const archMetal=metal(theme.metal,.3);
 for(let side of [-1,1]){
   const pillar=cylinder(.1,.14,6.5,archMetal,24);
   pos(pillar,side*4.4,1,-3.6);root.add(pillar);
   const top=sphere(.22,archMetal);pos(top,side*4.4,4.32,-3.6);root.add(top);
   for(let i=0;i<4;i++){
     const gem=sphere(.19,ceramic(theme.palette[i%3]));gem.scale.set(.5,1,.5);
     pos(gem,side*4.4,-1.7+i*1.7,-3.4);root.add(gem);
   }
 }
 const archPoints=[];for(let i=0;i<=24;i++){
   const a=Math.PI-i/24*Math.PI;
   archPoints.push(new THREE.Vector3(Math.cos(a)*4.42,2.65+Math.sin(a)*1.24,-3.5));
 }
 root.add(tube(archPoints,.057,archMetal));
}
