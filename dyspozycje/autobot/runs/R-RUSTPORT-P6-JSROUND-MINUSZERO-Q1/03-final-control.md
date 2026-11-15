STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-JSROUND-MINUSZERO-Q1
GOAL: Behawioralne pokrycie galezi -0 w js_round (bity, zgodnie z pinem), bez zmian kodu produkcyjnego.
ZMIANY/COMMIT: 16b901466 (ancestor 98dc92b9a, ancestor bazy f7baa3848 - potwierdzone merge-base). Diff vs baza: tests/p6_js_round_minus_zero.rs + 01-operator-r1.md + 02a-obrona.md; src bez zmian; Cargo.lock untracked.
TESTY (odtworzone przez FC, EXIT 0): fmt --check; clippy --all-targets -D warnings; test p6_js_round_minus_zero 8/8 (0 ignored); cargo test --lib 118/118. Mutacja (-0.0 -> 0.0 w js_round): 3 FAIL (-0.4,-0.5,-0.0), 5 PASS; plik przywrocony. Pin combat.ts:1159 `Math.round(rawDmg * ctrAtkVsDef)` zgodny.
ZARZUTY: 1 (hardkod z node) ODDAL; 2 (znak zera w polu damage) ODDAL; 3 (brzegi) obrona dopisala 3 testy - ODDAL; 4 bramki - potwierdzone.
BLOKADY: brak
RUNDY: 1/5
NASTEPNY KROK: integracja orkiestratora (READY_FOR_DEPLOY wystawia orkiestrator)
DEPLOY/PUSH: NIE WYKONANO
