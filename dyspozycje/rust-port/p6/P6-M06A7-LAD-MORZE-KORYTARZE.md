# P6.M06A7 - lad / morze / korytarze obwarzanka Pangei (dossier)

Temat: R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1. Kontynuacja M06A6 (`P6-M06A6-LAD-MORZE-PANGEA.md`).
Pin webu: `edb8fb56` (`gra/src/map/gen-helpers.ts`). Zakres web: :3186-4374 (dalsza czesc: :4375-4620).

## GOAL

Port do `rust-port/engine/src/domain/mapgen/landsea.rs` symboli zalezne od `rebalanceLandFractionPangea`
(:3667): `pangeaAnnularMaxCorridorWidth` (:4329), `groupDryLandMassKeys` (:4338),
`isPangeaBridgeWater` (:4371), `ensurePangeaSingleContinent` (:4375), `fillPangeaAnnularSeaCorridors` (:4595),
plus `morseDepthFromMapBorder` (DANE-JUZ-W-RUST, M06A4). Partia 1 (ten run): dwa symbole.

## Binarne kryterium (stan partii 1, runda 1)

| Symbol (web) | Linia | Status | Dowod |
|---|---|---|---|
| `pangeaAnnularMaxCorridorWidth` | :4329 | PORTOWANY (partia 1) | `landsea.rs` `pangea_annular_max_corridor_width`; wektory `tests/p6_m06a7_vectors/annular-vectors.json` (112 254 przypadkow); test `tests/p6_m06a7_annular.rs` |
| `isPangeaBridgeWater` | :4371 | PORTOWANY (partia 1) | `landsea.rs` `is_pangea_bridge_water` = `is_water_terrain_local`; wektory `bridge-vectors.json` (8 wartosci TerenBazowy) |
| `groupDryLandMassKeys` | :4338 | RUNDA-2 (partia 2) | - |
| `ensurePangeaSingleContinent` | :4375 | RUNDA-2 (partia 3) | - |
| `fillPangeaAnnularSeaCorridors` | :4595 | RUNDA-2 (partia 4) | - |
| `morseDepthFromMapBorder` | - | DANE-JUZ-W-RUST | `landsea.rs` `morse_depth_from_map_border` (M06A4) |
| `rebalanceLandFractionPangea` | :3667 | RUNDA-2 (osobne ID, po zaleznosciach) | - |
| `rebalanceLandSeaRatio` | :3791 | RUNDA-2 (osobne ID) | - |

## Implementacja partii 1

- `pangeaAnnularMaxCorridorWidth(w, h)`: `mapScale = sqrt((w*h)/skala)`;
  wynik `max(min, min(max, round(baza + mapScale*mnoznik)))`.
  Operacje: `f64::sqrt` (IEEE, = `Math.sqrt`), `js_round` (= `Math.round`, polowki w gore),
  `js_min` / `js_max` (`masks::v8math`, = `Math.min`/`Math.max`, propagacja NaN).
  Literaly danych (skala 20160, baza 6, mnoznik 2.6, zakres 6..22) w
  `rust-port/engine/data/derived/mapgen-landsea-pangea-annular.json`, odczyt w `src/data/derived.rs`
  (`mapgen_landsea_pangea_annular()`); w kodzie brak literalow danych.
- Wykaz Math.*: `Math.sqrt` -> `f64::sqrt`; `Math.round` -> `improvements::js_round`;
  `Math.min/max` -> `masks::v8math::{js_min, js_max}`. Brak `Math.sin/cos/pow/atan2/hypot` w partii 1.
- Zalozenia: `width`/`height` jako `f64` (JS number; wartosci calkowite w praktyce). NaN / ujemny
  iloczyn -> NaN (jak web). Zakres wektorow: w, h in 0..300 (pelna siatka), duze mapy (do 4096),
  przypadki brzegowe (NaN, Infinity, ujemne, 0.5) oraz progi zaokraglenia: dla k = 6..23 i w <= 300
  wszystkie h w oknie [h*-2, h*+2] wokol rozwiazania `6 + sqrt(w*h/20160)*2.6 = k + 0.5`.
  Trafienia graniczne (|raw - (N+0.5)| < 0.05): 15 284; wynik 6 (dolny clamp): 4 621; wynik 22 (gorny clamp): 3 794.
- Generator: `dyspozycje/autobot/runs/R-RUSTPORT-P6-M06A7-LAD-MORZE-KORYTARZE-Q1/gen-m06a7-annular-vectors.mjs`
  (uruchamia PRAWDZIWY kod TS weba z `git archive edb8fb56`, instrumentowana kopia: jedyna zmiana to `export`).
  Pliki wektorow: 1,3 MB + 0,6 KB (limit 10 MB na plik spelniony).

## Dryf po pinie (zakres 3186-4374)

`git diff edb8fb56 origin/main -- gra/src/map/gen-helpers.ts`: 8 hunkow, wszystkie w liniach >= 5995
(`estimateLandCentroidFromSeed`, `buildOceanReachableRiverHexKeys`, funkcje rzek/nizin). Zadne z
symboli zakresu 3186-4374 nie zmienione. Pin `edb8fb56` NIE przepinany w tym temacie.

## Zalozenia (rozstrzygniete bez pytan)

- Z1: Partia 1 = dwa symbole (limit "partie <= 2 symbole"); reszta w RUNDA-2 z lista powyzej.
- Z2: Dane skali/mnoznika w JSON, nie w kodzie (wymog "brak literalow danych").
- Z3: Pomiary mutacyjne i weryfikator niezalezny to kolejny etap (Operator-pomiary), nie ten run.

## Testy i bramki (runda 1)

- `cargo fmt --all -- --check`: EXIT=0.
- `cargo clippy --all-targets -- -D warnings`: EXIT=0.
- `cargo test --test p6_m06a7_annular`: 4 passed.
- `cargo test` (pelny silnik): 1330 passed, 0 failed, EXIT=0 (baza 1326 + 4 nowe).
- Zero zmian istniejacych testow.
