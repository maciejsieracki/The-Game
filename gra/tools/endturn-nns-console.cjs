'use strict';
// R-WEB-ENDTURN-NNS-CONSOLE-Q1 (tag ENDNNS): konsola przycisku „Zakończ turę” w stanie blokady NNS (stan c).
// Stan c: w turze 5 fizyczny klik suwaka Skarb na 100% (panel miasta), fizyczny klik zakupu najtańszej jednostki
// wojskowej w panelu rekrutacji; po zakupie prognoza skarbca/spichlerza < 0 -> bramka NNS blokuje „Zakończ turę”.
// Pomiar: okno 30 s konsoli (bez kliknięć i BEZ haków odczytu bramki: nie wołamy __nnsMeasureDebug.gateInfo(),
// bo canPlayerInitiateEndTurn sam loguje console.warn). Odczyt: tylko DOM (aria-disabled), isEndTurnInProgress, snapshot().turn.
//
// Uruchomienie (z gra/): node tools/endturn-nns-console.cjs <katalog_poza_repo> <seed> <bundle_html> <etykieta_builda>
// Wynik: <katalog>/nns-<etykieta>-s<seed>.json (jeden obiekt) + log na stdout.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { closeCivWelcome } = require('./_live-ready.cjs');
const { TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL } = require('./measure-close-modals.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA = path.resolve(__dirname, '..');
const OUT = path.resolve(process.argv[2] || '/nonexistent-out');
const SEED = parseInt(process.argv[3] || '4242', 10);
const BUNDLE = path.resolve(process.argv[4] || '/nonexistent.html');
const LABEL = process.argv[5] || 'build';
const CLUSTER_WAIT_MS = parseInt(process.env.CLUSTER_WAIT_MS || '600000', 10);
const WINDOW_MS = parseInt(process.env.WINDOW_MS || '30000', 10);
const CLICK_TURNS = parseInt(process.env.CLICK_TURNS || '4', 10); // tury 1..4: zwykłe kliki „Zakończ turę”
const STATE_TURN = parseInt(process.env.STATE_TURN || '5', 10);  // tura, w której robimy zakup (stan c)
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const UNIT_NAMES = UNITS.map(u => u.Jednostka).filter(Boolean).sort((a, b) => b.length - a.length);

// Maksimum z kodu (newGameFlow / data/ui-params.json / map-gen defaults):
//  Rozmiar mapy = „Super Huge” (ostatnia opcja, ~80000 hex); Prędkość gry = „Długa” (4× koszt badań, najdłuższa);
//  Miasta-państwa = 9 (MAX_MIAST_PANSTWA); Liczba cywilizacji = 15 (MAX_TYPY_CYWILIZACJI_MENU; NIEJEDNOZNACZNE, patrz raport);
//  Limit miast (baza) = 20 (opcje 10/15/20); Poziom Trudny; barbarzyńcy Trudny; kultura trudny; dyplomacja trudna;
//  Wzrost ludności / Koszty jednostek Wysoki; Koszty budynków Wysoki (x4); Zasięg ruchu Długi (x6).
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: process.env.MAP_SIZE || 'Super Huge', rivals: '9', speed: 'Długa', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 9,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: {
    barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'wysoki',
    kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'dlugi', landFractionPercent: 30,
    landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 20,
    diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
  },
  villageRewardsEnabled: true,
};

async function closeModals(page) {
  await page.evaluate(({ side, main }) => {
    const aud = document.querySelector('.civ-diplo-aud');
    if (aud && aud.style.display !== 'none') { const b = aud.querySelector('.civ-diplo-aud-back'); if (b) b.click(); }
    if (document.getElementById('civ-amp-title')) { const b = document.querySelector('.civ-amp-btn-sep'); if (b) b.click(); }
    const tn = document.getElementById('civ-tech-discovery-notice-host');
    if (tn) { const b = tn.querySelector(side) || tn.querySelector(main); if (b) b.click(); }
  }, { side: TECH_SIDE_CLOSE_SEL, main: TECH_MAIN_CLOSE_SEL });
}

async function clearBattles(page) {
  for (let k = 0; k < 200; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return; }
      if (!h.closeBattleSummary()) h.flushBattles();
    });
    await new Promise(r => setTimeout(r, 150));
  }
}

async function preamble(page) {
  await closeCivWelcome(page, 3).catch(() => -1);
  await closeModals(page);
  await clearBattles(page);
  const seen = new Set();
  await rejectAwaitingAiOffers(page, seen);
  await acceptForcedPeace(page, {}, null);
}

// Tylko odczyt DOM i flag (bez gateInfo / canPlayerInitiateEndTurn).
async function sampleBtn(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[data-end]');
    if (!b) return { aria: 'NO_BUTTON', eot: null, turn: null, onButton: false, lose: false };
    const r = b.getBoundingClientRect();
    const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return {
      aria: b.getAttribute('aria-disabled'), eot: window.__nnsMeasureDebug.isEndTurnInProgress(),
      turn: window.__nnsMeasureDebug.snapshot().turn,
      onButton: !!(e && e.closest('button[data-end]')),
      lose: !!document.querySelector('.vsc-overlay.lose'),
    };
  });
}

