# R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1 — raport Operatora (runda 1/5)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (dane)
TEMAT: R-WEB-DATA-SPICHLERZ-II-REMOVE-CERAMICS-UPKEEP-Q1
GOAL: (1) usunąć utrzymanie 2 ceramiki ze Spichlerza Królewskiego (`utrzymanie_surowce`); (2) zużycie ceramiki: Spichlerz I 25→10, Spichlerz Królewski 25→20 na miasto na turę (decyzja właściciela 2026-11-14, DODATEK 1); sól II bez zmian (25).
BAZA: 10af866876efe84c695a9cf96bbebbb8c0232074 (origin/main), detached HEAD w worktree.

## ZMIANY (allowlista)
- gra/data/buildings.json — usunięte `utrzymanie_surowce: {ceramika: 2}` z `spichlerz_ii` (Akwedukt, Łaźnia, Port zostają).
- gra/data/econ-params.json — `budynek_spichlerz_zuzywa_ceramika` 25→10 (easy/normal/hard), `budynek_spichlerz_ii_zuzywa_ceramika` 25→20 (easy/normal/hard), `opis` zaktualizowane; `budynek_spichlerz_ii_zuzywa_sol` = 25 bez zmian.
- gra/src/game/building-resource-gate.ts — tylko komentarze. SPICHLERZ_DRAIN_FALLBACK_PER_TURN = 25 celowo bez zmian (używany tylko przy braku klucza).
- Karty/teksty (wynik zmiany danych; karty generowane z CSV): dyspozycje/analizy/karty-budynkow/budynki-top5.csv, gra/data/building-cards-top5.json (regenerowany `gen-building-cards-top5.cjs`), gra/data/tech-cards-top5.json, gra/data/resources.json, gra/tools/card-text-corrections.cjs.
- Dokumentacja: docs/encyklopedia/budynki/spichlerz.md, docs/PORADNIK-GRACZA/45-katalog-budynkow.md (dopisane zużycie ceramiki 10 / 20).
- gra/src/data/wikiBundle.json — regenerowany `tools/bundle-wiki-for-game.cjs`.
- Testy: gra/tools/building-upkeep-ceramics-test.cjs (3 budynki z polem, suma 6/t, spichlerz_ii bez pola), gra/tools/spichlerz-drain-keys-test.cjs (wartości realne 10/20/25, nowa sekcja [4]), gra/tools/spichlerz-drain-pipeline-test.cjs (golden na syntetycznych 25/25/25 + nowa sekcja [C] z realnymi wartościami), gra/tools/card-resource-purpose-test.cjs (25→10 / 20), gra/tools/r-wzrost-szczescie-dubel-wealth-ceramika-test.cjs (pula scenariusza 25→10, by zachować intencję: drugie miasto nie płaci).
- Brak zmian kodu gry poza komentarzami. WERSJE.md, manifest, rust-port nietknięte.

## TESTY (surowe wyniki z uruchomień w worktree)
- `npx tsc --noEmit` (gra/): exit 0, 0 linii wyjścia.
- Bramki referencyjne: logic-test exit 0 (PASS 213); tech-tree-test 20 pass / 0 fail; research-test 33/33; unit-replace-test exit 0; combat-test exit 0 ("All sanity checks passed").
- `git diff --check`: czysty (exit 0).
- building-upkeep-ceramics-test: 645 pass / 0 fail.
- spichlerz-drain-keys-test: 56 pass / 0 fail.
- spichlerz-drain-pipeline-test: 33 pass / 0 fail. GOLDEN-DIGEST sha256=9fe8c371221e194ae0590d0068400813a93e93fb5350984797c97e8ddcd555a2 (126 scenariuszy) — ten sam digest liczony na kopii bazy 10af866 (sekcja A na syntetycznych 25/25/25 nie zmienia się).
- spichlerz-hud-params-parity-test: 66 pass / 0 fail. owned-building-inactive-test: 4/0.
- upkeep-test: exit 0. building-upkeep-resources-test: exit 0.
- r-wzrost-szczescie-dubel-wealth-ceramika-test: 59 pass / 0 fail (po poprawce puli scenariusza; na bazie 59/0).
- card-resource-purpose-test: 100 pass / 2 fail. Oba FAIL są PRZED zmianą — powtórzone na kopii bazy 10af866: [B] „utrzymanie budynku wciąż liczone w Pieniądzu”, [W] „buildingAdapter: wiersz plonu ... Podatek”. Gen-check kart [G] przechodzi w worktree.
- Czerwone PRZED zmianą (ten sam wynik na bazie 10af866, potwierdzone na kopii): koszty-surowcowe-test 160/1 (mury_kamienne koszt), upgrade-budynki-test 60/1 (palisade completion), szczescie-przebudowa-skali-test 515 OK / 4 FAIL (44 vs 41 budynków). Nie są skutkiem tej zmiany.
- Zielone bez zmian: spichlerz-cap-citypanel-wiring 12/0, population-growth-v85-bonus 65/0, population-growth-v85 50/0, grupy-budynkow 83/0, eko-tech-paczka1 13/0, deposit-building-gate 50/0, granary2-tech-data-guard 14/0, resource-amount-chip-icons-real-render 29/0.
- NIE ZMIERZONO: Chromium (kryterium c — zrzut karty Spichlerza I/II) oraz mutacja „przywrócenie pola → czerwone" nie zostały wykonane w tej rundzie. Karta bierze dane z buildings.json i teksty z kart — zmiana jest w danych, nie w kodzie renderu.

