/**
 * Real Chromium WebGL/MediaRecorder smoke test on GitHub Actions.
 * Requires Google Chrome/Chromium on PATH and puppeteer-core installed by CI.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import puppeteer from 'puppeteer-core';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.svg':'image/svg+xml','.json':'application/json'};
const server=http.createServer((req,res)=>{
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch(_){res.writeHead(400);res.end();return}
  const filename=path.resolve(root,'.'+pathname,(pathname.endsWith('/')?'index.html':''));
  if(!(filename===root||filename.startsWith(root+path.sep))){res.writeHead(403);res.end();return}
  let real=filename;
  if(fs.existsSync(filename)&&fs.statSync(filename).isDirectory())real=path.join(filename,'index.html');
  fs.readFile(real,(err,buffer)=>{
    if(err){res.writeHead(404);res.end('Not found '+real);return}
    res.writeHead(200,{'Content-Type':mime[path.extname(real)]||'application/octet-stream','Cache-Control':'no-store'});res.end(buffer);
  });
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const port=server.address().port;
const executable=process.env.CHROME_BIN||'/usr/bin/google-chrome';
let browser;
try{
  browser=await puppeteer.launch({headless:true,executablePath:executable,
    args:['--no-sandbox','--disable-dev-shm-usage','--enable-webgl','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
  const page=await browser.newPage();
  await page.setViewport({width:1440,height:950,deviceScaleFactor:1});
  const pageErrors=[];
  page.on('pageerror',err=>pageErrors.push(err.message));
  await page.goto('http://127.0.0.1:'+port+'/',{waitUntil:'domcontentloaded',timeout:30000});
  await page.waitForFunction(()=>!document.querySelector('#download')?.disabled,{timeout:60000});
  const initial=await page.evaluate(()=>({
    scene:document.querySelector('#scene-caption')?.textContent,
    title:document.querySelector('#stage-name')?.textContent,
    width:document.querySelector('#stage')?.width,
    height:document.querySelector('#stage')?.height
  }));
  assert.ok(initial.width>=500&&initial.height>=250,'WebGL canvas has unexpected dimensions');
  assert.match(initial.title,/Happy Birthday/);
  fs.mkdirSync(path.join(root,'test-output'),{recursive:true});
  await page.screenshot({path:path.join(root,'test-output','birthday-v2-desktop.png'),fullPage:true});
  await page.click('#generate');
  const second=await page.evaluate(()=>document.querySelector('#scene-caption')?.textContent);
  assert.notEqual(initial.scene,second,'Generate must change the scene family on adjacent clicks');
  await page.evaluate(()=>{
    window.__capturedVideo=null;
    const old=URL.createObjectURL;
    URL.createObjectURL=function(blob){
      if(blob instanceof Blob&&blob.type.startsWith('video/')){window.__capturedBlob=blob;window.__capturedVideo={size:blob.size,type:blob.type};}
      return old.call(this,blob);
    };
  });
  await page.click('#download');
  await page.waitForFunction(()=>window.__capturedVideo?.size>0,{timeout:90000});
  const video=await page.evaluate(()=>window.__capturedVideo);
  console.log('RECORDED_VIDEO_DIAGNOSTICS '+JSON.stringify(video));
  if(video.size>0&&video.size<3_000_000){
    const bytes=await page.evaluate(async()=>{
      const buf=await window.__capturedBlob.arrayBuffer();
      return Array.from(new Uint8Array(buf));
    });
    fs.writeFileSync(path.join(root,'test-output','recorded-loop.'+(video.type.includes('mp4')?'mp4':'webm')),Buffer.from(bytes));
  }
  assert.ok(video.size>1000,'Recorded video is empty or invalid');
  assert.match(video.type,/video\/(webm|mp4)/);
  assert.deepEqual(pageErrors,[], 'Browser JavaScript errors');
  console.log('BROWSER_SMOKE_PASS '+JSON.stringify({first:initial.scene,second,width:initial.width,height:initial.height,encodedBytes:video.size,mime:video.type}));
}finally{
  await browser?.close();
  await new Promise(resolve=>server.close(resolve));
}
