/**
 * controller/bridgeTypes.typetest.ts — test TYPÓW kontraktu mostu (R-RUSTPORT-P4-411-TS-TYPES-Q1).
 *
 * Plik nie jest importowany przez aplikację (brak wpływu na bundel i atrapę MOCK); sprawdza go
 * `tsc --noEmit` (`tsconfig.json` `include: ["src"]`). Każda fikstura poniżej to JSON, który
 * silnik ZSERIALIZOWAŁ albo PRZYJĄŁ w istniejącym teście Rust (źródło przy fiksturze), przepisany
 * 1:1 jako literał. `satisfies` na literale obiektu włącza kontrolę nadmiarowych kluczy, więc:
 *  - usunięcie pola z typu → fikstura z tym polem nie przechodzi (nadmiarowy klucz);
 *  - pole opcjonalne zmienione na wymagane → fikstura bez klucza nie przechodzi;
 *  - usunięty wariant → próbka wariantu / lista `kind` nie przechodzi.
 * Bloki `@ts-expect-error` to przypadki NEGATYWNE (JSON, który silnik odrzuca albo którego nie
 * produkuje): jeśli typ stanie się zbyt luźny, dyrektywa bez błędu sama wywali `tsc` (TS2578).
 */
import type {
  BattleWinnerDto,
  EngineBridgeResponse,
  EngineCommand,
  EngineCommandKind,
  RenderUiParams,
  SiegeBattleCommand,
  SiegeBattleErrorCode,
  SiegeBattleErrorDto,
  SiegeBattlePayload,
} from './bridgeTypes';
import type { BridgeError, BridgeRequest, BridgeResponse } from './commands';
import type { FogRevealDto, RenderLayersDto, RenderLayersPayloadDto } from '../viewmodel/types';

// ─── Narzędzia równości typów ────────────────────────────────────────────────

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

// ─── 1. Komplet wariantów EngineCommand ──────────────────────────────────────

/** `COMMAND_KINDS` z `rust-port/engine/tests/bridge_contract.rs:34-54` (19 wariantów), ta sama kolejność. */
const RUST_COMMAND_KINDS = [
  'create_session',
  'add_player',
  'select_unit',
  'move_unit',
  'cancel_planned_march',
  'advance_turn',
  'get_state',
  'declare_war',
  'get_render_layers',
  'get_render_map',
  'get_render_frame',
  'start_siege_storm',
  'step_siege_battle',
  'skip_siege_battle',
  'finish_siege_battle',
  'abort_siege_battle',
  'save_game',
  'load_game',
  'set_siege_battle_speed',
] as const;
export type _KindsMatchRust = Expect<Equal<EngineCommandKind, (typeof RUST_COMMAND_KINDS)[number]>>;
export type _NineteenKinds = Expect<Equal<(typeof RUST_COMMAND_KINDS)['length'], 19>>;

/** `is_siege_battle` (`bridge.rs:134-144`): 6 komend. */
export type _SiegeCommands = Expect<
  Equal<
    SiegeBattleCommand['kind'],
    | 'start_siege_storm'
    | 'step_siege_battle'
    | 'skip_siege_battle'
    | 'finish_siege_battle'
    | 'abort_siege_battle'
    | 'set_siege_battle_speed'
  >
>;

type CommandSamples = { [K in EngineCommandKind]: Extract<EngineCommand, { kind: K }>[] };

