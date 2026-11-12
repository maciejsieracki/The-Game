STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-UNIT-REPLACE-L3-Q1
GOAL: etap 1 wiringu UNIT-REPLACE (dług L-3): adaptery + testy; komenda gracza; punkt AI.
ZMIANY/COMMIT: obrona r1 = 9dd243acf (na bazie kodu 731ef1865; raport operatora 01 = c9b15d329).
  Pliki: rust-port/engine/src/domain/unit_replace_wiring.rs, src/domain/playable.rs, tests/p6_unit_replace_l3.rs.
  Cargo.lock: untracked, nie commitowany.

## Odpowiedzi na zarzuty

1. Kryterium 2 (komenda gracza) - PRZYJMUJE jako blokade. Nie dodaje stanu poza allowlista.
   PlayableState nadal nie ma skarbca, puli miasta, typow jednostek ani HP/flagi uzycia. Wymagana decyzja orkiestratora:
   rozszerzenie stanu w osobnym temacie albo zmiana zakresu.

2. Kryterium 3 (AI w fazie Ai) - PRZYJMUJE. Dodany jawny punkt podpiecia 9dd243acf w playable.rs,
   advance_turn, przy przejsciu fazy TurnPhase::Ai (komentarz, bez wywolania).
   Uczciwie: to marker w kodzie, a nie wiring. Wywolanie ai_replace_* nie zostalo podpiete.

3. Wektory tylko czesciowo przez adapter - PRZYJMUJE. Dodane testy w unit_replace_wiring.rs (cfg(test)):
   - execute: wszystkie 21 wektorow przez WiredReplaceDeps. Dekorator WithStockRecord podstawia rekord
     kosztu z wektora, bo adapter wylicza koszt z UnitStockCostSource, a wektory podaja rekord wprost.
     Sprawdzane: wynik, powod, detail, money, stock, treasuryAfter, zuzycie puli (paid), pola jednostki.
   - afford: 72 z 84 wektorow (pool != null) przez adapter; wynik == canAfford.
     12 wektorow z pool = null pominietych: adapter zawsze ma miasto (ReplaceCity), wiec null nie ma odpowiednika.
   - Zakres NIE pokryty adapterem: translacja UnitStockCostSource -> StockRecord (unit_stock_cost) dla
     wejsc zrodla. Pokrywa ja wektor kosztu (80), ktory wywoluje te sama funkcje.
   - Wektory execute: canPay z wektora nie zawsze da sie odtworzyc przez pule (np. canPay=false przy stock={}).
     Nie zmienia to wyniku, bo pusty koszt nie wymaga zapasu. Zaznaczam jako ograniczenie.

4. Koszt z money null/"NaN" - PRZYJMUJE czesciowo. Test kosztu asertuje money z kazdego wektora (expected.money),
   wiec nie jest to tylko heurystyka. Dodatkowo: tekst inny niz "NaN" teraz powoduje panic.
   Odrzucenia money/stock na wektorach sa teraz sprawdzane przez adapter (sekcja 3, execute i afford z realnym
   skarbcem i pula), a nie tylko przez test kosztu z 1e9.

5. Baza 95bbf99d7 - PRZYJMUJE fakt, ODRZUCAM wniosek, ze blokada operatora byla bledem.
   Pomiar (tylko ancestry; rebase NIE wykonany):
   - origin/rust-port/parity-v2 tip = 258afaf8f w chwili obrony (zarzut podawal 94cba6667; tip sie zmienil).
   - git merge-base --is-ancestor 95bbf99d7 origin/rust-port/parity-v2 -> NIE (exit 1).
   - git merge-base --is-ancestor f207ea6b1 origin/rust-port/parity-v2 -> TAK.
   - git merge-base --is-ancestor f207ea6b1 95bbf99d7 -> TAK.
   Czyli 95bbf99d7 jest potomkiem f207ea6b1, ale NIE lezy na parity-v2. Integracja na parity-v2 wymaga
   cherry-pick kodu operatora (731ef1865 + 9dd243acf) i ponownych bramek. Tego nie wykonano: decyzja
   bazy nalezy do orkiestratora.

6. Brak testu pay_stock dla wartosci niepoprawnych - PRZYJMUJE. Dodany test
   pay_stock_pomija_wartosci_niepoprawne: NaN, 0, -2 i +inf nie zmieniaja puli ani nie tworza wpisu.

## Bramki (po 9dd243acf)
- cargo fmt --check: EXIT 0
- cargo clippy --all-targets -- -D warnings: EXIT 0
- cargo test --lib: 53 passed (50 wczesniej + 3 nowe)
- cargo test --lib unit_replace_wiring: 3 passed
- p6_unit_replace_l3: 8 passed (liczba testow bez zmian; zmieniona tylko galaz "NaN")
- p6_repin_unit_replace_pure: 7 passed
- p6_repin_unit_replace_execute: 1 passed
- p6_wire_war_pipeline: 7 passed
Zgodnosc z allowlista: tak. Bez #[ignore], bez zmian istniejacych asercji.
CARGO_TARGET_DIR poza katalogiem repo; usuwany po bramkach.

TESTY: jak wyzej; wszystkie zielone po 9dd243acf.
BLOKADY: kryterium 2 (komenda gracza, brak stanu) - wymaga decyzji orkiestratora;
  kryterium 3 - tylko marker w advance_turn, bez wywolania ai_replace_*;
  baza integracji - 95bbf99d7 nie jest na parity-v2, wymaga cherry-pick i ponownych bramek.
RUNDY: 2/5 (obrona po Evaluatorze r1), ostatni werdykt: FAIL r1, decyzja wymagana: TAK (zakres kryterium 2 i baza).
NASTEPNY KROK: orkiestrator rozstrzyga (a) kryterium 2 (osobny temat na rozszerzenie PlayableState)
  i (b) baze integracji (cherry-pick na parity-v2 + bramki); potem Evaluator r2.
DEPLOY/PUSH: NIE WYKONANO
