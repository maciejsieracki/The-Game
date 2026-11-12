STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-AKUMULATORY-WIRING-Q1
GOAL: Wpiac akumulatory mocy AI (battle_power_pts / zdobycze_power) do produkcyjnych sciezek bitwy, zdobycia i eliminacji. WYNIK: w Rust NIE ISTNIEJE produkcyjna sciezka dla zadnego z trzech zdarzen (patrz BLOKADY). Dostarczono adapter na PlayableState + wektory pinu + test end-to-end przez power_raw_for_owner.
BAZA: 82bb87fb1 (detached); zrodla pinu 07d2fbd72 (git archive gra/src gra/data, SHA-256 zgodne z generatorem)
ZMIANY/COMMIT: rust-port/engine/src/domain/playable.rs (+28: trzy metody adaptera PlayableState::power_record_battle_win / power_record_city_capture / power_clear_eliminated_owner delegujace do WarTurnState); rust-port/engine/tests/p6_power_acc_wiring.rs (nowy, 3 testy); rust-port/engine/tests/p6_power_acc_wiring_gen.mjs (nowy generator, wykonuje kod z pinu); rust-port/engine/tests/p6_power_acc_wiring_vectors/vectors.json (nowy, 480 przypadkow); ten raport. Nie zmieniono: combat.rs, war_turn_state.rs, turn_war_*.rs, siege_*.rs, gra/**, rust-port/engine/data/**, Cargo.toml, Cargo.lock. Brak migracji i brak nowych pol stanu (serde bez zmian).
TESTY:
- cargo fmt --check (rust-port/engine): PASS (rustfmt na zmienionych plikach)
- cargo clippy --all-targets -- -D warnings: PASS (exit 0)
- cargo test --lib: PASS, 94 passed
- cargo test --test p6_power_acc_wiring: PASS, 3 passed (480 przypadkow z pinu przez power_raw_for_owner; niezerowe bitwy i zdobycze >= 30)
- cargo test --test p6_power_battle_acc: PASS, 11 passed (bez zmian asercji)
- cargo test --test p6_power_improvements: PASS 6; p6_power_nozeros: PASS 9; p6_power_nan: PASS 9; p6_power_army: PASS 7
- PRZED ZMIANA (pre-existing; diff nie dotyka tych plikow):
  * p6_wire_war_inputs, p6_wire_war_pop: nie kompiluja sie (E0063, brak pola `improvements` w PlayableMap).
  * p6_power_sources: nie kompiluje sie (E0599, brak metod record_battle_win / battle_power_pts_for na WarTurnState w tym tescie).
  * p6_power_rest: FAIL rest_table_covers_six_components_with_explicit_sources (asercja rest_no_producer_keys().is_empty()).
  * p6_power_producers: FAIL 2 testy (oczekuja braku producenta dla bitwy/zdobyczy, a brake_power_*.rs maja je juz jako RustProducer).
  Nie naprawiano (poza allowlista / poza tematem).
- Pelny cargo test: NIE_ZMIERZONO (wg dispatchu zostaje dla rundy integracyjnej).
- Wektory: generator wykonuje pinowe battlePowerPointsFromDefeatedEnemy i barbarianCapturedPowerGain oraz instrukcje main.ts (battlePowerPtsByOwner.set, blok zdobyczy, delete x2). Odtworzenie vectors.json z pina daje wynik zgodny z istniejacym generatorem p6_power_battle_acc_gen.mjs.
BLOKADY (brak wolajacego w produkcji; zgodnie z dispatchem NIE tworzono nowych sciezek):
1. Wygrana bitwy (main.ts:34487-34490, record_battle_win): combat.rs::resolve_combat ma jako wolajacego tylko wrapper combat::resolve (combat.rs:379) i testy. Brak produkcyjnej petli walki wyznaczajacej zwyciezce i sume pola przegranego. Adapter power_record_battle_win gotowy; wolajacy NIE ISTNIEJE.
2. Zdobycie miasta/obozu barbarzyncow (main.ts:35669-35675, record_capture_power_gain): apply_transfer_with_effects (siege_transfer.rs:340) wolany tylko z testow; run_capital_capture_plunder niepodpiety (komentarz W8, siege_transfer.rs:188). Adapter power_record_city_capture gotowy; wolajacy NIE ISTNIEJE.
3. Eliminacja (main.ts:35399, :35410, clear_power_accumulators_for_owner): w src nie ma zadnej funkcji eliminacji wlasciciela (grep 'eliminat' w src: brak). Adapter power_clear_eliminated_owner gotowy; wolajacy NIE ISTNIEJE.
4. Pinowe main.ts:2819 (drugie wejscie computeObjectivePower, bitwyPktSum): zgodne z power_raw_for_owner (wygraneBitwy literal 0). main.ts:19222 (wygraneBitwy: 0.5) to inny obiekt, nie zapis akumulatora. NIE_ZMIERZONO szczegolowo poza tymi liniami.
NASTEPNY KROK: podpiac wolajacych dopiero po powstaniu produkcyjnej petli walki (combat) i sciezki eliminacji. Osobny temat na naprawe 4 pre-existing failures z sekcji TESTY.
DEPLOY/PUSH: NIE WYKONANO (wg dispatchu: bez push i bez integracji)
