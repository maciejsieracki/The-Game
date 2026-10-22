/**
 * controller/saveSlots.ts — usługa slotów zapisu dla `saveLoadDialog.ts` (P5.2).
 *
 * Zastępuje importy `game/save.ts` (`listSaves`, `loadSaveSlotMeta`, `loadFromLocal`, `deleteLocal`,
 * `getLastPlayedSlotId`, `isIdbAvailable`, `uniqueSlotIdFromLabel`, `FSA_SLOT_PREFIX`) i
 * `game/fsa-autosave.ts` (`listFsaAutosaveFiles`, `loadFsaAutosaveFile`) — klasa IO/M z P5-0 §7.
 * Docelowo komendy powłoki P2-5 §2.10 (`list_saves`, `delete_save`; proponowane `allocate_save_slot`),
 * w tej rundzie wyłącznie atrapa MOCK (`mock.ts`).
 */
import type { SaveSlotsDto, SlotId } from '../viewmodel/types';

export interface SaveSlotsService {
  /** Etykieta źródła (MOCK / TAURI). */
  readonly source: 'MOCK' | 'TAURI';
  /** Sloty lokalne + zapisy z dysku + ostatnio grany + dostępność magazynu (`list_saves`). */
  list(): Promise<SaveSlotsDto>;
  /** Usuń zapis lokalny (`delete_save`). */
  delete(slot: SlotId): Promise<void>;
  /**
   * Nowy, unikalny identyfikator slotu dla etykiety — nadaje powłoka (P5-0 §6.15; web:
   * `uniqueSlotIdFromLabel`, `game/save.ts:1088`).
   */
  allocateSlotId(label: string): Promise<SlotId>;
}

let current: SaveSlotsService | null = null;

export function installSaveSlotsService(service: SaveSlotsService): void {
  current = service;
}

export function saveSlotsService(): SaveSlotsService {
  if (current === null) {
    throw new Error('frontend-v2: SaveSlotsService nie zainstalowany (installSaveSlotsService przed otwarciem dialogu zapisu)');
  }
  return current;
}
