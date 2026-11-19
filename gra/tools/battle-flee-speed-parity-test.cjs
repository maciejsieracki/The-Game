'use strict';
// R-WEB-BATTLE-FLEE-SPEED-HARAPPA-FASTER-Q1: parytet ucieczki z pola bitwy. Uciekinier (zroutowana jednostka)
// gracza i AI, takze Harappy (Straznik bram Harappy), przebywa w jednej turze nie wiecej niz
// floor(50% normalnego zasiegu ruchu tej samej jednostki), minimum 1 heks. Prawdziwa bitwa 3D w Chromium
// (ten sam entry co battle-flee-move-half). Wpisany udzial 0.5 (nie czytany z data/).
// Mutacja: combat-params.json "ucieczka".mnoznik_ruchu = 1 musi czerwienic ten test.
// Usage (z gra/): CHROMIUM_PATH=/usr/bin/google-chrome node tools/battle-flee-speed-parity-test.cjs
// Env: FLEE_MAX_MS=150000
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium', '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.FLEE_MAX_MS || 150000);
const EXPECTED_SHARE = 0.5;
const capFor = (normal) => Math.max(1, Math.floor(normal * EXPECTED_SHARE));

const CASES = [
  { name: 'Wojownik (gracz-like) def vs Wojownik atk', atk: 'Wojownik:12', def: 'Wojownik:10', seed: 1 },
  { name: 'Straznik bram Harappy def vs Hastati atk', atk: 'Hastati:20', def: 'Strażnik bram Harappy:10', seed: 1 },
  { name: 'Strazhnik bram Harappy atk vs Hastati def', atk: 'Strażnik bram Harappy:10', def: 'Hastati:20', seed: 1 },
  // zarzut Evaluatora 1: jednostka zlamana W TRAKCIE zamrozonej fali (galaz normalPlan) musi miec cap
  { name: 'Wojownik zlamany w trakcie fali (normalPlan)', atk: 'Wojownik:12', def: 'Wojownik:10', seed: 1, inject: 'midwave' },
];

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let pass = 0; let fail = 0;
  const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name + ' -- ' + JSON.stringify(detail)); } };
  const table = [];
  try {
    for (const c of CASES) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const qs = new URLSearchParams({ mode: 'skip', seed: String(c.seed), atk: c.atk, def: c.def, ...(c.inject ? { inject: c.inject } : {}) });
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-flee-move-half-browser-entry.html?${qs.toString()}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      check(`[${c.name}] bitwa zakonczona bez bledow`, !timedOut && !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      check(`[${c.name}] byly uciekajace jednostki z krokami`, r.routed.length > 0 && r.routed.some(u => u.totalSteps > 0), r.routed);
      if (c.inject) {
        check(`[${c.name}] wstrzykniecie zlamania w trakcie fali zadzialo i jednostka uciekla`,
          !!r.injected && r.routed.some(u => u.nazwa === r.injected && u.totalSteps > 0), { injected: r.injected, routed: r.routed });
      }
      for (const u of r.routed) {
        const cap = capFor(u.normal);
        table.push({ case: c.name, id: u.id, nazwa: u.nazwa, normal: u.normal, cap, maxPerRound: u.maxPerRound, totalSteps: u.totalSteps, rounds: u.rounds });
        check(`[${c.name}] ${u.nazwa} (${u.id}): normalny zasieg ${u.normal}, limit uciekiniera ${cap}, max krokow/tura ${u.maxPerRound}`,
          u.maxPerRound <= cap, u);
      }
    }
  } finally { await browser.close(); await server.close(); }
  console.log(JSON.stringify(table, null, 1));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
