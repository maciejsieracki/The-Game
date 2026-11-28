'use strict';
/**
 * save-load-continuity-live.cjs -- R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX). Zywy test ciaglosci zapisu/wczytania.
 *
 * Teza: po wczytaniu zapisu (sesja B: swieza gra tego samego ziarna + wczytanie jak z menu pauzy) przebieg K tur jest
 * IDENTYCZNY z ciaglym przebiegiem (sesja A: ta sama gra grana dalej bez wczytania). Porownanie per tura na pelnym
 * zrzucie jednostek i miast (__detHarness.full()), znormalizowanym: pola o wartosci domyslnej (undefined/null/false/0/''/[]/{})
 * sa pomijane po obu stronach (restore dopisuje domyslne pola, np. budowaLista:[], magazynZywnosci:0 -- sama reprezentacja),
 * stackGroupId (z Date.now) pomijany.
 *
 * Wczytanie sesji B: --restore pause (domyslnie) = __detHarness.loadJsonAsPauseLoad (zapis do slotu + PRODUKCYJNE
 * loadGameFromSlot(slot, true): decyzja i odbudowa mapy z mapSnapshot jak w menu pauzy; r4) ; --restore plain = __detHarness.restoreJson
 * (BEZ mapy -- odwzorowuje stan sprzed naprawy; uzywane jako mutacja czerwona: test MUSI wtedy zglosic roznice).
 *
 * Uzycie (z gra/, dist poza repo; PW_PATH = katalog playwright):
 *   A (ciagla gra, zapisuje migawki + kanoniczne zrzuty K tur po kazdej):
 *     node tools/save-load-continuity-live.cjs --mode A --dist <abs> --cfg max --seed 4242 --saves 3 --k 6 --state <abs.json> --out <abs.json>
 *   B (swieza gra + wczytanie migawki z --state dla JEDNEGO punktu zapisu, K tur, porownanie z A):
 *     node tools/save-load-continuity-live.cjs --mode B --dist <abs> --cfg max --seed 4242 --saves 3 --k 6 --state <abs.json> --out <abs.json>
 *   [--restore pause|plain] [--expect equal|diff]   (--expect diff = tryb mutacji: PASS tylko gdy znaleziono rozjazd)
 *   Tryby A i B sa osobnymi wywolaniami (jedna sesja Chromium na wywolanie; limit czasu narzedzi ~10 min).
 * Konfiguracje (--cfg): max (maksimum ustawien: Trudny, dyplomacja trudna, Wysoki x4, kultura trudny/AI trudny), default
 * (kultura domyslna), aionly (tylko kultura AI trudny), bunt (max + bunt stolicy AI w 1. turze po zapisie, jak savedigest-run).
 * Kod wyjscia: 0 = zgodnie z --expect; 1 = niezgodnie; 2 = blad infrastruktury.
 */
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.'));
const CFG = arg('cfg', 'max');
const SEED = Number(arg('seed', '4242'));
const SAVES = arg('saves', '3').split(',').map(Number).filter((n) => n > 0);
const K = Number(arg('k', '6'));
const RESTORE = arg('restore', 'pause');
const EXPECT = arg('expect', 'equal');
const OUT = path.resolve(arg('out', path.join(DIST, 'continuity.json')));
const MODE = arg('mode', 'A');
const STATE = path.resolve(arg('state', path.join(DIST, 'continuity-state.json')));
const PW = process.env.PW_PATH || path.resolve(__dirname, '..', 'node_modules', 'playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const BUNT = CFG === 'bunt';
const PAUSE_SLOT = 'civtest-savefix-pause-load'; // slot, przez ktory produkcyjne loadGameFromSlot(slot, true) czyta zapis
const LEGACY = arg('legacy', '0') === '1'; // zapis legacy: migawka BEZ mapSnapshot (zgodnosc wsteczna)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), CFG, SEED, ...a);
const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');

const MAX_ADV = {
  barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  wzrostSurowcowZEpoka: true,
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
  cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  kulturaReligiaLevelAI: 'trudny',
};
// MAKSIMUM kreatora (r3): rivals = MAX_MIAST_PANSTWA = 9 (newGameMapDefaults.ts:528);
// civTypesCount = maksimum dla epoki startu Brąz = 14 (civs.json: 14 cywilizacji z epokaWejscia <= braz;
// newGameFlow.ts:2236 clampuje do epochCivMax). Wartość 15 była zawyżona (dotyczy dopiero Żelaza).
const MAX_RIVALS = 9;
const MAX_CIV_TYPES_BRAZ = 14;
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: String(arg('rivals', String(MAX_RIVALS))), speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: MAX_CIV_TYPES_BRAZ, cityStatesCount: Number(arg('rivals', String(MAX_RIVALS))),
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: MAX_ADV,
  villageRewardsEnabled: true,
};
function cfgParams() {
  const p = JSON.parse(JSON.stringify(MAX_PARAMS));
  if (CFG === 'default') { delete p.advanced.kulturaReligiaLevel; delete p.advanced.kulturaReligiaLevelAI; }
  if (CFG === 'aionly') { delete p.advanced.kulturaReligiaLevel; }
  return p;
}

