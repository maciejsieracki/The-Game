'use strict';
/**
 * hud-obywatele-chip-test.cjs — P-BRAK-LACZNEJ-LICZBY-OBYWATELI-W-HUD (Maciej 2026-08-12)
 * Run: cd gra && node tools/hud-obywatele-chip-test.cjs
 *
 * Właściciel zgłosił: górny pasek HUD ma liczniki „Armia" i „Miasta", ale brak ŁĄCZNEJ
 * liczby obywateli (sumy `population` wszystkich miast imperium gracza). Naprawa: nowy
 * chip „Obywatele" w hud.ts (rightChips), wartość = `s.ludnosc` — pole HudState, które
 * main.ts::buildHudState JUŻ liczyło (`pop = pc.reduce((s,c)=>s+c.population,0)` dla
 * `pc = cities.filter(c=>c.ownerId===0)`), ale nigdy nie wyświetlało wprost w pasku.
 *
 * Ten test pilnuje TRZECH warstw, żeby liczba na chipie nigdy nie mogła się „rozjechać"
 * z realną sumą populacji miast gracza:
 *   1. FORMUŁA — suma `population` filtrowana po `ownerId` daje poprawny wynik
 *      arytmetyczny na fixture'ach (w tym: miasta innych cywilizacji WYŁĄCZONE z sumy,
 *      pusta lista -> 0, jedno miasto, wiele miast).
 *   2. ŹRÓDŁO PRAWDY W main.ts — `buildHudState()` liczy `ludnosc` DOKŁADNIE tą samą
 *      formułą (regex/substring na main.ts) i to jest JEDYNE miejsce, które oblicza tę
 *      sumę dla HUD-a — nowy chip nie dostał własnego, osobnego przeliczenia.
 *   3. RENDER W hud.ts — chip „Obywatele" czyta `s.ludnosc` (to samo pole, bez lokalnej
 *      re-kalkulacji), a chip „Miasta" nadal pokazuje `s.osiedla` (liczbę miast) —
 *      obie liczby zostają rozróżnialne, żadna nie została przypadkiem podmieniona.
 *   4. WIRING KLIKU — `empireSectionFromHudAct('ludnosc')` prowadzi do tej samej sekcji
 *      panelu ('econ-miasta') co 'miasta' (esbuild-bundlowany empirePanelSectionMap.ts,
 *      moduł bez importów UI/DOM — ten sam wzorzec co inne testy source-level).
 *
 * Konwencja jak tools/hud-moc-warstwa-test.cjs / tools/moc-ranking-rozjazd-test.cjs.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const os = require('os');

const GRA_DIR = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_DIR, 'src/main.ts');
const HUD_TS = path.join(GRA_DIR, 'src/ui/hud.ts');
const SECTION_MAP_TS = path.join(GRA_DIR, 'src/ui/empirePanelSectionMap.ts');
const ESBUILD_BIN = path.join(GRA_DIR, 'node_modules/.bin/esbuild');

let passCount = 0;
let failCount = 0;

function check(label, cond, detail) {
  if (cond) {
    passCount++;
    console.log('  PASS: ' + label);
  } else {
    failCount++;
    console.log('  FAIL: ' + label + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : ''));
  }
}

console.log('========================================================================');
console.log('P-BRAK-LACZNEJ-LICZBY-OBYWATELI-W-HUD -- chip "Obywatele" w gornym pasku HUD');
console.log('========================================================================\n');

// ---------------------------------------------------------------------------
// 1. FORMULA: suma population miast gracza -- niezalezna weryfikacja arytmetyczna.
// ---------------------------------------------------------------------------
console.log('1. Formula sumy populacji (cities.filter(ownerId).reduce(+population))');

/** 1:1 z main.ts::buildHudState -- `const pop = pc.reduce((s, c) => s + c.population, 0);`
 *  gdzie `pc = cities.filter(c => c.ownerId === 0)`. */
function sumOwnerPopulation(cities, ownerId) {
  return cities
    .filter((c) => c.ownerId === ownerId)
    .reduce((s, c) => s + c.population, 0);
}

