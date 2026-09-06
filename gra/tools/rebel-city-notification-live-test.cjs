'use strict';
/**
 * rebel-city-notification-live-test.cjs — R-MIASTA-REBELIA-CICHA-BEZ-POWIADOMIENIA-Q1
 * (Operator Sonnet 5, effort=high, worktree izolowany).
 *
 * ZGŁOSZENIE (właściciel): "Inna cywilizacja przejmuje moje miasta, tak by nie
 * wypowiadała mi wojny [...] właśnie że to Sumerowie mi zajęli te miasta a miałem
 * z nimi pakt więc żadnej wojny oficjalnie nie było — musisz to znaleźć i naprawić."
 *
 * RECON (potwierdzony ŻYWO przez TĘ bramkę, nie tylko śledzeniem kodu): dwuetapowy,
 * CICHY łańcuch niewymagający złamania paktu —
 *   (1) miasto GRACZA z długotrwałym niskim porządkiem przekracza próg buntu skrajnego
 *       (`updateRevoltGrace`, main.ts) i dostaje `city.ownerId = REBEL_FACTION_OWNER_ID`
 *       — STAJE SIĘ NIEZALEŻNE (frakcja rebeliancka, NIE żadna cywilizacja AI). PRZED
 *       poprawką jedynym śladem był `console.log` — kompletnie niewidoczny w grze.
 *   (2) miasto rebelianckie (już NIE gracza) zostaje później zdobyte przez sąsiednią
 *       AI zwykłą ścieżką — `runCapitalCapturePlunder` jawnie omija ten przypadek
 *       (`oldOwner === REBEL_FACTION_OWNER_ID`, guard #25, bo frakcja rebeliancka nie
 *       ma skarbca/stolicy/Power), więc PRZED poprawką ta ścieżka też była CICHA.
 * Gracz nigdy nie widział (1) — a potem widział tylko (2): obce miasto u sąsiada,
 * z którym miał nietknięty pakt. Subiektywnie: "zabrali mi miasto bez wojny" —
 * mechanicznie poprawne (pakt nigdy złamany), ale doświadczenie złe.
 *
 * NAPRAWA (main.ts, WYŁĄCZNIE dodanie wywołań `showHintMessage`, zero zmian w logice
 * buntu/progach/`runCapitalCapturePlunder`):
 *   (a) przy przejściu miasta gracza na frakcję rebeliancką (main.ts ~27429-27450) —
 *       toast "zbuntowało się", NIE "zostało podbite".
 *   (b) przy przejęciu dawnego miasta rebelianckiego przez inną cywilizację (guard
 *       `oldOwner === REBEL_FACTION_OWNER_ID` w `runCapitalCapturePlunder`) — toast
 *       identyfikujący KTÓRA cywilizacja przejęła dawne miasto gracza.
 *
 * DLACZEGO ŻYWY CHROMIUM, NIE SAM TEST JEDNOSTKOWY: `updateRevoltGrace` jest czystą,
 * bundlowalną funkcją (society-breakdown.ts) — ale SAMO przypisanie `city.ownerId`,
 * wywołanie `showHintMessage` i przejście przez kolejkę `deferredEotHints`→`warEventLog`
 * żyją w zamkniętym main.ts (nie jest bundlowalny osobno, patrz nagłówki innych
 * `*-live-test.cjs` w tym katalogu). REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu zakazuje
 * uznania kryterium 3/4 za spełnione bez potwierdzenia, że komunikat REALNIE trafia do
 * gracza (nie tylko do wewnętrznej struktury, której nic nie renderuje) — stąd realny
 * `vite build` + realny headless Chromium (`?playtest=mapa`), wzorem
 * `era-change-toast-live-test.cjs` / `forced-war-player-target-live-test.cjs`.
 *
 * Hak `window.__rebelNotifyTestDebug` (main.ts) steruje WYŁĄCZNIE danymi wejściowymi
 * (populacja miasta, próg buntu z data.societyParams dla aktywnej trudności) — REBELIA
 * i PRZEJĘCIE idą przez REALNE funkcje silnika (`updateRevoltGrace` + przypisanie
 * `city.ownerId` przez `endTurn()`==`triggerPlayerEndTurn()`, oraz
 * `captureCityWithoutBattle` — ta sama funkcja co zwykłe wejście jednostki AI na puste/
 * słabo bronione miasto), NIE reimplementowane.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI (mutacja, kryterium 2 dispatchu): ta sama bramka buduje
 * DWA artefakty — PRZED (main.ts z DWOMA nowymi wywołaniami `showHintMessage` USUNIĘTYMI
 * w locie z tymczasowej kopii pliku, debug-hook zostaje) i PO (main.ts bez zmian, pełna
 * poprawka). Sekcja (B) dowodzi na PRZED: bunt faktycznie zachodzi (`city.ownerId`
 * zmienia się), ale BEZ żadnego widocznego komunikatu (kryterium 2). Sekcja (C) dowodzi
 * tego samego na PO — TERAZ komunikat jest widoczny (kryterium 3) — i rozszerza scenariusz
 * o przejęcie miasta przez AI z komunikatem identyfikującym tę AI (kryterium 4).
 *
 * Pokrycie (patrz KRYTERIA KOŃCA 1-8, 00-dispatch.md):
 *  A.  Bootstrap `?playtest=mapa` dobiega końca (miasta+jednostki, tura=1), oba artefakty.
 *  B.  PRZED poprawką: bunt zachodzi żywo (`city.ownerId===REBEL_FACTION_OWNER_ID`,
 *      `rebelState===true`) PO dokładnie tylu turach ile `graceTurns+2` mówi silnik —
 *      ale toast NIE pojawia się i dziennik WYDARZEŃ NIE dostaje wpisu o buncie
 *      (kryteria 1+2). Dalej: AI przejmuje dawne miasto rebelianckie — też BEZ toastu
 *      identyfikującego AI (odtworzenie stanu sprzed guard-fix w drugim punkcie).
 *  C.  PO poprawce: identyczny scenariusz — TERAZ toast + wpis w dzienniku WYDARZEŃ przy
 *      buncie (kryterium 3, treść "zbuntowało" / "niepodległość", NIE "podbite"), oraz
 *      toast przy przejęciu przez AI identyfikujący KONKRETNĄ cywilizację (kryterium 4).
 *  D.  Regresja (kryterium 6): guard `oldOwner===REBEL_FACTION_OWNER_ID` nadal zwraca
 *      `null` — przejęcie rebelianckiego miasta NIE dodaje fałszywego wpisu -99 do
 *      `eliminatedOwners` (ta sama ochrona co przed poprawką, main.ts guard #25
 *      NIETKNIĘTY).
 *  E.  Zero console.error / pageerror w obu artefaktach.
 *
 * Bramka (z katalogu gra/): node tools/rebel-city-notification-live-test.cjs
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src', 'main.ts');
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
const OUT_DIR_AFTER = path.join(os.tmpdir(), `civ-rebel-notify-live-test-after-${TMPDIR_RUN_ID}`);
const OUT_DIR_BEFORE = path.join(os.tmpdir(), `civ-rebel-notify-live-test-before-${TMPDIR_RUN_ID}`);
const URL_AFTER = 'file://' + path.join(OUT_DIR_AFTER, 'index.html') + '?playtest=mapa';
const URL_BEFORE = 'file://' + path.join(OUT_DIR_BEFORE, 'index.html') + '?playtest=mapa';
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

// --- (0) Mutacja PRZED: usuwa DOKŁADNIE dwa wywołania showHintMessage dodane przez tę
// poprawkę z tymczasowej KOPII main.ts (nigdy plik w repo), debug-hook zostaje
// nietknięty (potrzebny do sterowania scenariuszem także na PRZED). Jeśli którykolwiek
// z dwóch wzorców nie trafi (kod się przesunął), test przerywa zamiast po cichu
// porównywać dwa identyczne bundle (ten sam wzorzec anty-tautologii co
// sidepanel-event-header-wydarzenie-real-render-test.cjs).
function buildMutatedBeforeSource() {
  const src = fs.readFileSync(MAIN_TS, 'utf8');
  let applied = 0;

  const rebellionCallRe =
    /(console\.log\(`\[Rebelia\] Tura \$\{turn\} \$\{city\.name\} → frakcja rebeliantów`\);\n)([\s\S]{0,900}?showHintMessage\(\s*\n\s*`⚡ \$\{city\.name\} zbuntowało się i ogłosiło niepodległość! Miasto nie jest już Twoje\.`,\s*\n\s*5500,\s*\n\s*\);\n)/;
  const src1 = src.replace(rebellionCallRe, (whole, keep) => {
    applied++;
    return keep;
  });

  const captureCallRe =
    /(if \(oldOwner === REBEL_FACTION_OWNER_ID\) \{\n)([\s\S]{0,900}?if \(newOwner !== 0\) \{\s*\n\s*showHintMessage\(\s*\n\s*`\$\{city\.name\}: dawne zbuntowane miasto przejęte przez \$\{civLabelForOwner\(newOwner\)\}\.`,\s*\n\s*5000,\s*\n\s*\);\s*\n\s*\}\n)(\s*return null;\n\s*\})/;
  const src2 = src1.replace(captureCallRe, (whole, keepOpen, _body, keepClose) => {
    applied++;
    return keepOpen + keepClose;
  });

  return { mutated: src2, applied };
}

function buildBundle(outDir, srcOverride) {
  let restoreOriginal = null;
  if (srcOverride !== undefined) {
    const original = fs.readFileSync(MAIN_TS, 'utf8');
    fs.writeFileSync(MAIN_TS, srcOverride, 'utf8');
    restoreOriginal = () => fs.writeFileSync(MAIN_TS, original, 'utf8');
  }
  try {
    console.log(`[rebel-city-notification-live-test] budowanie bundla -> ${outDir} (vite build, wyłącznie dozwolona komenda z CLAUDE.md)...`);
    execSync(
      `node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(path.relative(GRA_DIR, outDir))} --emptyOutDir`,
      { cwd: GRA_DIR, stdio: 'pipe' },
    );
  } finally {
    if (restoreOriginal) restoreOriginal();
  }
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error('Build nie wyprodukował index.html w ' + outDir);
  }
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[rebel-city-notification-live-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true,
      executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function gotoPlaytestMapa(page, url) {
  await page.goto(url, { waitUntil: 'load', timeout: 120000 });
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

async function runEndTurnAndSettle(page, timeoutMs = 90000) {
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  let settled = false;
  while (Date.now() - t0 < timeoutMs) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) { settled = true; break; }
    await wait(150);
  }
  await wait(400);
  return { sawInProgress, settled };
}

/** Etap 1: `revoltGraceRemaining` ustawiony wprost na 0 przez `forceRevoltEligible`
 * (ten sam wzorzec "jedna prawdziwa tura od przejścia" co `prepareOneTechFromBronze`
 * dla epoki) -- JEDNA prawdziwa `endTurn()` wystarczy, żeby `updateRevoltGrace`
 * (currentGrace===0 -> shouldTriggerRebellion) i przypisanie `city.ownerId` przeszły
 * przez REALNY kod main.ts. Rozegranie KOLEJNYCH tur w tym sandboxie (jednostka tuż
 * przy Atenach, `?playtest=mapa` = sandbox bitwy/oblężenia) otwiera modal preBattle
 * w fazie AI i blokuje dalsze `endTurn()` -- stąd dokładnie jedna tura, nie pętla. */
