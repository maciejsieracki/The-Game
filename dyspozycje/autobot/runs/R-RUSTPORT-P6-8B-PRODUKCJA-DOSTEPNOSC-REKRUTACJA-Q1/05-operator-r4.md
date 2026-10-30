STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P6-8B-PRODUKCJA-DOSTEPNOSC-REKRUTACJA-Q1 (pozostaje OTWARTY; P2 niewykonane, zgodnie z dispatchem r4 -> 8B2)
GOAL: P6.8B-P1b-c2 (r4): `availableProduction` (923–1135), `availableReplacementsFor` (1136–1252), `setPaused` (1990), `manpowerCostOf` (1985) @91dc998a; pola `wstrzymana`/`rekrutacja` w `CityProduction`. Wektory z uruchomionego weba (prawdziwy `production.ts` przez loader TS), testy NaN/progow/brakujacych kluczy, mutacje na galeziach sterujacych.
ZMIANY/COMMIT:
- `9040d3bca` c2a: `manpower_cost_of`, `set_paused`, `CityProduction.{wstrzymana,rekrutacja}`; wektory `p1b-c2a.json`; test `p6_8b_c2a_vectors.rs`; generator `gen-p6-8b-c2a-vectors.mjs`; mutacje `mut-p6-8b-c2a.py`.
- `88991f78b` c2b: `available_replacements_for`, `ReplaceAvailabilityCtx`, `UnitReplaceRow`, `replacement_name_compare` (localeCompare ICU dla diakrytykow); wektory `p1b-c2b.json`; test `p6_8b_c2b_vectors.rs`; generator `gen-p6-8b-c2b-vectors.mjs`; mutacje `mut-p6-8b-c2b.py`.
- `fbd9faf12` c2c: `available_production`, `ProductionAvailabilityCtx`, `BuildingAvailRow`; wektory `p1b-c2c.json`; test `p6_8b_c2c_vectors.rs`; generator `gen-p6-8b-c2c-vectors.mjs`; mutacje `mut-p6-8b-c2c.py`.
- Dokument tematu `dyspozycje/rust-port/p6/P6-8B-PRODUKCJA-DOSTEPNOSC.md` (tabela stanu, zalozenia, rownowazniki) -- commit raportu (SHA w odpowiedzi orkiestratora).
- Allowlista zachowana: zero zmian w `gra/**`, `rust-port/renderer/**`, `src-tauri/**`, `Cargo.toml`, `WERSJE.md`. Pliki zmienione: `rust-port/engine/src/domain/production_units.rs`, nowe pliki testow/wektorow/generatorow/mutacji w `rust-port/engine/tests/` i w runie.
- Numer raportu: dispatch wymagal `01-operator-r1.md`, ale ten plik istnieje (raport r1 z poprzedniej rundy) -- nie nadpisywano historii; raport zapisany jako `05-operator-r4.md`.

TESTY (katalog `rust-port/engine`, CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0):
- `p6_8b_c2a_vectors`: 5 passed (manpowerCostOf 10780 przypadkow, setPaused 14).
- `p6_8b_c2b_vectors`: 4 passed (2592 przypadki, 1278 niepustych; zbior realny + syntetyczny; test zgodnosci localeCompare z 5 parami zmierzonymi w Node).
- `p6_8b_c2c_vectors`: 1 passed (700 przypadkow, 5982 pozycje-budynki; zbior realny + syntetyczny; 320 kontekstow siatki + 126 kontekstow lancuchow upgradeFrom).
- Regresja: `--lib` 6 passed; `p6_8b_helpers_vectors` 18 passed; `p6_8b_p1b_vectors` 7 passed.
- `cargo clippy --lib --test p6_8b_c2a_vectors --test p6_8b_c2b_vectors --test p6_8b_c2c_vectors -- -D warnings`: Finished, rc 0 (przed ostatnim `cargo fmt`, ktory byl tylko formatowaniem).
- `cargo fmt --all -- --check`: rc 0.
- `git diff --check`: rc 0.
- Mutacje (wszystkie na galeziach sterujacych; zrodlo przywracane bajt w bajt, `restored_bytes_identical True`):
  - c2a M1-M5: 5 KILLED.
  - c2b M1-M15: 14 KILLED; M14 (poziom 2 diakrytykow usuniety) SURVIVED = rownowaznik na dziedzinie (poziom 3 z fallbackiem UTF-16 daje ten sam porzadek, bo bazowa litera ASCII < znak >= 0x80).
  - c2c B1-B23 (B20 pominiete: wzorzec zduplikowany z c2b, ta sama galaz zapasu): 21 KILLED (w tym B16b); B16 SURVIVED (asymetryczny komparator, zmiana tylko galezi (B,J) nie zmienia wyniku przy wejsciu budynki-przed-jednostkami; ryzyko resztkowe) i B17 SURVIVED (`level` NaN: `item_cost` normalizuje nie-skonczony poziom do 1 jak web = rownowaznik).
- Klasa COMPILE-ERROR: 0 przypadkow.

BLOKADY:
- P2 (28 symboli: `enqueueRecruitment` ... `cityMoneyOutput`, 2004–2541) NIE wykonane w tej rundzie; wg dispatchu r4 wydzielone do 8B2 po zamknieciu B3 (`recruitment.rs`). Temat 8B pozostaje OTWARTY.
- Brak blokad technicznych.

ZALOZENIA (rozstrzygniete w dokumencie, nie pytane):
1. `replacement_name_compare` = localeCompare (ICU en-US) dla nazw z diakrytykami: poziom 1 = strip_diacritics + ł->l wg `locale_compare`; poziom 2 = liczba diakrytykow; poziom 3 = `locale_compare` na oryginalach. Zmierzone 5550/5550 par nazw z `units.json`; poza tym zbiorem NIE zweryfikowane.
2. `ctx.epoch` / `ctx.buildingLevel` nie-skonczone = 1 (web `Number.isFinite`).
3. `ctx.civKey`: None = `undefined`, Some(None) = `null`.
4. `units` w kolejnosci `data.units`; `findUnit` = pierwszy wpis.
5. Markery kosztu, tempo i trudnosc: wektory z pustymi markerami/tempem (default ownerId 0, normal); sciezki markerow pokryte testami B2 (`unit_money_cost_web`, `building_work_cost_web`), nie wektorami c2.
6. Kolejnosc sortowania przy wejsciu budynki-przed-jednostkami: Rust stabilny sort; komparator zwraca Less/Greater miedzy typami (zgodnie z webem).

RUNDY: 4/5 (licznik z naglowka dispatchu, autorytatywny). Liczniki wewnetrzne: r4 operatora = 1 przebieg implementacji.

NASTEPNY KROK: Evaluator i Final Control dla c2a/c2b/c2c (`9040d3bca`, `88991f78b`, `fbd9faf12`); potem Operator 8B2 (P2, 28 symboli) po zamknieciu B3 (`recruitment.rs`, doc §4). Uwaga dla Evaluatora: wektory c2c/c2b zawieraja zbior syntetyczny (kopia `units.json` + 1-3 wiersze testowe) -- zrodlo jest generatorem w runie, dane realne nie sa modyfikowane.

DEPLOY/PUSH: NIE WYKONANO
