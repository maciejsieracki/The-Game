'use strict';
/**
 * end-turn-modal-sequencing-test.cjs
 *
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE (Maciej 2026-08-14, zgłoszenie ze zrzutem):
 * "nie powinny nachodzić na siebie kolejne zdarzenia podczas zakończenia tury. Z jednej
 * strony wysłało mnie audiencję dyplomatyczną, a z drugiej strony zaraz była bitwa, która
 * na to wyszła." + trzeci objaw (ten sam dzień): prompt "połącz nowo wyprodukowaną jednostkę
 * z armią" wyskakuje PODCZAS przetwarzania tur AI/barbarzyńców, zamiast po ich zakończeniu.
 *
 * PRZYCZYNA WSPÓLNA (recon main.ts, pełny opis: dyspozycje/PYTANIA-OTWARTE.md, nagłówek
 * "Recon zakończony"): żadna z trzech funkcji otwierających modal end-of-turu
 * (showDiplomacyAudience / showPreBattle / showArmyMergePanel) nie sprawdzała, czy INNY
 * modal end-of-turu jest już otwarty, i żaden z wyzwalaczy (rAF pierwszego kontaktu, pętla
 * AI, tick barbarzyńców, blok `finally` w triggerPlayerEndTurn) nie czekał, aż gracz
 * faktycznie zamknie poprzedni modal.
 *
 * FIX (main.ts + ui/preBattle.ts):
 *  1) showPreBattle() (ui/preBattle.ts) dostał guard: automatyczne wywołanie
 *     (opts.auto===true, JEDYNE miejsce to launchIncomingMapFieldBattle — atak AI/
 *     barbarzyńców w trakcie end-of-turu) + inny modal końca tury (audiencja / army-merge,
 *     wstrzyknięte przez configurePreBattle({isOtherEndTurnModalOpen})) już otwarty -->
 *     odłóż (deferredAutoRequest), NIE pokazuj na wierzchu. Ręczne ataki gracza (bez
 *     opts.auto) NIGDY nie sprawdzają tego hooka -- pokazują się natychmiast, bez zmian.
 *  2) promptMergeIfCoLocated/flushDeferredMergePrompts (main.ts) odraczają scalenie armii
 *     nie tylko gdy endTurnInProgress, ale też gdy isPreBattleOpen()||isDiplomacyAudienceOpen()
 *     -- `finally` w triggerPlayerEndTurn gasi endTurnInProgress ZANIM gracz zdąży zamknąć
 *     preBattle otwarty w trakcie fazy AI/barbarzyńców (bitwa jest asynchroniczna względem
 *     `await runAiPhase()`).
 *  3) canAutoOpenDiploAudience (main.ts) dostał brakujący kierunek: sprawdza teraz też
 *     isArmyMergePanelOpen(), nie tylko isPreBattleOpen().
 *  4) Retry/flush po zamknięciu blokującego modala: finally blok, onMerge/onSeparate
 *     (armyMergePanel), onBack (diplomacyAudience) wołają flushDeferredMergePrompts() +
 *     flushDeferredAutoPreBattle().
 *
 * Dwie części:
 *  A) TEKSTOWY PIN na src/main.ts + src/ui/preBattle.ts (wzorzec z innych testów tej sesji,
 *     np. pre-battle-retreat-exhausted-test.cjs) -- pinuje DOKŁADNE formuły guardów, żeby
 *     przyszła zmiana, która po cichu je rozluźni, dała FAIL.
 *  B) REALNA regresja UI (esbuild + jsdom) -- bundluje NAPRAWDĘ ui/preBattle.ts +
 *     ui/armyMergePanel.ts (dzielą TEN SAM, też realny, ui/escapeOverlayStack.ts w jednym
 *     bundlu) i odtwarza dosłownie zgłoszony scenariusz: preBattle otwarty (atak AI/
 *     barbarzyńcy w trakcie end-of-turu) + w tym samym momencie kończy się produkcja
 *     jednostki współlokowanej z inną -- merge panel NIE MOŻE się otworzyć, dopóki
 *     preBattle nie zostanie zamknięte. Dowodzi też, że automatyczne preBattle odłożone za
 *     zablokowanym audience/merge panelem pokazuje się PO zamknięciu blokady (nie ginie),
 *     a ręczny atak gracza (bez opts.auto) NIGDY nie jest odraczany.
 *
 * OGRANICZENIE UCZCIWIE PRZYZNANE (ten sam wzorzec co reszta testów tej sesji): main.ts
 * (27+ tys. linii, monolityczny bootstrap zależny od document/window/three.js, bez
 * eksportowanych funkcji) nie da się zbundlować do tego node'owego harnessu -- guardy
 * promptMergeIfCoLocated/flushDeferredMergePrompts/canAutoOpenDiploAudience są więc
 * pinowane TEKSTOWO (część A) i, w części B, mirrorowane jedną, prostą funkcją, której
 * treść jest identycznym odbiciem realnej formuły (weryfikowana wprost przez pin A, nie
 * przez domysł) -- ale isPreBattleOpen()/isArmyMergePanelOpen()/showPreBattle/
 * showArmyMergePanel użyte w mirrorze SĄ prawdziwym, zbundlowanym kodem produkcyjnym, nie
 * atrapą.
 *
 * Usage (z gra/): node tools/end-turn-modal-sequencing-test.cjs
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

// A1) promptMergeIfCoLocated: guard rozszerzony o preBattle/audiencję, nie tylko endTurnInProgress.
{
  const fnStart = mainSrc.indexOf('function promptMergeIfCoLocated(');
  ok(fnStart >= 0, '[A1] znaleziono function promptMergeIfCoLocated( w main.ts');
  const guardIdx = fnStart >= 0
    ? mainSrc.indexOf('if (endTurnInProgress || isPreBattleOpen() || isDiplomacyAudienceOpen()) {', fnStart)
    : -1;
  ok(guardIdx > fnStart && guardIdx - fnStart < 4000,
    '[A1] promptMergeIfCoLocated odracza scalenie gdy endTurnInProgress LUB isPreBattleOpen() LUB isDiplomacyAudienceOpen() (nie tylko endTurnInProgress)');
}

// A2) flushDeferredMergePrompts: ten sam dodatkowy guard przy flushu.
{
  const fnStart = mainSrc.indexOf('function flushDeferredMergePrompts(): void {');
  ok(fnStart >= 0, '[A2] znaleziono function flushDeferredMergePrompts( w main.ts');
  const guardIdx = fnStart >= 0
    ? mainSrc.indexOf('if (isPreBattleOpen() || isDiplomacyAudienceOpen()) return;', fnStart)
    : -1;
  ok(guardIdx > fnStart && guardIdx - fnStart < 800,
    '[A2] flushDeferredMergePrompts nie flushuje na wierzch otwartego preBattle/audiencji');
}

// A3) canAutoOpenDiploAudience: brakujący kierunek -- sprawdza teraz też isArmyMergePanelOpen().
{
  const fnStart = mainSrc.indexOf('function canAutoOpenDiploAudience(): boolean {');
  ok(fnStart >= 0, '[A3] znaleziono function canAutoOpenDiploAudience( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    }', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  ok(/if \(isArmyMergePanelOpen\(\)\) return false;/.test(fnBody),
    '[A3] canAutoOpenDiploAudience zwraca false, gdy panel scalenia armii jest otwarty (brakujący kierunek z reconu)');
  ok(/isPreBattleOpen\(\)/.test(fnBody),
    '[A3 kontrola] canAutoOpenDiploAudience nadal sprawdza isPreBattleOpen() (istniejący guard nienaruszony)');
}

// A4) JEDYNE automatyczne wywołanie showPreBattle (launchIncomingMapFieldBattle) dostaje auto:true.
{
  const fnStart = mainSrc.indexOf('function launchIncomingMapFieldBattle(');
  ok(fnStart >= 0, '[A4] znaleziono function launchIncomingMapFieldBattle( w main.ts');
  const callIdx = fnStart >= 0 ? mainSrc.indexOf('showPreBattle(pbInfo, {', fnStart) : -1;
  ok(callIdx > fnStart, '[A4] znaleziono wywołanie showPreBattle(pbInfo, {... w launchIncomingMapFieldBattle');
  const optsIdx = callIdx >= 0 ? mainSrc.indexOf('auto: true,', callIdx) : -1;
  const nextFnIdx = mainSrc.indexOf('\n    function ', fnStart + 1);
  ok(optsIdx > callIdx && (nextFnIdx < 0 || optsIdx < nextFnIdx),
    '[A4] to wywołanie showPreBattle przekazuje { ..., auto: true } -- JEDYNE automatyczne wywołanie w kodzie');
}

// A5) Dwa RĘCZNE wywołania showPreBattle (atak gracza jednostka->jednostka, szturm gracza)
//     NIE dostają auto:true -- kontrola negatywna (manualne ataki nie są odraczane).
{
  const manualFnNames = ['function openPlayerMapUnitAttackCore(', 'function launchSiegeStormFromMap('];
  for (const marker of manualFnNames) {
    const fnStart = mainSrc.indexOf(marker);
    ok(fnStart >= 0, '[A5] znaleziono ' + marker + ' w main.ts');
    const callIdx = fnStart >= 0 ? mainSrc.indexOf('showPreBattle(', fnStart) : -1;
    ok(callIdx > fnStart, '[A5] znaleziono wywołanie showPreBattle w ' + marker);
    const endIdx = callIdx >= 0 ? mainSrc.indexOf("{ defaultAction: 'manual' });", callIdx) : -1;
    ok(endIdx > callIdx && endIdx - callIdx < 4000,
      '[A5] ' + marker + ': showPreBattle kończy się dokładnie { defaultAction: \'manual\' } -- BEZ auto:true (ręczna akcja gracza, nigdy nie odraczana)');
  }
}

// A6) configurePreBattle (oba miejsca wywołania) wpina isOtherEndTurnModalOpen.
{
  const matches = mainSrc.match(/isOtherEndTurnModalOpen: \(\) => isDiplomacyAudienceOpen\(\) \|\| isArmyMergePanelOpen\(\),/g) || [];
  ok(matches.length === 2,
    '[A6] configurePreBattle wpięte DOKŁADNIE w 2 miejscach (init + reset nowej gry) z hookiem isOtherEndTurnModalOpen (got ' + matches.length + ')');
}

// A7) finally w triggerPlayerEndTurn woła flushDeferredAutoPreBattle() PO flushDeferredMergePrompts().
{
  const finallyIdx = mainSrc.indexOf('} finally {\n          endTurnTransition();');
  ok(finallyIdx >= 0, '[A7] znaleziono blok finally triggerPlayerEndTurn');
  const revealsIdx = finallyIdx >= 0 ? mainSrc.indexOf('flushDeferredPlayerUnitReveals();', finallyIdx) : -1;
  const mergeIdx = revealsIdx >= 0 ? mainSrc.indexOf('flushDeferredMergePrompts();', revealsIdx) : -1;
  const autoPbIdx = mergeIdx >= 0 ? mainSrc.indexOf('flushDeferredAutoPreBattle();', mergeIdx) : -1;
  ok(revealsIdx > finallyIdx && mergeIdx > revealsIdx && autoPbIdx > mergeIdx && autoPbIdx - finallyIdx < 2200,
    '[A7] finally woła flushDeferredPlayerUnitReveals() -> flushDeferredMergePrompts() -> flushDeferredAutoPreBattle() w tej kolejności');
}

// A8) preBattle.ts: showPreBattle ma guard "auto + isOtherEndTurnModalOpen -> odłóż" PRZED
//     jakąkolwiek mutacją DOM (przed hidePreBattle()/showMapScrim()).
{
  const fnStart = preBattleSrc.indexOf('export function showPreBattle(');
  ok(fnStart >= 0, '[A8] znaleziono export function showPreBattle( w ui/preBattle.ts');
  const guardIdx = fnStart >= 0
    ? preBattleSrc.indexOf("if (opts?.auto === true && pbCfg.isOtherEndTurnModalOpen?.() === true) {", fnStart)
    : -1;
  const hideCallIdx = fnStart >= 0 ? preBattleSrc.indexOf('hidePreBattle();', fnStart) : -1;
  ok(guardIdx > fnStart && hideCallIdx > guardIdx,
    '[A8] guard automatyczny w showPreBattle stoi PRZED hidePreBattle() -- odłożone żądanie nie dotyka DOM w ogóle');
  const deferIdx = guardIdx >= 0 ? preBattleSrc.indexOf('deferredAutoRequest = { info, cb, opts };', guardIdx) : -1;
  const returnIdx = deferIdx >= 0 ? preBattleSrc.indexOf('return;', deferIdx) : -1;
  ok(deferIdx > guardIdx && returnIdx > deferIdx && returnIdx - deferIdx < 60,
    '[A8] po zapamiętaniu żądania funkcja robi return -- nie kontynuuje budowy overlayu');
}

// A9) preBattle.ts: flushDeferredAutoPreBattle re-sprawdza blokadę PRZED ponownym pokazaniem.
{
  const fnStart = preBattleSrc.indexOf('export function flushDeferredAutoPreBattle(): void {');
  ok(fnStart >= 0, '[A9] znaleziono export function flushDeferredAutoPreBattle( w ui/preBattle.ts');
  const fnBody = fnStart >= 0 ? preBattleSrc.slice(fnStart, fnStart + 400) : '';
  ok(/if \(isPreBattleOpen\(\) \|\| pbCfg\.isOtherEndTurnModalOpen\?\.\(\) === true\) return;/.test(fnBody),
    '[A9] flushDeferredAutoPreBattle nie otwiera ponownie, jeśli preBattle już otwarty ALBO blokada nadal aktywna');
}

// ---------------------------------------------------------------------------
// B) REALNA regresja UI: bundluje ui/preBattle.ts + ui/armyMergePanel.ts (dzielą jeden,
//    też realny, ui/escapeOverlayStack.ts) i odtwarza zgłoszony scenariusz.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[end-turn-modal-sequencing-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.end-turn-modal-sequencing-entry.ts');
  const OUT = path.join(__dirname, '.end-turn-modal-sequencing-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'eot-modal-seq-brandAssets-stub.ts');

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
  fs.writeFileSync(path.join(STUB_DIR, 'eot-modal-seq-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'eot-modal-seq-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'eot-modal-seq-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "} from '../src/ui/preBattle.ts';",
      "export { showArmyMergePanel, hideArmyMergePanel, isArmyMergePanelOpen } from '../src/ui/armyMergePanel.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-eot-modal-seq',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'eot-modal-seq-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'eot-modal-seq-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'eot-modal-seq-hud-stub.ts'),
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
    showArmyMergePanel, hideArmyMergePanel, isArmyMergePanelOpen,
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;

  const baseInfo = {
    atakujacy: {
      nazwa: 'Barbarzyńcy', ownerId: 99,
      units: [{ nazwa: 'Wojownik', kategoria: 'Wrecz', hp: 10, maxHp: 10, atak: 5 }],
    },
    obronca: {
      nazwa: 'Zwiadowca', ownerId: 0,
      units: [{ nazwa: 'Zwiadowca', kategoria: 'Wrecz', hp: 8, maxHp: 8, atak: 2 }],
    },
    teren: 'Rownina',
    szanseAtkPct: 30,
    miejsce: 'Pole',
    tura: 12,
    canRetreat: false,
  };

  // isOtherEndTurnModalOpen: sterowalny w teście flagą `blocked` -- mirror hooka realnie
  // wpiętego przez main.ts (isDiplomacyAudienceOpen() || isArmyMergePanelOpen()), tu
  // uproszczony do jednej flagi (audiencja jest zbyt ciężka do zbundlowania -- pinowana
  // tekstowo w części A6; ten hook TU jest wywoływany identycznie, więc dowodzi
  // mechanizmu guard+queue niezależnie od tego, KTO go zwraca true).
  let blocked = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => blocked });

  // -------------------------------------------------------------------------
  // B1) Automatyczne preBattle (auto:true) NIE otwiera się, gdy inny modal jest otwarty.
  // -------------------------------------------------------------------------
  blocked = true;
  let autoResolved = false;
  showPreBattle(
    baseInfo,
    { onAuto: () => { autoResolved = true; }, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false,
    '[B1] showPreBattle({auto:true}) NIE otwiera overlayu, gdy isOtherEndTurnModalOpen()===true (audiencja/merge zablokowane)');

  // Flush podczas gdy blokada WCIĄŻ aktywna -- no-op, request zostaje w kolejce.
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === false,
    '[B1b] flushDeferredAutoPreBattle() podczas WCIĄŻ aktywnej blokady pozostaje no-opem');

  // Blokada znika (gracz zamknął audiencję/merge) -- flush pokazuje ODŁOŻONE żądanie.
  blocked = false;
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true,
    '[B1c] flushDeferredAutoPreBattle() PO zniknięciu blokady pokazuje odłożone preBattle (żądanie nie zginęło)');
  const titleEl1 = document.querySelector('.pb-ttl');
  ok(!!titleEl1 && /Pole/.test(titleEl1.textContent || ''),
    '[B1c] pokazany overlay to DOKŁADNIE to samo odłożone żądanie (miejsce="Pole" z baseInfo)');
  hidePreBattle();
  ok(autoResolved === false, '[B1 kontrola] onAuto nie odpalił się sam z siebie -- to gracz decyduje po otwarciu');

  // -------------------------------------------------------------------------
  // B2) Kontrola: RĘCZNY atak gracza (bez opts.auto) NIGDY nie jest odraczany,
  //     nawet gdy inny modal jest "otwarty" wg hooka.
  // -------------------------------------------------------------------------
  blocked = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { defaultAction: 'manual' }, // BEZ auto:true -- dokładnie jak ręczne wywołania w main.ts
  );
  ok(isPreBattleOpen() === true,
    '[B2] ręczny atak gracza (bez auto:true) pokazuje się NATYCHMIAST, mimo isOtherEndTurnModalOpen()===true -- manualne akcje nigdy nie czekają');
  hidePreBattle();
  blocked = false;

  // -------------------------------------------------------------------------
  // B3) SCENARIUSZ ZE ZGŁOSZENIA: preBattle otwarty (atak AI/barbarzyńcy w trakcie
  //     end-of-turu) + w tym samym momencie kończy się produkcja jednostki
  //     współlokowanej z inną -- merge panel NIE MOŻE się otworzyć, dopóki
  //     preBattle nie zostanie zamknięte przez gracza.
  // -------------------------------------------------------------------------
  // Mirror main.ts (pinowany tekstowo w A1/A2 powyżej): decyzja "czy pokazać merge panel
  // teraz, czy odłożyć" na podstawie isPreBattleOpen() PRAWDZIWEGO, zbundlowanego modułu.
  const deferredMergeQueue = [];
  function promptMergeIfCoLocatedMirror(req) {
    if (isPreBattleOpen()) { deferredMergeQueue.push(req); return; }
    showArmyMergePanel(req);
  }
  function flushDeferredMergeMirror() {
    if (deferredMergeQueue.length === 0) return;
    if (isArmyMergePanelOpen() || isPreBattleOpen()) return;
    const next = deferredMergeQueue.shift();
    promptMergeIfCoLocatedMirror(next);
  }

  const mergeReq = {
    hexLabel: '(4,7)',
    existing: [{ id: 'u1', name: 'Legionista' }],
    arriving: { id: 'u2', name: 'Legionista (nowy)' },
    onMerge: () => {},
    onSeparate: () => {},
  };

  // 1) Atak AI/barbarzyńcy w trakcie end-of-turu otwiera preBattle (auto:true).
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === true, '[B3] krok 1: preBattle otwarty (atak AI/barbarzyńcy)');

  // 2) W TYM SAMYM MOMENCIE kończy się produkcja jednostki współlokowanej -- merge panel
  //    PRÓBUJE się otworzyć, ale musi się odłożyć.
  promptMergeIfCoLocatedMirror(mergeReq);
  ok(isArmyMergePanelOpen() === false,
    '[B3] krok 2: merge panel NIE otworzył się, dopóki preBattle jest na ekranie (sedno zgłoszenia)');
  ok(isPreBattleOpen() === true,
    '[B3] krok 2: preBattle POZOSTAJE jedynym otwartym modalem -- brak nachodzenia na siebie');
  ok(deferredMergeQueue.length === 1,
    '[B3] krok 2: żądanie scalenia trafiło do kolejki, nie zginęło');

  // 3) Gracz zamyka preBattle (Auto/Bitwa/Wycofaj) -- to jedyna droga do hidePreBattle().
  hidePreBattle();
  ok(isPreBattleOpen() === false, '[B3] krok 3: preBattle zamknięty przez gracza');
  ok(isArmyMergePanelOpen() === false,
    '[B3] krok 3: merge panel WCIĄŻ zamknięty od razu po zamknięciu preBattle -- pojawia się dopiero po jawnym flushu (kolejno, nie automagicznie w tym samym ticku)');

  // 4) Flush (main.ts woła to z finally / onBack / onMerge-onSeparate) -- TERAZ merge panel
  //    może się pokazać, preBattle już zamknięty.
  flushDeferredMergeMirror();
  ok(isArmyMergePanelOpen() === true,
    '[B3] krok 4: PO zamknięciu preBattle merge panel pokazuje się -- żądanie nie zginęło, modale pokazują się PO KOLEI');
  ok(isPreBattleOpen() === false,
    '[B3] krok 4 kontrola: preBattle nadal zamknięty -- w żadnym momencie sceny B3 oba modale nie były otwarte jednocześnie');
  hideArmyMergePanel();

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\nend-turn-modal-sequencing-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
