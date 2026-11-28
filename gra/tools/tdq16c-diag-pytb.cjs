const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const OUT_DIR = path.join(GRA_DIR, 'dist-tdq16c-pytb-diag');
// TDQ16C: ?civTest=1 udostępnia hak __nnsMeasureDebug (używany przez prepareEndTurnGate).
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa&civTest=1';
const { prepareEndTurnGate } = require('./_live-ready.cjs');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium';

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  OK  ${label}`);
  } else {
    fail++;
    console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

function buildBundle() {
  console.log('[ai-wojny-zwykle-cap] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[ai-wojny-zwykle-cap] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[ai-wojny-zwykle-cap] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page) {
  await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

// Zarzut Evaluatora #3, przyczyna źródłowa (diagnostyka rundy 2, DIAG-instrumentacja
// potwierdziła: `inProg===false` i `turn` NIEZMIENIONY po timeout -- nie realne zawieszenie
// silnika, tylko `canPlayerInitiateEndTurn()` odrzucający `endTurn()` po cichu, bo
// `isPreBattleOpen()`/`hasPendingAutoPreBattle()` blokuje, gdy AI/barbarzyńca zainicjował
// bitwę blisko gracza -- IDENTYCZNY, już rozwiązany problem co w
// `forced-war-trojstronna-domino-live-test.cjs`/`forced-war-player-target-live-test.cjs`
// (`advanceTurnBySettledEndTurn`). Reużywam TEN SAM wzorzec zamiast wymyślać nowy: settle
// wg rosnącego `turn` (nie samego `isEndTurnInProgress` — na ubogich w jednostki wczesnych
// turach to przejście true->false potrafi nigdy nie zostać złapane w oknie pollingu), plus
// realne natywne kliknięcie przycisku "Auto" modalu preBattle w każdej iteracji pollingu.
async function runEndTurnAndSettle(page, timeoutMs = 90000) {
  const turnBefore = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  // TDQ16C: bramka „Zakończ turę” (spichlerz/skarbiec, NNS) po oknie łaski 15 tur blokuje
  // pasywnego gracza od t17 (FALA 935/936). Harness podnosi skarbiec/spichlerz do progów
  // pomiarowych PRZED endTurn (ta sama procedura co pozostałe testy live); gra sama liczy
  // canEnd i prognozę. Test bez tej procedury nie jest błędem gry (A-klasa).
  const gate = await prepareEndTurnGate(page);
  if (!gate.canEnd) throw new Error('bramka Zakończ turę zamknięta po prepareEndTurnGate: ' + JSON.stringify(gate));
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const st = await page.evaluate(() => ({
      inProg: window.__eraTestDebug.isEndTurnInProgress(),
      turn: window.__eraTestDebug.getWorldState().turn,
    }));
    if (st.turn > turnBefore && !st.inProg) { settled = true; break; }
    await page.evaluate(() => {
      const btn = document.querySelector('.pb-overlay [data-act="auto"]');
      if (btn) btn.click();
    });
    await wait(200);
  }
  await wait(150);
  return settled;
}


async function snap(page, tag) {
  return page.evaluate((tag) => {
    const n = window.__nnsMeasureDebug; const g = n.gateInfo();
    let units = null, cities = null;
    try {
      const d = window.__cityStateStartUnitsTestDebug && window.__cityStateStartUnitsTestDebug.dumpState();
      if (d) {
        units = d.units.filter((u) => u.ownerId === 0).map((u) => [u.typeId || u.type, u.inGarnizon ? 'G' : '-']);
        cities = d.cities.filter((c) => c.ownerId === 0).map((c) => ({ id: c.id, pop: c.population ?? c.pop, rac: c.poziomRacji }));
      }
    } catch (e) { units = 'err ' + e.message; }
    return { tag, turn: g.turn, canEnd: g.canEnd, forecast: g.forecast, treasury: g.treasury, granary: g.granary, rations: n.cityRations(), autoDelta: g.autoSpichlerzDelta, units, cities, unitCount: n.unitCount(0) };
  }, tag);
}
async function main() {
  const { chromium } = require('playwright');
  buildBundle();
  const browser = await launchBrowser(chromium);
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  await gotoPlaytestMapa(page);
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
  let turnNow = 1;
  for (let i = 0; i < 40 && turnNow <= 21; i++) {
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    if (turnNow >= 17 && process.env.PYTB_RACJA0 === '1') {
      if (turnNow === 17) { await page.evaluate(() => { window.__nnsMeasureDebug.setRationAll(0); window.__nnsMeasureDebug.forceGateRecompute(); }); }
      console.log('SNAP-R0 ' + JSON.stringify(await snap(page, 'racja0-persist')));
    } else if (turnNow >= 15) {
      const base = await snap(page, 'before-gate');
      console.log('SNAP ' + JSON.stringify(base));
      for (const lvl of [0, 1, 6, 12]) {
        const r = await page.evaluate((lvl) => {
          const n = window.__nnsMeasureDebug;
          n.setRationAll(lvl); n.forceGateRecompute();
          const g = n.gateInfo();
          return { lvl, spichlerzPo: g.forecast && g.forecast.spichlerzPo, spichlerzObecny: g.forecast && g.forecast.spichlerzObecny, canEnd: g.canEnd, gate: g.gate };
        }, lvl);
        console.log('  RACJA ' + JSON.stringify(r));
      }
      const orig = base.rations.map((r) => r.poziomRacji);
      if (orig.length && orig.every((v) => v === orig[0]) && orig[0] !== null) {
        await page.evaluate((v) => { window.__nnsMeasureDebug.setRationAll(v); window.__nnsMeasureDebug.forceGateRecompute(); }, orig[0]);
      }
    }
    const settled = await runEndTurnAndSettle(page);
    turnNow = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!settled) { console.log('NOT SETTLED at', turnNow); break; }
  }
  await browser.close();
  process.exit(0);
}
main().catch((e) => { console.error(e); process.exit(2); });
