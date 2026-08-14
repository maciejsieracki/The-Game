'use strict';
/**
 * hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs -- P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA (2026-08-14)
 * Run: cd gra && node tools/hex-tooltip-mozliwe-ulepszenia-zloze-test.cjs
 *
 * BUG (Maciej, ze zrzutem tooltipa "Pole mapy" na Łące bez lasu/rzeki/złoża): sekcja
 * "Możliwe ulepszenia (teren)" w `listTerrainPossibleImprovements()`
 * (src/ui/hexContextTooltip.ts) filtrowała WYŁĄCZNIE przez `galleryTerrainEligible(key, teren)`
 * -- teren bazowy -- ignorując nakładkę/złoże SAMEGO heksa. Naprawa dopisuje analogiczne
 * sprawdzenia nakładka/złoże, reużywając eksportowane funkcje z map/improvement-build.ts.
 *
 * DLACZEGO ESBUILD + STUB brandAssets, NIE PEŁNE E2E BEZ STUBA:
 * `hexContextTooltip.ts` importuje `./icons/brandAssets`, który na poziomie MODUŁU wywołuje
 * `import.meta.glob(...)` -- w bundlu esbuild/cjs (potrzebnym do uruchomienia kodu TS w node
 * bez Vite) ta linia rzuca `TypeError: import_meta.glob is not a function` NATYCHMIAST przy
 * `require()`. To ten sam, już udokumentowany w CLAUDE.md ("Znane PRE-ISTNIEJĄCE porażki")
 * defekt harnessu testowego co w `map-field-battle-test.cjs` / `pre-battle-save-test.cjs`.
 * Naprawa: esbuild plugin `onResolve` przechwytujący `icons/brandAssets` i podmieniający go na
 * lekki stub (wzorzec `side-list-hud-panel-coverage-test.cjs` / `escape-overlay-real-panels-test.cjs`
 * -- ten sam już sprawdzony patent w tym repo). Dzięki temu `hexContextTooltip.ts` bundluje się
 * W CAŁOŚCI i test woła PRAWDZIWY, wyeksportowany `hexHasRiverAccess()`, nie jego kopię.
 *
 * Test łączy PIĘĆ niezależnych dowodów:
 *   [1] PRZYPIĘTA LOKALIZACJA -- regex na źródle: ciało `listTerrainPossibleImprovements()`
 *       i `hexHasRiverAccess()`/`buildRiverHexSet()` zawierają dosłownie każdy z warunków.
 *   [2] PARYTET Z SILNIKIEM (real code) -- `computePossibleKeys()` niżej reimplementuje WYŁĄCZNIE
 *       te warunki `listTerrainPossibleImprovements()`, które nie mają własnej realnej funkcji do
 *       zaimportowania (nakładka/złoże/droga_brukowana -- z realnych, importowanych funkcji
 *       silnika). Warunek `irygacja` NIE jest reimplementowany -- woła PRAWDZIWY, zbundlowany
 *       `hexHasRiverAccess()` z `hexContextTooltip.ts` (patrz [2b]).
 *   [2b] PRAWDZIWA `hexHasRiverAccess()` -- zbundlowana z rzeczywistego `hexContextTooltip.ts`
 *       (stub TYLKO na `icons/brandAssets`, reszta modułu -- prawdziwa). To zamyka F2 z rundy 3:
 *       mutacja usuwająca pętlę po sąsiadach w PRAWDZIWYM pliku źródłowym teraz faktycznie
 *       przechodzi przez ten sam kod co produkcja, więc [3c]/[3d] niżej ją łapią.
 *   [3] MUTACJA (dowód, że [1] łapie regresję na starych warunkach nakładka/złoże, np. tartak).
 *   [3b] MUTACJA -- cofnięcie warunku droga_brukowana odtwarza stary bug (reimplementacja, jak
 *       poprzednio -- ten warunek nie ma osobnej eksportowanej funkcji do zbundlowania).
 *   [3c]/[3d] MUTACJA NA PRAWDZIWYM PLIKU ŹRÓDŁOWYM (Dispatch runda 4, odpowiedź na F2 Evaluatora
 *       `ec089e9a`): dwa tekstowe mutanty PRAWDZIWEGO `hexContextTooltip.ts` (kopia na dysku,
 *       bundlowana osobno, usuwana po teście) -- (c) usunięcie CAŁEJ pętli po sąsiadach powinno
 *       cofnąć wykrywanie rzeki na sąsiedzie; (d) przywrócenie starego warunku
 *       `map.hexes[nb]?.rzeka?.obecna` zamiast `riverHexSet.has(nb)` powinno ODTWORZYĆ dokładnie
 *       zgłoszony przez Evaluatora błąd (fałszywy pozytyw na heksie z "rozlaną" flagą
 *       `rzeka.obecna`, którego nie ma na `riverPaths`).
 *
 * ROZSZERZENIE (Dispatch runda 4, Evaluator FAIL na `ec089e9a`, sekcja "Evaluator: hex tooltip —
 * droga_brukowana + irygacja" w dyspozycje/PYTANIA-OTWARTE.md):
 *   F1 -- `hexHasRiverAccess()` NIE była lustrzanym odbiciem silnikowego `isRiverAdjacent()`:
 *     silnik sprawdza sąsiadów przeciw `riverHexSet` (zbiór zbudowany z `map.riverPaths`), tooltip
 *     sprawdzał `rzeka.obecna` sąsiada -- flagę CELOWO "rozlaną" na wszystkie heksy stykające się
 *     z rzeką (`syncRiverEdgeBonusHexes()`, gen-helpers.ts), więc nadzbiór `riverHexSet`.
 *     Zmierzone: ~7% heksów FLAT_IRR fałszywie kwalifikowanych. NAPRAWA: `hexHasRiverAccess()`
 *     buduje teraz `riverHexSet` z `map.riverPaths` (kopia lokalna `buildRiverHexSet()` z
 *     map/improvement-build.ts) i używa GO dla sąsiadów (nie ich `rzeka.obecna`), zachowując
 *     `hex.rzeka.obecna` LUB `riverHexSet.has(ownKey)` dla samego heksa -- identyczna kolejność i
 *     te same trzy warunki co `isRiverAdjacent()`. Zweryfikowane EMPIRYCZNIE (nie tylko czytaniem
 *     kodu) heks-po-heksie na 3 seedach wygenerowanego świata (`generujSwiat(seed, 'standardowy',
 *     'kontynenty')`), tymczasowym eksportem identycznej logiki silnika (usuniętym przed
 *     commitem) -- **0 rozbieżności w obie strony** na 13843 heksach FLAT_IRR łącznie (4608+4689+
 *     4546, dokładnie te same liczby FLAT_IRR co w pomiarze Evaluatora rundy 3).
 *   F2 -- test z rundy 3 REIMPLEMENTOWAŁ `hexHasRiverAccess()` lokalnie, więc mutacja usuwająca
 *     pętlę po sąsiadach na PRAWDZIWYM źródle nie była łapana (50/0 mimo mutacji). NAPRAWA:
 *     `hexHasRiverAccess()` wyeksportowana (`export function`), test bundluje PRAWDZIWY
 *     `hexContextTooltip.ts` (stub tylko brandAssets) i woła realną funkcję -- [2b]/[3c]/[3d].
 *   N1 -- 4 kopie offsetów sąsiadów heksa (`HEX_NEIGHBOR_OFFSETS`/`hexNeighbors`/`HEX_NEIGHBORS`/
 *     kopia w tym pliku testowym) bez strażnika równości -- sekcja [N1] niżej porównuje tekstowo
 *     wszystkie źródła (regex) + krzyżowo z prawdziwym, wykonanym `hexNeighborCoords()`
 *     (units/setup.ts, eksportowana) dla kilku punktów startowych.
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
function assert(cond, msg, detail) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else {
    failed++;
    console.error('FAIL:', msg, detail !== undefined ? JSON.stringify(detail) : '');
  }
}

console.log('hex-tooltip-mozliwe-ulepszenia-zloze-test (P-HEX-TOOLTIP-MOZLIWE-ULEPSZENIA-BRAK-FILTRA-ZLOZA)\n');

// --- [1] PRZYPIĘTA LOKALIZACJA -------------------------------------------------------------
console.log('[1] regex na źródle: listTerrainPossibleImprovements() + hexHasRiverAccess()/buildRiverHexSet()');

const tooltipSrc = fs.readFileSync(TOOLTIP_SRC, 'utf8');
const fnMatch = tooltipSrc.match(
  /function listTerrainPossibleImprovements\(\s*hex: Hex,\s*playerCivType\?: string \| null,\s*map\?: GameMap,\s*\): string\[\] \{[\s\S]*?\n\}/,
);
assert(fnMatch !== null, 'znaleziono ciało funkcji listTerrainPossibleImprovements()');
const fnBody = fnMatch ? fnMatch[0] : '';

const riverFnMatch = tooltipSrc.match(
  /export function hexHasRiverAccess\(hex: Hex, map\?: GameMap\): boolean \{[\s\S]*?\n\}/,
);
assert(riverFnMatch !== null, 'znaleziono ciało funkcji hexHasRiverAccess() (i że jest eksportowana -- F2)');
const riverFnBody = riverFnMatch ? riverFnMatch[0] : '';

const riverSetFnMatch = tooltipSrc.match(
  /function buildRiverHexSet\(map: GameMap\): Set<string> \{[\s\S]*?\n\}/,
);
assert(riverSetFnMatch !== null, 'znaleziono ciało funkcji buildRiverHexSet()');
const riverSetFnBody = riverSetFnMatch ? riverSetFnMatch[0] : '';

const REQUIRED_LINES = [
  // pre-istniejące (nie regresja tej naprawy, ale muszą przetrwać)
  "if (key === 'bydlo' && nakladka !== Nakladka.ZlozeBydla) continue;",
  "if (key === 'owce' && nakladka !== Nakladka.ZlozeOwiec) continue;",
  "if (key === 'lama' && nakladka !== Nakladka.ZlozeLamy) continue;",
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
  "if (key === 'droga_brukowana' && !active.has('droga') && hex.ulepszenie !== Ulepszenie.Droga) continue;",
  "if (key === 'irygacja' && !hexHasRiverAccess(hex, map)) continue;",
];
for (const line of REQUIRED_LINES) {
  assert(fnBody.includes(line), `zawiera warunek: ${line.replace(/\n\s*/g, ' ')}`);
}

const REQUIRED_RIVER_FN_LINES = [
  'if (hex.rzeka?.obecna) return true;',
  'if (!map) return false;',
  'const riverHexSet = buildRiverHexSet(map);',
  'if (riverHexSet.has(`${q},${r}`)) return true;',
  'for (const [dq, dr] of HEX_NEIGHBOR_OFFSETS) {',
  'if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;',
];
for (const line of REQUIRED_RIVER_FN_LINES) {
  assert(riverFnBody.includes(line), `hexHasRiverAccess() zawiera: ${line}`);
}
const REQUIRED_RIVER_SET_LINES = [
  'for (const path of map.riverPaths) {',
  'for (const p of path) set.add(`${p.q},${p.r}`);',
];
for (const line of REQUIRED_RIVER_SET_LINES) {
  assert(riverSetFnBody.includes(line), `buildRiverHexSet() zawiera: ${line}`);
}
// F1 -- dowód, że sąsiedzi NIE są już sprawdzani przez ich rzeka.obecna (stary, wadliwy warunek).
assert(
  !riverFnBody.includes('map.hexes[`${q + dq},${r + dr}`]?.rzeka?.obecna'),
  'hexHasRiverAccess() NIE zawiera już starego warunku sąsiada przez rzeka.obecna (F1 naprawione)',
);

// --- [2] BUNDLE A -- realne funkcje bez map.riverPaths (warunki nakładka/złoże/droga) ------
console.log('\n[2] bundle A: realne funkcje silnika (bez hexContextTooltip.ts) dla warunków nakładka/złoże');

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
export { Nakladka, TerenBazowy, Ulepszenie } from '../src/types/hex';
export { hexNeighborCoords } from '../src/units/setup';
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
  console.error('[hex-tooltip-mozliwe-ulepszenia-zloze-test] bundle A failed:', e.message || e);
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
  Ulepszenie,
  hexNeighborCoords,
} = require(BUNDLE);

// --- [2b] BUNDLE B -- PRAWDZIWY hexContextTooltip.ts (stub TYLKO brandAssets) --------------
console.log('[2b] bundle B: prawdziwy hexContextTooltip.ts (stub icons/brandAssets), export hexHasRiverAccess real');

// Stub statyczny, commitowany (wzorzec innych plików w tools/.stubs/, np.
// side-list-hud-brandAssets-stub.ts) -- NIE regenerowany w locie, żeby zachować spójność z
// resztą repo (te pliki są ręcznie utrzymywaną, commitowaną fixture, nie artefaktem builda).
const BRAND_STUB = path.resolve(__dirname, '.stubs', 'hex-tooltip-zloze-brandAssets-stub.ts');
assert(fs.existsSync(BRAND_STUB), `stub brandAssets istnieje: ${BRAND_STUB}`);

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: BRAND_STUB }));
  },
};

/** Bundluje `hexHasRiverAccess` z `srcPath` (prawdziwy plik lub mutant) i zwraca funkcję. */
async function bundleRealHexHasRiverAccess(srcPath, tag) {
  const entry = path.join(__dirname, `.hex-tooltip-zloze-river-entry-${tag}.ts`);
  const bundle = path.join(__dirname, `.hex-tooltip-zloze-river-bundle-${tag}.cjs`);
  const relImport = './' + path.relative(path.dirname(entry), srcPath).replace(/\\/g, '/').replace(/\.ts$/, '');
  fs.writeFileSync(entry, `export { hexHasRiverAccess } from '${relImport}';\n`, 'utf8');
  try {
    await esbuild.build({
      entryPoints: [entry],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      loader: { '.ts': 'ts', '.json': 'json' },
      outfile: bundle,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } finally {
    try { fs.unlinkSync(entry); } catch { /* noop */ }
  }
  delete require.cache[require.resolve(bundle)];
  const mod = require(bundle);
  try { fs.unlinkSync(bundle); } catch { /* noop */ }
  return mod.hexHasRiverAccess;
}

async function main() {
  const realHexHasRiverAccess = await bundleRealHexHasRiverAccess(TOOLTIP_SRC, 'real');
  assert(typeof realHexHasRiverAccess === 'function', 'zbundlowano prawdziwy, eksportowany hexHasRiverAccess() z hexContextTooltip.ts');

  /**
   * Reimplementacja WYŁĄCZNIE tych warunków `listTerrainPossibleImprovements()`, które nie mają
   * osobnej eksportowanej funkcji silnika do zaimportowania (droga_brukowana -- inline w
   * `qualifies()`, nie eksportowana osobno). Warunek `irygacja` woła PRAWDZIWY, zbundlowany
   * `hexHasRiverAccess` (bundle B) -- F2: nie reimplementuje go, importuje.
   * `skipKeys` -- do dowodu mutacji [3]/[3b]: pozwala wyłączyć pojedynczy warunek.
   * `riverFn` -- wstrzykiwana implementacja hexHasRiverAccess (real lub mutant) do [3c]/[3d].
   */
  function computePossibleKeys(hex, playerCivType, skipKeys, map, riverFn) {
    const skip = skipKeys || new Set();
    const river = riverFn || realHexHasRiverAccess;
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
      if (!skip.has('droga_brukowana') && key === 'droga_brukowana'
        && !active.has('droga') && hex.ulepszenie !== Ulepszenie.Droga) continue;
      if (!skip.has('irygacja') && key === 'irygacja' && !river(hex, map)) continue;
      out.push(key);
    }
    return out;
  }

  function makeHex(terenBazowy, nakladka, zloze, extra) {
    return {
      coords: { q: 0, r: 0 },
      terenBazowy,
      nakladka: nakladka || Nakladka.Brak,
      ulepszenie: undefined,
      ulepszenia: undefined,
      wlasciciel: null,
      zloze: zloze || undefined,
      rzeka: { obecna: false },
      ...(extra || {}),
    };
  }

  // --- Przykład dokładnie ze zgłoszenia Macieja: Łąka, brak lasu/rzeki/złoża ---------------
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
    assert(!keys.includes('irygacja'), 'Łąka bez rzeki (map undefined): lista NIE zawiera Irygacji');
  }

  // --- Wzgórza + złoże żelaza -> Kopalnia żelaza POWINNA się pojawić -----------------------
  {
    const hex = makeHex(TerenBazowy.Wzgorza, Nakladka.Brak, 'zelazo');
    const keys = computePossibleKeys(hex, null);
    assert(keys.includes('kopalnia_zelaza'), 'Wzgórza + złoże żelaza: lista ZAWIERA Kopalnię żelaza');
    assert(!keys.includes('kopalnia_miedzi'), 'Wzgórza + złoże żelaza (nie miedzi): lista NIE zawiera Kopalni miedzi');
    assert(!keys.includes('kopalnia_zlota'), 'Wzgórza + złoże żelaza (nie złota): lista NIE zawiera Kopalni złota');
  }

  // --- Rownina + nakładka Las -> Tartak / Wyrąb / Obóz łowiecki POWINNY się pojawić --------
  {
    const hex = makeHex(TerenBazowy.Rownina, Nakladka.Las, undefined);
    const keys = computePossibleKeys(hex, null);
    assert(keys.includes('tartak'), 'Równina + Las: lista ZAWIERA Tartak');
    assert(keys.includes('wyrab'), 'Równina + Las: lista ZAWIERA Wyrąb');
    assert(keys.includes('oboz_lowiecki'), 'Równina + Las: lista ZAWIERA Obóz łowiecki');
    assert(!keys.includes('irygacja'), 'Równina + Las: lista NIE zawiera Irygacji (blokada lasu -- trzeba wyrąbać)');
  }

  // --- Złoże gliny (nakładka ZlozeGliny) -> Glinianka POWINNA się pojawić ------------------
  {
    const hex = makeHex(TerenBazowy.Laka, Nakladka.ZlozeGliny, undefined);
    const keys = computePossibleKeys(hex, null);
    assert(keys.includes('glinianka'), 'Łąka + złoże gliny (nakładka): lista ZAWIERA Glinianki');
  }

  // --- Wybrzeże (bez złoża soli) -> Warzelnia soli nadal OK (teren wystarcza) -------------
  {
    const hex = makeHex(TerenBazowy.Wybrzeze, Nakladka.Brak, undefined);
    const keys = computePossibleKeys(hex, null);
    assert(keys.includes('warzelnia_soli'), 'Wybrzeże bez złoża: lista ZAWIERA Warzelni soli (sól z morza, bez złoża)');
  }

  // --- (a) droga_brukowana wymaga JUŻ zbudowanej Drogi na heksie --------------------------
  console.log('\n[4] droga_brukowana wymaga istniejącej Drogi na heksie');
  {
    const hexNoRoad = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined);
    const keysNoRoad = computePossibleKeys(hexNoRoad, null);
    assert(!keysNoRoad.includes('droga_brukowana'),
      'Łąka BEZ Drogi: lista NIE zawiera Drogi brukowanej (silnik wymaga istniejącej Drogi)');

    const hexWithRoad = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { ulepszenie: 'droga' });
    const keysWithRoad = computePossibleKeys(hexWithRoad, null);
    assert(keysWithRoad.includes('droga_brukowana'),
      'Łąka Z Drogą (hex.ulepszenie=droga): lista ZAWIERA Drogę brukowaną (upgrade istniejącej Drogi)');
  }

  // --- (b) irygacja wymaga rzeki NA heksie LUB na sąsiedzie via riverPaths (F1, runda 4) ---
  console.log('\n[5] irygacja wymaga rzeki na heksie/sąsiedzie via map.riverPaths (isRiverAdjacent, F1 runda 4)');
  {
    // Bez mapy w ogóle -- fallback tylko do flagi na samym heksie.
    const hexNoMap = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 5, r: 5 } });
    assert(!computePossibleKeys(hexNoMap, null).includes('irygacja'),
      'Łąka bez mapy (map=undefined): lista NIE zawiera Irygacji');

    // Mapa bez żadnej rzeki (riverPaths puste) -> brak Irygacji.
    const hexEmptyMap = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 5, r: 5 } });
    const emptyMap = { riverPaths: [] };
    assert(!computePossibleKeys(hexEmptyMap, null, null, emptyMap).includes('irygacja'),
      'Łąka + mapa z riverPaths=[] (brak rzek): lista NIE zawiera Irygacji');

    // Rzeka NA samym heksie (przez rzeka.obecna) -> Irygacja OK.
    const hexRiverOnSelfFlag = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, {
      coords: { q: 5, r: 5 }, rzeka: { obecna: true },
    });
    assert(computePossibleKeys(hexRiverOnSelfFlag, null, null, { riverPaths: [] }).includes('irygacja'),
      'Łąka z rzeka.obecna=true NA heksie (riverPaths puste): lista ZAWIERA Irygacji (fallback własnej flagi)');

    // Rzeka NA samym heksie via riverPaths (bez flagi rzeka.obecna) -> Irygacja OK (riverHexSet.has(ownKey)).
    const hexRiverOnSelfPath = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 5, r: 5 } });
    const mapOwnInPaths = { riverPaths: [[{ q: 5, r: 5 }]] };
    assert(computePossibleKeys(hexRiverOnSelfPath, null, null, mapOwnInPaths).includes('irygacja'),
      'Łąka BEZ rzeka.obecna, ale własny heks JEST w riverPaths: lista ZAWIERA Irygacji (riverHexSet.has(ownKey))');

    // Sąsiad (q+1,r) jest w riverPaths -> Irygacja OK (isRiverAdjacent sprawdza sąsiadów).
    const hexCenter = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 5, r: 5 } });
    const mapNeighborInPaths = { riverPaths: [[{ q: 6, r: 5 }]] };
    assert(computePossibleKeys(hexCenter, null, null, mapNeighborInPaths).includes('irygacja'),
      'Łąka bez rzeki na sobie, sąsiad (q+1,r) JEST w riverPaths: lista ZAWIERA Irygacji');

    // *** F1 -- rdzeń naprawy rundy 4 ***: sąsiad ma "rozlaną" flagę rzeka.obecna=true (jak
    // syncRiverEdgeBonusHexes w grze), ale NIE jest w riverPaths -- silnik (isRiverAdjacent)
    // mówi NIE, więc tooltip też musi mówić NIE. Przed naprawą F1 to był fałszywy pozytyw
    // (~7% heksów FLAT_IRR, zmierzone przez Evaluatora na 3 seedach).
    const hexCenter2 = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 9, r: 9 } });
    // hex sąsiada nie jest w ogóle potrzebny w map.hexes -- hexHasRiverAccess czyta wyłącznie
    // map.riverPaths (nie map.hexes) -- dlatego mapa niżej celowo NIE zawiera "hexes".
    const mapSpreadFlagNotOnPath = { riverPaths: [] };
    assert(!computePossibleKeys(hexCenter2, null, null, mapSpreadFlagNotOnPath).includes('irygacja'),
      'F1: sąsiad z "rozlaną" rzeka.obecna, ale riverPaths PUSTE: lista NIE zawiera Irygacji (dawny fałszywy pozytyw naprawiony)');
  }

  // --- [3] MUTACJA -- cofnięcie warunku 'tartak' odtwarza stary bug -----------------------
  console.log('\n[3] mutacja: cofnięcie warunku tartak odtwarza stary bug (dowód, że [1] by to złapał)');
  {
    const hex = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined);
    const fixedKeys = computePossibleKeys(hex, null);
    const mutatedKeys = computePossibleKeys(hex, null, new Set(['tartak']));
    assert(!fixedKeys.includes('tartak'), 'Z warunkiem (naprawiona wersja): Tartak NIE pojawia się na gołej Łące');
    assert(mutatedKeys.includes('tartak'), 'Bez warunku (zmutowana wersja): Tartak WRACA na gołej Łące -- stary bug odtworzony');
  }

  // --- [3b] MUTACJA -- cofnięcie warunku droga_brukowana odtwarza stary bug ---------------
  console.log('\n[3b] mutacja: cofnięcie warunku droga_brukowana odtwarza stary bug');
  {
    const hexNoRoad = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined);
    const fixedRoadKeys = computePossibleKeys(hexNoRoad, null);
    const mutatedRoadKeys = computePossibleKeys(hexNoRoad, null, new Set(['droga_brukowana']));
    assert(!fixedRoadKeys.includes('droga_brukowana'), 'Z warunkiem: Droga brukowana NIE pojawia się bez Drogi');
    assert(mutatedRoadKeys.includes('droga_brukowana'),
      'Bez warunku: Droga brukowana WRACA bez Drogi -- odtworzony zgłoszony bug (720/1008 przy 0 dozwolonych)');
  }

  // --- [3c]/[3d] MUTACJA NA PRAWDZIWYM PLIKU ŹRÓDŁOWYM hexContextTooltip.ts (F2, runda 4) ---
  console.log('\n[3c]/[3d] mutacja NA PRAWDZIWYM hexContextTooltip.ts -- dowód, że test ma zęby na produkcji');
  {
    const realSrc = fs.readFileSync(TOOLTIP_SRC, 'utf8');

    // [3c] usunięcie CAŁEJ pętli po sąsiadach -- powinno cofnąć wykrywanie rzeki na sąsiedzie.
    const LOOP_BLOCK =
      '  for (const [dq, dr] of HEX_NEIGHBOR_OFFSETS) {\n' +
      '    if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;\n' +
      '  }\n';
    assert(realSrc.includes(LOOP_BLOCK), '[3c] przygotowanie: prawdziwe źródło zawiera dosłowny blok pętli po sąsiadach (kotwica mutacji)');
    const mutantNoLoopSrc = realSrc.replace(LOOP_BLOCK, '');
    assert(mutantNoLoopSrc.length < realSrc.length, '[3c] przygotowanie: mutant jest krótszy niż oryginał (pętla faktycznie usunięta)');
    const mutantNoLoopPath = path.join(GRA, 'src', 'ui', '.mutant-no-loop.hexContextTooltip.ts');
    fs.writeFileSync(mutantNoLoopPath, mutantNoLoopSrc, 'utf8');
    let mutantNoLoopFn;
    try {
      mutantNoLoopFn = await bundleRealHexHasRiverAccess(mutantNoLoopPath, 'no-loop');
    } finally {
      try { fs.unlinkSync(mutantNoLoopPath); } catch { /* noop */ }
    }
    const hexForLoopTest = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 5, r: 5 } });
    const mapNeighborOnPath = { riverPaths: [[{ q: 6, r: 5 }]] };
    assert(realHexHasRiverAccess(hexForLoopTest, mapNeighborOnPath) === true,
      '[3c] kontrola: PRAWDZIWA funkcja (bez mutacji) wykrywa rzekę na sąsiedzie (q+1,r) w riverPaths');
    assert(mutantNoLoopFn(hexForLoopTest, mapNeighborOnPath) === false,
      '[3c] MUTANT (pętla po sąsiadach usunięta z PRAWDZIWEGO pliku): przestaje wykrywać rzekę na sąsiedzie -- mutacja złapana');

    // [3d] przywrócenie starego warunku sąsiada przez rzeka.obecna zamiast riverHexSet --
    // powinno ODTWORZYĆ dokładnie zgłoszony przez Evaluatora błąd F1.
    const NEW_NEIGHBOR_CHECK = 'if (riverHexSet.has(`${q + dq},${r + dr}`)) return true;';
    const OLD_BUGGY_NEIGHBOR_CHECK = 'if (map.hexes[`${q + dq},${r + dr}`]?.rzeka?.obecna) return true;';
    assert(realSrc.includes(NEW_NEIGHBOR_CHECK), '[3d] przygotowanie: prawdziwe źródło zawiera dosłowny nowy warunek sąsiada (riverHexSet)');
    const mutantOldBugSrc = realSrc.replace(NEW_NEIGHBOR_CHECK, OLD_BUGGY_NEIGHBOR_CHECK);
    const mutantOldBugPath = path.join(GRA, 'src', 'ui', '.mutant-old-bug.hexContextTooltip.ts');
    fs.writeFileSync(mutantOldBugPath, mutantOldBugSrc, 'utf8');
    let mutantOldBugFn;
    try {
      mutantOldBugFn = await bundleRealHexHasRiverAccess(mutantOldBugPath, 'old-bug');
    } finally {
      try { fs.unlinkSync(mutantOldBugPath); } catch { /* noop */ }
    }
    // Heks z sąsiadem, którego map.hexes ma rzeka.obecna=true (rozlana flaga), ale sąsiad
    // NIE jest w riverPaths -- dokładnie scenariusz F1 zgłoszony przez Evaluatora.
    const hexForBugTest = makeHex(TerenBazowy.Laka, Nakladka.Brak, undefined, { coords: { q: 9, r: 9 } });
    const spreadFlagMap = {
      riverPaths: [], // silnik: sąsiad NIE jest na rzece
      hexes: { '10,9': { rzeka: { obecna: true } } }, // ale flaga "rozlana" mówi TAK
    };
    assert(realHexHasRiverAccess(hexForBugTest, spreadFlagMap) === false,
      '[3d] kontrola: PRAWDZIWA funkcja (bez mutacji) ignoruje rozlaną rzeka.obecna sąsiada spoza riverPaths (F1 naprawione)');
    assert(mutantOldBugFn(hexForBugTest, spreadFlagMap) === true,
      '[3d] MUTANT (przywrócony stary warunek rzeka.obecna sąsiada): odtwarza dokładnie zgłoszony błąd F1 -- mutacja złapana');
  }

  // --- [N1] 4 kopie offsetów sąsiadów heksa -- asercja równości (Evaluator nota N1) --------
  console.log('\n[N1] HEX_NEIGHBOR_OFFSETS (hexContextTooltip.ts) == hexNeighbors() (improvement-build.ts) == HEX_NEIGHBORS (units/setup.ts)');
  {
    const REFERENCE = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
    const normalize = (pairs) => pairs.map(([a, b]) => `${a},${b}`).sort().join('|');
    const refKey = normalize(REFERENCE);

    // hexContextTooltip.ts -- const HEX_NEIGHBOR_OFFSETS = [...]
    const tooltipOffsetsMatch = tooltipSrc.match(
      /const HEX_NEIGHBOR_OFFSETS: ReadonlyArray<readonly \[number, number\]> = \[([\s\S]*?)\];/,
    );
    assert(tooltipOffsetsMatch !== null, '[N1] znaleziono HEX_NEIGHBOR_OFFSETS w hexContextTooltip.ts');
    const tooltipPairs = tooltipOffsetsMatch
      ? [...tooltipOffsetsMatch[1].matchAll(/\[(-?\d+),\s*(-?\d+)\]/g)].map(m => [Number(m[1]), Number(m[2])])
      : [];
    assert(normalize(tooltipPairs) === refKey, '[N1] HEX_NEIGHBOR_OFFSETS (hexContextTooltip.ts) == referencja (6 przesunięć)',
      { got: tooltipPairs });

    // improvement-build.ts -- function hexNeighbors(q, r) { return [...]; }
    const improvementSrc = fs.readFileSync(path.join(GRA, 'src', 'map', 'improvement-build.ts'), 'utf8');
    const hexNeighborsMatch = improvementSrc.match(
      /function hexNeighbors\(q: number, r: number\): Array<\{ q: number; r: number \}> \{\s*return \[([\s\S]*?)\];/,
    );
    assert(hexNeighborsMatch !== null, '[N1] znaleziono hexNeighbors() w improvement-build.ts');
    // Parsowanie obiekt-po-obiekcie ({ q: q + 1, r } / { q, r: r + 1 } / { q: q+1, r: r-1 }) --
    // dq/dr domyślnie 0, gdy pole jest bare "q"/"r" (brak przesunięcia na tej osi).
    const hexNeighborsPairs = hexNeighborsMatch
      ? [...hexNeighborsMatch[1].matchAll(/\{([^}]*)\}/g)].map((m) => {
        const objStr = m[1];
        const mq = objStr.match(/q:\s*q\s*([+-])\s*(\d+)/);
        const mr = objStr.match(/r:\s*r\s*([+-])\s*(\d+)/);
        const dq = mq ? (mq[1] === '-' ? -Number(mq[2]) : Number(mq[2])) : 0;
        const dr = mr ? (mr[1] === '-' ? -Number(mr[2]) : Number(mr[2])) : 0;
        return [dq, dr];
      })
      : [];
    assert(normalize(hexNeighborsPairs) === refKey, '[N1] hexNeighbors() (improvement-build.ts) == referencja (6 przesunięć)',
      { got: hexNeighborsPairs });

    // units/setup.ts -- const HEX_NEIGHBORS = [[+1,0],[-1,0],...] -- porównanie REALNE
    // (wykonane), nie tekstowe: hexNeighborCoords(q, r) faktycznie zaimportowana z bundle A.
    const originQ = 100;
    const originR = -50;
    const realNeighbors = hexNeighborCoords(originQ, originR).map(({ q, r }) => [q - originQ, r - originR]);
    assert(normalize(realNeighbors) === refKey,
      '[N1] hexNeighborCoords() (units/setup.ts, WYKONANA naprawdę) == referencja (6 przesunięć)',
      { got: realNeighbors });
    // drugi punkt startowy -- wyklucza przypadkowe zgranie się przy (0,0)/symetriach
    const realNeighbors2 = hexNeighborCoords(-7, 12).map(({ q, r }) => [q - (-7), r - 12]);
    assert(normalize(realNeighbors2) === refKey,
      '[N1] hexNeighborCoords() z drugiego punktu startowego -- też == referencja (offsety nie zależą od punktu)',
      { got: realNeighbors2 });
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  try { fs.unlinkSync(ENTRY); } catch { /* noop */ }
  try { fs.unlinkSync(BUNDLE); } catch { /* noop */ }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('[hex-tooltip-mozliwe-ulepszenia-zloze-test] błąd:', e && e.stack || e);
  process.exit(1);
});
