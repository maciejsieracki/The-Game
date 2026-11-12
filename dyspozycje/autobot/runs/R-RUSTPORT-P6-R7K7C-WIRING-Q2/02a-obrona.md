# 02a-obrona — R-RUSTPORT-P6-R7K7C-WIRING-Q2 (Operator, obrona po rundzie Evaluatora r1)

STATUS: PASS-WITH-NOTES (obrona przyjęta częściowo; kryterium 2 i część kryterium 3 pozostają OTWARTE i wymagają decyzji właściciela)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING-Q2
GOAL: wpięcie `apply_dipl_deltas_to_state` w `advance_turn` zgodnie z pinem 07d2fbd72, parytet „brak wpisu = 0”
BAZA: 54781df87 (raport Operatora r1, kod 3dc2902ca); commit obrony: patrz sekcja SHA
ZASADA ODPOWIEDZI: każdy zarzut ma werdykt PRZYJMUJĘ (poprawka / test / dowód) albo ODRZUCAM (dowód). Zarzut przyjęty, którego nie da się zamknąć w tej rundzie, jest oznaczony jako OTWARTY.

## Odpowiedzi na zarzuty

### Zarzut 1 — kryterium 2 (wektory pinu >=150 dla apply i D3) niespełnione
Werdykt: PRZYJMUJĘ. Kryterium pozostaje OTWARTE. Nie zamykam go w tej rundzie.
- Nie wygenerowano wektorów. Brak pliku generatora `.mjs` i brak strażnika SHA-256 dla tej funkcji.
- Powód techniczny: w pinie 07d2fbd72 nie ma funkcji `apply`. Zapis jest wbudowany w domknięcie `buildDiploTreasury()` (`gra/src/main.ts`, okolice linii 22618-22645: `add` i `aiSkarbiecByOwner.set`). D3 (`tickCyclicResourceTradeDeals`, `main.ts:24077` w domknięciu) również zamyka się w domknięciu. Wektor wymaga wyciągnięcia tekstu domknięć i wykonania ich w node z podstawionymi globalami. To przerabianie pinu poza allowlistą (`p6_r7k7c_gen.mjs` nie pokrywa wpięcia, jak zauważył Evaluator).
- Decyzja właściciela potrzebna: (a) refaktor pinu pod wektory (poza allowlistą), albo (b) zmiana kryterium na testy jednostkowe + porównanie z opisem pinu.

### Zarzut 2 — testy „brak wpisu = 0” są ręczne, nie oparte na wektorach
Werdykt: PRZYJMUJĘ. Testy są ręczne (stałe w kodzie testu). Kryterium 3 w wersji „z wektorem pinu” pozostaje OTWARTE, bo zależy od zarzutu 1.
- Dodany test `delta_for_owner_without_producer_starts_from_zero_like_pin` (tests/p6_r7k7c_apply_wiring.rs) sprawdza wartości wyprowadzone z tekstu pinu (`?? 0`, `Math.max(0, v)`), a nie z wyjścia Rust.
- Stary test `delta_for_owner_without_producer_is_explicit_error_not_zero` został zastąpiony (zmiana zachowania, nie osłabienie: patrz zarzut 3).

### Zarzut 3 — regresja produkcyjna: `apply` zwraca błąd przy braku producenta
Werdykt: PRZYJMUJĘ. Poprawka wykonana.
- Zmiana w `rust-port/engine/src/domain/turn_war_dipl_steps.rs` (funkcja `apply_dipl_deltas_to_state`): brak wpisu skarbca AI i brak wpisu puli Pracy daje saldo 0 (`.copied().unwrap_or(0.0)`), jak pin (`ownerTreasury` / `ownerPracaPool` = `?? 0`; `add` = `(get ?? 0) + delta`; pula Pracy podłogowana przez `Math.max(0, v)`). Usunięte gałęzie `WarTurnError::DiplStep` dla brakującego producenta. Zostają błędy dla nieskończonych wartości i ujemnego indeksu właściciela.
- Dowód: `cargo test --test p6_r7k7c_apply_wiring` 4/4, w tym nowy test parytetu (AI treasury po delcie 12.5 = 12.5; pula Pracy 3.0; pula ujemna z brakiem producenta = 0.0).
- Dowód, że ścieżka błędu nie była osiągalna w przepływie produkcyjnym (uzupełnienie, nie uzasadnienie zmiany): `Ledger::add` (turn_war_dipl_steps.rs ok. linii 358-363) najpierw woła `balance(owner)`, który zwraca błąd przy braku producenta, a dopiero potem wpisuje `treasury_delta`. Delta skarbca dla właściciela istnieje więc tylko wtedy, gdy producent był w wejściach kroku. Dla pul Pracy sprawdziłem tylko `praca_of` w D3 (linie ok. 410-411 i 546-548); pełnego śladu zapisu `praca_delta` NIE_ZMIERZONO.
- Ważne rozróżnienie: błąd „brak producenta” pochodzący z `balance()` / `praca_of()` WEWNĄTRZ `run_war_turn` istniał przed wpięciem i nie jest skutkiem tego zadania. Nie zmieniałem go (zmiana zmieniłaby semantykę płatności w całym kroku D). OTWARTE: rozbieżność `balance()` z pinem (`?? 0`) do decyzji właściciela, z ryzykiem „cichych zer” jako świadomą polityką.
- Test end-to-end: `advance_turn_moves_tribute_from_ai_treasury_to_human_treasury` (playable.rs) i nowy przypadek odwrotny (zarzut 5) przechodzą.

