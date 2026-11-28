'use strict';
// GRACE15FX-ACTIVE3 (R-WEB-GRACE15-EFFECTS-Q1, runda 3): WZNAWIALNY runner AKTYWNEGO gracza t1-30 na zywej grze (Chromium),
// KONFIGURACJA MAKSYMALNA (jak active2: Trudny, barbarzyncy Trudny, kultura trudny, dyplomacja trudna, Wysoki x4, mapa Standardowy,
// 1 rywal, 15 typow cywilizacji, 1 miasto-panstwo). Glowna sciezka gracza to KLIKI w UI:
//  - koniec tury WYLACZNIE klikiem przycisku „Zakończ turę”;
//  - zakup obroncy klikiem w panelu miasta (zakladka „Jednostki do rekrutacji”);
//  - suwaki (Wyzywienie, podzial podatku) zdarzeniem 'input' na kontrolce w panelu miasta (jak przeciagniecie);
//  - rozwiazanie jednostki: klik w miasto na mapie -> „JEDNOSTKA” -> przycisk „ROZWIĄŻ” (+ ewentualny confirm).
//  HAKI UZYTE W BIEGU (NIE zero hakow zmieniajacych stan; lista pelna, zarzut Evaluatora r3 nr 3):
//  (a) tylko odczyt: gateInfo, cityThreatProbe, resourceStock, snapshotJson, getSettings;
//  (b) zmieniajace stan poza klikami: __settingsLive.startNewGame (nowa gra z parametrami), __nnsMeasureDebug.foundFirstCity,
//      w tidy(): rejectAwaitingAiOffers, acceptForcedPeace, flushBattles / closeBattleSummary (czyszczenie kolejek);
//  (c) WZNOWIENIE po przerwie: __detHarness.loadJsonAsPauseLoad (produkcyjna sciezka „Wczytaj z menu pauzy”, SAVEFIX FALA 932);
//  (d) WIDOK: focusCameraOnOwnerCapitalForTest (kamera przed klikiem w miasto); FALLBACK openCityPanelForTest (log `openVia`).
//  Wplyw hakow (b) i (c) na wynik NIE zostal wykazany (brak biegu bez nich).
//
// WZNAWIANIE: stan zapisywany na POCZATKU kazdej tury (przed akcjami tury) do <stateDir>/state-s<seed>.json (snapshot gry + flagi
// runnera). Wywolanie bez ukonczonej gry wznawia od ostatniej tury z zapisu. Segment konczy sie, gdy uplynie budzet czasu
// (G15_BUDGET sekund, domyslnie 430), na poczatku tury. Chromium potrafi padnac (SIGSEGV) — wystarczy ponowic ten sam rozkaz.
// Uruchomienie (z gra/): node tools/grace15fx-active3-live.cjs <stateDir_poza_repo> <dataDir> <seed> [tax100|taxdef] [tury=30]
//  tax100 = w t1 suwak podatku Skarb=100% (jedyne ustawienie podatku w biegu); taxdef = domyslny podzial gry az do dzwigni.
// Wyniki (dataDir): turns-s<seed>.jsonl, levers-s<seed>.jsonl, readback-s<seed>.txt, barblog-s<seed>.txt, result-s<seed>.json.
// Zmienne dev: G15_FAST=1 (mala mapa, TYLKO do testow narzedzia, nie do danych), G15_DEV_LEVERS=<tura> (wymusza proby dzwigni w tej
// turze nawet bez blokady — TYLKO do debugu sciezek klikania, nie do danych), G15_BUDGET.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const { resolveChromePath } = require('./_chrome-path.cjs');
const { closeCivWelcome } = require('./_live-ready.cjs');
const { TECH_SIDE_CLOSE_SEL, TECH_MAIN_CLOSE_SEL } = require('./measure-close-modals.cjs');
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');

