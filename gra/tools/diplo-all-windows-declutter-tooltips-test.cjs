'use strict';
/**
 * diplo-all-windows-declutter-tooltips-test.cjs -- R-WEB-UI-DIPLO-ALL-PROPOSAL-WINDOWS-DECLUTTER-TOOLTIPS-Q2 (R6).
 *
 * Okna i plansze dyplomacji poza częścią 1 (Q1: plansze umów/PW): modale wojny i sojuszu, kara
 * za decyzję, baner stanu, wiersz relacji, wiarygodność, „Możliwe umowy”, „Aktywne traktaty”,
 * karty negocjacji. Wyjaśnienia, wyliczenia i podpowiedzi NIE są usuwane — zostają w atrybucie
 * `title` elementu, którego dotyczą (ten sam mechanizm dymka co reszta gry).
 *
 * Asercje (źródło, bez przeglądarki — moduł audiencji nie wiąże się w node przez import.meta.glob):
 *  (1) widoczny szablon NIE zawiera wyjaśnień (wzorce zabronione na planszy);
 *  (2) dawne treści istnieją jako tooltip (title) elementu — nic nie zniknęło;
 *  (3) dymki modali działają (scope `.civ-diplo-modal-overlay` w hudTitleTooltip.ts);
 *  (4) MUTACJA: kopia szablonu, w której uzasadnienie kary wraca do widocznego tekstu, MUSI czerwienić (1).
 *
 * Run: node tools/diplo-all-windows-declutter-tooltips-test.cjs
 */
const fs = require('fs');
const path = require('path');

const GRA = path.resolve(__dirname, '..');
const UI = path.resolve(GRA, 'src', 'ui');
const AUD_FILE = path.resolve(UI, 'diplomacyAudience.ts');
const HT_FILE = path.resolve(UI, 'hudTitleTooltip.ts');

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
  if (cond) { pass++; console.log('PASS: ' + name); }
  else { fail++; console.log('FAIL: ' + name + (detail !== undefined ? ' -- ' + JSON.stringify(detail) : '')); }
}

/** Wzorce, które NIE mogą wracać do widocznego tekstu okna (R2/R3). Każdy: nazwa + regex na źródle szablonu. */
const VISIBLE_FORBIDDEN = [
  { name: 'uzasadnienie kary w widocznym tekście (lista skutków)', re: /'<\/b> — '\s*\+\s*esc\(l\.reason\)/ },
  { name: 'opis opcji „bez ataku w tej turze” widoczny', re: /<strong>Wypowiedz wojnę<\/strong> — bez ataku/ },
  { name: 'lead „Nie jesteście w stanie wojny…” widoczny', re: />Nie jesteście w stanie wojny/ },
  { name: 'opis „kara Wiarygodności” widoczny', re: /<\/strong> — kara Wiarygodności/ },
  { name: 'kara zerwania w widocznym banerze („zerwanie: ” jako tekst)', re: /subParts\.push\('zerwanie: '/ },
  { name: 'sumka relacji „(Zaufanie + Respekt)” widoczna', re: /da-rel-sum-hint">\(Zaufanie/ },
  { name: 'widoczny blok „życiorys/bieżące” (znacznik HTML)', re: /class="da-credibility-hint"/ },
  { name: 'widoczny opis „dodaj kolejną umowę” (podpowiedź stołu)', re: /'<\/b> · dodaj kolejną/ },
  { name: 'widoczna podpowiedź „Użyj Edytuj…”', re: />Użyj Edytuj/ },
  { name: 'widoczna linia „kara zerwania” w kolumnie traktatów', re: /class="da-pen">kara zerwania/ },
];

/** Dawne treści, które MUSZĄ istnieć jako wartość title (tooltip) — nic nie usunięte (R1). */
const TOOLTIP_REQUIRED = [
  'Bez ataku w tej turze (karencja N1)',
  'Wojna od razu i atak w tej turze',
  'Kara Wiarygodności i zerwanie sojuszu',
  'Zerwanie: ',
  'Kara zerwania: ',
  'Dodaj kolejną umowę z listy',
  'Użyj Edytuj, aby zmienić ilości w koszyku',
  'Relacja = Zaufanie + Respekt',
  'Rozbicie: życiorys ',
];

function violations(src) {
  return VISIBLE_FORBIDDEN.filter(p => p.re.test(src)).map(p => p.name);
}

const audSrc = fs.readFileSync(AUD_FILE, 'utf8');
const htSrc = fs.readFileSync(HT_FILE, 'utf8');

// (1) widoczny tekst bez wyjaśnień
const viol = violations(audSrc);
check('widoczny szablon okien dyplomacji: brak wyjaśnień poza tooltipem', viol.length === 0, viol);

// (2) dawne treści w tooltipie (title)
for (const t of TOOLTIP_REQUIRED) {
  check('tooltip (title) zawiera: „' + t.trim() + '”', audSrc.includes(t), t);
}
check('wiarygodność: wiersz ma tooltip z rozbiciem (bez widocznego bloku)',
  /splitTip = rozbicie/.test(audSrc) && /tipBody \+ splitTip/.test(audSrc));
check('modal wojny: nagłówek „Konflikt z …” zostaje widoczny', /'<h3>Konflikt z ' \+ esc\(opts\.civName\)/.test(audSrc));
check('modal sojuszu: wymagana wojna z ... widoczna (krótko)', /Wymagana wojna z: <strong>/.test(audSrc));
check('kolumna „Możliwe umowy”: widoczne tylko „Na stole: N”', /'<\/b><\/div>'/.test(audSrc) && /Na stole: <b>/.test(audSrc));

// (3) scope dymków obejmuje modale (inaczej tooltip w modalu byłby tylko natywny)
check('hudTitleTooltip: scope obejmuje .civ-diplo-modal-overlay', /'\.civ-diplo-modal-overlay'/.test(htSrc));

// (4) MUTACJA: uzasadnienie kary wraca do widocznego tekstu → test MUSI czerwienić
const anchorOld = "signedDelta(l.delta)) + '</b></li>';";
const anchorCount = audSrc.split(anchorOld).length - 1;
check('mutacja: kotwica (wiersz kary) występuje dokładnie raz', anchorCount === 1, anchorCount);
if (anchorCount === 1) {
  const mutated = audSrc.replace(anchorOld,
    "signedDelta(l.delta)) + '</b> — ' + esc(l.reason) + '</li>';");
  const mutViol = violations(mutated);
  check('mutacja: uzasadnienie kary wrócone na widoczny tekst czerwieni test (1)',
    mutViol.length > 0, mutViol);
}

console.log('');
console.log('diplo-all-windows-declutter-tooltips-test: ' + pass + ' pass, ' + fail + ' fail');
process.exit(fail === 0 ? 0 : 1);
