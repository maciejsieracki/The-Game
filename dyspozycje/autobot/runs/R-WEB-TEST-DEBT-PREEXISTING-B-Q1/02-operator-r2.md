STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB) — dług testowy
TEMAT: R-WEB-TEST-DEBT-PREEXISTING-B-Q1
GOAL: partia 1 splaty listy B — cel min. 15 testow zielonych albo usunietych z uzasadnieniem. WYNIK: 13/15 zielone. Cel NIE osiagniety; reszta do rundy 3.
BAZA: a8823b16b (origin/main). Commit R1 cherry-pick: 4f97f5ac2 (oryginal ee602c2e8). Commit R2: patrz ZMIANY.
ZMIANY/COMMIT: allowlista: gra/tools/*-test.cjs (wskazane), dyspozycje/autobot/runs/R-WEB-TEST-DEBT-PREEXISTING-B-Q1/02-operator-r2.md. Zero zmian w gra/src, gra/data, gra-robocza, WERSJE.md, rust-port.

TABELA (test | klasa | akcja | dowod | przed -> po):
| unit-power-test | A | aktualizacja asercji (R1) | 37db6cdc4 Hastati 57.5 w units.json | 4/6 -> 6/6 |
| unit-replace-test | A | fixture +koszary (R1) | e06ad53c8 bramka Koszar | 12/15 -> 15/15 |
| unit-recruit-nazwa-test | A | fixture +koszary (R1) | e06ad53c8 | 16/17 -> 17/17 |
| unit-detail-card-entitycard-migration-test | A | asercja renderEntityCard(built) -> (cardData) (medalion 3D); asercja Uwagi odwrocona (Uwagi usuniete celowo) | 3cd2c34e0; 31a621d69 | 38/2 -> 40/0 |
| unit-info-card-army-interaction-test | A | literal ownerId===0 -> isMe(u.ownerId) | e9e6a3258 | 6/1 -> 7/0 |
| unit-info-card-wiring-test | A | ta sama zmiana isMe() | e9e6a3258 | 5/1 -> 6/0 |
| unit-power-sort-test | A | asercja 2x sortByUnitPowerDescending w cityPanel -> 1x sortRecruitListByEra (lista rekrutacji wg epok) | 6f61f1d70 | 12/1 -> 13/0 |
| unit-resource-upkeep-test | A | oczekiwane wartosci do units.json po balansie "half" (Wojownik drewno 3; Wlocznik braz 10; stock 50; 2x 20) | 4c1126de1 (units.json: utrzymanie 5->3, 10->5; Surowiec ilosc 50->25) x scaleCostByEpoch (Braz x2) | 3/4 -> 7/0 |
| forced-war-bronze-main-guard-test | - | bez zmian; zielony na biezacym main | run: 22 PASS 0 FAIL | -> 22/0 |
| forced-war-bronze-new-game-reset-test | - | bez zmian; zielony na biezacym main | run: 41 PASS 0 FAIL | -> 41/0 |
| forced-war-iron-main-guard-test | - | bez zmian; zielony na biezacym main | run: 35 PASS 0 FAIL | -> 35/0 |
| era-recruit-panel-refresh-test | A (harness drift) | dodane no-op stuby trimWarEventLog, emitOrDeferNotice, humanSeats do kontekstu vm (funkcja main.ts dostala nowe wywolania; asercje bez zmian) | ReferenceError: trimWarEventLog is not defined | crash -> 4/0 |
| ai-jednostki-tylko-zakup-test | A | D11: liczba wywolan advanceProduction 1 -> 2 (1 prognoza _livePracaForecast + 1 zuzycie); dodana asercja, ze pierwsze jest w bloku prognozy | b7fcfd3ce (prognoza liczy na kopii; production.ts zwraca nowe obiekty) | 43/1 -> 45/0 |

NIE ZIELONE (klasyfikacja wstepna, bez pelnego dowodu):
- eko-tech-paczka5 (1 FAIL: Kopalnia miedzi + Piec -> Braz): prawdopodobnie A wobec 2ebd0d7f0 (cyna = 3. skladnik Odlewni brazu). Proba poprawki fixture (drugi hex cyny) NIE domknieta, wiec cofnieta (git checkout). NIE_ZMIERZONO w wyniku.
- eko-tech-paczka1 (6 FAIL), paczka2 (3), paczka3 (2), paczka4 (2): NIE_ZMIERZONO klasy. paczka3 "AND: kopalnia miedzi + piec = brac" prawdopodobnie ten sam powod co paczka5 (do weryfikacji).
- ai-fog-test (W2, linia 79): kandydat na B — decideAITurn wydaje attack na e2 w (6,5), ktore NIE jest w visibleHexes; probe potwierdza komende {type:attack,unitId:a2,targetUnitId:e2}. Bramka mgly nie dziala na tej sciezce. Lokalizacja zrodla NIE_ZMIERZONO. Do osobnego tematu R-WEB-*.
- diplomacy-audience-close-flush-test (A4/A4f: 5 wywolan hideDiplomacyAudience zamiast 3 nazwanych): prawdopodobnie B (nowe nienazwane miejsce zamkniecia). NIE_ZMIERZONO.
- diplomacy-lista-podglad-przed-wizyta-test (6e, 52/1): NIE_ZMIERZONO.
- diplomacy-negotiation-table-test (57/58, "AI sklada kontroferte (slodzik)"): NIE_ZMIERZONO.
- diplomacy-package-ai-counter-actionable-test: blad uruchomienia (Node crash), NIE_ZMIERZONO.
- diplomacy-proposal-test: nie uruchomiony, NIE_ZMIERZONO.
- empire-armia-produkcja-test (44/7 z jsdom): NIE_ZMIERZONO.
- era-change-toast-defer-test (bloki 2,4,5 FAIL), era-cud-main-ts-integracja-test (blok 3c FAIL + MUT-FAIL M4): NIE_ZMIERZONO.
- auto-battle-simultaneous-test: blad harness (TypeError .delete w battleScene.ts:88836 przez stub _activateUnit): NIE_ZMIERZONO.
- ai-test (20 FAIL, 2927 linii) i ai-zdobycie-miasta-adiacencja-test: NIE_ZMIERZONO (nie klasyfikowane w tej rundzie).
- mgla-sciezka-inwariant-test: NIE_ZMIERZONO w tej rundzie; temat R-WEB-TEST-DEBT-MGLA-INWARIANT-NEW-SITES-Q1 NIE zalozony (tylko zapowiedz).
- Rodziny do partii 2: pozostale diplomacy-*, eko-tech-*, empire-*, era-*, auto-* (auto-fort-claim i autoimprove-* zakazane w tej partii).

BRAMKI:
- tsc --noEmit: EXIT 0, 0 linii bledow (finalne drzewo; node_modules dowiazany symlinkiem z sasiedniego worktree, tylko odczyt; symlink usuniety po pracy).
- logic-test: LOGIC OK (213/213).
- git diff --check: patrz wynik w raporcie orkiestratora (uruchamiany przed commitem).

BLOKADY:
- Partia 1 nie domknieta (13/15). Do rundy 3: eko-tech-paczka1-5 (klasyfikacja), ai-test (20 FAIL), ai-zdobycie, diplomacy-*, era-cud/era-change, empire-armia-produkcja, auto-battle-simultaneous.
- Dysk: start 3.1 GB wolnego wg rundy 1; w tej rundzie wolne miejsce spadalo do ~0.4 GB (node_modules innych sesji znikaly) i wrocilo do 3.8 GB. Nie kopiowano node_modules; tylko symlinki do cudzych katalogow, read-only.
- Srodowisko: testy eko/diplomacy/empire wymagaja jsdom; zainstalowany tylko w katalogu tymczasowym poza repo.

RUNDY: 2/5 (partia 1, runda 2)
NASTEPNY KROK: Evaluator (Sonnet) weryfikuje 11 zmian asercji (klasy A z dowodami) oraz zmiane harnessu era-recruit. Runda 3: klasyfikacja eko-tech-paczka1-5 (zaczac od cyny, 2ebd0d7f0), ai-test, potem diplomacy-*.
DEPLOY/PUSH: NIE WYKONANO
