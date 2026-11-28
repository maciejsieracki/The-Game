'use strict';
// GRACE15FX-ACTIVE2 (R-WEB-GRACE15-EFFECTS-Q1, runda 2 -> wersja r2b): KOPIA grace15fx-active-live.cjs z tymi zmianami:
// (1) BEZ haka setTaxSplit (podatek zostaje na domyslnym podziale gry; bez zmian stanu poza zakupem i suwakiem racji w UI);
// (2) przy blokadzie 'Zakoncz ture' gracz probuje realnej dzwigni UI: suwak Wyzywienia (input[type=range]) w panelu miasta
//     ustawiany na minimum + zdarzenie 'input' (ta sama sciezka co przeciagniecie), potem ponowny odczyt bramki;
// (3) kazda tura zapisywana do turns.jsonl od razu (wynik czesciowy przezywa przerwanie);
// (4) rozwiazanie jednostek NIE zaimplementowane (brak id jednostek w odczycie UI) — NIE ZMIERZONO.
// --- oryginalny opis (grace15fx-active-live) ---
// GRACE15FX-ACTIVE (R-WEB-GRACE15-EFFECTS-Q1, runda 2, odpowiedz na zarzut 1 Evaluatora): KOPIA realdef-econ-live.cjs
// z jedna zmiana swiata: mapa STANDARDOWA, 1 rywal, 15 typow cywilizacji, 1 miasto-panstwo (jak pomiar AI GRACE15FX),
// zeby tabela aktywnego gracza byla z TEJ SAMEJ konfiguracji co tabela AI. Reszta (maksimum: Trudny, barbarzyncy Trudny,
// kultura trudna, dyplomacja trudna, Wysoki x4) bez zmian. Polityki p1 (zakup obroncy klikiem) i p2 (zakup + suwak 100%
// Handlu na Pieniadz) jak w REALDEF; bez haka zmieniajacego stan poza tym, co robi gracz w UI.
// Wejscie: zywa gra w Chromium, WYLACZNIE odczyty + realny klik zakupu/suwaka. Bramka tury NIE jest obchodzona (brak dosypek).
//
// --- oryginalny opis (REALDEF, R-WEB-EARLY-DEFENSE-REALISTIC-Q1 runda 3) ---
// R-WEB-EARLY-DEFENSE-REALISTIC-Q1 (tag REALDEF), runda 3: INWENTARZ EKONOMII STARTU gracza na MAKSIMUM
// (Trudny / dyplomacja trudna / Wysoki x4 / kultura trudny / barbarzyncy TRUDNY / Maly / Kontynenty), zywa gra w Chromium.
//
// Polityki:
//  - p0 = pasywny: ZERO akcji gracza. Wylacznie odczyty haków (stan, zasoby, wiersze rekrutacji, sonda zagrozenia),
//         harness tylko konczy ture (jak w DEFEAT/REALDEF r2) i zamyka modale/bitwy.
//  - p1 = jak p0, ale w PIERWSZEJ turze, w ktorej odczyt pokazuje, ze stac gracza na najtansza jednostke wojskowa
//         (Skarb >= koszt i zasoby >= koszt zasobowy wg wierszy rekrutacji), gracz wykonuje REALNA sciezke UI:
//         otwiera panel miasta -> zakladka „Jednostki do rekrutacji” -> klika przycisk zakupu -> zamyka panel
//         przyciskiem „Wróć na mapę”. Zadnych haków tworzacych jednostki ani zmieniajacych skarb/zasoby/manpower.
//         Panel NIE jest otwierany w turach, w ktorych zakup nie jest mozliwy (brak czasu-rzeczywistego/bezczynnosci).
//
//  - p2 = jak p1, ale dodatkowo w turze 1 gracz przesuwa suwak podzialu Handlu na 100% Pieniadz (ta sama funkcja co suwak
//         w UI: applyPodzialHandluGracza) -- poziom MAKSYMALNY dzwigni dochodu Skarbu (regula „testuj na maksimum”).
//  - dopen / dclose / didle = DIAGNOZA artefaktu `owner=null` z r2 (pasywne jak p0 + jedna zmiana harnessu):
//         dopen = w KAZDEJ turze otwiera panel miasta i zostawia otwarty (jak P1 r2),
//         dclose = w kazdej turze otwiera panel i zamyka go przyciskiem „Wróć na mapę”,
//         didle = w kazdej turze 1,6 s bezczynnosci czasu rzeczywistego (bez panelu).
//
// DEFINICJA `turn` (jedna, wspolna dla calego dokumentu i JSONL):
//   turn = numer tury z gateInfo().turn (tura, w ktorej gracz wlasnie decyduje; po endTurn rosnie o 1).
//   tura_utraty = gateInfo().turn odczytany PO zakonczeniu tury, w ktorej miasto zmienilo wlasciciela
//                 (= liczba ukonczonych tur + 1, czyli pierwsza tura, w ktorej gracz widzi stan z utracone miastem).
//   Wiersz „turns[i]” opisuje stan na POCZATKU tury turn=i+1 (przed jakakolwiek akcja gracza w tej turze).
//
// Uruchomienie (z gra/): node tools/realdef-econ-live.cjs <katalog_poza_repo> <p0|p1|p2|dopen|dclose|didle> <seed> [tury=12] [run=1]
// Wynik: wiersz w <katalog>/econ.jsonl (jeden na przebieg) + log <katalog>/econ-<pol>-s<seed>-r<run>.txt (nie commitowany).
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
const OUT = path.resolve(process.argv[2] || '/nonexistent-out');
const POLICY = process.argv[3];
const SEED = parseInt(process.argv[4] || '4242', 10);
const TURNS = parseInt(process.argv[5] || '12', 10);
const RUN = parseInt(process.argv[6] || '1', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !['p0', 'p1', 'p2', 'dopen', 'dclose', 'didle'].includes(POLICY) || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> <p0|p1|p2|dopen|dclose|didle> <seed> [tury=12] [run=1]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `econ-${POLICY}-s${SEED}-r${RUN}.txt`);
const DANE = path.join(OUT, 'econ.jsonl');
const BARB_LEVEL = process.env.DEFEAT_BARB_LEVEL || 'trudny';
const ADV = {
  barbariansLevel: BARB_LEVEL, battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
  landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
};
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Standardowy', rivals: '1', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 1,
  worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
  advanced: ADV,
  villageRewardsEnabled: true,
};
// REALDEF4 (R-WEB-EARLY-DEFENSE-VERIFY-Q1): konfiguracje pomiaru, wybierane zmienna REALDEF_CFG (domyslnie 'max').
//  max          = maksimum jak wyzej (Trudny, barbarzyncy Trudny, kultura trudna, dyplomacja trudna, Wysoki x4 ludnosc/koszt jednostek).
//  domyslna     = domyslna gra: Normalny, barbarzyncy Normalni, dyplomacja Latwa, kultura Latwa, tempa Normalne.
//  wysoki-latwi = maksimum z barbarzyncami Latwymi (reszta jak w max).
const CFG = process.env.REALDEF_CFG || 'max';
if (CFG === 'domyslna') {
  MAX_PARAMS.difficulty = 'Normalny';
  Object.assign(ADV, { barbariansLevel: 'normalny', diplomacyWarLevel: 'latwa', kulturaReligiaLevel: 'latwy',
    kosztJednostekPace: 'normalny', wzrostLudnosciPace: 'normalny', buildingCostPace: 'normalny', ruchSwiataPace: 'normalny' });
} else if (CFG === 'wysoki-latwi') {
  Object.assign(ADV, { barbariansLevel: 'latwy' });
} else if (CFG !== 'max') {
  console.error('REALDEF_CFG: nieznana konfiguracja ' + CFG); process.exit(2);
}
const UNITS = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8'));
const UNIT_NAMES = UNITS.map(u => u.Jednostka).filter(Boolean).sort((a, b) => b.length - a.length);
const MILITARY_EXCL = new Set(['zwiadowca', 'osadnik', 'robotnik']);

