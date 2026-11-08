'use strict';
/**
 * forced-war-iron-player-target-live-test.cjs — R-WOJNA-ZELAZO-DOWOD-ROZGRYWKA-Q1
 * (Operator Sonnet 5, effort=medium, 2026-08-31, worktree izolowany).
 *
 * Lustro `forced-war-player-target-live-test.cjs` (P-WOJNA-WYMUSZONA-TRZY-NAPRAWY-Q1,
 * Brąz) — dokładnie ta sama konstrukcja, dla Żelaza. Dispatch ZAKAZUJE zamknięcia
 * kryteriów końca samym testem jednostkowym — wymaga realnej weryfikacji w headless
 * Chromium (Playwright). TA bramka: realny `vite build`, realny headless Chromium
 * (`?playtest=mapa`), REALNE funkcje silnika (`triggerPlayerEndTurn` → `runAiPhase` →
 * `decideAIDiplomacy` → `pickIronForcedWarTargetId` → komenda `wypowiedz_wojne` →
 * `applyDiploEventTracked`/`showHintMessage`/`recordWarDeclarationEvent`) — ZERO
 * reimplementacji formuły wyboru celu ani warstwy dyplomacji.
 *
 * Fast-forward: hak `window.__eraTestDebug.forceIronForcedWarOnPlayer()` (main.ts,
 * obok `forceBronzeForcedWarOnPlayer()`) wybiera realnego AI ownera z bieżącego świata,
 * czyści jego realne wojny (poza barbarzyńcami — C-BARB-Q1, struktura NIE dotknięta),
 * ustawia mu `ironForceWarPendingOwners` (dokładnie to, co normalnie ustawia awans
 * do Żelaza) i przesuwa jego miasto referencyjne na tę samą pozycję co pierwsze miasto
 * gracza — gracz staje się kandydatem o dystansie 0, więc wygrywa (dystans + tie-break
 * najniższego ownerId, `pickForcedWarTargetId`, forced-war-common.ts, NIETKNIĘTY).
 * Jedyne co jest "oszukane": KTÓRA AI ma pending wpis i ŻE jest już "odkryta" przez
 * gracza (normalnie ustawia to widoczność na mapie) — TEMPO dojścia do scenariusza,
 * nie MECHANIZM wyboru celu ani wypowiedzenia wojny.
 *
 * R-WOJNA-WYMUSZONA-PROG-TURY-GRACZ-Q1 (runda 2): gracz dołącza do puli triggeredSubjects
 * dopiero od `turn >= WOJNA_KAMIEN_WYMUSZONA_START_TURY` (main.ts) -- ten test fast-forwarduje
 * REALNYMI `endTurn()` do tury 24 (krok A2) PRZED wywołaniem `forceIronForcedWarOnPlayer()`,
 * żeby scenariusz D/E uruchamiał się w turze 25 (próg spełniony), nie w turze 1 (gdzie próg
 * celowo blokuje dołączenie gracza -- to jest ZAMIERZONE zachowanie, nie regresja tego testu).
 *
 * Pokrycie:
 *  A. Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
 *  A2. Fast-forward realnymi `endTurn()` do tury 24 (próg gracza jeszcze nie minął).
 *  B. `forceIronForcedWarOnPlayer()` faktycznie wybrał realnego AI ownera i wyzerował
 *     jego wojny (poza barbarzyńcami) — sanity przed właściwym testem.
 *  C. Realny `triggerPlayerEndTurn()` (ta sama funkcja co przycisk „Zakończ turę")
 *     dobiega końca.
 *  D. SEDNO: relacja attacker<->gracz faktycznie zmienia status na 'wojna' — gracz
 *     ZOSTAŁ WYBRANY jako cel wymuszonej wojny Żelaza.
 *  E. SEDNO: wypowiedzenie wojny jest WIDOCZNE w UI (toast `#civ-hint-toast`) i w
 *     dzienniku wydarzeń (`warEventLog`).
 *  F. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/forced-war-iron-player-target-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-forced-war-iron-player-target-live-test');
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
  console.log('[forced-war-iron-player-target-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[forced-war-iron-player-target-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[forced-war-iron-player-target-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
    console.error('[forced-war-iron-player-target-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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

    console.log('\n-- B. forceIronForcedWarOnPlayer(): realny AI owner wybrany, wojny wyzerowane --');
    const forced = await page.evaluate(() => window.__eraTestDebug.forceIronForcedWarOnPlayer());
    assert('attackerId zwrócony i > 0 (realny AI, nie gracz/barbarzyńca)', typeof forced.attackerId === 'number' && forced.attackerId > 0, forced);
    const relBefore = await page.evaluate(
      (attackerId) => window.__eraTestDebug.getRelationStatus(attackerId, 0),
      forced.attackerId,
    );
    assert('przed turą: attacker i gracz NIE są w wojnie', relBefore !== 'wojna', { relBefore });

    console.log('\n-- C. Realny triggerPlayerEndTurn() (ta sama funkcja co przycisk "Zakończ turę") --');
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

    console.log('\n-- D. SEDNO: gracz ZOSTAŁ WYBRANY jako cel — relacja attacker<->gracz to teraz "wojna" --');
    const relAfter = await page.evaluate(
      (attackerId) => window.__eraTestDebug.getRelationStatus(attackerId, 0),
      forced.attackerId,
    );
    assert('po turze: attacker wypowiedział wojnę graczowi (relacja==="wojna")', relAfter === 'wojna', { relAfter });

    console.log('\n-- E. SEDNO: DOW widoczny w UI i w dzienniku wydarzeń --');
    // ODKRYCIE tej rundy (weryfikacja na żywym silniku, R-EOT-EVENT-DEFER-Q1, main.ts
    // `showHintMessage`/`shouldDeferEotEvents`): KAŻDY toast wywołany, gdy `endTurnInProgress
    // ===true` -- a DOW wymuszonej wojny inicjowany w fazie AI ZAWSZE tak ma -- jest z
    // ZAMIERZENIA odkładany (main.ts `deferredEotHints`) i NIGDY nie trafia na ekran jako
    // klasyczny toast; ląduje WYŁĄCZNIE jako trwała karta w panelu Wydarzeń (`warEventLog`,
    // `deferredHintsToSidePanelEvents`). To zachowanie jest NIEZALEŻNE od progu tury tego
    // tematu -- identyczne przy turze 1 i turze 25 -- więc `toast.display==="block"` nie
    // jest już poprawnym dowodem widoczności DOW w UI dla ŻADNEGO scenariusza wyzwolonego
    // w fazie AI (potwierdzone: `sawWarToastBlock` konsekwentnie `null` mimo pollingu przez
    // całe okno `endTurnInProgress`). Realny, aktualny dowód widoczności to properny wpis
    // `kind:"enemy"` w `warEventLog` (main.ts `war-${turn}-...`, osobny od ogólnych
    // `eot-hint-*`) z tytułem wprost nazywającym wypowiedzenie wojny -- SEDNO ("widoczne w
    // UI") pozostaje w pełni wymagane, tylko przez WŁAŚCIWY, aktualny nośnik.
    const toastFinal = await page.evaluate(() => window.__eraTestDebug.getToast());
    assert('toast istnieje w DOM', !!toastFinal, toastFinal);
    const warLog = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());
    assert('warEventLog ma co najmniej 1 wpis po DOW', Array.isArray(warLog) && warLog.length > 0, warLog);
    const warCard = Array.isArray(warLog)
      ? warLog.find((e) => e && e.kind === 'enemy' && /wojn/i.test(String(e.title || '')))
      : undefined;
    assert(
      'warEventLog zawiera dedykowaną kartę "kind: enemy" z tytułem o wypowiedzeniu wojny (trwały dowód widoczności w UI)',
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
  console.error('[forced-war-iron-player-target-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
