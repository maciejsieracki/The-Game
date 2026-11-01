// Generator wektorow REPIN-TERYTORIUM-FORTY (forty/terytorium).
// PIN weba: 4bbef081d. Kod weba URUCHAMIANY BEZ ZMIAN: gra/src/map/territory.ts (cityTerritoryRadius,
// territoryOwnerAt) i gra/src/game/fort-territory.ts (fortTerritoryNodes, isHexInForeignFortTerritory,
// nextFortSeq, backfillFortOrder, applyFortCaptureByOccupation) bundlowane esbuildem ze zrodel
// `git archive 4bbef081d gra/src gra/data` do <WORK_DIR> poza repo (zero buildu/dev w gra/).
//
// Uruchomienie (z korzenia repo, z czystego drzewa):
//   node gen-repin-teren-vectors.mjs <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_FILE>
// ESBUILD_MAIN_JS = .../node_modules/esbuild/lib/main.js (uzyto esbuild 0.28.2, node 22).
// Wszystkie liczby to calkowite (bezpieczne w JSON); losowosc: deterministyczny LCG (ziarno stale).
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const [repoRoot, workDir, esbuildMain, outFile] = process.argv.slice(2);
if (!repoRoot || !workDir || !esbuildMain || !outFile) throw new Error('uzycie: <REPO_ROOT> <WORK_DIR> <ESBUILD_MAIN_JS> <OUT_FILE>');
const PIN = execFileSync('git', ['-C', repoRoot, 'rev-parse', '4bbef081d'], { encoding: 'utf8' }).trim();

rmSync(workDir, { recursive: true, force: true });
mkdirSync(join(workDir, 'pin'), { recursive: true });
execFileSync('git', ['-C', repoRoot, 'archive', '-o', join(workDir, 'pin.tar'), PIN, 'gra/src', 'gra/data']);
execFileSync('tar', ['-xf', join(workDir, 'pin.tar'), '-C', join(workDir, 'pin')]);
const src = join(workDir, 'pin/gra/src');
const esbuild = await import(pathToFileURL(esbuildMain).href);
const entry = join(workDir, 'entry.ts');
writeFileSync(
  entry,
  `export { cityTerritoryRadius, territoryOwnerAt } from '${join(src, 'map/territory')}';\n` +
    `export { fortTerritoryNodes, isHexInForeignFortTerritory, nextFortSeq, backfillFortOrder, applyFortCaptureByOccupation } from '${join(src, 'game/fort-territory')}';\n`,
);
const out = join(workDir, 'bundle.mjs');
await esbuild.build({ entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile: out, loader: { '.json': 'json' }, logLevel: 'error' });
const W = await import(pathToFileURL(out).href);

