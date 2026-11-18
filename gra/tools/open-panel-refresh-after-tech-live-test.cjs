'use strict';
/**
 * R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1 — żywy strażnik: OTWARTY panel miasta odświeża listę
 * budowy po ukończeniu technologii w ZWYKŁEJ turze (bez awansu epoki), bez ponownego otwierania panelu.
 *
 * Scenariusz (ziarno/kreator jak w innych live-testach, ?civTest=1):
 *  1. Nowa gra, stolica, OTWARTY panel miasta. Zapis tekstu panelu = A.
 *  2. `__eraTestDebug.prepareNonEraCompletion()` ustawia cel badań (najtańsza nieodkryta technologia Kamienia
 *     bez awansu epoki) i dokładnie koszt jako naukę.
 *  3. REALNY `__eraTestDebug.endTurn()` (triggerPlayerEndTurn -> researchStep) kończy badanie.
 *  4. Tekst OTWARTEGO panelu bez ponownego otwarcia = B. Świeżo otwarty panel = C.
 *
 * Werdykt:
 *  PASS    — B == C (otwarty panel pokazuje stan po odkryciu bez ponownego otwarcia).
 *  FAIL    — B != C (panel przerysowany dopiero przy ponownym otwarciu = defekt).
 *  BLOCKED — nie zmierzono: badanie nie ukończyło się w EOT, era się zmieniła (to nie jest ścieżka „bez awansu”),
 *            panel zamknął się sam w EOT, albo zmiana nie jest widoczna w panelu (test nie rozstrzyga).
 *
 * Usage: ROBOCZA_HTML=<kopia Gra-ROBOCZA.html (build z tym kodem)> [EVID_DIR=<katalog>] node tools/open-panel-refresh-after-tech-live-test.cjs
 * Exit 0 = PASS, 1 = FAIL lub BLAD, 2 = BLOCKED.
 */
const path = require('path');
const fs = require('fs');
const C = require('./live-verify-autoimprove-common.cjs');
const { wait } = C;

const EVID = process.env.EVID_DIR || path.join(__dirname, '..', '..', 'dyspozycje', 'autobot', 'runs', 'R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1', 'evidence');

async function panelText(page) {
  return page.evaluate(() => {
    const vis = Array.from(document.querySelectorAll('*')).filter((el) => el.offsetParent !== null && el.children.length === 0 && (el.textContent || '').trim());
    return vis.map((el) => el.textContent.trim()).join('\n');
  });
}

/** Blok listy budowy miasta: od nagłówka „Dostępne do budowy” w górę do 70 linii (bez innych paneli). */
function listBlock(text) {
  const lines = text.split('\n');
  const idx = lines.findIndex((l) => /Dostępne do budowy/i.test(l));
  // Liczniki-same-liczby (np. nagłówkowy licznik po EOT) pomijamy: zmieniają się przez inne kroki EOT, nie przez technologię.
  return idx < 0 ? '' : lines.slice(idx, idx + 70).filter((l) => !/^[\d\s+\-−()%.,]+$/.test(l)).join('\n');
}

