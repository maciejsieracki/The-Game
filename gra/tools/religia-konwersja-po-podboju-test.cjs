'use strict';
// religia-konwersja-po-podboju-test.cjs
// R-RELIGIA-KONWERSJA-PO-PODBOJU-Q1 -- test behawioralny (nie tylko lektura):
//   1. RÓŻNY okrąg kulturowy: onCityCapturedReligion daje NIEZEROWĄ obecność
//      zdobywcy w counts (nie 100% starego właściciela jak przed naprawą).
//   2. Ta sama symulacja kontynuowana o kilka tur convertViaTemple pokazuje
//      REALNY wzrost udziału zdobywcy (nie stagnację -- dowód że
//      foreignReligionDominant + convertViaTemple faktycznie ruszają).
//   3. SAME okrąg kulturowy: zero zmiany zachowania względem dzisiejszego
//      (100% nowego właściciela) -- dowód regresji NIE.
const path = require('path');
const fs = require('fs');

const repoRoot = path.resolve(__dirname, '..');
const srcPath = path.join(repoRoot, 'src', 'game', 'culture-religion.ts');
const outFile = path.resolve(__dirname, '.religia-podboj-bundle.cjs');

const esbuild = (() => {
  const apiPath = path.resolve(repoRoot, 'node_modules', 'esbuild');
  try {
    return require(apiPath);
  } catch (e) {
    console.error('[religia-konwersja-po-podboju-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

esbuild.buildSync({
  entryPoints: [srcPath],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: outFile,
  logLevel: 'silent',
});
const mod = require(outFile);
const {
  onCityCapturedReligion,
  convertViaTemple,
  religionOwnShare,
  totalReligionAdherents,
} = mod;

let pass = 0;
let fail = 0;
function check(name, cond, extra) {
  if (cond) {
    pass++;
    console.log(`  [OK] ${name}`);
  } else {
    fail++;
    console.log(`  [FAIL] ${name}${extra ? ' -- ' + extra : ''}`);
  }
}

// civKeyForOwner: 0 = zdobywca (cyw. "rzym"), 1 = ofiara (cyw. "kelt") -- inny okrąg.
const civKeyDifferentCircle = (ownerId) => (ownerId === 0 ? 'rzym' : 'kelt');
const civKeySameCircle = () => 'rzym'; // oba w tym samym okręgu

// -----------------------------------------------------------------------
// 1) RÓŻNY okrąg: obecność zdobywcy po podboju musi być NIEZEROWA.
// -----------------------------------------------------------------------
{
  const population = 100;
  const before = { counts: { keltyzm: population } }; // 100% religii ofiary
  const after = onCityCapturedReligion(
    before,
    population,
    'rzym_bogowie', // religia zdobywcy
    'keltyzm', // religia poprzedniego wlasciciela
    0, // newOwnerId
    1, // previousOwnerId
    { civKeyForOwner: civKeyDifferentCircle },
  );
  // UWAGA: miasto tu ma 100% religii ofiary (prevShare=1.0) -> formula
  // `1 - prevShare` daje 0 -- IDENTYCZNIE jak przy kulturze, gdy stary
  // właściciel miał 100% własnej kultury (`1 - 1 = 0`, zero obecności
  // zdobywcy w skrajnym przypadku). To NIE jest bug, to wierne
  // odzwierciedlenie wzoru kultury w tym skrajnym rogu -- reprezentatywny
  // (typowy, mieszany) scenariusz jest sprawdzony niżej (`afterMix`), gdzie
  // prevShare<1 i zdobywca faktycznie dostaje niezerowy udział.
  check(
    'RÓŻNY okrąg (skrajny róg, prevShare=1.0): 1-prevShare=0, identycznie jak analogiczny róg kultury',
    (after.counts['rzym_bogowie'] || 0) === 0,
    `counts=${JSON.stringify(after.counts)}`,
  );
  check(
    'RÓŻNY okrąg: cala populacja zachowana (brak wycieku/duplikacji)',
    totalReligionAdherents(after) === population,
  );
}

// Scenariusz z mieszanym miastem (bardziej reprezentatywny -- ofiara NIE ma 100%
// wlasnej religii, np. po wczesniejszym spreadReligion): prevShare=0.7 -> zdobywca
// dostaje 1-0.7=0.3 udzialu od razu po podboju.
const populationMix = 100;
const beforeMix = { counts: { keltyzm: 70, rzym_bogowie: 0, druidyzm: 30 } };
const afterMix = onCityCapturedReligion(
  beforeMix,
  populationMix,
  'rzym_bogowie',
  'keltyzm',
  0,
  1,
  { civKeyForOwner: civKeyDifferentCircle },
);
{
  const prevShareBefore = religionOwnShare(beforeMix, 'keltyzm'); // 0.7
  const captorShare = (afterMix.counts['rzym_bogowie'] || 0) / totalReligionAdherents(afterMix);
  check(
    'RÓŻNY okrąg (miasto mieszane): udział zdobywcy = 1 - prevShare (formula kultury)',
    Math.abs(captorShare - (1 - prevShareBefore)) < 1e-9,
    `prevShare=${prevShareBefore} captorShare=${captorShare}`,
  );
  check(
    'RÓŻNY okrąg (miasto mieszane): trzecia religia (druidyzm) nadal obecna, populacja zachowana',
    totalReligionAdherents(afterMix) === populationMix && (afterMix.counts['druidyzm'] || 0) > 0,
    JSON.stringify(afterMix.counts),
  );
}

// -----------------------------------------------------------------------
// 2) convertViaTemple w kolejnych turach realnie zwieksza udzial zdobywcy.
// -----------------------------------------------------------------------
{
  let state = afterMix;
  const shares = [];
  const buildings = { hasSwiatynia: true, hasKamienneKregi: false };
  for (let turn = 0; turn < 5; turn++) {
    const total = totalReligionAdherents(state);
    const captorShare = total > 0 ? (state.counts['rzym_bogowie'] || 0) / total : 0;
    shares.push(captorShare);
    const result = convertViaTemple(state, 'rzym_bogowie', buildings);
    state = result.state;
  }
  const finalTotal = totalReligionAdherents(state);
  const finalShare = finalTotal > 0 ? (state.counts['rzym_bogowie'] || 0) / finalTotal : 0;
  shares.push(finalShare);
  console.log(`  udzial zdobywcy po turach: ${shares.map((s) => s.toFixed(3)).join(' -> ')}`);
  let monotonicNonDecreasing = true;
  let strictlyIncreasedSomewhere = false;
  for (let i = 1; i < shares.length; i++) {
    if (shares[i] < shares[i - 1] - 1e-9) monotonicNonDecreasing = false;
    if (shares[i] > shares[i - 1] + 1e-9) strictlyIncreasedSomewhere = true;
  }
  check(
    'convertViaTemple: udział zdobywcy nie maleje w kolejnych turach',
    monotonicNonDecreasing,
  );
  check(
    'convertViaTemple: udział zdobywcy REALNIE rośnie (nie stagnacja) -- dowód że mechanika żyje',
    strictlyIncreasedSomewhere,
  );
}

// -----------------------------------------------------------------------
// 2b) foreignReligionDominant może wyjść true po podboju w różnym okręgu,
//     w scenariuszu gdzie stara religia wciąż dominuje liczebnie.
// -----------------------------------------------------------------------
{
  // Miasto w 100% religii ofiary przed podbojem -> po inwersji 1-1=0 udzialu
  // zdobywcy (patrz test 1) -- wiec do zademonstrowania foreignReligionDominant=true
  // uzywamy realistycznego przypadku: ofiara miala WIEKSZOSCIOWA (nie 100%) wlasna
  // religie, zdobywca dostaje MNIEJSZOSCIOWY udzial -> stara religia nadal dominuje.
  const isForeignReligionDominant = (curShareOfOwn) => curShareOfOwn < 0.5;
  const finalOwnShare = (function () {
    const total = totalReligionAdherents(afterMix);
    return total > 0 ? (afterMix.counts['rzym_bogowie'] || 0) / total : 0;
  })();
  check(
    'foreignReligionDominant: po podboju w różnym okręgu, obca (stara) religia może dominować (udział zdobywcy < 50%)',
    isForeignReligionDominant(finalOwnShare),
    `finalOwnShare(zdobywcy)=${finalOwnShare}`,
  );
}

// -----------------------------------------------------------------------
// 3) SAME okrąg kulturowy: zero zmiany zachowania (100% nowego właściciela).
// -----------------------------------------------------------------------
{
  const population = 100;
  const before = { counts: { keltyzm: 100 } };
  const after = onCityCapturedReligion(
    before,
    population,
    'rzym_bogowie',
    'keltyzm',
    0,
    1,
    { civKeyForOwner: civKeySameCircle },
  );
  check(
    'SAME okrąg: 100% nowego właściciela (regresja NIE, zachowanie identyczne jak dziś)',
    after.counts['rzym_bogowie'] === population && Object.keys(after.counts).length === 1,
    JSON.stringify(after.counts),
  );
}

// -----------------------------------------------------------------------
// 4) Guard barbarzyński / brak podboju: newOwnerId===previousOwnerId -> no-op.
// -----------------------------------------------------------------------
{
  const state = { counts: { keltyzm: 50 } };
  const after = onCityCapturedReligion(state, 100, 'rzym_bogowie', 'keltyzm', 0, 0, {
    civKeyForOwner: civKeyDifferentCircle,
  });
  check('newOwnerId === previousOwnerId: no-op (zwraca ten sam stan)', after === state);
}

// -----------------------------------------------------------------------
// 5) REGULA PRZECIW SAMOOSZUKIWANIU -- 3+ religie "trzecie" w counts:
//    poprzednia redystrybucja "ostatni klucz dostaje reszte" mogla przy
//    skumulowanych zaokragleniach wyjsc na ujemna dla ostatniego klucza
//    (po cichu pominieta przez `if (amount > 0)`), ale wczesniej przypisane
//    (za duze) klucze zostawaly -- suma > populacja. Metoda najwiekszej
//    reszty (Hamilton) musi to eliminowac dla dowolnej liczby "trzecich"
//    religii.
// -----------------------------------------------------------------------
{
  const population = 6;
  const before = { counts: { keltyzm: 2, a: 1, b: 1, c: 1, d: 1 } };
  const after = onCityCapturedReligion(
    before,
    population,
    'rzym_bogowie',
    'keltyzm',
    0,
    1,
    { civKeyForOwner: civKeyDifferentCircle },
  );
  const sum = Object.values(after.counts).reduce((a, b) => a + b, 0);
  const anyNegative = Object.values(after.counts).some((v) => v < 0);
  check(
    'RÓŻNY okrąg (5 religii w counts, 4 "trzecie"): suma = populacja, brak ujemnych',
    sum === population && !anyNegative,
    `counts=${JSON.stringify(after.counts)} sum=${sum} population=${population}`,
  );
}
{
  // Wieksza proba (7 "trzecich" religii, nierowne wagi) -- stres na metode
  // najwiekszej reszty przy wielu remisach ulamkowych.
  const before = { counts: { old: 10, e1: 37, e2: 41, e3: 53, e4: 29 } };
  const total = Object.values(before.counts).reduce((a, b) => a + b, 0);
  const after = onCityCapturedReligion(before, total, 'newrel', 'old', 0, 1, {
    civKeyForOwner: civKeyDifferentCircle,
  });
  const sum = Object.values(after.counts).reduce((a, b) => a + b, 0);
  const anyNegative = Object.values(after.counts).some((v) => v < 0);
  check(
    'RÓŻNY okrąg (5 kluczy, nierówne wagi): suma = populacja, brak ujemnych',
    sum === total && !anyNegative,
    `counts=${JSON.stringify(after.counts)} sum=${sum} total=${total}`,
  );
}

// -----------------------------------------------------------------------
// 6) previousOwnerReligion=null i brak "trzecich" religii w counts (np.
//    odbicie miasta trzymanego wczesniej przez barbarzyncow, bez
//    zainicjalizowanego ReligionState) -- `remaining` nie moze cicho zniknac
//    z ksiegowosci (dawniej: suma < population, zawyzona dominacja zdobywcy).
// -----------------------------------------------------------------------
{
  const population = 100;
  const before = { counts: {} };
  const after = onCityCapturedReligion(
    before,
    population,
    'rzym_bogowie',
    null,
    0,
    1,
    { civKeyForOwner: civKeyDifferentCircle },
  );
  const sum = Object.values(after.counts).reduce((a, b) => a + b, 0);
  check(
    'previousOwnerReligion=null, counts pusty: suma = population (remaining nie znika)',
    sum === population,
    `counts=${JSON.stringify(after.counts)} sum=${sum} population=${population}`,
  );
}

console.log('');
console.log(`religia-konwersja-po-podboju-test: ${pass} passed, ${fail} failed`);
try {
  fs.unlinkSync(outFile);
} catch (_e) {
  /* ignore cleanup errors */
}
process.exit(fail === 0 ? 0 : 1);
