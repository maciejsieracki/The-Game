'use strict';
/** map-field-battle-test.cjs — F-P1-01 lane C (mapFieldBattle + rosters) */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.join(__dirname, '.map-field-battle-entry.ts');
const OUT = path.join(__dirname, '.map-field-battle-bundle.cjs');
const MUZYKA_STUB = path.resolve(__dirname, '.stubs', 'map-field-battle-muzyka-stub.ts');

// mapFieldBattle.ts -> audio/muzyka-antyczna.ts -> audio/filePlayer.ts, który używa
// `import.meta.glob` (mechanizm Vite; esbuild/Node tego nie ma) do odkrywania plików
// .mp3 na dysku przy ewaluacji modułu — TypeError przed jakąkolwiek asercją. Wzorzec
// (stub całego muzyka-antyczna.ts na granicy importu, nie samego filePlayer.ts) jak
// w audio-stub.ts / recruit-strip-muzyka-stub.ts, używanych przez inne bramki z tym
// samym transytywnym problemem.
const stubMuzykaPlugin = {
  name: 'stub-muzyka',
  setup(build) {
    build.onResolve({ filter: /audio\/muzyka-antyczna$/ }, () => ({ path: MUZYKA_STUB }));
  },
};

fs.writeFileSync(
  ENTRY,
  [
    "export { collectBattleRoster, collectAtkRosterNearCity, shouldIncludeInBattleRoster } from '../src/units/battleRoster';",
    "export { collectCityDefRoster, defenderSideTitle, hasCityDefenders } from '../src/game/siegeDefenders';",
    "export { validateOpenCityFieldBattle, planOpenCityFieldBattle } from '../src/battle/mapFieldBattle';",
    "export { resolveEnemyCityClick } from '../src/map/map-attack-city';",
  ].join('\n'),
  'utf8',
);

