'use strict';
/**
 * save-label-test.cjs — domyślne nazwy zapisów (save-label.ts).
 *   node tools/save-label-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.save-label-entry.ts');
const OUT = path.join(__dirname, '.save-label-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  "export { buildDefaultSaveLabel, yearLabelFromTurn } from '../src/game/save-label.ts';\n",
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const { buildDefaultSaveLabel, yearLabelFromTurn } = require(OUT);

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

assert(yearLabelFromTurn(10) === 'rok 3500 p.n.e.', 'year turn 10');
assert(yearLabelFromTurn(1) === 'rok 3950 p.n.e.', 'year turn 1');

const manual = buildDefaultSaveLabel({
  kind: 'manual',
  turn: 10,
  headline: 'Ateny',
  mapSize: 'Standardowy',
  difficulty: 'normal',
});
assert(
  manual === 'Ateny · rok 3500 p.n.e. · tura 10 · Standardowy · Normalny',
  'manual label: ' + manual,
);

const quick = buildDefaultSaveLabel({
  kind: 'quick',
  turn: 10,
  headline: 'Ateny',
  mapSize: 'Standardowy',
  difficulty: 'hard',
});
assert(quick.startsWith('Szybki zapis · '), 'quick prefix');
assert(quick.includes('Trudny'), 'quick difficulty');

const auto = buildDefaultSaveLabel({
  kind: 'autosave',
  turn: 3,
  headline: 'Rzym',
  mapSize: 'Mały',
  difficulty: 'easy',
});
assert(auto.startsWith('Autozapis · '), 'autosave prefix');
assert(auto.includes('Łatwy'), 'autosave easy');

const short = buildDefaultSaveLabel({
  kind: 'manual',
  turn: 99,
  headline: 'Bardzo Długa Nazwa Stolicy Imperium',
  mapSize: 'Super ogromny',
  difficulty: 'normal',
  maxLen: 40,
});
assert(short.length <= 40, 'truncation maxLen');

console.log('save-label-test: OK (' + manual + ')');

try { fs.unlinkSync(ENTRY); fs.unlinkSync(OUT); } catch { /* ignore */ }
