STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M06A4-LAD-MORZE-RESZTA3-Q1
GOAL: Niezalezny pomiar (weryfikator, mutacje, gate'y) runda 2 po Operatorze-impl f316caac. Kod landsea.rs bez zmian, zakres: purgeDesertEnclaveWater.
ZMIANY/COMMIT: Commit pomiarow po f316caac (SHA: patrz log galezi detached HEAD). Pliki: 02-operator-pomiary-r2.md, verifier-pomiary-r2.log, probe-m05-pomiary-r2.log, mut-results-pomiary-r2.jsonl, gate-fmt-pomiary-r2.log, gate-clippy-pomiary-r2.log, gate-test-pomiary-r2.log, sekcja "Operator-pomiary (runda 2, na f316caac)" w dyspozycje/rust-port/p6/P6-M06A4-LAD-MORZE-RESZTA.md. Kod i wektory bez zmian. Untracked Cargo.lock nie commitowany.
TESTY:
- Weryfikator: gen-m06a4-vectors.mjs uruchomiony na git archive edb8fb56 gra/src gra/data (poza repo). Wynik: 707 przypadkow, 71 kluczy, sha ab934703... cmp z web-vectors.json: IDENTICAL. Rozmiar 6 790 798 B.
- Mutanty (mut-runner-m06a4.py, 18 ID): 14 ZABITYCH (M01, M03, M04, M06-M12, M14, M16-M18), 4 PRZEZYTE (M02, M05, M13, M15), 0 BUILD_ERROR. Wynik identyczny z r3/r4.
- Dowody przezytych: M02 i M13 równoważne (dowod arytmetyczny z dokumentu). M05 równoważna po stronie webu: probe H in [1,3000], 4501497 par, 0 roznic; zgodnosc portu: tests/p6_m01_climate.rs:64-77 (odczyt kodu, nie uruchamiano osobno). M15 NIE równoważna ogolnie: równoważna tylko na domenie generatora (Z-1); brak testu zabijajacego (klucze -1,4 i 3,-2 sa numeryczne).
- cargo fmt -- --check: EXIT=0 (gate-fmt-pomiary-r2.log).
- cargo clippy --all-targets -- -D warnings: EXIT=0 (gate-clippy-pomiary-r2.log).
- cargo test --no-fail-fast: EXIT=0, 1253 passed, 0 failed; p6_m06a4_landsea 3/3 ok (gate-test-pomiary-r2.log).
- git diff --check: czysty.
BLOKADY: brak technicznych. Luka testowa M15 (klucz niekanoniczny nieprzetestowany) do zamkniecia w nastepnej rundzie testem Rust-only.
ZAŁOŻENIA:
- Z-P2-1: M15 traktuje sie jako luke testowa z udokumentowanym Z-1, nie jako równowazna mutacje.
- Z-P2-2: dowod M05 rozszerzony o H in [1,2] (0 roznic); H > 3000 nadal NIE_ZMIERZONO (brak dowodu analitycznego).
- Z-P2-3: pomiar nie zmienia kodu, testow ani wektorow; progi nieruszone.
RUNDY: 2/5 (ten wpis to pomiar tej samej rundy).
NASTEPNY KROK: Evaluator i Final Control na commicie pomiarów (po f316caac). Partia 3 (trimEnclosedOceanOnly najpierw, Z-3) w nastepnej rundzie, wraz z testem M15.
DEPLOY/PUSH: NIE WYKONANO