## BILANS: EPOKA KAMIENIA I EPOKA BRĄZU (analiza arytmetyczna, NIE ZMIERZONO w grze)
Założenia: Garncarnia 50 ceramiki/turę (econ-params `budynek_garncarnia_przepustowosc`, baza; mnożnik epoki i wejście glina+drewno NIE uwzględnione); zużycie tylko z pól z tabeli.

Epoka Kamienia (Spichlerz I, bez utrzymania ceramiką):
- miasto tylko ze Spichlerzem I: 25 → 10 ceramiki/turę (−60%).
- jedna Garncarnia (50/t) wystarcza na 2 miasta przy 25/t → na 5 miast przy 10/t.
- Spichlerz I jest bramką bonusu ludności (brak ceramiki = brak bonusu). Bramka staje się łatwiej spełnialna, więc wczesny wzrost ludności nie zależy od pojedynczej Garncarni.

Epoka Brązu (Spichlerz Królewski + utrzymanie ceramiką):
- miasto ze Spichlerzem II bez innych budynków ceramicznych: 25 + 2 (utrzymanie) = 27 → 20 (−26%).
- miasto ze Spichlerzem II + Akwedukt + Łaźnia + Port (po 2 utrzymania każdy): 25 + 8 = 33 → 20 + 6 = 26 (−21%).
- Garncarnia (50/t) obsługuje takie miasto: przed ok. 1,5, po ok. 1,9.
- Sól II (25/t) bez zmian — w Brązie nadal główny koszt Spichlerza Królewskiego.
- Spichlerz II nadal ma zużycie ceramiki (drain); zdjęto tylko utrzymanie — stąd spadek, a nie zero.

Ryzyka dla orkiestratora: (a) Spichlerz staje się tańszy w ceramice → wcześniejsza inwestycja gracza i AI (parytet zachowany, bo wartości z JSON); (b) Garncarnia przestaje być wąskim gardłem w Kamieniu — karta Garncarstwa opisuje teraz 10/20; (c) dług Rust: REPIN parametrów drain — NIE wykonano.

## BLOKADY
- Chromium (kryterium c) i mutacja — NIE ZMIERZONO (patrz wyżej).
- Brak innych. Decyzje balansu już podjęte przez właściciela; progów ani fallbacku nie zmieniano.

## RUNDY
1/5 — zakończona, bez FAIL.

## NASTĘPNY KROK
Evaluator (SONNET): weryfikacja diffu względem allowlisty, testów i kryterium (c) w przeglądarce (Chromium). Orkiestrator: integracja po FC; REPIN Rust drain.

## UWAGI-DLA-ORKIESTRATORA
- `card-resource-purpose-test` ma dwa pre-existing FAIL ([B], [W]) również na bazie — osobny temat do rejestru.
- `koszty-surowcowe-test` (mury_kamienne: koszt ma też kamień i cegłę), `upgrade-budynki-test`, `szczescie-przebudowa-skali-test` (44 vs 41 budynków) — czerwone na bazie 10af866; osobne tematy długów.
- `wikiBundle.json` jest jednolinijkowy, stąd duży diff w `git diff`.

DEPLOY/PUSH: NIE WYKONANO
