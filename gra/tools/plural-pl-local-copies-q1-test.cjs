'use strict';
/**
 * plural-pl-local-copies-q1-test.cjs -- R-WEB-PL-PLURAL-LOCAL-COPIES-Q1
 * Run: cd gra && node tools/plural-pl-local-copies-q1-test.cjs
 *
 * Kontekst: lokalne kopie reguly odmiany „n>=2 && n<=4" bez wylaczenia 12-14 / 22-24
 * (np. turnsPl w game/diplomacy-penalty-preview.ts: 22 -> „22 tur"). Naprawa: kopie
 * wywoluja wspolny pluralPl z ui/formatPl.ts (modul bez importow, brak cykli).
 *
 * Sprawdza:
 *   1. pluralPl -- tabela 0,1,2,4,5,11,12,14,15,21,22,24,25,101,102,111,112,122.
 *   2. Naprawione kopie (turnsPl, cyclicExchangeFrequencyLabel, blockingCountPhrase)
 *      daja te same formy co tabela.
 *   3. Kopie w empireDetailPanel.ts (trasy, Magazyny) nie zawieraja juz starej reguly.
 */

const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.join(__dirname, '.plural-pl-q1-entry.ts');
const BUNDLE = path.join(__dirname, '.plural-pl-q1-bundle.cjs');

// Oczekiwane formy (mianownik / rzeczownik „tura") wg polskiej reguly:
// 1 -> 1. forma; konczace sie na 2-4 (poza 12-14) -> 2. forma; reszta -> 3. forma.
const TABLE = [
  [0, 'tur'], [1, 'tura'], [2, 'tury'], [4, 'tury'], [5, 'tur'], [11, 'tur'], [12, 'tur'],
  [14, 'tur'], [15, 'tur'], [21, 'tur'], [22, 'tury'], [24, 'tury'], [25, 'tur'],
  [101, 'tur'], [102, 'tury'], [111, 'tur'], [112, 'tur'], [122, 'tury'],
];

let passed = 0;
let failed = 0;
function eq(got, want, msg) {
  if (got === want) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg, `(got=${JSON.stringify(got)} want=${JSON.stringify(want)})`); }
}

function runChecks(M) {
  console.log('plural-pl-local-copies-q1-test (R-WEB-PL-PLURAL-LOCAL-COPIES-Q1)\n');

  // --- 1. pluralPl (wspolny helper) ---------------------------------------------------------
  for (const [n, want] of TABLE) {
    eq(M.pluralPl(n, 'tura', 'tury', 'tur'), want, `pluralPl(${n}) -> ${want}`);
  }

  // --- 2. Naprawione kopie -------------------------------------------------------------------
  for (const [n, form] of TABLE) {
    eq(M.turnsPl(n), `${n} ${form}`, `turnsPl(${n}) -> "${n} ${form}"`);
  }
  for (const [n, form] of TABLE) {
    // pozostalo N tur: wygasaTura = turn + N, turn = 10
    eq(
      M.cyclicExchangeFrequencyLabel(10 + n, 10),
      `co turę, pozostało ${n} ${form}`,
      `cyclicExchangeFrequencyLabel(left=${n}) -> „pozostało ${n} ${form}"`,
    );
  }
  for (const [n, form] of TABLE) {
    // blockingCountPhrase: karta / karty / kart; czasownik „wymaga" tylko dla 1
    const noun = form === 'tura' ? 'karta' : form === 'tury' ? 'karty' : 'kart';
    const verb = n === 1 ? 'wymaga' : 'wymagają';
    eq(M.blockingCountPhrase(n), `${n} ${noun} ${verb} decyzji.`, `blockingCountPhrase(${n}) -> „${n} ${noun} ${verb} decyzji."`);
  }

  // --- 3. Kopie w empireDetailPanel.ts: stara regula usunieta, helper uzyty ------------------
  const edp = fs.readFileSync(path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts'), 'utf8');
  eq(!/brakBudynku\s*>=\s*2\s*&&\s*brakBudynku\s*<=\s*4/.test(edp), true, 'empireDetailPanel: brak starej reguly „trasy" (brakBudynku)');
  eq(!/magazyny\s*>=\s*2\s*&&\s*magazyny\s*<=\s*4/.test(edp), true, 'empireDetailPanel: brak starej reguly „Magazyny"');
  eq(/pluralPl\(brakBudynku,/.test(edp), true, 'empireDetailPanel: „trasy" liczone przez pluralPl');
  eq(/pluralPl\(magazyny,/.test(edp), true, 'empireDetailPanel: „Magazyny" liczone przez pluralPl');

  console.log(`\n${passed} passed, ${failed} failed`);
}

async function main() {
  fs.writeFileSync(ENTRY, `
export { pluralPl } from '../src/ui/formatPl';
export { turnsPl } from '../src/game/diplomacy-penalty-preview';
export { cyclicExchangeFrequencyLabel } from '../src/game/diplomacy-cyclic-display';
export { blockingCountPhrase } from '../src/ui/bottomBarHud';
`, 'utf8');

  try {
    await esbuild.build({
      entryPoints: [ENTRY],
      bundle: true,
      platform: 'node',
      format: 'cjs',
      target: 'node18',
      outfile: BUNDLE,
      absWorkingDir: GRA,
      logLevel: 'silent',
      resolveExtensions: ['.ts', '.js', '.json'],
      plugins: [{
        // brandAssets importuje SVG przez Vite „?raw" (niedostepne w esbuild) — stub; testowana
        // jest tu tylko logika odmiany, nie ikony.
        name: 'stub-brand-assets',
        setup(build) {
          build.onResolve({ filter: /icons\/brandAssets$/ }, args => ({ path: args.path, namespace: 'brand-stub' }));
          build.onLoad({ filter: /.*/, namespace: 'brand-stub' }, () => ({
            contents: 'export const brandIconSvg = () => ""; export const civIconSvg = () => "";',
            loader: 'js',
          }));
        },
      }],
    });
  } catch (e) {
    console.error('[plural-pl-local-copies-q1-test] bundle failed:', e.message || e);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(ENTRY); } catch (_) { /* ignore */ }
  }

  const M = require(BUNDLE);
  runChecks(M);
  try { fs.unlinkSync(BUNDLE); } catch (_) { /* ignore */ }
  process.exit(failed === 0 ? 0 : 1);
}

main();
