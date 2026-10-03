import test from 'node:test';
import assert from 'node:assert/strict';
import {SCENES,splitTitle,chooseDesign,randomGenerator,DesignHistory,fileSlug,HISTORY_LIMIT} from '../src/core.js';

test('title places Happy Birthday on the first line',()=>{
 assert.deepEqual(splitTitle('Happy Birthday, Pass the Cake Around'),['Happy Birthday','Pass the Cake Around']);
 assert.deepEqual(splitTitle('Happy Birthday to You'),['Happy Birthday','to You']);
 assert.deepEqual(splitTitle('Happy Birthday'),['Happy Birthday']);
 assert.deepEqual(splitTitle('HAPPY BIRTHDAY! Sweet Memories'),['HAPPY BIRTHDAY','Sweet Memories']);
});
test('other titles split naturally without losing words',()=>{
 assert.deepEqual(splitTitle('Light a Candle and Make a Wish'),['Light a Candle','and Make a Wish']);
 assert.deepEqual(splitTitle('Birthday Dreams'),['Birthday Dreams']);
 assert.deepEqual(splitTitle(''),['Happy Birthday']);
 assert.equal(splitTitle('夢の誕生日を祝う').join(''),'夢の誕生日を祝う');
});
test('same RNG and inputs produce the same design',()=>{
 const first=chooseDesign('Happy Birthday','Lucio Bruno',[],randomGenerator(401));
 const second=chooseDesign('Happy Birthday','Lucio Bruno',[],randomGenerator(401));
 assert.deepEqual(first,second);
});
test('history is robust to corrupt storage and duplicate inserts',()=>{
 const store=new Map([['birthday-studio-v2-history','oops']]);
 const storage={getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)};
 const hist=new DesignHistory(storage);
 assert.deepEqual(hist.records,[]);
 const d=chooseDesign('Happy Birthday','Lucio Bruno',[],randomGenerator(21));
 assert.equal(hist.add(d),true);
 assert.equal(hist.add(d),false);
 assert.equal(hist.records.length,1);
 assert.equal(new DesignHistory(storage).has(d.signature),true);
});
test('1,200 consecutive previews are structurally distinct with different adjacent scenes',()=>{
 const rng=randomGenerator(102003);
 const hist=new DesignHistory();
 const seen=new Set();
 let prev=null;
 const counts={};
 for(let i=0;i<1200;i++){
  const d=chooseDesign('Happy Birthday, Song '+(i+1),'Lucio Bruno',hist.records,rng);
  assert.ok(!seen.has(d.signature),'duplicate structural fingerprint at '+i);
  assert.ok(SCENES.some(s=>s.id===d.scene));
  assert.ok(d.candleCount>=3&&d.candleCount<=9);
  assert.ok(!d.signature.includes(String(d.seed)+'|seed'));
  if(prev)assert.notEqual(prev.scene,d.scene,'same scene for adjacent designs');
  seen.add(d.signature);
  hist.add(d);
  counts[d.scene]=(counts[d.scene]??0)+1;
  prev=d;
 }
 assert.equal(seen.size,1200);
 assert.equal(Object.keys(counts).length,6);
 assert.equal(hist.records.length,1200);
});
test('history retention is bounded to 3,000 recent structural fingerprints',()=>{
 const hist=new DesignHistory();
 for(let i=0;i<HISTORY_LIMIT+30;i++){
   hist.add({signature:'sig-'+i,scene:'atelier',family:'luxury',finish:'velvet'});
 }
 assert.equal(hist.records.length,3000);
 assert.equal(hist.has('sig-0'),false);
 assert.equal(hist.has('sig-3029'),true);
});
test('generated slug is safe for file downloads in multiple languages',()=>{
 assert.equal(fileSlug('Happy Birthday, Make a Wish!'),'Happy-Birthday-Make-a-Wish');
 assert.equal(fileSlug('劉德華 – 生日快樂'),'劉德華-生日快樂');
 assert.equal(fileSlug('../../something?.mp4'),'something-mp4');
 assert.equal(fileSlug('     '),'birthday');
});
