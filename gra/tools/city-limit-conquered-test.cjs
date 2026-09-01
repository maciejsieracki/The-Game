'use strict';
/**
 * R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1 — miasto zdobyte SIŁĄ (bitwa lub
 * kapitulacja głodowa) LICZY SIĘ do limitu miast danej epoki nowego
 * właściciela, dokładnie tak samo jak miasto założone osadnikiem. Odwrócenie
 * wcześniejszej decyzji R-MIASTA-LIMIT-PODBÓJ-Q1=A (miasta podbite miały być
 * WYJĘTE spod limitu) — na wyraźne, dwukrotnie potwierdzone życzenie
 * właściciela.
 *
 * Kontrakt:
 * - limit blokuje kolejne foundingi po wyczerpaniu puli;
 * - miasto przejęte przez wojnę (bitwa LUB kapitulacja głodowa) ZUŻYWA tę
 *   samą pulę co miasto założone osadnikiem;
 * - gracz i AI używają tej samej bramki, a przejęcie gracz/AI/MP przechodzi
 *   przez wspólny mechanizm bez dodatkowej bramki foundingowej;
 * - `annexCityStateToOwner` (wchłonięcie dyplomatyczne) pozostaje nietknięte
 *   — miasta wchłonięte ZACHOWUJĄ swoje `foundedByOwner` (zwykle `true`) i
 *   już dziś liczą się do limitu, bez potrzeby jakiejkolwiek zmiany.
 *
 * Uruchomienie: z katalogu gra: node tools/city-limit-conquered-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.city-limit-conquered-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.city-limit-conquered-bundle.cjs');

fs.writeFileSync(ENTRY_FILE, `
export {
  canFoundCity,
  foundCityAt,
  countsTowardCityFoundingLimit,
} from '../src/game/cities';
export { applyCityCaptureAfterBattle } from '../src/game/post-battle-map';
`, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' },
    outfile: BUNDLE_FILE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (error) {
  console.error('[city-limit-conquered-test] bundling failed:', error.message || error);
  process.exit(1);
}

const {
  canFoundCity,
  foundCityAt,
  countsTowardCityFoundingLimit,
  applyCityCaptureAfterBattle,
} = require(BUNDLE_FILE);

let passed = 0;
let failed = 0;
function assert(condition, message) {
  if (condition) {
    passed++;
    console.log('PASS:', message);
  } else {
    failed++;
    console.error('FAIL:', message);
  }
}

function makeMap(size = 32) {
  const hexes = {};
  for (let q = 0; q < size; q++) {
    for (let r = 0; r < size; r++) {
      hexes[`${q},${r}`] = {
        coords: { q, r },
        terenBazowy: 'laka',
      };
    }
  }
  return { hexes, szerokoscQ: size, wysokoscR: size };
}

function makeCity(id, ownerId, q, r, foundedByOwner = true) {
  return {
    id,
    ownerId,
    q,
    r,
    name: id,
    population: 1,
    foundedByOwner,
  };
}

function makeAttackerUnit(id, ownerId, q, r) {
  return {
    id,
    ownerId,
    q,
    r,
    category: 'core',
    typeId: 'wojownik',
    ruchLeft: 2,
  };
}

const map = makeMap();
const foundingOpts = {
  ownerId: 0,
  ownerEra: 1,
  gameConfig: { cityLimitBase: 10 },
};
const foundedCities = [
  [0, 0], [0, 6], [6, 0], [6, 6], [12, 0],
  [0, 12], [12, 12], [18, 0], [0, 18], [18, 18],
].map(([q, r], i) => makeCity(`founded-${i}`, 0, q, r));

console.log('\n-- czysta logika limitu (miasto ZDOBYTE liczy się jak założone) --');
assert(
  countsTowardCityFoundingLimit(foundedCities[0]) === true,
  'miasto założone samodzielnie zużywa limit zakładania',
);

const atLimit = canFoundCity(29, 29, foundedCities, map, foundingOpts);
assert(
  atLimit.ok === false && atLimit.reason === 'limit miast na tej epoce',
  'limit blokuje founding po 10 miastach założonych',
);

const newCity = foundCityAt(29, 29, 0, [], map, 'Nowe miasto');
assert(
  newCity && newCity.foundedByOwner === true,
  'founding oznacza nowe miasto jako założone przez właściciela',
);

console.log('\n-- REALNY scenariusz właściciela: podbój bitewny -> próba założenia -> odrzucenie --');
// Gracz (ownerId=0) jest DOKŁADNIE przy limicie epoki kamienia (9 miast
// założonych, baza limitu = 10 => wolne jeszcze jedno miejsce), zdobywa w
// bitwie JESZCZE JEDNO miasto wroga (ownerId=1). Realny
// `applyCityCaptureAfterBattle` (bez przepisanej logiki) ma przenieść
// własność i (po tej zmianie) NIE oznaczać miasta jako wyjętego spod limitu.
const enemyCity = makeCity('enemy-captured', 1, 15, 15, true);
const attackerRoster = [makeAttackerUnit('atk-1', 0, 14, 15)];
const unitsOnMap = [makeAttackerUnit('atk-1', 0, 14, 15)];

applyCityCaptureAfterBattle(enemyCity, attackerRoster, 0, unitsOnMap, 'atk-1');

assert(
  enemyCity.ownerId === 0,
  'realny applyCityCaptureAfterBattle przenosi własność miasta na zdobywcę',
);
assert(
  enemyCity.foundedByOwner === true,
  'realny applyCityCaptureAfterBattle NIE ustawia foundedByOwner=false (miasto zdobyte siłą liczy się do limitu)',
);
assert(
  countsTowardCityFoundingLimit(enemyCity) === true,
  'miasto zdobyte w bitwie zużywa pulę miast zakładanych tak samo jak miasto założone',
);

const citiesAfterCapture = [...foundedCities.slice(0, 9), enemyCity];
const foundingBlockedAfterCapture = canFoundCity(29, 29, citiesAfterCapture, map, foundingOpts);
assert(
  foundingBlockedAfterCapture.ok === false
    && foundingBlockedAfterCapture.reason === 'limit miast na tej epoce',
  'DOKŁADNY scenariusz właściciela: 9 miast założonych + 1 zdobyte siłą = limit 10 wyczerpany, '
    + 'próba założenia NOWEGO miasta osadnikiem jest odrzucona przez canFoundCity',
);

const belowLimitBeforeCapture = canFoundCity(29, 29, foundedCities.slice(0, 9), map, foundingOpts);
assert(
  belowLimitBeforeCapture.ok === true,
  'kontrola: przed zdobyciem (9/10) founding był jeszcze dozwolony -- to zdobycie, nie coś innego, zamyka pulę',
);

console.log('\n-- recon ścieżek gracz/AI/MP (podbój bitewny + kapitulacja głodowa) --');
const mainSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src/main.ts'), 'utf8');
const postBattleSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src/game/post-battle-map.ts'), 'utf8');
const newGameSrc = fs.readFileSync(path.resolve(GRA_ROOT, 'src/ui/newGameFlow.ts'), 'utf8');

function functionBody(source, marker) {
  const start = source.indexOf(marker);
  if (start < 0) return '';
  let open = source.indexOf('{', start);
  if (open < 0) return '';
  // Niektóre funkcje mają obiekt w adnotacji typu wyniku przed właściwym
  // ciałem, np. `): { ok: boolean } {`.
  if (source.slice(start, open + 1).includes('): {')) {
    const typeEnd = source.indexOf('}', open);
    open = typeEnd >= 0 ? source.indexOf('{', typeEnd + 1) : -1;
  }
  if (open < 0) return '';
  let depth = 0;
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }
  return '';
}

const playerFounding = functionBody(mainSrc, 'function canFoundPlayerCityAt(');
const aiFounding = functionBody(mainSrc, "if (cmd.type === 'foundCityAt') {");
const battleCapture = functionBody(postBattleSrc, 'export function applyCityCaptureAfterBattle(');
const emptyCapture = functionBody(mainSrc, 'function captureCityWithoutBattle(');
const surrender = functionBody(mainSrc, 'function resolveSiegeSurrender(');

assert(
  playerFounding.includes('canFoundCity(')
    && playerFounding.includes('cityLimitBase'),
  'gracz sprawdza limit w canFoundPlayerCityAt',
);
assert(
  aiFounding.includes('canFoundCity(')
    && aiFounding.includes('cityLimitBase'),
  'AI sprawdza ten sam limit w wykonaniu foundCityAt',
);
assert(
  !battleCapture.includes('city.foundedByOwner = false'),
  'podbój po bitwie NIE wyjmuje miasta spod limitu (foundedByOwner pozostaje niezmienione)',
);
assert(
  !surrender.includes('city.foundedByOwner = false'),
  'kapitulacja z głodu NIE wyjmuje miasta spod limitu (foundedByOwner pozostaje niezmienione)',
);
assert(
  emptyCapture.includes('applyCityCaptureToMap(')
    && !emptyCapture.includes('canFoundCity('),
  'captureCityWithoutBattle korzysta ze wspólnej ścieżki przejęcia bez bramki foundingowej',
);
assert(
  newGameSrc.includes("lbl: 'Limit miast zakładanych (baza)'")
    && newGameSrc.includes("['Limit miast zakładanych (baza)', cityLimitLabel]"),
  'UI używa etykiety „Limit miast zakładanych”',
);

console.log('\n-- kontrola zakresu: zero zmian w annexCityStateToOwner (wchłonięcie dyplomatyczne) --');
const annexBody = functionBody(mainSrc, 'function annexCityStateToOwner(');
assert(
  annexBody.length > 0 && !annexBody.includes('foundedByOwner'),
  'annexCityStateToOwner nie dotyka foundedByOwner -- wchłonięcie dyplomatyczne już dziś liczy '
    + 'wchłonięte miasta do limitu (miasta zachowują swoje pierwotne foundedByOwner), zero zmian potrzebnych',
);

console.log(`\n=== city-limit-conquered-test: ${passed} passed, ${failed} failed ===`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
