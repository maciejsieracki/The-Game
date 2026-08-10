'use strict';
/**
 * elimination-toast-merge-test.cjs — R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI, RUNDA 3 + 4.
 *
 * runCapitalCapturePlunder()/annexCityStateToOwner() i ich wywołujący żyją w main.ts, wewnątrz
 * jednego wielkiego domknięcia (nie eksportowane, nie da się ich zbundlować osobno bez ciężkich
 * stubów całej gry) — więc, wzorem innych bramek strukturalnych w tym katalogu (np.
 * border-march-wygasanie-test.cjs, sekcja 7/15/16 w triumph-city-state-notice-test.cjs),
 * main.ts jest czytany jako TEKST i sprawdzany regexem/oknem znaków zamiast uruchamiany.
 * To NIE zastępuje testu jednostkowego semantyki — potwierdza wyłącznie, że struktura kodu
 * (jedno scalone wywołanie showHintMessage, odebrana wartość zwracana) nie zostanie po cichu
 * cofnięta w przyszłej edycji.
 *
 * Pokrywa:
 *  - Defekt A (Runda 3): applyProposalOutcome/'wchloniecie' — JEDNO showHintMessage (nie dwa
 *    kolidujące na #hintToast) między annexCityStateToOwner(...) a końcem bloku.
 *  - Defekt A (Runda 4): resolveNegotiationEntryAt (WYWOŁUJĄCY applyProposalOutcome) NIE woła
 *    już bezwarunkowo swojego WŁASNEGO showHintMessage na tym samym #hintToast zaraz po
 *    powrocie z applyProposalOutcome — Runda 3 naprawiła kolizję WEWNĄTRZ applyProposalOutcome,
 *    ale wywołujący i tak nadpisywał scalony toast eliminacji drugim, generycznym wywołaniem
 *    jedną ramkę stosu wyżej (dokładnie to złapał Evaluator w rundzie 3).
 *  - Defekt B ścieżka 1: resolveSiegeSurrender — runCapitalCapturePlunder(...) ma odebraną
 *    wartość zwracaną (nie bare-statement) i toast kapitulacji jest SCALONY (jedno
 *    showHintMessage, nie dwa).
 *  - Defekt B ścieżka 2: applyMapBattleOutcome przekazuje info o eliminacji do
 *    finishSiegeStormBattle przez opts.onCityCaptured, a afterSiegeUi z niego korzysta (nie
 *    ginie po cichu na ścieżce siegeContext).
 *  - Defekt C: CityCaptureNoticeOpts/showCityCaptureNotice mają pole eliminatedDetails i oba
 *    call site'y w main.ts je przekazują.
 *
 * Usage (z gra/): node tools/elimination-toast-merge-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const NOTICE_TS = path.resolve(GRA, 'src', 'ui', 'cityCaptureNotice.ts');

const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const noticeSrc = fs.readFileSync(NOTICE_TS, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) {
    pass++;
    console.log('  OK: ' + label);
  } else {
    fail++;
    console.log('  FAIL: ' + label);
  }
}

/** Liczba wystąpień needle w hay. */
function countOf(hay, needle) {
  let n = 0;
  let i = 0;
  for (;;) {
    i = hay.indexOf(needle, i);
    if (i < 0) break;
    n++;
    i += needle.length;
  }
  return n;
}

/** Usuwa komentarze `// ...` (do końca linii) — komentarze w tym pliku bywają PL+EN
 *  (zasada 9 CLAUDE.md) i cytują nazwy wywołań typu "showHintMessage()" w prozie, co
 *  fałszywie zawyżałoby liczbę realnych wywołań w kodzie. */
function stripLineComments(src) {
  return src
    .split('\n')
    .map((line) => {
      const idx = line.indexOf('//');
      return idx >= 0 ? line.slice(0, idx) : line;
    })
    .join('\n');
}

