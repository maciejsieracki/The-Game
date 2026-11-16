STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-PROD-UNIT-STAN-T0
GOAL: pola stanu doktryny jednostki, GroupDoctrine i _forwardCol bez zmiany zachowania
ZMIANY/COMMIT: kod 3e041ecbe, obrona 0da6e7567; baza 1a4982574 jest przodkiem (merge-base --is-ancestor OK). Zmiany tylko w allowliscie (siege_tactics_doctrine_state.rs, mod.rs, siege_tactics_loop.rs, tests/p6_k5doc_state.rs, runs/**), z wyjatkiem zarzutu 2 (ProdBody). gra/ i Cargo.lock nietkniete.
TESTY (odtworzone przez FC na 0da6e7567): cargo fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0, 3633 passed, 0 failed, 1 ignored (istniejacy). Cytaty pinu 07d2fbd72 (6742-6748, 1938-1939) zgodne z kodem. Mutacje (a),(b),(c) potwierdzone w raportach Evaluatora i Obrony (FC nie powtarzal).
BLOKADY: brak

ORZECZENIE ZARZUTOW
1. Duplikacja stanu: ODDAL (naprawione w 3e041ecbe: dry_col, held_after_fallback, mounted usuniete z ProdDoctrineState; zrodlo = ActivateUnit). Otwarte: ProdBody nie zapisuje dry_col/held_after_fallback z powrotem do pu.activate -> warunek wstepny dla T1-T9 (zmiana zachowania U7.6, poza T0).
2. Pola w ProdBody zamiast ProdUnit: ODDAL, DO DECYZJI CZLOWIEKA/orkiestratora (akceptacja odstepstwa lub rozszerzenie allowlisty o tests/p6_k5loop_outcome_pin.rs:173). Uzasadnienie zweryfikowane jako prawdziwe.
3. Testy domyslnych: ODDAL (dodano test wielu jednostek i pustej strony; mutacja ranged_kite).
4. Brak wolajacego: ODDAL (zgodne z dispatchem).
5. Znaczniki w wiadomosci operatora: ODDAL (kosmetyka, plik czysty).
Zero NAPRAW -> PASS-WITH-NOTES.

RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (merge-tree, FF), decyzja o pkt 2 i warunek wstepny pkt 1 do rejestru dla T1-T9
DEPLOY/PUSH: NIE WYKONANO
