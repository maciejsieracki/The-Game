# P2.8 — Granica Rust↔Tauri↔frontend: stan faktyczny (katalog, nie decyzja)

**Temat:** `R-RUSTPORT-P2-8-TAURI-ADAPTER-Q1` · **Runda:** 1/5 · **Rola:** Operator (Haiku 5.5 medium)
**Piny:** web `main` = `edb8fb56`; Rust `rust-port/parity-v2` = `9e33fc77` (odczyt wyłącznie przez `git show rust-port/parity-v2:<ścieżka>`; working tree nie jest źródłem).
**Zakres:** dzisiejsze komendy, eventy, `bridge.rs`, shell `src-tauri/`, frontend `src-tauri/frontend/main.js`, oraz status docelowych kategorii komend z planu P2.5.
**Zastrzeżenie:** brak kompilacji (`cargo`) i brak uruchomienia shella — wszystkie fakty z odczytu kodu na pinie.
**Legenda ścieżek:** `domain/…` = `rust-port/engine/src/domain/…`; `engine/tests/…` = `rust-port/engine/tests/…`; `tests/…` = katalog `tests/` w korzeniu repo (`tests/bridge_contract.rs`); `src-tauri/…` i `rust-port/engine/…` — pełne ścieżki od korzenia.

## 0. Korekta względem założeń dispatchu

- Shell Tauri **nie leży** w `rust-port/engine/`. Leży w `src-tauri/` (`parity-v2`), jako osobny crate `civ-desktop` (`src-tauri/Cargo.toml`, `tauri =2.11.5`, `tauri-build =2.6.3`, `civ-engine` path `../rust-port/engine`).
- `bridge.rs` jest **dołączany** do shella przez `#[path]` (`src-tauri/src/lib.rs:8-9`). `rust-port/engine/src/lib.rs:3` deklaruje `pub mod domain;`, a `lib.rs:5-40` zawiera osiem bloków `pub use` (re-eksporty z `domain::…`). Poprawne jest tylko to, że `bridge` nie jest `pub mod` — nie jest częścią publicznego API crate `civ-engine`.
- Liczba komend „6" z planu jest zgodna z kodem (6 wariantów, `bridge.rs:20-41` z atrybutami), ale tylko **4 są wywoływane przez frontend**.

## 1. Komendy (frontend → Rust)

Jedyna komenda Tauri: `engine_command` — `src-tauri/src/lib.rs:28` (atrybut `#[tauri::command]`), funkcja `lib.rs:29-48`, sygnatura (`lib.rs:29-33`): `fn engine_command<R: Runtime>(app: AppHandle<R>, state: State<'_, EngineStateHandle>, request: BridgeRequest) -> Result<BridgeResponse, BridgeError>`; rejestracja `lib.rs:53` (`generate_handler!`); stała nazwy `TAURI_COMMAND` = `bridge.rs:15`. Nie ma innych `#[tauri::command]` na pinie (`git grep` po `parity-v2`: jedyne trafienie w kodzie to `src-tauri/src/lib.rs:28`; pozostałe dwa to asercje testowe).

Envelope: `BridgeRequest{contractVersion, requestId, command}` (`bridge.rs:43-50`); walidacja: wersja == 1 i niepusty `requestId` (`bridge.rs:61-71`). Odpowiedź: `BridgeResponse{contractVersion, requestId, result:BridgeResult}` — `BridgeResult` (`bridge.rs:78-84`, wariant `State{state}`), `BridgeResponse` (`bridge.rs:85-92`).

| # | Wariant `EngineCommand` (`kind`) | Pola | Obsługa w Rust (adapter) | Wywoływane przez frontend |
|---|---|---|---|---|
| 1 | `create_session` | `params: StartGameParams` (domyślne) | `bridge.rs:263-266` → `PlayableGame::new` (`playable.rs:413`) | TAK — `main.js:551` |
| 2 | `add_player` | `id`, `name` | `bridge.rs:267-270` → `playable.rs:472` | NIE (tylko sondy bridge/mock: `bridge.rs:29`, test `tests/bridge_contract.rs:124`) |
| 3 | `select_unit` | `unit_id` | `bridge.rs:271-274` → `playable.rs:486` | TAK — `main.js:647` |
| 4 | `move_unit` | `unit_id`, `destination: PositionDto` | `bridge.rs:275-281` → `playable.rs:504` | TAK — `main.js:655-660` |
| 5 | `advance_turn` | — | `bridge.rs:282-285` → `playable.rs:554` | TAK — `main.js:790` |
| 6 | `get_state` | — | `bridge.rs:286` (no-op, zwraca snapshot, bez eventu `bridge.rs:225`) | NIE |

