'use strict';
// UWAGA (REALDEF r3, 2026-11-27): ten runner (i defeat-cause-live.cjs) zaklada miasto zaraz po `startNewGame`, gdy `awaitingFirstCity()`
// jest juz true na swiecie STARTOWYM (podglad, 1008 heksow); swiat nowej gry (7992 heksow) podmienia stan po ok. 20 s.
// Wyniki z tego runnera NIE opisuja gry (patrz dyspozycje/analizy/OBRONA-STARTU-GRACZ-ROZSADNY-2026-11-27.md §1).
// Poprawny start (czekanie na log `[ClusterStart]`): gra/tools/realdef-econ-live.cjs.
// R-WEB-EARLY-DEFENSE-REALISTIC-Q1 (tag REALDEF), runda 2: przezywalnosc pierwszych 20 tur przy GRZE ROZSADNEGO
// GRACZA na MAKSIMUM (Trudny / dyplomacja trudna / Wysoki x4 / kultura trudny / barbarzyncy TRUDNY), zywa gra w Chromium.
//
// Polityki:
//  - p0 = pasywny (kontrola): bez zadnych akcji gracza, BEZ wymuszonego fortu (forceFortLive nie jest uzywany).
//  - p1 = budowa jednostki obronnej REALNA sciezka UI: w kazdej turze gracz otwiera panel miasta (openCityPanelForTest =
//         to samo co klikniecie miasta), klika zakladke „Jednostki do rekrutacji” i klika przycisk „.unit-recruit-submit”
//         najtanszej dostepnej jednostki wojskowej. Koszt, skarb, pula rekrutow i drewno sprawdza gra (przycisk jest
//         wylaczony, gdy brakuje czegos). Zadnych hakow tworzacych jednostki ani zmieniajacych skarb.
//  - p2 / p3 NIE sa zaimplementowane w tym runnerze (NIE ZMIERZONO, patrz raport).
//
// Haki civTest uzyte WYLACZNIE do odczytu i sterowania harnessem: __settingsLive.startNewGame/getSettings,
// __defeatTestDebug.cityThreatProbe/isGameOver, __nnsMeasureDebug.gateInfo/awaitingFirstCity/foundFirstCity,
// __hotSeatTestDebug.openCityPanelForTest (realne otwarcie panelu), __civTest.endTurn (kończenie tury).
// NIE uzywane: __siegeBlockTestDebug.tryPurchase (cheat: skarb 999999, pula 99999), forceFortLive,
// prepareEndTurnGate (podnosi skarb i spichlerz do progow — zmienia stan gry; tu tylko odczyt gateInfo().canEnd).
//
// Uruchomienie (z gra/): node tools/realdef-live.cjs <katalog_poza_repo> <p0|p1> <seed> [tury=20] [run=1]
// Wynik: linia `REALDEF {"kind":"result",...}` w logu <katalog>/realdef-<polityka>-s<seed>-r<run>.txt oraz wiersz
// w <katalog>/dane.jsonl. Logi *.txt nie sa commitowane.
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
if (!process.argv[2] || OUT.startsWith(path.resolve(GRA, '..')) || !['p0', 'p1'].includes(POLICY) || !Number.isFinite(SEED)) {
  console.error('Uzycie: <katalog_poza_repo> <p0|p1> <seed> [tury=20] [run=1]'); process.exit(2);
}
const LIVE_TOOL = path.join(GRA, 'tools', 'test-hook-setcitylimit-live-bundle.cjs');
const LOG = path.join(OUT, `realdef-${POLICY}-s${SEED}-r${RUN}.txt`);
const DANE = path.join(OUT, 'dane.jsonl');
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
// Nazwy jednostek z danych gry (tylko do rozpoznania wiersza karty w panelu; dane nie sa modyfikowane).
const UNIT_NAMES = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'units.json'), 'utf8')).map(u => u.Jednostka).filter(Boolean)
  .sort((a, b) => b.length - a.length);
// Kolejnosc wyboru jednostki wojskowej (P1): najtansze bez wymagan technologii najpierw (koszt bazowy Pieniadz: 3, 3, 5, 15).
const MIL_PRIORITY = ['Oszczepnik', 'Łucznik', 'Wojownik', 'Rydwan (woły)'];
const MILITARY_EXCL = new Set(['zwiadowca', 'osadnik', 'robotnik']);

