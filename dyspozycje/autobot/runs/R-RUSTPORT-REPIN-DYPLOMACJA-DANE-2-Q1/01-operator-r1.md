STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-DYPLOMACJA-DANE-2-Q1
GOAL: Zsynchronizować z webem dryf danych dyplomacji (progSojuszWillingnessMin 0,54; progNapZaufanie; progNapBezterminowyRelacja; ekspansjaGranica*) i wyrównać piny testów; pełny cargo test 0 failed.
ZMIANY/COMMIT: kod w gałęzi `r-repin-dyplo-dane-2` (baza 7897540ce), SHA kodu: patrz commit "REPIN-DYPLOMACJA-DANE-2" (git log -1 po tym raporcie). Pliki: rust-port/engine/data/diplomacy.json (kopia gra/data/diplomacy.json z origin/main), rust-port/engine/src/data/civilizations.rs, rust-port/engine/src/domain/diplomacy.rs, rust-port/engine/tests/p6_1e_vectors/web-vectors.json, rust-port/engine/tests/p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja.rs (nowy), dyspozycje/rust-port/p6/P6-REPIN-DYPLOMACJA-DANE-2.md, ten raport. Nie pushowano.
TESTY:
- cargo fmt --check: OK
- cargo clippy --all-targets -- -D warnings: exit 0
- cargo test --lib: 22 passed, 0 failed
- 338 binarek tests/*.rs osobno: 0 failed (p6_8i_pick: 5 passed, 380 s, uruchomiony osobno)
- nowy p6_repin_dyplomacja_dane2_sojusz_nap_ekspansja: 3 passed
- doctesty: NIE_ZMIERZONO
- baseline przed zmianą: NIE_ZMIERZONO
BLOKADY: brak. Pliki spoza allowlisty: brak (diplomacy.json, civilizations.rs i diplomacy.rs mieszczą się w allowliście).
ZAŁOŻENIA:
- progNapBezterminowyRelacja=151 dodane jako pole DiplomacyParams bez konsumenta w Rust (dług: propozycja NAP bezterminowego AI).
- ekspansjaGranicaBraz/Zelazo: dane zsynchronizowane, brak konsumenta w Rust.
- Rozejm (traktaty.rozejm) w acceptance points: NIE_ZMIERZONO, czy obsłużony gdzie indziej w Rust; poza tym tematem.
RUNDY: 1/5
NASTĘPNY KROK: FC (Final Control) na gałęzi r-repin-dyplo-dane-2; integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
