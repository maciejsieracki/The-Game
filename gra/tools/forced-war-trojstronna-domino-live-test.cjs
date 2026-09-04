'use strict';
/**
 * forced-war-trojstronna-domino-live-test.cjs — R-DYPLO-AI-WOJNA-TROJSTRONNA-Q1, runda 1,
 * antycypowany zarzut własny (Operator Sonnet 5, effort=high, 2026-09-03, worktree izolowany
 * /home/user/wt-wojna-trojstronna).
 *
 * Wcześniejsza praca tej samej rundy 1 zamknęła kryteria z SAMĄ czystą funkcją
 * (`pickBronzeForcedWarDominoOwnerIds` itd., forced-war-trojstronna-test.cjs) i regexem na
 * main.ts (forced-war-trojstronna-main-guard-test.cjs) — to samo w sobie NIE dowodzi, że OBIE
 * strony pary faktycznie WYPOWIADAJĄ WOJNĘ przez realną ścieżkę silnika w tej samej turze. Ta
 * bramka, wzorem
 * `forced-war-player-target-live-test.cjs` (11/11 PASS): realny `vite build`, realny headless
 * Chromium (`?playtest=mapa`), REALNE funkcje silnika (`triggerPlayerEndTurn` → `runAiPhase` →
 * `decideAIDiplomacy` → komenda `wypowiedz_wojne` → `applyDiploEventTracked`/
 * `setDiploRelation`) — ZERO reimplementacji domina ani warstwy dyplomacji.
 *
 * Fast-forward: hak `window.__eraTestDebug.forceBronzeForcedWarDominoOnPlayer()` (main.ts,
 * obok `forceBronzeForcedWarOnPlayer()`) zakłada REALNE drugie miasto AI (`foundCityAt`, ta
 * sama funkcja co przy generacji świata) obok jedynego AI, jakie ma `?playtest=mapa`,
 * ustawia OBU stronom REALNĄ aktywną wojnę wymuszoną Brązu między sobą
 * (`bronzeForceWarActiveByPairKey`) i oznacza OBIE jako odkryte przez gracza
 * (`diplomaticallyDiscoveredOwners`) — dokładnie stan wejściowy z WYZWALACZA dispatchu
 * ("jakaś cywilizacja ma już parę i z kimś walczy, a gracz nie ma swojej pary"). Jedyne co
 * jest "oszukane": KTO ma tę parę i ŻE gracz już je odkrył (normalnie ustawia to zwiad na
 * mapie) — TEMPO dojścia do scenariusza, nie MECHANIZM domina ani wypowiedzenia wojny.
 *
 * Pokrycie:
 *  A. Bootstrap `?playtest=mapa` dobiega końca.
 *  B. `forceBronzeForcedWarDominoOnPlayer()` faktycznie zakłada drugą stronę i parę.
 *  C. Realny `triggerPlayerEndTurn()` dobiega końca.
 *  D. SEDNO kryterium 1 (GOAL 1): OBIE strony (attacker i target) wypowiadają wojnę
 *     graczowi W TEJ SAMEJ turze -- nie tylko jedna.
 *  E. SEDNO kryterium 2 / ECHO 2 (GOAL 2): druga rozgrywka tego samego scenariusza, ale
 *     strona-napastnik ma aktywny sojusz z graczem -- ŻADNA strona nie wypowiada wojny.
 *  F. Wariant ECHO 2 "KTÓRAKOLWIEK strona": sojusz akurat strony-obrońcy blokuje TĘ SAMĄ
 *     parę.
 *  G. Zero console.error / pageerror w trakcie scenariuszy D/E/F.
 *
 * Bramka (z katalogu gra/): node tools/forced-war-trojstronna-domino-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-forced-war-trojstronna-domino-live-test');
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
  console.log('[forced-war-trojstronna-domino-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[forced-war-trojstronna-domino-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[forced-war-trojstronna-domino-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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

/** Odgrywa JEDEN scenariusz domina na świeżym, już zbootstrapowanym `page`: zakłada parę,
 *  ewentualnie sojusz jednej ze stron, gra jedną realną turę, zwraca statusy relacji obu
 *  stron z graczem PO turze. `page` musi być na turze 1 -- wołający cofa turę pomiędzy
 *  scenariuszami przez świeży `gotoPlaytestMapa` (najprostszy sposób na czysty stan bez
 *  reimplementowania resetu domina). */
