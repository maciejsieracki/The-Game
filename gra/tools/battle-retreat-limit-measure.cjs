'use strict';
// R-WEB-LIVE-VERIFY-ARMY-RETREAT-LIMIT-CAMPAIGN-Q1 (POMIAR, tylko odczyt; zero zmian w gra/src, gra/data):
// prawdziwa bitwa 3D (BattleScene, Skip) + prawdziwy applyPostBattleMap w Chromium, na wejsciu entry
// battle-retreat-limit-browser-entry.html (licznik odwrotow ?retreat=N, ziarno ?seed=S).
// ZAKRES (r2, poprawka po zarzutach Evaluatora): tylko poziom bitwy. Wiersze retreat=0/2 NIE dowodza odwrotu:
// w kazdym przebiegu loserSurvivorsExported=0 i loserRetreatDistances=[] (rosterSizes 28/28, przegrany ginie w calosci).
// Parametry atkhp/defhp (URL entry) nie zmieniaja tego wyniku (probe r2: 1.0/0.35 i 0.35/1.0 -> loserDead=28).
// Sklad armii jest stały w entry (battle-retreat-limit-browser-entry.ts, poza allowlista tego tematu).
// UWAGA: to pomiar poziomu bitwy, NIE pelnej kampanii (brak hooka wymuszajacego kolejne przegrane bitwy
// w zywej turze gry) -- raport zapisuje pomiar kampanii jako NIE ZMIERZONO.
// Wynik: jedna linia JSON na przebieg + linia zbiorcza na koncu.
// Usage (z katalogu gra/): node tools/battle-retreat-limit-measure.cjs [--seeds 1,2,3] [--retreats 0,2,3]
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.E2E_MAX_MS || 240000);
const argv = process.argv.slice(2);
const argOf = (name, def) => { const i = argv.indexOf('--' + name); return i >= 0 ? argv[i + 1] : def; };
const seeds = argOf('seeds', '1,2,3').split(',').map(Number);
const retreats = argOf('retreats', '0,2,3').split(',').map(Number);

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const rows = [];
  let pageErrorsTotal = 0;
  try {
    for (const seed of seeds) for (const retreat of retreats) {
      const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-retreat-limit-browser-entry.html?mode=skip&retreat=${retreat}&seed=${seed}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = timedOut ? null : await page.evaluate(() => window.__e2e.result);
      await page.close();
      pageErrorsTotal += errors.length;
      const row = {
        seed, retreatN: retreat, timedOut, pageErrors: errors.length,
        winner: r ? r.winner : null, loserDead: r ? r.loserDead : null, loserOnMap: r ? r.loserOnMap : null,
        loserRetreatDistances: r ? r.loserRetreatDistances : null,
        loserSurvivorsExported: r ? r.loserSurvivorsExported : null, loserDeadStillOnMap: r ? r.loserDeadStillOnMap : null,
        atkOnMap: r ? r.atkOnMap : null, defOnMap: r ? r.defOnMap : null,
        defAnnihilated: r ? r.defAnnihilated : null, atkAnnihilated: r ? r.atkAnnihilated : null,
        defBudgetExhausted: r ? r.defBudgetExhausted : null, atkBudgetExhausted: r ? r.atkBudgetExhausted : null,
      };
      rows.push(row);
      console.log(JSON.stringify(row));
    }
  } finally { await browser.close(); await server.close(); }
  console.log('SUMMARY runs=' + rows.length + ' pageErrors=' + pageErrorsTotal + ' timedOut=' + rows.filter(r => r.timedOut).length);
  process.exitCode = pageErrorsTotal || rows.some(r => r.timedOut) ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
