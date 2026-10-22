'use strict';
/**
 * web-turn-slowdown-test.cjs — R-WEB-TURN-SLOWDOWN-Q2, bramka poprawek P1–P4.
 *
 * P1 refreshTerritoryBorderOverlay: widoczność/explored liczone RAZ na odświeżenie,
 *    nie per heks cudzego terytorium.
 * P2 opts.isProductionAllowed (pętla AI): pamięć per miasto + wejścia ownerowe na czas
 *    jednego decideAITurn.
 * P3 placedImprovementsForOwner: jedna tablica węzłów terytorium zamiast budowania jej
 *    od nowa dla każdego ulepszenia.
 * P4 empireTerritoryResourceRatesForOwner: obrabiane pola liczone tylko dla miast ownera.
 *
 * TEST NIETAUTOLOGICZNY (wzorzec ai-buduje-budynki-test.cjs): dwa buildy z LUSTRA `gra/`
 * w os.tmpdir() — FIX (żywe źródło) i PRE (te same pliki z czterema poprawkami cofniętymi
 * dokładnymi podmianami tekstu → zachowanie sprzed poprawki). Oba grają tę samą grę
 * (ten sam seed mapy + ziarnowany Math.random) przez `web-turn-slowdown-measure.cjs`.
 *
 * Asercje:
 *  D1  determinizm/brak zmiany zasad: skrót migawki zapisu identyczny FIX vs PRE w KAŻDEJ
 *      turze (te same decyzje AI, ten sam stan),
 *  D2  dwukrotny przebieg FIX daje te same skróty (deterministyczny harness),
 *  K1  koszt bramki produkcji AI (inclusive `isProductionAllowed` w profilu CPU ostatniej
 *      tury) w FIX < 50% PRE,
 *  K2  koszt `placedImprovementsForOwner` (inclusive) w FIX < PRE,
 *  K3  koszt `currentVisible` w profilu otwarcia+zamknięcia panelu miasta w FIX < 50% PRE,
 *  S   drzewo repo nietknięte (mutacje wyłącznie w lustrze).
 *
 * Bramka (z katalogu gra/): node tools/web-turn-slowdown-test.cjs
 * ENV: TURN_SLOWDOWN_TEST_TURNS (domyślnie 24), TURN_SLOWDOWN_TEST_SKIP_D2=1.
 * Czas: 2–3 buildy Vite + 2–3 przebiegi Chromium (~20–30 min na swiftshader).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, execFileSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_REL = path.join('src', 'main.ts');
const TURNS = Number(process.env.TURN_SLOWDOWN_TEST_TURNS || 24);
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-turn-slowdown-test-${RUN_ID}`);
process.on('exit', () => { try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ } });

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** [opis, tekst FIX, tekst PRE] — PRE odtwarza zachowanie sprzed poprawki. */
const REVERTS = [
  ['P1 visible', '        if (visOnce === null) visOnce = currentVisible();\n',
    '        visOnce = currentVisible();\n'],
  ['P1 explored', '        if (exploredOnce === null) exploredOnce = fogExploredForRender();\n',
    '        exploredOnce = fogExploredForRender();\n'],
  ['P2 memo', '              aiProdAllowedMemoLive = true;\n',
    '              aiProdAllowedMemoLive = false;\n'],
  ['P3 nodes', 'if (territoryOwnerAt(Number(qStr), Number(rStr), nodes) === ownerId) {',
    'if (territoryOwnerAtLive(Number(qStr), Number(rStr)) === ownerId) {'],
  ['P4 worked-owner', '        cities.filter(c => c.ownerId === ownerId),\n        map,\n        territoryNodes,\n        computeLostToNearerSiblingByCity(cities, map),\n      );\n',
    '        cities,\n        map,\n        territoryNodes,\n      );\n'],
];

