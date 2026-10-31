const path=require('path'),fs=require('fs');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const SQRT3=Math.sqrt(3);
function axialToWorld(q,r){return {x:SQRT3*(q+r*0.5),z:1.5*r};}
function hexToPixel(q,r,cam,W,H){
 const el=52*Math.PI/180;
 const C={x:cam.x,y:cam.dist*Math.sin(el),z:cam.z+cam.dist*Math.cos(el)};
 const T={x:cam.x,y:0,z:cam.z};
 const norm=v=>{const l=Math.hypot(v.x,v.y,v.z);return {x:v.x/l,y:v.y/l,z:v.z/l}};
 const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z});
 const cross=(a,b)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
 const dot=(a,b)=>a.x*b.x+a.y*b.y+a.z*b.z;
 const fwd=norm(sub(T,C));const right=norm(cross(fwd,{x:0,y:1,z:0}));const up=cross(right,fwd);
 const w=axialToWorld(q,r);const P=sub({x:w.x,y:0,z:w.z},C);
 const xv=dot(P,right),yv=dot(P,up),zv=dot(P,fwd);
 const f=1/Math.tan((50*Math.PI/180)/2);const aspect=W/H;
 return {x:(f/aspect*xv/zv*0.5+0.5)*W,y:(-f*yv/zv*0.5+0.5)*H,ok:zv>0.1};
}
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function launch(){return chromium.launch({headless:true,executablePath:'/opt/pw-browsers/chromium',args:['--no-sandbox','--use-gl=swiftshader','--enable-unsafe-swiftshader','--allow-file-access-from-files']});}
module.exports={hexToPixel,wait,launch,path,fs};
