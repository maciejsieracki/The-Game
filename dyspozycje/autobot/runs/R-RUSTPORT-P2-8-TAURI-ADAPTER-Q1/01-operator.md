STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P2-8-TAURI-ADAPTER-Q1
GOAL: Skatalogować dzisiejszą granicę Rust↔Tauri↔frontend na `rust-port/parity-v2` (9e33fc77): komendy, eventy, bridge.rs, rola JS.
ZMIANY/COMMIT: nowy plik `dyspozycje/rust-port/p2/P2-8-TAURI-ADAPTER.md` (poprawiony w turze obrony); ten raport. Zero zmian w `gra/**`, zero kodu Rust, brak commita/push/deploy.
TESTY: nie uruchomiono cargo/shella (zakres: odczyt). Fakty z `git show rust-port/parity-v2:<ścieżka>` z numerami linii. Ponownie zweryfikowano: `src-tauri/src/lib.rs:3,28-33,48,53`; `rust-port/engine/src/bridge.rs:20-41,78-92,213-236`; `rust-port/engine/src/lib.rs:3,5-40`; `rust-port/engine/src/domain/mod.rs:3-25`; `domain/ai_turn.rs:996,1039`; `domain/save_load.rs:12-14,20-21`; `domain/playable.rs:11`; `git grep 'tauri::command'` (jedno trafienie w kodzie: `src-tauri/src/lib.rs:28`).
BLOKADY: brak.
RUNDY: 1/5 (tura obrony 2 z 2 w tej rundzie)
NASTĘPNY KROK: Evaluator (Haiku 5.5 medium) — ponowna weryfikacja P2-8-TAURI-ADAPTER.md po poprawkach (§0, §1, §4, §6 i legenda ścieżek).
DEPLOY/PUSH: NIE WYKONANO

OBRONA:
- 1 -> PRZYJMUJE. Dodano pełną sygnaturę `engine_command` (`src-tauri/src/lib.rs:29-33`: `fn engine_command<R: Runtime>(app: AppHandle<R>, state: State<'_, EngineStateHandle>, request: BridgeRequest) -> Result<BridgeResponse, BridgeError>`), atrybut `lib.rs:28`, ciało `lib.rs:29-48`. Dowód: `git show rust-port/parity-v2:src-tauri/src/lib.rs | cat -n`.
- 2 -> PRZYJMUJE. `domain/ai_turn.rs` (1402 linie) dodany jako najbliższy odpowiednik „zarządzania automatycznego": `plan_ai_turn` `ai_turn.rs:996`, `decide_ai_turn` `ai_turn.rs:1039`. Status: BRAK w komendach, odpowiednik domenowy niewpięty w `PlayableGame` (`playable.rs:11` importuje tylko `events` i `PositionDto`). Kategoria nie jest już opisana jako „brak modułu". Dowód: `git show rust-port/parity-v2:rust-port/engine/src/domain/ai_turn.rs | grep -n 'pub fn'`.
- 3 -> PRZYJMUJE. `domain/mod.rs` (`pub mod`/`mod` linie 3-25) nie deklaruje: `save_load`, `ai_turn`, `replay`, `combat`, `unit_epoch`. Dodano osobną sekcję po tabeli §6. Moduły są używane tylko przez ścieżki testowe (`engine/tests/ai_turn.rs:2`, `engine/tests/terrain_movement_fix.rs:11`, `engine/tests/save_load.rs:6`, `engine/tests/replay.rs:7,11`, `engine/tests/combat.rs:3`, `engine/tests/unit_epoch.rs:2`). Dowód: `git show rust-port/parity-v2:rust-port/engine/src/domain/mod.rs | cat -n`.
- 4 -> PRZYJMUJE. Błędne zdanie „eksportuje tylko `pub mod domain`" usunięte. Poprawnie: `rust-port/engine/src/lib.rs:3` to `pub mod domain;`, `lib.rs:5-40` zawiera bloki `pub use` (re-eksporty z `domain::building_costs`, `city_growth`, `hex`, `playable`, `recruitment`, `terrain` i kolejne). Prawdziwe jest tylko: `bridge` nie jest `pub mod`.
- 5 -> PRZYJMUJE. Interpretację komentarza `save_load.rs:12-14` zmieniono na jego treść: moduł definiuje wartość domenową, a adapter Tauri/plików „can use" serde. Komentarz nie rozstrzyga, czy adapter istnieje; w kodzie na pinie nie ma komendy save/load w `EngineCommand` (`bridge.rs:20-41`), co jest odrębnym, udokumentowanym faktem.
- 6 -> PRZYJMUJE. Zakres `EngineCommand` poprawiony na `bridge.rs:20-41` (atrybuty 20-21, zamknięcie enum linia 41). `BridgeResult` = `bridge.rs:78-84` (doc 78, enum 79-84). `BridgeResponse` = `bridge.rs:85-92`. Odwołania w §3 do `bridge.rs:79-92` zastąpiono rozdziałem `78-84` / `85-92`.
- 7 -> PRZYJMUJE. Dodano legendę ścieżek w nagłówku dokumentu: `domain/…` = `rust-port/engine/src/domain/…`; `engine/tests/…` = `rust-port/engine/tests/…`; `tests/…` = katalog `tests/` w korzeniu repo (`tests/bridge_contract.rs`, asercja w `:241`, test mock w `:124`). Pełne ścieżki podano przy nowych odwołaniach (`domain/save_load.rs`, `src-tauri/src/lib.rs`).

Uwagi:
- Shell Tauri jest w `src-tauri/` (nie w `rust-port/engine/`); `bridge.rs` dołączany przez `#[path]` (`src-tauri/src/lib.rs:8-9`).
- 6 wariantów `EngineCommand`, frontend używa 4 (`create_session`, `select_unit`, `move_unit`, `advance_turn`); `add_player` tylko sondy/mock; `get_state` nieużywany przez UI.
- 1 event: `engine_state_changed`, emitowany tylko dla udanych mutacji (`bridge.rs:225-233`).
- Docelowe komendy P2.5 (rekrutacja, budowa, dyplomacja, handel, badania, auto-zarządzanie, save/load, rozliczenie tury): brak wpiętej komendy; część ma moduł domenowy niewpięty do `PlayableGame`, a część moduł niezadeklarowany w `domain/mod.rs`.
- Brak zmian w `gra/**`, brak zmian kodu Rust, brak commita.
