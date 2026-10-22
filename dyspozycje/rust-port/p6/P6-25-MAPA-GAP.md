# P6.25 - Analiza luk: gameplay-mapa web (`gra/src/map/**`) vs Rust (`rust-port/engine`)

Temat: `R-RUSTPORT-P6-25-MAPA-GAP-Q1` · DOMAIN: GAME · RUNDA 2/5 (Obrona Operatora po FAIL Evaluatora; zarzuty 1-9 w §12). Status dokumentu: **WYNIK ANALIZY (zero zmian kodu)**.
Pin web: `edb8fb56` (`git archive edb8fb56 gra/src gra/data` do katalogu POZA repo). Pin Rust: `origin/rust-port/parity-v2` @ `2b2f25a0`.
Wzorzec: `dyspozycje/rust-port/p6/P6-0-GAP-ANALYSIS.md` (P6.0 = `gra/src/game/`; ten dokument = `gra/src/map/`, ktorego P6.0 NIE objelo).
Skrypty, dane surowe i logi: `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/` (patrz §10 - indeks artefaktow).

## 0. Metoda, legenda, ograniczenia (ANTY-HALUCYNACJA)

- **Inwentarz web - skryptowy** (`inventory_map.py` na `git archive`): eksporty = linie `export ...` na poczatku wiersza, rozwijane (`export { a, b }`); wynik `web-exports.tsv`. Kontrola krzyzowa **w uruchomionym webie** (`web_runtime_check.out.txt`, `RUNTIME_EXPORTS`): liczby eksportow runtime (po wymazaniu typow) zgadzaja sie z liczba symboli niebedacych `interface`/`type` w kazdym module, ktory daje sie zaladowac (§1a).
- **Web URUCHOMIONY**, nie tylko czytany: moduly `gra/src/map` laduja sie pod Node 22.22.0 (`--experimental-transform-types` + `loader-hooks.mjs`; ten sam wzorzec co P6.1C). Zero zmian w `gra/**` (kod wypakowany do `mktemp -d` poza repo). Przez to wektory porownawcze sa z PRAWDZIWEGO weba: `web_pure_check.mjs`, `web_runtime_check.mjs`, `sweep_web.mjs`, `web_data_check.mjs`.
- **Rust uruchomiony** (crate scratch POZA repo, zaleznosc sciezkowa `civ-engine`; kod: `cmp_generate_map_vs_web.rs.txt`, `sweep_rust.rs.txt`): porownanie `generate_map` z 5 mapami `tests/p6_1c_vectors/maps.json` oraz sweep klimatu/Mulberry32/odleglosci.
- **Mapowanie web -> Rust jest RECZNE** (`build_gap.py`, reguly po symbolach/zakresach linii). Referencje `plik:linia` w Rust skrypt **wyszukuje w tresci plikow** i konczy sie bledem, gdy wzorca brak; kontrola kandydatow po nazwie: `rust_name_hits.py` -> `rust-name-hits.tsv` (49 trafien, wszystkie rozpatrzone). Zero numerow linii wpisanych z pamieci.
- **Klasy**: `SYSTEM` (logika wplywajaca na wynik gry, w tym potok generatora), `DATA` (stale/tabele/loadery), `UI` (render/DOM/etykiety/postep), `NIE-DOTYCZY` (worker, localStorage, profiler/asercje deweloperskie, martwy kod).
- **Statusy**: `ISTNIEJE-ZWERYFIKOWANE` = jest odpowiednik w Rust **i** test w repo porownuje go z danymi weba (wektory potwierdzone przeze mnie na uruchomionym webie; zakres wektora w kolumnie uwag, oznaczenie `WASKO` = tylko punktowe wektory, inne wymiary/ziarna NIE_ZMIERZONO; dla stalych/danych test musi PRZYPINAC wartosc, a nie tylko ja parsowac). `CZĘŚCIOWO` = jest odpowiednik/dane/pole, ale brak testu z danymi weba albo zakres niepelny. `BRAK` = brak odpowiednika logiki (dane lub pole struktury NIE sa logika - regula z P6.0). `NIE-DOTYCZY` = UI/worker/dev.
- **Dowod z analizy vs test w repo**: sweepy (`sweep.out.txt`) i porownania danych (`earth_mask_compare.out.txt`, `web_data_check.out.txt`) to dowody ANALIZY; nie sa testami w repo. Status `ISTNIEJE-ZWERYFIKOWANE` wymaga testu w repo; gdzie sweep jest mocniejszy niz test w repo, zapisano to w uwagach i zaproponowano test w M01.
- **`PORTOWANE-1:1` nie przyznano** zadnemu wierszowi (brak dowodu wektor-po-wektorze dla calych funkcji potoku).
- **Odnosniki Rust przy statusie BRAK** (5 wierszy §4: `BuildClusterSpawnInput`, `buildClusterSpawnPlan`, `MIN_DIST_START_CITY_STATE`, `ClusterPlacement`, `generujSwiat`) sa oznaczone `kontekst:` i NIE sa odpowiednikami: wskazuja miejsce, w ktorym Rust przyjmuje wynik z zewnatrz, albo INNA stala/struktura, ktora latwo pomylic z odpowiednikiem. Odpowiednik = odnosnik bez prefiksu `kontekst:` w wierszach CZESCIOWO / ISTNIEJE-ZWERYFIKOWANE.
- **LOC (kolumna §4 i rozmiary tematow)**: LOC deklaracji = linie niepuste instrukcji top-level wg AST TypeScript (`decl_spans.cjs` -> `decl-spans.tsv`; bez JSDoc). Zakres tematu (§6) = zbior linii pliku web nalezacych do tematu; kazda linia ma JEDNEGO wlasciciela, wiec zakresy tematow sa rozlaczne, a LOC tematu = liczba niepustych linii jego zakresow (kontrola: `verify_gap.py`). Zakresy bazowe (projekt podzialu) sa korygowane deklaracjami: symbol z §4 przypisany do tematu zawsze lezy w zakresie tego tematu (komentarz nad deklaracja tez).

## 1. Wskazniki (liczone skryptem `build_gap.py` z `gap-rows.tsv`)

| Wskaznik | Wartosc |
|---|---|
| Plikow w `gra/src/map/` w pinie (`git ls-tree -r --name-only edb8fb56 gra/src/map \| wc -l`) | **25** (dispatch mowil 27 - **ROZBIEZNOSC**, patrz §2 pkt 1) |
| Wierszy per plik (§3) | 25 |
| Wierszy per symbol (§4) = liczba eksportow | **606** (plik `web-exports.tsv`: 606 wierszy; kontrola rownosci w `build_gap.py`) |
| LOC niepuste `gra/src/map` | 21918 |
| Symboli o statusie ISTNIEJE-ZWERYFIKOWANE | 25 (4.1%) |
| Symboli o statusie CZĘŚCIOWO | 56 (9.2%) |
| Symboli o statusie BRAK | 428 (70.6%) |
| Symboli o statusie NIE-DOTYCZY | 97 (16.0%) |
| Klasy: SYSTEM / DATA / UI / NIE-DOTYCZY | 465 / 45 / 74 / 22 |
| SYSTEM+DATA razem | 510 symboli: ZW 25, CZ 56, BRAK 428, ND 1 |
| Pokrycie SYSTEM+DATA `ISTNIEJE-ZWERYFIKOWANE` | 25 / 510 = 4.9% |
| Pokrycie SYSTEM+DATA ZW+CZ (gorna granica) | 81 / 510 = 15.9% |
| LOC web w tematach backlogu (suma) | 20609 (pokrycie zakresow: kontrola w §6) |

### 1a. Kontrola krzyzowa liczby eksportow (statyczna vs runtime)

Runtime = `Object.keys(import(plik))` w uruchomionym webie (typy `interface`/`type` znikaja przy transformacji). Statyczne = `web-exports.tsv` bez rodzajow `interface`, `type` i `reexport-type` (`export type { ... }`).

