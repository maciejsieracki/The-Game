STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 część 3 (jednostki i nakładki) wg §4 P4-36: port 1:1 do `rust-port/renderer/src/battle/` symboli sceny części 3 (`_placeUnits*`, `_placeSiegeDefenders`, umieszczenie `_placeSiegeWall`, 3D `_activateUnit`, `makeUnitBars`, `makeFallbackAvatar`, pierścienie, duchy, podglądy rozkazów), bit w bit z webem (`edb8fb56`, three@0.169.0); wejście DTO jednostek, wyjście węzły `models::*` + paski.

ROLA: Operator — wywołanie „impl” (kod, wektory, testy). Mutacje i pełne bramy = wywołanie „pomiary”.

ZMIANY/COMMIT:
- `d2fecbb3` (gałąź lokalna `q3-operator-r1` w worktree `wf_2ef132a4-a0e-1`, rodzic `2c2f58f8` = `origin/rust-port/parity-v2`; `7817ef0c` jest przodkiem) — 15 plików, wszystkie w allowliście (`git diff --name-only 2c2f58f8 d2fecbb3`): `src/battle/units.rs` (nowy), `src/battle/mod.rs` (+1 linia `pub mod units;`), `tests/battle3d_units.rs`, `tests/fixtures/battle3d/{units.json, gen_units.ts, build_units.mjs, mutate_units.py, README.md, MANIFEST.sha256}`, `P4-36…md` (+382 / −0, §19–§27), `runs/…-Q3/dowody/*`. `field.rs`, `siege_wall.rs`, `lib.rs`, `Cargo.*`, `gra/**` bez zmian.
- Raport: osobny commit (ten plik).

TESTY (rustc 1.97.0, `CARGO_INCREMENTAL=0`, debug=0; log `dowody/tests-impl-r1.txt`):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --lib --test battle3d_units -- -D warnings` EXIT=0.
- `cargo test --locked --test battle3d_units` 8/8 EXIT=0: 11 konstruktorów z armiami, 1 230 jednostek, 160 ruchów rozstawienia, 4 mury, posty (reset ×3, usunięcia, wspinaczka) + paski 10, awatar 3, aktualizacje 18, pierścienie, strzałki 12, kolejka 4, podgląd 11, duchy 16 — 0 różnic.
- Regresja: `battle3d_field` 5/5, `battle3d_siege_wall` 3/3, `--lib battle::` 10/10 — EXIT=0.
- Determinizm: 2 katalogi → `units.json` `6fb3b65a…b171`, `gen_units.mjs` `f59b9842…4bc3` (`dowody/determinism-r1.txt`).
- Fixtury: `sha256sum -c` 16 OK; katalog 11 614 998 B (≤ 12 MB), max plik 7 228 812 B.
- Inwentarz: `recon-q3.py` 172 wiersze, 0 bez statusu, EXIT=0, 2 przebiegi identyczne.
- **NIE_ZMIERZONO (pomiary):** clippy/test `--all-targets` (+`--features gpu`), MSRV 1.87.0, `mutate_units.py` (42 mutanty, wzorce sprawdzone: każdy 1×).

BLOKADY: brak. Uwagi: założenia Z-36-7…Z-36-12 (§21: wejście DTO, ruchy rozstawienia, znaczniki grup → cz. 4, zapytania `BattleQueries`, NaN kanoniczny, awatar); obserwacje W-12…W-16; dryf weba po pinie odnotowany (§27), bez przepinania; ocena wzrokowa NIE_ZMIERZONO (§26).

RUNDY: 1/5
NASTĘPNY KROK: Operator „pomiary” (mutacje `mutate_units.py`, pełne bramy, MSRV) → Evaluator → Obrona → Final Control → integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
