# Poprawki zapisu stanu AI i przebadanie pozycji — R-WEB-SAVE-STATE-FIX-Q1 (tag SAVESTATEFIX)

Data: 2026-11-28. Baza: `aaae7b4f811c87a56bcb4ec7d4841d3ae3147419` (origin/main, po SAVEAUDIT).
Źródło listy: `dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md` (§3.1, §3.4, §4 follow-upy 1–7).
Zakres zmian w grze: wyłącznie zapis/reset/odtworzenie dwóch pól w `gra/src/main.ts` (FIX #1 i FIX #2). Brak zmian w balansie, `gra/data/**`, formacie istniejących pól zapisu.

## 1. Stan wiążący — co naprawione

| Pole | Zmiana w `gra/src/main.ts` | Skutek dla gracza |
|---|---|---|
| `aiWonderStuckTurnsByOwner` (FIX #1) | zapis w `meta` (`Array.from(...entries())`, ok. 42921); odtworzenie w `restoreGameFromSave` po `clear()` (ok. 53119–53122); reset świata (`doStartGame`, ok. 51331) zachowany | po wczytaniu licznik utykania cudu AI nie zeruje się; cud AI nie opóźnia się o do 30 tur z powodu wczytania |
| `aiGarrisonUnitIdByOwner` (FIX #2) | zapis w `meta` (ok. 42924); `clear()` + odtworzenie w `restoreGameFromSave` (ok. 53125–53128); `clear()` przy resecie świata (`doStartGame`, ok. 51332) | po wczytaniu typ garnizonu AI nie dziedziczy wpisów z poprzedniej gry w sesji; rezerwa złota na garnizony liczona z zapisanego wyboru AI |

Zgodność wstecz: stary zapis bez tych pól wczytuje się z pustymi mapami (dzisiejsze zachowanie). Format zapisu: tylko dodane opcjonalne pola w `meta`.

Uzasadnienie linii:
- zapis: nowe pola w obiekcie `meta` obok `aiSurplusRedirectedOwners`/`aiSliderStateByOwner` (wzorzec `aiCsFailCount`);
- restore: `clear()` przed odczytem, bo stan poprzedniej gry w sesji nie może przeciekać (wzorzec AICSFIX);
- reset: `aiWonderStuckTurnsByOwner.clear()` już istniał; `aiGarrisonUnitIdByOwner.clear()` dodany obok, bo mapa nie była czyszczona nigdzie (audyt §3.4).

## 2. Testy i bramki (liczby z surowego wyjścia, uruchomienie 2026-11-28, worktree)

- `npx tsc --noEmit` — exit 0.
- `node tools/save-load-ai-state-fields-test.cjs` (NOWY) — 21 PASS / 0 FAIL: T1 zapis, T2 kolejność clear→odczyt→set w restore, T3 reset czyści; 12 mutacji semantycznych (wycięty zapis, zapis `slice(0,0)`, wycięte odtworzenie, wycięte czyszczenie przy resecie, wycięte czyszczenie przy wczytaniu, czyszczenie po odtworzeniu) — każda czerwona dla właściwego pola; T5 behawioralny: `relaxedWonderCostThreshold(1, 12, 30)` = 1,6667, `(1, 0, 30)` = 1,0000 (B≠A).
- `node tools/logic-test.cjs` — LOGIC OK (213/213).
- `node tools/tech-tree-test.cjs` — 20 pass, 0 fail.
- `node tools/research-test.cjs` — PASSED 33 / FAILED 0.
- `node tools/unit-replace-test.cjs` — WSZYSTKIE TESTY ZIELONE (21/21).
- `node tools/combat-test.cjs` — COMBAT TEST 6/6.
- `node tools/ai-test.cjs` — 297 passed, 0 failed.
- `node tools/early-grace-15-test.cjs` — 33 passed, 0 failed.
- `node tools/society-breakdown-test.cjs` — 56 OK, 0 FAIL.
- `node tools/ai-city-order-need-wiring-test.cjs` — 267 passed, 0 failed (of 267).
- `node tools/save-load-ai-cs-absorption-state-test.cjs` — 27 PASS / 0 FAIL.
- `node tools/save-load-podzial-pracy-representation-test.cjs` — 5 PASS / 0 FAIL.
- `node tools/save-load-ledger-history-test.cjs` — 4 PASS / 0 FAIL.
- `node tools/save-load-sort-test.cjs` — OK (4/4).
- `node tools/determinism-save-load-resume-test.cjs` — WYNIK: PASS.
- `node tools/save-load-roundtrip-state-drift-test.cjs` (bez argumentów) — warstwa A (statyczna) zielona; test kończy się FAIL wyłącznie z powodu braku `--dist <abs-dist>` (warstwa B wymaga zbudowanego bundla, czyli `vite build` poza repo). Warstwa B NIE ZMIERZONO w tej rundzie. Build nie był wykonywany (zakaz `npm run build` w `gra/`).

Test live (c) NIE ZMIERZONO: nie uruchamiano `gra/tools/save-load-continuity-live.cjs` (Chromium). Nie podjęto prób osiągnięcia licznika > 0 na żywo, więc brak dowodu B==A dla licznika cudu. Dowód behawioralny ograniczono do funkcji progu (T5).

## 3. Przebadanie pozycji (werdykty z kodu; cytaty = linie w `gra/src/main.ts` w bazie)

### 3.1 playerStartHexByOwner / playerStartHex — werdykt: D (kandydat, NIE potwierdzony na żywo); poprawka NIE wdrożona

- `playerStartHex` (let, ok. 3292) i `playerStartHexByOwner` (ok. 3305) są przypisywane tylko w `applyClusterStartPlan` (11806, 11812; nowa gra) i w `applyClusterStartPlan` przy ręcznym rozmieszczeniu (35113 — tryb testowy). `restoreGameFromSave` ich nie ustawia i nie zapisuje (brak w ciele `buildSaveGameSnapshot`).
- Konsumenci decyzyjni dla gracza: `canFoundPlayerCityAt` przez `validateFirstPlayerCityPlacement` wymaga `isInStartReveal(q, r)` (ok. 14222, 17252, 17758), a ten czyta `playerStartHexFor(ME())` (ok. 14175). Wszystko to tylko gdy `isAwaitingFirstPlayerCity()` (przed założeniem stolicy).
- Zapis przed założeniem stolicy nie jest blokowany (bramki `isSaveBlockedByBattle`/porażka, ok. 43064–43090, 43236–43250 nie uwzględniają tego stanu).
- Skutek (wniosek z kodu): po wczytaniu takiego zapisu w świeżej sesji (lub w tej samej po innej grze) krąg startu i podświetlenia pierwszego miasta mogą dotyczyć starego heksu, a prawidłowy start gracza może być poza kręgiem — gracz nie założy stolicy. Live NIE ZMIERZONO.
- Propozycja (do decyzji orkiestratora, nie wdrożone): zapisać `playerStartHex` (i `playerStartHexByOwner`) w `meta` jako opcjonalne pole; w `restoreGameFromSave` odtworzyć, a przy starym zapisie zostawić dzisiejsze zachowanie.

### 3.2 pendingForeignSpawnCities / pendingSameTypeRival* / pendingSameTypeRivalCountSecond — werdykt: D — ZGŁOSZONE JAKO DECISION_REQUIRED (poprawka NIE wdrożona)

- Deklaracje 10381–10400; ustawiane w `applyClusterStartPlan` (11831–11841, nowa gra); drenowane przy założeniu stolicy gracza (11996–12009 dla rywali tego samego typu; 12238–12240 dla obcych cywilizacji, `spawnPendingForeignClusters`).
- Żadna z kolejek NIE jest w `buildSaveGameSnapshot` ani w `restoreGameFromSave` (grep: tylko diagnostyka 35011, 35606–35609).
- Zapis przed założeniem stolicy nie jest blokowany (jak w 3.1). Po wczytaniu kolejki są puste, a `tryFoundPlayerCityAt` drenuje pusty stan — miasta-państwa tego samego typu i obce klastry AI NIE pojawiają się w całej grze.
- Skutek dla gracza: świat po wczytaniu ma mniej państw i mniej cywilizacji AI niż świat, z którego zapis powstał. Live NIE ZMIERZONO (nie wiadomo, czy UI pozwala zapisać przed pierwszym miastem w praktyce; w kodzie brak bramki).
- Propozycja: zapisać kolejki w `meta` (opcjonalne pola) i odtworzyć, albo zablokować zapis przed założeniem stolicy. Pierwsze rozwiązanie zmienia format zapisu (dodanie opcjonalnych pól), drugie zmienia zachowanie UI. Wybór należy do orkiestratora/właściciela.

### 3.3 aiTurnAwaitingBattle (ok. 14948) — werdykt: NIEROZSTRZYGNIĘTE (D? do testu na żywo)

- Flaga i `aiCmdResume` nie są w zapisie. `isSaveBlockedByBattle()` (ok. 43064) sprawdza tylko otwartą scenę bitwy i ekran podsumowania, nie stan „AI czeka na bitwę”.
- Okno, w którym flaga jest `true` a bitwy nie ma na ekranie (między zamknięciem bitwy a wznowieniem fazy AI), jest w kodzie możliwe (komentarze 14953–14966, 43451–43477). Czy użytkownik może wtedy zapisać i czy po wczytaniu faza AI się zgubi — NIE ZMIERZONO.
- Nie wdrażano poprawki (poza zakresem potwierdzonego D).

### 3.4 Kandydaci z pozycji 7 (potwierdzenie przeliczenia przed pierwszym odczytem)

| Zmienna | Zapis | Odczyt | Werdykt |
|---|---|---|---|
| `citizenUpkeepByOwner` (5964) | koniec tury, ok. 45040 | panel Surowców ok. 4155, z fallbackiem `computeCitizenResourceDrain` gdy brak wpisu (komentarz 4148) | R (fallback zamierzony; czyszczone przy wczytaniu, ok. 51323) |
| `buildingResourceUpkeepByOwner` (5976) | koniec tury, ok. 44699, 44743 | panel Surowców ok. 4183 (fallback, komentarz 4163) | R |
| `unitResourceUpkeepByOwner` (5983) | koniec tury, ok. 44701, 44745 | panel Surowców ok. 4185 (fallback) | R |
| `converterProducedLastTurnByOwner` (5982) | koniec tury, ok. 44700, 44744 | tylko `realizedLastTurn` w HUD, ok. 21243 | S (UI; po wczytaniu pusty do końca tury) |
| `aiFoodTickNetByOwner` (11197) | koniec tury, ok. 44726 (przed wszystkimi zakupami tej samej tury) | `aiUpkeepRunwayAllows` ok. 40065; brak danych = bramka nieaktywna | R (ten sam wzorzec co #8; brak okna odczytu przed zapisem) |
| `movedByPlayerThisTurn` (35989) | dodawanie ruchów gracza, ok. 36002 | brak odczytów decyzyjnych (tylko `size` w diagnostyce, ok. 35595) | S |
| `diploZeroTrustWarned` (10779) | ok. 12765 | deduplikacja ostrzeżeń, ok. 12742–12764 | S (po wczytaniu ostrzeżenie może pojawić się ponownie) |

### 3.5 Pozostałe z listy audytu (potwierdzone w tej rundzie wcześniej, bez zmian)

- `aiWonderStuckTurnsByOwner` (D) — naprawione (FIX #1).
- `aiGarrisonUnitIdByOwner` (D warunkowe) — naprawione (FIX #2).
- `difficultyBonusGrantedOwners`, `lastDiplomaticContactsSnapshot`, `aiNnsHoldOwners`, `aiNnsUncoveredOwners`, `aiImprovementBudgetByOwner`, `aiSurplusReportByOwner`, `aiGoldIncomeByOwner`, `aiWonderPracaTickByCity`, `pendingAdministratorChanges` — bez zmian (klasy S/R z audytu).

## 4. Zakres pliku zmian

- `gra/src/main.ts` — 21 linii dodanych (2 pola zapisu z komentarzami, 2 bloki odtworzenia w restore, 1 `clear()` w resecie). Zero usuniętych linii.
- `gra/tools/save-load-ai-state-fields-test.cjs` — nowy test statyczny i behawioralny.
- `dyspozycje/analizy/ZAPIS-STAN-POPRAWKI-2026-11-28.md` — ten dokument.
- `dyspozycje/autobot/runs/R-WEB-SAVE-STATE-FIX-Q1/10-operator-claude.md` — raport rundy.

## 5. NIE ZMIERZONO

- Test live (c) z licznikiem cudu > 0 i B==A (nie uruchomiono).
- Warstwa B `save-load-roundtrip-state-drift-test.cjs` (wymaga bundla `--dist`).
- Realny zapis przed założeniem stolicy i jego skutki (3.1, 3.2) — tylko kod.
- Skutek 3.3 (okno AI-bitwa) — tylko kod.
- Wpływ FIX #1 na grę (opóźnienie cudu po wczytaniu) — tylko test progu (T5), bez biegu gry.
