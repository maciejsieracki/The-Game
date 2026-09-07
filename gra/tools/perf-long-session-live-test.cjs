'use strict';
/**
 * perf-long-session-live-test.cjs — P-PERF-SPOWALNIANIE-SESJA-DLUGA-Q1
 * (Operator Sonnet 5, effort=high, worktree izolowany).
 *
 * POWTÓRKA na AKTUALNYM HEAD narzędzia opisanego w RECON dispatchu (2026-08-17,
 * `dyspozycje/PYTANIA-OTWARTE.md`): oryginalny plik NIE jest wersjonowany w repo (żył
 * wyłącznie w tymczasowym worktree `agent-a8b9be08d973d3292`, commit `17baa179` —
 * SPRZED rewertu `2acf7c08` mechaniki ataku dystansowego). Ten plik to ODTWORZENIE tej
 * samej metody (realny headless Chromium, `?playtest=mapa`, realny przycisk „Zakończ
 * turę" = realny `triggerPlayerEndTurn()`, 150 tur, checkpoint co 10) na TYM worktree
 * (świeży `git fetch origin main`, patrz raport Operatora dla SHA) — NIE kopia starego
 * pliku (nie istnieje do skopiowania).
 *
 * CEL: potwierdzić/zaprzeczyć hipotezę „stuck-turn" z poprzedniego przebiegu — world.turn
 * utykało na 2 przez 140/150 iteracji, z `endTurn()` trwającym 60-76s i kończącym się
 * `settled=false` za każdym razem. RECON dispatchu: prawdopodobnie artefakt STAREGO kodu
 * (mechanika ataku dystansowego bez adiacencji, w pełni cofnięta 2026-08-16/17) — do
 * zweryfikowania, nie założenia.
 *
 * `?playtest=mapa` stawia jednostkę gracza CELOWO przy wrogim mieście (sandbox pod
 * bitwę/oblężenie) — bez interwencji druga+ tura AI otwiera modal preBattle i blokuje
 * dalsze `endTurn()`. Używamy DOKŁADNIE tego samego, już-scalonego haka testowego co
 * `rebel-protection-live-test.cjs` (main.ts, `__rebelProtectionTestDebug`,
 * R-MIASTA-REBELIA-OCHRONA-20-TUR-Q1) — `pullPlayerUnitsHome()` (steruje WYŁĄCZNIE
 * pozycją jednostek gracza, realny mechanizm bitwy nietknięty) przed KAŻDYM `endTurn()`
 * i `disableVictoryCheckForTest()` RAZ na starcie (sandbox jest z natury niezrównoważony
 * Power-owo — bez tego zwycięstwo/porażka przez dominację przerwałoby test przed 150
 * turami, ortogonalnie do tego, co ten test mierzy). Zero nowych haków w main.ts — allowlista
 * tej rundy pozwala WYŁĄCZNIE na nowy plik narzędzia.
 *
 * Bramka (z katalogu gra/): node tools/perf-long-session-live-test.cjs [tury] [checkpoint]
 * Domyślnie: 150 10 (jak w oryginalnym przebiegu 2026-08-17).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
// IZOLACJA (00-dispatch.md): budowa WYŁĄCZNIE poza drzewem repo (/tmp), nigdy do gra/dist ani
// jakiegokolwiek katalogu wewnątrz gra/ (git status/diff tej rundy musi zostać czysty).
// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalogi/pliki tymczasowe unikalne per przebieg ---
// Stala nazwa pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly przebieg (takze
// uruchomiony z innego worktree). Skutek dziala w obie strony: raz falszywy CZERWONY
// (jeden bieg czysci drugiemu katalog w locie), raz falszywy ZIELONY (dwa biegi mierza
// ten sam artefakt, wiec "parytet" jest artefaktem kolizji, nie dowodem). Sufiks
// per-proces to rozlacza; asercje i progi bramki pozostaja nietkniete.
const TMPDIR_RUN_ID = `${process.pid}-${Math.random().toString(36).slice(2, 8)}`;
// Unikalnosc BEZ sprzatania zamienilaby kolizje w staly wyciek dysku (brak miejsca to
// ta sama klasa problemu z drugiej strony), wiec kasujemy WLASNE artefakty tego biegu.
// Dopasowanie po TMPDIR_RUN_ID nie moze trafic w cudzy katalog. Zrzuty/podglady
// zostaja na dysku celowo — sa DOWODEM wizualnym (R-PROC-AUTOBOT.md §9 pkt 6).
process.on('exit', () => {
  // `require` lokalnie: hak musi dzialac takze w plikach, ktore nie maja `fs`/`path`
  // w zasiegu modulu — inaczej ReferenceError wpada w catch i sprzatanie milczy.
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      if (!ent.includes(TMPDIR_RUN_ID)) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
});
// SPRZATANIE PO PRZERWANYM PRZEBIEGU — BEZ dotykania dyspozycji sygnalow.
// Wczesniejsza wersja rejestrowala tu handlery SIGINT/SIGTERM/SIGHUP. To bylo GORSZE niz
// wyciek katalogu. Rejestracja handlera zdejmuje domyslna akcje sygnalu, a sygnal
// dostarczony w trakcie synchronicznego `execSync` (`vite build` — czyli wiekszosc czasu
// zycia tej bramki) NIE odpala handlera JS w ogole i zostaje POLKNIETY. Zmierzone na
// minimalnej reprodukcji i na tej bramce: bez handlera SIGTERM daje `exit=143` natychmiast,
// z handlerem proces zyje dalej i konczy sie `exit=0`. Bramka tracila zabijalnosc, a
// przerwany przebieg raportowal SUKCES — dokladnie ten falszywy ZIELONY, ktory ten temat
// ma likwidowac. Dlatego handlerow sygnalow tu nie ma i byc nie moze.
// Zamiast tego przy STARCIE kasujemy wlasne osierocone katalogi z poprzednich przebiegow,
// ktorych proces juz nie zyje. Dziala takze po SIGKILL, nieprzechwytywalnym z definicji.
(() => {
  const nfs = require('fs'); const npath = require('path'); const nos = require('os');
  // Sygnatura nazw nadawana przez ten temat: `<baza>-<pid>-<6 znakow>` (+ ewent. rozszerzenie).
  const STALE = /-(\d+)-[a-z0-9]{6}(?:\.[A-Za-z0-9]+)?$/;
  const alive = (pid) => {
    try { process.kill(pid, 0); return true; } catch (e) { return e.code === 'EPERM'; }
  };
  try {
    for (const ent of nfs.readdirSync(nos.tmpdir())) {
      const m = STALE.exec(ent);
      if (!m) continue;
      if (/shots|preview|zrzut/i.test(ent)) continue;   // zrzuty sa DOWODEM (§9 pkt 6)
      const pid = Number(m[1]);
      // Cudzy (albo wlasny) ZYWY przebieg zostaje nietkniety — kasujemy wylacznie sieroty.
      if (!Number.isInteger(pid) || pid === process.pid || alive(pid)) continue;
      try { nfs.rmSync(npath.join(nos.tmpdir(), ent), { recursive: true, force: true }); } catch { /* best-effort */ }
    }
  } catch { /* best-effort */ }
})();
const OUT_DIR = path.join(os.tmpdir(), `civ-dist-perf-long-session-${TMPDIR_RUN_ID}`);
const OUT_HTML = 'file://' + path.join(OUT_DIR, 'index.html') + '?playtest=mapa';
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

