STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q4
GOAL: MOD-14 część 4 (dynamika i efekty) — port 1:1 do `rust-port/renderer/src/battle/` (pociski, krok, cios, zanikanie, taran, kamień katapulty, wyłom muru/bramy, ucieczka, znaczniki grup, billboard pasków, napisy, koniec rozstawienia) jako funkcje (stan, t), bit w bit z webem `edb8fb56` / three@0.169.0. ROLA: Operator-impl (kod, wektory, testy).

ZMIANY-COMMIT:
- Baza `origin/rust-port/parity-v2` @ `364a5356` (detached, izolowany worktree). Commit kodu: **`d22fb721`**; ten raport: osobny commit (SHA w odpowiedzi Operatora).
- Nowe: `src/battle/dynamics.rs`, `tests/battle3d_dynamics.rs`, `tests/fixtures/battle3d/{dynamics.json (136 900 B), gen_dynamics.ts, build_dynamics.mjs, mutate_dynamics.py}`, `runs/…-Q4/dowody/{recon-q4.py, recon-q4.txt, recon-q4-table.md, determinism-r1.txt, web-drift-r1.txt, tests-impl-r1.txt}`.
- Zmienione: `battle/mod.rs` (+1 linia `pub mod dynamics;`), `fixtures/battle3d/README.md` (+„Part 4”), `MANIFEST.sha256` (20 plików), P4-36 (dopisane §29–§37, części 1–3 bez zmian: 257+/0−).
- Zero zmian w `gra/**`, `src-tauri/**`, `rust-port/engine/**`, innych modułach renderera, `Cargo.*`; bez `unsafe`, bez nowych zależności.

TESTY (`dowody/tests-impl-r1.txt`, rustc 1.97.0):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --lib --test battle3d_dynamics -- -D warnings` EXIT=0.
- `battle3d_dynamics` 4/4 EXIT=0: 23 zdarzenia na scenie oblężenia (696 liczb bitowo + 1 417 sprawdzeń), rozstawienie (84 znaczniki, klatka, `_endDeployPhase`), `projectileKind` 306 par + 4 meshe, stałe/easing — **0 różnic** z uruchomionym webem.
- Części 1–3: 5+3+8 passed; `--lib battle::` 11 passed; `sha256sum -c` 20/20; fixtury 11 813 305 B (≤12 MB), największy plik 7 228 812 B.
- Determinizm: 2 katalogi (osobne `npm install`/`git archive`) → identyczne `dynamics.json` i bundel.
- Uzgodnienie inwentarza: 67 wierszy (31+24+5+7), 0 bez statusu, `recon-q4.py` EXIT=0, 2 przebiegi identyczne.
- Mutacje: 48 przygotowanych, wzorce unikalne — **NIE_ZMIERZONO** (wywołanie „pomiary”). Pełne `--all-targets [--features gpu]`, MSRV 1.87.0 — NIE_ZMIERZONO (pomiary).

BLOKADY: brak. Uwagi: ocena wzrokowa NIE_ZMIERZONO (lista §36); dryf weba po pinie 13 plików +835/−221, 3 hunki w symbolach części 4 (blok dowódcy armii = logika), nie przepięto; obserwacje W-17…W-21 (§37); założenia Z-36-13…17 (§31).

RUNDY: 1/5
NASTĘPNY KROK: Operator „pomiary” (mutate_dynamics.py na 1.87.0, pełne bramy 1.87.0/1.97.0 z `--features gpu`, trzecie odtworzenie generatora) → Evaluator → Obrona → Final Control.
DEPLOY-PUSH: NIE WYKONANO
