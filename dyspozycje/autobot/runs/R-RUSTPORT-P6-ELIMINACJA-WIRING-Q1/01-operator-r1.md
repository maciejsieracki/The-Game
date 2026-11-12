STATUS: BLOCK
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1 (zadanie #114, ELIMINACJA-GRACZA)
GOAL: ustalic, czy `eliminate_owner` (rust-port/engine/src/domain/eliminacja.rs) ma produkcyjnego wolajacego w turze; jesli nie, wpiac go w miejscu wykrycia eliminacji wlasciciela w pinie 07d2fbd72.
ZMIANY/COMMIT: brak zmian kodu. Dodany tylko raport dyspozycje/autobot/runs/R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1/01-operator-r1.md. Baza: 23e33793e (gałąź wip/R-RUSTPORT-P6-ELIMINACJA-WIRING-Q1). Cargo.lock nie zmieniony.

WYNIKI ROZPOZNANIA (dowody):
1. `git grep eliminate_owner(` w 23e33793e, rust-port: jedyne wolania to testy (tests/p6_eliminacja.rs:202, 350, 353, 366). Brak wolania w src/. Brak produkcyjnej sciezki od tury do eliminate_owner.
2. Pin 07d2fbd72 gra/src/main.ts wywoluje eliminateOwner z dwoch miejsc: :35300 (annexCityStateToOwner, aneksja panstwa-miasta) oraz :35769 (sciezka eliminacji oldOwner po applyCapitalCapturePlunder).
3. Rust odpowiedniki tych miejsc nie maja produkcyjnego wolajacego:
   - run_capital_capture_plunder (rust-port/engine/src/domain/siege_capital_plunder.rs:510) zwraca Option<EliminationDetails> przy eliminacji, ale nie ma dostepu do PlayableState ani do zbioru wyeliminowanych i nie wola eliminate_owner.
   - Wolajacy run_capital_capture_plunder oraz apply_transfer_with_effects sa oznaczone w siege_transfer.rs:188 i siege_transfer_effects.rs jako "wolajacy niepodpiety - W8". Tura Rust nie wola tej sciezki.
   - annexCityStateToOwner: brak odpowiednika w rust-port/engine/src.
4. Wpiecie "minimalnym wolaniem" z allowlisty nie jest mozliwe bez: (a) zmiany sygnatury run_capital_capture_plunder (PlayableState + zbior wyeliminowanych), co lamie tests/p6_siege_capital_plunder.rs (poza allowlista); albo (b) podpiecia calego lancucha W8 (poza tematem). Samo wpiecie w eliminacja.rs nie daje wejscia z tury.
5. Istniejacy test pinu tests/p6_eliminacja.rs (wektory p6_eliminacja_vectors/vectors.json, generator p6_eliminacja_gen.mjs) przechodzi: 3 passed, 0 failed, 0 ignored.

TESTY:
- cd rust-port/engine && cargo test --test p6_eliminacja (CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR=/tmp/claude-0/wf-elim-target): wlasciciel_zero_i_powtorka_sa_no_op ok; ujemny_wlasciciel_nie_usuwa_nikogo_ale_trafia_do_zbioru ok; wektory_pinu_eliminacji_zgodne_z_webem_krok_po_kroku ok.
- NIE_ZMIERZONO: fmt --check, clippy --all-targets -D warnings, cargo test --lib (nie uruchamiane, brak zmian kodu).

BLOKADY:
- Brak produkcyjnego wolajacego eliminate_owner. Wpiecie wymaga decyzji orkiestratora o zakresie: wpiac w run_capital_capture_plunder ze zmiana sygnatury i aktualizacja p6_siege_capital_plunder, albo odlozyc do W8.
- Temat #115 (ZDOBYCIE-MIASTA-WIRING) i #141 (ELIMINACJA-GRACZA-DEALS-WOJNY-Q2) pokrywaja ten sam zakres; zalecenie: polaczyc.
- Kryterium 3 dispatchu (brak #[ignore], asercje) spelnione przez istniejacy test, ale kryterium 1 (sciezka od tury) niespelnione.

RUNDY: 1/5
NASTEPNY KROK: orkiestrator decyduje: (a) zamknac temat jako BLOCK i przeniesc wpiecie do #115/#141 z zaleznoscia od W8, albo (b) zaakceptowac zmiane sygnatury run_capital_capture_plunder (nowy dispatch z allowlista obejmujaca tests/p6_siege_capital_plunder.rs).
DEPLOY/PUSH: NIE WYKONANO