function logLine(obj) {
  const line = 'REALDEF ' + JSON.stringify(obj);
  fs.appendFileSync(LOG, line + '\n');
  console.log(line);
}

const KEEP_RE = /Diag|Load\]|Save|Zapis|Victory|Oblezenie|[Bb]itw|[Bb]attle|zdob|[Pp]odb|[Bb]arbar|[Ww]ojn|[Ww]ar|[Cc]ession|[Cc]ytad|[Bb]unt|[Rr]ebel|Autosave\] rotacyjny|Ekonomia\] Tura/;

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

// Odczyt wierszy karty rekrutacji (tylko odczyt DOM). Nazwa wiersza = pierwsza z nazw jednostek, od ktorej zaczyna sie
// tekst najblizszego przodka przycisku „.unit-recruit-submit”.
function readRecruitRowsScript(names) {
  return ({ names }) => {
    const body = document.querySelector('.civ-v-recruit-body');
    if (!body) return { open: false, rows: [], pool: null, panel: null };
    const pool = document.querySelector('.unit-recruit-pool');
    const rows = [...body.querySelectorAll('.unit-recruit-submit')].map(b => {
      let name = null; let rowText = '';
      for (let p = b.parentElement; p && p !== body.parentElement; p = p.parentElement) {
        const t = (p.innerText || '').trim();
        const hit = names.find(n => t.startsWith(n));
        if (hit) { name = hit; rowText = t; break; }
      }
      return { name, disabled: !!b.disabled, text: rowText.replace(/\s+/g, ' ').slice(0, 140) };
    });
    return { open: true, rows, pool: pool && pool.dataset ? (pool.dataset.available ?? null) : null, panel: body.innerText.slice(0, 700) };
  };
}

async function readRecruitRows(page) {
  return page.evaluate(readRecruitRowsScript(UNIT_NAMES), { names: UNIT_NAMES });
}

