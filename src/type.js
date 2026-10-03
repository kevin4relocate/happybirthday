import * as THREE from 'three';
import {FontLoader} from 'three/addons/loaders/FontLoader.js';
import {TextGeometry} from 'three/addons/geometries/TextGeometry.js';
import {splitTitle} from './core.js';

/**
 * 3D text is mounted within the world: a narrow decorative garland above the cake
 * and a small physical artist plate on the pedestal. No full-frame text overlay.
 *
 * Three's small Helvetica sample font handles basic Latin; unsupported glyphs and
 * font-network outages use a CanvasTexture on a physical plane in the 3D world.
 */
const FONT_URL='https://cdn.jsdelivr.net/npm/three@0.180.0/examples/fonts/helvetiker_regular.typeface.json';
let fontPromise=null;
export function loadFont(){
 if(fontPromise)return fontPromise;
 fontPromise=(async()=>{
  const ctrl=new AbortController();
  const id=setTimeout(()=>ctrl.abort(),6500);
  try{
   const response=await fetch(FONT_URL,{signal:ctrl.signal});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const json=await response.json();
   return new FontLoader().parse(json);
  }catch(error){console.warn('3D Latin font unavailable; using scene-mounted lettering texture:',error.message);return null}
  finally{clearTimeout(id)}
 })();
 return fontPromise;
}
const rgb=v=>new THREE.Color(v);
const physical=(color,metalness=.65)=>new THREE.MeshPhysicalMaterial({color,metalness,roughness:.26,clearcoat:.65,clearcoatRoughness:.2,side:THREE.DoubleSide});
const mesh=(geometry,material)=>{const m=new THREE.Mesh(geometry,material);m.castShadow=true;m.receiveShadow=true;return m};
const cylinder=(radius,height,material)=>mesh(new THREE.CylinderGeometry(radius,radius,height,32),material);
const sphere=(r,material)=>mesh(new THREE.SphereGeometry(r,12,9),material);
function curveTube(points,rad,material){
 const curve=new THREE.CatmullRomCurve3(points);
 return mesh(new THREE.TubeGeometry(curve,44,rad,7,false),material);
}
export function addText(root,text,font,size,maxWidth,y,z,color,options={}){
 const needsFallback=!font||/[^\u0020-\u007e]/u.test(text);
 if(needsFallback)return canvasText(root,text,size,maxWidth,y,z,color,options);
 const geo=new TextGeometry(text,{font,size,depth:options.depth??.052,curveSegments:8,bevelEnabled:true,bevelThickness:options.bevel??.013,bevelSize:options.bevel??.012,bevelSegments:2});
 geo.computeBoundingBox();
 let width=geo.boundingBox.max.x-geo.boundingBox.min.x;
 let height=geo.boundingBox.max.y-geo.boundingBox.min.y;
 if(!Number.isFinite(width)||width===0){geo.dispose();return canvasText(root,text,size,maxWidth,y,z,color,options)}
 geo.translate(-width/2,-height/2,0);
 const material=physical(color,options.metalness??.58);
 if(options.roughness!==undefined)material.roughness=options.roughness;
 if(options.glow){material.emissive=new THREE.Color(color);material.emissiveIntensity=.19}
 // Separate the illuminated face and warmer extrusion side for depth.
 const edge=physical(new THREE.Color(color).multiplyScalar(.52),options.metalness??.58);
 edge.roughness=.38;edge.clearcoat=.3;
 const obj=mesh(geo,[material,edge]);
 obj.scale.setScalar(Math.min(1,maxWidth/width));
 obj.position.set(0,y,z);
 root.add(obj);return obj;
}
function canvasText(root,text,size,maxWidth,y,z,color,{bold=true}={}){
 const cv=document.createElement('canvas');cv.width=1536;cv.height=224;
 const c=cv.getContext('2d');
 c.clearRect(0,0,cv.width,cv.height);
 c.font=(bold?'800 ':'600 ')+'120px Georgia, "Times New Roman", serif';
 c.textAlign='center';c.textBaseline='middle';
 c.shadowColor='#312338';c.shadowBlur=8;c.shadowOffsetY=6;
 c.fillStyle=new THREE.Color(color).getStyle();
 c.fillText(text,cv.width/2,cv.height/2,cv.width*.92);
 const tex=new THREE.CanvasTexture(cv);tex.colorSpace=THREE.SRGBColorSpace;
 const geometry=new THREE.PlaneGeometry(maxWidth,Math.min(size*1.4,.9));
 const o=new THREE.Mesh(geometry,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
 o.position.set(0,y,z);root.add(o);return o;
}
function rope(root,points,material,thickness=.017){root.add(curveTube(points,thickness,material))}
function trim(root,design,theme){
 const gold=physical(theme.metal,.83),ribbon=physical(theme.accent,.2);
 const left=-3.56,right=3.56,by=1.93;
 if(design.arch==='star-garland'){
   rope(root,[new THREE.Vector3(left,2.68,-.48),new THREE.Vector3(-1.7,3.42,-.5),new THREE.Vector3(0,3.56,-.5),new THREE.Vector3(1.7,3.42,-.5),new THREE.Vector3(right,2.68,-.48)],gold,.022);
 }else if(design.arch==='ribbon'){
   rope(root,[new THREE.Vector3(left,2.85,-.5),new THREE.Vector3(-1.7,3.59,-.5),new THREE.Vector3(0,3.70,-.5),new THREE.Vector3(1.7,3.59,-.5),new THREE.Vector3(right,2.85,-.5)],ribbon,.07);
 }else{
   rope(root,[new THREE.Vector3(left,2.68,-.5),new THREE.Vector3(-1.7,3.5,-.5),new THREE.Vector3(0,3.63,-.5),new THREE.Vector3(1.7,3.5,-.5),new THREE.Vector3(right,2.68,-.5)],gold,design.arch==='beaded'?.04:.026);
 }
 for(let side of [-1,1]){
   const support=cylinder(.027,1.37,gold);
   support.position.set(side*3.56,2.0,-.5);root.add(support);
   const jewel=sphere(.09,gold);jewel.position.set(side*3.56,2.68,-.5);root.add(jewel);
 }
 if(design.arch==='beaded'||design.arch==='star-garland'){
  for(let i=0;i<24;i++){
    const u=i/23,x=(u-.5)*7.1,y=3.62-Math.pow(Math.abs(x)/3.5,1.4)*.85;
    const orb=sphere(i%3===0?.055:.03,i%3===0?ribbon:gold);orb.position.set(x,y,-.5);root.add(orb);
  }
 }
 const underline=curveTube([new THREE.Vector3(-2.85,by,-.2),new THREE.Vector3(0,by-.065,-.2),new THREE.Vector3(2.85,by,-.2)],.016,gold);root.add(underline);
}
function roundedPlate(width,height,radius,depth,material){
 const x=-width/2,y=-height/2;
 const shape=new THREE.Shape();
 shape.moveTo(x+radius,y);
 shape.lineTo(x+width-radius,y);
 shape.quadraticCurveTo(x+width,y,x+width,y+radius);
 shape.lineTo(x+width,y+height-radius);
 shape.quadraticCurveTo(x+width,y+height,x+width-radius,y+height);
 shape.lineTo(x+radius,y+height);
 shape.quadraticCurveTo(x,y+height,x,y+height-radius);
 shape.lineTo(x,y+radius);
 shape.quadraticCurveTo(x,y,x+radius,y);
 const panel=mesh(new THREE.ExtrudeGeometry(shape,{
  depth,steps:1,bevelEnabled:true,bevelSegments:2,
  bevelSize:.016,bevelThickness:.014,curveSegments:6
 }),material);
 return panel;
}
function artistBadge(root,design,theme,font){
 const gold=physical(theme.metal,.7);
 const satin=physical(new THREE.Color(theme.floor).lerp(new THREE.Color('#302032'),.4),.22);
 satin.roughness=.7;satin.sheen=.6;satin.sheenColor=new THREE.Color(theme.accent);
 const frame=roundedPlate(2.90,.51,.13,.065,gold);
 frame.position.set(0,-1.60,3.67);root.add(frame);
 const inset=roundedPlate(2.74,.385,.10,.06,satin);
 inset.position.set(0,-1.60,3.76);root.add(inset);
 const inner=roundedPlate(2.66,.30,.085,.011,physical(theme.metal,.75));
 inner.position.set(0,-1.60,3.816);inner.material.transparent=true;inner.material.opacity=.16;
 root.add(inner);
 addText(root,design.artist||'ARTIST',font,.203,2.30,-1.60,3.862,0xffefce,
   {depth:.017,bevel:.004,metalness:.46,roughness:.29});
 for(const x of [-1.28,1.28]){
  const screw=sphere(.032,gold);screw.position.set(x,-1.60,3.857);root.add(screw);
 }
}
export function createLettering(root,design,theme,font){
 const group=new THREE.Group();root.add(group);
 trim(group,design,theme);
 const colorMap={gold:theme.metal,ivory:0xfff4e5,rose:0xf5b9c5,silver:0xdce7f0,glass:0xc3ebed};
 const color=colorMap[design.textFinish]??0xfff4e5;
 const lines=splitTitle(design.title);
 const headline=lines[0]||'Happy Birthday';
 const second=lines[1]||'';
 const topWidth=6.95;
 addText(group,headline,font,.60,topWidth,2.88,.04,color,{depth:design.titleStyle==='engraved'?.022:.09,bevel:design.titleStyle==='sculpted'?.028:.012,metalness:design.textFinish==='gold'?.75:.42,roughness:design.titleStyle==='satin'?.6:.25,glow:design.titleStyle==='glowing'});
 if(second){
  addText(group,second,font,.35,6.58,2.23,.09,design.textFinish==='gold'?0xffead2:color,{depth:.045,bevel:.012,metalness:.43,glow:design.titleStyle==='glowing'});
 }
 artistBadge(group,design,theme,font);
 // Lettering has a small periodic breathing motion, precisely equal at t=0 and t=1.
 return t=>{
  const cycle=t*Math.PI*2;
  group.position.y=Math.sin(cycle)*.018;
  group.rotation.y=Math.sin(cycle)*.007;
 };
}
