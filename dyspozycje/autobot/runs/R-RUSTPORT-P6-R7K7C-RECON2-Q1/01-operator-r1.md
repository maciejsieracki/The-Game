STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-RECON2-Q1
GOAL: Ponowna weryfikacja twierdzen #106 (R7K7C-WIRING) przed dispatchem wdrozeniowym. Zero zmian kodu.
ZMIANY/COMMIT: tylko dokumentacja (allowlista dispatchu). Brak zmian w rust-port/**, gra/**, testach. Baza: origin/rust-port/parity-v2 = 533d46dd3 (zgodna z dispatchem). Pin: 07d2fbd72.
TESTY: NIE_ZMIERZONO - cargo nie uruchamiane (zakaz dispatchu, dysk). Wnioski z odczytu kodu (plik:linia).
BLOKADY: brak. Punkt 2 (reprodukcja na stanie) NIE_ZMIERZONO; punkt 4 (osiagalnosc) oceniony przez grep wolajacych.
RUNDY: 1/5
NASTEPNY KROK: Dispatch wdrozeniowy R7K7C-WIRING-A (punkty 1 i 2) wg sekcji "Tematy wdrozeniowe".
DEPLOY/PUSH: NIE WYKONANO

## Tabela 5 punktow

| # | Twierdzenie | Wynik | Dowod (pin / Rust) | Wplyw na gre |
|---|---|---|---|---|
| 1a | `apply_dipl_deltas_to_state` ma wolajacego w `src/` | NIE | Jedyne wywolania: `rust-port/engine/tests/p6_r7k7c_owner_pools.rs:275,291,305,322,338,352`. Definicja: `turn_war_dipl_steps.rs:1041`. | Przyrosty skarbcow i Pracy nie sa stosowane w produkcji. |
| 1b | `advance_turn` prowadzi do D3 przez `run_dipl_steps` | TAK (sciezka istnieje), ale wynik odrzucany | `playable.rs:1105` advance_turn -> `:1127-1128` faza Diplomacy -> `:1183-1196` `run_diplomacy_war_phase` -> `run_war_turn` -> `turn_war_pipeline.rs:370` `run_dipl_steps`. W `playable.rs:1192` wynik `run_war_turn(...)` jest odrzucany (`?;` bez przypisania). | D3 liczy, a jego skutki nie trafiaja do stanu. |
| 1c | Kolejnosc D3 zgodna z pinem | TAK (na poziomie wywolan) | Pin: `applyCyclicDeliveryOutcome` `main.ts:23988`, wolania `:24134`, `:24135`, `:24157`; D6 `tickDiplomacyPayments` `:24277`. Rust: D3 w `turn_war_pipeline.rs:370`, przed tickiem relacji (komentarz `:363`). | Kolejnosc zgodna; brak efektu bez zapisu wyniku (1b). |
| 2 | Pin zapisuje zapasy miast w D3 | TAK | Pin `main.ts:24008-24012`: `cities[i].surowce = after.surowce` po `transferSurowiecIlosc`. Rust: `turn_war_dipl_steps.rs:402` (`ledger.cities = Some(result.cities)`), raport `:1019` (`city_resources`), brak zapisu do `economy.city_stock`. Jedyny zapis `city_stock` w `playable.rs:1080` to sciezka zamiany jednostki. | Rust tylko raportuje zapasy po D3. Skutek realny dopiero po wpieciu D3 (1b) i przy umowach cyklicznych. Reprodukcja na stanie: NIE_ZMIERZONO (brak cargo). |
| 3 | `barbarian_grace`: pole stanu i konsument w Rust | NIE (brak pola i konsumenta) | Pin zapis: `main.ts:22781`, `:24248` (`recordBarbarianCooperationGrace`). Pin odczyt: `main.ts:6026`, przekazany do `applyUnauthorizedBorderPenalties` (`:6029`). Rust: tylko `push` w `turn_war_dipl_steps.rs:584-588` do `report.barbarian_grace`; brak pola w `PlayableState` i brak wolajacego. Brak tez calego modulu kar za przemarsz graniczny (`grep` po `unauthorized`, `border_march`, `BorderMarchCheckContext` w `rust-port/engine/src` - puste). | Pin: grace wplywa na kary za przejscie graniczne. Rust: brak wplywu, bo nie ma ani kar, ani stanu grace. |
| 4 | Brak wpisu wlasciciela (pin `?? 0` vs Rust blad) - da sie wywolac w produkcji? | NIE (nieosiagalne w produkcji dzis) | Pin AI: `main.ts:34865-34877` (`aiSkarbiecByOwner.get(id) ?? 0`). Rust: `turn_war_dipl_steps.rs:343-348` (`praca_of`), `:353-359` (`balance`), `:1053-1063` i `:1084-1093` (`apply`). Setery `set_owner_treasury` / `set_owner_praca_pool` (`playable.rs:907,920`) nie maja wolajacych poza testami (`tests/p6_r7k7c_owner_pools.rs:221-233`). Mapy `ai_treasury_by_owner` i `praca_pool_by_owner` startuja puste. Blad przy D3 pojawia sie tylko przy umowie z wlascicielem bez wpisu, a `ActiveDeal` powstaje wylacznie przez `add_deal` (`diplomacy.rs:1737`), ktorego nie wola zadne miejsce w `rust-port` poza testami. | Dzis brak wplywu. Rekomendacja: ZOSTAWIC blad (nie wdrazac 0 dla AI). Blad glosny jest bezpieczniejszy niz ciche zero i nie zmienia dzisiejszej gry. Do rewizji, gdy powstanie producent umow i pul. |
| 5 | D6 `tick_diplomacy_payments` obejmuje tylko zloto | TAK | Pin `gra/src/game/diplomacy-economy.ts:78-124`: `treasury.getPieniadze` / `treasury.add` (tylko skarbiec), brak Pracy. Rust `turn_war_dipl_steps.rs:206-` przyjmuje `&mut dyn Treasury` (`balance`/`add`, tylko zloto). | Zgodne. Brak tematu. |

## Tematy wdrozeniowe (tylko potwierdzone punkty)

### R7K7C-WIRING-A (punkty 1 i 2 razem, bo dziela ten sam zapis do stanu)
- Zakres: po `run_war_turn` w `run_diplomacy_war_phase` zastosowac wynik D3: `apply_dipl_deltas_to_state(state, report.dipl.treasury_deltas, report.dipl.praca_deltas)` oraz zapis `report.dipl.city_resources` do `economy.city_stock`. Atomowo: przy bledzie cofnac `war` i kolejke, jak dziala rollback w `advance_turn`.
- Allowlista: `rust-port/engine/src/domain/playable.rs`, `rust-port/engine/tests/p6_r7k7c_owner_pools.rs` (lub nowy plik testowy pod `rust-port/engine/tests/`).
- Test PRZED zmiana (czerwony): umowa cykliczna gold/praca dodana przez `add_deal` w tescie; po `advance_turn` saldo skarbca i `city_stock` maja sie zmienic zgodnie z pinem. Dzis nie zmieniaja sie wcale.
- Zaleznosci: brak technicznych. Bez produkcyjnego tworzenia umow efekt w grze pozostaje zerowy; temat domyka luke parytetu, nie zmienia dzisiejszej rozgrywki.

### Punkt 3 - bez osobnego tematu
- Grace ma sens dopiero razem z portem kar za przemarsz graniczny (`applyUnauthorizedBorderPenalties`, pin `main.ts:6029`), ktorego w Rust nie ma. Zarejestrowac jako zaleznosc tego portu, nie jako R7K7C.

### Punkt 4 - bez tematu (decyzja: zostawic blad)
- Brak zmiany kodu. Ponowna ocena po wpieciu producentow pul i skarbcow AI oraz tworzenia umow w produkcji.

### Punkt 5 - bez tematu (zgodne).

## Czego NIE jest tematem
- Punkt 3 (grace): brak tematu R7K7C; zaleznosc od portu kar za przemarsz.
- Punkt 4 (brak wpisu): zostawic blad, bez zmiany kodu.
- Punkt 5 (D6 tylko zloto): zgodne z pinem, bez zmian.
- Reprodukcja punktu 2 na zywym stanie: NIE_ZMIERZONO (wymaga cargo, zakazanego dispatchem).
