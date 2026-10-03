import test from 'node:test';
import assert from 'node:assert/strict';
import {countFrames,frameTimestampUs,loopFramePhase,closeExactEncodedSeam} from '../src/loop.js';
test('frame timestamps cover 0..9.966666 seconds at 30fps',()=>{
 const n=countFrames(30,10);assert.equal(n,300);
 for(let i=1;i<n;i++)assert.ok(frameTimestampUs(i,30)>frameTimestampUs(i-1,30));
 assert.equal(frameTimestampUs(299,30),9966667);
});
test('cloned keyframe is isolated from the encoder original buffer',()=>{
 const encoded=[
  {timestamp:0,key:true,data:new Uint8Array([99,88,77])},
  {timestamp:33333,key:false,data:new Uint8Array([11])},
  {timestamp:66667,key:false,data:new Uint8Array([22])}
 ];
 const closed=closeExactEncodedSeam(encoded,4,30);
 assert.deepEqual(closed[0].data,closed[3].data);
 assert.equal(closed[3].timestamp,100000);
 encoded[0].data[0]=0;
 assert.equal(closed[3].data[0],99);
});
test('periodic scene phase reaches the same pose at both encoded endpoints',()=>{
 const n=countFrames(30,10);
 assert.equal(loopFramePhase(0,n),loopFramePhase(n-1,n));
 for(let i=1;i<n-1;i++)assert.ok(loopFramePhase(i,n)>loopFramePhase(i-1,n));
 for(const frame of [3,29,148,298])assert.equal(loopFramePhase(frame,n),loopFramePhase(frame,n));
});
