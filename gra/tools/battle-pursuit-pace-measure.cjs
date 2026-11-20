'use strict';
// R-WEB-BATTLE-WINNING-ARMY-FULL-MOVE-RANGE-AFTER-CONTACT-Q1 (ETAP 1): pomiar tempa zwycieskiej armii po zerwaniu kontaktu.
// Usage (z gra/): node tools/battle-pursuit-pace-measure.cjs
// Env: PP_MUT=1 (mutant: przeplanowanie ucietych planow konnicy + slad konnicy wylaczone = zachowanie bazowe sprzed r3) PP_MODES="skip,watch" PP_SEEDS="1,2,3" PP_SCEN="0,1,2" PP_MAX_MS=280000 PP_OUT=plik.json
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')].find(p => p && fs.existsSync(p));
const SEEDS = (process.env.PP_SEEDS || '1').split(',').map(Number);
const MAX_MS = Number(process.env.PP_MAX_MS || 280000);
const SCEN = [
  { name: 'jednorodna: wrecz 20 vs 10', atk: 'Hastati:20', def: 'Hastati:10' },
  { name: 'mieszana: wrecz+lucznicy+konnica vs wrecz', atk: 'Hastati:8,Lucznik:6,Konnica:4', def: 'Hastati:14' },
  { name: 'jednorodna: wrecz 12 vs 12', atk: 'Hastati:12', def: 'Hastati:12' },
  { name: 'konnica: 8 vs wrecz 6 (wolna droga, bez sufitu tempa)', atk: 'Konnica:8', def: 'Hastati:6' },
];
const only = process.env.PP_SCEN ? process.env.PP_SCEN.split(',').map(Number) : null;
(async () => {
  const mutPlugin = { name: 'pp-mut', enforce: 'pre', transform(code, id) { return id.includes('battleScene.ts') ? { code: code.replace('/*PATH_RESERVE*/ true', 'false').replace('/*CAV_TRAIL*/ ru.cavTrail?.has(nk)', 'false'), map: null } : null; } };
  // PP_PROTO=A_CAV|A_ALL: PROTOTYP reguly ciosu (wariant A, NIE wdrozony): po kroku, ktory konczy w zasiegu ciosu, jednostka z pozostalym
  // MP uderza od razu (A_CAV: tylko konnica `_cavManeuverStep`/`_cavDirectedManeuverStep`; A_ALL: + piechota `_advanceStep`). Tylko pomiar.
  const protoPlugin = { name: 'pp-proto', enforce: 'pre', transform(code, id) {
    if (!id.includes('battleScene.ts')) return null;
    let c = code.replace(/if \(this\._cavAdjacentNonSpear\(ru\)\) \{ done\(\); return; \}/g,
      '{ const _adj = this._cavAdjacentNonSpear(ru); if (_adj) { this._doAttack(ru, _adj, done); return; } }');
    if (process.env.PP_PROTO === 'A_ALL') {
      c = c.replace(/if \(this\._canAttackFrom\(ru, ru\.q, ru\.r\)\) \{ done\(\); return; \}/g,
        'if (this._canAttackFrom(ru, ru.q, ru.r)) { const _a = this._pickAdjacentTargetByPriority(ru); if (_a) this._doAttack(ru, _a, done); else done(); return; }');
    }
    return { code: c, map: null };
  } };
  const plugins = [...(process.env.PP_MUT ? [mutPlugin] : []), ...(process.env.PP_PROTO ? [protoPlugin] : [])];
  const server = await createServer({ root, plugins, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0, strictPort: false } });
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
          const r = await page.evaluate(() => ({ result: window.__e2e.result, rows: window.__e2e.rows, rounds: window.__e2e.rounds, moves: window.__e2e.moves, planWhy: window.__e2e.planWhy, arb: window.__e2e.arb, goLog: window.__e2e.goLog, callers: window.__e2e.callers, planTrace: window.__e2e.planTrace, attackLog: window.__e2e.attackLog }));
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
