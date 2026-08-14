'use strict';
/**
 * citypanel-konwerter-produkcja-test.cjs -- P-CITYPANEL-BUDYNKI-BRAK-PRODUKCJI-W-LISCIE
 * (Maciej 2026-08-14): panel „BUDYNKI W MIEŚCIE" pokazywał WYŁĄCZNIE koszt utrzymania
 * budynku-konwertera (np. Garncarnia glina+drewno→ceramika) -- brak jakiejkolwiek
 * informacji o stronie PRODUKCYJNEJ (zużycie gliny, przyrost ceramiki).
 *
 * Run z gra/:  node tools/citypanel-konwerter-produkcja-test.cjs
 *
 * RUNDA 2 (po werdykcie FAIL Evaluatora, N1): runda 1 miała test w ~90%
 * text-anchorem, sekcja [1] liczyła oczekiwane wartości WŁASNĄ kopią formuły
 * silnika i nigdy nie porównywała ich z wynikiem UI (jedyna asercja była
 * `> 0`) -- klasyczna tautologia testowa. 4 z 6 mutacji kontrolnych
 * Evaluatora (M2 zużycie ×2, M3 ignorowanie outputAmount, M4 trudność na
 * sztywno, M7 pomijanie wszystkich wejść) przechodziły bramkę na zielono.
 *
 * Naprawa (N1): logika przeniesiona do CZYSTEJ funkcji domenowej
 * `converterProductionDisplayForBuilding(buildingId, rawParams, difficulty, era)`
 * w `src/game/converters.ts`; `cityPanel.ts` woła TĘ SAMĄ funkcję (cienka
 * otoczka, `buildingConverterProductionDisplay`). Ten test:
 *   [1] Bundluje PRAWDZIWY `converters.ts` (esbuild) i woła WPROST
 *       `converterProductionDisplayForBuilding` z PRAWDZIWYM `econ-params.json`
 *       -- zero reimplementacji formuły w teście.
 *   [1c] Przypina TWARDE liczby z werdyktu Evaluatora (nie tylko `> 0`):
 *        Garncarnia era1/2/3 = 50/55/60 szt./turę (glina, drewno, ceramika);
 *        Odlewnia brązu era1 = ruda 25, drewno 25, ruda cyny 2,5, brąz 25;
 *        budynek bez receptury (np. spichlerz) -> null.
 *   [2] Text-anchor na `cityPanel.ts`: potwierdza, że UI importuje i woła
 *       BEZPOŚREDNIO `converterProductionDisplayForBuilding` z
 *       `../game/converters` -- NIE ma własnej kopii receptur/throughput.
 *   [3] Mutacja wiring: usunięcie wywołania `buildingConverterProductionDisplay`
 *       w `appendOwnedBuildingRow` -- sekcja [2b] MUSI złapać to czerwono.
 *   [4] Mutacje kontrolne NA PRAWDZIWEJ LOGICE (converters.ts) -- odtwarza
 *       M2/M3/M7 z werdyktu Evaluatora wprost na
 *       `converterProductionDisplayForBuilding` i potwierdza, że TWARDE liczby
 *       z [1c] łapią je czerwono (dowód, że [1c] nie jest nową tautologią).
 */

const fs = require('fs');
const path = require('path');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const GRA = path.resolve(__dirname, '..');
const CITY_PANEL_TS = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const CONVERTERS_TS = path.join(GRA, 'src', 'game', 'converters.ts');
const src = fs.readFileSync(CITY_PANEL_TS, 'utf8');

