'use strict';
// R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 (ETAP 1): pomiar tempa zwycieskiej armii po zerwaniu kontaktu.
// Usage (z gra/): node tools/battle-pursuit-pace-measure.cjs
// Env: PP_MODES="skip,watch" PP_SEEDS="1,2,3" PP_SCEN="0,1,2" PP_MAX_MS=280000 PP_OUT=plik.json
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.PP_SEEDS || '1').split(',').map(Number);
const MAX_MS = Number(process.env.PP_MAX_MS || 280000);
const SCEN = [
  { name: 'jednorodna: wrecz 20 vs 10', atk: 'Hastati:20', def: 'Hastati:10' },
  { name: 'mieszana: wrecz+lucznicy+konnica vs wrecz', atk: 'Hastati:8,Lucznik:6,Konnica:4', def: 'Hastati:14' },
  { name: 'jednorodna: wrecz 12 vs 12', atk: 'Hastati:12', def: 'Hastati:12' },
];
const only = process.env.PP_SCEN ? process.env.PP_SCEN.split(',').map(Number) : null;
(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const out = [];
  try {
    for (const [si, sc] of SCEN.entries()) {
      if (only && !only.includes(si)) continue;
      for (const seed of SEEDS) {
        for (const mode of (process.env.PP_MODES || 'skip').split(',')) {
          const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
          const errors = []; page.on('pageerror', e => errors.push(e.message));
          await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-pursuit-pace-browser-entry.html?mode=${mode}&seed=${seed}&atk=${sc.atk}&def=${sc.def}`, { waitUntil: 'load', timeout: 60000 });
          await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
          let timedOut = false;
          try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
          const r = await page.evaluate(() => ({ result: window.__e2e.result, rows: window.__e2e.rows, rounds: window.__e2e.rounds }));
          await page.close();
          const row = { scen: sc.name, seed, mode, timedOut, errors, ...r };
          out.push(row);
          console.log(JSON.stringify({ scen: sc.name, seed, mode, timedOut, errors, result: r.result, nRows: r.rows.length }));
        }
      }
    }
  } finally { await browser.close(); await server.close(); }
  if (process.env.PP_OUT) fs.writeFileSync(process.env.PP_OUT, JSON.stringify(out, null, 1));
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
