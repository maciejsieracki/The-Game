'use strict';
/**
 * R-WEB-MAP-POLAR-COMPARE-Q1 (2026-11-25): pomiar PRZED/PO polarze dla typu „kontynenty”.
 *
 * Użycie:
 *   node tools/polar-before-after-measure.cjs run --gra <katalog gra/> --tree <PRZED|PO> \
 *        --out <plik.jsonl> [--sizes malenki,maly,standardowy] [--seeds 1,7,42,99,4242]
 *   node tools/polar-before-after-measure.cjs compare <PRZED.jsonl> <PO.jsonl>
 *
 * `run` bundluje generator z podanego katalogu gra/ (esbuild z ESBUILD_MODULE albo
 * z gra/node_modules), generuje mapy i zapisuje jedną linię JSON na (rozmiar × seed).
 * Metryki odpowiadają niezmiennikom 8 ciężkich testów generatora (gra/tools/*-test.cjs):
 *   land-sea-ratio        → landDev (udział lądu vs cel suwaka, tolerancja 0,04)
 *   stranded-land         → specks (ląd w otwartym oceanie), pustOcean (pustynia w oceanie)
 *   map-coast-buffer      → dryTouchSea, inlandSea, inlandWater, borderLand
 *   map-polar-continents  → polar (Polarny), polarBand (pas grywalny)
 *   map-continents-rivers → masses (liczba mas lądu), sea, riverPaths, riverLen
 *   map-gen-regression    → badOutlet, badReal (ujścia rzek), ms (czas generacji)
 *   deposit-coast         → depositsOnWater
 *   relief-grid-coverage  → ironFail/copperFail (masy ≥150 heksów, pokrycie <85%)
 *   world-density         → livestockGory, forest, desert, deposits, hills (informacyjnie)
 *
 * Nie uruchamia testów ciężkich ani gry; wyłącznie generator (bez gra/src zmian).
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      out[a.slice(2)] = argv[i + 1];
      i++;
    } else {
      out._.push(a);
    }
  }
  return out;
}

const CLI = parseArgs(process.argv.slice(2));
const SIZES = (CLI.sizes ?? 'malenki,maly,standardowy').split(',');
const SEEDS = (CLI.seeds ?? '1,7,42,99,4242').split(',').map(Number);
const TYP = 'kontynenty';
const DENSITY = { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' };
const LAND_TOL = 0.04;
const IRON_MIN = 0.85;

function loadEsbuild(gra) {
  if (process.env.ESBUILD_MODULE) return require(process.env.ESBUILD_MODULE);
  return require(path.resolve(gra, 'node_modules', 'esbuild'));
}

function bundleGenerator(gra, work) {
  const esbuild = loadEsbuild(gra);
  fs.mkdirSync(work, { recursive: true });
  const entry = path.join(work, `entry-${process.pid}.ts`);
  const bundle = path.join(work, `bundle-${process.pid}.cjs`);
  const g = (p) => JSON.stringify(path.join(gra, 'src', p));
  fs.writeFileSync(
    entry,
    `export * as G from ${g('map/generator')};
export * as H from ${g('map/gen-helpers')};
export * as T from ${g('types/hex')};`,
    'utf8',
  );
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: gra, logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'], loader: { '.ts': 'ts', '.json': 'json' },
  });
  const mod = require(bundle);
  return { G: mod.G, H: mod.H, TB: mod.T.TerenBazowy, NK: mod.T.Nakladka };
}

function countLandMasses(hexes, TB) {
  const visited = new Set();
  let masses = 0;
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  const isLand = (tb) => tb !== TB.Morze && tb !== TB.PlytkieMorze;
  for (const key of Object.keys(hexes)) {
    if (visited.has(key)) continue;
    const h = hexes[key];
    if (!h || !isLand(h.terenBazowy)) continue;
    masses++;
    const stack = [key];
    visited.add(key);
    while (stack.length) {
      const cur = stack.pop();
      const [q, r] = cur.split(',').map(Number);
      for (const [dq, dr] of DIRS) {
        const nk = `${q + dq},${r + dr}`;
        if (visited.has(nk)) continue;
        const nh = hexes[nk];
        if (!nh || !isLand(nh.terenBazowy)) continue;
        visited.add(nk);
        stack.push(nk);
      }
    }
  }
  return masses;
}

function countBadRiverPaths(map, H) {
  const W = map.szerokoscQ;
  const Hh = map.wysokoscR;
  let badOutlet = 0;
  let badReal = 0;
  let totalMain = 0;
  let len = 0;
  for (let i = 0; i < map.riverPaths.length; i++) {
    const p = map.riverPaths[i];
    len += p?.length ?? 0;
    const subPaths = map.riverPaths.slice(0, i);
    const subKinds = map.riverPathKinds?.slice(0, i) ?? [];
    if (!p?.length) {
      badOutlet++;
      continue;
    }
    if (!H.pathHasValidRiverOutlet(map.hexes, p, subPaths, subKinds, W, Hh)) badOutlet++;
    if (map.riverPathKinds?.[i] === 'main') {
      totalMain++;
      if (!H.pathReachesRealSea(map.hexes, p, W, Hh)) badReal++;
    }
  }
  return { badOutlet, badReal, riverLen: len };
}

function countPustyniaInOcean(hexes, TB) {
  let n = 0;
  for (const hex of Object.values(hexes)) {
    if (hex.terenBazowy !== TB.Pustynia) continue;
    const { q, r } = hex.coords;
    let dry = 0;
    for (const [dq, dr] of [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]]) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (nh && nh.terenBazowy !== TB.Morze && nh.terenBazowy !== TB.PlytkieMorze) dry++;
    }
    if (dry === 0) n++;
  }
  return n;
}

function polarBandHexCount(map, H, TB) {
  const h = map.wysokoscR;
  const buf = H.latitudinalOceanBufferRows(h, false);
  let n = 0;
  for (const hex of Object.values(map.hexes)) {
    const r = hex.coords.r;
    if (r < buf || r >= h - buf) continue;
    const band = H.climateBandAt(hex.coords.q, hex.coords.r, h, false);
    if (band === 'polar_north' || band === 'polar_south') n++;
  }
  return n;
}

function livestockOnGory(hexes, TB, NK) {
  let n = 0;
  for (const h of Object.values(hexes)) {
    if (h.terenBazowy !== TB.Gory) continue;
    if (h.nakladka === NK.ZlozeBydla || h.nakladka === NK.ZlozeOwiec) n++;
    if (h.zloze === 'bydlo' || h.zloze === 'owce') n++;
  }
  return n;
}

function measureOne(M, size, seed) {
  const { G, H, TB, NK } = M;
  const target = H.defaultLandFractionForTyp(TYP);
  const t0 = Date.now();
  const opts = CLI.density === 'none' ? {} : { worldDensity: DENSITY };
  if (CLI.lf !== 'none') opts.landFraction = target;
  const map = G.generujSwiat(seed, size, TYP, opts);
  const ms = Date.now() - t0;
  const hexes = map.hexes;
  const W = map.szerokoscQ;
  const Hh = map.wysokoscR;

  const { land, total } = H.countLandSeaHexes(hexes);
  const landPct = land / total;

  const polar = Object.values(hexes).filter((x) => x.terenBazowy === TB.Polarny).length;
  const bad = countBadRiverPaths(map, H);

  const ironSize = H.ironCoverageCellSize('medium');
  const copperSize = H.copperCoverageCellSize('medium');
  const bigMasses = H.groupLandMassKeys(hexes).filter((m) => m.length >= 150);
  let ironFail = 0;
  let copperFail = 0;
  let ironMin = null;
  let copperMin = null;
  for (const mass of bigMasses) {
    const ir = H.ironGridCoverageRatio(mass, hexes, ironSize);
    const cr = H.copperGridCoverageRatio(mass, hexes, copperSize);
    if (ir < IRON_MIN) ironFail++;
    if (cr < IRON_MIN) copperFail++;
    ironMin = ironMin === null ? ir : Math.min(ironMin, ir);
    copperMin = copperMin === null ? cr : Math.min(copperMin, cr);
  }

  let forest = 0;
  let desert = 0;
  let hills = 0;
  for (const h of Object.values(hexes)) {
    if (h.nakladka === NK.Las) forest++;
    if (h.terenBazowy === TB.Pustynia) desert++;
    if (h.terenBazowy === TB.Gory || h.terenBazowy === TB.Wzgorza) hills++;
  }

  return {
    size,
    seed,
    typ: TYP,
    w: W,
    h: Hh,
    ms,
    landTarget: +target.toFixed(4),
    landPct: +landPct.toFixed(5),
    landDev: +Math.abs(landPct - target).toFixed(5),
    specks: H.countOpenOceanLandSpecks(hexes),
    pustOcean: countPustyniaInOcean(hexes, TB),
    dryTouchSea: H.findDryLandTouchingSea(hexes).length,
    inlandSea: H.findInlandSeaHexes(hexes, W, Hh).length,
    inlandWater: H.findInlandWaterHexes(hexes, W, Hh).length,
    borderLand: H.findLandInMapBorder(hexes, W, Hh).length,
    polar,
    polarBand: polarBandHexCount(map, H, TB),
    masses: countLandMasses(hexes, TB),
    sea: Object.values(hexes).filter((x) => x.terenBazowy === TB.Morze).length,
    riverPaths: map.riverPaths?.length ?? 0,
    riverHexes: Object.values(hexes).filter((x) => x.rzeka?.obecna).length,
    riverLen: bad.riverLen,
    badOutlet: bad.badOutlet,
    badReal: bad.badReal,
    depositsOnWater: H.countDepositsOnWater(hexes),
    bigMasses: bigMasses.length,
    ironFail,
    copperFail,
    ironMin: ironMin === null ? null : +ironMin.toFixed(4),
    copperMin: copperMin === null ? null : +copperMin.toFixed(4),
    livestockGory: livestockOnGory(hexes, TB, NK),
    forest,
    desert,
    hills,
  };
}

function runMeasure() {
  const gra = path.resolve(CLI.gra);
  const tree = CLI.tree ?? 'NIEOZNACZONE';
  const outFile = path.resolve(CLI.out);
  const work = path.join(path.dirname(outFile), `.work-${tree}`);
  const M = bundleGenerator(gra, work);
  if (typeof M.H.defaultLandFractionForTyp !== 'function') throw new Error('brak defaultLandFractionForTyp');
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  const lines = [];
  for (const size of SIZES) {
    for (const seed of SEEDS) {
      const row = { tree, ...measureOne(M, size, seed) };
      lines.push(JSON.stringify(row));
      fs.appendFileSync(outFile, `${JSON.stringify(row)}\n`, 'utf8');
      console.log(`${tree} ${size} seed=${seed} ms=${row.ms} land=${row.landPct} dev=${row.landDev} polar=${row.polar} specks=${row.specks} badOutlet=${row.badOutlet} depWater=${row.depositsOnWater} ironFail=${row.ironFail}/${row.bigMasses}`);
    }
  }
  fs.rmSync(work, { recursive: true, force: true });
  console.log(`zapisano ${lines.length} wierszy -> ${outFile}`);
}

const METRICS = [
  // [klucz, opis, kierunek: 'lower' (mniej=lepiej, zero dopuszczalne) | 'bound' | 'higher' | 'info']
  ['landDev', 'udział lądu – cel suwaka (|dev|, tolerancja 0,04)', 'bound'],
  ['specks', 'ląd w otwartym oceanie (stranded)', 'lower'],
  ['pustOcean', 'pustynia bez lądu (w oceanie)', 'lower'],
  ['dryTouchSea', 'suchy ląd stykający morze (bufor wybrzeża)', 'lower'],
  ['inlandSea', 'morze w środku lądu', 'lower'],
  ['inlandWater', 'woda w środku lądu', 'lower'],
  ['borderLand', 'ląd w buforze brzegu mapy', 'lower'],
  ['polar', 'heksy Polarny (pas polarny)', 'bound'],
  ['polarBand', 'heksy w pasie polarnym (sufit grywalny)', 'info'],
  ['masses', 'liczba mas lądu', 'info'],
  ['sea', 'heksy morza', 'info'],
  ['riverPaths', 'liczba tras rzek', 'info'],
  ['riverLen', 'łączna długość tras rzek (heksy)', 'info'],
  ['riverHexes', 'heksy z rzeką', 'info'],
  ['badOutlet', 'trasy rzek bez ujścia', 'lower'],
  ['badReal', 'główne rzeki bez realnego morza', 'lower'],
  ['depositsOnWater', 'złoża na morzu/wybrzeżu', 'lower'],
  ['ironFail', 'masy ≥150 z pokryciem żelaza <85%', 'lower'],
  ['copperFail', 'masy ≥150 z pokryciem miedzi <85%', 'lower'],
  ['livestockGory', 'bydło/owce na Górach', 'lower'],
  ['forest', 'heksy lasu (info)', 'info'],
  ['desert', 'heksy pustyni (info)', 'info'],
  ['hills', 'heksy Gór+Wzgórz (info)', 'info'],
  ['ms', 'czas generacji ms (info)', 'info'],
];

function loadRows(file) {
  return fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

function runCompare() {
  const [fa, fb] = CLI._.slice(1);
  const A = loadRows(path.resolve(fa));
  const B = loadRows(path.resolve(fb));
  const key = (r) => `${r.size}|${r.seed}`;
  const mapA = new Map(A.map((r) => [key(r), r]));
  const mapB = new Map(B.map((r) => [key(r), r]));
  const keys = [...mapA.keys()].filter((k) => mapB.has(k));
  const lines = [];
  lines.push('| rozmiar | seed | ' + METRICS.map((m) => `${m[0]} PRZED/PO`).join(' | ') + ' |');
  lines.push('|' + '---|'.repeat(METRICS.length + 2));
  for (const k of keys) {
    const a = mapA.get(k);
    const b = mapB.get(k);
    lines.push(`| ${a.size} | ${a.seed} | ` + METRICS.map(([m]) => `${a[m]}/${b[m]}`).join(' | ') + ' |');
  }
  lines.push('');
  lines.push('Zbiorczo per metryka (suma, różnica średnia PO−PRZED, maks. pogorszenie = max(PO−PRZED) dla kierunku lower/bound, liczba przypadków z pogorszeniem, werdykt):');
  for (const [m, desc, dir] of METRICS) {
    const deltas = keys.map((k) => ({ k, d: mapB.get(k)[m] - mapA.get(k)[m], a: mapA.get(k)[m], b: mapB.get(k)[m] }));
    const sumA = deltas.reduce((s, x) => s + (x.a ?? 0), 0);
    const sumB = deltas.reduce((s, x) => s + (x.b ?? 0), 0);
    const avg = deltas.reduce((s, x) => s + (x.d ?? 0), 0) / Math.max(1, deltas.length);
    const worse = deltas.filter((x) => x.d > 0);
    const maxWorse = Math.max(0, ...deltas.map((x) => x.d ?? 0));
    let verdict;
    if (dir === 'info') verdict = 'INFO (bez asercji)';
    else if (dir === 'lower') verdict = worse.length ? `REGRESJA (seedy: ${worse.map((x) => x.k.replace('|', '/')).join(', ')})` : 'BEZ REGRESJI';
    else if (dir === 'bound' && m === 'landDev') {
      const bad = deltas.filter((x) => x.d > 0 && mapB.get(x.k)[m] > LAND_TOL);
      verdict = bad.length ? `REGRESJA (seedy: ${bad.map((x) => x.k.replace('|', '/')).join(', ')})` : 'BEZ REGRESJI (PO ≤ tolerancja lub ≤ PRZED)';
    } else if (m === 'polar') {
      const zero = keys.filter((k) => mapB.get(k)[m] === 0 && mapA.get(k)[m] > 0);
      const over = keys.filter((k) => mapB.get(k)[m] > 600);
      verdict = zero.length || over.length ? `REGRESJA (zero: ${zero.length}, >sufit 600: ${over.length})` : 'BEZ REGRESJI (>0 i ≤ sufit 600 we wszystkich)';
    } else verdict = 'INFO';
    lines.push(`- ${m} (${desc}): PRZED=${sumA} PO=${sumB} średnia Δ=${avg.toFixed(3)} maxPogorszenie=${maxWorse} przypadki_pogorszenia=${worse.length}/${keys.length} → ${verdict}`);
  }
  console.log(lines.join('\n'));
}

if (CLI._[0] === 'run') runMeasure();
else if (CLI._[0] === 'compare') runCompare();
else {
  console.error('użycie: run --gra <gra> --tree <nazwa> --out <plik.jsonl> | compare <PRZED.jsonl> <PO.jsonl>');
  process.exit(2);
}
