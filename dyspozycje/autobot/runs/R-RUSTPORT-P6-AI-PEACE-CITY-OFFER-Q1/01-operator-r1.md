STATUS: PASS (Operator r1; czeka na Evaluator i Final Control)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1
GOAL: Port gałęzi AI oferującej miasto za pokój (web FALA 556 AIPEACE, ai.ts) — aiPickMiastoDoOddania, aiPickMiastoDoZadania, blok N1a oferuj_miasto_za_pokoj i N1b zada_miasto_za_pokoj — 1:1 z wektorami z uruchomionego weba. Bez podpinania do tury.
ZMIANY/COMMIT: af95fc42d (baza: origin/rust-port/parity-v2 d3e4d4df2, detached).
  Allowlista: rust-port/engine/src/domain/ai_peace_city_offer.rs (nowy, 346 linii), rust-port/engine/src/domain/mod.rs (+1 linia pub mod), rust-port/engine/tests/p6_ai_peace_city_offer.rs (nowy), rust-port/engine/tests/p6_ai_peace_city_offer_data/vectors.json (nowy, 1,09 MB), dyspozycje/rust-port/p6/P6-AI-PEACE-CITY-OFFER.md (nowy: pomiar web→Rust, tabela, wyniki), dyspozycje/autobot/runs/R-RUSTPORT-P6-AI-PEACE-CITY-OFFER-Q1/gen-city-offer.ts (generator wektorów), 01-operator-r1.md (ten plik).
  Wyjątki poza allowlistą: brak. Zero zmian w gra/**, WERSJE.md, Cargo.toml, renderer, src-tauri.
  Pomiar: web z origin/main (git archive gra/src gra/data poza repo), Node v22.22.0, esbuild bundle, three jako external.
TESTY:
  - Wektory (oracle = web): rwProg 11, waga 11, pickOddania 300, pickZadania 6, decideAIDiplomacy 2600 (oferuj 235, zada 307, bez komendy bloku 2058, błędy 0).
  - cargo test --test p6_ai_peace_city_offer: 5 passed, 0 failed (liczniki przypadków ≥100 w każdej kategorii).
  - cargo fmt (rustfmt --check) na nowych plikach: OK.
  - cargo clippy --all-targets -- -D warnings (civ-engine, wszystkie targety): OK, 0 ostrzeżeń.
  - cargo test --lib: 22 passed, 0 failed.
  - cargo test diplomacy/AI (13 binarek: ai_turn, combat_ai_multipliers, diplomacy, p6_dyplo_multiwar2_peace_ai, p6_dyplo_multiwar2_peace_helpers, p6_dyplo_multiwar_peace, p6_repin_ai_founded_by, p6_repin_ai_home, p6_repin_ai_nearest_plan, p6_repin_ai_war_vectors, p6_repin_ai_zakup_rezerwa, p6_repin_wojna_b_ai_general, p6_ai_peace_city_offer): 0 failed, 0 nowych #[ignore].
  - NIE_ZMIERZONO: pełny cargo test dla wszystkich ~318 binarek. Powód: linkowanie każdej binarki debug przekroczyłoby wolne miejsce (6,3 GB wolne, limit 1,5 GB). Wszystkie targety przechodzą clippy --all-targets (kompilacja + -D warnings).
BLOKADY: brak.
  Założenia do akceptacji (nie odstępstwa logiki):
  1. Parametry czlowiek (rwProgBonusMax 0.25, minMiastAi 2) jako literały w module (WarWearinessParams ich nie ma).
  2. decide_city_offer zwraca Option dla jednej relacji; reszta decideAIDiplomacy (priorytety 1–6) nie jest portowana, bo Rust nie ma dekodera tej decyzji.
  3. js_to_fixed2 = {:.2} w Ruście; JS toFixed różni się tylko przy remisie dokładnym (0.125 itp.), którego wektory nie zawierają.
  4. gen-city-offer.ts importuje web przez bezwzględną ścieżkę w scratchpadzie sesji; do ponownego uruchomienia trzeba podmienić ścieżkę na checkout origin/main.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet 5.5) na af95fc42d, potem Final Control (Sonnet 5.5). Podpięcie N1a/N1b do tury i reszta decideAIDiplomacy jako osobne tematy.
DEPLOY/PUSH: NIE WYKONANO
