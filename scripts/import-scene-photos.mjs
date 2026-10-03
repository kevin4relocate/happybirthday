/**
 * One-shot source-licensed Unsplash image importer (only for this branch).
 * Images are copied into this repository; runtime makes no Unsplash requests.
 * Sources were verified as free Unsplash photos, NOT Unsplash+.
 */
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
const photos=[
 {scene:'rose-garden',file:'rose-garden.jpg',
  photo:'https://unsplash.com/photos/white-and-pink-cake-with-pink-flower-accent-sjsG1yrwJxY',
  photographer:'Deva Williamson',sourceId:'sjsG1yrwJxY'},
 {scene:'golden-ballroom',file:'golden-ballroom-cake.jpg',
  photo:'https://unsplash.com/photos/a-white-cake-with-a-gold-ribbon-wNd3G1OStQY',
  photographer:'Soulseeker - Creative Photography',sourceId:'wNd3G1OStQY'},
 {scene:'golden-ballroom',file:'golden-ballroom-hall.jpg',
  photo:'https://unsplash.com/photos/a-banquet-hall-with-chandeliers-and-tables-iXTkKQyVqbM',
  photographer:'ISKRA Photography',sourceId:'iXTkKQyVqbM'}
];
async function downloadImage(photo){
 const response=await fetch(photo.photo,{
  headers:{'User-Agent':'Mozilla/5.0 (compatible; BirthdayStudioAssetArchiver/1.0)','Accept':'text/html'}});
 if(!response.ok)throw Error('Source photo page HTTP '+response.status+' '+photo.photo);
 const html=await response.text();
 const metaTags=[...html.matchAll(/<meta\b[^>]*>/gi)].map(x=>x[0]);
 let cdn=null;
 for(const tag of metaTags){
  if(!/property=["']og:image["']|name=["']twitter:image["']/i.test(tag))continue;
  const raw=tag.match(/content=["']([^"']+)["']/i)?.[1]?.replaceAll('&amp;','&');
  if(raw&&/^https:\/\/images\.unsplash\.com\/photo-/.test(raw)){cdn=raw;break}
 }
 if(!cdn){
  const match=html.match(/https:\\?\/\\?\/images\.unsplash\.com\\?\/photo-[\w%-]+/);
  if(match)cdn=match[0].replaceAll('\\/','/');
 }
 if(!cdn)throw Error('Missing official Unsplash photo CDN address for '+photo.sourceId);
 const url=new URL(cdn);if(url.hostname!=='images.unsplash.com')throw Error('Invalid source host');
 url.search='?auto=format&fit=crop&w=2400&q=86&fm=jpg';
 const file=await fetch(url,{headers:{'User-Agent':'BirthdayStudioAssetArchiver/1.0'}});
 if(!file.ok)throw Error('Image fetch HTTP '+file.status+' '+url);
 const bytes=Buffer.from(await file.arrayBuffer());
 if(bytes.length<45000||bytes.length>9000000||bytes[0]!==0xff||bytes[1]!==0xd8)
  throw Error('Invalid JPEG payload '+photo.file+' bytes='+bytes.length);
 await fs.mkdir('assets',{recursive:true});
 await fs.writeFile('assets/'+photo.file,bytes);
 return {...photo,license:'Unsplash License',
  licenseUrl:'https://unsplash.com/license',
  url:url.href,bytes:bytes.length,
  sha256:crypto.createHash('sha256').update(bytes).digest('hex')};
}
const manifest=[];
for(const photo of photos)manifest.push(await downloadImage(photo));
await fs.writeFile('assets/SCENE_CREDITS.json',JSON.stringify(manifest,null,2)+'\n');
console.log('SCENE_ASSETS_IMPORTED '+JSON.stringify(manifest.map(x=>({
 file:x.file,photographer:x.photographer,bytes:x.bytes,sha256:x.sha256
}))));
