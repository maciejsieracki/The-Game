STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-SLINGER-POKRYCIE-Q1 (zadania #163 i #164)
GOAL: (a) przywrócić pokrycie procarza (slingerRanged) w wektorach blow_full; (b) podnieść próg asercji lucznik_ranged z 14 do 60.
ZMIANY/COMMIT: kod f9a92cab8 na wip/R-RUSTPORT-P6-SLINGER-POKRYCIE-Q1 (baza c85e4e451). Allowlista: rust-port/engine/tests/p6_siege_tactics_blow_full_gen.mjs, rust-port/engine/tests/p6_siege_tactics_blow_full_vectors/vectors.json (regeneracja), rust-port/engine/tests/p6_siege_tactics_blow_full.rs (tylko asercje pokrycia). Brak zmian w src/, gra/, Cargo.toml, Cargo.lock (Cargo.lock wygenerowany przez cargo, nieśledzony, nie commitowany).
TESTY:
- KROK 0 (baza c85e4e451, przed zmianą): cargo test --test p6_siege_tactics_blow_full: 3/3 ok. Vectors committed: slingerRanged=1, lucznikRanged=69 (asercja lucznik_ranged >= 14, brak asercji procarza).
- Generator, wariant 1 (szansa łucznika 0,25 + procarz 0,25): slinger 37, lucznik 52 (lucznik < 60, odrzucone).
- Generator, wariant 2 (łucznik 0,35, procarz 0,25 przy nieudanym losowaniu): slinger 32, lucznik 76 na 1200 wektorach (wybrany).
- Reprodukcja: dwa kolejne uruchomienia generatora dają identyczny vectors.json (sha256 OK).
- cargo fmt --check: EXIT 0.
- cargo clippy --all-targets -- -D warnings: EXIT 0.
- cargo test --lib: 100 passed, 0 failed.
- cargo test --test p6_siege_tactics_blow_full: 3 passed (asercje lucznik >= 60, slinger >= 14).
- cargo test --no-fail-fast (pełny): EXIT 0, 454 bloków test result, 0 z failed != 0.
- Wartości końcowe: slingerRanged=32 (>= 14), lucznikRanged=76 (>= 60).
- NIE_ZMIERZONO: brak (wszystkie bramki wykonane lokalnie).
BLOKADY: brak. Uwaga: zmiana strumienia RNG zmieniła całe vectors.json (diff ~180 tys. linii); wektory są bajt-w-bajt zgodne z nowym generatorem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (weryfikacja zgodności generatora z vectors.json i progów), potem Final Control. Integracja i push wyłącznie przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
