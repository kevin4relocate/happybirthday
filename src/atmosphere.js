import * as THREE from 'three';
import {randomGenerator} from './core.js';
import {cinematicProfile} from './cinematic-profile.js';

const TAU=Math.PI*2;
const spriteTexture=()=>{
 const canvas=document.createElement('canvas');
 canvas.width=128;canvas.height=128;
 const ctx=canvas.getContext('2d');
 const gradient=ctx.createRadialGradient(64,64,3,64,64,63);
 gradient.addColorStop(0,'rgba(255,255,255,1)');
 gradient.addColorStop(.14,'rgba(255,255,255,.66)');
 gradient.addColorStop(.40,'rgba(255,255,255,.19)');
 gradient.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=gradient;ctx.fillRect(0,0,128,128);
 const texture=new THREE.CanvasTexture(canvas);
 texture.colorSpace=THREE.SRGBColorSpace;
 return texture;
};
function glow(group,texture,x,y,z,size,color,opacity){
 const mat=new THREE.SpriteMaterial({
  map:texture,color,transparent:true,opacity,depthWrite:false,
  blending:THREE.AdditiveBlending
 });
 const sprite=new THREE.Sprite(mat);
 sprite.position.set(x,y,z);
 sprite.scale.set(size,size,1);
 group.add(sprite);
 return sprite;
}
function velvetCurtain(root,theme,side,richness){
 const segments=24;
 const geo=new THREE.PlaneGeometry(1.8,8.4,segments,24);
 const attr=geo.attributes.position;
 for(let i=0;i<attr.count;i++){
  const x=attr.getX(i),y=attr.getY(i);
  // Broad, physically-shaped vertical fabric folds (not a flat overlay).
  attr.setZ(i,Math.sin(x*5.8)*(.16+richness*.035)+Math.sin(x*10.3)*.047);
  attr.setX(i,x+(.16+Math.abs(y)*.024)*Math.cos(x*2.7)*.11);
 }
 geo.computeVertexNormals();
 const shade=new THREE.Color(theme.back).lerp(new THREE.Color(theme.accent),.22);
 const material=new THREE.MeshPhysicalMaterial({
  color:shade,roughness:.93,metalness:0,sheen:1,
  sheenColor:new THREE.Color(theme.accent),sheenRoughness:.9,
  side:THREE.DoubleSide,transparent:true,opacity:.67,depthWrite:false
 });
 const panel=new THREE.Mesh(geo,material);
 panel.position.set(side*6.40,1.15,-4.15);
 panel.rotation.y=side*.20;
 panel.receiveShadow=true;
 root.add(panel);
}
function hazeVeil(root,theme,profile,texture){
 const radiance=glow(root,texture,0,1.04,-5.17,10.3,
   profile.lightMood==='moon-silver'?'#a1a8e6':theme.palette[0],.24);
 radiance.scale.set(11.4,7.8,1);
 // A soft rear gold pool, behind (not across) the cake.
 const floorGlow=glow(root,texture,0,-.9,-2.85,8.7,theme.metal,.09);
 floorGlow.scale.set(7.5,2.2,1);
 if(profile.atmosphereMood==='prism'){
  glow(root,texture,-3.8,2.05,-4.7,3.5,'#ef81d8',.20);
  glow(root,texture,3.8,2.10,-4.7,3.7,'#8bbcf8',.22);
 }
 if(profile.atmosphereMood==='twilight'){
  glow(root,texture,3.10,2.85,-4.73,3.2,'#b1bce9',.17);
 }
}
function shafts(root,theme,profile){
 const coneMaterial=new THREE.MeshBasicMaterial({
  color:profile.atmosphereMood==='prism'?'#ba8fda':theme.palette[1],
  transparent:true,opacity:.007,depthWrite:false,side:THREE.DoubleSide,
  blending:THREE.AdditiveBlending
 });
 for(const side of [-1,1]){
  const cone=new THREE.Mesh(new THREE.ConeGeometry(1.48,7.0,32,1,true),coneMaterial);
  cone.position.set(side*3.2,1.0,-3.60);
  cone.rotation.z=side*.27;
  cone.renderOrder=0;
  root.add(cone);
 }
}
/**
 * Layered studio atmosphere: material curtains, rear light pools,
 * depth-distributed bokeh and near-camera dust. Every motion is periodic.
 * No animation uses wall time, randomness per frame, or a moving camera.
 */
export function createAtmosphere(root,design,theme){
 const profile=cinematicProfile(design);
 const rng=randomGenerator((design.seed^0x3a91dc45)>>>0);
 const group=new THREE.Group();
 root.add(group);
 const texture=spriteTexture();
 if(profile.atmosphereMood==='velvet'||profile.atmosphereMood==='storybook'){
  velvetCurtain(group,theme,-1,profile.accent);
  velvetCurtain(group,theme,1,profile.accent);
 }
 hazeVeil(group,theme,profile,texture);
 shafts(group,theme,profile);
 const animated=[];
 const palette=[theme.palette[0],theme.palette[1],theme.palette[2],theme.metal];
 const count=profile.atmosphereMood==='prism'?46:36;
 for(let i=0;i<count;i++){
  const far=i%4!==0;
  const x=(rng()-.5)*(far?12.2:9.0);
  const y=-1.3+rng()*6.6;
  const z=far?-5.04+rng()*.7:2.0+rng()*1.3;
  const size=far?.16+rng()*.30:.10+rng()*.15;
  const dot=glow(group,texture,x,y,z,size,palette[i%palette.length],far?.14+rng()*.18:.10+rng()*.09);
  animated.push({dot,x,y,z,baseOpacity:dot.material.opacity,offset:rng(),speed:1+i%2,range:far?.10:.06,size});
 }
 const glints=[];
 for(let i=0;i<11;i++){
  const angle=TAU*i/11,x=Math.sin(angle)*3.28,y=-.60+Math.cos(angle)*.93;
  const star=glow(group,texture,x,y,2.45,.17,theme.palette[i%3],.18);
  glints.push({star,offset:rng(),base:.18});
 }
 return phase=>{
  const t=TAU*phase;
  for(const a of animated){
   const shift=t*a.speed+TAU*a.offset;
   a.dot.position.set(a.x+Math.sin(shift)*a.range,
     a.y+Math.cos(shift)*a.range*.55,a.z);
   a.dot.material.opacity=a.baseOpacity*(.79+.21*Math.sin(shift)**2);
  }
  for(const g of glints){
   g.star.material.opacity=g.base*(.4+.6*Math.sin(t+TAU*g.offset)**2);
  }
 };
}
