'use strict';
/**
 * hud-konwerter-dopasowanie-test.cjs — P-HUD-KONWERTER-DOPASOWANIE-BUDYNKI-NIESPOJNE
 * (Maciej 2026-08-14).
 *
 * PO CO TEN PLIK. `empireConverterResourceRatesForOwner` (main.ts, licznik HUD imperium)
 * dopasowywał budynek↔receptura konwertera przez `builtIds.includes(recipe.id)`. To
 * działa TYLKO gdy `recipe.id === buildingId`. Dla receptur, gdzie `recipe.buildingId`
 * (DEFAULT_CONVERTER_RECIPES, converters.ts) różni się od `recipe.id` (np.
 * 'odlewnia_zelaza__zelazo' → buildingId 'odlewnia_zelaza') dopasowanie NIGDY nie
 * trafiało — HUD zwracał {} zamiast realnej produkcji. Dotyczy Odlewni żelaza (2
 * receptury) i Wielkiej odlewni (3 receptury), 5 z 10 receptur ogółem.
 * Naprawa: dopasowanie przez `converterBuildingIdForRecipe(recipe)` — ten sam wzorzec
 * co silnik tury (turn-economy.ts::advanceCityEconomy, linia ~1604).
 *
 * WAŻNE (nawracający problem w projekcie — poprzedni temat city-panel dostał FAIL od
 * Evaluatora za reimplementację logiki dopasowania jako kopii w teście): ten test WYCINA
 * PRAWDZIWY TEKST `empireConverterResourceRatesForOwner` z bieżącego main.ts i wykonuje
 * go NAPRAWDĘ (esbuild transform + `new Function`) z prawdziwymi `DEFAULT_CONVERTER_RECIPES`
 * / `loadThroughput` / `converterThroughputForEra` / `converterBuildingIdForRecipe` z
 * prawdziwego converters.ts (zbundlowanego, nie reimplementowanego). Jedyne atrapy w
 * kontekście leksykalnym to `data`/`_menuDifficulty`/`cities`/`cityBuilt` (dane testowe)
 * i `empireEpochForOwner` (stub zwracający stałą epokę — resolver epoki jest osobną,
 * już przetestowaną funkcją w converter-era-scaling-test.cjs, poza zakresem tego bugu).
 *
 * §1 TEST BEHAWIORALNY na prawdziwym kodzie: Odlewnia żelaza / Wielka odlewnia / trójka
 *    już-działająca (Cegielnia/Garncarnia/Odlewnia brązu) — brak regresji.
 * §2 MUTACJA — przywrócenie starego `builtIds.includes(recipe.id)` na WYCIĘTYM tekście
 *    (w pamięci, dysk nietknięty) musi zwrócić {} dla Odlewni żelaza/Wielkiej odlewni —
 *    dowód, że test faktycznie łapie ten błąd, a nie jest tautologią.
 *
 * Bramka (z katalogu gra/): node tools/hud-konwerter-dopasowanie-test.cjs — exit 0 = zielona.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const MAIN_TS = path.join(GRA_ROOT, 'src', 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

let pass = 0, fail = 0;
function ok(cond, label) { if (cond) { pass++; } else { fail++; console.error('FAIL:', label); } }

// --- modul receptur/konwerterow (prawdziwy, nie atrapa) ---------------------
const ENTRY = path.resolve(__dirname, '.hud-konwerter-entry.ts');
const BUNDLE = path.resolve(__dirname, '.hud-konwerter-bundle.cjs');
fs.writeFileSync(ENTRY, `
export * from '../src/game/converters';
`, 'utf8');
esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
  absWorkingDir: GRA_ROOT, nodePaths: [path.resolve(GRA_ROOT, 'node_modules')],
});
const CONV = require(BUNDLE);
const { DEFAULT_CONVERTER_RECIPES, loadThroughput, converterThroughputForEra,
  converterBuildingIdForRecipe } = CONV;

// ---------------------------------------------------------------------------
// Wycinanie funkcji po SYGNATURZE (nie po numerze linii — te sie przesuwaja przy
// kazdym commicie). Wzorzec: road-hook-mainguard-test.cjs.
// / EN: extract a function body by signature, never by line number.
// ---------------------------------------------------------------------------
function wytnijFunkcje(src, sygnatura) {
  const start = src.indexOf(sygnatura);
  if (start < 0) return null;
  let i = src.indexOf('{', start);
  if (i < 0) return null;
  let depth = 0;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) return src.slice(start, i + 1); }
  }
  return null;
}

const SYG_HUD_KONWERTER = 'function empireConverterResourceRatesForOwner(ownerId: number): Partial<Record<string, number>> {';

const funkcjaRealna = wytnijFunkcje(realSrc, SYG_HUD_KONWERTER);
ok(!!funkcjaRealna, 'empireConverterResourceRatesForOwner znaleziona w main.ts (sygnatura niezmieniona)');

/**
 * Buduje działającą `empireConverterResourceRatesForOwner` z PODANEGO tekstu źródła
 * (prawdziwego albo zmutowanego w pamięci). Wolne zmienne domknięcia main.ts podstawiamy
 * atrapami; DEFAULT_CONVERTER_RECIPES/loadThroughput/converterThroughputForEra/
 * converterBuildingIdForRecipe SĄ prawdziwe (zbundlowane z converters.ts wyżej).
 */
