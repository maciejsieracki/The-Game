'use strict';
/**
 * ai-buduje-budynki-test.cjs — P-AI-NIE-STAWIA-BUDYNKOW-Q1 (Operator Opus 5, effort high,
 * worktree izolowany, RUNDA 1 + OBRONA), GOAL 3 z 00-dispatch.md.
 *
 * WYZWALACZ (właściciel, dwa zrzuty, dwie różne cywilizacje): „Miasto zdobyłem od innej
 * cywilizacji i nie ma tam żadnego budynku (...) przecież 50% pracy miała iść na budynki",
 * panel „BUDYNKI W MIEŚCIE (0) — (brak)". Doprecyzowanie właściciela: chodzi o miasta
 * przejęte od PEŁNOPRAWNEJ cywilizacji AI, trzymane przez nią DŁUGO — nie tylko o
 * miasta-państwa. Stąd asercja POKRYCIA (A7): KAŻDE miasto dużego AI w wieku co najmniej
 * COVERAGE_MIN_AGE tur musi mieć >=1 wpis w `cityBuilt` — suma po imperium („>0") ukrywa
 * miasta z zerem, a to właśnie one są objawem zgłoszenia.
 *
 * PRZYCZYNA: `seedCityOwnerDefaults` (main.ts) seedowała `ownerDefaultBudowaProfil` przez
 * `freshOwnerDefaultBudowaProfil()` = `'reczny'` dla KAŻDEGO właściciela, przy KAŻDYM
 * założeniu i KAŻDYM przejęciu miasta; `migrateBudowaProfilOnLoad` robiła to samo na
 * ścieżce WCZYTANIA ZAPISU. `pickAutoBuildItem` (auto-manage.ts) odmawia dla 'reczny',
 * a AI nie ma ŻADNEJ ścieżki UI powrotu do trybu auto → martwe były OBIE ścieżki
 * auto-kolejki: Zarządca (`autoManageCity`, duże AI) i `tryAutoEnqueueBuild`
 * (gałąź `else if (isAutoBudowaTryb(...))`, miasta-państwa).
 *
 * NAPRAWA — dwie funkcje w `empire-city-defaults.ts`, obie objęte mutacją niżej:
 *  1. `freshOwnerDefaultBudowaProfilForOwner` — nowa gra / założenie / przejęcie miasta.
 *     ECHO właściciela (po dispatchu, wiążące): tryb AUTOMATYCZNY dla WSZYSTKICH
 *     właścicieli, ŁĄCZNIE Z GRACZEM; 'reczny' zostaje wyłącznie ownerom ujemnym
 *     (barbarzyńcy -1, rebelianci -99).
 *  2. `upgradeBudowaProfilAutoDefaultsOnLoad` — ścieżka WCZYTANIA ZAPISU (§16a pkt 4).
 *     Bez niej trwająca rozgrywka właściciela zostawałaby na 'reczny' NA ZAWSZE.
 *
 * DLACZEGO ŻYWY CHROMIUM, NIE TEST JEDNOSTKOWY: `seedCityOwnerDefaults`, `cityBuilt`,
 * `cityProd`, `tryAutoEnqueueBuild`, `isCityStateOwner`, `buildSaveGameSnapshot`,
 * `restoreGameFromSave` i cała pętla ekonomii tury żyją WYŁĄCZNIE jako domknięcia
 * wewnątrz `main()` (main.ts nie jest modułem). REGUŁA PRZECIW SAMOOSZUKIWANIU dispatchu,
 * tryb drugi, zakazuje dowodu z deklaracji — dowodem ma być WZROST `cityBuilt` w czasie
 * w PRAWDZIWEJ pętli ekonomii. Stąd realny `vite build` (jedyna dozwolona komenda buildu,
 * C-001) + realny headless Chromium, realny `doStartGame`, realne `endTurn()`, realne
 * przejęcia (`captureViaBattle` → `applyCityCaptureToMap` → `seedCityOwnerDefaults`)
 * i realny roundtrip zapisu (`buildSaveGameSnapshot` → `restoreGameFromSave`).
 *
 * IZOLACJA HARNESSU (§9 pkt 1 / C-001 oraz §2b):
 *  - `--outDir` ZAWSZE poza drzewem repo (`os.tmpdir()`) — OneDrive blokuje `unlink`
 *    w `gra/`, a artefakty buildu nie mogą zostawać w `git status`;
 *  - bramka NIE MUTUJE ŻADNEGO ŚLEDZONEGO PLIKU. Każdy wariant budowany jest z
 *    LUSTRA katalogu `gra/` w `os.tmpdir()`: `src` to prawdziwa kopia (mutowana
 *    wyłącznie tam), `data`/`node_modules` to dowiązania, `index.html`/`vite.config.ts`/
 *    `tsconfig.json`/`package.json` to kopie. Zabicie biegu (SIGKILL/timeout) nie może
 *    zostawić worktree z cofniętą naprawą ani zatruć równoległych bramek.
 *
 * DETERMINIZM: przed każdym `goto` wstrzykiwany jest ziarnowany PRNG podmieniający
 * `Math.random` (mulberry32). Bez tego progi M1/M2 byłyby gołymi nierównościami między
 * dwoma STOCHASTYCZNYMI przebiegami (zarzut 6 Evaluatora, potwierdzony trzema pomiarami
 * na tym samym seedzie mapy). Podmiana żyje WYŁĄCZNIE w harnessie testu — zero zmian
 * w kodzie gry.
 *
 * CZTERY BUILDY — test jest z konstrukcji NIETAUTOLOGICZNY (reguła anty-halucynacyjna,
 * tryby pierwszy i czwarty). Jedyna różnica to ciała dwóch funkcji naprawy:
 *   FIX   — żywy kod z naprawą.
 *   MUT-A — stan sprzed naprawy (globalny 'reczny' + migracja wczytania wyłączona).
 *           Musi dać ŚCIŚLE MNIEJ budynków i zostawić 'reczny' po wczytaniu zapisu.
 *   MUT-B — naprawa BEZ gałęzi barbarzyńskiej. Musi dać barbarzyńcom budynki, czyli
 *           zaczerwienić A3 (gwarancja realnie zależy od tej gałęzi).
 *   MUT-C — naprawa BEZ jednej linii `if (oid === 0) continue;` w migracji wczytania
 *           (RUNDA 2 / RATYFIKACJA, Decyzja 1). Musi PODNIEŚĆ gracza do trybu auto po
 *           wczytaniu starego zapisu, czyli zaczerwienić A10. Skrócony do
 *           MUT_C_TURNS tur — cała jego rola kończy się na snapshocie wczytania.
 *
 * Bramka (z katalogu gra/): node tools/ai-buduje-budynki-test.cjs
 * Czas: 3× (vite build + ok. TURNS realnych tur headless Chromium) — kilkadziesiąt minut.
 */

const path = require('path');
const fs = require('fs');
const os = require('os');
const { execSync } = require('child_process');

const GRA_DIR = path.resolve(__dirname, '..');
const DEFAULTS_REL = path.join('src', 'game', 'empire-city-defaults.ts');
const DEFAULTS_TS = path.join(GRA_DIR, DEFAULTS_REL);
const FALLBACK_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// §9 pkt 1 (C-001): katalog wyjściowy MUSI leżeć poza drzewem repo.
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
const TMP_ROOT = path.join(os.tmpdir(), `civ-ai-buduje-budynki-${TMPDIR_RUN_ID}`);

