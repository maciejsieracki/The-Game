'use strict';
// R-WEB-BATTLE-FORTIFIED-WARRIOR-LOSES-TO-BARBARIAN-Q1 r3 -- sonda sceny w Chromium (vite dev server).
// Mierzy PRAWDZIWA BattleScene dla 1v1 identycznych jednostek (domyslnie Wojownik).
// Uzycie (z gra/):
//   N=60 PAR=3 PATHS=pomin,manual-attack,manual-hold HITS=losowe,pewne node tools/battle-scene-probe.cjs
// Zmienne: N (powtorzenia dla 'losowe'; 'pewne' = PEWNE_N, domyslnie 3), PAR (rownolegle strony), UNIT,
//   FORTS=0,1 (obronca ufortyfikowany), EXTRA='{"playerHungry":true}' (JSON dolaczany do cfg), OUT (plik JSON).
// Wynik: % wygranych strony atakujacej / barbarzyncy / gracza, srednie straty HP, srednia liczba uderzen per strona.
// Zwyciezca = wynik sceny; gdy scena nie domknela sie w czasie (np. petla poscigu w trybie recznym headless),
// zwyciezca = strona, ktora NIE zalamala morale (routed) -- oznaczone w polu 'inferred'.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { createServer } = require('vite');
const root = path.resolve(__dirname, '..');
const N = Number(process.env.N || 40);
const PEWNE_N = Number(process.env.PEWNE_N || 3);
const PAR = Number(process.env.PAR || 3);
const UNIT = process.env.UNIT || 'Wojownik';
const PATHS = (process.env.PATHS || 'pomin,instant').split(',');
const HITS = (process.env.HITS || 'losowe,pewne').split(',');
const FORTS = (process.env.FORTS || '0,1').split(',').map((x) => x === '1');
const EXTRA = JSON.parse(process.env.EXTRA || '{}');
const TMO = Number(process.env.TMO || 25000);
const SEED0 = Number(process.env.SEED0 || 1000);
const OUT = process.env.OUT || '';
(async () => {
  const server = await createServer({ root, configFile: path.join(root, 'vite.config.ts'), logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const pages = [];
  for (let i = 0; i < PAR; i++) {
    const p = await browser.newPage({ viewport: { width: 640, height: 480 } });
    p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
    await p.goto(`http://127.0.0.1:${server.httpServer.address().port}/tools/battle-scene-probe-entry.html`, { waitUntil: 'load', timeout: 90000 });
    await p.waitForFunction(() => window.__probe?.ready === true, undefined, { timeout: 90000 });
    await p.evaluate((t) => { window.__probeTimeoutMs = t; }, TMO);
    pages.push(p);
  }
  const rows = [];
  for (const pth of PATHS) for (const hit of HITS) for (const atkOwner of ['barb', 'player']) for (const fortDef of FORTS) {
    const reps = (hit === 'pewne') ? PEWNE_N : N;
    const results = new Array(reps);
    let next = 0;
    await Promise.all(pages.map(async (p) => {
      for (;;) {
        const i = next++;
        if (i >= reps) return;
        results[i] = await p.evaluate((c) => window.__probe.run(c), { unit: UNIT, atkOwner, hit, fortDef, path: pth, seed: SEED0 + i, ...EXTRA });
      }
    }));
    let atkWins = 0, barbWins = 0, playerWins = 0, undecided = 0, inferred = 0, sumAtkLoss = 0, sumDefLoss = 0, bAtk = 0, bDef = 0, defFirst = 0;
    for (const r of results) {
      let w = r.winner;
      if (w !== 'atakujacy' && w !== 'obronca') {
        if (r.routed.length === 1) { w = r.routed[0] === 'atk' ? 'obronca' : 'atakujacy'; inferred++; } else { undecided++; continue; }
      }
      if (w === 'atakujacy') atkWins++;
      const barbIsAtk = atkOwner === 'barb';
      if ((w === 'atakujacy') === barbIsAtk) barbWins++; else playerWins++;
      sumAtkLoss += (r.startHp.a - (r.atkHpLeft ?? 0)) / r.startHp.a;
      sumDefLoss += (r.startHp.d - (r.defHpLeft ?? 0)) / r.startHp.d;
      bAtk += r.blows.atk; bDef += r.blows.def;
      if ((r.blowSeq || '').startsWith('d')) defFirst++;
    }
    const m = reps - undecided;
    const f = (x) => (m ? +(100 * x / m).toFixed(1) : null);
    const row = { path: pth, hit, atkOwner, fortDef, reps, decided: m, inferred, atkWinPct: f(atkWins), barbWinPct: f(barbWins), playerWinPct: f(playerWins),
      avgAtkLossPct: f(sumAtkLoss), avgDefLossPct: f(sumDefLoss), avgBlowsAtk: m ? +(bAtk / m).toFixed(2) : null, avgBlowsDef: m ? +(bDef / m).toFixed(2) : null,
      defStrikesFirstPct: f(defFirst), sampleSeq: results[0] && results[0].blowSeq, startPos: results[0] && results[0].startPos };
    rows.push(row); console.log(JSON.stringify(row));
  }
  if (OUT) fs.writeFileSync(OUT, JSON.stringify(rows, null, 2));
  await browser.close(); await server.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
