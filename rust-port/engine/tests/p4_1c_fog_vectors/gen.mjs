// R-RUSTPORT-P4-1C-FOG-VIEW-R1 (#253, #335): generator wektorow producenta `FogViewDto`
// (`visibility::fog_view::refresh_fog`).
//
// Generator WYKONUJE kod pinu `07d2fbd72` (`git archive`, nie drzewo robocze):
// - moduly w calosci (import przez Node `--experimental-transform-types`): `game/visibility.ts`
//   (`computeVisibleAt`, `computePlayerVisibility`, `addExplored`, `allHexKeys`,
//   `allRevealLandKeys`, `exploredSetForRender`, `buildUnitSightResolver`, `DEFAULT_SIGHT`),
//   `game/okolica.ts` (`citySightRadius`), `game/fort-territory.ts` (`fortSightSources`),
//   `game/diplomacy-treaties.ts` (`allianceFormalKindBetween`), dane `gra/data/units.json`;
// - wyciete fragmenty `main.ts` (straznik SHA-256, lista EXCERPTS): `ALL_KEYS`/`ALL_LAND_KEYS`,
//   `playerStartHexFor`, `fogExploredForRender`, `visibleDiskMemo`/`visibleDiskKeys`,
//   `ownPlayerVisibleHexes`, `currentVisible`, `currentVisibleForOwner`,
//   `startRevealKeysForRiverFog`, `deferRefreshFogUnitSync`, `refreshFog`, `ME`, `isMe`,
//   `exploredByHuman`. Wywolania renderu w `refreshFog` sa zaslepkami zapisujacymi argumenty
//   (`setFog(vis, exploredForRender, ...)` -> wynik wektora).
//
// Pin ma JEDEN fotel czlowieka (`exploredByHuman = Map([[HUMAN_OWNER_PRIMARY, explored]])`), wiec
// wektory sa liczone dla `ME() = HUMAN_OWNER_PRIMARY`; eksploracja per fotel (inne fotele) jest
// testem zachowania Rust (`p4_1c_fog_view.rs`), nie wektorem pinu.
//
// WYMAGANY Node >= 22.18.0 (linia 22) albo >= 23.6.0.
//
// Uzycie (z dowolnego katalogu w repo):
//   node rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs          -> zapisuje vectors.json
//   node rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs --check  -> EXIT 1 przy roznicy

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
const OUT = join(HERE, 'vectors.json');
const CHECK = process.argv.includes('--check');
const sha256 = (text) => createHash('sha256').update(text, 'utf8').digest('hex');

