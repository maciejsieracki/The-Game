// R-RUSTPORT-P4-1H-RJ-REPIN-Q3: generator wektorow dryfu `RJ` (ruch marszu) do pinu `07d2fbd72`.
//
// Wykonuje URUCHOMIONY kod pinu (bez stubow logiki): `gra/src/units/setup.ts` (computePath z blokada
// oblezenia `setSiegeEntryBlocker`, MoveOccupancy, buildMoveOccupancy, trimSegmentEndOffPassThrough,
// isPassThroughHex, terrainMoveCost/embarkMoveCost z `gra/data/terrain-movement.json`),
// `gra/src/game/planned-march.ts` (planPathTurns, shouldStopAtObstacle, executeMarchStep,
// isNotifiableMarchStop, marchPausedLabel, registerMarchStop, clearMarchStop) oraz
// `gra/src/game/army-stack-limit.ts` (canJoinStackAt, trimPathToStackRoom).
// Zrodlo: `git archive 07d2fbd72 gra/src gra/data` rozpakowane do katalogu tymczasowego POZA repo
// (os.tmpdir), usuwanego po imporcie. Importy bez rozszerzenia rozwiazuje hak ladowania (`.ts`,
// `/index.ts`), `.json` -> `export default`.
//
// WYMAGANY Node >= 22.18.0 (22.x) albo >= 23.6.0. Generator sam uruchamia sie ponownie z flaga
// `--experimental-transform-types` (enumy TS w `types/hex.ts`). Sprawdzone na v22.23.4.
//
// Uzycie (z dowolnego katalogu w repo):
//   node rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs          -> zapisuje vectors.json
//   node rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs --check  -> EXIT 1 przy roznicy
//
// Straznik SHA-256: kazdy wykonywany fragment pinu (funkcja / klasa wycieta po nazwie z pliku z
// archiwum) ma zapisany skrot; zmiana pinu albo tresci -> EXIT 2.
// Kodowanie liczb: niecalkowite -> {"$f": String(x)}, NaN/+-Infinity/-0 -> {"$n": ...}.

import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { register } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

{
  const [maj, min] = process.versions.node.split('.').map(Number);
  const ok = maj > 23 || (maj === 23 && min >= 6) || (maj === 22 && min >= 18);
  if (!ok) {
    console.error(`Node ${process.versions.node} za stary: wymagany >= 22.18.0 (22.x) albo >= 23.6.0`);
    process.exit(2);
  }
}

// Ponowne uruchomienie z transformacja typow (enumy TS).
if (!process.execArgv.includes('--experimental-transform-types')) {
  const res = spawnSync(
    process.execPath,
    ['--experimental-transform-types', '--no-warnings', fileURLToPath(import.meta.url), ...process.argv.slice(2)],
    { stdio: 'inherit' },
  );
  process.exit(res.status ?? 2);
}

const PIN = '07d2fbd72';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'vectors.json');

