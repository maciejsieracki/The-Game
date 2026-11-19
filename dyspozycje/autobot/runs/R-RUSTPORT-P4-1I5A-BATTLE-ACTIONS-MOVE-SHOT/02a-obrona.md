# 02a — Obrona Operatora (R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT)

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I5A-BATTLE-ACTIONS-MOVE-SHOT
GOAL: DTO `Move`/`Shot` w `BattleActionKindDto`, `actions_to_dto` bez `MoveWithoutDto`/`ShotWithoutDto`, konsument w `renderer/src/battle/playback.rs`.
ZMIANY/COMMIT: baza obrony = `a477c005f` (kod `841a54974`, baza tematu `32006733b`); poprawka testu `c9365837d` (tylko `rust-port/renderer/tests/battle_playback_move_shot.rs`, allowlista: nowe `renderer/tests/*`); raport w commicie następnym po `c9365837d` na lokalnej gałęzi `obrona-i5a-r1`. `playback.rs` bez zmian.
TESTY: renderer (bez `--features gpu`) fmt EXIT 0, clippy `--all-targets -D warnings` EXIT 0, `cargo test --all-targets` EXIT 0 (726 passed, 0 failed, 0 ignored). Start bramki przy 12 GB wolnego, żaden inny build renderera nie działał. `Cargo.lock` przywrócony (DŁUG-T1-LOCK), target usunięty.
BLOKADY: brak
RUNDY: obrona po r1/5
NASTĘPNY KROK: Final Control
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź |
|---|---|---|
| 1 | Zakres werdyktu (a477c005f / 841a54974 / 32006733b) | Przyjmuję jako opis. Obrona startuje z `a477c005f`. |
| 2 | Bramki EXIT 0, 4119/726 | Przyjmuję jako opis. Po poprawce renderer powtórzony: 726 passed. Engine i view-model nie były zmieniane, więc nie powtarzałem ich bramek. |
| 3 | EV-R1 przeżył (`if u.col != from.0`) | **PRZYJMUJĘ.** W `move_and_shot_errors_are_reported` dodałem przypadek, w którym `from` = `(c, r+1)` przy jednostce na `(c, r)` (różnica tylko wierszem). Oczekiwany wynik: `Err(MoveFrom { expected: (c, r+1), actual: (c, r) })`. Mutant ponownie uruchomiony: **ZABITY** (panika `battle_playback_move_shot.rs:565`, EXIT 101). |
| 4 | EV-R3 przeżył (`arrive_at != …` → `<`) | **PRZYJMUJĘ.** Dodany przypadek `arriveAt = t0 + MOVE_STEP_MS + 1` z oczekiwanym `Err(ArriveAt)`. Mutant: **ZABITY** (panika `:555`, EXIT 101). |
| 5 | EV-R5 przeżył (`land_at != …` → `<` w `Shot`) | **PRZYJMUJĘ.** Dodany przypadek `landAt = t0 + RANGED_FLY_MS + 1` z oczekiwanym `Err(ShotLandAt)`. Mutację nałożyłem wyłącznie na gałąź `Shot` (gałąź `TowerShot` z `LandAt` bez zmian). Mutant: **ZABITY** (panika `:625`, EXIT 101). |
| 6 | EV-R6 równoważny | Przyjmuję ocenę Evaluatora, że mutant jest równoważny. Nic do zmiany. |
| 7 | Plan r2: punkty (1) do (4) | **PRZYJMUJĘ, wykonane:** (1) `arriveAt+1` daje ArriveAt, (2) `landAt+1` daje ShotLandAt, (3) `from` różne tylko wierszem daje MoveFrom, (4) EV-R1, R3 i R5 zabite, pełne bramki renderera mają EXIT 0. `playback.rs` nie jest zmieniony. |
| 8 | Nota: `p6_k5loop_close_r2.rs`/`r3.rs` poza allowlistą | Przyjmuję. Zmianę wymusił GOAL: usunięte warianty błędu. Jej ocena należy do FC. W obronie nic nie zmieniałem. |
| 9 | Nota: `p6_k5loop_close_r4.rs` poza allowlistą | Przyjmuję. To dodatek, który sprawdza zgodność z wektorami r4. Akceptację zostawiam FC. W obronie nic nie zmieniałem. |
| 10 | Zgodność z pinem, D-WIR-7, długi FC-U3-MISS / PLAYBACK-OVERLAP | Przyjmuję. Wpis D-WIR-7 do `REJESTR-RUST.md` należy do orkiestratora (poza allowlistą). |

## Szczegóły poprawki

Nowe przypadki są wstawione w `move_and_shot_errors_are_reported` z rosnącymi `t0`: 1.5 i 1.75, między przypadkami 1.0 i 2.0, oraz 4.5 między 4.0 i 5.0. Każdy odrzucony element nie zmienia sceny. Pokrywają to asercje `before == q`, `calls().is_empty()` i `moves_in_flight() == 0`, które już były w teście.

Skrypt mutantów: każdy mutant to podmiana tekstu w `playback.rs`, potem uruchomienie `cargo test --test battle_playback_move_shot` i przywrócenie pliku. Po zakończeniu `git status` pokazywał tylko plik testu.