function logLine(obj) {
  const line = 'REALDEFECON ' + JSON.stringify(obj);
  fs.appendFileSync(LOG, line + '\n');
}
const KEEP_RE = /Diag|Load\]|Save|Zapis|Victory|[Bb]itw|[Bb]attle|zdob|[Pp]odb|[Bb]arbar|Rekrutacja\]|[Cc]ytad|[Rr]ebel/;

function hexDist(a, b) { const dq = a.q - b.q; const dr = a.r - b.r; return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2; }

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
  let n = 0;
  for (let k = 0; k < 200; k++) {
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) break;
    n++;
    await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return; }
      if (!h.closeBattleSummary()) h.flushBattles();
    });
    await new Promise(r => setTimeout(r, 150));
  }
  return n;
}

// Pelny odczyt stanu (WYLACZNIE odczyt): ekonomia, zasoby, wiersze rekrutacji, produkcja miasta, zagrozenie.
async function readState(page, cityId) {
  return page.evaluate((id) => {
    const gi = window.__nnsMeasureDebug.gateInfo();
    const all = window.__defeatTestDebug.cityThreatProbe();
    const c = all.find(x => x.id === id);
    const wp = window.__workPoolTestDebug ? window.__workPoolTestDebug.state() : null;
    const myCity = wp && wp.cities ? wp.cities.find(x => x.id === id) : null;
    return {
      turn: gi.turn, treasury: gi.treasury, granary: gi.granary, canEnd: gi.canEnd, gateBlock: gi.gate && gi.gate.blokada,
      forecast: gi.forecast ? { skarbPo: gi.forecast.skarbiecPo, spichlerzPo: gi.forecast.spichlerzPo } : null,
      stock: window.__hudGrossNetTestDebug.resourceStock(),
      rows: window.__empireRecruitTestDebug.rows().map(r => ({ id: r.id, koszt: r.koszt, mp: r.manpowerCost, stockCost: r.stockCost, capable: r.capableCities })),
      pracaRate: wp ? wp.hudPracaRate : null, pracaPool: wp ? wp.pool : null,
      queueIds: myCity ? myCity.queueIds : null, postep: myCity ? myCity.postep : null,
      recruitQueue: window.__empireRecruitTestDebug.queue(id),
      gameOver: window.__defeatTestDebug.isGameOver(),
      owner: c ? c.ownerId : null, cityQ: c ? c.q : null, cityR: c ? c.r : null,
      playerOnHex: c ? c.playerOnHex : [],
      foreignNear: c ? c.foreignNear : [],
      battle: window.__aiTradeWiringTestDebug.battleState(),
    };
  }, cityId);
}