// Fragmenty pinu [plik, nazwa]; skrot SHA-256 tekstu od deklaracji do domykajacego `}` w EXPECTED_SHA.
const FRAGMENTS = [
  ['gra/src/units/setup.ts', 'siegeBlocksEntry'],
  ['gra/src/units/setup.ts', 'withSiegeScope'],
  ['gra/src/units/setup.ts', 'MoveOccupancy'],
  ['gra/src/units/setup.ts', 'buildMoveOccupancy'],
  ['gra/src/units/setup.ts', 'isPassThroughHex'],
  ['gra/src/units/setup.ts', 'trimSegmentEndOffPassThrough'],
  ['gra/src/units/setup.ts', 'computePath'],
  ['gra/src/units/setup.ts', 'computePathImpl'],
  ['gra/src/units/setup.ts', 'pathCost'],
  ['gra/src/game/planned-march.ts', 'truncatePathToBudget'],
  ['gra/src/game/planned-march.ts', 'planPathTurns'],
  ['gra/src/game/planned-march.ts', 'isMarchAttackDest'],
  ['gra/src/game/planned-march.ts', 'shouldStopAtObstacle'],
  ['gra/src/game/planned-march.ts', 'executeMarchStep'],
  ['gra/src/game/planned-march.ts', 'isNotifiableMarchStop'],
  ['gra/src/game/planned-march.ts', 'marchPausedLabel'],
  ['gra/src/game/planned-march.ts', 'registerMarchStop'],
  ['gra/src/game/planned-march.ts', 'clearMarchStop'],
  ['gra/src/game/army-stack-limit.ts', 'ownUnitCountAt'],
  ['gra/src/game/army-stack-limit.ts', 'canJoinStackAt'],
  ['gra/src/game/army-stack-limit.ts', 'trimPathToStackRoom'],
  // Limit stosu: jedno zrodlo prawdy weba (main.ts armyStackLimit() -> BATTLE_MAX_PER_SIDE -> MAX_PER_SIDE).
  ['gra/src/main.ts', 'armyStackLimit'],
  ['gra/src/battle/battleScene.ts', 'MAX_PER_SIDE'],
  ['gra/src/battle/battleScene.ts', 'BATTLE_MAX_PER_SIDE'],
];
const EXPECTED_SHA = {
  'gra/src/units/setup.ts#siegeBlocksEntry': '86bcfd243864a1aaf4e681a6b948559bb45a19e8e6427debacdacd7869282d5e',
  'gra/src/units/setup.ts#withSiegeScope': 'be6aa7c7a018abe9ace6d15641d41a8dd7460db6195477bb0218a0a13a602d16',
  'gra/src/units/setup.ts#MoveOccupancy': 'b68d7c82b3cf9254a8d053702f4328fc6f8e8d2d21fe9ca311accf44d23a8010',
  'gra/src/units/setup.ts#buildMoveOccupancy': 'ee4b4405ed12348d125cc09d8bf355b2ce071af6553f23d894c55667accde45d',
  'gra/src/units/setup.ts#isPassThroughHex': '9071c9818d8be00e61898234dc88ee0dca59836bdad539b5311588dceb5edd72',
  'gra/src/units/setup.ts#trimSegmentEndOffPassThrough': '35f006972e56aa116eaaf7bc45c2942cef98e9eb8e860d9216c4539138d679cc',
  'gra/src/units/setup.ts#computePath': '30b8c3b265e86b1bdcfc2169a7c3975a5c9a07441aa975294ce47cca730b4f46',
  'gra/src/units/setup.ts#computePathImpl': '648ad884701531b5488ad035f5c31b7baa80f5914c3a48e0bf93e07dd292e765',
  'gra/src/units/setup.ts#pathCost': '676a34ac96c7383885599e9f349ddd93cdf6c62aaf8a1c5f08cf9eee37b8d862',
  'gra/src/game/planned-march.ts#truncatePathToBudget': '835227cf1abb6842ae5338f4e1805857de4b6190e977d8a3400bcd3937a75ee5',
  'gra/src/game/planned-march.ts#planPathTurns': '17159204b11c37beeeb20f8642f7aa31b54f64dd293cdb564a86c6aa6b1e3f60',
  'gra/src/game/planned-march.ts#isMarchAttackDest': '76890455d4549f0a7f1ab604a7dbfae75cc6932188785ec45b3147005677232f',
  'gra/src/game/planned-march.ts#shouldStopAtObstacle': '72d61be6a49f28e8e7abf774bf59f87384e1dbb9649949548523082c82fa23fc',
  'gra/src/game/planned-march.ts#executeMarchStep': '9d8ab19f4e80944688494583df67b0f161bda92532098383c75139d1274fefac',
  'gra/src/game/planned-march.ts#isNotifiableMarchStop': 'e147b9fadce1b240119555ad8e31e3c4e41ae8f076dd6a050610378577e68011',
  'gra/src/game/planned-march.ts#marchPausedLabel': 'e48daf29282dfdbb5740f2825cd221aa1e8a88bbfe2b44cb6eb7312b31a81fb3',
  'gra/src/game/planned-march.ts#registerMarchStop': '2f33fea1182a7c6f195cfe508ebf3b6e1478639206c5aef25c3d981b20c80d2b',
  'gra/src/game/planned-march.ts#clearMarchStop': '8549e5b0cf5dc55a2097193214af10f55ef1c41b3853961aaccab310cbde815a',
  'gra/src/game/army-stack-limit.ts#ownUnitCountAt': 'eca15143c2e125987b5a8cc9300ac496c42e0f1bc976f3de65466b2ebc2d500a',
  'gra/src/game/army-stack-limit.ts#canJoinStackAt': 'c57b43e335d8352a77ba4ab8f99c553155df09f7e009eeedbbe4ebc78ad4e2d2',
  'gra/src/game/army-stack-limit.ts#trimPathToStackRoom': '9ed3f96ea130d2b6b9c049d7a84ca0ec2cecc499b4cebf158f578af8d147c55a',
  'gra/src/main.ts#armyStackLimit': 'bd0fdc4579ae29795c18bf3d80f9ca5f732ac8011da5ce75dac2a917074eae00',
  'gra/src/battle/battleScene.ts#MAX_PER_SIDE': '16c5204ed7f6ff9f9430ed98ce0731ee3a33320145348f2a17e3f48a5319b6bb',
  'gra/src/battle/battleScene.ts#BATTLE_MAX_PER_SIDE': 'eca47889d7d6612f3412bf59922644f42d583c2078fb096c08642d11684481cc',
};

