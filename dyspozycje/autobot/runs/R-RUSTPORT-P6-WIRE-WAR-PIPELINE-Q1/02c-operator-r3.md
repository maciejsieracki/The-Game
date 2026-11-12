STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1 (r3, Operator, runda 1/5 po zawężeniu do fazy Diplomacy)
GOAL: jedna funkcja `run_war_turn(&mut WarTurnContext)` wykonująca w fazie Diplomacy (wariant B, kolejność Rust): wejścia BrakePhaseInput z producentów (brake_inputs), tick relacji par z TickContext (common_border_delta z epoki pary), `run_brake_phase` na `WarTurnState.brake_phase`. Jedno wywołanie w `PlayableGame::advance_turn` (faza Diplomacy).
ZMIANY/COMMIT: allowlista r3:
- rust-port/engine/src/domain/turn_war_pipeline.rs (nowy, ~330 LOC, limit 600)
- rust-port/engine/src/domain/mod.rs (`pub mod turn_war_pipeline;`)
- rust-port/engine/src/domain/playable.rs (import, wariant `PlayableError::WarTurn`, `run_diplomacy_war_phase` i jedno wywołanie w pętli `advance_turn` przy `TurnPhase::Diplomacy`)
- rust-port/engine/tests/p6_wire_war_pipeline.rs (nowy, 7 testów)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1/02c-operator-r3.md
Commit: patrz pole SHA w raporcie orkiestratora (gałąź lokalna `wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1`, nie wypchnięta). Cargo.lock nie commitowany (usunięty po bramkach). Baza: origin/rust-port/parity-v2 = ec4e11741. Brak zmian w gra/, WERSJE.md, Cargo.toml, origin/main.
TESTY (surowe wyniki, worktree, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR poza repo, usunięty po bramkach; df / przed startem 9,6 GB wolne):
- cargo fmt --check: EXIT 0 (po rustfmt na dwóch nowych plikach)
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: EXIT 0, 48 passed, 0 failed
- cargo test --test p6_wire_war_pipeline: 7 passed, 0 failed (EXIT 0): three_turns_bring_the_ai_pair_to_war_and_keep_it_there, peace_lock_blocks_declaration_for_the_pair, missing_producers_fail_loudly_instead_of_zeroing, shared_border_uses_epoch_penalty_in_the_tick, tick_context_default_has_no_border_without_shared_border, playable_advance_turn_runs_the_diplomacy_phase_without_ai_owners, from_playable_reads_contacts_from_the_raw_war_key
- sąsiednie: p6_wire_war_* (wszystkie), p6_brake*, p6_tickdiplo, p6_siege_surrender, playable_slice: 20 binarek, wszystkie `ok`, EXIT 0
- pełny `cargo test --no-fail-fast`: EXIT 0, łącznie 2766 passed, 0 failed (380 bloków wyników)
Wektory: nie generowano nowych. Kroki hamulca i ticku mają wektory z pinu w p6_wire_war_diplo (primitives/phase), p6_tickdiplo, p6_brake_inputs_vectors; r3 używa ich bez zmian. Testy nowe są behawioralne (3 tury, mini-świat).