/** Druga, celowo INNA implementacja (pętla for, nie filter+reduce) -- niezalezny
 *  przelicznik do porownania, zeby wykluczyc, ze formula i test "zgadzaja sie"
 *  tylko dlatego, ze to ten sam kod skopiowany dwa razy. */
function sumOwnerPopulationIndependent(cities, ownerId) {
  let total = 0;
  for (const c of cities) {
    if (c.ownerId === ownerId) total += c.population;
  }
  return total;
}

const fixtureCities = [
  { id: 'c0', ownerId: 0, population: 5 },
  { id: 'c1', ownerId: 0, population: 12 },
  { id: 'c2', ownerId: 1, population: 99 }, // obca cywilizacja -- NIE wliczać do gracza
  { id: 'c3', ownerId: 0, population: 3 },
  { id: 'c4', ownerId: 2, population: 47 }, // Panstwo-Miasto/AI -- NIE wliczać
];

const expectedPlayerSum = 5 + 12 + 3; // = 20, ownerId=1 i ownerId=2 wykluczone
const computedPlayerSum = sumOwnerPopulation(fixtureCities, 0);
const independentPlayerSum = sumOwnerPopulationIndependent(fixtureCities, 0);

check(
  'sumOwnerPopulation(fixture, ownerId=0) == 20 obywateli (5+12+3, obce miasta 99/47 wykluczone)',
  computedPlayerSum === expectedPlayerSum,
  computedPlayerSum,
);
check(
  'Niezalezny przelicznik (petla for) daje IDENTYCZNY wynik -- formula nie jest przypadkowa',
  independentPlayerSum === expectedPlayerSum && independentPlayerSum === computedPlayerSum,
  { independentPlayerSum, computedPlayerSum },
);
check(
  'Brak miast gracza (same obce) -> suma = 0',
  sumOwnerPopulation([{ id: 'x', ownerId: 1, population: 40 }], 0) === 0,
);
check(
  'Puste imperium (brak miast w ogole) -> suma = 0',
  sumOwnerPopulation([], 0) === 0,
);
check(
  'Jedno miasto gracza -> suma = population tego miasta',
  sumOwnerPopulation([{ id: 'solo', ownerId: 0, population: 7 }], 0) === 7,
);
console.log('');

// ---------------------------------------------------------------------------
// 2. main.ts: buildHudState liczy `ludnosc` DOKLADNIE ta sama formula -- jedyne
//    zrodlo prawdy, zeby HUD nigdy nie mial wlasnego, rozjezdzajacego sie przeliczenia.
// ---------------------------------------------------------------------------
console.log('2. main.ts: buildHudState -> pole "ludnosc" (jedyne zrodlo sumy dla HUD)');
const mainTsSrc = fs.readFileSync(MAIN_TS, 'utf8');

// P-ARMIA-CHIP-PELNE-JEDNOSTKI (Maciej 2026-08-12): cap podniesiony 10000->20000 -- dopisanie
// pol rekrutEkw/kosztJednostki do buildHudState (hud-armia-chip-jednostki-test.cjs) przesunelo
// dlugosc cialka funkcji za dotychczasowy limit regexu (10321 znakow), co bez zmiany psulo
// TEN test mimo ze funkcjonalnie nic w nim sie nie zepsulo -- limit byl dowolnym marginesem
// bezpieczenstwa, nie realnym ograniczeniem. / EN: cap raised 10000->20000 -- adding the
// rekrutEkw/kosztJednostki fields to buildHudState (hud-armia-chip-jednostki-test.cjs) pushed
// the function body past this regex's old limit (10321 chars), breaking THIS test even though
// nothing about it functionally regressed -- the limit was an arbitrary safety margin, not a
// real constraint.
const buildHudStateMatch = mainTsSrc.match(
  /function buildHudState\(\): HudState \{[\s\S]{0,20000}?\n {4}\}/,
);
check('main.ts zawiera funkcje buildHudState(): HudState', buildHudStateMatch !== null);
const buildHudStateBody = buildHudStateMatch ? buildHudStateMatch[0] : '';