const sha256 = (text) => createHash('sha256').update(text).digest('hex');

function extract(source, name) {
  const lines = source.split('\n');
  // Stala jednolinijkowa (`const NAME = ...;` / `export const NAME = ...;`): fragment = ta linia.
  const constRe = new RegExp(`^(export )?const ${name} = [^;]*;$`);
  const constHits = lines.map((l, i) => (constRe.test(l) ? i : -1)).filter((i) => i >= 0);
  if (constHits.length === 1) return { from: constHits[0] + 1, to: constHits[0] + 1, text: lines[constHits[0]] };
  if (constHits.length > 1) throw new Error(`stala ${name}: oczekiwano 1 deklaracji, jest ${constHits.length}`);
  const re = new RegExp(`^(\\s*)(export )?(function ${name}\\b|function ${name}<|class ${name}\\b)`);
  const hits = lines.map((l, i) => (re.test(l) ? i : -1)).filter((i) => i >= 0);
  if (hits.length !== 1) throw new Error(`fragment ${name}: oczekiwano 1 deklaracji, jest ${hits.length}`);
  const start = hits[0];
  const indent = lines[start].match(/^\s*/)[0];
  let end = start + 1;
  while (end < lines.length && lines[end] !== `${indent}}`) end++;
  return { from: start + 1, to: end + 1, text: lines.slice(start, end + 1).join('\n') };
}

// ---------------------------------------------------------------------------
// pin: git archive -> katalog tymczasowy poza repo
// ---------------------------------------------------------------------------
const work = mkdtempSync(join(tmpdir(), 'p4-1h-rj-repin-'));
let setup;
let pm;
let asl;
let terrainMovement;
const excerpts = [];
const excerptText = {};
try {
  const top = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: HERE, encoding: 'utf8' }).trim();
  const tar = execFileSync('git', ['archive', PIN, 'gra/src', 'gra/data'], { cwd: top, maxBuffer: 1 << 30 });
  execFileSync('tar', ['-x', '-C', work], { input: tar });
  let bad = false;
  for (const [file, name] of FRAGMENTS) {
    const src = readFileSync(join(work, file), 'utf8');
    const ex = extract(src, name);
    const hash = sha256(ex.text);
    const want = EXPECTED_SHA[`${file}#${name}`];
    excerpts.push({ file, name, from: ex.from, to: ex.to, sha256: hash });
    excerptText[name] = ex.text;
    if (hash !== want) {
      console.error(`STRAZNIK SHA: ${file}#${name} ${ex.from}-${ex.to} = ${hash}, oczekiwano ${want}`);
      bad = true;
    }
  }
  if (bad && !process.argv.includes('--print-sha')) process.exit(2);
  if (process.argv.includes('--print-sha')) {
    const o = {};
    for (const e of excerpts) o[`${e.file}#${e.name}`] = e.sha256;
    console.log(JSON.stringify(o, null, 2));
    process.exit(0);
  }
  const hooks = `
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export async function resolve(specifier, context, next) {
  try { return await next(specifier, context); } catch (e) {
    for (const suf of ['.ts', '/index.ts']) {
      try { return await next(specifier + suf, context); } catch {}
    }
    throw e;
  }
}
export async function load(url, context, next) {
  if (url.endsWith('.json')) {
    return { format: 'module', source: 'export default ' + readFileSync(fileURLToPath(url), 'utf8') + ';', shortCircuit: true };
  }
  return next(url, context);
}`;
  register(`data:text/javascript,${encodeURIComponent(hooks)}`);
  const mod = (p) => pathToFileURL(join(work, 'gra/src', p)).href;
  const origLog = console.log;
  const origWarn = console.warn;
  console.log = () => {};
  console.warn = () => {};
  setup = await import(mod('units/setup.ts'));
  pm = await import(mod('game/planned-march.ts'));
  asl = await import(mod('game/army-stack-limit.ts'));
  console.log = origLog;
  console.warn = origWarn;
  terrainMovement = JSON.parse(readFileSync(join(work, 'gra/data/terrain-movement.json'), 'utf8'));
} finally {
  rmSync(work, { recursive: true, force: true });
}
setup.configureTerrainMovement(terrainMovement.costs, terrainMovement.forestExtra);

// ---------------------------------------------------------------------------
// kodowanie
// ---------------------------------------------------------------------------
function enc(v) {
  if (v === undefined) return undefined;
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return { $n: 'NaN' };
    if (v === Infinity) return { $n: 'Infinity' };
    if (v === -Infinity) return { $n: '-Infinity' };
    if (Object.is(v, -0)) return { $n: '-0' };
    if (!Number.isInteger(v)) return { $f: String(v) };
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => (x === undefined ? null : enc(x)));
  if (v && typeof v === 'object') {
    const o = {};
    for (const [k, x] of Object.entries(v)) {
      const e = enc(x);
      if (e !== undefined) o[k] = e;
    }
    return o;
  }
  return v;
}

