'use strict';
/**
 * koniec-tury-f1-f4-runda3-test.cjs
 *
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE, RUNDA 3 -- naprawa czterech znalezisk z
 * werdyktu Evaluatora FAIL na commit `136fefbb` (dyspozycje/PYTANIA-OTWARTE.md, sekcja
 * "Evaluator: N1 runda 2 -- „bitwa w kolejce ≠ bitwa osierocona" (136fefbb) -- WERDYKT: FAIL").
 *
 * F1 (BLOKER) -- finishIncomingBattleUi() w main.ts wołało updateHud()/refreshD1bHud()
 *   (które synchronicznie wołają canEndTurn() -> healStaleEndTurnBlockers()) PRZED
 *   onResolved() (dla ataku AI: () => { void runAiPhase(); }). W tym momencie preBattle jest
 *   już zamknięty i kolejka deferredAutoRequests pusta (TA bitwa właśnie się kończy), więc
 *   gałąź 1 healStaleEndTurnBlockers() widziała aiCmdResume jako osierocony i kasowała go
 *   ZANIM runAiPhase() zdążył go poprawnie skonsumować -- cała faza AI leciała drugi raz od
 *   zera. Naprawa: flaga `battleUiResolving`, ustawiana na czas synchronicznego okna
 *   updateHud()/refreshD1bHud()/onResolved() w finishIncomingBattleUi() (try/finally),
 *   sprawdzana przez gałąź 1 jako dodatkowy warunek obok hasPendingAutoPreBattle(). Kolejność
 *   wywołań w finishIncomingBattleUi NIE ZMIENIONA (reorderowanie onResolved() przed
 *   updateHud() odrzucone -- zbyt duże ryzyko bez weryfikacji wszystkich 3 handlerów × 5
 *   call site'ów).
 * F2 (poważne, ryzyko wniesione przez rundę 2) -- runda 2 uzależniła całą gałąź 1 od
 *   hasPendingAutoPreBattle() BEZ ŻADNEGO limitu czasu -- zalegające żądanie w kolejce
 *   wyłączałoby gałąź 1 TRWALE (twarda blokada "Zakończ turę" zamiast odwracalnej
 *   degradacji). Naprawa: próg 8000 ms (ta sama wartość co istniejący wzorzec
 *   `stuckMs > 8000` w gałęzi 4 tej samej funkcji) -- po przekroczeniu, żądanie jest
 *   uznane za martwe: gałąź 1 mimo hasPendingAutoPreBattle()===true CZYŚCI flagi ORAZ
 *   kolejkę (clearDeferredAutoPreBattleQueue), z console.warn.
 * F3 (średnie) -- canPlayerInitiateEndTurn sprawdzało goły isPreBattleOpen(), nie widząc
 *   bitwy BARBARZYŃSKIEJ odroczonej do kolejki (aiCmdResume===null dla tej ścieżki -- gałąź
 *   "aiTurnAwaitingBattle||aiCmdResume" się nie stosuje). Naprawa: warunek rozszerzony o
 *   `|| hasPendingAutoPreBattle()`.
 * F4 (drobne) -- deferredAutoRequests (ui/preBattle.ts) nie miała ŻADNEGO resetu --
 *   przeżywała Nową grę / wczytanie bez pełnego reload strony. Naprawa: nowy eksport
 *   `clearDeferredAutoPreBattleQueue()`, wołany w resetEndTurnBlockers().
 *
 * Wzorzec identyczny jak heal-stale-blockers-pending-battle-test.cjs / end-turn-modal-
 * sequencing-test.cjs / barbarzyncy-podwojny-atak-prebattle-test.cjs -- main.ts (30+ tys.
 * linii, monolityczny bootstrap zależny od document/window/three.js) nie da się zbundlować
 * do node'owego harnessu, więc:
 *  A) TEKSTOWY PIN na main.ts -- dowodzi, że naprawa faktycznie STOI w kodzie (formuła,
 *     kolejność, wywołania), nie tylko że "powinna" tam być.
 *  B)+C) REALNA regresja: bundluje NAPRAWDĘ ui/preBattle.ts (esbuild + jsdom) i odtwarza
 *     zachowanie kolejki/timerów na prawdziwym module, karmiąc nim mirror-e formuł
 *     pinowanych bajt-w-bajt w części A (dryf main.ts daje FAIL w A zanim mirror zdąży się
 *     zdezaktualizować).
 *
 * Usage (z gra/): node tools/koniec-tury-f1-f4-runda3-test.cjs
 */
