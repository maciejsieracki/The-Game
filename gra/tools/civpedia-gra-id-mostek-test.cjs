'use strict';
/**
 * civpedia-gra-id-mostek-test.cjs -- standalone Node test dla mostka gra-id
 * (T9, R-FEATURE-KARTY-ENCYKLOPEDIA-CIVPEDIA-Q1).
 * Run:  node gra/tools/civpedia-gra-id-mostek-test.cjs
 *
 * Sprawdza:
 *   1) EncyEntry.gameIds jest poprawnie sparsowane z frontmattera "| gra-id | ... |"
 *      (bundle-wiki-for-game.cjs) dla kopalnia.md (4 warianty kopalni, wiele-do-jednego)
 *      i wojownik-celtycki.md (Soldurii, zmiana nazwy jednostki).
 *   2) Lookup ENCY.find(e => e.folder===folder && e.gameIds.includes(id)) z fallbackiem
 *      na e.slug===id trafia do WŁAŚCIWEGO JEDNEGO wpisu dla każdego z 4 kluczy
 *      kopalnia_miedzi/zelaza/cyny/zlota z terrain-improvements.json -- i że żaden
 *      z nich nie trafia przypadkiem do innego hasła ulepszeń.
 *   3) Fallback slug===id nadal działa dla haseł bez gra-id (większość budynków/
 *      ulepszeń, np. "farma").
 *   4) Regresja: dokładnie te klucze terrain-improvements.json, które NIE mają
 *      własnego pliku .md ani nie są pokryte przez gra-id (stadnina, droga_brukowana),
 *      pozostają bez trafienia -- to jest luka treści (T7), nie błąd mostka; test
 *      pilnuje, żeby liczba "sierot" się nie zmieniła bez świadomej decyzji.
 *   5) Technologie: potwierdzenie programowe, że techToSlug (slugify z
 *      sciencePicker.ts, underscore, NFD-strip) daje slug identyczny z nazwą pliku
 *      dla WSZYSTKICH 32 wpisów tech.json <-> docs/encyklopedia/technologie/*.md --
 *      czyli prosty fallback slug===id wystarcza, gra-id dla technologii NIE jest
 *      potrzebne (i celowo nie zostało dodane).
 *   6) Jednostki: potwierdzenie programowe, że dokładnie JEDEN plik
 *      (wojownik-celtycki.md / Soldurii) wymagał mostka gra-id -- wszystkie inne
 *      rozbieżności slug jednostki <-> nazwa pliku to brakujące hasła (plik nie
 *      istnieje wcale), nie rozjazd nazewnictwa do naprawienia gra-id.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.resolve(__dirname, '..', '..');
const BUNDLE_PATH = path.join(ROOT, 'gra', 'src', 'data', 'wikiBundle.json');
const TERRAIN_JSON = path.join(ROOT, 'gra', 'data', 'terrain-improvements.json');
const TECH_JSON = path.join(ROOT, 'gra', 'data', 'tech.json');
const UNITS_JSON = path.join(ROOT, 'gra', 'data', 'units.json');
const JEDNOSTKI_DIR = path.join(ROOT, 'docs', 'encyklopedia', 'jednostki');
const TECHNOLOGIE_DIR = path.join(ROOT, 'docs', 'encyklopedia', 'technologie');

let failures = 0;
function check(label, cond) {
  if (cond) {
    console.log(`  OK  ${label}`);
  } else {
    failures++;
    console.log(`FAIL  ${label}`);
  }
}

// ---------------------------------------------------------------------------
// Wspólny resolver -- dokładnie ten sam kontrakt co openEncyEntry/findEncyByGameId
// w gra/src/ui/wikiHubHud.ts (celowo zduplikowany tu jako czarna skrzynka na
// SUROWYM wikiBundle.json, żeby test nie zależał od kompilacji TS).
function findEncyByGameId(ency, folder, id) {
  return ency.find(e => e.folder === folder && e.gameIds.includes(id))
    ?? ency.find(e => e.folder === folder && e.slug === id);
}

// Ta sama funkcja slugify co gra/src/ui/sciencePicker.ts (techToSlug), NFD-strip,
// separator "_". ł/Ł NIE dekomponuje się przez NFD (nie jest znakiem złożonym) --
// zostaje odfiltrowane przez [^a-z0-9]+ tak samo jak w silniku; sprawdzane niżej
// programowo względem realnych nazw plików, nie zakładane.
function slugifyUnderscore(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function slugifyKebab(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

console.log('=== T9 civpedia-gra-id-mostek-test ===\n');

// 1+2) kopalnia.md gameIds + lookup
{
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const ency = bundle.encyklopedia;

  const kopalnia = ency.find(e => e.folder === 'ulepszenia' && e.slug === 'kopalnia');
  check('kopalnia.md istnieje w bundle', !!kopalnia);
  check(
    'kopalnia.md.gameIds == 4 warianty kopalni',
    JSON.stringify([...kopalnia.gameIds].sort()) ===
      JSON.stringify(['kopalnia_cyny', 'kopalnia_miedzi', 'kopalnia_zelaza', 'kopalnia_zlota'].sort()),
  );

  const terrain = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));
  const mineKeys = Object.keys(terrain).filter(k => k.startsWith('kopalnia_'));
  check('terrain-improvements.json ma dokładnie 4 warianty kopalni', mineKeys.length === 4);

  for (const key of mineKeys) {
    const hit = findEncyByGameId(ency, 'ulepszenia', key);
    check(`lookup('ulepszenia', '${key}') -> kopalnia.md (JEDEN wpis)`, hit && hit.slug === 'kopalnia');
  }

  // Żaden inny wariant kopalni nie powinien przypadkiem trafiać gdzie indziej,
  // i żadne INNE hasło ulepszeń nie powinno mieć w gameIds klucza kopalni (kolizja).
  const ulepszeniaEntries = ency.filter(e => e.folder === 'ulepszenia');
  const collisions = ulepszeniaEntries.filter(e => e.slug !== 'kopalnia' && mineKeys.some(k => e.gameIds.includes(k)));
  check('żadne inne hasło "ulepszenia" nie deklaruje kluczy kopalni w gra-id', collisions.length === 0);
}

// 3) fallback slug===id dla haseł bez gra-id
{
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const ency = bundle.encyklopedia;
  const farma = findEncyByGameId(ency, 'ulepszenia', 'farma');
  check('lookup fallback slug===id: "farma" -> farma.md', farma && farma.slug === 'farma');
  check('farma.md.gameIds jest puste (nie potrzebuje mostka)', farma.gameIds.length === 0);
}

// 4) klucze terrain-improvements.json bez pokrycia (luka treści, nie mostka)
{
  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const ency = bundle.encyklopedia;
  const terrain = JSON.parse(fs.readFileSync(TERRAIN_JSON, 'utf8'));
  const realKeys = Object.keys(terrain).filter(k => !k.startsWith('_'));
  const unresolved = realKeys.filter(k => !findEncyByGameId(ency, 'ulepszenia', k));
  check(
    'znane luki treści (stadnina, droga_brukowana) -- dokładnie te dwie, bez nowych',
    JSON.stringify([...unresolved].sort()) === JSON.stringify(['droga_brukowana', 'stadnina'].sort()),
  );
}

// 5) Technologie: 1:1, gra-id NIE jest potrzebne
{
  const tech = JSON.parse(fs.readFileSync(TECH_JSON, 'utf8')).technologie;
  const files = fs.readdirSync(TECHNOLOGIE_DIR)
    .filter(f => f.endsWith('.md'))
    .map(f => f.replace(/\.md$/, ''));
  const fileSet = new Set(files);
  const slugs = tech.map(t => slugifyUnderscore(t['Technologia']));
  const allMatch = slugs.every(s => fileSet.has(s));
  check(`wszystkie ${slugs.length} technologii z tech.json mają plik 1:1 przez techToSlug (bez gra-id)`, allMatch);
  check('liczba plików technologie/*.md == liczba wpisów tech.json (brak nadmiarowych/brakujących)', files.length === slugs.length);

  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const ency = bundle.encyklopedia;
  const noGameIds = ency.filter(e => e.folder === 'technologie').every(e => e.gameIds.length === 0);
  check('żaden wpis kategorii "technologie" nie ma (niepotrzebnie) gra-id', noGameIds);
}

// 6) Jednostki: dokładnie JEDEN plik wymagał mostka (Soldurii / wojownik-celtycki.md)
{
  const units = require(UNITS_JSON);
  const files = fs.readdirSync(JEDNOSTKI_DIR).filter(f => f.endsWith('.md'));
  const titleBySlug = new Map();
  for (const f of files) {
    const md = fs.readFileSync(path.join(JEDNOSTKI_DIR, f), 'utf8');
    const m = md.match(/^#\s+(.+)$/m);
    titleBySlug.set(f.replace(/\.md$/, ''), m ? m[1].trim() : null);
  }

  // Rozbieżności "nazwa jednostki -> derywowany slug -> ten slug JEST plikiem, ale
  // TYTUŁ pliku (nagłówek #) NIE zgadza się z nazwą jednostki" == prawdziwy rozjazd
  // nazewniczy (rename), a nie brak treści.
  const renameMismatches = [];
  for (const u of units) {
    const name = u['Jednostka'];
    if (!name) continue;
    const slug = slugifyKebab(name);
    if (titleBySlug.has(slug) && titleBySlug.get(slug) !== name) {
      renameMismatches.push({ name, slug, fileTitle: titleBySlug.get(slug) });
    }
  }
  check(
    'zero plików jednostki/*.md, których TYTUŁ nie zgadza się z aktualną nazwą pod tym slugiem',
    renameMismatches.length === 0,
  );

  // Prawdziwy przypadek mostka: nazwa "Soldurii" nie ma WŁASNEGO pliku pod swoim
  // slugiem (bo treść leży pod starym slugiem wojownik-celtycki.md) -- i właśnie
  // dlatego wymaga gra-id, w odróżnieniu od zwykłych braków treści.
  const soldurii = units.find(u => u['Jednostka'] === 'Soldurii');
  check('jednostka "Soldurii" istnieje w units.json', !!soldurii);
  const soldurniiSlug = soldurii ? slugifyKebab(soldurii['Jednostka']) : null;
  check('"soldurii" (derywowany slug) NIE jest nazwą własnego pliku jednostki', soldurniiSlug === 'soldurii' && !titleBySlug.has('soldurii'));

  const bundle = JSON.parse(fs.readFileSync(BUNDLE_PATH, 'utf8'));
  const ency = bundle.encyklopedia;
  const hit = findEncyByGameId(ency, 'jednostki', 'soldurii');
  check('lookup(\'jednostki\', \'soldurii\') -> wojownik-celtycki.md (przez gra-id)', hit && hit.slug === 'wojownik-celtycki');

  const jednostkiWithGameIds = ency.filter(e => e.folder === 'jednostki' && e.gameIds.length > 0);
  check(
    'dokładnie JEDEN wpis kategorii "jednostki" ma gra-id (wojownik-celtycki.md)',
    jednostkiWithGameIds.length === 1 && jednostkiWithGameIds[0].slug === 'wojownik-celtycki',
  );
}

// 7) Idempotentność generatora (uruchomienie 2x -> identyczny wynik)
{
  const genScript = path.join(ROOT, 'gra', 'tools', 'bundle-wiki-for-game.cjs');
  const { execFileSync } = require('child_process');
  execFileSync(process.execPath, [genScript], { stdio: 'pipe' });
  const run1 = fs.readFileSync(BUNDLE_PATH, 'utf8');
  execFileSync(process.execPath, [genScript], { stdio: 'pipe' });
  const run2 = fs.readFileSync(BUNDLE_PATH, 'utf8');
  check('node bundle-wiki-for-game.cjs jest idempotentny (2. przebieg bez zmian)', run1 === run2);
}

console.log('');
if (failures > 0) {
  console.error(`${failures} test(y) FAILED`);
  process.exit(1);
} else {
  console.log('Wszystkie testy PASS.');
}
