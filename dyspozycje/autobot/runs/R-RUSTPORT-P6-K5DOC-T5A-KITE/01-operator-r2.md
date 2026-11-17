STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5A-KITE (K5DOC-T5a, #257) — runda 2 Operatora
GOAL: czyste funkcje galezi KITE strzelca (_bestKiteShotStep, _nearestEnemyMelee, warunek galezi 1, MELEE_SAFE_GAP) z wektorami pinu 07d2fbd72; bez wpiecia w petle.
BAZA: 7de3417e8 (detached); pin 07d2fbd72 (tylko odczyt).
ZMIANY/COMMIT: allowlista: rust-port/engine/src/domain/siege_tactics_kite.rs, rust-port/engine/tests/p6_k5doc_t5a.rs (zmiana typu w helperze testu), ten raport.
  - siege_tactics_kite.rs: best_kite_shot_step zwraca Option<CellKey> (cell_key(nc,nr) z siege_tactics_autobatch.rs) zamiast Option<Tile>.
  - p6_k5doc_t5a.rs: helper best() mapuje CellKey -> Tile przez f64::from_bits.
  - Bez zmian: mod.rs, generator gen.mjs, vectors.json, pozostale moduly. Cargo.lock nie zmieniany.
TESTY:
  - cargo fmt --check: EXIT 0
  - cargo clippy --all-targets -- -D warnings: EXIT 0 (0 ostrzezen)
  - cargo test --all-targets --no-fail-fast: EXIT 0; 3788 testow passed, 0 failed (p6_k5doc_t5a: 18/18 passed).
  - p6_8i_pick (w rundzie 1 wisial): na bazie 7de3417e8 konczy sie: 5 passed, 0 failed, czas 288.51 s (w limicie 590 s). Wolny test, nie zawieszony; nie naprawiany.
  - Mutacje (po kazdej plik przywracany i porownywany cmp z kopia oryginalu):
    (a) NIEROWNOWAZNA gap <= dNow -> gap < dNow - 1: FAIL (best_gap_nie_wiekszy_od_dnow_odrzuca, best_nieprzejezdny_odrzucony, vectors_zgodne_z_pinem; 3 failed).
    (b) bonus movedBackAxis (+50) usuniety: FAIL (vectors_zgodne_z_pinem; 1 failed).
    (c) dMinAny <= 1 -> dMinAny < 1: FAIL (best_dmin_any_le_1_odrzuca, vectors_zgodne_z_pinem; 2 failed).
  - git diff --check: OK.
BLOKADY: brak. Wektory JSON nie regenerowane (zmiana typu zwrotu nie zmienia danych; test mapuje wynik).
RUNDY: 2/5 (runda 2 po BLOCK INFRA i zarzutach Ewaluatora r1).
NASTEPNY KROK: Evaluator r2 i Final Control (Sonnet) na commicie r2.
DEPLOY/PUSH: NIE WYKONANO (brak push do parity-v2 wg dispatchu).
