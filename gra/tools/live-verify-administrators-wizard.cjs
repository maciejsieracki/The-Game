'use strict';
/**
 * R-WEB-SETTINGS-ADMINISTRATORS-WIZARD-Q1 — zrzuty UI (Chromium): kreator z pytaniem „Administratorzy”,
 * menu gry/ustawienia BEZ starego przełącznika automatyzacji, panel miasta przy OFF (bez przycisku administratora)
 * i przy ON (przycisk „Administrator +”).
 * Usage: ROBOCZA_HTML=<bundle index.html> EVID_DIR=<katalog> node tools/live-verify-administrators-wizard.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

async function openCityPanel(page) {
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const bt = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (bt) bt.click(); });
    await page.keyboard.press('Escape'); await wait(300);
  }
  await page.mouse.dblclick(800, 500); await wait(800);
  await page.keyboard.press('1'); await wait(1500);
  return page.evaluate(() => !!document.querySelector('#cs-manager, [id^=cs-]'));
}

const panelProbe = () => ({
  adminBtn: !!document.querySelector('#civ-v-administrator'),
  adminChip: !!document.querySelector('[data-adm-chip], .civ-v-adm-chip'),
  adminText: /Administrator/i.test((document.querySelector('.civ-city-panel, #city-panel') || document.body).textContent || ''),
  lockedButtons: document.querySelectorAll('.auto-build-locked').length,
  hint: (document.querySelector('[data-auto-build-hint]') || {}).textContent || null,
});

(async () => {
  const browser = await C.launch();
  const out = {};
  try {
    // 1) kreator: wiersz „Administratorzy”
    const s1 = await C.openMenu(browser);
    await C.clickText(s1.page, /Rozpocznij grę/);
    await wait(500);
    await C.gotoStep(s1.page, 'Ustawienia');
    await s1.page.evaluate(() => {
      const row = Array.from(document.querySelectorAll('.civ-newgame .srow')).find((r) => /Administratorzy/.test(r.textContent || ''));
      if (row) row.scrollIntoView({ block: 'center' });
    });
    await wait(400);
    out.wizard = await s1.page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('.civ-newgame .srow'));
      const row = rows.find((r) => /Administratorzy/.test(r.textContent || ''));
      return {
        found: !!row,
        text: row ? (row.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 260) : null,
        oldRow: rows.some((r) => /Automatyzacja budowy/i.test(r.textContent || '')),
      };
    });
    console.log('wizard', JSON.stringify(out.wizard));
    await s1.page.screenshot({ path: C.EVID + '/01-kreator-administratorzy.png' });
    await s1.ctx.close();

    // 2) gra (domyślnie Administratorzy OFF): panel miasta + menu gry
    const s = await C.openMenu(browser);
    await s.page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(s.page);
    await C.foundCapital(s.page);
    await wait(1500);
    out.openOff = await openCityPanel(s.page);
    await s.page.screenshot({ path: C.EVID + '/02-panel-miasta-administratorzy-off.png' });
    out.panelOff = await s.page.evaluate(panelProbe);
    console.log('panel OFF', JSON.stringify(out.panelOff));

    await s.page.keyboard.press('Escape'); await wait(400);
    await s.page.evaluate(() => {
      if (document.querySelector('.civ-pause-box')) return;
      const mb = Array.from(document.querySelectorAll('button')).find((b) => /^\s*(☰\s*)?Menu\s*$/i.test(b.textContent || '') && b.offsetParent !== null);
      if (mb) mb.click();
    });
    await wait(600);
    out.pause = await s.page.evaluate(() => {
      const box = document.querySelector('.civ-pause-box');
      return {
        open: !!box,
        autobuildToggle: !!document.querySelector('[data-act="autobuild-toggle"]'),
        autobuildSection: !!document.querySelector('[data-pause-autobuild]'),
        textHasOld: /Automatyzacja budowy/i.test(box ? box.textContent || '' : ''),
      };
    });
    console.log('pause', JSON.stringify(out.pause));
    await s.page.screenshot({ path: C.EVID + '/03-menu-gry-bez-przelacznika-automatyzacji.png' });
    await s.page.evaluate(() => { const b = document.querySelector('[data-act="resume"]'); if (b) b.click(); });
    await wait(500);

    // 3) ten sam świat z Administratorami ON (hak testowy = stan opcji kreatora)
    await s.page.evaluate(() => window.__civTest.setAutoBuild(true));
    out.openOn = await openCityPanel(s.page);
    await s.page.screenshot({ path: C.EVID + '/04-panel-miasta-administratorzy-on.png' });
    out.panelOn = await s.page.evaluate(panelProbe);
    console.log('panel ON', JSON.stringify(out.panelOn));
    out.errors = s.errors.slice(0, 8);
    await s.ctx.close();
  } finally {
    C.save('administrators-wizard.json', out);
    await browser.close();
  }
  console.log(JSON.stringify(out));
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
