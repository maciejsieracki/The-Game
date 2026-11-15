# R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1 — obrona Operatora (runda 2/5)

STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-WEB-UI-RESOURCE-SOURCE-LEDGER-SHOTS-DOCS-PERF-Q1
GOAL: (1) zrzuty Chromium karty „Skąd zapasy”; (2) dokumentacja + wikiBundle; (3) pomiar wydajności 100 tur (mediana ≥5); (4) diagnoza endTurn timeout tura 57; (5) stan `<details open>`.
ZMIANY/COMMIT: baza 6168bc2c6 (rodzic 807ecebdd). Commit obrony: docs/encyklopedia/pojecia/skad-zapasy.md (tabela 19 rodzajów źródeł), docs/PORADNIK-GRACZA-SPIS-TRESCI.md (wpis §53a), gra/src/data/wikiBundle.json (regeneracja), runs/<ID>/30-obrona-claude.md. Kod gry nietknięty. SHA commitu: patrz pole sha w odpowiedzi orkiestratorowi.

## Odpowiedzi na zarzuty Evaluatora (edb7b1281)

1. PRZYJMUJĘ — zrzutów nie wykonano. Wymagają przebiegu gry w headless Chromium (sól, ceramika, 1280 i 1920 px) i obejrzenia ich. Nie zrobiono tego w tej rundzie. Brak katalogu runs/<ID>/evidence/. Status: NIE WYKONANO.
2. PRZYJMUJĘ — pomiaru 100 tur (mediana ≥5, ON/OFF) nie wykonano. Pojedynczy przebieg nie mieści się w limicie 590 s dla Bash, a przebiegów w tle nie używano (zakaz). Status: NIE WYKONANO.
3. PRZYJMUJĘ — diagnozy endTurn timeout w turze 57 nie wykonano (brak przebiegu 100 tur). Status: NIE WYKONANO.
4. PRZYJMUJĘ — pomiaru ani poprawki `<details open>` nie wykonano. Status: NIE WYKONANO.
5. PRZYJMUJĘ — runda zamknięta jako BLOCK; GOAL 1, 3, 4, 5 niewykonane.
6. PRZYJMUJĘ — w r1 bramki zostały oznaczone NIE_ZMIERZONO. W r2 zmierzono je ponownie na tym kandydacie (surowe wyjścia poniżej): `npx tsc --noEmit -p tsconfig.json` rc=0; `resource-ledger-test.cjs` 1030 passed, 0 failed; `resource-ledger-skad-ui-test.cjs` 18 passed, 0 failed; `resource-ledger-skad-dom-test.cjs` 9 passed, 0 failed. Pozostałe bramki (logic, tech-tree, research, unit-replace, combat) NIE_ZMIERZONO w tej rundzie.
7. PRZYJMUJĘ i NAPRAWIONO — skad-zapasy.md ma teraz tabelę wszystkich 19 członów `LedgerSourceKind` (gra/src/game/resource-ledger.ts, linie 18–37): teren, stolarnia, warzelnia, wycinka, konwersja, wejście receptury, spichlerz, utrzymanie budynków, utrzymanie jednostek, obywatele, budowa, rekrutacja, umowa wymiany, mennica, limit magazynu, łup bitwy, zwrot, przejęcie miasta, dar. Każdy wiersz ma opis z komentarza w kodzie. Dowód: `git diff` na docs/encyklopedia/pojecia/skad-zapasy.md (+28 linii).
8. PRZYJMUJĘ i NAPRAWIONO — dodano wpis **53a** do docs/PORADNIK-GRACZA-SPIS-TRESCI.md po §53.4 (przed „Część IX"), z odsyłaczem do hasła.
9. ODRZUCAM (dowód kodowy, nie test w przeglądarce) — gra/src/ui/markdownLite.ts: funkcja `esc()` (linia 8) zamienia `<` na `&lt;` i `>` na `&gt;`; `inlineFmt()` (linia 11) wywołuje `esc(s)` jako pierwszy krok, a akapity i komórki tabel idą przez `inlineFmt` (linie 36, 40). Zatem `<cywilizacja>` w haśle renderuje się jako tekst, a nie jako znacznik. Uwaga: nie sprawdzono tego renderowaniem w przeglądarce.
10. PRZYJMUJĘ (fakty do potwierdzenia przez orkiestratora) — `git cat-file -e 1947a3a33:gra/src/game/resource-ledger.ts` zwraca brak pliku; commit 2ebd3c189 (część A) jest przodkiem 807ecebdd, a NIE jest przodkiem 1947a3a33. Baza tej rundy to więc 6168bc2c6 na 807ecebdd, zgodnie z poleceniem „startuj od 6168bc2c6”. Wymaga potwierdzenia orkiestratora.

## Zmiany w tej rundzie (dowody)

- `git diff --check` (przed commitem): rc=0, czysto.
- `git diff --stat` względem 6168bc2c6: docs/encyklopedia/pojecia/skad-zapasy.md, docs/PORADNIK-GRACZA-SPIS-TRESCI.md, gra/src/data/wikiBundle.json, runs/<ID>/30-obrona-claude.md. Wszystkie w allowliście.
- Regeneracja: `node gra/tools/bundle-wiki-for-game.cjs` → `wikiBundle.json: 22 rozdz. + 183 haseł (~1299 KB)`. Powtórzenia regeneracji nie porównywano bajt w bajt w tej rundzie.
- `npm ci` w gra/ (worktree): added 71 packages.

## TESTY (surowe wyjście, ta runda)

- tsc: rc=0
- resource-ledger-test: `resource-ledger-test: 1030 passed, 0 failed`
- resource-ledger-skad-ui-test: `18 passed, 0 failed`
- resource-ledger-skad-dom-test: `9 passed, 0 failed`

## BLOKADY

- GOAL 1 (zrzuty), GOAL 3 (perf 100 tur, ≥5 powtórzeń), GOAL 4 (diagnoza endTurn t57), GOAL 5 (details) — NIE WYKONANE w tej rundzie. Powód: czas i limit Bash bez tła; brak przebiegu gry w Chromium.
- Baza: rozbieżność z 1947a3a33 (pkt 10).

## UWAGI-DLA-ORKIESTRATORA

- Diagnoza endTurn (GOAL 4) blokuje temat #415 (AI-UPKEEP-Q2) i #417 (harness ekonomii AI) — zgodnie z dopiskiem w jego rejestrze.
- Pomiar 100 tur wymaga rozbicia na wiele wywołań (`longrun-100-turns-leak-q1-measure.cjs --prepare` / `--run`, wznawialne), bo jeden przebieg przekracza 590 s.
- Brak utworzonych sesji, zadań ani harmonogramów w tej rundzie.

## RUNDY

2/5. Ostatni werdykt Evaluatora: FAIL-ZARZUTY (edb7b1281). Ta runda: BLOCK (4 z 5 celów niewykonane).

## NASTĘPNY KROK

Runda 3 (ten sam ID): (a) zrzuty Chromium soli i ceramiki, 1280 i 1920 px, w `runs/<ID>/evidence/`; (b) pomiar 100 tur w kawałkach, ON vs OFF, mediana ≥5; (c) diagnoza endTurn t57: porównanie z bazą sprzed księgi; (d) stan `<details open>`. Potwierdzenie bazy przez orkiestratora (pkt 10).

DEPLOY/PUSH: NIE WYKONANO
