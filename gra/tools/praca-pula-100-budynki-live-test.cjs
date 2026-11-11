'use strict';
/**
 * praca-pula-100-budynki-live-test.cjs -- R-WEB-WORK-POOL-ACCUMULATES-DESPITE-100-BUILDINGS-Q1 (realny Chromium).
 * Scenariusz ze zrzutu wlasciciela: 1 miasto, suwak Budynki 100% / Ulepszenia (pula) 0%, N tur.
 * Mierzy tura -> (pula imperium, przyrost, kolejka, doBudynkow, doPuli) dla wariantow:
 *   kolejka PUSTA vs kolejka NIEPUSTA x podzial 100/90/50.
 * Usage (z gra/): node tools/praca-pula-100-budynki-live-test.cjs [--measure]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');
const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-workpool-'));
const URL = 'file://' + path.join(OUT_DIR, 'index.html') + '?civTest=1';
const MEASURE_ONLY = process.argv.includes('--measure');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
let pass = 0, fail = 0;
const assert = (label, cond, detail) => {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
};
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
async function launch(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({ headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
async function poll(page, label, fn, timeoutMs, arg) {
  const end = Date.now() + timeoutMs; let last = null;
  while (Date.now() < end) { last = await page.evaluate(fn, arg); if (last && last.ready) return last; await wait(400); }
  throw new Error('poll(' + label + '): timeout ' + JSON.stringify(last));
}
async function main() {
  const { chromium } = require('playwright');
  console.log('[praca-pula-100-budynki] vite build ->', OUT_DIR);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`, { cwd: GRA_DIR, stdio: 'pipe' });
  const browser = await launch(chromium);
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(URL, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__workPoolTestDebug && !!window.__civTest, undefined, { timeout: 120000 });
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 0, 'normal'));
  await poll(page, 'world', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 240000);
  await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  await poll(page, 'capital', () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some(c => c.ownerId === 0) };
  }, 60000);
  await wait(400);
  const D = (fn, arg) => page.evaluate(fn, arg);
  const cityId = await D(() => window.__workPoolTestDebug.state().cities[0].id);
  const bIds = await D(() => window.__workPoolTestDebug.buildingIds());
  const nCities = await D(() => window.__workPoolTestDebug.state().cities.length);
  assert('fixture: dokladnie 1 miasto gracza', nCities === 1, nCities);

  async function endTurnAndWait() {
    const t0 = await D(() => window.__workPoolTestDebug.state().turn);
    await D(() => window.__civTest.endTurn());
    for (let i = 0; i < 60; i++) {
      const s = await D(() => window.__workPoolTestDebug.state());
      const busy = await D(() => window.__eraTestDebug.isEndTurnInProgress());
      if (s.turn > t0 && !busy) return s;
      await D(() => { document.querySelectorAll('button').forEach(b => { if (/Zamknij|OK|Dalej|Kontynuuj/i.test(b.textContent || '')) b.click(); }); });
      await wait(500);
    }
    return await D(() => window.__workPoolTestDebug.state());
  }

  const variants = [];
  for (const queued of [false, true]) {
    for (const pct of [100, 90, 50]) {
      await D((p) => window.__workPoolTestDebug.setSplit(p), pct);
      await D((id) => window.__workPoolTestDebug.clearQueue(id), cityId);
      if (queued) {
        await D((a) => window.__workPoolTestDebug.enqueueBuildings(a.id, a.ids), { id: cityId, ids: bIds.slice(0, 40) });
      }
      const rows = [];
      const s0 = await D(() => window.__workPoolTestDebug.state());
      for (let t = 0; t < 4; t++) {
        const before = await D(() => window.__workPoolTestDebug.state());
        const after = await endTurnAndWait();
        const c = after.cities[0];
        rows.push({
          tura: after.turn, pct, queued, queueLenPrzed: before.cities[0].queueIds.length, queueLenPo: c.queueIds.length,
          doBudynkowTabela: c.doBudynkow, doPuliTabela: c.doPuli,
          pulaPrzed: before.pool, pulaPo: after.pool, deltaPuli: +(after.pool - before.pool).toFixed(2),
          hudRate: after.hudPracaRate, hudUpkeep: after.hudPracaUpkeep, hudAuto: after.hudAutoUlepszenia, hudCuda: after.hudCuda,
          postepPo: c.postep,
          panelPula: after.empireRows[0] ? after.empireRows[0].pracaPula : null,
          panelBud: after.empireRows[0] ? after.empireRows[0].pracaBudynki : null,
        });
      }
      variants.push({ queued, pct, queueStart: s0.cities[0].queueIds.length, rows });
    }
  }
  console.log('\n=== POMIAR (surowe) ===');
  for (const v of variants) for (const r of v.rows) {
    console.log(`${r.queued ? 'KOLEJKA ' : 'PUSTA   '} ${String(r.pct).padStart(3)} | t${r.tura} q${r.queueLenPrzed}->${r.queueLenPo} | split(suwak) doBud/doPuli=${r.doBudynkowTabela}/${r.doPuliTabela} | PANEL imperium bud/pula=${r.panelBud}/${r.panelPula} | pula ${r.pulaPrzed}->${r.pulaPo} (delta ${r.deltaPuli}) | hudRate=${r.hudRate} upk=${r.hudUpkeep} auto=${r.hudAuto} cuda=${r.hudCuda} postep=${r.postepPo}`);
  }
  if (!MEASURE_ONLY) {
    for (const v of variants) {
      for (const r of v.rows) {
        const tag = `${r.queued ? 'kolejka' : 'pusta'} ${r.pct}% t${r.tura}`;
        // (1) JEDNO zrodlo prawdy: "do puli" w panelu imperium == realny przyrost puli (netto drenazy).
        const exp = (r.panelPula ?? 0) - r.hudUpkeep - r.hudAuto - r.hudCuda;
        assert(`${tag}: panel "do puli" == realny przyrost puli (${r.panelPula} vs delta ${r.deltaPuli})`, Math.abs(r.deltaPuli - exp) < 0.51, r);
        // (2) zero kopii i zero utraty: do budynkow + do puli (panel) == cala Praca miasta (surowy split).
        assert(`${tag}: panel budynki+pula == cala Praca (${r.panelBud}+${r.panelPula} vs ${r.doBudynkowTabela}+${r.doPuliTabela})`,
          r.panelBud + r.panelPula === (r.doBudynkowTabela ?? 0) + (r.doPuliTabela ?? 0), r);
        if (r.queued) {
          // (3) niepusta kolejka: dokladnie podzial suwaka; przy 100% pula nie rosnie.
          assert(`${tag}: kolejka niepusta -> panel == split suwaka`, r.panelPula === r.doPuliTabela && r.panelBud === r.doBudynkowTabela, r);
          if (r.pct === 100) assert(`${tag}: pula NIE rosnie (delta=${r.deltaPuli})`, r.deltaPuli <= 0.001, r);
        } else {
          // (4) pusta kolejka: wyjatek silnika -> cala Praca do puli, panel NIE twierdzi "do budynkow".
          assert(`${tag}: pusta kolejka -> panel pokazuje 0 do budynkow`, r.panelBud === 0, r);
        }
      }
    }
  }
  assert('brak pageerror', errors.length === 0, errors.slice(0, 3));
  await browser.close();
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* ignore */ }
  console.log(`\n[praca-pula-100-budynki] pass=${pass} fail=${fail}`);
  process.exit(fail ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
