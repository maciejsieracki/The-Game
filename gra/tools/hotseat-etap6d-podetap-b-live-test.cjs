'use strict';
/**
 * hotseat-etap6d-podetap-b-live-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-B-Q1.
 *
 * Żywy dowód w headless Chromium (R-PROC-AUTOBOT.md §9 pkt 6a, dispatch REGUŁA PRZECIW
 * SAMOOSZUKIWANIU) dla ścieżki UI HUD/panel dyplomacji tego tematu — wzorem
 * `hotseat-etap6d-podetap-e-live-test.cjs` i `dyplo-mapa-odkrycie-live-test.cjs`: realny
 * `vite build`, realny `?playtest=mapa`, REALNE kliknięcia w HUD/panelu dyplomacji/panelu
 * imperium. Pokrywa transitywnie (kliknięcie -> realny render -> realne wywołanie z main.ts):
 *   - `buildPlayerDiploRelations` (panel dyplomacji, wiersz kontaktu),
 *   - `buildDiploPairSummaryData`, `buildAudienceActions`, `buildPendingNegotiationRows`
 *     (panel audiencji, otwierany przyciskiem "Porozmawiaj" z wiersza panelu dyplomacji —
 *     ta sama ścieżka co realny klik gracza, NIE `__audienceRelTestDebug.openAudience`),
 *   - `buildEmpireDetailSnap` (panel imperium, zakładka "Miasta", chip HUD data-act="miasta").
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (REGUŁA PRZECIW SAMOOSZUKIWANIU): druga budowa bundla z `ME()`
 * (main.ts) na sztywno zwracającym BŁĘDNY ownerId (99, nie realny gracz 0) -- silniejsza
 * mutacja niż samo `isMe()=>false`, bo `isMe()` jest zdefiniowane jako `ownerId===ME()`, więc
 * psuje RÓWNOCZEŚNIE każde miejsce wołające `ME()` wprost i każde wołające `isMe()`. Efekt
 * widoczny w DOM:
 *   (a) panel imperium/Miasta: `buildEmpireDetailSnap`'s `pc = cities.filter(c=>isMe(c.ownerId))`
 *       -> z ME()=>99 realne miasta gracza (ownerId=0) nigdy nie pasują -> `pc=[]` -> zakładka
 *       "Miasta" renderuje "0 miast"/"Brak miast" mimo że gracz REALNIE ma miasta w świecie
 *       (potwierdzone przez `__eraTestDebug.getWorldState().citiesLen>0` na starcie) — to jest
 *       GŁÓWNY, czysty dowód tej bramki.
 *   (b) panel dyplomacji: `buildPlayerDiploRelations`'s `getDiploRelation(ME(), otherId)` ->
 *       z ME()=>99 klucz relacji "99_otherId" nie istnieje -> `defaultNeutralRelation()` (inne
 *       zaufanie/status niż REALNIE ustawiona przyjazna relacja kontaktu) -> tekst statystyk
 *       wiersza `.cd-row` różni się między PO i ZEPSUTYM.
 *
 * ŚWIADOMIE NIE OTWARTE w tej bramce (jawnie zgłoszone): `foreignCivsMissingTradeTreatyForCity`,
 * `collectDiploChipCounts` (pole HUD nieużywane w DOM dziś — patrz main.ts `chips` w
 * `buildHudState`, brak konsumenta w hud.ts), `enqueueNegotiationFromAiCmd`,
 * `applyBorderMarchPenaltiesEndTurn`, `currentVisibleForOwner`, `peacefulArchetypeForOwner` —
 * bez bezpośredniej, pojedynczo-klikalnej ścieżki UI w jednej turze bez rozgrywania scenariusza
 * AI; pokryte realnym wykonaniem w `hotseat-etap6d-podetap-b-exec-test.cjs` (dispatch dopuszcza
 * to wprost dla funkcji "czysto silnikowych/pomocniczych").
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6d-podetap-b-live-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const POST_OUT_DIR = path.join(os.tmpdir(), `civ-6d-b-POST-dist-${RUN_ID}`);
const MUT_GRA_DIR = path.join(os.tmpdir(), `civ-6d-b-MUT-${RUN_ID}`);
const MUT_OUT_DIR = path.join(os.tmpdir(), `civ-6d-b-MUT-dist-${RUN_ID}`);

process.on('exit', () => {
  for (const d of [POST_OUT_DIR, MUT_GRA_DIR, MUT_OUT_DIR]) {
    try { fs.rmSync(d, { recursive: true, force: true }); } catch { /* best-effort */ }
  }
});

