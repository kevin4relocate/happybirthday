/**
 * Stable 10-second loop: 300 slots at 30 fps.
 *
 * Render and encode the first N-1 slots. Fill slot N-1 by cloning the
 * *encoded first keyframe*, not by re-encoding matching pixels.
 * The first and last decoded images thus have the exact same pixels.
 * Repeated playback holds the identical boundary frame for one interval.
 */
export function countFrames(fps,durationSeconds){
 if(!Number.isInteger(fps)||fps<1||!Number.isFinite(durationSeconds)||durationSeconds<=0)throw new RangeError('Invalid frame rate/duration');
 const count=Math.round(fps*durationSeconds);
 if(count<3)throw new RangeError('A seamless loop requires at least three frames');
 return count;
}
export function frameTimestampUs(index,fps){
 if(!Number.isInteger(index)||index<0||!Number.isInteger(fps)||fps<=0)throw new RangeError('Invalid frame time');
 return Math.round(index*1000000/fps);
}
export function loopFramePhase(index,total){
 if(!Number.isInteger(index)||!Number.isInteger(total)||index<0||index>=total||total<3)throw new RangeError('Invalid loop frame');
 return index===total-1?0:index/(total-1);
}
export function closeExactEncodedSeam(encoded,total,fps){
 if(!Array.isArray(encoded)||encoded.length!==total-1)throw new Error('Encoder output frame count is not exact');
 const ordered=[...encoded].sort((a,b)=>a.timestamp-b.timestamp);
 for(let i=0;i<ordered.length;i++){
   if(ordered[i].timestamp!==frameTimestampUs(i,fps))throw new Error('Unexpected encoder frame timestamp at '+i);
   if(!(ordered[i].data instanceof Uint8Array)||!ordered[i].data.length)throw new Error('Invalid encoded frame '+i);
 }
 const first=ordered[0];
 if(!first.key)throw new Error('First encoded frame must be a keyframe');
 ordered.push({timestamp:frameTimestampUs(total-1,fps),key:true,data:new Uint8Array(first.data)});
 return ordered;
}
