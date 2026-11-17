STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-K5DOC-T7B-ODWROT (K5DOC-T7b, runda 4 wg dodatku r4)
GOAL: Port `_bestFallBackStep` i `_fallBackStep` (ODWROT strzelca bez amunicji) do Rust jako czysta logika kroku, z wektorami wykonanymi z pinu 07d2fbd72.

ZMIANY/COMMIT:
- Baza r4: 61ffc110f (ancestry f85622878 w 61ffc110f: TAK). Worktree przestawiony detached na 61ffc110f (wczesniej d44d5b982, czysty).
- Kod T7b (siege_tactics_fallback.rs, mod.rs +1 linia, p6_k5doc_t7b*) przeniesiony z 61ffc110f BEZ zmian; diff f85622878..61ffc110f = 5 plikow, +21039 (allowlista).
- Mutacje (a), (b), (c) wykonane na pliku roboczym, kazda przywrocona; cmp z kopia wzorcowa = IDENTICAL.
- Commit: tylko ten raport (jawny git add). Brak zmian kodu w tej rundzie.

TESTY (rust-port/engine; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; CARGO_TARGET_DIR poza repo):
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --test p6_k5doc_t7b: EXIT 0 (2 passed, 0 failed)
- cargo test --all-targets --no-fail-fast: EXIT 0 (suma: 3843 passed, 0 failed); test pick_auto_improvements_matches_pinned_web_vectors przekroczyl 60 s, ale calosc zakonczyla sie kodem 0
- timeout 900 cargo test --test p6_8i_pick: EXIT 0, 5 passed, czas 298,6 s (4 min 59 s); nie zawiesil sie w tej rundzie
- Mutacje (MUSZA dac FAIL):
  (a) `d_min < d_now` -> `<=`: EXIT 101, FAIL wektora wektory_pina_sa_zgodne_z_best_i_krokiem (tests/p6_k5doc_t7b.rs:135)
  (b) `score > best_score` -> `>=`: EXIT 101, FAIL tego samego wektora (tests/p6_k5doc_t7b.rs:135)
  (c) odwrocony znak `homeBias`: EXIT 101, FAIL tego samego wektora (tests/p6_k5doc_t7b.rs:135)
- df -h / przed bramkami: 16 GB wolne (>= 8 GB); po pelnym tescie 12 GB.
- Zgodnosc z pinem (odczyt 07d2fbd72 gra/src/battle/battleScene.ts:7186-7243): DIRS4, guardy, dMin<=1, dMin<dNow, homeBias, `>` i zaklinowanie zgodne z Rust.

BLOKADY:
- Brak blokad w bramkach.
- Zawieszenie p6_8i_pick / p6_m07b4_q4 nie odtworzone w tej rundzie (oba zakonczone kodem 0; p6_8i_pick 298,6 s < 900 s). Nie zmieniano testow.
- NOTY FC z r3 (nie blokuja, do rejestru): (a) nearest==None przy niepustej liscie wrogow nieosiagalne w produkcji (zaleznosc producenta W8/ProdBody); (b) wektory nie zapisuja pola `nearest` z pina; (c) filtr `routed` z `_enemiesOf` nieobjety wektorami.

RUNDY: 4/5 (zuzyte wczesniej r1, r2, r3 z BLOCK INFRA/FAIL FC; r4 = ten raport)
NASTEPNY KROK: Final Control rundy r4 (sprawdzic ancestry 61ffc110f, bramki i mutacje z tego raportu); integracja dopiero po PASS FC; wiring do ActivateUnit pozostaje poza zakresem.
DEPLOY/PUSH: NIE WYKONANO (brak push do rust-port/parity-v2, brak FF, brak integracji).
