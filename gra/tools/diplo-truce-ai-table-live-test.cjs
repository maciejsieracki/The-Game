'use strict';
/**
 * diplo-truce-ai-table-live-test.cjs — R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1, CZĘŚĆ A.
 *
 * Pomiar przebiegu od DECYZJI AI do KARTY NA STOLE przez PRAWDZIWĄ ścieżkę gry:
 *   decideAIDiplomacy (ai.ts, aiPeaceProposalKind) → komenda AI → enqueueNegotiationFromAiCmd
 *   (main.ts) → wpis negotiationTable (stół gracza). Realny Chromium, bundle Vite (?playtest=mapa),
 *   tury kończone REALNYM __eraTestDebug.endTurn(). Brak konwertera i brak acceptForTest.
 *
 * SETUP (nie część mierzonego przebiegu, tylko warunki stanu świata):
 *   - __truceTestDebug.suppressVictoryForTest (mapa testowa kończy grę zwycięstwem w EOT),
 *   - __peaceRulesTestDebug.setAiPowerBonusForTest(AI, 500): moc AI podniesiona tak, by
 *     respektWzgledny AI wyniósł ~0.31 — w przedziale (progTrybutKrytyczny, progPokojSlabosc],
 *     gdzie AI wybiera propozycję pokoju/rozejmu (poniżej = trybut za pokój, priorytet 1),
 *   - __truceTestDebug.setWarAge(AI, N): wiek wojny (rozejm: N=5 < 20; kontrola pokoju: N=25).
 *
 * MODE (zmienna środowiskowa MODE, domyślnie rozejm):
 *   rozejm — PASS = na stole jest wpis actionId 'rozejm' od AI (turns obecne).
 *   pokoj  — KONTROLA: ten sam scenariusz z wiekiem wojny 25 (AI proponuje pokój).
 *
 * Wynik zapisany w logu: decyzja AI (console '[Dyplomacja] AI…'), wpisy stołu po każdej turze,
 * czas od startu, obecność tekstu propozycji w DOM i zrzut ekranu do katalogu evidence.
 *
 * Usage (z gra/): node ./node_modules/vite/bin/vite.js build --outDir <scratch> --emptyOutDir
 *                 SKIP_BUILD=1 MODE=rozejm node tools/diplo-truce-ai-table-live-test.cjs <scratchAbs> [evidenceAbs]
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(GRA_DIR, '..');
const SCRATCH = process.argv[2] || path.join(os.tmpdir(), 'civ-truce-ai-table-' + process.pid);
const EVIDENCE = process.argv[3]
  || path.join(REPO_ROOT, 'dyspozycje', 'autobot', 'runs', 'R-WEB-TRUCE-E2E-SAVELOAD-MEASURE-Q1', 'evidence');
const MODE = process.env.MODE === 'pokoj' ? 'pokoj' : 'rozejm';
const OUT_HTML = 'file://' + path.join(SCRATCH, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const PLAYER = 0;
const AI = 1;
const AI_POWER_BONUS = 500;
const WAR_AGE = MODE === 'rozejm' ? 5 : 25;
const TURNS_TO_RUN = 1; // jedna realna tura EOT wystarcza: decyzja AI i wpis stołu powstają w EOT 1→2
const T0 = Date.now();
const elapsed = () => ((Date.now() - T0) / 1000).toFixed(1) + 's';

let tWorld = 0;
const SCENARIO_LIMIT_MS = 60000; // budzet PO wygenerowaniu swiata (generowanie ~70-80 s CPU nie zalezy od testu)
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function buildIfNeeded() {
  if (process.env.SKIP_BUILD === '1' && fs.existsSync(path.join(SCRATCH, 'index.html'))) return;
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(SCRATCH)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 400000 });
}

async function launchBrowser(chromium) {
  try { return await chromium.launch({ headless: true }); }
  catch (e) {
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function main() {
  buildIfNeeded();
  const { chromium } = require('playwright');
  let browser = null;
  const errors = [];
  const decisionLogs = [];
  let exitCode = 1;
  try {
    browser = await launchBrowser(chromium);
    const tLaunch = ((Date.now() - T0) / 1000).toFixed(1);
    const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => {
      const t = m.text();
      if (/^\[Dyplomacja\] AI1 /.test(t) || /DBG-TRUCE/.test(t)) decisionLogs.push(t.slice(0, 260));
    });
    await page.goto(OUT_HTML, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction(
      () => !!window.__peaceRulesTestDebug && !!window.__truceTestDebug && !!window.__eraTestDebug
        && window.__eraTestDebug.getWorldState().citiesLen > 0
        && window.__eraTestDebug.getWorldState().turn === 1,
      undefined,
      { timeout: 300000 },
    );
    tWorld = Date.now();
    console.log(`[ai-table] świat gotowy po ${elapsed()} (tryb ${MODE}); start przeglądarki ${tLaunch}s`);

    await page.evaluate(() => window.__truceTestDebug.suppressVictoryForTest());
    await page.evaluate(([ai, b]) => window.__peaceRulesTestDebug.setAiPowerBonusForTest(ai, b), [AI, AI_POWER_BONUS]);
    await page.evaluate(([ai, w]) => window.__truceTestDebug.setWarAge(ai, w), [AI, WAR_AGE]);
    const powers = await page.evaluate(([ai]) => window.__peaceRulesTestDebug.getPowers(ai), [AI]);
    const warTurns = await page.evaluate(([ai]) => window.__peaceRulesTestDebug.getWarTurns(ai), [AI]);
    const rw = await page.evaluate(([ai]) => window.__peaceRulesTestDebug.evaluatePeaceFromPlayer(ai).rw, [AI]);
    console.log('[ai-table] setup: moc', JSON.stringify(powers), 'tury wojny', JSON.stringify(warTurns), 'rw AI', rw);

    const startTurn = await page.evaluate(() => window.__truceTestDebug.turn());
    const aiEntries = new Map();
    let stolaWpisow = 0;
    for (let k = 0; k < TURNS_TO_RUN; k++) {
      const cur = await page.evaluate(() => window.__truceTestDebug.turn());
      await page.evaluate(() => window.__eraTestDebug.endTurn());
      // Czekamy na realne ZAKOŃCZENIE EOT (faza AI też w EOT), nie na stały czas.
      await page.waitForFunction(
        (c) => window.__truceTestDebug.turn() > c && !window.__eraTestDebug.isEndTurnInProgress(),
        cur,
        { timeout: 60000 },
      );
      const tura = await page.evaluate(() => window.__truceTestDebug.turn());
      const entries = await page.evaluate(() => window.__truceTestDebug.negotiationEntries());
      stolaWpisow = entries.length;
      console.log(`[ai-table] tura ${tura}: wpisy stołu ${entries.length}`, JSON.stringify(entries));
      for (const e of entries) {
        if (e.proposerOwnerId !== AI) continue;
        aiEntries.set(e.actionId + '|' + (e.turns ?? ''), { ...e, tura });
      }
    }
    const endTurnNo = await page.evaluate(() => window.__truceTestDebug.turn());
    const pairFinal = await page.evaluate(([p, a]) => window.__truceTestDebug.pairState(p, a), [PLAYER, AI]);
    console.log('[ai-table] tury', startTurn, '->', endTurnNo, '| stan pary', JSON.stringify(pairFinal));
    console.log('[ai-table] decyzje AI (console):', decisionLogs.length ? decisionLogs.join(' || ') : 'brak');
    console.log('[ai-table] wpisy AI na stole (unikalne):', JSON.stringify([...aiEntries.values()]));

    const wantedAction = MODE === 'rozejm' ? 'rozejm' : 'pokoj';
    const found = [...aiEntries.values()].find(e => e.actionId === wantedAction);
    let domHit = null;
    let domOk = true;
    if (found) {
      fs.mkdirSync(EVIDENCE, { recursive: true });
      const rel = (p) => path.relative(REPO_ROOT, p).split(path.sep).join('/');
      // Karta na stole = wiersz „Dyplomacja: <kraj> · Rozpatrz →" w panelu bocznym (DOM). Modal bitwy „Wróg atakuje"
      // (EOT 1→2 w sandboxie, skrót w modalu: Esc = Wycofaj) przechwytuje klik w panel — zamykamy go realnym
      // klawiszem Escape (pomiar: klik przycisku „Wycofaj" przez Playwright wygasa, Escape działa).
      let bitwaEsc = 0;
      for (let i = 0; i < 4; i++) {
        const bitwa = await page.evaluate(() => /wróg atakuje/i.test((document.body && document.body.innerText) || ''));
        if (!bitwa) break;
        await page.keyboard.press('Escape');
        bitwaEsc++;
        await wait(400);
      }
      const bitwaPozostala = await page.evaluate(() => /wróg atakuje/i.test((document.body && document.body.innerText) || ''));
      const karta = page.locator('.sp-event[data-id]', { hasText: 'Dyplomacja' }).first();
      const kartaLicznik = await page.locator('.sp-event[data-id]', { hasText: 'Dyplomacja' }).count();
      const kartaWidoczna = kartaLicznik > 0 && await karta.isVisible().catch(() => false);
      const shotKarta = path.join(EVIDENCE, `ai-table-${MODE}-karta-stol.png`);
      await page.screenshot({ path: shotKarta, fullPage: false });
      // Otwórz kartę (klik) i sprawdź, że audiencja z propozycją AI faktycznie się otwarła.
      let otwarto = false;
      let przyciskPrzyjmij = 0;
      let przyciskStan = null;
      let kolumnyTekst = null;
      let tekstRozejm = false;
      try {
        await karta.click({ timeout: 8000 });
        await page.waitForSelector('[data-negot-act="accept-package"]', { state: 'attached', timeout: 10000 });
        otwarto = true;
        przyciskPrzyjmij = await page.locator('[data-negot-act="accept-package"]').count();
        przyciskStan = await page.evaluate(() => [...document.querySelectorAll('[data-negot-act]')].map(b => ({
          act: b.getAttribute('data-negot-act'), disabled: !!b.disabled, title: b.getAttribute('title'), text: (b.textContent || '').trim() })));
        kolumnyTekst = await page.evaluate(() => [...document.querySelectorAll('.da-card, .da-neg-card, [class*="da-"][class*="card"]')]
          .slice(0, 12).map(e => (e.innerText || '').replace(/\s+/g, ' ').slice(0, 200)));
        // Karta propozycji AI w kolumnie „Oni oferują" ma etykietę akcji '10' („Propozycja pokoju / zawieszenia
        // broni") — NIE „Traktat handlowy" (regresja: rozejm bez wpisu w CYW_ACTION_TO_UI_ID, main.ts).
        tekstRozejm = await page.evaluate(() => {
          const t = [...document.querySelectorAll('.da-negot.incoming')].map(e => e.innerText || '').join(' ');
          return /zawieszenia broni/i.test(t) && !/traktat handlowy/i.test(t);
        });
      } catch (e) { otwarto = false; }
      const shotModal = path.join(EVIDENCE, `ai-table-${MODE}-karta-otwarta.png`);
      await page.screenshot({ path: shotModal, fullPage: false });
      // Akceptacja KLIKIEM (handler stołu: handleNegotiationAccept) → status rozejmu w meta pary.
      let akceptacja = null;
      if (otwarto) {
        const zablokowany = przyciskStan.find(b => b.act === 'accept-package')?.disabled === true;
        if (!zablokowany) await page.locator('[data-negot-act="accept-package"]').first().click({ timeout: 8000 });
        await wait(800);
        akceptacja = {
          para: await page.evaluate(([p, a]) => window.__truceTestDebug.pairState(p, a), [PLAYER, AI]),
          przyjmijZablokowany: zablokowany,
          wpisyPoAkceptacji: (await page.evaluate(() => window.__truceTestDebug.negotiationEntries())).length,
        };
        const shotPo = path.join(EVIDENCE, `ai-table-${MODE}-po-akceptacji.png`);
        await page.screenshot({ path: shotPo, fullPage: false });
        console.log('[ai-table] zrzut po akceptacji:', rel(shotPo));
      }
      const akceptOk = !!akceptacja && akceptacja.para.truceUntilTurn != null && akceptacja.wpisyPoAkceptacji === 0;
      domOk = kartaWidoczna && otwarto && tekstRozejm && przyciskPrzyjmij > 0 && akceptOk;
      domHit = { kartaLicznik, kartaWidoczna, bitwaEscape: bitwaEsc, bitwaPozostala,
        otwarto, tekstRozejm, przyciskPrzyjmij, przyciskStan, kolumnyTekst, akceptacja, akceptOk };
      console.log('[ai-table] DOM karty:', JSON.stringify(domHit), '| zrzuty:', rel(shotKarta), rel(shotModal));
    }
    console.log('[ai-table] stołWpisów(ostatnia tura)=' + stolaWpisow);
    console.log(found
      ? `[ai-table] ${domOk ? 'PASS' : 'FAIL'} (${MODE}) — AI wstawiło ${wantedAction} na stół (tura ${found.tura}); karta otwarta+zaakceptowana klikiem: ${domOk}`
      : `[ai-table] FAIL (${MODE}) — AI nie wstawiło ${wantedAction} na stół; decyzja AI: ${decisionLogs.length ? 'zapisana' : 'brak'}`);
    console.log('[ai-table] błędy strony:', errors.length ? JSON.stringify(errors.slice(0, 5)) : 'brak');
    console.log('[ai-table] czas całkowity:', elapsed(), '(limit kryterium 120 s:', (Date.now() - T0) <= 120000 ? 'spełniony' : 'PRZEKROCZONY', ')');
    const scenarioMs = Date.now() - tWorld;
    const scenarioOk = scenarioMs <= SCENARIO_LIMIT_MS;
    console.log(`[ai-table] scenariusz po wygenerowaniu swiata: ${(scenarioMs / 1000).toFixed(1)}s (strażnik ${SCENARIO_LIMIT_MS / 1000}s: ${scenarioOk ? 'OK' : 'PRZEKROCZONY'})`);
    exitCode = found && domOk && scenarioOk && errors.length === 0 ? 0 : 1;
  } finally {
    if (browser) await browser.close().catch(() => {});
  }
  process.exit(exitCode);
}

main().catch((e) => { console.error(e); process.exit(1); });
