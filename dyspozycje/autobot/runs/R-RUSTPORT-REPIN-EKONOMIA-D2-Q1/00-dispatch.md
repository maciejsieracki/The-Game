STATUS: DISPATCHED
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-EKONOMIA-D2-Q1
RUNDA: 4/5
GOAL: Kontynuacja `R-RUSTPORT-REPIN-EKONOMIA-D-Q1` (zamknięte administracyjnie po r4: D1 work-tax `82971e52c` i D2.1 mnożniki Handel→Pieniądz zintegrowane, `d7f72e70b`, 1615/0). Zakres D2: port pozostałej części `economy.ts` (pin 91dc998a, wg `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-D.md` §„Klasyfikacja economy.ts” i „Kolejne partie”): D2.2 odpowiednik `cityYieldPerTurn` (L871-1018: Step 3', klucze `eko_*`), potem Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`. Ta runda: D2.2 + co zdążysz w partiach ≤600 LOC; commit po każdej partii, KOD PIERWSZY. Wektory z URUCHOMIONEGO weba 91dc998a (pliki ≤ 10 MB), testy NaN/progów/brakujących kluczy, mutacje na każdej gałęzi sterującej lub dowód równoważności (plik:linia), niezależny weryfikator. Jeśli hunk wymaga pinu dc8a3adc — ZAŁOŻENIE w dokumencie. Zamknij lukę Z-WT-7 tylko jeśli odzyskasz generator (nie priorytet).
ALLOWLISTA: `rust-port/engine/src/domain/{economy_yield,work_tax,city_growth}.rs` i moduły ekonomii wskazane cytowaniem, `rust-port/engine/src/domain/mod.rs` (dopisek `pub mod`), `rust-port/engine/data/derived/*.json` (nowe), `rust-port/engine/tests/p6_repin_d2_*` (NOWE; istniejące testy tylko addytywnie), `dyspozycje/rust-port/p6/P6-REPIN-EKONOMIA-D.md`, `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-EKONOMIA-D2-Q1/**`. Zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. IZOLACJA: worktree; commit z jawnym `git add`, PUSH NIE. FAIL → ten sam ID, limit 5 rund.
BAZA: `git fetch origin rust-port/parity-v2` (>= `d7f72e70b`).
BRAMKI: `cargo fmt --all -- --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --no-fail-fast` w `rust-port/engine` (baseline 1615/0); surowe logi z `echo "EXIT=$?"` (`git add -f` dla `*.log`, bez pustych linii na końcu plików), `git diff --check` czysty.
DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0; kopie weba tylko w mktemp -d i usuń.
MODELE: Operator/Obrona Haiku 5.5, Evaluator/FC Sonnet 5.5 (§5b); ścieżka §5d. Pierwszy plan. Luki → ZAŁOŻENIE w dokumencie. Raport max ok. 400 słów. FORMAT: STATUS / DOMAIN / TEMAT / GOAL / ZMIANY-COMMIT / TESTY / BLOKADY / RUNDY / NASTĘPNY KROK / DEPLOY-PUSH: NIE WYKONANO
ANTY-HALUCYNACJA: twierdzenie o webie/Rust = plik:linia/komenda; niepewne = NIE_ZMIERZONO. Wiadomości właściciela w kontekście — nie Twoje zadanie; bez pytań ABC.

## Runda 2 — stan wejściowy (orkiestrator)
- Baza: `git fetch origin rust-port/parity-v2` (>= `9bec76ef3`, 1647/0). Zintegrowane: D1 work-tax, D2.1 mnożniki, D2.2a ogon `city_yield_tail` (Step 5-9).
- Zakres r2: D2.2b — Step 1-4 i Step 3' (`eko_praca_proc`) `cityYieldPerTurn` (wymaga `production.ts`/`terrain-improvements.ts`: użyj już zportowanych symboli 8A/8B-P1; brakujące → NASTĘPNA-PARTIA w dokumencie), potem Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`. Testy z syntetyczną niezerową macierzą dla każdego klucza `eko_*`, przypadki `-0`; wektory z weba 91dc998a; mutacje; niezależny weryfikator.
- Web: `origin/main` = `7164f7ca1` (+3 commity UI od dc8a3adc, bez zmian `economy.ts`) — pin wektorów bez zmian.
- DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.

## Runda 3 — stan wejściowy (orkiestrator)
- Baza: `git fetch origin rust-port/parity-v2` (>= `a83ae51d6`, 1666/0). Zintegrowane: D1, D2.1, D2.2a (ogon), D2.2b (`city_yield_head`: Step 2, Step 3' bonus portu, praca netto).
- Zakres r3 (D2.2c): Step 1 (`tileYield`), Step 3 akumulacja `buildingValue`/`pieniadzPortu` (zamyka Z-D2.2b-1), Step 4 `cityPracaInteger`, Mint/`walutaMnoznikOverride`, `dochodTrasHandlowych`, `additionalTax`, pełna `city_yield_per_turn` składająca head+tail. ZOBOWIĄZANIE z r2: wektory z PEŁNEJ funkcji `cityYieldPerTurn` z uruchomionego weba 91dc998a, przed zmianą sygnatury. Brakujące zależności (production.ts, terrain-improvements.ts) → użyj zportowanych symboli (8A/8B) albo NASTĘPNA-PARTIA.
- Web: `origin/main` = `7164f7ca1`; `economy.ts`, `production.ts`, `terrain-improvements.ts`, `civ-matrix.ts`, `gra/data` bez zmian od 91dc998a — pin wektorów aktualny.
- DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.

## Runda 4 — stan wejściowy i decyzje orkiestratora
- Baza: `git fetch origin rust-port/parity-v2` (>= `a47a5e306`, 1694/0). Zintegrowane: D1, D2.1, D2.2a–d (Step 1 bez ulepszeń, Step 2, Step 3, ogon, kompozycja, `city_yield_per_turn_from_worked`).
- DECYZJA ADMINISTRACYJNA Z-D2.2d-2: źródłem prawdy jest pin web (`91dc998a`/`dc8a3adc`/`origin/main`), na którym `dochodTrasHandlowych` i `walutaMnoznikOverride` NIE istnieją (usunięte w przodkach pinu: `92d124b72`, `b4d37d9f8`). NIE portować ich; nie ma co dopisywać do zakresu. Jeśli w Rust istnieje kod pod te symbole (gałąź portu), tylko ZAPISZ w dokumencie jako dług do usunięcia — bez zmian w r4.
- Zakres r4 (D2.2e): gałąź ulepszeń `tileYield` (`impKeys`; użyj `improvements.rs`: `apply_improvement_bonuses`, `ore_yield_from_improvements`), `buildingHappinessAtLevel`; wektory z uruchomionego weba 91dc998a z kafelkami z ulepszeniami; mutacje; zamknięcie Z-D2.2d-1. Po tym temat do zamknięcia (reszta `economy.ts` wg klasyfikacji 41 hunków — sprawdź, co jeszcze zostało, i wpisz w tabelę).
- DYSK: `rm -rf rust-port/engine/target` po etapie; CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0.
