'use strict';
/** Pending improvements — cofanie w turze (pending-improvements.ts). */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.pending-improvements-entry.ts');
const BUNDLE = path.resolve(__dirname, '.pending-improvements-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  PendingImprovementsTurn,
  pendingImprovementId,
  parsePendingImprovementId,
} from '../src/game/pending-improvements';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

ok(M.pendingImprovementId('3,4', 'wyrab') === '3,4:wyrab', 'id format');
const parsed = M.parsePendingImprovementId('3,4:wyrab');
ok(parsed?.hexKey === '3,4' && parsed?.key === 'wyrab', 'parse id');

const p = new M.PendingImprovementsTurn();
ok(!p.has('1,0', 'farma'), 'empty has');
p.add({ hexKey: '1,0', key: 'farma', kosztPraca: 20, action: 'ulepszenie' });
ok(p.has('1,0', 'farma'), 'after add');
ok(p.getUndoKeySet().has('1,0:farma'), 'undo key set');

const removed = p.remove('1,0', 'farma');
ok(removed?.kosztPraca === 20, 'remove returns entry');
ok(!p.has('1,0', 'farma'), 'after remove');

p.add({ hexKey: '2,0', key: 'wyrab', kosztPraca: 5, action: 'wycinka' });
p.commitTurn();
ok(p.size === 0, 'commitTurn clears');

console.log('pending-improvements-test:', pass, 'pass,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);
