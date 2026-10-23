STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q2
GOAL: MOD-14 część 2 (pole statyczne bitwy) przeportowana 1:1 do `rust-port/renderer/src/battle/field.rs`, zgodna bitowo z webem (pin `edb8fb56`, three@0.169.0).

ZMIANY/COMMIT:
- Oceniany łańcuch: `78bd7f1a` (= `origin/rust-port/parity-v2`, sprawdzone 2026-10-23) → `b162688f` (Operator r1) → `3d538c4f` (Operator r2 / Obrona). Commit Obrony istnieje — odtwarzanie zbędne.
- Allowlista: `git diff --name-only 78bd7f1a 3d538c4f` — 0 plików poza allowlistą; `lib.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**` bez zmian; P4-36 r1→r2 tylko dopisany (0 linii usuniętych); `git diff --check 78bd7f1a 3d538c4f` czysty.
- Kolejność integracji: fast-forward `origin/rust-port/parity-v2` 78bd7f1a → b162688f → 3d538c4f, potem ten raport FC. Raport Evaluatora r1 (`02-evaluator-r1.md`, commit `c0160d2c` w worktree `wf_62d4657d-7aa-2`) orkiestrator dołącza osobno (cherry-pick, plik w `runs/`, bez konfliktu).

ORZECZENIA:
| zarzut | orzeczenie | dowód |
|---|---|---|
| 1. `compare_siege` po cichu pomija `None` | ODDAL (naprawione w `3d538c4f`) | test ma `c.eq(present, s.is_some(), web_carved)`; `ONLY=siege mutate_field.py` na 1.87.0: KILLED 7/7, w tym `ctor drops siege` (mutant Evaluatora) — „test failed”, nie błąd kompilacji |
| 2. zakres nieuzgodniony z inwentarzem | ODDAL (naprawione) | `recon-r2.py` uruchomiony przeze mnie na inwentarzu Q1 (sha `139b84eb…`, identyczny z gałęzią dokumentacji), `battleScene.ts@edb8fb56` (sha `38c97736…`), `field.rs` (`53f7f578…`): EXIT=0, 117 wierszy, 0 bez statusu, stdout `cmp` = `recon-r2-table.md`. Wszystkie 14 symboli z zarzutu mają wiersz. `UNIT_Y` „martwa stała” potwierdzone: jedyne wystąpienia `:906` (definicja) i `:4484` (komentarz) |
| 3. `zip` bez długości w `nan_agnostic` | ODDAL (naprawione) | `c.eq("… len", r.len(), wv.len())` przed pętlą |
| Z-EV-1 (kryteria z innego tematu) | ODDAL | dispatch Q2: bez nowych zależności, bez rasteryzacji — przekład Evaluatora poprawny |

TESTY (samodzielnie, czysty target w `scratchpad/fc-q2-r2/target`, rustc 1.87.0, `CARGO_INCREMENTAL=0`, debug=0):
- `cargo fmt --all -- --check` (stable; brak rustfmt dla 1.87.0): EXIT=0
- `cargo +1.87.0 clippy --locked --all-targets -- -D warnings`: EXIT=0
- `cargo +1.87.0 clippy --locked --all-targets --features gpu -- -D warnings`: EXIT=0
- `cargo +1.87.0 test --locked --all-targets`: EXIT=0, 397 passed, 0 failed, 52 binaria; `battle3d_field` 5/5 (`constants_equal_web`, `helpers_match_web`, `apply_camera_matches_web`, `field_builders_match_web_on_synthetic_grids`, `field_constructor_matches_web`)
- `sha256sum -c MANIFEST.sha256`: 12/12 OK; katalog fixtur 10 909 784 B (≤ 12 MB), największy plik 7 228 812 B (≤ 8 MB)
- Próbka względem weba (`git show edb8fb56:gra/src/battle/battleScene.ts`): `BF_COLS=68` (:618), `BF_ROWS=156` (:619), `PLAY_MID_*` z `Math.floor` (:628–629, argument dodatni → `/` w i32 równoważne), `TILE_S=1.0` (:696), mgła: `FogExp2(…, 0.012)` :3315 nadpisana `0.005` :3359 — Rust `fog_density: 0.005` zgodny z wartością końcową. Pełny parytet 281 792 węzłów pokrywa test na `field.json`; determinizm generatora odtworzony niezależnie przez Evaluatora r1 (SHA identyczne).
- `unsafe` w diffie `src/` + `tests/`: 0 wystąpień.

BLOKADY: brak. Uwagi: ocena wzrokowa NIE_ZMIERZONO (brak GPU, lista w §16 dokumentu P4-36). Dysk współdzielony ~94% zajęty — target FC usunięty po przebiegu.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (fast-forward parity-v2 do `3d538c4f` + raporty runs), następnie READY_FOR_DEPLOY wystawia orkiestrator.
DEPLOY/PUSH: NIE WYKONANO