Błędy: `BridgeError{code, message}`, kody `InvalidRequest | UnsupportedVersion | EngineRejected | EventEmission | Internal` (`bridge.rs:119-125`). Odrzucenie silnika mapuje się na `EngineRejected` (`bridge.rs:150-155`, adapter `bridge.rs:264-285`).

## 2. Eventy (Rust → frontend)

Jeden event: `engine_state_changed` (`bridge.rs:17`, `bridge.rs:109-112`), payload `BridgeEvent::StateChanged{contractVersion, requestId, state}` (`bridge.rs:97-104`).

- Emitowany w `src-tauri/src/lib.rs:42-45` (`app.emit(event.channel(), event)`), tylko dla **udanych** komend innych niż `get_state` (`bridge.rs:225-233`). Komenda odrzucona przez silnik nie emituje eventu (`handle` zwraca `Err` przed budową eventów, `bridge.rs:217`).
- Błąd emisji → `BridgeErrorCode::EventEmission` (`lib.rs:44`).
- Frontend subskrybuje przez `tauri.event.listen` (`main.js:754-764`), czyta `event.payload.state`.

## 3. `bridge.rs` — co robi

- Definiuje wersjonowany kontrakt JSON (request/response/event/error) i enum komend — wyłącznie typy i dispatcher.
- `EnginePort` (`bridge.rs:181-183`) to szew adaptera; produkcyjny `CivEngineAdapter` (`bridge.rs:240-291`) trzyma `PlayableGame`; `MockEngineAdapter` (`bridge.rs:294-388`) to atrapa testowa z rejestrem wywołań.
- `EngineBridge::handle` (`bridge.rs:213-236`): walidacja → `adapter.execute` → odpowiedź + ewentualny event.
- Typy stanu: `EngineState = PlayableState` (`bridge.rs:75`), tj. DTO z `playable.rs:318-334` (mapa, gracze, miasta, jednostki, `selectedUnitId`, `turn`, `phase`, `status`).
- Kierunek: w obie strony JSON; stan tylko Rust→JS, komendy tylko JS→Rust.

## 4. Shell `src-tauri/` — co robi

- `lib.rs:17-23`: `EngineStateHandle(Mutex<EngineBridge<CivEngineAdapter>>)` — jedna instancja silnika na okno.
- `lib.rs:29-48`: `engine_command` blokuje mutex, wywołuje `handle`, emituje eventy, zwraca odpowiedź. Mutex zwalniany przed emisją (`lib.rs:34-40`).
- `lib.rs:50-54` `configure` (`manage` + `invoke_handler`), `lib.rs:57-61` `run()`; `src-tauri/src/main.rs:3-5` wywołuje `civ_desktop_lib::run()`.
- `tauri.conf.json`: `withGlobalTauri: true`, `frontendDist: "frontend"`, identifier `com.civ.thegame`.
- `capabilities/default.json`: tylko `core:default` (brak wpisów dla własnych komend — stan faktyczny, bez oceny).

## 5. Frontend `src-tauri/frontend/main.js` — co robi

- Wysyła wyłącznie `engine_command` z `{request:{contractVersion, requestId, command}}` (`main.js:718-734`) i czyta `response.result.state`.
- Renderuje wyłącznie stan z Rust (`renderGameState`, `main.js:712-716`).
- Logika UI, nie domenowa: wybór select vs move przez trafienie w encję (`onTileClick` `main.js:643-663`, `entityAt` `main.js:639-641`). Legalność ruchu nie jest liczona w JS — decyduje odrzucenie z Rust.
- Lokalne duplikaty parametrów: `defaultWizardParams` (`main.js:175`), `buildStartGameParams` (`main.js:401`) — wartości startowe kreatora po stronie JS, przekazywane do `create_session`.
- Etykiety faz (`phaseLabelFor`, `main.js:624-637`) — prezentacja.
- Sonda testowa `window.__civPlayableSlice` (`main.js:804-810`).

## 6. Docelowe kategorie z planu P2.5 — status dziś

Kryterium: czy istnieje komenda wpięta w `EngineCommand`/`PlayableGame` (ścieżka z shella) oraz czy istnieje odpowiednik domenowy (sam moduł, nie wpięty).

