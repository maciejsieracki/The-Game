'use strict';
/**
 * node tools/ai-avoid-polar-pick-test.cjs
 * R-WEB-AI-AVOID-POLAR-CITIES-Q1: syntetyczne testy wyboru miejsca na miasto AI (planCityFounding / findCityFoundingHex).
 *   P1 — heks Polarny NAJLEPIEJ punktowany (rzeka+zloze), a istnieje kandydat niepolarny -> AI wybiera niepolarny.
 *   P2 — dwa kandydaty o rownym wyniku: jeden obok Polarnego (r1), drugi daleko -> wybrany daleki (kara sasiedztwa).
 *   P3 — kara dziala TYLKO w rankingu: jedyny kandydat przy polarnym nadal zostaje zalozony (brak spadku liczby miast).
 *   P4 — caly dostepny lad polarny (pierwsze miasto bez minScore) -> ostatni fallback zwraca heks polarny (z logiem).
 *   P5 — parametr ekspansja_kara_polarna_sasiedztwo=0 wylacza kare sasiedztwa (parametryzacja z data/ai-params.json).
 *   P6 — jednostkowo polarProximityTier / aiPolarNeighbourhoodPenalty (poziomy 3/2/1/0, kara 8/4/0).
 */
const path = require('path');
const fs = require('fs');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA, 'node_modules', 'esbuild'));
const entry = path.join(__dirname, '.ai-polar-pick-entry.ts');
const bundle = path.join(__dirname, '.ai-polar-pick-bundle.cjs');
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

// P1
console.log('--- P1: polarny heks najlepszy, ale istnieje niepolarny -> niepolarny ---');
{
  const map = makeMap(40, 40);
  const c = city('c1', 1, 20, 20, SRC_POP);
  // polarny heks w zasiegu z rzeka+zlozem (najwyzszy wynik)
  const pq = 20, pr = 24;
  map.hexes[`${pq},${pr}`].terenBazowy = 'polarny';
  map.hexes[`${pq},${pr}`].rzeka.obecna = true;
  map.hexes[`${pq},${pr}`].nakladka = 'zloze_gliny';
  // slabszy niepolarny kandydat (rzeka)
  map.hexes['20,16'].rzeka.obecna = true;
  const cmd = M.planCityFounding(1, [c], map, data(), { ...OPTS, resourceDeficitKeys: ['glina'] }, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.type === 'foundCityAt', 'P1a: jest foundCityAt');
  assert(cmd && !(cmd.q === pq && cmd.r === pr), `P1b: NIE wybrano heksu polarnego (got ${cmd && cmd.q},${cmd && cmd.r})`);
  assert(cmd && map.hexes[`${cmd.q},${cmd.r}`].terenBazowy !== 'polarny', 'P1c: wybrany heks nie jest polarny');
}

// P2
console.log('--- P2: rowny wynik, jeden przy polarnym -> daleki od polarnego ---');
{
  const map = makeMap(40, 40);
  const c = city('c1', 1, 20, 20, SRC_POP);
  // dwa identyczne kandydaty (rzeka); A obok heksu polarnego, B daleko
  map.hexes['20,25'].rzeka.obecna = true; // A
  map.hexes['21,25'].terenBazowy = 'polarny';
  map.hexes['16,20'].rzeka.obecna = true; // B (dalej od polarnego)
  // wylacz inne przewagi: wszystkie pozostale hexy bez rzeki -> wynik 0 < minScore? minScore=1 -> tylko A i B licza sie
  const cmd = M.planCityFounding(1, [c], map, data(), OPTS, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.type === 'foundCityAt', 'P2a: jest foundCityAt');
  assert(cmd && cmd.q === 16 && cmd.r === 20, `P2b: wybrano B (16,20), nie A przy polarnym (got ${cmd && cmd.q},${cmd && cmd.r})`);
}

// P3
console.log('--- P3: jedyny kandydat przy polarnym nadal zakladany (kara tylko w rankingu) ---');
{
  const map = makeMap(40, 40);
  const c = city('c1', 1, 20, 20, SRC_POP);
  map.hexes['20,25'].rzeka.obecna = true;
  map.hexes['21,25'].terenBazowy = 'polarny';
  const cmd = M.planCityFounding(1, [c], map, data(), OPTS, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.q === 20 && cmd.r === 25, `P3: jedyny kandydat (20,25) przy polarnym zalozony (got ${cmd && cmd.q},${cmd && cmd.r})`);
}

// P4
console.log('--- P4: caly dostepny lad polarny -> ostatni fallback (pierwsze miasto) ---');
{
  const map = makeMap(12, 12);
  for (const k of Object.keys(map.hexes)) map.hexes[k].terenBazowy = 'polarny';
  warns = 0;
  const cmd = M.planCityFounding(1, [], map, data(), OPTS, M.MIN_CITY_DISTANCE);
  assert(cmd && cmd.type === 'foundCityAt', 'P4a: fallback zwraca foundCityAt gdy brak niepolarnych');
  assert(warns >= 1, 'P4b: fallback zalogowany (console.warn)');
}

// P5
console.log('--- P5: kara = 0 wylacza ranking sasiedztwa ---');
{
  const map = makeMap(40, 40);
  const c = city('c1', 1, 20, 20, SRC_POP);
  map.hexes['20,25'].rzeka.obecna = true;
  map.hexes['20,25'].nakladka = 'zloze_gliny'; // A: silniejszy
  map.hexes['21,25'].terenBazowy = 'polarny';
  map.hexes['16,20'].rzeka.obecna = true; // B: slabszy
  const call = v => M.planCityFounding(1, [c], map,
    v === undefined ? data() : data({ ekspansja_kara_polarna_sasiedztwo: { wartosc: v, sekcja: 't', opis: '' } }),
    { ...OPTS, resourceDeficitKeys: ['glina'] }, M.MIN_CITY_DISTANCE);
  const def = call(undefined), big = call(60), zero = call(0);
  assert(def && def.q === 20 && def.r === 25, 'P5a: domyslna kara 8 nie przeskakuje WYRAZNIE lepszego terenu przy polarnym (A)');
  assert(big && big.q === 16 && big.r === 20, 'P5b: kara 60 -> wygrywa B (daleko od polarnego)');
  assert(zero && zero.q === 20 && zero.r === 25, 'P5c: kara=0 -> wygrywa silniejszy A');
}

// P6 — jednostkowo polarProximityTier
console.log('--- P6: polarProximityTier ---');
{
  const map = makeMap(20, 20);
  map.hexes['10,10'].terenBazowy = 'polarny';
  assert(M.polarProximityTier(map, 10, 10) === 3, 'P6a: sam polarny = 3');
  assert(M.polarProximityTier(map, 11, 10) === 2, 'P6b: sasiad = 2');
  assert(M.polarProximityTier(map, 12, 10) === 1, 'P6c: dystans 2 = 1');
  assert(M.polarProximityTier(map, 13, 10) === 0, 'P6d: dystans 3 = 0');
  assert(M.aiPolarNeighbourhoodPenalty(map, 11, 10, 8) === 8 && M.aiPolarNeighbourhoodPenalty(map, 12, 10, 8) === 4
    && M.aiPolarNeighbourhoodPenalty(map, 13, 10, 8) === 0, 'P6e: kara 8/4/0');
}

console.warn = origWarn;
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
