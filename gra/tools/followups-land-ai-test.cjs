'use strict';
/**
 * node tools/followups-land-ai-test.cjs
 * R-WEB-FOLLOWUPS-LAND-AI-Q1:
 *   (1) podsumowanie kroku START: Ziemia -> "szablon kontynentow (bez suwaka)" (kontrola zrodla newGameFlow.ts);
 *   (2) fallbacki `?? 30` w main.ts (wczytanie starego zapisu) -> defaultLandFractionPercentForTyp (kontrola zrodla);
 *   (3a) pickBonusCityHex: heks Polarny tylko jako ostatni fallback (test behawioralny na syntetycznej mapie).
 */
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.followups-entry.ts');
const bundle = path.join(__dirname, '.followups-bundle.cjs');
fs.writeFileSync(entry, `
export { pickBonusCityHex } from '../src/game/ai-difficulty-bonus';
export { MIN_CITY_DISTANCE } from '../src/game/cities';
export { hexDistance } from '../src/units/setup';
export { defaultLandFractionPercentForTyp } from '../src/map/newGameMapDefaults';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

// (1) + (2) zrodlo
const flow = fs.readFileSync(path.join(GRA, 'src/ui/newGameFlow.ts'), 'utf8');
assert(/p\.typSwiata === 'ziemia'\s*\?\s*'szablon kontynentów \(bez suwaka\)'/.test(flow), 'L1: Ziemia w podsumowaniu = szablon (bez 20%/80%)');
assert(flow.includes("p.landFractionPercent + '% / ' + (100 - p.landFractionPercent) + '%'"), 'L1b: inne typy nadal procent');
const main = fs.readFileSync(path.join(GRA, 'src/main.ts'), 'utf8');
assert(main.includes('(meta?.loadLandFraction as number) ?? defaultLandFractionPercentForTyp(typ)'), 'L2a: fallback meta uzywa domyslnej per typ');
assert(main.includes('(params.landFractionPercent ?? defaultLandFractionPercentForTyp(_menuTypSwiata)) / 100'), 'L2b: fallback regeneracji uzywa domyslnej per typ');
assert(M.defaultLandFractionPercentForTyp('kontynenty') === 30 && M.defaultLandFractionPercentForTyp('pangea') === 60
  && M.defaultLandFractionPercentForTyp('wyspy') === 50, 'L2c: domyslne per typ 30/60/50');

// (3a)
function makeMap(w, h, terrFn) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: terrFn(q, r), nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
const cq = 20, cr = 20, MIN = M.MIN_CITY_DISTANCE;
const cap = [{ id: 'c1', ownerId: 1, q: cq, r: cr, population: 1, name: 'c1' }];
{
  const map = makeMap(41, 41, (q, r) => (M.hexDistance(cq, cr, q, r) === MIN ? 'polarny' : 'laka'));
  const h = M.pickBonusCityHex(map, cap, cq, cr);
  assert(h !== null, 'B1a: znaleziono heks');
  assert(h && map.hexes[`${h.q},${h.r}`].terenBazowy !== 'polarny', 'B1b: omija polarny pierscien, wybiera niepolarny');
}
{
  const map = makeMap(41, 41, () => 'polarny');
  const h = M.pickBonusCityHex(map, cap, cq, cr);
  assert(h !== null && map.hexes[`${h.q},${h.r}`].terenBazowy === 'polarny', 'B2: caly promien polarny -> fallback polarny (jak dotad, bez spadku liczby miast)');
}
{
  const map = makeMap(41, 41, () => 'laka');
  const h = M.pickBonusCityHex(map, cap, cq, cr);
  assert(h && M.hexDistance(cq, cr, h.q, h.r) === MIN, 'B3: bez polarnych - bez zmian (najblizszy legalny, d=MIN)');
}
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
console.log(`${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
