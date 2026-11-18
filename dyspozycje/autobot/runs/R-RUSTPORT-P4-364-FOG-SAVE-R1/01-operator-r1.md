# R-RUSTPORT-P4-364-FOG-SAVE-R1 — raport Operatora r1

STATUS: PASS
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-FOG-SAVE-R1 (DŁUG-364-FOG-SAVE)
GOAL: odkryta mgła sesji (`PlayableFogSession::explored_by_human`) przeżywa rundę zapis → wczytanie, jak web `exploredByHuman` (pin `07d2fbd72`: `main.ts:37229-37239`, `:46385-46411`, `game/save.ts:359-363,725`).
BAZA: `5a1ddc10b9b894161e6f4e84694693b459dc992f` (= `origin/rust-port/parity-v2` w chwili startu, merge RENDER-FRAME r2 + K5LOOP-CLOSE r2). Gałąź robocza: `rust-port-wip/p4-364-fog-save-r1`.
ZMIANY/COMMIT: commit na gałęzi `rust-port-wip/p4-364-fog-save-r1` (SHA w odpowiedzi Operatora / `git log -1`; raport jest w tym samym commicie, więc nie może zawierać własnego SHA) (jeden commit: kod + test + ten raport)

## Zmiany (allowlista)

- `rust-port/engine/src/domain/save_load.rs`
  - D-FS-1: nowe pole `SaveSnapshot::explored_by_human: Vec<SavedExploredSeat>`, klucz JSON `exploredByHuman`,
    `#[serde(default, skip_serializing_if = "Vec::is_empty")]`. Kształt jak web: `[[ownerId, ["q,r", ...]], ...]`
    (własny `Serialize` dla `SavedExploredSeat` → krotka `(u64, Vec<String>)`). `SaveSnapshot` nadal BEZ `Deserialize`
    (doctest `compile_fail` bez zmian); wersja zapisu bez zmian (2).
  - Wczytanie: `SnapshotWire.explored_by_human: Option<Value>` + `explored_by_human_from_save` w `RawSnapshot::deserialize`
    (czyli w produkcyjnym `zapis_loader::load_save_snapshot`, bez zmian w `zapis_loader.rs`). Jak web `normalize`
    (`save.ts:725`): brak klucza lub nie-tablica → `[]`. W tablicy (D-FS-3, zakaz cichego pominięcia):
    wpis nie-para `[liczba całkowita >= 0, tablica]` → `ExploredByHumanLoadError::BadEntry { entry }`; klucz nie będący
    kanonicznym `"q,r"` (i32, `format!("{q},{r}") == klucz`; odrzuca spacje, `+`, zera wiodące, ułamki, przepełnienie,
    nie-stringi) → `BadKey { entry, key, value }`. Błąd przechodzi jako `LoadError::Json` z komunikatem
    `exploredByHuman[<entry>][1][<key>] = <json> is not a hex key "q,r"`.
  - D-FS-4: `SaveSnapshot::with_playable_explored_by_human(&PlayableFogSession)` (źródło = sesja mgły `PlayableGame`,
    dostęp przez istniejące `PlayableGame::fog_session()`), `with_explored_by_human`, `explored_by_human()`,
    `restore_explored_by_human(&mut PlayableFogSession)`, wolne `playable_explored_by_human_to_save` /
    `restore_playable_explored_by_human`. Wyłącznie addytywne API; żadna istniejąca sygnatura się nie zmieniła.
  - Importy `PlayableFogSession` w obu gałęziach `cfg(not(test))` / `cfg(test)` (moduł jest też ładowany przez `#[path]`).
- `rust-port/engine/src/domain/playable.rs`: akcesor sesji mgły `PlayableFogSession::restore_explored_by_human(ExploredByHuman)`
  (D-FS-2/D-FS-3): mapa = wpisy zapisu, fotel główny (`HUMAN_PLAYER_ID`) ZAWSZE ma wpis (web `main.ts:46407-46410`),
  `reveal_all_land = false` (web `main.ts:46411`).
- Nowy `rust-port/engine/tests/p4_364_fog_save.rs` (6 testów).
- Bez zmian: `zapis_loader.rs`, `dto_bridge.rs`, `bridge.rs`, `Cargo.toml`, `Cargo.lock`, `gra/**`, istniejące testy i wektory.
  Poza allowlistą: brak (żadnych mechanicznych gałęzi `match`).

## Decyzje techniczne Operatora (do potwierdzenia przez orkiestratora)

