STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-HARNESS-MUTACJE-Q1
GOAL: Skrypt mutacyjny (tests/, uruchamiany recznie, poza cargo test) dla ranged_phase w combat.rs: 4 mutacje w kopii, uruchomienie p6_combat_harness, raport FAIL/PASS per mutacja; combat.rs przywracany po skrypcie.
ZMIANY/COMMIT: allowlista: rust-port/engine/tests/p6_harness_mutacje.sh (nowy), dyspozycje/autobot/runs/R-RUSTPORT-P6-HARNESS-MUTACJE-Q1/01-operator-r1.md. Baza: cf281d785 (detached). SHA: commit na gałęzi roboczej (SHA w odpowiedzi orkiestratora). Cargo.lock nie commitowany (untracked, wygenerowany przez cargo).
TESTY:
- Test bazowy (bez mutacji): cargo test --test p6_combat_harness: 2 passed, 0 failed.
- Skrypt (bash rust-port/engine/tests/p6_harness_mutacje.sh), wynik:
  - M1 roll<=hit (`let hit = roll < hit_pct;` -> `<=`, 2 miejsca): HARNESS=FAIL (EXIT=101), mutant wykryty.
  - M2 odwrocenie klucza (interpretacja: zamiana pancerza celu w strzale ATK <-> DEF, `defender.armor` / `attacker.armor`): HARNESS=FAIL (EXIT=101), wykryty.
  - M3 usuniecie budzetu rund (`if total_rounds > max_rounds` -> `if false && ...`): HARNESS=FAIL (EXIT=101), wykryty.
  - M4 zmiana zaokraglenia (`hp -= damage_exact` -> `hp -= damage_exact.round()`, 2 miejsca): HARNESS=PASS (EXIT=0), mutant PRZEZYL.
  - Podsumowanie: zabite=3, przezyte=1, bledy=0 (z 4). combat.rs po skrypcie identyczny z HEAD (git diff --quiet).
- Bramki: cargo fmt --check: PASS (rc 0). cargo clippy --all-targets -- -D warnings: PASS (rc 0). cargo test --lib: 99 passed, 0 failed.
- Env: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo.
BLOKADY: brak blokad skryptu. Uwagi: (a) "odwrocenie klucza" w dispatchu nie precyzuje mutacji; przyjeto zamiane pancerza celu ATK<->DEF (NIE_ZMIERZONO inna interpretacja). (b) M4 przezyla: wektory pinu nie wykrywaja zaokraglenia obrazen w HP (prawdopodobnie brak ulamkowych obrazen w wektorach); luka do zgloszenia w COMBAT-HARNESS r2 (wektory ulamkowe), nie poprawiana tu (zakaz osłabiania asercji, poza allowlista).
RUNDY: 1/5
NASTEPNY KROK: Evaluator r1 - weryfikacja skryptu i interpretacji M2; decyzja o domknieciu luki M4 w COMBAT-HARNESS r2.
DEPLOY/PUSH: NIE WYKONANO