TABELA RÓŻNIC B vs WEB (wariant B; web = pin 07d2fbd72, `gra/src/main.ts`):
| krok | faza Rust (r3) | faza web | uzasadnienie / stan |
|---|---|---|---|
| tick relacji par + hamulec (run_brake_phase) | Diplomacy (2) | runDiplomacyTurnTick, galąź brakeOn | zgodnie z dispatch r3; kolejność wewnątrz fazy jak w web (tick -> dobra wola -> krok AI-AI -> krok gracz-AI -> kolejka) |
| bramka R1/R2 (diploCrisisWarGateBlocked) | liczona NA POCZĄTKU fazy z `brake_phase.at_war` | liczona przy każdej deklaracji w kolejce | RÓŻNICA: przy kilku deklaracjach w jednej turze licznik wojen nie rośnie w trakcie fazy |
| wejście `owners` (0) | wpis 0 tylko gdy producent podał jego fakty | allPowerOwnerIds zawsze z 0 | mapowanie: PlayableState numeruje gracza od 1 (HUMAN_PLAYER_ID=1), web gracz = 0 |
| oblężenie, głód | NIE w r3 (Economy/Production) | Economy/Production | czeka na r4 (wymaga Q3 i producentów) |
| umowy AI-AI, sweep, parowanie, decideAIDiplomacy, decideAITurn, tiki AI-AI | NIE w r3 (Ai) | faza Ai | czeka na r4 |
| efekty deklaracji (traktaty, sojusze, zdarzenia, UI) | zwracane w `WarTurnReport.declarations`, NIE stosowane | stosowane w pętli | W4/W8 |
| common_border_delta | = shared_border_penalty_for_epochs(epoka obu stron) | karaWspolnaGranicaDelta | ZAMKNIĘTE w wiringu (dług BORDER-WIRING: delta policzona w produkcji) |
| common_border (flaga) | z `WarTurnInputs.shared_border` | mapa graniczna | PRODUCENT NIEOBECNY w PlayableState (r4); w produkcji pusty zbiór, bez AI brak efektu |

PRODUCENCI (jawne, bez cichych zer):
- Obecni w `WarTurnInputs::from_playable`: gracze (`is_human`), miasta (właściciel, liczba), kontakty z surowego klucza `diplomaticallyDiscoveredOwners` w `WarTurnState.opaque`. Fakty barbarzyńców/kopii/eliminacji = false (PlayableState ich nie modeluje).
- BRAK producenta (brak = `WarTurnError`, gdy są pary AI-AI lub gracz-AI): epoki (`MissingEpoch`), moc `ObjectivePowerRaw` (`MissingPower`), blokady pokoju wymuszonej epoki i `PairMetaWeb` (`MissingPeaceLocks`). Dodatkowe składniki `TickContext` (handel, religia, dobra wola, wiarygodność, wspólny wróg) mają wartość domyślną z `tick_extras` (brak wpisu = `TickContext::default()`) - JAWNIE NIEZAMKNIĘTE, do r4.
- `WarTurnConfig::new(pair_params, multiwar)`: w produkcji `advance_turn` przekazywane puste pary i `multiwar = false` (ustawienia gry nieobecne w PlayableState). NIE_ZMIERZONO: wartość multiwar w web dla sesji produkcyjnej.

ZACHOWANIE PRODUKCJI: `advance_turn` wywołuje `run_war_turn` przy fazie Diplomacy. Bez AI z miastami (jedyny stan produkowany przez grę) faza nie wymaga producentów i jest no-op; test `playable_advance_turn_runs_the_diplomacy_phase_without_ai_owners` sprawdza 3 tury i pusty `war`. Dodanie AI bez miast nie wywołuje błędu (nie jest kwalifikowane). AI z miastami bez producentów zwraca błąd `PlayableError::WarTurn` (fail-loud, zamiast cichych zer).

BLOKADY:
- Producenci epok, mocy (`ObjectivePowerRaw`), blokad pokoju i wspólnej granicy w PlayableState nie istnieją - to zakres r4 (POWER-NOZEROS / POWER-REST / BORDER producer). Bez nich faza nie obsługuje par AI z miastami.
- Efekty deklaracji wojny (W4/W8) nie są stosowane.
- Faza Economy/Production/Ai (oblężenie, AI-AI) poza zakresem r3.
- Wartość `multiwar` i pary parametrów `diploBrakeWarParams` w produkcji: NIE_ZMIERZONO względem web.

RUNDY: 1/5 (Operator; brak rund FAIL). Ten raport = wynik etapu Operatora; nie jest READY_FOR_DEPLOY.
NASTĘPNY KROK: Evaluator (Sonnet) na gałęzi `wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1` - weryfikacja tabeli różnic, bramek i zakazu cichych zer; potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (Operator nie pushuje i nie integruje; push tylko gałęzi wip po osobnej autoryzacji).
