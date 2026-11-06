'use strict';
/**
 * R-WEB-SETTINGS-AUTOBUILD-TOGGLE-Q1 — zrzuty UI: kreator (wiersz po przewinięciu), panel miasta OFF/ON, menu gry (przełącznik).
 * Usage: ROBOCZA_HTML=<bundle> EVID_DIR=<katalog> node tools/live-verify-autobuild-toggle-ui.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

async function openCityPanel(page) {
  const name = await page.evaluate(() => window.__civTest.state().cities.find((c) => c.ownerId === 0).name);
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const bt = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (bt) bt.click(); });
    await page.keyboard.press('Escape'); await wait(300);
  }
  // stolica jest w centrum widoku: dwuklik na hex miasta -> „Co wybierasz?” -> 1 = Miasto
  await page.mouse.dblclick(800, 500); await wait(800);
  await page.keyboard.press('1'); await wait(1500);
  const opened = await page.evaluate(() => !!document.querySelector('#cs-manager, [id^=cs-]'));
  return { name, opened };
}

(async () => {
  const browser = await C.launch();
  const out = {};
  try {
    // 1) kreator: przewiń do wiersza
    const s1 = await C.openMenu(browser);
    await C.clickText(s1.page, /Rozpocznij grę/);
    await wait(500);
    await C.gotoStep(s1.page, 'Ustawienia');
    await s1.page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('.civ-newgame .srow')).find((r) => /Automatyzacja budowy/i.test(r.textContent || ''));
      if (row) row.scrollIntoView({ block: 'center' });
    });
    await wait(400);
    out.wizardScroll = await s1.page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('.civ-newgame .srow')).find((r) => /Automatyzacja budowy/i.test(r.textContent || ''));
      if (!row) return null; const b = row.getBoundingClientRect();
      return { top: Math.round(b.top), bottom: Math.round(b.bottom), vh: innerHeight, text: (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120) };
    });
    await s1.page.screenshot({ path: C.EVID + '/01b-kreator-wiersz-automatyzacja-budowy.png' });
    await s1.ctx.close();

    // 2) gra: panel miasta OFF -> ON
    const s = await C.openMenu(browser);
    await s.page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await wait(1500);
    out.open1 = await openCityPanel(s.page);
    await s.page.screenshot({ path: C.EVID + '/04-panel-miasta-off.png' });
    out.offPanel = await s.page.evaluate(() => {
      const root = document.querySelector('.civ-city-panel, #city-panel, [class*=city-panel]') || document.body;
      const locked = Array.from(document.querySelectorAll('.auto-build-locked'));
      const hint = document.querySelector('[data-auto-build-hint]');
      const prof = document.querySelector('[data-auto-build-locked]');
      return { lockedButtons: locked.length, allDisabled: locked.every((b) => b.disabled), hint: hint ? hint.textContent : null, hasLockedBar: !!prof, root: root.className };
    });
    console.log('OFF panel', JSON.stringify(out.offPanel));
    // 3) włącz w menu gry (przełącznik) -> odśwież panel
    await s.page.keyboard.press('Escape'); await wait(400);
    out.pauseToggle = await s.page.evaluate(() => {
      if (document.querySelector('[data-act="autobuild-toggle"]')) return 'already-open';
      const mb = Array.from(document.querySelectorAll('button')).find((b) => /^\s*(☰\s*)?Menu\s*$/i.test(b.textContent || '') && b.offsetParent !== null);
      if (mb) { mb.click(); return 'clicked'; }
      return 'none';
    });
    await wait(600);
    out.pause = await s.page.evaluate(() => {
      const t = document.querySelector('[data-act="autobuild-toggle"]');
      return t ? { pressed: t.getAttribute('aria-pressed') } : null;
    });
    await s.page.screenshot({ path: C.EVID + '/05-menu-gry-przelacznik-off.png' });
    await s.page.evaluate(() => { const t = document.querySelector('[data-act="autobuild-toggle"]'); if (t) t.click(); });
    await wait(300);
    out.pauseAfter = await s.page.evaluate(() => { const t = document.querySelector('[data-act="autobuild-toggle"]'); return t ? t.getAttribute('aria-pressed') : null; });
    await s.page.screenshot({ path: C.EVID + '/06-menu-gry-przelacznik-on.png' });
    await s.page.evaluate(() => { const b = document.querySelector('[data-act="resume"]'); if (b) b.click(); });
    await wait(500);
    out.open2 = await openCityPanel(s.page);
    await s.page.screenshot({ path: C.EVID + '/07-panel-miasta-on.png' });
    out.onPanel = await s.page.evaluate(() => ({ lockedButtons: document.querySelectorAll('.auto-build-locked').length, hint: !!document.querySelector('[data-auto-build-hint]') }));
    console.log('ON panel', JSON.stringify(out.onPanel));
    out.errors = s.errors.slice(0, 8);
    await s.ctx.close();
  } finally {
    C.save('autobuild-toggle-ui.json', out);
    await browser.close();
  }
  console.log(JSON.stringify(out));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
