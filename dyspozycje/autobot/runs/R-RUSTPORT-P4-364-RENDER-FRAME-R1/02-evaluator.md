# R-RUSTPORT-P4-364-RENDER-FRAME-R1 — Evaluator (adwersarialny), runda 1

STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-RUSTPORT-P4-364-RENDER-FRAME-R1
GOAL: składacz pełnej ramki renderera (`RenderLayersDto`) i mapy statycznej (`MapViewDto`) z `PlayableState` + sesji mgły, wystawiony przez most komendami `GetRenderMap` / `GetRenderFrame` (D-R3-1..6).
ZMIANY/COMMIT: oceniany kod: `08ab91229` (gałąź `rust-port-wip/R-RUSTPORT-P4-364-RENDER-FRAME-R1`), rodzic `0f77c9da3` = `origin/rust-port/parity-v2` (linia BAZA dispatchu, potwierdzone `git rev-parse`). Evaluator dodaje wyłącznie ten raport.
TESTY: fmt EXIT 0; clippy `-D warnings` EXIT 0; `--test p4_364_render_frame` 16 passed EXIT 0; pełne `cargo test --all-targets --no-fail-fast` (engine) EXIT 0 (527 bloków `ok`, 3944 passed, 0 failed, 1 ignored — istniejący wcześniej `e2e::dump_tick1_econ_for_web_generator`). Mutacje operatora (a)–(e): 6/6 FAIL. Mutacje własne Evaluatora: 2/6 FAIL, 4/6 PRZEŻYŁY (niżej).
BLOKADY: brak blokad kodu. INFRA w trakcie oceny: pierwszy przebieg pełnej bramki stracił katalog targetu (usunięty z zewnątrz, 246× `No such file or directory`, 0 FAILED); ponowiony w osobnym katalogu — EXIT 0.
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (zarzuty 1–2), potem Final Control. Zarzut 1 wymaga decyzji technicznej orkiestratora.
DEPLOY/PUSH: NIE WYKONANO

## Bramki odtworzone

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`, `CARGO_TARGET_DIR` w scratchpadzie (poza repo). Dysk przed pełną bramką: 10–11 GB wolne (≥ 8 GB).

| Bramka | Wynik |
|---|---|
| `cargo fmt --check` | EXIT 0 |
| `cargo clippy --all-targets -- -D warnings` | EXIT 0 |
| `cargo test --test p4_364_render_frame` | 16 passed, 0 failed, 0 ignored, EXIT 0 |
| `cargo test --all-targets --no-fail-fast` (przebieg 1) | EXIT 101 — INFRA: katalog targetu usunięty z zewnątrz w trakcie biegu; 281 bloków `ok`, 0 FAILED, 0 panicked, 246 binariów „never executed” |
| `cargo test --all-targets --no-fail-fast` (przebieg 2, nowy katalog) | EXIT 0; 527 bloków `ok`, 3944 passed, 0 failed, 1 ignored (sprzed tematu) |
| `mutate-r1.py` operatora | 6/6 FAIL (zgodnie z raportem operatora) |

## Allowlista

`git diff --stat 0f77c9da3 08ab91229`:

- `rust-port/engine/src/domain/render_frame.rs` (nowy, 746) — na liście.
- `rust-port/engine/src/domain/mod.rs` (+1, tylko `pub mod render_frame;`) — zgodnie z ograniczeniem.
- `rust-port/engine/src/bridge.rs` (+96) — na liście; komendy, wyniki, metody `EnginePort` z domyślnym `engine_rejected`, implementacja `CivEngineAdapter`, dyspozytor bez `StateChanged`, `MockEngineAdapter` tylko gałęzie `match` z domyślnym odrzuceniem.
- `rust-port/engine/tests/p4_364_render_frame.rs` (nowy) — na liście.
- `rust-port/engine/tests/p4_364_bridge_layers.rs` (1 linia) — **spoza listy**, wypisane w sekcji „Pliki spoza allowlisty”; zmiana mechaniczna (`BridgeResult::State { .. }` → `_` w `match`, komunikat bez zmian). Przyjmuję.
- katalog runs — na liście.

`playable.rs`, `dto_bridge.rs`, `map_view.rs`, `city_view.rs`, `overlays_view.rs`, `recruitment.rs`, view-model, renderer: bez zmian (potwierdzone diffem). `Cargo.lock` niecommitowany. Brak `#[ignore]` w diffie (0 trafień). Asercje istniejących testów nie zostały osłabione (jedyna zmiana w starym teście to ramię `match`).

