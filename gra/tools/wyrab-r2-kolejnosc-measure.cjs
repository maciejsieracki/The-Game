'use strict';
/**
 * wyrab-r2-kolejnosc-measure.cjs — R-WEB-AUTOIMPROVE-PRIORITY-Q1 runda 2, pomiar E1–E4.
 * Run from gra/:  node tools/wyrab-r2-kolejnosc-measure.cjs
 * Pyta: czy FAZA 1 (heks po heksie) łamie kolejność „po typach" właściciela?
 * Scenariusz: miasto pop 3, dwa heksy pracowane przez obywateli, bez lasu:
 *   R = 13,12 rzeka, równina (E1: farma na rzece bez lasu — pierwsza)
 *   B = 11,12 równina, BEZ rzeki (farma tu dopiero po E1)
 * Wypisuje kolejność rozkazów w turze 1 i 2 (bez asercji; to jest pomiar, nie test).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.AI_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const ENTRY_FILE = path.resolve(__dirname, '.wyrab-r2-kolejnosc-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.wyrab-r2-kolejnosc-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, `export { pickAutoImprovements } from ${JSON.stringify(SRC + '/game/auto-improvements')};\n`, 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { pickAutoImprovements } = require(BUNDLE_FILE);
try { fs.unlinkSync(ENTRY_FILE); fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* ignore */ }

const ALL = ['Rolnictwo', 'Kamieniarstwo', 'Obróbka drewna', 'Murarstwo', 'Koło', 'Łowiectwo', 'Oswojenie zwierząt', 'Irygacja'];
const hexes = {};
for (let q = 0; q < 24; q++) for (let r = 0; r < 24; r++) {
  hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: 'rownina', nakladka: 'brak', ulepszenie: 'brak',
    wlasciciel: null, wioska: { istnieje: false, ludnosc: 0 }, widocznosc: {}, rzeka: { obecna: false, krawedzie: [] } };
}
const map = { szerokoscQ: 24, wysokoscR: 24, hexes, seed: 42, riverPaths: [[{ q: 13, r: 12 }, { q: 13, r: 11 }]] };
const worked = new Set(['12,12', '13,12', '11,12', '12,11', '12,13']);
const city = { id: 'c1', ownerId: 0, q: 12, r: 12, name: 'T', population: 3, ulepszeniaFocus: 'zywnosc' };
const placed = new Map();
for (let t = 1; t <= 2; t++) {
  const picks = pickAutoImprovements({
    cities: [city], ownerId: 0, map,
    territoryNodes: [{ q: 12, r: 12, pop: 3, level: 1, ownerId: 0 }],
    placedImprovements: placed, pracaAvailable: 200, pracaBudgetPercent: 100,
    unlockedTechs: new Set(ALL), pracaSurplusThreshold: 0, skipWyrab: false, civArchetype: 'grecy',
    getOnlyWorked: () => true, getWorkedHexKeys: () => worked,
    getFocus: () => 'zrownowazone', demandDriven: true,
  });
  console.log(`tura ${t}:`, picks.map(p => `${p.q},${p.r}:${p.key}`).join(' | ') || '(brak)');
  for (const p of picks) placed.set(`${p.q},${p.r}`, [...(placed.get(`${p.q},${p.r}`) ?? []), p.key]);
}
