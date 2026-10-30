STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-WOJNA-NOWE-D-Q1
GOAL: Final Control rundy 2 po obronie (SHA 1778834b3): rozstrzygnięcie zarzutów 1-6 weryfikatora rundy 1 na podstawie własnych pomiarów.
ZMIANY/COMMIT: sprawdzony stan 1778834b3 (kod: 47110d3c0, e4b387a2e, 3bca9774e). FC dopisuje tylko ten plik. Push: NIE.

WERDYKTY ZARZUTÓW
1. extend_walk NaN (nav.rs:243): ODDAL. Własna mutacja usunięcia `budget.is_nan() ||` -> `extend_walk_nan_budget_stops_at_first_hex` FAILED (22/1).
2. granica budget 1.0: ODDAL. `budget < 1.0` -> `extend_walk_budget_exactly_1_stops_at_first_hex` FAILED.
3. progi link/merge/no_merge N-1/N/N+1: ODDAL. Własne mutacje: plan.rs:262 `<=`->`<` zabita (`units_within_link_radius_form_one_group`), plan.rs:343 `<=`->`<` zabita (`no_merge_near_capital_n_marches_to_capital`), plan.rs:355 `<=`->`<` zabita (`merge_radius_n_joins_rendezvous`).
4. wektory z uruchomionego weba dc8a3adc: ODDAL. Wektor 2 058 061 B, sha256 c3527f45... zgodny z logiem regeneracji (`evidence/r4-web-regen.log`: tsc + żywe planWarAllInCapital, 300 ziaren, byte-identyczny); `web_vectors_match_rust_plan` PASS u mnie. Uwaga: engageOrders=0 (tryb engage nieportowany, jawnie zapisane).
5. JSON poza allowlistą: ODDAL. Plik w `rust-port/engine/data/derived/war-allin-params.json`, `cmp` z `git show dc8a3adc:gra/data/war-allin-params.json` = identyczny; loader `data::derived::WAR_ALLIN_PARAMS_JSON` w `src/data/derived.rs` (addytywny, wzorzec RUCH_JEDNOSTEK_PARAMS_JSON; allowlista dopuszcza "loader wskazany wzorcem"). Uzasadnienie data/derived zamiast top-level: niezmienniki liczby plików w data_loader/data_compliance.
6. port niepełny: ODDAL. Dispatch: "port tylu symboli, ile zmieści się w partiach", zależności od niezportowanych modułów = ZAŁOŻENIE + NASTĘPNA-PARTIA; tabela symboli w P6-REPIN-WOJNA-NOWE-D.md ma statusy (engageGoal, etap 2a/2b, WarAllInContext = NASTEPNA-PARTIA). Temat pozostaje otwarty na kolejne partie; to nie jest wada partii 1.

ZERO NAPRAW -> PASS-WITH-NOTES.

TESTY (własne, na 1778834b3, CARGO_INCREMENTAL=0):
- cargo fmt --all -- --check: EXIT=0
- cargo clippy --all-targets -- -D warnings: EXIT=0
- cargo test --no-fail-fast: EXIT=0, 1690 passed / 0 failed (baseline 1666 + 24 nowych: nav 23, vectors 1)
- git diff --check a83ae51d6..1778834b3: czysty
- Mutanty M1-M5: wszystkie zabite, pliki przywrócone (cmp z kopią)
- Allowlista: diff a83ae51d6..1778834b3 = tylko domain/war_all_in_capital*.rs, domain/mod.rs, data/derived.rs (loader), data/derived/war-allin-params.json, tests/p6_repin_wojna_d_*, P6 doc, runs/**. Zero zmian w gra/**, renderer/**, src-tauri/**, Cargo.toml, WERSJE.md. Pliki .rs: 316/424/416 LOC (<=600).
- target/ i Cargo.lock usunięte po etapie.

BLOKADY: brak blokujących. Notatki: (a) tryb engage i W1/W2 nieportowane (zależność od war-rules-multiwar.ts/ai.ts), (b) WarAllInContext (ai.ts/barbarians.ts/main.ts) poza zakresem, (c) wektory nie pokrywają engage.
RUNDY: 2/5
INTEGRACJA: baza a83ae51d6; origin/rust-port/parity-v2 (a47a5e306) jest 13 commitów przed, 6 commitów tematu po bazie. Pliki wspólne (domain/mod.rs, data/derived.rs) NIE zmienione na parity-v2 od bazy -> brak konfliktu plików. Kolejność: najpierw parity-v2, potem temat (cherry-pick 47110d3c0, e4b387a2e, 3bca9774e + dokumentacja/runs 5163cea26, e4815251f, 1778834b3 i commit tego pliku), następnie powtórzenie 3 bramek po rebase (oczekiwane >=1690 + przyrost parity-v2). Integruje orkiestrator.
NASTĘPNY KROK: integracja orkiestratora na parity-v2, bramki, READY_FOR_DEPLOY dla partii 1; kolejne partie (engage/W1/W2) jako nowy dispatch tego samego tematu po porcie war-rules-multiwar.
DEPLOY/PUSH: NIE WYKONANO