| plik | eksporty statyczne | w tym typy | statyczne bez typow | runtime | zgodne |
|---|---|---|---|---|---|
| `cluster-spawn.ts` | 11 | 5 | 6 | 6 | TAK |
| `clusters.ts` | 78 | 9 | 69 | 69 | TAK |
| `deposit-era.ts` | 7 | 1 | 6 | 6 | TAK |
| `earth-land-mask.generated.ts` | 4 | 0 | 4 | 4 | TAK |
| `earth-land-mask.ts` | 8 | 0 | 8 | 8 | TAK |
| `gen-helpers.ts` | 260 | 23 | 237 | 237 | TAK |
| `genWorker.ts` | 2 | 2 | 0 | n/d (import nieudany: IMPORT-ERR: self is not defined) | n/d |
| `generator.ts` | 21 | 8 | 13 | 13 | TAK |
| `improvement-build.ts` | 41 | 9 | 32 | n/d (import nieudany: IMPORT-ERR: Cannot find package 'three' imported from /tmp/c) | n/d |
| `map-attack-city.ts` | 4 | 2 | 2 | 2 | TAK |
| `mapGenAsync.ts` | 1 | 0 | 1 | n/d (import nieudany: IMPORT-ERR: The requested module './genWorker.ts?worker&inli) | n/d |
| `mapGenProgress.ts` | 7 | 3 | 4 | 4 | TAK |
| `mapSnapshot.ts` | 6 | 3 | 3 | 3 | TAK |
| `minimap.ts` | 9 | 7 | 2 | 2 | TAK |
| `newGameMapDefaults.ts` | 65 | 10 | 55 | 55 | TAK |
| `range-hexes.ts` | 4 | 1 | 3 | 3 | TAK |
| `riverGenSwitch.ts` | 9 | 1 | 8 | 8 | TAK |
| `road-movement.ts` | 7 | 0 | 7 | 7 | TAK |
| `road-network.ts` | 17 | 0 | 17 | 17 | TAK |
| `startScoring.ts` | 4 | 0 | 4 | 4 | TAK |
| `territory-border.ts` | 6 | 2 | 4 | 4 | TAK |
| `territory-work.ts` | 8 | 1 | 7 | 7 | TAK |
| `territory.ts` | 11 | 2 | 9 | 9 | TAK |
| `villages.ts` | 10 | 2 | 8 | 8 | TAK |
| `wonder-placement.ts` | 6 | 3 | 3 | 3 | TAK |

Uwaga: `generator.ts` eksportuje 13 runtime; 21 statycznych - 8 typow/re-eksportow typow = 13 (zgodne). `improvement-build.ts`, `genWorker.ts`, `mapGenAsync.ts` nie daja sie zaladowac w Node (`three`, `self`, `?worker&inline`) - dla nich obowiazuje wylacznie liczba statyczna.

## 2. Kluczowe ustalenia

1. **Liczba plikow: 25, nie 27.** `git ls-tree -r --name-only edb8fb56 gra/src/map | wc -l` = 25 (sprawdzone `find` w wypakowanym archiwum: tez 25; brak podkatalogow). Dispatch podawal 27; w tym dokumencie obowiazuje 25 i kazdy z 25 plikow ma wiersz. Nie ma plikow testowych w katalogu (`*.test.ts`/`*.spec.ts` = 0).
2. **`generate_map` w Rust NIE jest portem `generateMap`.** Pomiar na 5 mapach z weba (`tests/p6_1c_vectors/maps.json`, wygenerowanych prawdziwym `generateMap`): rownosc terenu na poziomie pojedynczych hexow 22-43% (k3small 27%, k42 40%, k7 31%, p123 43%, w5 22%), rownosc ladu/wody 70-86% (`cmp_generate_map_vs_web.out.txt`). Rust to uproszczony potok (maska -> klasyfikacja -> klimat -> jeden pierscien wybrzeza -> rzeki BFS; `map_generator.rs:329-430`), web ma ~15 przebiegow (`generator.ts:148-775`) i ~12 tys. linii pomocnikow. Dla przepiecia na pelny potok konieczne sa tematy M03-M08 i M18.
3. **Rdzen deterministyczny jest ZGODNY z webem** (to jest dobra wiadomosc): Mulberry32 (19200/19200 wartosci, 300 ziaren), perm/noise/fbm (wektory), `climateBandAt` (17000/17000 wierszy; h=6..130; Ziemia i nie-Ziemia), maski ladu 4 typow swiata (wektory 36x28 seed 42, rowne do 1e-15), dane maski Ziemi (288000 bitow identycznych), `terrainCellBias`, `classifyTerrain` (progi domyslne). Zakres wektorow jest WASKI - tylko jeden rozmiar/ziarno dla masek; M01 ma go poszerzyc.
4. **Znalezione roznice potoku (kandydaci do M18, kazda z dowodem `plik:linia`)**: (a) `ShapeParams::from_rng(.., size_norm.max(1.0))` (`map_generator.rs`, wywolanie w `generate_map`) vs web `sizeNorm` bez klamry (`generator.ts:174-179`) - rozne dla map mniejszych niz 36 (np. 24x18 `k3small`: 27% rownych hexow); (b) web zeruje maske w buforze N/S `max(2, round(5%*h))` wierszy dla typow innych niz Ziemia (`generator.ts:236-238`); w Rust `generate_map` (map_generator.rs:329-430) nie znaleziono odpowiednika (brzeg d<2 jest zerowany wewnatrz masek przez `land_mask_border_fade`, zgodnie z `landMaskBorderFade`); roznica ujawnia sie dla h>=60 (bufor > 2) (c) las: Rust ustawia `forest` progiem szumu `forest_noise > 0.62` w petli terenu, web ma osobne przebiegi `reapplyForestOverlay` (`generator.ts:623`) i `ensureForestGridCoverage` (:624, :726); (d) rzeki: BFS `add_core_rivers` vs `generateRivers` (gen-helpers.ts:11525); (e) wybrzeze: Rust jeden przebieg `mark_coast_tiles` po klasyfikacji, web wola `applyCoastRing` wielokrotnie po zmianach siatki (`generator.ts:440`, `:468`) i ma `applyDoubleCoastRing`/`finalizeCoastAndInlandWater`; (f) brak zloz, wiosek, pozycji startowych, relief-coverage, bilansu lad/morze, `ensurePangeaSingleContinent`.
5. **P6.1C RUNDA-2 - minimalny wycinek (M09) i jego granice**: `buildSameTypeRivalSlots` + `buildSameTypeRivalCandidateHexes` + `groupForeignTypeClusters` wymagaja (domkniecie AST, `callgraph-rivals.txt`) 17 deklaracji `clusters.ts` (334 LOC niepustych; w tym stale `CLUSTER_CITY_STATE_MIN_HEX` :42, `CLUSTER_CITY_STATE_MAX_HEX` :47, `MIN_DIST_START_CITY_STATE` :49, `CLUSTER_GROWTH_RESERVE` :58) + 5 deklaracji `cluster-spawn.ts` (98 LOC; dwa typy P6.1C juz w Rust) + 3 z `gen-helpers.ts` (`mulberry32`, `HEX_DIRECTIONS`, `hexDistanceAxial` - JUZ w Rust). Nie trzeba portowac 3958 LOC `clusters.ts`. **M09 NIE zamyka calego pkt 1 z `P6-1C.md` §10**: pkt 1 wymienia tez `buildClusterSpawnPlan` i `computeClusters`; M09 odblokowuje wylacznie slot rywali i kandydatow (wejscia `buildClusterStartPlan` budowane dzis z zapisanego planu), a zasilenie `build_cluster_start_plan` wynikiem Rust wymaga lancucha M09 -> M10 -> M11 -> M12 (`computeClusters`: 118 deklaracji `clusters.ts` / 3505 LOC + 7 z `gen-helpers.ts` / 53 LOC; `buildClusterSpawnPlan`: 8 deklaracji `cluster-spawn.ts` + to samo domkniecie, `callgraph-spawnplan.txt`).
6. **Pulapka nazw stalych**: `MIN_DIST_START_CITY_STATE = 5` (`clusters.ts:49`, = `CLUSTER_CITY_STATE_MIN_HEX`) vs `MIN_CITY_DISTANCE_START_CITY_STATE = 3` (`cities.ts:1122`; w Rust `start-cluster-params.json` / `min_city_distance_start_city_state`, `start_position.rs`). To dwie ROZNE stale; port klastra rywali musi uzyc 5.
7. **Dwie kopie Mulberry32 w Rust** (`rng.rs:115-129` i `map_generator.rs:207`), obie zgodne z webem; dedup w M01.
8. **Przepisywanie tablic zasiegu terytorium**: Rust ma wlasna kopie `TerritoryNode`/`territory_owner_at` w `trade.rs` (P6.15), z promieniem dostarczanym z zewnatrz; formula promienia (`cityTerritoryRadius`, fort 10 / posterunek 5 / miasto wg okolicy) nie istnieje w Rust.
9. **Rozbieznosc regul do zbadania (M16)**: `hasBlockingDepositForFarm` zwraca w webie zawsze `false` (wolne wspolistnienie zloz z farma, `improvement-build.ts:743-747`), a `deposit_gate` Rust blokuje `Farm` gdy `tile.deposit.is_some()` (`improvements.rs`). Nie rozstrzygam, ktora strona jest wlasciwa - wymaga wektora z weba w M16.

## 3. Tabela per plik (25 wierszy)

| # | plik | LOC niepuste | eksporty | ZW | CZ | BRAK | ND | klasa dominujaca | import wewn. (map/) | import zewn. | tematy |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `cluster-spawn.ts` | 486 | 11 | 5 | 1 | 5 | 0 | SYSTEM | clusters,gen-helpers | data/loader,game/city-names-pool,game/civ-names,types/hex,types/map,units/setup | -, M09, M12 |
| 2 | `clusters.ts` | 3958 | 78 | 0 | 0 | 78 | 0 | SYSTEM | gen-helpers | game/civ-entry-epoch,types/hex,types/map | M09, M10, M11, M12 |
| 3 | `deposit-era.ts` | 39 | 7 | 0 | 1 | 6 | 0 | SYSTEM | gen-helpers | data/map-gen-params-loader | M02 |
| 4 | `earth-land-mask.generated.ts` | 417 | 4 | 0 | 4 | 0 | 0 | DATA | - | - | M01 |
| 5 | `earth-land-mask.ts` | 147 | 8 | 2 | 6 | 0 | 0 | SYSTEM | earth-land-mask.generated | - | M01 |
| 6 | `gen-helpers.ts` | 11654 | 260 | 17 | 22 | 203 | 18 | SYSTEM | earth-land-mask,newGameMapDefaults,riverGenSwitch | data/map-gen-params-loader,types/hex | -, M01, M03, M04, M05A, M05B, M06A, M06B, M07A, M07B, M07C, M07D, M07E1, M07E2, M08, M13 |
| 7 | `genWorker.ts` | 42 | 2 | 0 | 0 | 0 | 2 | NIE-DOTYCZY | gen-helpers,generator,newGameMapDefaults,riverGenSwitch | - | - |
| 8 | `generator.ts` | 794 | 21 | 1 | 7 | 10 | 3 | SYSTEM | gen-helpers,mapGenProgress,newGameMapDefaults,riverGenSwitch,startScoring,villages | data/map-gen-params-loader,types/hex,types/map,util/norm-pl-label | -, M02, M18 |
| 9 | `improvement-build.ts` | 1453 | 41 | 0 | 4 | 23 | 14 | SYSTEM | road-movement,territory,territory-work | ../data/terrain-improvements.json,game/improvement-tech,game/livestock-unlock,game/okolica,game/terrain-improvements,render/improvements,types/hex,typ | -, M15, M16 |
| 10 | `map-attack-city.ts` | 138 | 4 | 0 | 0 | 0 | 4 | UI | - | game/armyMerge,game/cities,game/mapSiegeDetect,game/siegeDefenders,units/setup | - |
| 11 | `mapGenAsync.ts` | 90 | 1 | 0 | 0 | 0 | 1 | NIE-DOTYCZY | gen-helpers,genWorker,genWorker.ts?worker&inline,generator,newGameMapDefaults,riverGenSwitch | - | - |
| 12 | `mapGenProgress.ts` | 92 | 7 | 0 | 0 | 0 | 7 | UI | - | - | - |
| 13 | `mapSnapshot.ts` | 380 | 6 | 0 | 0 | 6 | 0 | SYSTEM | - | types/hex,types/map | M17 |
| 14 | `minimap.ts` | 245 | 9 | 0 | 0 | 0 | 9 | UI | - | render/hexutil,types/hex,types/map | - |
| 15 | `newGameMapDefaults.ts` | 659 | 65 | 0 | 1 | 52 | 12 | SYSTEM | gen-helpers,generator | data/e-start-params-loader,data/map-gen-params-loader,game/civ-entry-epoch,util/norm-pl-label | -, M02 |
| 16 | `range-hexes.ts` | 108 | 4 | 0 | 0 | 4 | 0 | SYSTEM | territory | game/culture-religion,game/okolica,types/map | M14 |
| 17 | `riverGenSwitch.ts` | 66 | 9 | 0 | 0 | 5 | 4 | SYSTEM | - | - | -, M02 |
| 18 | `road-movement.ts` | 77 | 7 | 0 | 5 | 2 | 0 | DATA | - | game/terrain-improvements,types/hex | M15 |
| 19 | `road-network.ts` | 166 | 17 | 0 | 0 | 0 | 17 | UI | - | - | - |
| 20 | `startScoring.ts` | 121 | 4 | 0 | 1 | 3 | 0 | SYSTEM | clusters | types/hex,types/map,units/setup | M10 |
| 21 | `territory-border.ts` | 208 | 6 | 0 | 0 | 0 | 6 | UI | - | render/hexutil | - |
| 22 | `territory-work.ts` | 158 | 8 | 0 | 1 | 7 | 0 | SYSTEM | territory | game/cities | M14 |
| 23 | `territory.ts` | 129 | 11 | 0 | 3 | 8 | 0 | SYSTEM | - | game/okolica | M14 |
| 24 | `villages.ts` | 183 | 10 | 0 | 0 | 10 | 0 | SYSTEM | gen-helpers | game/difficulty-cost,types/hex | M13 |
| 25 | `wonder-placement.ts` | 108 | 6 | 0 | 0 | 6 | 0 | SYSTEM | territory | types/hex,types/map,units/setup | M14 |

## 4. Tabela per symbol (kazdy eksport; 606 wierszy)

Kolumny: *LOC* = linie niepuste deklaracji (od eksportu do nastepnej deklaracji top-level, bez JSDoc nastepnej); *uzywane poza map/* = liczba plikow w `gra/src` poza `map/` zawierajacych symbol jako slowo (tekstowo - NADMIAR, nie dowod semantyczny; `main.ts` = `gra/src/main.ts`). *Rust* = `plik:linia` (rozwiazane skryptem), *test* = test w repo.

| # | plik:linia | symbol | rodzaj | klasa | LOC | uzywane poza map/ | odpowiednik Rust (plik:linia) | status | test Rust | temat | uwagi |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `cluster-spawn.ts:35` | `ClusterSpawnSlot` | interface | SYSTEM | 11 | game:1 | `src/domain/start_position.rs:73` | ISTNIEJE-ZWERYFIKOWANE | `tests/p6_1c_start_cluster.rs:344` | - | typ danych P6.1C; uzyty jako wejscie wektorow z weba (maps.json + cluster-start.json) |
| 2 | `cluster-spawn.ts:48` | `ForeignTypeClusterGroup` | interface | SYSTEM | 5 | game:1 | `src/domain/start_position.rs:85` | ISTNIEJE-ZWERYFIKOWANE | `tests/p6_1c_start_cluster.rs:344` | - | typ danych P6.1C; wektory z weba |
| 3 | `cluster-spawn.ts:54` | `ClusterSpawnPlan` | interface | SYSTEM | 16 | game:1 | `src/domain/start_position.rs:94` | CZĘŚCIOWO | `tests/p6_1c_start_cluster.rs:344` | M12 | Rust BEZ pola `placement` (P6-1C §11); dane planu pochodza z zapisanego wyniku weba, nie z Rust |
| 4 | `cluster-spawn.ts:91` | `buildSameTypeRivalSlots` | function | SYSTEM | 44 | game:1 | - | BRAK | - | M09 | P6.1C RUNDA-2 (pkt 1 §10: slot rywali); zalezy od packRivalCitiesAroundCore (clusters.ts:2144); domkniecie AST: 17 deklaracji `clusters.ts`/334 LOC + 5 z `cluster-spawn.ts`/98 LOC (callgraph-rivals.txt) |
| 5 | `cluster-spawn.ts:140` | `buildSameTypeRivalCandidateHexes` | function | SYSTEM | 25 | main.ts:1,game:1 | - | BRAK | - | M09 | P6.1C RUNDA-2 (pkt 1 §10: kandydaci rywali); zalezy od packCityStatesAroundCapital (clusters.ts:2036) i computeSameTypeRivalHalfPlaneAxis (:1879) |
| 6 | `cluster-spawn.ts:167` | `BuildClusterSpawnInput` | interface | SYSTEM | 21 | - | kontekst: `src/domain/start_position.rs:135` | BRAK | - | M12 | Rust `BuildClusterStartInput` (inna struktura -- wejscie cluster-start.ts, nie cluster-spawn.ts) |
| 7 | `cluster-spawn.ts:195` | `groupForeignTypeClusters` | function | SYSTEM | 14 | game:1 | - | BRAK | - | M09 | czysta funkcja grupujaca (S); w Rust tylko struktura wyniku (`sp_group`), brak funkcji |
| 8 | `cluster-spawn.ts:216` | `buildClusterSpawnPlan` | function | SYSTEM | 211 | main.ts:1,game:1 | kontekst: `src/domain/start_position.rs:301` | BRAK | - | M12 | Rust `build_cluster_start_plan` PRZYJMUJE gotowy plan jako wejscie (start_position.rs, komentarz P6.1C); generator planu nie istnieje |
| 9 | `cluster-spawn.ts:445` | `HumanDistanceMode` | type | SYSTEM | 1 | game:1,ui:1 | `src/domain/start_position.rs:52` | ISTNIEJE-ZWERYFIKOWANE | `tests/p6_1c_start_cluster.rs:344` | - | enum; tryb w wektorach |
| 10 | `cluster-spawn.ts:477` | `pickSecondHumanStartHex` | function | SYSTEM | 30 | game:1 | `src/domain/start_position.rs:236` | ISTNIEJE-ZWERYFIKOWANE | `tests/p6_1c_start_cluster.rs:522` | - | test z wektorami weba (P6.1C) |
| 11 | `cluster-spawn.ts:511` | `displayLabelForSlot` | function | SYSTEM | 6 | game:1 | `src/domain/start_position.rs:275` | ISTNIEJE-ZWERYFIKOWANE | `tests/p6_1c_start_cluster.rs:555` | - | test z wektorami weba (P6.1C) |
| 12 | `clusters.ts:42` | `CLUSTER_CITY_STATE_MIN_HEX` | const | DATA | 1 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10 |
| 13 | `clusters.ts:47` | `CLUSTER_CITY_STATE_MAX_HEX` | const | DATA | 1 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10 |
| 14 | `clusters.ts:49` | `MIN_DIST_START_CITY_STATE` | const | DATA | 1 | main.ts:1 | kontekst: `src/domain/start_position.rs:186` | BRAK | - | M09 | UWAGA: =5 (clusters.ts:49); Rust `min_city_distance_start_city_state` to INNA stala (cities.ts:1122 =3). NIE mylic |
| 15 | `clusters.ts:54` | `MIN_DIST_FOREIGN_FROM_PLAYER` | const | DATA | 1 | - | - | BRAK | - | M09 | stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10 |
| 16 | `clusters.ts:56` | `MIN_DIST_FOREIGN_IN_CLUSTER` | const | DATA | 1 | - | - | BRAK | - | M09 | stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10 |
| 17 | `clusters.ts:58` | `CLUSTER_GROWTH_RESERVE` | const | DATA | 1 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); stala klastra; M09 = te uzywane przez wycinek rywali; reszta M10 |
| 18 | `clusters.ts:88` | `rosterKluczeForStartEpoch` | function | SYSTEM | 8 | - | - | BRAK | - | M10 | typy/roster/pomocnicze klastra |
| 19 | `clusters.ts:102` | `ClusterCity` | interface | SYSTEM | 5 | - | - | BRAK | - | M10 | typy/roster/pomocnicze klastra |
| 20 | `clusters.ts:109` | `TypeCluster` | interface | SYSTEM | 10 | game:1 | - | BRAK | - | M10 | typy/roster/pomocnicze klastra |
| 21 | `clusters.ts:121` | `ClusterSpawnCache` | interface | SYSTEM | 5 | - | - | BRAK | - | M10 | typy/roster/pomocnicze klastra |
| 22 | `clusters.ts:128` | `ClusterPlacement` | interface | SYSTEM | 17 | main.ts:1,game:1 | kontekst: `src/domain/start_position.rs:94` | BRAK | - | M12 | Rust `ClusterSpawnPlan` pomija to pole (start_position.rs, komentarz) -- typ nieobecny |
| 23 | `clusters.ts:192` | `reorderRosterByPreference` | function | SYSTEM | 18 | - | - | BRAK | - | M10 | typy/roster/pomocnicze klastra |
| 24 | `clusters.ts:217` | `MIN_MASS_HEXES_FOR_SPAWN` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 25 | `clusters.ts:222` | `MIN_DEVELOPMENT_HEX_PER_CIV` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 26 | `clusters.ts:224` | `SMALL_MASS_CAP_THRESHOLD` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 27 | `clusters.ts:226` | `DEVELOPMENT_SPACE_RADIUS` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 28 | `clusters.ts:228` | `ISLAND_FALLBACK_MASS_FRAC` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 29 | `clusters.ts:233` | `FOREIGN_MASS_MIN_ABSOLUTE` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 30 | `clusters.ts:235` | `FOREIGN_MASS_FRAC_OF_LARGEST` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 31 | `clusters.ts:240` | `LOCAL_LAND_DOMINANCE_FRAC` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 32 | `clusters.ts:242` | `REGION_MASS_DOMINANCE_FRAC` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 33 | `clusters.ts:244` | `LOCAL_LAND_DOMINANCE_RADIUS` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 34 | `clusters.ts:246` | `PLAYER_START_MIN_MASS_HEXES` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 35 | `clusters.ts:248` | `PLAYER_START_MASS_MIN_ABSOLUTE` | const | SYSTEM | 1 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 36 | `clusters.ts:258` | `foreignSpawnMassThreshold` | function | SYSTEM | 6 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 37 | `clusters.ts:266` | `massQualifiesForForeignSpawn` | function | SYSTEM | 8 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 38 | `clusters.ts:293` | `MassLandCache` | interface | SYSTEM | 5 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 39 | `clusters.ts:299` | `createMassLandCache` | function | SYSTEM | 6 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 40 | `clusters.ts:306` | `massLandCacheFromMasses` | function | SYSTEM | 9 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 41 | `clusters.ts:337` | `regionMassDominance` | function | SYSTEM | 25 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 42 | `clusters.ts:373` | `localLandFraction` | function | SYSTEM | 21 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 43 | `clusters.ts:395` | `passesLocalLandGate` | function | SYSTEM | 9 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 44 | `clusters.ts:409` | `developmentSpaceScore` | function | SYSTEM | 25 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 45 | `clusters.ts:436` | `massTypeCap` | function | SYSTEM | 4 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 46 | `clusters.ts:448` | `allocateTypyToMasses` | function | SYSTEM | 78 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 47 | `clusters.ts:540` | `qualifyingMassIndicesForSpawn` | function | SYSTEM | 10 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 48 | `clusters.ts:552` | `massSizeAtHex` | function | SYSTEM | 9 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 49 | `clusters.ts:566` | `passesPlayerStartMassGate` | function | SYSTEM | 17 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 50 | `clusters.ts:717` | `pickPlayerClusterCenter` | function | SYSTEM | 28 | - | - | BRAK | - | M10 | bramki mas ladu / rozmieszczenie srodkow klastrow |
| 51 | `clusters.ts:811` | `groupHabitableMasses` | function | SYSTEM | 29 | - | - | BRAK | - | M10 | w domknieciu startScoring (callgraph-startscoring.txt); bramki mas ladu / rozmieszczenie srodkow klastrow |
| 52 | `clusters.ts:1347` | `clusterPackRadius` | function | SYSTEM | 4 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 53 | `clusters.ts:1353` | `clusterCityStateRadius` | function | SYSTEM | 3 | main.ts:1 | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 54 | `clusters.ts:1361` | `clusterHubChainReachHex` | function | SYSTEM | 4 | main.ts:1 | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 55 | `clusters.ts:1370` | `capitalMinSeaDist` | function | SYSTEM | 10 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 56 | `clusters.ts:1385` | `capitalMaxSeaDist` | function | SYSTEM | 3 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 57 | `clusters.ts:1395` | `capitalMinSeaDistForMap` | function | SYSTEM | 9 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 58 | `clusters.ts:1405` | `capitalMaxSeaDistForMap` | function | SYSTEM | 9 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 59 | `clusters.ts:1416` | `clusterCohesionMaxHex` | function | SYSTEM | 3 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 60 | `clusters.ts:1420` | `seaDistAt` | function | SYSTEM | 7 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 61 | `clusters.ts:1428` | `passesMinSeaDistGate` | function | SYSTEM | 8 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 62 | `clusters.ts:1438` | `passesCapitalSeaBandGate` | function | SYSTEM | 12 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 63 | `clusters.ts:1452` | `capitalSeaBandPenalty` | function | SYSTEM | 13 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 64 | `clusters.ts:1470` | `capitalMinSeparation` | function | SYSTEM | 10 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 65 | `clusters.ts:1485` | `capitalMinSeparationForMap` | function | SYSTEM | 9 | game:1 | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 66 | `clusters.ts:1500` | `clusterBodySeparation` | function | SYSTEM | 3 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 67 | `clusters.ts:1508` | `clusterCenterPlacementSep` | function | SYSTEM | 3 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 68 | `clusters.ts:1512` | `clusterBodySeparationForMap` | function | SYSTEM | 9 | game:1 | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 69 | `clusters.ts:1522` | `clusterCenterPlacementSepForMap` | function | SYSTEM | 9 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 70 | `clusters.ts:1533` | `clusterBodyBufferRadius` | function | SYSTEM | 4 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 71 | `clusters.ts:1538` | `ForeignClusterBuffer` | interface | SYSTEM | 5 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 72 | `clusters.ts:1544` | `passesForeignClusterBufferGate` | function | SYSTEM | 9 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 73 | `clusters.ts:1555` | `landQuadrantIndex` | function | SYSTEM | 10 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 74 | `clusters.ts:1579` | `minimumSpreadQuartersRequired` | function | SYSTEM | 6 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 75 | `clusters.ts:1603` | `clusterCenterQuadrantSpread` | function | SYSTEM | 27 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 76 | `clusters.ts:1631` | `passesMinCapitalSeparationGate` | function | SYSTEM | 10 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 77 | `clusters.ts:1643` | `minCapitalSeparationDistance` | function | SYSTEM | 12 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 78 | `clusters.ts:1656` | `PickSpawnHexWithCapitalGatesOpts` | interface | SYSTEM | 20 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 79 | `clusters.ts:1678` | `seaDistRescueLadder` | function | SYSTEM | 12 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 80 | `clusters.ts:1697` | `pickSpawnHexWithCapitalGates` | function | SYSTEM | 66 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 81 | `clusters.ts:1870` | `SameTypeRivalHalfPlaneAxis` | interface | SYSTEM | 4 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 82 | `clusters.ts:1879` | `computeSameTypeRivalHalfPlaneAxis` | function | SYSTEM | 14 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 83 | `clusters.ts:1895` | `isInSameTypeRivalHalfPlane` | function | SYSTEM | 10 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 84 | `clusters.ts:1911` | `packCityStatesHubChain` | function | SYSTEM | 53 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 85 | `clusters.ts:2036` | `packCityStatesAroundCapital` | function | SYSTEM | 97 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 86 | `clusters.ts:2144` | `packRivalCitiesAroundCore` | function | SYSTEM | 22 | - | - | BRAK | - | M09 | w domknieciu wycinka rywali P6.1C (callgraph-rivals.txt); uklad stolic/miast-panstw wokol rdzenia |
| 87 | `clusters.ts:2168` | `ClusterLayoutPlan` | interface | SYSTEM | 5 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 88 | `clusters.ts:2271` | `buildClusterLayoutWithEdgeCapital` | function | SYSTEM | 33 | - | - | BRAK | - | M11 | uklad stolic/miast-panstw wokol rdzenia |
| 89 | `clusters.ts:3373` | `computeClusters` | function | SYSTEM | 837 | game:1 | - | BRAK | - | M12 | jedyny trafiony ciag `computeClusters` w Rust to komentarz w tests/p6_1c_start_cluster.rs; domkniecie AST = 118 deklaracji `clusters.ts`/3505 LOC + 7 z `gen-helpers.ts`/53 LOC (callgraph-computeclusters.txt) |
| 90 | `deposit-era.ts:7` | `DepositEraHex` | type | DATA | 1 | - | - | BRAK | - | M02 | typ pomocniczy |
| 91 | `deposit-era.ts:9` | `METAL_DEPOSIT_MIN_ERA` | const | DATA | 1 | - | `src/data/terrain_map.rs:393` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M02 | dane identyczne z `metal_deposit_min_era` (web_data_check.out.txt: {miedz:2,zelazo:3,wegiel:8,cyna:2}); test w repo przypina tylko `cyna` (data_terrain_map.rs:76-78); FUNKCJE lookup nieobecne |
| 92 | `deposit-era.ts:11` | `zlozeMinEraFor` | function | SYSTEM | 6 | game:1 | - | BRAK | - | M02 | widocznosc zloz per epoka (uzywane w game/resource-access.ts) |
| 93 | `deposit-era.ts:18` | `isDepositVisible` | function | SYSTEM | 6 | game:1 | - | BRAK | - | M02 | widocznosc zloz per epoka (uzywane w game/resource-access.ts) |
| 94 | `deposit-era.ts:25` | `visibleZloze` | function | SYSTEM | 4 | main.ts:1 | - | BRAK | - | M02 | widocznosc zloz per epoka (uzywane w game/resource-access.ts) |
| 95 | `deposit-era.ts:30` | `ensureDepositEraMeta` | function | SYSTEM | 9 | main.ts:1 | - | BRAK | - | M02 | widocznosc zloz per epoka (uzywane w game/resource-access.ts) |
| 96 | `deposit-era.ts:40` | `countHiddenMetalDeposits` | function | SYSTEM | 7 | - | - | BRAK | - | M02 | widocznosc zloz per epoka (uzywane w game/resource-access.ts) |
| 97 | `earth-land-mask.generated.ts:7` | `EARTH_MASK_W` | const | DATA | 1 | - | `src/domain/map_generator.rs:843` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M01 | 720; earth_mask_compare.out.txt: wymiary rowne |
| 98 | `earth-land-mask.generated.ts:8` | `EARTH_MASK_H` | const | DATA | 1 | - | `src/domain/map_generator.rs:843` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M01 | 400; wymiary rowne |
| 99 | `earth-land-mask.generated.ts:10` | `EARTH_MASK_BBOX` | const | DATA | 6 | - | `src/domain/map_generator.rs:959` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M01 | bbox rowny (earth_mask_compare.out.txt) |
| 100 | `earth-land-mask.generated.ts:16` | `EARTH_MASK_ROWS` | const | DATA | 402 | - | `src/domain/map_generator.rs:843` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M01 | 288000 bitow identycznych (earth_mask_compare.out.txt, dekodowanie RLE); test w repo sprawdza 7 punktow -- dodac test pelnej rownosci w M01 |
| 101 | `earth-land-mask.ts:25` | `EARTH_POLAR_OCEAN_REF_ROWS` | const | DATA | 1 | - | `src/domain/map_generator.rs:1085` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | stala 30 wbudowana w `earth_polar_ocean_rows`; sweep klimatu Ziemi h=6..130: 8500/8500 rownych |
| 102 | `earth-land-mask.ts:26` | `EARTH_POLAR_OCEAN_REF_INNER_H` | const | DATA | 1 | - | `src/domain/map_generator.rs:1085` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | stala 115 wbudowana; sweep jw. |
| 103 | `earth-land-mask.ts:29` | `earthNorthOceanRows` | function | SYSTEM | 3 | - | `src/domain/map_generator.rs:1085` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | alias earthPolarOceanRows (web :29); sweep jw. |
| 104 | `earth-land-mask.ts:34` | `earthSouthOceanRows` | function | SYSTEM | 3 | - | `src/domain/map_generator.rs:1085` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | alias earthPolarOceanRows (web :34); sweep jw. |
| 105 | `earth-land-mask.ts:52` | `earthPolarOceanRows` | reexport | SYSTEM | 1 | - | `src/domain/map_generator.rs:1085` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | sweep: climateBandAt(isEarth) h=6..130 -> 8500/8500 rownych (sweep.out.txt); test w repo tylko 2 punkty (r=0,27 h=28) |
| 106 | `earth-land-mask.ts:80` | `sampleEarthTemplateLand` | function | SYSTEM | 17 | - | `src/domain/map_generator.rs:978` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M01 | WASKO: pokryte posrednio 7 punktami masek Ziemi (36x28 seed 42) |
| 107 | `earth-land-mask.ts:99` | `earthHexToTemplateNorm` | function | SYSTEM | 24 | - | `src/domain/map_generator.rs:1002` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M01 | w Rust wbudowane w `earth_template_land_at` (brak osobnej funkcji); logika zgodna wg odczytu; osobnego testu brak |
| 108 | `earth-land-mask.ts:148` | `earthTemplateLandAt` | function | SYSTEM | 20 | - | `src/domain/map_generator.rs:1002` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M01 | WASKO: tylko tryb subsamplingu steps=7 (mapa 36x28); steps 1/3/5 NIE_ZMIERZONO |
| 109 | `gen-helpers.ts:33` | `RiverMapParams` | reexport-type | SYSTEM | 1 | - | - | BRAK | - | M01 | re-eksport typu z newGameMapDefaults.ts (definicja = temat M02); instrukcja re-eksportu lezy w zakresie M01 (gen-helpers.ts:33) |
| 110 | `gen-helpers.ts:47` | `TypSwiata` | type | SYSTEM | 1 | main.ts:1 | `src/domain/map_generator.rs:21` | ISTNIEJE-ZWERYFIKOWANE | `tests/map_generator.rs:58` | M01 | literaly kontynenty\|pangea\|wyspy\|ziemia = serde Rust (test porownuje z literalami weba) |
| 111 | `gen-helpers.ts:57` | `mulberry32` | function | SYSTEM | 9 | audio:1,battle:1,game:2 | `src/domain/map_generator.rs:207`<br>`src/domain/rng.rs:118` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1348`<br>`tests/p6_1_rng_mulberry.rs:14` | M01 | web_pure_check.out.txt: seed 42 = test :1348; sweep 300 ziaren x 64 wartosci rowne w OBU implementacjach Rust (19200/19200); DWIE kopie w Rust -- dedup w M01 |
| 112 | `gen-helpers.ts:72` | `buildPermTable` | function | SYSTEM | 9 | - | `src/domain/map_generator.rs:432` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1356` | M01 | perm[0..16] seed 42 rowne z webem (web_pure_check.out.txt); funkcja prywatna w Rust |
| 113 | `gen-helpers.ts:83` | `cosLerp` | function | SYSTEM | 4 | - | `src/domain/map_generator.rs:444` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1356` | M01 | posrednio przez wektory valueNoise2D/fbm (prywatna) |
| 114 | `gen-helpers.ts:89` | `valueNoise2D` | function | SYSTEM | 15 | - | `src/domain/map_generator.rs:449` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1356` | M01 | 2 wektory rowne z webem (web_pure_check.out.txt); prywatna |
| 115 | `gen-helpers.ts:109` | `fbm` | function | SYSTEM | 10 | - | `src/domain/map_generator.rs:465` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1356` | M01 | 2 wektory rowne z webem; prywatna |
| 116 | `gen-helpers.ts:125` | `HEX_DIRECTIONS` | const | DATA | 4 | - | `src/domain/map_generator.rs:108` | CZĘŚCIOWO | `tests/hex_terrain.rs:21` | M01 | ta sama kolejnosc 6 kierunkow wg odczytu; test geometrii, nie wektor weba |
| 117 | `gen-helpers.ts:135` | `hexDistanceAxial` | function | SYSTEM | 6 | game:1 | `src/domain/hex.rs:64`<br>`src/domain/map_generator.rs:127` | CZĘŚCIOWO | `tests/hex_terrain.rs:21` | M01 | sweep 1681 par: rowne w hex.rs i map_generator.rs (sweep.out.txt); testy w repo = geometria, bez wektora weba -> dodac w M01 |
| 118 | `gen-helpers.ts:157` | `hexKey` | function | SYSTEM | 3 | main.ts:1,battle:1,game:12,render:11 | `src/domain/hex.rs:85` | CZĘŚCIOWO | `tests/hex_terrain.rs:52` | M01 | format "q,r"; test round-trip, nie wektor weba |
| 119 | `gen-helpers.ts:162` | `ClimateZone` | type | UI | 1 | - | - | NIE-DOTYCZY | - | - | @deprecated; tylko render las-dzungla |
| 120 | `gen-helpers.ts:168` | `ClimateBand` | type | SYSTEM | 8 | - | `src/domain/map_generator.rs:46` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1519` | M01 | 7 pasow, nazwy serde = literaly weba |
| 121 | `gen-helpers.ts:178` | `CLIMATE_POLAR_FRAC` | const | DATA | 1 | - | `src/domain/map_generator.rs:1093` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | literal 0.05 wbudowany w `climate_band_at` (stala nie jest osobno przypieta; posrednio przez 8 wierszy h=28); sweep h=6..130 8500/8500 rownych |
| 122 | `gen-helpers.ts:180` | `CLIMATE_DESERT_HALF_ROWS` | const | DATA | 1 | - | `src/domain/map_generator.rs:1093` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | literal 3.5 wbudowany w `climate_band_at` (stala nie jest osobno przypieta; posrednio przez 8 wierszy h=28); sweep h=6..130 8500/8500 rownych |
| 123 | `gen-helpers.ts:182` | `CLIMATE_DESERT_HALF_FRAC` | const | DATA | 1 | - | - | NIE-DOTYCZY | - | - | martwy eksport: uzyty tylko w definicji (grep -rn: 1 trafienie, gen-helpers.ts:182) |
| 124 | `gen-helpers.ts:184` | `CLIMATE_PLAINS_HALF_FRAC` | const | DATA | 1 | - | `src/domain/map_generator.rs:1093` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | literal 0.075 wbudowany w `climate_band_at` (stala nie jest osobno przypieta; posrednio przez 8 wierszy h=28); sweep h=6..130 8500/8500 rownych |
| 125 | `gen-helpers.ts:187` | `CLIMATE_PROCEDURAL_LAT_BUFFER_FRAC` | const | DATA | 1 | - | `src/domain/map_generator.rs:1093` | CZĘŚCIOWO | `src/domain/map_generator.rs:1519` | M01 | literal 0.05 wbudowany w `climate_band_at` (stala nie jest osobno przypieta; posrednio przez 8 wierszy h=28); sweep h=6..130 8500/8500 rownych |
| 126 | `gen-helpers.ts:193` | `climateBandAt` | function | SYSTEM | 21 | - | `src/domain/map_generator.rs:1093` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1519` | M01 | sweep 125 wysokosci x wiersze (isEarth false/true): 17000/17000 rownych (sweep.out.txt) |
| 127 | `gen-helpers.ts:216` | `climateZoneAt` | function | UI | 6 | render:1 | - | NIE-DOTYCZY | - | - | tylko render (render/mapRenderStyle.ts) |
| 128 | `gen-helpers.ts:223` | `isPolarClimateBand` | function | SYSTEM | 3 | - | `src/domain/map_generator.rs:64` | CZĘŚCIOWO | - | M01 | trywialny predykat; test wektorowy brak |
| 129 | `gen-helpers.ts:228` | `latitudinalOceanBufferRows` | function | SYSTEM | 4 | - | `src/domain/map_generator.rs:1093`<br>`src/domain/map_generator.rs:1085` | CZĘŚCIOWO | - | M01 | w Rust wbudowane w `climate_band_at` (tryb nie-Ziemia: max(2, round(5%*h))); osobnej funkcji brak; sweep posrednio zgodny |
| 130 | `gen-helpers.ts:233` | `isInLatitudinalOceanBuffer` | function | SYSTEM | 4 | - | - | BRAK | - | M04 | web generator zeruje landMask w buforze (generator.ts:236); w Rust `generate_map` (map_generator.rs:329-430) brak odpowiednika -- jedna z roznic potoku |
| 131 | `gen-helpers.ts:253` | `ShapeParams` | interface | SYSTEM | 10 | - | `src/domain/map_generator.rs:246` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M03 | Rust `ShapeParams::from_rng` prywatne; noise_scale zgodny (maski), offsety NIE_ZMIERZONO; Rust `size_norm.max(1.0)` vs web `sizeNorm` bez klamry (generator.ts:174) -> rozne dla map <36 |
| 132 | `gen-helpers.ts:268` | `defaultShapeParams` | function | SYSTEM | 11 | - | `src/domain/map_generator.rs:246` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M03 | kolejnosc rand(): 6 offsetow po permutacji; zgodna wg odczytu, wektor offsetow NIE_ZMIERZONO |
| 133 | `gen-helpers.ts:284` | `landMaskAt` | function | SYSTEM | 8 | - | - | BRAK | - | M03 | eksport bez konsumentow poza re-eksportem generator.ts:847 (grep) -- maska eliptyczna "oryginalna", nieuzywana przez generator; kandydat na NIE-DOTYCZY (martwy) |
| 134 | `gen-helpers.ts:297` | `ContinentCenter` | interface | SYSTEM | 5 | - | `src/domain/map_generator.rs:265` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | struktura {nq,nr,radius}; uzyta w wektorach masek (prywatna) |
| 135 | `gen-helpers.ts:303` | `ContinentCenterOpts` | interface | SYSTEM | 13 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 136 | `gen-helpers.ts:318` | `KONTYNENTY_ZONE_COUNT` | const | DATA | 1 | - | `src/domain/map_generator.rs:529` | CZĘŚCIOWO | - | M03 | stala wbudowana w logike centrow Rust (prywatna); brak osobnego testu wartosci |
| 137 | `gen-helpers.ts:324` | `continentCenterCount` | function | SYSTEM | 5 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 138 | `gen-helpers.ts:334` | `buildContinentCenters` | function | SYSTEM | 56 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 139 | `gen-helpers.ts:399` | `buildFiveZoneContinentCenters` | function | SYSTEM | 24 | - | `src/domain/map_generator.rs:529` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: centra wchodza do wektora maski kontynentow (3 pkt, 36x28 seed 42, landFraction 0.30; web_runtime_check.out.txt: 5 centrow, maska rowna); inne wymiary NIE_ZMIERZONO |
| 140 | `gen-helpers.ts:426` | `nearestContinentZoneIndex` | function | SYSTEM | 17 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 141 | `gen-helpers.ts:460` | `landMaskKontynenty` | function | SYSTEM | 26 | - | `src/domain/map_generator.rs:663` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: 3 punkty; web_runtime_check.out.txt rowne co do 1e-15 |
| 142 | `gen-helpers.ts:499` | `mapIsotropicFromCenter` | function | SYSTEM | 12 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 143 | `gen-helpers.ts:527` | `PangeaLandLayoutParams` | interface | SYSTEM | 14 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 144 | `gen-helpers.ts:553` | `pangeaLandLayoutParams` | function | SYSTEM | 29 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 145 | `gen-helpers.ts:584` | `buildPangeaBlobCenters` | function | SYSTEM | 42 | - | `src/domain/map_generator.rs:565` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: jw. (6 centrow, landFraction 0.60) |
| 146 | `gen-helpers.ts:656` | `landMaskPangea` | function | SYSTEM | 28 | - | `src/domain/map_generator.rs:716` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: 3 punkty; ostatnia cyfra roznica 1e-16 (web_runtime_check.out.txt) |
| 147 | `gen-helpers.ts:688` | `ISLAND_GRID_DIVISIONS` | const | DATA | 1 | - | `src/domain/map_generator.rs:529` | CZĘŚCIOWO | - | M03 | stala wbudowana w logike centrow Rust (prywatna); brak osobnego testu wartosci |
| 148 | `gen-helpers.ts:693` | `buildSixteenGridIslandCenters` | function | SYSTEM | 30 | - | `src/domain/map_generator.rs:617` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: jw. (16 centrow) |
| 149 | `gen-helpers.ts:727` | `islandGridCellIndex` | function | SYSTEM | 6 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 150 | `gen-helpers.ts:735` | `assignIslandGridIndices` | function | SYSTEM | 12 | - | - | BRAK | - | M03 | maski ladu i centra kontynentow |
| 151 | `gen-helpers.ts:753` | `landMaskWyspy` | function | SYSTEM | 37 | - | `src/domain/map_generator.rs:788` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: 3 punkty; rowne |
| 152 | `gen-helpers.ts:799` | `ZIEMIA_LAND_CENTERS` | const | NIE-DOTYCZY | 8 | - | - | NIE-DOTYCZY | - | - | martwy eksport: jedyne trafienie to definicja (grep -rn gra/src: 1); Rust rowniez nie ma, `landMaskZiemia` uzywa szablonu |
| 153 | `gen-helpers.ts:812` | `landMaskZiemia` | function | SYSTEM | 11 | - | `src/domain/map_generator.rs:1065` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1458` | M03 | WASKO: 7 punktow; rowne (web_runtime_check.out.txt) |
| 154 | `gen-helpers.ts:826` | `TerrainResult` | interface | SYSTEM | 4 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 155 | `gen-helpers.ts:832` | `TerrainClassifyThresholds` | interface | SYSTEM | 9 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 156 | `gen-helpers.ts:843` | `TerrainScratch` | interface | SYSTEM | 7 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 157 | `gen-helpers.ts:889` | `terenCoverageCellSize` | function | SYSTEM | 3 | - | `src/domain/map_generator.rs:1213` | CZĘŚCIOWO | `src/domain/map_generator.rs:1370` | M04 | =4 (gen-helpers.ts:889); w Rust osobnej funkcji brak, jest tylko literal 4 w `terrain_cell_bias` (`q / 4`); test `map_generator.rs` pinuje WYNIK `terrain_cell_bias`, nie te funkcje -> CZESCIOWO; web ma dodatkowo parametr `cellSize` w `terrainCellBias` |
| 158 | `gen-helpers.ts:911` | `terrainCellBias` | function | SYSTEM | 5 | - | `src/domain/map_generator.rs:1213` | ISTNIEJE-ZWERYFIKOWANE | `src/domain/map_generator.rs:1370` | M04 | 4 wektory rowne z webem (web_pure_check.out.txt); prywatna |
| 159 | `gen-helpers.ts:923` | `classifyTerrain` | function | SYSTEM | 42 | - | `src/domain/map_generator.rs:1177` | CZĘŚCIOWO | `src/domain/map_generator.rs:1370` | M04 | 6 przypadkow rowne (web_runtime_check.out.txt) ale TYLKO progi domyslne (thresholds=undefined) -- web przyjmuje progi tier-ow gestosci (generator.ts:162) |
| 160 | `gen-helpers.ts:973` | `classifyTerrainFlat` | function | SYSTEM | 30 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 161 | `gen-helpers.ts:1012` | `reapplyForestOverlay` | function | SYSTEM | 56 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 162 | `gen-helpers.ts:1109` | `reapplyLandTerrain` | function | SYSTEM | 51 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 163 | `gen-helpers.ts:1163` | `ReliefDensityTier` | type | SYSTEM | 1 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 164 | `gen-helpers.ts:1172` | `reliefLandFractions` | function | SYSTEM | 3 | - | - | BRAK | - | M04 | klasyfikacja terenu |
| 165 | `gen-helpers.ts:1177` | `MAP_BORDER_OCEAN_HEXES` | const | SYSTEM | 1 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 166 | `gen-helpers.ts:1180` | `MAP_MARGIN_LAND_ZONE_HEXES` | const | SYSTEM | 1 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 167 | `gen-helpers.ts:1183` | `mapBorderWidth` | function | SYSTEM | 3 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 168 | `gen-helpers.ts:1191` | `marginLandCapForBorderDistance` | function | SYSTEM | 5 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 169 | `gen-helpers.ts:1233` | `applyMarginalLandZoneCaps` | function | SYSTEM | 50 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 170 | `gen-helpers.ts:1287` | `isInMapMarginZone` | function | SYSTEM | 3 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 171 | `gen-helpers.ts:1294` | `landMaskBorderFade` | function | SYSTEM | 7 | - | `src/domain/map_generator.rs:641` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M04 | uzyte posrednio w maskach (wektory 3 pkt); brak osobnego testu |
| 172 | `gen-helpers.ts:1303` | `mapCenterRadialBias` | function | SYSTEM | 8 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 173 | `gen-helpers.ts:1313` | `mapEdgeRectFade` | function | SYSTEM | 12 | - | `src/domain/map_generator.rs:652` | CZĘŚCIOWO | `src/domain/map_generator.rs:1458` | M04 | uzyte posrednio w maskach; brak osobnego testu |
| 174 | `gen-helpers.ts:1334` | `hexBorderDistance` | function | SYSTEM | 3 | - | `src/domain/map_generator.rs:1226` | CZĘŚCIOWO | - | M04 | odpowiednik `border_distance` (prywatna); brak testu |
| 175 | `gen-helpers.ts:1338` | `isInMapBorder` | function | SYSTEM | 4 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 176 | `gen-helpers.ts:1357` | `countMapBorderHexes` | function | SYSTEM | 10 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 177 | `gen-helpers.ts:1369` | `findLandInMapBorder` | function | SYSTEM | 17 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 178 | `gen-helpers.ts:1388` | `enforceMapBorderOcean` | function | SYSTEM | 19 | - | - | BRAK | - | M04 | brzeg/margines mapy |
| 179 | `gen-helpers.ts:1411` | `groupLandMassKeys` | function | SYSTEM | 27 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 180 | `gen-helpers.ts:1440` | `computeLandMassCentroid` | function | SYSTEM | 18 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 181 | `gen-helpers.ts:1460` | `CONTINENT_CENTER_SQUARE_SIZE` | const | SYSTEM | 1 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 182 | `gen-helpers.ts:1462` | `ContinentCenterSquare` | type | SYSTEM | 5 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 183 | `gen-helpers.ts:1472` | `continentCenterSquare` | function | SYSTEM | 61 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 184 | `gen-helpers.ts:1540` | `hexDistanceToCenterSquare` | function | SYSTEM | 14 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 185 | `gen-helpers.ts:1565` | `landPartitionKeysForDistribution` | function | SYSTEM | 18 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 186 | `gen-helpers.ts:1750` | `applyReliefByNoiseRank` | function | SYSTEM | 21 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 187 | `gen-helpers.ts:1777` | `MIN_RIVER_SOURCES_PER_WATER_CELL` | const | SYSTEM | 1 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 188 | `gen-helpers.ts:1782` | `minMountainsIronCell` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 189 | `gen-helpers.ts:1786` | `minHighlandsCopperCell` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 190 | `gen-helpers.ts:1791` | `MIN_MOUNTAINS_IRON_CELL` | const | SYSTEM | 1 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 191 | `gen-helpers.ts:1793` | `MIN_HIGHLANDS_COPPER_CELL` | const | SYSTEM | 1 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 192 | `gen-helpers.ts:1799` | `waterCoverageCellSize` | function | SYSTEM | 5 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 193 | `gen-helpers.ts:1809` | `ironCoverageCellSize` | function | SYSTEM | 5 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 194 | `gen-helpers.ts:1819` | `copperCoverageCellSize` | function | SYSTEM | 5 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 195 | `gen-helpers.ts:1828` | `reliefCoverageCellSize` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 196 | `gen-helpers.ts:1833` | `fairPlayResourceCellSize` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 197 | `gen-helpers.ts:1838` | `forestCoverageCellSize` | function | SYSTEM | 5 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 198 | `gen-helpers.ts:1844` | `minLandHexesForFairPlayCell` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 199 | `gen-helpers.ts:1848` | `minLandHexesForReliefCell` | function | SYSTEM | 3 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 200 | `gen-helpers.ts:1889` | `cellHasIronPackage` | function | SYSTEM | 7 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 201 | `gen-helpers.ts:1898` | `cellHasCopperPackage` | function | SYSTEM | 7 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 202 | `gen-helpers.ts:1907` | `cellHasReliefPackage` | function | SYSTEM | 6 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 203 | `gen-helpers.ts:1962` | `ironGridCoverageRatio` | function | SYSTEM | 17 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 204 | `gen-helpers.ts:1980` | `copperGridCoverageRatio` | function | SYSTEM | 17 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 205 | `gen-helpers.ts:1999` | `reliefGridCoverageRatio` | function | SYSTEM | 11 | - | - | BRAK | - | M05A | masy ladu, relief wg szumu, pokrycie |
| 206 | `gen-helpers.ts:2011` | `assertReliefGridCoverage` | function | NIE-DOTYCZY | 12 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 207 | `gen-helpers.ts:2371` | `ensureReliefGridCoverage` | function | SYSTEM | 64 | - | - | BRAK | - | M05B | pokrycie reliefu, pasma gorskie |
| 208 | `gen-helpers.ts:2618` | `capReliefClusterSizeSafetyNet` | function | SYSTEM | 11 | - | - | BRAK | - | M05B | pokrycie reliefu, pasma gorskie |
| 209 | `gen-helpers.ts:2965` | `growMountainRanges` | function | SYSTEM | 208 | - | - | BRAK | - | M05B | pokrycie reliefu, pasma gorskie |
| 210 | `gen-helpers.ts:3186` | `assignContinentIndices` | function | SYSTEM | 15 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 211 | `gen-helpers.ts:3234` | `isLandTerrain` | function | SYSTEM | 8 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 212 | `gen-helpers.ts:3249` | `isLandOrCoast` | function | SYSTEM | 3 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 213 | `gen-helpers.ts:3254` | `defaultLandFractionForTyp` | function | SYSTEM | 9 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 214 | `gen-helpers.ts:3268` | `countLandSeaHexes` | function | SYSTEM | 9 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 215 | `gen-helpers.ts:3339` | `enforceLatitudinalOceanBuffer` | function | SYSTEM | 19 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 216 | `gen-helpers.ts:3380` | `applyClimateBandsToHexes` | function | SYSTEM | 34 | - | `src/domain/map_generator.rs:1162` | CZĘŚCIOWO | - | M06A | Rust `apply_climate_bands` na uproszczonym modelu HexTile (bez nakladek/zloz); brak testu wektorowego; kolejnosc w potoku inna |
| 217 | `gen-helpers.ts:3418` | `enforceEarthTemplateOnHexes` | function | SYSTEM | 15 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 218 | `gen-helpers.ts:3435` | `LandFractionFillBias` | type | SYSTEM | 1 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 219 | `gen-helpers.ts:3444` | `applyLandFractionByScore` | function | SYSTEM | 85 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 220 | `gen-helpers.ts:3532` | `rebalanceLandFractionWithMargins` | function | SYSTEM | 15 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 221 | `gen-helpers.ts:3667` | `rebalanceLandFractionPangea` | function | SYSTEM | 29 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 222 | `gen-helpers.ts:3701` | `applyLandFractionByContinent` | function | SYSTEM | 82 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 223 | `gen-helpers.ts:3791` | `rebalanceLandSeaRatio` | function | SYSTEM | 86 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 224 | `gen-helpers.ts:3882` | `isDryLandTerrain` | function | SYSTEM | 3 | render:1 | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 225 | `gen-helpers.ts:3894` | `applyCoastRing` | function | SYSTEM | 23 | - | `src/domain/map_generator.rs:1230` | CZĘŚCIOWO | - | M06A | Rust `mark_coast_tiles` = jeden pierscien Morze->PlytkieMorze przy ladzie (nie czyta isDryLandTerrain/nakladek); web ma tez applyDoubleCoastRing; brak testu wektorowego |
| 226 | `gen-helpers.ts:3923` | `applyDoubleCoastRing` | function | SYSTEM | 24 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 227 | `gen-helpers.ts:3949` | `findDryLandTouchingSea` | function | SYSTEM | 17 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 228 | `gen-helpers.ts:3975` | `sanitizeCoastHexes` | function | SYSTEM | 46 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 229 | `gen-helpers.ts:4026` | `oceanConnectedWaterKeys` | function | SYSTEM | 34 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 230 | `gen-helpers.ts:4109` | `findInlandWaterHexes` | function | SYSTEM | 13 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 231 | `gen-helpers.ts:4123` | `findInlandSeaHexes` | function | SYSTEM | 10 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 232 | `gen-helpers.ts:4137` | `removeInlandWaterPools` | function | SYSTEM | 14 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 233 | `gen-helpers.ts:4156` | `purgeDesertEnclaveWater` | function | SYSTEM | 28 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 234 | `gen-helpers.ts:4189` | `fillEnclosedWaterByLandNeighbors` | function | SYSTEM | 24 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 235 | `gen-helpers.ts:4215` | `purgeInlandWaterForMultiLandTyp` | function | SYSTEM | 12 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 236 | `gen-helpers.ts:4232` | `applyJaggedCoastNoise` | function | SYSTEM | 39 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 237 | `gen-helpers.ts:4276` | `removeSmallInlandWaterPools` | function | SYSTEM | 38 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 238 | `gen-helpers.ts:4320` | `removeInlandSeaPools` | function | SYSTEM | 7 | - | - | BRAK | - | M06A | bilans lad/morze, wybrzeze, wody srodladowe |
| 239 | `gen-helpers.ts:4375` | `ensurePangeaSingleContinent` | function | SYSTEM | 91 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 240 | `gen-helpers.ts:4530` | `measurePangeaAnnularCorridorHexes` | function | NIE-DOTYCZY | 19 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 241 | `gen-helpers.ts:4552` | `PangeaBagelAuditSnap` | type | NIE-DOTYCZY | 7 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 242 | `gen-helpers.ts:4560` | `pangeaBagelAuditSnaps` | let | NIE-DOTYCZY | 1 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 243 | `gen-helpers.ts:4562` | `startPangeaBagelAudit` | function | NIE-DOTYCZY | 3 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 244 | `gen-helpers.ts:4566` | `takePangeaBagelAuditSnaps` | function | NIE-DOTYCZY | 5 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 245 | `gen-helpers.ts:4572` | `snapPangeaBagelAudit` | function | NIE-DOTYCZY | 18 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 246 | `gen-helpers.ts:4595` | `fillPangeaAnnularSeaCorridors` | function | SYSTEM | 48 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 247 | `gen-helpers.ts:4649` | `maxOceanBayDepth` | function | SYSTEM | 5 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 248 | `gen-helpers.ts:4659` | `morseDepthFromMapBorder` | function | SYSTEM | 36 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 249 | `gen-helpers.ts:4701` | `trimEnclosedOceanOnly` | function | SYSTEM | 18 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 250 | `gen-helpers.ts:4724` | `purgeReliefValleyWater` | function | SYSTEM | 31 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 251 | `gen-helpers.ts:4761` | `trimDeepOceanBays` | function | SYSTEM | 20 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 252 | `gen-helpers.ts:4787` | `finalizeCoastAndInlandWater` | function | SYSTEM | 36 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 253 | `gen-helpers.ts:4840` | `thickenCoastAndSmoothInlets` | function | SYSTEM | 60 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 254 | `gen-helpers.ts:4915` | `flattenFalseCoastalRiverNotches` | function | SYSTEM | 26 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 255 | `gen-helpers.ts:4946` | `removeTinyLandIslands` | function | SYSTEM | 38 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 256 | `gen-helpers.ts:4992` | `minTinyIslandHexesForTyp` | function | SYSTEM | 9 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 257 | `gen-helpers.ts:5006` | `countOpenOceanLandSpecks` | function | SYSTEM | 19 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 258 | `gen-helpers.ts:5027` | `purgeOpenOceanLandSpecks` | function | SYSTEM | 21 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 259 | `gen-helpers.ts:5050` | `finalizeLandMassAfterCoast` | function | SYSTEM | 20 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 260 | `gen-helpers.ts:5079` | `enforceTargetDryLandFraction` | function | SYSTEM | 33 | - | - | BRAK | - | M06B | pangea/korytarze, finalizacja wybrzeza, wyspy |
| 261 | `gen-helpers.ts:5121` | `auditMapTerrainData` | function | NIE-DOTYCZY | 46 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 262 | `gen-helpers.ts:5175` | `ELEVATION_RANK` | const | SYSTEM | 10 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 263 | `gen-helpers.ts:5187` | `riversQuotaForLandMass` | function | SYSTEM | 6 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 264 | `gen-helpers.ts:5204` | `purgeOceanInsideEarthLandMask` | function | SYSTEM | 26 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 265 | `gen-helpers.ts:5244` | `purgeStrayLandOutsideEarthMask` | function | SYSTEM | 15 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 266 | `gen-helpers.ts:5261` | `landRiverRenderPath` | function | SYSTEM | 16 | render:1 | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 267 | `gen-helpers.ts:5279` | `countMediumInlandLandHexes` | function | SYSTEM | 11 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 268 | `gen-helpers.ts:5295` | `mediumRiverRenderPath` | function | SYSTEM | 15 | render:1 | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 269 | `gen-helpers.ts:5312` | `coastalRiverRenderPath` | function | SYSTEM | 70 | render:1 | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 270 | `gen-helpers.ts:5400` | `assertRiverPathAdjacent` | function | NIE-DOTYCZY | 13 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 271 | `gen-helpers.ts:5415` | `splitAdjacentRiverChains` | function | SYSTEM | 22 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 272 | `gen-helpers.ts:5440` | `sanitizeRiverPath` | function | SYSTEM | 15 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 273 | `gen-helpers.ts:5457` | `riverPathHasRevisitedHex` | function | SYSTEM | 9 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 274 | `gen-helpers.ts:5468` | `repairRiverPathAdjacency` | function | SYSTEM | 42 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 275 | `gen-helpers.ts:5512` | `RIVER_MIN_INLAND_FROM_SEA` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 276 | `gen-helpers.ts:5518` | `RIVER_MIN_MAIN_LEN` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 277 | `gen-helpers.ts:5523` | `RIVER_HARD_MEANDER_LEN` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 278 | `gen-helpers.ts:5526` | `RIVER_MOUTH_TAIL_LEN` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 279 | `gen-helpers.ts:5529` | `MAIN_RIVER_MIN_PATH_SEP` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 280 | `gen-helpers.ts:5532` | `MEDIUM_TRIBUTARY_SPACING_HEX` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 281 | `gen-helpers.ts:5535` | `mediumTributarySpacingHex` | function | SYSTEM | 3 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 282 | `gen-helpers.ts:5540` | `MEDIUM_TRIBUTARY_MIN_NET_LEN` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 283 | `gen-helpers.ts:5543` | `mediumTributaryMinNetLen` | function | SYSTEM | 6 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 284 | `gen-helpers.ts:5551` | `MAIN_RIVER_COAST_MOUTH_MAX_GAP` | const | SYSTEM | 1 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 285 | `gen-helpers.ts:5554` | `mainRiverCoastMouthMaxGapForDims` | function | SYSTEM | 5 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 286 | `gen-helpers.ts:5561` | `riverPathRespectsSeaBuffer` | function | SYSTEM | 17 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 287 | `gen-helpers.ts:5614` | `buildSeaDistanceField` | function | SYSTEM | 24 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 288 | `gen-helpers.ts:5640` | `buildOpenOceanDistanceField` | function | SYSTEM | 28 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 289 | `gen-helpers.ts:5679` | `RiverProfileStats` | interface | NIE-DOTYCZY | 21 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 290 | `gen-helpers.ts:5719` | `resetRiverProfileStats` | function | NIE-DOTYCZY | 3 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 291 | `gen-helpers.ts:5723` | `getRiverProfileStats` | function | NIE-DOTYCZY | 3 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 292 | `gen-helpers.ts:5727` | `formatRiverProfileReport` | function | NIE-DOTYCZY | 26 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 293 | `gen-helpers.ts:5755` | `RiverFieldCache` | interface | SYSTEM | 5 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 294 | `gen-helpers.ts:5761` | `buildRiverFieldCache` | function | SYSTEM | 19 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 295 | `gen-helpers.ts:5797` | `pathEndsAtSea` | function | SYSTEM | 21 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 296 | `gen-helpers.ts:5819` | `TraceRiverOpts` | interface | SYSTEM | 24 | - | - | BRAK | - | M07A | rzeki A: sciezki/pola |
| 297 | `gen-helpers.ts:6070` | `riverGrowStepPassesSep` | function | SYSTEM | 10 | - | - | BRAK | - | M07B | rzeki B: trace |
| 298 | `gen-helpers.ts:6707` | `traceRiver` | function | SYSTEM | 105 | - | - | BRAK | - | M07B | rzeki B: trace |
| 299 | `gen-helpers.ts:6999` | `RIVER_TURN_WINDOW_HEX` | const | SYSTEM | 1 | - | - | BRAK | - | M07B | rzeki B: trace |
| 300 | `gen-helpers.ts:7000` | `RIVER_TURN_WINDOW_MAX_SUM` | const | SYSTEM | 1 | - | - | BRAK | - | M07B | rzeki B: trace |
| 301 | `gen-helpers.ts:7051` | `riverSegmentUnitVector` | function | SYSTEM | 11 | - | - | BRAK | - | M07B | rzeki B: trace |
| 302 | `gen-helpers.ts:7064` | `riverPathHasSharpUTurn` | function | SYSTEM | 9 | - | - | BRAK | - | M07B | rzeki B: trace |
| 303 | `gen-helpers.ts:7075` | `riverPathViolatesTurnWindow` | function | SYSTEM | 17 | - | - | BRAK | - | M07B | rzeki B: trace |
| 304 | `gen-helpers.ts:7254` | `syncRiverEdgeBonusHexes` | function | SYSTEM | 12 | ui:1 | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 305 | `gen-helpers.ts:7516` | `riverPathHasJoinHexWrap` | function | SYSTEM | 13 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 306 | `gen-helpers.ts:7533` | `riverPathHasBranchHexWrap` | function | SYSTEM | 12 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 307 | `gen-helpers.ts:7549` | `trimMediumJoinHexWrap` | function | SYSTEM | 17 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 308 | `gen-helpers.ts:7570` | `trimMediumBranchHexWrap` | function | SYSTEM | 16 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 309 | `gen-helpers.ts:7619` | `perpendicularHexDirections` | function | SYSTEM | 7 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 310 | `gen-helpers.ts:7766` | `growMediumTributaryFromMain` | function | SYSTEM | 59 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 311 | `gen-helpers.ts:7831` | `mediumPathStartsOnMain` | function | SYSTEM | 5 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 312 | `gen-helpers.ts:7838` | `mediumTributaryNetHexCount` | function | SYSTEM | 7 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 313 | `gen-helpers.ts:8043` | `trimMediumRenderPathAtMain` | function | SYSTEM | 10 | render:1 | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 314 | `gen-helpers.ts:8145` | `stripRiverMarksFromOpenSea` | function | SYSTEM | 9 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 315 | `gen-helpers.ts:8156` | `clearRiverMarks` | function | SYSTEM | 5 | - | - | BRAK | - | M07C | rzeki C: dolywy srednie |
| 316 | `gen-helpers.ts:8342` | `riverCoverageCellSize` | function | SYSTEM | 6 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 317 | `gen-helpers.ts:8353` | `riverTributaryCellSize` | function | SYSTEM | 6 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 318 | `gen-helpers.ts:8360` | `landHexesByCoverageCell` | function | SYSTEM | 14 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 319 | `gen-helpers.ts:8376` | `RiverPathKind` | type | SYSTEM | 1 | render:1 | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 320 | `gen-helpers.ts:8379` | `SHORT_RIVER_MAX_DIST_FROM_MEDIUM` | const | SYSTEM | 1 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 321 | `gen-helpers.ts:8381` | `GenerateRiversResult` | interface | SYSTEM | 4 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 322 | `gen-helpers.ts:8387` | `MAIN_RIVER_GRID_STRIDE` | const | SYSTEM | 1 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 323 | `gen-helpers.ts:8390` | `cellHasRiverHex` | function | SYSTEM | 10 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 324 | `gen-helpers.ts:8424` | `collectPathHexKeysForKinds` | function | SYSTEM | 13 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 325 | `gen-helpers.ts:8443` | `buildOceanReachableRiverHexKeys` | function | SYSTEM | 40 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 326 | `gen-helpers.ts:8488` | `verifyRiverNetworkConnectivity` | function | SYSTEM | 16 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 327 | `gen-helpers.ts:8508` | `pruneOrphanRiverPaths` | function | SYSTEM | 56 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 328 | `gen-helpers.ts:8573` | `pathReachesRealSea` | function | SYSTEM | 11 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 329 | `gen-helpers.ts:8593` | `pruneRiversNotReachingRealSea` | function | SYSTEM | 20 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 330 | `gen-helpers.ts:8619` | `ensureRiverOutlets` | function | SYSTEM | 15 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 331 | `gen-helpers.ts:8661` | `checkRiverEdgeContinuity` | function | SYSTEM | 27 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 332 | `gen-helpers.ts:8694` | `checkTributaryJunctions` | function | SYSTEM | 46 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 333 | `gen-helpers.ts:8785` | `pruneInvalidMediumRiverPaths` | function | SYSTEM | 74 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 334 | `gen-helpers.ts:8872` | `checkNoRiverRings` | function | SYSTEM | 31 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 335 | `gen-helpers.ts:8904` | `countRiverOutletsToSea` | function | SYSTEM | 15 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 336 | `gen-helpers.ts:8920` | `medianRiverPathLength` | function | SYSTEM | 16 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 337 | `gen-helpers.ts:8937` | `collectRiverPathHexKeys` | function | SYSTEM | 7 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 338 | `gen-helpers.ts:8981` | `RiverHexSpatialIndex` | class | SYSTEM | 56 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 339 | `gen-helpers.ts:9044` | `nearestRiverHexDistance` | function | SYSTEM | 16 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 340 | `gen-helpers.ts:9085` | `cellHasRiverSourceInCell` | function | SYSTEM | 11 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 341 | `gen-helpers.ts:9102` | `pathHasValidRiverOutlet` | function | SYSTEM | 14 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 342 | `gen-helpers.ts:9425` | `worstMainRiverCoastMouthGapOnMass` | function | SYSTEM | 21 | - | - | BRAK | - | M07D | rzeki D: walidacja/przycinanie |
| 343 | `gen-helpers.ts:9563` | `refillMainRiverCoastMouthGapsOnMap` | function | SYSTEM | 77 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 344 | `gen-helpers.ts:9803` | `landMassHasMainRiver` | function | SYSTEM | 14 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 345 | `gen-helpers.ts:9819` | `cellHasMainRiverSource` | function | SYSTEM | 13 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 346 | `gen-helpers.ts:9865` | `minLandHexesForRiverCell` | function | SYSTEM | 3 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 347 | `gen-helpers.ts:9870` | `RIVER_PROXIMITY_MAX_DIST` | const | SYSTEM | 1 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 348 | `gen-helpers.ts:9872` | `riverProximityMaxDist` | function | SYSTEM | 3 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 349 | `gen-helpers.ts:10215` | `maxLandHexDistanceToRiver` | function | SYSTEM | 8 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 350 | `gen-helpers.ts:10252` | `assertRiverGridCoverage` | function | NIE-DOTYCZY | 27 | - | - | NIE-DOTYCZY | - | - | diagnostyka/profiler/asercja deweloperska (nie wplywa na wynik); w Rust jako debug_assert!/test |
| 351 | `gen-helpers.ts:10281` | `riverGridCoverageRatio` | function | SYSTEM | 30 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 352 | `gen-helpers.ts:10517` | `MAX_DRY_LOWLAND_PATCH_HEXES` | const | SYSTEM | 1 | - | - | BRAK | - | M07E1 | rzeki E1: uzupelnienia/pokrycie |
| 353 | `gen-helpers.ts:10532` | `maxDryLowlandPatchSize` | function | SYSTEM | 27 | - | - | BRAK | - | M07E2 | rzeki E2: generateRivers |
| 354 | `gen-helpers.ts:11525` | `generateRivers` | function | SYSTEM | 228 | - | - | BRAK | - | M07E2 | rzeki E2: generateRivers |
| 355 | `gen-helpers.ts:11777` | `topUpRiverGridCoverage` | function | SYSTEM | 138 | - | - | BRAK | - | M07E2 | rzeki E2: generateRivers |
| 356 | `gen-helpers.ts:11935` | `HexWithZloze` | type | SYSTEM | 1 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 357 | `gen-helpers.ts:11953` | `DepositRule` | interface | DATA | 16 | - | `src/data/terrain_map.rs:373` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M08 | typ danych parsowany w Rust (spot-check), bez logiki losowania |
| 358 | `gen-helpers.ts:12045` | `DEPOSIT_RULES` | const | DATA | 4 | data:1,game:2,render:1 | `src/data/terrain_map.rs:380` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M08 | tabela regul zloz = dane `map-gen-params.json`; test spot-check; funkcje placeDeposits nieobecne |
| 359 | `gen-helpers.ts:12065` | `placeDeposits` | function | SYSTEM | 51 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 360 | `gen-helpers.ts:12127` | `FAIR_PLAY_DEPOSIT_IDS` | const | SYSTEM | 3 | data:1 | - | BRAK | - | M08 | zloza/las/fair-play |
| 361 | `gen-helpers.ts:12298` | `depositGridCoverageRatio` | function | SYSTEM | 18 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 362 | `gen-helpers.ts:12320` | `ensureDepositGridCoverage` | function | SYSTEM | 55 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 363 | `gen-helpers.ts:12379` | `forestGridCoverageRatio` | function | SYSTEM | 16 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 364 | `gen-helpers.ts:12399` | `ensureForestGridCoverage` | function | SYSTEM | 43 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 365 | `gen-helpers.ts:12449` | `stripDepositsFromWater` | function | SYSTEM | 11 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 366 | `gen-helpers.ts:12462` | `countDepositsOnWater` | function | SYSTEM | 8 | - | - | BRAK | - | M08 | zloza/las/fair-play |
| 367 | `gen-helpers.ts:12476` | `StartPosition` | interface | SYSTEM | 4 | - | - | BRAK | - | M13 | web {q,r,...} pozycja startowa generatora; w Rust brak tego typu (`start_position.rs` operuje slotami klastra) |
| 368 | `gen-helpers.ts:12495` | `computeStartPositions` | function | SYSTEM | 61 | - | - | BRAK | - | M13 | pozycje startowe |
| 369 | `genWorker.ts:13` | `GenWorkerRequest` | type | NIE-DOTYCZY | 9 | - | - | NIE-DOTYCZY | - | - | protokol Web Workera (self.postMessage); silnik Rust jest synchroniczny -- ZALOZENIE Z4 |
| 370 | `genWorker.ts:23` | `GenWorkerResponse` | type | NIE-DOTYCZY | 4 | - | - | NIE-DOTYCZY | - | - | protokol Web Workera; jw. |
| 371 | `generator.ts:117` | `WorldGenOptions` | reexport-type | SYSTEM | 1 | - | - | BRAK | - | M18 | re-eksport typu z newGameMapDefaults.ts:442 (definicja = temat M02); instrukcja re-eksportu nalezy do fasady generatora = M18 |
| 372 | `generator.ts:118` | `MapGenProgressCallback` | reexport-type | UI | 1 | - | - | NIE-DOTYCZY | - | - | re-eksport typu callbacku postepu |
| 373 | `generator.ts:118` | `MapGenPhaseTimings` | reexport-type | UI | 1 | main.ts:1,ui:2 | - | NIE-DOTYCZY | - | - | re-eksport typu timerow |
| 374 | `generator.ts:125` | `DEFAULT_WIDTH` | const | DATA | 1 | main.ts:1 | `src/data/terrain_map.rs:352` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M18 | =36; dane `generator.default_width` identyczne (web_data_check.out.txt); test w repo NIE przypina tej wartosci |
| 375 | `generator.ts:126` | `DEFAULT_HEIGHT` | const | DATA | 1 | main.ts:1 | `src/data/terrain_map.rs:352` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M18 | =28; jw. |
| 376 | `generator.ts:133` | `GameMapWithStarts` | type | SYSTEM | 6 | - | - | BRAK | - | M18 | typ wyniku (GameMap + startPositions); Rust `GeneratedMap` (map_generator.rs:152) to inny, uproszczony model |
| 377 | `generator.ts:148` | `generateMap` | function | SYSTEM | 571 | main.ts:1,game:1 | `src/domain/map_generator.rs:329` | CZĘŚCIOWO | - | M18 | Rust `generate_map` = UPROSZCZONY potok (maska->klasyfikacja->klimat->pierscien wybrzeza->rzeki BFS). POMIAR vs 5 map z weba: rowny teren 22-43% hexow (cmp_generate_map_vs_web.out.txt) -> NIE jest portem |
| 378 | `generator.ts:775` | `RozmiarSwiata` | type | DATA | 1 | data:1 | - | BRAK | - | M02 | typ etykiety rozmiaru |
| 379 | `generator.ts:778` | `ROZMIAR_DIMS` | const | DATA | 1 | - | `src/data/terrain_map.rs:361` | CZĘŚCIOWO | `tests/data_terrain_map.rs:66` | M02 | wymiary rowne z `rozmiar_dims` (web_data_check.out.txt); test w repo przypina tylko `standardowy` (data_terrain_map.rs:76) |
| 380 | `generator.ts:781` | `ROZMIAR_MENU_LABELS` | const | UI | 8 | perf:1 | - | NIE-DOTYCZY | - | - | etykiety menu |
| 381 | `generator.ts:798` | `rozmiarFromMenuLabel` | function | SYSTEM | 10 | main.ts:1 | - | BRAK | - | M02 | mapowanie etykiety menu -> rozmiar |
| 382 | `generator.ts:809` | `rozmiarToDims` | function | SYSTEM | 4 | - | `src/data/terrain_map.rs:361` | CZĘŚCIOWO | - | M02 | dane wymiarow sa w Rust, funkcja wyboru nie |
| 383 | `generator.ts:815` | `menuLabelToDims` | function | SYSTEM | 3 | - | `src/data/terrain_map.rs:361` | CZĘŚCIOWO | - | M02 | dane wymiarow sa w Rust, funkcja nie |
| 384 | `generator.ts:829` | `generujSwiat` | function | SYSTEM | 15 | - | kontekst: `src/domain/map_generator.rs:329` | BRAK | - | M18 | wrapper generateMap(rozmiar, typ, seed) |
| 385 | `generator.ts:846` | `TypSwiata` | reexport-type | SYSTEM | 1 | main.ts:1 | `src/domain/map_generator.rs:21` | ISTNIEJE-ZWERYFIKOWANE | `tests/map_generator.rs:58` | M18 | re-eksport typu (generator.ts:846); definicja w gen-helpers.ts (temat M01); instrukcja re-eksportu = fasada M18 |
| 386 | `generator.ts:846` | `RozmiarSwiataType` | reexport-type | DATA | 1 | - | - | BRAK | - | M18 | re-eksport aliasu typu (definicja = temat M02); instrukcja re-eksportu = fasada M18 |
| 387 | `generator.ts:846` | `StartPosition` | reexport-type | SYSTEM | 1 | - | - | BRAK | - | M18 | re-eksport typu z gen-helpers.ts:12476 (definicja = temat M13); instrukcja re-eksportu = fasada M18 |
| 388 | `generator.ts:847` | `landMaskAt` | reexport | SYSTEM | 1 | - | - | BRAK | - | M18 | re-eksport (generator.ts:847); definicja gen-helpers.ts (temat M03); brak konsumentow |
| 389 | `generator.ts:848` | `findBestPlayerStartHex` | reexport | SYSTEM | 1 | units:1 | - | BRAK | - | M18 | re-eksport z startScoring.ts (definicja = temat M10); instrukcja re-eksportu = fasada M18 |
| 390 | `generator.ts:848` | `scoreCityStartHex` | reexport | SYSTEM | 1 | - | - | BRAK | - | M18 | re-eksport z startScoring.ts (definicja = temat M10); instrukcja re-eksportu = fasada M18 |
| 391 | `generator.ts:848` | `START_REVEAL_RADIUS` | reexport | DATA | 1 | - | `src/domain/player.rs:111` | CZĘŚCIOWO | `tests/p6_1_first_player_city.rs:80` | M18 | re-eksport (definicja startScoring.ts = temat M10); Rust przyjmuje promien jako PARAMETR (`is_hex_in_start_reveal`), stala =5 nieobecna |
| 392 | `improvement-build.ts:50` | `ImprovementBuildState` | interface | UI | 59 | main.ts:1,game:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 393 | `improvement-build.ts:110` | `ImprovementTypeInfo` | interface | UI | 11 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 394 | `improvement-build.ts:122` | `ImprovementBuildRequest` | interface | UI | 10 | main.ts:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 395 | `improvement-build.ts:133` | `ImprovementBuildCallbacks` | interface | UI | 14 | main.ts:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 396 | `improvement-build.ts:148` | `ImprovementBuildModeOptions` | interface | UI | 6 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 397 | `improvement-build.ts:212` | `stripImprovementsWhenForestRemoved` | function | SYSTEM | 3 | main.ts:1,game:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 398 | `improvement-build.ts:255` | `isLegacyFarmOnForestLayer` | function | SYSTEM | 4 | game:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 399 | `improvement-build.ts:261` | `stripLegacyFarmOnForest` | function | SYSTEM | 7 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 400 | `improvement-build.ts:276` | `LegacyFarmHexView` | interface | UI | 5 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 401 | `improvement-build.ts:283` | `LegacyFarmOnForestChange` | interface | SYSTEM | 13 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 402 | `improvement-build.ts:297` | `LegacyFarmOnForestReport` | interface | SYSTEM | 9 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 403 | `improvement-build.ts:312` | `planLegacyFarmOnForestRemoval` | function | SYSTEM | 24 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 404 | `improvement-build.ts:347` | `removeLegacyFarmsOnForest` | function | SYSTEM | 15 | main.ts:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 405 | `improvement-build.ts:387` | `isFarmBaseTerrain` | function | SYSTEM | 4 | ui:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 406 | `improvement-build.ts:414` | `isStadninaBlockedOnForest` | function | SYSTEM | 3 | main.ts:1 | - | BRAK | - | M16 | regula stadniny na lesie; w Rust tylko ogolny `forest_gate` |
| 407 | `improvement-build.ts:474` | `isImprovementBlockedOnForest` | function | SYSTEM | 6 | main.ts:1,ui:1 | `src/domain/improvements.rs:264` | CZĘŚCIOWO | - | M16 | Rust `forest_gate` (prywatna) blokuje Farm/Irrigation/Cattle/Terraces na lesie; stadnina/owce/inne reguly web NIE_ZMIERZONO; brak testu wektorowego weba |
| 408 | `improvement-build.ts:494` | `getImprovementForestBlockHint` | function | UI | 5 | main.ts:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 409 | `improvement-build.ts:513` | `isOwceBaseTerrain` | function | SYSTEM | 5 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 410 | `improvement-build.ts:519` | `FOOD_LAYER_KEYS` | const | SYSTEM | 3 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 411 | `improvement-build.ts:567` | `ImprovementBuildImpact` | interface | SYSTEM | 6 | main.ts:1,ui:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 412 | `improvement-build.ts:575` | `improvementsReplacedByBuild` | function | SYSTEM | 25 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 413 | `improvement-build.ts:617` | `computeImprovementBuildImpact` | function | SYSTEM | 40 | main.ts:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 414 | `improvement-build.ts:662` | `formatImprovementBuildImpactList` | function | UI | 10 | ui:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 415 | `improvement-build.ts:709` | `MINE_IMPROVEMENT_KEYS` | const | SYSTEM | 6 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 416 | `improvement-build.ts:717` | `isMineImprovementKey` | function | SYSTEM | 3 | main.ts:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 417 | `improvement-build.ts:725` | `isImprovementVisibleInBuildPanel` | function | UI | 8 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 418 | `improvement-build.ts:735` | `isTarasyCiv` | function | SYSTEM | 6 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 419 | `improvement-build.ts:743` | `hasBlockingDepositForFarm` | function | SYSTEM | 5 | - | `src/domain/improvements.rs:277` | CZĘŚCIOWO | - | M16 | web: zawsze false (wolne wspolistnienie, improvement-build.ts:743-747); Rust: `Farm => tile.deposit.is_none()` (deposit_gate) -- ROZBIEZNOSC do zbadania w M16 |
| 420 | `improvement-build.ts:757` | `hexHasClayDeposit` | function | SYSTEM | 4 | ui:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 421 | `improvement-build.ts:763` | `hexHasDepositReserve` | function | SYSTEM | 5 | main.ts:1,game:1 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 422 | `improvement-build.ts:770` | `depositAllowsPlayerImprovement` | function | SYSTEM | 36 | main.ts:1,game:2 | `src/domain/improvements.rs:277` | CZĘŚCIOWO | - | M16 | Rust `deposit_gate` (prywatna) - inna reprezentacja zloz (`Deposit` enum vs nakladka/zloze weba); brak testu wektorowego weba |
| 423 | `improvement-build.ts:808` | `canAddFoodLayer` | function | SYSTEM | 28 | - | `src/domain/improvements.rs:303` | CZĘŚCIOWO | - | M16 | Rust `layers_allow` (prywatna) - warstwy zywnosci; zgodnosc z kanonem web NIE_ZMIERZONO (brak wektora weba) |
| 424 | `improvement-build.ts:912` | `hasAnimalDeposit` | function | SYSTEM | 3 | - | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 425 | `improvement-build.ts:1169` | `buildImprovementQualifier` | function | SYSTEM | 7 | main.ts:1,game:2 | - | BRAK | - | M16 | reguly budowy ulepszen na mapie |
| 426 | `improvement-build.ts:1181` | `galleryTerrainEligible` | function | UI | 69 | ui:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 427 | `improvement-build.ts:1252` | `galleryComboEligible` | function | UI | 19 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 428 | `improvement-build.ts:1276` | `galleryComboShowModel` | function | UI | 17 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 429 | `improvement-build.ts:1367` | `getForestBuildBlockReason` | function | UI | 31 | - | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 430 | `improvement-build.ts:1415` | `createImprovementBuildApi` | function | UI | 133 | main.ts:1,game:1,ui:1 | - | NIE-DOTYCZY | - | - | API/callbacki panelu budowy, galeria lub tekst podpowiedzi (UI) |
| 431 | `improvement-build.ts:1560` | `collectRoadKeys` | function | SYSTEM | 7 | main.ts:1,game:1 | - | BRAK | - | M15 | zbior kluczy drog; powiazane z road-movement.ts |
| 432 | `improvement-build.ts:1569` | `isRoadImprovementKey` | reexport | SYSTEM | 1 | main.ts:1 | - | BRAK | - | M15 | re-eksport z road-movement.ts:59 |
| 433 | `map-attack-city.ts:18` | `MapEnemyCityClickAction` | type | UI | 10 | main.ts:1 | - | NIE-DOTYCZY | - | - | routing klikniecia na wrogie miasto (hinty UI); decyzje oblezenia siedza w game/mapSiegeDetect.ts -- poza katalogiem map/, do P6.13 |
| 434 | `map-attack-city.ts:29` | `isCivilianUnit` | reexport | UI | 1 | main.ts:1,game:10,units:2 | - | NIE-DOTYCZY | - | - | routing klikniecia na wrogie miasto (hinty UI); decyzje oblezenia siedza w game/mapSiegeDetect.ts -- poza katalogiem map/, do P6.13 |
| 435 | `map-attack-city.ts:31` | `ResolveEnemyCityClickInput` | interface | UI | 11 | - | - | NIE-DOTYCZY | - | - | routing klikniecia na wrogie miasto (hinty UI); decyzje oblezenia siedza w game/mapSiegeDetect.ts -- poza katalogiem map/, do P6.13 |
| 436 | `map-attack-city.ts:83` | `resolveEnemyCityClick` | function | UI | 63 | main.ts:1 | - | NIE-DOTYCZY | - | - | routing klikniecia na wrogie miasto (hinty UI); decyzje oblezenia siedza w game/mapSiegeDetect.ts -- poza katalogiem map/, do P6.13 |
| 437 | `mapGenAsync.ts:19` | `generujSwiatAsync` | function | NIE-DOTYCZY | 14 | main.ts:1,game:1,ui:1 | `src/domain/map_generator.rs:329` | NIE-DOTYCZY | - | - | opakowanie workera (`?worker&inline`); w Rust odpowiada mu synchroniczne `generate_map`, asynchronicznosc = warstwa powloki (Tauri/bridge, P7) -- ZALOZENIE Z4 |
| 438 | `mapGenProgress.ts:6` | `MAP_GEN_PHASE_TOTAL` | const | UI | 1 | ui:1 | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 439 | `mapGenProgress.ts:8` | `MapGenProgressCallback` | type | UI | 6 | - | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 440 | `mapGenProgress.ts:16` | `MAP_GEN_PHASE_LABELS` | const | UI | 12 | ui:2 | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 441 | `mapGenProgress.ts:33` | `reportMapGenPhase` | function | UI | 15 | - | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 442 | `mapGenProgress.ts:50` | `MapGenPhaseKey` | type | UI | 1 | - | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 443 | `mapGenProgress.ts:53` | `MapGenPhaseTimings` | interface | UI | 13 | main.ts:1,ui:2 | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 444 | `mapGenProgress.ts:70` | `createMapGenTimer` | function | UI | 31 | - | - | NIE-DOTYCZY | - | - | postep generacji / timery wydajnosci (UI+perf); ew. callback postepu w M18 jako opcja |
| 445 | `mapSnapshot.ts:87` | `SparseColumn` | interface | SYSTEM | 4 | - | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 446 | `mapSnapshot.ts:97` | `SparseWidocznosc` | interface | SYSTEM | 7 | - | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 447 | `mapSnapshot.ts:111` | `SerializedMapData` | interface | SYSTEM | 31 | game:1 | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 448 | `mapSnapshot.ts:204` | `serializeMapForSave` | function | SYSTEM | 89 | main.ts:1,game:1 | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 449 | `mapSnapshot.ts:301` | `buildGameMapFromSnapshot` | function | SYSTEM | 49 | main.ts:1,game:1 | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 450 | `mapSnapshot.ts:365` | `isValidMapSnapshot` | function | SYSTEM | 36 | game:2 | - | BRAK | - | M17 | serializacja mapy do zapisu (kolumny rzadkie) -- uzywane w game/save.ts, game/load-map-source.ts; Rust: `save_load.rs` (inny format, bez mapy hexow) |
| 451 | `minimap.ts:12` | `MinimapHexData` | interface | UI | 8 | ui:2 | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 452 | `minimap.ts:24` | `MinimapMarkerData` | interface | UI | 6 | ui:1 | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 453 | `minimap.ts:32` | `MinimapData` | interface | UI | 7 | ui:2 | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 454 | `minimap.ts:40` | `MinimapCityInput` | interface | UI | 7 | - | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 455 | `minimap.ts:48` | `MinimapUnitInput` | interface | UI | 6 | - | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 456 | `minimap.ts:56` | `MinimapCameraInput` | interface | UI | 7 | - | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 457 | `minimap.ts:64` | `GetMinimapDataOptions` | interface | UI | 12 | - | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 458 | `minimap.ts:128` | `computeViewport` | function | UI | 18 | main.ts:1,audio:1 | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 459 | `minimap.ts:183` | `getMinimapData` | function | UI | 84 | main.ts:1,ui:2 | - | NIE-DOTYCZY | - | - | dane minimapy (render/DOM; importuje render/hexutil) |
| 460 | `newGameMapDefaults.ts:39` | `MapSizeLabel` | type | SYSTEM | 1 | data:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 461 | `newGameMapDefaults.ts:42` | `TYP_SWIATA_MENU_LABELS` | const | UI | 6 | - | - | NIE-DOTYCZY | - | M02 | etykiety menu / jakosc renderu = UI |
| 462 | `newGameMapDefaults.ts:61` | `mapSizeLabelFromDims` | function | SYSTEM | 9 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 463 | `newGameMapDefaults.ts:71` | `mapSizeLabelFromMenuLabel` | function | SYSTEM | 4 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 464 | `newGameMapDefaults.ts:77` | `aktywneTypyFromMapLabel` | function | SYSTEM | 4 | main.ts:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 465 | `newGameMapDefaults.ts:85` | `defaultRywaleFromMapLabel` | function | SYSTEM | 12 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 466 | `newGameMapDefaults.ts:98` | `RywaleMenuBundle` | interface | SYSTEM | 6 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 467 | `newGameMapDefaults.ts:109` | `rywaleMenuForMapLabel` | function | SYSTEM | 14 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 468 | `newGameMapDefaults.ts:125` | `typSwiataFromMenuLabel` | function | SYSTEM | 4 | main.ts:1,ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 469 | `newGameMapDefaults.ts:131` | `DEFAULT_PLAYER_CIV_ID` | const | DATA | 1 | ui:1 | - | BRAK | - | M02 | stala domyslna nowej gry |
| 470 | `newGameMapDefaults.ts:134` | `DEFAULT_START_EPOCH_ID` | const | DATA | 1 | ui:1 | - | BRAK | - | M02 | stala domyslna nowej gry |
| 471 | `newGameMapDefaults.ts:137` | `QualityTier` | type | UI | 1 | main.ts:1,data:1,perf:1,render:3,ui:1 | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 472 | `newGameMapDefaults.ts:139` | `QUALITY_MENU_LABELS` | const | UI | 1 | perf:1 | - | NIE-DOTYCZY | - | M02 | etykiety menu / jakosc renderu = UI |
| 473 | `newGameMapDefaults.ts:141` | `DEFAULT_RENDER_QUALITY` | const | UI | 1 | ui:1 | - | NIE-DOTYCZY | - | M02 | etykiety menu / jakosc renderu = UI |
| 474 | `newGameMapDefaults.ts:142` | `DEFAULT_MAP_DETAIL_QUALITY` | const | UI | 1 | - | - | NIE-DOTYCZY | - | M02 | etykiety menu / jakosc renderu = UI |
| 475 | `newGameMapDefaults.ts:154` | `qualityTierFromLabel` | function | UI | 6 | main.ts:1,ui:1 | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 476 | `newGameMapDefaults.ts:161` | `qualityTierToLabel` | function | UI | 5 | main.ts:1,ui:1 | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 477 | `newGameMapDefaults.ts:168` | `BundledMapQualityPreset` | interface | UI | 4 | - | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 478 | `newGameMapDefaults.ts:177` | `bundledMapQualityPreset` | function | UI | 3 | main.ts:1 | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 479 | `newGameMapDefaults.ts:182` | `bundledMapQualityFromLabel` | function | UI | 3 | ui:1 | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 480 | `newGameMapDefaults.ts:187` | `isLargeMapMenuLabel` | function | UI | 4 | - | - | NIE-DOTYCZY | - | - | jakosc renderu/menu (nie wplywa na stan gry) |
| 481 | `newGameMapDefaults.ts:193` | `DensityTier` | type | SYSTEM | 1 | data:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 482 | `newGameMapDefaults.ts:195` | `DENSITY_MENU_LABELS` | const | UI | 1 | - | - | NIE-DOTYCZY | - | M02 | etykiety menu / jakosc renderu = UI |
| 483 | `newGameMapDefaults.ts:197` | `densityTierFromLabel` | function | SYSTEM | 6 | game:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 484 | `newGameMapDefaults.ts:204` | `densityTierToLabel` | function | SYSTEM | 5 | game:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 485 | `newGameMapDefaults.ts:211` | `WorldGenerationPreset` | interface | SYSTEM | 7 | main.ts:1,game:1,ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 486 | `newGameMapDefaults.ts:219` | `DEFAULT_WORLD_DENSITY` | const | SYSTEM | 7 | main.ts:1,game:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 487 | `newGameMapDefaults.ts:227` | `worldGenerationPresetFromLabels` | function | SYSTEM | 16 | ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 488 | `newGameMapDefaults.ts:245` | `densityMultiplier` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 489 | `newGameMapDefaults.ts:250` | `maxRiversFromDensity` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 490 | `newGameMapDefaults.ts:264` | `maxRiversForMapAndDensity` | function | SYSTEM | 8 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 491 | `newGameMapDefaults.ts:274` | `riverMinPathLengthForTier` | function | SYSTEM | 5 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 492 | `newGameMapDefaults.ts:281` | `riverGridCellSizeForTier` | function | SYSTEM | 5 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 493 | `newGameMapDefaults.ts:298` | `riverGridTraceMinLen` | function | SYSTEM | 4 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 494 | `newGameMapDefaults.ts:304` | `RIVER_REF_AREA` | const | SYSTEM | 1 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 495 | `newGameMapDefaults.ts:306` | `riverMapAreaScale` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 496 | `newGameMapDefaults.ts:310` | `RiverMapParams` | interface | SYSTEM | 22 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 497 | `newGameMapDefaults.ts:338` | `resolveRiverMapParams` | function | SYSTEM | 50 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 498 | `newGameMapDefaults.ts:392` | `resolveRiverTraceForMap` | function | SYSTEM | 13 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 499 | `newGameMapDefaults.ts:407` | `riverTraceLimitsForMap` | function | SYSTEM | 10 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 500 | `newGameMapDefaults.ts:419` | `RESOURCE_BASELINE_RARITY_MULT` | const | SYSTEM | 1 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 501 | `newGameMapDefaults.ts:422` | `desertNoiseThresholdFromTier` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 502 | `newGameMapDefaults.ts:427` | `forestNoiseThresholdFromTier` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 503 | `newGameMapDefaults.ts:432` | `mountainNoiseThresholdFromTier` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 504 | `newGameMapDefaults.ts:437` | `highlandNoiseThresholdFromTier` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 505 | `newGameMapDefaults.ts:442` | `WorldGenOptions` | interface | SYSTEM | 16 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 506 | `newGameMapDefaults.ts:460` | `LAND_FRACTION_PERCENT_OPTS` | const | DATA | 1 | ui:1 | - | BRAK | - | M02 | stala domyslna nowej gry |
| 507 | `newGameMapDefaults.ts:462` | `LandFractionPercent` | type | DATA | 1 | ui:1 | `src/domain/playable.rs:63` | CZĘŚCIOWO | - | M02 | Rust ma pole `land_fraction_percent: u8` w parametrach rozgrywki (playable.rs), bez zbioru dozwolonych wartosci i funkcji `resolveLandFraction` |
| 508 | `newGameMapDefaults.ts:464` | `defaultLandFractionPercentForTyp` | function | SYSTEM | 7 | ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 509 | `newGameMapDefaults.ts:472` | `resolveLandFraction` | function | SYSTEM | 6 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 510 | `newGameMapDefaults.ts:479` | `scaleMaxRiversForLand` | function | SYSTEM | 10 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 511 | `newGameMapDefaults.ts:490` | `resolveWorldGenNumbers` | function | SYSTEM | 29 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 512 | `newGameMapDefaults.ts:521` | `MAX_MIAST_PANSTWA` | const | DATA | 1 | game:1 | - | BRAK | - | M02 | =9 (web_data_check.out.txt) |
| 513 | `newGameMapDefaults.ts:532` | `clampMiastaPanstwaCount` | function | SYSTEM | 6 | main.ts:1,game:1,ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 514 | `newGameMapDefaults.ts:540` | `MAX_TYPY_CYWILIZACJI_MENU` | const | DATA | 1 | ui:1 | - | BRAK | - | M02 | =15 |
| 515 | `newGameMapDefaults.ts:543` | `maxCivTypesForStartEpoch` | function | SYSTEM | 6 | ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 516 | `newGameMapDefaults.ts:589` | `EPOCH_CIV_TYPE_POOL` | const | SYSTEM | 5 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 517 | `newGameMapDefaults.ts:633` | `civTypesTripleForMapLabel` | function | SYSTEM | 19 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 518 | `newGameMapDefaults.ts:689` | `defaultMiastaPanstwaFromMapLabel` | function | SYSTEM | 5 | main.ts:1,game:1,ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 519 | `newGameMapDefaults.ts:695` | `miastaPanstwaMenuForMapLabel` | function | SYSTEM | 9 | ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 520 | `newGameMapDefaults.ts:705` | `CivTypesMenuBundle` | interface | SYSTEM | 5 | - | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 521 | `newGameMapDefaults.ts:712` | `defaultCivTypesFromMapLabel` | function | SYSTEM | 11 | main.ts:1,game:1,ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 522 | `newGameMapDefaults.ts:724` | `civTypesMenuForMapLabel` | function | SYSTEM | 17 | ui:1 | - | BRAK | - | M02 | parametry nowej gry / mapgen; wartosci tabelaryczne w `map-gen-params.json` (dane parsowane w Rust: `tm_params`), funkcje rozwiazujace NIEOBECNE |
| 523 | `newGameMapDefaults.ts:743` | `menuLabelToDims` | reexport | SYSTEM | 1 | - | - | BRAK | - | M02 | re-eksport z generator.ts |
| 524 | `newGameMapDefaults.ts:743` | `rozmiarFromMenuLabel` | reexport | SYSTEM | 1 | main.ts:1 | - | BRAK | - | M02 | re-eksport z generator.ts |
| 525 | `range-hexes.ts:13` | `RangeCityInput` | interface | SYSTEM | 10 | main.ts:1 | - | BRAK | - | M14 | zbiory hexow zasiegu (kultura/religia) -- zalezne od game/culture-religion.ts (P6.16) i okolica.ts (P6.8) |
| 526 | `range-hexes.ts:28` | `collectTerritoryHexKeysByOwner` | function | SYSTEM | 23 | main.ts:1 | - | BRAK | - | M14 | zbiory hexow zasiegu (kultura/religia) -- zalezne od game/culture-religion.ts (P6.16) i okolica.ts (P6.8) |
| 527 | `range-hexes.ts:53` | `collectCultureRangeHexKeys` | function | SYSTEM | 20 | main.ts:1 | - | BRAK | - | M14 | zbiory hexow zasiegu (kultura/religia) -- zalezne od game/culture-religion.ts (P6.16) i okolica.ts (P6.8) |
| 528 | `range-hexes.ts:75` | `collectReligionRangeHexKeys` | function | SYSTEM | 38 | main.ts:1 | - | BRAK | - | M14 | zbiory hexow zasiegu (kultura/religia) -- zalezne od game/culture-religion.ts (P6.16) i okolica.ts (P6.8) |
| 529 | `riverGenSwitch.ts:9` | `RIVER_GEN_STORAGE_KEY` | const | NIE-DOTYCZY | 1 | - | - | NIE-DOTYCZY | - | - | klucz localStorage przegladarki |
| 530 | `riverGenSwitch.ts:10` | `RIVER_GEN_PHASE_STORAGE_KEY` | const | NIE-DOTYCZY | 1 | - | - | NIE-DOTYCZY | - | - | klucz localStorage przegladarki |
| 531 | `riverGenSwitch.ts:12` | `RiverGenPhase` | type | SYSTEM | 1 | - | - | BRAK | - | M02 | enum 'main'\|'main+medium'\|'all' -> parametr generatora; domyslnie 'main+medium' (riverGenSwitch.ts:73) |
| 532 | `riverGenSwitch.ts:18` | `setRiverGenEnabledOverride` | function | NIE-DOTYCZY | 3 | - | - | NIE-DOTYCZY | - | - | override dla workera/UI (stan modulowy) |
| 533 | `riverGenSwitch.ts:22` | `setRiverGenPhaseOverride` | function | NIE-DOTYCZY | 3 | - | - | NIE-DOTYCZY | - | - | override dla workera/UI (stan modulowy) |
| 534 | `riverGenSwitch.ts:38` | `getRiverGenEnabled` | function | SYSTEM | 14 | ui:2 | - | BRAK | - | M02 | odczyt URL/localStorage = NIE-DOTYCZY; domyslna wartosc `true` (riverGenSwitch.ts:53) -> parametr `rivers_enabled` generatora |
| 535 | `riverGenSwitch.ts:57` | `getRiverGenPhase` | function | SYSTEM | 15 | ui:1 | - | BRAK | - | M02 | odczyt URL/localStorage = NIE-DOTYCZY; domyslna 'main+medium' -> parametr |
| 536 | `riverGenSwitch.ts:76` | `isRiverGenMainOnly` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | predykat na parametrze fazy |
| 537 | `riverGenSwitch.ts:81` | `isRiverGenFull` | function | SYSTEM | 3 | - | - | BRAK | - | M02 | predykat na parametrze fazy |
| 538 | `road-movement.ts:14` | `ROAD_MOVE_SPEED_MULT` | const | DATA | 1 | units:1 | `src/data/derived.rs:698` | CZĘŚCIOWO | `tests/road_movement_multipliers.rs:13` | M15 | wartosc w `road-movement-multipliers.json` zapisana z odczytu TS (P3-23); test w repo BEZ pinow wartosci (road_movement_multipliers.rs:1-3), wartosci sprawdza poza repo verify-road-web.py -- dodac pin w M15 |
| 539 | `road-movement.ts:29` | `ROAD_BRUK_MOVE_SPEED_MULT` | const | DATA | 1 | units:1 | `src/data/derived.rs:698` | CZĘŚCIOWO | `tests/road_movement_multipliers.rs:13` | M15 | wartosc w `road-movement-multipliers.json` zapisana z odczytu TS (P3-23); test w repo BEZ pinow wartosci (road_movement_multipliers.rs:1-3), wartosci sprawdza poza repo verify-road-web.py -- dodac pin w M15 |
| 540 | `road-movement.ts:32` | `ROAD_MIN_MOVE_COST` | const | DATA | 1 | - | `src/data/derived.rs:698` | CZĘŚCIOWO | `tests/road_movement_multipliers.rs:13` | M15 | wartosc w `road-movement-multipliers.json` zapisana z odczytu TS (P3-23); test w repo BEZ pinow wartosci (road_movement_multipliers.rs:1-3), wartosci sprawdza poza repo verify-road-web.py -- dodac pin w M15 |
| 541 | `road-movement.ts:57` | `ROAD_BRUK_MIN_MOVE_COST` | const | DATA | 1 | - | `src/data/derived.rs:698` | CZĘŚCIOWO | `tests/road_movement_multipliers.rs:13` | M15 | wartosc w `road-movement-multipliers.json` zapisana z odczytu TS (P3-23); test w repo BEZ pinow wartosci (road_movement_multipliers.rs:1-3), wartosci sprawdza poza repo verify-road-web.py -- dodac pin w M15 |
| 542 | `road-movement.ts:59` | `isRoadImprovementKey` | function | SYSTEM | 3 | main.ts:1 | - | BRAK | - | M15 | Rust ma enum `ImprovementKey::Road/PavedRoad`; predykat po kluczu tekstowym ('droga'\|'droga_brukowana') nieobecny |
| 543 | `road-movement.ts:64` | `hexHasRoad` | function | SYSTEM | 4 | main.ts:1,game:1 | - | BRAK | - | M15 | brak odpowiednika |
| 544 | `road-movement.ts:73` | `applyRoadMovementModifier` | function | SYSTEM | 12 | units:1 | `src/domain/pathfinding.rs:284`<br>`src/domain/pathfinding.rs:251` | CZĘŚCIOWO | - | M15 | Rust `movement_cost_with_rules` dzieli koszt przez dzielnik drogi; wywolanie z petli gry BRAK (P3-23 ZALOZENIE 1); brak testu wektorowego weba |
| 545 | `road-network.ts:32` | `ROAD_DIRS` | const | UI | 3 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 546 | `road-network.ts:37` | `ROAD_MASK_NONE` | const | UI | 1 | main.ts:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 547 | `road-network.ts:39` | `ROAD_MASK_FULL` | const | UI | 1 | main.ts:1,render:2 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 548 | `road-network.ts:42` | `ROAD_NODE_MIN_ARMS` | const | UI | 1 | - | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 549 | `road-network.ts:54` | `ROAD_ARM_WIDTH_RATIO` | const | UI | 1 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 550 | `road-network.ts:55` | `ROAD_NODE_RADIUS_RATIO` | const | UI | 1 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 551 | `road-network.ts:60` | `roadDirBit` | function | UI | 3 | - | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 552 | `road-network.ts:65` | `roadMaskHasDir` | function | UI | 3 | - | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 553 | `road-network.ts:75` | `computeRoadMask` | function | UI | 12 | main.ts:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 554 | `road-network.ts:89` | `roadMaskArms` | function | UI | 7 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 555 | `road-network.ts:98` | `roadArmCount` | function | UI | 7 | - | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 556 | `road-network.ts:111` | `roadMaskHasNode` | function | UI | 3 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 557 | `road-network.ts:125` | `roadMaskIsLonePatch` | function | UI | 3 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 558 | `road-network.ts:137` | `roadPortOffset` | function | UI | 7 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 559 | `road-network.ts:146` | `roadPortRotationY` | function | UI | 4 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 560 | `road-network.ts:152` | `roadArmLength` | function | UI | 3 | render:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 561 | `road-network.ts:170` | `roadHexesToRefresh` | function | UI | 13 | main.ts:1 | - | NIE-DOTYCZY | - | - | maska/geometria laczen drog do renderu (13 symboli uzywanych tylko w render/ i main.ts) |
| 562 | `startScoring.ts:14` | `START_REVEAL_RADIUS` | const | DATA | 1 | - | `src/domain/player.rs:111` | CZĘŚCIOWO | `tests/p6_1_first_player_city.rs:80` | M10 | Rust przyjmuje promien jako parametr; stala 5 nieobecna |
| 563 | `startScoring.ts:17` | `startRevealRadiusForDifficulty` | function | SYSTEM | 7 | main.ts:1 | - | BRAK | - | M10 | easy=10 / normal=8 / hard=5; Rust `is_hex_in_start_reveal` ma parametr, ale mapa trudnosc->promien nieobecna |
| 564 | `startScoring.ts:51` | `scoreCityStartHex` | function | SYSTEM | 39 | - | - | BRAK | - | M10 | punktacja startu (rzeka +14, sasiad rzeki +8, ...) |
| 565 | `startScoring.ts:102` | `findBestPlayerStartHex` | function | SYSTEM | 36 | units:1 | - | BRAK | - | M10 | zalezy od clusters.ts: groupHabitableMasses, passesPlayerStartMassGate, developmentSpaceScore (domkniecie AST: 19 deklaracji `clusters.ts`/159 LOC, callgraph-startscoring.txt) |
| 566 | `territory-border.ts:18` | `BorderLoopPoint` | interface | UI | 4 | render:1 | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 567 | `territory-border.ts:23` | `BorderEdge` | interface | UI | 9 | - | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 568 | `territory-border.ts:76` | `collectTerritoryBoundaryEdges` | function | UI | 32 | render:1 | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 569 | `territory-border.ts:180` | `traceTerritoryBoundaryLoops` | function | UI | 38 | render:1 | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 570 | `territory-border.ts:227` | `computeTerritoryBorderLoops` | function | UI | 7 | render:1 | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 571 | `territory-border.ts:236` | `makeAxialHexCenterFn` | function | UI | 3 | - | - | NIE-DOTYCZY | - | - | geometria obrysu granic do renderu (render/rangeOverlay.ts); zero konsumentow logiki |
| 572 | `territory-work.ts:8` | `TerritoryNode` | reexport-type | SYSTEM | 1 | main.ts:1,game:8 | `src/domain/trade.rs:265` | CZĘŚCIOWO | - | M14 | re-eksport typu z territory.ts |
| 573 | `territory-work.ts:10` | `buildTerritoryNodesFromCities` | function | SYSTEM | 11 | game:2,ui:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 574 | `territory-work.ts:26` | `isTerritoryHexOwnedBy` | function | SYSTEM | 9 | main.ts:1,game:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 575 | `territory-work.ts:37` | `makeTerritoryWorkableFilter` | function | SYSTEM | 10 | game:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 576 | `territory-work.ts:55` | `cityCenterKeys` | function | SYSTEM | 5 | main.ts:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 577 | `territory-work.ts:77` | `isReczneKeyLegal` | function | SYSTEM | 16 | main.ts:1,ui:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 578 | `territory-work.ts:106` | `reconcileWorkedTilesForOwner` | function | SYSTEM | 48 | main.ts:1,game:1,ui:1 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 579 | `territory-work.ts:156` | `reconcileAllWorkedTiles` | function | SYSTEM | 11 | main.ts:1,game:2 | - | BRAK | - | M14 | praca na heksach terytorium (reczne/auto), zalezne od game/cities.ts (P6.6) |
| 580 | `territory.ts:23` | `CityNode` | interface | SYSTEM | 12 | main.ts:1,game:2 | - | BRAK | - | M14 | Rust `TerritoryNode` ma pole `radius` z gory (nie pop/isFort/isOutpost) |
| 581 | `territory.ts:37` | `TerritoryNode` | type | SYSTEM | 1 | main.ts:1,game:8 | `src/domain/trade.rs:265` | CZĘŚCIOWO | - | M14 | Rust `TerritoryNode{owner_id,q,r,radius}` (trade.rs) -- inny ksztalt (radius zamiast pop/fort/outpost) |
| 582 | `territory.ts:47` | `axialDistance` | function | SYSTEM | 5 | game:3 | `src/domain/hex.rs:64` | CZĘŚCIOWO | `tests/hex_terrain.rs:21` | M14 | ta sama formula (cube/2) co `HexCoord::distance`; test geometrii, nie wektor weba |
| 583 | `territory.ts:57` | `cityRangeForPopulation` | reexport | SYSTEM | 1 | main.ts:1,game:3,ui:1 | - | BRAK | - | M14 | re-eksport z game/okolica.ts (P6.8); w Rust brak (`grep city_range`=0) |
| 584 | `territory.ts:57` | `citySightRadius` | reexport | SYSTEM | 1 | main.ts:1,game:5 | - | BRAK | - | M14 | re-eksport z game/okolica.ts (P6.8); w Rust brak (`grep city_range`=0) |
| 585 | `territory.ts:57` | `CITY_RANGE_CAP` | reexport | SYSTEM | 1 | game:1 | - | BRAK | - | M14 | re-eksport z game/okolica.ts (P6.8); w Rust brak (`grep city_range`=0) |
| 586 | `territory.ts:57` | `CITY_RANGE_MIN` | reexport | SYSTEM | 1 | game:1 | - | BRAK | - | M14 | re-eksport z game/okolica.ts (P6.8); w Rust brak (`grep city_range`=0) |
| 587 | `territory.ts:74` | `cityTerritoryRadius` | function | SYSTEM | 5 | main.ts:1,game:5 | - | BRAK | - | M14 | fort=10, posterunek=5, miasto=cityRangeForPopulation; Rust przyjmuje radius od wywolujacego (komentarz trade.rs:262) |
| 588 | `territory.ts:92` | `isInTerritory` | function | SYSTEM | 6 | main.ts:1,game:1 | - | BRAK | - | M14 | brak odpowiednika |
| 589 | `territory.ts:106` | `territoryOwnerAt` | function | SYSTEM | 18 | main.ts:1,game:5 | `src/domain/trade.rs:549` | CZĘŚCIOWO | - | M14 | ta sama regula (najblizszy w promieniu, remis -> pierwszy) wg odczytu; funkcja PRYWATNA w trade.rs, brak testu wektorowego weba |
| 590 | `territory.ts:133` | `isPlayerTerritoryHex` | function | SYSTEM | 13 | main.ts:1 | - | BRAK | - | M14 | brak odpowiednika |
| 591 | `villages.ts:30` | `VILLAGE_HUTS_PER_CITY` | const | DATA | 5 | - | - | BRAK | - | M13 | {hard:1, normal:2, easy:3} |
| 592 | `villages.ts:37` | `VILLAGE_LAND_HEX_PER_VILLAGE` | const | DATA | 1 | - | - | BRAK | - | M13 | @deprecated (legacy fallback) |
| 593 | `villages.ts:40` | `expectedStartCityCount` | function | SYSTEM | 5 | - | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 594 | `villages.ts:46` | `villageHutsPerCityMultiplier` | function | SYSTEM | 3 | - | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 595 | `villages.ts:51` | `targetVillageHutCount` | function | SYSTEM | 7 | - | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 596 | `villages.ts:63` | `VILLAGE_MIN_DIST_FROM_CITY` | const | DATA | 1 | - | - | BRAK | - | M13 | =3 |
| 597 | `villages.ts:69` | `VILLAGE_MIN_SPACING` | const | DATA | 1 | - | - | BRAK | - | M13 | =3 |
| 598 | `villages.ts:76` | `VillageSite` | interface | SYSTEM | 4 | - | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 599 | `villages.ts:82` | `QRLike` | interface | SYSTEM | 4 | - | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 600 | `villages.ts:143` | `placeVillages` | function | SYSTEM | 59 | main.ts:1 | - | BRAK | - | M13 | wioski/chaty (LCG Numerical Recipes, nie mulberry) |
| 601 | `wonder-placement.ts:11` | `WonderPlacementCity` | interface | SYSTEM | 7 | - | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |
| 602 | `wonder-placement.ts:19` | `PickWonderHexInput` | interface | SYSTEM | 8 | - | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |
| 603 | `wonder-placement.ts:53` | `listQualifyingWonderHexesForCity` | function | SYSTEM | 27 | - | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |
| 604 | `wonder-placement.ts:83` | `WonderMapPlacementInput` | interface | SYSTEM | 8 | - | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |
| 605 | `wonder-placement.ts:93` | `listQualifyingWonderHexesForOwner` | function | SYSTEM | 18 | main.ts:1 | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |
| 606 | `wonder-placement.ts:116` | `pickWonderHexForCity` | function | SYSTEM | 4 | main.ts:1 | - | BRAK | - | M14 | kwalifikacja hexow pod cuda; zalezne od territory.ts i units/setup (hexDistance) |

## 5. Graf zaleznosci tematow

Importy plikowe: `imports.tsv` (skryptowo). Najwazniejsze krawedzie wewnatrz `map/`: `generator.ts -> gen-helpers, startScoring, villages, newGameMapDefaults, riverGenSwitch`; `gen-helpers.ts -> newGameMapDefaults, riverGenSwitch, earth-land-mask`; `newGameMapDefaults.ts -> gen-helpers, generator` (cykl typu); `startScoring.ts -> clusters`; `cluster-spawn.ts -> clusters, gen-helpers`; `clusters.ts -> gen-helpers`; `territory-work.ts, range-hexes.ts, wonder-placement.ts, improvement-build.ts -> territory`. Zaleznosci ZEWNETRZNE istotne dla kolejnosci: `game/okolica` (P6.8), `game/cities` (P6.6), `game/culture-religion` (P6.16), `game/terrain-improvements` (P6.3), `game/civ-entry-epoch` (P6.1, zrobione), `game/civ-names`/`city-names-pool` (P6.1D, zrobione), `units/setup` (`hexDistance`, `isWaterTerrain`, `keyOf` - katalog `units/` NIE objety ani P6.0, ani P6.25), `types/hex`/`types/map` (NIE objete), `data/*-loader` (loadery JSON; dane sa w Rust).

Konsumenci logiki spoza `map/` (zrodlo: `grep -rnE "from .*map/"` na `gra/src`): `game/ai.ts, ai-difficulty-bonus.ts, auto-improvements.ts, auto-manage.ts, border-march-scan.ts, fort-territory.ts, population-growth-v85.ts, trade-routes.ts, turn-economy.ts` -> `map/territory`; `game/cluster-start.ts` -> `map/cluster-spawn`; `game/okolica.ts, turn-economy.ts` -> `map/territory-work`; `game/resource-access.ts` -> `map/deposit-era`, `map/improvement-build`; `game/save.ts, load-map-source.ts` -> `map/mapSnapshot`; `units/setup.ts` -> `map/road-movement`, `map/startScoring`. Pozostale importy (`ui/`, `render/`) to UI.

## 6. Backlog `P6.M-*`

Rozmiar = suma LOC niepustych zakresow plikow web przypisanych do tematu (progi: S < 300, M 300-999, L 1000-1999, XL >= 2000). Temat bez zakresow web (M00) = S. Allowlisty to sciezki Rust wzgledem `rust-port/engine/` (poza testami `tests/p6_m<NN>_*`, ktore sa nowe i per temat). **Wszystkie nowe pliki generatora leza w `src/domain/mapgen/` i sa tworzone jako PUSTE przez M00**, dzieki czemu pozostale tematy edytuja tylko wlasne pliki (rozlaczne allowlisty) - ZALOZENIE Z1.

| ID tematu (gotowe do dispatchu) | LOC web | rozmiar | zakres web | allowlista Rust | zaleznosci | rownoleglosc |
|---|---|---|---|---|---|---|
| `R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1` | 0 | S | - | `src/domain/mod.rs`<br>`src/domain/mapgen/mod.rs`<br>`src/domain/mapgen/types.rs`<br>`src/domain/mapgen/prims.rs`<br>`src/domain/mapgen/masks.rs`<br>`src/domain/mapgen/terrain_class.rs`<br>`src/domain/mapgen/relief.rs`<br>`src/domain/mapgen/landsea.rs`<br>`src/domain/mapgen/coast.rs`<br>`src/domain/mapgen/rivers_a.rs`<br>`src/domain/mapgen/rivers_b.rs`<br>`src/domain/mapgen/rivers_c.rs`<br>`src/domain/mapgen/rivers_d.rs`<br>`src/domain/mapgen/rivers_e1.rs`<br>`src/domain/mapgen/rivers_e2.rs`<br>`src/domain/mapgen/deposits.rs`<br>`src/domain/mapgen/starts.rs`<br>`src/domain/mapgen/params.rs`<br>`src/domain/mapgen/cluster_rivals.rs`<br>`src/domain/mapgen/cluster_mass.rs`<br>`src/domain/mapgen/cluster_layout.rs`<br>`src/domain/mapgen/cluster_compute.rs`<br>`src/domain/mapgen/villages.rs`<br>`src/domain/mapgen/generate.rs`<br>`src/domain/territory.rs`<br>`src/domain/wonder_placement.rs`<br>`src/domain/roads.rs`<br>`src/domain/improvement_build.rs`<br>`src/domain/map_snapshot.rs`<br>`tests/p6_m00_*.rs` | P5 zamkniete | start (pierwszy) |
| `R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1` | 682 | M | `earth-land-mask.generated.ts`:1-417, `earth-land-mask.ts`:21-26, `earth-land-mask.ts`:28-31, `earth-land-mask.ts`:33-36, `earth-land-mask.ts`:51-52, `earth-land-mask.ts`:79-96, `earth-land-mask.ts`:98-127, `earth-land-mask.ts`:147-170, `gen-helpers.ts`:33-232, `gen-helpers.ts`:237-251 | `src/domain/map_generator.rs`<br>`tests/p6_m01_*.rs`<br>`tests/p6_m01_vectors/**`<br>`src/domain/mapgen/prims.rs` | M00 | po M00; rownolegle z M02/M09/M14/M15/M17 |
| `R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1` | 814 | M | `deposit-era.ts`:1-46, `generator.ts`:762-818, `generator.ts`:844-844, `newGameMapDefaults.ts`:1-743, `riverGenSwitch.ts`:1-83 | `src/domain/mapgen/params.rs`<br>`data/derived/mapgen-*.json`<br>`tests/p6_m02_*.rs`<br>`tests/p6_m02_vectors/**` | M00; dane `map-gen-params.json` (istnieja: `data/terrain_map.rs`) | po M00; rownolegle z M01/M09/M14/M15/M17 |
| `R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1` | 591 | M | `earth-land-mask.ts`:1-20, `earth-land-mask.ts`:27-27, `earth-land-mask.ts`:32-32, `earth-land-mask.ts`:37-50, `earth-land-mask.ts`:53-78, `earth-land-mask.ts`:97-97, `earth-land-mask.ts`:128-146, `gen-helpers.ts`:252-824 | `src/domain/mapgen/masks.rs`<br>`tests/p6_m03_*.rs`<br>`tests/p6_m03_vectors/**` | M01, M02 | po M01+M02; rownolegle z M04 |
| `R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1` | 534 | M | `gen-helpers.ts`:233-236, `gen-helpers.ts`:825-1407 | `src/domain/mapgen/terrain_class.rs`<br>`tests/p6_m04_*.rs`<br>`tests/p6_m04_vectors/**` | M01, M02 | po M01+M02; rownolegle z M03 |
| `R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1` | 883 | M | `gen-helpers.ts`:1408-2365 | `src/domain/mapgen/relief.rs`<br>`tests/p6_m05a_*.rs`<br>`tests/p6_m05a_vectors/**` | M03, M04 | sekwencyjnie M05A -> M05B (wspolny `relief.rs`) |
| `R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1` | 778 | M | `gen-helpers.ts`:2366-3185 | `src/domain/mapgen/relief.rs`<br>`tests/p6_m05b_*.rs`<br>`tests/p6_m05b_vectors/**` | M05A | po M05A (ten sam plik) |
| `R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1` | 1118 | L | `gen-helpers.ts`:3186-4374 | `src/domain/mapgen/landsea.rs`<br>`tests/p6_m06a_*.rs`<br>`tests/p6_m06a_vectors/**` | M05B | sekwencyjnie M06A -> M06B |
| `R-RUSTPORT-P6-M06B-LAD-MORZE-WYBRZEZE-B-Q1` | 693 | M | `gen-helpers.ts`:4375-5120 | `src/domain/mapgen/coast.rs`<br>`tests/p6_m06b_*.rs`<br>`tests/p6_m06b_vectors/**` | M06A | po M06A |
| `R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1` | 879 | M | `gen-helpers.ts`:5121-6068 | `src/domain/mapgen/rivers_a.rs`<br>`tests/p6_m07a_*.rs`<br>`tests/p6_m07a_vectors/**` | M06B | lancuch M07A -> M07B -> M07C -> M07D -> M07E1 -> M07E2 (zaleznosci funkcji) |
| `R-RUSTPORT-P6-M07B-RZEKI-B-TRACE-Q1` | 1093 | L | `gen-helpers.ts`:6069-7249 | `src/domain/mapgen/rivers_b.rs`<br>`tests/p6_m07b_*.rs`<br>`tests/p6_m07b_vectors/**` | M07A | po M07A |
| `R-RUSTPORT-P6-M07C-RZEKI-C-DOPLYWY-SREDNIE-Q1` | 1010 | L | `gen-helpers.ts`:7250-8337 | `src/domain/mapgen/rivers_c.rs`<br>`tests/p6_m07c_*.rs`<br>`tests/p6_m07c_vectors/**` | M07B | po M07B |
| `R-RUSTPORT-P6-M07D-RZEKI-D-WALIDACJA-PRZYCINANIE-Q1` | 1141 | L | `gen-helpers.ts`:8338-9558 | `src/domain/mapgen/rivers_d.rs`<br>`tests/p6_m07d_*.rs`<br>`tests/p6_m07d_vectors/**` | M07C | po M07C |
| `R-RUSTPORT-P6-M07E1-RZEKI-E1-UZUPELNIENIA-Q1` | 893 | M | `gen-helpers.ts`:9559-10530 | `src/domain/mapgen/rivers_e1.rs`<br>`tests/p6_m07e1_*.rs`<br>`tests/p6_m07e1_vectors/**` | M07D | po M07D |
| `R-RUSTPORT-P6-M07E2-RZEKI-E2-GENERATE-RIVERS-Q1` | 1302 | L | `gen-helpers.ts`:10531-11928 | `src/domain/mapgen/rivers_e2.rs`<br>`tests/p6_m07e2_*.rs`<br>`tests/p6_m07e2_vectors/**` | M07E1 | po M07E1 |
| `R-RUSTPORT-P6-M08-ZLOZA-LAS-FAIRPLAY-Q1` | 511 | M | `gen-helpers.ts`:11929-12474 | `src/domain/mapgen/deposits.rs`<br>`tests/p6_m08_*.rs`<br>`tests/p6_m08_vectors/**` | M02, M06B | po M02+M06B; rownolegle z M07* |
| `R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1` | 484 | M | `cluster-spawn.ts`:71-165, `cluster-spawn.ts`:194-208, `clusters.ts`:38-58, `clusters.ts`:168-175, `clusters.ts`:1346-1350, `clusters.ts`:1538-1542, `clusters.ts`:1544-1552, `clusters.ts`:1770-1800, `clusters.ts`:1847-1867, `clusters.ts`:1869-1873, `clusters.ts`:1875-1892, `clusters.ts`:1894-1904, `clusters.ts`:1906-1967, `clusters.ts`:1969-2030, `clusters.ts`:2032-2139, `clusters.ts`:2141-2165 | `src/domain/mapgen/cluster_rivals.rs`<br>`tests/p6_m09_*.rs`<br>`tests/p6_m09_vectors/**` | M00 (+ P6.1D `city_names.rs` zrobione) | po M00; rownolegle z M01/M02/M14/M15/M17; ODBLOKOWUJE CZESC RUNDY-2 P6.1C (`buildSameTypeRival*`); pelne zasilenie `build_cluster_start_plan` wynikiem Rust dopiero po M12 |
| `R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1` | 1283 | L | `clusters.ts`:59-126, `clusters.ts`:145-167, `clusters.ts`:176-1345, `startScoring.ts`:1-142 | `src/domain/mapgen/cluster_mass.rs`<br>`tests/p6_m10_*.rs`<br>`tests/p6_m10_vectors/**` | M00, M01, M09 (stale/typy) | po M09; sekwencyjnie M10 -> M11 |
| `R-RUSTPORT-P6-M11-KLASTRY-UKLAD-STOLIC-Q1` | 1517 | L | `clusters.ts`:1351-1537, `clusters.ts`:1543-1543, `clusters.ts`:1553-1769, `clusters.ts`:1801-1846, `clusters.ts`:1868-1868, `clusters.ts`:1874-1874, `clusters.ts`:1893-1893, `clusters.ts`:1905-1905, `clusters.ts`:1968-1968, `clusters.ts`:2031-2031, `clusters.ts`:2140-2140, `clusters.ts`:2166-3361 | `src/domain/mapgen/cluster_layout.rs`<br>`tests/p6_m11_*.rs`<br>`tests/p6_m11_vectors/**` | M10 | po M10 |
| `R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1` | 1126 | L | `cluster-spawn.ts`:54-69, `cluster-spawn.ts`:166-188, `cluster-spawn.ts`:210-445, `clusters.ts`:127-144, `clusters.ts`:3362-4250 | `src/domain/mapgen/cluster_compute.rs`<br>`tests/p6_m12_*.rs`<br>`tests/p6_m12_vectors/**` | M11, M07E2 (mapa ze sztywnymi hexami z weba -- `maps.json`), P6.1D | po M11 |
| `R-RUSTPORT-P6-M13-STARTY-WIOSKI-Q1` | 263 | S | `gen-helpers.ts`:12475-12561, `villages.ts`:1-214 | `src/domain/mapgen/starts.rs`<br>`src/domain/mapgen/villages.rs`<br>`tests/p6_m13_*.rs`<br>`tests/p6_m13_vectors/**` | M06B (teren), M10 | po M10; rownolegle z M11/M14 |
| `R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1` | 503 | M | `range-hexes.ts`:1-115, `territory-work.ts`:1-166, `territory.ts`:1-145, `wonder-placement.ts`:1-119 | `src/domain/territory.rs`<br>`src/domain/wonder_placement.rs`<br>`tests/p6_m14_*.rs`<br>`tests/p6_m14_vectors/**` | P6.8 (`cityRangeForPopulation`/`citySightRadius` z `okolica.ts`) -- ZALOZENIE Z5: do czasu P6.8 promien dostarcza wywolujacy | rownolegle z M01/M02/M09/M15/M17 (nowe pliki) |
| `R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1` | 87 | S | `improvement-build.ts`:1559-1569, `road-movement.ts`:1-84 | `src/domain/roads.rs`<br>`tests/p6_m15_*.rs`<br>`tests/p6_m15_vectors/**` | M00 | rownolegle z M01/M02/M09/M14/M17 |
| `R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1` | 1398 | L | `improvement-build.ts`:50-1558 | `src/domain/improvement_build.rs`<br>`tests/p6_m16_*.rs`<br>`tests/p6_m16_vectors/**` | P6.3 (terrain-improvements), M00 | po P6.3; rownolegle z M10/M14 |
| `R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1` | 380 | M | `mapSnapshot.ts`:1-404 | `src/domain/map_snapshot.rs`<br>`tests/p6_m17_*.rs`<br>`tests/p6_m17_vectors/**` | M00 (model `MapHex`) | rownolegle z M01/M02/M09/M14/M15; PRZED P6.20 |
| `R-RUSTPORT-P6-M18-GENERATE-MAP-ORKIESTRACJA-Q1` | 646 | M | `generator.ts`:100-761, `generator.ts`:819-843, `generator.ts`:845-848 | `src/domain/mapgen/generate.rs`<br>`src/domain/map_generator.rs`<br>`tests/p6_m18_*.rs`<br>`tests/p6_m18_vectors/**` | M01..M08, M12, M13 (cala potoki) | OSTATNI z M*; po wszystkich |

### 6a. Tytuly / opisy (do dispatchu)

- **`R-RUSTPORT-P6-M00-MAPGEN-SZKIELET-Q1`** (S, 0 LOC web): Tworzy katalog `domain/mapgen/` z pustymi plikami `//!` (po jednym na temat) oraz puste moduly `territory.rs`, `wonder_placement.rs`, `roads.rs`, `improvement_build.rs`, `map_snapshot.rs` (M14-M17) z deklaracjami `pub mod` w `domain/mod.rs` (jedyna edycja `mod.rs` w calym backlogu M) + model `MapHex` (`types.rs`, z `gra/src/types/hex.ts` -- patrz ZALOZENIE Z2). Dzieki temu kolejne tematy edytuja WYLACZNIE wlasne pliki (rozlaczne allowlisty).
- **`R-RUSTPORT-P6-M01-RDZEN-WERYFIKACJA-Q1`** (M, 682 LOC web): ZAMRAZA istniejacy rdzen testami wektorowymi z weba (Node): noise/fbm/perm, 4 maski, klimat (sweep h=6..130), hex, Mulberry32 (jedna implementacja zamiast dwoch: `rng.rs:118` i `map_generator.rs:207`), maska Ziemi (dane bit-w-bit). Bez nowej logiki.
- **`R-RUSTPORT-P6-M02-PARAMETRY-NOWEJ-GRY-Q1`** (M, 814 LOC web): Progi gestosci/rzek/zasobow (`resolveWorldGenNumbers`, `resolveRiverMapParams`...), etykiety rozmiarow, pule typow cywilizacji per epoka (`EPOCH_CIV_TYPE_POOL`), `RiverGenPhase` jako PARAMETR (bez URL/localStorage), `zlozeMinEraFor`/`isDepositVisible` (`deposit-era.ts`).
- **`R-RUSTPORT-P6-M03-MASKI-CENTRA-UZUPELNIENIE-Q1`** (M, 591 LOC web): Reszta maski/centrow nieobecna w Rust: `nearestContinentZoneIndex`, `assignContinentIndices`, `assignIslandGridIndices`, `landMaskAt`, `mapIsotropicFromCenter` itd.; wektory dla wielu wymiarow/ziaren (dzis tylko 36x28 seed 42).
- **`R-RUSTPORT-P6-M04-TEREN-KLASYFIKACJA-GRANICE-Q1`** (M, 534 LOC web): `classifyTerrain` z progami tier-ow gestosci (Rust: tylko progi domyslne), `classifyTerrainFlat`, `reapplyForestOverlay`, `reapplyLandTerrain`, `reliefLandFractions`, brzeg/margines mapy (`isInMapBorder`, `enforceMapBorderOcean`, `applyMarginalLandZoneCaps`), `terrainCellBias` (zrobione).
- **`R-RUSTPORT-P6-M05A-RELIEF-A-MASY-POKRYCIE-Q1`** (M, 883 LOC web): Grupowanie mas ladu, centroidy, kwadraty kontynentow, `applyReliefByNoiseRank`, rozmiary komorek pokrycia, pakiety Fe/Cu/relief.
- **`R-RUSTPORT-P6-M05B-RELIEF-B-POKRYCIE-PASMA-Q1`** (M, 778 LOC web): `ensureReliefGridCoverage`, `capReliefClusterSizeSafetyNet`, `growMountainRanges` (najwieksze funkcje reliefu).
- **`R-RUSTPORT-P6-M06A-LAD-MORZE-WYBRZEZE-A-Q1`** (L, 1118 LOC web): Bilans ladu/morza (`applyLandFractionByScore`, `rebalance*`), klimat na heksach, pierscienie wybrzeza (`applyCoastRing`, `applyDoubleCoastRing`), wody srodladowe.
- **`R-RUSTPORT-P6-M06B-LAD-MORZE-WYBRZEZE-B-Q1`** (M, 693 LOC web): Pangea: jeden kontynent i korytarze, `finalizeCoastAndInlandWater`, wyspy-drobnica, `enforceTargetDryLandFraction`.
- **`R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1`** (M, 879 LOC web): Stale rzek, `riversQuotaForLandMass`, sanityzacja sciezek, pola odleglosci (`buildSeaDistanceField`), cache pol rzek. Dev-profiler rzek = NIE-DOTYCZY.
- **`R-RUSTPORT-P6-M07B-RZEKI-B-TRACE-Q1`** (L, 1093 LOC web): `traceRiver` (najwieksza funkcja pliku), okna skretu, separacja.
- **`R-RUSTPORT-P6-M07C-RZEKI-C-DOPLYWY-SREDNIE-Q1`** (L, 1010 LOC web): `syncRiverEdgeBonusHexes`, przyciecia zawiniec, `growMediumTributaryFromMain`, `clearRiverMarks`.
- **`R-RUSTPORT-P6-M07D-RZEKI-D-WALIDACJA-PRZYCINANIE-Q1`** (L, 1141 LOC web): Spojnosc sieci, `pruneOrphanRiverPaths`, `ensureRiverOutlets`, indeks przestrzenny rzek (`RiverHexSpatialIndex`).
- **`R-RUSTPORT-P6-M07E1-RZEKI-E1-UZUPELNIENIA-Q1`** (M, 893 LOC web): Luki ujsc glownych rzek, pokrycie siatka, odleglosc do rzeki.
- **`R-RUSTPORT-P6-M07E2-RZEKI-E2-GENERATE-RIVERS-Q1`** (L, 1302 LOC web): `generateRivers` (:11525) i `topUpRiverGridCoverage` (:11777); porownanie `riverPaths`/`rzeka` z `maps.json` (5 map).
- **`R-RUSTPORT-P6-M08-ZLOZA-LAS-FAIRPLAY-Q1`** (M, 511 LOC web): `placeDeposits`, `ensureDepositGridCoverage`, `ensureForestGridCoverage`, `stripDepositsFromWater`. Widocznosc zloz per epoka (`deposit-era.ts`) przechodzi z M02 -- UWAGA: `deposit-era.ts` liczony w M02 (dane+funkcje), M08 tylko je wola.
- **`R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1`** (M, 484 LOC web): Wycinek P6.1C: `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters` + PELNE domkniecie AST (callgraph-rivals.txt): 17 deklaracji `clusters.ts` (334 LOC; w tym stale `CLUSTER_CITY_STATE_MIN_HEX` :42, `CLUSTER_CITY_STATE_MAX_HEX` :47, `MIN_DIST_START_CITY_STATE` :49, `CLUSTER_GROWTH_RESERVE` :58) + 5 deklaracji `cluster-spawn.ts` (98 LOC; 2 typy P6.1C juz w Rust pominiete); +3 z `gen-helpers.ts` (mulberry32, HEX_DIRECTIONS, hexDistanceAxial: istnieja w Rust, poza zakresem). UWAGA: `MIN_DIST_START_CITY_STATE=5` (clusters.ts:49) != `MIN_CITY_DISTANCE_START_CITY_STATE=3` (cities.ts:1122, w Rust `start-cluster-params.json`); stala :49 jest uzywana w wycinku przez `cluster-spawn.ts:106,148`, poza nim w `clusters.ts:56,1835-1836,3399`.
- **`R-RUSTPORT-P6-M10-KLASTRY-MASY-BRAMKI-Q1`** (L, 1283 LOC web): Bramki mas ladu (`groupHabitableMasses`, `passesPlayerStartMassGate`, `developmentSpaceScore` -- domkniecie AST `startScoring.ts`: 19 deklaracji `clusters.ts`/159 LOC + 7 z `startScoring.ts`/92 LOC, callgraph-startscoring.txt), `allocateTypyToMasses`, `placeClusterCentersAcrossLandmasses`, roster typow, `scoreCityStartHex`/`findBestPlayerStartHex`.
- **`R-RUSTPORT-P6-M11-KLASTRY-UKLAD-STOLIC-Q1`** (L, 1517 LOC web): Promienie klastra, pasma odleglosci od morza, separacje stolic, `pickSpawnHexWithCapitalGates`, `packCityStates*`, `buildClusterLayoutWithEdgeCapital` (~2000 linii).
- **`R-RUSTPORT-P6-M12-KLASTRY-COMPUTE-SPAWN-PLAN-Q1`** (L, 1126 LOC web): `computeClusters` i `buildClusterSpawnPlan`; wynik porownywany z `buildClusterSpawnPlan` weba na `maps.json` (k42/k7/p123/k3small/w5).
- **`R-RUSTPORT-P6-M13-STARTY-WIOSKI-Q1`** (S, 263 LOC web): `computeStartPositions`, `placeVillages` (LCG, nie mulberry), `targetVillageHutCount`.
- **`R-RUSTPORT-P6-M14-TERYTORIUM-ZASIEG-CUDA-Q1`** (M, 503 LOC web): `territoryOwnerAt`, `cityTerritoryRadius`, `isInTerritory`, `buildTerritoryNodesFromCities`, `reconcileWorkedTilesForOwner`, `collectTerritoryHexKeysByOwner`, rozmieszczenie cudow. Deklaracje `pub mod` w `domain/mod.rs` robi M00 (puste szkielety), M14 edytuje tylko wlasne pliki.
- **`R-RUSTPORT-P6-M15-DROGI-RUCH-REGULY-Q1`** (S, 87 LOC web): `isRoadImprovementKey`, `hexHasRoad`, `applyRoadMovementModifier` jako samodzielne funkcje + testy wektorowe (stale i dzielniki istnieja: `data/derived.rs:696`, `pathfinding.rs:250`).
- **`R-RUSTPORT-P6-M16-ULEPSZENIA-BUDOWA-REGULY-Q1`** (L, 1398 LOC web): Reguly budowy (las/farma/stadnina, warstwy zywnosci, zloza, `computeImprovementBuildImpact`); czesc UI (galeria, panel, callbacki) -> NIE-DOTYCZY.
- **`R-RUSTPORT-P6-M17-SNAPSHOT-MAPY-Q1`** (M, 380 LOC web): `serializeMapForSave`/`buildGameMapFromSnapshot`/`isValidMapSnapshot` (kolumny rzadkie, widocznosc); format spojny z `SaveSnapshot` (`save_load.rs:79`).
- **`R-RUSTPORT-P6-M18-GENERATE-MAP-ORKIESTRACJA-Q1`** (M, 646 LOC web): `generateMap`: kolejnosc przebiegow (generator.ts:148-775), `generujSwiat`, rozmiary; przepiecie `generate_map` na nowy potok; DOWOD: rowny teren/rzeki/zloza na 5 mapach `maps.json` (dzis ~40% rownych hexow terenu, `cmp_generate_map_vs_web.out.txt`).

### 6b. Kolizje z P6.1-P6.24 (sciezki Rust; skryptowo) - ZASIEG KONTROLI OGRANICZONY

**Co zmierzono, a czego NIE.** W repo (i na `origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0`) istnieja plany tylko: `P6-0` (analiza luk), `P6-1`, `P6-1B`, `P6-1C`, `P6-1D` (`dyspozycje/rust-port/p6/`). **Plany P6.2-P6.24 NIE istnieja**, wiec ich faktyczne allowlisty sa **NIE_ZMIERZONO**. Porownanie ponizej uzywa: (a) allowlist z planow ISTNIEJACYCH (P6.1, P6.1B, P6.1C, P6.1D - zamknietych), (b) dla P6.2-P6.22 PROPOZYCJI z `P6-0-GAP-ANALYSIS.md` §6b (wyciag verbatim w `p6-0-6b-excerpt.md`, parsowany przez `build_gap.py`; nie wpisany recznie). Brak kolizji z propozycja NIE dowodzi braku kolizji z przyszlymi planami: kazdy temat P6.2-P6.22 musi powtorzyc te kontrole na swojej faktycznej allowliscie przed dispatchem (ZALOZENIE Z7).

| temat P6 | zrodlo allowlisty | status zrodla |
|---|---|---|
| P6.1 | `domain/playable.rs, domain/player.rs, domain/unit_epoch.rs, domain/state.rs, domain/rng.rs, domain/mod.rs` | plan w repo: P6-1-STAN-STARTOWY.md §5 (allowlista r2) (+ proponowane sciezki P6.0 §6b, jesli dotyczy) |
| P6.2 | `domain/types.rs, domain/session.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.3 | `domain/terrain.rs, domain/improvements.rs, domain/pathfinding.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.4 | `domain/pathfinding.rs, domain/recruitment.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.5 | `domain/recruitment.rs, domain/combat.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.6 | `domain/state.rs, domain/terrain.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.7 | `domain/city_growth.rs, domain/building_costs.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.8 | `domain/resource_production.rs, domain/turn_economy.rs, domain/improvements.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.9/P6.10 | `domain/turn_economy.rs, domain/events.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.11 | `domain/ai_turn.rs, domain/power.rs, data/derived.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.12 | `domain/forced_war.rs, domain/ai_turn.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.13 | `domain/combat.rs, data/units_combat.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.14 | `domain/diplomacy.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.15 | `domain/trade.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.16 | `domain/culture.rs, domain/turn_economy.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.17 | `data/buildings_tech.rs, domain/improvements.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.18 | `domain/barbarians.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.19 | `domain/events.rs, domain/victory.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.20 | `domain/save_load.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.21 | `domain/save_load.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.22 | `domain/replay.rs` | PROPOZYCJA P6.0 §6b - plan tematu NIE istnieje w repo |
| P6.1B | `data/derived.rs, domain/player.rs` | plan w repo: P6-1B.md §3 (allowlista), linie 54-55 |
| P6.1C | `domain/start_position.rs, data/derived.rs, domain/mod.rs` | plan w repo: P6-1C.md §7 (allowlista), linie 153-154 |
| P6.1D | `domain/city_names.rs, domain/civ_bonuses.rs, data/derived.rs, domain/mod.rs` | plan w repo: P6-1D.md §7 (allowlista), linie 125-126 |

Wynik porownania (allowlisty M* bez `tests/` vs powyzsze):

| temat M | kolidujacy temat P6 | wspolne sciezki | status zrodla P6 | komentarz |
|---|---|---|---|---|
| M00 | P6.1 | `domain/mod.rs` | plan w repo | domain/mod.rs: konflikt addytywny z zamknietymi P6.1/1C/1D (deklaracje `pub mod`: `mapgen` + moduly M14-M17), jak w P6.1C §10 pkt 2; po M00 zaden temat M* nie edytuje mod.rs |
| M00 | P6.1C | `domain/mod.rs` | plan w repo | domain/mod.rs: konflikt addytywny z zamknietymi P6.1/1C/1D (deklaracje `pub mod`: `mapgen` + moduly M14-M17), jak w P6.1C §10 pkt 2; po M00 zaden temat M* nie edytuje mod.rs |
| M00 | P6.1D | `domain/mod.rs` | plan w repo | domain/mod.rs: konflikt addytywny z zamknietymi P6.1/1C/1D (deklaracje `pub mod`: `mapgen` + moduly M14-M17), jak w P6.1C §10 pkt 2; po M00 zaden temat M* nie edytuje mod.rs |

Pliki wspoldzielone: `src/domain/mod.rs` (tylko M00 - deklaracje `pub mod ...;`, konflikt addytywny jak w P6.1C §10 pkt 2; P6.1/P6.1C/P6.1D juz zmienily ten plik i sa zamkniete). Zaleznosci semantyczne (nie sciezkowe) per temat sa w kolumnie *zaleznosci* i w §6c.

### 6c. Kolizje semantyczne i kolejnosc wzgledem P6.x

- **M00**: domain/mod.rs: konflikt addytywny z zamknietymi P6.1/1C/1D (deklaracje `pub mod`: `mapgen` + moduly M14-M17), jak w P6.1C §10 pkt 2; po M00 zaden temat M* nie edytuje mod.rs.
- **M01**: map_generator.rs: jedyny temat edytujacy ten plik przed M18 (zmiana widocznosci `pub` + dedup `Mulberry32`).
- **M02**: brak wspolnych sciezek; `data/derived.rs` NIE jest edytowany (parsery w `params.rs`); zalezy od civ-entry-epoch (P6.1, zrobione).
- **M03**: brak wspolnych sciezek z P6.x.
- **M04**: brak wspolnych sciezek z P6.x.
- **M05A**: brak wspolnych sciezek z P6.x.
- **M05B**: brak wspolnych sciezek z P6.x.
- **M06A**: brak wspolnych sciezek z P6.x.
- **M06B**: brak wspolnych sciezek z P6.x.
- **M07A**: brak wspolnych sciezek z P6.x.
- **M07B**: brak wspolnych sciezek z P6.x.
- **M07C**: brak wspolnych sciezek z P6.x.
- **M07D**: brak wspolnych sciezek z P6.x.
- **M07E1**: brak wspolnych sciezek z P6.x.
- **M07E2**: brak wspolnych sciezek z P6.x.
- **M08**: P6.8 (`resource_production.rs`) konsumuje widocznosc zloz: rozlaczne sciezki, kolejnosc M08 przed P6.8-wiring.
- **M09**: start_position.rs: tylko `use` typow (P6.1C zamkniete) -- zero edycji; `data/derived.rs` nie edytowany.
- **M10**: brak wspolnych sciezek z P6.x.
- **M11**: brak wspolnych sciezek z P6.x.
- **M12**: start_position.rs: `build_cluster_start_plan` ma byc zasilany wynikiem M12 -- wiring w M18 (nie tu); zero edycji pliku.
- **M13**: `difficulty-cost.ts` (P6.11) tylko typ `GameDifficulty` -- parametr tekstowy, bez zaleznosci kodowej.
- **M14**: P6.15 (`trade.rs:265,549`) ma wlasna kopie `TerritoryNode`/`territory_owner_at` -- sciezki rozlaczne; P6.15 po M14 powinien przejsc na wspolna implementacje.
- **M15**: P6.4 (`pathfinding.rs`) wola `roads.rs` -- wiring po P6.4; M15 NIE edytuje pathfinding.rs.
- **M16**: P6.3/P6.8/P6.17 edytuja `improvements.rs` -- M16 jest w NOWYM pliku (rozlaczne sciezki); semantyczne zachodzenie na bramki `improvements.rs:238-330`.
- **M17**: P6.20 (`save_load.rs`) wola `map_snapshot.rs` -- rozlaczne sciezki; kolejnosc: M17 przed P6.20.
- **M18**: map_generator.rs: edytowany tez przez M01 (sekwencyjnie po M01); tests/p6_1c_vectors/maps.json uzywane read-only.

### 6d. Kontrola rozlacznosci (skryptowa)

- Pary tematow M* z NIEPUSTYM przecieciem sciezek (bez `tests/`): **27**.
  - M00 x M01: `domain/mapgen/prims.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M02: `domain/mapgen/params.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M03: `domain/mapgen/masks.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M04: `domain/mapgen/terrain_class.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M05A: `domain/mapgen/relief.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M05B: `domain/mapgen/relief.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M06A: `domain/mapgen/landsea.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M06B: `domain/mapgen/coast.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07A: `domain/mapgen/rivers_a.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07B: `domain/mapgen/rivers_b.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07C: `domain/mapgen/rivers_c.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07D: `domain/mapgen/rivers_d.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07E1: `domain/mapgen/rivers_e1.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M07E2: `domain/mapgen/rivers_e2.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M08: `domain/mapgen/deposits.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M09: `domain/mapgen/cluster_rivals.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M10: `domain/mapgen/cluster_mass.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M11: `domain/mapgen/cluster_layout.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M12: `domain/mapgen/cluster_compute.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M13: `domain/mapgen/starts.rs`, `domain/mapgen/villages.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M14: `domain/territory.rs`, `domain/wonder_placement.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M15: `domain/roads.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M16: `domain/improvement_build.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M17: `domain/map_snapshot.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M00 x M18: `domain/mapgen/generate.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M01 x M18: `domain/map_generator.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
  - M05A x M05B: `domain/mapgen/relief.rs` (oznaczone sekwencyjnie: tak / patrz kolumna rownoleglosc)
- Pary w grupach oznaczonych *rownolegle* (M01 | M02 | M09 | M14 | M15 | M17; M03 | M04; M07A | M08; M11 | M13 | M14 | M16) z niepustym przecieciem: **0**.
- Pary M* z przecieciem wzorcow `tests/p6_m*`: **0**.
- Przeciecia przy M00 wynikaja z tego, ze M00 jest wlascicielem szkieletu (puste pliki `mapgen/*.rs`); po M00 pliki te przechodza na wlasciciela-temat (M00 NIE jest rownolegly z zadnym innym). To jest dopuszczone i oznaczone `start (pierwszy)`.

### 6e. Pokrycie zakresow web (skryptowa kontrola, ze kazdy symbol ma temat)

| temat | symboli (wiersze §4) |
|---|---|
| - | 97 |
| M01 | 30 |
| M02 | 75 |
| M03 | 22 |
| M04 | 26 |
| M05A | 27 |
| M05B | 3 |
| M06A | 29 |
| M06B | 16 |
| M07A | 30 |
| M07B | 7 |
| M07C | 12 |
| M07D | 27 |
| M07E1 | 9 |
| M07E2 | 3 |
| M08 | 11 |
| M09 | 18 |
| M10 | 37 |
| M11 | 28 |
| M12 | 5 |
| M13 | 12 |
| M14 | 29 |
| M15 | 9 |
| M16 | 25 |
| M17 | 6 |
| M18 | 13 |

`-` = brak tematu (NIE-DOTYCZY albo juz ZWERYFIKOWANE w P6.1C: `cluster-spawn.ts` typy/`pickSecondHumanStartHex`/`displayLabelForSlot`). Kazdy symbol klasy SYSTEM/DATA o statusie BRAK/CZĘŚCIOWO ma temat M*.
Symbole SYSTEM/DATA o statusie BRAK/CZĘŚCIOWO bez tematu: **0**.

Pokrycie LOC plikow web zakresami tematow (suma zakresow wszystkich tematow; zakresy moga sie nakladac tylko tam, gdzie pojedyncze deklaracje przypisano innemu tematowi - liczone jako suma NIEPUSTYCH linii w sumie mnogosciowej):

| plik | LOC niepuste | LOC w zakresach tematow | LOC poza tematami | przyczyna (dla LOC poza tematami) |
|---|---|---|---|---|
| `cluster-spawn.ts` | 486 | 366 | 120 | symbole bez tematu: SYSTEM 5 |
| `clusters.ts` | 3958 | 3923 | 35 | naglowki/importy/komentarze/JSDoc poza zakresem |
| `deposit-era.ts` | 39 | 39 | 0 |  |
| `earth-land-mask.generated.ts` | 417 | 417 | 0 |  |
| `earth-land-mask.ts` | 147 | 147 | 0 |  |
| `gen-helpers.ts` | 11654 | 11624 | 30 | symbole bez tematu: NIE-DOTYCZY 15, UI 2, DATA 1 |
| `genWorker.ts` | 42 | 0 | 42 | symbole bez tematu: NIE-DOTYCZY 2 |
| `generator.ts` | 794 | 696 | 98 | symbole bez tematu: UI 3 |
| `improvement-build.ts` | 1453 | 1408 | 45 | symbole bez tematu: UI 14 |
| `map-attack-city.ts` | 138 | 0 | 138 | symbole bez tematu: UI 4 |
| `mapGenAsync.ts` | 90 | 0 | 90 | symbole bez tematu: NIE-DOTYCZY 1 |
| `mapGenProgress.ts` | 92 | 0 | 92 | symbole bez tematu: UI 7 |
| `mapSnapshot.ts` | 380 | 380 | 0 |  |
| `minimap.ts` | 245 | 0 | 245 | symbole bez tematu: UI 9 |
| `newGameMapDefaults.ts` | 659 | 659 | 0 |  |
| `range-hexes.ts` | 108 | 108 | 0 |  |
| `riverGenSwitch.ts` | 66 | 66 | 0 |  |
| `road-movement.ts` | 77 | 77 | 0 |  |
| `road-network.ts` | 166 | 0 | 166 | symbole bez tematu: UI 17 |
| `startScoring.ts` | 121 | 121 | 0 |  |
| `territory-border.ts` | 208 | 0 | 208 | symbole bez tematu: UI 6 |
| `territory-work.ts` | 158 | 158 | 0 |  |
| `territory.ts` | 129 | 129 | 0 |  |
| `villages.ts` | 183 | 183 | 0 |  |
| `wonder-placement.ts` | 108 | 108 | 0 |  |
| **razem** | 21918 | 20609 | 1309 | |

### 6f. Kolejnosc i fale

1. **Fala 0**: M00 (szkielet + model `MapHex`). Rownolegle z nia mozna NIE zaczynac niczego (zalezy od rejestracji modulow), ale M00 jest S.
2. **Fala 1 (rownolegle, rozlaczne pliki)**: M01 (weryfikacja rdzenia), M02 (parametry), M09 (**klastry-rywale-min: odblokowuje slot rywali i kandydatow z P6.1C RUNDA-2; NIE cale zasilenie planu - to M12**), M14 (terytorium), M15 (drogi), M17 (snapshot).
3. **Fala 2**: M03 || M04 (po M01+M02); M10 (po M09).
4. **Fala 3**: M05A -> M05B; M11 (po M10); M13 (po M10); M16 (po P6.3).
5. **Fala 4**: M06A -> M06B; M07A -> ... -> M07E2 (lancuch), M08 (po M02+M06B).
6. **Fala 5**: M12 (po M11 i M07E2), potem **M18** (orkiestracja i przepiecie `generate_map`; DOWOD: rownosc z `maps.json`).
7. Krytyczna sciezka calego backlogu M: M00 -> M01/M02 -> M03/M04 -> M05A -> M05B -> M06A -> M06B -> M07A -> M07B -> M07C -> M07D -> M07E1 -> M07E2 -> M12 -> M18. Droga do odblokowania CZESCI P6.1C RUNDA-2 (`buildSameTypeRival*`) jest krotka: M00 -> M09. Zasilenie `build_cluster_start_plan` wynikiem Rust (`buildClusterSpawnPlan`/`computeClusters`) = M00 -> M09 -> M10 -> M11 -> M12 (po M07E2 dla mapy).

### 6g. Rekomendacja priorytetu

- **Natychmiast**: M00 -> M09 (zamyka CZESC RUNDY-2 P6.1C: `buildSameTypeRival*` i `groupForeignTypeClusters`; wycinek 17 deklaracji `clusters.ts` / 334 LOC + 5 `cluster-spawn.ts` / 98 LOC; bez zaleznosci od reszty mapgenu). Pelne zasilenie planu startowego wynikiem Rust (pkt 1 `P6-1C.md` §10: `buildClusterSpawnPlan`, `computeClusters`) wymaga M10-M12.
- **Wysoki**: M01 (zamrozenie dobrego rdzenia testami; tanie, redukuje ryzyko regresji przy dalszym porcie); M14 (terytorium jest uzywane przez 9 plikow `game/`).
- **Do decyzji organizacyjnej** (nie blokuje): czy M07 (rzeki, ~6800 linii web) ma byc portowane 1:1, czy zastapione okreslonym wejsciem (zapisane rzeki z weba jako dane startowe do czasu P8). Nie rozstrzygam - ZALOZENIE Z3: port 1:1, bo parytet seedowanych map jest celem M18.

## 7. Wycinek P6.1C (M09): domkniecie

Skryptowo (`callgraph_ast.cjs`, domkniecie identyfikatorow po AST TypeScript - zastepuje regexowy `callgraph_clusters.py` z rundy 1, ktory pomijal stale uzywane tylko w tresci `const`/`type`; GORNA granica: nazwa lokalna zaslaniajaca nazwe top-level moze dolaczyc deklaracje nadmiarowa). Korzenie: `buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`, `groupForeignTypeClusters`, `packRivalCitiesAroundCore`, `packCityStatesAroundCapital`, `computeSameTypeRivalHalfPlaneAxis`:

```text
== rywale-P6.1C: 27 deklaracji, 467 LOC niepustych
-- cluster-spawn.ts: 7 deklaracji, 114 LOC
  cluster-spawn.ts:35-45	ClusterSpawnSlot	11
  cluster-spawn.ts:48-52	ForeignTypeClusterGroup	5
  cluster-spawn.ts:71-79	landHexesFromMap	9
  cluster-spawn.ts:81-86	mapCenterFromGameMap	6
  cluster-spawn.ts:91-134	buildSameTypeRivalSlots	44
  cluster-spawn.ts:140-165	buildSameTypeRivalCandidateHexes	25
  cluster-spawn.ts:195-208	groupForeignTypeClusters	14
-- clusters.ts: 17 deklaracji, 334 LOC
  clusters.ts:42-42	CLUSTER_CITY_STATE_MIN_HEX	1
  clusters.ts:47-47	CLUSTER_CITY_STATE_MAX_HEX	1
  clusters.ts:49-49	MIN_DIST_START_CITY_STATE	1
  clusters.ts:58-58	CLUSTER_GROWTH_RESERVE	1
  clusters.ts:168-175	shuffleInPlace	8
  clusters.ts:1347-1350	clusterPackRadius	4
  clusters.ts:1538-1542	ForeignClusterBuffer	5
  clusters.ts:1544-1552	passesForeignClusterBufferGate	9
  clusters.ts:1771-1800	landPoolNearCore	30
  clusters.ts:1848-1867	hexesAtDistance	20
  clusters.ts:1870-1873	SameTypeRivalHalfPlaneAxis	4
  clusters.ts:1879-1892	computeSameTypeRivalHalfPlaneAxis	14
  clusters.ts:1895-1904	isInSameTypeRivalHalfPlane	10
  clusters.ts:1911-1967	packCityStatesHubChain	53
  clusters.ts:1975-2030	packNearestLegalLand	54
  clusters.ts:2036-2139	packCityStatesAroundCapital	97
  clusters.ts:2144-2165	packRivalCitiesAroundCore	22
-- gen-helpers.ts: 3 deklaracji, 19 LOC
  gen-helpers.ts:57-65	mulberry32	9
  gen-helpers.ts:125-128	HEX_DIRECTIONS	4
  gen-helpers.ts:135-140	hexDistanceAxial	6
UNRESOLVED	(brak)
```

Zakres M09 (§6) = te deklaracje z `clusters.ts` (17 decl, 334 LOC) i `cluster-spawn.ts` (5 decl, 98 LOC) wraz z komentarzem nad nimi; dwa typy P6.1C (`ClusterSpawnSlot`, `ForeignTypeClusterGroup`) i 3 deklaracje `gen-helpers.ts` sa juz w Rust i poza zakresem M09. Stala `MIN_DIST_START_CITY_STATE` (:49 = `CLUSTER_CITY_STATE_MIN_HEX` :42) jest uzywana w wycinku bezposrednio przez `cluster-spawn.ts:106,148` (`buildSameTypeRivalSlots`, `buildSameTypeRivalCandidateHexes`); poza wycinkiem w `clusters.ts:56,1835-1836,3399` (M10-M12). Nalezy do M09 jako pierwszego tematu, ktory jej potrzebuje.

Imiona miast: `playerStartCityName`/`clusterRivalCityName` (`game/civ-names`) - w Rust odpowiada P6.1D (`city_names.rs`: `player_capital_from_pool`, `cluster_rival_from_pool` :130).

Wycinek startScoring (M10), `callgraph-startscoring.txt` (AST): 19 deklaracji `clusters.ts` / 159 LOC + 7 z `startScoring.ts` / 92 LOC + 1 z `gen-helpers.ts` (`HEX_DIRECTIONS`, juz w Rust).
Pelne `computeClusters` (M12, wymaga M10+M11): 118 deklaracji `clusters.ts` / 3505 LOC + 7 z `gen-helpers.ts` / 53 LOC (`callgraph-computeclusters.txt`); `buildClusterSpawnPlan` dodaje 8 deklaracji `cluster-spawn.ts` / 291 LOC (`callgraph-spawnplan.txt`).

## 8. NIE_ZMIERZONO (jawna lista)

- Rownosc calych funkcji potoku (relief, bilans lad/morze, rzeki, zloza, start, klastry) - brak odpowiednikow w Rust, wiec brak czego mierzyc.
- Maski ladu: tylko wektory 36x28 seed 42 (3 punkty na typ, 7 dla Ziemi). Inne wymiary/ziarna/`landFraction` - NIE_ZMIERZONO (Rust `land_mask` jest prywatne; M01 ma je udostepnic).
- `ShapeParams` offsety (6 wartosci `rand()*500`): zgodnosc wg odczytu kodu, wektor NIE_ZMIERZONO.
- `earthTemplateLandAt` dla `steps` = 1/3/5 (mapy >= 110 wewnetrznego rozmiaru): NIE_ZMIERZONO; zmierzone tylko `steps=7`.
- `classifyTerrain` z progami tier-ow gestosci (`TerrainClassifyThresholds`): NIE_ZMIERZONO.
- Mapa `maps.json` ma 5 map; roznice `generate_map` wzgledem weba zmierzone na nich i na parametrach domyslnych (`genOpts` bez zmian).
- `improvement-build.ts`, `genWorker.ts`, `mapGenAsync.ts`: nie daja sie zaladowac w Node bez `three`/workera - liczba eksportow tylko statyczna.
- Zakres UI w `improvement-build.ts` (galeria, panel) - klasyfikacja po odczycie nazw/komentarzy, nie po kazdej funkcji.
- LOC per deklaracja: niepuste linie instrukcji wg AST (bez JSDoc); LOC tematu = niepuste linie jego zakresow (zakresy rozlaczne, §0). Domkniecia (§7) sa GORNA granica (nazwa lokalna zaslaniajaca nazwe top-level dolacza nadmiar).
- **Faktyczne allowlisty P6.2-P6.24 (kolizje §6b)**: plany tych tematow nie istnieja w repo; kolizje policzono wzgledem PROPOZYCJI z P6.0 §6b. NIE_ZMIERZONO, czy zrealizowane plany zachowaja te sciezki.
- Czy `terenCoverageCellSize` (wartosc 4) jest wymuszona wektorami testu `terrain_bias_and_classification_match_typescript_golden_vectors`: wektory (0,0),(4,0),(0,4),(9,7) przekraczaja granice komorek, ale test pinuje wynik `terrain_cell_bias`, nie osobna funkcje - status CZESCIOWO.
- Katalogi `gra/src/types`, `gra/src/units`, `gra/src/data` (loadery), `gra/src/util` NIE sa analizowane (poza zakresem; patrz ZALOZENIE Z2) - zaleznosci od nich zaznaczono, ale ich pokrycia nie mierzono.

## 9. ZALOZENIA (zamiast pytan)

- **Z1** Kod generatora trafia do nowego `src/domain/mapgen/` (pliki-szkielety z M00); `map_generator.rs` zostaje nietkniety do M01 (widocznosc) i M18 (przepiecie). Powod: rozlaczne allowlisty i brak 12-tysiecznego pliku.
- **Z7** Kolizje §6b dla P6.2-P6.24 sa liczone wzgledem propozycji P6.0 §6b; kazdy z tych tematow powtarza kontrole rozlacznosci na swojej faktycznej allowliscie przed dispatchem (plany nie istnieja w repo).
- **Z2** Model `MapHex` (hex weba: `terenBazowy`, `nakladka`, `zloze`, `rzeka`, `wioska`, `wlasciciel`...) pochodzi z `gra/src/types/hex.ts`, ktorego ani P6.0 ani P6.25 nie obejmuja. M00 musi go przeczytac; zalecany osobny temat analizy luk `gra/src/{types,units,data,util}` (P6.26).
- **Z3** M07 (rzeki) jest portowane 1:1 (parytet map z ziarna), nie zastapione danymi.
- **Z4** Silnik Rust jest synchroniczny; worker/async generacji (`genWorker.ts`, `mapGenAsync.ts`) i postep (`mapGenProgress.ts`) nie sa portowane (warstwa powloki). Opcjonalny callback postepu moze dodac M18.
- **Z5** M14 przyjmuje promien terytorium od wywolujacego do czasu P6.8 (`okolica.ts`); wtedy `cityTerritoryRadius` laczy sie z `city_range_for_population`.
- **Z6** Rownosc na poziomie hexa/pola w `maps.json` (5 map) jest kryterium odbioru M18; pojedyncze funkcje - wektory z Node per temat (wzorzec P6.1C).

## 10. Indeks artefaktow runu (`dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/`)

- `inventory_map.py / web-exports.tsv` - inwentarz eksportow (skrypt + wynik)
- `usage_map.py / usage.tsv` - konsumenci symboli poza map/
- `imports_map.py / imports.tsv` - importy wewnetrzne i zewnetrzne plikow map/
- `rust_name_hits.py / rust-name-hits.tsv` - kandydaci odpowiednikow po nazwie w Rust
- `callgraph_ast.cjs / callgraph-*.txt` - domkniecia identyfikatorow po AST: rywale P6.1C, startScoring, computeClusters, buildClusterSpawnPlan
- `decl_spans.cjs / decl-spans.tsv` - zakresy instrukcji top-level (AST) - LOC deklaracji i wlasnosc linii przez tematy
- `p6-0-6b-excerpt.md` - wyciag verbatim P6-0-GAP-ANALYSIS.md §6b (allowlisty P6.x uzyte w §6b)
- `web_pure_check.mjs / .out.txt` - czyste funkcje weba vs stale testow Rust
- `web_runtime_check.mjs / .out.txt` - uruchomienie modulow weba: eksporty runtime, maski, classifyTerrain
- `web_data_check.mjs / .out.txt` - dane weba vs JSON Rust (rozmiary, wymiary, epoki zloz)
- `sweep_web.mjs, sweep_rust.rs.txt, sweep.out.txt` - sweep klimatu/Mulberry32/odleglosci web vs Rust
- `cmp_generate_map_vs_web.rs.txt / .out.txt` - porownanie generate_map z 5 mapami weba
- `earth_mask_compare.py / .out.txt` - dane maski Ziemi web vs Rust
- `loader-hooks.mjs, loader-register.mjs` - loader Node dla .ts/.json
- `build_gap.py / gap-rows.tsv / backlog.tsv` - generator tego dokumentu + wiersze + backlog
- `verify_gap.py / verify_gap.out.txt` - kontrola dokumentu: pliki, eksporty, zakresy tematow, symbole w zakresach, allowlisty
- `01-operator-report.md, gate-fmt.log, gate-clippy.log, gate-test.log` - raport Operatora (runda 1); PELNE surowe wyjscia fmt/clippy -D warnings/test z `EXIT=` odswiezone w rundzie 2

## 11. Zero zmian poza allowlista - samokontrola

Zmienione/dodane: `dyspozycje/rust-port/p6/P6-25-MAPA-GAP.md` (nowy) i `dyspozycje/autobot/runs/R-RUSTPORT-P6-25-MAPA-GAP-Q1/**`. Brak zmian w `gra/**`, `rust-port/**`, `src-tauri/**`. Crate scratch z `cmp`/`sweep` lezy POZA repo (scratchpad), `Cargo.lock` nie jest w worktree. Runda 2 zmienia tylko dokument i artefakty runu (bez kodu Rust). Deploy/push: NIE WYKONANO.

## 12. Runda 2 - odpowiedzi na zarzuty Evaluatora (ten sam ID)

Ocena Evaluatora: commit `1c2b9ee9`, STATUS FAIL, 9 zarzutow. Wszystkie dotycza dokumentu i artefaktow (bez kodu Rust); kazda poprawka jest regenerowana skryptem `build_gap.py` i sprawdzana `verify_gap.py` (§10).

1. **PRZYJMUJE.** Allowlista M18 zawierala wzorce testow nieistniejacego tematu M19; poprawione na `tests/p6_m18_*.rs` i `tests/p6_m18_vectors/**` (§6, `backlog.tsv`). `verify_gap.py` sprawdza teraz, ze kazdy temat ma dokladnie wzorce `tests/p6_m<id>_*.rs` i `tests/p6_m<id>_vectors/**` swojego ID i zaden wzorzec testow innego tematu; `build_gap.py` nie zawiera juz wzorca nieistniejacego tematu.
2. **PRZYJMUJE.** Domkniecie M09 bylo liczone regexem (`callgraph_clusters.py`), ktory gubil stale uzywane w tresci deklaracji. Zastapione AST (`callgraph_ast.cjs`): 17 deklaracji `clusters.ts` (334 LOC), w tym `CLUSTER_CITY_STATE_MIN_HEX` (:42) i `MIN_DIST_START_CITY_STATE` (:49), + 5 deklaracji `cluster-spawn.ts` (98 LOC) + 3 z `gen-helpers.ts` (juz w Rust). Wynik zgodny z niezalezna miara Evaluatora (27 deklaracji, 467 LOC lacznie z dwoma typami P6.1C). Stare "15 deklaracji, 384 LOC" usuniete z dokumentu. Stala :49 jest uzywana przez `cluster-spawn.ts:106,148` (wewnatrz wycinka) oraz `clusters.ts:56,1835-1836,3399` (poza nim) - opisane w §2 pkt 5, §7 i uwagach M09.
3. **PRZYJMUJE.** Zakres M09 nie jest juz recznym zakresem 42-58/71-165/189-209, tylko zbiorem deklaracji domkniecia z AST razem z komentarzem nad nimi (16 przedzialow, 484 niepustych linii, tabela §6). Jedenascie deklaracji `clusters.ts:1347-2165` (`clusterPackRadius`, `ForeignClusterBuffer`, `passesForeignClusterBufferGate`, `landPoolNearCore`, `hexesAtDistance`, `SameTypeRivalHalfPlaneAxis`, `computeSameTypeRivalHalfPlaneAxis`, `isInSameTypeRivalHalfPlane`, `packCityStatesHubChain`, `packNearestLegalLand`, `packCityStatesAroundCapital`, `packRivalCitiesAroundCore`) leza teraz w zakresie M09 i sa odjete z M10/M11. `verify_gap.py` sprawdza, ze kazda deklaracja domkniecia lezy w zakresie M09 (wynik: brak wyjatkow).
4. **PRZYJMUJE.** Zakresy tematow nie sa juz projektem niezalezym od przypisan §4: kazda linia pliku web ma jednego wlasciciela, a 29 deklaracji z §4 przypisanych do tematu, ktorego zakres bazowy ich nie obejmowal, zostalo wlaczonych do jego zakresu (m.in. `generujSwiat` -> M18; symbole `earth-land-mask.ts` -> M01 z odjeciem od M03; `ClusterSpawnPlan` -> M12). Re-eksporty w `generator.ts` (:117, :846-848), ktore dotad nalezaly do czterech roznych tematow w jednej instrukcji, przypisano M18 (fasada generatora; definicje zostaja w tematach-wlascicielach, co wpisano w uwagi). Wynik kontroli (skrypt Evaluatora `check_backlog.py` i `verify_gap.py`): symbole poza zakresem swojego tematu = 0.
5. **PRZYJMUJE.** LOC tematu nie jest juz korygowany odejmowaniem (`RIV_IN_M10` itd.), tylko liczony jako niepuste linie zakresow z tabeli §6: np. M10 = 1283, M11 = 1517, M09 = 484 (wczesniej M10 1287, M11 1527). `verify_gap.py` przelicza LOC kazdego z 26 tematow z samych zakresow dokumentu - zgodnosc co do linii.
6. **PRZYJMUJE.** Odnosniki Rust przy statusie BRAK sa teraz oznaczone `kontekst:` i opisane w legendzie §0 (5 wierszy: `BuildClusterSpawnInput`, `buildClusterSpawnPlan`, `MIN_DIST_START_CITY_STATE`, `ClusterPlacement`, `generujSwiat`). Wiersz `ClusterPlacement` (`clusters.ts:128`): `start_position.rs` `ClusterSpawnPlan` to struktura, ktora POMIJA pole `placement` - odnosnik jest kontekstem, nie odpowiednikiem. Wiersz `MIN_DIST_START_CITY_STATE`: odnosnik `start_position.rs` do `min_city_distance_start_city_state` jest kontekstem - ta funkcja zwraca INNA stala (wartosc 3 z `cities.ts:1122`), a wartosc web to 5; uwaga w wierszu to mowi wprost.
7. **PRZYJMUJE.** `terenCoverageCellSize` (`gen-helpers.ts:889`) zmieniono z ISTNIEJE-ZWERYFIKOWANE na CZESCIOWO: w Rust nie ma tej funkcji, jest literal `q / 4` w `terrain_cell_bias`, a test pinuje wynik `terrain_cell_bias`. Wskazniki §1: ZW 25 (bylo 26), CZ 56 (bylo 55). Pozostale wiersze ZW przejrzane pod katem tego samego wzorca: w kazdym Rust ma odrebny symbol (funkcje/typ) o odpowiadajacej semantyce, a test pinuje jego wynik albo wynik lancucha, ktory go wola; przypadki posrednie (`cosLerp`, `sampleEarthTemplateLand`, `ContinentCenter`, centra masek) maja to w uwagach (`posrednio`/`WASKO`). Brak literalu bez osobnego symbolu w Rust poza `terenCoverageCellSize`.
8. **PRZYJMUJE.** §6b ujawnia zasieg kontroli: plany P6.2-P6.24 nie istnieja w repo, wiec ich faktyczne allowlisty sa NIE_ZMIERZONO; kontrola uzywa PROPOZYCJI z `P6-0-GAP-ANALYSIS.md` §6b (wyciag verbatim `p6-0-6b-excerpt.md`, parsowany, nie wpisany recznie) oraz allowlist z istniejacych planow P6.1/1B/1C/1D. Tabela z recznie wpisanymi sciezkami usunieta z `build_gap.py`. Dodano ZALOZENIE Z7 i wiersz w §8. Przy okazji wyszlo, ze P6.1/1C/1D zmieniaja `domain/mod.rs`: M00 przejmuje wszystkie deklaracje `pub mod` (takze dla M14-M17), wiec po M00 zaden temat M* nie edytuje `mod.rs` (wczesniej M14-M17 po cichu go potrzebowaly).
9. **PRZYJMUJE.** `P6-1C.md` §10 pkt 1 wymienia `buildSameTypeRival*` ORAZ `buildClusterSpawnPlan`/`computeClusters`. Dokument rozdziela: M09 odblokowuje wylacznie czesc o slotach i kandydatach rywali, a zasilenie `build_cluster_start_plan` wynikiem Rust wymaga M09 -> M10 -> M11 -> M12. Zmienione miejsca: §2 pkt 5, pole *rownoleglosc* M09, §6f pkt 2 i 7, §6g, §7 (z liczbami domkniec `computeClusters` i `buildClusterSpawnPlan`).
