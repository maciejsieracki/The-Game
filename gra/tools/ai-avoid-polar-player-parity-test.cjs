'use strict';
/**
 * node tools/ai-avoid-polar-player-parity-test.cjs
 * R-WEB-AI-AVOID-POLAR-CITIES-Q1 (obrona r1, zarzut 1): start GRACZA nie jest ograniczany ani przesuwany przez
 * zakaz polarny AI. Fixture = `playerStartHex` zmierzony na bazie 50edcc264 (bez rzek, 168x120, civ grecy,
 * rywaleNaKlaster 6, aktywneTypy 8, epoka kamien) dla 30 map (3 typy x 10 ziaren).
 * Asercja: identyczny hex na >= 28/30 map i zawsze odleglosc <= 12 od bazy; dopuszczone wyjatki to mapy,
 * gdzie stolice AI zeszly z polarnych i bramka separacji gracza (stolice obcych typow) widzi inny uklad.
 * R-WEB-CAPITAL-SPACING-FIX-Q1 (obrona r1, zarzut 1): zmiana A (stolica regionu NAJBLIZEJ centroidu) i B (sep proporcjonalny)
 * celowo przesuwaja start gracza (stolica klastra) — fixture BASE PRZEGENEROWANY na HEAD tego tematu (clusters.ts po A+B),
 * te same 30 map/ziarna/parametry. Strazniczy sens testu zachowany: kolejne zmiany AI/POLAR nie moga ruszyc startu gracza
 * wzgledem nowej bazy (>=28/30, maxDist<=12). Stare znane odchylenia (wyspy1001, wyspy3333) dotyczyly poprzedniej bazy.
 * Znane odchylenia poprzedniej bazy (zmierzone): wyspy1001 100,48 -> 101,48; wyspy3333 95,49 -> 85,58.
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
const BASE = {"kontynenty4242":"130,34","kontynenty7777":"98,57","kontynenty1001":"90,49","kontynenty2024":"83,61","kontynenty31337":"78,61","pangea4242":"38,66","pangea7777":"67,98","pangea1001":"47,83","pangea2024":"90,94","pangea31337":"70,18","wyspy4242":"139,58","wyspy7777":"87,68","wyspy1001":"95,67","wyspy2024":"97,68","wyspy31337":"87,65","kontynenty11":"37,29","kontynenty222":"107,81","kontynenty3333":"43,60","kontynenty4444":"96,60","kontynenty5555":"126,59","pangea11":"41,37","pangea222":"69,97","pangea3333":"73,100","pangea4444":"61,22","pangea5555":"105,96","wyspy11":"72,44","wyspy222":"84,65","wyspy3333":"86,68","wyspy4444":"76,65","wyspy5555":"89,63"};
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
