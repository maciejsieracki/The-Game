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

console.log(`\narmy-merge-separate-return-mainguard-test: ${pass} pass, ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
