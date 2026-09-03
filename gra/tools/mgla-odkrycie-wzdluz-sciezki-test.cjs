'use strict';
/**
 * mgla-odkrycie-wzdluz-sciezki-test.cjs — P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1.
 *
 * ZGLOSZENIE (wlasciciel): jednostka szybko poruszajaca sie po duzym terenie (np. Zwiadowca,
 * duzy `ruch` > maly `sight`) w jednym marszu nie odkrywa mijanych heksow -- zostaja czarne
 * mimo ze jednostka przez nie przeszla. RECON (00-dispatch.md): przyczyna DETERMINISTYCZNA, nie
 * FPS -- fog reveal po wieloheksowym marszu liczyl widocznosc WYLACZNIE z pozycji KONCOWEJ
 * (`currentVisible()` w `refreshFog()`), nigdy z heksow POSRODKU sciezki.
 *
 * NAPRAWA: nowa czysta funkcja `computeVisibleAlongPath(pathHexes, map, sight)`
 * (gra/src/game/visibility.ts) -- unia widocznosci ze WSZYSTKICH heksow sciezki. Wpiecie w
 * main.ts w DWOCH miejscach (zakonczenie animowanego ruchu w renderLoop, applyMarchSegmentInstant):
 * `addExplored(explored, computeVisibleAlongPath(pathHexes, map, unitSight(su)))` per jednostke
 * stosu, wywolane PRZED jakimkolwiek `refreshFog()` w tej galezi (bezposrednim albo posrednim,
 * przez checkVillageRewardAt/checkBarbCampDestroyedAt) -- tak, ze `explored` ma nowe heksy scie-
 * zki zanim refreshFog przeliczy render. `refreshFog()` SAMA pozostaje NIETKNIETA (bez nowego
 * parametru) -- najczystsze podpiecie, patrz uzasadnienie w raporcie Operatora.
 *
 * SEKCJA A: computeVisibleAlongPath jako CZYSTA funkcja -- konkretny scenariusz (Zwiadowca,
 *   ruch=6, sight=1, prosta linia), JAWNE porownanie zbioru odkrytych heksow PRZED (widocznosc
 *   TYLKO z pozycji koncowej -- stary bug) i PO (unia z calej sciezki -- naprawa). Zero main.ts,
 *   zero DOM/THREE -- czysty modul, bundlowany esbuildem (wzorzec terrain-hill-movement-test.cjs).
 * SEKCJA B: regresja -- widocznosc z pozycji koncowej jest PODZBIOREM wyniku PO (nic nie ginie).
 * SEKCJA C: wielojednostkowy stos o roznym `sight` -- unia per-jednostke (jak main.ts robi per
 *   `su of stack`).
 * SEKCJA D: statyczna weryfikacja wpiecia w main.ts (main.ts NIE jest tu bundlowany -- monoli-
 *   tyczny plik z zaleznosciami DOM/THREE, zaden test w tym repo tego nie robi, patrz
 *   barb-camp-destruction-test.cjs) -- ten sam, ustalony w repo wzorzec: przeszukanie zrodla,
 *   jawnie oznaczone "static:". Sprawdza OBECNOSC i KOLEJNOSC (przed hutCollected/refreshFog),
 *   oraz ze `refreshFog()` NIE dostal nowego parametru (swiadomy wybor integracji, nie omylka).
 *
 * Usage (z gra/): node tools/mgla-odkrycie-wzdluz-sciezki-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.mgla-sciezka-entry.ts');
const BUNDLE = path.join(__dirname, '.mgla-sciezka-bundle.cjs');
const MAIN_TS_PATH = path.join(GRA_ROOT, 'src', 'main.ts');

fs.writeFileSync(
  ENTRY,
  `export {
  computeVisibleAt,
  computeVisibleAlongPath,
  computeVisible,
  addExplored,
} from '../src/game/visibility';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  logLevel: 'silent',
});

const { computeVisibleAt, computeVisibleAlongPath, computeVisible, addExplored } = require(BUNDLE);

let pass = 0;
let fail = 0;
function assert(cond, msg, detail) {
  if (cond) {
    pass++;
    console.log('  OK:', msg);
  } else {
    fail++;
    console.error('  FAIL:', msg, detail !== undefined ? '-- ' + JSON.stringify(detail) : '');
  }
}

// ---------------------------------------------------------------------------
// Fixture: mapa kwadratowa Q,R in [-3..10], wszystkie heksy istnieja.
// ---------------------------------------------------------------------------
function buildMap() {
  const hexes = {};
  for (let q = -3; q <= 10; q++) {
    for (let r = -3; r <= 10; r++) {
      hexes[`${q},${r}`] = { placeholder: true };
    }
  }
  return { szerokoscQ: 14, wysokoscR: 14, hexes, seed: 1 };
}
const map = buildMap();

// ---------------------------------------------------------------------------
// Scenariusz: Zwiadowca, ruch=6 (jeden hex/punkt na plaskim terenie), sight=1.
// Sciezka w LINII PROSTEJ wzdluz osi q, r=0: (1,0)..(6,0) -- start (0,0) NIE wchodzi w
// pathHexes (main.ts: pathHexes/movePath = kroki PO starcie, patrz komentarz main.ts:1443-1444).
// ---------------------------------------------------------------------------
const START = { q: 0, r: 0 };
const RUCH = 6;
const SIGHT = 1;
const pathHexes = [];
for (let i = 1; i <= RUCH; i++) pathHexes.push({ q: START.q + i, r: START.r });
const dest = pathHexes[pathHexes.length - 1];

console.log('========================================================================');
console.log('P-MGLA-ODKRYCIE-WZDLUZ-SCIEZKI-Q1 -- Zwiadowca ruch=' + RUCH + ' sight=' + SIGHT);
console.log('sciezka: ' + JSON.stringify(pathHexes));
console.log('========================================================================\n');

console.log('SEKCJA A -- computeVisibleAlongPath: PRZED (tylko koniec) vs PO (cala sciezka)');

// PRZED (stary bug): main.ts liczyl widocznosc WYLACZNIE z currentVisible() na pozycji
// koncowej -- symulacja identyczna do computeVisibleAt(dest, sight).
const before = computeVisibleAt(dest.q, dest.r, map, SIGHT);
// PO (naprawa): unia z calej sciezki -- dokladnie to, co teraz woła main.ts.
const after = computeVisibleAlongPath(pathHexes, map, SIGHT);

assert(before.size > 0, 'PRZED: widocznosc z pozycji koncowej niepusta (sanity)', before.size);
assert(after.size > before.size,
  'PO: unia z calej sciezki daje WIECEJ heksow niz sama pozycja koncowa (bug faktycznie naprawiony)',
  { beforeSize: before.size, afterSize: after.size });

// Heks konkretny, blisko STARTU sciezki (sasiad (1,0)), typowy dla „mijany, nigdy nie odkryty":
// odleglosc od (1,1) do konca (6,0) = max(|1-6|,|1-0|,|(-1-1)-(-6-0)|) = max(5,1,4) = 5 > sight=1
// -> na pewno POZA zasiegiem z konca. Odleglosc od (1,1) do (1,0) = 1 -> W zasiegu sight=1
// jednego z heksow sciezki.
const midPathHex = '1,1';
assert(!before.has(midPathHex),
  'PRZED: heks przy poczatku sciezki (' + midPathHex + ') NIE byl odkrywany (odtworzony bug)',
  { before: [...before] });
assert(after.has(midPathHex),
  'PO: heks przy poczatku sciezki (' + midPathHex + ') JEST odkrywany po naprawie',
  { after: [...after] });

// Poprawnosc PO: rekonstrukcja reczna (brute-force unia z KAZDEGO heksu sciezki osobno)
// musi dac DOKLADNIE ten sam zbior -- nie tylko "wiekszy", tak samo policzony.
const manualUnion = new Set();
for (const h of pathHexes) {
  for (const k of computeVisibleAt(h.q, h.r, map, SIGHT)) manualUnion.add(k);
}
const afterArr = [...after].sort();
const manualArr = [...manualUnion].sort();
assert(JSON.stringify(afterArr) === JSON.stringify(manualArr),
  'PO: computeVisibleAlongPath == recznie zbudowana unia widocznosci z kazdego heksu sciezki z osobna',
  { afterSize: after.size, manualSize: manualUnion.size });

console.log('\nSEKCJA B -- regresja: widocznosc z pozycji koncowej pozostaje PODZBIOREM (nic nie ginie)');
let allBeforeInAfter = true;
for (const k of before) { if (!after.has(k)) { allBeforeInAfter = false; break; } }
assert(allBeforeInAfter,
  'KAZDY heks widoczny z pozycji koncowej (PRZED) jest tez w wyniku PO -- zero regresji na widocznosci koncowej');

console.log('\nSEKCJA C -- stos wielojednostkowy, rozny sight per jednostka (main.ts: petla `for (const su of stack)`)');
const stackSights = [1, 3]; // np. Zwiadowca sight=1 + Legionista eskortujacy sight=3 w tym samym stosie
const explored = new Set(before); // symulacja: explored PRZED zawiera juz widocznosc koncowa
for (const s of stackSights) {
  addExplored(explored, computeVisibleAlongPath(pathHexes, map, s));
}
const wideUnion = computeVisibleAlongPath(pathHexes, map, Math.max(...stackSights));
let wideSubsetOfExplored = true;
for (const k of wideUnion) { if (!explored.has(k)) { wideSubsetOfExplored = false; break; } }
assert(wideSubsetOfExplored,
  'Stos: unia z NAJWIEKSZEGO sight w stosie jest calkowicie pokryta przez zbior po zlaczeniu per-jednostke',
  { wideUnionSize: wideUnion.size, exploredSize: explored.size });
assert(explored.size > before.size,
  'Stos: `explored` faktycznie urosl po dolozeniu widocznosci sciezki obu jednostek', { before: before.size, explored: explored.size });

console.log('\nSEKCJA A2 -- brzegi: sciezka pusta -> zbior pusty (main.ts gatuje `pathHexes.length > 0` przed wywolaniem)');
assert(computeVisibleAlongPath([], map, SIGHT).size === 0, 'sciezka pusta daje pusty Set');

console.log('\nSEKCJA A3 -- computeVisible/computeVisibleAt (istniejace eksporty) NIETKNIETE: te same wyniki co przed tematem');
const groupVis = computeVisible([{ q: dest.q, r: dest.r }], map, SIGHT);
assert(JSON.stringify([...groupVis].sort()) === JSON.stringify([...before].sort()),
  'computeVisible([jednostka na koncu], sight) == computeVisibleAt(koniec, sight) -- funkcja bazowa dziala jak dawniej');

// ---------------------------------------------------------------------------
// SEKCJA D -- static: weryfikacja wpiecia w main.ts (nie bundlowany, patrz naglowek pliku).
// ---------------------------------------------------------------------------
console.log('\nSEKCJA D (static) -- wpiecie main.ts: obecnosc, kolejnosc, refreshFog() bez nowego parametru');
const mainSrc = fs.readFileSync(MAIN_TS_PATH, 'utf8');

assert(/import\s*\{[^}]*\bcomputeVisibleAlongPath\b[^}]*\}\s*from\s*'\.\/game\/visibility'/.test(mainSrc),
  'static: `computeVisibleAlongPath` zaimportowane z ./game/visibility w main.ts');

// Blok "zakonczenie animowanego ruchu" (renderLoop): nowy kod MUSI wystapic PRZED
// checkVillageRewardsAlongPath(pathHexes) w tym samym bloku `if (pathHexes.length > 0) {`.
const animBlockMatch = mainSrc.match(
  /if \(pathHexes\.length > 0\) \{([\s\S]*?)if \(u\.ownerId === 0\) hutCollected = checkVillageRewardsAlongPath\(pathHexes\);/,
);
assert(animBlockMatch !== null,
  'static: blok "if (pathHexes.length > 0)" (koniec animacji) znaleziony, z checkVillageRewardsAlongPath(pathHexes) po nim');
if (animBlockMatch) {
  const inBetween = animBlockMatch[1];
  assert(/computeVisibleAlongPath\(pathHexes, map, unitSight\(su\)\)/.test(inBetween)
    && /addExplored\(explored, computeVisibleAlongPath/.test(inBetween),
    'static: koniec animacji -- addExplored(explored, computeVisibleAlongPath(pathHexes, ...)) wystepuje PRZED checkVillageRewardsAlongPath (a wiec przed jakimkolwiek refreshFog() w tej galezi)',
    { inBetween });
}

// Blok applyMarchSegmentInstant: analogicznie, PRZED checkVillageRewardsAlongPath(result.movePath).
const instantBlockMatch = mainSrc.match(
  /if \(result\.movePath\.length > 0\) \{([\s\S]*?)if \(u\.ownerId === 0\) hutCollected = checkVillageRewardsAlongPath\(result\.movePath\);/,
);
assert(instantBlockMatch !== null,
  'static: blok "if (result.movePath.length > 0)" (applyMarchSegmentInstant) znaleziony, z checkVillageRewardsAlongPath(result.movePath) po nim');
if (instantBlockMatch) {
  const inBetween = instantBlockMatch[1];
  assert(/computeVisibleAlongPath\(result\.movePath, map, unitSight\(su\)\)/.test(inBetween)
    && /addExplored\(explored, computeVisibleAlongPath/.test(inBetween),
    'static: applyMarchSegmentInstant -- addExplored(explored, computeVisibleAlongPath(result.movePath, ...)) wystepuje PRZED checkVillageRewardsAlongPath',
    { inBetween });
}

// refreshFog() NIE zmienil sygnatury -- swiadomy wybor integracji (uzasadnienie: raport Operatora).
assert(/function refreshFog\(opts\?\s*:\s*\{\s*skipVeteranEducation\?\s*:\s*boolean\s*\}\s*\)\s*:\s*void\s*\{/.test(mainSrc),
  'static: refreshFog() zachowal DOKLADNIE ta sama sygnature (bez nowego parametru extraVisible) -- zamierzone, patrz raport');

// currentVisible() (widocznosc TERAZ, z pozycji koncowej) pozostaje NIETKNIETA -- ta sama
// petla po jednostkach/miastach z pozycji BIEZACEJ, zero wzmianki o sciezce.
assert(/function currentVisible\(\): Set<string> \{[\s\S]{0,400}?for \(const u of units\.filter\(u => u\.ownerId === 0\)\) \{[\s\S]{0,200}?computeVisibleAt\(u\.q, u\.r, map, sight\)/.test(mainSrc),
  'static: currentVisible() nadal liczy WYLACZNIE z biezacej pozycji jednostek (u.q, u.r) -- nietkniete');

console.log('\n' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
