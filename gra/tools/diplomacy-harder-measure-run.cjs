'use strict';
/**
 * diplomacy-harder-measure-run.cjs -- R-WEB-DIPLO-HARDER-MEASURE-RUNNER-Q1: runner pomiaru „twardszej dyplomacji"
 * (flaga etapu A OFF vs ON) w zywej grze. POMIAR, nie zmiana gry.
 *
 * Cienki wrapper na `ai-economy-measure-run.cjs`: z tego modulu biore (eksporty) blokady modalne konca tury
 * (`closeEndTurnModals`), liczniki (`newCtx`, `countersOf`) i ten sam start nowej gry. Przebieg tur (bramka NNS
 * gracza z dosypka, zamykanie blokad, zamykanie bitew, realny endTurn) jest tu powtorzony 1:1 w zakresie potrzebnym
 * do pomiaru, bo runner nie eksportuje petli tur. Plik ai-economy-measure-run.cjs NIE jest zmieniany.
 *
 * Flaga: `--harder 0|1` ustawiana PO starcie gry przez hak `window.__diploHarderMeasure.setEnabled` (main.ts, za ?civTest=1),
 * PRZED pierwszym endTurn. Odczyt potwierdzenia: `isEnabled()` zapisywany w kazdym wierszu jako `harder`.
 *
 * Wynik (w --out):
 *   seed<S>-harder<0|1>.jsonl -- jedna linia na ture: { seed, harder, turn, diplo: { owners, pairs[] }, wars, gate, modal, sec }.
 *     pairs[] zawiera pary, ktore maja kontakt/status inny niz 'neutralni' albo sa sasiadami (reszta pominieta, zeby
 *     plik nie puchl; pominiecie jest jawne: pole `pominietePary` w wierszu = liczba pominietych par).
 *   seed<S>-harder<0|1>.summary.json -- koniec, liczniki, powod zatrzymania.
 *
 * Uzycie (z gra/, bundle budowany POZA repo):
 *   node tools/diplomacy-harder-measure-run.cjs --dist <abs-dist> --out <abs-katalog> --seed 4242 --turns 20 --harder 1
 *   opcje: --profile <abs> (profil Chromium; domyslnie os.tmpdir), --gold 200 --food 200 --bypass 1
 *   --player-ai 0|1 (domyslnie 1): gracz (0) = autopilot AI (R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1); pokoj wymuszony
 *   akceptowany przez measure-forced-peace.cjs (licznik forcedPeaceAccepted w wierszu i summary); zamykanie blokad
 *   (w tym karty technologii) przez closeEndTurnModals z ai-economy-measure-run.cjs -> measure-close-modals.cjs (jedno zrodlo selektorow).
 *   --build 1 buduje bundle do --dist (vite, poza repo; bez tego flagi uzywa istniejacego index.html).
 *   --every N zapisuje wiersz tylko dla tur podzielnych przez N (np. 5 albo 25; ostatnia tura zawsze).
 *   Przegladarka: CHROME_PATH (domyslnie pierwsza z: /usr/bin/google-chrome, /usr/bin/chromium). Jeden Chromium naraz.
 *
 * Wznowienie (R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1): `--stop-at <tura>` przerywa przebieg na tej turze
 * (zapis slotu `dipl-measure-<TAG>` co --every tur i na koncu odcinka, stan w <out>/<TAG>.state.json). Kolejne wywolanie
 * z TYM SAMYM --out i --profile wczytuje slot (loadSlot), ponownie ustawia flagi/autopilot i gra dalej, bez duplikatow tur.
 * Bez --stop-at: przebieg jak dotad (od nowej gry do --turns, bez zapisow slotu). Flagi sa stanem runtime (nie w zapisie),
 * wiec po kazdym wczytaniu ssa ustawiane od nowa PRZED endTurn; licznik zerwan sesji dostaje przesuniecie z zapisu.
 *
 * Limity: pojedyncze polecenie Bash < 590 s. Dlugie biegi dziel na odcinki --stop-at (np. 30, 60, 90).
 */
