/**
 * controller/mockCatalog.ts — ATRAPA (MOCK) danych dla paneli poziomu 0 (P5.2).
 *
 * Wartości są STAŁYMI fiksturami oznaczonymi „MOCK” — NIE są kopią `gra/data/**` (zakaz kopiowania
 * danych gry, D-UI-4) i niczego nie liczą (P5.13). Docelowo te same kształty przychodzą z Rust
 * (`get_view { key: staticCatalog }`, `list_saves`, diagnostyka D-UI-7).
 */
import type { SaveSlotsService } from './saveSlots';
import type { PerfDiagnosticsDto, SaveSlotsDto, StaticCatalogDto } from '../viewmodel/types';

/** = `MOCK_LABEL` z `mock.ts` (osobna stała, by uniknąć cyklu importów mock.ts ↔ mockCatalog.ts). */
const MOCK_LABEL = 'MOCK' as const;

export const MOCK_STATIC_CATALOG: StaticCatalogDto = {
  contentHash: 'MOCK-static-catalog-p5-2',
  buildings: [],
  units: [
    { Jednostka: 'MOCK-Wojownik', Tech: 'MOCK-Brąz', 'Super-jednostka': null, 'Rola (linia)': 'MOCK', Typ: null },
    { Jednostka: 'MOCK-Łucznik', Tech: 'MOCK-Brąz', 'Super-jednostka': null, 'Rola (linia)': 'MOCK', Typ: null },
  ],
  // P5.4: kształty JSON (`tech.json` → `{ technologie }`, `wonders.json` → `{ cuda }`) — czytane przez
  // `entityCards/registry.ts`, `sciencePicker.ts`, `techDiscoveryNotice.ts` przy ewaluacji modułu.
  tech: { technologie: [] },
  terrainImprovements: {},
  wonders: { cuda: [] },
  counters: {},
  civs: {
    cywilizacje: [
      {
        Cywilizacja: 'MOCK-Cywilizacja',
        ikonaId: 'mock',
        typCywilizacji: 'mock',
        'Styl / charakter': 'MOCK styl',
        'Jednostka specjalna': 'MOCK jednostka',
        wodzowie: { kamien: 'MOCK-Wódz' },
        wodzowiePula: ['MOCK-Wódz A', 'MOCK-Wódz B'],
      },
    ],
  },
  cityNamesPools: {},
  powerParams: {},
  uiParams: {
    panel_miasta: {
      rush_cost_mnoznik: 1,
      okolica_promien: 1,
      okolica_hex_px: 1,
      font_scale: [{ label: 'MOCK', px: 14 }],
      font_scale_domyslna_px: 14,
    },
    menu: { wersja: 'MOCK', etap: 'MOCK', muzyka_fade_in_ms: 0, ustawienia: [] },
    nowa_gra: { ustawienia: [] },
  },
  // P5.5: kształt `wikiBundle.json` (`{ poradnik, encyklopedia }`) — czytany przez `wikiHubHud.ts` przy ewaluacji modułu.
  wiki: { poradnik: [], encyklopedia: [] },
  constants: {
    handelPctStep: 0,
    maxProcentNauka: 0,
    minPodzialPracyBudynkiPercent: 0,
    maxPodzialPracyBudynkiPercent: 0,
    maxProcentPuliImperium: 0,
    maxUlepszeniaPracaAutoPercent: 0,
    wyzywienieMin: 0,
    wyzywienieMax: 0,
    wyzywienieStep: 0,
    researchQueueMax: 0,
    progDominacjiPower: 0.5,
    citizenUpkeepRatePerCitizen: 0,
    handelZlozeCenaBaza: 0,
    barbarianCooperationDefaultDurationTurns: 0,
    fogExploredBrightness: 0.5,
    mapGenPhaseTotal: 3,
    mapGenPhaseLabels: { prep: 'MOCK faza 1', terrain: 'MOCK faza 2', starts: 'MOCK faza 3' },
    epochNumberToName: {},
    improvementKeys: [],
    cityBuildingPrereq: { mock: MOCK_LABEL },
    waterAccessBuildingIds: [],
    cityPanelRangeDepositLabels: { mock: MOCK_LABEL },
    tempoGry: { 'MOCK-tempo': 1 },
  },
  labels: {
    podzialPracyPulaLbl: 'MOCK',
    podzialPracyPulaPelna: 'MOCK',
    podzialPracyPulaTip: 'MOCK',
    porBandLabels: [],
    traktatHandlowyLabel: 'MOCK',
    resourceAccessTradeWithdrawnReason: 'MOCK',
    powerHudLabelPl: 'MOCK-Moc',
  },
  unitCategory: { 'MOCK-Wojownik': 'maczuga', 'MOCK-Łucznik': 'lucznik' },
  unitCategoryNameOnly: { 'MOCK-Wojownik': 'domyslny', 'MOCK-Łucznik': 'domyslny' },
  techTerrainUnlockLabels: {},
};

export const MOCK_PERF_DIAGNOSTICS: PerfDiagnosticsDto = {
  buildStamp: 'MOCK-BUILD-STAMP',
  riverGenEnabled: true,
  riverGenPhase: 'all',
};

export const MOCK_SAVE_SLOTS: SaveSlotsDto = {
  slots: [
    {
      slotId: 'mock-slot-1',
      label: 'MOCK zapis',
      tura: 1,
      savedAt: '',
      mapSize: 'MOCK',
      worldType: 'kontynenty',
      civId: 'mock',
      unitsCount: 0,
      citiesCount: 0,
      seed: 0,
      saveOrigin: '',
    },
  ],
  lastPlayed: null,
  autosaves: [],
  storageAvailable: true,
  diskSlotPrefix: 'fsa:',
};

/** Atrapa usługi zapisów: operuje na kopii fikstury w pamięci (bez zapisu na dysk). */
export function createMockSaveSlotsService(initial: SaveSlotsDto = MOCK_SAVE_SLOTS): SaveSlotsService {
  let state: SaveSlotsDto = { ...initial, slots: [...initial.slots], autosaves: [...initial.autosaves] };
  let seq = 0;
  return {
    source: MOCK_LABEL,
    async list(): Promise<SaveSlotsDto> {
      return { ...state, slots: [...state.slots], autosaves: [...state.autosaves] };
    },
    async delete(slot: string): Promise<void> {
      state = { ...state, slots: state.slots.filter((s) => s.slotId !== slot) };
    },
    async allocateSlotId(label: string): Promise<string> {
      seq += 1;
      return `MOCK-slot-${seq}-${label.length}`;
    },
  };
}
