// R-RUSTPORT-P6-K5LOOP-WIRING-B-Q1 (#369 czesc B): generator wektorow ZASTOSOWANIA WYNIKU szturmu do stanu gry
// (`rust-port/engine/src/domain/siege_battle_apply.rs::apply_outcome`).
//
// ORAKUL = WYKONANIE TEKSTU PINU 07d2fbd72 (git show, bez kopii logiki), ladowanego jak w `p6_k5loop_wiring_a_gen.mjs`
// (transpileModule + wlasny require po drzewie pinu):
// * `gra/src/game/post-battle-map.ts`: `applyPostBattleMap` (manualSurvivors `:168-189`, weterani `:411-429`,
//   galezie zwyciezcy `:443-463` z `placeFanOutGroup`/`pickRetreatTarget*`, `spendAttackMpOnLive` `:392-402`),
//   `snapshotRosterPositions`, `findCityOnHex`;
// * `gra/src/battle/battleScene.ts`: `BattleScene.prototype._battleUnitsForMapExport` (`:10246-10250`, survivors =
//   `_endSurvivors`, `:9474-9477` remis, `:9495`/`:10225` zwyciezca) — metoda bez `this`, wolana na jednostkach sceny;
// * `gra/src/game/city-fortification.ts`: `cityIsFortified`, `canCaptureCity` (`stormCaptureBlocked`, `main.ts:36622`);
// * `gra/src/game/siegeMachines.ts`: `consumeReadyMachines` (`main.ts:37023`), `clearSiegeMachines` (`endMapSiege`);
// * `gra/src/game/diplomacy-siege-war-gate.ts`: `isSiegeStillValid` (`validateActiveSieges`, `main.ts:18019-18037`).
// Klej z `main.ts` (domkniecia, nieladowalne bez calej gry) przepisany 1:1 z cytatem linii: `retreatHexPassable`
// (`:33765-33775`), `isOccupiedHex` (`:33777-33779`), `areEnemyOwners` (`:13129-13133`, bez barbarzyncow: D-ADP-L-BARB),
// `endMapSiege` w zakresie pol stanu (`:17880-17899`: `oblegane = false`, `clearSiegeMachines`), kolejnosc wywolan
// `finishSiegeStormBattle` (`:36596-36690`) -> `applyMapBattleOutcome` (`:34431-34730`).
//
// D-WIRB-3 (hak T8): wygrana atakujacego z wylomem w pinie wchodzi do galezi `wipeDefenderOnCityCenter` +
// `retreatDefendersAfterAtkWin` + `moveAtkRosterOntoBattleHex` + `applyCityCaptureToMap`. Czesc B nie wykonuje
// wejscia na heks ani zdobycia (zwraca `captureRequested`). Wektor dla takich scenariuszy liczy wiec `applyPostBattleMap`
// z `holdPositionAfterWin: true` (ta sama czesc wspolna: survivors, weterani, punkt ruchu; bez ruchu jednostek) i zapisuje
// `t8 = true`; pelny wynik pinu (pozycje po wejsciu na heks) jest w `t8Reference` dla tematu #354.
//
// Uruchomienie: node rust-port/engine/tests/p6_k5loop_wiring_b_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_k5loop_wiring_b_vectors/vectors.json + MD5 na stdout.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
// SHA-256 tekstu pinu wykonanego przez generator (sciezka + tresc kazdego zaladowanego pliku, kolejnosc ladowania).
const EXPECTED_SHA256 = process.env.WIRING_B_SHA256_OVERRIDE ?? 'cf81ec14ae6a8b84ea6c680169caf0fe62f8850cbf2b194ffa48a39f58973505';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const TS_JS = process.env.TYPESCRIPT_JS ?? '/opt/node22/lib/node_modules/typescript/lib/typescript.js';
const ts = createRequire(import.meta.url)(TS_JS);

