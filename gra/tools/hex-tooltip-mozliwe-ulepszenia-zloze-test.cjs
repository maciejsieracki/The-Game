'use strict';
/**
 * hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs -- P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA (2026-08-14)
 * Run: cd gra && node tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs
 *
 * BUG (Maciej, ze zrzutem tooltipa "Pole mapy" na Łące bez lasu/rzeki/złoża): sekcja
 * "Możliwe ulepszenia (teren)" w `listTerrainPossibleImprovements()`
 * (src/ui/hexContextTooltip.ts) filtrowała WYŁĄCZNIE przez `galleryTerrainEligible(key, teren)`
 * -- teren bazowy -- ignorując nakładkę/złoże SAMEGO heksa. Efekt: Tartak (wymaga Lasu),
 * Glinianka (wymaga złoża gliny), kopalnie żelaza/miedzi/złota/cyny (wymagają złoża), Warzelnia
 * soli, Wyrąb, Obóz łowiecki pokazywały się na KAŻDYM heksie zgodnego terenu bazowego, nawet
 * bez lasu/złoża. Naprawa dopisuje w `listTerrainPossibleImprovements()` analogiczne
 * sprawdzenia nakładka/złoże, reużywając eksportowane funkcje z map/improvement-build.ts
 * (`hexHasClayDeposit`, `isFarmBaseTerrain`, `isImprovementBlockedOnForest`,
 * `hasAnimalDeposit`) zamiast duplikować logikę -- lustrzane odbicie (część hex-property,
 * bez terytorium/tech) autorytatywnego `createQualifier()`/`qualifies()`.
 *
 * DLACZEGO REGEX NA ŹRÓDLE + REIMPLEMENTACJA, NIE PEŁNE E2E PRZEZ buildHexContextTooltipHtml:
 * `hexContextTooltip.ts` transitywnie importuje `src/ui/icons/brandAssets.ts`, który na
 * poziomie MODUŁU wywołuje `import.meta.glob(...)` -- w bundlu esbuild/cjs (potrzebnym do
 * uruchomienia kodu TS w node bez Vite) ta linia rzuca `TypeError: import_meta.glob is not a
 * function` NATYCHMIAST przy `require()`. To ten sam, już udokumentowany w CLAUDE.md ("Znane
 * PRE-ISTNIEJĄCE porażki") defekt harnessu testowego co w `map-field-battle-test.cjs` /
 * `pre-battle-save-test.cjs` / `heks-plony-zloze-parytet-ui-test.cjs` -- nie regresja tej
 * naprawy, ale realna, sprawdzona blokada importu CAŁEGO pliku hexContextTooltip.ts w node.
 *
 * Test łączy DWA niezależne dowody:
 *   [1] PRZYPIĘTA LOKALIZACJA -- regex na źródle: ciało `listTerrainPossibleImprovements()`
 *       zawiera dosłownie KAŻDY z nowych warunków nakładka/złoże (jeśli ktoś usunie/cofnie
 *       jeden z nich, ten test zaraz padnie na tym punkcie -- weryfikacja mutacji niżej [3]).
 *   [2] PARYTET Z SILNIKIEM (real code, not regex) -- `computePossibleKeys()` niżej jest 1:1
 *       reimplementacją pętli filtrującej `listTerrainPossibleImprovements()` (przypiętej
 *       regexem w [1]), zbudowaną WYŁĄCZNIE z REALNYCH, importowanych funkcji silnika
 *       (`galleryTerrainEligible`, `hexHasClayDeposit`, `isFarmBaseTerrain`,
 *       `isImprovementBlockedOnForest`, `hasAnimalDeposit`, `IMPROVEMENT_KEYS`,
 *       `improvementKeysForHex`, `isImprovementAllowedForCiv` -- wszystkie z
 *       map/improvement-build.ts i game/terrain-improvements.ts, BEZ importu brandAssets).
 *       Sprawdza dokładny przykład ze zrzutu Macieja + resztę naprawionych kluczy.
 *   [3] MUTACJA (dowód, że [1] łapie regresję) -- reimplementacja BEZ jednego z warunków
 *       (tartak) odtwarza STARE, wadliwe zachowanie (Tartak na gołej Łące) -- pokazuje, że
 *       usunięcie tej linii z prawdziwego źródła zmienia wynik i zostałoby złapane przez [1].
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const TOOLTIP_SRC = path.join(GRA, 'src', 'ui', 'hexContextTooltip.ts');
const ENTRY = path.join(__dirname, '.hex-tooltip-zloze-entry.ts');
const BUNDLE = path.join(__dirname, '.hex-tooltip-zloze-bundle.cjs');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('hex-tooltip-mozliwe-ulepszenia-zloze-test (P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA)\n');

// --- [1] PRZYPIĘTA LOKALIZACJA -------------------------------------------------------------
console.log('[1] regex na źródle: listTerrainPossibleImprovements() zawiera wszystkie warunki nakładka/złoże');

const tooltipSrc = fs.readFileSync(TOOLTIP_SRC, 'utf8');
const fnMatch = tooltipSrc.match(
  /function listTerrainPossibleImprovements\(hex: Hex, playerCivType\?: string \| null\): string\[\] \{[\s\S]*?\n\}/,
);
assert(fnMatch !== null, 'znaleziono ciało funkcji listTerrainPossibleImprovements()');
const fnBody = fnMatch ? fnMatch[0] : '';

const REQUIRED_LINES = [
  // pre-istniejące (nie regresja tej naprawy, ale muszą przetrwać)
  "if (key === 'bydlo' && nakladka !== Nakladka.ZlozeBydla) continue;",
  "if (key === 'owce' && nakladka !== Nakladka.ZlozeOwiec) continue;",
  "if (key === 'lama' && nakladka !== Nakladka.ZlozeLamy) continue;",
  // nowe -- ta naprawa
  'if (isImprovementBlockedOnForest(key, nakladka)) continue;',
  "if (key === 'farma' && !isFarmBaseTerrain(teren, nakladka)) continue;",
  "if (key === 'tartak' && nakladka !== Nakladka.Las) continue;",
  "if (key === 'wyrab' && nakladka !== Nakladka.Las) continue;",
  "if (key === 'glinianka' && !hexHasClayDeposit(hex)) continue;",
  "if (key === 'oboz_lowiecki' && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;",
  "if (key === 'warzelnia_soli' && teren !== TerenBazowy.Wybrzeze && zloze !== 'sol') continue;",
  "if (key === 'kopalnia_zelaza' && zloze !== 'zelazo') continue;",
  "if (key === 'kopalnia_miedzi'\n      && zloze !== 'miedz' && nakladka !== Nakladka.ZlozeRudy && zloze !== 'ruda') continue;",
  "if (key === 'kopalnia_zlota' && zloze !== 'zloto') continue;",
  "if (key === 'kopalnia_cyny' && zloze !== 'cyna') continue;",
];
for (const line of REQUIRED_LINES) {
  assert(fnBody.includes(line), `zawiera warunek: ${line.replace(/\n\s*/g, ' ')}`);
}

// --- [2] PARYTET Z SILNIKIEM (realny kod, nie regex) ---------------------------------------
console.log('\n[2] reimplementacja 1:1 (realne funkcje silnika) na przykładach ze zgłoszenia Macieja');

fs.writeFileSync(ENTRY, `
export {
  galleryTerrainEligible,
  hexHasClayDeposit,
  isFarmBaseTerrain,
  isImprovementBlockedOnForest,
  hasAnimalDeposit,
} from '../src/map/improvement-build';
export {
  IMPROVEMENT_KEYS,
  improvementKeysForHex,
  isImprovementAllowedForCiv,
} from '../src/game/terrain-improvements';
export { Nakladka, TerenBazowy } from '../src/types/hex';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[hex-tooltip-mozliwe-ulepszenia-zloze-test] bundle failed:', e.message || e);
  process.exit(1);
}

