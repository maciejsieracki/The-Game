STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-PLACEMENT-SAME-RULES-AS-CITY-Q1
GOAL: fort/posterunek nie wchodzi w cudzy zasieg (miasto albo fort) tak jak miasto; bez zmiany promieni, kosztow, liczb.
ZMIANY/COMMIT: gra/src/game/fort-territory.ts (nowy wspolny werdykt isFortBuildBlockedByForeignTerritory); gra/src/map/improvement-build.ts (galaz 'fort' uzywa werdyktu; import); gra/tools/fort-placement-same-rules-as-city-test.cjs (NOWY); ten raport. Commit: SHA w polu sha.
TABELA RÓŻNIC (z kodu, baza d6203ad7e):
| regula | miasto | fort | posterunek |
| wlasnosc heksu (territoryOwnerAt) | musi byc wlasne (withinTerritory) i nie w cudzym forcie (isHexInForeignFortTerritory) | cudzy owner blokuje (rivalCityTerritory, improvement-build.ts) | musi byc wlasne |
| przyleganie do granicy | n/d | n/d | wymagane (isOutpostPlacementAllowed) |
| wolny teren | NIE | TAK (wlasna jednostka na hexie) | NIE |
| odl. od miast | MIN_CITY_DISTANCE | n/d | n/d |
WNIOSEK: regula wlasnosci terytorium JUZ BYLA ta sama (cudzy owner blokuje fort w gracz/AI/automat; ai.ts expansion tez). Zmiana = jeden wspolny werdykt zamiast inline. Roznice wolnego terenu i wymogu wlasnego terytorium ZACHOWANE (dispatch: zachowac, co nie koliduje). Rozstrzygniecie ZALOZENIEM, bez DECISION_REQUIRED.
TESTY:
- fort-placement-same-rules-as-city-test: 23 passed, 0 failed (siatka 1445 heksow, niezgodnosci 0)
- mutacja (werdykt = false) w kopii src: 18 passed, 5 failed — CZERWONA
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/0; unit-replace 21/21; combat 6/6
- fort-outpost-placement-rules 40/0; fort-strazniaca 82/0; fort-outpost-hard-territory 92/0; city-founding-no-fort-takeover 27/0
- auto-fort-claim 66 passed, 2 failed (pre-existing, zgodne z dispatchem)
- ai-territory-race-test 29 OK / 0 FAIL
WPLYW NA AI: zmiana czysto refaktoryzacyjna (ten sam werdykt). Liczba fortow/posterunkow AI PRZED/PO: NIE ZMIERZONO (bieg dymny AI 90 tur seed 4242 nie uruchomiony w tym przebiegu); przewidywany wplyw zerowy.
DOWOD W PRZEGLADARCE: NIE ZMIERZONO (brak bundla vite i Chromium w tej rundzie).
BLOKADY: bieg dymny AI i bundle — NIE ZMIERZONO.
RUNDY: 1/5
NASTEPNY KROK: Evaluator — przeglad diffu i werdykt zachowania (wolny teren dla fortu, wymog wlasnej jednostki). Pelna zgodnosc z miastem (fort tylko we wlasnym terytorium) zmienilaby zasady gry, wiec nie wprowadzalem jej bez potwierdzenia.
UWAGI-DLA-ORKIESTRATORA: main.ts (AI build ok. l.47990 i walidacja gracza assertPlayerTerritoryForBuild) nadal ma wlasne inline sprawdzenia tej samej reguly — poza allowlista tematu, celowo nietkniete.
DEPLOY/PUSH: NIE WYKONANO
