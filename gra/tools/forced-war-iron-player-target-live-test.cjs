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
 * Pokrycie:
 *  A. Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1).
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
    await wait(500);

    console.log('\n-- D. SEDNO: gracz ZOSTAŁ WYBRANY jako cel — relacja attacker<->gracz to teraz "wojna" --');
    const relAfter = await page.evaluate(
      (attackerId) => window.__eraTestDebug.getRelationStatus(attackerId, 0),
      forced.attackerId,
    );
    assert('po turze: attacker wypowiedział wojnę graczowi (relacja==="wojna")', relAfter === 'wojna', { relAfter });

    console.log('\n-- E. SEDNO: DOW widoczny w UI i w dzienniku wydarzeń --');
    const toast = await page.evaluate(() => window.__eraTestDebug.getToast());
    assert('toast istnieje w DOM', !!toast, toast);
    if (toast) {
      assert('toast display==="block" (widoczny)', toast.display === 'block', toast);
    }
    const warLog = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());
    assert('warEventLog ma co najmniej 1 wpis po DOW', Array.isArray(warLog) && warLog.length > 0, warLog);

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