let seedState = 0x41f3a9d7;
function rnd() {
  seedState = (Math.imul(seedState, 1664525) + 1013904223) >>> 0;
  return seedState / 4294967296;
}
const rint = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const chance = (p) => rnd() < p;
const key = (q, r) => `${q},${r}`;
const pts = (path) => path.map((h) => [h.q, h.r]);
const sortedPairs = (set) => [...set].map((k) => k.split(',').map(Number)).sort((a, b) => a[0] - b[0] || a[1] - b[1]);

// ---------------------------------------------------------------------------
// mapy: [q, r, teren, las, rzeka, ulepszenie|null, ulepszenia|null, wioska, wlasciciel]
// ---------------------------------------------------------------------------
const WEIGHTS = {
  flat: [['laka', 0.7], ['rownina', 0.3]],
  mixed: [['laka', 0.35], ['rownina', 0.25], ['wzgorza', 0.15], ['gory', 0.06], ['pustynia', 0.08], ['plytkie_morze', 0.06], ['morze', 0.05]],
  roads: [['laka', 0.45], ['rownina', 0.3], ['wzgorza', 0.15], ['pustynia', 0.1]],
};
function weighted(list) {
  let x = rnd();
  for (const [v, w] of list) {
    if (x < w) return v;
    x -= w;
  }
  return list[list.length - 1][0];
}
function genMap(kind, radius) {
  const hexes = [];
  for (let q = -radius; q <= radius; q++) {
    for (let r = -radius; r <= radius; r++) {
      if (Math.abs(q + r) > radius) continue;
      if ((q !== 0 || r !== 0) && chance(0.04)) continue;
      const t = weighted(WEIGHTS[kind]);
      const las = kind !== 'flat' && chance(0.18);
      const rzeka = kind !== 'flat' && chance(0.08);
      let ul = null;
      if (kind === 'roads') ul = pick(['droga', 'droga', 'droga_brukowana', null]);
      hexes.push([q, r, t, las, rzeka, ul, null, false, false]);
    }
  }
  return hexes;
}
function buildMap(rows) {
  const out = { szerokoscQ: 0, wysokoscR: 0, hexes: {} };
  for (const [q, r, t, las, rzeka, ul, uls, wioska, wlasc] of rows) {
    const hex = {
      coords: { q, r },
      terenBazowy: t,
      nakladka: las ? 'las' : 'brak',
      widocznosc: {},
      rzeka: { obecna: rzeka, krawedzie: [] },
      wioska: { istnieje: wioska, ludnosc: wioska ? 1 : 0 },
      wlasciciel: wlasc ? 'p1' : null,
    };
    if (ul !== null) hex.ulepszenie = ul;
    if (uls !== null) hex.ulepszenia = uls;
    out.hexes[key(q, r)] = hex;
  }
  return out;
}
const MAP_SPECS = [['flat', 6], ['flat', 7], ['mixed', 6], ['mixed', 7], ['roads', 6], ['mixed', 5]];
const mapRows = MAP_SPECS.map(([k, r]) => genMap(k, r));
const maps = mapRows.map(buildMap);
const mapKeys = maps.map((m) => Object.keys(m.hexes));

const mkUnit = (id, ownerId, q, r, extra = {}) => ({ id, ownerId, typeId: 'Hoplita', category: 'piechota', q, r, ruch: 3, ruchLeft: 3, ...extra });
const costFnOf = (spec) => (spec === 'embark' ? setup.embarkMoveCost : undefined);

// ---------------------------------------------------------------------------
// marsz: planPathTurns / shouldStopAtObstacle / executeMarchStep / computePath z MoveOccupancy
// ---------------------------------------------------------------------------
const OWN_TEXT = 'własna jednostka na trasie — brak wolnego heksu w zasięgu';
const marchCases = [];
const counts = {};
const bump = (c) => { counts[c] = (counts[c] ?? 0) + 1; };

