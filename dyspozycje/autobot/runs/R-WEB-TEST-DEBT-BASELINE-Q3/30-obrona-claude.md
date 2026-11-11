STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-WEB-TEST-DEBT-BASELINE-Q3
GOAL: zredukować dług testowy bazy 37bcf8ebb (testy czerwone na bazie) bez zmian kodu gry w gra/src i danych gry; odpowiedź Obrony na zarzuty Evaluatora z 20-evaluator-claude.md (kandydat 5bed9d7cc8870d41fb145e8b014e3606ab910634, raport Evaluatora b8ff3aa57876c3a1bcb22b9ceb5e7188beb905ef).
BAZA: origin/main 37bcf8ebb; kandydat 5bed9d7cc (rodzic 37bcf8ebb); ta obrona = commit na gałęzi detached od 5bed9d7cc (SHA commita podany w polu sha odpowiedzi orkiestratorowi, nie w tym pliku).
ZMIANY/COMMIT: allowlista gra/tools/*-test.cjs; zmienione pliki (4): gra/tools/okolica-ownership-change-reconcile-test.cjs, gra/tools/pre-battle-retreat-exhausted-test.cjs, gra/tools/recruitment-batch-contract-test.cjs, gra/tools/hex-tooltip-unlock-label-dedup-test.cjs; plus ten raport. gra/src, WERSJE.md, gra-robocza: nietkniete (git diff --name-only 5bed9d7cc..HEAD = wyłącznie powyższe). git diff --check: czysto.

## Odpowiedzi na zarzuty Evaluatora

### Zarzut 1 (okolica-ownership-change-reconcile: klasa C niepoparta) -- PRZYJMUJĘ (zmiana klasy na A, poprawka testu)
Diagnoza ponowna. Kod gry jest poprawny: ownerId jest przypisywane PRZED wywołaniem seedCityOwnerDefaults we wszystkich czterech ścieżkach:
- resolveSiegeSurrender: `city.ownerId = newOwner;` w linii 17525, `seedCityOwnerDefaults(city);` w linii 17615 (ta sama funkcja, bez granicy function między nimi).
- annexCityStateToOwner: `city.ownerId = annexerId;` w linii 35051, `seedCityOwnerDefaults(city);` w linii 35058.
- post-battle-map.ts::applyCityCaptureAfterBattle: `city.ownerId = atkOwner;` w linii 574, `captureOpts?.onOwnerChanged?.(city);` w linii 591.
Przyczyna 3 niezaliczeń: okna regex w teście (1500 / 300 / 200 znaków) były ZA KRÓTKIE. Zmierzone odległości między przypisaniem a wywołaniem: (a) 6744, (b) 506, (c) 1199 znaków, wszystkie w tym samym ciele funkcji. Test anchorował się do tekstu, nie do zachowania. Klasa A (test przestarzały), NIE błąd gry. Wniosek z R1 (klasa C, "osobny temat") jest wycofany; nie zakładam tematu C.
Zmiana: helper `sameFnAfter(src, assignStr, callStr)` -- wywołanie musi wystąpić PO przypisaniu, w odległości <= 8000 znaków, bez granicy `function` pomiędzy. Okna (a)(b)(c) zastąpione tym helperem. Punkt (d) i sekcje 1, 2.1, 2.3 bez zmian.
Dowód: `cd gra && node tools/okolica-ownership-change-reconcile-test.cjs` -> `OKOLICA-OWNERSHIP-CHANGE-RECONCILE OK (15/15)`, exit 0 (wcześniej 12/15, exit 1).
Dowód helpera (zestaw syntetyczny, skrypt poza repo): brak wywołania -> false; granica function między -> false; poprawny układ -> true.

### Zarzut 2 (niedokończone punkty: recruitment-batch, general-capital, pre-battle-retreat, D-FOG-F) -- PRZYJMUJĘ częściowo (poprawka + klasyfikacja), jedna pozycja ODRZUCAM jako nieaktualną

2a. pre-battle-retreat-exhausted (6 FAIL bez klasyfikacji) -- PRZYJMUJĘ, klasa A, NAPRAWIONE: 33 pass, 0 fail (exit 0).
Przyczyna: test szukał końca funkcji markerem `}, { defaultAction: 'manual' });`, którego NIE MA w main.ts (grep `defaultAction` daje linie 33410, 34174, 36818 w innym kształcie). Pozostałe asercje [A1]-[A6] trafiają w aktualny kod: retreatExhaustedThisTurn (l. 33891), defenderCanRetreat (l. 33904), retreatExhaustedThisTurn w PreBattleInfo (l. 33905), warunek onCancel `if (playerDefends && !defenderLockedByGarnizon && !retreatExhaustedThisTurn)` (l. 34152), oznaczenie rostera po applyDefenderPreBattleRetreat (l. 34153 -> 34167). Zmiana: granica ciała = następna funkcja na poziomie 4 spacji (`\n    function `). Asercje nie osłabione.
Pozostałe 6 FAIL w raporcie R1 nie były błędem gry: wszystkie zależały od markera.

2b. recruitment-batch-contract -- PRZYJMUJĘ jako CZĘŚCIOWO NAPRAWIONE, NADAL CZERWONE (stan otwarty, jawnie na liście).
Zrobione: wycięcie prawdziwej superUnitLimitViolation i SUPER_UNIT_LIMIT_BLOCK_PL z src/game/production.ts (ta sama metoda co hexHasRoomFor); reservedUnitTypeNamesForOwner = `() => new Set()` (ZAŁOŻENIE: fixture bez żywych Super-jednostek; test sprawdza atomowość zakupu, nie samą regułę Super-jednostki).
Wynik po zmianie: exit 1. Raw: `ReferenceError: effectiveGameDifficultyForOwner is not defined`. Przed zmianą błąd był na superUnitLimitViolation, więc zależności przesuwają się łańcuchowo.
Otwarte zależności wycinanej funkcji (skan statyczny ciała purchaseRecruitmentUnit + cancelRecruitmentPurchase, funkcje wołane, których nie ma w fixture): effectiveGameDifficultyForOwner, bestGeneralUnitForOwner, attemptGeneralPurchase, capitalCityIdForOwner, recruitFollowGeneralForOrder, armyLeaderTitle, empireBuiltIdsForOwner, stackLimitBlockMessage (oraz zestaw z dalszego skanu, do zweryfikowania). Harness przez `new Function(...names)` z pozycyjnymi argumentami gonią za zmianami w produkcji; to klasa B wymagająca przebudowy harnessu (np. jawna atrapa całego zestawu lub boot prawdziwego modułu), nie jednej poprawki. Nie robię tego w tej rundzie.

2c. general-capital-recruitment-order -- PRZYJMUJĘ, NIEDOKOŃCZONE (stan otwarty, nie zmieniane).
Raw: 11 PASS (statyczne i Chromium-mount), potem `page.evaluate: ReferenceError: hexHasRoomFor is not defined` (exit 1). Ta sama przyczyna co w 2b: lista names w extractBackend() nie zawiera nowych zależności purchaseRecruitmentUnit (hexHasRoomFor, superUnitLimitViolation, reservedUnitTypeNamesForOwner, SUPER_UNIT_LIMIT_BLOCK_PL). Nie zmieniane w tej rundzie, bo wymaga tej samej przebudowy co 2b.

2d. D-FOG-F (punkt 6: 3 skrypty measure wciskają F bez włączenia opcji) -- ODRZUCAM jako nieaktualne na bazie 37bcf8ebb. Dowód (grep, stan 5bed9d7cc = baza dla tych plików):
- gra/tools/memory-unit-static-merge-game-measure.cjs:112 `startNewGame(... fogRevealKeyFEnabled: true)`, l. 124-125 asercja, że wartość doszła do doStartGame, l. 127 `keyboard.press('f')` -- opcja włączona PRZED F.
- gra/tools/memory-growth-rootcause-q1-measure.cjs:161 `startNewGame(... fogRevealKeyFEnabled: true)`, l. 173-174 asercja, l. 176 `keyboard.press('f')`.
- gra/tools/longrun-100-turns-leak-q1-measure.cjs:184 `keyboard.press('f')` jest CELOWĄ kontrolą negatywną w trybie PREFLIGHT_ONLY (l. 181-186: baseline enabled===false i oczekiwanie "F nie zmienia stanu przy OFF"); właściwe nowe gry z opcją włączoną: l. 189.
Wniosek: punkt 6 nie wymaga zmiany. Nie uruchamiałem skryptów measure (długie przebiegi gry); dowód jest statyczny -> NIE_ZMIERZONO runtime.

### Zarzut 3 (unit-replace-full-cost F0: decyzja ABC właściciela) -- PRZYJMUJĘ jako STAN OTWARTY, bez zmiany asercji
Raw (exit 1): `unit-replace pelny koszt: 39 passed, 1 failed`; `[FAIL] Taran okuty ma zamiennik Katapulta w Zelazie u 16/16 nacji (brak: Grecja, Rzym, Chiny, Zulu, Inkowie, Egipt, Sumer, Ludy Morza, Celtowie, Germanie, Asyria, Słowianie, Harappa, Hetyci, Babilonia, Fenicjanie)`.
Nie rozstrzygam sam: asercja zostaje; czy Taran okuty ma mieć zamiennik Katapulta (Oblężniczy wykluczony z Zastąp w danych) -- pytanie ABC do właściciela, poza zakresem Operatora. Bramki referencyjne tego testu nie obejmują.

### Zarzut 4 (raport R1 bez surowych linii bramek) -- PRZYJMUJĘ
Surowe wyjścia bramek na kandydacie + poprawkach tej obrony (patrz sekcja TESTY).

### Zarzut 5 (hex-tooltip: slice(indexOf('Kamieniołom'), indexOf('Fort')) kruchy) -- PRZYJMUJĘ, poprawka
Zmiana: koniec wiersza Kamieniołomu wyznaczany granicą WIERSZA (`\p{L}[\p{L}\s()\-]*? → `), nie położeniem "Fort". Rzeczywisty tekst listy (z tymczasowej kopii testu z dump-em, usuniętej po użyciu): `Możliwe ulepszenia (teren)Owce → plony miasta: ... odblok. OwceKamieniołom →  +113 Kamień/t · plony miasta:  3 ·  4Fort → ...`.
Dowód na wyprowadzonym tekście (skrypt poza repo): real -> pass=true, wiersz `Kamieniołom →  +113 Kamień/t · plony miasta:  3 ·  4`; mutant z `odblok. Kamień` w wierszu Kamieniołomu -> pass=false; zmiana kolejności wierszy (Fort/Owce po Kamieniołomie) -> pass=true.
Wynik testu: `28 passed, 0 failed`, exit 0.
Uwaga: to jest mutacja helpera na wyprowadzonym tekście, a nie mutacja samego pliku testu; NIE_ZMIERZONO mutacja samego pliku hex-tooltip.

## Bramki (surowe wyjścia, stan po poprawkach R2)
- tsc --noEmit: exit 0, brak linii wyjścia
- logic-test: `LOGIC OK (213/213)`, exit 0
- tech-tree-test: `tech-tree-test: 20 pass, 0 fail`, exit 0
- research-test: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, `ALL GREEN`, exit 0
- unit-replace-test: `[unit-replace-test] WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test: `COMBAT TEST: 6/6 pass`, `All sanity checks passed.`, exit 0
- unit-replace-full-cost-test: `39 passed, 1 failed`, exit 1 (F0, ABC, bez zmian)

Testy zmienionych plików (po poprawkach R2):
- okolica-ownership-change-reconcile-test: `OKOLICA-OWNERSHIP-CHANGE-RECONCILE OK (15/15)`, exit 0
- pre-battle-retreat-exhausted-test: `33 pass, 0 fail`, exit 0
- hex-tooltip-unlock-label-dedup-test: `28 passed, 0 failed`, exit 0
- recruitment-batch-contract-test: exit 1, `ReferenceError: effectiveGameDifficultyForOwner is not defined` (CZERWONE, otwarte)
- general-capital-recruitment-order-test: exit 1, 11 PASS, `ReferenceError: hexHasRoomFor is not defined` (CZERWONE, otwarte)

## Dowody mutacyjne (stan)
- forced-war-bronze/iron (R1 Evaluatora): mutacje zmierzone przez Evaluatora; nie powtarzane.
- hex-tooltip, mgla, ai-dlug, rally: NIE_ZMIERZONO mutacja samego pliku testu (patrz zarzut 5 dla helpera).
- okolica: helper sameFnAfter sprawdzony na trzech przypadkach syntetycznych (patrz zarzut 1).

## BLOKADY
1. recruitment-batch-contract: CZERWONE; łańcuch zależności purchaseRecruitmentUnit (klasa B, wymaga przebudowy harnessu).
2. general-capital-recruitment-order: CZERWONE; ta sama przyczyna (browser-side names).
3. unit-replace-full-cost F0: DECYZJA ABC właściciela (zamiennik Taran okuty -> Katapulta, Oblężniczy wykluczony z Zastąp).
4. Punkt 6 (D-FOG-F): ZAMKNIĘTY na bazie bez zmiany; runtime NIE_ZMIERZONO.

## RUNDY
2/5 (obrona Operatora po zarzutach Evaluatora z 5bed9d7cc). Ostatni werdykt Evaluatora: PASS-WITH-NOTES, bez werdyktu końcowego (rola FC).

## ZAŁOŻENIA
- Dispatch oryginalny nieobecny na origin/main; użyty DODATEK z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0 (jak w R1).
- reservedUnitTypeNamesForOwner w fixture recruitment-batch = pusty Set (patrz 2b).
- Klasyfikacja okolica = A na podstawie odległości kod/test i wiringu; nie wykonano mutacji src (zakaz zmian gra/src).
- hex-tooltip: wiersze listy rozdzielane wzorcem "<Nazwa> → "; tekst z jednego renderu w środowisku testu.

NASTĘPNY KROK: (1) Orkiestrator: decyzja ABC właściciela dla unit-replace F0 (nie rozstrzygam). (2) Runda Operatora 3 dla recruitment-batch-contract i general-capital-recruitment-order: przebudowa harnessu (klasa B), bez zmian gra/src. (3) Evaluator na nowym SHA (ten commit) -- w tym: weryfikacja okna sameFnAfter i granicy wiersza hex-tooltip.
DEPLOY/PUSH: NIE WYKONANO
