# R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE — Operator r1

```text
STATUS: PASS
DOMAIN: GAME (GRAFIKA / DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE
GOAL: rdzeń adaptera renderer/src/view.rs — konwersje §2, mgła §3.3, wspólne to_int32, komentarz modułu wg D-DTO-1
ZMIANY/COMMIT: aa66e83847f8b88a8aa9867effec2ed2340f16d8 (kod), gałąź lokalna op/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE-r1; raport w commicie następnym (SHA w odpowiedzi Operatora)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (64 zestawy, 502 passed, 0 failed, 0 ignored)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO
```

## Baza

- Dispatch: `origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE/00-dispatch.md`.
- Baza: `origin/rust-port/parity-v2` = `be49ff3c3d5b52073a92012664fd897321b60c73` (zgodna z dispatchem), worktree detached → gałąź lokalna `op/R-RUSTPORT-P4-1G-Q1-ADAPTER-CORE-r1`.
- Specyfikacja: `dyspozycje/rust-port/p4/P4-1G-ADAPTER-ROZPOZNANIE.md` czytana z `origin/claude/rust-sivvrn` (na bazie tego pliku nie ma) — §2, §3.3, §6 B-DEP, §7 wiersz Q1.
- Pin `07d2fbd72`: tylko odczyt (`refreshFog`, `gra/src/main.ts:13475-13520`).

## Zmiany (wyłącznie allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/renderer/Cargo.toml` | `civ-view-model = { path = "../view-model" }` (B-DEP); dev-dep `serde_json` (jak w `view-model`, `float_roundtrip`) — tylko do testu „nieznana wartość → błąd parsowania” |
| `rust-port/renderer/src/geom/js_num.rs` (NOWY) | `pub(crate) fn to_int32` przeniesione 1:1 z `earcut.rs:791-801` + test jednostkowy |
| `rust-port/renderer/src/geom/mod.rs` | `pub(crate) mod js_num;` |
| `rust-port/renderer/src/geom/earcut.rs` | usunięta lokalna `to_int32`, `use super::js_num::to_int32;` (nic więcej) |
| `rust-port/renderer/src/view.rs` | nowy komentarz modułu (adapter DTO → wejścia renderera; bez „computed from GameState” i `PositionDto`), `ViewAdapterError`, re-eksporty |
| `rust-port/renderer/src/view/convert.rs` (NOWY) | `HexCoord` → `pick::hex::HexCoord` / `HexKey` / `"q,r"` (`core::hexutil::hex_key`) / `f64` (`hex_f64`, `BuildHighlightHex`); `CityId`/`UnitId` → `String` (`Display`); `OwnerRef` → `i64` / `i32` (`Result`, `OwnerOutOfI32`) / `f64`; `seed_i32` = `js_num::to_int32`; enumy `Terrain`, `RiverKind`, `WallKind`→`CityWallKind`, `MapOutlineKind`→`CityMapOutlineKind`, `TradeMedium`, `SiegeMachineKind`, `BattleSide`, `FortKind`, `TowerMaterial` — `match` bez wildcard |
| `rust-port/renderer/src/view/fog.rs` (NOWY) | `FogSets::from_dto(map, fog, fog_active)`: `visible`/`explored: HashSet<HexCoord>` (set_fog), `visible_keys: HashSet<String>` (miasta/cuda), `visible_hex_keys`/`explored_hex_keys: HashSet<HexKey>` (pola robotników), `prism_hidden: Vec<bool>` równoległe do `map.hexes`; błąd `LengthMismatch` gdy `fog.state` nie jest równoległe |
| `rust-port/renderer/tests/view_adapter_core.rs` (NOWY) | 23 testy |

`rust-port/renderer/src/lib.rs` — bez zmian (moduł `view` nie ma tam własnego komentarza poza listą CPU-modułów, która pozostaje prawdziwa). `Cargo.lock` zmieniony lokalnie przez cargo — NIE zacommitowany.

## Decyzje techniczne (do rejestru, nie gameplay)