const showCache = new Map();
const show = (p) => {
  if (showCache.has(p)) return showCache.get(p);
  let out = null;
  try {
    out = execFileSync('git', ['show', `${PIN}:${p}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 1 << 27, stdio: ['ignore', 'pipe', 'ignore'] });
  } catch { out = null; }
  showCache.set(p, out);
  return out;
};

// --- atrapa renderu/DOM (jak wiring_a) -----------------------------------------------------------------------------
function makeStub(name = 'stub') {
  const cache = Object.create(null);
  const fn = function () {};
  return new Proxy(fn, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return (hint) => (hint === 'string' ? '' : 0);
      if (p === Symbol.iterator) return function* () {};
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'toString') return () => '';
      if (p === 'valueOf') return () => 0;
      if (p === 'prototype') return t.prototype;
      if (!(p in cache)) cache[p] = makeStub(`${name}.${String(p)}`);
      return cache[p];
    },
    set(t, p, v) { cache[p] = v; return true; },
    apply() { return makeStub(`${name}()`); },
    construct() { return makeStub(`new ${name}`); },
    has() { return true; },
  });
}
globalThis.window = makeStub('window');
globalThis.document = makeStub('document');
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = () => {};
globalThis.localStorage = { getItem: () => null, setItem() {}, removeItem() {} };
Math.random = () => { throw new Error('Math.random w zastosowaniu wyniku (oczekiwane: brak)'); };

const hash = createHash('sha256');
const hashed = new Set();
const transpile = (p, src) => ts.transpileModule(src, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, esModuleInterop: true, preserveConstEnums: true, isolatedModules: true },
  fileName: p,
}).outputText
  .replace(/import\.meta\.glob/g, '(() => ({}))')
  .replace(/import\.meta/g, "({ env: { DEV: false, PROD: true, MODE: 'production', BASE_URL: '/' }, url: 'file:///pin/' })");
const modCache = new Map();
function load(p) {
  if (modCache.has(p)) return modCache.get(p).exports;
  const src = show(p);
  if (src === null) throw new Error('brak w pinie: ' + p);
  if (!hashed.has(p)) { hashed.add(p); hash.update(p + '\n' + src); }
  const mod = { exports: {} };
  modCache.set(p, mod);
  if (p.endsWith('.json')) { mod.exports = JSON.parse(src); return mod.exports; }
  const req = (spec) => {
    if (spec === 'three' || spec.startsWith('three/')) return makeStub('THREE');
    if (/[?](raw|url|worker)/.test(spec) || /\.(css|svg|png|jpg|glsl|txt|md|mp3|ogg|wav)$/.test(spec)) return { __esModule: true, default: '' };
    if (!spec.startsWith('.')) return makeStub(spec);
    const base = posix.normalize(posix.join(posix.dirname(p), spec.replace(/\.ts$/, '')));
    for (const c of [base + '.ts', base, base + '/index.ts']) {
      if ((c.endsWith('.ts') || c.endsWith('.json')) && show(c) !== null) return load(c);
    }
    throw new Error('nie rozwiazano ' + spec + ' z ' + p);
  };
  new Function('module', 'exports', 'require', transpile(p, src))(mod, mod.exports, req);
  return mod.exports;
}

const PBM = load('gra/src/game/post-battle-map.ts');
const FORT = load('gra/src/game/city-fortification.ts');
const MACH = load('gra/src/game/siegeMachines.ts');
const GATE = load('gra/src/game/diplomacy-siege-war-gate.ts');
const SCENE = load('gra/src/battle/battleScene.ts');
const exportSurvivors = SCENE.BattleScene.prototype._battleUnitsForMapExport;
const shaHex = hash.digest('hex');
if (EXPECTED_SHA256 !== 'UZUPELNIJ' && shaHex !== EXPECTED_SHA256) {
  throw new Error(`SHA-256 tekstu pinu ${shaHex} != ${EXPECTED_SHA256}`);
}

// --- scenariusze ---------------------------------------------------------------------------------------------------
// Mapa W x H (heksy osiowe q = x, r = y), woda = nieprzejezdna. Miasto (oblegane) na (5,4). Gracz 1 oblega miasto 101.
const W = 10;
const H = 9;
const CITY = { id: 900, q: 5, r: 4, ownerId: 101 };
const u = (id, ownerId, typeId, category, q, r, extra = {}) => ({
  id, ownerId, typeId, category, q, r, hp: extra.hp ?? 10, ruchLeft: extra.ruchLeft ?? 1, ruch: 1,
  ...(extra.bs !== undefined ? { battlesSurvived: extra.bs } : {}),
});
// Jednostki: atakujacy (owner 1) na (6,4) i (6,3), obroncy (owner 101) w miescie (5,4) i na (4,4).
const base = () => [
  u(7001, 1, 'Wojownik', 'miecznik', 6, 4, { hp: 12, bs: 3 }),
  u(7002, 1, 'Wojownik', 'miecznik', 6, 4, { hp: 9, bs: 1.5 }),
  u(7003, 1, 'Łucznik', 'lucznik', 6, 3, { hp: 7, bs: 2.7 }),
  u(7004, 1, 'Osadnik', 'osadnik', 6, 4, { hp: 5 }),
  u(7005, 1, 'Wojownik', 'miecznik', 6, 3, { hp: 10, bs: 3 }),
  u(8001, 101, 'Wojownik', 'miecznik', 5, 4, { hp: 11 }),
  u(8002, 101, 'Łucznik', 'lucznik', 5, 4, { hp: 6, bs: 1 }),
  u(8003, 101, 'Wojownik', 'miecznik', 4, 4, { hp: 8 }),
];
// Scena: atakujacy 7001,7002,7003 (7004 cywil i 7005 poza limitem pola = rezerwa), obroncy 8001,8002 + milicja m1
// (8003 rezerwa). Wynik sceny: hp/dead/routed na jednostkach sceny.
const SCENARIOS = [
  { name: 'atk_wylom_hak_t8', winner: 'atakujacy', breached: true, machines: ['taran'],
    scene: { atk: [[7001, 8, false, false], [7002, 0, true, false], [7003, 4, true, true]], def: [[8001, 0, true, false], [8002, 3, true, true], ['m1', 0, true, false]] } },
  { name: 'atk_bez_wylomu_mur_stoi', winner: 'atakujacy', breached: false, machines: [],
    scene: { atk: [[7001, 5, false, false], [7002, 9, false, false], [7003, 7, false, false]], def: [[8001, 0, true, false], [8002, 0, true, false], ['m1', 0, true, false]] } },
  { name: 'obronca_wygrywa', winner: 'obronca', breached: true, machines: ['taran', 'wieza'],
    scene: { atk: [[7001, 0, true, false], [7002, 2, true, true], [7003, 7, false, false]], def: [[8001, 4, false, false], [8002, 0, true, true], ['m1', 3, false, false]] } },
  { name: 'remis_rozejscie', winner: 'remis', breached: false, machines: ['wieza'],
    scene: { atk: [[7001, 6, false, false], [7002, 1, true, true], [7003, 0, true, false]], def: [[8001, 2, false, false], [8002, 5, false, false], ['m1', 4, false, false]] } },
  { name: 'remis_woda_zajete', winner: 'remis', breached: true, machines: [], water: [[7, 4], [7, 3], [3, 4], [8, 5]],
    extra: [u(9001, 1, 'Wojownik', 'miecznik', 8, 4), u(9002, 101, 'Wojownik', 'miecznik', 4, 5)],
    scene: { atk: [[7001, 6, false, false], [7002, 9, false, false], [7003, 7, false, false]], def: [[8001, 2, false, false], [8002, 5, false, false], ['m1', 4, false, false]] } },
  // 9003: jednostka oblegajacego NA heksie miasta (spoza rosteru): `isSiegeStillValid` liczy tylko odleglosc 1.
  { name: 'obronca_brak_wojsk_przy_murach', winner: 'obronca', breached: false, machines: [],
    atkOnly: [7001, 7002], extra: [u(9003, 1, 'Wojownik', 'miecznik', 5, 4)],
    scene: { atk: [[7001, 0, true, false], [7002, 0, true, true]], def: [[8001, 4, false, false], [8002, 6, false, false], ['m1', 3, false, false]] } },
  { name: 'atk_wylom_pokoj_konczy_oblezenie', winner: 'atakujacy', breached: true, machines: [], peace: true,
    scene: { atk: [[7001, 8, false, false], [7002, 9, false, false], [7003, 4, false, false]], def: [[8001, 0, true, false], [8002, 0, true, false], ['m1', 0, true, false]] } },
];

const key = (q, r) => q + ',' + r;
function run(sc) {
  const water = new Set((sc.water ?? []).map(([q, r]) => key(q, r)));
  let units = base();
  if (sc.atkOnly) units = units.filter((x) => x.ownerId !== 1 || sc.atkOnly.includes(x.id));
  units.push(...(sc.extra ?? []).map((x) => ({ ...x })));
  const startUnits = units.map((x) => ({ ...x }));
  const city = { ...CITY, maMur: true, oblegane: true, siegeMachines: { queue: [], ready: [...sc.machines], buildProgress: 0 } };
  const cities = [city];
  const atWar = !sc.peace;
  // `areEnemyOwners` (`main.ts:13129-13133`): stan wojny w dyplomacji (gracz 1 <-> 101).
  const areEnemies = (a, b) => a !== b && atWar && ((a === 1 && b === 101) || (a === 101 && b === 1));
  // `mapHexPassableForUnit && !besiegedCityAtHex` (`main.ts:33765-33775`).
  const retreatHexPassable = (q, r) => q >= 0 && r >= 0 && q < W && r < H && !water.has(key(q, r))
    && !cities.some((c) => c.q === q && c.r === r && c.oblegane === true);
  // `isOccupiedHex` (`main.ts:33777-33779`).
  const isOccupiedHex = (q, r, exceptId) => units.some((x) => x.q === q && x.r === r && x.id !== exceptId);
  // Rostery (`atkRosterRef`/`defRosterRef`): obiekty jednostek (pozycje zyja w obiektach), milicja i machiny wirtualne.
  const byId = new Map(units.map((x) => [x.id, x]));
  const atkRoster = [7001, 7002, 7003, 7004, 7005].filter((id) => byId.has(id)).map((id) => byId.get(id));
  for (const [i, m] of sc.machines.entries()) {
    atkRoster.push({ id: 'siege-' + m + '-' + i, ownerId: 1, typeId: m === 'taran' ? 'Taran' : 'Wieża oblężnicza', category: 'obleznicza', q: 6, r: 4, hp: 20, ruchLeft: 1, ruch: 1 });
  }
  const defRoster = [8001, 8002, 8003].map((id) => byId.get(id));
  defRoster.push({ id: 'm1', ownerId: 101, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 4, hp: 10, ruchLeft: 0, ruch: 0, isMilitia: true });
  const atkStart = PBM.snapshotRosterPositions(atkRoster);
  // `consumeReadyMachines(city)` (`main.ts:37023`).
  const consumed = MACH.consumeReadyMachines(city);
  const stormCaptureBlocked = sc.winner === 'atakujacy' && !FORT.canCaptureCity(FORT.cityIsFortified(city.maMur, ['mury']), sc.breached);
  // Jednostki sceny i `_endSurvivors`.
  const sceneSide = (list) => list.map(([id, hp, dead, routed]) => ({ bu: { id, hp }, dead, routed }));
  const sA = sceneSide(sc.scene.atk);
  const sD = sceneSide(sc.scene.def);
  const survivors = sc.winner === 'remis'
    ? [...exportSurvivors(sA), ...exportSurvivors(sD)]
    : exportSurvivors(sc.winner === 'atakujacy' ? sA : sD);
  const t8 = sc.winner === 'atakujacy' && !stormCaptureBlocked;
  const input = (us, hold) => ({
    units: us, map: {}, cities, battleQ: city.q, battleR: city.r,
    atkAnchor: atkRoster[0], atkRoster, defRoster, atkStart, winner: sc.winner,
    battleEventLog: { attackerUnitIds: sA.map((x) => x.bu.id), defenderUnitIds: sD.map((x) => x.bu.id) },
    manualSurvivors: survivors.map((s) => ({ id: String(s.id), hp: s.hp })),
    getDef: () => ({}), maxHpOf: () => 1,
    isPassableHex: retreatHexPassable, isUnitAt: isOccupiedHex,
    cityOnBattleHex: PBM.findCityOnHex(cities, city.q, city.r) ?? null,
    holdPositionAfterWin: hold,
  });
  let t8Reference = null;
  if (t8) {
    // Pelny wynik pinu (galaz zdobycia) na kopii — tylko referencja dla #354.
    const copy = units.map((x) => ({ ...x }));
    const save = new Map(atkRoster.concat(defRoster).map((x) => [x, { q: x.q, r: x.r }]));
    PBM.applyPostBattleMap({ ...input(copy, false), atkRoster: atkRoster.map((x) => copy.find((c) => c.id === x.id) ?? x), defRoster: defRoster.map((x) => copy.find((c) => c.id === x.id) ?? x), atkAnchor: copy.find((c) => c.id === atkRoster[0].id) ?? atkRoster[0] });
    for (const [x, p] of save) { x.q = p.q; x.r = p.r; }
    t8Reference = copy.map((x) => ({ id: x.id, q: x.q, r: x.r }));
  }
  PBM.applyPostBattleMap(input(units, stormCaptureBlocked || t8));
  // `validateActiveSieges` (`main.ts:18019-18037`) dla szturmowanego miasta; oblegajacy = `atkRoster[0].ownerId`.
  let siegeEnded = false;
  const endMapSiege = () => { city.oblegane = false; MACH.clearSiegeMachines(city); siegeEnded = true; };
  if (city.oblegane && !GATE.isSiegeStillValid(city, atkRoster[0].ownerId, units, areEnemies)) endMapSiege();
  // `afterSiegeUi` remis -> `endMapSiege(city.id)` (`main.ts:36660`).
  if (sc.winner === 'remis') endMapSiege();
  return {
    name: sc.name,
    input: {
      w: W, h: H, water: sc.water ?? [], peace: !!sc.peace, city: CITY, machines: sc.machines,
      units: startUnits, atkRoster: atkRoster.map((x) => ({ id: String(x.id), ownerId: x.ownerId, typeId: x.typeId, category: x.category, q: atkStart.get(x.id).q, r: atkStart.get(x.id).r })),
      defRoster: [...defRoster.map((x) => ({ id: String(x.id), ownerId: x.ownerId, typeId: x.typeId, category: x.category, q: x === defRoster[3] ? 5 : startUnits.find((s) => s.id === x.id).q, r: x === defRoster[3] ? 4 : startUnits.find((s) => s.id === x.id).r }))],
      winner: sc.winner, breached: sc.breached,
      scene: { atk: sc.scene.atk.map(([id, hp, dead, routed]) => ({ id: String(id), hp, dead, routed })), def: sc.scene.def.map(([id, hp, dead, routed]) => ({ id: String(id), hp, dead, routed })) },
    },
    expected: {
      units: units.map((x) => ({ id: x.id, q: x.q, r: x.r, hp: x.hp, ruchLeft: x.ruchLeft, battlesSurvived: x.battlesSurvived ?? null })),
      consumed, captureBlocked: stormCaptureBlocked, t8, oblegane: city.oblegane === true,
      machinesReady: city.siegeMachines?.ready ?? [], siegeEnded,
    },
    t8Reference,
  };
}

const vectors = { pin: PIN, pinSha256: shaHex, scenarios: SCENARIOS.map(run) };
const outDir = join(here, 'p6_k5loop_wiring_b_vectors');
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(vectors, null, 1) + '\n';
writeFileSync(join(outDir, 'vectors.json'), text);
console.log('pinSha256', shaHex);
console.log('vectors.json md5', createHash('md5').update(text).digest('hex'));
