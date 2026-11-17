# R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1 — obrona Operatora (odpowiedź na zarzuty Evaluatora 0c732bc03)

STATUS: PASS-WITH-NOTES (zarzuty 2 i 3 PRZYJĘTE i naprawione; zarzut 1 PRZYJĘTY jako NIE ZMIERZONO; zarzut 4 ODRZUCONY jako blokujący, z dowodem, rozstrzyga orkiestrator)
DOMAIN: GAME (dane, teksty kart, testy)
TEMAT: R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1
GOAL: Spichlerz II bez utrzymania 2 ceramiki; zużycie ceramiki Spichlerza I 10/turę, Spichlerza II 20/turę na miasto (jedna wypłata); karty i testy spójne z danymi.
ZMIANY-COMMIT: commit tej rundy (SHA w polu `sha`). Zmienione pliki w tej rundzie:
- `dyspozycje/analizy/karty-budynkow/budynki-top5.csv` (zarzut 2: w komórce Top1 Spichlerza dopisane „Spichlerz zużywa 10 ceramiki na turę.”)
- `gra/data/building-cards-top5.json` (REGENEROWANY `gra/tools/gen-building-cards-top5.cjs`, nie ręcznie; csvSha256 zaktualizowany)
- `gra/tools/card-text-corrections.cjs` (zarzut 3: pole `r:` wpisu Garncarstwo top5.2 — 25/turę zamienione na 10 (Spichlerz I) i 20 (Spichlerz II))
- ten raport.
`gra/src/data/wikiBundle.json`: BEZ ZMIAN w tej rundzie (regeneracja `gra/tools/bundle-wiki-for-game.cjs` nie zmienia pliku; zdania kart nie wchodzą do bundla).
Nie dotknięto: kodu gry (`gra/src`), WERSJE.md, manifestu, rust-port, `gra/data/econ-params.json`.

## Odpowiedzi na zarzuty Evaluatora

**Zarzut 1 — brak zrzutu Chromium karty Spichlerza I i II (kryterium c). PRZYJMUJĘ jako NIE ZMIERZONO.**
Dowód: zrzut wymaga `npm run build`/dev-serwera w `gra/`, a to jest zakazane w tym temacie (dispatch, R-PROC-AUTOBOT §9). Nie uruchamiałem. Do decyzji orkiestratora: zrzut po wdrożeniu na ROBOCZĄ albo osobny temat weryfikacji wizualnej.

**Zarzut 2 — karta Spichlerza I (`spichlerz.top5`) nie pokazuje zużycia 10 ceramiki/turę. PRZYJMUJĘ (poprawka + dowód + commit).**
Przed: `spichlerz.top5[0].zdanie` = „Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców.”
Po: „Bez Spichlerza (i Akweduktu) miasto nie urośnie ponad 5 mieszkańców. Spichlerz zużywa 10 ceramiki na turę.”
Źródłem jest CSV `budynki-top5.csv` (JSON jest generowany). Ręczna edycja samego JSON złamała `gen-building-cards-top5.cjs --check` (w tej rundzie zaobserwowano: check NIEZGODNY, `card-resource-purpose-test` G FAIL), więc poprawkę wykonano w CSV i wygenerowano JSON ponownie.
Wynik: `node gra/tools/gen-building-cards-top5.cjs` → „zapisano gra/data/building-cards-top5.json: 44 budynków”; `--check` → „--check OK”.
Karta Spichlerza Królewskiego (`spichlerz_ii`) pokazuje 20 ceramiki i 25 soli (bez zmian).

**Zarzut 3 — raport podaje building-upkeep-resources-test jako exit 0, a jest 47/1; pole `r:` Garncarstwa mówi 25/turę. PRZYJMUJĘ (korekta + dowód).**
Korekta raportu poprzedniego Operatora: test bez `node_modules` kończył się „esbuild not found” z exit 0 — to był błąd raportowania, nie wynik testu. Po podlinkowaniu `gra/node_modules` (symlink do innego worktree, poza commitem) surowy wynik: `building-upkeep-resources-test: 47 passed, 1 failed`, exit 1. Failing: `D10: karta uzywa polskich etykiet i odmian (bez surowych id)` — asercja na tekst `gra/src/ui/entityCards/buildingAdapter.ts`, którego ten temat nie zmienia (`git diff --name-only 10af8668 ea56e572` nie zawiera adaptera). Evaluator podał to samo na bazie 10af8668 (dług bazowy).
Pole `r:` naprawione: `gra/tools/card-text-corrections.cjs`, Garncarstwo top5.2 — teraz wskazuje 10/turę (Spichlerz I) i 20/turę (Spichlerz II). Uruchomienie `node gra/tools/card-text-corrections.cjs` → rc=0.

