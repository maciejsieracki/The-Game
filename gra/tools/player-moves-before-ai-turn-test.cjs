'use strict';
/**
 * player-moves-before-ai-turn-test.cjs — R-WEB-PLAYER-MOVES-BEFORE-AI-TURN-Q1.
 *
 * Regula wlasciciela: po „Koniec tury" NAJPIERW wszystkie mozliwe ruchy gracza (zakolejkowane marsze
 * wieloturowe wykorzystujace pozostaly zapas ruchu), POTEM tury AI/PM, POTEM ekonomia/nowa tura gracza.
 * Ruch gracza nie moze „dopalac sie" (animacja, odjecie ruchu, mgla) w trakcie tur innych cywilizacji.
 *
 * Warstwy:
 *  S. STRUKTURALNA — main.ts: faza ruchow gracza jest synchroniczna (bez animacji), poprzedza
 *     `runWorldEndTurn`, hot-seat dokancza ruchy konczacego fotela w `advanceSeat`. + MUTACJE (stary kod
 *     MUSI wywrocic asercje).
 *  L. ZYWA (Chromium, bundle w /dev/shm, `?playtest=mapa&civTest=1`) — REALNY `endTurn()`, log
 *     znacznikow faz `window.__civPhaseLog` (phaseMark w main.ts):
 *       L1 kolejnosc faz + brak animacji marszu i brak ANIM_FINISH po starcie swiata,
 *       L2 pozycje jednostek gracza nie zmieniaja sie po PLAYER_MOVES_END (brak ruchow w fazie AI),
 *       L3 marsz wieloturowy: przerwanie przez wroga na trasie,
 *       L4 zapis/wczytanie (round-trip) nie duplikuje ruchu,
 *       L5 hot-seat: ruchy fotela 1 dokanczane przy jego koncu tury, PRZED swiatem.
 *
 * Uruchomienie (z gra/): node tools/player-moves-before-ai-turn-test.cjs [--no-live] [--out DIR]
 *   --out DIR  uzyj gotowego bundla (vite build --outDir DIR) zamiast budowac wlasny.
 * Wyjscie: kod 0 = wszystko OK; != 0 = co najmniej jedna porazka (RED).
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const GRA = path.resolve(__dirname, '..');
const MAIN_SRC = path.join(GRA, 'src', 'main.ts');
const NO_LIVE = process.argv.includes('--no-live');
const outIdx = process.argv.indexOf('--out');
const OUT_ARG = outIdx > 0 ? process.argv[outIdx + 1] : null;

let pass = 0;
let fail = 0;
function ok(label, cond, detail) {
  if (cond) { pass++; console.log('  OK   ' + label); }
  else { fail++; console.error('  FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/* ---------------------------------------------------------------- S. strukturalna */
function fnBody(src, header) {
  const i = src.indexOf(header);
  if (i < 0) return '';
  let depth = 0;
  let started = false;
  const bodyStart = src.indexOf('): void {', i) >= 0 && (src.indexOf('): void {', i) - i) < 400
    ? src.indexOf('): void {', i) + 8 : src.indexOf('{', i);
  for (let k = bodyStart; k < src.length; k++) {
    const c = src[k];
    if (c === '{') { depth++; started = true; }
    else if (c === '}') { depth--; if (started && depth === 0) return src.slice(i, k + 1); }
  }
  return '';
}