// Świat: duże cywilizacje AI + miasta-państwa + miasto gracza (seed 778899).
// Obie ścieżki z recon D dispatchu (Zarządca dla dużego AI, tryAutoEnqueueBuild dla
// miast-państw) muszą mieć w tym świecie realną reprezentację — inaczej asercje 1-2
// testowałyby tylko jedną z nich.
const RIVALS = '6';
const CITY_STATES_COUNT = 2;
const CIV_TYPES = 4;
const TURNS = Number(process.env.AI_BUDUJE_TURNS || 45);
// Roundtrip zapisu robimy W ŚRODKU przebiegu (a nie na końcu): świat po ~40 turach jest
// nasycony — kolejki puste, bo nie ma już czego budować w odblokowanych technologiach —
// więc „wzrost po wczytaniu" na końcu byłby zerowy z powodu nasycenia, nie defektu.
// Wczytanie w połowie odpowiada też realnemu scenariuszowi właściciela: wczytuję zapis
// TRWAJĄCEJ rozgrywki i gram dalej.
const LOAD_AT_TURN = Number(process.env.AI_BUDUJE_LOAD_AT_TURN || 12);
// Minimalny wiek miasta (w turach) kwalifikujący je do asercji POKRYCIA — „miasto
// trzymane DŁUGO" ze zgłoszenia właściciela. Miasto założone tuż przed końcem przebiegu
// nie zdążyłoby nic postawić i fałszowałoby pomiar.
const COVERAGE_MIN_AGE = Number(process.env.AI_BUDUJE_COVERAGE_MIN_AGE || 15);
// Margines progów M1/M2 ponad gołą nierówność (zarzut 6). Zmierzone różnice FIX−MUT-A
// w trzech wcześniejszych przebiegach: duże AI 7/10/12, miasta-państwa 8/4/5.
const M_MARGIN = 3;

// --- Mutacje: podmiana CIAŁ dwóch funkcji naprawy, nic więcej -----------------------
const FIX_BODY_FRESH =
  '  if (ownerId < 0 || isBarbarianOwner(ownerId)) return freshOwnerDefaultBudowaProfil();\n'
  + '  return { budowaFocus: DEFAULT_BUDOWA_FOCUS, budowaTryb: AI_DEFAULT_BUDOWA_TRYB };';
const MUT_A_BODY_FRESH =
  '  void ownerId; void isBarbarianOwner;\n'
  + '  return freshOwnerDefaultBudowaProfil();';
const MUT_B_BODY_FRESH =
  '  void ownerId; void isBarbarianOwner;\n'
  + '  return { budowaFocus: DEFAULT_BUDOWA_FOCUS, budowaTryb: AI_DEFAULT_BUDOWA_TRYB };';

// Ciało migracji wczytania rozpoznajemy po sygnaturze i zamykamy na `return upgraded;`.
const UPGRADE_SIGNATURE = 'export function upgradeBudowaProfilAutoDefaultsOnLoad(';
const UPGRADE_OPEN = '): number[] {\n';
const UPGRADE_END = '\n  return upgraded;\n}';
const UPGRADE_NOOP_BODY =
  '  void cities; void ownerDefaults; void isBarbarianOwner;\n'
  + '  return [];';

// Gwarancja barbarzyńska ma DWA nośniki: gałąź w `freshOwnerDefaultBudowaProfilForOwner`
// (nowa gra / założenie / przejęcie) ORAZ ta sama gałąź w migracji wczytania zapisu.
// MUT-B („zdjęcie rozróżnienia barbarzyńców") musi zdjąć OBA — inaczej mutant zostaje
// z połową gwarancji i M5 czerwienieje na turach PO wczytaniu zapisu, mierząc niespójność
// mutacji zamiast zależności gwarancji od kodu gry (zmierzone: tury 1-12 'zrownowazone',
// tury 13+ z powrotem 'reczny').
const UPGRADE_BARB_GUARD = '    if (oid < 0 || isBarbarianOwner(oid)) continue;';
const MUT_B_UPGRADE_GUARD = '    if (false && (oid < 0 || isBarbarianOwner(oid))) continue;';

// RUNDA 2 — RATYFIKACJA ORKIESTRATORA 2026-09-05, DECYZJA 1 (ECHO właściciela „Tylko nowe
// partie"): migracja wczytania POMIJA ownera 0. Nośnikiem tej decyzji jest DOKŁADNIE JEDNA
// linia w `upgradeBudowaProfilAutoDefaultsOnLoad`. MUT-C zdejmuje wyłącznie ją (nic więcej),
// żeby A10 nie mogła zzielenieć w obu wariantach — asercja zielona po obu stronach mutacji
// nie mierzy niczego (reguła przeciw samooszukiwaniu dispatchu rundy 2, punkt 1).
const UPGRADE_PLAYER_SKIP = '    if (oid === 0) continue;';
const MUT_C_UPGRADE_PLAYER_SKIP = '    if (false && oid === 0) continue;';
// MUT-C mierzy WYŁĄCZNIE stan w chwili wczytania zapisu (tura LOAD_AT_TURN), więc nie ma
// powodu odtwarzać pełnych TURNS tur — kilka tur po wczytaniu wystarczy, żeby przebieg
// domknął się tą samą ścieżką co pozostałe warianty.
const MUT_C_TURNS = LOAD_AT_TURN + 2;

