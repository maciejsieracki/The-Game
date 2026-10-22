STATUS: PASS

DOMAIN: GAME

TEMAT: R-RUSTPORT-P4-21-MOD09-CITIES-Q1

GOAL: MOD-09 z `P4-4-MODEL-CATALOG.md`: modele miast i osad w Rust, bitowo zgodne z uruchomionym kodem weba (`edb8fb56`), `jsmath`, reuse `core` bez kopii, drzewo `unit_core::model`.

ZMIANY-COMMIT: r1 (`c522d6d6`, `0e35bcbe`) przeniesione `git rebase` na `origin/rust-port/parity-v2` @ `2a45e340`; jedyny konflikt: jedna linia `src/models.rs` (`pub mod cities;` obok `pub mod improvements;`). Commity w worktree, bez push:
- `e1d6b809` kod r1, `577bee7b` dok. r1 (po rebase);
- `786cacdd` poprawki r2: `src/models/cities/model.rs` (usunięte kopie `trace_pointy_top_hex`, `hex_ring_points_xz_js`; użycie `core::hex_shape::{append_pointy_top_hex, hex_ring_points_xz}`), `src/models/cities/renderer.rs` (`terrain_top_y` deleguje do `core::map_style::terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, 0.0)` + test bitowej równoważności);
- dokumentacja r2: `dyspozycje/rust-port/p4/P4-21-MOD09-CITIES.md` (§0 nagłówek, §2, §3, §8.1, nowy §10) i ten plik.

Odpowiedzi na zarzuty (szczegóły i dowody: P4-21 §10):
1. Kopie z `core::hex_shape` — PRZYJMUJĘ. Kopie usunięte, nieaktualne uzasadnienie wycofane. 0 rozbieżności z webem; mutacje M23/M24 (promień obrysu, kierunek otworu) zabite.
2. „19 binarek” — PRZYJMUJĘ. r1: 18 (lib + 17), §8.1 poprawione. r2 na nowej bazie: 21 (lib + 20), 129 testów.
3. Powtórzona wysokość terenu — PRZYJMUJĘ. Delegacja do `core::map_style`; test `terrain_top_y_matches_inline_formula_bitwise` (8 terenów, bity równe), mutacja M25 zabita.

TESTY (commit `786cacdd`, czysty `CARGO_TARGET_DIR`, surowe logi P4-21 §10.2):
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --locked --all-targets -- -D warnings`: EXIT=0
- `cargo clippy --locked --all-targets --features gpu -- -D warnings`: EXIT=0
- `cargo test --locked --all-targets`: EXIT=0, 21 binarek, 129 testów, 0 nieudanych
- `cities_web_parity --nocapture`: 5/5, 0 rozbieżności (192 347 / 616 / 27 035 / 992 / 57)
- mutacje: 23/25 zabitych; przeżyły równoważne M21, M22 (§5, §10.1)
- `git diff --check`: EXIT=0. Fixtury bez zmian (SHA-256 jak §6).

BLOKADY: brak. ZAŁOŻENIE r2: baza = aktualne `origin/rust-port/parity-v2` (`2a45e340`), nie `66e6572d`. Uwaga 1 z BLOKAD r1 wycofana (nieaktualna). NIE_ZMIERZONO: ocena wzrokowa/GPU (§7).

RUNDY: 2/5

NASTĘPNY KROK: Evaluator r2 (ten sam ID): przegląd `786cacdd`, bramki, porównanie z webem.

DEPLOY/PUSH: NIE WYKONANO
