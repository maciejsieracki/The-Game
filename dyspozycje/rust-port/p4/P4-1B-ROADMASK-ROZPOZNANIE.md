# P4-1B — rozpoznanie przed producentem `MapViewDto` (roadMask, trim rzek, river_render_paths)

**Temat:** `R-RUSTPORT-P4-1B-ROADMASK-ROZP-Q1` · **Domena:** GAME (DTO renderera) · **Rola:** Operator r1 · **Tylko odczyt, zero zmian kodu.**
**Baza:** `f7baa3848` (drzewo Rust). **Web:** pin `07d2fbd72`, czytany przez `git show 07d2fbd72:gra/src/...`; niżej ścieżki webu bez prefiksu `gra/src/`.
**Decyzja wejściowa:** D-DTO-4 = A (silnik liczy `roadMask` i trasy rzek do renderu). Źródło: `dyspozycje/rust-port/p4/D-DTO-4-D-DTO-10-DECYZJE.md` na `origin/claude/rust-sivvrn`.
**Legenda:** `plik:linia`; **BRAK** = sprawdzone `grep`, w Rust nie ma; **NIE_ZMIERZONO** = nie sprawdzone, bez wniosku.

---

## 1. Tabela funkcji: pin → wejścia → wyjście → odpowiednik Rust

### 1.1 Maska dróg (`roadMask`)

| Funkcja pinu | Wejścia | Wyjście | Rust (f7baa3848) |
|---|---|---|---|
| `ROAD_DIRS` — `map/road-network.ts:32-34`: `[+1,0],[+1,-1],[0,-1],[-1,0],[-1,+1],[0,+1]`; indeks = numer bitu | — | stała | silnik: **BRAK** jako stała drogowa. Ta sama kolejność istnieje jako `HEX_DIRECTIONS: [(i32,i32);6]` w `engine/src/domain/mapgen/prims.rs:32` (web `HEX_DIRECTIONS`, `map/gen-helpers.ts:125-128`, identyczna kolejność — komentarz pinu `road-network.ts:26-30` mówi, że test pilnuje zgodności). Renderer: `ROAD_DIRS: [(f64,f64);6]` w `renderer/src/models/improvements/droga.rs:21-29` |
| `computeRoadMask(q, r, hasRoadAt)` — `map/road-network.ts:75-86` | `q, r: number`; predykat `hasRoadAt(q, r) → boolean` | `number`, bity 0..5 (`0..=0x3F`), bit `i` = sąsiad `(q,r)+ROAD_DIRS[i]` ma drogę | **BRAK** (`grep -rn "fn compute_road_mask" rust-port` → 0) |
| `hexHasRoadAt(q, r)` — `main.ts:3144-3147` (integrator) | `map.hexes[keyOf(q,r)]` | `false` dla heksa spoza mapy (brak klucza), inaczej `hexHasRoad(hex)` | **BRAK** jako funkcja na mapie gry; składnik niżej jest |
| `hexHasRoad(hex)` — `map/road-movement.ts:64-67` | `hex.ulepszenie`, `hex.ulepszenia` | `improvementKeysForHex(hex).some(isRoadImprovementKey)` | `engine/src/domain/roads.rs:46` (`&HexLike`) oraz `engine/src/domain/improvement_build.rs:1001` (`&BuildHex`) |
| `isRoadImprovementKey(key)` — `map/road-movement.ts:59-61` | klucz | `'droga' \|\| 'droga_brukowana'` | `roads.rs:40` (nazwy z parametrów `ruch_jednostek_params().teren`) |
| `improvementKeysForHex(hex)` — `game/terrain-improvements.ts:358-379` | `ulepszenie`, `ulepszenia` | lista kluczy bez duplikatów | `engine/src/domain/improvements.rs:1021` (komentarz cytuje `:302` starszego pinu). Szybka ścieżka pinu `:365-369` (`''`/`null`/`'brak'` → `[]`) jest równoważna wynikowi `normalize_improvement_key` (`improvements.rs:696-700`: puste i `"brak"` → `None`) — równoważność z kodu, wektorami **NIE_ZMIERZONO** na tym pinie |
| `roadHexesToRefresh(q, r, hasRoadAt)` — `map/road-network.ts:170-182` | jw. | `[(q,r)] + sąsiedzi z drogą` | **BRAK**. Dla producenta zbędne: `hexState` jest pełnym zrzutem (wszystkie heksy), więc maskę liczy się dla każdego heksa. Może posłużyć tylko do zbioru „brudnych” heksów przy przyroście — poza P4-1B |
| `roadMaskArms` / `roadMaskHasNode` / `roadMaskIsLonePatch` — `road-network.ts:89-127` | maska | geometria ramion | renderer: `droga.rs:45-62` (zostaje w rendererze, to rysowanie) |

