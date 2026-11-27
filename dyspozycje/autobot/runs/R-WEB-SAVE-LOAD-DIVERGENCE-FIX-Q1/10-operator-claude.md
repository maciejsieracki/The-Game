STATUS: BLOCK
DOMAIN: GAME (integralność zapisu, priorytet 1)
TEMAT: R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1 (SAVEFIX), runda 2/5, Operator HAIKU 5.5
GOAL: znaleźć przyczynę B != A po wczytaniu zapisu i naprawić (B == A co najmniej 6 tur po wczytaniu w 4 konfiguracjach × 2 ziarna × 2 punkty zapisu).
BAZA: 31a1ad39d93e2f8b64ef37fc6cca974fb2849e63 (origin/main, kandydat r2). Wynik: brak naprawy w kodzie. Zmiana w repo: tylko narzędzie pomiarowe + ten raport.

## ZMIANY/COMMIT
- gra/tools/savedigest-run.cjs: dwie opcje diagnostyczne (`--dumpmod <abs>` w trybie A zrzuca mapy poziomu modułu po migawce; `--inject <abs>` [+ `--injectnames a,b`] w trybie B podstawia je po restore). Bez zmiany zachowania bez tych opcji.
- dyspozycje/autobot/runs/R-WEB-SAVE-LOAD-DIVERGENCE-FIX-Q1/diag-savefix-r2-main.patch: EKSPERYMENTALNY patch gra/src/main.ts (NIE do wdrożenia): (a) pola opcjonalne `aiWonderPracaTickByCity` i `aiWonderStuckTurnsByOwner` w meta zapisu/wczytania (bez efektu, patrz niżej); (b) hak `__savefixDiag` (tylko civTest, dump/load 17 map) — do usunięcia przed FC.
- gra/src/main.ts w commicie: BEZ ZMIAN (eksperymenty cofnięte po pomiarach).
- Brak poprawki gry, brak nowego testu `save-load-continuity-*.cjs` (nie było naprawy, do której test by się odnosił).

## TESTY (wszystkie pomiary na żywo, Chromium, build vite do katalogu poza repo; index.html 15 045 104 B = zgodny z r1)
Konfiguracja: cfg max (Trudny, dyplomacja trudna, Wysoki ×4, kultura trudny/AI trudny, flagi ON), seed 4242, zapis po t3, K=6. Maksimum wg dispatchu r1 (cfg max).
Poziomy wymagane przez dispatch (4 konfiguracje × 2 ziarna × 2 punkty zapisu): NIE ZMIERZONO poza powyższym jednym punktem (cfg max, seed 4242, t3). Seed 7, t10, cfg default/aionly: NIE ZMIERZONO (brak czasu na 5 kolejnych bieg-par ~6 min każdy).

1. Odtworzenie (potwierdzone): A (ciągła, runA) vs B (świeża sesja + restoreJson, runB): digest różny od t4 do t6 włącznie. detIdSeq t6: A 65 vs B 66; nUnits zgodne.
2. Snapshot vs stan po restore (snapA.json.full vs runB.json.full): różnice wyłącznie reprezentacyjne (126 pól obecnych tylko w B: `budowaLista: []`, `magazynZywnosci: 0`, `postepBudynkowUsuniete: {}`, dopisane przez ensureCitySaveDefaults). Stan miast i jednostek po restore = zapis.
3. Różnice w TURZE 4 (cont4 A vs resumed4 B, cmp.cjs; wartości z surowego full()):
   - city16 (owner 13): wealthState.pula A 3.9 vs B 3.6375; surowce.drewno A 8 vs B 13.
   - city25 (owner 22): pula A 3.9 vs B 3.6375; drewno A 8 vs B 50.
   - city17 (owner 13): drewno A {} (0) vs B 50 (50 z zapisu nie zużyte w B).
   - city26 (owner 22): manpower A 2000 vs B 0 (tylko to miasto; city10/16/25/37 zgodne).
   - Glina zgodna we wszystkich miastach; liczba miast i jednostek zgodna.
   Wniosek: rozjazd startuje w tłumaczeniu stocku drewna i puli Pracy/zamożności stolic AI oraz w manpower jednego miasta — pierwsza tura po wczytaniu.
