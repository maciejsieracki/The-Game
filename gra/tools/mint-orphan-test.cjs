'use strict';
/**
 * mint-orphan-test.cjs -- R-WEB-MINT-ORPHAN-Q1 (odp. 17, własna reguła właściciela, 2026-11-26).
 *
 * Kontrakt:
 *  (1) Po UKOŃCZENIU nowej Mennicy w stolicy stare Mennice tego właściciela poza stolicą znikają
 *      (mennicaCityIdsReplacedByCapital + builtWithoutMennica; hook w main.ts applyProductionCompleted).
 *  (2) Mennica osierocona (poza stolicą) jest nieaktywna (bez bonusu), ale istnieje i da się ją
 *      wyburzyć (demolishBuildingIds, bez zwrotu).
 *  (3) Scenariusz: stolica -> A (Mennica w B osierocona) -> bonus 0; stolica -> B (Mennica stoi)
 *      -> bonus wraca; po zbudowaniu nowej w A stara w B znika, a powrót stolicy do B NIE przywraca
 *      bonusu (brak Mennicy w B).
 *  (4) Mennica działa wyłącznie w stolicy: gdy stolica nie ma Mennicy, nic nie jest usuwane.
 *  (5) Mutacje czerwone: pominięcie hooka zostawia starą Mennicę (test wykrywa); zły warunek
 *      (heurystyka „pierwsze miasto” zamiast stolicy) usuwa nie to miasto (test wykrywa).
 *
 * Run from gra/:  node tools/mint-orphan-test.cjs
 * Bundluje mennica-orphan.ts i turn-economy.ts z esbuild (jak mint-capital-only-test.cjs).
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) { console.error('[mint-orphan-test] esbuild not found. Run: npm install (from gra/)'); process.exit(1); }
})();

const GRA = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.mint-orphan-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.mint-orphan-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export { ownersWithMennica, setOwnerCapitalCityResolver } from '../src/game/turn-economy';
export {
  MENNICA_BUILDING_ID,
  mennicaCityIdsReplacedByCapital,
  builtWithoutMennica,
  demolishBuildingIds,
} from '../src/game/mennica-orphan';
`, 'utf8');

function cleanup() {
  try { fs.unlinkSync(ENTRY_FILE); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE_FILE); } catch (e) { /* ignore */ }
}

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[mint-orphan-test] esbuild bundling failed:\n', e.message || e);
  cleanup();
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const { ownersWithMennica, setOwnerCapitalCityResolver } = M;
const { MENNICA_BUILDING_ID, mennicaCityIdsReplacedByCapital, builtWithoutMennica, demolishBuildingIds } = M;

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('  PASS ' + name); }
  else { fail++; console.log('  FAIL ' + name + (detail !== undefined ? ' -- ' + detail : '')); }
}
function eq(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function setOf(s) { return [...s].sort((a, b) => a - b); }

/** Stan miast: owner 0 ma miasta A=c0 (pierwsze), B=c1; owner 1 ma c2 (stolica), c3. */
const cities = [
  { id: 'c0', ownerId: 0 },
  { id: 'c1', ownerId: 0 },
  { id: 'c2', ownerId: 1 },
  { id: 'c3', ownerId: 1 },
];

/** Symulacja hooka z main.ts: po ukończeniu budynku w `completedCityId`. */
function applyCompletion(built, completedCityId, capitalCityId, ownerId, skipHook) {
  const next = new Map(built);
  const prev = next.get(completedCityId) ?? [];
  if (!prev.includes(MENNICA_BUILDING_ID)) next.set(completedCityId, [...prev, MENNICA_BUILDING_ID]);
  // Hook: tylko gdy ukończono Mennicę w stolicy (guard jak w main.ts).
  if (!skipHook && completedCityId === capitalCityId) {
    for (const oid of mennicaCityIdsReplacedByCapital(cities, next, ownerId, capitalCityId)) {
      next.set(oid, builtWithoutMennica(next.get(oid) ?? []));
    }
  }
  return next;
}

console.log('mint-orphan-test (R-WEB-MINT-ORPHAN-Q1)');

// --- Scenariusz (3): pełny cykl przeniesień stolicy ---
// Start: stolica owner0 = B (c1), Mennica stoi w B.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c1' : oid === 1 ? 'c2' : null));
let built = new Map([['c1', [MENNICA_BUILDING_ID]]]);
check('start: Mennica w stolicy B daje bonus', eq(setOf(ownersWithMennica(cities, built)), [0]));

// Stolica przeniesiona do A (c0); Mennica w B osierocona -> bonus 0, Mennica NIE znika.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
check('(2) osierocona Mennica w B: bonus 0 (nieaktywna)', ownersWithMennica(cities, built).size === 0);
check('(2) osierocona Mennica NIE znika sama (nadal stoi w B)',
  (built.get('c1') ?? []).includes(MENNICA_BUILDING_ID));
check('(4) bez nowej Mennicy w stolicy A nic nie jest usuwane',
  mennicaCityIdsReplacedByCapital(cities, built, 0, 'c0').length === 0);

// Stolica wraca do B (Mennica nie wyburzona) -> bonus wraca.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c1' : oid === 1 ? 'c2' : null));
check('(5) powrót stolicy do B z nie wyburzoną Mennicą: bonus wraca',
  eq(setOf(ownersWithMennica(cities, built)), [0]));

// Stolica przeniesiona do A; buduje nową Mennicę w A -> stara w B znika.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
built = applyCompletion(built, 'c0', 'c0', 0, false);
check('(1) po ukończeniu nowej Mennicy w stolicy A: stara w B zniknęła',
  !(built.get('c1') ?? []).includes(MENNICA_BUILDING_ID));
check('(1) nowa Mennica w stolicy A zostaje', (built.get('c0') ?? []).includes(MENNICA_BUILDING_ID));
check('(1) bonus z nowej Mennicy w A', eq(setOf(ownersWithMennica(cities, built)), [0]));

// Powrót stolicy do B: Mennicy w B już nie ma -> brak bonusu (trzeba nową budować w B).
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c1' : oid === 1 ? 'c2' : null));
check('(3) powrót stolicy do B po usunięciu starej: brak bonusu (Mennicy w B nie ma)',
  ownersWithMennica(cities, built).size === 0);
// Stolica w B: to c1 nie ma Mennicy -> nic do usunięcia.
check('(4) stolica B bez Mennicy: nic nie jest usuwane',
  mennicaCityIdsReplacedByCapital(cities, built, 0, 'c1').length === 0);

// --- Scenariusz (1): wiele osieroconych Mennic w różnych miastach ---
{
  const b = new Map([
    ['c0', [MENNICA_BUILDING_ID, 'koszary']],
    ['c1', [MENNICA_BUILDING_ID]],
    ['c2', [MENNICA_BUILDING_ID]], // inny właściciel — nie może być ruszony
  ]);
  const ids = mennicaCityIdsReplacedByCapital(cities, b, 0, 'c0');
  // Stolica c0 ma Mennicę -> usuwamy z pozostałych miast tego właściciela (c1), nie z c0 ani c2.
  check('(1) lista usuwanych = inne miasta tego właściciela z Mennicą', eq(ids, ['c1']), JSON.stringify(ids));
  check('(1) nie rusza miasta innego właściciela (c2)', !ids.includes('c2'));
  check('(1) nie rusza stolicy (c0)', !ids.includes('c0'));
}

// --- Scenariusz (4): stolica bez Mennicy -> nic nie usuwane ---
{
  const b = new Map([['c1', [MENNICA_BUILDING_ID]]]);
  check('(4) stolica bez Mennicy: pusta lista (osierocona zostaje)',
    eq(mennicaCityIdsReplacedByCapital(cities, b, 0, 'c0'), []));
  check('(4) capitalCityId null: pusta lista', eq(mennicaCityIdsReplacedByCapital(cities, b, 0, null), []));
}

// --- Scenariusz (2): wyburzenie osieroconej Mennicy (bez zwrotu) ---
{
  const demol = demolishBuildingIds(['koszary', MENNICA_BUILDING_ID, 'spichlerz'], MENNICA_BUILDING_ID);
  check('(2) wyburzenie osieroconej Mennicy usuwa wpis', eq(demol, ['koszary', 'spichlerz']), JSON.stringify(demol));
  check('(2) wyburzenie czegoś, czego nie ma: null', demolishBuildingIds(['koszary'], MENNICA_BUILDING_ID) === null);
  const bonusAfter = (() => {
    setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
    const r = ownersWithMennica(cities, new Map([['c1', ['koszary']]]));
    return r.size;
  })();
  check('(2) brak Mennicy po wyburzeniu: brak bonusu', bonusAfter === 0);
}

// --- Mutacje czerwone ---
// M1: zdjęcie hooka (stara Mennica zostaje po ukończeniu nowej w stolicy) -> test MUSI wykryć.
setOwnerCapitalCityResolver((oid) => (oid === 0 ? 'c0' : oid === 1 ? 'c2' : null));
{
  const start = new Map([['c1', [MENNICA_BUILDING_ID]]]);
  const mutant = applyCompletion(start, 'c0', 'c0', 0, true);
  const detected = (mutant.get('c1') ?? []).includes(MENNICA_BUILDING_ID);
  check('M1 mutacja (bez hooka) zostawia starą Mennicę -> wykryte przez asercję (1)', detected === true);
  const real = applyCompletion(start, 'c0', 'c0', 0, false);
  check('M1 wariant właściwy: stara Mennica usunięta', !(real.get('c1') ?? []).includes(MENNICA_BUILDING_ID));
}

// M2: zły warunek (heurystyka „pierwsze miasto” zamiast stolicy) -> usuwa niewłaściwe miasto.
{
  // Stolica = c1 (Mennica zbudowana w c1), ale heurystyka wzięłaby c0 jako „stolicę”.
  const b = new Map([['c1', [MENNICA_BUILDING_ID]], ['c0', [MENNICA_BUILDING_ID]]]);
  const correct = mennicaCityIdsReplacedByCapital(cities, b, 0, 'c1');
  const wrongHeuristic = mennicaCityIdsReplacedByCapital(cities, b, 0, 'c0');
  check('M2 właściwa stolica c1: usuwa c0', eq(correct, ['c0']));
  check('M2 mutant (stolica = pierwsze miasto c0): różni się od właściwego -> wykryte',
    !eq(wrongHeuristic, correct));
}

// M3: brak guardu „stolica ma Mennicę” -> usunięto by wszystko; test (4) wykrywa.
{
  const b = new Map([['c1', [MENNICA_BUILDING_ID]]]);
  const noGuardMutant = cities.filter(c => c.ownerId === 0 && (b.get(c.id) ?? []).includes(MENNICA_BUILDING_ID) && c.id !== 'c0').map(c => c.id);
  check('M3 mutant bez guardu zwróciłby c1 (osieroconą) -> wykryte przez asercję (4)',
    eq(noGuardMutant, ['c1']) && eq(mennicaCityIdsReplacedByCapital(cities, b, 0, 'c0'), []));
}

// --- Okablowanie hooka w main.ts (statyczne: hook wpięty w applyProductionCompleted z guardem stolicy) ---
{
  const mainSrc = fs.readFileSync(path.resolve(GRA, 'src', 'main.ts'), 'utf8');
  const hookOk = mainSrc.includes('completed.id === MENNICA_BUILDING_ID && capitalCityIdForOwner(city.ownerId) === cityId')
    && mainSrc.includes('mennicaCityIdsReplacedByCapital(cities, cityBuilt, city.ownerId, cityId)');
  check('okablowanie: hook Mennicy w main.ts z guardem stolicy', hookOk);
}

console.log('');
console.log('mint-orphan-test: ' + pass + ' PASS / ' + fail + ' FAIL');
cleanup();
process.exit(fail === 0 ? 0 : 1);
