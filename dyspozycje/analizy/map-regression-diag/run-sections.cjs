'use strict';
// MAPREGDIAG: wznawialny runner sekcji map-gen-regression-test.cjs (bez sekcji bench czasu).
// Użycie: node run-sections.cjs --gra <ścieżka gra/> --label <cand|base> --out <plik> [--sections A,B,C,D,E]
// Każdy przypadek = jedna linia "KLUCZ<TAB>JSON" dopisana do --out po zakończeniu.
// Ponowne wywołanie pomija przypadki już zapisane (wznowienie). Brak zmian w gra/.
const fs = require('fs');
const path = require('path');

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : def;
}
const GRA = path.resolve(arg('gra'));
const LABEL = arg('label');
const OUT = path.resolve(arg('out'));
const SECTIONS = arg('sections', 'A,B,C,D,E').split(',');
const DIAG_DIR = __dirname;
const ENTRY = path.join(DIAG_DIR, `.entry-${LABEL}.ts`);
const BUNDLE = path.join(DIAG_DIR, `.bundle-${LABEL}.cjs`);

const esbuild = require(path.join(GRA, 'node_modules', 'esbuild'));
fs.writeFileSync(
  ENTRY,
  `export { generujSwiat } from '${GRA}/src/map/generator';
export { pathEndsAtSea, pathReachesRealSea, pathHasValidRiverOutlet, verifyRiverNetworkConnectivity, checkTributaryJunctions, groupLandMassKeys } from '${GRA}/src/map/gen-helpers';
export { expectedStartCityCount, targetVillageHutCount } from '${GRA}/src/map/villages';
export { defaultCivTypesFromMapLabel, defaultMiastaPanstwaFromMapLabel } from '${GRA}/src/map/newGameMapDefaults';
export { TerenBazowy } from '${GRA}/src/types/hex';
export { isWaterTerrain } from '${GRA}/src/units/setup';`,
  'utf8',
);
esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  absWorkingDir: GRA,
  loader: { '.ts': 'ts', '.json': 'json' },
  logLevel: 'silent',
});
const M = require(BUNDLE);

const SEEDS = [42, 123, 777, 7, 2026];
const TYPES = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const DENSITY_RIVERS_HIGH = { ...DENSITY, rivers: 'high' };
const DENSITIES = [['medium', DENSITY], ['high', DENSITY_RIVERS_HIGH]];

function hexHash(hexes) {
  const keys = Object.keys(hexes).sort();
  let h = 0;
  for (const k of keys) {
    const hex = hexes[k];
    const s = `${k}:${hex.terenBazowy}:${hex.nakladka ?? ''}`;
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(16);
}

function short(v) {
  const s = JSON.stringify(v);
  return s && s.length > 120 ? s.slice(0, 117) + '...' : s;
}

// Sekcja A: rzeki bez ujścia (mała mapa). Każdy zły szlak z rodzajem i końcami.
function caseA(density, seed, typ) {
  const map = M.generujSwiat(seed, 'maly', typ, { worldDensity: density });
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  const bad = [];
  let totalMain = 0;
  let badReal = 0;
  let badOutlet = 0;
  const paths = map.riverPaths ?? [];
  for (let i = 0; i < paths.length; i++) {
    const p = paths[i];
    const kind = map.riverPathKinds?.[i] ?? '?';
    if (!p?.length) {
      badOutlet++;
      bad.push({ idx: i, kind, rodzaj: 'pusta-trasa' });
      continue;
    }
    const outletOk = M.pathHasValidRiverOutlet(map.hexes, p, paths.slice(0, i), (map.riverPathKinds ?? []).slice(0, i), W, H);
    if (!outletOk) {
      badOutlet++;
      bad.push({ idx: i, kind, rodzaj: 'bez-ujscia', len: p.length, start: short(p[0]), end: short(p[p.length - 1]) });
    }
    if (kind === 'main') {
      totalMain++;
      if (!M.pathReachesRealSea(map.hexes, p, W, H)) {
        badReal++;
        bad.push({ idx: i, kind, rodzaj: 'main-bez-realnego-morza', len: p.length, start: short(p[0]), end: short(p[p.length - 1]) });
      }
    }
  }
  return { mapa: 'maly', W, H, totalPaths: paths.length, totalMain, badOutlet, badReal, bad };
}

// Sekcja B: sieć rzek + dopływy (standardowy).
function caseB(density, seed, typ) {
  const map = M.generujSwiat(seed, 'standardowy', typ, { worldDensity: density });
  const W = map.szerokoscQ;
  const H = map.wysokoscR;
  const paths = map.riverPaths ?? [];
  const kinds = map.riverPathKinds ?? [];
  const net = M.verifyRiverNetworkConnectivity(map.hexes, paths, kinds, W, H);
  const j = M.checkTributaryJunctions(paths, kinds, map.hexes, W, H);
  return {
    mapa: 'standardowy',
    orphanCount: net.orphanCount,
    tribViolations: j.violations,
    tribOk: j.ok,
    firstFail: j.firstFail ?? null,
    netSample: short(net).slice(0, 200),
  };
}

// Sekcja C: pangea nieregularna (standardowy, DENSITY medium) — ta sama metryka co test.
const PANGEA_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
function pangeaShapeMetrics(map) {
  const hexes = map.hexes;
  const masses = M.groupLandMassKeys(hexes);
  const landKeys = masses.flat();
  const landCount = landKeys.length;
  if (landCount === 0) return { massCount: 0, dominantRatio: 0, bboxFill: 0, coastRatio: 0 };
  let qMin = Infinity, qMax = -Infinity, rMin = Infinity, rMax = -Infinity;
  let coast = 0;
  for (const k of landKeys) {
    const [q, r] = k.split(',').map(Number);
    qMin = Math.min(qMin, q); qMax = Math.max(qMax, q);
    rMin = Math.min(rMin, r); rMax = Math.max(rMax, r);
    for (const [dq, dr] of PANGEA_DIRS) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (!nh || M.isWaterTerrain(nh.terenBazowy)) { coast++; break; }
    }
  }
  const bboxArea = (qMax - qMin + 1) * (rMax - rMin + 1);
  const massSizes = masses.map((m) => m.length).sort((a, b) => b - a);
  return {
    massCount: masses.length,
    dominantRatio: massSizes[0] / landCount,
    bboxFill: landCount / bboxArea,
    coastRatio: coast / Math.sqrt(landCount),
  };
}
function caseC(seed) {
  const pmap = M.generujSwiat(seed, 'standardowy', 'pangea', { worldDensity: DENSITY });
  const pm = pangeaShapeMetrics(pmap);
  const ok = pm.massCount === 1 && pm.dominantRatio >= 0.97 && pm.bboxFill < 0.87 && pm.coastRatio > 3.72;
  return { ...pm, ok };
}