function affordability(st) {
  // Najtansza jednostka wojskowa wg KOSZTU W PIENIADZACH (wiersze rekrutacji to sa jednostki wojskowe; cywile pominieci przez gre).
  const rows = (st.rows || []).filter(r => r.capable > 0).slice().sort((a, b) => a.koszt - b.koszt);
  const cheapest = rows[0] || null;
  if (!cheapest) return { cheapest: null, goldOk: false, stockOk: false, both: false, missingStock: null };
  const goldOk = st.treasury >= cheapest.koszt;
  const missing = {};
  for (const [k, v] of Object.entries(cheapest.stockCost || {})) {
    const have = st.stock[k] || 0;
    if (have < v) missing[k] = v - have;
  }
  const stockOk = Object.keys(missing).length === 0;
  return { cheapest: cheapest.id, cost: cheapest.koszt, stockCost: cheapest.stockCost, goldOk, stockOk, both: goldOk && stockOk, missingStock: missing };
}

// Dzwignia UI: suwak Wyzywienia w panelu miasta na minimum (realne zdarzenie 'input', jak przeciagniecie gracza).
async function lowerRationUi(page, cityId) {
  const opened = await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await page.waitForTimeout(600);
  const r = await page.evaluate((op) => {
    const ranges = Array.from(document.querySelectorAll('input[type="range"]'));
    const inp = document.querySelector('.wyzwienie-w4-sliders input[type="range"]')
      || ranges.find(i => /Wyżywienie/.test((i.closest('.slider-row') || i.parentElement || {}).textContent || ''));
    if (!inp) return { ok: false, why: 'brak suwaka racji w panelu miasta', opened: op, rangeDump: ranges.map(i => ({ cls: i.className, parent: (i.parentElement || {}).className, txt: ((i.closest('div') || {}).textContent || '').slice(0, 80), disabled: i.disabled, min: i.min, max: i.max, value: i.value })).slice(0, 12), civDump: Array.from(new Set(Array.from(document.querySelectorAll('[class*="civ-v"]')).map(e => String(e.className).split(' ')[0]))).slice(0, 25) };
    if (inp.disabled) return { ok: false, why: 'suwak wylaczony' };
    const before = inp.value;
    inp.value = inp.min;
    inp.dispatchEvent(new Event('input', { bubbles: true }));
    return { ok: true, before, after: inp.value, min: inp.min, max: inp.max };
  }, opened);
  await page.waitForTimeout(300);
  const closed = await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (!b) return false; b.click(); return true; });
  await page.waitForTimeout(300);
  return { ...r, panelClosed: closed };
}

