'use strict';
// R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1: pomiar losu jednostek po bitwie
// (zabici / uciekli / routed-na-polu / ocalali) AUTO(skip) vs auto-rozstrzygniecie (instant).
// Usage (z gra/): node tools/battle-rout-pursuit-measure.cjs
// Env: ROUT_MODES="skip,watch,instant" ROUT_SEEDS="1,2,3" ROUT_SCEN="0,1" ROUT_MAX_MS=280000 ROUT_OUT=plik.json
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.ROUT_SEEDS || '1,2,3').split(',').map(Number);
const MAX_MS = Number(process.env.ROUT_MAX_MS || 280000);
const SCEN = [
  { name: 'wrecz 12v12', atk: 'Hastati:12', def: 'Hastati:12' },
  { name: 'strzelcy+wrecz vs wrecz', atk: 'Lucznik:10,Hastati:4', def: 'Hastati:12' },
  { name: 'konnica vs piechota', atk: 'Konnica:8', def: 'Wojownik:14' },
  { name: 'przewaga 2:1', atk: 'Hastati:20', def: 'Hastati:10' },
];
const only = process.env.ROUT_SCEN ? process.env.ROUT_SCEN.split(',').map(Number) : null;
(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const rows = [];
  try {
    for (const [si, sc] of SCEN.entries()) {
      if (only && !only.includes(si)) continue;
      for (const seed of SEEDS) {
        for (const mode of (process.env.ROUT_MODES || 'skip,instant').split(',')) {
          const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-rout-pursuit-browser-entry.html?mode=${mode}&seed=${seed}&atk=${sc.atk}&def=${sc.def}`, { waitUntil: 'load', timeout: 60000 });
          await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
          let timedOut = false;
          try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
          const r = await page.evaluate(() => window.__e2e.result);
          await page.close();
          const row = { scen: sc.name, seed, mode, timedOut, errors, r };
          rows.push(row);
          console.log(JSON.stringify(row));
        }
      }
    }
  } finally { await browser.close(); await server.close(); }
  if (process.env.ROUT_OUT) fs.writeFileSync(process.env.ROUT_OUT, JSON.stringify(rows, null, 1));
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
