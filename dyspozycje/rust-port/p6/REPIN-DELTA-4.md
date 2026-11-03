# REPIN-DELTA-4 — pin weba 4bbef081d -> 23dd158e9 (R-RUSTPORT-REPIN-DELTA-4-Q1, runda 2/5 - Obrona)

ZASADA WŁAŚCICIELA: port 1:1 z webem; odstępstwo = ZAŁOŻENIE do akceptacji.
Pomiar: `git diff 4bbef081d 23dd158e9 -- gra/src gra/data` = 20 plików, +1167/−138
(ROBOCZA 4049e780 = `23dd158e9`). Wektory: URUCHOMIONY web z `git archive 23dd158e9 gra/src gra/data`
(loader `tools/repin-b-loader-*.mjs`, bez buildu `gra/`), generatory w
`dyspozycje/autobot/runs/R-RUSTPORT-REPIN-DELTA-4-Q1/tools/`.

Legenda statusu: **PORT** (zaportowane, wektory weba), **N/D** (nie dotyczy Rust, z dowodem),
**DŁUG** (moduł Rust poza allowlistą / nieistniejący, z podziałem na tematy).

## Tabela hunków (plik:linia nowego pinu -> moduł Rust -> status)

| # | Hunk (web @23dd158e9) | Klasa | Moduł Rust | Status |
|---|---|---|---|---|
| 1 | `map/freshwater.ts` (NOWY, 172 l.): `getLakeHexSet` (:60-110), `isLakeAdjacent` (:119), `hasRiverWaterAccess` (:130), `hasFreshwaterAccess` (:149), `isFreshwaterReservedHex` (:165) | behawioralny | `domain/freshwater.rs` (NOWY; `lake_hex_set`, `FreshwaterCtx`) | **PORT** — `tests/p6_repin4_vectors.rs::freshwater_matches_web` (93 mapy, 28 z jeziorami, >3000 zapytań, w tym ocean==∅ i dwie składowe) |
| 2 | `game/turn-economy.ts:417-425` `cityHasWaterAccess` -> `hasFreshwaterAccess` | behawioralny | `turn_economy_health.rs::city_has_water_access_in` (+ `is_lake_adjacent_cached`) | **PORT** — asercja `city_has_water_access == hasFreshwaterAccess` w tym samym teście |
| 3 | `turn-economy.ts:530` etykieta „Jezioro”/„Rzeka” | UI-tekst | brak etykiet w Rust (`grep "Rzeka" turn_economy_health.rs` = 0) | **N/D** |
| 4 | `auto-improvements.ts:1250` `isOnRiver`, `:1268` `onRiverHex`, `:1275` `foodReservedHex` | behawioralny | `auto_improvements/single_pass.rs` (`Shared::is_on_river/on_river_hex/food_reserved_hex`, `fw: FreshwaterCtx`) | **PORT** |
| 5 | `auto-improvements.ts:1481,1487` filtr `riverHexesOnly` + rank 3-stopniowy (NA rzece < sąsiad < reszta) | behawioralny | `auto_improvements/city_phases.rs` (`build_city_env` sort/filtr) | **PORT** |
| 6 | `:1671` (`riverKrok0Ok`), `:1697` (`rzekiDoZagospodarowania`), `:1707` (trzoda w E2), `:1791` (`keyBlockedOnHex` trzoda), `:1884` (krok 0 poza rzeką) -> `onRiverHex` | behawioralny | `city_phases.rs` (`river_krok0_ok`, `river_to_develop`, `key_blocked_on_hex`), `hex_phases.rs::step0_applies` | **PORT** (M12 patrz uwagi) |
| 7 | `:1778` (`hillTartakPending`), `:1808` (`keyBlockedOnHex` tartak/obóz) `hasRiverAccess` -> `foodReservedHex` (zero awaryjnego tartaku/obozu) | behawioralny | `city_phases.rs::hill_tartak_pending/key_blocked_on_hex` | **PORT** |
| 8 | `:773` `fortKeyRadius`, `:1293-1313` `getOwnFortCircles` | behawioralny | `hex_phases.rs` (`fort_key_radius`, `own_fort_circles`; `Acc.own_fort_circles`) | **PORT** |
| 9 | `:1569-1573` FAZA 0 U-3: odrzut kandydata z kołem w całości w kole własnego fortu/posterunku | behawioralny | `hex_phases.rs::phase_defense` | **PORT** |
| 10 | `:1587-1608` cofnięcie posterunku obejmowanego przez fort zaplanowany w tej turze (zwrot Pracy/limitu miasta/warstw/kół) | behawioralny | `hex_phases.rs::phase_defense` | **PORT** |
| 11 | `auto-improvements.ts` `onDecision`/`AutoImproveDecisionEvent`/`resolveDecisionSink`/`dbg(...)` (:1056-1079, :1816-1866), liczniki `rej` w `pickFortClaims`, log `e-fort bramka` (:1008-1028) | diagnostyka (obserwator, „TYLKO log; wynik pickera bez zmian”) | — | **N/D** (brak konsumenta; wynik pickera nie zależy) |
| 12 | `auto-improvements.ts` ~110 hunków komentarzy (decyzje #10/#24/#25 itd.), opisy pól | komentarz | — | **N/D** |
| 13 | `game/civ-test-hooks.ts` (NOWY, 140 l.) | tylko test (`?civTest=1`) | — | **N/D** |
| 14 | `game/fort-territory.ts:359-369` `fortSightSources` | behawioralny (czysty) | `fort_territory.rs::fort_sight_sources` | **PORT** — `fort_sight_sources_match_web` (120 przypadków); konsument = poz. 16 (PORT w r2) |
| 15 | `fort-territory.ts` nagłówek (komentarz „TWARDE terytorium”) | komentarz | — | **N/D** |
| 16 | `game/visibility.ts:268-310` `extraSightSources` w `computePlayerVisibility`; `main.ts:11566,11651,14440,14875,15088` (`refreshFog`, `fortSightSources` w mgle) | behawioralny (mgła) | **ISTNIEJE**: `domain/state.rs` `terrain::visibility::compute_player_visibility` (P6.6A, pin edb8fb56) — r1 błędnie uznała brak modułu. `main.ts` = warstwa gry (poza Rust) | **PORT** (r2) — `state.rs::compute_player_visibility_with_extra` (Z5), wektory `visibility.json` (160 przypadków, 62 ze zmianą wyniku przez extra, promienie 0/-1/2/2,5) — test `player_visibility_extra_sight_sources_match_web` |
| 17 | `main.ts:26572-26637` `installCivTestHooks` | tylko test | — | **N/D** |
| 18 | `main.ts:40629,40712`, `newGameMapDefaults.ts:462-474`, `ui/newGameFlow.ts:1717,2222`, `ui/buildModeHud.ts:211` | UI / domyślne kreatora (Pangea 60 / Wyspy 50 / Kontynenty 30) | `playable.rs:79,153` ma stałe `land_fraction_percent: 30` (poza allowlistą) | **DŁUG** `R-RUSTPORT-NEWGAME-DEFAULTS-Q1` (domyślny udział lądu per typ) |
| 19 | `data/map-gen-params.json` `generator.capital_sep_short_side_coef` (0,21) + `data/map-gen-params-loader.ts:224-230` | dane + loader | `rust-port/engine/data/map-gen-params.json` (kopia z pinu), `data/terrain_map.rs::Generator.capital_sep_short_side_coef` (ZAŁOŻENIE: `deny_unknown_fields`), `cluster_layout.rs::map_gen_capital_sep_short_side_coef` | **PORT** |
| 20 | `data/ai-params.json` `ekspansja_waga_plonu_heksu` (0,3), `ekspansja_kara_polarna_sasiedztwo` (8) | dane | `rust-port/engine/data/ai-params.json` (kopia), `data/economy_society_part2.rs::AiParams` (+2 pola; ZAŁOŻENIE: `deny_unknown_fields`) | **PORT** (dane); konsumenci patrz 21 |
| 21 | `game/ai.ts` (+102): `terrainYieldRowForId`, `hexCityScore` (waga plonu), `aiPolarNeighbourhoodPenalty`, `findCityFoundingHex` (zakaz polarny, fallback tylko bez miasta) ; `game/ai-difficulty-bonus.ts:204-218` `pickBonusCityHex` (polarny tylko jako fallback) | behawioralny (AI) | `ai_turn.rs` i pokrewne — POZA allowlistą; `pickBonusCityHex` bez odpowiednika (`grep pick_bonus_city_hex` = 0) | **DŁUG** `R-RUSTPORT-AI-CITY-FOUNDING-POLAR-Q1` |
| 22 | `map/clusters.ts:1530-1590` `capitalMinSeparationProportional`, `capitalSepFeasibleCap`, `CAPITAL_SEP_AREA_FACTOR(_SMALL)`, `capitalMinSeparationForMap(…, civCount, landCount)` | behawioralny (czysty) | `mapgen/cluster_layout.rs` (`capital_min_separation_proportional`, `capital_min_separation_for_map_pin`) | **PORT** (funkcje) — `capital_separation_matches_web` (4860 przypadków) |
| 23 | `clusters.ts:3522-3585` wywołania `capitalMinSeparationForMap(…, nTypy, landCountForSep)`, `clusterCenterPlacementSepForMap`, log `capital-sep`, `ClusterPlacement.capitalMinSep` (:132,:4362), `cluster-spawn.ts:254-262` | behawioralny | `cluster_compute.rs` (`compute_clusters`, `build_cluster_spawn_plan`; `ClusterPlacement.capital_min_sep`), `cluster_layout.rs` (`capital_min_separation_for_empty_map`, `cluster_center_placement_sep_for_map_civ`) | **PORT** (r2) — wektory M10/M11/M12/M09/P6.1C regenerowane z weba 23dd158e9 (patrz REGENERACJA r2); mutanty P08, P10, P13 ubite |
| 24 | `clusters.ts:2355-2358` `pickCapitalHexInRegion` — odwrócony komparator sortowania (`da−db` zamiast `db−da`) | behawioralny | `cluster_layout.rs:1094 pick_capital_hex_in_region` | **PORT** (r2) — mutant P06 ubity (`build_cluster_cities_matches_web` + spawn plan) |
| 25 | `clusters.ts` `polarProximityTier`, `dropPolarHexCandidates`, `ladowePlayer` vs `ladowe`, `isPlayerLayout`, klucz `polar` w sortowaniu (:364-400, :627-700, :779-790, :812-815, :994-997, :1202-1263, :1813-1845, :2426-2735, :3540-3780) | behawioralny (AI unika terenu polarnego) | `cluster_mass.rs` (`polar_proximity_tier`, `drop_polar_hex_candidates`, klucz `polar` w obu sortowaniach), `cluster_layout.rs` (`avoid_polar`, `is_player_layout`, `ladowe_player`), `cluster_compute.rs` (dwie pule) | **PORT** (r2) — mutanty P01–P05, P07, P09, P11, P12, P14, P16–P18 ubite; P15 (fallback `ladowe` w `place_cluster_centers_across_landmasses`) = brak wektora (patrz Mutacje) |
| 26 | `map/gen-helpers.ts:3697-3845` `topUpPangeaLandFraction` (fazy 1–3, stałe `PANGEA_TOPUP_*`) | behawioralny (czysty) | `mapgen/landsea.rs::top_up_pangea_land_fraction` | **PORT** (funkcja) — `top_up_pangea_matches_web`: `topup.json` 221 scenariuszy (143 z dosypem) + `topup_bound.json` 99 wektorów granicznych (63 z dosypem) = 320; niezależnie potwierdzone przez `tools/verify_repin4.py` |
| 27 | `map/generator.ts:468-470` wywołanie `topUpPangeaLandFraction` + `snapPangeaBagelAudit('08b…')` | behawioralny (potok) | `mapgen/generate.rs` = stub (3 linie; `generateMap` nie zaportowany) | **DŁUG** `R-RUSTPORT-MAPGEN-GENERATE-Q?` (potok `generateMap`) |
| 28 | `types/resources.ts:15-21` | komentarz | — | **N/D** |

Kompletność: 28 pozycji obejmuje wszystkie 20 plików delty (`ai-params.json`, `map-gen-params.json`,
`map-gen-params-loader.ts`, `ai-difficulty-bonus.ts`, `ai.ts`, `auto-improvements.ts`, `civ-test-hooks.ts`,
`fort-territory.ts`, `turn-economy.ts`, `visibility.ts`, `main.ts`, `cluster-spawn.ts`, `clusters.ts`,
`freshwater.ts`, `gen-helpers.ts`, `generator.ts`, `newGameMapDefaults.ts`, `resources.ts`,
`buildModeHud.ts`, `newGameFlow.ts`).

## Zmiany istniejących plików (jawna lista, każda = hunk z tabeli)

* `domain/auto_improvements/single_pass.rs` — poz. 4 (pola `fw`, metody `is_on_river/on_river_hex/food_reserved_hex`), `Acc.own_fort_circles` (poz. 8).
* `domain/auto_improvements/city_phases.rs` — poz. 5, 6, 7 (`river_krok0_ok`, `hill_tartak_pending`, `key_blocked_on_hex`, sort/filtr heksów, `river_to_develop`), pole `Acc.own_fort_circles`.
* `domain/auto_improvements/hex_phases.rs` — poz. 6 (`step0_applies`), 8, 9, 10 (`phase_defense`).
* `domain/turn_economy_health.rs` — poz. 2.
* `domain/fort_territory.rs` — poz. 14.
* `domain/mapgen/cluster_layout.rs` — poz. 19, 22 (nowe funkcje; stary `capital_min_separation_for_map` NIETKNIĘTY — używa go `compute_clusters`, poz. 23).
* `domain/mapgen/landsea.rs` — poz. 26.
* `domain/mod.rs` — `pub mod freshwater;`.
* `data/map-gen-params.json`, `data/ai-params.json` — kopie z pinu `23dd158e9` (jedyne 2 z ~30 plików `gra/data` zmienione w delcie; poprzednio bajt-w-bajt równe pinowi 4bbef081d).
* Testy: `tests/p6_8i_pick.rs` (tylko stałe pinu: nagłówek, `vectors_pin_is_23dd158e9`, oczekiwany `pin`), `tests/p6_8i_vectors/pick.json` (REGENERACJA, patrz niżej), `tests/p6_8i_vectors/helpers.json` (regeneracja bez różnic poza polem `pin`).

## ZAŁOŻENIA (do akceptacji)

* **Z1** — `data/terrain_map.rs::Generator` i `data/economy_society_part2.rs::AiParams` (poza allowlistą) dostały po jednym/dwa pola, bo oba mają `#[serde(deny_unknown_fields)]`; bez tego kopia danych z pinu nie parsuje się.
* **Z2** — `is_lake_adjacent_cached` (thread-local, klucz = wskaźnik+długość+odcisk układu wody) odtwarza semantykę cache `WeakMap` z `freshwater.ts`; `city_has_water_access_in` zachowuje sygnaturę (wołający `turn_economy_advance.rs:577` bez zmian).
* **Z3** (r2: UCHYLONE) — r1 odroczyła podpięcie `capital_min_separation_for_map_pin` do `compute_clusters`; r2 je wykonała (poz. 23–25, wektory zregenerowane z weba).
* **Z5** — `domain/state.rs` (poza allowlistą): nowa funkcja `compute_player_visibility_with_extra` (`compute_player_visibility` = wariant z `[]`); osobna funkcja zamiast pola w `ComputePlayerVisibilityOptions`, by nie łamać literałów struktury w `tests/p6_6a_visibility.rs`. Alternatywa (nowy `domain/visibility*.rs`) zdublowałaby istniejący moduł mgły.
* **Z6** — `dyspozycje/autobot/runs/R-RUSTPORT-P6-M09-KLASTRY-RYWALE-MIN-Q1/gen-m09-vectors.mjs` (generator M09, poza allowlistą): numery linii `clusters.ts` przesunęły się o deltę; wycinki lokalizowane po nazwie funkcji (`sliceFn`). Dowód: dla pinu starego generator odtwarza stare wektory bajt-w-bajt.
* **Z7** — `tests/p6_m12_tables.rs`: gałąź tabeli `sep = 0` wymaga `aktywne_typy = Some(1)` (od pinu 23dd158e9 `civCount >= 2` na małej mapie daje sep > 0); `tests/p6_1c_llama_seed.rs`: liczba przypadków 912 -> 960 (mapy z `generateMap` zregenerowane). Pozostałe asercje bez osłabień.
* **Z4** — `fort_sight_sources` zwraca `SightSource { q, r, radius: f64 }` (web: obiekt `{q, r, radius}`).

## REGENERACJA wektorów (uzasadnienie)

`tests/p6_8i_vectors/pick.json`: wektor starego pinu odtwarza się bajt-w-bajt generatorem z `git archive 4bbef081d`
(sprawdzone `cmp`), więc różnica 699/2227 scenariuszy (31%) pochodzi wyłącznie z delty weba (poz. 4–10). NIE osłabiono
żadnej asercji. Stare 2227 scenariuszy zostało (nowe oczekiwania z pinu 23dd158e9) i DOPISANO 412 scenariuszy
celowanych (`d4-*`: jezioro / ocean przy krawędzi / dwie wody bez krawędzi / `rzeka.obecna` bez `riverPaths` /
FAZA 0 z fortami własnymi, obcymi, warstwami, rollbackiem / losowe) = 2639. Rozmiar `pick.json` 4,6 MB (≤ 6 MB).
Wektory czystych funkcji: `tests/p6_repin4_vectors/*.json` (freshwater 0,41 MB, sight 17 kB, capsep 0,41 MB, topup 5,64 MB (5 637 451 B), topup_bound 3,18 MB, visibility 0,50 MB; każdy ≤ 6 MB).

### Dodatkowe REGENERACJE (skutek poz. 1–2: zdrowie miasta liczy jezioro)

Pełny `cargo test` po zmianie wykazał rozbieżność starych wektorów zdrowia (heks z zamkniętą wodą = +dostęp do wody):
`p6_adv_q3_vectors/q3.json`, `p6_adv_q4_vectors/{q4,q4b,q4c}.json`, `p6_adv_q5_vectors/q5.json`
(+ `unit_table_*.json` bez zmian), `p6_adv_q6_vectors/q6.json`. Każdy wygenerowany TYM SAMYM generatorem z URUCHOMIONEGO
weba, pin podmieniony na `23dd158e9` (kopie w `runs/…/tools/gen-p6-adv-q{3,4b-preview,5,6}-vectors.mjs`, różnica = wyłącznie
literał pinu). Różnice rozmiaru ≤ 190 B (pole `pin` + scenariusze z jeziorem) — asercje testów NIE zmienione.
`data_compliance`: `ekspansja_kara_polarna_sasiedztwo` (8) typowane jako całkowite (licznik N2 przypięty = 0).

## Mutacje (wyniki: `mutacje/mutate.py` M01–M18, `mutacje/mutate2.py` T01–T16)

Pick (przeciw `p6_8i_pick`): 17/18 ubitych; M12 (`step0_applies` `onRiverHex` -> `riverHexKeys`) przetrwała; mutant TEGO SAMEGO
wiersza w webie (`webmut.py`, 2639 scenariuszy) daje 0 różnic wyjścia => ekwiwalent obserwacyjny (neighbor-of-`rzeka.obecna` jest
i tak obsługiwany ścieżką E2/`riverKrok0Ok`).
Funkcje czyste (przeciw `p6_repin4_vectors`): 13/16 ubitych (T14 ubita po dodaniu baz 0,03/0,7 i celów 0,12/0,85);
przetrwały T07 (`>` vs `>=` na progu niedoboru — wymaga niedoboru dokładnie = progowi), T09 (fallback `minNb=1`), T16 (górny bufor
szerokości) — NIE_ZMIERZONO czy ekwiwalent. Łącznie 30/34 = 88% (< 90% wymagane: 4 przetrwałe bez dowodu ekwiwalencji — do Obrony).

## DŁUG (podział na tematy)

1. `R-RUSTPORT-VISIBILITY-Q1` — `computePlayerVisibility` + `extraSightSources` (poz. 16).
2. `R-RUSTPORT-CLUSTERS-SEP-POLAR-Q2` — poz. 23, 24, 25 + regeneracja wektorów M11/M12 z pinu 23dd158e9.
3. `R-RUSTPORT-AI-CITY-FOUNDING-POLAR-Q1` — poz. 21 (`ai.ts`, `pickBonusCityHex`; dane już w Rust).
4. `R-RUSTPORT-NEWGAME-DEFAULTS-Q1` — poz. 18 (`playable.rs`).
5. `R-RUSTPORT-MAPGEN-GENERATE-Q?` — poz. 27 (potok `generateMap`; `top_up_pangea_land_fraction` gotowe do wpięcia). **Kryterium „mapy bajt-w-bajt (hashe)” pozostaje OTWARTE** — brak potoku `generateMap` w Rust, więc brak hasha całej mapy; zweryfikowane są wyłącznie funkcje czyste i `compute_clusters`/`build_cluster_spawn_plan` na mapach z weba.
