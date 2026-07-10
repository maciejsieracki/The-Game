'use strict';
/**
 * tech-tree-test.cjs — B1-Q3 drzewko liniowe (lane B)
 * Uruchom z gra/: node tools/tech-tree-test.cjs
 */

const fs = require('fs');
const path = require('path');

const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch {
    console.error('[tech-tree-test] esbuild not found. Run: npm install (from gra/)');
    process.exit(1);
  }
})();

const GRA_ROOT = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.tech-tree-entry.ts');
const BUNDLE = path.resolve(__dirname, '.tech-tree-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export {
  TECH_TREE_MODEL_LINEAR,
  readTechTreeModel,
  orderedTechsInEpoch,
  linearDepthInEpoch,
  techPrereqChain,
  validateTechGraph,
} from '../src/game/tech-tree';\n`,
  'utf8',
);

try {
  esbuild.buildSync({
    entryPoints: [ENTRY],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    outfile: BUNDLE,
    absWorkingDir: GRA_ROOT,
    logLevel: 'silent',
  });
} catch (e) {
  console.error('[tech-tree-test] esbuild failed:', e.message || e);
  process.exit(1);
}

const TT = require(BUNDLE);
const techRoot = JSON.parse(fs.readFileSync(path.join(GRA_ROOT, 'data', 'tech.json'), 'utf8'));
const techs = techRoot.technologie;

let pass = 0;
let fail = 0;
function ok(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('FAIL:', msg); }
}

ok(techs.length === 32, '32 technologii w tech.json (E3a: +Astronomia)');
ok(TT.readTechTreeModel(techRoot) === TT.TECH_TREE_MODEL_LINEAR, 'drzewko_model liniowe');
ok(techRoot.drzewko_model === 'liniowe', 'tech.json drzewko_model pole');

const val = TT.validateTechGraph(techs);
ok(val.ok, `validateTechGraph OK (${val.errors.join('; ') || 'brak błędów'})`);

const kamien = TT.orderedTechsInEpoch(techs, 'Kamień');
ok(kamien.length >= 10, 'Kamień ma >=10 tech');
ok(kamien[0].Technologia === 'Obróbka drewna', 'Kamień L1 pierwsza: Obróbka drewna');
for (let i = 1; i < kamien.length; i++) {
  const prev = kamien[i - 1].Poziom ?? 0;
  const cur = kamien[i].Poziom ?? 0;
  ok(cur >= prev, `Kamień poziom rosnący: ${kamien[i].Technologia}`);
}

const jezChain = TT.techPrereqChain('Jeździectwo', techs);
ok(jezChain.includes('Koło') && jezChain.includes('Jeździectwo'), 'Jeździectwo chain zawiera Koło');

const wymDepth = TT.linearDepthInEpoch('Wymiana', techs);
ok(wymDepth === 1, 'Wymiana depth 1 (Garncarstwo w Kamień)');

console.log(`tech-tree-test: ${pass} pass, ${fail} fail`);
process.exit(fail > 0 ? 1 : 0);
