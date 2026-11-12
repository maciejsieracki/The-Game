STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-POWER-SOURCES-Q1
GOAL: Zsynchronizować COMPONENT_SOURCES z faktycznymi producentami (bez nowych portów logiki); obrona na zarzuty z kontroli Evaluatora.
ZMIANY/COMMIT: SHA obrony = patrz sekcja "SHA" na końcu. Zmienione pliki (poza allowlistą tylko 2 testy, patrz Z1):
  - rust-port/engine/src/domain/brake_power_producers.rs (numery linii pinu w RustProducer armia/terytorium)
  - rust-port/engine/tests/p6_power_nozeros.rs (oczekiwana lista wyprowadzona z tabeli, nowa nazwa testu)
  - rust-port/engine/tests/p6_power_sources.rs (wektory pinu dla ludki/rekruci/kultura, asercja plik:linia, test zgodności z REST)
  - dyspozycje/autobot/runs/R-RUSTPORT-P6-POWER-SOURCES-Q1/02a-obrona.md (ten plik)
TESTY (po poprawkach, commit obrony):
  - cargo fmt --check: OK (exit 0)
  - cargo clippy --all-targets -- -D warnings: OK (exit 0)
  - cargo test --lib: 48 passed, 0 failed
  - p6_power_sources: 4 passed (było 3; nowy test rest_table_kinds_match_component_sources)
  - p6_power_rest: 9 passed
  - p6_power_nozeros: 9 passed
  - p6_power_army: 7 passed
  - p6_power_producers: 9 passed
  - git diff --check: OK
  - Logi: /tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/wf03864889-clippy2.log, wf03864889-tests2.log, wf03864889-lib2.log
BLOKADY: Brak blokad bramek. Jedna prośba do orkiestratora: zatwierdzenie jawnego rozszerzenia allowlisty o rust-port/engine/tests/p6_power_producers.rs i p6_power_nozeros.rs (Z1).
RUNDY: 2/5 (obrona r1 po Evaluatorze r1)
NASTĘPNY KROK: Ponowna kontrola Evaluatora na commicie obrony; Final Control po PASS.
DEPLOY/PUSH: NIE WYKONANO (zakaz z dispatchu: bez push, bez integracji, bez origin/main).

## Odpowiedzi na zarzuty

### Z1. Poza allowlistą: tests/p6_power_producers.rs i tests/p6_power_nozeros.rs
Status: PRZYJMUJĘ (fakt), bez zmiany zakresu.
- Zmiana była konieczna: GOAL wymaga, żeby tabela COMPONENT_SOURCES odzwierciedlała producentów. Po tej zmianie dwie stare asercje są z definicji fałszywe:
  - p6_power_producers.rs: `no_producer_keys()` == 8 kluczy (teraz 3: bitwy, ulepszenia, zdobycze); coverage producentów 4 -> 9.
  - p6_power_nozeros.rs: lista brakujących wejść (teraz tabela minus 4 pola apply_produced).
- To NIE jest osłabienie kryteriów w sensie usunięcia pokrycia: coverage w p6_power_producers została ROZSZERZONA (4 -> 9 producentów); w nozeros asercja jest wyprowadzona z tabeli. Jedyna zmiana "w dół" to lista NoProducer 8 -> 3, która jest bezpośrednim skutkiem wymaganej synchronizacji tabeli.
- Nie dodaję nic więcej do allowlisty. Proszę orkiestratora o jawne zatwierdzenie tych dwóch plików jako konieczności.
- Dowód: `git show --stat 57ed78744` (oba pliki w commicie operatora); diff testów: `git show 57ed78744 -- rust-port/engine/tests/p6_power_producers.rs`.

### Z2. p6_power_nozeros: test `open_components_without_producer_list_is_exactly_no_producer_keys` porównuje z zahardkodowaną listą 8 kluczy
Status: PRZYJMUJĘ (poprawka w tym commicie).
- Nazwa była myląca (test nie używał no_producer_keys()), lista nie była związana z tabelą.
- Poprawka: test przemianowany na `open_components_without_producer_list_is_table_minus_apply_produced_keys`. Oczekiwana lista = `COMPONENT_SOURCES` minus [ludki, rekruci, miasta, kultura] (4 pola wpisywane przez apply_produced), czyli powiązanie z tabelą. Dodatkowo zostaje jawna asercja na literalne 8 kluczy; zmiana tabeli bez zmiany tej listy wywala test w obu wariantach.
- Dowód: `cargo test --test p6_power_nozeros` -> 9 passed.

### Z3. p6_power_sources: producenci ludki/rekruci/miasta/kultura sprawdzani słabo (rekruci tylko is_finite, reszta jedno ręczne wejście, bez wektorów pinu)
Status: PRZYJMUJĘ dla ludki, rekruci, kultura; ODRZUCAM dla miasta (z uzasadnieniem).
- Poprawka: `check_legacy` używa teraz pełnych wektorów pinu z tests/p6_power_producers_vectors/vectors.json:
  - ludki -> `ludki` (40 przypadków), `ludki_for_owner` == expect (w tym NaN/Infinity);
  - rekruci -> `pobor` (60 przypadków), `rekruci_ekw_for_owner` == expect.rekrutEkw (zamiast is_finite);
  - kultura -> `kultura` (40 przypadków), `kultura_for_owner` == expect.
