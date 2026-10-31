'use strict';
/**
 * objaw-cost-probe.cjs — pomiar kosztu Pracy ulepszeń (R-WEB-AUTOIMPROVE-PRIORITY-Q1, Objaw B).
 * Run from gra/:  node tools/objaw-cost-probe.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));
const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY_FILE = path.resolve(__dirname, '.objaw-cost-probe-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.objaw-cost-probe-bundle.cjs');
fs.writeFileSync(ENTRY_FILE, "export { getImprovementMeta } from './../src/game/improvement-tech';\n", 'utf8');
esbuild.buildSync({ entryPoints: [ENTRY_FILE], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
  outfile: BUNDLE_FILE, absWorkingDir: GRA_ROOT, logLevel: 'silent' });
const { getImprovementMeta } = require(BUNDLE_FILE);
for (const k of ['farma', 'bydlo', 'irygacja', 'owce', 'lama', 'tartak', 'oboz_lowiecki', 'wyrab']) {
  const m = getImprovementMeta(k);
  console.log(k, 'epoka', m && m.epoka, 'kosztPraca', m && m.kosztPraca, 'tech', m && m.techId);
}