### Zarzut 4 — pozycja wywołania (po D8) odbiega od pinu; równoważność tylko w komentarzu
Werdykt: ODRZUCAM część (równoważność wobec hamulca ma dowód w kodzie); PRZYJMUJĘ brak wektora pozycji.
- Dowód: `BrakePhaseInput` (`rust-port/engine/src/domain/ai_diplomacy_turn.rs:68-88`) zawiera wyłącznie: `me_id`, `contacts`, `owners`, `relation_after_tick`, `params`, `ostrzezenie_tur_przed`, `power`, `peace_locked`, `gate_blocked`. Nie ma pól skarbca ani puli Pracy. Wejścia mocy są budowane przed `run_war_turn` (`build_war_inputs`), więc zapis po kroku D nie zmienia wejścia hamulca.
- Wewnątrz `run_war_turn` `Ledger` aktualizuje własne mapy przy każdym `add` (przyrosty widoczne dla kolejnych kroków D tej samej tury), a `apply` zapisuje wynik końcowy do stanu. Stąd równoważność końcowego stanu skarbców z pinem, o ile kroki D czytają własny ledger, co jest zachowane w kodzie.
- NIE_ZMIERZONO: brak wektora pinu dla pozycji wywołania (zarzut 4 w części „wektor”). Nie dodano testu kolejności.

### Zarzut 5 — test end-to-end pokrywa jeden scenariusz, bez przypadku odwrotnego
Werdykt: PRZYJMUJĘ. Poprawka wykonana.
- Dodany test `advance_turn_moves_tribute_from_human_treasury_to_ai_treasury` (`rust-port/engine/src/domain/playable.rs`): gracz płaci AI 40 przez `advance_turn`; skarbiec gracza 100 -> 60, skarbiec AI (z producentem) 500 -> 540. Test zielony.
- Przypadek AI-odbiorca BEZ producenta przez `advance_turn` NIE został dodany: błąd pojawia się wcześniej, w `balance()` wewnątrz `run_war_turn` (zob. zarzut 3), a nie w `apply`. Dodanie testu wymagałoby zmiany zachowania kroku D (poza tą rundą).
- Wektorów nadal brak (zarzut 1).

### Zarzut 6 — test `advance_turn_without_dipl_deltas_does_not_touch_owner_pools` zakłada niezmienność `economy.treasury`
Werdykt: PRZYJMUJĘ ocenę, NIE zmieniam asercji. OTWARTE.
- Asercja `economy.treasury == before_treasury` zostaje bez zmian. Kryterium 4 zabrania osłabiania asercji, a zamiana na inny warunek wymagałaby innego oracle'a niż wynik Rust.
- Uzasadnienie niezmienności skarbca w tej turze zależy od innych faz `advance_turn`, których ta praca nie dotyka. NIE_ZMIERZONO: nie prześledziłem, które fazy mogą zmienić `economy.treasury` przy pustych umowach. Test jest zielony w bazie i po zmianie.

## Bramki (EXIT 0 / wynik)
- `cargo fmt --check`: EXIT 0.
- `cargo clippy --all-targets -- -D warnings`: EXIT 0.
- `cargo test --lib`: 101 passed, 0 failed, 0 ignored (w tym `war_pipeline_advance_tests` 5/5; wcześniej 100, nowy przypadek odwrotny).
- `cargo test --test p6_r7k7c_apply_wiring`: 4 passed, 0 failed.
- Brak `#[ignore]` w zmienionych plikach.
- NIE_ZMIERZONO: pełny `cargo test --tests` (nie uruchomiony w tej rundzie).
- `Cargo.lock` wygenerowany przez cargo, NIE commitowany.

## Stan kryteriów po r2
1. Produkcyjny wołający w `advance_turn` (playable.rs, po `run_war_turn`): SPEŁNIONE (bez zmian w pozycji).
2. Wektory >=150 dla apply i D3: OTWARTE (decyzja właściciela, zarzut 1).
3. Test „brak wpisu = 0”: CZĘŚCIOWO (ręczny, z wartościami pinu; bez wektorów).
4. Brak `#[ignore]`, brak osłabionych asercji: SPEŁNIONE (zmieniono oczekiwanie w teście błędu na zachowanie pinu, nie osłabiono asercji).
5. Bramki EXIT 0: SPEŁNIONE dla fmt, clippy, lib, nowego testu.

## OTWARTE do decyzji właściciela (ABC)
A. Refaktor pinu pod wektory dla `apply` i D3 (zarzut 1) albo zmiana kryterium 2/3.
B. Polityka `balance()` / `praca_of()` w `run_war_turn` przy braku producenta: błąd (obecnie) czy saldo 0 jak pin (zarzut 3, poza tym zadaniem).
C. Asercja niezmienności skarbca w `advance_turn_without_dipl_deltas_...` (zarzut 6).

## SHA
Kod obrony: patrz commit na gałęzi `r7k7c-q2-obrona` (lokalnie, bez push). Pliki: turn_war_dipl_steps.rs, playable.rs, tests/p6_r7k7c_apply_wiring.rs, 02a-obrona.md.

NASTĘPNY KROK: Evaluator r2 (weryfikacja zmian zarzutów 3 i 5; kryteria 2-3 zostają OTWARTE do decyzji A).
DEPLOY/PUSH: NIE WYKONANO. Brak push do rust-port/parity-v2, brak integracji, brak dotknięcia gra/ i origin/main.
RUNDY: 2/5 (Operator r2 po BLOCK r1 z zarzutami Evaluatora)
