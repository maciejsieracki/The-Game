/**
 * controller/cityPanelK06bDelegates.ts — WYGENEROWANY (tools/dom-harness/gen-k09b-k06b-delegates.mjs, P5-8 K09B).
 * Nie edytować ręcznie. Delegaty K06B z kopii portu (K06B-Z2) i głośne atrapy dla nazw bez definicji (K09B-D4).
 */
import type { K06bDeps } from '../ui/cityPanel/k06b-deps';

import { cpInlineIcons as d0, setShowEraBuildingPreview as d1 } from '../ui/cityPanel/k01a-fundament';
import { appendDetailAlgo as d2, appendDetailSection as d3, gridDetailRow as d4, setNoteHtml as d5 } from '../ui/cityPanel/k01b-dom';
import { formatBuildingUpkeepRowHtml as d6, formatBuildingUpkeepTotalHtml as d7 } from '../ui/cityPanel/k01b-f';
import { buildingOwnedBonusCompactHtml as d8, buildingUpkeepDisplay as d9, formatConverterProductionRowHtml as d10, queueItemCumulativeEta as d11, queueItemOwnEta as d12, sumOwnedBuildingsResourceUpkeep as d13 } from '../ui/cityPanel/k01b-r';
import { buildingIconHtml as d14, daninaLabelForCity as d15, findBuildingDef as d16, findUnitDef as d17, moveQueueItem as d18, moveRecruitQueueItem as d19, unitIconHtml as d20 } from '../ui/cityPanel/k01b-t';
import { appendBuildingInlineIcon as d21, appendDisabledBuildActionButtons as d22, createScrollList as d23, fillIconElement as d24, productionQueueIconSpan as d25 } from '../ui/cityPanel/k02-units';
import { appendDetailFormula as d26, appendDetailGrid as d27, beginBuildingDetailTile as d28 } from '../ui/cityPanel/k03-detail';
import { setProd as d29 } from '../ui/cityPanel/k03-model';
import { buildingCanBuildNow as d30, buildingConverterProductionDisplay as d31, collectEraPreviewEntries as d32, empireRekruciAffordable as d33, empireRekruciTotal as d34, formatBuildingCatalogLockHint as d35, formatBuildingPreviewHint as d36, gameData as d37, improvementKeysForHex as d38, improvementsInCityRange as d39, maxAffordableRecruitQuantity as d40, missingStockFor as d41, ownerSurowcePoolFor as d42, productionCtxForCity as d43, rangeName as d44, recruitManpowerCost as d45, recruitUnit as d46, ringsTiles as d47, sortProductionItemsByBuildability as d48, stockResourceLabel as d49, unitResourceUpkeepChipsHtml as d50, unitStockCost as d51, unitStockCostChipsHtml as d52 } from '../ui/cityPanel/k05a-fundament';
import { appendBuildActionButtons as d53, formatManpower as d54, isMeCity as d55, upgradeChainSteps as d56 } from '../ui/cityPanel/k05b-host';
import { _legacyBuildUnitDetailCard as d57, buildUpgradeBonusDetailCard as d58 } from '../ui/cityPanel/k05b-jednostki';
import { appendTechDetailBlock as d59, buildBuildingBuildTabDetailCard as d60, buildBuildingDetailCard as d61, ensureEntityCardBuildingStyles as d62 } from '../ui/cityPanel/k05b-karty';
import { appendGarrisonUnitChip as d63, improvementRangeRow as d64 } from '../ui/cityPanel/k05b-widgety';
import { rerender as d65 } from '../ui/cityPanel/k09a-rerender';
import { renderEntityCard as d66 } from '../ui/entityCards/renderer';
import { unitAdapter as d67 } from '../ui/entityCards/unitAdapter';
import { attachHoverDetail as d68, attachInteractiveDetail as d69, showHoverDetailNow as d70, showPinnedDetail as d71 } from '../ui/hoverDetailDock';
import { defaultOwnerColor as d72 } from '../ui/unitMiniPreview';
import { buildUnitRecruitCard as d73 } from '../ui/unitRecruitCard';

/** Atrapa głośna: delegat bez definicji w v2 (dług K09B-D4) — rzuca przy wywołaniu z nazwą. */
const niePodpiete = (name: string) => (..._args: unknown[]): never => {
  throw new Error(`K06B delegat ${name} nie ma definicji w v2 (dług K09B-D4, P5-8-K09B.md §5)`);
};