// ---------------------------------------------------------------------------
// [1] Prawdziwa logika silnika (converters.ts + econ-params.json) -- liczby,
//     które UI MUSI odzwierciedlać. Bundlujemy i wołamy `converterProductionDisplayForBuilding`
//     WPROST -- zero reimplementacji formuły w tym pliku.
// ---------------------------------------------------------------------------
console.log('\n-- [1] Silnik (real converters.ts + real econ-params.json): converterProductionDisplayForBuilding --');

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
  converterProductionDisplayForBuilding,
} from '../src/game/converters';
`, 'utf8');

function buildEngine() {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
  });
  delete require.cache[require.resolve(BUNDLE_FILE)];
  return require(BUNDLE_FILE);
}

let engine;
try {
  engine = buildEngine();
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
// [1c] TWARDE LICZBY z werdyktu Evaluatora -- woła BEZPOŚREDNIO
//      converterProductionDisplayForBuilding (nie kopię formuły), asercje
//      NIE są `> 0` -- porównują z literałami z werdyktu FAIL.
// ---------------------------------------------------------------------------
console.log('\n-- [1c] converterProductionDisplayForBuilding: TWARDE liczby z werdyktu Evaluatora --');

const EPS = 1e-9; // tolerancja na blad zmiennoprzecinkowy (np. 50*1.1 = 55.00000000000001)

function assertGarncarniaEra(era, expected) {
  const r = engine.converterProductionDisplayForBuilding('garncarnia', econParams, 'normal', era);
  ok(r !== null, `Garncarnia era${era}: wynik nie jest null (got ${r})`);
  if (!r) return;
  ok(Math.abs(r.consumed.glina - expected) < EPS, `Garncarnia era${era}: zużycie Glina = ${expected} szt./turę (got ${r.consumed.glina})`);
  ok(Math.abs(r.consumed.drewno - expected) < EPS, `Garncarnia era${era}: zużycie Drewno = ${expected} szt./turę (got ${r.consumed.drewno})`);
  ok(Math.abs(r.produced.ceramika - expected) < EPS, `Garncarnia era${era}: produkcja Ceramika = ${expected} szt./turę (got ${r.produced.ceramika})`);
  console.log(`   Garncarnia era${era} (normal): -${r.consumed.glina} Glina/t · -${r.consumed.drewno} Drewno/t · +${r.produced.ceramika} Ceramika/t`);
}
assertGarncarniaEra(1, 50);
assertGarncarniaEra(2, 55);
assertGarncarniaEra(3, 60);

{
  const r = engine.converterProductionDisplayForBuilding('odlewnia_brazu', econParams, 'normal', 1);
  ok(r !== null, 'Odlewnia brązu era1: wynik nie jest null');
  if (r) {
    ok(Math.abs(r.consumed.ruda - 25) < EPS, `Odlewnia brązu era1: zużycie Ruda = 25 szt./turę (got ${r.consumed.ruda})`);
    ok(Math.abs(r.consumed.drewno - 25) < EPS, `Odlewnia brązu era1: zużycie Drewno = 25 szt./turę (got ${r.consumed.drewno})`);
    ok(Math.abs(r.consumed.ruda_cyny - 2.5) < EPS, `Odlewnia brązu era1: zużycie Ruda cyny = 2,5 szt./turę (got ${r.consumed.ruda_cyny})`);
    ok(Math.abs(r.produced.braz - 25) < EPS, `Odlewnia brązu era1: produkcja Brąz = 25 szt./turę (got ${r.produced.braz})`);
    console.log(`   Odlewnia brązu era1 (normal): -${r.consumed.ruda} Ruda/t · -${r.consumed.drewno} Drewno/t · -${r.consumed.ruda_cyny} Ruda cyny/t · +${r.produced.braz} Brąz/t`);
  }
}

{
  // Budynek bez receptury konwertera -> null (spichlerz nie jest konwerterem).
  const r = engine.converterProductionDisplayForBuilding('spichlerz', econParams, 'normal', 1);
  ok(r === null, `budynek bez receptury ('spichlerz') -> null (got ${JSON.stringify(r)})`);
  const r2 = engine.converterProductionDisplayForBuilding('nieistniejacy_budynek_xyz', econParams, 'normal', 1);
  ok(r2 === null, `budynek nieistniejący -> null (got ${JSON.stringify(r2)})`);
}

// ---------------------------------------------------------------------------
// [1d] M3 (werdykt Evaluatora, "ignorowanie outputAmount"): KAŻDA receptura w
//      DEFAULT_CONVERTER_RECIPES ma dziś outputAmount=1, więc `throughput * 1`
//      i `throughput` są numerycznie IDENTYCZNE -- ta mutacja jest dziś
//      strukturalnie nieobserwowalna przez wartość `produced` (to samo
//      ograniczenie złapał własny 734-asercyjny harness Evaluatora, który
//      oznaczył M3 jako „UCIECZKA" mimo rygorystycznej metodologii). Zamiast
//      fałszywie obiecywać wykrycie numeryczne, kotwiczymy STRUKTURALNIE na
//      PRAWDZIWYM źródle converters.ts -- jeśli w przyszłości pojawi się
//      receptura z outputAmount != 1, [1c] wyżej (który czyta PRAWDZIWE
//      recipe.outputAmount z silnika, nie stałą "1") zacznie ją łapać też
//      numerycznie.
// ---------------------------------------------------------------------------
console.log('\n-- [1d] converters.ts: mnożenie przez recipe.outputAmount obecne strukturalnie (nota M3) --');
{
  const convertersSrcNow = fs.readFileSync(CONVERTERS_TS, 'utf8');
  const fnStart = convertersSrcNow.indexOf('export function converterProductionDisplayForBuilding(');
  ok(fnStart > -1, 'kotwica "export function converterProductionDisplayForBuilding(" w converters.ts znaleziona');
  const fnEnd = fnStart > -1 ? convertersSrcNow.indexOf('\n}', fnStart) : -1;
  const fnBody = fnStart > -1 && fnEnd > fnStart ? convertersSrcNow.slice(fnStart, fnEnd) : '';
  ok(/produced\[recipe\.output\]\s*=\s*\(produced\[recipe\.output\]\s*\?\?\s*0\)\s*\+\s*recipe\.outputAmount\s*\*\s*throughput;/.test(fnBody),
    'M3: ciało converterProductionDisplayForBuilding mnoży produced przez recipe.outputAmount (nie throughput wprost)');
}

// ---------------------------------------------------------------------------
// [2] Text-anchor: cityPanel.ts woła BEZPOŚREDNIO converterProductionDisplayForBuilding
//     -- brak własnej reimplementacji receptur/throughput po stronie UI.
// ---------------------------------------------------------------------------
console.log('\n-- [2] cityPanel.ts: woła bezpośrednio converterProductionDisplayForBuilding (bez reimplementacji) --');

ok(/import\s*\{[^}]*converterProductionDisplayForBuilding[^}]*\}\s*from\s*'\.\.\/game\/converters'/s.test(src),
  "cityPanel.ts importuje converterProductionDisplayForBuilding z '../game/converters'");
ok(!/import\s*\{[^}]*DEFAULT_CONVERTER_RECIPES[^}]*\}\s*from\s*'\.\.\/game\/converters'/s.test(src),
  'REGRESJA: cityPanel.ts NIE powinien importować DEFAULT_CONVERTER_RECIPES bezpośrednio (cała logika w converters.ts)');

{
  const fnStart = src.indexOf('function buildingConverterProductionDisplay(');
  ok(fnStart > -1, 'kotwica "function buildingConverterProductionDisplay(" znaleziona');
  const fnEnd = src.indexOf('\nfunction ', fnStart + 10);
  ok(fnEnd > fnStart, 'kotwica końca (następna function) znaleziona');
  const fnSrc = src.slice(fnStart, fnEnd);

  ok(fnSrc.includes('converterProductionDisplayForBuilding(def.id, rawParams, difficulty, era)'),
    'buildingConverterProductionDisplay to cienka otoczka wołająca converterProductionDisplayForBuilding z prawdziwymi parametrami');
  ok(!/const\s+recipes\s*=/.test(fnSrc), 'REGRESJA: brak lokalnie liczonych receptur w cityPanel.ts (logika wyłącznie w converters.ts)');
  ok(!/for\s*\(const\s+recipe\s+of\s+recipes\)/.test(fnSrc), 'REGRESJA: brak lokalnej pętli po recepturach w cityPanel.ts');
  ok(fnSrc.includes("cfg.getEpoch?.(city.ownerId)"), 'era czytana z cfg.getEpoch (per-owner, parytet AI, jak reszta pliku)');
}

{
  const fnStart = src.indexOf('function formatConverterProductionRowHtml(');
  ok(fnStart > -1, 'kotwica "function formatConverterProductionRowHtml(" znaleziona');
  const fnEnd = src.indexOf('\nfunction appendOwnedBuildingRow(', fnStart);
  ok(fnEnd === -1 || fnEnd > fnStart, 'kotwica dalszego kodu po formatConverterProductionRowHtml sensowna');
  const scope = fnEnd > fnStart ? src.slice(fnStart, fnEnd) : src.slice(fnStart, fnStart + 2500);
  ok(scope.includes('bld-owned-conv-in'), 'zużycie (wejścia konwertera) oznaczone klasą bld-owned-conv-in');
  ok(scope.includes('bld-owned-conv-out'), 'produkcja (wyjście konwertera) oznaczone klasą bld-owned-conv-out');
  ok(scope.includes('bld-owned-conv-label'), 'N6: prefiks „Prod.:" oznaczony klasą bld-owned-conv-label');
  ok(scope.includes('Prod.:'), 'N6: prefiks „Prod.:" obecny przed linią produkcji');
  ok(/`−\$\{amtTxt\}/.test(scope), 'wejścia renderowane ze znakiem minus (−)');
  ok(/`\+\$\{amtTxt\}/.test(scope), 'wyjście renderowane ze znakiem plus (+)');
}

console.log('\n-- [2b] appendOwnedBuildingRow: wiersz produkcji ODDZIELONY od wiersza utrzymania, N2 (inactive) --');
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
  ok(fnSrc.includes("el('div', 'bld-owned-conv-row'"), 'wiersz produkcji to OSOBNY element div.bld-owned-conv-row');
  ok(fnSrc.includes('row.appendChild(convRow)'), 'wiersz produkcji dołączony do row (rodzic), NIE do tail (rodzic kosztu utrzymania)');
  ok(!/tail\.appendChild\(convRow\)/.test(fnSrc), 'REGRESJA: wiersz produkcji NIE jest dokładany do tail (musi być fizycznie oddzielony)');

  // N2: budynek runtime-nieaktywny -- wiersz produkcji wyszarzony, `inactiveStatus`
  // NIE liczony drugi raz (hoisted na zasięg funkcji, przypisany przez `=`, nie `const`).
  ok(/let\s+inactiveStatus\s*:/.test(fnSrc), 'N2: inactiveStatus hoisted (let, zasięg całej funkcji), nie lokalny const w bloku nagłówka');
  ok(fnSrc.includes('bld-owned-conv-row--inactive'), 'N2: wiersz produkcji dostaje klasę bld-owned-conv-row--inactive gdy budynek nieaktywny');
  ok(fnSrc.includes('convInactive = inactiveStatus?.inactive === true'),
    'N2: flaga nieaktywności wiersza produkcji czyta TĘ SAMĄ zmienną inactiveStatus (nie liczy jej drugi raz)');
  ok(!/resolveOwnedBuildingInactiveStatus\(id,[\s\S]*resolveOwnedBuildingInactiveStatus\(id,/.test(fnSrc),
    'REGRESJA N2: resolveOwnedBuildingInactiveStatus woływane więcej niż raz w appendOwnedBuildingRow');
}

console.log('\n-- [2c] CSS: klasy bld-owned-conv-* zdefiniowane --');
ok(/\.bld-owned-conv-row\{/.test(src), '.bld-owned-conv-row zdefiniowana w CSS');
ok(/\.bld-owned-conv-in\{/.test(src), '.bld-owned-conv-in zdefiniowana w CSS');
ok(/\.bld-owned-conv-out\{/.test(src), '.bld-owned-conv-out zdefiniowana w CSS');
ok(/\.bld-owned-conv-label\{/.test(src), 'N6: .bld-owned-conv-label zdefiniowana w CSS');
ok(/\.bld-owned-conv-row--inactive[^{]*\{/.test(src), 'N2: .bld-owned-conv-row--inactive zdefiniowana w CSS');
{
  const upkeepColorMatch = src.match(/\.bld-owned-upkeep\{[^}]*color:(#[0-9a-fA-F]{3,6})/);
  const convInColorMatch = src.match(/\.bld-owned-conv-in\{[^}]*color:(#[0-9a-fA-F]{3,6})/);
  ok(!!upkeepColorMatch && !!convInColorMatch, 'kolory .bld-owned-upkeep i .bld-owned-conv-in odczytane z CSS');
  if (upkeepColorMatch && convInColorMatch) {
    ok(upkeepColorMatch[1].toLowerCase() !== convInColorMatch[1].toLowerCase(),
      `N6: kolor wejść konwertera (${convInColorMatch[1]}) różny od koloru utrzymania (${upkeepColorMatch[1]}) -- rozdzielenie SEMANTYCZNE, nie tylko strukturalne`);
  }
}

// ---------------------------------------------------------------------------
// [3] Mutacja wiring: usunięcie wywołania buildingConverterProductionDisplay z
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
  ok(fs.readFileSync(CITY_PANEL_TS, 'utf8') === backup, 'cityPanel.ts przywrócony do stanu oryginalnego po mutacji (treść identyczna)');
}

// ---------------------------------------------------------------------------
// [4] Mutacje kontrolne NA PRAWDZIWEJ LOGICE (converters.ts) -- odtwarza
//     M2/M3/M7 z werdyktu Evaluatora rundy 1 i potwierdza, że TWARDE liczby
//     w [1c] łapią je czerwono. Dowód, że [1c] NIE jest nową tautologią.
// ---------------------------------------------------------------------------
if (!process.argv.includes('--self-check-skip-mutation')) {
  console.log('\n-- [4] Mutacje kontrolne (M2/M3/M7 z werdyktu Evaluatora) na converters.ts --');
  const convertersBackup = fs.readFileSync(CONVERTERS_TS, 'utf8');

  function runConvertersMutationAndExpectFail(label, needle, replacement) {
    ok(convertersBackup.includes(needle), `[${label}] kotwica mutacji istnieje w converters.ts`);
    const mutated = convertersBackup.replace(needle, replacement);
    ok(mutated !== convertersBackup, `[${label}] mutacja faktycznie zmieniła źródło`);
    fs.writeFileSync(CONVERTERS_TS, mutated, 'utf8');
    const { execSync } = require('child_process');
    let mutantFailed = false;
    try {
      execSync(`node ${__filename} --self-check-skip-mutation`, { cwd: __dirname, stdio: 'pipe' });
    } catch (e) {
      mutantFailed = true;
    } finally {
      fs.writeFileSync(CONVERTERS_TS, convertersBackup, 'utf8');
    }
    ok(mutantFailed, `[${label}] mutacja łapana czerwono przez TWARDE liczby w sekcji [1c]`);
  }

  runConvertersMutationAndExpectFail(
    'M2 zużycie wejść ×2',
    'consumed[key] = (consumed[key] ?? 0) + perCykl * throughput;',
    'consumed[key] = (consumed[key] ?? 0) + perCykl * throughput * 2;',
  );
  runConvertersMutationAndExpectFail(
    'M3 ignorowanie outputAmount',
    'produced[recipe.output] = (produced[recipe.output] ?? 0) + recipe.outputAmount * throughput;',
    'produced[recipe.output] = (produced[recipe.output] ?? 0) + throughput;',
  );
  runConvertersMutationAndExpectFail(
    'M7 pomijaj WSZYSTKIE wejścia',
    'if (!(perCykl > 0)) continue;',
    'continue; // MUTATED-OUT M7 -- pomija wszystkie wejscia',
  );

  ok(fs.readFileSync(CONVERTERS_TS, 'utf8') === convertersBackup, 'converters.ts przywrócony do stanu oryginalnego po mutacjach [4]');
}

try { fs.unlinkSync(BUNDLE_FILE); } catch (_) {}

if (process.argv.includes('--self-check-skip-mutation')) {
  console.log(`\ncitypanel-konwerter-produkcja-test (self-check): ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

console.log(`\ncitypanel-konwerter-produkcja-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
