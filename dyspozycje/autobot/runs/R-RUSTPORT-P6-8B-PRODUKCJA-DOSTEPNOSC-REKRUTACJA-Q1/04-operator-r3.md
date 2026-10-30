STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1 (pozostaje OTWARTY; P1b-c2 i P2 niewykonane)
GOAL: Odpowiedz Operatora (runda 3) na zarzuty weryfikatora do partii P1b-c1. Odtworzenie stanu z `fddc1ef49` (commit Operatora r2). Każdy zarzut: PRZYJMUJĘ (poprawka + dowód + commit) albo ODRZUCAM (dowód).
ZMIANY/COMMIT: commit r3 (SHA w odpowiedzi do orkiestratora; baza `fddc1ef49`). Allowlista: `rust-port/engine/src/domain/production_units.rs` (tylko komentarz), `rust-port/engine/tests/p6_8b_p1b_vectors.rs` (+1 test, import), `rust-port/engine/tests/p6_8b_vectors/p1b.json` (regeneracja), `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md`, `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/` (gen-p6-8b-p1b-vectors.mjs, 02-operator-pomiary-r2.md bez zmian, dowody/pomiar-mutacje-p1b-c1-r2.txt, dowody/pomiar-mutacje-p1b-c1-r3.txt, 04-operator-r3.md). Zero zmian w gra/, renderer, src-tauri, Cargo.toml, WERSJE.md. Push: nie.

## Odpowiedzi na zarzuty

1. PRZYJMUJĘ (poprawka + dowód). Komentarz w `production_units.rs` (sekcja P1b-c1) zmieniony z 1815–1825 na 1980–1982 (populationCostOf) i 1977 (UNIT_POPULATION_COST). Nagłówek `gen-p6-8b-p1b-vectors.mjs` (linia 3) i pole `zrodlo` w generatorze poprawione tak samo; `p1b.json` wygenerowany ponownie z pinu 91dc998a (`git archive 91dc998a gra`, Node v22.22.0). Porównanie kluczy JSON: pin, unitPopulationCost, stockShortfall, stockShortfallProto, populationCost bez zmian; zmieniły się tylko `zrodlo` (nowy tekst) i nowe pole `stripDiacriticsChanged` (zarzut 5). Dokument tematu zaktualizowany.

2. PRZYJMUJĘ (poprawka + dowód). Ponowny pomiar M1 (zwrot None z unitStockShortfallLabel): 4 passed, 3 failed (text_is_exact, matches_web_vectors, thresholds_and_special_values). Błąd "4 testy FAILED" był w pliku `pomiar-mutacje-p1b-c1-r2.txt` i jest skorygowany w tym pliku oraz w `dowody/pomiar-mutacje-p1b-c1-r3.txt`. Źródło przywrócone i porównane bajt w bajt.

3. PRZYJMUJĘ (opis ograniczenia). M2 i M4 przeżywają tylko przy UNIT_POPULATION_COST = 0. Ryzyko zaakceptowane i opisane jako ograniczenie wektorów w dokumencie tematu (sekcja "Ograniczenia wektorów"): wektory `populationCost` nie wykryją błędnego powiązania gałęzi Jednostka ze stałą, jeśli wartość webu stanie się niezerowa; zabezpiecza to tylko M6 i test pinu wartości.

4. ZAŁOŻENIE (rozstrzygnięcie w dokumencie, nie w raporcie weryfikatora). Licznik rund tematu = nagłówek dispatchu `RUNDA: 3/5` (licznik orkiestratora, który prowadzi temat). Liczniki "1/5" (Operator r1) i "2/5" (weryfikator r2) to liczniki wewnętrzne runów, nie rundy tematu. Zapisane w dokumencie tematu. Jeśli orkiestrator przyjmie inną numerację, poprawia ją jednym wpisem.

5. PRZYJMUJĘ (poprawka testu zamiast przepisania tablicy). Dodany test `strip_diacritics_bmp_matches_web` sprawdza CAŁĄ płaszczyznę BMP (bez surogatów) względem webu. Wynik pomiaru: rozbieżności tylko w dwóch klasach, obie przypięte liczbami stałymi w teście: (a) 11 172 sylaby Hangul AC00–D7A3 (web rozkłada algorytmicznie, Rust nie); (b) 173 pozostałe znaki BMP (web zostawia znaki spoza U+0300–U+036F lub ma kilka baz; nie są w `NFD_BASE`), gdzie Rust zwraca znak bez zmian (test sprawdza to asercją). Ze względu na tę liczbę (173 zamiast szacowanych wcześniej 177) w dokumencie podano wartość zmierzoną. `strip_diacritics` NIE zmieniony. Brąz, Żelazo, Drewno, Kamień: zgodne z webem (wektory zielone).

6. PRZYJMUJĘ (dowód wykonany). `git diff --check ae62996d7~1 fddc1ef49` przeszedł w tym worktree (rc 0, bez wyjścia). Po commicie r3 zostanie powtórzony dla całego zakresu `ae62996d7~1..HEAD` (wynik w sekcji TESTY).

## TESTY (po zmianach r3, katalog `rust-port/engine`, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0)
- `cargo test --test p6_8b_p1b_vectors`: 7 passed, 0 failed (w tym nowy `strip_diacritics_bmp_matches_web`).
- `cargo test --test p6_8b_helpers_vectors`: 18 passed, 0 failed (regresja P1a).
- `cargo test --lib`: 6 passed, 0 failed.
- `cargo clippy --lib --test p6_8b_p1b_vectors --test p6_8b_helpers_vectors -- -D warnings`: rc 0.
- `cargo fmt --all -- --check`: rc 0.
- Mutacja M1 (zwrot None): 3 FAILED, zob. `dowody/pomiar-mutacje-p1b-c1-r3.txt`.
- Pomiar BMP strip_diacritics: 11 345 rozbieżności = 11 172 Hangul + 173 pozostałe (przypięte).
- `git diff --check` (zakres `ae62996d7~1..HEAD`): zob. wynik w odpowiedzi orkiestratora.

## BLOKADY
Brak dla c1. Dla c2 bez zmian względem r2: availableProduction (923–1135), availableReplacementsFor (1136–1252) wymagają bramek miasta/surowców i wektorów pełnego grafu; setPaused (1990) i manpowerCostOf (1985) wymagają pól `wstrzymana`/`rekrutacja` w CityProduction oraz weryfikacji sygnatury unitManpowerCostForType. Rozszerzenie NFD_BASE (klasy z pkt 5) nie jest blokadą, jeśli bramki c2 nie obejmują tych znaków.

## RUNDY
3/5 (licznik orkiestratora z nagłówka dispatchu; ZAŁOŻENIE, pkt 4 odpowiedzi). Liczniki wewnętrzne: operator r1 = 1, weryfikator r2 = 2.

## NASTĘPNY KROK
Final Control dla `ae62996d7` (kod) i commitów dokumentacyjnych `1c53aae00`, `fddc1ef49` oraz commita r3; potem Operator dla P1b-c2 tym samym ID; P2 dopiero po zamknięciu B3 (recruitment.rs).

## DEPLOY/PUSH
NIE WYKONANO
