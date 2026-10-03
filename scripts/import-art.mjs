import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

/** One-time licensed photo ingest; deployed client never requests Unsplash. */
const source={
  photo:'https://unsplash.com/photos/brown-and-white-cake-on-white-ceramic-plate-wvQk48s--zw',
  photographer:'Rakesh Sitnoor',
  license:'Unsplash License (commercial and noncommercial reuse)',
  licenseUrl:'https://unsplash.com/license',
  url:'https://images.unsplash.com/photo-1627545195377-1bb4f81f9ef7?auto=format&fit=crop&w=2400&q=87&fm=jpg'
};
const response=await fetch(source.url,{headers:{'User-Agent':'BirthdayStudio/1.0 (licensed artwork ingestion)'}});
if(!response.ok)throw new Error('Photo source error HTTP '+response.status);
const bytes=new Uint8Array(await response.arrayBuffer());
if(bytes.length<100_000||bytes.length>10_000_000||bytes[0]!==255||bytes[1]!==216)
 throw new Error('Downloaded image is not an expected JPEG: '+bytes.length);
const folder='assets';await fs.mkdir(folder,{recursive:true});
const filename=path.join(folder,'midnight-gala.jpg');
await fs.writeFile(filename,bytes);
const asset={...source,downloadedBytes:bytes.length,
  sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
await fs.writeFile(path.join(folder,'ART_CREDIT.json'),JSON.stringify(asset,null,2)+'\n');
console.log('LICENSED_HERO_IMPORT',JSON.stringify({filename,bytes:bytes.length,sha256:asset.sha256,photographer:source.photographer}));