const GRA = path.resolve(__dirname, '..');
const STATE_DIR = path.resolve(process.argv[2] || '/nonexistent');
const DATA_DIR = path.resolve(process.argv[3] || '/nonexistent');
const SEED = parseInt(process.argv[4] || '11', 10);
const TAXMODE = process.argv[5] || 'tax100';
const TARGET = parseInt(process.argv[6] || '30', 10);
const BUDGET_S = parseFloat(process.env.G15_BUDGET || '430');
const FAST = process.env.G15_FAST === '1';
const DEV_LEVERS = process.env.G15_DEV_LEVERS ? parseInt(process.env.G15_DEV_LEVERS, 10) : null;
if (!process.argv[2] || STATE_DIR.startsWith(path.resolve(GRA, '..')) || !Number.isFinite(SEED) || !['tax100', 'taxdef'].includes(TAXMODE)) {
  console.error('Uzycie: <stateDir_poza_repo> <dataDir> <seed> [tax100|taxdef] [tury=30]'); process.exit(2);
}
fs.mkdirSync(STATE_DIR, { recursive: true });
fs.mkdirSync(DATA_DIR, { recursive: true });
const TAG = process.env.G15_TAG || ""; // sufiks galezi (pomiar niezaleznej dzwigni na kopii zapisu)
const STATE_FILE = path.join(STATE_DIR, `state-s${SEED}${TAG}.json`);
const F_TURNS = path.join(DATA_DIR, `turns-s${SEED}${TAG}.jsonl`);
const F_LEVERS = path.join(DATA_DIR, `levers-s${SEED}${TAG}.jsonl`);
const F_READBACK = path.join(DATA_DIR, `readback-s${SEED}${TAG}.txt`);
const F_BARB = path.join(DATA_DIR, `barblog-s${SEED}${TAG}.txt`);
const F_RESULT = path.join(DATA_DIR, `result-s${SEED}${TAG}.json`);
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const PAUSE_SLOT = 'g15-pause';
const T0 = Date.now();
const el = () => Math.round((Date.now() - T0) / 1000);

const ADV = {
  barbariansLevel: 'trudny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
  landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
};
const PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: FAST ? 'Mały' : 'Standardowy', rivals: '1', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: FAST ? 3 : 15, cityStatesCount: FAST ? 0 : 1,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: ADV, villageRewardsEnabled: true,
};
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const UNIT_NAMES = UNITS.map(u => u.Jednostka).filter(Boolean).sort((a, b) => b.length - a.length);
const MILITARY_EXCL = new Set(['zwiadowca', 'osadnik', 'robotnik']);
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const appendJsonl = (f, o) => fs.appendFileSync(f, JSON.stringify(o) + '\n');
const hexDist = (a, b) => { const dq = a.q - b.q; const dr = a.r - b.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; };

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
    await wait(150);
  }
}
async function tidy(page, seen) {
  await closeModals(page); await clearBattles(page); await rejectAwaitingAiOffers(page, seen); await acceptForcedPeace(page, {}, null);
}

// Pelny odczyt stanu (WYLACZNIE odczyt).
async function readState(page, cityId) {
  return page.evaluate((id) => {
    const gi = window.__nnsMeasureDebug.gateInfo();
    const all = window.__defeatTestDebug.cityThreatProbe();
    const c = all.find(x => x.id === id);
    const g = gi.gate || {};
    return {
      turn: gi.turn, treasury: gi.treasury, granary: gi.granary, canEnd: gi.canEnd,
      gate: { blokada: !!g.blokada, komunikat: g.komunikat || null, dzwignie: g.dzwignie === undefined ? null : JSON.parse(JSON.stringify(g.dzwignie)), zasob: g.zasob === undefined ? null : g.zasob, prognoza: g.prognoza === undefined ? null : JSON.parse(JSON.stringify(g.prognoza)), propozycjaPodatku: g.propozycjaPodatku === undefined ? null : JSON.parse(JSON.stringify(g.propozycjaPodatku)), niewystarczajace: g.niewystarczajace === undefined ? null : JSON.parse(JSON.stringify(g.niewystarczajace)) },
      forecast: gi.forecast ? { skarbPo: gi.forecast.skarbiecPo, spichlerzPo: gi.forecast.spichlerzPo } : null,
      podatekPunkty: gi.podatekPunkty, stock: window.__hudGrossNetTestDebug.resourceStock(),
      rows: window.__empireRecruitTestDebug.rows().map(r => ({ id: r.id, koszt: r.koszt, mp: r.manpowerCost, stockCost: r.stockCost, capable: r.capableCities })),
      recruitQueue: window.__empireRecruitTestDebug.queue(id),
      gameOver: window.__defeatTestDebug.isGameOver(),
      owner: c ? c.ownerId : null, cityQ: c ? c.q : null, cityR: c ? c.r : null,
      playerOnHex: c ? c.playerOnHex : [], foreignNear: c ? c.foreignNear : [],
      taxSplit: window.__nnsMeasureDebug.getTaxSplit(), rations: window.__nnsMeasureDebug.cityRations(),
      barb: (() => { try { const bid = window.__aiBuildingsTestDebug.BARBARIAN_OWNER_ID; return { id: bid, units: window.__nnsMeasureDebug.unitCount(bid), camps: window.__turnSlowdownTestDebug.collections().barbCamps }; } catch (e) { return { err: String(e).slice(0, 60) }; } })(),
    };
  }, cityId);
}
function affordability(st) {
  const rows = (st.rows || []).filter(r => r.capable > 0).slice().sort((a, b) => a.koszt - b.koszt);
  const cheapest = rows[0] || null;
  if (!cheapest) return { cheapest: null, both: false };
  const goldOk = st.treasury >= cheapest.koszt;
  const missing = {};
  for (const [k, v] of Object.entries(cheapest.stockCost || {})) { const have = st.stock[k] || 0; if (have < v) missing[k] = v - have; }
  const stockOk = Object.keys(missing).length === 0;
  return { cheapest: cheapest.id, cost: cheapest.koszt, stockCost: cheapest.stockCost, goldOk, stockOk, both: goldOk && stockOk, missingStock: missing };
}
const milOnHex = (st) => st.playerOnHex.filter(u => !MILITARY_EXCL.has(String(u.typeId).toLowerCase()) && u.category !== 'zwiadowca');