1. **Fotele z pustym zbiorem nie są zapisywane.** Web zapisuje też puste wpisy (`[[0, []]]`). Pominięcie jest bezstratne:
   wczytanie zawsze tworzy pusty wpis fotela głównego, a fotel bez wpisu dostaje pusty zbiór przy pierwszym zapytaniu
   warstw (`session_render_layers` → `entry(seat).or_default()`, jak web `switchActiveHuman` KROK 0). Dzięki temu zapis
   nowej gry (pusty wpis fotela 1) jest bajt w bajt jak przed zmianą (D-FS-1, test c).
2. **Id fotela = `PlayerId` sesji Rust** (fotel główny = 1), bez przemapowania na web `HUMAN_OWNER_PRIMARY = 0`; zgodnie
   z resztą zapisu Rust (`gracze`, `citySiege` niosą id Rust).
3. **Kolejność kluczy**: fotele i klucze rosnąco (`BTreeMap`/`BTreeSet`); web: kolejność wstawiania. Kolejność nie niesie
   znaczenia (wczytanie buduje zbiór). Powtórzony fotel w zapisie: wygrywa ostatni (web `Map.set`) — test e.
4. **Stan nie wchodzi do `EngineState`/`GameStateDto`/replay** (D-364-2 zostaje): tylko metadane zapisu + sesja mgły.
5. Brak produkcyjnego wołającego zapisu/wczytania `PlayableGame` (tak samo jak dla `citySiege`/`plannedMarches`:
   `PlayableGame::from_state` ma adnotację „brak produkcyjnej ścieżki wczytania”). Wpięcie w komendę mostu (Save/Load) —
   poza zakresem tego dispatchu; kandydat na osobny temat.

## TESTY

- `cargo fmt --check` — EXIT 0
- `cargo clippy --all-targets -- -D warnings` — EXIT 0
- `cargo test --test p4_364_fog_save` — EXIT 0, 6 passed:
  - (a) `a_runda_zapis_odczyt_zachowuje_mgle_z_get_render_layers`: start → `session_render_layers` (implementacja
    `GetRenderLayers`) → ruch jednostki → warstwy → + 3 heksy z „wcześniejszej eksploracji” poza zasięgiem wzroku →
    zapis (JSON z kluczami `"q,r"`) → `load_save_snapshot` → nowa sesja `from_state` + restore → `RenderLayersPayload`
    identyczny jak przed zapisem; czułość: bez restore mgła inna.
  - (b) zapis bez klucza wczytuje się, mgła pusta (tylko pusty wpis fotela głównego), wcześniejsze śmieci sesji wyczyszczone,
    `reveal_all_land = false`; `exploredByHuman` nie-tablica → `[]` (web normalize).
  - (c) zapis nowej gry przez `with_playable_explored_by_human` == `SaveSnapshot` bez zmiany (compact i pretty), ponowny zapis
    wczytanego starego zapisu bajt w bajt.
  - (d) zły klucz → jawny błąd z pozycją (`exploredByHuman[1][1][1]`, 10 form złych kluczy + nie-string), złe wpisy
    (6 form) → `exploredByHuman[1]`; poprawne klucze ujemne się wczytują.
  - (e) fotele 1 i 2 zapisane i odtworzone osobno; warstwy obu foteli identyczne po wczytaniu; duplikat fotela → ostatni.
  - (f) `GameStateDto`/kolejka zdarzeń zapisu bez zmian, `PlayableState` po restore bez zmian i bez eksploracji w JSON,
    ponowny zapis stabilny bajt w bajt.
- Mutacje (skrypt podmieniający `save_load.rs`, przywracający oryginał; każda → `cargo test --test p4_364_fog_save`):
  - M1 pominięcie zapisu (`with_playable_explored_by_human` → pusta lista): EXIT 101, FAIL a, e
  - M2 pominięcie restore (`restore_explored_by_human` nic nie robi): EXIT 101, FAIL a, b, e
  - M3 restore tylko fotela głównego (filtr `owner_id == 1`): EXIT 101, FAIL e
  - M4 cichy pominięty zły klucz (`if let Some` zamiast błędu): EXIT 101, FAIL d
  Plik po mutacjach przywrócony (`git status` = tylko zamierzone zmiany).
- Pełny `cargo test --all-targets --no-fail-fast` (engine, w tle `setsid nohup`): EXIT=0 (log), 530 binarek testowych `test result: ok`, 0 `FAILED`; suma 3982 passed, 0 failed, 1 ignored.

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie
sesji (poza repo), usunięty po bramkach. Dysk przed pełną bramką: 14 GB wolnego.

BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Evaluator r1 (weryfikacja D-FS-1..4, decyzji 1–5 i mutacji), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
