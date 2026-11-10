// P6.M12 runda 2 (Obrona, zarzut 1-3): polowanie na WEJSCIA, ktore zabijaja mutacje, ktore przezyly w R1.
//
// Metoda (bez przepisywania logiki weba): kazda mutacja Rust (`run-mutations.py`) ma odpowiednik TS, czyli
// kopie `clusters.ts` / `cluster-spawn.ts` z JEDNYM zmienionym fragmentem (te same zmiany co w Rust).
// Skrypt uruchamia ORYGINALNY web i wszystkie kopie zmutowane na tych samych wejsciach (mapa + opcje) i szuka
// wejsc, na ktorych wynik sie ROZNI. Takie wejscie, nagrane w wektorach z oryginalnego weba, zabija tez mutacje
// Rust (port ma 0 rozbieznosci z oryginalem). Wejscie, dla ktorego nie istnieje zadna roznica po duzej liczbie prob,
// jest dowodem empirycznym (obok dowodu analitycznego w dokumencie) na mutant rownowazny / galaz nieosiagalna.
//
// Sondy (probes) w kopii oryginalu liczą, ktore galezie sa osiagane (kierowanie polowania i raport pokrycia).
//
// Uzycie (z katalogu runu; web = git archive pinu `edb8fb56`):
//   node --experimental-transform-types --no-warnings --import ./m12-loader-register.mjs \
//     hunt-m12-mutants.mjs <WEB_ROOT> <VECTORS_JSON> <WYJSCIE_JSON> <ziarno> <liczba_map> [id_mutacji ...]
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [, , webRootArg, vecArg, outArg, seedArg, nMapsArg, ...onlyIds] = process.argv;
if (!webRootArg || !vecArg || !outArg) {
  console.error('usage: <WEB_ROOT> <VECTORS_JSON> <OUT_JSON> <seed> <nMaps> [mutIds...]');
  process.exit(2);
}
const webRoot = presolve(webRootArg);
const MAPDIR = join(webRoot, 'gra/src/map');
const srcPath = (p) => join(webRoot, 'gra/src', p);
const url = (p) => pathToFileURL(p).href;
const huntSeed = Number(seedArg ?? 1);
const HUNT_MODE = process.env.HUNT_MODE ?? 'wide';
const nMaps = Number(nMapsArg ?? 40);

globalThis.__HITS = {};
globalThis.__H = (id) => {
  globalThis.__HITS[id] = (globalThis.__HITS[id] ?? 0) + 1;
};

const origLog = console.log;
const origWarn = console.warn;
const quiet = (fn) => {
  console.log = () => {};
  console.warn = () => {};
  try {
    return fn();
  } finally {
    console.log = origLog;
    console.warn = origWarn;
  }
};

// ---------------------------------------------------------------------------
// Moduly: oryginal bez dziennika + sondy; mutanty
// ---------------------------------------------------------------------------
const clustersText = readFileSync(join(MAPDIR, 'clusters.ts'), 'utf8');
const spawnText = readFileSync(join(MAPDIR, 'cluster-spawn.ts'), 'utf8');
const DIAG = 'regiony[ci]!.length';
if (clustersText.split(DIAG).length !== 2) throw new Error('dziennik');

function count(text, s) {
  return text.split(s).length - 1;
}
// rep: { old, new, all?: bool, nth?: 1-based, after?: napis - zliczanie od jego pierwszego wystapienia }
function applyRep(text, rep, label) {
  const start = rep.after ? text.indexOf(rep.after) : 0;
  if (start < 0) throw new Error(`${label}: brak 'after'`);
  const head = text.slice(0, start);
  const tail = text.slice(start);
  const n = count(tail, rep.old);
  if (rep.all) {
    if (n < 1) throw new Error(`${label}: brak fragmentu`);
    return head + tail.split(rep.old).join(rep.new);
  }
  const nth = rep.nth ?? 1;
  if (rep.nth === undefined && n !== 1) throw new Error(`${label}: fragment wystepuje ${n} razy (oczekiwano 1): ${rep.old.slice(0, 60)}`);
  if (n < nth) throw new Error(`${label}: za malo wystapien`);
  let idx = -1;
  for (let k = 0; k < nth; k++) idx = tail.indexOf(rep.old, idx + 1);
  return head + tail.slice(0, idx) + rep.new + tail.slice(idx + rep.old.length);
}
const CC = 'export function computeClusters(';
const noDiagRep = { old: DIAG, new: 'regiony[ci]?.length' };

