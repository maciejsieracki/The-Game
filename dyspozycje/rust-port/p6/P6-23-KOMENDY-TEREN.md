# P6.2 + P6.3 - Porzadek (order.ts), ulepszenia terenu, ruch w heksie miasta, forty (R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1)

**Status:** runda 1/5, rola Operator. **DOMAIN:** GAME. **Pin web:** `edb8fb56`. **Baza Rust:** `origin/rust-port/parity-v2` @ `a29c1657` (428 testow przed zmiana).
**Artefakty biegu:** `dyspozycje/autobot/runs/R-RUSTPORT-P6-23-KOMENDY-TEREN-Q1/` (generator wektorow `gen-p623-vectors.mjs` + loader `p623-loader-*.mjs`, niezalezny weryfikator `verify-p623-vectors.py`, tabela symboli `symbols-p623-r1.tsv`, logi bramek `gate-*-r1.log`, `dowody/`, `grep-literals-r1.txt`).

## 0. ZALOZENIA (luki rozstrzygniete bez pytan do wlasciciela)

1. **`order.ts` to "Porzadek" miasta, nie kolejka rozkazow.** Przeczytany w calosci (567 linii na pinie): `Porzadek = round(wagaSzczescie * Szczescie + wagaPrawo * Prawo)`, progi T1/T2, efekty `unrest/neutral/order`, migracja buntu, rozklad nastrojow. Dispatch i GAP-ANALYSIS (`P6-0` wiersz 122 "komendy/rozkazy") nazwali go heurystycznie po nazwie pliku. Port dotyczy faktycznej tresci pliku.
2. **Czesc P6.2 z dispatchu "walidacja komend, transakcyjnosc mutacji" nie ma odpowiednika w `order.ts`** (zero symboli o komendach). Nie zmieniam `session.rs`; ta czesc jest **NIE-DOTYCZY dla tego pliku** i wymaga osobnego zrodla web (katalog komend: `P2-5-COMMANDS.md`, mutatory w `main.ts`) - zapis w sekcji 6 (RUNDA-2 / poza zakresem plikow).
3. **Miejsce kodu Porzadku:** allowlista dopuszcza dla `order.ts` tylko `domain/types.rs` i `domain/session.rs`, wiec modul jest wbudowany jako `pub mod porzadek` w `types.rs`; w `domain/mod.rs` dodana JEDNA linia `pub use types::porzadek;` (re-eksport, nie deklaracja modulu - jedyne odstepstwo od "tylko deklaracje modulow"; konieczne, bo `mod types` jest prywatny).
4. **Zaleznosci spoza czterech plikow, ktore trzeba bylo przeniesc, zeby port byl wykonywalny:** `scaleImprovementWorkCost` (r-stawki-strojenie.ts, wlasciciel P6.7), `axialDistance`/`cityTerritoryRadius`/`CityNode` (map/territory.ts), `cityRangeForPopulation` (okolica.ts), `hexKeysWithinRadius` (okolica.ts, prywatny odpowiednik w `terrain.rs`). Status **ZALEZNOSC-PORTOWANA** (z wektorami); wlasciciele tych plikow w pozniejszych tematach moga je przejac bez zmiany zachowania.
5. **Arytmetyka:** web liczy na `number` (f64), wiec port uzywa `f64` i kolejnosci dzialan identycznej z TS; `Math.round` odwzorowuje `js_round` (polowki w gore, `Math.round(-2.5) === -2`, poprawne dla `0.49999999999999994`).
6. **Znana roznica JS vs Rust (PORTOWANY-Z-WYJATKIEM):** `IMPROVEMENTS` w webie jest obiektem JS, wiec `normalizeImprovementKey('constructor' | 'toString' | 'hasOwnProperty' | '__proto__')` zwraca ten klucz (efekt prototypu). Port zwraca `None`. Udokumentowane w wektorze `known_divergence_prototype_keys` i tescie `prototype_keys_are_a_documented_divergence_from_web`; w realnej grze takie klucze nie wystepuja.
7. **Wiring:** zero zmian w `bridge.rs` / `playable.rs` (P7). Jedyne "podpiecie" to wariant `add_foreign_city_block_coords`, ktory karmi istniejace `find_path`/`reachable` (parametr `occupied`) - test pokazuje, ze obce miasto blokuje trase, wlasne nie.
8. **Mnozniki drog (P3-23)** sa JUZ wpiete w koszt ruchu: `pathfinding.rs` `MovementRules::default()` czyta `road-movement-multipliers.json` (dzielniki 3/5) i `movement_cost_with_rules` jest uzywane przez `find_path`/`reachable`. Dowod nowego testu: `foreign_city_blocks_feed_pathfinding_and_roads_use_p3_23_divisors` (droga obniza koszt tej samej trasy). Nie zmieniano mechaniki.

