'use strict';
/**
 * era-war-march-before-40-test.cjs -- R-WEB-WAR-MARCH-BEFORE-40-Q1.
 * Uruchamianie z gra/:  node tools/era-war-march-before-40-test.cjs
 *
 * Testuje PRAWDZIWY predykat game/war-rules-multiwar.ts (isWarMarchOpenForPair) dla tur N-1/N/N+1
 * wokół bramki R1 (tura 40) oraz statycznie okablowanie warAllInContextFor w main.ts.
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA_ROOT = path.resolve(__dirname, '..');
const SRC = path.resolve(GRA_ROOT, 'src');
const entry = path.resolve(__dirname, '.era-war-march-before-40-entry.ts');
const bundle = path.resolve(__dirname, '.era-war-march-before-40-bundle.cjs');
const J = (p) => JSON.stringify(path.join(SRC, p));
fs.writeFileSync(entry, `export * from ${J('game/war-rules-multiwar')};\n`, 'utf8');

let passed = 0;
let failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  FAIL:', m); } }
function eq(a, b, m) { assert(a === b, `${m} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`); }

try {
  esbuild.buildSync({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'cjs', target: 'node18',
    outfile: bundle, absWorkingDir: GRA_ROOT, logLevel: 'silent',
  });
  const M = require(bundle);
  const open = (turn, tag) => M.isWarMarchOpenForPair(turn, tag);

  console.log('--- predykat: para w aktywnej wojnie epoki Brazu/Zelaza przed tura 40 ---');
  eq(M.WAR_RULES_PARAMS.delayInterCivWarsUntilTurn, 40, 'P0 parametr R1 = 40');
  // N-1 / N / N+1 dla tury 40
  eq(open(39, 'bronze'), true, 'P1 tura 39 + para w wojnie Brazu -> marsz dozwolony');
  eq(open(40, 'bronze'), true, 'P2 tura 40 + para w wojnie Brazu -> marsz dozwolony');
  eq(open(41, 'bronze'), true, 'P3 tura 41 + para w wojnie Brazu -> marsz dozwolony');
  eq(open(39, 'iron'), true, 'P4 tura 39 + para w wojnie Zelaza -> marsz dozwolony');
  eq(open(20, 'iron'), true, 'P5 tura 20 + para w wojnie Zelaza -> marsz dozwolony (tag, nie tura)');
  eq(open(0, 'bronze'), true, 'P5b tura 0 + para w wojnie Brazu -> marsz dozwolony');

  console.log('--- blokady: wojna Kamienia i zwykla wojna przed tura 40 ---');
  eq(open(39, 'stone'), false, 'B1 tura 39 + wojna Kamienia -> nadal zablokowane');
  eq(open(39, null), false, 'B2 tura 39 + zwykla wojna (brak tagu) -> zablokowane');
  eq(open(39, undefined), false, 'B3 tura 39 + brak tagu (undefined) -> zablokowane');
  eq(open(0, 'stone'), false, 'B4 tura 0 + wojna Kamienia -> zablokowane');

  console.log('--- po R1: zwykly kontekst otwarty niezaleznie od tagu ---');
  eq(open(40, null), true, 'O1 tura 40 + zwykla wojna -> otwarte (R1 spelnione)');
  eq(open(40, 'stone'), true, 'O2 tura 40 + Kamien -> otwarte (R1 spelnione)');
  eq(open(41, null), true, 'O3 tura 41 + zwykla wojna -> otwarte');

  // ---------------------------------------------------------------- statyczne okablowanie main.ts
  const main = fs.readFileSync(path.resolve(SRC, 'main.ts'), 'utf8');
  console.log('--- okablowanie main.ts (statyczne) ---');
  assert(/function activeEraWarTagForPair\(a: number, b: number\): ForcedEraTag \| null \{[\s\S]*?bronzeForceWarActiveByPairKey\.has\(key\)[\s\S]*?ironForceWarActiveByPairKey\.has\(key\)/.test(main),
    'M1 tag pary liczony z map aktywnych par bronze/iron (nie ze stone, nie z tury)');
  assert(/const engage = r1Closed\s*\?\s*\(o: number\) => engageRaw\(o\) && isWarMarchOpenForPair\(turn, activeEraWarTagForPair\(selfOwnerId, o\)\)/.test(main),
    'M2 przed R1 zaangażowanie zawężone do par w aktywnej wojnie epoki');
  assert(/if \(!isWarAllInCapitalEnabled\(\)\) return undefined;/.test(main), 'M3 flaga warAllIn nadal pierwsza bramka');
  assert(/isEraForcedWarIgnoringR1\(/.test(main), 'M4 R1 dla pul wojen epoki bez zmian');
} catch (e) {
  failed++;
  console.error('  ERROR:', e && e.stack || e);
} finally {
  for (const f of [entry, bundle]) { try { fs.unlinkSync(f); } catch (_) { /* brak pliku */ } }
}

console.log(`\nWYNIK: ${passed} OK / ${failed} FAIL`);
process.exit(failed === 0 ? 0 : 1);