async function playDominoScenario(page, consoleErrors, allianceSide) {
  const forced = await page.evaluate(
    (side) => window.__eraTestDebug.forceBronzeForcedWarDominoOnPlayer(side ? { allianceSide: side } : undefined),
    allianceSide ?? null,
  );
  assert(
    'forceBronzeForcedWarDominoOnPlayer(): attackerId i targetId zwrócone, obaj > 0 i różni',
    typeof forced.attackerId === 'number' && forced.attackerId > 0
      && typeof forced.targetId === 'number' && forced.targetId > 0
      && forced.attackerId !== forced.targetId,
    forced,
  );
  const pairRelBefore = await page.evaluate(
    ({ a, b }) => window.__eraTestDebug.getRelationStatus(a, b),
    { a: forced.attackerId, b: forced.targetId },
  );
  assert('przed turą: attacker i target JUŻ są w realnej wojnie ze sobą (para domina)', pairRelBefore === 'wojna', { pairRelBefore });
  const relAttBefore = await page.evaluate((a) => window.__eraTestDebug.getRelationStatus(a, 0), forced.attackerId);
  const relTgtBefore = await page.evaluate((b) => window.__eraTestDebug.getRelationStatus(b, 0), forced.targetId);
  assert('przed turą: attacker i gracz NIE są w wojnie', relAttBefore !== 'wojna', { relAttBefore });
  assert('przed turą: target i gracz NIE są w wojnie', relTgtBefore !== 'wojna', { relTgtBefore });

  // `?playtest=mapa` stawia jednostkę gracza CELOWO tuż przy jedynym realnym AI (myślane
  // pod pojedynczą bitwę/oblężenie, patrz PLAYTEST_MAPA_HINT) -- gdy ta AI właśnie
  // wypowiedziała wojnę graczowi (domino, strona 1/2), jej WŁASNA, niezwiązana z tym
  // tematem logika bojowa potrafi tej samej tury zaatakować sąsiadujący oddział gracza,
  // co woła `launchIncomingMapFieldBattle` + `break ownerLoop` (main.ts) -- PRZERYWA całą
  // `ownerLoop` PRZED dotarciem do drugiej strony pary (target), z asynchronicznym
  // wznowieniem po animacji bitwy, którego ten headless test nie steruje. Ten sam hazard,
  // ten sam sandbox, ta sama naprawa co istniejący `__rebelProtectionTestDebug.
  // pullPlayerUnitsHome()` (P-BUNT-OCHRONA-Q1) -- odsuwa WYŁĄCZNIE POZYCJĘ jednostek
  // gracza (nie dotyka jednostek AI ani mechanizmu bitwy), żeby cała `ownerLoop` (OBIE
  // strony pary domina) dobiegła końca w JEDNYM, synchronicznym `runAiPhase()` tej tury.
  await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());

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
  await wait(500);

  const relAttAfter = await page.evaluate((a) => window.__eraTestDebug.getRelationStatus(a, 0), forced.attackerId);
  const relTgtAfter = await page.evaluate((b) => window.__eraTestDebug.getRelationStatus(b, 0), forced.targetId);
  return { attackerId: forced.attackerId, targetId: forced.targetId, relAttAfter, relTgtAfter };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[forced-war-trojstronna-domino-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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
    assert('bootstrap zakończony: turn===1', world0.turn === 1, world0);

    console.log('\n-- B/C/D. Scenariusz 1 (GOAL 1, kryterium 1): para bez sojuszu -- OBIE strony wypowiadają wojnę w TEJ SAMEJ turze --');
    const s1 = await playDominoScenario(page, consoleErrors, null);
    assert(
      'po turze: attacker WYPOWIEDZIAŁ wojnę graczowi (domino, strona 1/2)',
      s1.relAttAfter === 'wojna',
      s1,
    );
    assert(
      'po turze: target TEŻ wypowiedział wojnę graczowi, W TEJ SAMEJ turze (domino, strona 2/2 -- SEDNO GOAL 1)',
      s1.relTgtAfter === 'wojna',
      s1,
    );

    console.log('\n-- E. Scenariusz 2 (GOAL 2/ECHO 2): sojusz strony-NAPASTNIKA z graczem -- ŻADNA strona nie wypowiada wojny --');
    await gotoPlaytestMapa(page);
    const s2 = await playDominoScenario(page, consoleErrors, 'attacker');
    assert(
      'po turze: attacker (sojusznik gracza) NIE wypowiedział wojny -- mechanizm zablokowany dla całej pary',
      s2.relAttAfter !== 'wojna',
      s2,
    );
    assert(
      'po turze: target TEŻ NIE wypowiedział wojny mimo braku WŁASNEGO sojuszu -- ECHO 2 blokuje CAŁĄ parę, nie tylko sojusznika',
      s2.relTgtAfter !== 'wojna',
      s2,
    );

    console.log('\n-- F. Scenariusz 3 (ECHO 2 "KTÓRAKOLWIEK strona"): sojusz strony-OBROŃCY z graczem -- ta sama blokada --');
    await gotoPlaytestMapa(page);
    const s3 = await playDominoScenario(page, consoleErrors, 'defender');
    assert(
      'po turze: target (sojusznik gracza) NIE wypowiedział wojny',
      s3.relTgtAfter !== 'wojna',
      s3,
    );
    assert(
      'po turze: attacker TEŻ NIE wypowiedział wojny mimo braku WŁASNEGO sojuszu -- sojusz OBROŃCY blokuje CAŁĄ parę tak samo jak sojusz napastnika (ECHO 2, symetria)',
      s3.relAttAfter !== 'wojna',
      s3,
    );

    console.log('\n-- G. Konsola czysta przez wszystkie 3 scenariusze --');
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
  console.error('[forced-war-trojstronna-domino-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