function zbudujFunkcje(src) {
  const txt = wytnijFunkcje(src, SYG_HUD_KONWERTER);
  if (!txt) return null;
  const js = esbuild.transformSync(txt, { loader: 'ts', target: 'node18' }).code;
  const fabryka = new Function('deps', `
    const { data, _menuDifficulty, cities, cityBuilt, DEFAULT_CONVERTER_RECIPES,
            loadThroughput, converterThroughputForEra, converterBuildingIdForRecipe,
            empireEpochForOwner } = deps;
    ${js}
    return empireConverterResourceRatesForOwner;
  `);
  return fabryka;
}

/** Scenariusz testowy: 3 miasta (3 wlascicieli), kazde z inna kombinacja budynkow. */
function zbudujDane() {
  const cities = [
    { id: 'miasto-zelaza', ownerId: 1, q: 0, r: 0, name: 'Zelazogrod', population: 5 },
    { id: 'miasto-wielkiej', ownerId: 2, q: 1, r: 0, name: 'Wielkoodlew', population: 5 },
    { id: 'miasto-podstawowe', ownerId: 3, q: 2, r: 0, name: 'Ceglowo', population: 5 },
    { id: 'miasto-puste', ownerId: 4, q: 3, r: 0, name: 'Pustogrod', population: 5 },
  ];
  const cityBuilt = new Map([
    ['miasto-zelaza', ['odlewnia_zelaza']],
    ['miasto-wielkiej', ['wielka_odlewnia']],
    ['miasto-podstawowe', ['cegielnia', 'garncarnia', 'odlewnia_brazu']],
    ['miasto-puste', []],
  ]);
  const data = { econParams: {} }; // brak budynki -> loadThroughput spada na throughputFallback
  const _menuDifficulty = 'normal';
  const empireEpochForOwner = () => 1; // era 1 -- resolver epoki poza zakresem tego bugu
  return { data, _menuDifficulty, cities, cityBuilt, empireEpochForOwner };
}

function wywolajDlaOwnera(fn, ownerId) {
  const dane = zbudujDane();
  const F = fn({
    ...dane,
    DEFAULT_CONVERTER_RECIPES, loadThroughput, converterThroughputForEra,
    converterBuildingIdForRecipe,
  });
  return F(ownerId);
}

// ===========================================================================
// §1. TEST BEHAWIORALNY — prawdziwy kod main.ts (PO naprawie)
// ===========================================================================
const fnNaprawiona = zbudujFunkcje(realSrc);
ok(!!fnNaprawiona, 'funkcja wycieta i skompilowana z realnego main.ts');