// Sondy w kopii oryginalu (clusters.ts).
const PROBES = [
  { old: '  while (centrumy.length < nTypy) {\n', new: "  while (centrumy.length < nTypy) {\n    globalThis.__H(centrumy.length === 0 ? 'fill0' : 'fill');\n" },
  { old: '  while (activeCentrumy.length < nTypy) {\n', new: "  while (activeCentrumy.length < nTypy) {\n    globalThis.__H(activeCentrumy.length === nTypy - 1 ? 'tcLast' : 'tc');\n" },
  { old: '    if (!cap) {\n      const last = pickSpawnHexWithCapitalGates(', new: "    if (!cap) {\n      globalThis.__H('tcFail');\n      const last = pickSpawnHexWithCapitalGates(" },
  { old: '    const unusedKeys = [\n      ...rosterSource.filter(k => k !== playerKlucz', new: "    if (klastry.length < nTypy) globalThis.__H('top1');\n    const unusedKeys = [\n      ...rosterSource.filter(k => k !== playerKlucz" },
  { old: '        if (!alt) break;', new: "        globalThis.__H(alt ? 'alt' : 'altNull');\n        if (!alt) break;" },
  { old: "    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) {\n      if (typeof console !== 'undefined') {\n        console.warn(\n          `[clusters] Pominięto typ '${activeKlucze[ci] ?? `typ${ci}`}'` +\n          ` — brak hexu", new: "    if (!foreignLayoutResult || foreignLayoutResult.cities.length === 0) {\n      globalThis.__H('skipNoHex');\n      if (typeof console !== 'undefined') {\n        console.warn(\n          `[clusters] Pominięto typ '${activeKlucze[ci] ?? `typ${ci}`}'` +\n          ` — brak hexu" },
  { old: '      && !passesMinSeaDistGate(seaDist, foreignCap.q, foreignCap.r, softSeaFloor)\n    ) {', new: "      && !passesMinSeaDistGate(seaDist, foreignCap.q, foreignCap.r, softSeaFloor)\n    ) {\n      globalThis.__H('skipSea');" },
  { old: '      { q: foreignCap.q, r: foreignCap.r },\n      placedCapitals,\n      minCapitalSep,\n    )) {', new: "      { q: foreignCap.q, r: foreignCap.r },\n      placedCapitals,\n      minCapitalSep,\n    )) {\n      globalThis.__H('skipSep');" },
  { old: '    const forced = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);\n    if (forced) {\n      playerCentrumFinal = forced;', new: "    const forced = pickPlayerClusterCenter(map, landCache, ladowe, mapCenter, rand, seaDist, minSeaDist);\n    globalThis.__H('forced');\n    if (forced) {\n      playerCentrumFinal = forced;" },
  { old: '    if (fixed) {\n      const relocatedLayout', new: "    globalThis.__H(fixed ? 'fixedYes' : 'fixedNull');\n    if (fixed) {\n      const relocatedLayout" },
  { old: '    resolvePlayerCapitalPos();\n  }\n\n  placedCapitals.push(playerCapitalPos);', new: "    globalThis.__H('resolveSep');\n    resolvePlayerCapitalPos();\n  }\n\n  placedCapitals.push(playerCapitalPos);" },
  { old: '  if (!passesPlayerStartMassGate(map, playerCapitalPos.q, playerCapitalPos.r, landCache)) {\n    resolvePlayerCapitalPos();', new: "  if (!passesPlayerStartMassGate(map, playerCapitalPos.q, playerCapitalPos.r, landCache)) {\n    globalThis.__H('resolveMass');\n    resolvePlayerCapitalPos();" },
  { old: '  if (activeCentrumy.length > regiony.length || activeCentrumy.length > activeKlucze.length) {', new: "  if (activeKlucze.length < activeCentrumy.length) globalThis.__H('klaszFill');\n  if (activeCentrumy.length > regiony.length || activeCentrumy.length > activeKlucze.length) {\n    globalThis.__H('reassign');" },
  { old: '    if (playerRepackFinal.stateCities.length > 0 || playerRepackFinal.growthSlot) {', new: "    if ((playerRepackFinal.stateCities.length > 0) !== !!playerRepackFinal.growthSlot) globalThis.__H('rfXor');\n    if (playerRepackFinal.stateCities.length === 0 && !playerRepackFinal.growthSlot && playerStateSlots.length > 0) globalThis.__H('pendDiff');\n    if (playerRepackFinal.stateCities.length > 0 || playerRepackFinal.growthSlot) {" },
  { old: '    clusterRegions.push(region);\n    placedCapitals.push({ q: foreignCap.q, r: foreignCap.r });', new: "    if (!foreignRepack.growthSlot && foreignLayoutResult.growthSlot) globalThis.__H('fgo');\n    clusterRegions.push(region);\n    placedCapitals.push({ q: foreignCap.q, r: foreignCap.r });" },
  { old: '        if (d >= minCapitalSep) continue;\n\n        const fixIdx = caps[j]!.ki > caps[i]!.ki ? j : i;', new: "        if (d >= minCapitalSep) continue;\n        globalThis.__H('hardViol');\n\n        const fixIdx = caps[j]!.ki > caps[i]!.ki ? j : i;", optional: true },
  { old: '  // FALA 193: HARD sep może dropnąć typ — dopełnij z powrotem do nTypy (sep twarde).\n  if (klastry.length < nTypy) {', new: "  if (klastry.length < nTypy) globalThis.__H('top2');\n  if (klastry.length < nTypy) {" },
];

function writeModule(name, text) {
  const p = join(MAPDIR, name);
  writeFileSync(p, text);
  return p;
}

// Kopia oryginalu: bez dziennika + sondy
let baseText = applyRep(clustersText, noDiagRep, 'nodiag');
let probeText = baseText;
for (const pr of PROBES) {
  try {
    probeText = applyRep(probeText, pr, 'probe');
  } catch (e) {
    if (!pr.optional) throw e;
  }
}
const baseMod = await import(url(writeModule('clusters.m12h-base.ts', baseText)));
const probeMod = await import(url(writeModule('clusters.m12h-probe.ts', probeText)));

