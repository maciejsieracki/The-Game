'use strict';
/**
 * army-merge-separate-return-mainguard-test.cjs — P-ARMIA-ROZPAD-PRZY-ZOSTAW-OSOBNO,
 * RUNDA 5 (Evaluator RUNDA 4: FAIL, drugie naruszenie §0b z rzędu — patrz
 * PYTANIA-OTWARTE.md). Ta runda:
 *  (1) usuwa CAŁKOWICIE `skipStackRuchSync` (placebo — Evaluator dowiódł
 *      pełnym śledzeniem łańcucha wywołań, że chroni ZERO odczytów) i pinuje
 *      jego nieobecność, żeby nie wrócił po cichu w przyszłej rundzie;
 *  (2) domyka E5 — `resolveSeparateReturnHex(...)` MUSI być wołane z
 *      DOKŁADNIE 5 argumentami (piąty: `isHexPassableForUnit`), nie 4
 *      (dawny regex dopasowywał przy obu — połowa naprawy B3, teleport na
 *      nieprzejezdny origin, była nieochroniona);
 *  (3) domyka E7 — wszystkie trzy `deductedRuch*` MUSZĄ być policzone jako
 *      RÓŻNICA `pulaPrzed − stackRuchLeft(stack)` w MIEJSCU OBLICZENIA, nie
 *      jako `moveCost`/`result.cost`/literał (dokładnie exploit B1 z rundy 1,
 *      który wcześniej przechodził niezłapany, bo stary test sprawdzał tylko
 *      że call-site PRZEKAZUJE zmienną o właściwej NAZWIE, nigdy jak ta
 *      zmienna została POLICZONA);
 *  (4) zastępuje kruchą K-5 (`deductCount === 4` liczone GLOBALNIE w całym
 *      pliku — dowolna niezwiązana funkcja odejmująca ruch gdziekolwiek w
 *      main.ts wysadzała tę asercję) liczeniem WEWNĄTRZ wyciętych ciał
 *      TYLKO tych trzech konkretnych call-site'ów.
 *
 * WZORZEC (jak w `tools/border-march-wygasanie-test.cjs`, kanoniczny w repo):
 * czytamy `src/main.ts` jako TEKST (fs.readFileSync), wycinamy ciało
 * KONKRETNEJ funkcji/handlera indexOf/regexem, i asercjonujemy przez
 * includes()/regex na wyciętym tekście.
 *
 * Usage (z gra/): node tools/army-merge-separate-return-mainguard-test.cjs
 */
const fs = require('fs');
const path = require('path');

const MAIN_TS = path.join(__dirname, '..', 'src', 'main.ts');
const src = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', label); }
}

// ---------------------------------------------------------------------------
// 0) RUNDA 5, punkt 1: skipStackRuchSync USUNIĘTY W CAŁOŚCI — placebo (dwie
//    kolejne rundy Evaluatora, RUNDA 3 i RUNDA 4) nie wraca po cichu.
// ---------------------------------------------------------------------------
ok(!/skipStackRuchSync/.test(src),
  'skipStackRuchSync NIE występuje nigdzie w main.ts (placebo usunięte w całości, nie tylko przeniesione)');

// ---------------------------------------------------------------------------
// 1) Wytnij ciało handlera onSeparate w promptMergeIfCoLocated — PIERWSZE
//    wystąpienie `onSeparate: () => {` w pliku (main.ts ma dwa inne
//    onSeparate niezwiązane z tym tematem, oba dalej w pliku).
// ---------------------------------------------------------------------------
const promptFnStart = src.indexOf('function promptMergeIfCoLocated(');
ok(promptFnStart >= 0, 'znaleziono promptMergeIfCoLocated w main.ts');

const onSeparateStart = src.indexOf('onSeparate: () => {', promptFnStart >= 0 ? promptFnStart : 0);
ok(onSeparateStart >= 0, 'znaleziono onSeparate: () => { wewnątrz promptMergeIfCoLocated');

const endMarker = '\n      });\n    }\n';
const onSeparateEnd = src.indexOf(endMarker, onSeparateStart);
ok(onSeparateEnd > onSeparateStart, 'znaleziono koniec ciała onSeparate (zamknięcie showArmyMergePanel + funkcji)');

const body = (onSeparateStart >= 0 && onSeparateEnd > onSeparateStart)
  ? src.slice(onSeparateStart, onSeparateEnd)
  : '';

