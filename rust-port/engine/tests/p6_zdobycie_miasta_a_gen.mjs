// R-RUSTPORT-P6-ZDOBYCIE-MIASTA-A-Q1 (#354 czesc A): generator wektorow zdobycia miasta po wygranym szturmie gracza
// (`rust-port/engine/src/domain/city_capture_apply.rs::apply_storm_capture`, wolane z `siege_battle_apply::finish`).
//
// ORAKUL = WYKONANIE TEKSTU PINU 07d2fbd72 (git show, bez kopii logiki), ladowanego jak w `p6_k5loop_wiring_b_gen.mjs`:
// * `gra/src/game/post-battle-map.ts`: `applyPostBattleMap` (galaz wygranej `:443-448` z `holdPositionAfterWin =
//   stormCaptureBlocked`), `applyCityCaptureAfterBattle` (P9, `:493-596`, z `applyCapturePopulationLoss` z cities.ts),
//   `snapshotRosterPositions`, `findCityOnHex`;
// * `gra/src/battle/battleScene.ts`: `_battleUnitsForMapExport` (survivors);
// * `gra/src/game/barbarians.ts`: `isCityCaptureBlockedByDefenders` (`:499-507`), `isBarbarian`;
// * `gra/src/game/city-fortification.ts`: `cityIsFortified`, `canCaptureCity`;
// * `gra/src/game/siegeMachines.ts`: `consumeReadyMachines`, `clearSiegeMachines`;
// * `gra/src/game/diplomacy-siege-war-gate.ts`: `isSiegeStillValid` (`validateActiveSieges`);
// * `gra/src/game/wonder-transfer.ts`, `gra/src/map/territory.ts`, `gra/src/game/fort-territory.ts`: watch/settle cudow;
// * `gra/src/game/diplomacy-war-peace-profile.ts`: `recordWarCityLoss`;
// * `gra/src/game/capital-capture.ts`: `applyBarbarianAwareCapitalCapturePlunder`.
// Klej z `main.ts` (domkniecia nieladowalne bez calej gry) przepisany 1:1 z cytatem linii: `applyMapBattleOutcome`
// (`:34462-34745`, galaz zdobycia `:34661-34679`), `applyCityCaptureToMap` (`:36034-36264`, kroki ze stanem gry),
// `beginWonderTransferWatch`/`settleWonderTransfer` (`:4231-4268`), `buildAllTerritoryNodes` (`:5667-5679`),
// `recordWarCityLossForPair` (`:11543-11550`) z `diploEnsureWarStart` (`:11488-11493`), `endMapSiege` (`:17880-17899`,
// pola stanu), `runCapitalCapturePlunder` (`:35558-35780`, galezie stanu: mapa stolic, eliminacja), `eliminateOwner`
// (`:35348`, jednostki, relacje, meta par, mapa stolic), akcesory zasobow (`:34864-34990`), `retreatHexPassable` /
// `isOccupiedHex` (`:33765-33779`), `areEnemyOwners` (`:13129-13133`, bez barbarzyncow: D-ADP-L-BARB).
// Moc ofiary (`buildObjectivePowerForOwner`, tylko eliminacja) NIE jest liczona tutaj (producenci mocy maja wlasne
// wektory POWER-*); wektor zapisuje `lostPowerFromRust: true`.
//
// Uruchomienie: node rust-port/engine/tests/p6_zdobycie_miasta_a_gen.mjs (Node >= 22, TypeScript z /opt/node22 albo
// TYPESCRIPT_JS). Wynik: tests/p6_zdobycie_miasta_a_vectors/vectors.json + MD5 na stdout.


import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
// SHA-256 tekstu pinu wykonanego przez generator (sciezka + tresc kazdego zaladowanego pliku, kolejnosc ladowania).
const EXPECTED_SHA256 = process.env.ZMA_SHA256_OVERRIDE ?? 'a5810e8a71a92c5422914e24de5e00170a7b000250ad6b242e7c4e3411878979';
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
const BARB = load('gra/src/game/barbarians.ts');
const FORT = load('gra/src/game/city-fortification.ts');
const MACH = load('gra/src/game/siegeMachines.ts');
const GATE = load('gra/src/game/diplomacy-siege-war-gate.ts');
const WT = load('gra/src/game/wonder-transfer.ts');
const TERR = load('gra/src/map/territory.ts');
const FTERR = load('gra/src/game/fort-territory.ts');
const DWP = load('gra/src/game/diplomacy-war-peace-profile.ts');
const CC = load('gra/src/game/capital-capture.ts');
const SCENE = load('gra/src/battle/battleScene.ts');
const exportSurvivors = SCENE.BattleScene.prototype._battleUnitsForMapExport;
const shaHex = hash.digest('hex');
if (EXPECTED_SHA256 !== 'UZUPELNIJ' && shaHex !== EXPECTED_SHA256) {
  throw new Error(`SHA-256 tekstu pinu ${shaHex} != ${EXPECTED_SHA256}`);
}

