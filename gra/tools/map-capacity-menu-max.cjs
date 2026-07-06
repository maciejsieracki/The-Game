'use strict';
/** Czy górne opcje menu kreatora mieszczą się przy regułach spawnu (decyzja B). */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ENTRY = path.resolve(__dirname, '.map-capacity-menu-max-entry.ts');
const BUNDLE = path.resolve(__dirname, '.map-capacity-menu-max-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '../src/map/generator';
export { computeClusters } from '../src/map/clusters';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const eStart = require('../data/e-start-params.json');

const SEEDS = [1, 42, 2026];
const TYP = 'kontynenty';

const MAPS = [
  ['Malenki', 'malenki'],
  ['Mały', 'maly'],
  ['Standardowy', 'standardowy'],
  ['Duży', 'duzy'],
  ['Ogromny', 'ogromny'],
  ['Super Huge', 'superogromny'],
];

function testAt(map, nTypow, mp, seeds) {
  let ok = true;
  let minGot = 99;
  const want = mp + 1;
  for (const seed of seeds) {
    const cp = M.computeClusters(map, {
      seed,
      aktywneTypy: nTypow,
      rywaleNaKlaster: mp,
      minDystansKlastrow: 12,
    });
    const min = Math.min(...cp.klastry.map((k) => k.miasta.length));
    if (min < want) {
      ok = false;
      minGot = Math.min(minGot, min);
    }
  }
  return { ok, minGot, want };
}

function maxMpPerCluster(map, nTypow, seeds) {
  let best = 1;
  for (let target = 2; target <= 30; target++) {
    let okAll = true;
    for (const seed of seeds) {
      const cp = M.computeClusters(map, {
        seed,
        aktywneTypy: nTypow,
        rywaleNaKlaster: target - 1,
        minDystansKlastrow: 12,
      });
      const min = Math.min(...cp.klastry.map((k) => k.miasta.length));
      if (min < target) {
        okAll = false;
        break;
      }
    }
    if (okAll) best = target;
    else break;
  }
  return best - 1;
}

console.log('=== DOMYŚLNE vs MAKS. MENU (Kontynenty, 3 ziarna) ===');
console.log(
  'Mapa'.padEnd(14) +
    '| typy dom | mp dom | dom OK? | max typy menu | max mp menu | poj. max mp | max combo OK?',
);
console.log('-'.repeat(105));

for (const [label, roz] of MAPS) {
  const row = eStart.skala_mapy[label];
  const defMp = row.miasta_panstwa;
  const defTyp = row.typy_cywilizacji;
  const maxTypMenu = defMp + 1;
  const maxMpMenu = defMp + 2;
  const map = M.generujSwiat(42, roz, TYP);

  const dom = testAt(map, defTyp, defMp, SEEDS);
  const cap = maxMpPerCluster(map, maxTypMenu, SEEDS);
  const worst = testAt(map, maxTypMenu, maxMpMenu, SEEDS);

  const domStr = dom.ok ? 'TAK' : `NIE (${dom.minGot}/${dom.want})`;
  const worstStr = worst.ok ? 'TAK' : `NIE (${worst.minGot}/${worst.want})`;

  console.log(
    label.padEnd(14) +
      '| ' +
      String(defTyp).padStart(8) +
      ' | ' +
      String(defMp).padStart(6) +
      ' | ' +
      domStr.padStart(7) +
      ' | ' +
      String(maxTypMenu).padStart(13) +
      ' | ' +
      String(maxMpMenu).padStart(11) +
      ' | ' +
      String(cap).padStart(11) +
      ' | ' +
      worstStr,
  );
}

console.log('\nLegenda:');
console.log('- typy dom / mp dom = wartości z pliku e-start-params.json (Panel-E)');
console.log('- max typy menu = domyślne miasta-państwa + 1 (logika civTypesMenuForMapLabel)');
console.log('- max mp menu = domyślne miasta-państwa + 2 (logika miastaPanstwaMenuForMapLabel)');
console.log('- poj. max mp = ile miast-państw zmieści się w KAŻDYM klastrze przy max typach z menu');
console.log('- max combo = jednocześnie max typy + max mp z menu');
