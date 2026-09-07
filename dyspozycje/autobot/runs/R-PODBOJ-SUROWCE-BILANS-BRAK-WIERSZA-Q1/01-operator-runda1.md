STATUS: PASS
DOMAIN: GAME
TEMAT: R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1
GOAL: Popup "Bilans zdobycia" pokazuje TAKŻE surowce zdobyte razem z miastem
(city.surowce PRZED zmianą ownerId), zero zmiany mechaniki transferu, zero
zmiany wiersza "Pula pracy".

ZMIANY/COMMIT: gałąź autobot/R-PODBOJ-SUROWCE-BILANS-BRAK-WIERSZA-Q1,
commit 1876c216 (2 pliki: gra/src/main.ts, gra/tools/miasto-zdobycie-raport-test.cjs).

- `CityCaptureReportInput` dostaje opcjonalne pole `surowce?: Record<string, number>`.
- `buildCityCaptureReportRows()`: nowy blok tuż po wierszach "Ludność"/"Budynki" (grupa
  `przejete`, PRZED sekcją łupu) — jedna pozycja na każdy niezerowy klucz `input.surowce`,
  etykieta z ISTNIEJĄCEGO słownika `stockResourceLabel`/`STOCK_RESOURCE_LABEL`
  (game/building-stock-cost.ts, import rozszerzony o `EMPIRE_STOCK_RESOURCE_KEYS` — ten
  sam plik już był importowany po `stockResourceLabel`), kolejność wg
  `EMPIRE_STOCK_RESOURCE_KEYS` + fallback na dowolne inne klucze spoza tej listy. Zera
  pominięte (ta sama zasada co reszta funkcji). Wartość floorowana (`Math.floor`).
  Celowo NIE gated przez `barbarzyncaZdobywca` — mechanizm transferu (zmiana `ownerId`)
  nie rozróżnia barbarzyńcy, więc raport też nie (kontrola w teście 13f/13g).
- Wszystkie 4 wywołania `buildCityCaptureReportRows()` w main.ts (L13564 kapitulacja
  głodowa, L26689 stolica, L26750 eliminacja, L27161 zwykłe miasto) dostają
  `surowce: city.surowce`. Zweryfikowano ręcznie (recon), że między zmianą `city.ownerId`
  a każdym z tych wywołań NIC nie modyfikuje `city.surowce` (`capital-capture.ts`,
  `seedCityOwnerDefaults`, `syncCityGarnizon` — żadne nie dotykają tego pola), więc
  odczyt w miejscu wywołania jest równoważny odczytowi "przed zmianą ownerId".
- `gra/src/ui/cityCaptureNotice.ts`: BEZ ZMIAN — render wierszy jest generyczny
  (label/value/tone/group), nowa grupa `przejete` już się renderuje.
- `capital-capture.ts`: BEZ ZMIAN (zakaz z dispatchu). Wiersz "Pula pracy": BEZ ZMIAN.

TESTY:
- `node ./node_modules/typescript/bin/tsc --noEmit` w `gra/` → 0 błędów.
- `node tools/miasto-zdobycie-raport-test.cjs` → 105/105 PASS (96 istniejących + 9 nowych
  w sekcji 13). ŻYWY DOWÓD z konkretnymi liczbami:
    13a: wiersz "Drewno" = "+42" (z `surowce: { drewno: 42, kamien: 0, zelazo: 7 }`)
    13b: wiersz "Żelazo" = "+7"
    13c: "Kamień" (wartość 0) NIE tworzy wiersza
    13f: barbarzyńca-zdobywca WIDZI "Glina" = "+13" (kontrola 13g: złoto ze skarbca
         nadal NIE przechodzi na barbarzyńców — bez zmian)
    13i: `surowce: { drewno: 3.9 }` → wiersz "Drewno" = "+3" (floor)
  Test rozszerzony o shim doklejający STOCK_RESOURCE_LABEL/EMPIRE_STOCK_RESOURCE_KEYS/
  stockResourceLabel (ten sam fragment źródłowy z building-stock-cost.ts) do izolowanego
  BLOKU CZYSTEGO main.ts (który nie importuje modułów) — zero zdublowanego słownika nazw.
- Nietautologiczność potwierdzona ręcznie: tymczasowa mutacja `if (input.surowce)` →
  `if (false && input.surowce)` w main.ts wywołała TypeError/crash testu (rows null tam,
  gdzie oczekiwano wiersza surowca) — sekcja 13 rzeczywiście czerwienieje po zepsuciu
  źródła. Kod przywrócony przed commitem, zweryfikowany diff-em.
- 5 bramek referencyjnych: logic-test (213/213), tech-tree-test (19/19), research-test
  (33/33), unit-replace-test (13/13), combat-test (6/6) — wszystkie zielone.
- Sąsiednie testy tego samego obszaru: eliminacja-lup-kwoty-test.cjs (35/35),
  capital-capture-test.cjs (86/86) — bez regresji.
- Żywy zrzut z przeglądarki (Playwright/Chromium): NIE WYKONANY w tej rundzie — dispatch
  dopuszcza alternatywę "istniejąca bramka renderująca ten popup" (spełniona przez sekcję
  8 miasto-zdobycie-raport-test.cjs, dowód strukturalny: 3 wiersze → 3 osobne elementy
  `.civ-ccn-row` z rozłącznymi span-ami etykieta/wartość, plus render surowca konkretnie
  nie sprawdzony w tej sekcji renderu — jeśli Evaluator uzna to za niewystarczające wobec
  klauzuli "dla tematów wizualnych" ogólnej normy, proszę o wskazanie tego jako
  konkretnego defektu do rundy 2, nie generyczne "brak dowodu").

BLOKADY: brak.

RUNDY: 1/5

NASTĘPNY KROK: Operator → Evaluator.
DEPLOY/PUSH: NIE WYKONANO
