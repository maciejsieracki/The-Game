# R-RUSTPORT-P4-364-DTO-BRIDGE-R1: obrona Operatora r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-DTO-BRIDGE-R1
GOAL: warstwa `engine::domain::dto_bridge` liczy z `PlayableState` mgłę, odkrycie rzek i zasięgi terytorium aktywnego fotela ME() zgodnie z pinem `07d2fbd72`.
ZMIANY/COMMIT: `41aaac6be` (poprawka testu, zarzut 7b) na `c329f329d` (raport Evaluatora) ← `7ceb27096` ← `13ed6c880` (kod) ← baza `e2a2c4e2f`. Pliki: `rust-port/engine/tests/p4_364_dto_bridge.rs`, `rust-port/engine/tests/p4_364_dto_bridge_gen.mjs`, `rust-port/engine/tests/p4_364_dto_bridge_vectors/vectors.json`. Wszystkie są na allowliście. Kod produkcyjny (`dto_bridge.rs`, `mod.rs`) bez zmian.
TESTY: zob. §Dowody.
BLOKADY: poza zakresem r1 (zarzuty 1, 4, 5, 6, 7a): decyzje lub tematy dla orkiestratora, opisane niżej.
RUNDY: 1/5 (obrona)
NASTĘPNY KROK: Final Control r1.
DEPLOY/PUSH: NIE WYKONANO

## Odpowiedzi na zarzuty

### 0. Niezależne bramki Evaluatora: PRZYJMUJĘ (bez poprawki)
Evaluator zmierzył pełny `cargo test --all-targets --no-fail-fast`: 4038 testów, EXIT 0. U Operatora ten wynik był NIE_ZMIERZONO, więc pomiar Evaluatora go zastępuje. Moja poprawka zmienia wyłącznie test `p4_364_dto_bridge` i jego wektory. Kod biblioteki ani inne testy się nie zmieniły, więc pełnego zestawu nie powtarzałem (NIE_ZMIERZONO na `41aaac6be`; pomiar Evaluatora na `13ed6c880` obejmuje cały kod produkcyjny tego tematu).

