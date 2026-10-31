STATUS: BLOCK (zakres niekompletny: partia 2 zmierzona PASS; 2 z 18 pozycji zakresu nadal NIEPORTOWANE; FC nie powinien dać PASS)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-M07A-RZEKI-A-SCIEZKI-POLA-Q1
GOAL: niezależny pomiar partii 2 (kod 5a0c92e78) oraz domknięcie luk lekcji (b) i (d); bez zmian zakresu portu.
ZMIANY/COMMIT: commit pomiarowy na bazie 5a0c92e78 (SHA w logu gita po commicie). Kod `walk.rs` i `rivers_a.rs` bez zmian. Nowe: `tests/p6_m07a_cap.rs` (1 test), `tests/p6_m07a_vectors/web-rivers-a-cap.json` (0,73 MB, 8856 przypadków), `gen-m07a-cap.mjs`. Zmienione: `mutate_m07a_walk.py` (poprawiony wzorzec M8), dossier `P6-M07A-RZEKI-A-SCIEZKI-POLA.md` (§1, §2, §3b, §4.3, §9). Logi bramek w katalogu runu (`gate-*-r4.log`, `mut-walk-r4.log`, `verify-walk-r4.log`) są w `.gitignore`, więc nie weszły do commita; leżą w worktree.
TESTY:
- Regeneracja `web-rivers-a-walk.json` z pinu `edb8fb56` (`git archive`): `cmp` IDENTYCZNE.
- `verify_m07a_walk.py`: 965 przypadków, 0 błędów, EXIT=0.
- `cargo test --test p6_m07a_walk`: 14 passed / 0 failed, EXIT=0.
- `cargo test --test p6_m07a_cap`: 1 passed / 0 failed, EXIT=0; sweep 8856/8856 zgodne z webem.
- `cargo test` pełny: 1818 passed / 0 failed, EXIT=0 (`gate-test-full-r4.log`).
- `cargo clippy --all-targets -- -D warnings`: EXIT=0. `cargo fmt --check`: EXIT=0. `git diff --check`: czysty.
- Mutacje `mutate_m07a_walk.py`: 10/10 zabite. Pierwszy przebieg dał 9/10, bo wzorzec M8 nie pasował do wieloliniowego wywołania i mutacja została pominięta, nie zaliczona. Po poprawce wzorca: 10/10. M7 dodatkowo zabija `p6_m07a_cap`.
BLOKADY:
- NIEPORTOWANE: `TraceRiverOpts`, `growRiverInlandBeforeDrainage` (partia 3). ZAŁOŻENIE jak w raporcie Operatora-impl.
- Profiler `CIV_RIVER_PROFILE`: ZAŁOŻENIE, bez wpływu na wynik.
- Lekcja (b): w `walk.rs` capy 1,2,3,5,6000 leżą na różnych startach, bez trójki N-1/N/N+1 na tym samym starcie. Domknięte sweepem 1..40 i 6000 na 216 startach (`web-rivers-a-cap.json`). Cap 6000 nie jest rozróżnialny na mapach wektorów (maks. 1008 heksów); granica 6000 pokryta tylko logicznie. ZAŁOŻENIE.
- Weryfikator Python nie pokrywa `drainStep`, `drainGoal`, `pathSea`, `scoreSquare`, `audit`. Pokrywają je wektory web i testy Rust.
- Numeracja rund: zlecenie mówi r1/5, dispatch 2/5, FC r3 wskazuje r4. Przyjęto 4 wg FC r3; rozbieżność zgłoszona, nie DECISION_REQUIRED.
RUNDY: 4 (wg FC r3; dispatch 2/5)
NASTĘPNY KROK: partia 3 (`TraceRiverOpts`, `growRiverInlandBeforeDrainage`) z wektorami capów N-1/N/N+1 na tym samym starcie, mutacjami i dossier 52/52; potem Evaluator i Final Control.
DEPLOY-PUSH: NIE WYKONANO
