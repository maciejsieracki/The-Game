STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-Q1
GOAL: Obrona Operatora (runda 1/5) na zarzuty Evaluatora (02-evaluator.md, commit 17ee206f2): przyjęcie lub odrzucenie każdego z 9 zarzutów z dowodem.
ZMIANY/COMMIT: SHA obrony = commit po 366c42729 (podany w raporcie orkiestratora). Allowlista zachowana: turn_war_inputs.rs, turn_war_dipl_steps.rs, p6_r7k7c_owner_pools.rs (nowe testy). Bez zmian w gra/, data/, Cargo.toml, Cargo.lock, WERSJE.md, origin/main, rust-port/parity-v2.
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --lib 94 passed; p6_r7k7c_owner_pools 13 passed (w tym 4 nowe); p6_wire_war_dipl_steps 8 passed; p6_wire_war_inputs 16 passed; p6_wire_war_stores 7 passed; git diff --check OK. Pełny cargo test --no-fail-fast NIE_ZMIERZONO (wolne miejsce 3,3 GB przy wymaganych 8 GB).
BLOKADY: patrz tabela odpowiedzi (zarzuty 1, 3, 4, 5, 9).
RUNDY: 2/5 (runda obrony po FAIL/PASS-WITH-NOTES Evaluatora; ostatni werdykt Evaluatora: zarzuty 1-9).
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki (zarzuty 2, 6, 8) i potwierdza odrzucenia (1, 3, 4, 5, 9); Final Control po decyzji ABC w zarzucie 1.
DEPLOY/PUSH: NIE WYKONANO (zgodnie z dispatchem: bez push i integracji).

## Odpowiedzi na zarzuty

### 1. Rozbieżność z pinem: strict zamiast `?? 0` — DECISION_REQUIRED (nie zmieniam bez ABC)
PRZYJMUJĘ FAKT, ODRZUCAM ZMIANĘ BEZ DECYZJI.
Dowód z pinu 07d2fbd72 (`gra/src/main.ts`): `aiSkarbiecByOwner.get(ownerId) ?? 0` (linie 10238, 20047) oraz `aiPracaPoolByOwner.get(ownerId) ?? 0` (`ownerPracaPool`). Pin czyta brak wpisu jako 0; Rust zwraca `WarTurnError::DiplStep` (świadomy wybór z R7K7-C: brak producenta = błąd, nie zero). To jest realna rozbieżność z pinem. Zmiana zachowania (zero zamiast błędu) jest decyzją projektową o obsłudze brakującego producenta, nie poprawką parytetu, więc nie zmieniam jej sam.
Opcje dla ABC:
- A (zalecana): parytet z pinem dla `apply_dipl_deltas_to_state` — brak wpisu = 0 jako baza. Powód: cel to parytet, a obecny błąd przerwałby turę po podłączeniu (zarzut 4). Producent w `power_raw_for_owner` zostaje z semantyką Missing.
- B: zostawić błąd i uznać rozbieżność za świadome odchylenie zapisane w rejestrze.
Komentarz w kodzie przy `apply_dipl_deltas_to_state` oznacza tę rozbieżność jako OTWARTĄ.

### 2. Brak klampowania Pracy — PRZYJMUJĘ (poprawka)
Pin: `setOwnerPracaPool` zapisuje `Math.max(0, value)` (main.ts ok. 34880). Rust `apply_dipl_deltas_to_state` nie podłogował puli.
Poprawka w `turn_war_dipl_steps.rs`: po walidacji skończoności `value = if value > 0.0 { value } else { 0.0 }` dla puli Pracy. Skarbce AI bez podłogi (pin ich nie podłogowuje — komentarz w pinie przy `aiSkarbiecByOwner.set`), więc zostają bez zmian.
Test: `apply_praca_pool_is_floored_at_zero_like_pin` (pula 4.0 - 10.0 = 0.0; gracz 1.0 - 1.0 = 0.0) oraz `apply_ai_treasury_has_no_floor_like_pin` (skarbiec -5.0 + 2.0 = -3.0, bez podłogi).

### 3. Brak wektorów pinu >= 150 dla apply i D3 — PRZYJMUJĘ jako dług, NIE_ZMIERZONO
Dług z R7K7-B pozostaje. `payments.json` (203 przypadki) pokrywa `activeDealsToPaymentDeals`, `tickDiplomacyPayments` i `tributeBreakPairsFromDeals` — NIE `apply_dipl_deltas_to_state`. Dla apply nie ma harnessu po stronie pina, który produkowałby wektory; to wymaga przerobki generatora `p6_r7k7c_gen.mjs`, czego nie zrobiłem w tej rundzie (koszt, dysk). D3 `tickCyclicResourceTradeDeals`: NIE_ZMIERZONO (domknięcie w main.ts, zgodnie z raportem operatora). Dodane testy brzegowe (zarzut 8) są jednostkowe z ręcznie policzonymi oczekiwaniami, a nie wektorami pinu — nie zamykają tego punktu.

