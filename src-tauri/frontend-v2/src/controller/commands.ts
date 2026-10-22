/**
 * controller/commands.ts — typowane komendy webview → Rust (tylko typy + stałe kontraktu).
 *
 * Dwie grupy:
 *  1. `EngineCommand` — warianty ISTNIEJĄCE dziś w `rust-port/engine/src/bridge.rs:26-45`
 *     (`#[serde(tag = "kind", rename_all = "snake_case")]`), wysyłane przez jedną komendę
 *     Tauri `engine_command` (`src-tauri/src/lib.rs:28-29`) w kopercie `BridgeRequest`
 *     (`bridge.rs:49-54`, camelCase).
 *  2. `ProposedCommand` — komendy z katalogu P2-5 / P5-0 §7 (mutacje M + IO), których
 *     silnik jeszcze NIE ma. Tylko kształt; kontroler w tej rundzie obsługuje je wyłącznie atrapą.
 *     Forma (osobne komendy Tauri vs warianty jednej) = D-CMD-1 (P2-5 §1), nierozstrzygnięta —
 *     ZAŁOŻENIE P5.1-Z4: na razie warianty z `kind`, jak w `bridge.rs`.
 */
import type { CityId, HexCoord, PlayerId, SlotId, UnitId, ViewKey } from '../viewmodel/types';

export const CONTRACT_VERSION = 1 as const;
export const TAURI_ENGINE_COMMAND = 'engine_command' as const;
export const EVENT_STATE_CHANGED = 'engine_state_changed' as const;

/** `PositionDto` z bridge.rs (`MoveUnit.destination`). Mapowanie HexCoord ↔ PositionDto: NIE_ZMIERZONO (P5-0 §10 pkt 5). */
export interface PositionDto {
  x: number;
  y: number;
}

/** `StartGameParams` — kształt w Rust nie rozpisany w tym temacie (NIE_ZMIERZONO). */
export type StartGameParams = Readonly<Record<string, unknown>>;

// ─── 1. Warianty istniejące (bridge.rs:26-45) ────────────────────────────────

export type EngineCommand =
  | { kind: 'create_session'; params?: StartGameParams }
  | { kind: 'add_player'; id: number; name: string }
  | { kind: 'select_unit'; unit_id: number }
  | { kind: 'move_unit'; unit_id: number; destination: PositionDto }
  | { kind: 'advance_turn' }
  | { kind: 'get_state' };

// ─── 2. Komendy proponowane (P5-0 §7, P2-5 §2.x, §9 pkt 14) — brak w silniku ──

export type ProposedCommand =
  | { kind: 'enqueue_build'; owner: PlayerId; city: CityId; item: string }
  | { kind: 'dequeue_build'; owner: PlayerId; city: CityId; index: number }
  | { kind: 'promote_build'; owner: PlayerId; city: CityId; index: number }
  | { kind: 'move_build'; owner: PlayerId; city: CityId; from: number; to: number }
  | { kind: 'city_set_paused'; owner: PlayerId; city: CityId; paused: boolean }
  | { kind: 'recruit_cancel'; owner: PlayerId; city: CityId; index: number }
  | { kind: 'set_trade_split'; owner: PlayerId; city: CityId | null; raw: Readonly<Record<string, number>> }
  | { kind: 'set_labor_split'; owner: PlayerId; city: CityId | null; raw_percent: number }
  | { kind: 'set_ration_level'; owner: PlayerId; city: CityId | null; level: number }
  | { kind: 'list_saves' }
  | { kind: 'save_game'; slot: SlotId; label: string }
  | { kind: 'load_game'; slot: SlotId }
  | { kind: 'delete_save'; slot: SlotId }
  /** P5.2 (`saveLoadDialog.ts`): identyfikator nowego slotu nadaje powłoka (P5-0 §6.15). */
  | { kind: 'allocate_save_slot'; label: string }
  | { kind: 'camera_focus'; hex: HexCoord }
  | { kind: 'get_view'; key: ViewKey }
  | { kind: 'select_unit_view'; unit: UnitId | null };

export type AnyCommand = EngineCommand | ProposedCommand;

/** Koperta `BridgeRequest` (bridge.rs:49-54). */
export interface BridgeRequest<C = EngineCommand> {
  contractVersion: number;
  requestId: string;
  command: C;
}

/** Koperta `BridgeResponse` (bridge.rs:91-96); `result` z tagiem `kind` (bridge.rs:84-87). */
export interface BridgeResponse<S = unknown> {
  contractVersion: number;
  requestId: string;
  result: { kind: 'state'; state: S };
}

/** `BridgeErrorCode` (bridge.rs:122-129). */
export type BridgeErrorCode = 'invalid_request' | 'unsupported_version' | 'engine_rejected' | 'event_emission' | 'internal';

export interface BridgeError {
  code: BridgeErrorCode;
  message: string;
}

/** Zdarzenie `BridgeEvent::StateChanged` (bridge.rs:100-110). */
export interface StateChangedEvent<S = unknown> {
  kind: 'state_changed';
  contractVersion: number;
  requestId: string;
  state: S;
}
