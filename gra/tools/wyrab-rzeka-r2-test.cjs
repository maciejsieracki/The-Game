'use strict';
/**
 * wyrab-rzeka-r2-test.cjs — R-WEB-AUTOIMPROVE-PRIORITY-Q1, runda 2 (odpowiedź na zarzuty Obrony).
 * Run from gra/:  node tools/wyrab-rzeka-r2-test.cjs
 * Opcjonalnie AI_SRC_DIR=<katalog src innej wersji> (np. kopia src z bazy 914daa502) — mutacja.
 *
 * Scenariusze właściciela (Objaw A, F8): obywatel na lesie przy rzece, brak lasu poza nim
 * (lub mało lasu w promieniu), tartak/obóz jeszcze nie stoją. Oczekiwanie: wycinka heksu
 * rzeki (KROK 0, E2) zachodzi, a tartak/obóz NIE wchodzą na heks rzeki przed wycinką.
 * Objaw B: farma na heksie z obywatelem → bydło (trzoda) na tym heksie, gdy odblokowane
 * „Oswojenie zwierząt"; bez tej technologii bydło NIE powstaje (pomiar, nie założenie).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.wyrab-r2-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wyrab-r2-test-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { pickAutoImprovements } = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  PASS:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}

const ALL = ['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja'];
const NO_TAME = ALL.filter(t => t !== 'Oswojenie zwierząt');
const RIVER = '13,12';
const CITY = { q: 12, r: 12 };

function makeMap(forestHexes, riverForest = true) {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  if (riverForest) hexes[RIVER].nakladka = 'las';
  for (const [q, r] of forestHexes) hexes[`${q},${r}`].nakladka = 'las';
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42, riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }]] };
}

// Symulacja tur: wycinka zdejmuje Las (jak commit AI); pozostałe picki dopisywane do warstw.
function simulate({ forest = [], worked, techs = ALL, turns = 12, population = 3, placed0 = [], riverForest = true }) {
  const map = makeMap(forest, riverForest);
  const placed = new Map();
  for (const [hk, key] of placed0) placed.set(hk, [key]);
  const city = { id: 'c1', ownerId: 0, q: CITY.q, r: CITY.r, name: 'T', population, ulepszeniaFocus: 'zywnosc' };
  const workedSet = new Set(worked);
  const out = { wycinkiRiver: 0, wycinkiOther: 0, riverBuiltBeforeCut: [], builtOn: {}, firstCutTurn: null };
  for (let t = 1; t <= turns; t++) {
    const picks = pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: [{ q: CITY.q, r: CITY.r, pop: population, level: 1, ownerId: 0 }],
      placedImprovements: placed, pracaAvailable: 200, pracaBudgetPercent: 100,
      unlockedTechs: new Set(techs), pracaSurplusThreshold: 0, skipWyrab: false, civArchetype: 'grecy',
      getOnlyWorked: () => true, getWorkedHexKeys: () => workedSet,
      getFocus: () => 'zrownowazone', demandDriven: true,
    });
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      if (p.key === 'wyrab') {
        map.hexes[hk].nakladka = 'brak';
        if (hk === RIVER) { out.wycinkiRiver++; if (out.firstCutTurn === null) out.firstCutTurn = t; }
        else out.wycinkiOther++;
        continue;
      }
      if (hk === RIVER && map.hexes[RIVER].nakladka === 'las') out.riverBuiltBeforeCut.push(p.key);
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
      out.builtOn[hk] = [...(out.builtOn[hk] ?? []), p.key];
    }
  }
  out.riverForest = map.hexes[RIVER].nakladka === 'las';
  return out;
}

const WORKED = ['12,12', '11,12', '12,11', '12,13', '11,13', RIVER];

console.log('1. ZARZUT 1 (deadlock): rzeka+las z obywatelem, BRAK innego lasu, tartak/obóz jeszcze nie stoją');
{
  const r = simulate({ forest: [], worked: WORKED, turns: 12 });
  assert(r.wycinkiRiver === 1, `wycinka heksu rzeki = 1 w 12 turach (got ${r.wycinkiRiver})`);
  assert(r.riverBuiltBeforeCut.length === 0, `przed wycinką na heksie rzeki nic nie stawiamy (got ${JSON.stringify(r.riverBuiltBeforeCut)})`);
  assert(!r.riverForest, 'heks rzeki nie ma Lasu po 12 turach');
}

console.log('2. ZARZUT 3 (wariant właściciela): mało lasu w promieniu (rzeka + 1 inny las = 2 < próg 3)');
{
  const r = simulate({ forest: [[10, 12]], worked: WORKED, turns: 12 });
  assert(r.wycinkiRiver === 1, `wycinka heksu rzeki przy 2 lasach w promieniu = 1 (got ${r.wycinkiRiver})`);
  assert(r.riverBuiltBeforeCut.length === 0, `brak tartaku/obozu na rzece przed wycinką (got ${JSON.stringify(r.riverBuiltBeforeCut)})`);
}

console.log('3. REGRESJA: rzeka+las, 5 innych lasów w promieniu (scenariusz rundy 3)');
{
  const r = simulate({ forest: [[10, 12], [10, 13], [11, 13], [9, 12], [11, 11]], worked: WORKED, turns: 12 });
  assert(r.wycinkiRiver === 1, `wycinka heksu rzeki = 1 (got ${r.wycinkiRiver})`);
  assert(r.riverBuiltBeforeCut.length === 0, `brak budowy na rzece przed wycinką (got ${JSON.stringify(r.riverBuiltBeforeCut)})`);
}

console.log('4. OBJAW B: farma na rzece 13,12 (bez lasu) z obywatelem → trzoda na tym heksie (E3)');
{
  const withTame = simulate({ forest: [], worked: WORKED, techs: ALL, turns: 6, placed0: [[RIVER, 'farma']], riverForest: false });
  const bydloWith = withTame.builtOn[RIVER] ?? [];
  assert(bydloWith.includes('bydlo'), `z „Oswojenie zwierząt”: bydło na rzece po farmie (builtOn 13,12=${JSON.stringify(bydloWith)})`);
  const noTame = simulate({ forest: [], worked: WORKED, techs: NO_TAME, turns: 6, placed0: [[RIVER, 'farma']], riverForest: false });
  const bydloWithout = noTame.builtOn[RIVER] ?? [];
  assert(!bydloWithout.includes('bydlo'), `bez „Oswojenia zwierząt”: bydło NIE powstaje (przyczyna: tech) (got ${JSON.stringify(bydloWithout)})`);
}

console.log('5. E3: hodowla TYLKO na heksach przy rzece (bydło nie wchodzi na heksy bez rzeki)');
{
  const r = simulate({ forest: [], worked: WORKED, techs: ALL, turns: 6, placed0: [[RIVER, 'farma']], riverForest: false });
  const offRiver = Object.entries(r.builtOn).filter(([hk, keys]) => hk !== RIVER && keys.some(k => k === 'bydlo' || k === 'owce' || k === 'lama'));
  assert(offRiver.length === 0, `brak hodowli na heksach bez rzeki (got ${JSON.stringify(offRiver)})`);
}

console.log('\nWynik:', passed, 'PASS /', failed, 'FAIL');
process.exit(failed === 0 ? 0 : 1);
