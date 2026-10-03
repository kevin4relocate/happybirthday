import fs from 'node:fs/promises';
import crypto from 'node:crypto';
/** Audited photos; source pages are marked Free on Pexels. */
const photos=[
 {scene:'rose-garden',file:'rose-garden.jpg',id:34263114,
  photo:'https://www.pexels.com/photo/elegant-pink-birthday-cake-with-flowers-34263114/',
  photographer:'Maria'},
 {scene:'golden-ballroom',file:'golden-ballroom-cake.jpg',id:15937640,
  photo:'https://www.pexels.com/photo/layer-cake-and-flower-decorations-on-a-table-at-a-party-15937640/',
  photographer:'Jonathan Borba'},
 {scene:'golden-ballroom',file:'golden-ballroom-hall.jpg',id:33852468,
  photo:'https://www.pexels.com/photo/luxurious-wedding-banquet-hall-with-chandeliers-33852468/',
  photographer:'Raj'}
];
const manifest=[];
for(const source of photos){
 const url='https://images.pexels.com/photos/'+source.id+'/pexels-photo-'+source.id+'.jpeg?auto=compress&cs=tinysrgb&w=2200&q=85';
 const response=await fetch(url,{headers:{'User-Agent':'BirthdayStudio/1.0','Accept':'image/jpeg'}});
 if(!response.ok)throw Error('Image fetch failed '+response.status+' '+source.file);
 const data=Buffer.from(await response.arrayBuffer());
 if(data.length<50000||data.length>9000000||data[0]!==255||data[1]!==216)
  throw Error('Image is not valid JPEG '+source.file);
 await fs.mkdir('assets',{recursive:true});
 await fs.writeFile('assets/'+source.file,data);
 manifest.push({scene:source.scene,file:source.file,photographer:source.photographer,
  sourcePage:source.photo,license:'Pexels License',licenseUrl:'https://www.pexels.com/license/',
  cdnUrl:url,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')});
}
await fs.writeFile('assets/SCENE_CREDITS.json',JSON.stringify(manifest,null,2)+'\n');
console.log('SCENE_ASSETS_IMPORTED '+JSON.stringify(manifest.map(x=>({file:x.file,sha256:x.sha256,bytes:x.bytes}))));
