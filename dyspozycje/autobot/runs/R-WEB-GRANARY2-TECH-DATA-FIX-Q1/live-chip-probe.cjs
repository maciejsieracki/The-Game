'use strict';
// Live Chromium probe: Spichlerz II "Wymagane badania" chip in the real city panel.
// Usage: node live-chip.cjs <GRA dir> <out dir for shots and json>
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');
const GRA = process.argv[2];
const OUT = process.argv[3];
const BUILD = '/dev/shm/granary2-chip-' + process.pid;
fs.mkdirSync(OUT, { recursive: true });
const log = (...a) => console.log(...a);
execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${BUILD} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 });
log('BUILD OK ->', BUILD);
const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));

const SCRIPT_PROBE = () => {
  const out = { spichlerzIi: [], chips: [] };
  const all = Array.from(document.querySelectorAll('*'));
  // Karty budynków: szukamy najmniejszego elementu zawierającego tekst "Spichlerz II" i chipy "Wymagane".
  const chipEls = Array.from(document.querySelectorAll('.bld-req-chip'));
  for (const ch of chipEls) out.chips.push({ text: ch.textContent, cls: ch.className });
  const cards = all.filter(el => el.children.length < 60 && /Spichlerz II/.test(el.textContent || '') && el.querySelector('.bld-req-chip, .bld-infocard-eyebrow'));
  // wybierz najmniejszy (najbardziej szczegółowy) kontener
  cards.sort((a, b) => (a.textContent || '').length - (b.textContent || '').length);
  for (const c of cards.slice(0, 3)) {
    out.spichlerzIi.push({
      tag: c.tagName, cls: c.className,
      eyebrows: Array.from(c.querySelectorAll('.bld-infocard-eyebrow')).map(e => e.textContent),
      chips: Array.from(c.querySelectorAll('.bld-req-chip')).map(e => ({ text: e.textContent, cls: e.className })),
      text: (c.textContent || '').slice(0, 400),
    });
  }
  out.bodyHasWarzelnia = /Warzelnia soli/.test(document.body.innerText);
  return out;
};

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const result = {};
  try {
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    const errs = [];
    page.on('pageerror', e => errs.push(e.message));
    await page.goto('file://' + BUILD + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => window.__civTest && window.__frozenTestDebug && window.__turnSlowdownTestDebug, null, { timeout: 120000 });
    // Miasto gracza: istniejące albo nowe (realne zakładanie miasta).
    let cityId = await page.evaluate(() => window.__frozenTestDebug.firstCityId(0));
    if (!cityId) {
      await page.evaluate(() => {
        const cand = window.__civTest.foundCandidates(1)[0];
        if (cand) window.__civTest.foundCity(cand.q, cand.r);
      });
      cityId = await page.evaluate(() => window.__frozenTestDebug.firstCityId(0));
    }
    result.cityId = cityId;
    const opened = await page.evaluate(() => window.__turnSlowdownTestDebug.openFirstPlayerCityPanel());
    result.openedMs = opened;
    await page.waitForFunction(() => !/Tworzenie świata/.test(document.body.innerText), null, { timeout: 300000 });
    await page.waitForTimeout(1500);
    // Klik w wiersz Spichlerza II na liście „Dostępne do budowy” (realny klik gracza -> karta szczegółów z chipami).
    const clickSpichlerzII = async () => {
      const row = page.locator('text=Spichlerz II').first();
      await row.click({ timeout: 20000 });
      await page.waitForTimeout(800);
    };
    // Stan A: gracz NIE ma jeszcze żadnej technologii z listy (świeża gra) -- badanie Garncarstwo niezbadane.
    await clickSpichlerzII();
    result.stateA = await page.evaluate(SCRIPT_PROBE);
    await page.screenshot({ path: path.join(OUT, 'stanA-przed-garncarstwo.png'), fullPage: false });
    // Stan B: pełny zestaw technologii (REALNY hak testowy gry) -- Garncarstwo zbadane.
    await page.evaluate(() => window.__civTest.unlockAllTech());
    await page.evaluate(() => window.__turnSlowdownTestDebug.closeCityPanel());
    await page.evaluate(() => window.__turnSlowdownTestDebug.openFirstPlayerCityPanel());
    await page.waitForTimeout(1500);
    await clickSpichlerzII();
    result.stateB = await page.evaluate(SCRIPT_PROBE);
    await page.screenshot({ path: path.join(OUT, 'stanB-po-garncarstwie.png'), fullPage: false });
    result.pageErrors = errs.slice(0, 10);
  } catch (e) {
    result.error = String(e && e.stack || e).slice(0, 800);
  } finally {
    await browser.close();
    fs.writeFileSync(path.join(OUT, 'probe.json'), JSON.stringify(result, null, 2));
    log(JSON.stringify(result, null, 2).slice(0, 6000));
    try { fs.rmSync(BUILD, { recursive: true, force: true }); } catch (_) {}
  }
})();