/** Zwraca liste porazek (puste = OK) — uzywane tez przez mutacje. */
function structuralChecks(src) {
  const bad = [];
  const run = fnBody(src, 'function runPlannedMarchesAtPlayerEndTurn(').replace(/\/\/.*$/gm, '');
  if (!run) bad.push('S0 brak runPlannedMarchesAtPlayerEndTurn');
  if (/enqueueMarchSegments|processMarchQueue|executePlannedMarchesEndTurn|startAnimatedMove|executeMarchSegmentForUnit/.test(run)) {
    bad.push('S1 faza ruchow gracza uzywa sciezki ANIMOWANEJ (enqueue/processMarchQueue/startAnimatedMove)');
  }
  if (!/applyMarchSegmentInstant\(/.test(run)) bad.push('S2 faza ruchow gracza nie uzywa applyMarchSegmentInstant');

  const eht = fnBody(src, 'function endActiveHumanTurn(');
  const iMoves = eht.indexOf('runPlannedMarchesAtPlayerEndTurn(humanOwnerId');
  const iWait = eht.indexOf('PLAYER_BATTLE_WAIT_START');
  const iWorld = eht.indexOf('await runWorldEndTurn(humanOwnerId)');
  if (!(iMoves > 0 && iWorld > 0 && iMoves < iWorld)) bad.push('S3 ruchy gracza nie poprzedzaja runWorldEndTurn');
  if (!(iWait > iMoves && iWait < iWorld)) bad.push('S4 brak oczekiwania na okno bitwy gracza miedzy ruchami a swiatem');

  const adv = fnBody(src, 'function advanceSeat(');
  const iSeatRun = adv.indexOf('runPlannedMarchesAtPlayerEndTurn(activeId');
  const iSwitch = adv.indexOf('switchActiveHuman(nextSeat)');
  if (!(iSeatRun > 0 && iSwitch > iSeatRun)) bad.push('S5 hot-seat: ruchy konczacego fotela nie sa dokanczane przed przelaczeniem fotela');

  const rw = fnBody(src, 'async function runWorldEndTurn(').replace(/\/\/.*$/gm, '');
  if (/applyMarchSegmentInstant|runPlannedMarchesAtPlayerEndTurn|startAnimatedMove/.test(rw)) {
    bad.push('S6 runWorldEndTurn (swiat/AI) nie moze wykonywac ruchow gracza');
  }
  return bad;
}

function structuralLayer() {
  console.log('[S] strukturalna + mutacje');
  const src = fs.readFileSync(MAIN_SRC, 'utf8');
  const bad = structuralChecks(src);
  ok('S: main.ts spelnia wszystkie asercje strukturalne', bad.length === 0, bad);

  // Mutacja jest „wykryta" TYLKO gdy wprowadza NOWA porazke o oczekiwanym kodzie, ktorej nie bylo w
  // zrodle niezmutowanym. Wynik nie zalezy wiec od tego, czy zrodlo i tak ma INNE porazki (np. dawna baza
  // f568e1ed3 przechodzila stary warunek M2 tylko dlatego, ze padala juz na S1/S4/S5).
  const baseline = new Set(bad.map((b) => b.slice(0, 2)));
  const mutate = (label, code, fn) => {
    const m = fn(src);
    const added = structuralChecks(m).map((b) => b.slice(0, 2)).filter((c) => !baseline.has(c));
    ok('MUTACJA ' + label + ' — wykryta (nowa porazka ' + code + ')', m !== src && added.includes(code), { changed: m !== src, added });
  };
  mutate('M1 (powrot do enqueueMarchSegments w fazie gracza)', 'S1', (s) =>
    s.replace('      syncGeneralMarchTargets();\n      for (const u of units) {\n        if (u.ownerId !== humanOwnerId || !plannedMarches.has(u.id)) continue;',
      '      syncGeneralMarchTargets();\n      enqueueMarchSegments([]);\n      for (const u of units) {\n        if (u.ownerId !== humanOwnerId || !plannedMarches.has(u.id)) continue;'));
  mutate('M2 (ruchy gracza PO swiecie)', 'S3', (s) =>
    s.replace('        runPlannedMarchesAtPlayerEndTurn(humanOwnerId);\n', '').replace('        await runWorldEndTurn(humanOwnerId);',
      '        await runWorldEndTurn(humanOwnerId);\n        runPlannedMarchesAtPlayerEndTurn(humanOwnerId);'));
  mutate('M3 (brak oczekiwania na bitwe)', 'S4', (s) => s.replace("phaseMark('PLAYER_BATTLE_WAIT_START')", "phaseMark('X')"));
  mutate('M4 (hot-seat: brak dokonczenia ruchow fotela)', 'S5', (s) => s.replace('runPlannedMarchesAtPlayerEndTurn(activeId, {', 'void ({'));
  mutate('M5 (hot-seat: marsz fotela PO przelaczeniu fotela)', 'S5', (s) =>
    s.replace('runPlannedMarchesAtPlayerEndTurn(activeId, {', 'void ({').replace('        switchActiveHuman(nextSeat);',
      '        switchActiveHuman(nextSeat);\n        runPlannedMarchesAtPlayerEndTurn(activeId, {});'));
}

/* ---------------------------------------------------------------- L. zywa */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Wspolny dla scenariuszy: rejestr faz + sledzenie pozycji jednostek. */
const INSTALL_LOG = `(ids) => {
  // Kazdy znacznik fazy (phaseMark -> log.push) dostaje SYNCHRONICZNA migawke pozycji sledzonych jednostek
  // (a nie odczyt z timera, ktory opoznia sie, gdy glowny watek jest zajety).
  const log = [];
  log.push = function (e) {
    e.pos = ids.map((id) => { const st = window.__playerMovesTestDebug.unitState(id); return st ? st.q + ',' + st.r : null; });
    return Array.prototype.push.call(this, e);
  };
  window.__civPhaseLog = log;
}`;

async function openGame(browser, outDir) {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.endTurnLogs = [];
  page.on('console', (m) => { const t = m.text(); if (t.includes('[EndTurn]')) page.endTurnLogs.push(t.slice(0, 160)); });
  await page.goto('file://' + outDir + '/index.html?playtest=mapa&civTest=1', { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1 && window.__playerMovesTestDebug && window.__civTest,
    null, { timeout: 180000 });
  await page.waitForTimeout(1500);
  return { page, errors };
}

async function waitEndTurnDone(page) {
  await page.waitForTimeout(300);
  for (let i = 0; i < 120; i++) {
    const busy = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (!busy) break;
    await sleep(500);
  }
  await page.waitForTimeout(1500); // dopalanie animacji z renderLoop, gdyby jakies zostaly
}

/** Znajduje heks w odleglosci `dist` od (q,r) o terenie przejezdnym (rownina/laka). */
async function pickDest(page, q, r, dist, skip) {
  return page.evaluate(({ q, r, dist, skip }) => {
    const d = (a, b, c, e) => (Math.abs(a - c) + Math.abs(b - e) + Math.abs(a + b - c - e)) / 2;
    const hs = window.__civTest.around(q, r, dist);
    const c = hs.filter((h) => d(q, r, h.q, h.r) === dist && (h.teren === 'rownina' || h.teren === 'laka')
      && !skip.includes(h.q + ',' + h.r));
    return c.length ? { q: c[0].q, r: c[0].r } : null;
  }, { q, r, dist, skip: skip || [] });
}

/** True gdy po znaczniku `k` zadna migawka pozycji nie rozni sie od migawki przy `k`. */
function posStableAfter(log, k) {
  const i = idx(log, k);
  if (i < 0) return false;
  const ref = JSON.stringify(log[i].pos);
  return log.slice(i + 1).every((e) => JSON.stringify(e.pos) === ref);
}

function idx(log, k, from) { return log.findIndex((e, i) => e.k === k && i >= (from || 0)); }

async function scenarioSingleSeat(browser, outDir) {
  console.log('[L1-L4] jeden fotel: marsze gracza vs faza AI');
  const { page, errors } = await openGame(browser, outDir);
  try {
    // Trzy jednostki na ROZNYCH heksach przy miescie (jednostki na jednym heksie ruszaja sie jako stos).
    const setup = await page.evaluate(() => {
      const s = window.__civTest.state();
      const me = s.cities.find((c) => c.ownerId === 0);
      const near = window.__civTest.around(me.q, me.r, 1)
        .filter((h) => (h.q !== me.q || h.r !== me.r) && (h.teren === 'rownina' || h.teren === 'laka'));
      const ids = near.slice(0, 3).map((h) => window.__civTest.addUnit(0, h.q, h.r, false));
      return { me, starts: near.slice(0, 3).map((h) => ({ q: h.q, r: h.r })), u1: ids[0], u2: ids[1], u3: ids[2] };
    });
    const ok0 = !!(setup.u1 && setup.u2 && setup.u3);
    const dest1 = ok0 ? await pickDest(page, setup.starts[0].q, setup.starts[0].r, 2, []) : null;
    const dest2 = ok0 ? await pickDest(page, setup.starts[1].q, setup.starts[1].r, 2, [dest1 && dest1.q + ',' + dest1.r]) : null;
    const farDest = ok0 ? await pickDest(page, setup.starts[2].q, setup.starts[2].r, 6, []) : null;
    const u3 = setup.u3;
    ok('L0 scenariusz: 3 jednostki na roznych heksach i cele znalezione', !!(ok0 && dest1 && dest2 && farDest), { setup, dest1, dest2, farDest });
    if (!(ok0 && dest1 && dest2 && farDest)) return;
    await page.evaluate(({ u1, u2, u3, dest1, dest2, farDest }) => {
      const t = window.__playerMovesTestDebug;
      t.queueMarch(u1, dest1.q, dest1.r);
      t.queueMarch(u2, dest2.q, dest2.r);
      t.queueMarch(u3, farDest.q, farDest.r);
    }, { u1: setup.u1, u2: setup.u2, u3, dest1, dest2, farDest });
    // L4 (zapis/wczytanie W SRODKU zakolejkowanych marszow, przed koncem tury): stan i plany bez zmian.
    const preSave = await page.evaluate((ids) => ids.map((i) => window.__playerMovesTestDebug.unitState(i)), [setup.u1, setup.u2, u3]);
    await page.evaluate(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
    await page.waitForTimeout(500);
    const postLoad = await page.evaluate((ids) => ids.map((i) => window.__playerMovesTestDebug.unitState(i)), [setup.u1, setup.u2, u3]);
    const plansAfterLoad = await page.evaluate((ids) => ids.map((i) => window.__playerMovesTestDebug.hasMarch(i)), [setup.u1, setup.u2, u3]);
    ok('L4a round-trip zapisu przed koncem tury: pozycje i ruch bez zmian (nic nie wykonane w trakcie wczytania)',
      JSON.stringify(preSave) === JSON.stringify(postLoad), { preSave, postLoad });
    ok('L4b round-trip zapisu: wszystkie 3 plany marszu zachowane', plansAfterLoad.every(Boolean), plansAfterLoad);
    const before = postLoad;
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([setup.u1, setup.u2, u3])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); });
    await waitEndTurnDone(page);
    const log = await page.evaluate(() => { return window.__civPhaseLog; });
    const after = await page.evaluate((ids) => ids.map((i) => window.__playerMovesTestDebug.unitState(i)), [setup.u1, setup.u2, u3]);
    console.log('  log faz: ' + log.map((e) => e.k + (e.d ? '(' + e.d + ')' : '') + '@' + e.t).join(' | '));

    const iStart = idx(log, 'PLAYER_MOVES_START');
    const iEnd = idx(log, 'PLAYER_MOVES_END');
    const iWorld = idx(log, 'WORLD_START');
    const iEco = idx(log, 'ECONOMY');
    const iAiS = idx(log, 'AI_START');
    const iAiC = idx(log, 'AI_CIV_START');
    const iAiE = idx(log, 'AI_END');
    const iBegin = idx(log, 'PLAYER_TURN_BEGIN');
    ok('L1a kolejnosc faz: ruchy gracza < swiat < ekonomia < AI < koniec AI < nowa tura gracza',
      iStart >= 0 && iStart < iEnd && iEnd < iWorld && iWorld < iEco && iEco < iAiS && iAiS <= iAiC && iAiC < iAiE && iAiE < iBegin,
      { iStart, iEnd, iWorld, iEco, iAiS, iAiC, iAiE, iBegin });
    ok('L1b zadnej animowanej sciezki marszu w koncu tury (PLAYER_MARCH_ANIM_START)', idx(log, 'PLAYER_MARCH_ANIM_START') < 0);
    ok('L1c wszystkie 3 marsze wykonane natychmiast PRZED swiatem',
      log.filter((e, i) => e.k === 'PLAYER_MARCH_INSTANT' && i > iStart && i < iEnd).length === 3,
      log.filter((e) => e.k === 'PLAYER_MARCH_INSTANT').length);
    ok('L1d brak ANIM_FINISH po starcie swiata', !log.some((e, i) => e.k === 'ANIM_FINISH' && i > iWorld),
      log.filter((e) => e.k === 'ANIM_FINISH'));
    ok('L2a pozycje jednostek gracza przy KAZDYM znaczniku po PLAYER_MOVES_END == pozycje z PLAYER_MOVES_END (faza AI nie dopala ruchow)',
      posStableAfter(log, 'PLAYER_MOVES_END'), log.map((e) => e.k + ':' + JSON.stringify(e.pos)));
    ok('L2b jednostki u1,u2 faktycznie poruszone w fazie ruchow gracza',
      (before[0].q !== after[0].q || before[0].r !== after[0].r)
        && (before[1].q !== after[1].q || before[1].r !== after[1].r), { before, after });
    ok('L2c ruch odnowiony na nowa ture (ruchLeft == ruch) dla wszystkich 3',
      after.every((s) => s.ruchLeft === s.ruch), after);

    // u3 (marsz wieloturowy, cel 6 heksow): po 1 turze posuniety o <= ruch i NADAL zakolejkowany
    const hex = (a, b, c, e) => (Math.abs(a - c) + Math.abs(b - e) + Math.abs(a + b - c - e)) / 2;
    const stepped = hex(before[2].q, before[2].r, after[2].q, after[2].r);
    ok('L4c u3: po 1 turze posuniety o 1..ruch heksow (jeden segment, nie dwa) i plan nadal zakolejkowany',
      stepped >= 1 && stepped <= before[2].ruch && (await page.evaluate((id) => window.__playerMovesTestDebug.hasMarch(id), u3)),
      { stepped, ruch: before[2].ruch });
    // round-trip PO turze: bez zmian (brak wtornego wykonania ruchu przy wczytaniu)
    await page.evaluate(() => window.__pracaPoolSaveLoadTestDebug.roundTrip());
    await page.waitForTimeout(500);
    const afterLoad2 = await page.evaluate((ids) => ids.map((i) => window.__playerMovesTestDebug.unitState(i)), [setup.u1, setup.u2, u3]);
    ok('L4d round-trip zapisu po turze: pozycje/ruch bez zmian (idempotencja)', JSON.stringify(afterLoad2) === JSON.stringify(after), { after, afterLoad2 });
    ok('brak bledow strony', errors.length === 0, errors.slice(0, 3));
  } finally {
    await page.close();
  }
}

