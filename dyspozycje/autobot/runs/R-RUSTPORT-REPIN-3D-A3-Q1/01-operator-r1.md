STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-3D-A3-Q1
ROLA: Operator (Opus 5.5) · RUNDA 1/5

GOAL: REPIN-3D partia A3 (`P4-REPIN-3D.md` §3, symbole #10, #11 + dryf reguł oblężenia z A2 §8.4): port
`_destroyTowerAtRow`, `_fireSiegeTowers`/`_fireOneTower` (pocisk wieżyczki) i wyłomu muru/palisady z `origin/main` do
`rust-port/renderer/src/battle/`, bit w bit z wektorami URUCHOMIONEGO weba.

ZMIANY-COMMIT: `585ee848d` na gałęzi `autobot/R-RUSTPORT-REPIN-3D-A3-Q1` (baza `origin/rust-port/parity-v2` @ `65e81ae4d`;
web `origin/main` @ `86d510c66`, zakres bez zmian od `5fa0c1a84` — `git log` pusty) + commit tego raportu.
- `src/battle/siege_towers.rs`: `destroy_tower_at_row`, `fire_siege_towers` (`TowerVolley`, `TowerShotPlan`, stagger 180),
  `tower_projectile_kind`, `tower_shot_endpoints` (`from = (x − 0,5, 4,2, z)`), `fire_one_tower` (`TowerTarget`, `TowerShot`;
  pocisk przez istniejące `dynamics::launch_projectile`, kwaternion `setFromUnitVectors`), test jednostkowy.
- `src/battle/dynamics.rs`: `breach_wall_tile_fort` (= `_breachWallTile` z `:7563`); `breach_wall_tile`/`breach_gate` bez zmian.
- `src/battle/mod.rs`: wiersz tabeli + re-eksporty. `units.rs`, `Cargo.*`, `gra/**`, `engine/**`, `src-tauri/**`,
  `src/{units,cities,overlays,models}/**` (partia B), `WERSJE.md` — bez zmian.
- `tests/repin3d_a3.rs` (3 testy), `tests/repin3d_fixtures/`: `gen_a3.ts`, `a3.json` (694 668 B, `452f127e…`),
  `a3_web_inputs.txt` (166 plików, 6,3 MB), `mutate_a3.py`, README + MANIFEST (dopisane A3 — pliki fixtur wspólnych).
- `dyspozycje/rust-port/p4/P4-REPIN-3D.md`: §9 (kod, POMIAR mur vs palisada, wektory, mutacje, ZAŁOŻENIA Z-RP-A3-1..3,
  dryf reguł oblężenia: palisada R1–R4, wieżyczki R4, `isSiegeTower` = LB, Milicja = LB→A4), status #10/#11, kolejka A4.
- Dowody: `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-3D-A3-Q1/dowody/` (`gates-r1.txt`, `test-full-r1.txt`, `msrv-r1.txt`,
  `mutate-a3-r1-part{1,2,3,3-final}.txt`, `verify-gen-a3-r1.txt`).

TESTY (surowe logi z `EXIT=`, rustc 1.97.0, CARGO_INCREMENTAL=0, *_DEBUG=0):
- `cargo fmt --all -- --check` EXIT=0; `cargo clippy --locked --all-targets -- -D warnings` EXIT=0.
- `cargo test --locked --no-fail-fast`: passed=448 failed=0 binaries=59, EXIT=0 (baza 444 + 3 + 1).
- `cargo +1.87.0 test --locked --test repin3d_a3 --test repin3d_a2 --test repin3d_a1`: 3 + 4 + 6 ok; `--lib battle::siege` 6 ok; EXIT=0.
- `repin3d_a3`: 0 różnic — checks breach 6 188, gate 828, fire 70 315 + 856 skalarów `to_bits`; 38 strzałów, 4 rodzaje pocisków;
  pełny `dumpTree` sceny po każdym kroku, gruz i pocisk węzeł po węźle, pozycje lotu w 8 chwilach.
- Brzegi: `rLo`/`rHi`/`rHi+1`/`−1`, rząd bramy, podwójny wyłom, brama z jednym kaflem otwartym, `gateCol < 0`, zburzenie
  przed salwą / między planem a strzałem, `finished` przed/w trakcie, brak strzelca/wieżyczek/wrogów, d = 0, remis HP.
  NaN: Z-RP-A3-3 (wejścia całkowite; gałąź `|dir|² ≤ 1e-6` nieosiągalna, dowód w §9.4).
- Mutacje `mutate_a3.py`: 30/30 (pierwszy przebieg 28/30 → poprawka generatora: DTO `pickTowerTarget` dla każdego
  zaplanowanego strzału; wektory zregenerowane, części 1–3 powtórzone na finalnych wektorach).
- Niezależny weryfikator: 2 katalogi (66 MB / 6,3 MB, osobne `npm install` i `git archive`) → `a3.json` `452f127e…` i
  `gen_a3.mjs` `3afa8d31…` identyczne, = repo. Kopie usunięte jawnymi ścieżkami; `target/` usunięty.
- `sha256sum -c MANIFEST.sha256`: 13 OK. `git diff --cached --check`: czysto.
- Ocena wizualna GPU: NIE_ZMIERZONO (brak `/dev/dri`; nie blokuje). `clippy --features gpu`: NIE_ZMIERZONO (kod spoza cechy).

BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator (Opus 5.5) dla R-RUSTPORT-REPIN-3D-A3-Q1 na `585ee848d`; potem Final Control i integracja do
`rust-port/parity-v2` (merge z partią B — rozłączne pliki; ewentualny konflikt tylko w `P4-REPIN-3D.md` / README fixtur).
DEPLOY/PUSH: NIE WYKONANO