Wołający maskę w pinie: `main.ts:15836` (duch budowy — maska heksa, który drogi **jeszcze nie ma**) i `main.ts:17083` (siatka ulepszenia). Oba wołają z `hexHasRoadAt` na prawdziwym stanie heksów, bez filtra mgły.

### 1.2 Trasy rzek do renderu (`river_render_paths`)

Łańcuch w pinie, `render/scene.ts` (przy budowie sceny):
1. `scene.ts:2873-2877`: `paths = map.riverPaths ?? []`, `pathKinds = map.riverPathKinds ?? paths.map(() => 'main')`; filtr etapu `filterRiverPathsForStage` (`:1534-1557`, domyślny etap `2` = `main`+`medium`, `getRiverRenderStage` `:1516-1532`).
2. `scene.ts:1306`: `mainPathsForJunction = paths.filter((_, i) => (kinds[i] ?? 'main') === 'main')`.
3. `scene.ts:1313-1318`: dla `kind === 'medium'` → `trimMediumRenderPathAtMain(path, mainPathsForJunction)`, potem `mediumRiverRenderPath`; dla pozostałych (w tym `kind` brak = `'main'`) → `landRiverRenderPath(path)`.
4. Rysowanie (zostaje w rendererze): filtry `path.length < 2` / `> 512` (`:1310-1311`), `landPath.length < 2` / `> 480` (`:1319-1320`), `widthMul` z `landPath.length` (`:1322-1330`), `pathReachesOpenSeaRender(map, path)` na **surowej** ścieżce (`:1333`, def. `:604-612`).

**Drugi konsument `riverPaths`/`riverPathKinds` w renderze (informacja dla P4-1G, obrona r1, Z4):** `render/mapRenderStyle.ts:1361-1370` `computeRiverDeltaHexKeys(map, maxHexes = 3)` — `kinds = map.riverPathKinds ?? paths.map(() => 'main')`, delta (wachlarz heksów `Wybrzeże` u ujścia) **wyłącznie** dla tras `(kinds[pi] ?? 'main') === 'main'`, które kończą się w morzu: `pathReachesOpenSea(map, path)` (`:1339`) i `findRiverMouthWybrzeze(map, path)` (`:1287`) liczone na **surowej** ścieżce `riverPaths[pi]`, nie na `river_render_paths`. Wołający: `render/scene.ts:2094` (tylko `renderStyle === 'roblox'`). Wniosek dla producenta: `MapViewDto.rivers[i]` musi nieść surowe `hexes` i `kind` (z `None` → `main` po stronie konsumenta albo jawnie), bo delty nie da się odtworzyć z przyciętych tras. Kolejne odczyty surowych tras w renderze: `mapRenderStyle.ts:76` (liczba tras) i `:1722` (pętla po `map.riverPaths`) — ich przeznaczenia w tym rozpoznaniu **NIE_ZMIERZONO** (P4-1G).

