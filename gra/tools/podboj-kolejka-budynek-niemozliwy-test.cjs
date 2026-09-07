'use strict';
/**
 * podboj-kolejka-budynek-niemozliwy-test.cjs — P-PODBOJ-KOLEJKA-BUDYNEK-NIEMOZLIWY-Q1.
 *
 * Kontrakt (ECHO właściciela): „Jeśli zajmujemy miasto-państwo innej cywilizacji, mogła
 * ona budować pałac [...] Gdy przejmuję to miasto, ona nadal buduje pałac, który mógłby być
 * budowany przeze mnie, ale nie powinien. Cała nadwyżka powinna trafić do głównej puli,
 * ponieważ w cywilizacji może być tylko jeden pałac." Zakres: WSZYSTKIE budynki
 * `lokalizacja:'stolica'` (mennica, palac, palac_ii, palac_iii), OBA miejsca przejęcia
 * miasta (podbój bojowy `applyCityCaptureToMap`, kapitulacja głodowa `resolveSiegeSurrender`),
 * zwrot Pracy do puli ZDOBYWCY (nie starego właściciela — świadomie odwrotnie niż legacy
 * jednostki w tej samej kolejce, decyzja osobna i wcześniej zatwierdzona).
 *
 * Wzorzec pliku: `road-hook-mainguard-test.cjs` -- wycina PRAWDZIWY tekst dwóch bloków
 * przejęcia miasta ORAZ `sanitizeProductionQueue` z bieżącego main.ts (nie reimplementację),
 * transformuje TS→JS przez esbuild i wykonuje NAPRAWDĘ przez `new Function` z atrapami
 * TYLKO dla wolnych zmiennych domknięcia main.ts (cityProd, data, setOwnerPracaPool,
 * ownerPracaPool, capitalCityIdForOwner, parseWonderProdId/wonderGateOk — cuda nie są w
 * zakresie tego tematu). `sanitizeBuildQueue`/`filterQueue` to PRAWDZIWE eksporty z
 * production.ts (bundlowane przez esbuild), nie atrapy.
 *
 * Uzasadnienie NOWEGO pliku (nie rozszerzenie istniejącego): żadna istniejąca bramka nie
 * wycina tych dwóch konkretnych bloków main.ts; `building-queue-refund-test.cjs` testuje
 * inny temat (zwrot koszt_surowce), nie zwrot Pracy przy przejęciu miasta.
 *
 * Uruchomienie z katalogu gra:  node tools/podboj-kolejka-budynek-niemozliwy-test.cjs
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = (() => {
  try { return require(path.resolve(GRA, 'node_modules', 'esbuild')); }
  catch (e) {
    console.error('[podboj-kolejka-budynek-niemozliwy-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const MAIN_TS = path.join(GRA, 'src', 'main.ts');
const realSrc = fs.readFileSync(MAIN_TS, 'utf8');

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) { passed++; } else { failed++; console.error('FAIL:', msg); } }
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// ---------------------------------------------------------------------------
// Wycinanie tekstu po SYGNATURZE (brace-matching), wzorzec `wytnijFunkcje` z
// road-hook-mainguard-test.cjs -- linie się przesuwają, sygnatury nie.
// ---------------------------------------------------------------------------
function wytnijOdSygnatury(src, sygnatura) {
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

/**
 * Wycina `const <marker> = cityProd.get(city.id);` + następujący `if (...) { ... }`
 * jako jeden blok wykonywalny (wzorzec identyczny co `wytnijOdSygnatury`, ale kotwica
 * to przypisanie zmiennej, nie deklaracja funkcji).
 */
function wytnijBlokPrzejecia(src, constLine) {
  const start = src.indexOf(constLine);
  if (start < 0) return null;
  const ifIdx = src.indexOf('if (', start);
  if (ifIdx < 0) return null;
  const braceStart = src.indexOf('{', ifIdx);
  let depth = 0, i = braceStart;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { return src.slice(start, i + 1); } }
  }
  return null;
}

