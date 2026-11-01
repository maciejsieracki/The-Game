'use strict';
/**
 * node tools/capital-spacing-prop-test.cjs — R-WEB-CAPITAL-SPACING-FIX-Q1
 *
 * Regresja: Standard 168x120 (Kontynenty, domyslny udzial ladu 0.30, 5 ziaren, bez rzek):
 *   - najblizsza para stolic roznych civ >= progu proporcjonalnego (capitalMinSep z placement = 0,15 x 120 = 18),
 *   - liczba umieszczonych civ == zadana (brak regresu "tylko N/M").
 * Mutacja: ten sam test z wspolczynnikiem 0 (sama tabela, podloga 15) MUSI zlamac prog (>=1 mapa z para < 18),
 * czyli test faktycznie wykrywa regres do starego zachowania.
 * Bundle w mkdtemp poza repo; bez npm run build/dev.
 */
const path = require('path');
const fs = require('fs');
const os = require('os');
const esbuild = require('esbuild');

const GRA = path.resolve(__dirname, '..');
const SEEDS = [1, 2, 3, 4, 5];
const MUT_SEEDS = [1, 2, 3];
const THRESHOLD = Math.round(0.15 * 120); // 18

async function makeBundle(coefOverride) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'capspacing-'));
  const entry = path.join(tmp, 'entry.ts');
  const bundle = path.join(tmp, 'bundle.cjs');
  const rel = (p) => JSON.stringify(path.join(GRA, p).replace(/\\/g, '/'));
  fs.writeFileSync(entry, `
export { buildClusterStartPlan } from ${rel('src/game/cluster-start')};
export { generateMap } from ${rel('src/map/generator')};
export { setRiverGenPhaseOverride, setRiverGenEnabledOverride } from ${rel('src/map/riverGenSwitch')};
export { hexDistanceAxial } from ${rel('src/map/gen-helpers')};
`, 'utf8');
  const plugins = [];
  if (coefOverride !== undefined) {
    plugins.push({
      name: 'coef-override',
      setup(b) {
        b.onLoad({ filter: /map-gen-params\.json$/ }, (args) => {
          const j = JSON.parse(fs.readFileSync(args.path, 'utf8'));
          j.generator.capital_sep_short_side_coef.wartosc = coefOverride;
          return { contents: JSON.stringify(j), loader: 'json' };
        });
      },
    });
  }
  await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    loader: { '.ts': 'ts', '.json': 'json' }, outfile: bundle, absWorkingDir: GRA,
    logLevel: 'silent', nodePaths: [path.join(GRA, 'node_modules')], plugins,
  });
  const M = require(bundle);
  return { M, cleanup: () => { try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) { /* ignore */ } } };
}

const civs = JSON.parse(fs.readFileSync(path.join(GRA, 'data/civs.json'), 'utf8'));

function runSeeds(M, seeds) {
  try { M.setRiverGenPhaseOverride('main'); } catch (_) { /* starsze */ }
  try { M.setRiverGenEnabledOverride(false); } catch (_) { /* starsze */ }
  const origWarn = console.warn;
  const origLog = console.log;
  const out = [];
  for (const seed of seeds) {
    console.log = () => {};
    let plan;
    let warns = 0;
    try {
      const map = M.generateMap(168, 120, seed, 'kontynenty', {
        landFraction: 0.3,
        mapSizeMenuLabel: 'Standardowy',
        worldDensity: { rivers: 'medium', forest: 'medium', desert: 'medium', relief: 'medium' },
      });
      console.warn = (...a) => { if (String(a[0]).includes('[clusters]')) warns++; };
      plan = M.buildClusterStartPlan({
        map, civs, seed, playerCivId: 'grecy', rywaleNaKlaster: 6, aktywneTypy: 5, startEpochId: 'kamien',
      });
    } finally { console.warn = origWarn; console.log = origLog; }
    const caps = [{ q: plan.playerStartHex.q, r: plan.playerStartHex.r }];
    for (const fc of plan.foreignTypeClusters) if (fc.positions[0]) caps.push({ q: fc.positions[0].q, r: fc.positions[0].r });
    let min = Infinity;
    for (let i = 0; i < caps.length; i++) for (let j = i + 1; j < caps.length; j++) {
      min = Math.min(min, M.hexDistanceAxial(caps[i].q, caps[i].r, caps[j].q, caps[j].r));
    }
    out.push({ seed, placed: caps.length, requested: plan.placement.requestedTypy, min, sep: plan.placement.capitalMinSep, warns });
  }
  return out;
}

let failed = 0;
function assert(c, m) { if (c) console.log('PASS: ' + m); else { failed++; console.log('FAIL: ' + m); } }

async function main() {
const A = await makeBundle();
const rowsA = runSeeds(A.M, SEEDS);
A.cleanup();
for (const r of rowsA) {
  assert(r.sep === THRESHOLD, `seed ${r.seed}: capitalMinSep=${r.sep} == ${THRESHOLD}`);
  assert(r.min >= THRESHOLD, `seed ${r.seed}: najblizsza para stolic ${r.min} >= ${THRESHOLD}`);
  assert(r.placed === r.requested && r.warns === 0, `seed ${r.seed}: umieszczono ${r.placed}/${r.requested}, ostrzezen ${r.warns}`);
}

// Mutacja: wspolczynnik 0 => stary prog (tabela 15) => test progu MUSI sie zawiesc na >=1 mapie.
const B = await makeBundle(0);
const rowsB = runSeeds(B.M, MUT_SEEDS);
B.cleanup();
const mutViolations = rowsB.filter((r) => r.min < THRESHOLD).length;
assert(mutViolations >= 1, `mutacja (wsp=0): ${mutViolations}/${MUT_SEEDS.length} map lamie prog ${THRESHOLD} (min=${rowsB.map((r) => r.min).join(',')})`);

console.log(`\n${failed === 0 ? 'ALL PASS' : 'FAILED'} (${failed} failed)`);
process.exit(failed > 0 ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
