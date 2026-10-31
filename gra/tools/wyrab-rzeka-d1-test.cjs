'use strict';
/**
 * wyrab-rzeka-d1-test.cjs — regresja R-WEB-AUTOIMPROVE-PRIORITY-Q1, runda 4, decyzja D1 (TAK).
 * Run from gra/:  node tools/wyrab-rzeka-d1-test.cjs
 *
 * D1: wycinka na heksie RZEKA+LAS (KROK 0) NIE wymaga progu `WYRAB_MIN_FOREST_IN_RADIUS`
 * ani bramki `lesneMinSpelnione` (tartak/obóz). Minimum leśne dotyczy wyłącznie wycinki
 * POZA rzeką.
 *
 * Scenariusz: miasto pop 30 (lesneMin = 3), BEZ tartaku i obozu, w promieniu jeden las
 * (heks rzeki 13,12, obsadzony obywatelem). Oczekiwanie:
 *   T1: wyrab na 13,12. Pomiar: CZERWONY na źródłach origin/main 4d1916f2c (przez
 *       AI_SRC_DIR, bramka lesneMinSpelnione blokuje KROK 0 na rzece), ZIELONY na 83d837412
 *       (poprawka D1 = gałąź riverKrok0Ok, auto-improvements.ts:~1009-1016 i KROK 0 ~1032),
 *       CZERWONY przy mutacji cofającej D1 (dodany !lesneMinSpelnione w riverKrok0Ok).
 * Kontrola (zachowanie utrzymane): ten sam las poza rzeką, bez obywatela ani rzeki,
 *   bez tartaku => brak wyrębu (minimum leśne poza rzeką zostaje).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.wyrab-rzeka-d1-test-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wyrab-rzeka-d1-test-bundle.cjs');
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

const TECHS = new Set(['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja']);
const RIVER = '13,12';
const FAR = '16,16';

function makeMap(forest) {
  const hexes = {};
  for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  hexes[RIVER].rzeka = { obecna: true, krawedzie: [] };
  hexes[RIVER].nakladka = 'las';
  for (const k of forest) hexes[k].nakladka = 'las';
  return { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42,
    riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }]] };
}

// Jedna tura picker dla miasta pop 30 bez tartaku/obozu.
function pickOnce({ forest, worked }) {
  const map = makeMap(forest);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 30, ulepszeniaFocus: 'zrownowazone' };
  const picks = pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: [{ q: 12, r: 12, pop: 30, level: 1, ownerId: 0 }],
    placedImprovements: new Map(), pracaAvailable: 200, pracaBudgetPercent: 100,
    unlockedTechs: TECHS, pracaSurplusThreshold: 30, skipWyrab: false, civArchetype: 'grecy',
    getOnlyWorked: () => true, getWorkedHexKeys: () => new Set(worked),
    getFocus: () => 'zrownowazone', demandDriven: true,
    resourceDeficitKeys: ['drewno'], // niedobór nie-żywnościowy => foodOnly=false, tartak/oboz na liście (bramka lesneMin działa)
  });
  return picks;
}

// 1) D1: heks rzeka+las z obywatelem wycinany mimo braku tartaku/obozu i progu lasu.
{
  const picks = pickOnce({ forest: [RIVER], worked: ['12,12', RIVER] });
  const wyrabNaRzece = picks.some(p => p.key === 'wyrab' && `${p.q},${p.r}` === RIVER);
  assert(wyrabNaRzece, 'D1: wyrab na heksie rzeka+las (13,12) przy pop 30, bez tartaku/obozu, las=1 w promieniu');
}

// 2) Kontrola: las poza rzeką, bez obywatela, bez tartaku/obozu => brak wyrębu (minimum leśne poza rzeką).
{
  const picks = pickOnce({ forest: [FAR], worked: ['12,12'] });
  const wyrabPozaRzeka = picks.some(p => p.key === 'wyrab');
  assert(!wyrabPozaRzeka, 'kontrola: wyrab poza rzeką bez tartaku/obozu nie może wystąpić (minimum leśne)');
}

console.log(`wyrab-rzeka-d1-test: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