// ---------------------------------------------------------------------------
// 2) MUSI zawierać: zwrot ruchu liczony na deductedRuch (FAKTYCZNIE odjęty),
//    NIE na moveCost (zamierzony koszt — exploit B1 rundy 1).
// ---------------------------------------------------------------------------
ok(/computeSeparateReturn\(\s*movedUnits\s*,\s*deductedRuch\s*\)/.test(body),
  'onSeparate woła computeSeparateReturn(movedUnits, deductedRuch) — zwrot na FAKTYCZNIE odjętą pulę');
ok(!/computeSeparateReturn\(\s*movedUnits\s*,\s*moveCost\s*\)/.test(body),
  'onSeparate NIE woła computeSeparateReturn(movedUnits, moveCost) — exploit B1 (zwrot > odjęte) NIE wrócił');

// ---------------------------------------------------------------------------
// 3) RUNDA 5 (E5) — MUSI zawierać resolveSeparateReturnHex woane z DOKŁADNIE
//    5 argumentami, piąty = isHexPassableForUnit. Dawny regex akceptował
//    też wywołanie 4-argumentowe (bez ostatniego parametru) — połowa
//    naprawy B3 (teleport na nieprzejezdny origin) była wtedy NIECHRONIONA.
// ---------------------------------------------------------------------------
ok(/resolveSeparateReturnHex\(\s*units\s*,\s*fromQ\s*,\s*fromR\s*,\s*rep\.ownerId\s*,\s*isHexPassableForUnit\s*\)/.test(body),
  'onSeparate woła resolveSeparateReturnHex(units, fromQ, fromR, rep.ownerId, isHexPassableForUnit) — PEŁNE 5 argumentów, isHexPassableForUnit NIE pominięty');
ok(!/const dest = \{\s*q:\s*fromQ\s*,\s*r:\s*fromR\s*\}/.test(body),
  'onSeparate NIE ma bezwarunkowego `const dest = { q: fromQ, r: fromR }` — exploit B3 (teleport na wroga) NIE wrócił');

// ---------------------------------------------------------------------------
// 4) MUSI zawierać: restored.get(...) faktycznie zapisywany do mu.ruchLeft —
//    sam policzony zwrot bez zapisu do jednostki byłby martwym kodem.
// ---------------------------------------------------------------------------
ok(/computeSeparateReturn\(movedUnits, deductedRuch\)/.test(body)
  && /mu\.ruchLeft = r/.test(body),
  'wynik computeSeparateReturn jest faktycznie zapisywany do mu.ruchLeft (nie tylko policzony)');
ok(!/mu\.ruchLeft = 0\b/.test(body),
  'onSeparate NIE zeruje ruchLeft powracających jednostek (byłaby to utrata ruchu wbrew decyzji Macieja)');