async function scenarioEnemyOnRoute(browser, outDir) {
  console.log('[L3] marsz z wrogiem na trasie (stan wojny): przerwanie/obejscie w fazie gracza, nie w fazie AI');
  const { page, errors } = await openGame(browser, outDir);
  try {
    const sc = await page.evaluate(() => {
      const d = (a, b, c, e) => (Math.abs(a - c) + Math.abs(b - e) + Math.abs(a + b - c - e)) / 2;
      const me = window.__civTest.state().cities.find((c) => c.ownerId === 0);
      const land = (h) => h.teren === 'rownina' || h.teren === 'laka';
      const around = window.__civTest.around(me.q, me.r, 6).filter(land);
      const start = around.find((h) => d(me.q, me.r, h.q, h.r) === 1);
      let dest = null;
      let foe = null;
      for (const cand of around.filter((h) => d(start.q, start.r, h.q, h.r) === 4)) {
        const mid = around.find((h) => d(start.q, start.r, h.q, h.r) === 2 && d(h.q, h.r, cand.q, cand.r) === 2);
        if (mid) { dest = cand; foe = mid; break; }
      }
      if (!start || !dest || !foe) return { fail: true, start: !!start };
      window.__civTest.setWar(0, 1);
      const id = window.__civTest.addUnit(0, start.q, start.r, false);
      const foeId = window.__civTest.addUnit(1, foe.q, foe.r, false);
      window.__playerMovesTestDebug.queueMarch(id, dest.q, dest.r);
      return { id, foeId, start: { q: start.q, r: start.r }, dest: { q: dest.q, r: dest.r }, foe: { q: foe.q, r: foe.r } };
    });
    ok('L3a scenariusz z wrogiem na trasie przygotowany', !!(sc && sc.id && sc.foeId), sc);
    if (!(sc && sc.id && sc.foeId)) return;
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([sc.id, sc.foeId])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); });
    await waitEndTurnDone(page);
    const log = await page.evaluate(() => window.__civPhaseLog);
    console.log('  log faz: ' + log.map((e) => e.k + (e.d ? '(' + e.d + ')' : '') + ':' + JSON.stringify(e.pos)).join(' | '));
    const iEnd = idx(log, 'PLAYER_MOVES_END');
    const iWorld = idx(log, 'WORLD_START');
    ok('L3b ruchy gracza (lub ich przerwanie) zakonczone PRZED swiatem; zero ANIM po starcie swiata',
      iEnd >= 0 && iEnd < iWorld && !log.some((e, i) => e.k === 'ANIM_FINISH' && i > iWorld) && idx(log, 'PLAYER_MARCH_ANIM_START') < 0,
      log.map((e) => e.k));
    const mine = log.map((e) => e.pos && e.pos[0]);
    ok('L3c jednostka gracza nigdy nie weszla na heks wroga',
      !mine.includes(sc.foe.q + ',' + sc.foe.r), mine);
    ok('L3d pozycja jednostki gracza przy znacznikach AI == pozycja z konca fazy ruchow gracza',
      log.filter((e, i) => i > iEnd).every((e) => e.pos[0] === log[iEnd].pos[0]), mine);
    ok('brak bledow strony (L3)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await page.close();
  }
}

