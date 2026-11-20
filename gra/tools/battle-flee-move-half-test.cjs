'use strict';
// R-WEB-BATTLE-FLEE-MOVE-HALF-Q1: uciekajaca (zrootowana) jednostka w bitwie przebywa w jednej turze
// nie wiecej niz 50% normalnego zasiegu ruchu tej samej jednostki (zaokraglenie w dol, minimum 1 heks).
// Oczekiwane (z dispatchu): Konnica 7 -> 3, piechota 4 -> 2. Mierzone w prawdziwej bitwie 3D w Chromium.
// Oczekiwany udzial (0.5) jest WPISANY tutaj, nie czytany z data/combat-params.json: mutacja
// "ucieczka".mnoznik_ruchu = 1 w combat-params.json musi czerwienic ten test.
// Usage (z gra/): node tools/battle-flee-move-half-test.cjs
// Env: FLEE_MAX_MS=280000 FLEE_MODE=skip|watch (watch = tryb AUTO sceniczny)
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.FLEE_MAX_MS || 280000);
const EXPECTED_SHARE = 0.5;
const MODE = process.env.FLEE_MODE || 'skip';
const capFor = (normal) => Math.max(1, Math.floor(normal * EXPECTED_SHARE));

const CASES = [
  { name: 'konnica vs piechota', atk: 'Konnica:8', def: 'Wojownik:14', seed: 1 },
  { name: 'piechota Hastati przewaga 2:1', atk: 'Hastati:20', def: 'Hastati:10', seed: 1 },
  { name: 'konnica jako uciekinier (obrona)', atk: 'Hastati:20', def: 'Konnica:12', seed: 1 },
];

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let pass = 0; let fail = 0;
  const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name + ' -- ' + JSON.stringify(detail)); } };
  try {
    for (const c of CASES) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-flee-move-half-browser-entry.html?mode=${MODE}&seed=${c.seed}&atk=${c.atk}&def=${c.def}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      console.log(JSON.stringify({ case: c.name, timedOut, errors, r }));
      check(`[${c.name}] bitwa zakonczona bez bledow`, !timedOut && !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      check(`[${c.name}] byly uciekajace jednostki z krokami`, r.routed.length > 0 && r.routed.some(u => u.totalSteps > 0), r.routed);
      for (const u of r.routed) {
        const cap = capFor(u.normal);
        check(`[${c.name}] ${u.nazwa} (${u.id}): normalny zasieg ${u.normal}, limit uciekiniera ${cap}, max krokow/tura ${u.maxPerRound}`,
          u.maxPerRound <= cap, u);
      }
    }
  } finally { await browser.close(); await server.close(); }
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
