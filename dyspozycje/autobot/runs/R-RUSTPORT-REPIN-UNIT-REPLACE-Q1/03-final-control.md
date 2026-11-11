STATUS: PASS
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-UNIT-REPLACE-Q1
GOAL: port web "Zastap" (cost/context/execute/ai-plan) do Rust domain/unit_replace.rs z wektorami z weba
ZMIANY/COMMIT: kod kandydata f1d3a5f71 + raport 8a2f6fd7e (baza a006068f1, ancestor OK). 12 plikow, wszystkie w allowliscie (unit_replace.rs, mod.rs +1, tests/p6_repin_unit_replace_*, P6-REPIN-UNIT-REPLACE.md, runs/**). recruitment.rs i ai_era_unit_promotion.rs nietkniete (dozwolone: addytywnie).
TESTY (FC, samodzielnie, detached 8a2f6fd7e): cargo fmt --check exit 0; clippy --all-targets -D warnings exit 0; cargo test --lib 28 passed; p6_repin_unit_replace_pure 7 passed; p6_repin_unit_replace_execute 1 passed; 0 failed, 0 ignored, 0 nowych #[ignore]. Pliki <=600 LOC (320/202/270). NIE_ZMIERZONO: pelny cargo test wszystkich binarek (brak zmian danych/pinow).
ROZSTRZYGNIECIE ZARZUTOW R1: 1 ODDAL (zakres zrealizowany f1d3a5f71); 2 ODDAL (bramki zielone); 3 ODDAL (status R2 PASS-WITH-NOTES); 4 ODDAL (tabela w P6 par.1, INFANTRY zmierzona: 21 roznic = luka danych L-1); 5 ODDAL (SHA podane). Brak NAPRAW.
BLOKADY/DLUG (nie blokuja): L-1 dane INFANTRY units.json; L-2 klucz ai_zamiana_jednostek_limit_udzial brak w rust ai-params.json; L-3 wiring w ture/komendy (seria W); L-4 etykiety UI.
RUNDY: 2/5
SHA DO INTEGRACJI: 8a2f6fd7e (kod f1d3a5f71), galaz wf/R-RUSTPORT-REPIN-UNIT-REPLACE-Q1. Baza a006068f1 == origin/rust-port/parity-v2 (brak rozjazdu; fast-forward mozliwy). Przy integracji: git merge-base --is-ancestor f1d3a5f71 <SHA>, git diff --stat.
NASTEPNY KROK: integracja orkiestratora; osobne tematy R-RUSTPORT-REPIN-UNIT-REPLACE-DATA-Q1 (L-1, L-2) i wiring (seria W).
DEPLOY/PUSH: NIE WYKONANO
