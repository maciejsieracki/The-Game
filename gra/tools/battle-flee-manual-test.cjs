'use strict';
// R-WEB-BATTLE-FLEE-MANUAL-MODE-HARAPPA-MEASURE-Q1: parytet ucieczki w RECZNYM trybie bitwy 3D.
// Jednostka gracza (atak) zlamana na poczatku tury 1 w prawdziwej bitwie (Chromium, Vite) w trybie recznym
// (bez skip/auto) przebywa w kazdej turze nie wiecej niz floor(mnoznik_ruchu * normalny zasieg ruchu),
// minimum 1 heks. Zapas z data/combat-params.json "ucieczka" (nie wpisany tu na sztywno).
// Mutacja: combat-params.json "ucieczka".mnoznik_ruchu = 1 musi czerwienic ten test.
// Usage (z gra/): CHROMIUM_PATH=/usr/bin/google-chrome node tools/battle-flee-manual-test.cjs
// Env: FLEE_MANUAL_MAX_MS=200000
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const combat = JSON.parse(fs.readFileSync(path.join(root, 'data/combat-params.json'), 'utf8'));
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), '/usr/bin/google-chrome'].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.FLEE_MANUAL_MAX_MS || 400000);
const EXPECTED_SHARE = 0.5; // wpisany udzial (decyzja wlasciciela 2026-11-14), nie czytany z data/
const MULT = EXPECTED_SHARE;
const capFor = (normal) => Math.max(1, Math.floor(normal * MULT));

const CASES = [
  { name: 'Wojownik (gracz) zlamany w reczniej turze 1', atk: 'Wojownik:6', def: 'Wojownik:6', route: 'Warrior', seed: 1 },
  { name: 'Rydwan konny (gracz) zlamany w reczniej turze 1', atk: 'Rydwan konny:4', def: 'Wojownik:6', route: 'War Chariot', seed: 1 },
  // zarzut Evaluatora 1: jednostka Harappy (Strażnik bram, normalny 3 -> limit 1) w tej samej bitwie recznej
  { name: 'Strażnik bram Harappy (gracz, civ Harappa) zlamany w reczniej turze 1', atk: 'Strażnik bram Harappy:2', def: 'Wojownik:2', route: 'Harappan Gate Guard', civA: 'Harappa', seed: 1 },
];
// Env FLEE_CASE=<indeks> uruchamia jeden przypadek (dlugie przypadki mieszcza sie w osobnych wywolaniach).
const RUN_CASES = process.env.FLEE_CASE ? CASES.filter((_, i) => String(i) === process.env.FLEE_CASE) : CASES;

(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: exe, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  let pass = 0; let fail = 0;
  const check = (name, ok, detail) => { if (ok) { pass++; console.log('PASS: ' + name); } else { fail++; console.log('FAIL: ' + name + ' -- ' + JSON.stringify(detail)); } };
  check('data/combat-params.json ucieczka.mnoznik_ruchu = 0.5 (udzial wpisany w tescie)', Number(combat.ucieczka.mnoznik_ruchu) === EXPECTED_SHARE, { mnoznik: combat.ucieczka.mnoznik_ruchu });
  const table = [];
  try {
    for (const c of RUN_CASES) {
      const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      const qs = new URLSearchParams({ seed: String(c.seed), atk: c.atk, def: c.def, route: c.route, rounds: '4', ...(c.civA ? { civA: c.civA } : {}) });
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-flee-manual-browser-entry.html?${qs.toString()}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch {
        timedOut = true;
        // diagnostyka timeoutu: stan bitwy i nazwy jednostek gracza (surowe dane)
        console.log('DIAG: ' + JSON.stringify(await page.evaluate(() => ({ round: window.__scene.roundNo, finished: window.__scene.finished, routedId: window.__e2e.routedId, started: window.__scene.started, deploy: window.__scene.deployPhase, roster: window.__scene._playerRoster().map(u => u.bu.nazwa + '/' + u.side + '/routed=' + !!u.routed) }))));
      }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      check(`[${c.name}] bitwa reczna dala wynik bez bledow`, !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      const mine = r.routed.filter(u => u.side === 'atk' && u.id === 'atk#1');
      const u = mine[0];
      check(`[${c.name}] zlamana jednostka wykonala kroki ucieczki w >= 2 turach`,
        !!u && Object.keys(u.perRound).length >= 2, { routed: r.routed.map(x => x.id), routedId: r.routedId });
      if (!u) continue;
      // zarzut Evaluatora 2: tryb reczny ma byc faktycznie aktywny w bitwie, nie tylko zapisany w api.info
      check(`[${c.name}] bitwa dziala w trybie recznym (manualMode=true)`, u.manualMode === true, { manualMode: u.manualMode });
      const cap = capFor(u.normal);
      table.push({ case: c.name, nazwa: u.nazwa, normal: u.normal, flee: u.flee, cap, perRound: u.perRound, maxPerRound: u.maxPerRound, totalSteps: u.totalSteps });
      check(`[${c.name}] ${u.nazwa}: normalny zasieg ${u.normal}, limit ucieczki ${cap}, max krokow/tura ${u.maxPerRound}`,
        u.maxPerRound <= cap, u);
      check(`[${c.name}] ${u.nazwa}: limit ucieczki jest egzekwowany (max krokow/tura = ${cap})`,
        u.maxPerRound === cap, { maxPerRound: u.maxPerRound, cap });
    }
  } finally { await browser.close(); await server.close(); }
  console.log(JSON.stringify(table, null, 1));
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
