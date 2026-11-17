# R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1 — Obrona Operatora r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-1F2-TERRITORY-RANGES-R1
GOAL: zasięgi terytorium w adapterze nakładek (`TerritoryRangesDto`), zgodne z webem (pin `07d2fbd72`).
ZMIANY/COMMIT: gałąź `rust-port-wip/p4-1f2-territory-ranges-r1-obrona` od `51e58037d` (raport Evaluatora, rodzic `0f683d9cc` = kod Operatora, baza `82db9b370`). Pliki: generator `rust-port/renderer/tests/territory_ranges_f2_gen.mjs` (+2 scenariusze), wynik generatora `territory_ranges_f2_vectors/vectors.json`, `rust-port/renderer/tests/territory_ranges_f2.rs` (liczba scenariuszy 8 → 10), `rust-port/view-model/src/territory_ranges_view.rs` (tylko komentarz modułu, zarzut 5), ten raport. Kod produkcyjny bez zmian logiki. Bez `Cargo.lock`.
TESTY: niżej (wszystkie EXIT 0).
BLOKADY: brak. Zarzuty 3, 4, 6 wymagają wpisu lub decyzji orkiestratora (patrz niżej).
RUNDY: 1/5
NASTĘPNY KROK: Final Control.
DEPLOY/PUSH: NIE WYKONANO.

## Odpowiedzi na zarzuty

### 1. Brak wektora dla `Math.floor` populacji — PRZYJMUJĘ

Poprawka: nowy scenariusz `pop_fraction_floor` w generatorze (wykonuje pin): `city(3,4,owner 0,pop 0.5)`, `city(12,8,owner 1,pop 7.6)`, `city(20,4,owner 2,pop 5.5)`, mgła wyłączona.
Wynik pinu: owner 0 ma 1 heks (floor 0.5 = 0, promień 0, tylko centrum; round dałby promień 5), owner 1 ma 144 heksy (promień 7, round dałby 8), owner 2 ma 66 heksów (promień 5, round dałby 6).
Dowód (mutacje w `territory_ranges_view.rs`, plik przywrócony i porównany przez `cmp`):

| Mutacja | Przed obroną | Po obronie |
|---|---|---|
| `population.floor()` → `.round()` | PRZEŻYWA (8 passed) | FAIL (`by_owner_matches_pin`, `borders_match_pin`) |
| `population.floor()` → `.ceil()` | nie badano | FAIL (te same 2 testy) |

### 2. Brak wektora dla remisu `seq` przy równym `turn` — PRZYJMUJĘ

Poprawka: nowy scenariusz `fort_order_seq_tie`: fort-fort (`{turn 3, seq 1}` u obu, właściciele 0 i 1), posterunek-posterunek (`{turn 5, seq 0}`, właściciele 2 i 3) oraz posterunek przed fortem (`{turn 7, seq 2}`, właściciele 3 i 2). Każda para walczy o wspólne heksy. W pinie `o.seq < b.seq` daje false, więc heks zostaje u pierwszego w tablicy.

| Mutacja | Przed obroną | Po obronie |
|---|---|---|
| `o.seq < b.seq` → `<=` | PRZEŻYWA (8 passed) | FAIL (`by_owner_matches_pin`, `borders_match_pin`) |
| `o.turn < b.turn` → `<=` | — | przeżywa: mutant RÓWNOWAŻNY. Gałąź działa tylko przy `turn != b.turn` (`o.turn == b.turn` idzie do `seq`), więc `<` i `<=` dają ten sam wynik. Odwrócenie `>` (Evaluator) daje FAIL. |

### 3. Zakres p.1 „z `PlayableState`” niespełniony, brak wołającego produkcyjnego — ODRZUCAM jako wadę rundy (fakt potwierdzony, rozwiązanie leży poza allowlistą)

