STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1
GOAL: Niezalezna weryfikacja partii 1 (47110d3c0 / 5163cea26): bramki z surowymi logami, parity JSON, mutacje galezi sterujacych.
ZMIANY/COMMIT: Kod nie zmieniony (worktree detach na 5163cea26). Dodane: evidence/r2-fmt.log, r2-clippy.log, r2-cargo-test.log, r2-mut1-nan-guard.log, r2-mut2-budget-boundary.log, r2-mut3-link-radius.log; sekcja "Pomiary niezaleznego weryfikatora" w dyspozycje/rust-port/p6/P6-REPIN-WOJNA-NOWE-D.md; ten raport. Commit: patrz SHA w odpowiedzi. Allowlista zachowana.
TESTY: fmt EXIT=0. clippy -D warnings EXIT=0. cargo test --no-fail-fast EXIT=0: 1680 passed / 0 failed. git diff --check EXIT=0. JSON params identyczny z dc8a3adc:gra/data/war-allin-params.json. Mutacje: M3 link_radius `<=`->`<` ZABITA (units_within_link_radius_form_one_group). M1 usuniecie `budget.is_nan() ||` w extend_walk PRZEZYLA (14/14). M2 `budget <= 1.0`->`budget < 1.0` PRZEZYLA (14/14).
BLOKADY: (1) Luka mutacyjna: galaz NaN i granica N w extend_walk (nav.rs, odpowiednik web warAllInCapital.ts:458 `!(budget > 1)`) nie maja testu. (2) Wektory z uruchomionego weba dc8a3adc: NIE_ZMIERZONO (harness TS nie zbudowany). (3) Testy progow N-1/N/N+1 dla link_radius, merge_radius, no_merge_near_capital: NIE_ZMIERZONO; merge/no-merge bez testu progu. (4) W1/W2 i JSON w src/domain (zalozenia z 01-operator-r1.md bez zmian).
RUNDY: 1/5 (weryfikacja); po FAIL powrot do Operatora = runda 2/5
NASTEPNY KROK: Operator dopisuje testy w tests/p6_repin_wojna_d_nav.rs (lub nowym p6_repin_wojna_d_*): extend_walk z budget=NaN, budget=1.0 (N), budget=1.0+eps (N+1); progi link_radius N-1/N/N+1 oraz merge/no-merge; ponowna mutacja M1/M2 musi byc zabita. Potem Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO
