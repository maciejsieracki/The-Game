# R-RUSTPORT-P4-371-T1-FRAME-ADAPTER — Evaluator r1 (adwersarialny)

```text
STATUS: PASS-WITH-NOTES
DOMAIN: GAME (renderer CPU, bez reguł gry)
TEMAT: R-RUSTPORT-P4-371-T1-FRAME-ADAPTER (#371, T1)
GOAL: view::frame — (&MapViewDto, &RenderLayersDto, &MapUiState, siege_map_panel_open) → komplet wejść
      adapterów view::* → stan CPU renderera (MapScene) w kolejności odświeżeń webu
ZMIANY/COMMIT: oceniany commit Operatora 70e532033 (gałąź rust-port-wip/r-rustport-p4-371-t1-frame-adapter),
      rodzic 51f36370d = origin/rust-port/parity-v2 (merge-base sprawdzony). Evaluator: tylko ten raport.
TESTY: fmt EXIT 0; clippy --locked --all-targets -D warnings EXIT 0; cargo test --locked --all-targets EXIT 0
      (81 binarek, 705 passed / 0 failed / 0 ignored; view_frame 18/18). Mutanty: 4 wymagane przez dispatch
      (+ warianty) ZABITE; 3 nieekwiwalentne mutanty Evaluatora PRZEŻYŁY (E1, E2, E4/E5) — §4.
BLOKADY: brak (zarzuty Z1–Z4 do Obrony; żaden nie wymaga zmiany adaptera ani wyjścia poza allowlistę)
RUNDY: 1/5
NASTĘPNY KROK: Obrona Operatora (Z1–Z3: testy w tests/view_frame.rs; Z4: sekcja Długi), potem Final Control
DEPLOY/PUSH: NIE WYKONANO
```

## 1. Baza, allowlista, zakazy

- `git merge-base 70e532033 origin/rust-port/parity-v2` = `51f36370d` = BAZA dispatchu. Jeden commit Operatora.
- `git diff --stat 51f36370d..70e532033`: `01-operator-r1.md` (+150), `renderer/src/view.rs` (+2),
  `renderer/src/view/frame.rs` (+461, nowy), `renderer/tests/view_frame.rs` (+732, nowy). Zgodne z allowlistą.
- `view.rs`: wyłącznie `pub mod frame;` + `pub use frame::{FrameError, FrameInputs, MapScene, MapStatic};` — OK.
- Brak zmian w istniejących adapterach, `engine/`, `view-model/`, `src-tauri/`, `gpu`, `Cargo.toml`, `Cargo.lock`.
  Sekcja „pliki spoza allowlisty”: brak (Cargo.lock nie commitowany — patrz §2).
- `#[ignore]`, `should_panic`: brak (grep). Asercje nieosłabione (nowe pliki, brak zmian w starych testach).
- Commit: trailer tylko `Claude-Session:`, bez linii z nazwą modelu — OK.

## 2. Bramki (odtworzone samodzielnie, `rust-port/renderer`, BEZ `--features gpu`)

Środowisko: `CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0`,
`CARGO_TARGET_DIR` = scratchpad `t1eval/target` (poza repo; usunięty po bramkach i mutantach).

| Bramka | Wynik |
|---|---|
| `cargo fmt --all -- --check` | EXIT 0 |
| `cargo clippy --locked --all-targets -- -D warnings` na czystym commicie | **EXIT 101** — `cannot update the lock file … --locked` (śledzony `renderer/Cargo.lock` nie zawiera `civ-view-model`; dług bazowy, potwierdza D-T1-6 / DŁUG-T1-LOCK Operatora) |
| j.w. po lokalnym `cargo tree --offline` (+34 linie lock: `civ-view-model`, `itoa`, `serde_json`, `zmij`; cofnięte `git checkout`) | EXIT 0 |
| `cargo test --locked --all-targets` (pełny, `setsid nohup`, log z `EXIT=`) | EXIT 0, 16:11:40–16:14:24 UTC; 81× `test result: ok`, suma 705 passed / 0 failed / 0 ignored; `view_frame` 18 passed |

Dysk: na starcie clippy 7,5 GB → 11 GB na starcie pełnego testu (inne workery sprzątały) — **poniżej progu 12 GB z
dispatchu**; ryzyko oceniłem jako niskie (target renderera bez debug: 53 MB po clippy), równoległy build renderera:
brak (`pgrep`: tylko `civ_engine` innego workera). Odnotowuję jako odstępstwo procesowe, nie zarzut wobec Operatora.

## 3. Zgodność z pinem `07d2fbd72` (czytane `git show 07d2fbd72:gra/src/main.ts`, `render/units.ts`)

