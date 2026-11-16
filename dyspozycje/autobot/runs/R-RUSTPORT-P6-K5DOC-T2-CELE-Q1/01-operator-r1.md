STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T2-CELE-Q1
GOAL: Port wyboru celu wg priorytetow z pinu 07d2fbd72 (battleScene.ts): _unitBattleClass, _prefsForUnit, _priorityScore (+0.45 jazda vs wloznia), _pickTargetByPriority, _pickAdjacentTargetByPriority, _pickRangedTargetByPriority, _rangedTargetInRange, _targetInRange (z filtrem _meleeBlockedByWall), warunek strzalu shootingEnabled !== false.
ZMIANY/COMMIT: nowe: rust-port/engine/src/domain/siege_tactics_doctrine_target.rs, rust-port/engine/tests/p6_k5doc_target.rs, rust-port/engine/tests/p6_k5doc_target_gen.mjs, rust-port/engine/tests/p6_k5doc_target_vectors/vectors.json; zmiana: rust-port/engine/src/domain/mod.rs (jedna linia `pub mod siege_tactics_doctrine_target;`); raport dyspozycje/autobot/runs/R-RUSTPORT-P6-K5DOC-T2-CELE-Q1/01-operator-r1.md. Cargo.lock NIE commitowany. Commit: patrz SHA w odpowiedzi orkiestratora (commit na detached HEAD worktree, bez push).
BAZA: 126432304 (z dispatchu). Uwaga: origin/rust-port/parity-v2 wskazuje obecnie 585bb48e, nie uzyto go, bo dispatch podaje SHA bazy.
TESTY:
- node rust-port/engine/tests/p6_k5doc_target_gen.mjs: 2823 przypadkow (7 nazwanych + po 400 losowych na rodzaj, seed 2026); straznik SHA-256 fragmentow pina: 991a05cd3b9a687bbb96246854232002165b10e384a3b8b138644551decd14fc.
- cargo test --test p6_k5doc_target: 5/5 OK.
- Mutacje (wszystkie FAIL): (a) usuniety bonus +0.45 -> 5 rozbieznosci (m.in. jazda_bonus_antyjazda_przesuwa_wybor); (b) tie-break po HP zamiast dystansu w _pickTargetByPriority -> 59 rozbieznosci (remis_po_dystansie_nie_lowest_hp); (c) wylaczony filtr _meleeBlockedByWall -> 7 rozbieznosci (melee_blokowany_przez_mur). Modul przywrocony po kazdej mutacji.
- cargo fmt --check: EXIT 0 (rustfmt na dwoch nowych plikach).
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --all-targets --no-fail-fast: EXIT 0 (493 wynikow `test result: ok`, zero FAILED).
- Srodowisko: CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR=/home/user/scratch_k5/target-t2 (poza repo; do usuniecia po bramkach).
BLOKADY:
- Generator to transkrypcja JS wycietych fragmentow pina (jak istniejace p6_*_gen.mjs), nie wykonanie TS. Tresc meleeBlockedByWall (city-fortification.ts:76-79) odtworzona wg Rust, nie hashowana. NIE_ZMIERZONO: wykonanie oryginalnego kodu TS.
- Brak wpiecia w produkcje (ProdBody / siege_tactics_loop.rs nietkniete) - zgodnie z zakresem, wpiecie w T8 / #113.
- Brak testow celu dla _pickRangedTargetByPriority w pelnej petli kiteingu (T5a) - poza zakresem.
RUNDY: 1/5. Ostatni werdykt: brak (runda Operatora).
NASTEPNY KROK: Evaluator (Sonnet): weryfikacja wektorow wzgledem pina (fragmenty 1917-1919, 1956-1960, 2323-2327, 6241, 7041-7053, 8291-8294, 8361-8371, 8373-8410, 17486-17584) i mutacji; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
