'use strict';
/**
 * civpedia-technologie-rys-historyczny-test.cjs -- trwały test dla
 * R-CIVPEDIA-TECHNOLOGIE-Q1: sekcja "## Rys historyczny" dopisana na końcu
 * każdego z 32 plików docs/encyklopedia/technologie/*.md, treść dosłownie
 * zgodna z polem "Historia" w gra/data/tech.json (dopasowanie po nazwie
 * technologii, bo tech.json nie ma pola id na wpisie technologii).
 *
 * Pokrywa kryteria końca 1-3 z dyspozycji:
 *   1. treść "## Rys historyczny" == tech.json[].Historia (dopasowanie po nazwie)
 *   2. sekcja "## Historia / decyzje" (niezwiązany changelog wiki) niezmieniona
 *   3. wikiBundle.json (dane realnie zużywane przez UI) niesie tę samą treść
 *      w polu `historia` dla każdego z 32 haseł kategorii "Technologie" --
 *      proxy dla renderowalności; faktyczny zrzut z żywej przeglądarki jest
 *      osobnym dowodem poza tym testem (headless Chromium, patrz raport rundy).
 *
 * Run from gra/:
 *   node tools/civpedia-technologie-rys-historyczny-test.cjs
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..', '..');
const techDir = path.join(repoRoot, 'docs/encyklopedia/technologie');
const techJsonPath = path.join(repoRoot, 'gra/data/tech.json');
const bundlePath = path.join(repoRoot, 'gra/src/data/wikiBundle.json');

let pass = 0;
let fail = 0;
function check(cond, label) {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.log('  FAIL: ' + label);
  }
}

const tech = JSON.parse(fs.readFileSync(techJsonPath, 'utf8'));
const historiaByName = new Map();
for (const t of tech.technologie) {
  historiaByName.set(t.Technologia, t.Historia);
}

const files = fs.readdirSync(techDir).filter((f) => f.endsWith('.md')).sort();
check(files.length === 32, 'oczekiwano 32 plików .md w docs/encyklopedia/technologie, jest ' + files.length);

const RYS_RE = /\n## Rys historyczny\n\n([\s\S]*?)\n$/;
const DECYZJE_MARKER = 'Wygenerowano z danych gry (`gra/data/tech.json`) · T8 CivPedia';

const namesSeen = new Set();

for (const f of files) {
  const fp = path.join(techDir, f);
  const content = fs.readFileSync(fp, 'utf8');

  const titleMatch = content.match(/\|\s*\*\*tytuł\*\*\s*\|\s*(.+?)\s*\|/);
  check(!!titleMatch, f + ': pole tytuł w tabeli Metadane obecne');
  const tytul = titleMatch ? titleMatch[1].trim() : null;

  // Kryterium 2: "## Historia / decyzje" (istniejący, niezwiązany changelog) obecny i
  // niezmieniony -- musi wciąż zawierać generyczny znacznik i poprzedzać nową sekcję.
  const decyzjeIdx = content.indexOf('## Historia / decyzje');
  check(decyzjeIdx !== -1, f + ': sekcja "## Historia / decyzje" obecna (niezmieniona)');
  check(content.includes(DECYZJE_MARKER), f + ': treść "## Historia / decyzje" niezmieniona (znacznik generatora obecny)');

  // Kryterium 1: nowa sekcja "## Rys historyczny" na KOŃCU pliku, PO "## Historia / decyzje".
  const rysIdx = content.indexOf('## Rys historyczny');
  check(rysIdx !== -1 && decyzjeIdx !== -1 && rysIdx > decyzjeIdx, f + ': "## Rys historyczny" obecna i występuje PO "## Historia / decyzje"');

  const m = content.match(RYS_RE);
  check(!!m, f + ': sekcja "## Rys historyczny" ma poprawny format (nagłówek + pusta linia + treść na końcu pliku)');
  const rysTresc = m ? m[1] : null;

  if (tytul) {
    namesSeen.add(tytul);
    const expected = historiaByName.get(tytul);
    check(expected !== undefined, f + ': tytuł "' + tytul + '" dopasowany do wpisu w tech.json (pole Technologia)');
    if (expected !== undefined && rysTresc !== null) {
      check(rysTresc === expected, f + ': treść "## Rys historyczny" DOSŁOWNIE równa tech.json[' + tytul + '].Historia');
    }
  }
}

// Wszystkie 32 nazwy z tech.json trafione, zero pominięć / duplikatów po stronie plików.
check(namesSeen.size === 32, 'liczba unikalnych dopasowanych nazw technologii == 32 (jest ' + namesSeen.size + ')');
check(tech.technologie.length === 32, 'tech.json ma dokładnie 32 wpisy w tablicy technologie');

// Kryterium 3 (proxy): wikiBundle.json niesie tę samą treść w polu `historia`
// dla każdego z 32 haseł kategorii "Technologie".
if (fs.existsSync(bundlePath)) {
  const bundle = JSON.parse(fs.readFileSync(bundlePath, 'utf8'));
  const techEntries = bundle.encyklopedia.filter((e) => e.folder === 'technologie');
  check(techEntries.length === 32, 'wikiBundle.json: 32 hasła w folderze "technologie" (jest ' + techEntries.length + ')');
  for (const e of techEntries) {
    const expected = historiaByName.get(e.title);
    check(expected !== undefined, 'wikiBundle: hasło "' + e.title + '" dopasowane do tech.json');
    if (expected !== undefined) {
      check(e.historia === expected, 'wikiBundle: pole historia dla "' + e.title + '" == tech.json.Historia');
      check(typeof e.full === 'string' && e.full.includes('## Rys historyczny\n\n' + expected), 'wikiBundle: pole full dla "' + e.title + '" zawiera wyrenderowaną sekcję "## Rys historyczny"');
    }
  }
} else {
  fail++;
  console.log('  FAIL: gra/src/data/wikiBundle.json nie istnieje -- uruchom node tools/bundle-wiki-for-game.cjs');
}

console.log('');
console.log('civpedia-technologie-rys-historyczny-test: ' + pass + ' pass, ' + fail + ' fail');
if (fail > 0) {
  process.exit(1);
}
console.log('ALL GREEN');