async function stageRebellion(page, label) {
  const world0 = await page.evaluate(() => window.__eraTestDebug.getWorldState());
  assert(`${label}: bootstrap zakończony citiesLen>0`, world0.citiesLen > 0, world0);
  assert(`${label}: bootstrap zakończony turn===1`, world0.turn === 1, world0);

  const city = await page.evaluate(() => window.__rebelNotifyTestDebug.getPlayerCity());
  assert(`${label}: miasto gracza znalezione`, !!city && typeof city.id === 'string', city);

  const forced = await page.evaluate(
    (cityId) => window.__rebelNotifyTestDebug.forceRevoltEligible(cityId), city.id,
  );
  assert(`${label}: forceRevoltEligible zwrócił graceTurns>0`, forced.graceTurns > 0, forced);

  const r = await runEndTurnAndSettle(page);
  assert(`${label}: jedyne wymagane przejście tury faktycznie się dokonało`, r.settled, r);

  const stateAfter = await page.evaluate(
    (cityId) => window.__rebelNotifyTestDebug.getCityState(cityId), city.id,
  );
  const REBEL_ID = await page.evaluate(() => window.__rebelNotifyTestDebug.REBEL_FACTION_OWNER_ID);
  assert(`${label}: KRYTERIUM 1 -- city.ownerId zmienił się na REBEL_FACTION_OWNER_ID (${REBEL_ID})`,
    stateAfter && stateAfter.ownerId === REBEL_ID, stateAfter);
  assert(`${label}: rebelState===true`, stateAfter && stateAfter.rebelState === true, stateAfter);

  return { city, REBEL_ID };
}

