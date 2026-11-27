# R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1 — raport Evaluatora (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-415-K5EXEC-T4-ATTACK-ORDERS-Q1
GOAL: niezależnie sprawdzić port gałęzi `attackMove` (`:18353-18394`) i `attack` (`:18395-18428`) `_performPlayerOrder` oraz funkcji `_attackMovePath` (`:18535-18566`) i `_firstStepOnAttackMovePath` (`:18568-18572`) (pin `07d2fbd72`) na kodzie Operatora `41a54af82`.
ZMIANY/COMMIT: oceniany kod to `41a54af82` (gałąź `rust-port-wip/415-k5exec-t4-attack-orders`). `git merge-base --is-ancestor 1dedba56c 41a54af82` = prawda, więc baza zgadza się z dispatchem. Evaluator nie zmienia kodu. Jedyny nowy plik to ten raport.
TESTY: (env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, własny `CARGO_TARGET_DIR` w scratchpadzie, usunięty po bramkach)
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- pełny `cargo test --all-targets --no-fail-fast` (engine): EXIT 0. 560 sekcji `test result`, w sumie 4383 passed, 0 failed, 1 ignored. Liczby są identyczne z raportem Operatora. Przypadek ignorowany jest wcześniejszy: w nowych plikach nie ma `#[ignore]`.
- `p4_415_attack_orders`: 3/3 ok.
- Odtwarzalność wektorów: przebieg `WIRING_A_ATTACK_ORDER_STEPS=1 node p6_k5loop_wiring_a_gen.mjs` z `WIRING_A_OUT` w scratchpadzie (1650 rozkazów, 672 drogi) dał MD5 `a16ce98fe3891fbd22ee4aedbadc8adf`. To ten sam MD5 co plik w commicie. Strażnik SHA-256 pinu (`3eeeb760…`) przeszedł, a generator wykonuje tekst pinu przez `load(SCENE)`.
- Istniejące pliki wektorów: `git diff --stat 1dedba56c 41a54af82 -- tests/p6_k5loop_wiring_a_pin_vectors/` pokazuje wyłącznie nowy `attack_order_step_vectors.json`. W generatorze nie usunięto żadnej linii, są same dopiski.
BLOKADY: brak.
RUNDY: 1/5.
NASTĘPNY KROK: Obrona (`02a-obrona.md`), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Zgodność z tekstem pinu (przegląd linia po linii)
- `_attackMovePath`. BFS po `DIRS4` w tej samej kolejności. Warunek pętli to `head < len && len < BF_COLS*BF_ROWS`, a pętla przerywa się, gdy zdejmie cel. Pole jest odrzucane, gdy jest poza planszą, w `parent`, nie spełnia `!_passableForUnit` albo `!_destAllowedByBlockade`. Zajęte pole: `PlayerSide` daje zawsze `continue`, a `OtherSide` daje `continue` tylko przy `!allowEnemyCells`. To jest równoważne pinowemu `occupant && occupant !== ru && (!allow || _isPlayerSide)`. Odtworzenie drogi daje `[start, …, goal]`, przy celu = start `[start]`, a gdy cel jest nieosiągalny, `None`. Zgodne z pinem.
- `_firstStepOnAttackMovePath`: `path.get(1)` jest równoważne `path.length > 1 ? path[1] : null`. Zgodne.
- Zagrożenia `attackMove`. Najpierw filtr `_enemiesOf` (`dead`/`fadingOut`/`routed`), potem jawny filtr z `removed`. Warunek „na polu trasy” jest liczony przed `some(_canStrikeTargetFrom)` i się skraca, tak jak w pinie, co potwierdza dziennik zapytań. Komparator `a-b || m` przy 0/NaN przechodzi na Manhattan od `ru`. Sortowanie jest stabilne. `_priorityScore` (`:17512`) jest czysty i skończony, więc wyliczenie go raz z góry jest równoważne wołaniu w komparatorze.
- `attack`. `find` po `_enemiesOf` z `id && !dead && !fadingOut`. Filtr pierwszego kroku to `compact(q) && !(avoid && last == (q,r))`. `prev = avoid ? pos : undefined`. Blokada sprawdzana po kroku. Zgodne.
- `perform_player_order`. Kolejność: `hold`, potem `_performSiegeManualOrder` (teraz także dla `attack`/`attackMove`, co zgadza się z pinem `:18286`, bo bramka `:18436` wyłącza tylko `move`), potem gałąź. Zgodne.
- Siła harnessu: `can_strike_from` portu odpowiada wyłącznie z dziennika pinu. Zapytanie spoza dziennika jest rozbieżnością, więc port nie może pytać o więcej (ani inaczej) niż pin. Krok `_firstStepAlongPathToAttack` liczy prawdziwy port T4a na planszy przypadku, a ślad wywołań (allow, cel, wynik) jest porównywany z pinem.

## Mutanty Evaluatora (własne, 19; skrypt w scratchpadzie `e415/mut/mut.py`, każdy to jedna podmiana i `cargo test --test p4_415_attack_orders`)
Zabite: 15/19.
- E1 limit BFS `-1`. Granica limitu jest więc realnie pokryta przez scenę otwartą.
- E5 odwrócona kolejność `DIRS4`.
- E6 `prev` zawsze ustawione.
- E7 filtr cofania bez `avoid`.
- E8 odmowa blokady kroku ku zagrożeniu daje `NoStep` zamiast przejścia dalej.
- E9 odwrócony tie-break Manhattan.
- E10 sprawdzenie „cel = pozycja” przed zagrożeniami.
- E11 krok trasy = ostatnie pole.
- E12 `attack` bez uderzenia z miejsca.
- E14 `some` bez pola startu.
- E16 `PlayerSide` traktowane jak wróg przy `allow=true`.
- E19 `compact` liczony na kolumnie `ru`.
- E20 brak celu `attack` daje `NoStep`.
- E21 tie-break bez gałęzi NaN. Zabity tylko testem syntetycznym, bo NaN jest nieosiągalny w pinie.
- E22 blokada w BFS pomijana przy `allow=true`.

