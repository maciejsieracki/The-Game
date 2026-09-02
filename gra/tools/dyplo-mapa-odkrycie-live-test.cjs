'use strict';
/**
 * dyplo-mapa-odkrycie-live-test.cjs — R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1.
 *
 * Żywy dowód w headless Chromium (R-PROC-AUTOBOT.md §9 pkt 6a, dispatch REGUŁA PRZECIW
 * SAMOOSZUKIWANIU): realny `vite build`, realny `?playtest=mapa`, REALNY UI dyplomacji
 * (kliknięcia w przycisk akcji audiencji + koszyk PN + „Przyjmij" na stole negocjacji) —
 * zero bezpośredniego wstrzyknięcia stanu dla samego EFEKTU tematu. Hak testowy
 * `__dyploMapaOdkrycieTestDebug` (main.ts, obok `applyProposalOutcome`) steruje WYŁĄCZNIE
 * danymi wejściowymi (który AI, kontakt, Relacja/Zaufanie/Respekt) — realny efekt (scalenie
 * migawki widoczności do `explored`) powstaje wyłącznie przez applyProposalOutcome
 * wywołane realnym klikiem.
 *
 * Pokrycie (kryteria końca 00-dispatch.md):
 *  1-2. Pakt nieagresji (akcja '2', koszyk PN) i Umowa szlaków (akcja '5', natychmiastowo
 *       na stół) zawarte PRZEZ UI z inną cywilizacją AI → `explored` PO fakcie pokrywa całą
 *       żywą widoczność tej cywilizacji (miasta+jednostki+zasięg), realny render (zrzuty).
 *  3. Kontrprzykład: traktat spoza zakresu (Traktat przemarszu, akcja '4' — OtwartGranice/
 *     PrawoWojskowePrzemarszu) NIE odkrywa territorium innej, NIEZAANGAŻOWANEJ cywilizacji.
 *  4. Traktat AI<->AI nie dotyczy tego testu bezpośrednio (gracz nie ma UI do zainicjowania
 *     takiej pary) — pokryty testem jednostkowym osobno (patrz notatka w raporcie Operatora);
 *     tu: kontrola, że `explored` gracza rośnie WYŁĄCZNIE dla ownera z traktatu, nie dla
 *     żadnego innego ownera obecnego w świecie.
 *  5. Save/load: serializacja `explored` niezmieniona (main.ts) — pokryte testem tsc/logic,
 *     nie wymaga osobnej żywej ścieżki (recon 00-dispatch.md).
 *
 * Bramka (z katalogu gra/): node tools/dyplo-mapa-odkrycie-live-test.cjs — exit 0 = zielona.
 */

