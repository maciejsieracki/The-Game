/** node tools/river-fog-visibility-test.cjs — widoczność scalonych średnich rzek vs FoW. */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ENTRY = path.resolve(__dirname, '.river-fog-visibility-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-fog-visibility-bundle.cjs');

execSync(
  `npx esbuild ${ENTRY} --bundle --platform=node --format=cjs --outfile=${BUNDLE}`,
  { stdio: 'inherit', cwd: path.resolve(__dirname, '..') },
);

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  OK', msg); }
  else { fail++; console.error('FAIL', msg); }
};

const hidden = new Set(['1,0']);
const isHidden = (k) => hidden.has(k);
const hexKeys = ['0,0', '1,0', '2,0'];
const pointHex = ['0,0', '1,0', '2,0', '3,0'];
const riverHidden = (k) => hidden.has(k);

// FoW wyłączony — zawsze widoczne (regresja: średnie rzeki znikały przy F).
ok(
  M.mergedRiverVisibleInFog(false, null, isHidden, hexKeys) === true,
  'fogActive=false → scalony batch widoczny mimo ukrytego heksa',
);

// FoW aktywny, onboarding (riverRevealKeys) — wystarczy jeden odkryty heks.
ok(
  M.mergedRiverVisibleInFog(true, new Set(['0,0']), isHidden, hexKeys) === true,
  'onboarding: widoczny gdy choć jeden heks trasy nie jest w mgle',
);

// FoW aktywny, normalna gra — cały batch tylko gdy wszystkie heksy odkryte.
ok(
  M.mergedRiverVisibleInFog(true, null, isHidden, hexKeys) === false,
  'normalna mgła: ukryty gdy którykolwiek heks trasy w czerni',
);
ok(
  M.mergedRiverVisibleInFog(true, null, () => false, hexKeys) === true,
  'normalna mgła: widoczny gdy wszystkie heksy odkryte',
);

// --- pointHex / lastFogSig sentinel (regresja R-RZEKI-MEDIUM-FOW v2) ---
ok(
  M.computeRiverFogSig(pointHex, () => false) === 0,
  'computeRiverFogSig: wszystkie punkty odkryte → sig=0',
);
ok(
  M.computeRiverFogSig(pointHex, riverHidden) !== 0,
  'computeRiverFogSig: ukryty heks na trasie → sig≠0',
);

const fullIdx = M.buildRiverRibbonFullIndex(pointHex.length);
ok(
  fullIdx.length === (pointHex.length - 1) * 6,
  'buildRiverRibbonFullIndex: pełna wstęga ma (n-1)*6 indeksów',
);

const fogIdx = M.buildRiverRibbonFogIndex(pointHex, riverHidden);
ok(
  fogIdx.length < fullIdx.length,
  'buildRiverRibbonFogIndex: częściowa mgła → mniejszy indeks niż pełny',
);

// Kolizja sig=0 (FoW ON, wszystko odkryte) vs FoW OFF — sentinel −1 wymusza restore.
ok(
  M.needsRiverRibbonIndexUpdate(false, 0, 0) === true,
  'FoW OFF + lastFogSig=0 (kolizja z hashem mgły) → wymuś pełny indeks',
);
ok(
  M.needsRiverRibbonIndexUpdate(false, M.RIVER_FOG_SIG_OFF, 0) === false,
  'FoW OFF + lastFogSig=RIVER_FOG_SIG_OFF → bez zbędnego setIndex',
);
ok(
  M.needsRiverRibbonIndexUpdate(true, 0, 0) === false,
  'FoW ON + sig=0 bez zmiany → bez setIndex',
);
ok(
  M.needsRiverRibbonIndexUpdate(true, 0, 5) === true,
  'FoW ON + zmiana sig → setIndex',
);

console.log(`\nriver-fog-visibility-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
