// R-RUSTPORT-P4-1-R3-RIVER-RIBBONS — generator of river-ribbon reference vectors.
//
// Run ONLY outside the repository (scratch dir), see README.md. The esbuild bundle links:
//  - three@0.169.0 (npm, version of gra/package.json at the pin 07d2fbd72),
//  - web modules from `git archive 07d2fbd72 gra/src gra/data`, imported unchanged; scene.ts
//    gets ONE appended `export { … }` line (build.mjs) exposing private functions, no body touched.
// The generator only calls the web API (no WebGLRenderer) and dumps geometries / return values.
// Output: rivers.json in the directory given as argv[2].
//
// What is NOT web code here (harness, cited): the material-free bucket orchestration of the
// coastal mouths (scene.ts:2918-2992) and the riverMouthY formula (scene.ts:2886-2888) are
// re-stated, because buildScene is not callable headless. Everything that produces a point,
// a vertex or an index is the pin function itself.

import * as THREE from 'three';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { TerenBazowy } from '../websrc/gra/src/types/hex';
import * as Sc from '../websrc/gra/src/render/scene';
import * as Ms from '../websrc/gra/src/render/mapRenderStyle';
import * as Gh from '../websrc/gra/src/map/gen-helpers';
import { generateMap } from '../websrc/gra/src/map/generator';

const S: any = Sc;
// scene.ts yields frames through requestAnimationFrame (C3 chunked build) — not in node.
(globalThis as any).requestAnimationFrame = (cb: (t: number) => void) => setTimeout(() => cb(0), 0);

const OUT = process.argv[2];
if (!OUT) throw new Error('usage: node rivers_gen.mjs <outdir>');
fs.mkdirSync(OUT, { recursive: true });

// Serializer: like JSON.stringify, but keeps the sign of -0.
function ser(v: any): string {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'number') {
    if (Number.isNaN(v)) return '"NaN"';
    if (v === Infinity) return '"Infinity"';
    if (v === -Infinity) return '"-Infinity"';
    return Object.is(v, -0) ? '-0' : String(v);
  }
  if (typeof v === 'string' || typeof v === 'boolean') return JSON.stringify(v);
  if (Array.isArray(v)) return '[' + v.map(ser).join(',') + ']';
  const keys = Object.keys(v);
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + ser(v[k])).join(',') + '}';
}

const f32bits = (arr: ArrayLike<number>): number[] => {
  const f = new Float32Array(arr as any);
  return Array.from(new Uint32Array(f.buffer));
};

function dumpGeo(g: THREE.BufferGeometry): any {
  const pos = g.getAttribute('position');
  const nor = g.getAttribute('normal');
  const uv = g.getAttribute('uv');
  const idx = g.getIndex();
  return {
    vertexCount: pos ? pos.count : 0,
    position: pos ? f32bits(pos.array as any) : [],
    normal: nor ? f32bits(nor.array as any) : null,
    uv: uv ? f32bits(uv.array as any) : null,
    index: idx ? Array.from(idx.array as any) : null,
  };
}

// ---------------------------------------------------------------------------
// Maps

type Coord = { q: number; r: number };
const key = (q: number, r: number) => `${q},${r}`;

function makeHex(q: number, r: number, t: TerenBazowy): any {
  return {
    coords: { q, r },
    terenBazowy: t,
    nakladka: 'brak',
    ulepszenie: 'brak',
    wlasciciel: null,
    wioska: { obecna: false, ludnosc: 0 },
    widocznosc: {},
    rzeka: { obecna: false, krawedzie: [] as number[] },
  };
}

/** Hand-made map A (12×8, axial rectangle): land r ≤ 4, Wybrzeże r = 5, Morze r ≥ 6,
 *  a hill/mountain patch and a desert hex, six rivers of every kind. */
