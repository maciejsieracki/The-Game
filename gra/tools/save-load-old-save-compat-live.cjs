'use strict';
/**
 * save-load-old-save-compat-live.cjs -- R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1 (r2).
 *
 * Narzedzie zywe (Chromium, Playwright) sprawdzajace zgodnosc wsteczna STAREGO zapisu
 * (sprzed FAL 760-762: pola meta nnsAiOverrides, orderMultByCity, orderGrowthMultByCity,
 * orderValueByCity, playerEverOwnedCityByOwner oraz top-level resourceLedgerHistory).
 *
 * Faza "old" (--phase old --old-dist <katalog> --save-out <plik>):
 *   bundle z commita SPRZED FAL 760-762 (np. f6b09c76b, zbudowany POZA repo). Nowa gra
 *   (__nnsMeasureDebug.startGame), zalozenie stolicy, N tur (bramka NNS gracza obchodzona
 *   DODATNIMI dosypkami jak w ai-economy-measure-run.cjs), zapis przez ta sama funkcje co
 *   "Zapisz gre" (__truceTestDebug.quickSave -> IndexedDB 'thegame-saves'/'kv'/'thegame.save.<slot>').
 *   Obok zapisu powstaje <save-out>.metrics.json: metryki ekonomii gracza w chwili zapisu.
 *   --strip-from-current: zamiast bundla starego commita uzyj bundla biezacego i USUN z JSON
 *   pola z FAL 760-762 (SYMULACJA, jawnie oznaczona w wyniku).
 *
 * Faza "new" (--phase new --new-dist <katalog> --save-in <plik>):
 *   bieżacy kod. Wklada zapis do IndexedDB tego samego origin, wczytuje go funkcja
 *   "Wczytaj gre" (__truceTestDebug.loadSlot -> loadGameFromSlot). Asercje:
 *     A1 brak pageerror i bledow konsoli,
 *     A2 liczba miast/jednostek po wczytaniu = zapisowi,
 *     A2e ekonomia gracza po wczytaniu (skarbiec, spichlerz, miasta, rekruci, obywatele)
 *        = metryki zapisane w chwili zapisu (brak dryfu ekonomii),
 *     A3 isAwaitingFirstPlayerCity()=false gdy gracz ma miasta,
 *     A4 „Zakoncz ture" dziala 3 razy (tura rosnie o 1 na kazde klikniecie).
 *   A0 zapis wejsciowy jest stary (brak 5 pol meta FAL 760-761); A5 dziennik „Skad zapasy" po
 *   wczytaniu = wpisy zapisu (hak __ledgerRealPathDebug, realna sciezka). Scenariusz 0 miast
 *   (gracz mial miasta, po usunieciu ich z zapisu, bez flagi) robi osobny skrypt JSON
 *   evidence/make-nocity-save.cjs (SYMULACJA); ta sama faza new mierzy wtedy A4 („Zakoncz ture").
 *   NIE ZMIERZONO: sciezka klikniecia w menu DOM (wczytanie idzie tym samym loadGameFromSlot, hak
 *   loadSlot to ta sama funkcja); niepuste mapy zamowien (w zapisie puste); mutacja Array.isArray
 *   (osobny przebieg na kopii bundla: evidence/mutant-run.sh).
 *
 * Uzycie (z gra/):
 *   node tools/save-load-old-save-compat-live.cjs --phase old --old-dist <dir> --save-out <f> [--turns 6] [--strip-from-current]
 *   node tools/save-load-old-save-compat-live.cjs --phase new --new-dist <dir> --save-in <f>
 * Wynik: linie PASS/FAIL/NIE_ZMIERZONO; kod wyjscia 1 przy jakimkolwiek FAIL.
 */
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { chromium } = require(path.resolve(__dirname, '..', 'node_modules', 'playwright'));

const args = process.argv.slice(2);
const argOf = (k, d) => { const i = args.indexOf(k); return i >= 0 && args[i + 1] ? args[i + 1] : d; };
const hasFlag = (k) => args.indexOf(k) >= 0;
const PHASE = argOf('--phase', '');
const DIST = argOf(PHASE === 'old' ? '--old-dist' : '--new-dist', '');
const SAVE_FILE = argOf(PHASE === 'old' ? '--save-out' : '--save-in', '');
const TURNS = parseInt(argOf('--turns', '6'), 10);
const SEED = parseInt(argOf('--seed', '4242'), 10);
const PORT = parseInt(argOf('--port', PHASE === 'old' ? '8771' : '8772'), 10);
const STRIP = hasFlag('--strip-from-current');
const GOLD = 200;
const FOOD = 200;
const SLOT = 'compat-test';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';
const OUT_JSON = path.resolve(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs',
  'R-WEB-SAVE-LOAD-OLD-SAVE-COMPAT-Q1', 'evidence', `${PHASE}-result.json`);