// ===========================================================================
// §1. STRAŻNIK TEKSTOWY -- regresja na konwencji legacy (oldOwner) NIETKNIĘTA
// ===========================================================================
{
  const oldOwnerHits = (realSrc.match(/setOwnerPracaPool\(oldOwner,\s*ownerPracaPool\(oldOwner\)\s*\+\s*migrated\.refundedPraca\)/g) || []).length;
  eq(oldOwnerHits, 2, '§1: dokładnie 2 wystąpienia setOwnerPracaPool(oldOwner, ...) dla legacy jednostek (main.ts, zero regresji na zatwierdzonej konwencji)');

  const surrenderBlock = wytnijBlokPrzejecia(realSrc, 'const prodSurrender = cityProd.get(city.id);');
  const captureBlock = wytnijBlokPrzejecia(realSrc, 'const prodCapture = cityProd.get(city.id);');
  assert(!!surrenderBlock, '§1: blok kapitulacji głodowej (prodSurrender) znaleziony w main.ts');
  assert(!!captureBlock, '§1: blok podboju bojowego (prodCapture) znaleziony w main.ts');
  if (surrenderBlock) {
    assert(/capitalCityIdForOwner\(newOwner\)/.test(surrenderBlock), '§1: blok kapitulacji sprawdza capitalCityIdForOwner(newOwner)');
    assert(/setOwnerPracaPool\(newOwner,/.test(surrenderBlock), '§1: blok kapitulacji zwraca nadwyżkę do newOwner (zdobywcy)');
  }
  if (captureBlock) {
    assert(/capitalCityIdForOwner\(atkOwner\)/.test(captureBlock), '§1: blok podboju sprawdza capitalCityIdForOwner(atkOwner)');
    assert(/setOwnerPracaPool\(atkOwner,/.test(captureBlock), '§1: blok podboju zwraca nadwyżkę do atkOwner (zdobywcy)');
  }
}

// ===========================================================================
// §2. Prawdziwa produkcja (sanitizeBuildQueue/filterQueue z production.ts, bundle)
// ===========================================================================
const ENTRY = path.resolve(__dirname, '.podboj-kolejka-budynek-entry.ts');
const BUNDLE = path.resolve(__dirname, '.podboj-kolejka-budynek-bundle.cjs');
fs.writeFileSync(ENTRY, `
export { sanitizeBuildQueue, filterQueue } from '../src/game/production';
`, 'utf8');
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  });
} catch (e) {
  console.error('[podboj-kolejka-budynek-niemozliwy-test] bundling production.ts failed:', e.message || e);
  process.exit(1);
}
const PROD = require(BUNDLE);

// ===========================================================================
// §3. `sanitizeProductionQueue` -- PRAWDZIWY tekst z main.ts, cuda ATRAPOWANE
// (poza zakresem tematu; parseWonderProdId zwraca null dla naszych id budynków,
// więc wonderGateOk nigdy nie jest realnie wołane w tych scenariuszach).
// ===========================================================================
const sanitizeProdQueueTxt = wytnijOdSygnatury(realSrc, 'function sanitizeProductionQueue(');
assert(!!sanitizeProdQueueTxt, '§3: sanitizeProductionQueue znaleziona w main.ts');
const sanitizeProdQueueJs = esbuild.transformSync(sanitizeProdQueueTxt, { loader: 'ts', target: 'node18' }).code;

function makeSanitizeProductionQueue(setOwnerPracaPool, ownerPracaPool) {
  const factory = new Function(
    'sanitizeBuildQueue', 'setOwnerPracaPool', 'ownerPracaPool', 'filterQueue',
    'parseWonderProdId', 'wonderGateOk',
    sanitizeProdQueueJs + '\nreturn sanitizeProductionQueue;',
  );
  return factory(
    PROD.sanitizeBuildQueue, setOwnerPracaPool, ownerPracaPool, PROD.filterQueue,
    () => null, () => true,
  );
}

// ===========================================================================
// §4. Runnery bloków przejęcia miasta -- PRAWDZIWY tekst main.ts
// ===========================================================================
const surrenderBlockTxt = wytnijBlokPrzejecia(realSrc, 'const prodSurrender = cityProd.get(city.id);');
const captureBlockTxt = wytnijBlokPrzejecia(realSrc, 'const prodCapture = cityProd.get(city.id);');
const surrenderBlockJs = esbuild.transformSync(surrenderBlockTxt, { loader: 'ts', target: 'node18' }).code;
const captureBlockJs = esbuild.transformSync(captureBlockTxt, { loader: 'ts', target: 'node18' }).code;

function makeRunner(blockJs, ownerVarName) {
  // ownerVarName: 'newOwner' (kapitulacja) albo 'atkOwner' (podbój) -- nazwa parametru,
  // pod którą PRAWDZIWY tekst main.ts odwołuje się do zdobywcy.
  return new Function(
    'city', 'oldOwner', ownerVarName, 'cityProd', 'data',
    'sanitizeBuildQueue', 'setOwnerPracaPool', 'ownerPracaPool', 'sanitizeProductionQueue',
    'filterQueue', 'capitalCityIdForOwner',
    blockJs + '\nreturn cityProd.get(city.id);',
  );
}
const runSurrender = makeRunner(surrenderBlockJs, 'newOwner');
const runCapture = makeRunner(captureBlockJs, 'atkOwner');