// ---------------------------------------------------------------------------
// Definicje mutacji TS (odpowiedniki mutacji Rust z run-mutations.py)
// ---------------------------------------------------------------------------
// reach: probe(y), z ktorych co najmniej jedna musi byc osiagnieta, zeby mutacja mogla roznic wynik
// (null = zawsze uruchamiaj); big: tylko mapy o krotszym boku >= 80.
const CMUTS = [
  { id: 'min-dyst-order-sep', reps: [{ old: '(minCapitalSepEarly > 0\n        ? minCapitalSepEarly', new: '(minCapitalSepEarly > 1000\n        ? minCapitalSepEarly' }], reach: null },
  { id: 'fill-centers-player-gate', reps: [{ old: 'requirePlayerMassGate: centrumy.length === 0,', new: 'requirePlayerMassGate: false,' }], reach: ['fill0'] },
  { id: 'topup-centers-local-land', reps: [{ old: 'requireLocalLand: activeCentrumy.length < nTypy - 1,', new: 'requireLocalLand: true,' }], reach: ['tcLast'] },
  { id: 'player-growth-reserve-0-initial', reps: [{ old: 'growthReserve: CLUSTER_GROWTH_RESERVE,', new: 'growthReserve: 0,', nth: 1, after: CC }], reach: null },
  { id: 'player-growth-reserve-0-final', reps: [{ old: 'growthReserve: CLUSTER_GROWTH_RESERVE,', new: 'growthReserve: 0,', nth: 2, after: CC }], reach: null },
  { id: 'player-pending-from-layout', reps: [{ old: 'pendingStateSlots: playerStateSlots,', new: 'pendingStateSlots: [],' }], reach: ['pendDiff'] },
  { id: 'foreign-growth-no-or', reps: [{ old: 'growthSlot: foreignRepack.growthSlot ?? foreignLayoutResult.growthSlot,', new: 'growthSlot: foreignRepack.growthSlot,' }], reach: ['fgo'] },
  { id: 'topup-dedupe-removed', reps: [{ old: '].filter((k, i, a) => a.indexOf(k) === i);', new: '];' }], reach: ['top1'] },
  { id: 'topup-player-dist-le', reps: [{ old: 'playerCapitalPos.r) < minDystObcyOdGracza) {', new: 'playerCapitalPos.r) <= minDystObcyOdGracza) {' }], reach: ['top1'] },
  { id: 'topup-region-lt', reps: [{ old: '<= Math.max(8, Math.floor(minDystKlastrow / 2))', new: '< Math.max(8, Math.floor(minDystKlastrow / 2))', all: true }], reach: ['top1'] },
  { id: 'table-topup-min-9', reps: [{ old: 'Math.max(8, Math.floor(minDystKlastrow / 2))', new: 'Math.max(9, Math.floor(minDystKlastrow / 2))', all: true }], reach: ['top1'] },
  { id: 'table-topup-div-3', reps: [{ old: 'Math.max(8, Math.floor(minDystKlastrow / 2))', new: 'Math.max(8, Math.floor(minDystKlastrow / 3))', all: true }], reach: ['top1'] },
  { id: 'repack-final-and', reps: [{ old: 'if (playerRepackFinal.stateCities.length > 0 || playerRepackFinal.growthSlot) {', new: 'if (playerRepackFinal.stateCities.length > 0 && playerRepackFinal.growthSlot) {' }], reach: ['rfXor'] },
  { id: 'enforce-hard-removed', reps: [{ old: '  enforceHardCapitalSeparationOnKlastry(\n    klastry,', new: '  void (\n    klastry,' }], reach: null, big: true },
  { id: 'enforce-body-removed', reps: [{ old: '  enforceClusterBodySeparationOnKlastry(\n    klastry,', new: '  void (\n    klastry,' }], reach: null, big: true },
  { id: 'enforce-quarter-removed', reps: [{ old: '  enforceQuarterSpreadOnKlastry(\n    klastry,', new: '  void (\n    klastry,' }], reach: null, big: true },
];
const SMUTS = [
  { id: 'player-cap-xor-1', reps: [{ old: 'seed ^ 0xca041a01', new: 'seed ^ 0xca041a03' }] },
  { id: 'player-cap-xor-retry', reps: [{ old: 'seed ^ 0xca041a02', new: 'seed ^ 0xca041a04' }] },
  { id: 'plan-dropped-typ-not-skipped', reps: [{ old: '    if (droppedForeignTyps.has(slot.typ)) continue;\n', new: '' }] },
  { id: 'plan-capital-name-swap', reps: [{ old: 'if (slot.isClusterCapital) {\n      name = foreignCapitalCityName', new: 'if (!slot.isClusterCapital) {\n      name = foreignCapitalCityName' }] },
  { id: 'plan-hard-gate-le', reps: [{ old: 'if (!passesMinCapitalSeparationGate(\n        { q: slot.q, r: slot.r },\n        hardPlacedCapitals,', new: 'if (passesMinCapitalSeparationGate(\n        { q: slot.q, r: slot.r },\n        hardPlacedCapitals,' }] },
];
const SPROBES = [
  { old: '  if (resolvedPlayerCap) {\n    capPos = resolvedPlayerCap;\n  } else {', new: "  if (resolvedPlayerCap) {\n    globalThis.__H(resolvedPlayerCap.q === capPos.q && resolvedPlayerCap.r === capPos.r ? 'prefOk' : 'prefMoved');\n    capPos = resolvedPlayerCap;\n  } else {\n    globalThis.__H('prefNull');" },
  { old: '        droppedForeignTyps.add(slot.typ);', new: "        globalThis.__H('hardDrop');\n        droppedForeignTyps.add(slot.typ);" },
  { old: '    if (retryPlayerCap) {\n      capPos = retryPlayerCap;', new: "    globalThis.__H(retryPlayerCap ? 'retryOk' : 'retryNull');\n    if (retryPlayerCap) {\n      capPos = retryPlayerCap;" },
  { old: "      placedCapitals,\n      minCapitalSep,\n    )) {\n      if (typeof console !== 'undefined') {\n        console.warn(\n          `[cluster-spawn] Pominięto typ", new: "      placedCapitals,\n      minCapitalSep,\n    )) {\n      globalThis.__H('spawnSkipSep');\n      if (typeof console !== 'undefined') {\n        console.warn(\n          `[cluster-spawn] Pominięto typ" },
  { old: '    if (!validateForeignCapital(cap.q, cap.r)) continue;', new: "    if (!validateForeignCapital(cap.q, cap.r)) { globalThis.__H('spawnSkipLand'); continue; }" },
];