### 4. Brak wpięcia apply w advance_turn (GOAL 3) — ODRZUCAM jako warunek tej rundy, PRZYJMUJĘ jako blokadę
Fakt przyjęty: `apply_dipl_deltas_to_state` nie jest wołane w `advance_turn`, efekty umów nie utrwalają się między turami.
Odrzucam, że to naruszenie GOAL tej rundy: dispatch w GOAL (3) wymaga „czystych funkcji stosujących efekty”, a wpięcie w ruch tury wymaga edycji `playable.rs` poza zakresem dispatchu („pola”) i wpływa na przebieg tury. Rozszerzenie allowlisty to decyzja orkiestratora/właściciela, nie moja. Nie wprowadzam tego w tej rundzie.
Do decyzji: rozszerzyć allowlistę o `advance_turn` w `playable.rs` w następnej rundzie (rekomendacja: tak, razem z zarzutem 1).

### 5. Zakres allowlisty (wariant błędu i settery w playable.rs) — PRZYJMUJĘ jako odchylenie, do decyzji FC
Dodano `PlayableError::EconomyOwnerIsHuman`, `set_owner_treasury`, `set_owner_praca_pool` i `is_human_owner` w `playable.rs`. Dispatch dopuszczał w `playable.rs` tylko pola. Nie cofam: settery są używane przez testy seedujące stan i odrzucają gracza ludzkiego. Final Control decyduje, czy akceptuje odchylenie, czy cofa settery (wtedy testy seedują przez pola publiczne).

### 6. Niespójny stan (wpis gracza w mapie AI) — PRZYJMUJĘ (poprawka)
Przed poprawką `dipl_steps_inputs` pomijał wpis AI dla gracza ludzkiego (`or_insert`), a bezpośredni zapis pola omijał setter.
Poprawka w `turn_war_inputs.rs`: nowy wariant `WarInputsError::HumanOwnerInAiTreasury(i64)` (z komunikatem w `Display`); `dipl_steps_inputs` zwraca błąd, zamiast ignorować wpis. Wstawianie do `out.treasury` przez `insert` zamiast `or_insert`, bo gracz ludzki nie może już tam trafić.
Test: `producer_rejects_human_entry_in_ai_treasury`.

### 7. Potwierdzenie braku konsumenta skarbca/Pracy w computeObjectivePower — PRZYJMUJĘ (bez zmian kodu)
Potwierdzenie przyjęte: element (3) z dispatchu jest N/A zgodnie z zarzutem. Straznik SHA-256 bez zmian.

### 8. Pokrycie zaokrągleń f64 i sald brzegowych — PRZYJMUJĘ (częściowo zamknięte)
Dodano testy: ułamki (0.25 + 0.25, 0.5 + 0.25 = 0.75), duże wartości (1e12 + 0.25 dokładnie reprezentowalne), ujemny start skarbca AI (-5.0 + 2.0 = -3.0). Oczekiwania liczone ręcznie, nie wektorami pinu. Pełne pokrycie wektorami: NIE_ZMIERZONO (patrz zarzut 3).

### 9. Bramki nie odtworzone w pełni — PRZYJMUJĘ jako notę
Tę rundę odtworzyłem częściowo: fmt, clippy `--all-targets -D warnings`, `cargo test --lib` (94), `p6_r7k7c_owner_pools` (13), `p6_wire_war_*` (8, 16, 7) — wszystkie EXIT 0 / passed. Pełny `cargo test --no-fail-fast` NIE_ZMIERZONO: wolne miejsce 3,3 GB przy wymaganych 8 GB (dispatch). Target poza repo usunięty po bramkach; `Cargo.lock` wygenerowany przez build usunięty, nie commitowany.

## Zmiany w tej rundzie
- `rust-port/engine/src/domain/turn_war_dipl_steps.rs`: podłoga 0 dla puli Pracy w `apply_dipl_deltas_to_state` (zarzut 2); komentarz o otwartej rozbieżności (zarzut 1).
- `rust-port/engine/src/domain/turn_war_inputs.rs`: wariant `HumanOwnerInAiTreasury`, strażnik w `dipl_steps_inputs` (zarzut 6).
- `rust-port/engine/tests/p6_r7k7c_owner_pools.rs`: 4 nowe testy (zarzuty 2, 6, 8).
- `dyspozycje/autobot/runs/R-RUSTPORT-P6-R7K7C-Q1/02a-obrona.md`: ten raport.