// ---------------------------------------------------------------------------
// Defekt A — applyProposalOutcome, gałąź cywAction === 'wchloniecie'.
// Okno: od 'wchloniecie'  do następnego "if (result.deal) {" (sąsiedni blok
// sibling w tej samej funkcji, patrz main.ts).
// ---------------------------------------------------------------------------
{
  const startMarker = "if (cywAction === 'wchloniecie') {";
  const startIdx = mainSrc.indexOf(startMarker);
  ok(startIdx >= 0, "Defekt A: znaleziono gałąź cywAction === 'wchloniecie' w applyProposalOutcome");

  const endMarker = 'if (result.deal) {';
  const endIdx = startIdx >= 0 ? mainSrc.indexOf(endMarker, startIdx) : -1;
  ok(endIdx > startIdx, 'Defekt A: znaleziono koniec bloku (sąsiedni "if (result.deal) {")');

  const block = startIdx >= 0 && endIdx > startIdx ? mainSrc.slice(startIdx, endIdx) : '';
  const blockCode = stripLineComments(block);

  ok(block.includes('annexCityStateToOwner(responderId, proposerId);'),
    'Defekt A: blok nadal woła annexCityStateToOwner(responderId, proposerId)');

  const showHintCount = countOf(blockCode, 'showHintMessage(');
  ok(showHintCount === 1,
    `Defekt A: DOKŁADNIE jedno showHintMessage( w bloku wchłonięcia (znaleziono ${showHintCount}) `
    + '— dwa kolejne wywołania na #hintToast to dokładnie bug z Defektu A (druga treść '
    + 'natychmiast nadpisuje pierwszą)');

  // Pilnujemy, że treść "Miasto-państwo wchłonięte do imperium" nie stała się osobnym,
  // NIESCALONYM wywołaniem (musi żyć wewnątrz wyrażenia budującego wchlonieteMsg).
  const bareSecondCallPattern =
    /annexCityStateToOwner\(responderId, proposerId\);[\s\S]*?showHintMessage\('Miasto-państwo wchłonięte do imperium', 4000\);/;
  ok(!bareSecondCallPattern.test(block),
    'Defekt A: NIE ma osobnego, bezwarunkowego showHintMessage(\'Miasto-państwo wchłonięte...\') '
    + 'zaraz po annexCityStateToOwner (regresja dokładnie tego wzorca kolizji)');

  ok(block.includes('eliminatedOwners.has(responderId)'),
    'Defekt A: treść toastu jest warunkowana realnym stanem eliminacji (eliminatedOwners), '
    + 'nie zgadywana z samego annexerId');
}

