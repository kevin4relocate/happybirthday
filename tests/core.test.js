import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,newDesign,randomGenerator,splitTitle,fileSlug,
 SceneHistory,EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,DURATION_SECONDS} from '../src/core.js';
import {getScene,pickScene} from '../src/scene-registry.js';
test('three independently art-directed masters and unchanged export settings',()=>{
 assert.deepEqual(SCENES.map(s=>s.id),['midnight-gala','rose-garden','golden-ballroom']);
 assert.equal(new Set(SCENES.map(s=>s.photo)).size,3);
 assert.notEqual(getScene('rose-garden').layout,getScene('golden-ballroom').layout);
 assert.ok(getScene('golden-ballroom').backdrop);
 assert.deepEqual([EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,DURATION_SECONDS],[1920,1080,30,10]);
});
test('title wraps Happy Birthday cleanly',()=>{
 assert.deepEqual(splitTitle('Happy Birthday, Make a Wish'),['Happy Birthday','Make a Wish']);
 assert.deepEqual(splitTitle('Happy Birthday'),['Happy Birthday']);
 assert.equal(splitTitle('Another Year Under the Stars').join(' '),'Another Year Under the Stars');
});
test('first generation shows familiar flagship, then cycles through all three without repeats',()=>{
 const rng=randomGenerator(33499);
 const history=[];
 let previous=null;
 const seen=new Set();
 for(let i=0;i<1500;i++){
  const d=newDesign('Happy Birthday','Lucio Bruno',previous,rng,history);
  assert.ok(getScene(d.scene));
  if(!i)assert.equal(d.scene,'midnight-gala');
  if(previous)assert.notEqual(d.scene,previous.scene,'consecutive scene repeat at '+i);
  if(history.length>=2)assert.ok(!history.slice(-2).includes(d.scene),'recent-two scene repeat at '+i);
  seen.add(d.scene);history.push(d.scene);previous=d;
 }
 assert.equal(seen.size,3);
});
test('history is browser-local and robust to corrupt storage',()=>{
 const store=new Map(),storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const h=new SceneHistory(storage);
 h.add('rose-garden');h.add('golden-ballroom');h.add('not-a-scene');
 assert.deepEqual(new SceneHistory(storage).records,['rose-garden','golden-ballroom']);
 store.set('birthday-v4-scene-history','not-json');
 assert.deepEqual(new SceneHistory(storage).records,[]);
});
test('same random state produces same auto design and filename',()=>{
 const history=['midnight-gala'];
 assert.deepEqual(newDesign('test','x',null,randomGenerator(29),history),
  newDesign('test','x',null,randomGenerator(29),history));
 assert.equal(fileSlug('劉德華 – 生日快樂'),'劉德華-生日快樂');
 assert.equal(fileSlug('../../evil?.mp4'),'evil-mp4');
});
test('pickScene excludes last two even when random repeats',()=>{
 for(const n of [0,.1,.5,.999]){
  assert.equal(pickScene(['midnight-gala','rose-garden'],()=>n),'golden-ballroom');
 }
});