Sprawdzone cytaty Operatora — trafne, z drobnymi przesunięciami linii w `refreshFog` (Operator: `setFog` `:13489`, ponowny `syncUnitsRender` `:13501`; pin: `:13491`, `:13502`; `:13489` to `syncVillageMeshes`) — kosmetyka komentarza `frame.rs:41-45`, do poprawy przy okazji Z4:
- sekwencja po wczytaniu `main.ts:46139` `syncWonderRender` → `:46142` `syncUnitsRender` → `:46143`
  `cityRenderer.sync` → `:46150` `refreshTradeRoutesOverlay` → `:46151` `refreshSiegeMarkers` → `:46152`
  `refreshFog` → `:46156` `refreshMapOverlayToggles`; `MapScene::apply` odtwarza ją w tej kolejności;
- `refreshFog` `:13475-13520`: `setFog` `:13491`, `syncUnitsRender(visibleUnitsList(vis))` `:13502`,
  `cityRenderer.applyFogVisibility` `:13503`, `wonderRenderer.applyFogVisibility` `:13504`, gałąź bez mgły `:13505-13513`;
- `syncUnitsRender` `:14550-14553` (`setForceVisibleUnitId`, `setCityHexKeys`, `unitRenderer.sync`);
- `getTopY: (q, r) => unitRenderer.topYAt(q, r)` `:17522`; `topYAt` `render/units.ts:6515-6518` = `terrainTopY(hex)`
  lub 0 — `MapUnitRenderer::top_y_at` (`map_units/mod.rs:203-205`) jest 1:1, więc D-T1-3 (ominięcie
  `SiegeInputs::sync` z `TerrainPickScene`) jest wierniejsze pinowi niż istniejący adapter; wywołanie
  `SiegeMarkerRenderer::sync` z publicznych pól — bez zmiany adaptera. Akceptuję.
- `syncPlayerUnitSelectionOnMap` `:7115-7135` (koniec = 7135, zgodnie z dispatchem), bramka panelu oblężenia `:7120-7122`;
- `revealAllLand = false` `:12803` (D-T1-4) — OK.

Decyzje D-T1-1 (okolica/teren w `FrameInputs`, nie w `MapStatic` — odstępstwo od litery dispatchu, uzasadnione:
`okolica_map` i `terrain_data` czytają `hex_state`), D-T1-2 (scena terenu raz na grę), D-T1-5 (pominięte drugie
`syncUnitsRender` w `refreshFog`; idempotencję `sync` potwierdza test 3× `apply`) — akceptuję jako techniczne.

## 4. Mutanty (skrypt Evaluatora `t1eval/run_mut.sh` + `mut.py`, każdy na `cargo test --locked --test view_frame`, plik przywrócony `cmp` → RESTORED)

Wymagane przez dispatch:

| Mutant | Wynik | Testy, które padły |
|---|---|---|
| D6 prawdziwa zamiana: blok mgły (teren/miasta/cuda) przeniesiony PRZED sync cudów/jednostek/miast | ZABITY | apply_matches…, city_fog_comes_after_city_sync, wonder_fog_comes_after_wonder_sync, next_frame… |
| D7 tylko `apply_city_fog` przed `cityRenderer.sync` | ZABITY | apply_matches…, city_fog…, next_frame… |
| D2 pominięcie `apply_city_fog` | ZABITY | apply_matches…, city_fog…, next_frame… |
| D3 pominięcie `with_siege_map_panel_open` | ZABITY | apply_matches…, siege_map_panel_gate_is_applied |
| D4 `<` zamiast `!=` w wersji kontraktu | ZABITY | contract_version_other_than_2_is_an_error |
| D5 `>` zamiast `!=` | ZABITY | contract_version_is_checked_first, contract_version_other_than_2… |

Adwersarialne (nowe gałęzie / przewody `frame.rs`):

| Mutant | Wynik | Komentarz |
|---|---|---|
| E6 pominięcie `sieges.sync` | ZABITY | apply_matches…, siege_marker_of_the_besieged_city |
| E7 pominięcie `wonders.sync` | ZABITY | apply_matches…, wonder_fog… |
| E8 `overlays` nie zapisane w scenie | ZABITY | apply_matches… |
| E9 `sync` miast bez buntu | ZABITY | apply_matches…, revolt…, next_frame… |
| E10 `getTopY` ≡ 0 | ZABITY | apply_matches… |
| E11 `city_hexes` z jednostek zamiast miast | ZABITY | 3 testy |
| E12 `apply_city_fog` z obcym `ME()` | ZABITY | 3 testy |
| **E1** `FogSets::from_dto(…, true)` zamiast `viewer.fog_active` | **PRZEŻYŁ** | brak ramki z `fog_active = false` (gałąź `:13505-13513`) — Z1 |
| **E2** wynik `setFog` (`showOceanBackdrop`) ignorowany | **PRZEŻYŁ** | fixture nie ma heksu nieodkrytego (kod 0), więc `true` = wartość startowa — Z2 |
| **E4** `overlay_layers(…, &MapUiState::WEB_INITIAL)` zamiast `ui` | **PRZEŻYŁ** | wszystkie testy używają `UI = WEB_INITIAL` — Z3 |
| **E5** `sync_units(…, &MapUiState::WEB_INITIAL)` zamiast `&f.ui` | **PRZEŻYŁ** | j.w. (`force_visible_unit_id`) — Z3 |
| E3 `UnitOverlayInputs::apply` przed `sync_units` | przeżył — EKWIWALENTNY | `MapUnitRenderer::sync` (`map_units/mod.rs:292-…`) nie dotyka `selection`/`highlight`/`route` |
| D1 mgła powielona przed sync (bez usunięcia późniejszej) | przeżył — EKWIWALENTNY | późniejsze `applyFogVisibility` nadpisuje; prawdziwa zamiana = D6 (zabity) |

