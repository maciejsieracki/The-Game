# 01-operator-r1 — R-RUSTPORT-P4-1I2-BATTLE-FRAME (Operator, runda 1)

```text
STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1I2-BATTLE-FRAME
GOAL: BattleFrameDto (recon §2b) + producent ramki ze stanu SiegeLoop po każdym fire; pozycje/on_wall_walkway jako wejście adaptera (L7); towers_destroyed z nowej flagi wież w silniku (L4)
ZMIANY/COMMIT: allowlista (lista niżej); commit na gałęzi wip/R-RUSTPORT-P4-1I2-BATTLE-FRAME-op-r1, SHA w odpowiedzi Operatora (commit zawiera ten raport, więc SHA nie może być wpisany w nim samym)
TESTY: view-model: fmt/clippy/test EXIT 0/0/0; engine: fmt EXIT 0, clippy --all-targets EXIT 0, cargo test --all-targets NIE WYKONANO (dysk 6.6 GB < 8 GB); testy celowane engine zielone; mutacje a/b/c FAIL
BLOKADY: bramka engine `cargo test --all-targets --no-fail-fast` — wolne 6.6 GB (< 8 GB) w chwili startu testów
RUNDY: 1/5
NASTĘPNY KROK: po zwolnieniu dysku do >= 8 GB: pełny `cargo test --all-targets --no-fail-fast` w rust-port/engine na tym commicie (kod gotowy), potem Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## Baza

- `origin/rust-port/parity-v2` = `585bb48e0f926a14435fa96b9402a711095ee16c` (zawiera I1 `05e4df502`, I1B `474487792`). Worktree detached, potem gałąź robocza.
- Pin `07d2fbd72` (tylko odczyt, `git show 07d2fbd72:gra/src/battle/battleScene.ts`).

## Weryfikacja linii pinu (git grep w `07d2fbd72`)

- `_destroyTowerAtRow` `battleScene.ts:4194-4200` (`find(x => x.row === wallRow && !x.destroyed)` `:4195`, `t.destroyed = true` `:4197`).
- `_fireSiegeTowers` `:4208-4219`; strażnik `:4209`; `if (t.destroyed) continue;` `:4215`; **`:4216`** `if (!this.wallTileHp.has(t.row)) { this._destroyTowerAtRow(t.row); continue; }` — zgodne z recon.
- `_breachWallTile` `:7638`; `wallTileHp.delete` `:7646`; `wallEverBreached = true` `:7647`; **`:7648`** `this._destroyTowerAtRow(wallRow)` — zgodne z recon.
- `_fireOneTower` `:4223`, `if (this.finished || t.destroyed) return;` `:4227`.
- Kolejność spawnu: `this.atk = place(...)` / `this.def = ...` `:5541-5550`; iteracja `[...this.atk, ...this.def]` np. `:5573`.
- Amunicja: `ammoCount` `return Infinity` `:1445`, `Math.max(0, Math.floor(n))` `:1447`; dekrement tylko skończonej `:9191-9192`.
- Pola: `RuntimeBattleUnit` `:1962-2028` (`q` `:1977`, `r` `:1978`, `dead` `:1982`, `ammoLeft` `:1999`, `facing` `:2011`, `morale` `:2013`, `routed` `:2016`, `removed` `:2021`, `onWallWalkway` `:2028`); scena: `siegeTowers` `:2443`, `gateHp` `:2454`, `gateOpen` `:2456`, `wallTileHp` `:2501`, `wallEverBreached` `:2503`, `finished` `:2518`, `vNow` `:2556`, `roundNo` `:2698`; `Dir` `:315-320`.
- `towerRows` (`game/city-towers.ts:47-56`) daje wiersze ściśle rosnące — podstawa walidacji unikalności `towersDestroyed`.

## Zmiany (allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/view-model/src/battle.rs` | NOWE: `BattleFrameDto`, `BattleFrameUnitDto`, `BattleFrameWallDto`, `BattleWallTileHpDto` (camelCase, `deny_unknown_fields`) + `BattleFrameDto::validate` (skończone liczby, `vNow >= 0`, `roundNo >= 0`, `facing` 0..=3, `ammoLeft >= 0`, unikalne id / wiersze kafli / wiersze wież). Istniejące typy bez zmian. |
| `rust-port/engine/src/domain/siege_tactics_loop.rs` | Tylko flaga wież + odczyt stanu: prywatne `tower_destroyed: Vec<bool>` i `fire_observer` w `SiegeLoop`; `destroy_tower_at_row` (port `:4194-4197`), `breach_wall_row` (stan `:7646-7648`), `mark_towers_without_tile` (`:4209`, `:4215-4216`, wołane przy `SeqEvent::FireSiegeTowers` przed wstawieniem salwy do zegara), `tower_destroyed`, `towers_destroyed_rows`, `set_fire_observer`; w `fire` po `apply` wywołanie obserwatora (`&self`, `vNow`). Kolejność kroków, planowanie salwy, `tower_shoot` (nadal sprawdza kafel), ciało i zegar — bez zmian. |
| `rust-port/engine/src/domain/siege_tactics_frame.rs` | NOWY: `FrameUnitPose`, `FrameInput` (pozy per strona równoległe do `st.atk`/`st.def` + `WallState` adaptera), `FrameError`, `ammo_to_dto` (`Infinity` → `None`), `battle_frame` (producent, kończy `validate`), `record_frames` (podpina producenta jako obserwatora: ramka po KAŻDYM odpaleniu klocka zegara). |
| `rust-port/engine/src/domain/mod.rs` | TYLKO `pub mod siege_tactics_frame;` |
| `rust-port/engine/tests/p4_1i2_frame.rs` | NOWY (7 testów, wektory z `plik:linia` pinu w komentarzach). |
| `rust-port/view-model/tests/battle_frame.rs` | NOWY (6 testów: klucze, `null` dla amunicji bez limitu, round-trip, ścisłe klucze, walidacja). |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1I2-BATTLE-FRAME/01-operator-r1.md` | ten raport |

`Cargo.lock` nie commitowany (nieśledzony `rust-port/engine/Cargo.lock` pominięty). `gra/` bez zmian.

### Decyzje techniczne (do oceny Evaluatora)

1. **Hak „po każdym fire”**: obserwator `Box<dyn FnMut(&SiegeLoop<B>, f64)>` w `SiegeLoop`, wołany na końcu `fire` (także zagnieżdżonych `RunNow`). Nie zmienia stanu ani kolejności; brak obserwatora = zachowanie bez zmian. `SiegeEnv` nie dostał pól (literały `SiegeEnv {..}` w testach spoza allowlisty pozostają ważne).
2. **Flaga zamiast predykatu**: web ma `t.destroyed` (`:2443`), Rust dotąd wyprowadzał zburzenie z braku kafla. Flaga jest osobna i ustawiana tylko w dwóch miejscach pinu (`:4216`, `:7648`); `tower_shoot` dalej sprawdza kafel (bez zmiany logiki walki). Różnica predykat/flaga widoczna w wektorze `:4216`: przed `_fireSiegeTowers` wieża bez kafla NIE jest jeszcze `destroyed` (test `wieza_zburzona_przy_strzale_bez_kafla`).
3. **`breach_wall_row`**: wejście dla adaptera wyłomu (#113) robiące stan pętli z `:7646-7648` (usunięcie wiersza z `wall_tile_rows`, `wall_ever_breached = true`, `_destroyTowerAtRow`). To jedyne miejsce, gdzie flaga powstaje przy wyłomie — na nim jest mutacja (a). Kafel terenu, gruz, odwrót i morale nadal poza silnikiem (recon L3).
4. **Wejście adaptera (L7)**: `col`, `row`, `on_wall_walkway` + także `facing` (w produkcji źródłem `ProdBody::facing`, którego `LoopBody` nie wystawia generycznie) i `ammo_left` (brak w silniku). HP kafli/bramy z `WallState` adaptera; zbiór żywych wierszy i `ever_breached` z pętli — brak HP dla żywego wiersza = `FrameError::TileHpMissing`.
5. `wall` nie jest `Option` (pętla obsługuje wyłącznie oblężenie, recon §2b podaje pole bez opcji).

## Wektory (engine `tests/p4_1i2_frame.rs`)

| Test | Pin | Co sprawdza |
|---|---|---|
| `kolejnosc_jednostek_rowna_kolejnosci_spawnu` | `:5541-5550`, `:5573` | ramki z `record_frames` na prawdziwym `SiegeLoop::run` (400 iteracji, >1 tura): id `[7,3,5,1]` (atk, potem def, bez sortowania), wartości hp/morale z pętli, pozy z adaptera, `vNow` niemalejący |
| `amunicja_infinity_to_none` | `:1445`, `:1447`, `:9191-9192` | `Infinity` → `None` (JSON `null`), `2` → `Some(2)`; `NaN`/`-Infinity`/`-1` → `FrameError::Invalid` |
| `wieza_zburzona_przy_wylomie` | `:7646-7648`, `:4195-4196` | ramka tuż po `breach_wall_row(2)`: `towersDestroyed == [2]`, `everBreached`, kafel 2 znika; dalsze ramki bez duplikatu; drugi wyłom na tym wierszu nie znajduje wieży |
| `wieza_zburzona_przy_strzale_bez_kafla` | `:4216` | przed turą `[]`, w ramkach po starcie `[2]`, `everBreached == false` |
| `bez_strzelca_brak_zburzenia_z_4216` | `:4209`, `:7648` | bez `towerShooterRow` `:4216` nie burzy; wyłom burzy |
| `niespojne_wejscie_adaptera_odrzucone` | — | liczba póz, brak HP kafla, id > 2^53-1 |
| `flagi_jednostek_z_petli` | `:1982`, `:2016`, `:2021` | `dead`/`routed`/`removed`/`finished`/`roundNo`/`vNow` |

## Bramki

### `rust-port/view-model` (CARGO_TARGET_DIR w scratchpadzie, usunięty po bramce)
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --all-targets --no-fail-fast` → EXIT 0 (m.in. `battle_frame` 6/6, `battle_outcome` 9/9, `battle_outcome_e4` 4/4, `json_keys` 12/12, `json_roundtrip` 13/13, `json_strict` 3/3, `pin_vectors` 18/18, `validate` 15/15)

