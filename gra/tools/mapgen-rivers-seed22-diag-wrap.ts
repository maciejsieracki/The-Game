// Wrapper Node (bez DOM) generacji świata — R-WEB-MAPGEN-RIVERS-SEED22-HANG-DIAG-Q1 r3.
import { generujSwiat } from '../src/map/generator';
import { DEFAULT_WORLD_DENSITY } from '../src/map/newGameMapDefaults';

const seed = parseInt(process.argv[2] ?? '22', 10);
const rozmiar = (process.argv[3] ?? 'standardowy') as any;
const label = process.argv[4] ?? 'Standardowy';
const civTypes = parseInt(process.argv[5] ?? '15', 10);
const cityStates = parseInt(process.argv[6] ?? '2', 10);
import { ROZMIAR_DIMS } from '../src/map/generator';
console.log(`DIMS ${rozmiar} ${JSON.stringify((ROZMIAR_DIMS as any)[rozmiar])} cpuCount-load per uptime`);
const t0 = Date.now();
let lastFaza = '';
const g: any = globalThis as any;
g.__diag = g.__diag ?? {};
// Liczniki co 10 s nie mogą być wypisywane z timera (synchroniczna generacja blokuje pętlę zdarzeń),
// więc generator wypisuje je z hooka __diagTick (patrz plugin instrumentacji).
g.__diagT0 = t0;
const map = generujSwiat(seed, rozmiar, 'kontynenty', {
  worldDensity: { ...DEFAULT_WORLD_DENSITY },
  mapSizeMenuLabel: label,
  landFraction: 0.3,
  difficulty: 'normal',
  civTypesCount: civTypes,
  cityStatesCount: cityStates,
  villageRewardsEnabled: true,
} as any, (faza: string, pct: number, n?: number) => {
  if (faza !== lastFaza) { lastFaza = faza; console.log(`PHASE t=${((Date.now()-t0)/1000).toFixed(1)}s ${n} ${faza} ${pct}`); }
});
console.log(`DONE seed=${seed} ${rozmiar} t=${((Date.now()-t0)/1000).toFixed(2)}s hexes=${Object.keys((map as any).hexes ?? {}).length}`);
console.log('COUNTERS ' + JSON.stringify(g.__diag));
