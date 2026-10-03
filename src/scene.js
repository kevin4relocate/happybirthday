import * as THREE from 'three';
import {SCENES,EXPORT_WIDTH,EXPORT_HEIGHT,DURATION_SECONDS} from './core.js';
import {makeBackdrop,makeStage,makeCake,makeBalloons,makeGifts,makeSceneDecor} from './objects.js';
import {createLettering} from './type.js';
import {cinematicProfile,cameraPose,lightingPalette} from './cinematic-profile.js';
import {createAtmosphere} from './atmosphere.js';
import {makePremiumHero} from './premium-hero.js';

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
  this.renderer.shadowMap.autoUpdate=false; // Static studio rig: cache atlas during frame-by-frame export.
  this.camera=new THREE.PerspectiveCamera(38,16/9,.1,90);
  this.camera.position.set(0,1.00,11.25);
  this.camera.lookAt(0,.59,0);
  this.scene=null;
  this.world=null;
  this.update=()=>{};
  this.premiumModel=null;
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
 setPremiumModel(model){this.premiumModel=model}
 setup(design,font){
  const theme=SCENES.find(x=>x.id===design.scene);
  if(!theme)throw new Error('Scene preset not found');
  this.clearWorld();
  const profile=cinematicProfile(design);
  const pose=cameraPose(profile);
  const lighting=lightingPalette(profile,theme);
  this.camera.position.set(pose.x,pose.y,pose.z);
  this.camera.fov=pose.fov;
  this.camera.lookAt(0,pose.targetY,0);
  this.camera.updateProjectionMatrix();
  const scene=new THREE.Scene();
  scene.background=new THREE.Color(theme.back);
  scene.fog=new THREE.FogExp2(theme.back,.012);
  const root=new THREE.Group();scene.add(root);
  makeBackdrop(root,theme,design);
  const atmosphereUpdate=createAtmosphere(root,design,theme);
  const premium=design.scene==='atelier'&&this.premiumModel;
  let callbacks;
  if(premium){
    const heroUpdate=makePremiumHero(root,design,theme,font,this.premiumModel);
    callbacks=[heroUpdate,atmosphereUpdate];
    this.camera.position.set(.16,1.2,10.18);
    this.camera.fov=36;
    this.camera.lookAt(0,.71,0);
    this.camera.updateProjectionMatrix();
  }else{
    makeStage(root,theme,design);
    const cakeUpdate=makeCake(root,design,theme);
    const balloonsUpdate=makeBalloons(root,design,theme);
    makeGifts(root,design,theme);
    const decorationsUpdate=makeSceneDecor(root,design,theme);
    const letteringUpdate=createLettering(root,design,theme,font);
    callbacks=[cakeUpdate,balloonsUpdate,decorationsUpdate,letteringUpdate,atmosphereUpdate];
  }
  const ambient=new THREE.HemisphereLight(0xffe6d7,0x273145,lighting.ambient);scene.add(ambient);
  const key=new THREE.DirectionalLight(lighting.key,lighting.keyPower);
  key.position.set(-3.2+(design.lightVariation%3)*.24,6.8,5.2);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;
  key.shadow.camera.near=.1;key.shadow.camera.far=25;key.shadow.bias=-.00009;
  key.shadow.normalBias=.02;key.shadow.radius=4;
  scene.add(key);
  const rim=new THREE.DirectionalLight(lighting.rim,lighting.rimPower);
  rim.position.set(4.9-(design.lightVariation%4)*.18,4.8,-3.2);scene.add(rim);
  const soft=new THREE.PointLight(lighting.fill,lighting.fillPower*3.0,14,2);
  soft.position.set(2.9,1.9,5);scene.add(soft);
  // Motivated practical light sits close to the cake rather than washing the entire stage.
  const candleBounce=new THREE.PointLight(0xffc888,2.2,5.8,2);
  candleBounce.position.set(-.95,.82,1.6);scene.add(candleBounce);
  // A broad grazing highlight brings out icing and metallized ribbons.
  const silkRim=new THREE.DirectionalLight(theme.palette[1],1.35);
  silkRim.position.set(-4.5,1.9,-2.7);scene.add(silkRim);
  this.renderer.toneMappingExposure=lighting.exposure;
  this.renderer.shadowMap.needsUpdate=true;
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
