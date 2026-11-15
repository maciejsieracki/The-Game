# 02a — Obrona Operatora r1 · R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (grafika / adapter DTO renderera)
TEMAT: R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES
GOAL: cities[]+owners[] → City+CityRenderOptions, PlacedWonder+WonderRenderOptions, OwnerEmblemContext (civ_id=None dla barbarzyńców), CityBadgeDto → CityMapBadgeInput, mgła miast i cudów z FogSets
ZMIANY/COMMIT: rust-port/renderer/tests/view_adapter_cities.rs (fixture odznak + 1 test), ten raport; gałąź lokalna wip/R-RUSTPORT-P4-1G-Q3-ADAPTER-CITIES-r1-obrona, rodzic 7f92fdee1 (kod Operatora r1), baza tematu 601ff304c
TESTY: cargo fmt --check EXIT 0; cargo clippy --all-targets -- -D warnings EXIT 0; cargo test --all-targets --no-fail-fast EXIT 0 (65 linii „test result”, 519 passed / 0 failed / 0 ignored); view_adapter_cities 17/17
BLOKADY: brak
RUNDY: 1/5 (obrona po Evaluatorze r1)
NASTĘPNY KROK: Final Control r1
DEPLOY/PUSH: NIE WYKONANO
```

Kod adaptera (`rust-port/renderer/src/view/cities.rs`, `view.rs`) nie zmienia się w tej obronie. Zmieniłem tylko fixture testu i dodałem jeden test.

## Odpowiedzi na zarzuty Evaluatora r1

### Z1. Brak produkcyjnego wołającego. Odpowiedź: PRZYJMUJĘ w części dokumentacyjnej, kodu nie zmieniam.

Dowód, że to zgodne z zakresem: dispatch §ZAKRES pkt 4 mówi „integrator R5 jest poza zakresem”. Rozpoznanie `P4-1G-ADAPTER-ROZPOZNANIE.md` §7 mówi „NIE wdrażam”, a §4 mówi, że R1–R6 są tematami renderera, nie adaptera. Allowlista nie obejmuje `models/cities/renderer.rs` ani pętli synchronizacji mapy.

Gdzie ma trafić wpięcie (do przypisania przez orkiestratora, bo dziś nie ma tych ID w planie):

| Wejście adaptera | Odpowiednik w pinie | Temat wpięcia |
|---|---|---|
| `CityInputs::sync`, `sync_map_outlines`, `apply_city_fog` | `cityRenderer.sync(cities, _cityRenderOpts())` (`main.ts:3007`) oraz `syncStatChips` (`main.ts:14563`, `:32265`) | integrator pętli synchronizacji mapy (orkiestrator dopisuje go do planu P4; rozpoznanie §4 mówi „trzeba je dopisać do planu P4”) |
| `city_badge_input` | `CityRenderer.syncStatChips` (`render/cities.ts:875-929`) | **R5** (rozpoznanie §4, wiersz R5) |
| `WonderInputs::sync`, `apply_wonder_fog` | `wonderRenderer.sync(…, {ownerColorFn: civColorFn})` (`main.ts:4316`) | ten sam integrator pętli mapy co miasta |
| `owner_emblem_context`, `atlas_owner_emblem_context` | `setOwnerEmblemResolver` (`main.ts:10373-10384`), konsument: żetony jednostek | **R1** (rozpoznanie §4, wiersz R1) oraz Q6 (`R-RUSTPORT-P4-1G-Q6-ADAPTER-UNITS`) |

Zbiorczo dla orkiestratora: #216 (P4-1G) zamyka adapter. Wpięcie to R1, R5 i integrator pętli mapy. Nie mają jeszcze numerów zadań.

### Z2. Fixture'y ręczne, parytet bajtowy z webem nie zmierzony. Odpowiedź: ODRZUCAM jako defekt, ale zapisuję NIE_ZMIERZONO.

Dowód: dispatch §WEKTORY wymaga „wartości oczekiwane z definicji pinu (zapisz plik:linia)”. Nie wymaga uruchamiania webu. Rozpoznanie §7 mówi „testy na ręcznie zbudowanych DTO (fixture'y w `tests/`)”. Każda wartość w fixture ma cytat plik:linia. Evaluator to potwierdził.

NIE_ZMIERZONO: parytet bajtowy całego łańcucha web → DTO → renderer. Do zrobienia jako test end-to-end po producencie B-1B (rozpoznanie §6), poza tym tematem.

### Z3. Adapter jest ściślejszy niż pin (brak fallbacku). Odpowiedź: ODRZUCAM jako rozbieżność z pinem. Wpis do rejestru należy do orkiestratora.

Fallback z pinu jest u producenta, nie w adapterze:

- `civTypeForOwner` zwraca `'grecy'` jako fallback (`main.ts:4044-4045`), a `ikonaIdToBronzeCiv` ma fallback `?? 'grecja'` (`render/bronzeCity.ts:38-40`). Oba działają przed DTO. Producent B-1E zapisuje w `owners[].bronze_civ` wynik już po fallbacku. Dlatego klucz spoza `BronzeCiv` łamie kontrakt i nie jest przypadkiem fallbacku. Opis typu jest w `cities.rs:53-56`.
- `civColorForOwner` sięga po paletę `OWNER_COLORS_FALLBACK` (`game/civ-visual.ts:59-70`). Producent liczy to do `owners[].color`, więc adapter tylko czyta liczbę.
- `MissingOwner`: w pinie każdy `ownerId` miasta ma era, cywilizację i kolor z funkcji. W DTO te wartości są tylko w `owners[]`. Bez wpisu adapter musiałby je wymyślić.

Proponowany wpis do `dyspozycje/rust-port/REJESTR-RUST.md` (plik spoza allowlisty, więc wpisuje orkiestrator): „P4-1G-Q3: fallbacki `civTypeForOwner` → 'grecy', `ikonaIdToBronzeCiv` → 'grecja' oraz `OWNER_COLORS_FALLBACK` są po stronie producenta DTO. Adapter odrzuca nieznany `bronze_civ` (`UnknownBronzeCiv`) i miasto lub cud bez wpisu w `owners[]` (`MissingOwner`) jako naruszenie kontraktu.”

### Z4. Liczby testów w raporcie Operatora. Odpowiedź: ODRZUCAM; dodaję pełny pomiar.

Pomiar na tej gałęzi (7f92fdee1 + obrona), `rust-port/renderer`, z flagami `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0` i z własnym `CARGO_TARGET_DIR`:

- `cargo test --all-targets --no-fail-fast` daje EXIT 0, **65** linii `test result` i **65** linii `Running`. To 1 lib + 64 pliki `tests/*.rs` (`ls tests/*.rs | wc -l` = 64). Wynik: **519 passed / 0 failed / 0 ignored**.
- 519 = 518 Operatora + 1 nowy test z tej obrony (`fixture_badges_follow_their_owner`). Liczby Operatora (65 i 518) dla 7f92fdee1 się zgadzają.
- Wyniku Evaluatora (69 i 563) nie odtworzyłem. Drzewo `tests/` w worktree Evaluatora ma 67 pozycji, tak samo jak tutaj. Różnica wynika prawdopodobnie ze sposobu zliczania, na przykład z doklejonego logu albo współdzielonego `CARGO_TARGET_DIR`. NIE_ZMIERZONO, która to przyczyna.

### Z5. Ta sama odznaka we wszystkich miastach. Odpowiedź: PRZYJMUJĘ.

Poprawka w `tests/view_adapter_cities.rs`:

- `city()` przyjmuje odznakę jako parametr.
- Miasto własne ma `badge("Roma")`, czyli rzymianie, `0x1e88e5`, era 2, palisada, tier 1, wzrost liczony.
- Nowe `foreign_badge()` to Memfis: `civ_icon_id` = `egipt`, `0x43a047`, era 3, mur kamienny (tier 2). Wzrost to `None`/`false`, bo pin liczy go tylko dla miast gracza (`render/cities.ts:903`, `:913-914`).
- Nowe `barbarian_badge()` to Obóz: `civ_icon_id` = `grecy` (`civTypeForOwner(-1)` → `aiOwnerCivMap.get ?? 'grecy'`, `main.ts:4045`, `:2983`), `0x757575`, era 1, tier 0. Nie ma produkcji (`front = null`, `cities.ts:899-917`) i nie jest stolicą.
- Nowy test `fixture_badges_follow_their_owner` sprawdza każde miasto z fixture. `civ_icon_id`, `owner_color` i `era` odznaki muszą się zgadzać z wpisem `owners[]` jego właściciela. `defense_tier` musi być równy `defenseTierFromWallKind(wall_kind)` (`cityMapStatChip.ts:379-383`). Obce miasta i barbarzyńcy nie mają wzrostu. `city_badge_input` musi zachować te pola.

Mutacje sprawdzające nowy test (po każdej plik przywrócony; `cmp` = RESTORED, `git checkout` dla `src`):

| ID | Mutacja | Wynik |
|---|---|---|
| M6 | fixture: `foreign_badge().civ_icon_id = "rzymianie"` | FAIL: `fixture_badges_follow_their_owner` (16 passed / 1 failed) |
| M7 | adapter: `era: Some(1.0)` zamiast `Some(b.era)` w `city_badge_input` | FAIL: 3 testy (`fixture_badges_follow_their_owner`, `badge_maps_every_dto_field`, `badge_each_field_reaches_the_input`) |

### Z6. Współdzielony `CARGO_TARGET_DIR`. Odpowiedź: PRZYJMUJĘ dla tej rundy.

Ta obrona użyła własnego katalogu `…/scratchpad/tgt-q3-obrona`, który usunąłem po bramkach (`rm -rf`). Wolne miejsce na dysku po usunięciu: 7,2 GB. Wspólnego `…/scratchpad/tgt` nie usunąłem. W chwili sprawdzenia używał go aktywny proces `cargo test` innego Operatora (worktree `wf_c9f7943e-b13-4`, Q2 teren), więc usunięcie przerwałoby jego bramkę. Sprzątanie tego katalogu zostaje dla orkiestratora, gdy żaden `cargo` z niego nie korzysta.

## Bramki (ta obrona)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --all-targets --no-fail-fast` | EXIT 0: 65 binarek, 519 passed / 0 failed / 0 ignored |
| `view_adapter_cities` | 17/17 |
| `git diff --check` | czysto |
| `#[ignore]` w `view_adapter_cities.rs` | 0 |
| `Cargo.lock` | lokalna zmiana cofnięta (`git checkout`), niezacommitowany |
| Diff względem 7f92fdee1 | tylko `rust-port/renderer/tests/view_adapter_cities.rs` i ten plik |
