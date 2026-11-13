#!/usr/bin/env node
/**
 * diplo-relation-tier-trust-test.cjs — R-WEB-DIPLO-RELATION-TIER-TRUST-LABEL-UNIFY-Q1.
 *
 * Druga etykieta „Relacja: …" (relationTier, 5 stopni: Wojna/Wrogi/Neutralny/Przyjazny/Sojusz)
 * zgadza się z regułą wrogości Nastawienia:
 *   - Wrogi (tier 1) tylko przy Zaufaniu < 10 (RELATION_TIER_PROG_WROGI_ZAUFANIE);
 *   - Zaufanie 10–29 przy score < 60 → Neutralny (tier 2); brak osobnego tieru „Nieufny";
 *   - progi 60 / progSojuszRelacja (130) i pierwszeństwo statusu (wojna → 0, sojusz → 4) bez zmian.
 *
 * Test samo-kontrolny: mutacja progu 10 → 30 (w bundlu, bez zapisu w repo) MUSI dać czerwone
 * asercje. Brak czerwieni = test niewiarygodny → exit 1.
 *
 * Uruchom: node gra/tools/diplo-relation-tier-trust-test.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const SRC = path.resolve(__dirname, '..', 'src');
const ENTRY_CONTENT = `
export {
  relationTier,
  relationTierDisplay,
  RELATION_TIER_PROG_WROGI_ZAUFANIE,
} from './game/diplomacy';
export { NASTAWIENIE_PROG_WROGI_ZAUFANIE } from './game/diplomacy-display';
`;

async function buildModule(mutate) {
  const plugins = mutate
    ? [{
      name: 'mutant-relation-tier-trust',
      setup(build) {
        build.onLoad({ filter: /game\/diplomacy\.ts$/ }, (args) => {
          const src = fs.readFileSync(args.path, 'utf8');
          const next = src.replace(
            'export const RELATION_TIER_PROG_WROGI_ZAUFANIE = 10;',
            'export const RELATION_TIER_PROG_WROGI_ZAUFANIE = 30;',
          );
          if (next === src) return undefined; // inny plik o tej nazwie (np. types/diplomacy.ts)
          return { contents: next, loader: 'ts' };
        });
      },
    }]
    : [];
  const result = await esbuild.build({
    stdin: { contents: ENTRY_CONTENT, resolveDir: SRC, loader: 'ts', sourcefile: 'relation-tier-entry.ts' },
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

function rel(zaufanie, respekt, status = 'neutralni') {
  return { zaufanie, respekt, status };
}

/** Zwraca listę błędnych asercji (pusta = wszystko zgodne). */
function runAssertions(M) {
  const failures = [];
  const check = (cond, label) => { if (!cond) failures.push(label); };

  // Sync progu z etykietą Nastawienia (ta sama wartość, dwa miejsca).
  check(
    M.RELATION_TIER_PROG_WROGI_ZAUFANIE === M.NASTAWIENIE_PROG_WROGI_ZAUFANIE,
    'próg tieru (RELATION_TIER_PROG_WROGI_ZAUFANIE) = próg Nastawienia (NASTAWIENIE_PROG_WROGI_ZAUFANIE)',
  );

  // Zaufanie < 10 → Wrogi, niezależnie od Respektu.
  check(M.relationTier(rel(9, 100)) === 1, 'zaufanie 9 + respekt 100 -> tier 1 (Wrogi)');
  check(M.relationTier(rel(0, 0)) === 1, 'zaufanie 0 + respekt 0 -> tier 1 (Wrogi)');

  // Zaufanie 10 → nie Wrogi (Neutralny przy niskim score).
  check(M.relationTier(rel(10, 0)) === 2, 'zaufanie 10 + respekt 0 -> tier 2 (Neutralny)');
  check(M.relationTier(rel(29, 0)) === 2, 'zaufanie 29 + respekt 0 (score 29 < 60) -> tier 2 (Neutralny)');

  // Zaufanie 25 + respekt 100: score 125 (>= 60, < 130) -> Przyjazny.
  check(M.relationTier(rel(25, 100)) === 3, 'zaufanie 25 + respekt 100 (score 125) -> tier 3 (Przyjazny)');
  // Zaufanie 25 + respekt 10: score 35 (< 60) -> Neutralny.
  check(M.relationTier(rel(25, 10)) === 2, 'zaufanie 25 + respekt 10 (score 35) -> tier 2 (Neutralny)');
  // Granica 60 (zaufanie 30 + respekt 30).
  check(M.relationTier(rel(30, 30)) === 3, 'score 60 dokładnie -> tier 3 (Przyjazny)');
  check(M.relationTier(rel(30, 29)) === 2, 'score 59 -> tier 2 (Neutralny)');

  // Wojna zawsze tier 0, niezależnie od zaufania i score.
  check(M.relationTier(rel(0, 0, 'wojna')) === 0, 'wojna przy zerowym zaufaniu -> tier 0');
  check(M.relationTier(rel(100, 100, 'wojna')) === 0, 'wojna przy wysokim score -> tier 0');

  // Sojusz zawsze tier 4 (surowy tier); wyświetlany tier wymaga traktatu.
  check(M.relationTier(rel(0, 0, 'sojusz')) === 4, 'sojusz przy zerowym score -> tier 4');
  check(M.relationTierDisplay(rel(80, 80), true) === 4, 'sojusz z traktatem -> emblemat tier 4');
  check(M.relationTierDisplay(rel(80, 80), false) === 3, 'score >= 130 bez traktatu -> emblemat tier 3');

  // Zgodność z Nastawieniem: zaufanie < 10 ⇔ tier 1 (poza wojną i sojuszem).
  for (const z of [0, 5, 9, 10, 11]) {
    const nastawWrogi = M.NASTAWIENIE_PROG_WROGI_ZAUFANIE;
    const isWrogi = z < nastawWrogi;
    check(
      (M.relationTier(rel(z, 0)) === 1) === isWrogi,
      `zgodność Wrogi: zaufanie ${z} — tier 1 ⇔ zaufanie < ${nastawWrogi}`,
    );
  }
  return failures;
}

(async () => {
  const live = await buildModule(false);
  const liveFailures = runAssertions(live);
  if (liveFailures.length) {
    console.error('FAIL — asercje na żywym kodzie:');
    for (const f of liveFailures) console.error('  - ' + f);
    process.exit(1);
  }
  console.log('OK — asercje relationTier (Zaufanie < 10 = Wrogi) zielone na żywym kodzie.');

  // Mutacja: próg 10 → 30 MUSI dać czerwień.
  const mutant = await buildModule(true);
  const mutantFailures = runAssertions(mutant);
  if (mutantFailures.length === 0) {
    console.error('FAIL — mutacja progu 10 → 30 nie dała czerwieni; test niewiarygodny.');
    process.exit(1);
  }
  console.log(`OK — mutacja progu 10 → 30 daje czerwone asercje (${mutantFailures.length}).`);
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
