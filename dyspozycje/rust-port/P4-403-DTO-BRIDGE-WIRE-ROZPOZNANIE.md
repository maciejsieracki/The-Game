# Rozpoznanie #403 DTO-BRIDGE-WIRE: produkcyjny wołający warstw, mgły, ramki i playbacku

STATUS: PASS (rozpoznanie tylko do odczytu, bez cargo i bez zmian w repo)
DOMAIN: INFORMATIONAL
TEMAT: #403 DTO-BRIDGE-WIRE (rozpoznanie)
GOAL: ustalić, czego brakuje, żeby renderer był zasilany z silnika przez klienta i Tauri w ścieżce produkcyjnej.
ZMIANY/COMMIT: brak. Odczyt: `origin/rust-port/parity-v2` = `b41adf6a5`, rejestr z `HEAD` (`claude/rust-sivvrn`; na parity-v2 `REJESTR-RUST.md` nie ma tych wpisów), pin webu `07d2fbd72`.
TESTY: nie uruchamiano (zakaz cargo). Wszystkie stwierdzenia pochodzą z `git show` i `git grep`.

## 0. Najważniejsze ustalenie

Łańcuch silnik → most → klient → renderer działa wyłącznie w testach crate'a `rust-port/client`.
- `src-tauri` nie zależy od `civ-client` ani od `civ-renderer`. `src-tauri/Cargo.toml` ma tylko `civ-engine`, `serde` i `tauri`, a `rust-version` to `1.77.2`.
- Powłoka ma jedną komendę, `engine_command` (`src-tauri/src/lib.rs:29-48`). Przekazuje żądanie do mostu, ale nie wywołuje `RenderClient`.
- Jedynymi implementacjami `RenderSource` i `SiegeBattleSource` są atrapy w testach:
  - `client/tests/engine_bridge_renderer.rs:44,103`,
  - `client/tests/siege_battle_client.rs:159,198,233`.
- Frontend serwowany przez okno to stary `src-tauri/frontend` (`tauri.conf.json` `frontendDist: "frontend"`). Wysyła tylko `create_session`, `select_unit`, `move_unit` i `advance_turn`.
- Typy komend w `frontend-v2` (`controller/commands.ts:32-37`) nie mają `get_render_*` ani komend oblężenia. `frontend-v2` domyślnie działa na atrapie MOCK (`transport.ts:6-7`).
- Temat T3 TAURI-GLUE (i T3b TS-TYPES) z rozpoznania #371 (`runs/R-RUSTPORT-P4-371-CLIENT-ROZP-Q1/00-rozpoznanie.md` §T3) nigdy nie został wykonany.
- Moduł `renderer/src/gpu.rs` ma 10 linii i tylko re-eksportuje `wgpu`. Rysowanie na ekranie (GPU-EMBED) nie istnieje poza `rust-port/spike-gpu-embed`.

## 1. Tabela wywołań

