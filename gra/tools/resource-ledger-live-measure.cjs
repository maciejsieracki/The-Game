'use strict';
/**
 * resource-ledger-live-measure.cjs — R-WEB-UI-RESOURCE-SOURCE-LEDGER-SKAD-ZAPASY-Q1 (runda 4).
 *
 * POMIAR W REALNEJ GRZE (headless Chromium, realny bundle vite, ?civTest=1&civSeed=<ziarno>), nie fixture:
 *  (a) zgodnosc ksiegi z magazynem: dla KAZDEGO wlasciciela i KAZDEGO surowca w KAZDEJ turze
 *        roznica = (magazyn_po - magazyn_przed) - (suma rekordu ticku + okno_pending_po - okno_pending_przed) == 0
 *      (okno „pending” = przeplywy poza tickiem, opróżniane przy najblizszym ticku; patrz resource-ledger.ts),
 *  (b) mutacja (analiza): pominiecie jednego rodzaju zrodla w sumie ksiegi => rozjazd > 0,
 *  (c) hash stanu gry (digest jednostek+miast, bez podzialPracy) z ksiega i BEZ ksiegi (setRecording(false)) tura po turze.
 *
 * Uzycie (z gra/), bundle budowany POZA repo:
 *   node ./node_modules/vite/bin/vite.js build --outDir /tmp/civ-ledger-dist --emptyOutDir
 *   node tools/resource-ledger-live-measure.cjs --dist /tmp/civ-ledger-dist --seeds 7,2024,99991 --turns 30 --out /tmp/ledger-live.json
 * Jedna sesja przegladarki = jeden przebieg (seed x tryb). Tryby: ON (ksiega) i OFF (bez zapisu do ksiegi).
 */
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.'));
const SEEDS = String(arg('seeds', '7,2024,99991')).split(',').map(Number);
const TURNS = Number(arg('turns', '30'));
const OUT = path.resolve(arg('out', 'ledger-live.json'));
const RICH = arg('rich', '1') !== '0';
const START = arg('start', 'newgame'); // newgame = realny doStartGame (jeden gracz na starcie) | playtest = sandbox ?playtest=mapa (gracz + AI z miastem)
const PW = path.resolve(__dirname, '..', 'node_modules', 'playwright');
const CHROME = fs.existsSync((require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')) ? (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium')
  : (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const RES9 = ['drewno', 'kamien', 'glina', 'ruda', 'ruda_zelaza', 'ruda_cyny', 'sol', 'zloto', 'kon'];

const sumRec = (rec, skipKinds) => {
  const out = {};
  for (const [rk, srcs] of Object.entries((rec && rec.byResource) || {})) {
    let s = 0;
    for (const f of Object.values(srcs)) if (!skipKinds || !skipKinds.includes(f.kind)) s += f.amount;
    out[rk] = s;
  }
  return out;
};

function turnDiffs(before, after, skipKinds) {
  const rows = [];
  for (const o of after.owners) {
    const sB = before.stock[o] || {}, sA = after.stock[o] || {};
    const L = after.tickSeq > before.tickSeq ? sumRec(after.tick[o], skipKinds) : {};
    const PA = sumRec(after.pending[o], skipKinds), PB = sumRec(before.pending[o], skipKinds);
    const keys = new Set([...Object.keys(sB), ...Object.keys(sA), ...Object.keys(L), ...Object.keys(PA), ...Object.keys(PB)]);
    for (const k of keys) {
      const d = ((sA[k] || 0) - (sB[k] || 0)) - ((L[k] || 0) + (PA[k] || 0) - (PB[k] || 0));
      if (d !== 0) rows.push({ owner: o, resource: k, diff: d, stockDelta: (sA[k] || 0) - (sB[k] || 0) });
    }
  }
  return rows;
}

async function runOne(browserType, seed, recording) {
  const browser = await browserType.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const res = { seed, recording, turns: [], pageErrors: [], turnMs: [] };
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => res.pageErrors.push(String(e).slice(0, 300)));
    page.on('dialog', (d) => d.dismiss().catch(() => {}));
    await page.addInitScript((s0) => {
      let s = s0 | 0;
      Math.random = function () {
        s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }, (0x9e3779b9 ^ seed) | 0);
    const q = START === 'playtest' ? `?playtest=mapa&civTest=1&civSeed=${seed}` : `?civTest=1&civSeed=${seed}`;
    await page.goto('file://' + path.join(DIST, 'index.html') + q, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__detHarness && !!window.__ledgerTestDebug && !!window.__aiTradeWiringTestDebug, undefined, { timeout: 180000 });
    if (START !== 'playtest') await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((on) => window.__ledgerTestDebug.setRecording(on), recording);
    if (START === 'playtest') {
      await wait(1500);
      if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('foundFirstCity false (playtest)');
    } else {
      await page.evaluate((s) => window.__aiBuildingsTestDebug.startNewGame({ seed: s }), seed);
      const t0 = Date.now();
      for (;;) {
        const st = await page.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return d.awaitingFirstPlayerCity === true && d.playerStartHex !== null; } catch (e) { return false; } });
        if (st) break;
        if (Date.now() - t0 > 600000) throw new Error('timeout awaitingFirstPlayerCity');
        await wait(500);
      }
      if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    }
    await wait(500);
    try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { /* opcjonalne */ }
    try { await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true)); } catch (e) { /* opcjonalne */ }
    await wait(300);
    // Scena „bogata”: budynki konwersji/Mennica/Spichlerz/Stolarnia, zapasy startowe i Warzelnia soli u KAZDEGO wlasciciela z miastem
    // (setup PRZED pierwszym snapshotem pomiaru, wiec nie jest przeplywem ksiegi). Bez --rich 0 scena jest minimalna (1 miasto, brak budynkow).
    let aiOwner = null;
    if (RICH) {
      const sn0 = await page.evaluate(() => window.__ledgerTestDebug.snapshot());
      aiOwner = await page.evaluate(() => window.__aiTradeWiringTestDebug.info().ai);
      res.scenario = {};
      for (const o of sn0.owners) res.scenario[o] = await page.evaluate((x) => window.__ledgerTestDebug.scenarioSeed(x), o);
      // Druga strona umowy wymiany: miasto wlasciciela AI (setup przed pomiarem) + ta sama scena.
      if (aiOwner != null) {
        res.spawnedAiCity = await page.evaluate((x) => window.__ledgerTestDebug.spawnOwnerCity(x), aiOwner);
        if (res.spawnedAiCity) res.scenario[aiOwner] = await page.evaluate((x) => window.__ledgerTestDebug.scenarioSeed(x), aiOwner);
      }
    }
    res.trades = [];
    const digest = () => page.evaluate(() => JSON.parse(window.__detHarness.digest()));
    const snap = () => page.evaluate(() => window.__ledgerTestDebug.snapshot());
    for (let i = 0; i < TURNS; i++) {
      // Bramka NNS (prognoza skarbca/spichlerza < 0) blokuje koniec tury gracza: dosypka WYLACZNIE skarbca (zloto monetarne)
      // i zywnosci (zapasyPanstwa) -- to NIE sa surowce magazynu panstwa, wiec nie zaburza bilansu 9 surowcow; ta sama dosypka w ON i OFF.
      for (let k = 0; k < 20; k++) {
        const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
        if (!blocked) break;
        await page.evaluate(() => { window.__aiTradeWiringTestDebug.grantPlayerGold(2000); window.__aiTradeWiringTestDebug.grantPlayerFood(2000); });
        await wait(150);
      }
      const before = await snap();
      const turnBefore = before.turn;
      // Umowa wymiany w TRAKCIE tury (po snapshocie „przed”): REALNY transferBasketItems; sprawdzamy, do ktorego rekordu ticku trafia.
      let tradeNow = null;
      if (RICH && aiOwner != null && (i === 3 || i === 6 || i === 9)) {
        if (i === 9) {
          tradeNow = { mode: 'cykl', from: aiOwner, to: 0, key: 'drewno', qty: 40 };
          tradeNow.result = await page.evaluate((t) => window.__ledgerTestDebug.cyclicDeliver(t.from, t.to, t.key, t.qty), tradeNow);
        } else {
          tradeNow = i === 3 ? { mode: 'jednorazowa', from: 0, to: aiOwner, key: 'sol', qty: 20 } : { mode: 'jednorazowa', from: aiOwner, to: 0, key: 'drewno', qty: 100 };
          tradeNow.result = await page.evaluate((t) => window.__ledgerTestDebug.trade(t.from, t.to, t.key, t.qty), tradeNow);
        }
      }
      await page.evaluate(() => window.__eraTestDebug.endTurn());
      const t1 = Date.now();
      for (;;) {
        const s = await page.evaluate(() => ({ ip: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
        if (!s.ip && s.turn > turnBefore) break;
        if (Date.now() - t1 > 400000) throw new Error('endTurn timeout at turn ' + turnBefore);
        await wait(200);
      }
      res.turnMs.push(Date.now() - t1);
      const after = await snap();
      const d = await digest();
      if (tradeNow) {
        const rec = (o) => (((after.tick[o] || { byResource: {} }).byResource[tradeNow.key]) || {});
        tradeNow.turnBefore = turnBefore; tradeNow.turnAfter = after.turn;
        tradeNow.outLedger = Object.values(rec(tradeNow.from)).filter((f) => f.kind === 'umowa_wymiany');
        tradeNow.inLedger = Object.values(rec(tradeNow.to)).filter((f) => f.kind === 'umowa_wymiany');
        tradeNow.pendingAfter = after.pending;
        res.trades.push(tradeNow);
      }
      res.turns.push({ turn: after.turn, ticks: after.tickSeq - before.tickSeq, fnvNoPP: d.fnvNoPP, lenNoPP: d.lenNoPP, before, after });
    }
    // Reset okna pending przy NOWEJ GRZE (FC r3 nr 6): wpis w oknie -> realny doStartGame w tej samej sesji -> okno puste.
    if (recording && RICH && START !== 'playtest' && aiOwner != null) {
      await page.evaluate((a) => window.__ledgerTestDebug.trade(0, a, 'sol', 20), aiOwner);
      const before = await page.evaluate(() => Object.keys(window.__ledgerTestDebug.pendingPeek()).length);
      await page.evaluate((sd) => window.__aiBuildingsTestDebug.startNewGame({ seed: sd }), seed + 1);
      const tn = Date.now();
      for (;;) {
        const ok = await page.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return d.awaitingFirstPlayerCity === true; } catch (e) { return false; } });
        if (ok) break;
        if (Date.now() - tn > 300000) break;
        await wait(300);
      }
      const after = await page.evaluate(() => Object.keys(window.__ledgerTestDebug.pendingPeek()).length);
      res.newGameReset = { pendingOwnersBeforeNewGame: before, pendingOwnersAfterNewGame: after };
    }
    res.e3c = await page.evaluate(() => { const s = window.__ledgerTestDebug.snapshot(); return { fires: s.e3cFires, last: s.e3cLast }; });
    res.done = true;
  } finally {
    await browser.close();
  }
  return res;
}

