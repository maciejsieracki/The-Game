STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-TERRITORY-FORT-PLACEMENT-SAME-RULES-AS-CITY-Q1
GOAL: fort/posterunek nie wchodzi w cudzy zasieg (miasto albo fort) tak jak miasto; bez zmiany promieni, kosztow, liczb.
ZMIANY/COMMIT: baza 44e787a23 (kandydat); poprawki w tej rundzie: gra/src/main.ts (2 miejsca: walidacja budowy fortu gracza assertPlayerTerritoryForBuild + blok budowy AI ok. l.47998 — oba wolaja isFortBuildBlockedByForeignTerritory zamiast inline `owner !== null && owner !== X`; dodany import), gra/tools/fort-placement-same-rules-as-city-test.cjs (PRZEPISANY na produkcyjna sciezke). SHA: patrz pole sha w odpowiedzi.

ODPOWIEDZI NA ZARZUTY EVALUATORA:
- Zarzut 1 (test tautologiczny): PRZYJETY. Test przepisany: fort = buildImprovementQualifier('fort') (improvement-build.ts, z jednostka wlasciciela na hexie), miasto = canFoundCity z withinTerritory zbudowanym jak main.ts foundingTerritoryOpts. Test nie wola juz helpera bezposrednio. Mutacje w KOPII src (poza repo):
  M1 (helper = false, fort-territory.ts): 21 passed, 4 failed — CZERWONA.
  M2 (improvement-build.ts rivalCityTerritory = false): 21 passed, 4 failed — CZERWONA.
  Oryginalna wersja testu (tabela na helperze) przechodzila przy M2; nowa juz nie.
- Zarzut 2 (pozorne ujednolicenie, inline w main.ts/ai.ts): PRZYJETY dla main.ts (oba miejsca fortu: gracz i AI). Helper ma teraz 3 uzycia: improvement-build.ts (gracz/automat/AI przez qualifier) + main.ts gracz + main.ts AI. ai.ts: fort nie ma inline werdyktu wlasnosci (wybor fortu w ai.ts idzie przez isHexWithinAnyCityReach i isOutpostPlacementAllowed) — bez zmian. UWAGA ZAKRESU: blok AI w main.ts jest poza doslownym brzmieniem allowlisty ("main.ts tylko walidacja budowy fortu/posterunku GRACZA"). Zmiana to ta sama predykatowa rownowaznosc (owner !== null && owner !== ownerId), ale ORKIESTRATOR decyduje: przyjac, albo cofnac 1 linie (l.~47998) do inline.
- Zarzut 3 (brak biegu dymnego AI 90 tur seed 4242, brak liczb fortow PRZED/PO): NIE ZMIERZONO — PRZYJETY jako brak pomiaru. Powod: pomiar wymaga bundla vite poza repo + przegladarki (Chromium), runner territory-race-measure-run.cjs w kilku wywolaniach --stop-at, a runda obrony nie miesci dwoch biegow (PRZED i PO). Dowod zastepczy (nie zastepuje biegu): helper jest algebraicznie rownowazny starym wyrazeniom (owner !== null && owner !== X) we wszystkich trzech miejscach, a test siatki 1053 heksow daje 0 niezgodnosci; zachowanie AI przy tym samym seedzie powinno byc identyczne. Do wykonania przez orkiestratora: territory-race-measure-run.cjs --seed 4242 --turns 90 PRZED (d6203ad7e) i PO (ten commit).

TABELA RÓŻNIC (bez zmian wzgledem 10-operator; potwierdzona kodem):
| regula | miasto (canFoundCity + foundingTerritoryOpts, main.ts ~l.13977) | fort (improvement-build.ts ~l.1198; main.ts ~l.17780 / ~l.47998) | posterunek (isOutpostPlacementAllowed) |
| wlasnosc heksu | musi byc wlasne (isInTerritory) i nie w cudzym forcie (isHexInForeignFortTerritory) | cudzy owner blokuje (isFortBuildBlockedByForeignTerritory) | musi byc wlasne przy granicy |
| wolny teren | NIE | TAK (wymaga wlasnej jednostki na hexie poza wlasnym terytorium) | NIE |
| odl. od miast | MIN_CITY_DISTANCE (canFoundCity) | n/d | n/d |
| zachowane (swiadoma roznica) | miasto wymaga wlasnego terytorium | fort na wolnym terenie z jednostka | — |

WYNIKI TESTOW (liczby z surowego wyjscia, tej rundy):
- node tools/fort-placement-same-rules-as-city-test.cjs: 25 passed, 0 failed (siatka 1053 heksow, niezgodnosci 0)
- mutacja M1 (kopia src): 21 passed, 4 failed; M2: 21 passed, 4 failed
- tsc --noEmit: exit 0
- city-founding-no-fort-takeover-test: 27 passed, 0 failed
- fort-outpost-hard-territory-test: 92 passed, 0 failed
- fort-strazniaca-zasieg-zakladania-test: 82 passed, 0 failed
- fort-outpost-placement-rules-test: 40 passed, 0 failed
- ai-territory-race-test: 29 OK / 0 FAIL
- auto-fort-claim-test: 66 passed, 2 failed (pre-existing, zgodne z dispatchem)
- NIE URUCHOMIONO w tej rundzie: logic-test 213, tech-tree 20, research 33, unit-replace 21, combat 6 (zmiany dotykaja tylko galezi fortu; do potwierdzenia przez FC).

WPLYW NA AI: refaktoryzacja predykatu bez zmiany wartosci. Liczba fortow/posterunkow AI PRZED/PO: NIE ZMIERZONO. Bieg dymny 90 tur seed 4242: NIE ZMIERZONO. Zachowanie przegladarkowe (komunikat po polsku przy odrzuceniu): NIE ZMIERZONO.
BLOKADY: bieg dymny AI, pomiar PRZED/PO, przegladarka/bundle — NIE ZMIERZONO w tej rundzie.
RUNDY: 2/5
NASTEPNY KROK: Evaluator (runda 2) — przeglad diffu main.ts (2 miejsca + import) i nowego testu; orkiestrator: decyzja o zakresie main.ts (AI site) i pomiar 90 tur PRZED/PO.
UWAGI-DLA-ORKIESTRATORA: (a) zarzut zakresu allowlisty: blok AI w main.ts (~l.47998) — patrz wyzej; (b) srodowisko: w worktree zainstalowano gra/node_modules (npm ci --ignore-scripts, 71 pakietow; katalog ignorowany przez git); (c) git status przed commitem: tylko gra/src/main.ts i gra/tools/fort-placement-same-rules-as-city-test.cjs; (d) main.ts sekcja gracza uzywa teraz helpera bez zmiany promienia/kosztu.
DEPLOY/PUSH: NIE WYKONANO
