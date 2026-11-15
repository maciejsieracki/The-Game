# 01 — Operator r1 · R-RUSTPORT-P4-1B-Q1-ROADMASK

STATUS: PASS
DOMAIN: GAME (DTO renderera)
TEMAT: R-RUSTPORT-P4-1B-Q1-ROADMASK
GOAL: `compute_road_mask` + `ROAD_DIRS` w silniku, port 1:1 `gra/src/map/road-network.ts:32-34`, `:75-86` (pin `07d2fbd72`), z wektorami z uruchomionego pinu.
ZMIANY/COMMIT: kod `8b16792ae5e793d5c3114353f2320d07e6f50d08` na gałęzi `rust-port-wip/R-RUSTPORT-P4-1B-Q1-ROADMASK-op-r1`, baza `1b8b67173` (= `origin/rust-port/parity-v2`); raport w commicie następnym (rodzic = `8b16792ae`).
TESTY: wszystkie bramki EXIT 0 (szczegóły niżej).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji).

## Zmiany (wyłącznie allowlista)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/road_network.rs` (NOWY) | `pub const ROAD_DIRS: [(i32,i32);6]` w kolejności `road-network.ts:32-34`; `pub fn compute_road_mask(q, r, has_road_at: impl Fn(i32,i32)->bool) -> u8` (port `:75-86`: bit `i` = sąsiad `ROAD_DIRS[i]` ma drogę); test jednostkowy (pojedynczy sąsiad → bit, 0 i 0x3F). |
| `rust-port/engine/src/domain/mod.rs` | jedna linia `pub mod road_network;` (po `rng`). |
| `rust-port/engine/tests/p4_1b_road_mask.rs` (NOWY) | 7 testów: metadane pinu i strażniki SHA, `ROAD_DIRS` == pin == `mapgen::prims::HEX_DIRECTIONS`, pokrycie 64 kombinacji na każdy środek, ≥ 200 heksów map z brzegami, maski == pin, zgodność z `roadHexesToRefresh` pinu (drugi niezależny odczyt kolejności bitów), mutacja kolejności kierunków wykrywana. |
| `rust-port/engine/tests/p4_1b_road_mask_vectors/gen.mjs` (NOWY) | generator: `git show 07d2fbd72:gra/src/map/road-network.ts` → import w Node 22 (moduł czysty, `:19-22`), woła `computeRoadMask` i `roadHexesToRefresh`; strażnik SHA-256 fragmentów `:32-34`, `:75-86`, `:170-182` (EXIT 2 przy zmianie); tryb `--check` (EXIT 1 przy różnicy). |
| `rust-port/engine/tests/p4_1b_road_mask_vectors/vectors.json` (NOWY) | 384 kombinacje (64 × środki `(0,0)`, `(5,-3)`, `(-7,11)` × środek z drogą / bez), 5 map (20×12, 17×13, 1×1, 3×2, 9×9; mulberry32, stałe ziarna) = 549 heksów, maska dla każdego heksa, sąsiad poza mapą = brak drogi (jak `hexHasRoadAt`, `main.ts:3144-3147`). |

Strażniki SHA-256 (pin `07d2fbd72`):
- `ROAD_DIRS` 32-34: `18180afa36a20e52221bd5e67e6147bb0390c993043e23524a6c3bfb26df8598`
- `computeRoadMask` 75-86: `407e65b9fb9b1ecae6e9f2ba55f181b26477f7f97b1042cdbc1971796042e08c`
- `roadHexesToRefresh` 170-182: `0911e3586e6807474b0eb65bbe9d2f52500308824c01436d388bfd0733aa717b`

## Bramki (CARGO_INCREMENTAL=0, DEBUG=0, CARGO_TARGET_DIR w scratchpad poza repo, usunięty po bramkach)

| Komenda (z `rust-port/engine`) | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_1b_road_mask` | 7 passed, 0 failed, 0 ignored |
| `cargo test --lib` | 119 passed, 0 failed, 0 ignored (w tym `road_network::tests::single_neighbour_sets_its_bit`) |
| `node .../gen.mjs --check` | EXIT 0 (plik zgodny z pinem); po ręcznym zepsuciu jednej maski w `vectors.json` → EXIT 1 (przywrócono) |

## Mutacje (ręczne, przywrócone, `cmp` potwierdził oryginał)

1. Zamiana kierunków 0↔1 w `ROAD_DIRS` silnika → 4 testy FAIL (`road_dirs_match_pin_and_hex_directions`, `compute_road_mask_matches_pin_vectors`, `refresh_vectors_agree_with_mask_bit_order`, `mutation_swapped_directions_is_detected`).
2. Odwrócona numeracja bitów (`1 << (5 - i)`) → 3 testy FAIL (`compute_road_mask_matches_pin_vectors`, `refresh_…`, `mutation_…`).
Dodatkowo test `mutation_swapped_directions_is_detected` stale sprawdza, że mutant (zamiana 0↔1) ma > 0 rozbieżności z wektorami.

## Decyzje techniczne

- `road_hexes_to_refresh` NIE przeniesione: rozpoznanie §1.1 stwierdza, że producent (Q3) liczy maskę dla każdego heksa i tej funkcji nie potrzebuje; port bez wołającego byłby martwym kodem. Wektory `roadHexesToRefresh` pinu są w `vectors.json` i służą w teście jako niezależne sprawdzenie kolejności bitów maski.
- Brak porównania z rendererem (`civ-engine` nie zależy od `civ-renderer`); zgodność z `renderer/.../droga.rs` — P4-1G.
- `Cargo.lock` nie commitowany (usunięty z drzewa roboczego); `git add` jawnymi ścieżkami.

## NIE_ZMIERZONO

- Wołający produkcyjny `compute_road_mask` — pojawi się w P4-1B-Q3 (producent `HexDynDto`); dziś funkcja ma tylko wołających testowych. To stan zamierzony wg dispatchu, nie błąd.
- Pełny `cargo test` całego crate (poza `--lib` i `--test p4_1b_road_mask`) — nie był bramką dispatchu, nie uruchamiany.
