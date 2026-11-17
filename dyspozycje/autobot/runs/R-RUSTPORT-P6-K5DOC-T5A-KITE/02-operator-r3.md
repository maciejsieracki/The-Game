STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5A-KITE (K5DOC-T5a, #257) — runda 3 Operatora (DODATEK r3: poprawka pokrycia granic po FAIL Ewaluatora r2)
GOAL: czyste funkcje galezi KITE strzelca (_bestKiteShotStep, _nearestEnemyMelee, warunek galezi 1, MELEE_SAFE_GAP) z wektorami pinu 07d2fbd72; bez wpiecia w petle. Runda 3: pokrycie granic planszy w best_kite_shot_step.
BAZA: 761768677 (detached; commit Operatora r2; ref keep refs/keep/T5a-r2-op-761768677, galaz rust-port-wip/R-RUSTPORT-P6-K5DOC-T5A-KITE-r2). Pin 07d2fbd72 (tylko odczyt). Kod r2 NIE przepisany.
ZMIANY/COMMIT: allowlista (jawny git add):
  - rust-port/engine/tests/p6_k5doc_t5a_gen.mjs: +5 nazwanych przypadkow granicznych (generator wykonuje tekst pina).
  - rust-port/engine/tests/p6_k5doc_t5a_vectors/vectors.json: regenerowany generatorem (722 przypadki, bylo 718; losowe przypadki bez zmian, bo RNG nie jest uzywany przez nazwane).
  - rust-port/engine/tests/p6_k5doc_t5a.rs: +4 nazwane testy granic (best_granica_nc_ujemne_w_jedyny_odrzucony, best_granica_nc_ge_bf_cols_odrzuca_e, best_granica_nr_ge_bf_rows_odrzuca_s, best_granica_nr_ujemne_odrzuca_n) + importy BF_COLS (autobatch) i BF_ROWS (approach).
  - ten raport.
  - siege_tactics_kite.rs NIE zmieniany (po mutacjach przywrocony, cmp identyczny z kopia przed mutacjami).
  Cargo.lock nie zmieniany. Bez zmian mod.rs.

PRZYPADKI GRANIC (wszystkie wartosci oczekiwane = wykonanie pina 07d2fbd72; BF_COLS=68 (battleScene.ts:661), BF_ROWS=156 (:662)):
  Uwaga do opisu z dispatchu: pin ma BF_COLS=68, wiec kolumna 67 jest OSTATNIA POPRAWNA. Przypadek „nc >= BF_COLS” jest zbudowany jako origin w kolumnie 67, kandydat E = (68,5) poza plansza (zgodnie z opisem „kafelek w kolumnie 67” jako punkt startu kroku).
  - nc < 0: granica_nc_ujemne_w_poza_plansza_jedyny — origin (0,5), W (-1,5) jedynym kandydatem poza plansza (N/S zajete, E odpada na gap), oczekiwane None. Bez granicy W dalby 550 (movedBackAxis) i wygralby.
  - nc >= BF_COLS: granica_nc_ge_bf_cols_e_poza_plansza — origin (67,5) def, range 4, E (68,5) poza plansza dalby 450 i wygralby; pin wybiera N (67,4) = 400 (pierwszy w DIRS4 przy remisie z S).
  - nr >= BF_ROWS: granica_nr_ge_bf_rows_s_poza_plansza — origin (30,155) atk, E/W zajete, S (30,156) poza plansza jedynym kandydatem, oczekiwane None.
  - nr < 0: granica_nr_ujemne_n_poza_plansza — origin (30,0) atk, E/W zajete, N (30,-1) poza plansza jedynym kandydatem, oczekiwane None.
  Wszystkie 4 wektory maja tez wpisy w Rust (testy nazwane) i sa ujete w vectors_zgodne_z_pinem.

TESTY I BRAMKI (katalog CARGO_TARGET_DIR poza repo w scratchpadzie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
  - Generator: node rust-port/engine/tests/p6_k5doc_t5a_gen.mjs -> OK: 722 przypadkow (best_kite=413, z krokiem=103, nearest_melee=154, kite_gate=155). Wszystkie asercje `want`/`notWant` przeszly (wartosci z pina).
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (0 ostrzezen)
  - cargo test --all-targets --no-fail-fast: EXIT 0; suma passed 3792, failed 0 (r2: 3788; +4 nowe testy granic). p6_k5doc_t5a: 22/22 passed. p6_8i_pick: 5 passed, 0 failed, 232.26 s (w limicie; nie zawiesza sie).
  - git diff --check: OK.
  - df -h / przed bramkami: 9.2 GB wolne. Po bramkach (build cache): 1.3 GB wolne — target usuniety po raporcie (patrz NASTEPNY KROK).

MUTACJE (kazda: podmiana w kopii siege_tactics_kite.rs, `cargo test --test p6_k5doc_t5a`, przywrocenie z kopii; cmp po przywroceniu OK):
  - G (BF_COLS -> BF_COLS+1 w in_bounds): FAIL, EXIT 101; 2 failed: best_granica_nc_ge_bf_cols_odrzuca_e, vectors_zgodne_z_pinem.
  - H (BF_ROWS -> BF_ROWS+1 w in_bounds): FAIL, EXIT 101; 2 failed: best_granica_nr_ge_bf_rows_odrzuca_s, vectors_zgodne_z_pinem.
  - I (dolna granica wiersza 0 -> -1): FAIL, EXIT 101; 2 failed: best_granica_nr_ujemne_odrzuca_n, vectors_zgodne_z_pinem.
  - (a) NIEROWNOWAZNA gap <= dNow -> gap < dNow - 1 (wariant z r2): FAIL, EXIT 101; 6 failed: best_gap_nie_wiekszy_od_dnow_odrzuca, best_granica_nc_ujemne_w_jedyny_odrzucony, best_granica_nr_ujemne_odrzuca_n, best_granica_nr_ge_bf_rows_odrzuca_s, best_nieprzejezdny_odrzucony, vectors_zgodne_z_pinem.
  - (b) bonus movedBackAxis (+50) usuniety: FAIL, EXIT 101; 1 failed: vectors_zgodne_z_pinem.
  - (c) dMinAny <= 1 -> dMinAny < 1: FAIL, EXIT 101; 2 failed: best_dmin_any_le_1_odrzuca, vectors_zgodne_z_pinem.

NOTATKA (Ewaluator r2, notatka 2 — NIE blokuje, nieusuwana w tej rundzie): duplikaty helperow z modulow doktryny i pathstep:
  - siege_tactics_kite.rs: DIRS4 (f64), in_bounds, manhattan (Tile), advance_dir (BattleSide -> f64), enemies_of_kite — powielaja:
    DIRS4 i in_bounds i manhattan z siege_tactics_pathstep.rs (:32, :35, :40, prywatne);
    advance_dir z siege_tactics_doctrine_state.rs:87 (prywatne, zwraca i64);
    enemies_of z siege_tactics_doctrine_target.rs:171 (dla Combatant, nie Tile).
  Decyzja: konsolidacja po integracji T5a (osobny temat), bo wymaga zmiany widocznosci w cudzych modulach, poza allowlista tej rundy.

BLOKADY: brak. Uwaga procesowa: dispatch wymaga commitu bez nazwy modelu w trailerach; globalny reminder atrybucji prosi o Co-Authored-By modelu. Przyjeto zasade z dispatchu (bez nazwy modelu); trailer Claude-Session dodany jak w r2.
RUNDY: 3/5 (runda 3 po FAIL Ewaluatora r2: granice planszy).
NASTEPNY KROK: Evaluator r3 i Final Control (Sonnet) na commicie r3; integracja wylacznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO (brak push do rust-port/parity-v2 wg dispatchu; push tylko galezi roboczej rust-port-wip/*, jesli orkiestrator tak zleci).
