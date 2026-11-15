# R-RUSTPORT-P4-1A-VIEW-TYPES-Q1 — Operator (implementacja), runda 1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1A-VIEW-TYPES-Q1
GOAL: Typy modelu widoku (DTO) z P4-1-RENDER-DTO-CONTRACT.md §3 jako osobny crate
      rust-port/view-model (serde camelCase, JSON-safe), testy JSON (round-trip, nazwy
      kluczy, niezmiennik ID) i pomiar rozmiaru snapshotu dla map 3000 i 8000 heksów.
ZMIANY/COMMIT: rust-port/view-model/** (nowy crate) + ten raport; SHA w odpowiedzi Operatora
      (commit na gałęzi worktree, baza origin/rust-port/parity-v2 = 525a2ef7b)
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0;
      cargo test --all-targets EXIT 0 (58 testów: 10+11+13+15+9, 0 ignored); git diff --check EXIT 0
BLOKADY: brak (uwagi do kontraktu w §5)
RUNDY: 1/5
NASTĘPNY KROK: Operator (pomiary) → Evaluator
DEPLOY/PUSH: NIE WYKONANO
```

## 0. Baza, izolacja, zakres

- Dispatch: `git show origin/claude/rust-sivvrn:dyspozycje/autobot/runs/R-RUSTPORT-P4-1A-VIEW-TYPES-Q1/00-dispatch.md` (czubek `origin/claude/rust-sivvrn` = `063bc3559`). **DODATKU r2 w tym pliku nie ma** (`grep -n -i dodatek` → 0 trafień; plik ma jeden commit `62c74a118`). Pracowałem wg treści rundy 1.
- Baza: worktree zresetowany na `origin/rust-port/parity-v2` = `525a2ef7b` (`git merge-base --is-ancestor 525a2ef7b` i `7817ef0c` → oba prawda).
- Zmiany wyłącznie w `rust-port/view-model/**` (nowy) i w tym katalogu runu. `rust-port/Cargo.toml` **nie istnieje** (crate'y w `rust-port/` są samodzielne, bez workspace — jak `engine`, `renderer`), więc nie był dotykany. Zero zmian w `gra/**`, `rust-port/engine/**`, `rust-port/renderer/**`, `src-tauri/**`.
- `Cargo.lock` nie jest commitowany: `rust-port/view-model/.gitignore` = `/target`, `/Cargo.lock`.
- Kontrakt wejściowy: `dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` na `origin/claude/rust-sivvrn`, §3 (+ §1.5.1, §4, §7).
- Pin webu: `07d2fbd72` (`git archive 07d2fbd72 gra/src/...` do scratchpadu i `git show 07d2fbd72:gra/src/main.ts`).

## 1. Crate `civ-view-model` (`rust-port/view-model`)

- Zależność: tylko `serde` (derive). `serde_json` wyłącznie jako dev-dependency (testy + przykład pomiaru) z `float_roundtrip` (parser dokładny dla każdego skończonego `f64`, jak `JSON.parse`; dotyczy tylko testów, nie silnika — por. otwarte zadanie engine „SERDE-FLOAT-ROUNDTRIP”).
- `#![forbid(unsafe_code)]`, `#![warn(missing_docs)]` (clippy `-D warnings` → każdy publiczny element ma dokumentację).
- Wszystkie struktury: `#[serde(rename_all = "camelCase", deny_unknown_fields)]`; `Option` = jawne `null` (klucz zawsze obecny); kolekcje = tablice w kolejności z kontraktu.

| Moduł | Typy (§ kontraktu) |
|---|---|
| `ids.rs` | `PlayerId`, `CityId`, `UnitId` (newtypy `u64`, JSON = liczba, **niezmiennik ≤ 2^53−1** w `try_new` i w deserializacji), `OwnerRef` (`Rebel`/`Barbarian`/`Player`, JSON `-99`/`-1`/`≥0`, porządek `-99 < -1 < 0 < …`), `HexCoord{q,r}` (§3 wstęp, §4 pkt 4) |
| `map.rs` | `Terrain` (8), `Nakladka` (8), `Ulepszenie` (8), `RiverKind` (4), `HexStaticDto`, `RiverPathDto`, `MapViewDto`, `HexDynDto`, `FogState` (0/1/2), `FogViewDto` (§3.2, §3.3) |
| `owners.rs` | `ViewerDto`, `OwnerViewDto`, `MapOutlineKind`, `RelationToViewer` (`self`/`wojna`/`pokoj`/`sojusz`/`neutralni`), `CityViewDto`, `WallKind`, `CityBadgeDto`, `ProductionKind` (§3.1, §3.4) |
| `units.rs` | `UnitViewDto`, `StackViewDto`, `StackVitalsDto` (§3.5) |
| `overlays.rs` | `SiegeViewDto`, `SiegeMachineKind`, `PlacedWonderDto`, `TerritoryViewDto`, `OwnerHexesDto`, `OverlaysViewDto`, `TradeRouteDto`, `TradeMedium`, `OkolicaViewDto`, `TileYieldDto`, `WorkerFieldDto`, `BuildHighlightDto`, `BuildHighlightKind`, `SelectionDto` (§3.1, §3.5–§3.7) |
| `battle.rs` | `BattleViewDto{setup}`, `BattleSetupDto`, `BattleGridDto`, `BattleFortDto`, `BattleUnitSpawnDto`, `BattleSide`, `FortKind`, `TowerMaterial` (§3.8 „Start”) |
| `root.rs` | `RenderViewDto` (§3.1), `RenderLayersDto` (= korzeń bez `map`), `split()`/`join()`, `CONTRACT_VERSION = 1` (D-DTO-3 = B) |
| `validate.rs` | `RenderViewDto::validate()`, `RenderLayersDto::validate(&map)`, `validate_map`, `ViewError` — niezmienniki producenta, których typy nie wymuszają |

`validate()` sprawdza: `contractVersion`; długości `hexState` i `fog.state` = `map.hexes.len()`; `roadMask ≤ 0x3F`; `rzekaKrawedzie ≤ 5`; gwiazdki/odznaki `0..=3`; `veteranLevel 1..=3`; `defenseTier 0..=2`; kolory `≤ 0xFFFFFF`; `ringHex` = `#` + 6 małych cyfr hex; każdy `f64` skończony (JSON nie ma `NaN`/`Infinity` — test pokazuje, że `NaN` zapisuje się jako `null` i snapshot nie wczytuje się z powrotem); siatka bitwy `tiles.len() == cols*rows`. Błąd podaje ścieżkę JSON (np. `units[1].hp`).

## 2. Dowody webowe (pin `07d2fbd72`)

| Literał / kształt | Plik:linia |
|---|---|
| `TerenBazowy` 8 wartości | `gra/src/types/hex.ts:12-24` |
| `Nakladka` 8 | `types/hex.ts:30-39` |
| `Ulepszenie` 8 | `types/hex.ts:45-54` |
| `Widocznosc` (kolejność → kody 0/1/2) | `types/hex.ts:60-64` |
| `HexCoords {q, r}` | `types/hex.ts:71-74` |
| `RzekaInfo.krawedzie` (0–5) | `types/hex.ts:93-100` |
| `riverPathKinds` `'main'|'medium'|'short'|'tributary'` | `types/map.ts:49` |
| `CityMapOutlineKind` `'player'|'war'|'neutral'|'ally'` | `render/cityMapOutline.ts:10` |
| `RelationBorderStatus` | `game/civ-visual.ts:89` |
| `CityWallKind` `'none'|'stone'|'palisada'` | `render/cities.ts:306`; `render/cityMapStatChip.ts:15` |
| `'mur'` → `'stone'` | `main.ts:2961-2965` |
| `CityMapDefenseTier` 0/1/2 | `render/cityMapStatChip.ts:12` |
| `CityMapBadgeInput` (19 pól, bez `hoverExpanded` `:48`, `lodLevel` `:77`) | `render/cityMapStatChip.ts:17-78` |
| wartości plakietki (opcjonalność pól DTO) | `render/cities.ts:905-929` (`_buildBadgeInput`) |
| `ProductionKind` `'budynek'|'jednostka'` | `game/production.ts:95` |
| `RuntimeUnit` (nazwy pól jednostki) | `units/setup.ts:41-74` |
| `StackDisplayInfo` | `game/armyMerge.ts:21-43` |
| `StackVitals` (11 kluczy, `hasCommander`) | `game/armyMerge.ts:1103-1126` |
| `VeteranLevel = 1|2|3` | `game/veteran.ts:59` |
| `UnitPathBadgeLevel = 0|1|2|3` | `game/unit-building-bonuses.ts:292` |
| `SiegeMachineKind` `'taran'|'wieza'` | `game/siegeMachines.ts:6` |
| `PlacedWonder` | `render/wonderRenderer.ts:12-19` |
| `medium: 'lad'|'morze'` | `render/tradeRoutesOverlay.ts:23` |
| `TileYield {zywnosc?, praca?, handel?}` | `game/okolica.ts:206` |
| `CityOkolicaOverlayParams` | `render/cityOkolicaOverlay.ts:47-60` |
| `civRingHexFn` = `'#' + color.toString(16).padStart(6,'0')` | `main.ts:4080-4082`; `null` dla barbarzyńców/miast-państw `main.ts:10381-10383` |
| `refreshBuildHighlight` (warstwy podświetlenia) | `main.ts:16350-16395` |
| `deployPlayerSide?: 'atk'|'def'` | `battle/battleScene.ts:522` |
| `CityFortificationKind 'none'|'palisada'|'mur'` | `game/city-fortification.ts:26`; `fortKind` `battle/battleScene.ts:2440` |
| `material: 'drewno'|'kamien'` | `battle/siegeWall.ts:1105` |
| `ammoCount` → `Infinity` = bez limitu | `battle/battleScene.ts:1434-1448` |
| progi „lite” 3000 / 8000 heksów | `render/mapRenderStyle.ts:50`, `:52` |

Odpowiedniki w Rust (lustro §3.8, bez zależności od renderera): `renderer/src/battle/units.rs:842-852` (`BattleUnitsOpts`), `:510-541` (`UnitSpawn`), `:726-733` (`FortDto`), `battle/field.rs:353-360` (`TerrainGrid`), `:1978-1989` (`BattleSceneOpts`); silnik: `engine/src/domain/ids.rs:4-121`, `domain/hex.rs:8-12`, `bridge.rs:12-13`.

## 3. Testy (kryteria końca 1–3, 5)

| Plik | Liczba | Co sprawdza |
|---|---|---|
| `tests/json_roundtrip.rs` | 13 | **każdy** typ (wszystkie warianty enumów; struktury w wersji „wszystko `Some`” i „wszystko `None`”) przez `to_string→from_str` i `to_value→from_value` + stabilność tekstu; `split/join` bezstratne; JSON warstw = JSON pełny bez klucza `map`; floaty bit-w-bit (`0.1+0.2`, `1/3`, `MAX`, `-0.0`, `2^53+1`); syntetyczne mapy 3000/8000 |
| `tests/json_keys.rs` | 11 | dokładny zbiór kluczy każdego obiektu = nazwy z §3 (w obie strony); każdy klucz w całym snapshotcie camelCase (>200 kluczy); `None` → `null` z kluczem; nieznany klucz odrzucany na 8 poziomach + w elementach tablic; brak wymaganego klucza / pisownia snake_case → błąd |
| `tests/id_invariant.rs` | 10 | `MAX_SAFE_ID = 9007199254740991`; `try_new`/`TryFrom` na granicy; ID = goła liczba JSON, wartość zachowana (0…2^53−1); odrzucenie `2^53`, `u64::MAX`, `-1`, `1.5`, `"7"`, `null`; `OwnerRef` −99/−1/≥0, odrzucenie −2, −98, −100, `2^53`; porządek właścicieli; ID w pełnym snapshotcie (w tym na granicy) zachowane po round-tripie i na właściwych miejscach JSON; snapshot z ID > 2^53−1 nie wczytuje się |
| `tests/pin_vectors.rs` | 15 | literały webu z tabeli §2 (każda lista wyczerpująca przez `match` — nowy wariant nie skompiluje się bez literału), zgodność zbioru, odrzucenie zmiany wielkości liter i nieznanej wartości; kody mgły wg kolejności `Widocznosc`; klucze `StackVitals`, `StackDisplayInfo`, `CityMapBadgeInput` (−2 pola UI), `TileYield`, `HexCoords`; każdy klucz jednostki ma źródło w `RuntimeUnit` albo jest polem pochodnym §3.5; kształt `ringHex` jak `civRingHexFn` |
| `tests/validate.rs` | 9 | każdy niezmiennik `validate()`: przypadek poprawny i błędny z dokładnym `ViewError` (wersja, długości, zakresy, 8 ścieżek `NaN/Inf`, siatka bitwy, granice akceptowane) |

Brak `#[ignore]`, brak `unsafe` (jedyne trafienie `grep unsafe` to nazwa testu `snapshot_with_unsafe_id_is_rejected`). Test czułości (ręczna mutacja, cofnięta): zmiana `"self"` → `"own"` w `RelationToViewer` → `pin_vectors::relation_to_viewer` FAIL; zmiana klucza `roadMask` → `roadmask` → `json_keys::map_keys` FAIL.

## 4. Pomiar rozmiaru (kryterium 4) — POMIAR WSTĘPNY, do potwierdzenia przez wywołanie „Operator (pomiary)”

Narzędzie: `cargo run --release --example snapshot_size` (`rust-port/view-model/examples/snapshot_size.rs`, generator deterministyczny w `tests/common/mod.rs`). Bajty = długość zwartego JSON z `serde_json` (deterministyczne). Czasy = mediana z 15 przebiegów, maszyna: 4 vCPU Intel Xeon 2.10 GHz (zależne od maszyny).

**Założenia (web NIE_ZMIERZONO, kontrakt §4.1/§9 pkt 5):** mapa 60×50 = 3000 i 100×80 = 8000 heksów; 15% heksów z 2 krawędziami rzeki; 1 rzeka/100 heksów po 12 heksów (+ ta sama trasa renderu); 25% las, 5% złoża, 10% ulepszeń (farma); scenariusz „późna gra”: 8 właścicieli, 1 miasto/60 heksów, 1 jednostka/12 heksów, terytorium = promień 2 wokół miasta (19 heksów); oblężenia, cuda, nakładki, bitwa puste.

| scenariusz | heksy | miasta | jednostki | pełny JSON [B] | mapa statyczna [B] | warstwy [B] | hexState+fog [B] | B/heks (pełny) | B/heks (hexState+fog) | ser. pełny [ms] | deser. pełny [ms] | ser. warstwy [ms] |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 3000, bez miast i jednostek | 3000 | 0 | 0 | 754 285 | 222 170 | 532 108 | 531 609 | 251.4 | 177.2 | 1.05 | 1.81 | 0.66 |
| 3000, późna gra (założenie) | 3000 | 50 | 250 | 910 987 | 222 170 | 688 810 | 531 609 | 303.7 | 177.2 | 1.18 | 1.62 | 0.92 |
| 8000, bez miast i jednostek | 8000 | 0 | 0 | 2 011 660 | 593 927 | 1 417 726 | 1 417 227 | 251.5 | 177.2 | 1.92 | 3.40 | 1.65 |
| 8000, późna gra (założenie) | 8000 | 133 | 666 | 2 427 740 | 593 927 | 1 833 806 | 1 417 227 | 303.5 | 177.2 | 2.78 | 3.86 | 1.87 |

**Arytmetyka kontraktu vs pomiar:** §4.1 szacował (ARYTMETYKA) „50–100 B/heks w JSON, ~0,4–0,8 MB na pełny snapshot 8000 heksów”. POMIAR: **~250–300 B/heks, 2,0–2,4 MB** dla 8000 heksów — 3–4× więcej. Przyczyna zmierzona: pusty `HexDynDto` to 174 B (9 nazwanych kluczy ≈ 130 B samych nazw), heks statyczny ~70 B. Przy D-DTO-3 = B warstwy dynamiczne co zmianę to ~1,4–1,8 MB / ~1,7–1,9 ms serializacji (8000 heksów). Wniosek dla rewizji D-DTO-3 (decyzja orkiestratora, nie moja): koszt dominuje `hexState` z nazwanymi kluczami, nie jednostki/miasta. Wpis liczb do `P4-1-RENDER-DTO-CONTRACT.md` §4.1 jest **poza allowlistą tego tematu** (dokument leży na `claude/rust-sivvrn`) — do przeniesienia przez orkiestratora / wywołanie pomiarowe.

## 5. Decyzje techniczne w ramach typów i uwagi do kontraktu

1. **`stacks` w korzeniu.** Tabela §3.1 nie ma wiersza `stacks`, ale §3.5 definiuje `StackViewDto`, a §1.5.1 Δ4 czyta go jako `stacks` (`hasCommander`). Dodałem `stacks: StackViewDto` po `units` (udokumentowane w `root.rs`). Do potwierdzenia w kontrakcie.
2. **`PlacedWonderDto`**: `{wonderId, hex, ownerId, ruin}` — `q/r` złożone w `hex` (jak `CityViewDto.hex`), `ruin?` jako `bool` (`undefined` = `false`). Kontrakt nie podał pól DTO.
3. **`buildHighlight` — luka kontraktu (do P4-1F / rewizji §3.7).** Kontrakt: `kind: generic | mine | foundCity`, pole nie-`Option` (zrobione 1:1; pusty `hexes` = brak warstwy). Web ma **cztery** ścieżki: `foundCityMode` i `activeWonderId` → `setHighlight(…)` z **domyślnym** kryciem (`main.ts:16360`, `:16366`; domyślne `HIGHLIGHT_OPACITY`, `render/units.ts:6524`), ulepszenie → `IMPROVEMENT_BUILD_HIGHLIGHT_OPACITY` (`main.ts:16392-16395`), kopalnia złoża → osobna warstwa (`:16386-16390`). Cud nie ma własnego `kind`; zmapowany na `generic` dostałby złe krycie. Ponadto `reachable` i podświetlenie budowy dzielą w webie **jeden** slot `setHighlight` (ostatni zapis wygrywa) — kontrakt ma dwa pola; producent musi to rozstrzygać. Nie dodałem wariantu `wonder` (byłby dryf od §3.7).
4. **§3.8 bitwa**: kontrakt wskazuje `BattleUnitsOpts` renderera; view-model nie może zależeć od renderera (D-DTO-1 = A), więc pola są lustrem (`BattleSetupDto` = `BattleUnitsOpts` + `BattleSceneOpts` + `FortDto`). `ammoLeft`/`ammoMax`: web używa `Infinity` (nie do zapisania w JSON) → `Option<f64>`, `None` = bez limitu (adapter P4-1G mapuje na `f64::INFINITY`). `id` bitewnej jednostki = `UnitId` (kontrakt §6: `UnitSpawn.id` z `UnitId` przez `Display`). Strumień zdarzeń bitwy (D-DTO-7) — brak typu, decyzja nie podjęta.
5. **Własne newtypy w view-model** (nie te z silnika — crate zależy tylko od serde). Różnica wobec silnika: silnikowy `OwnerRef`/ID przyjmują wartości > 2^53−1, view-model je odrzuca (niezmiennik §4 pkt 4). Konwersja silnik → DTO (`try_new`) należy do producentów (P4-1B…F).
6. **Mgła**: `FogState` (enum `repr(u8)`) z ręczną serializacją do `0/1/2` — JSON identyczny z `Vec<u8>` z §3.3, ale kody spoza 0–2 nie przechodzą przez typ.
7. **`CityBadgeDto`**: opcjonalność wg `_buildBadgeInput` (`render/cities.ts:905-929`): web zawsze wypełnia `ownerColor`, `prodActive`, `prodPaused`, `growthStarving`, `resourceWarning`, `isCityState`, `era`, `isCapital` → pola nie-`Option`; `prodKind`, `prodId`, `prodItemName`, `prodCategoryLabel`, `growthPercent` mogą być `null` → `Option`. (Renderer Rust trzyma `owner_color`/`era` jako `Option` — `raster/atlas/keys.rs:132-175`; adapter owija w `Some`.)
8. **`UnitViewDto.hp: f64`, `hpMax: Option<f64>`** — 1:1 z §3.5 (web `hp?` = „pełne z definicji” rozstrzyga producent).

## 6. Bramki (czysty `CARGO_TARGET_DIR` poza repo)

`CARGO_TARGET_DIR=<scratchpad>/vm-target` (usunięty przed bramkami i po nich), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `--offline`, w `rust-port/view-model`:

```text
cargo fmt --check                              FMT_EXIT=0
cargo clippy --all-targets -- -D warnings     CLIPPY_EXIT=0
cargo test --all-targets                       TEST_EXIT=0
  id_invariant 10, json_keys 11, json_roundtrip 13, pin_vectors 15, validate 9 (0 failed, 0 ignored)
git diff --check                               EXIT 0
```

Narzędzia: `cargo 1.97.0`, `rustc 1.97.0`; zależności rozwiązane lokalnie: `serde 1.0.229`, `serde_json 1.0.154` (lock nie commitowany).

## 7. Metoda (komendy)

- `git fetch origin claude/rust-sivvrn rust-port/parity-v2`; `git show origin/claude/rust-sivvrn:…/00-dispatch.md`; `git show origin/claude/rust-sivvrn:dyspozycje/rust-port/p4/P4-1-RENDER-DTO-CONTRACT.md` (§3 w całości, §1.5.1, §4, §7).
- `git reset --hard origin/rust-port/parity-v2`; `git merge-base --is-ancestor 525a2ef7b origin/rust-port/parity-v2`, to samo dla `7817ef0c`.
- `git archive 07d2fbd72 gra/src/types gra/src/render gra/src/units/setup.ts gra/src/game/{armyMerge,civ-visual,siegeMachines,okolica,veteran,unit-building-bonuses,production,trade-routes}.ts gra/src/battle gra/src/map/generator.ts` → scratchpad; `git show 07d2fbd72:gra/src/main.ts`, `…:gra/src/game/city-fortification.ts`; potem `sed -n`/`grep -n` dla każdej linii z §2.
- Renderer/silnik: `sed -n` na `rust-port/renderer/src/battle/{units,field,siege_towers}.rs`, `raster/atlas/keys.rs`, `rust-port/engine/src/domain/{ids,hex}.rs`.
- Bramki jak §6; pomiar: `cargo run --offline --release --example snapshot_size`.