async function scenarioHotSeat(browser, outDir) {
  console.log('[L5] hot-seat: ruchy konczacego fotela dokanczane przed swiatem');
  const { page, errors } = await openGame(browser, outDir);
  try {
    const setup = await page.evaluate(() => {
      const s = window.__civTest.state();
      const c0 = s.cities.find((c) => c.ownerId === 0);
      const c1 = s.cities.find((c) => c.ownerId === 1);
      window.__hotSeatTestDebug.seedSecondSeat(1, { reassignCityId: c1.id });
      const a = window.__civTest.addUnit(0, c0.q, c0.r, false);
      return { c0, c1, a };
    });
    const destA = await pickDest(page, setup.c0.q, setup.c0.r, 2, []);
    ok('L5a scenariusz hot-seat przygotowany', !!(setup.a && destA), setup);
    if (!(setup.a && destA)) return;
    await page.evaluate(({ a, destA }) => window.__playerMovesTestDebug.queueMarch(a, destA.q, destA.r), { a: setup.a, destA });
    const before = await page.evaluate((id) => window.__playerMovesTestDebug.unitState(id), setup.a);
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([setup.a])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); }); // fotel 0 konczy
    await page.waitForTimeout(1500);
    const log = await page.evaluate(() => window.__civPhaseLog);
    const mid = await page.evaluate((id) => window.__playerMovesTestDebug.unitState(id), setup.a);
    console.log('  log faz (fotel 0 konczy): ' + log.map((e) => e.k + (e.d ? '(' + e.d + ')' : '')).join(' | '));
    ok('L5b fotel 0 skonczyl ture: jego zakolejkowany marsz zostal wykonany (nie przepadl)',
      mid.q !== before.q || mid.r !== before.r, { before, mid });
    ok('L5c to jeszcze NIE jest swiat (runda niekompletna): brak WORLD_START, jest SEAT_MOVES przed przelaczeniem',
      idx(log, 'WORLD_START') < 0 && idx(log, 'SEAT_MOVES_START') >= 0 && idx(log, 'SEAT_MOVES_START') < idx(log, 'SEAT_MOVES_END'), log.map((e) => e.k));
    const active = await page.evaluate(() => window.__hotSeatTestDebug.snapshotHumanSeatsForTest().activeHumanOwnerId);
    ok('L5d aktywny jest fotel 1', active === 1, active);
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([setup.a])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); }); // fotel 1 konczy -> swiat
    await waitEndTurnDone(page);
    const log2 = await page.evaluate(() => { return window.__civPhaseLog; });
    console.log('  log faz (fotel 1 konczy): ' + log2.map((e) => e.k + (e.d ? '(' + e.d + ')' : '')).join(' | '));
    const end = await page.evaluate((id) => window.__playerMovesTestDebug.unitState(id), setup.a);
    ok('L5e swiat po ostatnim fotelu: ruchy PRZED swiatem, zadnych zmian pozycji po PLAYER_MOVES_END',
      idx(log2, 'PLAYER_MOVES_START') < idx(log2, 'WORLD_START')
      && posStableAfter(log2, 'PLAYER_MOVES_END'), log2.map((e) => e.k));
    ok('L5f jednostka fotela 0 nie przesunieta ponownie w tej samej turze (idempotencja: stoi w celu albo dalej)',
      end.q === mid.q && end.r === mid.r, { mid, end });
    ok('brak bledow strony (hot-seat)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await page.close();
  }
}

