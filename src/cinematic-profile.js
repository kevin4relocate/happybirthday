/**
 * Art-directed cinematic presets. These are pure generation decisions:
 * the same design can be re-rendered/exported at any time or frame rate.
 */
export const CAMERA_MOODS=Object.freeze(['portrait','three-quarter-left','three-quarter-right','grand']);
export const LIGHT_MOODS=Object.freeze(['champagne','candlelight','moon-silver','rose-softbox','garden-dusk','disco-gems']);
export const ATMOSPHERE_MOODS=Object.freeze(['velvet','dream-haze','twilight','storybook','botanical','prism']);
const DIRECTIONS=Object.freeze({
 atelier:{light:'champagne',atmosphere:'velvet',camera:['portrait','three-quarter-left','grand']},
 pastel:{light:'rose-softbox',atmosphere:'dream-haze',camera:['portrait','three-quarter-right','three-quarter-left']},
 moonlit:{light:'moon-silver',atmosphere:'twilight',camera:['portrait','grand','three-quarter-right']},
 musicbox:{light:'candlelight',atmosphere:'storybook',camera:['portrait','three-quarter-left','grand']},
 garden:{light:'garden-dusk',atmosphere:'botanical',camera:['portrait','three-quarter-right','grand']},
 disco:{light:'disco-gems',atmosphere:'prism',camera:['portrait','three-quarter-left','three-quarter-right']}
});
export function allowedCamerasForScene(scene){return [...(DIRECTIONS[scene]||DIRECTIONS.atelier).camera]}
export function cinematicProfile(design){
 const setting=DIRECTIONS[design.scene]||DIRECTIONS.atelier;
 return {
  cameraMood:setting.camera.includes(design.cameraMood)?design.cameraMood:setting.camera[0],
  lightMood:setting.light,
  atmosphereMood:setting.atmosphere,
  accent:Math.max(0,Math.min(7,Number.isInteger(design.lightVariation)?design.lightVariation:0))
 };
}
export function cameraPose(profile){
 const positions={
  portrait:{x:0,y:1.05,z:11.25,targetY:.57,fov:38},
  'three-quarter-left':{x:-.38,y:1.08,z:11.32,targetY:.56,fov:38},
  'three-quarter-right':{x:.38,y:1.08,z:11.32,targetY:.56,fov:38},
  grand:{x:0,y:1.09,z:11.85,targetY:.58,fov:37}
 };
 return positions[profile.cameraMood]||positions.portrait;
}
export function lightingPalette(profile,theme){
 const configs={
  champagne:{key:'#fff0dc',rim:'#bbd4fc',fill:'#f0b7a0',keyPower:4.1,rimPower:3.0,fillPower:2.6,ambient:.77,exposure:1.17},
  'rose-softbox':{key:'#ffe6d9',rim:'#a4d9d9',fill:'#efabc4',keyPower:3.8,rimPower:2.8,fillPower:2.5,ambient:.88,exposure:1.13},
  'moon-silver':{key:'#d8dfff',rim:'#f8d59a',fill:'#8ca5ed',keyPower:3.6,rimPower:3.4,fillPower:2.2,ambient:.67,exposure:1.17},
  candlelight:{key:'#ffdfb4',rim:'#b2c9c8',fill:'#e5ae8e',keyPower:3.8,rimPower:2.8,fillPower:2.4,ambient:.81,exposure:1.14},
  'garden-dusk':{key:'#ffe6c3',rim:'#a4d6b6',fill:'#eac8a9',keyPower:3.8,rimPower:3.3,fillPower:2.3,ambient:.82,exposure:1.18},
  'disco-gems':{key:'#f9e0ff',rim:'#8bd4ee',fill:'#fa92d1',keyPower:3.5,rimPower:3.7,fillPower:2.5,ambient:.65,exposure:1.07}
 };
 return configs[profile.lightMood]||configs.champagne;
}
