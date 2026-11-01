'use strict';
/**
 * node tools/ai-avoid-polar-player-parity-test.cjs
 * R-WEB-AI-AVOID-POLAR-CITIES-Q1 (obrona r1, zarzut 1): start GRACZA nie jest ograniczany ani przesuwany przez
 * zakaz polarny AI. Fixture = `playerStartHex` zmierzony na bazie 50edcc264 (bez rzek, 168x120, civ grecy,
 * rywaleNaKlaster 6, aktywneTypy 8, epoka kamien) dla 30 map (3 typy x 10 ziaren).
 * Asercja: identyczny hex na >= 28/30 map i zawsze odleglosc <= 12 od bazy; dopuszczone wyjatki to mapy,
 * gdzie stolice AI zeszly z polarnych i bramka separacji gracza (stolice obcych typow) widzi inny uklad.
 * Znane odchylenia (zmierzone): wyspy1001 100,48 -> 101,48; wyspy3333 95,49 -> 85,58.
 */
const path = require('path');
const fs = require('fs');
const esbuild = require('esbuild');
const GRA = path.resolve(__dirname, '..');
const entry = path.join(__dirname, '.ai-polar-parity-entry.ts');
const bundle = path.join(__dirname, '.ai-polar-parity-bundle.cjs');
fs.writeFileSync(entry, `
export { buildClusterStartPlan } from '../src/game/cluster-start';
export { generateMap } from '../src/map/generator';
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from '../src/map/riverGenSwitch';
export { hexDistanceAxial } from '../src/map/gen-helpers';
`, 'utf8');
esbuild.buildSync({ entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA, logLevel: 'silent' });
const M = require(bundle);
M.setRiverGenPhaseOverride('main');
M.setRiverGenEnabledOverride(false);
const civs = require('../data/civs.json');
const BASE = {"kontynenty4242":"134,33","kontynenty7777":"84,45","kontynenty1001":"87,66","kontynenty2024":"80,59","kontynenty31337":"90,54","pangea4242":"38,45","pangea7777":"52,90","pangea1001":"52,90","pangea2024":"121,95","pangea31337":"98,20","wyspy4242":"138,47","wyspy7777":"86,66","wyspy1001":"100,48","wyspy2024":"95,67","wyspy31337":"87,65","kontynenty11":"30,29","kontynenty222":"114,74","kontynenty3333":"43,60","kontynenty4444":"85,52","kontynenty5555":"126,59","pangea11":"36,58","pangea222":"57,96","pangea3333":"59,95","pangea4444":"101,18","pangea5555":"88,97","wyspy11":"55,76","wyspy222":"79,57","wyspy3333":"95,49","wyspy4444":"62,69","wyspy5555":"89,64"};
let same = 0, total = 0, maxD = 0; const diffs = [];
for (const key of Object.keys(BASE)) {
  const m = key.match(/^([a-z]+)(\d+)$/); const typ = m[1], seed = Number(m[2]);
  const map = M.generateMap(168, 120, seed, typ);
  const plan = M.buildClusterStartPlan({ map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 6, aktywneTypy: 8, startEpochId: 'kamien' });
  const [bq, br] = BASE[key].split(',').map(Number);
  const d = M.hexDistanceAxial(bq, br, plan.playerStartHex.q, plan.playerStartHex.r);
  total++; if (d === 0) same++; else diffs.push(`${key}: ${BASE[key]} -> ${plan.playerStartHex.q},${plan.playerStartHex.r} (d=${d})`);
  maxD = Math.max(maxD, d);
}
console.log(`PARITY same=${same}/${total} maxDist=${maxD}`); diffs.forEach(x => console.log('  ' + x));
try { fs.unlinkSync(entry); fs.unlinkSync(bundle); } catch (e) { /* ignore */ }
if (same < 28 || maxD > 12) { console.error('FAIL: start gracza przesuniety przez zmiane AI'); process.exit(1); }
console.log('PASS');
