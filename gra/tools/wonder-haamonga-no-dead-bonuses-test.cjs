'use strict';
/**
 * node tools/wonder-haamonga-no-dead-bonuses-test.cjs — R-WEB-WONDER-HAAMONGA-REMOVE-DEAD-BONUSES-Q1
 * (decyzja A właściciela): z Kamienia Ha'amonga wycięte martwe wpisy bonusy.teren
 * "lowie_rybackie" (id nie istnieje) i "laka" (silnik nie nalicza, warunek
 * hex_sasiad_plytkie_morze nieobsłużony). Nie implementujemy naliczania.
 *
 * Sprawdza (czysty Node, bez esbuild; czyta dane i źródła wprost):
 *   1. wonders.json: cud "hamonga" nie ma bonusy.teren z typTerenu lowie_rybackie/laka.
 *   2. wonders.json: żaden wpis bonusy.teren w całym pliku nie ma typTerenu "lowie_rybackie"
 *      (id nie istnieje w grze).
 *   3. Pozostałe bonusy Ha'amonga bez zmian: miasto {kultura:3, zywnosc:3},
 *      specjalne = handel_procent 0.15 (cel handel_morski) + dyplomacja_wpływ 3.
 *   4. Brak martwych kluczy/tekstów w kodzie i danych: gra/src/game/wonders-data.ts,
 *      gra/src/ui/entityCards/wonderAdapter.ts, gra/src/data/wikiBundle.json,
 *      docs/encyklopedia/cuda/hamonga.md, docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md
 *      nie zawierają "lowie_rybackie" ani obietnicy łąki/rybołówstwa dla Ha'amonga.
 *   5. Pozostałe cuda z bonusy.teren nadal mają swoje wpisy (regresja: nie wycięto za dużo).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const GRA = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}
function eq(a, b, msg) {
  assert(JSON.stringify(a) === JSON.stringify(b), `${msg} (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

const wondersPath = path.join(GRA, 'data', 'wonders.json');
const data = JSON.parse(fs.readFileSync(wondersPath, 'utf8'));
const cuda = Array.isArray(data.cuda) ? data.cuda : [];
const hamonga = cuda.find(w => w.id === 'hamonga');

assert(!!hamonga, 'sanity: cud hamonga obecny w wonders.json');
const DEAD_TYPES = ['lowie_rybackie', 'laka'];

// 1. Ha'amonga bez martwych wpisów teren
const hamTeren = (hamonga && hamonga.bonusy && hamonga.bonusy.teren) || [];
const hamDead = hamTeren.filter(t => DEAD_TYPES.includes(t.typTerenu));
eq(hamDead.length, 0, '1: Ha\'amonga nie ma bonusy.teren z lowie_rybackie/laka');
eq(hamonga && hamonga.bonusy && hamonga.bonusy.teren, undefined, '1b: klucz bonusy.teren usuniety (oba wpisy byly martwe)');

// 2. Brak lowie_rybackie w całym pliku (id nie istnieje)
const allTerenTypes = [];
for (const w of cuda) {
  for (const t of (w.bonusy && w.bonusy.teren) || []) allTerenTypes.push({ cud: w.id, typ: t.typTerenu });
}
const lowie = allTerenTypes.filter(x => x.typ === 'lowie_rybackie');
eq(lowie.length, 0, '2: brak typTerenu "lowie_rybackie" w bonusy.teren żadnego cudu');

// 3. Pozostałe bonusy Ha'amonga bez zmian
eq(hamonga && hamonga.bonusy && hamonga.bonusy.miasto, { kultura: 3, zywnosc: 3 }, '3a: bonusy.miasto Ha\'amonga bez zmian');
const spec = (hamonga && hamonga.bonusy && hamonga.bonusy.specjalne) || [];
eq(spec.length, 2, '3b: Ha\'amonga ma 2 bonusy.specjalne');
const handel = spec.find(s => s.typ === 'handel_procent');
eq(handel && [handel.cel, handel.wartosc], ['handel_morski', 0.15], '3c: handel_procent 0.15 cel handel_morski bez zmian');
const dypl = spec.find(s => s.typ === 'dyplomacja_wpływ');
eq(dypl && dypl.wartosc, 3, '3d: dyplomacja_wpływ 3 bez zmian');

// 4. Brak martwych kluczy/tekstów w kodzie i danych
const TEXT_FILES = [
  'gra/src/game/wonders-data.ts',
  'gra/src/ui/entityCards/wonderAdapter.ts',
  'gra/src/data/wikiBundle.json',
  'docs/encyklopedia/cuda/hamonga.md',
  'docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md',
];
for (const rel of TEXT_FILES) {
  const abs = path.join(ROOT, rel);
  const txt = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : '';
  eq(txt.includes('lowie_rybackie'), false, `4a: ${rel} nie zawiera "lowie_rybackie"`);
}
// Wpis Ha'amonga w katalogu nie obiecuje terenu (łąka/rybołówstwo)
const katalog = fs.readFileSync(path.join(ROOT, 'docs/PORADNIK-GRACZA/91-katalog-cudow-antyk.md'), 'utf8');
const hamLine = katalog.split('\n').find(l => l.startsWith('| Kamień Ha\'amonga'));
eq(!!hamLine && !/łąk|rybo|lowie/i.test(hamLine), true, '4b: wiersz Ha\'amonga w katalogu nie obiecuje łąki/rybołówstwa');

// 5. Regresja: inne cuda z bonusy.teren zachowane
const withTeren = cuda.filter(w => w.bonusy && Array.isArray(w.bonusy.teren) && w.bonusy.teren.length > 0).map(w => w.id);
assert(withTeren.length > 0, `5: inne cuda nadal mają bonusy.teren (${withTeren.join(', ')})`);
assert(withTeren.includes('petra'), '5b: Petra nadal ma bonusy.teren');

console.log(`\n${passed} PASS, ${failed} FAIL`);
process.exit(failed ? 1 : 0);
