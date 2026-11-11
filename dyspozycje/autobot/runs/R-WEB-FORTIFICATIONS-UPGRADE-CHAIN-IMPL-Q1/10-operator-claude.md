STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-FORTIFICATIONS-UPGRADE-CHAIN-IMPL-Q1
GOAL: Palisada -> Mury kamienne -> Mury ceglane jako lancuch awansu ("Ulepsz"): w miescie i w kolejce najwyzej jedna fortyfikacja lancucha, awans = pelny koszt nowego etapu (decyzja wlasciciela), przeskok dozwolony, migracja starych zapisow, parytet AI.
ZMIANY/COMMIT: baza 4abb6573e (kandydat analizy W15) + merge origin/main (1a42785d4) -> 043fcafd0; zmiany kodu patrz nizej; SHA koncowy w polu `sha` wyniku (commit tej rundy).
TESTY: patrz sekcja 4 (liczby z surowego wyjscia w evidence/).
BLOKADY: brak. Dwie rzeczy NIE_ZMIERZONO / do decyzji w sekcji 6.
RUNDY: 1/5
NASTEPNY KROK: Evaluator (mutacje, przeglad zalozen A1-A6, rozstrzygniecie DECISION_REQUIRED nie jest potrzebne -- sprzecznosc pytan 1/2 pogodzona).
DEPLOY/PUSH: NIE WYKONANO

## 1. Zalozenia (wpisane wprost)
- A1 (sprzecznosc ABC pyt. 1 vs 2): obowiazuje pyt. 1 -- awans = PELNY koszt nowego etapu (Praca + surowce), bez roznicy i bez zwrotu; przeskok (mury ceglane od zera, takze z palisady) tez za pelny koszt. Implementacja godzi oba, bo koszt etapu nie zalezy od tego, czy jest awansem. DECISION_REQUIRED nie wystawiam.
- A2: w kolejce miasta tylko JEDEN etap lancucha naraz (blokada w obie strony); stary etap placi utrzymanie do ukonczenia nowego (jak dzis).
- A3: poziom (L1/L2) liczony z epoki jak dotad; awans etapu nie resetuje poziomu. Awans POZIOMU (ten sam id) zostal rozdzielony etykieta: "Mury kamienne -> poziom 2" vs awans etapu "Ulepsz -> Mury kamienne".
- A4: migracja zapisu CICHA (bez komunikatu): z kilku fortyfikacji lancucha w `cityBuilt` zostaje najwyzsza, nizsze usuniete bez zwrotu (decyzja 3). Powod: zmiana dotyka tylko utrzymania (bonus obrony i tak bral najwyzszy), komunikat dodawalby szum, a nie ma jak rozroznic "swiadomie" zbudowane stare stosy. Kolejki w starych zapisach (kilka etapow w `cityProd`) NIE sa czyszczone: straznik ukonczenia (`applyCompletedBuildingIds`) i tak zostawia najwyzszy etap.
- A5: Cytadela (fort) i Baszta sa poza lancuchem; istniejaca regula "fort stojacy/w kolejce blokuje niższe etapy muru" zostaje (zachowanie sprzed zmiany, nie nowe).
- A6: test Chromium to realny `renderBuildList` z cityPanel.ts + realne dane w Playwright Chromium (wzorzec building-resource-visibility-ui-test), BEZ pelnego `vite dev/build` (zakaz) i bez calej gry -- dowod dla panelu miasta, nie dla pelnej petli tury w `main()`. Zrzuty sa bez CSS aplikacji (surowy DOM).

