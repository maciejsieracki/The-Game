// R-RUSTPORT-P4-364-DTO-BRIDGE-R1 (#364): generator wektorow warstwy `domain::dto_bridge`
// (mgla aktywnego fotela + `FogRevealDto` + zasiegi terytorium z `PlayableState`).
//
// Generator WYKONUJE kod pinu `07d2fbd72` (`git archive`, nie drzewo robocze), tak jak
// `p4_1c_fog_vectors/gen.mjs`:
// - moduly w calosci (Node `--experimental-transform-types`): `game/visibility.ts`,
//   `game/okolica.ts`, `game/fort-territory.ts` (`fortSightSources`, `fortTerritoryNodes`),
//   `game/diplomacy-treaties.ts`, `game/first-player-city.ts` (`isAwaitingFirstPlayerCity`),
//   `map/range-hexes.ts` (`collectTerritoryHexKeysByOwner`), dane `gra/data/units.json`;
// - wyciete fragmenty `main.ts` (straznik SHA-256, lista EXCERPTS): te same co FOG-VIEW oraz
//   `buildAllTerritoryNodes` (`:5667`), `isAwaitingFirstPlayerCity` (`:12882`) i filtr mgly
//   zasiegu terytorium z `refreshTerritoryBorderOverlay` (`:15593-15601`).
//   Wywolania renderu sa zaslepkami zapisujacymi argumenty (`setFog(vis, explored, opts)`).
//
// Kolejnosc w harnessie jak w grze: `refreshFog()` (dopisuje eksploracje fotela), potem filtr
// terytorium na tym samym stanie (`currentVisible()` i `fogExploredForRender()`).
//
// `ME()` = `humanSeats.activeHumanOwnerId` = `sc.me`; `exploredByHuman` ma wpis tego fotela
// (pin: `HUMAN_OWNER_PRIMARY`, tu podstawiony `sc.me`), `playerEverOwnedCityByOwner` = `sc.everOwned`.
//
// WYMAGANY Node >= 22.18.0 (linia 22) albo >= 23.6.0.
//
// Uzycie (z dowolnego katalogu w repo):
//   node rust-port/engine/tests/p4_364_dto_bridge_gen.mjs          -> zapisuje vectors.json
//   node rust-port/engine/tests/p4_364_dto_bridge_gen.mjs --check  -> EXIT 1 przy roznicy

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

{
  const [maj, min] = process.versions.node.split('.').map(Number);
  const ok = maj > 23 || (maj === 23 && min >= 6) || (maj === 22 && min >= 18);
  if (!ok) {
    console.error(`Node ${process.versions.node} za stary: wymagany >= 22.18.0 (22.x) albo >= 23.6.0`);
    process.exit(2);
  }
}

const PIN = '07d2fbd72';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'p4_364_dto_bridge_vectors', 'vectors.json');
const CHECK = process.argv.includes('--check');
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