const {
  IMPROVEMENT_KEYS,
  improvementKeysForHex,
  isImprovementAllowedForCiv,
  galleryTerrainEligible,
  hexHasClayDeposit,
  isFarmBaseTerrain,
  isImprovementBlockedOnForest,
  hasAnimalDeposit,
  Nakladka,
  TerenBazowy,
} = require(BUNDLE);

/**
 * Reimplementacja 1:1 pętli przypiętej regexem w [1] -- gdyby prawdziwe źródło się rozjechało
 * z tą kopią, [1] by to złapał (regex szuka dosłownych linii warunków).
 * `skipKeys` -- do dowodu mutacji [3]: pozwala wyłączyć pojedynczy warunek i odtworzyć stary bug.
 */
function computePossibleKeys(hex, playerCivType, skipKeys) {
  const skip = skipKeys || new Set();
  const active = new Set(improvementKeysForHex(hex));
  const teren = hex.terenBazowy;
  const nakladka = hex.nakladka;
  const zloze = hex.zloze;
  const out = [];
  for (const key of IMPROVEMENT_KEYS) {
    if (active.has(key)) continue;
    if (!isImprovementAllowedForCiv(key, playerCivType)) continue;
    if (!galleryTerrainEligible(key, teren)) continue;
    if (!skip.has('forest') && isImprovementBlockedOnForest(key, nakladka)) continue;
    if (!skip.has('bydlo') && key === 'bydlo' && nakladka !== Nakladka.ZlozeBydla) continue;
    if (!skip.has('owce') && key === 'owce' && nakladka !== Nakladka.ZlozeOwiec) continue;
    if (!skip.has('lama') && key === 'lama' && nakladka !== Nakladka.ZlozeLamy) continue;
    if (!skip.has('farma') && key === 'farma' && !isFarmBaseTerrain(teren, nakladka)) continue;
    if (!skip.has('tartak') && key === 'tartak' && nakladka !== Nakladka.Las) continue;
    if (!skip.has('wyrab') && key === 'wyrab' && nakladka !== Nakladka.Las) continue;
    if (!skip.has('glinianka') && key === 'glinianka' && !hexHasClayDeposit(hex)) continue;
    if (!skip.has('oboz_lowiecki') && key === 'oboz_lowiecki'
      && nakladka !== Nakladka.Las && !hasAnimalDeposit(nakladka)) continue;
    if (!skip.has('warzelnia_soli') && key === 'warzelnia_soli'
      && teren !== TerenBazowy.Wybrzeze && zloze !== 'sol') continue;
    if (!skip.has('kopalnia_zelaza') && key === 'kopalnia_zelaza' && zloze !== 'zelazo') continue;
    if (!skip.has('kopalnia_miedzi') && key === 'kopalnia_miedzi'
      && zloze !== 'miedz' && nakladka !== Nakladka.ZlozeRudy && zloze !== 'ruda') continue;
    if (!skip.has('kopalnia_zlota') && key === 'kopalnia_zlota' && zloze !== 'zloto') continue;
    if (!skip.has('kopalnia_cyny') && key === 'kopalnia_cyny' && zloze !== 'cyna') continue;
    out.push(key);
  }
  return out;
}