/** Fikstury komend: JSON z testów Rust (serializacja `to_value` albo przyjęty `from_value`). */
export const COMMAND_FIXTURES = {
  // bridge_contract.rs (`every_command`) — wariant bez params; `params` ma `#[serde(default)]`.
  create_session: [{ kind: 'create_session' }, { kind: 'create_session', params: { civId: 'grecy', seed: 99 } }],
  // bridge_contract.rs:394
  add_player: [{ kind: 'add_player', id: 7, name: 'Ada' }],
  select_unit: [{ kind: 'select_unit', unit_id: 1 }],
  // p4_364_render_frame.rs:397 (bez `attack_unit_id` = `None`, klucz pomijany)
  move_unit: [
    { kind: 'move_unit', unit_id: 1, destination: { x: 3, y: 1 } },
    { kind: 'move_unit', unit_id: 1, destination: { x: 3, y: 1 }, attack_unit_id: 50 },
  ],
  cancel_planned_march: [{ kind: 'cancel_planned_march', unit_id: 1, force: false }],
  advance_turn: [{ kind: 'advance_turn' }],
  // p4_364_render_frame.rs:384
  get_state: [{ kind: 'get_state' }],
  declare_war: [{ kind: 'declare_war', declarer: 1, target: 2 }],
  // p4_364_render_frame.rs:388
  get_render_layers: [{ kind: 'get_render_layers' }, { kind: 'get_render_layers', seat: 2 }],
  // p4_364_render_frame.rs:349
  get_render_map: [{ kind: 'get_render_map' }],
  // p4_364_render_frame.rs:353, :355-359, :375
  get_render_frame: [
    { kind: 'get_render_frame' },
    { kind: 'get_render_frame', seat: 2, ui: { selectedUnitId: 1, buildModeOpen: true, activeImprovementKey: 'farma' } },
    { kind: 'get_render_frame', ui: {} },
  ],
  // bridge_contract.rs:162
  start_siege_storm: [{ kind: 'start_siege_storm', city_id: 1, unit_id: 7 }],
  // bridge_contract.rs:168
  step_siege_battle: [{ kind: 'step_siege_battle', wall_ms: 16.5 }],
  // bridge_contract.rs:172-180
  skip_siege_battle: [{ kind: 'skip_siege_battle' }],
  finish_siege_battle: [{ kind: 'finish_siege_battle' }],
  abort_siege_battle: [{ kind: 'abort_siege_battle' }],
  // p4_save_load_bridge.rs:278, :283
  save_game: [{ kind: 'save_game' }],
  load_game: [{ kind: 'load_game', save: '{}' }],
  // bridge_contract.rs:188, :195, :205 (bez `clamp` = `false`)
  set_siege_battle_speed: [
    { kind: 'set_siege_battle_speed', idx: -1, clamp: true },
    { kind: 'set_siege_battle_speed', idx: 10, clamp: false },
    { kind: 'set_siege_battle_speed', idx: 4 },
  ],
} satisfies CommandSamples;

/** Koperta żądania, bridge_contract.rs:391-395. */
export const REQUEST_FIXTURE = {
  contractVersion: 1,
  requestId: 'req-1',
  command: { kind: 'add_player', id: 7, name: 'Ada' },
} satisfies BridgeRequest<EngineCommand>;

// Negatywne (silnik odrzuca albo nie istnieje):
// @ts-expect-error — p4_364_render_frame.rs:378: nieznane pole `selected` w `ui` (`deny_unknown_fields`).
export const BAD_UI = { kind: 'get_render_frame', ui: { selected: 1 } } satisfies EngineCommand;
// @ts-expect-error — bridge_contract.rs:215: `set_siege_battle_speed` bez `idx` jest odrzucane.
export const BAD_SPEED = { kind: 'set_siege_battle_speed' } satisfies EngineCommand;
// @ts-expect-error — `cancel_planned_march.force` jest wymagane (brak `#[serde(default)]`).
export const BAD_CANCEL = { kind: 'cancel_planned_march', unit_id: 1 } satisfies EngineCommand;
// @ts-expect-error — pole wariantu w snake_case (`rename_all` enumu nie dotyczy pól): `wallMs` to nieznany klucz.
export const BAD_STEP = { kind: 'step_siege_battle', wallMs: 16 } satisfies EngineCommand;
// @ts-expect-error — `load_game.save` to tekst JSON, nie obiekt.
export const BAD_LOAD = { kind: 'load_game', save: {} } satisfies EngineCommand;
// @ts-expect-error — nieistniejący wariant.
export const BAD_KIND = { kind: 'get_render_frames' } satisfies EngineCommand;
// @ts-expect-error — `RenderUiParams` jest zamknięty.
export const BAD_UI_KEY: RenderUiParams = { hoverHex: { x: 1, y: 1 } };

