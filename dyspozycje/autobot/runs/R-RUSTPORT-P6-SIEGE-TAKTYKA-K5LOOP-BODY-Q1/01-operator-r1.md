# 01-operator-r1 — R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1 (runda 1/5, Operator HAIKU)

STATUS: FAIL (zakres częściowy: GOAL główny NIE_ZMIERZONO; dostarczono wektory, test ścieżki halt i bramki)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1
GOAL: Produkcyjne ciało jednostki w `LoopBody` (składanie `activate_unit` K5H + `single_blow_full`/`single_blow_env` K5I/K5I2b2 wg pinu `_activateUnit`), generator wektorów wykonujący tekst pinu `_activateUnit`/`_singleBlow` z realnymi funkcjami boju, >= 200 sekwencji end-to-end, wektory fadingOut/removed/routed/moveLeft>0, test halt_unsupported.

ZMIANY/COMMIT:
- Baza: ec7a0ff78 (detached, wg dispatchu).
- Commit kodu: e6154709c34db42974c7de2d988a6402aeddf1eb (lokalna gałąź `rust-port-wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1`, bez push).
- Allowlista: `rust-port/engine/tests/p6_siege_tactics_loop.rs`, `rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs`, `rust-port/engine/tests/p6_siege_tactics_loop_vectors/vectors.json`, katalog raportu. Nie dotknięto `src/domain/siege_tactics_*.rs`, `gra/**`, `data/**`, `Cargo.toml`, `Cargo.lock` (wygenerowany lokalnie, usunięty, nie commitowany).
- Generator: dodano losowane flagi jednostki `fadingOut` (8%), `removed` (5%), `routed` (8%) do specyfikacji i do `mkUnit`; statystyki w `stats` (withFadingOut/withRemoved/withRouted/withMoveZero). Wektory: 360 sekwencji, `vectors.json` 6 698 267 B (limit 8 MB OK). Seed bez zmian, ale dodatkowe wywołania PRNG po starych polach zmieniły zawartość sekwencji.
- Test: `unit_of` czyta `fadingOut`/`routed`/`removed` (domyślnie false); nowe testy `p6_siege_tactics_loop_vectors_cover_fading_removed_routed_and_zero_mp` i `p6_siege_tactics_loop_halts_without_siege_instead_of_panicking` (wallCol=-1 → `unsupported` ustawione, `finished`, brak zwycięzcy).

TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- `cargo fmt --check` (rust-port/engine): PASS (po rustfmt na pliku testu).
- `cargo clippy --all-targets -- -D warnings`: PASS.
- `cargo test --lib`: 88 passed, 0 failed.
- `cargo test --test p6_siege_tactics_loop`: 4 passed, 0 failed (w tym zgodność z pinem na wszystkich 360 sekwencjach z wycinanym tekstem pinu, pokrycie nowych flag, halt_unsupported).
- Generator: `node rust-port/engine/tests/p6_siege_tactics_loop_gen.mjs` uruchomiony; strażnik SHA fragmentów pinu przeszedł.
- Pełny `cargo test`: NIE_ZMIERZONO (wykona runda integracyjna).

BLOKADY:
1. NIE_ZMIERZONO / NIE ZROBIONE: produkcyjne ciało jednostki w `LoopBody` nie zostało napisane. `activate_unit` (K5H) zwraca zamiar (`ActivateEvent`), a jego delegaty (`_fleeStep`, `_rangedAction`, `_cavalryAction`, `_phalanxAction`, `_advanceStep`, `_fallBackStep`, `_attackWallTile`, `_advanceToward`) nie są portowane w tym module wg jego dokumentacji. Złożenie ciała wymaga klocka mapowania `TurnSeqState` -> `ActivateUnit`/`ActivateScene` (pola `can_shoot`, `is_siege_*`, `range`, `doctrine_*` nie są w `CombatUnit`) oraz portu K5I2b2 w tej samej rundzie. Poza zakresem jednej rundy Operatora.
2. NIE_ZMIERZONO: generator nadal stubuje `_activateUnit` (timer + nop/kill/hurt), NIE wykonuje tekstu pinu `_activateUnit`/`_singleBlow` z realnymi funkcjami boju; RNG nie jest deterministicznie wstrzyknięty do boju.
3. NIE_ZMIERZONO: brak rozbieżności Rust<->pin do naprawy (wszystkie 360 sekwencji zgodne przy stubie ciała), więc nie było okazji naprawy sterownika.
4. Infra: przed startem wolne 8,6 GB (wymóg dispatchu df >= 8 GB spełniony), po bramkach 7,5 GB. Target kompilacji w scratchpadzie (poza repo), do usunięcia po raporcie.
5. Dispatch nie podał nazwy gałęzi roboczej; utworzono lokalną gałąź `rust-port-wip/R-RUSTPORT-P6-SIEGE-TAKTYKA-K5LOOP-BODY-Q1` na commicie kodu (bez push).

RUNDY: 1/5 (ostatni werdykt: brak; decyzja orkiestratora wymagana: czy zakres pkt 1-2 dostać jako osobne tematy, np. K5-LOOP-BODY-MAP i K5-LOOP-BODY-PIN-GEN).

NASTĘPNY KROK: Evaluator i Final Control na e6154709c. Orkiestrator decyduje o podziale GOAL (ciało produkcyjne jako osobny temat, generator z wykonaniem pinu jako drugi). Tematy K5-LOOP (WIEZE, AUTO, WYLOM, RESUME) zależą od tej decyzji.

DEPLOY/PUSH: NIE WYKONANO (zakaz operatora: brak push, brak integracji).
