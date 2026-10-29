// Pomiar trafien na granicach rownosci w wektorach M05B (r4, zarzut 2).
// Liczy, ile przypadkow ma na wejsciu: mase ladu dokladnie 7/8/9/149/150/151 (groupLandMassKeys,
// ta sama definicja co ensure/grow) oraz skupisko Gor/Wzgorz dokladnie 9/10/11 (findSameTerrainClusters).
// Uzycie: node --experimental-transform-types --no-warnings measure-boundaries-m05b.mjs <WEB_ROOT> <web-vectors.json>
// WEB_ROOT musi zawierac gra/src/map/gen-helpers.m05b-exports.ts (zapisany przez gen-m05b-vectors.mjs).
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const root = process.argv[2];
const vec = JSON.parse(readFileSync(process.argv[3], 'utf8'));
const G = await import(pathToFileURL(`${root}/gra/src/map/gen-helpers.m05b-exports.ts`).href);
const H = await import(pathToFileURL(`${root}/gra/src/types/hex.ts`).href);
const { TerenBazowy } = H;

const toHexes = (arr) => {
  const hexes = {};
  for (const [k, terr, nak, zl] of arr) {
    hexes[k] = { coords: { q: Number(k.split(',')[0]), r: Number(k.split(',')[1]) }, terenBazowy: terr, nakladka: nak, ...(zl ? { zloze: 'rudy' } : {}) };
  }
  return hexes;
};
const MASS_SIZES = [7, 8, 9, 149, 150, 151];
const CLUSTER_SIZES = [9, 10, 11];
const out = {};
const bump = (cat, key) => { out[cat] ??= {}; out[cat][key] = (out[cat][key] ?? 0) + 1; };
for (const cat of ['ensure', 'grow', 'regrow', 'safety', 'helpers']) {
  for (const c of vec.cases[cat] ?? []) {
    const hexes = toHexes(c.input);
    for (const m of G.groupLandMassKeys(hexes)) if (MASS_SIZES.includes(m.length)) bump(cat, `masa=${m.length}`);
    for (const ter of [TerenBazowy.Gory, TerenBazowy.Wzgorza]) {
      for (const cl of G.findSameTerrainClusters(hexes, ter)) {
        if (CLUSTER_SIZES.includes(cl.length)) bump(cat, `skupisko${ter}=${cl.length}`);
      }
    }
  }
}
console.log(JSON.stringify(out, null, 1));
