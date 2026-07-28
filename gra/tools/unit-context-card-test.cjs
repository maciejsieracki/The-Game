'use strict';
/**
 * unit-context-card-test.cjs — karta jednostki w panelu bocznym (HP, ruch, siły).
 * Run from gra/:  node tools/unit-context-card-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const STUB_DIR = path.resolve(__dirname, '.stubs');
const STUB_FILE = path.resolve(STUB_DIR, 'brandAssets-stub.ts');
const ENTRY_FILE = path.resolve(__dirname, '.unit-context-card-entry.ts');
const BUNDLE_FILE = path.resolve(__dirname, '.unit-context-card-bundle.cjs');

fs.mkdirSync(STUB_DIR, { recursive: true });
fs.writeFileSync(STUB_FILE, `
export function brandIconSvg(_key, _size) { return ''; }
export function mapResourceIconSvg(_key, _size) { return ''; }
export function terrainIconSvg(_key, _size) { return ''; }
export function unitIconSvg(_key) { return ''; }
`, 'utf8');

fs.writeFileSync(ENTRY_FILE, `
export { buildUnitContextTooltipHtml } from '../src/ui/hexContextTooltip';
export { fieldPower } from '../src/game/unit-power';
`, 'utf8');

const stubBrandAssetsPlugin = {
  name: 'stub-brand-assets',
  setup(build) {
    build.onResolve({ filter: /icons\/brandAssets$/ }, () => ({ path: STUB_FILE }));
  },
};

async function main() {
  try {
    await esbuild.build({
      entryPoints: [ENTRY_FILE],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE_FILE,
      absWorkingDir: GRA,
      plugins: [stubBrandAssetsPlugin],
      logLevel: 'silent',
    });
  } catch (e) {
    console.error('[unit-context-card-test] esbuild failed:', e.message || e);
    process.exit(1);
  }

  const M = require(BUNDLE_FILE);
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const combat = {
    atakBase: 8,
    atakEffective: 10,
    obronaBase: 6,
    obronaEffective: 7,
    hpMaxBase: 20,
    hpMaxEffective: 22,
    pancerzBase: 2,
    pancerzEffective: 3,
  };

  const base = {
    displayName: 'Łucznik',
    q: 1,
    r: 2,
    ruchLeft: 1,
    ruchMax: 2,
    combat,
    zasieg: 2,
    esc,
  };

  let pass = 0;
  let fail = 0;
  function ok(c, m) {
    if (c) { pass++; console.log('  PASS:', m); }
    else { fail++; console.error('  FAIL:', m); }
  }

  // 1) HP fallback when u.hp undefined — shows effective max, not "—".
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, hp: undefined });
    ok(html.includes('22/22'), '1) HP fallback -> hpMaxEffective when hp undefined');
    ok(!html.includes('>—<'), '1b) no dash HP placeholder');
    ok(html.includes('sp-unit-stack-bar-hp'), '1c) HP bar present');
  }

  // 2) Movement bar in compact view.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, hp: 18 });
    ok(html.includes('1/2') && html.includes('sp-unit-stack-bar-mov'), '2) movement bar + value');
    ok(html.includes('18/22'), '2b) explicit HP value');
  }

  // 3) readOnly hides movement row.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, readOnly: true });
    ok(!html.includes('sp-unit-stack-bar-mov'), '3) readOnly hides movement bar');
    ok(html.includes('sp-unit-stack-bar-hp'), '3b) HP bar still shown');
  }

  // 4) Siły zastosowane + Moc pola.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base });
    const power = M.fieldPower({
      meleeAttack: combat.atakEffective,
      meleeDefence: combat.obronaEffective,
      armor: combat.pancerzEffective,
      health: combat.hpMaxEffective,
    });
    ok(html.includes('Siły zastosowane'), '4) forces section header');
    ok(html.includes(`Atak ${power.attack}`) && html.includes(`Razem ${power.total}`), '4b) field power breakdown');
  }

  // 5) Expanded stats grid.
  {
    const html = M.buildUnitContextTooltipHtml({ ...base, expanded: true });
    ok(html.includes('Statystyki jednostki'), '5) expanded stats section');
    ok(html.includes('sp-unit-expanded-stats'), '5b) expanded stats grid');
    ok(html.includes('Zasięg') && html.includes('Ruch max'), '5c) range and move max rows');
  }

  console.log(`\nunit-context-card-test: ${pass} pass, ${fail} fail`);
  process.exit(fail > 0 ? 1 : 0);
}

main();
