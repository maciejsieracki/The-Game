/**
 * controller/bridgeTypes.ts — typy TS kontraktu mostu silnika (R-RUSTPORT-P4-411-TS-TYPES-Q1, #411 = 403-D).
 *
 * Lustro JSON `rust-port/engine/src/bridge.rs` @ baza `3f98dd284`:
 *  - `EngineCommand` (`#[serde(tag = "kind", rename_all = "snake_case")]`, pola wariantów snake_case,
 *    bo `rename_all` na enumie zmienia tylko nazwy wariantów): 19 wariantów, lista = `COMMAND_KINDS`
 *    w `rust-port/engine/tests/bridge_contract.rs:34-54`;
 *  - `BridgeResult` (`tag = "kind"`, 4 warianty) i `BridgeResponse` (camelCase) z polami
 *    rodzeństwa `siegeBattle?` i `saveGame?` (`skip_serializing_if = Option::is_none`);
 *  - `BridgeError` z `siegeBattle?: SiegeBattleErrorDto`;
 *  - `SiegeBattlePayload` i jego DTO (`engine/src/domain/siege_battle_apply.rs`), w tym
 *    `speedIdx?` / `speedMul?` (D-407-1);
 *  - `RenderUiParams` (`engine/src/domain/render_frame.rs:131`, `deny_unknown_fields`).
 *
 * D-411-1: TYLKO typy i cienkie budowniczowie komend. Bez logiki gry, bez wołania Tauri,
 * bez zmiany frontu serwowanego przez okno (przełączenie okna i klej Tauri = #410).
 *
 * Reguła wymagane/opcjonalne: pole Rust bez `Option` i bez `#[serde(default)]` = wymagane;
 * `Option<T>` + `skip_serializing_if` = `?: T` (silnik pomija klucz); `Option<T>` bez
 * `skip_serializing_if` = `T | null` (silnik wysyła `null`); `#[serde(default)]` na polu komendy =
 * `?:` (silnik przyjmuje brak klucza). Liczby `u64`/`i64`/`f64` = `number` (identyfikatory ≤ 2^53-1).
 * Zagnieżdżone DTO bitwy (akcje, ramka, scena startu, wynik zdobycia) są nieprzezroczyste —
 * konsument to renderer Rust (`renderer/src/battle/playback.rs`), nie panele TS.
 */
import type { MapViewDto, RenderLayersDto, RenderLayersPayloadDto } from '../viewmodel/types';

// ─── Wejścia komend ──────────────────────────────────────────────────────────

/** `PositionDto` (`engine/src/domain/types.rs:119`): `x`, `y` (`u16`), bez `rename_all`. */
export interface PositionDto {
  x: number;
  y: number;
}

/** `StartGameParams` (DTO kreatora, camelCase) — kształt poza zakresem #411 (NIE_ZMIERZONO tutaj). */
export type StartGameParams = Readonly<Record<string, unknown>>;

/**
 * `RenderUiParams` (`render_frame.rs:131`): `#[serde(default, rename_all = "camelCase",
 * deny_unknown_fields)]` — każde pole można pominąć; `Option` przyjmuje też `null`.
 * Typ zamknięty: nieznany klucz (np. `selected`) silnik odrzuca.
 */
export interface RenderUiParams {
  selectedUnitId?: number | null;
  hover?: PositionDto | null;
  foundCityMode?: boolean;
  wonderActive?: boolean;
  buildModeOpen?: boolean;
  activeImprovementKey?: string | null;
  unitSelectedAfterBuildOpen?: boolean;
}

// ─── EngineCommand: 19 wariantów (bridge.rs:30-130) ─────────────────────────