4. Porównanie sizes map poziomu modułu (`__turnSlowdownTestDebug.collections()`, 148 map) A@t3 (żywa) vs B po restore: różnią się 13 map: bronzeEraEnterTurnByOwner (A 1 / B 42), villageMeshes (render, pomijane), cityOrderState (43/0), citizenUpkeepByOwner (30/0), buildingResourceUpkeepByOwner (30/0), unitResourceUpkeepByOwner (30/0), lastCityKulturaTick (43/1), aiWonderPracaTickByCity (43/0), aiWonderStuckTurnsByOwner (13/0), lastDiplomaticContactsSnapshot (2/0), aiImprovementBudgetByOwner (29/0), aiSurplusReportByOwner (29/0), powerSnapshotsForTurn (30/0).
5. BISEKCJA (wykonana, trzy próby):
   - Próba 1 — zapis+wczytanie dwóch map cudów AI (`aiWonderPracaTickByCity`, `aiWonderStuckTurnsByOwner`) jako pól opcjonalnych (distfix, runAfix/runBfix): A-fixed == A-orig we wszystkich 6 turach (6/6, ciągła gra bez zmian); B-fixed != A od t4 z IDENTYCZNYM wzorcem rozjazdu (pula 3.6375, drewno 13/50, city17 50). WYNIK: NIE przyczyna.
   - Próba 2 — podstawienie z A (t3) do B WSZYSTKICH 17 map poziomu modułu, które nie są w zapisie (cityOrderState, citizenUpkeepByOwner, buildingResourceUpkeepByOwner, unitResourceUpkeepByOwner, lastCityKulturaTick, aiImprovementBudgetByOwner, aiSurplusReportByOwner, aiWonderPracaTickByCity, aiWonderStuckTurnsByOwner, orderMultMap, orderValueMap, growthMultMap, converterProducedLastTurnByOwner, bronzeEraEnterTurnByOwner, ironEraEnterTurnByOwner, powerSnapshotsForTurn, lastDiplomaticContactsSnapshot): B(all injected) != A od t4 (6/6 różne). WYNIK: żadna z tych map sama ani łącznie nie jest przyczyną.
   - Próba 3 — analiza użycia (bez pomiaru): buildingResourceUpkeepByOwner/unitResourceUpkeepByOwner/citizenUpkeepByOwner/powerSnapshotsForTurn czytane wyłącznie przez UI (`fallback` przy .get) lub nadpisywane w tej samej turze; aiImprovementBudgetByOwner/aiSurplusReportByOwner przeliczane w każdej turze przed użyciem. Wniosek: nie są stanem międzyturowym wpływającym na symulację.
   - Brak 3. podzbioru do bisekcji: wszystkie pozostałe mapy poziomu modułu mają identyczne rozmiary A/B.

## PRZYCZYNA
NIE ZIDENTYFIKOWANA. Dziennik prób:
- P1: aiWonderPracaTickByCity + aiWonderStuckTurnsByOwner zapisane/wczytane -> bez zmiany rozjazdu.
- P2: 17 map modułu podstawionych z A -> bez zmiany rozjazdu.
- Hipotezy, których NIE potwierdzono ani nie wykluczono (do sprawdzenia w następnej rundzie):
  (a) manpower miasta 26 (owner 22): B = 0 w pierwszej turze po wczytaniu, A = 2000; regen liczy się z `civManpowerMatrixMults(ownerCivKey)` i `civManpowerMults(ownerBonusy)` (turn-economy.ts ~3214–3222) — jeśli `ownerBonusy`/`ownerCivKey` w B różni się od A dla tego ownera, to jest jedyne miejsce w tym zbiorze miast; to samo źródło może wpływać na drewno (wydatki z puli) — do zbadania przez zrzut tych dwóch wartości dla ownera 22 w A i B.
  (b) kolejność iteracji Map odbudowanych przy wczytaniu (wstawianie w innej kolejności niż w ciągłej grze), która zmienia alokację wspólnych pul właściciela między miasta (drewno: suma właściciela nie jest identyczna, więc to nie tylko kolejność — wymaga pomiaru).
  (c) stan spoza listy 148 map i pól miast/jednostek (np. zmienne `let` w zakresie funkcji, nie będące Mapą/Set) — do przeszukania przez grep `let .* = ` w zakresie buildSaveGameSnapshot/restoreGameFromSave.

## NASTĘPNY KROK
Runda 3 (Operator, Haiku — 1. runda po NOWYCH wskazówkach; Sonnet NIE uzasadniony): (1) zrzut `ownerBonusy`, `ownerCivKey`, `mpMults` dla ownera 22 i pól manpower/drewno miasta 26 w A@t3 i B po restore, przed endTurn — hak read-only w tym samym bloku co `__savefixDiag` (patch w pliku powyżej); (2) jeśli równe — bisekcja po kolejności iteracji: odbuduj w B Mapy zapisywane z meta w kolejności A (sortuj wg kolejności z zapisu, nie wg kolejności restore) i zmierz; (3) dopiero potem poprawka pól opcjonalnych dla tego, co się potwierdzi.
Obowiązkowo przed poprawką: powtórzyć B==A na cfg max seed 4242 t3 i dopiero potem na pozostałych konfiguracjach/ziarnach/punktach zapisu.
Uwaga dla orkiestratora: NIE integrować patcha `diag-savefix-r2-main.patch` (eksperymentalny, zawiera hak diagnostyczny i pola bez efektu). Commit `gra/src/main.ts` nie zmieniony względem bazy.

## BLOKADY
- Przyczyna rozjazdu nieznana (brak dowodu co naprawić). Bez dowodu nie ma poprawki.
- Brak pomiarów dla 3 z 4 konfiguracji, drugiego ziarna i drugiego punktu zapisu (czas: ~6 min na bieg A/B w Chromium).
- Nie wykonano bramek dispatchu (tsc, logic, ai-test, wiring…) — brak zmian w grze, więc bramki gry nie są wymagane do tej rundy; NIE ZMIERZONO.

## RUNDY
2/5 (BLOCK bez kodu → zgodnie z regułą ORKIESTRATORA: raport bez commita z pracą = BLOCK; tu praca = narzędzie + raport zacommitowany).

## DEPLOY/PUSH
NIE WYKONANO (brak integracji, brak push z mojej strony; zgodnie z dispatchem).