const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// A) PIN TEKSTOWY na src/main.ts + src/ui/preBattle.ts
// ---------------------------------------------------------------------------
const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const PREBATTLE_TS = path.join(__dirname, '..', 'src', 'ui', 'preBattle.ts');
const preBattleSrc = fs.readFileSync(PREBATTLE_TS, 'utf8');

// --- F1 -----------------------------------------------------------------
{
  ok(/let battleUiResolving = false;/.test(mainSrc),
    '[F1-A1] main.ts deklaruje `let battleUiResolving = false;`');

  const fnStart = mainSrc.indexOf('function finishIncomingBattleUi(): void {');
  ok(fnStart >= 0, '[F1-A2] znaleziono function finishIncomingBattleUi( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n      }', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';

  ok(/battleUiResolving = true;\s*\n\s*try \{\s*\n\s*updateHud\(\);\s*\n\s*refreshD1bHud\(\);\s*\n\s*onResolved\(\);\s*\n\s*\} finally \{\s*\n\s*battleUiResolving = false;\s*\n\s*\}/.test(fnBody),
    '[F1-A3] finishIncomingBattleUi: battleUiResolving=true PRZED try{updateHud();refreshD1bHud();onResolved();}finally{battleUiResolving=false;} -- kolejność wywołań NIETKNIĘTA, tylko owinięta flagą');

  // Kontrola: onResolved() nadal PRZED flushDeferredAutoPreBattle() (pin z barbarzyncy-
  // podwojny-atak-prebattle-test.cjs musi dalej być prawdziwy -- nie duplikujemy całego
  // testu, tylko potwierdzamy że ten fakt przetrwał tę naprawę).
  const onResolvedIdx = fnBody.indexOf('onResolved();');
  const flushIdx = fnBody.indexOf('flushDeferredAutoPreBattle();');
  ok(onResolvedIdx >= 0 && flushIdx > onResolvedIdx,
    '[F1-A4 kontrola] flushDeferredAutoPreBattle() nadal PO onResolved() (niezmienione przez F1)');

  // Gałąź 1 healStaleEndTurnBlockers honoruje battleUiResolving.
  const hsStart = mainSrc.indexOf('function healStaleEndTurnBlockers(): void {');
  const hsEnd = hsStart >= 0 ? mainSrc.indexOf('\n    function canPlayerInitiateEndTurn', hsStart) : -1;
  const hsBody = (hsStart >= 0 && hsEnd > hsStart) ? mainSrc.slice(hsStart, hsEnd) : '';
  ok(/if \(!preBattle && !battleUiResolving && \(!hasPendingAutoPreBattle\(\) \|\| pendingBattleStuck\) && \(aiTurnAwaitingBattle \|\| aiCmdResume\)\) \{/.test(hsBody),
    '[F1-A5] healStaleEndTurnBlockers gałąź 1 sprawdza !battleUiResolving (dodatkowy warunek obok hasPendingAutoPreBattle/timeout)');
}

// --- F2 -----------------------------------------------------------------
{
  const hsStart = mainSrc.indexOf('function healStaleEndTurnBlockers(): void {');
  const hsEnd = hsStart >= 0 ? mainSrc.indexOf('\n    function canPlayerInitiateEndTurn', hsStart) : -1;
  const hsBody = (hsStart >= 0 && hsEnd > hsStart) ? mainSrc.slice(hsStart, hsEnd) : '';

  ok(/const pendingBattleAgeMs = oldestPendingAutoPreBattleAgeMs\(\);/.test(hsBody),
    '[F2-A1] healStaleEndTurnBlockers czyta oldestPendingAutoPreBattleAgeMs()');
  ok(/const pendingBattleStuck = pendingBattleAgeMs > 8000;/.test(hsBody),
    '[F2-A2] próg "utknięcia" kolejki = 8000 ms -- ta sama wartość co istniejący wzorzec stuckMs>8000 w gałęzi 4');
  ok(/if \(pendingBattleStuck\) \{\s*\n\s*console\.warn\('\[EndTurn\] Deferred preBattle queue stuck >8000ms/.test(hsBody),
    '[F2-A3] gdy pendingBattleStuck, console.warn dedykowany (nie myli się z komunikatem "Clearing stale AI battle resume flags" zwykłej gałęzi 1)');
  ok(/clearDeferredAutoPreBattleQueue\(\);/.test(hsBody),
    '[F2-A4] gałąź 1, przy pendingBattleStuck, woła clearDeferredAutoPreBattleQueue() -- czyści też kolejkę, nie tylko flagi');

  // preBattle.ts: enqueuedAt + oldestPendingAutoPreBattleAgeMs + clearDeferredAutoPreBattleQueue.
  ok(/const deferredAutoRequests: \{ info: PreBattleInfo; cb: PreBattleCallbacks; opts\?: PreBattleOptions; enqueuedAt: number \}\[\] = \[\];/.test(preBattleSrc),
    '[F2-A5] deferredAutoRequests niesie enqueuedAt na element (timestamp kolejkowania)');
  ok(/deferredAutoRequests\.push\(\{ info, cb, opts, enqueuedAt: Date\.now\(\) \}\);/.test(preBattleSrc),
    '[F2-A6] showPreBattle zapisuje enqueuedAt=Date.now() przy odłożeniu do kolejki');
  ok(/export function oldestPendingAutoPreBattleAgeMs\(\): number \{/.test(preBattleSrc),
    '[F2-A7] ui/preBattle.ts eksportuje oldestPendingAutoPreBattleAgeMs');
  ok(/export function clearDeferredAutoPreBattleQueue\(\): void \{/.test(preBattleSrc),
    '[F2-A8] ui/preBattle.ts eksportuje clearDeferredAutoPreBattleQueue');
}

// --- F3 -----------------------------------------------------------------
{
  const fnStart = mainSrc.indexOf('function canPlayerInitiateEndTurn(): boolean {');
  ok(fnStart >= 0, '[F3-A1] znaleziono function canPlayerInitiateEndTurn( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    function hintEndTurnBlocked', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  ok(/if \(isPreBattleOpen\(\) \|\| hasPendingAutoPreBattle\(\)\) \{/.test(fnBody),
    '[F3-A2] canPlayerInitiateEndTurn blokuje też na hasPendingAutoPreBattle() -- nie tylko goły isPreBattleOpen() -- bitwa barbarzyńska odroczona do kolejki (aiCmdResume===null) teraz też blokuje "Zakończ turę"');

  const hintStart = mainSrc.indexOf('function hintEndTurnBlocked(): void {');
  const hintEnd = hintStart >= 0 ? mainSrc.indexOf('\n    function triggerPlayerEndTurn', hintStart) : -1;
  const hintBody = (hintStart >= 0 && hintEnd > hintStart) ? mainSrc.slice(hintStart, hintEnd) : '';
  ok(/if \(isPreBattleOpen\(\) \|\| hasPendingAutoPreBattle\(\)\) \{/.test(hintBody),
    '[F3-A3] hintEndTurnBlocked odbija tę samą rozszerzoną blokadę -- gracz dostaje komunikat, nie ciche zablokowanie przycisku');
}

// --- F4 -----------------------------------------------------------------
{
  const fnStart = mainSrc.indexOf('function resetEndTurnBlockers(reason: string): void {');
  ok(fnStart >= 0, '[F4-A1] znaleziono function resetEndTurnBlockers( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    function prepareSessionForLoad', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  ok(/clearDeferredAutoPreBattleQueue\(\);/.test(fnBody),
    '[F4-A2] resetEndTurnBlockers woła clearDeferredAutoPreBattleQueue() -- Nowa gra/load bez reload strony nie zostawia zaległego żądania z poprzedniej sesji');
  ok(/hasPendingAutoPreBattle\(\)/.test(fnBody),
    '[F4-A3] resetEndTurnBlockers uwzględnia hasPendingAutoPreBattle() też w warunku `had` (console.warn nie milczy, gdy jest realnie co posprzątać)');
}

// A-import) main.ts importuje nowe eksporty obok istniejących z ./ui/preBattle.
{
  const importIdx = mainSrc.indexOf("} from './ui/preBattle';");
  ok(importIdx >= 0, '[A-import] znaleziono import z \'./ui/preBattle\' w main.ts');
  const importBlockStart = mainSrc.lastIndexOf('import {', importIdx);
  const importBlock = importIdx >= 0 && importBlockStart >= 0 ? mainSrc.slice(importBlockStart, importIdx) : '';
  ok(/\boldestPendingAutoPreBattleAgeMs\b/.test(importBlock) && /\bclearDeferredAutoPreBattleQueue\b/.test(importBlock),
    '[A-import] import z ui/preBattle zawiera oldestPendingAutoPreBattleAgeMs oraz clearDeferredAutoPreBattleQueue');
}

// ---------------------------------------------------------------------------
// B) + C) REALNA regresja: bundluje ui/preBattle.ts (ten sam stub-wzorzec co pozostałe
//    testy tego tematu) i dowodzi mechanizmu na prawdziwym kodzie.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[koniec-tury-f1-f4-runda3-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.koniec-tury-f1-f4-runda3-entry.ts');
  const OUT = path.join(__dirname, '.koniec-tury-f1-f4-runda3-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'ktf1f4-brandAssets-stub.ts');

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
  fs.writeFileSync(path.join(STUB_DIR, 'ktf1f4-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'ktf1f4-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'ktf1f4-hud-stub.ts'), [
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
    name: 'stub-brand-assets-ktf1f4',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'ktf1f4-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'ktf1f4-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'ktf1f4-hud-stub.ts'),
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

  let blocked = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => blocked });

  // -------------------------------------------------------------------------
  // Mirror gałęzi 1 healStaleEndTurnBlockers() PO naprawie F1+F2 -- formuła pinowana
  // bajt-w-bajt w [F1-A5] wyżej, więc dryf main.ts daje FAIL w części A zanim ten mirror
  // zdąży się zdezaktualizować. Karmiony PRAWDZIWYMI isPreBattleOpen()/
  // hasPendingAutoPreBattle()/oldestPendingAutoPreBattleAgeMs() z tego samego zbundlowanego
  // ui/preBattle.ts co reszta testu.
  // -------------------------------------------------------------------------
  function healBranch1Mirror(state, battleUiResolving) {
    const preBattle = isPreBattleOpen();
    const pendingBattleAgeMs = oldestPendingAutoPreBattleAgeMs();
    const pendingBattleStuck = pendingBattleAgeMs > 8000;
    if (!preBattle && !battleUiResolving && (!hasPendingAutoPreBattle() || pendingBattleStuck) && (state.aiTurnAwaitingBattle || state.aiCmdResume)) {
      if (pendingBattleStuck) clearDeferredAutoPreBattleQueue();
      state.aiTurnAwaitingBattle = false;
      state.aiCmdResume = null;
    }
    return state;
  }

  // =========================================================================
  // F1 -- SCENARIUSZ END-TO-END: bitwa rozstrzygnięta przez finishIncomingBattleUi(),
  // aiCmdResume PRZEŻYWA cały przebieg do momentu, w którym "runAiPhase" go konsumuje.
  // =========================================================================
  {
    // Mirror finishIncomingBattleUi(): syncUnitsRender/refreshFog pominięte (nie dotykają
    // flag), battleUiResolving=true na czas updateHud()+refreshD1bHud()+onResolved()
    // (KAŻDE z nich w prawdziwym main.ts może wywołać healStaleEndTurnBlockers()
    // synchronicznie przez canEndTurn() w pętli renderu HUD -- tu symulowane jako 2
    // wywołania healBranch1Mirror PRZED "onResolved").
    function mirrorFinishIncomingBattleUi(state, onResolvedFn) {
      let battleUiResolving = true;
      try {
        healBranch1Mirror(state, battleUiResolving); // mirror wnętrza updateHud()
        healBranch1Mirror(state, battleUiResolving); // mirror wnętrza refreshD1bHud()
        onResolvedFn(state);                          // mirror onResolved() -> runAiPhase()
      } finally {
        battleUiResolving = false;
      }
    }

    // Stan DOKŁADNIE jak w zgłoszeniu Evaluatora: bitwa AI rozstrzygnięta (preBattle
    // zamknięty, kolejka pusta -- to jest ta sama bitwa, nic w niej nie czeka), aiCmdResume
    // wciąż niesie stan wznowienia (jeszcze niekonsumowany przez runAiPhase).
    ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === false,
      '[F1-C setup] preBattle zamknięty, kolejka pusta (bitwa właśnie się kończy, nic nie czeka)');

    const state = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 2, cmdIdx: 7 } };
    let seenByRunAiPhase = null;
    mirrorFinishIncomingBattleUi(state, (s) => {
      // mirror runAiPhase(): PIERWSZE co robi to CZYTA aiCmdResume (synchronicznie, przed
      // pierwszym await w prawdziwym kodzie main.ts) -- właśnie to musi przeżyć.
      seenByRunAiPhase = s.aiCmdResume ? { ...s.aiCmdResume } : null;
      s.aiTurnAwaitingBattle = false;
      s.aiCmdResume = null; // runAiPhase konsumuje -- main.ts:25685 aiCmdResume = null;
    });

    ok(seenByRunAiPhase !== null && seenByRunAiPhase.ownerIdx === 2 && seenByRunAiPhase.cmdIdx === 7,
      '[F1-C1] PO NAPRAWIE: runAiPhase (onResolved) widzi aiCmdResume NIETKNIĘTY ({ownerIdx:2,cmdIdx:7}) -- battleUiResolving zapobiegł przedwczesnemu skasowaniu przez healStaleEndTurnBlockers() wołane z updateHud()/refreshD1bHud()');
    ok(state.aiCmdResume === null && state.aiTurnAwaitingBattle === false,
      '[F1-C1] po zakończeniu finishIncomingBattleUi() stan wznowienia poprawnie skonsumowany przez "runAiPhase" (nie osierocony przez gałąź 1)');
  }

  // Kontrola regresji -- BEZ flagi battleUiResolving (symulacja stanu main.ts SPRZED tej
  // naprawy) ten sam scenariusz odtwarza DOKŁADNIE zgłoszony błąd: runAiPhase widzi
  // aiCmdResume===null, bo gałąź 1 skasowała go wcześniej.
  {
    function mirrorFinishIncomingBattleUiBUGGY(state, onResolvedFn) {
      // battleUiResolving na stałe false -- odtwarza main.ts sprzed F1.
      healBranch1Mirror(state, false);
      healBranch1Mirror(state, false);
      onResolvedFn(state);
    }
    const state = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 2, cmdIdx: 7 } };
    let seenByRunAiPhase = 'NIE_WYWOLANO';
    mirrorFinishIncomingBattleUiBUGGY(state, (s) => {
      seenByRunAiPhase = s.aiCmdResume;
    });
    ok(seenByRunAiPhase === null,
      '[F1-C2 kontrola regresji] BEZ battleUiResolving ten sam scenariusz reprodukuje zgłoszony błąd -- runAiPhase widzi aiCmdResume===null (dowód, że test C1 faktycznie testuje naprawę, nie tautologię)');
  }

  // =========================================================================
  // F2 -- TIMEOUT faktycznie się odpala po przekroczeniu progu (8000 ms).
  // =========================================================================
  {
    // "Świeże" odroczenie (age ~=0ms) -- pendingBattleStuck MUSI być false, gałąź 1 MUSI
    // uszanować kolejkę (kontrola negatywna -- nie chcemy timeoutu strzelającego od razu).
    blocked = true;
    showPreBattle(baseInfo, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: true });
    ok(hasPendingAutoPreBattle() === true, '[F2 setup] żądanie odłożone do kolejki (świeże)');
    const ageFresh = oldestPendingAutoPreBattleAgeMs();
    ok(ageFresh >= 0 && ageFresh < 8000, '[F2-C0] świeże żądanie: wiek < 8000ms (got ' + ageFresh + ')');

    const freshState = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 1, cmdIdx: 2 } };
    healBranch1Mirror(freshState, false);
    ok(freshState.aiCmdResume !== null && hasPendingAutoPreBattle() === true,
      '[F2-C1] żądanie świeże (< 8000ms) w kolejce -> gałąź 1 NIE czyści flagi ANI kolejki (zachowanie z rundy 2, bez regresji)');

    // Sprzątanie: cofnij blokadę i flushnij, żeby nie zanieczyścić kolejnych sekcji.
    blocked = false;
    flushDeferredAutoPreBattle();
    hidePreBattle();
    ok(hasPendingAutoPreBattle() === false, '[F2 sprzątanie] kolejka pusta po flushu');

    // Żądanie "zaległe" -- enqueuedAt cofnięty w przeszłość przez tymczasowe podmienienie
    // Date.now (deterministyczne, bez realnego sleep 8+ sekund w bramce).
    const realDateNow = Date.now;
    blocked = true;
    Date.now = () => realDateNow() - 9000; // 9s "temu"
    showPreBattle(baseInfo, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: true });
    Date.now = realDateNow;
    ok(hasPendingAutoPreBattle() === true, '[F2 setup] żądanie "zaległe" (enqueuedAt cofnięty o 9s) w kolejce');
    const ageStuck = oldestPendingAutoPreBattleAgeMs();
    ok(ageStuck > 8000, '[F2-C2] oldestPendingAutoPreBattleAgeMs() poprawnie mierzy zaległość > 8000ms (got ' + ageStuck + ')');

    const stuckState = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 5, cmdIdx: 9 } };
    healBranch1Mirror(stuckState, false);
    ok(stuckState.aiCmdResume === null && stuckState.aiTurnAwaitingBattle === false,
      '[F2-C3] żądanie zaległe (> 8000ms) -> gałąź 1 CZYŚCI flagi mimo hasPendingAutoPreBattle()===true (timeout się odpala)');
    ok(hasPendingAutoPreBattle() === false,
      '[F2-C3] gałąź 1, przy timeout, CZYŚCI też samą kolejkę (clearDeferredAutoPreBattleQueue) -- żądanie uznane za martwe, nie tylko flagi wznowienia');

    // blocked już false (nie zmieniony od czasu ustawienia dla stuck-push) -- zresetuj dla
    // kolejnych sekcji testu, dla porządku.
    blocked = false;
  }

  // =========================================================================
  // F3 -- canPlayerInitiateEndTurn blokuje z odroczoną barbarzyńską bitwą w kolejce.
  // Mirror wg formuły pinowanej bajt-w-bajt w [F3-A2]/[F3-A3] wyżej.
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
    function canPlayerInitiateEndTurnMirrorPREF3(flags) {
      // Formuła SPRZED naprawy F3 -- tylko isPreBattleOpen(), kontrola regresji.
      if (flags.playtestWalkaActive) return false;
      if (flags.isAwaitingFirstPlayerCity) return false;
      if (isPreBattleOpen()) return false;
      if (flags.galleryOn) return false;
      if (flags.gameOver) return false;
      if (flags.endTurnInProgress) return false;
      if (flags.aiTurnAwaitingBattle || flags.aiCmdResume) return false;
      return true;
    }

    ok(hasPendingAutoPreBattle() === false && isPreBattleOpen() === false,
      '[F3 setup] zero stanu bitwy przed testem');

    // Bitwa BARBARZYŃSKA odroczona do kolejki -- aiCmdResume===null, aiTurnAwaitingBattle
    // ===false (barbarzyńcy NIGDY nie ustawiają tych flag, patrz onResolved barbarzyński =
    // no-op w main.ts). isPreBattleOpen()===false (jeszcze się nie pokazała).
    blocked = true;
    showPreBattle(baseInfo, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: true });
    ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === true,
      '[F3 setup] bitwa barbarzyńska odroczona: isPreBattleOpen()===false, hasPendingAutoPreBattle()===true');

    const barbFlags = {
      playtestWalkaActive: false, isAwaitingFirstPlayerCity: false, galleryOn: false,
      gameOver: false, endTurnInProgress: false,
      aiTurnAwaitingBattle: false, aiCmdResume: null, // barbarzyńcy: main.ts nigdy tego nie ustawia
    };
    ok(canPlayerInitiateEndTurnMirror(barbFlags) === false,
      '[F3-C1] PO NAPRAWIE: canPlayerInitiateEndTurn blokuje z barbarzyńską bitwą w kolejce (hasPendingAutoPreBattle()===true) mimo isPreBattleOpen()===false i braku aiCmdResume');
    ok(canPlayerInitiateEndTurnMirrorPREF3(barbFlags) === true,
      '[F3-C2 kontrola regresji] formuła SPRZED naprawy (goły isPreBattleOpen()) zwracała true dla DOKŁADNIE tego samego stanu -- dowód, że F3 naprawia realny defekt, nie tautologię');

    blocked = false;
    flushDeferredAutoPreBattle();
    hidePreBattle();
    ok(hasPendingAutoPreBattle() === false, '[F3 sprzątanie] kolejka pusta');
  }

  // =========================================================================
  // F4 -- Nowa gra czyści kolejkę (resetEndTurnBlockers -> clearDeferredAutoPreBattleQueue).
  // =========================================================================
  {
    blocked = true;
    showPreBattle(baseInfo, { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} }, { auto: true });
    ok(hasPendingAutoPreBattle() === true,
      '[F4 setup] żądanie z "poprzedniej sesji" zalega w kolejce (симuluje main.ts sprzed reloadu)');

    // Mirror DOKŁADNIE wołania z resetEndTurnBlockers -- funkcja realnie eksportowana i
    // realnie wpięta w main.ts (dowiedzione tekstowym pinem [F4-A2] wyżej); tu wołamy ją
    // NAPRAWDĘ (nie mirror) z tego samego zbundlowanego modułu.
    clearDeferredAutoPreBattleQueue();

    ok(hasPendingAutoPreBattle() === false,
      '[F4-C1] po clearDeferredAutoPreBattleQueue() (jak w resetEndTurnBlockers przy Nowej grze) kolejka jest pusta -- żądanie z poprzedniej sesji NIE przeżywa resetu');

    blocked = false;
  }

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\nkoniec-tury-f1-f4-runda3-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
