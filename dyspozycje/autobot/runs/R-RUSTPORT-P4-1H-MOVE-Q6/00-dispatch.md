# DISPATCH R-RUSTPORT-P4-1H-MOVE-Q6 (runda 1) — `move_unit` = planMarchTo + executeMarchSegmentForUnit (P4-1H / #252)

DOMENA: GAME (ruch jednostki i plan marszu, silnik). MODEL: OPUS we wszystkich rolach (seria P4-1, decyzja właściciela).
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` = `9f1a29af3` (zawiera zintegrowane Q4, Q5, K5 V5/V6 i R7K7C r2). Zapisz SHA w raporcie. Worktree detached. Pin: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło: `dyspozycje/rust-port/p4/P4-1H-COMMANDS-ROZPOZNANIE.md` §4 wiersz `R-RUSTPORT-P4-1H-MOVE-Q6` (OBOWIĄZKOWO) i pkt 158 (`armyStackLimit`).
Zależności zintegrowane: Q3 (RJ-REPIN, `pathfinding.rs`), Q4 (`playable_movement.rs`), Q5 (`preview_path`).
Kod wejściowy: `rust-port/engine/src/domain/playable.rs` (`move_unit`, reguła „tylko sąsiad” ok. `:937`), `rust-port/engine/src/domain/playable_movement.rs`, `rust-port/engine/src/bridge.rs` (uwaga: w repo to `engine/src/bridge.rs`, nie `domain/bridge.rs`).

## ERRATA WIĄŻĄCE (z Q4 i Q5 — obowiązują)
1. **Typ ruchu `f64`.** Decyzja z Q4: `PlayableUnit.movement` i `movement_max` są dziś `u8`; koszty dróg są ułamkowe (1/3, 2/3, 0,2). Ten temat MUSI przenieść je na `f64` przy pierwszym odjęciu kosztu ułamkowego i zapisać to w raporcie. Zmiana dotyka literałów `PlayableUnit { … }` w testach — **lista plików do allowlisty** wyznacz poleceniem `git grep -l 'PlayableUnit {' rust-port/engine/tests` na bazie i wpisz ją do raportu (Q4 wskazywał co najmniej 9 plików testów). Zapis/odczyt JSON musi pozostać bajt-w-bajt dla danych bez zmian (golden).
2. **`PlayerId` ≠ `ownerId` z webu.** Adapter przekazuje surowe `PlayerId` (gracz = 1); web ma gracza = 0 i barbarzyńców `< 0`. Logika `ownerId === 0` / `< 0` (np. Żegluga `main.ts:14589-14593`) — **NIE_ZMIERZONO**, nie zgaduj mapowania. Jeśli napotkasz taką gałąź w zakresie Q6, zapisz NIE_ZMIERZONO i zatrzymaj tylko tę gałąź.
3. **Strażnik `isMe(uSel.ownerId)`** (`main.ts:32301-32306`) należy do wywołującego hovera/handlera, nie do `move_unit` — nie przenoś go do silnika.
4. **Stos: `armyStackLimit()` = 500** (`main.ts:4358-4360` → `BATTLE_MAX_PER_SIDE` → `MAX_PER_SIDE = 500`, `battle/battleScene.ts:721`, `:723`; Rust: `ARMY_STACK_LIMIT = 500`, `save_migrations.rs:221`). Podaj tę wartość jawnie w testach.

## ZAKRES
1. `move_unit` = `planMarchTo` (`main.ts:31213-31300`) + `executeMarchSegmentForUnit` bez animacji: tylko skutki w zakresie dostępnego stanu (`main.ts:44100-44111`, `:44180-44194`). Geometria i błędy jak w pinie.
2. Usunięcie reguły „tylko sąsiad” (`playable.rs:937`): cel może być dalej niż jeden heks; trasa z `pathfinding`.
3. `attack_unit_id` w komendzie (cel = wróg: zapisz plan, bitwa poza zakresem).
4. Przejście `movement` na `f64` (errata 1).

## WEKTORY / TESTY (plik:linia pinu przy każdej wartości)
- cel w zasięgu w jednym rozkazie: dotarcie, plan usunięty;
- cel wieloturowy: plan zostaje, `turn_stops` zgodne z `planPathTurns`;
- brak trasy → błąd zgodny z pinem;
- obce miasto na trasie (blokada);
- limit stosu: stos 500 + 1 wchodzący → odmowa; 499 + 1 → dopuszczone;
- cel = własna jednostka (zachowanie jak w pinie);
- cel = wróg → zapis planu, bez bitwy;
- brak MP → plan zapisany, bez segmentu;
- golden zapisu bez zmian (JSON bajt-w-bajt dla danych bez nowych pól).
- Mutacje (MUSZĄ dać FAIL): (a) przywrócenie reguły „tylko sąsiad”; (b) limit stosu 499 zamiast 500; (c) ułamkowy koszt zaokrąglany do całości (`u8`-owy przepływ); (d) pominięcie planu przy celu wieloturowym.

## KRYTERIA KOŃCA
1. Testy zielone; mutacje FAIL (wyniki w raporcie).
2. Bramki EXIT 0 w `rust-port/engine`: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` — **pełny test silnika obowiązkowy**, z co najmniej 8 GB wolnego miejsca. Jeśli miejsca brak, zapisz NIE_ZMIERZONO i zatrzymaj się (nie uruchamiaj części).
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą.
4. Decyzje techniczne (f64, lista plików testów, mapowanie) zapisane w raporcie.

## ALLOWLISTA
- `rust-port/engine/src/domain/playable.rs`
- `rust-port/engine/src/domain/playable_movement.rs`
- `rust-port/engine/src/bridge.rs`
- `rust-port/engine/src/domain/save_load.rs` (TYLKO pola `movement`/`movement_max` i migracja JSON, jeśli potrzebna)
- `rust-port/engine/tests/p4_1h_move_*.rs` (NOWE)
- pliki testów z literałami `PlayableUnit { … }` — wyłącznie lista z `git grep` z raportu (errata 1)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1H-MOVE-Q6/**`

Commit jawnym `git add` (nigdy `-A`). NIE commituj `Cargo.lock`. Bez push do parity. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo i unikalny; usuń po bramkach.
