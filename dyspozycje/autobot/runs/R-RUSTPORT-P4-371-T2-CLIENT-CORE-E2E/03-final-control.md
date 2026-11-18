# R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E — Final Control r1

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (port Rust, klient renderera; bez zmian gameplay)
TEMAT: R-RUSTPORT-P4-371-T2-CLIENT-CORE-E2E (#371, T2)
GOAL: crate rust-port/client (civ-client, bez Tauri, bez gpu): właściciel stanu UI i reguły odświeżania,
      woła GetRenderMap/GetRenderFrame przez RenderSource i zasila MapScene; test e2e engine → most → adapter → renderer CPU
ZMIANY/COMMIT: oceniany kod = 9b893f511 (obrona) ← 390770fa4 (Evaluator) ← 23476e97c (Operator r1) ← baza e4ffbc342;
               FC dodaje wyłącznie ten raport (gałąź lokalna fc/P4-371-T2-client), bez zmian kodu
TESTY: generate-lockfile 0 (lock bajtowo = commit), fmt --check 0, clippy --locked --all-targets -D warnings 0,
       test --locked --all-targets 0 (8 passed / 0 failed / 0 ignored); mutanty dispatchu a–e 5/5 zabite; mutanty FC 3/3 zabite
BLOKADY: brak
RUNDY: 1/5
NASTĘPNY KROK: integracja orkiestratora (FF/merge na rust-port/parity-v2), wpis decyzji T2-1..T2-5 i długów do REJESTR-RUST
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, pochodzenie, allowlista (sprawdzone samodzielnie)

- `origin/rust-port/parity-v2` = `e4ffbc342` w chwili FC = linia „BAZA:” dispatchu. Łańcuch: `e4ffbc342 → 23476e97c → 390770fa4 → 9b893f511` (liniowy, jedyne commity ponad bazą).
- `git diff --stat e4ffbc342 9b893f511` — 9 plików, wszystkie z allowlisty:
  `rust-port/client/{Cargo.toml, Cargo.lock, .gitignore, .cargo/config.toml, src/lib.rs, tests/engine_bridge_renderer.rs}` + `01-operator-r1.md`, `02-evaluator.md`, `02a-obrona.md`.
  Brak zmian w `engine/`, `renderer/` (w tym `renderer/Cargo.lock`), `view-model/`, `src-tauri/`, `gra/`, `.github/`, `REJESTR-RUST.md`.
- `git diff --check` czyste. Brak `#[ignore]`. `#[allow(dead_code)]` tylko na `mod bridge` (kopia `bridge.rs` przez `#[path]`).
- Commity: brak `Co-Authored-By` z nazwą modelu; jest tylko `Claude-Session:` (dozwolone).
- `Cargo.toml`: `rust-version = "1.87"`, bez workspace, zależności `path` na `civ-engine`, `civ-renderer` (domyślne cechy = bez `gpu`), `civ-view-model`; dev `serde`, `serde_json`. `.cargo/config.toml` z `[resolver] incompatible-rust-versions = "fallback"` — potrzebny (cargo czyta tę opcję tylko z config), jak w rendererze.

## 2. Bramki odtworzone przez FC

Środowisko: `rustc 1.97.0`, worktree sparse (`--cone rust-port dyspozycje src-tauri`), `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` = scratchpad `t2client-fc/target` (poza repo), uruchomione `setsid nohup`, EXIT w logu.

| Bramka | EXIT |
|---|---|
| `cargo generate-lockfile` + `cmp` z `Cargo.lock` commitu | 0 / 0 (bajtowo identyczny) |
| `cargo fmt --all -- --check` | 0 |
| `cargo clippy --locked --all-targets -- -D warnings` | 0 |
| `cargo test --locked --all-targets` | 0 — lib 0 testów; `engine_bridge_renderer` 8 passed (6 testów klienta + 2 testy jednostkowe dołączonego `bridge.rs`), 0 failed, 0 ignored |

Target po bramkach: 506 MB; usunięty po bramkach i mutantach.

**Dysk (odstępstwo procesowe, jawne):** dispatch wymaga ≥ 12 GB przed bramką renderera. W chwili FC wolne było 9,8–10 GB, stabilnie
(~25 min obserwacji, bez zmian; brak w zasięgu FC miejsca do odzyskania poza własnym worktree, który zredukowałem do sparse).
Równolegle działał jeden build engine (T1 SIEGE-DEF) — razem 2 buildy, w limicie. Bramkę uruchomiłem z zabezpieczeniem
(próbkowanie `df` co 10 s, przerwanie przy < 2,5 GB). Zmierzone minimum wolnego miejsca w trakcie bramek: 9,6 GB; szczyt targetu 506 MB.
Próg 12 GB okazał się dla tego crate'u z dużym zapasem — informacja dla orkiestratora przy kolejnych dispatchach klienta.

**Pełny test engine: NIE WYKONANO** — nie jest bramką T2 w dispatchu (BRAMKI tylko w `rust-port/client`), diff w `rust-port/engine` = 0 plików;
engine lib i `bridge.rs` są kompilowane i wykonywane w teście e2e.

## 3. Web najpierw (pin `07d2fbd72`) — sprawdzone wyrywkowo przez FC

- `main.ts:7115-7124` `syncPlayerUnitSelectionOnMap`: `setSelectionHex` przed gałęzią; przy `isSiegeMapPanelOpen()` `reachable = new Set(); clearHighlight()` — zgodne z asercją „pierścień zostaje, podświetlenie znika”.
- `main.ts:26699-26703`: `isHotSeat(humanSeats)` i `onOpenBuild → clearPlayerUnitSelection()` — zgodne z `VIEWER_SEAT = None` (aktywny fotel) i z asercją pustego `selection/reachable` przy `build_mode_open`.
- Cytaty Operatora/Evaluatora (`:15411-15416`, `:15459-15469`, `:46138-46156`) zweryfikowane przez Evaluatora; FC nie znalazł sprzeczności.

## 4. Zgodność z GOAL i kryteriami końca

- `ClientUiState { frame_ui, map_ui, siege_map_panel_open }`, start = `RenderUiParams::default()` + `MapUiState::WEB_INITIAL` + `false` (D-371-3) — jest, test `client.ui() == web_initial()`.
- `RenderSource` (z `type Error` — równoważny z kształtem dispatchu), typy ładunków re-eksportowane z `civ_engine::domain::render_frame`, bez duplikatów; implementacja nad `EngineBridge` po stronie testu (D-371-1).
- `RenderClient`: `on_session_created` → `GetRenderMap` + `MapStatic::from_dto`; `on_state_changed`/`set_frame_ui`/`set_ui` (przy zmianie `frame_ui`) → `GetRenderFrame` + `FrameInputs::from_dto` + `MapScene::apply`; cache ostatniego DTO; `set_map_ui`/`set_siege_map_panel_open` bez silnika (D-371-4); ramka przed sesją = `Err(ClientError::NoSession)` bez paniki i bez wywołania silnika.
- Scenariusz e2e kompletny wg dispatchu (CreateSession → GetRenderMap → GetRenderFrame → SelectUnit + `selected_unit_id` → MoveUnit → GetRenderFrame → AdvanceTurn → GetRenderFrame) z asercjami: adaptery bez błędu, liczba tokenów jednostek / grup miast = DTO, `selection`/`reachable` niepuste po zaznaczeniu i puste przy `build_mode_open`, eksploracja nie maleje, idempotencja (struktura i JSON).
- Brak duplikatu stanu gry: pola klienta = `source`, `detail`, `ui`, `map` (MapStatic), `frame` (DTO), `inputs`, `scene` — wyłącznie stan UI, cache DTO i stan renderera.

## 5. Mutanty

### 5a. Mutanty dispatchu — odtworzone przez FC (skrypt `t2client-fc/mut/{mutate.py,run.sh}`, `src/lib.rs` przywrócony, `cmp` = identyczny, `git status` czysty)

| Mutant | Zmiana | Wynik (testy padające) |
|---|---|---|
| (a) brak kontroli sesji w `on_state_changed` | usunięte `if self.map.is_none() { return Err(NoSession) }` | ZABITY — e2e l. 260: `calls == (0,1)` zamiast `(0,0)` (silnik wołany przed sesją); błąd nadal typowany, bez paniki |
| (b) inny fotel | `VIEWER_SEAT = Some(2)` | ZABITY — 6/6 testów klienta (asercja fotela / `Source("fotel 2 nie istnieje")`) |
| (c) zgubienie `selected_unit_id` | `set_frame_ui` zapisuje `selected_unit_id: None` | ZABITY — 3 testy (asercja `selection`) |
| (d) `MapUiState` woła silnik | `set_map_ui` → `on_state_changed()` | ZABITY — 3 testy (licznik wywołań) |
| (e) brak cache | `present` nie zapisuje ramki | ZABITY — 5 testów (`last_frame` / idempotencja) |

### 5b. Mutanty FC (nowe)

| ID | Mutant | Wynik |
|---|---|---|
| F3 | `recompose` gubi ramkę z cache (`take()` bez przywrócenia) | ZABITY (e2e, `errors_after_a_frame_keep_the_previous_frame`) |
| F7 | `set_ui` ignoruje `siege_map_panel_open` | ZABITY (e2e) |
| F8 | `set_siege_map_panel_open` bez ponownego złożenia ramki | ZABITY (e2e) |

## 6. Orzeczenia w sprawie zarzutów

| Zarzut | Źródło | Orzeczenie | Uzasadnienie (dowód) |
|---|---|---|---|
| Z1 — przebudowa `MapScene` przy każdej ramce niewykrywana (E1) | Evaluator | **ODDAL** (domknięty) | Obrona dodała `scene_is_built_once_per_session_and_keeps_caller_state`; test przechodzi w bramce FC; mutant E1 zabity wg logu Obrony |
| Z2 — brak testu „błąd zachowuje poprzednią ramkę” (E6) | Evaluator | **ODDAL** (domknięty) | `errors_after_a_frame_keep_the_previous_frame` pokrywa `Source`, `Frame(ContractVersion)`, `Frame(View)` i odzysk; FC dodatkowo zabił F3 tym testem |
| Z3 — `MapDetailQuality` bez asercji (E7) | Evaluator | **ODDAL** (domknięty) | `detail_quality_reaches_the_terrain` (Low ≠ High, `roblox_lite`) przechodzi w bramce FC |
| E8 — `VIEWER_SEAT = Some(1)` nierozróżnialny | Evaluator (uwaga) | **ODDAL** → dług | most nie ma komendy zmiany aktywnego fotela; decyzja `None` = `ME()` zgodna z hot-seat pinu (`main.ts:26699`); DŁUG-T2-HOTSEAT-SEAT |
| Mutant (e) ginie na `last_frame`, nie na samej idempotencji | Evaluator (uwaga) | **ODDAL** | dispatch wymaga wykrycia — wykryty w 5 testach |
| Pełny test engine nie uruchomiony | Evaluator/Obrona | **ODDAL** | nie jest bramką T2; diff engine = 0 plików |
| FC-1 — dysk < 12 GB przy bramce | FC | **ODDAL** (odstępstwo jawne, §2) | min. 9,6 GB wolnego w trakcie, target 506 MB, 2 buildy w limicie; brak ryzyka dla innych buildów |
| FC-2 — `set_frame_ui` zapisuje nowe UI przed zapytaniem silnika; przy błędzie UI ≠ UI ramki w cache | FC | **ODDAL** | zgodne z webem (`selectedId` jest prawdą UI, odświeżenie po nim); kolejny `on_state_changed` ponawia z aktualnym UI; mutant E16 (odwrotna kolejność) zabity przez Evaluatora. Do opisu w T3 (powłoka) |
| FC-3 — asercja „grupy miast = `cities.len()`” w e2e sprawdzana na 0 miast | FC | **ODDAL** → dług | most nie ma komendy założenia miasta (`EngineCommand` sprawdzony przez Evaluatora), zmiana engine poza allowlistą; DŁUG-T2-CITIES-E2E |

Żadnego zarzutu NAPRAW. Żadnej sprawy DO DECYZJI CZŁOWIEKA (gameplay bez zmian; decyzje T2-1..T2-5 są techniczne — do wpisu orkiestratora w REJESTR-RUST).

## 7. Długi (do rejestru orkiestratora)

DŁUG-T1-NOT-SYNCED, DŁUG-T1-RESOLVERS (teraz z testem trwałości stanu z `scene_mut()`), DŁUG-T2-CITIES-E2E, DŁUG-T2-FRAME-TIME (NIE_ZMIERZONO),
R6 (eksploracja wzdłuż ścieżki wieloheksowej — NIE_ZMIERZONO), DŁUG-T1-LOCK, brak CI `rust-client.yml` (poza allowlistą — crate nie jest bramkowany automatycznie),
reset `ClientUiState` przy nowej grze (T2-3, do T3 wg webu), DŁUG-T2-HOTSEAT-SEAT, DŁUG-T2-PARTIAL-SCENE.

## 8. Werdykt

**PASS-WITH-NOTES.** Bramki dispatchu odtworzone samodzielnie z EXIT 0, allowlista czysta, mutanty a–e i 3 mutanty FC zabite,
zarzuty Evaluatora domknięte testami Obrony. Noty: odstępstwo dyskowe (§2), długi (§7). SHA do integracji: `9b893f511`
(+ ten raport FC na gałęzi `fc/P4-371-T2-client`).