/** Scenariusz wspolny L6/L7: jednostka gracza (fotel 0) z marszem-z-atakiem na widocznego wroga w odleglosci 3. */
async function setupMarchAttack(page) {
  return page.evaluate(() => {
    const d = (a, b, c, e) => (Math.abs(a - c) + Math.abs(b - e) + Math.abs(a + b - c - e)) / 2;
    const me = window.__civTest.state().cities.find((c) => c.ownerId === 0);
    const land = (h) => h.teren === 'rownina' || h.teren === 'laka';
    const around = window.__civTest.around(me.q, me.r, 6).filter(land);
    const start = around.find((h) => d(me.q, me.r, h.q, h.r) === 1);
    const foe = start && around.find((h) => d(start.q, start.r, h.q, h.r) === 3);
    if (!start || !foe) return { fail: true };
    window.__civTest.setWar(0, 1);
    const id = window.__civTest.addUnit(0, start.q, start.r, false);
    const foeId = window.__civTest.addUnit(1, foe.q, foe.r, false);
    const queued = window.__playerMovesTestDebug.queueMarchAttack(id, foeId);
    return { id, foeId, queued, start: { q: start.q, r: start.r }, foe: { q: foe.q, r: foe.r } };
  });
}

async function scenarioBattleWait(browser, outDir) {
  console.log('[L6] marsz-z-atakiem otwiera okno bitwy W FAZIE GRACZA; swiat/AI czeka na jego zamkniecie');
  const { page, errors } = await openGame(browser, outDir);
  try {
    const sc = await setupMarchAttack(page);
    ok('L6a scenariusz marszu-z-atakiem przygotowany', !!(sc && sc.id && sc.foeId && sc.queued), sc);
    if (!(sc && sc.id && sc.foeId && sc.queued)) return;
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([sc.id, sc.foeId])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); });
    let opened = false;
    for (let i = 0; i < 60 && !opened; i++) { await sleep(250); opened = await page.evaluate(() => window.__playerMovesTestDebug.battleOpen()); }
    ok('L6b okno bitwy gracza otwarte przez marsz-z-atakiem (faza ruchow gracza)', opened);
    // Okno otwarte ~3 s: swiat/AI NIE moze ruszyc (brak WORLD_START), a koniec tury wciaz trwa.
    await sleep(3000);
    const midLog = await page.evaluate(() => window.__civPhaseLog.map((e) => e.k));
    const stillOpen = await page.evaluate(() => window.__playerMovesTestDebug.battleOpen());
    ok('L6c przy otwartym oknie bitwy: jest PLAYER_BATTLE_WAIT_START, brak WORLD_START/AI_START',
      stillOpen && midLog.includes('PLAYER_MOVES_END') && midLog.includes('PLAYER_BATTLE_WAIT_START')
      && !midLog.includes('WORLD_START') && !midLog.includes('AI_START'), { stillOpen, midLog });
    // Gracz rozstrzyga bitwe (Auto) -- dopiero wtedy rusza swiat.
    const clicked = await page.evaluate(() => {
      const b = document.querySelector('[data-act="auto"]');
      if (b) { b.click(); return true; }
      return false;
    });
    ok('L6d przycisk Auto okna bitwy znaleziony i kliknięty', clicked);
    await waitEndTurnDone(page);
    const log = await page.evaluate(() => window.__civPhaseLog);
    console.log('  log faz: ' + log.map((e) => e.k + (e.d ? '(' + e.d + ')' : '')).join(' | '));
    const iEnd = idx(log, 'PLAYER_MOVES_END');
    const iW0 = idx(log, 'PLAYER_BATTLE_WAIT_START');
    const iW1 = idx(log, 'PLAYER_BATTLE_WAIT_END');
    const iWorld = idx(log, 'WORLD_START');
    ok('L6e kolejnosc: ruchy gracza < czekanie na bitwe < koniec czekania < swiat < nowa tura gracza',
      iEnd >= 0 && iEnd < iW0 && iW0 < iW1 && iW1 < iWorld && iWorld < idx(log, 'PLAYER_TURN_BEGIN'),
      { iEnd, iW0, iW1, iWorld });
    // (battleOpen() po PLAYER_TURN_BEGIN nie jest asercja: w fazie swiata wrog sasiadujacy z jednostka moze
    // sam otworzyc kolejne okno bitwy -- to osobna, poprawna bitwa AI, nie z fazy ruchow gracza.)
    ok('L6f po rozstrzygnieciu bitwy gracza swiat doszedl do konca i tura gracza sie rozpoczela',
      idx(log, 'AI_END') > iWorld && idx(log, 'PLAYER_TURN_BEGIN') > idx(log, 'AI_END'));
    ok('brak bledow strony (L6)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await page.close();
  }
}