Dowód: `rust-port/view-model/Cargo.toml` zależy tylko od `serde` (D-DTO-1), więc crate view-model nie może czytać `PlayableState` (`rust-port/engine`). Producenci z `PlayableState` są w `engine/src/domain/*_view.rs`, a `engine/` jest poza allowlistą dispatchu. Dispatch wymaga przy tym „nic więcej” poza allowlistą. Producent bierze więc jawne wejścia (`hex_order` = klucze `map.hexes`, węzły `buildAllTerritoryNodes`, zbiory mgły aktywnego fotela), które silnik już ma (FOG-VIEW, `hex_order`). Wpięcie należy do tematu DTO-BRIDGE (#364) albo FOG-WIRE.
Wymagany wpis orkiestratora w `REJESTR-RUST.md`: „F2: producent bez wołającego produkcyjnego; wpięcie w DTO-BRIDGE/FOG-WIRE (engine `overlays_view.rs` → `territory_ranges_dto`)”.

### 4. `vectors.json` poza literą allowlisty — ODRZUCAM jako naruszenie (wymaga zatwierdzenia orkiestratora)

Dowód: plik jest bajt w bajt wynikiem generatora z allowlisty. `node rust-port/renderer/tests/territory_ranges_f2_gen.mjs --check` daje EXIT 0 („vectors.json matches the pin”). Test czyta go przez `include_str!`. Bez tego pliku p.3 dispatchu („wektory z pinu, generator `.mjs`”) jest niewykonalny. Ten sam układ ma precedens G5 (`*_vectors/vectors.json` obok generatora). Proszę orkiestratora o zatwierdzenie w rejestrze.

### 5. Trzecia kopia `territoryOwnerAt` / `cityRangeForPopulation` / `collectTerritoryHexKeysByOwner` — PRZYJMUJĘ CZĘŚCIOWO (dokumentacja teraz, test równoważności przy wpięciu)

Fakty potwierdzone: `engine/src/domain/territory.rs:229` (`territory_owner_at`), `:469` (`collect_territory_hex_keys_by_owner`), `terrain.rs:251` (`city_range_for_population -> f64`), `trade.rs:589` (prywatny `territory_owner_at`). Engine ma komentarze z pinem `4bbef081d`, a nie `07d2fbd72`.
Czego nie da się zrobić w tej rundzie: test równoważności engine ↔ view-model wymaga zależności od obu crate'ów, a `engine/` leży poza allowlistą. View-model nie może zależeć od engine (D-DTO-1). Kopii w view-model nie da się też zastąpić kopią z engine. Kopia z engine sortuje (`BTreeMap`), a web zachowuje kolejność wstawiania `Map`, więc kopia z engine dałaby inną kolejność właścicieli i krawędzi niż pin.
Poprawka w tej rundzie: komentarz modułu `territory_ranges_view.rs` wskazuje wszystkie kopie, a przy wpięciu wymaga testu równoważności engine `territory_owner_at` ↔ view-model na wektorach F2.
Propozycja D-F2-4 do rejestru: źródłem prawdy dla nakładki (kolejność, mgła) jest kopia view-model, sprawdzana bezpośrednio wektorami z pinu `07d2fbd72`. Silnik zostaje źródłem prawdy dla reguł gry, a temat wpięcia dodaje test równoważności właściciela heksa na tych samych wektorach. Decyzję wpisuje orkiestrator.

### 6. Trailer z nazwą modelu — ODRZUCAM jako zarzut do tej rundy (do orkiestratora)

Dotyczy tylko metadanych commitu, nie kodu. Reguła atrybucji sesji (system harnessu) każe kończyć commit trailerem `Co-Authored-By: Claude Opus 5.5 …`. Instrukcje użytkownika (CLAUDE.md) nie zmieniają tej reguły, a dispatch nie ma autorytetu użytkownika. Commit `0f683d9cc` jest na gałęzi innego worktree, więc przepisanie jego historii przez Obronę złamałoby izolację. Commit obrony stosuje tę samą regułę sesji. Orkiestrator może przy integracji zrobić squash lub merge z własnym trailerem.

## Bramki (CARGO_INCREMENTAL=0, CARGO_PROFILE_DEV_DEBUG=0, CARGO_PROFILE_TEST_DEBUG=0, CARGO_TARGET_DIR w scratchpadzie poza repo, usunięty po bramkach; dysk 14 GB wolne przed bramką pełną, bez równoległych buildów)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` view-model / renderer | EXIT 0 / EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` view-model / renderer | EXIT 0 / EXIT 0 |
| `cargo test --test territory_ranges_f2` | EXIT 0, 8 passed, 0 failed (10 scenariuszy) |
| `cargo test --all-targets --no-fail-fast` view-model | EXIT 0, 13 binarek, 109 passed, 0 failed |
| `cargo test --all-targets --no-fail-fast` renderer | EXIT 0, 79 binarek, 680 passed, 0 failed |
| `node …/territory_ranges_f2_gen.mjs --check` | EXIT 0 |

Po zmianie komentarza (zarzut 5) ponowiono `fmt --check` i `clippy` dla view-model oraz test `territory_ranges_f2`: wszystkie EXIT 0.

Wyjście generatora (właściciel:heksy, krawędzie), nowe scenariusze:
- `pop_fraction_floor`: `2:66 1:144 0:1`, krawędzie `60 88 6`
- `fort_order_seq_tie`: `2:88 3:52 0:91 1:44`, krawędzie `102 80 66 58`
