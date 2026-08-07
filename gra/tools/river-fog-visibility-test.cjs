'use strict';
/**
 * node tools/river-fog-visibility-test.cjs — widoczność rzek (zwłaszcza ŚREDNICH) vs FoW.
 *
 * Sekcja A (jednostkowa): helpery `riverLod.ts` — sentinel RIVER_FOG_SIG_OFF, indeksy wstęgi.
 * Sekcja B (jednostkowa): indeks SCALONEGO batcha — granice odcinków, brak quadów między rzekami.
 * Sekcja C (END-TO-END, BUG-RZEKI-MEDIUM-FOW-REGRESJA-2): prawdziwa mapa z generatora →
 *   prawdziwe `renderLandRiversFromPaths` (scene.ts, headless) → prawdziwe scalone geometrie.
 *   Do 2026-08-07 bramka kończyła się na sekcji A i była ZIELONA, mimo że w grze średnie rzeki
 *   znikały przy FoW ON: batch 32/128 tras miał tylko `hexKeys` (suma ~100–270 heksów) i regułę
 *   all-or-nothing, więc JEDEN ciemny heks chował komplet średnich rzek. Sekcja C mierzy to
 *   wprost na scalonym buforze — dlatego nowa regresja nie przejdzie przez zieloną bramkę.
 *
 * UWAGA: plik wejściowy esbuild jest GENEROWANY tutaj (fs.writeFileSync). Wcześniej test
 * zakładał, że `.river-fog-visibility-entry.ts` już leży na dysku — a ten wzorzec jest
 * w `.gitignore:59` (`gra/tools/.*-entry.ts`), więc w świeżym klonie/worktree bramka
 * wywalała się z exit 1 („Could not resolve …-entry.ts"), zamiast cokolwiek sprawdzić.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.river-fog-visibility-entry.ts');
const BUNDLE = path.resolve(__dirname, '.river-fog-visibility-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  mergedRiverVisibleInFog,
  RIVER_FOG_SIG_OFF,
  computeRiverFogSig,
  buildRiverRibbonFullIndex,
  buildRiverRibbonFogIndex,
  needsRiverRibbonIndexUpdate,
  buildMergedRiverFullIndex,
  buildMergedRiverFogIndex,
  computeMergedRiverFogSig,
} from '../src/render/riverLod';
export { renderLandRiversFromPaths } from '../src/render/scene';
export { generateMap } from '../src/map/generator';
export * as THREE from 'three';
`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

// scene.ts oddaje klatkę przez requestAnimationFrame (C3 chunked build) — w node go nie ma.
globalThis.requestAnimationFrame = (cb) => setTimeout(() => cb(0), 0);

const M = require(BUNDLE);
const THREE = M.THREE;

let pass = 0;
let fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log('  OK', msg); }
  else { fail++; console.error('FAIL', msg); }
};

// =========================================================================
// A. Helpery pojedynczej wstęgi (główne rzeki) — regresja R-RZEKI-MEDIUM-FOW v2.
// =========================================================================
console.log('\n[A] helpery pojedynczej wstęgi');

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

// =========================================================================
// B. Indeks SCALONEGO batcha (medium/short/tributary w jednym meshu).
// =========================================================================
console.log('\n[B] indeks scalonego batcha (segPointHex)');

// Dwie niezależne rzeki w jednym meshu: A (3 punkty) + B (4 punkty).
const segA = ['0,0', '1,0', '2,0'];
const segB = ['10,0', '11,0', '12,0', '13,0'];
const segments = [segA, segB];

const mFull = M.buildMergedRiverFullIndex(segments);
ok(
  mFull.length === ((segA.length - 1) + (segB.length - 1)) * 6,
  'buildMergedRiverFullIndex: quady tylko WEWNĄTRZ odcinków ((3-1)+(4-1))*6 = 30',
);
// Odcinek B startuje od wierzchołka 2 * len(A) — bez tego offsetu batch rysowałby cudze trójkąty.
ok(
  Math.min(...mFull.slice((segA.length - 1) * 6)) === 2 * segA.length,
  'buildMergedRiverFullIndex: offset odcinka B = 2 * liczba punktów odcinka A',
);
// Żaden quad nie łączy końca rzeki A z początkiem rzeki B (to byłaby wstęga przez pół mapy).
{
  let crosses = false;
  for (let i = 0; i < mFull.length; i += 3) {
    const tri = [mFull[i], mFull[i + 1], mFull[i + 2]];
    const inA = tri.some((v) => v < 2 * segA.length);
    const inB = tri.some((v) => v >= 2 * segA.length);
    if (inA && inB) crosses = true;
  }
  ok(!crosses, 'buildMergedRiverFullIndex: zero trójkątów przecinających granicę odcinków');
}

// Mgła: ciemny heks w rzece A NIE gasi rzeki B (to jest sedno regresji).
{
  const darkA = new Set(['1,0']);
  const hid = (k) => darkA.has(k);
  const mFog = M.buildMergedRiverFogIndex(segments, hid);
  const bQuads = mFog.filter((v) => v >= 2 * segA.length).length;
  const aQuads = mFog.filter((v) => v < 2 * segA.length).length;
  ok(
    bQuads === (segB.length - 1) * 6,
    'buildMergedRiverFogIndex: ciemny heks w rzece A NIE usuwa quadów rzeki B',
  );
  ok(
    aQuads === 0,
    'buildMergedRiverFogIndex: rzeka A (oba quady dotykają ciemnego heksa) wypada z indeksu',
  );
  ok(
    M.computeMergedRiverFogSig(segments, hid) !== M.computeMergedRiverFogSig(segments, () => false),
    'computeMergedRiverFogSig: zmiana mgły w jednym odcinku zmienia hash batcha',
  );
  ok(
    M.buildMergedRiverFogIndex(segments, () => false).join(',') === mFull.join(','),
    'buildMergedRiverFogIndex bez mgły === pełny indeks (identyczny obraz przy FoW OFF)',
  );
}

// =========================================================================
// C. END-TO-END: prawdziwa mapa → prawdziwe scalone meshe rzek (scene.ts).
// =========================================================================
console.log('\n[C] end-to-end: generator + renderLandRiversFromPaths (headless)');

const R = 1;
const RIVER_MOUTH_Y = 0.3;
const SURFACE_OFFSET = 0.02;
const MAIN_HALF_WIDTH = R * 0.052;
// Te same progi co scene.ts: RIVER_BATCH_PATHS / RIVER_BATCH_PATHS_DENSE.
const BATCH_SIZE_DENSE = 128;

async function endToEnd() {
  // 90×70 „kontynenty" seed 3: ~87 tras, 46 nie-main, 11 scalonych batchy — pełne pokrycie
  // ścieżki batchowania przy ~17 s generacji (120×90 dawało to samo pokrycie za ~63 s).
  const map = M.generateMap(90, 70, 3, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
  });
  const paths = map.riverPaths ?? [];
  const kinds = map.riverPathKinds ?? paths.map(() => 'main');
  const mediumCount = kinds.filter((k) => (k ?? 'main') !== 'main').length;
  ok(mediumCount > 0, `mapa testowa ma rzeki nie-main do zbatchowania (${mediumCount})`);

  const scene = new THREE.Scene();
  const entries = [];
  const mat = new THREE.MeshBasicMaterial();
  await M.renderLandRiversFromPaths(
    map, paths, kinds, R, 'roblox', RIVER_MOUTH_Y, SURFACE_OFFSET,
    MAIN_HALF_WIDTH, scene, entries, mat, 55, undefined,
    { batchSize: BATCH_SIZE_DENSE, ribbonSegments: 3, tributaryDecimateDist: R * 0.032 },
  );

  const batched = entries.filter((e) => !e.pointHex);
  const mains = entries.filter((e) => e.pointHex);
  ok(mains.length > 0, `rzeki main mają pointHex (${mains.length} wpisów)`);
  ok(batched.length > 0, `powstały scalone batche medium/short/tributary (${batched.length})`);

  // REGRESJA #1: batch MUSI nieść mapowanie punkt→heks. Bez tego wraca reguła all-or-nothing.
  const withSegs = batched.filter((e) => Array.isArray(e.segPointHex) && e.segPointHex.length > 0);
  ok(
    withSegs.length === batched.length,
    `każdy scalony batch ma segPointHex (${withSegs.length}/${batched.length})`,
  );

  // REGRESJA #2: offsety wierzchołków muszą zgadzać się z REALNYM scalonym buforem.
  let offsetsOk = 0;
  let fullEqOrig = 0;
  for (const e of withSegs) {
    const pts = e.segPointHex.reduce((a, s) => a + s.length, 0);
    const posCount = e.waterGeo.getAttribute('position').count;
    if (posCount === 2 * pts) offsetsOk++;
    const orig = Array.from(e.waterGeo.getIndex().array);
    const built = M.buildMergedRiverFullIndex(e.segPointHex);
    if (orig.length === built.length && orig.every((v, i) => v === built[i])) fullEqOrig++;
  }
  ok(
    offsetsOk === withSegs.length,
    `suma punktów odcinków × 2 === liczba wierzchołków scalonej geometrii (${offsetsOk}/${withSegs.length})`,
  );
  ok(
    fullEqOrig === withSegs.length,
    `buildMergedRiverFullIndex odtwarza indeks z mergeGeometries 1:1 (${fullEqOrig}/${withSegs.length})`,
  );

  // REGRESJA #3 (objaw właściciela): przy FoW ON odkryty fragment sieci średnich rzek MA się
  // rysować. Stary kod chował cały batch, gdy KTÓRYKOLWIEK heks był ciemny → 0 widocznych.
  const start = paths.find((p, i) => (kinds[i] ?? 'main') !== 'main')?.[0];
  ok(!!start, 'znaleziono heks startowy na trasie średniej rzeki');
  const explored = new Set();
  const RAD = 6;
  for (let dq = -RAD; dq <= RAD; dq++) {
    for (let dr = Math.max(-RAD, -dq - RAD); dr <= Math.min(RAD, -dq + RAD); dr++) {
      explored.add(`${start.q + dq},${start.r + dr}`);
    }
  }
  const fogHidden = (k) => !explored.has(k);

  let batchesWithVisibleQuads = 0;
  let batchesAllOrNothingVisible = 0;
  let anyDarkHex = false;
  for (const e of withSegs) {
    const idx = M.buildMergedRiverFogIndex(e.segPointHex, fogHidden);
    if (idx.length > 0) batchesWithVisibleQuads++;
    // Reguła sprzed poprawki (all-or-nothing po hexKeys) — dla porównania w logu.
    if (M.mergedRiverVisibleInFog(true, null, fogHidden, e.hexKeys)) batchesAllOrNothingVisible++;
    for (const s of e.segPointHex) for (const h of s) if (fogHidden(h)) { anyDarkHex = true; break; }
  }
  console.log(
    `    batchy: ${withSegs.length} · widoczne po indeksie (nowa reguła): ${batchesWithVisibleQuads}`
    + ` · widoczne wg reguły all-or-nothing (stan przed poprawką): ${batchesAllOrNothingVisible}`,
  );
  ok(anyDarkHex, 'stan testowy realistyczny: część heksów rzek jest w czerni');
  ok(
    batchesWithVisibleQuads > 0,
    'FoW ON: odkryty odcinek średniej rzeki ZOSTAJE narysowany (regresja: znikał cały batch)',
  );
  ok(
    batchesAllOrNothingVisible === 0,
    'kontrola: stara reguła all-or-nothing dawała 0 widocznych batchy — to był objaw zgłoszony przez właściciela',
  );

  // REGRESJA #4: przy FoW OFF pełny indeks = obraz jak przed mgłą (brak „migotania" na F).
  let fogOffEqFull = 0;
  for (const e of withSegs) {
    const full = M.buildMergedRiverFullIndex(e.segPointHex);
    const noFog = M.buildMergedRiverFogIndex(e.segPointHex, () => false);
    if (full.length === noFog.length && full.every((v, i) => v === noFog[i])) fogOffEqFull++;
  }
  ok(
    fogOffEqFull === withSegs.length,
    `FoW OFF ↔ FoW ON z pełnym odkryciem: identyczny indeks (${fogOffEqFull}/${withSegs.length})`,
  );

  // REGRESJA #5: indeksy nie wychodzą poza bufor (offsety odcinków policzone poprawnie).
  let inRange = 0;
  for (const e of withSegs) {
    const posCount = e.waterGeo.getAttribute('position').count;
    const idx = M.buildMergedRiverFogIndex(e.segPointHex, fogHidden);
    if (idx.every((v) => v >= 0 && v < posCount)) inRange++;
  }
  ok(inRange === withSegs.length, `wszystkie indeksy mgły mieszczą się w buforze (${inRange}/${withSegs.length})`);
}

endToEnd().then(
  () => {
    console.log(`\nriver-fog-visibility-test: ${pass} pass, ${fail} fail`);
    process.exit(fail > 0 ? 1 : 0);
  },
  (err) => {
    console.error('FAIL (wyjątek w sekcji C):', err && err.stack ? err.stack : err);
    console.log(`\nriver-fog-visibility-test: ${pass} pass, ${fail + 1} fail`);
    process.exit(1);
  },
);
