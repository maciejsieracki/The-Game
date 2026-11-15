STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-R7K7C-RECON2-Q1
GOAL: Obrona operatora r1 wobec zarzutow Evaluatora (commit 41387eede, raport 01-operator-r1.md). Zero zmian kodu.
ZMIANY/COMMIT: dokumentacja: 02a-obrona.md (nowy), poprawki w dyspozycje/rust-port/p6/R-RUSTPORT-P6-R7K7C-RECON2-Q1.md. Brak zmian w rust-port/**, gra/**, testach. Cargo.lock nietkniety. SHA: patrz sekcja DEPLOY/PUSH (commit lokalny, bez push).
TESTY: NIE_ZMIERZONO - cargo nie uruchamiane (zakaz dispatchu dla tematu bez kodu). Weryfikacja: odczyt kodu w worktree (baza 41387eede = 533d46dd3 + dokumenty), odczyt pina `git show 07d2fbd72:gra/src/main.ts`, grep wolajacych w `rust-port/`.
BLOKADY: punkt 4 wymaga decyzji wlasciciela (ABC nizej). Punkt 2 (reprodukcja zapasu na stanie) nadal NIE_ZMIERZONO.
RUNDY: 1/5 (obrona)
NASTEPNY KROK: integracja orkiestratora po FC; dispatch R7K7C-WIRING-A z poprawkami z tej obrony; decyzja wlasciciela w punkcie 4.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Z1. Teza 1b przesadzona (PRZYJMUJE, poprawka opisu)
Zarzut ma racje. `run_war_turn` dostaje `WarTurnContext { war: &mut self.state.war, ... }` (`playable.rs:1188-1193`), a na koncu D3 wykonuje `*war = work;` (`turn_war_dipl_steps.rs:1022`). Zapisywane sa wiec: relacje, umowy (`diplomacy.deals`), `opaque` (w tym dobra wola), `brake_phase`. Gubione sa trzy pola raportu: `treasury_deltas` (`turn_war_dipl_steps.rs:1020`), `praca_deltas` (`:1021`) i `city_resources` (`:1019`). Wynik `run_war_turn` jest odrzucany w `playable.rs:1194` (`?;` bez przypisania). `barbarian_grace` (`:136`) jest tylko w raporcie i nigdzie nie jest zapisywany.
Skutek: stan jest polowiczny. Umowy i relacje zmieniaja sie, skarbce, pule Pracy i zapasy miast nie. Poprawny opis w tabeli: "stan wojny (relacje, umowy) zapisywany; delty skarbcow, Pracy i zapasy miast gubione; grace bez zapisu".

### Z2. Punkt 4 "nieosiagalne w produkcji" (PRZYJMUJE w czesci, wniosek zmieniony na NIE_ZMIERZONO + ABC)
Zarzut ma racje, ze sam brak wolajacych nie dowodzi niedosiegalnosci. Stwierdzone w kodzie:
- `PlayableState` i `PlayableReplaceEconomy` derywuja `Deserialize`; `ai_treasury_by_owner` i `praca_pool_by_owner` sa `#[serde(default)]` (`playable.rs:444`, `:448`); `DiplomacyState.deals` jest `pub` i `Deserialize` (`diplomacy.rs:1656`), a `WarTurnState.diplomacy` jest w stanie wojny (`war_turn_state.rs:132`).
- Brak w `src/` jakiegokolwiek `serde_json::from_str::<PlayableState>` i jakiegokolwiek wolajacego `set_owner_treasury`/`set_owner_praca_pool` poza testami (`playable.rs:907,920`).
- `load_save_snapshot` (`zapis_loader.rs:43`) ma wolajacych tylko w `tests/` (`p6_zapis_*`). Nie znaleziono w `src/` funkcji `replace_economy` (nazwa z zarzutu nie istnieje w tym commicie).
- Mostek `bridge.rs` niesie `EngineState = PlayableState` w `BridgeResult`/`BridgeEvent` (Deserialize), ale nie zbadano, czy ktorykolwiek front-end deserializuje stan z zewnatrz i wstawia umowy bez pul. NIE_ZMIERZONO.
Wniosek poprawiony: "w `src/` nie ma producenta, ktory wstawia umowe albo brakujacy wpis pul; osiagalnosc przez deserializacje stanu z zewnatrz NIE_ZMIERZONO".

Decyzja (pytanie ABC do wlasciciela, odstepstwo od pina -> regula 9):
Co jest zablokowane: pin dla AI czyta brak wpisu skarbca jako 0 (`main.ts:34865`: `aiSkarbiecByOwner.get(ownerId) ?? 0`). Rust przy D3 zwraca `WarTurnError::DiplStep` ("brak producenta skarbca", `turn_war_dipl_steps.rs:1053-1063`) i cofa cala faze (`playable.rs:1129-1131`). Dzis przypadek nie wystepuje w produkcji (sprawdzone wyzej), wiec gra nie zmienia sie. Odpowiedz zmienia tylko to, co sie stanie, gdy umowa z AI bez wpisu pojawi sie w przyszlosci.
- A. Zostawic blad (glosny). Plusy: nie ma cichego zera, brak wpisu zawsze wskazuje prawdziwy blad producenta; blad cofa tury, wiec dane nie sa zepsute. Minusy: odstepstwo od pina (pin dziala dalej z zerem); przy pojawieniu sie umowy bez producenta cala tura konczy sie bledem.
- B. Wdrozyc 0 dla AI (jak pin). Plusy: parytet 1:1 z pinem, brak przerwania tury. Minusy: cicha utrata informacji, zerowy skarbiec AI moze zafalszowac wynik umowy bez sygnalu.
- C. Wdrozyc 0 dla AI i zapisac ostrzezenie w raporcie. Plusy: parytet liczbowy i widocznosc problemu. Minusy: wiecej kodu i testow; ostrzezenie nie jest blokada.
REKOMENDACJA: A (blad). Powod: dzis nie zmienia gry, a zamienia ewentualny cichy blad w widoczny; odstepstwo od pina zapisujemy jako swiadome w REJESTR-RUST.md. Do decyzji wlasciciela (DECISION_REQUIRED).

### Z3. Rollback w `advance_turn` pomija ekonomie (PRZYJMUJE, poprawka w zakresie WIRING-A)
Zarzut ma racje. Migawka w `advance_turn` (`playable.rs:1112-1117`) obejmuje `phase_queue`, `war`, `koniec_gry` i flage. Ekonomii (`state.economy`) nie ma.
Realna sciezka cofniecia po zapisie: `phases.len() != PHASE_COUNT` (`playable.rs:1157-1163`) zwraca `TurnPhaseQueueIncomplete` po petli, czyli po fazie Diplomacy. Blad `run_diplomacy_war_phase` (`playable.rs:1128-1131`) przed zapisem ekonomii nie zostawia delt, o ile apply jest po `run_war_turn` i atomowy. Wniosek: w WIRING-A rollback musi tez migawkowac `self.state.economy` (typ ma `Clone`, `playable.rs:430`) i przywracac go w obu sciezkach bledu (`:1129-1131` i `:1158-1163`). Bez tego ponowne wykonanie tury naliczy delty dwa razy.

### Z4. Test "czerwony" bez zrodla wartosci; wektory >=150 (PRZYJMUJE, poprawka w zakresie WIRING-A)
Zarzut ma racje. Oczekiwane wartosci NIE moga byc reczne. Dispatch WIRING-A musi wymagac jednego z dwoch:
- wektory wygenerowane z pina (wykonanie `gra/src` przy `07d2fbd72` w node, skrypt generatora w allowliscie), z plikiem wejsciowym i SHA pina w naglowku; albo
- jawna zaleznosc od osobnego tematu generatora wektorow D3 (ktory musi byc najpierw zrobiony), bez tworzenia wartosci w tescie.
Stan: D3 w R7K7C-Q1 pozostaje NIE_ZMIERZONO (cargo zakazane), wiec temat WIRING-A nie moze startowac z wartosciami recznymi. Warunek #106 (>=150 wektorow) pozostaje do spelnienia w WIRING-A.

### Z5. Semantyka `city_resources` i mapowanie miast (PRZYJMUJE, opis uzupelniony)
Zarzut ma racje, opis byl niepelny.
- Rust: `report.city_resources = ledger.cities.clone().filter(|_| !report.cyclic.is_empty())` (`turn_war_dipl_steps.rs:1019`). Czyli `None` gdy brak cyklicznych wynikow; przy jakimkolwiek wyniku zwraca CALY zbior miast z ledgera, nie tylko zmienione.
- Pin: zapis tylko przy zmianie `after.surowce !== before.surowce` (`main.ts:24005-24009`: porownanie `before`/`after`, warunek w `:24007`, zapis `cities[i]!.surowce = after.surowce` w `:24008`).
- Mapowanie: w `turn_war_dipl_steps.rs:402` `ledger.cities = Some(result.cities)` (lista miast), a `economy.city_stock` jest `BTreeMap<u64, StockRecord>` (`playable.rs:~433`). Mapowanie indeks ledgera -> id miasta -> klucz `city_stock` nie jest opisane w raporcie i trzeba je zbadac w WIRING-A.
Wymog do WIRING-A: zapis tylko zmienionych miast albo pelny zapis z dowodem idempotencji (ledger startuje z tego samego stanu); mapowanie id miasta na klucz `city_stock` opisane i przetestowane.

### Z6. Nazwa modelu w commicie 41387eede (PRZYJMUJE, stan faktyczny)
Commit 41387eede zawiera linie `Co-Authored-By: Claude Haiku 5.5` wbrew dispatchowi ("bez nazwy modelu w tresci"). Nie przepisuje historii tu (commit lezy na wip, integracja to rozstrzygnie). Commit tej obrony nie zawiera nazwy modelu w tresci, konczy sie linia `Claude-Session`. Uwaga: systemowa instrukcja atrybucji zalecala dopisywac linie Co-Authored-By; konflikt z dispatchem zglaszam orkiestratorowi do decyzji.

### Z7. Numery linii (PRZYJMUJE, poprawione w raporcie)
- `playable.rs:1194` (wywolanie `run_war_turn`), nie 1192. Potwierdzone.
- Pin: definicja `applyCyclicDeliveryOutcome` `main.ts:23988`; zapis zapasow miast `main.ts:24005-24009` (poprzednio 24008-24012); wolania okA/okB `:24134-24135`; wolanie pojedyncze `:24157`.
- `turn_war_dipl_steps.rs:1019` (`city_resources`), nie 1018.
- Pin `barbarian_grace`: odczyt `main.ts:6026-6029` potwierdzony.

### Z8. Bramki cargo NIE_ZMIERZONO (PRZYJMUJE jako stan faktyczny)
Zarzut dotyczy braku bramek. Dispatch wprost zakazuje cargo dla tematu bez kodu (zakaz dyskowy i zakres dokumentacyjny). Zadnej zmiany kodu, wiec nie ma czego bramkowac. Rejestr: NIE_ZMIERZONO. Bramki beda wymagane w WIRING-A.

## Korekty tabeli 5 punktow (po obronie)
| # | Wynik po obronie | Zmiana wzgledem 01-operator-r1 |
|---|---|---|
| 1a | NIE (bez zmian) | - |
| 1b | TAK (sciezka istnieje), wynik zapisuje tylko war; treasury/praca/city_resources gubione | opis poprawiony (Z1) |
| 1c | TAK (bez zmian) | - |
| 2 | TAK (pin zapisuje; Rust tylko raportuje); reprodukcja NIE_ZMIERZONO | linie pina poprawione (Z7), mapowanie do opisu WIRING-A (Z5) |
| 3 | NIE (bez zmian) | - |
| 4 | NIE_ZMIERZONO co do osiagalnosci przez deserializacje; brak producenta w src; DECISION_REQUIRED (ABC, rekomendacja A) | "nieosiagalne" wycofane (Z2) |
| 5 | TAK (bez zmian) | - |

## Poprawki zakresu WIRING-A (dla dispatchu wdrozeniowego)
1. Zapis D3 do stanu: skarbce (`economy.treasury` + `ai_treasury_by_owner`), pule Pracy (`praca_pool_by_owner`), zapasy miast (`city_stock`) z mapowaniem id miasta (Z5).
2. Rollback w `advance_turn` obejmuje `economy` w obu sciezkach bledu (Z3).
3. Oczekiwane wartosci testow z pina (generator) albo jawna zaleznosc (Z4). Bez wartosci recznych.
4. Decyzja w punkcie 4 (ABC, Z2) przed wdrozeniem; do tego czasu blad zostaje.

## ABC do wlasciciela (punkt 4)
Opisane w Z2: A (blad, rekomendowany) / B (0 dla AI jak w pinie) / C (0 z ostrzezeniem w raporcie).
