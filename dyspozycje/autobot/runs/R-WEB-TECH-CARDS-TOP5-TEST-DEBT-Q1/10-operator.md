# Operator — runda 1

STATUS: PASS — generator and real-render test pass with the approved content and current FALA 582 cards preserved.
DOMAIN: GAME / test debt
TEMAT: R-WEB-TECH-CARDS-TOP5-TEST-DEBT-Q1
BAZA: `2b0f49da4c6101a86652e7919f12cd4454d18fdb`.

## Zmiany

Właściciel zatwierdził dokładny tytuł Sztuka wojenna Top3: „Odblokowuje jednostki epoki Żelaza”, bez liczby. Konkretne pliki i pola dopisano do `00-dispatch.md` przed edycją.

Kanoniczny CSV synchronizuje tylko opisowe pola potrzebne generatorowi do odtworzenia kart z bieżącego HEAD po FALA 582:

- `Hutnictwo żelaza`: Top5 i odpowiadający dowód wskazują Kuźnię żelaza; CMZ zachowuje przygotowanie zapasu żelaza przed odblokowaniem jednostek przez Sztukę wojenną.
- `Obróbka żelaza`: CMZ kieruje do Sztuki wojennej, bez przedwczesnego rekrutowania jednostek.
- `Sztuka wojenna`: Top3 ma zatwierdzony tytuł, zachowany dowód rekrutacji z `units.json`/`production.ts` oraz istniejący w HEAD CMZ rekrutacji.

Porównanie pól CSV z bazą potwierdza zmiany wyłącznie w: Hutnictwo żelaza (`Top5`, `Dowod_plik_linia`, `Co_mozesz_zrobic_PROPOZYCJA`), Obróbka żelaza (`Co_mozesz_zrobic_PROPOZYCJA`) i Sztuka wojenna (`Top3`, `Dowod_plik_linia`, `Co_mozesz_zrobic_PROPOZYCJA`). Nie zmieniałem kosztów, prereq, statystyk, implementacji rekrutacji ani danych innych technologii. Historyczny snapshot implementacji pozostał nietknięty.

Wygenerowany `tech-cards-top5.json` różni się od bieżącego HEAD wyłącznie `csvSha256` oraz tytułem `Sztuka wojenna.top5[2]`; Top3 zachowuje dotychczasowe zdanie i dowód. Pozostałe karty i Sztuka wojenna CMZ pozostają identyczne z HEAD.

## Weryfikacja

- `node tools/gen-tech-cards-top5.cjs --check` z `gra/`: PASS.
- `node tools/tech-cards-top5-test.cjs` z `/usr/bin/chromium` przez tymczasowy preload shim Playwrighta: **595 pass, 0 fail**. Test używa `page.setContent`; nie wymaga `file://`.
- `git diff --check`: PASS.
- Blokada Chromium zwolniona po teście.

Następny krok: niezależna ewaluacja i final control. Commit/deploy/push: niewykonane.
