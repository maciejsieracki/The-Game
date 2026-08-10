'use strict';
/**
 * elimination-toast-merge-test.cjs — R-BRAK-KOMUNIKATU-ELIMINACJA-CYWILIZACJI, RUNDA 3 + 4 + 5.
 *
 * Nazwa pliku zostaje (historyczna — bramka jest wpisana pod tą nazwą w CLAUDE.md/handoffie),
 * ale od RUNDY 5 nie chodzi już wyłącznie o "toast" — dla przypadku eliminacji przez wchłonięcie
 * dyplomatyczne toast (#hintToast) został CAŁKOWICIE zastąpiony zdarzeniem side-panelu
 * „Wydarzenia" (warEventLog, recordCivElimEvent) + modalem otwieranym kliknięciem karty
 * (civElimNotice.ts, showCivElimNotice). Sekcje Runda 3/4 (poniżej) opisują historię defektu
 * zanim ECHO Macieja (B+C) zmieniło kanał komunikacji; sekcja RUNDA 5 na końcu pliku sprawdza
 * nowy kanał.
 *
 * runCapitalCapturePlunder()/annexCityStateToOwner() i ich wywołujący żyją w main.ts, wewnątrz
 * jednego wielkiego domknięcia (nie eksportowane, nie da się ich zbundlować osobno bez ciężkich
 * stubów całej gry) — więc, wzorem innych bramek strukturalnych w tym katalogu (np.
 * border-march-wygasanie-test.cjs, sekcja 7/15/16 w triumph-city-state-notice-test.cjs),
 * main.ts jest czytany jako TEKST i sprawdzany regexem/oknem znaków zamiast uruchamiany.
 * To NIE zastępuje testu jednostkowego semantyki — potwierdza wyłącznie, że struktura kodu
 * (jedno miejsce emisji, odebrana wartość zwracana, warunki NIE odwrócone) nie zostanie po
 * cichu cofnięta w przyszłej edycji.
 *
 * Pokrywa:
 *  - Defekt A (Runda 3, historyczny — dziś zastąpiony innym mechanizmem, patrz RUNDA 5):
 *    applyProposalOutcome/'wchloniecie' miał JEDNO showHintMessage (nie dwa kolidujące na
 *    #hintToast) między annexCityStateToOwner(...) a końcem bloku.
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
 *  - RUNDA 5 (piąty defekt, Evaluator Runda 4 — kolizja z-index toastu pod audiencją
 *    dyplomatyczną ORAZ duplikat karty przy rozstrzygnięciu w fazie AI): dla wchłonięcia
 *    dyplomatycznego z eliminacją (a) ŻADNE z dwóch dawnych miejsc nie woła już
 *    showHintMessage z treścią ELIMINACJA, (b) side-panel event (recordCivElimEvent) jest
 *    emitowany DOKŁADNIE raz, w JEDNYM miejscu (annexCityStateToOwner), (c) pełna treść
 *    (etykieta + szczegóły) trafia do civElimEventDetails i modalu civElimNotice.ts, (d) oba
 *    warunkujące guardy (annexerId === 0 dla emisji, !wasEliminated dla zwykłego toastu,
 *    proposerId === 0 && eliminatedOwners.has(...) dla wasEliminated) są sprawdzone WPROST —
 *    nie tylko obecność stringów — żeby złapać odwrócone !/|| podstawione za &&/===.
 *
 * Usage (z gra/): node tools/elimination-toast-merge-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS = path.resolve(GRA, 'src', 'main.ts');
const NOTICE_TS = path.resolve(GRA, 'src', 'ui', 'cityCaptureNotice.ts');
const ELIM_NOTICE_TS = path.resolve(GRA, 'src', 'ui', 'civElimNotice.ts');

const mainSrc = fs.readFileSync(MAIN_TS, 'utf8');
const noticeSrc = fs.readFileSync(NOTICE_TS, 'utf8');
const elimNoticeSrc = fs.readFileSync(ELIM_NOTICE_TS, 'utf8');

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
// Defekt A (dziś: RUNDA 5) — applyProposalOutcome, gałąź cywAction === 'wchloniecie'.
// Okno: od 'wchloniecie'  do następnego "if (result.deal) {" (sąsiedni blok
// sibling w tej samej funkcji, patrz main.ts). Zmienna `wchlonieciaBlock`/`wchlonieciaBlockCode`
// są reużyte niżej w sekcji RUNDA 5.
// ---------------------------------------------------------------------------
let wchlonieciaBlock = '';
let wchlonieciaBlockCode = '';
{
  const startMarker = "if (cywAction === 'wchloniecie') {";
  const startIdx = mainSrc.indexOf(startMarker);
  ok(startIdx >= 0, "Defekt A: znaleziono gałąź cywAction === 'wchloniecie' w applyProposalOutcome");

  const endMarker = 'if (result.deal) {';
  const endIdx = startIdx >= 0 ? mainSrc.indexOf(endMarker, startIdx) : -1;
  ok(endIdx > startIdx, 'Defekt A: znaleziono koniec bloku (sąsiedni "if (result.deal) {")');

  const block = startIdx >= 0 && endIdx > startIdx ? mainSrc.slice(startIdx, endIdx) : '';
  const blockCode = stripLineComments(block);
  wchlonieciaBlock = block;
  wchlonieciaBlockCode = blockCode;

  ok(block.includes('annexCityStateToOwner(responderId, proposerId);'),
    'Defekt A: blok nadal woła annexCityStateToOwner(responderId, proposerId)');

  // RUNDA 5: dla przypadku ELIMINACJI toast (#hintToast) zniknął całkowicie z tego bloku —
  // zostaje TYLKO jedno showHintMessage, i to dla przypadku ODWROTNEGO (plain, NIE-eliminacyjny
  // toast wchłonięcia — patrz sekcja RUNDA 5 niżej dla asercji polaryzacji guarda).
  const showHintCount = countOf(blockCode, 'showHintMessage(');
  ok(showHintCount === 1,
    `Defekt A: DOKŁADNIE jedno showHintMessage( w bloku wchłonięcia (znaleziono ${showHintCount}) `
    + '— to jest wyłącznie zwykły toast wchłonięcia (bez eliminacji); toast ELIMINACJA w tym '
    + 'bloku został RUNDĄ 5 usunięty na rzecz side-panel eventu (recordCivElimEvent w '
    + 'annexCityStateToOwner)');

  ok(block.includes('eliminatedOwners.has(responderId)'),
    'Defekt A: wasEliminated jest liczone z realnego stanu eliminacji (eliminatedOwners), '
    + 'nie zgadywane z samego annexerId');
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

// ---------------------------------------------------------------------------
// RUNDA 5 (Maciej, ECHO B+C) — eliminacja przez wchłonięcie dyplomatyczne komunikowana przez
// JEDNO zdarzenie side-panelu „Wydarzenia" (recordCivElimEvent w annexCityStateToOwner) +
// modal civElimNotice.ts otwierany kliknięciem karty, NIE przez showHintMessage/#hintToast.
// ---------------------------------------------------------------------------
{
  // (a) ŻADNE z dwóch dawnych miejsc emisji nie zawiera już tekstu ELIMINACJA w KODZIE
  // (showHintMessage) — applyProposalOutcome (blok wchłonięcia, wchlonieciaBlockCode z sekcji
  // "Defekt A" wyżej, komentarze usunięte) i annexCityStateToOwner. Sprawdzamy wersję BEZ
  // komentarzy — komentarz Rundy 5 w main.ts opisuje słownie modal "ELIMINACJA!", co fałszywie
  // zaliczyłoby się jako "tekst w kodzie", gdyby sprawdzać surowy blok.
  ok(!wchlonieciaBlockCode.includes('ELIMINACJA'),
    "RUNDA 5 (a): blok cywAction === 'wchloniecie' w applyProposalOutcome NIE zawiera już "
    + 'tekstu ELIMINACJA w KODZIE (poza komentarzami) — przeniesiony do side-panel event + modal');

  const annexFnStartMarker = 'function annexCityStateToOwner(csOwnerId: number, annexerId: number): void {';
  const annexFnStart = mainSrc.indexOf(annexFnStartMarker);
  ok(annexFnStart >= 0, 'RUNDA 5: znaleziono function annexCityStateToOwner');

  const annexFnEndMarker = '\n    function eliminateOwner(';
  const annexFnEnd = annexFnStart >= 0 ? mainSrc.indexOf(annexFnEndMarker, annexFnStart) : -1;
  ok(annexFnEnd > annexFnStart,
    'RUNDA 5: znaleziono koniec annexCityStateToOwner (kolejna funkcja eliminateOwner)');

  const annexBody = annexFnStart >= 0 && annexFnEnd > annexFnStart
    ? mainSrc.slice(annexFnStart, annexFnEnd) : '';
  const annexBodyCode = stripLineComments(annexBody);

  ok(!annexBodyCode.includes('showHintMessage('),
    'RUNDA 5 (a): annexCityStateToOwner NIE woła już showHintMessage w ogóle (dawny toast '
    + 'ELIMINACJA usunięty, zastąpiony recordCivElimEvent)');

  // (b) side-panel event emitowany DOKŁADNIE raz: annexCityStateToOwner woła
  // recordCivElimEvent dokładnie 1x, a blok wchłonięcia w applyProposalOutcome NIE woła go
  // wcale (żeby nie dublować emisji z dwóch miejsc — to dokładnie defekt 2. z Rundy 4).
  const recordCallsInAnnex = countOf(annexBodyCode, 'recordCivElimEvent(');
  ok(recordCallsInAnnex === 1,
    `RUNDA 5 (b): annexCityStateToOwner woła recordCivElimEvent( DOKŁADNIE raz `
    + `(znaleziono ${recordCallsInAnnex})`);

  ok(!wchlonieciaBlockCode.includes('recordCivElimEvent('),
    'RUNDA 5 (b): blok wchłonięcia w applyProposalOutcome NIE woła recordCivElimEvent — '
    + 'jedyne miejsce emisji zostaje annexCityStateToOwner (bez tego dublowałby się dokładnie '
    + 'tak jak dawny podwójny showHintMessage z Defektu A/Rundy 4)');

  const totalRecordCivElimOccurrences = countOf(mainSrc, 'recordCivElimEvent(');
  ok(totalRecordCivElimOccurrences === 2,
    `RUNDA 5 (b): 'recordCivElimEvent(' występuje w main.ts DOKŁADNIE 2 razy w całym pliku `
    + `(1 deklaracja funkcji + 1 wywołanie) — znaleziono ${totalRecordCivElimOccurrences}`);

  // (d) polaryzacja: recordCivElimEvent musi żyć WEWNĄTRZ if (annexerId === 0) { ... },
  // nie odwrócone (!==, brak guarda, inny operator) — inwersja emitowałaby kartę ELIMINACJA
  // dla wchłonięć AI↔AI/AI↔miasto-państwo, których gracz nigdy nie widzi w swoim dzienniku.
  ok(/if \(annexerId === 0\) \{\s*\n\s*recordCivElimEvent\(/.test(annexBody),
    'RUNDA 5 (d): recordCivElimEvent jest wywoływane wewnątrz if (annexerId === 0) { ... } '
    + '— guard NIE jest odwrócony i NIE brakuje go');
  ok(!/if \(annexerId !== 0\) \{\s*\n\s*recordCivElimEvent\(/.test(annexBody),
    'RUNDA 5 (d): brak odwróconego warunku annexerId !== 0 wokół recordCivElimEvent');

  // (d) polaryzacja odwrotna strona: zwykły toast wchłonięcia w applyProposalOutcome musi być
  // wewnątrz if (!wasEliminated) { ... } — NIE if (wasEliminated) (co pokazywałoby zwykły
  // toast TYLKO przy eliminacji — odwrotnie niż zamierzone) ani bez guarda w ogóle.
  ok(/if \(!wasEliminated\) \{\s*\n\s*showHintMessage\('Miasto-państwo wchłonięte do imperium', 4000\);/
    .test(wchlonieciaBlock),
    'RUNDA 5 (d): showHintMessage(\'Miasto-państwo wchłonięte...\') jest wewnątrz '
    + 'if (!wasEliminated) { ... } — guard NIE jest odwrócony');
  ok(!/if \(wasEliminated\) \{\s*\n\s*showHintMessage\('Miasto-państwo wchłonięte do imperium', 4000\);/
    .test(wchlonieciaBlock),
    'RUNDA 5 (d): brak odwróconego warunku (wasEliminated bez negacji) wokół zwykłego toastu');

  // (d) wasEliminated musi zostać złożone z && (proposerId gracza ORAZ realna eliminacja
  // responderId), nie z || (co ustawiłoby wasEliminated=true przy KAŻDYM wchłonięciu przez
  // gracza, nawet gdy miasto-państwo nadal istnieje, lub przy eliminacji przez inny podmiot).
  ok(wchlonieciaBlock.includes('proposerId === 0 && eliminatedOwners.has(responderId)'),
    'RUNDA 5 (d): wasEliminated = proposerId === 0 && eliminatedOwners.has(responderId) — '
    + 'złożenie przez && (koniunkcja), nie ||');
  ok(!wchlonieciaBlock.includes('proposerId === 0 || eliminatedOwners.has(responderId)'),
    'RUNDA 5 (d): brak odwróconej wersji z || zamiast && w wasEliminated');

  // (c) pełna treść (etykieta + szczegóły) trafia do civElimEventDetails pod evId, i modal
  // (onEventClick, prefiks elim-cs-) czyta ją stamtąd i przekazuje do showCivElimNotice.
  ok(mainSrc.includes(
    'function recordCivElimEvent(csOwnerId: number, civLabel: string, details: string): void {'),
    'RUNDA 5 (c): recordCivElimEvent przyjmuje civLabel ORAZ details (pełna treść dla modalu, '
    + 'nie tylko nazwę)');
  ok(mainSrc.includes('civElimEventDetails.set(evId, { civLabel, details });'),
    'RUNDA 5 (c): recordCivElimEvent zapisuje { civLabel, details } pod evId do '
    + 'civElimEventDetails, do późniejszego odczytu przez modal');
  ok(mainSrc.includes("id.startsWith('elim-cs-')"),
    'RUNDA 5 (c): onEventClick rozpoznaje prefiks karty elim-cs-');
  ok(/civElimEventDetails\.get\(id\)/.test(mainSrc),
    'RUNDA 5 (c): onEventClick czyta civElimEventDetails po id karty');
  ok(/showCivElimNotice\(\{ civLabel: info\.civLabel, details: info\.details \}\)/.test(mainSrc),
    'RUNDA 5 (c): kliknięcie karty otwiera showCivElimNotice z pełną treścią '
    + '(civLabel + details)');

  ok(elimNoticeSrc.includes('civLabel: string;') && elimNoticeSrc.includes('details: string;'),
    'RUNDA 5 (c): CivElimNoticeOpts (civElimNotice.ts) deklaruje civLabel oraz details');
  ok(elimNoticeSrc.includes('esc(civ)') && elimNoticeSrc.includes('esc(details)'),
    'RUNDA 5 (c): modal civElimNotice.ts faktycznie renderuje civLabel (esc(civ)) i details '
    + '(esc(details)), nie tylko przyjmuje je jako opcje');

  // Dismiss karty musi usuwać ją TRWALE z warEventLog (nie tylko miękko na bieżącą turę) —
  // inaczej po kliknięciu ✕ karta wracałaby w następnej turze mimo że gracz ją zamknął
  // (dismissedSidePanelEventIds.clear() dzieje się na końcu KAŻDEJ tury).
  const dismissFnStartMarker = 'function handleSidePanelEventDismiss(id: string): void {';
  const dismissFnStart = mainSrc.indexOf(dismissFnStartMarker);
  ok(dismissFnStart >= 0, 'RUNDA 5: znaleziono function handleSidePanelEventDismiss');
  const dismissFnEndMarker = '\n    function clearAllSidePanelEvents(';
  const dismissFnEnd = dismissFnStart >= 0 ? mainSrc.indexOf(dismissFnEndMarker, dismissFnStart) : -1;
  ok(dismissFnEnd > dismissFnStart,
    'RUNDA 5: znaleziono koniec handleSidePanelEventDismiss (kolejna funkcja clearAllSidePanelEvents)');
  const dismissBody = dismissFnStart >= 0 && dismissFnEnd > dismissFnStart
    ? mainSrc.slice(dismissFnStart, dismissFnEnd) : '';
  ok(dismissBody.includes("id.startsWith('elim-cs-')"),
    'RUNDA 5: handleSidePanelEventDismiss rozpoznaje prefiks elim-cs-');
  ok(/elim-cs-[\s\S]{0,600}?warEventLog\.splice\(idx, 1\);/.test(dismissBody),
    'RUNDA 5: dismiss karty elim-cs- usuwa ją TRWALE ze warEventLog (splice), nie tylko '
    + 'miękko na bieżącą turę — inaczej wracałaby w kolejnej turze mimo kliknięcia ✕');
  ok(dismissBody.includes('civElimEventDetails.delete(id)'),
    'RUNDA 5: dismiss karty elim-cs- sprząta też jej wpis w civElimEventDetails');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
