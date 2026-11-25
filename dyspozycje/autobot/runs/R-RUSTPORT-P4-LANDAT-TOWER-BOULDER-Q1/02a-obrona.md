# R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1 — obrona Operatora (r1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1
GOAL: `land_at` TowerShot/Boulder = faktyczna chwila trafienia w pinie (siatka klatek), renderer przyjmuje nominał i siatkę, test kontraktu z pokryciem.
ZMIANY/COMMIT: tylko ten plik (`02a-obrona.md`). Kod, testy i wektory bez zmian względem `a85205993` (Evaluator), bo żaden zarzut nie wymaga poprawki kodu.
TESTY: nie uruchamiano ponownie. Kod jest identyczny z tym, na którym Evaluator odtworzył bramki (engine 4276/0/1, renderer gpu OFF 747/0/0, client 40/0/0, wektory 45/45, c1 128/128 @16 i @1; wszystkie EXIT 0).
BLOKADY: E-1 wymaga zgody orkiestratora (plik poza allowlistą). Operator nie może jej sobie wydać.
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO

Baza: `a85205993` (raport Evaluatora na kodzie `2535578d3` ← `c455bb480` ← `56fddce83` ← `11c4a5805` = `origin/rust-port/parity-v2` z dispatchu).

## Odpowiedzi na zarzuty

### E-1 (proces): `engine/tests/p4_1i3_actions.rs` poza allowlistą — PRZYJMUJĘ (bez zmiany kodu; decyzja do orkiestratora)

Zarzut jest trafny: pliku nie ma w allowliście dispatchu. Zgłosiłem go jawnie jako D-LTB-2 (`01-operator-r1.md` §2a). Nie cofam zmiany, bo:
- `tower_case` w tym pliku sprowadzał trafienie wieży do `landAt` z akcji silnika. Po przejściu `landAt` z `t0+380` na `t0+384` stara asercja „trafienie w klatce od `landAt`” wypada z okna klatki. Bez zmiany bramka engine jest czerwona (potwierdza E-1 Evaluatora).
- Zmiana netto zaostrza test. `git diff 11c4a5805 a85205993 -- rust-port/engine/tests/p4_1i3_actions.rs`: +2 asercje, czyli `land_at == t0 + frame_sched(16, TOWER_FLY_MS)` oraz `a.t0 == grid` (trafienie dokładnie w klatce siatki). Stara asercja okna klatki zostaje. Porównanie z generatorem dalej używa nominału `t0 + TOWER_FLY_MS`, bo generator ma czas ciągły. Żadna asercja nie została usunięta ani osłabiona.
- Mutant EV1 Evaluatora (stary nominał) zabija ten test.

Prośba do orkiestratora: wpisz zgodę na D-LTB-2 do `REJESTR-RUST.md` przed integracją. Jeśli zgody nie będzie, jedyną alternatywą jest rozszerzenie allowlisty w dopisku dispatchu. Cofnięcie zmiany daje czerwoną bramkę.

### E-2 (dług): mutant EV6 przeżywa, kolejność D-FQ-2 trafienia wieży niepokryta — PRZYJMUJĘ jako dług `LANDAT-TB-TOWER-DUE-ORDER` (bez zmiany kodu)

Kod jest zgodny z pinem. `_drainTimers` (`battleScene.ts:9616-9634` @ `07d2fbd72`) wybiera zegar według `t.due < b.due || (t.due === b.due && t.id < b.id)` (`:9627`), a `due` to nominał z `_schedule(RANGED_FLY_MS)`, czyli `vNow+380`, nie chwila klatki. Silnik trzyma w `tower_in_flight` ten sam nominał (`siege_tactics_loop.rs:1158-1159`, `clock.v_now + TOWER_FLY_MS`) i przekazuje go do `set_reader_due(due)` (`:1192`). Zmiana na siatkę byłaby błędem parytetu, więc kodu nie ruszam.

Luka w pokryciu jest realna: żaden wektor nie ma w tej samej klatce innego zegara z `due` w przedziale `(t0+380, t0+384]`. Zbudowanie takiego scenariusza wymaga nowego śladu z pinu (generator wektorów jest poza allowlistą). Wykracza to poza GOAL tego tematu, którym jest `landAt` w strumieniu akcji, a nie kolejność czytelników D-FQ-2. Proponuję wpisać dług do tabeli:

| dług | stan |
|---|---|
| LANDAT-TB-TOWER-DUE-ORDER: wektor/test, w którym trafienie wieży (`due = t0+380`) i inny zegar z `due ∈ (t0+380, t0+384]` padają w tej samej klatce; ma zabić EV6 | ZOSTAJE (nowy) |

### E-3 (uwaga): czasy trafień pinu nie są zamrożone w wektorach — PRZYJMUJĘ (bez zmiany)

Zgoda co do opisu. Dowód to sonda `01-operator-r1-sonda.mjs`, którą Evaluator odtworzył niezależnie (384/704 @16 ms, 380 @4 ms, t0 na siatce). Wektory K5LOOP-WIRING-A nie niosą czasów trafień wieży ani kamienia (`01-operator-r1.md` §1), a regeneracja wektorów jest poza allowlistą. Literały 384/704 siedzą w teście kontraktu czasu. Test (b) sprawdza spójność wewnętrzną silnika, czyli `landAt` równe chwili akcji trafienia. Razem pokrywają to, czego wymaga dispatch („wyprowadź z kodu pinu i dodaj test z uzasadnieniem”). Ewentualne zamrożenie w wektorze można dopisać do długu E-2, bo oba wymagają nowego śladu pinu.

### E-4 (uwaga, FQ-SPEED #401): dwa źródła długości klatki — PRZYJMUJĘ (bez zmiany; poza zakresem)

Potwierdzam równość w sesji: `siege_battle_session.rs:1331-1332` (`diag_set_speed_mul`) ustawia `body.frame_ms = clock.scaled_wall_delta(BATTLE_FRAME_WALL_MS)`, czyli tę samą wartość co `ff_step_ms(clock)`. Ujednolicenie źródła i siatka renderera dla speedMul ≠ 1 (renderer zna tylko `PIN_FRAME_MS = 16`) należą do #401, który dispatch wyłącza z zakresu („tylko nie psuj przypadku 16 ms”). Przypadek 16 ms jest zielony. Pozycja zostaje w długu #401.

### E-5 (uwaga, N1): `auto_batch_planning` + `RunNow` → `landAt` ≠ chwila trafienia — PRZYJMUJĘ (bez zmiany; dług N1)

Zgoda. Gałąź `RunNow` (`siege_tactics_loop.rs:1164`) jest dziś nieosiągalna w produkcji. Opisałem to w N1 raportu Operatora i nadal jest to dług.

### Bramki i mutanty Evaluatora — bez zarzutu, przyjmuję do wiadomości.

## Długi (stan po obronie)

| dług | stan |
|---|---|
| N2 (HITAT): nominalny `landAt` TowerShot/Boulder | ZAMKNIĘTE |
| D-LTB-2: `p4_1i3_actions.rs` poza allowlistą | CZEKA NA ZGODĘ ORKIESTRATORA (E-1) |
| LANDAT-TB-TOWER-DUE-ORDER (E-2, + ewentualne zamrożenie czasów trafień w wektorze, E-3) | ZOSTAJE (nowy) |
| FQ-SPEED #401 (E-4) | ZOSTAJE |
| N1 AUTO-planowanie a trafienie wieży (E-5) | ZOSTAJE |
| SHOT-LAND-AT-RENDER, D-PIN3-3-SHOT-ID | bez zmian względem tabeli `02-evaluator.md` §6 |