// ---------------------------------------------------------------------------
// Defekt A (Runda 4) — resolveNegotiationEntryAt: WYWOŁUJĄCY applyProposalOutcome. Runda 3
// naprawiła kolizję WEWNĄTRZ applyProposalOutcome (blok wyżej), ale wywołujący i tak
// bezwarunkowo wołał WŁASNY, generyczny showHintMessage na tym samym #hintToast zaraz po
// powrocie — dokładnie ten sam wzorzec kolizji, jedną ramkę stosu wyżej (to złapał
// Evaluator w rundzie 3). Okno: od `applyProposalOutcome(entry.proposerOwnerId, ...)` do
// końca funkcji resolveNegotiationEntryAt (następna funkcja
// resolvePendingNegotiationsForOwner).
// ---------------------------------------------------------------------------
{
  const fnStartMarker = 'function resolveNegotiationEntryAt(';
  const fnStart = mainSrc.indexOf(fnStartMarker);
  ok(fnStart >= 0, 'Defekt A (Runda 4): znaleziono function resolveNegotiationEntryAt');

  const fnEndMarker = '\n    function resolvePendingNegotiationsForOwner(';
  const fnEnd = fnStart >= 0 ? mainSrc.indexOf(fnEndMarker, fnStart) : -1;
  ok(fnEnd > fnStart,
    'Defekt A (Runda 4): znaleziono koniec resolveNegotiationEntryAt (kolejna funkcja '
    + 'resolvePendingNegotiationsForOwner)');

  const fnBody = fnStart >= 0 && fnEnd > fnStart ? mainSrc.slice(fnStart, fnEnd) : '';
  const fnBodyCode = stripLineComments(fnBody);

  const callMarker =
    'applyProposalOutcome(entry.proposerOwnerId, entry.responderOwnerId, result, entry.payload, entry.actionId);';
  const callIdx = fnBodyCode.indexOf(callMarker);
  ok(callIdx >= 0,
    'Defekt A (Runda 4): znaleziono wywołanie applyProposalOutcome(...) w resolveNegotiationEntryAt');

  // Segment OD wywołania applyProposalOutcome DO końca funkcji — to tu żyło bezwarunkowe
  // drugie showHintMessage, które nadpisywało scalony toast eliminacji Rundy 3.
  const afterCall = callIdx >= 0 ? fnBodyCode.slice(callIdx + callMarker.length) : '';

  // Wskaźnik strukturalny odróżniający "bezwarunkowy bare statement na poziomie funkcji" od
  // "zagnieżdżone wewnątrz if-guarda": indentacja linii `applyProposalOutcome(...)` (poziom
  // bazowy ciała gałęzi "else") kontra indentacja linii `showHintMessage(` która buduje
  // treść z ownerDiploLabel(awaitingId). Na RAW (nie odkomentowanym) ciele funkcji, żeby
  // liczba spacji się zgadzała 1:1 z prawdziwym plikiem.
  const baselineIndentMatch = fnBody.match(/\n( *)applyProposalOutcome\(entry\.proposerOwnerId/);
  ok(!!baselineIndentMatch,
    'Defekt A (Runda 4): zmierzono bazową indentację wywołania applyProposalOutcome(...)');
  const baselineIndentLen = baselineIndentMatch ? baselineIndentMatch[1].length : -1;

  const rawCallIdx = fnBody.indexOf(callMarker);
  const rawAfterCall = rawCallIdx >= 0 ? fnBody.slice(rawCallIdx + callMarker.length) : '';
  const toastIndentMatch = rawAfterCall.match(/\n( *)showHintMessage\(\s*\n\s*ownerDiploLabel\(awaitingId\)/);

  ok(!!toastIndentMatch,
    'Defekt A (Runda 4): znaleziono showHintMessage(ownerDiploLabel(awaitingId)...) PO '
    + 'applyProposalOutcome (generyczny toast musi nadal istnieć w kodzie, tylko warunkowo)');

  const toastIndentLen = toastIndentMatch ? toastIndentMatch[1].length : -1;
  ok(baselineIndentLen >= 0 && toastIndentLen > baselineIndentLen,
    `Defekt A (Runda 4): showHintMessage(ownerDiploLabel(awaitingId)...) PO applyProposalOutcome `
    + `NIE jest już bezwarunkowym bare statement na poziomie funkcji (indent bazowy `
    + `${baselineIndentLen}, indent toastu ${toastIndentLen} — musi być GŁĘBIEJ, czyli `
    + 'zagnieżdżony wewnątrz if-guarda, nie na tym samym poziomie co applyProposalOutcome) — '
    + 'to dokładnie wzorzec kolizji z rundy 3 (applyProposalOutcome scala toast eliminacji, a '
    + 'wywołujący i tak go nadpisuje drugim, bezwarunkowym wywołaniem na tym samym poziomie)');

  ok(/entry\.actionId === 'wchloniecie'/.test(afterCall),
    "Defekt A (Runda 4): resolveNegotiationEntryAt sprawdza entry.actionId === 'wchloniecie' "
    + 'PO applyProposalOutcome, żeby nie nadpisać już pokazanego, scalonego toastu eliminacji');

  ok(/outcome\.kind === 'accepted'/.test(afterCall),
    'Defekt A (Runda 4): guard rozróżnia outcome.kind === \'accepted\' — odrzucone '
    + 'wchłonięcie MUSI nadal dostawać generyczny toast "odrzuca propozycję" '
    + '(applyProposalOutcome nic nie pokazuje sam, gdy !result.accepted)');

  // Guard nie może wyciszyć toastu dla PRZYPADKÓW INNYCH NIŻ wchłonięcie — showHintMessage
  // musi nadal być realnie wołane w tej funkcji (nie usunięte w całości).
  const showHintStillCalled = countOf(afterCall, 'showHintMessage(') >= 1;
  ok(showHintStillCalled,
    'Defekt A (Runda 4): showHintMessage( nadal jest wołane w resolveNegotiationEntryAt po '
    + 'applyProposalOutcome (dla wszystkich przypadków poza accepted+wchloniecie) — zero-'
    + 'informacji dla gracza też jest błędem');
}

// ---------------------------------------------------------------------------
// Defekt B, ścieżka 1 — resolveSiegeSurrender: wartość zwracana
// runCapitalCapturePlunder MUSI być odebrana, a toast kapitulacji scalony.
// ---------------------------------------------------------------------------
{
  const fnStart = mainSrc.indexOf('function resolveSiegeSurrender(cityId: string): void {');
  ok(fnStart >= 0, 'Defekt B/1: znaleziono function resolveSiegeSurrender');

  const fnEnd = fnStart >= 0 ? mainSrc.indexOf('\n    function endMapSiege(', fnStart) : -1;
  ok(fnEnd > fnStart, 'Defekt B/1: znaleziono koniec resolveSiegeSurrender (kolejna funkcja endMapSiege)');

  const fnBody = fnStart >= 0 && fnEnd > fnStart ? mainSrc.slice(fnStart, fnEnd) : '';
  const fnBodyCode = stripLineComments(fnBody);

  // Bare statement = wywołanie jako PIERWSZY token linii (po samych spacjach), bez
  // poprzedzającego "= " (co odróżnia go od "const x = runCapitalCapturePlunder(...)").
  ok(!/\n[ \t]*runCapitalCapturePlunder\(city, oldOwner, newOwner\);/.test(fnBodyCode),
    'Defekt B/1: runCapitalCapturePlunder(...) NIE jest już wołane jako bare statement '
    + '(wartość zwracana musi być odebrana)');
  ok(/const\s+\w+\s*=\s*runCapitalCapturePlunder\(city, oldOwner, newOwner\);/.test(fnBodyCode),
    'Defekt B/1: runCapitalCapturePlunder(city, oldOwner, newOwner) ma odebraną wartość zwracaną');

  const showHintCount = countOf(fnBodyCode, 'showHintMessage(');
  // 1 dla gałęzi "newOwner !== city.ownerId" (scalony toast kapitulacji) + 1 dla gałęzi
  // "else" (głód bez przejęcia) = 2 w całej funkcji, NIE 3 (co byłoby dwa kolidujące
  // w tej samej gałęzi capture).
  ok(showHintCount === 2,
    `Defekt B/1: dokładnie 2 showHintMessage( w resolveSiegeSurrender (capture-scalony + `
    + `no-capture), znaleziono ${showHintCount} — 3 oznaczałoby regresję kolizji Defektu A `
    + 'w tej samej funkcji');
}

// ---------------------------------------------------------------------------
// Defekt B, ścieżka 2 — applyMapBattleOutcome -> opts.onCityCaptured ->
// finishSiegeStormBattle (afterSiegeUi) korzysta z etykiety eliminacji.
// ---------------------------------------------------------------------------
{
  ok(mainSrc.includes('onCityCaptured?: (info: CityCaptureCallbackInfo) => void;'),
    'Defekt B/2: applyMapBattleOutcome.opts deklaruje onCityCaptured callback');
  ok(/opts\.onCityCaptured\?\.\(\{/.test(mainSrc),
    'Defekt B/2: blok przejęcia miasta (siegeContext) faktycznie WOŁA opts.onCityCaptured');
  ok(mainSrc.includes('let siegeCaptureInfo: CityCaptureCallbackInfo | null = null;'),
    'Defekt B/2: finishSiegeStormBattle trzyma wynik callbacku w siegeCaptureInfo');
  ok(/onCityCaptured:\s*\(info: CityCaptureCallbackInfo\) => \{\s*siegeCaptureInfo = info;/.test(mainSrc),
    'Defekt B/2: battleOpts przekazuje onCityCaptured, który zapisuje siegeCaptureInfo');
  ok(/siegeCaptureInfo\?\.eliminatedCivLabel/.test(mainSrc),
    'Defekt B/2: afterSiegeUi czyta siegeCaptureInfo?.eliminatedCivLabel przy budowie toastu '
    + '„Szturm udany" (etykieta eliminacji nie ginie po cichu na ścieżce muru)');
}

// ---------------------------------------------------------------------------
// Defekt C — eliminatedDetails (tech + Power) dochodzi od runCapitalCapturePlunder
// przez applyCityCaptureToMap do obu call site'ów showCityCaptureNotice, oraz modal
// (cityCaptureNotice.ts) faktycznie je renderuje.
// ---------------------------------------------------------------------------
{
  ok(mainSrc.includes('interface CapitalCapturePlunderResult {')
    && mainSrc.includes('eliminatedDetails: string;'),
    'Defekt C: runCapitalCapturePlunder zwraca obiekt z polem eliminatedDetails');

  const showCityCaptureNoticeCallCount = countOf(mainSrc, 'showCityCaptureNotice(');
  const eliminatedDetailsAtCallSites = countOf(mainSrc, 'eliminatedDetails: captureResult.eliminatedDetails ?? undefined,');
  ok(showCityCaptureNoticeCallCount === 2,
    `Defekt C: dokładnie 2 wywołania showCityCaptureNotice( w main.ts (znaleziono ${showCityCaptureNoticeCallCount})`);
  ok(eliminatedDetailsAtCallSites === 2,
    `Defekt C: OBA call site'y showCityCaptureNotice przekazują eliminatedDetails `
    + `(znaleziono ${eliminatedDetailsAtCallSites}/2)`);

  ok(noticeSrc.includes('eliminatedDetails?: string;'),
    'Defekt C: CityCaptureNoticeOpts (cityCaptureNotice.ts) deklaruje eliminatedDetails');
  ok(noticeSrc.includes('esc(eliminatedDetails)'),
    'Defekt C: modal ELIMINACJA! renderuje eliminatedDetails (nie tylko nazwę cywilizacji)');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