const TOTAL_TURNS = Number(process.argv[2]) || 150;
const CHECKPOINT_EVERY = Number(process.argv[3]) || 10;
const PER_ENDTURN_TIMEOUT_MS = 20000;

function buildBundle() {
  console.log('[perf-long-session] budowanie bundla (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...');
  execSync(
    `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(OUT_DIR)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe' },
  );
  if (!fs.existsSync(path.join(OUT_DIR, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + OUT_DIR);
  }
  console.log('[perf-long-session] build OK.');
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[perf-long-session] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
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
  await page.waitForSelector('.civ-hud, .civ-ux-frame, .civ-cs, [data-end]', { timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__eraTestDebug && window.__eraTestDebug.getWorldState().citiesLen > 0
      && window.__eraTestDebug.getWorldState().turn === 1,
    undefined,
    { timeout: 120000 },
  );
  await wait(300);
}

/** Jedna próba `endTurn()` = realny klik `[data-end]`. Zwraca { advanced, ms, timedOut }. */
async function clickEndTurnOnce(page, prevTurn) {
  const t0 = Date.now();
  const btn = page.locator('[data-end]');
  const count = await btn.count();
  if (count === 0) return { advanced: false, ms: Date.now() - t0, timedOut: false, noButton: true };
  let clickError = null;
  try {
    // force:true -- ZŁAPANE ŻYWO w tej rundzie: przycisk bywa `aria-disabled="true"`
    // (bottomBarHud.ts, `endVisuallyDisabled`/`canEnd`), a Playwright domyślnie ODMAWIA
    // kliknięcia elementu z aria-disabled (traktuje jako nieaktywny w swoich sprawdzeniach
    // "actionability") i CICHO czeka do timeoutu zamiast kliknąć. main.ts jawnie IGNORUJE
    // ten atrybut w handlerze `[data-end]` (komentarz w bottomBarHud.ts: "klik na Zakończ
    // turę NIE sprawdza blocking/canEnd -- zakończenie tury pozostaje ZAWSZE dostępne") --
    // to jest REALNE zachowanie gry dla gracza (mysz nie honoruje aria-disabled, tylko
    // czytniki ekranu), więc force:true tu odtwarza REALNY klik gracza, nie obchodzi silnik.
    await btn.click({ timeout: 5000, force: true });
  } catch (e) {
    // Przycisk mógł być chwilowo przesłonięty przez modal — nie traktuj jako fatal od razu,
    // ale ZAPISZ (złapane żywo w tej rundzie: cichy swallow tu ukrywał realny powód STUCK
    // -- klik nigdy nie docierał do handlera main.ts, a diagnostyka niżej pokazywała
    // "zero warningów", co bez tego pola wyglądało na tajemniczy hang silnika).
    clickError = String(e && e.message || e).slice(0, 300);
  }
  try {
    await page.waitForFunction(
      (prev) => window.__eraTestDebug && window.__eraTestDebug.getWorldState().turn > prev,
      prevTurn,
      { timeout: PER_ENDTURN_TIMEOUT_MS, polling: 250 },
    );
    // KLUCZOWE (złapane żywo w tej rundzie -- pierwszy przebieg dawał fałszywy "stuck" na
    // iteracji 2): `turn` inkrementuje się WCZEŚNIE wewnątrz triggerPlayerEndTurn(), ale
    // sam handler (faza AI, ekonomia, deferred hinty) potrafi jeszcze chwilę działać PO
    // tym momencie -- endTurnInProgress zostaje `true` przez ten ogon. Klik na [data-end]
    // w TEJ chwili trafia w `canPlayerInitiateEndTurn()===false` i jest cichym no-opem
    // (main.ts loguje `[EndTurn] blocked: endTurnInProgress`, przycisk fizycznie nic nie
    // robi) -- kolejna iteracja czekałaby w nieskończoność na turn, który nigdy nie
    // ruszy, bo jej JEDYNA próba kliknięcia w ogóle nie dotarła do triggerPlayerEndTurn().
    // Czekamy więc TWARDO na `isEndTurnInProgress()===false`, zanim zgłosimy tę turę jako
    // ukończoną -- dopiero wtedy następny klik ma szansę faktycznie wystartować.
    await page.waitForFunction(
      () => window.__eraTestDebug && window.__eraTestDebug.isEndTurnInProgress() === false,
      undefined,
      { timeout: PER_ENDTURN_TIMEOUT_MS, polling: 100 },
    );
    return { advanced: true, ms: Date.now() - t0, timedOut: false, clickError };
  } catch (e) {
    return { advanced: false, ms: Date.now() - t0, timedOut: true, clickError };
  }
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[perf-long-session] playwright nie znaleziony. Uruchom z gra/ po npm install.');
    process.exit(1);
  }

  buildBundle();

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  const checkpoints = [];
  let stuckAt = null;
  let stuckDetail = null;

  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const consoleWarnings = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
      // [EndTurn] blocked: ... to konsolowy sygnał main.ts o TYM, co konkretnie blokuje
      // koniec tury (preBattle/dyplomacja/inne) -- kluczowy dowód przy STUCK, nie tylko
      // fakt że turn się nie ruszył.
      else if (msg.type() === 'warning') consoleWarnings.push(msg.text());
    });
    page.on('pageerror', (err) => consoleErrors.push('[pageerror] ' + err.message));

    console.log(`[perf-long-session] bootstrap ?playtest=mapa (docelowo ${TOTAL_TURNS} tur, checkpoint co ${CHECKPOINT_EVERY})...`);
    await gotoPlaytestMapa(page);

    const hasHook = await page.evaluate(() => typeof window.__rebelProtectionTestDebug?.disableVictoryCheckForTest === 'function');
    if (!hasHook) {
      throw new Error('__rebelProtectionTestDebug.disableVictoryCheckForTest niedostępny w tym buildzie -- hak zniknął/zmienił kształt, patrz main.ts');
    }
    await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());

    const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
    console.log('[perf-long-session] start world:', JSON.stringify(world0));

    const wallStart = Date.now();
    let checkpointStart = Date.now();

    for (let i = 1; i <= TOTAL_TURNS; i++) {
      consoleWarnings.length = 0; // per-iteracja -- diagnostyka STUCK ma pokazywać TYLKO tę próbę.
      const before = await page.evaluate(() => window.__eraTestDebug.getWorldState());
      const eip0 = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
      await page.evaluate(() => window.__rebelProtectionTestDebug.pullPlayerUnitsHome());
      const outcome = await clickEndTurnOnce(page, before.turn);

      if (!outcome.advanced) {
        const after = await page.evaluate(() => window.__eraTestDebug.getWorldState());
        // Dowód CO blokuje: widoczny tekst overlayi preBattle/dyplomacji/modali (nie
        // zgadywanie z nazwy) + ostatnie warningi konsoli main.ts w tym oknie.
        const visibleOverlayText = await page.evaluate(() => {
          const sels = ['.civ-ux-frame', '.civ-map-load-overlay', '[class*="prebattle"]', '[class*="preBattle"]', '[class*="diplo"]', '[role="dialog"]'];
          const found = [];
          for (const s of sels) {
            document.querySelectorAll(s).forEach((el) => {
              const t = (el.textContent || '').trim().slice(0, 200);
              if (t) found.push({ sel: s, cls: el.className, text: t });
            });
          }
          return found.slice(0, 8);
        });
        // Co REALNIE jest na wierzchu w punkcie środka przycisku [data-end] -- rozstrzyga
        // definitywnie między "klik zaabsorbowany przez inny element" a "klik doszedł, ale
        // silnik nie zareagował".
        const elementAtButton = await page.evaluate(() => {
          const btn = document.querySelector('[data-end]');
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const top = document.elementFromPoint(cx, cy);
          return {
            btnRect: { x: cx, y: cy, w: r.width, h: r.height },
            topElement: top ? (top.tagName + '.' + (top.className || '')).slice(0, 200) : null,
            isButtonOnTop: top === btn || (top ? btn.contains(top) : false),
          };
        });
        const shotPath = `/tmp/perf-long-session-stuck-${i}-p${process.pid}.png`;
        try { await page.screenshot({ path: shotPath }); } catch { /* best-effort */ }
        // Rozróżnienie: REALNY modal bitwy/dyplomacji (oczekiwana mechanika gry -- gracz MUSI
        // go zamknąć ręcznie, `pullPlayerUnitsHome()` chroni tylko przed jednostkami gracza,
        // nie przed inicjatywą AI/barbarzyńców po kilkunastu turach -- dokładnie zgodnie z
        // własnym komentarzem tego haka w main.ts, "kilkanaście REALNYCH endTurn()") vs
        // NIEWYJAŚNIONE zawieszenie (żaden warning, żaden modal -- to byłby prawdziwy bug
        // silnika). Klasyfikacja z tekstu warningów main.ts, nie zgadywanie.
        const warnText = consoleWarnings.join(' | ');
        const blockReason = /preBattleOpen/.test(warnText)
          ? 'REALNY_MODAL_BITWY (isPreBattleOpen -- oczekiwana mechanika w tym sandboksie, wymaga ręcznego zamknięcia)'
          : /aiTurnAwaitingBattle|resume/.test(warnText)
            ? 'REALNA_FAZA_AI_BITWA (aiTurnAwaitingBattle/aiCmdResume)'
            : /gameOver/.test(warnText)
              ? 'GAME_OVER'
              : consoleWarnings.length === 0
                ? 'NIEWYJASNIONE (zero warningow main.ts w oknie oczekiwania -- klik prawdopodobnie nie dotarl, patrz clickError/elementAtButton)'
                : 'INNE: ' + warnText.slice(0, 200);
        stuckAt = i;
        stuckDetail = {
          iteration: i,
          beforeTurn: before.turn,
          afterTurn: after.turn,
          blockReason,
          endTurnInProgressBeforeClick: eip0,
          endTurnMs: outcome.ms,
          timedOut: outcome.timedOut,
          noButton: !!outcome.noButton,
          clickError: outcome.clickError,
          elementAtButton,
          lastConsoleWarnings: consoleWarnings.slice(-10),
          visibleOverlays: visibleOverlayText,
          screenshot: shotPath,
        };
        console.log(`[perf-long-session] ZATRZYMANO przy iteracji ${i}: turn ${before.turn} -> ${after.turn} (${outcome.ms}ms, timedOut=${outcome.timedOut}) -- powod: ${blockReason}`);
        console.log('[perf-long-session] clickError:', outcome.clickError);
        console.log('[perf-long-session] elementAtButton:', JSON.stringify(elementAtButton));
        console.log('[perf-long-session] ostatnie console.warn:', JSON.stringify(consoleWarnings.slice(-10)));
        console.log('[perf-long-session] widoczne overlaye:', JSON.stringify(visibleOverlayText));
        console.log('[perf-long-session] screenshot:', shotPath);
        break;
      }

      if (i % CHECKPOINT_EVERY === 0 || i === TOTAL_TURNS) {
        const state = await page.evaluate(() => window.__eraTestDebug.getWorldState());
        const heap = await page.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : null));
        const batchMs = Date.now() - checkpointStart;
        checkpointStart = Date.now();
        const cp = { iteration: i, turn: state.turn, citiesLen: state.citiesLen, unitsLen: state.unitsLen, heapUsedMB: heap !== null ? +(heap / 1048576).toFixed(2) : null, batchMs };
        checkpoints.push(cp);
        console.log(`[perf-long-session] checkpoint ${i}/${TOTAL_TURNS}: turn=${cp.turn} cities=${cp.citiesLen} units=${cp.unitsLen} heapMB=${cp.heapUsedMB} batch10Ms=${cp.batchMs}`);
      }
    }

    const wallMs = Date.now() - wallStart;
    console.log(`\n[perf-long-session] zakończono: ${stuckAt ? `zatrzymano na iteracji ${stuckAt}` : `${TOTAL_TURNS}/${TOTAL_TURNS} tur ukończonych`} w ${wallMs}ms.`);

    if (checkpoints.length >= 2) {
      const first = checkpoints[0];
      const last = checkpoints[checkpoints.length - 1];
      if (first.heapUsedMB !== null && last.heapUsedMB !== null) {
        const n = checkpoints.length;
        const slope = (last.heapUsedMB - first.heapUsedMB) / (n - 1);
        console.log(`[perf-long-session] heapUsed: ${first.heapUsedMB}MB -> ${last.heapUsedMB}MB (slope ~${slope.toFixed(3)}MB/checkpoint)`);
      }
    }

    console.log('\n=== WNIOSEK stuck-turn (hipoteza: world.turn utyka NA STAŁE, endTurn() nigdy się nie kończy) ===');
    const isRealModal = stuckDetail && /^REALNY_MODAL|^REALNA_FAZA_AI|^GAME_OVER/.test(stuckDetail.blockReason || '');
    if (stuckAt !== null && isRealModal) {
      console.log(`NIE POTWIERDZONE jako bug silnika -- turn ${checkpoints.length ? checkpoints[checkpoints.length - 1].turn : 1}..${stuckDetail.beforeTurn} przeszły NORMALNIE, zatrzymanie na iteracji ${stuckAt} to REALNY modal gry (${stuckDetail.blockReason}), wymaga ręcznego zamknięcia przez gracza -- oczekiwane w tym 2-cywilizacyjnym sandboksie bitewnym po kilkunastu turach (pullPlayerUnitsHome() chroni tylko przed jednostkami GRACZA, nie przed inicjatywą AI/barbarzyńców -- zgodnie z własnym komentarzem tego haka w main.ts). Detale: ${JSON.stringify(stuckDetail)}`);
    } else if (stuckAt !== null) {
      console.log(`NIEROZSTRZYGNIĘTE -- zatrzymanie na iteracji ${stuckAt} bez rozpoznanej przyczyny w konsoli main.ts (możliwy artefakt narzędzia, patrz clickError/elementAtButton) -- NIE traktować jako potwierdzenie oryginalnej hipotezy "stuck-turn" bez dalszej weryfikacji. Detale: ${JSON.stringify(stuckDetail)}`);
    } else {
      console.log(`NIE POTWIERDZONE: wszystkie ${TOTAL_TURNS} tur przeszły normalnie na tym HEAD (turn końcowy=${checkpoints[checkpoints.length - 1]?.turn ?? 'n/a'}).`);
    }

    if (consoleErrors.length > 0) {
      console.log(`\n[UWAGA] console/page errors (${consoleErrors.length}):`);
      for (const e of consoleErrors.slice(0, 15)) console.log('  ' + e);
    }

    process.exitCode = stuckAt !== null ? 2 : 0;
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error('[perf-long-session] BŁĄD:', e);
  process.exitCode = 1;
});
