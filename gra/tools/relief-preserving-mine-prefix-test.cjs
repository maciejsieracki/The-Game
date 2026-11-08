'use strict';
/**
 * relief-preserving-mine-prefix-test.cjs — R-KAMIEN-FUTURE-Q1=C (Maciej 2026-08-06):
 * whitelist reliefu kopalni działa na PREFIKSIE klucza ("kopalnia" / "kopalnia_*"),
 * nie na sztywnej liście — przyszłe typy kopalni (np. "kopalnia_wegla", którego dziś
 * NIE MA w danych gry) mają zachowywać relief wzgórza/góry BEZ zmiany kodu.
 * Testuje realny kod produkcyjny z gra/src/game/relief-preserving-improvements.ts
 * (bundlowany esbuildem — main.ts ma zależności DOM/WebGL, nie nadaje się do Node).
 */
const fs = require('fs');
const path = require('path');
const esbuild = require(path.resolve(__dirname, '..', 'node_modules', 'esbuild'));

const GRA = path.resolve(__dirname, '..');
const ENTRY = path.resolve(__dirname, '.relief-preserving-mine-prefix-entry.ts');
const BUNDLE = path.resolve(__dirname, '.relief-preserving-mine-prefix-bundle.cjs');

fs.writeFileSync(ENTRY, `
export {
  preservesHillReliefKey,
  preservesHillRelief,
} from '../src/game/relief-preserving-improvements';
`, 'utf8');

esbuild.buildSync({
  entryPoints: [ENTRY], bundle: true, platform: 'node', format: 'cjs',
  target: 'node18', outfile: BUNDLE, absWorkingDir: GRA, logLevel: 'silent',
  resolveExtensions: ['.ts', '.js', '.json'],
});

const M = require(BUNDLE);

let pass = 0, fail = 0;
function ok(c, m) { if (c) { pass++; console.log('  PASS:', m); } else { fail++; console.error('  FAIL:', m); } }

// (a) legacy uniwersalna "kopalnia" — na whiteliście
ok(M.preservesHillReliefKey('kopalnia'), '(a) "kopalnia" (legacy) zachowuje relief');

// (b) dzisiejsze kopalnie dedykowane — na whiteliście
ok(M.preservesHillReliefKey('kopalnia_miedzi'), '(b) "kopalnia_miedzi" zachowuje relief');
ok(M.preservesHillReliefKey('kopalnia_zelaza'), '(b) "kopalnia_zelaza" zachowuje relief');
ok(M.preservesHillReliefKey('kopalnia_zlota'), '(b) "kopalnia_zlota" zachowuje relief');

// (c) HIPOTETYCZNA przyszła kopalnia (nie istnieje dziś w gra/data/) — musi przejść
//     predykat BEZ zmiany kodu, bo to jest istota decyzji C-KAMIEN-FUTURE-Q1=C.
ok(M.preservesHillReliefKey('kopalnia_wegla'), '(c) hipotetyczna przyszła "kopalnia_wegla" zachowuje relief (prefiks, bez zmiany kodu)');
ok(M.preservesHillReliefKey('kopalnia_soli'), '(c) hipotetyczna przyszła "kopalnia_soli" zachowuje relief (prefiks, bez zmiany kodu)');

// jawne wyjątki bez prefiksu "kopalnia" — nadal na liście
ok(M.preservesHillReliefKey('kamieniolom'), 'jawny wpis: "kamieniolom" zachowuje relief');
ok(M.preservesHillReliefKey('bydlo'), 'jawny wpis: "bydlo" zachowuje relief');
ok(M.preservesHillReliefKey('owce'), 'jawny wpis: "owce" zachowuje relief');
ok(M.preservesHillReliefKey('lama'), 'jawny wpis: "lama" zachowuje relief');

// (d) kontrprzykłady — PREFIKS, nie substring: dopasowanie wyłącznie na początku klucza
ok(!M.preservesHillReliefKey('niekopalnia'), '(d) "niekopalnia" NIE matchuje — "kopalnia" nie na początku stringa');
ok(!M.preservesHillReliefKey('kopalniany'), '(d) "kopalniany" NIE matchuje — brak podkreślnika po prefiksie, nie jest ani "kopalnia" ani "kopalnia_*"');
ok(!M.preservesHillReliefKey(''), '(d) pusty string NIE matchuje');
ok(!M.preservesHillReliefKey('farma'), '(d) niepowiązany klucz "farma" NIE matchuje');
ok(!M.preservesHillReliefKey('tartak'), '(d) niepowiązany klucz "tartak" NIE matchuje');

// preservesHillRelief (lista warstw) — musi wymagać KAŻDEJ warstwy z whitelisty
ok(M.preservesHillRelief(['kopalnia_wegla']), 'preservesHillRelief: sama przyszła kopalnia_wegla -> true');
ok(M.preservesHillRelief(['kamieniolom', 'kopalnia_miedzi']), 'preservesHillRelief: mix jawnego wpisu + kopalni -> true');
ok(!M.preservesHillRelief(['kopalnia_wegla', 'farma']), 'preservesHillRelief: kopalnia + warstwa spoza whitelisty -> false (every)');
ok(!M.preservesHillRelief([]), 'preservesHillRelief: pusta lista warstw -> false');

// (e) sterowane DANYMI: każdy klucz ulepszenia zawierający "kopalnia" w realnym
//     gra/data/terrain-improvements.json musi przechodzić predykat (dopełnienie litery
//     decyzji C — nie tylko literały w kodzie testu, ale i realne dane gry).
const terrainImprovements = JSON.parse(
  fs.readFileSync(path.resolve(GRA, 'data', 'terrain-improvements.json'), 'utf8')
);
const improvementKeys = Object.keys(terrainImprovements);
const kopalniaKeysInData = improvementKeys.filter(k => k.includes('kopalnia'));
ok(kopalniaKeysInData.length > 0, `(e) terrain-improvements.json zawiera co najmniej jeden klucz "kopalnia*" (znaleziono ${kopalniaKeysInData.length})`);
for (const key of kopalniaKeysInData) {
  ok(M.preservesHillReliefKey(key), `(e) realny klucz danych "${key}" z terrain-improvements.json zachowuje relief`);
}

console.log('\nrelief-preserving-mine-prefix-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail ? 1 : 0);