check(
  'buildHudState: `const pc = cities.filter(c => c.ownerId === 0);` (gracz = ownerId 0)',
  /const pc = cities\.filter\(c => c\.ownerId === 0\);/.test(buildHudStateBody),
);
check(
  'buildHudState: `const pop = pc.reduce((s, c) => s + c.population, 0);` (suma populacji)',
  /const pop = pc\.reduce\(\(s, c\) => s \+ c\.population, 0\);/.test(buildHudStateBody),
);
check(
  'buildHudState: `ludnosc: pop,` w zwracanym obiekcie -- pole HudState.ludnosc = ta sama suma',
  /ludnosc: pop,/.test(buildHudStateBody),
);
// Upewnij się, że NIE ma drugiej, konkurencyjnej sumy populacji gracza gdzie indziej
// w main.ts pod inną nazwą, która mogłaby zasilić HUD zamiast `pop` (regresja "dwa źródła
// prawdy"). Szukamy WYŁĄCZNIE identycznego, dosłownego kształtu formuły -- innych,
// niezwiązanych sum (np. drenaż surowców na obywatela) nie łapie.
const rivalSumMatches = (
  mainTsSrc.match(/const pop = pc\.reduce\(\(s, c\) => s \+ c\.population, 0\);/g) || []
).length;
check(
  'Dokladnie JEDNO miejsce w main.ts liczy `const pop = pc.reduce(...population...)` (brak konkurencyjnego przeliczenia zasilajacego HUD)',
  rivalSumMatches === 1,
  rivalSumMatches,
);
console.log('');

// ---------------------------------------------------------------------------
// 3. hud.ts: chip "Obywatele" renderuje s.ludnosc (bez lokalnej re-kalkulacji),
//    chip "Miasta" nadal pokazuje s.osiedla (liczba miast, nie populacja).
// ---------------------------------------------------------------------------
console.log('3. hud.ts: chip "Obywatele" czyta s.ludnosc; chip "Miasta" nadal s.osiedla');
const hudTsSrc = fs.readFileSync(HUD_TS, 'utf8');

const rightChipsMatch = hudTsSrc.match(/const rightChips: string\[\] = \[[\s\S]*?\n {2}\];/);
check('hud.ts zawiera tablice rightChips', rightChipsMatch !== null);
const rightChipsBody = rightChipsMatch ? rightChipsMatch[0] : '';

check(
  'rightChips zawiera chip label \'Obywatele\'',
  /label: 'Obywatele'/.test(rightChipsBody),
);
check(
  'Chip \'Obywatele\': value: String(s.ludnosc) -- CZYTA pole HudState, nie liczy sam',
  /label: 'Obywatele',\s*\n\s*value: String\(s\.ludnosc\)/.test(rightChipsBody),
);
check(
  'Chip \'Obywatele\': act: \'ludnosc\' (klik otwiera panel MIASTA/populacja)',
  /label: 'Obywatele',[\s\S]{0,200}?act: 'ludnosc',/.test(rightChipsBody),
);
check(
  'Chip \'Miasta\': value: String(s.osiedla) NIEZMIENIONE -- nadal liczba miast, nie populacja',
  /label: 'Miasta',\s*\n\s*value: String\(s\.osiedla\)/.test(rightChipsBody),
);
check(
  'Chip \'Miasta\' i chip \'Obywatele\' to DWA ROZNE pola HudState (s.osiedla != s.ludnosc jako expr)',
  rightChipsBody.includes("value: String(s.osiedla)") && rightChipsBody.includes("value: String(s.ludnosc)"),
);
console.log('');

// ---------------------------------------------------------------------------
// 4. Wiring kliku: empireSectionFromHudAct('ludnosc') != ('miasta') -- OSOBNE zakladki od
//    R-DESIGN-11-ZAKLADEK faza 3 (wczesniej: ten sam panel `econ-miasta`, patrz nota nizej).
//    Modul bez importow UI/DOM -- bundlowalny esbuildem bez loaderow SVG/audio.
// ---------------------------------------------------------------------------
console.log('4. empirePanelSectionMap.ts: act "ludnosc" i "miasta" -> DWIE ROZNE zakladki');

