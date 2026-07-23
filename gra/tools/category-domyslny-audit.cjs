'use strict';
/**
 * category-domyslny-audit.cjs -- standalone Node control script (TEMAT #10B).
 * Run from gra/:
 *   node tools/category-domyslny-audit.cjs
 *
 * Bundles categoryOf() from src/units/setup.ts via esbuild, loads the REAL
 * data/units.json, and runs every unit's (Jednostka, Rola (linia),
 * Super-jednostka) through it. Prints a full name -> category map and lists
 * any unit that still falls into the 'domyslny' fallback bucket. Exit code
 * is 0 only when the 'domyslny' list is empty (or every entry there is an
 * explicitly acknowledged exception listed in ACKNOWLEDGED_DOMYSLNY below).
 *
 * Pure logic only -- no DOM, no THREE, no map/render code touched.
 */

const fs   = require('fs');
const path = require('path');

// --- esbuild ---------------------------------------------------------------
const esbuild = (() => {
  const apiPath = path.resolve(__dirname, '..', 'node_modules', 'esbuild');
  try { return require(apiPath); }
  catch (e) {
    console.error('[category-domyslny-audit] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const ENTRY_FILE  = path.resolve(__dirname, '.category-audit-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.category-audit-bundle.cjs');

const ENTRY_TS = `
export { categoryOf } from '../src/units/setup';
`;

fs.writeFileSync(ENTRY_FILE, ENTRY_TS, 'utf8');

try {
  esbuild.buildSync({
    entryPoints: [ENTRY_FILE],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE_FILE,
    logLevel: 'silent',
    resolveExtensions: ['.ts', '.js', '.json'],
  });
} catch (e) {
  console.error('[category-domyslny-audit] esbuild bundling failed:\n', e.message || e);
  process.exit(1);
} finally {
  try { fs.unlinkSync(ENTRY_FILE); } catch (_) { /* ignore */ }
}

const { categoryOf } = require(BUNDLE_FILE);
const unitsJson = require('../data/units.json');

// Units that are legitimately expected to stay 'domyslny' (none, by design --
// every unit in units.json should get a real category). Populate only if the
// owner explicitly accepts an exception.
const ACKNOWLEDGED_DOMYSLNY = new Set([]);

console.log('\n[category-domyslny-audit] ' + unitsJson.length + ' units in data/units.json\n');

const rows = [];
const domyslni = [];

for (const u of unitsJson) {
  const name  = u['Jednostka'] ?? '';
  const role  = u['Rola (linia)'] ?? '';
  const typ   = u['Typ'] ?? '';
  const isSuper = u['Super-jednostka'] === 'TAK';
  const cat = categoryOf(name, role, isSuper, typ);
  rows.push({ name, typ, role, isSuper, cat });
  if (cat === 'domyslny' && !ACKNOWLEDGED_DOMYSLNY.has(name)) {
    domyslni.push(name);
  }
}

// Full map, sorted by category then name, for the report.
rows.sort((a, b) => (a.cat === b.cat ? a.name.localeCompare(b.name) : a.cat.localeCompare(b.cat)));
for (const r of rows) {
  console.log(
    '  ' + r.cat.padEnd(12) + ' <- ' + r.name.padEnd(38) +
    ' (Typ=' + r.typ + ', Rola=' + r.role + (r.isSuper ? ', SUPER' : '') + ')'
  );
}

console.log('\n[category-domyslny-audit] units still falling into "domyslny": ' + domyslni.length);
if (domyslni.length > 0) {
  for (const n of domyslni) console.log('  [DOMYSLNY] ' + n);
  process.exitCode = 1;
} else {
  console.log('  (none)');
  process.exitCode = 0;
}
