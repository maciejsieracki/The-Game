'use strict';
// R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1 (FLEEMANUAL): runner pomiaru odwrotu w RECZNYM trybie bitwy 3D.
// Ten sam scenariusz live co battle-flee-manual-test.cjs (Chromium + Vite, strona battle-flee-manual-browser-entry.html,
// jednostka gracza zlamana w turze 1), ale dodatkowo mierzy z ZAPISU KROKOW (api.log, wpis = jeden krok _doMove):
//   1. limit ruchu: max krokow/ture <= floor(mnoznik_ruchu * normalny zasieg)  (jak w tescie referencyjnym),
//   2. brak odwrotu poza mapa: kazdy krok (col,row) miesci sie w planszy BF_COLS x BF_ROWS (68 x 156, battleScene.ts),
//   3. stan po odwrocie: ostatnia pozycja, liczba krokow, moveLeft przed kazdym krokiem >= 1 (brak ruchu bez punktow),
//      oraz pozycja po odwrocie rozni sie od pozycji startowej (odwrot faktycznie przemiescil jednostke),
//   4. animacja: NIE ZMIERZONO tym runnerem (brak hooka na zakonczenie animacji; sprawdzana jest tylko logika ruchu).
// Wynik: wiersze JSON per przypadek w --out (katalog) + SHA256 pliku, bez zapisu do repo poza wskazanym katalogiem.
// Usage (z gra/): node tools/flee-manual-measure.cjs [--out <abs-katalog>] (FLEE_CASE=<indeks> opcjonalnie)
// Env: FLEE_MANUAL_MAX_MS (domyslnie 400000), CHROME_PATH (opcjonalnie).
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const combat = JSON.parse(fs.readFileSync(path.join(root, 'data/combat-params.json'), 'utf8'));
const { resolveChromePath } = require('./_chrome-path.cjs');
const exe = [process.env.CHROME_PATH, process.env.CHROMIUM_PATH, resolveChromePath(), '/usr/bin/google-chrome', '/usr/bin/chromium'].find(p => p && fs.existsSync(p));
const MAX_MS = Number(process.env.FLEE_MANUAL_MAX_MS || 400000);
const BF_COLS = 68; // battleScene.ts: const BF_COLS = 68
const BF_ROWS = 156; // battleScene.ts: const BF_ROWS = 156
const EXPECTED_SHARE = 0.5; // wpisany udzial (decyzja wlasciciela 2026-11-14), nie czytany z data/
const capFor = (normal) => Math.max(1, Math.floor(normal * EXPECTED_SHARE));
const argVal = (name, def) => { const i = process.argv.indexOf('--' + name); return i >= 0 ? process.argv[i + 1] : def; };
const OUT = path.resolve(argVal('out', path.join(root, '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-MEASURE-FORTRING-FLEEMANUAL-RUNNERS-Q1', 'dane')));

