// REPIN-AUTOIMPROVE: wektory `relief-preserving-improvements.ts` (hunki 84-85) z URUCHOMIONEGO weba, pin web main 180c08305.
// Uruchomienie (Node 22; WEB_ROOT = wynik `git archive origin/main gra/src gra/data` poza repo):
//   node --experimental-transform-types --no-warnings --import ./repin-b-loader-register.mjs \
//        ./gen-repin-autoimpr-relief-vectors.mjs <WEB_ROOT> <KATALOG_WYJSCIA>
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, resolve as presolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const webRoot = presolve(process.argv[2]);
const outDir = presolve(process.argv[3]);
mkdirSync(outDir, { recursive: true });
const PIN = '180c08305';
const SRC = 'gra/src/game/relief-preserving-improvements.ts';
const R = await import(pathToFileURL(join(webRoot, SRC)).href);
const { preservesHillReliefKey, preservesHillRelief } = R;

const KEYS = [
  'bydlo', 'owce', 'lama', 'kamieniolom', 'tartak', 'farma', 'wyrab', 'droga', 'glinianka', 'fort',
  'kopalnia', 'kopalnia_', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_cyny', 'kopalnia_zlota',
  'kopalnia_wegla', 'niekopalnia', 'kopalniany', 'Kopalnia_miedzi', 'KOPALNIA', 'kopalnia-miedzi',
  'kopalnia miedzi', ' bydlo', 'bydlo ', 'Bydlo', 'owca', '', 'kamieniolo', 'tartaki', 'stadnina',
  'oboz_lowiecki', 'kopalnia_żółta', 'kopalnia_miedzi',
  // REPIN-AUTOIMPROVE (hunk 85): granice klucza `oboz_lowiecki` (N-1 / N / N+1, wielkosc liter, spacje)
  'oboz_lowieck', 'oboz_lowieckie', 'Oboz_lowiecki', ' oboz_lowiecki', 'oboz_lowiecki ', 'oboz', 'oboz_lowiecki_x',
];
const LAYERS = [
  [], ['bydlo'], ['owce'], ['lama', 'kamieniolom'], ['tartak'], ['farma'], ['farma', 'bydlo'],
  ['kopalnia_miedzi', 'kopalnia_cyny'], ['kopalnia', 'tartak'], ['kopalnia_zlota', 'farma'],
  ['bydlo', 'bydlo'], ['kopalnia'], ['kopalnia_', 'lama'], ['niekopalnia'], [''], ['wyrab', 'droga'],
  // REPIN-AUTOIMPROVE (hunk 85): obóz łowiecki wymaga tartaku na tym samym heksie (warstwy ['tartak','oboz_lowiecki'])
  ['oboz_lowiecki'], ['tartak', 'oboz_lowiecki'], ['oboz_lowiecki', 'tartak'], ['oboz_lowiecki', 'farma'],
  ['farma', 'oboz_lowiecki'], ['oboz_lowiecki', 'oboz_lowiecki'], ['tartak', 'oboz_lowiecki', 'kopalnia_miedzi'],
];

const out = {
  pin: PIN,
  source: SRC,
  keyCases: KEYS.map(k => ({ key: k, expected: preservesHillReliefKey(k) })),
  layerCases: LAYERS.map(l => ({ layers: l, expected: preservesHillRelief(l) })),
};
writeFileSync(join(outDir, 'relief.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`keys=${out.keyCases.length} layers=${out.layerCases.length}`);
