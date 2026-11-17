'use strict';
// Pomiar pozycji pionowych (getBoundingClientRect) sekcji Rekrutacja w panelu armii.
// Uruchomienie: node measure-positions.cjs <katalog-dist> <wyjscie.json> <zrzut.png>
const path = require('path'), fs = require('fs');
const GRA = path.resolve(__dirname, '..', '..', '..', '..', 'gra');
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
(async () => {
  const [dist, outJson, outPng] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: '/usr/bin/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto('file://' + dist + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__empireRecruitTestDebug, null, { timeout: 180000 });
    await page.waitForTimeout(1500);
    await page.evaluate(() => window.__empireRecruitTestDebug.openArmyRecruitSection());
    await page.waitForSelector('#civ-empire-recruit-panel [data-unit]', { timeout: 15000 });
    const rows = await page.evaluate(() => {
      const top = el => { if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom) }; };
      const follow = document.querySelector('[data-recruit-follow-general]');
      const out = {};
      out.naglowekRekrutacja = top(document.querySelector('.civ-emp-mass-hd'));
      out.wodzBlok = top(document.querySelector('.civ-emp-mass-leader'));
      out.wodzKarta = top(document.querySelector('[data-general-recruitment-card]'));
      out.idzDoWodza = top(follow ? follow.closest('label') : null);
      out.erpHost = top(document.getElementById('civ-empire-recruit-panel'));
      out.liczniki = top(document.querySelector('.civ-emp-mass-counters'));
      out.pulaSkarbiec = top(document.querySelector('.civ-emp-mass-pool'));
      out.pierwszeMiasto = top(document.querySelector('[data-mass-recruitment-city]') || document.querySelector('[data-army-recruit-all]'));
      return out;
    });
    const ordered = ['wodzBlok', 'idzDoWodza', 'erpHost', 'liczniki', 'pierwszeMiasto'].filter(k => rows[k]);
    let rosnaco = true;
    for (let i = 1; i < ordered.length; i++) if (!(rows[ordered[i - 1]].top < rows[ordered[i]].top)) rosnaco = false;
    const result = { kolejnosc: ordered, kolejnoscRosnaca: rosnaco, pozycje: rows };
    fs.writeFileSync(outJson, JSON.stringify(result, null, 2) + '\n');
    console.log(JSON.stringify(result));
    await page.evaluate(() => { const el = document.querySelector('.civ-emp-mass-leader'); if (el) el.scrollIntoView({ block: 'start' }); });
    await page.waitForTimeout(300);
    await page.screenshot({ path: outPng });
  } finally { await browser.close(); }
})().catch(e => { console.error('MEASURE_FAIL', String(e.message).slice(0, 500)); process.exit(1); });