Mutanty Operatora M1–M7 nie były powtarzane 1:1 (pokrywają je D2–D7, E11); wynik zgodny z jego tabelą.

## 5. Zarzuty (do Obrony)

- **Z1 (pokrycie, E1):** `FrameInputs::from_dto` przekazuje `viewer.fog_active`, ale żaden test nie ma ramki z
  `fog_active = false` (pin: `refreshFog` gałąź `else`, `main.ts:13505-13513`: `setFog(ALL_KEYS, ALL_KEYS)`,
  `applyFogVisibility(ALL_KEYS, false, ME())`). Dodać test: ramka z `fog_active = false` i heksem tylko odkrytym →
  miasto/cud na nim widoczne, teren bez mgły; porównanie z ręczną sekwencją. Musi zabić E1.
- **Z2 (pokrycie, E2):** `MapScene::show_ocean_backdrop` jest nową, publiczną częścią stanu, ale fixture nie zawiera
  heksu nieodkrytego, więc wartość po `apply` zawsze równa się startowej `true`. Dodać ramkę z heksem kodu 0
  (`apply_terrain_fog` → `false`) i asercję wartości. Musi zabić E2.
- **Z3 (pokrycie, E4/E5):** wejście `&MapUiState` — połowa sygnatury GOAL — nie jest sprawdzane żadnym testem
  (stała `UI = MapUiState::WEB_INITIAL`). Dodać ramkę z niestartowym stanem UI (np. `territory_border_visible =
  false` → brak grupy terytorium; `force_visible_unit_id = Some(..)` → żeton jednostki wymuszonej) i porównanie z
  ręczną sekwencją z tym samym `ui`. Musi zabić E4 i E5.
- **Z4 (dokumentacja zakresu, bez zmiany kodu):** nagłówek `frame.rs:25-27` twierdzi, że sekwencja po wczytaniu to
  „wywołania, których potrzebuje każda ramka”, a `MapScene` po cichu pomija wywołania pinu, dla których w
  rendererze istnieją już porty CPU spoza `view::*`:
  `cityRenderer.syncStatChips(cities, _cityRenderOpts(...))` (`main.ts:14563`; `_syncStatChip` w `cityRenderer.sync`;
  port `cities/sync/stat_chips.rs:201` `sync_stat_chips(cities, models, &MapUiState)`),
  `syncForestForUnits(unitForestHexKeys)` (`main.ts:14562`; port `decor/placement/mod.rs:244`),
  w `refreshFog`: `syncCampMeshes`/`syncVillageMeshes` (`:13488-13489`), `syncResourceOverlayFog`,
  `syncImprovementMeshFog`, `syncSettlementMeshFog` (`:13495-13497`), oraz `reapplyWonderHexDecorHides`
  (`:4317`). Skutek: pola `MapUiState.is_city_panel_open`, `hover_stat_chip_city_id`, `city_panel_view_city_id`
  nie mają w `MapScene` żadnego odbiorcy. Dispatch wymienia tylko adaptery `view::*`, więc NIE żądam portu w T1,
  ale te pominięcia muszą trafić do sekcji „Długi” raportu (np. DŁUG-T1-CHIPS-DECOR → T2 lub osobny temat
  renderera) i do komentarza nagłówka `frame.rs` (lista „not synced by MapScene”), żeby T2 nie uznał `MapScene`
  za kompletny stan mapy.

## 6. Długi (potwierdzone / nowe)

- DŁUG-T1-LOCK (Operatora) — potwierdzony pomiarem: `--locked` na czystym commicie kończy się EXIT 101.
- DŁUG-T1-RESOLVERS (Operatora) — zasadny (`wireUnitRendererRingStance`, `main.ts:10344-10384`).
- Nowy (Z4): plakietki miast, las pod jednostkami, meshe ulepszeń/zasobów/osad/wiosek/obozów, ukrywanie dekoru pod
  cudami — poza `MapScene`.
- Notatka FC spoza tematu `MAX_PER_SIDE=120` w `battle/field.rs` — nie ten temat, nie ruszane.

## 7. Sprzątanie

Lokalna zmiana `renderer/Cargo.lock` cofnięta (`git checkout`), `frame.rs` przywrócony po mutantach (`cmp`),
target `t1eval/target` usunięty; `df -h /` po: 13 GB wolnego.
