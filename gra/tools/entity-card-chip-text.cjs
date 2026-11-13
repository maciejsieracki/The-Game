'use strict';
/**
 * entity-card-chip-text.cjs — wspólny normalizator dla testów kart (building-cards-top5-test,
 * tech-cards-top5-test) — R-WEB-UI-RESOURCE-ICONS-YIELDS-WONDERS-Q1 (runda 2, zgoda orkiestratora).
 *
 * Tytuły Top 5 i zdania „Co możesz teraz zrobić" rysują plony/surowce jako chipy (liczba + ikona; nazwa
 * tylko w title/aria-label). Testy porównują TEKST po normalizacji: chip → „<kwota> <Nazwa chipa>"
 * (w przeglądarce: `window.__chipText`), a obie strony (render i dane) są sprowadzane do tej samej postaci
 * przez `normalizeText`: każda odmiana nazwy plonu/surowca (dopełniacz, biernik) → mianownik z tabeli FORMS.
 * Tabela jest JAWNA i niezależna od kodu adaptera. Liczby, kolejność, reszta słów — porównywane 1:1,
 * więc zmiana liczby/nazwy w karcie albo w danych daje czerwony wynik (dowód mutacyjny w raporcie).
 */
const fold = (s) => s.replace(/ł/g, 'l').replace(/Ł/g, 'L').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// odmiana (po fold) → nazwa chipa (jak w YIELD_CHIP / STOCK_RESOURCE_LABEL)
const FORMS = {
  zywnosc: 'Żywność', zywnosci: 'Żywność',
  praca: 'Praca', pracy: 'Praca', prace: 'Praca',
  kultura: 'Kultura', kultury: 'Kultura', kulture: 'Kultura',
  nauka: 'Nauka', nauki: 'Nauka', nauke: 'Nauka',
  wiara: 'Wiara', wiary: 'Wiara', wiare: 'Wiara',
  podatek: 'Podatek', podatku: 'Podatek',
  pieniadz: 'Pieniądz', pieniadze: 'Pieniądz', pieniadza: 'Pieniądz', pieniedzy: 'Pieniądz',
  wplyw: 'Wpływ', wplywu: 'Wpływ',
  drewno: 'Drewno', drewna: 'Drewno',
  kamien: 'Kamień', kamienia: 'Kamień',
  glina: 'Glina', gliny: 'Glina', gline: 'Glina',
  ceramika: 'Ceramika', ceramiki: 'Ceramika', ceramike: 'Ceramika', ceramice: 'Ceramika',
  cegla: 'Cegła', cegle: 'Cegła', cegly: 'Cegła', cegiel: 'Cegła',
  sol: 'Sól', soli: 'Sól',
  braz: 'Brąz', brazu: 'Brąz',
  zelazo: 'Żelazo', zelaza: 'Żelazo',
  zloto: 'Złoto', zlota: 'Złoto',
  kon: 'Koń', koni: 'Koń',
  ruda: 'Ruda', rudy: 'Ruda', rude: 'Ruda',
};

function normalizeText(s) {
  let t = String(s).replace(/\b[Rr]ud[ay] miedzi\b/g, 'Ruda');
  t = t.replace(/[\p{L}]+/gu, (w) => FORMS[fold(w)] || w);
  return t.replace(/\s+/g, ' ').trim();
}

/** Kod wstrzykiwany do strony: `window.__chipText(node)` = textContent z chipami zastąpionymi „<kwota> <Nazwa>". */
const BROWSER_SRC = `
window.__chipText = function (node) {
  var c = node.cloneNode(true);
  c.querySelectorAll('.bld-res-chip').forEach(function (ch) {
    var ic = ch.querySelector('.bld-res-chip-ic');
    var label = ic ? (ic.getAttribute('aria-label') || '').replace(/\\s*\\(surowiec\\)$/, '') : '';
    var amount = '';
    ch.childNodes.forEach(function (n) { if (n !== ic) amount += n.textContent; });
    amount = amount.trim();
    ch.replaceWith(document.createTextNode(amount ? amount + ' ' + label : label));
  });
  return c.textContent;
};`;

module.exports = { FORMS, normalizeText, BROWSER_SRC };
