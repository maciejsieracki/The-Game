#!/usr/bin/env node
/**
 * diplo-labels-trust-thresholds-test.cjs — R-WEB-DIPLO-LABELS-TRUST-THRESHOLDS-Q1.
 *
 * Etykiety nastawienia (nastawienieLabelFromScore, gra/src/game/diplomacy-display.ts):
 *   - w wojnie zawsze „Wrogi”;
 *   - Zaufanie < 10 → „Wrogi”; Zaufanie 10–29 → „Nieufny” (niezależnie od Respektu);
 *   - od Zaufania 30: suma Zaufania+Respektu wg progów 45 / 60 / 120
 *     (Nieufny < 45, Neutralny < 60, Życzliwy < 120, Przyjazny ≥ 120).
 *
 * Test samo-kontrolny: zmiana progu zaufania 10 → 30 (mutacja w bundlu, bez zapisu w repo)
 * MUSI dać czerwone asercje. Brak czerwieni = test niewiarygodny → exit 1.
 *
 * Uruchom: node gra/tools/diplo-labels-trust-thresholds-test.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY_CONTENT = `
export {
  nastawienieLabelFromScore,
  NASTAWIENIE_PROG_WROGI_ZAUFANIE,
  NASTAWIENIE_PROG_NIEUFNY_ZAUFANIE,
} from './game/diplomacy-display';
`;

async function buildModule(mutate) {
  const plugins = mutate
    ? [{
      name: 'mutant-trust-threshold',
      setup(build) {
        build.onLoad({ filter: /diplomacy-display\.ts$/ }, (args) => {
          const src = fs.readFileSync(args.path, 'utf8');
          const next = src.replace(
            'export const NASTAWIENIE_PROG_WROGI_ZAUFANIE = 10;',
            'export const NASTAWIENIE_PROG_WROGI_ZAUFANIE = 30;',
          );
          if (next === src) throw new Error('mutacja nie trafiła w stałą progu 10');
          return { contents: next, loader: 'ts' };
        });
      },
    }]
    : [];
  const result = await esbuild.build({
    stdin: { contents: ENTRY_CONTENT, resolveDir: SRC, loader: 'ts', sourcefile: 'labels-entry.ts' },
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    absWorkingDir: SRC,
    logLevel: 'silent',
    plugins,
  });
  const code = result.outputFiles[0].text;
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', code)(mod, mod.exports, require);
  return mod.exports;
}

function runChecks(mod) {
  const failures = [];
  let checks = 0;
  const eq = (got, want, msg) => {
    checks += 1;
    if (got !== want) failures.push(msg + ' → oczekiwano ' + want + ', jest ' + got);
  };
  const L = (z, r, atWar) => mod.nastawienieLabelFromScore(z, r, atWar ? { atWar: true } : undefined);

  // Zaufanie poniżej 10 → Wrogi, nawet przy wysokim Respekcie.
  for (const z of [0, 9]) {
    for (const r of [0, 100]) eq(L(z, r), 'Wrogi', 'zaufanie ' + z + ' resp ' + r);
  }
  eq(L(9, 100), 'Wrogi', 'zaufanie 9 + respekt 100 (wysoka suma, nadal Wrogi)');

  // Zaufanie 10–29 → Nieufny, niezależnie od Respektu.
  eq(L(10, 0), 'Nieufny', 'zaufanie 10 resp 0');
  eq(L(10, 100), 'Nieufny', 'zaufanie 10 resp 100');
  eq(L(25, 100), 'Nieufny', 'zaufanie 25 + respekt 100 (suma 125, nadal Nieufny)');
  eq(L(29, 100), 'Nieufny', 'zaufanie 29 resp 100');
  eq(L(29, 0), 'Nieufny', 'zaufanie 29 resp 0');

  // Od Zaufania 30: progi sumy 45 / 60 / 120.
  eq(L(30, 0), 'Nieufny', 'zaufanie 30 resp 0 (suma 30 < 45)');
  eq(L(30, 14), 'Nieufny', 'suma 44 (granica Nieufny)');
  eq(L(30, 15), 'Neutralny', 'suma 45 (granica Neutralny)');
  eq(L(40, 19), 'Neutralny', 'suma 59');
  eq(L(40, 20), 'Życzliwy', 'suma 60 (granica Życzliwy)');
  eq(L(40, 79), 'Życzliwy', 'suma 119');
  eq(L(40, 80), 'Przyjazny', 'suma 120 (granica Przyjazny)');
  eq(L(30, 100), 'Przyjazny', 'zaufanie 30 resp 100 (suma 130)');

  // Wojna: zawsze Wrogi, niezależnie od liczb.
  eq(L(74, 54, true), 'Wrogi', 'wojna 74/54');
  eq(L(100, 100, true), 'Wrogi', 'wojna 100/100');
  eq(L(0, 0, true), 'Wrogi', 'wojna 0/0');

  return { failures, checks };
}

async function main() {
let exitCode = 0;

const real = runChecks(await buildModule(false));
for (const f of real.failures) console.log('[FAIL]', f);
console.log('checks realnego modułu: ' + real.checks + ', fail: ' + real.failures.length);
if (real.failures.length > 0) exitCode = 1;

const mutant = runChecks(await buildModule(true));
console.log('mutant (próg zaufania 10 → 30): fail ' + mutant.failures.length + ' z ' + mutant.checks);
if (mutant.failures.length === 0) {
  console.log('[FAIL] mutant nie został wykryty — test nie łapie zmiany progu 10');
  exitCode = 1;
} else {
  console.log('MUTANT WYKRYTY (czerwone asercje po zmianie progu)');
}

if (exitCode === 0) console.log('OK: diplo-labels-trust-thresholds-test');
process.exit(exitCode);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
