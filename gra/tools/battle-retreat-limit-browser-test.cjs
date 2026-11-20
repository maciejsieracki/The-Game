'use strict';
// R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 -- Chromium (czesciowa weryfikacja):
// prawdziwa bitwa 3D (BattleScene, Skip) + prawdziwy applyPostBattleMap + helper licznika odwrotow.
// Przypadki: licznik 0 i 2 (odwrot dozwolony -> ocaleli zyja) oraz 3 (limit wyczerpany ->
// przegrana = unicestwienie: przegrani usunieci z mapy, flaga zglaszana). Remis: brak przegranych.
// NIE objete tym testem (NIE ZMIERZONO w Chromium): przycisk "Wycofaj" wyszarzony, komunikat na
// ekranie (showHintMessage w main.ts), zrzuty ekranu.
// Usage: node tools/battle-retreat-limit-browser-test.cjs   (z katalogu gra/)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.E2E_MAX_MS || 240000);
const cases = [{ retreat: 0 }, { retreat: 2 }, { retreat: 3 }];

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let bad = 0;
  try {
    for (const c of cases) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-retreat-limit-browser-entry.html?mode=skip&retreat=${c.retreat}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = timedOut ? null : await page.evaluate(() => window.__e2e.result);
      await page.close();
      console.log(JSON.stringify({ case: 'retreat=' + c.retreat, timedOut, errors, r }));
      let ok = !timedOut && errors.length === 0 && !!r;
      if (ok) {
        if (r.retreatN !== c.retreat) ok = false;
        if (c.retreat < 3) {
          ok = ok && !r.defAnnihilated && !r.atkAnnihilated && r.defBudgetExhausted === false && r.atkBudgetExhausted === false;
        } else {
          // Budzet wyczerpany po obu stronach: przegrana = unicestwienie (zaden przegrany nie zostaje na mapie).
          ok = ok && r.defBudgetExhausted === true && r.atkBudgetExhausted === true;
          if (r.isDraw) ok = ok && r.loserDeadStillOnMap === 0 && !r.defAnnihilated && !r.atkAnnihilated;
          else ok = ok && r.loserOnMap === 0 && (r.defAnnihilated || r.atkAnnihilated);
        }
      }
      if (!ok) { bad++; console.error('FAIL case', c, r); }
    }
  } finally { await browser.close(); await server.close(); }
  console.log(bad ? 'BROWSER FAIL ' + bad : 'BROWSER PASS');
  process.exitCode = bad ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
