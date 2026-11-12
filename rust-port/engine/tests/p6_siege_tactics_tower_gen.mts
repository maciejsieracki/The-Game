// P6 SIEGE-TAKTYKA K3 (#217, runda 1 Operatora): generator wektorow WYKONUJACY TEKST PINU (pin 07d2fbd72).
//
// Uruchomienie (z korzenia repo; katalog roboczy na pliki modulu poza repo):
//   TOWER_GEN_SCRATCH=<katalog poza repo> node --experimental-strip-types \
//     rust-port/engine/tests/p6_siege_tactics_tower_gen.mts
//
// WYKONYWANE SA DOSLOWNE LINIE z `gra/src/battle/battleScene.ts` i `gra/src/game/city-fortification.ts` (pin, przez
// `git show`, bez checkoutu). Straznik: SHA-256 wycietych fragmentow musi zgadzac sie z FRAGMENT_SHA256.
// Jedyne przeksztalcenia tekstu: usuniecie typow TS (robi Node --experimental-strip-types), zamiana `private`
// na nic (metody w klasie), `export function` -> `function`. Nie ma recznej kopii logiki.
//
// ATRAPY SCENY (jawne, nie z pinu): `_siegeShooterThreats` (lista podana wprost), `_passableForUnit` (zbior blokad),
// `_moveCostForUnit` (tabela COST), `_advanceToward` i `_attackGate` (efekt sceny: zapis zdarzenia, brak done),
// `_schedule` (zapis zdarzenia + synchroniczne cb), `_doMove` (galaz odmowy = linie pinu 8686-8693; reszta = efekt sceny:
// przeniesienie w occByKey, moveLeft -= koszt, zapis zdarzenia, done), `canShoot` (flaga), `cellToWorld` (bez wplywu).

import { writeFileSync, mkdtempSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';

const PIN = '07d2fbd72f758705f8e1d59cc4968027ffbafe75';
const BS_PATH = 'gra/src/battle/battleScene.ts';
const CF_PATH = 'gra/src/game/city-fortification.ts';
// Hash fragmentow pinu (wyliczany przez PRINT_HASH=1). Zmiana pinu -> blad straznika.
const FRAGMENT_SHA256 = 'cd4b2e5157b4ae26bfc89924f85cefac3f290e145374effde66a81fdc69b5d36';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, '..', '..', '..');
const gitLines = (path: string): string[] =>
  execFileSync('git', ['show', `${PIN}:${path}`], { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    .split('\n');
const BS = gitLines(BS_PATH);
const CF = gitLines(CF_PATH);

// Blok od linii startowej (1-based) do pierwszej linii dopasowanej przez `closeRe` (wlacznie).
function block(lines: string[], start: number, closeRe: RegExp): string[] {
  const out: string[] = [];
  for (let i = start - 1; i < lines.length; i++) {
    out.push(lines[i]);
    if (i >= start && closeRe.test(lines[i])) return out;
  }
  throw new Error(`brak domkniecia bloku od linii ${start}`);
}
const METHOD_END = /^ {2}\}$/;
const TOP_END = /^\}$/;
const range = (lines: string[], a: number, b: number): string[] => lines.slice(a - 1, b);

const FR = {
  dirDelta: range(BS, 326, 331),
  dirs4: range(BS, 337, 337),
  bfSize: range(BS, 661, 662),
  stepGap: range(BS, 1011, 1011),
  hpBarY: range(BS, 1043, 1043),
  cellKey: range(BS, 1797, 1797),
  isSiegeUnit: block(BS, 1552, TOP_END),
  isSiegeTower: block(BS, 1561, TOP_END),
  normName: block(BS, 1648, TOP_END),
  isRam: block(BS, 7402, METHOD_END),
  threatSlack: block(BS, 7939, METHOD_END),
  approachRestricted: block(BS, 7951, METHOD_END),
  moveRefused: block(BS, 7963, METHOD_END),
  bfsFirstStep: block(BS, 7973, METHOD_END),
  siegeWalkTo: block(BS, 8006, METHOD_END),
  ramTowerStep: block(BS, 8022, METHOD_END),
  trySiegeTowerClimb: block(BS, 8056, METHOD_END),
  infantryToTowerStep: block(BS, 8087, METHOD_END),
  doMoveRefusal: range(BS, 8686, 8693),
  attackerWallEntryIsBreach: block(CF, 96, TOP_END),
};
const FRAGMENT_ORDER = [
  'dirDelta', 'dirs4', 'bfSize', 'stepGap', 'hpBarY', 'cellKey', 'isSiegeUnit', 'isSiegeTower', 'normName', 'isRam',
  'threatSlack', 'approachRestricted', 'moveRefused', 'bfsFirstStep', 'siegeWalkTo', 'ramTowerStep',
  'trySiegeTowerClimb', 'infantryToTowerStep', 'doMoveRefusal', 'attackerWallEntryIsBreach',
] as const;
const digest = createHash('sha256')
  .update(FRAGMENT_ORDER.map((k) => FR[k].join('\n')).join('\n---\n'))
  .digest('hex');
