'use strict';
/**
 * R-WEB-DETERMINISM-SAVE-LOAD-RESUME-Q1: pomiar live (headless Chromium, realny bundle) wznowienia z zapisu.
 *
 * NIE jest bramka (wymaga zbudowanego dist i przegladarki). Zrodlo prawdy dla kryterium (a)-(d) dispatchu.
 *
 * Budowa dist (poza repo, w kopii gra/):  npx vite build --outDir <dir>   (z kopii, nie w gra/ repo)
 * Uruchomienie (jedna sesja = jeden run):
 *   node tools/determinism-save-load-resume-live.cjs --dist <dir> --seed 2222 --mode A --n 6 --k 10 --snap <snap.json> --out <run.json>
 *   node tools/determinism-save-load-resume-live.cjs --dist <dir> --seed 2222 --mode B --n 6 --k 10 --snap <snap.json> --out <run.json>
 *   node tools/determinism-save-load-resume-live.cjs --dist <dir> --seed 2222 --mode C --n 6 --k 10 --snap <snap.json> --drop detIdSeq,autoBattleSeqTurn,autoBattleSeq --out <run.json>
 *   node tools/determinism-save-load-resume-live.cjs --compare <A.json> <B.json>
 *     A: nowa gra (seed), N tur, zapis snapshotu (realny buildSaveGameSnapshot), potem K tur z digestem.
 *     B: swieza sesja (ten sam seed), realny restoreGameFromSave ze snapshotu z A, K tur z digestem.
 *     C: jak B, ale z snapshotu usuniete pola meta (stary zapis).
 * Porownanie: digest noPP (bez podzialPracy miast) tura po turze; EQ = identyczny stan.
 */
const fs = require('fs');
const path = require('path');

if (process.argv[2] === '--compare') {
  const L = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
  const rows = (r) => r.records.filter((x) => x.digest).map((x) => ({ p: x.phase, t: x.turn, d: JSON.parse(x.digest) }));
  const a = rows(L(process.argv[3])); const b = rows(L(process.argv[4]));
  const snap = a.find((r) => r.p === 'snap'); const rest = b.find((r) => r.p === 'restore');
  const eq = (x, y) => !!x && !!y && x.d.fnvNoPP === y.d.fnvNoPP && x.d.lenNoPP === y.d.lenNoPP;
  const ca = a.filter((r) => r.p === 'cont'); const cb = b.filter((r) => r.p === 'resumed');
  console.log('restore==snap (noPP):', eq(snap, rest), ' restore detIdSeq:', rest && rest.d.detIdSeq, ' snap detIdSeq:', snap && snap.d.detIdSeq);
  ca.forEach((x, i) => console.log(`tura ${x.t}: ${eq(x, cb[i]) ? 'EQ' : 'DIFF'}  A=${x.d.fnvNoPP} B=${cb[i] ? cb[i].d.fnvNoPP : '-'}`));
  console.log(`EQUAL ${ca.filter((x, i) => eq(x, cb[i])).length} of ${ca.length}`);
  process.exit(0);
}

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.')); const SEED = Number(arg('seed', '2222')); const MODE = arg('mode', 'A');
const N = Number(arg('n', '6')); const K = Number(arg('k', '10')); const SNAP = path.resolve(arg('snap', 'snap.json'));
const OUT = path.resolve(arg('out', 'run.json')); const DROP = (arg('drop', '') || '').split(',').filter(Boolean);
const PW = '/opt/node22/lib/node_modules/playwright'; // C-Q1: globalny playwright (brak gra/node_modules w worktree przed npm ci)
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), MODE, SEED, ...a);

