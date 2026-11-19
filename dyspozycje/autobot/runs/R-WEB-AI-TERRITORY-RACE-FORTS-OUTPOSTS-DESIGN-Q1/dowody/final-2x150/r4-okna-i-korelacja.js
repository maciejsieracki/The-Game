const fs=require('fs');
for(const s of [4242,7]){
 const L=fs.readFileSync(`/tmp/territory-final/seed${s}-terytorium.csv`,'utf8').trim().split('\n');
 const h=L[0].split(',');const rows=L.slice(1).map(l=>{const v=l.split(',').map(Number);const o={};h.forEach((k,i)=>o[k]=v[i]);return o;});
 const byT={};for(const r of rows){(byT[r.tura]=byT[r.tura]||[]).push(r);}
 const civ=o=>o>=1&&o<=37&&(o%3===1);
 const agg=(t,f)=>{const a=(byT[t]||[]).filter(f);const S=k=>a.reduce((x,r)=>x+r[k],0);return {n:a.length,miasta:S('miasta'),teryt:S('hexyTerytorium'),zMiast:S('hexyZMiast'),zFP:S('hexyZFortowPosterunkow'),forty:S('forty'),post:S('posterunki')};};
 console.log('=== seed',s,'civ owners present t2:',[...Array(13)].map((_,i)=>1+3*i).every(o=>(byT[2]||[]).some(r=>r.wlasciciel===o)),'civ rows t150',(byT[150]||[]).filter(r=>civ(r.wlasciciel)).length);
 console.log('t | civ teryt | civ zFP | civ miasta | civ forty | civ post | all!=0 teryt | all!=0 zFP');
 const ctl={};
 for(let t=10;t<=150;t+=10){const a=agg(t,r=>r.wlasciciel!==0&&civ(r.wlasciciel));const b=agg(t,r=>r.wlasciciel!==0);ctl[t]={a,b};console.log(t,a.teryt,a.zFP,a.miasta,a.forty,a.post,'|',b.teryt,b.zFP);}
 for(const [nm,key] of [['all','b'],['civ','a']]){let sat=null;const ts=Object.keys(ctl).map(Number).sort((x,y)=>x-y);
  for(let i=1;i+2<ts.length&&sat===null;i++){let ok=true;for(let j=i;j<i+3;j++){const d=(ctl[ts[j]][key].teryt-ctl[ts[j-1]][key].teryt)/ctl[ts[j-1]][key].teryt;if(!(Math.abs(d)<0.01))ok=false;}if(ok)sat=ts[i-1];}
  console.log(s,nm,'saturation: first t with 3 following 10-turn steps each <1%:',sat);}
 for(const [a,b] of [[30,60],[60,90],[30,90]]){const x=ctl[a].b,y=ctl[b].b;console.log(s,'window',a,b,'dTeryt',y.teryt-x.teryt,'dZFP',y.zFP-x.zFP,'share',((y.zFP-x.zFP)/(y.teryt-x.teryt)*100).toFixed(1)+'%','zFP at',a,x.zFP,'at',b,y.zFP,'share of total at',b,(y.zFP/y.teryt*100).toFixed(1)+'%');}
 let pk=0,pt=0;for(let t=2;t<=150;t++){const b=agg(t,r=>r.wlasciciel!==0&&civ(r.wlasciciel));const sh=b.zFP/b.teryt;if(sh>pk){pk=sh;pt=t;}}console.log(s,'peak civ share zFP',(pk*100).toFixed(2)+'%','t',pt);
 const rows2=[];
 for(let o=1;o<=37;o+=3){let ft=null;for(let t=2;t<=150;t++){const r=(byT[t]||[]).find(r=>r.wlasciciel===o);if(r&&r.forty+r.posterunki>0){ft=t;break;}}
  const g=t=>(byT[t]||[]).find(r=>r.wlasciciel===o);
  rows2.push({o,first:ft,t30:g(30)?.hexyTerytorium,t90:g(90)?.hexyTerytorium,t150:g(150)?.hexyTerytorium,m30:g(30)?.miasta,m90:g(90)?.miasta});}
 console.log(JSON.stringify(rows2));
 const early=rows2.filter(r=>r.first!==null&&r.first<=50),late=rows2.filter(r=>r.first===null||r.first>50);
 const mean=(a,f)=>a.length?(a.reduce((x,r)=>x+f(r),0)/a.length):NaN;
 const d=r=>(r.t90||0)-(r.t30||0);
 const pearson=(xs,ys)=>{const n=xs.length,mx=xs.reduce((a,b)=>a+b)/n,my=ys.reduce((a,b)=>a+b)/n;let sxy=0,sx=0,sy=0;xs.forEach((x,i)=>{sxy+=(x-mx)*(ys[i]-my);sx+=(x-mx)**2;sy+=(ys[i]-my)**2});return sxy/Math.sqrt(sx*sy);};
 console.log(s,'early(<=t50) n',early.length,'late n',late.length,'mean d30-90 early',mean(early,d).toFixed(0),'late',mean(late,d).toFixed(0),'mean t150 early',mean(early,r=>r.t150).toFixed(0),'late',mean(late,r=>r.t150).toFixed(0),'mean miasta90 early',mean(early,r=>r.m90).toFixed(1),'late',mean(late,r=>r.m90).toFixed(1));
 const ok=rows2.filter(r=>r.first!==null);console.log(s,'pearson first-turn vs t150 (n='+ok.length+')',pearson(ok.map(r=>r.first),ok.map(r=>r.t150)).toFixed(2),'vs d30-90',pearson(ok.map(r=>r.first),ok.map(d)).toFixed(2),'vs miasta90',pearson(ok.map(r=>r.first),ok.map(r=>r.m90)).toFixed(2));
 const fs_=rows2.map(r=>r.first).filter(x=>x!==null).sort((a,b)=>a-b);console.log(s,'first sorted',fs_.join(','),'median',fs_[Math.floor(fs_.length/2)]);
}
