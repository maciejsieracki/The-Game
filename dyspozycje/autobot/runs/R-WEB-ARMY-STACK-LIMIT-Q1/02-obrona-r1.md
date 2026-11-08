STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-STACK-LIMIT-Q1
GOAL: Żadna armia (własne jednostki jednego właściciela na jednym heksie, także w mieście) nie przekracza BATTLE_MAX_PER_SIDE = 500. Obrona na zarzuty Evaluatora (PASS-WITH-NOTES) z rundy Operatora 421010fa1 / f45240983.
ZMIANY/COMMIT: commit b41876183 (poprawki) na bazie f45240983 (worktree wf_edf805e6-4e1-3). Pliki: gra/src/game/siege-enter-city.ts, gra/src/game/villageRewards.ts, gra/src/main.ts, gra/tools/army-stack-limit-test.cjs. Allowlista zachowana. Zero zmian w gra-robocza/**, WERSJE.md, rust-port/**, render/**, battleScene.ts, armyMerge.ts, ai*.ts.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (część), commit b41876183.
   - NAPRAWIONE: wejście po poddaniu miasta (planSurrenderEntry dostaje stackLimit; grupa większa niż wolne miejsce w mieście jest pomijana; main.ts wywołanie enterCityAfterSurrender przekazuje armyStackLimit()); nagroda z chatki (findVillageRewardSpawnHex dostaje stackLimit i odrzuca heksy z pełnym stosem, także z garnizonem, który omijał test occupied); startowe jednostki bonusowe (spawnDifficultyBonusUnit sprawdza hexHasRoomFor i pomija spawn z logiem).
   - ODRZUCAM: cesja miasta traktatem. cityCessionPlanFor (main.ts:34589) przenosi jednostki tylko na heksy bez żadnej jednostki (isFreeHex), więc żaden stos nie rośnie. Dowód: kod planCityCession z isFreeHex.
   - ZAŁOŻENIE (nie zweryfikowano osobno): odwrót i posiłki. assignBounceHexesForUnits nie jest wołany w src/ (sprawdzone grep-em), a decideAIReinforcements (ai.ts:5817) idzie ścieżką ruchu AI z bramką truncatePath. Odwrót/posiłki nie mają osobnej bramki; startowa siatka enforceArmyStackLimit je pokrywa w granicach tury.
2. PRZYJMUJĘ, commit b41876183. Zarzut trafny: garnizon nie blokował heksu jako docelowego podziału.
   - main.ts, panel rozdzielenia: destHexes filtrowane przez stackFreeSlots > 0 (heks własnego miasta z pełnym garnizonem nie jest oferowany, "zostaje w mieście" nadal dostępne).
   - main.ts, onSplit: przed przeniesieniem sprawdzane ownUnitCountAt(dest, bez ids) + liczba ruszających > limit; przy przekroczeniu komunikat i brak zmian.
   - Test: F12, F13 (wiring).
3. PRZYJMUJĘ jako ograniczenie dowodu, NIE naprawiane w tej rundzie. Test army-stack-limit-test.cjs jest modelem na funkcjach modułu; sekcja F to skan tekstu źródła. Pętla 60 tur prawdziwego silnika AI wymaga buildu i Chromium i nie była wykonywana. Dowód na żywej grze: NIE_ZMIERZONO, do osobnej bramki.
4. PRZYJMUJĘ jako dług klasyfikacji, NIE naprawiane. KLASYFIKACJA w tools/mgla-sciezka-inwariant-test.cjs leży poza allowlistą. Nowe trafienie to relokacja main.ts:4224 (migracja, z rundy Operatora). Pozostałe pozycje na liście (siege-enter-city.ts, main.ts:34663) to przesunięcia numerów linii po tych zmianach, a nie nowe miejsca zapisu. Wynik: 39 pass / 3 fail, tak samo jak baza i runda Operatora. Potrzebna decyzja orkiestratora: rozszerzenie allowlisty albo osobny temat.
5. PRZYJMUJĘ jako otwarte ryzyko, NIE naprawiane w tej rundzie. AI nie wybiera aktywnie innego heksu/miasta: pusta przycięta trasa oznacza brak ruchu do kolejnej decyzji. Poprawka wymagałaby zmiany wyboru celu w ai*.ts, czyli poza zakresem tej rundy (dispatch dopuszcza w ai*.ts tylko unikanie blokady). Nie zmierzono, czy AI utyka przy pełnym stosie w mieście (produkcja wraca na front kolejki, a pełny garnizon blokuje rekrutację). ZAŁOŻENIE: AI ponownie wybiera cel w kolejnej decyzji. Proponowany osobny temat: wybór celu AI z uwzględnieniem wolnych miejsc w stosie + pomiar w pętli 60 tur.

TESTY (z gra/, po commicie b41876183):
- tsc --noEmit: 0 błędów (exit 0).
- logic-test: 213/213.
- ai-test: 274 passed / 20 failed (liczba jak u Operatora; zbioru 20 nie porównano z bazą).
- army-stack-limit-test: 51/51 OK (nowe: G1-G3 poddanie, H1-H2 chatka, F12-F16 okablowanie).
- siege-surrender-enter-city-test: 32 OK / 0 FAIL.
- villages-test: 94/94. found-from-village-test: 24/24.
- battle-cap-500-test: PASS 59. generals-limit-invariant-test: ALL PASS. army-merge-stackgroupid-test: 11045 pass / 0 fail.
- mgla-sciezka-inwariant-test: 39 pass / 3 fail (jak baza; patrz pkt 4).

BLOKADY:
- Pętla 60 tur prawdziwego silnika AI: NIE_ZMIERZONO (build + Chromium).
- Odwrót i posiłki: brak osobnej bramki, założenie jak wyżej.
- AI nie szuka aktywnie innego heksu (pkt 5).
- Klasyfikacja w teście mgla poza allowlistą (pkt 4).
- Brak weryfikacji wizualnej.

RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Evaluator (ponowna ocena b41876183). Do decyzji orkiestratora: allowlista dla KLASYFIKACJA w mgla-sciezka-inwariant-test, osobny temat wyboru celu AI przy pełnym stosie, dowód na żywej grze.
DEPLOY/PUSH: NIE WYKONANO
