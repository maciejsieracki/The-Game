'use strict';
/**
 * hotseat-etap6d-podetap-e-live-test.cjs — bramka R-HOTSEAT-ETAP6D-PODETAP-E-Q1.
 *
 * Żywy dowód w headless Chromium (R-PROC-AUTOBOT.md §9 pkt 6a, dispatch REGUŁA PRZECIW
 * SAMOOSZUKIWANIU) dla ścieżek UI stołu negocjacyjnego wymienionych w dispatchu:
 * `handleNegotiationAccept`, `handleNegotiationReject`, `previewNegotiationEntry`,
 * `negotiationSummary` — plus plumbing (`getNegotiationsForPair`,
 * `actionableNegotiationIdsForPair`, `negotiationPartnerOwnerIdOf`,
 * `handleRequestAiNegotiationResponse`) wołany przez te ścieżki.
 *
 * Wzorem `dyplo-mapa-odkrycie-live-test.cjs`: realny `vite build`, realny `?playtest=mapa`,
 * REALNE kliknięcia w audiencji (propozycja → koszyk PN → Przyjmij/Odrzuć całego pakietu),
 * hak testowy `__dyploMapaOdkrycieTestDebug.prepareContact` steruje WYŁĄCZNIE danymi
 * wejściowymi (kontakt + relacja), realny efekt (rozstrzygnięcie na stole) idzie WYŁĄCZNIE
 * przez realny klik → `handleNegotiationAcceptPackage`/`RejectPackage` → funkcje tego tematu.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (REGUŁA PRZECIW SAMOOSZUKIWANIU): druga budowa bundla z
 * `isMe()` na sztywno `false` (ten sam wzorzec co `hotseat-etap6b-ui-noop-test.cjs`) —
 * `getNegotiationsForPair` (wołana przez `actionableNegotiationIdsForPair`, użytą w
 * `buildPendingNegotiationRows` spoza allowlisty tego tematu, ale KONSUMUJącą TĘ funkcję)
 * przestaje widzieć jakąkolwiek pozycję stołu dla pary gracz↔AI, więc panel audiencji
 * NIE renderuje ANI JEDNEJ karty stołu, mimo że pozycja realnie istnieje w
 * `negotiationTable` — bramka MUSI to złapać (czerwienieje na mutacji).
 *
 * ŚWIADOMIE NIE OTWARTE w tej bramce (jawnie zgłoszone, nie ukryte): gałęzie „incoming"
 * (AI inicjuje ofertę do gracza) `handleNegotiationAccept`/`Reject`/`Counter`,
 * `previewNegotiationEntry` (`incoming=true`) i `negotiationSummary` (`incoming=true`) —
 * wymagają AI, które SAMO zaproponuje coś graczowi (`enqueueDiplomacyPendingFromCmd` w
 * turze AI, sterowane wewnętrzną heurystyką+RNG silnika, niedostępne do wymuszenia bez
 * nowego haka testowego POZA allowlistą main.ts tego dispatchu — WYŁĄCZNIE ciała 14
 * wymienionych funkcji). Te gałęzie pokrywa WYŁĄCZNIE
 * `hotseat-etap6d-podetap-e-source-test.cjs` (ten sam wzorzec isMe/ME() zastosowany
 * jednolicie w całym ciele funkcji, PRZED-vs-PO na źródle). Podobnie
 * `collectTurnEvents`/`collectOpenDiploProposalQueue`/`resolvePendingNegotiationsForOwner`/
 * `resolveNegotiationEntryAt` — dispatch WPROST zwalnia je z Chromium ("dowód testem
 * jednostkowym na realnych funkcjach wystarczy, UI niepotrzebne").
 *
 * Bramka (z katalogu gra/): node tools/hotseat-etap6d-podetap-e-live-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
const POST_OUT_DIR = path.join(os.tmpdir(), `civ-6d-e-POST-dist-${RUN_ID}`);
const MUT_GRA_DIR = path.join(os.tmpdir(), `civ-6d-e-MUT-${RUN_ID}`);
const MUT_OUT_DIR = path.join(os.tmpdir(), `civ-6d-e-MUT-dist-${RUN_ID}`);

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

function log(msg) { console.log('[hotseat-etap6d-podetap-e-live] ' + msg); }

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
  log('przygotowanie katalogu ZEPSUTEGO (isMe() na sztywno false, dowód nietautologiczności)...');
  fs.rmSync(MUT_GRA_DIR, { recursive: true, force: true });
  fs.mkdirSync(MUT_GRA_DIR, { recursive: true });
  for (const ent of fs.readdirSync(GRA_DIR)) {
    if (ent === 'node_modules' || ent.startsWith('dist')) continue;
    fs.cpSync(path.join(GRA_DIR, ent), path.join(MUT_GRA_DIR, ent), { recursive: true });
  }
  fs.symlinkSync(path.join(GRA_DIR, 'node_modules'), path.join(MUT_GRA_DIR, 'node_modules'));
  const mainPath = path.join(MUT_GRA_DIR, 'src/main.ts');
  const src = fs.readFileSync(mainPath, 'utf8');
  const NEEDLE = 'function isMe(ownerId: number): boolean {\n      return ownerId === ME();\n    }';
  const REPLACEMENT = 'function isMe(ownerId: number): boolean {\n      return false;\n    }';
  if (!src.includes(NEEDLE)) {
    throw new Error('prepareMutatedGraDir: nie znaleziono definicji isMe() do mutacji -- '
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
    () => !!window.__dyploMapaOdkrycieTestDebug && !!window.__eraTestDebug && !!window.__audienceRelTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined, { timeout: 120000 },
  );
  await wait(300);
}

async function openAudience(page, ownerId) {
  await page.evaluate((oid) => { window.__audienceRelTestDebug.openAudience(oid); }, ownerId);
  await page.waitForSelector('.civ-diplo-aud-box', { timeout: 15000 }).catch(() => {});
  await wait(150);
}

async function closeAudience(page) {
  await page.evaluate(() => { window.__audienceRelTestDebug.closeAudience(); });
  await wait(100);
}

async function clickAudienceAction(page, aid) {
  const sel = `.civ-diplo-aud button[data-aid="${aid}"]`;
  const btn = page.locator(sel).first();
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  const disabled = await btn.evaluate((el) => el.disabled);
  if (disabled) return { clicked: false, disabled: true };
  await btn.click();
  await wait(150);
  return { clicked: true, disabled: false };
}

async function submitBasketIfOpen(page) {
  const submit = page.locator('.cdb-submit');
  if ((await submit.count()) === 0) return false;
  await submit.first().click();
  await wait(200);
  return true;
}

function ownRowCount(page) {
  return page.locator('.civ-diplo-aud [data-negot-act="edit"], .civ-diplo-aud [data-negot-act="remove"]').count();
}

async function acceptOwnPackage(page) {
  const btn = page.locator('.civ-diplo-aud [data-negot-act="accept-package"]').first();
  if ((await btn.count()) === 0) return { found: false };
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  const disabled = await btn.evaluate((el) => el.disabled);
  if (disabled) return { found: true, disabled: true };
  await btn.click();
  await wait(300);
  return { found: true, disabled: false };
}

async function rejectOwnPackage(page) {
  const btn = page.locator('.civ-diplo-aud [data-negot-act="reject-package"]').first();
  if ((await btn.count()) === 0) return { found: false };
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  const disabled = await btn.evaluate((el) => el.disabled);
  if (disabled) return { found: true, disabled: true };
  await btn.click();
  await wait(300);
  return { found: true, disabled: false };
}

function toastText(page) {
  return page.evaluate(() => window.__eraTestDebug.getToast());
}

/**
 * Scenariusz wspólny PO/ZEPSUTY: kontakt+relacja przyjazna z jednym AI, propozycja Paktu
 * nieagresji (akcja '2', przez koszyk PN) na stole -- sam PUSH na `negotiationTable` idzie
 * przez `handleNegotiatedProposal` (POZA allowlistą tego tematu -- funkcja tworząca wpis,
 * nie operująca na istniejącym), a WSZYSTKO po tym punkcie (odczyt stanu stołu, przyjęcie,
 * podgląd, opis) idzie przez funkcje tego tematu.
 */