let pass = 0;
let fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log('  OK  ' + label); }
  else { fail++; console.error(' FAIL ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

function log(msg) { console.log('[hotseat-etap6d-podetap-b-live] ' + msg); }

function buildBundle(outDir, cwd) {
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(cwd, outDir))} --emptyOutDir`,
    { cwd, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDir);
  }
}

function prepareMutatedGraDir() {
  log('przygotowanie katalogu ZEPSUTEGO (ME() na sztywno 99, dowód nietautologiczności)...');
  fs.rmSync(MUT_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MUT_GRA_DIR, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent.startsWith('dist')) continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(MUT_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(MUT_GRA_DIR, 'node_modules'));
  const mainPath = path.join(MUT_GRA_DIR, 'src/main.ts');
  const src = fs.readFileSync(mainPath, 'utf8');
  const NEEDLE = 'function ME(): number {\n      return humanSeats.activeHumanOwnerId;\n    }';
  const REPLACEMENT = 'function ME(): number {\n      return 99;\n    }';
  if (!src.includes(NEEDLE)) {
    throw new Error('prepareMutatedGraDir: nie znaleziono definicji ME() do mutacji -- '
      + 'main.ts zmienił się od czasu napisania tej bramki, zaktualizuj NEEDLE.');
  }
  fs.writeFileSync(mainPath, src.replace(NEEDLE, REPLACEMENT), 'utf8');
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page, outDir) {
  const url = 'file://' + path.join(outDir, 'index.html') + '?playtest=mapa';
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs', { timeout: 120000 });
  for (let i = 0; i < 90; i++) {
    const overlayCount = await page.locator('text=Tworzenie świata').count();
    if (overlayCount === 0) break;
    await wait(1000);
  }
  await page.waitForFunction(
    () => !!window.__dyploMapaOdkrycieTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  await wait(300);
}

/** Otwiera listę dyplomacji przez REALNY klik na przycisk toolbara data-act="diplo"
 *  (`buildPlayerDiploListEntries` -> `buildPlayerDiploRelations`, ta funkcja tego tematu). */
async function openDiplomacyList(page) {
  await page.locator('[data-act="diplo"]').first().click();
  await page.waitForSelector('.civ-diplo-list-hud.open', { timeout: 10000 }).catch(() => {});
  await wait(200);
}

/** Otwiera panel imperium/Miasta przez REALNY klik na chip HUD data-act="miasta"
 *  (`buildEmpireDetailSnap`, ta funkcja tego tematu). */
async function openEmpireMiasta(page) {
  await page.locator('[data-act="miasta"]').first().click();
  await wait(250);
}

async function readMiastoHero(page) {
  return page.evaluate(() => {
    const sect = document.querySelector('.civ-emp-panel [data-section="miasto"]');
    if (!sect) return null;
    const hero = sect.querySelector('.civ-emp-hero');
    return hero ? hero.textContent : null;
  });
}

/** `.dl-meta` renderuje metaLine/detailLine/perspectiveLine (3 divs tej samej klasy) --
 *  `perspectiveLine` niesie "Zaufanie: N" (patrz `formatDiploCivListLines`,
 *  diplomacy-display.ts), wrażliwe na ME() przez `buildPlayerDiploRelations`'s
 *  `getDiploRelation(ME(), otherId)`. Złącz wszystkie, żeby złapać różnicę niezależnie od
 *  pozycji divu. */
async function readFirstDiploListItemDetail(page) {
  return page.evaluate(() => {
    const item = document.querySelector('.civ-diplo-list-hud .dl-item');
    if (!item) return null;
    const metas = Array.from(item.querySelectorAll('.dl-meta')).map(m => m.textContent);
    return metas.join(' | ');
  });
}

async function runScenario(page, outDir, label) {
  log(`--- ${label} ---`);
  await gotoPlaytestMapa(page, outDir);

  const ownerId = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.pickCandidateOwnerId());
  assert(`(${label}.0) kandydat AI znaleziony w świecie ?playtest=mapa`, typeof ownerId === 'number', ownerId);

  // Ustanawia kontakt + relację przyjazną (zaufanie=100) z jednym AI -- REALNY silnik
  // (`setDiploRelation`), wejście do scenariusza, nie efekt tego tematu.
  await page.evaluate((oid) => { window.__dyploMapaOdkrycieTestDebug.prepareContact(oid); }, ownerId);

  // --- Lista dyplomacji: realny klik przycisku toolbara, buildPlayerDiploRelations ---
  await openDiplomacyList(page);
  const rowCount = await page.locator('.civ-diplo-list-hud .dl-item').count();
  assert(`(${label}.1) lista dyplomacji: wiersz kontaktu .dl-item wyrenderowany (buildPlayerDiploRelations/buildPlayerDiploListEntries)`, rowCount >= 1, rowCount);
  const listDetailText = await readFirstDiploListItemDetail(page);

  // --- Pop-up podsumowania pary: realny klik wiersza listy, buildDiploPairSummaryData ---
  await page.locator('.civ-diplo-list-hud .dl-item').first().click();
  await page.waitForSelector('.civ-diplo-pair-summary', { timeout: 10000 }).catch(() => {});
  await wait(150);
  const pairSummaryVisible = await page.locator('.civ-diplo-pair-summary').count();
  assert(`(${label}.2) pop-up podsumowania pary otwarty z REALNEGO kliku wiersza (buildDiploPairSummaryData)`, pairSummaryVisible > 0, pairSummaryVisible);

  // --- Audiencja: realny klik "Zaproponuj spotkanie i negocjacje" w pop-upie (nie hak testowy) ---
  const audBtn = page.locator('[data-act="dps-audience"]');
  const audBtnCount = await audBtn.count();
  let audienceActionCount = -1;
  if (audBtnCount > 0) {
    await audBtn.first().click();
    await page.waitForSelector('.civ-diplo-aud-box', { timeout: 10000 }).catch(() => {});
    await wait(200);
    audienceActionCount = await page.locator('.civ-diplo-aud button[data-aid]').count();
  }
  assert(`(${label}.3) audiencja otwarta z REALNEGO przycisku pop-upu pokazuje >=1 akcję (buildAudienceActions/buildPendingNegotiationRows)`,
    audBtnCount > 0 && audienceActionCount > 0, { audBtnCount, audienceActionCount });
  await page.evaluate(() => { window.__audienceRelTestDebug?.closeAudience?.(); });
  await wait(100);

  // --- Panel imperium / Miasta: realny klik chipa HUD, buildEmpireDetailSnap ---
  await openEmpireMiasta(page);
  const miastoHero = await readMiastoHero(page);

  return { ownerId, listDetailText, miastoHero };
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('playwright nie znaleziony.'); process.exit(1); }

  log('budowanie bundla PO (bieżący worktree, dozwolona komenda vite build)...');
  buildBundle(POST_OUT_DIR, GRA_DIR);
  log('build PO OK.');

  prepareMutatedGraDir();
  log('budowanie bundla ZEPSUTEGO...');
  buildBundle(MUT_OUT_DIR, MUT_GRA_DIR);
  log('build ZEPSUTY OK.');

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];

  try {
    const pagePO = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    pagePO.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('PO: ' + m.text()); });
    pagePO.on('pageerror', (e) => consoleErrors.push('PO: ' + String(e)));
    const resPO = await runScenario(pagePO, POST_OUT_DIR, 'PO');

    assert('(PO.3) panel imperium/Miasta pokazuje miasta gracza (NIE "Brak miast"/"0 miast") -- realne cities.filter(isMe) z main.ts',
      typeof resPO.miastoHero === 'string' && !/Brak miast|^0 miast/.test(resPO.miastoHero), resPO.miastoHero);

    try { await pagePO.close(); } catch { /* noop */ }

    const pageMUT = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    pageMUT.on('console', () => {});
    pageMUT.on('pageerror', () => {});
    const resMUT = await runScenario(pageMUT, MUT_OUT_DIR, 'ZEPSUTY');

    // === DOWÓD NIETAUTOLOGICZNOŚCI (a): buildEmpireDetailSnap ===
    assert('(MUT.3) ZEPSUTY MUSI CZERWIENIEĆ: panel imperium/Miasta pokazuje "Brak miast"/"0 miast" mimo realnych miast gracza (ME()=>99 psuje isMe(c.ownerId) w buildEmpireDetailSnap)',
      typeof resMUT.miastoHero === 'string' && /Brak miast|^0 miast/.test(resMUT.miastoHero), resMUT.miastoHero);

    // === DOWÓD NIETAUTOLOGICZNOŚCI (b): buildPlayerDiploRelations ===
    assert('(MUT.4) ZEPSUTY MUSI CZERWIENIEĆ: linia szczegółów wiersza listy dyplomacji (zaufanie) różni się od PO (getDiploRelation(ME()=99,...) trafia na defaultNeutralRelation zamiast realnie ustawionej relacji kontaktu)',
      resPO.listDetailText !== null && resMUT.listDetailText !== null && resPO.listDetailText !== resMUT.listDetailText,
      { PO: resPO.listDetailText, MUT: resMUT.listDetailText });

    try { await pageMUT.close(); } catch { /* noop */ }

    assert('(E0) PO: zero błędów konsoli/JS podczas przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }

  console.log(`\nhotseat-etap6d-podetap-b-live-test: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