Przeżyły 4/19. Wszystkie oceniam jako równoważne:
- E2 `len < limit` → `len <= limit`. Kolejka nie może przekroczyć liczby pól (BF_COLS·BF_ROWS), bo każde pole trafia do niej najwyżej raz. Przy `len == limit` wszystkie pola są już w `parent`, więc kolejne iteracje nic nie dodają. Wynik jest identyczny.
- E3 bez `break` przy zdjęciu celu. `parent` celu jest ustawiany przy pierwszym odkryciu i nigdy nie jest nadpisywany. Zmienia się tylko koszt.
- E4 `SelfUnit` traktowane jak przeszkoda. `ru` stoi wyłącznie na `start`, a `start` jest w `parent` od początku, więc gałąź jest nieosiągalna.
- E13 `sort_unstable_by` zamiast `sort_by`. Port używa stabilnego sortowania, jak V8, więc to nie jest błąd portu. Przeżycie mutanta wynika z tego, że `sort_unstable` w Rust dla krótkich tablic (≤ 20) sortuje przez wstawianie, które w praktyce zachowuje kolejność. Nie da się go zabić na rosterze ≤ 8 wrogów. Uwaga N2 poniżej.

Mutanty Operatora (20/22 zabitych, 2 równoważne): sprawdziłem uzasadnienia równoważności.
- M11a: `_enemiesOf` (`:8293`) już odfiltrowuje `dead`/`fadingOut`, więc warunek w `find` jest nadmiarowy. Potwierdzam.
- M14: każde `path[1]` jest polem wrzuconym do kolejki, a więc minęło `_destAllowedByBlockade` w BFS (`:18554`). Potwierdzam. Test asertuje brak wariantu `BlockadeBlocked{Waypoint}`.

## Allowlista
- W allowliście: nowy `player_order_attack.rs`, wpis w `mod.rs`, nowy test, dopisek w generatorze, nowy plik wektorów, raport.
- `player_order_move.rs`: warianty `PlayerOrder::{AttackMove, Attack}`, `PerformOrder::Attack` i leniwy argument `attack`. To jest „rozszerzenie”, które dispatch dopuszcza w zakresie gałęzi `perform_player_order`. Usunięcie `PlayerOrder::Other`/`PerformOrder::Other` nie ma innych użytkowników (`git grep` = 0).
- Poza allowlistą: `tests/p4_404_move_order.rs`. Zmiana jest czysto mechaniczna: 5× nowy argument `|| unreachable!(…)`, bo zmieniła się sygnatura. Asercje są bez zmian. Uzasadnienie jest w raporcie Operatora. Przyjmuję.
- `siege_tactics_loop.rs` nietknięty. Klient i renderer nietknięci. `gra/` nietknięte.
- Commity nie zawierają linii z nazwą modelu.

## Uwagi (nie blokują)
- N1: raport Operatora twierdzi, że na scenie otwartej „decyduje limit `queue.length < BF_COLS*BF_ROWS`”. Ściślej: limit o dokładnej wartości jest semantycznie no-op (E2 jest równoważny). Wektory zabijają limity mniejsze (M8 = 1024, E1 = −1), ale nie odróżnią `<` od `<=` ani od braku limitu. To nie jest błąd, tylko nieprecyzyjny opis dowodu.
- N2: test nie ma przypadku z pełnym remisem dwóch zagrożeń (ten sam `_priorityScore` i ta sama odległość Manhattan), który rozstrzyga stabilność sortowania. Port jest stabilny, jak pin, ale żaden mutant tego nie wymusza (E13). Sugestia dla Obrony/FC: to opcjonalny przypadek syntetyczny w `kolejnosc_zagrozen_priorytet_potem_manhattan`, na tablicy > 20 elementów albo z jawną asercją kolejności rosteru przy pełnym remisie.
- N3: pokrycie „`compact-odmawia-sasiada`” liczy przypadki, w których jakakolwiek kolumna sąsiada ma `compact=false`. To słaba miara, ale mutanty M15 i E19 są zabite, więc filtr jest realnie sprawdzony.
- N4 (NIE_ZMIERZONO, zgodnie z D-415-1 i D-415-3): brak wołającego produkcyjnego (T5/H4) i brak wektorów bitew w czasie rzeczywistym. `_performSiegeManualOrder` (H3) wchodzi tylko jako wynik `bool` z pinu. `_canStrikeTargetFrom`, `_priorityScore`, `_compactAttackAllowsStep`, `_destAllowedByBlockade` i `_shouldAvoidAutoBacktrack` są wejściami z pinu, a nie liczbą z Rust.

## Werdykt
PASS-WITH-NOTES. Port jest zgodny z tekstem pinu na 1650 rozkazach i 672 drogach (0 rozbieżności, wynik odtworzony niezależnie). Bramki mają EXIT 0. Z mutantów 35/41 (Operator + Evaluator) zabito, a pozostałe 6 są uzasadnione jako równoważne. Uwagi N1–N3 dotyczą precyzji dowodu, nie zachowania.
