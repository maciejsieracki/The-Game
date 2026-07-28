import { performance } from 'node:perf_hooks';
import { generujSwiat, generateMap, rozmiarToDims } from '../src/map/generator';
import { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
import { buildClusterStartPlan } from '../src/game/cluster-start';
import { computeClusters } from '../src/map/clusters';
import { civIdsAvailableAtGameEpoch } from '../src/game/civ-entry-epoch';
import civs from '../data/civs.json';

const SEED = 42;
const ROZMIAR = 'maly' as const;
const DENSITY_MEDIUM = { rivers: 'medium' as const, forest: 'medium' as const, desert: 'medium' as const, relief: 'medium' as const };
const DENSITY_LOW = { ...DENSITY_MEDIUM, rivers: 'low' as const };

function msSince(t0: number): number {
  return performance.now() - t0;
}

function fmtSec(ms: number): string {
  return (ms / 1000).toFixed(2) + 's';
}

function riverStats(map: ReturnType<typeof generujSwiat>) {
  const kinds = map.riverPathKinds ?? [];
  return {
    main: kinds.filter((k) => k === 'main').length,
    trib: kinds.filter((k) => k === 'tributary').length,
    total: map.riverPaths?.length ?? 0,
  };
}

// --- params ---
const { w, h } = rozmiarToDims(ROZMIAR);
const params = resolveRiverMapParams('medium', w, h);

console.log('=== PARAMETRY RZEK (Mały ' + w + '×' + h + ', tier medium) ===');
console.log(JSON.stringify({
  areaScale: +params.areaScale.toFixed(3),
  mainCell: params.mainCell,
  tributaryCell: params.tributaryCell,
  feederPasses: params.feederPasses,
  topUpPasses: params.topUpPasses,
  minLen: params.minLen,
  maxLen: params.maxLen,
  gridTraceMinLen: params.gridTraceMinLen,
}, null, 2));

// --- A: pełna generacja mapy (generateMap wewnątrz generujSwiat) ---
const tMap0 = performance.now();
const map = generujSwiat(SEED, ROZMIAR, 'kontynenty', {
  worldDensity: DENSITY_MEDIUM,
  mapSizeMenuLabel: 'Mały',
  civTypesCount: 4,
  cityStatesCount: 4,
  difficulty: 'normal',
});
const mapMs = msSince(tMap0);
const rs = riverStats(map);

// --- B: generacja z rivers=low (delta ≈ koszt W2 rzek) ---
const tLow0 = performance.now();
generujSwiat(SEED, ROZMIAR, 'kontynenty', {
  worldDensity: DENSITY_LOW,
  mapSizeMenuLabel: 'Mały',
});
const mapLowMs = msSince(tLow0);

// --- C: clusters (PO mapie — osobna faza doStartGame) ---
const epochRoster = civIdsAvailableAtGameEpoch(civs.cywilizacje, 'kamien');
const tCl0 = performance.now();
const placement = computeClusters(map, {
  seed: SEED,
  aktywneTypy: 4,
  playerTyp: 'grecy',
  rywaleNaKlaster: 4,
  startEpochId: 'kamien',
  civRoster: epochRoster,
});
const clusterMs = msSince(tCl0);

// --- D: pełny plan spawn (buildClusterStartPlan) ---
const tPlan0 = performance.now();
const plan = buildClusterStartPlan({
  map,
  civs,
  seed: SEED,
  playerCivId: 'grecy',
  rywaleNaKlaster: 4,
  aktywneTypy: 4,
  startEpochId: 'kamien',
});
const planMs = msSince(tPlan0);

// --- E: generateMap bezpośrednio (w×h) dla porównania ---
const tDirect0 = performance.now();
generateMap(w, h, SEED, 'kontynenty', { worldDensity: DENSITY_MEDIUM, mapSizeMenuLabel: 'Mały' });
const directMs = msSince(tDirect0);

console.log('\n=== CZASY (seed=42, Mały, kontynenty) ===');
console.log('  generateMap (pełny):     ' + fmtSec(mapMs));
console.log('  generateMap rivers=low:  ' + fmtSec(mapLowMs) + '  (delta W2 rzek ≈ ' + fmtSec(mapMs - mapLowMs) + ')');
console.log('  computeClusters:         ' + fmtSec(clusterMs));
console.log('  buildClusterStartPlan:   ' + fmtSec(planMs));
console.log('  clusters+spawn RAZEM:    ' + fmtSec(clusterMs + planMs));
console.log('  reszta (map - riversΔ):  ' + fmtSec(mapLowMs) + '  (~' + ((mapLowMs / mapMs) * 100).toFixed(0) + '% mapy)');

console.log('\n=== RZEKI na mapie ===');
console.log('  main=' + rs.main + ' tributary=' + rs.trib + ' total=' + rs.total);

console.log('\n=== KLASTRY ===');
console.log('  aktywneTypy=' + placement.aktywneTypy + ' klastry=' + placement.klastry.length);
console.log('  spawnCities(AI)=' + plan.spawnCities.length + ' pendingRivals=' + plan.pendingSameTypeRivals);

console.log('\n=== Udział faz w „Tworzenie świata" (tylko mapgen, bez buildScene) ===');
const rest = mapLowMs;
const rivers = mapMs - mapLowMs;
const total = mapMs;
console.log('  rzeki (szac. delta low→medium): ' + fmtSec(rivers) + ' (' + ((rivers / total) * 100).toFixed(0) + '%)');
console.log('  reszta generatora:              ' + fmtSec(rest) + ' (' + ((rest / total) * 100).toFixed(0) + '%)');
console.log('  clusters+spawn (PO mapgen):     ' + fmtSec(clusterMs + planMs) + ' (poza overlay mapgen)');
