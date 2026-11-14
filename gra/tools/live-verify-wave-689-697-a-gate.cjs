'use strict';
/**
 * live-verify-wave-689-697-a-gate.cjs — R-WEB-LIVE-VERIFY-WAVE-689-697-A-Q1, punkt 1 (FALA 697/693):
 * bramka „Zakończ turę” gracza w PRAWDZIWEJ grze (headless Chromium, bundle vite z `?civTest=1`).
 *
 * Kryteria z dispatchu:
 *  (P1a) tura ≤10: ujemny skarbiec NIE blokuje „Zakończ turę”,
 *  (P1b) tura ≥11: skarbiec ujemny, dźwignie mogą pokryć minus → blokada; przycisk ma title
 *        (zasób, wielkość minusu, dźwignie); kliknięcie NIE kończy tury,
 *  (P1c) po przywróceniu skarbca ponad zero tura się kończy realnym kliknięciem.
 *
 * Skarbiec jest sterowany hakiem grantPlayerGold (nie dźwignią UI). Stan startowy skarbca tury 11
 * został zmierzony wcześniej jako 150 000 (HUD po odjęciu 251 500 pokazał −101,5k). Sweep startuje
 * od pełnego wyzerowania i schodzi krokami po 50 aż do pierwszej blokady (lub limitu).
 * Render włączany na czas odczytu tooltipa (fast mode wstrzymuje render HUD).
 *
 * Użycie (z gra/; bundle zbudowany poza repo):
 *   node tools/live-verify-wave-689-697-a-gate.cjs --dist <dist> --out <katalog> [--seed 11]
 */
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist');
const OUT = arg('out');
const SEED = parseInt(arg('seed', '11'), 10);
const FALLBACK_CHROME = '/usr/bin/chromium';
const BASELINE_TREASURY_T11 = 150000; // zmierzone w tym samym seedzie (HUD: 150 000 przed sweepem)
const wait = ms => new Promise(r => setTimeout(r, ms));

async function launch(chromium, profileDir) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage', '--headless=new'];
  const o = { headless: true, args, viewport: { width: 1280, height: 800 } };
  try { return await chromium.launchPersistentContext(profileDir, o); } catch (_) {
    return await chromium.launchPersistentContext(profileDir, { ...o, executablePath: FALLBACK_CHROME });
  }
}

async function endTurnOnce(page) {
  await page.evaluate(() => window.__nnsMeasureDebug.endTurn());
  await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
  await wait(150);
}

/** Przycisk „Zakończ turę”: title i tekst z textContent (innerText daje wersalik CSS). */
async function readEndButton(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
    if (!b) return null;
    return { title: b.getAttribute('title') || '', text: (b.textContent || '').replace(/\s+/g, ' ').trim() };
  });
}

/** Klik natywnym zdarzeniem DOM (omija przykrycie overlayem). */
async function clickEndButton(page) {
  return page.evaluate(() => {
    const b = [...document.querySelectorAll('button')].find(x => /zakończ\s+turę/i.test(x.textContent || ''));
    if (!b) return false;
    b.click();
    return true;
  });
}

const turnNow = page => page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
const canEnd = page => page.evaluate(() => window.__nnsMeasureDebug.canEnd());
const grant = (page, n) => page.evaluate(x => window.__nnsMeasureDebug.grantPlayerGold(x), n);
const setFast = (page, on) => page.evaluate(v => window.__nnsMeasureDebug.setFast(v), on);

