/**
 * controller/cityPanelK05a.ts — producent DTO `panelInputs.k05a` (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K05B-Q1, runda 2,
 * ZADANIE 1 dispatchu: „producent DTO `panelInputs.k05a` w controller/ — zapytanie/mapper z atrapy kontrolera (MOCK)").
 *
 * Mapper PRZEPISUJE wartości z surowego wejścia silnika do `CityPanelK05ADto` (`viewmodel/types.ts`); nie liczy reguł
 * gry (P5.13). Pole nieobecne w wejściu = pole nieobecne w DTO (wtedy `setK05aFromDto` oddaje wynik silnika).
 * Dane są stałą atrapą MOCK (jak `mock.ts`); źródłem docelowo jest silnik Rust (NIE_ZMIERZONO w P5-8-K05B.md §6).
 *
 * Kształt wejścia (`CityPanelK05aRaw`) odpowiada polom pinu, które czyta K05A: `cfg.getEmpireRekruciTotal`,
 * `cfg.getManpowerSnapshot(...).manpowerBiezacy`, `unitManpowerCostForType`, `techPrereqChain`, `unitStockCost`,
 * `stockResourceLabel` (pin: cityPanel.ts / game/*).
 */
import type { CityPanelK05ADto } from '../viewmodel/types';

/** Surowe wejście silnika dla DTO K05A (atrapa MOCK; klucze liczbowe = id właściciela / miasta). */
export interface CityPanelK05aRaw {
  readonly empireRekruciTotal?: Readonly<Record<number, number>>;
  readonly manpowerBiezacy?: Readonly<Record<number, number>>;
  readonly manpowerCost?: Readonly<Record<string, number>>;
  readonly techPrereqChain?: Readonly<Record<string, readonly string[]>>;
  readonly unitStockCost?: Readonly<Record<string, Readonly<Record<string, number>>>>;
  readonly stockLabels?: Readonly<Record<string, string>>;
}

/** Kopia płytka rekordu (DTO nie współdzieli obiektów z wejściem); `undefined` zostaje `undefined`. */
function copyRec<T>(rec: Readonly<Record<string, T>> | undefined): Record<string, T> | undefined {
  return rec === undefined ? undefined : { ...rec };
}

/** Mapper: surowe wejście → `CityPanelK05ADto` (tylko przepisanie pól, bez reguł). */
export function mapCityPanelK05aDto(raw: CityPanelK05aRaw): CityPanelK05ADto {
  return {
    empireRekruciTotalByOwner: copyRec(raw.empireRekruciTotal),
    manpowerBiezacyByCity: copyRec(raw.manpowerBiezacy),
    manpowerCostByUnit: copyRec(raw.manpowerCost),
    techPrereqChainByTech: raw.techPrereqChain === undefined
      ? undefined
      : Object.fromEntries(Object.entries(raw.techPrereqChain).map(([k, v]) => [k, [...v]])),
    unitStockCostById: raw.unitStockCost === undefined
      ? undefined
      : Object.fromEntries(Object.entries(raw.unitStockCost).map(([k, v]) => [k, { ...v }])),
    stockResourceLabelByKey: copyRec(raw.stockLabels),
  };
}

/** Atrapa MOCK wejścia K05A (wartości stałe, nie wyliczone). */
export const MOCK_CITY_PANEL_K05A_RAW: CityPanelK05aRaw = {
  empireRekruciTotal: { 0: 14 },
  manpowerBiezacy: { 1: 30 },
  manpowerCost: { phalanx: 6, lucznik: 4 },
  techPrereqChain: { Rolnictwo: ['Pismo', 'Rolnictwo'] },
  unitStockCost: { lucznik: { drewno: 2 } },
  stockLabels: { drewno: 'Drewno' },
};

/**
 * Zapytanie o `panelInputs.k05a` z atrapy kontrolera (MOCK). Zwraca świeży obiekt DTO za każdym razem.
 * Wpięcie w `get_view` panelu miasta — NIE_ZMIERZONO: atrapa nie zwraca jeszcze widoku panelu miasta (`mock.ts`).
 */
export function mockCityPanelK05aInputs(): CityPanelK05ADto {
  return mapCityPanelK05aDto(MOCK_CITY_PANEL_K05A_RAW);
}
