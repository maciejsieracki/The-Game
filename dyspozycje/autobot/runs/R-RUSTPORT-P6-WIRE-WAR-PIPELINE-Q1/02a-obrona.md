STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1
GOAL: obrona r3 po zarzutach Evaluatora (02-evaluator.md, commit 769a2eb19): PRZYJMUJĘ z dowodem albo ODRZUCAM z dowodem.
ZMIANY/COMMIT: SHA obrony: patrz sekcja SHA na końcu. Gałąź lokalna wip/R-RUSTPORT-P6-WIRE-WAR-PIPELINE-Q1 wskazuje na ten commit. NIE wypchnięto. Allowlista zachowana: playable.rs (naprawa advance_turn + testy #[cfg(test)]), tests/p6_wire_war_pipeline.rs, ten plik. Cargo.lock NIE dodany (untracked, wygenerowany przez cargo).
TESTY: fmt --check EXIT 0; clippy --all-targets -D warnings EXIT 0; cargo test --lib EXIT 0 (50 passed; 48 z r3 + 2 nowe); cargo test --test p6_wire_war_pipeline EXIT 0 (7 passed, 0 ignored). Pełny cargo test NIE powtarzany w tej rundzie (NIE_ZMIERZONO). CARGO_TARGET_DIR poza repo, usunięty po bramkach.
BLOKADY: patrz tabela zarzutów. Otwarte po obronie: producenci wejść (epoki, moc, blokady, wspólna granica) = r4; wektor pinu dla bramki R1/R2 = r4 (NIE_ZMIERZONO).
RUNDY: 1/5 (obrona w rundzie 2 wykonywanej przez Evaluatora).
NASTĘPNY KROK: Evaluator r4 weryfikuje poprawkę (zarzut 1 i 2) i nowe testy; decyzja o rebase na parity-v2 należy do orkiestratora przed Final Control.
DEPLOY/PUSH: NIE WYKONANO

## Tabela odpowiedzi na zarzuty

| # | Zarzut | Odpowiedź | Dowód |
|---|---|---|---|
| 1 | advance_turn zdejmuje wpis przed run_diplomacy_war_phase, błąd zostawia kolejkę zużytą | PRZYJMUJĘ | `playable.rs`: migawka `queue_before` i `war_before` przed pętlą; przy błędzie fazy przywracana kolejka i stan wojny, tura się nie zwiększa. Test `failing_war_phase_restores_queue_turn_and_war_state` (oczekiwany `PlayableError::WarTurn`, `pending_phase_count` bez zmian, `turn` bez zmian, `war.is_default()`). Drugi test `repeated_advance_after_failure_fails_the_same_way_not_with_queue_incomplete` potwierdza, że kolejne wywołanie zwraca ten sam błąd, a nie `TurnPhaseQueueIncomplete`. Wynik: `cargo test --lib war_pipeline_advance` 2 passed. |
| 2 | Brak testu PlayableGame z AI mającym miasta i advance_turn w tej sytuacji | PRZYJMUJĘ | Dodany helper `game_with_ai_city` (gracz AI id 2 z miastem 900, dodany przez `add_player` + wpis w `state.cities`). Oba testy z zarzutu 1 używają go. Zachowanie fail-loud jest więc zweryfikowane przez `advance_turn`, nie tylko przez `run_war_turn`. |
| 3 | Produkcyjny config pusty (pair_params, multiwar=false); pipeline w produkcji martwy; pary kwalifikowane zwracają błąd | PRZYJMUJĘ jako ograniczenie, ODRZUCAM zmianę kodu w r3 | Fakt: `WarTurnConfig::new(BTreeMap::new(), false)` w `run_diplomacy_war_phase`. Bez par (brak AI z miastami) krok działa i jest testowany (`playable_advance_turn_runs_the_diplomacy_phase_without_ai_owners`). Z parą kwalifikowaną `advance_turn` zwraca `WarTurn(MissingPower)` i przywraca stan (test z pkt 2). Brak ustawień par i multiwar w `PlayableState` to zakres r4 (dispatch r3 tego nie wymaga). NIE_ZMIERZONO: wartości pair_params/multiwar względem web w produkcji. Uwaga operacyjna: stan wczytany z zapisu, w którym AI ma miasto, także nie przejdzie tury (fail-loud); dziś żadne API PlayableGame nie tworzy miast AI. |
| 4 | Testy behawioralne na ręcznych wejściach, brak wektora pinu dla składania tick -> brake z common_border_delta; test shared_border sprawdza tylko kierunek | PRZYJMUJĘ częściowo | Dodany test `border_flag_and_epoch_penalty_are_wired_into_the_tick`: asercja równości `penalty_iron == common_border_trust_per_turn_iron` i `penalty_base == common_border_trust_per_turn`; asercja, że z granicą kara jest, bez granicy nie ma; asercja dokładna `(trust(granica,epoka3) - trust(granica,epoka1)) == (penalty_iron - penalty_base)` z tolerancją 1e-9. Test przechodzi. NIE_ZMIERZONO: osobny wektor pinu dla składania tick -> brake (w pinie brak takiego wektora; hamulec i tick mają własne wektory w p6_wire_war_diplo, p6_tickdiplo, p6_brake_inputs_vectors). |
| 5 | `tick_context_default_has_no_border_without_shared_border` to wypełniacz | PRZYJMUJĘ | Test usunięty i zastąpiony testem z pkt 4 (sprawdza wiring flagi `common_border` i delty). Usunięte też nieużywane importy (`BTreeSet`, `TickContext`, `PairMetaWeb`). |
| 6 | Bramka R1/R2 liczona raz na początku fazy, brak asercji wartości Rust z komentarzem o kolejności web | PRZYJMUJĘ częściowo | Różnica opisana w module `turn_war_pipeline.rs` (krok 4) i w tabeli 02c. Asercji wartości bramki nie dodano: r3 nie ma wektora pinu dla `gate_blocked_set` w tym składzie. NIE_ZMIERZONO względem web (per deklaracja). Odłożone do r4 razem z producentami. |
| 7 | Owner 0 filtrowany heurystycznie; brak testu mapowania gracz 1 vs web 0 | PRZYJMUJĘ częściowo | Dodana asercja w `three_turns_bring_the_ai_pair_to_war_and_keep_it_there`: `t1.tick_pairs` nie zawiera id 0. Mapowanie id gracza (Rust 1, web 0) nie ma osobnego wektora. NIE_ZMIERZONO. |
| 8 | Implementacja na ec4e11741, parity-v2 na nowszym SHA; nowi producenci mocy nieużyci | PRZYJMUJĘ jako notatkę dla r4; ODRZUCAM rebase w r3 | `git merge-base --is-ancestor ec4e11741 origin/rust-port/parity-v2` = tak. Aktualny origin/rust-port/parity-v2 = 94cba6667 (wcześniej e98099f5c). `git merge-tree --write-tree origin/rust-port/parity-v2 HEAD` EXIT 0 (bez konfliktów). Rebase i wybór bazy do FC to decyzja orkiestratora (dispatch ustala bazę ec4e11741). Producenci mocy (POWER-PRODUCERS, POWER-ARMIA-TERYTORIUM) są na parity-v2, ale r3 ich nie używa, zgodnie z zakresem. Wpięcie w r4 po rebase. NIE_ZMIERZONO: wpływ nowych commitów na testy r3 (nie uruchamiano na 94cba6667). |

## Różnice między wynikiem r3 a zarzutami (bez zmian w kodzie)

- Brak asercji na wartości producentów (epoki, moc, blokady) - zgodnie z dispatch r3 producenci są poza zakresem.
- Kolejność faz (wariant B) bez zmian. Tabela różnic B vs web jest w `02c-operator-r3.md`.

## SHA

Zob. commit obrony r3 (`git rev-parse --short HEAD` po commicie). Commit zawiera zmiany w `playable.rs`, `tests/p6_wire_war_pipeline.rs` i ten plik.
