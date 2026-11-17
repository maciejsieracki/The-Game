'use strict';
/**
 * army-merge-besieger-only-move-test.cjs -- R-WEB-ARMY-MERGE-JOIN-BESIEGING-TYPEID-CRASH-Q2.
 * Regresja: gdy WSZYSTKIE ruszone jednostki są OBLEGAJĄCE (oblegaCityId), `arrivingUnits` w
 * promptMergeIfCoLocated jest puste; wcześniej `mergeUnitRow(arrivingUnits[0]!)` rzucało
 * TypeError "Cannot read properties of undefined (reading 'typeId')" (ekran BOOT ERROR).
 *
 * Część A: JEDNOSTKOWA (realne src/game/armyMerge.ts, esbuild) -- niezmiennik: oblegające
 *          nie wchodzą do zbioru scalania, więc przybyli są puści.
 * Część B: STRUKTURALNA main.ts -- strażnik `arrivingUnits.length === 0` stoi PRZED pierwszym
 *          dostępem `arrivingUnits[0]` w promptMergeIfCoLocated (mutacja: usunięcie strażnika -> FAIL).
 * Run z gra/:  node tools/army-merge-besieger-only-move-test.cjs
 */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const GRA = path.resolve(__dirname, '..');
const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
let pass = 0, fail = 0;
const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.log('  [FAIL] ' + m + (d ? ' -- ' + d : '')); } };
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'amb-only-move-'));

console.log('A. JEDNOSTKOWA (armyMerge.ts)');
const entry = path.join(tmp, 'entry.ts');
const out = path.join(tmp, 'bundle.cjs');
fs.writeFileSync(entry,
  `export { besiegingUnitsOnHex, coLocatedForMergePrompt } from ${JSON.stringify(GRA + '/src/game/armyMerge')};\n`);
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', outfile: out, logLevel: 'error', absWorkingDir: GRA, nodePaths: [path.join(GRA, 'node_modules')] });
const M = require(out);

const U = (id, o = {}) => ({ id, ownerId: 0, q: 5, r: 5, ruchLeft: 2, inGarnizon: false, ...o });
{
  // Ruszona jednostka = oblegająca; rezydent = zwykła. Zbiór do scalania nie zawiera oblegającej.
  const moved = [U('besieger', { oblegaCityId: 'c1', ruchLeft: 0 })];
  const resident = U('resident');
  const all = [...moved, resident];
  const movedSet = new Set(moved.map(u => u.id));
  const besiegersHere = M.besiegingUnitsOnHex(all, 5, 5, 0).filter(x => !movedSet.has(x.id));
  const onHex = [...M.coLocatedForMergePrompt(all, 5, 5, 0), ...besiegersHere];
  const arriving = onHex.filter(x => movedSet.has(x.id));
  ok(arriving.length === 0, 'A1: ruszona oblegająca nie trafia do zbioru przybyłych (arriving pusty)', 'arriving=' + arriving.length);
  ok(onHex.every(x => x.id !== 'besieger'), 'A2: coLocatedForMergePrompt/besiegersHere pomijają ruszoną oblegającą jako przybyłą');
}
{
  // Zwykła ruszona jednostka wchodzi do przybyłych (brak regresji ścieżki podstawowej).
  const moved = [U('joiner')];
  const besieger = U('besieger', { oblegaCityId: 'c1', ruchLeft: 0 });
  const all = [...moved, besieger];
  const movedSet = new Set(moved.map(u => u.id));
  const besiegersHere = M.besiegingUnitsOnHex(all, 5, 5, 0).filter(x => !movedSet.has(x.id));
  const onHex = [...M.coLocatedForMergePrompt(all, 5, 5, 0), ...besiegersHere];
  const arriving = onHex.filter(x => movedSet.has(x.id));
  ok(arriving.length === 1 && arriving[0].id === 'joiner', 'A3: zwykły przybysz wchodzi do arriving (ścieżka dołączenia bez zmian)');
  ok(besiegersHere.some(x => x.id === 'besieger'), 'A4: oblegająca armia na heksie jest celem dołączenia (besiegersHere)');
}

console.log('B. STRUKTURALNA main.ts (promptMergeIfCoLocated)');
const src = fs.readFileSync(path.join(GRA, 'src', 'main.ts'), 'utf8');
const startIdx = src.indexOf('function promptMergeIfCoLocated(');
const endIdx = src.indexOf('function flushDeferredMergePrompts(', startIdx);
ok(startIdx > 0 && endIdx > startIdx, 'B0: znaleziono ciało promptMergeIfCoLocated');
const body = src.slice(startIdx, endIdx);
const guardIdx = body.indexOf('if (arrivingUnits.length === 0)');
const firstUseIdx = body.indexOf('mergeUnitRow(arrivingUnits[0]');
ok(guardIdx > 0, 'B1: strażnik pustych przybyłych (arrivingUnits.length === 0) istnieje');
ok(guardIdx > 0 && firstUseIdx > guardIdx, 'B2: strażnik stoi PRZED pierwszym dostępem arrivingUnits[0]',
  'guard=' + guardIdx + ' firstUse=' + firstUseIdx);
const guardBlock = guardIdx > 0 ? body.slice(guardIdx, guardIdx + 400) : '';
ok(/return;/.test(guardBlock.split('\n').slice(0, 4).join('\n')), 'B3: strażnik kończy się kontrolowanym powrotem (return)');

console.log('');
console.log('WYNIK: ' + pass + ' OK / ' + fail + ' FAIL');
process.exit(fail === 0 ? 0 : 1);