- Helpery manpower_from / pressure_from odtwarzają wejścia z JSON identycznie jak p6_power_producers.rs.
- miasta: ODRZUCAM dla wektora pinu. vectors.json NIE zawiera klucza miasta (klucze: _pin, _zrodla, ludki, pobor, kultura); generator tests/p6_power_producers_gen.mjs go nie emituje. Dodanie wymagałoby zmiany generatora i regeneracji wektorów, czyli poza allowlistą i poza zakresem "bez nowych portów". Zostaje test ręczny (`ownerCities.length`, trywialna funkcja). Zapisane jako NIE_ZMIERZONO względem pinu dla miasta.
- Dowód: `cargo test --test p6_power_sources` -> 4 passed; funkcja check_legacy wywołuje teraz `cases_of("ludki"|"pobor"|"kultura")`.

### Z4a. NoProducer: test sprawdza tylko prefiks "web ", nie wymaga plik:linia pinu
Status: PRZYJMUJĘ (poprawka w tym commicie).
- Dodano asercję `has_pin_file_line_ref(reason)` (funkcja z brake_power_rest, dotąd nieużywana w tym teście) w `no_producer_reasons_cite_pin_source`.
- Wszystkie 3 uzasadnienia mają odwołanie plik.ts:linia: bitwy (main.ts:2254), ulepszenia (main.ts:2643), zdobycze (main.ts:35673-35675).
- Dowód: `cargo test --test p6_power_sources` -> `no_producer_reasons_cite_pin_source` zielony.

### Z4b. Brak testu spójności COMPONENT_SOURCES z REST_COMPONENT_SOURCES (ryzyko dryfu)
Status: PRZYJMUJĘ (poprawka w tym commicie).
- Dodano `rest_table_kinds_match_component_sources`: dla każdego z 6 wpisów REST_COMPONENT_SOURCES ten sam rodzaj (RustProducer/NoProducer) w COMPONENT_SOURCES; zbiór NoProducer z REST (`rest_no_producer_keys`) == NoProducer z tabeli głównej ograniczony do kluczy REST.
- Dowód: test zielony w p6_power_sources (4 passed).

### Z5. Wymóg "żadna NoProducer nie ma producenta w kodzie" egzekwowany tylko jawną listą 3 kluczy, bez grepu
Status: ODRZUCAM (dowód z dispatchu).
- Dispatch, sekcja GOAL, dopuszcza wprost: "test, że żadna pozycja NoProducer nie ma producenta w kodzie (grep w teście lub jawna lista)". Wybrana jest jawna lista: `no_producer_entries_are_exactly_the_three_open_components` (p6_power_sources.rs) oraz `no_producer_keys_are_exactly_the_three_components_without_rust_producer` (p6_power_producers.rs).
- Uwaga, zapisana jako ryzyko (nie blokada): helper `placed_improvements_for_owner` ISTNIEJE w rust-port/engine/src/domain/turn_economy_inputs_native.rs:82 i jest używany tam (linie 167, 261). Nie jest podpięty do tabeli ani do producentów. Jeśli ktoś podepnie go do producenta bez zmiany listy NoProducer, test go nie wykryje. Kandydat na osobny temat (grep-test), poza tym tematem.

### Z6. armia i terytorium: RustProducer odwołuje się tylko do "main.ts" bez numeru linii; apply_produced ich nie wpisuje (zarzut nieblokujący)
Status: PRZYJMUJĘ częściowo (uzupełnione odwołania), reszta zgodna z dispatchem.
- Dodano numery linii pinu (sprawdzone w git show 07d2fbd72:gra/src/main.ts): armia = sumArmyMForOwner main.ts:2672; terytorium = countTerritoryHexes main.ts:6135 + statsTerritoryNodesForOwner main.ts:5657.
- Semantyka: dispatch definiuje RustProducer jako "ścieżka funkcji" (nie "wpisane automatycznie"); komentarz w brake_power_producers.rs (nagłówek modułu) już mówi, że armia/terytorium/infra/tech/religia wpisuje wołający, a nie apply_produced. Zostaje bez zmiany kodu, bo automatyczne wpisanie złamałoby produce_and_apply_fill_only_rust_producer_fields.

## Weryfikacja nieobjętych zarzutami
- Brak nowych portów logiki; zmiany ograniczone do tabeli, komentarzy i testów.
- gra/**, origin/main, WERSJE.md, Cargo.toml, Cargo.lock: nie dotykane (Cargo.lock pozostaje untracked, nie commitowany).
- Brak push, brak integracji.

## SHA
Kod operatora r1: 57ed78744. Obrona r1: patrz komunikat końcowy (SHA commitu obrony).