**Zarzut 4 — siedem plików poza literalną allowlistą. ODRZUCAM jako blokujący; decyzja orkiestratora (jawnie).**
Podstawa z dispatchu (DODATEK 1 orkiestratora): „karty i testy, które zakładały 2 ceramiki”, „Civpedia/karty Spichlerza/poradnik (grep „25 ceram”)”, „wikiBundle regeneruj narzędziem”, „testy, które zakładały 25 (grep: 25, spichlerz, drain, ceramikaI, ceramikaII)”. Pliki i powód:
- `budynki-top5.csv`, `building-cards-top5.json` — źródło i produkt generatora kart Spichlerza; DODATEK 1 wymaga, by karta Spichlerza I/II pokazywała nowe zużycie.
- `card-text-corrections.cjs` — korekta `r:` (zarzut 3) w liście korekt generatora kart.
- `resources.json` — pole `Uwagi` opisujące zużycie ceramiki Spichlerza („25 Ceramiki/t” → „10/20”): dokładnie „grep 25 ceram” z DODATKU 1.
- `card-resource-purpose-test.cjs` — asercja oczekująca 25 ceramiki Spichlerza, zaktualizowana do 10 (test, nie logika).
- `r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs` — pula testowa 25 → 10 (jedna wypłata Spichlerza I); intencja testu (brak dubla w tej samej turze) zachowana, komentarz to wyjaśnia.
Żaden z tych plików nie zmienia logiki gry.

## TESTY (surowe wyjścia z tej rundy)
Środowisko: `gra/node_modules` podlinkowane (symlink, poza commitem). Brak `npm run build`/`dev`.
- `git diff --check` → rc=0
- `node gra/node_modules/typescript/bin/tsc -p gra --noEmit` → exit 0
- `node gra/tools/gen-building-cards-top5.cjs --check` → „--check OK (dyspozycje/analizy/karty-budynkow/budynki-top5.csv)”
- `node gra/tools/bundle-wiki-for-game.cjs` → „22 rozdz. + 181 haseł (~1273 KB)”; `git diff --stat -- gra/src/data/wikiBundle.json` → pusty
- `node gra/tools/building-upkeep-ceramics-test.cjs` → „645 passed, 0 failed”, exit 0
- `node gra/tools/spichlerz-drain-keys-test.cjs` → „spichlerz-drain-keys-test: 56 pass, 0 fail”, exit 0
- `node gra/tools/spichlerz-drain-pipeline-test.cjs` → „spichlerz-drain-pipeline-test: 33 pass, 0 fail”, exit 0
- `node gra/tools/building-upkeep-resources-test.cjs` → „47 passed, 1 failed”, exit 1 (D10, dług bazowy, zob. zarzut 3)
- `node gra/tools/card-resource-purpose-test.cjs` → „101 pass, 2 fail”: [B] „utrzymanie budynku wciąż liczone w Pieniądzu” i [W] „buildingAdapter: wiersz plonu ... „Podatek”” — dług bazowy (adaptery nie zmienione). Bramka G (gen-check kart) PASS.
- Pozostałe bramki z dispatchu (logic 213, tech-tree 20, research 33, unit-replace 21, combat 6) i mutacje (przywrócenie 25 / pola `utrzymanie_surowce`): NIE PONOWIONE w tej rundzie. Zmiany tej rundy dotyczą tylko danych kart, CSV i tekstu korekt; wyniki Evaluatora z ea56e572 (bez regresji) nie są przeze mnie potwierdzone osobno.

## BLOKADY
- Zrzut Chromium karty Spichlerza I i II — NIE ZMIERZONO (zakaz build/dev w gra/). Zarzut 1 otwarty.
- `building-upkeep-resources-test` D10 oraz `card-resource-purpose-test` [B]/[W] — czerwone także na bazie 10af8668; dług poza tym tematem.
- Mutacje i pełne bramki referencyjne — NIE PONOWIONE w tej rundzie.

## Bilans epok (pytanie orkiestratora; arytmetyka, NIE ZMIERZONO w grze)
Pełna arytmetyka epoki Kamienia (Spichlerz I: 10 ceramiki/turę na miasto; Garncarnia baza 50/turę, bez mnożnika epoki) i epoki Brązu (Spichlerz Królewski: 20 ceramiki + 25 soli/turę) jest w `dyspozycje/autobot/runs/R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1/10-operator-claude.md`, sekcja „BILANS: EPOKA KAMIENIA I EPOKA BRĄZU”. Ta runda nie zmienia tej arytmetyki poza wartością Spichlerza II (25 → 20), którą ona już uwzględnia.

## RUNDY
Obrona rundy 1 (runda 2/5 tematu). Zarzuty Evaluatora 0c732bc03: 4 pozycje — 2 PRZYJĘTE i naprawione (2, 3), 1 PRZYJĘTY jako NIE ZMIERZONO (1), 1 ODRZUCONY z dowodem do decyzji orkiestratora (4). Ostatni werdykt Evaluatora: PASS-WITH-NOTES.

## NASTĘPNY KROK
Orkiestrator: (a) decyzja w sprawie zarzutu 4 — rekomendacja ACCEPT z uzasadnieniem powyżej; (b) zrzut Chromium Spichlerza I/II po wdrożeniu na ROBOCZĄ albo osobny temat; (c) dług D10 i [B]/[W] jako osobne tematy.

## DEPLOY/PUSH: NIE WYKONANO