async function endCenter(page) {
  return page.evaluate(() => {
    const b = document.querySelector('button[data-end]');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
}

// Czeka na aktywny i trafiony przycisk, potem fizycznie klika; czeka na zmianę tury (do 60 s).
async function clickEndTurn(page, turnBefore) {
  const t0 = Date.now();
  let ready = false;
  let lastS = null;
  while (Date.now() - t0 < 300000) {
    if (Math.floor((Date.now() - t0) / 5000) !== (page._lastPre ?? -1)) { page._lastPre = Math.floor((Date.now() - t0) / 5000); await preamble(page); }
    const s = await sampleBtn(page);
    lastS = s;
    if (s.lose) return { ok: false, why: 'PORAZKA_GRACZA' };
    if (s.aria === 'false' && s.eot === false && s.onButton) { ready = true; break; }
    await page.waitForTimeout(500);
  }
  if (!ready) return { ok: false, why: 'NIE_AKTYWNY_60S', lastSample: lastS, hit: await page.evaluate(() => { const b = document.querySelector('button[data-end]'); if (!b) return null; const r = b.getBoundingClientRect(); const e = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return e ? e.tagName + '#' + e.id + '.' + String(e.className).slice(0, 80) : null; }) };
  const c = await endCenter(page);
  await page.mouse.click(c.x, c.y);
  const t1 = Date.now();
  while (Date.now() - t1 < 60000) {
    const t = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
    if (t !== turnBefore) return { ok: true, turnAfter: t, sec: (Date.now() - t0) / 1000 };
    await preamble(page);
    await page.waitForTimeout(500);
  }
  return { ok: false, why: 'BRAK_ZMIANY_TURY_60S' };
}

// Zakup w stanie c: fizyczny klik suwaka Skarb (prawy kraniec) i klik najtańszej jednostki z listy wierszy rekrutacji.
async function buyInStateC(page, cityId) {
  const out = {};
  await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await page.waitForTimeout(400);
  out.tabSkarb = await page.evaluate(() => { const b = document.querySelector('#cs-icon-rail-right button[aria-label*="suwaki Skarb"]'); if (!b) return false; b.click(); return true; });
  await page.waitForTimeout(400);
  const sl = await page.evaluate(() => {
    const inp = document.querySelector('.handel-w4-sliders input[type=range]');
    if (!inp) return { ok: false, why: 'brak suwaka' };
    if (inp.disabled) return { ok: false, why: 'wylaczony' };
    inp.scrollIntoView({ block: 'center' });
    const r = inp.getBoundingClientRect();
    return { ok: true, before: inp.value, max: inp.max, x: r.right - 2, y: r.top + r.height / 2 };
  });
  if (sl.ok) {
    await page.mouse.click(sl.x, sl.y);
    await page.waitForTimeout(300);
    sl.after = await page.evaluate(() => document.querySelector('.handel-w4-sliders input[type=range]').value);
  }
  out.slider = sl;
  await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (b) b.click(); });
  await page.waitForTimeout(300);
  await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await page.waitForTimeout(400);
  out.tabRecruit = await page.evaluate(() => { const t = document.querySelector('button[aria-label="Jednostki do rekrutacji"]'); if (!t) return false; t.click(); return true; });
  await page.waitForTimeout(300);
  out.buy = await page.evaluate((names) => {
    const body = document.querySelector('.civ-v-recruit-body');
    if (!body) return { ok: false, why: 'brak karty rekrutacji' };
    const rows = [];
    for (const b of body.querySelectorAll('.unit-recruit-submit')) {
      let hit = null;
      for (let p = b.parentElement; p && p !== body.parentElement; p = p.parentElement) {
        const t = (p.innerText || '').trim();
        const nm = names.find(n => t.startsWith(n));
        if (nm) { hit = nm; break; }
      }
      rows.push({ name: hit, disabled: b.disabled });
    }
    // najtańsza dostępna jednostka = pierwszy aktywny przycisk w kolejności listy (lista posortowana wg kosztu w UI)
    const pick = rows.find(r => r.name && !r.disabled);
    if (!pick) return { ok: false, why: 'brak aktywnego przycisku', rows };
    for (const b of body.querySelectorAll('.unit-recruit-submit')) {
      let hit = null;
      for (let p = b.parentElement; p && p !== body.parentElement; p = p.parentElement) {
        const t = (p.innerText || '').trim();
        const nm = names.find(n => t.startsWith(n));
        if (nm) { hit = nm; break; }
      }
      if (hit === pick.name) { b.click(); return { ok: true, name: hit, rows }; }
    }
    return { ok: false, why: 'nie znaleziono', rows };
  }, UNIT_NAMES);
  await page.waitForTimeout(300);
  await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (b) b.click(); });
  await page.waitForTimeout(300);
  return out;
}

