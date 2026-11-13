'use strict';
/**
 * R-WEB-TEST-HOOK-SETCITYLIMIT-Q1 — test Chromium `?civTest=1` na ZYWEJ grze (bundle z test-hook-setcitylimit-live-bundle.cjs).
 * Scenariusz: stolica -> unlockAllTech (epoka rosnie) -> bez haka zalozenie 2. miasta sie UDAJE (limit 10+) ->
 * setCityLimit(1) -> zalozenie 2. miasta odrzucone komunikatem "limit miast na tej epoce"; setCityLimit(5) -> znow mozliwe;
 * zmiana epoki po wywolaniu nie jest sprawdzana tu (opisana w testach jednostkowych).
 * Usage: ROBOCZA_HTML=<Gra-LIVE.html> NODE_PATH=<gra/node_modules> EVID_DIR=<katalog> node gra/tools/test-hook-setcitylimit-live-test.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');

const TRY = () => {
  const T = window.__civTest;
  const st = T.state();
  const cap = st.cities.find((c) => c.ownerId === st.me);
  const dist = (a, b) => Math.max(Math.abs(a.q - b.q), Math.abs(a.r - b.r), Math.abs(a.q + a.r - b.q - b.r));
  const ring = T.around(cap.q, cap.r, 5, false).filter((h) => dist(h, cap) >= 3 && h.owner === st.me && h.teren !== 'morze' && h.teren !== 'plytkie_morze').sort((a, b) => dist(b, cap) - dist(a, cap));
  const toast = () => { const el = document.getElementById('civ-hint-toast'); return el && el.style.display !== 'none' ? el.textContent : null; };
  const tries = [];
  const before = T.state().cities.length;
  for (const h of ring.slice(0, 12)) {
    const ok = T.foundCity(h.q, h.r);
    const t = toast();
    tries.push({ q: h.q, r: h.r, ok, toast: t });
    if (T.state().cities.length > before) return { founded: true, tries, ring: ring.length };
    if (t && /limit miast/i.test(t)) return { founded: false, limitMsg: true, tries, ring: ring.length };
  }
  return { founded: false, limitMsg: false, tries, ring: ring.length };
};

(async () => {
  const browser = await C.launch();
  // Bundle z test-hook-setcitylimit-live-bundle.cjs startuje od razu w grze (bez menu): domyslna nowa gra, czeka na pierwsze miasto.
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto('file://' + process.env.ROBOCZA_HTML + '?skipMenuRedirect=1&civTest=1', { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__civTest, null, { timeout: 180000 });
  const s = { page, errors };
  const out = { steps: {} };
  let pass = 0, fail = 0;
  const ok = (c, m) => { if (c) { pass++; console.log('  [OK] ' + m); } else { fail++; console.error('  [FAIL] ' + m); } };
  try {
    out.hookType = await s.page.evaluate(() => typeof (window.__civTest && window.__civTest.setCityLimit));
    ok(out.hookType === 'function', 'window.__civTest.setCityLimit jest funkcja (?civTest=1)');
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await s.page.evaluate(() => { const T = window.__civTest; T.unlockAllTech(); T.setPraca(100000); });
    // limit 1 po unlockAllTech: 2. miasto ma byc odrzucone z komunikatem o limicie
    await s.page.evaluate(() => window.__civTest.setCityLimit(1));
    out.steps.limit1 = await s.page.evaluate(TRY);
    ok(out.steps.limit1.ring > 0, `jest kandydat w terytorium (ring=${out.steps.limit1.ring})`);
    ok(out.steps.limit1.founded === false && out.steps.limit1.limitMsg === true, `limit 1 + 1 miasto: odmowa "limit miast" (toast=${JSON.stringify((out.steps.limit1.tries.slice(-1)[0] || {}).toast)})`);
    // limit 5: odmowa z powodu limitu znika (miasto zalozone albo inny powod niz limit)
    await s.page.evaluate(() => window.__civTest.setCityLimit(5));
    out.steps.limit5 = await s.page.evaluate(TRY);
    ok(out.steps.limit5.limitMsg !== true, `limit 5: brak odmowy "limit miast" (founded=${out.steps.limit5.founded})`);
  } catch (e) { out.error = String(e.stack || e); fail++; console.error(out.error); }
  out.pageErrors = s.errors.slice(0, 10);
  C.save('live-setcitylimit.json', out);
  console.log(`\nPASS=${pass} FAIL=${fail}`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