// --- scenariusze ---------------------------------------------------------------------------------------------------
// Mapa W x H (heksy osiowe q = x, r = y). Miasto 900 (oblegane) na (5,4) wlasciciela 101; gracz (stan: 1) oblega.
const W = 10;
const H = 9;
const HUMAN = 1;
const ENEMY = 101;
const u = (id, ownerId, typeId, category, q, r, extra = {}) => ({
  id, ownerId, typeId, category, q, r, hp: extra.hp ?? 10, ruchLeft: extra.ruchLeft ?? 2, ruch: 2,
  ...(extra.bs !== undefined ? { battlesSurvived: extra.bs } : {}),
});
// Atakujacy: kotwica 7001 (ruchLeft 3: `syncStackRuchLeft` ma skutek) + 7002 + osadnik 7004 na (6,4), 7003 i 7005 na (6,3). Obroncy: 8001, 8002 w miescie,
// 8003 na (4,4).
const base = () => [
  u(7001, HUMAN, 'Wojownik', 'miecznik', 6, 4, { hp: 12, ruchLeft: 3 }),
  u(7002, HUMAN, 'Wojownik', 'miecznik', 6, 4, { hp: 9, ruchLeft: 1.5 }),
  u(7003, HUMAN, 'Łucznik', 'lucznik', 6, 3, { hp: 7, ruchLeft: 2 }),
  u(7004, HUMAN, 'Osadnik', 'osadnik', 6, 4, { hp: 5, ruchLeft: 2 }),
  u(7005, HUMAN, 'Wojownik', 'miecznik', 6, 3, { hp: 10, ruchLeft: 0.5 }),
  u(8001, ENEMY, 'Wojownik', 'miecznik', 5, 4, { hp: 11 }),
  u(8002, ENEMY, 'Łucznik', 'lucznik', 5, 4, { hp: 6 }),
  u(8003, ENEMY, 'Wojownik', 'miecznik', 4, 4, { hp: 8 }),
];
const WIN = { atk: [[7001, 8, false, false], [7002, 6, false, false], [7003, 4, false, false]], def: [[8001, 0, true, false], [8002, 2, true, true], ['m1', 0, true, false]] };
const WIN_DEF_LIVE = { atk: [[7001, 8, false, false], [7002, 0, true, false], [7003, 4, false, false]], def: [[8001, 0, true, false], [8002, 3, false, true], ['m1', 0, true, false]] };
const SCENARIOS = [
  // Zwykle miasto (stolica 101 = 901): zdobycie bez lupu, -1 obywatel, obroncy poza miastem odchodza.
  { name: 'zwykle_miasto', breached: true, machines: ['taran'], pop: 3, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN },
  // Ocalaly obronca na centrum (routed; poza ocalalymi zwyciezcy -> usuniety w `applyManualSurvivors`, nie przez
  // `wipeDefenderOnCityCenter` — obrona r1, N2); drugi obronca spoza rosteru sceny na heksie
  // (`units.splice` P9); kotwica + stos wchodza, wspierajacy z (6,3) zostaja.
  { name: 'obronca_na_centrum_i_splice', breached: true, machines: [], pop: 4, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN_DEF_LIVE,
    extra: [u(8004, ENEMY, 'Wojownik', 'miecznik', 5, 4, { hp: 5 })] },
  // N2 (obrona r1): obronca rosteru spoza logu sceny (8003) stoi na centrum miasta -> `wipeDefenderOnCityCenter`;
  // 8004 spoza rosteru na heksie -> `units.splice` P9.
  { name: 'wipe_i_splice', breached: true, machines: [], pop: 3, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN, place: [[8003, 5, 4]],
    extra: [u(8004, ENEMY, 'Wojownik', 'miecznik', 5, 4, { hp: 5 })] },
  // Stolica wyznaczona (900), sukcesja do najstarszego z pozostalych (902 < 905); skarbiec 101 -> gracz, Praca 101 = 0.
  { name: 'stolica_sukcesja', breached: true, machines: ['wieza'], pop: 5, capitals: [[ENEMY, 900]],
    cities: [{ id: 905, q: 1, r: 1, ownerId: ENEMY, pop: 2 }, { id: 902, q: 8, r: 8, ownerId: ENEMY, pop: 1 }],
    treasury: [[HUMAN, 10], [ENEMY, 75.5]], praca: [[HUMAN, 3], [ENEMY, 20]], scene: WIN },
  // Stolica przez fallback „najstarsze miasto” (brak wpisu stolicy): 900 jest najstarsze.
  { name: 'stolica_fallback_najstarsze', breached: true, machines: [], pop: 2, capitals: [],
    cities: [{ id: 950, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], treasury: [[HUMAN, 0], [ENEMY, 40]], scene: WIN },
  // Ostatnie miasto 101: eliminacja (majatek, technologie, jednostki 101 poza miastem znikaja, relacje 101 usuniete).
  { name: 'eliminacja', breached: true, machines: ['taran'], pop: 3, capitals: [[ENEMY, 900]], cities: [],
    treasury: [[HUMAN, 5], [ENEMY, 30]], praca: [[HUMAN, 1], [ENEMY, 12]],
    techs: [[HUMAN, ['rolnictwo']], [ENEMY, ['rolnictwo', 'brąz', 'pismo']]],
    extra: [u(8100, ENEMY, 'Wojownik', 'miecznik', 0, 8)], scene: WIN },
  // Odbicie: miasto zdobyte wczesniej od gracza (capturedFromOwnerId = 1) -> brak straty ludnosci.
  { name: 'odbicie_bez_straty', breached: true, machines: [], pop: 4, capturedFrom: HUMAN, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN },
  // Ludnosc 1: brak straty (`before <= 1`).
  { name: 'ludnosc_1', breached: true, machines: [], pop: 1, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN },
  // Cuda: cud 101 w zasiegu miasta 900 przechodzi na gracza; cud 101 przy miescie 901 zostaje; fort gracza obok.
  { name: 'cuda_terytorium', breached: true, machines: [], pop: 6, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 3 }],
    wonders: [{ wonderId: 'piramidy', q: 5, r: 5, ownerId: ENEMY }, { wonderId: 'kolos', q: 1, r: 2, ownerId: ENEMY }],
    forts: [{ q: 8, r: 2, ownerId: HUMAN, type: 'fort', builtAtTurn: 3, seq: 0 }], scene: WIN },
  // N3 (obrona r1): fort rozstrzyga terytorium cudu. Przed: cud (9,7) w promieniu miasta 900 (pop 7 -> r 7, odleglosc 7)
  // = 101. Po stracie ludnosci (pop 6 -> r 6) heks wypada z promienia miast; rozstrzyga fort gracza (9,8) -> cud
  // przechodzi na gracza. Bez wezlow fortow heks bylby niczyj (brak przekazania).
  { name: 'cuda_fort_decyduje', breached: true, machines: [], pop: 7, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }],
    wonders: [{ wonderId: 'piramidy', q: 9, r: 7, ownerId: ENEMY }],
    forts: [{ q: 9, r: 8, ownerId: HUMAN, type: 'fort', builtAtTurn: 2, seq: 0 }], scene: WIN },
  // Meta pary: wojna trwa od tury 4 (wojnaStartTura), poprzedni rekord tej samej wojny -> utraty 101 += 1.
  { name: 'meta_pary_wojna', breached: true, machines: [], pop: 3, capitals: [[ENEMY, 901]], turn: 9,
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }],
    pairMeta: { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0, wojnaStartTura: 4, wojnaMiasta: { od: 4, utraty: { 101: 1, 1: 2 }, ostatniaTura: 6 } },
    scene: WIN },
  // Pokoj: wygrana z wylomem wchodzi na heks (pin), ale bez zdobycia (`areEnemyOwners` falsz); oblezenie konczy sie.
  { name: 'pokoj_brak_zdobycia', breached: true, machines: [], pop: 3, peace: true, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN },
  // Bez wylomu: mur stoi — brak wejscia i brak zdobycia (hak nie wolany).
  { name: 'bez_wylomu_brak_zdobycia', breached: false, machines: [], pop: 3, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }], scene: WIN },
  // Obronca wygrywa: brak zdobycia.
  { name: 'obronca_wygrywa', winner: 'obronca', breached: true, machines: [], pop: 3, capitals: [[ENEMY, 901]],
    cities: [{ id: 901, q: 1, r: 1, ownerId: ENEMY, pop: 2 }],
    scene: { atk: [[7001, 0, true, false], [7002, 0, true, true], [7003, 3, false, false]], def: [[8001, 4, false, false], [8002, 2, false, false], ['m1', 3, false, false]] } },
];

