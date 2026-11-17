# R-RUSTPORT-P4-1-R3-RIVER-RIBBONS — Operator r1

STATUS: PASS
DOMAIN: GAME (renderer 3D, wstęgi rzek)
TEMAT: R-RUSTPORT-P4-1-R3-RIVER-RIBBONS
GOAL: wstęgi rzek na mapie w rendererze Rust (R3 z `P4-1G-ADAPTER-ROZPOZNANIE.md` §4) — port z pinu `07d2fbd72` `gra/src/render/scene.ts`, wejście = DTO (`river_render_paths`, `rivers`, teren), zero reguł gry w rendererze (D-DTO-1 = A).
BAZA: `origin/rust-port/parity-v2` = `0e04a75c6f6024780632c79cd396bf029f4cee4f` (worktree detached, sprawdzone `git rev-parse HEAD`).
ZMIANY/COMMIT: patrz §1; SHA w odpowiedzi Workflow / `git log -1` gałęzi worktree.
TESTY: patrz §3 (bramki) i §4 (mutacje).
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Evaluator r1.
DEPLOY/PUSH: NIE WYKONANO (bez push do parity, zgodnie z dispatchem).

## 1. Zmiany (allowlista)

| Plik | Co |
|---|---|
| `rust-port/renderer/src/lib.rs` | wyłącznie `pub mod rivers;` |
| `rust-port/renderer/src/rivers/mod.rs` (NOWY) | `build_river_ribbons` (część rzek `buildScene`, `scene.ts:2860-2995`): filtr etapu (`:2864-2877`, `filterRiverPathsForStage` `:1534-1558`), `riverMouthY` (`:2886-2888`), opcje fast (`:2899-2912`), ujścia (`:2918-2992`); materiały `riverWaterMat` (`:2005-2017`) i `coastDeltaMat` (`:2024-2029`); `RiverEntry` (`:247-275`) bez obiektów THREE |
| `rust-port/renderer/src/rivers/edges.rs` (NOWY) | „krawędzie per heks”: `hexCorners`, `neighborDirIndex`, `hexEdgeMidpointByDir`, `sharedEdgeMidpoint`, `walkHexPerimeter`, `riverCornersAlongHexEdges`, `riverTransitCornersOnHex`, `RIVER_INSET_FRAC`, `simplifyRiverRenderPath` (`:467-1104`) |
| `rust-port/renderer/src/rivers/ribbon.rs` (NOWY) | `buildRibbonGeometry(…, sharp=true)` (`:385-460`) |
| `rust-port/renderer/src/rivers/land.rs` (NOWY) | `riverHexSurfaceY`, `pathReachesOpenSeaRender`, `buildRiverPointsFromHexPath`, `decimateRiverRibbonPoints`, `renderLandRiversFromPaths`, `queueRiverGeo`, `flushRiverBucket`, `pushRiverMesh` (`:604-612`, `:937-954`, `:1124-1441`) |
| `rust-port/renderer/src/rivers/coast.rs` (NOWY) | ujścia: `buildCoastalRiverPointChain`, `applyCoastalWaterfall`, `buildEstuaryFunnelGeometry`, `renderCoastalRiverExtension` (`:626-887`) |
| `rust-port/renderer/tests/rivers_web_parity.rs` (NOWY) | 8 testów (§3) |
| `rust-port/renderer/tests/fixtures/rivers/{gen.ts,build.mjs,README.md,rivers.json}` (NOWE) | generator i wektory z kodu webowego pinu (three 0.169.0), README z procedurą |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-1-R3-RIVER-RIBBONS/01-operator-r1.md` | ten raport |

Nie zmieniono: `view-model/**`, `engine/**`, `renderer/src/view/**`, `battle/**`, `cities/**`, `decor/river_lod.rs`, `map_units/**`, `gra/`, `Cargo.lock` (zmodyfikowany lokalnie przez `cargo`, przywrócony, nie w commicie).

## 2. Ustalenia (ważne dla Evaluatora i orkiestratora)

1. **`rzeka_krawedzie` nie ma konsumenta w renderze pinu.** `scene.ts:1263-1264`: „hex.rzeka.krawedzie zostaje dla logiki gry; render idzie po pełnej ścieżce”; `git grep -n krawedzie 07d2fbd72 -- gra/src/render` → tylko ten komentarz (i dwa niezwiązane pliki modeli). Kontrakt `P4-1G-ADAPTER-ROZPOZNANIE.md` §3 wiersz 61 (`scene.ts:800`, `:2860-2873`) przypisuje mu użycie, którego w pinie nie ma. Zgodnie z zasadą 9/11 (parytet 1:1, nie wymyślać) moduł **nie czyta** `rzeka_krawedzie`; „krawędzie per heks” wstęgi liczy się z kolejnych heksów ścieżki renderu (`riverCornersAlongHexEdges`), dokładnie jak web. Do poprawy w kontrakcie (wiersz 61 i R3 w §4) — poza allowlistą tego tematu.
2. **Kolor wody = `palette.river` (roblox `0x6aadbe`, `mapRenderStyle.ts:568`), nie stała `RIVER_COLOR = 0x5fb4e8` (`scene.ts:161`).** Ta stała jest zdefiniowana i nigdzie nieczytana w pinie (`git grep RIVER_COLOR` → tylko definicja); materiał `riverWaterMat` bierze `palette.river` (`scene.ts:2006`). Emissive roblox `0x2288dd` × `0.65` (`:2007-2008`). `Material` nie ma pól `emissiveIntensity`/`fog`, więc są w `RiverMaterial` obok (bez zmiany `scene/material.rs`).
3. **Wejście = typy renderera, nie DTO.** `RiverRibbonInput` przyjmuje `TerrainAt`, `RiverPath` (już w `terrain/mod.rs`), `river_render_paths` i zbiór heksów delty; konwersję DTO → wejście robi test (adapter produkcyjny to osobny temat w `view/`, zgodnie z NIE ROBIĆ).
4. Gałąź CatmullRom `buildRibbonGeometry` (sharp=false) nie jest osiągana przez żadną wstęgę rzeki (wszystkie wywołania `sharp=true`: `:844, 859, 869, 1435` przez `pushRiverMesh(…, true)`), więc nie jest portowana; `ribbonSegments`/`segmentsPerSpan` nie mają wpływu na geometrię rzek.
5. `river_delta_hexes` istniejącego modułu `terrain/coast.rs` (port z `edb8fb56`) daje na wszystkich mapach fikstury ten sam zbiór co `computeRiverDeltaHexKeys` pinu (test `delta_hexes_match_web`).
6. Generator: `renderLandRiversFromPaths` jest eksportowany przez sam pin; pozostałe 7 funkcji prywatnych udostępnia jedna dopisana linia `export { … }` przy bundlowaniu (`build.mjs`), bez zmiany ciał. Orkiestracja kubełków ujść i formuła `riverMouthY` są w generatorze przepisane (harness, cytowane), bo `buildScene` nie działa bez WebGL. Ponowna generacja odtworzyła `rivers.json` bajt w bajt (sha256 `52207fe1…239469`).

## 3. Testy i bramki

`rust-port/renderer`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo, unikalny `target_r3_rivers`), usunięty po bramkach.

`df -h /` przed bramkami: 8.2–8.3 GB wolnego (≥ 8 GB). (Na starcie tematu było 7.1 GB, potem zwolniło się miejsce poza tym tematem; bramki uruchomione dopiero przy ≥ 8 GB.)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0 — 69 binarek testowych, 569 passed, 0 failed, 0 ignored (`df` przed: 8.2 GB, po: 8.1 GB) |

Testy tematu (`tests/rivers_web_parity.rs`, 8/8 ok; + 2 testy jednostkowe w `rivers/edges.rs`):
- `scenarios_match_web_bit_for_bit` — 14 scenariuszy (mapa A ręczna 12×8 z 8 rzekami wszystkich rodzajów, w tym brak rodzaju i delty; mapy generatora pinu G1 40×30, G2 48×36), etapy 0/1/2/3/5, tryby normal/fast/scene-fast, R = 1.5, `batchSize` 2/3 + decymacja: 274 wpisy `RiverEntry` — materiał, `renderOrder` (55/58/50), `merged`, `hexKeys`, `pointHex`, `segPointHex`, pozycje/normalne/UV bit w bit, indeksy; `riverHexKeys`; `riverMouthY` bit w bit.
- `point_walk_matches_web` — 20 przypadków `buildRiverPointsFromHexPath` (prosta, zawrót 180°, skręt ≥120°, zygzak 60°, krok niesąsiedni, wejście w morze, poza mapą, 1 heks) × `extendToCenter`: kolejność i wartości punktów (f64 bit w bit), `pointHex`, `hexKeys`, `simplifyRiverRenderPath`, `pathReachesOpenSeaRender`.
- `ribbon_geometry_matches_web` — 8 przypadków `buildRibbonGeometry` (skalarna i per-punkt szerokość, punkt zdublowany, pionowy próg); 2 wierzchołki/punkt, 2 trójkąty/segment.
- `colours_and_constants_match_web` — kolor wody `0x6aadbe` = `styleScenePalette('roblox').river` z pinu, ≠ `0x5fb4e8`; emissive, side, depthWrite, polygonOffset, fog; kolor delty; wysokości.
- `straight_river_segments_and_point_order` — wektor ręczny niezależny od fikstury: rzeka prosta q=2 → 12 punktów, 24 wierzchołki, 22 trójkąty, `pointHex` w kolejności ścieżki, pierwszy punkt z = 0.8625 (środek ściany wsunięty 0.15, `scene.ts:1172-1184`), ostatni = środek (2,4) (`:1223-1229`), kolejność kubełków ujścia (lejek 50, woda 58, delta 58).
- `delta_hexes_match_web`, `fixture_record_counts`, `render_paths_must_be_one_to_one_with_rivers`.

## 4. Mutacje (wymagane FAIL)

Skrypt: kopia plików → mutacja → `cargo test --test rivers_web_parity` → przywrócenie (`cmp` po przywróceniu: identyczne; potem 8/8 ok).

| Mutacja | Miejsce | Wynik |
|---|---|---|
| (a) kolejność punktów wstęgi odwrócona | `land.rs`: `out.pts.reverse(); out.point_hex.reverse();` | **FAIL** (3 testy: `point_walk_matches_web`, `scenarios_match_web_bit_for_bit`, `straight_river_segments_and_point_order`; cargo exit 101) |
| (b) kolor wody stały inny | `mod.rs`: `Material::lambert(0x005f_b4e8)` | **FAIL** (`colours_and_constants_match_web`, `straight_river_segments_and_point_order`; exit 101) |
| (c) krawędź heksa pominięta | `edges.rs`: `.skip(1)` w rogach `river_transit_corners_on_hex` | **FAIL** (3 testy: `point_walk_matches_web`, `scenarios_match_web_bit_for_bit`, `straight_river_segments_and_point_order`; exit 101) |
| po przywróceniu | — | 8/8 ok, exit 0 |

## 5. Bez `#[ignore]`, bez osłabionych asercji

`grep -rn "#\[ignore\]" src/rivers tests/rivers_web_parity.rs` → 0. Porównania geometrii są bitowe (`to_bits`), nie tolerancyjne; jedyne tolerancje (1e-5/1e-6) są w wektorze ręcznym, który dodatkowo sprawdza wartości analityczne niezależnie od fikstury.