### 1. Brak wołającego produkcyjnego: PRZYJMUJĘ (status), bez zmiany kodu
To prawda: `build_view_layers`, `build_fog_layers` i `build_territory_layers` wołają tylko testy. Tak wynika z dispatchu: D-364-2 przenosi kontrakt mostu (`EngineCommand`/`BridgeResult`) do r2, a §6 zabrania zmian w `bridge.rs`. Wniosek do rejestru: przy integracji status ma brzmieć „ZINTEGROWANE-API (bez wołającego produkcyjnego; wpięcie = #364 r2)”, a nie „wpięte”. Zgodnie z #309 nie wolno tu napisać „wpięte”.

### 2. Kolejność właścicieli tylko jako zbiór: ODRZUCAM (wymóg spełniony mocniejszym dowodem)
Port engine `collect_territory_hex_keys_by_owner` zwraca `BTreeMap`, więc z definicji nie niesie kolejności wstawiania. Porównanie kolejności z tą funkcją jest niewykonalne i nic by nie dowodziło. Kolejność wymagana przez pin to kolejność wstawiania do JS `Map` w `collectTerritoryHexKeysByOwner` (`main.ts:15595`). Test `p4_364_vectors_match_pinned_web` porównuje `by_owner_of(&layers.territory)` z `expected.territory` jako `Vec<(owner, Vec<hex>)>`, czyli razem z kolejnością właścicieli i heksów. Robi to dla 12 przypadków z uruchomionego pinu (`tests/p4_364_dto_bridge.rs`, asercja „byOwner”). Dowód czułości: mutacja (e) niżej łamie właśnie tę asercję. Porównanie z portem engine (zbiory i zbiór właścicieli) to drugi, niezależny dowód treści. Razem pokrywają cały wymóg: treść zgadza się z portem, a kolejność z pinem.

### 3. Odstępstwa D-BR-1/2/3 do REJESTR-RUST: PRZYJMUJĘ (wpis należy do orkiestratora)
Plik `REJESTR-RUST.md` jest poza allowlistą Operatora. Tekst do wpisu przy integracji:
- D-BR-1: `playerEverOwnedCityByOwner` (`main.ts:3042`) podaje wołający, bo `PlayableState` ma tylko flagę `gracz_kiedys_mial_miasto`.
- D-BR-2: filtr terytorium czyta `fogOn` (`main.ts:15597`), a nie `useFogRender`/`fog_active`. Dowody: mutacja (d) Operatora i mutacja (e) w tej obronie.
- D-BR-3: `build_territory_layers` przyjmuje `visible` (`currentVisible()`, `main.ts:15598`).

### 4. D-BR-5 i wektor L1/L2 `fog_off_no_reveal_awaiting`: PRZYJMUJĘ (osobna korekta poza allowlistą)
Potwierdzam na pinie, że `main.ts:13506` w gałęzi `!useFogRender` woła `setFog(ALL_KEYS, ALL_KEYS)` bez trzeciego argumentu. Scenariusz `rust-port/renderer/tests/reveal_l12_gen.mjs:252` (`fogOn:false, revealAllLand:false, awaiting:true`) mimo to podaje `riverRevealKeys`. Warstwa trzyma się pinu (`None`). Mój nowy przypadek pinu `mgla_wylaczona_awaiting` ma `setFogArgs = 2` i `riverRevealKeys = null`. Korekta generatora L1/L2 dotyczy plików renderera, które są poza allowlistą. Zgłaszam ją jako osobny temat (na przykład „L1/L2-FOGOFF-VEC”). Na wynik obrazu nie wpływa, bo adapter renderera ignoruje klucze przy wyłączonej mgle.

### 5. `overlays_view::awaiting_first_city` tylko dla fotela 0: PRZYJMUJĘ (osobny temat)
Plik jest poza allowlistą, więc go nie zmieniam. Ten moduł może po prostu wołać `dto_bridge::is_awaiting_first_city(state, seat, ever_owned_by_owner)`, które już działa per fotel. Proponowany temat to „OVERLAYS-AWAITING-SEAT”, pokrewny #253/#281. Warunek wstępny: zbiór `playerEverOwnedCityByOwner` musi znaleźć się w `PlayableState` albo w wejściach widoku. To ta sama decyzja co D-BR-1.

### 6. Martwy wariant `MissingStartHex`: PRZYJMUJĘ (decyzja w r2), bez zmiany kodu
Wariant wymaga dispatch (§4), a pin (`main.ts:13078`) przy braku heksu startu daje `undefined`, nie błąd. Producent nie może go więc zwracać bez złamania parytetu. Wariant jest jawnie opisany w komentarzu dokumentacyjnym jako zarezerwowany (D-BR-4). Do r2 jedna z dwóch decyzji: usunąć go albo zostawić na błędy wejścia mostu.

### 7a. Pominięte 3 scenariusze F2 z -1/-99: PRZYJMUJĘ jako znaną lukę (poza zakresem r1)
`PlayableState` nie przechowuje miast ani fortów barbarzyńców (-1) i rebeliantów (-99). Nie da się ich więc przepuścić przez warstwę bez rozszerzania stanu, a to jest poza allowlistą. Te scenariusze dalej pokrywa producent view-model (test F2 `renderer/tests/territory_ranges_f2_vectors`). Do r2/rejestru: wpięcie właścicieli specjalnych w `PlayableState`.

### 7b. Brak przypadku fogOn=false + revealAllLand=true + awaiting: PRZYJMUJĘ, poprawione w `41aaac6be`
- Nowy scenariusz `mgla_wylaczona_reveal_awaiting` w `p4_364_dto_bridge_gen.mjs` (me=1, miasta tylko fotela 0, everOwned=[0], fogOn=false, revealAllLand=true). Wektory wygenerowano z uruchomionego pinu, teraz jest 12 przypadków. Wynik pinu: `fogActive=true`, `setFogArgs=3`, `landReveal=true`, `awaiting=true`, 56 kluczy rzek (identycznych z `me1_rzeki_awaiting`), terytorium bez filtra (4 właścicieli: 118/26/127/58 heksów, przy mgle ON tylko 2 właścicieli: 16/5).
- Asercja liczby przypadków 11 → 12. Strażnik pokrycia `p4_364_vectors_cover_required_branches` sprawdza nowy przypadek: `fogActive`, `landReveal`, `awaiting`, niepuste klucze i równość z `me1_rzeki_awaiting`.
- Przypadek domyka realną lukę. Mutacja (g) niżej (klucze rzek tylko przy `fog_on`) przeszłaby przez 11 starych przypadków, bo jedyny stary przypadek z wyłączoną mgłą i `revealAllLand` (`mgla_wylaczona_reveal`) nie ma stanu awaiting. Teraz daje FAIL dokładnie na nowym przypadku.

## Dowody (na `41aaac6be`, env `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie)
- `cargo fmt --check`: EXIT 0
- `cargo clippy --all-targets -- -D warnings` (engine): EXIT 0
- `cargo test --test p4_364_dto_bridge`: 5 passed, 0 failed
- `node tests/p4_364_dto_bridge_gen.mjs --check`: `OK: 12 przypadkow zgodnych`
- `git diff --check`: czysto
- Mutacje w `dto_bridge.rs` (każda przywrócona, potwierdzone `cmp` z kopią):
  - (e) filtr terytorium na `fog.fog_active` zamiast `inputs.fog_on`: FAIL (`p4_364_vectors_match_pinned_web`, asercja byOwner, linia 483).
  - (f) odkrycie bramkowane `inputs.fog_on` zamiast `view.fog_active`: FAIL (linia 463, landReveal).
  - (g) `river_reveal_keys` tylko przy `inputs.fog_on`: FAIL `mgla_wylaczona_reveal_awaiting: riverRevealKeys` (linia 472).
- Pełny `cargo test --all-targets --no-fail-fast` na `41aaac6be`: NIE_ZMIERZONO (zmiana dotyczy tylko testu; pomiar Evaluatora: 4038/0 FAILED na kodzie `13ed6c880`).
- Nic nie pushowano, nic nie zintegrowano. `Cargo.lock` nie jest commitowany. Pliki `gra/` są nietknięte.
