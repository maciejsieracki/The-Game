'use strict';
/**
 * live-verify-robocza-wizard.cjs — R-WEB-LIVE-VERIFY-ROBOCZA-Q1, punkt 1 (kreator, część DOM, PRAWDZIWY bundle).
 * Domyślny udział lądu per typ, reset przy zmianie typu, Ziemia bez suwaka, zapisane prefs nie nadpisywane.
 * Usage: node gra/tools/live-verify-robocza-wizard.cjs
 */
const C = require('./live-verify-robocza-common.cjs');
const PREFS_KEY = 'civ-new-game-prefs-v1';
let pass = 0, fail = 0;
const results = [];
function check(label, cond, detail) {
  results.push({ label, ok: !!cond, detail });
  if (cond) { pass++; console.log('  OK  ' + label); } else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

async function openWizard(sess) {
  const ok = await C.clickText(sess.page, /Rozpocznij grę/);
  await C.wait(500);
  return ok;
}

(async () => {
  const browser = await C.launch();
  try {
    // --- świeży profil
    let s = await C.openMenu(browser);
    check('menu: przycisk "Rozpocznij grę" -> kreator', await openWizard(s));
    await C.gotoStep(s.page, 'Ustawienia');
    let rows = await C.gridRows(s.page);
    check('domyślnie: Rozmiar mapy = Standardowy', C.valueOf(rows, 'Rozmiar mapy') === 'Standardowy', rows);
    check('domyślnie: Typ świata = Kontynenty', C.valueOf(rows, 'Typ świata') === 'Kontynenty');
    check('Kontynenty: udział lądu = 30%', C.valueOf(rows, 'Udział lądu na mapie') === '30% lądu / 70% morze', C.valueOf(rows, 'Udział lądu na mapie'));
    await s.page.screenshot({ path: C.EVID + '/live-kreator-domyslne.png' });
    await C.clickGridArrow(s.page, 'Typ świata', 1);
    rows = await C.gridRows(s.page);
    check('Pangea: typ = Pangea, udział lądu = 60%', C.valueOf(rows, 'Typ świata') === 'Pangea' && C.valueOf(rows, 'Udział lądu na mapie') === '60% lądu / 40% morze', rows.slice(0, 6));
    await s.page.screenshot({ path: C.EVID + '/live-kreator-pangea60.png' });
    await C.clickGridArrow(s.page, 'Typ świata', 1);
    rows = await C.gridRows(s.page);
    check('Wyspy: typ = Wyspy, udział lądu = 50%', C.valueOf(rows, 'Typ świata') === 'Wyspy' && C.valueOf(rows, 'Udział lądu na mapie') === '50% lądu / 50% morze');
    await s.page.screenshot({ path: C.EVID + '/live-kreator-wyspy50.png' });
    await C.clickGridArrow(s.page, 'Typ świata', 1);
    rows = await C.gridRows(s.page);
    check('Ziemia: typ = Ziemia, brak wiersza udziału lądu', C.valueOf(rows, 'Typ świata') === 'Ziemia' && C.valueOf(rows, 'Udział lądu na mapie') === undefined);
    await s.page.screenshot({ path: C.EVID + '/live-kreator-ziemia-bez-suwaka.png' });
    await C.clickGridArrow(s.page, 'Typ świata', 1); // zawija do Kontynenty?
    rows = await C.gridRows(s.page);
    const afterWrap = C.valueOf(rows, 'Typ świata');
    // reset przy zmianie typu: ustaw ręcznie udział 'Wyspy' (zmiana typu zawsze przywraca domyślny dla typu)
    await C.setWorldType(s.page, 'Wyspy');
    rows = await C.gridRows(s.page);
    check('powrót do Wyspy: udział lądu = 50% (reset do domyślnego typu)', C.valueOf(rows, 'Udział lądu na mapie') === '50% lądu / 50% morze', { afterWrap });
    // zmiana udziału lądu strzałką na Wyspy, potem zmiana typu => reset do domyślnego nowego typu
    await C.clickGridArrow(s.page, 'Udział lądu na mapie', 1);
    rows = await C.gridRows(s.page);
    const changed = C.valueOf(rows, 'Udział lądu na mapie');
    check('Wyspy: strzałka zmienia udział lądu (ręczna zmiana, pomiar)', changed !== '50% lądu / 50% morze', changed);
    await C.setWorldType(s.page, 'Pangea');
    rows = await C.gridRows(s.page);
    check('ręczna zmiana lądu + zmiana typu na Pangea => 60% (reset)', C.valueOf(rows, 'Udział lądu na mapie') === '60% lądu / 40% morze', C.valueOf(rows, 'Udział lądu na mapie'));
    check('brak błędów strony (kreator)', s.errors.length === 0, s.errors.slice(0, 3));
    // zapisane prefs
    const saved = await s.page.evaluate((k) => window.localStorage.getItem(k), PREFS_KEY);
    check('prefs zapisane w localStorage po zmianach (pomiar)', typeof saved === 'string' && saved.length > 0, saved && saved.slice(0, 200));
    await s.ctx.close();

    // --- zapisane preferencje nie nadpisywane (ten sam profil po przeładowaniu)
    s = await C.openMenu(browser);
    await openWizard(s);
    await C.gotoStep(s.page, 'Ustawienia');
    await s.page.locator('.civ-newgame .btn-adv').click();
    await s.page.waitForSelector('.civ-newgame .adv-overlay.open');
    const battleRow = s.page.locator('.civ-newgame .adv-modal .adv-row', { has: s.page.locator('.adv-lbl', { hasText: 'Bitwy' }) });
    await battleRow.locator('button.arr').nth(1).click();
    const bv = ((await battleRow.locator('.sv').textContent()) || '').trim();
    check('zmiana Bitwy -> "Bitwa automatyczna"', bv === 'Bitwa automatyczna', bv);
    await s.page.locator('.adv-modal .adv-close').click();
    await C.wait(200);
    const prefsAfter = await s.page.evaluate((k) => window.localStorage.getItem(k), PREFS_KEY);
    await s.page.reload({ waitUntil: 'load' });
    await s.page.waitForSelector('.civ-menu', { timeout: 120000 });
    await openWizard(s);
    await C.gotoStep(s.page, 'Ustawienia');
    await s.page.locator('.civ-newgame .btn-adv').click();
    await s.page.waitForSelector('.civ-newgame .adv-overlay.open');
    const advRows = await s.page.evaluate(() => Array.from(document.querySelectorAll('.adv-modal .adv-row')).map((r) => ({ lbl: (r.querySelector('.adv-lbl')?.textContent || '').trim(), val: (r.querySelector('.sv')?.textContent || '').trim() })));
    check('po przeładowaniu zapisane "Bitwa automatyczna" nie nadpisane domyślnym', C.valueOf(advRows, 'Bitwy') === 'Bitwa automatyczna', { prefsSaved: !!prefsAfter, bitwy: C.valueOf(advRows, 'Bitwy') });
    await s.page.screenshot({ path: C.EVID + '/live-kreator-prefs-po-reload.png' });
    await s.ctx.close();
  } finally {
    await browser.close();
  }
  C.save('punkt1-kreator-live.json', { bundle: C.BUNDLE, pass, fail, results });
  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('[live-verify-robocza-wizard] błąd:', e); process.exit(2); });
