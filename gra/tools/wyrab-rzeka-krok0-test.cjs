'use strict';
/**
 * wyrab-rzeka-krok0-test.cjs — regresja R-WEB-AUTOIMPROVE-PRIORITY-Q1 (Objaw A).
 * Run from gra/:  node tools/wyrab-rzeka-krok0-test.cjs
 *
 * Scenariusz właściciela: miasto z obywatelem na heksie rzeka+las, wolnoWycinacLas=true,
 * onlyWorked=true, odblokowane tartak (Obróbka drewna) i obóz (Łowiectwo), i inny las
 * w promieniu (tartak może stanąć poza rzeką). Oczekiwanie: heks rzeka+las ZOSTAJE wycięty
 * (KROK 0 przed tartakiem/obozem na tym heksie), a nie zamienia się w tartak+obóz na zawsze.
 * Pomiar przed naprawą: tartak+obóz na 13,12, wycinki 0 w 12 turach (czerwony).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.wyrab-krok0-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wyrab-krok0-test-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { pickAutoImprovements } = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) passed++;
  else { failed++; console.error('  FAIL:', msg); }
}

const ALL = ['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja'];
const RIVER = '13,12';

function makeMap(extraForest) {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes[RIVER].nakladka = 'las';
  for (const [q, r] of extraForest) hexes[`${q},${r}`].nakladka = 'las';
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42, riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }]] };
}

// Symulacja tur: wycinka (AI commit) zdejmuje Las; pozostałe picki dopisywane do warstw.
function simulate(extraForest, turns) {
  const map = makeMap(extraForest);
  const placed = new Map();
  const worked = new Set(['12,12', '11,12', '12,11', '12,13', '11,13', RIVER]);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 3, ulepszeniaFocus: 'zywnosc' };
  let wycinkiRiver = 0;
  let riverPlacedBeforeClear = [];
  for (let t = 1; t <= turns; t++) {
    const picks = pickAutoImprovements({
      cities: [city], ownerId: 0, map,
      territoryNodes: [{ q: 12, r: 12, pop: 3, level: 1, ownerId: 0 }],
      placedImprovements: placed, pracaAvailable: 200, pracaBudgetPercent: 100,
      unlockedTechs: new Set(ALL), pracaSurplusThreshold: 0, skipWyrab: false, civArchetype: 'grecy',
      getOnlyWorked: () => true, getWorkedHexKeys: () => worked,
      getFocus: () => 'zrownowazone', demandDriven: true,
    });
    for (const p of picks) {
      const hk = `${p.q},${p.r}`;
      if (p.key === 'wyrab') {
        map.hexes[hk].nakladka = 'brak';
        if (hk === RIVER) wycinkiRiver++;
        continue;
      }
      if (hk === RIVER && map.hexes[RIVER].nakladka === 'las') riverPlacedBeforeClear.push(p.key);
      placed.set(hk, [...(placed.get(hk) ?? []), p.key]);
    }
  }
  return { wycinkiRiver, riverPlacedBeforeClear, riverForest: map.hexes[RIVER].nakladka === 'las' };
}

console.log('1. rzeka+las z obywatelem, inny las w promieniu — heks rzeki wycinany jako KROK 0');
{
  const r = simulate([[10, 12], [10, 13], [11, 13], [9, 12], [11, 11]], 12);
  assert(r.wycinkiRiver === 1, `wycinka heksu rzeki = 1 (got ${r.wycinkiRiver}, przed wycinka na rzece stoi: ${JSON.stringify(r.riverPlacedBeforeClear)})`);
  assert(r.riverPlacedBeforeClear.length === 0, `na heksie rzeki+lasu przed wycinka nic nie stawiamy (got ${JSON.stringify(r.riverPlacedBeforeClear)})`);
  assert(!r.riverForest, 'heks rzeki nie ma Lasu po 12 turach');
}

console.log('\nWynik:', passed, 'PASS /', failed, 'FAIL');
process.exit(failed === 0 ? 0 : 1);
