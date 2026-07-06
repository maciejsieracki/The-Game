'use strict';
/** Domyślne Panel-E vs maks. mp/klaster (reguły 3 hex mp, 5 hex od stolicy gracza). */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ENTRY = path.resolve(__dirname, '.map-capacity-defaults-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-capacity-defaults-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { generujSwiat } from '../src/map/generator';
export { computeClusters } from '../src/map/clusters';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const eStart = require('../data/e-start-params.json');

const SEEDS = [1, 42, 2026];
const TYP = 'kontynenty';

function maxCitiesPerCluster(map, nTypow, seeds) {
  let best = 1;
  for (let target = 2; target <= 30; target++) {
    let ok = true;
    for (const seed of seeds) {
      const cp = M.computeClusters(map, {
        seed,
        aktywneTypy: nTypow,
        rywaleNaKlaster: target - 1,
        minDystansKlastrow: 12,
      });
      const minGot = Math.min(...cp.klastry.map(k => k.miasta.length));
      if (minGot < target) { ok = false; break; }
    }
    if (ok) best = target;
    else break;
  }
  return best;
}

function actualAtDefault(map, nTypow, mpDefault, seed) {
  const cp = M.computeClusters(map, {
    seed,
    aktywneTypy: nTypow,
    rywaleNaKlaster: mpDefault,
    minDystansKlastrow: 12,
  });
  const counts = cp.klastry.map(k => k.miasta.length);
  const minGot = Math.min(...counts);
  const want = mpDefault + 1;
  return { counts, minGot, want, ok: minGot >= want };
}

console.log('=== DOMYŚLNE Panel-E vs POJEMNOŚĆ (Kontynenty, mp min 3, od stolicy min 5) ===\n');
console.log(
  'Mapa'.padEnd(14) +
  '| Typy | Dom.mp | AI typów | Dom.razem miast AI | MAX mp+stolica/klaster | MAX mp | Dom OK? (seed 42)',
);
console.log('-'.repeat(105));

const MAP_ROWS = [
  ['Malenki', 'malenki'],
  ['Mały', 'maly'],
  ['Standardowy', 'standardowy'],
  ['Duży', 'duzy'],
  ['Ogromny', 'ogromny'],
  ['Super Huge', 'superogromny'],
];

function skalaRow(label) {
  return eStart.skala_mapy[label];
}
for (const [label, rozmiarKey] of MAP_ROWS) {
  const row = skalaRow(label);
  const map = M.generujSwiat(42, rozmiarKey, TYP);
  const typy = row.typy_cywilizacji;
  const mp = row.miasta_panstwa;
  const aiTypow = typy - 1;
  const domAiMiast = mp + aiTypow * (mp + 1);
  const maxTotal = maxCitiesPerCluster(map, typy, SEEDS);
  const maxMp = maxTotal - 1;
  const act = actualAtDefault(map, typy, mp, 42);
  const okStr = act.ok ? 'TAK' : `NIE (min ${act.minGot}/${act.want})`;

  console.log(
    label.padEnd(14) + '| ' +
    String(typy).padStart(4) + ' | ' +
    String(mp).padStart(6) + ' | ' +
    String(aiTypow).padStart(8) + ' | ' +
    String(domAiMiast).padStart(18) + ' | ' +
    String(maxTotal).padStart(22) + ' | ' +
    String(maxMp).padStart(6) + ' | ' + okStr,
  );
}

console.log('\n--- Macierz MAX mp (bez stolicy) przy domyślnej liczbie typów ---\n');
console.log('Mapa'.padEnd(14) + '| typy dom. | max mp (wszyscy klastry) | zapas vs dom.');
console.log('-'.repeat(60));
for (const [label, rozmiarKey] of MAP_ROWS) {
  const row = skalaRow(label);
  const map = M.generujSwiat(42, rozmiarKey, TYP);
  const maxTotal = maxCitiesPerCluster(map, row.typy_cywilizacji, SEEDS);
  const maxMp = maxTotal - 1;
  const zapas = maxMp - row.miasta_panstwa;
  console.log(
    label.padEnd(14) + '| ' +
    String(row.typy_cywilizacji).padStart(9) + ' | ' +
    String(maxMp).padStart(24) + ' | ' +
    (zapas >= 0 ? '+' + zapas : String(zapas)),
  );
}

console.log('\n--- MAX mp przy 1..9 typach (Mały mapa, przykład ciasnej) ---\n');
const mapMaly = M.generujSwiat(42, 'maly', TYP);
console.log('Typy | max mp+stolica | max mp');
for (let t = 1; t <= 10; t++) {
  const mx = maxCitiesPerCluster(mapMaly, t, SEEDS);
  console.log(String(t).padStart(4) + ' | ' + String(mx).padStart(15) + ' | ' + (mx - 1));
}

console.log('\nLegenda:');
console.log('- Typy = gracz + obce cywilizacje (klastry Voronoi)');
console.log('- Dom.mp = miasta-państwa w KAŻDYM klastrze (także obce typy dostają tyle samo slotów)');
console.log('- Dom.razem miast AI = mp rywali tego samego typu + (AI typów × (mp+1 stolica+mp))');
