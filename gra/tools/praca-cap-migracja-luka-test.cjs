'use strict';
/**
 * praca-cap-migracja-luka-test.cjs — P-PRACA-CAP-MIGRACJA-LUKA-Q1.
 *
 * PILNUJE JEDNEJ RZECZY: cap „ulepszenia ≤ 50% Pracy" (czyli budynki ≥ 50%,
 * `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`) obowiązuje po KAŻDEJ ścieżce wczytania zapisu,
 * niezależnie od kolejności wywołań w `main.ts`.
 *
 * DLACZEGO ISTNIEJE. Ten obszar wracał już jako REGRES2 i REGRES3
 * (`P-PRACA-IMPERIUM-PULA-NIE-AKUMULUJE-REGRES2/3-Q1`) i był ruszany w falach 292, 293,
 * 301, 302, 310, 317, 318, 319 — za każdym razem zamykany jako PASS. Wracał, bo naprawiano
 * OBJAW (pojedynczy clamp / etykietę), a nie zabezpieczano KONTRAKTU testem. Ten plik jest
 * tym brakującym zabezpieczeniem.
 *
 * CO KONKRETNIE BYŁO NIE TAK. `migratePodzialPracyOnLoad()` zostawiała `city.podzialPracy`
 * NIEPRZYCIĘTYM w dwóch przypadkach:
 *   (1) gałąź `savedDefaults?.length` (nowoczesny zapis z własnymi domyślnymi imperium)
 *       normalizowała WYŁĄCZNIE `ownerDefaults` — pętla po miastach żyje w gałęzi `else`,
 *       więc dla takiego zapisu nie wykonywała się w ogóle;
 *   (2) `if (city.podzialPracyOverride !== undefined) continue;` pomijało miasta z już
 *       ustawioną flagą override razem z normalizacją.
 * Dla GRACZA nie było to widoczne tylko dlatego, że `ensureCitySaveDefaults()` biegnie na
 * ścieżce load wcześniej, a `resolveCityPodzialPracy()` normalizuje jeszcze raz przy każdym
 * odczycie. To było maskowanie przez kolejność wywołań, nie gwarancja.
 *
 * DOWÓD NIETAUTOLOGICZNOŚCI: test buduje DRUGI bundel, w którym poprawka jest wycięta ze
 * źródła (jedna pętla), i wymaga, żeby scenariusze A i B tam FAKTYCZNIE padły. Bez tego
 * test „przechodziłby" nawet gdyby niczego nie pilnował.
 *
 * Run from gra/:  node tools/praca-cap-migracja-luka-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[praca-cap-migracja-luka-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = process.env.UPP_SRC_DIR || path.resolve(GRA_ROOT, 'src');
const TARGET_FILE = path.resolve(SRC, 'game/empire-city-defaults.ts');

// Dokładnie ta pętla jest poprawką P-PRACA-CAP-MIGRACJA-LUKA-Q1. Wycinamy JĄ JEDNĄ,
// nic innego — mutacja ma być pojedyncza i punktowa (wzorzec macierzy ablacyjnej serii).
const FIX_LOOP = `  for (const city of cities) {
    if (city.podzialPracy) {
      city.podzialPracy = normalizePodzialPracy(city.podzialPracy);
    }
  }
`;

/**
 * Buduje bundel z podanego katalogu źródeł. Dla wariantu zmutowanego kopiujemy CAŁE
 * `src` do katalogu tymczasowego i wycinamy pętlę poprawki w kopii — `esbuild.buildSync()`
 * nie przyjmuje pluginów, więc podmiana treści „w locie" odpada, a mutowanie oryginału
 * byłoby nieakceptowalne (test nie może dotykać drzewa roboczego).
 */
function buildBundle(outName, stripFix) {
  let srcDir = SRC;

  if (stripFix) {
    // MUSI leżeć na tej samej głębokości co `gra/src`, inaczej importy w rodzaju
    // `../../data/miasto-params.json` (z `game/`) nie rozwiążą się do `gra/data`.
    const tmpSrc = path.resolve(GRA_ROOT, `.${outName}-src`);
    fs.rmSync(tmpSrc, { recursive: true, force: true });
    fs.cpSync(SRC, tmpSrc, { recursive: true });
    const mutTarget = path.resolve(tmpSrc, 'game/empire-city-defaults.ts');
    const orig = fs.readFileSync(mutTarget, 'utf8');
    if (!orig.includes(FIX_LOOP)) {
      console.error('[praca-cap-migracja-luka-test] BŁĄD HARNESSU: nie znalazłem pętli poprawki '
        + 'w empire-city-defaults.ts — test nie może udowodnić nietautologiczności. '
        + 'Jeśli poprawka była refaktorowana, zaktualizuj stałą FIX_LOOP w tym pliku.');
      process.exit(2);
    }
    // Usuwamy TYLKO pierwsze wystąpienie — druga, podobna pętla niżej
    // (uzupełnianie ownerDefaults) musi zostać nietknięta.
    fs.writeFileSync(mutTarget, orig.replace(FIX_LOOP, ''), 'utf8');
    srcDir = tmpSrc;
  }

  const entryFile = path.resolve(__dirname, `.${outName}-entry.ts`);
  const bundleFile = path.resolve(__dirname, `.${outName}-bundle.cjs`);
  fs.writeFileSync(entryFile, `
export { migratePodzialPracyOnLoad, resolveCityPodzialPracy } from ${JSON.stringify(srcDir + '/game/empire-city-defaults')};
export { MIN_PODZIAL_PRACY_BUDYNKI_PERCENT, DEFAULT_PODZIAL_PRACY } from ${JSON.stringify(srcDir + '/game/cities')};
`, 'utf8');

  esbuild.buildSync({
    entryPoints: [entryFile],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: bundleFile,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
    loader: { '.json': 'json' },
  });
  return require(bundleFile);
}

