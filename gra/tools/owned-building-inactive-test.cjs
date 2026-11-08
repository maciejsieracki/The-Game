'use strict';
/** owned-building-inactive-test.cjs — R-BUDYNKI-NIEAKTYWNE helper */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.owned-building-inactive-entry.ts');
const BUNDLE = path.resolve(__dirname, '.owned-building-inactive-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  resolveOwnedBuildingInactiveStatus,
  SPICHLERZ_DRAIN_CERAMIKA_PER_TURN,
  SPICHLERZ_DRAIN_SOL_PER_TURN,
} from '../src/game/building-resource-gate';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);
const CER = M.SPICHLERZ_DRAIN_CERAMIKA_PER_TURN;
const SOL = M.SPICHLERZ_DRAIN_SOL_PER_TURN;

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

const ownerId = 0;
function city(surowce) {
  return { ownerId, surowce };
}

function resolveSpichlerz(buildingId, builtIds, surowce) {
  const cities = [city(surowce)];
  return M.resolveOwnedBuildingInactiveStatus(buildingId, {
    builtIds,
    allCities: cities,
    ownerId,
    runtimeActiveBuiltIds: [],
    empireStock: surowce,
  });
}

{
  const r = resolveSpichlerz('spichlerz', ['spichlerz'], { ceramika: 0 });
  ok(r.inactive && r.tooltip === 'Brak: Ceramika', 'spichlerz I bez Ceramiki → inactive');
}

{
  const r = resolveSpichlerz('spichlerz', ['spichlerz'], { ceramika: CER });
  ok(!r.inactive && r.tooltip === '', 'spichlerz I z Ceramiką → active');
}

{
  const built = ['spichlerz', 'spichlerz_ii'];
  const r = resolveSpichlerz('spichlerz_ii', built, { ceramika: CER, sol: 0 });
  ok(r.inactive && r.tooltip === 'Brak: Sól', 'spichlerz II Ceramika OK, brak Soli → Brak: Sól');
}

{
  const built = ['spichlerz', 'spichlerz_ii'];
  const r = resolveSpichlerz('spichlerz_ii', built, { ceramika: CER, sol: SOL });
  ok(!r.inactive, 'spichlerz II oba surowce → active');
}

try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }

console.log(`owned-building-inactive-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
