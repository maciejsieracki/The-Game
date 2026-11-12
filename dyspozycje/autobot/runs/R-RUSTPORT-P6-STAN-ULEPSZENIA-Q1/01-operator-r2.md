STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1
GOAL: Runda 2 (DODATEK r2, zarzut 3 FC r1): fort/posterunek a wspolna granica dowiedzione wektorami z pinu 07d2fbd72 (wykonanie w node), >= 60 przypadkow na PlayableState z pary z/bez wplywu fortu, obie konwersje fortow objete testem.
BAZA: d4a1a8215 (detached; ancestry 80e365169 -> adcb0694a -> d4a1a8215 sprawdzona). Pin web 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt, git archive do katalogu poza repo, usuniety po bramkach).
ZMIANY/COMMIT: SHA w sekcji DEPLOY/PUSH (commit Operatora r2 na galezi roboczej, bez push, bez integracji).
Allowlista: rust-port/engine/src/domain/playable.rs (pola PlayableFort built_at_turn/seq, serde default + skip_serializing_if); rust-port/engine/src/domain/turn_war_inputs.rs (konwersja fortow do wezlow terytorium); rust-port/engine/tests/p6_stan_ulepszenia.rs (adaptacja literalow PlayableFort: built_at_turn/seq z JSON, bez zmiany asercji); nowe rust-port/engine/tests/p6_stan_ulepszenia_border.rs, rust-port/engine/tests/p6_stan_ulepszenia_border_gen.mjs, rust-port/engine/tests/p6_stan_ulepszenia_border_vectors/shared_border.json; dyspozycje/autobot/runs/R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1/01-operator-r2.md.
Nie zmieniano: gra/**, rust-port/engine/data/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock (wygenerowany przez build, niesledzony, NIE commitowany), rust-port/engine/tests/p6_wire_war_pop_vectors/** (generator pop zostal bez zmian; nowy generator obok p6_stan_ulepszenia_gen.mjs, zgodnie z DODATKIEM).

## Zarzut 3: co zmierzono i co naprawiono

1. ROZBIEZNOSC RUST<->PIN ZNALEZIONA I NAPRAWIONA (playable.rs / turn_war_inputs.rs). W r1 `territory_nodes_from_state` budowal wezly fortow jako zwykle wezly miast (`TerritoryNode::new`: fort=false, outpost=false, order=None). Pin (`fortTerritoryNodes`, fort-territory.ts; `territoryOwnerAt`, map/territory.ts) traktuje forty inaczej: (a) miasta wygrywaja z fortami/posterunkami w tym samym heksie, (b) dwa forty rozstrzygane sa po `order` = (builtAtTurn ?? 0, seq), gdy `seq` jest zapisane. Poprawka: `PlayableFort` dostal pola `built_at_turn: Option<i64>` i `seq: Option<i64>` (#[serde(default, skip_serializing_if = "Option::is_none")], camelCase `builtAtTurn`/`seq`); `territory_nodes_from_state` ustawia `fort`/`outpost` wg rodzaju i `order = seq.map(|s| (built_at_turn.unwrap_or(0), s))`. Dowod, ze test lapie blad: przy tymczasowym wylaczeniu flag fort/outpost i order test pada na przypadku 34 (`granica z fortami (pin false)`); plik przywrocony do poprawnej wersji przed commitem.
2. WEKTORY Z PINU (`p6_stan_ulepszenia_border_gen.mjs`): node wykonuje wyciete z pinu: fortNodeAsCityNode, fortTerritoryNodes, territoryOwnerAt, axialDistance, cityTerritoryRadius, cityRangeForPopulation, isLandPassable, hexesInRadius, ownersHaveSharedLandBorder, keyOf, hexNeighborCoords, isWaterTerrain, HEX_NEIGHBORS; stale FORT_TERRITORY_RADIUS=5 / OUTPOST_TERRITORY_RADIUS=3 sa sprawdzane na pinie (pinConst); CITY_RANGE_* sa czytane z gra/data/miasto-params.json. Bramka karaWspolnaGranica (main.ts:22876) = >2 MIASTA po obu stronach && ownersHaveSharedLandBorder na wezlach buildAllTerritoryNodes (miasta + fortTerritoryNodes). Wynik: `expected` (z fortami) i `expected_without` (te same miasta, bez fortow). SHA-256 wycietego kodu: 60560089dc6a4e6988f073f996677bfed5c4f0a073d04abf9ff76a7d1b16615c (straznik w tescie).
   Generator (uzycie): `node rust-port/engine/tests/p6_stan_ulepszenia_border_gen.mjs <WEB_ROOT> 07d2fbd72f758705f8e1d59cc4968027ffbafe75 > .../shared_border.json` (WEB_ROOT = wypakowane gra/src i gra/data z pinu, Node 22).
   Statystyka wektorow (stderr generatora): 136 przypadkow; 51 z granica true; 30 par zmienianych przez forty (wszystkie 30: granica true dzieki fortom); 16 przypadkow ukierunkowanych, w ktorych kolejnosc budowy (order) rozstrzyga wynik pary (grupa kontestacji fortow roznych wlascicieli w luce miedzy skupiskami; generator zachowuje tylko przypadki, gdzie wynik zalezy od order).
3. TEST NA PLAYABLESTATE (`tests/p6_stan_ulepszenia_border.rs`): `shared_border_with_and_without_forts_matches_pin` — dla kazdego przypadku buduje PlayableState (mapa z terenem W/F/P, miasta, forty z rodzajem, contested_useless, built_at_turn, seq), sprawdza `shared_border_pairs` z fortami == expected oraz po wyczyszczeniu fortow == expected_without; wymusza >= 60 przypadkow, >= 10 par zmienianych przez forty, >= 16 przypadkow order. Test `fort_order_fields_roundtrip_and_legacy_load_without_them`: roundtrip pol kolejnosci i ladowanie zapisu bez nich (None).
4. KONWERSJA `fort_nodes_from_state` (producent ulepszen, foundingNodesForOwner): obejmuja ja wektory ulepszen z pinu w `p6_stan_ulepszenia` (state_vectors_from_pin_match_wiring, 164 przypadki, w tym przypadki z fortami; kontestacja `contested_useless` wchodzi w te wektory). Test wspolnej granicy nie uzywa tej konwersji; stad pokrycie dwoma zestawami testow, nie jednym. NIE_ZMIERZONO: osobnego wektora pinu dla `terytorium` z fortami (producent heksy_terytorium) — poza zakresem zarzutu 3.

## Odstepstwa (dispatch r2: OTWARTE-niskie)
- OTWARTE-niskie: rzadka siatka weba (heksy poza mapa wnosza 0) vs prostokatna PlayableMap. Decyzja orkiestratora: akceptowane, bez zmiany reprezentacji; pokryte wektorami offMap (145 heksow w p6_stan_ulepszenia) i testem off_map_layer_contributes_nothing. Nie zmieniano.
- Konwersja pomija `contested_useless = true` (zgodnie z pinem); `Some(false)` traktowane jak brak flagi (zgodnie z pinem: truthy check).

## Bramki (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usuniety po bramkach)
- cargo fmt --check (rust-port/engine): PASS (exit 0).
- cargo clippy --all-targets -- -D warnings: PASS (bez ostrzezen).
- cargo test --lib: 88/88 PASS.
- p6_stan_ulepszenia: 10/10 PASS (state_vectors_from_pin_match_wiring, fort_changes_shared_border_pairs, pozostale).
- p6_stan_ulepszenia_border (NOWY): 2/2 PASS.
- p6_wire_war_inputs 16/16, p6_wire_war_pop 9/9, p6_wire_war_epoch 9/9, p6_wire_war_view 6/6, p6_wire_war_march_adapter 5/5, p6_wire_war_state_snapshot 8/8: PASS.
- p6_power_army 7/7, p6_power_improvements 6/6, p6_power_nan 9/9, p6_power_nozeros 9/9, p6_power_producers 9/9, p6_power_rest 9/9, p6_power_sources 4/4: PASS.
- Pelny cargo test: NIE_ZMIERZONO (runda integracyjna).
- df /: 7,4 GB wolne przy starcie rundy (ponizej progu 8 GB; kompilowano mimo to, zgodnie z dispatchem); po bramkach 15 GB wolne.

## Zgodnosc wsteczna
- Nowe pola PlayableFort tylko z serde(default) + skip_serializing_if; zapis bez nich nie zawiera kluczy `builtAtTurn`/`seq`; zaladowanie zapisu sprzed zmiany daje None (test legacy).
- Brak migracji wymaganej: STOP nie zachodzi.

BLOKADY:
1. Pelny cargo test: runda integracyjna.
2. OTWARTE-niskie: rzadka siatka vs PlayableMap (patrz wyzej; decyzja orkiestratora).
3. NIE_ZMIERZONO: wektory pinu dla producenta `terytorium` z fortami (poza zarzutem 3).

RUNDY: 2/5 (Operator r2 po FC r1 = FAIL, zarzut 3). Zarzuty 1, 2, 4, 5 nie ruszane.
NASTEPNY KROK: Evaluator r2 (zarzut 3: generator i test wektorowy na PlayableState), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na galezi roboczej; bez push, bez integracji; SHA ponizej).
