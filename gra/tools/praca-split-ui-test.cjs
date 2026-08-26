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
// R-PRACA-JEDEN-PODZIAL-Q1: zakresy suwakow sa dzis stalymi w `cities.ts` (jeden cap
// dla globalu i dla miasta), wiec pinujemy je u ZRODLA, nie przez literal w UI.
const citiesSource = fs.readFileSync(
  path.resolve(__dirname, '..', 'src/game/cities.ts'),
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
// R-PRACA-JEDEN-PODZIAL-Q1 — AKTUALIZACJA ASERCJI PINUJACYCH LITERALNE STRINGI UI
// (uzasadnienie w 01-operator.md):
//   CO PILNOWALY: jeden input, zakres 0–50%, jedna sciezka zapisu podzialu, jedna ikona
//     `chip-crate` przy etykiecie drugiego strumienia, suwak miasta 50–100% budynkow.
//   DLACZEGO STARE WARUNKI PRZESTALY BYC PRAWDA: WYLACZNIE dlatego, ze zmienily sie
//     literalne stringi — etykieta „Ulepszenia" zostala ujednolicona do jednej rodziny
//     nazw (`PULA_LBL`/`PULA_LBL_PELNA` = „Ulepszenia (pula)"/„Ulepszenia (pula imperium)"),
//     zakresy przeszly na stale (`MAX_PROCENT_PULI_IMPERIUM`, `MIN_PODZIAL_PRACY_BUDYNKI_PERCENT`),
//     a zapis podzialu idzie przez `podzialPracyZProcentuPuli()`. ZADNA z pinowanych
//     wlasnosci nie zostala oslabiona.
//   CO PILNUJE TERAZ: te same wlasnosci, wyrazone przez nowe stale i nazwy.

// R-PRACA-JEDEN-PODZIAL-Q1 RUNDA 2 (F2) — AKTUALIZACJA PIĘCIU ASERCJI, jawnie uzasadniona:
//   CO PILNOWAŁY: (1) hero sekcji imperium niesie nazwę strumienia + %, (2) błękitna etykieta
//     przy suwaku niesie tę samą nazwę, (3) klikalny znacznik MAX istnieje i pokazuje kraniec
//     zakresu, (4) panel miasta ma sygnał z nazwą strumienia na górze, (5) chip tej nazwy używa
//     ikony `chip-crate`.
//   DLACZEGO STARE WARUNKI PRZESTAŁY BYĆ PRAWDĄ: runda 1 ujednoliciła nazwę TYLKO w
//     `cityPanel.ts` (lokalne stałe), więc `empireDetailPanel.ts` został z gołym „Ulepszenia" —
//     TRZECIĄ nazwą tej samej liczby (bloker F2 Evaluatora i Final Control). Runda 2 przeniosła
//     definicje do JEDNEGO źródła `PODZIAL_PRACY_PULA_LBL*` w `game/cities.ts` i podłączyła do
//     niego wszystkie trzy panele; kraniec MAX liczy się teraz ze stałej
//     `MAX_PROCENT_PULI_IMPERIUM`, nie z zapisanej na sztywno „50".
//   CO PILNUJĄ TERAZ: DOKŁADNIE te same pięć własności, wyrażone przez wspólną stałą zamiast
//     przez literał — plus mocniejszy warunek: literał nie może już mieszkać w pliku UI.
//     Asercje nie zostały rozluźnione (żadna nie zamieniła się w „zawiera cokolwiek").
check('sygnał nazwy strumienia na samej górze sekcji (hero)',
  source.includes('data-praca-empire-split-hero>${PODZIAL_PRACY_PULA_LBL} ${pctU}%'));
check(
  'etykieta strumienia po lewej stronie suwaka (błękit, procent na żywo)',
  source.includes('<span class="civ-emp-slider-label blue">${PODZIAL_PRACY_PULA_LBL} ')
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
check('klikalny znacznik MAX na krańcu suwaka', source.includes('data-praca-empire-split-max title=')
  && source.includes('>MAX ${MAX_PROCENT_PULI_IMPERIUM}%</button>')
  && /export const MAX_PROCENT_PULI_IMPERIUM = 100 - MIN_PODZIAL_PRACY_BUDYNKI_PERCENT;/.test(citiesSource));
check(
  'MIN/MAX przechodzą przez TEN SAM handler co drag (input.value + dispatch "input"), bez drugiej ścieżki zapisu',
  source.includes("input.dispatchEvent(new Event('input', { bubbles: true }));")
    && (source.match(/onChange\(0, podzialPracyZProcentuPuli\(pctU\)\)/g) || []).length === 1,
);
check('jeden renderowany nadrzędny input', (source.match(/data-praca-empire-split title=/g) || []).length === 1);
check('jeden listener input dla nadrzędnego suwaka', (source.match(/input\.addEventListener\('input'/g) || []).length === 1);
check('brak usuniętego lokalnego renderu/wiringu', !source.includes('renderPracaSplitSection') && !source.includes('data-praca-key'));
check('wartość suwaka ma zakres 0–50', source.includes('min="0" max="${MAX_PROCENT_PULI_IMPERIUM}" step="1"')
  && /export const MAX_PROCENT_PULI_IMPERIUM = 100 - MIN_PODZIAL_PRACY_BUDYNKI_PERCENT;/.test(citiesSource)
  && /export const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50;/.test(citiesSource));
check('Budynki wyliczane jako 100% minus Ulepszenia (kod, nie duplikowany tekst stopki)', source.includes('const pctB = 100 - pctU;'));
// Wątek A: baner-duplikat (nieinteraktywny split2BarHtml + wiersz etykiet "Budynki X% / Pula
// imperium Y%") usunięty z sekcji PRACA IMPERIUM -- nie mieszał się już wizualnie z prawdziwym
// suwakiem niżej pokazującym te same nazwy z inną (nominalną) liczbą.
check(
  'baner-duplikat (split2BarHtml + etykiety Budynki/Pula imperium) usunięty z PRACA IMPERIUM',
  !/split2BarHtml\(pctBudynki/.test(source) && !source.includes('Pula imperium ${pctPula}%'),
);
check('lokalny suwak miasta zaczyna się od 50% budynków', citySource.includes("inp.min = String(MIN_PODZIAL_PRACY_BUDYNKI_PERCENT);")
  && /export const MIN_PODZIAL_PRACY_BUDYNKI_PERCENT = 50;/.test(citiesSource));
check('lokalny suwak miasta kończy się na 100% budynków', citySource.includes("inp.max = String(MAX_PODZIAL_PRACY_BUDYNKI_PERCENT);")
  && /export const MAX_PODZIAL_PRACY_BUDYNKI_PERCENT = 100;/.test(citiesSource));
// Wątek F: kontrolka #4 (cityPanel.ts renderPodzialPracy) przeprojektowana — sygnał "Ulepszenia"
// na samej górze panelu, dwie kolumny Budynki (lewo, .left) / Ulepszenia (prawo, .right), zamiast
// jednego zdania "Budynki 50–100% / Pula Pracy 0–50% (lokalnie)" (usunięta nazwa "Pula Pracy").
check('sygnał nazwy strumienia na samej górze panelu miasta', citySource.includes("summary.innerHTML = `${cityPanelChipIconWrap('chip-crate', 16)} ${PULA_LBL_PELNA} <b>${pctU}%</b>`")
  && /const PULA_LBL_PELNA = PODZIAL_PRACY_PULA_LBL_PELNA;/.test(citySource)
  && /export const PODZIAL_PRACY_PULA_LBL_PELNA = 'Ulepszenia \(pula imperium\)';/.test(citiesSource));
check('dwie kolumny Budynki/Ulepszenia w panelu miasta (Wątek F)', citySource.includes("el('div', 'praca-split-col left')") && citySource.includes("el('div', 'praca-split-col right')"));
check('nazwa "Pula Pracy" usunięta z suwaka miasta (zastąpiona "Ulepszenia", Wątek F)', !citySource.includes('Pula Pracy 0–50% (lokalnie)'));

// P-PRACA-PANEL-IKONY-NIESPOJNE-Q1 (Maciej 2026-08-22, ECHO): jedno pojęcie = jedna ikona.
// „Ulepszenia" w panelu miasta „PODZIAŁ PRACY" miało dwie różne ikony — `tb-build` (młotek,
// appendPodzialPracyInfo) i `chip-crate` (skrzynka, renderPodzialPracy). ECHO właściciela:
// wszędzie `chip-crate`, ikony zostają (bez przejścia na czysty tekst).
check(
  'chip nazwy strumienia w panelu miasta używa skrzynki chip-crate (nie młotka tb-build)',
  citySource.includes("statChipBrand('chip-crate', PULA_LBL,")
    && /const PULA_LBL = PODZIAL_PRACY_PULA_LBL;/.test(citySource)
    && /export const PODZIAL_PRACY_PULA_LBL = 'Ulepszenia \(pula\)';/.test(citiesSource),
);
check(
  'wiersz info „Ulepszenia" w panelu miasta używa skrzynki chip-crate (nie młotka tb-build)',
  citySource.includes("psiRowLabel('chip-crate', PULA_LBL_PELNA,"),
);
// Kontrakt anty-regresowy: ŻADNE wystąpienie etykiety „Ulepszenia" w cityPanel.ts nie może
// wrócić do `tb-build` ani do jakiejkolwiek innej ikony niż `chip-crate`.
{
  const ulepszeniaIcons = [...citySource.matchAll(/'([a-z0-9-]+)',\s*PULA_LBL(?:_PELNA)?[,)]/g)]
    .map((m) => m[1]);
  const wrapIcons = [...citySource.matchAll(/cityPanelChipIconWrap\('([a-z0-9-]+)',\s*\d+\)\}\s*\$\{PULA_LBL(?:_PELNA)?\}/g)]
    .map((m) => m[1]);
  const all = [...ulepszeniaIcons, ...wrapIcons];
  check(
    `wszystkie ikony przy etykiecie „Ulepszenia" to chip-crate (znaleziono: ${all.join(', ') || 'brak'})`,
    all.length >= 4 && all.every((id) => id === 'chip-crate'),
  );
}
check(
  'młotek tb-build nie jest już użyty przy „Ulepszenia" w cityPanel.ts',
  !/tb-build'[^\n]*PULA_LBL/.test(citySource) && !/PULA_LBL[^\n]*'tb-build/.test(citySource),
);

// P-PRACA-PANEL-EMOJI-ZAMIAST-IKON-Q1 (Maciej 2026-08-22): ten sam kontrakt „jedno pojęcie =
// jedna ikona", tylko DRUGA ścieżka renderu — reskin emoji przez `CP_INLINE_EMOJI_BRAND` /
// `cpInlineIcons()`. Skrzynki 📦 w ogóle nie było w mapie, więc „ściąga" panelu Pracy i karta
// paska górnego pokazywały goły glif zamiast TEJ SAMEJ skrzynki `chip-crate` co chipy wyżej.
// Pełne pokrycie (realny render w Chromium + mutacja) jest w
// `praca-panel-emoji-brand-icons-real-render-test.cjs`; tu zostaje sama kotwica spójności ikon.
check(
  'skrzynka 📦 w mapie reskinu wskazuje na TĘ SAMĄ ikonę chip-crate co chipy „Ulepszenia"',
  /'\u{1F4E6}':\s*'chip-crate'/u.test(citySource),
);

console.log(`\n[praca-split-ui-test] ${pass} pass, ${fail} fail`);
if (fail > 0) process.exit(1);
