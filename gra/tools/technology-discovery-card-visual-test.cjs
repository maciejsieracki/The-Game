'use strict';
/**
 * technology-discovery-card-visual-test.cjs -- R-TRZY-KARTY-WDROZENIE-Q1 runda 1 (Karta 1)
 * Run: cd gra && node tools/technology-discovery-card-visual-test.cjs
 *
 * Kontekst: redesign src/ui/techDiscoveryNotice.ts wg makiety
 * `1 - Karta odkrycia technologii (standalone).html` (paczka TRZY-KARTY-2026-08-19) +
 * DYSPOZYCJA-WDROZENIE.md SS2. Ten plik NIE importuje techDiscoveryNotice.ts bezposrednio --
 * ten modul importuje src/ui/icons/brandAssets.ts, ktory na poziomie MODULU wola
 * `import.meta.glob(...)`; w bundlu esbuild/cjs (wymaganym zeby uruchomic TS w node bez Vite)
 * ta linia rzuca `TypeError: import_meta.glob is not a function` natychmiast przy require(),
 * ten sam, juz udokumentowany w CLAUDE.md defekt harnessu co w building-tech-gate-test.cjs.
 * Zamiast tego: [1] realne dane z data/tech.json + data/units.json (dowod, ze dane
 * "Brazownictwo" po korekcie z briefu 19.08 sa poprawne w zrodle), [2] regexowe przypiecie
 * kluczowych decyzji z DYSPOZYCJA-WDROZENIE.md SS2 w zrodle techDiscoveryNotice.ts (chroni
 * przed cichym cofnieciem), [3] kompletnosc katalogu ikon technologii (techIcons.ts) wobec
 * pelnej listy tech.json -- od tego zalezy, czy medalion karty kiedykolwiek zostanie pusty.
 */

const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const SRC = path.join(GRA, 'src', 'ui', 'techDiscoveryNotice.ts');
const TECH_JSON = path.join(GRA, 'data', 'tech.json');
const UNITS_JSON = path.join(GRA, 'data', 'units.json');
const TECH_ICONS_SRC = path.join(GRA, 'src', 'ui', 'techIcons.ts');

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log('PASS:', msg); }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('technology-discovery-card-visual-test (R-TRZY-KARTY-WDROZENIE-Q1 runda 1)\n');

// --- [1] Dane Brazownictwa poprawione zgodnie z briefem 19.08 (DYSPOZYCJA-WDROZENIE.md SS2) ---
console.log('[1] tech.json: Brazownictwo -- dane po korekcie z briefu 19.08');
const tech = JSON.parse(fs.readFileSync(TECH_JSON, 'utf8'));
const bronze = tech.technologie.find(t => t.Technologia === 'Brązownictwo');
assert(bronze !== undefined, 'wpis "Brązownictwo" istnieje w tech.json');
if (bronze) {
  assert(bronze.Epoka === 'Kamień', `epoka Kamienia (got=${JSON.stringify(bronze.Epoka)})`);
  assert(bronze.Poziom === 3, `poziom 3 (got=${JSON.stringify(bronze.Poziom)})`);
  assert(
    bronze['Wymaga (prereq)'] === 'Garncarstwo + Murarstwo + Obróbka drewna',
    `wymaga Garncarstwo + Murarstwo + Obróbka drewna (got=${JSON.stringify(bronze['Wymaga (prereq)'])})`,
  );
  assert(bronze.awansDoEpoki === 2, `kamień milowy -> epoka 2 = Brąz (got=${JSON.stringify(bronze.awansDoEpoki)})`);
}

const units = JSON.parse(fs.readFileSync(UNITS_JSON, 'utf8'));
const bronzeUnits = units.filter(u => u.Tech === 'Brązownictwo');
assert(bronzeUnits.length > 3, `jednostek Brązownictwa jest więcej niż UNIT_PREVIEW=3, żeby "Pokaż pozostałe" faktycznie się uruchamiało (got=${bronzeUnits.length})`);
console.log(`  (uwaga: makieta z 19.08 zakładała 12 -- dzisiejsze units.json ma ${bronzeUnits.length}; karta renderuje realną liczbę, nie hardkoduje 12 -- patrz DYSPOZYCJA-WDROZENIE.md SS2 "rozbieżności danych z SS8 nie są rozstrzygane")\n`);