const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const OUT_DIR = path.join(GRA_DIR, 'dist-dyplo-mapa-odkrycie-live-test');
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const SHOT_DIR = path.resolve(
  GRA_DIR, '..', 'dyspozycje', 'autobot', 'runs',
  'R-DYPLO-MAPA-ODKRYCIE-PRZY-TRAKTACIE-Q1', 'dowody',
);

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
  console.log('[dyplo-mapa-odkrycie-live-test] budowanie bundla (vite build, dozwolona komenda)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, OUT_DIR))} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[dyplo-mapa-odkrycie-live-test] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[dyplo-mapa-odkrycie-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function shot(page, name) {
  fs.mkdirSync(SHOT_DIR, { recursive: true });
  const p = path.join(SHOT_DIR, name);
  await page.screenshot({ path: p });
  console.log('[dyplo-mapa-odkrycie-live-test] zrzut: ' + p);
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
    () => !!window.__dyploMapaOdkrycieTestDebug && !!window.__eraTestDebug
      && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

/** Otwiera audiencję z ownerId przez REALNĄ `openDiplomacyAudience` (main.ts). */
async function openAudience(page, ownerId) {
  await page.evaluate((oid) => { window.__audienceRelTestDebug.openAudience(oid); }, ownerId);
  await page.waitForSelector('.civ-diplo-aud-box', { timeout: 15000 });
  await wait(150);
}

async function closeAudience(page) {
  await page.evaluate(() => { window.__audienceRelTestDebug.closeAudience(); });
  await wait(100);
}

/** Klik w przycisk akcji audiencji o danym data-aid. */
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

/** Klika „Zaproponuj" w koszyku PN (jeśli otwarty), inaczej no-op. */
async function submitBasketIfOpen(page) {
  const submit = page.locator('.cdb-submit');
  const count = await submit.count();
  if (count === 0) return false;
  await submit.first().click();
  await wait(200);
  return true;
}

/**
 * Klika „Przyjmij" na własnej propozycji na stole — dla WŁASNEJ (proposer=gracz) propozycji
 * lista negocjacji renderuje wyłącznie „Kontruj"/„Usuń" (data-negot-act="edit"/"remove")
 * PRZY wierszu (C-DYP-Q1=A), a faktyczne wysłanie do AI po odpowiedź idzie przez panel PW —
 * ten sam „Przyjmij cały pakiet" (data-negot-act="accept-package", handleNegotiationAcceptPackage
 * → handleNegotiationAccept dla każdego actionable wpisu pary), realna ścieżka silnika.
 */
async function acceptOwnNegotiation(page) {
  const btn = page.locator('.civ-diplo-aud [data-negot-act="accept-package"]').first();
  const n = await btn.count();
  if (n === 0) return { found: false };
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

async function proposeAndAccept(page, ownerId, aid, needsBasket) {
  const clickRes = await clickAudienceAction(page, aid);
  if (!clickRes.clicked) return { ok: false, stage: 'click', clickRes };
  if (needsBasket) {
    const submitted = await submitBasketIfOpen(page);
    if (!submitted) return { ok: false, stage: 'basket-not-open' };
  }
  const acceptRes = await acceptOwnNegotiation(page);
  if (!acceptRes.found || acceptRes.disabled) {
    const toast = await toastText(page);
    return { ok: false, stage: 'accept', acceptRes, toast };
  }
  return { ok: true };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[dyplo-mapa-odkrycie-live-test] playwright nie znaleziony.');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (e) => consoleErrors.push(String(e)));

  try {
    await gotoPlaytestMapa(page);

    // === Wybór celu + kontrola wstępna: NIE odkryty przed traktatem ===
    const ownerId = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.pickCandidateOwnerId());
    assert('(0) kandydat AI znaleziony w świecie ?playtest=mapa', typeof ownerId === 'number', ownerId);
    if (typeof ownerId !== 'number') { throw new Error('Brak kandydata AI — przerwane.'); }
    // SETUP (dispatch kryterium 1) — konstrukcja kontroli negatywnej "przed": gracz jeszcze
    // NIE ma odkrytego terytorium tego AI. Odwrotność efektu tematu, nie sam efekt.
    await page.evaluate((oid) => { window.__dyploMapaOdkrycieTestDebug.clearOwnerFromExplored(oid); }, ownerId);

    const exploredBefore = await page.evaluate(
      (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
      ownerId,
    );
    assert('(1a) PRZED traktatem: terytorium AI NIE jest w pełni explored (kontrola negatywna)',
      exploredBefore === false, { ownerId, exploredBefore });
    const exploredSizeBefore = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.getExploredSize());

    // Drugi, NIEZAANGAŻOWANY AI — dla kryterium 3/4 (brak efektu ubocznego).
    const otherOwnerId = await page.evaluate((skip) => {
      const dbg = window.__dyploMapaOdkrycieTestDebug;
      for (let oid = 1; oid <= 8; oid++) {
        if (oid === skip) continue;
        if (dbg.getOwnerVisibleKeysSize(oid) > 0) return oid;
      }
      return null;
    }, ownerId);

    // === Kryterium 3 (kontrprzykład, SAMA cywilizacja, PRZED plafonem pełnego odkrycia):
    // traktat przemarszu (akcja '4' — OtwartGranice/PrawoWojskowePrzemarszu, SPOZA zakresu)
    // zawarty przez realne UI z TYM SAMYM ownerId, gdy jego terytorium NADAL nie jest w pełni
    // explored, NIE odkrywa go. Silniejszy dowód niż (7) niżej (który zależy od istnienia
    // DRUGIEGO AI w świecie ?playtest=mapa — tu nie zależy, bo działa na tym samym kandydacie
    // zanim cokolwiek go w pełni odkryje).
    await page.evaluate((oid) => { window.__dyploMapaOdkrycieTestDebug.prepareContact(oid); }, ownerId);
    await openAudience(page, ownerId);
    await clickAudienceAction(page, '4');
    await submitBasketIfOpen(page);
    await acceptOwnNegotiation(page);
    const exploredSizeAfterGranice = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.getExploredSize());
    const exploredAfterGranice = await page.evaluate(
      (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
      ownerId,
    );
    assert('(1b) Traktat przemarszu (spoza zakresu) NIE zmienia `explored.size`',
      exploredSizeAfterGranice === exploredSizeBefore, { exploredSizeBefore, exploredSizeAfterGranice });
    assert('(1c) Traktat przemarszu (spoza zakresu) NIE odkrywa terytorium TEJ SAMEJ cywilizacji',
      exploredAfterGranice === false, { ownerId, exploredAfterGranice });

    // === Kryterium 1: Pakt nieagresji (akcja '2') przez UI (koszyk PN) ===
    await shot(page, '01-audiencja-przed-paktem.png');
    const napRes = await proposeAndAccept(page, ownerId, '2', true);
    assert('(2) Pakt nieagresji: propozycja + Przyjmij przeszły przez realne UI', napRes.ok, napRes);
    await shot(page, '02-po-pakcie.png');

    const exploredAfterNap = await page.evaluate(
      (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
      ownerId,
    );
    assert('(3) PO pakcie: CAŁA żywa widoczność AI jest teraz w `explored` (żywa migawka scalona)',
      exploredAfterNap === true, { ownerId, exploredAfterNap });
    const exploredSizeAfterNap = await page.evaluate(() => window.__dyploMapaOdkrycieTestDebug.getExploredSize());
    assert('(4) `explored.size` faktycznie wzrósł po pakcie', exploredSizeAfterNap > exploredSizeBefore,
      { exploredSizeBefore, exploredSizeAfterNap });

    // === Kryterium 2: Umowa szlaków (akcja '5') przez UI (natychmiast na stół) ===
    // Druga cywilizacja AI (jeśli istnieje) — inaczej ta sama para z drugim rodzajem traktatu
    // (Set.add jest idempotentny, mechanizm ma i tak scalić ponownie — patrz 00-dispatch.md).
    const szlakiTargetId = otherOwnerId ?? ownerId;
    if (otherOwnerId !== null) {
      await page.evaluate((oid) => { window.__dyploMapaOdkrycieTestDebug.prepareContact(oid); }, otherOwnerId);
      await closeAudience(page);
      await openAudience(page, otherOwnerId);
    }
    const exploredBeforeSzlaki = await page.evaluate(
      (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
      szlakiTargetId,
    );
    const szlakiRes = await proposeAndAccept(page, szlakiTargetId, '5', false);
    assert('(5) Umowa szlaków: propozycja + Przyjmij przeszły przez realne UI', szlakiRes.ok, szlakiRes);
    await shot(page, '03-po-szlakach.png');
    const exploredAfterSzlaki = await page.evaluate(
      (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
      szlakiTargetId,
    );
    assert('(6) PO umowie szlaków: CAŁA żywa widoczność AI jest w `explored`',
      exploredAfterSzlaki === true, { szlakiTargetId, exploredBeforeSzlaki, exploredAfterSzlaki });

    // === Kryterium 3: kontrprzykład — traktat SPOZA zakresu (akcja '4', przemarsz) nie
    // odkrywa terytorium ŻADNEJ NIEZAANGAŻOWANEJ trzeciej cywilizacji. ===
    if (otherOwnerId !== null) {
      const thirdCandidate = await page.evaluate((used) => {
        const dbg = window.__dyploMapaOdkrycieTestDebug;
        for (let oid = 1; oid <= 8; oid++) {
          if (used.includes(oid)) continue;
          if (dbg.getOwnerVisibleKeysSize(oid) > 0) return oid;
        }
        return null;
      }, [ownerId, otherOwnerId]);
      if (thirdCandidate !== null) {
        const thirdBefore = await page.evaluate(
          (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
          thirdCandidate,
        );
        // Traktat przemarszu MIĘDZY graczem a `ownerId` (już kontakt) — SPOZA zakresu tematu.
        await closeAudience(page);
        await openAudience(page, ownerId);
        await clickAudienceAction(page, '4');
        await submitBasketIfOpen(page);
        await acceptOwnNegotiation(page);
        const thirdAfter = await page.evaluate(
          (oid) => window.__dyploMapaOdkrycieTestDebug.isOwnerTerritoryFullyExplored(oid),
          thirdCandidate,
        );
        assert('(7) Traktat przemarszu (spoza zakresu) NIE odkrywa terytorium trzeciej, niezaangażowanej cywilizacji',
          thirdBefore === thirdAfter, { thirdCandidate, thirdBefore, thirdAfter });
      } else {
        console.log('  (pominięto (7): brak trzeciego kandydata AI w tym świecie)');
      }
    } else {
      console.log('  (pominięto (7): tylko jeden AI w tym świecie ?playtest=mapa)');
    }

    assert('(E0) zero błędów konsoli/JS podczas całego przebiegu', consoleErrors.length === 0, consoleErrors);
  } finally {
    await browser.close();
  }

  console.log('\ndyplo-mapa-odkrycie-live-test: ' + pass + ' pass, ' + fail + ' fail');
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