Uwaga poza zakresem: `tests/bridge_contract.rs` w katalogu głównym repo ma niewyczerpujący `match`; nie należy do żadnej skrzynki Cargo (brak `Cargo.toml` w katalogu głównym), więc nie łamie kompilacji.

## Zgodność z decyzjami D-364-R3

| Decyzja | Ocena |
|---|---|
| D-R3-1 | Spełniona. `GetRenderMap`→`RenderMap{map}`, `GetRenderFrame{seat,ui}`→`RenderFrame{frame}`, bez `StateChanged` (moje mutanty E1 i operatora d → FAIL). `GetRenderLayers` bez zmian, `CONTRACT_VERSION` = 1 (test g, mutant e). |
| D-R3-2 | Spełniona. `RenderUiParams` camelCase, `#[serde(default)]`, `deny_unknown_fields`, nazwy z `SelectionUi`/`BuildHighlightUi`/`UnitOverlaysInput`. Brak `ui` = brak selekcji i trybu (test `c_brak_ui_to_brak_zaznaczenia`). |
| D-R3-3 | **Częściowo — zarzut 1.** Czyszczenie selekcji/zasięgu/trasy działa dla `foundCityMode`, `wonderActive` i `buildModeOpen` + klucz; NIE działa dla `buildModeOpen` bez klucza, a test to utrwala. |
| D-R3-4 | Spełniona z jawnym odstępstwem D-OP-1 (`&mut PlayableFogSession` zamiast `&`; jedyna mutacja to kumulacja eksploracji sesji, jak `GetRenderLayers` z r2; `PlayableState` nietknięty — test f). Przyjmuję. Moduł nowy, czysta funkcja, producenci bez zmian zachowania. |
| D-R3-5 | Spełniona. `viewer` = fotel zapytania (test d), `turn` = `state.turn`, `contract_version` = `vm::CONTRACT_VERSION`, `hex_state` równoległe do `map.hexes` (test b + `RenderViewDto::join`), kolejność miast/jednostek z silnika. |
| D-R3-6 | Spełniona bez nowego pola sesji (D-OP-2): `PlayableGame::new` buduje mapę z `build_map` bez rzek/wiosek/złóż, więc `snapshot_map_of` nie gubi danych, które sesja ma. Sprawdzone w `playable.rs:1122-1147`. |

## Tabela pól ramki — weryfikacja źródeł i „cichych zer”