const T0 = Date.now();
async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
  const html = path.join(OUT, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  const navLog = [];
  page.on('framenavigated', (f) => { if (f === page.mainFrame()) navLog.push({ t: Date.now() - T0, url: f.url().slice(-60) }); });
  page.on('pageerror', e => errors.push(e.message));
  let clusterStartSeen = 0; const mapGenLog = [];
  page.on('console', m => { const t = m.text(); if (/\[ClusterStart\]/.test(t)) clusterStartSeen++; if (/\[civ\] mapGen ms/.test(t)) mapGenLog.push({ t: Date.now() - T0, mapGen: (t.match(/total=\d+/) || [''])[0] }); if (/buildScene ms/.test(t)) mapGenLog.push({ t: Date.now() - T0, hexCount: (t.match(/hexCount=\d+/) || [''])[0] }); if (KEEP_RE.test(t)) logLine({ kind: 'console', type: m.type(), text: t.slice(0, 240) }); });
  const turns = [];
  const idleTrace = [];
  let cityId = null; let lossTurn = null; let completed = 0; let result = null;
  let taxProbe = null; let purchaseTurn = null; let purchaseClick = null; let firstDefenderTurn = null; let firstBothTurn = null; let firstGoldTurn = null;
  const notes = [];
  let settingsReadback = null;
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    // POPRAWKA HARNESSU (runda 3): `awaitingFirstCity()` jest true JUZ na swiecie startowym (podglad ~1000 heksow), zanim
    // dogeneruje sie swiat NOWEJ gry. Wczesniejsze runnery zakladaly miasto na tym swiecie, a prawdziwy swiat podmienial
    // stan po kilku–kilkunastu sekundach (owner=null, tura 1). Czekamy wiec na log `[ClusterStart]` (jest emitowany dopiero
    // przy zastosowaniu swiata nowej gry), dopiero potem na awaitingFirstCity.
    if (!process.env.REALDEF_NO_WAIT) await page.waitForFunction(() => true).then(async () => { const t0 = Date.now(); while (clusterStartSeen < 1 && Date.now() - t0 < 600000) await new Promise(r => setTimeout(r, 250)); });
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    assert.ok(await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity()), 'foundFirstCity=true');
    await page.waitForTimeout(3000);
    await closeCivWelcome(page);
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    assert.equal(c0.length, 1, 'dokladnie jedno miasto gracza na starcie');
    cityId = c0[0].id;
    settingsReadback = await page.evaluate(() => window.__settingsLive.getSettings());

    for (let i = 0; i < TURNS && !result; i++) {
      await closeModals(page);
      await clearBattles(page);
      const seen = new Set();
      await rejectAwaitingAiOffers(page, seen);
      await acceptForcedPeace(page, {}, null);
      const st = await readState(page, cityId);
      if (st.owner !== 0) {
        lossTurn = lossTurn ?? st.turn;
        result = { outcome: 'przegrana-miasto', turn: st.turn };
        notes.push('miasto nieobecne przed akcja tury (owner=' + st.owner + ')');
        break;
      }
      const af = affordability(st);
      if (af.goldOk && firstGoldTurn === null) firstGoldTurn = st.turn;
      if (af.both && firstBothTurn === null) firstBothTurn = st.turn;
      const barb = st.foreignNear.filter(u => u.owner !== 0);
      const dists = barb.map(u => hexDist({ q: u.q, r: u.r }, { q: st.cityQ, r: st.cityR }));
      const rec = {
        turn: st.turn, treasury: st.treasury, granary: st.granary, stock: st.stock,
        projSkarbDelta: st.forecast ? st.forecast.skarbPo - st.treasury : null,
        projFoodDelta: st.forecast ? st.forecast.spichlerzPo - st.granary : null,
        pracaRate: st.pracaRate, rows: st.rows, afford: af,
        playerMil: st.playerOnHex.filter(u => !MILITARY_EXCL.has(String(u.typeId).toLowerCase()) && u.category !== 'zwiadowca').length,
        playerOnHex: st.playerOnHex.map(u => u.typeId), recruitQueue: st.recruitQueue,
        foreignNear: barb.map(u => u.owner + ':' + u.typeId), barbMinDist: dists.length ? Math.min(...dists) : null,
        canEnd: st.canEnd, gateBlock: st.gateBlock,
      };
      turns.push(rec);
      fs.appendFileSync(path.join(OUT, 'turns.jsonl'), JSON.stringify({ seed: SEED, run: RUN, policy: POLICY, turn: st.turn, t: Math.round((Date.now() - T0) / 1000), treasury: st.treasury, granary: st.granary, projSkarbDelta: rec.projSkarbDelta, projFoodDelta: rec.projFoodDelta, canEnd0: st.canEnd, gateBlock0: st.gateBlock, playerMil: rec.playerMil, foreignNear: rec.foreignNear, barbMinDist: rec.barbMinDist, purchaseTurn }) + '\n');

      if (POLICY === 'dopen' || POLICY === 'dclose') {
        await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
        await page.waitForTimeout(400);
        if (POLICY === 'dclose') {
          await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (b) b.click(); });
          await page.waitForTimeout(300);
        }
      }
      if (POLICY === 'didle') {
        for (let w = 0; w < 8; w++) {
          await page.waitForTimeout(200);
          const q = await page.evaluate(() => ({ o: window.__defeatTestDebug.cityThreatProbe().map(c => c.ownerId), turn: window.__nnsMeasureDebug.gateInfo().turn, go: window.__defeatTestDebug.isGameOver(), bs: window.__aiTradeWiringTestDebug.battleState(), vic: !!document.querySelector('.vsc-overlay') }));
          idleTrace.push({ t: st.turn, w, ...q, bs: JSON.stringify(q.bs) });
        }
      }
      // P1/P2: dokladnie jedna proba zakupu REALNA sciezka UI, wylacznie gdy odczyt pokazuje, ze gracza STAC.
      if ((POLICY === 'p1' || POLICY === 'p2') && purchaseTurn === null && af.both) {
        await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
        await page.waitForTimeout(400);
        const tab = await page.evaluate(() => { const t = document.querySelector('button[aria-label="Jednostki do rekrutacji"]'); if (!t) return false; t.click(); return true; });
        await page.waitForTimeout(300);
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
        }, { names: UNIT_NAMES, want: af.cheapest });
        await page.waitForTimeout(300);
        purchaseClick = { turn: st.turn, tab, ...clicked };
        if (clicked.ok) purchaseTurn = st.turn;
        // Zamkniecie panelu realnym przyciskiem „Wróć na mapę” (jak gracz).
        const closed = await page.evaluate(() => { const b = document.querySelector('.civ-v-exit-map-btn') || document.getElementById('civ-v-exit-map-btn') || [...document.querySelectorAll('button')].find(x => /Wróć na mapę/i.test(x.textContent || '')); if (!b) return false; b.click(); return true; });
        purchaseClick.panelClosed = closed;
        await page.waitForTimeout(300);
        const after = await readState(page, cityId);
        purchaseClick.after = { owner: after.owner, turn: after.turn, treasury: after.treasury, stock: after.stock, recruitQueue: after.recruitQueue };
        logLine({ kind: 'p1-purchase', ...purchaseClick });
        if (after.owner !== 0) notes.push('po akcji P1 miasto nieobecne (owner=' + after.owner + ') -- INFRA/diagnoza');
      }

      // Bramka tury: tylko odczyt canEnd.
      let gp = await readState(page, cityId);
      for (let k = 0; k < 6 && !gp.canEnd; k++) {
        await closeModals(page); await clearBattles(page); await rejectAwaitingAiOffers(page, seen); await acceptForcedPeace(page, {}, null);
        await new Promise(r => setTimeout(r, 400));
        gp = await readState(page, cityId);
      }
      if (!gp.canEnd && !gp.gameOver) {
        const lev = await lowerRationUi(page, cityId);
        turns[turns.length - 1].lever = lev;
        logLine({ kind: 'lever-ration', turn: st.turn, ...lev });
        await closeModals(page); await clearBattles(page);
        gp = await readState(page, cityId);
        turns[turns.length - 1].canEndAfterLever = gp.canEnd;
        turns[turns.length - 1].gateAfterLever = gp.gateBlock;
        fs.appendFileSync(path.join(OUT, 'turns.jsonl'), JSON.stringify({ seed: SEED, run: RUN, turn: st.turn, lever: lev, canEndAfterLever: gp.canEnd, granaryAfter: gp.granary, treasuryAfter: gp.treasury, forecastSpichlerzPo: gp.forecast && gp.forecast.spichlerzPo, gateAfter: gp.gateBlock && gp.gateBlock.komunikat }) + '\n');
      }
      if (!gp.canEnd) {
        if (gp.gameOver) { result = { outcome: 'przegrana', turn: st.turn }; break; }
        const gdump = await page.evaluate(() => { const g = window.__nnsMeasureDebug.gateInfo(); return { gate: g.gate, forecast: g.forecast, treasury: g.treasury, granary: g.granary, taxSplit: window.__nnsMeasureDebug.getTaxSplit(), rations: window.__nnsMeasureDebug.cityRations(), podatekPunkty: g.podatekPunkty }; });
        notes.push('bramka tury: ' + JSON.stringify(gdump).slice(0, 900));
        logLine({ kind: 'gate-stop', turn: st.turn, ...gdump });
        result = { outcome: 'zatrzymanie', turn: st.turn, gate: gp.gateBlock };
        break;
      }
      // Koniec tury WYŁĄCZNIE klikiem przycisku w UI (bez haka civTest.endTurn — zakaz z dispatchu).
      // UWAGA: ścieżka klikana NIE ZWERYFIKOWANA na żywo w tej rundzie (patrz raport 10-operator, obrona r3).
      const clicked = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Zakończ turę/i.test(x.textContent || '') && !x.disabled); if (b) { b.click(); return true; } return false; });
      if (!clicked) { result = { outcome: 'brak-przycisku-konca-tury', turn: st.turn }; break; }
      await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), st.turn, { timeout: 180000, polling: 200 });
      await closeModals(page);
      completed += 1;
      const post = await readState(page, cityId);
      const mil = post.playerOnHex.filter(u => !MILITARY_EXCL.has(String(u.typeId).toLowerCase()) && u.category !== 'zwiadowca');
      // UWAGA (korekta obrony REALDEF4): mil liczy KAZDA jednostke wojskowa na miescie, takze startowego Wojownika
      // (konfiguracja domyslna startuje z Wojownikiem na miescie, max nie). Nie oznacza zakupionego obroncy.
      if (firstDefenderTurn === null && mil.length) firstDefenderTurn = post.turn;
      if (post.owner !== 0 && lossTurn === null) {
        lossTurn = post.turn;
        rec.lostAfterThisTurn = true;
        rec.postLoss = { owner: post.owner, turn: post.turn, barbNearAtStart: barb.length };
        result = { outcome: 'przegrana-miasto', turn: post.turn };
      }
      if (post.gameOver && !result) result = { outcome: 'przegrana', turn: post.turn };
    }
    if (!result) result = { outcome: 'dokonczone', turn: null };
    const last = await readState(page, cityId);
    const ownerAfter = last.owner;
    const infra = ownerAfter !== 0 && ownerAfter !== -1;
    let infraDiag = null;
    if (infra || POLICY.startsWith('d')) {
      infraDiag = await page.evaluate(() => ({
        cities: window.__defeatTestDebug.cityThreatProbe().map(c => c.id + ':' + c.ownerId),
        turn: window.__nnsMeasureDebug.gateInfo().turn, gameOver: window.__defeatTestDebug.isGameOver(),
        playerCities: window.__nnsMeasureDebug.playerCities(),
        body: (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 300),
      }));
    }
    const row = {
      kind: 'result', runda: 3, policy: POLICY, seed: SEED, run: RUN, barb: ADV.barbariansLevel, turnsRequested: TURNS, turnsCompleted: completed,
      ...result, cityOwnerAfter: ownerAfter, cityLost: ownerAfter !== 0, lossTurn, survived: ownerAfter === 0,
      conqueror: ownerAfter === -1 ? 'barbarzyncy' : (ownerAfter === 0 ? null : 'nieznany(owner=' + ownerAfter + ')'),
      firstGoldAffordTurn: firstGoldTurn, firstGoldAndStockAffordTurn: firstBothTurn,
      purchaseTurn, purchaseClick, taxProbe, infraDiag, navLog, worldWait: !process.env.REALDEF_NO_WAIT, mapGenLog, clusterStartSeen, idleTrace: infra ? idleTrace.slice(-24) : undefined, firstDefenderTurn,
      lastBarbNear: turns.length ? turns[turns.length - 1].foreignNear.length : null,
      errors: errors.length, notes,
      definicjaTury: 'turn=gateInfo().turn; tura_utraty = turn odczytany po ukonczeniu tury, w ktorej miasto zmienilo wlasciciela (= ukonczone tury + 1)',
      infra, powodNiewiarygodnosci: infra ? 'owner=' + ownerAfter + ': miasto nieobecne na liscie bez zdobywcy; przyczyna do diagnozy' : null,
      settingsReadback, turns,
    };
    logLine({ ...row, turns: undefined, settingsReadback: undefined });
    fs.appendFileSync(DANE, JSON.stringify(row) + '\n');
    console.log('REALDEFECON', JSON.stringify({ policy: POLICY, seed: SEED, run: RUN, outcome: result.outcome, lossTurn, firstGoldTurn, firstBothTurn, purchaseTurn, infra, errors: errors.length }));
    assert.deepEqual(errors, [], 'brak pageerror');
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('REALDEFECON FAIL', e.message); logLine({ kind: 'fail', message: e.message }); process.exit(1); });
