'use strict';
/**
 * era-change-toast-live-test.cjs — P-EPOKA-BRAK-INFO-REGRESJA-BRAZ (Operator Sonnet 5,
 * 2026-08-16, worktree izolowany).
 *
 * KONTEKST: temat `P-EPOKA-BRAK-INFO-PODBOJ-PANSTW-MIAST` (toast awansu epoki połykany przez
 * kolejkę EOT) był formalnie zamknięty (`6936d4d3`/`90661f91`), a jedyna dotychczasowa bramka
 * (`era-change-toast-defer-test.cjs`) jest WYŁĄCZNIE strukturalna — regexy na TEKŚCIE main.ts,
 * zero realnej egzekucji (main.ts nie jest bundlowany osobno, patrz jej własny docstring).
 * Maciej zgłosił ponownie „przyszedłem do brązu, ale nie widziałem żadnej informacji" na
 * świeżej grze PO pullu. Recon (żywy headless Chromium, ta sama metoda co ten plik) wykazał:
 * MECHANIZM DZIAŁA POPRAWNIE w realnej egzekucji — root cause nie był w main.ts. Root cause:
 * bundle `gra-robocza/Gra-ROBOCZA.html` (FALA 287, md5 `a2afa359`) był zbudowany z HEAD
 * `3e36fcc5`, PRZED commitem `6936d4d3` — sam WERSJE.md to jawnie dokumentuje („NIE WESZŁO do
 * tego bundla"). `grep -c pendingEraChangeToastForNextTurn gra-robocza/Gra-ROBOCZA.html` → 0.
 * Maciej grał na bundlu bez naprawy — to luka DEPLOYU, nie kodu.
 *
 * TA BRAMKA nie naprawia kodu (nie było czego) — domyka lukę w POKRYCIU TESTOWYM: żaden
 * dotychczasowy test nie wykonywał realnie `notifyPlayerEraChangeIfAdvanced` /
 * `flushPendingEraChangeToast` w przeglądarce dla scenariusza „nowa gra, PIERWSZE przejście
 * epoki Kamień->Brąz przez EOT auto-badania" (main.ts ~25320 — najczęstsza ścieżka gracza).
 * Wzorem `sidepanel-hud-deadzone-test.cjs`: realny `vite build`, realny headless Chromium
 * (`?playtest=mapa`), REALNE funkcje silnika (`triggerPlayerEndTurn`, `researchStep`,
 * `reconcilePlayerEraFromResearch`, `notifyPlayerEraChangeIfAdvanced`, `showHintMessage`,
 * `flushPendingEraChangeToast`) — zero reimplementacji formuły.
 *
 * Fast-forward: `?playtest=mapa` startuje w Brązie (era=2) z definicji (sandbox testowy) —
 * hak `window.__eraTestDebug.prepareOneTechFromBronze()` (main.ts, obok
 * `__civ_getResearchedTechs`/`__civEmbarkDebug`) cofa stan gracza do era=1 z DOKŁADNIE jednym
 * brakującym techem Kamienia (Brązownictwo, jedyny tech z `awansDoEpoki:2`) i bankiem nauki
 * DOKŁADNIE wystarczającym na jego ukończenie (`scaledResearchCost` — ta sama formuła co
 * `researchStep`, zero kaskady w głąb Brązu). To NIE jest inny kod path — `endTurn()` w haku
 * woła REALNĄ `triggerPlayerEndTurn()`, identyczną z tą pod przyciskiem „Zakończ turę"/klawiszem.
 * Jedyne co jest "oszukane" to TEMPO dojścia do stanu wyjściowego (dziesiątki tur pominięte),
 * nie MECHANIZM przejścia epoki.
 *
 * Pokrycie:
 *  A. Bootstrap sandboxa dobiega końca (miasta+jednostki obecne, tura=1) zanim cokolwiek
 *     mierzymy — zabezpieczenie przed race condition (zmierzone realnie podczas reconu: bez
 *     tej bramki `citiesLen` bywał 0 nawet po >40s w tym środowisku, software WebGL).
 *  B. `prepareOneTechFromBronze()` faktycznie cofnął erę do 1 i zostawił dokładnie 1 brakujący
 *     tech Kamienia (era1Count===12, zbadaneSize===11 po wywołaniu).
 *  C. Realny `triggerPlayerEndTurn()` kończy przejście tury (endTurnInProgress true → false).
 *  D. PO przejściu: `player.era === 2` (era faktycznie awansowała, nie tylko lokalnie w
 *     researchStep — przeszła przez `reconcilePlayerEraFromResearch`).
 *  E. PO przejściu: `#civ-hint-toast` jest WIDOCZNY (`display:block`) i zawiera dokładnie tekst
 *     „Nowa epoka" + „Brązu" — TO JEST SEDNO zgłoszenia Macieja („nie widziałem żadnej
 *     informacji"). Regresja rundy „P-EPOKA-TOAST-EOT-POLYKANY" (toast połknięty przez
 *     `deferredEotHints`, zamieniony w bierną kartę „Koniec tury") dałaby tu FAIL.
 *  F. Trwały wpis w dzienniku WYDARZEŃ (`warEventLog`, id `era-<tura>-<epoka>`) obecny
 *     RÓWNOLEGLE z toastem — obie ścieżki komunikatu, nie tylko jedna.
 *  G. Zero console.error / pageerror w trakcie scenariusza.
 *
 * Bramka (z katalogu gra/): node tools/era-change-toast-live-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-era-change-toast-live-test');
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
  console.log('[era-change-toast-live-test] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[era-change-toast-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[era-change-toast-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
  // Bootstrap doStartPlaytestMapaSwiata kończy się SYNCHRONICZNIE dopiero po zniknięciu
  // overlayu, ale renderer (WebGL software/swiftshader w tym sandboksie) bywa wolniejszy niż
  // znikniecie overlayu -- czekaj TWARDO na cities.length>0 && turn===1 (bootstrap realnie
  // dobiegł końca), nie tylko na overlay. Zmierzone realnie podczas reconu tego tematu: bez
  // tego kroku citiesLen bywał 0 nawet kilkanaście sekund po zniknięciu overlayu.
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
    console.error('[era-change-toast-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
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

    console.log('\n-- B. prepareOneTechFromBronze(): era cofnięta do 1, brakuje dokładnie Brązownictwa --');
    const prep = await page.evaluate(() => window.__eraTestDebug.prepareOneTechFromBronze());
    assert('remaining tech === "Brązownictwo" (jedyny tech Kamienia z awansDoEpoki:2)', prep.remaining === 'Brązownictwo', prep);
    assert('era1Count === 12 (liczba techów Kamienia w tech.json)', prep.era1Count === 12, prep);
    const afterPrep = await page.evaluate(() => window.__eraTestDebug.getPlayerState());
    assert('po prepare: era===1', afterPrep.era === 1, afterPrep);
    assert('po prepare: zbadaneSize===11 (12 - Brązownictwo)', afterPrep.zbadaneSize === 11, afterPrep);

    console.log('\n-- C. Realny triggerPlayerEndTurn() (ta sama funkcja co przycisk "Zakończ turę") --');
    await page.evaluate(() => window.__eraTestDebug.endTurn());
    const t0 = Date.now();
    let sawInProgress = false;
    let settled = false;
    while (Date.now() - t0 < 60000) {
      const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
      if (inProg) sawInProgress = true;
      if (sawInProgress && !inProg) { settled = true; break; }
      await wait(150);
    }
    assert('endTurnInProgress zaobserwowane true -> false (przejście tury faktycznie się wykonało)', settled, { sawInProgress, settled, elapsedMs: Date.now() - t0 });
    // Margines na flushPendingEraChangeToast() (finally, tuż po endTurnInProgress=false) +
    // faktyczne malowanie DOM.
    await wait(500);

    console.log('\n-- D. Era faktycznie awansowała (reconcilePlayerEraFromResearch), nie tylko lokalnie w researchStep --');
    const afterEnd = await page.evaluate(() => window.__eraTestDebug.getPlayerState());
    assert('po end turn: era===2', afterEnd.era === 2, afterEnd);
    assert('po end turn: Brązownictwo faktycznie zbadane (zbadaneSize>=12)', afterEnd.zbadaneSize >= 12, afterEnd);

    console.log('\n-- E. SEDNO zgłoszenia Macieja: toast "Nowa epoka" faktycznie WIDOCZNY po przejściu tury --');
    const toast = await page.evaluate(() => window.__eraTestDebug.getToast());
    assert('toast istnieje w DOM', !!toast, toast);
    if (toast) {
      assert('toast display==="block" (widoczny, nie ukryty)', toast.display === 'block', toast);
      assert('toast HTML zawiera "Nowa epoka"', toast.html.includes('Nowa epoka'), toast);
      assert('toast HTML zawiera "Brązu"', toast.html.includes('Brązu'), toast);
    }

    console.log('\n-- F. Trwały wpis w dzienniku WYDARZEŃ obecny RÓWNOLEGLE z toastem --');
    const warLog = await page.evaluate(() => window.__eraTestDebug.getWarEventLogHead());
    const eraEntry = warLog.find((e) => typeof e.id === 'string' && e.id.startsWith('era-'));
    assert('warEventLog zawiera wpis "era-*" (Nowa epoka: Brązu)', !!eraEntry, warLog);
    if (eraEntry) {
      assert('wpis dziennika: title zawiera "Nowa epoka"', String(eraEntry.title).includes('Nowa epoka'), eraEntry);
    }

    console.log('\n-- G. Konsola czysta --');
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
  console.error('[era-change-toast-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
