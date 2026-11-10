'use strict';
const path = require('path');
const { chromium } = require(path.resolve(__dirname, '../../../../../gra/node_modules/playwright'));
const BASE = process.env.LIVE_URL || 'http://127.0.0.1:18787/index.html?playtest=mapa&civTest=1';
const OUT = __dirname;
(async () => {
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', e => errors.push(`pageerror: ${e.message}`));
  page.on('console', m => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  page.on('requestfailed', r => errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText || ''}`));
  try {
    await page.goto(BASE, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug?.getWorldState?.().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(1500);
    const hud = page.locator('[data-act="empire-recruit"]');
    const hudBefore = { count: await hud.count(), visible: await hud.isVisible().catch(() => false), label: await hud.getAttribute('aria-label') };
    if (hudBefore.count !== 1 || !hudBefore.visible) throw new Error('HUD_RECRUIT_BUTTON_MISSING ' + JSON.stringify(hudBefore));
    await hud.click();
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 10000 });
    const empirePanel = await page.locator('#civ-empire-recruit-panel').evaluate(el => ({ title: el.querySelector('.erp-title')?.textContent, rows: [...el.querySelectorAll('[data-unit]')].map(r => ({ id: r.dataset.unit, label: r.querySelector('.erp-name')?.textContent, qty: r.querySelector('[data-erp="qty"]')?.value })), allButtons: [...el.querySelectorAll('[data-erp="go-all"]')].map(b => ({ text: b.textContent.trim(), disabled: b.disabled })) }));
    await page.screenshot({ path: path.join(OUT, '01-hud-empire-recruit-panel.png'), fullPage: false });
    if (empirePanel.rows.length === 0 || empirePanel.allButtons.length !== 2 || empirePanel.rows.some(r => r.qty !== '0')) throw new Error('EMPIRE_PANEL_CONTENT_MISMATCH ' + JSON.stringify(empirePanel));
    await page.locator('#civ-empire-recruit-panel [data-erp="close"]').click();

    // The HUD manpower chip opens the Empire details panel at Armia section, which hosts the per-city recruitment catalog.
    const armyEntry = page.locator('[data-act="rekruci"]');
    const armyEntryBefore = { count: await armyEntry.count(), visible: await armyEntry.isVisible().catch(() => false), title: await armyEntry.getAttribute('title') };
    if (armyEntryBefore.count !== 1 || !armyEntryBefore.visible) throw new Error('HUD_ARMY_ENTRY_MISSING ' + JSON.stringify(armyEntryBefore));
    await armyEntry.click();
    await page.waitForSelector('.civ-emp-mass [data-mass-recruitment-city]', { timeout: 15000 });
    const army = page.locator('.civ-emp-mass');
    await army.scrollIntoViewIfNeeded();
    const armyPanel = await army.evaluate(el => ({ title: el.querySelector('.civ-emp-mass-title')?.textContent, cities: [...el.querySelectorAll('[data-mass-recruitment-city]')].map(c => ({ id: c.dataset.massRecruitmentCity, name: c.querySelector('.civ-emp-mass-city-name')?.textContent, cards: c.querySelectorAll('.unit-recruit-card, [data-unit], .recruit-card').length, labels: [...c.querySelectorAll('.unit-recruit-name, .unit-recruit-title, .unit-name')].slice(0, 5).map(x => x.textContent.trim()) })), mountedLists: [...el.querySelectorAll('[data-mass-recruitment-cards]')].map(x => ({ cityId: x.dataset.massRecruitmentCards, children: x.childElementCount, text: x.innerText.slice(0, 500) })), listText: el.innerText.slice(0, 1600) }));
    await page.screenshot({ path: path.join(OUT, '02-empire-army-recruitment-list.png'), fullPage: false });
    if (!armyPanel.cities.length || !armyPanel.mountedLists.length || armyPanel.mountedLists.some(x => x.children === 0)) throw new Error('ARMY_RECRUITMENT_LIST_MISSING ' + JSON.stringify(armyPanel));
    const evidence = { url: page.url(), hudEntry: hudBefore, empireRecruitPanel: empirePanel, armyEntry: armyEntryBefore, armyRecruitment: armyPanel, errors };
    require('fs').writeFileSync(path.join(OUT, 'live-http-chromium.json'), JSON.stringify(evidence, null, 2) + '\n');
    console.log(JSON.stringify(evidence, null, 2));
    if (errors.length) process.exitCode = 1;
  } finally { await browser.close(); }
})().catch(e => { console.error(e.stack || String(e)); process.exit(1); });