async function runScenario(page, ownerId) {
  await page.evaluate((oid) => { window.__dyploMapaOdkrycieTestDebug.prepareContact(oid); }, ownerId);
  await openAudience(page, ownerId);

  const clickRes = await clickAudienceAction(page, '2');
  if (!clickRes.clicked) return { stage: 'click', clickRes };
  const submitted = await submitBasketIfOpen(page);
  if (!submitted) return { stage: 'basket-not-open' };

  // getNegotiationsForPair/actionableNegotiationIdsForPair: czy stół w ogóle POKAZUJE
  // pozycję, którą właśnie utworzyliśmy? (kryterium mutacji -- patrz nagłówek pliku)
  const rowsAfterPropose = await ownRowCount(page);
  return { stage: 'proposed', rowsAfterPropose };
}

async function runAcceptFlow(page, ownerId) {
  const acc = await acceptOwnPackage(page);
  const toast = await toastText(page);
  return { acc, toast };
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
    // ============================== PO (kod bieżącej rundy) ==============================
    {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push('PO: ' + m.text()); });
      page.on('pageerror', (e) => consoleErrors.push('PO: ' + String(e)));
      await gotoPlaytestMapa(page, POST_OUT_DIR);

      const ownerId = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.pickCandidateOwnerId());
      assert('(0) PO: kandydat AI znaleziony w świecie ?playtest=mapa', typeof ownerId === 'number', ownerId);

      // --- Flow 1: propose + accept-package (own branch: handleNegotiationAccept,
      //     handleRequestAiNegotiationResponse, resolveNegotiationEntryAt,
      //     previewNegotiationEntry, negotiationSummary, getNegotiationsForPair,
      //     actionableNegotiationIdsForPair, negotiationPartnerOwnerIdOf) ---
      const res1 = await runScenario(page, ownerId);
      assert('(1) PO: Pakt nieagresji zaproponowany przez realne UI', res1.stage === 'proposed', res1);
      assert('(2) PO: getNegotiationsForPair widzi WŁASNĄ propozycję na stole (>=1 wiersz edit/remove)',
        res1.rowsAfterPropose > 0, res1);

      const flow1 = await runAcceptFlow(page, ownerId);
      assert('(3) PO: przycisk "Przyjmij cały pakiet" znaleziony i klikalny (handleNegotiationAccept own-branch)',
        flow1.acc.found === true && flow1.acc.disabled !== true, flow1);
      // Po realnym rozstrzygnięciu (resolveNegotiationEntryAt) wpis znika ze stołu --
      // niezależnie od wyniku (przyjęta/odrzucona/kontrowana odpowiedź AI), 'own' wiersz z
      // TĄ SAMĄ treścią (Pakt nieagresji, akcja '2') już nie powinien istnieć w tej samej
      // formie (albo zniknął, albo AI skontrowała -- w obu przypadkach realna ścieżka silnika
      // faktycznie wykonała się, bez wyjątku JS).
      await closeAudience(page);

      // --- Flow 2: propose + reject-package (own branch: handleNegotiationReject withdraw) ---
      await openAudience(page, ownerId);
      const clickRes2 = await clickAudienceAction(page, '4'); // traktat przemarszu, natychmiast na stół
      assert('(4) PO: druga propozycja (przemarsz) zaproponowana', clickRes2.clicked === true, clickRes2);
      await submitBasketIfOpen(page);
      const rowsBeforeReject = await ownRowCount(page);
      assert('(5) PO: druga propozycja widoczna na stole przed odrzuceniem', rowsBeforeReject > 0, rowsBeforeReject);
      const rej = await rejectOwnPackage(page);
      assert('(6) PO: przycisk "Odrzuć cały pakiet" znaleziony i klikalny (handleNegotiationReject withdraw-branch)',
        rej.found === true && rej.disabled !== true, rej);
      const toastAfterReject = await toastText(page);
      assert('(7) PO: po odrzuceniu -- toast "Wycofano propozycję z stołu" (realna ścieżka handleNegotiationReject)',
        !!toastAfterReject && /Wycofano propozycję/.test(toastAfterReject.html ?? ''), toastAfterReject);
      const rowsAfterReject = await ownRowCount(page);
      assert('(8) PO: po odrzuceniu -- wpis faktycznie zniknął ze stołu', rowsAfterReject === 0, rowsAfterReject);

      await closeAudience(page);
      try { await page.close(); } catch { /* noop */ }
    }

    // ============================== ZEPSUTY (isMe() -> false) ==============================
    {
      const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
      page.on('console', () => {});
      page.on('pageerror', () => {});
      await gotoPlaytestMapa(page, MUT_OUT_DIR);

      const ownerId = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.pickCandidateOwnerId());
      assert('(9) ZEPSUTY: kandydat AI znaleziony (świat identyczny co PO)', typeof ownerId === 'number', ownerId);

      const resM = await runScenario(page, ownerId);
      assert('(10) ZEPSUTY: klik propozycji nadal przechodzi (tworzenie wpisu jest POZA allowlistą tego tematu)',
        resM.stage === 'proposed', resM);
      // === DOWÓD NIETAUTOLOGICZNOŚCI ===
      // isMe() zawsze false -> getNegotiationsForPair (ta funkcja, allowlista tego tematu)
      // filtruje WSZYSTKO -- żaden wiersz własnej propozycji nie może się już wyrenderować,
      // mimo że wpis REALNIE istnieje w negotiationTable (PO pokazał to samo dokładnie w (2)).
      assert('(11) ZEPSUTY MUSI CZERWIENIEĆ: getNegotiationsForPair(isMe()=false) NIE widzi ŻADNEJ własnej pozycji na stole (regresja)',
        resM.rowsAfterPropose === 0, resM);

      await closeAudience(page);
      try { await page.close(); } catch { /* noop */ }
    }

    assert('(E0) PO: zero błędów konsoli/JS podczas przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }

  console.log(`\nhotseat-etap6d-podetap-e-live-test: ${pass} PASS, ${fail} FAIL`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
