import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENE_ID,ART_VARIANTS,newDesign,randomGenerator,splitTitle,fileSlug,EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,DURATION_SECONDS} from '../src/core.js';
test('single-flagship export contract',()=>{
 assert.equal(SCENE_ID,'midnight-gala');assert.equal(ART_VARIANTS.length,4);
 assert.deepEqual([EXPORT_WIDTH,EXPORT_HEIGHT,EXPORT_FPS,DURATION_SECONDS],[1920,1080,30,10]);
});
test('birthday titles split without losing words',()=>{
 assert.deepEqual(splitTitle('Happy Birthday, Make a Wish'),['Happy Birthday','Make a Wish']);
 assert.deepEqual(splitTitle('Happy Birthday'),['Happy Birthday']);
 assert.equal(splitTitle('Another Year Under the Stars').join(' '),'Another Year Under the Stars');
});
test('Generate uses one composition with alternating light moods',()=>{
 const rng=randomGenerator(45);let prev=null;
 for(let i=0;i<1500;i++){
  const d=newDesign('Happy Birthday','Lucio Bruno',prev,rng);
  assert.equal(d.scene,SCENE_ID);
  if(prev)assert.notEqual(d.variant,prev.variant);
  prev=d;
 }
});
test('seeded generation and filenames',()=>{
 assert.deepEqual(newDesign('a','b',null,randomGenerator(9)),newDesign('a','b',null,randomGenerator(9)));
 assert.equal(fileSlug('劉德華 – 生日快樂'),'劉德華-生日快樂');
 assert.equal(fileSlug('../../evil?.mp4'),'evil-mp4');
});
