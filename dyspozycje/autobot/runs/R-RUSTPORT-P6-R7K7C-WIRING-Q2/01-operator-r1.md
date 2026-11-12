STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING-Q2 (zadanie #106, runda 1)
GOAL: wpiac `apply_dipl_deltas_to_state` w `advance_turn` zgodnie z pinem 07d2fbd72; parytet "brak wpisu = 0"; wektory >= 150 dla apply i D3.
ZMIANY/COMMIT: kod 3dc2902ca (baza 23e33793e, galaz wip/R-RUSTPORT-P6-R7K7C-WIRING-Q2). Pliki: rust-port/engine/src/domain/playable.rs (wywolanie + test end-to-end w istniejacym module testow), rust-port/engine/tests/p6_r7k7c_apply_wiring.rs (nowy). Cargo.lock nie commitowany (usuniety z worktree).
  Miejsce wpiecia: `PlayableGame::advance_turn` -> `run_diplomacy_war_phase` (faza Diplomacy), po `run_war_turn` (D1-D8); przyrosty z `WarTurnReport.dipl.treasury_deltas` i `praca_deltas`. Blad apply -> ten sam `Err` co w fazie wojny -> cofniecie kolejki i wojny w `advance_turn`.
  Pin (07d2fbd72, gra/src/main.ts): `runDiplomacyTurnTick` :24229; D3 `tickCyclicResourceTradeDeals()` :24271; D6 `tickDiplomacyPayments` :24277; `buildDiploTreasury().add` :22624-22645 (zapis `aiSkarbiecByOwner`); bank skarbca AI :38950-38970.
  Odchylenie pozycji: w Rust przyrosty po D8 (hamulec); hamulec czyta moc z wejsc zbudowanych PRZED krokami D (`build_war_inputs`), wiec nie widzi skarbcow -> wynik rownowazny. Udokumentowane w komentarzu przy wywolaniu.
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0
  - cargo test --lib: 100 passed, 0 failed
  - cargo test --test p6_r7k7c_apply_wiring: 4 passed (brak wpisu delty = brak zmiany; pusta delta = stan identyczny; delta bez producenta = blad bez zmiany; advance_turn bez delt nie rusza pul)
  - cargo test --lib war_pipeline_advance_tests: 4 passed (w tym nowy advance_turn_moves_tribute_from_ai_treasury_to_human_treasury: danina AI 40/tura -> gracz +40, AI 500 -> 460)
  - NIE_ZMIERZONO: pelny `cargo test --tests` (przerwany: dysk 0 MB wolnego na wspolnym wolumenie; po usunieciu wlasnego katalogu target zwolniono ok. 2,5 GB, nie ponowiono).
  - Wektory pinu (kryterium 2): NIE WYKONANO (patrz BLOKADY).
BLOKADY:
  1. Kryterium 2 (>= 150 wektorow z pinu dla `apply` i dla D3): NIE_ZMIERZONO / BLOCK.
     - `apply_dipl_deltas_to_state` nie ma funkcji pinu: w pinie zapis jest wbudowany w `buildDiploTreasury().add` / `aiSkarbiecByOwner.set`, zamknietych w domknieciu main.ts; generator .mjs nie ma czego zbundlowac bez przerobki pinu (poza allowlista).
     - D3 `tickCyclicResourceTradeDeals` (main.ts:24077) to tez domkniecie w main.ts; zgodnie z komentarzem w tests/p6_r7k7c_owner_pools.rs nie da sie go zbundlowac bez przerobki pinu.
     - Wymaga decyzji: zgoda na refaktor pinu (poza allowlista) albo zmiana kryterium.
  2. Kryterium 3 czesciowo: testy "brak wpisu = 0" sa, ale BEZ wektora pinu (wynika z pkt 1). Brak wpisu w mapie DELT = zero zmiany. Producent AI nieobecny przy wpisie delty pozostaje BLEDEM (`WarTurnError::DiplStep`), a pin czyta `aiSkarbiecByOwner.get(id) ?? 0`. To OTWARTE odchylenie, oznaczone w turn_war_dipl_steps.rs jako DECISION_REQUIRED (zarzut 1, 02a-obrona.md); nie zmieniane tu.
  3. RYZYKO PRODUKCYJNE (decyzja przed integracja): producenci `ai_treasury_by_owner` i `praca_pool_by_owner` nie sa zasilane w produkcji (tylko settery scenariuszowe/testowe). Po wpieciu kazda delta dla wlasciciela bez producenta zatrzyma `advance_turn` (blad fazy wojny), a wczesniej byla cicho pomijana: (a) AI jako odbiorca daniny od gracza, (b) praca_deltas dla gracza ludzkiego (brak wpisu w praca_pool_by_owner). Pin zapisuje te przyrosty bez bledu. Wymagana decyzja: producent w produkcji albo polityka dla brakujacego producenta.
  4. Cargo.lock: cargo wygenerowal go przy pierwszym buildzie; usuniety, nie zacommitowany.
RUNDY: 1/5
NASTEPNY KROK: Decyzja wlasciciela (pkt 1 i 3), potem Evaluator (wektory pinu) i Final Control. Bez zmian w parity-v2, origin/main, gra/.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji).
