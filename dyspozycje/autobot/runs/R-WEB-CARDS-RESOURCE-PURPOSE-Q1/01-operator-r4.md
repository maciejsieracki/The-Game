STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CARDS-RESOURCE-PURPOSE-Q1
GOAL: Każda pozycja TOP 5 opisująca produkcję/przerób surowca wyjaśnia, do czego surowiec służy; teksty zgodne z regułą PODATEK/PIENIĄDZ; (runda 2/5, DODATEK 4) katalogi zbiorcze CIVPEDIA/PORADNIK nie mówią „+N złoto” przy produkcji budynków i ulepszeń (klasa A).

## Baza
d4dd3982f (obrona r2; FC 286e66759 na gałęzi web-wip/CRES). Zakres rundy: wyłącznie zarzut 1 FC (DODATEK 4).

## ZMIANY/COMMIT
- docs/PORADNIK-GRACZA/28-katalog-ulepszen.md — Obóz łowiecki, Warzelnia soli (tabela + akapity + „Bonus”): „+N złoto” -> „+N podatek”.
- docs/PORADNIK-GRACZA/45-katalog-budynkow.md — Port handlowy, Magazyn, Sąd, Prawo regionalne i pozostałe wiersze/akapity „Bonus / Na poziomie 1 daje” (15 trafień): „+N złoto” -> „+N podatek”; etykieta kategorii „Pieniadz” -> „Podatek” (wiersze Port, Magazyn, akapity 119, 223).
- gra/src/data/wikiBundle.json — przebudowany generatorem `node gra/tools/bundle-wiki-for-game.cjs` (bez ręcznej edycji; przed zmianami generator dawał zerowy diff).
- gra/tools/gen-poradnik-batch.py — etykieta `pieniadz` w `bonus_str`: „złoto” -> „podatek” (regeneracja katalogów nie cofnie zmiany).
- gra/tools/card-resource-purpose-test.cjs — nowe testy [A]: PORADNIK 28/45 bez „+N złoto/złota” i z „+N podatek”; wikiBundle.json: każde „+N złoto/złota” musi być wyjątkiem klasy B (opis w komentarzu); Obóz łowiecki i Warzelnia soli dają podatek w bundlu.
- SHA commitu: w odpowiedzi orkiestratora (commit zawiera ten raport).

## Klasyfikacja pozostałych trafień „+N złot*” (zostają)
| plik | trafienie | klasa | powód |
|---|---|---|---|
| 91-katalog-cudow-antyk.md (6 wierszy), 15-kultura-religia-cuda.md:182 | „+3 złoto … × każde miasto” cudów | C -> B (ZAŁOŻENIE) | rozstrzygnięcie DODATKU 4: bonus `pieniadz` cudów = dochód z tras do skarbca (wonders-data.ts:250-262), zostaje |
| encyklopedia/pojecia/bogactwo.md:41 | „+2 złota/t” z suwaka zamożności | B | pieniądz/skarbiec po podziale podatku |
| 08/03/00/04 PORADNIK („przyrost złota”, utrzymanie w złocie) | stan skarbca, utrzymanie | B | bez zmian |
| 28:6, 45:8 | „Płacisz pracą — nie złotem”, „utrzymanie — złoto” | B | koszty/utrzymanie ze skarbca |
| referencje/civ7/*.csv | referencja zewnętrzna (Civ VII) | poza zakresem | niewidoczne dla gracza |

ZAŁOŻENIE (autonomia, DODATEK 4): bonus `pieniadz` cudów oraz „+1 pieniądza za trasę morską” Portu zostają jako „Pieniądz”/„Dochód z tras” — bez zmian.

## TESTY
- tsc --noEmit (gra; node_modules podlinkowane tylko do odczytu z innego worktree, link usunięty): 0 błędów
- tools/logic-test.cjs: LOGIC OK 213/213
- card-resource-purpose-test: 96 pass, 0 fail (w tym nowe [A])
- building-cards-top5-test 1179/0; tech-cards-top5-test 594/0; terminology-trade-vs-tax-test 779/0; civpedia-karty-spojnosc-q1-c-test 24 PASS/0; civpedia-wikihubhud-rys-historyczny-duplikacja-test ALL GREEN; pr141-matrix-only-data-wiki-test OK
- `--check`: gen-tech-cards-top5 OK, gen-building-cards-top5 OK
- civpedia-karty-nazwa-przyciskiem-test: 25 pass, 2 FAIL — „karta BUDYNKU: liczba linków krzyżowych = 0” (link „Obróbka drewna” z buildingAdapter.ts:279, git blame 2026-09-08; nie dotykany tą rundą). NIE_ZMIERZONO, czy FAIL istniał przed r1 (komunikat testu: „stan zastany”) — do oceny Evaluatora.
- Chromium: nie uruchamiano (zmiany wyłącznie tekstowe docs/wikiBundle) — NIE_ZMIERZONO.

## BLOKADY
Brak. Uwaga procesowa: katalog runu nie istniał na bazie d4dd3982f (dispatch leży na gałęzi claude/sprawdzenie-funkcjonalnosci-ek4ra0); raport go utworzył.

## RUNDY
2/5 (numeracja raportu: r4 wg DODATKU 4)

## NASTĘPNY KROK
Evaluator -> Obrona -> Final Control.

## DEPLOY/PUSH: NIE WYKONANO
