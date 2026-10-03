import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=x=>readFileSync(new URL(x,import.meta.url),'utf8');
test('homepage has only two user-editable fields and generation/download actions',()=>{
 const html=read('../index.html');
 assert.match(html,/id="song-title"/);
 assert.match(html,/id="artist-name"/);
 assert.match(html,/id="generate"/);
 assert.match(html,/id="download"/);
 assert.match(html,/id="stage"/);
 assert.doesNotMatch(html,/id="scene-select"|id="font-choice"|id="camera-motion"/);
});
test('3D text is scene-mounted, not HTML text on top of the canvas',()=>{
 const src=read('../src/type.js');
 assert.match(src,/new TextGeometry\(/);
 assert.match(src,/new THREE\.CanvasTexture\(/);
 assert.match(src,/artistBadge\(group/);
 assert.match(src,/splitTitle\(design\.title\)/);
});
test('recording uses deterministic loop phases and cleans up the stream',()=>{
 const src=read('../src/export.js');
 assert.match(src,/captureStream\(EXPORT_FPS\)/);
 assert.match(src,/engine\.draw\(0\)/);
 assert.match(src,/getTracks\(\)\.forEach\(track=>track\.stop\(\)\)/);
 assert.match(src,/signal\?\.addEventListener\('abort'/);
});
test('all 6 scene configurations are referenced through shared builder',()=>{
 const src=read('../src/scene.js');
 for(const key of ['makeBackdrop','makeStage','makeCake','makeBalloons','makeGifts','makeSceneDecor','createLettering'])assert.ok(src.includes(key),key);
});