| Kategoria (plan P2.5) | Komenda dziś | Odpowiednik domenowy na pinie | Wpięte w `PlayableGame`? |
|---|---|---|---|
| Ruch jednostki | TAK (`move_unit`) | `pathfinding.rs` | TAK (`playable.rs:504`) |
| Tura / kolejka faz | TAK (`advance_turn`) | `events.rs` (`TurnPhase`) | TAK (`playable.rs:554`) |
| Rekrutacja | BRAK | `recruitment.rs:143` `validate_recruitment`, `:161` `spend_recruitment`, `:177` `can_afford_unit_recruitment` | NIE (`playable.rs` importuje tylko `events` i `PositionDto`, `playable.rs:11`); jednostki w playable: tylko `PlayableUnitKind::Warrior` (`playable.rs:302-304`) |
| Budowa (budynki/ulepszenia) | BRAK | `building_costs.rs:108` `canonical_building_costs`, `:238` `effective_work_cost`; re-eksport `try_spend_building_cost`, `validate_building_expenditure` (`lib.rs:5-10`); `improvements.rs:229` `can_build_improvement` | NIE |
| Dyplomacja | BRAK | `diplomacy.rs` (4116 linii; `:71` `RelationStatus`, `:212` `DiplomacyParams`, `:492` `relation_score`) | NIE |
| Handel | BRAK | `trade.rs` (1957 linii; `:172` `TradeMap`, `:318` `trade_route_limit_for_city`) | NIE |
| Badania / technologie | BRAK | brak modułu; jedyny ślad: pole `researched_by_owner` (`diplomacy.rs:2203-2204`) | NIE |
| Zarządzanie automatyczne | BRAK w komendach; najbliższy odpowiednik domenowy: `ai_turn.rs` (1402 linie) — `plan_ai_turn` `:996`, `decide_ai_turn` `:1039` (planer tury jednej cywilizacji AI). `ai_turn` **nie jest** zadeklarowany w `domain/mod.rs` (lista `mod.rs:3-25`); używa go tylko ścieżka testowa `engine/tests/ai_turn.rs:2` i `engine/tests/terrain_movement_fix.rs:11` | NIE (`playable.rs` nie importuje `ai_turn`) |
| Miasta (zakładanie, produkcja) | BRAK | `city_growth.rs`, `resource_production.rs` (domena, bez wpięcia); stan miast w playable: `PlayableCity` | NIE |
| Save / load | BRAK | `domain/save_load.rs:79` `SaveSnapshot`, `:207` `migrate_v1`; moduł **nie** jest zadeklarowany w `domain/mod.rs` (`mod.rs:3-25`), komentarz `save_load.rs:20-21` mówi, że jest ścieżką testową (`engine/tests/save_load.rs:6`). Komentarz `save_load.rs:12-14` tylko stwierdza, że moduł definiuje wartość domenową, a adapter Tauri/plików może z niej korzystać — nie rozstrzyga, czy adapter istnieje (nie istnieje w kodzie na pinie: brak komendy save/load w `EngineCommand`) | NIE |
| Rozliczenie tury (ekonomia) | BRAK w bridge | `turn_economy.rs:299` `resolve_turn` | NIE (`advance_turn` nie woła `turn_economy`; `playable.rs` nie importuje modułu) |

**Moduły domenowe niezadeklarowane w `domain/mod.rs`** (lista `mod.rs:3-25` nie zawiera ich; nie są częścią crate poza ścieżkami testowymi): `save_load`, `ai_turn`, `replay`, `combat`, `unit_epoch`. Zadeklarowane są m.in. `recruitment`, `building_costs`, `diplomacy`, `trade`, `turn_economy`, `playable`.

## 7. Podsumowanie faktów

- Dziś: **1 komenda Tauri** (`engine_command`) z **6 wariantami** `EngineCommand`; frontend używa **4**; **1 event** (`engine_state_changed`).
- Żadna z docelowych kategorii rekrutacja/budowa/dyplomacja/handel/badania/auto-zarządzanie/save-load nie ma wpiętej komendy. Część ma moduł domenowy poza ścieżką komend (rekrutacja, budowa, dyplomacja, handel, zapis) — to jest „odpowiednik częściowy" tylko w sensie kodu domeny, nie zachowania dostępnego z UI.
- Granica jest celowo cienka: Rust trzyma stan i reguły, JS renderuje i zbiera wejście. Brak logiki domenowej w `main.js` ponad lokalne wartości startowe kreatora (`main.js:175`, `:401`).
- Nic z tego nie jest decyzją o docelowym podziale odpowiedzialności — to wymaga P2.2/P2.5.

## 8. Ograniczenia

- Nie kompilowano ani nie uruchamiano `src-tauri` (zakaz zakresu: odczyt + nowy plik .md).
- Nie zweryfikowano zgodności zachowania z web (poza P2.1/P2.9) — tylko fakty strukturalne.
