import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('exactly two input fields',()=>{
 const html=read('../index.html');
 assert.equal((html.match(/<input\b/g)||[]).length,2);
 for(const id of ['song-title','artist-name','generate','download','stage'])assert.ok(html.includes('id="'+id+'"'));
});
test('internal creator has no public-facing marketing copy',()=>{
 const html=read('../index.html');
 for(const copy of ['THE ART OF CELEBRATION','Make the moment','last forever.',
  'A candlelit birthday story','One crafted scene','An editorial birthday still life',
  'THE FLAGSHIP SCENE','AN ORIGINAL NEW BEGINNING']){
  assert.ok(!html.includes(copy),'Unwanted decorative marketing text: '+copy);
 }
 assert.match(html,/<label for="song-title">SONG TITLE<\/label>/);
 assert.match(html,/<label for="artist-name">ARTIST NAME<\/label>/);
 assert.match(html,/> Generate <span/);
});
test('licensed local photo and no legacy procedural scene engine',()=>{
 const art=JSON.parse(read('../assets/ART_CREDIT.json'));
 assert.equal(art.photographer,'Rakesh Sitnoor');
 assert.match(art.licenseUrl,/unsplash\.com\/license/);
 assert.ok(existsSync(new URL('../assets/midnight-gala.jpg',import.meta.url)));
 const s=read('../src/scene.js');
 assert.match(s,/\.\/assets\/midnight-gala\.jpg/);
 assert.doesNotMatch(s,/THREE|WebGLRenderer|GLTFLoader/);
 assert.match(s,/noZoom=true/);
 assert.doesNotMatch(s,/Math\.random\(|Date\.now\(/);
});
test('video exporter requires exact seam and rejects realtime recording',()=>{
 const s=read('../src/export.js');
 assert.match(s,/closeExactEncodedSeam\(samples,total,profile\.fps\)/);
 assert.doesNotMatch(s,/captureStream|new MediaRecorder/);
});
