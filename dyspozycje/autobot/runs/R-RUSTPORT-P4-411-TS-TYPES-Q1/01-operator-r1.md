# R-RUSTPORT-P4-411-TS-TYPES-Q1 — Operator r1

STATUS: PASS
DOMAIN: GAME (front `src-tauri/frontend-v2`, wyłącznie typy)
TEMAT: R-RUSTPORT-P4-411-TS-TYPES-Q1 (#411 = 403-D)
GOAL: typy TS komend i odpowiedzi mostu (render/bitwa/zapis) w `frontend-v2`, zgodne z JSON silnika.
ZMIANY/COMMIT: kod `d3fc9b24c7df8221fe27aa50cdeaaaac5154a24e` na gałęzi `rust-port-wip/R-RUSTPORT-P4-411-TS-TYPES-Q1`
(baza `origin/rust-port/parity-v2` = `3f98dd284229f975e373b9c3be7a0d28232089d3`, zgodna z dispatchem); raport w commicie następnym.
TESTY: `tsc --noEmit` EXIT 0; `npm run check` EXIT 0; mutanty 17/17 zabite; budowniczowie 15/15 OK; atrapa MOCK bez zmian (dym).
BLOKADY: brak.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Opus).
DEPLOY/PUSH: NIE WYKONANO

## Zmienione pliki (allowlista)

| Plik | Zmiana |
|---|---|
| `src-tauri/frontend-v2/src/controller/bridgeTypes.ts` | NOWY: `EngineCommand` (19 wariantów), `RenderUiParams`, `PositionDto`, `SiegeBattlePayload` i DTO, `SiegeBattleErrorDto` (20 kodów), `EngineBridgeResult`/`EngineBridgeResponse`, budowniczowie `setSiegeBattleSpeed`, `stepSiegeBattle`, `getRenderFrame`, `startSiegeStorm`, `loadGame` |
| `src-tauri/frontend-v2/src/controller/bridgeTypes.typetest.ts` | NOWY: test typów (fikstury JSON z testów Rust + przypadki negatywne `@ts-expect-error`); nieimportowany przez aplikację |
| `src-tauri/frontend-v2/src/controller/commands.ts` | stary 6-wariantowy `EngineCommand`/`PositionDto`/`StartGameParams` zastąpione re-eksportem z `bridgeTypes.ts`; `BridgeResponse` + `siegeBattle?`, `saveGame?`; `BridgeError` + `siegeBattle?`; komentarz o kolizji `save_game`/`load_game` w `ProposedCommand` |
| `src-tauri/frontend-v2/src/viewmodel/types.ts` | nowa sekcja: `RenderLayersDto` (z `reveal?`), `FogRevealDto`, `FogViewDto`, `FogStateCode`, `ViewerDto`, `MapViewDto`, `TerritoryRangesDto`, `RenderLayersPayloadDto`, `RenderHexCoordDto`, `RenderNestedDto` |
| `dyspozycje/autobot/runs/R-RUSTPORT-P4-411-TS-TYPES-Q1/mutanty-411.mjs` | skrypt bramki mutantów i budowniczych |

Nie zmieniono: `src-tauri/src`, `src-tauri/frontend`, `rust-port/*`, `gra/`, `package-lock.json`, `mock.ts`, `index.ts`, `transport.ts`, `main.ts`.

## Kryterium 1: wariant Rust → typ TS (odczyt z `rust-port/engine/src/bridge.rs` @ `3f98dd284`)

`EngineCommand`: `#[serde(tag = "kind", rename_all = "snake_case")]` — `rename_all` enumu zmienia nazwy wariantów, NIE pól, więc pola wariantów zostają snake_case (potwierdzone fiksturami `bridge_contract.rs:162-195`: `city_id`, `wall_ms`).

