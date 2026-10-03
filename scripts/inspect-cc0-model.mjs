/**
 * One-shot controlled ingestion of Kuutti Siitonen's CC0 scanned cake.
 * Source: https://polyhaven.com/a/strawberry_chocolate_cake
 * Provenance and license: https://polyhaven.com/license
 * No external uploader, conversion service or untrusted package download.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import crypto from 'node:crypto';
const asset='strawberry_chocolate_cake';
const metadata='https://api.polyhaven.com/files/'+asset;
const response=await fetch(metadata,{headers:{'User-Agent':'BirthdayStudioModelIngest/1.0'}});
if(!response.ok)throw new Error('Poly Haven API error: '+response.status);
const files=await response.json();
const chosen=files?.gltf?.['1k']?.gltf;
if(!chosen||!/^https:\/\/dl\.polyhaven\.org\//.test(chosen.url)||!chosen.include){
 throw new Error('No supported 1k glTF model and dependencies found. Refusing to guess asset paths.');
}
const base=path.join('tmp-polyhaven','unpacked');
await fs.mkdir(base,{recursive:true});
const recorded=[];
async function download(url,dest,sizeExpected){
 if(!/^https:\/\/dl\.polyhaven\.org\//.test(url))throw new Error('Refusing non-PolyHaven asset URL '+url);
 const request=await fetch(url,{headers:{'User-Agent':'BirthdayStudioModelIngest/1.0'}});
 if(!request.ok)throw new Error('Asset download HTTP '+request.status);
 const content=new Uint8Array(await request.arrayBuffer());
 if(sizeExpected&&content.byteLength!==sizeExpected)throw new Error('Asset byte size mismatch '+dest);
 await fs.mkdir(path.dirname(dest),{recursive:true});
 await fs.writeFile(dest,content);
 recorded.push({filename:path.relative(base,dest),bytes:content.byteLength,sha256:crypto.createHash('sha256').update(content).digest('hex')});
}
await download(chosen.url,path.join(base,asset+'_1k.gltf'),chosen.size);
for(const [filename,object] of Object.entries(chosen.include)){
 const dest=path.resolve(base,filename),root=path.resolve(base);
 if(!dest.startsWith(root+path.sep))throw new Error('Unsafe asset path '+filename);
 await download(object.url,dest,object.size);
}
console.log('SOURCE_COMPLETE',JSON.stringify(recorded,null,2));
const out=path.join('assets','models','strawberry-chocolate-cake-1k.glb');
await fs.mkdir(path.dirname(out),{recursive:true});
execFileSync('npx',['--yes','@gltf-transform/cli@4.2.1','copy',path.join(base,asset+'_1k.gltf'),out],{stdio:'inherit',timeout:120000});
const file=await fs.readFile(out);
if(file.byteLength<10000||file.toString('ascii',0,4)!=='glTF')throw new Error('Invalid packed glTF asset');
const manifest={
 name:'Strawberry Chocolate Cake — 1K scan',
 author:'Kuutti Siitonen',
 license:'CC0 1.0 Public Domain',
 source:'https://polyhaven.com/a/strawberry_chocolate_cake',
 upstreamFiles:metadata,
 model:out,
 bytes:file.length,
 sha256:crypto.createHash('sha256').update(file).digest('hex'),
 sourceFiles:recorded
};
await fs.writeFile('assets/models/PROVENANCE.json',JSON.stringify(manifest,null,2)+'\n');
console.log('IMPORTED_CC0_HERO',JSON.stringify({path:out,bytes:file.length,sha256:manifest.sha256,dependencies:recorded.length}));
