/**
 * One-shot asset ingest for the new cinematic hero scene.
 * Source and license: https://polyhaven.com/a/strawberry_chocolate_cake
 * Author: Kuutti Siitonen; CC0 1.0 public domain.
 *
 * Do NOT put arbitrary third-party binaries into CI or fetch unverified CDN URLs.
 * Only API-reported HTTPS links on dl.polyhaven.org are permitted.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
const assetId='strawberry_chocolate_cake';
const url='https://api.polyhaven.com/files/'+assetId;
const res=await fetch(url,{headers:{'User-Agent':'BirthdayStudioAssetIngest/1.0'}});
if(!res.ok)throw new Error('Poly Haven asset lookup: HTTP '+res.status);
const files=await res.json();
function scan(x,p='',out=[]){
  if(!x||typeof x!=='object')return out;
  if(typeof x.url==='string'){
    out.push({path:p,url:x.url,size:x.size??null,includes:x.include?Object.keys(x.include):[]});
  }
  for(const [k,v] of Object.entries(x)){
    if(k==='url'||k==='size'||k==='include')continue;
    scan(v,p+'/'+k,out);
  }
  return out;
}
const candidates=scan(files);
console.log('ASSET_CANDIDATES',JSON.stringify(candidates.map(x=>({
  path:x.path,size:x.size,includes:x.includes.length,url:x.url.slice(0,170)
})),null,2));
const format=candidates.filter(x=>/gltf/i.test(x.path)&&/1k/i.test(x.path));
let chosen=format.find(x=>/\.zip(?:\?|$)/i.test(x.url))??format.find(x=>/\.gltf(?:\?|$)/i.test(x.url))??format[0];
if(!chosen)throw new Error('No Poly Haven 1K glTF variant found in API metadata; do not assume remote file paths');
if(!/^https:\/\/dl\.polyhaven\.org\//.test(chosen.url))throw new Error('Rejecting asset URL outside licensed Poly Haven CDN');
console.log('CHOSEN_ASSET',JSON.stringify(chosen,null,2));
await fs.mkdir('tmp-polyhaven',{recursive:true});
const bytes=await (await fetch(chosen.url,{headers:{'User-Agent':'BirthdayStudioAssetIngest/1.0'}})).arrayBuffer();
const out='tmp-polyhaven/source.'+(chosen.url.split('?')[0].split('.').pop().toLowerCase());
await fs.writeFile(out,new Uint8Array(bytes));
console.log('DOWNLOADED',out,bytes.byteLength);
if(out.endsWith('.zip')){
 execFileSync('unzip',['-q',out,'-d','tmp-polyhaven/unpacked'],{stdio:'inherit'});
 console.log('ZIP_FILES',execFileSync('find',['tmp-polyhaven/unpacked','-type','f'],{encoding:'utf8'}));
}else if(out.endsWith('.gltf')){
 console.log('DIRECT_GLTF',out);
 for(const [filename,meta] of Object.entries(files)){
  void filename;void meta;
 }
}else if(out.endsWith('.glb')){
 console.log('DIRECT_GLB',out);
}else throw new Error('Unsupported archive '+out);
