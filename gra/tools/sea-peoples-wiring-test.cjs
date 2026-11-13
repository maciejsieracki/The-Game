'use strict';
/**
 * sea-peoples-wiring-test.cjs -- R-WEB-SEA-PEOPLES-BRONZE-TURN20-TRIPLE-Q1 (runda 2, odpowiedź na zarzut 1 Evaluatora).
 * Run from gra/:  node tools/sea-peoples-wiring-test.cjs
 *
 * Dwie warstwy dowodu okablowania (pełnego boot() gry nie da się uruchomić w Node):
 *  A. SYMULACJA TUR na PRAWDZIWYCH tickCamps i spawnSeaPeoplesRaiders (bundle barbarians.ts):
 *     parametry wejściowe przechodzą przez boostBarbParamsForSeaPeoples z flagą okna wyliczoną
 *     tak samo jak w main.ts (seaPeoplesBoostActive(bronzeEntry, ironEntry, turn)).
 *  B. KONTRAKT ŹRÓDŁA main.ts: asercje na tekst bloku tury barbarzyńców (czy tickCamps i
 *     spawnSeaPeoplesRaiders dostają parametry z boostu, czy okno liczy się z wpisów właściciela 0,
 *     czy komunikat jest jednorazowy i flaga przechodzi przez save/load/new game).
 *     Mutacja cofająca podpięcie w main.ts czerwieni tę sekcję (patrz raport).
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const ENTRY_FILE = path.resolve(__dirname, '.sea-peoples-wiring-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.sea-peoples-wiring-bundle.cjs');
const MAIN_FILE = path.resolve(__dirname, '..', 'src', 'main.ts');

fs.writeFileSync(ENTRY_FILE, `
export {
  seaPeoplesBoostActive, boostBarbParamsForSeaPeoples, shouldEmitSeaPeoplesEpochNotice,
  SEA_PEOPLES_UNIT_MULT, FALLBACK_BARB_PARAMS, FALLBACK_SEA_BARB_PARAMS,
  scaleBarbParamsForLevel, tickCamps, spawnSeaPeoplesRaiders, BARBARIAN_OWNER_ID,
} from '../src/game/barbarians';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
});
const B = require(BUNDLE_FILE);
const {
  seaPeoplesBoostActive, boostBarbParamsForSeaPeoples, SEA_PEOPLES_UNIT_MULT,
  FALLBACK_BARB_PARAMS, FALLBACK_SEA_BARB_PARAMS, scaleBarbParamsForLevel,
  tickCamps, spawnSeaPeoplesRaiders, BARBARIAN_OWNER_ID,
} = B;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++; else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- fixtures ---------------------------------------------------------------
function makeMap(w, h, waterQ) {
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      const teren = waterQ.includes(q) ? 'morze' : 'laka';
      hexes[k] = {
        coords: { q, r }, terenBazowy: teren, nakladka: 'brak', ulepszenie: 'brak',
        wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 1, riverPaths: [] };
}

// Okno wyliczane jak w main.ts: owner 0 -> wpisy bronze/iron, plus gate era==2.
const BRONZE_ENTRY = 100;   // wejście gracza (owner 0) w Brąz
const IRON_ENTRY = 150;     // wejście gracza w Żelazo (zamyka okno)
function windowForTurn(turn, playerEra = 2) {
  return playerEra === 2 && seaPeoplesBoostActive(BRONZE_ENTRY, IRON_ENTRY, turn);
}

// ===========================================================================
// A1. Symulacja tur: prawdziwe tickCamps, obóz lądowy, spawnInterval 1.
// ===========================================================================
{
  const map = makeMap(14, 14, []);
  const base = Object.assign({}, scaleBarbParamsForLevel(FALLBACK_BARB_PARAMS, 'normalny', 'normal'),
    { spawnInterval: 1, minDistFromCity: 0, startTurn: 1 });
  eq(base.unitsPerCamp, 2, 'A1 setup: normal base unitsPerCamp = 2');
  let camps = [{ id: 'camp-1', q: 7, r: 7, spawnCooldown: 0 }];
  const units = [];
  let nextId = 1;
  const aliveHistory = {};
  let peak = 0;
  for (let t = 110; t <= 160; t++) {
    const active = windowForTurn(t);
    const params = boostBarbParamsForSeaPeoples(base, active);
    const barbUnits = units.filter(u => u.ownerId === BARBARIAN_OWNER_ID);
    const res = tickCamps(camps, barbUnits, units, map, params);
    camps = res.camps;
    for (const s of res.spawns) {
      units.push({
        id: `b${nextId++}`, ownerId: BARBARIAN_OWNER_ID, typeId: s.typeId,
        category: 'miecznik', q: s.q, r: s.r, ruch: 2, ruchLeft: 2, campId: s.campId,
      });
    }
    const alive = units.filter(u => u.ownerId === BARBARIAN_OWNER_ID && u.campId === 'camp-1').length;
    aliveHistory[t] = alive;
    if (alive > peak) peak = alive;
  }
  eq(aliveHistory[119], 2, 'A1 tura 119 (przed oknem): żywych = 2 (baza normal)');
  eq(aliveHistory[120], 3, 'A1 tura 120: pierwszy spawn w oknie (cap już 6, 2->3)');
  eq(aliveHistory[125], 6, 'A1 tura 125: obóz narósł do x3 = 6');
  eq(peak, 6, 'A1 szczyt żywych obozu = 6 (nie więcej)');
  eq(SEA_PEOPLES_UNIT_MULT * base.unitsPerCamp, 6, 'A1 mnożnik x3 względem bazy');
  eq(aliveHistory[149], 6, 'A1 tura 149 (ostatnia w oknie): nadal 6');
  eq(aliveHistory[150], 6, 'A1 tura 150 (Iron): istniejący 6 nie są kasowani');
  eq(aliveHistory[160], 6, 'A1 tura 160 (po Iron): brak kasowania, brak nowych spawnów ponad bazę');
}

// ===========================================================================
// A2. Symulacja tur: prawdziwe spawnSeaPeoplesRaiders, cap = maxSeaCamps * unitsPerCamp.
// ===========================================================================
{
  const map = makeMap(14, 14, [0, 1, 2]); // pas morza na q 0..2
  const base = Object.assign({}, scaleBarbParamsForLevel(FALLBACK_BARB_PARAMS, 'normalny', 'normal'),
    { spawnInterval: 1, minDistFromCity: 0, startTurn: 1 });
  const seaParams = Object.assign({}, FALLBACK_SEA_BARB_PARAMS, { maxSeaCamps: 2, raidRadius: 8 });
  const cities = [{ q: 4, r: 7, ownerId: 0 }];
  const units = [];
  let nextId = 1;
  const alive = () => units.filter(u => u.seaRaider === true || u.embarked === true).length;
  const seen = {};
  for (let t = 110; t <= 160; t++) {
    const active = windowForTurn(t);
    const params = boostBarbParamsForSeaPeoples(base, active);
    const barbUnits = units.filter(u => u.ownerId === BARBARIAN_OWNER_ID);
    const sp = spawnSeaPeoplesRaiders(map, cities, barbUnits, units, params, seaParams, t, t * 31337 + 7);
    for (const s of sp) {
      units.push({
        id: `sr${nextId++}`, ownerId: BARBARIAN_OWNER_ID, typeId: s.typeId, category: 'miecznik',
        q: s.q, r: s.r, ruch: 2, ruchLeft: 2, campId: s.campId, embarked: true, seaRaider: true,
      });
    }
    seen[t] = alive();
  }
  // cap = maxSeaCamps (2) * unitsPerCamp: baza normal 2 -> 4; okno x3 -> 2 * 6 = 12.
  eq(seen[119], 4, 'A2 tura 119 (przed oknem): rajderzy cap = 2 * 2 = 4');
  eq(seen[125], 10, 'A2 tura 125 (okno, narastanie 1/tura od 120): 4+6 = 10');
  eq(seen[127], 12, 'A2 tura 127 (okno): rajderzy cap = 2 * 6 = 12 (x3)');
  eq(Math.max(...Object.values(seen)), 12, 'A2 szczyt rajderów = 12');
  eq(seen[160], 12, 'A2 po Iron: rajderzy nie kasowani (12), brak spawnów ponad bazę');
}

// ===========================================================================
// B. Kontrakt źródła main.ts (blok tury barbarzyńców, save/load, new game).
// ===========================================================================
const mainSrc = fs.readFileSync(MAIN_FILE, 'utf8');
function has(re, msg) { assert(re.test(mainSrc), msg); }

has(/const seaPeoplesActive = player\.era === 2 && seaPeoplesBoostActive\(\s*bronzeEraEnterTurnByOwner\.get\(0\),\s*ironEraEnterTurnByOwner\.get\(0\),\s*turn,?\s*\);/,
  'B1 okno liczone z wpisów właściciela 0 (gracz) i bramki player.era===2');
has(/const barbLiveBoosted = boostBarbParamsForSeaPeoples\(barbLive, seaPeoplesActive\);/,
  'B2 barbLiveBoosted = boost(barbLive, seaPeoplesActive)');
has(/const barbLiveForSpawn = player\.era === 2\s*\?\s*\{ \.\.\.barbLiveBoosted, unitTypeId: pickBronzeBarbUnit\(turn\) \}\s*:\s*barbLiveBoosted;/,
  'B3 barbLiveForSpawn wywodzi się z barbLiveBoosted (obie gałęzie)');
has(/tickCamps\(barbCamps, barbUnitsNow, units, map, barbLiveForSpawn\)/,
  'B4 tickCamps dostaje barbLiveForSpawn (spawn obozów x3)');
has(/spawnSeaPeoplesRaiders\(\s*map, cities, barbUnitsNow, units, barbLiveBoosted, seaBarbParams, turn,/,
  'B5 spawnSeaPeoplesRaiders dostaje barbLiveBoosted (rajdy x3)');
has(/if \(shouldEmitSeaPeoplesEpochNotice\(seaPeoplesActive, seaPeoplesNoticeShown\)\) \{\s*seaPeoplesNoticeShown = true;\s*warEventLog\.unshift\(/,
  'B6 komunikat jednorazowy: flaga ustawiana przed wpisem do warEventLog');
has(/seaPeoplesNoticeShown,\s*\n\s*bronzeForceWarCycleOwners: bronzeForceWarSave\.cycleOwners/,
  'B7 flaga zapisywana w save meta');
has(/seaPeoplesNoticeShown = saved\.meta\?\.seaPeoplesNoticeShown === true;/,
  'B8 flaga odtwarzana przy load (brak pola = false)');
has(/bronzeEraEnterTurnByOwner\.clear\(\);\s*\n\s*seaPeoplesNoticeShown = false;/,
  'B9 reset flagi przy nowej grze');

// ===========================================================================
console.log(`sea-peoples-wiring-test: ${passed} passed, ${failed} failed`);
for (const f of [ENTRY_FILE, BUNDLE_FILE]) { try { fs.unlinkSync(f); } catch (_) { /* ok */ } }
process.exit(failed === 0 ? 0 : 1);