const wantMut = (id) => onlyIds.length === 0 || onlyIds.includes(id);
const cMods = [];
for (const m of CMUTS.filter((m) => wantMut(m.id))) {
  let t = baseText;
  for (const r of m.reps) t = applyRep(t, r, m.id);
  const mod = await import(url(writeModule(`clusters.m12h-${m.id}.ts`, t)));
  cMods.push({ ...m, mod });
}
// Spawn: kopie importuja ORYGINALNY clusters (z dziennikiem) - jak web.
const spawnBaseMod = await import(url(srcPath('map/cluster-spawn.ts')));
let spawnProbeText = spawnText;
for (const pr of SPROBES) spawnProbeText = applyRep(spawnProbeText, pr, 'sprobe');
const spawnProbeMod = await import(url(writeModule('cluster-spawn.m12h-probe.ts', spawnProbeText)));
const sMods = [];
for (const m of SMUTS.filter((m) => wantMut(m.id))) {
  let t = spawnText;
  for (const r of m.reps) t = applyRep(t, r, m.id);
  const mod = await import(url(writeModule(`cluster-spawn.m12h-${m.id}.ts`, t)));
  sMods.push({ ...m, mod });
}

const GH = await import(url(srcPath('map/gen-helpers.ts')));
const { mulberry32 } = GH;
const civs = JSON.parse(readFileSync(join(webRoot, 'gra/data/civs.json'), 'utf8'));
const pools = JSON.parse(readFileSync(join(webRoot, 'gra/data/city-names-pools.json'), 'utf8'));
const ROSTER = (() => {
  const m = /const ROSTER_KLUCZE: string\[\] = \[([\s\S]*?)\];/.exec(clustersText);
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
})();
const EPOCHS = ['kamien', 'braz', 'zelazo'];

