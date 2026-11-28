'use strict';
/**
 * save-load-continuity-ui-live.cjs -- R-WEB-SAVE-LOAD-MATRIX-Q1 (SAVEMAT r2), punkt 2 dispatchu: wczytanie KLIKIEM.
 *
 * Jedna sesja Chromium, jedna gra (ta sama co runner A, cfg max, ziarno z --seed):
 *   1. gra do tury --save (domyslnie 3) przez hak tury (__eraTestDebug.endTurn -- to tylko przesuwa ture, NIE wczytuje),
 *   2. ZAPIS KLIKIEM: Escape -> menu pauzy -> „Zapisz grę” -> dialog zapisu -> „Zapisz” (produkcyjny persistSaveToSlot),
 *   3. jeszcze --dirty tur do przodu (zeby wczytanie cofnelo stan, a nie tylko go potwierdzilo),
 *   4. WCZYTANIE KLIKIEM w tej samej grze: Escape -> „Wczytaj grę” -> wiersz zapisu -> „Wczytaj” (produkcyjne loadGameFromSlot),
 *   5. K tur po wczytaniu; kazdy zrzut (canon, jak w runnerze) porownany z zrzutami przebiegu A z pliku --state (refs[save].dumps).
 *
 * Uzycie (z gra/; dist poza repo):
 *   node tools/save-load-continuity-ui-live.cjs --dist <abs> --seed 4242 --save 3 --dirty 3 --k 6 --state <abs STATE-A.json> --out <abs.json>
 * Kod wyjscia: 0 = B==A we wszystkich turach i brak bledow strony; 1 = rozjazd lub blad strony; 2 = blad infrastruktury / kliku.
 * Wynik zawiera klikniete selektory i ewentualny zrzut PNG (--shot <abs.png>) po wczytaniu.
 */
const fs = require('fs');
const path = require('path');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : d; };
const DIST = path.resolve(arg('dist', '.'));
const SEED = Number(arg('seed', '4242'));
const SAVE = Number(arg('save', '3'));
const DIRTY = Number(arg('dirty', '3'));
const K = Number(arg('k', '6'));
const STATE = path.resolve(arg('state', ''));
const OUT = path.resolve(arg('out', path.join(DIST, 'ui-continuity.json')));
const SHOT = arg('shot', '');
const PW = process.env.PW_PATH || path.resolve(__dirname, '..', 'node_modules', 'playwright');
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), 'ui', SEED, ...a);
const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');

// Ta sama konfiguracja „maksimum” co w save-load-continuity-live.cjs (cfg max).
const MAX_ADV = {
  barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  wzrostSurowcowZEpoka: true,
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
  cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  kulturaReligiaLevelAI: 'trudny',
};
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brazu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: String(arg('rivals', '9')), speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty',
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: Number(arg('civtypes', '14')), cityStatesCount: Number(arg('rivals', '9')),
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: MAX_ADV,
  villageRewardsEnabled: true,
};

// --- porownanie (kopia logiki z save-load-continuity-live.cjs) -------------------------------------------------
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
const canonFull = (fullJson) => {
  const o = JSON.parse(fullJson);
  return { units: canon(o.units || []), cities: canon(o.cities || []) };
};

async function openPause(page, res) {
  await page.click('button.b-menu[data-act="menu"]', { timeout: 15000 });
  res.clicks.push('hud:button.b-menu');
  await page.waitForSelector('[data-act="save"]', { state: 'visible', timeout: 15000 });
}
async function closePause(page, res) {
  const r = await page.$('[data-act="resume"]');
  if (r) { await r.click(); res.clicks.push('pause[data-act=resume]'); }
}

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