// ===========================================================================
// §5. Dane testowe -- 4 budynki `lokalizacja:'stolica'` z prawdziwego buildings.json
// ===========================================================================
const buildingsJson = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'buildings.json'), 'utf8'));
const CAPITAL_BUILDING_IDS = buildingsJson
  .filter(b => b.lokalizacja === 'stolica')
  .map(b => b.id);
eq(CAPITAL_BUILDING_IDS.slice().sort().join(','), 'mennica,palac,palac_ii,palac_iii',
  '§5: buildings.json ma dokładnie 4 budynki lokalizacja:stolica (mennica, palac, palac_ii, palac_iii)');

function makePool() {
  const pool = new Map();
  return {
    ownerPracaPool: (id) => pool.get(id) ?? 0,
    setOwnerPracaPool: (id, v) => pool.set(id, v),
    pool,
  };
}

function scenario({ runner, ownerKey, buildingId, capturedCityIsNewCapital }) {
  const OLD_OWNER = 1;
  const NEW_OWNER = 2;
  const CITY_ID = 'miasto-test';
  const city = { id: CITY_ID, ownerId: NEW_OWNER }; // ownerId JUŻ zmieniony na zdobywcę,
  // dokładnie tak jak w realnym kodzie main.ts w obu miejscach PRZED tym blokiem
  // (weryfikacja kolejności wywołań -- REGULA PRZECIW SAMOOSZUKIWANIU dyspozycji).
  const cityProd = new Map([[CITY_ID, {
    kolejka: [{ kind: 'budynek', id: buildingId, nazwa: buildingId, koszt: 90, postep: 0 }],
    postep: 37, // Praca zbankowana na froncie kolejki -- to jest to, co ma wrócić do puli.
  }]]);
  const data = { buildings: buildingsJson };
  const { ownerPracaPool, setOwnerPracaPool, pool } = makePool();
  const sanitizeProductionQueue = makeSanitizeProductionQueue(setOwnerPracaPool, ownerPracaPool);
  const capitalCityIdForOwner = (ownerId) => {
    if (ownerId === NEW_OWNER) return capturedCityIsNewCapital ? CITY_ID : 'inna-stolica-zdobywcy';
    return 'stolica-starego-wlasciciela';
  };

  const resultProd = runner(city, OLD_OWNER, NEW_OWNER, cityProd, data,
    PROD.sanitizeBuildQueue, setOwnerPracaPool, ownerPracaPool, sanitizeProductionQueue,
    PROD.filterQueue, capitalCityIdForOwner);
  return { resultProd, pool, OLD_OWNER, NEW_OWNER };
}

const RUNNERS = [
  { label: 'kapitulacja głodowa (resolveSiegeSurrender)', runner: runSurrender },
  { label: 'podbój bojowy (applyCityCaptureToMap)', runner: runCapture },
];

