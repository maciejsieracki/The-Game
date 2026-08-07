'use strict';
/**
 * alliance-war-obligation-test.cjs — heurystyka N4: odmowa obowiązku wojny sojuszniczej (C-WIAR-N4-AI=B).
 * Run from gra/:  node tools/alliance-war-obligation-test.cjs
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const ENTRY = path.resolve(__dirname, '.alliance-war-obligation-entry.ts');
const BUNDLE = path.resolve(__dirname, '.alliance-war-obligation-bundle.cjs');

fs.writeFileSync(
  ENTRY,
  `export { shouldHonorAllianceWarObligation } from '../src/game/alliance-war-obligation';
export { aiHonorsAllianceWarObligation } from '../src/game/ai';`,
  'utf8',
);

esbuild.buildSync({
  entryPoints: [ENTRY],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: BUNDLE,
  absWorkingDir: path.resolve(__dirname, '..'),
  logLevel: 'silent',
});

const {
  shouldHonorAllianceWarObligation,
  aiHonorsAllianceWarObligation,
} = require(BUNDLE);

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('  OK:', msg); }
  else { failed++; console.error('  FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(a === b, `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

function baseInp(overrides = {}) {
  return {
    allyId: 3,
    mustDeclareWarOn: 2,
    attackerId: 1,
    victimId: 4,
    militaryRatio: 1.0,
    activeWarCount: 0,
    peacefulArchetype: false,
    ...overrides,
  };
}

// 1. Gracz zawsze honoruje (nawet osłabiony)
console.log('\n--- 1: gracz (allyId=0) zawsze honoruje ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    allyId: 0,
    militaryRatio: 0.2,
    activeWarCount: 5,
    peacefulArchetype: true,
  })),
  true,
  'gracz honoruje mimo słabej pozycji',
);
eq(
  aiHonorsAllianceWarObligation(0, 2, 1, 4, {
    militaryRatio: 0.2,
    activeWarCount: 5,
    peacefulArchetype: true,
  }),
  true,
  'aiHonors: gracz honoruje',
);

// 2. Słabe AI odmawia (ratio 0.4)
console.log('\n--- 2: słabe AI odmawia (ratio 0.4) ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({ militaryRatio: 0.4 })),
  false,
  'ratio 0.4 < 0.55 → odmowa',
);

// 3. Silne AI honoruje (ratio 1.2)
console.log('\n--- 3: silne AI honoruje (ratio 1.2) ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({ militaryRatio: 1.2 })),
  true,
  'ratio 1.2 → honor',
);

// 4. Pokojowy odmawia przy 0.7
console.log('\n--- 4: archetyp pokojowy odmawia przy ratio 0.7 ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    peacefulArchetype: true,
    militaryRatio: 0.7,
  })),
  false,
  'pokojowy 0.7 < 0.75 → odmowa',
);

// 5. Pokojowy honoruje przy 0.9
console.log('\n--- 5: archetyp pokojowy honoruje przy ratio 0.9 ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    peacefulArchetype: true,
    militaryRatio: 0.9,
  })),
  true,
  'pokojowy 0.9 ≥ 0.75 → honor',
);

// 6. activeWarCount=1 → odmowa (już w wojnie)
console.log('\n--- 6: activeWarCount=1 odmawia ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    activeWarCount: 1,
    militaryRatio: 1.5,
  })),
  false,
  'już w wojnie → odmowa',
);

// 7. Granica: activeWarCount=0, ratio dokładnie minRatio → honor
console.log('\n--- 7: granica minRatio (0.55) → honor ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    activeWarCount: 0,
    militaryRatio: 0.55,
  })),
  true,
  'ratio == 0.55 (nie <) → honor',
);
eq(
  shouldHonorAllianceWarObligation(baseInp({
    activeWarCount: 0,
    militaryRatio: 0.549,
  })),
  false,
  'ratio 0.549 < 0.55 → odmowa',
);

// 8. Niskie Zaufanie do proszącego sojusznika → odmowa
console.log('\n--- 8: niskie Zaufanie do proszącego sojusznika ---');
eq(
  shouldHonorAllianceWarObligation(baseInp({
    militaryRatio: 1.2,
    activeWarCount: 0,
    trustToRequestingAlly: 15,
    minTrustHonor: 20,
  })),
  false,
  'zaufanie 15 < 20 → odmowa mimo silnej armii',
);
eq(
  shouldHonorAllianceWarObligation(baseInp({
    militaryRatio: 1.2,
    activeWarCount: 0,
    trustToRequestingAlly: 20,
    minTrustHonor: 20,
  })),
  true,
  'zaufanie 20 (nie <) → honor',
);

// 9. Scenariusze allyId=3 przez wrapper aiHonors
console.log('\n--- 9: aiHonorsAllianceWarObligation (allyId=3) ---');
eq(
  aiHonorsAllianceWarObligation(3, 2, 1, 4),
  true,
  'bez ctx → true (kompatybilność wsteczna)',
);
eq(
  aiHonorsAllianceWarObligation(3, 2, 1, 4, {
    militaryRatio: 0.4,
    activeWarCount: 0,
    peacefulArchetype: false,
  }),
  false,
  'aiHonors: słabe AI odmawia',
);
eq(
  aiHonorsAllianceWarObligation(3, 2, 1, 4, {
    militaryRatio: 1.2,
    activeWarCount: 0,
    peacefulArchetype: false,
  }),
  true,
  'aiHonors: silne AI honoruje',
);

console.log('\n========================================');
console.log(`alliance-war-obligation-test: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