function mapA(): any {
  const W = 12, H = 8;
  const hexes: Record<string, any> = {};
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      let t = TerenBazowy.Laka;
      if (r >= 6) t = TerenBazowy.Morze;
      else if (r === 5) t = TerenBazowy.PlytkieMorze;
      else if (q === 4 && r <= 1) t = TerenBazowy.Gory;
      else if (q === 5 && r <= 2) t = TerenBazowy.Wzgorza;
      else if (q === 8 && r === 3) t = TerenBazowy.Pustynia;
      else if (q === 0 && r === 4) t = TerenBazowy.Rownina;
      hexes[key(q, r)] = makeHex(q, r, t);
    }
  }
  const riverPaths: Coord[][] = [
    // main, straight to the sea through Wybrzeże (2,5) into Morze (2,6)
    [{ q: 2, r: 0 }, { q: 2, r: 1 }, { q: 2, r: 2 }, { q: 2, r: 3 }, { q: 2, r: 4 }, { q: 2, r: 5 }, { q: 2, r: 6 }],
    // main, meandering, through hills, ends on Wybrzeże
    [{ q: 6, r: 0 }, { q: 7, r: 0 }, { q: 7, r: 1 }, { q: 6, r: 2 }, { q: 6, r: 3 }, { q: 7, r: 3 }, { q: 7, r: 4 }, { q: 7, r: 5 }],
    // main ending on land next to Wybrzeże (no water hex in the path)
    [{ q: 10, r: 0 }, { q: 10, r: 1 }, { q: 10, r: 2 }, { q: 10, r: 3 }, { q: 10, r: 4 }],
    // medium joining river 0
    [{ q: 0, r: 0 }, { q: 0, r: 1 }, { q: 1, r: 1 }, { q: 1, r: 2 }, { q: 2, r: 2 }, { q: 2, r: 3 }],
    // short
    [{ q: 9, r: 0 }, { q: 9, r: 1 }, { q: 9, r: 2 }, { q: 10, r: 2 }],
    // tributary
    [{ q: 4, r: 3 }, { q: 4, r: 4 }, { q: 3, r: 4 }],
    // main ending inland (no sea)
    [{ q: 11, r: 0 }, { q: 11, r: 1 }, { q: 11, r: 2 }],
    // kind missing (riverPathKinds shorter) → 'main'
    [{ q: 0, r: 2 }, { q: 0, r: 3 }, { q: 0, r: 4 }, { q: 0, r: 5 }],
  ];
  const riverPathKinds = ['main', 'main', 'main', 'medium', 'short', 'tributary', 'main'];
  const edgeSets = [[0, 3], [1], [2, 5], [4], [0, 1, 2]];
  let n = 0;
  for (const p of riverPaths) {
    for (const c of p) {
      const h = hexes[key(c.q, c.r)];
      h.rzeka.obecna = true;
      h.rzeka.krawedzie = edgeSets[n++ % edgeSets.length]!.slice();
    }
  }
  return { szerokoscQ: W, wysokoscR: H, seed: 7, hexes, riverPaths, riverPathKinds };
}

function mapGenerated(W: number, H: number, seed: number, rivers: string): any {
  const m: any = generateMap(W, H, seed, 'kontynenty', {
    mapSizeMenuLabel: 'Standardowy',
    worldDensity: { rivers, forest: 'medium', desert: 'medium', relief: 'medium' },
  } as any);
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      if (!m.hexes[key(q, r)]) throw new Error(`generated map is not an axial rectangle at ${q},${r}`);
    }
  }
  if (Object.keys(m.hexes).length !== W * H) throw new Error('generated map: extra hexes');
  return m;
}