function runMarchCase(spec) {
  const { mi, mover, dest, units, siege, siegeOwner, blockedCities, perTurn, budget, costSpec, plainSet } = spec;
  const m = maps[mi];
  const fn = costFnOf(costSpec);
  const built = setup.buildMoveOccupancy(units, mover.ownerId, [mover.id]);
  const occ = plainSet ? new Set(built) : built;
  const siegeSet = new Set(siege.map(([q, r]) => key(q, r)));
  setup.setSiegeEntryBlocker(siege.length > 0 ? (u, q, r) => siegeSet.has(key(q, r)) && u.ownerId !== siegeOwner : null);
  try {
    const cityBlock = new Set(blockedCities.map(([q, r]) => key(q, r)));
    const canOccupy = (q, r) => !cityBlock.has(key(q, r));
    const path = setup.computePath(mover, m, dest[0], dest[1], occ, fn);
    const plan = pm.planPathTurns(mover, dest[0], dest[1], m, occ, perTurn, budget, fn);
    const destObj = { destQ: dest[0], destR: dest[1] };
    const stopBudget = budget ?? perTurn;
    const stop = pm.shouldStopAtObstacle(mover, destObj, m, occ, plan.segmentPath, stopBudget, fn);
    const exec = pm.executeMarchStep(mover, destObj, m, occ, stopBudget, canOccupy, perTurn, undefined, fn);
    // kategorie (opis pokrycia; liczone z wynikow pinu)
    const cats = [];
    const pass = built.passThrough;
    if (plainSet) cats.push('plain_set');
    if (!plainSet && plan.fullPath.slice(0, -1).some((h) => pass.has(key(h.q, h.r)))) cats.push('pass_through_mid_route');
    if (!plainSet && plan.fullPath.length > 0) {
      const raw = pm.truncatePathToBudget(plan.fullPath, budget ?? Math.max(1, perTurn), m, fn);
      if (raw.length !== plan.segmentPath.length) cats.push('segment_end_trimmed');
    }
    if (exec.stopDetail === OWN_TEXT) cats.push('only_own_hex_in_reach');
    if (!plainSet && pass.has(key(dest[0], dest[1])) && plan.fullPath.length > 0) cats.push('dest_own_unit_merge');
    if (siege.some(([q, r]) => q === dest[0] && r === dest[1])) cats.push('siege_dest');
    if (siege.some(([q, r]) => !(q === dest[0] && r === dest[1]))) cats.push('siege_mid');
    // Predykat zalezny od jednostki: oblezenie nalezy do wlasciciela ruszajacego sie -> pin zwraca false.
    if (siege.length > 0 && siegeOwner === mover.ownerId) {
      cats.push('siege_predicate_false_for_mover');
      // Wynik pinu rozni sie od tego samego oblezenia z obcym wlascicielem (predykat realnie decyduje).
      setup.setSiegeEntryBlocker((u, q, r) => siegeSet.has(key(q, r)) && u.ownerId !== mover.ownerId + 3);
      const foreignPath = setup.computePath(mover, m, dest[0], dest[1], occ, fn);
      setup.setSiegeEntryBlocker((u, q, r) => siegeSet.has(key(q, r)) && u.ownerId !== siegeOwner);
      if (JSON.stringify(pts(foreignPath)) !== JSON.stringify(pts(path))) cats.push('siege_predicate_changes_path');
    }
    if (cats.length === 0) cats.push('other');
    for (const c of cats) bump(`march:${c}`);
    marchCases.push(enc({
      map: mi, unit: mover, dest, units, siege, siegeOwner, blockedCities, perTurn, budget, costFn: costSpec ?? null,
      plainSet, cats,
      occBlocked: sortedPairs(built), occPassThrough: sortedPairs(built.passThrough),
      out: {
        computePath: pts(path),
        plan: { ...plan, fullPath: pts(plan.fullPath), segmentPath: pts(plan.segmentPath) },
        stop,
        exec: { ...exec, movePath: pts(exec.movePath) },
      },
    }));
  } finally {
    setup.setSiegeEntryBlocker(null);
  }
}

function randomHex(mi) { return pick(mapKeys[mi]).split(',').map(Number); }

// Bazowa trasa bez przeszkod (do rozmieszczenia jednostek / oblezen na niej).
function freePath(mi, mover, dest, fn) {
  return setup.computePath(mover, maps[mi], dest[0], dest[1], new Set(), fn);
}

