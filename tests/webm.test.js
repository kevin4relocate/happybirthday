import test from 'node:test';
import assert from 'node:assert/strict';
import {muxWebM} from '../src/webm.js';
function contains(bytes,pattern){
 for(let i=0;i<=bytes.length-pattern.length;i++){
  if(pattern.every((x,j)=>bytes[i+j]===x))return true;
 }
 return false;
}
test('WebM muxer writes EBML, tracks, codec identifier and video frames',async()=>{
 const frames=[
  {timestamp:0,data:new Uint8Array([1,2,3,4]),key:true},
  {timestamp:33333,data:new Uint8Array([5,6,7,8]),key:false},
  {timestamp:66666,data:new Uint8Array([9,10,11,12]),key:false}
 ];
 const blob=muxWebM({width:640,height:360,durationSeconds:.1,codec:'vp09.00.10.08',frames});
 const buffer=new Uint8Array(await blob.arrayBuffer());
 assert.deepEqual(Array.from(buffer.slice(0,4)),[0x1a,0x45,0xdf,0xa3]);
 assert.equal(blob.type,'video/webm');
 assert.ok(contains(buffer,new TextEncoder().encode('V_VP9')));
 assert.ok(contains(buffer,[0x1f,0x43,0xb6,0x75]));
 assert.ok(contains(buffer,[0xa3,0x88,0x81]));
 assert.ok(buffer.length>100);
});
test('WebM muxer supports VP8 and refuses empty samples',async()=>{
 assert.throws(()=>muxWebM({width:640,height:360,durationSeconds:1,codec:'vp8',frames:[]}),/empty/);
 const data=muxWebM({width:640,height:360,durationSeconds:1,codec:'vp8',
 frames:[{timestamp:0,data:new Uint8Array([0]),key:true}]});
 assert.ok(contains(new Uint8Array(await data.arrayBuffer()),new TextEncoder().encode('V_VP8')));
});
