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
 *  K4  (runda 2, P4) pomiar BEZPOŚREDNI po ostatniej turze (skróty D1 już zebrane):
 *      min z 5 serii po 20 wywołań `empireTerritoryResourceRatesForOwner` gracza
 *      (hak `timeTerritoryRatesMs`): FIX < 85% PRE. Warianty z profilu CPU jednej tury
 *      okazały się szumem (całe funkcje: 206,9 vs 206,5 ms; część pod
 *      computeWorked…/computeLostToNearer…: 85,3 vs 108,1 ms przy offline 40,7 vs 108,4
 *      na innym przebiegu) — zostają w logu informacyjnie.
 *  M   (runda 2) warunek nietrywialności D1 dla P2: przed ostatnią turą co najmniej jeden
 *      gracz AI miał ≥ 2 miasta przez ≥ 3 tury (pamięć P2 jest PER MIASTO — przy jednym
 *      mieście na gracza błąd „jedna pamięć dla wszystkich miast” jest niewidoczny; tak
 *      było przy dawnym domyślnym 24 turach, wykryte mutacją Evaluatora rundy 1),
 *  S   drzewo repo nietknięte (mutacje wyłącznie w lustrze).
 *
 * Bramka (z katalogu gra/): node tools/web-turn-slowdown-test.cjs
 * ENV: TURN_SLOWDOWN_TEST_TURNS (domyślnie 40; runda 2 — było 24, patrz M),
 *      TURN_SLOWDOWN_TEST_SKIP_D2=1, TURN_SLOWDOWN_TEST_EXTRA_REPLACE=<plik JSON
 *      [[szukany, zamiennik], ...]> — dodatkowa podmiana w wariancie FIX (WYŁĄCZNIE do
 *      testów mutacyjnych bramki; drzewo repo nietknięte).
 * Czas: 2–3 buildy Vite + 2–3 przebiegi Chromium po 40 tur (~25–40 min na swiftshader).
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync, execFileSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_REL = path.join('src', 'main.ts');
const TURNS = Number(process.env.TURN_SLOWDOWN_TEST_TURNS || 40);
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
  const cpo = JSON.parse(fs.readFileSync(path.join(out, `${label}-cities-per-owner.json`), 'utf8'));
  const { territoryRatesMs } = JSON.parse(fs.readFileSync(path.join(out, `${label}-summary.json`), 'utf8'));
  return { rows, prof, cityProf, cpo, territoryRatesMs };
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

/** Czas (ms) próbek, w których stosie pod funkcją `outer` występuje którakolwiek z `inners`. */
function inclusiveUnderMs(prof, outer, inners) {
  const byId = new Map(prof.nodes.map((n) => [n.id, n]));
  const parent = new Map();
  for (const n of prof.nodes) for (const c of n.children || []) parent.set(c, n.id);
  let us = 0;
  for (let i = 0; i < prof.samples.length; i++) {
    let cur = prof.samples[i];
    let inner = false;
    while (cur !== undefined) {
      const fn = byId.get(cur).callFrame.functionName;
      if (inners.includes(fn)) inner = true;
      if (fn === outer) { if (inner) us += prof.timeDeltas[i] || 0; break; }
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

  let fixSrc = live;
  if (process.env.TURN_SLOWDOWN_TEST_EXTRA_REPLACE) {
    for (const [a, b] of JSON.parse(fs.readFileSync(process.env.TURN_SLOWDOWN_TEST_EXTRA_REPLACE, 'utf8'))) {
      const n = fixSrc.split(a).length - 1;
      assert(`mutacja: kotwica występuje dokładnie raz (${a.slice(0, 50)}...)`, n === 1, n);
      fixSrc = fixSrc.replace(a, b);
    }
    console.log('[turn-slowdown-test] UWAGA: wariant FIX zmutowany (TURN_SLOWDOWN_TEST_EXTRA_REPLACE)');
  }
  const distFix = makeMirror('fix', fixSrc);
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

  // M: pamięć P2 (per miasto) ćwiczona przy ≥ 2 miastach jednego gracza AI przez ≥ 3 tury
  // przed końcem przebiegu (wtedy D1 wykrywa pomylenie miast w pamięci).
  const multiTurns = fix.cpo.filter((r) => r.turn < TURNS
    && Object.entries(r).some(([k, v]) => k.startsWith('o:') && v >= 2)).map((r) => r.turn);
  console.log(`  tury z graczem AI o >= 2 miastach (przed T${TURNS}): ${multiTurns.length} (pierwsza: ${multiTurns[0]})`);
  assert('M: co najmniej jeden gracz AI miał >= 2 miasta przez >= 3 tury (P2 per miasto ćwiczone)',
    multiTurns.length >= 3, { multiTurns });

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

  const P4_OUTER = 'empireTerritoryResourceRatesForOwner';
  const P4_INNER = ['computeWorkedMagazynYieldsByCity', 'computeLostToNearerSiblingByCity'];
  const eFix = inclusiveUnderMs(fix.prof, P4_OUTER, P4_INNER) + inclusiveUnderMs(fix.cityProf, P4_OUTER, P4_INNER);
  const ePre = inclusiveUnderMs(preRun.prof, P4_OUTER, P4_INNER) + inclusiveUnderMs(preRun.cityProf, P4_OUTER, P4_INNER);
  const eAllFix = inclusiveMs(fix.prof, P4_OUTER) + inclusiveMs(fix.cityProf, P4_OUTER);
  const eAllPre = inclusiveMs(preRun.prof, P4_OUTER) + inclusiveMs(preRun.cityProf, P4_OUTER);
  console.log(`  [informacyjnie] profil: część P4 (obrabiane pola + mapa sporów pod ${P4_OUTER}, tura + panel): FIX=${eFix.toFixed(1)} ms PRE=${ePre.toFixed(1)} ms`
    + ` (całe ${P4_OUTER}: FIX=${eAllFix.toFixed(1)} PRE=${eAllPre.toFixed(1)})`);
  // K4 (runda 2, po FAIL wariantu profilowego 85,3 vs 108,1 ms — pojedynczy profil jednej
  // tury ma szum próbkowania tego samego rzędu co efekt): pomiar BEZPOŚREDNI po ostatniej
  // turze, minimum z 5 serii po 20 wywołań `empireTerritoryResourceRatesForOwner` gracza.
  const tFix = fix.territoryRatesMs ? Math.min(...fix.territoryRatesMs) : NaN;
  const tPre = preRun.territoryRatesMs ? Math.min(...preRun.territoryRatesMs) : NaN;
  console.log(`  koszt 20× ${P4_OUTER} (min z 5 serii, po T${TURNS}): FIX=${tFix.toFixed(1)} ms PRE=${tPre.toFixed(1)} ms`
    + ` (serie FIX=${JSON.stringify(fix.territoryRatesMs)} PRE=${JSON.stringify(preRun.territoryRatesMs)})`);
  assert('K4: P4 — przychody terytorium gracza w FIX < 85% PRE (pomiar bezpośredni)', tPre > 0 && tFix < 0.85 * tPre, { tFix, tPre });

  console.log(`\nweb-turn-slowdown-test: ${pass} OK, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main();