| Pole | Źródło w kodzie | Zgodność z pinem `07d2fbd72` | Ocena |
|---|---|---|---|
| `contractVersion` | `vm::CONTRACT_VERSION` | — | OK |
| `viewer` | fotel + `layers.fog.fog_active` | `ME()` | OK |
| `turn` | `state.turn` | — | OK |
| `hexState` | `build_hex_dyn(snapshot_map_of, miasta)` | `:17083` | OK |
| `fog` | `build_view_layers` | `refreshFog` `:13475-13513` | OK |
| `owners`/`cities` | `owner_views`/`city_views`, `besieged = state.oblegane` | `_cityRenderOpts` | OK; fakty spoza stanu (kolejka, bunt, miasta-państwa) opisane w tabeli operatora, ale NIE w `RENDER_FRAME_GAPS` (uwaga 5) |
| `units` | nowy `unit_view` + `units_visible_on_map` | `syncUnitsRender` `:14450-14465`, `visibleUnitsList` `:13430-13432` = `unitsVisibleOnMap(units, vis, ME())` | Filtr zgodny z pinem. `hp` z `full_hp = map_or(0.0)` przy braku definicji — web `unitHealth` daje 30 (`:33093-33095`) (uwaga 3) |
| `stacks.visibleIds`/`badgeByRepId` | `compute_stack_display`, atak = `meleeAttack` | `unitAttackScore` `:14436-14438` (`normFieldVal(…, 0)`) | OK (brak definicji → 0 jak web) |
| `stacks.vitals/starving/goldDeficit` | `[]` | — | jawna luka w `RENDER_FRAME_GAPS` |
| `sieges` | `siege_views` + `are_enemy_owners` | `areEnemyOwners` `:13129-13133` | Logika zgodna; brak wektora (mutant E5 przeżył) |
| `wonders` | `wonder_views` | `:4205-4210` | OK; brak wektora niepustego |
| `territory` | nowy `territory_view` (filtr mgły) | `:15582-15601` | Logika zgodna z pinem; **filtr mgły bez testu** (zarzut 2) |
| `overlays.culture/religionRange` | `None` | `:15335-15336` (`false`) | OK |
| `overlays.tradeRoutes` | `trade_routes_view(&[], …)` | stan bez tras | OK |
| `overlays.okolica` | `None` | panel zamknięty | OK |
| `overlays.workerFields` | `[]` | — | jawna luka |
| `overlays.reachable/selection/pathRoute` | `unit_overlays_view` na kopii stanu z `selectedId` z UI | `:7115-7134` | OK poza zarzutem 1 |
| `overlays.buildHighlight` | `build_highlight` (kind OK, `hexes` = `[]`) | `:16351-16395` | jawna luka `hexes` |
| `battle` | `None` | brak otwartej bitwy | OK |

## Mutacje własne Evaluatora (skrypt w scratchpadzie, plik źródłowy przywracany; `git status` czysty po biegu)

| Mutant | Wynik |
|---|---|
| E1 `GetRenderMap` emituje `StateChanged` | FAIL (`a_…`, `b_…`, `f_…`) — dobrze |
| E2 `territory`: filtr mgły wyłączony (`if true || …`) | **PRZEŻYŁ** |
| E3 `buildModeOpen` bez klucza też czyści selekcję | FAIL (`c_tryb_budowy_…`) — test utrwala interpretację operatora (zarzut 1) |
| E4 `cities[].besieged` zawsze `false` | **PRZEŻYŁ** |
| E5 `sieges` zawsze `[]` | **PRZEŻYŁ** |
| E6 `units[].hp` ignoruje `economy.units[id].hp` | **PRZEŻYŁ** |

## Zarzuty

1. **[PARYTET / D-R3-3 — DO DECYZJI ORKIESTRATORA, techniczna]** `overlays_view` (`render_frame.rs:701`) czyści selekcję, `reachable` i `pathRoute` tylko przy `build_highlight_mode_active` (`foundCityMode` ∨ `wonderActive` ∨ `buildModeOpen` z niepustym kluczem). Dla `buildModeOpen = true` bez klucza ramka zostawia selekcję i zasięg, a test `c_tryb_budowy_czysci_zaznaczenie_zasieg_i_trase` (linie 198-208) to utrwala. Tymczasem:
   - D-R3-3 mówi „gdy `ui.buildMode` jest aktywny”, a pole UI odpowiadające webowemu `buildModeOpen` to właśnie `buildModeOpen`;
   - web `onOpenBuild` (`main.ts:26702-26703`) woła `clearPlayerUnitSelection()` przy ustawieniu `buildModeOpen = true`, zanim zostanie wybrany jakikolwiek klucz;
   - FC tematu Q6-2 (`R-RUSTPORT-P4-1Q6-2-BUILD-HIGHLIGHT-PARITY-R1/03-final-control.md`, orzeczenie 1 i „Tematy następcze”) przekazał do #364 właśnie przypadek „panel budowy otwarty bez klucza”: „otwarcie panelu budowy czyści zaznaczenie jednostki”.
   Argument za interpretacją operatora też istnieje: `selectPlayerUnit` (`main.ts:7233-7269`) nie zamyka trybu budowy, więc w webie można mieć jednocześnie otwarty panel i zaznaczenie wybrane później. Tyle że to samo dotyczy trybu z kluczem, który operator czyści. Reguła jest więc niespójna: czyści tam, gdzie web po `onOpenBuild` pozwala zaznaczyć ponownie, a nie czyści w jedynym przypadku, który kontrakt nazwał wprost. Wymagane: decyzja orkiestratora (czyścić przy `buildModeOpen`, zgodnie z literą D-R3-3 i kontraktem Q6-2, albo jawnie przyjąć regułę operatora i wpisać ją do `REJESTR-RUST.md`). W pierwszym wariancie poprawka to jeden warunek + odwrócenie asercji w teście (mój mutant E3 pokazuje, które asercje).
