# P3.4 — IDS-VERSIONING (runda 1/5, Operator/Obrona)

STATUS: BLOKADA CZĘŚCIOWA — wykonano SCHEMA_VERSION; refaktor newtypów zablokowany allowlistą.

## Baza
- `origin/rust-port/parity-v2` HEAD = `e72c74f7` (P3-5D). Zawiera `2c518a12` (P3.3 test), NIE zawiera `766333c4` (P3.3-IMPL).
- Dispatch twierdzi „HEAD po integracji P3.3-IMPL = 2c518a12" — niezgodne z historią: `766333c4` nie jest przodkiem `2c518a12` ani `e72c74f7`. Worktree przepięty na `e72c74f7` (detached).

## Zrobione
- Dodano `rust-port/engine/src/version.rs`: `pub const SCHEMA_VERSION: u32 = 1;` z dokumentacją relacji do `contractVersion` (BridgeRequest, P2.5 §1) i do przyszłego `SAVE_VERSION` (P2.11).
- `rust-port/engine/src/lib.rs`: `pub mod version;`.
- Weryfikacja: `cargo check --all-targets` przed zmianą EXIT=0 (12.82s); po zmianie EXIT=0 (2.72s), 0 warningów.

## Niezrobione (z powodu blokad, nie wyboru)
1. Newtypy `PlayablePlayer.id` -> `PlayerId`, `CombatUnit.id` -> `UnitId` (`domain/ids.rs:36-38` — ścieżka w dispatchu `src/ids.rs` jest błędna). Wymagałoby zmian poza allowlistą:
   - `rust-port/engine/src/bridge.rs:347` (konstrukcja `PlayablePlayer {`)
   - `rust-port/engine/tests/combat.rs:10` (`fn unit(id: u64, ...) -> CombatUnit`, konstrukcja CombatUnit)
   - `AiUnit`/`BarbUnit`: użycia w `tests/ai_turn.rs`, `tests/barbarians.rs` (poza allowlistą); pliki domenowe `ai_turn.rs`, `barbarians.rs` są na liście dispatchu tylko częściowo.
2. Testy: pełny `cargo test` nie został uruchomiony — dysk `/` na 100% (wolne ~188 MB; `/tmp` zajęte przez ~19 GB cudzych scratchpadów sesji). Nie wklejam logu testów, bo nie istnieje. Tylko `cargo check` jest zweryfikowany.
3. Liczba „227 testów" nie jest reprodukowalna w tej bazie bez `766333c4`.

## Rekomendacja dla orkiestratora
- Rozszerzyć allowlistę o `bridge.rs`, `tests/combat.rs`, `tests/ai_turn.rs`, `tests/barbarians.rs` (zmiany czysto mechaniczne: `UnitId::new(...)` / `PlayerId::new(...)`), albo rozbić temat na P3.4a (SCHEMA_VERSION, zrobione) i P3.4b (newtypy + testy).
- Poprawić ścieżkę `ids.rs` i bazę w dispatchu.
- Zwolnić miejsce na dysku przed uruchomieniem `cargo test`.
