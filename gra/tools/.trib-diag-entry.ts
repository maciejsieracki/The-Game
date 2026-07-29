import { generujSwiat } from '../src/map/generator';
import {
  checkTributaryJunctions,
  verifyRiverNetworkConnectivity,
  pathEndsAtSea,
} from '../src/map/gen-helpers';

const SEEDS = [42, 7];
const TYPES = ['kontynenty', 'pangea', 'wyspy', 'ziemia'] as const;
const DENSITY = { rivers: 'medium' as const, forest: 'medium' as const, desert: 'medium' as const, relief: 'medium' as const };

let tribViol = 0;
let orphanHex = 0;
let danglingTrib = 0;
let totalTrib = 0;

for (const seed of SEEDS) {
  for (const typ of TYPES) {
    const map = generujSwiat(seed, 'standardowy', typ, { worldDensity: DENSITY });
    const W = map.szerokoscQ;
    const H = map.wysokoscR;
    const paths = map.riverPaths ?? [];
    const kinds = map.riverPathKinds ?? [];
    const j = checkTributaryJunctions(paths, kinds, map.hexes, W, H);
    const net = verifyRiverNetworkConnectivity(map.hexes, paths, kinds, W, H);
    if (!j.ok) tribViol += j.violations;
    orphanHex += net.orphanCount;
    for (let i = 0; i < paths.length; i++) {
      if (kinds[i] !== 'tributary') continue;
      totalTrib++;
      const p = paths[i]!;
      const atSea = pathEndsAtSea(map.hexes, p, W, H);
      if (!atSea && j.ok) {
        // double-check junction manually
        const end = p[p.length - 1]!;
        const eh = map.hexes[`${end.q},${end.r}`];
        let hasNetEdge = false;
        for (const ei of eh?.rzeka?.krawedzie ?? []) {
          const dirs = [[1,0],[-1,0],[0,1],[0,-1],[1,-1],[-1,1]] as const;
          const d = dirs[ei];
          if (!d) continue;
          const nk = `${end.q + d[0]},${end.r + d[1]}`;
          const nh = map.hexes[nk];
          if (nh?.rzeka?.obecna) hasNetEdge = true;
        }
        if (!hasNetEdge) danglingTrib++;
      }
    }
    if (net.orphanCount > 0 || !j.ok) {
      console.log(`seed=${seed} typ=${typ} tribViol=${j.violations} first=${j.firstFail} orphans=${net.orphanCount} paths=${paths.length}`);
    }
  }
}
console.log(`totalTrib=${totalTrib} tribViol=${tribViol} orphanHex=${orphanHex} danglingTrib=${danglingTrib}`);