async function main() {
  if (!DIST || !OUT) { console.error('wymagane: --dist <bundle> --out <katalog>'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  let chromium;
  try { ({ chromium } = require('playwright')); } catch (_) {
    ({ chromium } = require('/opt/node22/lib/node_modules/playwright'));
  }
  const profile = path.join(OUT, 'profile-' + SEED);
  const ctx = await launch(chromium, profile);
  const page = ctx.pages()[0] || await ctx.newPage();
  const res = { seed: SEED, steps: {}, errors: [] };
  page.on('pageerror', e => res.errors.push('pageerror: ' + String(e && e.message || e).slice(0, 200)));
  try {
    await page.goto('file://' + path.join(path.resolve(DIST), 'index.html') + '?civTest=1&civSeed=' + SEED, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__nnsMeasureDebug, undefined, { timeout: 180000 });
    await page.evaluate(o => window.__nnsMeasureDebug.startGame(o), { seed: SEED, mapSize: 'Standardowy', civTypes: 15, cityStates: 2 });
    await page.waitForFunction(() => !window.__nnsMeasureDebug.awaitingFirstCity(), undefined, { timeout: 120000 }).catch(async () => {
      await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    });
    if (await page.evaluate(() => window.__nnsMeasureDebug.awaitingFirstCity())) {
      await page.evaluate(() => window.__nnsMeasureDebug.refoundPlayerAnywhere());
    }
    await setFast(page, true);
    await grant(page, 5000);
    res.steps.start = await turnNow(page);

    // Tury 1–4 (zapas skarbca).
    for (let i = 0; i < 4; i++) { await grant(page, 5000); await endTurnOnce(page); }

    // (P1a) tura 5 (≤10): deficyt nie blokuje.
    const t5 = await turnNow(page);
    await grant(page, -200000);
    await wait(300);
    const p1aCan = await canEnd(page);
    const p1aBtn = await readEndButton(page);
    await grant(page, 300000);
    const t5before = await turnNow(page);
    await endTurnOnce(page);
    res.steps.P1a = { turn: t5, canEndWithDeficit: p1aCan, title: p1aBtn && p1aBtn.title, text: p1aBtn && p1aBtn.text, endTurnAdvanced: (await turnNow(page)) > t5before };

    // Tury 5–10 (zapas).
    while ((await turnNow(page)) < 11) { await grant(page, 5000); await endTurnOnce(page); }
    const t11 = await turnNow(page);
    res.steps.turnAtGate = t11;

    // (P1b) tura 11: schodzenie skarbca przez 0 krokami po 50 aż do pierwszej blokady.
    // Start: skarbiec = BASELINE (150 000) -> odejmujemy BASELINE, żeby stanąć na 0.
    await grant(page, -BASELINE_TREASURY_T11);
    let total = BASELINE_TREASURY_T11;
    const sweep = [];
    let blockedAt = null;
    for (let k = 0; k < 400; k++) {
      await grant(page, -50);
      total += 50;
      await wait(120);
      const can = await canEnd(page);
      sweep.push({ cumulativeDeficit: total, canEnd: can });
      if (!can) { blockedAt = total; break; }
    }
    res.steps.P1b = { turn: t11, sweepSteps: sweep.length, firstBlockedCumulativeDeficit: blockedAt, firstBlockedTreasuryApprox: blockedAt === null ? null : BASELINE_TREASURY_T11 - blockedAt };
    res.sweepTail = sweep.slice(-4);
    if (blockedAt !== null) {
      // Odczyt tooltipa wymaga renderu HUD: włączenie renderu, krótka pauza, odczyt.
      await setFast(page, false);
      await wait(2500);
      const btn = await readEndButton(page);
      res.steps.P1b.title = btn && btn.title;
      res.steps.P1b.text = btn && btn.text;
      const before = await turnNow(page);
      const clicked = await clickEndButton(page);
      await wait(800);
      res.steps.P1b.clicked = clicked;
      res.steps.P1b.turnBeforeClick = before;
      res.steps.P1b.turnAfterClick = await turnNow(page);
      res.steps.P1b.clickDidNotEnd = res.steps.P1b.turnAfterClick === before;
      await page.screenshot({ path: path.join(OUT, `p1b-turn${t11}-blocked-at${blockedAt}.png`) });
    }

    // (P1c) przywrócenie skarbca ponad zero -> tura się kończy klikiem.
    await grant(page, total + 1000);
    await setFast(page, true);
    await wait(300);
    const canFixed = await canEnd(page);
    const tBefore = await turnNow(page);
    const clicked = await clickEndButton(page);
    await page.waitForFunction(() => !window.__nnsMeasureDebug.isEndTurnInProgress(), undefined, { timeout: 180000, polling: 200 }).catch(() => {});
    await wait(300);
    const tAfter = await turnNow(page);
    res.steps.P1c = { canEndAfterFix: canFixed, clicked, turnBefore: tBefore, turnAfter: tAfter, turnAdvanced: tAfter > tBefore };
  } catch (e) {
    res.fatal = String(e && e.stack || e).slice(0, 800);
  } finally {
    fs.writeFileSync(path.join(OUT, `result-seed${SEED}.json`), JSON.stringify(res, null, 2));
    await ctx.close();
    console.log(JSON.stringify(res, null, 2));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