async function openCityPanel(page, cityId) {
  await page.evaluate((id) => window.__hotSeatTestDebug.openCityPanelForTest(id), cityId);
  await wait(1200);
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
    await openCityPanel(page, cityId);
    const A = await panelText(page);
    out.steps.panelOpenA = A.includes('Dostępne do budowy');
    if (!out.steps.panelOpenA) throw new Error('panel miasta nie otwarty (brak „Dostępne do budowy”)');

    const prep = await page.evaluate(() => window.__eraTestDebug.prepareNonEraCompletion());
    out.steps.prep = prep;
    const eraBefore = await page.evaluate(() => window.__eraTestDebug.getPlayerState().era);
    // Bufor bramki NNS (test-only): skarbiec i spichlerz gracza na żywych wartościach, żeby EOT nie został zablokowany
    // prognozą < 0. Hak NNS tylko do pomiaru: __civTest.setSpichlerzPanstwa / __nnsMeasureDebug.setPlayerTreasury.
    out.steps.hooks = await page.evaluate(() => {
      const r = { spichlerz: false, skarbiec: false };
      try { if (window.__civTest && window.__civTest.setSpichlerzPanstwa) { window.__civTest.setSpichlerzPanstwa(0, 100000); r.spichlerz = true; } } catch (e) { r.spichlerzErr = String(e); }
      try { if (window.__nnsMeasureDebug && window.__nnsMeasureDebug.setPlayerTreasury) { window.__nnsMeasureDebug.setPlayerTreasury(100000); r.skarbiec = true; } } catch (e) { r.skarbiecErr = String(e); }
      return r;
    });
    const logMark = s.logs.length;
    await page.evaluate(() => window.__eraTestDebug.endTurn());

    const t0 = Date.now();
    let completed = false;
    let settled = false;
    while (Date.now() - t0 < 240000) {
      const tail = s.logs.slice(logMark);
      completed = tail.some((l) => l.includes('Zbadano: ' + prep.tech));
      settled = tail.some((l) => /triggerPlayerEndTurn: DONE/.test(l));
      if (completed && settled) break;
      await wait(500);
    }
    out.steps.completed = completed;
    out.logTail = s.logs.slice(logMark).filter((l) => /Nauka|EndTurn|endTurn|Zakończ|NNS|blok|Zbadano|Epoka|bramk/i.test(l)).slice(-25);
    out.steps.settled = settled;
    const eraAfter = await page.evaluate(() => window.__eraTestDebug.getPlayerState().era);
    out.steps.eraBefore = eraBefore;
    out.steps.eraAfter = eraAfter;
    await wait(1500);

    // Karta odkrycia technologii (overlay po EOT) zasłania panel: zamykamy ją PRZYCISKIEM (bez Esc, który mógłby
    // zamknąć sam panel miasta), zanim zmierzymy stan „stale”.
    out.steps.popupClosed = await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Zamknij|OK|Dalej|Rozumiem)$/.test((x.textContent || '').trim()));
      if (b) { b.click(); return true; }
      return false;
    });
    await wait(800);
    const B = await panelText(page);
    out.steps.panelStillOpenAfterEot = B.includes('Dostępne do budowy');
    if (!completed || !settled) { out.verdict = 'BLOCKED'; out.reason = 'badanie nie ukończyło się w EOT (completed=' + completed + ', settled=' + settled + ')'; }
    else if (eraAfter !== eraBefore) { out.verdict = 'BLOCKED'; out.reason = 'era zmieniona (' + eraBefore + '->' + eraAfter + '): to nie jest ścieżka bez awansu'; }
    else if (!out.steps.panelStillOpenAfterEot) { out.verdict = 'BLOCKED'; out.reason = 'panel miasta zamknął się w EOT — nie zmierzono'; }
    else {
      // Porównujemy BLOK listy budowy (od nagłówka „Dostępne do budowy”), nie cały tekst: po EOT może wisieć karta
      // odkrycia technologii (overlay), który nie należy do panelu miasta.
      const A_block = listBlock(A);
      const B_block = listBlock(B);
      await page.evaluate(() => {
        const b = Array.from(document.querySelectorAll('button')).find((x) => x.offsetParent && /^(Wróć|Zamknij|OK|Dalej|Rozumiem)$/.test((x.textContent || '').trim()));
        if (b) b.click();
      });
      await page.keyboard.press('Escape');
      await wait(500);
      await openCityPanel(page, cityId);
      const C2 = await panelText(page);
      const C_block = listBlock(C2);
      out.steps.blockLinesA = A_block.split('\n').length;
      out.steps.visibleChange = A_block !== C_block;
      if (!out.steps.visibleChange) { out.verdict = 'BLOCKED'; out.reason = 'odkrycie nie zmienia listy budowy — test nie rozstrzyga'; }
      else if (B_block === C_block) out.verdict = 'PASS';
      else { out.verdict = 'FAIL'; out.reason = 'otwarty panel nie odświeżył listy budowy po odkryciu (B != świeży render)'; }
      out.diffStaleVsFresh = B_block.split('\n').filter((l) => !C_block.split('\n').includes(l)).slice(0, 20);
      out.diffFreshVsStale = C_block.split('\n').filter((l) => !B_block.split('\n').includes(l)).slice(0, 20);
      fs.mkdirSync(EVID, { recursive: true });
      fs.writeFileSync(path.join(EVID, 'open-panel-refresh-A-full.txt'), A);
      fs.writeFileSync(path.join(EVID, 'open-panel-refresh-B-full.txt'), B);
      fs.writeFileSync(path.join(EVID, 'open-panel-refresh-C-full.txt'), C2);
      out.steps.fullLines = { A: A.split('\n').length, B: B.split('\n').length, C: C2.split('\n').length };
      out.steps.techRowsAB = { A: A.split('\n').filter((l) => /Stolarnia|Palisada|Tartak/.test(l)), B: B.split('\n').filter((l) => /Stolarnia|Palisada|Tartak/.test(l)), C: C2.split('\n').filter((l) => /Stolarnia|Palisada|Tartak/.test(l)) };
      fs.writeFileSync(path.join(EVID, 'open-panel-refresh-B-stale-block.txt'), B_block);
      fs.writeFileSync(path.join(EVID, 'open-panel-refresh-C-fresh-block.txt'), C_block);
    }
  } catch (e) {
    out.verdict = 'BLAD';
    out.error = e.stack || String(e);
  }
  await browser.close();
  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(path.join(EVID, 'open-panel-refresh-after-tech.json'), JSON.stringify(out, null, 2));
  console.log('VERDICT', out.verdict, out.reason || '');
  console.log(JSON.stringify(out, null, 1));
  process.exitCode = out.verdict === 'PASS' ? 0 : out.verdict === 'BLOCKED' ? 2 : 1;
})();
