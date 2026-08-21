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
// R-PRACA-SUWAKI-DUPLIKAT-I-CAP-MIASTO-Q1 (Wątek F, ta runda): panel PRACA IMPERIUM
// przeprojektowany — sygnał "Ulepszenia N%" na samej górze sekcji (hero), Budynki po lewej /
// Ulepszenia po prawej w dwóch oddzielonych boxach (`.civ-emp-two`/`.civ-emp-box`) zamiast
// potrójnie powtarzanego tekstu etykiet + noty + stopki. Asercje niżej zastąpione pod nowy
// markup; zachowują tę samą intencję (nazewnictwo + brak duplikacji + zakres suwaka 0–50%).
check('sygnał "Ulepszenia" na samej górze sekcji (hero)', source.includes('data-praca-empire-split-hero>Ulepszenia ${pctU}%'));
check('kolumna BUDYNKI (lewa, wyliczany remainder)', source.includes('civ-emp-slider-label gold">BUDYNKI</div>') && source.includes('data-praca-empire-split-buildings'));
check('kolumna ULEPSZENIA (prawa, suwak)', source.includes('civ-emp-slider-label blue">ULEPSZENIA</div>'));
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

console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
