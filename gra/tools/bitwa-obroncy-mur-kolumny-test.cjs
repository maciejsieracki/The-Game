'use strict';
/**
 * bitwa-obroncy-mur-kolumny-test.cjs
 *
 * P-BITWA-OBRONCY-PRZED-MUREM-Q1 — dowod ZYWY (real Chromium/WebGL, real
 * BattleScene, prawdziwy build vite gry, NIE inspekcja kodu). Mierzy
 * rzeczywista kolumne (q) KAZDEJ jednostki obrony wzgledem `siegeWallCol`
 * w dwoch chwilach:
 *
 *   (A) START BITWY — `_placeUnits` -> `siegeMode` -> `_placeSiegeDefenders`.
 *       Zmierzone PRZED tym tematem: 0 obroncow przed murem (ta galaz byla
 *       juz poprawna — patrz notatka nizej).
 *
 *   (B) PO 1 TURZE TRYBU "AUTO-rozegranie bitwy" (klawisz R gracza w bitwie,
 *       `_toggleManualMode()`). TU byl REALNY defekt zgloszenia wlasciciela:
 *       `_activateUnit` wykonuje krok doktryny (`_executeGroupDoctrineStep`,
 *       galaz "AUTO bitwy") DLA WSZYSTKICH jednostek bez `groupId`/z doktryna
 *       auto — W TYM obroncow oblezenia — ZANIM kod dotrze do dedykowanej
 *       blokady "SIEGE DEFENDER HOLD" kilkadziesiat linii nizej. Doktryna
 *       "steady" liczy cel jako `_forwardCol('def', q, 2)` = 2 kolumny w
 *       kierunku atakujacego, WPROST przez/z muru. Zmierzone zywym dowodem
 *       PRZED naprawa (Playwright, ta sama sciezka co ponizej): CO NAJMNIEJ
 *       jeden obronca z muru (`onWallWalkway`) schodzi z q=siegeWallCol na
 *       q=siegeWallCol-1 (PRZED mur, po stronie atakujacego) juz w 1. turze
 *       AUTO — dokladny KIERUNEK objawu ze zgloszenia (obronca po zlej
 *       stronie muru); DOKLADNA liczba jednostek nie jest stala miedzy
 *       przebiegami (zalezy od kolejnosci aktywacji w danej turze) — zmierzone
 *       1/28 i 2/28 w kolejnych, niezaleznych uruchomieniach tej samej
 *       macierzy MUT na tym samym stanie repo. Dlatego asercja (B2) ponizej
 *       sprawdza tylko `> 0`, nigdy dokladnej liczby.
 *       Zaden z 4 kandydatow z dispatchu nie opisuje tego doslownie (nie jest
 *       to inna sciezka inicjalizacji (a), nie zla kolejnosc ustawienia
 *       siegeWallCol (b), nie zle oznaczenie strony (c) — najblizej (d)
 *       "wypad ktory nie wraca", tyle ze to nie oddzielny mechanizm wypadu:
 *       to GENERYCZNA sciezka ruchu trybu AUTO, ktora nigdy nie wiedziala o
 *       murze.
 *
 *   (C) WYWOLANIE WPROST `_placeUnitsOneSide('def', true)` (druga naprawa w
 *       tym temacie — Reset podczas fazy deploy) przez `window.__lastBattleScene`
 *       (dostepny w runtime, bo TS `private` bez `#` nie jest prywatne w JS).
 *       Testuje realna delegacje do `_placeSiegeDefenders` bez zadnej zmiany
 *       w kodzie produkcyjnym.
 *
 * MACIERZ A/B/C (nietautologicznosc, konwencja tego repo): buduje TRZY warianty
 * vite z tego samego drzewa `src/` — BASE (kod jak jest w worktree, po
 * naprawie), MUT (rewert strażnika naprawy #1 — `siegeDefenderNeverDoctrine`
 * z powrotem `false`/pominiete, dla (B)) i MUT2 (rewert TYLKO galezi naprawy
 * #2 w `_placeUnitsOneSide`, dla (C)). Test dowodzi: BASE zielony, MUT
 * CZERWONY na (B2), MUT2 CZERWONY na (C2) — na DOKLADNIE tych samych
 * asercjach — czyli obie asercje mierza realny mechanizm naprawy, nie
 * przypadek.
 *
 * Usage (z gra/): node tools/bitwa-obroncy-mur-kolumny-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

let chromium;
try { ({ chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'))); }
catch (e) {
  console.error('[bitwa-obroncy-mur-kolumny-test] playwright missing — npm i -D playwright');
  process.exit(1);
}
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const TMP_ROOT = path.join(os.tmpdir(), `civ-bitwa-obroncy-mur-${TMPDIR_RUN_ID}`);

// Sprzatanie osieroconych katalogow po przerwanym przebiegu (proces juz nie zyje).
(() => {
  const STALE = /^civ-bitwa-obroncy-mur-(\d+)-[a-z0-9]{6}$/;
  const alive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; } };
  try {
    for (const ent of fs.readdirSync(os.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      const pid = Number(m[1]);
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { fs.rmSync(path.join(os.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
process.on('exit', () => {
  try { fs.rmSync(TMP_ROOT, { recursive: true, force: true }); } catch { /* best-effort */ }
});

