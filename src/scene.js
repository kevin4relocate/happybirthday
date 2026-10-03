import * as THREE from 'three';
import {EffectComposer} from 'three/addons/postprocessing/EffectComposer.js';
import {RenderPass} from 'three/addons/postprocessing/RenderPass.js';
import {ShaderPass} from 'three/addons/postprocessing/ShaderPass.js';
import {OutputPass} from 'three/addons/postprocessing/OutputPass.js';
import {SCENES,EXPORT_WIDTH,EXPORT_HEIGHT,DURATION_SECONDS} from './core.js';
import {makeBackdrop,makeStage,makeCake,makeBalloons,makeGifts,makeSceneDecor} from './objects.js';
import {createLettering} from './type.js';
import {cinematicProfile,cameraPose,lightingPalette} from './cinematic-profile.js';
import {createAtmosphere} from './atmosphere.js';

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
  // Lighting/camera are static during a loop. Cache the costly shadow atlas
  // instead of rebuilding a 2048² map on every recorded frame.
  this.renderer.shadowMap.autoUpdate=false;
  this.camera=new THREE.PerspectiveCamera(38,16/9,.1,90);
  // Bloom is part of the rendered canvas, not a CSS preview effect.
  // Therefore WebCodecs records exactly the same post-processed scene.
  this.composer=new EffectComposer(this.renderer);
  this.renderPass=new RenderPass(new THREE.Scene(),this.camera);
  // Single screen-space highlight pass: four taps, not a multi-mip blur
  // that stalls software GPUs during 300-frame offline WebCodecs exports.
  const cinematicShader={
    uniforms:{
      tDiffuse:{value:null},
      pixelSize:{value:new THREE.Vector2(1/800,1/450)},
      glowStrength:{value:.13}
    },
    vertexShader:'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:String.raw`
      uniform sampler2D tDiffuse;
      uniform vec2 pixelSize;
      uniform float glowStrength;
      varying vec2 vUv;
      float luminance(vec3 c){return dot(c,vec3(.2126,.7152,.0722));}
      vec3 bright(vec2 uv){
        vec3 value=texture2D(tDiffuse,clamp(uv,vec2(0.0),vec2(1.0))).rgb;
        return value*max(0.0,luminance(value)-.88);
      }
      void main(){
        vec3 base=texture2D(tDiffuse,vUv).rgb;
        vec2 d=pixelSize*3.0;
        vec3 glow=(bright(vUv+vec2(d.x,0.0))+bright(vUv-vec2(d.x,0.0))
          +bright(vUv+vec2(0.0,d.y))+bright(vUv-vec2(0.0,d.y)))*.25;
        vec3 color=base+glow*glowStrength;
        vec2 q=(vUv-.5)*vec2(1.12,.92);
        float vignette=1.0-.17*dot(q,q);
        color*=vignette;
        gl_FragColor=vec4(color,1.0);
      }
    `
  };
  this.bloomPass=new ShaderPass(cinematicShader);
  this.outputPass=new OutputPass();
  this.composer.addPass(this.renderPass);
  this.composer.addPass(this.bloomPass);
  this.composer.addPass(this.outputPass);
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
  this.composer.setPixelRatio(this.previewScale);
  this.composer.setSize(w,h);
  this.bloomPass.uniforms.pixelSize.value.set(1/w,1/h);
  this.camera.aspect=16/9;this.camera.updateProjectionMatrix();
  this.draw(this.lastPhase??0);
 }
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
  makeStage(root,theme,design);
  const cakeUpdate=makeCake(root,design,theme);
  const balloonsUpdate=makeBalloons(root,design,theme);
  makeGifts(root,design,theme);
  const decorationsUpdate=makeSceneDecor(root,design,theme);
  const letteringUpdate=createLettering(root,design,theme,font);
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
  const callbacks=[cakeUpdate,balloonsUpdate,decorationsUpdate,letteringUpdate,atmosphereUpdate];
  this.scene=scene;this.world=root;this.design=design;
  this.renderPass.scene=scene;
  this.renderer.shadowMap.needsUpdate=true;
  this.bloomPass.uniforms.glowStrength.value=design.scene==='disco'?.17:design.scene==='moonlit'?.15:.12;
  this.update=t=>callbacks.forEach(fn=>fn(t));
  this.draw(0);
 }
 draw(phase=0){
  if(!this.scene)return;
  this.lastPhase=(phase%1+1)%1;
  this.update(this.lastPhase);
  this.composer.render();
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
    this.composer.setPixelRatio(1);
    this.composer.setSize(targetW,targetH);
    this.bloomPass.uniforms.pixelSize.value.set(1/targetW,1/targetH);
  }else{
    this.renderer.setPixelRatio(this.previewScale);
    const width=Math.max(250,Math.floor(this.viewport.clientWidth||800));
    const height=Math.max(140,Math.floor((this.viewport.clientWidth||800)*9/16));
    this.renderer.setSize(width,height,false);
    this.composer.setPixelRatio(this.previewScale);
    this.composer.setSize(width,height);
    this.bloomPass.uniforms.pixelSize.value.set(1/width,1/height);
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
  this.composer.dispose();
  this.renderer.dispose();
 }
}