// --- normalizacja i porownanie ---------------------------------------------------------------------------------
const VOLATILE = new Set(['stackGroupId']);
function isDefault(v) {
  if (v === undefined || v === null || v === false || v === 0 || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v).length === 0;
  return false;
}
function canon(v) {
  if (Array.isArray(v)) return v.map(canon);
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v).sort()) {
      if (VOLATILE.has(k)) continue;
      const c = canon(v[k]);
      if (!isDefault(c)) o[k] = c;
    }
    return o;
  }
  return v;
}
/** Pierwsze roznice (sciezka, A, B) po dopasowaniu units/cities po id. */
function firstDiffs(a, b, max) {
  const out = [];
  const walk = (x, y, p) => {
    if (out.length >= max) return;
    if (JSON.stringify(x) === JSON.stringify(y)) return;
    const tx = Array.isArray(x) ? 'a' : typeof x; const ty = Array.isArray(y) ? 'a' : typeof y;
    if (x && y && tx === ty && (tx === 'object' || tx === 'a')) {
      const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
      for (const k of keys) walk(x[k], y[k], p + '.' + k);
      return;
    }
    out.push({ path: p, A: x === undefined ? '(brak)' : JSON.stringify(x).slice(0, 120), B: y === undefined ? '(brak)' : JSON.stringify(y).slice(0, 120) });
  };
  for (const name of ['units', 'cities']) {
    const mA = new Map(); const mB = new Map();
    (a[name] || []).forEach((e, i) => mA.set(e && e.id !== undefined ? String(e.id) : 'idx' + i, e));
    (b[name] || []).forEach((e, i) => mB.set(e && e.id !== undefined ? String(e.id) : 'idx' + i, e));
    for (const k of new Set([...mA.keys(), ...mB.keys()])) walk(mA.get(k), mB.get(k), name + '[' + k + ']');
  }
  return out;
}
const canonFull = (fullJson) => {
  const o = JSON.parse(fullJson);
  return { units: canon(o.units || []), cities: canon(o.cities || []) };
};

