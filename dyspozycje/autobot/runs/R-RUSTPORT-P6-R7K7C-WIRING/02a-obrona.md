# R-RUSTPORT-P6-R7K7C-WIRING — Obrona Operatora (runda 3, odpowiedź na zarzuty Evaluatora r2)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-WIRING
BAZA: `3169406857` (Operator r2, branch `rust-port-wip/R7K7C-WIRING-r2`)
COMMIT OBRONY: zob. SHA commitu obrony w StructuredOutput (bez push, bez integracji)
GOAL: wpięcie `apply_dipl_deltas_to_state` w `advance_turn` z parytetem pinu `07d2fbd72` i testami, które zabijają mutanty.

## Odpowiedzi na zarzuty

### Zarzut 1 — mutant przeżywa po przywróceniu starego kodu płatności: PRZYJMUJĘ (test) / ODRZUCAM (zarzut o równoważności)

- Dowód przeżycia: przywrócono pre-r2 gałąź Work z `f0eb32ab8:turn_war_dipl_steps.rs:406-413` (bez `pay_work_floored`, bez podłogi). Wynik: `p6_r7k7c`, `p6_r7k7c_d3`, `p6_r7k7c_wiring_work` — wszystkie zielone (7/7, 4/4, 3/3). Mutant przeżył.
- Przyczyna: na ścieżce produkcyjnej podłoga nie zmienia wyniku. Bramka `buyer_ok = praca_of(buyer) >= z` (`turn_war_dipl_steps.rs:545`, pin `main.ts:24155`) gwarantuje `b >= z` przed zapisem, więc `b - z >= 0` i `Math.max(0, .)` jest no-op. Dla sprzedawcy `s + z >= 0`, bo pule są zawsze podłogowane (s >= 0). Stary kod i nowy dają identyczne pule i identyczne przyrosty raportu. Mutant jest równoważny na ścieżce produkcyjnej.
- PRZYJMUJĘ część zarzutu: brakowało testu przez `advance_turn` z płatnością Praca. Dodano `tests/p6_r7k7c_wiring_work.rs` (zob. zarzut 2).
- Mutant „podłoga usunięta wewnątrz helpera” (`pay_work_floored`, `let new = value;`) jest zabity: FAIL w `podloga_po_kazdym_zapisie_a_nie_tylko_na_koncu`, `wektory_d3_praca_z_pinu_zgodne`, `brak_wpisu_platnika_to_zero_i_zapis_tworzy_wpis` (3 FAIL).
- Do decyzji FC: mutant „stary kod bez podłogi” jest równoważny na produkcji. Nie uznaję go za zabity i nie wymagam testu, który by go zabijał, bo żadne wejście produkcyjne tego nie rozróżni. Proszę FC o potwierdzenie równoważności, a nie o dopisanie testu.

### Zarzut 2 — brak scenariusza wiringu Praca + handel cykliczny; wartości ręczne: PRZYJMUJĘ (scenariusz), CZĘŚCIOWO (pochodzenie wartości)

- Dodano `rust-port/engine/tests/p6_r7k7c_wiring_work.rs`, 3 testy przez `PlayableGame::advance_turn`:
  - `praca_w_umowie_cyklicznej_przez_advance_turn` — jedna umowa Praca 30/tura, gracz płaci AI 2 (pula gracza 50): tura 1 `(20, 30, 0)`, tura 2 bramka 20 < 30, bez zmiany.
  - `kolejnosc_platnosci_praca_przez_advance_turn` — dwie umowy od tego samego płatnika (X: AI 2, Y: AI 3), kolejność X przed Y: `(20, 30, 0)`.
  - `kolejnosc_platnosci_praca_odwrocona_daje_inny_wynik` — kolejność Y przed X: `(20, 0, 30)`.
- Ograniczenie: oczekiwane wartości wyprowadzono ręcznie z formuł pinu (`main.ts:24155`, `main.ts:24015-24016`, `main.ts:34879-34882`), a nie z generatora. Wartości z generatora mają tylko wektory D3 w `p6_r7k7c_d3.rs` (220 wektorów). Nie uruchamiałem pinu na tym scenariuszu. To NIE spełnia literalnie „wartości z generatora” dla testu wiringu. FC decyduje, czy to wystarcza.

### Zarzut 3 — brak wektorów apply z sekwencją przepływów jednej tury: ODRZUCAM (wymaga akceptacji FC)

- `apply_dipl_deltas_to_state` (`turn_war_dipl_steps.rs:1063`) przyjmuje już zagregowane mapy `owner -> delta` z raportu (`treasury_deltas`, `praca_deltas`). Sekwencja płatności w jednej turze jest rozstrzygana wcześniej, w `apply_cyclic_outcome` / `pay_work_floored`. Wektor apply z sekwencją testowałby tylko agregację, a nie kolejność.
- Sekwencje tego samego właściciela w jednej turze są pokryte przez 220 wektorów D3 (generator, `d3_work.json`), przez `podloga_po_kazdym_zapisie_a_nie_tylko_na_koncu` oraz przez testy kolejności w `p6_r7k7c_wiring_work.rs`.
- Literalne wymaganie dispatchu r2 („wektory apply … obejmują SEKWENCJE przepływów”) NIE jest spełnione w `apply.json`. Proszę FC o decyzję: akceptacja pokrycia przez D3 + wiring, czy dopisanie wektorów apply.

### Zarzut 4 — mutant (c) przedefiniowany jako zamiana zapisów wewnątrz helpera: PRZYJMUJĘ (test dodany)