// ---------------------------------------------------------------------------
// 5) RUNDA 5 (E7 + K-5) — dla KAŻDEGO z trzech realnych call-site'ów
//    `promptMergeIfCoLocated(...)` (te poprzedzone deductStackRuchLeft — ruch
//    faktycznie się odbył): wytnij WĄSKIE okno od `const pulaPrzedXxx =
//    stackRuchLeft(stack)` do wywołania promptMergeIfCoLocated i sprawdź
//    WEWNĄTRZ TEGO OKNA (nie globalnie w całym pliku — K-5, kruchość rundy 3):
//      a) dokładnie JEDNO wywołanie deductStackRuchLeft(
//      b) deductedRuchXxx policzone jako RÓŻNICA pulaPrzedXxx − stackRuchLeft(stack)
//         W MIEJSCU OBLICZENIA (E7 — nie moveCost/result.cost/literał; to jest
//         DOKŁADNIE exploit B1 rundy 1, wcześniej niewykrywalny bo stary test
//         sprawdzał tylko NAZWĘ zmiennej w wywołaniu promptMergeIfCoLocated,
//         nigdy jak ta zmienna została policzona)
//      c) wywołanie promptMergeIfCoLocated przekazuje deductedRuchXxx jako
//         5. argument
// ---------------------------------------------------------------------------
const deductSites = [
  {
    label: 'openMergePanelForSelected / showArmyMergePickPanel onMerge (ids,srcQ,srcR)',
    startMarker: 'const pulaPrzed = stackRuchLeft(stack);',
    endMarker: 'promptMergeIfCoLocated(ids, srcQ, srcR, moveCost, deductedRuch);',
    pulaVar: 'pulaPrzed',
    deductedVar: 'deductedRuch',
    callRe: /promptMergeIfCoLocated\(ids, srcQ, srcR, moveCost, deductedRuch\)/,
  },
  {
    label: 'executeMarchSegmentForUnit (marsz gracza)',
    startMarker: 'const pulaPrzedMarch = stackRuchLeft(stack);',
    endMarker: 'promptMergeIfCoLocated(stack.map(s => s.id), fromQ, fromR, result.cost, deductedRuchMarch);',
    pulaVar: 'pulaPrzedMarch',
    deductedVar: 'deductedRuchMarch',
    callRe: /promptMergeIfCoLocated\(stack\.map\(s => s\.id\), fromQ, fromR, result\.cost, deductedRuchMarch\)/,
  },
  {
    label: 'renderLoop (animacja marszu dobiegła końca)',
    startMarker: 'let deductedRuchAnim = 0;',
    endMarker: 'refreshD1bHud();',
    pulaVar: 'pulaPrzedAnim',
    deductedVar: 'deductedRuchAnim',
    callRe: /promptMergeIfCoLocated\(\s*movedStackIds\.length > 0 \? movedStackIds : \[finishedId\],\s*fromQ,\s*fromR,\s*moveCost,\s*deductedRuchAnim,?\s*\)/,
  },
];

