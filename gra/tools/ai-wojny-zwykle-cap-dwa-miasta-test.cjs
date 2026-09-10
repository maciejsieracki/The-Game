'use strict';
/**
 * ai-wojny-zwykle-cap-dwa-miasta-test.cjs — R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1
 * (Operator Sonnet 5, effort=high, worktree izolowany /home/user/wt-ai-wojny-zwykle-cap).
 *
 * WYZWALACZ (właściciel, żywy bug): jedna cywilizacja AI podbiła WSZYSTKIE inne cywilizacje
 * AI poza graczem — zwykłe (niewymuszone epoki) wojny AI↔AI (Priorytet 4 w
 * `ai.ts::decideAIDiplomacy`, aktywne po turze 25) nie miały ŻADNEGO automatycznego
 * bezpiecznika i mogły eskalować aż do całkowitego podboju. Naprawa rozszerza DOKŁADNIE
 * ten sam mechanizm co wojny wymuszone epoki (próg 2 miast, cooldown 20 tur,
 * `finalizePeaceTreatyBetween`) na zwykłe wojny AI↔AI.
 *
 * DLACZEGO ŻYWY CHROMIUM, NIE SAM TEST JEDNOSTKOWY: `maybeResolveRegularWarOnCityCapture`
 * żyje WYŁĄCZNIE jako domknięcie wewnątrz main.ts (main.ts nie jest modułem, nie da się
 * zbundlować osobno). REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu zakazuje uznania kryteriów
 * (a)-(d) za spełnione bez REALNEJ sekwencji: dwie cywilizacje AI w stanie 'wojna', jedna
 * zdobywa miasta drugiej przez FAKTYCZNE wywołanie funkcji zmieniającej `city.ownerId`
 * (`captureCityWithoutBattle`/`applyCityCaptureToMap`, `resolveSiegeSurrender`) — NIE przez
 * ręczne wywołanie samej nowej funkcji w izolacji.
 *
 * Hak `window.__aiWojnyZwykleCapTestDebug` (main.ts) steruje WYŁĄCZNIE danymi wejściowymi
 * (kto ma z kim relację 'wojna', czyje miasto jest gdzie PRZED próbą przejęcia, czy para ma
 * już aktywną wojnę WYMUSZONĄ epoki) — LICZNIK, PRÓG i AUTO-POKÓJ idą przez REALNY
 * `maybeResolveRegularWarOnCityCapture` wołany z wnętrza REALNYCH funneli przejęcia miasta
 * (`__rebelProtectionTestDebug.captureViaBattle`/`captureViaSiegeSurrender`, reużyte bez
 * zmian z tematu R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1), NIE reimplementowane.
 *
 * Pokrycie (a)-(d) z reguły przeciw samooszukiwaniu dispatchu:
 *  A.  Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  A2. Fast-forward REALNYMI `endTurn()` do tury >25 (poza oknem reguły „pierwsze 25 tur
 *      bez wojny AI↔AI" — dispatch: scenariusz ma być POZA tym oknem).
 *  B.  (a) Dwie cywilizacje AI (aiA realny, aiB syntetyczny ownerId) w REALNYM stanie
 *      'wojna' (`declareRegularWarBetween`, ta sama ścieżka `applyDiploEventTracked` co
 *      prawdziwe wypowiedzenie wojny) — aiB zdobywa TO SAMO miasto aiA DWA RAZY (między
 *      przejęciami `resetCityOwnerForTest` przywraca miasto aiA — to NIE jest zdarzenie
 *      przejęcia, tylko input do kolejnej REALNEJ próby, wzorem `stageRebelCity`) przez
 *      REALNY `captureViaBattle` → PO DRUGIM zdobyciu: `getRelationStatus(aiA,aiB)
 *      === 'pokoj'`.
 *  C.  (b) Tuż po auto-pokoju: `isPeaceLocked(aiA,aiB) === true` — DOKŁADNIE ta sama
 *      funkcja (`isPeaceLockedBetween`/`isPeaceTreatyLocked`), którą main.ts sprawdza
 *      bezwarunkowo przed KAŻDYM `wypowiedz_wojne` (main.ts ~32726, potwierdzone reconem
 *      tego dispatchu i bramką tekstową w sekcji F poniżej) — nowa wojna tej samej pary
 *      przed upływem 20 tur jest więc zablokowana.
 *  D.  (c) Para z AKTYWNĄ wojną WYMUSZONĄ Brązu (`stageBronzeForcedWarActiveForTest`)
 *      — REALNE zdobycie miasta między tą samą parą NIE tworzy wpisu w
 *      `regularWarCapturedByPairKey` (nowy mechanizm w ogóle nie liczy tej pary; ma ją
 *      własny, nietknięty mechanizm Brązu) — zero regresji istniejących testów wojny
 *      wymuszonej potwierdzone osobno przez bramki referencyjne (patrz NASTĘPNY KROK).
 *  E.  (d) Wojna z udziałem GRACZA (ownerId=0): AI (aiA) REALNIE zdobywa miasto GRACZA
 *      podczas trwającej wojny aiA↔gracz — `getRegularWarCaptured(aiA,0) === null` (no-op
 *      potwierdzony odczytem stanu, nie tylko brakiem crasha) I relacja aiA↔gracz
 *      pozostaje 'wojna' (auto-pokój NIE wystrzelił po jednym realnym zdobyciu, mimo że
 *      dla pary AI↔AI jedno zdobycie już tworzy wpis licznika — dowód, że funkcja jest
 *      no-opem od pierwszej linii, nie że próg akurat nie został osiągnięty).
 *  F.  Bramka tekstowa: `isPeaceLockedBetween` w main.ts bezwarunkowo (bez warunku "tylko
 *      dla wymuszonej epoki") gate'uje KAŻDE `wypowiedz_wojne`, w tym Priorytet 4 (zwykła
 *      wojna AI↔AI) — potwierdza (b) niezależnie od żywego dowodu w sekcji C.
 *  G.  Zero console.error / pageerror w całym scenariuszu.
 *
 * Bramka (z katalogu gra/): node tools/ai-wojny-zwykle-cap-dwa-miasta-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
const OUT_DIR = path.join(GRA_DIR, 'dist-ai-wojny-zwykle-cap-dwa-miasta-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

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

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[ai-wojny-zwykle-cap] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log('\n-- A. Bootstrap ?playtest=mapa dobiega końca (miasta+jednostki, tura=1) --');
    await gotoPlaytestMapa(page);
    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('bootstrap: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap: turn===1', world0.turn === 1, world0);

    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());

    console.log('\n-- A2. Fast-forward REALNYMI endTurn() do tury >25 (poza oknem reguły 25-turowej) --');
    let turnNow = 1;
    let ffSettledFailure = false;
    for (let i = 0; i < 40 && turnNow <= 25; i++) {
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      const settled = await runEndTurnAndSettle(page);
      if (!settled) {
        const diag = await page.evaluate(() => ({
          inProg: window.__eraTestDebug.isEndTurnInProgress(),
          turn: window.__eraTestDebug.getWorldState().turn,
        }));
        console.error(`   tura ${turnNow}: endTurn() nie osiągnął settled -- DIAG ${JSON.stringify(diag)} consoleErrors=${JSON.stringify(consoleErrors.slice(-10))}`);
        ffSettledFailure = true;
        break;
      }
      turnNow = (await page.evaluate(() => window.__eraTestDebug.getWorldState())).turn;
    }
    assert('fast-forward: endTurn() zawsze osiągnął settled', !ffSettledFailure, { ffSettledFailure });
    assert('fast-forward: tura > 25', turnNow > 25, { turnNow });
    // Zarzut Evaluatora #3: kroki B-G zakładają scenariusz POZA oknem 25-turowym --
    // przerywamy scenariusz zamiast kontynuować na niespełnionej przesłance.
    if (ffSettledFailure || turnNow <= 25) {
      console.error('[ai-wojny-zwykle-cap] A2 nie osiągnęło wymaganego stanu -- przerywam scenariusz (zarzut #3).');
      console.log(`\n${pass} PASS, ${fail} FAIL`);
      await browser.close();
      process.exit(1);
    }

    const two = await page.evaluate(() => window.__rebelProtectionTestDebug.pickTwoAiOwners());
    assert('AI-A (realny, właściciel miasta) + AI-B (odrębny numeryczny ownerId) dostępni', !!two, two);
    const { a: aiA, b: aiB } = two;
    console.log(`   AI-A=${aiA} AI-B=${aiB}`);

    // Zarzut Evaluatora #2 (przyczyna źródłowa): `?playtest=mapa` ma z definicji DOKŁADNIE
    // JEDNO miasto per realny AI owner -- 1. zdobycie testowego miasta byłoby więc ostatnim
    // miastem aiA i uruchomiłoby produkcyjny eliminateOwner() (kasujący diplomacyRelations)
    // PRZED 2. zdobyciem -- przyczyna źródłowa 5 FAIL poprzedniej rundy. Naprawa: zagwarantuj
    // aiA DRUGIE miasto PRZED jakąkolwiek próbą przejęcia, z jawnym fail-fast, jeśli się nie uda.
    const gotSecondCity = await page.evaluate((o) => window.__aiWojnyZwykleCapTestDebug.ensureSecondCityForOwner(o), aiA);
    assert('aiA: drugie miasto założone (fail-fast przeciw zarzutowi #2)', gotSecondCity === true, gotSecondCity);
    if (gotSecondCity !== true) {
      console.error('[ai-wojny-zwykle-cap] aiA bez drugiego miasta -- przerywam scenariusz (zarzut #2).');
      console.log(`\n${pass} PASS, ${fail} FAIL`);
      await browser.close();
      process.exit(1);
    }

    const testCityId = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), aiA);
    assert('miasto AI-A (testCityId) znalezione', !!testCityId, testCityId);

    console.log('\n-- B. (a) Dwie AI w REALNEJ wojnie, aiB zdobywa TO SAMO miasto aiA DWA RAZY --');
    await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(a, b), { a: aiA, b: aiB });
    let relBefore = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('wojna aiA<->aiB realnie ustawiona', relBefore === 'wojna', relBefore);

    // Zdobycie #1 (REALNE): aiB przejmuje miasto aiA.
    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: testCityId, atk: aiB });
    let captured1 = await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.getRegularWarCaptured(a, b), { a: aiA, b: aiB });
    assert('po 1. zdobyciu: licznik regularnej wojny = 1 po odpowiedniej stronie', !!captured1 && (captured1.capturedByA === 1 || captured1.capturedByB === 1), captured1);
    let relAfter1 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('po 1. zdobyciu: relacja NADAL wojna (próg 2 jeszcze nieosiągnięty)', relAfter1 === 'wojna', relAfter1);

    // Input-only: miasto wraca do aiA (NIE jest to zdarzenie przejęcia — brak wywołania funnela wojny).
    await page.evaluate(({ cityId, owner }) => window.__aiWojnyZwykleCapTestDebug.resetCityOwnerForTest(cityId, owner), { cityId: testCityId, owner: aiA });

    // Zdobycie #2 (REALNE, ta sama strona) -- osiąga próg 2, REALNIE woła finalizePeaceTreatyBetween.
    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: testCityId, atk: aiB });

    const relAfter2 = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.getRelationStatus(a, b), { a: aiA, b: aiB });
    assert('KRYTERIUM (a): po 2. zdobyciu relacja aiA<->aiB === pokoj', relAfter2 === 'pokoj', relAfter2);

    const capturedAfterPeace = await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.getRegularWarCaptured(a, b), { a: aiA, b: aiB });
    assert('po auto-pokoju: wpis licznika wyczyszczony (brak przecieku do następnej wojny)', capturedAfterPeace === null, capturedAfterPeace);

    console.log('\n-- C. (b) isPeaceLocked(aiA,aiB) === true tuż po auto-pokoju --');
    const peaceLocked = await page.evaluate(({ a, b }) => window.__rebelProtectionTestDebug.isPeaceLocked(a, b), { a: aiA, b: aiB });
    assert('KRYTERIUM (b): nowa wojna tej samej pary zablokowana (isPeaceLocked===true)', peaceLocked === true, peaceLocked);

    console.log('\n-- D. (c) Para z AKTYWNĄ wojną WYMUSZONĄ Brązu NIE jest dotknięta nowym mechanizmem --');
    const two2 = await page.evaluate(() => window.__rebelProtectionTestDebug.pickTwoAiOwners());
    const aiC = two2.a;
    const aiD = two2.b + 1; // odrębny, trzeci syntetyczny ownerId (różny od aiB powyżej).
    const testCityId2 = await page.evaluate((o) => window.__rebelProtectionTestDebug.getCityIdForOwner(o), aiC);
    await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(a, b), { a: aiC, b: aiD });
    await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.stageBronzeForcedWarActiveForTest(a, b), { a: aiD, b: aiC });
    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: testCityId2, atk: aiD });
    const regularCapturedForForcedPair = await page.evaluate(
      ({ a, b }) => window.__aiWojnyZwykleCapTestDebug.getRegularWarCaptured(a, b), { a: aiC, b: aiD },
    );
    assert('KRYTERIUM (c): para z aktywną wojną wymuszoną -- ZERO wpisu w nowym mechanizmie', regularCapturedForForcedPair === null, regularCapturedForForcedPair);
    await page.evaluate(({ a, b }) => window.__aiWojnyZwykleCapTestDebug.clearBronzeForcedWarActiveForTest(a, b), { a: aiD, b: aiC });

    console.log('\n-- E. (d) Wojna z udziałem GRACZA -- nowy mechanizm no-op --');
    const playerCityId = await page.evaluate(() => window.__rebelProtectionTestDebug.getCityIdForOwner(0));
    assert('miasto gracza znalezione', !!playerCityId, playerCityId);
    await page.evaluate((a) => window.__aiWojnyZwykleCapTestDebug.declareRegularWarBetween(a, 0), aiA);
    const relPlayerBefore = await page.evaluate((a) => window.__rebelProtectionTestDebug.getRelationStatus(a, 0), aiA);
    assert('wojna aiA<->gracz realnie ustawiona', relPlayerBefore === 'wojna', relPlayerBefore);
    await page.evaluate(({ cityId, atk }) => window.__rebelProtectionTestDebug.captureViaBattle(cityId, atk), { cityId: playerCityId, atk: aiA });
    const regularCapturedPlayerPair = await page.evaluate((a) => window.__aiWojnyZwykleCapTestDebug.getRegularWarCaptured(a, 0), aiA);
    assert('KRYTERIUM (d): wojna z graczem -- ZERO wpisu w nowym mechanizmie (no-op)', regularCapturedPlayerPair === null, regularCapturedPlayerPair);
    const relPlayerAfter = await page.evaluate((a) => window.__rebelProtectionTestDebug.getRelationStatus(a, 0), aiA);
    assert('KRYTERIUM (d): relacja aiA<->gracz NIETKNIĘTA (nadal wojna, brak auto-pokoju)', relPlayerAfter === 'wojna', relPlayerAfter);

    console.log('\n-- F. Bramka tekstowa: isPeaceLockedBetween bezwarunkowo gate\'uje KAŻDE wypowiedz_wojne --');
    const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
    const guardMatch = /if\s*\(cmd\.type === 'wypowiedz_wojne'\)\s*\{[\s\S]{0,400}?if \(isPeaceLockedBetween\(ownerId, targetId\)\) continue;/.test(mainSrc);
    assert('main.ts: isPeaceLockedBetween(ownerId,targetId) guard bez warunku epoki wymuszonej, tuż po wejściu w wypowiedz_wojne', guardMatch, null);
    assert('main.ts: maybeResolveRegularWarOnCityCapture zdefiniowana', /function maybeResolveRegularWarOnCityCapture\(oldOwner: number, newOwner: number\): void \{/.test(mainSrc), null);
    const callSites = (mainSrc.match(/maybeResolveRegularWarOnCityCapture\((?:oldOwner, newOwner|oldOwner, atkOwner)\);/g) || []).length;
    assert('main.ts: maybeResolveRegularWarOnCityCapture wołana z DOKŁADNIE 2 lejków (resolveSiegeSurrender + applyCityCaptureToMap)', callSites === 2, callSites);

    console.log('\n-- G. Zero console.error / pageerror (poza oczekiwanym DECISION_REQUIRED[0]) --');
    // Ten sam allowlist co reference gate'y `forced-war-trojstronna-domino-live-test.cjs`/
    // `forced-war-trojstronna-test.cjs`/`forced-war-trojstronna-main-guard-test.cjs`: w
    // `?playtest=mapa` (jeden realny AI + gracz) mechanizm wojny wymuszonej (main.ts:32024,
    // NIETKNIĘTY tym tematem) rutynowo loguje `DECISION_REQUIRED` dla ownerId gracza (0), gdy
    // brak niezablokowanej pary do przydziału -- oczekiwany szum tego sandboksa, NIE regresja
    // wprowadzona przez R-AI-WOJNY-ZWYKLE-CAP-DWA-MIASTA-Q1.
    const unexpectedConsoleErrors = consoleErrors.filter(m => !(/DECISION_REQUIRED/.test(m) && /\[0\]/.test(m)));
    assert('brak console.error/pageerror POZA oczekiwanym DECISION_REQUIRED[0]', unexpectedConsoleErrors.length === 0, unexpectedConsoleErrors);
  } finally {
    await browser.close();
  }

  console.log(`\n${pass} PASS, ${fail} FAIL`);
  if (fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error('[ai-wojny-zwykle-cap] błąd fatalny:', e);
  process.exit(1);
});