if (fnNaprawiona) {
  // Odlewnia zelaza (ownerId=1) — 2 receptury z buildingId != id: braz + zelazo.
  const zelaza = wywolajDlaOwnera(fnNaprawiona, 1);
  ok(Object.keys(zelaza).length > 0, 'Odlewnia zelaza: HUD zwraca NIEPUSTY wynik (nie {})');
  ok(zelaza.zelazo === 25, `Odlewnia zelaza: Zelazo (produkcja, jednostek/ture, era 1, normal) = 25 (got ${zelaza.zelazo})`);
  ok(zelaza.braz === 25, `Odlewnia zelaza: Braz (produkcja, jednostek/ture, era 1, normal) = 25 (got ${zelaza.braz})`);

  // Wielka odlewnia (ownerId=2) — 3 receptury z buildingId != id: braz + zelazo + stal.
  const wielka = wywolajDlaOwnera(fnNaprawiona, 2);
  ok(Object.keys(wielka).length > 0, 'Wielka odlewnia: HUD zwraca NIEPUSTY wynik (nie {})');
  ok(wielka.braz === 25, `Wielka odlewnia: Braz (produkcja, jednostek/ture, era 1, normal) = 25 (got ${wielka.braz})`);
  ok(wielka.zelazo === 25, `Wielka odlewnia: Zelazo (produkcja, jednostek/ture, era 1, normal) = 25 (got ${wielka.zelazo})`);
  ok(wielka.stal === 25, `Wielka odlewnia: Stal (produkcja, jednostek/ture, era 1, normal) = 25 (got ${wielka.stal})`);

  // BRAK REGRESJI — trojka juz dzialajaca przed naprawa (recipe.id === buildingId).
  const podstawowe = wywolajDlaOwnera(fnNaprawiona, 3);
  ok(podstawowe.cegla === 50, `Cegielnia: Cegla (produkcja, jednostek/ture, era 1, normal) = 50 (got ${podstawowe.cegla})`);
  ok(podstawowe.ceramika === 50, `Garncarnia: Ceramika (produkcja, jednostek/ture, era 1, normal) = 50 (got ${podstawowe.ceramika})`);
  ok(podstawowe.braz === 25, `Odlewnia brazu: Braz (produkcja, jednostek/ture, era 1, normal) = 25 (got ${podstawowe.braz})`);

  // Brzeg: wlasciciel bez zadnego konwertera -> pusty obiekt, nie undefined/wyjatek.
  const puste = wywolajDlaOwnera(fnNaprawiona, 4);
  ok(typeof puste === 'object' && puste !== null, 'wlasciciel bez konwerterow: wynik jest obiektem (nie undefined/null)');
  ok(Object.keys(puste).length === 0, `wlasciciel bez konwerterow: wynik pusty {} (got ${JSON.stringify(puste)})`);

  // Brzeg: wlasciciel bez zadnego miasta w ogole (nieistniejacy ownerId) -> {} bez wyjatku.
  const nieistniejacy = wywolajDlaOwnera(fnNaprawiona, 999);
  ok(typeof nieistniejacy === 'object' && Object.keys(nieistniejacy).length === 0,
    `wlasciciel bez zadnego miasta: wynik pusty {} (got ${JSON.stringify(nieistniejacy)})`);
}

// ===========================================================================
// §2. MUTACJA — przywrocenie starego dopasowania `builtIds.includes(recipe.id)`
//     na WYCIETYM tekscie (dysk nietkniety). Dowod, ze test faktycznie lapie
//     dokladnie ten blad, a nie jest tautologia (extract-to-pure-function
//     wzorzec z playbooka: import prawdziwej jednostki, nie kopia formuly).
// ===========================================================================
{
  const wzorzecNaprawiony = 'if (!builtIds.includes(converterBuildingIdForRecipe(recipe))) continue;';
  ok(realSrc.includes(wzorzecNaprawiony), 'wzorzec naprawionego dopasowania obecny w main.ts (przygotowanie mutacji OK)');

  const wzorzecStary = 'if (!builtIds.includes(recipe.id)) continue;';
  const zmutowanySrc = realSrc.replace(wzorzecNaprawiony, wzorzecStary);
  ok(zmutowanySrc !== realSrc, 'mutacja przygotowana (tekst faktycznie sie zmienil)');

  const fnStara = zbudujFunkcje(zmutowanySrc);
  if (fnStara) {
    const zelazaStara = wywolajDlaOwnera(fnStara, 1);
    ok(Object.keys(zelazaStara).length === 0,
      `(mutacja) stare dopasowanie recipe.id: Odlewnia zelaza daje PUSTY wynik {} — regresja ZLAPANA (got ${JSON.stringify(zelazaStara)})`);

    const wielkaStara = wywolajDlaOwnera(fnStara, 2);
    ok(Object.keys(wielkaStara).length === 0,
      `(mutacja) stare dopasowanie recipe.id: Wielka odlewnia daje PUSTY wynik {} — regresja ZLAPANA (got ${JSON.stringify(wielkaStara)})`);

    // Kontrola: trojka Cegielnia/Garncarnia/Odlewnia-brazu (recipe.id === buildingId) MIALA
    // dzialac nawet ze starym kodem -- jesli mutacja jednoczesnie psuje i ja, mutacja jest
    // zle przygotowana (za szeroka), a nie dowodzi punktowo tego jednego bledu.
    const podstawoweStara = wywolajDlaOwnera(fnStara, 3);
    ok(podstawoweStara.cegla === 50 && podstawoweStara.ceramika === 50 && podstawoweStara.braz === 25,
      `(kontrola mutacji) stare dopasowanie NIE psulo trojki juz-dzialajacej (got ${JSON.stringify(podstawoweStara)})`);
  } else {
    fail++; console.error('FAIL: nie udalo sie zbudowac zmutowanej funkcji do testu regresyjnego');
  }
}

fs.rmSync(ENTRY, { force: true });
fs.rmSync(BUNDLE, { force: true });
console.log('hud-konwerter-dopasowanie-test: ' + pass + ' passed, ' + fail + ' failed');
process.exit(fail ? 1 : 0);
