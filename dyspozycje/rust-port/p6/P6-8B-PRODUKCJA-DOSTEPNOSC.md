# P6.8B — PRODUKCJA: dostępność, rekrutacja, praca (dokument tematu)

**TEMAT:** `R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1`
**Pin webu:** `91dc998a5f1b51ad29e0f4785edfd45655445c53` (`gra/src/game/production.ts`, 682–1252 i 1977–2541)
**Podział:** `dyspozycje/rust-port/p6/P6-8-MIASTA-PODZIAL.md` §9 (8B), §11 (wiersze `8B-P1`, `8B-P2`)
**Run:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/`

## Stan

| Partia | Zakres | Status | Commit |
|---|---|---|---|
| 8B-P1a | helpery: nacja jednostek, zamienniki, kolejka ulepszeń, tokeny jednostek specjalnych, koszt kupna za złoto (web 694–905) | **ZROBIONE (kod + wektory + mutacje), runda 2 Operatora** | kod `7a8c9927b`, pomiary r1 `8bc151ddc`, runda 2 = commit opisany w raporcie |
| 8B-P1b-c1 | `unitStockShortfallLabel` (682–693), `UNIT_POPULATION_COST` (1977), `populationCostOf` (1980–1982) | **ZROBIONE (kod + wektory `p1b.json` + 6 testów + mutacje), runda 1 Operatora; weryfikacja niezależna runda 2 (`pomiar-mutacje-p1b-c1-r2.txt`)** | kod: `population_cost_of`/`UNIT_POPULATION_COST` (nowe), `unit_stock_shortfall_label` (już był w `production_units.rs`, teraz przypięty wektorami); kod `ae62996d7`, raport `01-operator-r1.md`, weryfikacja `02-operator-pomiary-r2.md` |
| 8B-P1b-c2a | `manpowerCostOf` (1985), `setPaused` (1990), pola `wstrzymana`/`rekrutacja` w `CityProduction` | **ZROBIONE (kod + wektory + mutacje), runda 4 Operatora** | `9040d3bca` |
| 8B-P1b-c2b | `availableReplacementsFor` (1136–1252), `replacement_name_compare` (localeCompare) | **ZROBIONE (kod + wektory + mutacje), runda 4 Operatora** | `88991f78b` |
| 8B-P1b-c2c | `availableProduction` (923–1135) | **ZROBIONE (kod + wektory + mutacje), runda 4 Operatora** | `fbd9faf12` |
| 8B-P2 | rekrutacja, rush, praca/podział, katalog epok, podział wyjścia (2004–2541) | NIEWYKONANE; wymaga zamknięcia B3 (`recruitment.rs`, §4 podziału) | — |

Kryteria końca tematu **nie są spełnione**. Temat pozostaje OTWARTY.

## Partia 8B-P1a — symbole (web 694–905)

Zrobione w `rust-port/engine/src/domain/production_units.rs` (sekcja P6.8B-P1a, na końcu pliku):

| Web | Symbol | Rust | Status |
|---|---|---|---|
| 694 | `CIV_KEY_TO_UNIT_NACJA` | `CIV_KEY_TO_UNIT_NACJA` (tablica 17 par) | ZROBIONE, wektory `civKey` |
| 722 | `unitNacjaForCivKey` | `unit_nacja_for_civ_key` | ZROBIONE (odstępstwo: klucze prototypowe, patrz niżej) |
| 727 | `unitAllowedForCivNation` | `unit_allowed_for_civ_nation` | ZROBIONE, wektory `allowed` |
| 738 | `availabilityCivNation` | `availability_civ_nation` | ZROBIONE (j.w., `availability`) |
| 742 | `isCivSpecialReplacement` | `is_civ_special_replacement` | ZROBIONE, wektory `specialReplacement` |
| 751 | `civHasReplacementFor` | `civ_has_replacement_for` | ZROBIONE, wektory `hasReplacement` |
| 763 | `BUILDING_GOLD_PURCHASE_MULT` | `BUILDING_GOLD_PURCHASE_MULT` | ZROBIONE |
| 765 | `buildingGoldPurchaseCost` | `building_gold_purchase_cost` | ZROBIONE, wektory `goldCost` + testy progów i NaN/±Infinity/-0 |
| 770 | `buildingTypeCommitted` | `building_type_committed` | ZROBIONE, wektory `committed` |
| 783 | `isBuildingSupersededByUpgrade` | `is_building_superseded_by_upgrade` | ZROBIONE, wektory `superseded` |
| 798 | `applyCompletedBuildingIds` | `apply_completed_building_ids` | ZROBIONE, wektory `applyCompleted` |
| 833 | `buildingUnlockFlagFor` | `building_unlock_flag_for` | ZROBIONE, wektory `unlockFlag` |
| 843 | `buildingTypeQueued` | `building_type_queued` | ZROBIONE, wektory `queued` |
| 853 | `isBlankReplacement` | `is_blank_replacement` | ZROBIONE, wektory `blank` |
| 865 | `civSpecialUnitNameTokens` | `civ_special_unit_name_tokens` | ZROBIONE, wektory `tokens` |
| 891 | `unitMatchesSpecialName` | `unit_matches_special_name` | ZROBIONE, wektory `matchName` + test gałęzi |

Wektory: `rust-port/engine/tests/p6_8b_vectors/helpers.json` (generator `gen-p6-8b-helpers-vectors.mjs` w runie; wynik z uruchomionego weba `91dc998a`, Node 22). Test: `rust-port/engine/tests/p6_8b_helpers_vectors.rs` (18 testów).

### Odstępstwa i ustalenia (udokumentowane, przypięte testami)

1. **Klucze prototypowe w `unitNacjaForCivKey` / `availabilityCivNation`.** Web trzyma mapę w zwykłym obiekcie JS, więc `CIV_KEY_TO_UNIT_NACJA['constructor']` i `['__proto__']` zwracają wartość dziedziczoną (funkcja / obiekt), a nie napis. Rust zwraca `None`. Wektory zapisują ten wynik jako `{"$js": "function"|"object"}`; test `prototype_keys_deviation_is_pinned` przypina `None`. Nazwy takie jak `hasOwnProperty` czy `toString` NIE są prototypowe po `toLowerCase()` (web zwraca `undefined`, Rust `None`, zgodnie).
2. **Diakrytyki i `ł`.** Web `stripDiacritics` (NFD + usunięcie U+0300–U+036F + lower) NIE składa `ł`: `Słowianie` ≠ `Slowianie`. Pary testowe dla „tylko diakrytyki” używają znaków złożonych (np. `Sumér` = `Sumer`), a nie `ł`/`l`.
3. **Puste wejścia po strip.** Wektory zawierają nacje/cywilizacje złożone wyłącznie ze znaków diakrytycznych (po strip = pusty napis).

## Partie 8B-P1b-c2 (runda 4 Operatora)

- **c2a** (`manpowerCostOf`, `setPaused`): `manpower_cost_of(item, epoka, max_mult, cost_mult: Option)` (costMult domyslnie = maxMult), `set_paused`. Wektory `p1b-c2a.json` (10780 + 14 przypadkow) z prawdziwego `production.ts` przez loader TS. Mutacje M1-M5: 5 KILLED.
- **c2b** (`availableReplacementsFor`): `available_replacements_for` + `ReplaceAvailabilityCtx`, `UnitReplaceRow`. Zbior realny (`units.json`) i syntetyczny (+ 'Wojownik próbny', 'Galera testowa', 'Jednostka bez typu' x2). 2592 przypadki (1278 niepustych). Mutacje M1-M15: 14 KILLED, M14 SURVIVED (rownowaznik, patrz nizej).
- **c2c** (`availableProduction`): `available_production` + `ProductionAvailabilityCtx`, `BuildingAvailRow`. Wektory `p1b-c2c.json`: 700 przypadkow (320 kontekstow siatki + 126 kontekstow lancuchow `upgradeFrom`, x 2 zbiory), 5982 pozycje-budynki. Mutacje B1-B23 (B20 pominiete: wzorzec zduplikowany z `available_replacements_for`): 21 KILLED (w tym B16b); B16 i B17 SURVIVED (rownowazniki na dziedzinie, patrz nizej).

Zalozenia (ZALOZENIE, do weryfikacji):
1. `replacement_name_compare` = `localeCompare` (ICU en-US) dla nazw z diakrytykami: poziom 1 = `strip_diacritics` + `ł`->`l` wg `locale_compare`; poziom 2 = liczba diakrytykow; poziom 3 = `locale_compare` na oryginalach. Pomiar w Node 22 `Intl.Collator('en-US')`: 5550/5550 par nazw z `units.json` zgodnych. Poza zbiorem zmierzonym zachowanie NIE jest zweryfikowane.
2. `ctx.epoch` / `ctx.buildingLevel` nie-skonczone = 1 (web `Number.isFinite`).
3. `ctx.civKey`: `None` = `undefined`, `Some(None)` = `null`.
4. `units` w kolejnosci `data.units`; `findUnit` = pierwszy wpis.

Rownowazniki (mutanty przezywajace, zob. `mut-p6-8b-c2b.py` / `mut-p6-8b-c2c.py`):
- c2b M14 (poziom 2 diakrytykow usuniety): dla par o tym samym poziomie 1 roznica diakrytykow zawsze ustawia bazowa litere ASCII przed znakiem diakrytycznym (>= 0x80); poziom 3 (`locale_compare` na oryginalach, fallback UTF-16 dla nie-ASCII) daje ten sam porzadek. Wynik identyczny na 2592 przypadkach.
- c2c B17 (`level` nie-skonczony nie normalizowany): `item_cost` dla budynku sam normalizuje nie-skonczony poziom do 1 (jak web), wynik identyczny.
- c2c B16 (asymetryczny komparator budynki/jednostki): zmiana tylko jednej galezi (B,J) nie zmienia porzadku przy wejsciu budynki-przed-jednostkami (sortowanie stabilne, komparator zwraca `Greater` dla obu kierunkow miedzy typami). Zmiana obu galezi (B16b) jest zabijana. Ryzyko resztkowe: zalezne od kolejnosci wejscia.
- c2b/c2c: galezi `Zastąp specjalnie` i zamiennikow cywilizacyjnych nie da sie pokryc samymi realnymi danymi (np. Nacja '' z niepustym `W zamian za` nie wystepuje); pokryte zbiorem syntetycznym.

Weryfikacja niezalezna runda 4 (Operator-pomiary, `runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/06-operator-pomiary-r4.md`, logi `dowody/pomiar-r4v-*.txt`):
- Wektory: `git archive 91dc998a gra` -> trzy generatory (`gen-p6-8b-c2{a,b,c}-vectors.mjs`, Node v22.22.0, loader TS) -> `cmp` bajt w bajt z `p1b-c2{a,b,c}.json`: IDENTICAL x3.
- Gate'y na `8aedd7b1d`: `cargo fmt --all -- --check` EXIT 0; `clippy -D warnings` (lib + 3 testy c2) EXIT 0; testy c2a 5/5, c2b 4/4, c2c 1/1; regresja lib 6/6, helpers 18/18, p1b 7/7.
- Mutacje: c2a M1-M5 5/5 KILLED; c2b M1-M15 14 KILLED, M14 SURVIVED (rownowaznik, zob. wyzej); c2c B1-B23 bez B20: 21 KILLED, B16 i B17 SURVIVED (rownowazniki / ryzyko resztkowe, zob. wyzej).
- Korekta skryptow mutacji: wzorce `M2`, `M7`, `M11` (`mut-p6-8b-c2b.py`) i `B19` (`mut-p6-8b-c2c.py`) byly zapisane przed `cargo fmt` i nie trafialy w kod (`pattern count 0`, mutant nie byl stosowany). Wzorce poprawiono do aktualnego formatowania i mutanty uruchomiono ponownie (c2b na zrodle `88991f78b`, B19 osobno na `8aedd7b1d`); wynik: M2, M7, M11 KILLED, B19 KILLED. Liczby z raportu operatora (14/15, 21/23) potwierdzone.
- Zasada: w skryptach mutacji `pattern count != 1` nie jest liczone jako zabicie ani przezycie; logi nalezy czytac pod katem tego komunikatu.

## Partie 8B-P1b i 8B-P2 — do wykonania

- P1b-c1 (ZROBIONE, runda 1): `unitStockShortfallLabel`, `UNIT_POPULATION_COST` (= 0 w pinie), `populationCostOf`. Wektory: `tests/p6_8b_vectors/p1b.json` (generator `gen-p6-8b-p1b-vectors.mjs`), testy `tests/p6_8b_p1b_vectors.rs`.
- P1b-c2 (ZROBIONE w rundzie 4, patrz sekcja wyzej): `availableProduction`, `availableReplacementsFor`, `setPaused`, `manpowerCostOf`; `CityProduction` rozszerzone o `wstrzymana`/`rekrutacja`.
- Uwaga do wcześniejszego wpisu: zakres `unitStockShortfallLabel` w dyspozycji (682–693) jest poprawny dla pinu 91dc998a; w `gra/` roboczej kopii repo funkcja nie występuje w tym miejscu (kopia jest nowsza niż pin, nie używać jej jako źródła wektorów).
- P2 (28 symboli, ok. 538 LOC): `enqueueRecruitment`, `dequeueRecruitment`, `AdvanceRecruitmentResult`, `AdvanceRecruitmentGatedResult`, `advanceRecruitmentGated`, `advanceRecruitment`, `rushCost`, `rushProduction`, `cityPracaInteger`, `PodzialPracyMiasta`, `splitPraca`, `pracaImperialPoolGain`, `PracaSplitTick`, `previewPracaPoolBrutto`, `unitCostMode`, `unitPurchaseCost`, `buildableProduction`, `purchasableUnits`, `EPOCH_NUMBER_TO_NAME`, `BuildingCatalogStatus`, `BuildingCatalogEntry`, `eraBuildingCatalog`, `OutputShares`, `OutputSplit`, `DEFAULT_OUTPUT_SHARES`, `splitOutput`, `cityScienceOutput`, `cityMoneyOutput`. Przed P2: zamknięcie B3 (`recruitment.rs`).

## Mutacje (runda 2, plik `mut-p6-8b-helpers-r2.py` w runie)

56 mutantów na gałęziach sterujących `production_units.rs` (sekcja P1a). Wynik: 48 KILLED (test padł), 8 oczekiwanych przeżyć z uzasadnieniem równoważności w skrypcie (M5, E12, E27, E40, E45, E47, E48, E54). Klasa „COMPILE-ERROR” nie jest liczona jako zabicie. Log: `dyspozycje/autobot/runs/R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1/dowody/pomiar-mutacje-r2.txt`.

## Partia 8B-P1b-c1 (runda 1 Operatora)

| Web (pin 91dc998a) | Rust | Wektory / test |
|---|---|---|
| 682 `unitStockShortfallLabel(u, stock)` | `unit_stock_shortfall_label(surowiec, stock)` | `stockShortfall` (416 przypadków: Surowiec x stock), `stock_shortfall_label_*` |
| 1977 `UNIT_POPULATION_COST` = `miasto-params.jednostka_koszt_ludnosci.wartosc ?? 1` (pin: 0) | `UNIT_POPULATION_COST` = 0.0 | `unitPopulationCost`, `unit_population_cost_matches_web` |
| 1980 `populationCostOf(item)` | `population_cost_of(item)` | `populationCost` (5 przypadków) |

Uwaga do numeracji: poprzednie zapisy „1815–1825” dla `populationCostOf` były błędne (pomyłka numeracji w runie r1); właściwe linie @91dc998a to 1977–1982. Poprawka r3: komentarz w `production_units.rs` (sekcja P1b-c1) i nagłówek/`zrodlo` generatora (`gen-p6-8b-p1b-vectors.mjs`, a przez to pole `zrodlo` w `p1b.json`) podają już 1977 / 1980–1982 (zarzut weryfikatora nr 1 zamknięty).

Odstępstwa: klucze `constructor` i `__proto__` w `UNIT_STOCK_GATE_LABEL` (web: etykieta z wartością dziedziczoną; Rust: `None`), przypięte `stock_shortfall_prototype_keys_deviation_is_pinned`. Klucze `toString`, `valueOf` itd. po `toLowerCase()` nie są prototypowe (web zwraca `null`, zgodnie z Rust).

Mutacje runda 1 (`dowody/pomiar-mutacje-p1b-c1-r1.txt`): M1 KILLED, M3 KILLED, M2 i M4 EQUIV (UNIT_POPULATION_COST = 0 w pinie).

Mutacje runda 2 (weryfikator, `dowody/pomiar-mutacje-p1b-c1-r2.txt`, skrypt `mut-p6-8b-p1b-c1-r2.py`): M1 KILLED (poprawka r3: **3** testy FAILED, nie 4; ponowny pomiar w `dowody/pomiar-mutacje-p1b-c1-r3.txt`), M2 EQUIV, M3 KILLED, M4 EQUIV, M5 (usunięcie `js_trim`) KILLED, M6 (`UNIT_POPULATION_COST` = 1.0) KILLED, M7 (usunięcie `toLowerCase`) KILLED. M2/M4 są równoważne tylko przy wartości 0; test pinu `unit_population_cost_matches_web` zabija zmianę stałej (M6). Przy zmianie wartości UNIT_POPULATION_COST równoważność M2/M4 przestaje obowiązywać.

Weryfikacja niezależna runda 2 (`ae62996d7`): generator ponownie uruchomiony na `git archive 91dc998a gra`, wynik `p1b.json` bajt w bajt identyczny z wersją w repo (`cmp`); 416 + 2 + 5 przypadków; testy: p6_8b_p1b_vectors 6/6, p6_8b_helpers_vectors 18/18, --lib 6/6; clippy `-D warnings` EXIT 0; fmt --check EXIT 0; `git diff --check` czysto.

Partia r3 (poprawki po weryfikacji, kod `strip_diacritics` NIE zmieniony): test `strip_diacritics_bmp_matches_web` sprawdza CAŁĄ płaszczyznę BMP (bez surogatów) względem webu; lista oczekiwanych wyników `stripDiacriticsChanged` w `p1b.json` (znaki, dla których web != toLowerCase). Wynik pomiaru: rozbieżności tylko w dwóch klasach, obie PRZYPIĘTE w teście (liczby stałe): (a) 11 172 sylaby Hangul AC00–D7A3 (web rozkłada algorytmicznie na jamo, Rust nie); (b) 173 pozostałe znaki BMP (web zostawia znaki spoza U+0300–U+036F lub ma kilka baz; nie są w `NFD_BASE`), dla których Rust zwraca znak bez zmian. Każda zmiana tych liczb (np. po rozszerzeniu tablicy) wymaga świadomej aktualizacji testu. Wpływ na dane gry: brak (Brąz, Żelazo, Drewno, Kamień są w zakresie zgodnym z webem; testy wektorów zielone).

Ograniczenia wektorów (jawnie, zaakceptowane ryzyko): (1) M2 i M4 (`population_cost_of`, gałęzie Jednostka/Budynek) przeżywają wyłącznie przy `UNIT_POPULATION_COST = 0` w pinie 91dc998a; wektory `populationCost` nie wykryją błędnego powiązania gałęzi Jednostka ze stałą, jeśli wartość webu stanie się niezerowa (zabezpiecza tylko M6 i test pinu wartości). (2) Klasy rozbieżności `strip_diacritics` opisane wyżej są przypięte, nie naprawione. (3) Klucze prototypowe (`constructor`, `__proto__`) pozostają świadomym odstępstwem.

Numeracja licznika rund: nagłówek dispatchu (`RUNDA: 3/5`) przyjęty jako licznik orkiestratora (ZAŁOŻENIE r3); liczniki „1/5” i „2/5” w raportach to liczniki wewnętrzne runów operatora/weryfikatora, nie rundy tematu.

Plik `p1b.json` po poprawce r3: 401 KB (dotąd 31 KB) z powodu listy `stripDiacriticsChanged`; limit 10 MB nieprzekroczony.
