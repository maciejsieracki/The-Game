STATUS: FAIL
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M07B2-RZEKI-B-KRAWEDZIE-Q1
GOAL: M07B-Q2 — rzeki B, partia 2 (wiersze 2, 3, 6, 11, 34–44; 15 symboli) z pinu `edb8fb56` do `rust-port/engine/src/domain/mapgen/rivers_b/`. Runda 2 = pomiary: weryfikator Python od zera, mutanty na każdej gałęzi, gate'y z logami.
ZMIANY/COMMIT:
- Kod badany: `687d39563` (partia 2) na `68bdb1ace` (partia 1); raport r1 `b443131af`. Tracked pliki czyste (`git diff` pusty) — kod nie zmieniany w tej rundzie.
- Dodane w tej rundzie (commit r2): `tests/p6_m07b2_vectors/verify_m07b2_q2.py`, `tests/p6_m07b2_vectors/mutate_m07b2_q2.py`, logi `gate-*-r2.txt`, `verify-m07b2-q2-r2.txt`, `mutate-m07b2-q2-r2.txt`, sekcja „Runda 2" w dossier `P6-M07B-RZEKI-B-TRACE.md`, ten raport.
- Niescommitowane (poza allowlistą): `rust-port/engine/Cargo.lock` (generowany przez cargo).
TESTY:
- `cargo fmt --check`: EXIT=0 (`gate-fmt-r2.txt`).
- `cargo clippy --lib --tests`: 0 ostrzeżeń, EXIT=0 (`gate-clippy-r2.txt`).
- `cargo test --test p6_m07b2_edges --test p6_m07b2_coast --test p6_m07b_turn`: 3+2+2 OK, EXIT=0 (`gate-test-m07b2-r2.txt`).
- `cargo test` (pełny silnik): 1932 passed, 0 failed, EXIT=0 (`gate-test-full-r2.txt`).
- Weryfikator Python od zera (`verify_m07b2_q2.py`, z TS pinu): 25 592/25 592 zgodne, EXIT=0 (`verify-m07b2-q2-r2.txt`); ponowny przebieg daje ten sam wynik.
- Mutanty (`mutate_m07b2_q2.py`): 100 mutantów, 67 KILLED, 33 SURVIVED; log `mutate-m07b2-q2-r2.txt` ma 100/100 wpisów, `RESTORED=True` przy każdym, linii `EXIT=` brak (skrypt nie dopisuje podsumowania).
  - SURVIVED z oczekiwaniem E/L (równoważność/nieosiągalność, ZAŁOŻENIE do weryfikacji): C05, M02, M06, M13, E01, E03, E06, E07, E10, E24, E27, E31, G13, G14, W06, E28.
  - SURVIVED z oczekiwaniem K (luki testowe, otwarte): C12, C21, G05, G06, G11, G12, M03, M11, W05, W08, E13, E14, E17, E18, E19, E25, E35 (17 sztuk).
BLOKADY:
- Lekcja (d): 17 mutantów K przeżyło bez dowodu równoważności — luki w wektorach (m.in. parzystość i fallback w `river_corners_along_hex_edges`, filtry `visited` w `grow`, `sea_dist` default w `collect`/`meander`).
- Tabela niezmutowanych konstrukcji plik:linia: NIE ZREALIZOWANA (mutanty opisane w liniach web `:NNNN`, brak mapowania na Rust).
- Gałąź `landCenterSquare != null` nie pokryta wektorami (ZAŁOŻENIE: pokryta w M07A; `relief.rs` poza allowlistą).
- Parser `serde_json` bez `float_roundtrip` (1 ulp); tolerancja 1e-12 w `coast_grow_vectors_match_web` (ZAŁOŻENIE: tylko parser testu; web = Rust w node).
RUNDY: 2/5 (ostatni werdykt: r1 PASS-WITH-NOTES; r2 FAIL z powodu lekcji d)
NASTĘPNY KROK: Operator r3 — zamknąć 17 luk K (nowe wektory z weba pinu lub mutanty z dowodem równoważności plik:linia), dopisać tabelę niezmutowanych konstrukcji; następnie Evaluator (Sonnet 5.5) i Final Control.
DEPLOY/PUSH: NIE WYKONANO