### `rust-port/engine`
- `df -h /` przed bramką engine: 8.7 GB (start fmt/clippy).
- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0 (sprawdzony log: `Checking civ-engine … wf_9ebab86f-5b4-1`)
- `cargo test --all-targets --no-fail-fast` → **NIE WYKONANO: BLOCK**, `df -h /` po clippy = **6.6 GB wolnego (< 8 GB)**; 492 pliki testów integracyjnych. Zgodnie z dispatchem zgłaszam BLOCK z liczbą GB.
- Testy celowane (te same flagi env, osobny target, usunięty): `--test p4_1i2_frame` 7/7 ok; regresja binarek używających `SiegeLoop`/`ProdBody`: `p4_1i1_battle_outcome` 19, `p6_k5doc_state` 9, `p6_k5loop_outcome_pin` 8, `p6_siege_tactics_loop` 4, `p6_siege_tactics_loop_body` 8, `p6_siege_tactics_loop_body_pin` 2, `p6_siege_tactics_loop_resume` 3, `p6_siege_wylom_tower` 6, `p6_tower_target_wiring` 6, `p6_wieze_2b1` 7, `p6_wieze_2b2` 12 — wszystkie ok, EXIT 0. Testy jednostkowe `--lib` engine: NIE_ZMIERZONO (część pełnej bramki).