// ---------------------------------------------------------------------------
// Fragmenty `main.ts` (linie 1-indeksowane, wlacznie) + straznik SHA-256.
// `to: null` = do pierwszej linii `    }` (koniec funkcji na wcieciu 4).
// ---------------------------------------------------------------------------
const EXCERPTS = [
  { name: 'playerStartHexFor', from: 3027, to: null, sig: 'function playerStartHexFor(' },
  { name: 'buildAllTerritoryNodes', from: 5667, to: null, sig: 'function buildAllTerritoryNodes(' },
  { name: 'ALL_KEYS', from: 12854, to: 12854, sig: 'let ALL_KEYS = new Set(allHexKeys(map));' },
  { name: 'ALL_LAND_KEYS', from: 12856, to: 12856, sig: 'let ALL_LAND_KEYS = new Set(allRevealLandKeys(map));' },
  { name: 'fogExploredForRender', from: 12864, to: null, sig: 'function fogExploredForRender(' },
  { name: 'isAwaitingFirstPlayerCity', from: 12882, to: null, sig: 'function isAwaitingFirstPlayerCity(' },
  { name: 'visibleDiskMemo', from: 12951, to: 12951, sig: 'const visibleDiskMemo' },
  { name: 'visibleDiskKeys', from: 12952, to: null, sig: 'function visibleDiskKeys(' },
  { name: 'ownPlayerVisibleHexes', from: 12968, to: null, sig: 'function ownPlayerVisibleHexes(' },
  { name: 'currentVisible', from: 13007, to: null, sig: 'function currentVisible(): Set<string>' },
  { name: 'currentVisibleForOwner', from: 13059, to: null, sig: 'function currentVisibleForOwner(' },
  { name: 'startRevealKeysForRiverFog', from: 13074, to: null, sig: 'function startRevealKeysForRiverFog(' },
  { name: 'deferRefreshFogUnitSync', from: 13474, to: 13474, sig: 'let deferRefreshFogUnitSync' },
  { name: 'refreshFog', from: 13475, to: null, sig: 'function refreshFog(' },
  { name: 'ME', from: 13729, to: null, sig: 'function ME(): number' },
  { name: 'isMe', from: 13748, to: null, sig: 'function isMe(' },
  { name: 'exploredByHuman', from: 13759, to: 13759, sig: 'const exploredByHuman' },
];
// Filtr mgly zasiegu terytorium (`refreshTerritoryBorderOverlay`, cialo funkcji na wcieciu 6).
const TERRITORY_FILTER = { name: 'territoryFogFilter', from: 15593, to: 15601, sig: 'let visOnce: Set<string> | null = null;' };
const EXPECTED_SHA = {
  playerStartHexFor: 'ad76bac8128ff8e4459b8ed66efdd8d9343e63e09119ed76079a875f6339ab8d',
  buildAllTerritoryNodes: '89cb4aeb521623409faed6465d8f5cfba5b9781e46c79135cb5c6d2233a9a9e8',
  ALL_KEYS: 'b8f746d24407b60e2b68a91380b6c429284c63a6c794e85aa350735ff004bfbe',
  ALL_LAND_KEYS: '39870dd9f646f4f4b2d15c2c6f3fcb0cef82f183c3eab37b291c29b4cd8bc5ae',
  fogExploredForRender: 'fa85a0663fe22d7742a32b8b4cd0e443c16057e9127350b69467733bba2b4e3f',
  isAwaitingFirstPlayerCity: 'eebbff94f183fa45305453030b6236ae18872381a9bf04eed8f1fc789d7a217d',
  visibleDiskMemo: 'd94d599be647b11e4ceb522c0c042264e608f6425657a6e1953f8aa227c5e2f2',
  visibleDiskKeys: '39a54b972fea34196b0a4fbe9689de21079269d12b062e6a8abec9cced5b15a3',
  ownPlayerVisibleHexes: 'db3db7dc8523366603a238226bf52731bcb7affdb6ccaf05923ec8e6273d485b',
  currentVisible: 'bb36831abc374af2ef666ff3635ef4abfe9e8a2376d9930a48ac6e1346184e60',
  currentVisibleForOwner: '8113168dc0f3b206c82953e9b36e201a058ad7b816b78e34ba265cf7a3670d45',
  startRevealKeysForRiverFog: 'a55afbaedaa56d5a565ad8cf7a09694215677b302968a6f097ecc0d4df6d6c33',
  deferRefreshFogUnitSync: '6847d6c3798439b51ac323bab226bb94b01c7007b37aba04014bf57bc0c17097',
  refreshFog: '8e0f252ce68b74547b768d5069eeb348965f51ae35032cd5afafb386cea4aa7d',
  ME: 'a299b7c939ac310935e19fc668a07c095de988a161e6cdd4eaf937db927cd492',
  isMe: 'be1ce8c494085bfc943185fb783d1e1441059d720086a352822e57ff6b4ad15f',
  exploredByHuman: '9010ec04d711048995c94cdac23fe25f75f2845e31c7b654cd603b6095a5cf80',
  territoryFogFilter: 'd9b72525187850e077a46ae5b03ed8ce60e04668044778a73a9e85893d287a55',
};