async function main() {
  const { chromium } = require(PW);
  const res = { dist: DIST, seed: SEED, mode: MODE, n: N, k: K, drop: DROP, records: [], pageErrors: [], turnMs: [] };
  const flush = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const browser = await chromium.launch({
    headless: true, executablePath: fs.existsSync(FALLBACK_CHROME) ? FALLBACK_CHROME : undefined,
    args: ['--no-sandbox', '--headless=new', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
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
    }, (0x9e3779b9 ^ SEED) | 0);
    await page.goto('file://' + path.join(DIST, 'index.html') + `?civTest=1&civSeed=${SEED}`, { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(() => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__detHarness, undefined, { timeout: 180000 });
    await page.waitForSelector('.civ-menu', { timeout: 180000 });
    await page.evaluate((s) => window.__aiBuildingsTestDebug.startNewGame({ seed: s }), SEED);
    const t0 = Date.now();
    for (;;) {
      const st = await page.evaluate(() => { try { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { ok: d.awaitingFirstPlayerCity === true && d.playerStartHex !== null }; } catch (e) { return { ok: false }; } });
      if (st.ok) break;
      if (Date.now() - t0 > 1500000) throw new Error('timeout awaitingFirstPlayerCity');
      await wait(500);
    }
    if (!(await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity()))) throw new Error('foundPlayerStartCity false');
    await wait(500);
    try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { res.records.push({ note: 'disableVictoryCheck: ' + String(e).slice(0, 120) }); }
    await wait(300);

    try { res.fastMode = await page.evaluate(() => { window.__aiTradeWiringTestDebug.setFastMode(true); return window.__aiTradeWiringTestDebug.isFastMode(); }); } catch (e) { res.records.push({ note: 'fastMode: ' + String(e).slice(0, 160) }); }

    const endTurn = async () => {
      const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
      await page.evaluate(() => window.__eraTestDebug.endTurn());
      const t1 = Date.now();
      for (;;) {
        const s = await page.evaluate(() => ({ ip: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
        if (!s.ip && s.turn > before) { res.turnMs.push(Date.now() - t1); return s.turn; }
        if (Date.now() - t1 > 400000) throw new Error('endTurn timeout at turn ' + before);
        await wait(300);
      }
    };
    const digest = () => page.evaluate(() => window.__detHarness.digest());
    const counters = () => page.evaluate(() => window.__detHarness.counters());

    if (MODE === 'A') {
      res.records.push({ phase: 'start', turn: await page.evaluate(() => window.__eraTestDebug.getWorldState().turn), digest: await digest() });
      while ((await page.evaluate(() => window.__eraTestDebug.getWorldState().turn)) < N) {
        const t = await endTurn();
        res.records.push({ phase: 'pre-save', turn: t, digest: await digest() });
        flush();
      }
      const snap = await page.evaluate(() => window.__detHarness.snapshotJson());
      fs.writeFileSync(SNAP, snap);
      fs.writeFileSync(SNAP + '.full', await page.evaluate(() => window.__detHarness.full()));
      res.snapBytes = snap.length;
      res.records.push({ phase: 'snap', turn: await page.evaluate(() => window.__eraTestDebug.getWorldState().turn), digest: await digest(), counters: await counters() });
      flush();
      for (let i = 0; i < K; i++) {
        const t = await endTurn();
        res.records.push({ phase: 'cont', turn: t, digest: await digest() });
        flush();
      }
    } else {
      let snap = fs.readFileSync(SNAP, 'utf8');
      if (MODE === 'C' && DROP.length) snap = await page.evaluate(({ s, keys }) => window.__detHarness.dropMetaKeys(s, keys), { s: snap, keys: DROP });
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snap);
      await wait(300);
      fs.writeFileSync(OUT + '.full', await page.evaluate(() => window.__detHarness.full()));
      res.records.push({ phase: 'restore', turn: await page.evaluate(() => window.__eraTestDebug.getWorldState().turn), digest: await digest(), counters: await counters() });
      flush();
      for (let i = 0; i < K; i++) {
        const t = await endTurn();
        res.records.push({ phase: 'resumed', turn: t, digest: await digest() });
        flush();
      }
    }
    res.done = true;
    flush();
    log('DONE records=' + res.records.length + ' pageErrors=' + res.pageErrors.length);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FATAL', String(e).slice(0, 500)); process.exitCode = 1; });