// ─── 2. Odpowiedzi bitwy oblężniczej (siegeBattle, speedIdx/speedMul) ────────

/**
 * Odpowiedź `SetSiegeBattleSpeed` (p4_407_fq_speed_bridge.rs:245-256): `phase = running`, brak akcji,
 * ramki, wyniku, jednostek, sceny i strzelca (klucze pomijane / `actions: []`), `speedIdx = 3`,
 * `speedMul = 8.0`.
 */
export const SPEED_RESPONSE = {
  contractVersion: 1,
  requestId: 'r',
  result: { kind: 'state', state: {} },
  siegeBattle: { cityId: 19, phase: 'running', actions: [], speedIdx: 3, speedMul: 8.0 },
} satisfies EngineBridgeResponse;

/** Ta sama odpowiedź przez zawężoną kopertę `BridgeResponse` (ścieżka kontrolera). */
export const SPEED_RESPONSE_NARROW = SPEED_RESPONSE satisfies BridgeResponse;

/** Odpowiedź `AbortSiegeBattle` (p4_1i6_dlugi.rs:690-705, `SiegeBattlePayload::aborted`). */
export const ABORT_PAYLOAD = { cityId: 17, phase: 'aborted', actions: [] } satisfies SiegeBattlePayload;

/** Odpowiedź `StepSiegeBattle` (p4_407:309-312): ramka obecna, BEZ kluczy prędkości. */
export const STEP_PAYLOAD = {
  cityId: 19,
  phase: 'running',
  actions: [{ t0: 0 }],
  frame: { vNow: 16 },
} satisfies SiegeBattlePayload;

/** Odpowiedź `StartSiegeStorm`: jednostki sceny (`unitId` to napis), scena startu i strzelec wieży (p4_1i6_dlugi.rs:423). */
export const START_PAYLOAD = {
  cityId: 19,
  phase: 'running',
  units: [{ battleId: 1, unitId: '7', side: 'atk' }],
  actions: [],
  frame: {},
  setup: {},
  towerShooter: { typ: 'Distance', jednostka: 'Łucznik' },
} satisfies SiegeBattlePayload;

/** Odpowiedź `FinishSiegeBattle` z wynikiem (`SiegeBattleResultDto`, klucze opcjonalne pominięte). */
export const FINISH_PAYLOAD = {
  cityId: 19,
  phase: 'applied',
  actions: [],
  result: {
    winner: 'atakujacy',
    roundNo: 4,
    wallBreached: true,
    captureBlocked: false,
    captureRequested: { cityId: 19, attackerOwnerId: 0, anchorUnitId: 7 },
    removedUnitIds: [50],
    hp: [{ unitId: 7, hp: 3.5 }],
    consumedMachines: ['taran'],
    siegeEnded: true,
  },
} satisfies SiegeBattlePayload;

export type _Winner = Expect<Equal<BattleWinnerDto, 'atakujacy' | 'obronca' | 'remis'>>;

// @ts-expect-error — `cityId` wymagane (pole `u64` bez `default`).
export const BAD_PAYLOAD_NO_CITY = { phase: 'running', actions: [] } satisfies SiegeBattlePayload;
// @ts-expect-error — `actions` wymagane (bez `skip_serializing_if`, także pusta tablica jest wysyłana).
export const BAD_PAYLOAD_NO_ACTIONS = { cityId: 1, phase: 'running' } satisfies SiegeBattlePayload;
// @ts-expect-error — faza spoza `SiegeBattlePhaseDto`.
export const BAD_PHASE = { cityId: 1, phase: 'paused', actions: [] } satisfies SiegeBattlePayload;
// @ts-expect-error — `speedIdx` pomijane, gdy `None`; silnik nie wysyła `null`.
export const BAD_SPEED_NULL = { cityId: 1, phase: 'running', actions: [], speedIdx: null } satisfies SiegeBattlePayload;
// @ts-expect-error — klucz snake_case `speed_idx` nie istnieje w JSON (camelCase).
export const BAD_SPEED_SNAKE = { cityId: 1, phase: 'running', actions: [], speed_idx: 3 } satisfies SiegeBattlePayload;