async function scenarioHotSeatMarchAttack(browser, outDir) {
  console.log('[L7] hot-seat: marsz-z-atakiem konczacego fotela dochodzi do celu, ale NIE odpala ataku (ZALOZENIE)');
  const { page, errors } = await openGame(browser, outDir);
  try {
    await page.evaluate(() => {
      const c1 = window.__civTest.state().cities.find((c) => c.ownerId === 1);
      window.__hotSeatTestDebug.seedSecondSeat(1, { reassignCityId: c1.id });
    });
    const sc = await setupMarchAttack(page);
    ok('L7a scenariusz hot-seat z marszem-z-atakiem przygotowany', !!(sc && sc.id && sc.foeId && sc.queued), sc);
    if (!(sc && sc.id && sc.foeId && sc.queued)) return;
    await page.evaluate(`(${INSTALL_LOG})(${JSON.stringify([sc.id, sc.foeId])})`);
    await page.evaluate(() => { window.__civTest.endTurn(); }); // fotel 0 konczy
    await page.waitForTimeout(2500);
    const log = await page.evaluate(() => window.__civPhaseLog);
    const st = await page.evaluate((id) => window.__playerMovesTestDebug.unitState(id), sc.id);
    const hex = (a, b, c, e) => (Math.abs(a - c) + Math.abs(b - e) + Math.abs(a + b - c - e)) / 2;
    console.log('  log faz (fotel 0): ' + log.map((e) => e.k + (e.d ? '(' + e.d + ')' : '')).join(' | '));
    ok('L7b marsz dotarl do pola sasiadujacego z wrogiem (odleglosc 1) -- nie przepadl', st && hex(st.q, st.r, sc.foe.q, sc.foe.r) === 1, { st, foe: sc.foe });
    ok('L7c ZALOZENIE: ataku z marszu NIE odpalono (zero okna bitwy, brak czekania na bitwe, brak WORLD_START)',
      !(await page.evaluate(() => window.__playerMovesTestDebug.battleOpen()))
      && idx(log, 'PLAYER_BATTLE_WAIT_START') < 0 && idx(log, 'WORLD_START') < 0 && idx(log, 'SEAT_MOVES_END') > 0, log.map((e) => e.k));
    // Dokumentacja ISTNIEJACEGO zachowania hot-seat (main.ts `switchActiveHuman` KROK 2: `plannedMarches.clear()` —
    // „marsze: zamknij, nie przywracaj"): po zmianie fotela plan marszu konczacego fotela jest zamykany, wiec ten
    // jedyny segment w `advanceSeat` to jedyna szansa jego wykonania. Atak z marszu zatem nie przetrwa zmiany fotela
    // niezaleznie od tego tematu (dawniej przepadal tez sam ruch).
    ok('L7d plan marszu fotela zamkniety przy przelaczeniu fotela (istniejaca regula KROK 2, nie regresja)',
      await page.evaluate((id) => !window.__playerMovesTestDebug.hasMarch(id), sc.id));
    const active = await page.evaluate(() => window.__hotSeatTestDebug.snapshotHumanSeatsForTest().activeHumanOwnerId);
    ok('L7e aktywny jest fotel 1 (okno bitwy nie wyciekło na kolejny fotel)', active === 1, active);
    ok('brak bledow strony (L7)', errors.length === 0, errors.slice(0, 3));
  } finally {
    await page.close();
  }
}

async function liveLayer() {
  console.log('[L] zywa (Chromium)');
  let outDir = OUT_ARG;
  let built = false;
  if (!outDir) {
    outDir = '/dev/shm/pmb-live-' + process.pid;
    execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${outDir} --emptyOutDir`, { cwd: GRA, stdio: 'pipe', timeout: 500000 });
    built = true;
  }
  const { chromium } = require(path.join(GRA, 'node_modules', 'playwright'));
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox', '--headless=new'] });
  try {
    await scenarioSingleSeat(browser, outDir);
    await scenarioEnemyOnRoute(browser, outDir);
    await scenarioHotSeat(browser, outDir);
    await scenarioBattleWait(browser, outDir);
    await scenarioHotSeatMarchAttack(browser, outDir);
  } finally {
    await browser.close();
    if (built) fs.rmSync(outDir, { recursive: true, force: true });
  }
}

(async () => {
  structuralLayer();
  if (NO_LIVE) console.log('[L] POMINIETA (--no-live)');
  else await liveLayer();
  console.log(`\nWYNIK: ${pass} OK, ${fail} FAIL`);
  process.exit(fail === 0 ? 0 : 1);
})().catch((e) => { console.error('BLAD TESTU', e); process.exit(2); });
