/**
 * One-time archival of three explicitly sourced Pexels photos.
 * Runtime only loads local /assets files; this script runs during repository setup.
 * Each source page was checked as a free Pexels photo, NOT a premium item.
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const photos=[
 {scene:'rose-garden',file:'rose-garden.jpg',id:34833097,
  photo:'https://www.pexels.com/photo/elegant-pink-birthday-cake-with-floral-decor-34833097/',
  photographer:'aryapandusedjati .'},
 {scene:'golden-ballroom',file:'golden-ballroom-cake.jpg',id:34596958,
  photo:'https://www.pexels.com/photo/elegant-white-wedding-cake-with-gold-stand-34596958/',
  photographer:'Caleb Oquendo'},
 {scene:'golden-ballroom',file:'golden-ballroom-hall.jpg',id:33852468,
  photo:'https://www.pexels.com/photo/luxurious-wedding-banquet-hall-with-chandeliers-33852468/',
  photographer:'Raj'}
];
const manifests=[];
for(const source of photos){
 const url='https://images.pexels.com/photos/'+source.id+'/pexels-photo-'+source.id+'.jpeg?auto=compress&cs=tinysrgb&w=2200&q=85';
 const response=await fetch(url,{headers:{'User-Agent':'BirthdayStudio/1.0','Accept':'image/jpeg'}});
 if(!response.ok)throw Error('Pexels CDN '+response.status+' '+source.file);
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<50000||bytes.length>9000000||bytes[0]!==255||bytes[1]!==216)
   throw Error('Bad JPEG '+source.file+' bytes '+bytes.length);
 await fs.mkdir('assets',{recursive:true});
 await fs.writeFile('assets/'+source.file,bytes);
 manifests.push({scene:source.scene,file:source.file,photographer:source.photographer,
  sourcePage:source.photo,license:'Pexels License',licenseUrl:'https://www.pexels.com/license/',
  cdnUrl:url,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
}
await fs.writeFile('assets/SCENE_CREDITS.json',JSON.stringify(manifests,null,2)+'\n');
console.log('SCENE_ASSETS_IMPORTED '+JSON.stringify(manifests.map(x=>({
  file:x.file,photographer:x.photographer,bytes:x.bytes,sha256:x.sha256
}))));
