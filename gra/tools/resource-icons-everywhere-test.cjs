'use strict';
/**
 * resource-icons-everywhere-test.cjs
 *
 * TEMAT: R-WEB-UI-RESOURCE-ICONS-EVERYWHERE-Q1 (decyzja właściciela „tak, wszędzie").
 *
 * Koszty, utrzymanie i podsumowania surowców w panelu miasta i imperium pokazują
 * IKONĘ surowca + liczbę (wspólny komponent `resourceAmountChipHtml` z
 * src/ui/resourceAmountChip.ts). Nazwa słowna surowca zostaje wyłącznie w title/aria-label.
 *
 * Test źródłowy (statyczny, bez przeglądarki):
 *  A. Miejsca przerobione w tym temacie NIE składają już tekstu „liczba + nazwa surowca"
 *     (wzorzec `${...} ${stockResourceLabel(...)}` w szablonach wyjścia HTML).
 *  B. Wspólny komponent jest importowany i użyty w cityPanel.ts oraz empireDetailPanel.ts.
 *  C. Pozostałe, świadomie tekstowe miejsca (title/textContent/komunikaty braku) są
 *     wypisane jako lista jawnych ZAŁOŻEŃ — zmiana ich liczby wymaga świadomej aktualizacji.
 *
 * Realny render (Chromium, 520 px, zrzuty) jest w resource-amount-chip-icons-real-render-test.cjs.
 *
 * Uruchomienie (z gra/): node tools/resource-icons-everywhere-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const CITY = path.join(GRA, 'src', 'ui', 'cityPanel.ts');
const EMPIRE = path.join(GRA, 'src', 'ui', 'empireDetailPanel.ts');

let pass = 0;
let fail = 0;
function check(name, condition, detail) {
  if (condition) { pass++; console.log('PASS: ' + name); }
  else {
    fail++;
    console.log('FAIL: ' + name + (detail === undefined ? '' : ' — ' + JSON.stringify(detail)));
  }
}

const cityLines = fs.readFileSync(CITY, 'utf8').split('\n');
const empireLines = fs.readFileSync(EMPIRE, 'utf8').split('\n');

// Wzorzec tekstu „liczba + nazwa surowca" w szablonie wyjścia.
const BARE_NAME_RE = /\$\{[^}]+\}\s\$\{stockResourceLabel\(/;

function findLines(lines, re) {
  const out = [];
  lines.forEach((l, i) => { if (re.test(l)) out.push(i + 1); });
  return out;
}

// A. Przerobione funkcje/linie: żadnych gołych „liczba nazwa" w tych miejscach.
const cityBare = findLines(cityLines, BARE_NAME_RE);
const empireBare = findLines(empireLines, BARE_NAME_RE);
check('A1: cityPanel — brak tekstu „liczba + nazwa surowca" w przerobionych kosztach/utrzymaniu',
  !cityBare.some(n => {
    const l = cityLines[n - 1];
    return /stockChips|buildingStockCost|UpkeepSummary|unitStockCost|unitResourceUpkeep|formatResourceUpkeep|stockCostDetail|Koszt surowcowy/.test(l)
      || /chips\.push|label:/.test(l);
  }), cityBare);
check('A2: empireDetailPanel — brak tekstu „liczba + nazwa” w linii utrzymania i rekrutacji masowej',
  !empireBare.some(n => /formatResourceUpkeepEmpireLine|civ-emp|stock/.test(empireLines[n - 1])
    || /resources!|state\.stock/.test(empireLines[n - 1])), empireBare);

// B. Wspólny komponent używany (bez powielania).
const cityText = cityLines.join('\n');
const empireText = empireLines.join('\n');
check('B1: cityPanel importuje resourceAmountChipHtml z ./resourceAmountChip',
  /import \{ resourceAmountChipHtml \} from '\.\/resourceAmountChip'/.test(cityText));
check('B2: empireDetailPanel importuje resourceAmountChipHtml z ./resourceAmountChip',
  /import \{ resourceAmountChipHtml \} from '\.\/resourceAmountChip'/.test(empireText));
const cityUses = (cityText.match(/resourceAmountChipHtml\(/g) || []).length;
const empireUses = (empireText.match(/resourceAmountChipHtml\(/g) || []).length;
check('B3: cityPanel używa komponentu w co najmniej 9 miejscach (stock, utrzymanie, jednostki, konwerter)',
  cityUses >= 9, { cityUses });
check('B4: empireDetailPanel używa komponentu w 3 miejscach (utrzymanie x2, rekrutacja masowa)',
  empireUses >= 3, { empireUses });

// Cząstkowe dowody konkretnych miejsc.
check('B5: buildingStockCostChipsHtml składa ikonę w iconHtml (nie w label)',
  /label: pool !== undefined \? `\(masz \$\{have\}\)` : ''/.test(cityText)
  && /iconHtml: resourceAmountChipHtml\(k, `\$\{need\}`\)/.test(cityText));
check('B6: unitResourceUpkeepChipsHtml używa komponentu z jednostką /t',
  /resourceAmountChipHtml\(k, `−\$\{upkeep\[k\]\}`, '\/t'\)/.test(cityText));
check('B7: stan niedoboru zachowany — unitStockCostChipsHtml nadal dodaje „(brak)" i klasę stock-missing',
  /const text = missing \? `\$\{chip\} \(brak\)` : chip;/.test(cityText)
  && /bld-infocard-chip stock-missing/.test(cityText));

// C. Świadome ZAŁOŻENIA: pozostałe miejsca tekstowe (title/textContent/komunikaty braku).
const RESIDUAL = [
  'cityPanel: tooltip przycisku budowy (title attribute, tekst) — buildTitle „Brakuje w magazynie”',
  'cityPanel: komunikaty „Brakuje w magazynie” w rekrutacji (stockMissingLabel, tekst ostrzeżenia)',
  'cityPanel: etykieta wiersza składnika zaopatrzenia obywateli (BreakdownLine.label)',
  'empireDetailPanel: textContent przycisku silnika oblężniczego (siegeMapPanel/empire) — tekst przycisku',
  'buildingAdapter: wartość karty „z magazynu państwa” (ZAŁOŻENIE: tekst karty encji, poza allowlistą)',
];
check('C1: lista świadomie tekstowych miejsc jest jawna (ZAŁOŻENIA)', RESIDUAL.length === 5, RESIDUAL.length);

console.log(`\nWynik: ${pass} PASS, ${fail} FAIL`);
process.exit(fail === 0 ? 0 : 1);
