import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const A = process.argv[2];
const faces = [['CivLiberationSans','400','fonts/LiberationSans-Regular.ttf'],['CivLiberationSans','700','fonts/LiberationSans-Bold.ttf'],['CivDejaVuSans','400','fonts/DejaVuSans.ttf'],['CivNotoEmoji','400','emoji/NotoColorEmoji-civ-subset.ttf']].map(([f,w,p])=>[f,w,readFileSync(A+p).toString('base64')]);
const b = await chromium.launch({ args: ['--disable-gpu','--force-color-profile=srgb','--font-render-hinting=none'] });
const pg = await b.newPage();
const r = await pg.evaluate(async (faces) => {
  for (const [fam,w,b64] of faces){const f=new FontFace(fam,Uint8Array.from(atob(b64),c=>c.charCodeAt(0)),{weight:w});await f.load();document.fonts.add(f);}
  const out=[];
  const mass=(ctx)=>{const d=ctx.getImageData(0,0,80,60).data;const s=[0,0,0,0];for(let i=0;i<d.length;i+=4)for(let k=0;k<4;k++)s[k]+=d[i+k];return s;};
  const probe=(name,fn)=>{const c=document.createElement('canvas');c.width=80;c.height=60;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.font='40px CivLiberationSans, CivDejaVuSans, CivNotoEmoji';ctx.textBaseline='middle';fn(ctx);out.push([name,...mass(ctx)]);};
  const g=(c,a0,a1)=>{const gr=c.createLinearGradient(0,0,80,0);gr.addColorStop(0,`rgba(255,0,0,${a0})`);gr.addColorStop(1,`rgba(0,0,255,${a1})`);return gr;};
  probe('fill_opaque',c=>{c.fillStyle='#0000ff';c.fillText('🔥',10,30);});
  probe('fill_alpha_0.5',c=>{c.fillStyle='rgba(0,0,255,0.5)';c.fillText('🔥',10,30);});
  probe('fill_grad_opaque',c=>{c.fillStyle=g(c,1,1);c.fillText('🔥',10,30);});
  probe('fill_grad_0.5',c=>{c.fillStyle=g(c,0.5,0.5);c.fillText('🔥',10,30);});
  probe('fill_grad_0_to_1',c=>{c.fillStyle=g(c,0,1);c.fillText('🔥',10,30);});
  probe('fill_grad_0',c=>{c.fillStyle=g(c,0,0);c.fillText('🔥',10,30);});
  probe('stroke_grad_0.5',c=>{c.strokeStyle=g(c,0.5,0.5);c.lineWidth=3;c.strokeText('🔥',10,30);});
  probe('stroke_opaque',c=>{c.strokeStyle='#f00';c.lineWidth=3;c.strokeText('🔥',10,30);});
  return out;
}, faces);
for (const x of r) console.log(x.join('\t'));
await b.close();
