STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1
GOAL: Runda 3 (partia P2 wg DODATKU): wejscie oblegajacej armii po kapitulacji (`siege-enter-city.ts`) i wypad obleganej armii (`siege-last-stand.ts`) 1:1 z web `a61337844`, testy N-1/N/N+1/NaN, mutanty reczne. Baza: `origin/rust-port/parity-v2` = `8f9923d73`.
BAZA: `8f9923d73` (parity-v2, zawiera `siege_starvation.rs` z partii 1). Web pin: `a61337844`.
RUNDY: 3/5 (ten sam ID). Numer pliku 03-operator-r3.md: 01 i 02 juz istnieja w galezi, nie nadpisano ich.

## Pomiar (stan po rundzie 3)
- Tabela z `P6-REPIN-OBLEZENIE-ZDOBYCZE.md` sekcja 1 pozostaje aktualna dla pozycji poza P2.
- Nowe ustalenia: `siege-enter-city.ts` (106 LOC) i `siege-last-stand.ts` (202 LOC) nie maja importow (czyste moduly, wektory bez DOM).
- NIE_ZMIERZONO nadal: status per symbol `siegeDefenders`, `siegeAi`, aneksja miasta-panstwa, wieza oblezniczna (wyłom). Nie zrobione w tej rundzie (priorytet P2).

## Zrobione
1. `rust-port/engine/src/domain/siege_enter_city.rs`: `plan_surrender_entry` = `planSurrenderEntry` (siege-enter-city.ts:51-87), `enter_city_after_surrender` = `enterCityAfterSurrender` (:89-106). Z1-Z5, limit stosu (`stackLimit`, `room` moze byc ujemny jak w JS).
2. `rust-port/engine/src/domain/siege_sortie.rs`: `plan_last_stand_sortie` (siege-last-stand.ts:117-199), `should_last_stand_sortie` (:59-62, EPS 1e-9), `can_unit_sortie` (:94-100), `is_last_turn_before_capitulation` (:47-49). Sila jednostki i wojskowosc wstrzykiwane jako closure (Z-SO-1).
3. `domain/mod.rs`: dopisek `pub mod siege_enter_city; pub mod siege_sortie;`.
4. Testy: `tests/p6_oblezenie_wejscie.rs` (15 testow), `tests/p6_oblezenie_wypad.rs` (27 testow). Oczekiwania = wyjscie driver'a Node 22.22 na `a61337844` (`--experimental-strip-types`, driver i kopia zrodel w scratchpad poza repo).
5. Dodatkowo: `P6-REPIN-OBLEZENIE-ZDOBYCZE.md` (sekcja 4, status rundy 3).

## Zmienione pliki (ta runda)
- `rust-port/engine/src/domain/siege_enter_city.rs` (nowy)
- `rust-port/engine/src/domain/siege_sortie.rs` (nowy)
- `rust-port/engine/src/domain/mod.rs` (2 linie)
- `rust-port/engine/tests/p6_oblezenie_wejscie.rs` (nowy)
- `rust-port/engine/tests/p6_oblezenie_wypad.rs` (nowy)
- `dyspozycje/rust-port/p6/P6-REPIN-OBLEZENIE-ZDOBYCZE.md` (dopisek sekcja 4)
- `dyspozycje/autobot/runs/R-RUSTPORT-REPIN-OBLEZENIE-ZDOBYCZE-Q1/03-operator-r3.md` (ten raport)
- Commit kodu: `d56ccdc4f` (pliki 1-4). Commit dokumentacji i tego raportu: podany w odpowiedzi orkiestratorowi (raport nie moze zawierac wlasnego SHA).

## TESTY (surowe wyniki)
- `cargo test --test p6_oblezenie_wejscie --test p6_oblezenie_wypad --test p6_oblezenie_glod`: glod 29 passed, wejscie 15 passed, wypad 27 passed; 0 failed; EXIT=0.
- `cargo test --lib`: 22 passed, 0 failed, EXIT=0.
- `cargo clippy --lib --test p6_oblezenie_wejscie --test p6_oblezenie_wypad --test p6_oblezenie_glod -- -D warnings`: EXIT=0.
- `rustfmt --edition 2021 --check` na 4 nowych plikach: FMT=0.
- `git diff --check`: czysto.
- Mutanty reczne (skrypt z przywracaniem plikow, zrodla zweryfikowane `cmp` po przywroceniu): 7/7 zabitych:
  A prog 8->7 (FAIL 2); B `>` -> `>=` przy limicie (FAIL 2); C flip generala (FAIL 2); D `cover >` -> `>=` (FAIL 4); E `ruch <= 0` -> `< 0` (FAIL 3); F `limit - present` -> `limit` (FAIL 4); G usuniety filtr `embarked` (FAIL 2 po dodaniu testu `embarked_stack_is_ignored_even_if_bigger`; przed nim mutant przezyl; test dodany z wektorem web `embarked_bigger_stack -> ["a1"]`).
- Pelny baseline `cargo test --no-fail-fast` (2155/0): NIE_ZMIERZONO (kilkaset binarek testowych; w tej rundzie zmierzono tylko 3 binarki siege + lib).
- `cargo-mutants` (>=85%): NIE_ZMIERZONO (nie uruchomiono; reczne mutanty jako dowod czesciowy).

## Zalozenia (do akceptacji, w naglowkach modulow)
- Z-EC-1..5 (enter-city): pola `bool` zamiast `undefined`, `oblegaCityId` = `Option<String>`, wspolrzedne `i64`, porzadek id bajtowy, `isCivilian` jako closure.
- Z-SO-1..4 (sortie): sila i wojskowosc wstrzykiwane (`siegeAi.estimateUnitCombatStrength` po stronie wolajacego), `ruchLeft` `f64` z NaN nie blokujacym jak JS, sumy od 0.0.

## BLOKADY
1. Pelny baseline 2155/0 NIE_ZMIERZONO (zakres czasowy rundy; tylko 3 binarki + lib).
2. Mutation score >=85% (cargo-mutants) NIE_ZMIERZONO.
3. Status per symbol `siegeDefenders`, `siegeAi`, aneksja, wieza oblezncza (wylom) NIE_ZMIERZONO.
4. Partie P3 (`siege_state`, `siege_forecast`), P4 (`wonder_transfer`), P5 (wylom, `BATTLE_MAX_PER_SIDE`=500, `battleReserveNotice`) niezrobione.
5. Orkiestracja `handleSiegeCapitulationPhase` / `resolveSiegeSurrender` (main.ts) — dlug, nowe ID przy P6.
6. Wpiecie `planSurrenderEntry`/`planLastStandSortie` w tik silnika NIE zrobione: moduly sa martwym kodem do integracji (jak `siege_starvation`).

## NASTEPNY KROK
Runda 4 (ten sam ID): partia P3 albo domkniecie pomiaru z pkt 3 BLOKAD (`siegeDefenders`, `siegeAi`, wonder-transfer, aneksja, wylom) przez `git show a61337844:gra/src/game/<plik>`; bramki jak wyzej; pelny baseline gdy dysk pozwoli (teraz ok. 5,6 GB wolne).

DEPLOY/PUSH: NIE WYKONANO
