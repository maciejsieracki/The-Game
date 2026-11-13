'use strict';
/**
 * wyrab-rzeka-obywatel-measure.cjs — pomiar R-WEB-AUTOIMPROVE-PRIORITY-Q1 (Objaw A).
 * Run from gra/:  node tools/wyrab-rzeka-obywatel-measure.cjs
 * Macierz: wolnoWycinacLas (skipWyrab false/true) x onlyWorked (true/false) x scenariusz
 * (heks rzeka+las Z obywatelem / BEZ obywatela / las poza rzeką). Wypisuje picki.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.wyrab-measure-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wyrab-measure-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { pickAutoImprovements } = require(BUNDLE_FILE);

const TECHS = ['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja'];

function makeMap(w, h) {
  const hexes = {};
  for (let q = 0; q < w; q++) for (let r = 0; r < h; r++) {
    hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
      wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
  }
  return { szerokoscQ: w, wysokoscR: h, hexes, seed: 42, riverPaths: [] };
}

// Scenariusz: miasto (12,12) pop 3; rzeka przez (13,12) (las) i (13,11) (równina, pusty).
// Las poza rzeką: (10,12),(10,13),(11,13),(9,12),(11,11) — 5 heksów, bez rzeki.
function build(scenario) {
  const map = makeMap(24, 24);
  map.riverPaths = [[{ q: 13, r: 12 }, { q: 13, r: 11 }]];
  map.hexes['13,12'].nakladka = 'las';
  for (const [q, r] of [[10, 12], [10, 13], [11, 13], [9, 12], [11, 11]]) map.hexes[`${q},${r}`].nakladka = 'las';
  return map;
}

function run({ skipWyrab, onlyWorked, scenario, techs }) {
  const map = build(scenario);
  const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 3, ulepszeniaFocus: 'zywnosc' };
  // obywatele: stałe centrum + sąsiedzi; scenariusz decyduje, czy rzeka+las (13,12) ma obywatela
  const worked = new Set(['12,12', '11,12', '12,11', '12,13', '11,13']);
  if (scenario === 'rzeka-z-obywatelem') worked.add('13,12');
  const picks = pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: [{ q: 12, r: 12, pop: 3, level: 1, ownerId: 0 }],
    placedImprovements: new Map(), pracaAvailable: 200, pracaBudgetPercent: 100,
    unlockedTechs: new Set(techs), pracaSurplusThreshold: 0, skipWyrab, civArchetype: 'grecy',
    getOnlyWorked: () => onlyWorked, getWorkedHexKeys: () => worked,
    getFocus: () => 'zrownowazone', demandDriven: true,
  });
  return picks.map(p => `${p.key}@${p.q},${p.r}`).join(' ') || '(brak)';
}

const scenarios = ['rzeka-z-obywatelem', 'rzeka-bez-obywatela'];
for (const techs of [['Rolnictwo', 'Kamieniarstwo'], TECHS]) {
  console.log(`\n== techs=${techs.length > 2 ? 'ALL' : techs.join('+')}`);
  for (const skipWyrab of [false, true]) for (const onlyWorked of [true, false]) for (const sc of scenarios) {
    console.log(`wolnoWycinacLas=${!skipWyrab} onlyWorked=${onlyWorked} ${sc.padEnd(22)} -> ${run({ skipWyrab, onlyWorked, scenario: sc, techs })}`);
  }
}