export type EngineCommand =
  /** `CreateSession { #[serde(default)] params }`. */
  | { kind: 'create_session'; params?: StartGameParams }
  /** `AddPlayer { id: u64, name: String }`. */
  | { kind: 'add_player'; id: number; name: string }
  /** `SelectUnit { unit_id: u64 }`. */
  | { kind: 'select_unit'; unit_id: number }
  /** `MoveUnit { unit_id, destination, #[serde(default, skip_serializing_if)] attack_unit_id }` (P4-1H Q6). */
  | { kind: 'move_unit'; unit_id: number; destination: PositionDto; attack_unit_id?: number }
  /** `CancelPlannedMarch { unit_id: u64, force: bool }` (oba wymagane). */
  | { kind: 'cancel_planned_march'; unit_id: number; force: boolean }
  /** `AdvanceTurn`. */
  | { kind: 'advance_turn' }
  /** `GetState`. */
  | { kind: 'get_state' }
  /** `DeclareWar { declarer: u64, target: u64 }` (kontrakt; adaptery dziś odrzucają). */
  | { kind: 'declare_war'; declarer: number; target: number }
  /** `GetRenderLayers { seat?: u64 }` → `BridgeResult::RenderLayers`. */
  | { kind: 'get_render_layers'; seat?: number }
  /** `GetRenderMap` → `BridgeResult::RenderMap`. */
  | { kind: 'get_render_map' }
  /** `GetRenderFrame { seat?, ui? }` → `BridgeResult::RenderFrame`. */
  | { kind: 'get_render_frame'; seat?: number; ui?: RenderUiParams }
  /** `StartSiegeStorm { city_id: u64, unit_id: u64 }` → `State` + `siegeBattle`. */
  | { kind: 'start_siege_storm'; city_id: number; unit_id: number }
  /** `StepSiegeBattle { wall_ms: WallMs }` (`WallMs(f64)`, `transparent`; skończone, ≥ 0). */
  | { kind: 'step_siege_battle'; wall_ms: number }
  /** `SkipSiegeBattle`. */
  | { kind: 'skip_siege_battle' }
  /** `FinishSiegeBattle` (emituje `StateChanged`). */
  | { kind: 'finish_siege_battle' }
  /** `AbortSiegeBattle`. */
  | { kind: 'abort_siege_battle' }
  /**
   * `SetSiegeBattleSpeed { idx: i64, #[serde(default)] clamp: bool }` (D-407-1). `idx` musi być
   * liczbą CAŁKOWITĄ w JSON (serde `i64` odrzuca `3.0`/`3.5`) — patrz `setSiegeBattleSpeed` (D-411-2).
   */
  | { kind: 'set_siege_battle_speed'; idx: number; clamp?: boolean }
  /** `SaveGame` → `State` + `saveGame` (tekst JSON zapisu). */
  | { kind: 'save_game' }
  /** `LoadGame { save: String }` (tekst JSON zapisu; emituje `StateChanged`). */
  | { kind: 'load_game'; save: string };

export type EngineCommandKind = EngineCommand['kind'];

/** Warianty komend bitwy oblężniczej (`EngineCommand::is_siege_battle`, `bridge.rs:134-144`). */
export type SiegeBattleCommand = Extract<
  EngineCommand,
  {
    kind:
      | 'start_siege_storm'
      | 'step_siege_battle'
      | 'skip_siege_battle'
      | 'finish_siege_battle'
      | 'abort_siege_battle'
      | 'set_siege_battle_speed';
  }
>;

// ─── Odpowiedzi bitwy oblężniczej (siege_battle_apply.rs) ────────────────────

/** `SiegeBattlePhaseDto` (`siege_battle_apply.rs:443`, snake_case). */
export type SiegeBattlePhaseDto = 'running' | 'finished' | 'applied' | 'aborted';

/** `view_model::BattleWinner` (`view-model/src/battle.rs:163`, lowercase). */
export type BattleWinnerDto = 'atakujacy' | 'obronca' | 'remis';

/** `PlayableSiegeMachineKind` (`playable.rs:738`, lowercase). */
export type SiegeBattleMachineKindDto = 'taran' | 'wieza';