// ---- UI: otwarcie panelu miasta KLIKIEM w miasto na mapie (fallback: hak otwarcia panelu), zakladki, suwaki -------------------
async function panelOpen(page) { return page.evaluate(() => !!document.querySelector('.civ-v-exit-map-btn')); }
async function closePanel(page) {
  await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (b) b.click(); });
  await wait(350);
}
// Klik w heks miasta (srodek ekranu; siatka awaryjna). Zwraca 'city' / 'unit' / 'none'. choice: 'MIASTO' | 'JEDNOSTKA'.
async function clickCityHex(page, choice) {
  // Kamera (stan WIDOKU, nie gry) wraca na stolice — po wznowieniu zapisu kamera nie stoi na miescie.
  try { await page.evaluate(() => window.__hotSeatTestDebug.focusCameraOnOwnerCapitalForTest(0)); } catch (e) { /* opcjonalne */ }
  await wait(700);
  const offs = [[0, 0], [0, -40], [0, 40], [-50, 0], [50, 0], [-50, -40], [50, 40], [0, -90], [0, 90], [-100, 0], [100, 0]];
  for (const [dx, dy] of offs) {
    await page.mouse.click(700 + dx, 450 + dy);
    await wait(500);
    const r = await page.evaluate((want) => {
      const chooser = [...document.querySelectorAll('button, div')].find(e => e.offsetParent && /^\s*(MIASTO|JEDNOSTKA)\b/i.test((e.innerText || '').trim()) && e.tagName === 'BUTTON');
      const title = (document.body.innerText || '').includes('Co wybierasz?');
      if (title) {
        const btn = [...document.querySelectorAll('button')].find(b => b.offsetParent && new RegExp('(^|\\n)\\s*' + want + '\\s*(\\n|$)', 'i').test((b.innerText || '').trim()));
        if (btn) { btn.click(); return 'chooser:' + want; }
        return 'chooser-no-button';
      }
      if (document.querySelector('.civ-v-exit-map-btn')) return 'panel';
      if (document.querySelector('.uc-act-disband')) return 'unitbar';
      return 'none';
    }, choice);
    await wait(500);
    if (r !== 'none' && r !== 'chooser-no-button') return { how: r, dx, dy };
  }
  return { how: 'none' };
}
async function openCityPanel(page, cityId) {
  if (await panelOpen(page)) return 'already';
  const c = await clickCityHex(page, 'MIASTO');
  await wait(600);
  if (await panelOpen(page)) return 'click:' + c.how;
  const ok = await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await wait(700);
  return ok && await panelOpen(page) ? 'hook-fallback' : 'FAILED';
}
async function clickTab(page, re) {
  const r = await page.evaluate((src) => {
    const rx = new RegExp(src);
    const e = [...document.querySelectorAll('button.civ-v-icon-btn')].find(b => rx.test((b.getAttribute('aria-label') || '') + ' ' + (b.title || '')));
    if (!e) return false; e.click(); return true;
  }, re);
  await wait(500);
  return r;
}
async function readSliders(page) {
  return page.evaluate(() => [...document.querySelectorAll('input[type=range]')].filter(i => i.offsetParent).map(i => ({
    label: ((i.closest('.slider-row') || i.parentElement).innerText || '').replace(/\s+/g, ' ').trim().slice(0, 60), min: i.min, max: i.max, value: i.value, disabled: i.disabled,
  })));
}
async function setSlider(page, labelRe, value) {
  return page.evaluate(({ src, v }) => {
    const rx = new RegExp(src);
    const inp = [...document.querySelectorAll('input[type=range]')].filter(i => i.offsetParent)
      .find(i => rx.test(((i.closest('.slider-row') || i.parentElement).innerText || '')));
    if (!inp) return { ok: false, why: 'brak suwaka ' + src };
    if (inp.disabled) return { ok: false, why: 'suwak wylaczony' };
    const before = inp.value;
    inp.value = String(v === 'min' ? inp.min : v === 'max' ? inp.max : v);
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    inp.dispatchEvent(new Event('change', { bubbles: true }));
    return { ok: true, before, after: inp.value, min: inp.min, max: inp.max };
  }, { src: labelRe, v: value });
}
// Dzwignia: suwak Wyzywienia (zakladka „Wyżywienie i wzrost”) -> wartosc. value: 'min' | liczba (indeks suwaka).
async function leverRation(page, cityId, value) {
  const openVia = await openCityPanel(page, cityId);
  const tab = await clickTab(page, 'Wyżywienie i wzrost');
  const sl = await setSlider(page, 'Wyżywienie', value);
  await wait(400);
  const after = await readSliders(page);
  await closePanel(page);
  return { openVia, tab, ...sl, slidersAfter: after };
}
async function setTax(page, cityId, skarb) {
  const openVia = await openCityPanel(page, cityId);
  const tab = await clickTab(page, 'Podział podatku');
  const before = await readSliders(page);
  const sl = await setSlider(page, '^\\s*Skarb', skarb);
  await wait(400);
  const after = await readSliders(page);
  await closePanel(page);
  return { openVia, tab, set: sl, before, after };
}
// Rozwiazanie jednostki: klik w miasto -> „JEDNOSTKA” -> przycisk ROZWIĄŻ (potwierdzenie confirm obsluguje page.on('dialog')).
async function disbandOne(page) {
  if (await panelOpen(page)) await closePanel(page);
  const c = await clickCityHex(page, 'JEDNOSTKA');
  await wait(500);
  const info = await page.evaluate(() => {
    const b = document.querySelector('.uc-act-disband');
    const cards = [...document.querySelectorAll('[class*="army-stack"] [class*="card"], .asc-card, [class*="uc-card"]')].map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 50)).slice(0, 6);
    return { hasBtn: !!b, label: b ? (b.innerText || '').trim() : null, disabled: b ? b.disabled : null, cards, sel: (document.querySelector('.uc-name, .uc-title, [class*="unit-card-title"]') || {}).innerText || null };
  });
  if (!info.hasBtn || info.disabled) { await page.screenshot({ path: path.join(STATE_DIR, `disband-fail-s${SEED}-${Date.now()}.png`) }).catch(() => {}); return { ok: false, click: c, info }; }
  await page.evaluate(() => document.querySelector('.uc-act-disband').click());
  await wait(900);
  return { ok: true, click: c, info };
}
async function clickEndTurn(page) {
  return page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Zakończ turę/i.test(x.textContent || '') && !x.disabled); if (b) { b.click(); return true; } return false; });
}
async function purchaseDefender(page, cityId, want) {
  const openVia = await openCityPanel(page, cityId);
  const tab = await clickTab(page, 'Jednostki do rekrutacji');
  const clicked = await page.evaluate(({ names, want }) => {
    const body = document.querySelector('.civ-v-recruit-body');
    if (!body) return { ok: false, why: 'brak karty rekrutacji' };
    for (const b of body.querySelectorAll('.unit-recruit-submit')) {
      let hit = null;
      for (let p = b.parentElement; p && p !== body.parentElement; p = p.parentElement) {
        const t = (p.innerText || '').trim();
        const nm = names.find(n => t.startsWith(n));
        if (nm) { hit = nm; break; }
      }
      if (hit === want) { if (b.disabled) return { ok: false, why: 'przycisk wylaczony', name: hit }; b.click(); return { ok: true, name: hit }; }
    }
    return { ok: false, why: 'brak wiersza ' + want };
  }, { names: UNIT_NAMES, want });
  await wait(400);
  await closePanel(page);
  return { openVia, tab, ...clicked };
}
// Dzwignia (d): budowa zwiekszajaca zywnosc — proba KLIKU „Kup” przy budynku o nazwie sugerujacej zywnosc (best effort).
async function leverBuildFood(page, cityId) {
  const openVia = await openCityPanel(page, cityId);
  const tab = await clickTab(page, 'Budowa');
  const rows = await page.evaluate(() => [...document.querySelectorAll('button')].filter(b => b.offsetParent && /\b(btn-sm)\b/.test(b.className) && /^(Kup|Buduj)$/.test((b.innerText || '').trim())).map(b => {
    let p = b.parentElement; let txt = '';
    for (let i = 0; i < 4 && p; i++, p = p.parentElement) { txt = (p.innerText || '').replace(/\s+/g, ' ').trim(); if (txt.length > 25) break; }
    return { act: (b.innerText || '').trim(), enabled: !b.classList.contains('cannot-build') && !b.disabled, txt: txt.slice(0, 110) };
  }));
  const food = rows.filter(r => /Spichlerz|Farm|Zagrod|Pole|Młyn|Irygac|Targowisk|Rolni/i.test(r.txt));
  let clicked = null;
  const cand = food.find(r => r.enabled && r.act === 'Kup') || null;
  if (cand) {
    clicked = await page.evaluate((txt) => {
      const b = [...document.querySelectorAll('button')].find(b => b.offsetParent && (b.innerText || '').trim() === 'Kup' && !b.classList.contains('cannot-build') && !b.disabled && (function () { let p = b.parentElement; for (let i = 0; i < 4 && p; i++, p = p.parentElement) { const t = (p.innerText || '').replace(/\s+/g, ' ').trim(); if (t.length > 25) return t.slice(0, 110) === txt; } return false; })());
      if (!b) return false; b.click(); return true;
    }, cand.txt);
    await wait(400);
  }
  await closePanel(page);
  return { openVia, tab, rowsSeen: rows.length, foodRows: food, clicked };
}