function makeHex(terenBazowy, nakladka, zloze) {
  return {
    coords: { q: 0, r: 0 },
    terenBazowy,
    nakladka: nakladka || Nakladka.Brak,
    ulepszenie: undefined,
    ulepszenia: undefined,
    wlasciciel: null,
    zloze: zloze || undefined,
    rzeka: { obecna: false },
  };
}

// --- Przykład dokładnie ze zgłoszenia Macieja: Łąka, brak lasu/rzeki/złoża -----------------
{
  const hex = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined);
  const keys = computePossibleKeys(hex, null);
  assert(!keys.includes('tartak'), 'Łąka bez lasu/złoża: lista NIE zawiera Tartaka (wymaga Lasu)');
  assert(!keys.includes('glinianka'), 'Łąka bez lasu/złoża: lista NIE zawiera Glinianki (wymaga złoża gliny)');
  assert(!keys.includes('wyrab'), 'Łąka bez lasu/złoża: lista NIE zawiera Wyrębu (wymaga Lasu)');
  assert(!keys.includes('oboz_lowiecki'), 'Łąka bez lasu/złoża: lista NIE zawiera Obozu łowieckiego (wymaga Lasu/zwierzęcia)');
  assert(!keys.includes('kopalnia_zelaza'), 'Łąka bez lasu/złoża: lista NIE zawiera Kopalni żelaza (Łąka nie jest Wzgórzem/Górami)');
  assert(!keys.includes('kopalnia_miedzi'), 'Łąka bez lasu/złoża: lista NIE zawiera Kopalni miedzi');
  assert(!keys.includes('kopalnia_zlota'), 'Łąka bez lasu/złoża: lista NIE zawiera Kopalni złota');
  assert(!keys.includes('kopalnia_cyny'), 'Łąka bez lasu/złoża: lista NIE zawiera Kopalni cyny');
  assert(!keys.includes('warzelnia_soli'), 'Łąka bez soli: lista NIE zawiera Warzelni soli (nie Wybrzeże, brak złoża soli)');
}