// esbuild.buildSync() nie przyjmuje pluginów ("Cannot use plugins in synchronous
// API calls") — stubMuzykaPlugin wymaga async esbuild.build(), więc cała reszta
// pliku (dawniej top-level) jedzie teraz w main() poniżej.
async function main() {

await esbuild.build({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: OUT,
  absWorkingDir: path.resolve(__dirname, '..'),
  plugins: [stubMuzykaPlugin],
  logLevel: 'silent',
});

const {
  collectBattleRoster,
  collectAtkRosterNearCity,
  shouldIncludeInBattleRoster,
  collectCityDefRoster,
  defenderSideTitle,
  hasCityDefenders,
  validateOpenCityFieldBattle,
  planOpenCityFieldBattle,
  resolveEnemyCityClick,
} = require(OUT);

let ok = 0;
let fail = 0;

function assert(c, msg) {
  if (c) {
    console.log('  [OK]', msg);
    ok++;
  } else {
    console.error('  [FAIL]', msg);
    fail++;
  }
}

const openCity = {
  id: 'c-open',
  ownerId: 1,
  q: 6,
  r: 0,
  name: 'Sparta',
  maMur: false,
  population: 10,
  garnizon: 0,
};
const walledCity = { ...openCity, id: 'c-wall', maMur: true };
const hastati = {
  id: 'u0',
  ownerId: 0,
  typeId: 'Hastati',
  category: 'miecznik',
  q: 5,
  r: 0,
  ruchLeft: 2,
  ruch: 2,
};
const ally = {
  id: 'u2',
  ownerId: 0,
  typeId: 'Lucznik',
  category: 'lucznik',
  q: 5,
  r: 1,
  ruchLeft: 2,
  ruch: 2,
};
const garrison = {
  id: 'u1',
  ownerId: 1,
  typeId: 'Falanga',
  category: 'wlocznik',
  q: 6,
  r: 0,
  ruchLeft: 0,
  ruch: 2,
};
const scoutNeighbor = {
  id: 'u-scout',
  ownerId: 0,
  typeId: 'Zwiadowca',
  category: 'zwiadowca',
  q: 5,
  r: 1,
  ruchLeft: 2,
  ruch: 3,
};
const warrior2 = {
  id: 'u3',
  ownerId: 0,
  typeId: 'Hastati',
  category: 'miecznik',
  q: 5,
  r: -1,
  ruchLeft: 2,
  ruch: 2,
};

const stubDef = () => ({
  meleeAttack: 8,
  meleeDefence: 7,
  weaponDamage: 8,
  armor: 4,
  piercing: 2,
  chargeBonus: 4,
  health: 20,
  missileAttack: 0,
  'Rola (linia)': 'Wrecz',
});

console.log('map-field-battle-test');

const atkR = collectBattleRoster(hastati, [hastati, ally, garrison], 'attacker');
assert(atkR.length === 2 && atkR.every(u => u.ownerId === 0), 'collectBattleRoster: 2 allies dist<=1');

const atkWithScout = collectBattleRoster(hastati, [hastati, ally, scoutNeighbor, warrior2], 'attacker');
// Kontrola ZBIORU ID zamiast licznika (runda 2, ratyfikacja orkiestratora 2026-09-05).
// Stary warunek `length === 2` czerwienil sie na POPRAWNYM rosterze 3-elementowym: fixture
// ma czwarta, NIEcywilna jednostke `warrior2` (Hastati, ownerId 0) w dystansie 1 od kotwicy,
// a kontrakt pola to „heks kotwicy + wlasne jednostki w promieniu 1 heksa". Wersja zbiorowa
// jest MOCNIEJSZA, nie slabsza: stary licznik przechodzil takze wtedy, gdy roster zgubil
// dowolne dwie jednostki, nowa wymaga imiennie, ze wypadl dokladnie zwiadowca i nikt poza nim.
const atkWithScoutIds = new Set(atkWithScout.map(u => u.id));
assert(!atkWithScoutIds.has(scoutNeighbor.id), 'collectBattleRoster atk: adjacent scout excluded');
assert(
  atkWithScoutIds.has(hastati.id) && atkWithScoutIds.has(ally.id) && atkWithScoutIds.has(warrior2.id),
  'collectBattleRoster atk: pozostale trzy jednostki bojowe ZOSTAJA w rosterze',
);

const atkNear = collectAtkRosterNearCity(openCity, hastati, [hastati, ally, scoutNeighbor]);
assert(atkNear.length === 2 && !atkNear.some(u => u.typeId === 'Zwiadowca'),
  'collectAtkRosterNearCity: adjacent scout excluded');

// PARYTET RODZINY (runda 2). Dla WSPOLNEJ kotwicy stojacej na heksie miasta obie funkcje
// licza z tego samego punktu (battleHex == kotwica == miasto), wiec musza zwrocic identyczny
// ZBIOR ID — porownujemy zbiory, nie listy, bo kolejnosc moze sie roznic. Parytet zachodzi
// juz dzis; ta asercja go utrwala, zeby funkcje nie rozjechaly sie w przyszlosci.
// `size > 1` broni przed tautologia „oba zbiory puste".
const parityAnchor = { ...hastati, id: 'u-anchor-city', q: openCity.q, r: openCity.r };
const parityUnits = [parityAnchor, hastati, ally, scoutNeighbor, warrior2, garrison];
const parityField = new Set(collectBattleRoster(parityAnchor, parityUnits, 'attacker').map(u => u.id));
const parityCity = new Set(collectAtkRosterNearCity(openCity, parityAnchor, parityUnits).map(u => u.id));
assert(
  parityField.size > 1 &&
    parityField.size === parityCity.size &&
    [...parityField].every(id => parityCity.has(id)),
  'parytet collectBattleRoster == collectAtkRosterNearCity (zbior ID, kotwica na heksie miasta)',
);

const cityScoutDef = {
  id: 'u-scout-def',
  ownerId: 1,
  typeId: 'Zwiadowca',
  category: 'zwiadowca',
  q: 6,
  r: 1,
  ruchLeft: 2,
  ruch: 3,
};
const defNearCity = collectCityDefRoster(openCity, [garrison, cityScoutDef]);
assert(defNearCity.roster.length === 1 && defNearCity.roster[0].typeId === 'Falanga',
  'collectCityDefRoster: adjacent defender scout excluded');

const defOnCityScout = {
  ...cityScoutDef,
  id: 'u-scout-city',
  q: 6,
  r: 0,
};
const defCityScout = collectCityDefRoster(openCity, [garrison, defOnCityScout]);
assert(defCityScout.roster.length === 2 && defCityScout.roster.some(u => u.typeId === 'Zwiadowca'),
  'collectCityDefRoster: scout ON city hex included');

assert(
  shouldIncludeInBattleRoster(scoutNeighbor, {
    side: 'attacker',
    anchor: hastati,
    battleHex: { q: 6, r: 0 },
  }) === false,
  'shouldIncludeInBattleRoster: neighbor scout not attacker',
);
assert(
  shouldIncludeInBattleRoster(hastati, {
    side: 'attacker',
    anchor: hastati,
    battleHex: { q: 6, r: 0 },
  }) === true,
  'shouldIncludeInBattleRoster: combat anchor always in',
);

assert(!hasCityDefenders({ ...openCity, garnizon: 0 }, []), 'empty city no defenders');
assert(hasCityDefenders(openCity, [garrison]), 'garrison unit = defenders');

const emptyDef = collectCityDefRoster({ ...openCity, garnizon: 0 }, []);
assert(emptyDef.roster.length === 0, 'collectCityDefRoster: no garrison no units');

const milDef = collectCityDefRoster({ ...openCity, garnizon: 3 }, []);
assert(milDef.roster.length === 1 && milDef.roster[0].typeId === 'Milicja', 'collectCityDefRoster: militia synth');
assert(milDef.militiaDefs.has('militia-c-open'), 'collectCityDefRoster: militia def map');

const milTitle = defenderSideTitle(openCity, milDef.roster);
assert(milTitle.startsWith('Milicja'), 'defenderSideTitle: militia label');

assert(validateOpenCityFieldBattle(walledCity, hastati) !== null, 'validate: walled rejected');
assert(validateOpenCityFieldBattle(openCity, hastati) === null, 'validate: open OK');

const plan = planOpenCityFieldBattle(
  { attacker: hastati, ctx: { tryb: 'bitwa_polowa', city: openCity, atakujacy: hastati, garnizonUnit: garrison, oblegajacyOwnerId: 0 } },
  openCity,
  hastati,
  [hastati, garrison],
  {
    turn: 3,
    getTerrainAt: () => 'Rownina',
    getStructBonus: () => 0,
    unitDefFor: stubDef,
    // fortifyScaledDefFor brakowało w tym fixture (deps object) od zawsze — TypeError
    // "powerScaledDefFor is not a function" w preBattleSzanseAtkPct, niezwiazany z
    // import.meta.glob; test-only uzupelnienie kontraktu MapFieldBattleLaunchDeps,
    // bez ingerencji w gra/src. Patrz raport rundy 1 (osobne znalezisko).
    fortifyScaledDefFor: stubDef,
    unitHealth: d => d.health,
    unitAtak: d => d.meleeAttack,
    civLabelForOwner: id => (id === 0 ? 'Gracz' : 'AI ' + id),
    terrainCombatData: [],
  },
);
assert(plan !== null && plan.preBattle.miejsce === 'Sparta', 'planOpenCityFieldBattle: miejsce = city name');
assert(plan.preBattle.canRetreat === true, 'planOpenCityFieldBattle: canRetreat');
assert(!plan.preBattle.miejsce.includes('mur'), 'planOpenCityFieldBattle: no mur suffix');
assert(plan.defRoster.length === 1, 'planOpenCityFieldBattle: def roster');

const router = resolveEnemyCityClick({
  city: openCity,
  selectedUnit: hastati,
  units: [hastati, garrison],
});
assert(router.kind === 'field_battle', 'router integration: open + defenders → field_battle');

console.log('---', ok, 'ok,', fail, 'fail');
process.exit(fail > 0 ? 1 : 0);

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
