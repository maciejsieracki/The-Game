STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: AI pilnuje kazdego miasta co najmniej jedna jednostka wojskowa (wojna/zagrozenie): zostaje 1 garnizon, puste miasta dostaja rekrutacje najtanszej jednostki.
ZMIANY/COMMIT: kandydat ed8c91142519b4c5883a4351dbefeff101f424f1 (potomek bazy 235ad7b4d i origin/main fadf21af9 - sprawdzone merge-base --is-ancestor). Diff vs origin/main: gra/src/game/ai.ts (+80/-2: emptyCityGarrisonRecruitIds, polecenia build garnizonu z priorytetem, garnizon 1/miasto w applyWarAllInCapitalToCommands), testy ai-war-city-garrison-test/-measure, dopasowane asercje scattered-merge/replacement-concentration, haki w ai-war-defend-home-sim.cjs, raporty. main.ts nie ruszony.
TESTY (surowe, wlasne, Node 22, npm ci):
- tsc --noEmit: exit 0
- ai-war-city-garrison-test 20/0; ai-war-defend-home-test 30/0; ai-army-scattered-merge-test 33/0; ai-army-all-civs-general-muster-test 26/0
- ai-army-replacement-concentration-test 34/1 (atrybucja) - IDENTYCZNIE na czystym origin/main (34/1) = dlug bazowy
- 5 bramek referencyjnych + unit-power: logic 213/213, tech-tree 20/20, research 33/33, unit-replace 21/21, combat 6/6, unit-power 6/0 - zielone
- determinism-same-seed-test PASS; load-game-regression-test 34/0
- pomiar ai-war-city-garrison-measure (Node, MODEL zakupu): wojna, odsetek pustych miast PRZED/PO t10 62.5/0, t30 58.3/0, t60 55.1/0, t100 39.3/0; pokoj 87.5/87.5 (bez zmian, zgodnie z regula: poza wojna nie wymuszamy); czas tury AI wojna 48.95 -> 53.6 ms, pokoj 3.73 -> 3.96 ms; zdobyte w 30 turach 0.33 -> 0.33.
WERDYKTY ZARZUTOW:
1 ODDAL (nota): rdzen ma pokrycie (G4, MUTACJA G, G10/G10b na realnym units.json); gleboka mutacja galezi zastapienia produkcji bojowej to dlug testowy, nie defekt kodu.
2 ODDAL jako NIE ZMIERZONE (nota): ai.ts emituje standardowe polecenia 'build' przechodzace istniejace bramki zakupu w main.ts (main.ts bez zmian); brak pomiaru w zywym Chromium/main.ts - NIE ZMIERZONO.
3 ODDAL (nota): kryterium "mniej zdobytych miast" nie rozstrzygniete (0.33 vs 0.33, uproszczony model walki); kryterium pilnowania (odsetek pustych) spelnione w modelu.
4 ODDAL: martwa zmienna usunieta w 9d8e8812a; ai-war-defend-home-sim.cjs (+3/-2, haki opcjonalne, test 30/0) poza wzorcem allowlisty - nieszkodliwe, do wiadomosci orkiestratora; pomiar PRZED to mutacja jednej linii.
5 ODDAL jako ryzyko NIE ZMIERZONE: stala 'Wojownik' (Kamien, bez techu, 5 PN + drewno); brak drewna odrzuci polecenie - nie regresja, bo wczesniej puste miasta nie byly uzupelniane wcale. Dlug: wybor najtanszej dostepnej jednostki per cywilizacja/epoka.
BLOKADY: brak.
RUNDY: FC r4/5
NASTEPNY KROK: orkiestrator integruje ed8c91142519b4c5883a4351dbefeff101f424f1 (potomek main; po dodaniu raportu FC SHA raportu podany w wyniku) - do listy deployu dopisac ai-war-city-garrison-test.cjs i -measure.cjs.
UWAGI-DLA-ORKIESTRATORA: dlug Rust REPIN: emptyCityGarrisonRecruitIds, applyWarAllInCapitalToCommands (garnizon 1/miasto), kolejnosc polecen build garnizonu; fixtury ai-war-city-garrison-test G1-G10b. Dlug testowy: fixture budynku dla galezi zastapienia produkcji; zywy pomiar w Chromium.
DEPLOY/PUSH: NIE WYKONANO
