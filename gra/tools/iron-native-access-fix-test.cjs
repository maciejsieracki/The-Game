'use strict';
/**
 * iron-native-access-fix-test.cjs -- R-WEB-IRON-NATIVE-ACCESS-FIX-Q1.
 * Run from gra/:  node tools/iron-native-access-fix-test.cjs
 *
 * Bug: main.ts (ownerHasNativeResourceAccess 'zelazo' + diplomacyActiveResourceLabelsForOwner)
 * wolalo hasZelazoAccess(hasKopalniaZelazo:boolean, builtIds) -- boolean w miejscu
 * `empireStock`, wiec stock=undefined i natywny dostep do zelaza byl ZAWSZE false.
 * Fix: wspolna czysta funkcja ownerHasNativeZelazoAccess(hasKopalnia, empireStock, cityBuiltIds[]).
 * Test uzywa PRAWDZIWYCH funkcji (esbuild bundle zelazo-access.ts) + straznik zrodla main.ts.
 */
const fs = require('fs');
const path = require('path');
const esbuild = (() => {
  try { return require(path.resolve(__dirname, '..', 'node_modules', 'esbuild')); }
  catch (e) { console.error('esbuild not found. Run npm ci --ignore-scripts (gra/)'); process.exit(1); }
})();

const ENTRY = path.resolve(__dirname, '.iron-native-access-fix-entry.ts');
const BUNDLE = path.resolve(__dirname, '.iron-native-access-fix-bundle.cjs');
fs.writeFileSync(ENTRY, "export * from '../src/game/zelazo-access';\n", 'utf8');
try {
  esbuild.buildSync({ entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
    target: 'node18', outfile: BUNDLE, logLevel: 'silent', resolveExtensions: ['.ts', '.js', '.json'] });
} catch (e) { console.error('bundling failed:', e.message || e); process.exit(1); }
const M = require(BUNDLE);
try { fs.unlinkSync(ENTRY); fs.unlinkSync(BUNDLE); } catch (e) { /* ignore */ }

let passed = 0, failed = 0;
function assert(c, msg) { if (c) { passed++; console.log('  [OK] ' + msg); } else { failed++; console.log('  [FAIL] ' + msg); } }

const { hasZelazoAccess, ownerHasNativeZelazoAccess } = M;
const ODL = ['odlewnia_zelaza'];
const NONE = ['spichlerz'];

console.log('\n1. ownerHasNativeZelazoAccess (wspolna sciezka gracz/AI)');
assert(typeof ownerHasNativeZelazoAccess === 'function', 'funkcja wyeksportowana z zelazo-access.ts');
if (typeof ownerHasNativeZelazoAccess === 'function') {
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 3 }, [ODL]) === true, 'kopalnia + zapas + odlewnia -> true');
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 3 }, [NONE, ODL]) === true, 'odlewnia w drugim miescie -> true');
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 3 }, [['wielka_odlewnia']]) === true, 'wielka_odlewnia -> true');
  assert(ownerHasNativeZelazoAccess(false, { zelazo: 3 }, [ODL]) === false, 'brak kopalni na zlozu -> false');
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 0 }, [ODL]) === false, 'zapas 0 -> false');
  assert(ownerHasNativeZelazoAccess(true, {}, [ODL]) === false, 'pusty zapas -> false');
  assert(ownerHasNativeZelazoAccess(true, undefined, [ODL]) === false, 'brak zapasu (undefined) -> false (fail-closed)');
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 3 }, [NONE]) === false, 'brak odlewni -> false');
  assert(ownerHasNativeZelazoAccess(true, { zelazo: 3 }, []) === false, 'brak miast -> false');
  assert(ownerHasNativeZelazoAccess(true, { ruda_zelaza: 9 }, [ODL]) === false, 'ruda_zelaza to nie zelazo -> false (konwencja stock.zelazo)');
}

console.log('\n2. Stary bug zakodowany jako dowod (boolean w miejscu empireStock -> zawsze false)');
assert(hasZelazoAccess(true, ODL) === false, 'hasZelazoAccess(true, odlewnia) === false (stara sklejka main.ts)');
assert(hasZelazoAccess({ zelazo: 1 }, ODL) === true, 'hasZelazoAccess({zelazo:1}, odlewnia) === true (poprawne wywolanie)');

console.log('\n3. Straznik zrodla main.ts (obie sklejki na wspolnej sciezce; ta sama sciezka dla gracza i AI)');
const main = fs.readFileSync(path.resolve(__dirname, '..', 'src', 'main.ts'), 'utf8');
assert(!/hasZelazoAccess\s*\(\s*hasKopalniaZelazo/.test(main), 'main.ts nie wola hasZelazoAccess(hasKopalniaZelazo, ...)');
assert(!/import\s*\{[^}]*\bhasZelazoAccess\b[^}]*\}\s*from\s*'\.\/game\/zelazo-access'/.test(main), 'main.ts nie importuje juz hasZelazoAccess');
const calls = main.match(/ownerHasNativeZelazoAccess\([^;]{0,200}?citySurowceSumForOwner\(ownerId\)/g) || [];
assert(calls.length === 2, 'main.ts: 2 wywolania ownerHasNativeZelazoAccess(.., citySurowceSumForOwner(ownerId), ..) (znaleziono ' + calls.length + ')');

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
