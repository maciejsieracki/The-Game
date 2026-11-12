# 02a — Obrona Operatora r1 — R-RUSTPORT-P6-R7K7C-WIRING-Q1

STATUS: PASS-WITH-NOTES (zarzut 1 przyjęty częściowo: wektory apply dowiezione, wektory D3 NIE_ZMIERZONO)
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING-Q1
GOAL: wpięcie `apply_dipl_deltas_to_state` w fazę dyplomacji + parytet "brak wpisu = 0" + wektory pinu (apply i D3) >= 150 + test zgodności wstecznej.
ZMIANY/COMMIT: kod obrony `294e4d361` (gałąź lokalna `r7k7c-wiring-q1-wip/operator-r1-obrona`, bez push). Poprzedni commit Operatora: `57008aa9a`. Baza: `358cb6cf6`.
RUNDY: 2/5 (obrona r1 po zarzutach Evaluatora r1)

## Odpowiedzi na zarzuty

### Zarzut 1 (BLOKUJĄCY, GOAL pkt 3: wektory pinu) — PRZYJMUJĘ, CZĘŚCIOWO

Zarzut był trafny: Operator r1 nie wykonał wektorów z pinu. Wykonane teraz:

- Wektory **apply** (skarbce + pule Pracy): 200 przypadków, **wykonany tekst pina**, nie reimplementacja.
  - Generator: `rust-port/engine/tests/p6_r7k7c_wiring_vectors/gen-apply-vectors.mjs`. Czyta `gra/src/main.ts` z `git show 07d2fbd72:gra/src/main.ts`, wycina dosłownie funkcje `ownerTreasury`, `add` (closure z `buildDiploTreasury`), `ownerPracaPool`, `setOwnerPracaPool` i wykonuje je w `new Function` z minimalnymi stubami (`isHuman`, `playerStateByHuman`, `pracaPoolByHuman`, `aiSkarbiecByOwner`, `aiPracaPoolByOwner`).
  - Składanie jak w pinie: skarbiec = `add(id, delta)` na saldzie `ownerTreasury(id)`; pula Pracy = `setOwnerPracaPool(id, ownerPracaPool(id) + delta)`.
  - Pokrycie: skarbiec AI z wpisem 60, skarbiec AI bez wpisu 35 (pin `?? 0`), skarbiec gracza 40; pula Pracy AI z wpisem 40, bez wpisu 25. Wartości ułamkowe (0.1, 1/3, 2.5e-7), duże (1e15, 9007199254740993), ujemne, zerowe.
  - Floaty zapisane jako hex bitów IEEE-754 (`start_bits`, `delta_bits`, `expect`), więc nie ma ryzyka utraty precyzji w `serde_json`.
  - Test Rust: `rust-port/engine/tests/p6_r7k7c_wiring_apply.rs` (`apply_matches_pin_vectors_bit_for_bit`), porównanie `to_bits()`. Wynik: 1 passed.
  - Hashe pina i wycinków zapisane w `apply-vectors.json`: `pin_file_sha256=e80f9cb41d513b92846972a19f2760e08eb4247d6a9b344526d8bc71bd7d5f19`, `snippet_sha256` (m.in. addSrc `19e6a10e...`). Ponowna generacja z tym samym pinem daje plik bajt-w-bajt identyczny (sprawdzone: `git status` nie pokazuje zmiany). Skrypt zapisuje hashe, ale sam nie porównuje ich z wartościami zakodowanymi na sztywno; ten krok należy do Evaluatora.
  - Przypadek "gracz ludzki bez wpisu" pominięty świadomie: w Rust skarbiec gracza to pole `economy.treasury` (zawsze obecne), więc nie ma odpowiednika typowego. Wyjaśnione w generatorze.
- Wektory **D3** `tickCyclicResourceTradeDeals` (>= 150): **NIE_ZMIERZONO**. Powód: wycinek pina (`function tickCyclicResourceTradeDeals`, main.ts:24077) to closure zależne od `activeDeals`, `ownerResourceStock`, `applyCyclicDeliveryOutcome`, liczników dostaw i stanu miast. Wykonanie go w węźle wymaga stubowania całego domknięcia, a nie samych czterech funkcji jak przy apply. Nie próbowano na siłę. Do zrobienia w osobnym temacie (patrz NASTĘPNY KROK).

### Zarzut 2 (BLOKUJĄCY, GOAL pkt 2: wpięcie bez testu behawioralnego) — PRZYJMUJĘ, POPRAWIONE

- Dodany test end-to-end w `src/domain/playable.rs`, moduł `r7k7c_wiring_behaviour_tests::advance_turn_applies_tribute_deltas_to_ai_and_human_treasuries`.
  - Scenariusz: AI (id 2, dołożony wzorcem `with_ai`) płaci daninę 40 ¤/turę graczowi. Saldo AI 100 → **60**, skarbiec gracza +40. Test idzie przez prawdziwe `advance_turn()` (faza Diplomacy → `run_diplomacy_war_phase` → `apply_dipl_deltas_to_state`).
  - Dowód mutacyjny: usunięcie wywołania `apply_dipl_deltas_to_state` z `run_diplomacy_war_phase` → test **FAIL** (`left: Some(100.0), right: Some(60.0)`). Plik przywrócony z kopii, `git diff` potwierdza pełny kod.
- Dodatkowo test `D3 bez skarbca AI = 0` w `p6_wire_war_dipl_steps.rs` (patrz zarzut 3).

