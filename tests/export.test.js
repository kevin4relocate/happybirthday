import test from 'node:test';
import assert from 'node:assert/strict';
import {countFrames,frameTimestampUs,loopFramePhase,closeExactEncodedSeam} from '../src/loop.js';
import {exportProfile} from '../src/export.js';
test('exact timing',()=>{
 const n=countFrames(30,10);assert.equal(n,300);
 assert.equal(frameTimestampUs(299,30),9966667);
 assert.equal(loopFramePhase(0,n),loopFramePhase(299,n));
});
test('first and last compressed frames are identical',()=>{
 const frames=Array.from({length:299},(_,i)=>({timestamp:frameTimestampUs(i,30),key:i===0,data:new Uint8Array([i%255,55,99])}));
 const closed=closeExactEncodedSeam(frames,300,30);
 assert.equal(closed.length,300);
 assert.equal(closed[299].key,true);
 assert.deepEqual(closed[0].data,closed[299].data);
});
test('production resolution unchanged',()=>assert.deepEqual(exportProfile(),{width:1920,height:1080,fps:30,durationSeconds:10}));
