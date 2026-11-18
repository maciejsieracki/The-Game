'use strict';
/**
 * R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1 — żywy strażnik: OTWARTY panel miasta po REALNYM końcu tury
 * (bez odkrycia technologii) pokazuje świeże liczby, a nie migawkę z początku tury.
 *
 * Scenariusz (ziarno/kreator jak w open-panel-refresh-after-tech-live-test, ?civTest=1):
 *  1. Nowa gra, stolica, OTWARTY panel miasta. Tekst panelu przed turą = A.
 *  2. REALNY `__eraTestDebug.endTurn()` (triggerPlayerEndTurn) — bez technologii; zmienia skarbiec, surowce,
 *     kolejkę/produkcję itp. Panel NIE jest ponownie otwierany.
 *  3. Tekst OTWARTEGO panelu po zakończeniu tury = B.
 *  4. Świeżo otwarty panel (zamknięcie + ponowne otwarcie) = C (świeży render).
 *  5. (R-WEB-TEST-GAPS-WALKAMAPY-DIRTY-SCROLL-ASSERT-Q1 B) Otwarty panel przewinięty do scrollTop > 0
 *     przed EOT; po EOT scrollTop musi być zachowany (±1 px) — strażnik restorePanelScrollPositions.
 *
 * Werdykt:
 *  PASS    — B == C oraz scrollTop zachowany (±1 px) po końcu tury.
 *  FAIL    — B != C (panel nie odświeżony po turze — migawka z początku tury) albo scrollTop nie zachowany.
 *  BLOCKED — nie zmierzono: EOT nie zakończył się (brak DONE), albo tura nie zmieniła tekstu panelu (A == C),
 *            albo panel zamknął się sam w EOT.
 *
 * Usage: ROBOCZA_HTML=<kopia Gra-ROBOCZA.html (build z tym kodem)> [EVID_DIR=<katalog>] node tools/city-panel-refresh-at-turn-start-live-test.cjs
 * Exit 0 = PASS, 1 = FAIL lub BLAD, 2 = BLOCKED.
 */
const path = require('path');
const fs = require('fs');
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

