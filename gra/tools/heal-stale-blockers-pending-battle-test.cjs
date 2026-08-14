'use strict';
/**
 * heal-stale-blockers-pending-battle-test.cjs
 *
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE, notatka N1 (Evaluator FAIL na commit a7de65b0,
 * runda 2, Maciej 2026-08-14 -- dyspozycje/PYTANIA-OTWARTE.md, sekcja Evaluatora dla
 * a7de65b0). Notatka N2 tego samego werdyktu (jednosłotowy deferredAutoRequest ->
 * kolejka FIFO) naprawiona OSOBNYM tematem, commit fe39215a -- ten test dotyczy WYŁĄCZNIE N1.
 *
 * ZGŁOSZENIE (Evaluator): healStaleEndTurnBlockers() w main.ts używała isPreBattleOpen() jako
 * JEDYNEGO sygnału "bitwa w toku". Funkcja jest wołana też z pętli renderu HUD (canEndTurn),
 * nie tylko z próby zakończenia tury -- może więc odpalić się w DOWOLNYM momencie. Naprawa
 * a7de65b0 wprowadziła stan "bitwa czeka w kolejce (deferredAutoRequests), ale
 * isPreBattleOpen()===false" (bo w chwili showPreBattle({auto:true}) inny modal końca tury --
 * audiencja/scalenie armii -- blokował, patrz isOtherEndTurnModalOpen). W tym oknie
 * healStaleEndTurnBlockers() widziała `!preBattle && aiCmdResume` jako prawdziwe i kasowała
 * stan wznowienia fazy AI, mimo że bitwa wcale nie była osierocona -- tylko czekała w
 * kolejce. Skutek: runAiPhase() po rozstrzygnięciu odłożonej bitwy wznawiał się z
 * aiCmdResume===null, więc CAŁA faza AI leciała drugi raz od zera.
 *
 * NAPRAWA (main.ts + ui/preBattle.ts):
 *  1) ui/preBattle.ts: nowy eksport hasPendingAutoPreBattle() -- zwraca
 *     deferredAutoRequests.length > 0 (czy w kolejce czeka co najmniej jedno automatyczne
 *     żądanie preBattle).
 *  2) main.ts: healStaleEndTurnBlockers(), WYŁĄCZNIE gałąź `aiTurnAwaitingBattle ||
 *     aiCmdResume` -- warunek rozszerzony z `!preBattle` na
 *     `!preBattle && !hasPendingAutoPreBattle()`. Pozostałe 3 gałęzie (endTurnInProgress bez
 *     overlayu / osierocony overlay bez endTurnInProgress / stuckMs>8000) NIETKNIĘTE --
 *     Evaluator zgłosił problem WYŁĄCZNIE dla gałęzi aiCmdResume/aiTurnAwaitingBattle.
 *
 * DLACZEGO isOtherEndTurnModalOpen() NIE POTRZEBUJE OSOBNEGO SPRAWDZENIA TUTAJ: żądanie
 * automatycznego preBattle trafia do deferredAutoRequests DOKŁADNIE wtedy, gdy
 * showPreBattle({auto:true}) widzi isPreBattleOpen()||isOtherEndTurnModalOpen() -- czyli
 * hasPendingAutoPreBattle() pokrywa OBIE przyczyny odłożenia, nie tylko kolizję z innym
 * preBattle. main.ts ustawia aiCmdResume/aiTurnAwaitingBattle synchronicznie, w tym samym
 * wywołaniu funkcji, tuż PRZED synchronicznym wywołaniem showPreBattle (launchIncoming-
 * MapFieldBattle, bez żadnego `await` pomiędzy) -- więc nie istnieje klatka renderu, w
 * której render loop mógłby zobaczyć aiCmdResume ustawiony, a żądanie jeszcze NIE trafione
 * do kolejki ani do overlayu (JS jest jednowątkowy, funkcja synchroniczna nie może zostać
 * przerwana w środku). Część C tego testu weryfikuje to bezpośrednio na PRAWDZIWYM,
 * zbundlowanym ui/preBattle.ts.
 *
 * Trzy części (wzorzec identyczny jak end-turn-modal-sequencing-test.cjs /
 * barbarzyncy-podwojny-atak-prebattle-test.cjs -- main.ts, 27+ tys. linii, monolityczny
 * bootstrap zależny od document/window/three.js bez eksportowanych funkcji, nie da się
 * zbundlować do node'owego harnessu):
 *  A) TEKSTOWY PIN na src/main.ts + src/ui/preBattle.ts -- pinuje DOKŁADNĄ formułę
 *     rozszerzonego warunku i eksport hasPendingAutoPreBattle, plus KONTROLA NEGATYWNA: żadna
 *     z pozostałych 3 gałęzi healStaleEndTurnBlockers() nie odwołuje się do
 *     hasPendingAutoPreBattle (dowód, że naprawa nie wykroczyła poza zgłoszony zakres).
 *  B) REALNA regresja UI (esbuild + jsdom): bundluje NAPRAWDĘ ui/preBattle.ts i dowodzi, że
 *     hasPendingAutoPreBattle() poprawnie odzwierciedla stan PRAWDZIWEJ kolejki
 *     deferredAutoRequests -- pusta na starcie, niepusta zaraz po odłożeniu żądania
 *     (isOtherEndTurnModalOpen()===true w chwili showPreBattle), znowu pusta po flushu.
 *  C) SCENARIUSZ REGRESYJNY -- mirror WYŁĄCZNIE gałęzi 1 healStaleEndTurnBlockers()
 *     (formuła pinowana bajt-w-bajt w części A, więc dryf src/main.ts daje FAIL zanim
 *     mirror zdąży się zdezaktualizować), zasilany PRAWDZIWYMI isPreBattleOpen()/
 *     hasPendingAutoPreBattle() z tego samego zbundlowanego modułu co część B:
 *     C1) bitwa odroczona w kolejce (isPreBattleOpen()===false, hasPendingAutoPreBattle()
 *         ===true) + aiCmdResume ustawiony -> healStaleEndTurnBlockers NIE czyści (naprawa
 *         działa -- to dokładnie zgłoszony błąd).
 *     C2) bitwa faktycznie nieistniejąca (isPreBattleOpen()===false, kolejka pusta) +
 *         aiCmdResume ustawiony -> healStaleEndTurnBlockers CZYŚCI (zachowanie oryginalne
 *         zachowane, brak regresji w drugą stronę).
 *     C3) preBattle otwarty (isPreBattleOpen()===true) + aiCmdResume ustawiony -> NIE czyści
 *         (gałąź niezmieniona przez tę naprawę, kontrola).
 *     C4) nic nie czeka (oba flagi false/null) -> no-op, nic do wyczyszczenia (kontrola).
 *
 * Usage (z gra/): node tools/heal-stale-blockers-pending-battle-test.cjs
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

// A1) preBattle.ts eksportuje hasPendingAutoPreBattle -- czysta funkcja odbicia stanu kolejki.
{
  ok(/export function hasPendingAutoPreBattle\(\): boolean \{\s*\n\s*return deferredAutoRequests\.length > 0;\s*\n\s*\}/.test(preBattleSrc),
    '[A1] ui/preBattle.ts eksportuje hasPendingAutoPreBattle() zwracające deferredAutoRequests.length > 0');
}

// A2) main.ts importuje hasPendingAutoPreBattle z ./ui/preBattle obok isPreBattleOpen.
{
  const importIdx = mainSrc.indexOf("} from './ui/preBattle';");
  ok(importIdx >= 0, '[A2] znaleziono import z \'./ui/preBattle\' w main.ts');
  const importBlockStart = mainSrc.lastIndexOf('import {', importIdx);
  const importBlock = importIdx >= 0 && importBlockStart >= 0 ? mainSrc.slice(importBlockStart, importIdx) : '';
  ok(/\bisPreBattleOpen\b/.test(importBlock) && /\bhasPendingAutoPreBattle\b/.test(importBlock),
    '[A2] import z ui/preBattle zawiera zarówno isPreBattleOpen, jak i hasPendingAutoPreBattle');
}

// A3) healStaleEndTurnBlockers, gałąź 1: warunek rozszerzony o !hasPendingAutoPreBattle()
//     (runda 2, N1) ORAZ (runda 3, F1+F2) o !battleUiResolving i timeout kolejki
//     (pendingBattleStuck). Formuła runda 3 pinowana bajt-w-bajt -- patrz test dedykowany
//     koniec-tury-f1-f4-runda3-test.cjs dla scenariuszy behawioralnych F1/F2/F3/F4.
{
  const fnStart = mainSrc.indexOf('function healStaleEndTurnBlockers(): void {');
  ok(fnStart >= 0, '[A3] znaleziono function healStaleEndTurnBlockers( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    function canPlayerInitiateEndTurn', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  ok(/if \(!preBattle && !battleUiResolving && \(!hasPendingAutoPreBattle\(\) \|\| pendingBattleStuck\) && \(aiTurnAwaitingBattle \|\| aiCmdResume\)\) \{/.test(fnBody),
    '[A3] gałąź 1 (aiTurnAwaitingBattle||aiCmdResume) sprawdza DOKŁADNIE !preBattle && !battleUiResolving && (!hasPendingAutoPreBattle()||pendingBattleStuck) -- N1 (runda 2) + F1/F2 (runda 3) naprawione formułą pinowaną bajt-w-bajt');

  // A4) KONTROLA NEGATYWNA -- pozostałe 3 gałęzie NIETKNIĘTE (Evaluator zgłosił problem
  //     WYŁĄCZNIE dla gałęzi aiTurnAwaitingBattle||aiCmdResume; scope discipline C-025).
  ok(/if \(endTurnInProgress && !isTurnTransitionActive\(\)\) \{/.test(fnBody),
    '[A4a] gałąź 2 (endTurnInProgress bez overlayu) formuła niezmieniona -- bez hasPendingAutoPreBattle');
  ok(/if \(isTurnTransitionActive\(\) && !endTurnInProgress\) \{/.test(fnBody),
    '[A4b] gałąź 3 (osierocony overlay bez endTurnInProgress) formuła niezmieniona -- bez hasPendingAutoPreBattle');
  ok(/if \(endTurnInProgress && isTurnTransitionActive\(\) && stuckMs > 8000 && !preBattle\) \{/.test(fnBody),
    '[A4c] gałąź 4 (stuckMs>8000 force-clear) formuła niezmieniona -- bez hasPendingAutoPreBattle');
  // Liczymy wystąpienia WYŁĄCZNIE w kodzie wykonywalnym (liniach `if (...)`), nie w
  // komentarzach PL/EN nad gałęzią 1, które celowo tłumaczą hasPendingAutoPreBattle()
  // więcej niż raz.
  const ifLines = fnBody.split('\n').filter(line => /^\s*if \(/.test(line));
  const occurrencesInIfs = ifLines.filter(line => line.includes('hasPendingAutoPreBattle')).length;
  ok(occurrencesInIfs === 1,
    '[A4 kontrola] hasPendingAutoPreBattle() użyte DOKŁADNIE w jednej linii `if (...)` w całej funkcji (wyłącznie gałąź 1), got ' + occurrencesInIfs);
}

// ---------------------------------------------------------------------------
// B) + C) REALNA regresja: bundluje ui/preBattle.ts (ten sam stub-wzorzec co
//    end-turn-modal-sequencing-test.cjs) i dowodzi mechanizmu na prawdziwym kodzie.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[heal-stale-blockers-pending-battle-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.heal-stale-blockers-pending-battle-entry.ts');
  const OUT = path.join(__dirname, '.heal-stale-blockers-pending-battle-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'hsb-pending-battle-brandAssets-stub.ts');

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
  fs.writeFileSync(path.join(STUB_DIR, 'hsb-pending-battle-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'hsb-pending-battle-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'hsb-pending-battle-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "  hasPendingAutoPreBattle,",
      "} from '../src/ui/preBattle.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-hsb-pending-battle',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'hsb-pending-battle-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'hsb-pending-battle-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'hsb-pending-battle-hud-stub.ts'),
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
    hasPendingAutoPreBattle,
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

  // isOtherEndTurnModalOpen mirror -- sterowalny flagą `blocked`, dokładnie jak w
  // end-turn-modal-sequencing-test.cjs (audiencja jest zbyt ciężka do zbundlowania tutaj,
  // hook realnie wpięty przez main.ts jest identyczny bez względu na to KTO zwraca true).
  let blocked = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => blocked });

  // -------------------------------------------------------------------------
  // MIRROR gałęzi 1 healStaleEndTurnBlockers() -- formuła pinowana bajt-w-bajt w części A
  // (test [A3] powyżej), więc jakikolwiek dryf src/main.ts daje FAIL zanim ten mirror
  // zdąży się zdezaktualizować. Zasilany PRAWDZIWYMI isPreBattleOpen()/
  // hasPendingAutoPreBattle() z tego samego zbundlowanego ui/preBattle.ts co część B --
  // NIE atrapa.
  // -------------------------------------------------------------------------
  function healBranch1Mirror(state) {
    const preBattle = isPreBattleOpen();
    if (!preBattle && !hasPendingAutoPreBattle() && (state.aiTurnAwaitingBattle || state.aiCmdResume)) {
      state.aiTurnAwaitingBattle = false;
      state.aiCmdResume = null;
    }
    return state;
  }

  // -------------------------------------------------------------------------
  // B) hasPendingAutoPreBattle() odzwierciedla PRAWDZIWĄ kolejkę deferredAutoRequests.
  // -------------------------------------------------------------------------
  ok(hasPendingAutoPreBattle() === false, '[B0] hasPendingAutoPreBattle() === false na starcie (kolejka pusta)');

  blocked = true; // isOtherEndTurnModalOpen() === true w chwili showPreBattle -> odłożone
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false,
    '[B1] showPreBattle({auto:true}) NIE otworzył overlayu -- isOtherEndTurnModalOpen()===true zablokowało');
  ok(hasPendingAutoPreBattle() === true,
    '[B1] hasPendingAutoPreBattle() === true zaraz po odłożeniu -- DOKŁADNIE okno bugu N1 (isPreBattleOpen()===false, ale bitwa czeka)');

  // -------------------------------------------------------------------------
  // C1) SCENARIUSZ ZE ZGŁOSZENIA: bitwa odroczona w kolejce, aiCmdResume ustawiony ->
  //     healStaleEndTurnBlockers NIE czyści (naprawa N1 działa).
  // -------------------------------------------------------------------------
  const c1 = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 0, cmdIdx: 3 } };
  healBranch1Mirror(c1);
  ok(c1.aiCmdResume !== null && c1.aiTurnAwaitingBattle === true,
    '[C1] bitwa odroczona w kolejce (isPreBattleOpen()===false, hasPendingAutoPreBattle()===true) + aiCmdResume ustawiony -> healStaleEndTurnBlockers NIE kasuje (przed naprawą N1 to FAIL-owało)');

  // -------------------------------------------------------------------------
  // Odblokuj i flushnij -- kolejka wraca do pustej, bitwa faktycznie się pokazuje.
  // -------------------------------------------------------------------------
  blocked = false;
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[B2] flushDeferredAutoPreBattle() po zniknięciu blokady pokazuje odłożone żądanie');
  ok(hasPendingAutoPreBattle() === false, '[B2] hasPendingAutoPreBattle() === false po flushu (kolejka znów pusta)');
  hidePreBattle();
  ok(isPreBattleOpen() === false, '[B2] preBattle zamknięty (gracz rozstrzygnął bitwę)');

  // -------------------------------------------------------------------------
  // C2) KONTROLA -- bitwa faktycznie nieistniejąca (isPreBattleOpen()===false, kolejka
  //     pusta) + aiCmdResume ustawiony -> healStaleEndTurnBlockers CZYŚCI (zachowanie
  //     oryginalne zachowane, brak regresji w drugą stronę).
  // -------------------------------------------------------------------------
  ok(hasPendingAutoPreBattle() === false, '[C2 setup] kolejka pusta przed testem C2');
  const c2 = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 1, cmdIdx: 0 } };
  healBranch1Mirror(c2);
  ok(c2.aiCmdResume === null && c2.aiTurnAwaitingBattle === false,
    '[C2] bitwa faktycznie nieistniejąca (kolejka pusta, preBattle zamknięty) + aiCmdResume ustawiony -> healStaleEndTurnBlockers CZYŚCI (zachowanie sprzed naprawy N1 zachowane)');

  // -------------------------------------------------------------------------
  // C3) KONTROLA -- preBattle otwarty + aiCmdResume ustawiony -> NIE czyści (gałąź
  //     niezmieniona przez naprawę N1, `!preBattle` samo w sobie już blokowało).
  // -------------------------------------------------------------------------
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { defaultAction: 'manual' },
  );
  ok(isPreBattleOpen() === true, '[C3 setup] preBattle otwarty ręcznie');
  const c3 = { aiTurnAwaitingBattle: true, aiCmdResume: { ownerIdx: 2, cmdIdx: 5 } };
  healBranch1Mirror(c3);
  ok(c3.aiCmdResume !== null && c3.aiTurnAwaitingBattle === true,
    '[C3] preBattle otwarty (isPreBattleOpen()===true) + aiCmdResume ustawiony -> NIE kasuje (gałąź niezmieniona przez N1)');
  hidePreBattle();

  // -------------------------------------------------------------------------
  // C4) KONTROLA -- nic nie czeka (obie flagi false/null) -> no-op, nic do wyczyszczenia.
  // -------------------------------------------------------------------------
  ok(isPreBattleOpen() === false && hasPendingAutoPreBattle() === false, '[C4 setup] zero stanu bitwy');
  const c4 = { aiTurnAwaitingBattle: false, aiCmdResume: null };
  healBranch1Mirror(c4);
  ok(c4.aiCmdResume === null && c4.aiTurnAwaitingBattle === false,
    '[C4] brak stanu bitwy do wyczyszczenia -> pozostaje false/null (no-op)');

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\nheal-stale-blockers-pending-battle-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
