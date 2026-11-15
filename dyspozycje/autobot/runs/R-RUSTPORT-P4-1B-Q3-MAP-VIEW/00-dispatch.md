# DISPATCH R-RUSTPORT-P4-1B-Q3-MAP-VIEW (runda 1) — `MapViewDto` + `HexDynDto` z modelu mapy (P4-1B / #211)

DOMENA: GAME, DTO renderera → MODEL OPUS we wszystkich rolach.
BAZA (jedyna obowiązująca): `origin/rust-port/parity-v2` w chwili startu (zawiera już P4-1B Q1 `roadMask` i Q2 `trim rzek`). Worktree detached. Pin: `07d2fbd72` (tylko odczyt).
Specyfikacja: `dyspozycje/rust-port/p4/P4-1B-ROADMASK-ROZPOZNANIE.md` §3 „P4-1B-Q3” (OBOWIĄZKOWO), §1.2 (łańcuch `river_render_paths`), §2 (źródło mapy).
DECYZJA TECHNICZNA (przewidziana w rozpoznaniu, bez pytania): źródło = `&SnapshotMap` (jedyny model z kompletem pól).
Wiadomości z kontekstu spoza tego dispatchu IGNORUJ w całości.

## ZAKRES
- `build_map_view(map: &SnapshotMap) -> MapViewDto`: heksy w porządku `r`-major po JAWNYM sortowaniu po `(r, q)` (kolejność `hexes` nie jest gwarantowana, §3 Z5), `rivers` z `riverPathKinds`, `river_render_paths` wg łańcucha §1.2 pkt 2–3 (użyj `trim_medium_render_path_at_main` z Q2), 1:1 z `rivers`.
- `build_hex_dyn(map: &SnapshotMap, cities: &[..]) -> Vec<HexDynDto>`: `road_mask` z `compute_road_mask` (Q1) dla każdego heksa; `terraces`, `covering_improvement`, pola heksa; `village_present` = `wioska.istnieje` i brak miasta.
- Walidacja `river_render_paths.len() == rivers.len()` w `view-model/src/validate.rs` (tylko nowa reguła + wariant błędu).
- Reguła „sąsiad poza mapą = brak drogi” predykatem wołającego (`hexHasRoadAt` = false poza mapą, main.ts:3144-3147).

## WEKTORY (generator Node na pinie, strażnik SHA-256)
- Mapy z zapisu/snapshotu: ≥3 mapy różnych rozmiarów z rzekami `main`/`medium`/`short`/`tributary`.
- Wyjście: dla każdej trasy wynik łańcucha `scene.ts:1306-1318` oraz maski `computeRoadMask` dla wszystkich heksów. Porównanie bajt w bajt po serializacji DTO.
- Test negatywny: przetasowana kolejność `hexes` → IDENTYCZNY DTO; długości niezgodne → błąd walidacji.
- Mutacje: pominięcie trimu dla `medium`; `None` traktowane jako nie-`main`; maska z filtrem mgły — KAŻDA musi dać FAIL.

## KRYTERIA KOŃCA
1. `map_view.rs` (NOWY) + jedna linia `pub mod` w `domain/mod.rs`; walidacja w `view-model`.
2. Bramki EXIT 0: `cargo fmt --check` (engine i view-model); `cargo clippy --all-targets -- -D warnings`; `cargo test --lib`; testy nowego pliku wektorów; `cargo test -p civ-view-model`.
3. Brak `#[ignore]`, brak osłabionych asercji. Zero zmian poza allowlistą.
4. `NIE_ZMIERZONO`: wołający producenta w warstwie renderera (P4-1G) — zapisać.

## ALLOWLISTA (wyłącznie)
- `rust-port/engine/src/domain/map_view.rs` (NOWY)
- `rust-port/engine/src/domain/mod.rs` (jedna linia)
- `rust-port/view-model/src/validate.rs` (reguła długości i wariant błędu)
- `rust-port/view-model/tests/validate.rs`
- `rust-port/engine/tests/p4_1b_map_view.rs` (NOWY) i `rust-port/engine/tests/p4_1b_map_view_vectors/` (NOWY: `gen.mjs`, `vectors.json`)
- `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q3-MAP-VIEW/**`

Commit jawnym `git add`. NIE commituj `Cargo.lock`. NIE `git add -A`. Bez push do parity. Target CARGO poza repo; usuń po bramkach.