// ─── 3. Błędy bitwy (BridgeError.siegeBattle) ────────────────────────────────

/** p4_1i6_dlugi.rs:573-664 (`kazdy_wariant_bledu_ma_kod_i_ten_sam_tekst`): wszystkie 20 kodów. */
export const SIEGE_ERROR_FIXTURES = [
  { code: 'no_active_battle' },
  { code: 'battle_in_progress', cityId: 3 },
  { code: 'not_human_besieger', unitId: 4 },
  { code: 'city_not_found', cityId: 5 },
  { code: 'unit_not_found', unitId: 6 },
  { code: 'city_tile_missing', cityId: 7 },
  { code: 'no_defenders_wall_intact', cityId: 8 },
  { code: 'no_defenders_capture_requested', cityId: 9 },
  { code: 'not_finished' },
  { code: 'session', detail: 'AlreadyFinished' },
  { code: 'adapter', detail: 'x' },
  { code: 'producer', detail: 'p' },
  { code: 'not_enemy_city', cityId: 10 },
  { code: 'not_adjacent', unitId: 11, cityId: 12 },
  { code: 'not_siege_anchor', unitId: 13, besiegerId: 14 },
  { code: 'anchor_cannot_attack', unitId: 15, reason: 'cywil' },
  { code: 'not_at_war', cityId: 16 },
  { code: 'aborted', cityId: 17, reason: 'r' },
  { code: 'abort_requested' },
  { code: 'abort_not_allowed', cityId: 18 },
] as const satisfies readonly SiegeBattleErrorDto[];
export type _ErrorCodesComplete = Expect<Equal<SiegeBattleErrorCode, (typeof SIEGE_ERROR_FIXTURES)[number]['code']>>;

/** bridge_contract.rs:267: błąd mostu z typowanym błędem bitwy. */
export const BRIDGE_ERROR_FIXTURE = {
  code: 'engine_rejected',
  message: 'no battle in progress',
  siegeBattle: { code: 'no_active_battle' },
} satisfies BridgeError;
/** Błąd spoza bitwy: bez klucza `siegeBattle` (bridge_contract.rs:269-280). */
export const BRIDGE_ERROR_PLAIN = { code: 'invalid_request', message: 'requestId must contain …' } satisfies BridgeError;

// @ts-expect-error — `city_not_found` niesie `cityId` (camelCase), nie `city_id`.
export const BAD_ERR_SNAKE = { code: 'city_not_found', city_id: 5 } satisfies SiegeBattleErrorDto;
// @ts-expect-error — `not_adjacent` wymaga obu pól.
export const BAD_ERR_PARTIAL = { code: 'not_adjacent', unitId: 11 } satisfies SiegeBattleErrorDto;

// ─── 4. Zapis (saveGame) ─────────────────────────────────────────────────────

/** p4_save_load_bridge.rs:245-272: `State` + `saveGame` (tekst JSON migawki, `version` = 2). */
export const SAVE_RESPONSE = {
  contractVersion: 1,
  requestId: 'save',
  result: { kind: 'state', state: {} },
  saveGame: '{"version":2}',
} satisfies EngineBridgeResponse;
// @ts-expect-error — `saveGame` to TEKST JSON, nie obiekt.
export const BAD_SAVE = { contractVersion: 1, requestId: 's', result: { kind: 'state', state: {} }, saveGame: { version: 2 } } satisfies EngineBridgeResponse;

// ─── 5. Ramka renderera (RenderLayersDto.reveal?) ────────────────────────────