## 1. Zakres i wynik binarny

| Plik web | Eksporty (pin) | PORTOWANY | PORTOWANY-Z-WYJATKIEM | DANE-JUZ-W-RUST | NIE-DOTYCZY | RUNDA-2 |
|---|---|---|---|---|---|---|
| `order.ts` | 19 | 18 | 0 | 1 (`Difficulty`) | 0 | 0 |
| `terrain-improvements.ts` | 35 | 33 | 2 (`normalizeImprovementKey`, `improvementKeysForHex`) | 0 | 0 | 0 |
| `city-hex-movement.ts` | 6 | 6 | 0 | 0 | 0 | 0 |
| `fort-territory.ts` | 9 | 9 | 0 | 0 | 0 | 0 |
| **Razem** | **69** | **66** | **2** | **1** | **0** | **0** |

Plus 5 zaleznosci (`ZALEZNOSC-PORTOWANA`). Pelna lista z lokalizacja Rust i testem: `symbols-p623-r1.tsv`. Kryterium "kazdy symbol ma status" - spelnione dla 69/69.

## 2. Co zrobiono (kod)

| Plik Rust | Zmiana |
|---|---|
| `src/domain/types.rs` | `pub mod porzadek` (port `order.ts`; `Difficulty` istnial) |
| `src/domain/improvements.rs` | `ImprovementCatalog` (kolejnosc kluczy pliku), `HexLike`, `TileYield`, 33+ funkcji portu `terrain-improvements.ts`, `js_round` |
| `src/domain/pathfinding.rs` | `CityHexRef`, `city_at_hex`, `can_unit_occupy_city_hex`, `can_ai_enter_empty_enemy_city`, `foreign_city_hex_keys`, `add_foreign_city_blocks`, `add_foreign_city_block_coords` |
| `src/domain/terrain.rs` | `CityNode`, `FortNode`, `FortImprovementType`, `axial_distance`, `city_range_for_population`, `city_territory_radius`, `fort_node_as_city_node`, `is_hex_reserved_by_rival_fort`, `founding_nodes_for_owner`, `apply_fort_takeover_on_city_founded`, `find_evacuation_hex_outside_city` |
| `src/data/derived.rs` | loadery nowych tabel + `SOCIETY_PARAMS_JSON` |
| `src/domain/mod.rs` | 1 linia `pub use types::porzadek;` (zob. ZALOZENIE 3) |
| `data/derived/porzadek-params.json` | NOWA: 14 wierszy (FALLBACK_ORDER_PARAMS + skala rozkladu nastrojow) |
| `data/derived/ulepszenia-reguly.json` | NOWA: skala Pracy (FALA2, mnozniki epok), produkcja epokowa, surowce terytorium, ruda, aliasy, migracja kopalni, zywnosc, drogi, ukrywanie zloz |
| `data/derived/teren-ruch-reguly.json` | NOWA: budynki obronne blokujace AI, maks. pierscien ewakuacji, klucze fort/posterunek |

**Brak literalow danych/mnoznikow w nowym kodzie:** `grep-literals-r1.txt` - wszystkie liczby w dodanym kodzie to elementy strukturalne (0/1, polowka `Math.round`, sasiedztwo `!= 1`, `/ 2`). Promienie fortu/posterunku pochodza z `terrain-improvements.json` (`zasieg_terytorium`), promien miasta z `miasto-params.json`, stawki z `terrain-improvements.json`/tabel.

## 3. Dowody zgodnosci z webem

