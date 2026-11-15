# R-RUSTPORT-P4-1B-Q3-MAP-VIEW — Operator r1

```text
STATUS: PASS
DOMAIN: GAME (DTO renderera)
TEMAT: R-RUSTPORT-P4-1B-Q3-MAP-VIEW
GOAL: producent MapViewDto + HexDynDto z modelu mapy (SnapshotMap), 1:1 z pinem 07d2fbd72;
      walidacja riverRenderPaths.len == rivers.len w view-model.
ZMIANY/COMMIT: kod 6b1b5c8ed (galaz robocza worktree-wf_c431c5de-ee5-1, rodzic 2f9a12786 =
      origin/rust-port/parity-v2 w chwili startu); raport w commicie nastepnym po 6b1b5c8ed.
TESTY: wszystkie bramki dispatchu EXIT 0 (lista nizej); 8/8 mutacji zrodla wykrytych.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1
DEPLOY/PUSH: NIE WYKONANO (bez push, bez integracji)
```

## Baza i izolacja

- Baza: `origin/rust-port/parity-v2` = `2f9a12786` (zawiera Q1 `ca6c97472` i Q2 `2f9a12786`).
  Worktree `/home/user/The-Game/.claude/worktrees/wf_c431c5de-ee5-1`, galaz `worktree-wf_c431c5de-ee5-1`
  ustawiona na baze (`git checkout -B`).
- Pin tylko do odczytu: `git show 07d2fbd72:...`. `gra/` i `origin/main` nietkniete.
- `CARGO_TARGET_DIR` poza repo (scratchpad), `CARGO_INCREMENTAL=0`, debug=0. `Cargo.lock` NIE commitowany
  (plik nieśledzony `rust-port/engine/Cargo.lock` pozostaje poza commitem).

## Zmiany (allowlista — dokladnie te pliki)

