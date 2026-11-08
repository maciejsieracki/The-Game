STATUS: INFRA (runda 2/5: B1 zmienione, bramki NIEDOKONCZONE; czesc B2/C/D nie rozpoczeta)
DOMAIN: GAME (RUST)
TEMAT: R-RUSTPORT-REPIN-EKONOMII-JEDNA-WERSJA-Q1
GOAL: jedna wersja regul ekonomii 1:1 z webem origin/main, uzyta w turn_economy; usuniete martwe duplikaty po przepieciu.
ZMIANY/COMMIT: WIP lokalny (bez push), baza 9ba4c2c75 (r1). Zmiana: rust-port/engine/src/domain/turn_economy_territory.rs - import i wolanie territory_resource_yield_for_improvement -> territory_resource_yield_for_improvement_all_producers (linia ~226). Allowlista OK (turn_economy*.rs). Zero zmian w gra/**, improvements.rs, testach.
TESTY: cargo fmt wykonany (bez zmian poza plikiem). cargo test --no-fail-fast przerwany timeoutem 585 s i przez dysk (wolne 969 MB, prog 1,5 GB). Czesciowo: 115 binarek zakonczonych, passed=1015 failed=0 ignored=0 (suma tylko z ukonczonych binarek). Pozostale binarki NIE_ZMIERZONO. Baseline cargo fmt --check/clippy/test per binarka na 9ba4c2c75 NIE_ZMIERZONO. Liczba #[ignore]: NIE_ZMIERZONO.
BLOKADY: (1) dysk: target cargo test ~1,9 GB, wolne miejsce spadlo ponizej 1,5 GB przed ukonczeniem; (2) regeneracja wektorow p6_* z weba (Node 22 dostepny: v22.22.0) NIE wykonana; (3) test pick_auto_improvements_matches_pinned_web_vectors trwal >60 s (do zbadania); (4) rozszerzenie allowlisty o improvements.rs / resource_production.rs - decyzja orkiestratora (przed czescia D).
RUNDY: 2/5
NASTEPNY KROK: runda 3 (ten sam TEMAT): po zwolnieniu dysku (>=3 GB) dokonczyc cargo test (czyszczenie target po bramce), zmierzyc baseline; potem B2 (wektory z weba) i testy p6_repin_ekonomii_*.
DEPLOY/PUSH: NIE WYKONANO
