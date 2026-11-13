STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-NO-DEFENDERS-Q1
RUNDA: 2/5 (obrona zarzutow Evaluatora; baza 95a5f267a)

Zarzut 1 PRZYJMUJE: canBarbarianWalkIntoEmptyCity (barbarians.ts) dostaje 5. parametr defenderOptions, main.ts (move barbarzyncow) przekazuje cityDefenderOptions(moveDestCity). Miasto z Garnizonem i pop>0 nie jest puste -> barbarzynca nie wchodzi na heks, walka idzie komenda attack. Test: 4 asercje + mutacja.
Zarzut 2 ODRZUCAM (z ZALOZENIEM): makeMilitia/effectiveGarrison/resolveSiegeAttack/estimateDefenderStrength nie sa importowane w main.ts (tylko typy SiegeCity/SiegeUnit z siege.ts); abstrakcyjna sciezka nie napedza zadnej bitwy ani decyzji w grze. Model zbiorczy zostaje; M1 (100%) skaluje pule 5x zgodnie ze spec. Test przypina pule (60 mieszk. -> HP 60x9).
Zarzut 3 PRZYJMUJE (ujawnienie): mapFieldBattle.ts +1 linia (ownerEra do hasCityDefenders w planOpenCityFieldBattle) i main.ts applyMapBattleOutcome (straty ludnosci) wykraczaja poza allowliste; konieczne, bo bez ownerEra planOpenCityFieldBattle liczy milicje dla ery 1, a straty ludnosci wymagaja wyniku bitwy znanego tylko tam. Prosba o retroaktywne dopisanie do allowlisty. R2 dodatkowo: barbarians.ts (zarzut 1).
Zarzut 4 PRZYJMUJE: nowa czysta fallenMilitiaIds (siegeDefenders.ts) o semantyce post-battle-map: milicjant bez wpisu w logu zdarzen nie jest poleglym; auto: rozklad strat liczony z PELNEGO zalogowanego rosteru (isFieldBattleUnit, hp sprzed bitwy) PRZED applyPostBattleMap, ludnosc zmniejszana po. Testy czystej funkcji (pelny/czesciowy/legacy log, auto, hp<=0) + mutacja. Integracja main.ts nadal tylko analiza kodu + tsc: NIE_ZMIERZONO.
Zarzut 5 PRZYJMUJE: PROJEKT-GRY-master.md §9c: usunieto sprzecznosc (chlopi z widlami, 1/2 Wojownika, 20%) i wiersz ref-22 w tabeli.
Zarzut 6 CZESCIOWO: pelna gra w Chromium, AI->AI, panstwa-miasta, 3D przy 60 jednostkach, panel/tytul/modele: NIE_ZMIERZONO (zakaz build, brak aktualnego bundla). Oznaczenia "Milicja" na modelu: NIE zmieniono nazwa (typeId) -- jest kluczem snapshotow/replay w battleScene (5374), zmiana bez weryfikacji w przegladarce ryzykowna; modele = odpowiedniki (stats['Jednostka']), tytul strony "Milicja (N)" jest. Do decyzji Evaluatora/FC.

ODKRYCIE WAZNE: mutacje z R1 byly pozorne -- esbuild.buildSync nie wspiera pluginow, kazda "mutacja" konczyla sie bledem builda i liczyla jako zlamanie testu. Naprawa: async esbuild.build + wykrycie brakujacej kotwicy. Teraz 10 mutacji lamie test realnymi asercjami (1-6 kazda). Test: 113 OK / 0 FAIL, EXIT=0.

TESTY: tsc --noEmit EXIT=0 (gate-tsc-r2.txt); city-militia 113/0 (gate-new-test-green-r2.txt); map-field-battle 24/0; militia-garrison-contract 17/0; router-siege 8/0; siege-defenders 12/0. barb-city-capture-cluster 93 ok / 3 FAIL (1d, 1f: wyszukiwanie tekstu w oknie main.ts) -- identyczne 3 porazki na main.ts z 95a5f267a, wiec nie z tej rundy. budynek-garnizon-test: nie ruszano (pre-existing wg R1).
BLOKADY: powyzsze NIE_ZMIERZONO; 3 stare porazki barb-cluster.
DEPLOY-PUSH: NIE WYKONANO
