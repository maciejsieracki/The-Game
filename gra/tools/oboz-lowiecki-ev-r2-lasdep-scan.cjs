'use strict';
// EV3 scratch (NIE bramka): dla ktorych kluczy nakladka Las jest WARUNKIEM kwalifikacji?
// Metoda behawioralna przez PELNY qualifier (createQualifier -> qualifies), nie przez grep
// i nie przez sam gate commitu. Dla kazdego heksa mapy z generateMap porownujemy
// qualifies(key) przy nakladce Las vs po zdjeciu lasu (Brak) na TYM SAMYM heksie.
const path = require('path'); const fs = require('fs');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const SRC = path.resolve(__dirname, '..', 'src');
const E = path.resolve(__dirname, '.oboz-ev3-lasdep-entry.ts');
const B = path.resolve(__dirname, '.oboz-ev3-lasdep-bundle.cjs');
fs.writeFileSync(E, `
export { buildImprovementQualifier } from ${JSON.stringify(SRC + '/map/improvement-build')};
export { generateMap } from ${JSON.stringify(SRC + '/map/generator')};
export { TerenBazowy, Nakladka } from ${JSON.stringify(SRC + '/types/hex')};
`, 'utf8');
esbuild.buildSync({ entryPoints:[E], bundle:true, outfile:B, platform:'node', format:'cjs', target:'node18', logLevel:'silent' });
const M = require(B);
const { TerenBazowy: T, Nakladka: N } = M;
const data = JSON.parse(fs.readFileSync(path.resolve(__dirname,'..','data','terrain-improvements.json'),'utf8'));
const keys = Object.keys(data).filter(k => k !== '_meta' && !k.startsWith('_'));
const ALL_TECH = new Set(['lowiectwo','Łowiectwo','rolnictwo','Rolnictwo','gornictwo','Gornictwo','Górnictwo',
  'ceramika','Ceramika','budownictwo','Budownictwo','kolo','Koło','zeglarstwo','Żeglarstwo','brazownictwo',
  'obrobka_kamienia','hodowla','Hodowla','stolarstwo','Stolarstwo','jezdziectwo','irygacja','Irygacja','tarasy']);
function stateFor(map) {
  const nodes = [];
  for (const k of Object.keys(map.hexes)) {
    const h = map.hexes[k]; if (!h) continue;
    nodes.push({ q: h.coords.q, r: h.coords.r, ownerId: 0, cityId: 'c0' });
  }
  return { map, cityNodes: [{ q: 0, r: 0, pop: 9, level: 5 }], territoryNodes: nodes,
    playerOwnerIdNum: 0, placedImprovements: new Map(), researchedTechs: ALL_TECH, playerEra: 5 };
}
const wynik = {};
for (const seed of [90210, 777, 31415]) {
  const map = M.generateMap(36, 28, seed, 'kontynenty');
  const lasKeys = Object.keys(map.hexes).filter(k => map.hexes[k] && map.hexes[k].nakladka === N.Las);
  const qLas = M.buildImprovementQualifier(stateFor(map));
  const przed = {};
  for (const key of keys) { przed[key] = lasKeys.map(hk => qLas(key, map.hexes[hk].coords.q, map.hexes[hk].coords.r)); }
  for (const hk of lasKeys) map.hexes[hk].nakladka = N.Brak;   // wyrab na calej mapie
  const qBrak = M.buildImprovementQualifier(stateFor(map));
  for (const key of keys) {
    const po = lasKeys.map(hk => qBrak(key, map.hexes[hk].coords.q, map.hexes[hk].coords.r));
    const w = wynik[key] || (wynik[key] = { traciKwalifikacje: 0, zyskuje: 0, bezZmian: 0 });
    for (let i = 0; i < po.length; i++) {
      if (przed[key][i] && !po[i]) w.traciKwalifikacje++;
      else if (!przed[key][i] && po[i]) w.zyskuje++;
      else w.bezZmian++;
    }
  }
}
console.log('kluczy: ' + keys.length + ' · 3 mapy z generateMap, wszystkie heksy z Lasem');
console.log('\n--- LAS JEST WARUNKIEM (po zdjeciu lasu klucz TRACI kwalifikacje na tym heksie) ---');
const zal = Object.entries(wynik).filter(([,v]) => v.traciKwalifikacje > 0);
for (const [k,v] of zal) console.log(`  ${k}: traci=${v.traciKwalifikacje} zyskuje=${v.zyskuje} bezZmian=${v.bezZmian}`);
console.log('\n--- reszta (Las nieistotny albo blokujacy) ---');
for (const [k,v] of Object.entries(wynik)) if (v.traciKwalifikacje === 0) console.log(`  ${k}: zyskuje=${v.zyskuje} bezZmian=${v.bezZmian}`);
