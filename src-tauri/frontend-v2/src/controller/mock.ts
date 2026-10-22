/**
 * controller/mock.ts — ATRAPA transportu (MOCK). Zwraca stałe dane testowe.
 *
 * Każda odpowiedź niesie jawne pole `mock: 'MOCK'`, a UI pokazuje etykietę MOCK.
 * Dane są STAŁYMI fikstur — atrapa niczego nie liczy (P5.13: UI nie liczy reguł gry).
 */
import type { BridgeRequest, BridgeResponse, StateChangedEvent } from './commands';
import { CONTRACT_VERSION, EVENT_STATE_CHANGED, TAURI_ENGINE_COMMAND } from './commands';
import type { Transport, Unlisten } from './transport';
import type { CityGrowthDto, CityRefDto, ViewKey, ViewRevision } from '../viewmodel/types';

export const MOCK_LABEL = 'MOCK' as const;

/** Stan zwracany przez atrapę zamiast `PlayableState` (kształt w Rust nie jest tu odwzorowany). */
export interface MockEngineState {
  mock: typeof MOCK_LABEL;
  revision: ViewRevision;
  note: string;
}

/** Fikstura MOCK: miasto (DTO §5/§6.2). Wartości stałe, nie wyliczone. */
export const MOCK_CITY: CityRefDto = {
  id: 1,
  owner: 0,
  q: 0,
  r: 0,
  name: 'MOCK-Stolica',
  mapLabel: 'MOCK-Stolica',
  population: 3,
  isCapital: true,
  isMine: true,
};

export const MOCK_GROWTH: CityGrowthDto = {
  pctPerTurn: 12.5,
  fed: true,
  breakdown: { mock: MOCK_LABEL },
  wzrostUlamkowy: 0.25,
  turnsToNextCitizen: 6,
  maxSafeRation: 2,
};

export interface MockViewPayload {
  mock: typeof MOCK_LABEL;
  key: ViewKey;
  city?: CityRefDto;
  growth?: CityGrowthDto;
}

function mockRevision(turn: number): ViewRevision {
  return { rev: turn, turn, activeOwner: 0, dirty: [{ kind: 'city', id: MOCK_CITY.id }] };
}

export function createMockTransport(): Transport {
  let turn = 1;
  const listeners = new Map<string, Set<(payload: unknown) => void>>();
  const emit = (event: string, payload: unknown): void => {
    for (const fn of listeners.get(event) ?? []) fn(payload);
  };
  const state = (): MockEngineState => ({
    mock: MOCK_LABEL,
    revision: mockRevision(turn),
    note: 'Atrapa kontrolera P5.1 — brak połączenia z silnikiem Rust.',
  });

  return {
    source: MOCK_LABEL,
    async invoke<T>(command: string, args: Readonly<Record<string, unknown>>): Promise<T> {
      if (command !== TAURI_ENGINE_COMMAND) {
        throw new Error(`MOCK: nieznana komenda Tauri "${command}"`);
      }
      const request = args['request'] as BridgeRequest<{ kind: string; key?: ViewKey }> | undefined;
      if (!request || request.contractVersion !== CONTRACT_VERSION) {
        throw { code: 'unsupported_version', message: 'MOCK: zła wersja kontraktu' };
      }
      const kind = request.command.kind;
      if (kind === 'get_view' && request.command.key) {
        const payload: MockViewPayload = { mock: MOCK_LABEL, key: request.command.key, city: MOCK_CITY, growth: MOCK_GROWTH };
        return { contractVersion: CONTRACT_VERSION, requestId: request.requestId, result: { kind: 'state', state: payload } } as T;
      }
      if (kind === 'advance_turn') {
        // Atrapa nie symuluje tury: tylko podbija licznik fikstury, by sprawdzić ścieżkę zdarzenia.
        turn += 1;
        const ev: StateChangedEvent<MockEngineState> = {
          kind: 'state_changed',
          contractVersion: CONTRACT_VERSION,
          requestId: request.requestId,
          state: state(),
        };
        emit(EVENT_STATE_CHANGED, ev);
      }
      const response: BridgeResponse<MockEngineState> = {
        contractVersion: CONTRACT_VERSION,
        requestId: request.requestId,
        result: { kind: 'state', state: state() },
      };
      return response as T;
    },
    async listen<T>(event: string, handler: (payload: T) => void): Promise<Unlisten> {
      const set = listeners.get(event) ?? new Set();
      const fn = handler as (payload: unknown) => void;
      set.add(fn);
      listeners.set(event, set);
      return () => set.delete(fn);
    },
  };
}
