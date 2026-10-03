import * as THREE from 'three';
import {SCENES,EXPORT_WIDTH,EXPORT_HEIGHT,DURATION_SECONDS} from './core.js';
import {makeBackdrop,makeStage,makeCake,makeBalloons,makeGifts,makeSceneDecor} from './objects.js';
import {createLettering} from './type.js';

export class BirthdayScene {
 constructor(canvas,viewport){
  this.canvas=canvas;
  this.viewport=viewport;
  this.renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance',preserveDrawingBuffer:true});
  this.renderer.outputColorSpace=THREE.SRGBColorSpace;
  this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
  this.renderer.toneMappingExposure=1.25;
  this.renderer.shadowMap.enabled=true;
  this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  this.camera=new THREE.PerspectiveCamera(38,16/9,.1,90);
  this.camera.position.set(0,1.00,11.25);
  this.camera.lookAt(0,.59,0);
  this.scene=null;
  this.world=null;
  this.update=()=>{};
  this.previewScale=Math.min(1.7,Math.max(1,window.devicePixelRatio||1));
  this.resizeObserver=typeof ResizeObserver==='function'?new ResizeObserver(()=>this.resize()):null;
  this.resizeObserver?.observe(this.viewport);
  this.resize();
 }
 resize(){
  if(this.exporting)return;
  const w=Math.max(250,Math.floor(this.viewport.clientWidth||800));
  const h=Math.max(140,Math.floor(w*9/16));
  this.renderer.setPixelRatio(this.previewScale);
  this.renderer.setSize(w,h,false);
  this.camera.aspect=16/9;this.camera.updateProjectionMatrix();
  this.draw(this.lastPhase??0);
 }
 setup(design,font){
  const theme=SCENES.find(x=>x.id===design.scene);
  if(!theme)throw new Error('Scene preset not found');
  this.clearWorld();
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(theme.back);
  scene.fog=new THREE.FogExp2(theme.back,.012);
  const root=new THREE.Group();scene.add(root);
  makeBackdrop(root,theme,design);
  makeStage(root,theme,design);
  const cakeUpdate=makeCake(root,design,theme);
  const balloonsUpdate=makeBalloons(root,design,theme);
  makeGifts(root,design,theme);
  const decorationsUpdate=makeSceneDecor(root,design,theme);
  const letteringUpdate=createLettering(root,design,theme,font);
  const ambient=new THREE.HemisphereLight(0xffe9d1,0x455075,1.65);scene.add(ambient);
  const key=new THREE.DirectionalLight(0xffe9cb,4.2);
  key.position.set(-3+(design.lightVariation%3)*.45,7,6);key.intensity=3.75+design.lightVariation*.12;key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
  key.shadow.camera.near=.1;key.shadow.camera.far=25;key.shadow.bias=-.00009;
  key.shadow.normalBias=.02;key.shadow.radius=4;
  scene.add(key);
  const rim=new THREE.DirectionalLight(theme.palette[1],3);
  rim.position.set(5-(design.lightVariation%4)*.22,5,-4);scene.add(rim);
  const soft=new THREE.PointLight(theme.palette[2],11,14,2);
  soft.position.set(2.2,2.0,5);scene.add(soft);
  if(design.scene==='disco'){
    this.renderer.toneMappingExposure=1.04;
  }else if(design.scene==='moonlit'){
    this.renderer.toneMappingExposure=1.13;
  }else{
    this.renderer.toneMappingExposure=1.25;
  }
  const callbacks=[cakeUpdate,balloonsUpdate,decorationsUpdate,letteringUpdate];
  this.scene=scene;this.world=root;this.design=design;
  this.update=t=>callbacks.forEach(fn=>fn(t));
  this.draw(0);
 }
 draw(phase=0){
  if(!this.scene)return;
  this.lastPhase=(phase%1+1)%1;
  this.update(this.lastPhase);
  this.renderer.render(this.scene,this.camera);
 }
 setExportMode(enabled,options={}){
  this.exporting=enabled;
  if(enabled){
    const gl=this.renderer.getContext();
    const max=gl.getParameter(gl.MAX_RENDERBUFFER_SIZE);
    const targetW=options.width||EXPORT_WIDTH,targetH=options.height||EXPORT_HEIGHT;
    if(max<targetW||max<targetH)throw new Error('This device cannot render '+targetW+' × '+targetH+'. Try desktop Chrome or Edge.');
    this.renderer.setPixelRatio(1);
    this.renderer.setSize(targetW,targetH,false);
  }else{
    this.renderer.setPixelRatio(this.previewScale);
    this.renderer.setSize(Math.max(250,Math.floor(this.viewport.clientWidth||800)),
      Math.max(140,Math.floor((this.viewport.clientWidth||800)*9/16)),false);
  }
  this.camera.aspect=enabled?(options.width||EXPORT_WIDTH)/(options.height||EXPORT_HEIGHT):16/9;this.camera.updateProjectionMatrix();
  this.draw(0);
 }
 clearWorld(){
  if(!this.scene)return;
  const allGeometries=new Set(),allMaterials=new Set(),allTextures=new Set();
  this.scene.traverse(obj=>{
   if(obj.geometry)allGeometries.add(obj.geometry);
   if(obj.material)for(const mat of Array.isArray(obj.material)?obj.material:[obj.material]){
     allMaterials.add(mat);
     for(const v of Object.values(mat))if(v?.isTexture)allTextures.add(v);
   }
  });
  for(const g of allGeometries)g.dispose();
  for(const t of allTextures)t.dispose();
  for(const m of allMaterials)m.dispose();
  this.scene=null;this.world=null;
 }
 dispose(){
  this.resizeObserver?.disconnect();
  this.clearWorld();
  this.renderer.dispose();
 }
}