async function probe(page, cityId) {
  return page.evaluate((id) => {
    const all = window.__defeatTestDebug.cityThreatProbe();
    const c = all.find(x => x.id === id);
    const gi = window.__nnsMeasureDebug.gateInfo();
    return {
      turn: gi.turn, treasury: gi.treasury, granary: gi.granary, canEnd: gi.canEnd, gate: gi.gate && gi.gate.blokada,
      gameOver: window.__defeatTestDebug.isGameOver(),
      owner: c ? c.ownerId : null,
      playerOnHex: c ? c.playerOnHex : [],
      foreignNear: c ? c.foreignNear : [],
      battle: window.__aiTradeWiringTestDebug.battleState(),
    };
  }, cityId);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  if (fs.existsSync(LOG)) fs.unlinkSync(LOG);
  const html = path.join(OUT, 'Gra-LIVE.html');
  if (!fs.existsSync(html)) execFileSync('node', [LIVE_TOOL, OUT], { cwd: GRA, stdio: 'pipe', timeout: 500000 });
  const browser = await chromium.launch({ headless: true, executablePath: resolveChromePath() || '/usr/bin/chromium', args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const endTurnBlocks = [];
  page.on('console', m => {
    const t = m.text();
    if (m.type() === 'warning' && /^\[EndTurn\] blocked/.test(t)) endTurnBlocks.push(t);
    if (KEEP_RE.test(t)) logLine({ kind: 'console', type: m.type(), text: t.slice(0, 260) });
  });
  let cityId = null;
  let lossTurn = null;
  let firstDefender = null;
  let purchaseTurn = null;
  let purchases = 0;
  let gateStops = 0;
  let barbNearMax = 0;
  let barbNearAtLoss = null;
  let barbNearOstatni = null; // ostatni pomiar barbarzyncow przed utrata (stan po turze, cityThreatProbe)
  let barbNearStartUtraty = null; // pomiar na poczatku tury utraty (pre.foreignNear)
  let completed = 0;
  let result = null;
  try {
    await page.goto('file://' + html + '?civTest=1', { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(() => !!window.__settingsLive, null, { timeout: 60000 });
    await page.evaluate((p) => window.__settingsLive.startNewGame(p), MAX_PARAMS);
    await page.waitForFunction(() => window.__nnsMeasureDebug.awaitingFirstCity() === true, null, { timeout: 600000, polling: 500 });
    const founded = await page.evaluate(() => window.__nnsMeasureDebug.foundFirstCity());
    assert.ok(founded, 'foundFirstCity=true');
    await page.waitForTimeout(4000);
    await closeCivWelcome(page);
    // Brak forceFortLive: zadna akcja harnessu nie stawia fortu ani nie zmienia stanu miasta.
    const c0 = await page.evaluate(() => window.__defeatTestDebug.cityThreatProbe().filter(c => c.ownerId === 0));
    assert.equal(c0.length, 1, 'dokladnie jedno miasto gracza na starcie');
    cityId = c0[0].id;
    const settingsReadback = await page.evaluate(() => window.__settingsLive.getSettings());
    const start = await probe(page, cityId);
    logLine({ kind: 'start', policy: POLICY, seed: SEED, run: RUN, adv: ADV, settingsReadback, cityId, turn: start.turn, treasury: start.treasury });

    for (let i = 0; i < TURNS && !result; i++) {
      await closeModals(page);
      await clearBattles(page);
      const seen = new Set();
      await rejectAwaitingAiOffers(page, seen);
      await acceptForcedPeace(page, {}, null);
      const pre = await probe(page, cityId);

      if (POLICY === 'p1' && pre.owner === 0) {
        // Realna sciezka produkcji: panel miasta -> zakladka rekrutacji -> przycisk najtanszej dostepnej jednostki wojskowej.
        await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
        await page.waitForTimeout(1200);
        let snap = { open: false, rows: [], pool: null, panel: null };
        const tabClicked = await page.evaluate(() => {
          const t = document.querySelector('button[aria-label="Jednostki do rekrutacji"]');
          if (!t) return false;
          t.click();
          return true;
        });
        await page.waitForTimeout(400);
        if (tabClicked) snap = await readRecruitRows(page);
        else logLine({ kind: 'recruit-error', turn: pre.turn, message: 'brak zakladki Jednostki do rekrutacji', tabClicked: false });
        let clicked = null;
        if (snap.open) {
          for (const name of MIL_PRIORITY) {
            const row = snap.rows.find(r => r.name === name && !r.disabled);
            if (!row) continue;
            clicked = await page.evaluate((nm) => {
              const body = document.querySelector('.civ-v-recruit-body');
              const btns = [...body.querySelectorAll('.unit-recruit-submit')];
              for (const b of btns) {
                let p = b.parentElement; let hit = null;
                for (; p && p !== body.parentElement; p = p.parentElement) {
                  if ((p.innerText || '').trim().startsWith(nm)) { hit = p; break; }
                }
                if (hit && !b.disabled) { b.click(); return nm; }
              }
              return null;
            }, name);
            if (clicked) break;
          }
          if (clicked) {
            purchases += 1;
            if (purchaseTurn === null) purchaseTurn = pre.turn;
            await page.waitForTimeout(300);
          }
        }
        logLine({ kind: 'recruit', turn: pre.turn, treasury: pre.treasury, open: snap.open, pool: snap.pool, clicked,
          rows: snap.rows.map(r => ({ n: r.name, d: r.disabled, t: r.text })), panel: snap.panel && snap.panel.slice(0, 500) });
        // Zamkniecie panelu miasta (ta sama sciezka co przycisk „Wróć na mapę”, jesli jest widoczny).
        // Panel zostaje otwarty (przycisk „WRÓĆ NA MAPĘ” nie jest klikany: w tym harnessie zamykanie panelu tym
        // przyciskiem zrywa stan sesji; NIE ZMIERZONO, czy to blad gry, czy artefakt haka).

      }

      // Miasto gracza zniknelo z listy miast (zdobyte/zniszczone podczas tury) = utrata, nie zatrzymanie harnessu.
      const alive = await probe(page, cityId);
      if (alive.owner === null || alive.owner !== 0) {
        lossTurn = lossTurn ?? pre.turn;
        barbNearAtLoss = barbNearAtLoss ?? barbNearOstatni;
        barbNearStartUtraty = barbNearStartUtraty ?? pre.foreignNear.filter(u => u.owner !== 0).length;
        result = { outcome: 'przegrana-miasto', turn: pre.turn };
        logLine({ kind: 'loss', turn: pre.turn, cityOwner: alive.owner, treasury: alive.treasury, note: 'miasto gracza nieobecne na liscie miast przed bramka tury' });
        break;
      }
      // Bramka tury: tylko odczyt canEnd (bez podnoszenia skarbu/spichlerza).
      let gp = await probe(page, cityId);
      for (let k = 0; k < 6 && !gp.canEnd; k++) {
        await closeModals(page);
        await clearBattles(page);
        await rejectAwaitingAiOffers(page, seen);
        await acceptForcedPeace(page, {}, null);
        await new Promise(r => setTimeout(r, 500));
        gp = await probe(page, cityId);
      }
      if (!gp.canEnd) {
        if (gp.gameOver) { result = { outcome: 'przegrana', turn: pre.turn }; break; }
        if (gp.owner === null) { lossTurn = lossTurn ?? pre.turn; result = { outcome: 'przegrana-miasto', turn: pre.turn }; break; }
        gateStops += 1;
        logLine({ kind: 'stop', reason: 'cannot-end', turn: pre.turn, gate: gp.gate, endTurnBlocks: endTurnBlocks.splice(0).slice(0, 3) });
        result = { outcome: 'zatrzymanie', turn: pre.turn };
        break;
      }
      await page.evaluate(() => window.__civTest.endTurn());
      await page.waitForFunction((t) => window.__nnsMeasureDebug.gateInfo().turn > t && !window.__nnsMeasureDebug.isEndTurnInProgress(), pre.turn, { timeout: 180000, polling: 200 });
      await closeModals(page);
      const post = await probe(page, cityId);
      completed += 1;
      const mil = post.playerOnHex.filter(u => !MILITARY_EXCL.has(String(u.typeId).toLowerCase()) && u.category !== 'zwiadowca');
      if (firstDefender === null && mil.length) firstDefender = { turn: post.turn, inGarnizon: mil.some(u => u.inGarnizon), units: mil.map(u => u.typeId) };
      const barbNear = post.foreignNear.filter(u => u.owner !== 0).length;
      barbNearOstatni = barbNear;
      barbNearMax = Math.max(barbNearMax, barbNear);
      logLine({ kind: 'turn', turn: post.turn, treasury: post.treasury, owner: post.owner, gameOver: post.gameOver,
        playerOnHex: post.playerOnHex.map(u => ({ t: u.typeId, g: u.inGarnizon })), barbNear, battle: post.battle, errors: errors.length,
        endTurnBlocks: endTurnBlocks.splice(0) });
      if (post.owner !== 0 && lossTurn === null) {
        // Definicja tury utraty (wspolna dla obu sciezek): tura_utraty = tury_ukonczone + 1,
        // czyli pierwsza tura, w ktorej stan gry pokazuje miasto utracone.
        lossTurn = post.turn;
        barbNearAtLoss = barbNear;
        barbNearStartUtraty = pre.foreignNear.filter(u => u.owner !== 0).length;
      }
      if (post.gameOver) { result = { outcome: 'przegrana', turn: post.turn }; }
    }
    if (!result) result = { outcome: 'dokonczone', turn: null };
    const last = await probe(page, cityId);
    const row = {
      kind: 'result', policy: POLICY, seed: SEED, run: RUN, barb: BARB_LEVEL, turnsRequested: TURNS, turnsCompleted: completed,
      ...result, cityOwnerAfter: last.owner, cityLost: last.owner !== 0, lossTurn,
      survived: last.owner === 0,
      firstDefenderTurn: firstDefender ? firstDefender.turn : null,
      firstDefenderInGarnizon: firstDefender ? firstDefender.inGarnizon : null,
      purchaseTurn, purchases, barbNearAtLoss, barbNearStartUtraty, barbNearMax, gateStops, errors: errors.length, fortForced: false,
      definicjaTury: 'tura_utraty = tury_ukonczone + 1 (pierwsza tura ze stanem utraty)',
      wiarygodny: last.owner === 0 || last.owner === -1,
      powodNiewiarygodnosci: (last.owner === 0 || last.owner === -1) ? null : 'owner null: miasto zniknelo z listy miast bez zdobywcy; przyczyna NIE ZMIERZONA',
    };
    logLine(row);
    fs.appendFileSync(DANE, JSON.stringify(row) + '\n');
    assert.deepEqual(errors, [], 'brak pageerror');
    logLine({ kind: 'done', policy: POLICY, seed: SEED, run: RUN, turnsCompleted: completed, errors: errors.length });
  } finally {
    await browser.close();
  }
}
main().catch(e => { console.error('REALDEF FAIL', e.message); logLine({ kind: 'fail', message: e.message }); process.exit(1); });