// --- [2] Przypięte decyzje z DYSPOZYCJA-WDROZENIE.md SS2 w źródle karty ---------------------
console.log('[2] techDiscoveryNotice.ts: kluczowe decyzje wdrożeniowe przypięte w źródle');
const src = fs.readFileSync(SRC, 'utf8');

assert(
  !/tech\[['"]Koszt nauki['"]\]/.test(src) && !/90\s*PN/.test(src),
  'koszt bazowy (tech[\'Koszt nauki\'] / "90 PN") nigdy nie jest odczytany do renderu -- typ TechRow zachowuje pole dla zgodności kształtu, ale karta go nie używa',
);

const actionsIdx = src.indexOf("title: 'Co możesz teraz zrobić'");
const buildingsIdx = src.indexOf("title: 'Budynki'");
assert(actionsIdx > -1 && buildingsIdx > -1 && actionsIdx < buildingsIdx,
  '"Co możesz teraz zrobić" zdefiniowane przed "Budynki" (kolejność sekcji, odstępstwo świadome z SS2)');

assert(/const UNIT_PREVIEW = 3/.test(src), 'podgląd jednostek pokazuje 3 pierwsze przed "Pokaż pozostałe"');
assert(/Pokaż pozostałe \$\{hiddenUnits\}/.test(src), 'przycisk "Pokaż pozostałe {n}" jest generowany z realnej liczby ukrytych jednostek, nie hardkodowany');
assert(/tdn-card--compact/.test(src), 'nagłówek karty ma wariant kompaktowy (medalion 52->36px) dla stanu z rozwiniętą pełną listą jednostek');

assert(/<b>✓<\/b>/.test(src) && /spełnione/.test(src),
  'sekcja Wymagania renderuje zawsze ✓ / "spełnione" (uzasadnione: karta pokazuje się tylko gdy tech już zbadany, więc jego prereqy są z definicji spełnione)');

assert(/data-act="tree"/.test(src) && /showTechTreeView|onOpenTree/.test(src),
  '"Otwórz drzewo" (onOpenTree, istniejący hook main.ts) zostaje wpięty');
assert(!/hub badań['"]?\s*<\/button>|data-act="hub"/.test(src),
  'żaden przycisk "hub badań" nie jest wpięty do żadnego handlera (decyzja: odłożone -- patrz komentarz nagłówkowy pliku pkt 5)');

assert(/--tg-focus-ring/.test(src), 'focus-visible używa nowego tokena --tg-focus-ring (tokens.css)');

// Zero emoji w renderowanych stringach (poza atrybutami aria/tytułami, gdzie jedyny dopuszczalny
// znak to ✕ (zamknięcie) i ✓ (spełnione wymaganie) -- oba to nie emoji, to interpunkcja Unicode.
const emojiRe = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
const withoutAllowed = src.replace(/✕/g, '').replace(/✓/g, '').replace(/▾|▸/g, '');
assert(!emojiRe.test(withoutAllowed), 'brak emoji w źródle karty (poza dopuszczonymi ✕ / ✓ / strzałkami ▾▸)');

// --- [3] Kompletność katalogu ikon technologii wobec tech.json ------------------------------
console.log('\n[3] techIcons.ts: katalog ikon pokrywa wszystkie technologie z tech.json (medalion nigdy pusty)');
const iconsSrc = fs.readFileSync(TECH_ICONS_SRC, 'utf8');
const missing = tech.technologie
  .map(t => t.Technologia)
  .filter(name => !new RegExp(`'${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}':\\s*'<svg`).test(iconsSrc));
assert(missing.length === 0, `wszystkie ${tech.technologie.length} technologii mają ikonę w TECH_ICON_SVG_BY_NAME (brakujące: ${JSON.stringify(missing)})`);

console.log(`\n${passed} PASS, ${failed} FAIL`);
process.exit(failed > 0 ? 1 : 0);