/** Pola zapisu dodane przez FALE 760-762 (meta.* oraz top-level). */
const META_FIELDS_760_761 = ['nnsAiOverrides', 'orderMultByCity', 'orderGrowthMultByCity', 'orderValueByCity', 'playerEverOwnedCityByOwner'];
const TOP_FIELDS_762 = ['resourceLedgerHistory'];

let fails = 0;
const results = [];
const check = (ok, label, extra) => {
  if (!ok) fails++;
  console.log((ok ? 'PASS' : 'FAIL') + ' ' + label + (extra !== undefined ? ' :: ' + JSON.stringify(extra) : ''));
  results.push({ status: ok ? 'PASS' : 'FAIL', label, extra: extra === undefined ? null : extra });
};
const nzm = (label, why) => {
  console.log('NIE_ZMIERZONO ' + label + ' :: ' + why);
  results.push({ status: 'NIE_ZMIERZONO', label, extra: why });
};
const info = (label, obj) => { console.log('INFO ' + label + ' ' + JSON.stringify(obj)); };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- kopie helperow modalnych z ai-economy-measure-run.cjs (ta sama logika zamykania) ---- */
function closeModalsInPage() {
  const closed = [];
  const aud = document.querySelector('.civ-diplo-aud');
  if (aud && aud.style.display !== 'none') { const b = aud.querySelector('.civ-diplo-aud-back'); if (b) { b.click(); closed.push('diploAudienceClosed'); } }
  if (document.getElementById('civ-amp-title')) { const b = document.querySelector('.civ-amp-btn-sep'); if (b) { b.click(); closed.push('armyMergeClosed'); } }
  const tn = document.getElementById('civ-tech-discovery-notice-host');
  if (tn) { const b = tn.querySelector('[data-act="close"]'); if (b) { b.click(); closed.push('techNoticeClosed'); } }
  return closed;
}
function openModalKeysInPage() {
  const open = [];
  const aud = document.querySelector('.civ-diplo-aud');
  if (aud && aud.style.display !== 'none') open.push('diploAudienceClosed');
  if (document.getElementById('civ-amp-title')) open.push('armyMergeClosed');
  if (document.getElementById('civ-tech-discovery-notice-host')) open.push('techNoticeClosed');
  return open;
}
async function closeEndTurnModals(page, ctr) {
  for (let k = 0; k < 20; k++) {
    const clicked = await page.evaluate(closeModalsInPage);
    if (clicked.length === 0) return;
    await wait(300);
    const still = await page.evaluate(openModalKeysInPage);
    for (const key of clicked) if (!still.includes(key)) ctr[key] = (ctr[key] || 0) + 1;
  }
}
async function clearBattles(page) {
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    await wait(act === 'wait' ? 300 : 150);
  }
}

async function launch() {
  try { return await chromium.launch({ headless: true, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] }); } catch {
    return chromium.launch({ headless: true, executablePath: FALLBACK_CHROME, args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  }
}
function startServer(dir) {
  return spawn('python3', ['-m', 'http.server', String(PORT), '--directory', dir, '--bind', '127.0.0.1'], { stdio: 'ignore' });
}

/** Stan tury + zamkniecie tury jak gracz: bramka NNS (dosypki), modale, bitwy, endTurn, czekanie na nowa ture. */
async function turnOf(page) { return page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn); }
async function playTurn(page, ctr) {
  const before = await turnOf(page);
  const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
  let bypass = false;
  if (blocked) {
    await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [GOLD]);
    await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [FOOD]);
    bypass = true;
    if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) return { stop: 'gate-blocked-after-bypass', tura: before };
  }
  await closeEndTurnModals(page, ctr);
  await clearBattles(page);
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
    return { stop: 'cannot-end', tura: before, battle: await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState()) };
  }
  await closeEndTurnModals(page, ctr);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  const deadline = Date.now() + 300000;
  while (Date.now() < deadline) {
    await wait(250);
    const adv = await page.evaluate((t) => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
    if (adv) return { turn: await turnOf(page), bypass };
    await closeEndTurnModals(page, ctr);
  }
  return { stop: 'endturn-timeout', tura: before };
}