for (const site of deductSites) {
  const start = src.indexOf(site.startMarker);
  ok(start >= 0, `[${site.label}] znaleziono marker startowy okna (${site.startMarker.slice(0, 40)}...)`);
  const end = start >= 0 ? src.indexOf(site.endMarker, start) : -1;
  ok(end > start, `[${site.label}] znaleziono marker końcowy okna (${site.endMarker.slice(0, 50)}...)`);
  const window = (start >= 0 && end > start) ? src.slice(start, end + site.endMarker.length) : '';

  // a) dokładnie jedno deductStackRuchLeft( WEWNĄTRZ TEGO WĄSKIEGO OKNA —
  //    zastępuje kruchą globalną liczbę K-5; niezwiązany kod gdzie indziej w
  //    main.ts (24 tys. linii) NIE może wysadzić tej asercji.
  const localDeductCount = (window.match(/deductStackRuchLeft\(/g) || []).length;
  ok(localDeductCount === 1,
    `[${site.label}] dokładnie 1 wywołanie deductStackRuchLeft( w wyciętym oknie tego call-site'u (znaleziono ${localDeductCount})`);

  // b) E7 — deductedRuchXxx MUSI być policzone jako RÓŻNICA w miejscu
  //    obliczenia, nie jako moveCost/result.cost/literał.
  const diffRe = new RegExp(`${site.deductedVar}\\s*=\\s*${site.pulaVar}\\s*-\\s*stackRuchLeft\\(stack\\)`);
  ok(diffRe.test(window),
    `[${site.label}] ${site.deductedVar} policzone jako ${site.pulaVar} - stackRuchLeft(stack) (RÓŻNICA, nie literał/moveCost) — exploit B1`);
  const exploitRe = new RegExp(`${site.deductedVar}\\s*=\\s*(moveCost|result\\.cost|anim\\.cost)\\s*;`);
  ok(!exploitRe.test(window),
    `[${site.label}] ${site.deductedVar} NIE jest podstawiony bezpośrednio zamierzonym kosztem ruchu (exploit B1 z rundy 1 NIE wrócił)`);

  // c) wywołanie promptMergeIfCoLocated w tym oknie przekazuje deductedRuchXxx
  //    jako 5. argument (dokładny wzorzec wywołania tego konkretnego call-site'u).
  ok(site.callRe.test(window),
    `[${site.label}] promptMergeIfCoLocated(...) w tym oknie przekazuje ${site.deductedVar} jako 5. argument`);
}

// ---------------------------------------------------------------------------
// 6) Typ DeferredMergePrompt (odroczone prompty po turach AI) ma pole
//    deductedRuch — inaczej zwrot ginie na ścieżce odłożonej (flush po EOT).
// ---------------------------------------------------------------------------
const deferredTypeStart = src.indexOf('type DeferredMergePrompt = {');
ok(deferredTypeStart >= 0, 'znaleziono type DeferredMergePrompt');
const deferredTypeEnd = src.indexOf('};', deferredTypeStart);
const deferredTypeBody = deferredTypeStart >= 0 ? src.slice(deferredTypeStart, deferredTypeEnd) : '';
ok(/deductedRuch: number/.test(deferredTypeBody),
  'DeferredMergePrompt ma pole deductedRuch: number');
ok(/deferredMergePrompts\.push\(\{[\s\S]{0,200}?deductedRuch,/.test(src),
  'deferredMergePrompts.push({...}) przekazuje deductedRuch (nie tylko moveCost) do kolejki odłożonej');
ok(/promptMergeIfCoLocated\(next\.movedUnitIds, next\.fromQ, next\.fromR, next\.moveCost, next\.deductedRuch\)/.test(src),
  'flushDeferredMergePrompts przekazuje next.deductedRuch dalej do promptMergeIfCoLocated');

// ---------------------------------------------------------------------------
// 7) RUNDA 6 (Evaluator RUNDA 5, nota blokująca B-R5-1) — rdzeń tematu wcale
//    NIE miał ochrony: „cała armia wraca RAZEM na jeden heks" to samo
//    PRZENOSZENIE pozycji (`mu.q = dest.q; mu.r = dest.r;` w pętli po
//    movedUnits), nie zwrot ruchu ani wybór docelowego heksu (te dwa już były
//    chronione w sekcjach 2-4 i 3). Wytnij WĄSKO samą pętlę
//    `for (const mu of movedUnits) { ... }`, NIE cały wycięty `body` handlera
//    — linie z komunikatem dla gracza w tym samym `body` zawierają dosłowny
//    tekst `dest.q + ','` (konkatenacja stringa do UI, nic wspólnego z
//    przypisaniem pozycji), a komentarz na początku funkcji wspomina nazwę
//    `assignBounceHexesForUnits` jako WYJAŚNIENIE historyczne (co usunięto),
//    bez wywołania. Naiwny regex globalny na całym `body`
//    (`/dest\.q \+|dest\.r \+|bounces|assignBounceHexesForUnits/`) dałby
//    FAŁSZYWY FAIL na DZISIEJSZYM POPRAWNYM kodzie — zweryfikowane
//    uruchomieniem PRZED napisaniem tej sekcji (patrz raport rundy 6).
// ---------------------------------------------------------------------------
const separateLoopStart = body.indexOf('for (const mu of movedUnits) {');
ok(separateLoopStart >= 0,
  'onSeparate: znaleziono pętlę for (const mu of movedUnits) { ... } — miejsce faktycznego przenoszenia jednostek');
const separateLoopClose = separateLoopStart >= 0 ? body.indexOf('\n            }', separateLoopStart) : -1;
ok(separateLoopClose > separateLoopStart,
  'onSeparate: znaleziono zamknięcie pętli for (const mu of movedUnits)');
const separateLoopBody = (separateLoopStart >= 0 && separateLoopClose > separateLoopStart)
  ? body.slice(separateLoopStart, separateLoopClose)
  : '';

ok(/for \(const mu of movedUnits\) \{[\s\S]{0,60}?mu\.q = dest\.q;[\s\S]{0,40}?mu\.r = dest\.r;/.test(separateLoopBody),
  'onSeparate: każda jednostka w pętli przenoszona na WSPÓLNY dest.q/dest.r (dokładne przypisanie, ta sama zmienna dest dla wszystkich, bez rozpraszania)');
ok(!/mu\.q\s*=\s*dest\.q\s*\+|mu\.r\s*=\s*dest\.r\s*\+/.test(separateLoopBody),
  'onSeparate: brak offsetu przy przenoszeniu jednostek (np. mu.q = dest.q + idx) — cała armia trafia na TEN SAM heks, nie rozprasza się z powrotem');
ok(!/assignBounceHexesForUnits\(/.test(body),
  'onSeparate: brak realnego WYWOŁANIA assignBounceHexesForUnits( w ciele handlera (samo wystąpienie nazwy w komentarzu-wyjaśnieniu historii jest dozwolone, wywołanie ze starym rozpraszaniem — nie)');

// ---------------------------------------------------------------------------
// 8) B3 (Evaluator runda 3, FAIL, 2026-08-10) — BB2 „stackGroupId": jedyna
//    linia naprawiająca ORYGINALNY zgłoszony bug (armia wraca na origin
//    zajęty przez rezydenta, pule ruchu się zlewają) jest
//    `assignSharedStackGroupId(movedUnits)` w onSeparate. Evaluator usunął tę
//    linię i WSZYSTKIE bramki (w tym funkcyjny test stackgroupid) zostały
//    zielone — funkcyjny test woła armyMerge.ts w izolacji, nie main.ts, więc
//    nie chroni WPIĘCIA. Pinujemy tekstowo obecność `assignSharedStackGroupId`
//    we WSZYSTKICH 5 realnych call-site'ach w main.ts (zweryfikowane grepem:
//    onHex-merge, onSeparate, split, merge-z-panelu/sameHexOthers,
//    merge-stosu) — usunięcie KTÓREGOKOLWIEK z pięciu MUSI dawać FAIL.
// ---------------------------------------------------------------------------

// 8a) onHex-merge (promptMergeIfCoLocated -> onMerge, PRZED onSeparateStart —
//     poza zakresem `body` wyciętego wyżej, więc osobne, wąskie okno).
{
  const start = src.indexOf('const garnizonMode = existing.every(x => x.inGarnizon === true);');
  ok(start >= 0, '[8a onHex-merge] znaleziono marker startowy (garnizonMode)');
  const end = start >= 0 ? src.indexOf('syncStackRuchLeft(onHex);', start) : -1;
  ok(end > start, '[8a onHex-merge] znaleziono marker końcowy (syncStackRuchLeft(onHex))');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/assignSharedStackGroupId\(onHex\)/.test(win),
    '[8a onHex-merge] assignSharedStackGroupId(onHex) obecne PRZED syncStackRuchLeft(onHex) — scalenie ujednolica tożsamość stosu');
}

// 8b) onSeparate — sedno BB2. Już mamy wycięty `body` z sekcji 1 powyżej.
ok(/assignSharedStackGroupId\(movedUnits\)/.test(body),
  '[8b onSeparate — SEDNO BB2] assignSharedStackGroupId(movedUnits) obecne w ciele onSeparate (bez tej linii wracająca armia i rezydent na origin dzielą pulę ruchu — dokładnie zgłoszony bug)');
{
  const assignIdx = body.indexOf('assignSharedStackGroupId(movedUnits)');
  const loopIdx = body.indexOf('for (const mu of movedUnits) {');
  ok(assignIdx >= 0 && loopIdx >= 0 && assignIdx < loopIdx,
    '[8b onSeparate] assignSharedStackGroupId(movedUnits) wołane PRZED pętlą przenoszącą jednostki (kolejność: nadaj tożsamość, potem przenieś)');
}

// 8c) split (onSplit) — jednostki odchodzące dostają WSPÓLNY, ŚWIEŻY id.
{
  const start = src.indexOf('onSplit: (ids, destQ, destR) => {');
  ok(start >= 0, '[8c split] znaleziono marker startowy (onSplit)');
  const end = start >= 0 ? src.indexOf('if (tryAutoCaptureEmptyCityAt(destQ, destR, splitArrivals))', start) : -1;
  ok(end > start, '[8c split] znaleziono marker końcowy (tryAutoCaptureEmptyCityAt)');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/assignSharedStackGroupId\(splitArrivals\)/.test(win),
    '[8c split] assignSharedStackGroupId(splitArrivals) obecne — konieczne zwłaszcza gdy destQ/destR === srcQ/srcR (opcja „W mieście, ten sam heks")');
  const assignIdx = win.indexOf('assignSharedStackGroupId(splitArrivals)');
  const loopIdx = win.indexOf('for (const u of splitArrivals) {');
  ok(assignIdx >= 0 && loopIdx >= 0 && assignIdx < loopIdx,
    '[8c split] assignSharedStackGroupId(splitArrivals) wołane PRZED pętlą przenoszącą odłączone jednostki');
}

// 8d) merge z panelu (openMergePanelForSelected, gałąź sameHexOthers — garnizon vs pole).
{
  const start = src.indexOf('const merged = coLocatedForMergePrompt(units, srcQ, srcR, active.ownerId);');
  ok(start >= 0, '[8d merge-panel] znaleziono marker startowy (const merged = coLocatedForMergePrompt)');
  const end = start >= 0 ? src.indexOf('syncStackRuchLeft(merged);', start) : -1;
  ok(end > start, '[8d merge-panel] znaleziono marker końcowy (syncStackRuchLeft(merged))');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/assignSharedStackGroupId\(merged\)/.test(win),
    '[8d merge-panel] assignSharedStackGroupId(merged) obecne PRZED syncStackRuchLeft(merged)');
}

// 8e) merge stosu (ostatnia gałąź openMergePanelForSelected — "arriving" pojedyncza jednostka).
{
  const start = src.indexOf('arrivingCount: 1,');
  ok(start >= 0, '[8e merge-stosu] znaleziono marker startowy (arrivingCount: 1,)');
  const end = start >= 0 ? src.indexOf('syncStackRuchLeft(stack);', start) : -1;
  ok(end > start, '[8e merge-stosu] znaleziono marker końcowy (syncStackRuchLeft(stack))');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/assignSharedStackGroupId\(stack\)/.test(win),
    '[8e merge-stosu] assignSharedStackGroupId(stack) obecne PRZED syncStackRuchLeft(stack)');
}

// ---------------------------------------------------------------------------
// 9) B4 (Evaluator runda 3, FAIL) — gwarancja „fallback stackGroupIdOf jest
//    BIT-IDENTYCZNY ze starym grupowaniem po heksie" (fundament decyzji
//    właściciela ECHO B: jednostki bez jawnego stackGroupId muszą zachowywać
//    się DOKŁADNIE jak przed BB2). Pinujemy dosłowny KSZTAŁT fallbacku w
//    źródle armyMerge.ts — usunięcie sufiksu `|g` (albo zamiana `+` na coś
//    innego) MUSI dawać FAIL. To pinning tekstowy uzupełniający fuzz
//    różnicowy w army-merge-stackgroupid-test.cjs (assert #B4), nie zamiennik.
// ---------------------------------------------------------------------------
const ARMY_MERGE_TS = path.join(__dirname, '..', 'src', 'game', 'armyMerge.ts');
const armyMergeSrc = fs.readFileSync(ARMY_MERGE_TS, 'utf8');
const stackGroupIdOfStart = armyMergeSrc.indexOf('export function stackGroupIdOf(');
ok(stackGroupIdOfStart >= 0, '[9 B4] znaleziono export function stackGroupIdOf( w armyMerge.ts');
const stackGroupIdOfEnd = stackGroupIdOfStart >= 0 ? armyMergeSrc.indexOf('\n}', stackGroupIdOfStart) : -1;
const stackGroupIdOfBody = (stackGroupIdOfStart >= 0 && stackGroupIdOfEnd > stackGroupIdOfStart)
  ? armyMergeSrc.slice(stackGroupIdOfStart, stackGroupIdOfEnd)
  : '';
const stackGroupIdOfFlat = stackGroupIdOfBody.replace(/\s+/g, ' ');
const FALLBACK_CORE = "u.ownerId + '|' + u.q + ',' + u.r";
ok(stackGroupIdOfFlat.includes(FALLBACK_CORE + " + '|g'"),
  '[9 B4] stackGroupIdOf: fallback dla jednostki W GARNIZONIE kończy się sufiksem `|g` (bez tego dwa różne fallbacki — garnizon i pole — zlewałyby się w main.ts, gdzie te same funkcje decydują o poolingu ruchu)');
const coreOccurrences = stackGroupIdOfFlat.split(FALLBACK_CORE).length - 1;
ok(coreOccurrences === 2,
  `[9 B4] stackGroupIdOf: rdzeń fallbacku ownerId+"|"+q+","+r (identyczny kształt jak PRZED BB2) występuje DOKŁADNIE 2 razy — raz z sufiksem |g (garnizon), raz bez (pole) — znaleziono ${coreOccurrences}`);

// ---------------------------------------------------------------------------
// 10) B-R5-1 (Evaluator runda 5, FAIL, 2026-08-10) — runda 4 naprawiła klucz
//     grupowania WYŁĄCZNIE w armyMerge.ts:computeStackDisplay (stackGroupIdOf(u)
//     + pozycja + garnizon), ale zostawiła TEN SAM defekt (gołe
//     stackGroupIdOf(u), BEZ pozycji) w trzech niezależnych miejscach main.ts,
//     które robią własne, równoległe grupowanie stosu po heksie:
//     cyclablePlayerArmyLeadsBase, armyLeadHexKey, buildPlayerArmyListEntries.
//     Naprawa: `stackRenderKey(u)` (eksportowana z armyMerge.ts, JEDYNY punkt
//     prawdy — ta sama funkcja, którą woła computeStackDisplay) we wszystkich
//     trzech. Pinujemy KSZTAŁT klucza w tych trzech oknach: musi zawierać
//     WYWOŁANIE `stackRenderKey(` (nie samą nazwę w komentarzu), i NIE może
//     zawierać gołego `stackGroupIdOf(u)` jako całego klucza (bez pozycji).
// ---------------------------------------------------------------------------

// 10a) cyclablePlayerArmyLeadsBase.
{
  const start = src.indexOf('function cyclablePlayerArmyLeadsBase(requireMoves: boolean): RuntimeUnit[] {');
  ok(start >= 0, '[10a cyclablePlayerArmyLeadsBase] znaleziono marker startowy funkcji');
  const end = start >= 0 ? src.indexOf('\n    }\n', start) : -1;
  ok(end > start, '[10a cyclablePlayerArmyLeadsBase] znaleziono koniec funkcji');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/const key = stackRenderKey\(u\);/.test(win),
    '[10a cyclablePlayerArmyLeadsBase] klucz grupowania = stackRenderKey(u) (tożsamość + POZYCJA + garnizon, nie gołe stackGroupIdOf)');
  ok(!/const key = stackGroupIdOf\(u\);/.test(win),
    '[10a cyclablePlayerArmyLeadsBase] klucz NIE jest gołym stackGroupIdOf(u) bez pozycji — B-R5-1 nie wrócił');
}

