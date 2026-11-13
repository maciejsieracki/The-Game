# Evaluator — runda 1

STATUS: PASS — zatwierdzona treść kart jest spójna z kanonicznym CSV i generatorem; niezależny test renderowania przeszedł.
DOMAIN: GAME / test debt
TEMAT: R-WEB-TECH-CARDS-TOP5-TEST-DEBT-Q1
BAZA: `2b0f49da4c6101a86652e7919f12cd4454d18fdb` (wskazana przez Operatora).

## Niezależny przegląd zakresu

Porównałem CSV z bazą wskazaną w dispatchu. Zmieniły się wyłącznie zatwierdzone pola: `Hutnictwo żelaza` (`Top5`, `Dowod_plik_linia`, `Co_mozesz_zrobic_PROPOZYCJA`), `Obróbka żelaza` (`Co_mozesz_zrobic_PROPOZYCJA`) oraz `Sztuka wojenna` (`Top3`, `Dowod_plik_linia`, `Co_mozesz_zrobic_PROPOZYCJA`). Nie zmieniły się koszty, prerekwizyty, dane rankingu ani pozostałe pola kart.

Po zamaskowaniu dozwolonych różnic `_meta.csvSha256` i `Sztuka wojenna.top5[2].tytul`, wygenerowany JSON jest identyczny z bazowym JSON-em. Zatwierdzony tytuł brzmi dokładnie „Odblokowuje jednostki epoki Żelaza”; zdanie i dowód Top3 pozostały zgodne z istniejącą kartą. Nowa asercja testowa sprawdza ten dokładny tytuł bez liczby. `gen-tech-cards-top5.cjs` i mechanika gry nie zostały zmienione.

Sprawdziłem także odpowiadającą temu mechanikę: dostępność jednostki jest filtrowana przez odblokowaną technologię w `production.ts`, a rekrutacja z epoki Brązu i późniejszych wymaga Koszar lub ich ulepszenia; jednostki żelazne wymagają ponadto zapasu żelaza. Zmiana CSV przygotowuje zapas przed Sztuką wojenną, a czynność przy Sztuce wojennej opisuje rekrutację po odblokowaniu. Nie widzę regresji reguł ani nieuzasadnionej liczby jednostek.

## Weryfikacja

- `node tools/gen-tech-cards-top5.cjs --check` z `gra/`: PASS.
- `NODE_OPTIONS='--require=/tmp/codex-system-chromium.cjs' node tools/tech-cards-top5-test.cjs` z `gra/`: **595 pass, 0 fail**; test uruchomił systemowy Chromium i korzysta z `page.setContent`.
- `git diff --check` dla trzech plików z allowlisty: PASS.

## Obiekcje i ograniczenia

Nie zgłaszam obiekcji do zakresu ani implementacji. Niezależna weryfikacja obejmuje generator kart, wskazany test przeglądarkowy oraz przegląd źródłowych pól i bramek rekrutacji; nie uruchamiałem pełnej gry ani nie symulowałem każdej cywilizacji i każdej konfiguracji miasta.

Nie edytowałem ani nie stagedowałem pozostałych, niezwiązanych plików roboczych. Commit/deploy/push: niewykonane.
