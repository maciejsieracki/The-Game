'use strict';
/**
 * prebattle-labels-q1.cjs — R-WEB-UI-PREBATTLE-RAW-IDS-AND-ROSTER-OVERLAP-Q1.
 *
 * Asercje (exit 1 przy naruszeniu) dla tekstow, ktore gracz widzi w oknie „Rozstawienie bitwy”:
 *  - etykiety parametrow Matrix (civMatrixParameterLabelPl) i chipow (civBonusOpisPl): zero surowych ID,
 *    zero resztek technicznych ('w', 'wlasne', 'szarzy', 'morze' jako osobny fragment), poprawne
 *    'oblężniczych' dla kategorii obleczenie;
 *  - etykiety terenu (TEREN_LABEL_PL): kazdy TerenBazowy ma polska nazwe bez „_”;
 *  - zrodlo okna: terenLabelPl (preBattle.ts) i terrainLabelPl (main.ts) czytaja TEREN_LABEL_PL, nie surowe id.
 *
 * Usage: node tools/prebattle-labels-q1.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA_ROOT, 'node_modules', 'esbuild'));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'prebattle-labels-'));
const ENTRY = path.join(GRA_ROOT, 'src', 'game', '__prebattle-labels-entry.ts');
const BUNDLE = path.join(tmp, 'labels.cjs');
fs.writeFileSync(ENTRY, [
  "import { civMatrixParameterLabelPl, civBonusOpisPl } from './civ-matrix-semantic';",
  "import { TEREN_LABEL_PL } from '../map/terrain-names';",
  "import { TerenBazowy } from '../types/hex';",
  "import matrixRaw from '../../data/civ-matrix.json';",
  'export const paramIds = Object.keys((matrixRaw as any).paramDefs);',
  'export { civMatrixParameterLabelPl, civBonusOpisPl, TEREN_LABEL_PL, TerenBazowy };',
  '',
].join('\n'), 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.json': 'json', '.ts': 'ts' }, outfile: BUNDLE, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
} finally {
  fs.rmSync(ENTRY, { force: true });
}
const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.log('FAIL: ' + msg); }
}

// 1) Etykiety parametrow Matrix: brak surowych tokenow.
const LEFTOVER = new Set(['w', 'wlasne', 'szarzy', 'morze', 'obleczenie', 'bitwa']);
for (const id of M.paramIds) {
  const label = M.civMatrixParameterLabelPl(id);
  assert(!label.includes('_'), `etykieta ${id} zawiera „_”: ${label}`);
  assert(!/Matrix:/.test(label), `etykieta ${id} zawiera „Matrix:”: ${label}`);
  const parts = label.split(' · ');
  assert(parts.every(p => p.trim() !== '' && !LEFTOVER.has(p)),
    `etykieta ${id} zawiera pozostalosc identyfikatora: ${label}`);
}
assert(M.paramIds.length === 93, `liczba parametrow ${M.paramIds.length} (oczekiwano 93)`);

// 2) Konkretne etykiety z dispatchu i z ustalen Obrony (kategoria obleczenie = jednostki oblezncze).
eq(M.civMatrixParameterLabelPl('walka_atak_obleczenie'), 'Walka · atak · oblężniczych', 'walka_atak_obleczenie');
eq(M.civMatrixParameterLabelPl('walka_obrona_obleczenie'), 'Walka · obrona · oblężniczych', 'walka_obrona_obleczenie');
eq(M.civMatrixParameterLabelPl('walka_atak_piechota'), 'Walka · atak · piechoty', 'walka_atak_piechota');

// 3) Chipy bonusow: Matrix:<id> -> etykieta; inne opisy bez zmian.
eq(M.civBonusOpisPl('Matrix:walka_atak_piechota'), 'Walka · atak · piechoty', 'civBonusOpisPl Matrix:');
eq(M.civBonusOpisPl('Legion: atak'), 'Legion: atak', 'civBonusOpisPl bez prefiksu Matrix:');

// 4) Etykiety terenu: kazdy typ ma polska nazwe; plytkie_morze nie jest surowym id.
for (const v of Object.values(M.TerenBazowy)) {
  const label = M.TEREN_LABEL_PL[v];
  assert(typeof label === 'string' && label.trim() !== '' && !label.includes('_'),
    `TEREN_LABEL_PL[${v}] brak albo surowe id: ${label}`);
}
eq(M.TEREN_LABEL_PL[M.TerenBazowy.PlytkieMorze], 'Płytkie morze', 'TEREN_LABEL_PL plytkie_morze');

// 5) Zrodla w oknie: terenLabelPl (preBattle.ts) i terrainLabelPl (main.ts) czytaja TEREN_LABEL_PL.
const GRA_SRC = path.join(GRA_ROOT, 'src');
const preBattle = fs.readFileSync(path.join(GRA_SRC, 'ui', 'preBattle.ts'), 'utf8');
const main = fs.readFileSync(path.join(GRA_SRC, 'main.ts'), 'utf8');
assert(/function terenLabelPl\(teren: string\)[\s\S]{0,200}TEREN_LABEL_PL/.test(preBattle),
  'preBattle.ts: terenLabelPl nie czyta TEREN_LABEL_PL');
assert(/'Teren: ' \+ esc\(terenLabelPl\(info\.teren\)\)/.test(preBattle),
  'preBattle.ts: metaHtml nie pokazuje terenLabelPl(info.teren)');
assert(/function terrainLabelPl\(tb: string\)[\s\S]{0,400}TEREN_LABEL_PL/.test(main),
  'main.ts: terrainLabelPl nie czyta TEREN_LABEL_PL');

function eq(actual, expected, what) {
  assert(actual === expected, `${what}: oczekiwano „${expected}”, jest „${actual}”`);
}

try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ }
console.log(`prebattle-labels-q1: ${pass} pass / ${fail} fail`);
process.exitCode = fail === 0 ? 0 : 1;
