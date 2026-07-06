/**
 * weryfikacja-mapy.ts — test akceptacyjny generatora (audyt 2026-07-05, v2 + Super Huge).
 * Uruchomienie (z katalogu gra-robocza):
 *   npx esbuild tools/weryfikacja-mapy.ts --bundle --platform=node --format=cjs --outfile=tools/weryfikacja-mapy.cjs
 *   node tools/weryfikacja-mapy.cjs            # zestaw podstawowy (maly + standardowy)
 *   node tools/weryfikacja-mapy.cjs super      # + Super Huge 672×476 (baseline czasu, wolne!)
 * Kryteria: 0 głównych rzek bez ujścia; 0 dziur wodnych; standard < 5 s; determinizm (hash).
 */
import { generateMap } from '../src/map/generator';
import {
  pathEndsAtSea,
  verifyRiverNetworkConnectivity,
  countRiverOutletsToSea,
  medianRiverPathLength,
  checkRiverEdgeContinuity,
  checkTributaryJunctions,
  checkNoRiverRings,
} from '../src/map/gen-helpers';
import { TerenBazowy } from '../src/types/hex';

const DIRS: Array<[number, number]> = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
const TYPY = ['kontynenty', 'pangea', 'wyspy', 'ziemia'] as const;
const SEEDS = [42, 123, 777, 7, 2026];
const withSuper = process.argv.includes('super');
const superOnly = process.argv.includes('super-only');

function mapHash(hexes: Record<string, any>): number {
  // FNV-1a po posortowanych "key:teren" — test determinizmu między uruchomieniami/refaktorami.
  const keys = Object.keys(hexes).sort();
  let h = 0x811c9dc5;
  for (const k of keys) {
    const s = k + ':' + hexes[k].terenBazowy;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
  }
  return h >>> 0;
}

function runCase(size: string, w: number, h: number, typ: string, seed: number, maxMs: number | null): boolean {
  const t0 = Date.now();
  const map = generateMap(w, h, seed, typ as any);
  const ms = Date.now() - t0;
  const hexes: Record<string, any> = map.hexes as any;
  const paths: any[] = (map as any).riverPaths ?? [];
  const kinds: any[] = (map as any).riverPathKinds ?? [];

  let badMain = 0, mains = 0;
  for (let i = 0; i < paths.length; i++) {
    if (kinds[i] !== 'main') continue;
    mains++;
    if (!pathEndsAtSea(hexes, paths[i], w, h)) badMain++;
  }
  const conn = verifyRiverNetworkConnectivity(hexes, paths, kinds, w, h);
  const ujscia = countRiverOutletsToSea(hexes, paths, kinds, w, h);
  const medLen = medianRiverPathLength(paths, kinds, true);
  const cont = checkRiverEdgeContinuity(paths, hexes);          // B0.8 I1
  const junc = checkTributaryJunctions(paths, kinds, hexes, w, h); // B0.8 I2
  const rings = checkNoRiverRings(hexes, paths);                // B0.10 zakaz pierścieni
  const maxUjscia = size === 'superogromny'
    ? Math.ceil(w * h / 800)
    : size === 'standardowy'
      ? Math.ceil(w * h / 350)
      : Math.ceil(w * h / 200);
  const minMedLen = size === 'maly' ? 8 : 18;
  let holes = 0, decorOnWater = 0, land = 0, total = 0, farCoast = 0;
  const isWater = (t: any) => t === TerenBazowy.Morze || t === TerenBazowy.Wybrzeze;
  for (const [key, hex] of Object.entries(hexes) as any) {
    total++;
    if (!isWater(hex.terenBazowy)) { land++; continue; }
    if (hex.nakladka && hex.nakladka !== 'brak') decorOnWater++;
    if ((hex as any).zloze) decorOnWater++;
    const [q, r] = key.split(',').map(Number);
    let dry = 0, all = 0, seaNb = false;
    for (const [dq, dr] of DIRS) {
      const nh = hexes[`${q + dq},${r + dr}`];
      if (!nh) continue;
      all++;
      if (!isWater(nh.terenBazowy)) dry++;
      if (nh.terenBazowy === TerenBazowy.Morze) seaNb = true;
    }
    if (all === 6 && dry === 6) holes++;
    // Wybrzeże dalej niż 2 od Morza = podejrzany pas
    if (hex.terenBazowy === TerenBazowy.Wybrzeze && !seaNb) {
      let sea2 = false;
      outer: for (const [dq, dr] of DIRS) {
        for (const [dq2, dr2] of DIRS) {
          if (hexes[`${q + dq + dq2},${r + dr + dr2}`]?.terenBazowy === TerenBazowy.Morze) { sea2 = true; break outer; }
        }
      }
      if (!sea2) farCoast++;
    }
  }
  const hash = mapHash(hexes);
  const slow = maxMs != null && ms > maxMs;
  const badConn = !conn.connected;
  const badUjscia = ujscia > maxUjscia;
  const badMed = medLen < minMedLen && paths.length > 5;
  const badCont = !cont.ok;   // I1: przerwa w biegu (para bez oznakowanej krawędzi)
  const badJunc = !junc.ok;   // I2: dopływ bez domkniętego junction
  const badRings = !rings.ok; // B0.10: heks z ≥4 krawędziami rzeki poza junctionem (pierścień)
  const bad = badMain > 0 || holes > 0 || decorOnWater > 0 || farCoast > 0 || slow
    || badConn || badUjscia || badMed || badCont || badJunc || badRings;
  console.log(
    `${bad ? 'FAIL' : ' ok '} ${size}/${typ}/seed=${seed}: ${(ms / 1000).toFixed(1)}s, ` +
    `main=${mains} ujscia=${ujscia} bezUjscia=${badMain} sieroc=${conn.orphanCount}, ` +
    `medLen=${medLen.toFixed(0)}, dziury=${holes}, dekorNaWodzie=${decorOnWater}, ` +
    `ciaglosc=${cont.violations} junction=${junc.violations} pierscienie=${rings.violations}, ` +
    `wybrzezeDalekoOdMorza=${farCoast}, lad=${(100 * land / total).toFixed(0)}%, hash=${hash}${slow ? ' [ZA WOLNO]' : ''}`,
  );
  if (badCont && cont.firstFail) console.log(`      I1 pierwsze naruszenie: ${cont.firstFail}`);
  if (badJunc && junc.firstFail) console.log(`      I2 pierwsze naruszenie: ${junc.firstFail}`);
  if (badRings && rings.firstFail) console.log(`      B0.10 pierwszy pierścień: ${rings.firstFail}`);
  return !bad;
}

let fail = 0;
if (!superOnly) {
  for (const typ of TYPY) {
    for (const seed of SEEDS) {
      if (!runCase('maly', 108, 74, typ, seed, null)) fail++;
    }
  }
  if (!runCase('standardowy', 168, 120, 'kontynenty', 42, 8000)) fail++;
  if (!runCase('standardowy', 168, 120, 'ziemia', 42, 8000)) fail++;
}
if (withSuper || superOnly) {
  console.log('--- Super Huge 672×476 (cel < 60 s) ---');
  if (!runCase('superogromny', 672, 476, 'kontynenty', 42, 180_000)) fail++;
  if (!runCase('superogromny', 672, 476, 'ziemia', 42, 180_000)) fail++;
}
console.log(fail === 0 ? '\nWYNIK: PASS' : `\nWYNIK: FAIL — ${fail} przypadkow.`);
process.exit(fail === 0 ? 0 : 1);
