'use strict';
/** Focused static contract test for R-PRACA-JEDEN-SUWAK-UI-Q1.
 * No temporary files are created, so the check is safe under EPERM.
 * Run from gra/: node tools/praca-split-ui-test.cjs
 */
const fs = require('fs');
const path = require('path');

const source = fs.readFileSync(
  path.resolve(__dirname, '..', 'src/ui/empireDetailPanel.ts'),
  'utf8',
);
const citySource = fs.readFileSync(
  path.resolve(__dirname, '..', 'src/ui/cityPanel.ts'),
  'utf8',
);
let pass = 0;
let fail = 0;
function check(name, condition) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.error('FAIL: ' + name); }
}

// R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek B): nazewnictwo "Budynki" / "Ulepszenia"
// (zamiast dawnej "Pula Pracy", mylącej z realną akumulowaną PULA IMPERIUM).
//
// R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek F): sygnał "Ulepszenia N%" na samej górze
// sekcji (hero) — zostaje.
//
// P-PRACA-SPLIT-UI-JEDEN-SUWAK-Q1 (Maciej 2026-08-22, ta runda): dwa boksy `.civ-emp-two`
// (lewy "BUDYNKI" bez kontrolki, prawy "ULEPSZENIA" z połówkowym suwakiem) zastąpione JEDNYM
// suwakiem pełnej szerokości: etykiety "Ulepszenia" (lewo, błękit) / "Budynki" (prawo, złoto)
// nad torem, dwukolorowy gradient `laborSliderFillStyle()` na torze, klikalne znaczniki MIN/MAX
// pod krańcami. Asercje niżej przepisane pod nowy markup; intencja bez zmian (nazewnictwo +
// jeden input + zakres 0–50% + brak drugiej ścieżki zapisu podziału).
check('sygnał "Ulepszenia" na samej górze sekcji (hero)', source.includes('data-praca-empire-split-hero>Ulepszenia ${pctU}%'));
check(
  'etykieta "Ulepszenia" po lewej stronie suwaka (błękit, procent na żywo)',
  source.includes('<span class="civ-emp-slider-label blue">Ulepszenia ')
    && source.includes('data-praca-empire-split-upgrades'),
);
check(
  'etykieta "Budynki" po prawej stronie suwaka (złoto, wyliczany remainder)',
  source.includes('<span class="civ-emp-slider-label gold">Budynki ')
    && source.includes('data-praca-empire-split-buildings'),
);
check('dwa boksy .civ-emp-two zastąpione jednym suwakiem pełnej szerokości', !/civ-emp-slider-label gold">BUDYNKI<|civ-emp-slider-label blue">ULEPSZENIA</.test(source));
check('suwak pełnej szerokości z dwukolorowym torem laborSliderFillStyle()', source.includes('style="width:100%;background:${laborSliderFillStyle(pctU * 2)}" '));
// `pctU * 2` = pozycja uchwytu na torze 0–100% przy zakresie suwaka 0–50, więc granica kolorów
// leży dokładnie pod uchwytem. Dwa wystąpienia = render początkowy + przeliczenie na żywo.
check('laborSliderFillStyle NIE jest już martwym kodem (render początkowy + odświeżenie na żywo)', (source.match(/laborSliderFillStyle\(pctU \* 2\)/g) || []).length === 2);
check('klikalny znacznik MIN na krańcu suwaka', source.includes('data-praca-empire-split-min title=') && source.includes('>MIN 0%</button>'));
check('klikalny znacznik MAX na krańcu suwaka', source.includes('data-praca-empire-split-max title=') && source.includes('>MAX 50%</button>'));
check(
  'MIN/MAX przechodzą przez TEN SAM handler co drag (input.value + dispatch "input"), bez drugiej ścieżki zapisu',
  source.includes("input.dispatchEvent(new Event('input', { bubbles: true }));")
    && (source.match(/onChange\(0, \{ procentUlepszenia: pctU \}\)/g) || []).length === 1,
);
check('jeden renderowany nadrzędny input', (source.match(/data-praca-empire-split title=/g) || []).length === 1);
check('jeden listener input dla nadrzędnego suwaka', (source.match(/input\.addEventListener\('input'/g) || []).length === 1);
check('brak usuniętego lokalnego renderu/wiringu', !source.includes('renderPracaSplitSection') && !source.includes('data-praca-key'));
check('wartość suwaka ma zakres 0–50', source.includes('min="0" max="50" step="1"'));
check('Budynki wyliczane jako 100% minus Ulepszenia (kod, nie duplikowany tekst stopki)', source.includes('const pctB = 100 - pctU;'));
// Wątek A: baner-duplikat (nieinteraktywny split2BarHtml + wiersz etykiet "Budynki X% / Pula
// imperium Y%") usunięty z sekcji PRACA IMPERIUM -- nie mieszał się już wizualnie z prawdziwym
// suwakiem niżej pokazującym te same nazwy z inną (nominalną) liczbą.
check(
  'baner-duplikat (split2BarHtml + etykiety Budynki/Pula imperium) usunięty z PRACA IMPERIUM',
  !/split2BarHtml\(pctBudynki/.test(source) && !source.includes('Pula imperium ${pctPula}%'),
);
check('lokalny suwak miasta zaczyna się od 50% budynków', citySource.includes("inp.min = '50';"));
check('lokalny suwak miasta kończy się na 100% budynków', citySource.includes("inp.max = '100';"));
// Wątek F: kontrolka #4 (cityPanel.ts renderPodzialPracy) przeprojektowana — sygnał "Ulepszenia"
// na samej górze panelu, dwie kolumny Budynki (lewo, .left) / Ulepszenia (prawo, .right), zamiast
// jednego zdania "Budynki 50–100% / Pula Pracy 0–50% (lokalnie)" (usunięta nazwa "Pula Pracy").
check('sygnał "Ulepszenia" na samej górze panelu miasta', citySource.includes("summary.innerHTML = `${cityPanelChipIconWrap('chip-crate', 16)} Ulepszenia <b>${pctU}%</b>`"));
check('dwie kolumny Budynki/Ulepszenia w panelu miasta (Wątek F)', citySource.includes("el('div', 'praca-split-col left')") && citySource.includes("el('div', 'praca-split-col right')"));
check('nazwa "Pula Pracy" usunięta z suwaka miasta (zastąpiona "Ulepszenia", Wątek F)', !citySource.includes('Pula Pracy 0–50% (lokalnie)'));

// P-PRACA-PANEL-IKONY-NIESPOJNE-Q1 (Maciej 2026-08-22, ECHO): jedno pojęcie = jedna ikona.
// „Ulepszenia" w panelu miasta „PODZIAŁ PRACY" miało dwie różne ikony — `tb-build` (młotek,
// appendPodzialPracyInfo) i `chip-crate` (skrzynka, renderPodzialPracy). ECHO właściciela:
// wszędzie `chip-crate`, ikony zostają (bez przejścia na czysty tekst).
check(
  'chip „Ulepszenia" w panelu miasta używa skrzynki chip-crate (nie młotka tb-build)',
  citySource.includes("statChipBrand('chip-crate', 'Ulepszenia'"),
);
check(
  'wiersz info „Ulepszenia" w panelu miasta używa skrzynki chip-crate (nie młotka tb-build)',
  citySource.includes("psiRowLabel('chip-crate', 'Ulepszenia'"),
);
// Kontrakt anty-regresowy: ŻADNE wystąpienie etykiety „Ulepszenia" w cityPanel.ts nie może
// wrócić do `tb-build` ani do jakiejkolwiek innej ikony niż `chip-crate`.
{
  const ulepszeniaIcons = [...citySource.matchAll(/'([a-z0-9-]+)',\s*(?:'Ulepszenia'|13\)\} Ulepszenia|16\)\} Ulepszenia)/g)]
    .map((m) => m[1]);
  const wrapIcons = [...citySource.matchAll(/cityPanelChipIconWrap\('([a-z0-9-]+)',\s*\d+\)\}\s*Ulepszenia/g)]
    .map((m) => m[1]);
  const all = [...ulepszeniaIcons, ...wrapIcons];
  check(
    `wszystkie ikony przy etykiecie „Ulepszenia" to chip-crate (znaleziono: ${all.join(', ') || 'brak'})`,
    all.length >= 4 && all.every((id) => id === 'chip-crate'),
  );
}
check(
  'młotek tb-build nie jest już użyty przy „Ulepszenia" w cityPanel.ts',
  !/tb-build'[^\n]*Ulepszenia/.test(citySource) && !/Ulepszenia[^\n]*'tb-build/.test(citySource),
);

console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
