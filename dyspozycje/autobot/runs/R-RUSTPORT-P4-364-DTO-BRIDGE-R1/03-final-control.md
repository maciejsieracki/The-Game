# R-RUSTPORT-P4-364-DTO-BRIDGE-R1 — Final Control r1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, warstwa DTO 3D)
TEMAT: R-RUSTPORT-P4-364-DTO-BRIDGE-R1
GOAL: warstwa `engine::domain::dto_bridge` liczy z `PlayableState` mgłę (`FogViewDto`, `fog_active`), odkrycie L1/L2 (`FogRevealDto`) i zasięgi terytorium (`TerritoryRangesDto`) aktywnego fotela ME(), zgodnie z pinem `07d2fbd72`.

## ZMIANY/COMMIT

- SHA ocenione (koniec gałęzi): `38faba89ae7b11197ea9e277283990a332c5ff51` (obrona r1); kod: `13ed6c880` i poprawka testów `41aaac6be`.
- Baza z dispatchu: `e2a2c4e2f`. `git merge-base --is-ancestor e2a2c4e2f 38faba89a`: TAK.
- Łańcuch: e2a2c4e2f → 13ed6c880 (kod) → 7ceb27096 (01) → c329f329d (02) → 41aaac6be (test 7b) → 38faba89a (02a) → ten raport.
- `git diff --stat e2a2c4e2f 38faba89a`: 8 plików, wszystkie z allowlisty: `dto_bridge.rs` (nowy), `domain/mod.rs` (jedna linia `pub mod dto_bridge;`), `tests/p4_364_dto_bridge.rs`, `tests/p4_364_dto_bridge_gen.mjs`, `tests/p4_364_dto_bridge_vectors/vectors.json`, raporty w katalogu runs. Bez `Cargo.lock`, `gra/`, `bridge.rs`, renderera i view-model. Brak `#[ignore]` w nowym teście. `git diff --check` (bez JSON) czysto.

## TESTY (niezależnie, na 38faba89a; env CARGO_INCREMENTAL=0, DEBUG=0, target w scratchpadzie, usunięty)

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_dto_bridge` | 5/5, EXIT 0 |
| `node tests/p4_364_dto_bridge_gen.mjs --check` | OK, 12 przypadków zgodnych |
| `cargo test --all-targets --no-fail-fast` (engine) | EXIT 0; 523 binarki, 3902 passed, 0 failed, 1 ignored (`e2e::dump_tick1_econ_for_web_generator`, sprzed tematu) |

Liczba 3902 różni się od 4038 z raportu Evaluatora. To inny sposób liczenia (sumowanie linii `test result`). Wynik bramki jest taki sam: EXIT 0, 0 FAILED.

Własne mutacje FC (każda przywrócona, drzewo czyste):
- M1: `me` w filtrze terytorium = fotel 0 zamiast `active_seat`. FAIL: `p4_364_vectors_match_pinned_web` i `p4_364_f2_vectors_through_playable_state`.
- M2: klucze rzek sortowane `(q, r)` zamiast `(r, q)` (kolejność kontraktu). FAIL: `p4_364_vectors_match_pinned_web`.

Odczyt pinu: `main.ts:13074-13080` (`startRevealKeysForRiverFog`: `undefined` przy braku heksu startu albo gdy fotel nie czeka na pierwsze miasto), `:13485-13506` (`useFogRender = fogOn || revealAllLand`; `setFog(..., {landReveal, riverRevealKeys})` lub `setFog(ALL_KEYS, ALL_KEYS)` bez opcji) i `:15595-15600` (filtr terytorium: `isMe` → `!fogOn` → vis ∪ explored). `build_fog_layers` i `build_territory_layers` odwzorowują te gałęzie 1:1 i korzystają z istniejących `refresh_fog`, `compute_visible_at`, `fort_territory_nodes` oraz `territory_ranges_dto`, bez kopiowania logiki.

## ORZECZENIA

| # | Zarzut | Orzeczenie | Uzasadnienie |
|---|---|---|---|
| 0 | Bramki Evaluatora i mutacje | ODDAL | Potwierdzenie, a nie wada. FC powtórzył bramki na końcowym SHA, w tym pełny test (wynik wyżej). |
| 1 | Brak wołającego produkcyjnego | ODDAL | Wprost w zakresie dispatchu: D-364-2 i §6 zabraniają zmian `EngineCommand`/`BridgeResult`. Uwaga dla orkiestratora: w rejestrze wpisać status „ZINTEGROWANE-API (bez wołającego; wpięcie = #364 r2)”. |
| 2 | Kolejność właścicieli vs `collect_territory_hex_keys_by_owner` | ODDAL | Port engine zwraca `BTreeMap`, więc nie ma w nim kolejności wstawiania do porównania. Kolejność `Map` z pinu sprawdza asercja `byOwner` na 12 wektorach wykonanych z pinu. Równość zbiorów z portem engine jest sprawdzona osobno. |
| 3 | D-BR-1/2/3 (sygnatury) | ODDAL | Zgodne z pinem (`:15597` czyta `fogOn`, filtr wymaga `currentVisible()`). Inaczej niż w sygnaturze dispatchu, ale dispatch wymaga zgodności z pinem. Mutacja (d/e) potwierdza różnicę. Wpis do REJESTR-RUST robi orkiestrator przy integracji. |
| 4 | D-BR-5: wektor L1/L2 `fog_off_no_reveal_awaiting` | ODDAL (w tym temacie) | FC potwierdził, że `main.ts:13506` woła `setFog(ALL_KEYS, ALL_KEYS)` bez opcji, więc warstwa jest zgodna z pinem. Korekta wektora L1/L2 (renderer) wykracza poza allowlistę i będzie osobnym tematem (propozycja: L1/L2-FOGOFF-VEC). |
| 5 | `overlays_view::awaiting_first_city` tylko dla fotela 0 | ODDAL (w tym temacie) | Plik jest poza allowlistą. Osobny temat (propozycja: OVERLAYS-AWAITING-SEAT, pokrewny #253/#281). |
| 6 | Martwy `MissingStartHex` | ODDAL | Wariant wymaga dispatch (§4). Pin zwraca `undefined`, a producent `None`, co jest zgodne z pinem. Wariant oznaczono jako zarezerwowany. Usunięcie albo użycie to techniczna decyzja orkiestratora w r2. |
| 7a | Pominięte scenariusze F2 z -1/-99 | ODDAL | `PlayableState` nie przechowuje tych właścicieli. Pokrywa je test producenta F2 w view-model. Luka jest jawna. |
| 7b | Brak przypadku fogOn=false + revealAllLand=true + awaiting | ODDAL (naprawione) | Dodane w `41aaac6be` (wektor z pinu, 12 przypadków). FC sprawdził przez `gen.mjs --check` i test 5/5. |

Brak zarzutów do NAPRAWY. Brak spraw wymagających decyzji człowieka: punkty 1, 3, 4, 5 i 6 to decyzje techniczne orkiestratora albo osobne tematy.

## BLOKADY

Brak. Uwagi do integracji: wpisy D-364-1..3 i D-BR-1..5 w `REJESTR-RUST.md`, status „ZINTEGROWANE-API”, osobne tematy L1/L2-FOGOFF-VEC i OVERLAYS-AWAITING-SEAT. Gałąź `rust-port-wip/364-dto-bridge-r1` jest tylko lokalnie (według Obrony). Zabezpieczenie (`refs/keep`) robi orkiestrator.

RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na `rust-port/parity-v2` od bazy `e2a2c4e2f`), wpisy w rejestrze, sprzątanie worktree.
DEPLOY/PUSH: NIE WYKONANO