// Okno konsoli: tylko obserwacja (bez kliknięć i bez odczytu bramki). Zlicza wpisy wg rodzaju.
async function measureWindow(page, consoleLog, ms) {
  const start = consoleLog.length;
  const tStart = Date.now();
  const trace = [];
  let last = null;
  while (Date.now() - tStart < ms) {
    const s = await sampleBtn(page);
    const key = JSON.stringify({ aria: s.aria, eot: s.eot, onButton: s.onButton });
    if (key !== last) { trace.push({ atSec: +((Date.now() - tStart) / 1000).toFixed(1), ...s }); last = key; }
    await page.waitForTimeout(500);
  }
  const win = consoleLog.slice(start);
  const kinds = {};
  for (const e of win) {
    const k = e.type + ' | ' + e.kind;
    kinds[k] = (kinds[k] || 0) + 1;
  }
  return {
    ms, entries: win.length,
    warn: win.filter(e => e.type === 'warning').length,
    endTurnBlockedNNS: win.filter(e => /\[EndTurn\] blocked: prognoza/.test(e.text)).length,
    endTurnBlockedOther: win.filter(e => /\[EndTurn\] blocked:/.test(e.text) && !/prognoza/.test(e.text)).length,
    endTurnStartDone: win.filter(e => /triggerPlayerEndTurn: (START|DONE)/.test(e.text)).length,
    kinds, buttonTrace: trace,
  };
}

function phase(msg) {
  const line = new Date().toISOString() + ' ' + msg + '\n';
  try { fs.appendFileSync(path.join(OUT, `log-${LABEL}-s${SEED}.txt`), line); } catch (e) { /* log opcjonalny */ }
}

async function main() {
  assert.ok(process.argv[2] && !OUT.startsWith(path.resolve(GRA, '..')), 'katalog poza repo');
  fs.mkdirSync(OUT, { recursive: true });
  const RES = path.join(OUT, `nns-${LABEL}-s${SEED}.json`);
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext()).newPage();
  const consoleLog = [];
  const errors = [];
  let clusterStartSeen = 0;
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => {
    const t = m.text();
    if (/\[ClusterStart\]/.test(t)) clusterStartSeen++;
    consoleLog.push({ t: Date.now(), type: m.type(), text: t.slice(0, 200), kind: (t.match(/\[EndTurn\][^:]*|triggerPlayerEndTurn: \w+|GPU stall/) || ['other'])[0] });
  });
  const rec = { label: LABEL, seed: SEED, bundle: BUNDLE, params: MAX_PARAMS, turns: [], state: null, errors };
  try {
    await page.goto('file://' + BUNDLE + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    phase('goto ok');
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    phase('startNewGame ok');
    const t0 = Date.now();
    while (clusterStartSeen < 1 && Date.now() - t0 < CLUSTER_WAIT_MS) await new Promise(r => setTimeout(r, 250));
    phase('ClusterStart seen=' + clusterStartSeen + ' after ' + (Date.now() - t0) + ' ms');
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    phase('awaitingFirstCity ok');
    assert.ok(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()), 'foundFirstCity=true');
    await page.waitForTimeout(3000);
    await closeCivWelcome(page);
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    rec.cityCount = c0.length;
    assert.equal(c0.length, 1, 'jedno miasto gracza');
    const cityId = c0[0].id;
    rec.settingsReadback = await page.evaluate(() => window.__settingsLive.getSettings());

    for (let t = 1; t <= CLICK_TURNS; t++) {
      const before = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
      const r = await clickEndTurn(page, before);
      rec.turns.push({ turn: before, ...r });
      if (!r.ok) break;
    }
    // Stan c: zakup w turze STATE_TURN.
    const curTurn = await page.evaluate(() => window.__nnsMeasureDebug.snapshot().turn);
    phase('state turn ' + curTurn + ' turns=' + JSON.stringify(rec.turns));
    rec.stateTurn = curTurn;
    await preamble(page);
    rec.buyResult = await buyInStateC(page, cityId);
    await preamble(page);
    await page.waitForTimeout(800);
    rec.afterBuySample = await sampleBtn(page);
    consoleLog.length = 0; // okno zaczyna się od tego momentu (wpisy przed oknem odrzucone)
    rec.window = await measureWindow(page, consoleLog, WINDOW_MS);
    rec.windowEnd = await sampleBtn(page);
    rec.okno = 'brak kliknięć w oknie; brak odczytu gateInfo';
  } catch (e) {
    rec.fatal = String(e.message || e).slice(0, 400);
    phase('FATAL ' + rec.fatal);
  } finally {
    fs.writeFileSync(RES, JSON.stringify(rec, null, 2));
    console.log('ZAPIS ' + RES);
    console.log(JSON.stringify({ label: LABEL, seed: SEED, stateTurn: rec.stateTurn, buy: rec.buyResult && rec.buyResult.buy && rec.buyResult.buy.ok, afterBuy: rec.afterBuySample, window: rec.window && { entries: rec.window.entries, warn: rec.window.warn, nns: rec.window.endTurnBlockedNNS, other: rec.window.endTurnBlockedOther, startDone: rec.window.endTurnStartDone, kinds: rec.window.kinds }, fatal: rec.fatal, errors }));
    await browser.close();
  }
}

main().catch(e => { console.error(e); process.exit(1); });
