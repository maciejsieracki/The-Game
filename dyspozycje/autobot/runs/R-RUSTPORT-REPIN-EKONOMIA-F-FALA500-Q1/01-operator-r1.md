STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-F-FALA500-Q1
GOAL: REPIN ekonomii/produkcji po FALI 500–517 (5 pozycji: mnożnik m(e), cegła/odlewnie, Magazyn/Spichlerz II/limity, dostęp do żelaza i Młyn, woda lądowa) — port 1:1 z webem.
ZMIANY/COMMIT: runda 1 = pomiar + tabela symboli + plan partii, bez zmian kodu. Pliki: `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-F.md` (nowy), ten raport. Baza: `origin/rust-port/parity-v2` 783c6b766; pin Rust 4bbef081d; web origin/main 16c0509f6 (≥ bd5386c8b). SHA commitu: w odpowiedzi operatora.
TESTY: cargo fmt/clippy/test — NIE_ZMIERZONO (brak zmian kodu; baseline 2122/0 niezweryfikowany na starcie). `git diff --check` — przed commitem.
BLOKADY: (1) partia 1 (m(e)) psuje 4 istniejące testy pinu poza allowlistą: tests/p6_repin_b_ration_era.rs, tests/p6_repin_ekonomia_e_citizen.rs, tests/p6_8d_citizen_upkeep.rs, tests/p6_7a_growth.rs (+ ich wektory). DECYZJA: rozszerzyć allowlistę o te pliki (ZAŁOŻENIE) albo oznaczyć jako dług. (2) REPIN-DELTA-5.md nie istnieje (nie blokuje). (3) Hunki poza 5 pozycjami (terrain-improvements, etykiety UI) → dług, nowe ID.
RUNDY: 1/5
NASTĘPNY KROK: akceptacja allowlisty dla 4 testów pinu → runda 2: baseline cargo (CARGO_INCREMENTAL=0), partia 1 (citizen_consumption_era_multiplier + stawka 1,0×m(e) + ration), testy N−1/N/N+1, mutacje.
DEPLOY/PUSH: NIE WYKONANO
