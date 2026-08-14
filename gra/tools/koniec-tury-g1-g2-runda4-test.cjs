'use strict';
/**
 * koniec-tury-g1-g2-runda4-test.cjs
 *
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE, RUNDA 4 -- naprawa dwoch znalezisk G1/G2 z
 * werdyktu Evaluatora FAIL na commit `4f24bcda` (dyspozycje/PYTANIA-OTWARTE.md, sekcja
 * "Evaluator: N1 runda 3 -- F1-F4 (`4f24bcda`) -- WERDYKT: FAIL", werdykt zapisany w commicie
 * `43d4be34`). F1 z rundy 3 jest ZAMKNIETE i POTWIERDZONE przez ten sam werdykt -- NIE
 * dotknieta tym tematem (patrz koniec-tury-f1-f4-runda3-test.cjs).
 *
 * G1 (BLOKER) -- runda 3 dodala do galezi 1 healStaleEndTurnBlockers() prog 8000ms
 *   (pendingBattleStuck) BEZ warunku kontekstowego. Skutek: kasowal LEGALNIE odroczona
 *   bitwe (audiencja dyplomatyczna / panel scalenia armii otwarty >8s -- normalne tempo
 *   gracza) razem z aiCmdResume. Deterministyczna sciezka zmierzona przez Evaluatora: onBack
 *   audiencji wola hideDiplomacyAudience() -> refreshD1bHud() (obie galezie if/else) ->
 *   dopiero requestAnimationFrame z flushDeferredAutoPreBattle(). W chwili, gdy audiencja
 *   juz zniknela, ale flush jeszcze nie ruszyl, biegnie SYNCHRONICZNIE
 *   healStaleEndTurnBlockers() (przez refreshD1bHud() -> canEndTurn() w petli renderu HUD) --
 *   isOtherEndTurnModalOpen() w tym oknie zwraca juz false (audiencja zamknieta), wiec GDYBY
 *   timeout zyl w TEJ funkcji, kasowalby kolejke DOKLADNIE w tym oknie, zanim zaplanowany
 *   rAF flush zdazyby pokazac bitwe.
 *
 *   Naprawa: timeout PRZENIESIONY z galezi 1 healStaleEndTurnBlockers() (ktora wraca do
 *   formuly SPRZED rundy 3 -- patrz koniec-tury-f1-f4-runda3-test.cjs) do NOWEJ, dedykowanej
 *   funkcji `healStuckDeferredPreBattleQueueOnEndTurnAttempt()`, wolanej WYLACZNIE z
 *   triggerPlayerEndTurn() (rzeczywista, INTERAKTYWNA proba konca tury -- klikniecie gracza),
 *   NIGDY z pasywnej sondy canEndTurn (petla renderu HUD). Gracz fizycznie nie zdaza kliknac
 *   "Zakoncz ture" w oknie pojedynczej klatki animacji, wiec zaplanowany rAF flush ZAWSZE
 *   wygrywa wyscig z timeoutem -- okno G1 przestaje byc osiagalne. Nowa funkcja jest tez
 *   KONTEKSTOWA (rekomendacja Evaluatora rundy 2, teraz zastosowana): timeout NIE uruchamia
 *   sie dopoki isDiplomacyAudienceOpen()||isArmyMergePanelOpen() zwraca true.
 *
 * G2 (powazne) -- F3 (runda 3) rozszerzyl canPlayerInitiateEndTurn o
 *   hasPendingAutoPreBattle(), wiec bitwa barbarzynska (aiTurnAwaitingBattle===false,
 *   aiCmdResume===null -- obie flagi puste Z DEFINICJI dla tej sciezki) poprawnie BLOKOWALA
 *   koniec tury. Ale F2 (timeout, teraz przeniesiony -- patrz G1) siedzial WEWNATRZ galezi
 *   bramkowanej `(aiTurnAwaitingBattle||aiCmdResume)` -- dla barbarzyncow ta bramka NIGDY nie
 *   byla prawdziwa, wiec zalegla bitwa barbarzynska NIE MIALA ZADNEJ sciezki sprzatania.
 *   Dodatkowo triggerPlayerEndTurn robil `return` PRZED swoim `try` blokiem, gdy
 *   canPlayerInitiateEndTurn()===false -- wiec `finally` z flushem (ktory normalnie by to
 *   posprzatal) byl NIEOSIAGALNY na tej sciezce. Skutek: TRWALE zakleszczenie przycisku
 *   "Zakoncz ture".
 *
 *   Naprawa: `healStuckDeferredPreBattleQueueOnEndTurnAttempt()` sprawdza WYLACZNIE wiek
 *   najstarszego zadania w kolejce (oldestPendingAutoPreBattleAgeMs()) i
 *   isDiplomacyAudienceOpen()||isArmyMergePanelOpen()===false -- NIEZALEZNIE od
 *   aiTurnAwaitingBattle/aiCmdResume, wiec pokrywa tez sciezke barbarzynska. Wolana z
 *   triggerPlayerEndTurn() JAKO PIERWSZA instrukcja, PRZED sprawdzeniem
 *   canPlayerInitiateEndTurn() -- wiec sprzatanie zdazy sie odpalic nawet na sciezce, ktora
 *   zaraz potem robi early return (zweryfikowane w kodzie -- patrz [A-order] nizej -- nie
 *   zalozone).
 *
 * Dodatkowo (nizszy priorytet, ta sama klasa co N3 z tematu audiencji): z 3 wywolan
 *   showArmyMergePanel w main.ts tylko jedno (:9782) mialo flushDeferredAutoPreBattle() w
 *   onMerge/onSeparate. Pozostale dwa zamykaly panel BEZ flushu -- naprawione analogicznie do
 *   closeDiplomacyAudienceAndFlush() z tematu N3.
 *
 * Wzorzec identyczny jak koniec-tury-f1-f4-runda3-test.cjs / heal-stale-blockers-pending-
 * battle-test.cjs -- main.ts (30+ tys. linii, monolityczny bootstrap zalezny od
 * document/window/three.js) nie da sie zbundlowac do node'owego harnessu, wiec:
 *  A) TEKSTOWY PIN na main.ts -- dowodzi, ze naprawa faktycznie STOI w kodzie.
 *  B)+C) REALNA regresja: bundluje NAPRAWDE ui/preBattle.ts (esbuild + jsdom) i odtwarza
 *     zachowanie kolejki/timerow na prawdziwym module, karmiac nim mirror-e formul pinowanych
 *     bajt-w-bajt w czesci A.
 *
 * Usage (z gra/): node tools/koniec-tury-g1-g2-runda4-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY na src/main.ts
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');

// A1) healStuckDeferredPreBattleQueueOnEndTurnAttempt() istnieje i ma dokladnie te 5 checkow
//     w tej kolejnosci: hasPendingAutoPreBattle, isPreBattleOpen, isDiplomacyAudienceOpen||
//     isArmyMergePanelOpen, oldestPendingAutoPreBattleAgeMs>8000, clearDeferredAutoPreBattleQueue.
{
  const fnStart = mainSrc.indexOf('function healStuckDeferredPreBattleQueueOnEndTurnAttempt(): void {');
  ok(fnStart >= 0, '[A1] main.ts deklaruje function healStuckDeferredPreBattleQueueOnEndTurnAttempt(');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    function triggerPlayerEndTurn', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';

  ok(/if \(!hasPendingAutoPreBattle\(\)\) return;/.test(fnBody),
    '[A2] wczesny return gdy kolejka pusta (nic do sprzatania)');
  ok(/if \(isPreBattleOpen\(\)\) return;/.test(fnBody),
    '[A3] wczesny return gdy preBattle aktualnie otwarty (bitwa w toku -- nie "zagubiona")');
  ok(/if \(isDiplomacyAudienceOpen\(\) \|\| isArmyMergePanelOpen\(\)\) return;/.test(fnBody),
    '[A4] G1: wczesny return gdy modal blokujacy (audiencja/scalenie) jest otwarty -- kontekstowy warunek, nie goly stoper');
  ok(/const ageMs = oldestPendingAutoPreBattleAgeMs\(\);/.test(fnBody),
    '[A5] czyta oldestPendingAutoPreBattleAgeMs()');
  ok(/if \(ageMs <= 8000\) return;/.test(fnBody),
    '[A6] prog 8000ms -- ta sama wartosc co pozostale progi tego tematu (stuckMs>8000 w healStaleEndTurnBlockers)');
  ok(/clearDeferredAutoPreBattleQueue\(\);\s*\n\s*aiTurnAwaitingBattle = false;\s*\n\s*aiCmdResume = null;/.test(fnBody),
    '[A7] gdy faktycznie stuck: czysci kolejke ORAZ flagi (G2 -- niezaleznie od tego, czy flagi w ogole byly ustawione, wiec dziala tez dla barbarzyncow)');

  // Kontrola: formula NIE odwoluje sie do aiTurnAwaitingBattle/aiCmdResume jako WARUNKU
  // (G2 -- funkcja musi dzialac identycznie niezaleznie od stanu tych flag). Jedyne
  // wystapienia w kodzie wykonywalnym to PRZYPISANIA (= false / = null) w linii A7 powyzej,
  // nie odczyty w warunku `if`.
  const ifLinesA = fnBody.split('\n').filter(line => /^\s*if \(/.test(line));
  const gatedOnAiFlags = ifLinesA.some(line => /aiTurnAwaitingBattle|aiCmdResume/.test(line));
  ok(!gatedOnAiFlags,
    '[A8 kontrola G2] zaden warunek `if (...)` w tej funkcji nie odwoluje sie do aiTurnAwaitingBattle/aiCmdResume -- funkcja jest NIEZALEZNA od tych flag, w przeciwienstwie do starej galezi 1 (bramkowanej `aiTurnAwaitingBattle||aiCmdResume`), wiec pokrywa tez sciezke barbarzynska');
}

// A9) triggerPlayerEndTurn wola healStuckDeferredPreBattleQueueOnEndTurnAttempt() JAKO
//     PIERWSZA instrukcje, PRZED sprawdzeniem canPlayerInitiateEndTurn() -- G2, zeby
//     sprzatanie zdazylo sie odpalic nawet na sciezce ktora zaraz potem robi early return.
{
  const tpetIdx = mainSrc.indexOf('function triggerPlayerEndTurn(): void {');
  ok(tpetIdx >= 0, '[A9-setup] znaleziono function triggerPlayerEndTurn(');
  const tpetHead = tpetIdx >= 0 ? mainSrc.slice(tpetIdx, tpetIdx + 400) : '';
  ok(/function triggerPlayerEndTurn\(\): void \{\s*\n\s*healStuckDeferredPreBattleQueueOnEndTurnAttempt\(\);\s*\n\s*if \(!canPlayerInitiateEndTurn\(\)\) \{\s*\n\s*console\.warn\('\[EndTurn\] triggerPlayerEndTurn: odrzucono \(canPlayerInitiateEndTurn=false\)'\);\s*\n\s*hintEndTurnBlocked\(\);\s*\n\s*return;\s*\n\s*\}/.test(tpetHead),
    '[A9] triggerPlayerEndTurn: healStuckDeferredPreBattleQueueOnEndTurnAttempt() jest DOSLOWNIE pierwsza linia ciala funkcji, przed `if (!canPlayerInitiateEndTurn())` i jego early return -- zweryfikowane w kodzie, nie zalozone');
}

// A-order kontrola) canPlayerInitiateEndTurn SAMO tez wola healStaleEndTurnBlockers() na
//     poczatku (niezalezna weryfikacja zlecenia -- "sprawdz to w kodzie, nie zakladaj").
{
  const cpitIdx = mainSrc.indexOf('function canPlayerInitiateEndTurn(): boolean {');
  ok(cpitIdx >= 0, '[A-order-setup] znaleziono function canPlayerInitiateEndTurn(');
  const cpitHead = cpitIdx >= 0 ? mainSrc.slice(cpitIdx, cpitIdx + 150) : '';
  ok(/function canPlayerInitiateEndTurn\(\): boolean \{\s*\n\s*healStaleEndTurnBlockers\(\);/.test(cpitHead),
    '[A-order] canPlayerInitiateEndTurn woła healStaleEndTurnBlockers() jako pierwsza instrukcje -- potwierdza, ze ta funkcja i tak biegnie na kazdym wywolaniu canPlayerInitiateEndTurn (pasywnym i interaktywnym), wiec F1 (battleUiResolving) dziala identycznie jak w rundzie 3');
}

// A10) healStaleEndTurnBlockers NIE zawiera juz pendingBattleStuck (regresja rundy 4 -- pin
//     zdublowany celowo tez tutaj, obok koniec-tury-f1-f4-runda3-test.cjs i heal-stale-
//     blockers-pending-battle-test.cjs, zeby TEN test byl samodzielnym dowodem G1 bez
//     zaleznosci od innych plikow).
{
  const hsStart = mainSrc.indexOf('function healStaleEndTurnBlockers(): void {');
  const hsEnd = hsStart >= 0 ? mainSrc.indexOf('\n    function canPlayerInitiateEndTurn', hsStart) : -1;
  const hsBody = (hsStart >= 0 && hsEnd > hsStart) ? mainSrc.slice(hsStart, hsEnd) : '';
  const codeLines = hsBody.split('\n').filter(line => !/^\s*\/\//.test(line));
  ok(!codeLines.some(line => line.includes('pendingBattleStuck')),
    '[A10] healStaleEndTurnBlockers (galaz pasywna, wolana tez z canEndTurn) NIE zawiera juz pendingBattleStuck w kodzie wykonywalnym -- G1 fix');
}

// A11) G-DODATKOWO -- 3 wywolania showArmyMergePanel w main.ts, WSZYSTKIE maja flush w
//     kazdym callbacku zamykajacym (onMerge/onSeparate). Liczymy wystapienia
//     `flushDeferredAutoPreBattle();` w kontekscie wywolan showArmyMergePanel (miedzy kolejnymi
//     wystapieniami `showArmyMergePanel({` az do zamykajacego `});`).
{
  const callSites = [];
  let searchFrom = 0;
  for (;;) {
    const idx = mainSrc.indexOf('showArmyMergePanel({', searchFrom);
    if (idx < 0) break;
    callSites.push(idx);
    searchFrom = idx + 1;
  }
  ok(callSites.length === 3, '[A11-setup] dokladnie 3 wywolania showArmyMergePanel({ w main.ts (got ' + callSites.length + ')');

  let sitesWithFlush = 0;
  for (const start of callSites) {
    // Koniec bloku wywolania: naiwne dopasowanie do najblizszego `\n      });` lub
    // `\n        });` po starcie -- wystarczajace, bo wywolania nie zagniezdzaja sie w sobie.
    const endCandidates = ['\n      });', '\n        });'];
    let end = -1;
    for (const marker of endCandidates) {
      const idx = mainSrc.indexOf(marker, start);
      if (idx >= 0 && (end < 0 || idx < end)) end = idx;
    }
    const block = end > start ? mainSrc.slice(start, end) : '';
    const flushCount = (block.match(/flushDeferredAutoPreBattle\(\);/g) || []).length;
    // Kazde wywolanie ma DWA callbacki zamykajace (onMerge + onSeparate, ewentualnie tylko
    // jeden jest strzalka jednolinowa) -- oczekujemy >=2 flushy na wywolanie (jeden na
    // onMerge, jeden na onSeparate).
    if (flushCount >= 2) sitesWithFlush++;
  }
  ok(sitesWithFlush === 3,
    '[A11] wszystkie 3 wywolania showArmyMergePanel maja flushDeferredAutoPreBattle() w KAZDYM callbacku zamykajacym (onMerge i onSeparate) -- przed runda 4 tylko 1 z 3 mial flush (got ' + sitesWithFlush + '/3)');
}

// ---------------------------------------------------------------------------
// B) + C) REALNA regresja: bundluje ui/preBattle.ts i dowodzi mechanizmu na prawdziwym kodzie.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[koniec-tury-g1-g2-runda4-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.koniec-tury-g1-g2-runda4-entry.ts');
  const OUT = path.join(__dirname, '.koniec-tury-g1-g2-runda4-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'g1g2r4-brandAssets-stub.ts');

  fs.mkdirSync(STUB_DIR, { recursive: true });
  fs.writeFileSync(
    BRAND_STUB,
    [
      "export function terrainIconSvg() { return ''; }",
      "export function civIconSvg() { return ''; }",
      "export function brandIconSvg() { return ''; }",
      "export function unitIconSvg() { return ''; }",
    ].join('\n'),
    'utf8',
  );
  fs.writeFileSync(path.join(STUB_DIR, 'g1g2r4-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'g1g2r4-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'g1g2r4-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "  hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs, clearDeferredAutoPreBattleQueue,",
      "} from '../src/ui/preBattle.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-g1g2r4',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'g1g2r4-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'g1g2r4-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'g1g2r4-hud-stub.ts'),
      }));
    },
  };

  await esbuild.build({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: OUT,
    absWorkingDir: path.resolve(__dirname, '..'),
    logLevel: 'silent',
    plugins: [stubPlugin],
  });

  const {
    showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,
    hasPendingAutoPreBattle, oldestPendingAutoPreBattleAgeMs, clearDeferredAutoPreBattleQueue,
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  const baseInfo = {
    atakujacy: {
      nazwa: 'AI Rywal', ownerId: 3,
      units: [{ nazwa: 'Legionista', kategoria: 'Wrecz', hp: 12, maxHp: 12, atak: 6 }],
    },
    obronca: {
      nazwa: 'Zwiadowca', ownerId: 0,
      units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
    },
    teren: 'Rownina',
    szanseAtkPct: 45,
    miejsce: 'Pole',
    tura: 20,
    canRetreat: false,
  };

  // otherModalOpen mirror -- sterowalny flaga `blocked`, dokladnie jak w innych testach tego
  // tematu (audiencja jest zbyt ciezka do zbundlowania tutaj, hook realnie wpiety przez
  // main.ts jest identyczny bez wzgledu na to KTO zwraca true).
  let blocked = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => blocked });

  // -------------------------------------------------------------------------
  // MIRROR healStuckDeferredPreBattleQueueOnEndTurnAttempt() -- formula pinowana bajt-w-bajt
  // w czesci A ([A1]-[A7] wyzej), wiec dryf main.ts daje FAIL w A zanim ten mirror zdazy sie
  // zdezaktualizowac. `blocked` mirrouje isDiplomacyAudienceOpen()||isArmyMergePanelOpen()
  // (main.ts uzywa dwoch realnych funkcji, tu -- jak w pozostalych testach tego tematu --
  // jednej flagi sterujacej, bo prawdziwa audiencja jest zbyt ciezka do zbundlowania).
  // -------------------------------------------------------------------------
  function healStuckMirror(state) {
    if (!hasPendingAutoPreBattle()) return;
    if (isPreBattleOpen()) return;
    if (blocked) return; // isDiplomacyAudienceOpen() || isArmyMergePanelOpen()
    const ageMs = oldestPendingAutoPreBattleAgeMs();
    if (ageMs <= 8000) return;
    clearDeferredAutoPreBattleQueue();
    state.aiTurnAwaitingBattle = false;
    state.aiCmdResume = null;
  }

  function pushDeferredWithAge(ageMs) {
    const realDateNow = Date.now;
    blocked = true; // trzeba zeby showPreBattle w ogole odlozylo zadanie do kolejki
    Date.now = () => realDateNow() - ageMs;
    showPreBattle(baseInfo, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: true });
    Date.now = realDateNow;
  }

  // =========================================================================
  // G1-scenariusz-1: bitwa odroczona + modal OTWARTY (blocked=true) + wiek > 8000ms ->
  //   aiCmdResume PRZEZYWA (to jest DOKLADNIE zgloszony blad G1 -- modal wciaz legalnie
  //   blokuje, wiec timeout NIE MOZE sie odpalic, niezaleznie od wieku).
  // =========================================================================
  {
    pushDeferredWithAge(9000);
    ok(hasPendingAutoPreBattle() === true, '[G1-1 setup] zadanie odroczone w kolejce');
    ok(oldestPendingAutoPreBattleAgeMs() > 8000, '[G1-1 setup] wiek > 8000ms');
    // blocked pozostaje true -- modal WCIAZ otwarty w chwili sprawdzenia.
    ok(blocked === true, '[G1-1 setup] modal blokujacy WCIAZ otwarty w chwili sprawdzenia');

    const state = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 4, cmdIdx: 1 } };
    healStuckMirror(state);
    ok(state.aiCmdResume !== null && state.aiCmdResume.ownerIdx === 4,
      '[G1-1] modal otwarty >8s -> aiCmdResume PRZEZYWA (naprawa G1 dziala -- to jest dokladnie zgloszony blad, wczesniej timeout kasowal to bezwarunkowo)');
    ok(hasPendingAutoPreBattle() === true,
      '[G1-1] kolejka rowniez NIETKNIETA -- rAF flush wciaz bedzie mogl pokazac bitwe, gdy modal sie zamknie');

    blocked = false;
    flushDeferredAutoPreBattle();
    hidePreBattle();
    ok(hasPendingAutoPreBattle() === false, '[G1-1 sprzatanie] kolejka pusta po flushu');
  }

  // =========================================================================
  // G1-scenariusz-2: bitwa odroczona + ZADEN modal (blocked=false w chwili sprawdzenia) +
  //   wiek > 8000ms -> poprawnie CZYSZCZONE jako stare (prawdziwy wyciek/zagubienie, nie
  //   normalne oczekiwanie na gracza).
  // =========================================================================
  {
    pushDeferredWithAge(9000);
    blocked = false; // modal zamknal sie MIEDZY odlozeniem a sprawdzeniem (albo nigdy go nie bylo)
    ok(hasPendingAutoPreBattle() === true, '[G1-2 setup] zadanie odroczone w kolejce');
    ok(oldestPendingAutoPreBattleAgeMs() > 8000, '[G1-2 setup] wiek > 8000ms');

    const state = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 4, cmdIdx: 1 } };
    healStuckMirror(state);
    ok(state.aiCmdResume === null && state.aiTurnAwaitingBattle === false,
      '[G1-2] ZADEN modal + wiek > 8000ms -> healStuckMirror CZYSCI flagi (prawdziwy wyciek, timeout dziala)');
    ok(hasPendingAutoPreBattle() === false,
      '[G1-2] kolejka rowniez wyczyszczona (clearDeferredAutoPreBattleQueue)');
  }

  // =========================================================================
  // Kontrola G1: swieze zadanie (< 8000ms), ZADEN modal -> NIE czyszczone (bez tego test
  //   G1-2 bylby tautologia -- dowodzi, ze mirror rozroznia wiek, nie tylko obecnosc modalu).
  // =========================================================================
  {
    pushDeferredWithAge(500);
    blocked = false;
    ok(oldestPendingAutoPreBattleAgeMs() < 8000, '[G1-kontrola setup] wiek < 8000ms');
    const state = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 7, cmdIdx: 2 } };
    healStuckMirror(state);
    ok(state.aiCmdResume !== null && hasPendingAutoPreBattle() === true,
      '[G1-kontrola] swieze zadanie (< 8000ms), zaden modal -> NIE czyszczone (timeout nie strzela przedwczesnie)');

    flushDeferredAutoPreBattle();
    hidePreBattle();
    ok(hasPendingAutoPreBattle() === false, '[G1-kontrola sprzatanie] kolejka pusta');
  }

  // =========================================================================
  // G2-scenariusz-1: bitwa BARBARZYNSKA w kolejce (oba flagi PUSTE -- aiTurnAwaitingBattle
  //   ===false, aiCmdResume===null, dokladnie jak main.ts dla barbarzyncow), wiek > 8000ms,
  //   brak modalu -> kolejka POPRAWNIE wyczyszczona przez NOWY, NIEZALEZNY warunek (nie
  //   zalezny od tych flag -- stara galaz 1 by tego NIE zlapala, bo bramka
  //   `aiTurnAwaitingBattle||aiCmdResume` nigdy nie byla prawdziwa dla barbarzyncow).
  // =========================================================================
  {
    pushDeferredWithAge(9000);
    blocked = false;
    ok(hasPendingAutoPreBattle() === true, '[G2-1 setup] zadanie barbarzynskie odroczone w kolejce');
    ok(oldestPendingAutoPreBattleAgeMs() > 8000, '[G2-1 setup] wiek > 8000ms');

    // Stan DOKLADNIE jak barbarzynca: obie flagi puste z definicji (main.ts: onResolved
    // barbarzynski to no-op, nigdy nie ustawia aiTurnAwaitingBattle/aiCmdResume).
    const barbState = { aiTurnAwaitingBattle: false, aiCmdResume: null };
    healStuckMirror(barbState);
    ok(hasPendingAutoPreBattle() === false,
      '[G2-1] bitwa barbarzynska (oba flagi puste) + wiek > 8000ms + brak modalu -> kolejka WYCZYSZCZONA przez niezalezny warunek (naprawa G2 dziala -- stara galaz 1, bramkowana aiTurnAwaitingBattle||aiCmdResume, NIGDY by tego nie zlapala)');
    ok(barbState.aiTurnAwaitingBattle === false && barbState.aiCmdResume === null,
      '[G2-1] flagi pozostaja false/null (byly juz takie -- kontrola, ze funkcja nie psuje stanu, ktory juz byl poprawny)');
  }

  // =========================================================================
  // G2-scenariusz-2: to samo, ale wiek < 8000ms -> NIE czyszczone, canPlayerInitiateEndTurn
  //   (mirror wg formuly F3 -- pinowanej bajt-w-bajt w koniec-tury-f1-f4-runda3-test.cjs)
  //   nadal blokuje "Zakoncz ture", jak F3 wymaga.
  // =========================================================================
  {
    function canPlayerInitiateEndTurnMirror(flags) {
      if (flags.playtestWalkaActive) return false;
      if (flags.isAwaitingFirstPlayerCity) return false;
      if (isPreBattleOpen() || hasPendingAutoPreBattle()) return false;
      if (flags.galleryOn) return false;
      if (flags.gameOver) return false;
      if (flags.endTurnInProgress) return false;
      if (flags.aiTurnAwaitingBattle || flags.aiCmdResume) return false;
      return true;
    }

    pushDeferredWithAge(500);
    blocked = false;
    ok(oldestPendingAutoPreBattleAgeMs() < 8000, '[G2-2 setup] wiek < 8000ms');

    const barbState = { aiTurnAwaitingBattle: false, aiCmdResume: null };
    healStuckMirror(barbState);
    ok(hasPendingAutoPreBattle() === true,
      '[G2-2] bitwa barbarzynska swieza (< 8000ms) -> NIE czyszczone (timeout nie strzela przedwczesnie tez na sciezce barbarzynskiej)');

    const barbFlags = {
      playtestWalkaActive: false, isAwaitingFirstPlayerCity: false, galleryOn: false,
      gameOver: false, endTurnInProgress: false, aiTurnAwaitingBattle: false, aiCmdResume: null,
    };
    ok(canPlayerInitiateEndTurnMirror(barbFlags) === false,
      '[G2-2] canPlayerInitiateEndTurn nadal blokuje "Zakoncz ture" (F3 -- hasPendingAutoPreBattle()===true), jak wymaga specyfikacja rundy 3');

    flushDeferredAutoPreBattle();
    hidePreBattle();
    ok(hasPendingAutoPreBattle() === false, '[G2-2 sprzatanie] kolejka pusta');
  }

  // =========================================================================
  // G2-scenariusz-3: END-TO-END -- healStuckMirror wolany PRZED canPlayerInitiateEndTurnMirror
  //   (dokladnie jak main.ts: triggerPlayerEndTurn woła healStuckDeferredPreBattleQueueOn-
  //   EndTurnAttempt() jako pierwsza linie, PRZED sprawdzeniem canPlayerInitiateEndTurn) --
  //   dowodzi, ze zakleszczenie faktycznie peka na TYM SAMYM kliknieciu, ktore je odkrywa.
  // =========================================================================
  {
    function canPlayerInitiateEndTurnMirror(flags) {
      if (isPreBattleOpen() || hasPendingAutoPreBattle()) return false;
      if (flags.aiTurnAwaitingBattle || flags.aiCmdResume) return false;
      return true;
    }
    function triggerPlayerEndTurnMirror(flags) {
      healStuckMirror(flags);
      return canPlayerInitiateEndTurnMirror(flags);
    }

    pushDeferredWithAge(60000); // "zapomniana" bitwa barbarzynska, siedzi minute w kolejce
    blocked = false;
    const barbFlags = { aiTurnAwaitingBattle: false, aiCmdResume: null };
    ok(triggerPlayerEndTurnMirror(barbFlags) === true,
      '[G2-3] END-TO-END: gracz klika "Zakoncz ture" po tym, jak bitwa barbarzynska utknela w kolejce na 60s bez zadnego modalu -- healStuckMirror odpala sie PRZED sprawdzeniem blokady, wiec TO SAMO klikniecie odblokowuje koniec tury (G2 naprawione -- bez tej naprawy przycisk byl zakleszczony TRWALE, wymagajac Nowej gry/load)');
    ok(hasPendingAutoPreBattle() === false, '[G2-3] kolejka wyczyszczona jako efekt uboczny odblokowania');
  }

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\nkoniec-tury-g1-g2-runda4-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
