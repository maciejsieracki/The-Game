STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: pipeline fazy Diplomacy przestaje byc martwy w produkcji: advance_turn z AI posiadajacym miasta przechodzi, run_war_turn dostaje realne wejscia (epoki, moc, blokady pokoju, pary hamulca, multiwar), bez cichych zer.
ZMIANY/COMMIT: kod ac3f0664727422a3e2f0e48056a68a95ab9a74a2 (gałąź wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1-r4, baza 56cb59bdc = BATCH7-tip). Pliki:
- NOWE: rust-port/engine/src/domain/turn_war_inputs.rs (443 LOC); tests/p6_wire_war_inputs.rs; tests/p6_wire_war_inputs_gen.mjs; tests/p6_wire_war_inputs_vectors/vectors.json (z pinu 07d2fbd72).
- ZMIENIONE: domain/mod.rs (pub mod), domain/turn_war_pipeline.rs (naprawa kompilacji bazy + wariant bledu), domain/playable.rs (jedno wolanie przez build_war_inputs/production_config + testy modulu), tests/p6_wire_war_pipeline.rs (tylko budowa ObjectivePowerRaw na Component, asercje bez zmian).
- Cargo.lock nie commitowany; gra/, origin/main, WERSJE.md, Cargo.toml nietkniete; brak pushu.
UWAGA O BAZIE: baza dispatchu 56cb59bdc (BATCH7-tip) NIE kompilowala sie (merge W8 r3 z POWER-NOZEROS: turn_war_pipeline.rs oczekiwal f64 z objective_power_for_owner, ktory zwraca Result). Naprawa w allowliscie: WarTurnError::PowerComponentsMissing(owner, klucze) (STRICT, nie zero) + epoki wymagane tez dla `me`. Polecenie zadania mowilo o parity-v2 f207ea6b1; parity-v2 (94cba6667) NIE zawiera pipeline'u (turn_war_pipeline.rs, brake_power_rest/army), wiec uzyto bazy z dispatchu r4.
TESTY (EXIT surowe, CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0 (51 passed)
- cargo test --test p6_wire_war_pipeline --test p6_wire_war_inputs --test p6_wire_war_diplo --test p6_brake_inputs --test p6_power_nozeros --test p6_power_rest: EXIT 0 (10+9+9+13+9+7 passed, 0 ignored)
- pelny cargo test --no-fail-fast: EXIT 0 (387 binarek/sekcji `test result: ok`, 0 FAILED), uruchomiony na kodzie ac3f06647 (pierwsza proba przerwana przez usuniecie CARGO_TARGET_DIR z zewnatrz, powtorzona w /tmp/vbuild-r4-target).
BLOKADY: brak blokujacych. Otwarte (jawne, NIE zgadywane): KNOWN_GAPS w kodzie, patrz nizej.
RUNDY: 4/5 (Operator r4, SONNET 5.5 wg dispatchu)
NASTEPNY KROK: Evaluator r4; potem decyzja orkiestratora o integracji (r5: oblezenie, glod, faza Ai/AI-AI, efekty deklaracji).
DEPLOY/PUSH: NIE WYKONANO

## Kryteria binarne dispatchu r4

1. advance_turn z AI z miastami przechodzi (2-3 tury, behawioralnie): SPELNIONE. Test `advance_turn_with_ai_city_passes_three_turns_and_ticks_the_pair` (playable.rs): 3 tury, tura 4, relacja gracz<->AI zapisana w `war.diplomacy`. Dwa testy odwrocenia stanu po bledzie (zepsuty zapis blokad -> WarTurn, kolejka/tura/war cofniete) zachowane, zmieniono tylko wyzwalacz bledu (dawny wyzwalacz, brak producentow, juz nie istnieje).
2. Wektory z pinu: SPELNIONE dla (a) `diploBrakeWarParams` (121 par kluczy cywilizacji, null = gracz) i (b) skladania tick -> brake z wspolna granica (48 scenariuszy x do 6 tur: epoki 1/1, 2/1, 3/2, 3/3, 3 pary civ, 4 stanow startowych; relacja po ticku i licznik kryzysu porownane z `tickDiplomacy` + `sharedBorderPenaltyForEpochs` + `crisisStepForPair` z pinu; porownano >100 tur). Zamyka zarzut Evaluatora r3 pkt 4. Bramka R1/R2: wektory istnieja w p6_brake_inputs (pin); na poziomie pipeline'u asercja wartosci Rust (ROZNICA B nizej), NIE wektor pinu dla calej fazy: NIE_ZMIERZONO jako wektor kompozytowy (web liczy bramke per deklaracja w kolejce wojny).
3. Brak cichych zer: SPELNIONE. Kazdy skladnik mocy = Provided (producent) albo ExplicitZero z powodem plik:linia pinu (`EXPLICIT_ZERO_REASONS`, test sprawdza `has_pin_file_line_ref`); `Component::Missing` -> `WarTurnError::PowerComponentsMissing` (test `strict_missing_component_is_an_error_not_a_zero`). Zly format blokad pokoju/meta -> `WarInputsError::BadMeta`; nieznana epoka startu -> `UnknownStartEpoch`; AI z miastem bez czlowieka -> `NoHumanPlayer`.
4. Istniejace testy p6_wire_war_* bez oslabionych asercji: SPELNIONE (p6_wire_war_pipeline: zmieniona wylacznie budowa wejscia na `Component`; wszystkie asercje identyczne, 10 passed).
5. Bramki zielone: tak (wyzej).

## Co dostarcza `turn_war_inputs.rs`

- Epoki (pkt 1): epoka wlasciciela = `numer_epoki[params.epoch_id]` (player-state-params.json). `common_border_delta` w pipeline'ie wynika z epok obu stron (`shared_border_penalty_for_epochs`), wektor z pinu wyzej.
- Moc (pkt 2), per wlasciciel: armia (Wojownik z units.json, `armia_for_owner`), terytorium (unia dyskow miast, heks istnieje gdy lezy na mapie), ludki/rekruci/miasta/kultura (`produce_for_owner`), infra/tech/religia (producenci POWER-REST na magazynach stanu), bitwy/ulepszenia/zdobycze = ExplicitZero z uzasadnieniem pinu (accumulatory web startuja puste; PlayableState nie zapisuje walk, ulepszen, eliminacji).
- Blokady pokoju (pkt 3): `peace_locks_from_war` czyta `forcedEraPeaceUntilNextEraByPairKey` i `diplomacyPairMeta` z `WarTurnState.opaque` (pary `[klucz "a-b", wartosc]`, brak klucza = brak blokad jak web `?? []`).
- Pary i multiwar (pkt 4): `pair_params_for` = web `diploBrakeWarParams` (wyzsza z dwoch `progWojnyRelacji`, `brake_relation_threshold`, N = `hamulec_n` tej strony; gracz = brak wiersza macierzy) z danych Rust (`diplomacy-war-peace-params.json`, `civ-matrix.json`); `multiwar_enabled = WAR_RULES_MULTIWAR_ENABLED = true` (pin war-rules-multiwar.ts:50). Wszystko zweryfikowane wektorem z pinu.
- Mapowanie id (pkt 5): `web_owner_id` / `rust_owner_id` (Rust 1 = web 0), test na wektorze (pary Rust (1,2) = web (0,1)); pipeline dziala w przestrzeni Rust, klucze `opaque` zapisane przez Rust sa w przestrzeni Rust (migracja kluczy z zapisu web = import, poza zakresem).

## Tabela roznic B (kolejnosc Rust) vs web, dopisek r4

| krok | faza Rust | faza/kolejnosc web | uzasadnienie / status |
|---|---|---|---|
| tick relacji pary + krok kryzysu | Diplomacy, tick wszystkich par, potem hamulec | web: tick pary, krok kryzysu po kazdej parze (`tickDiploAiAiPairsWithBrake`) | wynik identyczny (relacja i licznik zgodne z wektorem); ROZNICA B tylko w kolejnosci obliczen, nie w wartosci |
| bramka R1/R2 | raz na poczatku fazy, licznik wojen z `brake_phase.at_war` | web: per deklaracja w kolejce wojny, po wczesniejszych deklaracjach tej samej tury | ROZNICA B: w jednej turze dwie deklaracje jednego wlasciciela widza ten sam licznik; asercja wartosci Rust w `peace_lock_from_state_blocks_declaration...`; NIE_ZMIERZONO wektorem kompozytowym |
| blokada pokoju | liczona raz z `opaque` | web `isPeaceLockedBetween` per para w kolejce | wartosc zgodna (producent testowany, wektory p6_brake_inputs) |
| deklaracja wojny | zwracana w raporcie, efekty nie stosowane | web stosuje efekty od razu | poza zakresem r4 (r5) |

## KNOWN_GAPS (jawne luki, NIE_ZMIERZONO wzgledem web)

1. `commonBorder`: brak producenta wspolnej granicy; `shared_border` puste, wiec w produkcji tick nie nalicza kary granicznej (delta z epok jest wpieta i zweryfikowana, ale flaga granicy nie jest produkowana).
2. Epoka wlasciciela = epoka startu gry: PlayableState nie ma badan, wiec `empireEpochForOwner` nie rosnie.
3. `TickContext`: handel, religia, dobra wola, wiarygodnosc = domyslne (stan ich nie niesie).
4. Populacja miast = `FOUNDING_POPULATION` (1, jak `AiCity::new`), kultura = 0: PlayableState nie symuluje Economy. Gdy magazyny powstana, producenci MUSZA czytac je zamiast stalych.
Wartosci mocy w produkcji sa wiec poprawne wzgledem tego, co stan niesie, nie wzgledem pelnej gry web; porownanie liczbowe mocy calej gry z pinem: NIE_ZMIERZONO.

## PELNY RUN

cargo test --no-fail-fast na ac3f06647: FULL_EXIT=0, 387 wynikow `test result: ok`, brak FAILED. CARGO_TARGET_DIR (/tmp/vbuild-r4-target) usuniety po bramkach.
