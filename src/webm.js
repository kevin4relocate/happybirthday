/**
 * Tiny, dependency-free WebM EBML muxer for a single VP8 / VP9 video track.
 * Input: WebCodecs EncodedVideoChunks, already encoded with explicit timestamps.
 * Timecode scale is 1 millisecond, clusters are at most 30 seconds.
 */
const ID={
 EBML:0x1a45dfa3,Segment:0x18538067,Info:0x1549a966,Tracks:0x1654ae6b,
 TrackEntry:0xae,Video:0xe0,Cluster:0x1f43b675,SimpleBlock:0xa3,
 Timecode:0xe7,TimecodeScale:0x2ad7b1,Duration:0x4489,
 MuxingApp:0x4d80,WritingApp:0x5741,TrackNumber:0xd7,TrackUID:0x73c5,
 TrackType:0x83,CodecID:0x86,PixelWidth:0xb0,PixelHeight:0xba,
 EBMLVersion:0x4286,EBMLReadVersion:0x42f7,EBMLMaxIDLength:0x42f2,
 EBMLMaxSizeLength:0x42f3,DocType:0x4282,DocTypeVersion:0x4287,
 DocTypeReadVersion:0x4285
};
const ascii=s=>new TextEncoder().encode(String(s));
function bytes(...chunks){
 let size=0;for(const chunk of chunks)size+=chunk.length;
 const result=new Uint8Array(size);let off=0;
 for(const chunk of chunks){result.set(chunk,off);off+=chunk.length}
 return result;
}
function integer(n,min=1){
 n=BigInt(n);
 let count=min;
 while(n >= (1n << BigInt(count*8)))count++;
 const out=new Uint8Array(count);
 for(let i=count-1;i>=0;i--){out[i]=Number(n&255n);n>>=8n}
 return out;
}
function id(n){let v=n,count=1;while(v>255){count++;v=Math.floor(v/256)}return integer(n,count)}
function sizeVint(size){
 const n=BigInt(size);
 for(let width=1;width<=8;width++){
  if(n<(1n<<BigInt(width*7))-1n){
   const b=integer(n,width);
   b[0]|=1 << (8-width);
   return b;
  }
 }
 throw new Error('EBML element exceeds supported size');
}
function float64(number){const view=new DataView(new ArrayBuffer(8));view.setFloat64(0,number,false);return new Uint8Array(view.buffer)}
function element(key,payload){const body=payload instanceof Uint8Array?payload:bytes(...payload);return bytes(id(key),sizeVint(body.length),body)}
const uint=(key,num)=>element(key,integer(num));
const utf=(key,s)=>element(key,ascii(s));
function block(relativeMs,frame,keyframe){
 const time=relativeMs<0?65536+relativeMs:relativeMs;
 if(relativeMs<-32768||relativeMs>32767)throw new Error('WebM cluster too long');
 const header=new Uint8Array([0x81,(time>>8)&255,time&255,keyframe?0x80:0x00]);
 return element(ID.SimpleBlock,bytes(header,frame));
}
export function muxWebM({width,height,durationSeconds,codec,frames}){
 if(!Array.isArray(frames)||!frames.length)throw new Error('Cannot mux an empty video');
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1)throw new Error('Invalid video dimensions');
 const codecId=String(codec).toLowerCase().startsWith('vp09')?'V_VP9':'V_VP8';
 const header=element(ID.EBML,[
   uint(ID.EBMLVersion,1),uint(ID.EBMLReadVersion,1),
   uint(ID.EBMLMaxIDLength,4),uint(ID.EBMLMaxSizeLength,8),
   utf(ID.DocType,'webm'),uint(ID.DocTypeVersion,4),uint(ID.DocTypeReadVersion,2)
 ]);
 const info=element(ID.Info,[
   uint(ID.TimecodeScale,1000000),
   element(ID.Duration,float64(durationSeconds*1000)),
   utf(ID.MuxingApp,'Birthday Studio V2'),
   utf(ID.WritingApp,'Birthday Studio V2')
 ]);
 const track=element(ID.TrackEntry,[
   uint(ID.TrackNumber,1),uint(ID.TrackUID,1),uint(ID.TrackType,1),
   utf(ID.CodecID,codecId),element(ID.Video,[
     uint(ID.PixelWidth,width),uint(ID.PixelHeight,height)
   ])
 ]);
 const tracks=element(ID.Tracks,[track]);
 const clusters=[];
 let startMs=0,blocks=[];
 const flush=()=>{
  if(!blocks.length)return;
  clusters.push(element(ID.Cluster,[uint(ID.Timecode,startMs),...blocks]));
  blocks=[];
 };
 for(const frame of frames){
   const frameMs=Math.round(frame.timestamp/1000);
   if(!Number.isFinite(frameMs)||frameMs<0)throw new Error('Invalid WebCodecs frame time');
   if(frameMs-startMs>30000){flush();startMs=frameMs}
   blocks.push(block(frameMs-startMs,frame.data,!!frame.key));
 }
 flush();
 const segment=element(ID.Segment,[info,tracks,...clusters]);
 return new Blob([header,segment],{type:'video/webm'});
}