/** DTO view of the map (MapViewDto shape, camelCase, r-major hexes). */
function toDto(map: any): any {
  const W = map.szerokoscQ, H = map.wysokoscR;
  const hexes: any[] = [];
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const h = map.hexes[key(q, r)];
      hexes.push({ coord: { q, r }, terenBazowy: h.terenBazowy, rzekaKrawedzie: (h.rzeka?.krawedzie ?? []).slice() });
    }
  }
  const paths: Coord[][] = map.riverPaths ?? [];
  const kinds: any[] = map.riverPathKinds ?? [];
  const rivers = paths.map((p, i) => ({ hexes: p.map((c) => ({ q: c.q, r: c.r })), kind: kinds[i] ?? null }));
  // scene.ts:1306-1318 (the engine producer `river_render_paths` does the same, map_view.rs).
  const kindOf = (i: number) => kinds[i] ?? 'main';
  const mainPaths = paths.filter((_, i) => kindOf(i) === 'main');
  const riverRenderPaths = paths.map((p, i) => {
    const forRender = kindOf(i) === 'medium' ? Gh.trimMediumRenderPathAtMain(p as any, mainPaths as any) : p;
    const land = kindOf(i) === 'medium'
      ? Gh.mediumRiverRenderPath(map.hexes, forRender)
      : Gh.landRiverRenderPath(map.hexes, forRender);
    return land.map((c: Coord) => ({ q: c.q, r: c.r }));
  });
  return { width: W, height: H, seed: map.seed, hexes, rivers, riverRenderPaths };
}

// ---------------------------------------------------------------------------
// Scenarios

const RIVER_BATCH_PATHS_DENSE = 128; // scene.ts:1472

function dumpEntry(e: any, waterMat: THREE.Material): any {
  return {
    mat: e.waterMesh.material === waterMat ? 'water' : 'delta',
    renderOrder: e.waterMesh.renderOrder,
    merged: e.merged,
    hexKeys: [...e.hexKeys],
    pointHex: e.pointHex ?? null,
    segPointHex: e.segPointHex ?? null,
    geo: dumpGeo(e.waterGeo),
  };
}

async function scenario(
  name: string, map: any, stage: number, fast: boolean, sceneFast: boolean, R: number, landOpts?: any,
): Promise<any> {
  const water = new THREE.MeshLambertMaterial({ color: 0xffffff });
  const delta = new THREE.MeshLambertMaterial({ color: 0x000000 });
  const scene = new THREE.Scene();
  const entries: any[] = [];

  // scene.ts:2864-2877 (stage filter; buildScene reads the stage from the URL/localStorage).
  const pathsAll: Coord[][] = map.riverPaths ?? [];
  const kindsAll: any[] = map.riverPathKinds ?? pathsAll.map(() => 'main');
  let landKeys: string[] = [];
  if (stage > 0) {
    const { paths, pathKinds } = stage >= 5
      ? { paths: pathsAll, pathKinds: kindsAll }
      : S.__filterRiverPathsForStage(pathsAll, kindsAll, stage);
    // scene.ts:2886-2892 (harness re-statement of buildScene locals; values from the pin functions).
    const capTopY = Ms.coastWaterCapTopY('roblox');
    const coastPrismTopY = Ms.terrainSurfaceTopY(TerenBazowy.PlytkieMorze, 'roblox');
    const riverMouthY = Math.max(capTopY + R * 0.026, coastPrismTopY + R * 0.035);
    const MAIN_HW = R * 0.052;
    const SURF = Ms.riverSurfaceLiftY(R);
    const deltaHexKeys: Set<string> = Ms.computeRiverDeltaHexKeys(map);
    const land: Set<string> = await Sc.renderLandRiversFromPaths(
      map, paths, pathKinds, R, 'roblox', riverMouthY, SURF, MAIN_HW, scene, entries, water, 55,
      undefined,
      landOpts ?? (fast ? {
        batchAllPaths: true,
        batchSize: RIVER_BATCH_PATHS_DENSE,
        ribbonSegments: sceneFast ? 3 : 4,
        tributaryDecimateDist: R * (sceneFast ? 0.10 : 0.065),
        yieldEvery: sceneFast ? 2 : 3,
      } : undefined),
    );
    landKeys = [...land];
    // scene.ts:2918-2992 — coastal mouths (harness re-statement of the bucket orchestration).
    const segs = fast ? (sceneFast ? 3 : 4) : 12;
    const dedup = fast ? R * (sceneFast ? 0.045 : 0.032) : R * 0.02;
    const mk = (mat: THREE.Material, ro: number) => ({ mat, geos: [] as any[], hexKeys: new Set<string>(), renderOrder: ro });
    const agg = fast ? { d: mk(delta, 50), w: mk(water, 58), t: mk(delta, 58) } : null;
    for (let pi = 0; pi < paths.length; pi++) {
      const p = paths[pi]!;
      if (p.length < 2) continue;
      if ((pathKinds[pi] ?? 'main') !== 'main') continue;
      if (!S.__pathReachesOpenSeaRender(map, p)) continue;
      if (agg) {
        S.__renderCoastalRiverExtension(map, p, R, riverMouthY, agg.w, agg.t, agg.d, MAIN_HW, deltaHexKeys, segs, dedup);
      } else {
        const w = mk(water, 58), t = mk(delta, 58), d = mk(delta, 50);
        S.__renderCoastalRiverExtension(map, p, R, riverMouthY, w, t, d, MAIN_HW, deltaHexKeys, segs, dedup);
        S.__flushRiverBucket(scene, d, entries);
        S.__flushRiverBucket(scene, w, entries);
        S.__flushRiverBucket(scene, t, entries);
      }
    }
    if (agg) {
      S.__flushRiverBucket(scene, agg.d, entries);
      S.__flushRiverBucket(scene, agg.w, entries);
      S.__flushRiverBucket(scene, agg.t, entries);
    }
    return {
      name, stage, fast, sceneFast, R, landOpts: landOpts ?? null, riverMouthY, deltaHexKeys: [...deltaHexKeys],
      landHexKeys: landKeys, map: toDto(map), entries: entries.map((e) => dumpEntry(e, water)),
    };
  }
  return { name, stage, fast, sceneFast, R, landOpts: landOpts ?? null, riverMouthY: null, deltaHexKeys: [], landHexKeys: [], map: toDto(map), entries: [] };
}