let uid = 0;
function genScenario(kind, siegeOwnerArg = 3) {
  for (let attempt = 0; attempt < 200; attempt++) {
    const mi = rint(0, maps.length - 1);
    const costSpec = chance(0.15) ? 'embark' : null;
    const fn = costFnOf(costSpec);
    const [sq, sr] = randomHex(mi);
    const perTurn = pick([1, 2, 2, 3, 3, 4, 6]);
    const mover = mkUnit('m', 0, sq, sr, { ruch: perTurn, ruchLeft: perTurn });
    const [dq, dr] = randomHex(mi);
    if (dq === sq && dr === sr && kind !== 'same') continue;
    const dest = kind === 'same' ? [sq, sr] : [dq, dr];
    const free = kind === 'same' ? [] : freePath(mi, mover, dest, fn);
    if (kind !== 'same' && kind !== 'no_path' && free.length < 2) continue;
    const units = [];
    const add = (owner, q, r) => units.push({ id: `u${uid++}`, ownerId: owner, q, r });
    const siege = [];
    const blockedCities = [];
    let budget = chance(0.3) ? undefined : pick([0, 0.5, 1, 1, 2, 2, 3, 4, 5]);
    // tlo: kilka losowych jednostek
    for (let i = 0; i < rint(0, 4); i++) {
      const [q, r] = randomHex(mi);
      if (q === sq && r === sr) continue;
      add(pick([0, 0, 1, 2]), q, r);
    }
    const inner = free.slice(0, -1);
    if (kind === 'mid') {
      for (const h of inner) if (chance(0.45)) add(0, h.q, h.r);
    } else if (kind === 'seg_end') {
      // wlasne jednostki na heksach wokol konca segmentu
      const b = budget ?? perTurn;
      const seg = pm.truncatePathToBudget(free, b, maps[mi], fn);
      if (seg.length === 0 || seg.length >= free.length) continue;
      for (let i = Math.max(0, seg.length - rint(1, 3)); i < seg.length; i++) add(0, seg[i].q, seg[i].r);
    } else if (kind === 'only_own') {
      const b = budget ?? perTurn;
      const seg = pm.truncatePathToBudget(free, b, maps[mi], fn);
      if (seg.length === 0 || seg.length >= free.length) continue;
      for (let i = 0; i < seg.length; i++) add(0, seg[i].q, seg[i].r);
    } else if (kind === 'merge') {
      add(0, dest[0], dest[1]);
      if (chance(0.5)) add(0, dest[0], dest[1]);
      for (const h of inner) if (chance(0.3)) add(0, h.q, h.r);
      if (chance(0.4)) budget = undefined;
    } else if (kind === 'foreign') {
      for (const h of inner) if (chance(0.25)) add(pick([1, 2]), h.q, h.r);
      for (const h of inner) if (chance(0.25)) add(0, h.q, h.r);
      if (chance(0.3)) add(1, dest[0], dest[1]);
    } else if (kind === 'siege_dest' || kind === 'siege_own_dest') {
      siege.push(dest);
      if (chance(0.3)) add(0, dest[0], dest[1]);
    } else if (kind === 'siege_mid' || kind === 'siege_own_mid') {
      for (const h of inner) if (chance(0.35)) siege.push([h.q, h.r]);
      if (siege.length === 0 && inner.length > 0) siege.push([inner[0].q, inner[0].r]);
      for (const h of inner) if (chance(0.2)) add(0, h.q, h.r);
    } else if (kind === 'blocked_city') {
      const b = budget ?? perTurn;
      const seg = pm.truncatePathToBudget(free, b, maps[mi], fn);
      if (seg.length > 0) blockedCities.push([seg[seg.length - 1].q, seg[seg.length - 1].r]);
      for (const h of inner) if (chance(0.2)) add(0, h.q, h.r);
    } else if (kind === 'plain') {
      for (const h of inner) if (chance(0.4)) add(0, h.q, h.r);
    }
    // mover jest w units (wykluczony przez excludeIds jak w webie)
    units.push({ id: mover.id, ownerId: 0, q: sq, r: sr });
    const siegeOwner = siegeOwnerArg;
    runMarchCase({
      mi, mover, dest, units, siege, siegeOwner, blockedCities, perTurn, budget, costSpec,
      plainSet: kind === 'plain',
    });
    return;
  }
  throw new Error(`nie udalo sie wygenerowac scenariusza ${kind}`);
}

const PLAN = [
  ['mid', 70], ['seg_end', 70], ['only_own', 50], ['merge', 50], ['foreign', 50], ['siege_dest', 35],
  ['siege_mid', 45], ['blocked_city', 25], ['plain', 40], ['same', 5], ['no_path', 10],
];
for (const [kind, n] of PLAN) for (let i = 0; i < n; i++) genScenario(kind);