/** Metryki ekonomii gracza (owner = ME) z hooka __aiEconomyMeasure. */
async function playerEconomy(page) {
  return page.evaluate(() => {
    const me = window.__aiTradeWiringTestDebug.info().me;
    const m = window.__aiEconomyMeasure.metrics();
    const o = m.owners.find((x) => x.owner === me) || null;
    if (!o) return null;
    return { owner: me, skarbiec: o.skarbiec, spichlerz: o.spichlerz, miasta: o.miasta, obywatele: o.obywatele,
      rekruci: o.rekruci, jednostkiWojskowe: o.jednostkiWojskowe, jednostkiCywilne: o.jednostkiCywilne,
      utrzymanieBudynkowPieniadz: o.utrzymanieBudynkowPieniadz, utrzymanieGarnizonuPieniadz: o.utrzymanieGarnizonuPieniadz,
      turn: window.__aiTradeWiringTestDebug.state().turn };
  });
}

async function idbReadSlot(page, slot) {
  return page.evaluate(async (key) => new Promise((resolve, reject) => {
    const req = indexedDB.open('thegame-saves', 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readonly');
      const g = tx.objectStore('kv').get(key);
      g.onsuccess = () => { db.close(); resolve(typeof g.result === 'string' ? g.result : null); };
      g.onerror = () => reject(g.error);
    };
  }), 'thegame.save.' + slot);
}
async function idbWriteSlot(page, slot, text) {
  await page.evaluate(async ([key, val]) => new Promise((resolve, reject) => {
    const req = indexedDB.open('thegame-saves', 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains('kv')) req.result.createObjectStore('kv'); };
    req.onerror = () => reject(req.error);
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction('kv', 'readwrite');
      tx.objectStore('kv').put(val, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => reject(tx.error);
    };
  }), ['thegame.save.' + slot, text]);
}

const GAME_URL = (port) => `http://127.0.0.1:${port}/index.html?civTest=1&civSeed=${SEED}`;
const HOOKS_OK = () => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__nnsMeasureDebug && !!window.__truceTestDebug && !!window.__truceSaveLoadTestDebug;

