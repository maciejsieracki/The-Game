/**
 * k07b-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K07B-Q1, runda 3): delegaty zależności pinu dla jednostek K07B (DOM).
 *
 * K07B-Z2: funkcje pinu spoza bieżącej partii (kawałki K01–K06, DOM sąsiednich jednostek K07B jeszcze nieprzeniesione,
 * reguły pinu `game/`, funkcje sterujące kontrolera) są wołane przez `dep(nazwa)`; wartości wstrzykuje kontroler
 * przez `setK07bDeps` (wiring: `controller/k07bWiring.ts`).
 * K07B-Z4: wartości danych/stanu (`cfg`, `POR_BAND_LABELS`) to leniwe proxy do obiektu z `setK07bDeps`.
 * Brak delegatu = wyjątek jawny (nie cicha wartość domyślna).
 *
 * Listy `K07B_FN_NAMES` / `K07B_VALUE_NAMES` = komplet nazw użytych w `dep('…')` / `valueProxy('…')` w `k07b-p1.ts`
 * i `k07b-p2.ts`; zgodność sprawdza harness `run-k07b-units.mjs` (sekcja „pokrycie delegatów”).
 */

/** Delegaty K07B: funkcje pinu albo wartości (obiekty danych, stałe). */
export type K07bDeps = Record<string, unknown>;

/** Funkcje delegowane przez `dep(…)` (komplet; patrz nagłówek). */
export const K07B_FN_NAMES = [
  'activeMap', 'appendBuildQueueSection', 'appendCitizenUpkeepBlock', 'appendCompositionBlock', 'appendProductionPicon',
  'appendRecruitmentQueue', 'attachInteractiveDetail', 'buildBuildingBuildTabDetailCard', 'buildKulturaDetailCard',
  'buildOkolicaDetailCard', 'buildPorzadekDetailCard', 'buildTopBarKulturaDetailCard', 'buildZdrowieDetailCard',
  'buildableProduction', 'cancelQueueItem', 'cityLudnoscAbsolutna', 'cityPanelChipIconWrap', 'cityPanelTitle',
  'cityPracaSplit', 'dedupeBudowaLista', 'defaultBudowaListaNazwa', 'el', 'etaTurns', 'formatManpower',
  'formatWyzwienieLabel', 'frontItem', 'gameData', 'getProd', 'growthGainPerTurnSlots', 'isCityUxFrameOpen', 'isMeCity',
  'loadOrderParams', 'orderBandEffectShort', 'orderTierUi', 'porPctBand', 'postCaptureLawBannerLabel',
  'productionCtxForCity', 'rangeName', 'renderBuildList', 'renderSurowce', 'renderWorkedPreview', 'rerender',
  'resolveCityHealth', 'resolveEmpireSnap', 'resolveOrderState', 'resourceTextClass', 'rushCost',
  'sanitizeBudowaPriorytetTypow', 'setPaused', 'setProd', 'szLinesDoWyswietlenia', 'turnsUntilNextCitizen', 'tury',
] as const;

/** Wartości czytane przez `valueProxy(…)`. */
export const K07B_VALUE_NAMES = ['cfg', 'POR_BAND_LABELS'] as const;

let deps: K07bDeps | null = null;

/** Ustawia zależności (merge z poprzednimi). */
export function setK07bDeps(next: K07bDeps): void {
  deps = { ...(deps ?? {}), ...next };
}

/** Delegat funkcji; brak delegatu = błąd jawny. */
export function dep(name: string): (...args: any[]) => any {
  const f = deps?.[name];
  if (typeof f !== 'function') throw new Error(`K07B: brak delegatu ${name} (setK07bDeps)`);
  return f as (...args: any[]) => any;
}

/** Leniwy odczyt wartości (obiekt danych/stanu); metody wiązane do obiektu źródłowego. */
export function valueProxy(name: string): any {
  const target = (): any => {
    const v = deps?.[name];
    if (v === undefined || v === null) throw new Error(`K07B: brak wartości ${name} (setK07bDeps)`);
    return v;
  };
  return new Proxy(
    {},
    {
      get: (_t, k) => {
        const t = target();
        const v = (t as any)[k];
        return typeof v === 'function' ? v.bind(t) : v;
      },
    },
  );
}

/** Test/diagnostyka: czy zestaw delegatów pokrywa komplet nazw K07B (zwraca brakujące). */
export function k07bMissingDeps(provided: K07bDeps): string[] {
  return [...K07B_FN_NAMES, ...K07B_VALUE_NAMES].filter((n) => provided[n] === undefined || provided[n] === null);
}
