# R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 — Obrona Operatora (runda 1)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1
GOAL: rozkazy gracza `attack` i `attackMove` w `perform_player_order` oraz `attack_move_path` / `first_step_on_attack_move_path` zgodne z pinem `07d2fbd72` (`battleScene.ts` :18353-18428, :18535-18572).
ZMIANY/COMMIT: baza Obrony = `9b735cb6b` (raport Evaluatora; kod Operatora `41a54af82`). Commit kodu Obrony `9de3125dd`: jeden plik z allowlisty, `rust-port/engine/tests/p4_415_attack_orders.rs` (+16 linii, nowy przypadek testowy; kod produkcyjny bez zmian). Raport w kolejnym commicie (SHA w odpowiedzi Obrony).
TESTY: patrz §Bramki.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### N1 — opis limitu `queue.length < BF_COLS*BF_ROWS` — PRZYJMUJĘ (korekta opisu, bez zmiany kodu)
Evaluator ma rację. Każde pole trafia do kolejki najwyżej raz (wpis w `parent` przed `push`), więc długość kolejki nie przekracza `BF_COLS*BF_ROWS`. Limit o dokładnej wartości nic więc nie zmienia, a `<` i `<=` dają to samo (E2 równoważny). Poprawiony opis dowodu z raportu Operatora: wektory pokazują, że port zachowuje limit **nie mniejszy** niż liczba pól. Limity mniejsze są wykrywane (M8 = 1024 i E1 = limit − 1 zabite). Wektory nie odróżnią `<` od `<=` ani od braku limitu. Port przenosi warunek z pinu dosłownie (D-415-2), więc nie ma czego zmieniać w kodzie.

### N2 — brak przypadku z pełnym remisem zagrożeń (mutant E13) — PRZYJMUJĘ (poprawka + dowód)
Poprawka w `kolejnosc_zagrozen_priorytet_potem_manhattan` (commit `9de3125dd`): 48 wrogów na tym samym polu (11,10). Mają tę samą odległość Manhattan, a `_priorityScore` = `i % 2`, czyli klucze przeplatają się i tablica nie zaczyna się od gotowego posortowanego przebiegu. `Array.prototype.sort` (TimSort, stabilny) zostawia przy remisie kolejność rosteru, więc oczekiwany wynik to najpierw parzyste indeksy rosnąco, potem nieparzyste.
Dowód:
- port (`sort_by`): `cargo test --test p4_415_attack_orders` daje 3 passed / 0 failed.
- mutant E13 (`sort_unstable_by`, wprowadzony tymczasowo i cofnięty `git checkout`): test FAILED, `left: [24, 2, 4, …, 22, 0, 26, …, 21, 25, 5, 27, …]`, a `right` to kolejność rosteru. **E13 zabity.** Bilans mutantów: 36/41 zabitych, 5 jawnie równoważnych (M11a, M14, E2, E3, E4). Pozostałych mutantów nie uruchamiałem ponownie, bo kod produkcyjny się nie zmienił.
- Przypadek jest syntetyczny (D-415-3: wektory kroku z czystych funkcji). Oczekiwanie wynika ze stabilności sortowania w ECMAScript (ES2019+), nie z nowego uruchomienia generatora. Plik wektorów i generator są bez zmian (MD5 `a16ce98fe3891fbd22ee4aedbadc8adf`).

### N3 — słaba miara licznika `attack/compact-odmawia-sasiada` — PRZYJMUJĘ (opis), kod bez zmian
Licznik liczy sceny, w których jakakolwiek kolumna sąsiada ma `compact=false`, a nie sceny, w których filtr faktycznie odrzucił kandydata. To miara obecności warunku, nie jego skutku. Dowodem skutku są mutanty M15 i E19 (filtr usunięty albo odwrócony). Oba zabite, co Evaluator sam potwierdza. Nie zmieniam licznika: zmiana dotyczyłaby generatora i pliku wektorów, które są już zgodne (MD5 jak wyżej). W ramach budżetu D-415-3 nie dałoby to nowego dowodu zachowania.

### N4 — NIE_ZMIERZONO: wołający produkcyjny, wektory bitew, H3, predykaty jako wejścia — PRZYJMUJĘ jako jawną listę NIE_ZMIERZONO (poza zakresem z dispatchu)
To nie jest rozbieżność z pinem, tylko granica zakresu nadana dispatchem:
- brak wołającego produkcyjnego (tryb ręczny gracza T5/H4) i brak wektorów bitew w czasie rzeczywistym: D-415-1 i D-415-3 („Wektorów bitew w czasie rzeczywistym NIE generujesz”; w AUTO `_activateUnit` zeruje `playerOrder`, pin :6093).
- `_performSiegeManualOrder` (H3) jako wynik bool z pinu: D-415-1 („Poza zakresem: `_performSiegeManualOrder` (H3)”).
- `_canStrikeTargetFrom`, `_priorityScore`, `_compactAttackAllowsStep`, `_destAllowedByBlockade` i `_shouldAvoidAutoBacktrack` jako wejścia z pinu: te funkcje mają już własne porty i wektory z wcześniejszych tematów (T2 #267, K5DOC-T2 #256, K5DOC-T4 #258). Tutaj sprawdzana jest kompozycja w gałęziach `attack`/`attackMove`. Złożenie ich z produkcyjnymi portami nastąpi przy wpięciu (T5/H4).
Status pozostaje NIE_ZMIERZONO do czasu T5/H4.

### Zmiana poza allowlistą `tests/p4_404_move_order.rs` — przyjęte przez Evaluatora; brak odpowiedzi wymaganej
Zmiana jest mechaniczna (argument `|| unreachable!` po zmianie sygnatury), asercje bez zmian. Podtrzymuję uzasadnienie z raportu Operatora.

### Bramki — podtrzymane i powtórzone po poprawce
Patrz niżej.

## Bramki (na `9de3125dd`, własny `CARGO_TARGET_DIR` w scratchpadzie, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --test p4_415_attack_orders`: 3 passed / 0 failed
- mutant E13 na nowym przypadku: FAILED (zabity), kod przywrócony (`git diff` czysty poza testem)
- pełny `cargo test --all-targets --no-fail-fast`: EXIT 0, 4383 passed / 0 failed / 1 ignored (suma z 560 linii `test result`; liczba testów bez zmian, bo nowy przypadek jest w istniejącej funkcji). Target usunięty po bramce, brak procesów cargo w tle.
