# DISPATCH R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1 (runda 1)

STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: P4-1J — stan planów marszu w `PlayableState` (warunek wstępny dla komendy `cancel_planned_march` w P4-1H).
MODEL: Operator (impl + pomiary), Obrona, Evaluator, Final Control — wszystkie **Opus 5.5** (część kontraktu renderera P4-1; zasada właściciela dla renderera).

GOAL: Dodać do `PlayableState` pola planów marszu z `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` §1.2 i wiersz P4-1J w §8: `plannedMarches` (z `attackUnitId`), `marchAttackTargets`, `marchStopNotified`, `marchStopDetail`. Zapis i odczyt przez istniejący `SavedPlannedMarch` (`save_load.rs:130`, `:320-326`). Wzorzec pól: `#[serde(default, skip_serializing_if)]` (`playable.rs:507-518`). Zgodność golden zapisu bez zmiany istniejących plików fixtur.

DECYZJE TECHNICZNE ORKIESTRATORA (zasada 9): brak. Kształt pól wynika z §8 P4-1J i ze źródła webu (`main.ts@07:31050-31074`, `clearPlannedMarch`). Jeśli web ma pole, którego nie ma w §8, nie dodawać; odnotować w raporcie jako NIE_ZMIERZONO.

BAZA: `origin/rust-port/parity-v2` = `a01363d5f` (zawiera P4-1A). Przed pracą: `git merge-base --is-ancestor a01363d5f HEAD`.

ALLOWLISTA (wszystko poza tym = FAIL):
- `rust-port/engine/src/domain/playable.rs` — wyłącznie nowe pola planów marszu i ich inicjalizacja
- `rust-port/engine/src/domain/save_load.rs` — wyłącznie zapis/odczyt planów przez `SavedPlannedMarch`
- `rust-port/engine/tests/p4_1j_planned_march_*.rs` (nowe testy)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1J-PLANNED-MARCH-STATE-Q1/**`

ZERO ZMIAN W: `gra/**`, `rust-port/renderer/**`, `rust-port/view-model/**`, `src-tauri/**`, `Cargo.lock` (nie commitować).

BRAMKI (EXIT 0, czysty CARGO_TARGET_DIR poza repo, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- `cargo fmt --check` w `rust-port/engine`
- `cargo clippy --all-targets -- -D warnings`
- `cargo test --all-targets` (pełny, bez filtra)
- `git diff --check`

KRYTERIA KOŃCA:
1. Pola §8 P4-1J dodane do `PlayableState` z `serde(default, skip_serializing_if)`.
2. Round-trip zapisu z planami marszu i bez nich; istniejące golden zapisy bez zmian bajtowych.
3. Test, że pusta lista planów nie zmienia zapisu (zgodność wstecz).
4. Brak `#[ignore]`, brak osłabionych asercji, `forbid(unsafe_code)` zachowany.
5. Każde twierdzenie o webie z dowodem plik:linia (pin `07d2fbd72`).

PROCES: Operator (impl) → Operator (pomiary) → Evaluator → Obrona (jeśli zarzuty) → Final Control. Commit z jawnym `git add`, NIGDY `-A`. Bez push na parity, bez deployu.
Commit bez nazwy modelu w treści; ostatnia linia `Claude-Session: https://claude.ai/code/session_01Eq7NKGj1PasjUCd7VCtYbZ`.
