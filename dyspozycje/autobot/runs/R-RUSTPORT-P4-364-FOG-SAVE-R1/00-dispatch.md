# R-RUSTPORT-P4-364-FOG-SAVE-R1 — zapis i odczyt odkrytej mgły (`exploredByHuman`) (DŁUG-364-FOG-SAVE)

STATUS: dispatch orkiestratora. Opus (3D), wszystkie etapy Opus. Decyzje techniczne podejmuje orkiestrator (reguła 8); web najpierw (reguła 11).
START: po zintegrowaniu RENDER-FRAME r2 (ten sam obszar `playable.rs`/sesji mgły) i przy dysku >= 8 GB.
BAZA: `origin/rust-port/parity-v2` (aktualny po RENDER-FRAME r2; wpisz SHA w raporcie; w chwili pisania `0941c8225`). Przed startem: `git fetch origin && git checkout -B <gałąź> origin/rust-port/parity-v2`.

## GOAL
Po `from_state`/wczytaniu zapisu mgła sesji (`PlayableFogSession::explored_by_human`) jest pusta, a web zapisuje i odtwarza odkrycie: `exploredByHuman: Array<[ownerId, string[]]>` w zapisie (`gra/src/main.ts:37229-37239` zapis, `:46385-46400` odczyt; typ `gra/src/game/save.ts:359-363`, normalizacja `:725`: brak => `[]`). Zapewnić rundę zapis → odczyt zachowującą odkrycie.

## DECYZJE ORKIESTRATORA (D-FOGSAVE)
- D-FS-1: ADDYTYWNY, opcjonalny klucz zapisu `exploredByHuman` (jak `citySiege`/`plannedMarches` w `SaveSnapshot`, `save_load.rs`; nazwa i kształt jak web: tablica par `[ownerId, [klucze "q,r"]]`), `#[serde(default, skip_serializing_if = "Vec::is_empty")]`: zapis sprzed zmiany bajt w bajt, `SaveSnapshot` nadal bez `Deserialize` (ścieżka wczytania przez istniejący loader/migracje). Wersja zapisu BEZ zmiany.
- D-FS-2: stan NIE wchodzi do `EngineState`/`GameStateDto` ani do replay (D-364-2 z r2 zostaje): wchodzi tylko do metadanych zapisu i jest wstrzykiwany do `PlayableFogSession` przy wczytaniu (nowy `restore_explored_by_human`-podobny krok w stylu `restore_playable_planned_marches`/`restore_playable_siege_wonders`).
- D-FS-3: odtworzenie jak web: fotel główny przez mutację istniejącego zbioru (semantyka aliasu `explored` z `main.ts:46385-46392`: w Rust brak aliasu, więc po prostu ustaw zbiór), pozostali właściciele nowy zbiór; klucze nieparsowalne -> jawny błąd wczytania z numerem pozycji (zakaz cichego pominięcia).
- D-FS-4: źródło danych zapisu: sesja mgły `PlayableGame` (w trakcie zapisu); jeśli API zapisu nie ma dostępu do sesji, dodaj parametr/metodę (opisz w raporcie), bez zmiany istniejących sygnatur publicznych poza addytywnymi.

## PIN (`07d2fbd72`)
`main.ts:37229-37239`, `:46385-46400`, `:13480-13483` (`addExplored`), `gra/src/game/save.ts:359-363,701,725`. Rust: `engine/src/domain/save_load.rs` (`SaveSnapshot`, wzorzec `citySiege`, `restore_*`), `engine/src/domain/playable.rs` (`PlayableFogSession`, `from_state`), `engine/src/domain/dto_bridge.rs`, `engine/src/domain/zapis_loader.rs` (ścieżka wczytania), `engine/src/bridge.rs`.

## ZAKRES / TESTY
1. Klucz zapisu + serializacja (pusty => pomijany) + wczytanie przez loader + restore do sesji.
2. Test `rust-port/engine/tests/p4_364_fog_save.rs`: (a) runda: odkryj mgłę (`GetRenderLayers`/`refresh_fog`) -> zapis -> wczytanie -> `fog` z `GetRenderLayers` identyczna jak przed zapisem; (b) zapis sprzed zmiany (bez klucza) wczytuje się i daje pustą mgłę (zgodność wsteczna); (c) zapis bez eksploracji serializuje się bajt w bajt jak dotąd; (d) niepoprawny klucz -> jawny błąd; (e) dwa fotele (`seat` 0 i 2) odtwarzane osobno; (f) `EngineState`/replay bez zmian.
3. Mutacje FAIL: (a) pominięcie zapisu; (b) pominięcie restore; (c) restore tylko fotela głównego; (d) cichy pominięty zły klucz.

## ALLOWLISTA
`rust-port/engine/src/domain/save_load.rs`, `zapis_loader.rs` (tylko wczytanie klucza), `playable.rs` (akcesory sesji mgły), `dto_bridge.rs` (tylko jeśli potrzebne), `bridge.rs` (tylko mechaniczne), nowy `rust-port/engine/tests/p4_364_fog_save.rs`, katalog runs. Dozwolone mechaniczne gałęzie `match` poza listą (wypisz). Nie zmieniaj istniejących testów ani wektorów zapisu (poza dopisaniem). `gra/**`, `Cargo.toml`, `Cargo.lock`: NIE.

## BRAMKI (EXIT 0)
`cargo fmt --check`, `cargo clippy --all-targets -- -D warnings`, `cargo test --test p4_364_fog_save`, pełny `cargo test --all-targets --no-fail-fast` (engine; w tle `setsid nohup`, EXIT w logu). `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` unikalny w scratchpadzie, usunąć po bramkach; dysk >= 8 GB, inaczej BLOCK INFRA z liczbą GB. Commit jawnym `git add`, bez `Co-Authored-By` z nazwą modelu. Raport `01-operator-r1.md` (kontrakt STATUS…DEPLOY/PUSH: NIE WYKONANO).
