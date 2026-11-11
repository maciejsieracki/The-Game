'use strict';
/**
 * R-WEB-UI-IMPROVEMENT-AUTOMATION-LOCKED-WITHOUT-ADMIN-Q1 — dowód w REALNEJ grze (Chromium, bundle z vite build):
 *  (1) panel budowy 🔨 bez administratora ulepszeń: kontrolki automatyzacji disabled + adnotacja „Wymaga administratora ulepszeń”,
 *      a wymuszony klik (po zdjęciu `disabled`) NIE zmienia polityki państwa/miasta (guard w handlerze + w main.ts);
 *  (2) klik „Administrator ulepszeń +” otwiera panel wyboru (opis, bonusy, koszt, utrzymanie); brak środków -> Zatrudnij nieaktywne;
 *      Esc / klik w tło zamykają; „Zatrudnij” zmienia stan jak dotąd (skarbiec −40), a kontrolki stają się aktywne i działają;
 *  (3) panel miasta: „Administrator +” (administrator miasta) otwiera panel z bonusami wg poziomu budynku; zatrudnienie i zwolnienie.
 * Usage: ROBOCZA_HTML=<index.html z vite build> EVID_DIR=<katalog> node tools/live-verify-administrator-panel.cjs
 */
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

async function openBuildPanel(page) {
  const vis = () => page.evaluate(() => { const p = document.querySelector('.civ-build-panel'); return !!p && p.getBoundingClientRect().width > 0 && getComputedStyle(p).display !== 'none'; });
  if (await vis()) { await page.evaluate(() => { const b = document.querySelector('[data-act="build"]'); if (b) { b.click(); b.click(); } }); await wait(700); return vis(); }
  await page.evaluate(() => { const b = document.querySelector('[data-act="build"]'); if (b) b.click(); });
  await wait(700);
  return vis();
}
async function openCityPanel(page) {
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => { const bt = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij)$/.test((x.textContent || '').trim())); if (bt) bt.click(); });
    await page.keyboard.press('Escape'); await wait(300);
  }
  await page.mouse.dblclick(800, 500); await wait(800);
  await page.keyboard.press('1'); await wait(1500);
  return page.evaluate(() => !!document.querySelector('#civ-v-administrator'));
}
const controls = (page) => page.evaluate(() => {
  const q = (s) => Array.from(document.querySelectorAll(s));
  const dis = (s) => q(s).map((b) => b.disabled);
  return {
    empire: dis('[data-ulepszenia-empire-focus],[data-ulepszenia-empire-reczny]'),
    city: dis('[data-ulepszenia-city-focus],[data-ulepszenia-city-reczny]'),
    empireSlider: (document.querySelector('[data-ulepszenia-empire-percent]') || {}).disabled,
    override: (document.querySelector('[data-ulepszenia-city-override]') || {}).disabled,
    notes: q('[data-ulepszenia-locked-note]').map((n) => n.textContent.trim()),
    admBtn: (() => { const b = document.querySelector('[data-imp-admin-open]'); return b ? { text: b.textContent.trim(), title: b.getAttribute('title'), state: b.getAttribute('data-imp-admin-state') } : null; })(),
  };
});
const policy = (page) => page.evaluate(() => window.__civTest.state().policyMe);
const panelInfo = (page) => page.evaluate(() => {
  const d = document.querySelector('.civ-adm-panel');
  if (!d) return null;
  const c = d.querySelector('[data-adm-panel-confirm]');
  return {
    kind: d.getAttribute('data-adm-kind'), hired: d.getAttribute('data-adm-hired'), role: d.getAttribute('role'),
    title: (d.querySelector('h3') || {}).textContent, lead: (d.querySelector('[data-adm-lead]') || {}).textContent,
    bonuses: (d.querySelector('[data-adm-bonuses]') || {}).innerText, cost: (d.querySelector('[data-adm-cost]') || {}).innerText,
    upkeep: (d.querySelector('[data-adm-upkeep]') || {}).innerText, chips: d.querySelectorAll('.bld-res-chip svg').length,
    shortfall: (d.querySelector('[data-adm-shortfall]') || {}).innerText || null, block: (d.querySelector('[data-adm-block]') || {}).innerText || null,
    confirmDisabled: c ? c.disabled : null, hasDismiss: !!d.querySelector('[data-adm-panel-dismiss]'),
  };
});

