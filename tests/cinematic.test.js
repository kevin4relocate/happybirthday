import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,chooseDesign,randomGenerator} from '../src/core.js';
import {cinematicProfile,cameraPose,lightingPalette,CAMERA_MOODS,LIGHT_MOODS,ATMOSPHERE_MOODS} from '../src/cinematic-profile.js';
test('all six scenes have deliberate palette and lighting profiles',()=>{
 const lightSets=new Set(),backgroundSets=new Set();
 for(const scene of SCENES){
  const d={scene:scene.id,lightVariation:3,cameraMood:'portrait'};
  const p=cinematicProfile(d);
  assert.ok(LIGHT_MOODS.includes(p.lightMood));
  assert.ok(ATMOSPHERE_MOODS.includes(p.atmosphereMood));
  const key=lightingPalette(p,scene);
  assert.ok(key.ambient>0&&key.ambient<1);
  assert.ok(key.keyPower>key.fillPower);
  assert.ok(key.exposure>=1&&key.exposure<=1.3);
  lightSets.add(p.lightMood);backgroundSets.add(p.atmosphereMood);
 }
 assert.equal(lightSets.size,SCENES.length);
 assert.equal(backgroundSets.size,SCENES.length);
});
test('camera positions are fixed in each generated scene and keep text visible',()=>{
 const x=new Set();
 for(const mood of CAMERA_MOODS){
  const pose=cameraPose({cameraMood:mood});
  assert.ok(pose.z>10.5&&pose.z<12.2);
  assert.ok(Math.abs(pose.x)<.5);
  assert.ok(pose.fov>=35&&pose.fov<=40);
  x.add(pose.x);
 }
 assert.equal(x.size,3);
});
test('camera mood is seeded and contributes to anti-repeat signature',()=>{
 const gen=chooseDesign('Happy Birthday, Make a Wish','Lucio Bruno',[],randomGenerator(2891));
 const next=chooseDesign('Happy Birthday, Make a Wish','Lucio Bruno',[],randomGenerator(2891));
 assert.equal(gen.cameraMood,next.cameraMood);
 assert.deepEqual(gen,next);
 assert.ok(gen.signature.endsWith('|'+gen.cameraMood));
});
test('unsupported scene and mood safely produce a valid default',()=>{
 const fallback=cinematicProfile({scene:'unknown',cameraMood:'bad',lightVariation:10});
 assert.equal(fallback.cameraMood,'portrait');
 assert.ok(cinematicProfile({scene:'moonlit',cameraMood:'grand',lightVariation:2}).lightMood==='moon-silver');
});