| Funkcja pinu | Wejścia | Wyjście | Rust (f7baa3848) |
|---|---|---|---|
| `trimMediumRenderPathAtMain(path, mainPaths)` — `map/gen-helpers.ts:8194-8203` | ścieżka `medium`; wszystkie ścieżki `main` | ścieżka bez ogona wzdłuż `main`; buduje `mainKeys` = zbiór `"q,r"` wszystkich heksów `main` | **BRAK** (`grep -rn "trim_medium" rust-port` → 0) |
| `trimMediumTailAlongMain(path, mainKeys)` — `map/gen-helpers.ts:7623-7634` (prywatna) | ścieżka; `Set<"q,r">` | dopóki `len ≥ 3` i **ostatni oraz przedostatni** heks są w `mainKeys` → `pop()`; `len < 3` lub pusty `mainKeys` → bez zmian (kopia) | **BRAK**. Używana też przez generator: `finalizeMediumPath` `gen-helpers.ts:8148`; moduł Rust `mapgen/rivers_c.rs` (dopływy średnie) to pusty szkielet M00 (`rivers_c.rs:1`) |
| `landRiverRenderPath(hexes, path)` — `map/gen-helpers.ts:5411-5426` | `hexes` (`terenBazowy`), ścieżka | prefiks lądu do pierwszego `Morze`/`PlytkieMorze` lub brakującego heksa; `< 2` → zwraca prefiks; inaczej `sanitizeRiverPath`, a gdy nie sąsiaduje — `repairRiverPathAdjacency` | `engine/src/domain/mapgen/rivers_a.rs:397` (+ `finish_render_path` `:410-420`) |
| `mediumRiverRenderPath(hexes, path)` — `gen-helpers.ts:5445-5459` | jw. | tylko heksy `isRiverLandTerrain` (pomija wodę w środku), dalej jak wyżej | `rivers_a.rs:436` |
| `sanitizeRiverPath` — `gen-helpers.ts:5590-5604` | ścieżka | bez powtórzeń heksa i kroków niesąsiednich | `rivers_a.rs:260` |
| `assertRiverPathAdjacent` — `gen-helpers.ts:5550-5562` | ścieżka | czy każdy krok ma dystans 1 | `rivers_a.rs:224` |
| `repairRiverPathAdjacency(path, hexes, sourceKey)` — `gen-helpers.ts:5618-5655` | ścieżka, `hexes`, klucz źródła | uzupełnione luki (zachłannie, `guard < 64`), potem `sanitizeRiverPath` | `rivers_a.rs:317` |
| `canRiverFlowThrough` — `gen-helpers.ts:6012-6027` | heks, klucz, źródło (+ flagi domyślne `false`) | `Morze` → nie; teren reliefu → tylko źródło | `rivers_a.rs:295` |
| `isWaterTerrainLocal` — `gen-helpers.ts:152-154` | teren | `Morze \|\| PlytkieMorze` | `mapgen/prims.rs:346`, `mapgen/landsea.rs:53` |
| `isRiverLandTerrain` — `gen-helpers.ts:7005-7013` | teren | Łąka/Równina/Wzgórza/Góry/Pustynia/Polarny | `rivers_a.rs:120` (`pub(crate)`) |
| `hexAxialDistance` | — | — | port w `rivers_a`/`prims` (używany przez powyższe) |

**Zgodność pinów.** Port `rivers_a.rs` cytuje pin `edb8fb56` (`rivers_a.rs:1`). Porównałem treść funkcji między `edb8fb56` a `07d2fbd72` (`awk` od `function X(` do pierwszego `}` w kolumnie 0, `md5sum`): `landRiverRenderPath`, `mediumRiverRenderPath`, `sanitizeRiverPath`, `assertRiverPathAdjacent`, `repairRiverPathAdjacency`, `canRiverFlowThrough`, `isRiverLandTerrain`, `isWaterTerrainLocal`, `hexAxialDistance`, `trimMediumTailAlongMain`, `trimMediumRenderPathAtMain` — **wszystkie identyczne** (zmieniły się tylko numery linii, np. `landRiverRenderPath` 5261 → 5411). Testy wektorowe `engine/tests/p6_m07a_rivers_a.rs:213` (`landRender`, ≥100 niepustych) i `:223` (`mediumRender`) obowiązują więc także dla `07d2fbd72`. `isReliefTerrain` (wołana w `canRiverFlowThrough`, `gen-helpers.ts:5997` na `07d2fbd72`): ciało `return t === TerenBazowy.Gory || t === TerenBazowy.Wzgorza;`, md5 tą samą metodą `d072c38abbdcbf615efa3fca3e665ccd` na `edb8fb56` i na `07d2fbd72`, czyli **identyczne** (obrona r1, Z2).

### 1.3 Pozostałe pola pochodne `HexDynDto` (dla kompletu producenta)

