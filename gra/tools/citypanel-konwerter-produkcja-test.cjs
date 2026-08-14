'use strict';
/**
 * citypanel-konwerter-produkcja-test.cjs -- P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE
 * (Maciej 2026-08-14): panel „BUDYNKI W MIEŚCIE" pokazywał WYŁĄCZNIE koszt utrzymania
 * budynku-konwertera (np. Garncarnia glina+drewno→ceramika) -- brak jakiejkolwiek
 * informacji o stronie PRODUKCYJNEJ (zużycie gliny, przyrost ceramiki).
 *
 * Run z gra/:  node tools/citypanel-konwerter-produkcja-test.cjs
 *
 * METODOLOGIA (świadoma granica, wzorem `owned-building-detail-side-test.cjs`, ta sama
 * funkcja `appendOwnedBuildingRow`): pełne wykonanie `appendOwnedBuildingRow`/
 * `buildingConverterProductionDisplay` wymagałoby jsdom + stub całego modułowego
 * `cfg` (konfigurowanego przez `configureCityPanel`) + stubów THREE.js/ikon SVG
 * importowanych przez `cityPanel.ts` (unitMiniPreview, brandAssets, ...) -- koszt
 * nieproporcjonalny do zakresu tej naprawy (dwie nowe, w większości PROSTE funkcje
 * pomocnicze). Zamiast tego:
 *   [1] Bundlujemy PRAWDZIWY `converters.ts` (esbuild, jak `converter-era-scaling-test.cjs`)
 *       i wołamy WPROST te same funkcje (`DEFAULT_CONVERTER_RECIPES`,
 *       `converterBuildingIdForRecipe`, `converterThroughputForEra`, `loadThroughput`)
 *       oraz PRAWDZIWY `econ-params.json`, żeby policzyć oczekiwaną liczbę tą samą
 *       drogą co silnik/HUD (`empireConverterResourceRatesForOwner` w main.ts).
 *   [2] Text-anchor na `cityPanel.ts` (real source) potwierdza, że
 *       `buildingConverterProductionDisplay`/`formatConverterProductionRowHtml` WOŁAJĄ
 *       DOKŁADNIE te same importowane funkcje z tymi samymi parametrami (nie
 *       reimplementują własnej, potencjalnie rozjeżdżającej się logiki) i że wynik jest
 *       renderowany jako ODDZIELNA linia (`bld-owned-conv-row`) od kosztu utrzymania
 *       (`bld-owned-tail`/`bld-owned-upkeep`) -- dokładnie żądanie właściciela
 *       "rozdzielony koszt utrzymania od kosztu produkcji".
 *   [3] Mutacja na kopii źródła: usunięcie wywołania `buildingConverterProductionDisplay`
 *       w `appendOwnedBuildingRow` -- test [2] MUSI złapać to czerwono (dowód, że
 *       asercje nie są no-opami).
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

// ---------------------------------------------------------------------------
// [1] Prawdziwa logika silnika (converters.ts + econ-params.json) -- liczby,
//     które UI MUSI odzwierciedlać.
// ---------------------------------------------------------------------------
console.log('\n-- [1] Silnik (real converters.ts + real econ-params.json): receptury i throughput --');

const esbuild = (() => {
  const apiPath = path.resolve(GRA, 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[citypanel-konwerter-produkcja-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.citypanel-conv-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.citypanel-conv-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  DEFAULT_CONVERTER_RECIPES, converterBuildingIdForRecipe, converterThroughputForEra, loadThroughput,
} from '../src/game/converters';
`, 'utf8');

let engine;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(BUNDLE_FILE)];
  engine = require(BUNDLE_FILE);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) {}
}

const econParams = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'econ-params.json'), 'utf8'));

function recipesForBuilding(buildingId) {
  return engine.DEFAULT_CONVERTER_RECIPES.filter(
    r => engine.converterBuildingIdForRecipe(r) === buildingId,
  );
}

// Garncarnia -- dokładnie receptura zgłoszona przez właściciela: "glina+drewno→ceramika".
{
  const recipes = recipesForBuilding('garncarnia');
  ok(recipes.length === 1, `garncarnia ma dokładnie 1 receptury (got ${recipes.length})`);
  const r = recipes[0];
  ok(r && r.inputs.glina === 1 && r.inputs.drewno === 1 && r.output === 'ceramika' && r.outputAmount === 1,
    `receptura garncarni = 1 glina + 1 drewno -> 1 ceramika (got ${JSON.stringify(r && r.inputs)} -> ${r && r.output})`);

  const era = 1;
  const baseThroughput = engine.loadThroughput(econParams, r.throughputParamKey, 'normal', r.throughputFallback);
  const throughput = engine.converterThroughputForEra(r.id, baseThroughput, era);
  ok(throughput > 0, `throughput Garncarni era1 > 0 (got ${throughput})`);
  // konsument i producent tej samej liczby cykli -- oczekiwana wartość wiersza UI
  const expectedGlina = Math.round(r.inputs.glina * throughput);
  const expectedDrewno = Math.round(r.inputs.drewno * throughput);
  const expectedCeramika = Math.round(r.outputAmount * throughput);
  ok(expectedGlina > 0 && expectedDrewno > 0 && expectedCeramika > 0,
    `oczekiwane wartości wiersza UI > 0 (glina=${expectedGlina}, drewno=${expectedDrewno}, ceramika=${expectedCeramika})`);
  console.log(`   Garncarnia era1: -${expectedGlina} Glina/t · -${expectedDrewno} Drewno/t · +${expectedCeramika} Ceramika/t`);
}

// WSZYSTKIE budynki-konwertery istniejące w buildings.json (zakres napraw = cała klasa,
// nie tylko Garncarnia -- wymóg zadania #3).
const buildingsJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const buildingIds = new Set((Array.isArray(buildingsJson) ? buildingsJson : buildingsJson.budynki || []).map(b => b.id));
console.log('\n-- [1b] Wszystkie budynki-konwertery obecne w buildings.json mają >=1 receptur --');
for (const bid of ['garncarnia', 'cegielnia', 'odlewnia_brazu', 'odlewnia_zelaza', 'wielka_odlewnia']) {
  ok(buildingIds.has(bid), `budynek '${bid}' istnieje w buildings.json`);
  const recipes = recipesForBuilding(bid);
  ok(recipes.length >= 1, `budynek '${bid}' ma >=1 receptur w DEFAULT_CONVERTER_RECIPES (got ${recipes.length})`);
}
ok(recipesForBuilding('odlewnia_zelaza').length === 2, 'odlewnia_zelaza ma 2 receptury (braz + zelazo)');
ok(recipesForBuilding('wielka_odlewnia').length === 3, 'wielka_odlewnia ma 3 receptury (braz + zelazo + stal)');

// ---------------------------------------------------------------------------
// [2] Text-anchor: cityPanel.ts woła TE SAME prawdziwe funkcje silnika, nie
//     reimplementuje własnej logiki, i renderuje wynik jako ODDZIELNĄ linię.
// ---------------------------------------------------------------------------
console.log('\n-- [2] cityPanel.ts: buildingConverterProductionDisplay woła prawdziwe funkcje silnika --');

ok(/import\s*\{[^}]*DEFAULT_CONVERTER_RECIPES[^}]*\}\s*from\s*'\.\.\/game\/converters'/s.test(src),
  "cityPanel.ts importuje DEFAULT_CONVERTER_RECIPES z '../game/converters' (nie reimplementuje receptur)");
ok(/import\s*\{[^}]*converterThroughputForEra[^}]*\}\s*from\s*'\.\.\/game\/converters'/s.test(src),
  "cityPanel.ts importuje converterThroughputForEra z '../game/converters'");

{
  const fnStart = src.indexOf('function buildingConverterProductionDisplay(');
  ok(fnStart > -1, 'kotwica "function buildingConverterProductionDisplay(" znaleziona');
  const fnEnd = src.indexOf('\nfunction formatConverterProductionRowHtml(', fnStart);
  ok(fnEnd > fnStart, 'kotwica końca (function formatConverterProductionRowHtml) znaleziona');
  const fnSrc = src.slice(fnStart, fnEnd);

  ok(fnSrc.includes('DEFAULT_CONVERTER_RECIPES.filter('), 'filtruje DEFAULT_CONVERTER_RECIPES (nie własną listę)');
  ok(fnSrc.includes('converterBuildingIdForRecipe(r) === def.id'),
    'dopasowanie receptury do budynku przez converterBuildingIdForRecipe(r) === def.id (cała klasa budynków, nie hardkodowana Garncarnia)');
  ok(fnSrc.includes('converterThroughputForEra(recipe.id, baseThroughput, era)'),
    'throughput liczony przez converterThroughputForEra -- ta sama skala epoki co silnik/HUD');
  ok(fnSrc.includes("cfg.getEpoch?.(city.ownerId)"), 'era czytana z cfg.getEpoch (per-owner, parytet AI, jak reszta pliku)');
  ok(fnSrc.includes('loadThroughput('), 'baseThroughput czytany z econ-params.json przez loadThroughput (nie hardkodowana stała)');
  ok(!/const\s+recipes\s*=\s*\[/.test(fnSrc), "REGRESJA: brak lokalnie zahardkodowanej tablicy receptur");
}

{
  const fnStart = src.indexOf('function formatConverterProductionRowHtml(');
  ok(fnStart > -1, 'kotwica "function formatConverterProductionRowHtml(" znaleziona');
  const fnEnd = src.indexOf('\nfunction appendOwnedBuildingRow(', fnStart);
  ok(fnEnd === -1 || fnEnd > fnStart, 'kotwica dalszego kodu po formatConverterProductionRowHtml sensowna');
  const scope = fnEnd > fnStart ? src.slice(fnStart, fnEnd) : src.slice(fnStart, fnStart + 2000);
  ok(scope.includes('bld-owned-conv-in'), 'zużycie (wejścia konwertera) oznaczone klasą bld-owned-conv-in');
  ok(scope.includes('bld-owned-conv-out'), 'produkcja (wyjście konwertera) oznaczone klasą bld-owned-conv-out');
  ok(/`−\$\{amt\}/.test(scope), 'wejścia renderowane ze znakiem minus (−)');
  ok(/`\+\$\{amt\}/.test(scope), 'wyjście renderowane ze znakiem plus (+)');
}

console.log('\n-- [2b] appendOwnedBuildingRow: wiersz produkcji ODDZIELONY od wiersza utrzymania --');
{
  const fnStart = src.indexOf('function appendOwnedBuildingRow(');
  ok(fnStart > -1, 'kotwica "function appendOwnedBuildingRow(" znaleziona');
  const fnEnd = src.indexOf('\n/**', fnStart);
  ok(fnEnd > fnStart, 'kotwica końca (następny blok komentarza) znaleziona');
  const fnSrc = src.slice(fnStart, fnEnd);

  ok(fnSrc.includes('buildingConverterProductionDisplay(def, city, data)'),
    'appendOwnedBuildingRow woła buildingConverterProductionDisplay dla KAŻDEGO wiersza budynku');
  // Musi zostać dodane PO "if (tail.childElementCount > 0) row.appendChild(tail);" (tail = koszt
  // utrzymania) i jako WŁASNY element dołożony do `row`, nie do `tail` -- to jest fizyczne
  // rozdzielenie "koszt utrzymania" / "bilans produkcji" (żądanie właściciela).
  const tailIdx = fnSrc.indexOf('if (tail.childElementCount > 0) row.appendChild(tail);');
  const convIdx = fnSrc.indexOf('buildingConverterProductionDisplay(def, city, data)');
  ok(tailIdx > -1 && convIdx > tailIdx, 'wywołanie produkcji następuje PO domknięciu wiersza utrzymania (tail), nie wewnątrz niego');
  ok(fnSrc.includes("el('div', 'bld-owned-conv-row')"), 'wiersz produkcji to OSOBNY element div.bld-owned-conv-row');
  ok(fnSrc.includes('row.appendChild(convRow)'), 'wiersz produkcji dołączony do row (rodzic), NIE do tail (rodzic kosztu utrzymania)');
  ok(!/tail\.appendChild\(convRow\)/.test(fnSrc), 'REGRESJA: wiersz produkcji NIE jest dokładany do tail (musi być fizycznie oddzielony)');
}

console.log('\n-- [2c] CSS: klasy bld-owned-conv-* zdefiniowane --');
ok(/\.bld-owned-conv-row\{/.test(src), '.bld-owned-conv-row zdefiniowana w CSS');
ok(/\.bld-owned-conv-in\{/.test(src), '.bld-owned-conv-in zdefiniowana w CSS');
ok(/\.bld-owned-conv-out\{/.test(src), '.bld-owned-conv-out zdefiniowana w CSS');

// ---------------------------------------------------------------------------
// [3] Mutacja: usunięcie wywołania buildingConverterProductionDisplay z
//     appendOwnedBuildingRow -- test [2b] MUSI złapać to czerwono.
// ---------------------------------------------------------------------------
if (!process.argv.includes('--self-check-skip-mutation')) {
  console.log('\n-- [3] Mutacja: usunięcie wywołania buildingConverterProductionDisplay --');
  const backup = src;
  const needle = 'const convDisplay = buildingConverterProductionDisplay(def, city, data);';
  ok(src.includes(needle), 'kotwica mutacji istnieje w źródle');
  const mutated = src.replace(needle, 'const convDisplay = null; // MUTATED-OUT');
  ok(mutated !== backup, 'mutacja faktycznie zmieniła źródło');

  fs.writeFileSync(CITY_PANEL_TS, mutated, 'utf8');
  const { execSync } = require('child_process');
  let mutantFailed = false;
  try {
    execSync(`node ${__filename} --self-check-skip-mutation`, { cwd: __dirname, stdio: 'pipe' });
  } catch (e) {
    mutantFailed = true;
  } finally {
    fs.writeFileSync(CITY_PANEL_TS, backup, 'utf8');
  }
  ok(mutantFailed, 'mutacja (wywołanie zastąpione null) łapana czerwono przez sekcję [2b] tego samego testu');
  ok(fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup, 'plik przywrócony do stanu oryginalnego po mutacji (treść identyczna)');
}

try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}

if (process.argv.includes('--self-check-skip-mutation')) {
  console.log(`\ncitypanel-konwerter-produkcja-test (self-check): ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

console.log(`\ncitypanel-konwerter-produkcja-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