// ---------------------------------------------------------------------------
// Fragmenty `main.ts` (linie 1-indeksowane, wlacznie) + straznik SHA-256.
// `to: null` = do pierwszej linii `    }` (koniec funkcji na wcieciu 4).
// ---------------------------------------------------------------------------
const EXCERPTS = [
  { name: 'playerStartHexFor', from: 3027, to: null, sig: 'function playerStartHexFor(' },
  { name: 'ALL_KEYS', from: 12854, to: 12854, sig: 'let ALL_KEYS = new Set(allHexKeys(map));' },
  { name: 'ALL_LAND_KEYS', from: 12856, to: 12856, sig: 'let ALL_LAND_KEYS = new Set(allRevealLandKeys(map));' },
  { name: 'fogExploredForRender', from: 12864, to: null, sig: 'function fogExploredForRender(' },
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
const EXPECTED_SHA = {
  playerStartHexFor: 'ad76bac8128ff8e4459b8ed66efdd8d9343e63e09119ed76079a875f6339ab8d',
  ALL_KEYS: 'b8f746d24407b60e2b68a91380b6c429284c63a6c794e85aa350735ff004bfbe',
  ALL_LAND_KEYS: '39870dd9f646f4f4b2d15c2c6f3fcb0cef82f183c3eab37b291c29b4cd8bc5ae',
  fogExploredForRender: 'fa85a0663fe22d7742a32b8b4cd0e443c16057e9127350b69467733bba2b4e3f',
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
};

// ---------------------------------------------------------------------------
// Pin do katalogu tymczasowego.
// ---------------------------------------------------------------------------
const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8' }).trim();
const tmp = mkdtempSync(join(tmpdir(), 'p4-1c-fog-'));
try {
  const tar = execFileSync('git', ['archive', PIN, 'gra/src', 'gra/data'], { cwd: repoRoot, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', tmp], { input: tar, maxBuffer: 1 << 30 });

  const mainLines = readFileSync(join(tmp, 'gra/src/main.ts'), 'utf8').split('\n');
  const guards = {};
  const bodies = [];
  const fail = [];
  for (const ex of EXCERPTS) {
    const start = ex.from - 1;
    if (!mainLines[start].includes(ex.sig)) {
      fail.push(`${ex.name}: linia ${ex.from} nie zawiera '${ex.sig}'`);
      continue;
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
    bodies.push(text);
  }
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
import { fortSightSources } from './game/fort-territory';
import { allianceFormalKindBetween } from './game/diplomacy-treaties';
import unitsRaw from '../data/units.json';

export function runRefreshFog(sc: any): any {
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
  let startRevealRadius = sc.startRevealRadius;
  const captured: any = { setFog: null };
  const markMinimapDirty = () => {};
  const updateDiplomaticDiscovery = (_v: Set<string>) => {};
  const syncCampMeshes = () => {};
  const syncVillageMeshes = () => {};
  const setFog = (vis: Set<string>, exp: Set<string>, opts?: any) => {
    captured.setFog = { vis: [...vis], explored: [...exp], landReveal: opts ? opts.landReveal : null };
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
  const isAwaitingFirstPlayerCity = (_o?: number) => true;

${bodies.join('\n')}

  refreshFog();
  return { setFog: captured.setFog, fogActive: captured.fogActive, exploredAfter: [...explored] };
}
`;
  writeFileSync(join(tmp, 'gra/src/__p4_1c_fog_harness.ts'), harness);

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
const h = await import(pathToFileURL(${JSON.stringify(join(tmp, 'gra/src/__p4_1c_fog_harness.ts'))}).href);
const scs = JSON.parse(readFileSync(${JSON.stringify(join(tmp, 'scenarios.json'))}, 'utf8'));
const out = scs.map((sc) => h.runRefreshFog(toWeb(sc)));
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
        setFogVisible: sortKeys(res.setFog.vis),
        setFogExplored: sortKeys(res.setFog.explored),
        exploredAfter: sortKeys(res.exploredAfter),
      },
    };
  });

  const doc = {
    pin: PIN,
    generator: 'rust-port/engine/tests/p4_1c_fog_vectors/gen.mjs',
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
  const HUMAN = 1;
  const players = [
    { id: HUMAN, human: true },
    { id: 2, human: false },
    { id: 3, human: false },
    { id: 4, human: false },
    { id: 5, human: true },
  ];
  const baseUnits = [
    { id: 11, owner: HUMAN, q: 2, r: 2, typeId: 'Wojownik' },
    { id: 12, owner: HUMAN, q: 4, r: 11, typeId: 'Zwiadowca' },
    { id: 13, owner: HUMAN, q: 7, r: 4, typeId: 'NieznanyTyp' },
    { id: 21, owner: 2, q: 16, r: 3, typeId: 'Wojownik' },
    { id: 22, owner: 2, q: 19, r: 9, typeId: 'Zwiadowca' },
    { id: 31, owner: 3, q: 13, r: 14, typeId: 'Łucznik' },
    { id: 41, owner: 4, q: 18, r: 1, typeId: 'Wojownik' },
    { id: 51, owner: 5, q: 12, r: 0, typeId: 'Wojownik' },
  ];
  const baseCities = [
    { id: 1, owner: HUMAN, q: 3, r: 6, population: 0, culture: 0 },
    { id: 2, owner: 2, q: 18, r: 6, population: 1, culture: 0 },
    { id: 3, owner: 3, q: 14, r: 12, population: 2, culture: 150 },
  ];
  const baseForts = [
    { q: 9, r: 13, owner: HUMAN, kind: 'posterunek', contestedUseless: null },
    { q: 1, r: 14, owner: HUMAN, kind: 'fort', contestedUseless: true },
    { q: 15, r: 0, owner: 4, kind: 'fort', contestedUseless: null },
  ];
  const exploredBefore = [[20, 15], [0, 0], [22, 2], [11, 8]];
  const common = {
    width: W,
    height: H,
    tiles,
    players,
    me: HUMAN,
    units: baseUnits,
    cities: baseCities,
    forts: baseForts,
    exploredBefore,
    startHexes: [[HUMAN, 6, 6]],
    startRevealRadius: 4,
  };
  const napOnly = [{ kind: 'pakt_nieagresji', a: HUMAN, b: 2 }, { kind: 'sojusz_pelny', a: 2, b: 3 }];
  return [
    { name: 'sam_fotel', ...common, deals: napOnly, fogOn: true, revealAllLand: false },
    {
      name: 'fotel_sojusznik',
      ...common,
      deals: [
        { kind: 'sojusz_defensywny', a: 2, b: HUMAN },
        { kind: 'sojusz_pelny', a: HUMAN, b: 3 },
        { kind: 'umowa_szlakow', a: HUMAN, b: 4 },
        { kind: 'sojusz_pelny', a: HUMAN, b: 5 },
      ],
      fogOn: true,
      revealAllLand: false,
    },
    { name: 'reveal_all_land', ...common, deals: napOnly, fogOn: true, revealAllLand: true },
    {
      name: 'start_hex_fallback',
      ...common,
      units: baseUnits.filter((u) => u.owner !== HUMAN),
      cities: baseCities.filter((c) => c.owner !== HUMAN),
      forts: baseForts.filter((f) => f.owner !== HUMAN),
      deals: napOnly,
      fogOn: true,
      revealAllLand: false,
    },
    {
      name: 'brak_zrodel_brak_startu',
      ...common,
      units: baseUnits.filter((u) => u.owner !== HUMAN),
      cities: baseCities.filter((c) => c.owner !== HUMAN),
      forts: baseForts.filter((f) => f.owner !== HUMAN),
      startHexes: [[5, 6, 6]],
      deals: napOnly,
      fogOn: true,
      revealAllLand: false,
    },
    { name: 'mgla_wylaczona', ...common, deals: napOnly, fogOn: false, revealAllLand: false },
    { name: 'mgla_wylaczona_reveal', ...common, deals: napOnly, fogOn: false, revealAllLand: true },
  ];
}
