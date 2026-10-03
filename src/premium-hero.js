import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {addText} from './type.js';
import {randomGenerator} from './core.js';

const URL_MODEL='./assets/models/strawberry-chocolate-cake-1k.glb';
let sourcePromise=null;
const goldMat=()=>new THREE.MeshPhysicalMaterial({color:0xb78b51,metalness:.78,roughness:.29,clearcoat:.24});
const ceramic=(color,roughness=.58)=>new THREE.MeshPhysicalMaterial({color,roughness,metalness:.06,clearcoat:.22});
function sphere(r,material){const o=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),material);o.castShadow=true;return o}
export function loadPremiumCake(){
 if(sourcePromise)return sourcePromise;
 sourcePromise=new GLTFLoader().loadAsync(URL_MODEL).then(result=>{
   if(!result?.scene)throw new Error('Premium model contains no scene');
   result.scene.updateMatrixWorld(true);
   const bounds=new THREE.Box3().setFromObject(result.scene);
   const size=bounds.getSize(new THREE.Vector3());
   if(!Number.isFinite(size.x)||size.x<=0||size.z<=0)throw new Error('Premium GLB has invalid bounds');
   return {scene:result.scene,bounds,size};
 }).catch(error=>{sourcePromise=null;throw error});
 return sourcePromise;
}
function cloneModel(source){
 const clone=source.clone(true);
 // Other previews dispose scene resources after every Generate. All geometries,
 // materials and maps must be owned by the new instance, not by the cached GLB.
 clone.traverse(child=>{
  if(!child.isMesh)return;
  child.geometry=child.geometry.clone();
  const customize=old=>{
   const mat=old.clone();
   for(const key of Object.keys(mat)){
    const value=mat[key];
    if(value?.isTexture){mat[key]=value.clone();mat[key].needsUpdate=true}
   }
   return mat;
  };
  child.material=Array.isArray(child.material)?child.material.map(customize):customize(child.material);
  child.castShadow=true;child.receiveShadow=true;
 });
 return clone;
}
function candleLights(root,cakeTop,design){
 const rng=randomGenerator(design.seed^0x927a),updates=[];
 const warm=new THREE.Color('#fbc57c');
 const count=design.candleCount>5?5:design.candleCount;
 const candleBody=[0xf6e4c0,0xddad9c,0xa6b7a3,0xb3a4be,0xe0cc81];
 const guide=design.cakeScale;
 for(let i=0;i<count;i++){
  const a=(i-(count-1)/2)*.47;
  const candle=new THREE.Group();
  const body=new THREE.Mesh(new THREE.CylinderGeometry(.038,.039,.43,14),ceramic(candleBody[(i+design.accentVariant)%5],.36));
  body.position.y=.215;body.castShadow=true;candle.add(body);
  const wick=new THREE.Mesh(new THREE.CylinderGeometry(.008,.008,.055,8),ceramic(0x40342a,.88));
  wick.position.y=.455;candle.add(wick);
  const flame=sphere(.063,new THREE.MeshBasicMaterial({color:0xffcf7f,transparent:true,opacity:.94}));
  flame.scale.set(.58,1.5,.51);flame.position.y=.538;candle.add(flame);
  const heart=sphere(.031,new THREE.MeshBasicMaterial({color:0xfff3d1,transparent:true,opacity:.85}));
  heart.scale.set(.6,1.52,.53);heart.position.y=.529;candle.add(heart);
  candle.position.set(a,cakeTop-.09,-.02+.13*Math.sin(i*2.1));
  root.add(candle);
  const light=new THREE.PointLight(warm,.55,3.4,2);
  light.position.set(a,cakeTop+.53,-.04);root.add(light);
  updates.push({flame,heart,light,index:i+1,offset:rng()});
 }
 return t=>{
  for(const x of updates){
   const ph=2*Math.PI*(t+x.offset);
   x.flame.scale.y=1.51+.17*Math.sin(ph)+.06*Math.sin(2*ph);
   x.heart.scale.y=1.4+.11*Math.sin(ph);
   x.flame.position.y=.538+.012*Math.sin(ph);
   x.heart.position.y=.529+.012*Math.sin(ph);
   x.light.intensity=.47+.15*(1+Math.sin(ph))/2;
  }
 };
}
function premiumType(root,design,font,theme){
 const foil=goldMat();
 const shade=ceramic(0x271c25,.72);
 // A real narrow walnut/bronze signage behind the headline:
 // it occupies the set, casting reflections but never covers the hero cake.
 const bar=new THREE.Mesh(new THREE.BoxGeometry(7.3,.026,.085),foil);
 bar.position.set(0,2.02,-1.48);root.add(bar);
 const bar2=new THREE.Mesh(new THREE.BoxGeometry(6.3,.015,.07),foil);
 bar2.position.set(0,3.42,-1.48);root.add(bar2);
 const [first,second]=design.lines;
 addText(root,first,font,.54,6.6,2.83,-1.29,0xf5deac,{depth:.085,bevel:.016,metalness:.65,roughness:.35});
 if(second)addText(root,second,font,.32,6.1,2.26,-1.26,0xffeee2,{depth:.045,bevel:.009,metalness:.33,roughness:.44});
 // Low hero-name tag attached to the front edge of the cake presentation plinth.
 const plate=new THREE.Mesh(new THREE.BoxGeometry(2.75,.41,.13),foil);
 plate.position.set(0,-1.60,2.94);root.add(plate);
 const inset=new THREE.Mesh(new THREE.BoxGeometry(2.63,.29,.135),shade);
 inset.position.set(0,-1.60,3.01);root.add(inset);
 addText(root,design.artist,font,.19,2.28,-1.60,3.09,0xffe0a5,
  {depth:.02,bevel:.003,metalness:.5,roughness:.36});
}
function premiumStage(root,theme){
 const stone=ceramic(0x25212b,.44);
 stone.clearcoat=.18;stone.metalness=.13;
 const metal=goldMat();
 const plinth=new THREE.Mesh(new THREE.CylinderGeometry(2.55,2.69,.25,96),stone);
 plinth.position.y=-1.63;plinth.castShadow=true;plinth.receiveShadow=true;root.add(plinth);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(2.57,.035,12,100),metal);
 ring.rotation.x=Math.PI/2;ring.position.y=-1.49;root.add(ring);
 const podium=new THREE.Mesh(new THREE.CylinderGeometry(2.0,2.0,.08,96),metal);
 podium.position.y=-1.445;podium.receiveShadow=true;root.add(podium);
 const contact=new THREE.Mesh(new THREE.CylinderGeometry(1.94,1.95,.045,96),stone);
 contact.position.y=-1.39;contact.receiveShadow=true;root.add(contact);
}
export function makePremiumHero(root,design,theme,font,premium){
 if(!premium?.scene)throw new Error('Premium model is not loaded');
 premiumStage(root,theme);
 const model=cloneModel(premium.scene);
 // Imported source measurements are 0.2m wide; normalize to studio units.
 const width=Math.max(premium.size.x,premium.size.z);
 const targetWidth=3.82*(.95+(design.accentVariant%3)*.035);
 model.scale.setScalar(targetWidth/width);
 model.updateMatrixWorld(true);
 const scaledBounds=new THREE.Box3().setFromObject(model);
 const center=scaledBounds.getCenter(new THREE.Vector3());
 model.position.set(-center.x,-1.37-scaledBounds.min.y,-center.z);
 model.rotation.y=((design.seed%5)-2)*.035;
 root.add(model);
 model.updateMatrixWorld(true);
 const bounds=new THREE.Box3().setFromObject(model);
 const top=bounds.max.y;
 const candlesUpdate=candleLights(root,top,design);
 premiumType(root,design,font,theme);
 return t=>candlesUpdate(t);
}
