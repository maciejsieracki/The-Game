import { generujSwiat } from '../src/map/generator';
import { pathHasValidRiverOutlet, verifyRiverNetworkConnectivity } from '../src/map/gen-helpers';

const SEEDS = [42, 123];
const TYPES = ['pangea', 'ziemia', 'kontynenty'] as const;
let fail = 0;
for (const seed of SEEDS) {
  for (const typ of TYPES) {
    for (const roz of ['maly', 'duzy'] as const) {
      const map = generujSwiat(seed, roz, typ, {
        worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
      });
      const W = map.szerokoscQ;
      const H = map.wysokoscR;
      const paths = map.riverPaths ?? [];
      const kinds = map.riverPathKinds ?? [];
      let bad = 0;
      for (let i = 0; i < paths.length; i++) {
        if (!paths[i]?.length || !pathHasValidRiverOutlet(map.hexes, paths[i]!, paths, kinds, W, H)) bad++;
      }
      const net = verifyRiverNetworkConnectivity(map.hexes, paths, kinds, W, H);
      const ok = bad === 0 && net.orphanCount === 0;
      console.log(`${ok ? 'PASS' : 'FAIL'} seed=${seed} ${roz} ${typ}: rivers=${paths.length} bad=${bad} orphans=${net.orphanCount}`);
      if (!ok) fail++;
    }
  }
}
process.exit(fail > 0 ? 1 : 0);
