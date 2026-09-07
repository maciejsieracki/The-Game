'use strict';
/**
 * R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1 (2026-09-01) — miasto zdobyte SIŁĄ (bitwa lub
 * kapitulacja głodowa) LICZY SIĘ do limitu miast danej epoki nowego właściciela, dokładnie
 * tak samo jak miasto założone osadnikiem. Odwrócenie wcześniejszej decyzji
 * R-MIASTA-LIMIT-PODBÓJ-Q1=A (miasta podbite miały być WYJĘTE spod limitu).
 *
 * R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1 (2026-09-07) — CZĘŚCIOWE odwrócenie
 * powyższego, na wyraźne ECHO właściciela: rozróżniamy PROWENIENCJĘ zdobytego miasta wg
 * właściciela BEZPOŚREDNIO PRZED tą konkretną konkwistą:
 * - zdobyte BEZPOŚREDNIO od niezależnego (nigdy wcześniej nieprzejętego) miasta-państwa
 *   (`city.startCityState === true` tuż przed TĄ konkwistą) → LICZY SIĘ do limitu zdobywcy
 *   (BEZ ZMIAN względem R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1);
 * - zdobyte od INNEJ CYWILIZACJI (czy to jej własne od zawsze miasto, czy miasto-państwo,
 *   które ta cywilizacja WCZEŚNIEJ sama przejęła — `city.startCityState !== true` tuż przed
 *   TĄ konkwistą) → NIE LICZY SIĘ do limitu zdobywcy (`city.foundedByOwner = false`).
 *
 * Kontrakt:
 * - limit blokuje kolejne foundingi po wyczerpaniu puli;
 * - miasto przejęte BEZPOŚREDNIO od niezależnego miasta-państwa (bitwa LUB kapitulacja
 *   głodowa) ZUŻYWA tę samą pulę co miasto założone osadnikiem;
 * - miasto przejęte siłą OD INNEJ CYWILIZACJI (czy to jej własne miasto, czy miasto-
 *   -państwo które ta cywilizacja wcześniej sama przejęła) NIE zużywa puli;
 * - gracz i AI używają tej samej bramki, a przejęcie gracz/AI/MP przechodzi przez wspólny
 *   mechanizm bez dodatkowej bramki foundingowej;
 * - `annexCityStateToOwner` (wchłonięcie dyplomatyczne) pozostaje nietknięte — miasta
 *   wchłonięte ZACHOWUJĄ swoje `foundedByOwner` (zwykle `true`) i już dziś liczą się do
 *   limitu, bez potrzeby jakiejkolwiek zmiany (poza zakresem tego zlecenia).
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
  wasIndependentCityStateBeforeCapture,
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
  wasIndependentCityStateBeforeCapture,
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

function makeCity(id, ownerId, q, r, opts = {}) {
  return {
    id,
    ownerId,
    q,
    r,
    name: id,
    population: 1,
    foundedByOwner: opts.foundedByOwner !== undefined ? opts.foundedByOwner : true,
    ...(opts.startCityState !== undefined ? { startCityState: opts.startCityState } : {}),
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

console.log('\n-- czysta logika limitu (miasto ZDOBYTE od niezależnego miasta-państwa liczy się jak założone) --');
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

console.log('\n-- SCENARIUSZ (i): podbój NIEZALEŻNEGO miasta-państwa (nigdy wcześniej nieprzejętego) --');
// Miasto-państwo NIGDY wcześniej nieprzejęte (startCityState=true tuż przed TĄ konkwistą).
// Gracz (ownerId=0) jest DOKŁADNIE przy limicie epoki kamienia (9 miast założonych, baza
// limitu = 10 => wolne jeszcze jedno miejsce), zdobywa je w bitwie od niezależnej frakcji
// miasta-państwa (ownerId=2, `startCityState: true`). Ten podprzypadek MUSI zostać BEZ ZMIAN
// względem R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1 -- to jest właśnie ECHO właściciela:
// "wszystkie państwa i miasta liczą się do limitu... mówię tu... o państwach-miastach...
// jak i o innych; one wliczają się do limitu".
const independentCityState = makeCity('cs-independent', 2, 15, 15, { foundedByOwner: true, startCityState: true });
assert(
  wasIndependentCityStateBeforeCapture(independentCityState) === true,
  'kontrola: miasto-państwo nigdy wcześniej nieprzejęte jest rozpoznane jako niezależne PRZED konkwistą',
);

applyCityCaptureAfterBattle(
  independentCityState,
  [makeAttackerUnit('atk-cs', 0, 14, 15)],
  0,
  [makeAttackerUnit('atk-cs', 0, 14, 15)],
  'atk-cs',
);

assert(
  independentCityState.ownerId === 0,
  'podbój niezależnego miasta-państwa przenosi własność na zdobywcę',
);
assert(
  independentCityState.foundedByOwner === true,
  'SCENARIUSZ (i): podbój BEZPOŚREDNIO od niezależnego miasta-państwa NIE ustawia foundedByOwner=false '
    + '(regres R-MIASTA-LIMIT-PODBOJ-SILA-LICZY-SIE-Q1 -- ten podprzypadek zostaje BEZ ZMIAN)',
);
assert(
  countsTowardCityFoundingLimit(independentCityState) === true,
  'miasto zdobyte BEZPOŚREDNIO od niezależnego miasta-państwa nadal zużywa pulę miast zakładanych',
);

const citiesAfterIndependentCapture = [...foundedCities.slice(0, 9), independentCityState];
const foundingBlockedAfterIndependentCapture = canFoundCity(29, 29, citiesAfterIndependentCapture, map, foundingOpts);
assert(
  foundingBlockedAfterIndependentCapture.ok === false
    && foundingBlockedAfterIndependentCapture.reason === 'limit miast na tej epoce',
  'SCENARIUSZ (i): 9 miast założonych + 1 zdobyte od niezależnego miasta-państwa = limit 10 wyczerpany, '
    + 'próba założenia NOWEGO miasta osadnikiem jest odrzucona przez canFoundCity',
);

console.log('\n-- SCENARIUSZ (ii): podbój zwykłego miasta INNEJ CYWILIZACJI (nigdy nie było miastem-państwem) --');
// Miasto od zawsze własne innej cywilizacji (ownerId=1), brak startCityState -- to jest
// właśnie "wynik wojny z inną cywilizacją" z ECHO właściciela, NIE organicznej ekspansji.
const foreignCivCity = makeCity('foreign-civ-city', 1, 15, 21, { foundedByOwner: true });
assert(
  wasIndependentCityStateBeforeCapture(foreignCivCity) === false,
  'kontrola: zwykłe miasto innej cywilizacji NIE jest rozpoznane jako niezależne miasto-państwo',
);

applyCityCaptureAfterBattle(
  foreignCivCity,
  [makeAttackerUnit('atk-civ', 0, 14, 21)],
  0,
  [makeAttackerUnit('atk-civ', 0, 14, 21)],
  'atk-civ',
);

assert(
  foreignCivCity.ownerId === 0,
  'podbój miasta innej cywilizacji przenosi własność na zdobywcę',
);
assert(
  foreignCivCity.foundedByOwner === false,
  'SCENARIUSZ (ii): podbój zwykłego miasta INNEJ CYWILIZACJI ustawia foundedByOwner=false '
    + '(NIE liczy się do limitu zdobywcy -- ZMIANA wprowadzona tym tematem)',
);
assert(
  countsTowardCityFoundingLimit(foreignCivCity) === false,
  'miasto zdobyte od innej cywilizacji NIE zużywa puli miast zakładanych',
);

const citiesAfterForeignCapture = [...foundedCities.slice(0, 9), foreignCivCity];
const foundingAllowedAfterForeignCapture = canFoundCity(29, 29, citiesAfterForeignCapture, map, foundingOpts);
assert(
  foundingAllowedAfterForeignCapture.ok === true,
  'SCENARIUSZ (ii): 9 miast założonych + 1 zdobyte od innej cywilizacji = limit 10 NIE wyczerpany '
    + '(zdobyte miasto nie zużywa puli), founding NOWEGO miasta osadnikiem jest nadal dozwolony',
);

console.log('\n-- SCENARIUSZ (iii): podbój miasta-państwa, które WCZEŚNIEJ przejęła inna cywilizacja --');
// Miasto-państwo (ownerId=1 -- inna cywilizacja), które TA cywilizacja SAMA przejęła
// wcześniej od stanu niezależnego (startCityState już zgaszone przy TAMTYM przejęciu,
// foundedByOwner=false z tamtej konkwisty). Teraz gracz (ownerId=0) odbiera je SIŁĄ tej
// cywilizacji -- to jest właśnie rozróżnienie, którego domaga się ECHO właściciela: "nawet
// jeśli wcześniej były państwem-miastem zdobytym przez tę cywilizację, nie zalicza się do
// limitu, ponieważ są wynikiem wojny z inną cywilizacją".
const reconqueredCityState = makeCity('cs-already-conquered-by-other-civ', 1, 15, 27, {
  foundedByOwner: false,
  startCityState: false,
});
assert(
  wasIndependentCityStateBeforeCapture(reconqueredCityState) === false,
  'kontrola: miasto-państwo już raz przejęte przez inną cywilizację NIE jest rozpoznane jako niezależne',
);

applyCityCaptureAfterBattle(
  reconqueredCityState,
  [makeAttackerUnit('atk-reconq', 0, 14, 27)],
  0,
  [makeAttackerUnit('atk-reconq', 0, 14, 27)],
  'atk-reconq',
);

assert(
  reconqueredCityState.ownerId === 0,
  'odebranie miasta-państwa innej cywilizacji przenosi własność na nowego zdobywcę',
);
assert(
  reconqueredCityState.foundedByOwner === false,
  'SCENARIUSZ (iii): podbój miasta-państwa, które WCZEŚNIEJ przejęła inna cywilizacja, '
    + 'zostawia (a nie tylko zostawia -- jawnie ustawia) foundedByOwner=false -- NIE liczy się do limitu, '
    + 'dokładnie tak jak zwykłe miasto tej cywilizacji',
);
assert(
  countsTowardCityFoundingLimit(reconqueredCityState) === false,
  'miasto-państwo odebrane innej cywilizacji (która sama je wcześniej przejęła) NIE zużywa puli miast zakładanych',
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
  battleCapture.includes('wasIndependentCityStateBeforeCapture(city)')
    && battleCapture.includes('if (!wasIndependentCityState) city.foundedByOwner = false;'),
  'podbój po bitwie rozróżnia prowenincję: wyjmuje spod limitu WYŁĄCZNIE gdy poprzedni właściciel '
    + 'to już była cywilizacja (R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1)',
);
assert(
  surrender.includes('wasIndependentCityStateBeforeCapture(city)')
    && surrender.includes('if (!wasIndependentCityState) city.foundedByOwner = false;'),
  'kapitulacja z głodu rozróżnia prowenincję: wyjmuje spod limitu WYŁĄCZNIE gdy poprzedni właściciel '
    + 'to już była cywilizacja (R-MIASTA-LIMIT-PODBOJ-PROWENIENCJA-CYWILIZACJA-Q1)',
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
    + 'wchłonięte miasta do limitu (miasta zachowują swoje pierwotne foundedByOwner), zero zmian potrzebnych '
    + '(poza zakresem tego zlecenia)',
);

console.log(`\n=== city-limit-conquered-test: ${passed} passed, ${failed} failed ===`);

try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* noop */ }
try { fs.unlinkSync(BUNDLE_FILE); } catch (_) { /* noop */ }

process.exit(failed > 0 ? 1 : 0);
