# 03 — Final Control: R-RUSTPORT-P4-1I2-BATTLE-FRAME (runda 2)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I2-BATTLE-FRAME
GOAL: BattleFrameDto (view-model) i producent ramki ze stanu SiegeLoop po każdym fire, z flagą wież w silniku
ZMIANY/COMMIT: kod = 8d26847ba (Obrona r2) na bazie 585bb48e0; ten raport = commit FC na 8d26847ba (SHA w wyniku FC)
TESTY: niżej (FC uruchomił sam)
BLOKADY: brak blokujących; pełny engine --all-targets nie powtórzony przez FC (dysk 4,0–6,2 GB < 8 GB)
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora na parity-v2 (parity przesunęło się do 05b872fc5) + pełny cargo test engine
DEPLOY/PUSH: NIE WYKONANO
```

## Baza i ancestry

- Baza z dispatchu: `585bb48e0`. `git merge-base --is-ancestor 585bb48e0 8d26847ba` = TAK.
- Kod Operatora `d303607bf` jest przodkiem `8d26847ba` = TAK.
- `origin/rust-port/parity-v2` = `05b872fc5` (przesunięte po starcie tematu) — integracja wymaga merge/rebase i ponownej bramki.

## Allowlista (diff 585bb48e0..8d26847ba, 10 plików)

Wszystkie pliki na allowliście: `view-model/src/battle.rs`, `view-model/tests/battle_frame.rs` (nowy),
`engine/src/domain/siege_tactics_loop.rs`, `engine/src/domain/siege_tactics_frame.rs` (nowy),
`engine/src/domain/mod.rs` (wyłącznie `pub mod siege_tactics_frame;`), `engine/tests/p4_1i2_frame.rs`,
`engine/tests/p4_1i2_frame_fire.rs` (nowe), raporty w `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I2-BATTLE-FRAME/`.
`git diff --check` czysty. Brak `#[ignore]` w nowych testach. `Cargo.lock` nie w commicie. `gra/` nietknięte.

Zmiana w `siege_tactics_loop.rs`: pola `tower_destroyed`, `fire_observer`, metody odczytu, `destroy_tower_at_row`,
`breach_wall_row`, `mark_towers_without_tile` (wołane w `FireSiegeTowers` przed planowaniem, nie zmienia
planowania ani zegara) i wywołanie obserwatora po `apply` w `fire`. Logika walki i kolejność kroków bez zmian.
Zweryfikowane z pinem `07d2fbd72:gra/src/battle/battleScene.ts`: `_destroyTowerAtRow` `:4193-4199`,
`_fireSiegeTowers` `:4208-4219` (`:4215-4216` burzenie bez kafla), `_breachWallTile` `:7638-7648`.

## Bramki (FC, samodzielnie, na 8d26847ba; CARGO_TARGET_DIR=/tmp/fc-1i2-target, usunięty)

| Crate | Bramka | EXIT |
|---|---|---|
| view-model | `cargo fmt --check` | 0 |
| view-model | `cargo clippy --all-targets -- -D warnings` | 0 |
| view-model | `cargo test --all-targets --no-fail-fast` | 0 (12 binarek, 0 failed) |
| engine | `cargo fmt --check` | 0 |
| engine | `cargo clippy --all-targets -- -D warnings` | 0 |
| engine | `cargo test --lib` + 13 binarek celowanych (p4_1i2_frame, p4_1i2_frame_fire, p4_1i1_battle_outcome, p6_k5doc_state, p6_k5loop_outcome_pin, p6_siege_tactics_loop, _loop_body, _loop_body_pin, _loop_resume, p6_siege_wylom_tower, p6_tower_target_wiring, p6_wieze_2b1, p6_wieze_2b2) | 0 (lib 124/124, wszystkie ok) |
| engine | `cargo test --all-targets --no-fail-fast` (pełny) | FC: NIE_ZMIERZONO (dysk 4,4–6,2 GB < 8 GB); Obrona: 495/495 binarek, 3658 passed, 0 failed przy 8,7 GB |

Mutacje FC (powtórzone, plik przywrócony, `cmp` = SAME):
- M1 (obserwator przed krokiem, na początku `fire`): `p4_1i2_frame_fire` 0/2 → FAIL.
- M2 (obserwator tylko dla `LoopTimer::BodyDone`): `p4_1i2_frame_fire` 0/2 → FAIL.

## Orzeczenia zarzutów Evaluatora

1. [BLOKUJĄCY] brak testu ramki po każdym fire ze stanem po kroku — **ODDAL** (usunięte w r2). Nowy
   `p4_1i2_frame_fire.rs`: liczba ramek = liczba odpaleń liczona niezależnie, wszystkie rodzaje klocków,
   stan po kroku (HP po `complete` i po ciosie wieży, `roundNo`), zagnieżdżony `RunNow`. M1 i M2 dają FAIL (FC sprawdził).
2. [BLOKUJĄCY, bramka] brak pełnego `cargo test --all-targets` engine — **ODDAL** (Obrona wykonała przy 8,7 GB:
   495/495, 0 failed, w dwóch częściach z tych samych binarek). FC nie powtórzył z powodu dysku; FC potwierdził
   fmt/clippy całego crate, lib i 13 binarek dotykających `SiegeLoop`. Zmiana jest addytywna (nowe pola/metody,
   obserwator domyślnie `None`). Warunek dla orkiestratora: pełny `cargo test` engine i tak jest wymagany przy
   integracji na `05b872fc5`.
3. [UWAGA] wektor `:7648` tylko przez bezpośrednie `breach_wall_row`; strażnik `!tiles` — **ODDAL** w tym temacie:
   wymóg dla #113 zapisany w doc-komentarzu `breach_wall_row` (zgodne z pinem `:7638-7648`; pętla nie ma mapy
   terenu). Orkiestrator: dopisać oba wymogi do #113 K5LOOP-WIRING w rejestrze (poza allowlistą tematu).
4. [UWAGA] dwa źródła stanu muru — **ODDAL** (usunięte): `FrameError::TileHpStale` + test; zgodność kluczy w obie strony.
   Drobna niespójność typów (`TileHpMissing(i64)` vs `TileHpStale(i32)`) — kosmetyka, bez wpływu.
5. [UWAGA] kolejność ramek przy zagnieżdżonym `RunNow` — **ODDAL** (udokumentowane w `FireObserver` i pokryte testem).
6. [UWAGA, drobne] `LengthMismatch` dla duplikatów, `floor` w `non_negative` — **ODDAL**: istniejąca konwencja I1B,
   `ViewError` poza allowlistą; `floor` daje wartość jawnie poza zakresem. Udokumentowane komentarzami.

Brak NAPRAW. Brak DO DECYZJI CZŁOWIEKA.

## Uwagi dla integracji

- Parity-v2 = `05b872fc5` ≠ baza `585bb48e0`: merge-tree, a potem pełny `cargo test --all-targets` engine i view-model przy ≥ 8 GB.
- `start()` (kickoff `_beginTurn`) nie emituje ramki — zgodnie z zakresem „po każdym fire”; konsument (I4) potrzebuje ramki startowej osobno (wywołanie producenta po `start`).
- Dopisać do #113: wyłom w produkcji przez `breach_wall_row`, strażnik `!tiles` u wołającego.