// 10b) armyLeadHexKey.
{
  const start = src.indexOf('function armyLeadHexKey(u: RuntimeUnit): string {');
  ok(start >= 0, '[10b armyLeadHexKey] znaleziono marker startowy funkcji');
  const end = start >= 0 ? src.indexOf('\n    }\n', start) : -1;
  ok(end > start, '[10b armyLeadHexKey] znaleziono koniec funkcji');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/return stackRenderKey\(u\);/.test(win),
    '[10b armyLeadHexKey] return stackRenderKey(u) — spójne z cyclablePlayerArmyLeadsBase (10a), inaczej fallback po zniknięciu afterId trafia niewłaściwą armię');
  ok(!/return stackGroupIdOf\(u\);/.test(win),
    '[10b armyLeadHexKey] NIE zwraca gołego stackGroupIdOf(u) bez pozycji — B-R5-1 nie wrócił');
}

// 10c) buildPlayerArmyListEntries.
{
  const start = src.indexOf('// C-GARN-Q1: ufortyfikowane jednostki grupuj po heksie miasta (jak armia),');
  ok(start >= 0, '[10c buildPlayerArmyListEntries] znaleziono marker startowy (komentarz C-GARN-Q1)');
  const end = start >= 0 ? src.indexOf('else stacks.set(key, [u]);', start) : -1;
  ok(end > start, '[10c buildPlayerArmyListEntries] znaleziono marker końcowy (else stacks.set(key, [u]);)');
  const win = (start >= 0 && end > start) ? src.slice(start, end) : '';
  ok(/const key = stackRenderKey\(u\);/.test(win),
    '[10c buildPlayerArmyListEntries] klucz grupowania = stackRenderKey(u) — dwie armie o różnym stackGroupId na wspólnym origin NIE zlewają się w jeden wpis listy');
  ok(!/const key = stackGroupIdOf\(u\);/.test(win),
    '[10c buildPlayerArmyListEntries] klucz NIE jest gołym stackGroupIdOf(u) bez pozycji — B-R5-1 (jednostka na drugim heksie znika z listy armii) nie wrócił');
}

