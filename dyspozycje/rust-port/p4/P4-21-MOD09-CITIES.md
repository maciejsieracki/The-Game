# P4.21 — MOD-09: modele miast i osad w Rust (`miasto-kamien`, `miasto-braz`, ghost Roblox, `settlementModel`, `cityMapOutline`, `CityRenderer` CPU), 1:1 z webem

**Temat:** `R-RUSTPORT-P4-21-MOD09-CITIES-Q1` · **Domena:** GAME · **Rola:** Operator, runda 2/5 (obrona po Evaluator r1; Opus 5.5 medium, R-PROC-AUTOBOT §5a)
**Pin web (tylko odczyt):** `edb8fb56`. **Baza kodu (r2):** `origin/rust-port/parity-v2` @ `2a45e340` (r1: `7cc2e9b8`). **Commity kodu (r2):** `e1d6b809` (r1 `c522d6d6` przeniesiony rebase'em) + `786cacdd` (poprawki r2); worktree, bez push. Odpowiedź na zarzuty: §10.
**Paczka:** MOD-09 z `P4-4-MODEL-CATALOG.md` (tabela paczek, wiersz 9: `miasto-kamien`, `miasto-braz`, `bronzeCityRoblox`, `stoneCityRoblox`, `stoneCity` (typ `StoneCiv`; builder — D-MOD-1), `settlementModel`, `cities.ts` (bez chipa), `cityMapOutline` → `<renderer>/cities/**`, „2 rodziny × 10 poz. × mury + 2 ghost”).

## 0. Streszczenie

- Nowy moduł `civ_renderer::models::cities` (`rust-port/renderer/src/models/cities/{mod,model,kit,kamien,braz,ghost_braz,ghost_kamien,stone_civ,settlement,outline,renderer}.rs`), podpięty jedną linią `pub mod cities;` w `src/models.rs` (`lib.rs` bez zmian — `pub mod models;` już jest).
- Drzewo modelu = **`models::unit_core::model::UnitModel`** (arena węzłów, transformy, `setFromEuler` z trygonometrią V8) — bez czwartego typu drzewa; geometria/materiał miast w minimalnym typie własnym (`CityModel::drawables`, `CityGeo`, `CityMaterial`), bo zamknięty `unit_core::Geo`/`Material` nie wyraża `CircleGeometry`, wyciąganego pierścienia muru, `LineLoop` ani `MeshLambertMaterial`/`LineBasicMaterial` z kolorem liniowym (ZAŁOŻENIE Z1).
- **Zgodność z uruchomionym kodem weba: bitowa, 0 rozbieżności** — 1 048 modeli / 59 109 meshy / 872 272 trójkątów / 72 408 węzłów, 192 347 porównanych wartości (liczniki, bbox, materiały, hash FNV węzłów: pozycja, rotacja, kwaternion, skala, `matrixWorld`, flagi, hash geometrii `Float32` + indeks + grupy); 21 modeli porównanych dodatkowo węzeł po węźle; obwódki 5 / 616 wartości; scenariusz `CityRenderer` 14 kroków / 159 stanów obiektów sceny / 27 035 wartości; model awaryjny `buildCityModel` 2 / 992 wartości. Test mutacyjny: 20/22 zabitych, 2 przeżyły jako mutacje równoważne (§5).
- Wszystkie `Math.sin/cos/atan2/hypot/pow` przez `crate::jsmath` (P4.16). Dowód potrzeby: zamiana `sin/cos` w `azXZ` na platformowe daje 541 + 84 rozbieżności (mutacja M6).
- Poza zakresem: klasyczne buildery `buildBronzeCity`/`buildStoneAgeCity` (D-MOD-1), chip/plakietki i sprite buntu (MOD-10), nowe zestawy miast (D-MOD-4 = C → P4.7). Ocena wzrokowa: `NIE_ZMIERZONO` (brak GPU), lista §7.

## 1. Zakres i rozstrzygnięcia

| Punkt | Rozstrzygnięcie | Dowód |
|---|---|---|
| Styl mapy | tylko `roblox`: `GAME_MAP_RENDER_STYLE` to stała | `mapRenderStyle.ts:40`; `cities.ts:238`; `settlementModel.ts:21` |
| Ścieżka mapy (żywa) | era ≥ 2 → `buildMiastoBraz(civ, level, {mur: stone, palisada, color})`, inaczej `buildMiastoKamien(level, {mur: wallKind≠none, color})`; era 3+ → brąz (brak modelu Żelaza) | `cities.ts:229-250` |
| Zestawy brązu | `'rzym'` → Rzym, każdy inny napis (także nieznany, pusty) → Grecja | `miasto-braz.ts:866-873` |
| Ghost założenia miasta | `buildSettlementModel(era, civ, L, owner, walls)` → `buildBronzeCityRoblox` (era ≥ 2) / `buildStoneAgeCityRoblox(civ, …)` (przeciążenie per cywilizacja) | `settlementModel.ts:12-24`, wywołanie `main.ts:13023` |
| `stoneCity.ts` | tylko typy: `StoneCiv = BronzeCiv`, `STONE_CIVS`, `STONE_CIV_LABELS`; builder `buildStoneAgeCity` poza zakresem (D-MOD-1) | `stoneCity.ts:13-20`, `:371-387` |
| `cities.ts` | część CPU: wybór modelu, `visualKey`, ułożenie (`terrainTopY + CITY_LIFT`, skala 1,38), reuse, mgła, obwódki, `dispose`, model awaryjny `buildCityModel` | `cities.ts:71-250`, `:459-558`, `:635-702`, `:879-917` |
| Poza zakresem `cities.ts` | chip (`_syncStatChip`, `syncStatChips`, `pickStatChipCityIdAt`, LOD plakietek `setBadgeZoomLod/getBadgeZoomLod`), sprite buntu `_syncRevolt` — Canvas → tekstura (MOD-10 / nakładki); nieużywane prywatne `_ownerIndex` (0 wywołań) | `cities.ts:561-632`, `:708-877`, `:924-932` |
| GPU / materiały | brak: materiał = `CityMaterial::{Lambert{color liniowy, flat_shading}, LineBasic{color, transparent, opacity, depth_write}}`; `dispose()` bez odpowiednika CPU | dispatch §„Brak materiałów/shaderów/GPU” |
| Scena | `THREE.Scene` → uporządkowana lista `SceneObject::{City, Outline}` w kolejności `scene.children` | `cities.ts:534,914` |

**ZAŁOŻENIA (luki dispatchu, przyjęte wartości domyślne):**
- Z1. „Typ drzewa = ten z `unit_core::model`”: `CityModel.tree` jest `UnitModel` (węzły, rodzic/dzieci, `position/rotation/quaternion/scale`, `quat_from_euler` V8, `traverse`, `local_matrix`). Pole `Node::mesh` (typ `unit_core::Geo`/`MatId` → `Material` Standard) zostaje `None`; drawable węzła jest w `CityModel::drawables[node_id]` (`Drawable { kind, geo: CityGeo, material, cast_shadow, receive_shadow, render_order }`). Zmiana `unit_core/**` jest poza allowlistą; rekomendacja: w osobnym temacie dodać do `unit_core::model::Geo` wariant rozszerzający, wtedy `drawables` znika.
- Z2. Klucze `map.hexes` weba to `` `${q},${r}` ``; w Rust kluczem jest `HexCoord` (jak P4.14).
- Z3. `ownerId`, `q`, `r` → `i32`; poziom i era → `f64` (web przyjmuje dowolną liczbę: `NaN`, ułamki, poza zakresem — odtworzone, w tym `visualKey` z `Number.prototype.toString`, funkcja `js_number_to_string`). Kolor `undefined` (ujemny `ownerId`) → `Option<u32>::None`: w `miasto-*` daje kolor domyślny (`opts.color ?? DEFAULT`), w obwódce biały (domyślny `LineBasicMaterial`, `setValues` pomija `undefined`), w kluczu obwódki napis `"undefined"`.
- Z4. `poziom` jako liczba albo nazwa progu (`'male'|'srednie'|'duze'`) → `enum Poziom { Level(f64), Size(Rozmiar) }`.
- Z5. Przeciążenie `buildStoneAgeCityRoblox(civ, level, true)` (boolean w miejscu koloru → `rbx(true)`) — nieosiągalne z typowanego API, nieportowane.
- Z6. `buildCityModel` (fallback po wyjątku buildera) — buildery Rust nie zawodzą, więc `CityRenderer` nigdy go nie wybiera (świadome odchylenie: gałąź nieosiągalna); builder jest publiczny (`build_legacy_city_model`) i zweryfikowany bitowo z webem (generator wymusza `catch` przez `era` z rzucającym `valueOf`).

## 2. Wyprowadzenie (plik:linia, web `edb8fb56`) → Rust

| Web | Rust |
|---|---|
| `miasto-kamien.ts:176-192` `makeMats` (lerp kalenicy 0,45 w przestrzeni liniowej) | `kamien::make_mats` (`Color::from_hex(..).lerp(..)`) |
| `miasto-kamien.ts:98-136` `B`/`CYL`/`CONE` (rotacja tylko gdy `rx‖ry‖rz`, `castShadow`) | `kit.rs` `klocek`/`b`/`br`/`cyl`/`cone` |
| `miasto-kamien.ts:138-145` `azXZ`, `tangRotY`, `kuSrodkowi` | `kit::{az_xz, tang_rot_y, ku_srodkowi}` (jsmath) |
| `miasto-kamien.ts:199-340` 11 budynków | `kamien.rs` `chata_prosta` … `kosze` |
| `miasto-kamien.ts:345-437` `naZewnatrz`, `wal` (palisada Biskupin) | `kamien::{na_zewnatrz, wal}` |
| `miasto-kamien.ts:449-578` `mkPut`, `placIsciezki`, 3 fazy | `kit::put`, `kamien::{plac_i_sciezki, sklad_faza_*}` |
| `miasto-kamien.ts:584-642` `rozmiarDlaPoziomu`, `poziomZArgumentu`, `OS_WALU`, `buildMiastoKamien`, `buildPalisadaWal` | `kamien::{rozmiar_dla_poziomu, poziom_z_argumentu, os_walu, build_miasto_kamien, build_palisada_wal}` |
| `miasto-kamien.ts:651` `triPoziomy` | `kamien::TRI_POZIOMY` (test: równe liczbie trójkątów modeli) |
| `miasto-braz.ts:149-161` `PRISM_X/Z` | `CityModel::{prism_x, prism_z}` |
| `miasto-braz.ts:212-330` Grecja: paleta, dom, megaron, świątynia, stoa, amfora, oliwka, studnia, ołtarz | `braz.rs` |
| `miasto-braz.ts:334-359` `murCyklopowy`; `:644-670` `walAgger` | `braz::{mur_cyklopowy, wal_agger}` |
| `miasto-braz.ts:365-480`, `:675-788` place i fazy G/R | `braz::{plac_grecki, plac_rzymski, sklad_faza_*_{g,r}}` |
| `miasto-braz.ts:514-640` Rzym: paleta, vexillum, capanna (`scale.z = 0.84`), dom z tufu, świątynka, westa, spichlerzyk, zagroda, cysterna | `braz.rs` |
| `miasto-braz.ts:798-873` `zapakuj`, `buildMiastoBrazGrecja/Rzym`, `buildMiastoBraz` | `braz::{zapakuj, build_miasto_braz_*}` |
| `bronzeCityRoblox.ts:21-93` `wallMassKind`, `tracePointyTopHex`, `getHexWallRingGeo` (Extrude bez fazy + `rotateX(-π/2)`), `rnd` | `ghost_braz::wall_mass_material`, `CityGeo::HexWallRing` (obrys: `core::hex_shape::append_pointy_top_hex` na świeżej ścieżce — ten sam algorytm co `tracePointyTopHex` i `hexShape.ts:17-32`), `core::bronze::rnd` (P4.12) |
| `bronzeCityRoblox.ts:115-437` paleta, `addBox/addCyl/addStud/steps`, `temple` (11), `house` (11), `walls`, `buildBronzeCityRoblox` | `ghost_braz.rs` (`place_rings`, `table_count`) |
| `stoneCityRoblox.ts:44-471` paleta, chaty, `protoCenter`, `dwelling`, `hexWall`, przeciążenia | `ghost_kamien.rs` (`build_stone_age_city_roblox`, `…_universal`) |
| `settlementModel.ts:12-24` | `settlement::build_settlement_model` (gałąź `roblox`) |
| `cityMapOutline.ts:12-76` | `outline.rs` + `CityGeo::HexLoop` (`core::hex_shape::hex_ring_points_xz` — `hexShape.ts:7-14`, jsmath od `a880484e`) |
| `cities.ts:82-86` `terrainTopY` | `renderer::terrain_top_y` → `core::map_style::terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, 0.0)` (`mapRenderStyle.ts:336-343`) |
| `cities.ts:71-105`, `:111-219`, `:229-267`, `:459-558`, `:635-702`, `:888-917` | `renderer.rs` |

## 3. Numeryka

- `sin/cos/atan2/hypot`: `crate::jsmath` (V8 12.4 fdlibm). Kwaterniony: `unit_core::model::quat_from_euler` (jstrig V8). `Math.round` → `pick::hex::js_round`, `Math.max/min` → `pick::three::{js_max, js_min}` (NaN jak JS). `Color.setHex` (sRGB → liniowy, `js_pow`) i `lerp` → `terrain::color::Color`.
- `rnd(n, salt)` z `core::bronze` (P4.12) — identyczny z kopiami w `bronzeCityRoblox.ts:87-93` i `stoneCityRoblox.ts:18-24`.
- Stała `6.2832` z weba zachowana literalnie (nie `TAU`; `#[allow(clippy::approx_constant)]`).
- Znak zera: rotacja ustawiana tylko gdy któryś kąt jest „truthy” (−0 jest falsy) — jak web; `matrixWorld` liczone pod rodzicem‑sceną (`IDENTITY × local`, co może zmienić `−0` na `+0`) tam, gdzie web ma rodzica (`CityModel::world_matrices(Some(&IDENTITY))`).
- (r2) Obrys heksu i pierścień muru: bez kopii — `core::hex_shape::{hex_ring_points_xz, append_pointy_top_hex}`, które od `a880484e` (P4.18, w `parity-v2`) liczą przez `js_cos`/`js_sin`. Wysokość terenu: `core::map_style::terrain_surface_top_y(.., 0.0)`; dodatkowe `+ 0.0` nie zmienia bitów (test `terrain_top_y_matches_inline_formula_bitwise` dla `Terrain::ALL`; `−0.0` wymagałby `height = y_offset = −0.0`). Uwaga r1 o platformowym `cos/sin` w `core::hex_shape` jest nieaktualna.

## 4. Odtworzone / pominięte

| Element | Status |
|---|---|
| `miasto-kamien` 10 poziomów × mur × kolor (+ poziomy 0, 11, −3, 2,5, 3,5, 6,49, NaN, nazwy progów, kolor > 24 bity) | bitowo |
| `miasto-braz` Grecja/Rzym × 10 poziomów × {brak, mur, palisada, oba} × kolor; router (egipt, sumer, nieznany, pusty) | bitowo |
| Palisada Biskupin osobno (3 fazy) | bitowo |
| Ghost `bronzeCityRoblox` 11 cyw. × 13 poziomów × mury; ghost `stoneCityRoblox` per cyw. 11 × 13 × mury + przeciążenie uniwersalne | bitowo (w tym wyciągany pierścień muru — `ExtrudeGeometry`) |
| `settlementModel` era 0–3 × 3 cyw. × 6 poziomów × mury | bitowo |
| `cityMapOutline` + `placeCityMapOutline` | bitowo (`LineLoop`, `renderOrder = 12`, materiały linii) |
| `CityRenderer.sync/syncMapOutlines/applyFogVisibility/dispose` | bitowo (kolejność sceny, klucze, `visible`, pozycje, skale, modele) |
| `buildCityModel` (fallback) | bitowo; w Rust nieosiągalny z `sync` (Z6) |
| `userData` `model/poziom/rozmiar` | odtworzone (`CityUserData`) |
| Chip, plakietki, LOD plakietek, sprite buntu | poza zakresem (MOD-10) |
| `buildBronzeCity`, `buildStoneAgeCity`, gałąź stylu ≠ `roblox` | poza zakresem (D-MOD-1) |
| Materiały tworzone, ale nierysowane (`terakDk`, `cien` Grecji, `daubDk` Rzymu, `thatchDk` ghosta kamienia) | tworzone dla wierności; bez wpływu na wynik |

API dla tematu GPU: `CityModel::{drawable_nodes, world_matrices(root_parent), bounding_box}`, `CityGeo::build() → geom::Mesh`, `CityMaterial`, `RenderedCity.model` / `RenderedOutline.model` z transformacją w korzeniu.

## 5. Test mutacyjny (skrypt §8.3; każda mutacja na kopii pliku, potem przywrócenie)

```
M1-rot-guard-y-only KILLED city renderer: compared 27035 values, 217 mismatches;city models: compared 192347 values, 1411 mismatches;
M2-box-noshadow KILLED city renderer: compared 27035 values, 98 mismatches;city models: compared 192347 values, 1742 mismatches;
M3-kalenica-lerp KILLED city renderer: compared 27035 values, 93 mismatches;city models: compared 192347 values, 240 mismatches;
M4-wal-n-floor KILLED city renderer: compared 27035 values, 320 mismatches;city models: compared 191927 values, 5782 mismatches;
M5-ring-rotate-sign KILLED city models: compared 192347 values, 796 mismatches;
M6-azxz-platform KILLED city renderer: compared 27035 values, 84 mismatches;city models: compared 192347 values, 541 mismatches;
M7-capanna-scale KILLED city renderer: compared 27035 values, 28 mismatches;city models: compared 192347 values, 142 mismatches;
M8-router-civ KILLED city renderer: compared 26522 values, 3114 mismatches;
M9-ghost-wall-h KILLED city models: compared 192347 values, 188 mismatches;
M10-house-height KILLED city models: compared 192347 values, 1030 mismatches;
M11-stone-wall-recv KILLED city models: compared 192347 values, 196 mismatches;
M12-outline-order KILLED city outlines: compared 616 values, 5 mismatches;city renderer: compared 27035 values, 61 mismatches;
M13-city-lift KILLED legacy: compared 992 values, 34 mismatches;city renderer: compared 27035 values, 392 mismatches;
M14-era-threshold KILLED city renderer: compared 26954 values, 4265 mismatches;
M15-insert-front KILLED city renderer: compared 16390 values, 5049 mismatches;
M16-fog-player KILLED city renderer: compared 27000 values, 15 mismatches;
M17-ku-srodkowi KILLED city renderer: compared 27035 values, 154 mismatches;city models: compared 192347 values, 1685 mismatches;
M18-inner-scale KILLED city renderer: compared 27035 values, 245 mismatches;city models: compared 192347 values, 4845 mismatches;
M19-settlement-era KILLED city models: compared 191843 values, 969 mismatches;
M20-visible-default KILLED city renderer: compared 26297 values, 136 mismatches;
M21-quat-platform SURVIVED
M22-hexloop-trig SURVIVED
```
20/22 zabitych. M8: test modeli kończy się panic (węzeł innego typu, brak `geo` w dumpie) — też FAILED. **Przeżyły (równoważne):** M21 zamienia `unit_core::quat_from_euler` na `geom::Quat::from_euler`, który od P4.16 też liczy na jsmath (`geom/math.rs:459-465`) — ta sama arytmetyka; M22 — platformowe `cos/sin` dla 6 kątów pierścienia obwódki dają na glibc te same bity co V8 (§3). M16 w pierwszym przebiegu przeżył (scenariusz nie rozróżniał gracza mgły) — dodano 2 kroki mgły (`[]` dla gracza 2 i domyślnego), fixtury zregenerowane, M16 zabity.

## 6. Wektory testowe i pochodzenie

Generator `rust-port/renderer/tests/fixtures/cities/gen.ts` uruchomiony **poza repo** (scratch sesji, usunięty po pracy): `three@0.169.0` (integrity `sha512-Ed906MA3…qUv0w==`, wersja z `gra/package-lock.json` na `edb8fb56`), `esbuild@0.24.0` (`sha512-FuLPevCh…iuPqQ==`), `git archive edb8fb56 gra/src gra/data`, node v22.22.0. Moduły weba importowane **bez zmian**; SHA-256 plików z archiwum:

| Plik weba | SHA-256 |
|---|---|
| `render/miasto-kamien.ts` | `f1e52dfea6b795b1022690e4fb63ae778ada5b43bad52e7ebc44bce3853ad1f9` |
| `render/miasto-braz.ts` | `75c31b8ac3618fe219e7401e5dd8ad205d0990423d5bbfc9229884004e257214` |
| `render/bronzeCityRoblox.ts` | `edb8b564dce233d87d1efe4bbab837993132d56535d59f99688114b15f3f821f` |
| `render/stoneCityRoblox.ts` | `7d3660cddc8bb086078ebd733c40ff80fdd788b7ba2280bba3f0db9615539c64` |
| `render/stoneCity.ts` | `514c415a44b9d645c59308be931748855c824d343086dae7e90bc6e81a69c9d7` |
| `render/settlementModel.ts` | `ddd143a1a610e2e9fc5d68d398f36d18d5d844aa106a2b606a54dcb09da39b33` |
| `render/cityMapOutline.ts` | `ade8c790010e95dbd10812228474757c686edb7cc8e10ea9c1be9fa2eb079afa` |
| `render/cities.ts` | `abab4d4f0a642ce40066928dd709e40d6ec3391b6ea9eec1e17791d3abad2e14` |

Instrukcja: `tests/fixtures/cities/README.md`. Stdout: `cities models=1048 outlines=5 steps=14 legacy=2`. Dwa przebiegi dały bajtowo identyczne `models.json` i `renderer.json` (`cmp`) — generator deterministyczny.

| Plik fixtury | Rozmiar | SHA-256 |
|---|---:|---|
| `gen.ts` | 20 263 | `bfcb2ea7499feab1462dacda55f0e087a13989b04ed346b2d2e0d3fa9939579b` |
| `models.json` | 2 856 769 | `023c35407d83d46e7b3fdfc19b9e491e3360f0c3893245d528e238ed45e8bd1c` |
| `renderer.json` | 469 515 | `7d292864c85c36f4fdf5d4844c98db56171b71d11a287eb76ae2b1d2259e69c1` |

Łącznie ok. 3,3 MB (< 8 MB). Pełne zrzuty węzłów tylko dla 21 modeli (pozostałe: hash FNV obejmujący każdy węzeł bit w bit — §README „Hashes”); poza tym niczego nie pominięto.

Testy (`tests/cities_web_parity.rs`): `city_models_match_web`, `city_map_outlines_match_web`, `layout_constants_and_types_match_web` (typy, etykiety, `rozmiarDlaPoziomu`, `triPoziomy` web = stałe Rust = liczba trójkątów zbudowanych modeli), `city_renderer_matches_web`, `legacy_city_model_matches_web`; w module: `js_number_to_string` (ECMA), `owner_color`/`default_civ` (reszta JS).

## 7. `NIE_ZMIERZONO` — do oceny wzrokiem po RR-T5 (GPU)

1. Kamień P1–P10 bez muru i z palisadą Biskupin z kamery gry (izometria) — sylwetki, czytelność progresji, brama od +x.
2. Grecja i Rzym P1–P10 × {brak, mur cyklopowy/agger, palisada}; kalenica w barwie gracza (lerp 40/45 %) przy 8 kolorach `OWNER_COLORS`.
3. Miasta cywilizacji spoza Grecji/Rzymu (zestaw grecki) i era Żelaza (fallback brąz) — zgodność z oczekiwaniem właściciela (D-MOD-4 → P4.7).
4. Ghost założenia miasta (11 cywilizacji, era 1 i ≥ 2) — pierścień muru (wyciągany heks), czytelność na heksie.
5. Obwódki heksów: kolory relacji (gracz/sojusz/neutralny/wojna — czerwony akcent zewnętrzny), przezroczystość, `renderOrder`, brak zapisu głębi.
6. Flat shading Lambert, cienie (boxy/walce/stożki rzucają; ghost: boxy i mur przyjmują), mgła — chowanie obcych miast i obwódek.
7. Skala 1,38 i kompensacja 1/1,38 w dziecku — footprint względem pasa ulepszeń (r 0,50–0,82).
8. Wydajność rysowania wielu miast (instancjonowanie) — poza CPU.

## 8. Bramki i skrypty

### 8.1 Polecenia
`cd rust-port/renderer` na commicie `c522d6d6`; skrypt §8.4. Wynik: fmt EXIT=0, clippy EXIT=0, clippy `--features gpu` EXIT=0, `cargo test --locked --all-targets` EXIT=0 (18 binarek: lib + 17 testów integracyjnych, w tym `cities_web_parity` 5/5; lib 9/9 — korekta r2: w r1 błędnie „19”, dziewiętnasta linia `Running` pochodziła z osobnego przebiegu `--nocapture`). Wynik r2 (`786cacdd`, baza `2a45e340`): §10.

### 8.2 Surowe logi bramek
Pełny, nieobcięty zapis w §9.

### 8.3 Skrypt mutacyjny (scratch, wykonany z `rust-port/renderer`)

```bash
#!/bin/bash
D=src/models/cities
BAK=<scratch>/mut.bak
run() { cp "$2" $BAK; sed -i "$3" "$2"; if cmp -s "$2" $BAK; then echo "$1 NOT-APPLIED"; return; fi
  out=$(cargo test --locked --test cities_web_parity 2>&1); cp $BAK "$2"
  sum=$(echo "$out" | grep -o '[a-z ]*: compared [0-9]* values, [0-9]* mismatches' | grep -v ' 0 mismatches' | tr '\n' ';')
  if echo "$out" | grep -q "FAILED\|error\[\|error:"; then echo "$1 KILLED $sum"; else echo "$1 SURVIVED"; fi; }
run M1-rot-guard-y-only  $D/kit.rs 's/if r\[0\] != 0.0 || r\[1\] != 0.0 || r\[2\] != 0.0 {/if r[1] != 0.0 {/'
run M2-box-noshadow      $D/kit.rs '27s/cast_shadow = true;/cast_shadow = false;/'
run M3-kalenica-lerp     $D/kamien.rs 's/Color::from_hex(color \& 0x00ff_ffff), 0\.45)/Color::from_hex(color \& 0x00ff_ffff), 0.46)/'
run M4-wal-n-floor       $D/kamien.rs 's/js_max(20\.0, js_round(r \* 64\.0))/js_max(20.0, (r * 64.0).floor())/'
run M5-ring-rotate-sign  $D/model.rs 's/m\.rotate_x(-PI \/ 2\.0);/m.rotate_x(PI \/ 2.0);/'
run M6-azxz-platform     $D/kit.rs 's/js_sin((deg \* PI) \/ 180\.0)/((deg * PI) \/ 180.0).sin()/; s/js_cos((deg \* PI) \/ 180\.0)/((deg * PI) \/ 180.0).cos()/'
run M7-capanna-scale     $D/braz.rs '0,/scale\.z = 0\.84;/s//scale.z = 0.85;/'
run M8-router-civ        $D/braz.rs '0,/if civ == "rzym" {/s//if civ == "grecja" {/'
run M9-ghost-wall-h      $D/ghost_braz.rs 's/const WALL_HEIGHT: f64 = 0\.15;/const WALL_HEIGHT: f64 = 0.14;/'
run M10-house-height     $D/ghost_braz.rs 's/(0\.75 + rnd(idx, 3\.0) \* 0\.45)/(0.75 + rnd(idx, 3.0) * 0.46)/'
run M11-stone-wall-recv  $D/ghost_kamien.rs 's/d\.receive_shadow = true;/d.receive_shadow = false;/'
run M12-outline-order    $D/outline.rs 's/render_order = 12;/render_order = 11;/'
run M13-city-lift        $D/renderer.rs 's/pub const CITY_LIFT: f64 = 0\.008 \* HEX_R;/pub const CITY_LIFT: f64 = 0.009 * HEX_R;/'
run M14-era-threshold    $D/renderer.rs '0,/    if era >= 2\.0 {/s//    if era > 2.0 {/'
run M15-insert-front     $D/renderer.rs 's/self\.scene\.push(SceneObject::City(/self.scene.insert(0, SceneObject::City(/'
run M16-fog-player       $D/renderer.rs 's/grp\.owner_id == player_owner_id/grp.owner_id == player_owner_id + 1/'
run M17-ku-srodkowi      $D/kit.rs 's/js_atan2(z, -x)/js_atan2(-z, -x)/'
run M18-inner-scale      $D/kamien.rs 's/1\.0 \/ MIASTO_KAMIEN_CITY_MODEL_SCALE/1.0 \/ 1.37/'
run M19-settlement-era   $D/settlement.rs 's/if era >= 2\.0 {/if era >= 3.0 {/'
run M20-visible-default  $D/renderer.rs 's/is_none_or(|f| f(city))/is_some_and(|f| f(city))/'
run M21-quat-platform    $D/model.rs 's/n\.quaternion = quat_from_euler(n\.rotation);/n.quaternion = crate::geom::Quat::from_euler(n.rotation);/'
run M22-hexloop-trig     $D/model.rs 's/Vec3::new(radius \* js_cos(angle), y, radius \* js_sin(angle))/Vec3::new(radius * angle.cos(), y, radius * angle.sin())/'
```

### 8.4 Skrypt bramek (scratch)

```bash
#!/bin/bash
echo '$ git rev-parse HEAD'; git rev-parse HEAD
echo '$ cargo fmt --all -- --check'; cargo fmt --all -- --check 2>&1; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets -- -D warnings'; cargo clippy --locked --all-targets -- -D warnings 2>&1; echo "EXIT=$?"
echo '$ cargo clippy --locked --all-targets --features gpu -- -D warnings'; cargo clippy --locked --all-targets --features gpu -- -D warnings 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --all-targets'; cargo test --locked --all-targets 2>&1; echo "EXIT=$?"
echo '$ cargo test --locked --test cities_web_parity -- --nocapture'; cargo test --locked --test cities_web_parity -- --nocapture 2>&1; echo "EXIT=$?"
```

## 9. Surowe logi bramek (commit `c522d6d6`)

Zapis bez obróbki (wyjście skryptu §8.4).

```text
$ git rev-parse HEAD
c522d6d62180c68ee951a67fd621b79c999a67e1
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 3.52s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-1/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 3.88s
EXIT=0
$ cargo test --locked --all-targets
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-1/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 3.70s
     Running unittests src/lib.rs (target/debug/deps/civ_renderer-3390857ab33a1fe3)

running 9 tests
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test jsmath::words::tests::words_round_trip ... ok
test core::jsnum::tests::to_fixed3_matches_node ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok
test models::cities::renderer::tests::owner_color_and_civ_follow_js_remainder ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::cities::model::tests::number_to_string_follows_ecma ... ok

test result: ok. 9 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/assets_nturns.rs (target/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[Fixed large 96x60] budget OK at turns [50, 200]
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
test simulation_is_deterministic ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.14s

     Running tests/assets_registry.rs (target/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test live_report_lists_labels ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test owned_guards_count_references ... ok
test reference_counting_frees_on_last_release ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok
test subscriptions_unregister_on_drop ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/camera_web_parity.rs (target/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test drag_and_wheel_do_not_depend_on_dt ... ok
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/cities_web_parity.rs (target/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
test layout_constants_and_types_match_web ... ok
test city_map_outlines_match_web ... ok
test legacy_city_model_matches_web ... ok
test city_renderer_matches_web ... ok
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.57s

     Running tests/core_web_parity.rs (target/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test map_style_matches_web ... ok
test bronze_city_types_match_web ... ok
test vitals_match_web ... ok
test zoom_lod_matches_web ... ok
test merge_decor_matches_web ... ok
test hexutil_matches_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/cpu_sanity.rs (target/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/geom_three_parity.rs (target/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test merge_rejects_mixed_indexing ... ok
test parity_cone ... ok
test index_buffer_covers_non_indexed_meshes ... ok
test parity_curve ... ok
test parity_box ... ok
test parity_circle ... ok
test parity_ops ... ok
test parity_plane ... ok
test parity_ring ... ok
test parity_shape ... ok
test parity_extrude ... ok
test parity_cylinder ... ok
test parity_torus ... ok
test parity_polyhedron ... ok
test parity_sphere ... ok
test trs_matches_manual_composition ... ok
test parity_tube ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/gpu_probe.rs (target/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/jsmath_v8_parity.rs (target/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan_matches_v8 ... ok
test atan2_matches_v8 ... ok
test cos_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test log_matches_v8 ... ok
test acos_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok
test pow_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/jsmath_wiring.rs (target/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 4 tests
test scanner_catches_known_bypass_forms ... ok
test terrain_rotation_uses_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test no_platform_transcendentals_in_js_mirroring_modules ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/pick_golden.rs (target/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test client_rect_to_ndc_matches_web ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.85s

     Running tests/terrain_web_parity.rs (target/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.38s

     Running tests/unit_core_json.rs (target/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (target/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.50s

     Running tests/unit_core_trig.rs (target/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (target/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.41s

     Running tests/wonders_web_parity.rs (target/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test js_trig_is_bit_identical_to_v8 ... ok
test renderer_scenario_is_bit_identical_to_web ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.25s

EXIT=0
$ cargo test --locked --test cities_web_parity -- --nocapture
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.06s
     Running tests/cities_web_parity.rs (target/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
city outlines: compared 616 values, 0 mismatches
test city_map_outlines_match_web ... ok
legacy: compared 992 values, 0 mismatches
test legacy_city_model_matches_web ... ok
layout: compared 57 values, 0 mismatches
test layout_constants_and_types_match_web ... ok
city renderer: compared 27035 values, 0 mismatches
test city_renderer_matches_web ... ok
families: {"braz": 220, "braz_grecja": 3, "braz_grecja_default": 1, "braz_rzym": 3, "braz_rzym_default": 1, "ghost_braz": 287, "ghost_braz_default_walls": 1, "ghost_kamien": 286, "ghost_kamien_default_walls": 1, "ghost_kamien_uni": 24, "ghost_kamien_uni_default_walls": 1, "kamien": 72, "kamien_default": 1, "palisada": 3, "settlement": 144}
city models: compared 192347 values, 0 mismatches
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 3.85s

EXIT=0
```

## 10. Runda 2 — odpowiedź na zarzuty Evaluatora r1

Stan odtworzony z commitów Operatora r1 (`c522d6d6`, `0e35bcbe`) i przeniesiony `git rebase` na `origin/rust-port/parity-v2` @ `2a45e340` (nowsze niż `66e6572d` z próby Evaluatora). Jedyny konflikt: jedna linia w `src/models.rs` (rozwiązana: `pub mod cities;` + `pub mod improvements;`). Wynik: `e1d6b809` (kod r1), `577bee7b` (dok. r1), `786cacdd` (poprawki r2).

| Zarzut | Odpowiedź | Dowód |
|---|---|---|
| 1. Kopie `trace_pointy_top_hex` / `hex_ring_points_xz_js` z `core::hex_shape` | **PRZYJMUJĘ.** Obie kopie usunięte z `models/cities/model.rs`; `CityGeo::HexWallRing` buduje obrys i otwór przez `append_pointy_top_hex` na świeżych `Path2`, `CityGeo::HexLoop` używa `hex_ring_points_xz`. Nieaktualne uzasadnienie usunięte (komentarz w `model.rs`, §3; uwaga 1 z BLOKAD r1 wycofana). | `cities_web_parity` 5/5, 0 rozbieżności (192 347 / 616 / 27 035 / 992 / 57). Mutacje M23 (promień obrysu) i M24 (kierunek otworu) zabite, więc test przechodzi przez funkcje z `core`. M22 (platformowe `cos/sin` w `core::hex_shape`) przeżywa — równoważna, jak w r1. |
| 2. „19 binarek” w raporcie i §8.1 | **PRZYJMUJĘ.** r1 na bazie `7cc2e9b8` miał 18 binarek (lib + 17); §8.1 poprawione. r2 na bazie `2a45e340`: **21** linii `Running` w `cargo test --locked --all-targets` (lib + 20 testów integracyjnych; dodatkowe względem r1 to binarki tematów zintegrowanych w międzyczasie, np. `decor`, `improvements`, `units_kamien`), 129 testów, 0 nieudanych. Przebieg `--nocapture` liczony osobno. | §10.2 (log), linie `Running` od `unittests src/lib.rs` do `tests/wonders_web_parity.rs`. |
| 3. `terrain_top_y` powtarza `core::map_style::terrain_surface_top_y` | **PRZYJMUJĘ.** `renderer::terrain_top_y` deleguje do `terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, 0.0)`; nazwa zachowana jako odpowiednik `terrainTopY` z `cities.ts:82-86` (używana też w teście). `pick::terrain::Terrain::top_y()` nie wybrany, bo `core::map_style` jest portem `mapRenderStyle.ts:336-343`, wołanego przez web. | Nowy test jednostkowy `terrain_top_y_matches_inline_formula_bitwise` (bity równe formule r1 dla 8 terenów); mutacja M25 (styl `Civ` zamiast stylu gry) zabita; `cities_web_parity` 0 rozbieżności. |

ZAŁOŻENIE r2: baza = aktualne `origin/rust-port/parity-v2` w chwili pracy (`2a45e340`), nie `66e6572d` z raportu Evaluatora.

### 10.1 Mutacje r2 (skrypt §8.3; M22 przeniesiona na `src/core/hex_shape.rs` — na kopii pliku, potem przywrócenie; dodane M23–M25)

Zmienione / dodane linie skryptu:
```bash
run M22-hexloop-trig     src/core/hex_shape.rs '0,/Vec3::new(radius \* js_cos(angle), y, radius \* js_sin(angle))/s//Vec3::new(radius * angle.cos(), y, radius * angle.sin())/'
run M23-hexloop-radius   $D/model.rs 's/for p in hex_ring_points_xz(r, y) {/for p in hex_ring_points_xz(r * 1.001, y) {/'
run M24-wallring-reverse $D/model.rs 's/append_pointy_top_hex(\&mut hole, inner, true);/append_pointy_top_hex(\&mut hole, inner, false);/'
run M25-terrain-top-style $D/renderer.rs 's/terrain_surface_top_y(t, GAME_MAP_RENDER_STYLE, 0\.0)/terrain_surface_top_y(t, crate::core::map_style::MapRenderStyle::Civ, 0.0)/'
```

```
M1-rot-guard-y-only KILLED city renderer: compared 27035 values, 217 mismatches;city models: compared 192347 values, 1411 mismatches;
M2-box-noshadow KILLED city renderer: compared 27035 values, 98 mismatches;city models: compared 192347 values, 1742 mismatches;
M3-kalenica-lerp KILLED city renderer: compared 27035 values, 93 mismatches;city models: compared 192347 values, 240 mismatches;
M4-wal-n-floor KILLED city renderer: compared 27035 values, 320 mismatches;city models: compared 191927 values, 5782 mismatches;
M5-ring-rotate-sign KILLED city models: compared 192347 values, 796 mismatches;
M6-azxz-platform KILLED city renderer: compared 27035 values, 84 mismatches;city models: compared 192347 values, 541 mismatches;
M7-capanna-scale KILLED city renderer: compared 27035 values, 28 mismatches;city models: compared 192347 values, 142 mismatches;
M8-router-civ KILLED city renderer: compared 26522 values, 3114 mismatches;
M9-ghost-wall-h KILLED city models: compared 192347 values, 188 mismatches;
M10-house-height KILLED city models: compared 192347 values, 1030 mismatches;
M11-stone-wall-recv KILLED city models: compared 192347 values, 196 mismatches;
M12-outline-order KILLED city outlines: compared 616 values, 5 mismatches;city renderer: compared 27035 values, 61 mismatches;
M13-city-lift KILLED legacy: compared 992 values, 34 mismatches;city renderer: compared 27035 values, 392 mismatches;
M14-era-threshold KILLED city renderer: compared 26954 values, 4265 mismatches;
M15-insert-front KILLED city renderer: compared 16390 values, 5049 mismatches;
M16-fog-player KILLED city renderer: compared 27000 values, 15 mismatches;
M17-ku-srodkowi KILLED city renderer: compared 27035 values, 154 mismatches;city models: compared 192347 values, 1685 mismatches;
M18-inner-scale KILLED city renderer: compared 27035 values, 245 mismatches;city models: compared 192347 values, 4845 mismatches;
M19-settlement-era KILLED city models: compared 191843 values, 969 mismatches;
M20-visible-default KILLED city renderer: compared 26297 values, 136 mismatches;
M21-quat-platform SURVIVED
M22-hexloop-trig SURVIVED
M23-hexloop-radius KILLED city outlines: compared 616 values, 35 mismatches;city renderer: compared 27035 values, 305 mismatches;
M24-wallring-reverse KILLED city models: compared 192347 values, 380 mismatches;
M25-terrain-top-style KILLED legacy: compared 992 values, 34 mismatches;city renderer: compared 27035 values, 500 mismatches;
```
23/25 zabitych; przeżyły M21 i M22 — obie równoważne (uzasadnienie §5; M22 dotyczy teraz funkcji z `core`, którą temat tylko wywołuje). Po skrypcie drzewo robocze czyste.

### 10.2 Surowe logi bramek r2 (commit `786cacdd`, czysty `CARGO_TARGET_DIR`, skrypt §8.4 bez linii `rev-parse`; HEAD = `786cacdd5d5114051c6c071b7f3af16e2d551a3e`)

```
$ cargo fmt --all -- --check
EXIT=0
$ cargo clippy --locked --all-targets -- -D warnings
    Checking pollster v0.4.0
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-3/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 6.32s
EXIT=0
$ cargo clippy --locked --all-targets --features gpu -- -D warnings
   Compiling proc-macro2 v1.0.107
   Compiling quote v1.0.47
   Compiling unicode-ident v1.0.27
    Checking cfg-if v1.0.5
   Compiling cfg_aliases v0.2.2
    Checking foldhash v0.2.0
   Compiling libm v0.2.16
    Checking equivalent v1.0.3
   Compiling autocfg v1.5.1
   Compiling thiserror v2.0.21
    Checking hashbrown v0.17.1
   Compiling num-traits v0.2.19
    Checking libloading v0.8.9
   Compiling zerocopy v0.8.63
    Checking log v0.4.34
   Compiling libc v0.2.191
   Compiling syn v3.0.9
   Compiling syn v2.0.119
    Checking indexmap v2.14.2
    Checking bitflags v2.13.2
    Checking rustc-hash v1.1.0
   Compiling naga v30.0.1
    Checking bit-vec v0.9.1
   Compiling parking_lot_core v0.9.12
   Compiling pkg-config v0.3.34
   Compiling ash v0.38.0+1.3.281
    Checking once_cell v1.21.4
    Checking unicode-width v0.2.2
    Checking codespan-reporting v0.13.1
   Compiling wayland-sys v0.31.11
    Checking bit-set v0.10.0
    Checking spirv v0.4.0+sdk-1.4.341.0
    Checking allocator-api2 v0.2.21
    Checking smallvec v1.16.3
   Compiling thiserror-impl v2.0.21
   Compiling bytemuck_derive v1.12.1
    Checking scopeguard v1.2.0
   Compiling khronos-egl v6.0.0
    Checking static_assertions v1.1.0
    Checking raw-window-handle v0.6.2
    Checking arrayvec v0.7.8
    Checking lock_api v0.4.14
   Compiling zerocopy-derive v0.8.63
    Checking naga-types v30.0.1
    Checking hashbrown v0.16.1
    Checking bytemuck v1.25.2
    Checking dlib v0.5.3
    Checking wgpu-types v30.0.1
   Compiling wgpu-hal v30.0.1
    Checking presser v0.3.1
    Checking parking_lot v0.12.5
    Checking ordered-float v5.4.0
    Checking profiling v1.0.18
    Checking glow v0.17.0
    Checking renderdoc-sys v1.1.0
   Compiling wgpu-core v30.0.1
   Compiling litrs v1.0.1
   Compiling wgpu v30.0.1
   Compiling document-features v0.2.12
    Checking half v2.7.1
    Checking gpu-allocator v0.28.0
    Checking wgpu-naga-bridge v30.0.1
    Checking wgpu-core-deps-windows-linux-android v30.0.1
    Checking civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-3/rust-port/renderer)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 35.78s
EXIT=0
$ cargo test --locked --all-targets
   Compiling pollster v0.4.0
   Compiling civ-renderer v0.1.0 (/home/user/The-Game/.claude/worktrees/wf_33be5035-445-3/rust-port/renderer)
    Finished `test` profile [unoptimized + debuginfo] target(s) in 11.83s
     Running unittests src/lib.rs (<scratch>/tgt/debug/deps/civ_renderer-3390857ab33a1fe3)

running 10 tests
test core::jsnum::tests::to_fixed3_matches_node ... ok
test jsmath::words::tests::scalbn_is_exact_power_of_two_scaling ... ok
test core::jsnum::tests::to_uint32_matches_ecmascript ... ok
test jsmath::words::tests::words_round_trip ... ok
test models::cities::model::tests::number_to_string_follows_ecma ... ok
test models::cities::renderer::tests::owner_color_and_civ_follow_js_remainder ... ok
test models::cities::renderer::tests::terrain_top_y_matches_inline_formula_bitwise ... ok
test models::wonders::builders::tests::grey_matches_hand_computation ... ok
test models::wonders::builders::tests::registry_covers_the_19_ids_and_defaults_the_rest ... ok
test models::wonders::renderer::tests::default_owner_color_follows_js_remainder ... ok

test result: ok. 10 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/assets_nturns.rs (<scratch>/tgt/debug/deps/assets_nturns-8f7d0ea4505dd8a8)

running 6 tests
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[new game] after dropping game 1: live=0 live_bytes=0 fake_gpu_live=0
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn 50 violations: live buffer: baseline=164 current=590 allowed=164; live bind_group: baseline=27 current=98 allowed=27; live bytes: baseline=4953088 current=6179968 allowed=4953088
[LeakM1 small 40x25] turn 200 violations: live buffer: baseline=164 current=2414 allowed=164; live bind_group: baseline=27 current=402 allowed=27; live bytes: baseline=4953088 current=11433088 allowed=4953088
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[Fixed small 40x25] budget OK at turns [50, 200]
[LeakM2 small 40x25] turn= 10 buffer=36 texture=67 pipeline=3 bind_group=9 live_bytes=5543168 subscriptions=1 created=187 destroyed=72
test new_game_frees_everything_and_restarts_identically ... ok
[LeakM2 small 40x25] turn= 50 buffer=36 texture=306 pipeline=3 bind_group=9 live_bytes=9458944 subscriptions=1 created=712 destroyed=358
[Fixed large 96x60] turn= 10 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=637 destroyed=434
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
test leak_m3_also_retains_battle_scene_resources ... ok
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[LeakM2 small 40x25] turn=200 buffer=36 texture=1206 pipeline=3 bind_group=9 live_bytes=24204544 subscriptions=1 created=2760 destroyed=1506
[Fixed large 96x60] turn= 50 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=2337 destroyed=2134
[LeakM2 small 40x25] turn 50 violations: live texture: baseline=67 current=306 allowed=67; live bytes: baseline=5543168 current=9458944 allowed=5543168
[LeakM2 small 40x25] turn 200 violations: live texture: baseline=67 current=1206 allowed=67; live bytes: baseline=5543168 current=24204544 allowed=5543168
[LeakM3 small 40x25] turn= 10 buffer=68 texture=9 pipeline=3 bind_group=11 live_bytes=6722816 subscriptions=5 created=187 destroyed=96
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM3 small 40x25] turn= 50 buffer=196 texture=17 pipeline=3 bind_group=19 live_bytes=15373568 subscriptions=21 created=712 destroyed=477
[Fixed small 40x25] turn= 10 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=187 destroyed=132
[Fixed small 40x25] turn= 50 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=712 destroyed=657
[Fixed small 40x25] turn=200 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=2760 destroyed=2705
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM3 small 40x25] turn=200 buffer=676 texture=47 pipeline=3 bind_group=49 live_bytes=47813888 subscriptions=81 created=2760 destroyed=1985
[LeakM3 small 40x25] turn 50 violations: live buffer: baseline=68 current=196 allowed=68; live texture: baseline=9 current=17 allowed=9; live bind_group: baseline=11 current=19 allowed=11; live bytes: baseline=6722816 current=15373568 allowed=6722816; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 small 40x25] turn 200 violations: live buffer: baseline=68 current=676 allowed=68; live texture: baseline=9 current=47 allowed=9; live bind_group: baseline=11 current=49 allowed=11; live bytes: baseline=6722816 current=47813888 allowed=6722816; subscriptions: baseline=5 current=81 allowed=5
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 10 buffer=714 texture=25 pipeline=3 bind_group=106 live_bytes=7547008 subscriptions=1 created=1126 destroyed=278
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[LeakM1 small 40x25] turn= 10 buffer=164 texture=7 pipeline=3 bind_group=27 live_bytes=4953088 subscriptions=1 created=299 destroyed=98
[LeakM1 small 40x25] turn= 50 buffer=590 texture=7 pipeline=3 bind_group=98 live_bytes=6179968 subscriptions=1 created=1187 destroyed=489
[LeakM1 large 96x60] turn= 50 buffer=2502 texture=25 pipeline=3 bind_group=404 live_bytes=12696448 subscriptions=1 created=4324 destroyed=1390
[Fixed large 96x60] turn=200 buffer=148 texture=25 pipeline=3 bind_group=27 live_bytes=5805056 subscriptions=1 created=8826 destroyed=8623
[LeakM1 small 40x25] turn=200 buffer=2414 texture=7 pipeline=3 bind_group=402 live_bytes=11433088 subscriptions=1 created=4785 destroyed=1959
[Fixed large 96x60] budget OK at turns [50, 200]
test simulation_is_deterministic ... ok
test fixed_registry_stays_within_budget_after_10_50_200_turns ... ok
[LeakM1 large 96x60] turn=200 buffer=9552 texture=25 pipeline=3 bind_group=1579 live_bytes=33000448 subscriptions=1 created=16718 destroyed=5559
[LeakM1 large 96x60] turn 50 violations: live buffer: baseline=714 current=2502 allowed=714; live bind_group: baseline=106 current=404 allowed=106; live bytes: baseline=7547008 current=12696448 allowed=7547008
[LeakM1 large 96x60] turn 200 violations: live buffer: baseline=714 current=9552 allowed=714; live bind_group: baseline=106 current=1579 allowed=106; live bytes: baseline=7547008 current=33000448 allowed=7547008
[LeakM2 large 96x60] turn= 10 buffer=148 texture=265 pipeline=3 bind_group=27 live_bytes=9737216 subscriptions=1 created=637 destroyed=194
[LeakM2 large 96x60] turn= 50 buffer=148 texture=1224 pipeline=3 bind_group=27 live_bytes=25449472 subscriptions=1 created=2336 destroyed=934
[rebuild 1000 cycles] start: turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55 destroyed=0
[rebuild 1000 cycles] end:   turn=  0 buffer=36 texture=7 pipeline=3 bind_group=9 live_bytes=4560128 subscriptions=1 created=55055 destroyed=55000
test rebuild_in_place_1000_cycles_returns_to_initial_state ... ok
[LeakM2 large 96x60] turn=200 buffer=148 texture=4815 pipeline=3 bind_group=27 live_bytes=84284416 subscriptions=1 created=8817 destroyed=3824
[LeakM2 large 96x60] turn 50 violations: live texture: baseline=265 current=1224 allowed=265; live bytes: baseline=9737216 current=25449472 allowed=9737216
[LeakM2 large 96x60] turn 200 violations: live texture: baseline=265 current=4815 allowed=265; live bytes: baseline=9737216 current=84284416 allowed=9737216
[LeakM3 large 96x60] turn= 10 buffer=180 texture=27 pipeline=3 bind_group=29 live_bytes=7967744 subscriptions=5 created=637 destroyed=398
[LeakM3 large 96x60] turn= 50 buffer=308 texture=35 pipeline=3 bind_group=37 live_bytes=16618496 subscriptions=21 created=2337 destroyed=1954
[LeakM3 large 96x60] turn=200 buffer=788 texture=65 pipeline=3 bind_group=67 live_bytes=49058816 subscriptions=81 created=8826 destroyed=7903
[LeakM3 large 96x60] turn 50 violations: live buffer: baseline=180 current=308 allowed=180; live texture: baseline=27 current=35 allowed=27; live bind_group: baseline=29 current=37 allowed=29; live bytes: baseline=7967744 current=16618496 allowed=7967744; subscriptions: baseline=5 current=21 allowed=5
[LeakM3 large 96x60] turn 200 violations: live buffer: baseline=180 current=788 allowed=180; live texture: baseline=27 current=65 allowed=27; live bind_group: baseline=29 current=67 allowed=29; live bytes: baseline=7967744 current=49058816 allowed=7967744; subscriptions: baseline=5 current=81 allowed=5
test each_leak_pattern_breaks_the_budget ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.07s

     Running tests/assets_registry.rs (<scratch>/tgt/debug/deps/assets_registry-c3f9969dbcf4ae07)

running 14 tests
test budget_thresholds_are_configurable ... ok
test drop_and_clone_inside_with_are_deferred_not_panicking ... ok
test cache_lru_by_entries_and_bytes ... ok
test handle_from_another_registry_is_rejected ... ok
test live_report_lists_labels ... ok
test cache_end_of_turn_trims_only_unreferenced_entries ... ok
test owned_guards_count_references ... ok
test owned_replace_creates_new_before_freeing_old_and_keeps_shared_old ... ok
test reference_counting_frees_on_last_release ... ok
test registry_replace_creates_new_before_freeing_old ... ok
test scope_releases_everything_it_created_on_drop ... ok
test stale_handle_is_an_error_not_a_panic ... ok
test subscriptions_unregister_on_drop ... ok
test subscription_dropped_inside_callback_is_removed_after_emit ... ok

test result: ok. 14 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/camera_web_parity.rs (<scratch>/tgt/debug/deps/camera_web_parity-ed19813f9fcbbf13)

running 5 tests
test frame_at_60_fps_is_exactly_one_web_frame ... ok
test pan_scales_with_dt_and_long_frames_are_capped ... ok
test drag_and_wheel_do_not_depend_on_dt ... ok
test camera_controller_matches_web_100_percent ... ok
test fixture_covers_every_branch ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.04s

     Running tests/cities_web_parity.rs (<scratch>/tgt/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
test layout_constants_and_types_match_web ... ok
test legacy_city_model_matches_web ... ok
test city_map_outlines_match_web ... ok
test city_renderer_matches_web ... ok
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.47s

     Running tests/core_web_parity.rs (<scratch>/tgt/debug/deps/core_web_parity-27c98cd457a8290f)

running 8 tests
test hex_shape_matches_web ... ok
test fog_dim_matches_web ... ok
test hexutil_matches_web ... ok
test map_style_matches_web ... ok
test zoom_lod_matches_web ... ok
test vitals_match_web ... ok
test merge_decor_matches_web ... ok
test bronze_city_types_match_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/cpu_sanity.rs (<scratch>/tgt/debug/deps/cpu_sanity-0295d7bf5a63866f)

running 1 test
test gpu_feature_readback_matches_build_configuration ... ok

test result: ok. 1 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/decor_web_parity.rs (<scratch>/tgt/debug/deps/decor_web_parity-faad5ae118a41e5c)

running 8 tests
test decor_reuses_core_instead_of_copies ... ok
test decor_uses_jsmath_not_platform_libm ... ok
test hex_hash_functions_match_web ... ok
test river_lod_matches_web ... ok
test shared_geometries_are_bit_identical_to_web ... ok
test coast_builders_are_bit_identical_to_web ... ok
test relief_surface_height_matches_web ... ok
test builders_are_bit_identical_to_web ... ok

test result: ok. 8 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.53s

     Running tests/geom_three_parity.rs (<scratch>/tgt/debug/deps/geom_three_parity-0f596b3cbdb71744)

running 17 tests
test index_buffer_covers_non_indexed_meshes ... ok
test merge_rejects_mixed_indexing ... ok
test parity_circle ... ok
test parity_curve ... ok
test parity_cone ... ok
test parity_extrude ... ok
test parity_box ... ok
test parity_plane ... ok
test parity_ops ... ok
test parity_cylinder ... ok
test parity_shape ... ok
test parity_ring ... ok
test parity_tube ... ok
test trs_matches_manual_composition ... ok
test parity_polyhedron ... ok
test parity_torus ... ok
test parity_sphere ... ok

test result: ok. 17 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.02s

     Running tests/gpu_probe.rs (<scratch>/tgt/debug/deps/gpu_probe-b90f27ad8c898393)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/improvements_web_parity.rs (<scratch>/tgt/debug/deps/improvements_web_parity-7642b2e4c63525aa)

running 3 tests
test prototype_keys_documented_deviation ... ok
test data_tables_match_web ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.69s

     Running tests/jsmath_v8_parity.rs (<scratch>/tgt/debug/deps/jsmath_v8_parity-fee50190cb35806f)

running 13 tests
test compatibility_paths_are_the_same_functions ... ok
test atan_matches_v8 ... ok
test acos_matches_v8 ... ok
test cos_matches_v8 ... ok
test hypot_three_arguments_matches_v8 ... ok
test atan2_matches_v8 ... ok
test exp_matches_v8 ... ok
test hypot_matches_v8 ... ok
test pow_matches_v8 ... ok
test whole_domain_without_platform_fallback ... ok
test log_matches_v8 ... ok
test sin_matches_v8 ... ok
test tan_matches_v8 ... ok

test result: ok. 13 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.03s

     Running tests/jsmath_wiring.rs (<scratch>/tgt/debug/deps/jsmath_wiring-b0f96cca402d817c)

running 6 tests
test pick_hex_prism_vertices_use_v8_trig ... ok
test scanner_catches_known_bypass_forms ... ok
test pick_quat_from_euler_xyz_uses_v8_trig ... ok
test terrain_rotation_uses_v8_trig ... ok
test geom_rotation_and_euler_use_v8_trig ... ok
test no_platform_transcendentals_anywhere_in_src ... ok

test result: ok. 6 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.16s

     Running tests/pick_golden.rs (<scratch>/tgt/debug/deps/pick_golden-5edd88b94adda948)

running 7 tests
test js_round_matches_math_round ... ok
test client_rect_to_ndc_matches_web ... ok
test prism_geometry_is_bitwise_three_cylinder ... ok
test world_to_axial_both_variants_match_web ... ok
test terrain_scene_instances_are_bitwise_web ... ok
test camera_matrices_and_rays_are_bitwise_three ... ok
test golden_picks_match_web_100_percent ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 1.36s

     Running tests/terrain_web_parity.rs (<scratch>/tgt/debug/deps/terrain_web_parity-7ed099e492a012e9)

running 5 tests
test js_pow_special_cases_follow_v8 ... ok
test fog_hides_unknown_and_dims_explored ... ok
test color_math_matches_three ... ok
test terrain_build_matches_web ... ok
test terrain_fog_matches_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.21s

     Running tests/unit_core_json.rs (<scratch>/tgt/debug/deps/unit_core_json-b55ab56d4e2236c3)

running 0 tests

test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.00s

     Running tests/unit_core_model_rule.rs (<scratch>/tgt/debug/deps/unit_core_model_rule-2f5305891471a8dc)

running 7 tests
test pending_registry_is_explicit ... ok
test table_equals_the_legacy_pl_route_and_names_never_matter ... ok
test unknown_type_falls_back_to_category_with_a_warning ... ok
test rule_table_covers_exactly_the_77_unit_types ... ok
test legacy_en_path_reproduces_exactly_the_three_web_divergences ... ok
test norm_name_and_culture_match_the_web ... ok
test web_signature_classes_equal_rust_model_id_classes ... ok

test result: ok. 7 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.24s

     Running tests/unit_core_trig.rs (<scratch>/tgt/debug/deps/unit_core_trig-30b01be29ad89d90)

running 2 tests
test quat_from_euler_honours_every_order ... ok
test js_trig_matches_v8_bit_for_bit_and_libm_does_not ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.01s

     Running tests/unit_core_web_parity.rs (<scratch>/tgt/debug/deps/unit_core_web_parity-eb9ca6d0cfd9b82c)

running 3 tests
test signature_is_sensitive_to_owner_colour_and_pose ... ok
test part_catalogues_match_the_web_singletons ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.32s

     Running tests/units_kamien_web_parity.rs (<scratch>/tgt/debug/deps/units_kamien_web_parity-94e8e4a61ab4daac)

running 5 tests
test routing_no_longer_returns_not_yet_ported_for_the_stone_package ... ok
test asin_matches_v8 ... ok
test the_ten_records_cover_every_mod05_builder_and_counts_match_the_web ... ok
test unit_core_record_signatures_of_the_stone_records_match ... ok
test every_web_case_is_reproduced_bit_for_bit ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.33s

     Running tests/wonders_web_parity.rs (<scratch>/tgt/debug/deps/wonders_web_parity-d8d9a630ca3a6684)

running 4 tests
test renderer_scenario_is_bit_identical_to_web ... ok
test js_trig_is_bit_identical_to_v8 ... ok
test registry_matches_web_ids ... ok
test models_are_bit_identical_to_web ... ok

test result: ok. 4 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.15s

EXIT=0
$ cargo test --locked --test cities_web_parity -- --nocapture
    Finished `test` profile [unoptimized + debuginfo] target(s) in 0.04s
     Running tests/cities_web_parity.rs (<scratch>/tgt/debug/deps/cities_web_parity-b32fe1be50768412)

running 5 tests
layout: compared 57 values, 0 mismatches
test layout_constants_and_types_match_web ... ok
city outlines: compared 616 values, 0 mismatches
legacy: compared 992 values, 0 mismatches
test legacy_city_model_matches_web ... ok
test city_map_outlines_match_web ... ok
city renderer: compared 27035 values, 0 mismatches
test city_renderer_matches_web ... ok
families: {"braz": 220, "braz_grecja": 3, "braz_grecja_default": 1, "braz_rzym": 3, "braz_rzym_default": 1, "ghost_braz": 287, "ghost_braz_default_walls": 1, "ghost_kamien": 286, "ghost_kamien_default_walls": 1, "ghost_kamien_uni": 24, "ghost_kamien_uni_default_walls": 1, "kamien": 72, "kamien_default": 1, "palisada": 3, "settlement": 144}
city models: compared 192347 values, 0 mismatches
test city_models_match_web ... ok

test result: ok. 5 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 2.48s

EXIT=0
```
