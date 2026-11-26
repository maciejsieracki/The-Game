'use strict';
/**
 * war-weariness-elimination-test.cjs -- R-WEB-WAR-END-CLEANUP-Q1 (L6).
 * Licznik zmęczenia wojną par (warWearinessByPairKey) musi być czyszczony dla par z udziałem
 * wyeliminowanego właściciela, a NIE dla par bez niego.
 *
 *   node tools/war-weariness-elimination-test.cjs                              # GREEN: exit 0
 *   AI_SRC_DIR=<kopia src z usuniętym wywołaniem> node tools/war-weariness-elimination-test.cjs  # RED (mutacja)
 */
const fs = require('fs');
const path = require('path');

const GRA_ROOT = path.resolve(__dirname, '..');
const esbuild = require(path.resolve(GRA_ROOT, 'node_modules', 'esbuild'));
const SRC = process.env.AI_SRC_DIR ? path.resolve(process.env.AI_SRC_DIR) : path.resolve(GRA_ROOT, 'src');
const J = (p) => JSON.stringify(path.join(SRC, p));
const ENTRY = path.resolve(__dirname, `.wwelim-${process.pid}-entry.ts`);
const BUNDLE = path.resolve(__dirname, `.wwelim-${process.pid}-bundle.cjs`);

let fails = 0;
let passes = 0;
function check(cond, label) {
  if (cond) { passes++; console.log('  ok   ' + label); }
  else { fails++; console.log('  FAIL ' + label); }
}

// 1. Okablowanie: eliminateOwner (main.ts) MUSI czyścić warWearinessByPairKey dla wyeliminowanego właściciela.
const mainSrc = fs.readFileSync(path.join(SRC, 'main.ts'), 'utf8');
const elimStart = mainSrc.indexOf('function eliminateOwner(ownerId: number): void {');
const elimEnd = elimStart >= 0 ? mainSrc.indexOf('\n    function ', elimStart + 10) : -1;
const elimBody = elimStart >= 0 && elimEnd > elimStart ? mainSrc.slice(elimStart, elimEnd) : '';
console.log('1. eliminateOwner czyści warWearinessByPairKey (okablowanie main.ts)');
check(elimBody.length > 0, 'znaleziono ciało eliminateOwner');
check(/pruneWarWearinessPairs\(\s*warWearinessByPairKey\s*,\s*key\s*=>\s*diploPairKeyHasOwner\(key,\s*ownerId\)\s*\)/.test(elimBody),
  'eliminateOwner wywołuje pruneWarWearinessPairs(warWearinessByPairKey, key => diploPairKeyHasOwner(key, ownerId))');

// 2. Zachowanie czystej funkcji na prawdziwym module (esbuild bundle z gra/src).
fs.writeFileSync(ENTRY, [
  `export { pruneWarWearinessPairs, stepPairState } from ${J('game/war-weariness')};`,
  `export { diploPairKey } from ${J('game/diplomacy-pn-engine')};`,
].join('\n'), 'utf8');
let M = null;
try {
  esbuild.buildSync({
    entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs', target: 'node18', outfile: BUNDLE,
    absWorkingDir: GRA_ROOT, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'],
  });
  M = require(BUNDLE);
} finally {
  try { fs.unlinkSync(ENTRY); } catch (e) { /* ignore */ }
  try { fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }
}

// Ta sama logika klucza co diploPairKeyHasOwner w main.ts.
const keyHasOwner = (ownerId) => (key) => {
  const parts = key.split('_');
  return parts.length === 2 && (Number(parts[0]) === ownerId || Number(parts[1]) === ownerId);
};

console.log('2. pruneWarWearinessPairs: usuwa tylko pary z wyeliminowanym właścicielem');
const store = new Map();
M.stepPairState(store, M.diploPairKey(3, 5), 100, 40);
M.stepPairState(store, M.diploPairKey(5, 7), 100, 60);
M.stepPairState(store, M.diploPairKey(1, 2), 90, 25);
M.stepPairState(store, M.diploPairKey(0, 4), 80, 10);
const removed = M.pruneWarWearinessPairs(store, keyHasOwner(5));
check(removed === 2, `usunięto dokładnie 2 pary z właścicielem 5 (wynik ${removed})`);
check(!store.has(M.diploPairKey(3, 5)), 'para 3-5 (wyeliminowany jako druga strona) usunięta');
check(!store.has(M.diploPairKey(5, 7)), 'para 5-7 (wyeliminowany jako pierwsza strona) usunięta');
check(store.has(M.diploPairKey(1, 2)), 'para 1-2 bez wyeliminowanego zostaje');
check(store.has(M.diploPairKey(0, 4)), 'para 0-4 bez wyeliminowanego zostaje');
check(store.size === 2, `w sklepie zostały 2 wpisy (jest ${store.size})`);

console.log('3. brak pary z właścicielem: nic nie usuwane');
const removed0 = M.pruneWarWearinessPairs(store, keyHasOwner(9));
check(removed0 === 0 && store.size === 2, 'właściciel bez par: 0 usunięć, rozmiar bez zmian');

console.log('4. ponowne wywołanie (idempotencja)');
const removed2 = M.pruneWarWearinessPairs(store, keyHasOwner(5));
check(removed2 === 0, 'drugie czyszczenie tego samego właściciela: 0');

console.log(`\nWynik: ${passes} ok / ${fails} FAIL`);
process.exit(fails === 0 ? 0 : 1);