const CASES = [
  { name: 'Wojownik (gracz) zlamany w reczniej turze 1', atk: 'Wojownik:6', def: 'Wojownik:6', route: 'Warrior', seed: 1 },
  { name: 'Rydwan konny (gracz) zlamany w reczniej turze 1', atk: 'Rydwan konny:4', def: 'Wojownik:6', route: 'War Chariot', seed: 1 },
  { name: 'Strażnik bram Harappy (gracz, civ Harappa) zlamany w reczniej turze 1', atk: 'Strażnik bram Harappy:2', def: 'Wojownik:2', route: 'Harappan Gate Guard', civA: 'Harappa', seed: 1 },
];
const RUN_CASES = process.env.FLEE_CASE ? CASES.filter((_, i) => String(i) === process.env.FLEE_CASE) : CASES;

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
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
      try { await page.waitForFunction(() => window.__e2e.done === true, undefined, { timeout: MAX_MS, polling: 500 }); } catch { timedOut = true; }
      const r = await page.evaluate(() => window.__e2e.result);
      await page.close();
      check(`[${c.name}] bitwa reczna dala wynik bez bledow`, !timedOut && !errors.length && !!r, { timedOut, errors });
      if (!r) continue;
      const u = r.routed.find(x => x.side === 'atk' && x.id === 'atk#1');
      check(`[${c.name}] zlamana jednostka wykonala kroki ucieczki w >= 2 turach`, !!u && Object.keys(u.perRound).length >= 2, { routed: r.routed.map(x => x.id) });
      if (!u) continue;
      check(`[${c.name}] bitwa dziala w trybie recznym (manualMode=true)`, u.manualMode === true, { manualMode: u.manualMode });
      const cap = capFor(u.normal);
      // Kroki tej jednostki z dziennika (api.log jest obcinany do 200 wpisow w entry; sprawdzane sa wszystkie dostepne).
      const steps = r.log.filter(s => s.id === 'atk#1');
      const offMap = steps.filter(s => s.col < 0 || s.col >= BF_COLS || s.row < 0 || s.row >= BF_ROWS);
      const noPoints = steps.filter(s => !(s.moveLeft >= 1));
      // log zapisuje CEL kazdego kroku (col,row = pole docelowe _doMove); pozycja startowa nie jest w logu,
      // wiec "przemieszczenie" = liczba roznych pol docelowych >= 2 (jednostka weszla w co najmniej dwa pola).
      const last = steps.length ? steps[steps.length - 1] : null;
      const distinct = new Set(steps.map(s => `${s.col},${s.row}`)).size;
      const start = steps.length ? { firstCel: { col: steps[0].col, row: steps[0].row } } : null;
      const moved = distinct >= 2;
      const row = {
        case: c.name, nazwa: u.nazwa, normal: u.normal, flee: u.flee, cap, perRound: u.perRound,
        maxPerRound: u.maxPerRound, totalSteps: u.totalSteps, kroki: steps.length,
        pozycjaStart: start, pozycjaKoniec: last ? { col: last.col, row: last.row, round: last.round } : null,
        poza_plansza: offMap.length, kroki_bez_punktow: noPoints.length, plansza: [BF_COLS, BF_ROWS],
      };
      table.push(row);
      check(`[${c.name}] ${u.nazwa}: normalny zasieg ${u.normal}, limit ucieczki ${cap}, max krokow/tura ${u.maxPerRound}`, u.maxPerRound <= cap, u);
      check(`[${c.name}] ${u.nazwa}: limit ucieczki jest egzekwowany (max krokow/tura = ${cap})`, u.maxPerRound === cap, { maxPerRound: u.maxPerRound, cap });
      check(`[${c.name}] brak odwrotu poza plansza (${steps.length} krokow, plansza ${BF_COLS}x${BF_ROWS})`, steps.length > 0 && offMap.length === 0, { offMap: offMap.slice(0, 5) });
      check(`[${c.name}] kazdy krok ma punkty ruchu (moveLeft >= 1 przed krokiem)`, steps.length > 0 && noPoints.length === 0, { noPoints: noPoints.slice(0, 5) });
      check(`[${c.name}] stan po odwrocie: jednostka przemiescila sie z pozycji startowej`, moved, { start, last });
    }
  } finally { await browser.close(); await server.close(); }
  const outFile = path.join(OUT, `flee-manual-measure-case${process.env.FLEE_CASE ?? 'all'}.json`);
  const body = JSON.stringify({ schema: 'flee-manual-measure-v1', mnoznik: EXPECTED_SHARE, rows: table }, null, 1);
  fs.writeFileSync(outFile, body + '\n');
  console.log(JSON.stringify(table, null, 1));
  console.log(`zapisano: ${outFile} sha256=${crypto.createHash('sha256').update(body + '\n').digest('hex')}`);
  console.log(`\n${pass} PASS, ${fail} FAIL`);
  process.exitCode = fail ? 1 : 0;
})().catch(e => { console.error(e.stack || e); process.exitCode = 1; });
