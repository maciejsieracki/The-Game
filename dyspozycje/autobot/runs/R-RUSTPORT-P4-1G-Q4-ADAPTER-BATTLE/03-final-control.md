# 03 — Final Control: R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera mapy bitwy)
TEMAT: R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE
GOAL: `BattleSetupDto` → `BattleUnitsOpts` + `FortDto` (wejście `build_battle_scene_with_units_fort`) zgodnie z pinem `07d2fbd72`.

## Baza i ancestry

- Baza z dispatchu: `b90894920` (`origin/rust-port/parity-v2` w chwili dispatchu; dziś parity = `84ec520a5`, przesunięcie należy do orkiestratora przy integracji, merge-tree do sprawdzenia).
- Ocenione: `d6cc03b58` (Obrona) ← `04283b653` (Operator) ← `b90894920`. `git merge-base --is-ancestor` spełnione w obu przypadkach (log liniowy, 2 commity nad bazą).
- Commit FC (ten raport) nad `d6cc03b58`; SHA końcowy w wyniku FC.

## Allowlista (zweryfikowana samodzielnie, `git diff --stat b90894920 d6cc03b58`)

- `rust-port/renderer/src/view/battle.rs` (NOWY, 224 linie)
- `rust-port/renderer/src/view.rs` (+5: wyłącznie `pub mod battle;` i `pub use battle::{…}`)
- `rust-port/renderer/tests/view_adapter_battle.rs` (NOWY, 464 linie)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q4-ADAPTER-BATTLE/{01-operator-r1.md,02a-obrona.md}`

Brak zmian poza allowlistą; `gra/`, view-model, Q2/Q3 nietknięte; `Cargo.lock` niecommitowany (zmodyfikowany przez build lokalnie, przywrócony `git checkout`); `git diff --check` czysty; brak `#[ignore]`.

## Bramki (uruchomione przez FC, `rust-port/renderer`, CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpadzie, usunięty)

- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --all-targets --no-fail-fast`: EXIT 0; 67 zestawów, 550 passed, 0 failed, 0 ignored; `view_adapter_battle` 13/13.

## Mutacje powtórzone przez FC (`cargo test --test view_adapter_battle`)

| Mutacja | Wynik |
|---|---|
| `siege: s.siege` → `siege: true` | FAIL (2) |
| `None => f64::INFINITY` → `None => 0.0` | FAIL (6) |
| `tower_rows` fortu → `vec![]` (pominięcie pola) | FAIL (4) |
| `player_side` zamieniony Atk↔Def | FAIL (5) |
| kontrola `DeploySideMismatch` wyłączona | FAIL (1) |

Plik po mutacjach przywrócony (cmp + `git status` czysty).

## Weryfikacja pinu (FC)

- `ammoCount` → `Infinity` dla braku liczby: BS:1444-1446 — potwierdzone.
- `opts.siege` / `(defCiv ?? civ) ?? 'rzym'` / `_deployMode` / `_deployPlayerSideOpt = opts.deployPlayerSide ?? 'atk'`: BS:3479-3485 — potwierdzone.
- `towerMaterialFor(...) === null → return`: BS:4160-4161 — potwierdzone (fort `None` = `null`, nie INFINITY).
- `_playerControlSide() = _deployPlayerSideOpt`: BS:12396-12397 — potwierdzone (uzasadnienie `DeploySideMismatch`).
- `TOWER_ROWS`: FC uruchomił samodzielnie `towerRows` z `gra/src/game/city-towers.ts@07d2fbd72` (node `--experimental-strip-types`) dla `{rowLo:0,rowHi:155,gateRowLo:76,gateRowHi:77,spacing:4}` → 39 wierszy `[2,6,…,154]`, identyczne z fixture.

## Orzeczenia zarzutów

1. **Mutacja `siege: true` przeżywa** — ODDAL. Naprawione w `d6cc03b58` (test `field_battle_maps_to_web_inputs`, asercje pól w `siege_without_civ_is_an_error`); FC potwierdził FAIL mutacji (2 testy).
2. **Brak produkcyjnego wołającego adaptera** — ODDAL (jako wada tematu). Wpięcie poza allowlistą i zakresem Q4 (`P4-1G-ADAPTER-ROZPOZNANIE.md` §7). Nota dla orkiestratora: zarejestrować zależności (a) producent `BattleSetupDto` w silniku (P4-1I lub osobny temat), (b) integrator sceny bitwy wołający `view::battle_inputs` → `build_battle_scene_with_units_fort` (temat renderera / W8).
3. **Fixture ręczna, nie z pinu** — ODDAL. `tower_rows` zastąpione wynikiem pinu (zweryfikowane niezależnie przez FC). col/row/hp/morale/facing są kopiowane 1:1 ze stanu, pin ich na poziomie adaptera nie liczy; test rozróżnialnych wartości jest właściwą asercją.
4. **Brak kontroli zgodności deploy/player_side** — ODDAL. Dodane `BattleAdapterError::DeploySideMismatch` zgodnie z BS:3485/12396-12397; mutacja wyłączenia kontroli daje FAIL.
5. **Erratum dispatchu (FortDto None → INFINITY)** — ODDAL (kod zgodny z pinem). Nota dla orkiestratora: poprawić dispatch/rejestr (INFINITY dotyczy wyłącznie `ammo_left/ammo_max`; fort `tower_material: None` = `null`), by Q5, Q6 i P4-1I tego nie powielały.

Zarzuty NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

ZMIANY/COMMIT: ocena `d6cc03b58`; commit FC = ten plik.
TESTY: jak wyżej (fmt/clippy/test EXIT 0, 550/0/0; 5 mutacji FAIL).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora na `rust-port/parity-v2` (merge-tree względem `84ec520a5`, pełny `cargo test`), wpisy zależności z zarzutów 2 i 5 w rejestrze.
DEPLOY/PUSH: NIE WYKONANO