| Pole | Pin | Rust |
|---|---|---|
| `terraces` | `improvementKeysForHex(hex)` zawiera `'tarasy'` (`render/scene.ts:2465`); integrator `main.ts:17076` sprawdza `layers.includes('tarasy')` na `mergedImprovementLayers` (`main.ts:3126-3137`: klucze heksa + warstwa ze złoża zwierząt + `placedImprovements`) | `improvements.rs:1021` + `contains("tarasy")`. Składnik ze złoża nie daje `tarasy`: `foodLayerFromAnimalDeposit` (`game/terrain-improvements.ts:349-353`) zwraca tylko `'bydlo'`, `'owce'` albo `null`. Jedyna niepewność to `placedImprovements` (`main.ts:3132-3135`) — czy może zawierać `tarasy` bez pól heksa: **NIE_ZMIERZONO** (komentarz `main.ts:3140-3142` mówi, że `placedImprovements` jest synchronizowane z polami heksa) |
| `covering_improvement` | `hexHasCoveringTerrainImprovement` — `game/terrain-improvements.ts:388-392` | `improvements.rs:1049` |

---

## 2. Wejścia, których producent `MapViewDto` / `HexDynDto` potrzebuje z modelu mapy

| Wejście | Typ webu | Po co | Gdzie jest w Rust (f7baa3848) |
|---|---|---|---|
| `szerokoscQ`, `wysokoscR`, `seed` | `number` | `width`, `height`, `seed` | `SnapshotMap.szerokosc_q/wysokosc_r/seed: f64` (`map_snapshot.rs:174-181`); `PlayableMap.width/height: u16` (`playable.rs:270-273`, bez seeda) |
| `hexes[].coords` | `{q,r}` | kolejność `r`-major (§1.4 kontraktu), klucz `"q,r"` dla `hasRoadAt` i `hexes[...]` | `SnapshotHex.coords` (`i32`); `MapHex.coords` (`mapgen/types.rs:155-160`); `PlayableTile.position` |
| `hexes[].terenBazowy` | 8 wariantów `TerenBazowy` | `HexStaticDto.teren_bazowy`; land/medium (woda vs ląd rzeki), `canRiverFlowThrough` (Morze, relief) | `MapHex.teren_bazowy: TerenBazowy` (8 wariantów, `types.rs:32`); `SnapshotHex.teren_bazowy: String`; `TerrainHex.terrain` (`mapgen::Terrain`, `terrain_class.rs:289-300`) — wejście `rivers_a`. `PlayableTile.terrain` ma tylko 4 warianty (`playable.rs:247-252`) — **niewystarczające** |
| `hexes[].rzeka.krawedzie` | `number[]` | `HexStaticDto.rzeka_krawedzie` | `MapHex.rzeka` (`RzekaInfo`, `types.rs:120`); `SnapshotHex.rzeka.krawedzie: Vec<i32>` |
| `hexes[].ulepszenie`, `HexExt.ulepszenia` | enum / `string[] \| null` | `roadMask` (wszyscy sąsiedzi), `terraces`, `covering_improvement`, pola `HexDynDto` | `PlayableMap.improvements: Vec<PlayableHexImprovement>` (`playable.rs:277-291`, `Option<String>` / `Option<Vec<String>>`, wpis tylko dla heksów z polami); `SnapshotHex.ulepszenie/ulepszenia`; `BuildHex.ulepszenie/ulepszenia` (`improvement_build.rs:152-165`). Do reguł potrzebny `HexLike` (`improvements.rs:646-653`) |
| `hexes[].nakladka`, `HexExt.zloze`, `improvementKey`, `wioska.istnieje` | — | pola `HexDynDto` (nie dotyczą maski ani rzek) | `MapHex.nakladka`, `MapHex.wioska`; `SnapshotHex.zloze/improvement_key` |
| `riverPaths` | `{q,r}[][]` | `rivers[i].hexes`, wejście trimu i land/medium | `SnapshotMap.river_paths: Vec<Vec<RiverPoint>>` (`i32`); `BuildMap.river_paths: Vec<Vec<(i32,i32)>>` (`improvement_build.rs:206`). Generator Rust ich nie produkuje. Stan modułów: `rivers_a` (+ podmoduł `rivers_a/`) — port funkcji pomocniczych i renderu tras; `rivers_b` — plik `rivers_b.rs` z nagłówkiem szkieletu M00 i podmodułem `rivers_b/` (11 plików: `astar`, `trace`, `sources` i in.), bez orkiestracji `generateRivers`; szkielety M00 (3 linie komentarza, zero kodu): `rivers_c.rs`, `rivers_d.rs`, `rivers_e1.rs`, `rivers_e2.rs`, `generate.rs` |
| `riverPathKinds` | `('main'\|'medium'\|'short'\|'tributary')[] \| undefined` | `rivers[i].kind`; wybór trim/medium vs land; `mainPaths` | `SnapshotMap.river_path_kinds: Option<Vec<String>>`; `BuildMap` — **BRAK** pola |

