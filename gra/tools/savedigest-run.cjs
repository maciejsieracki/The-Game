'use strict';
/**
 * savedigest-run.cjs -- R-WEB-SAVE-DIGEST-DIFF-Q1 (SAVEDIGEST). Zywy pomiar tozsamosci stanu po zapisie/wczytaniu.
 *
 * Tryby (--mode):
 *   rt  -- w JEDNEJ sesji: N tur -> digest (A) -> snapshotJson -> restoreJson (in place) -> digest (B) ;
 *          zrzuty full() przed i po (pliki poza repo). Zadnej kontynuacji po restore (nie zaklocamy stanu).
 *   A   -- N tur -> zapis (snapshotJson + full) -> K tur z digestem (wzorzec determinism-save-load-resume-live).
 *   B   -- swieza sesja (ten sam seed/konfiguracja), restoreJson ze snapshotu z A -> K tur z digestem.
 * Konfiguracja (--cfg):
 *   max     -- maksimum nowej gry (jak caprebel2-live.cjs: Trudny, dyplomacja trudna, Wysoki x4, kultura trudny, kultura AI trudny, flagi ON)
 *   default -- ustawienia domyslne (kultura null / AI null), bez zmian pozostalych pol
 *   aionly  -- jak default, ale kulturaReligiaLevelAI = trudny (tylko poziom AI rozni sie od gracza)
 * Uzycie (z gra/, dist poza repo):
 *   node tools/savedigest-run.cjs --dist <abs katalog z index.html> --mode rt --cfg max --seed 4242 --n 5 --out <abs.json> [--snap <abs>]
 *   tryb A/B z buntem stolicy AI w 1. turze po zapisie: dodaj --bunt 1 (cfg max = konfiguracja iii)
 * Wynik: JSON z rekordami {phase, turn, digest}. Digest = __detHarness.digest() (units+cities, FNV i dlugosc).
 */
const fs = require('fs');
const path = require('path');

const GRA_DIR = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.'));
const MODE = arg('mode', 'rt');
const CFG = arg('cfg', 'max');
const SEED = Number(arg('seed', '4242'));
const N = Number(arg('n', '5'));
const K = Number(arg('k', '3'));
const BUNT = arg('bunt', '0') === '1'; // iii: bunt stolicy AI w PIERWSZEJ turze po zapisie (forceRevoltEligible jak CAPREBEL2)
const SNAP = path.resolve(arg('snap', path.join(DIST, 'snap.json')));
// SAVEFIX r2 (diagnostyka): --dumpmod <abs> (tryb A) zrzuca mapy poziomu modulu po migawce; --inject <abs> (tryb B) podstawia je po restore; --injectnames a,b (opcjonalnie: tylko wskazane).
const DUMPMOD = arg('dumpmod', '');
const INJECT = arg('inject', '');
const INJECTNAMES = arg('injectnames', '').split(',').filter(Boolean);
const OUT = path.resolve(arg('out', path.join(DIST, 'run.json')));
const PW = process.env.PW_PATH || path.resolve(GRA_DIR, 'node_modules', 'playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), MODE, CFG, SEED, ...a);

const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');

const MAX_ADV = {
  barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  wzrostSurowcowZEpoka: true,
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
  cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  kulturaReligiaLevelAI: 'trudny',
};
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: MAX_ADV,
  villageRewardsEnabled: true,
};
function cfgParams() {
  if (CFG === 'max') return JSON.parse(JSON.stringify(MAX_PARAMS));
  const p = JSON.parse(JSON.stringify(MAX_PARAMS));
  if (CFG === 'default') { delete p.advanced.kulturaReligiaLevel; delete p.advanced.kulturaReligiaLevelAI; }
  if (CFG === 'aionly') { delete p.advanced.kulturaReligiaLevel; }
  return p;
}

