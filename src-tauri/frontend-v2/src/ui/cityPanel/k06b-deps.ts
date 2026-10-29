/**
 * k06b-deps.ts (P5-8, R-RUSTPORT-P5-8-CITYPANEL-K06B-Q1, runda 1): delegaty zależności pinu dla jednostek K06B.
 *
 * K06B-Z2: każda zewnętrzna funkcja pinu (bloki 1, 5, 7, 9 i inne kawałki poza K06B) jest wołana przez `dep(nazwa)`;
 * wartości z DTO / silnika wstrzykuje kontroler przez `setK06bDeps`. Wiring kontrolera: NIE_ZMIERZONO.
 * K06B-Z4: wartości danych/stanu (`cfg`, `TEREN_COL`, …) są leniwymi proxy do obiektu z `setK06bDeps`;
 * stałe tekstowe (`constStr`) są czytane z `setK06bDeps` przy wywołaniu.
 */

/** Delegaty K06B: funkcje pinu albo wartości (obiekty danych, stałe). */
export type K06bDeps = Record<string, unknown>;

let deps: K06bDeps | null = null;

/** Ustawia zależności (merge z poprzednimi). Wiring w kontrolerze poza zakresem K06B (NIE_ZMIERZONO). */
export function setK06bDeps(next: K06bDeps): void {
  deps = { ...(deps ?? {}), ...next };
}

/** Delegat funkcji; brak delegatu = błąd jawny (nie cicha wartość domyślna). */
export function dep(name: string): (...args: any[]) => any {
  const f = deps?.[name];
  if (typeof f !== 'function') throw new Error(`K06B: brak delegatu ${name} (setK06bDeps)`);
  return f as (...args: any[]) => any;
}

/** Leniwy odczyt wartości (obiekt danych/stanu); metody wiązane do obiektu źródłowego. */
export function valueProxy(name: string): any {
  const target = (): any => {
    const v = deps?.[name];
    if (v === undefined || v === null) throw new Error(`K06B: brak wartości ${name} (setK06bDeps)`);
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

/** Stała tekstowa z danych gry (pin: game/cities.ts); wartość z setK06bDeps. */
export function constStr(name: string): string {
  const v = deps?.[name];
  if (typeof v !== 'string') throw new Error(`K06B: brak stałej ${name} (setK06bDeps)`);
  return v;
}

/** Nazwy delegatów funkcji użyte w modułach K06B (zob. dossier K06B-Z2). */
export const K06B_FN_NAMES = ["_legacyBuildUnitDetailCard","appendBuildActionButtons","appendBuildingInlineIcon","appendCityResourceStockStrip","appendDetailAlgo","appendDetailFormula","appendDetailGrid","appendDetailSection","appendDisabledBuildActionButtons","appendGarrisonUnitChip","appendTechDetailBlock","attachHoverDetail","attachInteractiveDetail","beginBuildingDetailTile","bindBuildQueueDragReorder","bindRecruitQueueDragReorder","buildBuildingBuildTabDetailCard","buildBuildingDetailCard","buildUnitRecruitCard","buildUpgradeBonusDetailCard","buildableProduction","buildingCanBuildNow","buildingConverterProductionDisplay","buildingIconHtml","buildingLevelForEpoch","buildingOwnedBonusCompactHtml","buildingOwnedLevel","buildingProductionItem","buildingTypeQueued","buildingUpkeepDisplay","cancelQueueItem","cityPanelChipIconWrap","cityPracaSplit","clearPinnedDetail","collectEraPreviewEntries","cpInlineIcons","createScrollList","daninaLabelForCity","defaultOwnerColor","dequeueRecruitment","el","empireRekruciAffordable","empireRekruciTotal","ensureEntityCardBuildingStyles","etaTurns","fillIconElement","filterRuntimeActiveBuiltIds","findBuildingDef","findUnitDef","formatBuildingCatalogLockHint","formatBuildingPreviewHint","formatBuildingUpkeepRowHtml","formatBuildingUpkeepTotalHtml","formatConverterProductionRowHtml","formatManpower","frontItem","gameData","getProd","getShowEraBuildingPreview","gridDetailRow","groupBuiltBuildingIds","improvementKeysForHex","improvementRangeRow","improvementsInCityRange","isMeCity","maxAffordableRecruitQuantity","missingStockFor","moveQueueItem","moveRecruitQueueItem","ownerSurowcePoolFor","productionCtxForCity","productionQueueIconSpan","promoteToFront","psiRowLabel","queueItemCumulativeEta","queueItemOwnEta","rangeName","recruitManpowerCost","recruitUnit","renderEntityCard","rerender","resolveEmpireSnap","resolveOwnedBuildingInactiveStatus","resourceTextClass","ringsTiles","setNoteHtml","setProd","setShowEraBuildingPreview","showHoverDetailNow","showPinnedDetail","signed","sortProductionItemsByBuildability","statChipBrand","stockResourceLabel","sumOwnedBuildingsResourceUpkeep","sumOwnedBuildingsUpkeep","tileYield","tury","unitAdapter","unitIconHtml","unitResourceUpkeepChipsHtml","unitStockCost","unitStockCostChipsHtml","upgradeChainSteps"] as const;

/** Nazwy wartości użyte w modułach K06B (zob. dossier K06B-Z4). */
export const K06B_VALUE_NAMES = ["EPOCH_NUMBER_TO_NAME","IMPROVEMENT_KEY_TO_NAME","Nakladka","cfg"] as const;