// ---------------------------------------------------------------------------
// Mapy
// ---------------------------------------------------------------------------
const T2C = { morze: 'm', plytkie_morze: 'p', laka: 'l', rownina: 'r', wzgorza: 'w', gory: 'g', pustynia: 'u', polarny: 'o' };
const C2T = Object.fromEntries(Object.entries(T2C).map(([k, v]) => [v, k]));
function webMapFromRep(rep) {
  const hexes = {};
  for (let r = 0; r < rep.h; r++) {
    for (let q = 0; q < rep.w; q++) {
      const i = r * rep.w + q;
      hexes[`${q},${r}`] = { coords: { q, r }, terenBazowy: C2T[rep.terrain[i]], rzeka: { obecna: rep.river[i] === '1' } };
    }
  }
  return { szerokoscQ: rep.w, wysokoscR: rep.h, hexes };
}
const fnv1a64 = (s) => {
  let h = 0xcbf29ce484222325n;
  for (const b of Buffer.from(s, 'utf8')) {
    h ^= BigInt(b);
    h = (h * 0x100000001b3n) & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, '0');
};
function finishRep(rep) {
  const web = webMapFromRep(rep);
  rep.hexesFnv = fnv1a64(
    Object.values(web.hexes)
      .map((hx) => `${hx.coords.q},${hx.coords.r},${hx.terenBazowy}`)
      .join(';'),
  );
  return rep;
}
const NB = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
function coastShallow(terrain, w, h, r01) {
  const copy = terrain.slice();
  for (let r = 0; r < h; r++) {
    for (let q = 0; q < w; q++) {
      if (copy[r * w + q] !== 'm') continue;
      const touches = NB.some(([dq, dr]) => {
        const nq = q + dq;
        const nr = r + dr;
        return nq >= 0 && nq < w && nr >= 0 && nr < h && copy[nr * w + nq] !== 'm' && copy[nr * w + nq] !== 'p';
      });
      if (touches && r01() < 0.5) terrain[r * w + q] = 'p';
    }
  }
}
function pickTerrainFn(r01) {
  const weights = [['l', 30], ['r', 25], ['w', 15], ['g', 8], ['u', 10], ['o', 4]];
  const total = weights.reduce((s, x) => s + x[1], 0);
  return () => {
    let x = r01() * total;
    for (const [c, wt] of weights) {
      x -= wt;
      if (x < 0) return c;
    }
    return 'l';
  };
}
// Rodziny map: blob (kontynenty/archipelag/pangea/dziury), noise (pofragmentowany lad o zadanym pokryciu),
// strip (wąskie pasy), ring (pierscien/jezioro), gory (duzo gor => wąskie pule ladowe).
function huntMap(id, rng) {
  const r01 = rng;
  const family = HUNT_MODE === 'thin' ? (r01(), 'strip') : ['blob', 'blob', 'noise', 'noise', 'strip', 'ring', 'mount'][Math.floor(r01() * 7)];
  const big = (HUNT_MODE === 'big' || HUNT_MODE === 'thin') ? (r01(), true) : HUNT_MODE === 'tight' ? (r01(), false) : r01() < Number(process.env.HUNT_BIGRATE ?? 0.08);
  // HUNT_MODE=tight: male mapy (ciasne regiony Voronoi); HUNT_MODE=big: tylko mapy >= 80 (bufory brył, sep stolic).
  const w = big ? 80 + Math.floor(r01() * Number(process.env.HUNT_BIGSPAN ?? 50)) : (HUNT_MODE === 'tight' ? 10 + Math.floor(r01() * 28) : 14 + Math.floor(r01() * 52));
  const h = big ? 80 + Math.floor(r01() * 30) : (HUNT_MODE === 'tight' ? 8 + Math.floor(r01() * 24) : 12 + Math.floor(r01() * 40));
  const terrain = new Array(w * h).fill('m');
  const pt = pickTerrainFn(r01);
  if (family === 'blob') {
    const kind = ['continents', 'archipelago', 'pangea', 'holes'][Math.floor(r01() * 4)];
    const nb = kind === 'archipelago' ? 6 + Math.floor(r01() * 14) : kind === 'pangea' ? 1 + Math.floor(r01() * 2) : 2 + Math.floor(r01() * 5);
    const blobs = [];
    for (let i = 0; i < nb; i++) {
      const rad = kind === 'archipelago' ? 2 + r01() * 4 : kind === 'pangea' ? Math.min(w, h) * (0.3 + r01() * 0.2) : 3 + r01() * (Math.min(w, h) / 3);
      blobs.push({ q: r01() * w, r: r01() * h, rad });
    }
    for (let r = 0; r < h; r++) {
      for (let q = 0; q < w; q++) {
        let inside = false;
        for (const b of blobs) if (Math.hypot(q - b.q, (r - b.r) * 1.1) <= b.rad * (0.75 + 0.3 * r01())) inside = true;
        if (inside && kind === 'holes' && r01() < 0.05 + r01() * 0.2) inside = false;
        if (inside) terrain[r * w + q] = pt();
      }
    }
  } else if (family === 'noise') {
    // wartosc-szum: siatka ziaren + interpolacja, prog dobierany losowo (10-70% ladu)
    const cell = 3 + Math.floor(r01() * 6);
    const gw = Math.ceil(w / cell) + 2;
    const gh = Math.ceil(h / cell) + 2;
    const grid = Array.from({ length: gw * gh }, () => r01());
    const thr = 0.3 + r01() * 0.45;
    for (let r = 0; r < h; r++) {
      for (let q = 0; q < w; q++) {
        const fx = q / cell;
        const fy = r / cell;
        const x0 = Math.floor(fx);
        const y0 = Math.floor(fy);
        const tx = fx - x0;
        const ty = fy - y0;
        const g = (x, y) => grid[y * gw + x];
        const v = (g(x0, y0) * (1 - tx) + g(x0 + 1, y0) * tx) * (1 - ty) + (g(x0, y0 + 1) * (1 - tx) + g(x0 + 1, y0 + 1) * tx) * ty;
        if (v > thr) terrain[r * w + q] = pt();
      }
    }
  } else if (family === 'strip') {
    const nStrips = 1 + Math.floor(r01() * 4);
    for (let s = 0; s < nStrips; s++) {
      const width = 2 + Math.floor(r01() * 5);
      const horiz = r01() < 0.5;
      const pos = Math.floor(r01() * (horiz ? h : w));
      for (let r = 0; r < h; r++) {
        for (let q = 0; q < w; q++) {
          const d = horiz ? Math.abs(r - pos) : Math.abs(q - pos);
          if (d < width && r01() < 0.97) terrain[r * w + q] = pt();
        }
      }
    }
  } else if (family === 'ring') {
    const cq = w / 2;
    const cr = h / 2;
    const rad = Math.min(w, h) * (0.25 + r01() * 0.25);
    const thick = 2 + r01() * 4;
    for (let r = 0; r < h; r++) {
      for (let q = 0; q < w; q++) {
        const d = Math.hypot(q - cq, (r - cr) * 1.1);
        if (Math.abs(d - rad) < thick) terrain[r * w + q] = pt();
      }
    }
  } else {
    // mount: ciagle ladu, ale duzy odsetek gor (gory nie sa "ladowe" dla computeClusters)
    const mountShare = 0.2 + r01() * 0.5;
    const rx = 4 + Math.floor(r01() * 10);
    for (let r = 0; r < h; r++) {
      for (let q = 0; q < w; q++) {
        const inside = Math.hypot((q - w / 2) / (w / 2), (r - h / 2) / (h / 2)) < 0.85 + 0.1 * r01();
        if (!inside) continue;
        const ridge = (Math.floor(q / rx) + Math.floor(r / rx)) % 2 === 0 && r01() < mountShare * 1.6;
        terrain[r * w + q] = ridge ? 'g' : pt();
      }
    }
  }
  coastShallow(terrain, w, h, r01);
  let river = '';
  for (let i = 0; i < w * h; i++) river += terrain[i] !== 'm' && terrain[i] !== 'p' && r01() < 0.08 ? '1' : '0';
  return finishRep({ id, source: 'hunt-' + family, w, h, terrain: terrain.join(''), river });
}