const { TMPDIR_RUN_ID } = require('./_tmp-unique.cjs');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const base = require('./ai-economy-measure-run.cjs');
// R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1: pokoj wymuszony (kolejka blokuje endTurn) -- ten sam modul co runner ekonomii.
const { acceptForcedPeace } = require('./measure-forced-peace.cjs');
const { licznikiZPar } = require('./diplomacy-all-flags-measure-counters.cjs');
// R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1: ponawianie startu ze slotu przy padnieciu Chromium (logika i testy w tym module).
const { openWithRetry } = require('./measure-resume-retry.cjs');

function arg(name, def) {
  const i = process.argv.indexOf('--' + name);
  return i >= 0 && process.argv[i + 1] !== undefined ? process.argv[i + 1] : def;
}

const GRA_DIR = path.resolve(__dirname, '..');
const SEED = parseInt(arg('seed', '4242'), 10);
const TURNS = parseInt(arg('turns', '100'), 10);
const EVERY = Math.max(1, parseInt(arg('every', '1'), 10) || 1);
const HARDER = arg('harder', '0') === '1';
/** R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: --all-flags 0|1 (brak = tryb --harder bez zmian). 1 = wszystkie flagi pakietu ON,
 *  0 = wszystkie OFF; ustawia hak `__diploAllFlagsMeasure.setAll` PO starcie gry, PRZED pierwszym endTurn. */
const ALL_FLAGS_ARG = arg('all-flags', null);
const ALL_FLAGS = ALL_FLAGS_ARG === null ? null : (ALL_FLAGS_ARG === '1');
if (ALL_FLAGS !== null && arg('harder', null) !== null) {
  console.error('--all-flags nie łączy się z --harder (tryb --all-flags ignoruje --harder). Podaj tylko jedno.');
  process.exit(2);
}
/** R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1: --player-ai 0|1 (domyslnie 1) = gracz (0) sterowany autopilotem AI (hak
 *  `__aiEconomyMeasure.setPlayerAiAutopilotForTest`, ustawiany po starcie gry, przed pierwszym endTurn). */
