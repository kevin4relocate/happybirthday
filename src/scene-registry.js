/**
 * Editorial templates, not random combinations of the same stage.
 * Images are pre-approved, locally hosted photos with attribution in /assets.
 */
export const SCENES=Object.freeze([
 Object.freeze({
  id:'midnight-gala',name:'Midnight Gala',photo:'./assets/midnight-gala.jpg',
  layout:'dark-right',moods:['Candlelight','Champagne Hour','Velvet Night','Golden Memory'],
  glow:'#ffbb79',ink:'#f7dfaa'
 }),
 Object.freeze({
  id:'rose-garden',name:'Rose Garden',photo:'./assets/rose-garden.jpg',
  layout:'rose-left',moods:['Soft Morning','Rose Champagne','Blushing Gold','Evening Roses'],
  glow:'#f7c1bb',ink:'#583342'
 }),
 Object.freeze({
  id:'golden-ballroom',name:'Golden Ballroom',photo:'./assets/golden-ballroom-cake.jpg',
  backdrop:'./assets/golden-ballroom-hall.jpg',
  layout:'golden-hall',moods:['Golden Hour','Chandelier Glow','Gilded Evening','Champagne Lights'],
  glow:'#fbd7a1',ink:'#f5dfae'
 })
]);
export const getScene=id=>SCENES.find(s=>s.id===id)??null;
export function pickScene(recent=[],rng=Math.random){
 const ids=SCENES.map(s=>s.id);
 const lastTwo=recent.slice(-2).map(x=>typeof x==='string'?x:x?.scene).filter(Boolean);
 const candidates=ids.filter(x=>!lastTwo.includes(x));
 const pool=candidates.length?candidates:ids.filter(x=>x!==lastTwo.at(-1));
 return pool[Math.min(pool.length-1,Math.floor(rng()*pool.length))];
}