// ---------------------------------------------------------------------------
// bezposrednio: buildMoveOccupancy, trimSegmentEndOffPassThrough, isPassThroughHex
// ---------------------------------------------------------------------------
const occCases = [];
for (let i = 0; i < 40; i++) {
  const units = [];
  for (let j = 0; j < rint(0, 10); j++) units.push({ id: `o${j}`, ownerId: rint(0, 3), q: rint(-2, 2), r: rint(-2, 2) });
  const mover = rint(0, 3);
  const exclude = units.filter(() => chance(0.2)).map((u) => u.id);
  const occ = setup.buildMoveOccupancy(units, mover, exclude);
  const probes = [];
  for (let j = 0; j < 6; j++) {
    const q = rint(-2, 2);
    const r = rint(-2, 2);
    probes.push([q, r, setup.isPassThroughHex(occ, q, r), setup.isPassThroughHex(new Set(occ), q, r)]);
  }
  occCases.push({ units, mover, exclude, blocked: sortedPairs(occ), passThrough: sortedPairs(occ.passThrough), probes });
  bump('direct:buildMoveOccupancy');
}
const trimCases = [];
for (let i = 0; i < 60; i++) {
  const seg = [];
  for (let j = 0; j < rint(0, 6); j++) seg.push({ q: rint(-2, 2), r: rint(-2, 2) });
  const fullLength = seg.length + pick([0, 0, 1, 2, -1]);
  const occ = new setup.MoveOccupancy();
  for (let j = 0; j < rint(0, 6); j++) occ.passThrough.add(key(rint(-2, 2), rint(-2, 2)));
  for (const h of seg) if (chance(0.3)) occ.passThrough.add(key(h.q, h.r));
  for (let j = 0; j < rint(0, 3); j++) occ.add(key(rint(-2, 2), rint(-2, 2)));
  const plain = chance(0.2);
  const out = setup.trimSegmentEndOffPassThrough(seg, fullLength, plain ? new Set(occ) : occ);
  trimCases.push({ segment: pts(seg), fullLength, blocked: sortedPairs(occ), passThrough: sortedPairs(occ.passThrough), plain, out: pts(out) });
  bump('direct:trimSegmentEndOffPassThrough');
}