## Mutacje (`cargo test --test p4_1i2_frame`, plik przywracany i sprawdzany `cmp` po każdej)

| Mutacja | Wynik |
|---|---|
| (a) usunięcie `self.destroy_tower_at_row(row);` w `breach_wall_row` (brak flagi przy wyłomie, `:7648`) | **FAIL** 2/7: `wieza_zburzona_przy_wylomie`, `bez_strzelca_brak_zburzenia_z_4216` |
| (b) `ammo_to_dto` zwraca zawsze `Some(ammo_left)` (`Infinity` jako liczba) | **FAIL** 6/7 (m.in. `amunicja_infinity_to_none`, `kolejnosc_jednostek_rowna_kolejnosci_spawnu`) |
| (c) `units.reverse()` w producencie (odwrócona kolejność) | **FAIL** 3/7: `kolejnosc_jednostek_rowna_kolejnosci_spawnu`, `amunicja_infinity_to_none`, `flagi_jednostek_z_petli` |
| (d, dodatkowa) usunięcie `self.mark_towers_without_tile();` (`:4216`) | **FAIL** 1/7: `wieza_zburzona_przy_strzale_bez_kafla` |

Po mutacjach: pliki identyczne z wersją commitowaną (`cmp`), `p4_1i2_frame` 7/7 ok.

## Kryteria końca

1. ZAKRES 1–4: zrealizowane; wektory zielone; mutacje a/b/c FAIL.
2. Bramki: view-model 3×EXIT 0; engine fmt/clippy EXIT 0, **test: BLOCK (6.6 GB)**.
3. Brak `#[ignore]`, brak osłabionych asercji, zero zmian poza allowlistą (`git diff --check` czysty).
4. Commit jawnym `git add` ścieżek z allowlisty; bez `Cargo.lock`; bez push.
5. `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (unikalne nazwy), usunięte po bramkach.

## NIE_ZMIERZONO

- Pełny `cargo test --all-targets` engine (w tym `--lib`) — blokada dyskowa.
- Wpięcie `record_frames`/`breach_wall_row` w produkcyjny adapter — temat #113 (K5LOOP-WIRING); konsument w rendererze — I4 (#277).
- Zgodność `t0`/`vNow` przy zmianie `speedMult` (recon §5) — poza zakresem I2.