| # | Wariant Rust (bridge.rs) | JSON `kind` | Typ TS (`bridgeTypes.ts`) | Wymagane / opcjonalne |
|---|---|---|---|---|
| 1 | `CreateSession { #[serde(default)] params }` | `create_session` | `{kind; params?: StartGameParams}` | `params` opcjonalne (default); kształt DTO kreatora poza #411 |
| 2 | `AddPlayer { id: u64, name }` | `add_player` | `{kind; id: number; name: string}` | oba wymagane |
| 3 | `SelectUnit { unit_id }` | `select_unit` | `{kind; unit_id: number}` | wymagane |
| 4 | `MoveUnit { unit_id, destination, attack_unit_id: Option (default, skip) }` | `move_unit` | `{kind; unit_id; destination: PositionDto; attack_unit_id?: number}` | `attack_unit_id` opcjonalne |
| 5 | `CancelPlannedMarch { unit_id, force: bool }` | `cancel_planned_march` | `{kind; unit_id; force: boolean}` | oba wymagane (brak default) |
| 6 | `AdvanceTurn` | `advance_turn` | `{kind}` | — |
| 7 | `GetState` | `get_state` | `{kind}` | — |
| 8 | `DeclareWar { declarer, target }` | `declare_war` | `{kind; declarer; target}` | wymagane |
| 9 | `GetRenderLayers { seat: Option (default, skip) }` | `get_render_layers` | `{kind; seat?: number}` | opcjonalne |
| 10 | `GetRenderMap` | `get_render_map` | `{kind}` | — |
| 11 | `GetRenderFrame { seat?, ui?: RenderUiParams }` | `get_render_frame` | `{kind; seat?: number; ui?: RenderUiParams}` | opcjonalne; `RenderUiParams` zamknięty (`deny_unknown_fields`), każde pole opcjonalne (`serde(default)` na strukturze), `Option` → `T \| null` |
| 12 | `StartSiegeStorm { city_id, unit_id }` | `start_siege_storm` | `{kind; city_id; unit_id}` | wymagane |
| 13 | `StepSiegeBattle { wall_ms: WallMs(f64) transparent }` | `step_siege_battle` | `{kind; wall_ms: number}` | wymagane |
| 14 | `SkipSiegeBattle` | `skip_siege_battle` | `{kind}` | — |
| 15 | `FinishSiegeBattle` | `finish_siege_battle` | `{kind}` | — |
| 16 | `AbortSiegeBattle` | `abort_siege_battle` | `{kind}` | — |
| 17 | `SetSiegeBattleSpeed { idx: i64, #[serde(default)] clamp }` | `set_siege_battle_speed` | `{kind; idx: number; clamp?: boolean}` | `idx` wymagane (całkowite, D-411-2), `clamp` opcjonalne |
| 18 | `SaveGame` | `save_game` | `{kind}` | — |
| 19 | `LoadGame { save: String }` | `load_game` | `{kind; save: string}` | wymagane (tekst JSON zapisu) |

Komplet sprawdzany typem: `Equal<EngineCommandKind, COMMAND_KINDS[number]>`, gdzie lista 19 nazw jest przepisana z `COMMAND_KINDS` w `rust-port/engine/tests/bridge_contract.rs:34-54`. `SiegeBattleCommand` = 6 wariantów `is_siege_battle` (`bridge.rs:134-144`).

Odpowiedzi:

| Rust | JSON | Typ TS | Uwagi |
|---|---|---|---|
| `BridgeResult::State { state }` | `{kind:'state', state}` | `EngineBridgeResult` | `state` = `PlayableState`, generyczne `S` (poza #411) |
| `BridgeResult::RenderLayers { layers: RenderLayersPayload }` | `render_layers` | `RenderLayersPayloadDto` | `fog`, `fogActive`, `reveal` (WYMAGANE), `territory` |
| `BridgeResult::RenderMap { map: RenderMapPayload(MapViewDto) transparent }` | `render_map` | `MapViewDto` | `width`, `height`, `seed`, `hexes`, `rivers`, `riverRenderPaths` |
| `BridgeResult::RenderFrame { frame: RenderFramePayload(RenderLayersDto) transparent }` | `render_frame` | `RenderLayersDto` | 14 kluczy + `reveal?` |
| `BridgeResponse.siege_battle: Option<SiegeBattlePayload>` (skip) | `siegeBattle?` | `SiegeBattlePayload` | dodane do `EngineBridgeResponse` i do zawężonego `BridgeResponse` |
| `BridgeResponse.save_game: Option<String>` (skip) | `saveGame?` | `string` | jw. |
| `SiegeBattlePayload.speed_idx: Option<u64>` (skip) | `speedIdx?` | `number` | tylko po `SetSiegeBattleSpeed` |
| `SiegeBattlePayload.speed_mul: Option<f64>` (skip) | `speedMul?` | `number` | jw. |
| `SiegeBattlePayload` pozostałe | `cityId`, `phase`, `actions` wymagane; `units?` (skip gdy pusty `Vec`), `frame?`, `result?`, `setup?`, `towerShooter?` | — | `BattleActionDto`/`BattleFrameDto`/`BattleSetupDto`/`CityCaptureResultDto` = `BattleNestedDto` (nieprzezroczyste; konsument = renderer Rust) |
| `SiegeBattleResultDto` | camelCase | `SiegeBattleResultDto` | `captureRequested?`, `capture?` opcjonalne, reszta wymagana; `winner` = `'atakujacy'\|'obronca'\|'remis'` (`view-model battle.rs:163`); `consumedMachines` = `'taran'\|'wieza'` |
| `BridgeError.siege_battle` (`rename = "siegeBattle"`, skip) | `siegeBattle?` | `SiegeBattleErrorDto` | 20 kodów (`tag = "code"`, pola camelCase przez `rename_all_fields`) |
| `RenderLayersDto.reveal: Option<FogRevealDto>` (default, skip) | `reveal?` | `FogRevealDto` | D-411-3: brak klucza gdy `None`, `null` niedopuszczalne w typie |
| `FogRevealDto` | `revealAllLand`, `riverRevealKeys` | `riverRevealKeys: RenderHexCoordDto[] \| null` | `Option` BEZ `skip` → zawsze obecne, `null` = web `undefined` |
| `RenderLayersDto.battle: Option<BattleViewDto>` (bez skip) | `battle` | `RenderNestedDto \| null` | zawsze obecne |
| `FogViewDto.state: Vec<FogState>` | liczby 0/1/2 | `FogStateCode[]` | `FogState::from_code` |
| `ViewerDto.owner_id: OwnerRef` | liczba (-99/-1/id) | `number` | własny `Serialize` (`ids.rs:162-176`) |

Zakres świadomie nierozpisany (typ nieprzezroczysty `Readonly<Record<string, unknown>>`): zagnieżdżone DTO heksów, miast, jednostek, stosów, oblężeń, cudów, terytorium, nakładek, bitwy w ramce oraz akcje/ramka/scena bitwy oblężniczej. Dispatch wymaga typów pól `siegeBattle`/`saveGame`/`speedIdx`/`speedMul`/`reveal` i wariantów komend; ich pokrycie jest pełne. Rozpisanie zagnieżdżonych DTO view-model to praca konsumenta (renderer/#410).

## Kryterium 2: zgodność z JSON silnika i mutanty

Test typów `bridgeTypes.typetest.ts` (sprawdzany przez `tsc --noEmit`, bo `include: ["src"]`). Fikstury przepisane 1:1 z JSON testów Rust:
- komendy: `bridge_contract.rs:162-215, 391-395`, `p4_364_render_frame.rs:349-397`, `p4_save_load_bridge.rs:278-283`; po jednej (lub więcej) próbce dla KAŻDEGO z 19 wariantów (`satisfies { [K in kind]: Extract<…>[] }`);
- odpowiedzi bitwy: `p4_407_fq_speed_bridge.rs:245-256` (`speedIdx: 3`, `speedMul: 8.0`, brak akcji/ramki), `:309-312` (krok bez kluczy prędkości), `p4_1i6_dlugi.rs:690-705` (abort), `:423` (`towerShooter`);
- błędy bitwy: wszystkie 20 z `p4_1i6_dlugi.rs:573-664` + `Equal<SiegeBattleErrorCode, …>`; `bridge_contract.rs:267`;
- zapis: `p4_save_load_bridge.rs:245-272`;
- ramka: 14 kluczy z `p4_364_render_frame.rs:407-424` i `:1791-1805` (`Equal<keyof RenderLayersDto, klucze | 'reveal'>`), `reveal` z `:1823-1826`, `:1838-1847`.

Fikstury odpowiedzi z zagnieżdżonymi DTO (np. `frame: { vNow: 16 }`, `units` startu) są minimalnymi literałami zgodnymi ze strukturą najwyższego poziomu, nie zrzutem `cargo` (temat bez cargo) — zaznaczam to jawnie.

Negatywne (`@ts-expect-error`, każdy musi dawać błąd, inaczej TS2578): `ui.selected` (deny_unknown_fields, `p4_364_render_frame.rs:378`), `set_siege_battle_speed` bez `idx` (`bridge_contract.rs:215`), `cancel_planned_march` bez `force`, `wallMs` zamiast `wall_ms`, `save` jako obiekt, nieznany `kind`, nieznany klucz `RenderUiParams`, payload bez `cityId`/`actions`, zła faza, `speedIdx: null`, `speed_idx`, błąd `city_id` snake_case, `not_adjacent` niepełny, `saveGame` jako obiekt, `reveal: null`, `reveal` bez `riverRevealKeys`, kod mgły 3, `RenderLayersPayload` bez `reveal`, ramka bez `battle`.

Mutanty (`mutanty-411.mjs`, uruchomione z `src-tauri/frontend-v2`): **17/17 zabite**, plik przywracany po każdym, `tsc` po przywróceniu OK.

| Mutant | Zabity przez |
|---|---|
| M1 usunięcie wymaganego `cityId` | TS2353 nadmiarowy klucz w fiksturze |
| M2 `speedIdx?` → wymagane | TS1360 fikstura abort bez klucza |
| M3 `reveal?` → wymagane | `_RevealOptional` (TS2344) |
| M4 usunięcie `reveal` | `_FrameKeys` (TS2344) |
| M5 usunięcie wariantu `get_render_map` | `_KindsMatchRust` (TS2344) |
| M6 `attack_unit_id?` → wymagane | TS2741 fikstura bez klucza |
| M7 `clamp?` → wymagane | TS2741 (budowniczy i fikstura `idx: 4`) |
| M8 `riverRevealKeys` `\| null` → `?:` | TS2322 `null` w fiksturze mostu |
| M9 `actions` → opcjonalne | TS2578 (negatyw bez `actions` przestał błądzić) |
| M10 `battle` → opcjonalne | TS2578 |
| M11 usunięcie kodu `abort_not_allowed` | TS2322 |
| M12 `saveGame?: string` → `unknown` | TS2578 |
| M13 usunięcie `selectedUnitId` | TS2353 |
| M14 `force` → opcjonalne | TS2578 |
| M15 `wall_ms` → `wallMs` | TS2561 |
| M16 `FogStateCode` → `number` | TS2578 |
| M17 usunięcie `speedMul` | TS2353 |

## D-411-2: `idx` komendy `SetSiegeBattleSpeed`

Typ przewodu `idx: number` (nie da się wyrazić całkowitości w typie TS bez psucia fikstur). Budowniczy `setSiegeBattleSpeed(idx, clamp?)` WALIDUJE całkowitość (`Number.isSafeInteger`) i rzuca `RangeError` dla ułamka, NaN, ±Infinity i |idx| ≥ 2^53 — bez cichego `Math.trunc` (zaokrąglenie `3.7 → 3` zmieniłoby intencję wołającego; dispatch dopuszcza „`Math.trunc`/walidację całkowitości", wybrałem walidację jako jawny błąd). Zawijanie/przycinanie nadal robi silnik (`clamp`). `clamp` pominięte = brak klucza = `false` w Rust. `CONTRACT_VERSION` = 1 bez zmian. Runtime (esbuild + node, w `mutanty-411.mjs`): 15/15 asercji, m.in. `speed(-1,true)` → `{"kind":"set_siege_battle_speed","idx":-1,"clamp":true}` (bajt w bajt jak `bridge_contract.rs:188`), `speed(3.5)`/`NaN`/`Infinity`/`2**53` → `RangeError`; `stepSiegeBattle(NaN|±Infinity)` → `RangeError` (JSON nie niesie NaN); `getRenderFrame()` → `{"kind":"get_render_frame"}` (jak `p4_364_render_frame.rs:353`).

## Kryterium 3: typecheck i zachowanie runtime

- `npm ci` (sieć i dysk dostępne: 12 GB wolnego przed, `node_modules` 72 MB) — OK; `package-lock.json` bez zmian.
- `npx tsc --noEmit` (TypeScript 5.9.3 z `node_modules`) na całym `frontend-v2`: EXIT 0 (baza przed zmianą też EXIT 0).
- `npm run check` (brama importów logiki + weryfikacje kopii pinu): EXIT 0.
- Atrapa MOCK: `mock.ts`, `index.ts`, `transport.ts`, `main.ts` niezmienione. Dym (esbuild bundle kontrolera + node): `createController(createMockTransport()).send({kind:'advance_turn'})` → `source=MOCK`, `result.kind=state`, klucze odpowiedzi `contractVersion, requestId, result` (bez `siegeBattle`/`saveGame`), zdarzenie `state_changed` z `turn: 2`. Jedyna zmiana runtime eksportów: `commands.ts` (a przez `export *` także `controller/index.ts`) eksportuje dodatkowo 5 czystych funkcji-budowniczych; nikt ich nie woła.
- Harnessy DOM (`npm run harness*`) wymagają `--pin-dir` z wypakowanym `gra/src` — NIE URUCHOMIONO (zmiana dotyczy wyłącznie typów kontrolera, żaden panel nie importuje nowych typów).
- Testów jednostkowych frontendu brak w `package.json` (tylko harnessy DOM).

## Uwagi / długi dla #410

1. Kolizja nazw `kind` w `AnyCommand`: `ProposedCommand` ma `save_game {slot,label}` i `load_game {slot}` (sloty P5-0 §7), silnik ma `save_game {}` i `load_game {save}`. Typ się kompiluje (unia), ale zwężenie po `kind` daje obie gałęzie. Nie zmieniałem `ProposedCommand` (warstwa slotów = decyzja #410); dodałem komentarz w `commands.ts`.
2. `BridgeResponse<S>` w `commands.ts` pozostaje zawężony do `result.kind = 'state'`, bo `controller/index.ts:63` (poza allowlistą) czyta `response.result.state`. Pełna unia `BridgeResult` = `EngineBridgeResponse`. Przełączenie kontrolera na pełną kopertę = #410.
3. Przełączenie okna na `frontend-v2` (`frontendDist`) i klej Tauri (`engine_command` → `civ-client`) to #410 — w tym temacie nic nie wołamy przez Tauri.
4. `StartGameParams` pozostaje nieprzezroczyste (DTO kreatora; fikstura `bridge_contract.rs:404-430` pokazuje camelCase, ale rozpisanie = temat kreatora).

## Sprzątanie

`node_modules` w `src-tauri/frontend-v2` usunięte po bramce; scratchpad dymu usunięty. Brak `CARGO_TARGET_DIR` (temat bez cargo).