(async () => {
  const { chromium } = require(PW);
  const report = { dist: DIST, turns: TURNS, seeds: SEEDS, runs: [], summary: {} };
  if (arg('selftest', '0') === '1') {
    // Baza determinizmu gry BEZ udzialu przelacznika ksiegi: ten sam seed, ksiega ON dwa razy -> hash tura po turze.
    for (const seed of SEEDS) {
      const a = await runOne(chromium, seed, true), b = await runOne(chromium, seed, true);
      const eq = a.turns.map((t, i) => b.turns[i] && t.fnvNoPP === b.turns[i].fnvNoPP && t.lenNoPP === b.turns[i].lenNoPP);
      console.log(`[ledger-live] SELFTEST seed=${seed} ON-vs-ON hash rowne ${eq.filter(Boolean).length}/${eq.length}; rozne tury: ` + a.turns.filter((t, i) => !eq[i]).map((t) => t.turn).join(','));
    }
    process.exit(0);
  }
  for (const seed of SEEDS) {
    for (const rec of [true, false]) {
      console.log(`[ledger-live] seed=${seed} ksiega=${rec ? 'ON' : 'OFF'} ...`);
      const r = await runOne(chromium, seed, rec);
      report.runs.push(r);
      fs.writeFileSync(OUT, JSON.stringify(report));
    }
    const on = report.runs.find((r) => r.seed === seed && r.recording);
    const off = report.runs.find((r) => r.seed === seed && !r.recording);
    // (a) zgodnosc (ON)
    let maxDiff = 0; const nonzero = []; let noTick = 0;
    for (const t of on.turns) {
      if (t.ticks !== 1) noTick++;
      for (const row of turnDiffs(t.before, t.after)) { maxDiff = Math.max(maxDiff, Math.abs(row.diff)); nonzero.push({ turn: t.turn, ...row }); }
    }
    // (b) mutacje: pominiecie rodzaju zrodla
    const kinds = new Set();
    for (const t of on.turns) for (const o of t.after.owners) for (const srcs of Object.values((t.after.tick[o] || { byResource: {} }).byResource)) for (const f of Object.values(srcs)) kinds.add(f.kind);
    const mut = {};
    for (const k of kinds) {
      let m = 0;
      for (const t of on.turns) for (const row of turnDiffs(t.before, t.after, [k])) m = Math.max(m, Math.abs(row.diff));
      mut[k] = m;
    }
    // (c) hash ON vs OFF
    const hashEq = on.turns.map((t, i) => off.turns[i] && t.fnvNoPP === off.turns[i].fnvNoPP && t.lenNoPP === off.turns[i].lenNoPP);
    const offEmpty = off.turns.every((t) => t.after.owners.every((o) => Object.keys((t.after.tick[o] || { byResource: {} }).byResource).length === 0));
    // plon soli i zrodla soli
    const solSources = {};
    for (const t of on.turns) for (const o of t.after.owners) {
      const s = ((t.after.tick[o] || { byResource: {} }).byResource.sol) || {};
      for (const f of Object.values(s)) solSources[f.label] = (solSources[f.label] || 0) + f.amount;
    }
    report.summary[seed] = {
      turnsMeasured: on.turns.length, ticksNot1: noTick, maxAbsDiff: maxDiff, nonzeroRows: nonzero.length,
      nonzeroSample: nonzero.slice(0, 25), mutationMaxDiffBySkippedKind: mut,
      hashEqualOnOff: hashEq.every(Boolean), hashEqualCount: hashEq.filter(Boolean).length, offRecordsEmpty: offEmpty,
      pageErrorsOn: on.pageErrors.length, pageErrorsOff: off.pageErrors.length,
      avgTurnMsOn: Math.round(on.turnMs.reduce((a, b) => a + b, 0) / on.turnMs.length),
      avgTurnMsOff: Math.round(off.turnMs.reduce((a, b) => a + b, 0) / off.turnMs.length),
      solSourcesTotal: solSources,
      scenario: on.scenario, trades: on.trades, newGameReset: on.newGameReset, e3c: on.e3c,
    };
    console.log(`[ledger-live] seed=${seed} SUMMARY ` + JSON.stringify(report.summary[seed]).slice(0, 1500));
  }
  fs.writeFileSync(OUT, JSON.stringify(report));
  const bad = Object.values(report.summary).some((s) => s.maxAbsDiff !== 0 || !s.hashEqualOnOff);
  console.log('[ledger-live] DONE; out=' + OUT + '; ' + (bad ? 'ROZJAZD/HASH-RÓŻNY' : 'zgodnosc 0 i hash identyczny'));
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error('FATAL', String(e).slice(0, 600)); process.exit(2); });