// ---------------------------------------------------------------------------
// Specyfikacje wejsc
// ---------------------------------------------------------------------------
const SEEDS = [0, 1, 7, 13, 42, 99, 123, 2024, 31337, 65535, 1000003, 2147483647, 4294967295];
function randomSpec(rng, big) {
  const r = rng;
  const pick = (a) => a[Math.floor(r() * a.length)];
  const ri = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
  const spec = {};
  if (HUNT_MODE === 'thin') {
    // waskie pasy ladu na duzej mapie: MP gracza / obcych leza blisko buforow innych stolic
    spec.seed = r() < 0.5 ? pick(SEEDS) : ri(1, 1e9);
    spec.rywale = pick([6, 9, 12]);
    spec.aktywneTypy = pick([3, 4, 5, 6, 8, 10]);
    if (r() < 0.3) spec.minDystKl = pick([12, 14, 16, 20]);
    if (r() < 0.5) spec.playerTyp = pick(ROSTER);
    return spec;
  }
  if (HUNT_MODE === 'tight') {
    // ciasne układy: wiele typow, male odstepy srodkow, rozne liczby rywali
    spec.seed = r() < 0.5 ? pick(SEEDS) : ri(1, 1e9);
    spec.rywale = pick([1, 2, 3, 4, 6, 9]);
    spec.aktywneTypy = pick([6, 8, 10, 12, 15, 18, 20]);
    if (r() < 0.5) spec.playerTyp = pick(ROSTER);
    spec.minDystKl = pick([0, 1, 2, 3, 4, 5, 6]);
    if (r() < 0.3) spec.minDystans = pick([3, 4, 5, 6]);
    if (r() < 0.3) {
      spec.epoch = pick(EPOCHS);
      spec.roster = true;
    }
    return spec;
  }
  spec.seed = r() < 0.5 ? pick(SEEDS) : ri(1, 1e9);
  spec.rywale = pick([0, 1, 2, 3, 4, 6, 9, 9, 12]);
  spec.aktywneTypy = pick(big ? [3, 5, 6, 8, 10, 12, 15] : [2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 18, 20]);
  if (r() < 0.45) spec.playerTyp = pick(ROSTER);
  if (r() < 0.15) spec.minDystans = pick([3, 4, 5, 6, 8]);
  if (r() < 0.25) spec.minDystKl = pick([0, 4, 6, 8, 10, 12, 16, 20]);
  const ep = r();
  if (ep < 0.3) {
    spec.epoch = pick(EPOCHS);
    spec.roster = true;
  }
  return spec;
}
function webOpts(spec) {
  const o = {};
  if (spec.seed !== undefined) o.seed = spec.seed;
  if (spec.aktywneTypy !== undefined) o.aktywneTypy = spec.aktywneTypy;
  if (spec.playerTyp !== undefined) o.playerTyp = spec.playerTyp;
  if (spec.minDystans !== undefined) o.minDystans = spec.minDystans;
  if (spec.rywale !== undefined) o.rywaleNaKlaster = spec.rywale;
  if (spec.minDystKl !== undefined) o.minDystansKlastrow = spec.minDystKl;
  if (spec.epoch !== undefined) o.startEpochId = spec.epoch;
  if (spec.roster) o.civRoster = civs.cywilizacje;
  return o;
}
const P = (h) => [h.q, h.r];
const sigPlacement = (p) =>
  JSON.stringify({
    a: p.aktywneTypy,
    rq: p.requestedTypy,
    k: p.klastry.map((k) => [k.typIndex, k.typ, P(k.centrum), k.miasta.map((m) => [m.q, m.r, m.isCapital]), k.pendingStateSlots === undefined ? null : k.pendingStateSlots.map(P), !('growthSlot' in k) || k.growthSlot === undefined ? 'absent' : k.growthSlot === null ? 'null' : P(k.growthSlot)]),
  });