// ---------------------------------------------------------------------------
// 11) B-R5-1 — SCENARIUSZ REGRESYJNY odtwarzający dowód Evaluatora rundy 5:
//     scalona grupa 2 jednostek na WSPÓLNYM heksie (jeden stackGroupId) →
//     jedna jednostka „ucieka" na inny heks przez bezpośrednią mutację
//     u.q/u.r (dokładnie to, co robi advanceScoutAutoExplore w
//     game/scout-auto-explore.ts:234-235 dla zwiadowcy, albo post-battle-map.ts
//     dla cywila zostawionego na origin) — logika grupowania
//     buildPlayerArmyListEntries MUSI dać DWA wpisy (2 różne heksy), nie
//     JEDEN wpis obejmujący oba heksy naraz (co gubiłoby jedną z jednostek z
//     listy armii i sumowało ruch/HP przez dwa miejsca).
//
//     Testujemy SAMĄ logikę grupowania (stackRenderKey + Map<string,
//     RuntimeUnit[]>), nie całe UI main.ts — zgodnie z zadaniem („przetestuj
//     samą logikę grupowania, nie całe UI").
// ---------------------------------------------------------------------------
{
  const esbuild = require('esbuild');
  const ENTRY = path.join(__dirname, '.army-merge-b-r5-1-entry.ts');
  const BUNDLE = path.join(__dirname, '.army-merge-b-r5-1-bundle.cjs');
  fs.writeFileSync(
    ENTRY,
    `import { stackRenderKey, assignSharedStackGroupId } from '../src/game/armyMerge';
export { stackRenderKey, assignSharedStackGroupId };`,
  );
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE,
    logLevel: 'silent',
  });
  const { stackRenderKey, assignSharedStackGroupId } = require(BUNDLE);

  function unit(over) {
    return Object.assign({
      id: 'u', ownerId: 0, typeId: 'Zwiadowca', category: 'zwiadowca',
      q: 0, r: 0, ruch: 3, ruchLeft: 3,
    }, over);
  }

  // Grupowanie IDENTYCZNE z buildPlayerArmyListEntries/cyclablePlayerArmyLeadsBase.
  function groupByRenderKey(list) {
    const stacks = new Map();
    for (const u of list) {
      const key = stackRenderKey(u);
      const arr = stacks.get(key);
      if (arr) arr.push(u);
      else stacks.set(key, [u]);
    }
    return stacks;
  }

  // Scalona grupa 2 jednostek (Miecznik + Zwiadowca) na WSPÓLNYM heksie (5,5).
  const soldier = unit({ id: 'soldier', typeId: 'Miecznik', category: 'piechota', q: 5, r: 5 });
  const scout = unit({ id: 'scout', q: 5, r: 5 });
  const roster = [soldier, scout];
  assignSharedStackGroupId(roster); // merge realny — jeden wspólny stackGroupId.
  ok(stackRenderKey(soldier) === stackRenderKey(scout),
    '[11 regresja B-R5-1] PRZED ucieczką: soldier i scout mają IDENTYCZNY stackRenderKey (jedna grupa, jeden heks)');

  const groupsBefore = groupByRenderKey(roster);
  ok(groupsBefore.size === 1,
    `[11 regresja B-R5-1] PRZED ucieczką: grupowanie daje DOKŁADNIE 1 wpis dla obu jednostek na wspólnym heksie (dostano ${groupsBefore.size})`);

  // Zwiadowca „ucieka" auto-explore — dokładnie advanceScoutAutoExplore:
  // bezpośrednia mutacja u.q/u.r, BEZ zmiany stackGroupId (ten sam roster).
  scout.q = 9;
  scout.r = 9;

  ok(stackRenderKey(soldier) !== stackRenderKey(scout),
    '[11 regresja B-R5-1] PO ucieczce: soldier (5,5) i scout (9,9) mają RÓŻNY stackRenderKey mimo TEGO SAMEGO stackGroupId (pozycja jest częścią klucza)');

  const groupsAfter = groupByRenderKey(roster);
  ok(groupsAfter.size === 2,
    `[11 regresja B-R5-1 — DOWÓD] PO ucieczce zwiadowcy na inny heks: grupowanie daje DOKŁADNIE 2 wpisy (soldier i scout osobno), NIE 1 wpis obejmujący oba heksy naraz (dostano ${groupsAfter.size})`);
  ok([...groupsAfter.values()].every(g => g.length === 1),
    '[11 regresja B-R5-1] każdy z dwóch wpisów zawiera DOKŁADNIE 1 jednostkę (żadna nie zniknęła, żadna nie zdublowała się)');

  try { fs.unlinkSync(ENTRY); } catch { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* ignore */ }
}

console.log(`\narmy-merge-separate-return-mainguard-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