- **Wektory z URUCHOMIONEGO weba:** `gen-p623-vectors.mjs` ladowal prawdziwe `order.ts`, `terrain-improvements.ts`, `city-hex-movement.ts`, `fort-territory.ts` (+ `map/territory.ts`, `game/okolica.ts`) pod Node 22 `--experimental-transform-types` z loaderem `.ts`/`.json` bez stubow. Wyniki w `rust-port/engine/tests/p6_23_vectors/{order,improvements,hexmove,fort}.json` (~2 MB). Wejscia: siatki wartosci (w tym NaN, +-Inf, polowki zaokraglen, epoki do 1100), losowe scenariusze z deterministycznym LCG, prawdziwy `society-params.json` w 3 poziomach trudnosci oraz 13 syntetycznych blokow (w tym brak spolecznosci).
- **Rust:** 33 nowe testy; kazdy porownuje WSZYSTKIE pola wyniku z wynikiem weba (rowne liczbowo, `NaN==NaN`, `-0==0`).
- **Niezalezny weryfikator Python** (`verify-p623-vectors.py`, osobna implementacja bez Rust; `Math.round` liczony arytmetyka wymierna `Fraction`): **16242 porownan, 0 rozbieznosci** (`dowody/verify-p623-r1.log`). Dodatkowo odczytuje stale z TEKSTU zrodel TS regexem (FALLBACK_ORDER_PARAMS, MAX_HAP, R_STAWKI_FALA2_MULT, mnozniki epok, listy ulepszen, promienie fortu) i porownuje z tabelami Rust oraz sprawdza `engine/data/{terrain-improvements,society-params,miasto-params}.json == web`.
- **Czulosc:** `dowody/mutation-evidence-r1.txt` - 8 pojedynczych mutacji kodu/tabel (m.in. `Math.round` bez polowek, waga 0.5->0.6, FALA2 2->3, brak resetu `contestedUseless`, dystans AI, kolejnosc ewakuacji, migracja wegla, prog T2) - kazda czerwieni co najmniej jeden test; mutacja weryfikatora Python: `dowody/verify-p623-mutacja-r1.log` (5 rozbieznosci). M7: pierwsza proba `sed` trafila inny `return None` i nie kompilowala sie - powtorzona precyzyjna edycja (wpis "M7 (poprawiona)").
- **Test ksztaltu bez pinow wartosci:** `p6_23_tables.rs` (kompletnosc i spojnosc tabel wzgledem katalogu, znak kar/bonusow, unikalnosc id) oraz `order_shape_invariants_hold_for_any_table_values`, `rules_tables_have_consistent_shape`. Testy wektorowe PINUJA zgodnosc z webem z definicji (zmiana liczby balansu w tabeli czerwieni je celowo, dopoki wektory nie zostana wygenerowane od nowa) - stad dwa poziomy.

## 4. Bramki (surowe logi z `EXIT`)

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
| Testy silnika (`cargo test`, suma) | 428 | 461 |
| `tests/p6_23_order.rs` | - | 11 |
| `tests/p6_23_improvements.rs` | - | 10 |
| `tests/p6_23_hexmove.rs` | - | 4 |
| `tests/p6_23_fort.rs` | - | 5 |
| `tests/p6_23_tables.rs` | - | 3 |
| Tabele `data/derived/*.json` | 21 | 24 |

**Zmiany istniejacych testow: ZERO** (nie edytowano zadnego pliku `tests/*.rs` poza nowymi; nic nie oslabiono). Pomocnik `tests/p6_23_vectors/common.rs` dolaczany przez `#[path]` (bez nowego katalogu poza allowlista).

## 6. Co NIE zostalo zrobione / ryzyka (jawnie)

- **RUNDA-2 / poza plikami:** walidacja komend i transakcyjnosc mutacji (`session.rs`) - brak zrodla w `order.ts`; wymaga wskazania plikow web (np. mutatory `main.ts`, katalog `P2-5`). Nie zgaduje.
- **Brak wiringu do petli gry** (`bridge.rs`, `playable.rs`) - P7. `Porzadek` nie jest jeszcze wolany przez `turn_economy.rs`.
- **Nie zmierzono zachowania w przegladarce** (temat logiki, nie wizualny).
- `HexLike.nakladka` uzywa `start_position::Overlay` (z P6.1C); pozniejszy temat moze go przeniesc do wspolnego modulu.
- Wektory nie obejmuja wartosci `null` jako wiersza parametru w `society-params.json` (`pick(null, ...)` w webie rzuca `TypeError`; port zwraca wartosc domyslna) - przypadek niedopuszczalny w prawdziwym pliku.
- Rownolegle tematy (P6.1B/P6.1D) dotykaja `data/derived.rs` i `domain/mod.rs`: moje zmiany sa addytywne (koniec pliku / 1 linia) - konflikty rozwiaze orkiestrator.
