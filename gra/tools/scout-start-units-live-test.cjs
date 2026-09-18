'use strict';
/**
 * scout-start-units-live-test.cjs — R-STARTOWE-ZWIADOWCA-PO-JEDNYM-Q1.
 *
 * RED/GREEN gate for the universal one-scout start rule. It starts a real new
 * game, founds the capital through the real tryFoundPlayerCityAt() path, and
 * reads raw cities/units state from the existing live-game test hook. The
 * hook only supplies ordinary new-game inputs and exposes state; it never
 * appends the scout under test.
 *
 * Run from gra/:
 *   node tools/scout-start-units-live-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');

const GRA_DIR = path.resolve(__dirname, '..');
const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const OUT_DIR = path.join(os.tmpdir(), `civ-scout-start-units-${RUN_ID}`);
const OUT_HTML = `file://${path.join(OUT_DIR, 'index.html')}`;
const FALLBACK_CHROME = process.env.SCOUT_CHROME_PATH
  || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const CITY_STATES_COUNT = 4;
const GAME_DIFFICULTIES = ['easy', 'normal', 'hard'];
const EXPECTED_PLAYER_MILITARY = { easy: 2, normal: 1, hard: 0 };
const EXPECTED_MAJOR_AI_MILITARY = { easy: 0, normal: 1, hard: 2 };
const SCOUT_TYPE = 'Zwiadowca';

let pass = 0;
let fail = 0;
function check(label, condition, detail) {
  if (condition) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail === undefined ? '' : ` -- ${JSON.stringify(detail)}`));
  }
}

function buildBundle() {
  execFileSync(process.execPath, [
    './node_modules/vite/bin/vite.js', 'build',
    '--outDir', path.relative(GRA_DIR, OUT_DIR), '--emptyOutDir',
  ], { cwd: GRA_DIR, stdio: 'pipe' });
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('vite build nie wyprodukował index.html');
  }
}

async function launchBrowser() {
  try {
    return await chromium.launch({ headless: true });
  } catch {
    return chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForWorld(page) {
  const deadline = Date.now() + 180000;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(() => {
      const dbg = window.__cityStateStartUnitsTestDebug;
      if (!dbg) return null;
      const state = dbg.dumpState();
      const overlayVisible = Array.from(document.querySelectorAll('*')).some(
        el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null,
      );
      return { state, overlayVisible };
    });
    if (last && !last.overlayVisible
      && last.state.awaitingFirstPlayerCity === true
      && last.state.playerStartHex !== null) return last.state;
    await wait(500);
  }
  throw new Error(`timeout generowania świata: ${JSON.stringify(last)}`);
}

async function foundCapital(page) {
  const founded = await page.evaluate(
    () => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity(),
  );
  if (!founded) throw new Error('foundPlayerStartCity() zwróciło false');
  const deadline = Date.now() + 30000;
  while (Date.now() < deadline) {
    const state = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    if (state.awaitingFirstPlayerCity === false && state.cities.some(c => c.ownerId === 0)) {
      await wait(400);
      return state;
    }
    await wait(250);
  }
  throw new Error('timeout po założeniu stolicy');
}

function unitsFor(state, ownerId) {
  return state.units.filter(unit => unit.ownerId === ownerId);
}

function scoutsFor(state, ownerId) {
  return unitsFor(state, ownerId).filter(unit => unit.typeId === SCOUT_TYPE);
}

function militaryFor(state, ownerId) {
  return unitsFor(state, ownerId).filter(unit => unit.typeId !== SCOUT_TYPE);
}

function ownerSummary(state, ownerId) {
  const cities = state.cities.filter(city => city.ownerId === ownerId);
  const units = unitsFor(state, ownerId);
  return {
    ownerId,
    cityCount: cities.length,
    cityIds: cities.map(city => city.id),
    scouts: scoutsFor(state, ownerId).length,
    military: militaryFor(state, ownerId).length,
    units: units.map(unit => ({ typeId: unit.typeId, q: unit.q, r: unit.r })),
  };
}

function fullAiOwners(state) {
  return [...new Set(
    state.cities
      .filter(city => city.ownerId > 0 && city.startCityState !== true)
      .map(city => city.ownerId),
  )].sort((a, b) => a - b);
}

function cityStateOwners(state) {
  return [...new Set(
    state.cities
      .filter(city => city.ownerId > 0 && city.startCityState === true)
      .map(city => city.ownerId),
  )].sort((a, b) => a - b);
}

function validateScoutState(state, label, gameDifficulty) {
  const majors = fullAiOwners(state);
  const cityStates = cityStateOwners(state);
  const summaries = [0, ...majors, ...cityStates].map(ownerId => ownerSummary(state, ownerId));
  console.log(`  STATE ${label}: ${JSON.stringify(summaries)}`);

  check(`(${label}) stolica gracza istnieje`, state.cities.some(city => city.ownerId === 0));
  check(`(${label}) gracz ma dokładnie jednego Zwiadowcę`, scoutsFor(state, 0).length === 1, ownerSummary(state, 0));
  check(`(${label}) gracz zachowuje ${EXPECTED_PLAYER_MILITARY[gameDifficulty]} jednostek wojskowych`,
    militaryFor(state, 0).length === EXPECTED_PLAYER_MILITARY[gameDifficulty], ownerSummary(state, 0));

  check(`(${label}) co najmniej jedna pełna cywilizacja AI na mapie`, majors.length > 0, majors);
  for (const ownerId of majors) {
    const summary = ownerSummary(state, ownerId);
    check(`(${label}) pełny AI owner=${ownerId} ma dokładnie jednego Zwiadowcę`,
      summary.scouts === 1, summary);
    // The hard-level extra-city fallback can add one Warrior only when no legal
    // bonus-city hex exists. In the normal successful path, the existing
    // difficulty policy is exactly the expected count below.
    const allowedMilitary = summary.cityCount > 1 || gameDifficulty !== 'hard'
      ? [EXPECTED_MAJOR_AI_MILITARY[gameDifficulty]]
      : [EXPECTED_MAJOR_AI_MILITARY[gameDifficulty], EXPECTED_MAJOR_AI_MILITARY[gameDifficulty] + 1];
    check(`(${label}) AI owner=${ownerId} military policy unchanged`,
      allowedMilitary.includes(summary.military), { summary, allowedMilitary });
  }

  check(`(${label}) co najmniej jedno miasto-państwo na mapie`, cityStates.length > 0, cityStates);
  const expectedCityStateMilitary = {
    easy: { sameType: 1, foreign: 2 },
    normal: { sameType: 1, foreign: 1 },
    hard: { sameType: 1, foreign: 0 },
  };
  for (const ownerId of cityStates) {
    const summary = ownerSummary(state, ownerId);
    check(`(${label}) miasto-państwo owner=${ownerId} nie dostaje Zwiadowcy`,
      summary.scouts === 0, summary);
    const sameType = state.cities.some(
      city => city.ownerId === ownerId && city.civTypeId === state.menuCivId,
    );
    const expectedMilitary = expectedCityStateMilitary[gameDifficulty][sameType ? 'sameType' : 'foreign'];
    // The existing policy is independent for same-type rivals and foreign
    // cluster copies; keep its exact count while adding no scout.
    check(`(${label}) miasto-państwo owner=${ownerId} zachowuje ${expectedMilitary} jednostek wojskowych`,
      summary.military === expectedMilitary, { summary, expectedMilitary, sameType });
  }

  const barbarianScouts = state.units.filter(
    unit => unit.ownerId === -1 && unit.typeId === SCOUT_TYPE,
  );
  check(`(${label}) barbarzyńcy nie dostają Zwiadowcy`, barbarianScouts.length === 0, barbarianScouts);
  return { majors, cityStates, summaries };
}

async function startNewGame(page, gameDifficulty) {
  await page.evaluate(({ gameDifficulty, cityStatesCount }) => {
    // This existing hook supplies only the city-state difficulty, count, and
    // main difficulty to the real doStartGame(params) path.
    window.__cityStateStartUnitsTestDebug.startNewGame('normal', cityStatesCount, gameDifficulty);
  }, { gameDifficulty, cityStatesCount: CITY_STATES_COUNT });
  await waitForWorld(page);
  return foundCapital(page);
}

async function main() {
  buildBundle();
  const browser = await launchBrowser();
  const pageErrors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('pageerror', error => pageErrors.push(String(error)));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  try {
    await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(
      () => !!window.__cityStateStartUnitsTestDebug && !!window.__hotSeatTestDebug,
      undefined,
      { timeout: 120000 },
    );

    for (const difficulty of GAME_DIFFICULTIES) {
      console.log(`\n[scout-start-units-live-test] === difficulty=${difficulty} ===`);
      const state = await startNewGame(page, difficulty);
      validateScoutState(state, difficulty, difficulty);
    }

    console.log('\n[scout-start-units-live-test] === hot-seat ===');
    await startNewGame(page, 'normal');
    const seats = await page.evaluate(
      () => window.__hotSeatTestDebug.generateSecondHumanSeatForTest('chinczycy', 'daleko'),
    );
    check('(hot-seat) drugi fotel i jego heks są zarejestrowane',
      seats.secondOwnerId !== null && seats.humanOwnerIds.length === 2 && !!seats.secondHex,
      seats);

    let hotState = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    check('(hot-seat) fotel 1 zachowuje dokładnie jednego Zwiadowcę po rejestracji fotela 2',
      scoutsFor(hotState, 0).length === 1, ownerSummary(hotState, 0));

    // Repeated/deferred founding must not duplicate the one-time scout grant.
    const foundedSecondCity = await page.evaluate(
      () => window.__hotSeatTestDebug.foundAdditionalPlayerCityForActiveSeat(true),
    );
    check('(hot-seat) dodatkowy founding fotela 1 przechodzi realną ścieżką', foundedSecondCity === true);
    hotState = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
    check('(hot-seat) powtórny founding nie dubluje Zwiadowcy fotela 1', scoutsFor(hotState, 0).length === 1, ownerSummary(hotState, 0));

    const secondOwnerId = seats.secondOwnerId;
    if (secondOwnerId !== null) {
      await page.evaluate(ownerId => window.__hotSeatTestDebug.switchActiveHuman(ownerId), secondOwnerId);
      check('(hot-seat) fotel 2 oczekuje na własną pierwszą stolicę',
        await page.evaluate(() => window.__hotSeatTestDebug.isAwaitingFirstPlayerCity()));
      const foundedSeat2 = await page.evaluate(
        () => window.__hotSeatTestDebug.foundPlayerCityForActiveSeat(),
      );
      check('(hot-seat) fotel 2 zakłada stolicę przez realną ścieżkę', foundedSeat2 === true);
      hotState = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.dumpState());
      console.log(`  STATE hot-seat: ${JSON.stringify([ownerSummary(hotState, 0), ownerSummary(hotState, secondOwnerId)])}`);
      check('(hot-seat) fotel 2 dostaje własnego Zwiadowcę',
        scoutsFor(hotState, secondOwnerId).length === 1,
        ownerSummary(hotState, secondOwnerId));
      check('(hot-seat) fotel 2 nie dostaje armii wojskowej na Easy/Normal/Hard osi',
        militaryFor(hotState, secondOwnerId).length === 1,
        ownerSummary(hotState, secondOwnerId));
    }

    // Negative control: remove every scout from the raw state and run the same
    // exact positive oracle. It must become false, proving that the assertions
    // are sensitive to bypassing/removing the real grant.
    const mutantState = await page.evaluate(() => {
      const state = window.__cityStateStartUnitsTestDebug.dumpState();
      return {
        ...state,
        units: state.units.filter(unit => unit.typeId !== 'Zwiadowca'),
      };
    });
    check('(mutant) usunięcie wszystkich Zwiadowców zaczerwienia kontrakt',
      scoutsFor(mutantState, 0).length !== 1
      || (seats.secondOwnerId !== null && scoutsFor(mutantState, seats.secondOwnerId).length !== 1));
    check('(structural) produkcja zawiera realne wywołania grantu startowego', (() => {
      const source = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
      return source.includes('grantStartingScout')
        && source.includes('grantStartingScout(ownerId, q, r)')
        && source.includes('grantStartingScout(ownerId, capitalCity.q, capitalCity.r)');
    })());
    check('zero błędów JS/konsoli w Chromium', pageErrors.length === 0, pageErrors);
  } finally {
    await browser.close().catch(() => {});
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
  }

  console.log(`\nscout-start-units-live-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch(error => {
  console.error('BLOCK:', error.stack || error);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch { /* best effort */ }
  process.exit(2);
});