/** Zagnieżdżone DTO bitwy nierozpisane w #411 (`BattleActionDto`, `BattleFrameDto`, `BattleSetupDto`, `CityCaptureResultDto`). */
export type BattleNestedDto = Readonly<Record<string, unknown>>;

/** `SiegeBattleUnitRefDto` (camelCase). `unitId` to NAPIS (id rosteru; milicja: id syntetyczne). */
export interface SiegeBattleUnitRefDto {
  battleId: number;
  unitId: string;
  /** `atk` / `def` (w Rust `String`). */
  side: string;
}

/** `SiegeUnitHpDto` (camelCase). */
export interface SiegeUnitHpDto {
  unitId: number;
  hp: number;
}

/** `CityCaptureRequested` (camelCase), hak T8 (#354). */
export interface CityCaptureRequestedDto {
  cityId: number;
  attackerOwnerId: number;
  anchorUnitId: number;
}

/** `SiegeBattleResultDto` (camelCase): wynik `FinishSiegeBattle`. */
export interface SiegeBattleResultDto {
  winner: BattleWinnerDto;
  roundNo: number;
  wallBreached: boolean;
  captureBlocked: boolean;
  captureRequested?: CityCaptureRequestedDto;
  capture?: BattleNestedDto;
  removedUnitIds: number[];
  hp: SiegeUnitHpDto[];
  consumedMachines: SiegeBattleMachineKindDto[];
  siegeEnded: boolean;
}

/** `SiegeTowerShooterDto` (camelCase); oba pola pomijane, gdy `None`. */
export interface SiegeTowerShooterDto {
  typ?: string;
  jednostka?: string;
}

/**
 * `SiegeBattlePayload` (`siege_battle_apply.rs:523`, camelCase) — pole `siegeBattle` odpowiedzi.
 * Wymagane: `cityId`, `phase`, `actions` (może być pusta). `units` pomijane, gdy pusta tablica
 * (`Vec::is_empty`). `speedIdx`/`speedMul` tylko w odpowiedzi `SetSiegeBattleSpeed` (D-407-1).
 */
export interface SiegeBattlePayload {
  cityId: number;
  phase: SiegeBattlePhaseDto;
  units?: SiegeBattleUnitRefDto[];
  actions: BattleNestedDto[];
  frame?: BattleNestedDto;
  result?: SiegeBattleResultDto;
  setup?: BattleNestedDto;
  towerShooter?: SiegeTowerShooterDto;
  speedIdx?: number;
  speedMul?: number;
}

/**
 * `SiegeBattleErrorDto` (`siege_battle_apply.rs:253`): `tag = "code"`, kody snake_case,
 * pola camelCase (`rename_all_fields`). 20 wariantów.
 */
export type SiegeBattleErrorDto =
  | { code: 'no_active_battle' }
  | { code: 'battle_in_progress'; cityId: number }
  | { code: 'not_human_besieger'; unitId: number }
  | { code: 'city_not_found'; cityId: number }
  | { code: 'unit_not_found'; unitId: number }
  | { code: 'city_tile_missing'; cityId: number }
  | { code: 'no_defenders_wall_intact'; cityId: number }
  | { code: 'no_defenders_capture_requested'; cityId: number }
  | { code: 'not_finished' }
  | { code: 'session'; detail: string }
  | { code: 'adapter'; detail: string }
  | { code: 'producer'; detail: string }
  | { code: 'not_enemy_city'; cityId: number }
  | { code: 'not_adjacent'; unitId: number; cityId: number }
  | { code: 'not_siege_anchor'; unitId: number; besiegerId: number }
  | { code: 'anchor_cannot_attack'; unitId: number; reason: string }
  | { code: 'not_at_war'; cityId: number }
  | { code: 'aborted'; cityId: number; reason: string }
  | { code: 'abort_requested' }
  | { code: 'abort_not_allowed'; cityId: number };

export type SiegeBattleErrorCode = SiegeBattleErrorDto['code'];

// ─── Koperty mostu ───────────────────────────────────────────────────────────

