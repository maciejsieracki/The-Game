STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T5B-MARSZ
GOAL: czyste funkcje marszu strzelca (_bestForwardStep, czesc decyzyjna _rangedForwardStep) 1:1 z pinem 07d2fbd72
ZMIANY/COMMIT: Final Control r4 (runda integracyjna) na bazie 7778e66af (merge 366e6ff8d na 83777efa9). Ancestry: 83777efa9 i 366e6ff8d sa przodkami 7778e66af (sprawdzone merge-base --is-ancestor). Diff 83777efa9..7778e66af: 10 plikow, 80286 dodan, 0 usuniec; tylko allowlista T5b (modul siege_tactics_ranged_forward.rs, mod.rs +1 linia, testy, generator, vectors.json) i raporty run dir. Brak Cargo.lock, gra/, view-model, renderer; brak #[ignore] w plikach T5b. (Poprzedni FC r2 = 366e6ff8d PASS-WITH-NOTES, w historii git.)
TESTY (odtworzone samodzielnie, rust-port/engine, df 11 GB przed bramkami): cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --test p6_k5doc_t5b EXIT 0 (17 passed, 0 failed, 0 ignored); cargo test --all-targets --no-fail-fast EXIT 0 (3827 passed, 0 failed, 1 ignored - istniejacy e2e dump, poza T5b). Pierwsza proba pelnego testu ucieta timeoutem 590 s narzedzia (nie bledem), powtorzona w tle do EXIT 0. Mutacje a/b/d: z r2 na tym samym kodzie, nie powtarzane (zgodnie z dodatkiem r4).
ZARZUTY:
1. Luka pokrycia filtra koperty sojuszniczej (!dead/!fading_out/!removed/!routed/!siege) w drugiej petli best_forward_step: ODDAL (nota). Kod zgodny z pinem 6865-6866, brak defektu; dodatkowy wektor na flage w kolejnej rundzie T5b/T8.
2. ranged_forward_step_key bez bramki lineAllowsRangedStep/_doMove i bez wolajacego poza testami: ODDAL. Zakres dispatchu (czyste funkcje), wpiecie to T8/#113; do rejestru.
3. Mutanty rownowazne (DIRS4 odwrocone, lateral <=, next_distance <=, next_col ..=BF_COLS, dolna granica -1.0): ODDAL. Dowod arytmetyczny w 02a-obrona-r4.md przyjety.
NAPRAW: brak. DO DECYZJI CZLOWIEKA: brak.
BLOKADY: brak
RUNDY: r4 integracyjna (FC), 4/5 wg dispatchu
NASTEPNY KROK: orkiestrator wykonuje FF rust-port/parity-v2 na 7778e66af (lub commit raportu FC), refs/keep, wpis w REJESTR-RUST.md (nota o luce wektorow filtra koperty i braku wolajacego).
DEPLOY/PUSH: NIE WYKONANO
