STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-ELIMINACJA-DEALS-Q2 (Obrona Operatora r1, odpowiedzi na zarzuty Evaluatora r1)
GOAL: Odpowiedzieć na każdy zarzut Evaluatora (2f0dd5bf1) przez PRZYJMUJĘ albo ODRZUCAM, z dowodem w kodzie lub w pinie 07d2fbd72.
ZMIANY/COMMIT: brak zmian kodu w tej rundzie (kod d81d797046, raport e0fc38a99, raport Evaluatora 2f0dd5bf1; ten plik jest jedyną zmianą). Żaden zarzut nie wymagał poprawki blokującej; zarzuty 1 i 2 zostają jako notatki pokrycia testowego.
TESTY: nie uruchamiano ponownie bramek w tej rundzie (kod nie zmieniony względem d81d797046, bramki Evaluatora 2f0dd5bf1 zgłoszone jako PASS). Weryfikacja dowodów wykonana przez odczyt kodu i pinu (git show / git grep).
BLOKADY: brak
RUNDY: 1/5 (obrona Operatora r1), ostatni werdykt Evaluatora: PASS-WITH-NOTES
NASTĘPNY KROK: Final Control na d81d797046 (lub 2f0dd5bf1, kod bez zmian)
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### Zarzut 1 (umowy: kolejność stron i typy umów) — PRZYJMUJĘ CZĘŚCIOWO, ODRZUCAM ZARZUT O ZŁEJ LOGICE
- ODRZUCAM: filtr nie zależy od kolejności stron ani od typu umowy.
  - `rust-port/engine/src/domain/diplomacy.rs:1668`: `retain(|d| Some(d.parties.first) != owner && Some(d.parties.second) != owner)` sprawdza obie strony niezależnie od kolejności.
  - `CivilizationPair::new` (diplomacy.rs:1517, 1722) ustala kanoniczną kolejność stron, więc `first`/`second` są zawsze znormalizowane.
  - Pin 07d2fbd72 `gra/src/main.ts:35482`: `activeDeals = activeDeals.filter(d => !d.strony.includes(ownerId))`. Pin nie filtruje po typie umowy, więc typ nie jest warunkiem czyszczenia. Rust robi to samo.
- PRZYJMUJĘ jako lukę pokrycia: wektory mają wyłącznie `TreatyKind::Nap` i strony rosnąco. Nie rozszerzałem generatora o odwrócone strony ani inne typy w tej rundzie. Rekomendacja: osobny drobny temat (wektory z odwróconą kolejnością stron i innym typem umowy). Nie blokuje to eliminacji.

### Zarzut 2 (ForcedWarPairState z zerowymi licznikami) — PRZYJMUJĘ JAKO NOTATKĘ, Z DOWODEM BRAKU MUTACJI
- Kod `WarTurnState::clear_eliminated_owner_war_state` (war_turn_state.rs, nowa funkcja) używa wyłącznie `retain` na `pending_owners`, `cycle_owners`, `rest_until_by_owner`, `active_by_pair_key` i `bronze/iron_era_enter_turn_by_owner`. Closure dla `active_by_pair_key` tylko czyta `st.attacker_id` i `st.target_id` i nie modyfikuje `st`. Pola `captured`/`start_turn` pozostałych par nie są zapisywane.
- Test porównuje stan forced per era (p6_eliminacja.rs, asercje pending/cycle/rest/active) po każdym kroku. Pola liczników nie są przez ten test porównywane osobno. Pokrycie tego aspektu rozszerzę w osobnym temacie, nie w tej rundzie.

### Zarzut 3 (ai_peace_requests, war_weariness, brake_phase nie są czyszczone) — PRZYJMUJĘ, ZGODNE Z PINEM
- Pin `eliminateOwner` (main.ts ~35418-35482, odczyt `git show 07d2fbd72:gra/src/main.ts`) nie czyści tych struktur. Lista czyszczeń w pinie: zdobyczePowerByOwner, bronze/stone/iron forced (pending/cycle/rest/active), era-enter, regularWarCapturedByPairKey, diplomacyRelations/PairMeta/FactorLog, wiarygodność, activeDeals. Zakres Rust jest zgodny.
- Zostaje jako NIE_ZMIERZONO wpisane w nagłówku `eliminacja.rs`. Decyzja o czyszczeniu przy wpięciu do tur należy do osobnego tematu.

### Zarzut 4 (oblężenia, skarbce/pule AI, rejestry wiarygodności) — PRZYJMUJĘ, ZGODNE Z DISPATCHEM
- Dispatch (GOAL) wprost wyklucza oblężenia („Oblężenia pozostają NIE_ZMIERZONO, brak struktury w Rust”). Skarbce, pule AI i rejestry wiarygodności są poza zakresem dispatchu. Wpisane w nagłówku `eliminacja.rs` i w raporcie `01-operator-r1.md`. Bez zmian.

### Zarzut 5 (forcedWarWavesByPairKey ponad dispatch) — PRZYJMUJĘ, UZASADNIONE PINEM
- Dowód w pinie 07d2fbd72: `gra/src/main.ts:11830, 11849, 11876, 11989, 27492` oraz w pętlach eliminateOwner (~35418-35441): `forcedWarWavesByPairKey.delete(key)` przy każdym usunięciu aktywnej pary wojny wymuszonej o `attackerId`/`targetId` = wlasciciel. Czyszczenie fal jest więc wymagane przez pin, a nie dodatkiem Operatora. Pokryte mutacją M-c w ocenie Evaluatora.

## Podsumowanie
- Zarzuty blokujące: brak.
- Zmiany kodu w odpowiedzi: brak (żaden zarzut nie wskazał błędu funkcjonalnego).
- Zarzut 1 i 2: notatki pokrycia testowego, do osobnego tematu.
- Zarzuty 3, 4, 5: zgodne z pinem i dispatchem, bez zmian.