| wywołanie | gdzie istnieje | produkcyjny wołający (plik:linia) | czego brakuje |
|---|---|---|---|
| `EngineCommand::GetRenderMap` → `RenderClient::on_session_created` | most `engine/src/bridge.rs:487-500`; klient `client/src/lib.rs:369` | **BRAK**. Woła go tylko test `engine_bridge_renderer.rs:103` (`BridgeSource`) | Implementacja `RenderSource` nad `EngineBridge<CivEngineAdapter>` w `src-tauri`. Wywołanie po udanym `CreateSession` **i po `LoadGame`**. W testach klienta nie ma scenariusza `LoadGame` (0 trafień). |
| `EngineCommand::GetRenderFrame` → `on_state_changed` / `set_frame_ui` / `select_unit` / `set_build_mode` / `exit_build_mode` / `set_active_improvement_key` | most `bridge.rs:501-514`; klient `lib.rs:394, 412, 489, 525, 582, 604` | **BRAK**. Tylko testy klienta | Powłoka musi wywołać `on_state_changed` po każdej odpowiedzi z `StateChanged` (`engine_command` zna `dispatch.events`, `src-tauri/src/lib.rs:43-46`). Brak kanału UI→powłoka dla `set_map_ui`, zaznaczenia i trybu budowy. Długi T5c: CLEARED-PERSIST (po turze `select_unit`) i REFRESH-SITES (`set_highlight_last_writer(Build)`). |
| `EngineCommand::GetRenderLayers` (mgła, `fogActive`, **`reveal`**, territory) | most `bridge.rs:472-486` → `dto_bridge.rs:399` `session_render_layers` | **BRAK** poza testami silnika (`bridge_contract.rs`, `p4_364_*`, `p4_save_load_bridge.rs`). Klient go nie używa | Albo klient go woła, albo `reveal` trafia do ramki. Zob. wiersz FogReveal. |
| **FogReveal** (`revealAllLand`, `riverRevealKeys`) | producent: `dto_bridge.rs:163-200` `build_fog_layers`; konsument: `renderer/src/view/fog.rs:186` `FogReveal::from_dto` | **BRAK obu stron.** `build_render_frame` liczy `layers` z `reveal` (`render_frame.rs:932`), ale go odrzuca, bo `RenderLayersDto` (`view-model/src/root.rs:62`, `deny_unknown_fields`) nie ma tego pola. `FrameInputs` ustawia na sztywno `land_reveal: false` (`view/frame.rs:372`). `FogReveal::from_dto` nie ma żadnego wołającego. | (a) `reveal` w ramce albo drugie zapytanie klienta. (b) `FrameInputs` bierze `land_reveal` i `river_reveal_keys` z `FogReveal`. (c) Odbiorca `river_fog_active` / `merged_river_visible_in_fog` (`decor/river_lod.rs:316`, bez wołającego). **`MapScene` w ogóle nie rysuje wstęg rzek**: w `view/` nie ma żadnego użycia `crate::rivers`, więc klucze rzek nie mają dziś odbiorcy. Skutek w grze: przed pierwszym miastem rzeki w promieniu startu nie są odsłaniane (pin `main.ts:13074-13080, :13490-13494`). `revealAllLand` w sesji jest zawsze `false` (`playable.rs:1170, :1185`), więc L1 jest dziś martwe. |
| Bitwa oblężnicza: `StartSiegeStorm` / `StepSiegeBattle` / `SkipSiegeBattle` / `FinishSiegeBattle` → `BattlePlayback` | most `bridge.rs:529-560`; klient `lib.rs:1205, 1256, 1272, 1297`; renderer `battle/playback.rs:601` (`new`), `:658` (`push_actions`), `:696` (`play_until`) | Klient woła renderer (`lib.rs:1157-1159, :1413-1424`), ale **nic nie woła klienta**. Jedyny `SiegeBattleSource` to test `siege_battle_client.rs:233` | `SiegeBattleSource` w `src-tauri`. **Sterownik zegara**: kto co ~16 ms woła `step_siege_battle(wall_ms)` (pin: `requestAnimationFrame`, clamp 100 ms). Kanał UI dla start/skip/finish. Po `Finish` jest `StateChanged`, więc trzeba wywołać `on_state_changed`. |
| `AbortSiegeBattle` (gracz się wycofuje) | most `bridge.rs:107` i adapter; klient tylko prywatnie: `fn abort_started_battle` (`lib.rs:1337`) | **BRAK publicznego API klienta** | Publiczne `abort_siege_battle()` w kliencie (pin: przycisk „Wycofaj się z bitwy”, `battleScene.ts:3359`; `main.ts:37023`) i jego wywołanie w powłoce. |
| Zmiana prędkości bitwy (`speedMul`) | brak komendy mostu. Klient: `SIEGE_BATTLE_START_SPEED_MUL` (`lib.rs:1123`) | **BRAK** (#407 FQ-SPEED-BRIDGE) | Poza #403 (zależność, zob. §3). |
| `SaveGame` / `LoadGame` | most `bridge.rs:515-528` i ścieżka ogólna | **BRAK** w kliencie i UI (rejestr: „brak UI zapisu w kliencie/Tauri (wchodzi do #403)”) | Po `LoadGame` klient musi wywołać `on_session_created` i `on_state_changed` (pin: pełne odświeżenie `main.ts:46138-46156`) oraz zresetować bitwę. `frontend-v2` ma inne, slotowe `save_game/load_game` (`commands.ts:54-55`), niezgodne z mostem (`SaveGame` bez slotu, `LoadGame { save }`). |
| `RenderLayersDto.battle` → `battle_view_inputs` | renderer `view/battle.rs:222` | **BRAK**. Producent zawsze daje `battle: None` (`render_frame.rs:1011`, luka D-R3-4) | Poza #403 (bitwa polowa na mapie nie ma producenta). |
| Synchronizacje spoza `MapScene` (DŁUG-T1-NOT-SYNCED) | `cities/sync/stat_chips.rs` (`sync_stat_chips`), `decor/placement` (`sync_forest_for_units`, `hide_decor_at_hex`), `improvements/sync` (`MapObjectsLayer`) | **BRAK** (tylko definicje i testy modułów) | Wpięcie w `MapScene::apply` (temat renderera). Pola `MapUiState.city_panel_view_city_id` i `hover_stat_chip_city_id` nie mają odbiorcy. |
| Resolvery jednostek (DŁUG-T1-RESOLVERS: ring stance, kolor i emblemat właściciela) | `renderer/src/map_units/mod.rs` | **BRAK** | Ustawienie w `MapScene` (pin `main.ts:10344-10384`). |
| Rysowanie na ekranie (GPU) | `spike-gpu-embed` (D-RR-2 = A) | **BRAK** w `src-tauri` i rendererze (`gpu.rs` = sam re-eksport) | Osobny temat GPU-EMBED. Bez niego „produkcyjne zasilanie” = tylko stan CPU `MapScene`. |

## 2. Proponowany podział #403 (4 tematy)

Modele według zasady z CLAUDE.md: Opus tylko dla 3D, renderera i grafiki. W tabeli ról tematy 1, 2 i 4 to klej i logika klienta. Ostateczny przydział modelu należy do orkiestratora.

### 403-A `R-RUSTPORT-P4-403A-FOG-REVEAL-FRAME` (engine + view-model + renderer)
- **GOAL:** `FogRevealDto` aktywnego fotela trafia z `GetRenderFrame` do `FrameInputs`. `land_reveal` i `river_reveal_keys` przestają być stałymi.
- **Allowlista:**
  - `rust-port/view-model/src/root.rs`: addytywne `#[serde(default, skip_serializing_if=…)] reveal: Option<FogRevealDto>` albo pole wymagane. Decyzja techniczna, zob. §4.
  - `rust-port/engine/src/domain/render_frame.rs` (~`:932`, `:1011`),
  - `rust-port/renderer/src/view/frame.rs` (`FrameInputs::from_dto*`, `:349-372`),
  - `rust-port/renderer/src/view/fog.rs` (bez zmian logiki),
  - testy `engine/tests/p4_364_render_frame.rs` i `client/tests/engine_bridge_renderer.rs`,
  - raporty, wektory i fikstury TS `frontend-v2/src/viewmodel/types.ts`, jeśli są dotknięte.
- **Kryteria końca:**
  - `FogReveal::from_dto` ma produkcyjnego wołającego.
  - Test E2E: sesja przed pierwszym miastem → `river_reveal_keys` = `computeVisibleAt(start, radius)`. Po założeniu miasta lub bez stolicy → `None`.
  - `fog_on = false` → `None`/`false` (pin `:13506`).
  - Mutanty: odrzucenie `reveal` i stałe `false` → FAIL.
  - Odbiorca rzek: tylko `FrameInputs.river_reveal_keys` i `river_fog_active` jako dane. **Rysowanie wstęg rzek NIE wchodzi**, bo `MapScene` ich nie ma (osobny temat RIVER-SCENE).
- **Bramki:** engine (fmt, clippy, pełne testy), view-model, renderer (gpu OFF), client. **Wymaga bramki renderera (≥ 12 GB, jeden build renderera naraz).**

### 403-B `R-RUSTPORT-P4-403B-CLIENT-API-GAPS` (client)
- **GOAL:** klient ma publiczne API dla wszystkich przejść, których potrzebuje powłoka.
- **Zakres:**
  - `abort_siege_battle()` (pin `battleScene.ts:3359`, `main.ts:37023`),
  - `on_game_loaded()` = reset bitwy, `GetRenderMap` i `GetRenderFrame` (pin `:46138-46156`),
  - opcjonalnie `on_bridge_answer(events_had_state_changed)` jako jedna reguła odświeżania dla powłoki.
- **Allowlista:** `rust-port/client/src/lib.rs`, `rust-port/client/tests/*.rs`, raporty.
- **Kryteria końca:**
  - Testy E2E `SaveGame → LoadGame → ramka` (mapa i scena zbudowane od nowa, bitwa wyczyszczona) i `Start → Abort przez gracza → mapa` (stan gry bez zmian, bez `StateChanged`).
  - Mutanty: brak resetu bitwy przy wczytaniu, brak `GetRenderMap` po wczytaniu → FAIL.
- **Bramki:** client (fmt, clippy `--locked`, test). Budowa klienta kompiluje renderer jako zależność, więc **bramka dysku jak dla renderera (≥ 12 GB)**. Kod renderera bez zmian.

### 403-C `R-RUSTPORT-P4-403C-TAURI-GLUE` (src-tauri; dawny #371 T3)
- **GOAL:** powłoka posiada `RenderClient<ShellSource>` obok `EngineBridge`.
  - `ShellSource` implementuje `RenderSource` i `SiegeBattleSource` nad tym samym `EngineBridge` (wspólny `Mutex`, bez drugiej kopii silnika).
  - Po każdym `dispatch` z `StateChanged` powłoka woła `on_state_changed`. Po `CreateSession` woła `on_session_created`, po `LoadGame` `on_game_loaded`.
  - Komendy UI (`set_map_ui`, `select_unit`, tryb budowy, start/step/skip/finish/abort bitwy) przechodzą przez powłokę.
  - Sterownik zegara bitwy działa po stronie Rust (D-371-2: ramkę liczy powłoka, nie webview).
- **Allowlista:**
  - `src-tauri/Cargo.toml` (`civ-client` path, `rust-version` 1.87),
  - `src-tauri/Cargo.lock`,
  - `src-tauri/src/lib.rs`,
  - `rust-port/engine/tests/bridge_contract.rs`: asercje napisów `:554-561`. **`generate_handler![engine_command]` jest sprawdzany dosłownie**, więc druga komenda Tauri wymaga zmiany tego testu,
  - raporty.
- **Kryteria końca:**
  - `engine_command` bez zmiany sygnatury JSON.
  - Brak stanu gry w powłoce poza mostem.
  - Test w `src-tauri` (albo w kliencie z atrapą `ShellSource`) dowodzi kolejności: CreateSession → mapa, mutacja → ramka, Finish → ramka.
  - Długi T5c CLEARED-PERSIST i REFRESH-SITES obsłużone albo jawnie odroczone.
- **Bramki:** `cargo fmt --check` w `src-tauri`. Test engine `bridge_contract`. Kompilacja Tauri: według rejestru i rozpoznania #371 R1 crate `tauri` offline jest niedostępny w kontenerze, więc dowodem jest CI `tauri-windows.yml` na gałęzi wip (uruchamia orkiestrator). Lokalnie **NIE_ZMIERZONO**. Ryzyko BLOCK-INFRA. Renderera nie zmienia, ale go kompiluje (≥ 12 GB).

### 403-D `R-RUSTPORT-P4-403D-TS-TYPES` (frontend-v2, bez cargo; dawny T3b)
- **GOAL:** kontrakt TS zgodny z mostem.
  - Warianty `cancel_planned_march`, `declare_war`, `get_render_layers|map|frame`, `start_siege_storm`, `step|skip|finish|abort_siege_battle` oraz most-owe `save_game` i `load_game { save }`.
  - `attack_unit_id?` w `move_unit`.
  - Wyniki `render_layers`, `render_map` i `render_frame`, pola `siegeBattle` i `saveGame` w odpowiedzi.
  - Typ `unitSelectedAfterBuildOpen` w `viewmodel/types.ts`.
- **Allowlista:** `src-tauri/frontend-v2/src/controller/commands.ts`, `src-tauri/frontend-v2/src/viewmodel/types.ts`, ewentualnie `controller/mock.ts`, raporty.
- **Bramki:** `npm run typecheck` i `npm run check` w `frontend-v2`. Bez buildu `gra/`. **Nie wymaga bramki renderera.** Przełączenie `frontendDist` na `frontend-v2` i MOCK→TAURI = poza zakresem.

Kolejność: D w dowolnym momencie. A i B mogą iść równolegle tylko wtedy, gdy dysk pozwala na dwa buildy renderera; inaczej najpierw A, potem B. C po A i B.

## 3. Ryzyka i zależności

| # | Ryzyko / zależność | Wpływ | Mitygacja |
|---|---|---|---|
| R1 | Tauri offline w kontenerze (rozpoznanie #371 R1) | 403-C bez lokalnego dowodu kompilacji | Logika w kliencie (B). C = cienki klej. Dowód z CI Windows. |
| R2 | MSRV `src-tauri` 1.77.2 < 1.87 (renderer i `wgpu` są opcjonalne, ale klient wymaga 1.87) | błąd rozwiązywania | Podnieść `rust-version` w C. CI używa `stable`. |
| R3 | `bridge.rs` jest dołączany przez `#[path]`, więc typy mają różną tożsamość w każdym crate | `ShellSource` nie może używać typów z `civ-client` wprost | Jak w testach: rozpakować `BridgeResult::RenderMap/RenderFrame` do typów biblioteki `render_frame` (D-371-1). |
| R4 | Dodanie pola do `RenderLayersDto` (`deny_unknown_fields`) | Zmienia się JSON ramki i fikstury TS. Możliwa zmiana `CONTRACT_VERSION` | Pole addytywne `Option` z `skip_serializing_if`. `CONTRACT_VERSION` zostaje 1 (wzór D-WIRB-5 / SAVE-LOAD). |
| R5 | DŁUG-T1-LOCK: build renderera przepisuje `renderer/Cargo.lock` | brudne drzewo w A i B | Cofnąć przed commitem (jak w LANDAT). |
| Z1 | **#407 FQ-SPEED-BRIDGE** (komenda prędkości bitwy) | Sterownik zegara w C zna tylko `speedMul = 1` (`lib.rs:1123`) | C projektuje sterownik z `frame_ms` jako parametrem. Wpięcie prędkości po #407. Brak konfliktu plików z A i B, jeśli #407 nie rusza `client/src/lib.rs` w tym samym czasie. **Konflikt z B na `client/src/lib.rs`**, więc nie równolegle. |
| Z2 | **#406 LANDAT-TB-TOWER-DUE-ORDER** (test kolejności trafienia wieży; silnik i generator) | Brak zależności funkcjonalnej. Wspólne bramki silnika | Może iść równolegle (inne pliki: `siege_tactics_loop.rs` i testy). |
| Z3 | **#405**: w raportach numer ma dwa różne opisy. `R-RUSTPORT-P4-LANDAT-TOWER-BOULDER-Q1/01-operator-r1.md:112` mówi „SHOT-LAND-AT-RENDER (#405)”, a `R-RUSTPORT-P4-FQ-SPEED-Q1/01-operator-r1.md:219` i `03-final-control.md:87` mówią „PRE-SKIP-RAF #405” | Jeśli to SHOT-LAND-AT-RENDER (czas lądowania `Shot` po stronie renderera i klienta), dotyka `renderer/battle/playback.rs`/`client`, czyli kolizji plików z A, B i C. Jeśli PRE-SKIP-RAF, dotyczy silnika i osi przewijania (bez kolizji) | Orkiestrator powinien ujednoznacznić #405 w rejestrze. Do tego czasu nie puszczać #405 równolegle z B i C. |
| Z4 | #402 MARCH-RESZTA (silnik) | brak kolizji plików z #403 | — |
| Z5 | GPU-EMBED i przełączenie `frontendDist` | Po #403 dalej nic nie jest widoczne na ekranie | Jawnie poza #403. Raport ma to zapisać, żeby „wpięte” nie znaczyło „widoczne”. |
| Z6 | Brak wstęg rzek w `MapScene` | Klucze odsłonięcia rzek z A nie mają wizualnego odbiorcy | Osobny temat renderera (RIVER-SCENE). Bramka renderera. |
| Z7 | DŁUG-T2-HOTSEAT-SEAT, DL-SLB-5 | Klient zawsze pyta o `seat = None` | Poza #403. |

## 4. Decyzje techniczne a odstępstwa gameplay

**Decyzje techniczne (orkiestrator, według kodu webu, bez pytania):**
- Gdzie ma żyć `reveal`: w `RenderLayersDto` (jedno zapytanie na odświeżenie, jak pin, gdzie `refreshFog` ustawia `setFog` z opcjami w tym samym przebiegu) czy jako osobne `GetRenderLayers`. **Rekomendacja: pole w ramce.** Unika podwójnego `addExplored`, bo oba zapytania kumulują eksplorację; wynik jest ten sam, ale ramka jest jedna.
- Kształt kleju powłoki: jeden `Mutex` (most i klient), reguła odświeżania po `events`, ramka liczona w procesie Rust (D-371-2), sterownik zegara 16 ms z clampem 100 ms (pin `battleScene` rAF).
- Czy dodać drugą komendę Tauri (np. `ui_command`), czy rozszerzyć kopertę. Test `bridge_contract.rs:557` trzeba wtedy zaktualizować.
- `on_game_loaded` = pełne odświeżenie jak pin `main.ts:46138-46156`.
- Pole `reveal` addytywne i `CONTRACT_VERSION` = 1 (precedens D-WIRB-5).

**Możliwe odstępstwa od webu (pytanie ABC tylko, jeśli orkiestrator chce je przyjąć):**
- Przełączniki dev-UI F (`fogOn`) i M (`revealAllLand`). W webie to klawisze deweloperskie (`main.ts:12801-12803`); w Rust sesja ma je na stałe (`true`/`false`). Pominięcie ich w Tauri to zakres, którego web nie rozstrzyga jako gameplay (dev-UI). Domyślnie: poza #403, bez pytania. Pytanie tylko, jeśli właściciel chce je w wersji produkcyjnej.
- Zapis w trakcie bitwy (DL-SLB-1): Rust odrzuca błędem. Czy pin pozwala, **NIE_ZMIERZONO**. Jeśli pozwala, to świadome odstępstwo, które wymaga ABC, gdy UI zapisu w C ma je ujawnić.
- Prędkość bitwy stała ×1 do czasu #407: odstępstwo tymczasowe, techniczne (dług), nie gameplay.
- Poza tym zakres #403 nie wymaga żadnej decyzji gameplay: wszystkie przejścia mają odpowiednik w pinie.

## NIE_ZMIERZONO
- Kompilacja `src-tauri` z `civ-client` (crate Tauri offline).
- Czy pin pozwala na zapis w trakcie bitwy.
- Rozmiar dysku i czas buildów dla A, B i C.
- Czy `wgpu` jako opcjonalna zależność renderera wymusza MSRV 1.87 bez włączonej cechy `gpu`. `client/Cargo.toml` deklaruje 1.87, więc przyjęto 1.87.

## Streszczenie (5 zdań)
Łańcuch silnik → most → klient → renderer (GetRenderMap/GetRenderFrame, bitwa oblężnicza z `BattlePlayback`) istnieje i działa wyłącznie w testach `rust-port/client`; `src-tauri` nie zależy od `civ-client` ani od renderera, a jedyna komenda `engine_command` nie odświeża żadnej ramki. `GetRenderLayers` i `FogReveal` nie mają produkcyjnego wołającego: ramka liczy `reveal`, ale go odrzuca (`render_frame.rs:932`), renderer ma na sztywno `land_reveal=false` (`frame.rs:372`), a `MapScene` w ogóle nie rysuje wstęg rzek. Klientowi brakuje publicznego `abort_siege_battle`, ścieżki po `LoadGame` i sterownika zegara bitwy; prędkość bitwy czeka na #407, a frontend-v2 nie ma typów `get_render_*` ani komend oblężenia. Proponuję cztery tematy: A FOG-REVEAL-FRAME (engine+renderer, bramka renderera), B CLIENT-API-GAPS (client), C TAURI-GLUE (src-tauri, dowód tylko z CI Windows) i D TS-TYPES (bez cargo). Wszystko to decyzje techniczne według pinu; ABC potrzebne jest tylko przy zapisie w trakcie bitwy (NIE_ZMIERZONO w pinie) i ewentualnych przełącznikach dev-UI, a numer #405 ma w raportach dwa sprzeczne opisy i trzeba go ujednoznacznić.
