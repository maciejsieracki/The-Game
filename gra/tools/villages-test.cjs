'use strict';
/**
 * villages-test.cjs -- standalone Node test for:
 *   - src/map/villages.ts (placeVillages: rozmieszczenie wiosek przy generacji mapy)
 *   - src/game/villageRewards.ts (pickVillageReward + magnitudy nagród)
 * Run from gra/:  node tools/villages-test.cjs
 *
 * Self-contained: bundles both modules with esbuild to a temp CJS file, then
 * requires it and runs assertions. Pure logic only -- no DOM, no THREE.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[villages-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.villages-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.villages-bundle.cjs');

const ENTRY_TS = `
export { placeVillages, VILLAGE_LAND_HEX_PER_VILLAGE, VILLAGE_MIN_DIST_FROM_CITY, VILLAGE_MIN_SPACING, VILLAGE_HUTS_PER_CITY, expectedStartCityCount, targetVillageHutCount, villageHutsPerCityMultiplier } from '../src/map/villages';
export {
  pickVillageReward, villageGoldAmount, villageTechProgress, villageUnitForEra,
  findVillageRewardSpawnHex, VILLAGE_REWARD_SPAWN_MAX_RADIUS,
  VILLAGE_REWARD_WEIGHT_GOLD, VILLAGE_REWARD_WEIGHT_TECH, VILLAGE_REWARD_WEIGHT_UNIT,
  VILLAGE_GOLD_BASE_MIN, VILLAGE_GOLD_BASE_MAX, VILLAGE_TECH_SCIENCE_BASE,
  shouldExcludeUnitReward,
} from '../src/game/villageRewards';
export { hexDistance } from '../src/units/setup';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[villages-test] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE_FILE);
const {
  placeVillages, VILLAGE_LAND_HEX_PER_VILLAGE, VILLAGE_MIN_DIST_FROM_CITY, VILLAGE_MIN_SPACING,
  VILLAGE_HUTS_PER_CITY, expectedStartCityCount, targetVillageHutCount, villageHutsPerCityMultiplier,
  pickVillageReward, villageGoldAmount, villageTechProgress, villageUnitForEra,
  findVillageRewardSpawnHex, VILLAGE_REWARD_SPAWN_MAX_RADIUS,
  VILLAGE_REWARD_WEIGHT_GOLD, VILLAGE_REWARD_WEIGHT_TECH, VILLAGE_REWARD_WEIGHT_UNIT,
  VILLAGE_GOLD_BASE_MIN, VILLAGE_GOLD_BASE_MAX, VILLAGE_TECH_SCIENCE_BASE,
  shouldExcludeUnitReward,
  hexDistance,
} = M;

// --- tiny assertion framework ------------------------------------------------
let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) { assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

// --- helpers ------------------------------------------------------------------
// Rectangular map. opts.gory / opts.pustynia / opts.morze / opts.wybrzeze / opts.owned
// are arrays of "q,r" keys overriding terrain / ownership.
function makeMap(w, h, opts = {}) {
  const gory      = new Set(opts.gory      || []);
  const pustynia  = new Set(opts.pustynia  || []);
  const morze     = new Set(opts.morze     || []);
  const wybrzeze  = new Set(opts.wybrzeze  || []);
  const owned     = opts.owned || {};
  const hexes = {};
  for (let q = 0; q < w; q++) {
    for (let r = 0; r < h; r++) {
      const k = `${q},${r}`;
      let teren = 'laka';
      if (gory.has(k)) teren = 'gory';
      else if (pustynia.has(k)) teren = 'pustynia';
      else if (morze.has(k)) teren = 'morze';
      else if (wybrzeze.has(k)) teren = 'wybrzeze';
      hexes[k] = {
        coords: { q, r },
        terenBazowy: teren,
        nakladka: 'brak',
        ulepszenie: 'brak',
        wlasciciel: (k in owned) ? owned[k] : null,
        wioska: { istnieje: false, ludnosc: 0 },
        widocznosc: {},
        rzeka: { obecna: false, krawedzie: [] },
      };
    }
  }
  return hexes;
}

console.log('\n[villages-test] Running tests...\n');

// ===========================================================================
// 1. placeVillages -- podstawy + wykluczenia terenu
// ===========================================================================
console.log('1. placeVillages -- teren/wykluczenia');
{
  const gory = [];
  for (let r = 0; r < 30; r++) gory.push(`5,${r}`); // pionowa sciana gor
  const pustynia = [];
  for (let r = 0; r < 30; r++) pustynia.push(`10,${r}`);
  const morze = [];
  for (let r = 0; r < 30; r++) morze.push(`20,${r}`);
  const wybrzeze = [];
  for (let r = 0; r < 30; r++) wybrzeze.push(`19,${r}`);

  const hexes = makeMap(30, 30, { gory, pustynia, morze, wybrzeze });
  const sites = placeVillages(hexes, [], [], 42, { landHexPerVillage: 40 });

  assert(sites.length > 0, 'produces at least one village on a large open map');

  let noBadTerrain = true;
  for (const s of sites) {
    const hex = hexes[`${s.q},${s.r}`];
    const t = hex.terenBazowy;
    if (t === 'gory' || t === 'pustynia' || t === 'morze' || t === 'wybrzeze') noBadTerrain = false;
  }
  assert(noBadTerrain, 'no village on gory/pustynia/morze/wybrzeze');
}

// ===========================================================================
// 2. placeVillages -- determinizm (sam seed -> identyczny wynik)
// ===========================================================================
console.log('\n2. placeVillages -- determinizm');
{
  const hexes = makeMap(24, 24);
  const a = placeVillages(hexes, [], [], 777, { landHexPerVillage: 50 });
  const b = placeVillages(hexes, [], [], 777, { landHexPerVillage: 50 });
  eq(JSON.stringify(a), JSON.stringify(b), 'placeVillages deterministic for a fixed seed');

  const c = placeVillages(hexes, [], [], 778, { landHexPerVillage: 50 });
  assert(JSON.stringify(a) !== JSON.stringify(c) || a.length === 0, 'different seed -> (likely) different result');
}

// ===========================================================================
// 3. placeVillages -- wykluczenie miasta/obozu + spacing
// ===========================================================================
console.log('\n3. placeVillages -- min dystans od miasta/obozu + spacing miedzy wioskami');
{
  const hexes = makeMap(30, 30);
  const cities = [{ q: 15, r: 15 }];
  const camps = [{ q: 5, r: 5 }];
  const sites = placeVillages(hexes, cities, camps, 555, {
    landHexPerVillage: 15, minDistFromCity: 4, spacing: 5,
  });

  assert(sites.length > 1, 'plenty of villages placed for this density');

  let farFromCity = true, farFromCamp = true, spaced = true;
  for (const s of sites) {
    if (hexDistance(s.q, s.r, 15, 15) < 4) farFromCity = false;
    if (hexDistance(s.q, s.r, 5, 5) < 5) farFromCamp = false;
  }
  for (let i = 0; i < sites.length; i++) {
    for (let j = i + 1; j < sites.length; j++) {
      if (hexDistance(sites[i].q, sites[i].r, sites[j].q, sites[j].r) < 5) spaced = false;
    }
  }
  assert(farFromCity, 'every village >= minDistFromCity from the city');
  assert(farFromCamp, 'every village >= spacing from the barbarian camp');
  assert(spaced, 'villages respect spacing pairwise');

  // Not on an owned hex either.
  const hexesOwned = makeMap(30, 30, { owned: { '15,15': 1 } });
  const sitesOwned = placeVillages(hexesOwned, [], [], 555, { landHexPerVillage: 15 });
  assert(!sitesOwned.some(s => s.q === 15 && s.r === 15), 'never on an owned hex');
}

// ===========================================================================
// 4. placeVillages -- targetCount (kanon: miasta x trudnosc)
// ===========================================================================
console.log('\n4. placeVillages -- targetCount (miasta x trudnosc)');
{
  eq(expectedStartCityCount(2, 3), 8, '8 miast = 2 typy x (1+3 panstwa)');
  eq(targetVillageHutCount(8, 'normal'), 16, '8 miast Normal -> 16 chat');
  eq(targetVillageHutCount(8, 'hard'), 8, '8 miast Hard -> 8 chat');
  eq(targetVillageHutCount(8, 'easy'), 24, '8 miast Easy -> 24 chat');
  eq(villageHutsPerCityMultiplier('hard'), VILLAGE_HUTS_PER_CITY.hard, 'hard multiplier = 1');
  eq(villageHutsPerCityMultiplier('normal'), VILLAGE_HUTS_PER_CITY.normal, 'normal multiplier = 2');
  eq(villageHutsPerCityMultiplier('easy'), VILLAGE_HUTS_PER_CITY.easy, 'easy multiplier = 3');

  const big = makeMap(60, 60);
  const target = targetVillageHutCount(8, 'normal');
  const sites = placeVillages(big, [], [], 123, { targetCount: target });
  eq(sites.length, target, 'large map places exactly targetCount when space allows');
}

// ===========================================================================
// 5. placeVillages -- legacy proporcjonalnosc do heksow ladowych
// ===========================================================================
console.log('\n5. placeVillages -- legacy proporcjonalnosc do wielkosci ladu');
{
  const small = makeMap(20, 20); // 400 hexes, all land
  const big   = makeMap(40, 40); // 1600 hexes, all land
  const sSmall = placeVillages(small, [], [], 1, { landHexPerVillage: 40 });
  const sBig   = placeVillages(big,   [], [], 1, { landHexPerVillage: 40 });
  eq(sSmall.length, Math.round(400 / 40), 'small map village count == round(landHex / N)');
  eq(sBig.length,   Math.round(1600 / 40), 'big map village count == round(landHex / N)');
  assert(sBig.length > sSmall.length, 'bigger map -> more villages');
}

// ===========================================================================
// 6. placeVillages -- min. 1 wioska (legacy fallback)
// ===========================================================================
console.log('\n6. placeVillages -- min. 1 wioska (legacy fallback)');
{
  const tiny = makeMap(4, 4); // 16 hexes, N=250 domyslnie -> round(16/250)=0 -> min 1
  const sites = placeVillages(tiny, [], [], 9, {});
  eq(VILLAGE_LAND_HEX_PER_VILLAGE > 16, true, 'sanity: default N bigger than tiny map hex count');
  assert(sites.length >= 1, 'at least one village even when the ratio rounds to 0');
}

// ===========================================================================
// 7. pickVillageReward -- progi wag
// ===========================================================================
console.log('\n7. pickVillageReward -- progi deterministyczne');
{
  eq(pickVillageReward(0),        'zloto',     'roll=0 -> zloto');
  eq(pickVillageReward(VILLAGE_REWARD_WEIGHT_GOLD - 0.001), 'zloto', 'tuz przed progu gold -> zloto');
  eq(pickVillageReward(VILLAGE_REWARD_WEIGHT_GOLD), 'tech', 'roll==GOLD -> tech (pierwszy prog tech)');
  eq(
    pickVillageReward(VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH - 0.001),
    'tech',
    'tuz przed progu tech -> tech',
  );
  eq(
    pickVillageReward(VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH),
    'jednostka',
    'roll==GOLD+TECH -> jednostka',
  );
  eq(pickVillageReward(0.999999), 'jednostka', 'roll~1 -> jednostka');
  eq(pickVillageReward(-5), 'zloto', 'clamps below 0 -> zloto');
  eq(pickVillageReward(5), 'jednostka', 'clamps above 1 -> jednostka');

  const sumOk = Math.abs(
    (VILLAGE_REWARD_WEIGHT_GOLD + VILLAGE_REWARD_WEIGHT_TECH + VILLAGE_REWARD_WEIGHT_UNIT) - 1,
  ) < 1e-9;
  assert(sumOk, 'reward weights sum to 1');
}

// ===========================================================================
// 8. villageGoldAmount / villageTechProgress / villageUnitForEra
// ===========================================================================
console.log('\n8. Magnitudy nagrod');
{
  const fixedRand = () => 0; // najnizszy koniec zakresu
  eq(villageGoldAmount(1, fixedRand), VILLAGE_GOLD_BASE_MIN, 'era1 min gold == base min');
  const g2 = villageGoldAmount(2, fixedRand);
  const g1 = villageGoldAmount(1, fixedRand);
  assert(g2 > g1, 'gold scales up with era');

  const t1 = villageTechProgress(1);
  const t2 = villageTechProgress(2);
  eq(t1, VILLAGE_TECH_SCIENCE_BASE, 'era1 tech progress == base');
  assert(t2 > t1, 'tech progress scales up with era');

  eq(villageUnitForEra(1), 'Zwiadowca', 'era1 unit reward == Zwiadowca');
  eq(villageUnitForEra(2), 'Włócznik', 'era2 unit reward == Włócznik');
  eq(villageUnitForEra(3), null, 'era3 has no defined generic unit -> null (main.ts fallback zloto)');
  eq(villageUnitForEra(0), villageUnitForEra(1), 'era<1 clamps to era1');
}

// ===========================================================================
// 9. findVillageRewardSpawnHex -- poza obcym miastem
// ===========================================================================
console.log('\n9. findVillageRewardSpawnHex -- spawn poza obcym miastem');
{
  const passable = () => true;
  const cities = [
    { q: 1, r: 0, ownerId: 2 }, // obce miasto na sąsiednim heksie chatki
  ];
  const units = [];

  // Chatka (0,0); obce miasto na (1,0); wolny heks (0,1)
  const dest = findVillageRewardSpawnHex({
    hutQ: 0, hutR: 0, ownerId: 0, units, cities, isPassable: passable,
  });
  assert(dest !== undefined, 'znajduje wolny heks gdy obce miasto sąsiaduje z chatką');
  assert(!(dest.q === 1 && dest.r === 0), 'nie spawnuje na heksie obcego miasta');

  // Wszystkie sąsiednie heksy to obce miasta — szuka w promieniu 2
  const ringCities = [
    { q: 1, r: 0, ownerId: 2 },
    { q: 0, r: 1, ownerId: 2 },
    { q: -1, r: 1, ownerId: 2 },
    { q: -1, r: 0, ownerId: 2 },
    { q: 0, r: -1, ownerId: 2 },
    { q: 1, r: -1, ownerId: 2 },
  ];
  const dest2 = findVillageRewardSpawnHex({
    hutQ: 0, hutR: 0, ownerId: 0, units, cities: ringCities, isPassable: passable,
  });
  assert(dest2 !== undefined, 'znajduje heks w promieniu 2 gdy ring 1 to obce miasta');
  eq(hexDistance(dest2.q, dest2.r, 0, 0), 2, 'spawn w promieniu 2 gdy ring 1 zablokowany');

  // Preferuje odkryty heks
  const explored = new Set(['0,1']);
  const dest3 = findVillageRewardSpawnHex({
    hutQ: 0, hutR: 0, ownerId: 0, units, cities: [], isPassable: passable, exploredHexes: explored,
  });
  eq(dest3?.q + ',' + dest3?.r, '0,1', 'preferuje odkryty heks przy równej odległości');

  eq(VILLAGE_REWARD_SPAWN_MAX_RADIUS, 2, 'domyślny promień spawnu = 2');
}

// ===========================================================================
// 10. shouldExcludeUnitReward -- PEŁNA TABELA PRAWDY (2^4 = 16 kombinacji)
//     R-CHATKA-SKARBOW-BEZ-JEDNOSTEK-WOJSKOWYCH-NA-CUDZYM-TERENIE, runda 4 AutoBota.
//     Zamyka BEHAWIORALNIE (nie regexem) mutacje E1 (odwrócenie `!`), E2 (usunięcie
//     warunku własnego terytorium), E3 (odwrócenie `!==`/`===`) z rundy 3 werdyktu --
//     bo `shouldExcludeUnitReward` jest teraz czystą, eksportowaną funkcją, nie inline
//     koniunkcją chronioną tylko regexem na main.ts.
// ===========================================================================
console.log('\n10. shouldExcludeUnitReward -- pełna tabela prawdy (16 kombinacji)');
{
  const PLAYER = 0;   // playerOwnerId gracza (stały w grze)
  const OTHER  = 7;   // dowolny inny ownerId (obca cywilizacja)

  // 4 zmienne boolowskie/nullable, 2^4 = 16 wierszy:
  //   hasSpawnHex          -- czy w ogóle znaleziono heks spawnu
  //   rewardUnitIsMilitary -- czy jednostka-nagroda jest wojskowa (nie cywilna)
  //   ownerIsNull          -- czy spawnHexOwnerId === null (teren niczyj)
  //   ownerEqualsPlayer    -- (tylko gdy !ownerIsNull) czy spawnHexOwnerId === playerOwnerId
  const rows = [];
  for (const hasSpawnHex of [false, true]) {
    for (const rewardUnitIsMilitary of [false, true]) {
      for (const ownerIsNull of [true, false]) {
        for (const ownerEqualsPlayer of [true, false]) {
          const spawnHexOwnerId = ownerIsNull ? null : (ownerEqualsPlayer ? PLAYER : OTHER);
          // Oczekiwany wynik -- odtworzenie definicji funkcji NIEZALEŻNIE od jej kodu:
          // wyklucz TYLKO gdy jest gdzie spawnować, nagroda jest wojskowa, i heks spawnu
          // ma właściciela RÓŻNEGO od gracza (nie null, nie gracz).
          const expected =
            hasSpawnHex && rewardUnitIsMilitary && spawnHexOwnerId !== null && spawnHexOwnerId !== PLAYER;
          rows.push({ hasSpawnHex, rewardUnitIsMilitary, ownerIsNull, ownerEqualsPlayer, spawnHexOwnerId, expected });
        }
      }
    }
  }
  eq(rows.length, 16, 'tabela prawdy ma dokładnie 16 wierszy (2^4)');

  let trueCount = 0;
  for (const row of rows) {
    const got = shouldExcludeUnitReward({
      hasSpawnHex: row.hasSpawnHex,
      spawnHexOwnerId: row.spawnHexOwnerId,
      playerOwnerId: PLAYER,
      rewardUnitIsMilitary: row.rewardUnitIsMilitary,
    });
    if (row.expected) trueCount++;
    eq(
      got,
      row.expected,
      'shouldExcludeUnitReward hasSpawnHex=' + row.hasSpawnHex +
        ' military=' + row.rewardUnitIsMilitary +
        ' spawnHexOwnerId=' + JSON.stringify(row.spawnHexOwnerId) +
        ' playerOwnerId=' + PLAYER,
    );
  }
  eq(trueCount, 1, 'dokładnie 1/16 kombinacji wyklucza nagrodę (spawn+wojskowa+obce terytorium jednocześnie)');

  // pickVillageReward({ excludeUnit: true }) -- redystrybucja wag 50:30 -> 62,5%/37,5%,
  // kategoria 'jednostka' nigdy nie jest zwracana.
  eq(pickVillageReward(0, { excludeUnit: true }), 'zloto', 'excludeUnit: roll=0 -> zloto');
  eq(pickVillageReward(0.624, { excludeUnit: true }), 'zloto', 'excludeUnit: tuż przed progiem 62,5% -> zloto');
  eq(pickVillageReward(0.625, { excludeUnit: true }), 'tech', 'excludeUnit: roll==62,5% -> tech');
  eq(pickVillageReward(0.999999, { excludeUnit: true }), 'tech', 'excludeUnit: roll~1 -> tech (nigdy jednostka)');
  eq(pickVillageReward(0.999999, {}), 'jednostka', 'excludeUnit:false (pusty obiekt opcji) -> zachowanie bez wykluczenia');
  eq(pickVillageReward(0.999999), 'jednostka', 'brak opcji (undefined) -> zachowanie bez wykluczenia (kompatybilność wsteczna)');
}

// ===========================================================================
// 11. checkVillageRewardAt (main.ts) -- bramka tekstowa: wpięcie + wykluczenie
//     ocenione na heksie SPAWNU, nie chatki. Wzorzec jak w hud-moc-warstwa-test.cjs /
//     border-march-wygasanie-test.cjs -- czyta main.ts jako TEKST, wycina ciało funkcji,
//     asercjonuje regexem, że zawiera właściwe wywołania i NIE zawiera cofniętych.
// ===========================================================================
console.log('\n11. checkVillageRewardAt (main.ts) -- bramka tekstowa wpięcia');
{
  const MAIN_TS = path.resolve(__dirname, '..', 'src', 'main.ts');
  const src = fs.readFileSync(MAIN_TS, 'utf8');

  const fnStart = src.indexOf('function checkVillageRewardAt(q: number, r: number): boolean {');
  assert(fnStart >= 0, 'znaleziono checkVillageRewardAt w main.ts');
  const fnEndMarker = '\n    function checkVillageRewardsAlongPath(';
  const fnEndIdx = src.indexOf(fnEndMarker, fnStart);
  assert(fnEndIdx > fnStart, 'znaleziono koniec checkVillageRewardAt (przed checkVillageRewardsAlongPath)');
  const fnBody = fnStart >= 0 && fnEndIdx > fnStart ? src.slice(fnStart, fnEndIdx) : '';

  // --- wpięcie (dispatch runda 2, 5 punktów) --------------------------------
  assert(
    /territoryOwnerAtLive\(rewardUnitDest\.q, rewardUnitDest\.r\)/.test(fnBody),
    'ocena terytorium na heksie SPAWNU: territoryOwnerAtLive(rewardUnitDest.q, rewardUnitDest.r)',
  );
  assert(
    !/territoryOwnerAtLive\(q, r\)/.test(fnBody),
    'NIE ocenia terytorium na heksie CHATKI: brak territoryOwnerAtLive(q, r)',
  );
  assert(
    /pickVillageReward\(Math\.random\(\), \{ excludeUnit \}\)/.test(fnBody),
    'pickVillageReward wołane z opcją { excludeUnit }',
  );
  assert(
    /isVillageRewardUnitMilitary\(player\.era\)/.test(fnBody),
    'isVillageRewardUnitMilitary(player.era) obecne (predykat wojskowości nagrody)',
  );
  const spawnHexCallCount = (fnBody.match(/findVillageRewardSpawnHex\(/g) || []).length;
  eq(spawnHexCallCount, 1, 'findVillageRewardSpawnHex( wołane DOKŁADNIE RAZ w ciele funkcji (nie liczone dwa razy)');

  // --- wpięcie decyzji (runda 4): shouldExcludeUnitReward woła się z 4 właściwymi polami ---
  assert(/shouldExcludeUnitReward\(\{/.test(fnBody), 'shouldExcludeUnitReward({...}) wywołane w ciele funkcji');
  assert(
    /hasSpawnHex: rewardUnitDest !== undefined,/.test(fnBody),
    'hasSpawnHex wyprowadzone z rewardUnitDest !== undefined (nie zaszyte na sztywno)',
  );
  assert(
    /spawnHexOwnerId: rewardUnitDest \? territoryOwnerAtLive\(rewardUnitDest\.q, rewardUnitDest\.r\) : null,/.test(fnBody),
    'spawnHexOwnerId liczone z territoryOwnerAtLive na heksie spawnu, null gdy brak spawnu',
  );
  assert(/playerOwnerId: 0,/.test(fnBody), 'playerOwnerId: 0 (gracz) przekazywane do shouldExcludeUnitReward');
  assert(
    /rewardUnitIsMilitary: isVillageRewardUnitMilitary\(player\.era\),/.test(fnBody),
    'rewardUnitIsMilitary NIE odwrócone podwójną negacją przy wpięciu (brak "!" przed wywołaniem)',
  );

  // --- 3 nowe piny (runda 4): hutQ/hutR/ownerId w wywołaniu findVillageRewardSpawnHex ---
  // Zamyka E5 (zamiana ownerId na inny niż gracza) i E6 (zamiana hutQ/hutR miejscami).
  assert(
    /findVillageRewardSpawnHex\(\{\s*hutQ: q,\s*hutR: r,\s*ownerId: 0,/.test(fnBody),
    'findVillageRewardSpawnHex wołane z {hutQ: q, hutR: r, ownerId: 0, ...} (piny E5/E6)',
  );
}

// --- summary ---------------------------------------------------------------
const total = passed + failed;
if (failed === 0) {
  console.log('\nVILLAGES-TEST OK (' + passed + '/' + total + ')');
} else {
  console.log('\nVILLAGES-TEST FAIL (' + passed + '/' + total + ' passed, ' + failed + ' failed)');
}

// Clean up temp artifacts
try { fs.unlinkSync(ENTRY_FILE);  } catch (e) {}
try { fs.unlinkSync(BUNDLE_FILE); } catch (e) {}
process.exit(failed === 0 ? 0 : 1);
