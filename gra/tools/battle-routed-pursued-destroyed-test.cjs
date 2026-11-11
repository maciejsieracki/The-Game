'use strict';
// R-WEB-BATTLE-ROUTED-UNITS-PURSUED-AND-DESTROYED-Q1: test regresyjny prawdziwej bitwy 3D w Chromium (Vite HTTP).
//  - po zalamaniu morale CALEJ armii bitwa trwa dalej (konczy sie pozniej niz chwila zalamania),
//  - uciekinierzy sa CELAMI (ataki na routed > 0), a trafieni do HP<=0 gina (konnica dogania piechote),
//  - uciekinier opuszcza plansze dopiero na krawedzi SWOJEJ strony (fledAtEdge, bez fledNotAtEdge),
//  - po bitwie brak routed na polu; zabici + uciekli + aktywni = liczba jednostek; eksport = uciekli + aktywni.
// Mutacje (czerwienia test): (1) przywrocenie `!u.routed` w _enemiesOf, (2) koniec bitwy przy zalamaniu morale
// (_pursuitPending => false).
// Usage (z gra/): TMPDIR=/dev/shm node tools/battle-routed-pursued-destroyed-test.cjs
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const exe = [process.env.CHROMIUM_PATH, '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.ROUT_MAX_MS || 280000);

const CASES = [
  { name: 'konnica goni piechote', atk: 'Konnica:8', def: 'Wojownik:14', seed: 1, loser: 'def',
    expect: (r, c) => [
      // Progi z marginesem na jitter klatek (bez zegara deterministycznego: killedWhileRouted 3-5, def zabitych 6-9 po zmianie;
      // przed zmiana / mutacja 1: killedWhileRouted 0-1, def zabitych 4).
      ['killedWhileRouted >= 2 (uciekinier trafiony w drodze ginie)', r.killedWhileRouted >= 2, r.killedWhileRouted],
      ['def zabitych >= 5', r.def.killed >= 5, r.def.killed],
    ] },
  { name: 'konnica goni piechote (seed 2)', atk: 'Konnica:8', def: 'Wojownik:14', seed: 2, loser: 'def',
    expect: (r, c) => [
      ['killedWhileRouted >= 2', r.killedWhileRouted >= 2, r.killedWhileRouted],
      ['def zabitych >= 5', r.def.killed >= 5, r.def.killed],
    ] },
  { name: 'przewaga 2:1 wrecz', atk: 'Hastati:20', def: 'Hastati:10', seed: 1, loser: 'def',
    expect: (r, c) => [
      ['wszyscy uciekinierzy dobiegli do krawedzi swojej strony', r.fledNotAtEdge === 0 && r.fledAtEdge > 0, [r.fledAtEdge, r.fledNotAtEdge]],
      ['poscig piechoty: ataki na routed >= 10 (po zmianie 22-24, przed 0)', r.attacksOnRouted >= 10, r.attacksOnRouted],
    ] },
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
      await page.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-rout-pursuit-browser-entry.html?mode=skip&seed=${c.seed}&atk=${c.atk}&def=${c.def}`, { waitUntil: 'load', timeout: 60000 });
      await page.waitForFunction(() => window.__e2e?.ready === true, undefined, { timeout: 60000 });
      let timedOut = false;
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      console.log(JSON.stringify({ case: c.name, timedOut, errors, r }));
      check(`[${c.name}] bitwa zakonczona bez bledow`, !timedOut && !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      check(`[${c.name}] bitwa trwa PO zalamaniu morale calej armii (runda konca > runda zalamania)`, r.collapseRound > 0 && r.round > r.collapseRound, [r.collapseRound, r.round]);
      check(`[${c.name}] uciekinierzy sa celami (ataki na routed > 0)`, r.attacksOnRouted > 0, r.attacksOnRouted);
      check(`[${c.name}] po bitwie brak uciekinierow na polu`, r.atk.routedLeft === 0 && r.def.routedLeft === 0, [r.atk.routedLeft, r.def.routedLeft]);
      for (const side of ['atk', 'def']) {
        const t = r[side];
        check(`[${c.name}] ${side}: zabici + uciekli + aktywni = liczba jednostek`, t.killed + t.fled + t.survived === t.total, t);
      }
      check(`[${c.name}] eksport = uciekli + aktywni (zabici nie wracaja)`,
        r.exportedAtk === r.atk.fled + r.atk.survived && r.exportedDef === r.def.fled + r.def.survived, [r.exportedAtk, r.exportedDef, r.atk, r.def]);
      check(`[${c.name}] uciekajacy opuszczaja plansze na krawedzi wlasnej strony`, r.fledNotAtEdge === 0, [r.fledAtEdge, r.fledNotAtEdge, r.notEdge]);
      for (const [n, ok, d] of c.expect(r, c)) check(`[${c.name}] ${n}`, ok, d);
    }
  } finally { await browser.close(); await server.close(); }
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