**Wniosek kluczowy:** w drzewie `f7baa3848` nie ma jednego modelu mapy rozgrywki, który ma naraz `TerenBazowy` (8), rzeki z rodzajami i pola ulepszeń. `PlayableState.map` (`playable.rs:270-279`, pole `map` `:497`) ma uproszczony teren (4 warianty) i ulepszenia, ale **nie ma** `riverPaths`, `riverPathKinds`, `rzeka`, `nakladka`, `wioska`. Pełny zestaw ma tylko `SnapshotMap` (`map_snapshot.rs:174-181`, pola tekstowe, z zapisu). `MapHex` (M01-R2) ma typowany heks bez `HexExt` i bez rzek na poziomie mapy. Producent P4-1B musi więc dostać źródło mapy jako jawny parametr (np. `&SnapshotMap` albo nowy widok `MapSource`), a nie czytać `PlayableState`. Który model ma być właścicielem mapy rozgrywki — decyzja techniczna (zasada 9); w webie jest jeden `GameMap` (`types/map.ts`), więc parytet wymaga, by producent czytał te same pola, które web czyta. To rozpoznanie tego nie rozstrzyga.

Dodatkowe niezmienniki dla producenta (z pinu):
- `roadMask` liczony dla **każdego** heksa (także bez drogi — duch budowy, `main.ts:15833-15837`); sąsiad spoza mapy = brak drogi (`main.ts:3145-3146`); brak zawijania mapy (klucz `keyOf(q,r)` wprost).
- `river_render_paths.len() == rivers.len()`, indeks `i` ↔ `rivers[i]`; pusta lub jednoelementowa trasa dozwolona (renderer pomija `< 2`). `view-model/src/validate.rs` dziś tego nie sprawdza (`grep -n "river" view-model/src/validate.rs` → 0; `road_mask` sprawdzany zakresem w `validate.rs:243-249`).
- `kind` brak (`None`) = `'main'` przy wyborze land/trim (`scene.ts:1306`, `:1312`).
- `mainPaths` dla trimu = wszystkie ścieżki `main` (przy etapie ≥ 1 filtr etapu ich nie usuwa, więc liczenie w silniku bez filtra etapu daje ten sam wynik). Filtr etapu (`riverStage`) to ustawienie renderu — zostaje w rendererze (P4-1G), producent wysyła wszystkie trasy.
- Typy: `RiverCoord` w `rivers_a` ma `i64` i `HexRecord` z kluczem `String`; `view-model::HexCoord` ma `i32` (`view-model/src/ids.rs:184-189`). Producent potrzebuje adaptera `SnapshotMap`/model → `HexRecord` (`terrain_class.rs:318-345`, `TerrainHex` z `mapgen::Terrain`) i konwersji `i64 → i32`. Silnik już zależy od `civ-view-model` (`engine/Cargo.toml:11`).
- `MapViewDto` jest statyczny (D-DTO-3 = B). W pinie `terenBazowy` przypisuje się poza `map/` tylko w `game/playtestMiastoEkonomia.ts:96,107,114` (scenariusz testowy), a `riverPaths`/`riverPathKinds` nie są przypisywane poza `map/gen*` (`git grep` na pinie). Czy scenariusz playtestu wchodzi do portu — **NIE_ZMIERZONO**; poza nim trasy rzek można liczyć raz na start/wczytanie.

---

## 3. Propozycja podziału na wdrożenia (nie wdrażam)

Kolejność: Q1 i Q2 niezależne (równolegle), Q3 po obu.