// --- P-BRAMKA-WSPOLDZIELONY-DIST-TMPDIR-Q1: katalog roboczy unikalny per przebieg ---
// Stala nazwa pliku/katalogu pod os.tmpdir() jest wspoldzielona przez KAZDY rownolegly
// przebieg (takze z innego worktree): dwa biegi nadpisuja sobie ten sam artefakt, co
// daje raz falszywy CZERWONY, raz falszywy ZIELONY. mkdtempSync rozlacza je z definicji.
const TMPDIR_RUN_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'civ-hud-obywatele-chip-'));
// Unikalnosc bez sprzatania zamienilaby kolizje w staly wyciek dysku — kasujemy
// WYLACZNIE wlasny katalog tego przebiegu.
process.on('exit', () => { try { fs.rmSync(TMPDIR_RUN_DIR, { recursive: true, force: true }); } catch { /* best-effort */ } });
function bundle(entry, outName) {
  const outfile = path.join(TMPDIR_RUN_DIR, outName);
  execSync(
    '"' + ESBUILD_BIN + '" "' + entry + '" --bundle --platform=node --format=cjs --outfile="' + outfile + '"',
    { stdio: 'inherit' },
  );
  return require(outfile);
}

let sectionMapMod;
try {
  sectionMapMod = bundle(SECTION_MAP_TS, 'empire-panel-section-map-bundle-hud-obywatele.cjs');
} catch (e) {
  console.error('[hud-obywatele-chip-test] bundle empirePanelSectionMap.ts failed:', e.message || e);
  process.exit(1);
}
const { empireSectionFromHudAct } = sectionMapMod;

// R-DESIGN-11-ZAKLADEK faza 3 (§3 pkt 2 handoffu designera, decyzja `R-DESIGN-11-ZAKLADEK` Q2=B):
// chipy „Miasta" i „Obywatele" prowadzily dotad do TEJ SAMEJ sekcji `econ-miasta` i tej samej
// funkcji `cityMiastaMiniDetail()`, mieszajac dane produkcyjne (Praca/Pieniadz/Surowce) ze
// spolecznymi (Ludnosc/Wzrost) w jednej tabeli. Ta mieszanka miala sie ROZDZIELIC — od tej fazy
// kazdy chip ma wlasna zakladke: 'miasta' -> 'econ-miasto' (blok `miasto`), 'ludnosc' ->
// 'econ-obywatele' (blok `obywatele`). Asercje ponizej pilnuja teraz ROZDZIELNOSCI, nie tozsamosci.
// Stare wspolne id 'econ-miasta' NIE znika z kodu — nadal jest kotwica scrollowania w bloku Mocy
// i wierszem `econRows` w pelnym przegladzie „ZASOBY IMPERIUM" (patrz empire-panel-split-test.cjs,
// gdzie asercja `econ-miasta -> ekonomia` pozostaje niezmieniona i nadal przechodzi).
check(
  "empireSectionFromHudAct('ludnosc') === 'econ-obywatele' (wlasna zakladka Obywatele)",
  empireSectionFromHudAct('ludnosc') === 'econ-obywatele',
  empireSectionFromHudAct('ludnosc'),
);
check(
  "empireSectionFromHudAct('miasta') === 'econ-miasto' (wlasna zakladka Miasto)",
  empireSectionFromHudAct('miasta') === 'econ-miasto',
  empireSectionFromHudAct('miasta'),
);
check(
  "chipy 'miasta' i 'ludnosc' prowadza do DWOCH ROZNYCH sekcji (rozejscie econ-miasta)",
  empireSectionFromHudAct('miasta') !== empireSectionFromHudAct('ludnosc'),
  empireSectionFromHudAct('miasta') + ' vs ' + empireSectionFromHudAct('ludnosc'),
);
check(
  "'ludnosc' figuruje w liście dopuszczonych act w handleHudBarAction (hud.ts) -- klik faktycznie coś robi",
  /act === 'ludnosc'/.test(hudTsSrc),
);
console.log('');

console.log('========================================================================');
if (failCount === 0) {
  console.log(`OK (${passCount}/${passCount})`);
  process.exit(0);
} else {
  console.log(`FAILED: ${passCount} passed, ${failCount} failed`);
  process.exit(1);
}