for (const { label, runner } of RUNNERS) {
  console.log(`\n-- ${label} --`);

  for (const buildingId of CAPITAL_BUILDING_IDS) {
    // A: zdobywca MA JUŻ inną stolicę -- budynek USUNIĘTY, Praca do PULI ZDOBYWCY.
    {
      const { resultProd, pool, OLD_OWNER, NEW_OWNER } = scenario({
        runner, buildingId, capturedCityIsNewCapital: false,
      });
      eq(resultProd.kolejka.length, 0, `${buildingId}: zdobywca ma inną stolicę -> ${buildingId} usunięty z kolejki`);
      eq(pool.get(NEW_OWNER) ?? 0, 37, `${buildingId}: Praca (37) trafia do puli ZDOBYWCY (${NEW_OWNER})`);
      eq(pool.get(OLD_OWNER) ?? 0, 0, `${buildingId}: POPRZEDNI właściciel (${OLD_OWNER}) NIC nie dostaje za usunięty budynek-stolica`);
    }

    // B: KONTROLA NEGATYWNA -- zdobyte miasto WŁAŚNIE STAJE SIĘ nową stolicą zdobywcy
    // (capitalCityIdForOwner liczone PO zmianie city.ownerId, patrz `city` w scenario()
    // powyżej) -> budynek MUSI ZOSTAĆ, zero zwrotu.
    {
      const { resultProd, pool, NEW_OWNER } = scenario({
        runner, buildingId, capturedCityIsNewCapital: true,
      });
      eq(resultProd.kolejka.length, 1, `${buildingId}: zdobyte miasto JEST nową stolicą zdobywcy -> ${buildingId} ZOSTAJE w kolejce`);
      eq(resultProd.kolejka[0]?.id, buildingId, `${buildingId}: front kolejki wciąż to ${buildingId} (brzegowy przypadek nowej stolicy)`);
      eq(pool.get(NEW_OWNER) ?? 0, 0, `${buildingId}: nowa-stolica -> zero zwrotu Pracy do zdobywcy`);
    }
  }

  // C: KONTROLA NEGATYWNA -- legacy jednostka w TEJ SAMEJ kolejce nadal zwraca Pracę
  // do POPRZEDNIEGO właściciela (zero regresji na już zatwierdzonej konwencji).
  {
    const OLD_OWNER = 1, NEW_OWNER = 2, CITY_ID = 'miasto-legacy';
    const city = { id: CITY_ID, ownerId: NEW_OWNER };
    const cityProd = new Map([[CITY_ID, {
      kolejka: [{ kind: 'jednostka', id: 'Wojownik', nazwa: 'Wojownik', koszt: 40 }],
      postep: 11,
    }]]);
    const data = { buildings: buildingsJson };
    const { ownerPracaPool, setOwnerPracaPool, pool } = makePool();
    const sanitizeProductionQueue = makeSanitizeProductionQueue(setOwnerPracaPool, ownerPracaPool);
    const capitalCityIdForOwner = (ownerId) => (ownerId === NEW_OWNER ? 'inna-stolica-zdobywcy' : 'stolica-starego');
    const resultProd = runner(city, OLD_OWNER, NEW_OWNER, cityProd, data,
      PROD.sanitizeBuildQueue, setOwnerPracaPool, ownerPracaPool, sanitizeProductionQueue,
      PROD.filterQueue, capitalCityIdForOwner);
    eq(resultProd.kolejka.length, 0, 'legacy: jednostka usunięta z kolejki Pracy (migracja sanitizeBuildQueue, niezmieniona)');
    eq(pool.get(OLD_OWNER) ?? 0, 11, 'legacy: Praca (11) wraca do POPRZEDNIEGO właściciela (zero regresji na zatwierdzonej konwencji)');
    eq(pool.get(NEW_OWNER) ?? 0, 0, 'legacy: zdobywca NIC nie dostaje za legacy jednostkę (to nie jest budynek-stolica)');
  }

  // D: budynek NIE lokalizacja:'stolica' (region/uniwersalny) -- nietknięty niezależnie
  // od stolicy zdobywcy, zero fałszywych trafień filtra.
  {
    const OLD_OWNER = 1, NEW_OWNER = 2, CITY_ID = 'miasto-region';
    const city = { id: CITY_ID, ownerId: NEW_OWNER };
    const regionBuilding = buildingsJson.find(b => b.lokalizacja !== 'stolica');
    assert(!!regionBuilding, 'D: istnieje w buildings.json budynek NIE-stolica do testu kontrolnego');
    const cityProd = new Map([[CITY_ID, {
      kolejka: [{ kind: 'budynek', id: regionBuilding.id, nazwa: regionBuilding.id, koszt: 20, postep: 0 }],
      postep: 5,
    }]]);
    const data = { buildings: buildingsJson };
    const { ownerPracaPool, setOwnerPracaPool, pool } = makePool();
    const sanitizeProductionQueue = makeSanitizeProductionQueue(setOwnerPracaPool, ownerPracaPool);
    const capitalCityIdForOwner = (ownerId) => (ownerId === NEW_OWNER ? 'inna-stolica-zdobywcy' : 'stolica-starego');
    const resultProd = runner(city, OLD_OWNER, NEW_OWNER, cityProd, data,
      PROD.sanitizeBuildQueue, setOwnerPracaPool, ownerPracaPool, sanitizeProductionQueue,
      PROD.filterQueue, capitalCityIdForOwner);
    eq(resultProd.kolejka.length, 1, `D: budynek nie-stolica (${regionBuilding.id}) ZOSTAJE w kolejce niezależnie od stolicy zdobywcy`);
    eq(pool.get(NEW_OWNER) ?? 0, 0, 'D: zero zwrotu Pracy dla budynku nie-stolica');
  }
}

console.log(`\npodboj-kolejka-budynek-niemozliwy-test: ${passed} passed, ${failed} failed`);
try { fs.unlinkSync(ENTRY); } catch (e) {}
try { fs.unlinkSync(BUNDLE); } catch (e) {}
process.exit(failed > 0 ? 1 : 0);
