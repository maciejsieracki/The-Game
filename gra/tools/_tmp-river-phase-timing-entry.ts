/**
 * Profil rzek — kontynenty seed 42. CIV_RIVER_PROFILE=1 wymagane.
 * Użycie: CIV_MAP_SIZE=standard|duzy node tools/_tmp-river-phase-timing.cjs
 */
import { performance } from 'node:perf_hooks';
import { generateMap, rozmiarToDims } from '../src/map/generator';
import { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
import {
  resetRiverProfileStats,
  formatRiverProfileReport,
  getRiverProfileStats,
} from '../src/map/gen-helpers';

const SEED = 42;
const SIZE = (process.env.CIV_MAP_SIZE ?? 'standardowy').toLowerCase();
const ROZMIAR: 'standardowy' | 'duzy' = (SIZE === 'duzy' || SIZE === 'duży' ? 'duzy' : 'standardowy');
const DENSITY = {
  rivers: 'medium' as const,
  forest: 'medium' as const,
  desert: 'medium' as const,
  relief: 'medium' as const,
};

function msSince(t0: number): number {
  return performance.now() - t0;
}

function fmtMs(ms: number): string {
  return ms.toFixed(0) + 'ms';
}

function pct(ms: number, total: number): string {
  return total > 0 ? ((ms / total) * 100).toFixed(1) + '%' : '0.0%';
}

const { w, h } = rozmiarToDims(ROZMIAR);
const params = resolveRiverMapParams('medium', w, h);
const label = ROZMIAR === 'duzy' ? 'Duży' : 'Standardowy';

console.log('=== PARAMETRY RZEK (' + label + ' ' + w + '×' + h + ', tier medium, seed=' + SEED + ') ===');
console.log(JSON.stringify({
  areaScale: +params.areaScale.toFixed(3),
  mainCell: params.mainCell,
  tributaryCell: params.tributaryCell,
  feederPasses: params.feederPasses,
  topUpPasses: params.topUpPasses,
  minLen: params.minLen,
  maxLen: params.maxLen,
  gridTraceMinLen: params.gridTraceMinLen,
  largeMapPerf: params.areaScale >= 1.35,
}, null, 2));

resetRiverProfileStats();

const t0 = performance.now();
const map = generateMap(w, h, SEED, 'kontynenty', {
  worldDensity: DENSITY,
  mapSizeMenuLabel: label,
});
const totalMs = msSince(t0);

const kinds = map.riverPathKinds ?? [];
const riverCount = map.riverPaths?.length ?? 0;

console.log('\n=== MAP GEN TOTAL ===');
console.log('  czas: ' + (totalMs / 1000).toFixed(2) + 's');
console.log('  rzeki: total=' + riverCount
  + ' main=' + kinds.filter((k) => k === 'main').length
  + ' medium=' + kinds.filter((k) => k === 'medium').length
  + ' short=' + kinds.filter((k) => k === 'short').length
  + ' tributary=' + kinds.filter((k) => k === 'tributary').length);

const stats = getRiverProfileStats();
if (!stats) {
  console.error('\nBRAK PROFILU — ustaw CIV_RIVER_PROFILE=1');
  process.exit(1);
}

const riverMs = stats.generateRiversMs + stats.topUpMs;
const nonRiverMs = totalMs - riverMs;

console.log('\n' + formatRiverProfileReport(riverMs));

console.log('\n=== TABELA (ms + % rzek) ===');
const rows: Array<[string, number, number?]> = [
  ['fieldCache', stats.fieldCacheMs],
  ['generateRivers TOTAL', stats.generateRiversMs],
  ['  etap1 main', stats.genStage1Ms],
  ['  etap2 medium (×' + stats.genStage2Rounds + ' rund)', stats.genStage2Ms],
  ['  etap3 short', stats.genStage3Ms],
  ['  decor tributary', stats.genDecorMs],
  ['  gen dry-patch', stats.genDryPatchMs],
  ['topUp TOTAL', stats.topUpMs],
  ['  hardStarts', stats.topUpHardStartsMs],
  ['  dryPatch', stats.topUpDryPatchMs],
  ['  grid+proximity', stats.topUpGridProxMs],
  ['traceRiver (×' + stats.traceRiverCalls + ')', stats.traceRiverMs],
  ['aStarRiverToSea (×' + stats.aStarCalls + ')', stats.aStarMs],
];
for (let i = 0; i < stats.topUpPassMs.length; i++) {
  rows.push(['  topUp pass ' + (i + 1), stats.topUpPassMs[i]!]);
}
rows.push(['forceFill attempts', 0, stats.forceFillCalls]);

const colW = 28;
console.log('Blok'.padEnd(colW) + 'ms'.padStart(8) + '  %rzek');
for (const [label2, ms, count] of rows) {
  if (count != null) {
    console.log(label2.padEnd(colW) + String(count).padStart(8) + '  (count)');
  } else {
    console.log(label2.padEnd(colW) + fmtMs(ms).padStart(8) + '  ' + pct(ms, riverMs));
  }
}

console.log('\n=== POZA RZEKAMI (szac.) ===');
console.log('  reszta mapgen: ' + fmtMs(nonRiverMs) + '  ' + pct(nonRiverMs, totalMs) + ' całości');
console.log('  rzeki / całość: ' + pct(riverMs, totalMs));
