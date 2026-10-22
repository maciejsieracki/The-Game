/**
 * controller/index.ts — kontroler (zastępca `gra/src/main.ts` w roli spoiwa UI ↔ silnik).
 *
 * Szkielet P5.1: jedyne API dla paneli UI. Panele nie importują logiki gry — dostają DTO
 * (`viewmodel/types.ts`) i wysyłają komendy (`commands.ts`). W tej rundzie transport
 * domyślny to atrapa MOCK (`mock.ts`).
 */
import type { AnyCommand, BridgeRequest, BridgeResponse, StateChangedEvent } from './commands';
import { CONTRACT_VERSION, EVENT_STATE_CHANGED, TAURI_ENGINE_COMMAND } from './commands';
import type { Transport, Unlisten } from './transport';
import type { ViewKey } from '../viewmodel/types';

export * from './commands';
export type { Transport, Unlisten } from './transport';
export { createTauriTransport, isTauriAvailable } from './transport';
export { createMockTransport, MOCK_LABEL } from './mock';
export { installStaticCatalog, hasStaticCatalog, staticCatalog, unitCategoryFromCatalog } from './staticCatalog';
export { installPerfDiagnostics, perfDiagnostics } from './diagnostics';
export type { SaveSlotsService } from './saveSlots';
export { installSaveSlotsService, saveSlotsService } from './saveSlots';
export { MOCK_STATIC_CATALOG, MOCK_PERF_DIAGNOSTICS, MOCK_SAVE_SLOTS, createMockSaveSlotsService } from './mockCatalog';

export interface Controller {
  readonly source: Transport['source'];
  send<S = unknown>(command: AnyCommand): Promise<BridgeResponse<S>>;
  getView<S = unknown>(key: ViewKey): Promise<S>;
  onStateChanged<S = unknown>(handler: (event: StateChangedEvent<S>) => void): Promise<Unlisten>;
}

let seq = 0;
function nextRequestId(): string {
  seq += 1;
  return `v2-${Date.now().toString(36)}-${seq}`;
}

export function createController(transport: Transport): Controller {
  async function send<S>(command: AnyCommand): Promise<BridgeResponse<S>> {
    const request: BridgeRequest<AnyCommand> = {
      contractVersion: CONTRACT_VERSION,
      requestId: nextRequestId(),
      command,
    };
    return transport.invoke<BridgeResponse<S>>(TAURI_ENGINE_COMMAND, { request });
  }
  return {
    source: transport.source,
    send,
    async getView<S>(key: ViewKey): Promise<S> {
      const response = await send<S>({ kind: 'get_view', key });
      return response.result.state;
    },
    onStateChanged<S>(handler: (event: StateChangedEvent<S>) => void): Promise<Unlisten> {
      return transport.listen<StateChangedEvent<S>>(EVENT_STATE_CHANGED, handler);
    },
  };
}