async function scenario(page, label, expectNotification) {
  const { city, REBEL_ID } = await stageRebellion(page, label);

  // --- KRYTERIUM 2/3: notyfikacja przy SAMYM buncie -------------------------------
  // Bunt zachodzi WEWNĄTRZ pętli per-miasto końca tury (endTurnInProgress===true) --
  // R-EOT-EVENT-DEFER-Q1=A (eot-event-defer.ts) celowo NIE maluje takich wywołań
  // showHintMessage na żywym #civ-hint-toast ("skutki końca tury nie migają w
  // overlay") -- trafiają WYŁĄCZNIE do warEventLog (deferredEotHints -> flush w
  // finally triggerPlayerEndTurn), dokładnie tak samo jak KAŻDE inne zdarzenie EOT w
  // tym pliku (głód, atak wroga, dyplomacja AI<->AI...). To jest "sprawdzony w
  // strukturze zdarzeń/UI" (kryterium 3 dispatchu) -- żywy toast nie jest właściwym
  // sygnałem dla TEGO typu zdarzenia i jego brak tu NIE jest regresją (patrz też
  // KRYTERIUM 4 niżej: przejęcie przez AI woła showHintMessage POZA endTurnInProgress
  // -- TAM żywy toast jest właściwym i sprawdzanym sygnałem).
  // Pełny log (__rebelNotifyTestDebug.getWarEventLog, max 8), nie obcięty top-3
  // (__eraTestDebug.getWarEventLogHead) -- ta sama tura może dorzucić inne wpisy EOT
  // (np. atak AI), które zepchnęłyby szukany wpis poza okno top-3.
  const warLogAfterRevolt = await page.evaluate(() => window.__rebelNotifyTestDebug.getWarEventLog());
  const revoltLogEntry = Array.isArray(warLogAfterRevolt)
    ? warLogAfterRevolt.find((e) => typeof e.subtitle === 'string'
      && e.subtitle.includes(city.name) && /zbuntowa|niepodległ/i.test(e.subtitle))
    : undefined;

  if (expectNotification) {
    assert(`${label}: KRYTERIUM 3 -- wpis w dzienniku WYDARZEŃ (warEventLog) o buncie tego miasta, widoczny graczowi na starcie kolejnej tury`,
      !!revoltLogEntry, warLogAfterRevolt);
    assert(`${label}: treść komunikatu NIE sugeruje "podbite przez wroga"`,
      !!revoltLogEntry && !/podbit|zdobyt(e|y)|wróg/i.test(revoltLogEntry.subtitle || ''), revoltLogEntry);
  } else {
    assert(`${label}: KRYTERIUM 2 -- PRZED poprawką bunt NIE generuje wpisu w dzienniku WYDARZEŃ`,
      !revoltLogEntry, warLogAfterRevolt);
  }

  // --- KRYTERIUM 4/6: przejęcie dawnego miasta rebelianckiego przez AI ------------
  const captured = await page.evaluate(
    (cityId) => window.__rebelNotifyTestDebug.aiCaptureFormerRebelCity(cityId), city.id,
  );
  assert(`${label}: AI faktycznie przejęła miasto (cityOwnerIdAfter===aiOwnerId, nie REBEL, nie gracz)`,
    captured.cityOwnerIdAfter === captured.aiOwnerId && captured.aiOwnerId > 0, { captured, REBEL_ID });

  const toastAfterCapture = await page.evaluate(() => window.__eraTestDebug.getToast());
  const civLabel = await page.evaluate(
    (ownerId) => window.__rebelNotifyTestDebug.getCivLabel(ownerId), captured.aiOwnerId,
  );
  const captureToastVisible = !!toastAfterCapture && toastAfterCapture.display === 'block'
    && toastAfterCapture.html.includes(city.name) && toastAfterCapture.html.includes(civLabel);

  if (expectNotification) {
    assert(`${label}: KRYTERIUM 4 -- toast identyfikuje KONKRETNĄ cywilizację (${civLabel}), która przejęła dawne miasto gracza`,
      captureToastVisible, { toastAfterCapture, civLabel });
  } else {
    assert(`${label}: KRYTERIUM 2-analog -- PRZED poprawką przejęcie dawnego miasta rebelianckiego przez AI NIE generuje toastu identyfikującego tę AI`,
      !captureToastVisible, { toastAfterCapture, civLabel });
  }

  // --- KRYTERIUM 6: guard #25 (eliminacja) nietknięty ------------------------------
  const rebelWasEliminated = await page.evaluate(
    (ownerId) => window.__rebelNotifyTestDebug.isOwnerEliminated(ownerId), REBEL_ID,
  );
  assert(`${label}: REGRESJA -- przejęcie miasta rebelianckiego NIE dodaje fałszywego wpisu ${REBEL_ID} do eliminatedOwners (guard #25 main.ts nietknięty)`,
    rebelWasEliminated === false, { rebelWasEliminated });

  return { pageErrorsCheckedAt: Date.now() };
}

