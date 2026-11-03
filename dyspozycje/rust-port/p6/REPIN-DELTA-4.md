# REPIN-DELTA-4 — pin weba 4bbef081d -> 23dd158e9 (R-RUSTPORT-REPIN-DELTA-4-Q1, runda 1/5)

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
| 14 | `game/fort-territory.ts:359-369` `fortSightSources` | behawioralny (czysty) | `fort_territory.rs::fort_sight_sources` | **PORT** (funkcja) — `fort_sight_sources_match_web` (120 przypadków); KONSUMENT = DŁUG (poz. 16) |
| 15 | `fort-territory.ts` nagłówek (komentarz „TWARDE terytorium”) | komentarz | — | **N/D** |
| 16 | `game/visibility.ts:268-310` `extraSightSources` w `computePlayerVisibility`; `main.ts:11566,11651,14440,14875,15088` (`refreshFog`, `fortSightSources` w mgle) | behawioralny (mgła) | brak `computePlayerVisibility` w Rust (jest tylko `pathfinding.rs:1304 compute_visible_at`); `main.ts` = warstwa gry | **DŁUG** `R-RUSTPORT-VISIBILITY-Q1` (port `computePlayerVisibility` + `extraSightSources`) |
| 17 | `main.ts:26572-26637` `installCivTestHooks` | tylko test | — | **N/D** |
| 18 | `main.ts:40629,40712`, `newGameMapDefaults.ts:462-474`, `ui/newGameFlow.ts:1717,2222`, `ui/buildModeHud.ts:211` | UI / domyślne kreatora (Pangea 60 / Wyspy 50 / Kontynenty 30) | `playable.rs:79,153` ma stałe `land_fraction_percent: 30` (poza allowlistą) | **DŁUG** `R-RUSTPORT-NEWGAME-DEFAULTS-Q1` (domyślny udział lądu per typ) |
| 19 | `data/map-gen-params.json` `generator.capital_sep_short_side_coef` (0,21) + `data/map-gen-params-loader.ts:224-230` | dane + loader | `rust-port/engine/data/map-gen-params.json` (kopia z pinu), `data/terrain_map.rs::Generator.capital_sep_short_side_coef` (ZAŁOŻENIE: `deny_unknown_fields`), `cluster_layout.rs::map_gen_capital_sep_short_side_coef` | **PORT** |
| 20 | `data/ai-params.json` `ekspansja_waga_plonu_heksu` (0,3), `ekspansja_kara_polarna_sasiedztwo` (8) | dane | `rust-port/engine/data/ai-params.json` (kopia), `data/economy_society_part2.rs::AiParams` (+2 pola; ZAŁOŻENIE: `deny_unknown_fields`) | **PORT** (dane); konsumenci patrz 21 |
| 21 | `game/ai.ts` (+102): `terrainYieldRowForId`, `hexCityScore` (waga plonu), `aiPolarNeighbourhoodPenalty`, `findCityFoundingHex` (zakaz polarny, fallback tylko bez miasta) ; `game/ai-difficulty-bonus.ts:204-218` `pickBonusCityHex` (polarny tylko jako fallback) | behawioralny (AI) | `ai_turn.rs` i pokrewne — POZA allowlistą; `pickBonusCityHex` bez odpowiednika (`grep pick_bonus_city_hex` = 0) | **DŁUG** `R-RUSTPORT-AI-CITY-FOUNDING-POLAR-Q1` |
| 22 | `map/clusters.ts:1530-1590` `capitalMinSeparationProportional`, `capitalSepFeasibleCap`, `CAPITAL_SEP_AREA_FACTOR(_SMALL)`, `capitalMinSeparationForMap(…, civCount, landCount)` | behawioralny (czysty) | `mapgen/cluster_layout.rs` (`capital_min_separation_proportional`, `capital_min_separation_for_map_pin`) | **PORT** (funkcje) — `capital_separation_matches_web` (4860 przypadków) |
| 23 | `clusters.ts:3522-3585` wywołania `capitalMinSeparationForMap(…, nTypy, landCountForSep)`, `clusterCenterPlacementSepForMap`, log `capital-sep`, `ClusterPlacement.capitalMinSep` (:132,:4362), `cluster-spawn.ts:254-262` | behawioralny | `cluster_compute.rs:461,517,1365` nadal woła STARY `capital_min_separation_for_map` (tabela) | **DŁUG** `R-RUSTPORT-CLUSTERS-SEP-POLAR-Q2` (podpięcie + REGENERACJA wektorów M12 z pinu 23dd158e9) |
| 24 | `clusters.ts:2355` `pickCapitalHexInRegion` — odwrócony komparator sortowania (`da−db` zamiast `db−da`) | behawioralny | `cluster_layout.rs:850 pick_capital_hex_in_region` | **DŁUG** (ten sam temat Q2: zmiana zmienia wynik `compute_clusters`, wymaga regeneracji wektorów M11/M12) |
| 25 | `clusters.ts` `polarProximityTier`, `dropPolarHexCandidates`, `ladowePlayer` vs `ladowe`, `isPlayerLayout`, klucz `polar` w sortowaniu (:364-400, :627-700, :779-790, :812-815, :994-997, :1202-1263, :1813-1845, :2426-2735, :3540-3780) | behawioralny (AI unika terenu polarnego) | `cluster_compute.rs`, `cluster_layout.rs`, `cluster_mass.rs` | **DŁUG** `R-RUSTPORT-CLUSTERS-SEP-POLAR-Q2` |
| 26 | `map/gen-helpers.ts:3697-3845` `topUpPangeaLandFraction` (fazy 1–3, stałe `PANGEA_TOPUP_*`) | behawioralny (czysty) | `mapgen/landsea.rs::top_up_pangea_land_fraction` | **PORT** (funkcja) — `top_up_pangea_matches_web` (117 scenariuszy, 85 z dosypem) |
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
* **Z3** — `capital_min_separation_for_map_pin` jest NOWĄ funkcją obok starej; nie podpinam jej do `compute_clusters`, bo bez poz. 24–25 daje to mapy rozbieżne z webem na terenach z Polarnym, a wymaga regeneracji wszystkich wektorów M11/M12 (poza budżetem rundy 1).
* **Z4** — `fort_sight_sources` zwraca `SightSource { q, r, radius: f64 }` (web: obiekt `{q, r, radius}`).

## REGENERACJA wektorów (uzasadnienie)

`tests/p6_8i_vectors/pick.json`: wektor starego pinu odtwarza się bajt-w-bajt generatorem z `git archive 4bbef081d`
(sprawdzone `cmp`), więc różnica 699/2227 scenariuszy (31%) pochodzi wyłącznie z delty weba (poz. 4–10). NIE osłabiono
żadnej asercji. Stare 2227 scenariuszy zostało (nowe oczekiwania z pinu 23dd158e9) i DOPISANO 412 scenariuszy
celowanych (`d4-*`: jezioro / ocean przy krawędzi / dwie wody bez krawędzi / `rzeka.obecna` bez `riverPaths` /
FAZA 0 z fortami własnymi, obcymi, warstwami, rollbackiem / losowe) = 2639. Rozmiar `pick.json` 4,6 MB (≤ 6 MB).
Wektory czystych funkcji: `tests/p6_repin4_vectors/*.json` (freshwater 0,4 MB, sight, capsep 0,4 MB, topup 3,0 MB).

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
5. `R-RUSTPORT-MAPGEN-GENERATE-Q?` — poz. 27 (potok `generateMap`; `top_up_pangea_land_fraction` gotowe do wpięcia).