const real = buildBundle('praca-cap-migracja-luka-test', false);
const mutated = buildBundle('praca-cap-migracja-luka-test-MUT', true);

// Kopia źródeł spełniła swoją rolę w chwili zbundlowania — kasujemy ją od razu, żeby
// test nie zostawiał po sobie kilkumegabajtowego katalogu w drzewie roboczym.
fs.rmSync(path.resolve(GRA_ROOT, '.praca-cap-migracja-luka-test-MUT-src'), { recursive: true, force: true });

const MIN_B = real.MIN_PODZIAL_PRACY_BUDYNKI_PERCENT;

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

function city(over) {
  return { id: 'c1', q: 0, r: 0, ownerId: 0, ludnosc: 1, fokus: 'zrownowazone', ...over };
}

/** Uruchamia scenariusz na podanym module; zwraca wynikowe procentBudynki miasta. */
function runScenarioA(mod) {
  // Zapis NOWOCZESNY: niesie własne domyślne imperium (savedDefaults), a miasto ma
  // zapisany podział 0% budynki / 100% ulepszenia — stan spoza dozwolonego zakresu.
  const c = city({ podzialPracy: { procentBudynki: 0 } });
  const defs = new Map();
  mod.migratePodzialPracyOnLoad([c], defs, [[0, { procentBudynki: 70 }]]);
  return c.podzialPracy.procentBudynki;
}

function runScenarioB(mod) {
  // Miasto z JUŻ ustawioną flagą override — stara gałąź `continue` pomijała je razem
  // z normalizacją.
  const c = city({ podzialPracy: { procentBudynki: 10 }, podzialPracyOverride: true });
  const defs = new Map();
  mod.migratePodzialPracyOnLoad([c], defs, undefined);
  return c.podzialPracy.procentBudynki;
}

console.log('A. Zapis nowoczesny (savedDefaults): podział miasta też musi być przycięty');
{
  const got = runScenarioA(real);
  eq(got, MIN_B, 'miasto z zapisanym 0% budynków wychodzi z migracji na minimum (50%)');
  assert(got >= MIN_B, 'ulepszenia nie mogą przekroczyć 50% po wczytaniu');
}

console.log('B. Miasto z ustawioną flagą override: nie wolno go pominąć przy normalizacji');
{
  const got = runScenarioB(real);
  eq(got, MIN_B, 'miasto z override 10% budynków wychodzi z migracji na minimum (50%)');
}

console.log('C. Wartości LEGALNE zostają nietknięte (poprawka nie nadpisuje ustawień gracza)');
{
  const c = city({ podzialPracy: { procentBudynki: 70 }, podzialPracyOverride: true });
  const defs = new Map();
  real.migratePodzialPracyOnLoad([c], defs, undefined);
  eq(c.podzialPracy.procentBudynki, 70, 'legalne 70% budynków przechodzi bez zmiany');

  const c2 = city({ podzialPracy: { procentBudynki: 100 }, podzialPracyOverride: true });
  real.migratePodzialPracyOnLoad([c2], new Map(), undefined);
  eq(c2.podzialPracy.procentBudynki, 100, 'skrajne legalne 100% budynków przechodzi bez zmiany');
}

console.log('D. Domyślne imperium z zapisu też są przycinane');
{
  const defs = new Map();
  real.migratePodzialPracyOnLoad([city({})], defs, [[0, { procentBudynki: 0 }]]);
  eq(defs.get(0).procentBudynki, MIN_B, 'ownerDefault 0% budynków wychodzi na minimum (50%)');
}

console.log('E. Odczyt efektywny nigdy nie zwraca wartości spoza zakresu');
{
  const c = city({ podzialPracy: { procentBudynki: 0 }, podzialPracyOverride: true });
  const eff = real.resolveCityPodzialPracy(c, undefined, undefined);
  assert(eff.procentBudynki >= MIN_B, 'resolveCityPodzialPracy trzyma cap niezależnie od migracji');
}

console.log('M. DOWÓD NIETAUTOLOGICZNOŚCI: bundel z WYCIĘTĄ poprawką musi paść na A i B');
{
  const mutA = runScenarioA(mutated);
  const mutB = runScenarioB(mutated);
  assert(mutA !== MIN_B,
    `(M-A) bez poprawki scenariusz A MUSI dawać wartość spoza zakresu — dostałem ${mutA}, `
    + 'czyli asercja A nie pilnuje niczego');
  eq(mutA, 0, '(M-A) bez poprawki miasto zachowuje zapisane 0% budynków (dokładnie ten bug)');
  assert(mutB !== MIN_B,
    `(M-B) bez poprawki scenariusz B MUSI dawać wartość spoza zakresu — dostałem ${mutB}`);
  eq(mutB, 10, '(M-B) bez poprawki miasto z override zachowuje zapisane 10% budynków');
}

console.log('');
console.log(`praca-cap-migracja-luka-test: ${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