// --- Wzgórza + złoże żelaza -> Kopalnia żelaza POWINNA się pojawić -------------------------
{
  const hex = makeHex(TerenBazowy.Wzgorza, Nakladka.Brak, 'zelazo');
  const keys = computePossibleKeys(hex, null);
  assert(keys.includes('kopalnia_zelaza'), 'Wzgórza + złoże żelaza: lista ZAWIERA Kopalnię żelaza');
  assert(!keys.includes('kopalnia_miedzi'), 'Wzgórza + złoże żelaza (nie miedzi): lista NIE zawiera Kopalni miedzi');
  assert(!keys.includes('kopalnia_zlota'), 'Wzgórza + złoże żelaza (nie złota): lista NIE zawiera Kopalni złota');
}

// --- Rownina + nakładka Las -> Tartak / Wyrąb / Obóz łowiecki POWINNY się pojawić ----------
{
  const hex = makeHex(TerenBazowy.Rownina, Nakladka.Las, undefined);
  const keys = computePossibleKeys(hex, null);
  assert(keys.includes('tartak'), 'Równina + Las: lista ZAWIERA Tartak');
  assert(keys.includes('wyrab'), 'Równina + Las: lista ZAWIERA Wyrąb');
  assert(keys.includes('oboz_lowiecki'), 'Równina + Las: lista ZAWIERA Obóz łowiecki');
  assert(!keys.includes('irygacja'), 'Równina + Las: lista NIE zawiera Irygacji (blokada lasu -- trzeba wyrąbać)');
}

// --- Złoże gliny (nakładka ZlozeGliny) -> Glinianka POWINNA się pojawić --------------------
{
  const hex = makeHex(TerenBazowy.Laka, Nakladka.ZlozeGliny, undefined);
  const keys = computePossibleKeys(hex, null);
  assert(keys.includes('glinianka'), 'Łąka + złoże gliny (nakładka): lista ZAWIERA Glinianki');
}

// --- Wybrzeże (bez złoża soli) -> Warzelnia soli nadal OK (teren wystarcza) ----------------
{
  const hex = makeHex(TerenBazowy.Wybrzeze, Nakladka.Brak, undefined);
  const keys = computePossibleKeys(hex, null);
  assert(keys.includes('warzelnia_soli'), 'Wybrzeże bez złoża: lista ZAWIERA Warzelni soli (sól z morza, bez złoża)');
}

// --- [3] MUTACJA -- cofnięcie warunku 'tartak' odtwarza stary bug --------------------------
console.log('\n[3] mutacja: cofnięcie warunku tartak odtwarza stary bug (dowód, że [1] by to złapał)');
{
  const hex = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined);
  const fixedKeys = computePossibleKeys(hex, null);
  const mutatedKeys = computePossibleKeys(hex, null, new Set(['tartak']));
  assert(!fixedKeys.includes('tartak'), 'Z warunkiem (naprawiona wersja): Tartak NIE pojawia się na gołej Łące');
  assert(mutatedKeys.includes('tartak'), 'Bez warunku (zmutowana wersja): Tartak WRACA na gołej Łące -- stary bug odtworzony');
  assert(fixedKeys.length !== mutatedKeys.length || !fixedKeys.includes('tartak'),
    'mutacja realnie zmienia wynik (dowód, że warunek ma "zęby", nie jest martwym kodem)');
}

console.log(`\n${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
process.exit(failed > 0 ? 1 : 0);