2. **[TESTY / pola produkowane od zera]** Dispatch §3(h) wymaga wektorów lub odwołań do pinu dla pól produkowanych od zera. `territory_view` to nowy producent, a jego filtr mgły (`isMe ∨ !fogOn ∨ vis ∨ explored`, `:15582-15601`) nie jest pokryty: mutant E2 (filtr wyłączony) przeżywa, bo jedyny scenariusz ma tylko terytorium własne. Brakuje wektora z cudzym terytorium pod mgłą (ukryte) i w polu widzenia/odkrytym (widoczne). Podobnie bez rozróżniających wektorów są `cities[].besieged` (E4), `sieges` (E5) i `units[].hp` z `economy.units` (E6). Te pola pochodzą z istniejących producentów, ale ich podpięcie w składaczu jest nowe i nic go nie sprawdza.
3. **[CICHE ZERO, niski]** `unit_view`: `full_hp = defs.get(&type_id).map_or(0.0, …)` i `type_id = rj.type_id.clone().unwrap_or_default()`. Brak definicji daje `hp = 0` i pusty `typeId` bez błędu, a web `unitHealth` ma domyślnie 30 (`main.ts:33093-33095`). Dla obecnego `PlayableUnitKind` jest to nieosiągalne, ale wzorcem zgodnym z regułą „bez cichych zer” byłby jawny błąd (`RenderFrameError::UnitsData`) albo wartość webu.
4. **[RAPORT, niski]** „16 testów (a)–(h)” obejmuje `bridge::add_player_atomicity_tests::…` dołączony przez moduł mostu. Własnych testów tematu jest 15. Liczba w bramce jest prawdziwa, opis nie.
5. **[JAWNOŚĆ LUK, niski]** Fakty miast spoza stanu (brak kolejki produkcji, buntu, wzrostu na żywo, miast-państw — `CityViewCityFacts::default()`, `CityStateFacts::default()`) są opisane tylko w tabeli raportu, a nie w `RENDER_FRAME_GAPS` / teście `h_jawne_luki_ramki`. Tak samo `units[].embarked/inGarnizon/isGeneral/dimmed` i odznaki `armor/soft(None)`. Dopóki stan nie ma tych pól, web w tym stanie daje te same wartości, więc nie jest to błąd. Lista luk w kodzie jest jednak niepełna względem raportu.

## Przyjęte bez zarzutu

- D-OP-1 (`&mut` sesji), D-OP-2 (`snapshot_map_of`), D-OP-4 (zaznaczenie z UI, nie ze stanu), D-OP-5 (opakowania `transparent` z ręcznym `Eq`), D-OP-6 (`areEnemyOwners` = `main.ts:13129-13133`).
- Filtr jednostek: web `syncUnitsRender` → `visibleUnitsList` = `unitsVisibleOnMap(units, vis, ME())` — zgodny 1:1.
- Mutacje (a)–(e) z dispatchu: odtworzone, 6/6 FAIL.

## Werdykt

PASS-WITH-NOTES: bramki zielone, allowlista dochowana, mutacje z dispatchu zabite, luki jawne. Przed Final Control: decyzja orkiestratora w sprawie zarzutu 1 oraz uzupełnienie wektorów z zarzutu 2 (co najmniej filtr mgły terytorium) w Obronie lub rundzie r2 tego samego ID.