/**
 * `BridgeResult` (`bridge.rs:190-206`, `tag = "kind"`). `S` = `PlayableState` (kształt poza #411).
 * `render_map` / `render_frame` są `transparent` (DTO view-model 1:1).
 */
export type EngineBridgeResult<S = unknown> =
  | { kind: 'state'; state: S }
  | { kind: 'render_layers'; layers: RenderLayersPayloadDto }
  | { kind: 'render_map'; map: MapViewDto }
  | { kind: 'render_frame'; frame: RenderLayersDto };

/** `BridgeResponse` (`bridge.rs:211-225`, camelCase) z pełnym `BridgeResult`. */
export interface EngineBridgeResponse<S = unknown> {
  contractVersion: number;
  requestId: string;
  result: EngineBridgeResult<S>;
  siegeBattle?: SiegeBattlePayload;
  saveGame?: string;
}

// ─── Budowniczowie komend (D-411-1, D-411-2) ─────────────────────────────────

/**
 * D-411-2: `SetSiegeBattleSpeed`. `idx` musi być bezpieczną liczbą całkowitą (serde `i64` odrzuca
 * `3.0`, a ułamek nie ma znaczenia w webie `_setSpeedIdx`). Brak cichego `Math.trunc`: ułamek, NaN
 * i ±Infinity = `RangeError` po stronie klienta (jawny błąd zamiast zaokrąglenia). Zawijanie /
 * przycinanie robi silnik (`clamp`), nie klient. `clamp` pominięte = `false` (wrap, `_cycleSpeed`).
 */
export function setSiegeBattleSpeed(
  idx: number,
  clamp?: boolean,
): Extract<EngineCommand, { kind: 'set_siege_battle_speed' }> {
  if (!Number.isSafeInteger(idx)) {
    throw new RangeError(`set_siege_battle_speed: idx musi być liczbą całkowitą (i64), dostałem ${String(idx)}`);
  }
  return clamp === undefined ? { kind: 'set_siege_battle_speed', idx } : { kind: 'set_siege_battle_speed', idx, clamp };
}

/**
 * `StepSiegeBattle { wall_ms }`. JSON nie niesie NaN/±Infinity (`JSON.stringify` daje `null`,
 * które serde odrzuca), więc wartość nieskończona = `RangeError`. Wartości ujemne odrzuca silnik
 * (`InvalidData`) — klient ich nie poprawia.
 */
export function stepSiegeBattle(wallMs: number): Extract<EngineCommand, { kind: 'step_siege_battle' }> {
  if (!Number.isFinite(wallMs)) {
    throw new RangeError(`step_siege_battle: wall_ms musi być skończone, dostałem ${String(wallMs)}`);
  }
  return { kind: 'step_siege_battle', wall_ms: wallMs };
}

/** `GetRenderFrame { seat?, ui? }`: klucze pomijane, gdy brak (jak `skip_serializing_if`). */
export function getRenderFrame(
  opts: { seat?: number; ui?: RenderUiParams } = {},
): Extract<EngineCommand, { kind: 'get_render_frame' }> {
  const cmd: Extract<EngineCommand, { kind: 'get_render_frame' }> = { kind: 'get_render_frame' };
  if (opts.seat !== undefined) cmd.seat = opts.seat;
  if (opts.ui !== undefined) cmd.ui = opts.ui;
  return cmd;
}

/** `StartSiegeStorm { city_id, unit_id }`. */
export function startSiegeStorm(cityId: number, unitId: number): Extract<EngineCommand, { kind: 'start_siege_storm' }> {
  return { kind: 'start_siege_storm', city_id: cityId, unit_id: unitId };
}

/** `LoadGame { save }` — `save` to tekst JSON zapisu (odpowiedź `saveGame` komendy `SaveGame`). */
export function loadGame(save: string): Extract<EngineCommand, { kind: 'load_game' }> {
  return { kind: 'load_game', save };
}
