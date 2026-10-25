'use strict';
/**
 * test-hook-determinism-test.cjs -- R-WEB-TEST-HOOK-DETERMINISM-Q1.
 *
 * Kryterium (c) z R-WEB-TEST-HOOK-HEADLESS-GAME-Q1: ten sam seed dwa razy -> identyczny
 * hash stanu po każdej turze, w dwóch przebiegach i dla dwóch seedów (101 i 102).
 *
 * Każdy przebieg = świeża strona (nowy kontekst Chromium) z hakiem `?testhook=1`,
 * start gry przez hak, N tur przez hak (`runTurns`). Porównujemy skróty stanu tura po turze
 * (miasta, jednostki, relacje, umowy, oferty -- bez ID i bez złota).
 *
 * Domyślnie 30 tur (wariant CI). Pełne 60 tur do raportu: DET_TURNS=60.
 *
 * Uruchomienie (z katalogu gra/): node tools/test-hook-determinism-test.cjs
 * Wynik: PASS/FAIL per asercja; kod wyjścia 0 tylko gdy wszystkie PASS.
 * Sprząta bundle (katalog tymczasowy poza repo) przez withSimBundle.
 */

const { withSimBundle, launchBrowser, openSimPage, waitForHook, startSimGame } = require('./lib/game-sim-harness.cjs');

const TURNS = Number(process.env.DET_TURNS || 30);
const SEEDS = [101, 102];
const TURN_TIMEOUT_MS = 240000;

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok: !!ok });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${detail ? ' -- ' + detail : ''}`);
}

/** Jeden przebieg: świeża strona, start przez hak, N tur. Zwraca skróty i błędy strony. */
async function runOnce(browser, bundleDir, seed) {
  const { page, context, pageErrors } = await openSimPage(browser, { bundleDir, testhook: true });
  try {
    await waitForHook(page);
    await startSimGame(page, { seed, aiCount: 5, cityStates: 2, difficulty: 'normal', era: 'kamien', playerPassive: true });
    const metrics = await page.evaluate(
      (n) => window.__test.runTurns(n, { playerPolicy: 'pass', turnTimeoutMs: 240000 }),
      TURNS,
    );
    return { hashes: metrics.map(m => m.hash), errors: pageErrors.slice(0, 5) };
  } finally {
    await context.close();
  }
}

(async () => {
  await withSimBundle(async ({ bundleDir }) => {
    const browser = await launchBrowser();
    const byRun = {};
    try {
      // Seedy równolegle (osobne strony); dwa przebiegi jednego seeda kolejno.
      await Promise.all(SEEDS.map(async (seed) => {
        byRun[seed] = [];
        for (let k = 0; k < 2; k++) byRun[seed].push(await runOnce(browser, bundleDir, seed));
      }));
    } finally {
      await browser.close();
    }

    for (const seed of SEEDS) {
      const [a, b] = byRun[seed];
      check(`seed ${seed}: ${TURNS} tur w każdym przebiegu`,
        a.hashes.length === TURNS && b.hashes.length === TURNS,
        `przebieg1=${a.hashes.length}, przebieg2=${b.hashes.length}`);
      check(`seed ${seed}: brak TIMEOUT`,
        ![...a.hashes, ...b.hashes].some(h => h.startsWith('TIMEOUT:')));
      const firstDiff = a.hashes.findIndex((h, i) => h !== b.hashes[i]);
      check(`seed ${seed}: identyczny hash po każdej turze (dwa przebiegi)`,
        firstDiff === -1,
        firstDiff === -1
          ? `hashe: ${a.hashes.slice(0, 6).join(' ')} ...`
          : `pierwsza różnica w turze ${firstDiff + 1}: ${a.hashes[firstDiff]} vs ${b.hashes[firstDiff]}`);
      check(`seed ${seed}: brak błędów strony`,
        a.errors.length === 0 && b.errors.length === 0,
        [...a.errors, ...b.errors].slice(0, 2).join(' | '));
    }

    const s1 = byRun[SEEDS[0]][0].hashes, s2 = byRun[SEEDS[1]][0].hashes;
    check('różne seedy dają różne przebiegi gry',
      JSON.stringify(s1) !== JSON.stringify(s2));
  });

  const failed = results.filter(r => !r.ok).length;
  console.log(`\nWYNIK: ${results.length - failed}/${results.length} PASS`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((e) => {
  console.error('FAIL', (e && e.stack) || e);
  process.exit(1);
});
