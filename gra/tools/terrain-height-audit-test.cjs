'use strict';
/** Audyt wysokości morze vs ląd (render) + danych mapy (brak morza „pod” lądem). */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.terrain-height-audit-entry.ts');
const BUNDLE = path.resolve(__dirname, '.terrain-height-audit-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { terrainHeightAudit, LAND_MIN_CLEARANCE_ABOVE_SEA, SEA_SURFACE_TOP_Y } from '../src/render/mapRenderStyle';
export { generateMap } from '../src/map/generator';
export { auditMapTerrainData } from '../src/map/gen-helpers';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node18',
  outfile: BUNDLE,
  logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) {
    pass++;
    console.log('PASS:', msg);
  } else {
    fail++;
    console.error('FAIL:', msg);
  }
}

const audit = M.terrainHeightAudit('roblox');
console.log('\n--- Wysokości render (Roblox) ---');
console.log(`Morze (tafla):     ${audit.seaTopY.toFixed(3)}`);
console.log(`Wybrzeże:          ${audit.wybrzezeTopY.toFixed(3)}`);
console.log(`Nakładka wody 3D:  ${audit.coastWaterCapTopY.toFixed(3)}`);
for (const row of audit.land) {
  console.log(
    `${row.teren.padEnd(10)} top=${row.topY.toFixed(3)}  nad morzem=+${row.gapAboveSea.toFixed(3)}`,
  );
}
console.log(`Min. luka ląd–morze: ${audit.minLandGap.toFixed(3)} (wymagane ≥ ${M.LAND_MIN_CLEARANCE_ABOVE_SEA})`);

ok(audit.violations.length === 0, `render: brak naruszeń wysokości (${audit.violations.length})`);
if (audit.violations.length > 0) {
  for (const v of audit.violations) console.error('  ', v);
}

const map = M.generateMap(168, 120, 42, 'kontynenty', {
  mapSizeMenuLabel: 'Standardowy',
  worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
});
const data = M.auditMapTerrainData(map.hexes, map.szerokoscQ, map.wysokoscR);

console.log('\n--- Dane mapy (seed 42, kontynenty) ---');
console.log(`Heksów: ${data.totalHexes}`);
console.log('Teren:', JSON.stringify(data.byTeren));
console.log(`Wysepki w oceanie (błąd gen.): ${data.openOceanLandSpecks}`);
console.log(`Morze w lądzie (jeziora OK): ${data.enclosedInlandMorzeHexes} hex, ${data.enclosedInlandMorzeComponents} zbiorniki`);

ok(data.openOceanLandSpecks === 0, 'generator: brak lądu w otwartym oceanie');
ok(data.totalHexes === 168 * 120, 'generator: pełna siatka hexów (1 heks / współrzędna)');

console.log(`\nterrain-height-audit-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
