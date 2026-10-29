STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-36-MOD14-BATTLE-3D-Q3
GOAL: MOD-14 część 3 (jednostki i nakładki) wg §4 P4-36 — port 1:1 do `rust-port/renderer/src/battle/units.rs`, bit w bit z webem (pin `edb8fb56`, three@0.169.0). To wywołanie: Operator „pomiary” (mutacje, pełne bramy, MSRV, niezależny weryfikator) na commicie Operatora-impl.

ZMIANY/COMMIT:
- `6a0df00e` (rodzic `1b73d2e1` → `d2fecbb3` → `2c2f58f8` = `origin/rust-port/parity-v2`), gałąź lokalna `q3-operator-pomiary-r1`, worktree `/home/user/The-Game/.claude/worktrees/wf_2ef132a4-a0e-2`:
  - `src/battle/units.rs`: +2 asercje w `js_min_max_follow_ecmascript` (NaN jako pierwszy / drugi argument) — tylko test, logika bez zmian.
  - `tests/fixtures/battle3d/mutate_units.py`: +mutant `js_min NaN` (43); `README.md` (43 mutanty, wynik), `MANIFEST.sha256` (2 sumy).
  - `P4-36-MOD14-BATTLE-3D.md`: dopisek do §19 p. 4 + nowy §28 (pomiary).
  - `runs/…-Q3/dowody/`: `gates-pomiary-r1.txt`, `mutate-units-r1.txt`, `verify-gen-r1.txt`.
- Ten raport: osobny commit (SHA w wyniku wywołania).
- `git diff --name-only 2c2f58f8 6a0df00e`: 19 plików, wszystkie w allowliście; `gra/**`, `Cargo.*`, moduły poza `battle/**` bez zmian.

TESTY (surowe logi w `dowody/`; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0`):
- Mutacje (1.87.0, partie `MUTANTS[a:b]`): pierwszy przebieg 41/42 — przeżył `js_max NaN` (mutant równoważny na osiągalnych wejściach: wszystkie wywołania mają stały nie-NaN pierwszy argument, §28 p. 1). Po wzmocnieniu testu i dodaniu `js_min NaN`: **43/43 zabite**.
- Po poprawce: `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0 oraz `--features gpu` EXIT=0 — na **1.87.0 (MSRV)** i 1.97.0; `cargo test --locked --all-targets` (1.87.0) **408 passed, 0 failed, 53 binaria**, EXIT=0; `battle3d_units` 8 + `battle3d_field` 5 + `battle3d_siege_wall` 3 = 16 EXIT=0; `--lib battle::units` 3/3 EXIT=0.
- Przed poprawką (stan `1b73d2e1`): clippy all-targets ±gpu 1.87.0 EXIT=0, test all-targets 408/0 EXIT=0.
- Fixtury: `sha256sum -c` 16/16 EXIT=0; katalog 11 623 280 B, największy plik 7 228 812 B; `git diff --cached --check` czysty.
- Niezależny weryfikator: trzeci katalog poza repo (nowy `npm install`, nowy `git archive edb8fb56`) → `units.json` `6fb3b65a…12b171` = MANIFEST, bundel `f59b9842…4bc3` = README; próbka 9 stałych w `battleScene.ts` z plik:linia zgodna z `units.rs`.
- Dryf weba: `origin/main` `91dc998a`, 13 plików +629/−213 — jak w §27.

BLOKADY: brak. Uwagi: ocena wzrokowa NIE_ZMIERZONO (brak GPU, §26); wpływ dryfu po pinie na wektory NIE_ZMIERZONO (§27). `cargo test --features gpu` nieuruchomione (jak w Q2: tylko clippy z gpu). Katalog `cargo-target-shared/wf_2ef132a4-a0e-2` i scratch usunięte po pracy.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator → Obrona → Final Control → integracja orkiestratora (commity `d2fecbb3`, `1b73d2e1`, `6a0df00e` + raport).
DEPLOY/PUSH: NIE WYKONANO