## 2. Zmiany (allowlista)
- gra/data/buildings.json: `mury_kamienne.upgradeFrom="palisada"`, `mury.upgradeFrom="mury_kamienne"` + nowe pole `upgradeSkip:true` na obu (poprzednik NIE wymagany -> przeskok). Koszty, bonusy, utrzymanie BEZ ZMIAN (test D3-D5).
- gra/src/data/loader.ts: pole `upgradeSkip?` w BuildingDef.
- gra/src/game/building-upgrades.ts: `UpgradeChainNode`, `skipChainLowerIds/HigherIds/UpgradeSource` (czyste helpery lancucha z przeskokiem).
- gra/src/game/production.ts: (a) blokada kolejki w obie strony w `isWallTierBlockedByStrongerWall` (data-driven, zamiast zahardkodowanych id; regula fortu zachowana); (b) `availableProduction`: `upgradeSkip` znosi wymog poprzednika, etykieta "Rozbuduj X -> Y" gdy stoi nizszy etap, nazwa zwykla przy budowie od zera; (c) `applyCompletedBuildingIds`: ukonczony etap usuwa WSZYSTKIE nizsze (rowniez przy przeskoku palisada->mury), spozniony nizszy nie cofa wyzszego; (d) `isBuildingSupersededByUpgrade` uwzglednia przeskok; (e) nowa `collapseFortificationChain` (migracja).
- gra/src/main.ts: import + wywolanie migracji przy wczytaniu `saved.cityBuilt` (1 linia + komentarz).
- gra/src/game/ai.ts: filtr `upgradeFrom` w katalogu kandydatow respektuje `upgradeSkip` (parytet); martwa galaz ternary "kamienne->ceglane" w boost-cie 320 usunieta (zastapiona jawnym 'mury_kamienne'), a w galezi zagrozenia (defensiveCopy) warunek `!built.includes('mury_kamienne')` usuniety, wiec AI pod zagrozeniem proponuje awans na 'mury' gdy stoja kamienne (dawniej nigdy).
- gra/src/ui/cityPanel.ts: etapy lancucha z istniejacym poprzednikiem trafiaja do sekcji "Ulepsz" z etykieta "Ulepsz -> Nazwa" (tooltip "Zrodlo -> Cel"); level-upy pokazuja `item.nazwa` ("X -> poziom N"); chip wymagan "Awans z: X (opcjonalnie)" (met=true) zamiast czerwonego "Rozbudowa: X" -- inaczej przeskok bylby zablokowany przez `buildingCanBuildNow`.
- gra/src/ui/entityCards/buildingAdapter.ts: wiersz "Awans z (opcjonalnie)" zamiast "Wymagany budynek" dla `upgradeSkip`.
- gra/tools: `fortifications-stack-repro-test.cjs` (zaktualizowany do NOWEGO zachowania, 49 asercji), nowe `fortifications-upgrade-chain-ai-test.cjs` (13) i `fortifications-upgrade-chain-ui-test.cjs` (15, Chromium), `grupy-budynkow-test.cjs` (asercja "mury bez lancucha" zmieniona zgodnie z decyzja: lancuch palisada->kamienne->mury; Cytadela nadal osobno).
- NIE zmieniono: WERSJE.md, koszty/bonusy/utrzymanie (wartosci), rust-port, wikiBundle (generowany z docs/*.md, nie z buildings.json; docs poza allowlista).

## 3. Tabela tura -> (fortyfikacje, utrzymanie, bonus) -- realne funkcje silnika (evidence/repro-after.txt)
| tura | stan | utrzymanie zl | bonus obrony |
|---|---|---|---|
| T0 | [] | 0 | +0% |
| T1 | palisada w kolejce (koszt pobrany: drewno 120) | 0 | +0% |
| T2 | [palisada] | 2 | +100% |
| T3 | [palisada], awans na kamienne w kolejce (pobrano 160/160/160) | 2 | +100% |
| T4 | [mury_kamienne] | 4 | +150% |
| T5 | [mury_kamienne], awans na ceglane w kolejce (pobrano 320/320/320) | 4 | +150% |
| T6 | [mury] | 8 | +200% |
Razem pobrane (deductBuildingStockCostAcrossCities, stan magazynow): drewno 600, kamien 480, cegla 480 (pelny koszt kazdego etapu, decyzja 1). Przeskok od zera: 70 Pracy + 320/320/320.
Migracja zapisu [palisada, mury_kamienne, mury]: utrzymanie 14 -> 8 zl, drewno 5 -> 2 (kamien/cegla 2), bonus +200% bez zmian.

## 4. Testy (surowe wyjscia w evidence/)
- fortifications-stack-repro-test: 49 OK / 0 FAIL (evidence/repro-after.txt). NA BAZIE (po cofnieciu zmian src/data): 9 FAIL + crash na brakujacej `collapseFortificationChain` -> CZERWONY (evidence/repro-on-base-RED.txt).
- fortifications-upgrade-chain-ai-test (realny chooseCityProduction + availableProduction): 13 OK / 0 FAIL; AI proponuje awans kamienne->ceglane, nie proponuje nizszych, nie dokłada drugiego etapu gdy etap jest w kolejce; symulacja 8 decyzji: zaplacone etapy palisada -> mury_kamienne -> mury, max 1 fortyfikacja.
- fortifications-upgrade-chain-ui-test (Chromium, realny renderBuildList): 15 passed / 0 failed; zrzuty evidence/01..04*.png; karta awansu: "Wymagane surowce 160 Drewno / 160 Kamien / 160 Cegla", "Awans z: Palisada drewniana (opcjonalnie)", brak surowych id.
- Mutacje: A) cofniecie usuwania nizszych etapow w `applyCompletedBuildingIds` -> P4 FAIL (evidence/mutation-A-*.txt); B) cofniecie blokady "nizszy w kolejce blokuje wyzszy" -> S2, Q1, Q2, Q4 FAIL oraz w tescie AI A3, A3b, A4 (evidence/mutation-B-*.txt).
- tsc --noEmit: 0 bledow (puste wyjscie, exit 0).
- 5 bramek referencyjnych: logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6 (evidence/gate-*.txt).
- Istniejace testy blizszego sasiedztwa na tym samym kodzie: ai-production-priority 9/0; ai-threat-mode 12/0; auto-manage-ulepszenia-fallback 11/11; building-queue-refund 5/0; building-tech-gate 96/0; building-upkeep-ceramics 649/0; city-wall-towers 59/0; ids-leak-audit 1648/0; building-resource-visibility 15/0; ai-mp-military-cap 18/0; ai-jednostki-tylko-zakup 45/0; city-administrator 117/0; ai-produkcja-pokrycie-katalogu exit 0. Testy z niezerowym wynikiem MAJA IDENTYCZNE wyniki na bazie (porownane po cofnieciu zmian): ai-test (crash), budynek-garnizon (crash), budynki-koszt-pracy-50 141/42, building-upkeep-resources 47/1, city-siege-wall-rules 46/4, administracja-stolica (exit 1), grupy-budynkow 3 FAIL (liczba 43 vs 44 budynkow; stare). Jedyna regresja wywolana moja zmiana (grupy-budynkow, 2 asercje "mury bez lancucha") zostala zaktualizowana -> 80 pass / 3 fail (te same 3 stare).
- NIE URUCHOMIONO: ai-buduje-budynki-test.cjs (3 pelne buildy vite + dziesiatki minut Chromium; wymienione w dispatchu "ai-buduje-budynki i nowy" -- zastapione nowym behawioralnym testem AI; do uruchomienia przez Evaluatora jesli wymagane), pelny test petli tury w grze na zywo (main() niemodularny).

## 5. Dlug Rust (REPIN, NIE ruszano rust-port)
- dane: `upgradeFrom` + `upgradeSkip` dla mury_kamienne/mury w buildings (rust-port data);
- logika: blokada kolejki w obie strony, usuwanie wszystkich nizszych etapow przy ukonczeniu (rowniez przeskok), `isBuildingSupersededByUpgrade` z przeskokiem, migracja `collapseFortificationChain` przy wczytaniu zapisu;
- AI: pominiecie wymogu poprzednika dla `upgradeSkip`, awans kamienne->ceglane w galezi zagrozenia.

## 6. Uwagi / ryzyka dla Evaluatora
- Etykieta level-upow w sekcji "Ulepsz" zmienila sie dla WSZYSTKICH budynkow (poprzednio pokazywano `def.nazwa`, teraz "Nazwa -> poziom N"). Sasiednie testy DOM po zmianie: emporion-build-list-real-render 13/0, building-stock-visibility 7/0; recruit-list-order-by-era 17/1, citypanel-konwerter-produkcja 99/1, recruitment-panel-compact-row (8 linii "fail") -- te trzy MAJA IDENTYCZNY wynik na bazie (zmierzone po cofnieciu zmian), czyli nie sa regresja tego tematu.
- Dokumentacja/encyklopedia (docs/*.md, wikiBundle) nie zawiera zmiany mechaniki awansu muru -- poza allowlista; do osobnego tematu jesli wymagane.
- Zrzuty w evidence sa bez arkusza stylow aplikacji (harness jak w istniejacych testach), wiec ocena wizualna ograniczona do struktury sekcji i etykiet.
