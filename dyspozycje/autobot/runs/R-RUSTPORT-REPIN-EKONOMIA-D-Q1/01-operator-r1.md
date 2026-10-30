STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-D-Q1
GOAL: REPIN krok 4b, część D: port `gra/src/game/economy.ts` (41 hunków, pin 91dc998a) do Rust. Ta runda: partia D2.1 (grupa „mnożniki Handel→Pieniądz” + `civEconomyYieldMultipliers`). Cel końcowy tematu NIEOSIĄGNIĘTY.
ZMIANY/COMMIT: `9ef5bdf04` (kod, testy, wektory, dossier, logi). Baza: `origin/rust-port/parity-v2` = `82971e52c` (work-tax D1 już zintegrowane). Nowe: `rust-port/engine/src/domain/economy_yield.rs`, `rust-port/engine/tests/p6_repin_d_economy_mnoznik.rs`, `rust-port/engine/tests/p6_repin_d_economy_vectors/mnoznik-{main,zero}.json`; zmienione: `rust-port/engine/src/domain/mod.rs` (+1 `pub mod`), `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-D.md` (sekcja D2.1). Poza allowlistą: nic. `gra/**`, `Cargo.toml`, `WERSJE.md`, `src-tauri/**`, `renderer/**` nietknięte.
TESTY:
- `cargo fmt --all -- --check`: EXIT=0
- `cargo clippy --all-targets -- -D warnings`: EXIT=0 (`logs/clippy-d2-1.log`)
- `cargo test --no-fail-fast` (rust-port/engine): EXIT=0, 215 binarek, **1566 passed / 0 failed** (baza 1554 + 12 nowych) (`logs/test-d2-1-full.log`)
- `git diff --check`: czysty
- Wektory: `mnoznik-main` (forCiv 588, byDiff 1029, yield 4) z wbudowanej macierzy; `mnoznik-zero` (588 + 1029) z kontrolowaną kopią macierzy (wiersz `grecy` meta=0, wiersz `rzymianie` bez pola). Porównanie bit-w-bit.
- Mutacje (jedna naraz, przywracane): M1 `is_finite`→`>0`: 3 testy; M2 delta hard znak: 4; M3 brak delty: 3; M4 delta na fallbacku: 3; M5 pominięte sprawdzenie wiersza: 6. Zabite 5/5 (`logs/mut-D2-*.log`).
BLOKADY: brak technicznych.
ZAŁOŻENIA (luki):
- Z-D2-1: w silniku nie ma `cityYieldPerTurn`, więc port obejmuje tylko czyste funkcje mnożnikowe; Mint, Step 3', `additionalTax`, klucze `eko_*` w tej partii nie są portowane.
- Z-D2-2: wektory generowane z DOSŁOWNEGO wycinka `economy.ts@91dc998a` (L703-762, L781-786; zmiana tylko specyfikator importu) + `civ-matrix.ts@91dc998a`; loader JSON przez hook node. Pełny `cityYieldPerTurn` NIE był uruchamiany (zależności: production.ts, terrain-improvements.ts, dane terenu).
- Z-D2-3: wektor `zero` na kopii macierzy (wejście kontrolowane, poza repo); macierz `civ-matrix.json` w repo jest bajtowo identyczna z `gra/data/civ-matrix.json@91dc998a` (`cmp`).
- Z-D2-4: numeracja rund. Nagłówek dispatchu mówi „4/5”, zlecenie orkiestratora „1/5”, dossier R3 kończy na R3. Przyjęto: ta runda = pierwszy przebieg Operatora dla partii D2.1; numer do ustalenia przez orkiestratora.
- Z-D2-5: baseline w dispatchu „1272” jest nieaktualny; zmierzone 1554 przed zmianą (R3), 1566 po.
NASTĘPNY KROK: partia D2.2 (ten sam ID): `economy.ts` L871-1018 — Step 3' `eko_pieniadz_port_proc`, `eko_praca_proc`, `eko_handel_brutto_proc`, `eko_korupcja_proc`, `eko_luksus_proc`, `eko_nauka_proc`, `eko_pieniadz_proc`, `eko_zywnosc_proc`, `eko_kultura_proc`, usunięcie D5 — po zbudowaniu odpowiednika `cityYieldPerTurn` w Rust i wektorów `economy` z weba 91dc998a. Następnie Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`.
DEPLOY/PUSH: NIE WYKONANO
