# P6.2 + P6.3 - Porzadek (order.ts), ulepszenia terenu, ruch w heksie miasta, forty (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1)

**Status:** runda 2/5, rola Operator (obrona; poprawka zarzutow Evaluatora rundy 1, zob. sekcja 7). **DOMAIN:** GAME. **Pin web:** `edb8fb56`. **Baza Rust:** `origin/rust-port/parity-v2` @ `a29c1657` (428 testow przed zmiana).
**Artefakty biegu:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/` (generator wektorow `gen-p623-vectors.mjs` + loader `p623-loader-*.mjs`, niezalezny weryfikator `verify-p623-vectors.py`, tabela symboli `symbols-p623-r2.tsv`, logi bramek `gate-*-r1.log` i `gate-*-r2.log`, `dowody/`, `grep-literals-r1.txt`).

## 0. ZALOZENIA (luki rozstrzygniete bez pytan do wlasciciela)

1. **`order.ts` to "Porzadek" miasta, nie kolejka rozkazow.** Przeczytany w calosci (567 linii na pinie): `Porzadek = round(wagaSzczescie * Szczescie + wagaPrawo * Prawo)`, progi T1/T2, efekty `unrest/neutral/order`, migracja buntu, rozklad nastrojow. Dispatch i GAP-ANALYSIS (`P6-0` wiersz 122 "komendy/rozkazy") nazwali go heurystycznie po nazwie pliku. Port dotyczy faktycznej tresci pliku.
2. **Czesc P6.2 z dispatchu "walidacja komend, transakcyjnosc mutacji" nie ma odpowiednika w `order.ts`** (zero symboli o komendach). Nie zmieniam `session.rs`; ta czesc jest **NIE-DOTYCZY dla tego pliku** i wymaga osobnego zrodla web (katalog komend: `P2-5-COMMANDS.md`, mutatory w `main.ts`) - zapis w sekcji 6 (RUNDA-2 / poza zakresem plikow).
3. **Miejsce kodu Porzadku:** allowlista dopuszcza dla `order.ts` tylko `domain/types.rs` i `domain/session.rs`, wiec modul jest wbudowany jako `pub mod porzadek` w `types.rs`. **R2:** re-eksport `pub use types::porzadek;` USUNIETY; jedyna zmiana w `domain/mod.rs` to zmiana DEKLARACJI modulu `mod types;` -> `pub mod types;` (dozwolone: "tylko deklaracje modulow"); testy importuja `civ_engine::domain::types::porzadek::*`. Brak odstepstwa od allowlisty.
4. **Zaleznosci spoza czterech plikow, ktore trzeba bylo przeniesc, zeby port byl wykonywalny:** `scaleImprovementWorkCost` (r-stawki-strojenie.ts, wlasciciel P6.7), `axialDistance`/`cityTerritoryRadius`/`CityNode` (map/territory.ts), `cityRangeForPopulation` (okolica.ts), `hexKeysWithinRadius` (okolica.ts, prywatny odpowiednik w `terrain.rs`). Status **ZALEZNOSC-PORTOWANA** (z wektorami); wlasciciele tych plikow w pozniejszych tematach moga je przejac bez zmiany zachowania.
5. **Arytmetyka:** web liczy na `number` (f64), wiec port uzywa `f64` i kolejnosci dzialan identycznej z TS; `Math.round` odwzorowuje `js_round` (polowki w gore, `Math.round(-2.5) === -2`, poprawne dla `0.49999999999999994`).
6. **Klucze prototypu JS (R2: port zgodny z webem, bez wyjatku):** `IMPROVEMENTS` w webie jest zwyklym obiektem JS, wiec `IMPROVEMENTS[klucz]` jest prawdziwe tez dla 12 nazw `Object.getOwnPropertyNames(Object.prototype)` (`constructor`, `toString`, `__proto__`, ...), a `normalizeImprovementKey` / `improvementKeysForHex` zwracaja taki klucz. Port odtwarza to tabela `klucze_prototypu_js` w `data/derived/ulepszenia-reguly.json` (lista z Node 22, zgodna z niezalezna lista ECMAScript w weryfikatorze Python). Pozostale funkcje z kluczem prototypu daja to samo co dla nieznanego klucza (wiersz-funkcja nie ma pol `bonus`/`nazwa`/`epoka`/...), co potwierdzaja wektory dla wszystkich funkcji przyjmujacych klucz (generator, sekcja `PROTO_KEYS`).
7. **Wiring:** zero zmian w `bridge.rs` / `playable.rs` (P7). Jedyne "podpiecie" to wariant `add_foreign_city_block_coords`, ktory karmi istniejace `find_path`/`reachable` (parametr `occupied`) - test pokazuje, ze obce miasto blokuje trase, wlasne nie.
8. **Mnozniki drog (P3-23)** sa JUZ wpiete w koszt ruchu: `pathfinding.rs` `MovementRules::default()` czyta `road-movement-multipliers.json` (dzielniki 3/5) i `movement_cost_with_rules` jest uzywane przez `find_path`/`reachable`. Dowod nowego testu: `foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors` (droga obniza koszt tej samej trasy). Nie zmieniano mechaniki.

## 1. Zakres i wynik binarny

| Plik web | Eksporty (pin) | PORTOWANY | DANE-JUZ-W-RUST | NIE-DOTYCZY | RUNDA-2 |
|---|---|---|---|---|---|
| `order.ts` | 19 | 18 | 1 (`Difficulty`) | 0 | 0 |
| `terrain-improvements.ts` | 35 | 35 | 0 | 0 | 0 |
| `city-hex-movement.ts` | 6 | 6 | 0 | 0 | 0 |
| `fort-territory.ts` | 9 | 9 | 0 | 0 | 0 |
| **Razem** | **69** | **68** | **1** | **0** | **0** |

Czesc P6.2 "walidacja komend i transakcyjnosc mutacji" NIE ma eksportow w tych czterech plikach - jest osobna pozycja **RUNDA-2** (17 grup plikow web, 142 miejsca mutacji klasy b) w `symbols-p623-r2.tsv` i `runda2-p62-komendy-r2.tsv` (zob. sekcja 6). Liczba 69 eksportow nie obejmuje tych pozycji.

Plus 6 zaleznosci (`ZALEZNOSC-PORTOWANA`: `scaleImprovementWorkCost`, `axialDistance`, `CityNode`, `cityTerritoryRadius`, `cityRangeForPopulation`, `hexKeysWithinRadius`). Pelna lista z lokalizacja Rust i testem: `symbols-p623-r2.tsv` (r1 zachowany jako dowod historyczny: `symbols-p623-r1.tsv`). Kryterium "kazdy symbol ma status" - spelnione dla 69/69.

## 2. Co zrobiono (kod)

| Plik Rust | Zmiana |
|---|---|
| `src/domain/types.rs` | `pub mod porzadek` (port `order.ts`; `Difficulty` istnial) |
| `src/domain/improvements.rs` | (R2: `normalize_improvement_key` z kluczami prototypu JS z tabeli) `ImprovementCatalog` (kolejnosc kluczy pliku), `HexLike`, `TileYield`, 33+ funkcji portu `terrain-improvements.ts`, `js_round` |
| `src/domain/pathfinding.rs` | `CityHexRef`, `city_at_hex`, `can_unit_occupy_city_hex`, `can_ai_enter_empty_enemy_city`, `foreign_city_hex_keys`, `add_foreign_city_blocks`, `add_foreign_city_block_coords` |
| `src/domain/terrain.rs` | `CityNode`, `FortNode`, `FortImprovementType`, `axial_distance`, `city_range_for_population`, `city_territory_radius`, `fort_node_as_city_node`, `is_hex_reserved_by_rival_fort`, `founding_nodes_for_owner`, `apply_fort_takeover_on_city_founded`, `find_evacuation_hex_outside_city` |
| `src/data/derived.rs` | loadery nowych tabel + `SOCIETY_PARAMS_JSON` |
| `src/domain/mod.rs` | `mod types;` -> `pub mod types;` (tylko deklaracja modulu; zob. ZALOZENIE 3) |
| `data/derived/porzadek-params.json` | NOWA: 14 wierszy (FALLBACK_ORDER_PARAMS + skala rozkladu nastrojow) |
| `data/derived/ulepszenia-reguly.json` | NOWA (R2: + `klucze_prototypu_js`): skala Pracy (FALA2, mnozniki epok), produkcja epokowa, surowce terytorium, ruda, aliasy, migracja kopalni, zywnosc, drogi, ukrywanie zloz |
| `data/derived/teren-ruch-reguly.json` | NOWA: budynki obronne blokujace AI, maks. pierscien ewakuacji, klucze fort/posterunek |

**Brak literalow danych/mnoznikow w nowym kodzie:** `grep-literals-r1.txt` - wszystkie liczby w dodanym kodzie to elementy strukturalne (0/1, polowka `Math.round`, sasiedztwo `!= 1`, `/ 2`). Promienie fortu/posterunku pochodza z `terrain-improvements.json` (`zasieg_terytorium`), promien miasta z `miasto-params.json`, stawki z `terrain-improvements.json`/tabel.

## 3. Dowody zgodnosci z webem

- **Wektory z URUCHOMIONEGO weba:** `gen-p623-vectors.mjs` ladowal prawdziwe `order.ts`, `terrain-improvements.ts`, `city-hex-movement.ts`, `fort-territory.ts` (+ `map/territory.ts`, `game/okolica.ts`) pod Node 22 `--experimental-transform-types` z loaderem `.ts`/`.json` bez stubow. Wyniki w `rust-port/engine/tests/p6_23_vectors/{order,improvements,hexmove,fort}.json` (~2 MB). Wejscia: siatki wartosci (w tym NaN, +-Inf, polowki zaokraglen, epoki do 1100), losowe scenariusze z deterministycznym LCG, prawdziwy `society-params.json` w 3 poziomach trudnosci oraz 13 syntetycznych blokow (w tym brak spolecznosci).
- **Rust:** 33 nowe testy; kazdy porownuje WSZYSTKIE pola wyniku z wynikiem weba (rowne liczbowo, `NaN==NaN`, `-0==0`).
- **Niezalezny weryfikator Python** (`verify-p623-vectors.py`, osobna implementacja bez Rust; `Math.round` liczony arytmetyka wymierna `Fraction`): **16242 porownan, 0 rozbieznosci** (r1: `dowody/verify-p623-r1.log`); **R2 (po dodaniu wektorow kluczy prototypu): 16496 porownan, 0 rozbieznosci, EXIT=0** (`dowody/verify-p623-r2.log`). Dodatkowo odczytuje stale z TEKSTU zrodel TS regexem (FALLBACK_ORDER_PARAMS, MAX_HAP, R_STAWKI_FALA2_MULT, mnozniki epok, listy ulepszen, promienie fortu) i porownuje z tabelami Rust oraz sprawdza `engine/data/{terrain-improvements,society-params,miasto-params}.json == web`.
- **Czulosc:** `dowody/mutation-evidence-r1.txt` - 8 pojedynczych mutacji kodu/tabel (m.in. `Math.round` bez polowek, waga 0.5->0.6, FALA2 2->3, brak resetu `contestedUseless`, dystans AI, kolejnosc ewakuacji, migracja wegla, prog T2) - kazda czerwieni co najmniej jeden test; mutacja weryfikatora Python: `dowody/verify-p623-mutacja-r1.log` (5 rozbieznosci). M7: pierwsza proba `sed` trafila inny `return None` i nie kompilowala sie - powtorzona precyzyjna edycja (wpis "M7 (poprawiona)").
- **Test ksztaltu bez pinow wartosci:** `p6_23_tables.rs` (kompletnosc i spojnosc tabel wzgledem katalogu, znak kar/bonusow, unikalnosc id) oraz `order_shape_invariants_hold_for_any_table_values`, `rules_tables_have_consistent_shape`. Testy wektorowe PINUJA zgodnosc z webem z definicji (zmiana liczby balansu w tabeli czerwieni je celowo, dopoki wektory nie zostana wygenerowane od nowa) - stad dwa poziomy.

## 4. Bramki (surowe logi z `EXIT`)

**R2 (ostateczne):** `gate-fmt-r2.log` EXIT=0 (puste wyjscie + `EXIT=0`), `gate-clippy-r2.log` EXIT=0 (`Finished dev profile`), `gate-test-r2.log` EXIT=0, suma `test result`: **461 passed, 0 failed**. `git diff --check a29c1657` czysty (usunieta koncowa spacja w `dowody/verify-p623-mutacja-r1.log:62`). Czulosc zmiany R2: `dowody/mutation-proto-r2.txt` (usuniecie kluczy prototypu z `normalize_improvement_key` czerwieni 3 testy: `hex_layer_functions_match_web`, `normalize_and_lookup_functions_match_web`, `prototype_keys_pass_normalize_like_in_web`; kod przywrocony). Ponizej tabela rundy 1 (historia).

Komendy w `rust-port/engine`, `CARGO_INCREMENTAL=0 CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_fb33da4c-2f2-1 CARGO_PROFILE_DEV_DEBUG=0`:

| Bramka | Komenda | Log | EXIT |
|---|---|---|---|
| fmt | `cargo fmt --check` | `gate-fmt-r1.log` | 0 |
| clippy | `cargo clippy --all-targets -- -D warnings` | `gate-clippy-r1.log` | 0 |
| test | `cargo test` | `gate-test-r1.log` (800 linii) | 0 |

Surowe wyjscie fmt (pelne): `EXIT=0` (brak roznic). Surowe wyjscie clippy (pelne): `Checking civ-engine v0.1.0 (...)`, `Finished dev profile [unoptimized] target(s) in 8.15s`, `EXIT=0`. Test: suma `test result` = **461 passed, 0 failed** (428 bazowych + 33 nowych). Pierwsza proba clippy zakonczyla sie `EXIT=101` (`single_element_loop` w `p6_23_tables.rs`) - poprawiona i powtorzona (nadpisany log zawiera wynik ostateczny). `git diff --check` czysty; brak koncowych spacji w nowych plikach (grep).

## 5. Tabela bylo/jest i zmiany testow

| | Bylo | Jest |
|---|---|---|
| Testy silnika (`cargo test`, suma) | 428 | 461 (R2: test `prototype_keys_are_a_documented_divergence_from_web` zastapiony `prototype_keys_pass_normalize_like_in_web`; liczba bez zmian) |
| `tests/p6_23_order.rs` | - | 11 |
| `tests/p6_23_improvements.rs` | - | 10 |
| `tests/p6_23_hexmove.rs` | - | 4 |
| `tests/p6_23_fort.rs` | - | 5 |
| `tests/p6_23_tables.rs` | - | 3 |
| Tabele `data/derived/*.json` | 21 | 24 |

**Zmiany istniejacych testow: ZERO** (nie edytowano zadnego pliku `tests/*.rs` poza nowymi; nic nie oslabiono). Pomocnik `tests/p6_23_vectors/common.rs` dolaczany przez `#[path]` (bez nowego katalogu poza allowlista).

## 6. Co NIE zostalo zrobione / ryzyka (jawnie)

- **RUNDA-2 (P6.2: walidacja komend i transakcyjnosc mutacji):** `order.ts` jest Porzadkiem miasta (zalozenie 1), wiec ta czesc dispatchu nie ma w nim symboli. Zrodlo web zostalo wskazane konkretnie: katalog mutatorow z P2-5 (`R-RUSTPORT-P2-5-COMMANDS-Q1/mutator-review-r4.tsv` @ `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, klasa `b` = mutator stanu wywolywany z akcji gracza): **142 miejsca w 17 plikach** (`main.ts` 89, `cityPanel.ts` 15, `armyMerge.ts` 13, `cities.ts` 4, `auto-manage.ts` 3, `embarkation.ts` 3, `production.ts` 3, `trade-routes.ts` 2, `empireDetailPanel.ts` 2 oraz po 1 w `army-concentration.ts`, `diplomacy-tech-trade.ts`, `diplomacy.ts`, `playerState.ts`, `rally-point.ts`, `research.ts`, `siegeMachines.ts`, `map-attack-city.ts`). Pelna lista z numerami linii (pin `edb8fb56`) i punktem P6 wlasciciela (wg `P6-0-GAP-ANALYSIS.md`, kolumna "P6"): `runda2-p62-komendy-r2.tsv`; wiersze `RUNDA-2` w `symbols-p623-r2.tsv` (17). Pliki `game/*` maja wlascicieli P6.1/P6.4/P6.5/P6.6/P6.8/P6.11-P6.15/P6.17; `main.ts`, `ui/*`, `map/*` leza poza tabela P6-0 (tylko `gra/src/game`) i naleza do wiringu P7. Port transakcyjnosci/walidacji w `session.rs` wymaga tych mutatorow w Rust, wiec nie moze powstac przed tematami-wlascicielami; `session.rs` nie zmieniany.
- **Brak wiringu do petli gry** (`bridge.rs`, `playable.rs`) - P7. `Porzadek` nie jest jeszcze wolany przez `turn_economy.rs`.
- **Nie zmierzono zachowania w przegladarce** (temat logiki, nie wizualny).
- `HexLike.nakladka` uzywa `start_position::Overlay` (z P6.1C); pozniejszy temat moze go przeniesc do wspolnego modulu.
- Wektory nie obejmuja wartosci `null` jako wiersza parametru w `society-params.json` (`pick(null, ...)` w webie rzuca `TypeError`; port zwraca wartosc domyslna) - przypadek niedopuszczalny w prawdziwym pliku.
- Rownolegle tematy (P6.1B/P6.1D) dotykaja `data/derived.rs` i `domain/mod.rs`: moje zmiany sa addytywne (koniec pliku / 1 linia) - konflikty rozwiaze orkiestrator.

## 7. Odpowiedzi na zarzuty Evaluatora (runda 1/5, poprawki w rundzie 2/5)

| # | Zarzut | Decyzja | Dowod |
|---|---|---|---|
| 1 | `pub use types::porzadek;` w `domain/mod.rs` poza allowlista | **PRZYJMUJE** | Re-eksport usuniety; `mod types;` -> `pub mod types;` (deklaracja modulu); import w `tests/p6_23_order.rs:10` `civ_engine::domain::types::porzadek::`; `git diff a29c1657 -- src/domain/mod.rs` = 1 linia (`mod types` -> `pub mod types`); fmt/clippy/test EXIT=0 (`gate-*-r2.log`). |
| 2 | `git diff --check` nieczysty (`dowody/verify-p623-mutacja-r1.log:62`) | **PRZYJMUJE** | Usunieta koncowa spacja; `git diff --check a29c1657` pusty (w commicie R2). |
| 3 | 2 symbole `PORTOWANY-Z-WYJATKIEM`, test utrwalajacy rozbieznosc | **PRZYJMUJE** | Port zgodny z webem: tabela `klucze_prototypu_js` + `normalize_improvement_key`; wektory dla wszystkich funkcji z kluczem (12 kluczy prototypu), generator bez `known_divergence`; weryfikator Python 16496 porownan / 0 rozbieznosci (lista ECMAScript niezalezna od Node/Rust); test `prototype_keys_pass_normalize_like_in_web`; mutacja `dowody/mutation-proto-r2.txt` czerwieni 3 testy. Statusy: 68 PORTOWANY + 1 DANE-JUZ-W-RUST. |
| 4 | P6.2 niedomkniete: RUNDA-2 = 0 w tabeli, brak symboli | **PRZYJMUJE** | Zrodlo wskazane konkretnie (sekcja 6), 17 wierszy RUNDA-2 w `symbols-p623-r2.tsv`, `runda2-p62-komendy-r2.tsv` (142 miejsca z numerami linii), tabela sekcji 1 poprawiona (kolumna RUNDA-2 + akapit pod tabela). |
| 5 | Brak sladu pelnego odczytu `terrain-improvements.ts`, `city-hex-movement.ts`, `fort-territory.ts` | **PRZYJMUJE** | Ponizej slad odczytu R2. |

**Slad pelnego odczytu plikow zrodlowych (pin `edb8fb56`, narzedzie Read bez limitu, `git archive edb8fb56 gra/src gra/data`):** `terrain-improvements.ts` 484 linii (1-484; dispatch podawal 437 LOC - pin ma 484), `city-hex-movement.ts` 85 linii (1-85), `fort-territory.ts` 214 linii (1-214), `order.ts` 567 linii (1-567, runda 1). Po odczycie sprawdzono, ze rodzaje eksportow zgadzaja sie z tabela symboli (35 / 6 / 9 / 19). Uwaga z odczytu `terrain-improvements.ts`: `IMPROVEMENTS` (linia 29) to zwykly obiekt, co dalo zarzut 3.

**Uwagi nieblokujace Evaluatora:** (a) mnozniki drog P3-23 - web bierze stale z `map/road-movement.ts` (3, 5) z podlogami 1/3 i 1/5; Rust czyta `road-movement-multipliers.json`; rownowaznosc dla kosztu bazowego >= 1, nieudowodniona wektorem - zostaje do tematu ruchu (poza czterema plikami zakresu), NIE_ZMIERZONO. (b) `same()` traktuje `-0 == 0` - swiadomie (porownanie liczbowe), rozroznienie znaku zera nie jest testowane. (c) Test `foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors` jest autorstwa Operatora (nie z weba) - tak oznaczony.