// ---------------------------------------------------------------------------
// Pin do katalogu tymczasowego.
// ---------------------------------------------------------------------------
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8' }).trim();
const tmp = mkdtempSync(join(tmpdir(), 'p4-364-dto-bridge-'));
try {
  const tar = execFileSync('git', ['archive', PIN, 'gra/src', 'gra/data'], { cwd: repoRoot, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', tmp], { input: tar, maxBuffer: 1 << 30 });

  const mainLines = readFileSync(join(tmp, 'gra/src/main.ts'), 'utf8').split('\n');
  const guards = {};
  const fail = [];
  const cut = (ex) => {
    const start = ex.from - 1;
    if (!mainLines[start].includes(ex.sig)) {
      fail.push(`${ex.name}: linia ${ex.from} nie zawiera '${ex.sig}'`);
      return '';
    }
    let end = ex.to === null ? start : ex.to - 1;
    if (ex.to === null) {
      while (end < mainLines.length && mainLines[end] !== '    }') end += 1;
    }
    const text = mainLines.slice(start, end + 1).join('\n');
    const sha = sha256(text);
    guards[ex.name] = { lines: `${ex.from}-${end + 1}`, sha256: sha };
    if (EXPECTED_SHA[ex.name] !== null && EXPECTED_SHA[ex.name] !== sha) {
      fail.push(`${ex.name} ${ex.from}-${end + 1} sha256=${sha} (oczekiwano ${EXPECTED_SHA[ex.name]})`);
    }
    return text;
  };
  const bodies = EXCERPTS.map(cut);
  const territoryFilter = cut(TERRITORY_FILTER);
  if (!territoryFilter.trimEnd().endsWith('});')) fail.push('territoryFogFilter: brak zamkniecia `});`');
  if (fail.length) {
    console.error('STRAZNIK: fragmenty pinu niezgodne:\n' + fail.join('\n'));
    process.exit(3);
  }

  // -------------------------------------------------------------------------
  // Harness: fragmenty main.ts w zamknieciu z kontekstem scenariusza; render = zaslepki.
  // -------------------------------------------------------------------------
  const harness = `
import { addExplored, allHexKeys, allRevealLandKeys, exploredSetForRender, DEFAULT_SIGHT, computeVisibleAt, buildUnitSightResolver, computePlayerVisibility } from './game/visibility';
import { citySightRadius } from './game/okolica';
import { fortSightSources, fortTerritoryNodes } from './game/fort-territory';
import { allianceFormalKindBetween } from './game/diplomacy-treaties';
import { isAwaitingFirstPlayerCity as computeAwaitingFirstPlayerCity } from './game/first-player-city';
import { collectTerritoryHexKeysByOwner } from './map/range-hexes';
import unitsRaw from '../data/units.json';

export function run(sc: any): any {
  const map = sc.map;
  const units = sc.units;
  const cities = sc.cities;
  const fortNodes = sc.fortNodes;
  const activeDeals = sc.activeDeals;
  const aiOwnerCivMap = new Map<number, string>(sc.aiOwners.map((o: number) => [o, 'civ']));
  const unitSight = buildUnitSightResolver(unitsRaw as any, DEFAULT_SIGHT);
  const HUMAN_OWNER_PRIMARY = sc.me;
  const humanSeats = { activeHumanOwnerId: sc.me };
  const explored = new Set<string>(sc.exploredBefore);
  let fogOn = sc.fogOn;
  let revealAllLand = sc.revealAllLand;
  let galleryOn = false;
  let playerStartHexByOwner: Map<number, { q: number; r: number }> = new Map(
    sc.startHexes.map((s: [number, number, number]) => [s[0], { q: s[1], r: s[2] }]),
  );
  let playerEverOwnedCityByOwner: Set<number> = new Set<number>(sc.everOwned);
  let startRevealRadius = sc.startRevealRadius;
  const captured: any = { setFog: null };
  const markMinimapDirty = () => {};
  const updateDiplomaticDiscovery = (_v: Set<string>) => {};
  const syncCampMeshes = () => {};
  const syncVillageMeshes = () => {};
  const setFog = (...args: any[]) => {
    const [vis, exp, opts] = args;
    captured.setFog = {
      nargs: args.length,
      vis: [...vis],
      explored: [...exp],
      landReveal: opts ? opts.landReveal : null,
      riverRevealKeys: opts && opts.riverRevealKeys !== undefined ? [...opts.riverRevealKeys] : null,
    };
  };
  const syncResourceOverlayFog = (..._a: any[]) => {};
  const syncImprovementMeshFog = (..._a: any[]) => {};
  const syncSettlementMeshFog = (..._a: any[]) => {};
  const syncWorkerFieldOverlayFog = (_g: any, _v: any, _e: any, fogActive: boolean) => { captured.fogActive = fogActive; };
  const workerFieldOverlayGroup = null;
  const syncUnitsRender = (_l: any) => {};
  const visibleUnitsList = (_v: any) => [];
  const cityRenderer = { applyFogVisibility: (..._a: any[]) => {} };
  const wonderRenderer = { applyFogVisibility: (..._a: any[]) => {} };
  const d1bHudActive = false;
  const refreshD1bHud = () => {};
  const checkNewDiplomaticContacts = () => {};
  const checkVeteranEnemyFirstEncounter = (_v: any) => {};
  const territoryBorderVisible = false;
  const refreshTerritoryBorderOverlay = () => {};

${bodies.join('\n')}

  function territoryByOwner(): Map<number, Set<string>> {
    const nodes = buildAllTerritoryNodes();
${territoryFilter}
    return byOwner;
  }

  refreshFog();
  const byOwner = territoryByOwner();
  return {
    setFog: captured.setFog,
    fogActive: captured.fogActive,
    exploredAfter: [...explored],
    awaiting: isAwaitingFirstPlayerCity(),
    territory: [...byOwner.entries()].map(([o, keys]) => [o, [...keys]]),
  };
}
`;
  writeFileSync(join(tmp, 'gra/src/__p4_364_harness.ts'), harness);

  const HOOKS = `
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); } catch (e) {
    for (const suf of ['.ts', '/index.ts']) {
      try { return await next(specifier + suf, context); } catch { /* kolejny */ }
    }
    throw e;
  }
}
export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    const src = readFileSync(fileURLToPath(url), 'utf8');
    return { format: 'module', source: 'export default ' + src + ';', shortCircuit: true };
  }
  return next(url, context);
}
`;
  writeFileSync(join(tmp, 'hooks.mjs'), HOOKS);

  const scenarios = buildScenarios();
  writeFileSync(join(tmp, 'scenarios.json'), JSON.stringify(scenarios));
  const RUNNER = `
import { register } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
register(pathToFileURL(${JSON.stringify(join(tmp, 'hooks.mjs'))}).href);
const origLog = console.log; console.log = () => {}; console.warn = () => {};
const h = await import(pathToFileURL(${JSON.stringify(join(tmp, 'gra/src/__p4_364_harness.ts'))}).href);
const scs = JSON.parse(readFileSync(${JSON.stringify(join(tmp, 'scenarios.json'))}, 'utf8'));
const out = scs.map((sc) => h.run(toWeb(sc)));
writeFileSync(${JSON.stringify(join(tmp, 'results.json'))}, JSON.stringify(out));
function toWeb(sc) {
  const TEREN = { Plains: 'rownina', Hills: 'wzgorza', Forest: 'rownina', Water: 'morze' };
  const hexes = {};
  for (const t of sc.tiles) {
    const h = { q: t.q, r: t.r, terenBazowy: TEREN[t.t], nakladka: t.t === 'Forest' ? 'las' : 'brak' };
    hexes[t.q + ',' + t.r] = h;
  }
  return {
    map: { width: sc.width, height: sc.height, hexes },
    units: sc.units.map((u) => ({ id: 'u' + u.id, ownerId: u.owner, q: u.q, r: u.r, typeId: u.typeId })),
    cities: sc.cities.map((c) => ({ id: 'city' + c.id, ownerId: c.owner, q: c.q, r: c.r, population: c.population, kultura: c.culture })),
    fortNodes: sc.forts.map((f) => {
      const n = { q: f.q, r: f.r, ownerId: f.owner, type: f.kind };
      if (f.contestedUseless !== null) n.contestedUseless = f.contestedUseless;
      if (f.builtAtTurn !== null) n.builtAtTurn = f.builtAtTurn;
      if (f.seq !== null) n.seq = f.seq;
      return n;
    }),
    activeDeals: sc.deals.map((d, i) => ({ id: 'd' + i, rodzaj: d.kind, strony: d.a < d.b ? [d.a, d.b] : [d.b, d.a] })),
    aiOwners: sc.players.filter((p) => !p.human).map((p) => p.id),
    me: sc.me,
    exploredBefore: sc.exploredBefore.map(([q, r]) => q + ',' + r),
    fogOn: sc.fogOn,
    revealAllLand: sc.revealAllLand,
    startHexes: sc.startHexes,
    startRevealRadius: sc.startRevealRadius,
    everOwned: sc.everOwned,
  };
}
`;
  writeFileSync(join(tmp, 'runner.mjs'), RUNNER);
  const run = spawnSync(process.execPath, ['--experimental-transform-types', '--no-warnings', join(tmp, 'runner.mjs')], {
    cwd: tmp,
    encoding: 'utf8',
    maxBuffer: 1 << 28,
  });
  if (run.status !== 0) {
    console.error(run.stdout, run.stderr);
    process.exit(4);
  }
  const results = JSON.parse(readFileSync(join(tmp, 'results.json'), 'utf8'));

  const parseKey = (k) => k.split(',').map(Number);
  const sortKeys = (keys) => keys.map(parseKey).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  const cases = scenarios.map((sc, i) => {
    const res = results[i];
    const vis = new Set(res.setFog.vis);
    const exp = new Set(res.setFog.explored);
    const order = sc.tiles.map((t) => [t.q, t.r]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
    // `FogViewDto` (Z-FOG-5): bez mgly `setFog(ALL_KEYS, ALL_KEYS)` -> kazdy heks 2.
    const fog = order.map(([q, r]) => {
      const k = q + ',' + r;
      if (vis.has(k)) return 2;
      if (exp.has(k)) return 1;
      return 0;
    });
    return {
      name: sc.name,
      scenario: sc,
      expected: {
        fogActive: res.fogActive,
        fog,
        setFogArgs: res.setFog.nargs,
        landReveal: res.setFog.landReveal,
        // `riverRevealKeys` argumentu `setFog` (null = `undefined` albo brak `opts`), kolejnosc kontraktu.
        riverRevealKeys: res.setFog.riverRevealKeys === null ? null : sortKeys(res.setFog.riverRevealKeys),
        awaiting: res.awaiting,
        exploredAfter: sortKeys(res.exploredAfter),
        // `byOwner` (Map): wlasciciele w kolejnosci wstawiania, heksy w kolejnosci `Object.keys(map.hexes)`.
        territory: res.territory.map(([o, keys]) => ({ owner: o, hexes: keys.map(parseKey) })),
      },
    };
  });

  const doc = {
    pin: PIN,
    generator: 'rust-port/engine/tests/p4_364_dto_bridge_gen.mjs',
    guards,
    cases,
  };
  const text = JSON.stringify(doc, null, 1) + '\n';
  if (CHECK) {
    const prev = readFileSync(OUT, 'utf8');
    if (prev !== text) {
      console.error('vectors.json rozni sie od wyniku generatora');
      process.exit(1);
    }
    console.log(`OK: ${cases.length} przypadkow zgodnych`);
  } else {
    writeFileSync(OUT, text);
    console.log(`zapisano ${OUT}: ${cases.length} przypadkow`);
  }
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ---------------------------------------------------------------------------
// Scenariusze (wspolne wejscie weba i Rust). Wspolrzedne: q = x, r = y (`PositionDto`).
// Fotele ludzkie 0 i 1 (hot-seat), AI 2, 3, 4.
// ---------------------------------------------------------------------------
function buildScenarios() {
  const W = 24;
  const H = 16;
  const tiles = [];
  for (let r = 0; r < H; r += 1) {
    for (let q = 0; q < W; q += 1) {
      let t = 'Plains';
      if (q >= 21 || (r >= 13 && q >= 17) || (q === 10 && r >= 5 && r <= 7)) t = 'Water';
      else if ((q + 2 * r) % 7 === 0) t = 'Hills';
      else if ((3 * q + r) % 5 === 0) t = 'Forest';
      tiles.push({ q, r, t });
    }
  }
  const players = [
    { id: 0, human: true },
    { id: 1, human: true },
    { id: 2, human: false },
    { id: 3, human: false },
    { id: 4, human: false },
  ];
  const units = [
    { id: 1, owner: 0, q: 2, r: 2, typeId: 'Wojownik' },
    { id: 2, owner: 0, q: 5, r: 11, typeId: 'Zwiadowca' },
    { id: 11, owner: 1, q: 13, r: 2, typeId: 'Wojownik' },
    { id: 21, owner: 2, q: 17, r: 4, typeId: 'Wojownik' },
    { id: 31, owner: 3, q: 13, r: 14, typeId: 'Łucznik' },
    { id: 41, owner: 4, q: 19, r: 1, typeId: 'Wojownik' },
  ];
  const cityMe0 = { id: 1, owner: 0, q: 3, r: 6, population: 6, culture: 0 };
  const cityMe1 = { id: 4, owner: 1, q: 11, r: 3, population: 5, culture: 0 };
  const aiCities = [
    { id: 2, owner: 2, q: 18, r: 6, population: 7, culture: 0 },
    { id: 3, owner: 3, q: 14, r: 12, population: 5, culture: 150 },
  ];
  const forts = [
    { q: 9, r: 13, owner: 0, kind: 'posterunek', contestedUseless: null, builtAtTurn: 2, seq: 1 },
    { q: 11, r: 10, owner: 2, kind: 'fort', contestedUseless: null, builtAtTurn: 3, seq: 0 },
    { q: 1, r: 14, owner: 0, kind: 'fort', contestedUseless: true, builtAtTurn: null, seq: null },
    { q: 15, r: 0, owner: 4, kind: 'fort', contestedUseless: null, builtAtTurn: null, seq: null },
  ];
  const common = {
    width: W,
    height: H,
    tiles,
    players,
    units,
    forts,
    exploredBefore: [[20, 15], [0, 0], [22, 2], [11, 8]],
    startHexes: [[0, 6, 6], [1, 12, 3]],
    startRevealRadius: 4,
    deals: [{ kind: 'pakt_nieagresji', a: 0, b: 2 }],
    everOwned: [],
  };
  const bothCities = [cityMe0, cityMe1, ...aiCities];
  const onlyMe0 = [cityMe0, ...aiCities];
  const onlyMe1 = [cityMe1, ...aiCities];
  return [
    { name: 'me0_mgla_on', ...common, me: 0, cities: bothCities, fogOn: true, revealAllLand: false, everOwned: [0, 1] },
    { name: 'me1_mgla_on', ...common, me: 1, cities: bothCities, fogOn: true, revealAllLand: false, everOwned: [0, 1] },
    {
      name: 'me1_mgla_on_sojusz',
      ...common,
      me: 1,
      cities: bothCities,
      deals: [{ kind: 'sojusz_defensywny', a: 1, b: 2 }],
      fogOn: true,
      revealAllLand: false,
      everOwned: [0, 1],
    },
    { name: 'me0_rzeki_awaiting', ...common, me: 0, cities: onlyMe1, fogOn: true, revealAllLand: false, everOwned: [1] },
    { name: 'me1_rzeki_awaiting', ...common, me: 1, cities: onlyMe0, fogOn: true, revealAllLand: false, everOwned: [0] },
    { name: 'me0_awaiting_ever_owned', ...common, me: 0, cities: onlyMe1, fogOn: true, revealAllLand: false, everOwned: [0, 1] },
    {
      name: 'me1_awaiting_bez_startu',
      ...common,
      me: 1,
      cities: onlyMe0,
      startHexes: [[0, 6, 6]],
      fogOn: true,
      revealAllLand: false,
      everOwned: [0],
    },
    { name: 'me0_reveal_all_land', ...common, me: 0, cities: bothCities, fogOn: true, revealAllLand: true, everOwned: [0, 1] },
    { name: 'me1_reveal_awaiting', ...common, me: 1, cities: onlyMe0, fogOn: true, revealAllLand: true, everOwned: [0] },
    { name: 'mgla_wylaczona_reveal', ...common, me: 0, cities: bothCities, fogOn: false, revealAllLand: true, everOwned: [0, 1] },
    { name: 'mgla_wylaczona_awaiting', ...common, me: 1, cities: onlyMe0, fogOn: false, revealAllLand: false, everOwned: [0] },
  ];
}