/** 14 kluczy ramki bez `reveal` (p4_364_render_frame.rs:407-424 i :1791-1805). */
const RUST_FRAME_KEYS = [
  'contractVersion',
  'viewer',
  'turn',
  'hexState',
  'fog',
  'owners',
  'cities',
  'units',
  'stacks',
  'sieges',
  'wonders',
  'territory',
  'overlays',
  'battle',
] as const;
export type _FrameKeys = Expect<Equal<keyof RenderLayersDto, (typeof RUST_FRAME_KEYS)[number] | 'reveal'>>;
export type _RevealOptional = Expect<Equal<RenderLayersDto['reveal'], FogRevealDto | undefined>>;

const FRAME_BASE = {
  contractVersion: 1,
  viewer: { ownerId: 0, fogActive: true },
  turn: 1,
  hexState: [],
  fog: { state: [0, 1, 2] },
  owners: [],
  cities: [],
  units: [],
  stacks: {},
  sieges: [],
  wonders: [],
  territory: {},
  overlays: {},
  battle: null,
} satisfies RenderLayersDto;

/** `reveal = None` → brak klucza (r403a_json_ramki_addytywny, :1806-1817). */
export const FRAME_NO_REVEAL = { ...FRAME_BASE } satisfies RenderLayersDto;
/** Most: `GetRenderFrame` niesie `{"revealAllLand": false, "riverRevealKeys": null}` (:1838-1847). */
export const FRAME_RESPONSE = {
  contractVersion: 1,
  requestId: 'f',
  result: { kind: 'render_frame', frame: { ...FRAME_BASE, reveal: { revealAllLand: false, riverRevealKeys: null } } },
} satisfies EngineBridgeResponse;
/** `riverRevealKeys` niepuste (:1823-1826): heksy `{q, r}`. */
export const FRAME_REVEAL_KEYS = {
  ...FRAME_BASE,
  reveal: { revealAllLand: false, riverRevealKeys: [{ q: 3, r: 1 }] },
} satisfies RenderLayersDto;

/** `GetRenderLayers` → `render_layers` (`RenderLayersPayload`: `reveal` wymagane). */
export const LAYERS_RESPONSE = {
  contractVersion: 1,
  requestId: 'l',
  result: {
    kind: 'render_layers',
    layers: { fog: { state: [] }, fogActive: false, reveal: { revealAllLand: false, riverRevealKeys: null }, territory: { byOwner: [], borders: [] } },
  },
} satisfies EngineBridgeResponse;
/** `GetRenderMap` → `render_map` (`MapViewDto`, `transparent`). */
export const MAP_RESPONSE = {
  contractVersion: 1,
  requestId: 'm',
  result: { kind: 'render_map', map: { width: 2, height: 1, seed: 7, hexes: [{}, {}], rivers: [], riverRenderPaths: [] } },
} satisfies EngineBridgeResponse;

// @ts-expect-error — `reveal: null` nie jest produkowane (pole pomijane, gdy `None`).
export const BAD_REVEAL_NULL = { ...FRAME_BASE, reveal: null } satisfies RenderLayersDto;
// @ts-expect-error — `riverRevealKeys` jest zawsze obecne (bez `skip_serializing_if`).
export const BAD_REVEAL_PARTIAL = { ...FRAME_BASE, reveal: { revealAllLand: true } } satisfies RenderLayersDto;
// @ts-expect-error — kod mgły tylko 0/1/2 (`FogState::from_code`).
export const BAD_FOG_CODE = { ...FRAME_BASE, fog: { state: [3] } } satisfies RenderLayersDto;
// @ts-expect-error — `RenderLayersPayload.reveal` jest wymagane.
export const BAD_LAYERS: RenderLayersPayloadDto = { fog: { state: [] }, fogActive: false, territory: { byOwner: [], borders: [] } };
const { battle: _droppedBattle, ...FRAME_WITHOUT_BATTLE } = FRAME_BASE;
// @ts-expect-error — `battle` zawsze obecne (`null` poza bitwą).
export const BAD_NO_BATTLE = { ...FRAME_WITHOUT_BATTLE } satisfies RenderLayersDto;
