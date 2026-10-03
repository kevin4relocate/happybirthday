import test from 'node:test';
import assert from 'node:assert/strict';
import {countFrames,frameTimestampUs,loopFramePhase,closeExactEncodedSeam} from '../src/loop.js';
import {exportProfile} from '../src/export.js';
test('10 seconds at 30fps gives 300 frame slots including matching first/last',()=>{
 const total=countFrames(30,10);
 assert.equal(total,300);
 assert.equal(frameTimestampUs(299,30),9966667);
 assert.equal(loopFramePhase(0,total),0);
 assert.equal(loopFramePhase(total-1,total),0);
 assert.ok(loopFramePhase(total-2,total)>.99);
});
test('last encoded keyframe is byte-identical to the first, not a re-encoding',()=>{
 const frames=Array.from({length:299},(_,i)=>({timestamp:frameTimestampUs(i,30),
  key:i===0||i%90===0,data:new Uint8Array([i%255,51,66,78])}));
 const closed=closeExactEncodedSeam(frames,300,30);
 assert.equal(closed.length,300);
 assert.equal(closed[0].key,true);
 assert.equal(closed.at(-1).key,true);
 assert.notStrictEqual(closed[0].data,closed.at(-1).data);
 assert.deepEqual(closed[0].data,closed.at(-1).data);
});
test('reject invalid count, bad times or missing first keyframe',()=>{
 const input=[{timestamp:0,key:false,data:new Uint8Array([3])},
  {timestamp:33333,key:false,data:new Uint8Array([4])}];
 assert.throws(()=>closeExactEncodedSeam(input,3,30),/keyframe/);
 assert.throws(()=>closeExactEncodedSeam(input.slice(0,1),3,30),/frame count/);
 assert.throws(()=>closeExactEncodedSeam([input[0],{...input[1],timestamp:12}],3,30),/timestamp/);
});
test('production target is exactly 300 frames, 1920 × 1080',()=>{
 assert.deepEqual(exportProfile(),{width:1920,height:1080,fps:30,durationSeconds:10});
});
