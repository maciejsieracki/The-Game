// R-RUSTPORT-P6-SIEGE-TRANSFER-Q9-Q1: generator wektorow dla wrapperow `beginWonderTransferWatch` /
// `settleWonderTransfer` z pinu webu.
//
// Zrodla (pin 07d2fbd72f758705f8e1d59cc4968027ffbafe75, pliki tylko do odczytu, poza repo):
//   * gra/src/main.ts - WYCINANE sa dokladnie dwie deklaracje funkcji (brace-matching), bez przepisywania tresci;
//   * gra/src/game/wonder-transfer.ts - caly plik (`export ` zdejmowane), dostarcza snapshot/plan/apply.
// Typy zdejmowane przez esbuild transformSync (loader ts). Strazy SHA-256 fragmentow: EXPECTED_SHA ponizej;
// niezgodnosc = pin dryfuje, generator odmawia pracy.
//
// Wykonywane REALNIE w node. Zaleznosci spoza wycinka (stan gry) to jawne atrapy w harnessie:
//   * buildAllTerritoryNodes -> lista wezlow z wejscia przypadku (odpowiednik buildAllTerritoryNodes());
//   * territoryOwnerAt -> DETERMINISTYCZNY STUB (najblizszy wezel w promieniu, remis = pierwszy, brak = null).
//     Prawdziwe territoryOwnerAt (gra/src/map/territory.ts) NIE jest portowane w Rust (wstrzykiwane przez wolajacego);
//     wektory testuja kontrakt wrapperow, nie stub terytorium.
//   * getWonderById, isMe (=== ME()), turn, showWonderCompletedNoticeDeferred, focusCameraOnWonder,
//     syncWonderRender, refreshWondersPickerIfOpen, markCityStateDirty, console.log - rejestrowane w trace.
//
// Uzycie (katalog z node_modules/esbuild POZA repo):
//   node tests/p6_siege_wonder_wrappers_gen.mjs <gra/src/main.ts> <gra/src/game/wonder-transfer.ts> <katalog z esbuild> \
//     > tests/p6_siege_wonder_wrappers_vectors/vectors.json

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import path from 'node:path';

const [mainPath, wtPath, esbuildDir] = process.argv.slice(2);
if (!mainPath || !wtPath || !esbuildDir) {
  throw new Error('uzycie: gen.mjs <main.ts> <wonder-transfer.ts> <katalog z esbuild>');
}

// SHA-256 wycinkow z pinu 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (strazy dryfu).
const EXPECTED_SHA = {
  beginWonderTransferWatch: 'ec411d8a350b4df768065bc40fed4ccae1b297bf45513d4e2df64d4faf12760c',
  settleWonderTransfer: 'c682b2cda3c2d048648837edc12335e031d2c6fff05e8d19cfdf4b3b202dcf8c',
  'wonder-transfer.ts': '34db2bd0099b65eae670f026dd715920e6ec620068a0b99ea8db46bfd11ef8d4',
};

const require = createRequire(path.join(esbuildDir, 'package.json'));
const { transformSync } = require('esbuild');

