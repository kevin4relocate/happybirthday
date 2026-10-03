import test from 'node:test';
import assert from 'node:assert/strict';
import {preferredFormat} from '../src/export.js';
test('prefers VP9 when supported',()=>{
 const f=preferredFormat({isTypeSupported:x=>x==='video/webm;codecs=vp9'});
 assert.equal(f.ext,'webm');assert.equal(f.mime,'video/webm;codecs=vp9');
});
test('uses MP4 when only MP4 is supported',()=>{
 const f=preferredFormat({isTypeSupported:x=>x==='video/mp4'});
 assert.equal(f.ext,'mp4');assert.equal(f.mime,'video/mp4');
});
test('reports missing recorder gracefully',()=>assert.equal(preferredFormat(null),null));
test('recorder without a codec probe has a generic fallback',()=>assert.equal(preferredFormat({}).ext,'webm'));
