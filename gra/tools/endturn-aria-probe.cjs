'use strict';
// R-WEB-EARLY-DEFENSE-MAX-GAPS-Q1 (tag REALDEF5, runda obrony 1): luki REALDEF4 na MAKSIMUM. Baza: REALDEF r3 (INWENTARZ EKONOMII STARTU gracza na MAKSIMUM)
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
//  - p3 = jak p1, ale w turze 1 suwak Skarb ustawiany fizycznym kliknieciem myszy (page.mouse) w prawy kraniec suwaka (bez haku setTaxSplit/dispatchEvent).
//  - p4 = jak p3, ale 'Zakoncz ture' w kazdej turze to fizyczny klik (page.mouse) przycisku button.end-turn[data-end].
//         BRAK fallbacku na hak w tym pliku (ENDARIA, poprawka dokumentacji): wiersz niesie clickEffective (true/false)
//         i clickNote (tekst strony, gdy klik nie zadzialal). W biegach ENDARIA wszystkie kliki byly skuteczne (clickNote=null).
//  - Haki SETUP (wywolywane przed pomiarem tury, nie sa to akcje gracza w turze): closeModals, clearBattles,
//         rejectAwaitingAiOffers, acceptForcedPeace (ten ostatni akceptuje wymuszony pokoj blokujacy ture — ograniczenie pomiaru).
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
// Uruchomienie (z gra/): node tools/realdef-max-gaps.cjs <katalog_poza_repo> <p0|p1|p2|p3|p4|dopen|dclose|didle> <seed> [tury=20] [run=1]
// Uwaga (REALDEF5): p2 uzywa haku setTaxSplit (zakazany w pomiarze) -- NIE uzywac do wynikow; wyniki REALDEF5 = p3/p4.
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
const TURNS = parseInt(process.argv[5] || '20', 10);
const RUN = parseInt(process.argv[6] || '1', 10);
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !['p0', 'p1', 'p2', 'p3', 'p4', 'dopen', 'dclose', 'didle'].includes(POLICY) || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> <p0|p1|p2|p3|p4|dopen|dclose|didle> <seed> [tury=12] [run=1]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `econ-${POLICY}-s${SEED}-r${RUN}.txt`);
const DANE = path.join(OUT, 'maxgaps.jsonl');
const BARB_LEVEL = process.env.DEFEAT_BARB_LEVEL || 'trudny';
const ADV = {
  barbariansLevel: BARB_LEVEL, battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
  kosztJednostekPace: 'wysoki', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30,
  landFractionCustom: false, cityStateDifficultyOverride: 'normal', cityLimitBase: 10,
  diplomacyWarLevel: 'trudna', kulturaReligiaLevel: 'trudny',
};
const MAX_PARAMS = {
  civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Trudny',
  mapSize: 'Maly', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
  mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
  renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 4, cityStatesCount: 2,
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
function forestCount(cq, cr, rad) {
  let n = 0;
  for (let dq = -rad; dq <= rad; dq++) {
    for (let dr = Math.max(-rad, -dq - rad); dr <= Math.min(rad, -dq + rad); dr++) {
      const h = window.__cityForestTestDebug.hexNakladka(cq + dq, cr + dr);
      if (h !== null && h === window.__cityForestTestDebug.lasValue()) n++;
    }
  }
  return n;
}

async function readState(page, cityId) {
  return page.evaluate(({ id, forestSrc }) => {
    const forestCount = new Function('return ' + forestSrc)();
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
      forestR5: c ? forestCount(c.q, c.r, 5) : null,
      forestR3: c ? forestCount(c.q, c.r, 3) : null,
      taxSplit: window.__nnsMeasureDebug.getTaxSplit(),
      battle: window.__aiTradeWiringTestDebug.battleState(),
    };
  }, { id: cityId, forestSrc: forestCount.toString() });
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
    const DANE_ARIA = path.join(OUT, 'endaria.jsonl');
    const rows = [];
    for (let i = 0; i < TURNS && i < 8; i++) {
      await closeModals(page);
      await clearBattles(page);
      const seen = new Set();
      await rejectAwaitingAiOffers(page, seen);
      await acceptForcedPeace(page, {}, null);
      const pre = await page.evaluate(() => {
        const b = document.querySelector('button[data-end]');
        const gi = window.__nnsMeasureDebug.gateInfo();
        const hint = document.querySelector('[data-et-hint]');
        let rect = null;
        if (b) { const r = b.getBoundingClientRect(); rect = { x: r.left + r.width / 2, y: r.top + r.height / 2, w: r.width, h: r.height }; }
        return {
          turn: gi.turn, canEnd: gi.canEnd, gateBlok: gi.gate && gi.gate.blokada, gameOver: window.__defeatTestDebug.isGameOver(),
          ariaDisabled: b ? b.getAttribute('aria-disabled') : null, disabledProp: b ? b.disabled : null,
          cls: b ? b.className : null, title: b ? (b.getAttribute('title') || '') : null,
          hintText: hint ? hint.textContent.replace(/\s+/g, ' ').trim().slice(0, 160) : null, rect,
        };
      });
      let clickEffective = null; let turnAfter = null; let clickNote = null; let immediate = null; let poll = null;
      if (pre.rect && pre.rect.w > 0) {
        await page.mouse.click(pre.rect.x, pre.rect.y);
        poll = [];
        for (let k = 0; k < 12; k++) {
          await page.waitForTimeout(500);
          poll.push(await page.evaluate(() => { const b = document.querySelector('button[data-end]'); const gi = window.__nnsMeasureDebug.gateInfo(); return (gi.canEnd ? 'C' : 'c') + (b && b.getAttribute('aria-disabled') === 'true' ? 'A' : 'a'); }));
        }
        immediate = await page.evaluate(() => {
          const b = document.querySelector('button[data-end]');
          const gi = window.__nnsMeasureDebug.gateInfo();
          return { turn: gi.turn, canEnd: gi.canEnd, ariaDisabled: b ? b.getAttribute('aria-disabled') : null };
        });
        const t0 = Date.now();
        while (Date.now() - t0 < 8000) {
          await page.waitForTimeout(250);
          const t = await page.evaluate(() => window.__nnsMeasureDebug.gateInfo().turn);
          if (t !== pre.turn) { turnAfter = t; break; }
        }
        clickEffective = turnAfter !== null;
        if (!clickEffective) clickNote = await page.evaluate(() => (document.body.innerText || '').replace(/\s+/g, ' ').slice(0, 200));
      } else {
        clickNote = 'brak prostokąta przycisku';
      }
      const row = { turn: pre.turn, canEnd: pre.canEnd, gateBlok: pre.gateBlok, ariaDisabled: pre.ariaDisabled, disabledProp: pre.disabledProp, cls: pre.cls, title: pre.title, hintText: pre.hintText, clickEffective, turnAfter, clickNote, immediate, poll: poll ? poll.join(' ') : null, seed: SEED };
      rows.push(row);
      fs.appendFileSync(DANE_ARIA, JSON.stringify(row) + '\n');
      console.log('ENDARIA', JSON.stringify(row));
      if (pre.gameOver) break;
    }
    assert.ok(rows.length > 0, 'brak wierszy');
    assert.deepEqual(errors, [], 'brak pageerror');
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('ENDARIA FAIL', e.message); process.exit(1); });
