// Original, deterministic sound design for Hatcheat. No recordings or third-party samples.
import { mkdir, writeFile } from 'node:fs/promises';
const rate = 32000, tau = Math.PI * 2;
const destination = new URL('../assets/audio/', import.meta.url);
await mkdir(destination, { recursive:true });
function render(duration, design) {
  let seed = 19731018, low = 0;
  const samples = new Float64Array(Math.ceil(duration*rate));
  for (let i=0; i<samples.length; i++) {
    seed = (Math.imul(seed,1664525)+1013904223)>>>0;
    const white = seed/2147483648-1;
    low += .13*(white-low);
    const t=i/rate;
    const edge=Math.min(1,t/.008,(duration-t)/.035);
    samples[i]=design(t,white,low)*Math.max(0,edge);
  }
  // Quiet, click-free mono PCM; peak at -15 dBFS, not a full-volume UI alert.
  const peak=samples.reduce((m,s)=>Math.max(m,Math.abs(s)),0), scale=.18/Math.max(peak,.001);
  const wav=Buffer.alloc(44+samples.length*2);
  wav.write('RIFF'); wav.writeUInt32LE(wav.length-8,4); wav.write('WAVEfmt ',8);
  wav.writeUInt32LE(16,16); wav.writeUInt16LE(1,20); wav.writeUInt16LE(1,22);
  wav.writeUInt32LE(rate,24); wav.writeUInt32LE(rate*2,28); wav.writeUInt16LE(2,32); wav.writeUInt16LE(16,34);
  wav.write('data',36); wav.writeUInt32LE(samples.length*2,40);
  samples.forEach((v,i)=>wav.writeInt16LE(Math.round(v*scale*32767),44+i*2));
  return wav;
}
const swell=(t,at,width)=>Math.exp(-(((t-at)/width)**2));
const sounds={
  'paper-fold':[.62,(t,w,l)=>(w-l)*.24*(swell(t,.12,.045)+.7*swell(t,.32,.07)+.45*swell(t,.49,.055))+l*.18*swell(t,.28,.16)],
  'paper-glide':[.44,(t,w,l)=>l*.65*Math.sin(Math.PI*t/.44)**2+(w-l)*.035*swell(t,.22,.1)],
  'haechi-bite':[.19,(t,w,l)=>Math.sin(tau*(190*t-160*t*t))*Math.exp(-t*28)*.27+l*.45*Math.exp(-t*22)+(w-l)*.05*swell(t,.025,.015)],
  'settle':[.85,(t,w,l)=>(Math.sin(tau*392*t)+.38*Math.sin(tau*588*t))*Math.exp(-t*6)*Math.min(t/.025,1)*.15+l*.035*swell(t,.22,.17)],
  'ink-grind':[.27,(t,w,l)=>l*.8*Math.sin(Math.PI*t/.27)**1.4*(.7+.3*Math.sin(tau*33*t))+(w-l)*.025],
  'page-open':[.32,(t,w,l)=>(w-l)*.14*swell(t,.1,.055)+l*.35*swell(t,.18,.08)],
  'card-reveal':[.9,(t,w,l)=>l*.3*swell(t,.09,.05)+[523.25,659.25,783.99].reduce((v,f,i)=>{const d=t-.12-i*.085;return v+(d<0?0:Math.sin(tau*f*d)*Math.min(d/.015,1)*Math.exp(-d*8)*.09);},0)]
};
for(const [name,[duration,design]] of Object.entries(sounds)) await writeFile(new URL(name+'.wav',destination),render(duration,design));
console.log(`Generated ${Object.keys(sounds).length} original, mono PCM effects.`);