| Plik | Zmiana |
|---|---|
| `rust-port/engine/src/domain/map_view.rs` | NOWY: producent + `MapViewError` + 2 testy jednostkowe |
| `rust-port/engine/src/domain/mod.rs` | 1 linia `pub mod map_view;` |
| `rust-port/view-model/src/validate.rs` | regula `len("map.riverRenderPaths", rivers.len(), river_render_paths.len())` w `validate_map`; doc `LengthMismatch` rozszerzony (wariant bez zmian — `LengthMismatch` wystarcza) |
| `rust-port/view-model/tests/validate.rs` | test `river_render_paths_parallel_to_rivers` (brak, nadmiar, trasy bez rzek, pusto, `Display`) |
| `rust-port/engine/tests/p4_1b_map_view.rs` | NOWY: 12 testow wektorowych/negatywnych/mutacyjnych |
| `rust-port/engine/tests/p4_1b_map_view_vectors/{gen.mjs,vectors.json}` | NOWE: generator na pinie + wektory |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1B-Q3-MAP-VIEW/` | ten raport, `mutation-evidence-r1.txt`, `mutate-r1.py`, `mutate-vm-r1.py` |

## Producent (`civ_engine::domain::map_view`)

- `build_map_view(&SnapshotMap) -> Result<MapViewDto, MapViewError>`
  - `width/height` z `szerokoscQ/wysokoscR` (calkowite w `u32`), `seed` bez zmian.
  - `hexes`: `sorted_hexes` — JAWNE `sort_by_key((r, q))` (kolejnosc `SnapshotMap.hexes` = `Object.keys`,
    rozpoznanie §3 Z5), `HexStaticDto { coord, terenBazowy, rzeka.krawedzie }`.
  - `rivers[i]` = `riverPaths[i]` + `riverPathKinds[i]` (`None`, gdy tablicy brak albo krotsza).
  - `river_render_paths`: lancuch `scene.ts:1306-1318` — `kinds[i] ?? 'main'`, `mainPathsForJunction` =
    trasy `main` (lacznie z `None`), `medium` -> `trim_medium_render_path_at_main` (Q2) ->
    `medium_river_render_path`; reszta -> `land_river_render_path`. Liczone dla KAZDEJ trasy, 1:1 z
    `rivers`; filtr etapu (`filterRiverPathsForStage`) i filtry dlugosci (`:1310-1311`, `:1319-1320`)
    zostaja w rendererze (rozpoznanie §1.2 pkt 4, §2 „mainPaths ... bez filtra etapu daje ten sam wynik”).
  - Teren do rzek: `river_hex_record` (klucz wpisu = klucz weba `"q,r"`, `TerenBazowy` -> `mapgen::Terrain`).
- `build_hex_dyn(&SnapshotMap, city_hexes: &[HexCoord]) -> Result<Vec<HexDynDto>, MapViewError>`
  (porzadek jak `build_map_view.hexes`):
  - `road_mask = compute_road_mask(q, r, hexHasRoadAt)` (Q1) dla KAZDEGO heksa; `hex_has_road_at` =
    klucz istnieje i `hex_has_road` (`roads.rs`) — sasiad spoza mapy = brak drogi (`main.ts:3144-3147`),
    bez filtra mgly, bez zawijania.
  - `terraces` = `improvement_keys_for_hex` zawiera `tarasy`; `covering_improvement` =
    `hex_has_covering_terrain_improvement`; `village_present` = `wioska.istnieje && !city_hexes.contains`
    (`main.ts:3365-3368`); pola `nakladka/ulepszenie/ulepszenia/improvementKey/zloze` z heksa.

### Decyzje techniczne (zasada 9, bez pytania)

- **Z-Q3-1** (dispatch): zrodlo = `&SnapshotMap`.
- **Z-Q3-2**: producent zwraca `Result` zamiast golego DTO (odstepstwo od sygnatury w dispatchu
  `-> MapViewDto`). Powod: DTO jest typowany (enumy `Terrain/Nakladka/Ulepszenie/RiverKind`, `u8`,
  `u32`), a `SnapshotMap` ma pola tekstowe (Z-M17-2). Wartosc spoza enuma weba nie ma reprezentacji —
  jawny `MapViewError` (`Dimension`, `UnknownTerrain`, `UnknownNakladka`, `UnknownUlepszenie`,
  `UnknownRiverKind`, `RiverEdge`, `Coord`) zamiast cichej podmiany. Test `bledy_wartosci_bez_reprezentacji_w_dto`.
- **Z-Q3-3**: `cities` = pozycje heksow miast (`&[HexCoord]`) — pin czyta tylko `c.q`/`c.r`.
- **Z-Q3-4**: klucz heksa = klucz wpisu `SnapshotMap.hexes` (web `map.hexes[keyOf(q,r)]`).
- **Z-Q3-5**: `HexLike.nakladka = None` w adapterze — `improvementKeysForHex` / `hexHasRoad` /
  `hexHasCoveringTerrainImprovement` jej nie czytaja (pin `terrain-improvements.ts:358-392`).
- **Z-Q3-6**: `rzeka.krawedzie` przenoszone bez filtra `obecna` (kontrakt §3.2 `Hex.rzeka.krawedzie`);
  zakres `0..=5` sprawdza `validate_map`, producent odrzuca tylko wartosci spoza `u8`.

## Wektory (`p4_1b_map_view_vectors/`)

- `gen.mjs` WYKONUJE pin: `mapSnapshot.ts` i `road-network.ts` w calosci (import `.ts`, Node 22.23.4),
  30 wycietych fragmentow (scene.ts :1306, :1312-1318, :2873-2874; gen-helpers.ts land/medium/trim/
  sanitize/repair/canRiverFlowThrough/...; terrain-improvements.ts; road-movement.ts; main.ts
  `hexHasRoadAt` :3144-3147, regula wioski :3365-3368, wywolanie maski :17083; picker.ts `keyOf`;
  types/hex.ts `TerenBazowy`) + 3 pliki (dane `terrain-improvements.json`, oba moduly) — kazdy ze
  straznikiem SHA-256 i kontrola domkniecia funkcji. `node gen.mjs --check` -> `OK: vectors.json zgodny (6 map)`.
- Wejscie = `serializeMapForSave(map)` (snapshot zapisu); wynik liczony na `buildGameMapFromSnapshot(snapshot)`.
  Rust: `build_game_map_from_snapshot` na tym samym JSON.
- 6 map: 10x8 (r-major), 18x12, 31x17, 14x9 (`riverPathKinds` BRAK), 12x11 (`riverPathKinds` krotsze,
  trasy `main` poza tablica = `None`), 1x1; 5 map z kolejnoscia kluczy != r-major.
  108 tras: main 17, medium 43, short 15, tributary 15, `None` 18; 98 tras renderu != surowa trasa;
  1082 heksow, 1017 masek != 0; 228 wiosek (czesc zastapiona miastem); tarasy 49; covering 494.
  Warstwy `ulepszenia` obejmuja alias `pastwisko`, klucze spoza katalogu, `''`, `'brak'`, `'Droga'`,
  `'constructor'`/`'toString'` (prototyp JS).
- SHA-256: `vectors.json` `0bbe26821ed16d40a3da5f39bb348f7c1394bba6b17c48ede0b42b420740f25e`,
  `gen.mjs` `8169fa714b62eeff951f0fb3c0945b4e60fc0029fc854f648284cdf93cd715e0`.

## Testy `tests/p4_1b_map_view.rs` (12, wszystkie zielone)

`naglowek_pinu_i_straznik_sha`, `map_view_bajt_w_bajt_z_pinem` (serde JSON DTO == JSON pinu po
`deny_unknown_fields` + `validate_map`), `hex_dyn_bajt_w_bajt_z_pinem`, `przetasowane_hexes_daja_identyczny_dto`
(4 permutacje x 6 map, w tym q-major), `walidacja_dlugosci_render_paths`, `bledy_wartosci_bez_reprezentacji_w_dto`,
`pokrycie_wektorow` (liczniki z wektorow i wywolan Rust), 4 mutanty w tescie (brak trimu, `None` jako
`short` i jako `medium`, maska z filtrem mgly, brak sortowania) i `sasiad_spoza_mapy_to_brak_drogi`.

## Mutacje zrodla (`mutate-r1.py`, `mutate-vm-r1.py`; wynik `mutation-evidence-r1.txt`)

| Mutacja | Wynik |
|---|---|
| M1 brak trimu dla `medium` | WYKRYTA (`map_view_bajt_w_bajt_z_pinem`) |
| M2 `None` jako nie-`main` | WYKRYTA |
| M3 maska z filtrem mgly | WYKRYTA (`hex_dyn_bajt_w_bajt_z_pinem`) |
| M4 bez sortowania heksow | WYKRYTA (5 testow) |
| M5 wioska ignoruje miasta | WYKRYTA |
| M6 `medium` przez `land` | WYKRYTA |
| M7 sasiad spoza mapy = droga | WYKRYTA |
| M8 brak reguly dlugosci w `validate_map` | WYKRYTA (`river_render_paths_parallel_to_rivers`) |

Po kazdej mutacji zrodlo przywrocone (skrypt w `finally`); wzorce mutacji sprawdzone na zrodle po `rustfmt`.

## Bramki (EXIT)

| Komenda | Wynik |
|---|---|
| `cargo fmt --check` (engine) | EXIT 0 |
| `cargo fmt --check` (view-model) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (engine) | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` (view-model) | EXIT 0 |
| `cargo test --lib` (engine) | EXIT 0, 121 passed |
| `cargo test --test p4_1b_map_view` | EXIT 0, 12 passed |
| `cargo test -p civ-view-model` | EXIT 0 (wszystkie binarki testowe `ok`, 0 failed) |
| kontrolnie: `--test p4_1b_road_mask --test p4_1b_river_trim --test p6_m17_rebuild` | EXIT 0 (8/4/5) |
| `node gen.mjs --check` | OK |

Brak `#[ignore]`, brak oslabionych asercji, istniejace testy bez zmian (tylko dopisany test w `view-model/tests/validate.rs`).
Pelny `cargo test` silnika (wszystkie testy integracyjne): NIE_ZMIERZONO w tej rundzie (poza zakresem bramek dispatchu).

## NIE_ZMIERZONO

1. Wolajacy producenta w warstwie renderera / skladanie `RenderViewDto` (P4-1G) — producent nie ma
   jeszcze produkcyjnego wolajacego.
2. Model mapy rozgrywki inny niz `SnapshotMap` (`PlayableMap`/`MapHex`) — adapter poza Q3.
3. `placedImprovements` (`main.ts:3132-3135`) jako dodatkowe zrodlo `tarasy` — producent uzywa
   `improvementKeysForHex` (rozpoznanie §1.3, §4 pkt 2).
4. Scenariusz `playtestMiastoEkonomia.ts` (zmiana terenu w trakcie gry) — przeliczanie `riverRenderPaths`
   po starcie (rozpoznanie §4 pkt 4).
