'use strict';
/**
 * improvements-list-order-test.cjs -- R-WEB-UI-IMPROVEMENTS-LIST-ORDER-BY-TYPE-Q1 (2026-11-17).
 *
 * Kolejność listy ulepszeń terenu (panel budowy + podpowiedź heksa): NAJPIERW dostępne,
 * potem niedostępne; w każdej grupie kolejność kanoniczna po 7 typach (22 pozycje).
 *
 * CZĘŚĆ A (kanon): stała TERRAIN_IMPROVEMENT_CANONICAL_ORDER == 22 id z dyspozycji, bez duplikatów;
 *   każdy klucz terrain-improvements.json (bez _meta, _miasto_zasieg_ref) ma pozycję i odwrotnie.
 * CZĘŚĆ B (komparator): wszystkie dostępne -> dokładnie kanoniczna lista (wejście przetasowane);
 *   część niedostępna -> dostępne na górze, każda grupa w kolejności kanonicznej; klucz spoza listy
 *   na końcu; brak mutacji wejścia; stabilność.
 *
 * Usage (z gra/): ESBUILD_MODULE=<ścieżka do esbuild/lib/main.js> node tools/improvements-list-order-test.cjs
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const esbuild = require(process.env.ESBUILD_MODULE || 'esbuild');

let pass = 0;
let fail = 0;
function check(name, ok, detail) {
  if (ok) { pass++; console.log(`PASS ${name}`); }
  else { fail++; console.log(`FAIL ${name}${detail ? ' -- ' + detail : ''}`); }
}

const EXPECTED = [
  'farma', 'irygacja', 'tarasy', 'lodzie_rybackie',
  'bydlo', 'owce', 'lama', 'stadnina',
  'wyrab', 'tartak', 'oboz_lowiecki',
  'kamieniolom', 'glinianka', 'warzelnia_soli',
  'kopalnia_miedzi', 'kopalnia_cyny', 'kopalnia_zlota', 'kopalnia_zelaza',
  'droga', 'droga_brukowana',
  'posterunek', 'fort',
];

const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'imp-order-'));
const entry = path.join(tmpDir, 'entry.ts');
const modulePath = path.join(GRA, 'src', 'game', 'terrain-improvements.ts').split(path.sep).join('/');
fs.writeFileSync(entry, `export * from '${modulePath}';\n`);
const outFile = path.join(tmpDir, 'bundle.cjs');
esbuild.buildSync({
  entryPoints: [entry],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  outfile: outFile,
  absWorkingDir: GRA,
  logLevel: 'silent',
});
const mod = require(outFile);
const CANON = mod.TERRAIN_IMPROVEMENT_CANONICAL_ORDER;
const sortFn = mod.sortTerrainImprovementsCanonical;

// ---- CZĘŚĆ A ----
check('A1 kanon = 22 id z dyspozycji (dokladnie, w kolejności)',
  JSON.stringify(CANON) === JSON.stringify(EXPECTED),
  `got ${CANON.length}`);
check('A2 kanon bez duplikatów', new Set(CANON).size === CANON.length);

const json = JSON.parse(fs.readFileSync(path.join(GRA, 'data', 'terrain-improvements.json'), 'utf8'));
const jsonKeys = Object.keys(json).filter(k => !k.startsWith('_'));
const jsonSet = new Set(jsonKeys);
const canonSet = new Set(CANON);
const missingInCanon = jsonKeys.filter(k => !canonSet.has(k));
const extraInCanon = CANON.filter(k => !jsonSet.has(k));
check('A3 każdy klucz terrain-improvements.json ma pozycję w kanonie',
  missingInCanon.length === 0, `brak: ${missingInCanon.join(',')}`);
check('A4 każda pozycja kanonu istnieje w terrain-improvements.json',
  extraInCanon.length === 0, `obca: ${extraInCanon.join(',')}`);

// ---- CZĘŚĆ B ----
// deterministyczne tasowanie (LCG), bez Math.random
function shuffled(arr, seed) {
  const a = arr.slice();
  let s = seed >>> 0;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}
const items = CANON.map(k => ({ key: k, locked: false }));
const allAvail = sortFn(shuffled(items, 7), x => x.key, x => x.locked).map(x => x.key);
check('B1 wszystkie dostępne -> dokładnie kanoniczna lista (22)',
  JSON.stringify(allAvail) === JSON.stringify(CANON));

// część niedostępna: co trzecia pozycja zablokowana
const mixed = CANON.map((k, i) => ({ key: k, locked: i % 3 === 0 }));
const mixedOut = sortFn(shuffled(mixed, 42), x => x.key, x => x.locked);
const availPart = mixedOut.filter(x => !x.locked).map(x => x.key);
const lockPart = mixedOut.filter(x => x.locked).map(x => x.key);
const expAvail = mixed.filter(x => !x.locked).map(x => x.key);
const expLock = mixed.filter(x => x.locked).map(x => x.key);
check('B2 dostępne zawsze przed niedostępnymi',
  mixedOut.slice(0, availPart.length).every(x => !x.locked));
check('B3 w grupie dostępnych kolejność kanoniczna',
  JSON.stringify(availPart) === JSON.stringify(expAvail));
check('B4 w grupie niedostępnych kolejność kanoniczna',
  JSON.stringify(lockPart) === JSON.stringify(expLock));

// klucz spoza kanonu -> na koniec, zachowuje względną kolejność wejściową
const withUnknown = [
  { key: 'nieznane_a', locked: false },
  { key: 'fort', locked: false },
  { key: 'nieznane_b', locked: false },
  { key: 'farma', locked: false },
];
const unk = sortFn(withUnknown, x => x.key, x => x.locked).map(x => x.key);
check('B5 nieznany klucz na końcu, kolejność wejściowa między nieznanymi zachowana',
  JSON.stringify(unk) === JSON.stringify(['farma', 'fort', 'nieznane_a', 'nieznane_b']),
  unk.join(','));

// brak mutacji wejścia
const inputCopy = shuffled(items, 9);
const before = JSON.stringify(inputCopy);
sortFn(inputCopy, x => x.key, x => x.locked);
check('B6 wejście nie jest mutowane', JSON.stringify(inputCopy) === before);

// stabilność przy identycznym kluczu (duplikat) -- kolejność wejściowa
const dup = [{ key: 'farma', id: 1 }, { key: 'farma', id: 2 }];
const dupOut = sortFn(dup, x => x.key).map(x => x.id);
check('B7 stabilność dla równych kluczy', JSON.stringify(dupOut) === '[1,2]');

fs.rmSync(tmpDir, { recursive: true, force: true });
console.log(`\nWYNIK: PASS=${pass} FAIL=${fail}`);
process.exit(fail === 0 ? 0 : 1);
