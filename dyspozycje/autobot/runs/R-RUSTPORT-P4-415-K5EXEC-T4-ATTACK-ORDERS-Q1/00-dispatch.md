# R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 — rozkazy gracza `attack` i `attackMove` w pętli bitwy: `_performPlayerOrder` :18353-18428 + `_attackMovePath` :18535 + `_firstStepOnAttackMovePath` :18568 (zadanie #415, krok T4)

STATUS: dispatch orkiestratora. Opus, wszystkie etapy Opus (3D/silnik bitwy). Kolejka właściciela (decyzja 2026-11-26) wyczerpana po #414; T4 to naturalna kontynuacja #404 (D-404-1: `attack`/`attackMove` poza zakresem T3, „T4").
BAZA: `origin/rust-port/parity-v2` = `1dedba56c` po #414 (`git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`).

## STAN ZWERYFIKOWANY NA BAZIE (orkiestrator, 2026-11-27; zasada „najpierw sprawdź, czy dług istnieje")
Dług ISTNIEJE na `1dedba56c`:
- `rust-port/engine/src/domain/player_order_move.rs:13,:356,:385`: gałęzie `attack` / `attackMove` zapisane jako „poza zakresem T3 (D-404-1, T4)" — wołający dostaje jawne „nieobsłużone".
- Brak w Rust funkcji odpowiadających pinowi `_attackMovePath` (`:18535`, BFS po DIRS4 z `allowEnemyCells`) i `_firstStepOnAttackMovePath` (`:18568`): `git grep "fn attack_move_path\|fn first_step_on_attack_move_path"` = 0 trafień.
- Gotowe klocki do wykorzystania (istnieją): `siege_tactics_pathstep.rs::first_step_along_path_to_attack` (pin `_firstStepAlongPathToAttack` :8565), `can_strike_target_from` (`siege_tactics_loop.rs`, `siege_tactics_autobatch.rs`; pin :8487), `do_attack` (pin `_doAttack` :8787), `priority_score` (`siege_tactics_doctrine_target.rs`), `enemies_of`, bramki ruchu `player_order_move_gate.rs` (`dest_allowed_by_blockade`, `compact_attack_allows_step`, `should_avoid_auto_backtrack`), krok i BFS z T3 (`player_order_move.rs`).
- UWAGA (wniosek z #404): w AUTO rozkaz `attack`/`attackMove` wydaje wyłącznie gracz, a `_activateUnit` zeruje `playerOrder` na starcie AUTO (pin :6093); doktryna AUTO emituje tylko `move` (:18087-18124). Wektory BITEW z tymi rozkazami nie są więc możliwe bez ścieżki ręcznej (H4/T5) — nie próbuj ich wymuszać.

## GOAL
NAJPIERW web (pin `07d2fbd72`, `gra/src/battle/battleScene.ts`, `git show`): w `_performPlayerOrder`:
- `attackMove` (:18353-18394): `route = _attackMovePath(ru, col, row, true)`; zagrożenia na trasie (wróg na polu trasy albo taki, którego da się uderzyć z pola trasy `_canStrikeTargetFrom`) posortowane `_priorityScore` potem odległością Manhattan; jeśli jest cel: uderzenie z miejsca (`_doAttack`) albo krok `_firstStepAlongPathToAttack(ru, undefined, target)` (z `_destAllowedByBlockade`), przy zachowaniu rozkazu; cel = pozycja → rozkaz `none`; inaczej krok `_firstStepOnAttackMovePath` (`allowEnemyCells=false`) z bramką `_destAllowedByBlockade`; brak kroku → `done()`.
- `attack` (:18395-18428): cel po `bu.id` żywy i nie `fadingOut`, inaczej rozkaz `none`; uderzenie z miejsca; inaczej krok `_firstStepAlongPathToAttack(ru, filtr compact+anty-cofanie, tgt)`, `_destAllowedByBlockade`, zapamiętanie `lastAutoMoveFrom` przy `_shouldAvoidAutoBacktrack`.
- `_attackMovePath` :18535-18566 i `_firstStepOnAttackMovePath` :18568-18572.
Zadanie: port tych gałęzi i dwóch funkcji do Rust (nowy moduł `player_order_attack.rs` albo rozszerzenie `player_order_move.rs` — decyzja techniczna, wpisz do raportu) tak, by `perform_player_order` obsługiwał `attack` i `attackMove` jak pin (wołający produkcyjny nadal pozostaje za H4/T5 — nie wpinaj w tryb ręczny).

## DECYZJE TECHNICZNE (orkiestrator, wiążące; D-415-1..4)
- D-415-1: zakres wyłącznie T4 (`attack`, `attackMove`, `_attackMovePath`, `_firstStepOnAttackMovePath`). Poza zakresem: `_performSiegeManualOrder` (H3), kolejka rozkazów UI, tryb ręczny gracza w ciele (T5/H4), wiring mostu.
- D-415-2: wzorzec = kod pinu; każda rozbieżność z pinem = jawny raport, nie „poprawka".
- D-415-3: **budżet czasu (wiążący; lekcje #406 i #414: 5 h 45 min i 4 h przy małej zmianie zachowania):** dowód = wektory KROKU wykonane z tekstu pinu na czystych funkcjach (jak `move_order_step_vectors.json` z #404: generator wykonuje `_attackMovePath`, `_firstStepOnAttackMovePath` i gałęzie `attack`/`attackMove` na przygotowanych scenach bez uruchamiania pełnej bitwy w czasie rzeczywistym). **Wektorów bitew w czasie rzeczywistym NIE generujesz** (nieosiągalne w AUTO, patrz wyżej). Cały temat (4 role) ma się zmieścić w ≈ 3 h; przy przekroczeniu raport z tym, co jest.
- D-415-4: bramki engine fmt/clippy/pełny test; client i renderer tylko jeśli zmieniasz ich pliki (nie powinieneś).

## ALLOWLISTA
nowy `rust-port/engine/src/domain/player_order_attack.rs` (albo rozszerzenie `player_order_move.rs`) + wpis w `mod.rs`; ewentualny dopisek w `siege_tactics_loop.rs` TYLKO jeśli konieczny do wystawienia funkcji (uzasadnij); nowy `rust-port/engine/tests/p4_415_attack_orders.rs`; `rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (dopiski: tryb wektorów kroku `attack`/`attackMove`, strażnik SHA-256 bez zmian); nowy plik wektorów `rust-port/engine/tests/p6_k5loop_wiring_a_pin_vectors/attack_order_step_vectors.json`; raporty w katalogu runu. Istniejące pliki wektorów bez zmian treści. Inny plik: uzasadnij.

## KRYTERIA KOŃCA
1. `attack_move_path` i `first_step_on_attack_move_path` zgodne z pinem bajt w bajt na wektorach kroku (BFS po DIRS4, `allowEnemyCells` true/false, własne jednostki jako przeszkody, `_passableForUnit`, `_destAllowedByBlockade`, limit `queue.length < BF_COLS*BF_ROWS`, brak ścieżki → `null`).
2. Gałęzie `attack` i `attackMove` `perform_player_order` zgodne z pinem na wektorach kroku pokrywających: cel nieżyjący/`fadingOut` → rozkaz `none`; uderzenie z miejsca; krok ku celowi z obejściem; unik cofania (`lastAutoMoveFrom`); bramka `_compactAttackAllowsStep`; bramka `_destAllowedByBlockade`; `attackMove` z zagrożeniem na trasie (kolejność `_priorityScore` potem Manhattan), bez zagrożenia, cel = pozycja → `none`, brak kroku → `done()`.
3. Mutanty ≥ 8 (np. `allowEnemyCells` odwrócone, zła kolejność sortowania zagrożeń, brak filtra `routed`/`removed`, pominięty `_destAllowedByBlockade`, zły limit BFS, brak `lastAutoMoveFrom`, cel = pozycja bez `none`, `attack` bez filtra `fadingOut`) zabite lub jawnie równoważne — z uzasadnieniem.
4. Istniejące wektory (45 `vectors.json`, 288 `speed_vectors`, 40 `speed_change` + 14 `speed_change_2`, 74 `tower_due_order`, `move_order`) i pełny `cargo test` engine bez regresji.
5. Raport z liczbami, jawną listą NIE_ZMIERZONO i mapą pozostałych kroków (H3, H4, T5..T7) z numerami linii pinu.

## BRAMKI (EXIT 0)
engine: `cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, pełny `cargo test --all-targets --no-fail-fast`. Wymagane ≥ 8 GB wolnego, jeden build na raz. Własny `CARGO_TARGET_DIR` w scratchpadzie tematu, usuń po bramce; env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`. Nie zostawiaj procesów cargo/node w tle po zakończeniu rundy.

## ZAKAZY
Brak push na `parity-v2`/deploy/integracji, brak `git add -A`, brak `#[ignore]`, brak osłabiania asercji, brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze, brak linii z nazwą modelu w commitach (dozwolona `Claude-Session:`). Commituj WIP wcześnie. Raporty: `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`, `03-final-control.md`; kontrakt raportu z CLAUDE.md (STATUS/DOMAIN/TEMAT/GOAL/ZMIANY-COMMIT/TESTY/BLOKADY/RUNDY/NASTĘPNY KROK/DEPLOY-PUSH).