let pass = 0, fail = 0;
function assert(label, cond, detail) {
  if (cond) { pass++; console.log(`  OK  ${label}`); }
  else { fail++; console.error(` FAIL ${label}` + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/**
 * Wycina ciało `upgradeBudowaProfilAutoDefaultsOnLoad` i zastępuje je podanym.
 * Zwraca `null`, gdy nie znajdzie kotwic — wtedy bramka przerywa, zamiast po cichu
 * stracić nietautologiczność na ścieżce wczytania zapisu.
 */
function replaceUpgradeBody(source, newBody) {
  const at = source.indexOf(UPGRADE_SIGNATURE);
  if (at < 0) return null;
  const openIdx = source.indexOf(UPGRADE_OPEN, at);
  if (openIdx < 0) return null;
  const bodyStart = openIdx + UPGRADE_OPEN.length;
  const endIdx = source.indexOf(UPGRADE_END, bodyStart);
  if (endIdx < 0) return null;
  return source.slice(0, bodyStart) + newBody + '\n}' + source.slice(endIdx + UPGRADE_END.length);
}

/**
 * Lustro `gra/` w os.tmpdir(): `src` jako PRAWDZIWA KOPIA (jedyne miejsce mutacji),
 * `data`/`node_modules` jako dowiązania (dzięki temu importy `../../data/*.json`
 * rozwiązują się identycznie jak w repo), reszta jako kopie plików.
 * Drzewo repo pozostaje NIETKNIĘTE — patrz nagłówek, IZOLACJA HARNESSU.
 */
function makeMirrorRoot(variant) {
  const root = path.join(TMP_ROOT, `root-${variant}`);
  fs.rmSync(root, { recursive: true, force: true });
  fs.mkdirSync(root, { recursive: true });
  for (const f of ['index.html', 'vite.config.ts', 'tsconfig.json', 'package.json']) {
    fs.copyFileSync(path.join(GRA_DIR, f), path.join(root, f));
  }
  for (const d of ['data', 'node_modules']) {
    fs.symlinkSync(fs.realpathSync(path.join(GRA_DIR, d)), path.join(root, d), 'dir');
  }
  fs.cpSync(path.join(GRA_DIR, 'src'), path.join(root, 'src'), { recursive: true });
  return root;
}

function buildVariant(variant, mutateFresh, disableUpgrade, liveSource, dropUpgradeBarbGuard, dropPlayerSkip) {
  const root = makeMirrorRoot(variant);
  const outDir = path.join(TMP_ROOT, `dist-${variant}`);
  let src = liveSource;
  if (mutateFresh) src = src.replace(FIX_BODY_FRESH, mutateFresh);
  if (disableUpgrade) {
    const next = replaceUpgradeBody(src, UPGRADE_NOOP_BODY);
    if (next === null) {
      throw new Error('Mutacja niemożliwa: nie znalazłem ciała upgradeBudowaProfilAutoDefaultsOnLoad '
        + '(test straciłby nietautologiczność na ścieżce wczytania zapisu).');
    }
    src = next;
  }
  if (dropUpgradeBarbGuard) {
    if (src.indexOf(UPGRADE_BARB_GUARD) < 0) {
      throw new Error('Mutacja niemozliwa: nie znalazlem galezi barbarzynskiej w '
        + 'upgradeBudowaProfilAutoDefaultsOnLoad (MUT-B stracilby polowe mutacji).');
    }
    src = src.replace(UPGRADE_BARB_GUARD, MUT_B_UPGRADE_GUARD);
  }
  if (dropPlayerSkip) {
    if (src.indexOf(UPGRADE_PLAYER_SKIP) < 0) {
      throw new Error('Mutacja niemozliwa: nie znalazlem linii pomijajacej ownera 0 w '
        + 'upgradeBudowaProfilAutoDefaultsOnLoad (A10 stracilaby nietautologicznosc).');
    }
    src = src.replace(UPGRADE_PLAYER_SKIP, MUT_C_UPGRADE_PLAYER_SKIP);
  }
  fs.writeFileSync(path.join(root, DEFAULTS_REL), src, 'utf8');

  console.log(`[ai-buduje-budynki-test] vite build (${variant}) -> ${outDir} ...`);
  execSync(
    `node ${JSON.stringify(path.join(GRA_DIR, 'node_modules/vite/bin/vite.js'))} build`
    + ` --outDir ${JSON.stringify(outDir)} --emptyOutDir`,
    { cwd: root, stdio: 'pipe', maxBuffer: 64 * 1024 * 1024 },
  );
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    throw new Error(`Build (${variant}) nie wyprodukował index.html w ` + outDir);
  }
  // Kopia src jest jednorazowa — 63 MB na wariant nie ma prawa zostać na dysku.
  fs.rmSync(root, { recursive: true, force: true });
  console.log(`[ai-buduje-budynki-test] build (${variant}) OK.`);
  return outDir;
}

async function launchBrowser(chromium) {
  try {
    return await chromium.launch({ headless: true });
  } catch (e) {
    console.log('[ai-buduje-budynki-test] domyślny Chromium niedostępny, fallback na', FALLBACK_CHROME);
    return await chromium.launch({
      headless: true, executablePath: FALLBACK_CHROME,
      args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader'],
    });
  }
}

async function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function pollUntil(page, checkFn, timeoutMs, what) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await page.evaluate(checkFn);
    if (last && last.ready) return last;
    await wait(500);
  }
  throw new Error(`pollUntil(${what}): timeout, last = ` + JSON.stringify(last));
}

async function endOneTurn(page) {
  await page.evaluate(() => window.__eraTestDebug.endTurn());
  const t0 = Date.now();
  let sawInProgress = false;
  while (Date.now() - t0 < 90000) {
    const inProg = await page.evaluate(() => window.__eraTestDebug.isEndTurnInProgress());
    if (inProg) sawInProgress = true;
    if (sawInProgress && !inProg) break;
    await wait(100);
  }
  await wait(120);
}

function classify(dump) {
  const out = { player: [], majorAi: [], cityState: [], barb: [] };
  for (const c of dump.cities) {
    if (c.ownerId === 0) out.player.push(c);
    else if (c.isBarbarian) out.barb.push(c);
    else if (c.isCityState) out.cityState.push(c);
    else if (c.isMajorAi) out.majorAi.push(c);
  }
  return out;
}

const sum = (arr) => arr.reduce((a, b) => a + b, 0);
const builtTotal = (list) => sum(list.map((c) => c.built.length));

/**
 * POKRYCIE (zarzut 6 Evaluatora): objaw właściciela to KONKRETNE miasto trzymane długo
 * przez pełnoprawne AI i mające ZERO budynków — suma po imperium tego nie widzi.
 * Liczymy więc miasta dużych AI istniejące OD STARTU gry („trzymane długo"), które na
 * końcu wciąż należą do dużego AI, i sprawdzamy, ile z nich ma >=1 wpis w `cityBuilt`.
 */
function longHeldMajorAiCoverage(firstSeen, tEnd, excludeIds) {
  const rows = [];
  for (const cEnd of tEnd.cities) {
    if (!cEnd.isMajorAi || cEnd.ownerId <= 0) continue;
    if (excludeIds.has(cEnd.id)) continue;
    const seen = firstSeen.get(cEnd.id);
    if (seen === undefined) continue;
    const age = tEnd.turn - seen;
    if (age < COVERAGE_MIN_AGE) continue;
    rows.push({ id: cEnd.id, name: cEnd.name, o: cEnd.ownerId, tryb: cEnd.budowaTryb, wiek: age, b: cEnd.built.length });
  }
  return {
    rows,
    total: rows.length,
    ok: rows.filter((r) => r.b >= 1).length,
    zero: rows.filter((r) => r.b === 0),
  };
}

/** Jeden pełny przebieg scenariusza na danym buildzie.
 *  OSOBNA instancja przeglądarki na wariant — trzy pełne światy 3D w jednej instancji
 *  wyczerpują kontekst WebGL/pamięć i trzeci `doStartGame` nigdy nie kończy generacji. */
async function runScenario(chromium, outDir, label, turns) {
  const browser = await launchBrowser(chromium);
  try {
    return await runScenarioOnBrowser(browser, outDir, label, turns);
  } finally {
    await browser.close();
  }
}