const PLAYER_AI = arg('player-ai', '1') !== '0';
const GOLD = parseInt(arg('gold', '200'), 10);
const FOOD = parseInt(arg('food', '200'), 10);
const BYPASS = arg('bypass', '1') !== '0';
const DIST = path.resolve(arg('dist', path.join(os.tmpdir(), `diplo-harder-dist-${TMPDIR_RUN_ID}`)));
const PROFILE = path.resolve(arg('profile', path.join(os.tmpdir(), `diplo-harder-profile--${TMPDIR_RUN_ID}` + (HARDER ? 'on' : 'off'))));
const OUT = path.resolve(arg('out', path.join(os.tmpdir(), `diplo-harder-out-${TMPDIR_RUN_ID}`)));
const PW_DIR = path.resolve(arg('pw', GRA_DIR));
/** Przegladarka: CHROME_PATH; bez niego pierwsza istniejaca z listy (brak /usr/bin/chromium nie wywala launchu). */
const CHROME = process.env.CHROME_PATH || [(require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium'), '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find(p => fs.existsSync(p)) || (require('./_chrome-path.cjs').resolveChromePath() || '/usr/bin/chromium');
const TURN_TIMEOUT_MS = 300000;
/** R-WEB-DIPLO-LEVEL-MEASURE-3-LEVELS-Q1: --diplo-level latwa|normalna|trudna (brak = jak dotad). Poziom ustawiany PRAWDZIWA
 *  sciezka nowej gry: hak __settingsLive.startNewGame z advanced.diplomacyWarLevel (ta sama funkcja co „Start” kreatora);
 *  potwierdzany odczytem __settingsLive.getSettings() po starcie i po wczytaniu slotu. */
const DIPLO_LEVEL = arg('diplo-level', null);
if (DIPLO_LEVEL !== null && !['latwa', 'normalna', 'trudna'].includes(DIPLO_LEVEL)) {
  console.error('--diplo-level: dozwolone latwa|normalna|trudna (podano ' + DIPLO_LEVEL + ').');
  process.exit(2);
}
const TAG_BASE = ALL_FLAGS === null ? `seed${SEED}-harder${HARDER ? 1 : 0}` : `seed${SEED}-all${ALL_FLAGS ? 1 : 0}`;
const TAG = DIPLO_LEVEL === null ? TAG_BASE : `${TAG_BASE}-lvl-${DIPLO_LEVEL}`;
/** R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1: --stop-at <tura> (brak = przebieg do --turns jak dotad, bez wznowienia).
 *  Z --stop-at: zapis slotu co --every tur ORAZ na koncu odcinka; kolejne wywolanie z tym samym --out i --profile
 *  wczytuje slot (loadSlot) i kontynuuje od jego tury. Liczniki w state.json (slotCounters), liczone raz. */
const SEGMENT = process.argv.indexOf('--stop-at') >= 0;
const STOP_AT = SEGMENT ? parseInt(arg('stop-at', String(TURNS)), 10) : TURNS;
const SLOT = 'dipl-measure-' + TAG;
const wait = ms => new Promise(r => setTimeout(r, ms));

/** Etykieta harder w wierszu: w trybie --all-flags = stan flagi etapu A z haka (odczyt), inaczej --harder. */
function harderLabel() {
  if (ALL_FLAGS !== null) return FLAGI_START && FLAGI_START.harder ? 1 : 0;
  return HARDER ? 1 : 0;
}

/** Blokady modalne konca tury: jak runner ekonomii (eksport `closeEndTurnModals`). */
const COUNTERS = base.newCtx(null);

function ensureBuild() {
  if (arg('build', '0') !== '1' && fs.existsSync(path.join(DIST, 'index.html'))) return;
  console.log('[diplo] build vite -> ' + DIST);
  execSync(`node ./node_modules/vite/bin/vite.js build --outDir ${JSON.stringify(DIST)} --emptyOutDir`,
    { cwd: GRA_DIR, stdio: 'pipe', timeout: 500000 });
}

async function launch(chromium) {
  const args = ['--no-sandbox', '--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'];
  // R-WEB-DIPLO-MEASURE-RESUMABLE-FLAGS-ONOFF-Q1: opcjonalne flagi Chromium z env MEASURE_CHROME_ARGS (jak runner ekonomii);
  // "--disable-gpu --mute-audio" omija SIGSEGV przy wczytaniu slotu (znany problem srodowiska). Domyslnie puste.
  for (const a of (process.env.MEASURE_CHROME_ARGS || '').split(/\s+/).filter(Boolean)) args.push(a);
  return chromium.launchPersistentContext(PROFILE, { headless: true, args, viewport: { width: 1280, height: 800 }, executablePath: CHROME });
}

/** Start jak runner (`newgame`): prawdziwy doStartGame + czekanie na koniec nakladki + zalozenie miasta gracza. */
/** Flagi pakietu (runtime, NIE w zapisie gry): po KAZDYM starcie/wczytaniu slotu ustawiane ponownie PRZED endTurn. */
async function applyFlags(page) {
  if (ALL_FLAGS !== null) {
    const st = await page.evaluate(on => window.__diploAllFlagsMeasure.setAll(on), ALL_FLAGS);
    FLAGI_START = st;
    // Pakiet = sześć flag dyplomacji; tor NAP (napTor, torAktywny) poza pakietem — zostaje na wartości z danych (false).
    const PAKIET = ['harder', 'sojuszTor', 'koalicja', 'zeroZaufania', 'wojnaSilaSojuszu', 'limitWojen'];
    const wanted = PAKIET.every(k => st[k] === ALL_FLAGS);
    if (!wanted) throw new Error('setAll(' + ALL_FLAGS + ') nie ustawil wszystkich flag (odczyt=' + JSON.stringify(st) + ')');
    console.log('[diplo] all-flags=' + (ALL_FLAGS ? 1 : 0) + ' ' + JSON.stringify(st));
    return;
  }
  const got = await page.evaluate(on => window.__diploHarderMeasure.setEnabled(on), HARDER);
  if (got !== HARDER) throw new Error('setEnabled(' + HARDER + ') nie ustawil flagi (odczyt=' + got + ')');
}

/** Odczyt poziomu „Dyplomacja i wojna” z realnej funkcji ustawien (getSettings); null gdy brak --diplo-level. */
async function readDiploLevel(page) {
  if (DIPLO_LEVEL === null) return null;
  const st = await page.evaluate(() => window.__settingsLive.getSettings());
  return st.diplomacyWarLevel;
}

/** R-WEB-HARNESS-CHROME-SAVE-RESUME-SIGSEGV-Q1: start ze slotu (wznowienie) bywa przerywany padnieciem renderera Chromium
 *  (SIGSEGV; Playwright: "Target page, context or browser has been closed"). Przed pierwsza tura nic nie zapisano, wiec
 *  ponawiany jest CALY start (launch + openGame ze slotu), max 3 proby; logika w measure-resume-retry.cjs (openWithRetry). */
async function openGameRetry(chromium, fresh) {
  return openWithRetry({
    launch: () => launch(chromium),
    open: ctx => openGame(ctx, { fresh }),
    fresh,
    profileDir: PROFILE,
    attempts: 3,
    log: msg => console.log(msg),
  });
}

/** Start jak runner (`newgame`): prawdziwy doStartGame + czekanie na koniec nakladki. Swiezy przebieg: zalozenie miasta
 *  gracza; wznowienie (fresh=false): loadSlot zamiast zakladania miasta. Potem autopilot, tryb szybki i flagi. */
async function openGame(ctx, { fresh }) {
  const page = ctx.pages()[0] || await ctx.newPage();
  const url = 'file://' + path.join(DIST, 'index.html') + '?civTest=1&civSeed=' + SEED;
  await page.goto(url, { waitUntil: 'load', timeout: 180000 });
  await page.waitForFunction(() => !!window.__aiTradeWiringTestDebug && !!window.__aiEconomyMeasure && !!window.__detHarness && !!window.__diploHarderMeasure && !!window.__diploAllFlagsMeasure, null, { timeout: 180000 });
  if (DIPLO_LEVEL === null) {
    await page.evaluate(([seed]) => window.__nnsMeasureDebug.startGame({ seed }), [SEED]);
  } else {
    // Ta sama konfiguracja co __nnsMeasureDebug.startGame (Rzymianie, Standardowy, 2 państwa-miasta, 15 cywilizacji, jakość wysoka),
    // z jednym dodatkiem: advanced.diplomacyWarLevel. Start idzie przez __settingsLive.startNewGame -> doStartGame.
    const params = {
      civId: 'rzymianie', civName: 'Rzymianie', epoch: 'Epoka Brązu', epochId: 'braz', difficulty: 'Normalny',
      mapSize: 'Standardowy', rivals: '2', speed: 'Normalna', worldType: 'Kontynenty', typSwiata: 'kontynenty', seed: SEED,
      mapQualityLabel: 'Wysoka', mapQuality: 'high', renderQualityLabel: 'Wysoka', mapDetailQualityLabel: 'Wysoka',
      renderQuality: 'high', mapDetailQuality: 'high', civTypesCount: 15, cityStatesCount: 2,
      worldDensityLabels: { resources: 'Normalnie', rivers: 'Normalnie', desert: 'Normalnie', forest: 'Normalnie', relief: 'Normalnie' },
      advanced: {
        barbariansLevel: 'normalny', battleAlwaysManual: false, victoryMode: 'moc_i_dominacja', buildingCostPace: 'niski',
        kosztJednostekPace: 'niski', wzrostLudnosciPace: 'wysoki', ruchSwiataPace: 'krotki', landFractionPercent: 30, landFractionCustom: false,
        cityStateDifficultyOverride: 'normal', cityLimitBase: 10, diplomacyWarLevel: DIPLO_LEVEL,
      },
      villageRewardsEnabled: true,
    };
    await page.evaluate(p => window.__settingsLive.startNewGame(p), params);
  }
  await page.waitForFunction(() => { try { return window.__aiTradeWiringTestDebug.state().turn >= 1; } catch (_) { return false; } }, null, { timeout: 180000 });
  await page.waitForFunction(() => {
    const ov = Array.from(document.querySelectorAll('*')).some(el => el.textContent && el.textContent.includes('Tworzenie świata') && el.offsetParent !== null);
    return !ov && window.__nnsMeasureDebug.awaitingFirstCity() === true;
  }, null, { timeout: 600000, polling: 500 });
  if (fresh) {
    const founded = await page.evaluate(() => window.__aiTradeWiringTestDebug.foundFirstCity());
    if (!founded) throw new Error('nie udalo sie zalozyc miasta gracza (foundFirstCity=false)');
  } else {
    await page.evaluate(slot => window.__aiTradeWiringTestDebug.loadSlot(slot), SLOT);
  }
  await page.evaluate(() => { const t = window.__truceTestDebug; if (t && t.suppressVictoryForTest) t.suppressVictoryForTest(); });
  // Autopilot gracza PO starcie gry, PRZED pierwszym endTurn (jak runner ekonomii; odczyt potwierdza ustawienie).
  if (PLAYER_AI) {
    await page.evaluate(() => window.__aiEconomyMeasure.setPlayerAiAutopilotForTest(true));
    const on = await page.evaluate(() => window.__aiEconomyMeasure.playerAiAutopilotForTestState());
    if (on !== true) throw new Error('autopilot gracza nie ustawiony (odczyt=' + on + ')');
    console.log('[diplo] player-ai autopilot=1');
  }
  if (DIPLO_LEVEL !== null) {
    const lvl = await readDiploLevel(page);
    if (lvl !== DIPLO_LEVEL) throw new Error('poziom dyplomacji po starcie/wczytaniu=' + lvl + ' != ' + DIPLO_LEVEL);
    console.log('[diplo] diplo-level=' + lvl);
  }
  await page.evaluate(() => window.__aiTradeWiringTestDebug.setFastMode(true));
  // Flaga PO starcie gry (lub wczytaniu slotu), PRZED pierwszym endTurn.
  await applyFlags(page);
  return page;
}

/** Okna bitew blokuja koniec tury: rozstrzygamy jak gracz (kopia logiki runnera ekonomii, bez zmian semantyki). */
async function clearBattles(page) {
  let n = 0;
  let clean = 0;
  for (let k = 0; k < 400; k++) {
    await base.closeEndTurnModals(page, COUNTERS);
    const bs = await page.evaluate(() => window.__aiTradeWiringTestDebug.battleState());
    if (!bs.preBattleOpen && !bs.pendingAuto && !bs.sceneOpen && !bs.summaryOpen && !bs.resolving) { if (++clean >= 2) break; await wait(150); continue; }
    clean = 0;
    const act = await page.evaluate(() => {
      const h = window.__aiTradeWiringTestDebug;
      const b = document.querySelector('.pb-overlay [data-act="auto"]');
      if (b) { b.click(); return 'auto'; }
      if (h.closeBattleSummary()) return 'summary';
      if (h.flushBattles()) return 'flush';
      return 'wait';
    });
    if (act === 'auto') n++;
    await wait(act === 'wait' ? 300 : 150);
  }
  return n;
}

/** Wiersz pomiaru: pary z kontaktem/statusem innym niz 'neutralni' albo sasiedzi (jawnie liczone pominiete). */
function diploRow(m) {
  const keep = [];
  let pominiete = 0;
  for (const p of m.pairs) {
    if (p.sasiad || p.status !== 'neutralni' || p.pokoj) keep.push(p);
    else pominiete++;
  }
  return { gracz: m.gracz, owners: m.owners, pairs: keep, pominietePary: pominiete, flagaOdczyt: m.flag };
}

/**
 * R-WEB-MEASURE-SEED1234-T18-STALL-Q1: oferta handlowa AI->gracz (wpis stolu negocjacji, awaitingOwnerId = gracz)
 * blokuje „Zakończ turę" gdy włączona jest opcja „Wymagaj rozpatrzenia ofert handlowych" (bramka hasBlockingAiTradeOfferForPlayer).
 * Runner nie ma decyzji gracza, wiec stal w turze 18 (canEnd=false, bez bitwy, bez NNS). Zalozenie pasywnego gracza:
 * oferte odrzucamy (hook __aiTradeWiringTestDebug.reject, = handleNegotiationReject). Wpisy z responder=0 (wlasciciel gracza
 * w tym ziarnie) i proposer!=0 to oferty AI do gracza; propozycje gracza (proposer=0) nie sa ruszane.
 */
// R-WEB-MEASURE-RUNNERS-REJECT-AI-OFFERS-Q1: wspolna funkcja przeniesiona do measure-reject-offers.cjs (bez zmiany zachowania).
const { rejectAwaitingAiOffers } = require('./measure-reject-offers.cjs');

/** Sumy odrzucen w biegu: potwierdzone (wpis zniknal) i proby (wywolania reject). */
let AI_OFFERS_REJECTED = 0;
/** R-WEB-DIPLO-ALL-FLAGS-MEASURE-RUNNER-Q1: stan wszystkich flag po ustawieniu (odczyt haka), do summary. */
let FLAGI_START = null;
let AI_OFFERS_REJECT_ATTEMPTS = 0;
/** Przesuniecie licznika zerwan sesji po wznowieniu (suma = ZERW_OFFSET + odczyt sesji). */
let ZERW_OFFSET = 0;

/** Stan wznowienia (<out>/<TAG>.state.json): zapis po KAZDEJ turze w trybie --stop-at, slot i liczniki z chwili zapisu slotu. */
function readState(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return null; }
}
function writeState(p, s) { fs.writeFileSync(p, JSON.stringify(s, null, 2)); }

async function playOneTurn(page) {
  const t0 = Date.now();
  const before = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  const modalBefore = Object.assign({}, COUNTERS);
  const blocked = await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked());
  const bypass = { gold: 0, food: 0, applied: false };
  if (blocked) {
    if (!BYPASS) return { stop: 'gate-blocked (bypass wylaczony)', tura: before };
    await page.evaluate(([g]) => window.__aiTradeWiringTestDebug.grantPlayerGold(g), [GOLD]);
    await page.evaluate(([f]) => window.__aiTradeWiringTestDebug.grantPlayerFood(f), [FOOD]);
    bypass.gold = GOLD; bypass.food = FOOD; bypass.applied = true;
    if (await page.evaluate(() => window.__aiTradeWiringTestDebug.nnsGateBlocked())) return { stop: 'gate-blocked-after-bypass', tura: before };
  }
  await base.closeEndTurnModals(page, COUNTERS);
  const battlesAuto = await clearBattles(page);
  const seenOffers = new Set(); // proby liczone raz na id oferty w tej turze
  const offers1 = await rejectAwaitingAiOffers(page, seenOffers);
  let offersRejected = offers1.confirmed;
  let offersAttempts = offers1.attempts;
  AI_OFFERS_REJECTED += offers1.confirmed;
  AI_OFFERS_REJECT_ATTEMPTS += offers1.attempts;
  // R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1: wiszacy pokoj wymuszony blokuje „Zakoncz ture” -- gracz-pomiarowy go akceptuje.
  await acceptForcedPeace(page, COUNTERS, wait);
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
    // Druga proba: odrzucenie moze odslonic kolejna oferte w kolejce stolu.
    const offers2 = await rejectAwaitingAiOffers(page, seenOffers);
    offersRejected += offers2.confirmed;
    offersAttempts += offers2.attempts;
    AI_OFFERS_REJECTED += offers2.confirmed;
    AI_OFFERS_REJECT_ATTEMPTS += offers2.attempts;
    await clearBattles(page);
  }
  if (!(await page.evaluate(() => window.__aiTradeWiringTestDebug.canEnd()))) {
    return { stop: 'cannot-end', tura: before };
  }
  await base.closeEndTurnModals(page, COUNTERS);
  await page.evaluate(() => window.__aiTradeWiringTestDebug.endTurn());
  const deadline = Date.now() + TURN_TIMEOUT_MS;
  let advanced = false;
  while (!advanced && Date.now() < deadline) {
    advanced = await page.evaluate(t => window.__aiTradeWiringTestDebug.state().turn > t && !window.__aiTradeWiringTestDebug.isEndTurnInProgress(), before);
    if (!advanced) { await base.closeEndTurnModals(page, COUNTERS); await wait(250); }
  }
  if (!advanced) return { stop: 'endturn-timeout', tura: before };
  const after = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
  const m = await page.evaluate(() => window.__diploHarderMeasure.metrics());
  const modalDelta = {};
  for (const k of base.MODAL_KEYS) modalDelta[k] = COUNTERS[k] - modalBefore[k];
  const d = diploRow(m);
  const flagi = ALL_FLAGS === null ? null : await page.evaluate(() => window.__diploAllFlagsMeasure.status());
  // Licznik zerwan jest licznikiem SESJI przegladarki (reset po wczytaniu slotu): ZERW_OFFSET dodaje wartosc sprzed wznowienia.
  const liczniki = ALL_FLAGS === null ? null : licznikiZPar(m, ZERW_OFFSET + await page.evaluate(() => window.__diploAllFlagsMeasure.zerwaniaZeroZaufania()));
  const diploLevel = DIPLO_LEVEL === null ? null : await readDiploLevel(page);
  const rec = { seed: SEED, diploLevel, harder: harderLabel(), allFlags: ALL_FLAGS === null ? null : (ALL_FLAGS ? 1 : 0), liczniki, playerAi: PLAYER_AI ? 1 : 0, turn: after, gate: blocked, bypass, battlesAuto, aiOffersRejected: offersRejected, aiOffersRejectAttempts: offersAttempts,
    forcedPeaceAccepted: COUNTERS.forcedPeaceAccepted, modal: modalDelta, sec: Math.round((Date.now() - t0) / 100) / 10, diplo: d,
    wojny: d.pairs.filter(p => p.status === 'wojna').length };
  if (flagi) rec.flagi = flagi;
  return { rec };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(PROFILE, { recursive: true });
  ensureBuild();
  const { chromium } = require(path.join(PW_DIR, 'node_modules', 'playwright'));
  const jsonl = path.join(OUT, TAG + '.jsonl');
  const summaryPath = path.join(OUT, TAG + '.summary.json');
  const statePath = path.join(OUT, TAG + '.state.json');
  // Wznowienie tylko w trybie --stop-at, gdy state.json wskazuje zapisany slot TEJ SAMEJ gry (TAG/SLOT).
  const prev = SEGMENT ? readState(statePath) : null;
  const resume = !!(prev && prev.saved === true && prev.slot === SLOT && prev.slotTurn > 0);
  let slotTurn = resume ? prev.slotTurn : 0;
  let slotCounters = resume ? (prev.slotCounters || null) : null;
  let zerwaniaSuma = resume ? (prev.zerwaniaSuma || 0) : 0;
  if (resume) {
    // Liczniki startuja od wartosci ZAPISANYCH przy slocie (zliczone raz); jsonl obciety do tury slotu (bez duplikatow).
    Object.assign(COUNTERS, base.newCtx(slotCounters));
    AI_OFFERS_REJECTED = (slotCounters && slotCounters.aiOffersRejected) || 0;
    AI_OFFERS_REJECT_ATTEMPTS = (slotCounters && slotCounters.aiOffersRejectAttempts) || 0;
    if (fs.existsSync(jsonl)) {
      const keep = fs.readFileSync(jsonl, 'utf8').split('\n').filter(l => l.trim() && JSON.parse(l).turn <= slotTurn);
      fs.writeFileSync(jsonl, keep.map(l => l + '\n').join(''));
    }
    console.log(`[diplo] ${TAG} WZNOWIENIE ze slotu ${SLOT} (tura ${slotTurn})`);
  } else {
    // Start pliku: obciecie do zera (bez unlink; poprzedni wynik tego samego ziarna/flagi zostaje nadpisany).
    fs.writeFileSync(jsonl, '');
  }
  const snapCounters = () => Object.assign({}, COUNTERS, { aiOffersRejected: AI_OFFERS_REJECTED, aiOffersRejectAttempts: AI_OFFERS_REJECT_ATTEMPTS });
  let ctx = null;
  let stop = null;
  let turn = 0;
  let rows = 0;
  let saved = resume;
  const t0 = Date.now();
  const writeSeg = (extra) => { if (SEGMENT) writeState(statePath, Object.assign({ seed: SEED, tag: TAG, slot: SLOT, saved, slotTurn, slotCounters, zerwaniaSuma, lastTurn: turn, counters: snapCounters() }, extra)); };
  try {
    const opened = await openGameRetry(chromium, !resume);
    ctx = opened.ctx;
    const page = opened.page;
    turn = await page.evaluate(() => window.__aiTradeWiringTestDebug.state().turn);
    if (resume) {
      if (turn !== slotTurn) throw new Error('wznowienie: tura po loadSlot=' + turn + ' != tura slotu ' + slotTurn);
      if (ALL_FLAGS !== null) {
        // Licznik zerwan = licznik sesji (reset po wczytaniu): przesuniecie tak, by suma ciagla od zapisu.
        const raw0 = await page.evaluate(() => window.__diploAllFlagsMeasure.zerwaniaZeroZaufania());
        ZERW_OFFSET = zerwaniaSuma - raw0;
      }
    }
    while (turn < STOP_AT) {
      const r = await playOneTurn(page);
      if (r.stop) { stop = { reason: r.stop, tura: r.tura }; break; }
      turn = r.rec.turn;
      if (turn % EVERY === 0 || turn >= TURNS) {
        fs.appendFileSync(jsonl, JSON.stringify(r.rec) + '\n');
        rows++;
      }
      if (SEGMENT && (turn % EVERY === 0 || turn >= STOP_AT)) {
        const ok = await page.evaluate(slot => window.__aiTradeWiringTestDebug.quickSave(slot), SLOT);
        if (ok) {
          saved = true; slotTurn = turn; slotCounters = snapCounters();
          if (ALL_FLAGS !== null) zerwaniaSuma = ZERW_OFFSET + await page.evaluate(() => window.__diploAllFlagsMeasure.zerwaniaZeroZaufania());
        }
      }
      writeSeg({ stop: null });
      console.log(`[diplo] ${TAG} tura=${turn} pary=${r.rec.diplo.pairs.length} wojny=${r.rec.wojny} czas=${Math.round((Date.now() - t0) / 1000)}s`);
    }
  } finally {
    writeSeg({ stop });
    if (ctx) await ctx.close();
  }
  // R-WEB-MEASURE-HARDER-RUNNER-LONG-RUN-Q1: gracz = autopilot (playerAi 1) -- adnotacja w summary; kolumny par bez zmian.
  const summary = { seed: SEED, diploLevel: DIPLO_LEVEL, harder: harderLabel(), allFlags: ALL_FLAGS === null ? null : (ALL_FLAGS ? 1 : 0), playerAi: PLAYER_AI ? 1 : 0, graczAdnotacja: PLAYER_AI ? 'gracz = autopilot' : 'gracz = pasywny',
    turnsRequested: TURNS, every: EVERY, endTurn: turn, rows, stop, segment: SEGMENT, stopAt: STOP_AT, resumed: resume, slot: SLOT,
    flagi: FLAGI_START,
    counters: Object.assign({}, COUNTERS), aiOffersRejected: AI_OFFERS_REJECTED, aiOffersRejectAttempts: AI_OFFERS_REJECT_ATTEMPTS, wallSec: Math.round((Date.now() - t0) / 1000) };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('[diplo] PODSUMOWANIE ' + JSON.stringify(summary));
}

module.exports = { diploRow };

if (require.main === module) {
  main().catch(e => { console.error('[diplo] BLAD: ' + (e && e.stack || e)); process.exit(1); });
}
