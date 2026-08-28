// FC runda 5 — niezalezna kontrola strukturalna main.ts (bez indexOf/heurystyk liniowych):
// prosty skaner znakowy z obsluga stringow/komentarzy/template-literali, liczacy glebokosc klamr.
const fs=require('fs');
const src=fs.readFileSync('src/main.ts','utf8');
// mapa offset->linia
const lineOf=(off)=>src.slice(0,off).split('\n').length;
// skan: zwraca dla kazdego offsetu czy jest w kodzie
function scan(){
  const marks=new Uint8Array(src.length); // 1 = kod
  let i=0,st='code',depthT=0;
  const stack=[];
  while(i<src.length){
    const c=src[i], c2=src.substr(i,2);
    if(st==='code'){
      if(c2==='//'){st='lc';i+=2;continue;}
      if(c2==='/*'){st='bc';i+=2;continue;}
      if(c==="'"){st='sq';i++;continue;}
      if(c==='"'){st='dq';i++;continue;}
      if(c==='`'){st='tpl';i++;continue;}
      marks[i]=1;i++;continue;
    }
    if(st==='lc'){ if(c==='\n')st='code'; i++; continue;}
    if(st==='bc'){ if(c2==='*/'){st='code';i+=2;continue;} i++; continue;}
    if(st==='sq'){ if(c==='\\'){i+=2;continue;} if(c==="'")st='code'; i++; continue;}
    if(st==='dq'){ if(c==='\\'){i+=2;continue;} if(c==='"')st='code'; i++; continue;}
    if(st==='tpl'){ if(c==='\\'){i+=2;continue;} if(c==='`')st='code'; i++; continue;}
  }
  return marks;
}
const marks=scan();
const results=[];
function ok(n,v,d){results.push([v?'OK':'BLAD',n,d]);return v;}