// Wycina `function NAME(` ... dopasowany `}` (licznik klamer; pin nie ma klamer w literalach lancuchow w tych funkcjach).
function extractFunction(text, name) {
  const head = `    function ${name}(`;
  const start = text.indexOf(head);
  if (start < 0 || text.indexOf(head, start + 1) >= 0) {
    throw new Error(`funkcja ${name}: brak lub niejednoznaczna`);
  }
  const open = text.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < text.length; i++) {
    if (text[i] === '{') depth++;
    else if (text[i] === '}') {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  throw new Error(`funkcja ${name}: niedomkniety blok`);
}

const mainText = readFileSync(mainPath, 'utf8');
const fragBegin = extractFunction(mainText, 'beginWonderTransferWatch').replace(/^ {4}/gm, '');
const fragSettle = extractFunction(mainText, 'settleWonderTransfer').replace(/^ {4}/gm, '');
const wtSrc = readFileSync(wtPath, 'utf8');

const sha = s => createHash('sha256').update(s).digest('hex');
const got = {
  beginWonderTransferWatch: sha(fragBegin),
  settleWonderTransfer: sha(fragSettle),
  'wonder-transfer.ts': sha(wtSrc),
};
const drift = Object.keys(EXPECTED_SHA).filter(k => got[k] !== EXPECTED_SHA[k]);
if (drift.length > 0) {
  const lines = drift.map(k => `${k}: oczekiwano ${EXPECTED_SHA[k]}, jest ${got[k]}`).join('; ');
  throw new Error(`strazyk SHA-256 (pin dryfuje): ${lines}`);
}

const wtJs = transformSync(wtSrc.replace(/^export /gm, ''), { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const fragJs = transformSync(fragBegin + '\n' + fragSettle, { loader: 'ts', format: 'esm', target: 'es2022' }).code;

const HARNESS = `
let placedWorldWonders = [];
let turn = 0;
let nodesState = [];
let mePlayer = 0;
let names = {};
let logs = [];
let notices = [];
let uiTrace = [];
let focusLog = [];
// Stub territoryOwnerAt: najblizszy wezel w swoim promieniu (remis = pierwszy), brak = null.
const territoryOwnerAt = (q, r, nodes) => {
  let best = null;
  let bestD = Infinity;
  for (const n of nodes) {
    const dq = q - n.q, dr = r - n.r, ds = -q - r - (-n.q - n.r);
    const d = (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
    if (d <= n.radius && d < bestD) { bestD = d; best = n.ownerId; }
  }
  return best;
};
const buildAllTerritoryNodes = () => nodesState;
const isMe = id => id === mePlayer;
const getWonderById = id => (Object.prototype.hasOwnProperty.call(names, id) ? { nazwa: names[id] } : undefined);
const console = { log: m => logs.push(String(m)) };
const focusCameraOnWonder = id => focusLog.push(id);
const showWonderCompletedNoticeDeferred = n => {
  const rec = { variant: n.variant, nazwa: n.nazwa, locationLabel: n.locationLabel, bodyHtml: n.bodyHtml, showOnMapWonderId: null };
  if (n.onShowOnMap) { focusLog = []; n.onShowOnMap(); rec.showOnMapWonderId = focusLog.length ? focusLog[focusLog.length - 1] : null; }
  notices.push(rec);
};
const syncWonderRender = () => uiTrace.push('syncWonderRender');
const refreshWondersPickerIfOpen = () => uiTrace.push('refreshWondersPickerIfOpen');
const markCityStateDirty = () => uiTrace.push('markCityStateDirty');
return {
  setState(ws, t, nodes, me, nm) {
    placedWorldWonders = ws; turn = t; nodesState = nodes; mePlayer = me; names = nm;
    logs = []; notices = []; uiTrace = []; focusLog = [];
  },
  begin(exclude) { return beginWonderTransferWatch(exclude); },
  settle(before) { const n = settleWonderTransfer(before); return { n, logs, notices, uiTrace }; },
  wonders() { return placedWorldWonders; },
};
`;

const F = new Function(wtJs + '\n' + fragJs + '\n' + HARNESS);
const H = F();

// ---- helpers ----
function snapToObj(m) {
  if (m === null) return null;
  const o = {};
  for (const [k, v] of m) o[k] = v;
  return o;
}
function objToMap(o) {
  if (o === null) return null;
  return new Map(Object.entries(o));
}

// LCG deterministyczny (inne ziarno niz Q8).
let seed = 20261113;
function rnd(n) {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  // wysokie bity (niskie bity LCG maja krotki okres, np. parzystosc)
  return Math.floor(seed / 65536) % n;
}
const pick = arr => arr[rnd(arr.length)];

const OWNER_POOL = [-99, -1, 0, 1, 2, 3, 2147483647, -2147483648];
const WONDER_IDS = ['w0', 'w1', 'w2', 'w3', 'big', 'dup', '007', 'x y'];
const NAMES = { w0: 'Wielka Biblioteka', w1: 'Kolos', big: 'Mega', '007': '', dup: 'Dup' };

function makeWonders() {
  const n = rnd(5);
  const out = [];
  for (let i = 0; i < n; i++) {
    out.push({ wonderId: pick(WONDER_IDS), q: pick([-2, -1, 0, 1, 2, 3]), r: pick([-2, -1, 0, 1, 2]), ownerId: pick(OWNER_POOL) });
  }
  return out;
}
function makeNodes() {
  const n = rnd(6);
  const out = [];
  for (let i = 0; i < n; i++) {
    const kind = rnd(4); // 0 miasto, 1 fort, 2 posterunek, 3 miasto
    out.push({
      q: pick([-2, -1, 0, 1, 2, 3]),
      r: pick([-2, -1, 0, 1, 2]),
      radius: pick([0, 1, 2, 3, 5]),
      ownerId: pick(OWNER_POOL),
      isFort: kind === 1,
      isOutpost: kind === 2,
    });
  }
  return out;
}
function makeBeforeObj(wonders) {
  // Arbitralna migawka PRZED: brak klucza / null / liczba (rowniez spoza listy cudow).
  const o = {};
  for (const w of wonders) {
    const c = rnd(5);
    if (c === 0) continue; // brak klucza = undefined
    if (c === 1) o[w.wonderId] = null;
    else o[w.wonderId] = pick(OWNER_POOL);
  }
  if (rnd(3) === 0) o[pick(WONDER_IDS)] = pick(OWNER_POOL);
  return o;
}

// Wyrownanie wlascicielstwa do migawki PRZED (wiekszosc przypadkow spojna, zeby plan nie byl pusty).
function alignOwners(wonders, snapObj) {
  for (const w of wonders) {
    const v = snapObj[w.wonderId];
    if (v !== undefined && v !== null && v >= 0 && rnd(4) > 0) w.ownerId = v;
  }
}

const cases = { begin: [], settle: [], chain: [] };

// ---- begin: losowe ----
for (let i = 0; i < 120; i++) {
  const wonders = makeWonders();
  const nodes = makeNodes();
  let exclude = null;
  const ex = rnd(3);
  if (ex === 1 && nodes.length > 0) {
    const nd = pick(nodes);
    exclude = { q: nd.q, r: nd.r, ownerId: nd.ownerId };
  } else if (ex === 2) {
    exclude = { q: pick([-1, 0, 1]), r: pick([-1, 0, 1]), ownerId: pick(OWNER_POOL) };
  }
  H.setState(JSON.parse(JSON.stringify(wonders)), 0, nodes, 0, NAMES);
  const res = H.begin(exclude === null ? undefined : exclude);
  cases.begin.push({ input: { wonders, nodes, exclude }, expected: { snapshot: snapToObj(res) } });
}

// ---- begin: brzegi jawne ----
{
  H.setState([], 0, [], 0, NAMES);
  cases.begin.push({ input: { wonders: [], nodes: [], exclude: null }, expected: { snapshot: null } });
  const wonders = [
    { wonderId: 'dup', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'dup', q: 1, r: 0, ownerId: 2 },
  ];
  const nodes = [
    { q: 0, r: 0, radius: 1, ownerId: 3, isFort: false, isOutpost: false },
    { q: 1, r: 0, radius: 0, ownerId: 2, isFort: true, isOutpost: false },
  ];
  H.setState(JSON.parse(JSON.stringify(wonders)), 0, nodes, 0, NAMES);
  cases.begin.push({
    input: { wonders, nodes, exclude: null },
    expected: { snapshot: snapToObj(H.begin(undefined)) },
  });
  // wykluczenie miasta: wezel miasta znika z listy, fort o tym samym q,r/owner zostaje
  H.setState(JSON.parse(JSON.stringify(wonders)), 0, nodes, 0, NAMES);
  const ex = { q: 0, r: 0, ownerId: 3 };
  cases.begin.push({
    input: { wonders, nodes, exclude: ex },
    expected: { snapshot: snapToObj(H.begin(ex)) },
  });
}

// ---- settle: losowe, z migawka PRZED arbitralna lub z begin ----
for (let i = 0; i < 320; i++) {
  const wonders = makeWonders();
  const nodesBefore = makeNodes();
  const nodesAfter = rnd(2) === 0 ? nodesBefore : makeNodes();
  const me = pick([0, 1, 2, -99]);
  const turn = pick([0, 1, 37, 2147483647, -1]);
  let beforeObj;
  if (rnd(6) === 0) {
    beforeObj = null;
  } else if (rnd(2) === 0) {
    beforeObj = makeBeforeObj(wonders);
  } else {
    H.setState(JSON.parse(JSON.stringify(wonders)), turn, nodesBefore, me, NAMES);
    beforeObj = snapToObj(H.begin(undefined));
    alignOwners(wonders, beforeObj);
  }
  const ws = JSON.parse(JSON.stringify(wonders));
  H.setState(ws, turn, nodesAfter, me, NAMES);
  const r = H.settle(objToMap(beforeObj));
  cases.settle.push({
    input: { wonders, nodes: nodesAfter, before: beforeObj, turn, me, names: NAMES },
    expected: { transferred: r.n, logs: r.logs, notices: r.notices, uiTrace: r.uiTrace, wonders: H.wonders() },
  });
}

// ---- settle: brzegi jawne ----
{
  const base = [
    { wonderId: 'w0', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'big', q: 1, r: 0, ownerId: 2 },
    { wonderId: '007', q: 2, r: 0, ownerId: -1 },
    { wonderId: 'w0', q: 0, r: 0, ownerId: 1 },
    { wonderId: 'x y', q: 3, r: 0, ownerId: 0 },
  ];
  const nodes = [
    { q: 0, r: 0, radius: 2, ownerId: 2, isFort: false, isOutpost: false },
    { q: 2, r: 0, radius: 0, ownerId: 0, isFort: true, isOutpost: false },
  ];
  const cases2 = [
    { before: null, me: 0 },
    { before: {}, me: 0 },
    { before: { w0: 1, big: 2, '007': -1, 'x y': 0 }, me: 2 },
    { before: { w0: 1, big: 2, '007': -1, 'x y': 0 }, me: 1 },
    { before: { w0: 1, big: 2, '007': -1, 'x y': 0 }, me: 9 },
    { before: { w0: null, big: 2147483647, '007': -99, 'x y': -2147483648 }, me: 2147483647 },
  ];
  for (const c of cases2) {
    const ws = JSON.parse(JSON.stringify(base));
    H.setState(ws, 2147483647, nodes, c.me, NAMES);
    const r = H.settle(objToMap(c.before));
    cases.settle.push({
      input: { wonders: base, nodes, before: c.before, turn: 2147483647, me: c.me, names: NAMES },
      expected: { transferred: r.n, logs: r.logs, notices: r.notices, uiTrace: r.uiTrace, wonders: H.wonders() },
    });
  }
  // pusta lista cudow przy niepustej migawce
  H.setState([], 1, nodes, 0, NAMES);
  const r0 = H.settle(new Map([['w0', 1]]));
  cases.settle.push({
    input: { wonders: [], nodes, before: { w0: 1 }, turn: 1, me: 0, names: NAMES },
    expected: { transferred: r0.n, logs: r0.logs, notices: r0.notices, uiTrace: r0.uiTrace, wonders: [] },
  });
}

// ---- chain: begin -> zmiana wezlow -> settle (pelny przebieg, jak w main.ts) ----
for (let i = 0; i < 120; i++) {
  const wonders = makeWonders();
  const nodesA = makeNodes();
  const me = pick([0, 1, 2]);
  const turn = 1 + rnd(400);
  H.setState(JSON.parse(JSON.stringify(wonders)), turn, nodesA, me, NAMES);
  const before = H.begin(undefined);
  alignOwners(wonders, snapToObj(before));
  const nodesB = makeNodes();
  const ws = JSON.parse(JSON.stringify(wonders));
  H.setState(ws, turn, nodesB, me, NAMES);
  const r = H.settle(before);
  cases.chain.push({
    input: { wonders, nodesBefore: nodesA, nodesAfter: nodesB, turn, me, names: NAMES },
    expected: {
      before: snapToObj(before),
      transferred: r.n,
      logs: r.logs,
      notices: r.notices,
      uiTrace: r.uiTrace,
      wonders: H.wonders(),
    },
  });
}

const out = {
  source: {
    main: 'gra/src/main.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (beginWonderTransferWatch, settleWonderTransfer)',
    wonderTransfer: 'gra/src/game/wonder-transfer.ts @ 07d2fbd72f758705f8e1d59cc4968027ffbafe75',
    sha256: got,
  },
  generator: 'tests/p6_siege_wonder_wrappers_gen.mjs',
  stubs: 'territoryOwnerAt: najblizszy wezel w promieniu (remis=pierwszy), brak=null',
  counts: { begin: cases.begin.length, settle: cases.settle.length, chain: cases.chain.length },
  cases,
};
const json = JSON.stringify(out, null, 1) + '\n';
if (/NaN|Infinity/.test(json)) throw new Error('wektory zawieraja NaN/Infinity');
process.stdout.write(json);