const key = (q, r) => q + ',' + r;
const cityId = (n) => 'city' + n;
const pairKeyRust = (a, b) => `${Math.min(a, b)}-${Math.max(a, b)}`;
function run(sc) {
  const winner = sc.winner ?? 'atakujacy';
  const units = base();
  units.push(...(sc.extra ?? []).map((x) => ({ ...x })));
  for (const [id, q, r] of sc.place ?? []) { const x = units.find((y) => y.id === id); x.q = q; x.r = r; }
  const startUnits = units.map((x) => ({ ...x }));
  const city = { id: cityId(900), name: 'Twierdza', q: 5, r: 4, ownerId: ENEMY, population: sc.pop, maMur: true, oblegane: true,
    siegeMachines: { queue: [], ready: [...sc.machines], buildProgress: 0 },
    ...(sc.capturedFrom !== undefined ? { capturedFromOwnerId: sc.capturedFrom } : {}) };
  const cities = [city, ...(sc.cities ?? []).map((c) => ({ id: cityId(c.id), name: 'M' + c.id, q: c.q, r: c.r, ownerId: c.ownerId, population: c.pop, maMur: false }))];
  const capitalCityIdByOwner = new Map((sc.capitals ?? []).map(([o, c]) => [o, cityId(c)]));
  const treasury = new Map(sc.treasury ?? []);
  const praca = new Map(sc.praca ?? []);
  const techs = new Map((sc.techs ?? []).map(([o, t]) => [o, new Set(t)]));
  const placedWorldWonders = (sc.wonders ?? []).map((w) => ({ ...w }));
  const fortNodes = (sc.forts ?? []).map((f) => ({ ...f }));
  const turn = sc.turn ?? 1;
  const diplomacyPairMeta = new Map(sc.pairMeta ? [[pairKeyRust(HUMAN, ENEMY), JSON.parse(JSON.stringify(sc.pairMeta))]] : []);
  // Relacje (stan: tylko para gracz-101; pokoj albo wojna).
  const relations = new Map([[pairKeyRust(HUMAN, ENEMY), sc.peace ? 'pokoj' : 'wojna']]);
  const relationOf = (a, b) => relations.get(pairKeyRust(a, b));
  // `areEnemyOwners` (`main.ts:13129-13133`) bez barbarzyncow (D-ADP-L-BARB): stan wojny.
  const areEnemies = (a, b) => a !== b && relationOf(a, b) === 'wojna';
  const everOwned = new Set();
  // `retreatHexPassable` (`main.ts:33765-33775`) i `isOccupiedHex` (`:33777-33779`).
  const retreatHexPassable = (q, r) => q >= 0 && r >= 0 && q < W && r < H
    && !cities.some((c) => c.q === q && c.r === r && c.oblegane === true);
  const isOccupiedHex = (q, r, exceptId) => units.some((x) => x.q === q && x.r === r && x.id !== exceptId);
  const byId = new Map(units.map((x) => [x.id, x]));
  const atkRoster = [7001, 7002, 7003, 7004, 7005].map((id) => byId.get(id));
  for (const [i, m] of sc.machines.entries()) {
    atkRoster.push({ id: 'siege-' + m + '-' + i, ownerId: HUMAN, typeId: m === 'taran' ? 'Taran' : 'Wieża oblężnicza', category: 'obleznicza', q: 6, r: 4, hp: 20, ruchLeft: 1, ruch: 1 });
  }
  const defRoster = [8001, 8002, 8003].map((id) => byId.get(id));
  defRoster.push({ id: 'm1', ownerId: ENEMY, typeId: 'Wojownik', category: 'miecznik', q: 5, r: 4, hp: 10, ruchLeft: 0, ruch: 0, isMilitia: true });
  const atkStart = PBM.snapshotRosterPositions(atkRoster);
  // `consumeReadyMachines(city)` (`main.ts:37023`).
  const consumed = MACH.consumeReadyMachines(city);
  const stormCaptureBlocked = winner === 'atakujacy' && !FORT.canCaptureCity(FORT.cityIsFortified(city.maMur, ['mury']), sc.breached);
  const sceneSide = (list) => list.map(([id, hp, dead, routed]) => ({ bu: { id, hp }, dead, routed }));
  const sA = sceneSide(sc.scene.atk);
  const sD = sceneSide(sc.scene.def);
  const survivors = winner === 'remis'
    ? [...exportSurvivors(sA), ...exportSurvivors(sD)]
    : exportSurvivors(winner === 'atakujacy' ? sA : sD);
  // N2 (obrona r1): obserwacja wykonania pinu (bez logiki): id i pozycje przed/po `applyPostBattleMap` i P9.
  const hexOf = (x) => x.q === city.q && x.r === city.r;
  // `wipeDefenderOnCityCenter` (`post-battle-map.ts:191-199`) usuwa przez `removeUnitById` -> `units.splice`; zapis id
  // usunietych w tym wywolaniu (stos wywolan), bez powielania logiki.
  const wipeRemoved = [];
  units.splice = function (...a) {
    const out = Array.prototype.splice.apply(this, a);
    if (/wipeDefenderOnCityCenter/.test(new Error().stack ?? '')) for (const x of out) wipeRemoved.push(x.id);
    return out;
  };
  const atHexBeforePbm = new Set(units.filter(hexOf).map((x) => x.id));
  // `applyMapBattleOutcome` (`main.ts:34462-34745`): `fortifiedCaptureBlocked = cityCaptureBlocked` (szturm).
  PBM.applyPostBattleMap({
    units, map: {}, cities, battleQ: city.q, battleR: city.r,
    atkAnchor: atkRoster[0], atkRoster, defRoster, atkStart, winner,
    battleEventLog: { attackerUnitIds: sA.map((x) => x.bu.id), defenderUnitIds: sD.map((x) => x.bu.id) },
    manualSurvivors: survivors.map((s) => ({ id: String(s.id), hp: s.hp })),
    getDef: () => ({}), maxHpOf: () => 1,
    isPassableHex: retreatHexPassable, isUnitAt: isOccupiedHex,
    cityOnBattleHex: PBM.findCityOnHex(cities, city.q, city.r) ?? null,
    holdPositionAfterWin: stormCaptureBlocked,
  });
  delete units.splice;
  // `moveAtkRosterOntoBattleHex`: jednostki rosteru atakujacego, ktore znalazly sie na heksie miasta (kolejnosc rosteru).
  const enteredUnitIds = atkRoster
    .filter((x) => !atHexBeforePbm.has(x.id) && units.some((y) => y.id === x.id && hexOf(y)))
    .map((x) => x.id);
  const p9Removed = [];
  let treasuryTaken = 0;
  let techsCopied = [];
  if (winner === 'obronca') {
    // `defLossesThisTurn` / `selectedId` poza zakresem (pola brak w stanie).
  }
  // `main.ts:34661-34677`.
  const atkOwnerForCapture = atkRoster[0]?.ownerId;
  const barbBlocked = atkOwnerForCapture !== undefined
    && BARB.isCityCaptureBlockedByDefenders(atkOwnerForCapture, units, city.q, city.r);
  const cityOnHex = PBM.findCityOnHex(cities, city.q, city.r) ?? null;
  let capture = null;
  const wonderTransfers = [];
  const pinSteps = [];
  // `buildAllTerritoryNodes` (`main.ts:5667-5679`).
  const buildAllTerritoryNodes = () => {
    const cityNodes = cities.map((c) => ({ q: c.q, r: c.r, pop: c.population, level: 1, ownerId: c.ownerId }));
    return fortNodes.length > 0 ? cityNodes.concat(FTERR.fortTerritoryNodes(fortNodes)) : cityNodes;
  };
  // `beginWonderTransferWatch` / `settleWonderTransfer` (`main.ts:4231-4268`, efekty UI pominiete).
  const beginWonderTransferWatch = () => {
    if (placedWorldWonders.length === 0) return null;
    const nodes = buildAllTerritoryNodes();
    return WT.snapshotWonderTerritoryOwners(placedWorldWonders, (q, r) => TERR.territoryOwnerAt(q, r, nodes));
  };
  const settleWonderTransfer = (before) => {
    if (!before || placedWorldWonders.length === 0) return 0;
    const nodes = buildAllTerritoryNodes();
    const after = WT.snapshotWonderTerritoryOwners(placedWorldWonders, (q, r) => TERR.territoryOwnerAt(q, r, nodes));
    const plan = WT.planWonderTransfers(placedWorldWonders, before, after);
    if (plan.length === 0) return 0;
    for (const t of plan) wonderTransfers.push(t.wonderId);
    return WT.applyWonderTransfers(placedWorldWonders, plan);
  };
  // `recordWarCityLossForPair` (`main.ts:11543-11550`) + `diploEnsureWarStart` (`:11488-11493`) + `getDiploPairMeta`.
  const getMeta = (a, b) => {
    const k = pairKeyRust(a, b);
    if (!diplomacyPairMeta.has(k)) diplomacyPairMeta.set(k, { trustPnGainedThisTurn: 0, dobraWolaRemainingTur: 0 });
    return diplomacyPairMeta.get(k);
  };
  const recordWarCityLossForPair = (oldOwner, newOwner) => {
    if (oldOwner === newOwner) return;
    if (relationOf(oldOwner, newOwner) !== 'wojna') return;
    let meta = getMeta(oldOwner, newOwner);
    let od;
    if (meta.wojnaStartTura !== undefined) od = meta.wojnaStartTura;
    else { diplomacyPairMeta.set(pairKeyRust(oldOwner, newOwner), { ...meta, wojnaStartTura: turn }); od = turn; }
    meta = getMeta(oldOwner, newOwner);
    const rec = DWP.recordWarCityLoss(meta.wojnaMiasta, od, String(oldOwner), turn);
    diplomacyPairMeta.set(pairKeyRust(oldOwner, newOwner), { ...meta, wojnaMiasta: rec });
  };
  // Akcesory (`main.ts:34864-34990`, `Math.max(0, v)` w zapisach); nauka/Spichlerz poza stanem portu (brak wpisow).
  const access = {
    getTreasury: (o) => treasury.get(o) ?? 0,
    setTreasury: (o, v) => { treasury.set(o, Math.max(0, v)); },
    getPracaPool: (o) => praca.get(o) ?? 0,
    setPracaPool: (o, v) => { praca.set(o, Math.max(0, v)); },
    getNaukaPool: () => 0,
    setNaukaPool: () => {},
    getResearchedTechs: (o) => techs.get(o) ?? new Set(),
    addResearchedTechs: (o, ids) => { if (!techs.has(o)) techs.set(o, new Set()); for (const id of ids) techs.get(o).add(id); },
  };
  let eliminated = null;
  let capitalEvent = null;
  // `eliminateOwner` (`main.ts:35348`): jednostki (`disbandOwnerUnits`), relacje pary, `capitalCityIdByOwner`.
  const eliminateOwner = (o) => {
    for (let i = units.length - 1; i >= 0; i--) if (units[i].ownerId === o) units.splice(i, 1);
    for (const k of [...relations.keys()]) if (k.split('-').map(Number).includes(o)) relations.delete(k);
    for (const k of [...diplomacyPairMeta.keys()]) if (k.split('-').map(Number).includes(o)) diplomacyPairMeta.delete(k);
    capitalCityIdByOwner.delete(o);
    eliminated = o;
  };
  // `runCapitalCapturePlunder` (`main.ts:35558-35780`) w zakresie stanu.
  const runCapitalCapturePlunder = (c, oldOwner, newOwner) => {
    const designated = capitalCityIdByOwner.get(oldOwner) ?? undefined;
    const outcome = CC.applyBarbarianAwareCapitalCapturePlunder(c, oldOwner, newOwner, cities, access, designated, BARB.isBarbarian);
    if (!outcome) return;
    if (outcome.event === 'przejecie_stolicy') {
      capitalEvent = 'przejecieStolicy';
      if (outcome.newCapitalIdForOldOwner) capitalCityIdByOwner.set(oldOwner, outcome.newCapitalIdForOldOwner);
      else capitalCityIdByOwner.delete(oldOwner);
      return;
    }
    capitalEvent = 'eliminacja';
    eliminateOwner(oldOwner);
  };
  if (
    winner === 'atakujacy' && cityOnHex && cityOnHex.ownerId !== atkRoster[0]?.ownerId && atkRoster[0] !== undefined
    && areEnemies(atkRoster[0].ownerId, cityOnHex.ownerId) && !barbBlocked && !stormCaptureBlocked
  ) {
    // `applyCityCaptureToMap` (`main.ts:36034-36264`).
    const atkOwner = atkRoster[0].ownerId;
    const oldOwner = city.ownerId;
    const popBefore = city.population;
    const watch = beginWonderTransferWatch();
    const idsBeforeP9 = units.map((x) => x.id);
    const atHexBeforeP9 = new Set(units.filter(hexOf).map((x) => x.id));
    PBM.applyCityCaptureAfterBattle(city, atkRoster, atkOwner, units, atkRoster[0].id, {});
    // `units.splice` P9 idzie od konca tablicy.
    const idsAfterP9 = new Set(units.map((x) => x.id));
    for (let i = idsBeforeP9.length - 1; i >= 0; i--) if (!idsAfterP9.has(idsBeforeP9[i])) p9Removed.push(idsBeforeP9[i]);
    for (const x of atkRoster) {
      if (!atHexBeforeP9.has(x.id) && units.some((y) => y.id === x.id && hexOf(y)) && !enteredUnitIds.includes(x.id)) enteredUnitIds.push(x.id);
    }
    settleWonderTransfer(watch);
    // `maybeResolveRegularWarOnCityCapture`: gracz po stronie pary = no-op (Q3, `:35986-35989`).
    recordWarCityLossForPair(oldOwner, atkOwner);
    everOwned.add(atkOwner);
    // `endMapSiege` (`:17880-17899`).
    city.oblegane = false;
    MACH.clearSiegeMachines(city);
    const trBefore = access.getTreasury(atkOwner);
    const techBefore = new Set(access.getResearchedTechs(atkOwner));
    runCapitalCapturePlunder(city, oldOwner, atkOwner);
    treasuryTaken = access.getTreasury(atkOwner) - trBefore;
    techsCopied = [...access.getResearchedTechs(atkOwner)].filter((t) => !techBefore.has(t)).sort();
    capture = { oldOwner, newOwner: atkOwner, popBefore, popAfter: city.population };
  }
  // `validateActiveSieges` (`main.ts:34744`) dla szturmowanego miasta.
  if (city.oblegane && !GATE.isSiegeStillValid(city, atkRoster[0].ownerId, units, areEnemies)) {
    city.oblegane = false;
    MACH.clearSiegeMachines(city);
  }
  return {
    name: sc.name,
    input: {
      w: W, h: H, peace: !!sc.peace, turn, city: { id: 900, q: 5, r: 4, ownerId: ENEMY, pop: sc.pop },
      capturedFrom: sc.capturedFrom ?? null,
      cities: (sc.cities ?? []), capitals: (sc.capitals ?? []), machines: sc.machines,
      treasury: sc.treasury ?? [], praca: sc.praca ?? [], techs: sc.techs ?? [],
      wonders: sc.wonders ?? [], forts: sc.forts ?? [], pairMeta: sc.pairMeta ?? null,
      units: startUnits,
      atkRoster: atkRoster.map((x) => ({ id: String(x.id), ownerId: x.ownerId, typeId: x.typeId, category: x.category, q: atkStart.get(x.id).q, r: atkStart.get(x.id).r })),
      defRoster: defRoster.map((x) => ({ id: String(x.id), ownerId: x.ownerId, typeId: x.typeId, category: x.category, q: x.id === 'm1' ? 5 : startUnits.find((s) => s.id === x.id).q, r: x.id === 'm1' ? 4 : startUnits.find((s) => s.id === x.id).r })),
      winner, breached: sc.breached,
      scene: { atk: sc.scene.atk.map(([id, hp, dead, routed]) => ({ id: String(id), hp, dead, routed })), def: sc.scene.def.map(([id, hp, dead, routed]) => ({ id: String(id), hp, dead, routed })) },
    },
    expected: {
      units: units.map((x) => ({ id: x.id, q: x.q, r: x.r, hp: x.hp, ruchLeft: x.ruchLeft })),
      captured: capture !== null,
      cities: cities.map((c) => ({ id: Number(c.id.slice(4)), ownerId: c.ownerId, pop: c.population, capturedFromOwnerId: c.capturedFromOwnerId ?? null })),
      oblegane: city.oblegane === true,
      machinesReady: city.siegeMachines?.ready ?? [],
      consumed,
      capitals: [...capitalCityIdByOwner.entries()].map(([o, c]) => [o, Number(c.slice(4))]).sort((a, b) => a[0] - b[0]),
      treasury: [...treasury.entries()].sort((a, b) => a[0] - b[0]),
      praca: [...praca.entries()].sort((a, b) => a[0] - b[0]),
      techs: [...techs.entries()].map(([o, s]) => [o, [...s].sort()]).sort((a, b) => a[0] - b[0]),
      wonders: placedWorldWonders.map((w) => ({ wonderId: w.wonderId, ownerId: w.ownerId })),
      wonderTransfers,
      pairMeta: [...diplomacyPairMeta.entries()],
      relations: [...relations.entries()],
      everOwned: [...everOwned],
      capitalEvent, eliminated,
      lostPowerFromRust: capitalEvent === 'eliminacja',
      // N2: hak T8 wolany = wygrana atakujacego z wylomem (`capture_requested`); listy puste, gdy hak nie wolany.
      hookCalled: winner === 'atakujacy' && !stormCaptureBlocked,
      removedUnitIds: winner === 'atakujacy' && !stormCaptureBlocked ? [...wipeRemoved, ...p9Removed] : [],
      enteredUnitIds: winner === 'atakujacy' && !stormCaptureBlocked ? enteredUnitIds : [],
      treasuryTaken, techsCopied,
    },
  };
}

