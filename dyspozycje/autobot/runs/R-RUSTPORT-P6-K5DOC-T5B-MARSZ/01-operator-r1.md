STATUS: BLOCK
DOMAIN: INFRA
TEMAT: R-RUSTPORT-P6-K5DOC-T5B-MARSZ
GOAL: Port czystych funkcji marszu strzelca (_rangedForwardStep / _bestForwardStep, pin 07d2fbd72) do Rust z wektorami z pinu i mutacjami; bez wpiecia w ActivateOps (T8 / #113).
ZMIANY/COMMIT: baza origin/rust-port/parity-v2 = 625624d97 (detached, zweryfikowane: ancestor OK). Commit operatora na lokalnej gałęzi rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ (SHA w sekcji DEPLOY/PUSH). Allowlista:
  - rust-port/engine/src/domain/siege_tactics_ranged_forward.rs (NOWY, 1:1 z pinem: best_forward_step, ranged_forward_step_key, nearest_enemy_forward, enemies_of_forward)
  - rust-port/engine/src/domain/mod.rs (TYLKO linia pub mod siege_tactics_ranged_forward;)
  - rust-port/engine/tests/p6_k5doc_t5b.rs (NOWY)
  - rust-port/engine/tests/p6_k5doc_t5b_gen.mjs (NOWY, wykonuje tekst pina przez TypeScript)
  - rust-port/engine/tests/p6_k5doc_t5b_vectors/vectors.json (NOWY, 621 przypadkow)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T5B-MARSZ/01-operator-r1.md (ten raport)
  Cargo.lock nieutworzony i niescommitowany. gra/, origin/main, parity-v2 nietkniete.
TESTY:
  - Generator: `node rust-port/engine/tests/p6_k5doc_t5b_gen.mjs` -> OK: 621 przypadkow (best_forward=413, z krokiem=378; ranged_key=208), 21 nazwanych przypadkow z wartosciami zweryfikowanymi przez straznik want/notWant. Straznik wycinkow pina (linie 326-331, 337, 661-662, 1797, 1917-1919, 6743-6745, 6777-6787, 6822-6893, 8291-8304) przeszedl.
  - Bramki cargo (`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast`): NIE_ZMIERZONO. Powod: `df -h /` przed bramka = 2.7 GB wolne (wymagane >= 8 GB); zgodnie z dispatchem nie uruchamiano bramek na pol.
  - rustfmt 1.9.0 `--check --edition 2021` na dwoch nowych plikach Rust: OK (po `rustfmt --edition 2021`). To nie jest bramka `cargo fmt`, tylko sprawdzenie plikow.
  - Mutacje Rust (cargo test): NIE_ZMIERZONO (brak bramki cargo).
  - Mutacje na transkrypcji logiki w JS (osobny skrypt w scratchpadzie, NIE jest to test Rust; tylko sprawdza moc wektorow i niezmiennik wejsc):
      orig: 0 rozbieznosci z 621 wektorami (transkrypcja zgodna z pinem)
      (a) warunek postepu ostro -> nieostro (`forwardGain < 0` zamiast `<= 0`): FAIL, 67/621 rozbieznosci (np. postep_ostry_pionowy_zero_gain_odrzut). Nie jest rownowazny: przykład w wektorze `postep_ostry_pionowy_zero_gain_odrzut` (krok pionowy z forwardGain 0, rowGap +1).
      (b) granica `nc >= BF_COLS` -> `nc > BF_COLS`: FAIL, 1/621 (granica_nc_ge_bf_cols_jedyny_kandydat_null). Mutant jest rownowazny dla wejsc z wrogiem NA planszy: dla nc = BF_COLS i ux <= BF_COLS-1 zachodzi colNow = BF_COLS-1-eq, colDist = BF_COLS-eq, wiec forwardGain = -1 i kandydat i tak odpada. Wektor uzywa wroga poza plansza (69,5), zeby galaz granicy byla osiagalna.
      (c) kolejnosc DIRS4 odwrocona: PRZETRWA 0/621 -> MUTANT ROWNOWAZNY dla calego _bestForwardStep w pierwszej petli (dowod): remis (colDist, lateral) wymaga dwoch przyjetych kandydatow; pary E/W maja ten sam colDist tylko dla enemy.q == ux, a wtedy oba odpadaja (fg = -1, rg = 0). Pary N/S maja ten sam colDist i lateral 1, ale przyjecie N wymaga er < uy, przyjecie S wymaga er > uy (wzajemnie wykluczajace). Kolejnosc DIRS4 wplywa wiec tylko na remisy, ktorych nie ma. BFS uzywa wlasnej kolejnosci [row-1,row+1], nie DIRS4.
      (d) (dodatkowo) kolejnosc BFS [row-1,row+1] odwrocona: FAIL, 1/621 (bfs_kolejnosc_row_minus_1_przed_plus_1). To jest jedyna obserwowalna kolejnosc remisu w tym module.
  - Testy Rust w p6_k5doc_t5b.rs: napisane (bf_dimensions, enemies_of, nearest_enemy, best_* 6 testow, ranged_* 6 testow, wektory `wektory_zgodne_z_pinem` z asercjami liczników i obecności nazwanych przypadkow). Nie uruchomione (BLOCK).
BLOKADY:
  1. Dysk: 2.7 GB wolne na / (wymagane >= 8 GB przed bramka). Nie zwolniono cudzych targetow (zasada: nie ruszac dzialajacych workflow). Potrzebne: zwolnienie miejsca przez orkiestratora, potem ponowna runda bramek (ta sama runda 1, bez zmiany kodu).
  2. Zakres poza T5b, nieprzeczytany w calosci i NIE portowany (NIE_ZMIERZONO):
     - `_siegeMachineRange` (pin 7530): dispatch wymagal przeczytania przed decyzja o zakresie. NIE_ZMIERZONO w calosci. Sprawdzone, ze NIE jest wolane z `_rangedForwardStep` (6776-6811) ani z `_bestForwardStep` (6822-6893), wiec nie jest zaleznoscia T5b.
     - Bramka `lineAllowsRangedStep` (6791-6798): zalezy od `_effectiveMetaForUnit`, `_rangedFiringStepStaysBehindMelee`, `_compactAttackAllowsStep` (ten ostatni jest juz w K5EXEC-T2 w historii). NIE_ZMIERZONO jako czesc T5b; modul zwraca klucz kroku przed ta bramka.
     - Cialo `_doMove` i rekurencja `_schedule(STEP_GAP_MS, ...)` / `_rangedAction` po wejsciu w zasieg (6800-6811): nieczyste, poza zakresem.
     - Galaz APPROACH w `_rangedAction` (D2/D3/D4): NIE_ZMIERZONO, nie czytano tej galezi w tej rundzie; nie portowano.
  3. Trailery commitu: dispatch zabrania nazwy modelu w trailerach; zostawiono tylko linie Claude-Session, bez Co-Authored-By z nazwa modelu.
NASTĘPNY KROK: (1) orkiestrator zwalnia dysk do >= 8 GB; (2) Operator (runda 2 jako DODATEK r2 tego samego ID, ta sama baza 625624d97) albo orkiestrator uruchamia: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR=<poza repo, unikalny> cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --all-targets --no-fail-fast` w rust-port/engine, z kodami wyjscia; (3) mutacje (a)/(b)/(d) na module Rust z FAIL; (c) jako rownowazny z dowodem powyzej; (4) usunac target po bramkach.
RUNDY: 1/5. Ostatni werdykt: BLOCK (INFRA, dysk). Decyzja wymagana: brak (zwolnienie dysku przez orkiestratora).
DEPLOY/PUSH: NIE WYKONANO (brak push: dispatch zabrania pushu do parity; commit lokalny na rust-port-wip/R-RUSTPORT-P6-K5DOC-T5B-MARSZ).
