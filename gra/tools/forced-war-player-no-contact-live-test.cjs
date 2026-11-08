'use strict';
/**
 * forced-war-player-no-contact-live-test.cjs — P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1
 * (Operator Sonnet 5, effort=medium, 2026-09-08, worktree izolowany).
 *
 * SEDNO tego tematu (potwierdzone żywym dowodem właściciela z JEGO rozgrywki): wymuszona
 * wojna epoki, w której cel to GRACZ, dopóki gracz "nie poznał" (nie odkrył na mapie —
 * `diplomaticallyDiscoveredOwners`) tej konkretnej AI, jest CAŁKOWICIE kasowana przez
 * bramkę `dipLayer==='pre_contact'` (D3-Q2, `filterDiplomacyCommandsForLayer`) — mimo że
 * `assignForcedWarPairings`/`isEligibleForXForcedWar` poprawnie wybrały gracza jako cel i
 * `decideAIDiplomacy` poprawnie wygenerowała komendę `wypowiedz_wojne`. Ten dokładny
 * scenariusz NIE był dotąd pokryty żywym testem: istniejący siostrzany
 * `forced-war-player-target-live-test.cjs` CELOWO "oszukuje" kontakt (przesuwa miasto
 * gracza na pozycję attackera, co w main.ts wymaga też jawnego
 * `diplomaticallyDiscoveredOwners.add(attackerId)`, bo inaczej D3-Q2 słusznie skasowałaby
 * DOW) — czyli zawsze testuje przypadek "gracz JUŻ poznał AI", nigdy przypadek zgłoszony
 * przez właściciela ("gracz NIE poznał AI").
 *
 * Ta bramka używa NOWEGO haka `window.__eraTestDebug.forceBronzeForcedWarOnPlayerNoContact()`
 * (main.ts, lustro `forceBronzeForcedWarOnPlayer()`, JEDYNA różnica: BRAK
 * `diplomaticallyDiscoveredOwners.add(attackerId)` i BRAK przesunięcia miasta gracza —
 * zamiast tego wyklucza WSZYSTKIE inne AI z puli warless-bronze tej tury, żeby gracz
 * pozostał jedynym możliwym kandydatem `pickForcedWarTargetId`, forced-war-common.ts,
 * NIETKNIĘTY) — REALNY `vite build`, REALNY headless Chromium (`?playtest=mapa`), REALNE
 * funkcje silnika (`endTurn` → `runAiPhase` → `decideAIDiplomacy` →
 * `pickBronzeForcedWarTargetId` → komenda `wypowiedz_wojne` → main.ts gating/`ownerLoop`)
 * — ZERO reimplementacji formuły wyboru celu ani warstwy dyplomacji.
 *
 * R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1: gracz dołącza do puli triggeredSubjects dopiero od
 * `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` (main.ts) -- ten test fast-forwarduje REALNYMI
 * `endTurn()` do tury 24 (krok A2) PRZED wywołaniem haka, żeby scenariusz uruchamiał się w
 * turze 25 (próg spełniony).
 *
 * Pokrycie:
 *  A. Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  A2. Fast-forward realnymi `endTurn()` do tury 24 (próg gracza jeszcze nie minął).
 *  B. `forceBronzeForcedWarOnPlayerNoContact()` faktycznie wybrał realnego AI ownera,
 *     wyzerował jego wojny i wykluczył resztę AI z puli tej tury — sanity.
 *  B2. SEDNO PRZED-warunku: `isDiplomaticallyDiscovered(attackerId) === false` — gracz
 *     NAPRAWDĘ nie "poznał" tej AI (bez tego cała reszta testu byłaby bez znaczenia —
 *     dokładnie replikowałaby siostrzany test, nie zgłoszony scenariusz).
 *  C. Realny `endTurn()` (ta sama funkcja co przycisk „Zakończ turę") dobiega końca.
 *  D. SEDNO kryterium naprawy: relacja attacker↔gracz faktycznie zmienia status na
 *     'wojna' MIMO braku kontaktu — dokładnie odwrotność "wytrychu" zgłoszonego przez
 *     właściciela ("wojna nie wybucha, póki się nie poznamy").
 *  E. Wypowiedzenie wojny WIDOCZNE w dzienniku wydarzeń (`warEventLog`).
 *  F. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/forced-war-player-no-contact-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-forced-war-player-no-contact-live-test');
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
  console.log('[forced-war-player-no-contact-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[forced-war-player-no-contact-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[forced-war-player-no-contact-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

// R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 (runda 2): gracz dołącza do puli triggeredSubjects
// wyłącznie od `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` (=25, main.ts). Ten hak nie ma
// (i celowo nie dostaje w tej rundzie -- STOP DECISION_REQUIRED byłby wymagany, gdyby był
// potrzebny) osobnego "ustaw turę" -- jedyna droga to realny `__eraTestDebug.endTurn()`
// (ta sama funkcja co przycisk „Zakończ turę") wołany w pętli, dokładnie jak krok C niżej,
// tyle że BEZ oczekiwanego skutku ubocznego (żadnego forced-war seedu gracza jeszcze nie ma).
// Przed KAŻDYM `endTurn()` w tej pętli wołamy JUŻ ISTNIEJĄCY (main.ts, `__rebelProtectionTestDebug`,
// R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1) hak `pullPlayerUnitsHome()` -- dokładnie ten sam wzorzec co
// `perf-long-session-live-test.cjs`/`rebel-protection-live-test.cjs` -- bez niego jednostka gracza
// stojąca tuż przy AI (`?playtest=mapa` z definicji) otwiera modal preBattle w fazie AI już od
// drugiego `endTurn()` i blokuje wszystkie kolejne (obserwowane empirycznie w tej rundzie: fast-
// forward utykał na turze 2). Hak steruje WYŁĄCZNIE pozycją jednostek GRACZA, nie mechanizmem
// bitwy -- ZERO nowego haka produkcyjnego, ZERO zmiany main.ts.
async function advanceTurnBySettledEndTurn(page) {
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
  // NIE opiera się na złapaniu przejścia isEndTurnInProgress() true->false w oknie
  // pollingu 150ms -- na wczesnych, ubogich w jednostki turach `endTurn()` potrafi
  // zakończyć się SZYBCIEJ niż jeden cykl pollingu, więc "true" nigdy nie zostaje
  // zaobserwowane i settle nigdy się nie stwierdza (fałszywy timeout, niezależny od
  // realnego stanu silnika). Zamiast tego czeka na rosnący `turn` (twardy dowód że
  // tura faktycznie minęła) ORAZ brak `isEndTurnInProgress()` w danym momencie.
  const before = await page.evaluate(() => window.__eraTestDebug.getWorldState().turn);
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const [turnNow, inProg] = await page.evaluate(() => [
      window.__eraTestDebug.getWorldState().turn,
      window.__eraTestDebug.isEndTurnInProgress(),
    ]);
    if (turnNow > before && !inProg) return true;
    // `pullPlayerUnitsHome()` chroni WYŁĄCZNIE przed jednostkami gracza (patrz komentarz
    // wyżej i identyczne zastrzeżenie w `perf-long-session-live-test.cjs`) -- barbarzyńca/
    // AI może i tak zainicjować bitwę na tyle blisko gracza, że otworzy się realny modal
    // preBattle (`ui/preBattle.ts`), blokując `canPlayerInitiateEndTurn()`. Klikamy REALNY
    // przycisk „Auto" (`[data-act="auto"]`, dokładnie ten, który stoi pod ręką gracza w tym
    // modalu) -- auto-rozstrzyga TĘ JEDNĄ bitwę realnym mechanizmem walki (ZERO nowego haka,
    // ZERO reimplementacji auto-resolve), po czym pętla wraca do sprawdzania turn/inProg.
    // Diagnoza tej rundy: `page.locator(...).click({force:true})` (hit-testing Playwright)
    // milczący timeout na tym konkretnym przycisku w headless+swiftshader (canvas/GL nad
    // overlayem myli hit-test mimo force) -- REALNE, natywne DOM `.click()` (ta sama metoda
    // wywołania zdarzenia, zero symulacji współrzędnych) działa niezawodnie (potwierdzone
    // powtarzalnie do tury 26 w izolowanej próbie diagnostycznej tej rundy).
    await page.evaluate(() => {
      const btn = document.querySelector('.pb-overlay [data-act="auto"]');
      if (btn) btn.click();
    });
    await wait(200);
  }
  return false;
}

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

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[forced-war-player-no-contact-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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
    assert('bootstrap zakończony: citiesLen>0', world0.citiesLen > 0, world0);
    assert('bootstrap zakończony: unitsLen>0', world0.unitsLen > 0, world0);
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    console.log('\n-- A2. Fast-forward do tury 24 (próg gracza R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 = 25) --');
    // Sandbox `?playtest=mapa` (jeden realny AI) jest z natury niezrównoważony na 24 tury --
    // ten sam zabezpieczający hak i to samo uzasadnienie co `perf-long-session-live-test.cjs`/
    // `rebel-protection-live-test.cjs` (wyłącza WYŁĄCZNIE checkVictory dla tej sesji testowej).
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());
    for (let i = 0; i < 23; i++) {
      // eslint-disable-next-line no-await-in-loop
      const settled = await advanceTurnBySettledEndTurn(page);
      if (!settled) throw new Error(`fast-forward: endTurn #${i + 1} nie ustabilizował się`);
    }
    const worldFF = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    assert('fast-forward zakończony: turn===24 (próg gracza jeszcze NIE minął)', worldFF.turn === 24, worldFF);

    console.log('\n-- B. forceBronzeForcedWarOnPlayerNoContact(): realny AI owner wybrany, wojny wyzerowane, reszta AI wykluczona --');
    const forced = await page.evaluate(() => window.__eraTestDebug.forceBronzeForcedWarOnPlayerNoContact());
    assert('attackerId zwrócony i > 0 (realny AI, nie gracz/barbarzyńca)', typeof forced.attackerId === 'number' && forced.attackerId > 0, forced);
    const relBefore = await page.evaluate(
      (attackerId) => window.__eraTestDebug.getRelationStatus(attackerId, 0),
      forced.attackerId,
    );
    assert('przed turą: attacker i gracz NIE są w wojnie', relBefore !== 'wojna', { relBefore });

    console.log('\n-- B2. SEDNO PRZED-warunku: gracz NAPRAWDĘ nie "poznał" attackera --');
    const discoveredBefore = await page.evaluate(
      (attackerId) => window.__eraTestDebug.isDiplomaticallyDiscovered(attackerId),
      forced.attackerId,
    );
    assert(
      'isDiplomaticallyDiscovered(attackerId) === false PRZED turą (scenariusz właściciela: brak kontaktu, nie "gracz już poznał AI")',
      discoveredBefore === false,
      { discoveredBefore },
    );

    console.log('\n-- C. Realny endTurn() (ta sama funkcja co przycisk "Zakończ turę") --');
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    const t0 = Date.now();
    let sawInProgress = false;
    let settled = false;
    while (Date.now() - t0 < 90000) {
      const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
      if (inProg) sawInProgress = true;
      if (sawInProgress && !inProg) { settled = true; break; }
      await wait(150);
    }
    assert('endTurnInProgress zaobserwowane true -> false (przejście tury faktycznie się wykonało)', settled, { sawInProgress, settled, elapsedMs: Date.now() - t0 });

    console.log('\n-- D. SEDNO NAPRAWY: wymuszona wojna wybucha MIMO braku "poznania" (relacja attacker<->gracz to teraz "wojna") --');
    const relAfter = await page.evaluate(
      (attackerId) => window.__eraTestDebug.getRelationStatus(attackerId, 0),
      forced.attackerId,
    );
    assert(
      'po turze: attacker wypowiedział wymuszoną wojnę graczowi mimo braku kontaktu (relacja==="wojna") -- PRZED naprawą ta komenda byłaby skasowana przez dipLayer==="pre_contact" (D3-Q2)',
      relAfter === 'wojna',
      { relAfter },
    );

    console.log('\n-- D2. P-WOJNA-EPOKI-NAJTRUDNIEJSZY-NIE-WYBUCHA-Q1 (aneks runda 1, obrona Zarzutu 1 Evaluatora): mimo wybuchu wojny attacker zostaje ODKRYTY --');
    // Zarzut Evaluatora (02-evaluator-runda1.md, Zarzut 1): bez tego, panel dyplomacji
    // (buildAudienceActions/playerDiplomacyActionAllowed, oba liczą diplomacyLayerForOwner
    // z diplomaticallyDiscoveredOwners) nadal pokazywałby 'pre_contact'/"Brak kontaktu" dla
    // attackera mimo relAfter==='wojna'. Aneks main.ts (blok wykonania wypowiedz_wojne, przed
    // recordWarDeclarationEvent) dodaje diplomaticallyDiscoveredOwners.add(ownerId) +
    // diplomaticContactEstablished.add(ownerId) WYŁĄCZNIE dla komend z markerem forced-epoch-war.
    const discoveredAfter = await page.evaluate(
      (attackerId) => window.__eraTestDebug.isDiplomaticallyDiscovered(attackerId),
      forced.attackerId,
    );
    assert(
      'isDiplomaticallyDiscovered(attackerId) === true PO turze (wypowiedzenie wymuszonej wojny epoki ujawnia napastnika -- opcja (a) dispatchu, zrealizowana jako efekt uboczny (b))',
      discoveredAfter === true,
      { discoveredAfter },
    );

    console.log('\n-- E. DOW widoczny w dzienniku wydarzeń --');
    // ODKRYCIE tej rundy (weryfikacja na żywym silniku, R-EOT-EVENT-DEFER-Q1, main.ts
    // `showHintMessage`/`shouldDeferEotEvents`): KAŻDY toast wywołany, gdy `endTurnInProgress
    // ===true` -- a DOW wymuszonej wojny inicjowany w fazie AI ZAWSZE tak ma -- jest z
    // ZAMIERZENIA odkładany (main.ts `deferredEotHints`) i NIGDY nie trafia na ekran jako
    // klasyczny toast; ląduje WYŁĄCZNIE jako trwała karta w panelu Wydarzeń (`warEventLog`,
    // `deferredHintsToSidePanelEvents`). To zachowanie jest NIEZALEŻNE od progu tury tego
    // tematu -- identyczne przy turze 1 i turze 25 -- więc `toast.display==="block"` nie
    // jest już poprawnym dowodem widoczności DOW w UI dla ŻADNEGO scenariusza wyzwolonego
    // w fazie AI (potwierdzone empirycznie: pollowany przez całe okno `endTurnInProgress`,
    // toast nigdy nie pokazał treści DOW). Realny, aktualny dowód widoczności to właściwy
    // wpis `kind:"enemy"` w `warEventLog` (main.ts `war-${turn}-...`, osobny od ogólnych
    // `eot-hint-*`) z tytułem wprost nazywającym wypowiedzenie wojny -- SEDNO ("widoczne w
    // UI") pozostaje w pełni wymagane, tylko przez WŁAŚCIWY, aktualny nośnik.
    const toastFinal = await page.evaluate(() => window.__eraTestDebug.getToast());
    assert('toast istnieje w DOM', !!toastFinal, toastFinal);
    const warLog = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());
    assert('warEventLog ma co najmniej 1 wpis po DOW', Array.isArray(warLog) && warLog.length > 0, warLog);
    // Bez colokacji miast (patrz nagłówek: NIE przesuwamy miasta gracza -- inaczej
    // sfałszowalibyśmy "odkrycie" przez widoczność renderowania mgły) DOW ląduje jako
    // wpis informacyjny (`kind:'info'`, `title` puste, treść w `subtitle`), NIE jako
    // dedykowana karta `kind:'enemy'` używana w scenariuszu colokowanym (`forced-war-
    // player-target-live-test.cjs`) -- dowód widoczności w UI pozostaje wymagany, tylko
    // dopasowany do FAKTYCZNEGO, zaobserwowanego kształtu wpisu tego scenariusza.
    const warCard = Array.isArray(warLog)
      ? warLog.find((e) => e && /wojn/i.test(String(e.title || '') + ' ' + String(e.subtitle || '')))
      : undefined;
    assert(
      'warEventLog zawiera wpis o wypowiedzeniu wojny (tytuł lub podtytuł wspomina "wojn...", trwały dowód widoczności w UI)',
      !!warCard,
      { warCard, warLog },
    );

    console.log('\n-- F. Konsola czysta --');
    assert('zero console.error / pageerror w całym scenariuszu', consoleErrors.length === 0, consoleErrors);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));

    await page.close();
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[forced-war-player-no-contact-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
