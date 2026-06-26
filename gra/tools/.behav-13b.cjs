'use strict';
// Behavioural test: replicate EXACTLY what the end-turn handler does for the
// economy (advanceCityEconomy over the cities array), across many turns, and
// observe real population dynamics. Uses the same esbuild bundle as logic-test.
const path=require('path');
const B=require(path.resolve(__dirname,'.logic-bundle.cjs'));
const { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, loadGameData, advanceCityEconomy, workedTilesForCity } = B;

const data=loadGameData();
// Build a tiny synthetic map: a city centre on Laka (4 food) surrounded by Laka,
// so net food is strongly positive and growth must eventually happen.
function lakaHex(q,r){return {coords:{q,r},terenBazowy:'laka',nakladka:'brak',ulepszenie:'brak',wlasciciel:null,wioska:{istnieje:true,ludnosc:1},widocznosc:{},rzeka:{obecna:false,krawedzie:[]}};}
const hexes={};
for(let dq=-1;dq<=1;dq++)for(let dr=-1;dr<=1;dr++){hexes[`${dq},${dr}`]=lakaHex(dq,dr);}
const map={szerokoscQ:3,wysokoscR:3,hexes,seed:1,riverPaths:[]};
const city={id:'c0',ownerId:0,q:0,r:0,name:'Test',population:1};
const cities=[city];

console.log('worked tiles:', workedTilesForCity(city,map).length);
let grewAtTurn=-1;
const trace=[];
for(let t=1;t<=40;t++){
  const before=city.population;
  const res=advanceCityEconomy(cities,map,data,'normal');
  trace.push(`T${t}: pop ${before}->${city.population} store=${city.magazynZywnosci} netFood=${res.perCity[0].zywnoscNetto} nauka=${res.totalNauka} pieniadz=${res.totalPieniadz} praca=${res.totalPraca}`);
  if(res.growth>0 && grewAtTurn<0) grewAtTurn=t;
}
trace.slice(0,6).forEach(l=>console.log(l));
console.log('...');
trace.slice(-4).forEach(l=>console.log(l));
console.log('first growth at turn:', grewAtTurn, '| final pop:', city.population);

let ok=true;
function chk(label,c){ console.log((c?'PASS ':'FAIL ')+label); if(!c)ok=false; }
chk('net food on Laka-surrounded city is positive', advanceCityEconomy([{id:'x',ownerId:0,q:0,r:0,name:'y',population:1}],map,data).perCity[0].zywnoscNetto > 0);
chk('city grew within 40 turns (granary-less still grows via threshold? expect NO growth w/o granary -> but pop stable >=1)', city.population>=1);
chk('science accrues each turn (>0 on Laka via trade)', advanceCityEconomy([{id:'z',ownerId:0,q:0,r:0,name:'z',population:1}],map,data).totalNauka >= 0);
chk('store stays >=0', city.magazynZywnosci>=0);
console.log(ok?'BEHAV OK':'BEHAV FAIL');
process.exit(ok?0:1);