function makeMirror(variant, mainSource) {
  const root = path.join(TMP_ROOT, `root-${variant}`);
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA_DIR, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA_DIR, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(path.join(GRA_DIR, 'src'), path.join(root, 'src'), { recursive: true });
  fs.writeFileSync(path.join(root, MAIN_REL), mainSource, 'utf8');
  const outDir = path.join(TMP_ROOT, `dist-${variant}`);
  console.log(`[turn-slowdown-test] vite build (${variant}) ...`);
  execSync(`node ${JSON.stringify(path.join(GRA_DIR, 'node_modules/vite/bin/vite.js'))} build --minify false`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`, { cwd: root, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 });
  fs.rmSync(root, { recursive: true, force: true });
  return outDir;
}

function runMeasure(dist, label) {
  const out = path.join(TMP_ROOT, `m-${label}`);
  console.log(`[turn-slowdown-test] gra ${TURNS} tur (${label}) ...`);
  execFileSync(process.execPath, [path.join(__dirname, 'web-turn-slowdown-measure.cjs'),
    '--dist', dist, '--out', out, '--turns', String(TURNS), '--profile-at', String(TURNS - 1), '--label', label],
  { stdio: 'inherit', timeout: 3600000 });
  const lines = fs.readFileSync(path.join(out, `${label}-turns.csv`), 'utf8').trim().split('\n');
  const head = lines[0].split(',');
  const rows = lines.slice(1).map((l) => Object.fromEntries(l.split(',').map((v, i) => [head[i], v])));
  const prof = JSON.parse(fs.readFileSync(path.join(out, `${label}-turn${TURNS - 1}.cpuprofile`), 'utf8'));
  const cityProf = JSON.parse(fs.readFileSync(path.join(out, `${label}-city${TURNS}.cpuprofile`), 'utf8'));
  return { rows, prof, cityProf };
}

/** Inclusive czas (ms) funkcji o danej nazwie w profilu CPU (bez podwójnego liczenia rekursji). */
function inclusiveMs(prof, fnName) {
  const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  let us = 0;
  for (let i = 0; i < prof.samples.length; i++) {
    let cur = prof.samples[i];
    while (cur !== undefined) {
      if (byId.get(cur).callFrame.functionName === fnName) { us += prof.timeDeltas[i] || 0; break; }
      cur = parent.get(cur);
    }
  }
  return us / 1000;
}

function main() {
  const live = fs.readFileSync(path.join(GRA_DIR, MAIN_REL), 'utf8');
  let pre = live;
  for (const [what, fix, old] of REVERTS) {
    const n = live.split(fix).length - 1;
    assert(`sanity: main.ts zawiera dokładnie jedną kotwicę poprawki ${what}`, n === 1, n);
    pre = pre.replace(fix, old);
  }
  if (fail) process.exit(1);
  fs.mkdirSync(TMP_ROOT, { recursive: true });

  const distFix = makeMirror('fix', live);
  const distPre = makeMirror('pre', pre);
  assert('S: bramka nie zmieniła śledzonego main.ts', fs.readFileSync(path.join(GRA_DIR, MAIN_REL), 'utf8') === live);

  const fix = runMeasure(distFix, 'fix');
  const preRun = runMeasure(distPre, 'pre');

  const fixHashes = fix.rows.map((r) => `${r.turn}:${r.saveHash}`);
  const preHashes = preRun.rows.map((r) => `${r.turn}:${r.saveHash}`);
  const firstDiff = fixHashes.findIndex((h, i) => h !== preHashes[i]);
  assert(`D1: identyczny skrót stanu FIX vs PRE w każdej z ${fixHashes.length} tur`,
    fixHashes.length === preHashes.length && fixHashes.length >= TURNS - 2 && firstDiff < 0,
    { firstDiff, fix: fixHashes[firstDiff], pre: preHashes[firstDiff] });

  if (process.env.TURN_SLOWDOWN_TEST_SKIP_D2 !== '1') {
    const fix2 = runMeasure(distFix, 'fix2');
    const h2 = fix2.rows.map((r) => `${r.turn}:${r.saveHash}`);
    assert('D2: drugi przebieg FIX daje te same skróty (harness deterministyczny)',
      JSON.stringify(h2) === JSON.stringify(fixHashes), { a: fixHashes.slice(-1), b: h2.slice(-1) });
  }

  const kFix = inclusiveMs(fix.prof, 'isProductionAllowed');
  const kPre = inclusiveMs(preRun.prof, 'isProductionAllowed');
  console.log(`  koszt isProductionAllowed (tura ${TURNS - 1}): FIX=${kFix.toFixed(1)} ms PRE=${kPre.toFixed(1)} ms`);
  assert('K1: bramka produkcji AI w FIX kosztuje < 50% PRE', kPre > 0 && kFix < 0.5 * kPre, { kFix, kPre });
  const pFix = inclusiveMs(fix.prof, 'placedImprovementsForOwner');
  const pPre = inclusiveMs(preRun.prof, 'placedImprovementsForOwner');
  console.log(`  koszt placedImprovementsForOwner: FIX=${pFix.toFixed(1)} ms PRE=${pPre.toFixed(1)} ms`);
  assert('K2: placedImprovementsForOwner w FIX tańsze niż w PRE', pFix < pPre, { pFix, pPre });

  const vFix = inclusiveMs(fix.cityProf, 'currentVisible');
  const vPre = inclusiveMs(preRun.cityProf, 'currentVisible');
  console.log(`  koszt currentVisible przy otwarciu/zamknięciu panelu miasta: FIX=${vFix.toFixed(1)} ms PRE=${vPre.toFixed(1)} ms`);
  assert('K3: widoczność przy odświeżeniu granic (panel miasta) w FIX < 50% PRE', vPre > 0 && vFix < 0.5 * vPre, { vFix, vPre });

  console.log(`\nweb-turn-slowdown-test: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main();