- Mutant (c) w sensie dispatchu: odwrócenie kolejności umów w produkcyjnej pętli `tick_cyclic_resource_trade_deals` (`for di in (0..deals.len()).rev()`, `turn_war_dipl_steps.rs:458`).
- Wynik: `kolejnosc_platnosci_praca_przez_advance_turn` FAILED (left `(20, 0, 30)`, right `(20, 30, 0)`), `kolejnosc_platnosci_praca_odwrocona_daje_inny_wynik` FAILED (odwrotnie). Mutant (c) ZABITY.
- Zastrzeżenie: kolejność FAZ w `advance_turn` względem pinu nadal nie ma testu. Nie zmierzono. Oznaczam jako NIE_ZMIERZONO dla FC.

### Zarzut 5 — saldo płatnika nie sprawdzane (informacyjnie): ODRZUCAM (raport r2 był błędny)

- Pin SPRAWDZA saldo dla Pracy w bramce: `main.ts:24155` — `buyerOk = ownerPracaPool(a.buyerOwnerId) >= zaplata` dla `zaplataTyp === 'praca'`. Zapis (`main.ts:24015-24016`) nie sprawdza ponownie, tak samo jak Rust.
- Rust ma tę samą bramkę: `turn_war_dipl_steps.rs:545` — `buyer_ok = ledger.praca_of(buyer)? >= z` dla `PaymentKind::Work`.
- Raport r2 („w kodzie go nie ma”, „pin nie sprawdza salda dla Pracy”) był BŁĘDNY. Nie ma odstępstwa od pinu. Orkiestrator: proszę NIE wpisywać odstępstwa do `REJESTR-RUST.md` i poprawić wpis, jeśli już powstał.

### Zarzut 6 — NIE_ZMIERZONO: pełny `cargo test --all-targets`, `p6_cred_hak_kolejnosc`, `p6_unit_replace_l3_state`: PRZYJMUJĘ (uruchomione)

Wyniki w sekcji „Bramki” poniżej.

## Mutacje (wynik)

| # | Mutant | Miejsce | Wynik |
|---|---|---|---|
| a | usunięcie wywołania wiringu | `playable.rs` | nie ponawiano w tej rundzie; zabity w r2 (`wiring::trzy_tury_*`) |
| b | brak wpisu = błąd | `apply_dipl_deltas_to_state` | nie ponawiano w tej rundzie; zabity w r2 (`apply::brak_wpisu_*`) |
| c | odwrócenie kolejności umów (`.rev()`) | `turn_war_dipl_steps.rs:458` | FAIL ×2 (`kolejnosc_*`) — ZABITY |
| d | podłoga usunięta w `pay_work_floored` | `turn_war_dipl_steps.rs:1042` | FAIL ×3 (`podloga_*`, `wektory_d3_*`, `brak_wpisu_platnika_*`) — ZABITY |
| d' | stary kod Work bez helpera i bez podłogi (pre-r2 `f0eb32ab8:406-413`) | `turn_war_dipl_steps.rs:407` | PRZEŻYWA wszystkie 3 targety r7k7c — RÓWNOWAŻNY na produkcji (dowód w zarzucie 1); do decyzji FC |
| e | rollback bez `economy_before` | `playable.rs` | nie ponawiano w tej rundzie; zabity w r2 (`r7k7c_rollback_tests`) |

Każdy mutant przywrócono do stanu `3169406857` (plik zgodny z commitem przed commitem obrony; `git diff` pustego pliku źródłowego).

## Bramki

- `cargo fmt --check -p civ-engine` — EXIT 0 (po `cargo fmt` tylko na nowym pliku testu).
- `cargo clippy -p civ-engine --all-targets -- -D warnings` — EXIT 0.
- `cargo test -p civ-engine --test p6_r7k7c --test p6_r7k7c_d3 --test p6_r7k7c_wiring_work --test p6_r7k7c_owner_pools` — zielone (7/7, 4/4, 3/3, 15/15).
- `cargo test -p civ-engine --all-targets --no-fail-fast` (timeout 1800 s): `518 targetow z wynikiem ok, 0 FAILED, exit 0 (log: scratchpad/alltests.log)`
- `p6_cred_hak_kolejnosc`, `p6_unit_replace_l3_state`: `uruchomione w pelnym przebiegu (Running ... p6_cred_hak_kolejnosc, p6_unit_replace_l3_state), 0 FAILED`
- `CARGO_TARGET_DIR` poza repo (scratchpad), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`.
- Dysk przed bramkami: `/` 13 GB wolne (próg 8 GB).

## Allowlista i zakres

- Dodany plik: `rust-port/engine/tests/p6_r7k7c_wiring_work.rs` (mieści się w `tests/p6_r7k7c*.rs`).
- Brak zmian w `gra/`, `renderer/`, `view-model/`, `Cargo.lock`, w innych modułach domain.
- Brak zmian w kodzie produkcyjnym w tej rundzie (wszystkie mutacje cofnięto przed commitem).

## Nierozstrzygnięte (dla FC / orkiestratora)

1. Zarzut 3: literalne wektory apply z sekwencjami — odstępstwo od dispatchu r2, wymaga akceptacji FC.
2. Zarzut 2: wartości testu wiringu wyprowadzone ręcznie z pinu, nie z generatora.
3. Mutant d' (stary kod bez podłogi): równoważny na produkcji; wymaga potwierdzenia przez FC.
4. Kolejność faz `advance_turn` względem pinu: bez testu (NIE_ZMIERZONO).
5. Zarzut 5: wpis w `REJESTR-RUST.md` o „braku sprawdzenia salda” jest błędny — poprawić.

NASTĘPNY KROK: FC (Sonnet) na commicie obrony; po FC integracja przez orkiestratora.
DEPLOY/PUSH: NIE WYKONANO
