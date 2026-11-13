'use strict';
/**
 * node tools/city-name-unique-forever-test.cjs  (opcjonalnie GRA_ROOT=<kopia gra> do porownania PRZED)
 * R-WEB-CITY-NAME-UNIQUE-FOREVER-Q1 — nazwa miasta zuzyta raz jest zuzyta na zawsze (globalnie w grze).
 * Prawdziwy kod: pickAiFoundCityName / suggestPlayerFoundCityName / pickNextCityName z civ-names.
 */
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const os = require('os');

const GRA = process.env.GRA_ROOT ? path.resolve(process.env.GRA_ROOT) : path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cnuf-'));
const entry = path.join(tmp, 'entry.ts');
const bundle = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry, `
export { pickAiFoundCityName, suggestPlayerFoundCityName, pickNextCityName } from ${JSON.stringify(path.join(GRA, 'src/game/civ-names'))};
export { collectUsedCityNamesFromCities } from ${JSON.stringify(path.join(GRA, 'src/game/city-names-pool'))};
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
const pools = JSON.parse(fs.readFileSync(path.join(GRA, 'data/city-names-pools.json'), 'utf8'));

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL', m); } else console.log('ok  ', m); }

// owner -> civ (mutowalne: eliminacja/odrodzenie)
const civ = new Map([[0, 'rzymianie'], [1, 'grecy'], [2, 'egipt'], [3, 'rzymianie']]);
const civOf = o => civ.get(o) ?? 'rzymianie';
const first = pools.rzymianie.miasta_cywilizacji[0];

function foundAi(cities, owner) {
  const name = M.pickAiFoundCityName(pools, civOf(owner), cities, civOf, owner);
  cities.push({ id: 'city' + cities.length, ownerId: owner, name });
  return name;
}

// 1. miasto utracone -> nastepne miasto tej cywilizacji nie dostaje tej samej nazwy
{
  const cities = [];
  const n1 = foundAi(cities, 0);
  cities[0].ownerId = 1; // zdobyte przez Grekow (nazwa zostaje u nowego wlasciciela)
  const n2 = foundAi(cities, 0);
  ok(n1 === first, `pierwsza nazwa = ${first}`);
  ok(cities[0].name === n1, 'zdobyte miasto zachowuje nazwe');
  ok(n2 !== n1, `utrata miasta: kolejne miasto bierze nastepna nazwe (${n2} != ${n1})`);
}
// 2. suggest gracza po utracie stolicy
{
  const cities = [{ id: 'city0', ownerId: 0, name: first }];
  cities[0].ownerId = 2;
  const s = M.suggestPlayerFoundCityName(pools, 'rzymianie', cities, civOf, 0);
  ok(s !== first, `gracz po utracie stolicy: podpowiedz != ${first} (${s})`);
}
// 3. dwie cywilizacje z ta sama nazwa w puli nie dubluja (Teby: grecy, egipt)
{
  const shared = pools.grecy.miasta_cywilizacji.filter(n => pools.egipt.miasta_cywilizacji.includes(n));
  const cities = [];
  let dup = 0;
  for (let i = 0; i < 40; i++) { foundAi(cities, 1); foundAi(cities, 2); }
  const seen = new Set();
  for (const c of cities) { if (seen.has(c.name)) dup++; seen.add(c.name); }
  ok(shared.length > 0 && dup === 0, `grecy+egipt (wspolnych nazw w puli: ${shared.length}) bez duplikatow (${dup})`);
}
// 4. eliminacja i odrodzenie
{
  const cities = [];
  const lost = [foundAi(cities, 0), foundAi(cities, 0), foundAi(cities, 0)];
  for (const c of cities) c.ownerId = 1; // eliminacja owner 0
  const reborn = [foundAi(cities, 3), foundAi(cities, 3)]; // ta sama civ, nowy owner
  ok(reborn.every(n => !lost.includes(n)), `odrodzenie nie powtarza zuzytych (${lost} | ${reborn})`);
}
// 5. wyczerpanie puli: fallback sufiksowany, wciaz unikalny
{
  const cities = [];
  for (let i = 0; i < 125; i++) foundAi(cities, 0);
  const names = cities.map(c => c.name);
  ok(new Set(names).size === names.length, 'wyczerpanie puli (125 miast): zero duplikatow');
  ok(/ II$/.test(names[110]), `po 110 nazwach sufiks (${names[110]})`);
}
// 6. zapis/odczyt: stan tylko w cities -> JSON round-trip daje ten sam wybor
{
  const cities = []; foundAi(cities, 0); foundAi(cities, 0); cities[0].ownerId = 1;
  const loaded = JSON.parse(JSON.stringify(cities));
  const a = M.pickAiFoundCityName(pools, 'rzymianie', cities, civOf, 0);
  const b = M.pickAiFoundCityName(pools, 'rzymianie', loaded, civOf, 0);
  ok(a === b && a !== cities[0].name && a !== cities[1].name, `save/load: ten sam wybor po round-trip (${a})`);
}
// 7. determinizm
{
  const run = () => {
    const c = []; const out = [];
    for (let i = 0; i < 30; i++) { out.push(foundAi(c, i % 4)); if (i % 5 === 4) c[0].ownerId = (c[0].ownerId + 1) % 4; }
    return out.join('|');
  };
  ok(run() === run(), 'determinizm sekwencji nazw');
}
// 8. mutacja: stary kolektor per-civ (filtr po biezacym wlascicielu) ujawnia blad — test jest czuly
{
  const cities = [{ id: 'city0', ownerId: 1, name: first }];
  const oldUsed = M.collectUsedCityNamesFromCities(cities, civOf, 'rzymianie');
  const mutant = M.pickNextCityName(pools, 'rzymianie', oldUsed);
  ok(mutant === first, 'mutacja (per-civ zywe miasta) ponownie wydaje utracona nazwe -> test wykrywa regresje');
}
// 9. pomiar: symulacja 3 ziarna x 150 tur (zdarzenia zakladania/zdobywania, prawdziwe pickery)
{
  let totalDup = 0, totalCities = 0;
  for (const seed of [1, 2, 3]) {
    let s = (seed * 2654435761) >>> 0;
    const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
    const cities = []; const everNamed = new Set(); let dupNames = 0;
    ['rzymianie', 'grecy', 'egipt', 'rzymianie'].forEach((c, o) => civ.set(o, c));
    for (let t = 0; t < 150; t++) {
      for (let o = 0; o < 4; o++) if (rnd() < 0.12) {
        const nm = M.pickAiFoundCityName(pools, civOf(o), cities, civOf, o);
        cities.push({ id: 'c' + cities.length, ownerId: o, name: nm });
        if (everNamed.has(nm)) dupNames++;
        everNamed.add(nm);
      }
      if (cities.length && rnd() < 0.15) cities[Math.floor(rnd() * cities.length)].ownerId = Math.floor(rnd() * 4);
    }
    totalDup += dupNames; totalCities += cities.length;
    console.log(`seed ${seed}: miast ${cities.length}, duplikaty nazw ${dupNames}`);
  }
  ok(totalDup === 0, `symulacja 3x150 tur: duplikaty nazw = ${totalDup} (miast lacznie ${totalCities})`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(fails ? `FAIL (${fails})` : 'PASS');
process.exit(fails ? 1 : 0);