### P4-1B-Q1 ROADMASK — `compute_road_mask` w silniku
- **Zakres:** stała `ROAD_DIRS: [(i32,i32);6]` (kolejność `road-network.ts:32-34`) i `compute_road_mask(q, r, has_road_at: impl Fn(i32,i32)->bool) -> u8` (port 1:1 `:75-86`); opcjonalnie `road_hexes_to_refresh` (`:170-182`).
- **Allowlista:** `rust-port/engine/src/domain/road_network.rs` (NOWY), `rust-port/engine/src/domain/mod.rs` (jedna linia `pub mod`), `rust-port/engine/tests/p4_1b_road_mask.rs` (NOWY), `rust-port/engine/tests/p4_1b_road_mask_vectors/` (NOWY: `gen.mjs` + `vectors.json`), `dyspozycje/autobot/runs/<ID>/**`.
- **Wektory:** generator Node na pinie wołający `computeRoadMask`/`roadHexesToRefresh` z `road-network.ts` (moduł czysty, `:19-22`): wszystkie 64 kombinacje sąsiadów + losowe mapy (≥ 200 heksów, ziarno stałe) z brzegami mapy (sąsiad poza mapą); test zgodności `ROAD_DIRS` silnika **wyłącznie** z `mapgen::prims::HEX_DIRECTIONS` (asercja w `engine/tests`). Porównania z rendererem w Q1 **nie ma**: `civ-engine` nie zależy od `civ-renderer` (`engine/Cargo.toml`: w `[dependencies]` tylko `serde`, `serde_json`, `tracing`, `civ-view-model`; `[dev-dependencies]` puste), a `Cargo.toml` nie jest w allowliście. Zgodność kolejności z `renderer/src/models/improvements/droga.rs:21-29` sprawdza test renderera w P4-1G (adapter DTO → renderer), np. przez porównanie z wektorami maski Q1 lub z kolejnością `view-model` (obrona r1, Z1). Mutacja: zamiana dwóch kierunków musi dać FAIL.

### P4-1B-Q2 RIVER-TRIM — `trim_medium_tail_along_main` i `trim_medium_render_path_at_main`
- **Zakres:** port 1:1 `gen-helpers.ts:7623-7634` i `:8194-8203` w module rzek; `trim_medium_tail_along_main` jako `pub(crate)`, bo przyszły `finalizeMediumPath` (M07C, `rivers_c.rs`) też go użyje.
- **Allowlista:** `rust-port/engine/src/domain/mapgen/rivers_a/render_trim.rs` (NOWY) + jedna linia `pub mod`/`pub use` w `rust-port/engine/src/domain/mapgen/rivers_a.rs`, `rust-port/engine/tests/p4_1b_river_trim.rs` (NOWY), `rust-port/engine/tests/p4_1b_river_trim_vectors/` (NOWY), `dyspozycje/autobot/runs/<ID>/**`. Nie dotyka `rivers_c.rs` (właściciel M07C).
- **Wektory:** generator na pinie (`trimMediumRenderPathAtMain` jest eksportowana); przypadki: `len < 3`, pusty `mainPaths`, ogon 0/1/2/≥3 heksów na `main`, tylko ostatni na `main`, tylko przedostatni na `main`, ścieżka cała na `main` (zostają 2 heksy), duplikaty w `mainPaths`; ≥ 150 wektorów, w tym ≥ 50 z faktycznym przycięciem. Mutacja: warunek `&&` → `||` i próg `3` → `2` muszą dać FAIL.

