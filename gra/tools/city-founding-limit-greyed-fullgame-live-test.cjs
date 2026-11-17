'use strict';
/**
 * R-WEB-UI-CITY-FOUNDING-LIMIT-GREYED-OUT-Q1 — dowód na PRAWDZIWEJ grze (main.ts, nie zrekonstruowany HUD):
 * bundle zywej gry (test-hook-setcitylimit-live-bundle.cjs, poza repo) + ?civTest=1 + Chromium.
 *
 * Scenariusz:
 *   1. nowa gra -> zakładanie stolicy (pierwsze miasto, limit nie blokuje) -> 1 miasto gracza
 *   2. window.__civTest.setCityLimit(1) -> limit = 1 w epoce gracza (1/1)
 *   3. panel budowy (toolbar „build”): przycisk [data-found-city] ma klasę limit, aria-disabled="true",
 *      meta „limit 1/1”, mały napis „osiągnięto limit”, wyszarzenie (opacity < 0.5)
 *   4. klik przy limicie NIE wchodzi w tryb zakładania (brak klasy sel na [data-found-city])
 *   5. setCityLimit(5) -> DOM ODŚWIEŻONY przy ponownym otwarciu panelu: przycisk znów aktywny, brak napisu limitu
 *      (pomiar odświeżania: bez akcji gracza stan może pozostać do najbliższego odświeżenia panelu — zapisywane w JSON)
 *
 * Usage: ROBOCZA_HTML=<Gra-LIVE.html z test-hook-setcitylimit-live-bundle.cjs> EVID_DIR=<katalog poza repo>
 *        node tools/city-founding-limit-greyed-fullgame-live-test.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const path = require('path');
const { wait } = C;

const readItem = (page) => page.evaluate(() => {
  const it = document.querySelector('[data-found-city]');
  if (!it) return null;
  const note = document.querySelector('[data-found-city-limit-note]');
  return {
    cls: it.className,
    ariaDisabled: it.getAttribute('aria-disabled'),
    meta: (it.querySelector('.meta') || {}).textContent || '',
    opacity: parseFloat(getComputedStyle(it).opacity),
    note: note ? note.textContent : null,
    selected: it.classList.contains('sel'),
  };
});

async function clearOverlays(page) {
  // Menu startowe (.civ-menu, „ROZPOCZNIJ GRĘ”) zostaje nad grą po ?skipMenuRedirect=1 i przechwytuje kliki
  // w pasek narzędzi. Test ukrywa je stylem (bez zmian w kodzie gry); logika gry i panel budowy działają bez zmian.
  await page.evaluate(() => {
    const m = document.querySelector('.civ-menu');
    if (m) m.style.display = 'none';
  });
  await wait(200);
}

async function openBuildPanel(page) {
  await clearOverlays(page);
  const open = await page.evaluate(() => !!document.querySelector('.civ-build-panel'));
  if (!open) {
    await page.locator('.civ-map-toolbar .tb[data-act="build"]').click();
    await wait(600);
  }
  for (let k = 0; k < 3; k++) {
    const isOpen = await page.evaluate(() => (document.querySelector('.civ-build-panel') || {}).classList?.contains('open') === true);
    if (isOpen) break;
    await page.locator('.civ-map-toolbar .tb[data-act="build"]').click();
    await wait(800);
  }
  for (let i = 0; i < 10; i++) {
    const n = await page.evaluate(() => document.querySelectorAll('.civ-build-panel .civ-build-item, .civ-build-panel .lbl').length);
    if (n > 0) break;
    await wait(500);
  }
  return page.waitForSelector('[data-found-city]', { state: 'attached', timeout: 15000 });
}

async function closeBuildPanel(page) {
  await page.keyboard.press('Escape');
  await wait(400);
}

(async () => {
  const browser = await C.launch();
  const out = { steps: {} };
  let pass = 0, fail = 0;
  const ok = (c, m, d) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m + (d !== undefined ? ' — ' + JSON.stringify(d) : '')); } };
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  try {
    await page.goto('file://' + process.env.ROBOCZA_HTML + '?skipMenuRedirect=1&civTest=1', { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__civTest, null, { timeout: 180000 });
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await page.evaluate(() => { const T = window.__civTest; T.setPraca(100000); });
    await wait(800);

    // 2. limit = 1 (jedno miasto gracza)
    await page.evaluate(() => window.__civTest.setCityLimit(1));
    await wait(300);

    // 3. panel budowy: stan limitu
    await openBuildPanel(page);
    const s3 = await readItem(page);
    out.steps.limitOn = s3;
    ok(!!s3, 'przycisk „Załóż miasto” [data-found-city] istnieje w panelu budowy (prawdziwa gra)');
    ok(s3 && / limit/.test(' ' + s3.cls + ' '), 'limit 1/1 -> klasa limit na przycisku', s3 && s3.cls);
    ok(s3 && s3.ariaDisabled === 'true', 'limit 1/1 -> aria-disabled="true"', s3 && s3.ariaDisabled);
    ok(s3 && s3.meta === 'limit 1/1', 'limit 1/1 -> meta „limit 1/1”', s3 && s3.meta);
    ok(s3 && s3.note === 'osiągnięto limit', 'limit 1/1 -> mały napis „osiągnięto limit” przy nagłówku Miasto', s3 && s3.note);
    ok(s3 && s3.opacity < 0.5, 'limit 1/1 -> wizualnie wyszarzony (opacity < 0.5)', s3 && s3.opacity);
    await page.screenshot({ path: C.EVID + '/limit-greyed-panel.png', clip: { x: 0, y: 0, width: 1600, height: 1000 } }).catch(() => {});

    // 4. klik nie wchodzi w tryb zakładania
    await page.locator('[data-found-city]').click({ force: true });
    await wait(300);
    const s4 = await readItem(page);
    out.steps.afterClick = s4;
    ok(s4 && !s4.selected, 'klik przy limicie nie wchodzi w tryb zakładania (brak klasy sel)', s4);

    // 5. podniesienie limitu -> ponowne otwarcie panelu odświeża stan
    await closeBuildPanel(page);
    await page.evaluate(() => window.__civTest.setCityLimit(5));
    await wait(200);
    const staleNoAction = await page.evaluate(() => {
      const it = document.querySelector('[data-found-city]');
      return it ? it.className : null;
    });
    out.steps.staleAfterRaiseNoAction = staleNoAction;
    await openBuildPanel(page);
    const s5 = await readItem(page);
    out.steps.limitRaised = s5;
    ok(s5 && !/ limit/.test(' ' + s5.cls + ' ') && s5.ariaDisabled === null, 'limit podniesiony do 5 -> po ponownym otwarciu panelu przycisk aktywny (brak klasy limit / aria-disabled)', s5);
    ok(s5 && s5.note === null, 'limit podniesiony -> brak napisu „osiągnięto limit”', s5 && s5.note);
  } catch (e) {
    out.error = String(e.stack || e);
    fail++;
    console.error(out.error);
  }
  out.pageErrors = errors.slice(0, 10);
  ok(errors.length === 0, 'brak błędów JS na stronie', errors.slice(0, 3));
  C.save('live-city-limit-greyed-fullgame.json', out);
  console.log(`\nPASS=${pass} FAIL=${fail}`);
  console.log('ślad: ' + path.join(C.EVID, 'live-city-limit-greyed-fullgame.json'));
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