// Sekcja D: chat ze skarbami (seed 42, standardowy, kontynenty) — liczba chatek.
function countVillages(map) {
  let n = 0;
  for (const hex of Object.values(map.hexes)) if (hex.wioska?.istnieje) n++;
  return n;
}
function caseD() {
  const stdLabel = 'Standardowy';
  const stdTypes = M.defaultCivTypesFromMapLabel(stdLabel);
  const stdStates = M.defaultMiastaPanstwaFromMapLabel(stdLabel);
  const stdCities = M.expectedStartCityCount(stdTypes, stdStates);
  const target = M.targetVillageHutCount(stdCities, 'normal');
  const map = M.generujSwiat(42, 'standardowy', 'kontynenty', {
    worldDensity: DENSITY, mapSizeMenuLabel: stdLabel, difficulty: 'normal',
    civTypesCount: stdTypes, cityStatesCount: stdStates,
  });
  return { stdCities, stdTypes, stdStates, target, placed: countVillages(map) };
}

// Sekcja E: determinizm (seed 42, standardowy, kontynenty) — hash dwóch przebiegów.
function caseE() {
  const a = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
  const b = M.generujSwiat(42, 'standardowy', 'kontynenty', { worldDensity: DENSITY });
  return { hashA: hexHash(a.hexes), hashB: hexHash(b.hexes) };
}

const done = new Set();
if (fs.existsSync(OUT)) {
  for (const line of fs.readFileSync(OUT, 'utf8').split('\n')) {
    if (line.includes('\t')) done.add(line.split('\t')[0]);
  }
}
const ONLY = arg('only', null); // opcjonalny filtr wyrażeniem regularnym na klucz przypadku
function record(key, fn) {
  if (done.has(key)) return;
  if (ONLY && !new RegExp(ONLY).test(key)) return;
  const t0 = Date.now();
  let res;
  try {
    res = fn();
  } catch (e) {
    res = { error: String(e && e.message || e) };
  }
  res.ms = Date.now() - t0;
  fs.appendFileSync(OUT, `${key}\t${JSON.stringify(res)}\n`, 'utf8');
  done.add(key);
  console.log(`${key} ${res.ms}ms ${res.error ? 'ERR ' + res.error : ''}`);
}

for (const sec of SECTIONS) {
  if (sec === 'A') {
    for (const [dl, d] of DENSITIES) for (const seed of SEEDS) for (const typ of TYPES) {
      record(`A|rivers=${dl}|seed=${seed}|typ=${typ}`, () => caseA(d, seed, typ));
    }
  } else if (sec === 'B') {
    for (const [dl, d] of DENSITIES) for (const seed of SEEDS) for (const typ of TYPES) {
      record(`B|rivers=${dl}|seed=${seed}|typ=${typ}`, () => caseB(d, seed, typ));
    }
  } else if (sec === 'C') {
    for (const seed of SEEDS) record(`C|seed=${seed}`, () => caseC(seed));
  } else if (sec === 'D') {
    record('D|chat', () => caseD());
  } else if (sec === 'E') {
    record('E|determinizm', () => caseE());
  }
}
console.log(`DONE sections=${SECTIONS.join(',')} lines=${done.size}`);
