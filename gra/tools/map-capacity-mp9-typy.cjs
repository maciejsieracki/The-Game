'use strict';
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const ENTRY = path.resolve(__dirname, '.cap-mp9-entry.ts');
const BUNDLE = path.resolve(__dirname, '.cap-mp9-bundle.cjs');
fs.writeFileSync(ENTRY, `export { generujSwiat } from '../src/map/generator';
export { computeClusters } from '../src/map/clusters';`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'] });
const M = require(BUNDLE);
const SEEDS = [1, 42, 2026];
const TYP = 'kontynenty';
const MAPS = [['Malenki','malenki'],['Mały','maly'],['Standardowy','standardowy'],['Duży','duzy'],['Ogromny','ogromny'],['Super Huge','superogromny']];
function okMp9(map, nTypow) {
  for (const seed of SEEDS) {
    const cp = M.computeClusters(map, { seed, aktywneTypy: nTypow, rywaleNaKlaster: 9, minDystansKlastrow: 12 });
    const min = Math.min(...cp.klastry.map(k => k.miasta.length));
    if (min < 10) return false;
  }
  return true;
}
console.log('Max typów cywilizacji przy 9 mp w każdym klastrze (Kontynenty):');
for (const [label, roz] of MAPS) {
  const map = M.generujSwiat(42, roz, TYP);
  let maxTyp = 1;
  for (let t = 1; t <= 14; t++) {
    if (okMp9(map, t)) maxTyp = t;
    else break;
  }
  console.log(`${label.padEnd(14)} max typów: ${maxTyp}`);
}
