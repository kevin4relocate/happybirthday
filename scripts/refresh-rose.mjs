import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const id=33100289,file='rose-garden.jpg';
const url='https://images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&cs=tinysrgb&w=2200&q=85';
const r=await fetch(url,{headers:{'User-Agent':'BirthdayStudio/1.0'}});
if(!r.ok)throw Error('Pexels photo '+r.status);
const buf=Buffer.from(await r.arrayBuffer());
if(buf.length<50_000||buf[0]!==255||buf[1]!==216)throw Error('Invalid rose photo');
await fs.writeFile('assets/'+file,buf);
const manifest=JSON.parse(await fs.readFile('assets/SCENE_CREDITS.json','utf8'));
const x=manifest.find(x=>x.file===file);
if(!x)throw Error('Missing rose credit');
Object.assign(x,{photographer:'Busenur Demirkan',
 sourcePage:'https://www.pexels.com/photo/floral-birthday-cake-with-pink-roses-and-ribbons-33100289/',
 cdnUrl:url,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')});
await fs.writeFile('assets/SCENE_CREDITS.json',JSON.stringify(manifest,null,2)+'\n');
console.log('UPDATED_NEUTRAL_ROSE_PHOTO '+JSON.stringify({bytes:buf.length,sha256:x.sha256}));