const EVID = process.env.EVID_DIR || path.join(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-CITY-PANEL-REFRESH-AT-TURN-START-Q1', 'dowody');

/** Tekst widocznych liści DOM — ten sam sposób odczytu co w open-panel-refresh-after-tech-live-test. */
async function panelText(page) {
  return page.evaluate(() => {
    const vis = Array.from(document.querySelectorAll('*')).filter((el) => el.offsetParent !== null && el.children.length === 0 && (el.textContent || '').trim());
    return vis.map((el) => el.textContent.trim()).join('\n');
  });
}

/**
 * Widoczny przewijany element (overflow auto/scroll, przewijanie > 20 px) z NAJWIĘKSZYM zakresem
 * przewijania na stronie (przy otwartym panelu miasta: lista budowy). Ta sama heurystyka przed i po
 * turze — po przerysowaniu DOM trafia na nowy węzeł o tej samej pozycji w drzewie.
 */
async function scrollProbe(page, setTop) {
  return page.evaluate((setTo) => {
    const cands = Array.from(document.querySelectorAll('*')).filter((el) => {
      if (el.offsetParent === null) return false;
      const oy = getComputedStyle(el).overflowY;
      return (oy === 'auto' || oy === 'scroll') && el.scrollHeight - el.clientHeight > 20;
    });
    cands.sort((a, b) => (b.scrollHeight - b.clientHeight) - (a.scrollHeight - a.clientHeight));
    const el = cands[0];
    if (!el) return null;
    if (setTo !== null && setTo !== undefined) el.scrollTop = setTo;
    return { top: el.scrollTop, overflow: el.scrollHeight - el.clientHeight, n: cands.length };
  }, setTop === undefined ? null : setTop);
}

async function openCityPanel(page, cityId) {
  await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await wait(1200);
}

function diffLines(from, to) {
  const set = new Set(to.split('\n'));
  return from.split('\n').filter((l) => !set.has(l)).slice(0, 40);
}

(async () => {
  const out = { verdict: 'BLAD', steps: {} };
  const browser = await C.launch();
  try {
    const s = await C.openMenu(browser);
    const page = s.page;
    await page.evaluate(() => window.__cityStateStartUnitsTestDebug.startNewGame('normal', 2, 'normal'));
    await C.waitAwaitingCity(page);
    const st = await C.foundCapital(page);
    await wait(1500);
    const cityId = st.cities.find((c) => c.ownerId === 0).id;
    // Niższy viewport, żeby panel miasta był przewijalny (przy 1000 px px mieści się bez przewijania).
    await page.setViewportSize({ width: 1600, height: 520 });
    await wait(800);
    await page.evaluate(() => {
      try { if (window.__nnsMeasureDebug && window.__nnsMeasureDebug.setPlayerTreasury) window.__nnsMeasureDebug.setPlayerTreasury(100000); } catch (e) { /* hak opcjonalny */ }
    });
    await wait(300);
    await openCityPanel(page, cityId);
    const A = await panelText(page);
    out.steps.panelOpenA = A.includes('Dostępne do budowy');
    if (!out.steps.panelOpenA) throw new Error('panel miasta nie otwarty (brak „Dostępne do budowy”)');
    // Przewinięcie otwartego panelu (scrollTop > 0) przed końcem tury; po EOT ma zostać zachowane.
    const probeBefore = await scrollProbe(page, 150);
    out.steps.scrollBefore = probeBefore;
    await wait(200);
    const scrollSetBefore = await scrollProbe(page);
    out.steps.scrollSetBefore = scrollSetBefore;

    const eraBefore = await page.evaluate(() => window.__eraTestDebug.getPlayerState().era);
    const logMark = s.logs.length;
    await page.evaluate(() => window.__eraTestDebug.endTurn());

    // Czekamy na pełne domknięcie EOT (log DONE z finally triggerPlayerEndTurn), nie na sam overlay.
    const t0 = Date.now();
    let settled = false;
    while (Date.now() - t0 < 240000) {
      settled = s.logs.slice(logMark).some((l) => /triggerPlayerEndTurn: DONE/.test(l));
      if (settled) break;
      await wait(500);
    }
    out.steps.settled = settled;
    const eraAfter = await page.evaluate(() => window.__eraTestDebug.getPlayerState().era);
    out.steps.eraBefore = eraBefore;
    out.steps.eraAfter = eraAfter;
    await wait(1500);

    // B = tekst OTWARTEGO panelu po EOT, bez ponownego otwierania i bez klikania czegokolwiek.
    const B = await panelText(page);
    out.steps.panelStillOpenAfterEot = B.includes('Dostępne do budowy');
    const probeAfter = await scrollProbe(page);
    out.steps.scrollAfter = probeAfter;
    const scrollMeasured = !!(probeBefore && scrollSetBefore && probeAfter && scrollSetBefore.top > 0);
    const scrollOk = scrollMeasured && Math.abs(probeAfter.top - scrollSetBefore.top) <= 1;
    out.steps.scrollMeasured = scrollMeasured;
    out.steps.scrollOk = scrollOk;

    // C = świeży render: zamknięcie (Escape) i ponowne otwarcie panelu miasta.
    await page.keyboard.press('Escape');
    await wait(500);
    await openCityPanel(page, cityId);
    const Cfresh = await panelText(page);

    out.steps.visibleChangeAC = A !== Cfresh;
    out.steps.diffStaleVsFresh = diffLines(B, Cfresh);
    out.steps.diffFreshVsStale = diffLines(Cfresh, B);

    fs.mkdirSync(EVID, { recursive: true });
    fs.writeFileSync(path.join(EVID, 'city-panel-turn-start-A-before-turn.txt'), A);
    fs.writeFileSync(path.join(EVID, 'city-panel-turn-start-B-open-after-eot.txt'), B);
    fs.writeFileSync(path.join(EVID, 'city-panel-turn-start-C-fresh-render.txt'), Cfresh);

    if (!settled) { out.verdict = 'BLOCKED'; out.reason = 'EOT nie zakończył się (brak DONE w logu)'; }
    else if (eraAfter !== eraBefore) { out.verdict = 'BLOCKED'; out.reason = 'era zmieniona (' + eraBefore + '->' + eraAfter + '): to nie jest scenariusz bez technologii'; }
    else if (!out.steps.panelStillOpenAfterEot) { out.verdict = 'BLOCKED'; out.reason = 'panel miasta zamknął się w EOT — nie zmierzono'; }
    else if (!out.steps.visibleChangeAC) { out.verdict = 'BLOCKED'; out.reason = 'tura nie zmieniła tekstu panelu (A == C) — test nie rozstrzyga'; }
    else if (B !== Cfresh) { out.verdict = 'FAIL'; out.reason = 'otwarty panel nie odświeżył się po końcu tury (B != świeży render C)'; }
    else if (!scrollMeasured) { out.verdict = 'BLOCKED'; out.reason = 'panel miasta nieprzewijalny w viewporcie — nie zmierzono scrollTop'; }
    else if (!scrollOk) { out.verdict = 'FAIL'; out.reason = 'scrollTop panelu nie zachowany po końcu tury (przed ' + scrollSetBefore.top + ', po ' + probeAfter.top + ')'; }
    else out.verdict = 'PASS';
  } catch (e) {
    out.verdict = 'BLAD';
    out.reason = String(e && e.message || e);
  } finally {
    await browser.close();
  }
  console.log('VERDICT ' + out.verdict + (out.reason ? ' ' + out.reason : ''));
  console.log(JSON.stringify(out, null, 1));
  process.exit(out.verdict === 'PASS' ? 0 : (out.verdict === 'BLOCKED' ? 2 : 1));
})();