// --- sesja przegladarki ----------------------------------------------------------------------------------------
async function openSession(chromium, res) {
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
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
    const ov = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity()))) throw new Error('foundFirstCity=false');
  await wait(300);
  try { await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest()); } catch (_) { /* opcjonalne */ }
  await wait(300);
  const turnNow = () => page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  const endTurn = async () => {
    await closeCivWelcome(page);
    await prepareEndTurnGate(page).catch(() => null);
    const before = await turnNow();
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    const t1 = Date.now();
    for (;;) {
      const s = await page.evaluate(() => ({ ip: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
      if (!s.ip && s.turn > before) return s.turn;
      if (Date.now() - t1 > 400000) throw new Error('endTurn timeout at turn ' + before);
      await wait(300);
    }
  };
  const forceBunt = () => page.evaluate(() => {
    for (let o = 1; o <= 8; o++) {
      const c = window.__cityCessionTestDebug.capitalOf(o);
      if (c) { window.__rebelNotifyTestDebug.forceRevoltEligible(c); return { owner: o, capId: c }; }
    }
    throw new Error('brak stolicy AI');
  });
  const full = () => page.evaluate(() => window.__detHarness.full());
  return { browser, page, turnNow, endTurn, forceBunt, full };
}

async function main() {
  const { chromium } = require(PW);
  const res = { dist: DIST, cfg: CFG, seed: SEED, saves: SAVES, k: K, restore: RESTORE, expect: EXPECT, mode: MODE, pageErrors: [], segments: [],
    cfgUsed: CFG === 'default' ? null : { barbariansLevel: MAX_ADV.barbariansLevel, difficulty: MAX_PARAMS.difficulty, rivals: MAX_PARAMS.rivals, civTypesCount: MAX_PARAMS.civTypesCount } };
  const flush = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  if (MODE === 'A') {
    // --- sesja A: ciagla gra; migawki w punktach zapisu, zrzuty K tur po kazdej migawce -> plik stanu (--state) ---
    const refs = []; // { save, snap, dumps: [canon per tura 1..K], turns: [] }
    const A = await openSession(chromium, res);
    try {
      for (const sv of SAVES) {
        while ((await A.turnNow()) < sv) await A.endTurn();
        const snap = await A.page.evaluate(() => window.__detHarness.snapshotJson());
        const ref = { save: sv, snap, dumps: [], turns: [], bunt: null, snapBytes: snap.length };
        for (let i = 0; i < K; i++) {
          if (BUNT && i === 0) ref.bunt = await A.forceBunt();
          const t = await A.endTurn();
          ref.turns.push(t); ref.dumps.push(canonFull(await A.full()));
          fs.writeFileSync(STATE, JSON.stringify({ cfg: CFG, seed: SEED, k: K, refs: refs.concat([ref]) }));
        }
        refs.push(ref);
        log('A zapis po t' + sv + ' snapBytes=' + snap.length + ' zrzuty t' + ref.turns.join(','));
      }
    } finally { await A.browser.close(); }
    fs.writeFileSync(STATE, JSON.stringify({ cfg: CFG, seed: SEED, k: K, refs }));
    res.done = true; flush();
    return;
  }
  // --- sesja B: swieza gra + wczytanie migawki; K tur; porownanie per tura z zapisanym przebiegiem A ---
  const st = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const ref = st.refs.find((r) => r.save === SAVES[0]);
  if (!ref) throw new Error('brak punktu zapisu t' + SAVES[0] + ' w ' + STATE);
  const kUse = Math.min(K, ref.dumps.length);
  let anyDiff = false;
  const B = await openSession(chromium, res);
  const seg = { save: ref.save, restore: RESTORE, rebuild: null, turns: [], legacy: LEGACY };
  if (LEGACY) {
    // Zgodnosc wsteczna: zapis bez mapSnapshot musi sie wczytac bez bledu, nie odbudowywac mapy i dac grywalny stan (rownosci z A NIE oczekujemy).
    try {
      const o = JSON.parse(ref.snap); delete o.mapSnapshot;
      const rp = await B.page.evaluate((a) => window.__detHarness.loadJsonAsPauseLoad(a.s, a.slot), { s: JSON.stringify(o), slot: PAUSE_SLOT });
      seg.rebuild = rp.rebuildByMode; seg.mapDiffers = rp.mapDiffers;
      await wait(300);
      const t = await B.endTurn();
      seg.legacyTurn = t; seg.legacyOk = seg.rebuild === false && t === ref.turns[0];
    } finally { await B.browser.close(); }
    res.segments.push(seg);
    res.verdict = seg.legacyOk && res.pageErrors.length === 0 ? 'PASS' : 'FAIL';
    res.done = true; flush();
    log('LEGACY rebuild=' + seg.rebuild + ' turn=' + seg.legacyTurn + ' pageErrors=' + res.pageErrors.length + ' VERDICT ' + res.verdict);
    process.exitCode = res.verdict === 'PASS' ? 0 : 1;
    return;
  }
  try {
    if (RESTORE === 'plain') {
      await B.page.evaluate((s) => window.__detHarness.restoreJson(s), ref.snap);
    } else {
      const rp = await B.page.evaluate((a) => window.__detHarness.loadJsonAsPauseLoad(a.s, a.slot), { s: ref.snap, slot: PAUSE_SLOT });
      seg.rebuild = rp.rebuildByMode; seg.mapDiffers = rp.mapDiffers;
    }
    await wait(300);
    for (let i = 0; i < kUse; i++) {
      if (BUNT && i === 0) await B.forceBunt();
      const t = await B.endTurn();
      const cb = canonFull(await B.full());
      const diffs = firstDiffs(ref.dumps[i], cb, 6);
      const equal = diffs.length === 0 && t === ref.turns[i];
      seg.turns.push({ turn: t, expectedTurn: ref.turns[i], equal, diffs });
      if (!equal) anyDiff = true;
      flush();
    }
  } finally { await B.browser.close(); }
  res.segments.push(seg);
  log('B zapis t' + ref.save + ' rebuild=' + seg.rebuild + ' tury: ' + seg.turns.map((x) => (x.equal ? 'OK' : 'ROZJAZD')).join(' '));
  res.anyDiff = anyDiff;
  res.verdict = (EXPECT === 'equal' ? !anyDiff : anyDiff) ? 'PASS' : 'FAIL';
  res.done = true;
  flush();
  log('VERDICT ' + res.verdict + ' (expect=' + EXPECT + ', anyDiff=' + anyDiff + ', pageErrors=' + res.pageErrors.length + ')');
  process.exitCode = res.verdict === 'PASS' ? 0 : 1;
}

main().catch((e) => { console.error('FATAL', String(e).slice(0, 500)); process.exitCode = 2; });
