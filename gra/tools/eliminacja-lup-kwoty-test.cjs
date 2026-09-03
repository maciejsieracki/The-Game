'use strict';
/**
 * eliminacja-lup-kwoty-test.cjs -- R-MIASTA-ELIMINACJA-LUP-KWOTY-Q1.
 *
 * Cel: dowieść, że `eliminatedDetails` (main.ts, wewnątrz runCapitalCapturePlunder)
 * pokazuje graczowi KONKRETNE, sprawdzalne kwoty złota/nauki przejętego przy eliminacji
 * cywilizacji -- nie ogólnikowe "Skarbiec, nauka i N tech(y) przejęte" sprzed tej zmiany.
 *
 * main.ts żyje w jednym wielkim domknięciu (nie eksportowane, nie bundlowalny -- patrz
 * nagłówek capital-capture-test.cjs / elimination-toast-merge-test.cjs dla tego samego
 * ograniczenia w tym repo). Żeby DOWIEŚĆ faktyczny wygenerowany tekst (nie tylko
 * wyklikać go z kodu źródłowego), ten test:
 *   1. Wyciąga REGEXEM dokładny blok main.ts budujący `eliminatedDetails` (od
 *      `const skarbiecKwota = ...` do `;` kończącego przypisanie `eliminatedDetails`).
 *   2. URUCHAMIA ten wyciągnięty kod przez `new Function(...)` z realnym `outcome`
 *      (produktem RZECZYWISTEGO applyCapitalCapturePlunder z capital-capture.ts,
 *      zbundlowanego esbuildem -- ten sam wzorzec co capital-capture-test.cjs), oraz
 *      `barbCaptor`/`lostPower`.
 *   3. Asercje sprawdzają DOKŁADNY string zwrócony przez tę egzekucję -- nie kod, nie
 *      założenie o istnieniu formatera walutowego (sprawdzone grepem: main.ts NIE ma
 *      dedykowanego formattera kwot -- inne miejsca też robią plain `${amount} złota` /
 *      `${amount} nauki`, np. main.ts:22106 `'Chatka (...): +' + amount + ' złota'` i
 *      main.ts:27817 `'−' + done.koszt + ' nauki'`).
 *
 * Usage (z gra/): node tools/eliminacja-lup-kwoty-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const MAIN_TS_PATH = path.resolve(GRA, 'src', 'main.ts');
const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

let pass = 0;
let fail = 0;
function ok(cond, label) {
  if (cond) { pass++; console.log('  OK: ' + label); }
  else { fail++; console.log('  FAIL: ' + label); }
}
function eq(a, b, label) {
  ok(a === b, `${label} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ===========================================================================
// 0. Reguła przeciw samooszukiwaniu: main.ts NIE ma dedykowanego formattera
//    walut/liczb -- inne komunikaty w pliku też sklejają plain `${amount} złota`
//    / `${amount} nauki` bez separatorów tysięcy ani zaokrąglania do formatu.
// ===========================================================================
console.log('0. main.ts nie ma gotowego formattera waluty (grep-owalny dowód)');
{
  ok(mainSrc.includes("'Chatka (' + label + '): +' + amount + ' złota'"),
    "0a: main.ts (Chatka barbarzyńska) skleja plain '+' + amount + ' złota' -- ten sam wzorzec");
  ok(mainSrc.includes("'\\u2212' + done.koszt + ' nauki'"),
    "0b: main.ts (log badania techu) skleja plain '\\u2212' + koszt + ' nauki' -- ten sam wzorzec");
  ok(!/function\s+formatGold|function\s+formatZloto|function\s+formatCurrency|function\s+formatKwota/.test(mainSrc),
    '0c: brak funkcji formatGold/formatZloto/formatCurrency/formatKwota w main.ts');
}

// ===========================================================================
// 1. Wyciągnięcie DOKŁADNEGO bloku main.ts budującego eliminatedDetails.
// ===========================================================================
console.log('1. Wyciąganie bloku main.ts (skarbiecKwota..eliminatedDetails)');
let blockCode = '';
{
  const startMarker = 'const skarbiecKwota = Math.floor(outcome.skarbiecPrzejety);';
  const startIdx = mainSrc.indexOf(startMarker);
  ok(startIdx >= 0, '1a: znaleziono start bloku (const skarbiecKwota = Math.floor(...))');

  const endMarker = "`${skarbiecText}${naukaText} ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.`;";
  const endIdx = startIdx >= 0 ? mainSrc.indexOf(endMarker, startIdx) : -1;
  ok(endIdx > startIdx, '1b: znaleziono koniec bloku (przypisanie eliminatedDetails)');

  blockCode = startIdx >= 0 && endIdx > startIdx
    ? mainSrc.slice(startIdx, endIdx + endMarker.length)
    : '';
  ok(blockCode.length > 0, '1c: blok niepusty');

  // Regresja struktury: dokładnie te 5 deklaracji const w bloku, w tej kolejności.
  ok(/const skarbiecKwota = Math\.floor\(outcome\.skarbiecPrzejety\);/.test(blockCode),
    '1d: blok zawiera "const skarbiecKwota = Math.floor(outcome.skarbiecPrzejety);"');
  ok(/const naukaKwota = Math\.floor\(outcome\.naukaPrzejeta\);/.test(blockCode),
    '1e: blok zawiera "const naukaKwota = Math.floor(outcome.naukaPrzejeta);"');
  ok(blockCode.includes('const eliminatedDetails = barbCaptor'),
    '1f: blok zawiera przypisanie eliminatedDetails warunkowane barbCaptor');
}

// ===========================================================================
// 2. Egzekucja wyciągniętego kodu (new Function) z realnymi wartościami
//    outcome/barbCaptor/lostPower -- dowód RUNTIME, nie tylko lektura kodu.
// ===========================================================================
function renderEliminatedDetails(outcome, barbCaptor, lostPower) {
  const fn = new Function(
    'outcome', 'barbCaptor', 'lostPower',
    blockCode + '\nreturn eliminatedDetails;',
  );
  return fn(outcome, barbCaptor, lostPower);
}

console.log('2. Egzekucja bloku wyciągniętego z main.ts -- konkretne teksty');
{
  // 2a. Skarbiec > 0, nauka = 0 (Zdarzenie 1 -- przejęcie stolicy z sukcesją, ale
  //     traktowane tu tak samo jak w main.ts: outcome jest wspólnym typem dla obu zdarzeń).
  const outcomeA = { skarbiecPrzejety: 1234, naukaPrzejeta: 0, techSkopiowane: ['a', 'b', 'c'] };
  const textA = renderEliminatedDetails(outcomeA, false, 777);
  eq(
    textA,
    'Skarbiec: +1234 złota. 3 tech(y) przejęte. Zdobycze Power: +777.',
    '2a: skarbiec=1234, nauka=0 -> tekst zawiera DOKŁADNĄ kwotę złota (1234), bez wzmianki o nauce',
  );
  ok(textA.includes('1234'), '2a-kontrola: "1234" (skarbiecPrzejety) jest literalnie w wygenerowanym tekście');

  // 2b. Skarbiec = 0 -- jawna informacja "był pusty", NIE milczenie.
  const outcomeB = { skarbiecPrzejety: 0, naukaPrzejeta: 0, techSkopiowane: [] };
  const textB = renderEliminatedDetails(outcomeB, false, 50);
  eq(
    textB,
    'Skarbiec był pusty. 0 tech(y) przejęte. Zdobycze Power: +50.',
    '2b: skarbiec=0 -> "Skarbiec był pusty." jawnie obecne, komunikat NIE milczy',
  );
  ok(textB.includes('pusty'), '2b-kontrola: słowo "pusty" jest w wygenerowanym tekście');

  // 2c. Nauka > 0 (Zdarzenie 2 -- eliminacja) -- kwota nauki obecna dokładnie.
  const outcomeC = { skarbiecPrzejety: 500, naukaPrzejeta: 88, techSkopiowane: ['brazownictwo'] };
  const textC = renderEliminatedDetails(outcomeC, false, 300);
  eq(
    textC,
    'Skarbiec: +500 złota. Nauka: +88 nauki. 1 tech(y) przejęte. Zdobycze Power: +300.',
    '2c: skarbiec=500, nauka=88 -> OBIE kwoty dokładne w tekście',
  );
  ok(textC.includes('88'), '2c-kontrola: "88" (naukaPrzejeta) jest literalnie w wygenerowanym tekście');
  ok(textC.includes('500'), '2c-kontrola: "500" (skarbiecPrzejety) jest literalnie w wygenerowanym tekście');

  // 2d. Math.floor -- kwoty ułamkowe (skarbiec/nauka narastają per turę, patrz main.ts
  //     Math.floor(player.skarbiec)/Math.floor(player.nauka) przy HUD) są ścinane spójnie
  //     z resztą UI, nie pokazują graczowi ułamków.
  const outcomeD = { skarbiecPrzejety: 250.7, naukaPrzejeta: 12.9, techSkopiowane: [] };
  const textD = renderEliminatedDetails(outcomeD, false, 10);
  eq(
    textD,
    'Skarbiec: +250 złota. Nauka: +12 nauki. 0 tech(y) przejęte. Zdobycze Power: +10.',
    '2d: kwoty ułamkowe ścięte Math.floor (250.7->250, 12.9->12), spójnie z HUD gracza',
  );

  // 2e. Regresja -- gałąź barbarzyńska BEZ ZMIAN (GOAL 2 dispatcha).
  const outcomeE = { skarbiecPrzejety: 999, naukaPrzejeta: 40, techSkopiowane: ['x'] };
  const textE = renderEliminatedDetails(outcomeE, true, 5);
  eq(
    textE,
    'Skarbiec i nauka przepadły (barbarzyńcy nie dziedziczą łupu).',
    '2e: barbCaptor=true -> tekst identyczny jak przed zmianą, bez kwot (barbarzyńcy nie dziedziczą)',
  );
}

// ===========================================================================
// 3. Zero regresji: Power (+lostPower) i "N tech(y) przejęte" nadal obecne
//    DOKŁADNIE jak wcześniej (ta sama końcówka zdania, tylko z dodanym prefiksem kwot).
// ===========================================================================
console.log('3. Zero regresji Power/tech (substring identyczny jak przed zmianą)');
{
  ok(blockCode.includes('${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.'),
    '3a: końcówka szablonu (N tech(y) przejęte. Zdobycze Power: +X.) obecna DOKŁADNIE jak w oryginale');
}

// ===========================================================================
// 4. Żywy dowód end-to-end: REALNY outcome z applyCapitalCapturePlunder
//    (capital-capture.ts zbundlowany esbuildem, nie mock/reimplementacja) ->
//    wyciągnięty blok main.ts -> tekst finalny z REALNYMI liczbami z silnika.
// ===========================================================================
console.log('4. Żywy dowód -- realna eliminacja w capital-capture.ts -> tekst finalny');
{
  const esbuild = (() => {
    const apiPath = path.resolve(GRA, 'node_modules', 'esbuild');
    try { return require(apiPath); }
    catch (e) {
      console.error('  [eliminacja-lup-kwoty-test] esbuild not found. Run: npm install (from gra/)');
      process.exit(1);
    }
  })();

  const ENTRY_FILE = path.resolve(__dirname, '.eliminacja-lup-kwoty-entry.ts');
  const BUNDLE_FILE = path.resolve(__dirname, '.eliminacja-lup-kwoty-bundle.cjs');
  fs.writeFileSync(
    ENTRY_FILE,
    "export { applyCapitalCapturePlunder } from '../src/game/capital-capture';\n"
    + "export { computeObjectivePower } from '../src/game/power-objective';\n",
    'utf8',
  );
  try {
    esbuild.buildSync({
      entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs',
      target: 'node18', outfile: BUNDLE_FILE, logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
    });
  } catch (e) {
    console.error('  [eliminacja-lup-kwoty-test] esbuild bundling failed:\n', e.message || e);
    process.exit(1);
  }
  const { applyCapitalCapturePlunder } = require(BUNDLE_FILE);

  function city(id, ownerId) { return { id, ownerId, q: 0, r: 0, name: id, population: 1 }; }
  function makeAccess(seed) {
    const skarbiec = new Map(Object.entries(seed.skarbiec || {}).map(([k, v]) => [Number(k), v]));
    const praca = new Map();
    const nauka = new Map(Object.entries(seed.nauka || {}).map(([k, v]) => [Number(k), v]));
    const techy = new Map(Object.entries(seed.techy || {}).map(([k, v]) => [Number(k), new Set(v)]));
    return {
      getTreasury: (oid) => skarbiec.get(oid) ?? 0,
      setTreasury: (oid, v) => skarbiec.set(oid, Math.max(0, v)),
      getPracaPool: (oid) => praca.get(oid) ?? 0,
      setPracaPool: (oid, v) => praca.set(oid, Math.max(0, v)),
      getNaukaPool: (oid) => nauka.get(oid) ?? 0,
      setNaukaPool: (oid, v) => nauka.set(oid, Math.max(0, v)),
      getResearchedTechs: (oid) => techy.get(oid) ?? new Set(),
      addResearchedTechs: (oid, ids) => {
        if (!techy.has(oid)) techy.set(oid, new Set());
        const s = techy.get(oid);
        for (const id of ids) s.add(id);
      },
    };
  }

  // Gracz (ownerId 0) eliminuje AI (ownerId 3) -- jedyne miasto AI, skarbiec 1500,
  // pula nauki 63, dwa techy brakujące zwycięzcy.
  const citiesAfter = [city('cityLast', 0)];
  const access = makeAccess({
    skarbiec: { 3: 1500, 0: 0 },
    nauka: { 3: 63 },
    techy: { 3: ['brazownictwo', 'kolo'], 0: [] },
  });
  const outcome = applyCapitalCapturePlunder(city('cityLast', 0), 3, 0, citiesAfter, access);
  ok(outcome !== null, '4a: realna eliminacja -> outcome niepusty');
  eq(outcome.eliminacja, true, '4b: eliminacja=true (ostatnie miasto AI)');
  eq(outcome.skarbiecPrzejety, 1500, '4c: outcome.skarbiecPrzejety = 1500 (realny wynik silnika)');
  eq(outcome.naukaPrzejeta, 63, '4d: outcome.naukaPrzejeta = 63 (realny wynik silnika)');

  const lostPower = 420; // wartość niezależna od pluodru -- symuluje buildObjectivePowerForOwner
  const finalText = renderEliminatedDetails(outcome, false, lostPower);
  console.log('  >>> WYGENEROWANY KOMUNIKAT (żywy dowód): ' + JSON.stringify(finalText));
  eq(
    finalText,
    'Skarbiec: +1500 złota. Nauka: +63 nauki. 2 tech(y) przejęte. Zdobycze Power: +420.',
    '4e: pełny tekst finalny zbudowany z REALNEGO outcome silnika (1500 złota, 63 nauki, 2 techy, 420 Power)',
  );

  try { fs.unlinkSync(ENTRY_FILE); } catch (e) {}
  try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
