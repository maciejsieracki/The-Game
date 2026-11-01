'use strict';
/**
 * node tools/ai-polar-fallback-test.cjs
 * R-WEB-AI-POLAR-FALLBACK-Q1: AI w ekspansji (>=1 wlasne miasto) NIE zaklada miasta na heksie polarnym.
 *   F1 — polarny heks w zasiegu (rzeka+zloze, wynik wysoki), niepolarne ponizej minScore -> null (odtworzenie Pangea 1001 T24).
 *   F2 — ten sam stan + niepolarny kandydat ponad progiem -> wybrany niepolarny.
 *   F3 — caly lad polarny, AI bez miast (pierwsze miasto) -> fallback polarny nadal dziala (z logiem).
 *   F4 — caly lad polarny, AI ma wlasne miasto -> null, brak logu polar-fallback.
 *   F5 — polarny heks z bonusem klastra (+50) przy niepolarnych < minScore -> null.
 */
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.ai-polar-fb-entry.ts');
const bundle = path.join(__dirname, '.ai-polar-fb-bundle.cjs');
fs.writeFileSync(entry, `
export { planCityFounding, aiPolarNeighbourhoodPenalty } from '../src/game/ai';
export { MIN_CITY_DISTANCE } from '../src/game/cities';
export { AI_FOUNDING_SOURCE_MIN_POP } from '../src/game/city-founding';
export { polarProximityTier } from '../src/map/clusters';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);

let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'laka', nakladka: 'brak', ulepszenie: 'brak', wlasciciel: null,
      wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}
function data(over = {}) {
  const ap = {
    ekspansja_min_dystans_miast: { wartosc: M.MIN_CITY_DISTANCE, sekcja: 't', opis: '' },
    ekspansja_min_score_hex: { wartosc: 1, sekcja: 't', opis: '' },
    ekspansja_heurystyka_rzeka_pkt: { wartosc: 10, sekcja: 't', opis: '' },
    ekspansja_heurystyka_surowiec_pkt: { wartosc: 10, sekcja: 't', opis: '' },
    ...over,
  };
  return { units: [{ Jednostka: 'Wojownik', Health: 30, Ruch: 2 }], buildings: [],
    terrainYields: { terrain_types: [{ Teren: 'laka', Zywnosc: 4, Praca: 1, Handel: 1 }, { Teren: 'polarny', Zywnosc: 0, Praca: 0, Handel: 0 }] },
    aiParams: ap };
}
const city = (id, owner, q, r, pop) => ({ id, ownerId: owner, q, r, population: pop, name: id });
const OPTS = { currentTurn: 20, pracaAvailable: 200 };
const SRC_POP = M.AI_FOUNDING_SOURCE_MIN_POP;
const origWarn = console.warn; let warns = 0;
console.warn = (...a) => { warns++; if (process.env.VERBOSE) origWarn(...a); };


const OPTS2 = OPTS;
const MS = v => data({ ekspansja_min_score_hex: { wartosc: v, sekcja: 't', opis: '' } });
const MIN_HI = Number(10);
function polarHot(map, q, r) {
  const h = map.hexes[`${q},${r}`]; h.terenBazowy = 'polarny'; h.rzeka.obecna = true; h.nakladka = 'zloze_gliny';
}
console.log('--- F1: polarny wysoki, niepolarne < minScore -> null ---');
{
  const map = makeMap(40, 40); const c = city('c1', 1, 20, 20, SRC_POP);
  polarHot(map, 20, 24); warns = 0;
  const cmd = M.planCityFounding(1, [c], map, MS(MIN_HI), { ...OPTS2, resourceDeficitKeys: ['glina'] }, M.MIN_CITY_DISTANCE);
  assert(cmd === null, `F1a: brak zalozenia (got ${JSON.stringify(cmd)})`);
  assert(warns === 0, 'F1b: brak logu polar-fallback');
}
console.log('--- F2: + niepolarny ponad progiem -> niepolarny ---');
{
  const map = makeMap(40, 40); const c = city('c1', 1, 20, 20, SRC_POP);
  polarHot(map, 20, 24); map.hexes['20,16'].rzeka.obecna = true;
  const cmd = M.planCityFounding(1, [c], map, MS(MIN_HI), { ...OPTS2, resourceDeficitKeys: ['glina'] }, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.q === 20 && cmd.r === 16, `F2: wybrano niepolarny (20,16) (got ${JSON.stringify(cmd)})`);
}
console.log('--- F3: caly lad polarny, brak miast -> fallback ---');
{
  const map = makeMap(12, 12); for (const k of Object.keys(map.hexes)) map.hexes[k].terenBazowy = 'polarny';
  warns = 0;
  const cmd = M.planCityFounding(1, [], map, data(), OPTS2, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.type === 'foundCityAt', 'F3a: pierwsze miasto zalozone na polarnym');
  assert(warns >= 1, 'F3b: log polar-fallback');
}
console.log('--- F4: caly lad polarny, AI ma miasto -> null ---');
{
  const map = makeMap(30, 30); for (const k of Object.keys(map.hexes)) map.hexes[k].terenBazowy = 'polarny';
  const c = city('c1', 1, 15, 15, SRC_POP); warns = 0;
  const cmd = M.planCityFounding(1, [c], map, data(), OPTS2, M.MIN_CITY_DISTANCE);
  assert(cmd === null, `F4a: null (got ${JSON.stringify(cmd)})`);
  assert(warns === 0, 'F4b: brak logu');
}
console.log('--- F5: bonus klastra na polarnym, niepolarne < minScore -> null ---');
{
  const map = makeMap(40, 40); const c = city('c1', 1, 20, 20, SRC_POP);
  polarHot(map, 20, 24); warns = 0;
  const cmd = M.planCityFounding(1, [c], map, MS(MIN_HI), { ...OPTS2, clusterCenter: { q: 20, r: 24 }, clusterRadius: 0 }, M.MIN_CITY_DISTANCE);
  assert(cmd === null, `F5: null mimo bonusu klastra (got ${JSON.stringify(cmd)})`);
}

console.warn = origWarn;
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
