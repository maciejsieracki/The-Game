'use strict';
/**
 * ai-rebel-verify-last-city-live.cjs -- R-WEB-AI-REBEL-VERIFY-LIVE-Q1 (AIREBELVER), pozycja 1 z dispatchu:
 * skutecznosc ochrony OSTATNIEGO miasta AI w zywej grze (scenariusz wymuszony).
 *
 * Scenariusz (--target ai): sandbox ?playtest=mapa ma dokladnie jedno miasto AI (wlasciciel aiA). Hak
 * `__rebelNotifyTestDebug.forceRevoltEligible(cityId)` (main.ts, tylko do odczytu danych wejsciowych buntu:
 * populacja >= 5, grace=0, prog buntu skrajnego podniesiony) wymusza kwalifikacje do buntu. Potem 6 REALNYCH
 * `__eraTestDebug.endTurn()` i odczyt stanu miasta po kazdej turze. Oczekiwanie (ochrona): miasto zostaje przy
 * aiA (ownerId===aiA, rebelState===false), liczba miast AI nadal 1.
 *
 * Kontrola (--target player): ten sam hak na JEDYNYM miescie gracza. Gracz nie ma ochrony ostatniego miasta
 * (gate: tylko AI), wiec miasto powinno zbuntowac sie po wygasnieciu łaski (rebelState===true lub ownerId -99).
 * Kontrola dowodzi, ze wymuszenie faktycznie prowadzi do buntu, gdy bramka nie blokuje.
 *
 * OGRANICZENIE (jawne): ?playtest=mapa nie wywoluje doStartGame, wiec `_menuDifficulty` pozostaje domyslne
 * ('normal'); poziom maksymalny (Trudny) wymagalby startu nowej gry (`__nnsMeasureDebug.startGame`) i obslugi
 * blokad modalnych jak w ai-cult-rel-measure-run.cjs. Wynik jest zapisany z pole `difficulty` (odczyt z
 * __nnsMeasureDebug nieobecny w playtest -- raportowane jako 'normal (playtest)').
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/ai-rebel-verify-last-city-live.cjs --dist <abs-dist> --target ai|player [--turns 6]
 * Wynik: JSON na stdout (jedna linia PREFIX=AIREBELVER-LAST-CITY) do wklejenia do dane/.
 */
const path = require('path');
const fs = require('fs');

const GRA_DIR = path.resolve(__dirname, '..');
function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}
const DIST = arg('dist', '');
const TARGET = arg('target', 'ai');
const TURNS = parseInt(arg('turns', '6'), 10);
if (!DIST || !fs.existsSync(path.join(DIST, 'index.html'))) throw new Error('--dist: brak index.html w ' + DIST);
if (!['ai', 'player'].includes(TARGET)) throw new Error('--target: ai|player');
const URL_PLAYTEST = 'file://' + path.join(DIST, 'index.html') + '?playtest=mapa&civTest=1';
const CHROME = process.env.CHROME_PATH || '/opt/pw-browsers/chromium';
const PROG = JSON.parse(fs.readFileSync(path.join(GRA_DIR, 'data', 'society-params.json'), 'utf8')).porzadek.porzadek_prog_bunt_skrajny_pct.hard;

const { closeCivWelcome, prepareEndTurnGate } = require('./_live-ready.cjs');
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

async function gotoPlaytest(page) {
  await page.goto(URL_PLAYTEST, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0 && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  await wait(300);
}

async function endTurnSettle(page, timeoutMs = 120000) {
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    const now = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
    if (!inProg && now > before) return true;
    await wait(120);
  }
  return false;
}

async function main() {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true, executablePath: CHROME,
    args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const errors = [];
  const rows = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    await gotoPlaytest(page);

    let cityId;
    let ownerId;
    if (TARGET === 'ai') {
      const two = await page.evaluate(() => window.__rebelProtectionTestDebug.pickTwoAiOwners());
      if (!two) throw new Error('brak AI w sandboxie');
      ownerId = two.a;
      cityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), ownerId);
    } else {
      cityId = await page.evaluate(() => window.__rebelNotifyTestDebug.getPlayerCity()?.id ?? null);
      ownerId = 0;
    }
    if (!cityId) throw new Error('brak miasta celu');

    // Liczba miast wlasciciela PRZED wymuszeniem (dla AI: musi byc 1 -- scenariusz "ostatnie miasto").
    await page.evaluate((o) => { window.__ARG_OWNER = o; }, ownerId);
    const countBefore = await page.evaluate((p) => {
      const rows = window.__aiEconomyMeasure.cityStateTurn(p);
      const r = rows.find((x) => x.owner === window.__ARG_OWNER);
      return r ? r.miasta : 0;
    }, PROG);

    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
    const forced = await page.evaluate((c) => window.__rebelNotifyTestDebug.forceRevoltEligible(c), cityId);
    const st0 = await page.evaluate((c) => window.__rebelNotifyTestDebug.getCityState(c), cityId);
    rows.push({ tura: 0, miastoOwnerId: st0.ownerId, rebelState: st0.rebelState, grace: st0.revoltGraceRemaining, miastWlasciciela: countBefore, forced });

    for (let t = 1; t <= TURNS; t++) {
      await closeCivWelcome(page);
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      const gate = await prepareEndTurnGate(page).catch((e) => ({ err: String(e) }));
      const settled = await endTurnSettle(page);
      if (!settled) {
        const diag = await page.evaluate(() => ({ inProg: window.__eraTestDebug.isEndTurnInProgress(), turn: window.__eraTestDebug.getWorldState().turn }));
        rows.push({ tura: t, nieSettled: true, diag, gate });
        break;
      }
      const st = await page.evaluate((c) => window.__rebelNotifyTestDebug.getCityState(c), cityId);
      const cnt = await page.evaluate((p) => {
        const r = window.__aiEconomyMeasure.cityStateTurn(p).find((x) => x.owner === window.__ARG_OWNER);
        return r ? r.miasta : 0;
      }, PROG);
      rows.push({ tura: t, settled, miastoOwnerId: st ? st.ownerId : null, rebelState: st ? st.rebelState : null, grace: st ? st.revoltGraceRemaining : null, miastWlasciciela: cnt });
      if (!settled) break;
    }
    const incomplete = rows.some((r) => r.nieSettled);
    const data = rows.filter((r) => !r.nieSettled);
    const last = data[data.length - 1];
    const verdict = incomplete ? 'NIE ZMIERZONO (tura nie zakonczyla sie; patrz rows.nieSettled)' : TARGET === 'ai'
      ? (data.every((r) => r.rebelState === false && r.miastoOwnerId === ownerId) ? 'OCHRONA-DZIALA (miasto zostalo przy wlascicielu we wszystkich turach)' : 'OCHRONA-NIE-DZIALA (miasto zbuntowane)')
      : (last.rebelState === true || last.miastoOwnerId === -99 ? 'KONTROLA-OK (gracz zbuntowany po wymuszeniu)' : 'KONTROLA-NIE-ZADZIALALA (gracz nie zbuntowany)');
    const out = { target: TARGET, ownerId, cityId, difficulty: 'normal (playtest, _menuDifficulty niezmieniane)', turnsRun: data.length - 1, verdict, rows, errors: errors.slice(0, 5) };
    console.log('PREFIX=AIREBELVER-LAST-CITY ' + JSON.stringify(out));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error('FAIL ' + (e && e.stack || e)); process.exit(1); });