let pass = 0, fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' — ' + JSON.stringify(detail) : '')); }
}

const BATTLE_SCENE_REL = 'src/battle/battleScene.ts';
const GUARD_LINE =
  "    const siegeDefenderNeverDoctrine = ru.side === 'def' && this.siegeWallCol >= 0;\n"
  + "    if (!this._manualMode && !siegeDefenderNeverDoctrine) {";
const GUARD_LINE_REVERTED =
  "    const siegeDefenderNeverDoctrine = false; // MUTACJA: rewert naprawy P-BITWA-OBRONCY-PRZED-MUREM-Q1\n"
  + "    if (!this._manualMode && !siegeDefenderNeverDoctrine) {";

// Naprawa #2: galaz w `_placeUnitsOneSide` delegujaca 'def'+siegeMode do
// `_placeSiegeDefenders`. MUT2 wylacza TYLKO ta galaz (warunek zawsze false),
// zeby dowiesc, ze bez niej Reset podczas deploy znowu liczy kolumne wzgledem
// srodka pola, nie muru.
const GUARD_LINE_2 =
  "    if (side === 'def' && siegeMode && this.siegeWallCol >= 0) {";
const GUARD_LINE_2_REVERTED =
  "    if (false && side === 'def' && siegeMode && this.siegeWallCol >= 0) { "
  + "// MUTACJA: rewert naprawy #2 P-BITWA-OBRONCY-PRZED-MUREM-Q1";

function makeMirrorRoot(variant) {
  const root = path.join(TMP_ROOT, `root-${variant}`);
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA_DIR, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA_DIR, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(path.join(GRA_DIR, 'src'), path.join(root, 'src'), { recursive: true });
  return root;
}

