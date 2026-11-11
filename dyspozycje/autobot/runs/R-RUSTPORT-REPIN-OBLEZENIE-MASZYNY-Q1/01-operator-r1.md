STATUS: PASS-WITH-NOTES
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1
GOAL: Port czystego modułu budowy machin oblężniczych (web `gra/src/game/siege-engine-build.ts`, commit web 6218f2ab1) do Rust z wektorami z uruchomionego weba.
BAZA: rust-port/parity-v2 @ 571df3167 (web origin/main).
ZMIANY/COMMIT: patrz SHA w sekcji DEPLOY/PUSH (commit lokalny na gałęzi `r-repin-oblezenie-maszyna-q1`, bez push).
  - rust-port/engine/src/domain/siege_engine_build.rs (NOWY, 184 l.): port `isSiegeEngineDef`, `qualifyingSiegeArmyCount`, `siegeEngineQuota`, `siegeEngineBuildOption` (9 powodów, kolejność bramek jak w web).
  - rust-port/engine/src/domain/mod.rs (+pub mod).
  - rust-port/engine/tests/p6_repin_oblezenie_maszyny_web_parity.rs (NOWY, 4 testy).
  - rust-port/engine/tests/p6_repin_oblezenie_maszyny_web_vectors.json (NOWY, 35 przypadków z weba + kwoty).
  - dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-MASZYNY.md (NOWY, tabela).
  - dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-MASZYNY-Q1/vectors-gen/{gen.ts,vectors.json} (generator wektorów, reprodukowalność).
TESTY:
  - cargo fmt --check: OK.
  - cargo clippy --all-targets -- -D warnings: OK (rc 0).
  - cargo test --test p6_repin_oblezenie_maszyny_web_parity: 4 passed, 0 failed.
  - cargo test --lib: 22 passed, 0 failed.
  - cargo test --test data_loader: 40 passed, 0 failed.
  - cargo test --test data_compliance: 14 passed, 0 failed.
  - 0 nowych #[ignore].
  - Wektory: generowane z web (esbuild 0.24.2 + Node 22.22.0, `git archive origin/main gra/src gra/data`), nie deklarowane.
BLOKADY: brak blokad procesowych.
ZAŁOŻENIA (odstępstwa od dispatchu, rozstrzygnięte przy pisaniu):
  - Z-SEM-5: `unitsPerSiegeEngine` NIE dodany jako `rust-port/engine/data/siege-engine-params.json` + loader. Powód: katalog `data/` jest pinowany 1:1 z `gra/data` (29 plików) w `tests/data_loader.rs` i `tests/data_compliance.rs` (poza allowlistą); nowy plik złamałby te testy. Wartość jest stałą Rust (`SIEGE_ENGINE_UNITS_PER_MACHINE = 10`), a test parytetu sprawdza ją względem `unitsPerSiegeEngine` z weba.
  - Z-SEM-1: wejście armii jako `ArmyUnit { owner_id, obleznicza }` zamiast pełnego RuntimeUnit (wystarcza do reguł).
  - Z-SEM-2: koszt pieniężny podaje wołający (jak `costMoney` w web); koszt zasobowy z istniejącego `building_costs::p6_7b::unit_stock_cost`.
  - Z-SEM-3: `not_besieger` w typie, nigdy nie zwracany (jak web).
  - Kolejka `siegeMachines.ts` (queue/ensure/cancel) NIE portowana: poza zakresem "czystych funkcji"; do osobnego tematu.
  - Wpięcie w turę/UI: dług do serii W (zgodnie z dispatchem, NIE BLOCK).
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje allowlistę i wektory; Final Control; integracja orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
