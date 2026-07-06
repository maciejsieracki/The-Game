'use strict';
/**
 * diplomacy-display-test.cjs — tagi + stosunek Mocy (D3-UX BBBB).
 * Run: node tools/diplomacy-display-test.cjs
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = process.env.DIP_SRC_DIR || path.resolve(__dirname, '..', 'src');
const ENTRY = path.resolve(SRC, '.dip-display-entry.ts');
const BUNDLE = path.resolve(__dirname, '.dip-display-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  diplomacyPersonalityTags,
  formatPowerRatioLabel,
  formatPowerRelationLine,
  respektTooltipPl,
} from './game/diplomacy-display';
`);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: SRC,
  logLevel: 'silent',
});

const mod = require(BUNDLE);
let pass = 0;
let fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; return; }
  fail++;
  console.error('[FAIL]', msg);
}

const tagsGrecy = mod.diplomacyPersonalityTags('grecy');
ok(tagsGrecy.length >= 1 && tagsGrecy.length <= 3, 'grecy: 1–3 tagi');
ok(tagsGrecy.every(t => typeof t === 'string' && !/\d/.test(t)), 'tagi bez cyfr');

const tagsZulusi = mod.diplomacyPersonalityTags('zulusi');
ok(tagsZulusi.includes('Samotny wilk') || tagsZulusi.includes('Wojowniczy'), 'zulusi: tag ekstremalny');

ok(mod.formatPowerRatioLabel(4000, 2000) === '2:1', 'ratio 4000:2000 = 2:1');
ok(mod.formatPowerRatioLabel(3020, 3020) === '1:1', 'ratio parytet 1:1');

const line = mod.formatPowerRelationLine(4000, 2000);
ok(line.respekt === 67, 'respekt 4000 vs 2000 = 67');
ok(line.ratioLabel === '2:1', 'line ratio 2:1');

ok(mod.respektTooltipPl().includes('Respekt'), 'tooltip PL');

try { fs.unlinkSync(ENTRY); } catch (_) { /* ok */ }

console.log(`[diplomacy-display-test] ${pass} OK, ${fail} FAIL`);
process.exit(fail > 0 ? 1 : 0);