/** buildRiverPointsFromHexPath on raw hex paths (simplify: 180° turns, ≥120° bends). */
function pointCases(map: any): any[] {
  const R = 1;
  const capTopY = Ms.coastWaterCapTopY('roblox');
  const coastPrismTopY = Ms.terrainSurfaceTopY(TerenBazowy.PlytkieMorze, 'roblox');
  const riverMouthY = Math.max(capTopY + R * 0.026, coastPrismTopY + R * 0.035);
  const SURF = Ms.riverSurfaceLiftY(R);
  const raw: Coord[][] = [
    [{ q: 1, r: 1 }, { q: 2, r: 1 }],
    [{ q: 1, r: 1 }, { q: 2, r: 1 }, { q: 3, r: 1 }, { q: 4, r: 1 }],
    [{ q: 1, r: 1 }, { q: 2, r: 1 }, { q: 1, r: 1 }, { q: 1, r: 2 }, { q: 1, r: 3 }],       // 180°
    [{ q: 1, r: 1 }, { q: 2, r: 1 }, { q: 2, r: 0 }, { q: 3, r: 0 }],                        // ≥120°
    [{ q: 3, r: 0 }, { q: 3, r: 1 }, { q: 2, r: 2 }, { q: 2, r: 3 }, { q: 3, r: 3 }, { q: 3, r: 4 }, { q: 3, r: 5 }],
    [{ q: 6, r: 1 }, { q: 7, r: 1 }, { q: 7, r: 2 }, { q: 8, r: 2 }, { q: 8, r: 3 }, { q: 9, r: 3 }],  // 60° zigzag
    [{ q: 2, r: 2 }, { q: 4, r: 2 }, { q: 5, r: 2 }],                                        // non-adjacent step
    [{ q: 2, r: 4 }, { q: 2, r: 5 }, { q: 2, r: 6 }],                                        // into the sea (Morze → null Y)
    [{ q: 20, r: 20 }, { q: 21, r: 20 }],                                                    // off the map
    [{ q: 5, r: 5 }],
  ];
  const out: any[] = [];
  for (const p of raw) {
    for (const ext of [false, true]) {
      const res = S.__buildRiverPointsFromHexPath(map, p, R, 'roblox', riverMouthY, SURF, new Set<string>(), ext);
      out.push({
        path: p, extendToCenter: ext,
        simplified: S.__simplifyRiverRenderPath(p),
        pts: res.pts.map((v: THREE.Vector3) => [v.x, v.y, v.z]),
        pointHex: res.pointHex,
        hexKeys: [...res.hexKeys],
        reachesSea: S.__pathReachesOpenSeaRender(map, p),
      });
    }
  }
  return out;
}