// --- przegladarka ---------------------------------------------------------------------------------------------
async function main() {
  const { chromium } = require(PW);
  const res = { dist: DIST, seed: SEED, save: SAVE, dirty: DIRTY, k: K, mode: 'UI', pageErrors: [], consoleErrors: [], clicks: [], turns: [], cfgUsed: { barbariansLevel: MAX_ADV.barbariansLevel, difficulty: MAX_PARAMS.difficulty, rivals: MAX_PARAMS.rivals, civTypesCount: MAX_PARAMS.civTypesCount } };
  const flush = () => fs.writeFileSync(OUT, JSON.stringify(res, null, 1));
  const st = JSON.parse(fs.readFileSync(STATE, 'utf8'));
  const ref = st.refs.find((r) => r.save === SAVE);
  if (!ref) throw new Error('brak punktu zapisu t' + SAVE + ' w ' + STATE);
  const browser = await chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on('pageerror', (e) => res.pageErrors.push(String(e).slice(0, 300)));
    page.on('console', (m) => { if (m.type() === 'error') res.consoleErrors.push(m.text().slice(0, 200)); });
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
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), Object.assign({ seed: SEED }, MAX_PARAMS));
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
    const full = () => page.evaluate(() => window.__detHarness.full());

    log('start gry gotowy');
    // gra do tury zapisu (przesuniecie tury hakiem; zapis i wczytanie KLIKIEM ponizej)
    while ((await turnNow()) < SAVE) await endTurn();
    await closeCivWelcome(page);

    log('doszedl do t' + SAVE + ', zapis klikiem');
    // 2. ZAPIS KLIKIEM
    await openPause(page, res);
    await page.click('[data-act="save"]');
    res.clicks.push('pause[data-act=save]');
    await page.waitForSelector('#civ-sl-name', { state: 'visible', timeout: 15000 });
    await page.fill('#civ-sl-name', 'UI-SAVEMAT-t' + SAVE);
    res.clicks.push('saveDialog:#civ-sl-name=UI-SAVEMAT');
    const saveBtn = page.locator('.civ-sl button', { hasText: 'Zapisz' }).first();
    await saveBtn.click();
    res.clicks.push('saveDialog:Zapisz');
    await wait(4000);
    const hasDialogLeft = await page.$('#civ-sl-name');
    if (hasDialogLeft) { res.clicks.push('saveDialog:still-open-after-wait'); }
    // przesuniecie tury po zapisie (dirty)
    await closePause(page, res);
    await wait(300);
    for (let i = 0; i < DIRTY; i++) await endTurn();
    res.dirtyTurn = await turnNow();
    await closeCivWelcome(page);

    log('dirty gotowe t' + res.dirtyTurn + ', wczytanie klikiem');
    // 4. WCZYTANIE KLIKIEM
    await openPause(page, res);
    const loadEnabled = await page.$eval('[data-act="load"]', (b) => !b.disabled);
    res.loadEnabled = loadEnabled;
    await page.click('[data-act="load"]');
    res.clicks.push('pause[data-act=load]');
    await page.waitForSelector('.civ-sl-row', { state: 'visible', timeout: 20000 });
    const rowLabel = await page.$$eval('.civ-sl-row', (rs) => rs.map((r) => (r.textContent || '').trim().slice(0, 80)));
    res.loadRows = rowLabel;
    const row = page.locator('.civ-sl-row', { hasText: 'UI-SAVEMAT-t' + SAVE }).first();
    if ((await row.count()) === 0) throw new Error('brak wiersza UI-SAVEMAT w dialogu wczytania: ' + rowLabel.join(' | '));
    await row.click();
    res.clicks.push('loadDialog:row=UI-SAVEMAT');
    await page.locator('.civ-sl button', { hasText: 'Wczytaj' }).first().click();
    res.clicks.push('loadDialog:Wczytaj');
    // czekamy az wczytanie sie zakonczy: tura wraca do SAVE i brak trwajacej tury
    await page.waitForFunction((sv) => {
      try { return window.__eraTestDebug.getWorldState().turn === sv && !window.__eraTestDebug.isEndTurnInProgress(); } catch (_) { return false; }
    }, SAVE, { timeout: 300000, polling: 500 });
    await wait(1500);
    res.loadedTurn = await turnNow();
    log('wczytano, t' + res.loadedTurn);

    // 5. K tur po wczytaniu, porownanie z przebiegiem A
    let anyDiff = false;
    for (let i = 0; i < Math.min(K, ref.dumps.length); i++) {
      await closeCivWelcome(page).catch(() => {});
      const t = await endTurn();
      const cb = canonFull(await full());
      const diffs = firstDiffs(ref.dumps[i], cb, 6);
      const equal = diffs.length === 0 && t === ref.turns[i];
      if (!equal) anyDiff = true;
      res.turns.push({ turn: t, expectedTurn: ref.turns[i], equal, diffs });
      log('tura ' + t + (equal ? ' OK' : ' ROZJAZD'));
      flush();
    }
    if (SHOT) {
      await page.screenshot({ path: path.resolve(SHOT), fullPage: false });
      res.shot = path.resolve(SHOT);
    }
    res.anyDiff = anyDiff;
    res.verdict = !anyDiff && res.pageErrors.length === 0 && res.loadedTurn === SAVE ? 'PASS' : 'FAIL';
  } finally {
    await browser.close();
  }
  res.done = true;
  flush();
  log('UI wczytanie t' + SAVE + ' klikiem: tury ' + res.turns.map((x) => (x.equal ? 'OK' : 'ROZJAZD')).join(' ') + ' pageErrors=' + res.pageErrors.length + ' VERDICT ' + res.verdict);
  process.exitCode = res.verdict === 'PASS' ? 0 : 1;
}

main().catch((e) => { console.error('FATAL', String(e).slice(0, 600)); process.exitCode = 2; });
