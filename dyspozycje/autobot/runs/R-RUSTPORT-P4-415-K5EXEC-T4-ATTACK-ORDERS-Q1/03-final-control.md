# R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 — raport Final Control, runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1
GOAL: rozkazy gracza `attack` i `attackMove` w `perform_player_order` oraz `attack_move_path` / `first_step_on_attack_move_path` zgodne z pinem `07d2fbd72` (`battleScene.ts` :18353-18428, :18535-18572), dowód na wektorach kroku wykonanych z tekstu pinu.
ZMIANY/COMMIT: oceniany kod = `7f97cd907` (Obrona r1; kod Operatora `41a54af82` + test Obrony `9de3125dd`), gałąź `obrona/415-r1`, przodek `1dedba56c` (= baza z dispatchu, `origin/rust-port/parity-v2`). FC nie zmienia kodu. Jedyny nowy plik: ten raport (gałąź `fc/415-r1`).
TESTY: (FC samodzielnie, na `7f97cd907`; `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie FC, usunięty po bramkach; jeden build naraz, brak procesów cargo w tle po zakończeniu)
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- pełny `cargo test --all-targets --no-fail-fast` (engine, w tle, log): EXIT 0. 560 linii `test result`: 4383 passed, 0 failed, 1 ignored (ignorowany sprzed tematu, w nowych plikach brak `#[ignore]`). Liczby zgodne z Operatorem, Evaluatorem i Obroną.
- Odtwarzalność wektorów: `WIRING_A_ATTACK_ORDER_STEPS=1 WIRING_A_OUT=<scratchpad> node rust-port/engine/tests/p6_k5loop_wiring_a_gen.mjs` (14 s): 1650 rozkazów, 672 drogi, strażnik SHA-256 pinu przeszedł; MD5 `a16ce98fe3891fbd22ee4aedbadc8adf` = MD5 pliku w commicie.
- `git diff --check 1dedba56c 7f97cd907`: czysto. Istniejące pliki wektorów: bez zmian (diff katalogu wektorów = wyłącznie nowy `attack_order_step_vectors.json`); generator: 0 usuniętych linii, same dopiski.
- Mutanty własne FC (4, skrypt w scratchpadzie `fc415/mut.py`, jedna podmiana + `cargo test --test p4_415_attack_orders`, plik przywrócony, `git status` czysty): F1 droga bez pola startu — ZABITY; F2 `attack` bez filtra `routed` (`find` po całym rosterze z `!dead && !fadingOut`) — ZABITY; F3 tie-break Manhattan od (0,0) zamiast od `ru` — ZABITY; F4 filtr pierwszego kroku `compact || !backtrack` zamiast `&&` — ZABITY. Bilans łączny (Operator 22 + Evaluator 19 + FC 4 = 45): 40 zabitych, 5 jawnie równoważnych (M11a, M14, E2, E3, E4) z uzasadnieniem sprawdzonym przez FC.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: integracja orkiestratora (FF/merge `fc/415-r1` na `rust-port/parity-v2`, pełny `cargo test` po integracji).
DEPLOY/PUSH: NIE WYKONANO.

## Przegląd zgodności z pinem (FC, linia po linii)
- `_attackMovePath` :18535-18566: start w `parent`, pętla `head < len && len < BF_COLS*BF_ROWS` (inkrementacja `head` po odczycie = semantyka `for`), wyjście przy zdjęciu celu, `DIRS4`, odrzucenia w kolejności pinu (plansza, `parent`, `_passableForUnit`, `_destAllowedByBlockade`, zajętość: `PlayerSide` zawsze, `OtherSide` przy `!allowEnemyCells`, `ru` przepuszczony), odtworzenie `[start, ...path.reverse()]` / `null`. Zgodne.
- `_firstStepOnAttackMovePath` :18568-18572: `allowEnemyCells=false`, `path.get(1)`. Zgodne.
- `attackMove` :18353-18394: trasa z `allow=true`; zagrożenia = `_enemiesOf` (`dead`/`fadingOut`/`routed`, pin :8291-8294) + jawny filtr z `removed`; warunek „na polu trasy || some(_canStrikeTargetFrom)” z krótkim spięciem; sort stabilny z komparatorem `a-b || m` (0/NaN → Manhattan od `ru`); uderzenie z miejsca; krok `_firstStepAlongPathToAttack(ru, undefined, t)` z blokadą — odmowa przechodzi dalej (nie kończy); cel = pozycja → `none`; krok trasy, brak → `done()`, blokada → `done()`. Zgodne.
- `attack` :18395-18428: `find` po `_enemiesOf` z `id && !dead && !fadingOut`, brak → `none`; uderzenie z miejsca; filtr `compact(q) && !(avoid && last==(q,r))`; blokada; `prev = avoid ? pos : undefined`. Zgodne.
- `perform_player_order`: `hold` → `_performSiegeManualOrder` (teraz także dla `attack`/`attackMove`; bramka pinu :18436 wyłącza tylko `move`) → gałąź. Zgodne z :18280-18286.
- Harness: generator wykonuje tekst pinu (`load(SCENE)`, strażnik SHA-256); `_canStrikeTargetFrom`, `_attackMovePath`, `_firstStepAlongPathToAttack`, `_performSiegeManualOrder` są opakowaniami-obserwatorami wołającymi oryginał; `_doMove`/`_doAttack` zapisują decyzję. Test Rust odpowiada na `can_strike_from` wyłącznie z dziennika pinu (zapytanie spoza dziennika = rozbieżność), a krok ku celowi liczy prawdziwy port T4a.

## Orzeczenia zarzutów
| Zarzut | Źródło | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| N1 opis limitu BFS (`<` vs `<=` nieodróżnialne) | Evaluator | ODDAL | Precyzja opisu, nie zachowania. Limit = liczba pól jest semantycznie no-op (każde pole w kolejce najwyżej raz); limity mniejsze zabite (M8, E1). Port przenosi warunek dosłownie (D-415-2). Obrona skorygowała opis. |
| N2 brak przypadku pełnego remisu (E13 przeżywał) | Evaluator | ODDAL (zamknięte w Obronie) | Obrona dodała przypadek 48 wrogów z remisem w `kolejnosc_zagrozen_priorytet_potem_manhattan` (`9de3125dd`); E13 (`sort_unstable_by`) zabity. FC zweryfikował, że test przechodzi w pełnym `cargo test`. Przypadek jest syntetyczny, oczekiwanie wynika ze stabilności `Array.prototype.sort` (ES2019) — dopuszczalne w D-415-3. |
| N3 słaba miara licznika `compact-odmawia-sasiada` | Evaluator | ODDAL | Licznik mierzy obecność warunku, ale skutek filtra dowodzą zabite M15, E19 i FC F4. Zmiana licznika wymagałaby regeneracji wektorów bez nowego dowodu. |
| N4 NIE_ZMIERZONO (wołający produkcyjny, bitwy RT, H3, predykaty jako wejścia) | Evaluator | ODDAL | Granica zakresu narzucona dispatchem (D-415-1, D-415-3; pin :6093). Predykaty mają osobne porty i wektory (#256, #258, #267). Lista NIE_ZMIERZONO jawna w raporcie Operatora. |
| Plik poza allowlistą `tests/p4_404_move_order.rs` | FC (allowlista) | ODDAL | 5 mechanicznych dopisków `|| unreachable!(...)` po zmianie sygnatury `perform_player_order`; asercje bez zmian; bez tego test T3 się nie kompiluje. Uzasadnienie w raporcie Operatora, zgodne z „Inny plik: uzasadnij”. |
| Zmiana `player_order_move.rs` (warianty + argument `attack`) | FC (allowlista) | ODDAL | Dispatch dopuszcza „rozszerzenie `player_order_move.rs`”; usunięte `PlayerOrder::Other` / `PerformOrder::Other` nie mają innych użytkowników (`git grep` w `src`, kliencie i rendererze = 0). |
| Drobne: nagłówek modułu `player_order_move.rs:4` nadal opisuje `perform_player_order` jako `:18280-18353` (hold/none/move) | FC | ODDAL (uwaga) | Akapit niżej w tym samym pliku i dokumentacja funkcji podają poprawny zakres `:18280-18428`; tylko kosmetyka komentarza, bez wpływu na zachowanie. Do poprawy przy H3/T5. |

Zarzutów NAPRAW: 0. DO DECYZJI CZŁOWIEKA: 0.

## Kryteria końca (dispatch)
1. `attack_move_path` / `first_step_on_attack_move_path` = pin na 672 drogach (oba `allowEnemyCells`, scena otwarta pod limit, brak drogi 183, cel = start 54, przez pole wroga 55): SPEŁNIONE.
2. Gałęzie `attack` / `attackMove` = pin na 1650 rozkazach z asercją pokrycia każdej wymaganej gałęzi (≥ 3 na klucz): SPEŁNIONE.
3. Mutanty ≥ 8: 45 uruchomionych, 40 zabitych, 5 równoważnych z uzasadnieniem: SPEŁNIONE.
4. Istniejące wektory i pełny `cargo test` engine bez regresji (4383/0/1): SPEŁNIONE.
5. Raport z liczbami, NIE_ZMIERZONO i mapą H3/H4/T5..T7 z liniami pinu (raport Operatora): SPEŁNIONE.

## Zakazy
Brak push/deploy/integracji przez role; brak `git add -A` (FC dodaje tylko ten raport); brak `#[ignore]`; brak zmian w `gra/`, kontrakcie mostu, kliencie i rendererze; commity tematu bez linii z nazwą modelu (sprawdzone `git log 1dedba56c..7f97cd907`).

## NIE_ZMIERZONO (podtrzymane)
- Produkcyjny wołający (`ProdBody` nie trzyma `playerOrder` gracza; T5/H4) i przebieg w pętli bitwy w czasie rzeczywistym.
- Pełne ciało `_performSiegeManualOrder` (H3) — tu tylko jego wynik `bool` z pinu.
- `_canStrikeTargetFrom`, `_priorityScore`, `_compactAttackAllowsStep`, `_destAllowedByBlockade`, `_shouldAvoidAutoBacktrack` jako liczba z Rust w tej kompozycji (wejścia z pinu; własne porty mają osobne wektory).

## Werdykt
PASS-WITH-NOTES. Wszystkie zarzuty ODDAL; uwagi dotyczą precyzji opisu i granic zakresu, nie zachowania.
