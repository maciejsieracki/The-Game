/** node gra/tools/ambush-deploy-geometry-test.cjs — R-WEB-ARMY-AMBUSH-DEPLOY-BATTLE-Q1 (geometria rozstawienia z zasadzki) */
const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const ROOT = path.join(__dirname, '..');
const ENTRY = path.join(__dirname, '.ambush-deploy-entry.ts');
const BUNDLE = path.join(__dirname, '.ambush-deploy-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  AMBUSH_FORMATION_MAX_WIDTH,
} from '../src/game/ambush';
export {
  ambushLineIdeal,
  ambushResolveCells,
  ambushFlankCells,
} from '../src/battle/ambushDeploy';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: ROOT,
  logLevel: 'silent',
});

const M = require(BUNDLE);
fs.rmSync(ENTRY, { force: true });

let pass = 0;
let fail = 0;
function check(name, cond) {
  if (cond) { pass++; console.log('  OK   ' + name); }
  else { fail++; console.log('  FAIL ' + name); }
}

const W = M.AMBUSH_FORMATION_MAX_WIDTH;
const MID = 78;
const FRONT = 40;
const BOUNDS = { col0: 0, col1: 67, row0: 0, row1: 155 };
const keyOf = c => c.col + ',' + c.row;

console.log('[1] szerokosc linii zaskoczonych (max ' + W + ' w szeregu)');
check('AMBUSH_FORMATION_MAX_WIDTH = 3', W === 3);
for (const n of [1, 5, 12, 30, 60]) {
  const cells = M.ambushLineIdeal(n, FRONT, -1, MID);
  const perCol = new Map();
  for (const c of cells) perCol.set(c.col, (perCol.get(c.col) || 0) + 1);
  const maxPerCol = Math.max(...perCol.values());
  const distinct = new Set(cells.map(keyOf)).size === n;
  const rowsOk = cells.every(c => Math.abs(c.row - MID) <= 1);
  check(`N=${n}: ${cells.length} pozycji, maks. ${maxPerCol} w szeregu (<= ${W}), bez duplikatow, wiersze ${MID}±1`,
    cells.length === n && maxPerCol <= W && distinct && rowsOk);
}
const line60 = M.ambushLineIdeal(60, FRONT, -1, MID);
check('N=60: 20 szeregow cofajacych sie wzdluz osi (kolumny FRONT..FRONT-19)',
  new Set(line60.map(c => c.col)).size === 20 && line60[0].col === FRONT && line60[59].col === FRONT - 19);

console.log('[2] przydzial pozycji (bez nakladania, w granicach mapy)');
for (const n of [1, 5, 12, 30, 60]) {
  const ideal = M.ambushLineIdeal(n, FRONT, -1, MID);
  const res = M.ambushResolveCells(ideal, BOUNDS, () => true);
  const inside = res && res.every(c => c.col >= BOUNDS.col0 && c.col <= BOUNDS.col1 && c.row >= BOUNDS.row0 && c.row <= BOUNDS.row1);
  check(`N=${n}: przydzial zwraca ${n} pol, bez nakladania, w granicach`,
    res !== null && res.length === n && new Set(res.map(keyOf)).size === n && inside);
}
{
  const blocked = new Set([keyOf({ col: FRONT, row: MID }), keyOf({ col: FRONT, row: MID - 1 })]);
  const ideal = M.ambushLineIdeal(5, FRONT, -1, MID);
  const res = M.ambushResolveCells(ideal, BOUNDS, (c, r) => !blocked.has(c + ',' + r));
  check('zajete pola: przydzial omija je i nie nakłada jednostek',
    res !== null && res.length === 5 && res.every(c => !blocked.has(keyOf(c))) && new Set(res.map(keyOf)).size === 5);
}
check('za malo miejsca (5 jednostek, 4 pola): przydzial zwraca null',
  M.ambushResolveCells(M.ambushLineIdeal(5, 0, 1, 1), { col0: 0, col1: 1, row0: 0, row1: 1 }, () => true) === null);
check('dokladnie tyle pol (4 jednostki, 4 pola): przydzial sie udaje',
  (M.ambushResolveCells(M.ambushLineIdeal(4, 0, 1, 1), { col0: 0, col1: 1, row0: 0, row1: 1 }, () => true) || []).length === 4);

console.log('[3] zastawiajacy AI: skrzydla i tyly linii wroga');
{
  const enemyLine = new Set(M.ambushLineIdeal(12, FRONT, -1, MID).map(keyOf));
  const free = (c, r) => !enemyLine.has(c + ',' + r);
  const a = M.ambushFlankCells(12, BOUNDS, free, MID, FRONT);
  const b = M.ambushFlankCells(12, BOUNDS, free, MID, FRONT);
  check('N=12: zwraca 12 pozycji, wszystkie wolne, bez nakladania, w granicach',
    a !== null && a.length === 12 && a.every(c => free(c.col, c.row)) && new Set(a.map(keyOf)).size === 12
      && a.every(c => c.col >= BOUNDS.col0 && c.col <= BOUNDS.col1 && c.row >= BOUNDS.row0 && c.row <= BOUNDS.row1));
  check('deterministyczne: dwa wywolania daja ten sam wynik',
    JSON.stringify(a) === JSON.stringify(b));
  check('skrzydla: pierwsza pozycja na krawedzi pola (daleko od wiersza srodkowego)',
    a !== null && (a[0].row === BOUNDS.row0 || a[0].row === BOUNDS.row1));
}
check('AI bez wolnych pol: null (brak rozstawienia, fallback w scenie)',
  M.ambushFlankCells(3, { col0: 0, col1: 0, row0: 0, row1: 1 }, () => false, 0, 0) === null);

console.log('[4] zabezpieczenia (mutacje geometrii)');
{
  const wide = M.ambushLineIdeal(12, FRONT, -1, MID, 12);
  const perColWide = new Map();
  for (const c of wide) perColWide.set(c.col, (perColWide.get(c.col) || 0) + 1);
  check('mutacja „bez limitu szeregu” (width=N) lamie limit 3', Math.max(...perColWide.values()) > W);
}

fs.rmSync(BUNDLE, { force: true });
console.log(`\nWYNIK: ${pass} OK / ${fail} FAIL`);
if (fail > 0) process.exitCode = 1;