async function phaseOld() {
  if (!DIST || !SAVE_FILE) throw new Error('faza old: wymagane --old-dist i --save-out');
  const srv = startServer(DIST);
  const browser = await launch();
  let saveText = null;
  let metricsAtSave = null;
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 160)));
    await page.goto(GAME_URL(PORT), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(HOOKS_OK, undefined, { timeout: 180000 });
    await page.evaluate(([s]) => window.__nnsMeasureDebug.startGame({ seed: s }), [SEED]);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch { return false; } }, undefined, { timeout: 180000 });
    await page.waitForFunction(() => {
      const ov = Array.from(document.querySelectorAll('*')).some((el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
      return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
    }, undefined, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    check(founded === true, 'OLD zaklada stolice gracza', founded);
    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    const ctr = {};
    let turn = await turnOf(page);
    info('OLD start', { turn, eco: await playerEconomy(page) });
    for (let i = 0; i < TURNS; i++) {
      const r = await playTurn(page, ctr);
      if (r.stop) { check(false, 'OLD tura ' + (i + 1) + ' zatrzymana: ' + r.stop, r); break; }
      turn = r.turn;
      info('OLD tura ' + turn, { bypass: r.bypass, eco: await playerEconomy(page) });
    }
    const q = await page.evaluate((s) => window.__truceSaveLoadTestDebug.quickSave(s), SLOT);
    check(q === true, 'OLD zapis gry (quickSave -> IndexedDB) powiodl sie', q);
    saveText = await idbReadSlot(page, SLOT);
    check(saveText !== null, 'OLD zapis odczytany z IndexedDB', saveText ? saveText.length : null);
    metricsAtSave = await playerEconomy(page);
    info('OLD eko w chwili zapisu', metricsAtSave);
    check(errs.length === 0, 'OLD brak pageerror', errs.slice(0, 3));
    await ctx.close();
  } finally {
    await browser.close().catch(() => {});
    srv.kill('SIGKILL');
  }
  if (!saveText) return;
  const obj = JSON.parse(saveText);
  const removed = { meta: [], top: [] };
  if (STRIP) {
    for (const f of META_FIELDS_760_761) if (obj.meta && f in obj.meta) { delete obj.meta[f]; removed.meta.push(f); }
    for (const f of TOP_FIELDS_762) if (f in obj) { delete obj[f]; removed.top.push(f); }
    info('OLD SYMULACJA usunieto pola (zapis z biezacego kodu, NIE prawdziwy stary commit)', removed);
  }
  fs.mkdirSync(path.dirname(SAVE_FILE), { recursive: true });
  fs.writeFileSync(SAVE_FILE, JSON.stringify(obj));
  fs.writeFileSync(SAVE_FILE + '.metrics.json', JSON.stringify(metricsAtSave));
  check(true, 'OLD zapis zapisany do pliku', { strip: STRIP, removed, bytes: fs.statSync(SAVE_FILE).size, turn: obj.tura ?? obj.turn ?? null });
}

async function phaseNew() {
  if (!DIST || !SAVE_FILE) throw new Error('faza new: wymagane --new-dist i --save-in');
  const saveText = fs.readFileSync(SAVE_FILE, 'utf8');
  const saveObj = JSON.parse(saveText);
  const metricsPath = SAVE_FILE + '.metrics.json';
  const eco0 = fs.existsSync(metricsPath) ? JSON.parse(fs.readFileSync(metricsPath, 'utf8')) : null;
  const expectCities = saveObj.cities ? saveObj.cities.length : null;
  const expectUnits = saveObj.units ? saveObj.units.length : null;
  // A0: wejsciowy zapis MUSI byc stary (bez pol FAL 760-761). Bez tej asercji test mogl by przejsc na nowym zapisie.
  const META_PRESENT = META_FIELDS_760_761.filter((f) => saveObj.meta && f in saveObj.meta);
  check(META_PRESENT.length === 0, 'NEW zapis wejsciowy jest STARY: brak 5 pol meta FAL 760-761', { obecne: META_PRESENT, resourceLedgerHistoryWZapisie: Array.isArray(saveObj.resourceLedgerHistory) ? saveObj.resourceLedgerHistory.length : null });
  // Mapy zamowien puste w tym zapisie: dryf przy niepustych mapach jest poza zakresem tego przebiegu.
  const EMPTY_MAPS = ['orderMultByCity', 'orderGrowthMultByCity', 'orderValueByCity'].filter((k) => !saveObj.meta || JSON.stringify(saveObj.meta[k] ?? null).length <= 4);
  // Dziennik „Skad zapasy" w zapisie (liczba wpisow tury); po wczytaniu porownywany z odczytem hakiem realnej sciezki.
  const savedLedgerN = Array.isArray(saveObj.resourceLedgerHistory) ? saveObj.resourceLedgerHistory.length : null;
  const srv = startServer(DIST);
  const browser = await launch();
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('PAGEERR ' + String(e).slice(0, 160)));
    page.on('console', (m) => { if (m.type() === 'error' && !/\/favicon\.ico$/.test(((m.location() || {}).url || ''))) errs.push('CONSOLE ' + m.text().slice(0, 160) + ' @' + ((m.location() || {}).url || '').slice(0, 160)); });
    page.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url().slice(0, 200)); });
    await page.goto(GAME_URL(PORT), { waitUntil: 'load', timeout: 180000 });
    await page.waitForFunction(HOOKS_OK, undefined, { timeout: 180000 });
    await wait(800);
    await idbWriteSlot(page, SLOT, saveText);
    await page.evaluate((s) => window.__truceSaveLoadTestDebug.loadSlot(s), SLOT);
    await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1 && window.__aiTradeWiringTestDebug.info().myCities >= 0; } catch { return false; } }, undefined, { timeout: 300000 });
    await wait(1500);
    const st = await page.evaluate(() => {
      const s = window.__aiTradeWiringTestDebug.state();
      const inf = window.__aiTradeWiringTestDebug.info();
      return { turn: s.turn, myCities: inf.myCities, awaiting: window.__nnsMeasureDebug.awaitingFirstCity() };
    });
    const eco1 = await playerEconomy(page);
    const world = await page.evaluate(() => { const d = window.__cityStateStartUnitsTestDebug.dumpState(); return { cities: d.cities.length, units: d.units.length }; });
    info('NEW po wczytaniu', { st, eco: eco1, swiat: world, zapis: { expectCities, expectUnits }, eco0 });
    // A5: dziennik „Skad zapasy" po wczytaniu = liczba wpisow w zapisie (defekt #432: 5 -> 0). Hak realnej sciezki.
    const ledgerLoaded = await page.evaluate(() => window.__ledgerRealPathDebug.savedHistory().length);
    const ledgerMem = await page.evaluate(() => window.__ledgerRealPathDebug.historyForSave().length);
    const ledgerCap = await page.evaluate(() => window.__ledgerRealPathDebug.historyN());
    info('NEW dziennik „Skad zapasy" po wczytaniu', { wZapisie: savedLedgerN, poWczytaniuPole: ledgerLoaded, pamiecWszyscy: ledgerMem, limit: ledgerCap });
    if (savedLedgerN !== null) check(ledgerLoaded === savedLedgerN, 'NEW dziennik „Skad zapasy" po wczytaniu = wpisy zapisu', { got: ledgerLoaded, want: savedLedgerN });
    else nzm('NEW dziennik „Skad zapasy" po wczytaniu', 'zapis nie zawiera resourceLedgerHistory');
    check(expectCities === null || world.cities === expectCities, 'NEW liczba miast (wszyscy wlasciciele) po wczytaniu = zapis', { got: world.cities, want: expectCities });
    check(expectUnits === null || world.units === expectUnits, 'NEW liczba jednostek (wszyscy wlasciciele) po wczytaniu = zapis', { got: world.units, want: expectUnits });
    if (eco0) check(eco1.miasta === eco0.miasta, 'NEW miasta gracza = metryki zapisu', { got: eco1.miasta, want: eco0.miasta });
    if (eco0) {
      const keys = ['skarbiec', 'spichlerz', 'miasta', 'obywatele', 'rekruci', 'jednostkiWojskowe', 'jednostkiCywilne', 'utrzymanieBudynkowPieniadz', 'utrzymanieGarnizonuPieniadz'];
      const diff = keys.filter((k) => eco0[k] !== eco1[k]).map((k) => ({ k, zapis: eco0[k], wczytane: eco1[k] }));
      check(diff.length === 0, 'NEW ekonomia gracza po wczytaniu = metryki w chwili zapisu (skarbiec, spichlerz, miasta, ludnosc, wojsko)', diff);
    } else {
      nzm('NEW ekonomia po wczytaniu = zapis', 'brak pliku metryk zapisu (' + metricsPath + ')');
    }
    if (st.myCities > 0) check(st.awaiting === false, 'NEW isAwaitingFirstPlayerCity()=false przy miastach gracza', st.awaiting);
    else info('NEW 0 miast gracza: isAwaitingFirstPlayerCity() (obserwacja, kryterium = A4 „Zakoncz ture")', { awaiting: st.awaiting, myCities: st.myCities });
    if (EMPTY_MAPS.length) nzm('NEW dryf ekonomii przy niepustych mapach zamowien', 'w tym zapisie puste: ' + EMPTY_MAPS.join(', ') + ' (niepuste mapy NIE ZMIERZONE)');
    const ctr = {};
    const turns = [st.turn];
    for (let i = 0; i < 3; i++) {
      const r = await playTurn(page, ctr);
      if (r.stop) { check(false, 'NEW tura ' + (i + 1) + ' zatrzymana: ' + r.stop, r); turns.push(null); break; }
      turns.push(r.turn);
      info('NEW tura ' + r.turn, { bypass: r.bypass, eco: await playerEconomy(page), errs: errs.length });
    }
    const ok3 = turns.length === 4 && turns.every((t, i) => i === 0 || (t !== null && t === turns[i - 1] + 1));
    check(ok3, 'NEW „Zakoncz ture" dziala 3 razy (tura rosnie o 1)', turns);
    const ledgerAfter = await page.evaluate(() => window.__ledgerRealPathDebug.savedHistory().length);
    if (savedLedgerN !== null) check(ledgerAfter > ledgerLoaded || ledgerLoaded >= ledgerCap, 'NEW dziennik „Skad zapasy" rosnie po tickach (lub limit)', { przed: ledgerLoaded, po: ledgerAfter, limit: ledgerCap });
    info(st.myCities === 0 ? 'NEW scenariusz 0 miast (zapis z usunietymi miastami gracza): wynik tur' : 'NEW wynik tur (gracz ma miasta; scenariusz 0 miast: evidence/make-nocity-save.cjs)', { turns, myCities: st.myCities });
    check(errs.length === 0, 'NEW brak pageerror i bledow konsoli', errs.slice(0, 5));
    await ctx.close();
  } finally {
    await browser.close().catch(() => {});
    srv.kill('SIGKILL');
  }
}

(async () => {
  if (PHASE === 'old') await phaseOld();
  else if (PHASE === 'new') await phaseNew();
  else { console.error('uzycie: --phase old|new'); process.exit(2); }
  try {
    fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
    fs.writeFileSync(OUT_JSON, JSON.stringify({ phase: PHASE, strip: STRIP, seed: SEED, results }, null, 2));
  } catch (e) { console.error('zapis wyniku nieudany: ' + e.message); }
  console.log(fails === 0 ? 'WYNIK: brak FAIL' : 'WYNIK: FAIL=' + fails);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error('BLAD: ' + (e && e.stack || e)); process.exit(1); });