if (process.env.PRINT_HASH) console.log(`FRAGMENT_SHA256=${digest}`);
if (FRAGMENT_SHA256 !== '__SET_AFTER_FIRST_RUN__' && digest !== FRAGMENT_SHA256) {
  throw new Error(`fragmenty pinu K3 nie zgadzaja sie z hashem: ${digest}`);
}

// Metody: `  private _x(` -> `  _x(`, `  private static _x(` -> `  static _x(`.
const asMethod = (l: string): string => l.replace(/^  private (static )?/, (_m, s) => (s ? '  static ' : '  '));

const moduleSrc = [
  'const COST = [0.5, 1, 1.5, 2, 3];',
  ...FR.dirDelta, ...FR.dirs4, ...FR.bfSize, ...FR.stepGap, ...FR.hpBarY, ...FR.cellKey,
  ...FR.isSiegeUnit, ...FR.isSiegeTower, ...FR.normName,
  ...FR.attackerWallEntryIsBreach.map((l) => l.replace(/^export function/, 'function')),
  'function canShoot(ru) { return ru.canShootFlag; }',
  'function cellToWorld(col, row) { return { x: col, z: row }; }',
  'class RecSet extends Set {',
  '  constructor(sc, items) { super(); this.sc = sc; for (const x of items) super.add(x); }',
  "  add(v) { this.sc.ev.push({ k: 'addRow', row: v }); return super.add(v); }",
  '}',
  'class BattleScene {',
  ...[
    FR.isRam, FR.threatSlack, FR.approachRestricted, FR.moveRefused, FR.bfsFirstStep,
    FR.siegeWalkTo, FR.ramTowerStep, FR.trySiegeTowerClimb, FR.infantryToTowerStep,
  ].flat().map(asMethod),
  // ---- atrapy sceny (jawne efekty / wejscia) ----
  '  _siegeShooterThreats() { return this.threats.map((t) => ({ q: t.q, r: t.r, range: t.range })); }',
  '  _passableForUnit(ru, col, row) { return !this.blocked.has(cellKey(col, row)); }',
  '  _moveCostForUnit(ru, col, row) { return COST[(((3 * col + 5 * row) % 5) + 5) % 5]; }',
  // thenArrive: czy done to closure `arrive` z _siegeRamTowerStep (galaz wiezy; dopisuje wiersz przy dojsciu).
  // Nazwa closure z pinu to 'arrive' (const arrive = () => ...); harness podaje done o nazwie 'done'.
  "  _advanceToward(ru, targetCol, targetRow, done) { this.ev.push({ k: 'advance', col: targetCol, row: targetRow, thenArrive: done.name === 'arrive' }); }",
  "  _attackGate(ru, done) { this.ev.push({ k: 'attackGate' }); }",
  "  _schedule(ms, cb) { this.ev.push({ k: 'schedule', ms }); if (++this.steps > 400) throw new Error('za dlugi marsz'); cb(); }",
  '  _doMove(ru, col, row, done) {',
  ...FR.doMoveRefusal,
  '    this.occByKey.delete(cellKey(ru.q, ru.r));',
  '    this.occByKey.set(cellKey(col, row), ru);',
  '    ru.q = col; ru.r = row;',
  '    ru.moveLeft = ru.moveLeft - this._moveCostForUnit(ru, col, row);',
  "    this.ev.push({ k: 'move', col, row });",
  '    done();',
  '  }',
  '}',
  // Zapis bramki _siegeMoveRefused (wywolanie zachowane; tylko rejestrujemy wynik).
  'const pinnedRefused = BattleScene.prototype._siegeMoveRefused;',
  'BattleScene.prototype._siegeMoveRefused = function (ru, col, row) {',
  '  const v = pinnedRefused.call(this, ru, col, row);',
  "  this.ev.push({ k: 'gate', col, row, refused: v });",
  '  return v;',
  '};',
  'export { BattleScene, cellKey, isSiegeUnit, isSiegeTower, RecSet, COST };',
].join('\n');