(async () => {
  const browser = await C.launch();
  const out = {};
  let failed = 0;
  const ok = (c, m, d) => { if (c) console.log('PASS: ' + m); else { failed++; console.log('FAIL: ' + m + (d !== undefined ? ' — ' + JSON.stringify(d) : '')); } };
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    await C.foundCapital(page);
    await wait(1500);
    const cap = (await page.evaluate(() => window.__civTest.state())).cities.find((c) => c.ownerId === 0);
    await page.evaluate(() => {
      window.__civTest.unlockAllTech(); window.__civTest.setPraca(3000); window.__civTest.setAutoBuild(true);
      window.__civTest.setPolicy(0, { tryb: 'reczny', focus: 'zywnosc', pracaAutoPercent: 33 });
    });
    await page.evaluate((id) => window.__civTest.adminSetup(id, ['palac'], 500), cap.id);

    // (1) panel budowy bez administratora
    ok(await openBuildPanel(page), 'panel budowy otwarty');
    out.c1 = await controls(page);
    await page.screenshot({ path: C.EVID + '/01-panel-budowy-bez-administratora-zablokowany.png' });
    ok(out.c1.empire.length > 0 && out.c1.empire.every((d) => d === true) && out.c1.empireSlider === true && out.c1.override === true, 'bez administratora: kontrolki państwa i „Własne ustawienia” disabled', out.c1);
    ok(out.c1.notes.some((n) => /Wymaga administratora ulepszeń/.test(n)), 'adnotacja „Wymaga administratora ulepszeń”', out.c1.notes);
    const pol0 = await policy(page);
    await page.evaluate(() => {
      document.querySelectorAll('[data-ulepszenia-empire-focus],[data-ulepszenia-empire-reczny],[data-ulepszenia-city-override]').forEach((b) => { b.removeAttribute('disabled'); b.click(); });
    });
    await wait(500);
    const pol1 = await policy(page);
    ok(JSON.stringify(pol0) === JSON.stringify(pol1), 'wymuszony klik (bez disabled) NIE zmienia polityki państwa (guard w handlerze + main.ts)', { pol0, pol1 });
    const cityOv = await page.evaluate((id) => window.__civTest.state().cities.find((c) => c.id === id), cap.id);
    ok(!cityOv.ulepszeniaOverride, 'wymuszony klik nie włącza własnych ustawień miasta', { ov: cityOv.ulepszeniaOverride });

    // (2) panel wyboru: brak środków
    await page.evaluate((id) => window.__civTest.adminSetup(id, null, 10), cap.id);
    await openBuildPanel(page);
    await page.evaluate(() => document.querySelector('[data-imp-admin-open]').click());
    await wait(500);
    out.p0 = await panelInfo(page);
    await page.screenshot({ path: C.EVID + '/02-panel-administratora-ulepszen-brak-srodkow.png' });
    ok(out.p0 && out.p0.kind === 'improvements' && out.p0.role === 'dialog' && out.p0.hired === '0', 'klik „Administrator ulepszeń +” otwiera panel (role=dialog)', out.p0);
    ok(out.p0 && /40/.test(out.p0.cost) && /2/.test(out.p0.upkeep) && out.p0.chips >= 2 && out.p0.lead && out.p0.bonuses, 'panel: opis, bonusy, koszt 40, utrzymanie 2 (chipy z ikoną)', out.p0);
    ok(out.p0 && out.p0.confirmDisabled === true && /30/.test(out.p0.shortfall || ''), 'brak środków (10 < 40): Zatrudnij nieaktywne, „Brakuje 30”', out.p0);
    await page.keyboard.press('Escape'); await wait(300);
    ok(!(await page.evaluate(() => !!document.querySelector('.civ-adm-panel-host'))) && (await openBuildPanel(page)), 'Esc zamyka panel administratora i nie wychodzi z trybu budowy');
    await page.evaluate(() => document.querySelector('[data-imp-admin-open]').click()); await wait(400);
    await page.evaluate(() => document.querySelector('[data-adm-panel-back]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await wait(300);
    ok(!(await page.evaluate(() => !!document.querySelector('.civ-adm-panel-host'))), 'klik w tło zamyka panel');

    // (2b) z pieniędzmi: Zatrudnij
    await page.evaluate((id) => window.__civTest.adminSetup(id, null, 500), cap.id);
    await openBuildPanel(page);
    await page.evaluate(() => document.querySelector('[data-imp-admin-open]').click()); await wait(500);
    const t0 = (await page.evaluate((i) => window.__civTest.impAdminState(i), cap.id)).treasury;
    out.p1 = await panelInfo(page);
    await page.screenshot({ path: C.EVID + '/03-panel-administratora-ulepszen-przed-zatrudnieniem.png' });
    ok(out.p1 && out.p1.confirmDisabled === false, 'z 500 w skarbcu Zatrudnij aktywne', out.p1);
    await page.evaluate(() => document.querySelector('[data-adm-panel-confirm]').click()); await wait(800);
    const st = await page.evaluate((i) => window.__civTest.impAdminState(i), cap.id);
    out.p2 = await panelInfo(page);
    await page.screenshot({ path: C.EVID + '/04-panel-administratora-ulepszen-po-zatrudnieniu.png' });
    ok(st.hired && st.working && st.treasury === t0 - 40, 'Zatrudnij: stan jak dotąd (zatrudniony, pracuje, skarbiec −40)', { t0, st });
    ok(out.p2 && out.p2.hired === '1' && out.p2.hasDismiss, 'po zatrudnieniu ten sam panel pokazuje stan i „Zwolnij”', out.p2);
    await page.keyboard.press('Escape'); await wait(400);
    await openBuildPanel(page);
    out.c2 = await controls(page);
    await page.screenshot({ path: C.EVID + '/05-panel-budowy-z-administratorem-aktywny.png' });
    // suwak % jest nieaktywny w trybie ręcznym niezależnie od administratora (reguła dotychczasowa) — sprawdzamy profile i override
    ok(out.c2.empire.every((d) => d === false) && out.c2.override === false && out.c2.notes.length === 0, 'z administratorem kontrolki aktywne', out.c2);
    await page.evaluate(() => document.querySelector('[data-ulepszenia-empire-focus="surowce"]').click());
    await wait(500);
    const pol2 = await policy(page);
    ok(pol2.focus === 'surowce' && pol2.tryb === 'auto', 'z administratorem klik profilu zmienia politykę (jak dotąd)', pol2);

    // zwolnienie z panelu
    await page.evaluate(() => document.querySelector('[data-imp-admin-open]').click()); await wait(400);
    await page.evaluate(() => document.querySelector('[data-adm-panel-dismiss]').click()); await wait(600);
    const st3 = await page.evaluate((i) => window.__civTest.impAdminState(i), cap.id);
    ok(!st3.hired, 'Zwolnij w panelu zwalnia administratora (dotychczasowa logika)', st3);
    await page.keyboard.press('Escape'); await wait(300);
    const pol3 = await policy(page);
    ok(pol3.focus === 'surowce', 'zapisane ustawienia profilu NIE są kasowane po zwolnieniu', pol3);

    // (3) panel miasta: administrator miasta
    await page.evaluate((id) => window.__civTest.adminSetup(id, ['palac'], 500), cap.id);
    ok(await openCityPanel(page), 'panel miasta otwarty (przycisk administratora jest)');
    await page.evaluate(() => document.querySelector('#civ-v-administrator').click()); await wait(600);
    out.city0 = await panelInfo(page);
    await page.screenshot({ path: C.EVID + '/06-panel-administratora-miasta.png' });
    ok(out.city0 && out.city0.kind === 'city' && /%/.test(out.city0.bonuses) && /40/.test(out.city0.cost), 'administrator miasta: panel z bonusami % (z silnika) i kosztem', out.city0);
    const tc0 = (await page.evaluate((i) => window.__civTest.adminState(i), cap.id)).treasury;
    await page.evaluate(() => document.querySelector('[data-adm-panel-confirm]').click()); await wait(800);
    const ac = await page.evaluate((i) => window.__civTest.adminState(i), cap.id);
    ok(ac.hired && ac.working && ac.treasury === tc0 - 40, 'administrator miasta: Zatrudnij działa jak dotąd (−40)', { tc0, ac });
    await page.keyboard.press('Escape'); await wait(300);
    ok(!(await page.evaluate(() => !!document.querySelector('.civ-adm-panel-host'))), 'Esc zamyka panel administratora miasta');
    out.errors = s.errors.filter((e) => !/favicon|ERR_FILE_NOT_FOUND/.test(e));
    ok(out.errors.length === 0, 'brak błędów konsoli/pageerror', out.errors);
  } catch (e) {
    failed++; console.log('EXC: ' + (e && e.stack || e));
  } finally {
    await browser.close();
  }
  console.log(failed === 0 ? 'LIVE OK' : 'LIVE FAIL ' + failed);
  process.exit(failed === 0 ? 0 : 1);
})();
