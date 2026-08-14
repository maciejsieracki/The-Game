'use strict';
/**
 * diplomacy-audience-close-flush-test.cjs
 *
 * N3 (Evaluator FAIL `a7de65b0`, dyspozycje/PYTANIA-OTWARTE.md sekcja "5. N3", temat
 * P-KONIEC-TURY-ZDARZENIA-NACHODZA-NA-SIEBIE): flush odroczonej bitwy/scalenia armii po
 * zamknięciu audiencji dyplomatycznej odpalał się tylko na `onBack` (klik "Wróć" + Escape).
 * W main.ts było jednak 8 realnych wywołań `hideDiplomacyAudience()` (Evaluator naliczył 9,
 * licząc prawdopodobnie linię importu -- przeliczone tu grepem na nowo, patrz test [A4]);
 * pozostałe 7 zamykało audiencję PO CICHU: `openCityPanelForPlayer`, `closeAllMapToolbarModes`
 * (3 wywołujący z toolbara + 3 z mapToolbar), `toggleWikiFromToolbar`, `openNextOpenDiploProposal`,
 * `ensureDiplomacyUiClosed` (wołane z `selectPlayerUnit` -- dosłowny przykład z werdyktu),
 * `onOpenKnownFactions`, `handleDiploFocusCapital`. Skutek: odroczona bitwa (preBattle w
 * kolejce, czeka na zamknięcie audiencji) przeżywała do najbliższego `finally` NASTĘPNEJ tury
 * zamiast pokazać się od razu po zamknięciu audiencji tymi ścieżkami.
 *
 * FIX (main.ts): nowa funkcja-wrapper `closeDiplomacyAudienceAndFlush()` -- woła
 * `hideDiplomacyAudience()`, POTEM w `requestAnimationFrame` woła
 * `flushDeferredMergePrompts()` + `flushDeferredAutoPreBattle()` (ten sam wzorzec co już
 * istniejący, zaufany flush w `onBack`). Wszystkie 7 wcześniej cichych wywołań podmienione na
 * wrapper; `onBack` (ma już WŁASNY, poprawny flush) zostawiony nietknięty, żeby nie ryzykować
 * regresji w kodzie, który Evaluator już zweryfikował jako poprawny.
 *
 * DLACZEGO RAF, NIE FLUSH SYNCHRONICZNY: część z tych 7 ścieżek w TYM SAMYM ticku od razu
 * OTWIERA kolejny modal (np. `openNextOpenDiploProposal` zamyka audiencję i zaraz otwiera
 * NASTĘPNĄ dla kolejnej propozycji; `closeAllMapToolbarModes` zamyka audiencję i zaraz otwiera
 * listę miast/armii/dyplomacji/tryb budowy). Flush synchroniczny pokazałby preBattle w środku
 * takiej tranzycji -- dokładnie klasa błędu "zdarzenia nachodzą na siebie", którą naprawiał
 * oryginalny commit `a7de65b0`. `flushDeferredAutoPreBattle`/`flushDeferredMergePrompts`
 * re-sprawdzają `isDiplomacyAudienceOpen()`/`isArmyMergePanelOpen()` w chwili wywołania -- gdy
 * odroczone do RAF, ten re-check zdąży zobaczyć nowo otwarty modal (który otworzył się
 * synchronicznie, PRZED odpaleniem RAF) i poprawnie nic nie zrobić, czekając na kolejne
 * zamknięcie.
 *
 * Trzy części:
 *  A) TEKSTOWY PIN na main.ts -- istnienie wrappera z poprawną kolejnością (hide -> RAF ->
 *     oba flushe), migracja WSZYSTKICH 7 wcześniej cichych miejsc, `onBack` NIETKNIĘTY,
 *     i policzenie że w całym pliku zostały DOKŁADNIE 2 gołe wywołania `hideDiplomacyAudience()`
 *     (wewnątrz wrappera + w onBack) -- łapie przyszłe wywołanie, które ominie wrapper.
 *  B) REALNA regresja UI (esbuild + jsdom, bundluje prawdziwy `ui/preBattle.ts`) -- mirror
 *     wrappera (main.ts się nie bundluje, patrz uzasadnienie w innych testach tej sesji,
 *     np. end-turn-modal-sequencing-test.cjs) używa PRAWDZIWEGO, zbundlowanego
 *     `flushDeferredAutoPreBattle`/`isPreBattleOpen`/`showPreBattle`/`configurePreBattle`.
 *     Scenariusz C1 = dosłowny przykład z werdyktu (`ensureDiplomacyUiClosed` przez
 *     `selectPlayerUnit`): odroczona bitwa pokazuje się OD RAZU po zamknięciu audiencji tą
 *     ścieżką, nie czeka do końca tury. Scenariusz C2 = ścieżka tranzycyjna
 *     (`openNextOpenDiploProposal`-podobna): audiencja zamyka się i w TYM SAMYM ticku otwiera
 *     się NOWA -- flush NIE pokazuje bitwy w trakcie tranzycji (dowód, że RAF-deferral chroni
 *     przed dokładnie tą klasą błędu, którą naprawiał `a7de65b0`), a pokazuje ją dopiero gdy
 *     audiencja faktycznie zostaje zamknięta na dobre.
 *  C) KONTROLA MUTACYJNA -- bez flushu w ogóle (dokładnie stan SPRZED tej naprawy) odroczona
 *     bitwa zostaje uwięziona w kolejce na zawsze (aż coś INNEGO ją zflushuje) -- dowodzi, że
 *     test faktycznie mierzy naprawiony mechanizm, nie tautologię.
 *
 * Usage (z gra/): node tools/diplomacy-audience-close-flush-test.cjs
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

// A1) Wrapper istnieje i ma poprawną kolejność: hide -> requestAnimationFrame -> oba flushe.
{
  const fnStart = mainSrc.indexOf('function closeDiplomacyAudienceAndFlush(): void {');
  ok(fnStart >= 0, '[A1] znaleziono function closeDiplomacyAudienceAndFlush( w main.ts');
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    }', fnStart) : -1;
  const fnBody = (fnStart >= 0 && fnEnd > fnStart) ? mainSrc.slice(fnStart, fnEnd) : '';
  const hideIdx = fnBody.indexOf('hideDiplomacyAudience();');
  const rafIdx = fnBody.indexOf('requestAnimationFrame(');
  const mergeIdx = fnBody.indexOf('flushDeferredMergePrompts();');
  const autoPbIdx = fnBody.indexOf('flushDeferredAutoPreBattle();');
  ok(hideIdx >= 0 && rafIdx > hideIdx && mergeIdx > rafIdx && autoPbIdx > mergeIdx,
    '[A1] wrapper woła w tej kolejności: hideDiplomacyAudience() -> requestAnimationFrame(...) -> flushDeferredMergePrompts() -> flushDeferredAutoPreBattle()');
}

// A2) Wszystkie 7 wcześniej cichych miejsc zamknięcia audiencji podmienione na wrapper.
//     Każdy wpis: unikalna kotwica tekstowa przed miejscem wołania + max odległość (żeby nie
//     złapać przypadkiem innego, dalekiego wywołania).
{
  const sites = [
    { label: 'openCityPanelForPlayer', anchor: 'function openCityPanelForPlayer(city: City): void {', maxDist: 400 },
    { label: 'closeAllMapToolbarModes (toolbar + mapToolbar: cities/army/build)', anchor: 'function closeAllMapToolbarModes(): void {', maxDist: 400 },
    { label: 'toggleWikiFromToolbar', anchor: 'function toggleWikiFromToolbar(): void {', maxDist: 400 },
    { label: 'openNextOpenDiploProposal', anchor: 'function openNextOpenDiploProposal(currentOwnerId: number): void {', maxDist: 300 },
    { label: 'ensureDiplomacyUiClosed (wolane z selectPlayerUnit -- doslowny przyklad z werdyktu)', anchor: 'function ensureDiplomacyUiClosed(): void {', maxDist: 300 },
    { label: 'onOpenKnownFactions', anchor: 'onOpenKnownFactions: () => {', maxDist: 200 },
    { label: 'handleDiploFocusCapital', anchor: 'function handleDiploFocusCapital(ownerId: number): void {', maxDist: 300 },
  ];
  for (const site of sites) {
    const anchorIdx = mainSrc.indexOf(site.anchor);
    ok(anchorIdx >= 0, `[A2] znaleziono kotwice dla "${site.label}"`);
    const callIdx = anchorIdx >= 0 ? mainSrc.indexOf('closeDiplomacyAudienceAndFlush();', anchorIdx) : -1;
    const bareIdx = anchorIdx >= 0 ? mainSrc.indexOf('hideDiplomacyAudience();', anchorIdx) : -1;
    ok(callIdx > anchorIdx && callIdx - anchorIdx < site.maxDist,
      `[A2] "${site.label}" wola closeDiplomacyAudienceAndFlush() (nie goly hideDiplomacyAudience()) w rozsadnej odleglosci od kotwicy`);
    ok(bareIdx < 0 || bareIdx > callIdx,
      `[A2] "${site.label}": zaden goly hideDiplomacyAudience() nie stoi PRZED wrapperem w tym miejscu`);
  }
}

// A3) onBack ma WŁASNY, nietknięty flush -- goły hideDiplomacyAudience() bezpośrednio w ciele,
//     zaraz potem WŁASNY blok requestAnimationFrame z tryOpenNextFirstContactCard().
{
  const onBackIdx = mainSrc.indexOf('onBack: () => {');
  ok(onBackIdx >= 0, '[A3] znaleziono onBack: () => { w main.ts');
  const bodyEnd = onBackIdx >= 0 ? mainSrc.indexOf('\n        },', onBackIdx) : -1;
  const body = (onBackIdx >= 0 && bodyEnd > onBackIdx) ? mainSrc.slice(onBackIdx, bodyEnd) : '';
  ok(/^\s*hideDiplomacyAudience\(\);/m.test(body),
    '[A3] onBack woła bezpośrednio goły hideDiplomacyAudience() (NIE przez wrapper -- nietknięty, już miał poprawny flush)');
  ok(/requestAnimationFrame\(\(\) => \{[\s\S]*flushDeferredMergePrompts\(\);[\s\S]*flushDeferredAutoPreBattle\(\);[\s\S]*tryOpenNextFirstContactCard\(\);/.test(body),
    '[A3] onBack zachował własny blok RAF: flushDeferredMergePrompts -> flushDeferredAutoPreBattle -> tryOpenNextFirstContactCard');
}

// A4) Policz WSZYSTKIE gołe wywołania hideDiplomacyAudience() w pliku (bez importu) --
//     musi być DOKŁADNIE 2: wewnątrz wrappera + w onBack. Każde trzecie to regresja (ktoś
//     ominął wrapper przy nowym miejscu zamknięcia audiencji).
{
  const importLineEnd = mainSrc.indexOf('\n', mainSrc.indexOf('showDiplomacyAudience, hideDiplomacyAudience'));
  const bodySrc = mainSrc.slice(importLineEnd);
  const allBareCalls = (bodySrc.match(/hideDiplomacyAudience\(\);/g) || []).length;
  ok(allBareCalls === 2,
    `[A4] main.ts ma DOKLADNIE 2 gole wywolania hideDiplomacyAudience() poza importem (wrapper + onBack) -- got ${allBareCalls}. Nowe miejsce zamkniecia audiencji MUSI isc przez closeDiplomacyAudienceAndFlush().`);
}

// ---------------------------------------------------------------------------
// B) REALNA regresja UI: bundluje prawdziwy ui/preBattle.ts, mirror wrappera main.ts.
// ---------------------------------------------------------------------------
async function runUiPart() {
  const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
  let JSDOM;
  try { ({ JSDOM } = require('jsdom')); }
  catch (e) {
    console.error('[diplomacy-audience-close-flush-test] jsdom missing — npm i -D jsdom');
    process.exit(1);
  }

  const ENTRY = path.join(__dirname, '.diplo-audience-close-flush-entry.ts');
  const OUT = path.join(__dirname, '.diplo-audience-close-flush-bundle.cjs');
  const STUB_DIR = path.resolve(__dirname, '.stubs');
  const BRAND_STUB = path.resolve(STUB_DIR, 'diplo-close-flush-brandAssets-stub.ts');

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
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-leaderPortraits-stub.ts'), [
    "export function leaderPortraitUrl() { return null; }",
    "export function leaderName() { return ''; }",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-audio-stub.ts'), [
    "export function startPreBattleMusic() {}",
    "export function stopPreBattleMusic() {}",
  ].join('\n'), 'utf8');
  fs.writeFileSync(path.join(STUB_DIR, 'diplo-close-flush-hud-stub.ts'), [
    "export function setArmyStackHudSuppressed() {}",
  ].join('\n'), 'utf8');

  fs.writeFileSync(
    ENTRY,
    [
      "export {",
      "  showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle, flushDeferredAutoPreBattle,",
      "} from '../src/ui/preBattle.ts';",
    ].join('\n'),
    'utf8',
  );

  const stubPlugin = {
    name: 'stub-brand-assets-diplo-close-flush',
    setup(build) {
      build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /scienceOwlIcon$/ }, () => ({ path: BRAND_STUB }));
      build.onResolve({ filter: /leaderPortraits$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-leaderPortraits-stub.ts'),
      }));
      build.onResolve({ filter: /muzyka-antyczna$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-audio-stub.ts'),
      }));
      build.onResolve({ filter: /hud$/ }, () => ({
        path: path.join(STUB_DIR, 'diplo-close-flush-hud-stub.ts'),
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
  } = require(OUT);

  const dom = new JSDOM('<!DOCTYPE html><html><head></head><body></body></html>');
  global.document = dom.window.document;
  global.window = dom.window;
  global.HTMLElement = dom.window.HTMLElement;
  global.KeyboardEvent = dom.window.KeyboardEvent;
  // Mirror `requestAnimationFrame` -- wzorzec juz uzywany w innych testach tej sesji
  // (np. diplomacy-basket-duplicate-ui-test.cjs): setTimeout(cb,0) odpala PO biezacym
  // synchronicznym stosie wywolan, dokladnie tak jak realne RAF w przegladarce robi wzgledem
  // reszty kodu main.ts w tym samym ticku.
  global.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  const waitForRaf = () => new Promise((resolve) => setTimeout(resolve, 10));

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

  // isOtherEndTurnModalOpen mirror -- sterowalny flagą `audienceOpen`, dokładnie jak realny
  // hook main.ts (isDiplomacyAudienceOpen() || isArmyMergePanelOpen()), tu uproszczony do
  // audiencji (jedyny modal istotny dla N3; army-merge jest już pokryty przez
  // end-turn-modal-sequencing-test.cjs).
  let audienceOpen = false;
  configurePreBattle({ isOtherEndTurnModalOpen: () => audienceOpen });

  /** Mirror main.ts closeDiplomacyAudienceAndFlush() -- pinowany tekstowo w [A1] wyżej,
   * używa PRAWDZIWEGO flushDeferredAutoPreBattle (nie atrapy). */
  function closeDiplomacyAudienceAndFlushMirror() {
    audienceOpen = false; // mirror hideDiplomacyAudience()
    setTimeout(() => {
      flushDeferredAutoPreBattle();
    }, 0);
  }

  // -------------------------------------------------------------------------
  // C1) DOSŁOWNY PRZYKŁAD Z WERDYKTU: ensureDiplomacyUiClosed / selectPlayerUnit.
  //     Audiencja otwarta, bitwa AI/barbarzyńców próbuje się pokazać -- blokowana, odłożona.
  //     Gracz zaznacza jednostkę (ensureDiplomacyUiClosed zamyka audiencję) -- bitwa MUSI
  //     pokazać się od razu, nie czekać do końca tury.
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false,
    '[C1] krok 1: audiencja otwarta -- automatyczna bitwa AI/barbarzyńców odroczona, NIE otwiera się na wierzchu audiencji');

  closeDiplomacyAudienceAndFlushMirror(); // == selectPlayerUnit -> ensureDiplomacyUiClosed
  ok(isPreBattleOpen() === false,
    '[C1] krok 2: TUŻ PO zamknięciu audiencji (przed RAF) preBattle jeszcze nie skoczył na wierzch w środku synchronicznego kodu selekcji jednostki');

  await waitForRaf();
  ok(isPreBattleOpen() === true,
    '[C1] krok 3 (SEDNO N3): po RAF (odpalonym przez ensureDiplomacyUiClosed/selectPlayerUnit) odroczona bitwa POKAZUJE SIĘ NATYCHMIAST -- nie czeka do finally następnej tury');
  const titleC1 = document.querySelector('.pb-ttl');
  ok(!!titleC1 && /Pole/.test(titleC1.textContent || ''),
    '[C1] pokazana bitwa to dokładnie ta odłożona (miejsce="Pole" z baseInfo), rostery nie są z innej tury');
  hidePreBattle();
  audienceOpen = false;

  // -------------------------------------------------------------------------
  // C2) ŚCIEŻKA TRANZYCYJNA (openNextOpenDiploProposal-podobna): audiencja zamyka się i W TYM
  //     SAMYM TICKU otwiera się NOWA (dla kolejnej propozycji) -- flush NIE MOŻE pokazać bitwy
  //     w trakcie tej tranzycji (byłby to dokładnie ten sam błąd "modale nachodzą na siebie",
  //     który naprawiał a7de65b0). Bitwa pokazuje się dopiero gdy audiencja faktycznie
  //     zostaje zamknięta na dobre.
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false, '[C2] krok 1: bitwa odłożona, pierwsza audiencja otwarta');

  closeDiplomacyAudienceAndFlushMirror(); // zamknięcie audiencji #1
  audienceOpen = true; // W TYM SAMYM TICKU -- otwarcie audiencji #2 dla kolejnej propozycji
  await waitForRaf();
  ok(isPreBattleOpen() === false,
    '[C2] krok 2 (dowod bezpieczenstwa RAF-deferral): flush po zamknieciu audiencji #1 NIE pokazal bitwy, bo audiencja #2 zdazyla sie otworzyc PRZED odpaleniem RAF -- brak "nachodzenia sie" modali');

  closeDiplomacyAudienceAndFlushMirror(); // teraz audiencja #2 zamyka się NA DOBRE
  await waitForRaf();
  ok(isPreBattleOpen() === true,
    '[C2] krok 3: gdy audiencja faktycznie zostaje zamknięta (bez kolejnego natychmiastowego otwarcia), odłożona bitwa w końcu się pokazuje -- żądanie nie zginęło w trakcie tranzycji');
  hidePreBattle();
  audienceOpen = false;

  // -------------------------------------------------------------------------
  // C3) KONTROLA MUTACYJNA -- stan SPRZED naprawy: hideDiplomacyAudience() bez ŻADNEGO
  //     flushu. Odroczona bitwa zostaje uwięziona w kolejce bezterminowo (dopóki coś INNEGO
  //     jej nie zflushuje) -- dowodzi że test C1/C2 mierzy naprawiony mechanizm, nie
  //     tautologię (bez flushu w mirrorze te same asercje by padły).
  // -------------------------------------------------------------------------
  audienceOpen = true;
  showPreBattle(
    baseInfo,
    { onAuto: () => {}, onBattlefield: () => {}, onCancel: () => {} },
    { auto: true },
  );
  ok(isPreBattleOpen() === false, '[C3] krok 1: bitwa odłożona, audiencja otwarta');
  audienceOpen = false; // == goly hideDiplomacyAudience() BEZ flusha (blad sprzed naprawy N3)
  await waitForRaf();
  ok(isPreBattleOpen() === false,
    '[C3] KONTROLA: bez wywołania flushDeferredAutoPreBattle() po zamknięciu audiencji, odłożona bitwa NIE pokazuje się sama -- to jest dokładnie luka N3, którą ta naprawa zamyka');
  // Sprzątanie: teraz flushnij naprawdę, żeby nie zostawić stanu modułu zanieczyszczonego.
  flushDeferredAutoPreBattle();
  ok(isPreBattleOpen() === true, '[C3] sprzątanie: jawny flush w końcu pokazuje odłożoną bitwę');
  hidePreBattle();

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(OUT); } catch { /* ignore */ }
}

// ---------------------------------------------------------------------------
async function main() {
  await runUiPart();

  console.log(`\ndiplomacy-audience-close-flush-test: ${pass} pass, ${fail} fail`);
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
