# P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 — zgłoszenie konfliktu (C-054)

STATUS: `DECISION_REQUIRED`
RUNDA: 1/5
DATA: 2026-09-04
ROLA ZGŁASZAJĄCA: Operator (Opus 5, effort high)

## Czego dotyczy konflikt

Jednego pliku bramki **spoza allowlisty** tematu:
`gra/tools/wydarzenia-zbadano-karta-tech-real-render-test.cjs`.

## Co mówi dispatch

GOAL 1 wymaga, żeby klikalnym, oramkowanym przyciskiem stała się **sama nazwa encji**
(dzisiejszy `entity-card-row-key`), a pudełko przycisku rysował **ten sam element, który
łapie kliknięcie**.

## Co mówi kod po wykonaniu GOAL 1

Etykieta wiersza z `linkAnchor:'label'` jest dziś elementem `<button data-entity-kind>` —
to jedyna implementacja spełniająca GOAL 1 razem z regułą anty-halucynacyjną (pudełko
narysowane na nieklikalnym `<span>`, przy klikalnym całym wierszu, dawałoby prostokąt
pudełka różny od prostokąta elementu łapiącego klik, czyli dokładnie zakazany „obrazek
przycisku" z RUNDY 1 OBRONY).

## Co mówi test

`clickRowLabel()` (l. 273-297 wymienionego pliku) przerywa scenariusz **bez wykonania
kliknięcia**, gdy punkt etykiety należy do `button[data-entity-kind]`:

```js
if (at === null || at.inButton === true || at.inKey !== true) {
  return { hit: false, why: 'punkt kliku NIE trafia czysto w etykiete wiersza (albo trafia w przycisk)', at };
}
```

Warunek `at.inButton === true` powstał, gdy etykieta była zwykłym tekstem, a osobnym
przyciskiem po prawej było „Szczegóły →" — miał dowodzić, że (B6) klika w etykietę, a nie
w tamten przycisk. Tekst „Szczegóły →" został przez ten temat usunięty z całego kodu.

## Zmierzony skutek (bez zgadywania)

| Stan | Wynik bramki |
|---|---|
| baza `c8483a64`, przed tematem | 144 pass, 1 fail — `(B7)` |
| po GOAL 1, plik bramki NIETKNIĘTY | 137 pass, 4 fail — `(B7)` + 3× `(B6)` |
| po GOAL 1, **kopia scratch** bramki ze zdjętym `at.inButton === true` | **144 pass, 1 fail — `(B7)`** |

`(B7)` jest **pre-istniejące** — identyczne co do wartości na bazie i po zmianie
(`cardClientH:470`, `cardScrollH:690`), więc nie należy do tego tematu.

Trzy `(B6)` mają **jedną** przyczynę: strażnik nie wykonuje kliknięcia, więc dwie kolejne
asercje (karta boczna otwarta, obie karty widoczne) padają kaskadowo, nie z powodu
zachowania produktu. Produkt w tym scenariuszu działa — potwierdzone przebiegiem kopii
scratch (144/1) oraz osobno na żywym Chromium: asercja `(B6)` „wiersz ma fallback
`data-row-entity-*`" przechodzi, a klik w puste pole wiersza (60 px na prawo od przycisku)
nadal otwiera kartę docelową (`building/stolarnia`, głębokość 1→2).

## Dlaczego Operator się zatrzymał zamiast poprawić

Plik nie jest objęty allowlistą tematu (allowlista obejmuje
`gra/tools/improvement-card-callsites-test.cjs`, `gra/tools/civpedia-*-test.cjs` oraz
ewentualną NOWĄ bramkę). Edycja pliku spoza allowlisty to natychmiastowy `FAIL`
(`R-PROC-AUTOBOT.md` §9 poz. 2), niezależnie od jakości reszty pracy. Plik repo pozostał
**nietknięty** — dowód powstał na kopii roboczej w scratchpadzie, skasowanej po pomiarze.

## Czego ten dokument NIE rozstrzyga

Zgodnie z C-054 nie proponuję tu rozwiązania. Do rozstrzygnięcia pozostaje, czy sprawa jest
techniczna (rozszerzenie allowlisty / osobny temat na tę bramkę — wtedy decyduje
orkiestrator, `R-PROC-AUTOBOT.md` §10), czy wymaga decyzji właściciela. Skutek dla gracza
jest w obu wariantach identyczny i już przez właściciela wybrany: nazwa encji jest
przyciskiem, klik w dowolne miejsce wiersza nadal otwiera kartę.