/** buildRibbonGeometry (sharp) on point lists with scalar and per-point half widths. */
function ribbonCases(): any[] {
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const lists: THREE.Vector3[][] = [
    [V(0, 0.5, 0), V(1, 0.5, 0)],
    [V(0, 0.5, 0), V(1, 0.5, 0.25), V(1.5, 0.5, 1.75), V(0.25, 0.5, 2)],
    [V(-1.2, 0.54, 3.3), V(-1.2, 0.54, 3.3), V(0.7, 0.4, -2.1)],   // duplicate point → zero tangent
    [V(0.1, 0.6, 0.2), V(0.1, 0.25, 0.2), V(0.4, 0.25, 0.9)],      // vertical step (waterfall)
  ];
  const out: any[] = [];
  for (const pts of lists) {
    for (const hw of [0.052, pts.map((_, i) => 0.03 + 0.01 * i)]) {
      const g = S.__buildRibbonGeometry(pts, hw, 8, true);
      out.push({ pts: pts.map((v) => [v.x, v.y, v.z]), halfWidth: hw, geo: dumpGeo(g) });
    }
  }
  return out;
}

const A = mapA();
const G1 = mapGenerated(40, 30, 3, 'high');
const G2 = mapGenerated(48, 36, 11, 'medium');
const scenarios: any[] = [];
for (const [stage, fast, sf] of [[2, false, false], [5, false, false], [5, true, false], [5, true, true], [1, false, false], [3, false, false], [0, false, false]] as const) {
  scenarios.push(await scenario(`A-s${stage}${fast ? '-fast' : ''}${sf ? '-scenefast' : ''}`, A, stage, fast, sf, 1));
}
scenarios.push(await scenario('A-s5-R1.5', A, 5, false, false, 1.5));
// renderLandRiversFromPaths opts (scene.ts:1280-1286): batch flush every 2 paths, decimation.
scenarios.push(await scenario('A-s5-batch2', A, 5, false, false, 1, { batchSize: 2 }));
scenarios.push(await scenario('G1-s5-batch3-dec', G1, 5, false, false, 1, { batchSize: 3, tributaryDecimateDist: 0.4 }));
scenarios.push(await scenario('G1-s5', G1, 5, false, false, 1));
scenarios.push(await scenario('G1-s2-fast', G1, 2, true, false, 1));
scenarios.push(await scenario('G2-s5-fast-scenefast', G2, 5, true, true, 1));
scenarios.push(await scenario('G2-s2', G2, 2, false, false, 1));

const palette = Ms.styleScenePalette('roblox');
const doc = {
  pin: '07d2fbd72',
  three: THREE.REVISION,
  constants: {
    paletteRiver: palette.river,
    paletteRiverBank: palette.riverBank,
    coastDeltaColor: Ms.styleTerrainColor(TerenBazowy.PlytkieMorze, 'roblox'),
    riverSurfaceLiftY1: Ms.riverSurfaceLiftY(1),
    flatLandSurfaceY: Ms.FLAT_LAND_SURFACE_Y,
  },
  points: pointCases(A),
  ribbons: ribbonCases(),
  scenarios,
};
fs.writeFileSync(path.join(OUT, 'rivers.json'), ser(doc) + '\n');
const nEntries = scenarios.reduce((s, sc) => s + sc.entries.length, 0);
const nPaths = scenarios.reduce((s, sc) => s + sc.map.rivers.length, 0);
console.log(`rivers scenarios=${scenarios.length} entries=${nEntries} paths=${nPaths} points=${doc.points.length} ribbons=${doc.ribbons.length}`);