### Zarzut 3 (ISTOTNY: Ledger::balance / praca_of nadal błąd dla AI) — PRZYJMUJĘ, POPRAWIONE

- `Ledger::balance` (skarbiec): dla właściciela AI brak wpisu = `0.0` (pin `aiSkarbiecByOwner.get(id) ?? 0`, main.ts:34865 `ownerTreasury`). Dla gracza ludzkiego brak wpisu nadal błąd (pin `playerStateByHuman.get(id)!`).
- `Ledger::praca_of` (pula Pracy): ta sama reguła (pin `aiPracaPoolByOwner.get(id) ?? 0`, main.ts:34876). Człowiek bez wpisu = błąd.
- `Ledger::new(inp, human_ids)`: `Ledger` dostaje listę ludzkich właścicieli z `cx.human_ids`, bo sam `DiplStepsInputs` jej nie niesie. Wywołanie w `turn_war_dipl_steps.rs` (`Ledger::new(cx.inputs, cx.human_ids)`).
- Zmiana obejmuje D3 i wszystkie tury: tribute (`tick_diplomacy_payments` przez `Ledger`), handel jednorazowy Złotem/Pracą i handel cykliczny.
- Zmieniona asercja (dozwolona, pkt 1 dispatchu, wymieniona): w `p6_wire_war_dipl_steps.rs` blok "Brak skarbca platnika (AI) = jawny blad" zastąpiony blokiem parytetu: `run_turn` zwraca **Ok**, trybut 40 jest w `payments.broken` (saldo 0 < 40), brak `treasury_deltas[AI_B]`.
- Nowy test D3: `p6_wire_war_dipl_steps.rs`, brak skarbca sprzedawcy AI przy handlu cyklicznym Złotem → `Ok`.
- Asercja o braku puli Pracy (`brak Pracy` przy `praca_pool.clear()`) NIE zmieniona: dotyczy gracza ludzkiego (`buyer = HUMAN`), błąd pozostaje zgodnie z pinem.
- Doc-komentarze w `turn_war_dipl_steps.rs` (moduł i `DiplStepsInputs`) zaktualizowane do reguły parytetu.

### Zarzut 4 (DROBNY: brak testu ujemnego salda skarbca AI bez wpisu) — PRZYJMUJĘ, POPRAWIONE

- Nowy test `apply_missing_ai_treasury_entry_goes_negative_without_floor` w `p6_r7k7c_owner_pools.rs`: brak wpisu AI + delta -2.5 → zapis **-2.5** (bez podłogi, jak pin `(get ?? 0) + delta`). Test zielony.

### Zarzut 5 (INFO: zweryfikowane OK) — PRZYJĘTE, BEZ ZMIAN

Bramki i wyniki w sekcji TESTY. Brak `#[ignore]`, jedyna zmieniona asercja w `owner_pools` (wymieniona w 01-operator-r1.md) plus zmiana w `p6_wire_war_dipl_steps` (wymieniona wyżej).

### Zarzut 6 (INFO: city_resources z raportu D3 nie zapisywane do PlayableState) — ODRZUCAM jako defekt w tym temacie

To jest poza zakresem dispatchu (GOAL nie wymaga zapisu zapasów miast) i zostało opisane jako osobny temat w NIE_ZMIERZONO. Bez zmian kodu.

## TESTY (po poprawkach, commit 294e4d361)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` poza repo (w scratchpadzie sesji).

- `cargo fmt --check` (rust-port/engine): EXIT 0
- `cargo clippy --all-targets -- -D warnings`: EXIT 0
- `cargo test --lib`: 95 passed (94 + nowy test end-to-end), 0 failed
- `p6_r7k7c_owner_pools`: 15/15 (w tym nowy `apply_missing_ai_treasury_entry_goes_negative_without_floor`)
- `p6_r7k7c_wiring`: 3/3
- `p6_r7k7c_wiring_apply` (nowy, wektory pinu): 1/1, 200 wektorów bit-w-bit
- `p6_wire_war_*` i pozostałe pliki o wzorcu `p6_wire_war_*`, `playable_slice`, `smoke`: 50 targetów łącznie, wszystkie `test result: ok`, brak FAILED

Generator wektorów: `node rust-port/engine/tests/p6_r7k7c_wiring_vectors/gen-apply-vectors.mjs` → EXIT 0, `wektory: 200`.

Cargo.lock usunięty z worktree (nie commitowany). `gra/`, `origin/main`, `rust-port/parity-v2`, `WERSJE.md`, `Cargo.toml` nietknięte.

## BLOKADY (stan po obronie)

1. **Wektory D3 `tickCyclicResourceTradeDeals` (>= 150): NIE_ZMIERZONO.** Powód: wycinek pina to domknięcie zależne od wielu stanów (patrz zarzut 1). Wymaga osobnego tematu z harnessem domknięcia.
2. Brak wektorów dla gracza ludzkiego bez wpisu (pin: TypeError); pominięte świadomie, patrz zarzut 1.
3. `city_resources` z D3 nie zapisywane do `PlayableState` (zarzut 6, poza zakresem).

## NASTĘPNY KROK

Evaluator r2 + Final Control: weryfikacja wektorów apply (SHA wycinków, bit-w-bit) i testu end-to-end (mutacja). Wektory D3 jako osobny temat (orkiestrator decyduje, czy w tej rundzie czy w kolejnym temacie). Brak push, brak integracji (zgodnie z dispatchem).

DEPLOY/PUSH: NIE WYKONANO