const sigPlan = (plan) =>
  JSON.stringify({
    p: P(plan.playerStartHex),
    n: plan.playerStartCityName,
    s: plan.slots.map((s) => [s.ownerId, s.q, s.r, s.nazwaMiasta, s.typ, s.isSameTypeRival, s.isPlayerCapital, s.isClusterCapital === undefined ? null : s.isClusterCapital]),
    f: plan.foreignTypeClusters.map((g) => [g.typ, g.ownerIds, g.positions.map(P)]),
    pr: plan.pendingSameTypeRivals,
    ph: plan.pendingSameTypeRivalHexes.map(P),
    cc: plan.clusterCapitalOwnerIds,
    po: plan.pendingSameTypeRivalOwnerIds,
    pl: sigPlacement(plan.placement),
  });

// ---------------------------------------------------------------------------
// Polowanie
// ---------------------------------------------------------------------------
const rng = mulberry32(huntSeed);
const found = {}; // id -> [{kind, map, spec, w, h}]
const tried = {}; // id -> liczba uruchomien mutanta
const reachedCounts = {}; // sonda -> liczba przypadkow
const addFound = (id, row) => {
  (found[id] ??= []).push(row);
};

function runOne(mod, fn, ...args) {
  try {
    return quiet(() => fn(mod, ...args));
  } catch (e) {
    return 'THREW:' + String(e && e.message ? e.message : e).slice(0, 80);
  }
}

const RARE = ['top1', 'rfXor', 'pendDiff', 'fgo', 'fill0', 'tcLast', 'tcFail', 'top2', 'alt'];
// Galezie, dla ktorych zbieramy wejscia do wektorow (pokrycie), bez wariantow.
const COVER = ['forced', 'fixedNull', 'fixedYes', 'resolveMass', 'resolveSep', 'skipNoHex', 'skipSea', 'skipSep', 'klaszFill', 'reassign', 'tcFail', 'pendDiff', 'fgo', 'hardViol'];
const hitCases = {};
// Wariacje przypadku, ktory trafil w rzadka galaz: inne ziarna / rywale / minDystansKlastrow (ta sama mapa).
function variantsOf(spec, rng) {
  const out = [];
  const seeds = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
  for (let k = 0; k < 12; k++) {
    const v = { ...spec, __variant: true };
    v.seed = seeds[k] + Math.floor(rng() * 1000);
    if (rng() < 0.6) v.rywale = [1, 2, 3, 4, 6, 9, 12][Math.floor(rng() * 7)];
    if (rng() < 0.5) v.minDystKl = [0, 4, 8, 12, 16, 20, 24][Math.floor(rng() * 7)];
    out.push(v);
  }
  return out;
}
function huntCompute(rep, spec) {
  const map = webMapFromRep(rep);
  const big = Math.min(rep.w, rep.h) >= 80;
  globalThis.__HITS = {};
  const probeRes = runOne(probeMod, (m) => sigPlacement(m.computeClusters(map, webOpts(spec))));
  const hits = globalThis.__HITS;
  for (const k of Object.keys(hits)) reachedCounts[k] = (reachedCounts[k] ?? 0) + 1;
  for (const k of COVER) {
    if (hits[k]) (hitCases[k] ??= []).length < 40 && hitCases[k].push({ map: rep.id, w: rep.w, h: rep.h, spec: stripVariant(spec) });
  }
  let rareHit = false;
  for (const k of RARE) {
    if (hits[k]) {
      rareHit = true;
      (hitCases[k] ??= []).length < 30 && hitCases[k].push({ map: rep.id, spec });
    }
  }
  if (rareHit && !spec.__variant) {
    for (const v of variantsOf(spec, rng)) huntCompute(rep, v);
  }
  const base = runOne(baseMod, (m) => sigPlacement(m.computeClusters(map, webOpts(spec))));
  if (base !== probeRes) throw new Error(`sondy zmieniaja wynik: ${rep.id} ${JSON.stringify(spec)}`);
  for (const m of cMods) {
    if (m.big && !big) continue;
    if (m.reach && !m.reach.some((p) => hits[p])) continue;
    tried[m.id] = (tried[m.id] ?? 0) + 1;
    const r = runOne(m.mod, (mm) => sigPlacement(mm.computeClusters(map, webOpts(spec))));
    if (r !== base) addFound(m.id, { kind: 'compute', map: rep.id, w: rep.w, h: rep.h, spec: stripVariant(spec) });
  }
  return hits;
}
function stripVariant(spec) {
  const { __variant, ...rest } = spec;
  return rest;
}
const limitedCache = new Map();
function limitedData(n) {
  if (!limitedCache.has(n)) {
    const c = JSON.parse(JSON.stringify(civs));
    for (const civ of c.cywilizacje) civ.nazwyMiast = civ.nazwyMiast.slice(0, n);
    const p = JSON.parse(JSON.stringify(pools));
    for (const k of Object.keys(p)) p[k].miasta_cywilizacji = p[k].miasta_cywilizacji.slice(0, n);
    limitedCache.set(n, { civs: c, pools: p });
  }
  return limitedCache.get(n);
}
function huntSpawn(rep, spec) {
  const map = webMapFromRep(rep);
  const data = spec.namesLimit !== undefined ? limitedData(spec.namesLimit) : { civs, pools };
  const input = { map, civs: data.civs, seed: spec.seed, playerTyp: spec.playerTyp ?? 'grecy', rywaleNaKlaster: spec.rywale };
  if (spec.aktywneTypy !== undefined) input.aktywneTypy = spec.aktywneTypy;
  if (spec.epoch !== undefined) input.startEpochId = spec.epoch;
  if (spec.pools) input.cityNamesPools = data.pools;
  globalThis.__HITS = {};
  const probeRes = runOne(spawnProbeMod, (m) => sigPlan(m.buildClusterSpawnPlan(input)));
  const hits = globalThis.__HITS;
  for (const k of Object.keys(hits)) reachedCounts['spawn:' + k] = (reachedCounts['spawn:' + k] ?? 0) + 1;
  for (const k of ['prefNull', 'prefMoved', 'retryOk', 'retryNull', 'hardDrop', 'spawnSkipSep', 'spawnSkipLand']) {
    if (hits[k]) (hitCases['spawn:' + k] ??= []).length < 30 && hitCases['spawn:' + k].push({ map: rep.id, w: rep.w, h: rep.h, spec, probeRes: String(probeRes).slice(0, 60) });
  }
  if (String(probeRes).startsWith('THREW')) return hits; // przypadek rzucajacy nie sluzy do zabijania mutantow
  const base = runOne(spawnBaseMod, (m) => sigPlan(m.buildClusterSpawnPlan(input)));
  if (base !== probeRes) throw new Error(`sondy spawn zmieniaja wynik: ${rep.id}`);
  for (const m of sMods) {
    tried[m.id] = (tried[m.id] ?? 0) + 1;
    const r = runOne(m.mod, (mm) => sigPlan(mm.buildClusterSpawnPlan(input)));
    if (r !== base) addFound(m.id, { kind: 'spawn', map: rep.id, w: rep.w, h: rep.h, spec });
  }
  return hits;
}