async function main() {
  const { chromium } = require(PW);
  const res = { dist: DIST, mode: MODE, cfg: CFG, seed: SEED, n: N, k: K, records: [], pageErrors: [], turnMs: [] };
  const flush = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
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
    await page.waitForFunction(() => !!window.__settingsLive && !!window.__eraTestDebug && !!window.__detHarness
      && !!window.__aiTradeWiringTestDebug && !!window.__nnsMeasureDebug && !!window.__rebelProtectionTestDebug, null, { timeout: 180000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, cfgParams()));
    await page.waitForFunction(() => { try { return window.__eraTestDebug.getWorldState().turn >= 1; } catch (_) { return false; } }, null, { timeout: 240000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!founded) throw new Error('foundFirstCity=false');
    await wait(300);
    try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (e) { res.records.push({ note: 'disableVictoryCheck: ' + String(e).slice(0, 120) }); }
    await wait(300);

    const endTurn = async () => {
      await closeCivWelcome(page);
      await prepareEndTurnGate(page).catch(() => null);
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
    // Bunt stolicy AI (tryb --bunt 1): pierwsza AI-stolica; forceRevoltEligible jak w caprebel2-live.cjs (sl).
    const forceBunt = async () => page.evaluate(() => {
      for (let o = 1; o <= 8; o++) {
        const c = window.__cityCessionTestDebug.capitalOf(o);
        if (c) { window.__rebelNotifyTestDebug.forceRevoltEligible(c); return { owner: o, capId: c }; }
      }
      throw new Error('brak stolicy AI');
    });
    const digest = () => page.evaluate(() => window.__detHarness.digest());
    const turnNow = () => page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    // Pelny zrzut (units+cities) po kazdej turze -- do diffu z odfiltrowaniem pol domyslnych (savedigest-diff.cjs).
    const dumpFull = async (tag) => fs.writeFileSync(OUT + '.' + tag + '.full', await page.evaluate(() => window.__detHarness.full()));

    if (MODE === 'rt') {
      while ((await turnNow()) < N) { const t = await endTurn(); res.records.push({ phase: 'pre-save', turn: t, digest: await digest() }); flush(); }
      const snap = await page.evaluate(() => window.__detHarness.snapshotJson());
      const full0 = await page.evaluate(() => window.__detHarness.full());
      fs.writeFileSync(SNAP, snap); fs.writeFileSync(OUT + '.pre.full', full0);
      res.snapBytes = snap.length;
      res.records.push({ phase: 'snap', turn: await turnNow(), digest: await digest() });
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snap);
      await wait(300);
      fs.writeFileSync(OUT + '.post.full', await page.evaluate(() => window.__detHarness.full()));
      res.records.push({ phase: 'rt-restore', turn: await turnNow(), digest: await digest() });
      flush();
    } else if (MODE === 'A') {
      while ((await turnNow()) < N) { const t = await endTurn(); res.records.push({ phase: 'pre-save', turn: t, digest: await digest() }); flush(); }
      const snap = await page.evaluate(() => window.__detHarness.snapshotJson());
      fs.writeFileSync(SNAP, snap); fs.writeFileSync(SNAP + '.full', await page.evaluate(() => window.__detHarness.full()));
      if (DUMPMOD) fs.writeFileSync(DUMPMOD, JSON.stringify(await page.evaluate(() => { const d = window.__savefixDiag; const o = {}; for (const n of d.names()) o[n] = d.dump(n); return o; })));
      res.snapBytes = snap.length;
      res.records.push({ phase: 'snap', turn: await turnNow(), digest: await digest() });
      for (let i = 0; i < K; i++) { if (BUNT && i === 0) res.bunt = await forceBunt(); const t = await endTurn(); res.records.push({ phase: 'cont', turn: t, digest: await digest() }); await dumpFull('cont' + t); flush(); }
    } else if (MODE === 'B') {
      const snap = fs.readFileSync(SNAP, 'utf8');
      await page.evaluate((s) => window.__detHarness.restoreJson(s), snap);
      await wait(300);
      if (INJECT) {
        const obj = JSON.parse(fs.readFileSync(INJECT, 'utf8'));
        const names = INJECTNAMES.length ? INJECTNAMES : Object.keys(obj);
        await page.evaluate(({ obj, names }) => { for (const n of names) window.__savefixDiag.load(n, obj[n]); }, { obj, names });
        res.injected = names;
        log('INJECT ' + names.join(','));
      }
      fs.writeFileSync(OUT + '.full', await page.evaluate(() => window.__detHarness.full()));
      res.records.push({ phase: 'restore', turn: await turnNow(), digest: await digest() });
      for (let i = 0; i < K; i++) { if (BUNT && i === 0) res.bunt = await forceBunt(); const t = await endTurn(); res.records.push({ phase: 'resumed', turn: t, digest: await digest() }); await dumpFull('resumed' + t); flush(); }
    } else {
      throw new Error('nieznany --mode ' + MODE);
    }
    res.done = true;
    flush();
    log('DONE records=' + res.records.length + ' pageErrors=' + res.pageErrors.length);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FATAL', String(e).slice(0, 500)); process.exitCode = 1; });