1. **Mgła a `fog_active`:** wg pinu (`main.ts:13485-13513`) przy wyłączonej mgle wszystkie zbiory = `ALL_KEYS`, `fogOn = false`; przy włączonej `visible = {stan 2}`, `explored = {stan ≥ 1}` (pin dokłada widoczne do odkrytych, `:13483`). `prism_hidden = !explored` przy aktywnej mgle, `false` przy wyłączonej. `revealAllLand`/`riverRevealKeys` nie istnieją w DTO (luki L1/L2 dokumentu) — poza Q1, odnotowane w komentarzu `fog.rs`.
2. **`OwnerRef` → `i32`:** `i32::try_from(legacy_i64)` → `Err(OwnerOutOfI32{value})`, nigdy obcięcie/saturacja.
3. **Enumy:** wszystkie 9 mają w rendererze odpowiednik 1:1; konwersje są całkowite (`match` bez `_`), więc nowy wariant DTO bez odpowiednika = błąd kompilacji. „Nieznana wartość” (napis spoza listy) odrzuca już parser DTO — test sprawdza to `serde_json` dla każdego enumu + `FogState` kod `3`.
4. **`RiverPathDto.kind = None`** zostaje `None` (reguła „brak = main” należy do renderera), adapter nie podstawia `Some(Main)`.
5. **`to_int32` jest `pub(crate)`** (wg dispatchu), więc testy integracyjne sprawdzają je przez publiczne `view::seed_i32`, które tylko je woła; dodatkowo test jednostkowy w `js_num.rs`.

## Wektory ToInt32 — źródło wartości oczekiwanych

Prosty skrypt Node (`node -e`, wyrażenie `x | 0` — reguła języka ECMA-262 §7.1.6, nie kod pinu), zgodny z ręcznym wyliczeniem (trunc, mod 2^32, U2). 27 wektorów: `0`, `-0`→0, `±0.5`→0, `1.9`→1, `-1.9`→-1, `±12345.678`, `-1`, `2147483647`, `2147483648`→-2147483648, `2147483648.7`→-2147483648, `-2147483648`, `-2147483648.9`→-2147483648, `-2147483649`→2147483647, `4294967295`→-1, `4294967296`→0, `4294967297`→1, `6442450943.5`→2147483647, `1e10`→1410065408, `-1e10`→-1410065408, `9007199254740991`→-1, `±1e300`→0, `NaN`/`±Inf`→0. Test strażnik: ≥ 8 wektorów różni się od `as i32`.

## Testy (kody wyjścia)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie poza repo (usunięty po bramkach), cargo 1.97.0, katalog `rust-port/renderer`.

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0 — 64 zestawy, 502 passed, 0 failed, 0 ignored |
| w tym `tests/view_adapter_core.rs` | 23 passed |
| w tym `tests/geom_three_parity.rs` (earcut: `parity_shape`, `parity_extrude`) | 17 passed |
| w tym lib (`geom::js_num::tests::wraps_like_js`) | 109 passed |

Brak `#[ignore]`, brak osłabionych asercji w istniejących testach (istniejące testy niezmienione).

## Mutacje (każda musi dać FAIL; po każdej przywrócono plik, końcowy przebieg 23/23 ok)

| Mutacja | Wynik |
|---|---|
| M1: `to_int32` → `return x as i32` (saturacja) | FAIL: `seed_is_js_to_int32` (22 passed, 1 failed) |
| M2: pominięcie `prism_hidden` (`push(false)`) | FAIL: `fog_active_builds_three_sets_and_prism_hidden`, `fog_all_unexplored_hides_every_prism` (21/2) |
| M3: przepełnienie `OwnerRef` obcięte (`Ok(value as i32)`) | FAIL: `owner_i32_overflow_is_an_error` (22/1) |

## Kryteria końca

1. Adapter core i wektory zielone; mutacje FAIL — TAK (wyżej).
2. `earcut.rs` używa `geom::js_num::to_int32`; brak duplikatu (`grep "fn to_int32" renderer/src` → 1 trafienie, `js_num.rs:16`); testy earcut zielone — TAK.
3. Bramki EXIT 0 — TAK.
4. Komentarz `view.rs` zgodny z D-DTO-1 — TAK.
5. Brak `#[ignore]`, zero zmian poza allowlistą (`git diff --cached --stat`: 8 plików z allowlisty) — TAK.

## NIE_ZMIERZONO

- Zakres realnych id graczy w silniku (`> i32::MAX`?) — nadal NIE_ZMIERZONO (§8 pkt 1 dokumentu); adapter i tak zwraca błąd.
- Integracja z producentem `FogViewDto` (P4-1C, #212) — producenta brak; testy na ręcznych fixture'ach.