// ---------------------------------------------------------------------------
// limit stosu: canJoinStackAt / trimPathToStackRoom (limit jako parametr; gra: armyStackLimit() = 500)
// Stosy kodowane zwiezle: [q, r, owner, count, prefix] -> id `${prefix}${i}`.
// ---------------------------------------------------------------------------
// Wartosc CZYTANA z pinu (battleScene.ts `const MAX_PER_SIDE = N;`), nie wpisana recznie; lancuch
// main.ts armyStackLimit() -> BATTLE_MAX_PER_SIDE -> MAX_PER_SIDE pilnowany straznikiem SHA wyzej.
const ARMY_STACK_LIMIT = (() => {
  const m = /^const MAX_PER_SIDE = (\d+);$/.exec(excerptText.MAX_PER_SIDE ?? '');
  if (!m) throw new Error('MAX_PER_SIDE: brak literalu liczbowego w pinie');
  if (excerptText.BATTLE_MAX_PER_SIDE !== 'export const BATTLE_MAX_PER_SIDE = MAX_PER_SIDE;') throw new Error('BATTLE_MAX_PER_SIDE != MAX_PER_SIDE');
  if (!/\breturn BATTLE_MAX_PER_SIDE;/.test(excerptText.armyStackLimit ?? '')) throw new Error('armyStackLimit() != BATTLE_MAX_PER_SIDE');
  return Number(m[1]);
})();
const expandStacks = (stacks) => {
  const out = [];
  for (const [q, r, owner, count, prefix] of stacks) for (let i = 0; i < count; i++) out.push({ id: `${prefix}${i}`, ownerId: owner, q, r });
  return out;
};
const stackCases = [];
function stackCase(label, stacks, moving, path, limit) {
  const units = [...expandStacks(stacks), ...moving];
  const trimmed = asl.trimPathToStackRoom(units, moving, path.map(([q, r]) => ({ q, r })), limit);
  const joins = path.map(([q, r]) => asl.canJoinStackAt(units, moving, q, r, limit));
  stackCases.push({ label, stacks, moving, path, limit, out: { trimmed: pts(trimmed), joins } });
  bump(`stack:${label}`);
}
// granice jawne: 499 + 1 dopuszczony, 500 + 1 odmowa, 498 + 2 dopuszczone, 499 + 2 odmowa
stackCase('boundary_499_plus_1_ok', [[1, 0, 0, 499, 'a']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
stackCase('boundary_500_plus_1_refused', [[1, 0, 0, 500, 'a']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
stackCase('boundary_498_plus_2_ok', [[1, 0, 0, 498, 'a']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }, { id: 'mv1', ownerId: 0, q: 0, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
stackCase('boundary_499_plus_2_refused', [[1, 0, 0, 499, 'a']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }, { id: 'mv1', ownerId: 0, q: 0, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
// obce jednostki nie licza sie do limitu
stackCase('foreign_not_counted', [[1, 0, 1, 500, 'f'], [1, 0, 0, 499, 'a']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
// ruszajace sie jednostki juz na heksie nie sa liczone podwojnie
stackCase('moving_already_there', [[1, 0, 0, 499, 'a']], [{ id: 'mv0', ownerId: 0, q: 1, r: 0 }], [[1, 0]], ARMY_STACK_LIMIT);
// trim: pelny ostatni heks -> cofniecie do poprzedniego z miejscem
stackCase('trim_last_full', [[2, 0, 0, 500, 'a'], [1, 0, 0, 10, 'b']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [[1, 0], [2, 0]], ARMY_STACK_LIMIT);
stackCase('trim_all_full_empty', [[1, 0, 0, 500, 'a'], [2, 0, 0, 500, 'b']], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [[1, 0], [2, 0]], ARMY_STACK_LIMIT);
stackCase('trim_empty_path', [], [{ id: 'mv0', ownerId: 0, q: 0, r: 0 }], [], ARMY_STACK_LIMIT);
stackCase('trim_empty_moving', [[1, 0, 0, 900, 'a']], [], [[1, 0]], ARMY_STACK_LIMIT);
// losowe z malym limitem (te same funkcje, parametr limit)
for (let i = 0; i < 40; i++) {
  const limit = pick([1, 2, 3, 4, 5, ARMY_STACK_LIMIT]);
  const plen = rint(0, 5);
  const path = [];
  for (let j = 0; j < plen; j++) path.push([j + 1, rint(-1, 1)]);
  const stacks = [];
  for (const [q, r] of path) {
    if (chance(0.7)) {
      const big = limit === ARMY_STACK_LIMIT;
      stacks.push([q, r, 0, big ? pick([0, 1, 498, 499, 500, 501]) : rint(0, limit + 1), `s${q}_${r}_`]);
    }
    if (chance(0.3)) stacks.push([q, r, pick([1, 2]), rint(1, 3), `x${q}_${r}_`]);
  }
  const moving = [];
  for (let j = 0; j < rint(0, 3); j++) {
    const at = chance(0.3) && path.length > 0 ? pick(path) : [0, 0];
    moving.push({ id: `mv${j}`, ownerId: 0, q: at[0], r: at[1] });
  }
  stackCase('random', stacks, moving, path, limit);
}

// ---------------------------------------------------------------------------
// powiadomienia: isNotifiableMarchStop / marchPausedLabel / registerMarchStop / clearMarchStop
// ---------------------------------------------------------------------------
const REASONS = [null, 'obstacle', 'no_path', 'no_movement', 'blocked_city', 'fog'];
const notify = { isNotifiable: [], pausedLabel: [], sequences: [] };
for (const r of REASONS) {
  notify.isNotifiable.push({ reason: r, out: pm.isNotifiableMarchStop(r ?? undefined) });
  bump('notify:isNotifiableMarchStop');
  for (const d of [null, '', 'własny opis', OWN_TEXT]) {
    notify.pausedLabel.push({ reason: r, detail: d, out: pm.marchPausedLabel(r ?? undefined, d ?? undefined) ?? null });
    bump('notify:marchPausedLabel');
  }
}
for (let s = 0; s < 25; s++) {
  const notified = new Map();
  const ops = [];
  for (let i = 0; i < rint(3, 12); i++) {
    const unit = pick(['u1', 'u2', 'u3']);
    if (chance(0.25)) {
      pm.clearMarchStop(notified, unit);
      ops.push({ op: 'clear', unit, state: [...notified.entries()].sort() });
    } else {
      const reason = pick(REASONS);
      const out = pm.registerMarchStop(notified, unit, reason ?? undefined);
      ops.push({ op: 'register', unit, reason, out, state: [...notified.entries()].sort() });
    }
  }
  notify.sequences.push(ops);
  bump('notify:registerClearSequence');
}

// ---------------------------------------------------------------------------
// obrona r1 (zarzut 4 Evaluatora): oblezenie, w ktorym predykat zalezy od jednostki i zwraca false
// (siegeOwner = owner ruszajacego sie). Dopisane NA KONCU, zeby nie przesuwac ziarna wczesniejszych sekcji.
// ---------------------------------------------------------------------------
for (const [kind, n] of [['siege_own_dest', 25], ['siege_own_mid', 25]]) for (let i = 0; i < n; i++) genScenario(kind, 0);

const out = {
  pin: PIN,
  generator: 'rust-port/engine/tests/p4_1h_rj_repin_vectors/gen.mjs',
  armyStackLimit: ARMY_STACK_LIMIT,
  ownUnitInReachDetail: OWN_TEXT,
  excerpts,
  maps: mapRows,
  counts,
  march: marchCases,
  occupancy: occCases,
  trimSegment: trimCases,
  stack: stackCases,
  notify,
};
const json = JSON.stringify(out) + '\n';
if (process.argv.includes('--check')) {
  const cur = readFileSync(OUT, 'utf8');
  if (cur !== json) {
    console.error('vectors.json NIEZGODNY z pinem');
    process.exit(1);
  }
  console.log('vectors.json zgodny z pinem');
} else {
  writeFileSync(OUT, json);
  console.log('zapisano vectors.json');
}
for (const ex of excerpts) console.log(`${ex.file}#${ex.name} ${ex.from}-${ex.to} sha256=${ex.sha256}`);
console.log(JSON.stringify(counts));