// 1. Znajdz WSZYSTKIE wystapienia klucza aiSurplusRedirectedOwners jako klucza literalu
//    i policz glebokosc klamr wzgledem najblizszego otaczajacego `meta: {`.
// Najpierw: znajdz `meta: {` w kodzie.
const metaIdxs=[];
{const re=/\bmeta\s*:\s*\{/g;let m;while((m=re.exec(src))){if(marks[m.index])metaIdxs.push(m.index+m[0].length-1);} }
ok('liczba `meta: {` w kodzie',metaIdxs.length>0,metaIdxs.map(o=>lineOf(o)).join(','));

// Dla kazdego meta: przejdz klamry i zbierz klucze na glebokosci 1
function keysAtDepth1(open){
  let d=0,i=open;const keys=[];
  let lineStartDepth1=[];
  for(;i<src.length;i++){
    if(!marks[i])continue;
    const c=src[i];
    if(c==='{'){d++;if(d===1)continue;}
    else if(c==='}'){d--;if(d===0){return {keys,end:i};}}
    else if(d===1){
      // kandydat na klucz: identyfikator poprzedzony , lub { i zakonczony :
      if(/[A-Za-z_$]/.test(c)){
        let j=i;while(j<src.length&&/[A-Za-z0-9_$]/.test(src[j]))j++;
        let k=j;while(k<src.length&&/\s/.test(src[k]))k++;
        if(src[k]===':'){
          // sprawdz poprzedni niebialy znak w kodzie
          let p=i-1;while(p>=0&&(!marks[p]||/\s/.test(src[p])))p--;
          if(src[p]==='{'||src[p]===','){keys.push({name:src.slice(i,j),line:lineOf(i)});}
        }
        i=j-1;
      }
    }
  }
  return {keys,end:-1};
}
let found=null;
for(const o of metaIdxs){
  const r=keysAtDepth1(o);
  if(r.keys.some(k=>k.name==='aiSurplusRedirectedOwners')){found={o,r};}
}
ok('klucz aiSurplusRedirectedOwners jest kluczem na GLEBOKOSCI 1 literalu `meta:`',!!found,
   found?`meta: { w linii ${lineOf(found.o)}, klucz w linii ${found.r.keys.find(k=>k.name==='aiSurplusRedirectedOwners').line}, koniec literalu linia ${lineOf(found.r.end)}`:'nie znaleziono');
if(found){
  const nb=['eliminatedOwners','typCityCopyOwners','aiPracaPoolByOwner','zdobyczePowerByOwner'];
  for(const n of nb){
    const k=found.r.keys.find(x=>x.name===n);
    ok(`sasiad ${n} tez na glebokosci 1 tego samego literalu`,!!k,k?`linia ${k.line}`:'brak');
  }
}
// 2. Odczyt: czy `saved.meta?.aiSurplusRedirectedOwners` lezy wewnatrz restoreGameFromSave
const fnRe=/function\s+restoreGameFromSave\s*\(/g;const fns=[];let mm;
while((mm=fnRe.exec(src))){if(marks[mm.index])fns.push(mm.index);}
ok('restoreGameFromSave zdefiniowana dokladnie raz',fns.length===1,`linie: ${fns.map(lineOf).join(',')}`);
if(fns.length===1){
  // znajdz otwierajaca klamre ciala
  let i=fns[0];let par=0;let bodyOpen=-1;
  for(;i<src.length;i++){if(!marks[i])continue;const c=src[i];
    if(c==='(')par++;else if(c===')'){par--;}
    else if(c==='{'&&par===0){bodyOpen=i;break;}}
  let d=0,end=-1;
  for(i=bodyOpen;i<src.length;i++){if(!marks[i])continue;const c=src[i];
    if(c==='{')d++;else if(c==='}'){d--;if(d===0){end=i;break;}}}
  const body=src.slice(bodyOpen,end);
  const bl=lineOf(bodyOpen),el=lineOf(end);
  ok('odczyt saved.meta?.aiSurplusRedirectedOwners wewnatrz restoreGameFromSave',
     /saved\.meta\?\.aiSurplusRedirectedOwners/.test(body),`cialo linie ${bl}..${el}`);
  ok('bezwarunkowy aiSurplusRedirectedOwners.clear() wewnatrz restoreGameFromSave',
     /aiSurplusRedirectedOwners\.clear\(\)/.test(body),'');
  // kolejnosc: clear PRZED petla add
  const ci=body.indexOf('aiSurplusRedirectedOwners.clear()');
  const ai=body.indexOf('aiSurplusRedirectedOwners.add(');
  ok('clear() poprzedza add() w restore',ci>=0&&ai>=0&&ci<ai,`clear@${ci} add@${ai}`);
}
// 3. Ile jest wywolan restoreGameFromSave( (nie definicji)
{const re=/restoreGameFromSave\s*\(/g;let m;const calls=[];
 while((m=re.exec(src))){if(!marks[m.index])continue;
   const pre=src.slice(Math.max(0,m.index-20),m.index);
   if(/function\s+$/.test(pre))continue;calls.push(lineOf(m.index));}
 ok('restoreGameFromSave ma dokladnie 1 wywolanie',calls.length===1,`linie: ${calls.join(',')}`);}
// 4. FC-2: czy blok ZASADY 3 jest w calosci wewnatrz `if (!opts.defensiveCopy) {`
{
  const anchor=src.indexOf('[AI] Zasada 3 (nadwyzka ulepszen)');
  ok('kotwica bloku ZASADY 3 znaleziona',anchor>0,`linia ${anchor>0?lineOf(anchor):'-'}`);
  // idz wstecz od kotwicy szukajac `if (!opts.defensiveCopy) {` z dopasowaniem klamr
  // metoda: od poczatku pliku licz glebokosc i zapamietaj stos otwarc, potem sprawdz
  let d=0;const stack=[];let encl=null;
  for(let i=0;i<anchor;i++){if(!marks[i])continue;const c=src[i];
    if(c==='{'){stack.push(i);}else if(c==='}'){stack.pop();}}
  // sprawdz kilka najblizszych otwarc czy poprzedza je if (!opts.defensiveCopy)
  const near=stack.slice(-6).reverse().map(o=>{
    let p=o-1;while(p>=0&&/\s/.test(src[p]))p--;
    return {open:o,line:lineOf(o),pre:src.slice(Math.max(0,p-60),p+1).replace(/\s+/g,' ').trim()};
  });
  const hit=near.find(n=>/if\s*\(\s*!\s*opts\.defensiveCopy\s*\)$/.test(n.pre));
  ok('blok ZASADY 3 leczy WEWNATRZ if (!opts.defensiveCopy)',!!hit,
     hit?`straznik otwarty w linii ${hit.line}`:'najblizsze otwarcia: '+near.map(n=>n.line+':'+n.pre.slice(-40)).join(' | '));
  // czy blok CUDA-AI uzywa tego samego warunku
  const cuda=src.indexOf('CUDA-AI (Maciej C-CUDA-AI=A');
  if(cuda>0){
    const seg=src.slice(cuda,cuda+3000);
    ok('sasiedni blok CUDA-AI uzywa dokladnie tego samego warunku',/if\s*\(\s*!\s*opts\.defensiveCopy\s*\)/.test(seg),`CUDA-AI linia ${lineOf(cuda)}`);
  }
}
// 5. opts.defensiveCopy pochodzi z typCityCopyOwners
{
  const re=/defensiveCopy\s*:\s*typCityCopyOwners\.has\(ownerId\)/g;let m;const ls=[];
  while((m=re.exec(src))){if(marks[m.index])ls.push(lineOf(m.index));}
  ok('defensiveCopy = typCityCopyOwners.has(ownerId) (miasta-panstwa)',ls.length>0,`linie: ${ls.join(',')}`);
}
// 6. Nowa gra: clear() w applyClusterStartPlan / bloku startowym
{
  const i=src.indexOf('aiSurplusRedirectedOwners.clear()');
  // znajdz otaczajaca funkcje
  ok('clear() na starcie nowej gry obok eliminatedOwners.clear()',
     /eliminatedOwners\.clear\(\);\s*(?:\/\/[^\n]*\n\s*)*aiSurplusRedirectedOwners\.clear\(\);/.test(src),
     `pierwszy clear w linii ${lineOf(i)}`);
}
let bad=0;
for(const [s,n,d] of results){console.log(`${s.padEnd(4)} ${n}${d?'  ['+d+']':''}`);if(s==='BLAD')bad++;}
console.log(`\nWYNIK: ${results.length-bad}/${results.length} OK, ${bad} BLAD`);
process.exit(bad?1:0);
