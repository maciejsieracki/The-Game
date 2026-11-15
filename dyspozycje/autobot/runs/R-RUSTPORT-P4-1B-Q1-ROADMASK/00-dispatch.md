# DISPATCH R-RUSTPORT-P4-1B-Q1-ROADMASK (runda 1) — `compute_road_mask` w silniku (P4-1B / #211)

DOMENA: GAME, DTO renderera → MODEL OPUS we wszystkich rolach.
BAZA (jedyna obowiązująca): `1b8b67173` (= `origin/rust-port/parity-v2`). Worktree detached. Pin pinowy: `07d2fbd72` (`gra/src/**`, tylko odczyt).
Źródło specyfikacji: `dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md` §3 „P4-1B-Q1” (odczytaj OBOWIĄZKOWO).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
- Stała `ROAD_DIRS: [(i32,i32);6]` w kolejności `road-network.ts:32-34`.
- `compute_road_mask(q, r, has_road_at: impl Fn(i32,i32)->bool) -> u8` — port 1:1 `road-network.ts:75-86`.
- Opcjonalnie `road_hexes_to_refresh` (`:170-182`), jeśli potrzebne i bez rozszerzania zakresu.
- Test zgodności `ROAD_DIRS` silnika WYŁĄCZNIE z `mapgen::prims::HEX_DIRECTIONS`. NIE porównuj z rendererem (`civ-engine` nie zależy od `civ-renderer`).

## WEKTORY (generator Node na pinie)
- Generator `gen.mjs` wołający `computeRoadMask` / `roadHexesToRefresh` z `road-network.ts` (`:19-22`).
- Wszystkie 64 kombinacje sąsiadów + losowe mapy (≥ 200 heksów, ziarno stałe) z brzegami mapy (sąsiad poza mapą).
- Strażnik SHA-256 wyciętych fragmentów pinu.

## KRYTERIA KOŃCA
1. `road_network.rs` (NOWY) z `compute_road_mask` i stałą; `pub mod` w `domain/mod.rs` (jedna linia).
2. Test `p4_1b_road_mask.rs` z wektorami; ≥ 64 kombinacje pokryte; mutacja (np. kolejność kierunków) daje FAIL.
3. Bramki EXIT 0: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p4_1b_road_mask`, `cargo test --lib`.
4. Brak `#[ignore]`, brak osłabionych asercji, brak martwego kodu bez wołającego (wołający pojawi się w Q3 — zapisz to jako NIE_ZMIERZONO, nie jako błąd).

## ALLOWLISTA (wyłącznie)
- `rust-port/engine/src/domain/road_network.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (jedna linia `pub mod road_network;`)
- `rust-port/engine/tests/p4_1b_road_mask.rs` (NOWY)
- `rust-port/engine/tests/p4_1b_road_mask_vectors/` (NOWY: `gen.mjs`, `vectors.json`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q1-ROADMASK/**`

Commit jawnym `git add` tych ścieżek. NIE commituj `Cargo.lock`. NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
