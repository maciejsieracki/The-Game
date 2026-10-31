STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8G-OKOLICA-Q1
GOAL: Port okolica.ts (pin 91dc998a) do rust-port/engine/src/domain/okolica.rs - runda 4 wg dispatchu: N1 hak rebalansu wpiety, N2 wektory z weba dla brakujacych funkcji + sortowanie z NaN dla n >= 64, N3 mutacje galezi sterujacych, N4 tabela symboli.
ZMIANY/COMMIT:
- Baza: origin/rust-port-wip/8G-r3 = 81d10a2ae (na 72491e442 = origin/rust-port/parity-v2), galaz lokalna p6-8g-okolica-r4.
- b765170cb feat: okolica/sort.rs (pelny TimSort jak V8, zastepuje stable_sort_by dla n >= 64); okolica/hook.rs (OkolicaPopulationHook implementuje PopulationChangeHooks); state.rs (City::okolica_reczne: Option<Reczne>, pole domyslnie None); generator + okolica.json (sekcje 7-11); tests/p6_8g_web_vectors_r4.rs; tests/p6_8g_hook.rs; tests/p6_6b_vectors/common.rs (1 linia: okolica_reczne: None).
- 4bbe0b60e test: rebalans z czesciowym wzrostem i wpisem 0; v8sort.json (138 przypadkow node/V8); okolica/sort/tests.rs; p6_8g_web_vectors.rs (oczekiwane 722 wektory rebalansu).
- SHA raportu: patrz git log (commit dokumentu po 4bbe0b60e).
- Allowlista: zmienione tylko okolica.rs, okolica/{auto,manual,sort,hook}.rs, okolica/sort/tests.rs, state.rs (pole okolica_reczne, rozszerzenie r4), tests/p6_8g_*.rs, tests/p6_8g_vectors/**, katalog runu. POZA allowlista (wymuszone kompilacja): tests/p6_6b_vectors/common.rs - jedna linia `okolica_reczne: None,` w literale City. Brak zmian w gra/**, renderer, src-tauri, Cargo.toml, WERSJE.md, mapgen. Cargo.lock nieslidzony, nie dodany.
- git diff --check: czysto (przed kazdym commitem).
TESTY (CARGO_TARGET_DIR=/dev/shm/civ-r4-target, CARGO_INCREMENTAL=0, CARGO_PROFILE_*_DEBUG=0):
- cargo fmt --check: EXIT=0.
- cargo clippy --all-targets -- -D warnings: EXIT=0.
- cargo test --no-fail-fast (crate): 246 suite'ow, 1878 passed, 0 failed, EXIT=0 (r3: 1869; +9: 4 hook, 4 r4-vectors, 1 v8 sort).
- Celowane: p6_8g_okolica 19/0; p6_8g_web_vectors 10/0; p6_8g_web_vectors_r4 4/0; p6_8g_hook 4/0; p6_7a_post_central 2/0; lib v8_sort 1/0.
- Pin 91dc998a: generator uruchomiony na `git archive 91dc998a gra/src gra/data` rozpakowanym do katalogu scratch (poza gra/), loader REPIN-B2 (node v22, --experimental-transform-types). Bez npm run build/dev. Liczniki: cityRange 22, surroundingCap 22, score 500, assignScore 2000, wagiFocus 5, keys 72, tiles 144, edge 12, locale 3136, auto 320, rebalance 722, adjust/toggle 9504, lost 9, collect 90, resolve 256, nanBig 24 (kandydatow >= 64 w kazdym wierszu); v8sort 138 przypadkow.
- Fixture okolica.json 2.7 MB (<= 6 MB), v8sort.json 151 KB.
MUTACJE (jedna naraz; po kazdej przywrocenie; wynik = EXIT cargo test, zestaw 8G):
- M1 rebalans shrink `while excess > 0.0` -> `> 1.0`: ZABITA (EXIT=101).
- M2 rebalans grow filtr wolnych `< 1.0` -> `<= 1.0`: ZABITA po dopisaniu wzrostow czesciowych (przed: PRZEZYLA, dziura w wektorach - naprawiona).
- M3 adjust +1 `current >= 1.0` -> `> 1.0`: ZABITA.
- M4 adjust limit `assigned >= pop` -> `>`: ZABITA.
- M5 adjust -1 `current <= 0.0` -> `< 0.0`: ZABITA.
- M6 toggle sprawdzenie centrum usuniete: ZABITA.
- M7 toggle galaz zdjecia `>= 1.0` -> `> 1.0`: ZABITA.
- M8 toggle limit `assigned < pop` -> `<=`: ZABITA.
- M9 computeLost promien `d > sib.radius` -> `>=`: ZABITA.
- M10 computeLost remis `d < winner_dist` -> `<=`: ZABITA.
- M11 collect filtr wlasciciela `==` -> `!=`: ZABITA.
- M12 js_cmp_diff `d > 0.0` -> `d >= 0.0`: PRZEZYLA - RÓWNOWAZNA. Dowod: wszystkie 4 wywolania (okolica.rs:318, 322, 325, 329) sa chronione guardem `!=` na tych samych operandach (okolica.rs:317, 321, 324, 328); dla roznych doubli a-b != 0 (IEEE 754, underflow stopniowy), wiec d == 0 jest nieosiagalne; NaN daje false w obu wariantach -> Equal.
- M13 minrun `r |= n & 1` -> `r |= 0`: ZABITA.
- M14 TimSort galop `wins_b >= min_gallop` -> `>` (sort.rs merge_low): PRZEZYLA na wektorach nanBig; ZABITA po dodaniu v8sort.json (node/V8).
- M15 resolve reczny `count <= 0.0` -> `< 0.0` (auto.rs:97): ZABITA.
- M16 resolve reczny obciecie do pop (auto.rs:104): ZABITA.
- M17 shrink filtr kluczy `> 0.0` -> `>= 0.0` (manual.rs:76): PRZEZYLA na pierwszym zestawie, ZABITA po wektorze 'zero' (TS `> 0`, web_rebalance_manual_matches_ts).
- M18 terytorium: wykluczenie centrum miast (with_center_and_exclude): ZABITA.
- M19 terytorium: warunek is_territory_hex_owned_by (terrain_and_territory_filter): ZABITA.
- Wszystkie mutacje cofniete; po M19 plik zgodny z commitem (git status: brak zmian w okolica*.rs i auto/manual).
BLOKADY: brak blokad technicznych. Notatki (ZALOZENIA, do oceny Evaluatora/FC):
1. Hak rebalansu jest wpiety adapterem (OkolicaPopulationHook), ale NIE jest wywolywany przez zywa sciezke gry: brak producenta/konsumenta poza testami. Test hook_* wola hak przez `dyn PopulationChangeHooks` dokladnie jak petla applyPostCentralPopulationGrowth (city_growth.rs:1614), a nie przez pelny apply_post_central_population_growth.
2. City::okolica_reczne nie jest czytane z zapisow JSON (loader stanu nieobjety zakresem r4; zachowanie istniejacego zapisu bez zmian). Pole zyje w pamieci sesji; migracja zapisu = NASTEPNA-PARTIA.
3. onCityPopulationChanged (callback UI weba) - no-op w Rust (ZALOZENIE: brak konsumenta).
4. yieldOfMapHex nie jest portowane: plony wstrzykiwane (`yield_of`); wektory uzywaja tabeli wyprodukowanej przez prawdziwe yieldOfMapHex z pinu - dowod konsumenta, nie samej funkcji.
5. Numeracja rund: dispatch mowi RUNDA 4/5 (N1-N4), orkiestrator w tresci zadania mowi Runda 1/5 i plik 01-operator-r1.md. Plik 01-operator-r1.md ISTNIEJE juz (raport rundy 1 na galezi r3) - nie nadpisywano; raport zapisany jako 04-operator-r4.md.
6. Tabela symboli (ponizej) jest w tym pliku; wiersze BRAK pozostaja jawne.
RUNDY: 4/5 (r1 BLOCK, r2 BLOCK, r3 BLOCK, FC r3 FAIL; r4 = ta runda). Decyzja wymagana: NIE.
TABELA SYMBOLI (TS okolica.ts linia -> Rust; status):
| TS | Rust | Status |
|---|---|---|
| OKOLICA_RADIUS (34) | - | BRAK-NIEUZYWANE (0 uzyc w gra/src) |
| CITY_RANGE_MIN/CAP (37,40) | terrain::city_range_for_population | REUZYTY, WEKTOR PASS (22) |
| cityRangeForPopulation (46) | terrain::city_range_for_population | REUZYTY, WEKTOR PASS |
| citySightRadius (56) | territory::city_sight_radius | REUZYTY (poza zakresem okolicy) |
| hexKeysWithinRadius (66) | improvement_build::hex_keys_within_radius + hex_disk_offsets | DEDUP, WEKTOR PASS (72 + 12 krawedzi) |
| isLandWorkableHex (89) | okolica::is_land_workable_hex | WEKTOR PASS |
| cityCenterKeysFromTerritoryNodes (110) | okolica::city_center_keys_from_nodes | WEKTOR PASS (r4: wiersze z terr), M18 ZABITA |
| terrainAndTerritoryFilter (128) | okolica::terrain_and_territory_filter | WEKTOR PASS (r4), M19 ZABITA |
| TileYield (148), OkolicaTile (149) | okolica::OkolicaYield, OkolicaTile | PORT (typy) |
| okolicaTiles (152) | okolica::okolica_tiles | WEKTOR PASS (144) |
| tileScore (176) | okolica::tile_score | WEKTOR PASS (500) |
| tileAssignScore (184) | okolica::tile_assign_score | WEKTOR PASS (2000) |
| AssignOptions (192), ScoredOkolicaTile (211) | okolica::AssignOptions, ScoredTile | PORT (typy) |
| compareScoredOkolicaTiles (218) | okolica::compare_scored | WEKTOR PASS (auto), M1/M2/M4 (r2), M12 rownowazna |
| scoreOkolicaTile (230) | okolica/auto.rs | WEKTOR PASS (auto 320) |
| foodPotentialOfMapHex (250) | okolica::food_potential_of_map_hex | WEKTOR posredni (auto focus zywnosc) |
| assignOptionsForFocus (257) | okolica/auto.rs::with_focus_potential | WEKTOR posredni |
| effectiveIsWorkable (270) | okolica::effective_is_workable | WEKTOR PASS (r4: adjust/toggle/resolve z terytorium i excl), M18/M19 ZABITE |
| assignWorkedTiles (294) | okolica/auto.rs | WEKTOR PASS (auto), MV1/MV2 (r3) |
| wagiForFocus (311) | okolica::wagi_for_focus | WEKTOR PASS (5) |
| ResolveWorkedTilesOpts (325) | okolica::ResolveWorkedTilesOpts | PORT (typ) |
| resolveWorkedTiles (338) tryb auto | okolica/auto.rs | WEKTOR PASS (320 + nanBig 24) |
| resolveWorkedTiles (338) tryb reczny | okolica/auto.rs | WEKTOR PASS (r4: 256), M15/M16 ZABITE |
| yieldOfMapHex (382) | - (wstrzykiwane yield_of) | BRAK, ZALOZENIE (nota 4) |
| seedReczneFromAuto (398) | okolica/auto.rs::seed_reczne_from_auto | WEKTOR posredni (rebalans, adjust auto) |
| countAssignedWorkers (422) | okolica::Reczne::count_assigned | PORT |
| pickDeterministicIndex (427) | okolica::pick_deterministic_index | WEKTOR posredni (grow) |
| rebalanceWorkersAfterPopulationChange (437) | okolica/manual.rs + okolica/hook.rs (hak) | WEKTOR PASS (722, r4: czesciowy wzrost, init one/zero), HAK WPIETY (nota 1), M1/M2/M17 ZABITE |
| adjustTileWorker (549) | okolica/manual.rs | WEKTOR PASS (r4: 9504 wierszy adjust+toggle), M3/M4/M5 ZABITE |
| surroundingWorkerCap (616) | okolica/manual.rs | WEKTOR PASS (22) |
| toggleTileWorker (628) | okolica/manual.rs | WEKTOR PASS (r4), M6/M7/M8 ZABITE |
| collectWorkedHexKeysForOwner (694) | okolica/sasiedztwo.rs | WEKTOR PASS (r4: 90 wierszy), M11 ZABITA |
| collectWorkedHexOwnerMap (721) | okolica/sasiedztwo.rs | WEKTOR PASS (r4), - |
| computeLostToNearerSiblingByCity (767) | okolica/sasiedztwo.rs | WEKTOR PASS (r4: 9 wierszy), M9/M10 ZABITE |
| js_cmp_diff (wewnetrzne, dla compare_scored) | okolica.rs:172 | M12 RÓWNOWAZNA (dowod: guardy okolica.rs:317-329) |
| v8 sort (wewnetrzne, TS Array.sort) | okolica/sort.rs | TimSort pelny; WEKTOR node/V8 (138 przypadkow) + nanBig n >= 64 PASS; M13/M14 ZABITE |
| localeCompare kluczy (wewnetrzne) | okolica::compare_scored (porzadek bajtowy) | WEKTOR PASS (3136 par) |
NASTEPNY KROK: Evaluator (niezalezna weryfikacja: uruchomic pin/generator i testy z galezi p6-8g-okolica-r4 ponownie, zweryfikowac mutacje M1-M19 i dowod M12), potem Final Control. Otwarte dla integracji: wpiecie haka w zywa petle gry (nota 1) i loader okolica_reczne ze stanu (nota 2) - do decyzji orkiestratora (NASTEPNA-PARTIA lub r5).
DEPLOY/PUSH: NIE WYKONANO
