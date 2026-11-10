STATUS: FAIL (runda 4/5; zakres Z3 nadal niedomknięty, część zarzutów przyjęta z dowodem)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1
GOAL: Port bramek wojen epoki, zmęczenia wojną, NAP-trust, forced-peace, siege-war-gate i locks z weba (pin a61337844) do Rust.
BAZA RUNDY 4: d8b288343 (commit Operatora r3; FC r3 odtworzył go na tym SHA). parity-v2 = 3a40d458e (rebase już zrobiony w r3).
ZMIANY/COMMIT: commit r4 (SHA w `git log -1` gałęzi wf worktree, nie wypchnięty). Zmienione:
- `rust-port/engine/src/domain/diplomacy_multiwar_gate.rs` (NOWY): `is_inter_civ_war_open_at_turn` (web :82), `concurrent_war_limit_for_era` (:90), `WarGateReason` + `evaluate_inter_civ_war_gate` (:119), `pick_player_reference_city` (:292). Parametry literalami: delayInterCivWarsUntilTurn=40, maxConcurrentWarsStone=1, maxConcurrentWarsFromBronze=null.
- `rust-port/engine/src/domain/mod.rs` (+1 `pub mod diplomacy_multiwar_gate;`).
- `rust-port/engine/tests/p6_dyplo_multiwar_interciv.rs` (NOWY, 2 testy).
- `rust-port/engine/tests/p6_dyplo_multiwar_gates_data/intercivgate.json` (NOWY, 27 wektorów z uruchomionego weba).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-DYPLOMACJA-MULTIWAR-ERA-BRAMKI-Q1/gen-multiwar-vectors.cjs` (+sekcja 4; istniejące weariness/era/nap/peace przegenerowane bit-w-bit identycznie).
- `dyspozycje/rust-port/p6/P6-DYPLOMACJA-MULTIWAR.md` (2 wiersze -> ZROBIONE).
- Bez zmian w gra/, data/, save_load.rs, Cargo.toml, WERSJE.md.

ROZSTRZYGNIĘCIE ZARZUTÓW FC r3:
- Z1 (zakres Z3): PRZYJMUJĘ częściowo. ZROBIONE w r4: `evaluateInterCivWarGate` + `isInterCivWarOpenAtTurn` + `concurrentWarLimitForEra`, `pickPlayerReferenceCity` (dowód: test `p6_dyplo_multiwar_interciv` 2/2, wektory z weba). NIE ZROBIONE (przyjęte jako blokada, bez obejścia): `runWarWearinessTick`; forced-peace AI<->AI (`registerAiPeaceRequest`, `isForcedPeaceDue`, `decideAiPeaceRequest`, `runAiAiPeaceTick`); `diplomacy-siege-war-gate.ts`. Brak r4 na te symbole.
- Z2 (case'y locks poza '2'): PRZYJMUJĘ. NIE ZROBIONE w r4.
- Z3 (REPIN 5 modułów wobec a61337844): PRZYJMUJĘ. NIE ZROBIONE w r4 (pliki allowlisty nie były dotykane; NIE_ZMIERZONO, czy różnią się od pinu).
- Z4 (mutacje <85% / brak narzędzia): PRZYJMUJĘ. NIE_ZMIERZONO w r4; brak narzędzia mutacyjnego, dysk ~2.6 GB.
- Z5 (brak pełnego `cargo test --no-fail-fast`): PRZYJMUJĘ. NIE_ZMIERZONO w r4 (dysk). Przebiegi podzielone obejmują tylko 3 binarki P6-DYPLO-MULTIWAR (poniżej).
- Z6 (dług liczników wojen epoki `recordEraForcedWarParticipation`, `rebuildEraWarCountsFromActivePairs`, `restoreEraWarCounts`): PRZYJMUJĘ jako dług do temat #8. Wpis w rejestrze wykonuje orkiestrator; ja go tylko odnotowuję.

TESTY (r4, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, target w worktree):
- `cargo fmt --all` (zastosowany; następnie `--check` NIE sprawdzony po ostatniej zmianie w pliku testu, patrz NASTĘPNY KROK): EXIT=0.
- `cargo test --test p6_dyplo_multiwar_interciv --test p6_dyplo_multiwar_gates --test p6_dyplo_multiwar_peace`: EXIT=0. interciv 2/2; gates 9/9; peace 3/3.
- `cargo clippy --lib --test p6_dyplo_multiwar_interciv --test p6_dyplo_multiwar_gates --test p6_dyplo_multiwar_peace -- -D warnings`: EXIT=0.
- `cargo clippy --all-targets`, pełny `cargo test --no-fail-fast`, data_compliance/data_loader/lib: NIE_ZMIERZONO w r4.
- Mutacje: NIE_ZMIERZONO w r4.
- Wektory: `node gen-multiwar-vectors.cjs <webpin> <out>` na `git archive a61337844 gra/src gra/data` (katalog poza repo, w scratchpad): weariness 64, era 63, nap 64, peace 396, step 3, intercivgate 27.

BLOKADY:
- Dysk ~2.6 GB wolne (próg 1,5 GB z dispatchu nieprzekroczony, ale wąsko).
- Zakres Z1/Z2/Z3 z FC r3 nie zamknięty; wymagana runda 5.

RUNDY: 4/5 (kolejna runda 5/5 na tym samym ID; po r5 bez PASS -> LIMIT-5-EXCEEDED i decyzja właściciela).
NASTĘPNY KROK: Operator r5: (1) runWarWearinessTick + forced-peace AI<->AI + diplomacy-siege-war-gate z wektorami weba i testami N-1/N/N+1; (2) case'y locks poza '2' (`diplomacy-locks.ts:244+`); (3) REPIN 5 modułów z allowlisty wobec a61337844 (diff + poprawki); (4) pełne bramki i mutacje (narzędzie lub dowód równoważności); (5) `cargo fmt --check` po r4.
DEPLOY/PUSH: NIE WYKONANO
