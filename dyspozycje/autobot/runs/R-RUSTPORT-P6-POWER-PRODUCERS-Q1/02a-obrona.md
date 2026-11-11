STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-PRODUCERS-Q1
GOAL: producenci skladnikow computeObjectivePower z danych stanu Rust, wektory z pinu 07d2fbd72 przez wyciecie i wykonanie funkcji weba.
ZMIANY/COMMIT: obrona r2 (Operator, Haiku 5.5). Baza r1: 627ac012f. Commit obrony: patrz `git log -1` na galezi rust-port-wip/P6-POWER-PRODUCERS-Q1-operator-r1 (lokalnie, bez push).
RUNDY: obrona 1 (Operator), runda FC 1/5 nieprzerwana.

## Odpowiedzi na zarzuty

Bramki (fmt, clippy, lib, p6_power_producers): ACK, potwierdzone ponownie po zmianach (sekcja TESTY).

1. Zakres 4 z 12 skladnikow; slice'y zamiast PlayableState/WarTurnState: PRZYJMUJEM (bez zmiany kodu).
   Rozbieznosc z GOAL jest jawna. Budowa slice'ow ManpowerCity/PressureCity ze stanu PlayableState nalezy do W8 r3 (modul producentow nie ma typow stanu, a allowlista nie obejmuje kodu z recruitment/order_effects). Zostaje jako BLOKADA dla W8 r3.

2. Brak semantycznej weryfikacji armii i terytorium: CZESCIOWO ODRZUCAM kandydata, PRZYJMUJEM brak producenta.
   - Armia: `army_m` z `domain/diplomacy_truce_flow.rs:312` to `self.army_m.get(&owner)` w implementacji trait (pole mapy wstrzykiwane przez test/wolajacego), NIE producent z stanu. Web `sumArmyMForOwner` sumuje `armyFieldPower(unitDefFor(u))`, a `armyFieldPower` nie jest portowane (`domain/unit_power.rs:10`). Brak producenta jest uzasadniony zrodlem, nie zaniedbaniem.
   - Terytorium: kandydat `domain/territory.rs:475 collect_territory_hex_keys_by_owner` zidentyfikowany, ale web `countTerritoryHexes(statsTerritoryNodesForOwner)` uzywa `foundingNodesForOwner(cityNodesForOwner, fortNodes)` i `cityTerritoryRadius` (pin main.ts:5657, 6135). Semantyka NIE zostala zweryfikowana w tej rundzie. Oznaczone NIE_ZMIERZONO w `COMPONENT_SOURCES` (uzasadnienie zaktualizowane o kandydata).

3. Skladnik miasta bez wektora z pinu: PRZYJMUJEM (bez zmiany kodu).
   `ownerCities.length` jest wyrazeniem inline w `buildObjectivePowerForOwner`, bez funkcji do wyciecia. Pokrycie: test `miasta_counts_only_owner_cities`. Wektor z pinu nie jest mozliwy bez atrapy, co wprost zabrania zasada wektorow.

4. Brak testu krzyzowego ludki_for_owner vs pobor.sumaLudkow: PRZYJMUJEM, NAPRAWIONE.
   Dodano `ludki_equal_pobor_suma_ludkow_on_same_inputs` (`tests/p6_power_producers.rs`): na tych samych wejsciach z wektorow `pobor` sprawdza `ludki_for_owner == pobor.suma_ludkow == pin.sumaLudkow`.

5. Brak NaN/Infinity w wektorach: PRZYJMUJEM, NAPRAWIONE.
   - `p6_power_producers_gen.mjs`: POPS, MANPOWERS i CULTURES rozszerzone o NaN, Infinity, -Infinity. Nieskonczonosci zapisywane jako napisy "NaN"/"Infinity"/"-Infinity" (JSON ich nie ma). Oczekiwania nadal z wykonania funkcji weba z pinu 07d2fbd72 (`git archive`, poza repo).
   - `vectors.json` przegenerowany (wejscia LCG, ziarno bez zmian). Liczba napisow niefinite w pliku: 162.
   - Testy: `f()` parsuje napisy, nowy `assert_same` porownuje NaN przez `is_nan()`.

6. Baza: ODRZUCAM zarzut o niezgodnosci z wrapperem, PRZYJMUJEM notatke o integracji.
   - Weryfikacja: `git merge-base --is-ancestor f207ea6b1 a91b3b766` = TAK; `... f207ea6b1 origin/rust-port/parity-v2` = TAK. Wymog wrappera "f207ea6b1 lub nowszy" jest spelniony, a dispatch wskazuje baze a91b3b766.
   - `627ac012f` NIE jest przodkiem `origin/rust-port/parity-v2` (eba816b4e). To oczekiwany stan: commit jest lokalny, a parity-v2 nie zawiera BRAKE-INPUTS r2.
   - Notatka dla integracji (orkiestrator): potrzebny merge albo rebase na parity-v2 przed FC integracyjnym, z kontrola `git merge-base --is-ancestor <kod operatora> <SHA integracji>`.

7. Osiem skladnikow bez producenta, ryzyko cichych zer w W8 r3: PRZYJMUJEM CZESCIOWO.
   - Dodano `no_producer_keys()` (`domain/brake_power_producers.rs`) i test `no_producer_keys_are_exactly_the_eight_open_components`, ktory wiaze liste 8 kluczy (armia, bitwy, terytorium, infra, tech, ulepszenia, religia, zdobycze). Brak luki w tabeli jest teraz sprawdzany testem, nie tylko komentarzem.
   - Wymuszenie braku domyslnych zer w `ObjectivePowerRaw` wymaga zmiany `domain/brake_power.rs`, poza allowlista. Zostaje jako BLOKADA dla W8 r3.

## Pliki zmienione w tej obronie
- rust-port/engine/src/domain/brake_power_producers.rs (no_producer_keys, reasony armia/terytorium)
- rust-port/engine/tests/p6_power_producers.rs (assert_same, cross-test, test 8 kluczy)
- rust-port/engine/tests/p6_power_producers_gen.mjs (NaN/Infinity)
- rust-port/engine/tests/p6_power_producers_vectors/vectors.json (przegenerowany)
- dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-PRODUCERS-Q1/02a-obrona.md (ten plik)

## TESTY
Zob. wynik koncowy w raporcie Operatora (sekcja TESTY w odpowiedzi StructuredOutput).

## BLOKADY
1. W8 r3: budowa slice'ow z PlayableState/WarTurnState (zarzut 1).
2. Semantyka armii i terytorium NIE_ZMIERZONO (zarzut 2); armyFieldPower nieportowane.
3. Brak wektora z pinu dla skladnika miasta (zarzut 3).
4. Wymuszenie braku domyslnych zer w ObjectivePowerRaw poza allowlista (zarzut 7).
5. Integracja: merge/rebase na rust-port/parity-v2 (zarzut 6).

NASTEPNY KROK: Final Control (Sonnet) na commicie obrony, ponowne bramki.
DEPLOY/PUSH: NIE WYKONANO (commit lokalny, bez push i integracji).