const maps = {};
const rows = [];
// 1) istniejace wektory (kontrola: mutanty TS, ktore przezyly w Rust, musza przezyc i tutaj)
const vec = JSON.parse(readFileSync(vecArg, 'utf8'));
const replay = process.env.HUNT_REPLAY === '1';
// CONFIRM_TAGGED=1: tylko przypadki R2 z polem `tag` - dla kazdego tagu wypisz, ktore SONDY (galezie weba) trafil
// (potwierdzenie, ze wektor dopisany dla galezi faktycznie ja uruchamia). Uzywac z `__none__` jako lista mutacji.
if (process.env.CONFIRM_TAGGED === '1') {
  const tagHits = {};
  const add = (tag, hits, kind) => {
    const t = (tagHits[tag] ??= { cases: 0, hits: {} });
    t.cases++;
    for (const k of Object.keys(hits)) t.hits[(kind === 'spawn' ? 'spawn:' : '') + k] = (t.hits[(kind === 'spawn' ? 'spawn:' : '') + k] ?? 0) + 1;
  };
  for (const c of vec.cases.compute) if (c.tag) add(c.tag, huntCompute(vec.maps[c.map], { ...c.spec, __variant: true }), 'compute');
  for (const c of vec.cases.spawn) if (c.tag) add(c.tag, huntSpawn(vec.maps[c.map], { ...c.spec, playerTyp: c.spec.playerTyp ?? 'grecy' }), 'spawn');
  writeFileSync(outArg, JSON.stringify(tagHits, null, 1));
  console.error('potwierdzenie tagow: ' + JSON.stringify(tagHits));
  process.exit(0);
}
if (replay) {
  for (const c of vec.cases.compute) {
    const rep = vec.maps[c.map];
    if (rep.w * rep.h > 6000) continue;
    huntCompute(rep, c.spec);
  }
  for (const c of vec.cases.spawn) {
    const rep = vec.maps[c.map];
    if (rep.w * rep.h > 6000) continue;
    huntSpawn(rep, c.spec);
  }
}
// 2) nowe mapy
let calls = 0;
for (let i = 0; i < nMaps; i++) {
  const rep = huntMap(`h${huntSeed}_${i}`, rng);
  maps[rep.id] = rep;
  const big = Math.min(rep.w, rep.h) >= 80;
  const perMap = big ? 3 : 10;
  for (let t = 0; t < perMap; t++) {
    const spec = randomSpec(rng, big);
    huntCompute(rep, spec);
    calls++;
    if (rng() < 0.4) {
      const sspec = { ...spec, playerTyp: spec.playerTyp ?? 'grecy', pools: rng() < 0.5 };
      if (rng() < 0.4) sspec.namesLimit = 0;
      huntSpawn(rep, sspec);
    }
  }
  if (i % 10 === 9) console.error(`mapa ${i + 1}/${nMaps}, wywolan ${calls}, znalezione: ${JSON.stringify(Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.length])))}`);
}
const out = {
  seed: huntSeed,
  nMaps,
  replay,
  calls,
  tried,
  reached: reachedCounts,
  hitCases,
  found: Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.slice(0, 40)])),
  foundCounts: Object.fromEntries(Object.entries(found).map(([k, v]) => [k, v.length])),
  maps: Object.fromEntries(
    Object.entries(maps).filter(([id]) => Object.values(found).some((v) => v.some((x) => x.map === id)) || Object.values(hitCases).some((v) => v.some((x) => x.map === id))),
  ),
};
writeFileSync(outArg, JSON.stringify(out));
console.error('koniec', JSON.stringify({ calls, tried, foundCounts: out.foundCounts, reached: reachedCounts }));
