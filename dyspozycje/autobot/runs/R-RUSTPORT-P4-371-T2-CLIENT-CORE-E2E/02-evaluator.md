# R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, klient renderera; bez zmian gameplay)
TEMAT: R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E (#371, T2)
GOAL: crate rust-port/client (civ-client, bez Tauri, bez gpu) jako właściciel stanu UI i reguły odświeżania,
      woła GetRenderMap/GetRenderFrame przez RenderSource i zasila MapScene; test e2e engine → most → adapter → renderer CPU
ZMIANY/COMMIT: oceniany commit Operatora 23476e97c (rust-port-wip/R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E), rodzic = baza e4ffbc342;
               Evaluator dodaje wyłącznie ten raport (gałąź lokalna eval/P4-371-T2-client), bez zmian kodu
TESTY: generate-lockfile 0 (lock bajtowo = commit), fmt 0, clippy --locked --all-targets -D warnings 0,
       test --locked --all-targets 0 (5 passed / 0 failed / 0 ignored); mutanty dispatchu a–e: 5/5 zabite;
       mutanty Evaluatora: 12/16 zabitych, 4 przeżyły (E1, E6, E7, E8 — opis niżej)
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: Obrona (zarzuty Z1–Z3 do domknięcia testami w client/tests), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza i zakres

- `origin/rust-port/parity-v2` = `e4ffbc342b2e51ddb009786247adf78d67c32964` w chwili oceny (zgodna z linią „BAZA:” dispatchu);
  `git merge-base --is-ancestor e4ffbc342 23476e97c` → prawda; commit Operatora jest jedynym ponad bazą.
- `git diff --name-only e4ffbc342 23476e97c` — 7 plików, wszystkie z allowlisty:
  `rust-port/client/{Cargo.toml,Cargo.lock,.gitignore,.cargo/config.toml,src/lib.rs,tests/engine_bridge_renderer.rs}` + `01-operator-r1.md`.
- `git diff --stat e4ffbc342 23476e97c -- rust-port/engine rust-port/renderer rust-port/view-model src-tauri gra .github` → pusty
  (renderer/Cargo.lock, REJESTR-RUST.md nietknięte). Sekcja „Pliki spoza allowlisty”: brak takich plików.
- `.cargo/config.toml` („tylko jeśli potrzebny”) — potrzebny: to jedyne miejsce, gdzie cargo czyta `[resolver] incompatible-rust-versions`
  (tak samo w `renderer/.cargo/config.toml`); `Cargo.toml` ma `rust-version = "1.87"`. Zgodne z dispatchem.
- Zależności przez `path`: `civ-engine`, `civ-renderer` (domyślne cechy, bez `gpu` — D-371-7), `civ-view-model`; dev: `serde`, `serde_json`.
- Brak `#[ignore]` (`grep -rn 'ignore]' rust-port/client` = 0). `#[allow(dead_code)]` tylko na `mod bridge` (dołączona kopia `bridge.rs`) — nie osłabia asercji.
- Commit bez `Co-Authored-By` z nazwą modelu; jest `Claude-Session:` (dozwolone).

## 2. Bramki odtworzone (w `rust-port/client`, `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie `t2client-eval/target`, uruchomione w tle `setsid nohup`, EXIT w logu)

| Bramka | EXIT | Uwagi |
|---|---|---|
| `cargo generate-lockfile` | 0 | `cmp` z `Cargo.lock` z commitu → identyczny (EXIT 0) |
| `cargo fmt --all -- --check` | 0 | |
| `cargo clippy --locked --all-targets -- -D warnings` | 0 | |
| `cargo test --locked --all-targets` | 0 | lib: 0 testów; `engine_bridge_renderer`: 5 passed, 0 failed, 0 ignored |

Dysk przed buildem 13 GB wolnego; równolegle działał jeden build engine (T1 SIEGE-DEF, `wf_7f3170cd-0a4-1`) — razem 2 buildy, zgodnie z limitem.
Target usunięty po bramkach i mutantach (`df` po: 13 GB wolnego).

**Pełny test engine: NIE WYKONANO** — uzasadnienie: dispatch T2 nie wymienia go w BRAMKACH (bramki tylko w `rust-port/client`), diff
w `rust-port/engine` jest pusty (0 plików), a engine lib + `bridge.rs` zostały skompilowane i wykonane w teście e2e. Dodatkowy pełny build
engine byłby trzecim równoległym buildem przy 13 GB wolnego. Jeśli FC uzna go za wymagany — do uruchomienia na `e4ffbc342`/`23476e97c` (identyczny kod engine).

## 3. Web najpierw (pin `07d2fbd72`, `git show 07d2fbd72:gra/src/main.ts`) — weryfikacja cytatów Operatora

| Cytat | Stan na pinie | Ocena |
|---|---|---|
| `syncPlayerUnitSelectionOnMap` `:7115-7135`, gałąź `isSiegeMapPanelOpen()` `:7120-7122` | `setSelectionHex(...)` przed gałęzią; przy otwartym panelu `reachable = new Set(); clearHighlight()` | zgodne; test sprawdza „pierścień zostaje, podświetlenie znika” |
| `toggleTradeRoutesOverlayOnMap` `:15411-15416` | przełącza flagę → `refreshTradeRoutesOverlay()`, minimapa, HUD — bez mutacji gry | zgodne z D-371-4 |
| `refreshMapOverlayToggles` `:15459-15463`, `toggleWorkerOverlayOnMap` `:15465-15469` | jw. | zgodne |
| Pełne odświeżenie po wczytaniu `:46138-46156` | `syncWonderRender` → `syncUnitsRender` → `cityRenderer.sync` → `refreshTradeRoutesOverlay` → `refreshSiegeMarkers` → `refreshFog` → `refreshMapOverlayToggles` | zgodne; kolejność realizuje T1 `MapScene::apply`, klient go tylko woła |
| `onOpenBuild` `:26702-26703` | `clearPlayerUnitSelection()` przy otwarciu budowy | zgodne z asercją „brak selection/reachable przy build_mode_open” (realizuje silnik, nie klient) |

Dodatkowo: pin ma tryb hot-seat (`isHotSeat(humanSeats)`, `main.ts:26699`), więc `ME()` zmienia się między fotelami — decyzja T2-1
`VIEWER_SEAT = None` (= aktywny fotel) jest właściwa; stała `Some(HUMAN)` byłaby błędem w hot-seat (patrz E8).

## 4. Zgodność z dispatchem i decyzjami D-371-1/3/4/7

- `ClientUiState { frame_ui, map_ui, siege_map_panel_open }`, start = `RenderUiParams::default()` + `MapUiState::WEB_INITIAL` + `false` — zgodne (D-371-3); test sprawdza `client.ui() == web_initial()`.
- `trait RenderSource` z `type Error` zamiast generycznego `E` — równoważne kształtowi z dispatchu; typy ładunków re-eksportowane z `civ_engine::domain::render_frame` (bez duplikatu). Implementacja nad `EngineBridge` po stronie testu (D-371-1) — zgodne.
- `on_session_created` → `GetRenderMap` + `MapStatic::from_dto`; `on_state_changed` → `GetRenderFrame` + `FrameInputs::from_dto` + `MapScene::apply`; cache ostatniego DTO; ramka przed sesją = `Err(ClientError::NoSession)` bez wywołania silnika — zgodne.
- `set_ui` woła silnik tylko przy zmianie `frame_ui`; `set_map_ui`/`set_siege_map_panel_open` składają ramkę z cache bez silnika — zgodne z D-371-4.
- Brak duplikatu stanu gry: klient trzyma wyłącznie stan UI, `MapStatic`, DTO ostatniej ramki, `FrameInputs`, `MapScene` — zgodne.
- Scenariusz e2e: `CreateSession` → `GetRenderMap` → `GetRenderFrame` (bez UI) → `SelectUnit` + `selected_unit_id` → `MoveUnit` → `GetRenderFrame` → `AdvanceTurn` → `GetRenderFrame` — kompletny; asercje: jednostki (liczba + heks), miasta (liczba grup = `cities.len()`), `selection`/`reachable` niepuste i narysowane, puste przy `build_mode_open`, eksploracja nie maleje, idempotencja (struktura + JSON), ramka = bezpośrednia ramka aktywnego fotela.

## 5. Mutanty

### 5a. Mutanty dispatchu (odtworzone przez Evaluatora skryptem, plik przywrócony i porównany `cmp` = identyczny)

| Mutant | Zmiana w `src/lib.rs` | Wynik (pierwsza asercja) |
|---|---|---|
| (a) brak kontroli sesji | usunięte `if self.map.is_none() { return Err(NoSession) }` w `on_state_changed` | ZABITY: `calls == (0,0)` (l. 258) |
| (b) inny fotel | `VIEWER_SEAT = Some(2)` | ZABITY: 3 testy (`Source(... fotel 2 ...)` / viewer seat) |
| (c) zgubienie `selected_unit_id` | `set_frame_ui` zapisuje `selected_unit_id: None` | ZABITY: „selection in the DTO” (l. 226) |
| (d) `MapUiState` woła silnik | `set_map_ui` → `on_state_changed()` | ZABITY: „MapUiState does not call the engine” (l. 325) |
| (e) brak cache | `present` nie zapisuje ramki | ZABITY: 3 testy (`last_frame`/scena) |

### 5b. Mutanty Evaluatora (każda nowa gałąź `lib.rs`)

| ID | Mutant | Wynik |
|---|---|---|
| E1 | `present_ref`: `MapScene::new` przy KAŻDEJ ramce zamiast `get_or_insert_with` | **PRZEŻYŁ** |
| E2 | `on_session_created` nie czyści `frame/inputs/scene` | ZABITY (l. 479) |
| E3 | `set_ui`: przy równym `frame_ui` brak ponownego złożenia | ZABITY („ui back: map ui”, l. 204) |
| E4 | `set_ui`: nigdy silnik | ZABITY (`(1,6)`, l. 378) |
| E6 | `present`: zapis do cache PRZED `present_ref` (cache nadpisany także przy `FrameError`) | **PRZEŻYŁ** |
| E7 | `detail` ignorowane (stałe `High`) | **PRZEŻYŁ** |
| E8 | `VIEWER_SEAT = Some(1)` (stały fotel ludzki zamiast aktywnego) | **PRZEŻYŁ** |
| E9 | `set_map_ui` bez ponownego złożenia | ZABITY (l. 204) |
| E10 | `set_siege_map_panel_open` bez ponownego złożenia | ZABITY (l. 205) |
| E11 | `FrameInputs::from_dto(..., false)` zamiast flagi panelu | ZABITY (l. 205) |
| E12 | `render_frame(VIEWER_SEAT, None)` | ZABITY (3 testy, l. 226) |
| E13 | `set_frame_ui` przed sesją woła `on_state_changed` | ZABITY (`NoSession`, l. 446) |
| E15 | `inputs` aktualizowane tylko przy pierwszej ramce | ZABITY („overlays”, l. 201) |
| E16 | `set_frame_ui` zapisuje UI PO zapytaniu silnika | ZABITY („frame of the active seat”, l. 220) |
| E17 | `recompose` pobiera ramkę z silnika zamiast z cache | ZABITY (licznik, l. 325) |
| E18 | `set_frame_ui` bez kontroli równości | ZABITY (l. 313) |

Skrypty: scratchpad `t2client-eval/mut/{mutate.py,run.sh,run2.sh}`, logi per mutant obok.

## 6. Zarzuty (do Obrony)

- **Z1 (E1, istotny):** nic nie wykrywa przebudowy `MapScene` przy każdej ramce. To łamie deklarowaną regułę T2-5 / T1 („teren budowany RAZ na sesję”, pin `main.ts:2173`, `:44769`) i — co ważniejsze dla T3 — gubiłoby stan ustawiony przez wołającego przez `scene_mut()` (resolvery `wireUnitRendererRingStance`, DŁUG-T1-RESOLVERS, które Operator sam kieruje na `scene_mut()`). Wymagany test: po pierwszej ramce ustawić coś przez `scene_mut()` (np. stan w `units_mut()`), wywołać `on_state_changed`/`set_map_ui`, sprawdzić że przetrwało; albo równoważny dowód tożsamości sceny w obrębie sesji.
- **Z2 (E6 + brak testu „błąd zachowuje poprzednią ramkę”):** dokumentacja `on_state_changed` obiecuje „On an error the cache keeps the previous frame”, a test `source_errors_are_typed_and_keep_the_cache` sprawdza tylko pusty cache bez wcześniejszej ramki. Ani ścieżka `ClientError::Frame` (np. źródło testowe zwracające DTO z `contract_version != 2` albo złą długością `fog.state`), ani zachowanie poprzedniej ramki po błędzie `Source` nie są sprawdzone. Wymagany test: ramka OK → błąd (Source i Frame) → `last_frame()` == poprzednia ramka.
- **Z3 (E7, drobny):** `MapDetailQuality` z `RenderClient::new` nie ma asercji (można zignorować bez wykrycia). Wystarczy asercja na terenie sceny dla dwóch jakości albo jawny wpis długu.
- **E8 (uwaga, nie zarzut):** `VIEWER_SEAT = Some(1)` jest równoważny w obecnym moście (jeden fotel ludzki, brak komendy zmiany aktywnego fotela). Pin ma hot-seat — test będzie możliwy dopiero, gdy most udostępni zmianę aktywnego fotela; do długu (np. DŁUG-T2-HOTSEAT-SEAT).
- **Uwaga do (e):** mutant „brak cache” ginie na `last_frame().is_some()`, nie na samej asercji idempotencji — dopuszczalne (dispatch wymaga wykrycia), odnotowane.

## 7. Długi (potwierdzone / dopisane)

- Potwierdzam długi Operatora: DŁUG-T1-NOT-SYNCED, DŁUG-T1-RESOLVERS, DŁUG-T2-CITIES-E2E (most nie ma komendy założenia miasta — sprawdzone w `EngineCommand`: `CreateSession, AddPlayer, SelectUnit, MoveUnit, CancelPlannedMarch, AdvanceTurn, GetState, DeclareWar, GetRenderLayers, GetRenderMap, GetRenderFrame`), DŁUG-T2-FRAME-TIME (NIE_ZMIERZONO), R6, DŁUG-T1-LOCK, brak CI `rust-client.yml`, reset UI przy nowej grze (T2-3).
- Dopisuję: **DŁUG-T2-HOTSEAT-SEAT** (E8), **DŁUG-T2-PARTIAL-SCENE** — przy `FrameError` w pierwszym `apply` sesji `scene` zostaje `Some` (częściowo zsynchronizowana), a `inputs` = `None` (zachowanie T2-4 udokumentowane; do rozstrzygnięcia przy T3, czy powłoka ma wtedy wyrzucić scenę).

## 8. Werdykt

**PASS-WITH-NOTES.** Wszystkie bramki dispatchu odtworzone z EXIT 0, allowlista czysta, brak `#[ignore]`, decyzje D-371-1/3/4/7 zastosowane,
cytaty pinu zgodne, mutanty a–e zabite. Zarzuty Z1–Z2 (luki testowe na deklarowanych właściwościach: trwałość sceny w sesji i zachowanie
cache przy błędzie) oraz Z3 przekazuję Obronie do domknięcia testami w `rust-port/client/tests/**` (w allowliście); bez zmian w engine/renderer.