let seed = 20261101;
const rnd = () => {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return seed / 0x7fffffff;
};
const randInt = (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = (a) => a[Math.floor(rnd() * a.length)];
const chance = (p) => rnd() < p;
const dist = (aq, ar, bq, br) => (Math.abs(aq - bq) + Math.abs(ar - br) + Math.abs(-aq - ar + bq + br)) / 2;
const hexesWithin = (R) => {
  const o = [];
  for (let dq = -R; dq <= R; dq++) for (let dr = -R; dr <= R; dr++) if (Math.abs(dq + dr) <= R) o.push([dq, dr]);
  return o;
};

const KINDS = ['city', 'fort', 'posterunek'];
const mkNode = (q, r, kind, pop, owner, order) => {
  const n = { q, r, pop: kind === 'city' ? pop : 0, level: 1, ownerId: owner };
  if (kind === 'fort') n.isFort = true;
  if (kind === 'posterunek') n.isOutpost = true;
  if (order) n.order = order;
  return n;
};
const enc = (o) => JSON.parse(JSON.stringify(o)); // undefined -> brak pola

// ---- A. promienie + brzegi N-1/N/N+1 (6 kierunkow + naroznik) ----
const radiusCases = [];
for (const kind of KINDS) {
  for (const pop of kind === 'city' ? [0, 1, 4, 5, 6, 10, 14, 15, 16, 30] : [0]) {
    const node = mkNode(2, -1, kind, pop, 0);
    const { ownerId, order, ...cn } = node;
    const R = W.cityTerritoryRadius(cn);
    const edge = [];
    for (const dd of [R - 1, R, R + 1]) {
      for (const [dq, dr] of [[1, 0], [0, 1], [-1, 1], [-1, 0], [0, -1], [1, -1]]) {
        const q = 2 + dq * Math.max(dd, 0), r = -1 + dr * Math.max(dd, 0);
        edge.push({ q, r, d: dist(q, r, 2, -1), owner: W.territoryOwnerAt(q, r, [node]) });
      }
    }
    radiusCases.push({ node: cn, ownerId, radius: R, edge });
  }
}

// ---- B. territoryOwnerAt: losowe + zaprojektowane remisy ----
const ownerCases = [];
const pushOwner = (nodes, queries) =>
  ownerCases.push({ nodes: enc(nodes), queries: queries.map(([q, r]) => ({ q, r, owner: W.territoryOwnerAt(q, r, nodes) })) });
const allQ = hexesWithin(8);
for (let c = 0; c < 900; c++) {
  const n = randInt(1, 6);
  const nodes = [];
  for (let i = 0; i < n; i++) {
    const kind = pick(['city', 'fort', 'fort', 'posterunek', 'posterunek']);
    const ord = kind !== 'city' && chance(0.6) ? { turn: randInt(0, 2), seq: randInt(0, 2) } : undefined;
    nodes.push(mkNode(randInt(-4, 4), randInt(-4, 4), kind, randInt(1, 9), randInt(0, 3), ord));
  }
  const qs = [];
  for (const nd of nodes) qs.push([nd.q, nd.r]);
  for (let k = 0; k < 14; k++) qs.push(pick(allQ));
  pushOwner(nodes, qs);
}
// remisy fortow: ten sam heks w zasiegu dwoch fortow, rozne kombinacje order (turn/seq rowne/rozne/brak)
const orders = [undefined, { turn: 0, seq: 0 }, { turn: 0, seq: 1 }, { turn: 1, seq: 0 }, { turn: 1, seq: 5 }, { turn: 2, seq: 0 }];
for (const o1 of orders) for (const o2 of orders) for (const o3 of [undefined, orders[3]]) {
  for (const kinds of [['fort', 'fort'], ['fort', 'posterunek'], ['posterunek', 'fort'], ['posterunek', 'posterunek']]) {
    const nodes = [mkNode(0, 0, kinds[0], 0, 1, o1), mkNode(3, 0, kinds[1], 0, 2, o2)];
    if (o3 !== undefined || chance(0.3)) nodes.push(mkNode(0, 3, 'fort', 0, 3, o3));
    pushOwner(nodes, [[1, 0], [2, 0], [0, 0], [3, 0], [1, 1], [0, 2], [0, 3], [4, 0], [5, 0], [-3, 0], [3, 3]]);
    pushOwner([...nodes].reverse(), [[1, 0], [2, 0], [0, 1]]);
  }
}
// miasto przed fortem (miasto dalej niz fort, ale miasto w zasiegu wygrywa) + poza zasiegiem miasta fort
for (const pop of [5, 6, 8]) {
  for (const [fq, fo] of [[1, 1], [6, 2]]) {
    const nodes = [mkNode(fq, 0, 'fort', 0, fo, { turn: 0, seq: 0 }), mkNode(0, 0, 'city', pop, 0)];
    pushOwner(nodes, hexesWithin(pop + 6).filter((_, i) => i % 3 === 0));
    pushOwner([...nodes].reverse(), [[fq, 0], [0, 0], [pop, 0], [pop + 1, 0]]);
  }
}

// ---- C. fortTerritoryNodes ----
const mkFort = (q, r, type, owner, extra = {}) => ({ q, r, ownerId: owner, type, ...extra });
const randFort = () => {
  const f = mkFort(randInt(-4, 4), randInt(-4, 4), pick(['fort', 'posterunek']), randInt(0, 3));
  if (chance(0.25)) f.contestedUseless = chance(0.6);
  if (chance(0.7)) f.seq = randInt(0, 5);
  if (chance(0.6)) f.builtAtTurn = randInt(0, 4);
  return f;
};
const ftnCases = [];
for (let c = 0; c < 300; c++) {
  const forts = Array.from({ length: randInt(0, 6) }, randFort);
  ftnCases.push({ forts: enc(forts), nodes: enc(W.fortTerritoryNodes(forts)) });
}

// ---- D. isHexInForeignFortTerritory (allNodes jak main.ts: miasta + fortTerritoryNodes) ----
const foreignCases = [];
for (let c = 0; c < 500; c++) {
  const forts = Array.from({ length: randInt(1, 5) }, randFort);
  const cities = Array.from({ length: randInt(0, 3) }, () => mkNode(randInt(-5, 5), randInt(-5, 5), 'city', randInt(1, 8), randInt(0, 3)));
  const allNodes = [...cities, ...W.fortTerritoryNodes(forts)];
  const queries = [];
  for (let k = 0; k < 12; k++) {
    const [q, r] = pick(allQ);
    const ownerId = randInt(0, 3);
    queries.push({ q, r, ownerId, result: W.isHexInForeignFortTerritory(q, r, ownerId, forts, allNodes) });
  }
  foreignCases.push({ forts: enc(forts), cities: enc(cities), queries });
}

// ---- E. nextFortSeq / backfillFortOrder ----
const seqCases = [];
for (let c = 0; c < 300; c++) {
  const forts = Array.from({ length: randInt(0, 6) }, randFort);
  const next = W.nextFortSeq(forts);
  const copy = enc(forts);
  const filled = W.backfillFortOrder(copy);
  seqCases.push({ forts: enc(forts), next, filled, after: enc(copy) });
}

// ---- F. applyFortCaptureByOccupation ----
const captureCases = [];
for (let c = 0; c < 900; c++) {
  const forts = [];
  const taken = new Set();
  for (let i = 0; i < randInt(1, 4); i++) {
    const f = randFort();
    f.q = randInt(-2, 2); f.r = randInt(-2, 2);
    forts.push(f);
  }
  const units = Array.from({ length: randInt(0, 7) }, () => {
    const f = chance(0.7) ? pick(forts) : null;
    return { ownerId: randInt(0, 4), q: f ? f.q : randInt(-2, 2), r: f ? f.r : randInt(-2, 2), military: chance(0.75) };
  });
  const war = new Set();
  for (let a = 0; a <= 4; a++) for (let b = a + 1; b <= 4; b++) if (chance(0.5)) war.add(`${a},${b}`);
  const selfEnemy = chance(0.2); // patologiczny callback isEnemy(x,x)=true: izoluje galaz 'wlasciciel ma jednostke'
  const isEnemy = (a, b) => (a === b ? selfEnemy : war.has(`${Math.min(a, b)},${Math.max(a, b)}`));
  const barb = chance(0.5) ? 4 : -1;
  const isBarb = (o) => o === barb;
  const input = enc(forts);
  const events = W.applyFortCaptureByOccupation(forts, units, isEnemy, isBarb);
  captureCases.push({ forts: input, units, war: [...war], selfEnemy, barbarian: barb, events: enc(events), after: enc(forts) });
}

const fixture = { pin: '4bbef081d', pinFull: PIN, radiusCases, ownerCases, ftnCases, foreignCases, seqCases, captureCases };
writeFileSync(outFile, JSON.stringify(fixture));
console.log(JSON.stringify({ radius: radiusCases.length, owner: ownerCases.length, ownerQueries: ownerCases.reduce((a, c) => a + c.queries.length, 0), ftn: ftnCases.length, foreign: foreignCases.length, seq: seqCases.length, capture: captureCases.length, captureEvents: captureCases.reduce((a, c) => a + c.events.length, 0), foreignTrue: foreignCases.reduce((a, c) => a + c.queries.filter((q) => q.result).length, 0) }));
