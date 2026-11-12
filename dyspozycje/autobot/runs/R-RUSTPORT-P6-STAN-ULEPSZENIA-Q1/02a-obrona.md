STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1
GOAL: Obrona Operatora wobec zarzutow Evaluatora (runda 1 -> obrona). Kazdy zarzut: PRZYJMUJE (poprawka + dowod + commit) albo ODRZUCAM (dowod).
BAZA: 80e365169 (Operator r1, na da50d1753). Obrona = nowy commit na tej bazie. Pin web 07d2fbd72f758705f8e1d59cc4968027ffbafe75 (tylko odczyt, git archive do katalogu poza repo).
ZMIANY/COMMIT: SHA w sekcji DEPLOY/PUSH ponizej (commit obrony na gałęzi roboczej, bez push).
- NOWE: rust-port/engine/tests/p6_stan_ulepszenia_gen.mjs (generator stanu; te same wyciete funkcje weba co p6_power_improvements_gen.mjs; SHA-256 wycietego kodu 3cb3f155986d7c9d141ff171640977328218c5f3a44c325210fd7501fc510b93 = ten sam co w p6_power_improvements.rs).
- NOWE: rust-port/engine/tests/p6_stan_ulepszenia_vectors/vectors.json (164 przypadki stanu wygenerowane w node z pinu: 143 z wynikiem > 0, 21 z wynikiem 0, maks. 218).
- ZMIENIONE: rust-port/engine/tests/p6_stan_ulepszenia.rs (dopisane 4 testy; 6 starych testow bez zmian).
- NIE ZMIENIANO: src/**, gra/**, data/**, Cargo.toml, Cargo.lock (wygenerowany przez build, niesledzony, NIE commitowany), WERSJE.md, origin/main, push.

ODPOWIEDZI NA ZARZUTY

ZARZUT 1 (brak >=150 wektorow pinu na PlayableState): PRZYJMUJE.
- Poprawka: generator tests/p6_stan_ulepszenia_gen.mjs wykonuje w node wyciete funkcje weba (countImprovementsForOwner = foundingNodesForOwner + countImprovementsForNodes, pin 07d2fbd72) i produkuje PRZYPADKI STANU: mapa 16x16, warstwy ulepszen, miasta, forty, heksy poza mapa.
- Test tests/p6_stan_ulepszenia.rs::state_vectors_from_pin_match_wiring buduje PlayableState z kazdego przypadku i porownuje power_raw_for_owner(...).ulepszenia_terenu (Provided) z wartoscia weba. Wymog: >= 150 (STATE_MIN_CASES), sprawdzane tez: >= 50 niezerowych.
- Wynik: 164 przypadki, PASS.
- Granica (NIE_ZMIERZONO): wektory uzywaja prostokatnej mapy bez dziur (PlayableMap ma kafelek na kazdej pozycji width*height). Rzadka siatka weba (np. 316 z 361 heksow w boxie 19x19) NIE jest odtwarzana w stanie. To wymaga decyzji ABC (reprezentacja rzadkiej mapy w PlayableMap: zmiana modelu vs. akceptacja gestej siatki jako odwzorowania). Nie rozstrzygam sam.

ZARZUT 2 (tautologia testow): PRZYJMUJE.
- Nowy test porownuje wiring z OCZEKIWANIAMI WEBA (node, pin), nie z producentem Rusta. Blad konwersji stanu (x,y jako q,r, liczenie kluczy) wykryje sie tu, bo oczekiwanie nie zalezy od kodu Rusta.
- Stare testy (ulepszenia_layers_match_producer_on_same_inputs, fort_adds_territory_nodes_for_its_owner) zostaja jako testy spojnosci; NIE sa juz dowodem zgodnosci.

ZARZUT 3 (fort a wspolna granica bez dowodu): PRZYJMUJE CZESCIOWO.
- Poprawka: dodano test fort_changes_shared_border_pairs. Ustawienie: 6 miast (owner 1 x=1, owner 2 x=14, po 3 miasta, pop 5), przerwa x=7..8. Bez fortu: shared_border_pairs puste. Fort owner 1 w (9,4) (Fort): dokladnie 1 para. Fort z contested_useless=true: puste. PASS.
- NIE_ZMIERZONO: brak wektora z PINU dla karaWspolnaGranica z fortami (dispatch wymagal nowych przypadkow na wektorach p6_wire_war_pop shared_border). Oczekiwanie w tym tescie wynika z reguly weba (fort jako wezel terytorium, foundingNodesForOwner), nie z wykonania pinu. Ta czesc ZOSTAJE OTWARTA; wymaga rozszerzenia generatora o ownersHaveSharedLandBorder (trade-routes.ts) albo osobnego tematu.

ZARZUT 4 (odstepstwa od weba niezmierzone; brak testu pinu dla heksa poza mapa): CZESCIOWO PRZYJMUJE, CZESCIOWO ODRZUCAM.
- PRZYJMUJE (heks poza mapa): w wektorach stanu sa 145 heksow poza prostokatem (off_map), ktorych web nie zna (countImprovementsForNodes liczy tylko ISTNIEJACE heksy, main.ts:2654-2668). Test off_map_layer_contributes_nothing + wektory: wklad 0. PASS.
- ODRZUCAM (duplikaty wpisow improvements): w generatorze i w webie mapa to slownik po kluczu q,r (hexes), wiec powtorzona pozycja nie wystepuje w stanie pochodzacym z weba. Zachowanie "ostatni wygrywa" w improvement_counts_from_state dotyczy tylko recznie budowanego/niepoprawnego zapisu. Nie ma wektora pinu, bo web nie ma takiego stanu. Odstepstwo pozostaje opisane w komentarzu kodu (turn_war_inputs.rs, improvement_counts_from_state).

ZARZUT 5 (Provided(0.0) bez wektora z pinu): PRZYJMUJE (dowod dostarczony).
- Wektory stanu: 21 przypadkow z wynikiem 0 wg pinu (brak ulepszen lub brak wezlow wlasciciela). Wszystkie przechodza jako Provided(0.0), co potwierdza zgodnosc z web countImprovementsForOwner (nodes.length === 0 ? 0 : ...).
- Test ulepszenia: ulepszenia_are_provided_not_explicit_zero pozostaje.

ZARZUT 6 (bramki): potwierdzone, PASS (ponowne uruchomienie na 80e365169 + poprawki).

BRAMKI (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check (rust-port/engine): PASS (po cargo fmt tylko dopisanej sekcji p6_stan_ulepszenia.rs).
- cargo clippy --all-targets -- -D warnings: PASS (bez ostrzezen).
- cargo test --lib: 88/88 PASS.
- cargo test --test p6_stan_ulepszenia: 10/10 PASS (w tym state_vectors_from_pin_match_wiring, fort_changes_shared_border_pairs, off_map_layer_contributes_nothing).
- p6_power_army 7/7, p6_power_improvements 6/6, p6_power_nan 9/9, p6_power_nozeros 9/9, p6_power_producers 9/9, p6_power_rest 9/9, p6_power_sources 4/4: PASS.
- p6_wire_war_inputs 16/16, p6_wire_war_pop 9/9, p6_wire_war_epoch 9/9, p6_wire_war_view 6/6, p6_wire_war_state_snapshot 8/8: PASS.
- Pelny cargo test: NIE_ZMIERZONO (runda integracyjna).
- df /: 7,4 GB wolne przy starcie (ponizej progu 8 GB z dispatchu); kompilowano mimo to, CARGO_TARGET_DIR poza repo, usuwany po bramkach.

BLOKADY (otwarte, do decyzji/kolejnej rundy):
1. Rzadka siatka weba w PlayableMap (decyzja ABC: reprezentacja mapy vs. akceptacja gestej siatki). Wektory pinu na rzadkiej siatce NIE sa na stanie.
2. Wektory pinu dla karaWspolnaGranica z fortami (p6_wire_war_pop shared_border + przypadki z fortami): nie zrobione.
3. Pelny cargo test: runda integracyjna.

RUNDY: 2/5 (obrona Operatora, runda Operatora r1 -> FC zarzuty -> obrona).
NASTEPNY KROK: Evaluator (ponowna ocena zarzutow 1, 3 i 4-duplikaty) albo ABC w sprawie blokady 1 i 2.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; bez push, bez integracji).

---

## RUNDA r3 (obrona po werdykcie Evaluatora r2, 02-evaluator.md)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1
GOAL: Odpowiedz na zarzuty FC/Evaluatora z rundy r2 (zob. 02-evaluator.md, commit 290147499). Kazdy zarzut: PRZYJMUJE albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: jedyna zmiana kodu: komentarz doc `territory_nodes_from_state` w `rust-port/engine/src/domain/turn_war_inputs.rs` (zarzut 2). Bez zmian w testach, wektorach, asercjach i allowliscie.
BAZA: 290147499 (Evaluator r2; zawiera kod Operatora da037341e bez zmian).

### Zarzut 1 (niskie) — brak wektora pinu dla producenta terytorium z fortami
Werdykt: PRZYJMUJE jako dług, do nowego tematu. Bez zmiany kodu w tej rundzie.

- Konwersja `fort_nodes_from_state` JEST sprawdzana wektorami z pinu: `p6_stan_ulepszenia_vectors/vectors.json` ma 164 przypadki, w tym 112 z fortami i 39 z `contested_useless = true`; test `state_vectors_from_pin_match_wiring` porownuje wynik producenta ulepszen (ktory uzywa `foundingNodesForOwner` przez te sama konwersje) z pinem. Mutacja `contested_useless` w `fort_nodes_from_state` jest wykryta (zob. Evaluator r2).
- Czego NIE ma: pinowego wektora dla skladnika `heksy_terytorium` (countTerritoryHexes(statsTerritoryNodesForOwner) z fortami). Testy terytorium z fortami (`fort_adds_territory_nodes_for_its_owner`, `contested_useless_fort_is_ignored`, `foreign_fort_does_not_count_for_owner_one` w p6_stan_ulepszenia.rs) porownuja rozstrzygniecia Rust ze soba, nie z pinem.
- Luka jest realna, dotyczy skladnika terytorium (nie ulepszen). FC sam wskazal „Do nowego tematu”. Proponowany temat: STAN-ULEPSZENIA-TERYTORIUM-VEC (generator countTerritoryHexes + statsTerritoryNodesForOwner z pinu, wektory z fortami, >= 60 przypadkow).
- NIE_ZMIERZONO: pokrycie pinem skladnika terytorium z fortami.

### Zarzut 2 (kosmetyka) — komentarz `territory_nodes_from_state` wprowadza w blad
Werdykt: PRZYJMUJE. Poprawka + dowod.

- Zmiana: doc-komentarz przepisany tak, by opisywal to, co funkcja robi: miasta jak `buildAllTerritoryNodes` (main.ts:5667, bez fortow), forty jak `fortTerritoryNodes` (game/fort-territory.ts:141-146): flagi `fort`/`outpost`, `order = (builtAtTurn ?? 0, seq)` tylko gdy `seq` zapisane, pominiecie `contested_useless = true`.
- Dowod zgodnosci z pinem 07d2fbd72: fort-territory.ts:144 `if (f.contestedUseless) continue;` oraz :146 `if (typeof f.seq === 'number') node.order = { turn: f.builtAtTurn ?? 0, seq: f.seq };`. Wczesniejsze „jak web foundingNodesForOwner” dotyczylo filtra, ale `foundingNodesForOwner` (fort-territory.ts:199) sluzy producentom liczb, nie granicy.
- Testy po zmianie (tylko komentarz): `cargo fmt --check` EXIT 0; `cargo test --test p6_stan_ulepszenia_border --test p6_stan_ulepszenia`: p6_stan_ulepszenia 10/10 PASS, p6_stan_ulepszenia_border 2/2 PASS.

### Zarzut 3 (informacyjne) — rozstrzygniecia przez order tylko z grupy ukierunkowanej (16), remis builtAtTurn/seq nie mierzony
Werdykt: ODRZUCAM jako defekt; czesc dotyczaca remisu — NIE_ZMIERZONO.

- Liczba 16 nie jest progiem losowym ani probkowym: to wynik deterministycznego generatora (ziarno LCG stale, `p6_stan_ulepszenia_border_gen.mjs`) wykonanego w node na kodzie z pinu. Przy tym samym ziarnie te same 16 przypadkow w kazdym uruchomieniu; zmiana generatora zmieni liczbe i test ja wylapie (`BORDER_MIN_ORDER_CASES = 16` to dolny straznik pokrycia, nie zapas losowy).
- Czulosc: Evaluator wykryl zmiane `order` na przypadku 34 (zob. 02-evaluator.md).
- Brak zapasu (16 = minimum): zgadzam sie, ze to slaby margines. Nie zmieniam progu ani generatora w tej rundzie, bo zwiekszenie wymaga regeneracji wektorow i powinno wejsc razem z tematem z zarzutu 1. Zalecenie: w STAN-ULEPSZENIA-TERYTORIUM-VEC podniesc liczbe przypadkow `order`.
- NIE_ZMIERZONO: rozstrzyganie remisu `builtAtTurn` po `seq` osobno. Brak pomiaru, ktory wektor go wykonuje; nie podaje liczby.

### Zarzut 4 (informacyjne) — Cargo.lock niezacommitowany; sparse grid vs PlayableMap
Werdykt: ODRZUCAM jako defekt.

- Cargo.lock: dispatch wprost zakazuje jego commitowania (ZAKAZ: Cargo.lock; „Cargo.lock nie commitowac”). Cargo.lock nie trafil do commita.
- Sparse grid vs prostokatna PlayableMap (heks poza mapa wnosi 0): decyzja orkiestratora z dispatchu r2 (DECYZJA TECHNICZNA), pokryta 145 wektorami offMap. Bez zmiany reprezentacji.
- Oznaczam jako OTWARTE-niskie zgodnie z dispatchem r2.

### Testy po zmianie (runda r3)
- `cargo fmt --check` (rust-port/engine): EXIT 0
- `cargo test --test p6_stan_ulepszenia_border --test p6_stan_ulepszenia`: 10/10 + 2/2 PASS
- Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo (usuniety po bramkach).
- NIE_ZMIERZONO w tej rundzie: clippy, pelny cargo test (runda integracyjna, zgodnie z dispatchem).

BLOKADY r3:
1. Pokrycie pinem skladnika `heksy_terytorium` z fortami: otwarte, dlug do nowego tematu STAN-ULEPSZENIA-TERYTORIUM-VEC (zarzut 1).
2. Remis `builtAtTurn`/`seq`: NIE_ZMIERZONO (zarzut 3).
3. Sparse grid vs PlayableMap: OTWARTE-niskie, decyzja orkiestratora (zarzut 4).

RUNDY r3: obrona Operatora po werdykcie Evaluatora r2 (zarzuty 1-4). Limit 5 rund nieprzekroczony.
NASTEPNY KROK r3: Evaluator sprawdza wylacznie zmiane komentarza (diff jednej funkcji w turn_war_inputs.rs) i werdykty na zarzutach 1-4. Orkiestrator decyduje, czy zarzut 1 wchodzi jako nowy temat (rekomendacja: tak).
DEPLOY/PUSH r3: NIE WYKONANO (bez push, bez integracji).