async function main() {
  fs.writeFileSync(path.join(DATA_DIR, `.segstart-s${SEED}`), new Date().toISOString());
  let S = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : null;
  if (S && S.done) { console.log('G15 DONE already', JSON.stringify(S.result)); return; }
  const html = path.join(STATE_DIR, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, STATE_DIR], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  const errors = [];
  let clusterStart = 0; let curTurn = 0; const dialogs = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('dialog', d => { dialogs.push({ turn: curTurn, type: d.type(), msg: d.message().slice(0, 160) }); d.accept().catch(() => {}); });
  page.on('console', m => {
    const t = m.text();
    if (/\[ClusterStart\]/.test(t)) clusterStart++;
    if (/[Bb]arbar/.test(t) && !/\[NewGame\]/.test(t)) fs.appendFileSync(F_BARB, `t${curTurn} ${t.slice(0, 220)}\n`);
  });
  let finished = false;
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive && !!window.__detHarness, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), PARAMS);
    { const t0 = Date.now(); while (clusterStart < 1 && Date.now() - t0 < 600000) await wait(250); }
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    assert.ok(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()), 'foundFirstCity');
    await page.waitForTimeout(3000);
    await closeCivWelcome(page);
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    assert.equal(c0.length, 1, 'jedno miasto gracza na starcie');
    let cityId = c0[0].id;
    console.log('G15 start ok', el(), 's, resume=', !!S);
    if (S) {
      const rp = await page.evaluate((a) => window.__detHarness.loadJsonAsPauseLoad(a.s, a.slot), { s: S.snap, slot: PAUSE_SLOT });
      await wait(1500);
      try { await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn === t, S.turn, { timeout: 330000, polling: 300 }); } catch (e) { console.log("G15 wznowienie: tura po wczytaniu =", await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().turn).catch(() => "?"), "oczekiwano", S.turn); throw e; }
      await closeCivWelcome(page);
      cityId = S.cityId;
      console.log('G15 wznowiono t' + S.turn, JSON.stringify(rp), el(), 's');
    } else {
      S = { turn: 1, cityId, flags: { purchaseTurn: null, taxDone: false, leversOutcome: null, segments: 0 }, snap: null };
      // READBACK ustawien: getSettings + poziom barbarzyncow z ZAPISU gry (pole zapisane w snapshot), nie z parametru startNewGame.
      const rb = await page.evaluate(() => ({ settings: window.__settingsLive.getSettings(), snap: window.__detHarness.snapshotJson() }));
      const snapObj = JSON.parse(rb.snap);
      const found = [];
      (function walk(o, p, d) { if (!o || typeof o !== 'object' || d > 6) return; for (const k of Object.keys(o)) { if (/barbarians?Level|barbLevel|kulturaReligia|diplomacyWarLevel|kosztJednostekPace|wzrostLudnosciPace/i.test(k)) found.push(p + '.' + k + '=' + JSON.stringify(o[k])); walk(o[k], p + '.' + k, d + 1); } })(snapObj, '$', 0);
      fs.writeFileSync(F_READBACK, 'READBACK seed ' + SEED + ' (tryb ' + TAXMODE + ', ' + (FAST ? 'FAST-DEV' : 'MAKS') + ')\n'
        + 'A) __settingsLive.getSettings():\n' + JSON.stringify(rb.settings, null, 1) + '\n'
        + 'B) pola ustawien odczytane z ZAPISU STANU GRY (snapshotJson, produkcyjny buildSaveGameSnapshot):\n' + (found.join('\n') || '(brak pol)') + '\n'
        + 'C) wartosc przekazana do startNewGame: advanced.barbariansLevel=' + ADV.barbariansLevel + ' (to NIE jest odczyt)\n');
    }
    const seen = new Set();
    const levers = (rec) => appendJsonl(F_LEVERS, { seed: SEED, mode: TAXMODE, ...rec });
    const turnsDone = [];
    let result = null;
    let segTurns = 0;
    while (!result) {
      await tidy(page, seen);
      let st = await readState(page, cityId);
      curTurn = st.turn;
      if (st.owner !== 0) { result = { outcome: 'przegrana-miasto', turn: st.turn, owner: st.owner }; break; }
      if (st.turn > TARGET) { result = { outcome: 'dokonczone', turn: st.turn }; break; }
      // zapis stanu na POCZATKU tury (przed akcjami tej tury)
      if (segTurns > 0 && (Date.now() - T0) / 1000 > BUDGET_S) { console.log('G15 SEGMENT_END przed t' + st.turn, el(), 's'); finished = false; break; }
      S.turn = st.turn; S.flags.segments += 0;
      S.snap = await page.evaluate(() => window.__detHarness.snapshotJson());
      const tmp = STATE_FILE + '.tmp'; fs.writeFileSync(tmp, JSON.stringify(S)); fs.renameSync(tmp, STATE_FILE);
      segTurns++;
      if (process.env.G15_ABORT_NOWOOD === "1" && st.turn === 4 && !(st.stock.drewno > 0) && S.flags.purchaseTurn === null) { result = { outcome: "brak-drewna", turn: st.turn, stock: st.stock }; break; }
      const af = affordability(st);
      const rec = {
        seed: SEED, mode: TAXMODE, turn: st.turn, treasury: st.treasury, granary: st.granary,
        projSkarbDelta: st.forecast ? st.forecast.skarbPo - st.treasury : null, projFoodDelta: st.forecast ? st.forecast.spichlerzPo - st.granary : null,
        forecast: st.forecast, canEnd0: st.canEnd, gate0: st.gate, taxSplit: st.taxSplit, rations: st.rations,
        stockDrewno: st.stock.drewno ?? st.stock.Drewno ?? null, afford: af.cheapest ? { cheapest: af.cheapest, cost: af.cost, both: af.both, missingStock: af.missingStock } : null,
        playerMil: milOnHex(st).length, playerOnHex: st.playerOnHex.map(u => u.typeId), barb: st.barb,
        foreignNear: st.foreignNear.filter(u => u.owner !== 0).map(u => u.owner + ':' + u.typeId),
        barbMinDist: (() => { const d = st.foreignNear.filter(u => u.owner !== 0).map(u => hexDist({ q: u.q, r: u.r }, { q: st.cityQ, r: st.cityR })); return d.length ? Math.min(...d) : null; })(),
        t: el(),
      };
      const actions = [];
      // t1: podatek 100% Skarb (tryb tax100) — jedyna zmiana podatku w biegu; suwak przez UI.
      if (st.turn === 1 && TAXMODE === 'tax100' && !S.flags.taxDone) {
        const r = await setTax(page, cityId, 100); S.flags.taxDone = true; actions.push({ a: 'tax100', ...r });
      }
      // zakup obroncy (raz, gdy stac gracza): klik w panelu miasta
      if (S.flags.purchaseTurn === null && af.both) {
        const r = await purchaseDefender(page, cityId, af.cheapest);
        actions.push({ a: 'kup-obronce', want: af.cheapest, ...r });
        if (r.ok) S.flags.purchaseTurn = st.turn;
      }
      // bramka: sprobuj domknac modale
      let gp = await readState(page, cityId);
      for (let k = 0; k < 6 && !gp.canEnd; k++) { await tidy(page, seen); await wait(400); gp = await readState(page, cityId); }
      const wantLevers = (!gp.canEnd && !gp.gameOver) || (DEV_LEVERS !== null && st.turn === DEV_LEVERS);
      if (wantLevers) {
        const snapState = (x) => ({ turn: x.turn, treasury: x.treasury, granary: x.granary, canEnd: x.canEnd, forecast: x.forecast, gate: x.gate, rations: x.rations, taxSplit: x.taxSplit, mil: milOnHex(x).length, units: x.playerOnHex.map(u => u.typeId) });
        const base = snapState(gp);
        levers({ turn: st.turn, ev: 'blokada-start', ...base });
        let unblocked = null;
        if (process.env.G15_DEV_DISBAND === '1') { // TYLKO debug sciezki klikania (nie dane)
          const dres = await disbandOne(page); await tidy(page, seen); const x0 = await readState(page, cityId);
          levers({ turn: st.turn, lever: 'DEV-disband', result: dres, after: snapState(x0) }); result = { outcome: 'dev-disband', turn: st.turn }; break;
        }
        // Dzwignie wykonywane NARASTAJACO w kolejnosci a->c->d->b (cofniecie suwaka Wyzywienia jest zablokowane przez gre przy deficycie).
        // Pomiar NIEZALEZNY pojedynczej dzwigni: bieg z G15_ONLY=<a|b|c|d> na kopii zapisu z tej samej tury (osobna galaz).
        const only = process.env.G15_ONLY ? process.env.G15_ONLY.split(",") : null;
        const allow = process.env.G15_ALLOW ? process.env.G15_ALLOW.split(",") : null; // dozwolone dzwignie BEZ konczenia biegu (sciezka gracza)
        const want = (k) => (only || allow) ? (only || allow).includes(k) : true;
        let x = gp;
        if (want("a")) { // (a) suwak Wyzywienia na minimum
          const before = snapState(x);
          const a = await leverRation(page, cityId, "min"); await tidy(page, seen); x = await readState(page, cityId);
          levers({ turn: st.turn, lever: "a-wyzywienie-min", result: a, before, after: snapState(x), canEndAfter: x.canEnd });
          if (x.canEnd) unblocked = "a-wyzywienie-min";
        }
        if (want("c") && !x.canEnd && !unblocked) { // (c) podatek: Skarb 100%
          const before = snapState(x);
          const tx = await setTax(page, cityId, 100); await tidy(page, seen); x = await readState(page, cityId);
          levers({ turn: st.turn, lever: "c-podatek-skarb100", result: tx, before, after: snapState(x), canEndAfter: x.canEnd, uwaga: TAXMODE === "tax100" ? "podatek Skarb=100% juz od t1 — dzwignia wyczerpana" : null });
          if (x.canEnd) unblocked = "c-podatek-skarb100";
        }
        if (want("d") && !x.canEnd && !unblocked) { // (d) budowa zwiekszajaca zywnosc (best effort)
          const before = snapState(x);
          const bf = await leverBuildFood(page, cityId); await tidy(page, seen); x = await readState(page, cityId);
          levers({ turn: st.turn, lever: "d-budowa-zywnosc", result: bf, before, after: snapState(x), canEndAfter: x.canEnd });
          if (x.canEnd) unblocked = "d-budowa-zywnosc";
        }
        if (want("b")) { // (b) rozwiazanie jednostki (nieodwracalne): do 3 prob, po kazdej odczyt bramki
          for (let k = 0; k < parseInt(process.env.G15_BMAX || "3", 10) && !x.canEnd && !unblocked; k++) {
            const before = snapState(x);
            const dres = await disbandOne(page); await tidy(page, seen); x = await readState(page, cityId);
            levers({ turn: st.turn, lever: "b-rozwiaz-jednostke#" + (k + 1), result: dres, before, after: snapState(x), canEndAfter: x.canEnd });
            if (x.canEnd) unblocked = "b-rozwiaz-jednostke#" + (k + 1);
            if (!dres.ok) break;
          }
        }
        if (process.env.G15_THEN_A === "1" && !x.canEnd && !unblocked) { // galaz: po rozwiazaniu jednostki dzwignia Wyzywienia (gra podpowiada ja w komunikacie bramki)
          const before = snapState(x);
          const a3 = await leverRation(page, cityId, "min"); await tidy(page, seen); x = await readState(page, cityId);
          levers({ turn: st.turn, lever: "a-wyzywienie-min-PO-rozwiazaniu", result: a3, before, after: snapState(x), canEndAfter: x.canEnd });
          if (x.canEnd) unblocked = "a-po-b";
        }
        if (only) { result = { outcome: "galaz-" + only.join("") + "-gotowa", turn: st.turn, canEndAfter: x.canEnd, unblocked: unblocked || null }; rec.actions = actions; break; }
        S.flags.leversOutcome = S.flags.leversOutcome || {};
        S.flags.leversOutcome['t' + st.turn] = unblocked || 'BRAK-WYJSCIA';
        gp = await readState(page, cityId);
        actions.push({ a: 'dzwignie', unblocked: unblocked || null });
        if (DEV_LEVERS !== null && st.turn === DEV_LEVERS) { result = { outcome: 'dev-dzwignie', turn: st.turn }; rec.actions = actions; appendJsonl(F_TURNS, rec); break; }
      }
      rec.actions = actions;
      rec.canEndAtEnd = gp.canEnd;
      if (!gp.canEnd) {
        if (gp.gameOver) result = { outcome: 'przegrana', turn: st.turn };
        else result = { outcome: 'blokada-bez-wyjscia', turn: st.turn, gate: gp.gate, forecast: gp.forecast, treasury: gp.treasury, granary: gp.granary };
        rec.finalGate = gp.gate; appendJsonl(F_TURNS, rec);
        break;
      }
      appendJsonl(F_TURNS, rec);
      const clicked = await clickEndTurn(page);
      if (!clicked) { result = { outcome: 'brak-przycisku-konca-tury', turn: st.turn }; break; }
      try {
        await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), st.turn, { timeout: 180000, polling: 200 });
      } catch (e) { result = { outcome: 'koniec-tury-timeout', turn: st.turn }; break; }
      await closeModals(page);
      curTurn = st.turn + 1;
      turnsDone.push(st.turn);
    }
    if (result) {
      finished = true;
      const last = await readState(page, cityId).catch(() => null);
      const out = { ...result, seed: SEED, mode: TAXMODE, completedThisSegment: turnsDone, leversOutcome: S.flags.leversOutcome, purchaseTurn: S.flags.purchaseTurn, last: last ? { turn: last.turn, owner: last.owner, treasury: last.treasury, granary: last.granary, mil: milOnHex(last).length } : null, dialogs, errors: errors.length, elapsedSegmentS: el() };
      S.done = true; S.result = out; fs.writeFileSync(STATE_FILE, JSON.stringify(S));
      fs.writeFileSync(F_RESULT, JSON.stringify(out, null, 1));
      console.log('G15 RESULT', JSON.stringify(out));
    }
    if (errors.length) console.log('G15 pageerrors', errors.slice(0, 3));
  } finally {
    await browser.close().catch(() => {});
  }
  console.log(finished ? 'G15 FINISHED' : 'G15 SEGMENT_END (uruchom ponownie ten sam rozkaz)');
}
main().catch(e => { console.error('G15 FAIL', e.message); process.exit(1); });