### P4-1B-Q3 MAP-VIEW-PRODUCER — `MapViewDto` + `HexDynDto` z modelu mapy
- **Warunek:** Q1 i Q2 zintegrowane; rozstrzygnięte źródło mapy (§2, wniosek kluczowy) — jeśli orkiestrator nie wskaże modelu, Operator przyjmuje `&SnapshotMap` jako parametr wejściowy (jedyny model z kompletem pól) i zapisuje to jako decyzję techniczną.
- **Kolejność heksów (obrona r1, Z5):** `SnapshotMap.hexes` ma kolejność `Object.keys(map.hexes)`, czyli kolejność pierwszego wstawienia klucza (`map_snapshot.rs:171`, `:565-574`), a nie gwarantowaną kolejność `r`-major. Producent musi mieć jawny krok porządkowania: sortowanie po `(r, q)` (albo budowa po `r in 0..wysokosc_r`, `q in 0..szerokosc_q` z wyszukaniem po kluczu), bez polegania na kolejności wejścia. Test negatywny: ta sama mapa z przetasowaną kolejnością `hexes` musi dać identyczny `MapViewDto`/`HexDynDto` (bajt w bajt), a mutacja „bez sortowania” musi dać FAIL.
- **Zakres:** `build_map_view(map) -> MapViewDto` (heksy `r`-major po jawnym sortowaniu, `rivers` z `riverPathKinds`, `river_render_paths` wg łańcucha §1.2 pkt 2–3, `1:1` z `rivers`) i `build_hex_dyn(map, cities) -> Vec<HexDynDto>` (`road_mask` dla każdego heksa, `terraces`, `covering_improvement`, pola heksa; `village_present` = `wioska.istnieje` i brak miasta). Walidacja `river_render_paths.len() == rivers.len()` w `view-model/src/validate.rs`.
- **Allowlista:** `rust-port/engine/src/domain/map_view.rs` (NOWY), `rust-port/engine/src/domain/mod.rs` (jedna linia), `rust-port/view-model/src/validate.rs` (tylko nowa reguła długości + wariant błędu, jeśli potrzebny), `rust-port/view-model/tests/validate.rs` (test reguły), `rust-port/engine/tests/p4_1b_map_view.rs` (NOWY), `rust-port/engine/tests/p4_1b_map_view_vectors/` (NOWY), `dyspozycje/autobot/runs/<ID>/**`.
- **Wektory:** generator na pinie: mapa z zapisu/snapshotu (≥ 3 mapy różnych rozmiarów z rzekami `main`/`medium`/`short`/`tributary` i `riverPathKinds` brak), wyjście = dla każdej trasy wynik łańcucha `scene.ts:1306-1318` oraz maski `computeRoadMask(hexHasRoadAt)` dla wszystkich heksów; porównanie bajt w bajt po serializacji DTO. Test negatywny walidacji (długości niezgodne → błąd). Mutacje: pominięcie trimu dla `medium`, `None` traktowane jako nie-`main`, maska z filtrem mgły — każda musi dać FAIL.

---

## 4. NIE_ZMIERZONO (jawnie)

1. Wektory szybkiej ścieżki `improvementKeysForHex` (`ulepszenie: ''`/`null`) na pinie `07d2fbd72` vs `improvements.rs:1021` — równoważność tylko z lektury kodu.
2. Czy `placedImprovements` (`main.ts:3132-3135`) może zawierać `tarasy`, gdy pola heksa (`improvementKeysForHex`) go nie mają (wpływ na `terraces`). Zawężone w obronie r1 (Z3): składnik ze złoża (`foodLayerFromAnimalDeposit`, `terrain-improvements.ts:349-353`) daje tylko `bydlo`/`owce`, więc nie dotyczy.
3. ~~Zgodność `isReliefTerrain` między `edb8fb56` a `07d2fbd72`~~ — **ZAMKNIĘTE** w obronie r1 (Z2): md5 ciała `d072c38a…` identyczne na obu pinach (§1.2).
4. Czy scenariusz `game/playtestMiastoEkonomia.ts` (zmiana `terenBazowy` w trakcie) jest w zakresie portu — od tego zależy, czy `river_render_paths` trzeba przeliczać po starcie.
5. Który model Rust będzie właścicielem mapy rozgrywki (`SnapshotMap` / `MapHex` + rzeki / rozszerzony `PlayableMap`) — decyzja techniczna orkiestratora przed Q3.
6. Renderer Rust nie ma jeszcze rysowania wstęg rzek lądowych (`renderLandRiversFromPaths`, `scene.ts:1267`): `grep "renderLandRivers\|land_river\|river_render" renderer/src` → 0 (jest tylko `decor/river_lod.rs` i delta/ujścia w `terrain/mod.rs:498-499`). Konsumpcja `river_render_paths` po stronie renderera — poza P4-1B (P4-1G / moduł rzek renderera).