/** Delegaty K06B z wiringu (ta sama nazwa co w `K06B_FN_NAMES`). */
export const K06B_PORT_DELEGATES: K06bDeps = {
  _legacyBuildUnitDetailCard: d57,
  appendBuildActionButtons: d53,
  appendBuildingInlineIcon: d21,
  appendCityResourceStockStrip: niePodpiete('appendCityResourceStockStrip'),
  appendDetailAlgo: d2,
  appendDetailFormula: d26,
  appendDetailGrid: d27,
  appendDetailSection: d3,
  appendDisabledBuildActionButtons: d22,
  appendGarrisonUnitChip: d63,
  appendTechDetailBlock: d59,
  attachHoverDetail: d68,
  attachInteractiveDetail: d69,
  beginBuildingDetailTile: d28,
  bindBuildQueueDragReorder: niePodpiete('bindBuildQueueDragReorder'),
  bindRecruitQueueDragReorder: niePodpiete('bindRecruitQueueDragReorder'),
  buildBuildingBuildTabDetailCard: d60,
  buildBuildingDetailCard: d61,
  buildUnitRecruitCard: d73,
  buildUpgradeBonusDetailCard: d58,
  buildableProduction: niePodpiete('buildableProduction'),
  buildingCanBuildNow: d30,
  buildingConverterProductionDisplay: d31,
  buildingIconHtml: d14,
  buildingLevelForEpoch: niePodpiete('buildingLevelForEpoch'),
  buildingOwnedBonusCompactHtml: d8,
  buildingOwnedLevel: niePodpiete('buildingOwnedLevel'),
  buildingProductionItem: niePodpiete('buildingProductionItem'),
  buildingTypeQueued: niePodpiete('buildingTypeQueued'),
  buildingUpkeepDisplay: d9,
  cancelQueueItem: niePodpiete('cancelQueueItem'),
  collectEraPreviewEntries: d32,
  cpInlineIcons: d0,
  createScrollList: d23,
  daninaLabelForCity: d15,
  defaultOwnerColor: d72,
  dequeueRecruitment: niePodpiete('dequeueRecruitment'),
  empireRekruciAffordable: d33,
  empireRekruciTotal: d34,
  ensureEntityCardBuildingStyles: d62,
  fillIconElement: d24,
  filterRuntimeActiveBuiltIds: niePodpiete('filterRuntimeActiveBuiltIds'),
  findBuildingDef: d16,
  findUnitDef: d17,
  formatBuildingCatalogLockHint: d35,
  formatBuildingPreviewHint: d36,
  formatBuildingUpkeepRowHtml: d6,
  formatBuildingUpkeepTotalHtml: d7,
  formatConverterProductionRowHtml: d10,
  formatManpower: d54,
  gameData: d37,
  gridDetailRow: d4,
  improvementKeysForHex: d38,
  improvementRangeRow: d64,
  improvementsInCityRange: d39,
  isMeCity: d55,
  maxAffordableRecruitQuantity: d40,
  missingStockFor: d41,
  moveQueueItem: d18,
  moveRecruitQueueItem: d19,
  ownerSurowcePoolFor: d42,
  productionCtxForCity: d43,
  productionQueueIconSpan: d25,
  promoteToFront: niePodpiete('promoteToFront'),
  queueItemCumulativeEta: d11,
  queueItemOwnEta: d12,
  rangeName: d44,
  recruitManpowerCost: d45,
  recruitUnit: d46,
  renderEntityCard: d66,
  rerender: d65,
  resolveOwnedBuildingInactiveStatus: niePodpiete('resolveOwnedBuildingInactiveStatus'),
  ringsTiles: d47,
  setNoteHtml: d5,
  setProd: d29,
  setShowEraBuildingPreview: d1,
  showHoverDetailNow: d70,
  showPinnedDetail: d71,
  sortProductionItemsByBuildability: d48,
  stockResourceLabel: d49,
  sumOwnedBuildingsResourceUpkeep: d13,
  tileYield: niePodpiete('tileYield'),
  unitAdapter: d67,
  unitIconHtml: d20,
  unitResourceUpkeepChipsHtml: d50,
  unitStockCost: d51,
  unitStockCostChipsHtml: d52,
  upgradeChainSteps: d56,
};

/** Nazwy bez definicji w v2 (głośne atrapy, dług K09B-D4). */
export const K06B_LOUD_MISSING: readonly string[] = ["appendCityResourceStockStrip","bindBuildQueueDragReorder","bindRecruitQueueDragReorder","buildableProduction","buildingLevelForEpoch","buildingOwnedLevel","buildingProductionItem","buildingTypeQueued","cancelQueueItem","dequeueRecruitment","filterRuntimeActiveBuiltIds","promoteToFront","resolveOwnedBuildingInactiveStatus","tileYield"];
