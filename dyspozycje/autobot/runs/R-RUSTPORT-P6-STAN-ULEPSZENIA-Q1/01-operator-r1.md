STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-STAN-ULEPSZENIA-Q1
GOAL: Stan nie niesie ulepszen terenu ani fortow/posterunkow. Dodano warstwy ulepszen per heks i liste fortow do PlayableState, podpieto producenta `ulepszenia` do `power_raw_for_owner` (Provided zamiast ExplicitZero) oraz forty do wezlow terytorium i wspolnej granicy (KNOWN_GAPS[1] w czesci fortow zamkniete).
BAZA: da50d1753 (origin/rust-port/parity-v2 po INTEG-B15). Worktree: detached HEAD na da50d1753. Pin web 07d2fbd72 nie byl zmieniany (tylko odczyt).
ZMIANY/COMMIT: allowlista dispatchu.
- rust-port/engine/src/domain/playable.rs: `PlayableMap.improvements: Vec<PlayableHexImprovement>` (`#[serde(default, skip_serializing_if = "Vec::is_empty")]`), typ `PlayableHexImprovement {position, ulepszenie, ulepszenia}`, typ `PlayableFortKind {Fort, Posterunek}`, typ `PlayableFort {q, r, owner_id, kind, contested_useless}`, `PlayableState.forts: Vec<PlayableFort>` (`#[serde(default, skip_serializing_if = "Vec::is_empty")]`). Literaly `PlayableMap`/`PlayableState` w `build_map`, `PlayableGame::new`, `PlayableState::empty` zaktualizowane (pola puste).
- rust-port/engine/src/domain/turn_war_inputs.rs: `fort_nodes_from_state`, `improvement_counts_from_state`; `power_raw_for_owner`: `ulepszenia_terenu = Provided(ulepszenia_for_owner(...))` z heksami w mapie (heks spoza mapy = None, bez warstwy = 0); `heksy_terytorium` dostaje forty; `territory_nodes_from_state` (uzywane przez `shared_border_pairs`) dolicza forty bez `contested_useless = true`. KNOWN_GAPS[1] przepisany: fort-owa czesc luki usunieta, pozostaje tylko konwencja x,y=(q,r) (zachowana dlugosc tablicy = 5, zeby nie oslabiac asercji testu). EXPLICIT_ZERO_REASONS bez zmian (ulepszenia juz nie bylo na liscie; komentarze poprawione).
- rust-port/engine/tests/p6_stan_ulepszenia.rs (NOWY): 7 testow — Provided(0) bez warstw, zgodnosc z producentem na tych samych wejsciach, fort powieksza terytorium, fort contested_useless ignorowany, fort obcego wlasciciela nie liczy sie, forty same nie tworza wspolnej granicy (regula >2 miast), zgodnosc wsteczna: pola pominiete gdy domyslne, zapis bez `forts` laduje sie, roundtrip.
- rust-port/engine/tests/p6_wire_war_epoch.rs, p6_wire_war_pop.rs, p6_wire_war_inputs.rs: tylko literaly `PlayableMap { ..., improvements: Vec::new() }`.
- rust-port/engine/tests/p6_wire_war_inputs.rs (zmiana asercji, NIE oslabienie): linia `assert_eq!(raw.ulepszenia_terenu, Component::ExplicitZero)` -> `Component::Provided(0.0)` (stan bez warstw daje realne 0 z producenta; poprzednia asercja opisywala stara luke). Wymienione zgodnie z dispatchem.
- Nie zmieniono: gra/**, rust-port/engine/data/**, Cargo.toml, Cargo.lock (nie commitowany; plik wygenerowany przez build jest niesledzony i zostaje poza commitem), WERSJE.md, origin/main, push.
- Zgodnosc wsteczna: brak migracji. Nowe pola z `#[serde(default)]` + `skip_serializing_if`; test wsteczny w p6_stan_ulepszenia.rs sprawdza wczytanie zapisu bez `forts` (fixture generowany w ttescie z aktualnej serializacji, NIE plik fixture sprzed zmiany).
TESTY (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo):
- cargo fmt --check (rust-port/engine): PASS (przed ostatnia edycja testu p6_wire_war_inputs; ponowne sprawdzenie w kroku commit)
- cargo clippy --all-targets -- -D warnings: PASS (przed ostatnia edycja jednej asercji)
- cargo test --lib: 88 passed, 0 failed
- cargo test --test p6_power_* (army, improvements, nan, nozeros, producers, rest, sources): wszystkie PASS (6+7+9+9+9+9+4 przypadkow wg plikow)
- cargo test --test p6_stan_ulepszenia: 7 passed
- cargo test --test p6_wire_war_* (declare, declare_peace, dipl_steps, diplo, epoch, forced_step, inputs, pop, stores, state, state_owner, state_snapshot, view, march_adapter, pipeline, siege_aiai, march_core): wszystkie PASS po poprawce asercji ulepszen (przed poprawka: 1 FAILED w p6_wire_war_inputs::production_power_inputs_have_producers_for_all_stored_components, teraz PASS)
- NIE_ZMIERZONO: pelny `cargo test` (zgodnie z dispatchem wykona runda integracyjna); `df` przed startem: 16 GB wolne na /.
BLOKADY:
1. NIE SPELNIONE: "wektory z pinu: >= 150 przypadkow dla producenta ulepszen NA PlayableState". Istniejace wektory pinu (p6_power_improvements_vectors, 167 przypadkow: 87 heksowych + 80 wlasicielskich) testuja producenta na funkcjach brake_power_improvements, nie na PlayableState. Proba przeniesienia 80 wektorow wlasicielskich do PlayableState nie jest mozliwa wprost: siatka PlayableMap jest gesta (kazda pozycja w width*height ma kafelek), a wektory pinu sa rzadkie (316 z 361 heksow w prostokacie 19x19, sprawdzone node), wiec heks spoza `hexes` stalby sie istniejacym. Wymaga decyzji: (a) reprezentacja rzadkiej mapy w stanie (zmiana modelu mapy = wieksza zmiana), albo (b) akceptacja wektorow na funkcjach + testy wiringu z sekcji 'p6_stan_ulepszenia' jako dowod podpiecia.
2. Wiring `ulepszenia_terenu` i terytorium z fortami zweryfikowany testami spojnosci (wartosci liczone producentem na tych samych wejsciach), nie wektorami web na stanie. Gap: brak web-pin dla przypadku 'fort + warstwy + miasto' w PlayableState.
3. Wspolna granica: forty tylko w wezlach terytorium (shared_border_pairs); nie dodano wektora pinu z fortami dla karaWspolnaGranica (dispatch: 'nowe przypadki z fortami'); obecnie test: forty same nie tworza pary.
4. Brak zapisu wektorow z fortami z pinu (pin nie byl uruchamiany w node w tej rundzie; generator tests/p6_power_improvements_gen.mjs nie rozszerzono).
5. Pozostala luka KNOWN_GAPS[1] (konwencja x,y mapy jako (q,r)) i pozostale KNOWN_GAPS[0,2,3,4] bez zmian.
RUNDY: 1/5 (Operator).
NASTEPNY KROK: Evaluator — zweryfikowac kod wedlug GOAL i pozycji BLOKAD 1-4; decyzja wlasciciela (ABC) w BLOKADZIE 1: wariant (a) lub (b).
DEPLOY/PUSH: NIE WYKONANO (commit lokalny na gałęzi roboczej; push i integracja poza zakresem Operatora).
