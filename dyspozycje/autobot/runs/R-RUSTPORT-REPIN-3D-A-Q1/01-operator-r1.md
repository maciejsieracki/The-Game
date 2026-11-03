STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A-Q1
GOAL: REPIN sceny bitwy 3D (`battle::*`, pin `edb8fb56`) do aktualnego weba — etap A: pomiar dryfu + plan partii + partia A1 (kolejka rozkazów, atakuj-marszem, usuwanie zabitych) bit w bit z wektorami z uruchomionego weba.
ZMIANY/COMMIT: gałąź `rust-port/repin-3d-a-q1` od `rust-port/parity-v2` @ `e1c040160`, worktree izolowany, jawne `git add`:
- `c88f96c2c` — kod: `rust-port/renderer/src/battle/orders.rs` (nowy: `QueuedOrders`, `next_activation`, `consume_on_activation`, `issue_attack_move`, `cancel_attack_move_selected`), `units.rs` (`PlayerOrder::AttackMove`, strzałka w kolorze ataku, `kill_unit` = `_startFade` z `origin/main` :9440-9451), `mod.rs`; testy `tests/repin3d_a1.rs`, `tests/repin3d_common/mod.rs`; wektory `tests/repin3d_fixtures/{a1.json 618 850 B, gen_a1.ts, build_a1.mjs}`.
- `c2f0798e6` — `dyspozycje/rust-port/p4/P4-REPIN-3D.md` (pomiar, tabela hunków symbol → hunk → moduł → status, kolejka A1…A6 + REPIN-3D-B), test strażnika, `mutate_a1.py`, README/MANIFEST fixtur, dowody.
- ten raport (commit po nim). `Cargo.toml`/`Cargo.lock` bez zmian. Zero zmian w `gra/**`, `rust-port/engine/**`, `src-tauri/**`, `WERSJE.md`, `gra-robocza/**`.
TESTY (logi `dowody/`, rustc 1.97.0, `CARGO_INCREMENTAL=0`, debug=0):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0.
- `cargo test --locked --no-fail-fast`: passed=439 failed=0 (57 binarek) EXIT=0; baza 431 (= wynik po Q5) + 8 nowych.
- `repin3d_a1`: 6/6 (queued 53, issue/cancel 464, activate 78, kill 273+1 skalar, breach 642 kontroli; 0 różnic); `battle::orders` 2/2 (Set, każda flaga pominięcia, N−1/N/N+1).
- MSRV `cargo +1.87.0 test --test repin3d_a1` 6/6, `--lib battle::orders` 2/2, EXIT=0.
- Mutacje `mutate_a1.py`: 35 mutantów na każdej gałęzi; r1 34/35 (przeżył `kill ignores removed` — równoważny na stanach webu: `removed` tylko w :9425 z `dead` :9426), dodany test API strażnika → **35/35** EXIT=0.
- Niezależny weryfikator: 2 katalogi `mktemp -d`, osobne `npm install` + `git archive` → `a1.json` `5b8baa9a…` identyczny z repo; `sha256sum -c MANIFEST.sha256` 5 OK.
- `git diff --cached --check` EXIT=0 przy obu commitach.
BLOKADY: brak. NOTATKI:
- Z-RP-1: plik weba to `gra/src/battle/battleScene.ts` (nie `render/`); dryf zmierzony +872/−200 (dispatch: +610/−192).
- Z-RP-2: większość dryfu `battleScene.ts` to logika bitwy (trasy, doktryny, mur/palisada, dowódcy) → P6.13, poza allowlistą; scena dostaje DTO.
- Z-RP-3: `dynamics::Fade` martwy w webie `origin/main` (brak zapisów do `fadingUnits`); zostaje do regeneracji wektorów cz. 4 (A5).
- `render/*` (14 plików, m.in. `PLATE_OWNER_ICON_SIZE` 0,20→0,80, gwiazda dowódcy, skala złóż/fortów ×2) leży poza `battle/**` → osobny temat REPIN-3D-B.
- Wektory z `origin/main` @ `c1581619f`; `origin/main` w trakcie = `60621493a`, diff zakresu pusty.
- Ocena wizualna NIE_ZMIERZONO (brak `/dev/dri`); `clippy --features gpu` NIE_ZMIERZONO (A1 nie dotyka kodu `gpu`).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator R-RUSTPORT-REPIN-3D-A-Q1 r1; potem partia A2 (palisada + wieżyczki: `siege_wall`, nowy `siege_towers`).
DEPLOY/PUSH: NIE WYKONANO