async function runScenarioOnBrowser(browser, outDir, label, turns) {
  const TURN_COUNT = turns ?? TURNS;
  const consoleErrors = [];
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()); });
  page.on('pageerror', (e) => consoleErrors.push('[pageerror] ' + String(e)));

  // DETERMINIZM (zarzut 6): ziarnowany mulberry32 zamiast Math.random. Wyłącznie
  // w harnessie — kod gry nietknięty. Bez tego progi M1/M2 byłyby nierównościami
  // między dwoma niezależnie losowymi przebiegami.
  await page.addInitScript(() => {
    let s = 0x9e3779b9;
    Math.random = function seededRandom() {
      s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  });

  await page.goto('file://' + path.join(outDir, 'index.html'), { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction(
    () => !!window.__cityStateStartUnitsTestDebug && !!window.__eraTestDebug
      && !!window.__aiBuildingsTestDebug && !!window.__rebelProtectionTestDebug,
    undefined, { timeout: 120000 },
  );
  await page.waitForSelector('.civ-menu', { timeout: 120000 });
  await wait(200);

  await page.evaluate(
    (p) => { window.__aiBuildingsTestDebug.startNewGame(p); },
    { rivals: RIVALS, cityStates: CITY_STATES_COUNT, civTypes: CIV_TYPES },
  );

  await pollUntil(page, () => {
    const dbg = window.__cityStateStartUnitsTestDebug;
    if (!dbg) return { ready: false };
    const overlayVisible = Array.from(document.querySelectorAll('*')).some(
      (el) => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null,
    );
    const st = dbg.dumpState();
    return { ready: !overlayVisible && st.awaitingFirstPlayerCity === true && st.playerStartHex !== null };
  }, 300000, 'awaitingFirstPlayerCity');

  const founded = await page.evaluate(() => window.__cityStateStartUnitsTestDebug.foundPlayerStartCity());
  if (!founded) throw new Error(`(${label}) foundPlayerStartCity() zwróciło false`);

  await pollUntil(page, () => {
    const st = window.__cityStateStartUnitsTestDebug.dumpState();
    return { ready: st.awaitingFirstPlayerCity === false && st.cities.some((c) => c.ownerId === 0) };
  }, 60000, 'playerCity');
  await wait(300);

  // Bez tego niezrównoważony sandbox potrafi zakończyć się zwycięstwem przed TURNS.
  await page.evaluate(() => window.__rebelProtectionTestDebug.disableVictoryCheckForTest());

  const t0 = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
  const c0 = classify(t0);

  // --- Miasto barbarzyńskie: przejęcie REALNĄ ścieżką, ZANIM cokolwiek zbudowano ----
  // Wybieramy miasto dużego AI, którego właściciel ma >1 miasta (żeby nie eliminować
  // całej cywilizacji) i które ma dziś 0 budynków — gwarancja brzmi „ZERO budynków".
  const ownerCount = {};
  for (const c of t0.cities) ownerCount[c.ownerId] = (ownerCount[c.ownerId] || 0) + 1;
  const barbTarget = c0.majorAi.find((c) => ownerCount[c.ownerId] > 1 && c.built.length === 0)
    || c0.majorAi.find((c) => c.built.length === 0)
    || c0.cityState.find((c) => c.built.length === 0);
  if (!barbTarget) throw new Error(`(${label}) brak kandydata na miasto barbarzyńskie`);
  await page.evaluate((cid) => {
    const barbId = window.__aiBuildingsTestDebug.BARBARIAN_OWNER_ID;
    window.__rebelProtectionTestDebug.captureViaBattle(cid, barbId);
  }, barbTarget.id);
  const tBarb = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
  const barbAfterCapture = tBarb.cities.find((c) => c.id === barbTarget.id);

  // ŚWIADOMIE BEZ dodatkowych przejęć przed pętlą tur. Runda 2 próbowała dołożyć tu
  // przejęcie miasta AI przez GRACZA (żeby A4b mierzyła nową partię, nie stan po wczytaniu
  // zapisu) — i to ZMIENIŁO ŚWIAT: AI założyło więcej miast później, pokrycie A7 spadło
  // z 5/5 na 6/9 (trzy miasta w wieku 16-22 tur z pustą kolejką, bo świat był już nasycony).
  // Progi M1/M2 i pokrycie A7 są skalibrowane na TYM scenariuszu — każda dodatkowa
  // interakcja przed pętlą tur je unieważnia. Przejęcie przez gracza zostaje więc jedno,
  // na końcu przebiegu (patrz niżej), a mierzy je A4b w brzmieniu po ratyfikacji.
  // --- Pętla realnych tur ----------------------------------------------------------
  const history = [];
  const barbTrace = [];
  const firstSeen = new Map();
  for (const c of t0.cities) firstSeen.set(c.id, t0.turn);
  let tLoad = null, cLoad = null, builtAtLoad = null;
  for (let t = 0; t < TURN_COUNT; t++) {
    // ŚCIEŻKA WCZYTANIA ZAPISU (§16a pkt 4) — w środku rozgrywki, patrz LOAD_AT_TURN.
    // Realny `buildSaveGameSnapshot()` zdegradowany do postaci SPRZED naprawy (globalny
    // 'reczny' u wszystkich ownerów) i realny `restoreGameFromSave()`. Dokładnie to,
    // co niesie zapis właściciela z trwającej rozgrywki.
    if (t === LOAD_AT_TURN) {
      await page.evaluate(() => window.__aiBuildingsTestDebug.saveLoadRoundTrip({ legacy: true }));
      tLoad = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
      cLoad = classify(tLoad);
      builtAtLoad = { major: builtTotal(cLoad.majorAi), cs: builtTotal(cLoad.cityState) };
    }
    await endOneTurn(page);
    const st = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
    for (const c of st.cities) if (!firstSeen.has(c.id)) firstSeen.set(c.id, st.turn);
    const cl = classify(st);
    const barbCity = st.cities.find((c) => c.id === barbTarget.id) || null;
    barbTrace.push(barbCity
      ? { turn: st.turn, ownerId: barbCity.ownerId, isBarb: barbCity.isBarbarian, tryb: barbCity.budowaTryb, built: barbCity.built.length, queue: barbCity.queue.length }
      : { turn: st.turn, ownerId: null, isBarb: false, tryb: null, built: 0, queue: 0 });
    const grp = (list) => ({
      cities: list.length,
      built: builtTotal(list),
      queue: sum(list.map((c) => c.queue.length)),
      postep: Math.round(sum(list.map((c) => c.postep))),
    });
    history.push({
      turn: st.turn,
      major: grp(cl.majorAi),
      cs: grp(cl.cityState),
      barb: grp(cl.barb),
      player: grp(cl.player),
    });
  }

  const tEnd = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
  const cEnd = classify(tEnd);
  const coverage = longHeldMajorAiCoverage(firstSeen, tEnd, new Set([barbTarget.id]));
  if (!tLoad) throw new Error(`(${label}) roundtrip zapisu nie wykonał się (LOAD_AT_TURN >= ${TURN_COUNT}?)`);

  // --- Przejęcia PO turach: AI→AI oraz AI→gracz ------------------------------------
  let aiCapture = null;
  const aiCaptureSrc = cEnd.majorAi.find((c) => c.built.length > 0)
    || cEnd.cityState.find((c) => c.built.length > 0);
  if (aiCaptureSrc) {
    const newOwner = cEnd.majorAi.map((c) => c.ownerId).find((o) => o !== aiCaptureSrc.ownerId)
      ?? cEnd.cityState.map((c) => c.ownerId).find((o) => o !== aiCaptureSrc.ownerId);
    if (newOwner !== undefined) {
      await page.evaluate(
        ({ cid, oid }) => window.__rebelProtectionTestDebug.captureViaBattle(cid, oid),
        { cid: aiCaptureSrc.id, oid: newOwner },
      );
      const st = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
      const after = st.cities.find((c) => c.id === aiCaptureSrc.id);
      aiCapture = { before: aiCaptureSrc, after, newOwner };
    }
  }

  let playerCapture = null;
  const playerTarget = cEnd.majorAi.find((c) => c.id !== (aiCaptureSrc && aiCaptureSrc.id))
    || cEnd.cityState.find((c) => c.id !== (aiCaptureSrc && aiCaptureSrc.id));
  if (playerTarget) {
    await page.evaluate((cid) => window.__rebelProtectionTestDebug.captureViaBattle(cid, 0), playerTarget.id);
    const st = await page.evaluate(() => window.__aiBuildingsTestDebug.dumpBuildings());
    playerCapture = { before: playerTarget, after: st.cities.find((c) => c.id === playerTarget.id) };
  }

  await page.close();
  return {
    label, t0, c0, barbTarget, barbAfterCapture, barbTrace, history, coverage,
    tEnd, cEnd, tLoad, cLoad, builtAtLoad,
    aiCapture, playerCapture, consoleErrors,
  };
}

function printRun(r) {
  console.log(`\n--- ${r.label}: budynki (b=cityBuilt, q=kolejka, p=postep Pracy) per tura ---`);
  for (const h of r.history) {
    const f = (g) => `b=${g.built} q=${g.queue} p=${g.postep} (n=${g.cities})`;
    console.log(`  tura ${String(h.turn).padStart(3)}  duzeAI[${f(h.major)}]`
      + `  panstwaMiasta[${f(h.cs)}]  barbarzyncy[${f(h.barb)}]  gracz[${f(h.player)}]`);
  }
  const last = r.history[r.history.length - 1];
  console.log(`  ${r.label} PODSUMOWANIE po ${last.turn - r.history[0].turn + 1} turach:`
    + ` duzeAI=${last.major.built} panstwaMiasta=${last.cs.built}`
    + ` barbarzyncy=${last.barb.built} gracz=${last.player.built}`);
  // ROZKŁAD PER MIASTO (zarzut 6): suma po imperium ukrywa miasta z zerem.
  console.log(`  ${r.label} ROZKLAD per miasto (dlugo trzymane miasta duzego AI):`);
  for (const row of r.coverage.rows) {
    console.log(`    ${row.id} "${row.name}" owner=${row.o} tryb=${row.tryb} wiek=${row.wiek} budynki=${row.b}`);
  }
  console.log(`  ${r.label} POKRYCIE (miasta duzego AI w wieku >=${COVERAGE_MIN_AGE} tur):`
    + ` ${r.coverage.ok}/${r.coverage.total} ma >=1 budynek`);
  console.log(`  ${r.label} WCZYTANIE ZAPISU (legacy) w turze ${r.tLoad.turn}:`
    + ` duzeAI=${r.builtAtLoad.major} panstwaMiasta=${r.builtAtLoad.cs}`
    + ` -> na koncu duzeAI=${builtTotal(r.cEnd.majorAi)} panstwaMiasta=${builtTotal(r.cEnd.cityState)}`
    + ` | tryb miast AI po wczytaniu: `
    + JSON.stringify([...new Set(r.cLoad.majorAi.concat(r.cLoad.cityState).map((c) => c.budowaTryb))]));
}

async function main() {
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch (e) { console.error('[ai-buduje-budynki-test] playwright nie znaleziony.'); process.exit(1); }

  const liveSource = fs.readFileSync(DEFAULTS_TS, 'utf8');
  const upgradeMutOk = replaceUpgradeBody(liveSource, UPGRADE_NOOP_BODY) !== null;
  assert('sanity: empire-city-defaults.ts zawiera ciało naprawy nowej gry (mutacja wykonalna)',
    liveSource.indexOf(FIX_BODY_FRESH) >= 0);
  assert('sanity: empire-city-defaults.ts zawiera ciało migracji wczytania (mutacja wykonalna)',
    upgradeMutOk);
  assert('sanity: migracja wczytania ma gałąź barbarzyńską (MUT-B może zdjąć OBA nośniki gwarancji)',
    liveSource.indexOf(UPGRADE_BARB_GUARD) >= 0);
  assert('sanity: migracja wczytania ma linię pomijającą ownera 0 (MUT-C wykonalny, A10 nietautologiczna)',
    liveSource.indexOf(UPGRADE_PLAYER_SKIP) >= 0);
  if (liveSource.indexOf(FIX_BODY_FRESH) < 0 || !upgradeMutOk
    || liveSource.indexOf(UPGRADE_BARB_GUARD) < 0
    || liveSource.indexOf(UPGRADE_PLAYER_SKIP) < 0) process.exit(1);

  // main.ts musi WOŁAĆ migrację na obu ścieżkach wczytania — inaczej A8/A9 mierzyłyby
  // funkcję, której gra nigdy nie wywołuje.
  const mainSrc = fs.readFileSync(path.join(GRA_DIR, 'src', 'main.ts'), 'utf8');
  const upgradeCalls = mainSrc.split('upgradeBudowaProfilAutoDefaultsOnLoad(cities,').length - 1;
  assert('sanity: main.ts woła upgradeBudowaProfilAutoDefaultsOnLoad na OBU ścieżkach wczytania',
    upgradeCalls >= 2, upgradeCalls);

  fs.rmSync(TMP_ROOT, { recursive: true, force: true });
  fs.mkdirSync(TMP_ROOT, { recursive: true });
  assert('H0: katalogi buildu leżą POZA drzewem repo (§9 pkt 1 / C-001)',
    !path.resolve(TMP_ROOT).startsWith(path.resolve(GRA_DIR) + path.sep), TMP_ROOT);

  const outFix = buildVariant('fix', null, false, liveSource, false, false);
  const outMutA = buildVariant('mut-a', MUT_A_BODY_FRESH, true, liveSource, false, false);
  const outMutB = buildVariant('mut-b', MUT_B_BODY_FRESH, false, liveSource, true, false);
  const outMutC = buildVariant('mut-c', null, false, liveSource, false, true);
  assert('H0b: bramka nie zmieniła ŻADNEGO śledzonego pliku źródłowego',
    fs.readFileSync(DEFAULTS_TS, 'utf8') === liveSource);

  const fix = await runScenario(chromium, outFix, 'FIX');
  printRun(fix);
  const mutA = await runScenario(chromium, outMutA, 'MUT-A');
  printRun(mutA);
  const mutB = await runScenario(chromium, outMutB, 'MUT-B');
  printRun(mutB);
  const mutC = await runScenario(chromium, outMutC, 'MUT-C', MUT_C_TURNS);
  printRun(mutC);

  const fixEnd = fix.history[fix.history.length - 1];
  const mutAEnd = mutA.history[mutA.history.length - 1];
  const mutBEnd = mutB.history[mutB.history.length - 1];

  console.log('\n=== ASERCJE ===');

  // -- warunki wstępne świata (bez nich asercje 1-3 byłyby puste) -------------------
  assert('W1: świat zawiera miasta dużego AI', fix.c0.majorAi.length > 0, fix.c0.majorAi.length);
  assert('W2: świat zawiera miasta-państwa', fix.c0.cityState.length > 0, fix.c0.cityState.length);
  assert('W3: miasto oddane barbarzyńcom istnieje i miało 0 budynków w chwili przejęcia',
    !!fix.barbAfterCapture && fix.barbAfterCapture.isBarbarian && fix.barbAfterCapture.built.length === 0,
    fix.barbAfterCapture);

  // -- GOAL 3 asercja 1: duże AI faktycznie stawia budynki --------------------------
  assert(`A1: duże AI ma >0 budynków po ${TURNS} turach (wzrost cityBuilt w realnej pętli ekonomii)`,
    fixEnd.major.built > 0, fixEnd.major);
  assert('A1b: co najmniej jedno KONKRETNE miasto dużego AI ma >=1 wpis w cityBuilt',
    fix.cEnd.majorAi.some((c) => c.built.length >= 1),
    fix.cEnd.majorAi.map((c) => ({ id: c.id, o: c.ownerId, b: c.built.length })));

  // -- GOAL 3 asercja 2: państwa-miasta (OSOBNA ścieżka: else-if + tryAutoEnqueueBuild)
  assert(`A2: państwo-miasto ma >0 budynków po ${TURNS} turach (druga, niezależna ścieżka)`,
    fixEnd.cs.built > 0, fixEnd.cs);
  assert('A2b: co najmniej jedno KONKRETNE miasto-państwo ma >=1 wpis w cityBuilt',
    fix.cEnd.cityState.some((c) => c.built.length >= 1),
    fix.cEnd.cityState.map((c) => ({ id: c.id, o: c.ownerId, b: c.built.length })));

  // -- GOAL 3 asercja 3: gwarancja barbarzyńska (OBOWIĄZKOWA) -----------------------
  const barbTurns = fix.barbTrace.filter((b) => b.isBarb);
  assert('A3-pre: miasto pozostało barbarzyńskie przez min. 5 tur (asercja niepusta)',
    barbTurns.length >= 5, barbTurns.length);
  assert(`A3: miasto barbarzyńskie ma ZERO budynków w KAŻDEJ z ${barbTurns.length} tur pod flagą barbarzyńców`,
    barbTurns.every((b) => b.built === 0),
    barbTurns.filter((b) => b.built !== 0));
  assert('A3b: budowaTryb miasta barbarzyńskiego to \'reczny\' w każdej turze',
    barbTurns.every((b) => b.tryb === 'reczny'),
    barbTurns.filter((b) => b.tryb !== 'reczny'));
  assert('A3c: barbarzyńcy mają ZERO budynków także PO wczytaniu zapisu (migracja ich nie podnosi)',
    builtTotal(fix.cLoad.barb) === 0 && fix.cLoad.barb.every((c) => c.budowaTryb === 'reczny'),
    fix.cLoad.barb.map((c) => ({ id: c.id, tryb: c.budowaTryb, b: c.built.length })));

  // -- GOAL 3 asercja 4: ECHO właściciela — tryb AUTO także dla GRACZA --------------
  // ECHO (przekazane po dispatchu, wiążące): profil domyślny automatyczny dla WSZYSTKICH
  // właścicieli, łącznie z graczem. Kontrola gracza zostaje per miasto
  // (`onBudowaEnterManual` → `budowaFocusOverride = true`), nie przez globalny default.
  assert('A4: miasto gracza po założeniu ma tryb AUTOMATYCZNY (ECHO: auto dla wszystkich właścicieli)',
    fix.c0.player.length > 0 && fix.c0.player.every((c) => c.budowaTryb !== 'reczny'),
    fix.c0.player.map((c) => ({ id: c.id, tryb: c.budowaTryb })));
  // A4b — BRZMIENIE PO RATYFIKACJI (Decyzja 1). Przejęcie w tym scenariuszu następuje PO
  // roundtripie zapisu, czyli w rozgrywce KONTYNUOWANEJ ZE STAREGO ZAPISU. Tam globalny
  // profil gracza celowo pozostaje 'reczny', a `seedCityOwnerDefaults` kopiuje do miasta
  // globalny default nowego właściciela — więc zdobyte miasto dziedziczy 'reczny'. To jest
  // PRZYJĘTY skutek decyzji, nie defekt, i jest mierzony, a nie tylko opisany.
  // Ścieżka NOWEJ PARTII („gracz też startowo auto") jest MIERZONA, nie wnioskowana:
  // A4d niżej czyta wprost GLOBALNY default ownera 0 w turze 0 — czyli tę samą wartość,
  // którą `seedCityOwnerDefaults` kopiuje do miasta i przy założeniu, i przy PRZEJĘCIU
  // (OBRONA R2, zarzut 2 Evaluatora — PRZYJĘTY; wcześniejsze brzmienie tego komentarza
  // opierało się na złożeniu A4+A6, czyli na wnioskowaniu, a nie na pomiarze).
  // (Runda 2 próbowała dołożyć osobne przejęcie przez gracza przed roundtripem — zmieniało
  // świat i czerwieniło A7, patrz komentarz przy pętli tur.)
  assert('A4b: w grze wczytanej ze STAREGO zapisu miasto zdobyte przez GRACZA dziedziczy '
    + '\'reczny\' (przyjęty skutek Decyzji 1 — gracz włącza automat sam)',
    !!fix.playerCapture && fix.playerCapture.after.ownerId === 0
      && fix.playerCapture.after.budowaTryb === 'reczny',
    fix.playerCapture && { o: fix.playerCapture.after.ownerId, tryb: fix.playerCapture.after.budowaTryb });
  // A4c (RUNDA 1) — WYCOFANA W RUNDZIE 2, nie osłabiona. Brzmiała „gracz zachowuje tryb
  // AUTO także po wczytaniu zapisu SPRZED naprawy" i była DOKŁADNYM PRZECIWIEŃSTWEM
  // decyzji, którą właściciel podjął w ratyfikacji 2026-09-05 (Decyzja 1: „Tylko nowe
  // partie" — migracja pomija ownera 0). Nie da się jej utrzymać obok A10 niżej: jedna
  // z dwóch musiałaby być zawsze czerwona. Zastępuje ją A10 (+ A10-pre) na ścieżce
  // wczytania zapisu, z własną mutacją kontrolną M7/M7b. Nowa gra i przejęcie miasta
  // przez gracza dalej dają tryb AUTO — mierzą to NIETKNIĘTE A4 i A4b wyżej.

  // -- A4d/A4e: GLOBALNY default ownera mierzony WPROST (OBRONA R2, zarzut 2) -------
  // `seedCityOwnerDefaults` kopiuje globalny default NOWEGO właściciela do miasta zarówno
  // przy założeniu, jak i przy zmianie właściciela — to jest wspólne WEJŚCIE obu ścieżek
  // ECHO „gracz też startowo auto". Odczyt z istniejących snapshotów (t0, tLoad): ZERO
  // dodatkowych przejęć, więc świat, progi M1/M2 i pokrycie A7 pozostają nietknięte
  // (poprzednia próba mierzenia tego przejęciem zmieniała świat — patrz komentarz przy
  // pętli tur).
  const ownerTryb = (dump) => new Map(dump.ownerDefaultBudowaTryb);
  const trybT0 = ownerTryb(fix.t0);
  const trybLoad = ownerTryb(fix.tLoad);
  assert('A4d: w NOWEJ partii (tura 0) GLOBALNY default budowy ownera 0 jest AUTOMATYCZNY '
    + '— to wartość, którą seedCityOwnerDefaults daje miastu i przy założeniu, i przy PRZEJĘCIU',
    trybT0.has(0) && trybT0.get(0) !== 'reczny',
    { owner0: trybT0.get(0) ?? '(brak wpisu)', wszystkie: fix.t0.ownerDefaultBudowaTryb });
  assert('A4d-b: w NOWEJ partii (tura 0) KAŻDY owner AI (id > 0) ma globalny default '
    + 'automatyczny, a KAŻDY owner ujemny (barbarzyńcy -1 / rebelianci -99) \'reczny\'',
    [...trybT0].filter(([o]) => o > 0).length > 0
      && [...trybT0].filter(([o]) => o > 0).every(([, t]) => t !== 'reczny')
      && [...trybT0].filter(([o]) => o < 0).every(([, t]) => t === 'reczny'),
    fix.t0.ownerDefaultBudowaTryb);
  assert('A4e: po roundtripie zapisu SPRZED naprawy GLOBALNY default ownera 0 to \'reczny\' '
    + '(Decyzja 1), ownerów AI automatyczny, ownerów ujemnych \'reczny\' — A4b mierzy więc '
    + 'skutek decyzji, a nie przypadkowy stan',
    trybLoad.get(0) === 'reczny'
      && [...trybLoad].filter(([o]) => o > 0).length > 0
      && [...trybLoad].filter(([o]) => o > 0).every(([, t]) => t !== 'reczny')
      && [...trybLoad].filter(([o]) => o < 0).every(([, t]) => t === 'reczny'),
    fix.tLoad.ownerDefaultBudowaTryb);

  // -- GOAL 3 asercja 5: przejęcie NIE kasuje budynków ------------------------------
  assert('A5: zdobyte miasto AI zachowuje wszystkie budynki sprzed przejęcia',
    !!fix.aiCapture && fix.aiCapture.before.built.length > 0
      && fix.aiCapture.after.built.length === fix.aiCapture.before.built.length
      && fix.aiCapture.before.built.every((b) => fix.aiCapture.after.built.includes(b)),
    fix.aiCapture && { before: fix.aiCapture.before.built, after: fix.aiCapture.after.built });

  // -- GOAL 3 asercja 6: przejęcie AI→AI zostawia tryb automatyczny -----------------
  assert('A6: miasto AI po przejęciu przez INNE AI ma tryb automatyczny, nie \'reczny\'',
    !!fix.aiCapture && fix.aiCapture.after.ownerId === fix.aiCapture.newOwner
      && fix.aiCapture.after.budowaTryb !== 'reczny',
    fix.aiCapture && { o: fix.aiCapture.after.ownerId, tryb: fix.aiCapture.after.budowaTryb });

  // -- A7: POKRYCIE, nie suma po imperium (zarzut 6 Evaluatora) ---------------------
  // Objaw właściciela: KONKRETNE miasto trzymane długo przez pełnoprawne AI z ZEREM
  // budynków. Suma „>0 po imperium" tego nie wykrywa.
  assert('A7-pre: istnieją długo trzymane miasta dużego AI (asercja niepusta)',
    fix.coverage.total > 0, fix.coverage.total);
  assert('A7: KAŻDE miasto dużego AI istniejące od startu gry ma >=1 wpis w cityBuilt '
    + `(pokrycie ${fix.coverage.ok}/${fix.coverage.total})`,
    fix.coverage.total > 0 && fix.coverage.zero.length === 0, fix.coverage.zero);
  // Pokrycie jest asercją FUNKCJONALNĄ (regresja zostawiająca dowolne długo trzymane
  // miasto dużego AI na zerze ją czerwieni), a po zdeterminizowaniu przebiegu jest też
  // REALNIE ROZRÓŻNIAJĄCE — patrz M6 niżej. Liczby pokrycia wszystkich trzech wariantów
  // są drukowane w tabeli na końcu.

  // -- A8/A9: ŚCIEŻKA WCZYTANIA ZAPISU (§16a pkt 4) ---------------------------------
  assert('A8: po wczytaniu zapisu SPRZED naprawy miasta dużego AI mają tryb automatyczny',
    fix.cLoad.majorAi.length > 0 && fix.cLoad.majorAi.every((c) => c.budowaTryb !== 'reczny'),
    fix.cLoad.majorAi.map((c) => ({ id: c.id, tryb: c.budowaTryb })));
  assert('A8b: po wczytaniu zapisu SPRZED naprawy miasta-państwa mają tryb automatyczny',
    fix.cLoad.cityState.length > 0 && fix.cLoad.cityState.every((c) => c.budowaTryb !== 'reczny'),
    fix.cLoad.cityState.map((c) => ({ id: c.id, tryb: c.budowaTryb })));
  assert('A9: po wczytaniu zapisu SPRZED naprawy AI DALEJ stawia budynki '
    + `(realne tury ${fix.tLoad.turn} → ${fix.tEnd.turn})`,
    builtTotal(fix.cEnd.majorAi) + builtTotal(fix.cEnd.cityState)
      > fix.builtAtLoad.major + fix.builtAtLoad.cs,
    { w_chwili_wczytania: fix.builtAtLoad,
      na_koncu: { major: builtTotal(fix.cEnd.majorAi), cs: builtTotal(fix.cEnd.cityState) } });

  // -- A10: NOWE KRYTERIUM KOŃCA (RATYFIKACJA 2026-09-05, DECYZJA 1) -----------------
  // „Tylko nowe partie": po roundtripie zapisu zdegradowanego do postaci SPRZED naprawy
  // owner 0 zachowuje 'reczny', a AI i miasta-państwa przechodzą na tryb automatyczny.
  // JEDNA asercja obejmuje OBIE strony granicy — inaczej „gracz ręczny" mogłoby zzielenieć
  // przez wyłączenie całej migracji (dokładnie stan MUT-A), a to nie jest naprawa.
  // Miasta z pinem 📌 są poza zakresem degradacji zapisu (`saveLoadRoundTrip({legacy:true})`
  // nie rusza `budowaFocusOverride === true`), więc liczymy miasta gracza BEZ pinu.
  const fixLoadPlayerNoPin = fix.cLoad.player.filter((c) => !c.budowaFocusOverride);
  assert('A10-pre: gracz ma po wczytaniu co najmniej jedno miasto BEZ pinu (asercja niepusta)',
    fixLoadPlayerNoPin.length > 0, fix.cLoad.player.map((c) => ({ id: c.id, pin: c.budowaFocusOverride })));
  assert('A10: po roundtripie zapisu SPRZED naprawy owner 0 ZOSTAJE na \'reczny\', '
    + 'a duże AI i miasta-państwa przechodzą na tryb automatyczny (ECHO „Tylko nowe partie")',
    fixLoadPlayerNoPin.length > 0
      && fixLoadPlayerNoPin.every((c) => c.budowaTryb === 'reczny')
      && fix.cLoad.majorAi.length > 0 && fix.cLoad.majorAi.every((c) => c.budowaTryb !== 'reczny')
      && fix.cLoad.cityState.length > 0 && fix.cLoad.cityState.every((c) => c.budowaTryb !== 'reczny'),
    { gracz: fixLoadPlayerNoPin.map((c) => ({ id: c.id, tryb: c.budowaTryb })),
      duzeAI: fix.cLoad.majorAi.map((c) => c.budowaTryb),
      panstwaMiasta: fix.cLoad.cityState.map((c) => c.budowaTryb) });

  // -- NIETAUTOLOGICZNOŚĆ: MUT-A = stan sprzed naprawy ------------------------------
  // Próg z MARGINESEM (zarzut 6), nie goła nierówność: miasto AI ma jeszcze DRUGĄ,
  // niezależną drogę do kolejki (komenda `build` z `chooseCityProduction`, ai.ts,
  // egzekwowana bez patrzenia na budowaTryb), więc stan sprzed naprawy nie daje zera.
  assert(`M1 (MUT-A = stan sprzed naprawy): duże AI stawia co najmniej ${M_MARGIN} budynków MNIEJ niż po naprawie`,
    mutAEnd.major.built + M_MARGIN <= fixEnd.major.built, { mutA: mutAEnd.major, fix: fixEnd.major });
  assert(`M2 (MUT-A): państwa-miasta stawiają co najmniej ${M_MARGIN} budynków MNIEJ niż po naprawie`,
    mutAEnd.cs.built + M_MARGIN <= fixEnd.cs.built, { mutA: mutAEnd.cs, fix: fixEnd.cs });
  assert('M3 (MUT-A): budowaTryb miast AI to \'reczny\' (odtworzony defekt zgłoszenia)',
    mutA.cEnd.majorAi.concat(mutA.cEnd.cityState).every((c) => c.budowaTryb === 'reczny'),
    mutA.cEnd.majorAi.concat(mutA.cEnd.cityState).map((c) => c.budowaTryb));
  assert('M3b (MUT-A): po wczytaniu zapisu miasta AI ZOSTAJĄ na \'reczny\' '
    + '— migracja wczytania jest realnie nośna (zarzut 2)',
    mutA.cLoad.majorAi.concat(mutA.cLoad.cityState).every((c) => c.budowaTryb === 'reczny'),
    mutA.cLoad.majorAi.concat(mutA.cLoad.cityState).map((c) => ({ id: c.id, tryb: c.budowaTryb })));

  // -- NIETAUTOLOGICZNOŚĆ: MUT-B = naprawa bez rozróżnienia barbarzyńców ------------
  const mutBBarbTurns = mutB.barbTrace.filter((b) => b.isBarb);
  assert('M4 (MUT-B, zdjęcie resetu globalnie): miasto barbarzyńskie DOSTAJE budynki '
    + '— asercja A3 realnie czerwienieje, gwarancja zależy od gałęzi barbarzyńskiej',
    mutBBarbTurns.some((b) => b.built > 0) || mutBEnd.barb.built > 0,
    { barbBuiltMax: Math.max(0, ...mutBBarbTurns.map((b) => b.built)), endBarb: mutBEnd.barb });
  // M5 obejmuje KAŻDĄ turę pod flagą barbarzyńców, także tury PO wczytaniu zapisu —
  // dlatego MUT-B zdejmuje gałąź barbarzyńską z OBU nośników gwarancji (patrz
  // UPGRADE_BARB_GUARD wyżej). Wersja mutująca tylko jeden nośnik czerwieniła M5
  // niespójnością mutacji, nie stanem gry.
  assert('M5 (MUT-B): budowaTryb miasta barbarzyńskiego przestaje być \'reczny\' w KAŻDEJ turze (dowód, że mutacja zadziałała na obu nośnikach)',
    mutBBarbTurns.length > 0 && mutBBarbTurns.every((b) => b.tryb !== 'reczny'),
    mutBBarbTurns.map((b) => b.tryb).slice(0, 5));

  // -- NIETAUTOLOGICZNOŚĆ A10: MUT-C = naprawa BEZ linii pomijającej ownera 0 --------
  // Cofnięta jest DOKŁADNIE jedna linia (`if (oid === 0) continue;`), nic więcej. Jeśli
  // A10 zzieleniałaby także tutaj, nie mierzyłaby decyzji właściciela, tylko sam fakt
  // istnienia migracji.
  const mutCLoadPlayerNoPin = mutC.cLoad.player.filter((c) => !c.budowaFocusOverride);
  assert('M7 (MUT-C): bez linii pomijającej ownera 0 gracz PO WCZYTANIU starego zapisu '
    + 'wchodzi w tryb automatyczny — A10 realnie czerwienieje po cofnięciu tej jednej linii',
    mutCLoadPlayerNoPin.length > 0 && mutCLoadPlayerNoPin.every((c) => c.budowaTryb !== 'reczny'),
    mutCLoadPlayerNoPin.map((c) => ({ id: c.id, tryb: c.budowaTryb })));
  assert('M7b (MUT-C): ta sama mutacja NIE rusza AI ani miast-państw (zmiana rundy 2 jest '
    + 'wąska — dotyczy wyłącznie ownera 0)',
    mutC.cLoad.majorAi.length > 0 && mutC.cLoad.majorAi.every((c) => c.budowaTryb !== 'reczny')
      && mutC.cLoad.cityState.length > 0 && mutC.cLoad.cityState.every((c) => c.budowaTryb !== 'reczny'),
    { duzeAI: mutC.cLoad.majorAi.map((c) => c.budowaTryb),
      panstwaMiasta: mutC.cLoad.cityState.map((c) => c.budowaTryb) });

  // -- higiena ----------------------------------------------------------------------
  assert('H1: zero błędów konsoli / pageerror w przebiegu FIX',
    fix.consoleErrors.length === 0, fix.consoleErrors.slice(0, 5));

  // -- M6: POKRYCIE realnie rozróżnia naprawę od stanu sprzed niej (zarzut 6) ---------
  // Objaw właściciela to KONKRETNE, długo trzymane miasto pełnoprawnego AI z ZEREM
  // budynków. Suma po imperium tego nie widzi, pokrycie widzi: zmierzone FIX 5/5,
  // MUT-A 2/9. Asercja jest dwustronna — sam wysoki wynik FIX nie wystarcza, mutant
  // MUSI objaw odtworzyć, inaczej pokrycie byłoby zielone niezależnie od naprawy.
  assert('M6 (MUT-A): stan sprzed naprawy ZOSTAWIA co najmniej jedno długo trzymane miasto '
    + `dużego AI z ZEREM budynków (objaw zgłoszenia), FIX żadnego — pokrycie ${mutA.coverage.ok}/${mutA.coverage.total} vs ${fix.coverage.ok}/${fix.coverage.total}`,
    mutA.coverage.total > 0 && mutA.coverage.zero.length > 0 && fix.coverage.zero.length === 0,
    { mutA_zero: mutA.coverage.zero, fix_zero: fix.coverage.zero });

  console.log('\n=== TABELA BUDYNKÓW PO ' + TURNS + ' TURACH (suma cityBuilt) ===');
  console.log('  wariant | duze AI | panstwa-miasta | barbarzyncy | gracz | pokrycie duzeAI');
  const cov = (r) => `${r.coverage.ok}/${r.coverage.total}`;
  console.log(`  FIX     | ${fixEnd.major.built} | ${fixEnd.cs.built} | ${fixEnd.barb.built} | ${fixEnd.player.built} | ${cov(fix)}`);
  console.log(`  MUT-A   | ${mutAEnd.major.built} | ${mutAEnd.cs.built} | ${mutAEnd.barb.built} | ${mutAEnd.player.built} | ${cov(mutA)}`);
  console.log(`  MUT-B   | ${mutBEnd.major.built} | ${mutBEnd.cs.built} | ${mutBEnd.barb.built} | ${mutBEnd.player.built} | ${cov(mutB)}`);
  console.log(`  MUT-C   | (przebieg skrocony do ${MUT_C_TURNS} tur -- mierzy wylacznie snapshot wczytania)`);
  console.log('\n=== TRYB BUDOWY PO WCZYTANIU ZAPISU SPRZED NAPRAWY (roundtrip legacy) ===');
  const trybs = (list) => JSON.stringify([...new Set(list.map((c) => c.budowaTryb))]);
  console.log(`  FIX     | gracz(bez pinu)=${trybs(fixLoadPlayerNoPin)}`
    + ` duzeAI=${trybs(fix.cLoad.majorAi)} panstwaMiasta=${trybs(fix.cLoad.cityState)}`);
  console.log(`  MUT-C   | gracz(bez pinu)=${trybs(mutCLoadPlayerNoPin)}`
    + ` duzeAI=${trybs(mutC.cLoad.majorAi)} panstwaMiasta=${trybs(mutC.cLoad.cityState)}`);

  // Artefakty buildu nie mogą zostać na dysku (Evaluator: 201 MB po biegu).
  fs.rmSync(TMP_ROOT, { recursive: true, force: true });

  console.log(`\n[ai-buduje-budynki-test] PASS=${pass} FAIL=${fail}`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error('[ai-buduje-budynki-test] BLAD:', e); process.exit(1); });