// ---------- uruchomienie modulu (plik tymczasowy poza repo) ----------
const scratch = process.env.TOWER_GEN_SCRATCH ?? mkdtempSync(join(tmpdir(), 'tower-gen-'));
const modPath = join(scratch, 'p6_tower_pin_module.mts');
writeFileSync(modPath, moduleSrc, 'utf8');
const M: any = await import(pathToFileURL(modPath).href);
const { BattleScene, cellKey, isSiegeUnit, isSiegeTower, RecSet } = M;

// ---------- PRNG (mulberry32, seed 217) ----------
let seed = 217 >>> 0;
const rnd = (): number => {
  seed = (seed + 0x6d2b79f5) >>> 0;
  let t = seed;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ri = (a: number, b: number): number => a + Math.floor(rnd() * (b - a + 1));
const pick = <T,>(xs: readonly T[]): T => xs[Math.floor(rnd() * xs.length)]!;

const NAMES: Array<{ name: string; typ?: string }> = [
  { name: 'Taran' }, { name: 'Taran', typ: 'Siege' }, { name: 'Wieża oblężnicza' }, { name: 'Katapulta', typ: 'Siege' },
  { name: 'Piechota' }, { name: 'Łucznik' }, { name: 'Jeździec' }, { name: 'Rycerz' }, { name: 'Machina', typ: 'Siege' },
];

// ---------- scenariusz -> stan sceny/jednostki ----------
const enc = (v: unknown): unknown => (typeof v === 'number' && Number.isNaN(v) ? 'NaN' : v);

function makeScene(s: any): any {
  const sc: any = new BattleScene();
  sc.ev = [];
  sc.steps = 0;
  sc.log = [];
  sc.finished = s.finished;
  sc.siegeWallCol = s.wallCol;
  sc.siegeGateRow = s.gateRow;
  sc.siegeGateCol = s.gateCol;
  sc.gateOpen = s.gateOpen;
  sc.wallEverBreached = s.everBreached;
  sc.siegeWallTilesInit = s.wallTilesInit;
  sc.wallTileHp = new Map(s.wallRows.map((r: number) => [r, 1]));
  sc.towerAtWallRows = new RecSet(sc, s.towerRows);
  sc.occByKey = new Map(s.occ.map(([c, r]: number[]) => [cellKey(c, r), 'x']));
  sc.blocked = new Set(s.blocked.map(([c, r]: number[]) => cellKey(c, r)));
  sc.threats = s.threats;
  return sc;
}

function makeUnit(u: any): any {
  const bu = { nazwa: u.name, stats: u.typ === undefined ? { Jednostka: u.name } : { Typ: u.typ, Jednostka: u.name } };
  return {
    side: u.side, q: u.q, r: u.r,
    moveLeft: u.moveLeft === 'NaN' ? NaN : u.moveLeft,
    dead: u.dead, fadingOut: u.fadingOut, routed: u.routed,
    onWallWalkway: u.onWallWalkway, mounted: u.mounted,
    primaryRanged: u.primaryRanged, canShootFlag: u.canShoot,
    shootingEnabled: u.shootingDisabled ? false : (u.shootingUndef ? undefined : true),
    bu,
    group: { position: { set(): void {} } },
    hpBarGroup: { position: { set(): void {} } },
  };
}

const METHOD_OF: Record<string, string> = {
  ram: '_siegeRamTowerStep',
  climb: '_trySiegeTowerClimb',
  infantry: '_siegeInfantryToTowerStep',
};

// Uruchomienie metody pinu na scenariuszu; wynik + stan koncowy (do porownania w Rust).
function run(c: any): any {
  const sc = makeScene(c.scene);
  const ru = makeUnit(c.unit);
  const done = (): void => { sc.ev.push({ k: 'done' }); };
  const ret: boolean = sc[METHOD_OF[c.fn]!](ru, done);
  return {
    ret,
    ev: sc.ev,
    scene: {
      occ: [...sc.occByKey.keys()].map((k: string) => k.split(',').map(Number)).sort((a: number[], b: number[]) => a[0] - b[0] || a[1] - b[1]),
      towerRows: [...sc.towerAtWallRows].sort((a: number, b: number) => a - b),
      everBreached: sc.wallEverBreached,
      log: sc.log,
    },
    unit: { q: ru.q, r: ru.r, moveLeft: enc(ru.moveLeft), onWallWalkway: ru.onWallWalkway },
  };
}

// ---------- losowanie scenariuszy ----------
function genScene(mode: string): any {
  const wallCol = mode === 'open' ? -1 : ri(4, 30);
  const gateRow = ri(4, 36);
  const rows: number[] = [];
  for (let r = Math.max(0, gateRow - 9); r <= Math.min(44, gateRow + 9); r++) if (rnd() < 0.85) rows.push(r);
  // Wiezy: w trybie 'climb'/'infantry' zwykle sa; w 'ram' czesto brak (wtedy wchodzi kontrola muru/bramy).
  const towerRows = (mode === 'climb' || mode === 'infantry' || rnd() < 0.3)
    ? rows.filter(() => rnd() < 0.25).slice(0, 3)
    : [];
  if ((mode === 'climb' || mode === 'infantry') && towerRows.length === 0 && rows.length > 0) towerRows.push(rows[0]!);
  const occ: number[][] = [];
  for (let i = ri(0, 14); i > 0; i--) occ.push([ri(Math.max(0, wallCol - 8), wallCol + 3), ri(0, 44)]);
  if (wallCol >= 0) for (const r of rows) if (rnd() < 0.15) occ.push([wallCol, r]);
  const blocked: number[][] = [];
  for (let i = ri(0, 5); i > 0; i--) blocked.push([ri(0, 12), ri(0, 44)]);
  const threats: any[] = [];
  const nThreat = mode === 'ram' ? ri(1, 4) : ri(0, 3);
  for (let i = nThreat; i > 0; i--) {
    threats.push({ q: ri(Math.max(0, wallCol - 10), wallCol + 2), r: ri(Math.max(0, gateRow - 8), Math.min(44, gateRow + 8)), range: ri(0, 5) });
  }
  return {
    finished: rnd() < 0.02,
    wallCol,
    gateRow,
    gateCol: wallCol,
    gateOpen: rnd() < 0.2,
    everBreached: rnd() < 0.12,
    wallTilesInit: rnd() < 0.2 ? 0 : ri(rows.length, rows.length + 4),
    wallRows: rows,
    towerRows,
    occ,
    blocked,
    threats,
  };
}

function genCase(fn: string, idx: number): any {
  // Tryb losowania: 'ram' (taran/wieza: brama, wieza pod murem), 'climb' (wejscie na korone), 'infantry' (piechota pod wieze).
  const mode = fn;
  const scene = genScene(mode === 'ram' && rnd() < 0.15 ? 'open' : mode);
  const pr = mode === 'ram'
    ? (rnd() < 0.5 ? NAMES[0]! : pick(NAMES))
    : mode === 'climb' ? pick([{ name: 'Piechota' }, { name: 'Rycerz' }, { name: 'Jeździec' }])
      : pick([{ name: 'Piechota' }, { name: 'Łucznik' }, { name: 'Piechota' }, { name: 'Jeździec' }]);
  const wallCol = scene.wallCol >= 0 ? scene.wallCol : 10;
  let q: number;
  let r: number;
  if (mode === 'climb' && scene.towerRows.length > 0 && wallCol >= 0) {
    // stanie tuz przy wiezy: kolumna wallBase, rzad sasiedni do rzedu wiezy
    const tr = pick(scene.towerRows as number[]);
    const side = rnd() < 0.5 ? [wallCol - 1, tr - 1] : [wallCol - 2, tr];
    q = side[0]!; r = side[1]!;
    if (r < 0) r = 0;
  } else {
    q = rnd() < 0.5 ? ri(Math.max(0, wallCol - 6), wallCol + 1) : ri(0, Math.max(0, wallCol + 3));
    r = ri(Math.max(0, scene.gateRow - 6), Math.min(44, scene.gateRow + 6));
  }
  // Przy murze, blisko bramy (taran): czesciej uruchamia galaz ataku bramy.
  if (mode === 'ram' && wallCol >= 0 && rnd() < 0.3) {
    q = wallCol - ri(0, 1); r = scene.gateRow - ri(0, 1);
  }
  // Otoczona jednostka (4 sasiednie kafle zajete): BFS bez sciezki -> galaz _advanceToward.
  if (rnd() < 0.12) {
    for (const [dc, dr] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) scene.occ.push([Math.max(0, q + dc), Math.max(0, r + dr)]);
  }
  const u: any = {
    side: rnd() < 0.92 ? 'atk' : 'def',
    q: Math.max(0, q), r,
    moveLeft: pick([0, 0.5, 1, 1.5, 2, 3, 4]),
    dead: rnd() < 0.03, fadingOut: rnd() < 0.03, routed: rnd() < 0.04,
    onWallWalkway: rnd() < 0.06, mounted: rnd() < 0.12,
    primaryRanged: rnd() < 0.2, canShoot: rnd() < 0.5,
    shootingDisabled: rnd() < 0.15, shootingUndef: rnd() < 0.6,
    name: pr.name, typ: (pr as any).typ,
  };
  // Wlasna komorka jednostki zwykle jest w occByKey (jak w scenie).
  if (rnd() < 0.95) scene.occ.push([u.q, u.r]);
  if (mode === 'climb' && rnd() < 0.6) {
    // Korona wolna czesciej: usun zajetosc kafla muru na wierszu jednostki.
    scene.occ = scene.occ.filter((o: number[]) => !(o[0] === wallCol && o[1] === u.r));
  }
  const bu = { nazwa: u.name, stats: u.typ === undefined ? { Jednostka: u.name } : { Typ: u.typ, Jednostka: u.name } };
  u.isSiegeUnit = isSiegeUnit(bu);
  u.isSiegeTower = isSiegeTower(bu);
  u.isRam = BattleScene.prototype._isRam.call(null, bu);
  if (mode === 'ram') {
    // Tarany/wieze oblezne: nazwa z listy oblezniczej.
    const siege = pick([{ name: 'Taran', typ: undefined }, { name: 'Wieża oblężnicza', typ: undefined }, { name: 'Katapulta', typ: 'Siege' }]) as any;
    if (rnd() < 0.85) {
      u.name = siege.name; u.typ = siege.typ;
      const bu2 = { nazwa: u.name, stats: u.typ === undefined ? { Jednostka: u.name } : { Typ: u.typ, Jednostka: u.name } };
      u.isSiegeUnit = isSiegeUnit(bu2);
      u.isSiegeTower = isSiegeTower(bu2);
      u.isRam = BattleScene.prototype._isRam.call(null, bu2);
    }
  }
  // Kazdy przypadek wykonuje PINOWY kod (run). Wejscia klasyfikacji = wyniki pinowych isSiegeUnit/isSiegeTower/_isRam.
  const c: any = { id: `${fn}-${idx}`, fn, scene, unit: u };
  // NaN moveLeft w marszu zapetlalby sie w pinie (ruch bez konca); NaN testujemy tylko w wejsciu na mur (bez marszu).
  if (fn === 'climb' && rnd() < 0.3) u.moveLeft = 'NaN';
  c.expect = run(c);
  c.cat = categorize(fn, c);
  return c;
}

// Kategorie pokrycia wyprowadzone z zachowania pinu (nie z kodu Rust).
function categorize(fn: string, c: any): string[] {
  const out: string[] = [];
  const e = c.expect;
  const kinds = new Set(e.ev.map((x: any) => x.k));
  if (!e.ret) out.push(`${fn}:false`);
  else out.push(`${fn}:true`);
  for (const k of kinds) out.push(`ev:${k}`);
  if (e.ev.some((x: any) => x.k === 'advance' && x.thenArrive)) out.push('advance:arrive');
  if (e.ev.some((x: any) => x.k === 'gate' && x.refused)) out.push('gate:refused');
  if (e.ev.some((x: any) => x.k === 'gate' && !x.refused)) out.push('gate:proceed');
  if (e.unit.moveLeft === 'NaN') out.push('nan:moveLeft');
  if (e.scene.everBreached && !c.scene.everBreached) out.push('breach:first');
  if (e.scene.log.length > 0) out.push('log:wylom');
  return out;
}

const PER_FN = 520;
const cases: any[] = [];
let idx = 0;
for (const fn of ['ram', 'climb', 'infantry']) {
  for (let i = 0; i < PER_FN; i++) cases.push(genCase(fn, idx++));
}

const tally: Record<string, number> = {};
for (const c of cases) for (const k of c.cat) tally[k] = (tally[k] ?? 0) + 1;

const doc = {
  meta: {
    pin: PIN,
    generator: 'rust-port/engine/tests/p6_siege_tactics_tower_gen.mts',
    fragmentSha256: digest,
    seed: 217,
    cases: cases.length,
    note: 'Wyjscia = wykonanie doslownych linii pinu (battleScene.ts / city-fortification.ts) w harnessie; atrapy sceny jak w naglowku generatora.',
    categories: tally,
  },
  cases,
};
const outDir = join(here, 'p6_siege_tactics_tower_vectors');
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'vectors.json'), JSON.stringify(doc, null, 1) + '\n', 'utf8');
console.log(`cases=${cases.length} sha256=${digest}`);
console.log(JSON.stringify(tally, null, 1));
