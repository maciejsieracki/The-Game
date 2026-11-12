STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5-AUDYT-Q1
GOAL: Obrona operatora (runda 1) wobec 6 zarzutów Evaluatora r1: poprawka dokumentu K5 albo odrzucenie z dowodem.
ZMIANY/COMMIT: `dyspozycje/rust-port/p6/P6-SIEGE-TAKTYKA.md` (sekcja K5). Baza: `009aa8338` (Evaluator r1), kod operatora `30e48df5b`. Brak zmian `.rs`. SHA obrony: patrz `git log -1` na gałęzi roboczej (commit tego pliku i dokumentu). Dowód pinu: `git show 07d2fbd72:gra/src/battle/battleScene.ts`, SHA-256 `d784735e185c63f03d95c12a5de33855106b79432001dcc382c5ef335989d21d`, 20771 linii.
TESTY: `git diff --check` (dokument). cargo nie uruchamiane (brak zmian `.rs`, brak klocka). Wszystkie numery linii sprawdzone w pinie przez `sed -n` / `grep -n` na kopii pinu w scratchpad.
BLOKADY: NIE_ZMIERZONO w tej rundzie: ciała gałęzi `_cavalryAction` (`:6372`), `_phalanxAction` (`:6546`), `_rangedAction` (`:6656`), `_trySiegeTowerClimb` (`:8056`), `_siegeInfantryToTowerStep` (`:8087`) są wskazane liniami wejścia, ale ich wnętrza NIE czytane. Kopia `gra-robocza/srcKopiaMaster` nie porównana z `gra/src`.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r2 na tym SHA (sprawdzenie 6 odpowiedzi). Klocek K5b pozostaje na kolejną rundę (decyzja w K5.10).
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 1. L8 `_armyMoraleRatio` (PRZYJMUJĘ)
Dowód: pin `:9988-9991` to jedna linia `return armyMoraleRatioWithoutCommander(arr);`. `grep -n 'armyMorale\|ArmyMorale'` na pinie zwraca tylko `:103` (import), `:9988`, `:9990` oraz wywołania `_armyMoraleRatio(...)`. Wersji z dowódcą w pinie nie ma. Zmiana: wiersz L8 ma status PORTED (`army_leadership.rs:123`), z uwagą, że pin ma jedną wersję.

### 2. Krok U7 w `_activateUnit` bez linii (PRZYJMUJĘ)
Zmiana: nagłówek `_activateUnit` `:6048-6299` i pozycja U7 są rozbite na U7.1-U7.9 z numerami linii pinu: onWallWalkway `:6129-6171`, wieża `:6179-6180`, machiny `:6187-6220`, DEFENDER HOLD `:6225-6235`, strzelec `:6241`, primaryRanged `:6249-6276`, kawaleria `:6284`, falanga `:6290`, melee `:6293-6298`. Kolejność odpowiada kolejności w kodzie. Zakres granic: `_activateUnit` zaczyna się `:6048` i kończy `:6299` (zweryfikowane `sed`). Pozostaje NIE_ZMIERZONO wnętrze gałęzi (patrz BLOKADY).

### 3. L14 `_schedule` / `events.rs:412` (PRZYJMUJĘ)
Sprawdzenie: `domain/events.rs:412` to `schedule(turn, phase, event)` z `enqueue`. Klucz kolejki to `(turn, phase, sequence)`. Pin: `_schedule` `:9595-9606` używa `due = vNow + max(0, ms)` i `id = vTimerSeq++`; `_drainTimers` `:9616-9634` bierze najwcześniejszy `due <= vNow`, remis po `id`. Modele nie są równoważne. Wiersz L14 ma teraz wynik rozstrzygnięty: odrzucone jako baza, K5e buduje własną kolejkę po czasie wirtualnym.

### 4. Ścieżka `skip()` bez startu: `_skipInstantFallback` `:3715` i `computeInstantResult` `:20389` (PRZYJMUJĘ)
Dowód: `:3691` `if (!this.started) { this._skipInstantFallback(); return; }`. Funkcja `:3715-3749`: `finished = true` (`:3717`), `wallEverBreached = true` (`:3721`), `computeInstantResult(...)` (`:3723`, definicja `:20389-20421`), `_endWinner`/`_endSurvivors`, `_showEndScreen` (`:3747`). Brak `_checkEnd`, brak `_beginTurn`. Dodano wiersz L30 w K5.8 i punkt 2a w K5.2.

### 5. Zakres wejścia SKIP (PRZYJMUJĘ)
Zmiana: K5.2 pkt 2 podaje `skip()` `:3680-3706` (deklaracja `:3680`, guard `:3681`), osobno blok FF `:3696-3704` i gałąź `!started` `:3691`. Wcześniejsze `:3677` nie odpowiadało żadnej linii guardu.

### 6. Numer linii inkrementu `_autoBatchToken` (PRZYJMUJĘ)
Dowód: pin `:5730` = `const token = ++this._autoBatchToken;`. Wcześniejsze `:5726` było błędne. Poprawiono w K5.1 (wiersz "token AUTO"). Przy okazji `:17339` (`this._autoBatchToken++`) potwierdzone.

## Potwierdzone bez zmian w tej rundzie
- SZTURM ODPARTY (K5.9): decyzja Q1 pozostaje zasadna; wnioski z `:10172-10188` nie zmieniano.
- Kolejność `_beginTurn` i `_checkEnd`, pozostałe numery linii: nie ruszane.
- Allowlista: 2 pliki w commicie obrony (dokument i ten raport). Brak `.rs`, brak `gra/`, brak `Cargo.lock`.
