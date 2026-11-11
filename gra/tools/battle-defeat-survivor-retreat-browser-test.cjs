'use strict';
// R-WEB-BATTLE-DEFEAT-SURVIVOR-RETREAT-TWO-HEX-Q1: prawdziwa bitwa 3D w Chromium (Vite HTTP),
// sciezki pole + oblezenie (Skip). Asercje: przegrani z HP>0 sa w wyniku bitwy, nie znikaja
// z mapy i stoja 2 heksy od heksu bitwy; polegli nie wracaja.
// Usage: node tools/battle-defeat-survivor-retreat-browser-test.cjs
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium', ...(fs.existsSync('/opt/pw-browsers') ? fs.readdirSync('/opt/pw-browsers').filter(d => d.startsWith('chromium-')).map(d => `/opt/pw-browsers/${d}/chrome-linux/chrome`) : [])].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.E2E_MAX_MS || 240000);
// instant (computeInstantResult): przegrany w rachunku natychmiastowym bywa doszczetnie wybity (0 ocalalych) --
// wtedy wymagana jest tylko spojnosc (nikt polegly na mapie, brak bledow); gdy ocalali sa, musza stac 2 heksy dalej.
const cases = [{ siege: false, mode: 'skip' }, { siege: true, mode: 'skip' }, { siege: false, mode: 'instant', noLoserSurvivorsOk: true }, { siege: false, mode: 'cap' }];

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
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-defeat-survivor-retreat-browser-entry.html?mode=${c.mode}${c.siege ? '&siege=1&atkhp=1&defhp=0.04' : ''}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      console.log(JSON.stringify({ case: (c.siege ? 'siege' : 'field') + '/' + c.mode, timedOut, errors, r }));
      const ok = !timedOut && !errors.length && r
        && (r.loserSurvivorsExported > 0 || c.noLoserSurvivorsOk)
        && r.loserOnMap === r.loserSurvivorsExported
        && r.loserDeadStillOnMap === 0
        && r.loserRetreatDistances.every(d => d === 2);
      if (!ok) { bad++; console.error('FAIL case', c); }
    }
  } finally { await browser.close(); await server.close(); }
  console.log(bad ? 'BROWSER FAIL ' + bad : 'BROWSER PASS');
  process.exitCode = bad ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
