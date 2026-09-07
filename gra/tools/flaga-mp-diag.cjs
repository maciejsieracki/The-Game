'use strict';
/**
 * flaga-mp-diag.cjs — sterownik DIAGNOSTYCZNY
 * TEMAT: R-DYPLO-FLAGA-MIASTO-PANSTWO-NIE-GASNIE-Q1
 *
 * Pomiar PO (`flaga-mp-op.cjs`) pokazał, że po naprawie flagi wymuszona wojna epoki Kamienia
 * DOCHODZI do stanu „pending" (przed naprawą nie dochodziła w ogóle), ale nie zamienia się
 * w wypowiedzenie wojny. Ten sterownik zbiera po każdej turze zapis z trzech sond
 * (`flaga-mp-diag.vite.config.ts`), żeby wskazać dokładne miejsce zatrzymania — bez żadnej
 * zmiany w `gra/src/**`.
 *
 * Uruchomienie (z gra/):
 *   node tools/flaga-mp-diag.cjs --seed 111 --turns 30 --out /tmp/flaga-diag --dist <dist>
 */
const fs = require('fs');
const path = require('path');

const argOf = (flag, dflt) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : dflt;
};
const SEED = parseInt(argOf('--seed', '111'), 10);
const TURNS = parseInt(argOf('--turns', '30'), 10);
// P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: cel zapisu unikalny per przebieg.
// Sygnatura `-<pid>-<6 znakow>` jest ta sama, ktorej uzywaja bramki w tools/ — osierocony
// katalog po przerwanym przebiegu sprzata startowy sweep dowolnej z nich.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.resolve(argOf('--out', `/tmp/flaga-diag-p${process.pid}`));
const DIST = path.resolve(argOf('--dist', `/tmp/civ-dist-flaga-op-diag-${TMPDIR_RUN_ID}`));
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const wait = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const { chromium } = require('playwright');
  let browser;
  try {
    browser = await chromium.launch({ args: ['--no-sandbox', '--allow-file-access-from-files'] });
  } catch (e) {
    browser = await chromium.launch({
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--allow-file-access-from-files'],
    });
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = [];
  page.on('pageerror', e => errors.push(String((e && e.message) || e)));
  await page.goto('file://' + path.join(DIST, 'index.html'));
  await page.waitForFunction(() => window.__flg && window.__flg.ready, { timeout: 120000 });

  await page.evaluate(s => window.__flg.start(s, {}), SEED);
  await page.waitForFunction(
    () => !window.__flg.blockers().awaitingFirstCity || window.__flg.tick().turn >= 1,
    { timeout: 60000 },
  ).catch(() => {});
  const founded = await page.evaluate(() => window.__flg.foundFirstCity());
  await page.evaluate(() => window.__flg.recruitScout());
  await page.evaluate(() => window.__flg.enableExplore());

  const snaps = [await page.evaluate(() => window.__flg.snap())];
  for (let i = 0; i < TURNS; i++) {
    await page.evaluate(() => window.__flg.recruitScout());
    await page.evaluate(() => window.__flg.enableExplore());
    const b = await page.evaluate(() => window.__flg.blockers());
    if (b.preBattleOpen || b.pendingAutoPreBattle || b.endTurnInProgress) {
      await page.evaluate(() => window.__flg.unblock());
    }
    if (b.gameOver) break;
    await page.evaluate(() => window.__flg.endTurn());
    const before = snaps[snaps.length - 1].t;
    let ok = false;
    for (let w = 0; w < 300; w++) {
      const t = await page.evaluate(() => window.__flg.tick());
      if (!t.endTurnInProgress && t.turn > before) { ok = true; break; }
      if (t.gameOver) { ok = true; break; }
      await wait(100);
    }
    if (!ok) await page.evaluate(() => window.__flg.unblock());
    snaps.push(await page.evaluate(() => window.__flg.snap()));
  }
  const diag = await page.evaluate(() => window.__flg.diag());
  await page.close();
  await browser.close();

  fs.writeFileSync(path.join(OUT_DIR, 'diag-' + SEED + '.json'),
    JSON.stringify({ seed: SEED, founded, errors, snaps, diag }, null, 2));
  console.log('[flg-diag] seed=' + SEED + ' zdarzen=' + diag.length + ' -> ' + OUT_DIR);
})().catch(e => { console.error('[flg-diag] BLAD:', e); process.exit(1); });
