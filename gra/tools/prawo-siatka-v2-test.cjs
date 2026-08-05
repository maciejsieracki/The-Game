'use strict';
/**
 * prawo-siatka-v2-test.cjs — R-PRAWO-SIATKA-V2 (DECYZJE-BUDYNKI §4)
 * Dom Starszyzny / Dwór Zarządcy / Pretorium = 50% / 60% / 70% Pałacu III (nie 70% Pałacu I/II).
 * Run: cd gra && node tools/prawo-siatka-v2-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.prawo-siatka-v2-entry.ts');
const BUNDLE = path.resolve(__dirname, '.prawo-siatka-v2-bundle.cjs');

fs.writeFileSync(ENTRY, `
export { computeLawBreakdown } from '../src/game/society-breakdown';
`, 'utf8');

try {
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
} catch (e) {
  console.error('[prawo-siatka-v2-test] bundle failed:', e.message || e);
  process.exit(1);
}

const M = require(BUNDLE);
const society = require('../data/society-params.json');
const pr = society.prawo;

let passed = 0;
let failed = 0;

function eq(a, b, msg) {
  if (a === b) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg + ' got ' + JSON.stringify(a) + ' expected ' + JSON.stringify(b)); }
}
function ok(cond, msg) {
  if (cond) { passed++; console.log('  [OK] ' + msg); }
  else { failed++; console.error('  [FAIL] ' + msg); }
}

const CANON = {
  prawo_palac: { easy: 45, normal: 35, hard: 28 },
  prawo_palac_ii: { easy: 58, normal: 45, hard: 36 },
  prawo_palac_iii: { easy: 71, normal: 55, hard: 44 },
  prawo_dom_starszyzny: { easy: 36, normal: 28, hard: 22 },
  prawo_dwor_zarzadcy: { easy: 43, normal: 33, hard: 26 },
  prawo_pretorium: { easy: 50, normal: 38, hard: 31 },
  prawo_trybunal: { easy: 22, normal: 17, hard: 13 },
  prawo_sad: { easy: 25, normal: 19, hard: 16 },
  prawo_garnizon_per_jednostka: { easy: 25, normal: 20, hard: 15 },
};

const DIFFS = ['easy', 'normal', 'hard'];

console.log('\n[prawo-siatka-v2-test] Audyt society-params.json vs tabela §4\n');

for (const [key, expected] of Object.entries(CANON)) {
  for (const diff of DIFFS) {
    const actual = pr[key]?.[diff];
    eq(actual, expected[diff], `${key} (${diff}) = ${expected[diff]}`);
  }
}

console.log('\n[prawo-siatka-v2-test] Relacje procentowe vs Pałac III\n');

const ratios = [
  { key: 'prawo_dom_starszyzny', pct: 0.50, label: 'Dom Starszyzny' },
  { key: 'prawo_dwor_zarzadcy', pct: 0.60, label: 'Dwór Zarządcy' },
  { key: 'prawo_pretorium', pct: 0.70, label: 'Pretorium' },
];

for (const { key, pct, label } of ratios) {
  for (const diff of DIFFS) {
    // Tabela §4 jest źródłem prawdy (np. Pretorium normal=38, nie Math.round(55×0.7)=39).
    const expected = CANON[key][diff];
    eq(pr[key][diff], expected, `${label} ≈ ${pct * 100}% Pałac III (${diff}): tabela §4 = ${expected}`);
  }
}

for (const diff of DIFFS) {
  const expectedSad = CANON.prawo_sad[diff];
  eq(pr.prawo_sad[diff], expectedSad, `Sąd ≈ 50% Pretorium (${diff}): tabela §4 = ${expectedSad}`);
}

console.log('\n[prawo-siatka-v2-test] computeLawBreakdown — Dom / Dwór / Pretorium\n');

function adminValue(diff, flags) {
  const res = M.computeLawBreakdown({ garnizonCount: 0, era: 3, difficulty: diff, ...flags }, society);
  return res.lines;
}

for (const diff of DIFFS) {
  const dom = adminValue(diff, { hasDomStarszyzny: true }).find(l => l.id === 'dom_starszyzny');
  eq(dom?.value, CANON.prawo_dom_starszyzny[diff], `breakdown Dom Starszyzny (${diff})`);

  const dwor = adminValue(diff, { hasDworZarzadcy: true }).find(l => l.id === 'dwor_zarzadcy');
  eq(dwor?.value, CANON.prawo_dwor_zarzadcy[diff], `breakdown Dwór Zarządcy (${diff})`);

  const pret = adminValue(diff, { hasPretorium: true }).find(l => l.id === 'pretorium');
  eq(pret?.value, CANON.prawo_pretorium[diff], `breakdown Pretorium (${diff})`);
}

// Stare wartości (70% Pałac I/II) — NIE mogą wrócić
const STALE = {
  prawo_dom_starszyzny: { easy: 31, normal: 24, hard: 20 },
  prawo_dwor_zarzadcy: { easy: 41, normal: 31, hard: 25 },
};

console.log('\n[prawo-siatka-v2-test] Regresja — stare liczby (70% Pałac I/II) nieobecne\n');

for (const [key, stale] of Object.entries(STALE)) {
  for (const diff of DIFFS) {
    ok(pr[key][diff] !== stale[diff], `${key} (${diff}) ≠ stara wartość ${stale[diff]}`);
  }
}

ok(!Object.prototype.hasOwnProperty.call(pr, 'prawo_ratusz'),
  'brak klucza prawo_ratusz (Ratusz usunięty, Trybunał zastępuje)');

console.log('\n[prawo-siatka-v2-test] ' + passed + ' OK, ' + failed + ' FAIL\n');
process.exit(failed > 0 ? 1 : 0);