// `isCityCaptureBlockedByDefenders` (`barbarians.ts:499-507`) na wektorach jednostek (barbarzyncy -1).
const BLOCK_CASES = [
  { atk: -1, units: [[0, 5, 4]] }, { atk: -1, units: [[-1, 5, 4]] }, { atk: -1, units: [[3, 5, 5]] },
  { atk: 1, units: [[0, 5, 4]] }, { atk: 0, units: [[2, 5, 4], [-1, 5, 4]] }, { atk: -1, units: [] },
  { atk: -1, units: [[-1, 5, 4], [-99, 5, 4]] }, { atk: -99, units: [[0, 5, 4]] },
].map((c) => ({ ...c, q: 5, r: 4, blocked: BARB.isCityCaptureBlockedByDefenders(c.atk, c.units.map(([o, q, r]) => ({ ownerId: o, q, r })), 5, 4) }));

// Wywolania w tekscie pinu (tabela kryterium: kazde musi byc w `city_capture_apply::PIN_STEPS` albo na liscie UI testu):
// cialo `applyCityCaptureToMap` (`main.ts:36034-36264`) i `applyCityCaptureAfterBattle` (`post-battle-map.ts:493-596`).
const mainLines = show('gra/src/main.ts').split('\n');
const pbmLines = show('gra/src/game/post-battle-map.ts').split('\n');
const stripComments = (lines) => lines.map((l) => l.replace(/\/\/.*$/, '')).join('\n').replace(/\/\*[\s\S]*?\*\//g, '');
const callText = stripComments(mainLines.slice(36033, 36264)) + '\n' + stripComments(pbmLines.slice(492, 596));
const JS_SKIP = new Set(['if', 'for', 'return', 'function', 'Math', 'max', 'min', 'floor', 'find', 'get', 'set', 'has', 'add', 'delete', 'splice', 'filter', 'reduce', 'slice', 'isFinite', 'applyCityCaptureToMap', 'applyCityCaptureAfterBattle', 'String', 'Number', 'Array', 'push', 'map']);
const pinCalls = [...new Set([...callText.matchAll(/\b([A-Za-z_$][\w$]*)\s*\(/g)].map((m) => m[1]))].filter((n) => !JS_SKIP.has(n)).sort();

const vectors = { pin: PIN, pinSha256: shaHex, scenarios: SCENARIOS.map(run), blockCases: BLOCK_CASES, pinCalls };
const outDir = join(here, 'p6_zdobycie_miasta_a_vectors');
mkdirSync(outDir, { recursive: true });
const text = JSON.stringify(vectors, null, 1) + '\n';
writeFileSync(join(outDir, 'vectors.json'), text);
console.log('pinSha256', shaHex);
console.log('vectors.json md5', createHash('md5').update(text).digest('hex'));