function buildVariant(variant, mutate) {
  const root = makeMirrorRoot(variant);
  const outDir = path.join(TMP_ROOT, `dist-${variant}`);
  if (mutate === 'guard1') {
    const p = path.join(root, BATTLE_SCENE_REL);
    const src = fs.readFileSync(p, 'utf8');
    if (src.indexOf(GUARD_LINE) < 0) {
      throw new Error('Mutacja niemozliwa: nie znalazlem strażnika naprawy #1 w ' + BATTLE_SCENE_REL
        + ' (test straciłby nietautologiczność asercji B2).');
    }
    fs.writeFileSync(p, src.replace(GUARD_LINE, GUARD_LINE_REVERTED), 'utf8');
  } else if (mutate === 'guard2') {
    const p = path.join(root, BATTLE_SCENE_REL);
    const src = fs.readFileSync(p, 'utf8');
    if (src.indexOf(GUARD_LINE_2) < 0) {
      throw new Error('Mutacja niemozliwa: nie znalazlem strażnika naprawy #2 w ' + BATTLE_SCENE_REL
        + ' (test straciłby nietautologiczność asercji C2).');
    }
    fs.writeFileSync(p, src.replace(GUARD_LINE_2, GUARD_LINE_2_REVERTED), 'utf8');
  }
  console.log(`[bitwa-obroncy-mur-kolumny-test] vite build (${variant}) -> ${outDir} ...`);
  execSync(
    `node ${JSON.stringify(path.join(GRA_DIR, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 128 * 1024 * 1024 },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`Build (${variant}) nie wyprodukował index.html w ` + outDir);
  }
  return outDir;
}

async function launchBrowser() {
  try { return await chromium.launch({ headless: true }); }
  catch (e) { return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox'] }); }
}

async function measure(browser, outDir) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + path.join(outDir, 'index.html') + '?playtest=oblezenie-duze', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });

  const before = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    return { wallCol: bs.siegeWallCol, def: bs.def.map((u) => ({ q: u.q, onWallWalkway: u.onWallWalkway })) };
  });

  await page.evaluate(() => { window.__lastBattleScene._endDeployPhase(); });
  await page.evaluate(() => { window.__lastBattleScene._toggleManualMode(); }); // klawisz "R" gracza -- AUTO
  await page.waitForFunction(() => window.__lastBattleScene.roundNo >= 1, { timeout: 20000 });
  await page.waitForTimeout(3000); // domknij akcje 1. tury AUTO w toku

  const after = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    return {
      wallCol: bs.siegeWallCol,
      round: bs.roundNo,
      def: bs.def.filter((u) => !u.dead).map((u) => ({ q: u.q, onWallWalkway: u.onWallWalkway })),
    };
  });

  await page.close();
  return { before, after, errors };
}

// (C) Wywoluje _placeUnitsOneSide('def', true) WPROST na swiezej stronie
// (przed _endDeployPhase/_toggleManualMode — _savedDefBUs jest juz
// zapisane przez _placeUnits na starcie bitwy), przez window.__lastBattleScene.
async function measureResetDeploy(browser, outDir) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 768 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto('file://' + path.join(outDir, 'index.html') + '?playtest=oblezenie-duze', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__lastBattleScene, { timeout: 30000 });

  const result = await page.evaluate(() => {
    const bs = window.__lastBattleScene;
    bs._placeUnitsOneSide('def', true);
    return { wallCol: bs.siegeWallCol, def: bs.def.map((u) => ({ q: u.q, onWallWalkway: u.onWallWalkway })) };
  });

  await page.close();
  return { result, errors };
}

async function main() {
  const outDirBase = buildVariant('base', null);
  const outDirMut = buildVariant('mut', 'guard1');
  const outDirMut2 = buildVariant('mut2', 'guard2');
  fs.rmSync(path.join(TMP_ROOT, 'root-base'), { recursive: true, force: true });
  fs.rmSync(path.join(TMP_ROOT, 'root-mut'), { recursive: true, force: true });
  fs.rmSync(path.join(TMP_ROOT, 'root-mut2'), { recursive: true, force: true });

  const browser = await launchBrowser();
  const base = await measure(browser, outDirBase);
  const mut = await measure(browser, outDirMut);
  const resetBase = await measureResetDeploy(browser, outDirBase);
  const resetMut2 = await measureResetDeploy(browser, outDirMut2);
  await browser.close();

  // ── (A) START BITWY — obie wersje (BASE i MUT nie dotyka _placeSiegeDefenders) ──
  console.log('(A) BASE start: wallCol=', base.before.wallCol, 'obroncow=', base.before.def.length);
  const belowWallStartBase = base.before.def.filter((u) => u.q < base.before.wallCol);
  check('(A1) BASE: siegeWallCol ustawiony na starcie', base.before.wallCol >= 0, base.before.wallCol);
  check('(A2) BASE: sa obroncy do zmierzenia', base.before.def.length > 0, base.before.def.length);
  check(
    '(A3) BASE: WSZYSCY obroncy startuja z kolumna >= siegeWallCol (na murze lub za nim)',
    belowWallStartBase.length === 0,
    belowWallStartBase.slice(0, 5),
  );

  // ── (B) PO 1 TURZE TRYBU AUTO ────────────────────────────────────────────
  const belowWallAfterBase = base.after.def.filter((u) => u.q < base.after.wallCol);
  const belowWallAfterMut = mut.after.def.filter((u) => u.q < mut.after.wallCol);
  console.log('(B) BASE po AUTO (runda', base.after.round, '): obroncow ponizej muru =', belowWallAfterBase.length,
    '/', base.after.def.length);
  console.log('(B) MUT  po AUTO (runda', mut.after.round, '): obroncow ponizej muru =', belowWallAfterMut.length,
    '/', mut.after.def.length);
  check(
    '(B1) BASE (naprawiony kod): PO 1 turze trybu AUTO WSZYSCY obroncy nadal >= siegeWallCol',
    belowWallAfterBase.length === 0,
    belowWallAfterBase.slice(0, 5),
  );
  check(
    '(B2) DOWOD NIETAUTOLOGICZNOSCI: MUT (rewert straznika naprawy) odtwarza defekt — '
    + 'CO NAJMNIEJ jeden obronca schodzi ponizej siegeWallCol po tej samej turze AUTO',
    belowWallAfterMut.length > 0,
    { belowWallAfterMut: belowWallAfterMut.length, def: mut.after.def.length },
  );
  check('(B3) brak bledow JS w konsoli strony (BASE)', base.errors.length === 0, base.errors);

  // ── (C) WYWOLANIE WPROST _placeUnitsOneSide('def', true) ────────────────
  const belowWallResetBase = resetBase.result.def.filter((u) => u.q < resetBase.result.wallCol);
  const belowWallResetMut2 = resetMut2.result.def.filter((u) => u.q < resetMut2.result.wallCol);
  console.log('(C) BASE _placeUnitsOneSide(\'def\',true): ponizej muru =', belowWallResetBase.length,
    '/', resetBase.result.def.length);
  console.log('(C) MUT2 _placeUnitsOneSide(\'def\',true): ponizej muru =', belowWallResetMut2.length,
    '/', resetMut2.result.def.length);
  check(
    '(C1) BASE (naprawiona delegacja): _placeUnitsOneSide(\'def\',true) stawia WSZYSTKICH obroncow >= siegeWallCol',
    belowWallResetBase.length === 0,
    belowWallResetBase.slice(0, 5),
  );
  check(
    '(C2) DOWOD NIETAUTOLOGICZNOSCI naprawy #2: MUT2 (rewert galezi delegacji) odtwarza defekt — '
    + 'CO NAJMNIEJ jeden obronca ponizej siegeWallCol po _placeUnitsOneSide(\'def\',true)',
    belowWallResetMut2.length > 0,
    { belowWallResetMut2: belowWallResetMut2.length, def: resetMut2.result.def.length },
  );
  check('(C3) brak bledow JS w konsoli strony (BASE reset)', resetBase.errors.length === 0, resetBase.errors);

  console.log('---', pass, 'ok,', fail, 'fail');
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
