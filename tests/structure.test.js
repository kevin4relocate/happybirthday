import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
test('simple internal two-field creator remains intact',()=>{
 const html=read('../index.html');
 assert.equal((html.match(/<input\b/g)||[]).length,2);
 for(const id of ['song-title','artist-name','generate','download','stage'])
  assert.ok(html.includes('id="'+id+'"'));
 for(const slogan of ['THE ART OF CELEBRATION','Make the moment','A candlelit birthday story'])
  assert.ok(!html.includes(slogan));
});
test('all scene photographs are bundled and have individual license records',()=>{
 const old=JSON.parse(read('../assets/ART_CREDIT.json'));
 const sources=JSON.parse(read('../assets/SCENE_CREDITS.json'));
 assert.match(old.licenseUrl,/unsplash\.com\/license/);
 assert.equal(sources.length,3);
 const hashes=new Set();
 for(const source of sources){
  assert.equal(source.license,'Pexels License');
  assert.match(source.sourcePage,/^https:\/\/www\.pexels\.com\/photo\//);
  const url=new URL('../assets/'+source.file,import.meta.url);
  assert.ok(existsSync(url),'Missing photo: '+source.file);
  const hash=createHash('sha256').update(readFileSync(url)).digest('hex');
  assert.equal(source.sha256,hash,'Photo contents differ from audited file');
  hashes.add(hash);
 }
 assert.equal(hashes.size,3);
});
test('photo scenes use distinct compositions with deterministic motion',()=>{
 const s=read('../src/scene.js');
 const registry=read('../src/scene-registry.js');
 const app=read('../src/app.js');
 for(const name of ['drawMidnight','drawRose','drawGolden'])assert.ok(s.includes(name));
 assert.match(s,/this\.phase\*TAU/);
 assert.match(s,/noZoom=true/);
 assert.doesNotMatch(s,/THREE|WebGLRenderer|GLTFLoader|Math\.random\(|Date\.now\(/);
 assert.match(registry,/rose-garden/);
 assert.match(registry,/golden-ballroom/);
 assert.match(app,/history\.add\(next\.scene\)/);
});
test('strict seam encoder untouched and no real-time recording fallback',()=>{
 const s=read('../src/export.js');
 assert.match(s,/closeExactEncodedSeam\(samples,total,profile\.fps\)/);
 assert.doesNotMatch(s,/captureStream|new MediaRecorder/);
});
