# 02a — Obrona Operatora (runda 1, odpowiedź na zarzuty Evaluatora)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-BITWY-ZDOBYCZE-Q1
GOAL: obrona zarzutów Evaluatora; poprawki wyłącznie w allowliście (war_turn_state.rs, p6_power_battle_acc.rs).
BAZA: dfabf0019 (kod operatora r1), poprawki na tej bazie.
SHA: kod + poprawki obrony — patrz commit „obrona r1” (SHA podany w odpowiedzi orkiestratora); raport 01-operator-r1.md bez zmian.

## Odpowiedzi na zarzuty

1. **Bramki odtworzone, EXIT 0 — PRZYJMUJĘ korektę liczby.**
   Liczba „265 passed” w raporcie Operatora była błędna. Statyczne zliczenie `#[test]` w 29 plikach
   (`p6_power_*`, `p6_wire_war_*`, `p6_credibility`) na dfabf0019 daje 259, co zgadza się z wynikiem Evaluatora.
   Po poprawkach obrony te same cele dają 262 passed, 0 failed (259 + 3 nowe testy w `p6_power_battle_acc`).
   Lib: 88 passed. `cargo fmt --check` OK, `cargo clippy --all-targets -- -D warnings` OK (EXIT 0).
   Pełny `cargo test` NIE_ZMIERZONO (runda integracyjna). Wolne miejsce na dysku w chwili obrony: ok. 4,9 GB
   (poniżej progu 8 GB z dispatchu); build wykonano w katalogu tymczasowym poza repo, usuwany po bramkach.

2. **Komentarz `impl Eq` — PRZYJMUJĘ.**
   Komentarz był nieaktualny. Zaktualizowany: wyjaśnia źródła f64 i to, że `+Infinity` może wejść przez
   zdobycie z nieskończoną mocą ofiary, a NaN nie wchodzi (`record_battle_win` zeruje niefinityczne pole,
   `record_capture_power_gain` przepuszcza tylko `gain > 0`). `Infinity == Infinity` jest prawdziwe, więc
   `Eq` pozostaje poprawne. Dowód: test `infinite_capture_gain_is_kept_in_state_and_written_as_null`
   sprawdza `w == w.clone()` dla stanu z `+Infinity`.

3. **Round-trip meta dla Infinity — PRZYJMUJĘ.**
   Zachowanie: `num(+Infinity)` zapisuje `null` (serde_json), a odczyt pomija parę bez liczby, czyli wkład 0.
   Dodany komentarz w `power_acc_of` oraz dwa testy:
   `meta_load_drops_null_pair_from_infinity_as_zero_contribution` i
   `infinite_capture_gain_is_kept_in_state_and_written_as_null`.
   Znany brzeg (udokumentowany w komentarzu): duplikat, w którym drugi wpis to `null`, po stronie webu
   zostaje `null`, a w Rust zostaje poprzednia wartość. Wejście to nie wystąpi z zapisu webowego.

4. **Duplikaty kluczy w meta — CZĘŚCIOWO: zapis ODRZUCAM, odczyt PRZYJMUJĘ.**
   - Zapis: web zapisuje `Array.from(battlePowerPtsByOwner.entries())` (`gra/src/main.ts:7704` w pinie 07d2fbd72),
     a `Map` ma unikalne klucze, więc duplikat z zapisu webowego nie powstaje.
   - Odczyt: web ładuje przez `for (const [oid, n] of savedPts) battlePowerPtsByOwner.set(oid, n)`
     (`gra/src/main.ts`, pin 07d2fbd72, okolice wiersza 10184), czyli ostatni wpis wygrywa.
     Stary kod Rust brał pierwszy wpis. Zmieniono na `power_acc_of` z semantyką `Map.set`
     (pozycja pierwsza, wartość ostatnia). Test: `meta_load_duplicate_keys_follow_web_map_set`
     (`[[1,5],[2,4],[1,3]]` → `[(1,3),(2,4)]`).

5. **Wektory nie pokrywają kolejności wstawiania w meta dla sekwencji mieszanych — ODRZUCAM (z uzasadnieniem).**
   Wektory z pinu mierzą wartość składnika mocy per właściciel (`acc_get`). Wartość dla klucza zależy wyłącznie
   od kolejności dodawań do tego samego klucza, a sekwencje zdarzeń z wektorów to właśnie te dodawania.
   Kolejność wstawiania między różnymi kluczami nie wpływa na `power_raw_for_owner`, bo odczyt idzie po kluczu.
   Kolejność w meta jest zapisem serializacji, a nie wartością mocy. Pokrywa ją test
   `accumulators_roundtrip_through_meta_with_web_keys` (w tym pliku). Nie rozszerzam generatora wektorów,
   bo dispatch wymaga wektorów wartości, a nie wektorów serializacji.

6. **Informacja: producenci nie są wpięci w kod bitwy/zdobywania/eliminacji — PRZYJMUJĘ.**
   Dodany znacznik „STAN WDROŻENIA” przy `POWER_ACC_META_KEYS` w `war_turn_state.rs`: akumulatory w produkcji
   pozostają puste, a wkład mocy wynosi 0, dopóki osobny temat nie wywoła `record_battle_win`,
   `record_capture_power_gain` i `clear_power_accumulators_for_owner`. Zgodne z dispatchem (wołający = osobne tematy).

7. **Lokalizacja raportu Evaluatora — INFORMACJA, bez zmian w kodzie.**
   Raport Evaluatora nie leży w tej gałęzi. Nie weryfikowałem jego commita 804bee75d (poza zakresem obrony).

## Zmiany w tej rundzie (allowlista)

- `rust-port/engine/src/domain/war_turn_state.rs`: komentarz `impl Eq`; funkcja `power_acc_of` (odczyt z semantyką
  `Map.set`) dla obu akumulatorów; znacznik STAN WDROŻENIA; komentarz o znanym brzegu duplikatu z `null`.
- `rust-port/engine/tests/p6_power_battle_acc.rs`: trzy nowe testy (sekcja zarzutów 2–4).
- `cargo fmt` objął tylko te dwa pliki (git status).

## Testy po obronie

- `cargo fmt --check` → EXIT 0
- `cargo clippy --all-targets -- -D warnings` → EXIT 0
- `cargo test --lib` → 88 passed, 0 failed
- `cargo test --test p6_power_battle_acc` → 11 passed, 0 failed (8 wcześniej + 3 nowe)
- `p6_power_*` + `p6_wire_war_*` + `p6_credibility` → 262 passed, 0 failed, 0 ignored (259 wcześniej + 3)
- Pełny `cargo test` NIE_ZMIERZONO (runda integracyjna).

## Blokady

Brak blokad zakresu. Poza zakresem (osobne tematy): wpięcie producentów (bitwa, zdobywanie, eliminacja);
`ulepszenia_terenu` nadal ExplicitZero (poza allowlistą); `wygrane_bitwy = Provided(0)` zgodnie z literałem webu.

RUNDY: 1/5 (obrona r1)
NASTĘPNY KROK: Evaluator r2 weryfikuje poprawki (ta sama baza dfabf0019 + commit obrony), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO (brak push, brak integracji).