async function main() {
  let chromium;
  try {
    ({ chromium } = require('playwright'));
  } catch (e) {
    console.error('[rebel-city-notification-live-test] playwright nie znaleziony. Uruchom z gra/ (npm i już zrobione).');
    process.exit(1);
  }

  console.log('\n-- (0) Mutacja PRZED: usuwanie DOKŁADNIE dwóch showHintMessage() dodanych tą poprawką (tymczasowa kopia, plik w repo nietknięty) --');
  const { mutated, applied } = buildMutatedBeforeSource();
  assert('(0) mutacja PRZED faktycznie usunęła OBA wywołania showHintMessage (test nie jest pusty/tautologiczny)',
    applied === 2, { applied });
  if (applied !== 2) {
    console.log('\nPRZERWANE: nie udało się odtworzyć stanu sprzed poprawki -- kod się przesunął, popraw wzorce w buildMutatedBeforeSource().');
    process.exit(1);
  }

  buildBundle(OUT_DIR_BEFORE, mutated);
  buildBundle(OUT_DIR_AFTER, undefined);

  const browser = await launchBrowser(chromium);
  const consoleErrors = [];
  try {
    console.log('\n=== ARTEFAKT PRZED poprawką (mutacja: notyfikacje usunięte, debug-hook zostaje) ===');
    {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push('[PRZED] ' + msg.text()); });
      page.on('pageerror', (err) => consoleErrors.push('[PRZED][pageerror] ' + err.message));
      await gotoPlaytestMapa(page, URL_BEFORE);
      await scenario(page, 'PRZED', false);
      await page.close();
    }

    console.log('\n=== ARTEFAKT PO poprawce (main.ts realny, niezmieniony) ===');
    {
      const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
      page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push('[PO] ' + msg.text()); });
      page.on('pageerror', (err) => consoleErrors.push('[PO][pageerror] ' + err.message));
      await gotoPlaytestMapa(page, URL_AFTER);
      await scenario(page, 'PO', true);
      await page.close();
    }

    assert('(E) zero console.error / pageerror w obu artefaktach', consoleErrors.length === 0, consoleErrors);
    if (consoleErrors.length) console.error('   konsola:', consoleErrors.join(' | '));
  } finally {
    await browser.close();
  }

  try { fs.rmSync(OUT_DIR_BEFORE, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }
  try { fs.rmSync(OUT_DIR_AFTER, { recursive: true, force: true }); } catch (e) { /* nieistotne */ }

  console.log(`\n${pass} pass · ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[rebel-city-notification-live-test] błąd:', e);
  try { fs.rmSync(OUT_DIR_BEFORE, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  try { fs.rmSync(OUT_DIR_AFTER, { recursive: true, force: true }); } catch (_) { /* nieistotne */ }
  process.exit(1);
});
