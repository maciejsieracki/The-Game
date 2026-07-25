/**
 * main.ts
 * Punkt wejscia The Game -- M1 Step 1: 3D hex map renderer.
 *
 * Pipeline:
 *   loadGameData() -> configureTerrainMovement (if data carries terrainMovement)
 *   -> generateMap(seed) -> buildScene() -> CameraController -> render loop
 */

// Global Error Overlay
// Catches any JS error or unhandled promise and shows it as a red overlay
// so a black screen never silently hides what went wrong.

function showErr(msg: string): void {
  let el = document.getElementById('__err_overlay__') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = '__err_overlay__';
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%',
      'background:rgba(180,0,0,0.92)', 'color:#fff',
      'font:bold 13px/1.5 monospace', 'padding:16px 20px',
      'z-index:99999', 'white-space:pre-wrap', 'word-break:break-all',
      'max-height:50vh', 'overflow-y:auto',
      'border-bottom:3px solid #ff4444',
    ].join(';');
    el.innerHTML = '<b>THE GAME \u2014 ERROR</b>\n';
    document.body.appendChild(el);
  }
  el.innerHTML += '\n' + msg;
  console.error('[TheGame]', msg);
}

window.addEventListener('error', (e) => {
  showErr(e.message + ' @' + e.filename + ':' + e.lineno + ':' + e.colno);
});
window.addEventListener('unhandledrejection', (e) => {
  showErr('Unhandled promise rejection: ' + String(e.reason));
});

// Imports

import * as THREE from 'three';
import { loadGameData } from './data/loader';
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT, rozmiarFromMenuLabel } from './map/generator';
import { generujSwiatAsync } from './map/mapGenAsync';
import type { TypSwiata } from './map/gen-helpers';
import { typSwiataFromMenuLabel, aktywneTypyFromMapLabel, defaultCivTypesFromMapLabel, defaultMiastaPanstwaFromMapLabel, clampMiastaPanstwaCount, type WorldGenerationPreset, DEFAULT_WORLD_DENSITY } from './map/newGameMapDefaults';
import { buildScene, getLastSetFogMs } from './render/scene';
import {
  CIV_PERF_DEBUG_MARKER,
  isPerfDebugOverlayVisible,
  togglePerfDebugOverlay,
  updatePerfDebugOverlay,
} from './render/perfDebugOverlay';
import { CIV_PUBLISH_MARKERS } from './buildInfo';
import { showMapLoadingOverlay } from './ui/mapLoadingOverlay';
import {
  beginTurnTransition,
  endTurnTransition,
  setTurnTransition,
  yieldTurnTransitionUi,
} from './ui/turnTransitionOverlay';
import { fogBrightnessForHex, applyFogDimToObject3D } from './render/fogDim';
import { CameraController, type CameraControllerOptions } from './render/camera';
import { HEX_R, axialToWorld, worldToAxial } from './render/hexutil';
import { computeStartPlacements, computeReachable, computePath, listUnitTypes, pathCost, configureTerrainMovement, hexDistance, categoryOf, terrainMoveCost, isCivilianUnit } from './units/setup';
import type { RuntimeUnit } from './units/setup';
import { UnitRenderer, type UnitRingStance } from './render/units';
// Import keyOf from picker only (avoids duplicate identifier with setup.ts keyOf)
import { pixelToHex, unitAt, keyOf } from './input/picker';
import { computeVisible, addExplored, allHexKeys, allRevealLandKeys, exploredSetForRender, DEFAULT_SIGHT, computeVisibleAt, buildUnitSightResolver, unitsVisibleOnMap } from './game/visibility';
import { runScoutsAutoExplore } from './game/scout-auto-explore';
import { startRevealRadiusForDifficulty } from './map/startScoring';
import { canFoundCity, foundCity, foundCityAt, ensureCitySaveDefaults, DEFAULT_PODZIAL_HANDLU, DEFAULT_BUDOWA_TRYB, type City, type BudowaFocus } from './game/cities';
import { applyCityFoundingToHex, cityKeepsImprovement } from './game/city-hex-clear';
import { canUnitOccupyCityHex, addForeignCityBlocks } from './game/city-hex-movement';
import {
  evaluateFoundCityAffordance,
  foundCityCostLabel,
  isSubsequentFoundCity,
} from './game/city-founding';
import { assignAiCivTypes, civIdsAvailableAtGameEpoch } from './game/civ-roster';
import {
  civColorCssForOwner,
  civColorForOwner,
  civColorHex,
} from './game/civ-visual';
import {
  evaluateWonderBuildGate,
  listBuildableWondersForCiv,
  buildTechEpochMap,
} from './game/wonder-availability';
import {
  getWondersForCiv,
  getWonderById,
  getWonderAbsolutEpoka,
  getWondersData,
  sumWonderCityYieldsForOwner,
  hasAnyWonderCityYield,
  type WonderDef,
  type WonderYieldBonus,
} from './game/wonders-data';
import { gameEpochHudLabel, type CivEntryEpochRow } from './game/civ-entry-epoch';
import type { ProductionItem } from './game/production';
import { resolveArchetypeAggression, resolveArchetypeTrade } from './game/civ-ai-data';
import { buildClusterStartPlan, buildSameTypeRivalCandidateHexes } from './game/cluster-start';
import { clusterCityStateRadius, MIN_DIST_START_CITY_STATE, type ClusterPlacement } from './map/clusters';
import { playerStartCityName, clusterRivalCityName, pickAiFoundedCityName, suggestPlayerFoundCityName } from './game/civ-names';
import {
  formatOwnerDiploLabel,
  isOwnerClusterCityState,
  isTechnicalOwnerLabel,
  resolveOwnerBaseName,
} from './game/display-names';
import {
  computeDiplomaticContacts,
  defaultNeutralRelation,
  diplomacyLayerForOwner,
  filterDiplomacyCommandsForLayer,
  filterDiplomacyCommandsForEstablishedContact,
  playerDiplomacyActionAllowed,
  startRelationForPair,
  applyCityStateDifficultyTrust,
} from './game/diplomacy-layers';
import { grantTechEpokWczesniejszych } from './game/research';
import { computeOwnerEraFromResearch } from './game/owner-epoch';
import { cityHasPalacLine } from './game/building-upgrades';
import {
  evaluateOrderFromBreakdown,
  updateRevoltGrace,
  loadRevoltParams,
  revoltWarningMessage,
  isOsiedleRevoltImmune,
  REBEL_FACTION_OWNER_ID,
} from './game/society-breakdown';
import {
  buildPlaytestWalkaMapy,
  PLAYTEST_WALKA_SEED,
  collectPlaytestBattleRoster,
  PLAYTEST_WALKA_HINT,
  PLAYTEST_OBLEZ_HINT,
  resolvePlaytestWalkaVariant,
  buildBitwaDuzaPreset,
  buildOblezenieDuzePreset,
  isPlaytestBitwaDuzaMode,
  isPlaytestOblezenieDuzeMode,
  PLAYTEST_BITWA_DUZA_ROSTER_RADIUS,
  PLAYTEST_BITWA_DUZA_HINT,
  PLAYTEST_OBLEZENIE_DUZE_HINT,
} from './game/playtestWalkaMapy';
import {
  buildPlaytestOdskok3v3,
  buildPlaytestOdskokOblezenie,
  PLAYTEST_ODSKOK_SEED,
  PLAYTEST_ODSKOK_HINT,
  PLAYTEST_ODSKOK_OBLEZENIE_HINT,
  isPlaytestOdskokMode,
  isPlaytestOdskokOblezenieMode,
} from './game/playtestOdskok3v3';
import {
  buildPlaytestMiastoEkonomia,
  PLAYTEST_MIASTO_SEED,
  PLAYTEST_MIASTO_HINT,
} from './game/playtestMiastoEkonomia';
import {
  buildPlaytestMapaSwiata,
  PLAYTEST_MAPA_SEED,
  PLAYTEST_MAPA_HINT,
  resolvePlaytestMapaWorldDensity,
} from './game/playtestMapaSwiata';
import {
  canInitiateSiege, classifyCityAttack, detectAutoSiegeOnCity,
  type MapSiegeContext,
} from './game/mapSiegeDetect';
import { resolveEnemyCityClick } from './map/map-attack-city';
import { launchFieldBattleFromMap } from './battle/mapFieldBattle';
import { collectAtkRosterNearCity, collectBattleRoster as collectBattleRosterPure, collectDefRosterNearCity } from './units/battleRoster';
import { hasCityDefenders, survivorsLiveSet } from './game/siegeDefenders';
import { getCityFood } from './game/turn-economy';
import { SiegeMarkerRenderer } from './render/siegeMarker';
import {
  showSiegeMapPanel, hideSiegeMapPanel, updateSiegeMapPanelTurn, isSiegeMapPanelOpen,
  getActiveSiegeCityId, setSiegePanelBesiegerCount,
} from './ui/siegeMapPanel';
import { makeMilitia, type SiegeCity, type SiegeUnit } from './game/siege';
import {
  decideAISiegeStance,
  EMPTY_SIEGE_AI_STATE,
  type SiegeAiState,
} from './game/siegeAi';
import {
  advanceSiegeMachineBuild,
  clearSiegeMachines,
  consumeReadyMachines,
  ensureSiegeMachines,
  peekReadyMachines,
  queueSiegeMachine,
  SIEGE_MACHINE_TYPE_ID,
  type SiegeMachineKind,
} from './game/siegeMachines';
import { showCityAttackChoice, hideCityAttackChoice } from './ui/cityAttackChoice';
import { showCityUnitPick, hideCityUnitPick, isCityUnitPickOpen } from './ui/cityUnitPick';
import { showUnitReplacePicker } from './ui/unitReplacePicker';
import { showCityCaptureNotice } from './ui/cityCaptureNotice';
import { showArmyMergePanel, hideArmyMergePanel, isArmyMergePanelOpen } from './ui/armyMergePanel';
import { showArmySplitPanel, hideArmySplitPanel, isArmySplitPanelOpen } from './ui/armySplitPanel';
import { unitIconSvg } from './ui/icons/brandAssets';
import { techIconSvg } from './ui/techIcons';
import {
  visibleStackOnHex,
  computeStackDisplay,
  unitAtRepresentative,
  findAdjacentEmptyHexes,
  assignBounceHexesForUnits,
  pickStackRepresentative,
  stackRuchLeft,
  syncStackRuchLeft,
  deductStackRuchLeft,
  unitWithStackRuch,
  countLawGarrisonOnCityHex,
  unitsOnCityHexForLaw,
} from './game/armyMerge';
import {
  resolveMapUnitCursor,
  CURSOR_MAP_DEFAULT,
} from './ui/mapUnitCursor';
import { isInTerritory, territoryOwnerAt, isPlayerTerritoryHex, cityTerritoryRadius } from './map/territory';
import type { CityNode, TerritoryNode } from './map/territory';
import type { GameMap } from './types/map';
import {
  advanceCityEconomy, type EconUnit,
  computeCityHealthBreakdown, cityWorkedTilesForEconomy, workedHexCoordsForCity,
  sumEconomyForOwner,
  sumEconomyForPlayerCities,
  previewCityEconomy,
  computeTerritoryResourceYieldByCity,
  ownerResourceCap,
  cityHasWaterAccess,
} from './game/turn-economy';
import {
  refreshTradeRoutes,
  computeTradeRouteIncomeByCity,
  computeTradeRouteCountByCity,
  computeTradeRouteResourceGrants,
  hasTradeRouteResourceAccess,
  firstTradeRouteResourceGrant,
  loadTradeRouteParams,
  loadTradeRouteIncomeParams,
  diffTradeRoutes,
  findCityConnection,
  tradeRouteDistanceIncome,
  citiesHaveTradeConnection,
  type TradeRoute,
  type TradeRouteCityRef,
  type TradeRouteParams,
  type TradeRouteIncomeParams,
  type TradeRouteResourceGrant,
  type TradeRouteResourceKey,
} from './game/trade-routes';
import {
  empireHasKopalniaMiedzi,
  cityHasPiecHutniczy,
  KOPALNIA_MIEDZI_KEY,
} from './game/braz-access';
import { computeEmpireLivestockUnlocks } from './game/livestock-unlock';
import {
  createPlayerState,
  researchStep,
  availableTechs,
  setPlayerResearchTarget,
  getResearchState,
  techCost,
  isEraAdvanceTech,
  eraAdvanceTarget,
  enqueueResearchTarget,
  dequeueResearchTarget,
  getResearchPlanSnapshot,
  type PlayerState,
  type EmpireResearchGate,
} from './game/playerState';
import {
  pickVillageReward,
  villageGoldAmount,
  villageTechProgress,
  villageUnitForEra,
} from './game/villageRewards';
import { CityRenderer, type CityRenderOptions, type CityMapOutlineKind } from './render/cities';
import { WonderRenderer, type PlacedWonder } from './render/wonderRenderer';
import { pickWonderHexForCity } from './map/wonder-placement';
import {
  GAME_MAP_RENDER_STYLE,
  TERRAIN_SURFACE_Y,
  DEFAULT_MAP_RENDER_OPTIONS,
  galleryDecorSurfaceY,
  type MapRenderOptions,
} from './render/mapRenderStyle';
import {
  bundledMapQualityPreset,
  qualityTierFromLabel,
  qualityTierToLabel,
  type QualityTier,
} from './map/newGameMapDefaults';
import { buildStyledResourceOverlay } from './render/styleResources';
import { collapseToMergedMesh } from './render/mergeDecor';
import { visibleZloze, ensureDepositEraMeta } from './map/deposit-era';
import { machinesByCampHex, campOwnerByHex, readyMachinesForCity } from './render/siegeCampSync';
import { TerenBazowy, Nakladka, Ulepszenie } from './types/hex';
import type { Hex } from './types/hex';
import { showCityPanel, hideCityPanel, isCityPanelOpen, refreshCityPanelIfOpen, getOpenCityPanelCityId, closeCityPanelIfOpen } from './ui/cityPanel';
import { tryCloseCityUxFrameFromKeyboard } from './ui/cityUxFrame';
import { syncCityOkolicaOverlay, disposeCityOkolicaOverlayGroup } from './render/cityOkolicaOverlay';
import { syncWorkerFieldOverlay, disposeWorkerFieldOverlayGroup } from './render/workerFieldOverlay';
import { isPointOverCityPanelUi } from './ui/cityUxFrame';
import {
  buildHexContextTooltipHtml,
  buildUnitContextTooltipHtml,
} from './ui/hexContextTooltip';
import { showPreBattle, hidePreBattle, isPreBattleOpen, configurePreBattle } from './ui/preBattle';
import { leaderNameFromPool } from './ui/leaderPortraits';
import {
  showPostBattleSummary,
  hidePostBattleSummary,
  isPostBattleSummaryOpen,
} from './ui/postBattleSummary';
import {
  buildPostBattleSummary,
  type BattleUnitBeforeSnap,
  type BattleSummaryWinner,
} from './game/battle-summary';
import type { PreBattleInfo, PreBattleUnit } from './ui/preBattle';
import { showHud, updateHud as refreshD1bHud, hideHud, markMinimapDirty } from './ui/hud';
import {
  createCityListHud,
  hideCityListHud,
  isCityListHudOpen,
  showCityListHud,
  toggleCityListHud,
  type CityListEntry,
} from './ui/cityListHud';
import {
  createArmyListHud,
  hideArmyListHud,
  isArmyListHudOpen,
  setArmyListSelectedId,
  toggleArmyListHud,
  showArmyListHud,
  type ArmyListEntry,
} from './ui/armyListHud';
import {
  createDiploListHud,
  hideDiploListHud,
  isDiploListHudOpen,
  showDiploListHud,
  toggleDiploListHud,
  diploListEntryFromRelation,
  type DiploListEntry,
} from './ui/diploListHud';
import type { ArmyStackHudState } from './ui/armyStackHud';
import { formatArmiaLabel } from './ui/formatPl';
import type {
  HudState, WarWithPlayer, SidePanelEvent,
  PowerOverlayData, CultureOverlayData, ReligionOverlayData,
} from './ui/hud';
import { hideEmpireOverlay } from './ui/empireOverlayHud';
import { hidePowerOverlay } from './ui/powerOverlayHud';
import {
  mountEmpireDetailPanel,
  showEmpireDetailPanel,
  hideEmpireDetailPanel,
  refreshEmpireDetailPanel,
  isEmpireDetailPanelOpen,
} from './ui/empireDetailPanel';
import type { EmpireDetailSnap, EmpireResourceRow } from './ui/empireDetailTypes';
import {
  collectCultureRangeHexKeys,
  collectReligionRangeHexKeys,
  collectTerritoryHexKeysByOwner,
  type RangeCityInput,
} from './map/range-hexes';
import {
  buildRangeOverlayGroup,
  buildTerritoryBorderGroup,
  disposeRangeOverlayGroup,
  CULTURE_RANGE_STYLE,
  RELIGION_RANGE_STYLE,
} from './render/rangeOverlay';
import {
  buildTradeRoutesOverlayGroup,
  disposeTradeRoutesOverlayGroup,
  type TradeRouteOverlayInput,
} from './render/tradeRoutesOverlay';
import { showDiplomacyPendingModal } from './ui/diplomacyPendingHud';
import { getMinimapData, computeViewport } from './map/minimap';
import {
  createImprovementBuildApi,
  collectRoadKeys,
  type ImprovementBuildRequest,
  type ImprovementBuildCallbacks,
} from './map/improvement-build';
import type { ImprovementKey } from './render/improvements';
import { buildImprovement, buildImprovementStack, buildImprovementSectored } from './render/improvements';
// GRAFIKA-TEREN-2: render wiosek neutralnych + obozów barbarzyńców (wcześniej ZERO tri).
import { buildWioska, buildObozBarbarzyncow, WIOSKA_OBOZ_LAYOUT } from './render/wioska-oboz';
// GRAFIKA-TEREN-2: tarasy = wzgórze (wariant 0/3) + schodkowe półki NA garbie (nie mini-dysk w sektorze).
import { buildWzgorze, rotacjaDlaHeksa } from './render/teren-gory-wzgorza';
import { buildTarasy, tarasyWariantDlaHeksa } from './render/tarasy-model';
import { foodLayerFromAnimalDeposit, improvementKeysForHex } from './game/terrain-improvements';
import { isLivestockAllowed } from './game/livestock-unlock';
import { ikonaIdToBronzeCiv, type BronzeCiv } from './render/bronzeCity';
import { buildSettlementModel } from './render/settlementModel';
import { BattleScene } from './battle/battleScene';
import { buildTestArmies, ensureSiegeMachines as ensureSiegeMachinesPreset } from './battle/testBattle';
import type { PresetName } from './battle/testBattle';
import type { BattleResult, BattleUnit, BattleOpts } from './battle/battleScene';
import type { WorldTerrainInput } from './battle/battle-terrain';
import {
  startMusic, stopMusic, setMood, setEra, setMusicVolume, getMood,
  startIntroMusic, stopIntroMusic,
  startAmbience, stopAmbience, setAmbienceVolume, setAmbienceWaterView,
} from './audio/muzyka-antyczna';
import { loadMusicPrefs, saveMusicPrefs } from './audio/musicPrefs';
import { loadAmbiencePrefs, saveAmbiencePrefs } from './audio/ambiencePrefs';
import { resolveCombat, combatUnitFromDef, terrainDefenseMultiplier } from './game/combat';
import type { CombatUnit, TerrainEntry } from './game/combat';
import terrainCombatData from '../data/terrain-combat.json';
import {
  resolveAutoBattleByPower,
  sumRosterFieldM,
  autoBattleWinPct,
} from './game/auto-battle-power';
import {
  applyPostBattleMap,
  snapshotRosterPositions,
  findCityOnHex,
  applyCityCaptureAfterBattle,
  type MapBattleWinner,
} from './game/post-battle-map';
import {
  applyCapitalCapturePlunder,
  oldestCityOfOwner,
  type OwnerResourceAccess,
} from './game/capital-capture';
import { civBonusyForCivKey, cityPopulationCap, loadEconParams, sumBuildingHappinessFromBuiltIds } from './game/economy';
import { advanceProduction, rushProduction, rushCost, populationCostOf, UNIT_POPULATION_COST,
  enqueueRecruitment, advanceRecruitment, advanceRecruitmentGated, unitProductionItem,
  enqueue, buildingProductionItem, splitPraca, cityPracaInteger, pracaImperialPoolGain, availableProduction, availableReplacementsFor,
  buildingLevelForEpoch, buildingEffectAtLevel, frontItem, unitNacjaForCivKey, applyCompletedBuildingIds,
  type CityProduction, type AvailabilityContext } from './game/production';
import {
  buildingStockCost, unitStockCost, canAffordBuildingStock,
  ownerResourceStockAll, deductBuildingStockCostAcrossCities, creditOwnerResourceStock,
} from './game/building-stock-cost';
import { empireHasKopalniaNaZlozuZelaza, hasZelazoAccess } from './game/zelazo-access';
import {
  tradableGoodsForOwner as tradableGoodsIndexForOwnerPure, sumCitySurowce,
  type TradeGoodEntry,
} from './game/diplomacy-goods';
import {
  tryDeductUnitSpawnCosts, empirePoborTotals, rekrutUnitEquivalents, formatManpower,
  cityManpowerSnapshot, civManpowerRegenMult, civManpowerMaxMult, civManpowerMults,
  cityManpowerMax, unitManpowerCost, unitManpowerCostForType,
  canAffordUnitManpower, refundUnitSpawnToCity,
} from './game/manpower';
import { computeObjectivePower, battlePowerPointsFromDefeatedEnemy, type ObjectivePowerResult } from './game/power-objective';
import { filterOwnersForPowerRanking, computeAbsolutePowerRank } from './game/power-ranking';
import { loadPowerOpcje } from './game/power-options';
import { armyFieldPower, isSiegeUnit, siegePower } from './game/unit-power';
import { loadOrderParams, orderEffectsToYieldMults, pickRevoltMigrationTarget, type OrderYieldMults } from './game/order';
import { loadCultureParams, accumulateCulture, cultureHappiness, cityBorderRadius, cultureThresholds,
         loadReligionParams, civReligion, civReligionForKey, religionHappiness, dominantReligion,
         empireCultureTotal, countCitiesWithDominantStateReligion,
         makeRng, type CultureCity, type ReligionState,
         spreadReligion, type ReligionNeighbor,
         aggregateReligionEmpire, resolveCityReligionState, defaultCityReligionState,
         isEmptyReligionState, type CivsDataLike } from './game/culture-religion';
import {
  advanceEmpireFood, bindEmpireFoodRuntime, freshEmpireFoodState,
  buildEmpireFoodParams, getLastEmpireFoodTick, getEmpireFoodReserve, getEmpireFoodMaxCap, getEmpireFoodSplit, isArmyStarving,
  computeEmpireFoodNetDelta, computeEmpireFoodNetDeltaFromCityFoods, getCityFoodSplit, clearLastEmpireFoodTicks, computeEmpireFoodMaxCap,
  type EmpireFoodState,
} from './game/empire-food';
import { loadUpkeepParams, buildUnitFoodTable, militaryFoodConsumption, loadOwnerStorageParams } from './game/economy-upkeep';
import { computePowerContributionsCityEconomy, buildPowerSnapshots, type PowerOwnerSnapshot } from './game/power';
import { citySightRadius, toggleTileWorker, cityRangeForPopulation, yieldOfMapHex, resolveWorkedTiles, seedReczneFromAuto, collectWorkedHexKeysForOwner, hexKeysWithinRadius, reconcileAllWorkedTiles } from './game/okolica';
import { getCityResourceAccessForCity } from './game/resource-access';
import { isForeignReligionDominant, resolveOwnCultureShare, stolicaEasyBonusActive } from './game/society-inputs';
import {
  tickCityCultureReligion,
  conquestUnstableHappinessPenalty,
  conquestNoGarrisonLawPenalty,
  conquestRevoltRiskMultiplier,
} from './game/conquest-stability';
import {
  applyCultureReligionPressureToTarget,
  loadCulturePressureParams,
} from './game/culture-religion';
import { loadWealthParams, type RawWealthParamsJson } from './game/wealth';
import { applyArmyStarvationHpLoss } from './game/army-starvation';
import {
  freshClearingState,
  isImprovementTechUnlocked,
  tickHexClearing,
  getImprovementMeta,
  type HexClearingState,
} from './game/improvement-tech';
import { PendingImprovementsTurn, type PendingImprovementEntry } from './game/pending-improvements';
import {
  aiDiplomacyStance, relationTier, loadDiplomacyParams, getEffectiveDiplomacyParams,
  applyDiplomaticEvent, computePotegaNacji, computeRespekt, tickDiplomacy,
  ARCHETYPE_AGGRESSION, ARCHETYPE_TRADE, DEFAULT_POTEGA_WAGI,
  relationScore, sisterAllianceDiplomacyParams, sisterAllianceEligible,
  type Relation, type AIDiplomacyContext, type PotegaKomponenty, type TickCtx,
  type DiplomaticEvent, type DiplomacyParams,
} from './game/diplomacy';
import {
  resolveDiplomacyActionLock,
  type DiplomacyActionLockContext,
} from './game/diplomacy-locks';
import {
  appendDiploFactor,
  buildRelationBreakdown,
  type DiploFactorLog,
  type ContinuousFactorFlags,
} from './game/diplomacy-factors';
import {
  civCultureLabelForKey,
  diplomacyPersonalityTags,
  formatPowerRelationLine,
  resolveFormalDiplomaticStatus,
  sameCultureCircle,
  type FormalDiplomaticKind,
} from './game/diplomacy-display';
import {
  applyFogToPathPlan,
  executeMarchStep,
  planPathTurns,
  plannedMarchesFromSave,
  plannedMarchesToSave,
  type MarchFogContext,
  type PlannedMarchDest,
} from './game/planned-march';
import { TypCywilizacji, type Player } from './types/player';
import {
  saveToLocal, loadFromLocal, listSaves,
  setLastPlayedSlotId, checkSaveIntegrity, AUTOSAVE_SLOT_ID,
  type SaveGame,
} from './game/save';
import { buildDefaultSaveLabel, type SaveLabelKind } from './game/save-label';
import {
  diagInfo, diagWarn, diagError, installGlobalDiagHooks,
  toggleDiagPanel, copyDiagReport,
} from './game/diag-log';
import { configureCityPanel } from './ui/cityPanel';
import type { OrderState } from './ui/orderPanel';
import {
  configureSciencePicker,
  showSciencePicker,
  showSciencePickerDocked,
  hideSciencePicker,
  isSciencePickerOpen,
  refreshSciencePickerIfOpen,
  getScienceHubSnapshot,
  techToSlug,
  techNameFromSlug,
} from './ui/sciencePicker';
import {
  createScienceHubHud,
  hideScienceHubHud,
  isScienceHubHudOpen,
  refreshScienceHubIfOpen,
  showScienceHubHud,
  toggleScienceHubHud,
} from './ui/scienceHubHud';
import {
  configureTechTreeView,
  showTechTreeView,
  hideTechTreeView,
  isTechTreeViewOpen,
  refreshTechTreeViewIfOpen,
} from './ui/techTreeView';
import { buildingGateMet, improvementGateMet } from './game/research';
import {
  createWikiHubHud,
  hideWikiHubHud,
  isWikiHubHudOpen,
  showWikiHubHud,
  toggleWikiHubHud,
} from './ui/wikiHubHud';
import { showWonderCompletedNotice } from './ui/wonderCompletedNotice';
import { decideAITurn, chooseAIResearch, decideAIDiplomacy, loadDifficultyParams, RESUP_TIERS, shouldAIRushBuyUnit, loadAiRushParams, type AICommand } from './game/ai';
import type { AITurnOpts, RelacjaWejscie, DiplomacjaInputs, AIDiplomacyCommand } from './game/ai';
import { decideAiWonderBuild, loadAiWonderParams, type AiWonderCityCandidate, type AiWonderOption } from './game/ai';
import { checkVictory, techIdsInGameScope, allTechInScopeResearched, OSTATNIA_EPOKA_GRY_V1, powerShare } from './game/victory';
import type { VictoryPlayer, VictoryInput } from './game/victory';
import {
  showVictoryScreen,
  buildVictoryScreenData,
  formatVictoryTitle,
} from './ui/victoryScreen';
import {
  loadBarbParams, barbariansActive, spawnCamps, tickCamps, decideBarbarianMoves,
  scaleBarbParamsForLevel, pickBronzeBarbUnit,
  BARBARIAN_OWNER_ID, isBarbarian,
  loadSeaBarbParams, spawnSeaCamps, decideSeaPeoplesRaids, collectSeaRaidTargets,
  isCoastalCity,
} from './game/barbarians';
import type { BarbCamp, BarbUnit } from './game/barbarians';
// TEMAT #15 — embarkacja jednostek lądowych (gracz + AI + Ludy Morza).
import {
  EMBARK_TECH, EMBARK_DEFENSE_MULT, moveCostFnFor, applyEmbarkStateAfterMove,
} from './game/embarkation';
import { isWaterTerrain } from './units/setup';
import { autoManageCity, pickAutoBuildItem } from './game/auto-manage';
import { showMainMenu, hideMainMenu, isMainMenuOpen } from './ui/mainMenu';
import { showPerfTestPanel } from './ui/perfTestPanel';
import {
  configureGamePauseMenu, hideGamePauseMenu,
  toggleGamePauseMenu, isGamePauseMenuOpen, refreshGamePauseMenuLoadState,
} from './ui/gamePauseMenu';
import {
  showSaveGameDialog, showLoadGameDialog, hideSaveLoadDialog,
  isSaveLoadDialogOpen, saveContextLine, continueSaveSlotId,
} from './ui/saveLoadDialog';
import { showNewGameFlow, hideNewGameFlow, isNewGameFlowOpen, type NewGameParams, type NewGameAdvancedOptions } from './ui/newGameFlow';
import type { TempoGry } from './game/tech-tempo';
import type { GameDifficulty } from './game/difficulty-cost';
import { scaledResearchCost } from './game/difficulty-cost';
import {
  showDiplomacyPanel, hideDiplomacyPanel, isDiplomacyPanelOpen, updateDiplomacyPanel,
  type DiploRelation, type KnownWarBetweenCivs, type DiplomacyPanelConfig,
} from './ui/diplomacyPanel';
import {
  showDiplomacyAudience, hideDiplomacyAudience, updateDiplomacyAudience, isDiplomacyAudienceOpen,
  showWarConfirmModal, type AudienceAction, type NegotiationPayload,
} from './ui/diplomacyAudience';
import { showDiplomacyProposalBanner } from './ui/diplomacyProposalBanner';
import { proposalActionIdFromPayload, actionNeedsNegotiation } from './ui/diplomacyNegotiationModal';
import {
  evaluateProposal, applyAcceptedProposal, aiCommandToPendingProposal,
  evaluatePendingFromAI, resolvePlayerAcceptsAiPending, formatAiDiplomacyPlayerMessage,
  enrichAiCommandWithTreasury, clampDealTurns,
  type ProposalEvalContext, type ProposalPayload,
} from './game/diplomacy-proposals';
import {
  type ActiveDeal, hasTreaty, expireTreaties, treatiesBrokenByWar,
  removeTreatiesById, allianceObligationsForWarDeclaration, treatiesBrokenByRefusal,
  normalizeTreatyKind, hydrateActiveDeals, addTreaty, resolvePokojTrustTier,
} from './game/diplomacy-treaties';
import {
  activeDealsToPaymentDeals, tickDiplomacyPayments, applyOneShotGoldTransfer,
  tributeBreakPairsFromDeals, canAiProposeTradeAgreement,
  AI_RESOURCE_TRADE_DEFAULT_TURNS, AI_RESOURCE_TRADE_MAX_PAKIETY_PER_TURA,
} from './game/diplomacy-economy';
import { RodzajTraktatu } from './types/diplomacy';
import {
  applyPnTrustToRelation,
  diploPairKey,
  freshDiploPairMeta,
  relationTotal,
  resolveProposalPn,
  suspendZlozeGrantsForWar,
  deactivateZlozeGrantsForDeal,
  tickDobraWolaOnRelation,
  type BasketItem,
  type DiploPairMeta,
  type ZlozeGrant,
} from './game/diplomacy-pn-engine';
import {
  diplomacyPnZloto,
  diplomacyPnPraca,
  diplomacyProgDarRelacja,
  diplomacyResourceAccessCatalog,
  diplomacyHandelSurowcePakietWielkosc,
  diplomacyHandelSurowceCatalog,
  diplomacyPnSurowiecIlosc,
} from './game/diplomacy-value-catalog';
import {
  collectUnauthorizedBorderPairs,
  defaultIsMilitaryUnit,
} from './game/border-march-scan';
import {
  applyUnauthorizedBorderPenalties,
  dedupeBorderMarchPairs,
  loadBorderMarchParams,
  type BorderMarchPair,
} from './game/diplomacy-border-march';
import {
  createEmptyBasketTransferContext,
  grantSurowiecBooleanAccess,
  grantTechToOwner,
  transferSurowiecIlosc,
  type BasketTransferContext,
  type SurowiecBooleanGrant,
} from './game/diplomacy-basket-transfer';
import {
  spawnTransferredUnit,
} from './game/diplomacy-unit-transfer';
import {
  DEFAULT_CONVERTER_RECIPES,
  loadThroughput,
  type RawConverterParamsJson,
} from './game/converters';

/**
 * BattleScene.worldTerrain input derived from a world-map hex: baza terenu +
 * las/rzeka nakladki. Used everywhere a battle is launched from a map hex so
 * the tactical field echoes the world terrain (see battle-terrain.ts
 * presetForWorldTerrain). Loosely typed (not `Hex`) so callers can pass either
 * a real Hex or a partial lookup result without extra narrowing.
 */
function worldTerrainFromHex(
  hex: { terenBazowy?: unknown; nakladka?: unknown; rzeka?: { obecna?: boolean } } | undefined | null,
): WorldTerrainInput | undefined {
  if (!hex) return undefined;
  return {
    baza: String(hex.terenBazowy ?? ''),
    las: hex.nakladka === Nakladka.Las,
    rzeka: !!hex.rzeka?.obecna,
  };
}

// Bootstrap
// Wrapped in boot() so we can defer execution until DOMContentLoaded.
// Classic (non-module) scripts in <head> run before <body> is parsed --
// without this guard, document.body is null and appendChild throws.
async function boot(): Promise<void> {
  try {
    installGlobalDiagHooks();
    diagInfo('boot', 'start');
    const data = loadGameData();
    console.group('[The Game] Dane wczytane');
    console.log(`Jednostki: ${data.units.length}, Technologie: ${data.tech.length}`);
    console.groupEnd();

    // Apply data-driven terrain movement costs if the loader provides them.
    // The terrainMovement field is optional (added by a parallel loader edit);
    // if absent we rely on the built-in defaults in setup.ts.
    if ((data as any).terrainMovement) {
      const tm = (data as any).terrainMovement;
      configureTerrainMovement(
        tm.costs as Partial<Record<string, number>> ?? {},
        tm.forestExtra ?? 1,
      );
    }

    const SEED = Math.floor(Math.random() * 1e9);
    let _gameSeed = SEED;
    const unitSight = buildUnitSightResolver(data.units, DEFAULT_SIGHT);
    const unitFoodTbl = buildUnitFoodTable(data.units as unknown as Record<string, unknown>[]);

    // --- Menu integration: mutable game params set by New Game flow ---
    let _menuDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
    /** D-START posiłki v2 (Maciej 2026-07-21 przeróbka ZMIANA 1): pochodna TRUDNOŚCI gry
     *  (_menuDifficulty), NIE osobna opcja setupu -- easy→'low' · normal→'normal' ·
     *  hard→'strong', patrz applyMenuParams(). Domyślnie 'normal' (dzisiejsze stałe
     *  RESUP 1/2/1, zero regresji). Steruje AITurnOpts.citySupportLevel (ai.ts
     *  RESUP_TIERS) dla WSZYSTKICH AI defensywnych kopii typu oraz próg sojuszu sióstr
     *  (sisterAllianceDiplomacyParams, diplomacy.ts). */
    let _menuCitySupport: 'low' | 'normal' | 'strong' = 'normal';
    /** R-TRUDNOSC-1 (Maciej 2026-07-24): trudność miast-państw, OSOBNY suwak kreatora,
     *  niezależny od głównej trudności gry (_menuDifficulty). Steruje WYŁĄCZNIE zachowaniem
     *  AI miast-państw (kopii obronnych): startowe zaufanie (applyCityStateDifficultyTrust),
     *  próg sojuszu sióstr + posiłki (_menuCitySupport -- teraz pochodna TEGO pola, NIE
     *  _menuDifficulty) oraz DifficultyParams (bonusProdukcja/bonusWalka/agresjaMnoznik)
     *  dla ich decyzji AI (patrz aiDiffLevelForOwner niżej). Domyślnie = _menuDifficulty
     *  (fallback dla starych sejwów bez pola -- zero regresji), patrz applyMenuParams().
     *  Główna _menuDifficulty NADAL steruje ekonomią/kosztami/mapą/aiDiffLevel zwykłych AI. */
    let _menuCityStateDifficulty: 'easy' | 'normal' | 'hard' = 'normal';
    let _menuCivId: string = 'rzymianie'; // E1 default: Rzymianie
    let _menuMapSize: string = 'Standardowy'; // E1 default map size
    let _menuRivals: number = 6; // default rival count (skalowane w kreatorze)
    let _menuCivTypesCount: number = 7;
    let _menuCityStates: number = 6;
    let _menuTypSwiata: TypSwiata = 'kontynenty';
    let _menuEpochId: string = 'kamien';
    let _menuAdvanced: NewGameAdvancedOptions | undefined;
    let _menuWorldDensity: WorldGenerationPreset = { ...DEFAULT_WORLD_DENSITY };
    /** Ostatnie parametry kreatora — zapisywane w sejwie i używane przy wczytywaniu mapy. */
    let _lastNewGameParams: NewGameParams | null = null;
    /** Źródło sesji przy zapisie — odróżnia grę od playtestu w liście sejwów. */
    let _saveOrigin: 'normal' | 'playtest' = 'normal';
    let _currentRenderOptions: MapRenderOptions = { ...DEFAULT_MAP_RENDER_OPTIONS };

    /** B13: anim/hover przed refreshFog() @ init — inaczej TDZ „Cannot access 'Mt' before initialization”. */
    interface Waypoint { x: number; y: number; z: number; }
    interface AnimState {
      id: string;
      movingStackIds: string[];
      destQ: number;
      destR: number;
      fromQ: number;
      fromR: number;
      pathLen: number;
      cost: number;
      points: Waypoint[];
      seg: number;
      t: number;
    }
    let anim: AnimState | null = null;
    let isAnimating = false;
    let hoverKey: string | null = null;

    function mapQualityTierFromParams(params: NewGameParams): QualityTier {
      return params.mapQuality ?? qualityTierFromLabel(params.mapQualityLabel ?? 'Średnia');
    }

    function mapRenderOptionsFromParams(params: NewGameParams): MapRenderOptions {
      const bundle = bundledMapQualityPreset(mapQualityTierFromParams(params));
      return {
        style: GAME_MAP_RENDER_STYLE,
        renderQuality: bundle.renderQuality,
        mapDetailQuality: bundle.mapDetailQuality,
      };
    }

    function mapQualityTierFromSave(saved: SaveGame): QualityTier {
      if (saved.mapQuality) return saved.mapQuality;
      return saved.mapDetailQuality ?? saved.renderQuality ?? 'medium';
    }

    function applyRenderOptionsFromSave(saved: SaveGame): void {
      const bundle = bundledMapQualityPreset(mapQualityTierFromSave(saved));
      _currentRenderOptions = {
        style: GAME_MAP_RENDER_STYLE,
        renderQuality: bundle.renderQuality,
        mapDetailQuality: bundle.mapDetailQuality,
      };
    }

    function mapQualityTierFromQuery(defaultTier: QualityTier = 'medium'): QualityTier {
      if (typeof location === 'undefined') return defaultTier;
      const raw = new URLSearchParams(location.search).get('mapQuality');
      return raw ? qualityTierFromLabel(raw) : defaultTier;
    }

    document.body.style.margin   = '0';
    document.body.style.padding  = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';

    // Canvas 3D -- full-window, sized by JS (not CSS vw/vh) so renderer.setSize works
    const canvas = document.createElement('canvas');
    canvas.style.display  = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    document.body.appendChild(canvas);

    let map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, SEED);
    ensureDepositEraMeta(map.hexes);

    // Krótkie komunikaty (toast) — bez stałego dolnego paska skrótów (legacy hint).
    const hintToast = document.createElement('div');
    hintToast.id = 'civ-hint-toast';
    hintToast.style.cssText = [
      'position:fixed', 'bottom:24px', 'left:50%', 'transform:translateX(-50%)',
      'z-index:320', 'display:none', 'pointer-events:none',
      'max-width:min(560px,calc(100vw - 48px))', 'padding:8px 14px', 'border-radius:8px',
      'background:rgba(8,12,20,0.92)', 'color:#e8e0c8',
      'border:1px solid rgba(232,216,138,0.35)',
      'font:12px/1.45 Segoe UI,Tahoma,sans-serif', 'text-align:center',
      'box-shadow:0 6px 20px rgba(0,0,0,0.45)',
    ].join(';');
    document.body.appendChild(hintToast);

    let d1bHudActive = false;
    /** Aktualnie otwarta audiencja dyplomatyczna (ownerId AI), null = zamknięta. */
    let diplomacyAudienceOwnerId: number | null = null;

    // C3: buildScene jest asynchroniczny (budowa sceny porcjami/chunkami). Mapa startowa
    // (domyślna, mała) budowana bez overlaya — po prostu await, bez callbacku postępu.
    let { scene, camera, renderer, center, setFog, hideDecorAtHex, syncForestForUnits, setZoomLod, getZoomLodLevel, terrainPickMeshes, resolveTerrainPick, dispose: disposeScene } = await buildScene(map, canvas, _currentRenderOptions);

    function pickHexAt(clientX: number, clientY: number): { q: number; r: number } | null {
      return pixelToHex(clientX, clientY, canvas, camera, HEX_R, terrainPickMeshes, resolveTerrainPick);
    }

    function cameraControllerOpts(): CameraControllerOptions {
      const mapSpan = Math.max(map.szerokoscQ, map.wysokoscR) * HEX_R * 1.85;
      // Poprzednio maxDist=160; 2× oddalenie + skala mapy (duże mapy = cały świat w kadrze).
      const maxDist = Math.max(320, mapSpan * 1.2);
      return {
        minDist: 8 / 3,
        maxDist,
        keyPanSpeed: 0.3,
        blockPointerAt: (x, y) => {
          if (isPointOverCityPanelUi(x, y)) return true;
          if (foundCityMode || (buildModeOpen && activeImprovementKey)) return true;
          return false;
        },
        // C-EDGEPAN-Q1=B (Maciej 2026-07-25): edge-pan ZAWSZE aktywny na mapie świata
        // (konwencja 4X), niezależnie od zaznaczenia jednostki. isWorldMapUnitMode() nadal
        // wyklucza panele/nakładki (miasto, bitwa, oblężenie…), żeby mapa nie „uciekała"
        // gdy aktywny jest panel UI.
        edgePanActive: () => isWorldMapUnitMode(),
      };
    }

    let camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());

    // -----------------------------------------------------------------------
    // Units
    // -----------------------------------------------------------------------

    const startPlacements = computeStartPlacements(map, data);
    const units: RuntimeUnit[] = [];
    let unitRenderer = new UnitRenderer(scene, map);

    // -----------------------------------------------------------------------
    // Cities
    // -----------------------------------------------------------------------

    const cities: City[] = [];
    let cityRenderer = new CityRenderer(scene, map);
    let siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
    let wonderRenderer = new WonderRenderer(scene, map);
    const siegeTurnByCity = new Map<string, number>();
    const siegeBesiegerByCity = new Map<string, number>();
    const siegeAiStateByKey = new Map<string, SiegeAiState>();

    function siegeAiKey(ownerId: number, cityId: string): string {
      return ownerId + ':' + cityId;
    }
    const battlePowerPtsByOwner = new Map<number, number>();
    const ownerEraByOwner = new Map<number, number>();
    /** Epoka wizualna AI z momentu startu gry (initOwnerEra) — baza do awansów. */
    const ownerStartEraByOwner = new Map<number, number>();
    let objectivePowerByOwner = new Map<number, ObjectivePowerResult>();
    /** Follow-up „przenieś stolicę" (2026-07-21): wyznaczona stolica per ownerId.
     *  Brak wpisu = fallback na najstarsze miasto (patrz capitalCityIdForOwner). */
    const capitalCityIdByOwner = new Map<number, string>();
    /** Follow-up „Power-zdobycze" (2026-07-21): trwały bonus Power po eliminacji
     *  wroga, per zwycięzca (ownerId) — patrz eliminateOwner()/buildObjectivePowerForOwner. */
    const zdobyczePowerByOwner = new Map<number, number>();
    /** Audyt #13 (2026-07-22): heksy wiosek zlupionych w tej sesji (klucz "q,r") — mapa
     *  wraca do stanu z generatora (wioska.istnieje=true) po regeneracji z seeda przy
     *  load/nowej grze, wiec stan zlupienia trzeba trzymac osobno i reaplikowac po
     *  wczytaniu (patrz checkVillageRewardAt/buildSaveGameSnapshot/restoreGameFromSave). */
    const lootedVillageHexKeys = new Set<string>();

    const ERA_ID_TO_NUM: Record<string, number> = { kamien: 1, braz: 2, zelazo: 3 };

    function eraNumberFromEpochId(epochId: string): number {
      return ERA_ID_TO_NUM[epochId] ?? 1;
    }

    function epochIdFromEraNumber(era: number): string {
      if (era >= 3) return 'zelazo';
      if (era >= 2) return 'braz';
      return 'kamien';
    }

    /** Epoka startowa gry z kreatora — nie bieżąca epoka gracza po awansie tech. */
    function gameStartEra(): number {
      return eraNumberFromEpochId(_menuEpochId || 'kamien');
    }

    function empireEpochForOwner(ownerId: number): number {
      if (ownerId === 0) return player.era;
      return ownerEraByOwner.get(ownerId) ?? gameStartEra();
    }

    function initOwnerEra(ownerId: number, era = 1): void {
      if (ownerId === 0) return;
      const e = Math.max(1, Math.min(10, era));
      ownerEraByOwner.set(ownerId, e);
      ownerStartEraByOwner.set(ownerId, e);
    }

    function syncOwnerEraFromResearch(ownerId: number): boolean {
      if (ownerId === 0) return false;
      const startEra = ownerStartEraByOwner.get(ownerId) ?? ownerEraByOwner.get(ownerId) ?? gameStartEra();
      const done = aiResearchDone.get(ownerId) ?? new Set<string>();
      const prev = ownerEraByOwner.get(ownerId) ?? startEra;
      const next = computeOwnerEraFromResearch(startEra, done, data.tech as import('./data/loader').TechDef[]);
      ownerEraByOwner.set(ownerId, next);
      return prev !== next;
    }

    function refreshCityRenderIfEraChanged(changed: boolean): void {
      if (changed) cityRenderer.sync(cities, _cityRenderOpts());
    }

    /** Przelicz epokę wszystkich AI z badań (fair play — bez „Brązu” bez awansu). */
    function reconcileAllOwnerErasFromResearch(): void {
      let anyChanged = false;
      for (const oid of allAiOwnerIdsOnMap()) {
        ensureAiOwnerStartEra(oid);
        anyChanged = syncOwnerEraFromResearch(oid) || anyChanged;
      }
      refreshCityRenderIfEraChanged(anyChanged);
    }

    function allAiOwnerIdsOnMap(): number[] {
      const ids = new Set<number>();
      for (const c of cities) if (c.ownerId > 0) ids.add(c.ownerId);
      for (const u of units) if (u.ownerId > 0) ids.add(u.ownerId);
      for (const oid of aiOwnerCivMap.keys()) ids.add(oid);
      return [...ids].sort((a, b) => a - b);
    }

    /** Uzupełnia brakujące wpisy epoki startowej (legacy sejwy / nowi ownerzy z mapy). */
    function ensureAiOwnerStartEra(ownerId: number, startEra = gameStartEra()): void {
      if (ownerId === 0) return;
      if (!ownerStartEraByOwner.has(ownerId)) {
        ownerStartEraByOwner.set(ownerId, startEra);
      }
      if (!ownerEraByOwner.has(ownerId)) {
        ownerEraByOwner.set(ownerId, ownerStartEraByOwner.get(ownerId)!);
      }
    }

    /** Etykieta miasta-państwa z mapy (fallback gdy brak wpisu w ownerDisplayName). */
    function ownerCityLabelFromMap(ownerId: number): string | undefined {
      for (const c of cities) {
        if (c.ownerId === ownerId) return c.name;
      }
      return undefined;
    }

    /** Uzupełnia ownerDisplayName z nazw miast na mapie (save legacy / brak meta). */
    function syncOwnerDisplayNamesFromCities(): void {
      for (const c of cities) {
        if (c.ownerId <= 0) continue;
        const existing = ownerDisplayName.get(c.ownerId);
        if (!existing || isTechnicalOwnerLabel(existing)) {
          if (c.name && !isTechnicalOwnerLabel(c.name)) {
            ownerDisplayName.set(c.ownerId, c.name);
          }
        }
      }
    }

    /** Epoka + badania startowe jednego ownera AI (E1 / B12 — epoka startu gry z kreatora). */
    function setupAiOwnerEpoch(ownerId: number, epochId: string): void {
      initOwnerEra(ownerId, eraNumberFromEpochId(epochId));
      const priorTechs = grantTechEpokWczesniejszych(data.tech, epochId);
      aiResearchDone.set(ownerId, priorTechs.size > 0 ? new Set(priorTechs) : new Set());
      syncOwnerEraFromResearch(ownerId);
    }

    /** Etykiety + epoka: wszyscy AI startują w tej samej epoce co gracz (E1). */
    function initAllAiOwnersForNewGame(epochId: string): void {
      for (const oid of allAiOwnerIdsOnMap()) {
        setupAiOwnerEpoch(oid, epochId);
      }
      syncOwnerDisplayNamesFromCities();
    }

    function repairAiRosterFromMap(startEra: number): void {
      syncOwnerDisplayNamesFromCities();
      const missing = allAiOwnerIdsOnMap().filter(oid => !aiOwnerCivMap.has(oid));
      if (missing.length === 0) return;
      const civId = player.civType || _menuCivId || 'grecy';
      const allCivIds = civIdsAvailableAtGameEpoch(
        data.civs.cywilizacje as Parameters<typeof civIdsAvailableAtGameEpoch>[0],
        _menuEpochId,
      );
      const aiMap = assignAiCivTypes({
        allCivIds,
        playerCivId: civId,
        aiOwnerIds: missing,
        aktywneTypy: _menuCivTypesCount || aktywneTypyFromMapLabel(_menuMapSize),
        seed: (_gameSeed ^ missing.reduce((a, b) => a ^ b, 0)) >>> 0,
      });
      for (const [oid, civ] of aiMap) aiOwnerCivMap.set(oid, civ);
      syncOwnerDisplayNamesFromCities();
      const epochId = epochIdFromEraNumber(startEra);
      for (const oid of missing) setupAiOwnerEpoch(oid, epochId);
    }

    function sumRosterFieldMLocal(roster: RuntimeUnit[]): number {
      let sum = 0;
      for (const u of roster) sum += armyFieldPower(unitDefFor(u));
      return sum;
    }

    function countBuildingsForOwner(ownerId: number): number {
      let n = 0;
      for (const [cid, blt] of cityBuilt.entries()) {
        const c = cities.find(ct => ct.id === cid && ct.ownerId === ownerId);
        if (c) n += blt.length;
      }
      return n;
    }

    function countTechForOwner(ownerId: number): number {
      if (ownerId === 0) return player.zbadane.size;
      return aiResearchDone.get(ownerId)?.size ?? 0;
    }

    function countImprovementsForOwner(ownerId: number): number {
      const nodes = cityNodesForOwner(ownerId);
      if (nodes.length === 0) return 0;
      // D9: lokalna enumeracja (jak countTerritoryHexes) zamiast skanu całej mapy — wynik 1:1.
      const seen = new Set<string>();
      let n = 0;
      for (const node of nodes) {
        for (const key of hexKeysWithinRadius(node.q, node.r, cityTerritoryRadius(node) + 1, map)) {
          if (seen.has(key)) continue;
          const hex = map.hexes[key];
          if (!hex) continue;
          const [qs, rs] = key.split(',');
          if (!isInTerritory(Number(qs), Number(rs), nodes)) continue;
          seen.add(key);
          n += improvementKeysForHex(hex).length;
        }
      }
      return n;
    }

    function sumArmyMForOwner(ownerId: number): number {
      const opcje = loadPowerOpcje();
      let sum = 0;
      for (const u of units) {
        if (u.ownerId !== ownerId) continue;
        if (!opcje.liczyOsadnikWArmii && u.category === 'osadnik') continue;
        sum += armyFieldPower(unitDefFor(u));
      }
      return sum;
    }

    /** Stosunek siły wojskowej proposer/responder — suma M_pole (UNIT-POWER-M-v1). */
    function militaryRatioFromArmyM(proposerArmyM: number, responderArmyM: number): number {
      if (responderArmyM > 0) return proposerArmyM / responderArmyM;
      return proposerArmyM > 0 ? 2 : 1;
    }

    function buildObjectivePowerForOwner(ownerId: number): ObjectivePowerResult {
      const epoka = empireEpochForOwner(ownerId);
      const mpMults = civManpowerMultsForOwner(ownerId);
      const pobor = empirePoborTotals(cities, ownerId, epoka, mpMults.maxMult);
      const ownerCities = cities.filter(c => c.ownerId === ownerId);
      const cultureCities = ownerCities.map(c => ({
        id: c.id,
        ownerId: c.ownerId,
        q: c.q,
        r: c.r,
        population: c.population,
        kulturaSkumulowana: (c as { kultura?: number }).kultura ?? 0,
      }));
      const religionParams = loadReligionParams(data.societyParams, _menuDifficulty);
      const stateRel = ownerReligionForOwnerId(ownerId);
      const religionCities = ownerCities.map(c => ({
        ownerId: c.ownerId,
        religionState: resolvedCityReligion(c),
      }));
      return computeObjectivePower({
        ownerId,
        epoka,
        jednostki: sumArmyMForOwner(ownerId),
        bitwyPktSum: battlePowerPtsByOwner.get(ownerId) ?? 0,
        wygraneBitwy: 0,
        sumaLudkow: pobor.sumaLudkow,
        rekrutEkw: rekrutUnitEquivalents(pobor.rekruci, epoka, mpMults.maxMult),
        miasta: ownerCities.length,
        heksyTerytorium: countTerritoryHexes(cityNodesForOwner(ownerId)),
        budynki: countBuildingsForOwner(ownerId),
        techZbadane: countTechForOwner(ownerId),
        ulepszeniaTerenu: countImprovementsForOwner(ownerId),
        kulturaImperium: empireCultureTotal(cultureCities, ownerId),
        miastaJednoscReligii: countCitiesWithDominantStateReligion(
          religionCities, ownerId, stateRel, religionParams,
        ),
        // Follow-up „Power-zdobycze": trwały bonus po eliminacji wroga (rekurencyjnie
        // złożony — jeśli ownerId sam kiedyś eliminował kogoś, tamten snapshot już
        // jest tu wliczony, więc łańcuch eliminacji sumuje się poprawnie).
        zdobyczePower: zdobyczePowerByOwner.get(ownerId) ?? 0,
      });
    }

    // D10: model ZDARZENIOWY — przelicz ekonomię/moc TYLKO po realnej zmianie (trigger),
    // nie na każdym odświeżeniu HUD ani co turę. markCityStateDirty() wołane w punktach zmiany:
    // produkcja, pola robocze, podział handlu/pracy, podział żywności, budynek/rush, założenie
    // miasta oraz koniec tury (siatka bezpieczeństwa dla zmian systemowych: wzrost/tech/zdobycie).
    let empireEconDirty = true;
    let powerDirty = true;
    function markCityStateDirty(): void {
      empireEconDirty = true;
      powerDirty = true;
    }
    function refreshObjectivePowerCache(): void {
      if (!powerDirty && objectivePowerByOwner.size > 0) return;
      powerDirty = false;
      objectivePowerByOwner = new Map<number, ObjectivePowerResult>();
      for (const oid of allPowerOwnerIds()) {
        objectivePowerByOwner.set(oid, buildObjectivePowerForOwner(oid));
      }
    }

    function objectivePowerForOwner(ownerId: number): number {
      return objectivePowerByOwner.get(ownerId)?.power ?? buildObjectivePowerForOwner(ownerId).power;
    }

    /** Respekt % (Power gracza vs partner) — kanon objective v2. */
    function objectiveRespektPctToward(theirOwnerId: number): number {
      return computeRespekt(objectivePowerForOwner(0), objectivePowerForOwner(theirOwnerId));
    }
    function unitCountOnHex(q: number, r: number): number {
      let n = 0;
      for (const u of units) {
        if (u.q === q && u.r === r) n++;
      }
      return n;
    }

    /** Opcje renderowania miast — epoka i cywilizacja per właściciel. */
    let cityFogVisible: ((city: City, vis?: Set<string>) => boolean) | undefined;
    const _cityRenderOpts = (): CityRenderOptions => {
      // #27 perf: policz widoczność RAZ per wywołanie _cityRenderOpts (nie osobno dla
      // każdego obcego miasta w isVisible) — reużywane przez cache'ujący cityFogVisible.
      // Guard `cityFogVisible &&` celowo PRZED `fogOn`: _cityRenderOpts() jest wołane raz
      // przy starcie (linia ~1091) zanim `fogOn`/`cityFogVisible` (deklarowane niżej w tym
      // samym scope) w ogóle istnieją — short-circuit na cityFogVisible=undefined omija TDZ.
      const _visCache = (cityFogVisible && fogOn) ? currentVisible() : undefined;
      return {
        getEra:   (ownerId: number) => empireEpochForOwner(ownerId),
        getCiv:   (ownerId: number) => {
          const civId = ownerId === 0
            ? (player.civType as string || _menuCivId || 'grecja')
            : (aiOwnerCivMap.get(ownerId) ?? 'grecja');
          return ikonaIdToBronzeCiv(civId);
        },
        getLevel: (cityId: string) => {
          const c = cities.find(x => x.id === cityId);
          return c ? Math.max(1, Math.min(10, c.population ?? 1)) : 1;
        },
        getWalls: (cityId: string) => cities.find(c => c.id === cityId)?.maMur === true,
        getRevolt: (cityId: string) => {
          const st = cityOrderState.get(cityId);
          return st?.bunt === true || st?.revoltWarning === true;
        },
        getUnitCountOnHex: (q, r) => unitCountOnHex(q, r),
        getMapOutlineKind: (ownerId) => cityMapOutlineKindForOwner(ownerId),
        isVisible: (city) => {
          if (cityPanelViewCityId !== null) return city.id === cityPanelViewCityId;
          return cityFogVisible?.(city, _visCache) ?? true;
        },
        hideStatChips: isCityPanelOpen(),
        ownerColorFn: civColorFn,
      };
    };

    cityRenderer.sync(cities, _cityRenderOpts());

    /** Hex startowy gracza — widok mgly gdy brak jednostek (A-START-01). */
    let playerStartHex: { q: number; r: number } | null = {
      q: startPlacements.playerStart.q,
      r: startPlacements.playerStart.r,
    };
    /** Pozycje startowe AI (miasta AI — osobny batch CYWILIZACJE/SILNIK). */
    let aiStartHexes = startPlacements.aiStarts;
    /** Promień oświetlenia startu (z trudności menu). */
    let startRevealRadius = startRevealRadiusForDifficulty('normal');
    let playerEverOwnedCity = false;
    /** Tryb „Załóż miasto” w panelu budowy (A-START-01/05). */
    let foundCityMode = false;

    /** Nakładki surowcowe — synchronizowane z mgłą w refreshFog. */
    const resourceOverlays: Array<{ group: THREE.Group; hexKey: string }> = [];
    // Maciej 2026-07-09: WSZYSTKIE złoża (miedź/żelazo/glina/sól/ruda…) skompaktowane do JEDNEJ ścianki
    // (bok 1 = surowiec), spójnie z ulepszeniami — nie rozrzucone po heksie, środek wolny pod miasto.
    const DEPOSIT_EDGE_R = 0.62;    // dosunięcie do ścianki (bok 1, kierunek -Z = północ)
    const DEPOSIT_TARGET_SPAN = 0.55; // docelowa szerokość kompaktowego markera złoża (w jedn. HEX_R)
    /** Wyśrodkuj model złoża (bbox XZ), skompaktuj do wąskiego markera i dosuń do ścianki bok 1. */
    function compactDepositAtEdge(ov: THREE.Group, x: number, z: number, baseY: number, rotY: number): void {
      const bb = new THREE.Box3().setFromObject(ov);
      if (!bb.isEmpty()) {
        const cx = (bb.min.x + bb.max.x) / 2;
        const cz = (bb.min.z + bb.max.z) / 2;
        const maxSpan = Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) || 1;
        for (const ch of ov.children) {
          const geo = (ch as THREE.Mesh).geometry;
          if (geo) geo.translate(-cx, 0, -cz); // wyśrodkuj w XZ (spód Y zostaje na terenie)
        }
        ov.scale.setScalar(Math.min(0.6, (DEPOSIT_TARGET_SPAN * HEX_R) / maxSpan));
      }
      ov.position.set(x, baseY + 0.01, z - DEPOSIT_EDGE_R * HEX_R);
      ov.rotation.y = rotY;
    }
    /** Epoka gracza dla widoczności złóż metali (E-P0); aktualizowana przy starcie / awansie. */
    let overlayDepositEra = 1;

    function isLivestockDepositNakladka(n: Nakladka | undefined): boolean {
      return n === Nakladka.ZlozeBydla || n === Nakladka.ZlozeOwiec;
    }

    /** Warstwy gracza + implicit hodowla ze złoża zwierzęcego (render). */
    type PlacedLayers = string[];

    function mergedImprovementLayers(hexKey: string): string[] {
      const hex = map.hexes[hexKey];
      if (!hex) return [];
      const keys = new Set<string>(improvementKeysForHex(hex));
      const depositLayer = foodLayerFromAnimalDeposit(hex.nakladka);
      if (depositLayer) keys.add(depositLayer);
      const placed = placedImprovements.get(hexKey);
      if (placed) {
        for (const k of placed) keys.add(k);
      }
      return [...keys];
    }

    function buildImprovementVisual(layers: readonly string[]): THREE.Group {
      if (layers.length === 0) return new THREE.Group();
      // Maciej 2026-07-09: układ sektorowy — każde ulepszenie w swoim boku heksa, mocno mniejsze,
      // przy ściance, środek wolny pod miasto; droga = obwódka.
      return buildImprovementSectored(layers, 0xffd54a, undefined, HEX_R);
    }

    function clearResourceOverlays(): void {
      for (const { group } of resourceOverlays) scene.remove(group);
      resourceOverlays.length = 0;
    }

    /** D4: odśwież nakładkę surowca TYLKO na jednym heksie (zamiast pełnomapowego rebuildResourceOverlays).
     *  Ta sama logika per-hex co rebuild, ale O(1) — używane przy zakładaniu miasta. */
    function syncResourceOverlayAtHex(hexKey: string): void {
      for (let i = resourceOverlays.length - 1; i >= 0; i--) {
        if (resourceOverlays[i]!.hexKey === hexKey) {
          scene.remove(resourceOverlays[i]!.group);
          resourceOverlays.splice(i, 1);
        }
      }
      const hex = map.hexes[hexKey];
      if (!hex) return;
      const hexZ = hex as typeof hex & { zloze?: string };
      if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) return;
      const hasNakladka = hex.nakladka && hex.nakladka !== Nakladka.Brak && hex.nakladka !== Nakladka.Las;
      const zlozeShown = visibleZloze(hexZ, overlayDepositEra);
      if (!hasNakladka && !zlozeShown) return;
      if (isLivestockDepositNakladka(hex.nakladka)) return;
      if (improvementMeshes.has(hexKey)) return;
      try {
        const ov = buildStyledResourceOverlay(hex.nakladka, GAME_MAP_RENDER_STYLE, zlozeShown);
        if (!ov) return;
        collapseToMergedMesh(ov); // FPS lewar 1: dziesiątki boxów złoża → 1 mesh
        const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
        const baseY = TERRAIN_SURFACE_Y[hex.terenBazowy] ?? 0.45;
        compactDepositAtEdge(ov, x, z, baseY, hex.coords.q * 1.3 + hex.coords.r * 0.7);
        ov.matrixAutoUpdate = false; ov.updateMatrix(); // FPS lewar 3: statyczne — bez per-frame update macierzy
        scene.add(ov);
        resourceOverlays.push({ group: ov, hexKey });
      } catch (err) {
        console.warn('[main] buildStyledResourceOverlay error', hex.nakladka, err);
      }
    }

    function rebuildResourceOverlays(): number {
      clearResourceOverlays();
      let count = 0;
      for (const hex of Object.values(map.hexes)) {
        const hexZ = hex as typeof hex & { zloze?: string };
        if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) continue;
        const hasNakladka = hex.nakladka && hex.nakladka !== Nakladka.Brak && hex.nakladka !== Nakladka.Las;
        const zlozeShown = visibleZloze(hexZ, overlayDepositEra);
        if (!hasNakladka && !zlozeShown) continue;
        const hexKey = keyOf(hex.coords.q, hex.coords.r);
        if (isLivestockDepositNakladka(hex.nakladka)) continue;
        if (improvementMeshes.has(hexKey)) continue;
        try {
          const ov = buildStyledResourceOverlay(hex.nakladka, GAME_MAP_RENDER_STYLE, zlozeShown);
          if (!ov) continue;
          collapseToMergedMesh(ov); // FPS lewar 1
          const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
          const baseY = TERRAIN_SURFACE_Y[hex.terenBazowy] ?? 0.45;
          compactDepositAtEdge(ov, x, z, baseY, hex.coords.q * 1.3 + hex.coords.r * 0.7);
          ov.matrixAutoUpdate = false; ov.updateMatrix(); // FPS lewar 3
          const hexKey = keyOf(hex.coords.q, hex.coords.r);
          scene.add(ov);
          resourceOverlays.push({ group: ov, hexKey });
          count++;
        } catch (err) {
          console.warn('[main] buildStyledResourceOverlay error', hex.nakladka, err);
        }
      }
      return count;
    }

    function syncResourceOverlayFog(vis: Set<string>, exploredKeys: Set<string>): void {
      for (const { group, hexKey } of resourceOverlays) {
        const hidden = !vis.has(hexKey) && !exploredKeys.has(hexKey);
        group.visible = !hidden;
        if (hidden) continue;
        const bri = fogBrightnessForHex(hexKey, vis, exploredKeys, true);
        applyFogDimToObject3D(group, bri);
      }
    }

    /** Meshe ulepszeń / hodowli złoże (spawnImprovementMesh) — ta sama mgła co resourceOverlays. */
    function syncImprovementMeshFog(vis: Set<string>, exploredKeys: Set<string>): void {
      for (const [hexKey, group] of improvementMeshes) {
        const hidden = !vis.has(hexKey) && !exploredKeys.has(hexKey);
        group.visible = !hidden;
        if (hidden) continue;
        const bri = fogBrightnessForHex(hexKey, vis, exploredKeys, true);
        applyFogDimToObject3D(group, bri);
      }
      for (const [hexKey, group] of clearingMeshes) {
        const hidden = !vis.has(hexKey) && !exploredKeys.has(hexKey);
        group.visible = !hidden;
        if (hidden) continue;
        const bri = fogBrightnessForHex(hexKey, vis, exploredKeys, true);
        applyFogDimToObject3D(group, bri);
      }
    }

    // ==== GRAFIKA-TEREN-2: wioski neutralne + obozy barbarzyńców (render — wcześniej ZERO tri) ====
    // Reconcile keyed na `parent === scene`: samo-naprawia się przy przebudowie sceny (nowa mapa),
    // więc nie trzeba dotykać ścieżek reset/load. Wioska = mesh per heks (hex.wioska.istnieje, bez
    // miasta); obóz = mesh per camp.id. Oba: środek heksa, skala 1.0, collapse (FPS lewar 1), mgła
    // jak improvementMeshes. Kolor barbarzyńców = 0xff4444 (default builder — decyzja B właściciela).
    const villageMeshes = new Map<string, THREE.Group>();
    const campMeshes = new Map<string, THREE.Group>();

    /** Audyt #57: cache heksów z wioskami — syncVillageMeshes jest wołane z refreshFog
     *  (34 miejsca w tym pliku) i wcześniej skanowało WSZYSTKIE heksy mapy za każdym razem.
     *  Wioski nie przybywają w trakcie gry (placeVillages działa raz przy generacji mapy),
     *  tylko znikają (checkVillageRewardAt usuwa z cache poniżej), więc wystarczy zeskanować
     *  raz i trzymać zbiór. Pełna inwalidacja, gdy zmieni się referencja `map` (nowa gra/load/
     *  regeneracja z seeda — patrz przypisania `map = ...` w tym pliku).
     */
    let villageHexKeyCache: Set<string> | null = null;
    let villageHexKeyCacheMap: typeof map | null = null;

    function villageHexKeysCached(): Set<string> {
      if (villageHexKeyCache && villageHexKeyCacheMap === map) return villageHexKeyCache;
      const keys = new Set<string>();
      for (const hexKey in map.hexes) {
        if (map.hexes[hexKey]?.wioska?.istnieje) keys.add(hexKey);
      }
      villageHexKeyCache = keys;
      villageHexKeyCacheMap = map;
      return keys;
    }

    function syncVillageMeshes(): void {
      const wanted = new Set<string>();
      let changed = false;
      // Audyt #57: iteracja po cache zamiast po wszystkich heksach mapy (~N -> ~kilka).
      for (const hexKey of villageHexKeysCached()) {
        const hex = map.hexes[hexKey];
        if (!hex?.wioska?.istnieje) continue;
        const q = hex.coords.q, r = hex.coords.r;
        if (cities.some(c => c.q === q && c.r === r)) continue; // miasto zastępuje wioskę
        wanted.add(hexKey);
        const existing = villageMeshes.get(hexKey);
        if (existing && existing.parent === scene) continue;
        if (existing) existing.parent?.remove(existing); // stara scena — odbuduj w bieżącej
        const g = buildWioska();
        collapseToMergedMesh(g); // FPS lewar 1: ~20 boxów → 1 mesh
        const wp = axialToWorld(q, r, HEX_R);
        g.position.set(wp.x, unitRenderer.topYAt(q, r), wp.z);
        g.rotation.y = WIOSKA_OBOZ_LAYOUT.wioska.budynek.rotY;
        g.matrixAutoUpdate = false; g.updateMatrix(); // FPS lewar 3
        scene.add(g);
        villageMeshes.set(hexKey, g);
        changed = true;
      }
      for (const [hexKey, g] of villageMeshes) {
        if (wanted.has(hexKey)) continue;
        g.parent?.remove(g);
        villageMeshes.delete(hexKey);
        changed = true;
      }
      if (changed) renderer.shadowMap.needsUpdate = true;
    }

    function syncCampMeshes(): void {
      const wanted = new Set<string>();
      let changed = false;
      for (const camp of barbCamps) {
        wanted.add(camp.id);
        const existing = campMeshes.get(camp.id);
        if (existing && existing.parent === scene) continue;
        if (existing) existing.parent?.remove(existing);
        const g = buildObozBarbarzyncow(); // default BARB_FACTION_COLOR = 0xff4444 (decyzja B)
        collapseToMergedMesh(g);
        const wp = axialToWorld(camp.q, camp.r, HEX_R);
        g.position.set(wp.x, unitRenderer.topYAt(camp.q, camp.r), wp.z);
        g.rotation.y = WIOSKA_OBOZ_LAYOUT.obozBarbarzyncow.budynek.rotY;
        g.matrixAutoUpdate = false; g.updateMatrix();
        scene.add(g);
        campMeshes.set(camp.id, g);
        changed = true;
      }
      for (const [id, g] of campMeshes) {
        if (wanted.has(id)) continue;
        g.parent?.remove(g);
        campMeshes.delete(id);
        changed = true;
      }
      if (changed) renderer.shadowMap.needsUpdate = true;
    }

    /** Mgła wojenna dla wiosek/obozów — jak syncImprovementMeshFog. */
    function syncSettlementMeshFog(vis: Set<string>, exploredKeys: Set<string>): void {
      const applyOne = (hexKey: string, group: THREE.Group): void => {
        const hidden = !vis.has(hexKey) && !exploredKeys.has(hexKey);
        group.visible = !hidden;
        if (hidden) return;
        const bri = fogBrightnessForHex(hexKey, vis, exploredKeys, true);
        applyFogDimToObject3D(group, bri);
      };
      for (const [hexKey, group] of villageMeshes) applyOne(hexKey, group);
      for (const camp of barbCamps) {
        const g = campMeshes.get(camp.id);
        if (g) applyOne(keyOf(camp.q, camp.r), g);
      }
    }

    // Resource overlays + hodowla złoże — init po placedImprovements (poniżej).

    // --- Stan pomiędzy turami: produkcja / built / religia per miasto ---
    const cityProd  = new Map<string, CityProduction>();
    const cityBuilt = new Map<string, string[]>();
    const cityRelig = new Map<string, ReligionState>();
    /** Handel E3: aktywne trasy gracz<->obca cywilizacja (odswiezane co ture). */
    let tradeRoutes: TradeRoute[] = [];
    /** Handel E3: liczba aktywnych tras per miasto (odswiezane razem z tradeRoutes) — wejście
     *  do UI (panel miasta E7) i do mnożnika Handlu (getCityBuildingFlags, cityYieldPerTurn). */
    let tradeRouteCountByCity: Map<string, number> = new Map();
    /**
     * Temat #4 (Handel E3b): granty dostępu do surowca civ-wide (braz/zelazo/kon)
     * "z trasy handlowej" — CELOWO NIEZAPISYWANE w save (patrz trade-routes.ts,
     * computeTradeRouteResourceGrants): czysta pochodna `tradeRoutes` + własnego
     * dostępu obu stron, przeliczana funkcją recomputeTradeRouteResourceGrants()
     * zaraz po każdym odświeżeniu `tradeRoutes` (koniec tury / wczytanie zapisu).
     * Dzięki temu cofnięcie trasy (wojna/zerwanie/utrata połączenia) automatycznie
     * cofa grant przy najbliższym przeliczeniu — bez osobnego mechanizmu dezaktywacji.
     */
    let tradeRouteResourceGrants: TradeRouteResourceGrant[] = [];
    const lastReligionSpreadByCity = new Map<string, number>();
    let _lastReligionSpreadTotal = 0;

    /** Union budynków imperium (dowolne miasto ownerId) — bramka badań T-TECH-7. */
    function empireBuiltIdsForOwner(ownerId: number): Set<string> {
      const ids = new Set<string>();
      for (const [cid, blt] of cityBuilt.entries()) {
        const c = cities.find(ct => ct.id === cid && ct.ownerId === ownerId);
        if (!c) continue;
        for (const bid of blt) ids.add(bid);
      }
      return ids;
    }

    /** Union aktywnych etykiet surowców imperium — bramki epok B-SUROW-BUD. */
    function empireActiveResourceLabelsForOwner(ownerId: number): string[] {
      const labels = new Set<string>();
      const builtEmpire = empireBuiltIdsForOwner(ownerId);
      for (const c of cities) {
        if (c.ownerId !== ownerId) continue;
        const builtIds = cityBuilt.get(c.id) ?? [];
        const access = getCityResourceAccessForCity(
          {
            id: c.id,
            q: c.q,
            r: c.r,
            population: c.population,
            kulturaSkumulowana: (c as { kultura?: number }).kultura ?? 0,
          },
          map,
          placedImprovementsForOwner(ownerId),
          empireEpochForOwner(ownerId),
          { builtIds, ownerId: String(ownerId) },
        );
        for (const l of access.active) labels.add(l);
      }
      if (builtEmpire.has('cegielnia')) labels.add('Cegła');
      if (builtEmpire.has('garncarnia')) labels.add('Ceramika');
      return [...labels];
    }

    /**
     * Zaległość #3 (Makieta DYPLOMACJA v1.1, 2026-07-23) — civ-wide Żelazo NIE jest w
     * empireActiveResourceLabelsForOwner powyżej (resource-access.ts nie liczy tej bramki —
     * ta funkcja służy gdzie indziej T-TECH-7/B-SUROW-BUD, celowo nietknięta). Dopisujemy
     * Żelazo TU, osobno, tylko dla indeksu dóbr dyplomacji.
     */
    function diplomacyActiveResourceLabelsForOwner(ownerId: number): string[] {
      const labels = new Set(empireActiveResourceLabelsForOwner(ownerId));
      if (!labels.has('Żelazo')) {
        const ownImprovements = placedImprovementsForOwner(ownerId);
        const hasKopalniaZelazo = empireHasKopalniaNaZlozuZelaza(ownImprovements, map);
        if (hasKopalniaZelazo) {
          for (const c of cities) {
            if (c.ownerId !== ownerId) continue;
            if (hasZelazoAccess(hasKopalniaZelazo, cityBuilt.get(c.id) ?? [])) {
              labels.add('Żelazo');
              break;
            }
          }
        }
      }
      return [...labels];
    }

    /** Suma City.surowce (magazyn per-miasto, cities.ts) po wszystkich miastach ownera. */
    function citySurowceSumForOwner(ownerId: number): Record<string, number> {
      return sumCitySurowce(cities.filter(c => c.ownerId === ownerId).map(c => c.surowce));
    }

    /**
     * Zaległość #3 — indeks dóbr handlowych FAKTYCZNIE posiadanych przez ownera (różny per
     * owner). Naprawia dawny tradeGoodsForOwner: ten sam globalny katalog surowców po OBU
     * stronach negocjacji niezależnie od faktycznego posiadania (patrz komentarz przy
     * starym tradeGoodsForOwner poniżej — usunięty razem z ad-hoc listą).
     */
    function tradableGoodsIndexForOwner(ownerId: number): TradeGoodEntry[] {
      return tradableGoodsIndexForOwnerPure({
        activeResourceLabels: diplomacyActiveResourceLabelsForOwner(ownerId),
        citySurowceSum: citySurowceSumForOwner(ownerId),
      });
    }

    /**
     * Zaległość #3 — podzbiór indeksu WYCENIONY w katalogu PN (surowiec_boolean, patrz
     * diplomacyResourceAccessCatalog) — jedyny gotowy do koszyka negocjacji (Brąz/Żelazo
     * nie mają dziś ceny PN — widoczne tylko w kartach „Dobra handlowe", patrz tradeGoodsForOwner).
     */
    function priceableTradableGoodOptions(ownerId: number): Array<{ id: string; label: string }> {
      const priceable = diplomacyResourceAccessCatalog();
      return tradableGoodsIndexForOwner(ownerId)
        .filter(g => Object.prototype.hasOwnProperty.call(priceable, g.key))
        .map(g => ({ id: g.key, label: g.ilosc != null ? g.label + ' ×' + g.ilosc : g.label }));
    }

    /**
     * C-DYP-SUROWCE-Q1=B (2026-07-23): surowce ILOŚCIOWE (magazyn miast — drewno/kamień/
     * glina/cegła/ceramika/ruda) FAKTYCZNIE posiadane przez ownera, wycenione prostą
     * ceną jednostkową (econ-params.json „handel_surowce"). Strona może zaoferować
     * max tyle pakietów, ile ma pełnych — floor(zapas/pakiet); zero pełnych pakietów
     * → pozycja pominięta (nie ma czym handlować).
     */
    function quantityTradableGoodOptions(ownerId: number): Array<{ id: string; label: string; maxPakiety: number }> {
      const priced = diplomacyHandelSurowceCatalog();
      const pakiet = diplomacyHandelSurowcePakietWielkosc();
      return tradableGoodsIndexForOwner(ownerId)
        .filter(g => Object.prototype.hasOwnProperty.call(priced, g.key))
        .map(g => {
          const maxPakiety = Math.floor((g.ilosc ?? 0) / pakiet);
          return {
            id: g.key,
            label: g.label + ' ×' + pakiet + ' (pakiet)' + (maxPakiety > 0 ? ' — dost. ' + maxPakiety : ''),
            maxPakiety,
          };
        })
        .filter(g => g.maxPakiety > 0);
    }

    /**
     * Tempo BRUTTO produkcji surowców logistycznych (TYP 1 — terytorium) imperium tej
     * tury: suma stawek `surowiec_ilosc_tura` z KAŻDEGO zbudowanego ulepszenia właściciela
     * (SUROW-TERYT-01) — dokładnie ten sam model co computeTerritoryResourceYieldByCity
     * w turn-economy.ts, tylko zsumowany po wszystkich miastach ownera zamiast per-miasto.
     */
    function empireTerritoryResourceRatesForOwner(ownerId: number): Partial<Record<string, number>> {
      const territoryNodes = buildAllTerritoryNodes();
      const byCity = computeTerritoryResourceYieldByCity(cities, map, territoryNodes);
      const out: Record<string, number> = {};
      for (const c of cities) {
        if (c.ownerId !== ownerId) continue;
        const rec = byCity.get(c.id);
        if (!rec) continue;
        for (const [key, amount] of Object.entries(rec)) {
          out[key] = (out[key] ?? 0) + (amount ?? 0);
        }
      }
      return out;
    }

    /**
     * Tempo BRUTTO produkcji surowców przetworzonych (TYP 2 — konwertery) imperium tej
     * tury: dla każdego budynku-konwertera FAKTYCZNIE zbudowanego w mieście ownera,
     * dolicz jego przepustowość nominalna (econ-params.json, jak w advanceCityEconomy) ×
     * outputAmount. BRUTTO = nominalna zdolność produkcyjna, NIE pomniejszona o brak
     * wejścia (drewna/gliny/rudy) tej konkretnej tury — wystarczające do "ile się
     * produkuje" w liczniku (Maciej: netto zbyt kosztowne, brutto OK).
     */
    function empireConverterResourceRatesForOwner(ownerId: number): Partial<Record<string, number>> {
      const rawForConverters = data.econParams as unknown as RawConverterParamsJson;
      const out: Record<string, number> = {};
      for (const recipe of DEFAULT_CONVERTER_RECIPES) {
        const throughput = loadThroughput(
          rawForConverters, recipe.throughputParamKey, _menuDifficulty, recipe.throughputFallback,
        );
        for (const c of cities) {
          if (c.ownerId !== ownerId) continue;
          const builtIds = cityBuilt.get(c.id) ?? [];
          if (!builtIds.includes(recipe.id)) continue;
          out[recipe.output] = (out[recipe.output] ?? 0) + throughput * recipe.outputAmount;
        }
      }
      return out;
    }

    /**
     * Licznik surowców imperium (BRAZ-ILOSC=B, decyzja Macieja 2026-07-23) — zbiorczy
     * WOLUMEN wszystkich jednostek surowców zgromadzonych w magazynach miast ownera
     * (suma City.surowce). Cel: zobaczyć, ile surowców realnie leży w magazynach, zanim
     * dostroimy stawki produkcji. Reguły składowania (decyzja Macieja):
     *   • Żywność — pominięta (osobny system spichlerza).
     *   • Sól / Koń / Ceramika — czysty DOSTĘP (nie kumulują sztuk, Maciej 2026-07-23:
     *     Garncarnia = dostęp, nie stock) → stock zawsze 0, kolumna „dostęp".
     *   • Bydło / Owce / Lama — NIE są surowcami (pominięte całkowicie).
     *   • Reszta (drewno/kamień/glina/ruda/ruda żelaza/cegła/brąz/żelazo/stal) — zliczana.
     *   • Paliwo USUNIĘTE calkowicie (decyzja Macieja 2026-07-23) — konwertery biorą DREWNO 1:1.
     * Tempo/turę (ratePerTurn) — BRUTTO produkcji tej tury (SUROW-TERYT-01 dla teren,
     * przepustowość nominalna konwerterów dla miasto); 0 dla wierszy czystego dostępu.
     */
    function buildEmpireResourceRows(ownerId: number): EmpireResourceRow[] {
      const warehouse = citySurowceSumForOwner(ownerId);
      const accessLabels = new Set(diplomacyActiveResourceLabelsForOwner(ownerId));
      const territoryRates = empireTerritoryResourceRatesForOwner(ownerId);
      const converterRates = empireConverterResourceRatesForOwner(ownerId);
      // SUROW-CIV-01 (Maciej 2026-07-24): cap PAŃSTWA (civ-wide) — 100 + 100×Magazyny
      // ownera; `warehouse` powyżej JEST już sumą civ-wide (citySurowceSumForOwner),
      // wystarczy dołożyć cap, żeby licznik pokazał „stock / cap" (np. „140 / 200").
      const empireCap = ownerResourceCap(cities, cityBuilt, ownerId, data, _menuDifficulty);
      // SUROW-UI-A1: parametry bazy/bonusu wprost z econ-params.json — UI dostaje realne
      // wartości (dziś 500 + 100×Magazyny) zamiast zaszywać starą "100" na sztywno.
      const storageParams = loadOwnerStorageParams(
        data.econParams as unknown as Parameters<typeof loadOwnerStorageParams>[0],
        _menuDifficulty,
      );
      type Cat = { id: string; label: string; icon: string; typ: EmpireResourceRow['typ']; access?: boolean };
      const CATALOG: Cat[] = [
        { id: 'drewno',      label: 'Drewno',      icon: '🪵', typ: 'surowy' },
        { id: 'kamien',      label: 'Kamień',      icon: '🪨', typ: 'surowy' },
        { id: 'glina',       label: 'Glina',       icon: '🟫', typ: 'surowy' },
        { id: 'ruda',        label: 'Ruda miedzi', icon: '🔶', typ: 'surowy' },
        { id: 'ruda_zelaza', label: 'Ruda żelaza', icon: '⛏️', typ: 'surowy' },
        { id: 'cegla',       label: 'Cegła',       icon: '🧱', typ: 'przetworzony' },
        { id: 'ceramika',    label: 'Ceramika',    icon: '🏺', typ: 'przetworzony', access: true },
        { id: 'braz',        label: 'Brąz',        icon: '🥉', typ: 'przetworzony' },
        { id: 'zelazo',      label: 'Żelazo',      icon: '⚙️', typ: 'przetworzony' },
        { id: 'stal',        label: 'Stal',        icon: '🔩', typ: 'przetworzony' },
        { id: 'sol',         label: 'Sól',         icon: '🧂', typ: 'surowy',  access: true },
        { id: 'kon',         label: 'Koń',         icon: '🐎', typ: 'hodowla', access: true },
      ];
      const rows: EmpireResourceRow[] = [];
      for (const c of CATALOG) {
        // Wiersze czystego dostępu (Sól/Koń/Ceramika) NIE pokazują stocku — nawet gdy
        // stary zapis gry ma jeszcze niezerowy City.surowce.ceramika (migracja, brak
        // konsumenta) świadomie go tu ukrywamy (Maciej 2026-07-23: "stock 0/—").
        const stock = c.access ? 0 : Math.floor(warehouse[c.id] ?? 0);
        const dostep = accessLabels.has(c.label) || stock > 0;
        // C-SURUI=A (Maciej 2026-07-24): surowce MAGAZYNOWANE pokazuj ZAWSZE (nawet 0) — panel
        // imperium to dedykowany magazyn państwa, ma być widoczny od tury 1 (koniec placeholdera
        // „mockupów nie ma w grze"). Pomiń tylko wiersze czystego DOSTĘPU (Sól/Koń/Ceramika),
        // których owner jeszcze nie odblokował.
        if (c.access && !dostep) continue;
        const ratePerTurn = c.access ? 0 : Math.floor((territoryRates[c.id] ?? 0) + (converterRates[c.id] ?? 0));
        const cap = c.access ? undefined : empireCap;
        const capBase = c.access ? undefined : storageParams.bazaSurowcePanstwo;
        const capBonusPerMagazyn = c.access ? undefined : storageParams.bonusSurowceNaBudynek;
        rows.push({
          id: c.id, label: c.label, icon: c.icon, stock, ratePerTurn, typ: c.typ, dostep,
          cap, capBase, capBonusPerMagazyn,
        });
      }
      return rows;
    }

    /**
     * Union kluczy ulepszeń terenu imperium — bramka „wymagane ulepszenie" (np. Żegluga→Tartak).
     * placedImprovements nie jest per-owner (jak w braz-access.empireHasKopalniaMiedzi);
     * dla bramki badań (owner 0 = gracz) zbieramy wszystkie klucze ulepszeń na mapie.
     */
    function empireImprovementKeysForOwner(_ownerId: number): Set<string> {
      const keys = new Set<string>();
      for (const layers of placedImprovements.values()) {
        for (const k of layers) keys.add(k);
      }
      return keys;
    }

    function researchGateForOwner(ownerId: number): EmpireResearchGate {
      return {
        empireBuiltIds: empireBuiltIdsForOwner(ownerId),
        buildings: data.buildings,
        empireImprovementKeys: empireImprovementKeysForOwner(ownerId),
      };
    }

    /** CUDA-G1: globalnie ukończone cuda świata (id z wonders.json). */
    const WONDER_PROD_PREFIX = '__wonder__:';
    let completedWorldWonders: string[] = [];
    /** CUDA mapa: pozycje ukończonych cudów na heksach (nie w mieście). */
    let placedWorldWonders: PlacedWonder[] = [];
    const wonderTechEpochMap = buildTechEpochMap(data.tech as unknown as readonly { Technologia?: string; Epoka?: string | undefined }[]);
    let wondersPickerEl: HTMLDivElement | null = null;

    function civTypeForOwner(ownerId: number): string {
      if (ownerId === 0) return String(player.civType || _menuCivId || 'grecy');
      return aiOwnerCivMap.get(ownerId) ?? 'grecy';
    }

    function civColorFn(ownerId: number): number {
      return civColorForOwner(data.civs, ownerId, civTypeForOwner);
    }

    function civKolorHexFn(ownerId: number): string {
      return civColorHex(data.civs, civTypeForOwner(ownerId));
    }

    function civRowForType(civType: string): CivEntryEpochRow {
      const row = data.civs.cywilizacje.find(
        (c: CivEntryEpochRow) => c.ikonaId === civType,
      );
      return row ?? { ikonaId: civType, epokaWejscia: 'kamien' };
    }

    function unlockedTechSetForOwner(ownerId: number): Set<string> {
      if (ownerId === 0) return player.zbadane;
      return aiResearchDone.get(ownerId) ?? new Set<string>();
    }

    function parseWonderProdId(id: string): string | null {
      return id.startsWith(WONDER_PROD_PREFIX) ? id.slice(WONDER_PROD_PREFIX.length) : null;
    }

    function wonderProductionItem(w: WonderDef): ProductionItem {
      return {
        kind: 'budynek',
        id: WONDER_PROD_PREFIX + w.id,
        nazwa: `[Cud] ${w.nazwa}`,
        koszt: w.kosztBudowy,
      };
    }

    function listBuildableWondersForOwner(ownerId: number): WonderDef[] {
      const civType = civTypeForOwner(ownerId);
      return listBuildableWondersForCiv(
        getWondersForCiv(civType),
        civType,
        civRowForType(civType),
        empireEpochForOwner(ownerId),
        unlockedTechSetForOwner(ownerId),
        completedWorldWonders,
        wonderTechEpochMap,
      );
    }

    function wonderGateOk(ownerId: number, wonderId: string): boolean {
      const w = getWonderById(wonderId);
      if (!w) return false;
      return evaluateWonderBuildGate({
        wonder: w,
        civType: civTypeForOwner(ownerId),
        civRow: civRowForType(civTypeForOwner(ownerId)),
        playerEra: empireEpochForOwner(ownerId),
        unlockedTechs: unlockedTechSetForOwner(ownerId),
        completedWonderIds: completedWorldWonders,
        techMap: wonderTechEpochMap,
      }).ok;
    }

    function playerWonderTargetCityId(): string | null {
      const openId = getOpenCityPanelCityId();
      if (openId) {
        const openCity = cities.find(c => c.id === openId && c.ownerId === 0);
        if (openCity) return openCity.id;
      }
      return cities.find(c => c.ownerId === 0)?.id ?? null;
    }

    function wonderIsRuin(wonderId: string, ownerId: number): boolean {
      const w = getWonderById(wonderId);
      if (!w) return false;
      return empireEpochForOwner(ownerId) > getWonderAbsolutEpoka(w);
    }

    function placedWonderSnapshot(): PlacedWonder[] {
      return placedWorldWonders.map(pw => ({
        ...pw,
        ruin: wonderIsRuin(pw.wonderId, pw.ownerId),
      }));
    }

    /**
     * CUDA-EKON-01 (2026-07-23): id cudów ukończonych I POSIADANYCH przez ownerId.
     * Źródło ownerId = placedWorldWonders (zapisywane w save, patrz completeWonderBuilt) —
     * jedyny istniejący ownerId-per-cud w silniku; NIE dubluje stanu completedWorldWonders.
     * Uwaga (znany, rzadki brzeg): jeśli completeWonderBuilt nie znalazł wolnego heksa
     * (log "Brak wolnego heksa..."), cud trafia do completedWorldWonders ale NIE do
     * placedWorldWonders — wtedy nie ma tu ownerId i jego yieldy ekonomiczne się nie
     * doliczą. Pre-istniejący, osobny problem renderu/mapy — poza zakresem tego zadania.
     */
    function wonderIdsOwnedBy(ownerId: number): string[] {
      return placedWorldWonders.filter(pw => pw.ownerId === ownerId).map(pw => pw.wonderId);
    }

    /** Suma bonusy.miasto cudów właściciela (× każde jego miasto), z bramką absolut. */
    function wonderCityYieldBonusForOwner(ownerId: number): WonderYieldBonus {
      return sumWonderCityYieldsForOwner(wonderIdsOwnedBy(ownerId), empireEpochForOwner(ownerId));
    }

    /** Mapa ownerId -> suma bonusy.miasto, do previewCityEconomy/advanceCityEconomy. */
    function buildWonderCityYieldsByOwnerMap(ownerIds: Iterable<number>): Map<number, WonderYieldBonus> {
      const out = new Map<number, WonderYieldBonus>();
      const seen = new Set<number>();
      for (const oid of ownerIds) {
        if (seen.has(oid)) continue;
        seen.add(oid);
        const bonus = wonderCityYieldBonusForOwner(oid);
        if (hasAnyWonderCityYield(bonus)) out.set(oid, bonus);
      }
      return out;
    }

    function reapplyWonderHexDecorHides(): void {
      for (const w of placedWorldWonders) hideDecorAtHex(keyOf(w.q, w.r));
    }

    function syncWonderRender(): void {
      wonderRenderer.sync(placedWonderSnapshot(), { ownerColorFn: civColorFn });
      reapplyWonderHexDecorHides();
    }

    function completeWonderBuilt(city: City, wonderId: string): void {
      if (completedWorldWonders.includes(wonderId)) return;
      completedWorldWonders.push(wonderId);

      const hex = pickWonderHexForCity({
        map,
        city,
        occupiedWonderHexes: placedWorldWonders,
        cityHexes: cities.map(c => ({ q: c.q, r: c.r })),
      });
      if (hex) {
        placedWorldWonders.push({
          wonderId,
          q: hex.q,
          r: hex.r,
          ownerId: city.ownerId,
          ruin: false,
        });
        hideDecorAtHex(keyOf(hex.q, hex.r));
        syncWonderRender();
      } else {
        console.warn(`[Cuda] Brak wolnego heksa w terytorium ${city.name} — cud bez modelu mapy`);
      }

      const w = getWonderById(wonderId);
      const label = w?.nazwa ?? wonderId;
      console.log(`[Cuda] Tura ${turn} ${city.name}: ukończono ${label}${hex ? ` @ ${hex.q},${hex.r}` : ''}`);
      // TEMAT #16 — powiadomienie „Cud ukończony" (klatka C makiety): złote (nasze) vs cudze.
      if (city.ownerId === 0) {
        const civLabel = civWonderDisplayName(player.civType as string);
        showWonderCompletedNotice({
          variant: 'mine',
          nazwa: label,
          locationLabel: `${city.name} · Tura ${turn} · ${civLabel} — Ty`,
          bodyHtml: w ? wonderEffectsLabel(w) : '',
          noteHtml: w?.dostep === 'E'
            ? `Ekskluzywny cud ${civLabel}. Bonusy aktywne do końca Średniowiecza, potem zostaje atrakcją (+10 handel, utrzymanie ÷2).`
            : 'Wygraliśmy wyścig. Bonusy aktywne do końca Średniowiecza, potem zostaje atrakcją (+10 handel, utrzymanie ÷2).',
          onShowOnMap: hex ? () => focusCameraOnWonder(wonderId) : undefined,
        });
      } else {
        const civLabel = civWonderDisplayName(civTypeForOwner(city.ownerId));
        showWonderCompletedNotice({
          variant: 'rival',
          nazwa: label,
          locationLabel: `${city.name} · Tura ${turn} · ${civLabel}`,
          bodyHtml: w?.dostep === 'R'
            ? `Wyścig rozstrzygnięty — ${civLabel} ubiegli wszystkich.`
            : `Ekskluzywny cud ${civLabel}.`,
          noteHtml: w?.dostep === 'R'
            ? `Każdy cud może powstać tylko raz na świecie. <b>${escWonderHtml(label)}</b> przepada dla pozostałych cywilizacji — usuwany z listy dostępnych.`
            : undefined,
        });
      }
      refreshCityPanelIfOpen();
      refreshWondersPickerIfOpen();
      refreshFog();
    }

    function applyProductionCompleted(
      city: City,
      cityId: string,
      completed: ProductionItem,
      prodAfterAdvance: CityProduction,
    ): { prod: CityProduction; requeueManpower?: boolean } {
      markCityStateDirty(); // D10: ukończenie produkcji (budynek/jednostka/cud) → przelicz ekonomię/moc
      const wonderId = parseWonderProdId(completed.id);
      if (wonderId) {
        if (completedWorldWonders.includes(wonderId)) {
          console.log(`[Cuda] ${city.name}: wyścig przegrany — ${wonderId} już na świecie`);
          if (city.ownerId === 0) {
            const w = getWonderById(wonderId);
            const label = w?.nazwa ?? wonderId;
            const placed = placedWorldWonders.find(p => p.wonderId === wonderId);
            const builderLabel = placed ? civWonderDisplayName(civTypeForOwner(placed.ownerId)) : 'inna cywilizacja';
            showWonderCompletedNotice({
              variant: 'rival',
              nazwa: label,
              locationLabel: `Tura ${turn} · ${builderLabel}`,
              bodyHtml: `Wyścig rozstrzygnięty — ${builderLabel} ubiegli wszystkich. Twoja Praca w to nie wraca.`,
              noteHtml: `Każdy cud może powstać tylko raz na świecie. <b>${escWonderHtml(label)}</b> przepada — projekt anulowany.`,
            });
          }
        } else {
          completeWonderBuilt(city, wonderId);
        }
        return { prod: prodAfterAdvance };
      }
      if (completed.kind === 'budynek') {
        const blt = cityBuilt.get(cityId) ?? [];
        cityBuilt.set(cityId, applyCompletedBuildingIds(blt, completed.id, data.buildings));
        if (completed.id === 'mury' || completed.id === 'fort') city.maMur = true;
        if (completed.id === 'spichlerz' && city.ownerId === 0) updateHud();
        console.log(`[Produkcja] Tura ${turn} ${city.name}: budynek ${completed.id}`);
        return { prod: prodAfterAdvance };
      }
      const ep = empireEpochForOwner(city.ownerId);
      const mpMults = civManpowerMultsForOwner(city.ownerId);
      const d = tryDeductUnitSpawnCosts(
        city, ep, populationCostOf(completed), mpMults.maxMult, completed.id,
      );
      if (!d.ok) {
        console.log(`[Produkcja] Tura ${turn} ${city.name}: brak Manpower — odlozono ${completed.id}`);
        return {
          prod: {
            ...prodAfterAdvance,
            kolejka: [completed, ...prodAfterAdvance.kolejka],
            postep: completed.koszt,
          },
          requeueManpower: true,
        };
      }
      city.population = d.population;
      city.manpower = d.manpower;
      const def = lookupUnitDef(completed.id);
      const ruch = normFieldVal(def['Ruch'], 2);
      const role = String(def['Rola'] ?? def['Rola (linia)'] ?? '');
      const isSuper = def['Super-jednostka'] === 'TAK';
      const newUnitId = 'prod_' + turn + '_' + cityId + '_' + Math.random().toString(36).slice(2);
      units.push({
        id: newUnitId,
        ownerId: city.ownerId,
        typeId: completed.id,
        category: categoryOf(completed.id, role, isSuper, def['Typ']),
        q: city.q,
        r: city.r,
        ruch,
        ruchLeft: 0,
      });
      maybeHintArmyFoodOnFirstPlayerUnit(city.ownerId);
      if (city.ownerId === 0) {
        if (endTurnInProgress) {
          deferredPlayerUnitRevealIds.add(newUnitId);
        } else {
          afterPlayerUnitSpawned(newUnitId);
        }
      }
      console.log(
        `[Produkcja] Tura ${turn} ${city.name}: jednostka ${completed.id} @ (${city.q},${city.r}) (−${d.kosztManpower} MP)`,
      );
      return { prod: prodAfterAdvance };
    }

    /** Opłacenie rekrutacji za złoto — pobiera Manpower od razu (kolejka rekrutacji).
     *  R-AI-KUP-JEDN (Maciej 2026-07-24, parytet AI): ownerId-agnostyczna — gracz
     *  (ownerId=0, domyślny) i AI (ownerId>0, wywołanie z runAiPhase) dzielą DOKŁADNIE
     *  tę samą ścieżkę; jedyna różnica to UI (showHintMessage/updateHud/refreshCityPanelIfOpen
     *  wyłącznie dla gracza — AI nie ma panelu). */
    function purchaseRecruitmentUnit(cityId: string, itemId: string, koszt: number, ownerId = 0): boolean {
      if (ownerTreasury(ownerId) < koszt) return false;
      const city = cities.find(ct => ct.id === cityId);
      if (!city || city.ownerId !== ownerId) return false;
      const ep = empireEpochForOwner(ownerId);
      const mpMults = civManpowerMultsForOwner(ownerId);
      if (!canAffordUnitManpower(city, ep, mpMults.maxMult, itemId)) {
        if (ownerId === 0) showHintMessage('Za mało rekrutów (Manpower) w tym mieście', 2800);
        return false;
      }
      const item = unitProductionItem(
        itemId,
        data,
        civBonusyForOwnerId(ownerId),
        player.kosztJednostekPace ?? 'niski',
        ownerId,
        _menuDifficulty,
      );
      if (!item) return false;
      // JEDNOSTKI-SUROWIEC-01 (Maciej 2026-07-24): jednostka konsumuje Surowiec/Surowiec (ilość)
      // z units.json Z PULI PAŃSTWA (civ-wide, suma po wszystkich miastach ownera) — dokładnie
      // tak samo jak koszt_surowce budynku (game/building-stock-cost.ts). Sprawdzane PRZED
      // pobraniem Manpower/złota, żeby nie zdarzyło się częściowe pobranie przy odmowie.
      const unitDef = data.units.find(u => u.Jednostka === itemId);
      const stockCost = unitStockCost(unitDef);
      if (Object.keys(stockCost).length > 0
        && !canAffordBuildingStock(ownerResourceStockAll(cities, ownerId), stockCost)) {
        if (ownerId === 0) showHintMessage('Za mało surowca w magazynie państwa', 2800);
        return false;
      }
      const d = tryDeductUnitSpawnCosts(
        city, ep, UNIT_POPULATION_COST, mpMults.maxMult, itemId,
      );
      if (!d.ok) {
        if (ownerId === 0) showHintMessage('Za mało rekrutów (Manpower) w tym mieście', 2800);
        return false;
      }
      setOwnerTreasury(ownerId, ownerTreasury(ownerId) - koszt);
      city.population = d.population;
      city.manpower = d.manpower;
      if (Object.keys(stockCost).length > 0) {
        deductBuildingStockCostAcrossCities(cities, ownerId, stockCost);
      }
      markCityStateDirty();
      const prod0 = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
      cityProd.set(cityId, enqueueRecruitment(prod0, { ...item, koszt }));
      if (ownerId === 0) {
        updateHud();
        refreshCityPanelIfOpen();
      }
      console.log(
        `[Rekrutacja] ${city.name}: ${itemId} oplacone ${koszt} — kolejka (−${d.kosztManpower} MP)`,
      );
      return true;
    }

    /** Anulowanie opłaconej rekrutacji — zwrot złota i Manpower (ownerId-agnostyczne,
     *  patrz komentarz przy purchaseRecruitmentUnit). */
    function cancelRecruitmentPurchase(cityId: string, itemId: string, koszt: number, ownerId = 0): void {
      const city = cities.find(ct => ct.id === cityId);
      if (!city || city.ownerId !== ownerId) return;
      const ep = empireEpochForOwner(ownerId);
      const mpMults = civManpowerMultsForOwner(ownerId);
      const refunded = refundUnitSpawnToCity(
        city, ep, UNIT_POPULATION_COST, undefined, mpMults.maxMult, itemId,
      );
      city.population = refunded.population;
      city.manpower = refunded.manpower;
      setOwnerTreasury(ownerId, ownerTreasury(ownerId) + koszt);
      // JEDNOSTKI-SUROWIEC-01: zwrot surowca do puli PAŃSTWA (civ-wide) — symetrycznie
      // z poborem w purchaseRecruitmentUnit. BEZ capPerType: to zwrot, nie nowa produkcja
      // (nie powinien ginąć nawet gdyby pula była tuż pod capem magazynu).
      const unitDef = data.units.find(u => u.Jednostka === itemId);
      const stockCost = unitStockCost(unitDef);
      for (const [key, amt] of Object.entries(stockCost)) {
        creditOwnerResourceStock(cities, ownerId, key, amt);
      }
      markCityStateDirty();
      if (ownerId === 0) {
        updateHud();
        refreshCityPanelIfOpen();
      }
      console.log(`[Rekrutacja] ${city.name}: anulowano — zwrot ${koszt} ¤ + MP`);
    }

    function sanitizeProductionQueue(ownerId: number, prod: CityProduction): CityProduction {
      const kolejka = prod.kolejka.filter((item) => {
        const wid = parseWonderProdId(item.id);
        if (!wid) return true;
        return wonderGateOk(ownerId, wid);
      });
      if (kolejka.length === prod.kolejka.length) return prod;
      return { ...prod, kolejka };
    }

    function setCityProduction(cityId: string, prod: CityProduction): void {
      const city = cities.find(c => c.id === cityId);
      const ownerId = city?.ownerId ?? 0;
      const next = sanitizeProductionQueue(ownerId, { ...prod, kolejka: [...prod.kolejka] });
      cityProd.set(cityId, next);
      markCityStateDirty(); // D10: zmiana produkcji → przelicz ekonomię/moc
    }

    function wonderHudTargetLabel(): string | null {
      const targetId = playerWonderTargetCityId();
      if (!targetId) return 'Brak miasta — załóż stolicę';
      return cities.find(c => c.id === targetId)?.name ?? null;
    }

    function wonderHudEntries() {
      const targetId = playerWonderTargetCityId();
      const prod = targetId ? cityProd.get(targetId) : undefined;
      const queued = new Set(
        (prod?.kolejka ?? [])
          .map(it => parseWonderProdId(it.id))
          .filter((id): id is string => id != null),
      );
      return listBuildableWondersForOwner(0).map(w => ({
        id: w.id,
        label: w.nazwa,
        kosztPraca: w.kosztBudowy,
        epokaWejscia: w.epokaWejscia,
        dostep: w.dostep,
        queued: queued.has(w.id),
        lockHint: queued.has(w.id) ? 'Już w kolejce tego miasta' : null,
      }));
    }

    function enqueueWonderForPlayer(wonderId: string): boolean {
      const cityId = playerWonderTargetCityId();
      if (!cityId) {
        showHintMessage('Brak miasta gracza — załóż stolicę, aby budować cuda', 3500);
        return false;
      }
      if (!wonderGateOk(0, wonderId)) {
        showHintMessage('Ten cud nie jest teraz dostępny', 3000);
        return false;
      }
      const w = getWonderById(wonderId);
      if (!w) return false;
      const prod0 = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
      if (prod0.kolejka.some(it => parseWonderProdId(it.id) === wonderId)) {
        showHintMessage('Ten cud jest już w kolejce tego miasta', 3000);
        return false;
      }
      const item = wonderProductionItem(w);
      cityProd.set(cityId, enqueue(prod0, item));
      const city = cities.find(c => c.id === cityId);
      showHintMessage(
        `Kolejka: <b>${w.nazwa}</b> w ${city?.name ?? 'mieście'} (${w.kosztBudowy} Pracy)`,
        4000,
      );
      refreshCityPanelIfOpen();
      refreshWondersPickerIfOpen();
      refreshD1bHud();
      updateHud();
      return true;
    }

    function hideWondersPicker(): void {
      if (wondersPickerEl) wondersPickerEl.style.display = 'none';
    }

    function refreshWondersPickerIfOpen(): void {
      if (!wondersPickerEl || wondersPickerEl.style.display === 'none') return;
      renderWondersPickerContent();
    }

    function renderWondersPickerContent(): void {
      if (!wondersPickerEl) return;
      wondersPickerEl.innerHTML = '';
      const hdr = document.createElement('div');
      hdr.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:0.5em;';
      const title = document.createElement('strong');
      title.textContent = 'Cuda świata — dostępne do budowy';
      hdr.appendChild(title);
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '×';
      closeBtn.style.cssText = 'font-size:1.2em;line-height:1;padding:0 0.35em;cursor:pointer;';
      closeBtn.addEventListener('click', () => hideWondersPicker());
      hdr.appendChild(closeBtn);
      wondersPickerEl.appendChild(hdr);

      const targetId = playerWonderTargetCityId();
      const targetCity = targetId ? cities.find(c => c.id === targetId) : undefined;
      const sub = document.createElement('div');
      sub.style.cssText = 'font-size:0.85em;opacity:0.85;margin-bottom:0.6em;';
      sub.textContent = targetCity
        ? `Kolejka produkcji: ${targetCity.name}`
        : 'Brak miasta gracza — załóż stolicę.';
      wondersPickerEl.appendChild(sub);

      const list = listBuildableWondersForOwner(0);
      if (list.length === 0) {
        const empty = document.createElement('div');
        empty.style.cssText = 'font-size:0.9em;opacity:0.8;';
        empty.textContent = '(brak — zbadaj technologie / poczekaj na epokę)';
        wondersPickerEl.appendChild(empty);
        return;
      }
      for (const w of list) {
        const row = document.createElement('button');
        row.type = 'button';
        row.style.cssText =
          'display:block;width:100%;text-align:left;margin:0.25em 0;padding:0.45em 0.55em;' +
          'cursor:pointer;border:1px solid rgba(255,255,255,0.2);border-radius:4px;background:rgba(0,0,0,0.35);color:inherit;';
        const tag = w.dostep === 'R' ? ' [R]' : '';
        row.textContent = `${w.nazwa}${tag} — ${w.kosztBudowy} Pracy · tech: ${(w.techUnlock ?? []).join(' + ')}`;
        row.addEventListener('click', () => { enqueueWonderForPlayer(w.id); });
        wondersPickerEl.appendChild(row);
      }
    }

    function toggleWondersPicker(): void {
      if (!wondersPickerEl) {
        wondersPickerEl = document.createElement('div');
        wondersPickerEl.id = 'civ-wonders-picker';
        wondersPickerEl.style.cssText =
          'position:fixed;top:72px;right:12px;z-index:9500;max-width:340px;max-height:60vh;' +
          'overflow:auto;padding:0.75em 0.85em;background:rgba(18,14,10,0.94);' +
          'border:1px solid rgba(212,175,95,0.45);border-radius:6px;color:#f5e6c8;font-size:0.92em;' +
          'box-shadow:0 8px 28px rgba(0,0,0,0.55);';
        document.body.appendChild(wondersPickerEl);
      }
      const open = wondersPickerEl.style.display !== 'none';
      if (open) {
        hideWondersPicker();
        return;
      }
      wondersPickerEl.style.display = 'block';
      renderWondersPickerContent();
    }

    // -----------------------------------------------------------------
    // R-CUDA-TAB (2026-07-24): cuda budowane WYŁĄCZNIE z listy produkcji miasta
    // (cityPanel.ts renderBuildList → getBuildableWonders/onBuildWonder), filtrowane
    // do listBuildableWondersForOwner(0) — usunięto osobny katalog „Cuda świata”
    // (wondersView.ts, WARIANT A, decyzja Maciej). Zero zmian logiki silnika.
    // -----------------------------------------------------------------

    function escWonderHtml(s: string): string {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    const WONDER_YIELD_LABELS: Record<string, string> = {
      pieniadz: 'złota', zywnosc: 'żywności', nauka: 'nauki', kultura: 'kultury',
      zadowolenie: 'zadowolenia', praca: 'produkcji', obrona: 'obrony', drewno: 'drewna',
    };

    function civWonderDisplayName(civType: string | undefined | null): string {
      if (!civType) return civType ?? '?';
      return getWondersData().panstwa[civType]?.nazwa ?? civType;
    }

    function formatWonderYieldBonus(b?: Record<string, number | undefined>): string {
      if (!b) return '';
      return Object.entries(b)
        .filter((entry): entry is [string, number] => typeof entry[1] === 'number' && entry[1] !== 0)
        .map(([k, v]) => `+${v} ${WONDER_YIELD_LABELS[k] ?? k}`)
        .join(', ');
    }

    function wonderEffectsLabel(w: WonderDef): string {
      const parts: string[] = [];
      const miasto = formatWonderYieldBonus(w.bonusy?.miasto as Record<string, number | undefined> | undefined);
      if (miasto) parts.push(`Miasto ${miasto} (× każde miasto)`);
      const hex = formatWonderYieldBonus(w.bonusy?.hex as Record<string, number | undefined> | undefined);
      if (hex) parts.push(`Hex cudu ${hex}`);
      for (const t of w.bonusy?.teren ?? []) {
        const y = formatWonderYieldBonus(t as unknown as Record<string, number | undefined>);
        if (y) parts.push(`${t.typTerenu} ${y}`);
      }
      for (const s of w.bonusy?.specjalne ?? []) parts.push(s.opis);
      return parts.length > 0 ? parts.join(' · ') : '(brak opisanych bonusów)';
    }

    function focusCameraOnWonder(wonderId: string): void {
      const placed = placedWorldWonders.find(p => p.wonderId === wonderId);
      if (!placed) return;
      const { x, z } = axialToWorld(placed.q, placed.r, HEX_R);
      const { dist } = camCtrl.getFocusState();
      camCtrl.focusAt(x, z, dist);
    }

    function ownerCivKeyForReligion(ownerId: number): string | null {
      if (ownerId === 0) {
        const k = String(player.civType || _menuCivId || '');
        return k.length > 0 ? k : null;
      }
      return aiOwnerCivMap.get(ownerId) ?? null;
    }

    function ownerReligionForOwnerId(ownerId: number): string | null {
      return civReligionForKey(ownerCivKeyForReligion(ownerId), data.societyParams, data.civs as unknown as CivsDataLike);
    }

    function resolvedCityReligion(city: City): ReligionState {
      return resolveCityReligionState(
        cityRelig.get(city.id),
        city.population,
        ownerReligionForOwnerId(city.ownerId),
      );
    }

    function seedCityReligionAtFounding(c: City): void {
      const stored = cityRelig.get(c.id);
      if (stored && !isEmptyReligionState(stored)) return;
      cityRelig.set(c.id, defaultCityReligionState(c.population, ownerReligionForOwnerId(c.ownerId)));
    }

    function seedWealthImmunityAtFounding(c: City): void {
      const wp = loadWealthParams(data.econParams as RawWealthParamsJson, _menuDifficulty);
      c.wealthImmunityRemaining = Math.max(0, Math.floor(wp.immunitetTur));
    }

    /** growthMult per cityId (from order lane) -- updated each turn, applied next turn. */
    const growthMultMap = new Map<string, number>();
    const orderMultMap = new Map<string, OrderYieldMults>();
    const orderValueMap = new Map<string, number>();
    /** Per-city order state (szczescie/porzadek) — updated each turn for city panel B2 hooks. */
    const cityOrderState = new Map<string, OrderState>();
    /** OBL-S4: staty milicji szturmowej (ephemeral, nie w units[]). */
    const militiaDefOverrides = new Map<string, Record<string, unknown>>();
    const empireFoodStates = new Map<number, EmpireFoodState>();
    let playerArmyFoodHintShown = false;
    const lastCityKulturaTick = new Map<string, number>();
    /** CUDA-AI: Praca/turę kierowana do budynków per miasto (econTick.doBudynkow),
     * migawka z ostatniego przelicznika ekonomii -- populowana razem z
     * lastCityKulturaTick (patrz advanceCityEconomy). Używane przez decyzję AI
     * "stać mnie na cud" (decideAiWonderBuild) w fazie AI TURN LOOP, poza
     * zasięgiem leksykalnym lokalnej stałej `econ` (zadeklarowanej w innym
     * bloku try/catch) -- stąd osobna, trwała mapa zamiast domknięcia. */
    const aiWonderPracaTickByCity = new Map<string, number>();
    let powerSnapshotsForTurn: PowerOwnerSnapshot[] = [];

    function territoryOwnerAtLive(q: number, r: number): number | null {
      return territoryOwnerAt(q, r, buildAllTerritoryNodes());
    }

    function cityNodesForOwner(ownerId: number): CityNode[] {
      return cities
        .filter(c => c.ownerId === ownerId)
        .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
    }

    function buildAllTerritoryNodes(): TerritoryNode[] {
      return cities.map(c => ({
        q: c.q,
        r: c.r,
        pop: c.population,
        level: 1,
        ownerId: c.ownerId,
      }));
    }

    /**
     * Ulepszenia terenu (np. kopalnia miedzi / kopalnia na złożu żelaza) WYŁĄCZNIE w terytorium
     * danego ownera — audyt #33: placedImprovements to jedna globalna mapa bez ownera, więc
     * hasBrazAccess/empireHasKopalniaNaZlozuZelaza (wołane z globalną mapą) widziały kopalnie
     * DOWOLNEGO imperium — kopalnia AI odblokowywała Brąz/Żelazo graczowi i odwrotnie. Filtr
     * przez territoryOwnerAt — ta sama logika co isPlayerTerritoryHex/enrichBorderMarchPairsWithMilitary.
     */
    function placedImprovementsForOwner(ownerId: number): Map<string, PlacedLayers> {
      const nodes = buildAllTerritoryNodes();
      const out = new Map<string, PlacedLayers>();
      for (const [hexKey, layers] of placedImprovements) {
        const [qStr, rStr] = hexKey.split(',');
        if (territoryOwnerAtLive(Number(qStr), Number(rStr)) === ownerId) {
          out.set(hexKey, layers);
        }
      }
      return out;
    }

    // -------------------------------------------------------------------
    // Temat #4 (Handel E3b): dostęp do surowca civ-wide (braz/zelazo/kon)
    // przez trasę handlową — patrz trade-routes.ts computeTradeRouteResourceGrants
    // dla architektury (liczone na bieżąco, nie zapisywane).
    // -------------------------------------------------------------------

    /** Klucz syntetycznego wpisu — patrz placedImprovementsWithBrazTradeGrant. */
    const TRADE_GRANT_BRAZ_SYNTHETIC_KEY = '__trasa_braz__';

    /**
     * Czy WŁASNE imperium ownera ma dostęp do `key` BEZ handlu — wejście do
     * computeTradeRouteResourceGrants (ownerHasNativeAccess). Świadomie NIE liczy
     * grantów z trasy (są POCHODNĄ tego wyniku — liczenie ich tu byłoby cyklem)
     * ani grantów z koszyka PN (zloze/surowiec_boolean, osobny, wcześniejszy temat).
     */
    function ownerHasNativeResourceAccess(ownerId: number, key: TradeRouteResourceKey): boolean {
      const ownImprovements = placedImprovementsForOwner(ownerId);
      if (key === 'braz') {
        if (!empireHasKopalniaMiedzi(ownImprovements)) return false;
        for (const c of cities) {
          if (c.ownerId === ownerId && cityHasPiecHutniczy(cityBuilt.get(c.id) ?? [])) return true;
        }
        return false;
      }
      if (key === 'zelazo') {
        const hasKopalniaZelazo = empireHasKopalniaNaZlozuZelaza(ownImprovements, map);
        if (!hasKopalniaZelazo) return false;
        for (const c of cities) {
          if (c.ownerId === ownerId && hasZelazoAccess(hasKopalniaZelazo, cityBuilt.get(c.id) ?? [])) return true;
        }
        return false;
      }
      // 'kon'
      return computeEmpireLivestockUnlocks(ownImprovements, map, String(ownerId)).has('kon');
    }

    /** Przelicza tradeRouteResourceGrants NA BIEŻĄCO z aktualnej `tradeRoutes` — wołaj
     *  zaraz po każdym odświeżeniu tradeRoutes (koniec tury / wczytanie zapisu / reset). */
    function recomputeTradeRouteResourceGrants(): void {
      tradeRouteResourceGrants = computeTradeRouteResourceGrants(tradeRoutes, ownerHasNativeResourceAccess);
    }

    /**
     * Kopiuje `ownImprovements` i (gdy `ownerId` ma aktywny grant "z trasy" na braz)
     * dokleja syntetyczny wpis 'kopalnia_miedzi' pod nieistniejącym na mapie kluczem.
     * BEZPIECZNE dokładnie dlatego, że empireHasKopalniaMiedzi (braz-access.ts) skanuje
     * WYŁĄCZNIE wartości mapy — nigdy nie odwołuje się do heksa pod kluczem — więc ten
     * wpis poprawnie symuluje "imperium ma miedź" bez fałszowania żadnego realnego
     * heksa ani innych odczytów tej samej mapy (te zawsze filtrują `if (!map.hexes[hexKey])
     * continue`, patrz empireHasKopalniaNaZlozuZelaza / computeEmpireLivestockUnlocks /
     * resource-access.ts collectActiveAccess — syntetyczny klucz jest tam po prostu
     * pomijany). Miasto nadal MUSI mieć własny Piec hutniczy — trasa daje surowiec
     * (rudę), nie budynek (cityHasPiecHutniczy w hasBrazAccess bez zmian).
     */
    function placedImprovementsWithBrazTradeGrant(
      ownerId: number,
      ownImprovements: Map<string, PlacedLayers>,
    ): Map<string, PlacedLayers> {
      if (!hasTradeRouteResourceAccess(tradeRouteResourceGrants, ownerId, 'braz')) return ownImprovements;
      const augmented = new Map(ownImprovements);
      augmented.set(TRADE_GRANT_BRAZ_SYNTHETIC_KEY, [KOPALNIA_MIEDZI_KEY]);
      return augmented;
    }

    /** empireHasKopalniaNaZlozuZelaza własne LUB grant "z trasy" na zelazo. */
    function hasKopalniaNaZlozuZelazaOrTradeGrant(
      ownerId: number,
      ownImprovements: Map<string, PlacedLayers>,
    ): boolean {
      return empireHasKopalniaNaZlozuZelaza(ownImprovements, map)
        || hasTradeRouteResourceAccess(tradeRouteResourceGrants, ownerId, 'zelazo');
    }

    /**
     * TEMAT 8 Q2 (2026-07-24, decyzja właściciela): Port/Port wielki wymagają wybrzeża
     * morskiego LUB rzeki w zasięgu TEGO miasta (teren, nie surowiec — per-miasto, nie
     * imperium, bo lokalizacja portu jest stała per miasto). isCoastalCity = sąsiad-woda
     * (barbarians.ts, dawniej tylko do celów rajdów); cityHasWaterAccess = rzeka na heksie
     * miasta/sąsiada (turn-economy.ts, dawniej tylko bonus zdrowia). Reużyte tu 1:1 dla
     * bramki budowy — WYLICZONE przez wołającego (main.ts zna mapę), bo production.ts /
     * building-resource-gate.ts są pure-logic (patrz wzorzec hasKopalniaNaZlozuZelaza wyżej).
     */
    function cityHasCoastOrRiverAccess(city: Pick<City, 'q' | 'r'>): boolean {
      return isCoastalCity(map, city) || cityHasWaterAccess(city, map);
    }

    /** UI: "źródło dostępu" dla panelu miasta — undefined gdy brak grantu z trasy. */
    function tradeRouteResourceSourceLabel(ownerId: number, key: TradeRouteResourceKey): string | undefined {
      const grant = firstTradeRouteResourceGrant(tradeRouteResourceGrants, ownerId, key);
      if (!grant) return undefined;
      const civName = civDisplayNameForOwner(grant.viaOwnerId) ?? `cywilizacja #${grant.viaOwnerId}`;
      return `szlak handlowy z ${civName}`;
    }

    function buildCapitalHexByOwner(): Map<number, { q: number; r: number }> {
      const map = new Map<number, { q: number; r: number }>();
      for (const c of cities) {
        if (!map.has(c.ownerId)) map.set(c.ownerId, { q: c.q, r: c.r });
      }
      return map;
    }

    function syncBasketResearchFromEngine(): void {
      const researched = new Map<number, ReadonlySet<string>>();
      researched.set(0, new Set(player.zbadane));
      for (const [oid, zbadane] of aiResearchDone) researched.set(oid, new Set(zbadane));
      basketTransferCtx = { ...basketTransferCtx, researchedByOwner: researched, techCatalog: data.tech };
    }

    function allocateDipUnitId(): string {
      _dipUnitSeq += 1;
      return `dip_${turn}_${_dipUnitSeq}`;
    }

    function enrichBorderMarchPairsWithMilitary(
      pairs: readonly BorderMarchPair[],
      territoryNodes: readonly TerritoryNode[],
    ): BorderMarchPair[] {
      const militaryByPair = new Map<string, boolean>();
      for (const unit of units) {
        if (unit.inGarnizon) continue;
        const ownerAt = territoryOwnerAt(unit.q, unit.r, territoryNodes);
        if (ownerAt == null || ownerAt === unit.ownerId) continue;
        const key = `${unit.ownerId}->${ownerAt}`;
        if (defaultIsMilitaryUnit(unit)) militaryByPair.set(key, true);
      }
      return pairs.map(p => ({
        ...p,
        isMilitary: militaryByPair.get(`${p.intruderOwnerId}->${p.territoryOwnerId}`) ?? false,
      }));
    }

    function applyBorderMarchPenaltiesEndTurn(): void {
      const territoryNodes = buildAllTerritoryNodes();
      const rawPairs = collectUnauthorizedBorderPairs(
        units,
        territoryNodes,
        defaultIsMilitaryUnit,
      );
      const enriched = enrichBorderMarchPairsWithMilitary(
        dedupeBorderMarchPairs(rawPairs),
        territoryNodes,
      );
      const borderParams = loadBorderMarchParams();
      const { relations, penalizedPairs } = applyUnauthorizedBorderPenalties(
        enriched,
        diplomacyRelations,
        borderParams,
        (pair) => ({
          treaties: activeDeals,
          isMilitary: pair.isMilitary === true,
          relation: getDiploRelation(pair.intruderOwnerId, pair.territoryOwnerId),
        }),
      );
      for (const [key, rel] of relations) diplomacyRelations.set(key, rel);
      if (penalizedPairs > 0) {
        showHintMessage(
          `Nieautoryzowany przemarsz: −${borderParams.karaPrzemarszNieautoryzowany_zaufanie_perTura} Zauf./para`,
          3500,
        );
      }
    }

    function countTerritoryHexes(nodes: CityNode[]): number {
      if (nodes.length === 0) return 0;
      // D9: enumeruj heksy LOKALNIE (dyski wokół miast, promień = cityTerritoryRadius +1 margines)
      // zamiast skanu CAŁEJ mapy. Ten sam predykat isInTerritory + dedup + tylko istniejące heksy
      // → wynik IDENTYCZNY jak skan 320k, ale O(miasta × promień²).
      const seen = new Set<string>();
      for (const node of nodes) {
        for (const key of hexKeysWithinRadius(node.q, node.r, cityTerritoryRadius(node) + 1, map)) {
          if (seen.has(key) || !map.hexes[key]) continue;
          const [qs, rs] = key.split(',');
          if (isInTerritory(Number(qs), Number(rs), nodes)) seen.add(key);
        }
      }
      return seen.size;
    }

    function buildPowerSnapshotsForTurn(econ: { perCity: Array<{ ownerId: number; pieniadz: number }> }): PowerOwnerSnapshot[] {
      const ownerIds = new Set<number>([0]);
      for (const c of cities) ownerIds.add(c.ownerId);
      for (const a of aiStartHexes) ownerIds.add(a.ownerId);
      const rows: PowerOwnerSnapshot[] = [];
      for (const oid of ownerIds) {
        const ownerCities = cities.filter(c => c.ownerId === oid);
        const nodes = cityNodesForOwner(oid);
        const ownerEpoka = empireEpochForOwner(oid);
        const mpMults = civManpowerMultsForOwner(oid);
        const pobor = empirePoborTotals(cities, oid, ownerEpoka, mpMults.maxMult);
        rows.push({
          ownerId: oid,
          population: ownerCities.reduce((s, c) => s + c.population, 0),
          cityCount: ownerCities.length,
          territoryHexCount: countTerritoryHexes(nodes),
          pieniadzPerTurn: (econ.perCity ?? [])
            .filter(t => t.ownerId === oid)
            .reduce((s, t) => s + t.pieniadz, 0),
          ludnoscAbsolutna: pobor.ludnoscAbsolutna,
          rekruci: pobor.rekruci,
        });
      }
      return buildPowerSnapshots(rows);
    }

    function initEmpireFoodStates(): void {
      playerArmyFoodHintShown = false;
      clearLastEmpireFoodTicks();
      empireFoodStates.clear();
      const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
      empireFoodStates.set(0, freshEmpireFoodState(efParams.procentRozwojDefault));
      for (const ai of aiStartHexes) {
        if (!empireFoodStates.has(ai.ownerId)) {
          empireFoodStates.set(ai.ownerId, freshEmpireFoodState(efParams.procentRozwojDefault));
        }
      }
      bindEmpireFoodRuntime(empireFoodStates);
      syncCityFoodSplitsFromEmpire();
    }

    function empireFoodDefaultPct(): number {
      return buildEmpireFoodParams(data.econParams, _menuDifficulty).procentRozwojDefault;
    }

    /** Stary zapis: empireFoodStates.procentRozwoj → każde miasto osobno (B5 per-city slider). */
    function syncCityFoodSplitsFromEmpire(): void {
      const def = empireFoodDefaultPct();
      for (const city of cities) {
        if (city.procentRozwoj !== undefined) continue;
        city.procentRozwoj = empireFoodStates.get(city.ownerId)?.procentRozwoj ?? def;
      }
    }

    /** Miasto w trybie ręcznej okolicy na mapie 3D (po „Mapa” w panelu). */
    let okolicaMapEditCityId: string | null = null;
    let okolicaOverlayGroup: THREE.Group | null = null;
    /** Izolacja widoku 3D przy panelu miasta — tylko okolica, bez mapy strategicznej. */
    let cityPanelViewSaved: { x: number; z: number; dist: number } | null = null;
    let cityPanelViewCityId: string | null = null;

    function okolicaHexKeysForCity(city: City, pad = 1): Set<string> {
      const keys = new Set<string>();
      const rad = cityRangeForPopulation(city.population) + pad;
      for (const key of Object.keys(map.hexes)) {
        const hex = map.hexes[key];
        if (!hex) continue;
        const d = hexDistance(city.q, city.r, hex.coords.q, hex.coords.r);
        if (d <= rad) keys.add(key);
      }
      return keys;
    }

    function applyCityPanelWorldView(active: boolean, city?: City): void {
      if (active && city) {
        if (cityPanelViewSaved === null) {
          cityPanelViewSaved = camCtrl.getFocusState();
        }
        cityPanelViewCityId = city.id;
        const { x, z } = axialToWorld(city.q, city.r, HEX_R);
        const rad = cityRangeForPopulation(city.population);
        const dist = Math.max(14, Math.min(42, 10 + rad * 3.8));
        camCtrl.focusAt(x, z, dist);
      } else {
        if (cityPanelViewSaved !== null) {
          const saved = cityPanelViewSaved;
          camCtrl.focusAt(saved.x, saved.z, saved.dist);
          cityPanelViewSaved = null;
        }
        cityPanelViewCityId = null;
      }
      // D3: usunięty zbędny refreshFog() przy otwarciu panelu miasta — mgła się tu nie zmienia
      // (widoczność miast ustawia cityRenderer.sync; poprawność mgły dają realne zdarzenia: ruch/tura).
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshRangeOverlays();
      refreshTerritoryBorderOverlay();
      refreshWorkerFieldOverlay();
      refreshTradeRoutesOverlay();
    }

    function okolicaHexWorkable(q: number, r: number): boolean {
      const hex = map.hexes[keyOf(q, r)];
      if (!hex) return false;
      const t = hex.terenBazowy;
      return t !== TerenBazowy.Morze && t !== TerenBazowy.Gory;
    }

    function okolicaWorkedKeySet(city: City): Set<string> {
      const nodes = buildAllTerritoryNodes();
      const worked = resolveWorkedTiles(city, map, (q, rr) => yieldOfMapHex(map, q, rr), {
        isWorkable: okolicaHexWorkable,
        territoryNodes: nodes,
        ownerId: city.ownerId,
      });
      return new Set(worked.map(t => t.key));
    }

    function disposeOkolicaOverlay(): void {
      if (!okolicaOverlayGroup) return;
      try { scene.remove(okolicaOverlayGroup); } catch { /* scena może być już disposed */ }
      disposeCityOkolicaOverlayGroup(okolicaOverlayGroup);
      okolicaOverlayGroup = null;
    }

    function syncOkolicaOverlay(): void {
      if (!isCityPanelOpen()) {
        disposeOkolicaOverlay();
        return;
      }
      const cityId = getOpenCityPanelCityId();
      const city = cityId ? cities.find(c => c.id === cityId) : undefined;
      if (!city || city.ownerId !== 0) {
        disposeOkolicaOverlay();
        return;
      }
      okolicaOverlayGroup = syncCityOkolicaOverlay(scene, okolicaOverlayGroup, map, {
        cityQ: city.q,
        cityR: city.r,
        range: cityRangeForPopulation(city.population),
        workedKeys: okolicaWorkedKeySet(city),
        yieldOf: (q, rr) => yieldOfMapHex(map, q, rr),
        showYields: true,
      });
    }

    function hideCityPanelFull(): void {
      hideCityUnitPick();
      if (closeCityPanelIfOpen()) {
        requestAnimationFrame(() => tryOpenNextAutoDiploAudience());
        return;
      }
      hideCityPanel();
      applyCityPanelWorldView(false);
      disposeOkolicaOverlay();
      refreshWorkerFieldOverlay();
      updateHud();
      requestAnimationFrame(() => tryOpenNextAutoDiploAudience());
    }

    function applyOkolicaTileAdjust(cityId: string, q: number, r: number, _delta: number): void {
      const city = cities.find(c => c.id === cityId);
      if (!city || city.ownerId !== 0) return;
      const res = toggleTileWorker(city, map, q, r, undefined, buildAllTerritoryNodes());
      if (res.ok) {
        city.okolicaReczne = res.reczne;
        city.okolicaTryb = 'reczny';
        markCityStateDirty(); // D10: zmiana pól roboczych → przelicz
        updateHud();
        refreshCityPanelIfOpen();
        syncOkolicaOverlay();
        refreshWorkerFieldOverlay();
      } else {
        const msg: Record<string, string> = {
          limit_populacji: 'Brak wolnych obywateli — najpierw zabierz 👤 z innego pola.',
          poza_zasiegiem: 'To pole jest poza zasięgiem okolicy.',
          obce_terytorium: 'Tylko w swoim terytorium — ten heks należy do innego państwa.',
          centrum_miasta: 'Centrum miasta nie przyjmuje 👤 — wybierz pole obok.',
          brak_ludnosci: 'Miasto nie ma ludności do pracy w polu.',
          brak_robotnika: 'Na tym polu nie ma przypisanego 👤.',
        };
        showHintMessage(msg[res.reason ?? ''] ?? 'Nie można zmienić przypisania pola.', 2800);
      }
    }

    /** Lewy klik na mapie: toggle 👤 (przypisz / zabierz). */
    function toggleOkolicaTileOnMap(cityId: string, q: number, r: number): void {
      applyOkolicaTileAdjust(cityId, q, r, 0);
    }

    function enterOkolicaMapMode(cityId: string): void {
      okolicaMapEditCityId = cityId;
      const city = cities.find(c => c.id === cityId);
      showHintMessage(
        (city?.name ?? 'Miasto') +
        ' — kliknij heks w okolicy, aby przypisać 👤 (panel pozostaje otwarty).',
        5000,
      );
    }

    function exitOkolicaMapMode(): void {
      if (okolicaMapEditCityId === null) return;
      okolicaMapEditCityId = null;
    }

    function isWorldMapUnitMode(): boolean {
      if (isCityPanelOpen()) return false;
      if (isPreBattleOpen()) return false;
      if (isPostBattleSummaryOpen()) return false;
      if (isArmyMergePanelOpen()) return false;
      if (isArmySplitPanelOpen()) return false;
      if (isSiegeMapPanelOpen()) return false;
      if (isCityUnitPickOpen()) return false;
      return true;
    }

    function hudHtmlEsc(raw: string): string {
      return raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /** D17=A: panel kontekstowy — pole mapy + opcjonalnie jednostka na tym heksie. */
    function buildHexContextPanelMessage(): string | null {
      if (!isWorldMapUnitMode() || lastBHex === null) return null;
      const hex = map.hexes[keyOf(lastBHex.q, lastBHex.r)];
      if (!hex) return null;
      const cityOn = cities.find(c => c.q === lastBHex!.q && c.r === lastBHex!.r);
      return buildHexContextTooltipHtml({
        q: lastBHex.q,
        r: lastBHex.r,
        hex,
        cityName: cityOn?.name ?? null,
        cityIsCityState: cityOn != null && cityOn.ownerId !== 0 && !!cityOn.startCityState,
        currentEra: player.era,
        esc: hudHtmlEsc,
      });
    }

    function buildUnitContextPanelMessage(): string | null {
      if (!isWorldMapUnitMode() || selectedId === null) return null;
      const u = units.find(x => x.id === selectedId);
      if (!u || u.ownerId !== 0) return null;
      const def = lookupUnitDef(u.typeId);
      const defName = String(def?.nazwa ?? def?.Nazwa ?? u.typeId);
      return buildUnitContextTooltipHtml({
        displayName: defName,
        q: u.q,
        r: u.r,
        ruchLeft: u.ruchLeft,
        ruchMax: u.ruch,
        atak: unitAtak(def),
        obrona: unitObrona(def),
        hp: u.hp,
        maxHp: unitHealth(def),
        category: u.category,
        inGarnizon: u.inGarnizon,
        esc: hudHtmlEsc,
      });
    }

    function buildContextPanelMessage(): string | null {
      const hexMsg = buildHexContextPanelMessage();
      const unitMsg = buildUnitContextPanelMessage();
      if (hexMsg && unitMsg) {
        const u = units.find(x => x.id === selectedId);
        const sameHex = u && lastBHex && u.q === lastBHex.q && u.r === lastBHex.r;
        if (sameHex) {
          return hexMsg + '<div class="cp-sep"></div>' + unitMsg;
        }
      }
      return hexMsg ?? unitMsg ?? null;
    }

    function clearPlayerUnitSelection(): void {
      if (selectedId !== null) clearPlannedMarch(selectedId);
      selectedId = null;
      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      unitRenderer.clearSelectionHex();
      hoverKey = null;
      setArmyListSelectedId(null);
    }

    /** Odznacz jednostkę na mapie świata (Escape / PPM). */
    function dismissPlayerUnitSelectionIfAny(): boolean {
      if (selectedId === null || !isWorldMapUnitMode()) return false;
      clearPlayerUnitSelection();
      refreshD1bHud();
      return true;
    }

    /** Zamknij listy z lewego toolbaru (powrót na czystą mapę). */
    function dismissToolbarSidePanels(): void {
      if (isArmyListHudOpen()) hideArmyListHud();
      if (isCityListHudOpen()) hideCityListHud();
      if (isDiploListHudOpen()) hideDiploListHud();
    }

    /** Listy toolbaru + tryby mapy (budowa, zasięgi, pickery) — czysta mapa / wejście w miasto. */
    function dismissMapOverlayModes(): void {
      dismissToolbarSidePanels();
      if (buildModeOpen) exitBuildMode();
      if (cultureRangeVisible || religionRangeVisible || territoryBorderVisible) {
        cultureRangeVisible = false;
        religionRangeVisible = false;
        territoryBorderVisible = false;
        refreshRangeOverlays();
        refreshTerritoryBorderOverlay();
      }
      hideWondersPicker();
      hideEmpireOverlay();
      hideEmpireDetailPanel();
      hideCityUnitPick();
    }

    function openCityPanelForPlayer(city: City): void {
      hideCityUnitPick();
      hideScienceHubHud();
      hideWikiHubHud();
      hideSciencePicker();
      if (isDiplomacyAudienceOpen()) {
        hideDiplomacyAudience();
        diplomacyAudienceOwnerId = null;
      }
      if (isDiplomacyPanelOpen()) hideDiplomacyPanel();
      dismissMapOverlayModes();
      exitOkolicaMapMode();
      clearPlayerUnitSelection();
      applyCityPanelWorldView(true, city);
      showCityPanel(city, map, () => {
        hideCityPanel();
        applyCityPanelWorldView(false);
        disposeOkolicaOverlay();
        updateHud();
      });
      syncOkolicaOverlay();
      updateHud();
    }

    function selectPlayerUnit(unitId: string, keepListOpen = false): void {
      const u = units.find(x => x.id === unitId);
      if (!u || u.ownerId !== 0) return;
      const stack = playerStackAt(u);
      if (stack.length > 1) syncStackRuchLeft(stack);
      if (isCityPanelOpen()) hideCityPanelFull();
      exitOkolicaMapMode();
      unitRenderer.clearPathRoute();
      hoverKey = null;
      selectedId = u.id;
      lastBHex = { q: u.q, r: u.r };
      if (isSiegeMapPanelOpen()) {
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
      } else {
        reachable = stackCanMove(u)
          ? reachableWithMergeTargets(u)
          : new Set<string>();
        unitRenderer.setHighlight(reachable);
      }
      unitRenderer.setSelectionHex(u.q, u.r, u.ownerId);
      setArmyListSelectedId(u.id);
      if (!keepListOpen) hideArmyListHud();
      if (plannedMarches.has(u.id)) {
        refreshPlannedMarchPreview(u.id);
      }
      refreshD1bHud();
    }

    /** Jednostki gracza na mapie świata z dostępnym ruchem (1 reprezentant/heks), stała kolejność. */
    function movableWorldUnits(): RuntimeUnit[] {
      const seen = new Set<string>();
      const out: RuntimeUnit[] = [];
      for (const u of units) {
        if (u.ownerId !== 0) continue;
        if (u.inGarnizon) continue;
        if (!stackCanMove(u)) continue;
        const key = u.q + ',' + u.r;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(u);
      }
      return out;
    }

    /**
     * C: auto-cykl „bęben" — przejdź do następnej jednostki gracza z dostępnym ruchem
     * (po jednostce `afterId`). Gdy żadna nie ma już ruchu — odznacz (koniec cyklu).
     * Centruje kamerę na wybranej jednostce (jak klik w panelu ARMIE).
     */
    function cycleToNextMovableUnit(afterId: string | null): void {
      if (!isWorldMapUnitMode()) return;
      const list = movableWorldUnits();
      if (list.length === 0) {
        clearPlayerUnitSelection();
        return;
      }
      let idx = 0;
      if (afterId !== null) {
        const cur = list.findIndex(u => u.id === afterId);
        idx = cur >= 0 ? (cur + 1) % list.length : 0;
      }
      const next = list[idx]!;
      selectPlayerUnit(next.id);
      const { x, z } = axialToWorld(next.q, next.r, HEX_R);
      const { dist } = camCtrl.getFocusState();
      camCtrl.focusAt(x, z, dist);
    }

    /** Rozwiązanie jednostki gracza — usuwa z mapy, zwraca ludność + Manpower do miasta. */
    function disbandPlayerUnit(unitId: string): boolean {
      const idx = units.findIndex(x => x.id === unitId);
      if (idx < 0) return false;
      const u = units[idx]!;
      if (u.ownerId !== 0) return false;

      const ep = empireEpochForOwner(0);
      const mpMults = civManpowerMultsForOwner(0);
      const popRefund = UNIT_POPULATION_COST;
      const mpRefund = unitManpowerCostForType(u.typeId, ep, mpMults.maxMult);
      const refundCity = cityAtUnit(u) ?? cities.find(c => c.ownerId === 0);
      if (refundCity) {
        const built = cityBuilt.get(refundCity.id) ?? [];
        const maAkwedukt = built.includes('akwedukt');
        const popCap = cityPopulationCap(maAkwedukt, loadEconParams(data.econParams, _menuDifficulty));
        const refunded = refundUnitSpawnToCity(
          refundCity, ep, popRefund, popCap, mpMults.maxMult, u.typeId,
        );
        refundCity.population = refunded.population;
        refundCity.manpower = refunded.manpower;
      }

      const siegeCityId = u.oblegaCityId;
      const wasGarnizon = u.inGarnizon === true;
      const cityForGarnizon = cityAtUnit(u);

      units.splice(idx, 1);

      if (siegeCityId) {
        const stillMarked = units.some(x => x.oblegaCityId === siegeCityId);
        if (!stillMarked) {
          const sc = cities.find(c => c.id === siegeCityId);
          if (sc?.oblegane) {
            const bId = sc.oblegajacyOwnerId ?? siegeBesiegerByCity.get(siegeCityId);
            const adj = bId !== undefined && units.some(
              x => x.ownerId === bId && hexDistance(x.q, x.r, sc.q, sc.r) === 1,
            );
            if (!adj) endMapSiege(siegeCityId);
          }
        }
      }

      if (wasGarnizon && cityForGarnizon) syncGarnizonForCity(cityForGarnizon);

      if (selectedId === unitId) clearPlayerUnitSelection();
      forceVisibleUnitId = null;
      syncUnitsRender();
      refreshFog();
      refreshSiegeMarkers();

      const cityLabel = refundCity?.name ?? 'imperium';
      showHintMessage(
        u.typeId + ' rozwiązany — +' + popRefund + ' ludność, +' + formatManpower(mpRefund) + ' MP → ' + cityLabel,
        4000,
      );
      refreshD1bHud();
      return true;
    }

    // -------------------------------------------------------------------
    // Mechanizm "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md) — decyzje UX wdrożone:
    //   koszt = max(0, koszt_nowej - koszt_starej) w Pieniądzu (dopłata; sidegrade/
    //     downgrade = 0, bez zwrotu);
    //   tura = zużywa ruch (ruchLeft = 0 po zamianie);
    //   zasięg = CAŁE terytorium gracza (decyzja właściciela, zmiana zakresu 2026-07-19) —
    //     dowolny heks należący do gracza (isPlayerTerritoryHex), NIE tylko garnizon miasta;
    //     gdy jednostka stoi w mieście, bramka koszary/braz-access nadal per to miasto,
    //     poza miastem — "OR po wszystkich miastach gracza" (replaceAvailabilityCtxEmpireWide);
    //   HP = zachowany % (newHp = round(newMaxHp * oldHp/oldMaxHp), min 1);
    //   limit = raz na turę na jednostkę (RuntimeUnit.replaceUsedThisTurn, reset w N: End turn);
    //   nacja = tylko własna (unitAllowedForCivNation w availableReplacementsFor, niezmienione);
    //   zakres = JEDNA zaznaczona karta w stosie (selectedId), nie cały stos;
    //   ludność = POMINIĘTA (decyzja właściciela 2026-07-19: "Zastąp" kosztuje WYŁĄCZNIE
    //     Pieniądz — wszystkie 73 jednostki w units.json mają dziś "Ludność"=1, więc
    //     różnicowanie kosztów ludności i tak nic by nie dało; rozliczenie wycofane);
    //   manpower = POMINIĘTE — unitManpowerCost() zależy wyłącznie od epoki imperium, nie
    //     od typu jednostki, więc nie ma tu roli do odegrania w obecnym modelu danych.
    // -------------------------------------------------------------------

    /** Miasto-garnizon jednostki, o ile stoi na heksie WŁASNEGO miasta (cityAtUnit już filtruje ownerId). */
    function unitReplaceGarrisonCity(u: RuntimeUnit): City | undefined {
      return cityAtUnit(u);
    }

    /** Czy jednostka stoi na heksie należącym do terytorium gracza (miasto/posterunek/fort) —
     *  zasięg akcji "Zastąp" (decyzja właściciela: całe terytorium, nie tylko garnizon miasta).
     *  Reużywa dokładnie ten sam mechanizm co bramka trybu budowy (main.ts handleHexClick). */
    function isUnitInPlayerTerritory(u: RuntimeUnit): boolean {
      const nodes = buildAllTerritoryNodes();
      return isPlayerTerritoryHex(u.q, u.r, playerCityNodes(), nodes, 0);
    }

    /** Kontekst dostępności dla availableReplacementsFor — jak productionCtxForCity (cityPanel.ts),
     *  per-miasto garnizonu (bramka koszary/braz-access per to miasto, gdy jednostka w nim stoi). */
    function replaceAvailabilityCtxForCity(city: City): AvailabilityContext {
      const ownImprovements = placedImprovementsForOwner(city.ownerId);
      return {
        epoch: empireEpochForOwner(city.ownerId),
        builtBuildingIds: cityBuilt.get(city.id) ?? [],
        civBonusy: civBonusyForOwnerId(city.ownerId),
        civUnitNacja: unitNacjaForCivKey(civKeyForOwnerId(city.ownerId)),
        // Temat #4: grant "z trasy" dolicza się AND-owo (braz syntetycznie,
        // zelazo OR-em) — patrz placedImprovementsWithBrazTradeGrant/
        // hasKopalniaNaZlozuZelazaOrTradeGrant.
        placedImprovements: placedImprovementsWithBrazTradeGrant(city.ownerId, ownImprovements),
        hasKopalniaNaZlozuZelaza: hasKopalniaNaZlozuZelazaOrTradeGrant(city.ownerId, ownImprovements),
        // audyt #11: "Zastąp" nie może dać drugiej żywej Super-jednostka -- ta sama
        // bramka co productionCtxForCity (cityPanel.ts).
        aliveUnitTypeNames: new Set(units.filter(x => x.ownerId === city.ownerId).map(x => x.typeId)),
        kosztJednostekPace: player.kosztJednostekPace ?? 'niski',
        ownerId: city.ownerId,
        difficulty: _menuDifficulty,
      };
    }

    /** Kontekst dostępności dla availableReplacementsFor, gdy jednostka stoi w POLU (w granicach
     *  terytorium, bez miasta pod nią) — bramka koszary/braz-access "OR po wszystkich miastach
     *  gracza" (decyzja właściciela: Zastąp działa w całym terytorium, nie tylko w garnizonie;
     *  unia builtBuildingIds ze wszystkich miast gracza -> built.has('koszary') /
     *  cityHasPiecHutniczy() zwraca true, gdy KTÓREKOLWIEK miasto spełnia warunek). */
    function replaceAvailabilityCtxEmpireWide(): AvailabilityContext {
      const builtUnion = new Set<string>();
      for (const c of cities) {
        if (c.ownerId !== 0) continue;
        for (const id of cityBuilt.get(c.id) ?? []) builtUnion.add(id);
      }
      const ownImprovements = placedImprovementsForOwner(0);
      return {
        epoch: empireEpochForOwner(0),
        builtBuildingIds: Array.from(builtUnion),
        civBonusy: civBonusyForOwnerId(0),
        civUnitNacja: unitNacjaForCivKey(civKeyForOwnerId(0)),
        placedImprovements: placedImprovementsWithBrazTradeGrant(0, ownImprovements),
        hasKopalniaNaZlozuZelaza: hasKopalniaNaZlozuZelazaOrTradeGrant(0, ownImprovements),
        // audyt #11: jak wyżej (replaceAvailabilityCtxForCity) — całe terytorium gracza.
        aliveUnitTypeNames: new Set(units.filter(x => x.ownerId === 0).map(x => x.typeId)),
        kosztJednostekPace: player.kosztJednostekPace ?? 'niski',
        ownerId: 0,
        difficulty: _menuDifficulty,
      };
    }

    /** Lista zamienników dostępnych TERAZ dla jednostki `u` (pusta gdy poza terytorium gracza).
     *  W garnizonie miasta -> bramka per to miasto; w polu (w granicach terytorium, bez miasta
     *  pod jednostką) -> bramka "OR po wszystkich miastach gracza". */
    function computeUnitReplacements(u: RuntimeUnit): ProductionItem[] {
      if (!isUnitInPlayerTerritory(u)) return [];
      const city = unitReplaceGarrisonCity(u);
      const ctx = city ? replaceAvailabilityCtxForCity(city) : replaceAvailabilityCtxEmpireWide();
      return availableReplacementsFor(u.typeId, data, Array.from(player.zbadane), ctx);
    }

    /** Koszt rekrutacji Pieniądzem jednostki `typeId` (dla dopłaty = nowa - stara). */
    function replaceUnitMoneyCost(typeId: string): number {
      const item = unitProductionItem(
        typeId, data, civBonusyForOwnerId(0), player.kosztJednostekPace ?? 'niski', 0, _menuDifficulty,
      );
      return item?.koszt ?? 0;
    }

    /** Otwórz modal wyboru zamiennika dla jednostki `u` (akcja "Zastąp" w ArmyStackHud). */
    function openUnitReplacePicker(u: RuntimeUnit): void {
      if (u.ownerId !== 0) return;
      if (!isUnitInPlayerTerritory(u)) {
        showHintMessage('Zastąp: dostępne tylko na własnym terytorium.', 3000);
        return;
      }
      if (u.replaceUsedThisTurn) {
        showHintMessage('Zastąp: już wykorzystano w tej turze.', 2500);
        return;
      }
      const replacements = computeUnitReplacements(u);
      if (replacements.length === 0) {
        showHintMessage('Zastąp: brak dostępnych zamienników tego typu.', 2500);
        return;
      }
      const oldCost = replaceUnitMoneyCost(u.typeId);
      showUnitReplacePicker({
        unitName: u.typeId,
        skarb: player.skarbiec,
        options: replacements.map(it => {
          const udef = lookupUnitDef(it.id);
          return {
            id: it.id,
            name: it.nazwa,
            icon: unitIconSvg(udef, it.id),
            surcharge: Math.max(0, it.koszt - oldCost),
            atk: unitAtak(udef),
            def: unitObrona(udef),
            hpMax: unitHealth(udef),
          };
        }),
        onPick: (newTypeId) => performUnitReplace(u.id, newTypeId),
      });
    }

    /** Wykonaj zamianę jednostki `unitId` na `newTypeId` (runtime, po wyborze w modalu). */
    function performUnitReplace(unitId: string, newTypeId: string): void {
      const u = units.find(x => x.id === unitId);
      if (!u || u.ownerId !== 0) return;
      if (!isUnitInPlayerTerritory(u)) return;
      if (u.replaceUsedThisTurn) return;
      const newDef = lookupUnitDef(newTypeId);
      if (!newDef) return;

      const surcharge = Math.max(0, replaceUnitMoneyCost(newTypeId) - replaceUnitMoneyCost(u.typeId));
      if (player.skarbiec < surcharge) {
        showHintMessage('Zastąp: brak Pieniądza na dopłatę (' + surcharge + ' 💰)', 3000);
        return;
      }

      const oldDef = lookupUnitDef(u.typeId);
      const oldMaxHp = unitHealth(oldDef);
      const newMaxHp = unitHealth(newDef);
      const oldHp = u.hp ?? oldMaxHp;
      const newHp = Math.max(1, Math.round(newMaxHp * (oldMaxHp > 0 ? oldHp / oldMaxHp : 1)));

      player.skarbiec -= surcharge;

      const oldTypeId = u.typeId;
      const isSuper = newDef['Super-jednostka'] === 'TAK';
      u.typeId = newTypeId;
      u.category = categoryOf(newTypeId, newDef['Rola (linia)'] ?? '', isSuper, newDef['Typ']);
      u.hp = newHp;
      u.ruchLeft = 0;
      u.replaceUsedThisTurn = true;

      syncUnitsRender();
      refreshFog();
      refreshD1bHud();

      // Etykieta miasta w toaście: garnizon jednostki, a poza miastem (całe terytorium
      // gracza) — pierwsze miasto gracza jako fallback (ten sam wzorzec co disbandPlayerUnit).
      const replaceCity = unitReplaceGarrisonCity(u) ?? cities.find(c => c.ownerId === 0);
      showHintMessage(
        oldTypeId + ' → ' + newTypeId
          + (surcharge > 0 ? ' (dopłata ' + surcharge + ' 💰)' : ' (bez dopłaty)')
          + (replaceCity ? (' — ' + replaceCity.name) : ''),
        3500,
      );
    }

    function buildPlayerCityListEntries(): CityListEntry[] {
      return cities
        .filter(c => c.ownerId === 0)
        .map(c => {
          const prod = cityProd.get(c.id);
          const front = prod ? frontItem(prod) : null;
          const productionLine = front
            ? `${front.nazwa} • ${prod?.postep ?? 0}/${front.koszt} 🔨`
            : 'Kolejka pusta';
          const gar = c.garnizon ?? 0;
          return {
            id: c.id,
            name: c.name,
            population: c.population,
            productionLine,
            metaLine: gar > 0 ? `Garnizon: ${gar}` : undefined,
          };
        });
    }

    function buildPlayerArmyListEntries(): ArmyListEntry[] {
      const playerUnits = units.filter(u => u.ownerId === 0);
      const stacks = new Map<string, typeof playerUnits>();
      for (const u of playerUnits) {
        const key = `${u.q},${u.r}`;
        const arr = stacks.get(key);
        if (arr) arr.push(u);
        else stacks.set(key, [u]);
      }
      const out: ArmyListEntry[] = [];
      for (const group of stacks.values()) {
        const lead = group[0]!;
        const types = [...new Set(group.map(u => u.typeId))];
        const name = group.length === 1
          ? lead.typeId
          : types.length === 1
            ? `${types[0]!} ×${group.length}`
            : formatArmiaLabel(group.length);
        const ruchLeft = Math.min(...group.map(u => u.ruchLeft));
        const ruchMax = Math.max(...group.map(u => u.ruch));
        out.push({
          id: lead.id,
          name,
          unitCount: group.length,
          hexLabel: `(${lead.q}, ${lead.r})`,
          detailLine: ruchLeft > 0
            ? `Ruch: ${ruchLeft}/${ruchMax}` + (group.length > 1 ? ' · armia' : '')
            : 'Ruch wykorzystany w tej turze',
          metaLine: types.length > 1 ? types.join(', ') : undefined,
          ruchLeft,
          ruchMax,
        });
      }
      out.sort((a, b) => a.name.localeCompare(b.name, 'pl'));
      return out;
    }

    function buildPlayerDiploRelations(): DiploRelation[] {
      const rels: DiploRelation[] = [];
      for (const [key, rel] of diplomacyRelations.entries()) {
        const parts = key.split('_');
        const a = parseInt(parts[0] ?? '0', 10);
        const b = parseInt(parts[1] ?? '0', 10);
        if (a !== 0 && b !== 0) continue;
        const otherId = a === 0 ? b : a;
        if (!diplomaticContactEstablished.has(otherId)) continue;
        const contacted = getDiplomaticContacts();
        const layer = diplomacyLayerForOwner(
          otherId,
          simplifiedDiplomacyOwners,
          foreignTypeOwners,
          contacted,
        );
        rels.push({
          ownerId: otherId,
          civ: ownerDiploLabel(otherId),
          isCityState: isOwnerClusterCityState(otherId, ownerCityStateOpts()),
          ikonaId: civTypeForOwner(otherId),
          kolorHex: civKolorHexFn(otherId),
          layer,
          tier: relationTier(rel),
          zaufanie: Math.round(Math.max(0, Math.min(100, rel.zaufanie ?? 0))),
          respekt: objectiveRespektPctToward(otherId),
          contactEstablished: diplomaticContactEstablished.has(otherId),
        });
      }
      rels.sort((x, y) => x.civ.localeCompare(y.civ, 'pl'));
      return rels;
    }

    function buildPlayerDiploListEntries(): DiploListEntry[] {
      return buildPlayerDiploRelations()
        .map(diploListEntryFromRelation)
        .filter((e): e is DiploListEntry => e !== null);
    }

    function closeAllMapToolbarModes(): void {
      if (buildModeOpen) exitBuildMode();
      hideCityListHud();
      hideArmyListHud();
      hideDiploListHud();
      hideScienceHubHud();
      hideWikiHubHud();
      hideSciencePicker();
      hideTechTreeView();
      hideEmpireDetailPanel();
      if (isDiplomacyAudienceOpen()) {
        hideDiplomacyAudience();
        diplomacyAudienceOwnerId = null;
      }
      if (isDiplomacyPanelOpen()) hideDiplomacyPanel();
      if (isCityPanelOpen()) hideCityPanelFull();
      hideHexContextPanel();
    }

    function toggleDiploListFromToolbar(): void {
      clearPlayerUnitSelection();
      if (isDiploListHudOpen()) {
        hideDiploListHud();
        refreshD1bHud();
        return;
      }
      closeAllMapToolbarModes();
      showDiploListHud();
      refreshD1bHud();
    }

    function openScienceTreeDocked(focusTechId?: string): void {
      if (!isScienceHubHudOpen()) showScienceHubHud();
      showSciencePickerDocked(0, {
        focusTechId,
        onClose: () => refreshD1bHud(),
      });
      refreshScienceHubIfOpen();
      refreshD1bHud();
    }

    function toggleScienceHubFromToolbar(): void {
      clearPlayerUnitSelection();
      if (isScienceHubHudOpen() || isSciencePickerOpen()) {
        hideScienceHubHud();
        hideSciencePicker();
        refreshD1bHud();
        return;
      }
      closeAllMapToolbarModes();
      showScienceHubHud();
      refreshD1bHud();
    }

    function toggleWikiFromToolbar(): void {
      if (isWikiHubHudOpen()) {
        hideWikiHubHud();
        refreshD1bHud();
        return;
      }
      clearPlayerUnitSelection();
      hideCityListHud();
      hideArmyListHud();
      hideDiploListHud();
      hideScienceHubHud();
      hideSciencePicker();
      if (isDiplomacyAudienceOpen()) {
        hideDiplomacyAudience();
        diplomacyAudienceOwnerId = null;
      }
      if (isDiplomacyPanelOpen()) hideDiplomacyPanel();
      if (isCityPanelOpen()) hideCityPanelFull();
      hideHexContextPanel();
      showWikiHubHud();
      refreshD1bHud();
    }

    function selectPlayerResearchSlug(techSlug: string): void {
      const techName = techNameFromSlug(techSlug) ?? techSlug;
      const ok = setPlayerResearchTarget(player, techName, data.tech, researchGateForOwner(0));
      if (ok) {
        console.log('[Nauka] Gracz wybrał cel:', techName);
        updateHud();
        refreshScienceHubIfOpen();
        refreshSciencePickerIfOpen();
        refreshTechTreeViewIfOpen();
      } else {
        console.warn('[Nauka] Nie można ustawić celu:', techSlug);
      }
    }

    // TEMAT 10 — UI kolejki badań (C-RES-Q1=C/Q2=C/Q3=A/Q4=A). Silnik (playerState.ts)
    // gotowy i NIEZMIENIONY — poniższe helpery to tylko cienka warstwa UI nad
    // enqueueResearchTarget/dequeueResearchTarget/getResearchPlanSnapshot.

    /** Odśwież wszystkie powierzchnie UI, które pokazują stan/plan badań. */
    function refreshResearchUiSurfaces(): void {
      updateHud();
      refreshScienceHubIfOpen();
      refreshSciencePickerIfOpen();
      refreshTechTreeViewIfOpen();
    }

    /** Jedna pozycja planu badań (aktywny cel lub pozycja w kolejce) do UI. */
    interface ResearchPlanEntryInfo {
      /** Slug węzła drzewka (jak ScienceHubEntry.id / techToSlug). */
      id: string;
      name: string;
      isActive: boolean;
      /** Pozycja 1..RESEARCH_QUEUE_MAX (1 = aktywny cel). */
      pos: number;
    }

    /** Plan badań (aktywny + kolejka) do wyświetlenia w hub-liście i drzewku. */
    function buildResearchPlanSnapshot(): ResearchPlanEntryInfo[] {
      const plan = getResearchPlanSnapshot(player);
      return plan.map((techName, idx) => ({
        id: techToSlug(techName),
        name: techName,
        isActive: idx === 0,
        pos: idx + 1,
      }));
    }

    /**
     * C-RES-Q1=C: klik technologii na hub-liście LUB w drzewku = dodaj do
     * planu badań. Gdy plan pusty — pierwszy dodany tech od razu staje się
     * aktywnym celem (patrz enqueueResearchTarget w playerState.ts).
     */
    function enqueueOrSetPlayerResearchSlug(techSlug: string): void {
      const techName = techNameFromSlug(techSlug) ?? techSlug;
      const ok = enqueueResearchTarget(player, techName, data.tech);
      if (ok) {
        console.log('[Nauka] Gracz dodał do planu badań:', techName);
        refreshResearchUiSurfaces();
      } else {
        console.warn('[Nauka] Nie można dodać do planu badań:', techSlug);
      }
    }

    /** Usuwa pozycję z planu badań (aktywny cel lub pozycję w kolejce). */
    function dequeuePlayerResearchSlug(techSlug: string): void {
      const techName = techNameFromSlug(techSlug) ?? techSlug;
      const ok = dequeueResearchTarget(player, techName);
      if (ok) {
        console.log('[Nauka] Gracz usunął z planu badań:', techName);
        refreshResearchUiSurfaces();
      } else {
        console.warn('[Nauka] Pozycja nie występuje w planie badań:', techSlug);
      }
    }

    /**
     * C-RES-Q2=C: zmiana kolejności planu przez drag&drop. Silnik nie ma
     * natywnej operacji "przesuń" — realizujemy ją jako pełne wyczyszczenie
     * planu (dequeueResearchTarget dla każdej pozycji) i odbudowanie w nowej
     * kolejności (enqueueResearchTarget), zamiast pisać nową logikę silnika.
     * fromIdx/toIdx to indeksy w getResearchPlanSnapshot() (0 = aktywny cel).
     */
    function reorderPlayerResearchQueue(fromIdx: number, toIdx: number): void {
      const plan = getResearchPlanSnapshot(player);
      if (
        fromIdx < 0 || fromIdx >= plan.length ||
        toIdx < 0 || toIdx >= plan.length ||
        fromIdx === toIdx
      ) {
        return;
      }
      const reordered = plan.slice();
      const [moved] = reordered.splice(fromIdx, 1);
      if (moved === undefined) return;
      reordered.splice(toIdx, 0, moved);

      for (const techName of plan) dequeueResearchTarget(player, techName);
      for (const techName of reordered) enqueueResearchTarget(player, techName, data.tech);

      console.log('[Nauka] Gracz zmienił kolejność planu badań:', reordered);
      refreshResearchUiSurfaces();
    }

    function extraCityPanelConfig() {
      return {
        getResourceAccess: (cityId: string) => {
          const c = cities.find(x => x.id === cityId);
          if (!c) return { potential: [], active: [] };
          const builtIds = cityBuilt.get(cityId) ?? [];
          const oid = c.ownerId;
          const ownImprovements = placedImprovementsForOwner(oid);
          // Temat #4: Koń "z trasy" dolicza się do odblokowania imperium (jak w
          // improvement-build.ts) — OR, nigdy substytut własnego odblokowania.
          const empireLivestockUnlocks = computeEmpireLivestockUnlocks(ownImprovements, map, String(oid));
          if (hasTradeRouteResourceAccess(tradeRouteResourceGrants, oid, 'kon')) {
            empireLivestockUnlocks.add('kon');
          }
          const access = getCityResourceAccessForCity(
            {
              id: c.id,
              q: c.q,
              r: c.r,
              population: c.population,
              kulturaSkumulowana: (c as { kultura?: number }).kultura ?? 0,
            },
            map,
            placedImprovementsWithBrazTradeGrant(oid, ownImprovements),
            empireEpochForOwner(oid),
            { builtIds, ownerId: String(oid), empireLivestockUnlocks },
          );
          // Temat #4 (UI): źródło "szlak handlowy z X" dla etykiet przyznanych przez
          // trasę — tylko gdy etykieta faktycznie aktywna (grant + dostęp lokalny
          // spełniony, np. Brąz nadal wymaga własnego Pieca hutniczego w TYM mieście).
          const tradeSources: Record<string, string> = {};
          const brazSrc = tradeRouteResourceSourceLabel(oid, 'braz');
          if (brazSrc && access.active.includes('Brąz')) tradeSources['Brąz'] = brazSrc;
          const konSrc = tradeRouteResourceSourceLabel(oid, 'kon');
          if (konSrc && access.active.includes('Koń')) tradeSources['Koń'] = konSrc;
          return Object.keys(tradeSources).length ? { ...access, tradeSources } : access;
        },
        getEmpireResourceAccess: (ownerId: number) => empireActiveResourceLabelsForOwner(ownerId),
        getEmpireBuiltIds: (ownerId: number) => [...empireBuiltIdsForOwner(ownerId)],
        getEmpireStock: (ownerId: number) => citySurowceSumForOwner(ownerId),
        getCityHasCoastOrRiver: (cityId: string) => {
          const c = cities.find(x => x.id === cityId);
          return c ? cityHasCoastOrRiverAccess(c) : false;
        },
        getHasKopalniaNaZlozuZelaza: () => hasKopalniaNaZlozuZelazaOrTradeGrant(0, placedImprovementsForOwner(0)),
        // audyt #11: limit 1 żywej Super-jednostka na cywilizację -- nazwy (typeId)
        // jednostek TEGO ownera aktualnie żywych na mapie (respawn po śmierci działa
        // samoczynnie, bo liczymy z bieżącego rosteru `units`, nie z historii).
        getAliveUnitTypeNames: (ownerId: number) =>
          new Set(units.filter(x => x.ownerId === ownerId).map(x => x.typeId)),
        isAutoManageEnabled: (cityId: string) => autoManageCities.has(cityId),
        getGrowthMult: (cityId: string) => growthMultMap.get(cityId) ?? 1,
        // #17: Bilans plonów w panelu miasta musi mnożyć plony Porządkiem tak samo
        // jak silnik (turn-economy.ts applyOrderYieldMults) — bez tego panel zaniżał
        // Pracę/Pieniądz/Naukę/Kulturę względem realnego ticku.
        getOrderYieldMults: (cityId: string) => orderMultMap.get(cityId) ?? null,
        getEmpireFoodState: (oid: number) => empireFoodStates.get(oid) ?? null,
        getEmpireFoodTick: (oid: number) => getLastEmpireFoodTick(oid) ?? null,
        onCityFoodSplitChange: (cityId: string, pct: number) => {
          const city = cities.find(c => c.id === cityId);
          if (!city || city.ownerId !== 0) return;
          city.procentRozwoj = Math.min(100, Math.max(0, pct));
          markCityStateDirty(); // D10: podział żywności (wojsko vs miasto) → przelicz
          updateHud();
        },
        getCultureState: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return null;
          const kulturaSuma = (city as { kultura?: number }).kultura ?? 0;
          const cp = loadCultureParams(data.societyParams, _menuDifficulty);
          return {
            kulturaSuma,
            przyrost: lastCityKulturaTick.get(cityId) ?? 0,
            borderRadius: cityBorderRadius(kulturaSuma, cp),
            thresholds: cultureThresholds(cp),
          };
        },
        getReligionState: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return null;
          const rp = loadReligionParams(data.societyParams, _menuDifficulty);
          const ownRel = ownerReligionForOwnerId(city.ownerId);
          const rel = resolvedCityReligion(city);
          const dom = dominantReligion(rel, rp);
          // #70: bramka świątyni jak w silniku (turn tick main.ts ~11981) — bez niej
          // panel pokazywał wpływ szczęścia = 0 zamiast realnej kary karaBrakReligii.
          const builtIds = cityBuilt.get(cityId) ?? [];
          return {
            dominujaca: dom.religion ?? '—',
            udzialPct: Math.round(dom.share * 100),
            wplywSzczescie: religionHappiness(rel, ownRel, rp, builtIds.includes('swiatynia')),
            przyrostWiernych: lastReligionSpreadByCity.get(cityId) ?? 0,
          };
        },
        getEmpireHud: (oid: number) => {
          if (oid !== 0) return null;
          const hs = buildHudState();
          const pc = cities.filter(c => c.ownerId === 0);
          const stateRel = ownerReligionForOwnerId(0);
          const relAgg = aggregateReligionEmpire(
            pc.map(c => ({
              state: resolvedCityReligion(c),
              spreadDelta: lastReligionSpreadByCity.get(c.id) ?? 0,
            })),
            stateRel,
          );
          return {
            pracaPool: hs.praca,
            pracaRate: hs.pracaRate,
            zloto: hs.zloto,
            zlotoRate: hs.zlotoRate,
            nauka: hs.nauka,
            naukaRate: hs.naukaRate ?? 0,
            zywnoscReserve: parseInt(hs.zywnoscLabel, 10) || 0,
            zywnoscRate: hs.zywnoscRate ?? 0,
            kulturaRate: hs.kulturaRate ?? 0,
            religionStock: relAgg.stateAdherents,
            religionRate: relAgg.spreadRateTotal,
            stateReligion: stateRel,
            religionSharePct: relAgg.sharePct,
          };
        },
        getOkolicaState: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return null;
          return {
            focus: city.okolicaFocus ?? 'zrownowazone',
            tryb: city.okolicaTryb ?? 'auto',
            reczne: city.okolicaReczne,
          };
        },
        getCityWorkedRange: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return undefined;
          return cityRangeForPopulation(city.population);
        },
        getWorkedTiles: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return undefined;
          return workedHexCoordsForCity(city, map, buildAllTerritoryNodes());
        },
        onOkolicaFocusChange: (cityId: string, focus: import('./game/cities').OkolicaFocus) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          city.okolicaFocus = focus;
          city.okolicaTryb = 'auto';
          delete city.okolicaReczne;
          const labels: Record<string, string> = {
            zywnosc: 'Żywność',
            produkcja: 'Produkcja',
            podatki: 'Podatki',
            zrownowazone: 'Zrównoważone',
          };
          showHintMessage(
            `${city.name}: auto · priorytet ${labels[focus] ?? focus} — pola przypisane automatycznie`,
            3200,
          );
          updateHud();
          refreshCityPanelIfOpen();
          syncOkolicaOverlay();
        },
        onOkolicaEnterManual: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          city.okolicaTryb = 'reczny';
          const hasReczne = city.okolicaReczne && Object.values(city.okolicaReczne).some(n => n > 0);
          if (!hasReczne) city.okolicaReczne = seedReczneFromAuto(city, map, buildAllTerritoryNodes());
          showHintMessage(
            `${city.name}: tryb ręczny — klik heks = przypisz/zabierz 👤`,
            3200,
          );
          updateHud();
          refreshCityPanelIfOpen();
          syncOkolicaOverlay();
        },
        onOkolicaRestoreAuto: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          city.okolicaTryb = 'auto';
          delete city.okolicaReczne;
          refreshCityPanelIfOpen();
          updateHud();
          syncOkolicaOverlay();
        },
        onOkolicaTileAdjust: (cityId: string, q: number, r: number, delta: number) => {
          applyOkolicaTileAdjust(cityId, q, r, delta);
        },
        onOpenMapForOkolica: (cityId: string) => {
          enterOkolicaMapMode(cityId);
        },
        onSwitchCity: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          applyCityPanelWorldView(true, city);
          syncOkolicaOverlay();
          updateHud();
        },
        getBudowaState: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return null;
          return {
            focus: city.budowaFocus ?? 'zrownowazone',
            tryb: city.budowaTryb ?? DEFAULT_BUDOWA_TRYB,
          };
        },
        onBudowaFocusChange: (cityId: string, focus: BudowaFocus) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          city.budowaFocus = focus;
          city.budowaTryb = 'auto';
          const labels: Record<BudowaFocus, string> = {
            wzrost: 'Wzrost',
            wojsko: 'Wojsko',
            kultura: 'Kultura',
            prawo: 'Prawo',
            produkcja: 'Produkcja',
            zrownowazone: 'Zrównoważone',
          };
          const enqueued = tryAutoEnqueueBuild(cityId);
          showHintMessage(
            enqueued
              ? `${city.name}: auto budowa · ${labels[focus]} → ${enqueued.nazwa}`
              : `${city.name}: auto budowa · profil ${labels[focus] ?? focus}`,
            3200,
          );
          updateHud();
          refreshCityPanelIfOpen();
        },
        onBudowaEnterManual: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return;
          city.budowaTryb = 'reczny';
          showHintMessage(`${city.name}: ręczna kolejka budowy`, 2800);
          refreshCityPanelIfOpen();
        },
        getUnitsAt: (q: number, r: number) => {
          const city = cities.find(c => c.q === q && c.r === r);
          if (!city) return [];
          return unitsOnCityHexForLaw(units, q, r, city.ownerId)
            .map(u => {
              const def = lookupUnitDef(u.typeId);
              const hpMax = unitHealth(def);
              return {
                nazwa: u.typeId,
                category: u.category,
                health: hpMax,
                maxHealth: hpMax,
              };
            });
        },
        getBuildingCostPace: () => player.buildingCostPace ?? 'niski',
        getKosztJednostekPace: () => player.kosztJednostekPace ?? 'niski',
        getWzrostLudnosciPace: () => player.wzrostLudnosciPace ?? 'wysoki',
        getDifficulty: (): GameDifficulty => _menuDifficulty,
        // R-CUDA-TAB (2026-07-24, decyzja Maciej WARIANT A): cuda budowane WYŁĄCZNIE
        // z listy produkcji miasta — bez osobnego katalogu w lewym menu. Reużywa
        // dokładnie tej samej, już filtrowanej per-civ listy (wonderHudEntries →
        // listBuildableWondersForOwner(0)) i tej samej ścieżki enqueue
        // (enqueueWonderForPlayer) co panel „Budowa ulepszeń" — zero nowej logiki
        // silnika, zero zmian w AI (main.ts listBuildableWondersForOwner dla AI
        // nietknięte).
        getBuildableWonders: (_cityId: string) => wonderHudEntries(),
        onBuildWonder: (_cityId: string, wonderId: string) => {
          enqueueWonderForPlayer(wonderId);
        },
      };
    }

    initEmpireFoodStates();

    // -----------------------------------------------------------------------
    // AI / Barbarians / Victory state
    // -----------------------------------------------------------------------

    /**
     * Per-AI research state: Set of zbadane tech ids per ownerId.
     * Uzupełniane przez runAiResearchForOwner (researchStep + pula Nauki).
     */
    const aiResearchDone = new Map<number, Set<string>>();

    /**
     * Cywilizacje SKASOWANE (przejęcie-stolicy Zdarzenie 2 — ostatnie miasto
     * stracone). Q5=B: pełne usunięcie z listy graczy/dyplomacji. Filtrowane z
     * aiOwnerList (pętla tur AI) niezależnie od ewentualnych osamotnionych
     * jednostek w polu — patrz eliminateOwner() (~stolica-przejęcie ~9410).
     */
    const eliminatedOwners = new Set<number>();

    /**
     * Mapa ownerId -> civType (ikonaId z civs.json) dla AI rywali.
     * Wypełniana przy starcie gry z aiStartHexes (bez osadników AI na mapie).
     * Gracz (ownerId 0) zawsze dostaje typ z player.civType.
     */
    const aiOwnerCivMap = new Map<number, string>();
    /** Etykieta UI per owner AI (N-2A: miasto rywala klastra). */
    const ownerDisplayName = new Map<number, string>();
    /** Ownerzy z uproszczoną dyplomacją (ten sam typ w klastrze). */
    const simplifiedDiplomacyOwners = new Set<number>();
    /** Obcy typ — pełna dyplomacja dopiero po kontakcie (D-START-3A). */
    const foreignTypeOwners = new Set<number>();
    /** Wszystkie miasta AI z klastra — profil kopia_typu_obronna (P0-05). */
    const typCityCopyOwners = new Set<number>();

    /**
     * R-TRUDNOSC-1 (Maciej 2026-07-24, rozszerzenie): poziom trudności AI (1/2/3) DLA
     * KONKRETNEGO OWNERA -- miasta-państwa (typCityCopyOwners, kopie obronne) dostają
     * poziom z NOWEGO suwaka (_menuCityStateDifficulty), zwykłe AI nadal z głównej
     * trudności gry (_menuDifficulty). Zasila loadDifficultyParams(data, poziom) ->
     * DifficultyParams (bonusProdukcja/bonusWalka/agresjaMnoznik/celObranie) przekazywane
     * do decideAITurn/decideDefensiveCopyTurn (opts.poziomTrudnosci) -- w tym bonusProdukcja
     * realnie używane w chooseCityProduction (ai.ts) DLA OBU ścieżek (zwykłe AI i
     * defensiveCopy), więc bez tego globalny "Trudny" podbijał priorytet ekonomii
     * miast-państw niezależnie od ich własnego suwaka. bonusWalka aktualnie NIE jest
     * konsumowane nigdzie w combat.ts/ai.ts (martwe pole w DifficultyParams) -- ta funkcja
     * i tak przekazuje dla niego poprawną wartość na przyszłość (zero dodatkowego ryzyka).
     */
    function aiDiffLevelForOwner(ownerId: number): 1 | 2 | 3 {
      const src = typCityCopyOwners.has(ownerId) ? _menuCityStateDifficulty : _menuDifficulty;
      return src === 'hard' ? 3 : src === 'easy' ? 1 : 2;
    }
    /**
     * R-MP-DYPL-PROAKT dokończenie (Maciej 2026-07-24): odpowiednik aiDiffLevelForOwner,
     * ale zwraca string GameDifficulty ('easy'/'normal'/'hard') zamiast poziomu 1|2|3 --
     * karmi ostatni argument decideAIDiplomacy (loadDefaultAIDiplomacyProgs -> progWojnaSila/
     * progHandel, oraz canAiProposeOneShotGoldGift/aiOneShotGiftGoldMultiplier dla darów
     * jednorazowych). Ta sama gałąź co aiDiffLevelForOwner: miasta-państwa (typCityCopyOwners)
     * dostają _menuCityStateDifficulty, pełne AI nadal _menuDifficulty bez zmian.
     * _menuCityStateDifficulty zawsze ma wartość (fallback na `diff` w applyMenuParams,
     * nigdy null) -- brak dodatkowej konwersji/fallbacku potrzebny tutaj.
     */
    function effectiveGameDifficultyForOwner(ownerId: number): GameDifficulty {
      return typCityCopyOwners.has(ownerId) ? _menuCityStateDifficulty : _menuDifficulty;
    }
    /** N-1A: nazwa pierwszego miasta gracza z miasta_panstwa[0]. */
    let clusterPlayerStartCityName = playerStartCityName(data.civs, _menuCivId, data.cityNamesPools);
    /** Miasta-państwa tego samego typu — spawn po założeniu pierwszego miasta gracza. */
    let pendingSameTypeRivalCount = 0;
    /** Pre-planowane hexy państw gracza (klaster z mapgen). */
    let pendingSameTypeRivalHexes: Array<{ q: number; r: number }> = [];
    /** Stolice klastrów obcych typów — ekspansyjna AI. */
    const clusterCapitalOwnerIds = new Set<number>();
    /** Rozmieszczenie klastrów — kontekst AI (faza 1 konsolidacji). */
    let clusterPlacement: ClusterPlacement | null = null;
    let clusterStartSeed = 42;

    function fillAiOwnerCivMap(playerCivId: string, rosterSeed: number): void {
      aiOwnerCivMap.clear();
      const aiOwnerIds = aiStartHexes.map(a => a.ownerId);
      const allCivIds = civIdsAvailableAtGameEpoch(
        data.civs.cywilizacje as Parameters<typeof civIdsAvailableAtGameEpoch>[0],
        _menuEpochId,
      );
      const aktywneTypy = _menuCivTypesCount || aktywneTypyFromMapLabel(_menuMapSize);
      const aiMap = assignAiCivTypes({
        allCivIds,
        playerCivId,
        aiOwnerIds,
        aktywneTypy,
        seed: rosterSeed,
      });
      for (const [oid, civ] of aiMap) {
        aiOwnerCivMap.set(oid, civ);
      }
    }

    /** Przywraca roster AI z sejwu (meta) lub z ownerId w miastach/jednostkach (legacy). */
    function restoreAiRosterFromSave(saved: SaveGame): void {
      const savedRoster = saved.meta?.aiOwnerCivMap as Array<[number, string]> | undefined;
      const savedNames = saved.meta?.ownerDisplayName as Array<[number, string]> | undefined;
      aiOwnerCivMap.clear();
      ownerDisplayName.clear();
      if (savedRoster?.length) {
        for (const [oid, civ] of savedRoster) aiOwnerCivMap.set(oid, civ);
      } else {
        const ownerIds = [...new Set([
          ...saved.cities.map(c => c.ownerId),
          ...saved.units.map(u => u.ownerId),
        ].filter(id => id !== 0))].sort((a, b) => a - b);
        const civId = player.civType || _menuCivId || 'grecy';
        const allCivIds = civIdsAvailableAtGameEpoch(
          data.civs.cywilizacje as Parameters<typeof civIdsAvailableAtGameEpoch>[0],
          _menuEpochId,
        );
        const aiMap = assignAiCivTypes({
          allCivIds,
          playerCivId: civId,
          aiOwnerIds: ownerIds,
          aktywneTypy: _menuCivTypesCount || aktywneTypyFromMapLabel(_menuMapSize),
          seed: saved.seed ?? _gameSeed,
        });
        for (const [oid, civ] of aiMap) aiOwnerCivMap.set(oid, civ);
        diagWarn('load', `legacy save — roster AI z ownerId (${ownerIds.length} nacji)`);
      }
      if (savedNames?.length) {
        for (const [oid, label] of savedNames) ownerDisplayName.set(oid, label);
      }
      for (const c of saved.cities) {
        if (c.ownerId > 0 && !ownerDisplayName.has(c.ownerId)) {
          ownerDisplayName.set(c.ownerId, c.name);
        }
      }
    }

    /** Walidacja spójności sejwu z bieżącą mapą (diag + toast). */
    function validateLoadedSave(saved: SaveGame): string[] {
      const issues: string[] = [];
      const maxCitiesReasonable = Math.max(24, saved.tura * 12 + 12);
      if (saved.cities.length > maxCitiesReasonable) {
        issues.push(`dużo miast (${saved.cities.length}) na turę ${saved.tura}`);
      }
      let offMap = 0;
      for (const c of saved.cities) {
        if (!map.hexes[`${c.q},${c.r}`]) offMap++;
      }
      if (offMap > 0) {
        issues.push(`${offMap} miast poza heksami mapy (${map.szerokoscQ}×${map.wysokoscR})`);
      }
      if (typeof saved.seed === 'number' && saved.seed > 0 && saved.seed !== _gameSeed) {
        issues.push(`seed save (${saved.seed}) ≠ seed mapy (${_gameSeed})`);
      }
      return issues;
    }

    /** Reset flag/modali po zawieszeniu lub przed load — odblokowuje input. */
    function resetStuckInteractiveState(): void {
      anim = null;
      isAnimating = false;
      forceVisibleUnitId = null;
      hideGamePauseMenu();
      hideSaveLoadDialog();
      hideNewGameFlow();
      if (isCityPanelOpen()) hideCityPanelFull();
      hideCityUnitPick();
      dismissMapOverlayModes();
      if (isPostBattleSummaryOpen()) hidePostBattleSummary();
      selectedId = null;
      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      hoverKey = null;
      diagInfo('session', 'resetStuckInteractiveState');
    }

    /** Pełny reset UI / flag przed wczytaniem innej gry (nie czyści mapy — to robi rebuild). */
    function prepareSessionForLoad(): void {
      resetStuckInteractiveState();
      playtestWalkaActive = false;
      bitwaDuzaActive = false;
      playtestMiastoActive = false;
      galleryOn = false;
      foundCityMode = false;
      buildModeOpen = false;
      activeImprovementKey = null;
      revealAllLand = false;
      hideSiegeMapPanel();
      hideCityAttackChoice();
      clearSiegeHtmlLabels();
      removeBuildGhosts();
      diagInfo('session', 'prepareSessionForLoad');
    }

    /** Czy przed restore trzeba przebudować mapę 3D (inna gra / inny seed / inny rozmiar). */
    function loadNeedsMapRebuild(
      loadParams: NewGameParams | null,
      loadSeed: number,
      fromInGamePause: boolean,
    ): boolean {
      if (!loadParams || loadSeed <= 0) return false;
      if (!fromInGamePause) return true;
      if (loadSeed !== _gameSeed) return true;
      const ms = loadParams.mapSize || 'Standardowy';
      if (ms !== _menuMapSize) return true;
      const ts = loadParams.typSwiata
        ?? typSwiataFromMenuLabel(loadParams.worldType || 'Kontynenty');
      if (ts !== _menuTypSwiata) return true;
      return false;
    }
    function civKeyForOwnerId(ownerId: number): string {
      return ownerId === 0
        ? (player.civType || 'grecy')
        : (aiOwnerCivMap.get(ownerId) ?? 'grecy');
    }

    /** Bonusy cyw z civs.json per ownerId (gracz: player.civBonusy; AI: lookup po aiOwnerCivMap). */
    function civBonusyForOwnerId(ownerId: number) {
      if (ownerId === 0 && player.civBonusy.length > 0) return player.civBonusy;
      return civBonusyForCivKey(civKeyForOwnerId(ownerId), data.civs);
    }

    function civManpowerMultsForOwner(ownerId: number) {
      return civManpowerMults(civBonusyForOwnerId(ownerId));
    }

    function unlockedTechsForOwner(ownerId: number): string[] {
      return ownerId === 0
        ? Array.from(player.zbadane)
        : Array.from(aiResearchDone.get(ownerId) ?? new Set<string>());
    }

    /**
     * SUROW-CIV-01 (Maciej 2026-07-24): magazyn surowcow = pula PANSTWA (civ-wide,
     * suma po WSZYSTKICH miastach ownera), nie tylko lokalne City.surowce -- patrz
     * game/building-stock-cost.ts. OWNERID-AGNOSTIC: dziala identycznie dla gracza
     * (ownerId=0) i kazdej cywilizacji AI (ownerId jest zwyklym parametrem).
     */
    function ownerSurowcePoolFor(ownerId: number): Record<string, number> {
      return ownerResourceStockAll(cities, ownerId);
    }

    /** Pobiera koszt surowcowy budynku Z PULI PANSTWA (rozproszone po miastach ownera). */
    function deductOwnerStockCost(ownerId: number, cost: Record<string, number>): void {
      if (Object.keys(cost).length === 0) return;
      deductBuildingStockCostAcrossCities(cities, ownerId, cost);
    }

    /** Auto-budowa: dodaj następny budynek gdy kolejka pusta i tryb auto. */
    function tryAutoEnqueueBuild(cityId: string) {
      const city = cities.find(c => c.id === cityId);
      if (!city || (city.budowaTryb ?? DEFAULT_BUDOWA_TRYB) !== 'auto') return null;
      const prod0 = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
      if (frontItem(prod0) !== null) return null;
      const ownImprovements = placedImprovementsForOwner(city.ownerId);
      const item = pickAutoBuildItem(city, prod0, data, {
        unlockedTechs: unlockedTechsForOwner(city.ownerId),
        ownerSurowcePool: ownerSurowcePoolFor(city.ownerId),
        ctx: {
          builtBuildingIds: cityBuilt.get(cityId) ?? [],
          productionQueue: prod0.kolejka,
          epoch: empireEpochForOwner(city.ownerId),
          civBonusy: civBonusyForOwnerId(city.ownerId),
          civUnitNacja: unitNacjaForCivKey(civKeyForOwnerId(city.ownerId)),
          placedImprovements: placedImprovementsWithBrazTradeGrant(city.ownerId, ownImprovements),
          hasKopalniaNaZlozuZelaza: hasKopalniaNaZlozuZelazaOrTradeGrant(city.ownerId, ownImprovements),
          // Parytet z ręczną budową gracza (Maciej 2026-07-24): bramka B-SUROW-BUD dostaje te same
          // wejścia — aktywne źródła + budynki imperium + ZAPAS puli państwa (bramka spełniona zapasem).
          empireActiveResourceLabels: empireActiveResourceLabelsForOwner(city.ownerId),
          empireBuiltIds: [...empireBuiltIdsForOwner(city.ownerId)],
          empireResourceStock: citySurowceSumForOwner(city.ownerId),
          // TEMAT 8 Q2 (2026-07-24): parytet — Port/Port wielki dostają tu tę samą bramkę
          // wybrzeże/rzeka co ręczna budowa gracza (cityPanel.ts) i AI (main.ts cmd 'build').
          cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city),
        },
      });
      if (!item) return null;
      // TEMAT #6: pickAutoBuildItem juz odfiltrowal budynki bez pokrycia w puli PANSTWA —
      // tu tylko pobieramy koszt (start budowy), symetrycznie z addItem (ui/cityPanel.ts).
      // SUROW-CIV-01: pobor rozlozony po miastach ownera (deductOwnerStockCost), nie tylko
      // z lokalnego City.surowce tego miasta.
      if (item.kind === 'budynek') {
        const def = data.buildings.find(b => b.id === item.id);
        const cost = buildingStockCost(def);
        if (Object.keys(cost).length > 0) {
          deductOwnerStockCost(city.ownerId, cost);
        }
      }
      cityProd.set(cityId, enqueue(prod0, item));
      return item;
    }

    /**
     * Diplomacy relations: Map of "a_b" (smaller id first) -> Relation.
     * Initialized on first access (lazy). Updated each turn via aiDiplomacyStance.
     */
    const diplomacyRelations = new Map<string, Relation>();
    /** D4-WYMIANA-PN: meta per para (limit PN/turę, dobra wola). */
    const diplomacyPairMeta = new Map<string, DiploPairMeta>();
    /**
     * FAZA 1 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 6) — rejestr per-para jednorazowych
     * zdarzeń dyplomatycznych {eventKey,delta,tura}, klucz jak diplomacyPairMeta
     * (diploPairKey). Zasilany wyłącznie przez recordDiploFactor/applyDiploEventTracked
     * poniżej — moduł game/diplomacy-factors.ts zostaje czysty. Save/load: meta.diplomacyFactorLog.
     */
    const diplomacyFactorLog = new Map<string, DiploFactorLog>();
    /** D4-W10-A+: trwały dostęp do złoża (active=false w wojnie). */
    let zlozeGrants: ZlozeGrant[] = [];
    /** D3-Q2: nacje, z którymi gracz nawiązał kontakt dyplomatyczny (save/load w meta). */
    const diplomaticContactEstablished = new Set<number>();
    /** Odkryte na mapie (widoczne choć raz) — osobno od formalnego kontaktu. */
    const diplomaticallyDiscoveredOwners = new Set<number>();
    /** Odkrycie w mgle — auto-okno audiencji już pokazane (save/load meta). */
    const diplomaticDiscoveryPopupShown = new Set<number>();
    let lastDiplomaticContactsSnapshot = new Set<number>();
    const pendingAutoDiploAudience: number[] = [];
    let diplomaticContactTrackingReady = false;
    /** v1.1: aktywne traktaty dyplomatyczne (save/load meta.diplomacyDeals). */
    let activeDeals: ActiveDeal[] = [];
    /** v1.1: skarbiec AI do ticka trybutu (T1A). */
    const aiSkarbiecByOwner = new Map<number, number>();
    /** R-AI-KUP-JEDN (Maciej 2026-07-24, parytet AI): licznik zakupów jednostek za złoto
     *  (rush) TEGO ownera W TEJ turze -- zerowany na wejściu w sekcję ownera w runAiPhase
     *  (ownerLoop), zasilany w cmd.type==='build' po udanym purchaseRecruitmentUnit. */
    const aiUnitGoldRushBoughtByOwner = new Map<number, number>();
    /** R-STAWKI-STROJENIE (2026-07-24): progi rush-zakupu jednostek za zloto,
     *  przeniesione z zakodowanych stalych do econ-params.json (globalne.
     *  ai_rush_jednostka_rezerwa_zlota / ai_rush_jednostka_max_na_ture) --
     *  patrz loadAiRushParams (game/ai.ts). Wartosci bez zmian (100 / 1). */
    const aiRushParams = loadAiRushParams(data.econParams, _menuDifficulty);
    /** D-IMPROVEMENTS: pula Pracy AI (symetryczna do aiSkarbiecByOwner) -- zasilana z
     *  aiEcon.doPuli w bloku bankowania AI (patrz sumEconomyForOwner), zużywana przy
     *  budowie ulepszeń terenu (planCityImprovements w game/ai.ts). Podpięta pod
     *  ownerPracaPool/setOwnerPracaPool -- przy przejęciu stolicy AI ta pula PRZEPADA
     *  (jak playerPracaPool gracza), patrz capital-capture.ts. */
    const aiPracaPoolByOwner = new Map<number, number>();
    /** Pula Nauki AI (symetryczna do player.nauka) — bankowana z aiEcon.nauka co turę. */
    const aiNaukaPoolByOwner = new Map<number, number>();
    /** Bieżąca tech badana przez AI (symetryczna do player.badana). */
    const aiBadanaByOwner = new Map<number, string | null>();
    /** P6: tech + surowiec boolean z koszyka PN (save/load meta.surowiecBooleanGrants). */
    let basketTransferCtx: BasketTransferContext = createEmptyBasketTransferContext(data.tech);
    let _dipUnitSeq = 0;
    const _diplomacyParams = () => getEffectiveDiplomacyParams(_menuDifficulty);

    function getDiploRelation(a: number, b: number): Relation {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      if (!diplomacyRelations.has(key)) {
        diplomacyRelations.set(key, defaultNeutralRelation());
      }
      return diplomacyRelations.get(key)!;
    }

    function unitRingStanceForPlayer(ownerId: number): UnitRingStance {
      if (ownerId === 0) return 'own';
      if (isBarbarian(ownerId)) return 'hostile';
      if (getDiploRelation(0, ownerId).status === 'wojna') return 'hostile';
      return 'neutral';
    }

    function wireUnitRendererRingStance(): void {
      unitRenderer.setRingStanceResolver(unitRingStanceForPlayer);
      unitRenderer.setOwnerColorFn(civColorFn);
    }
    wireUnitRendererRingStance();

    function ownerCityStateOpts() {
      return {
        simplifiedOwners: simplifiedDiplomacyOwners,
        typCopyOwners: typCityCopyOwners,
        cities,
      };
    }

    function civDisplayNameForOwner(ownerId: number): string | undefined {
      const civKey = aiOwnerCivMap.get(ownerId);
      if (!civKey) return undefined;
      const row = data.civs.cywilizacje.find(
        (c: { ikonaId?: string; typCywilizacji?: string }) =>
          c.ikonaId === civKey || c.typCywilizacji === civKey,
      );
      return row?.Cywilizacja != null ? String(row.Cywilizacja) : undefined;
    }

    function ownerDiploLabel(ownerId: number): string {
      if (isBarbarian(ownerId)) return 'Barbarzyńcy';
      const opts = ownerCityStateOpts();
      const isCS = isOwnerClusterCityState(ownerId, opts);
      const base = resolveOwnerBaseName({
        ownerId,
        cached: ownerDisplayName.get(ownerId),
        cityName: ownerCityLabelFromMap(ownerId),
        civDisplayName: civDisplayNameForOwner(ownerId),
        isCityState: isCS,
        isClusterCapital: clusterCapitalOwnerIds.has(ownerId),
      });
      if (!isTechnicalOwnerLabel(base)) {
        ownerDisplayName.set(ownerId, base);
      }
      return formatOwnerDiploLabel(base, ownerId, opts);
    }

    function terrainLabelPl(tb: string): string {
      const m: Record<string, string> = {
        Rownina: 'równina',
        Laka: 'łąka',
        Wzgorza: 'wzgórza',
        Gory: 'góry',
        Pustynia: 'pustynia',
        Morze: 'morze',
        Wybrzeze: 'wybrzeże',
      };
      return m[tb] ?? tb.toLowerCase();
    }

    /** Kontekst potyczki — miasto vs pole (czytelne „z kim / gdzie”). */
    function fieldBattlePlaceInfo(
      q: number,
      r: number,
      terrain: string,
      perspectiveOwnerId: number,
    ): { miejsce: string; lokacja: string } {
      const cityOn = cities.find(c => c.q === q && c.r === r);
      if (cityOn) {
        if (cityOn.ownerId === perspectiveOwnerId) {
          return {
            miejsce: 'obrona miasta ' + cityOn.name,
            lokacja: cityOn.name + ' · heks miasta',
          };
        }
        return {
          miejsce: 'atak miasta ' + cityOn.name,
          lokacja: cityOn.name + ' · heks miasta',
        };
      }
      const adjCity = cities.find(c => hexDistance(c.q, c.r, q, r) === 1);
      const ter = terrainLabelPl(terrain);
      if (adjCity) {
        return {
          miejsce: ter + ' przy ' + adjCity.name,
          lokacja: adjCity.name + ' · (' + q + ',' + r + ')',
        };
      }
      return { miejsce: ter, lokacja: '(' + q + ',' + r + ')' };
    }

    function applyClusterStartPlan(
      playerCivId: string,
      seed: number,
      rywaleNaKlaster: number,
    ): void {
      const plan = buildClusterStartPlan({
        map,
        civs: data.civs,
        seed,
        playerCivId,
        rywaleNaKlaster,
        aktywneTypy: _menuCivTypesCount || aktywneTypyFromMapLabel(_menuMapSize),
        cityNamesPools: data.cityNamesPools,
      });

      playerStartHex = { ...plan.playerStartHex };
      aiStartHexes = plan.aiStartHexes.slice();
      clusterPlayerStartCityName = plan.playerStartCityName;
      pendingSameTypeRivalCount = plan.pendingSameTypeRivals;
      pendingSameTypeRivalHexes = plan.pendingSameTypeRivalHexes.slice();
      clusterPlacement = plan.placement;
      clusterStartSeed = seed;
      clusterCapitalOwnerIds.clear();
      for (const oid of plan.clusterCapitalOwnerIds) clusterCapitalOwnerIds.add(oid);

      aiOwnerCivMap.clear();
      ownerDisplayName.clear();
      simplifiedDiplomacyOwners.clear();
      foreignTypeOwners.clear();
      typCityCopyOwners.clear();
      ownerEraByOwner.clear();
      ownerStartEraByOwner.clear();
      aiResearchDone.clear();
      eliminatedOwners.clear();
      capitalCityIdByOwner.clear();
      zdobyczePowerByOwner.clear();
      for (const [oid, civ] of plan.aiOwnerCivMap) {
        aiOwnerCivMap.set(oid, civ);
        setupAiOwnerEpoch(oid, _menuEpochId || 'kamien');
      }
      for (const [oid, label] of plan.ownerDisplayName) ownerDisplayName.set(oid, label);
      for (const oid of plan.simplifiedDiplomacyOwners) simplifiedDiplomacyOwners.add(oid);
      for (const oid of plan.foreignTypeOwners) foreignTypeOwners.add(oid);
      for (const oid of plan.typCityCopyOwners) typCityCopyOwners.add(oid);

      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      activeDeals = [];
      aiSkarbiecByOwner.clear();
      aiPracaPoolByOwner.clear();
      aiNaukaPoolByOwner.clear();
      aiBadanaByOwner.clear();
      diplomacyPairMeta.clear();
      diplomacyFactorLog.clear();
      zlozeGrants = [];
      basketTransferCtx = createEmptyBasketTransferContext(data.tech);
      _dipUnitSeq = 0;
      for (const [oid, rel] of plan.startRelations) setDiploRelation(0, oid, rel);

      let _scFounded = 0, _scRejected = 0;
      for (const sc of plan.spawnCities) {
        const isCS = plan.simplifiedDiplomacyOwners.has(sc.ownerId) || typCityCopyOwners.has(sc.ownerId);
        const c = foundCityAt(sc.q, sc.r, sc.ownerId, cities, map, sc.name, isCS);
        if (c) {
          if (isCS) {
            c.startCityState = true;
          }
          cities.push(c);
          finalizeCityFounding(c, sc.q, sc.r);
          _scFounded++;
        } else {
          _scRejected++;
        }
      }
      if (_scRejected > 0) {
        console.warn('[ClusterStart] klastry: założono ' + _scFounded + ' z ' +
          plan.spawnCities.length + ' (' + _scRejected + ' odrzuconych przez canFoundCity)');
      }

      // Model B (Maciej 2026-07-09): USUNIĘTO posiew lamy (E2) — nie ma już złóż zwierzęcych.
      // Lama = czyste ulepszenie „Zagroda lam" budowane przez Inków (bramka po typie cywilizacji
      // w isLivestockAllowed: lama tylko isIncaCiv), bez złoża na mapie.

      refreshFog();
      initDiplomaticContactSnapshot();
      // B12: epoka wizualna = epoka startu gry + tylko tech awansujące epokę (fair play).
      reconcileAllOwnerErasFromResearch();
      cityRenderer.sync(cities, _cityRenderOpts());

      initEmpireFoodStates();
      console.log(
        '[ClusterStart] typ=' + playerCivId +
        ' rywale=' + rywaleNaKlaster + ' (deferred)' +
        ' AI=' + plan.spawnCities.length +
        ' typow=' + plan.placement.aktywneTypy +
        (plan.placement.requestedTypy != null && plan.placement.requestedTypy > plan.placement.aktywneTypy
          ? ' (żądano ' + plan.placement.requestedTypy + ' — mapa nie zmieściła wszystkich)'
          : ''),
      );
    }

    /** Po pierwszym mieście gracza — państwa wokół FAKTYCZNEJ stolicy (E-START-CS-Q1 C). */
    function spawnPendingSameTypeRivals(_coreQ: number, _coreR: number): void {
      if (pendingSameTypeRivalCount <= 0) return;
      const targetCount = pendingSameTypeRivalCount;
      pendingSameTypeRivalCount = 0;
      // Pre-plan z mapgen zostaje tylko do podglądu UI — nie używamy go do spawnu.
      pendingSameTypeRivalHexes = [];

      let nextOwnerId = 1;
      for (const c of cities) if (c.ownerId >= nextOwnerId) nextOwnerId = c.ownerId + 1;
      for (const u of units) if (u.ownerId >= nextOwnerId) nextOwnerId = u.ownerId + 1;

      const core = { q: _coreQ, r: _coreR };
      const candidates = buildSameTypeRivalCandidateHexes(
        map,
        core,
        targetCount,
        clusterStartSeed,
      );

      let _rivalsFounded = 0;
      let _rivalsRejected = 0;
      for (const pos of candidates) {
        if (_rivalsFounded >= targetCount) break;

        const ownerId = nextOwnerId + _rivalsFounded;
        const nazwa = clusterRivalCityName(
          data.civs,
          _menuCivId,
          _rivalsFounded + 1,
          data.cityNamesPools,
        );
        aiOwnerCivMap.set(ownerId, _menuCivId);
        setupAiOwnerEpoch(ownerId, _menuEpochId || 'kamien');
        ownerDisplayName.set(ownerId, nazwa);
        simplifiedDiplomacyOwners.add(ownerId);
        typCityCopyOwners.add(ownerId);
        // D-MP-DYPL Q1 (część 1, WARIANT B): korekta startowego zaufania miast-panstw wg
        // trudnosci (easy +10 / normal +5 / hard 0 — skala przesunieta w gore, bo baza=0
        // juz jest na dole 0-100 i ujemna delta na hard bylaby wchlaniana przez clamp)
        // — WYLACZNIE tu, NIE dotyka głównych cywilizacji obcego typu (te startuja przez
        // startRelationForPair(false) bez korekty, patrz plan.startRelations w
        // cluster-start.ts / main.ts linia ~3223).
        setDiploRelation(
          0, ownerId,
          // R-TRUDNOSC-1 (Maciej 2026-07-24): trudność MIAST-PAŃSTW (suwak osobny), nie
          // głównej gry -- patrz _menuCityStateDifficulty (applyMenuParams).
          applyCityStateDifficultyTrust(startRelationForPair(true), _menuCityStateDifficulty),
        );

        const c = foundCityAt(pos.q, pos.r, ownerId, cities, map, nazwa, true);
        if (c) {
          c.startCityState = true;
          cities.push(c);
          finalizeCityFounding(c, pos.q, pos.r);
          aiStartHexes.push({ q: pos.q, r: pos.r, ownerId });
          _rivalsFounded++;
        } else {
          _rivalsRejected++;
        }
      }

      // B12: epoka wizualna musi = epoka startu gry (Kamień→1) — reconcile przed sync renderu.
      reconcileAllOwnerErasFromResearch();
      // D12: refreshFog + cityRenderer.sync robi wywołujący (tryFoundPlayerCityAt) RAZ po spawnie —
      // nie dublujemy tu (było 2× pełny fog + 2× odbudowa WSZYSTKICH miast na Super Huge).
      initDiplomaticContactSnapshot();
      console.log(
        '[ClusterStart] deferred same-type rivals=' + _rivalsFounded + '/' + targetCount +
        (_rivalsRejected > 0 ? ' (' + _rivalsRejected + ' odrzuconych, backfill)' : '') +
        ' epokaStart=' + (_menuEpochId || 'kamien') +
        ' (actual player capital @ ' + core.q + ',' + core.r + ')',
      );
    }

    function setDiploRelation(a: number, b: number, rel: Relation): void {
      const key = a < b ? `${a}_${b}` : `${b}_${a}`;
      diplomacyRelations.set(key, rel);
      refreshCityMapOutlines();
    }

    function refreshCityMapOutlines(): void {
      cityRenderer.syncMapOutlines(cities, _cityRenderOpts());
    }

    function getDiploPairMeta(a: number, b: number): DiploPairMeta {
      const key = diploPairKey(a, b);
      if (!diplomacyPairMeta.has(key)) {
        diplomacyPairMeta.set(key, freshDiploPairMeta());
      }
      return diplomacyPairMeta.get(key)!;
    }

    function setDiploPairMeta(a: number, b: number, meta: DiploPairMeta): void {
      diplomacyPairMeta.set(diploPairKey(a, b), meta);
    }

    /**
     * FAZA 1 pkt 6 — dopisuje jednorazowe zdarzenie {eventKey,delta,tura} do rejestru
     * pary (diplomacy-factors.ts). Pomija delta===0 (appendDiploFactor jest no-op).
     */
    function recordDiploFactor(a: number, b: number, eventKey: string, delta: number): void {
      if (delta === 0) return;
      const key = diploPairKey(a, b);
      const log = diplomacyFactorLog.get(key) ?? [];
      diplomacyFactorLog.set(key, appendDiploFactor(log, { eventKey, delta, tura: turn }));
    }

    /**
     * Wrapper na applyDiplomaticEvent — liczy DELTĘ RZECZYWIŚCIE zastosowaną (nie
     * nominał z DIPLOMACY_PARAMS) i dopisuje ją do rejestru pary. Używać we
     * WSZYSTKICH miejscach, gdzie dotąd był goły `applyDiplomaticEvent(cur, ev)`
     * (FAZA 1 pkt 6 zlecenia: „przy każdym applyDiplomaticEvent zapisuj do mapy pary").
     */
    function applyDiploEventTracked(
      a: number,
      b: number,
      cur: Relation,
      event: DiplomaticEvent,
      params?: Partial<DiplomacyParams>,
    ): Relation {
      const next = applyDiplomaticEvent(cur, event, params);
      const dZ = next.zaufanie - cur.zaufanie;
      const dR = next.respekt - cur.respekt;
      if (dZ !== 0) recordDiploFactor(a, b, event, dZ);
      if (dR !== 0) recordDiploFactor(a, b, event + '_respekt', dR);
      return next;
    }

    function resetTrustPnGainedForPlayerTurn(): void {
      for (const [key, meta] of diplomacyPairMeta.entries()) {
        if (meta.trustPnGainedThisTurn !== 0) {
          diplomacyPairMeta.set(key, { ...meta, trustPnGainedThisTurn: 0 });
        }
      }
    }

    function applyPnTrustForPair(
      proposerId: number,
      responderId: number,
      givePn: number,
      receivePn: number,
      isGift: boolean,
    ): void {
      const cur = getDiploRelation(proposerId, responderId);
      const meta = getDiploPairMeta(proposerId, responderId);
      const applied = applyPnTrustToRelation(cur, meta, givePn, receivePn, isGift);
      setDiploRelation(proposerId, responderId, applied.rel);
      setDiploPairMeta(proposerId, responderId, applied.meta);
      // FAZA 1 pkt 6: to jest RZECZYWISTA delta Zaufania z PN (dar/handel) — inna niż
      // nominał applyDiplomaticEvent('dar'|'handel') poniżej, który tu celowo zwraca 0
      // (D3-W1-A/D4-WYMIANA-PN: Zaufanie liczone wyłącznie z wartości PN, patrz diplomacy.ts).
      recordDiploFactor(proposerId, responderId, isGift ? 'dar_pn' : 'handel_pn', applied.deltaZaufanie);
      if (applied.dobraWolaStarted) {
        showHintMessage('Dobra wola: +1 Zauf./turę × 3 (nadmiar ≥ 100 PN)', 3500);
      }
    }

    /**
     * Audyt #16: czy `ownerId` faktycznie POSIADA zasoby zadeklarowane w koszyku
     * (zloto/praca/zywnosc) — bramka wywoływana PRZED naliczeniem Zaufania za dar/handel,
     * żeby transakcja bez pokrycia w zasobach nie generowała darmowego trustu co turę.
     * Nie zmienia samego transferu (transferBasketItems ma osobne, już istniejące
     * zabezpieczenia/ograniczenia — patrz audyt #1/#47, poza zakresem tej naprawy).
     */
    function basketItemsAffordable(
      ownerId: number,
      items: readonly BasketItem[] | undefined,
      treasury: ReturnType<typeof buildDiploTreasury>,
    ): boolean {
      if (!items?.length) return true;
      for (const item of items) {
        const qty = item.ilosc ?? 1;
        if (item.typ === 'zloto') {
          const gold = diplomacyPnZloto(qty);
          if (gold > 0 && treasury.getPieniadze(ownerId) < gold) return false;
        } else if (item.typ === 'praca') {
          const praca = diplomacyPnPraca(qty);
          const have = ownerId === 0 ? playerPracaPool : (aiPracaPoolByOwner.get(ownerId) ?? 0);
          if (praca > 0 && have < praca) return false;
        } else if (item.typ === 'zywnosc') {
          const have = empireFoodStates.get(ownerId)?.zapasyPanstwa ?? 0;
          if (qty > 0 && have < qty) return false;
        }
      }
      return true;
    }

    function transferBasketItems(
      fromOwnerId: number,
      toOwnerId: number,
      items: readonly BasketItem[] | undefined,
      dealId?: string,
    ): void {
      if (!items?.length) return;
      syncBasketResearchFromEngine();
      const treasury = buildDiploTreasury();
      for (const item of items) {
        const qty = item.ilosc ?? 1;
        switch (item.typ) {
          case 'zloto': {
            const gold = diplomacyPnZloto(qty);
            if (gold > 0) applyOneShotGoldTransfer(fromOwnerId, toOwnerId, gold, treasury);
            break;
          }
          case 'praca': {
            // Audyt #47: dawca (gracz LUB AI) realnie traci Pracę, odbiorca (gracz LUB AI)
            // dostaje ją do WŁASNEJ puli Pracy — nie do skarbca złota AI. Wcześniej AI jako
            // dawca nic nie traciło (mint), a Praca gracza trafiała do aiSkarbiecByOwner.
            const praca = diplomacyPnPraca(qty);
            setOwnerPracaPool(fromOwnerId, ownerPracaPool(fromOwnerId) - praca);
            setOwnerPracaPool(toOwnerId, ownerPracaPool(toOwnerId) + praca);
            break;
          }
          case 'zywnosc': {
            const fromSt = empireFoodStates.get(fromOwnerId);
            if (fromSt) {
              fromSt.zapasyPanstwa = Math.max(0, fromSt.zapasyPanstwa - qty);
              empireFoodStates.set(fromOwnerId, fromSt);
            }
            const toSt = empireFoodStates.get(toOwnerId) ?? freshEmpireFoodState(empireFoodDefaultPct());
            toSt.zapasyPanstwa += qty;
            empireFoodStates.set(toOwnerId, toSt);
            break;
          }
          case 'zloze': {
            const hexKey = item.hexKey ?? item.id;
            zlozeGrants.push({
              granterOwnerId: fromOwnerId,
              granteeOwnerId: toOwnerId,
              partnerId: toOwnerId,
              zlozeId: item.id,
              hexKey,
              active: true,
              dealId,
            });
            break;
          }
          case 'tech': {
            const r = grantTechToOwner(item.id, toOwnerId, basketTransferCtx);
            basketTransferCtx = r.context;
            if (r.granted) {
              if (toOwnerId === 0) {
                for (const t of basketTransferCtx.researchedByOwner.get(0) ?? []) {
                  player.zbadane.add(t);
                }
                // #66: tech-kamień milowy z dyplomacji ma awansować epokę gracza
                // tą samą ścieżką co własne badanie (playerState.researchStep) —
                // inaczej zbadane/era się rozjeżdżają (Ludy Morza itp. gatują po era).
                const grantedDef = data.tech.find(t => t.Technologia === item.id);
                if (grantedDef) {
                  const awansTarget = eraAdvanceTarget(grantedDef);
                  if (awansTarget !== null) player.era = Math.max(player.era, awansTarget);
                }
              } else {
                aiResearchDone.set(
                  toOwnerId,
                  new Set(basketTransferCtx.researchedByOwner.get(toOwnerId) ?? []),
                );
                refreshCityRenderIfEraChanged(syncOwnerEraFromResearch(toOwnerId));
              }
            }
            break;
          }
          case 'surowiec_boolean': {
            const r = grantSurowiecBooleanAccess(item.id, fromOwnerId, toOwnerId, basketTransferCtx);
            basketTransferCtx = r.context;
            break;
          }
          case 'surowiec_ilosc': {
            // C-DYP-SUROWCE-Q1=B: `qty` z koszyka = liczba PAKIETÓW, nie sztuk.
            const totalUnits = qty * diplomacyHandelSurowcePakietWielkosc();
            const capId = capitalCityIdForOwner(toOwnerId);
            const refs = cities.map(c => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ?? {} }));
            const result = transferSurowiecIlosc(item.id, totalUnits, fromOwnerId, toOwnerId, capId, refs);
            for (let i = 0; i < cities.length; i++) {
              const before = refs[i];
              const after = result.cities[i];
              if (before && after && after.surowce !== before.surowce) {
                cities[i]!.surowce = after.surowce;
              }
            }
            break;
          }
          case 'jednostka': {
            // TODO(A1 — audyt #1): spawnTransferredUnit tworzy jednostkę wyłącznie
            // u odbiorcy i nic nie zdejmuje dawcy (darmowy zasób). Pozycja "jednostka"
            // jest ukryta w koszyku (ui/diplomacyTradeBasket.ts), ale odrzucamy ją
            // defensywnie i tu — na wypadek starych zapisów/deali z tą pozycją —
            // dopóki transfer nie zdejmuje wskazanej jednostki dawcy.
            break;
          }
          default:
            break;
        }
      }
    }

    function executePnDealTransfer(
      proposerId: number,
      responderId: number,
      payload: ProposalPayload,
    ): void {
      const { giveItems, receiveItems } = payload;
      if (giveItems?.length || receiveItems?.length) {
        transferBasketItems(proposerId, responderId, giveItems);
        transferBasketItems(responderId, proposerId, receiveItems);
        return;
      }
      const gold = payload.goldOnce ?? 0;
      if (gold > 0) {
        const treasury = buildDiploTreasury();
        applyOneShotGoldTransfer(proposerId, responderId, gold, treasury);
        if (responderId === 0 || proposerId === 0) updateHud();
      }
    }

    function suspendZlozeOnWar(a: number, b: number): void {
      const before = zlozeGrants.filter(g => g.active).length;
      zlozeGrants = suspendZlozeGrantsForWar(zlozeGrants, a, b);
      const after = zlozeGrants.filter(g => g.active).length;
      if (before > after) {
        showHintMessage('Dostęp do złoża wygasł — wojna', 4000);
      }
    }

    /**
     * Cities with auto-manage enabled (by cityId).
     * UI will toggle via a callback; currently starts empty.
     * When enabled, autoManageCity sets workedTiles and enqueues production.
     */
    const autoManageCities = new Set<string>();

    /** Barbarian camps on the map. */
    let barbCamps: BarbCamp[] = [];
    /** Barbarian params loaded from ai-params.json (with fallbacks). */
    const barbParams = loadBarbParams(data);
    /** Flag: game ended (victory or defeat). Prevents repeated end-game messages. */
    let gameOver = false;
    let endTurnInProgress = false;
    /** Jednostki gracza ukończone w ticku end-turn — ukryte do końca tury AI. */
    const deferredPlayerUnitRevealIds = new Set<string>();
    /** Prompty połączenia armii odłożone do startu tury gracza (produkcja / ruch w ticku end-turn). */
    type DeferredMergePrompt = {
      movedUnitIds: string[];
      fromQ: number;
      fromR: number;
      moveCost: number;
    };
    const deferredMergePrompts: DeferredMergePrompt[] = [];

    // -----------------------------------------------------------------------
    // Fog of War state
    // -----------------------------------------------------------------------

    /** Hexes the player has ever seen (persists across turns). */
    const explored = new Set<string>();
    /** Whether fog of war is active (toggle with F — tylko dev build). */
    let fogOn = true;
    /** Dev/test: cały ląd jako explored (ocean nadal ukryty), FoW zostaje — toggle M. */
    let revealAllLand = false;
    /** Whether the unit gallery overlay is active (declared early: refreshFog reads it). */
    let galleryOn = false;
    /** Skróty F/M + batony minimapy — domyślnie ON; kanon prod: VITE_CIV_HIDE_FOG_UI=1. */
    function fogUiToolsEnabled(): boolean {
      const hide = import.meta.env.VITE_CIV_HIDE_FOG_UI;
      if (hide === '1' || hide === 'true') return false;
      return true;
    }

    /** Skróty F/M — dev server, build roboczy, ?playtest=* / ?dev=1 / plik PLAYTEST-*. */
    function civFogShortcutsEnabled(): boolean {
      if (!fogUiToolsEnabled()) return false;
      if (import.meta.env.DEV) return true;
      const envFlag = import.meta.env.VITE_CIV_PLAYTEST;
      if (envFlag === '1' || envFlag === 'true') return true;
      if (typeof location !== 'undefined') {
        const q = new URLSearchParams(location.search);
        if (q.has('playtest') || q.get('dev') === '1' || q.get('fogtools') === '1') return true;
        const path = location.pathname || '';
        if (/gra-robocza|PLAYTEST|playtest/i.test(path)) return true;
      }
      return true;
    }
    const FOG_DEV_SHORTCUTS = civFogShortcutsEnabled();
    /** All hex keys on the map — odświeżane po regeneracji (doStartGame / load). */
    let ALL_KEYS = new Set(allHexKeys(map));
    /** Klucze lądu + wybrzeża (bez Morza) — skrót M. */
    let ALL_LAND_KEYS = new Set(allRevealLandKeys(map));

    function rebuildAllKeys(): void {
      ALL_KEYS = new Set(allHexKeys(map));
      ALL_LAND_KEYS = new Set(allRevealLandKeys(map));
    }

    /** Render-only explored (skrót M) — bez mutacji persistent `explored`. */
    function fogExploredForRender(): Set<string> {
      return exploredSetForRender(explored, ALL_LAND_KEYS, revealAllLand);
    }

    /** Po nowej grze: mgła ON, mapa nieodkryta (czarna) — explored rośnie tylko z widoku jednostek/miast. */
    function seedStartingFog(): void {
      fogOn = true;
      revealAllLand = false;
      explored.clear();
    }

    function isAwaitingFirstPlayerCity(): boolean {
      return !playerEverOwnedCity && !cities.some(c => c.ownerId === 0);
    }

    function isInStartReveal(q: number, r: number): boolean {
      if (!isAwaitingFirstPlayerCity() || playerStartHex === null) return true;
      return hexDistance(q, r, playerStartHex.q, playerStartHex.r) <= startRevealRadius;
    }

    /** Opcje terytorium przy founding (D2=A plaster) — pierwsze miasto: tylko krąg startu. */
    function foundingTerritoryOpts(ownerId: number): { withinTerritory?: (q: number, r: number) => boolean } {
      if (ownerId === 0 && isAwaitingFirstPlayerCity()) return {};
      const nodes = cityNodesForOwner(ownerId);
      if (nodes.length === 0) return {};
      return {
        withinTerritory: (fq: number, fr: number) => isInTerritory(fq, fr, nodes),
      };
    }

    /** Walidacja założenia miasta gracza (pierwsze miasto tylko w oświetlonym kręgu startu). */
    function canFoundPlayerCityAt(q: number, r: number): { ok: boolean; reason: string } {
      const base = canFoundCity(q, r, cities, map, foundingTerritoryOpts(0));
      if (!base.ok) return base;
      if (isAwaitingFirstPlayerCity() && !isInStartReveal(q, r)) {
        return { ok: false, reason: 'poza oświetlonym obszarem startu' };
      }
      return base;
    }

    /** Widoczne heksy = zasięg jednostek/miast gracza; przed miastem = oświetlenie startu. */
    function currentVisible(): Set<string> {
      const visible = new Set<string>();
      for (const u of units.filter(u => u.ownerId === 0)) {
        const sight = unitSight(u);
        for (const k of computeVisibleAt(u.q, u.r, map, sight)) visible.add(k);
      }
      for (const c of cities.filter(c => c.ownerId === 0)) {
        const kultura = (c as { kultura?: number }).kultura ?? 0;
        const sight = citySightRadius(c.population, kultura);
        if (sight <= 0) continue;
        for (const k of computeVisibleAt(c.q, c.r, map, sight)) visible.add(k);
      }
      if (visible.size > 0) return visible;
      if (playerStartHex !== null) {
        return computeVisibleAt(playerStartHex.q, playerStartHex.r, map, startRevealRadius);
      }
      return new Set<string>();
    }

    cityFogVisible = (city, vis) => {
      if (!fogOn) return true;
      if (city.ownerId === 0) return true;
      return (vis ?? currentVisible()).has(keyOf(city.q, city.r));
    };

    /** Ukryta w garnizonie (po Ufort. w mieście) — niewidoczna na mapie świata. */
    function isUnitInGarnizon(u: RuntimeUnit): boolean {
      return u.inGarnizon === true;
    }

    function cityAtUnit(u: RuntimeUnit): City | undefined {
      return cities.find(
        c => c.ownerId === u.ownerId && c.q === u.q && c.r === u.r,
      );
    }

    /**
     * C-SENTRY-Q1 wariant A (Maciej 2026-07-25): czy dwaj właściciele są wrogami
     * — barbarzyńcy są wrogami wszystkich, poza tym decyduje stan wojny w
     * dyplomacji. ownerId-agnostyczne (nie zakłada gracza=0 po żadnej stronie) —
     * ta sama funkcja obsługuje pary gracz-AI i AI-AI.
     */
    function areEnemyOwners(a: number, b: number): boolean {
      if (a === b) return false;
      if (isBarbarian(a) || isBarbarian(b)) return true;
      return getDiploRelation(a, b).status === 'wojna';
    }

    /**
     * C-SENTRY-Q1 wariant A (Maciej 2026-07-25): auto-budzenie jednostek w
     * trybie Sentry (czuwa), gdy wróg wejdzie w ich pole widzenia. Pole widzenia
     * = ISTNIEJĄCY per-jednostkowy zasięg wzroku (unitSight — ta sama funkcja
     * co odsłanianie mgły wojny, kolumna „Widok pola" z units.json).
     * ownerId-agnostyczne: działa identycznie dla jednostek gracza i AI (gdyby
     * AI kiedykolwiek ustawiło sentry=true) — brak gałęzi „tylko ownerId===0".
     * Komunikat na ekranie (showHintMessage) tylko dla jednostek gracza (0) —
     * AI nie ma UI, które mogłoby go pokazać.
     * Wołane raz na koniec pełnego cyklu tury (main.ts, po refreshFog() w
     * obsłudze End Turn), gdy pozycje wszystkich jednostek (gracz + AI) są już
     * finalne dla tej tury.
     */
    function wakeSentryUnitsOnEnemyContact(): void {
      const sleepers = units.filter(u => u.sentry === true);
      if (sleepers.length === 0) return;
      for (const su of sleepers) {
        const sight = unitSight(su);
        const enemyNear = units.some(v =>
          v.id !== su.id
          && areEnemyOwners(su.ownerId, v.ownerId)
          && hexDistance(su.q, su.r, v.q, v.r) <= sight,
        );
        if (enemyNear) {
          su.sentry = false;
          if (su.ownerId === 0) {
            showHintMessage(su.typeId + ' obudzony — wróg w polu widzenia!', 3000);
          }
        }
      }
    }

    /**
     * Return the subset of units to display under current visibility.
     * Garnizon (inGarnizon) — niewidoczny na mapie.
     */
    function visibleUnitsList(vis: Set<string>): RuntimeUnit[] {
      return unitsVisibleOnMap(units, vis, 0);
    }

    /**
     * Re-apply fog and unit visibility after any state change.
     * Must NOT be called while gallery is active (gallery drives its own sync).
     */
    function refreshFog(): void {
      if (galleryOn) return;
      markMinimapDirty(); // D11: zmiana mgły/mapy → minimapa do przerysowania (poza tym pomijana)
      const vis = currentVisible();
      updateDiplomaticDiscovery(vis);
      addExplored(explored, vis);
      const exploredForRender = fogExploredForRender();
      const useFogRender = fogOn || revealAllLand;
      // GRAFIKA-TEREN-2: uzgodnij meshe wiosek/obozów z aktualnym stanem (reconcile idempotentny;
      // samo-naprawia się przy przebudowie sceny). refreshFog = centralny hook po każdej zmianie stanu.
      syncCampMeshes();
      syncVillageMeshes();
      if (useFogRender) {
        setFog(vis, exploredForRender, { landReveal: revealAllLand });
        syncResourceOverlayFog(vis, exploredForRender);
        syncImprovementMeshFog(vis, exploredForRender);
        syncSettlementMeshFog(vis, exploredForRender);
        syncUnitsRender(visibleUnitsList(vis));
        cityRenderer.applyFogVisibility(vis, true, 0);
        wonderRenderer.applyFogVisibility(vis, true);
      } else {
        setFog(ALL_KEYS, ALL_KEYS);
        syncResourceOverlayFog(ALL_KEYS, ALL_KEYS);
        syncImprovementMeshFog(ALL_KEYS, ALL_KEYS);
        syncSettlementMeshFog(ALL_KEYS, ALL_KEYS);
        syncUnitsRender(visibleUnitsList(ALL_KEYS));
        cityRenderer.applyFogVisibility(ALL_KEYS, false, 0);
        wonderRenderer.applyFogVisibility(ALL_KEYS, false);
      }
      if (d1bHudActive) refreshD1bHud();
      checkNewDiplomaticContacts();
      if (territoryBorderVisible) refreshTerritoryBorderOverlay();
    }

    /** Dev/playtest: pełne wyłączenie FoW (F / baton obok minimapy). */
    function toggleDevFogFull(): void {
      if (galleryOn) return;
      fogOn = !fogOn;
      if (!fogOn) revealAllLand = false;
      refreshFog();
      updateHud();
      showHintMessage(
        fogOn
          ? 'FoW włączony (F): normalna mgła'
          : 'FoW wyłączony (F): cała mapa widoczna — wolniejsze',
        3000,
      );
    }

    /** Dev/playtest: odkryj cały ląd, ocean ukryty (M / baton obok minimapy). */
    function toggleDevRevealAllLand(): void {
      if (galleryOn) return;
      revealAllLand = !revealAllLand;
      if (revealAllLand) fogOn = true;
      refreshFog();
      showHintMessage(
        revealAllLand
          ? 'Ląd odkryty (M): cały kontynent widoczny, poza zasięgiem jednostek — FoW'
          : 'Ląd zakryty (M): nieodkryte heksy lądu znów czarne',
        3000,
      );
    }

    /** Batony F/M obok minimapy — zawsze gdy fogUiToolsEnabled (nie zależy od URL). */
    function minimapPlaytestFogHooks():
      | {
          onToggleFogFull: () => void;
          onToggleLandReveal: () => void;
          isFogFullOff: () => boolean;
          isLandReveal: () => boolean;
        }
      | undefined {
      if (!fogUiToolsEnabled()) return undefined;
      return {
        onToggleFogFull: () => toggleDevFogFull(),
        onToggleLandReveal: () => toggleDevRevealAllLand(),
        isFogFullOff: () => !fogOn,
        isLandReveal: () => revealAllLand,
      };
    }

    // Game state
    let selectedId: string | null = null;
    let reachable = new Set<string>();
    /** Jednostka w animacji ruchu — widoczna mimo ukrycia w stosie. */
    let forceVisibleUnitId: string | null = null;
    let turn = 1;
    /** Wznowienie pętli AI po preBattle (atak na gracza). */
    type AiCmdResume = {
      ownerList: number[];
      ownerIdx: number;
      commands: AICommand[];
      cmdIdx: number;
    };
    let aiCmdResume: AiCmdResume | null = null;
    let aiTurnAwaitingBattle = false;
    /** Tryb ?playtest=walka — wiekszy sklad preBattle + T = preset maciej_playtest. */
    let playtestWalkaActive = false;
    /** Tryb DUŻEJ bitwy (BITWA-DUZA / OBLEZENIE-DUZE): podnosi promień zbierania rosteru. */
    let bitwaDuzaActive = false;
    /** Tryb ?playtest=miasto — sandbox jednego miasta (ekonomia / panel). */
    let playtestMiastoActive = false;
    /** Last hex the player explicitly clicked on the map (for B = found city). */
    let lastBHex: { q: number; r: number } | null = null;

    /**
     * Zamyka panel kontekstowy heksa (D17=A) — wzajemna wyłączność z innymi
     * panelami/funkcjami (badania/ekonomia/kultura/itp.) oraz PPM na mapie.
     * Panel jest w 100% pochodną `lastBHex` (patrz buildHexContextPanelMessage),
     * więc wyczyszczenie stanu + odświeżenie HUD-a wystarcza, by realnie zniknął.
     */
    function hideHexContextPanel(): void {
      if (lastBHex === null) return;
      lastBHex = null;
      refreshD1bHud();
    }

    // --- Global player state (tasks 13B-finish + 7B) ---
    // Holds the banked treasury (skarbiec) and science (nauka) plus the research
    // progress (zbadane / badana / era).  Per-turn economy totals are banked into
    // this object after each economy tick, and auto-research spends the science.
    // See src/game/playerState.ts for the banking + research semantics.
    const player: PlayerState = createPlayerState();
    overlayDepositEra = player.era;
    fillAiOwnerCivMap(_menuCivId, _gameSeed);

    // --- Muzyka proceduralna (DYSPOZYCJA-MUZYKA.md §2) ------------------------
    // AudioContext jest leniwy — startMusic() wolno wołać TYLKO po geście
    // użytkownika (nowa gra / wczytaj / playtest-skrót), NIGDY na load strony.
    // Wczytanie preferencji + setMusicVolume() są bezpieczne przed startem
    // (nie tworzą AudioContext — patrz audio/muzyka-antyczna.ts).
    // `musicEnabled` (WŁ/WYCISZ) jest CELOWO ulotny — NIE wczytujemy go z
    // localStorage (C-AUD-Q5=A): wyciszenie z menu pauzy ma dotyczyć tylko
    // bieżącej rozgrywki, patrz komentarz w audio/musicPrefs.ts. Resetowany
    // do WŁ. na każdym starcie rozgrywki — patrz startGameMusic() niżej.
    // Głośność (`volume`) ZOSTAJE trwała — to nie było przedmiotem błędu.
    const _musicPrefsAtBoot = loadMusicPrefs();
    let musicEnabled = true;
    let musicVolumeState = _musicPrefsAtBoot.volume;
    setMusicVolume(musicVolumeState);

    // --- Odgłosy natury (TRZECI, niezależny kanał audio — sekcja "AMBIENCE"
    // w audio/muzyka-antyczna.ts + audio/ambiencePrefs.ts). Synteza Web Audio
    // na WŁASNYM AudioContext (composeKamien onlyNature=true — wiatr/ptaki/
    // świerszcze/wycie/woda, zero instrumentów/rytmu), własny stan, własne
    // preferencje, zero wpływu na muzykę i odwrotnie. setAmbienceVolume() jest
    // tak samo bezpieczne przed startem jak setMusicVolume() powyżej (nie
    // tworzy AudioContext).
    // `ambienceEnabled` (WŁ/WYCISZ) jest CELOWO ulotny — NIE wczytujemy go z
    // localStorage (TEMAT #9, ten sam błąd co C-AUD-Q5=A): wyciszenie z menu
    // pauzy ma dotyczyć tylko bieżącej rozgrywki, patrz komentarz w
    // audio/ambiencePrefs.ts. Resetowany do WŁ. na każdym starcie rozgrywki —
    // patrz startGameMusic() niżej. Głośność (`volume`) ZOSTAJE trwała.
    const _ambiencePrefsAtBoot = loadAmbiencePrefs();
    let ambienceEnabled = true;
    let ambienceVolumeState = _ambiencePrefsAtBoot.volume;
    setAmbienceVolume(ambienceVolumeState);

    /** Startuje muzykę tła po geście startowym gry, jeśli gracz jej nie wyłączył (setEra zawsze).
     *  Pierwsza rzecz: gasi intro (ekrany przed rozgrywką) — to dokładny moment
     *  przejścia menu->rozgrywka, patrz resumeIntroMusic() / openStartupMainMenu().
     *  Tu też startują odgłosy natury (jeśli gracz ich nie wyłączył) — ten sam
     *  moment startu co muzyka gry, ale kanał całkiem niezależny (patrz sekcja
     *  AMBIENCE w audio/muzyka-antyczna.ts). */
    function startGameMusic(mood: 'mapa' | 'bitwa' = 'mapa'): void {
      // C-AUD-Q5=A: nowa rozgrywka zawsze startuje z muzyką WŁ. — wyciszenie
      // dokonane w POPRZEDNIEJ rozgrywce (przełącznik w menu pauzy) jest
      // ulotne i nie ma tu żadnego znaczenia (patrz audio/musicPrefs.ts).
      musicEnabled = true;
      // TEMAT #9 (ten sam wzorzec): nowa rozgrywka zawsze startuje z odgłosami
      // natury WŁ. — wyciszenie z POPRZEDNIEJ rozgrywki jest ulotne (patrz
      // audio/ambiencePrefs.ts).
      ambienceEnabled = true;
      stopIntroMusic();
      setEra(player.era);
      if (musicEnabled) startMusic(mood);
      if (ambienceEnabled) startAmbience();
    }

    // --- Intro (muzyka ekranów przed rozgrywką: menu główne, wybór cywilizacji,
    // ustawienia) — patrz audio/filePlayer.ts (introPlaylist) + rozszerzenie
    // zadania muzyki kamienia z 2026-07-20. Jedna ciągła playlista niezależna
    // od era/mood; milknie dokładnie w startGameMusic() powyżej.
    let introGestureArmed = false;
    /** Jednorazowy nasłuch na PIERWSZĄ interakcję w całym dokumencie — fallback
     *  na wypadek, gdy resumeIntroMusic() zostanie wywołane bez gestu (jedyny
     *  taki przypadek: pierwsze pokazanie menu na starcie strony, wprost z
     *  boot(), zanim gracz kliknie cokolwiek). Wszystkie POZOSTAŁE wywołania
     *  openStartupMainMenu() dzieją się już wewnątrz handlerów kliknięć, więc
     *  startIntroMusic() tam działa od razu — ten nasłuch po prostu nic wtedy
     *  nie robi (self-removes po pierwszym zdarzeniu, start jest no-op gdy gra). */
    function armIntroFallbackGesture(): void {
      if (introGestureArmed) return;
      introGestureArmed = true;
      const onGesture = (): void => {
        document.removeEventListener('pointerdown', onGesture, true);
        document.removeEventListener('keydown', onGesture, true);
        startIntroMusic();
      };
      document.addEventListener('pointerdown', onGesture, true);
      document.addEventListener('keydown', onGesture, true);
    }
    /** Uruchamia (lub wznawia) playlistę intro. Wołane za każdym razem, gdy
     *  pokazuje się ekran przedgrowy (patrz openStartupMainMenu()). CELOWO
     *  odcięte od `musicEnabled` (C-AUD-Q5=A): intro nigdy nie milknie z
     *  powodu wyciszenia dokonanego W GRZE — to osobna, ulotna, per-rozgrywkowa
     *  decyzja (patrz startGameMusic() i audio/musicPrefs.ts). Głośność nadal
     *  respektowana przez setMusicVolume() (wspólna, trwała, patrz wyżej). */
    function resumeIntroMusic(): void {
      startIntroMusic();
      armIntroFallbackGesture();
    }
    // P3a: Last-turn totals for HUD display (Praca, Kultura from economy; Porzadek from order)
    /** Pula Pracy gracza (suma doPuli z miast — plaster D2=A). */
    let playerPracaPool: number = 0;
    let _lastPraca: number = 0;
    /** ZADANIE 1 (Maciej 2026-07-23): Praca/turę odjęta z playerPracaPool za utrzymanie
     *  ulepszeń surowcowych (civ-wide) w ostatniej turze -- wyłącznie do wyświetlenia
     *  w UI (panel Bilans/ZASOBY IMPERIUM); odjęcie samo dzieje się raz, w bloku
     *  po pętli per-miasto (patrz econ.pracaUpkeepByOwner). */
    let _lastPracaUpkeep: number = 0;
    let _lastKultura: number = 0;
    let _lastPracaRate: number = 0;
    let _lastKulturaRate: number = 0;
    let _lastPieniadzRate: number = 0;
    let _lastWealthLevel: number = 1;
    let _lastWealthMnoznik: number = 1;
    let _lastNaukaRate: number = 0;
    let _lastLudnoscRate: number = 0;
    let _lastBogactwoRate: number = 0;
    /** Live brutto żywności imperium (preview) — gdy brak ticku po endTurn. */
    let _liveFoodBrutto: number = 0;
    /** Ostatni tick ekonomii per miasto gracza (HUD imperium). */
    let _lastPlayerCityEcon: Array<{
      cityId: string;
      name: string;
      pieniadz: number;
      doPuli: number;
      doBudynkow: number;
      nauka: number;
    }> = [];

    /** A1-Q18: oczekujące propozycje dyplomatyczne AI (blocking). */
    const pendingDiplomacyInbox: Array<{
      id: string; ownerId: number; civName: string; cmdType: string; reason: string;
      goldOnce?: number;
      /** HANDEL-SUROWCE-CYKL (2026-07-24): dane 'zaproponuj_handel_surowiec', do odtworzenia cmd przy akceptacji. */
      surowiecKey?: string;
      surowiecLabel?: string;
      pakietyPerTura?: number;
      zaplataTyp?: 'zloto' | 'praca';
      zaplataPerTura?: number;
      resTurns?: number;
    }> = [];

    /** Tura ostatniej propozycji jednorazowego daru ¤ AI→gracz (cooldown per ownerId). */
    const aiOneShotGiftLastTurn = new Map<number, number>();

    /**
     * E6 (2026-07-23): tura ostatniej PROAKTYWNEJ propozycji Umowy Handlowej
     * AI→gracz (cooldown per ownerId — gracz jest zawsze druga strona, 0).
     */
    const aiTradeAgreementLastProposalTurn = new Map<number, number>();
    /**
     * E6: tura ostatniej zawartej Umowy Handlowej AI↔AI (cooldown per para,
     * klucz diploPairKey(a,b) — patrz formAiAiTradeAgreementsIfEligible).
     */
    const aiAiTradeAgreementLastTurn = new Map<string, number>();
    /**
     * HANDEL-SUROWCE-CYKL (2026-07-24): tura ostatniej PROAKTYWNEJ propozycji handlu
     * surowcem AI→gracz (cooldown per ownerId — gracz jest zawsze druga strona, 0).
     */
    const aiResourceTradeLastProposalTurn = new Map<number, number>();

    function unitAttackScore(u: RuntimeUnit): number {
      return normFieldVal(lookupUnitDef(u.typeId)['meleeAttack'], 0);
    }

    /** Sync tokenów: 1 reprezentant/heks (najmocniejszy) + badge ×N. */
    function syncUnitsRender(list?: RuntimeUnit[]): void {
      if (isCityPanelOpen()) {
        unitRenderer.setForceVisibleUnitId(null);
        unitRenderer.sync([], { visibleIds: new Set(), badgeByRepId: new Map() });
        syncForestForUnits(new Set());
        cityRenderer.syncStatChips(cities, _cityRenderOpts());
        return;
      }
      // FoW: bez jawnej listy filtruj wroga — syncUnitsRender() sam z siebie nie może
      // pokazać obcych poza bieżącym zasięgiem (regresja: czerwone pierścienie w czerni).
      const rawSrc = list ?? (fogOn ? visibleUnitsList(currentVisible()) : units);
      const src = deferredPlayerUnitRevealIds.size > 0
        ? rawSrc.filter(u => !deferredPlayerUnitRevealIds.has(u.id))
        : rawSrc;
      const display = computeStackDisplay(src, unitAttackScore);
      if (anim?.movingStackIds?.length) {
        for (const sid of anim.movingStackIds) display.visibleIds.add(sid);
      } else if (forceVisibleUnitId) {
        display.visibleIds.add(forceVisibleUnitId);
      }
      // MAP-Q1: czaszka głodu — tylko jednostki wojskowe (nie zwiadowca/osadnik/robotnik),
      // gdy państwo głoduje wg isArmyStarving().
      const unitById = new Map<string, RuntimeUnit>();
      for (const u of src) unitById.set(u.id, u);
      const starvingOwnerCache = new Map<number, boolean>();
      for (const repId of display.visibleIds) {
        const rep = unitById.get(repId);
        if (!rep || isCivilianUnit(rep)) continue;
        let starving = starvingOwnerCache.get(rep.ownerId);
        if (starving === undefined) {
          starving = isArmyStarving(rep.ownerId);
          starvingOwnerCache.set(rep.ownerId, starving);
        }
        if (starving) {
          if (!display.starvingRepIds) display.starvingRepIds = new Set();
          display.starvingRepIds.add(repId);
        }
      }
      unitRenderer.setForceVisibleUnitId(forceVisibleUnitId);
      unitRenderer.setCityHexKeys(new Set(cities.map(c => keyOf(c.q, c.r))));
      unitRenderer.sync(src, display);
      const unitForestHexKeys = new Set<string>();
      for (const u of src) {
        if (display.visibleIds.has(u.id)) unitForestHexKeys.add(keyOf(u.q, u.r));
      }
      if (forceVisibleUnitId) {
        const fu = units.find(u => u.id === forceVisibleUnitId);
        if (fu) unitForestHexKeys.add(keyOf(fu.q, fu.r));
      }
      syncForestForUnits(unitForestHexKeys);
      cityRenderer.syncStatChips(cities, _cityRenderOpts());
    }

    function isHexPassableForUnit(q: number, r: number): boolean {
      const hk = keyOf(q, r);
      const hex = map.hexes[hk];
      if (!hex) return false;
      return terrainMoveCost(hex) !== Infinity;
    }

    /** Set of occupied hex keys for all units except the given id(s). */
    function occupiedExcept(...exceptIds: string[]): Set<string> {
      const skip = new Set(exceptIds);
      const occ = new Set<string>();
      for (const u of units) {
        if (!skip.has(u.id)) occ.add(keyOf(u.q, u.r));
      }
      return occ;
    }

    /** Pathfinding: obce miasta = zablokowane (tylko garnizon własny). */
    function occupiedForMove(moverOwnerId: number, ...exceptIds: string[]): Set<string> {
      return addForeignCityBlocks(occupiedExcept(...exceptIds), moverOwnerId, cities);
    }

    // TEMAT #15 — embarkacja: czy właściciel zna Żeglugę (gracz / AI).
    // Barbarzyńcy (ownerId ujemne): pływają tylko już-zaokrętowani (Ludy Morza).
    function ownerHasSeafaring(ownerId: number): boolean {
      if (ownerId === 0) return player.zbadane.has(EMBARK_TECH);
      if (ownerId > 0) return aiResearchDone.get(ownerId)?.has(EMBARK_TECH) === true;
      return false;
    }

    /** Funkcja kosztu ruchu jednostki: woda przejezdna, gdy może się zaokrętować. */
    function moveCostFnForUnit(u: RuntimeUnit): ((hex: Hex) => number) | undefined {
      return moveCostFnFor(u, ownerHasSeafaring(u.ownerId));
    }

    /** Wypchnij obce jednostki z heksów miasta (naprawa stanu / AI / barbarzyńcy). */
    function evictForeignUnitsFromCityHexes(): void {
      let moved = false;
      for (const u of units) {
        if (canUnitOccupyCityHex(u.ownerId, u.q, u.r, cities)) continue;
        const adj = findAdjacentEmptyHexes(
          units.filter(x => x.id !== u.id),
          u.q,
          u.r,
          (nq, nr) =>
            isHexPassableForUnit(nq, nr) &&
            canUnitOccupyCityHex(u.ownerId, nq, nr, cities),
        );
        const dest = adj[0];
        if (!dest) continue;
        u.q = dest.q;
        u.r = dest.r;
        moved = true;
      }
      if (moved) syncUnitsRender();
    }

    function playerStackAt(u: RuntimeUnit): RuntimeUnit[] {
      return visibleStackOnHex(units, u.q, u.r, u.ownerId);
    }

    function stackCanMove(u: RuntimeUnit): boolean {
      return stackRuchLeft(playerStackAt(u)) > 0;
    }

    /** Zasięg ruchu + heksy własnych stosów osiągalne kosztem ruchu (merge). */
    function reachableWithMergeTargets(unit: RuntimeUnit): Set<string> {
      const stack = playerStackAt(unit);
      const mover = unitWithStackRuch(unit, stack);
      const exceptIds = stack.map(s => s.id);
      const occ = occupiedForMove(unit.ownerId, ...exceptIds);
      // TEMAT #15: jednostka z Żeglugą (lub zaokrętowana) widzi też heksy wody.
      const costFn = moveCostFnForUnit(unit);
      const reach = computeReachable(mover, map, occ, costFn);
      if (mover.ruchLeft <= 0) return reach;

      const seenStacks = new Set<string>();
      for (const u of units) {
        if (u.ownerId !== unit.ownerId || exceptIds.includes(u.id)) continue;
        const k = keyOf(u.q, u.r);
        if (k === keyOf(unit.q, unit.r)) continue;
        if (seenStacks.has(k)) continue;
        seenStacks.add(k);

        const path = computePath(mover, map, u.q, u.r, occ, costFn);
        if (path.length === 0) continue;
        if (pathCost(path, map, costFn) <= mover.ruchLeft) reach.add(k);
      }
      return reach;
    }

    function applyMapCanvasCursor(cursor: string): void {
      if (canvas.style.cursor !== cursor) canvas.style.cursor = cursor;
    }

    function mergeUnitRow(u: RuntimeUnit): { id: string; name: string; icon: string; ruchLeft: number; ruchMax: number } {
      const def = lookupUnitDef(u.typeId);
      return {
        id: u.id,
        name: u.typeId,
        icon: unitIconSvg(def, u.typeId),
        ruchLeft: u.ruchLeft,
        ruchMax: normFieldVal(def['Ruch'], u.ruch),
      };
    }

    function promptMergeIfCoLocated(
      movedUnitIds: string[],
      fromQ: number,
      fromR: number,
      moveCost: number,
    ): void {
      if (movedUnitIds.length === 0) return;
      const movedSet = new Set(movedUnitIds);
      const rep = units.find(x => x.id === movedUnitIds[0]);
      if (!rep || rep.ownerId !== 0) return;

      const onHex = visibleStackOnHex(units, rep.q, rep.r, rep.ownerId);
      const existing = onHex.filter(x => !movedSet.has(x.id));
      if (existing.length === 0) return;

      if (endTurnInProgress) {
        deferredMergePrompts.push({
          movedUnitIds: [...movedUnitIds],
          fromQ,
          fromR,
          moveCost,
        });
        return;
      }

      const arrivingUnits = onHex.filter(x => movedSet.has(x.id));
      const arrivingRow = arrivingUnits.length === 1
        ? mergeUnitRow(arrivingUnits[0]!)
        : {
            ...mergeUnitRow(arrivingUnits[0]!),
            name: 'Skład (' + arrivingUnits.length + ')',
          };

      showArmyMergePanel({
        hexLabel: '(' + rep.q + ',' + rep.r + ')',
        existing: existing.map(mergeUnitRow),
        arriving: arrivingRow,
        arrivingCount: arrivingUnits.length,
        rejectFrom: { q: fromQ, r: fromR },
        moveCost,
        onMerge: () => {
          syncStackRuchLeft(onHex);
          showHintMessage(
            'Po\u0142\u0105czono: ' + onHex.length + ' jedn. na (' + rep.q + ',' + rep.r + ')',
            3200,
          );
          syncUnitsRender();
          refreshFog();
          const selRep = pickStackRepresentative(onHex, unitAttackScore);
          if (selectedId !== null && movedSet.has(selectedId)) {
            selectPlayerUnit(selRep.id);
          } else if (selectedId === rep.id || movedSet.has(selectedId ?? '')) {
            unitRenderer.setSelectionHex(rep.q, rep.r, rep.ownerId);
            if (stackCanMove(selRep)) {
              reachable = reachableWithMergeTargets(selRep);
              unitRenderer.setHighlight(reachable);
            } else {
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
            }
          }
          refreshD1bHud();
          flushDeferredMergePrompts();
        },
        onSeparate: () => {
          const bounces = assignBounceHexesForUnits(
            units,
            fromQ,
            fromR,
            movedUnitIds,
            isHexPassableForUnit,
          );
          for (const [id, pos] of bounces) {
            const mu = units.find(x => x.id === id);
            if (mu) {
              mu.q = pos.q;
              mu.r = pos.r;
            }
          }
          syncUnitsRender();
          refreshFog();
          const remain = visibleStackOnHex(units, rep.q, rep.r, rep.ownerId);
          if (remain.length > 0) {
            const selRep = pickStackRepresentative(remain, unitAttackScore);
            selectPlayerUnit(selRep.id);
          } else if (selectedId !== null && movedSet.has(selectedId)) {
            const bounced = units.find(x => x.id === selectedId);
            if (bounced) selectPlayerUnit(bounced.id);
          }
          showHintMessage(
            arrivingUnits.length > 1
              ? 'Armie osobno — ' + arrivingUnits.length + ' jedn. wróciło obok stosu'
              : rep.typeId + ' — osobno, obok stosu (' + rep.q + ',' + rep.r + ')',
            2800,
          );
          refreshD1bHud();
          flushDeferredMergePrompts();
        },
      });
    }

    /** Po starcie tury gracza: pokaż odłożone prompty połączenia armii (kolejno). */
    function flushDeferredMergePrompts(): void {
      if (deferredMergePrompts.length === 0 || endTurnInProgress) return;
      if (isArmyMergePanelOpen()) return;
      const next = deferredMergePrompts.shift()!;
      promptMergeIfCoLocated(next.movedUnitIds, next.fromQ, next.fromR, next.moveCost);
    }

    function afterPlayerUnitSpawned(newUnitId: string): void {
      syncUnitsRender();
      const u = units.find(x => x.id === newUnitId);
      if (!u || u.ownerId !== 0) return;
      const coLocated = visibleStackOnHex(units, u.q, u.r, u.ownerId)
        .filter(x => x.id !== newUnitId);
      if (coLocated.length > 0) {
        promptMergeIfCoLocated([newUnitId], u.q, u.r, 0);
        return;
      }
      selectPlayerUnit(newUnitId);
    }

    /** Po fazie AI: pokaż jednostki ukończone w ticku end-turn (produkcja/rekrutacja). */
    function flushDeferredPlayerUnitReveals(): void {
      if (deferredPlayerUnitRevealIds.size === 0) return;
      const ids = [...deferredPlayerUnitRevealIds];
      deferredPlayerUnitRevealIds.clear();
      syncUnitsRender();
      const lastId = ids[ids.length - 1];
      if (lastId) afterPlayerUnitSpawned(lastId);
    }

    function openSplitPanelForSelected(): void {
      if (selectedId === null) return;
      const active = units.find(x => x.id === selectedId);
      if (!active || active.ownerId !== 0) return;
      const stack = visibleStackOnHex(units, active.q, active.r, active.ownerId);
      if (stack.length < 2) return;
      const dests = findAdjacentEmptyHexes(units, active.q, active.r, isHexPassableForUnit);
      if (dests.length === 0) {
        showHintMessage('Brak wolnego s\u0105siedniego heksu na rozdzielenie.', 3500);
        return;
      }
      const srcQ = active.q;
      const srcR = active.r;
      showArmySplitPanel({
        hexLabel: '(' + srcQ + ',' + srcR + ')',
        units: stack.map(mergeUnitRow),
        destHexes: dests.map(d => ({
          q: d.q,
          r: d.r,
          label: '(' + d.q + ',' + d.r + ')',
        })),
        onSplit: (ids, destQ, destR) => {
          for (const id of ids) {
            const u = units.find(x => x.id === id);
            if (!u) continue;
            u.q = destQ;
            u.r = destR;
            u.ruchLeft = 0;
          }
          refreshFog();
          const movedSel = ids.includes(selectedId ?? '');
          if (movedSel && ids.length === 1) {
            selectPlayerUnit(ids[0]!, true);
          } else {
            const rep = unitAtRepresentative(srcQ, srcR, units, unitAttackScore);
            if (rep) selectPlayerUnit(rep.id, true);
            else {
              const remain = visibleStackOnHex(units, srcQ, srcR, 0);
              if (remain.length > 1) syncStackRuchLeft(remain);
            }
          }
          showHintMessage(
            'Rozdzielono: ' + ids.length + ' jedn. \u2192 (' + destQ + ',' + destR + ')',
            3200,
          );
          refreshD1bHud();
        },
        onCancel: () => refreshD1bHud(),
      });
    }

    // --- D1B build mode (A4) + improvement placement ---
    let buildModeOpen = false;
    let activeImprovementKey: ImprovementKey | null = null;

    // --- Warstwy zasięgu kultury / religii / państwa na mapie 3D (A1-Q12 + toolbar [C]) ---
    let cultureRangeVisible = false;
    let religionRangeVisible = false;
    let territoryBorderVisible = false;
    let cultureRangeGroup: THREE.Group | null = null;
    let religionRangeGroup: THREE.Group | null = null;
    let territoryBorderGroup: THREE.Group | null = null;

    // --- E7 (epik Handel): łuki tras handlowych na mapie 3D ---
    let tradeRoutesOverlayGroup: THREE.Group | null = null;

    function clearTradeRoutesOverlay(): void {
      if (!tradeRoutesOverlayGroup) return;
      scene.remove(tradeRoutesOverlayGroup);
      disposeTradeRoutesOverlayGroup(tradeRoutesOverlayGroup);
      tradeRoutesOverlayGroup = null;
    }

    /** Przerysuj łuki tras handlowych (wołaj po każdej zmianie tradeRoutes — co turę). */
    function refreshTradeRoutesOverlay(): void {
      clearTradeRoutesOverlay();
      if (isCityPanelOpen()) return;
      if (tradeRoutes.length === 0) return;
      const cityById = new Map(cities.map(c => [c.id, c] as const));
      const inputs: TradeRouteOverlayInput[] = [];
      for (const route of tradeRoutes) {
        if (route.status !== 'polaczony') continue;
        const from = cityById.get(route.fromCityId);
        const to = cityById.get(route.toCityId);
        if (!from || !to) continue;
        inputs.push({ fromQ: from.q, fromR: from.r, toQ: to.q, toR: to.r, medium: route.medium });
      }
      if (inputs.length === 0) return;
      tradeRoutesOverlayGroup = buildTradeRoutesOverlayGroup(map, inputs);
      scene.add(tradeRoutesOverlayGroup);
    }

    // --- E-map-worker-overlay: ikonki 👤 na polach z robotnikami (wszystkie miasta gracza) ---
    let showWorkerOverlay = false;
    let workerFieldOverlayGroup: THREE.Group | null = null;

    function clearWorkerFieldOverlay(): void {
      if (!workerFieldOverlayGroup) return;
      scene.remove(workerFieldOverlayGroup);
      disposeWorkerFieldOverlayGroup(workerFieldOverlayGroup);
      workerFieldOverlayGroup = null;
    }

    function refreshWorkerFieldOverlay(): void {
      clearWorkerFieldOverlay();
      if (!showWorkerOverlay || isCityPanelOpen()) return;
      const keys = collectWorkedHexKeysForOwner(cities, map, 0, {
        isWorkable: okolicaHexWorkable,
        territoryNodes: buildAllTerritoryNodes(),
      });
      if (keys.size === 0) return;
      workerFieldOverlayGroup = syncWorkerFieldOverlay(scene, null, map, keys);
    }

    function toggleWorkerOverlayOnMap(): void {
      showWorkerOverlay = !showWorkerOverlay;
      refreshWorkerFieldOverlay();
      refreshD1bHud();
    }

    function autoEnableWorkerOverlayForBuildMode(): void {
      showWorkerOverlay = true;
      refreshWorkerFieldOverlay();
      refreshD1bHud();
    }

    function rangeCityInputs(): RangeCityInput[] {
      return cities.map(c => ({
        id: c.id,
        q: c.q,
        r: c.r,
        ownerId: c.ownerId,
        population: c.population,
        kultura: (c as { kultura?: number }).kultura ?? 0,
      }));
    }

    function clearRangeOverlay(kind: 'culture' | 'religion'): void {
      if (kind === 'culture') {
        if (cultureRangeGroup) {
          scene.remove(cultureRangeGroup);
          disposeRangeOverlayGroup(cultureRangeGroup);
          cultureRangeGroup = null;
        }
      } else {
        if (religionRangeGroup) {
          scene.remove(religionRangeGroup);
          disposeRangeOverlayGroup(religionRangeGroup);
          religionRangeGroup = null;
        }
      }
    }

    function clearTerritoryBorderOverlay(): void {
      if (!territoryBorderGroup) return;
      scene.remove(territoryBorderGroup);
      disposeRangeOverlayGroup(territoryBorderGroup);
      territoryBorderGroup = null;
    }

    function refreshTerritoryBorderOverlay(): void {
      clearTerritoryBorderOverlay();
      if (!territoryBorderVisible || isCityPanelOpen()) return;
      const nodes = buildAllTerritoryNodes();
      const byOwner = collectTerritoryHexKeysByOwner(map, nodes, (key, ownerId) => {
        if (ownerId === 0) return true;
        if (!fogOn) return true;
        const vis = currentVisible();
        const explored = fogExploredForRender();
        return vis.has(key) || explored.has(key);
      });
      if (byOwner.size === 0) return;
      territoryBorderGroup = buildTerritoryBorderGroup(map, byOwner, civColorFn);
      scene.add(territoryBorderGroup);
    }

    function toggleTerritoryBorderOnMap(): void {
      territoryBorderVisible = !territoryBorderVisible;
      hideEmpireOverlay();
      hideHexContextPanel();
      refreshTerritoryBorderOverlay();
      refreshD1bHud();
    }

    function refreshRangeOverlays(): void {
      clearRangeOverlay('culture');
      clearRangeOverlay('religion');
      if (isCityPanelOpen()) return;
      if (cultureRangeVisible) {
        const keys = collectCultureRangeHexKeys(map, rangeCityInputs(), 0);
        if (keys.size > 0) {
          cultureRangeGroup = buildRangeOverlayGroup(map, keys, CULTURE_RANGE_STYLE);
          scene.add(cultureRangeGroup);
        }
      }
      if (religionRangeVisible) {
        const rp = loadReligionParams(data.societyParams, _menuDifficulty);
        const stateRel = ownerReligionForOwnerId(0);
        const keys = collectReligionRangeHexKeys(
          map, rangeCityInputs(), cityRelig, stateRel, rp, 0,
        );
        if (keys.size > 0) {
          religionRangeGroup = buildRangeOverlayGroup(map, keys, RELIGION_RANGE_STYLE);
          scene.add(religionRangeGroup);
        }
      }
    }

    function toggleCultureRangeOnMap(): void {
      cultureRangeVisible = !cultureRangeVisible;
      hideEmpireOverlay();
      hideHexContextPanel();
      refreshRangeOverlays();
      refreshD1bHud();
    }

    function toggleReligionRangeOnMap(): void {
      religionRangeVisible = !religionRangeVisible;
      hideEmpireOverlay();
      hideHexContextPanel();
      refreshRangeOverlays();
      refreshD1bHud();
    }

    // Ghost preview — tryb budowy (ulepszenia + założenie miasta)
    let ghostGroup: THREE.Group | null = null;
    let ghostCityGroup: THREE.Group | null = null;
    let lastGhostKey = '';
    let lastGhostCityKey = '';
    let lastMouseX = 0;
    let lastMouseY = 0;
    let chipOverCanvas = false;

    const ghostChip = document.createElement('div');
    ghostChip.id = 'civ-build-ghost-chip';
    ghostChip.style.cssText = [
      'position:fixed', 'z-index:400', 'display:none', 'pointer-events:none',
      'align-items:center', 'gap:6px', 'padding:6px 10px', 'border-radius:6px',
      'font:12px/1.2 Arial,sans-serif', 'color:#ffe8a0',
      'background:rgba(30,34,50,0.92)', 'border:1px solid rgba(255,212,121,0.75)',
      'box-shadow:0 4px 14px rgba(0,0,0,0.55)',
    ].join(';');
    document.body.appendChild(ghostChip);

    const IMPROVEMENT_CHIP: Partial<Record<ImprovementKey, string>> = {
      farma: '🌾', pastwisko: '🐑', kopalnia: '⛏', kamieniolom: '🪨',
      oboz_lowiecki: '🏹', wyrab: '🪓', tartak: '🪚', lodzie_rybackie: '🎣', droga: '🛤',
      posterunek: '🏰', irygacja: '💧', pole_irygowane: '🌾', glinianka: '🏺',
      warzelnia_soli: '🧂', tarasy: '🏔', fort: '🛡',
    };

    function playerBronzeCiv(): BronzeCiv {
      return ikonaIdToBronzeCiv(String(player.civType || _menuCivId || 'grecja'));
    }

    function applyGhostMaterial(g: THREE.Group, valid: boolean): void {
      g.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const mesh = obj as THREE.Mesh;
          const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          const cloned = mats.map((m) => {
            const c = (m as THREE.MeshLambertMaterial).clone();
            c.transparent = true;
            c.opacity = valid ? 0.52 : 0.32;
            c.depthWrite = false;
            if ('emissive' in c) c.emissive.set(valid ? 0x224422 : 0x552222);
            return c;
          });
          mesh.material = cloned.length === 1 ? cloned[0]! : cloned;
          mesh.castShadow = false;
        }
      });
    }

    function removeBuildGhosts(): void {
      if (ghostGroup) { scene.remove(ghostGroup); ghostGroup = null; }
      if (ghostCityGroup) { scene.remove(ghostCityGroup); ghostCityGroup = null; }
      lastGhostKey = '';
      lastGhostCityKey = '';
      ghostChip.style.display = 'none';
    }

    function removeGhostImprovement(): void {
      if (ghostGroup) { scene.remove(ghostGroup); ghostGroup = null; }
      lastGhostKey = '';
    }

    function removeGhostCity(): void {
      if (ghostCityGroup) { scene.remove(ghostCityGroup); ghostCityGroup = null; }
      lastGhostCityKey = '';
    }

    function updateBuildGhostChip(clientX: number, clientY: number, label: string, valid: boolean): void {
      if (!chipOverCanvas || !buildModeOpen) {
        ghostChip.style.display = 'none';
        return;
      }
      ghostChip.innerHTML = '<span style="font-size:16px;line-height:1">' + label + '</span>'
        + '<span>' + (valid ? 'Kliknij hex' : 'Niedozwolone') + '</span>';
      ghostChip.style.borderColor = valid ? 'rgba(255,212,121,0.75)' : 'rgba(255,102,85,0.85)';
      ghostChip.style.display = 'flex';
      ghostChip.style.left = (clientX + 18) + 'px';
      ghostChip.style.top = (clientY - 32) + 'px';
    }

    function showGhostImprovement(q: number, r: number): void {
      if (!activeImprovementKey || !buildApi) { removeGhostImprovement(); return; }
      const newKey = q + ',' + r + '|' + activeImprovementKey;
      if (newKey === lastGhostKey) return;
      removeGhostImprovement();
      const hexes = buildApi.getQualifyingHexes(activeImprovementKey);
      const ok = hexes.some(h => h.q === q && h.r === r);
      if (!ok) return;
      const hk = keyOf(q, r);
      const preview = [...new Set([...mergedImprovementLayers(hk), activeImprovementKey])];
      const g = buildImprovementVisual(preview);
      const wp = axialToWorld(q, r, HEX_R);
      g.position.set(wp.x, improvementMeshPlacement(q, r, preview), wp.z);
      applyGhostMaterial(g, true);
      scene.add(g);
      ghostGroup = g;
      lastGhostKey = newKey;
    }

    function showGhostCity(q: number, r: number): void {
      const newKey = q + ',' + r + '|city';
      if (newKey === lastGhostCityKey) return;
      removeGhostCity();
      const valid = canFoundPlayerCityAt(q, r).ok;
      const hex = map.hexes[keyOf(q, r)];
      if (!hex) return;
      const civ = playerBronzeCiv();
      const g = buildSettlementModel(player.era, civ, 1, 0xffd54a, false);
      const wp = axialToWorld(q, r, HEX_R);
      g.position.set(wp.x, unitRenderer.topYAt(q, r) + 0.01, wp.z);
      applyGhostMaterial(g, valid);
      scene.add(g);
      ghostCityGroup = g;
      lastGhostCityKey = newKey;
    }

    function handleBuildModeHover(e: MouseEvent): void {
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      if (!buildModeOpen) {
        removeBuildGhosts();
        return;
      }
      const hit = pickHexAt(e.clientX, e.clientY);
      if (!hit) {
        removeBuildGhosts();
        return;
      }
      lastBHex = { q: hit.q, r: hit.r };
      if (foundCityMode) {
        removeGhostImprovement();
        if (isInStartReveal(hit.q, hit.r)) {
          showGhostCity(hit.q, hit.r);
          updateBuildGhostChip(e.clientX, e.clientY, '🏛', canFoundPlayerCityAt(hit.q, hit.r).ok);
        } else {
          removeGhostCity();
          updateBuildGhostChip(e.clientX, e.clientY, '🏛', false);
        }
        return;
      }
      if (activeImprovementKey) {
        removeGhostCity();
        const hexes = buildApi?.getQualifyingHexes(activeImprovementKey) ?? [];
        const ok = hexes.some(h => h.q === hit.q && h.r === hit.r);
        if (ok) showGhostImprovement(hit.q, hit.r);
        else removeGhostImprovement();
        const ic = IMPROVEMENT_CHIP[activeImprovementKey] ?? '🔨';
        updateBuildGhostChip(e.clientX, e.clientY, ic, ok);
        return;
      }
      removeBuildGhosts();
    }

    canvas.addEventListener('mouseenter', () => { chipOverCanvas = true; });
    canvas.addEventListener('mouseleave', () => {
      chipOverCanvas = false;
      ghostChip.style.display = 'none';
    });
    const placedImprovements = new Map<string, PlacedLayers>();
    const improvementMeshes = new Map<string, THREE.Group>();
    const clearingMeshes = new Map<string, THREE.Group>();
    const hexClearingStates = new Map<string, HexClearingState>();
    let pendingImprovementsTurn = new PendingImprovementsTurn();
    let buildApi: ImprovementBuildCallbacks | null = null;

    /** F-CITY-HEX: wyczyść hex + ukryj dekoracje terenu pod miastem. */
    function finalizeCityFounding(c: City, q: number, r: number): void {
      const hk = keyOf(q, r);
      // Macierz B (Maciej 2026-07-09): część ulepszeń/złóż ZOSTAJE na obrzeżu heksa miasta.
      // Wyjątek GÓRY: kasuje wszystkie ulepszenia. Filtr warstw przed czyszczeniem hexa.
      const mountainClearsAll = map.hexes[hk]?.terenBazowy === TerenBazowy.Gory;
      const prevLayers = placedImprovements.get(hk) ?? [];
      const keptLayers = (mountainClearsAll
        ? []
        : prevLayers.filter(k => cityKeepsImprovement(k))) as PlacedLayers;

      applyCityFoundingToHex(c, map, q, r); // nakładki/złoża wg macierzy B (las ZNIKA, złoża ZOSTAJĄ; Góry=wszystko)
      hideDecorAtHex(hk);                    // schowaj teren-dekor/las pod środkiem miasta
      if (keptLayers.length > 0) {
        // Ocalałe ulepszenia (macierz B ZOSTAJE) — na pierścieniu; plony/legacy z warstw.
        placedImprovements.set(hk, keptLayers);
        syncHexUlepszenieFields(hk, keptLayers);
      } else {
        placedImprovements.delete(hk);
        syncHexUlepszenieFields(hk, [] as PlacedLayers);
      }
      // FIX (review 2026-07-09): odbuduj mesh ZAWSZE — także dla GOŁEGO ocalałego złoża zwierzęcego
      // (macierz B ZOSTAJE; mergedImprovementLayers dokłada warstwę z foodLayerFromAnimalDeposit).
      // Bez tego miasto na dzikim złożu bydła/owiec kasowało jego model 3D mimo że dane je trzymały
      // (rozjazd dane↔render). spawnImprovementMesh sam zdejmuje stary mesh; no-op gdy heks pusty.
      spawnImprovementMesh(hk);
      hexClearingStates.delete(hk);
      removeClearingMesh(hk);
      // D4: zamiast pełnomapowego rebuildResourceOverlays (skan 320k + odbudowa wszystkich meshy)
      // odświeżamy nakładkę surowca TYLKO na heksie zakładanego miasta.
      syncResourceOverlayAtHex(hk);
      seedCityReligionAtFounding(c);
      seedWealthImmunityAtFounding(c);
      markCityStateDirty(); // D10: założenie miasta → przelicz ekonomię/moc państwa
    }

    function reapplyCityHexDecorHides(): void {
      for (const c of cities) hideDecorAtHex(keyOf(c.q, c.r));
    }

    function playerCityNodes(): CityNode[] {
      return cities
        .filter(c => c.ownerId === 0)
        .map(c => ({ q: c.q, r: c.r, pop: c.population, level: 1 }));
    }

    function syncLivestockAndPlacedMeshes(): void {
      for (const hexKey of Object.keys(map.hexes)) {
        const hex = map.hexes[hexKey];
        if (!hex) continue;
        const hasDeposit = isLivestockDepositNakladka(hex.nakladka);
        const hasPlaced = (placedImprovements.get(hexKey)?.length ?? 0) > 0;
        if (hasDeposit || hasPlaced) {
          spawnImprovementMesh(hexKey);
        }
      }
    }

    function collectPlacedImprovementKeys(): Set<string> {
      const keys = new Set(placedImprovements.keys());
      for (const [hk, hex] of Object.entries(map.hexes)) {
        if (hex.ulepszenie && hex.ulepszenie !== Ulepszenie.Brak) keys.add(hk);
      }
      return keys;
    }

    function improvementKeyToUlepszenie(key: ImprovementKey): Ulepszenie {
      const m: Partial<Record<ImprovementKey, Ulepszenie>> = {
        farma: Ulepszenie.Farma,
        irygacja: Ulepszenie.Irygacja,
        kopalnia: Ulepszenie.Kopalnia,
        droga: Ulepszenie.Droga,
        pastwisko: Ulepszenie.Pastwisko,
        bydlo: Ulepszenie.Pastwisko,
        owce: Ulepszenie.Pastwisko,
        lama: Ulepszenie.Pastwisko,
      };
      return m[key] ?? Ulepszenie.Brak;
    }

    function syncHexUlepszenieFields(hexKey: string, playerLayers: PlacedLayers): void {
      const hex = map.hexes[hexKey];
      if (!hex) return;
      const ext = hex as typeof hex & { ulepszenia?: string[]; improvementKey?: string };
      if (playerLayers.length) {
        ext.ulepszenia = [...playerLayers];
        ext.improvementKey = playerLayers[playerLayers.length - 1];
        const ul = improvementKeyToUlepszenie(playerLayers[playerLayers.length - 1] as ImprovementKey);
        if (ul !== Ulepszenie.Brak) hex.ulepszenie = ul;
      } else {
        delete ext.ulepszenia;
        delete ext.improvementKey;
        hex.ulepszenie = Ulepszenie.Brak;
      }
    }

    function refreshBuildApi(): void {
      buildApi = createImprovementBuildApi(
        {
          map,
          cityNodes: playerCityNodes(),
          territoryNodes: buildAllTerritoryNodes(),
          playerOwnerIdNum: 0,
          placedKeys: collectPlacedImprovementKeys(),
          roadKeys: collectRoadKeys(map),
          playerCivArchetype: String(player.civType || 'rzymianie'),
          playerEra: player.era,
          playerOwnerId: '0',
          placedImprovements,
          researchedTechs: player.zbadane,
          clearingHexKeys: new Set(hexClearingStates.keys()),
          pendingUndoKeys: pendingImprovementsTurn.getUndoKeySet(),
          // Temat #4: Stadnina bez własnego złoża konia, gdy gracz ma aktywny
          // grant "z trasy" na Konia (patrz ImprovementBuildState.tradeRouteKonUnlocked).
          tradeRouteKonUnlocked: hasTradeRouteResourceAccess(tradeRouteResourceGrants, 0, 'kon'),
        },
        {
          activeKey: activeImprovementKey,
          onSelect: (req) => applyBuildRequest(req),
        },
      );
    }

    function refreshBuildHighlight(): void {
      if (foundCityMode) {
        const qual = new Set<string>();
        for (const hex of Object.values(map.hexes)) {
          const { q, r } = hex.coords;
          if (!isInStartReveal(q, r)) continue;
          if (canFoundPlayerCityAt(q, r).ok) qual.add(keyOf(q, r));
        }
        unitRenderer.setHighlight(qual);
        return;
      }
      if (!buildModeOpen || !activeImprovementKey || !buildApi) {
        if (!buildModeOpen) unitRenderer.clearHighlight();
        return;
      }
      const hexes = buildApi.getQualifyingHexes(activeImprovementKey);
      unitRenderer.setHighlight(new Set(hexes.map(h => keyOf(h.q, h.r))));
    }

    function beginOnboardingFoundCity(): void {
      if (cities.some(c => c.ownerId === 0)) return;
      buildModeOpen = true;
      autoEnableWorkerOverlayForBuildMode();
      foundCityMode = true;
      activeImprovementKey = null;
      refreshBuildApi();
      refreshBuildHighlight();
      refreshD1bHud();
      if (playerStartHex) {
        const focusPos = axialToWorld(playerStartHex.q, playerStartHex.r, HEX_R);
        camCtrl.focusAt(focusPos.x, focusPos.z, 22);
      }
      showHintMessage(
        'Załóż pierwsze miasto w oświetlonym obszarze (🔨 → Załóż miasto · B). Promień zależy od trudności.',
        12000,
      );
    }

    function resolveFoundCityName(): string {
      return suggestPlayerFoundCityName(
        data.cityNamesPools,
        civTypeForOwner(0),
        cities,
        civTypeForOwner,
        0,
      ) || clusterPlayerStartCityName || playerStartCityName(data.civs, _menuCivId, data.cityNamesPools);
    }

    function handleFoundCityMapClick(q: number, r: number): void {
      const fc = canFoundPlayerCityAt(q, r);
      if (fc.ok) {
        tryFoundPlayerCityAt(q, r);
      } else {
        showHintMessage('Nie można założyć: ' + fc.reason, 2500);
      }
    }

    function tryFoundPlayerCityAt(q: number, r: number): boolean {
      const res = canFoundPlayerCityAt(q, r);
      if (!res.ok) {
        showHintMessage('Nie można założyć: ' + res.reason, 3000);
        return false;
      }
      const playerCities = cities.filter(c => c.ownerId === 0);
      const aff = evaluateFoundCityAffordance(playerPracaPool, playerCities, 0);
      if (!aff.ok) {
        showHintMessage(aff.reason ?? 'Nie stać', 3000);
        return false;
      }
      const name = resolveFoundCityName();
      playerPracaPool -= aff.kosztPraca;
      _lastPraca = playerPracaPool;
      let sourceCityName: string | null = null;
      if (aff.sourceCityId) {
        const src = cities.find(c => c.id === aff.sourceCityId);
        if (src) {
          src.population = Math.max(1, src.population - aff.kosztLudnosc);
          sourceCityName = src.name;
        }
      }
      const c = foundCityAt(q, r, 0, cities, map, name);
      if (!c) {
        showHintMessage('Nie udało się założyć miasta (hex zablokowany)', 3000);
        return false;
      }
      ensureCitySaveDefaults(c);
      cities.push(c);
      reconcileAllWorkedTiles(cities, buildAllTerritoryNodes());
      finalizeCityFounding(c, q, r);
      spawnPendingSameTypeRivals(q, r);
      refreshFog();
      cityRenderer.sync(cities, _cityRenderOpts());
      playerEverOwnedCity = true;
      exitBuildMode();
      hideCityPanelFull();
      clearPlayerUnitSelection();
      lastBHex = null;
      // D12: usunięty zbędny drugi refreshFog (pierwszy — po spawnie rywali — już odświeżył mgłę).
      updateHud();
      refreshD1bHud();
      showHintMessage(
        sourceCityName
          ? 'Miasto ' + c.name + ' założone! (−' + aff.kosztLudnosc + ' 👤 z ' + sourceCityName + ')'
          : 'Miasto ' + c.name + ' założone!',
        3000,
      );
      return true;
    }

    function exitBuildMode(): void {
      // R-PIERWSZE-MIASTO (Maciej 2026-07-24): dopóki gracz nie ma pierwszego miasta,
      // tryb zakładania miasta jest NIEWYJŚCIOWY — jeden choke-point zamyka wszystkie
      // furtki (Escape, PPM, toggle 🔨, dismissMapOverlayModes). Udane założenie ustawia
      // playerEverOwnedCity=true PRZED wywołaniem exitBuildMode, więc poprawne zamknięcie
      // po założeniu działa (isAwaitingFirstPlayerCity() już false).
      if (isAwaitingFirstPlayerCity()) return;
      buildModeOpen = false;
      foundCityMode = false;
      activeImprovementKey = null;
      removeBuildGhosts();
      refreshBuildApi();
      refreshBuildHighlight();
      refreshD1bHud();
    }

    function undoPendingBuildRequest(req: ImprovementBuildRequest): void {
      const pending = pendingImprovementsTurn.remove(req.hexKey, req.key);
      if (!pending) return;

      if (pending.action === 'wycinka') {
        hexClearingStates.delete(req.hexKey);
        removeClearingMesh(req.hexKey);
      } else {
        const prev = placedImprovements.get(req.hexKey) ?? [];
        const nextLayers = prev.filter(k => k !== req.key);
        if (nextLayers.length) {
          placedImprovements.set(req.hexKey, nextLayers);
          syncHexUlepszenieFields(req.hexKey, nextLayers);
        } else {
          placedImprovements.delete(req.hexKey);
          syncHexUlepszenieFields(req.hexKey, []);
        }
        spawnImprovementMesh(req.hexKey);
        rebuildResourceOverlays();
      }

      if (pending.kosztPraca > 0) {
        playerPracaPool += pending.kosztPraca;
        _lastPraca = playerPracaPool;
      }

      refreshBuildApi();
      refreshBuildHighlight();
      updateHud();
      showHintMessage('Cofnięto — Praca zwrócona (' + pending.kosztPraca + ')', 2500);
      console.log('[BuildMode] undo', req.key, req.hexKey);
    }

    function showBuildTerritoryBlockedHint(q: number, r: number): void {
      const nodes = buildAllTerritoryNodes();
      if (isPlayerTerritoryHex(q, r, playerCityNodes(), nodes, 0)) return;
      const owner = territoryOwnerAt(q, r, nodes);
      if (owner != null && owner !== 0) {
        showHintMessage('Tylko w swoim terytorium — ten heks należy do innego państwa', 3000);
      } else {
        showHintMessage('Poza terytorium — rozszerz okolicę miasta', 3000);
      }
    }

    function assertPlayerTerritoryForBuild(q: number, r: number): boolean {
      const nodes = buildAllTerritoryNodes();
      if (isPlayerTerritoryHex(q, r, playerCityNodes(), nodes, 0)) return true;
      showBuildTerritoryBlockedHint(q, r);
      return false;
    }

    function applyBuildRequest(req: ImprovementBuildRequest): void {
      if (pendingImprovementsTurn.has(req.hexKey, req.key)) {
        undoPendingBuildRequest(req);
        return;
      }

      const hex = map.hexes[req.hexKey];
      if (!hex) return;

      if (!pendingImprovementsTurn.has(req.hexKey, req.key)
        && !assertPlayerTerritoryForBuild(req.q, req.r)) {
        return;
      }

      if (req.action === 'wycinka') {
        if (hex.nakladka !== Nakladka.Las) return;
        if (hexClearingStates.has(req.hexKey)) return;
        const startCost = req.kosztPraca;
        if (startCost > 0 && playerPracaPool < startCost) {
          showHintMessage('Za mało Pracy na wycinkę (potrzeba ' + startCost + ')', 3000);
          return;
        }
        if (startCost > 0) {
          playerPracaPool -= startCost;
          _lastPraca = playerPracaPool;
        }
        const clr = freshClearingState(req.key, 0);
        if (clr) hexClearingStates.set(req.hexKey, clr);
        pendingImprovementsTurn.add({
          hexKey: req.hexKey,
          key: req.key,
          kosztPraca: startCost,
          action: 'wycinka',
        });
        spawnClearingMesh(req.hexKey);
        const costPart = startCost > 0 ? ' (koszt startu ' + startCost + ' Pracy)' : '';
        showHintMessage(
          'Wyrąb' + costPart + ': +20 Pracy/turę przez 3 tury (łącznie 60) · klik ponownie = cofnij',
          3500,
        );
        refreshBuildApi();
        refreshBuildHighlight();
        updateHud();
        console.log('[BuildMode] wycinka', req.hexKey);
        return;
      }

      if (!isImprovementTechUnlocked(req.key, player.zbadane)) {
        showHintMessage('Wymaga technologii', 2500);
        return;
      }
      if (!isLivestockAllowed(String(player.civType || ''), req.key, player.era)) {
        showHintMessage('To ulepszenie niedostępne dla twojej cywilizacji', 2500);
        return;
      }
      if (playerPracaPool < req.kosztPraca) {
        showHintMessage('Za mało Pracy (potrzeba ' + req.kosztPraca + ')', 3000);
        return;
      }
      playerPracaPool -= req.kosztPraca;
      _lastPraca = playerPracaPool;
      const prev = placedImprovements.get(req.hexKey) ?? [];
      if (prev.includes(req.key)) return;
      const nextLayers: PlacedLayers = [...prev, req.key];
      placedImprovements.set(req.hexKey, nextLayers);
      syncHexUlepszenieFields(req.hexKey, nextLayers);
      pendingImprovementsTurn.add({
        hexKey: req.hexKey,
        key: req.key,
        kosztPraca: req.kosztPraca,
        action: req.action,
      });

      spawnImprovementMesh(req.hexKey);
      rebuildResourceOverlays();

      refreshBuildApi();
      refreshBuildHighlight();
      updateHud();
      showHintMessage('Postawiono: ' + req.key + ' · klik ponownie w turze = cofnij', 2500);
      console.log('[BuildMode]', req.key, req.hexKey, 'koszt=' + req.kosztPraca);
    }

    /**
     * Ulepszenia, które NIE spłaszczają wzgórza/góry — zostaw naturalny kopiec/szczyt
     * (nie hideDecor): solo hodowla (bydło/owce/lama stoją na kopcu) + kamieniołom
     * (Maciej 2026-07-24, R-KAMIEN-RELIEF: kamieniołom ma być wkomponowany w istniejące
     * wzgórze/górę, a nie je spłaszczać — model już siada na wysokości szczytu/plateau
     * przez improvementMeshPlacement/galleryDecorSurfaceY poniżej; brakowało tylko
     * pozostawienia widocznej bryły reliefu pod nim).
     * Decyzja właściciela (2026-07-25, autonomiczna do rewizji ABC): kopalnia/kopalnia_miedzi
     * mają identyczny mechanizm spłaszczania — rozszerzone o nie, bo kopalnia wkomponowana
     * w zbocze wzgórza jest logiczniejsza niż płaski heks (spójne z kamieniołomem).
     */
    const PRESERVES_HILL_RELIEF_KEYS = new Set(['bydlo', 'owce', 'lama', 'kamieniolom', 'kopalnia', 'kopalnia_miedzi']);

    function preservesHillRelief(layers: readonly string[]): boolean {
      return layers.length > 0 && layers.every(k => PRESERVES_HILL_RELIEF_KEYS.has(k));
    }

    /** Y osadzenia mesh ulepszenia — solo hodowla na wzgórzu: wierzchołek kopca (kopiec zostaje widoczny). */
    function improvementMeshPlacement(q: number, r: number, layers: readonly string[]): number {
      const hex = map.hexes[keyOf(q, r)];
      const topY = unitRenderer.topYAt(q, r);
      if (!hex) return topY + 0.01;
      const teren = hex.terenBazowy;
      const elevated = teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
      if (layers.includes('tarasy') && teren === TerenBazowy.Wzgorza) {
        return topY;
      }
      if (elevated) {
        return galleryDecorSurfaceY(teren, topY, layers) + 0.01;
      }
      return topY + 0.01;
    }

    function syncImprovementDecorForHex(hexKey: string, layers: readonly string[]): void {
      if (layers.length === 0) return;
      const hex = map.hexes[hexKey];
      if (!hex) return;
      const teren = hex.terenBazowy;
      const elevated = teren === TerenBazowy.Wzgorza || teren === TerenBazowy.Gory;
      if (layers.includes('tarasy')) {
        hideDecorAtHex(hexKey);
        return;
      }
      // Maciej 2026-07-21: farma/hodowla na lesie bez wyrębu — schowaj kępę (nakładka Las zostaje).
      const foodOnForest = hex.nakladka === Nakladka.Las
        && layers.some(k => k === 'farma' || k === 'bydlo' || k === 'irygacja');
      if (foodOnForest) {
        hideDecorAtHex(hexKey);
        return;
      }
      if (elevated && preservesHillRelief(layers)) {
        return;
      }
      if (elevated) {
        hideDecorAtHex(hexKey);
      }
    }

    function removeClearingMesh(hexKey: string): void {
      const old = clearingMeshes.get(hexKey);
      if (old) {
        scene.remove(old);
        clearingMeshes.delete(hexKey);
      }
    }

    /** Ikona wyrębu (🪓) — widoczna przez całe 3 tury wycinki. */
    function spawnClearingMesh(hexKey: string): void {
      const parts = hexKey.split(',');
      if (parts.length !== 2) return;
      const q = parseInt(parts[0]!, 10);
      const r = parseInt(parts[1]!, 10);
      if (isNaN(q) || isNaN(r)) return;
      removeClearingMesh(hexKey);
      const layers: readonly string[] = ['wyrab'];
      const g = buildImprovementVisual(layers);
      const wp = axialToWorld(q, r, HEX_R);
      g.position.set(wp.x, improvementMeshPlacement(q, r, layers), wp.z);
      scene.add(g);
      clearingMeshes.set(hexKey, g);
    }

    function syncClearingMeshesFromState(): void {
      for (const mesh of clearingMeshes.values()) scene.remove(mesh);
      clearingMeshes.clear();
      for (const hexKey of hexClearingStates.keys()) spawnClearingMesh(hexKey);
    }

    function clearAllHexClearing(): void {
      hexClearingStates.clear();
      for (const mesh of clearingMeshes.values()) scene.remove(mesh);
      clearingMeshes.clear();
    }

    function finalizeHexClearing(hexKey: string): void {
      const hex = map.hexes[hexKey];
      if (hex?.nakladka === Nakladka.Las) {
        hex.nakladka = Nakladka.Brak;
      }
      hideDecorAtHex(hexKey);
      removeClearingMesh(hexKey);
      rebuildResourceOverlays();
    }

    function spawnImprovementMesh(hexKey: string): void {
      const parts = hexKey.split(',');
      if (parts.length !== 2) return;
      const q = parseInt(parts[0]!, 10);
      const r = parseInt(parts[1]!, 10);
      if (isNaN(q) || isNaN(r)) return;
      const layers = mergedImprovementLayers(hexKey);
      const oldMesh = improvementMeshes.get(hexKey);
      if (oldMesh) scene.remove(oldMesh);
      if (layers.length === 0) {
        improvementMeshes.delete(hexKey);
        return;
      }
      syncImprovementDecorForHex(hexKey, layers);
      // GRAFIKA-TEREN-2: tarasy NIE idą do sektora (stary mini-dysk). Zamiast tego stawiamy właściwe
      // wzgórze (wariant 0/3, prepared slopes) + schodkowe półki NA garbie; instanced garb tego heksa
      // schowany przez syncImprovementDecorForHex→hideDecorAtHex. Vertex colors przetrwają collapse.
      const hasTarasy = layers.includes('tarasy');
      const hex = map.hexes[hexKey];
      const isHill = hex?.terenBazowy === TerenBazowy.Wzgorza;
      const sectoredLayers = hasTarasy ? layers.filter(l => l !== 'tarasy') : layers;
      const g = buildImprovementVisual(sectoredLayers);
      if (hasTarasy && isHill) {
        const tv = tarasyWariantDlaHeksa(q, r, map.seed);
        const rotY = rotacjaDlaHeksa(q, r, map.seed);
        const hill = buildWzgorze(tv); hill.rotation.y = rotY; g.add(hill);   // garb pod tarasami (wariant 0/3)
        const ter = buildTarasy(tv); ter.rotation.y = rotY; g.add(ter);       // schodkowe półki opasujące stok
      }
      collapseToMergedMesh(g); // FPS lewar 1: setki boxów (zwierzęta/budynki) → 1 mesh; vertex colors zachowane
      const wp = axialToWorld(q, r, HEX_R);
      g.position.set(wp.x, improvementMeshPlacement(q, r, layers), wp.z);
      // (skala 0.5 usunięta — buildImprovementSectored skaluje per sektor do SECTOR_SCALE)
      g.matrixAutoUpdate = false; g.updateMatrix(); // FPS lewar 3
      scene.add(g);
      improvementMeshes.set(hexKey, g);
      renderer.shadowMap.needsUpdate = true; // FPS cienie na żądanie: nowy/zmieniony caster (budynek/ulepszenie)
    }

    function restorePlacedImprovementsFromSave(
      entries: Array<[string, ImprovementKey | PlacedLayers]> | undefined,
    ): void {
      placedImprovements.clear();
      for (const mesh of improvementMeshes.values()) scene.remove(mesh);
      improvementMeshes.clear();
      if (entries?.length) {
        for (const [hexKey, raw] of entries) {
          const layers = Array.isArray(raw) ? raw : [raw];
          placedImprovements.set(hexKey, layers);
          syncHexUlepszenieFields(hexKey, layers);
        }
      }
      rebuildResourceOverlays();
      syncLivestockAndPlacedMeshes();
    }

    // === TRYB POKAZOWY ULEPSZEŃ (Maciej 2026-07-09) ==========================
    // ?demo=ulepszenia lub plik *DEMO-ULEPSZENIA*: zasiewa ulepszenia na KAŻDYM heksie
    // prawdziwej mapy (realna skala) wg terenu/surowca — do oceny układu sektorowego.
    // BEZ drogi (na razie). Osobny plik podglądu; zwykłej gry nie dotyczy.
    function demoKeysForHex(hex: { terenBazowy: TerenBazowy; nakladka: Nakladka }): ImprovementKey[] {
      const t = hex.terenBazowy;
      const n = hex.nakladka;
      if (t === TerenBazowy.Morze) return [];
      if (t === TerenBazowy.Wybrzeze) return ['lodzie_rybackie'];
      if (n === Nakladka.Las) return ['farma', 'tartak', 'oboz_lowiecki', 'droga'];
      const out: ImprovementKey[] = [];
      if (n === Nakladka.ZlozeKonia) out.push('stadnina');
      else if (n === Nakladka.ZlozeGliny) out.push('glinianka');
      else if (n === Nakladka.ZlozeRudy) out.push('kopalnia');
      else if (n === Nakladka.ZlozeLamy) out.push('lama');
      switch (t) {
        case TerenBazowy.Laka:
        case TerenBazowy.Rownina:
          out.push('farma', 'bydlo'); break;
        case TerenBazowy.Wzgorza:
          out.push('tarasy', 'owce'); break;
        case TerenBazowy.Gory:
          if (!out.includes('kopalnia')) out.push('kamieniolom'); break;
        case TerenBazowy.Pustynia:
          out.push('farma'); break;
        default: break;
      }
      out.push('droga'); // Maciej: droga jako model na boku 5 (demonstracja)
      return out;
    }

    function seedDemoUlepszenia(): void {
      if (!map?.hexes) return;
      const keys = Object.keys(map.hexes);
      let count = 0;
      for (const key of keys) {
        const hex = map.hexes[key];
        if (!hex) continue;
        const layers = demoKeysForHex(hex);
        if (!layers.length) continue;
        placedImprovements.set(key, layers);
        syncHexUlepszenieFields(key, layers);
        count++;
      }
      for (const key of keys) {
        if (placedImprovements.has(key)) spawnImprovementMesh(key);
      }
      renderer.shadowMap.needsUpdate = true;
      diagInfo('demo', `zasiano ulepszenia na ${count} heksach (tryb pokazowy)`);
    }

    /** Wydarzenia wymagające akcji gracza (WYKONAJ). Nagrody z chatek są już rozliczone — tylko podgląd. */
    function isActionableEvent(ev: SidePanelEvent): boolean {
      return !ev.id.startsWith('village-');
    }

    function countBlockingEvents(): number {
      return collectTurnEvents().filter(isActionableEvent).length;
    }

    function executeFirstBlockingEvent(): void {
      const ev = collectTurnEvents().find(isActionableEvent);
      if (!ev) return;
      if (ev.id.startsWith('diplo-pend-')) {
        openDiplomacyPendingById(ev.id);
        return;
      }
      const cityId = cityIdFromRevoltEventId(ev.id)
        ?? cityIdFromProdEmptyEventId(ev.id);
      if (cityId) {
        const city = cities.find(c => c.id === cityId);
        if (city) openCityPanelForPlayer(city);
      }
    }

    refreshBuildApi();

    {
      syncLivestockAndPlacedMeshes();
      const _resCount = rebuildResourceOverlays();
      console.log('[main] hodowla złoże meshes synced · resource overlays:', _resCount);
    }

    // Transient toast — krótkie komunikaty (bez stałego paska skrótów na dole).
    let hintOverrideTimer: ReturnType<typeof setTimeout> | null = null;

    function showHintMessage(msg: string, durationMs: number = 3000): void {
      if (hintOverrideTimer !== null) {
        clearTimeout(hintOverrideTimer);
        hintOverrideTimer = null;
      }
      hintToast.innerHTML = msg;
      hintToast.style.display = 'block';
      hintToast.style.zIndex = isPreBattleOpen() ? '9950' : '320';
      hintOverrideTimer = setTimeout(() => {
        hintToast.style.display = 'none';
        hintOverrideTimer = null;
      }, durationMs);
    }

    /** Po pierwszej jednostce gracza — przypomnienie o suwaku żywności armii (Maciej 2026-07-03). */
    function maybeHintArmyFoodOnFirstPlayerUnit(ownerId: number): void {
      if (ownerId !== 0 || playerArmyFoodHintShown) return;
      playerArmyFoodHintShown = true;
      const allGrowth = cities.filter(c => c.ownerId === 0).every(c => getCityFoodSplit(c) >= 100);
      if (!allGrowth) return;
      showHintMessage(
        'Masz wojsko — przesuń suwak żywności w stronę <b>Armia</b> (panel miasta). ' +
        'Inaczej jednostki tracą 8% max HP co turę. Zapasy państwa wymagają budynku Spichlerz.',
        8000,
      );
    }

    /** Odśwież HUD D1B (+ panel imperium gdy otwarty). */

    function cameraGroundTarget(): { targetX: number; targetZ: number; distance: number; fov: number; aspect: number } {
      const dir = new THREE.Vector3();
      camera.getWorldDirection(dir);
      const hitT = Math.abs(dir.y) > 1e-6 ? -camera.position.y / dir.y : 40;
      const targetX = camera.position.x + dir.x * hitT;
      const targetZ = camera.position.z + dir.z * hitT;
      const ground = new THREE.Vector3(targetX, 0, targetZ);
      return {
        targetX,
        targetZ,
        distance: camera.position.distanceTo(ground),
        fov: (camera.fov * Math.PI) / 180,
        aspect: camera.aspect,
      };
    }

    /** Waga rzeki przy liczeniu "udziału wody" kadru dla dźwięku pozycyjnego
     *  (TEMAT #23): rzeka biegnie krawędziami heksa, nie wypełnia go jak
     *  Morze/Wybrzeże — liczy się słabiej. */
    const WATER_VIEW_RIVER_WEIGHT = 0.5;
    /** Górny limit próbek heksów per odczyt (TANIE — patrz computeWaterView()) —
     *  przy dużym oddaleniu kamery box widoku bywa duży, stride pilnuje kosztu. */
    const WATER_VIEW_MAX_SAMPLES = 400;

    /** TEMAT #23 — udział wody w kadrze kamery + wariant szumu (0=rzeka/1=morze).
     *  Reużywa computeViewport() (map/minimap.ts — ta sama ramka co widok na
     *  minimapie, zero dodatkowej geometrii/raycastów) i próbkuje siatkę
     *  heksów w tej ramce z ograniczonym krokiem (stride), żeby koszt nie rósł
     *  z oddaleniem kamery. Wołane z renderLoop() co ~0.5 s, NIE co klatkę. */
    function computeWaterView(): { frac: number; wariant: 0 | 1 } {
      const vp = computeViewport(map, cameraGroundTarget());
      if (!vp) return { frac: 0, wariant: ambLastWaterVariant };
      const { x, y, w, h } = vp;
      const total = w * h;
      if (total <= 0) return { frac: 0, wariant: ambLastWaterVariant };
      const stride = Math.max(1, Math.round(Math.sqrt(total / WATER_VIEW_MAX_SAMPLES)));
      let sampled = 0, sea = 0, river = 0;
      for (let r = y; r < y + h; r += stride) {
        for (let q = x; q < x + w; q += stride) {
          const hex = map.hexes[`${q},${r}`];
          if (!hex) continue;
          sampled++;
          if (hex.terenBazowy === TerenBazowy.Morze || hex.terenBazowy === TerenBazowy.Wybrzeze) {
            sea++;
          } else if (hex.rzeka.obecna) {
            river++;
          }
        }
      }
      if (sampled === 0) return { frac: 0, wariant: ambLastWaterVariant };
      const frac = Math.min(1, (sea + river * WATER_VIEW_RIVER_WEIGHT) / sampled);
      const wariant: 0 | 1 = sea > 0 ? 1 : (river > 0 ? 0 : ambLastWaterVariant);
      ambLastWaterVariant = wariant;
      return { frac, wariant };
    }

    function isPlayerAtWar(): boolean {
      for (const [key, rel] of diplomacyRelations.entries()) {
        if ((rel as { status?: string }).status !== 'wojna') continue;
        const parts = key.split('_').map(Number);
        if (parts.length !== 2) continue;
        const [a, b] = parts;
        if (a === 0 || b === 0) return true;
      }
      return false;
    }

    /** Ukryty garnizon (Ufort.) — konsumpcja żywności, oblężenie. */
    function garnizonCountForCity(city: City): number {
      return units.filter(
        u => u.ownerId === city.ownerId
          && u.q === city.q
          && u.r === city.r
          && u.inGarnizon === true,
      ).length;
    }

    /** Wojsko na heksie miasta — bonus Prawo w Porządku. */
    function lawGarrisonCountForCity(city: City): number {
      return countLawGarrisonOnCityHex(units, city.q, city.r, city.ownerId);
    }

    function refreshSiegeMarkers(): void {
      const oblegane = new Set(cities.filter(c => c.oblegane).map(c => c.id));
      const positions = new Map(cities.map(c => [c.id, { q: c.q, r: c.r }]));
      const campHexesByCity = new Map<string, string[]>();
      const allMachinesByCamp = new Map<string, import('./game/siegeMachines').SiegeMachineKind[]>();
      const allCampOwners = new Map<string, number>();
      const ownerColorById = new Map<number, number>([[0, civColorFn(0)]]);
      for (const c of cities) {
        if (!c.oblegane) continue;
        const camps: string[] = [];
        for (const u of units) {
          if (u.ownerId === c.ownerId) continue;
          if (hexDistance(u.q, u.r, c.q, c.r) === 1) {
            camps.push(keyOf(u.q, u.r));
            ownerColorById.set(u.ownerId, civColorFn(u.ownerId));
          }
        }
        campHexesByCity.set(c.id, camps);
        const ready = readyMachinesForCity(c);
        for (const [hk, kinds] of machinesByCampHex(camps, ready)) {
          const prev = allMachinesByCamp.get(hk) ?? [];
          allMachinesByCamp.set(hk, [...prev, ...kinds]);
        }
        for (const [hk, oid] of campOwnerByHex(camps, units, keyOf, c.ownerId)) {
          allCampOwners.set(hk, oid);
          ownerColorById.set(oid, civColorFn(oid));
        }
      }
      siegeMarkerRenderer.sync(oblegane, positions, {
        getTopY: (q, r) => unitRenderer.topYAt(q, r),
        campHexesByCity,
        machinesByCampHex: allMachinesByCamp,
        campOwnerByHex: allCampOwners,
        ownerColorById,
      });
      refreshSiegeHtmlLabels();
    }

    /** Etykiety HTML nad obleganymi miastami (zawsze widoczne na ekranie). */
    const siegeHtmlLabels: HTMLDivElement[] = [];
    const siegeHtmlLabelAnchors: Array<{ x: number; y: number; z: number; name: string }> = [];

    function clearSiegeHtmlLabels(): void {
      for (const el of siegeHtmlLabels) el.remove();
      siegeHtmlLabels.length = 0;
      siegeHtmlLabelAnchors.length = 0;
    }

    function refreshSiegeHtmlLabels(): void {
      clearSiegeHtmlLabels();
      for (const city of cities) {
        if (!city.oblegane) continue;
        const pos = axialToWorld(city.q, city.r, HEX_R);
        const topY = unitRenderer.topYAt(city.q, city.r);
        siegeHtmlLabelAnchors.push({ x: pos.x, y: topY + 1.1, z: pos.z, name: city.name });
        const el = document.createElement('div');
        el.className = 'civ-siege-html-label';
        el.innerHTML = '<span style="font-size:18px">\u2694</span> OB\u0141\u0118\u017bENIE<br><small>' + city.name + '</small>';
        el.style.cssText = [
          'position:fixed', 'z-index:340', 'pointer-events:none', 'transform:translate(-50%,-100%)',
          'padding:4px 10px', 'border-radius:8px', 'text-align:center', 'line-height:1.25',
          'font:bold 11px/1.3 Arial,sans-serif', 'color:#ffe8e8',
          'background:rgba(140,20,20,0.88)', 'border:2px solid #ff5252',
          'box-shadow:0 0 12px rgba(255,60,60,0.65)', 'white-space:nowrap',
        ].join(';');
        document.body.appendChild(el);
        siegeHtmlLabels.push(el);
      }
    }

    function updateSiegeHtmlLabels(): void {
      if (siegeHtmlLabels.length === 0) return;
      const cw = canvas.clientWidth || window.innerWidth;
      const ch = canvas.clientHeight || window.innerHeight;
      const wp = new THREE.Vector3();
      for (let i = 0; i < siegeHtmlLabels.length; i++) {
        const lbl = siegeHtmlLabels[i];
        const a = siegeHtmlLabelAnchors[i];
        if (!lbl || !a) continue;
        wp.set(a.x, a.y, a.z);
        wp.project(camera);
        if (wp.z > 1) {
          lbl.style.display = 'none';
          continue;
        }
        const px = (wp.x * 0.5 + 0.5) * cw;
        const py = (-wp.y * 0.5 + 0.5) * ch;
        lbl.style.display = 'block';
        lbl.style.left = Math.round(px) + 'px';
        lbl.style.top = Math.round(py) + 'px';
      }
    }

    function syncCityGarnizon(city: City): void {
      city.garnizon = garnizonCountForCity(city);
    }

    function besiegerOwnerForCity(city: City): number | null {
      if (city.oblegajacyOwnerId !== undefined) return city.oblegajacyOwnerId;
      const stored = siegeBesiegerByCity.get(city.id);
      if (stored !== undefined) return stored;
      for (const u of units) {
        if (u.ownerId === city.ownerId) continue;
        if (hexDistance(u.q, u.r, city.q, city.r) === 1) return u.ownerId;
      }
      return null;
    }

    /** C3-Q3=B: pierwsze wyczerpanie zapasów → alert; następny tick → przejęcie. */
    function handleSiegeCapitulationPhase(city: City): void {
      if (city.siegeCapitulationPending) {
        resolveSiegeSurrender(city.id);
        return;
      }
      if (getCityFood(city) <= 0) {
        city.siegeCapitulationPending = true;
        showHintMessage(
          city.name + ': magazyn wyczerpany — kapitulacja za 1 turę oblężenia!',
          5500,
        );
        syncSiegePanelMeta(city);
        updateSiegeMapPanelTurn(siegeTurnByCity.get(city.id) ?? 1, city);
      }
    }

    function resolveSiegeSurrender(cityId: string): void {
      const city = cities.find(c => c.id === cityId);
      if (!city) {
        endMapSiege(cityId);
        return;
      }
      const newOwner = besiegerOwnerForCity(city);
      if (newOwner !== null && newOwner !== city.ownerId) {
        const oldOwner = city.ownerId;
        city.ownerId = newOwner;
        if (city.rebelState) city.rebelState = false;
        city.population = Math.max(1, city.population);
        for (let i = units.length - 1; i >= 0; i--) {
          const u = units[i]!;
          if (u.q === city.q && u.r === city.r && u.ownerId === oldOwner) units.splice(i, 1);
        }
        syncCityGarnizon(city);
        if (newOwner === 0) playerEverOwnedCity = true;
        runCapitalCapturePlunder(city, oldOwner, newOwner);
        showHintMessage(
          city.name + ' — kapitulacja z głodu! Miasto przejęte przez ' + civLabelForOwner(newOwner) + '.',
          5500,
        );
      } else {
        showHintMessage(city.name + ': głód — oblężenie zakończone bez przejęcia.', 4500);
      }
      endMapSiege(cityId);
      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      updateHud();
      refreshD1bHud();
    }

    function endMapSiege(cityId: string): void {
      const city = cities.find(c => c.id === cityId);
      if (city) {
        city.oblegane = false;
        delete city.oblegajacyOwnerId;
        city.siegeCapitulationPending = false;
        clearSiegeMachines(city);
        const bId = siegeBesiegerByCity.get(cityId);
        if (bId !== undefined) siegeAiStateByKey.delete(siegeAiKey(bId, cityId));
      }
      for (const u of units) {
        if (u.oblegaCityId === cityId) delete u.oblegaCityId;
      }
      siegeTurnByCity.delete(cityId);
      siegeBesiegerByCity.delete(cityId);
      refreshSiegeMarkers();
      if (getActiveSiegeCityId() === cityId) hideSiegeMapPanel();
    }

    /** OBLEGAJ — wojsko zostaje przy murze, panel znika, gracz wraca do mapy. Postęp oblężenia = koniec tury N. */
    function commitBesiege(cityId: string, opts?: { deselect?: boolean; hint?: boolean }): void {
      const city = cities.find(c => c.id === cityId);
      if (!city || !city.oblegane) return;
      const bId = city.oblegajacyOwnerId ?? siegeBesiegerByCity.get(cityId);
      if (bId === undefined) return;

      let marked = 0;
      for (const u of units) {
        if (u.ownerId !== bId) continue;
        if (hexDistance(u.q, u.r, city.q, city.r) !== 1) continue;
        u.oblegaCityId = cityId;
        u.ruchLeft = 0;
        marked++;
      }
      if (marked === 0) {
        showHintMessage(city.name + ': brak wojsk przy murze — oblężenie zniesione.', 4000);
        endMapSiege(cityId);
        return;
      }

      hideSiegeMapPanel();
      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();

      const deselect = opts?.deselect !== false;
      if (deselect && selectedId !== null) {
        const sel = units.find(u => u.id === selectedId);
        if (sel?.oblegaCityId === cityId) clearPlayerUnitSelection();
      }

      syncUnitsRender();
      refreshD1bHud();
      if (opts?.hint !== false) {
        showHintMessage(
          city.name + ': oblężenie w toku (' + marked + ' jedn. przy murze). ' +
          'Klik miasto → Szturm / Odwrót · postęp co turę (N).',
          5500,
        );
      }
    }

    const siegePanelActions = {
      onBesiege: (cityId: string) => commitBesiege(cityId),
      onStorm: (ctx: MapSiegeContext) => launchSiegeStormFromMap(ctx),
      onRetreat: (cityId: string) => {
        endMapSiege(cityId);
        if (selectedId !== null) {
          const u = units.find(x => x.id === selectedId);
          if (u && u.ownerId === 0 && stackCanMove(u) && !u.oblegaCityId) {
            reachable = reachableWithMergeTargets(u);
            unitRenderer.setHighlight(reachable);
          }
        }
        showHintMessage('Odwrót — oblężenie zakończone.', 3000);
      },
      onQueueMachine: (cityId: string, kind: SiegeMachineKind) => {
        const city = cities.find(c => c.id === cityId);
        if (!city?.oblegane) return;
        if (queueSiegeMachine(city, kind)) {
          showHintMessage('Kolejka machin: +' + (kind === 'taran' ? 'Taran' : 'Wieża'), 2500);
          syncSiegePanelMeta(city);
        } else {
          showHintMessage('Kolejka machin pełna (max 4)', 2500);
        }
      },
    };

    function startMapSiege(ctx: MapSiegeContext): void {
      if (ctx.tryb !== 'oblezenie') {
        showHintMessage('Miasto bez muru — użyj preBattle (potyczka), nie oblężenia.', 4000);
        return;
      }
      const city = ctx.city;
      city.oblegane = true;
      city.oblegajacyOwnerId = ctx.oblegajacyOwnerId;
      city.siegeCapitulationPending = false;
      ensureSiegeMachines(city);
      syncCityGarnizon(city);
      siegeTurnByCity.set(city.id, 1);
      siegeBesiegerByCity.set(city.id, ctx.oblegajacyOwnerId);
      refreshSiegeMarkers();
      syncSiegePanelMeta(city);
      if (ctx.oblegajacyOwnerId === 0) {
        showSiegeMapPanel(ctx, siegePanelActions, 1);
        selectPlayerUnit(ctx.atakujacy.id, true);
        unitRenderer.clearPathRoute();
        hoverKey = null;
        showHintMessage(
          'OBŁĘŻENIE: ' + city.name + ' — wybierz OBLEGAJ, Szturm lub Odwrót (ruch zablokowany).',
          6000,
        );
      } else {
        commitBesiege(city.id, { deselect: false, hint: false });
      }
      console.log('[Oblezenie] start', city.name, 'ownerId=', city.ownerId, 'atakujacy=', ctx.atakujacy.typeId);
    }

    /** C3-Q9: oblężenie kończy się gdy oblegający nie stoi obok miasta. */
    function validateActiveSieges(): void {
      for (const city of cities) {
        if (!city.oblegane) continue;
        const bId = city.oblegajacyOwnerId ?? siegeBesiegerByCity.get(city.id);
        if (bId === undefined) {
          endMapSiege(city.id);
          continue;
        }
        const stillBesieging = units.some(
          u => u.ownerId === bId && hexDistance(u.q, u.r, city.q, city.r) === 1,
        );
        if (!stillBesieging) {
          endMapSiege(city.id);
          showHintMessage(city.name + ': oblężenie zniesione — brak wojsk przy murach.', 4500);
        }
      }
    }

    /** OBL-MAP-01 + OBL-S7: AI obok miasta gracza z murem → decyzja 3-poziomowa. */
    function scanAutoSiegesAfterAiTurn(): void {
      validateActiveSieges();
      for (const city of cities) {
        if (city.oblegane || city.ownerId !== 0 || !city.maMur) continue;
        const auto = detectAutoSiegeOnCity(city, units);
        if (!auto) continue;

        const atkUnits = collectSiegeAtkRoster(city, auto.atakujacy);
        const siegeArmy = atkUnits.map(runtimeUnitToSiegeUnit);
        const siegeCity = buildSiegeCityFromRuntime(city);
        const aiKey = siegeAiKey(auto.oblegajacyOwnerId, city.id);
        const persisted = siegeAiStateByKey.get(aiKey) ?? { ...EMPTY_SIEGE_AI_STATE };
        const decision = decideAISiegeStance(siegeArmy, siegeCity, persisted);

        console.log('[Oblezenie AI]', city.name, decision.stance, decision.powod);

        if (decision.stance === 'retreat') continue;

        if (decision.stance === 'assault') {
          executeSilentSiegeStorm(auto);
          continue;
        }

        if (decision.stance === 'siege_build' && !city.siegeMachines?.queue.length) {
          queueSiegeMachine(city, 'taran');
        }

        startMapSiege(auto);
        siegeAiStateByKey.set(aiKey, {
          siegeTurn: 1,
          machinesReady: city.siegeMachines?.ready.length ?? 0,
        });
        console.log('[Oblezenie] Auto AI →', city.name, decision.stance);
      }
    }

    function maybeAiAssaultAfterMachines(city: City, siegeTurn: number): void {
      const bId = city.oblegajacyOwnerId ?? siegeBesiegerByCity.get(city.id);
      if (bId === undefined || bId === 0 || city.ownerId === bId) return;
      const anchor = units.find(
        u => u.ownerId === bId && hexDistance(u.q, u.r, city.q, city.r) === 1,
      );
      if (!anchor) return;

      const atkUnits = collectSiegeAtkRoster(city, anchor);
      const decision = decideAISiegeStance(
        atkUnits.map(runtimeUnitToSiegeUnit),
        buildSiegeCityFromRuntime(city),
        {
          siegeTurn,
          machinesReady: city.siegeMachines?.ready.length ?? 0,
        },
      );
      if (decision.stance !== 'assault') return;

      const ctx = classifyCityAttack(anchor, city, units);
      if (ctx.tryb !== 'oblezenie') return;
      executeSilentSiegeStorm(ctx);
    }

    function offerCityAttackChoice(atakujacy: RuntimeUnit, city: City): boolean {
      if (!canInitiateSiege(atakujacy, city)) return false;
      const ctx = classifyCityAttack(atakujacy, city, units);
      if (ctx.tryb !== 'oblezenie') return false;
      hideCityAttackChoice();
      showCityAttackChoice(ctx, {
        onSiege: () => startMapSiege(ctx),
        onStorm: () => launchSiegeStormFromMap(ctx),
        onCancel: () => {},
      });
      return true;
    }

    function cityIdFromRevoltEventId(id: string): string | null {
      if (id.startsWith('revolt-warn-')) return id.slice('revolt-warn-'.length);
      if (id.startsWith('revolt-')) return id.slice('revolt-'.length);
      return null;
    }

    function cityIdFromProdEmptyEventId(id: string): string | null {
      if (id.startsWith('prod-empty-')) return id.slice('prod-empty-'.length);
      return null;
    }

    function countBesiegersAdjacent(city: City): number {
      const bId = city.oblegajacyOwnerId ?? siegeBesiegerByCity.get(city.id);
      if (bId === undefined) return 0;
      return units.filter(
        u => u.ownerId === bId && hexDistance(u.q, u.r, city.q, city.r) === 1,
      ).length;
    }

    function runtimeUnitToSiegeUnit(u: RuntimeUnit): SiegeUnit {
      const def = unitDefFor(u);
      const prog = def['Próg dezercji (% health)'] ?? def['Prog dezercji (% health)'];
      // SiegeUnit legacy field names; values from TW v3 EN JSON (same as combat.ts).
      // Fallback to legacy PL columns (Uderzenie/Pancerz/Przebicie) when EN block missing
      // (~25 units.json rows), same as combatUnitFromDef in game/combat.ts.
      return {
        typNazwa: u.typeId,
        rola: String(def['Rola (linia)'] ?? 'Wrecz'),
        Atak: unitAtak(def),
        Obrona: unitObrona(def),
        Uderzenie: normFieldVal(def['chargeBonus'] ?? def['Uderzenie'], 0),
        Pancerz: normFieldVal(def['armor'] ?? def['Pancerz'], 0),
        Przebicie: normFieldVal(def['piercing'] ?? def['Przebicie'], 0),
        weaponDamage: normFieldVal(def['weaponDamage'], unitAtak(def)),
        // Health = biezace HP (u.hp), nie max z definicji — siegeAi.ts skaluje sile po fraction biezacego HP.
        Health: u.hp ?? unitHealth(def),
        progDezercji: prog === null || prog === undefined ? null : normFieldVal(prog, 0.25),
      };
    }

    function buildSiegeCityFromRuntime(city: City): SiegeCity {
      const dHex = map.hexes[keyOf(city.q, city.r)];
      const terrain = dHex ? String(dHex.terenBazowy) : 'Rownina';
      const garrisonUnits = units.filter(
        u => u.ownerId === city.ownerId && hexDistance(u.q, u.r, city.q, city.r) <= 1,
      );
      const garrison: SiegeUnit[] = garrisonUnits.map(runtimeUnitToSiegeUnit);
      if (garrison.length === 0) {
        const mil = makeMilitia(city.population ?? 0);
        if (mil) garrison.push(mil);
      }
      return {
        id: city.id,
        ownerId: city.ownerId,
        q: city.q,
        r: city.r,
        wallLevel: city.maMur ? 1 : 0,
        garrison,
        terrain,
        population: city.population,
      };
    }

    function tickSiegeMachinesForCity(city: City): void {
      if (!city.oblegane) return;
      const n = countBesiegersAdjacent(city);
      const built = advanceSiegeMachineBuild(city, n);
      if (built > 0) {
        const bId = city.oblegajacyOwnerId ?? siegeBesiegerByCity.get(city.id);
        if (bId !== undefined) {
          const st = siegeAiStateByKey.get(siegeAiKey(bId, city.id)) ?? { ...EMPTY_SIEGE_AI_STATE };
          st.machinesReady = city.siegeMachines?.ready.length ?? 0;
          siegeAiStateByKey.set(siegeAiKey(bId, city.id), st);
        }
      }
    }

    function appendReadyMachinesToRoster(
      roster: RuntimeUnit[],
      city: City,
      ownerId: number,
      consume: boolean = true,
    ): RuntimeUnit[] {
      // #50: preBattle (consume=false) tylko PODGLĄDA gotowe machiny — realne zużycie
      // (consumeReadyMachines) następuje dopiero po potwierdzonym szturmie, żeby
      // anulowanie preBattle/deploy nie traciło machin zbudowanych przez wiele tur.
      const kinds = consume ? consumeReadyMachines(city) : peekReadyMachines(city);
      if (kinds.length === 0) return roster;
      const out = roster.slice();
      kinds.forEach((kind, i) => {
        out.push({
          id: 'siege-mach-' + city.id + '-' + turn + '-' + i,
          ownerId,
          typeId: SIEGE_MACHINE_TYPE_ID[kind],
          category: 'obleznicza',
          q: city.q,
          r: city.r,
          ruch: 0,
          ruchLeft: 0,
        });
      });
      return out;
    }

    function syncSiegePanelMeta(city: City): void {
      setSiegePanelBesiegerCount(countBesiegersAdjacent(city));
    }

    // D: trwały log nagród z chatek/wiosek (toast bywa nadpisywany) — pokazywany w WYDARZENIACH.
    const villageEventLog: SidePanelEvent[] = [];

    // TEMAT #5: trwały log powstania/zerwania szlaku handlowego gracza (toast +
    // wpis w WYDARZENIACH, symetrycznie do villageEventLog — czyszczony co turę
    // w tym samym miejscu, zob. `villageEventLog.length = 0;` przy turn++).
    const tradeRouteEventLog: SidePanelEvent[] = [];

    /**
     * TEMAT #5 — porownuje trasy sprzed i po jednym wywolaniu refreshTradeRoutes
     * (ta sama tura) i zglasza zdarzenia WYDARZENIA + toast dla kazdej nowej/
     * zerwanej trasy GRACZA (tradeRoutes zawiera wylacznie pary gracz<->obcy,
     * wiec kazdy wpis jest z definicji trasa gracza — AI<->AI tu nie istnieje).
     *
     * Dedup w tej samej turze: id zdarzenia koduje `turn` + id trasy, wiec
     * ponowne wywolanie z tym samym diffem (np. bledny retry) nie dodaje
     * duplikatu — sprawdzamy obecnosc po id przed push.
     */
    function reportTradeRouteEvents(
      prevRoutes: readonly TradeRoute[],
      nextRoutes: readonly TradeRoute[],
      tradeCities: readonly TradeRouteCityRef[],
      map: GameMap,
      tradeParams: TradeRouteParams,
      builtByCity: ReadonlyMap<string, readonly string[]>,
      isAtWar: (a: number, b: number) => boolean,
      hasTradeTreaty: (a: number, b: number) => boolean,
      incomeParams: TradeRouteIncomeParams,
    ): void {
      const { added, removed } = diffTradeRoutes(prevRoutes, nextRoutes);
      if (added.length === 0 && removed.length === 0) return;

      const cityById = new Map(cities.map(c => [c.id, c] as const));
      const pushOnce = (ev: SidePanelEvent): void => {
        if (tradeRouteEventLog.some(e => e.id === ev.id)) return;
        tradeRouteEventLog.unshift(ev);
      };

      for (const route of added) {
        const from = cityById.get(route.fromCityId);
        const to = cityById.get(route.toCityId);
        const fromName = from?.name ?? route.fromCityId;
        const toName = to?.name ?? route.toCityId;
        const civLabel = ownerDiploLabel(route.toOwnerId);
        const income = tradeRouteDistanceIncome(route.dystans, incomeParams);
        const summary = `${fromName} ↔ ${toName} (${civLabel}) \xb7 +${income} złota/turę`;
        showHintMessage('\u{1F9ED} Nowy szlak handlowy: ' + summary, 4500);
        pushOnce({
          id: 'trade-new-' + turn + '-' + route.id,
          icon: '\u{1F9ED}', // 🧭
          title: 'Nowy szlak handlowy',
          subtitle: summary,
          kind: 'city',
        });
      }

      for (const route of removed) {
        const from = cityById.get(route.fromCityId);
        const to = cityById.get(route.toCityId);
        const fromName = from?.name ?? route.fromCityId;
        const toName = to?.name ?? route.toCityId;
        const civLabel = ownerDiploLabel(route.toOwnerId);

        // Powod — tylko tanie, deterministyczne sprawdzenia (bez ponownego BFS
        // poza jednym findCityConnection, ktory i tak jest cache'owany).
        let reason: string | null = null;
        if (!from || !to) {
          reason = 'miasto zniknęło';
        } else if (from.ownerId !== route.ownerId || to.ownerId !== route.toOwnerId) {
          reason = 'zmiana właściciela miasta';
        } else if (isAtWar(route.ownerId, route.toOwnerId)) {
          reason = 'wojna';
        } else if (!hasTradeTreaty(route.ownerId, route.toOwnerId)) {
          reason = 'zerwana Umowa Handlowa';
        } else {
          const conn = findCityConnection(from, to, map, route.medium, tradeParams, builtByCity);
          if (!conn.connected) reason = 'brak połączenia';
        }

        const summary = `${fromName} ↔ ${toName} (${civLabel})` + (reason ? ' — ' + reason : '');
        showHintMessage('⛓️ Szlak handlowy zerwany: ' + summary, 4500);
        pushOnce({
          id: 'trade-lost-' + turn + '-' + route.id,
          icon: '⛓️', // ⛓️‍💥 (fallback bez kombinujacego znaku dla zgodnosci fontow)
          title: 'Szlak handlowy zerwany',
          subtitle: summary,
          kind: 'city',
        });
      }

      if (tradeRouteEventLog.length > 6) tradeRouteEventLog.length = 6;
      refreshD1bHud();
    }

    /**
     * UI (C-HANDEL-UMOWA=B, 2026-07-23) — dla panelu miasta „Szlaki handlowe": lista
     * etykiet obcych cywilizacji, z którymi to konkretne miasto MOGŁOBY mieć szlak
     * (geometrycznie połączone, citiesHaveTradeConnection — ignoruje limit slotów
     * budynków handlowych, jak w gate AI↔AI/AI↔gracz E6) i z którymi NIE ma wojny,
     * ale których zabrakło Umowy Handlowej — czyli jedyny brakujący warunek to traktat.
     * Wywoływana tylko dla miast gracza (panel miasta jest gracz-only).
     */
    function foreignCivsMissingTradeTreatyForCity(cityId: string): string[] {
      const city = cities.find(c => c.id === cityId);
      if (!city || city.ownerId !== 0) return [];
      const out: string[] = [];
      for (const oid of aiOwnerCivMap.keys()) {
        if (isBarbarian(oid)) continue;
        if (getDiploRelation(0, oid).status === 'wojna') continue;
        if (hasTreaty(activeDeals, 0, oid, RodzajTraktatu.UmowaHandlowa)) continue; // juz ma traktat
        const foreignCities = cities.filter(c => c.ownerId === oid);
        if (foreignCities.length === 0) continue;
        if (citiesHaveTradeConnection([city], foreignCities, map, cityBuilt)) {
          out.push(ownerDiploLabel(oid));
        }
      }
      return out;
    }

    function collectTurnEvents(): SidePanelEvent[] {
      const events: SidePanelEvent[] = [...villageEventLog, ...tradeRouteEventLog];
      for (const city of cities) {
        if (city.ownerId !== 0) continue;
        const st = cityOrderState.get(city.id);
        if (st?.revoltWarning && st.revoltGraceRemaining != null && !st.bunt && !st.rebelState) {
          events.push({
            id: 'revolt-warn-' + city.id,
            icon: '\u26a0\ufe0f',
            title: 'KRYTYCZNE: ' + city.name,
            subtitle: revoltWarningMessage(city.name, st.revoltGraceRemaining),
            kind: 'city',
          });
        }
        if (st?.bunt) {
          events.push({
            id: 'revolt-' + city.id,
            icon: '\u{1F525}',
            title: 'Bunt: ' + city.name,
            subtitle: 'Migracja mieszkańców',
            kind: 'city',
          });
        }
        const prod = cityProd.get(city.id);
        if (!prod || prod.kolejka.length === 0) {
          events.push({
            id: 'prod-empty-' + city.id,
            icon: '\u2699\ufe0f',
            title: 'Produkcja: ' + city.name,
            subtitle: 'Kolejka pusta — wybierz budynek lub jednostkę',
            kind: 'city',
          });
        }
      }
      for (const p of pendingDiplomacyInbox) {
        events.push({
          id: p.id,
          icon: '\u{1F91D}',
          title: 'Dyplomacja: ' + p.civName,
          subtitle: diploPendingTitle(p.cmdType) + (p.reason ? ' — ' + p.reason : ''),
          kind: 'diplo',
        });
      }
      return events;
    }

    function collectDiploChipCounts(): { sojusze: number; pakty: number; wojny: number } {
      const contacted = getDiplomaticContacts();
      let sojusze = 0;
      let pakty = 0;
      let wojny = 0;
      const sojuszPartners = new Set<number>();
      const paktPartners = new Set<number>();
      for (const d of activeDeals) {
        if (!d.strony.includes(0)) continue;
        const other = d.strony[0] === 0 ? d.strony[1] : d.strony[0];
        if (!contacted.has(other)) continue;
        if (isAllianceDealKind(d.rodzaj)) sojuszPartners.add(other);
        else if (normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.PaktNieagresji) paktPartners.add(other);
      }
      for (const oid of contacted) {
        if (oid === 0) continue;
        const rel = getDiploRelation(0, oid);
        if (rel.status === 'wojna') wojny++;
        else if (sojuszPartners.has(oid) || rel.status === 'sojusz') sojusze++;
        else if (paktPartners.has(oid) || rel.status === 'pokoj') pakty++;
      }
      return { sojusze, pakty, wojny };
    }

    function allPowerOwnerIds(): number[] {
      const ids = new Set<number>([0]);
      for (const c of cities) ids.add(c.ownerId);
      for (const a of aiStartHexes) ids.add(a.ownerId);
      return Array.from(ids);
    }

    function civKeyForOwner(ownerId: number): string {
      if (ownerId === 0) return String(player.civType || _menuCivId || 'gracz');
      return aiOwnerCivMap.get(ownerId) ?? `oid-${ownerId}`;
    }

    function civDisplayNameForKey(civKey: string): string {
      const row = data.civs.cywilizacje.find(
        (c: { ikonaId?: string; typCywilizacji?: string; Cywilizacja?: string }) =>
          c.ikonaId === civKey || c.typCywilizacji === civKey,
      );
      if (row?.Cywilizacja != null) return String(row.Cywilizacja);
      if (civKey.startsWith('oid-')) {
        const oid = Number(civKey.slice(4));
        if (Number.isFinite(oid)) return ownerDiploLabel(oid);
      }
      return civKey;
    }

    /** Ranking Mocy po państwach (ownerId) — ta sama metryka co panel Moc w HUD. */
    function buildPowerRankingByOwner(): PowerOverlayData['ranking'] {
      const eligible = filterOwnersForPowerRanking(allPowerOwnerIds(), {
        cityStateOpts: ownerCityStateOpts(),
        discoveredOwners: getDiplomaticContacts(),
        showAllCivs: !fogOn,
      });
      const rows = eligible.map(oid => ({
        civ: oid === 0 ? civDisplayNameForKey(civKeyForOwner(0)) : ownerDiploLabel(oid),
        power: objectivePowerForOwner(oid),
        isPlayer: oid === 0,
        rank: 0,
      }));
      rows.sort((a, b) => b.power - a.power);
      return rows.map((row, i) => ({ ...row, rank: i + 1 }));
    }

    function computePotegaComponents(ownerId: number): PotegaKomponenty {
      const snapshots = powerSnapshotsForTurn.length > 0
        ? powerSnapshotsForTurn
        : buildPowerSnapshotsForTurn({ perCity: [] });
      const snap = snapshots.find(s => s.ownerId === ownerId)
        ?? { ownerId, population: 0, cityCount: 0, territoryHexCount: 0, pieniadzPerTurn: 0 };
      const unitCount = units.filter(u => u.ownerId === ownerId).length;
      let maxUnits = 1;
      for (const oid of allPowerOwnerIds()) {
        maxUnits = Math.max(maxUnits, units.filter(u => u.ownerId === oid).length);
      }
      const ce = computePowerContributionsCityEconomy(snap, snapshots);
      const epokaNorm = ownerId === 0
        ? Math.min(1, Math.max(0, (player.era - 1) / 4))
        : Math.min(1, Math.max(0, (player.era - 1) / 4));
      return {
        ...ce,
        wielkoscArmii: unitCount / maxUnits,
        wygraneBitwy: 0.5,
        epoka: epokaNorm,
      };
    }

    /**
     * R-RANKING-MOC (Maciej 2026-07-24): pozycja gracza wśród WSZYSTKICH żyjących
     * cywilizacji (miasta-państwa wyłączone), niezależnie od odkrycia w mgle wojny —
     * gracz ma znać swoje konkretne miejsce, nawet nie znając rywali.
     */
    function buildAbsolutePowerRank(): { rank: number; total: number } {
      return computeAbsolutePowerRank(0, allPowerOwnerIds(), objectivePowerForOwner, {
        cityStateOpts: ownerCityStateOpts(),
      });
    }

    function buildPowerOverlayData(): PowerOverlayData {
      const obj = objectivePowerByOwner.get(0) ?? buildObjectivePowerForOwner(0);
      const power = obj.power;
      const maxPts = Math.max(1, ...obj.components.map(c => c.points));
      const components = obj.components.map(c => ({
        key: c.key,
        label: c.label,
        weightPct: c.coefficient,
        normalized: c.points / maxPts,
        points: c.points,
      }));
      const ranking = buildPowerRankingByOwner();
      // R-RANKING-MOC bugfix (Maciej 2026-07-24): respektExample brał "pierwszego kontaktu"
      // z diplomaticallyDiscoveredOwners — zbiór ten NIE jest filtrowany po miastach-państwach
      // (computeDiplomaticContacts widzi każdy heks AI), więc mógł trafić na miasto-państwo
      // wykluczone z `ranking` (inny byt, inna Moc) i jego nazwę liczoną INNĄ ścieżką
      // (civDisplayNameForKey pomija rozróżnienie miasto-państwo vs pełna cywilizacja — kolizja
      // etykiety z prawdziwą nacją o tym samym typCywilizacji, np. gracz "Grecy" vs
      // miasto-państwo tej samej kultury). Efekt: "Twoja moc X vs Y" gdzie Y nie pasowało do
      // żadnej pozycji w rankingu, a etykieta pokrywała się z inną cywilizacją. Naprawa: brać
      // rywala WPROST z `ranking` (ta sama Moc, ta sama etykieta co wyżej na liście).
      const rival = ranking.find(r => !r.isPlayer);
      const respektExample: PowerOverlayData['respektExample'] = rival
        ? {
          civ: rival.civ,
          respekt: computeRespekt(power, rival.power),
          playerPower: power,
          theirPower: rival.power,
        }
        : undefined;
      const absoluteRank = buildAbsolutePowerRank();
      return { power, components, ranking, respektExample, absoluteRank };
    }

    function buildCultureOverlayData(): CultureOverlayData {
      const cp = loadCultureParams(data.societyParams, _menuDifficulty);
      const pc = cities.filter(c => c.ownerId === 0);
      const thresholds = [...cultureThresholds(cp)];
      const cityRows = pc.map(c => {
        const kultura = Math.floor((c as { kultura?: number }).kultura ?? 0);
        return {
          name: c.name,
          kultura,
          borderRadius: cityBorderRadius(kultura, cp),
        };
      });
      const maxCityKultura = cityRows.reduce((m, c) => Math.max(m, c.kultura), 0);
      let nextThreshold: number | null = null;
      let pctToNext: number | undefined;
      for (const t of thresholds) {
        if (maxCityKultura < t) {
          nextThreshold = t;
          pctToNext = t > 0 ? Math.round((maxCityKultura / t) * 100) : 0;
          break;
        }
      }
      const lowHappy = pc.filter(c => {
        const share = (c as { ownCultureShare?: number }).ownCultureShare ?? 1;
        return cultureHappiness({ kulturaSkumulowana: 0, ownCultureShare: share }, cp) < 0;
      }).length;
      const happinessNote = lowHappy > 0
        ? `${lowHappy} miast z obcą kulturą — kara do zadowolenia`
        : 'Kultura własna we wszystkich miastach — bonus do zadowolenia';
      const rate = Math.floor(_lastKulturaRate);
      const sourcesNote = (rate >= 0 ? '+' : '') + rate + '/t · progi zasięgu: '
        + thresholds.join(' / ') + ' pkt w mieście';
      return {
        kulturaTotal: Math.floor(_lastKultura),
        kulturaRate: rate,
        cityCount: pc.length,
        cities: cityRows,
        thresholds,
        nextThreshold,
        pctToNext,
        happinessNote,
        sourcesNote,
      };
    }

    function buildEmpireDetailSnap(): EmpireDetailSnap {
      const economy = buildHudState();
      const cult = buildCultureOverlayData();
      const powOverlay = buildPowerOverlayData();
      const obj = objectivePowerByOwner.get(0) ?? buildObjectivePowerForOwner(0);
      const totalPts = Math.max(1, obj.components.reduce((s, c) => s + c.points, 0));
      const maxCompPts = Math.max(1, ...obj.components.map(c => c.points));
      const powerNotes: Record<string, string> = {
        armia: 'Suma siły bojowej armii (M_pole)',
        bitwy: 'Pkt z pokonanych składów w bitwach',
        ludki: 'Obywatele we wszystkich miastach (sloty populacji 1–10)',
        rekruci: 'Ekw. jednostek z puli rekrutów',
        miasta: 'Każde miasto imperium',
        terytorium: 'Heksy w zasięgu terytorium miast',
        infra: 'Wybudowane budynki (suma)',
        tech: 'Liczba zbadanych technologii',
        ulepszenia: 'Ulepszenia terenu w terytorium',
        zdobycze: 'Trwały bonus — Power przejęty po eliminacji wroga (nie znika)',
      };
      const powerComponents = obj.components.map(c => ({
        key: c.key,
        label: c.label,
        rawCount: c.rawCount,
        weightPct: c.coefficient,
        normalized: c.points / maxCompPts,
        points: c.points,
        sharePct: Math.round((c.points / totalPts) * 100),
        formulaNote: powerNotes[c.key],
      }));
      const epoka = empireEpochForOwner(0);
      const mpMults = civManpowerMultsForOwner(0);
      const pobor = empirePoborTotals(cities, 0, epoka, mpMults.maxMult);
      const civKey = String(player.civType || _menuCivId || 'grecy');
      const civRow = data.civs.cywilizacje.find(
        (c: { ikonaId?: string; typCywilizacji?: string }) =>
          c.ikonaId === civKey || c.typCywilizacji === civKey,
      );
      const civName = civRow?.Cywilizacja != null
        ? String(civRow.Cywilizacja)
        : ownerDiploLabel(0);
      const bonusy = (player.civBonusy.length > 0 ? player.civBonusy : civRow?.bonusy ?? [])
        .map((b: { opis?: string; realizuje?: string }) => ({
          opis: String(b.opis ?? ''),
          realizuje: String(b.realizuje ?? ''),
        }))
        .filter(b => b.opis.length > 0);
      const pc = cities.filter(c => c.ownerId === 0);
      const { regenMult, maxMult } = mpMults;
      const cityEcon = pc.map(c => {
        const tk = _lastPlayerCityEcon.find(t => t.cityId === c.id);
        return {
          name: c.name,
          pieniadz: tk?.pieniadz ?? 0,
          pracaPula: tk?.doPuli ?? 0,
          pracaBudynki: tk?.doBudynkow ?? 0,
          nauka: tk?.nauka ?? 0,
        };
      });
      const cityPobor = pc.map(c => {
        const mp = cityManpowerSnapshot(c, epoka, regenMult, maxMult);
        return {
          name: c.name,
          ludki: mp.ludki,
          ludnoscAbsLabel: formatManpower(mp.ludnoscAbsolutna),
          rekruci: mp.manpowerBiezacy,
          rekruciMax: mp.manpowerMax,
          regenPerTurn: mp.regenPerTurn,
        };
      });
      let rekruciMax = 0;
      for (const c of pc) rekruciMax += cityManpowerMax(c.population, epoka, maxMult);
      const unitsOnMap = units.filter(u => u.ownerId === 0 && u.category !== 'osadnik').length;
      return {
        global: {
          civName,
          civEmoji: '🏛️',
          styl: String(civRow?.['Styl / charakter'] ?? '—'),
          jednostkaSpec: String(civRow?.['Jednostka specjalna'] ?? '—'),
          bonusStartowy: String(civRow?.['Bonus startowy'] ?? '—'),
          religiaPanstwowa: ownerReligionForOwnerId(0) ?? String(civRow?.Religia ?? '—'),
          bonusy,
        },
        economy,
        kultura: {
          total: cult.kulturaTotal,
          rate: cult.kulturaRate,
          thresholds: cult.thresholds ?? [],
          nextThreshold: cult.nextThreshold ?? null,
          pctToNext: cult.pctToNext ?? null,
          happinessNote: cult.happinessNote ?? '',
          cities: cult.cities,
        },
        power: {
          power: obj.power,
          powerBase: obj.powerBase,
          components: powerComponents,
          ranking: powOverlay.ranking,
          respektExample: powOverlay.respektExample,
          absoluteRank: powOverlay.absoluteRank,
          ludnoscLudki: economy.ludnosc,
          ludnoscAbsLabel: economy.ludnoscAbsLabel ?? formatManpower(pobor.ludnoscAbsolutna),
          rekruci: pobor.rekruci,
          rekruciLabel: economy.rekruciLabel ?? formatManpower(pobor.rekruci),
          rekrutEkw: rekrutUnitEquivalents(pobor.rekruci, epoka, maxMult),
          rekruciMax,
          rekruciMaxLabel: formatManpower(rekruciMax),
          unitsOnMap,
          kosztJednostki: unitManpowerCost(epoka, maxMult),
        },
        cityEcon,
        cityPobor,
        resources: buildEmpireResourceRows(0),
        trade: buildEmpireTradeSnap(),
      };
    }

    /**
     * TEMAT 14 (Maciej 2026-07-24) — zbiorczy widok imperium: WSZYSTKIE aktywne trasy
     * handlowe gracza (tradeRoutes zawiera wyłącznie pary gracz<->obca cyw., patrz
     * refreshTradeRoutes) + dochód każdej + suma. Panel miasta (cityPanel.ts
     * buildTradeRoutesDetailCard) pokazuje to samo per-miasto; tu jest agregat.
     */
    function buildEmpireTradeSnap(): EmpireDetailSnap['trade'] {
      const incomeParams = loadTradeRouteIncomeParams(
        data.econParams as unknown as Parameters<typeof loadTradeRouteIncomeParams>[0],
        _menuDifficulty,
      );
      const routes = tradeRoutes
        .filter(r => r.status === 'polaczony')
        .map(r => {
          const myCity = cities.find(c => c.id === r.fromCityId);
          const partnerCity = cities.find(c => c.id === r.toCityId);
          return {
            id: r.id,
            cityName: myCity?.name ?? r.fromCityId,
            partnerCityName: partnerCity?.name ?? r.toCityId,
            partnerOwnerLabel: ownerDiploLabel(r.toOwnerId),
            medium: r.medium,
            dystans: r.dystans,
            income: tradeRouteDistanceIncome(r.dystans, incomeParams),
          };
        })
        .sort((a, b) => a.dystans - b.dystans || a.id.localeCompare(b.id));
      const totalIncome = routes.reduce((s, r) => s + r.income, 0);
      return { totalIncome, routes };
    }

    function openEmpireDetailFromHud(section?: string): void {
      hideEmpireOverlay();
      hidePowerOverlay();
      hideScienceHubHud();
      hideWikiHubHud();
      hideSciencePicker();
      hideCityListHud();
      hideArmyListHud();
      hideHexContextPanel();
      showEmpireDetailPanel(section);
      refreshD1bHud();
    }

    function buildReligionOverlayData(): ReligionOverlayData {
      const rp = loadReligionParams(data.societyParams, _menuDifficulty);
      const pc = cities.filter(c => c.ownerId === 0);
      const stateRel = ownerReligionForOwnerId(0) ?? '—';
      let dominantCityCount = 0;
      let foreignCityCount = 0;
      const cityRows = pc.map(c => {
        const rel = resolvedCityReligion(c);
        const dom = dominantReligion(rel, rp);
        if (dom.status === 'dominant') {
          if (dom.religion === stateRel) dominantCityCount++;
          else foreignCityCount++;
        }
        return {
          name: c.name,
          dominujaca: dom.religion ?? '—',
          udzialPct: Math.round(dom.share * 100),
        };
      });
      const relAgg = aggregateReligionEmpire(
        pc.map(c => ({
          state: resolvedCityReligion(c),
          spreadDelta: lastReligionSpreadByCity.get(c.id) ?? 0,
        })),
        stateRel === '—' ? null : stateRel,
      );
      const spreadTotal = relAgg.spreadRateTotal;
      const spreadNote = spreadTotal !== 0
        ? 'Szerzenie: ' + (spreadTotal >= 0 ? '+' : '') + spreadTotal + ' wiernych/t w imperium'
        : 'Brak netto szerzenia w tej turze';
      const lowHappy = pc.filter(c => {
        const rel = resolvedCityReligion(c);
        return religionHappiness(rel, stateRel === '—' ? null : stateRel, rp) < 0;
      }).length;
      const happinessNote = lowHappy > 0
        ? `${lowHappy} miast z obcą dominującą wiarą — kara do zadowolenia`
        : 'Religia państwa dominuje lub brak silnej obcej presji';
      return {
        stateReligion: stateRel,
        cityCount: pc.length,
        cities: cityRows,
        spreadNote,
        dominanceThresholdPct: rp.progDominacjiPct,
        dominantCityCount,
        foreignCityCount,
        happinessNote,
      };
    }

    function diploPendingTitle(cmdType: string): string {
      switch (cmdType) {
        case 'zaproponuj_pokoj': return 'Propozycja pokoju';
        case 'zaproponuj_sojusz': return 'Propozycja sojuszu';
        case 'zaproponuj_handel': return 'Propozycja handlu';
        case 'zaproponuj_umowe_handlowa': return 'Propozycja umowy handlowej';
        case 'zaproponuj_handel_surowiec': return 'Propozycja handlu surowcem';
        case 'zadaj_trybut': return 'Żądanie trybutu';
        case 'oferuj_trybut_za_pokoj': return 'Trybut za pokój';
        default: return 'Propozycja dyplomatyczna';
      }
    }

    function enqueueDiplomacyPendingFromCmd(ownerId: number, cmd: AIDiplomacyCommand): void {
      if (!diplomaticContactEstablished.has(ownerId)) return;
      const balance = aiSkarbiecByOwner.get(ownerId) ?? 0;
      const enriched = enrichAiCommandWithTreasury(cmd, balance);
      if (!enriched) return;
      console.log(`[Dyplomacja] AI${ownerId} ${enriched.type}: ${enriched.powod}`);
      if (enriched.type === 'zaproponuj_handel') {
        aiOneShotGiftLastTurn.set(ownerId, turn);
      }
      if (enriched.type === 'zaproponuj_umowe_handlowa') {
        aiTradeAgreementLastProposalTurn.set(ownerId, turn);
      }
      if (enriched.type === 'zaproponuj_handel_surowiec') {
        aiResourceTradeLastProposalTurn.set(ownerId, turn);
      }
      enqueueDiplomacyPending(
        ownerId,
        enriched.type,
        formatAiDiplomacyPlayerMessage(enriched),
        enriched.type === 'zaproponuj_handel' || enriched.type === 'oferuj_trybut_za_pokoj'
          ? enriched.goldOnce
          : enriched.type === 'zaproponuj_umowe_handlowa'
            ? enriched.sweetenerGold
            : undefined,
        enriched.type === 'zaproponuj_handel_surowiec' ? enriched : undefined,
      );
    }

    function enqueueDiplomacyPending(
      ownerId: number,
      cmdType: string,
      reason: string,
      goldOnce?: number,
      resourceCmd?: Extract<AIDiplomacyCommand, { type: 'zaproponuj_handel_surowiec' }>,
    ): void {
      const id = 'diplo-pend-' + ownerId + '-' + cmdType + '-' + turn + '-' + pendingDiplomacyInbox.length;
      if (pendingDiplomacyInbox.some(p => p.ownerId === ownerId && p.cmdType === cmdType)) return;
      pendingDiplomacyInbox.push({
        id,
        ownerId,
        civName: ownerDiploLabel(ownerId),
        cmdType,
        reason,
        goldOnce,
        surowiecKey: resourceCmd?.surowiecKey,
        surowiecLabel: resourceCmd?.label,
        pakietyPerTura: resourceCmd?.pakietyPerTura,
        zaplataTyp: resourceCmd?.zaplataTyp,
        zaplataPerTura: resourceCmd?.zaplataPerTura,
        resTurns: resourceCmd?.turns,
      });
      showHintMessage('Dyplomacja: ' + ownerDiploLabel(ownerId) + ' — ' + diploPendingTitle(cmdType), 4500);
      refreshD1bHud();
    }

    function resolvePendingDiplomacy(id: string, accept: boolean): void {
      const idx = pendingDiplomacyInbox.findIndex(p => p.id === id);
      if (idx < 0) return;
      const p = pendingDiplomacyInbox[idx]!;
      pendingDiplomacyInbox.splice(idx, 1);
      const curRel = getDiploRelation(0, p.ownerId);
      if (accept) {
        if (p.cmdType === 'zaproponuj_pokoj') {
          setDiploRelation(0, p.ownerId, applyDiploEventTracked(0, p.ownerId, curRel, 'pokoj'));
          showHintMessage('Pokój z: ' + p.civName, 4000);
        } else {
          const cmd = {
            type: p.cmdType,
            targetId: '0',
            powod: p.reason,
            goldOnce: p.goldOnce,
            // E6: 'zaproponuj_umowe_handlowa' niesie oslodzik jako sweetenerGold, nie
            // goldOnce -- pendingDiplomacyInbox przechowuje oba pod jednym polem `goldOnce`,
            // wiec dublujemy tutaj by aiCommandToPendingProposal odczytal wlasciwe pole.
            sweetenerGold: p.goldOnce,
            // HANDEL-SUROWCE-CYKL: pola potrzebne do odtworzenia 'zaproponuj_handel_surowiec'.
            surowiecKey: p.surowiecKey,
            label: p.surowiecLabel,
            pakietyPerTura: p.pakietyPerTura,
            zaplataTyp: p.zaplataTyp,
            zaplataPerTura: p.zaplataPerTura,
            turns: p.resTurns,
          } as AIDiplomacyCommand;
          const pending = aiCommandToPendingProposal(cmd, p.ownerId, 0, turn);
          if (pending) {
            const result = resolvePlayerAcceptsAiPending(pending, turn);
            applyProposalOutcome(p.ownerId, 0, result, pending.payload, pending.actionId);
            if (result.accepted) showHintMessage('Przyjęto: ' + p.civName, 3500);
          } else {
            showHintMessage('Zaakceptowano: ' + p.civName, 3500);
          }
        }
      } else {
        if (p.cmdType === 'zadaj_trybut' || p.cmdType === 'oferuj_trybut_za_pokoj') {
          setDiploRelation(0, p.ownerId, applyDiploEventTracked(0, p.ownerId, curRel, 'trybut_odmowa'));
        }
        if (p.cmdType === 'zaproponuj_handel') {
          aiOneShotGiftLastTurn.set(p.ownerId, turn);
        }
        if (p.cmdType === 'zaproponuj_umowe_handlowa') {
          aiTradeAgreementLastProposalTurn.set(p.ownerId, turn);
        }
        if (p.cmdType === 'zaproponuj_handel_surowiec') {
          aiResourceTradeLastProposalTurn.set(p.ownerId, turn);
        }
        showDiplomacyProposalBanner(false, 'Odrzucono propozycję');
        showHintMessage('Odrzucono: ' + p.civName, 3000);
      }
      refreshD1bHud();
      if (isDiplomacyPanelOpen()) updateDiplomacyPanel();
    }

    function openDiplomacyPendingById(id: string): void {
      const p = pendingDiplomacyInbox.find(x => x.id === id);
      if (!p) return;
      showDiplomacyPendingModal(
        {
          id: p.id,
          civName: p.civName,
          title: p.civName + ': ' + diploPendingTitle(p.cmdType),
          detail: p.reason || diploPendingTitle(p.cmdType),
        },
        () => resolvePendingDiplomacy(p.id, true),
        () => resolvePendingDiplomacy(p.id, false),
      );
    }

    /** A1-Q18: API inbox dla UI / testów. */
    function getPendingDiplomacyDecisions(): ReadonlyArray<{
      id: string; ownerId: number; civName: string; cmdType: string; reason: string;
    }> {
      return pendingDiplomacyInbox;
    }

    function countPlayerSpichlerze(): number {
      let n = 0;
      for (const c of cities) {
        if (c.ownerId !== 0) continue;
        const built = cityBuilt.get(c.id) ?? [];
        if (built.includes('spichlerz')) n++;
      }
      return n;
    }

    function projectPlayerFoodMaxCap(): number {
      const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
      return computeEmpireFoodMaxCap(countPlayerSpichlerze(), efParams);
    }

    /** Projekcja +X/t zapasów armii — bieżący suwak, nie stary tick. */
    function projectPlayerFoodNetRate(): number {
      const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
      const upkeepParams = loadUpkeepParams(data.econParams, _menuDifficulty);
      const playerUnits: EconUnit[] = units
        .filter(u => u.ownerId === 0)
        .map(u => ({ ownerId: u.ownerId, typeId: u.typeId, camping: false }));
      const kosztArmii = militaryFoodConsumption(playerUnits, upkeepParams, unitFoodTbl);
      const playerCities = cities.filter(c => c.ownerId === 0 && !c.oblegane);
      const preview = previewCityEconomy(
        playerCities,
        map,
        data,
        _menuDifficulty,
        cityBuilt,
        player.era,
        player.zbadane,
        new Map([[0, (player.civType as string) || 'grecy']]),
        orderMultMap,
        empireEpochForOwner,
        unlockedTechSetForOwner,
        undefined,
        undefined,
        buildAllTerritoryNodes(),
        undefined,
        buildWonderCityYieldsByOwnerMap([0]),
      );
      const cityFoods = preview.perCity
        .filter(tk => tk.ownerId === 0 && !tk.oblegany)
        .map(tk => {
          const c = cities.find(x => x.id === tk.cityId);
          return {
            zywnoscNetto: Math.max(0, tk.zywnoscNetto),
            procentRozwoj: c ? getCityFoodSplit(c) : tk.procentRozwoj,
          };
        });
      return computeEmpireFoodNetDeltaFromCityFoods(
        cityFoods,
        kosztArmii,
        countPlayerSpichlerze(),
        efParams,
      );
    }

    /** Przelicz stawki imperium na HUD z bieżącego stanu miast (bez mutacji). */
    function refreshLiveEmpireRates(): void {
      if (!empireEconDirty) return;   // D10: przelicz tylko po zmianie (trigger), nie co odświeżenie
      empireEconDirty = false;
      const playerCities = cities.filter(c => c.ownerId === 0);
      if (playerCities.length === 0) {
        _liveFoodBrutto = 0;
        return;
      }
      const ownerCivMap = new Map<number, string>();
      ownerCivMap.set(0, (player.civType as string) || 'grecy');
      for (const [oid, civ] of aiOwnerCivMap) ownerCivMap.set(oid, civ);
      // D7: licz ekonomię TYLKO miast gracza (HUD używa wyłącznie ownerId===0).
      // Wcześniej szło `cities` (gracz + całe AI) → O(wszystkie miasta) na każdym updateHud
      // = główny koszt wejścia do miasta na Super Huge (14 s w pomiarze).
      const preview = previewCityEconomy(
        playerCities,
        map,
        data,
        _menuDifficulty,
        cityBuilt,
        player.era,
        player.zbadane,
        ownerCivMap,
        orderMultMap,
        empireEpochForOwner,
        unlockedTechSetForOwner,
        undefined,
        undefined,
        buildAllTerritoryNodes(),
        undefined,
        buildWonderCityYieldsByOwnerMap([0]),
      );
      const playerEcon = sumEconomyForPlayerCities(preview, cities);
      _lastPracaRate = playerEcon.doPuli;
      _lastPieniadzRate = playerEcon.pieniadz;
      _lastNaukaRate = playerEcon.nauka;
      _lastKulturaRate = playerEcon.kultura;
      _lastBogactwoRate = playerEcon.pieniadz;
      let brutto = 0;
      for (const tk of preview.perCity) {
        if (tk.ownerId !== 0 || tk.oblegany) continue;
        brutto += Math.max(0, tk.zywnoscNetto);
      }
      _liveFoodBrutto = brutto;
      for (const tk of preview.perCity) {
        if (tk.ownerId === 0) lastCityKulturaTick.set(tk.cityId, tk.kultura);
      }
      _lastPlayerCityEcon = preview.perCity
        .filter(tk => tk.ownerId === 0)
        .map(tk => {
          const c = cities.find(x => x.id === tk.cityId);
          return {
            cityId: tk.cityId,
            name: c?.name ?? tk.cityId,
            pieniadz: Math.round(tk.pieniadz),
            doPuli: Math.round(tk.doPuli),
            doBudynkow: Math.round(tk.doBudynkow),
            nauka: Math.round(tk.nauka),
          };
        });
    }

    function buildHudState(): HudState {
      let epokaPostep = 0;
      if (player.badana !== null) {
        const techDef = data.tech.find(t => t.Technologia === player.badana);
        const koszt = techDef && typeof techDef['Koszt nauki'] === 'number'
          ? scaledResearchCost(
            techDef['Koszt nauki'],
            player.tempoGry ?? 'standardowa',
            0,
            _menuDifficulty,
          ) : 0;
        epokaPostep = koszt > 0 ? Math.min(1, player.nauka / koszt) : 0;
      }
      const pc = cities.filter(c => c.ownerId === 0);
      const pop = pc.reduce((s, c) => s + c.population, 0);
      const pobor = empirePoborTotals(cities, 0, player.era, civManpowerMultsForOwner(0).maxMult);
      const chips = collectDiploChipCounts();
      const power = objectivePowerForOwner(0);
      const foodReserve = Math.floor(getEmpireFoodReserve(0));
      const foodMaxCap = projectPlayerFoodMaxCap();
      const foodNetRate = Math.floor(projectPlayerFoodNetRate());
      const stateRel = ownerReligionForOwnerId(0);
      const relAgg = aggregateReligionEmpire(
        pc.map(c => ({
          state: resolvedCityReligion(c),
          spreadDelta: lastReligionSpreadByCity.get(c.id) ?? 0,
        })),
        stateRel,
      );
      // SUROW-HUD-01 (Maciej 2026-07-24): chip „Surowce" w HUD — podsumowanie stanu
      // magazynów imperium (tylko wiersze magazynowane, cap != null; wiersze czystego
      // dostępu jak Sól/Koń/Ceramika nie wchodzą do tego zliczenia). „OK/total": OK =
      // surowce ani w niedoborze (ratePerTurn<0), ani na capie (stock>=cap).
      const resourceRows = buildEmpireResourceRows(0);
      const storedResourceRows = resourceRows.filter(r => r.cap != null);
      const resourceAlertCount = storedResourceRows.filter(
        r => r.ratePerTurn < 0 || r.stock >= (r.cap ?? Infinity),
      ).length;
      const surowceTotal = storedResourceRows.length;
      const surowceOk = surowceTotal - resourceAlertCount;
      // TEMAT 14 (Maciej 2026-07-24): chip „Handel" w HUD — suma dochodu z aktywnych
      // tras handlowych (gracz<->obca cyw.) tej tury. `tradeRoutes` zawiera WYŁĄCZNIE
      // pary gracz<->obcy (refreshTradeRoutes), więc każda trasa liczy się raz.
      const handelIncomeParams = loadTradeRouteIncomeParams(
        data.econParams as unknown as Parameters<typeof loadTradeRouteIncomeParams>[0],
        _menuDifficulty,
      );
      let handelIncome = 0;
      let handelRouteCount = 0;
      for (const r of tradeRoutes) {
        if (r.status !== 'polaczony') continue;
        handelIncome += tradeRouteDistanceIncome(r.dystans, handelIncomeParams);
        handelRouteCount++;
      }
      return {
        zywnoscLabel: String(foodReserve),
        zywnoscMax: foodMaxCap,
        zywnoscRate: foodNetRate,
        glodWojska: isArmyStarving(0),
        zloto: Math.floor(player.skarbiec),
        zlotoRate: Math.floor(_lastPieniadzRate),
        // BUGFIX 2026-07-10: Math.floor tutaj obcinal np. 1.8 -> 1 (zamiast 2), mimo
        // ze silnik (splitPraca, production.ts) juz liczy doPuli jako cala liczbe
        // sumujaca sie z doBudynkow do calkowitej Pracy miasta. Math.round zostaje
        // jako zabezpieczenie przed drobnym bledem zmiennoprzecinkowym przy sumowaniu
        // wielu miast (np. 1.9999999998 nie powinno spasc do 1).
        praca: Math.round(_lastPraca),
        pracaRate: Math.round(_lastPracaRate),
        pracaUpkeep: Math.round(_lastPracaUpkeep),
        nauka: Math.floor(player.nauka),
        naukaRate: Math.floor(_lastNaukaRate),
        kultura: Math.floor(_lastKultura),
        kulturaRate: Math.floor(_lastKulturaRate),
        bogactwo: Math.floor(player.skarbiec),
        bogactwoRate: Math.floor(_lastPieniadzRate),
        ludnosc: pop,
        ludnoscRate: Math.floor(_lastLudnoscRate),
        religionStock: relAgg.stateAdherents,
        religionRate: relAgg.spreadRateTotal,
        stateReligion: stateRel,
        rekruci: pobor.rekruci,
        rekruciLabel: formatManpower(pobor.rekruci),
        ludnoscAbsLabel: formatManpower(pobor.ludnoscAbsolutna),
        power,
        osiedla: pc.length,
        osiedlaMax: 99,
        tura: turn,
        epoka: gameEpochHudLabel(player.era),
        epokaPostep,
        researchProgress: epokaPostep,
        badana: player.badana,
        sojusze: chips.sojusze,
        pakty: chips.pakty,
        wojny: chips.wojny,
        civIconId: String(player.civType || _menuCivId || 'grecy'),
        civKolorHex: civKolorHexFn(0),
        surowceSummary: surowceTotal > 0 ? `${surowceOk}/${surowceTotal}` : '—',
        surowceAlert: resourceAlertCount > 0,
        handelIncome,
        handelRouteCount,
      };
    }

    function collectWarsWithPlayer(): WarWithPlayer[] {
      const contacted = getDiplomaticContacts();
      const wars: WarWithPlayer[] = [];
      for (const [key, rel] of diplomacyRelations.entries()) {
        if ((rel as { status?: string }).status !== 'wojna') continue;
        const parts = key.split('_').map(Number);
        if (parts.length !== 2) continue;
        const [a, b] = parts;
        if (a !== 0 && b !== 0) continue;
        const oid = a === 0 ? b! : a!;
        if (!contacted.has(oid)) continue;
        const civId = aiOwnerCivMap.get(oid);
        wars.push({ civName: ownerDiploLabel(oid), civId });
      }
      return wars;
    }

    function collectKnownWarsBetweenOthers(): KnownWarBetweenCivs[] {
      const contacted = getDiplomaticContacts();
      const out: KnownWarBetweenCivs[] = [];
      for (const [key, rel] of diplomacyRelations.entries()) {
        if ((rel as { status?: string }).status !== 'wojna') continue;
        const parts = key.split('_').map(Number);
        if (parts.length !== 2) continue;
        const [a, b] = parts;
        if (a === 0 || b === 0) continue;
        if (!contacted.has(a!) && !contacted.has(b!)) continue;
        out.push({
          civA: ownerDiploLabel(a!),
          civB: ownerDiploLabel(b!),
        });
      }
      return out;
    }

    function getDiplomaticContacts(): Set<number> {
      return diplomaticallyDiscoveredOwners;
    }

    /** Aktualizuje trwały zbiór odkrytych nacji wg bieżącego zasięgu widzenia. */
    function updateDiplomaticDiscovery(visible: ReadonlySet<string>): void {
      const seenNow = computeDiplomaticContacts(visible, cities, units);
      for (const oid of seenNow) diplomaticallyDiscoveredOwners.add(oid);
    }

    function resetDiplomaticDiscoveryUiState(): void {
      lastDiplomaticContactsSnapshot = new Set<number>();
      pendingAutoDiploAudience.length = 0;
      diplomaticDiscoveryPopupShown.clear();
      diplomaticContactTrackingReady = false;
    }

    /** Po starcie / wczytaniu — bez auto-popupu dla już widocznych AI. */
    function initDiplomaticContactSnapshot(): void {
      lastDiplomaticContactsSnapshot = new Set(getDiplomaticContacts());
      diplomaticContactTrackingReady = true;
    }

    function canAutoOpenDiploAudience(): boolean {
      if (galleryOn || isPreBattleOpen() || isCityPanelOpen()) return false;
      if (isDiplomacyAudienceOpen()) return false;
      return true;
    }

    function tryOpenNextAutoDiploAudience(): void {
      if (!canAutoOpenDiploAudience()) return;
      while (pendingAutoDiploAudience.length > 0) {
        const oid = pendingAutoDiploAudience.shift()!;
        if (!getDiplomaticContacts().has(oid)) continue;
        openDiplomacyAudience(oid);
        return;
      }
    }

    /** Pierwsze odkrycie cywilizacji w mgle → hint + auto-audiencja (można wyjść bez rozmowy). */
    function checkNewDiplomaticContacts(): void {
      if (!diplomaticContactTrackingReady || galleryOn) return;
      const current = getDiplomaticContacts();
      const newlySeen: number[] = [];
      for (const oid of current) {
        if (oid === 0) continue;
        if (!lastDiplomaticContactsSnapshot.has(oid)) newlySeen.push(oid);
      }
      lastDiplomaticContactsSnapshot = new Set(current);
      if (newlySeen.length === 0) return;

      for (const oid of newlySeen) {
        showHintMessage('Odkryto cywilizację: ' + ownerDiploLabel(oid), 4500);
        if (diplomaticDiscoveryPopupShown.has(oid)) continue;
        diplomaticDiscoveryPopupShown.add(oid);
        pendingAutoDiploAudience.push(oid);
      }
      requestAnimationFrame(() => tryOpenNextAutoDiploAudience());
    }

    const AUDIENCE_BASIC_IDS = new Set(['1', '2', '5', '10', '11']);

    function buildDiploTreasury() {
      return {
        getPieniadze: (ownerId: number) =>
          ownerId === 0 ? player.skarbiec : (aiSkarbiecByOwner.get(ownerId) ?? 0),
        add: (ownerId: number, delta: number) => {
          if (ownerId === 0) player.skarbiec += delta;
          else aiSkarbiecByOwner.set(ownerId, Math.max(0, (aiSkarbiecByOwner.get(ownerId) ?? 0) + delta));
        },
      };
    }

    function isAllianceDealKind(rodzaj: ActiveDeal['rodzaj']): boolean {
      const k = normalizeTreatyKind(rodzaj);
      return k === 'sojusz_pelny' || k === 'sojusz_defensywny' || k === RodzajTraktatu.SojuszWojskowy;
    }

    /** Obwódka heksu miasta na mapie świata — kolor wg relacji z graczem (Maciej 2026-07-03). */
    function cityMapOutlineKindForOwner(ownerId: number): CityMapOutlineKind {
      if (ownerId === 0) return 'player';
      const rel = getDiploRelation(0, ownerId);
      if (rel.status === 'wojna') return 'war';
      if (rel.status === 'sojusz') return 'ally';
      for (const d of activeDeals) {
        if (!isAllianceDealKind(d.rodzaj)) continue;
        if (dealInvolvesOwners(d, 0, ownerId)) return 'ally';
      }
      return 'neutral';
    }

    function pairOwnerIds(a: number, b: number): [number, number] {
      return a < b ? [a, b] : [b, a];
    }

    function dealInvolvesOwners(deal: ActiveDeal, a: number, b: number): boolean {
      const [p0, p1] = pairOwnerIds(a, b);
      return deal.strony[0] === p0 && deal.strony[1] === p1;
    }

    const EPOCH_LABELS_PL = ['Kamień', 'Brąz', 'Żelazo'] as const;

    function epochLabelForOwner(ownerId: number): string {
      const era = empireEpochForOwner(ownerId);
      const idx = Math.max(0, Math.min(EPOCH_LABELS_PL.length - 1, Math.round(era) - 1));
      return EPOCH_LABELS_PL[idx] ?? 'Kamień';
    }

    function treatyDisplayLabel(rodzaj: ActiveDeal['rodzaj']): string {
      const k = normalizeTreatyKind(rodzaj);
      switch (k) {
        case RodzajTraktatu.PaktNieagresji: return 'Pakt nieagresji';
        case 'sojusz_defensywny': return 'Sojusz defensywny';
        case 'sojusz_pelny': return 'Sojusz pełny';
        case RodzajTraktatu.UmowaHandlowa: return 'Umowa handlowa';
        case RodzajTraktatu.OtwartGranice: return 'Otwarte granice';
        case RodzajTraktatu.PrawoWojskowePrzemarszu: return 'Prawo przemarszu wojskowego';
        case RodzajTraktatu.Wasalizacja: return 'Wasalizacja';
        case RodzajTraktatu.Rozejm: return 'Rozejm';
        default: return String(k);
      }
    }

    /**
     * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 2+3) — etykieta kary zerwania per rodzaj
     * traktatu, pokazana w bannerze/tabeli I w tooltipie przycisku „Zerwij" (zaległość #2).
     * To jest kara DOBROWOLNEGO zerwania (przycisk „Zerwij" → breakTreatyVoluntarily poniżej):
     * Umowa handlowa → 'zerwanie_handlu' (-10 Zaufania); reszta (NAP/sojusz/granice/wasal)
     * → 'zerwanie_traktatu' (-15 Zaufania). ODRĘBNE od kary za zerwanie WYMUSZONE wojną
     * (breakTreatiesOnWar → 'zlamana_obietnica', -40 — inny, cięższy scenariusz, nietknięty).
     */
    function treatyBreakPenaltyLabel(rodzaj: ActiveDeal['rodzaj']): string {
      const k = normalizeTreatyKind(rodzaj);
      if (k === RodzajTraktatu.UmowaHandlowa) return '-10 Zaufania';
      return '-15 Zaufania';
    }

    /**
     * Zaległość #2 (Makieta DYPLOMACJA v1.1, 2026-07-23) — „Zerwij": dobrowolne zerwanie
     * traktatu PRZED czasem (przycisk w kolumnie „Aktywne traktaty"). Reużywa mechanizmy
     * usuwania traktatu (removeTreatiesById/deactivateZlozeGrantsForDeal — te same co
     * breakTreatiesOnWar dla zerwania wymuszonego wojną), ale z osobną, lżejszą karą
     * ('zerwanie_traktatu'/'zerwanie_handlu' — patrz treatyBreakPenaltyLabel) i bez efektów
     * ubocznych wojny (obligacje sojusznicze itd. — to dobrowolna decyzja, nie casus belli).
     * Sojusz zerwany dobrowolnie → status pary wraca do 'pokoj' (nie zostaje błędnie
     * „sojusz" mimo braku traktatu — patrz resolveFormalDiplomaticStatus/diplomacy-display.ts).
     */
    function breakTreatyVoluntarily(dealId: string): void {
      const deal = activeDeals.find(d => d.id === dealId);
      if (!deal) return;
      const [a, b] = deal.strony;
      const wasAlliance = isAllianceDealKind(deal.rodzaj);
      const isTrade = normalizeTreatyKind(deal.rodzaj) === RodzajTraktatu.UmowaHandlowa;

      activeDeals = removeTreatiesById(activeDeals, [dealId]);
      zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, dealId);

      const cur = getDiploRelation(a, b);
      const ev = isTrade ? 'zerwanie_handlu' as const : 'zerwanie_traktatu' as const;
      let next = applyDiploEventTracked(a, b, cur, ev);
      if (wasAlliance && next.status === 'sojusz') {
        const stillAllied = activeDeals.some(d => dealInvolvesOwners(d, a, b) && isAllianceDealKind(d.rodzaj));
        if (!stillAllied) next = { ...next, status: 'pokoj' };
      }
      setDiploRelation(a, b, next);

      const otherId = a === 0 ? b : a;
      showHintMessage('Zerwano traktat: ' + treatyDisplayLabel(deal.rodzaj) + ' — ' + ownerDiploLabel(otherId), 4000);
      updateDiplomacyAudience();
      updateDiplomacyPanel();
      updateHud();
    }

    function activeTreatiesForPair(a: number, b: number): {
      id: string;
      label: string;
      detail?: string;
      sinceTurns?: number;
      breakPenaltyLabel?: string;
    }[] {
      return activeDeals
        .filter(d => dealInvolvesOwners(d, a, b))
        .map(d => ({
          id: d.id,
          label: treatyDisplayLabel(d.rodzaj),
          detail: d.wygasaTura !== null ? `wygasa t.${d.wygasaTura}` : undefined,
          sinceTurns: d.zawartaTura !== undefined ? Math.max(0, turn - d.zawartaTura) : undefined,
          breakPenaltyLabel: treatyBreakPenaltyLabel(d.rodzaj),
        }));
    }

    function syncRelationFromDeals(a: number, b: number): void {
      const rel = getDiploRelation(a, b);
      if (rel.status === 'wojna') return;
      const hasSojusz = activeDeals.some(
        d => dealInvolvesOwners(d, a, b) && isAllianceDealKind(d.rodzaj),
      );
      const hasNap = hasTreaty(activeDeals, a, b, RodzajTraktatu.PaktNieagresji);
      if (hasSojusz) {
        setDiploRelation(a, b, { ...rel, status: 'sojusz' });
      } else if (hasNap) {
        setDiploRelation(a, b, { ...rel, status: 'pokoj' });
      }
    }

    /**
     * FAZA 1 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 6) — rozbicie relacji „za/przeciw"
     * dla pary (a,b). Łączy REJESTR jednorazowych zdarzeń (diplomacyFactorLog) z
     * czynnikami CIĄGŁYMI wyliczonymi NA ŻYWO z activeDeals/stanu — ten sam materiał
     * co TickCtx przekazywany do tickDiplomacy w pętli AI (patrz niżej „aktywnyHandel:
     * activeDeals.some(...)" itd.), więc wartości są spójne z paskami Zaufanie/Respekt.
     */
    function getRelationBreakdown(a: number, b: number): ReturnType<typeof buildRelationBreakdown> {
      const rel = getDiploRelation(a, b);
      const dip = _diplomacyParams();
      const log = diplomacyFactorLog.get(diploPairKey(a, b)) ?? [];
      const atWar = rel.status === 'wojna';
      const civA = a === 0 ? (player.civType ?? 'rzymianie') : (aiOwnerCivMap.get(a) ?? 'grecy');
      const civB = b === 0 ? (player.civType ?? 'rzymianie') : (aiOwnerCivMap.get(b) ?? 'grecy');
      const sameCulture = sameCultureCircle(civKeyForOwner(a), civKeyForOwner(b));
      const religionA = ownerReligionForOwnerId(a);
      const religionB = ownerReligionForOwnerId(b);
      const continuous: ContinuousFactorFlags = {
        aktywnyHandel: hasTreaty(activeDeals, a, b, RodzajTraktatu.UmowaHandlowa),
        pokojTrustTier: resolvePokojTrustTier(activeDeals, a, b, {
          contactEstablished: a === 0 ? diplomaticContactEstablished.has(b)
            : (b === 0 ? diplomaticContactEstablished.has(a) : true),
          atWar,
        }),
        wspolnaReligia: sameCulture && !!religionA && !!religionB && religionA === religionB,
        odmiennaReligia: !!religionA && !!religionB && religionA !== religionB,
        ekspansjaPrzyGranicy:
          cities.filter(c => c.ownerId === a).length > 2 && cities.filter(c => c.ownerId === b).length > 2,
        rywalizacjaTenSamTyp: civA === civB,
        roznicaKulturowa: sameCulture === false,
      };
      return buildRelationBreakdown(log, continuous, dip);
    }

    /**
     * D-START posiłki v2 (Maciej 2026-07-21, pkt C): proaktywne sojusze AI↔AI między
     * SIOSTRAMI tego samego klastra (profil kopia_typu_obronna) gdy jedna z nich jest
     * zagrożona — dyplomacja AI↔AI dziś NIE ISTNIEJE poza gracz↔AI (ownerLoop diplo
     * blok wyżej), więc siostry nigdy by się nie sprzymierzyły same. Bez tego pkt A
     * (gate sojuszu na posiłkach) sprawiłby, że posiłki między siostrami NIGDY nie
     * ruszą, bo sojusz nie ma jak powstać.
     *
     * Ścieżka pomija UI, evaluateProposal (dedykowany kod komend gracz↔AI) i warstwę
     * komend (filterDiplomacyCommandsForLayer) — zawiera sojusz BEZPOŚREDNIO
     * (ActiveDeal), ale ocena kwalifikacji jest PEŁNA (Maciej 2026-07-21 przeróbka
     * ZMIANA 4 = Q2 odpowiedź B): sisterAllianceEligible woła realny
     * aiDiplomacyStance(...).willingnessAlly (relacja + przewaga militarna
     * militaryRatioFromArmyM(a,b), dokładnie jak gracz↔AI), tylko z progiem
     * obniżonym PER POZIOM TRUDNOŚCI (sisterAllianceDiplomacyParams(_menuCitySupport),
     * diplomacy.ts) zamiast dawnego uproszczonego proxy zaufanie/100.
     *
     * Determinizm: pary iterowane w stałej kolejności (ownerId rosnąco); brak
     * Math.random(). Wydajność: iteruje TYLKO siostry aktualnie zagrożone (klastry
     * są małe — kilka miast), więc O(par zagrożonych) na turę, nie O(wszystkich par).
     */
    function formSisterAlliancesIfThreatened(): void {
      if (!clusterPlacement || typCityCopyOwners.size === 0) return;
      const threatRadius = RESUP_TIERS[_menuCitySupport].threatRadius;

      for (const tc of clusterPlacement.klastry) {
        const sisterOwners = Array.from(typCityCopyOwners)
          .filter(oid => aiOwnerCivMap.get(oid) === tc.typ)
          .sort((a, b) => a - b); // determinizm: kolejność par po id
        if (sisterOwners.length < 2) continue;

        const sisterOwnerSet = new Set(sisterOwners);
        const threatenedOwners = new Set<number>();
        for (const oid of sisterOwners) {
          const city = cities.find(c => c.ownerId === oid);
          if (!city) continue;
          const threatened = units.some(
            u => !sisterOwnerSet.has(u.ownerId)
              && hexDistance(u.q, u.r, city.q, city.r) <= threatRadius,
          );
          if (threatened) threatenedOwners.add(oid);
        }
        if (threatenedOwners.size === 0) continue; // brama wydajności: żadna siostra zagrożona

        for (let i = 0; i < sisterOwners.length; i++) {
          for (let j = i + 1; j < sisterOwners.length; j++) {
            const a = sisterOwners[i]!;
            const b = sisterOwners[j]!;
            if (!threatenedOwners.has(a) && !threatenedOwners.has(b)) continue;
            if (activeDeals.some(d => isAllianceDealKind(d.rodzaj) && dealInvolvesOwners(d, a, b))) {
              continue; // już sojusznicy
            }
            const rel = getDiploRelation(a, b);
            const sisterParams = sisterAllianceDiplomacyParams(_menuCitySupport);
            const civTypA = aiOwnerCivMap.get(a) as TypCywilizacji | undefined;
            const civTypB = aiOwnerCivMap.get(b) as TypCywilizacji | undefined;
            if (!civTypA || !civTypB) continue;
            // Siostry = typCywilizacji KLASTRA (tc.typ), NIE DrobnaCywilizacja -- inaczej
            // aiDiplomacyStance wejdzie na ścieżkę "minor civ" i willingnessAlly = 0 zawsze.
            const playerAStub: Player = { ownerId: a, typCywilizacji: civTypA } as unknown as Player;
            const playerBStub: Player = { ownerId: b, typCywilizacji: civTypB } as unknown as Player;
            const milRatioAB = militaryRatioFromArmyM(sumArmyMForOwner(a), sumArmyMForOwner(b));
            const dipCtx: AIDiplomacyContext = {
              isMinorCiv: false,
              militaryRatio: milRatioAB,
              currentTurn: turn,
              turnsAtWar: 0,
            };
            if (!sisterAllianceEligible(playerAStub, playerBStub, rel, dipCtx, sisterParams)) continue;

            const [p0, p1] = pairOwnerIds(a, b);
            activeDeals = addTreaty(activeDeals, {
              id: `sojusz_siostry_${p0}_${p1}`,
              rodzaj: 'sojusz_pelny',
              strony: [p0, p1],
              wygasaTura: null,
              zawartaTura: turn,
            });
            syncRelationFromDeals(a, b);
            console.log(
              `[Dyplomacja] Siostry ${ownerDiploLabel(p0)}(${p0})-${ownerDiploLabel(p1)}(${p1}) ` +
              `zawierają sojusz (klaster ${tc.typ}, zagrożenie w promieniu ${threatRadius})`,
            );
          }
        }
      }
    }

    /**
     * HANDEL-SUROWCE-CYKL (2026-07-24) — nadwyżka surowca sprzedającego, którego
     * kupujący NIE MA (lub ma najmniej), do zaproponowania jako cykliczny handel
     * co turę. ownerId-agnostyczne: sellerOwnerId/buyerOwnerId = DOWOLNY właściciel
     * (gracz=0 lub AI) w DOWOLNEJ kombinacji — ta sama funkcja obsługuje gracz↔AI
     * (obie strony) i AI↔AI. Cena = katalog PN (diplomacyPnSurowiecIlosc) — fair,
     * deterministyczna, bez negocjacji (używana tylko do AUTOMATYCZNYCH ofert AI;
     * gracz nadal może zaoferować dowolną cenę przez koszyk, oceni ją evaluateProposal).
     */
    function pickResourceSurplusForOwnerPair(
      sellerOwnerId: number,
      buyerOwnerId: number,
    ): { surowiecKey: string; label: string; pakietyPerTura: number; zaplataPerTura: number } | null {
      const sellerOpts = quantityTradableGoodOptions(sellerOwnerId);
      if (!sellerOpts.length) return null;
      const buyerGoods = tradableGoodsIndexForOwner(buyerOwnerId);
      const buyerHave = new Set(buyerGoods.filter(g => (g.ilosc ?? 0) > 0).map(g => g.key));
      const sorted = [...sellerOpts].sort((a, b) => b.maxPakiety - a.maxPakiety);
      const pick = sorted.find(o => !buyerHave.has(o.id)) ?? sorted[0];
      if (!pick || pick.maxPakiety <= 0) return null;
      const pakiety = Math.max(1, Math.min(AI_RESOURCE_TRADE_MAX_PAKIETY_PER_TURA, pick.maxPakiety));
      const zaplata = diplomacyPnSurowiecIlosc(pick.id, pakiety) ?? 0;
      if (zaplata <= 0) return null;
      const label = pick.label.split(' ×')[0] ?? pick.id;
      return { surowiecKey: pick.id, label, pakietyPerTura: pakiety, zaplataPerTura: zaplata };
    }

    /** Czy para (a,b) ma już aktywny cykliczny deal surowcowy (dowolny surowiec, dowolny kierunek). */
    function hasActiveResourceTradeDealForPair(a: number, b: number): boolean {
      return activeDeals.some(
        d => dealInvolvesOwners(d, a, b) && (d.handelSurowiecCykliczny?.length ?? 0) > 0,
      );
    }

    /**
     * E6 (2026-07-23): AI↔AI proaktywnie zawiera STAŁĄ Umowę Handlową
     * (RodzajTraktatu.UmowaHandlowa) — analogicznie do formSisterAlliancesIfThreatened
     * (dyplomacja AI↔AI poza gracz↔AI dziś NIE ISTNIEJE inaczej), ale bez ograniczenia
     * do sióstr tego samego klastra — dowolna para "pełnych" AI.
     *
     * R-MP-HANDEL-SUROWCE (Maciej, wariant A — pełny handel, 2026-07-24): miasta-
     * -państwa (simplifiedDiplomacyOwners) BYŁY tu jawnie pomijane ("ich handel to
     * uproszczona ścieżka gracz↔AI") — to blokowało AI↔MP (pełna cywilizacja
     * proponująca handel surowcem miastu-państwu i odwrotnie). Teraz miasta-państwa
     * WCHODZĄ do puli par, ale TYLKO handel surowcem jest dla nich odblokowany: gdy
     * para obejmuje miasto-państwo (eitherIsCityState), deal powstaje WYŁĄCZNIE gdy
     * istnieje realna oferta nadwyżki surowca (bestOffer) — miasto-państwo nadal NIE
     * dostaje "pustej" Umowy Handlowej (samo otwarcie szlaków bez towaru), bo to
     * wykracza poza zakres zadania (inne ograniczenia warstwy uproszczonej — wojna/
     * pokój/sojusze sióstr — zostają nietknięte). Pełne AI↔AI bez miasta-państwa:
     * zachowanie identyczne jak dotąd (Umowa Handlowa zawierana niezależnie od
     * nadwyżki surowca).
     *
     * Warunki per para: !wojna, brak już aktywnej Umowy Handlowej, Relacja >=
     * progHandelRelacja, geometrycznie możliwe połączenie tras (citiesHaveTradeConnection),
     * throttling deterministyczny co N tur PER PARA (aiAiTradeAgreementLastTurn,
     * canAiProposeTradeAgreement — ta sama stała co gracz↔AI). DODATKOWO: throttling
     * GLOBALNY — maks. JEDNA nowa umowa AI↔AI na turę (brak spamu przy wielu AI),
     * pierwsza kwalifikująca się para w stałej kolejności (ownerId rosnąco) wygrywa.
     *
     * Determinizm: pary iterowane w stałej kolejności, brak Math.random().
     */
    function formAiAiTradeAgreementsIfEligible(): void {
      const allAiOwners = Array.from(aiOwnerCivMap.keys())
        .filter(oid => oid !== 0)
        .sort((a, b) => a - b); // determinizm: kolejność par po id
      if (allAiOwners.length < 2) return;

      const dip = _diplomacyParams();

      for (let i = 0; i < allAiOwners.length; i++) {
        for (let j = i + 1; j < allAiOwners.length; j++) {
          const a = allAiOwners[i]!;
          const b = allAiOwners[j]!;
          const eitherIsCityState = simplifiedDiplomacyOwners.has(a) || simplifiedDiplomacyOwners.has(b);

          const rel = getDiploRelation(a, b);
          if (rel.status === 'wojna') continue;
          if (relationScore(rel) < dip.progHandelRelacja) continue;
          if (activeDeals.some(
            d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.UmowaHandlowa && dealInvolvesOwners(d, a, b),
          )) continue; // już obowiązuje

          const pairKey = diploPairKey(a, b);
          if (!canAiProposeTradeAgreement(turn, aiAiTradeAgreementLastTurn.get(pairKey))) continue;

          const hasConnection = citiesHaveTradeConnection(
            cities.filter(c => c.ownerId === a),
            cities.filter(c => c.ownerId === b),
            map,
            cityBuilt,
          );
          if (!hasConnection) continue;

          const [p0, p1] = pairOwnerIds(a, b);
          // HANDEL-SUROWCE-CYKL (2026-07-24): przy okazji zawarcia Umowy Handlowej
          // AI↔AI, jeśli jedna strona ma wyraźną nadwyżkę surowca, którego druga
          // nie ma — dołóż cykliczny przepływ surowiec→¤. Nie blokuje zawarcia
          // samej umowy, gdy nadwyżki brak (handelSurowiecCykliczny zostaje undefined).
          const offerAtoB = pickResourceSurplusForOwnerPair(a, b);
          const offerBtoA = pickResourceSurplusForOwnerPair(b, a);
          const bestOffer = offerAtoB && offerBtoA
            ? (offerAtoB.pakietyPerTura * offerAtoB.zaplataPerTura
              >= offerBtoA.pakietyPerTura * offerBtoA.zaplataPerTura
              ? { seller: a, buyer: b, offer: offerAtoB }
              : { seller: b, buyer: a, offer: offerBtoA })
            : offerAtoB
              ? { seller: a, buyer: b, offer: offerAtoB }
              : offerBtoA
                ? { seller: b, buyer: a, offer: offerBtoA }
                : null;
          // R-MP-HANDEL-SUROWCE: para z miastem-państwem — deal WYŁĄCZNIE gdy jest
          // realna oferta surowca (patrz komentarz nad funkcją). Pełne AI↔AI: bez zmian.
          if (eitherIsCityState && !bestOffer) continue;
          const handelSurowiecCykliczny = bestOffer
            ? [{
                surowiecKey: bestOffer.offer.surowiecKey,
                pakietyPerTura: bestOffer.offer.pakietyPerTura,
                sellerOwnerId: bestOffer.seller,
                buyerOwnerId: bestOffer.buyer,
                zaplataTyp: 'zloto' as const,
                zaplataPerTura: bestOffer.offer.zaplataPerTura,
              }]
            : undefined;
          activeDeals = addTreaty(activeDeals, {
            id: `umowa_handlowa_aiai_${p0}_${p1}_t${turn}`,
            rodzaj: RodzajTraktatu.UmowaHandlowa,
            strony: [p0, p1],
            wygasaTura: turn + clampDealTurns(undefined),
            zawartaTura: turn,
            handelSurowiecCykliczny,
          });
          if (handelSurowiecCykliczny) {
            console.log(
              `[Dyplomacja] AI↔AI handel surowcem: ${ownerDiploLabel(bestOffer!.seller)} → ` +
              `${ownerDiploLabel(bestOffer!.buyer)}: ${bestOffer!.offer.label} ×${bestOffer!.offer.pakietyPerTura} pakiet(y)/turę`,
            );
          }
          syncRelationFromDeals(a, b);
          aiAiTradeAgreementLastTurn.set(pairKey, turn);
          console.log(
            `[Dyplomacja] AI↔AI Umowa Handlowa ${ownerDiploLabel(p0)}(${p0})-${ownerDiploLabel(p1)}(${p1}) ` +
            `(Relacja=${relationScore(rel)} >= ${dip.progHandelRelacja}, połączenie tras możliwe)`,
          );
          return; // throttling globalny: max 1 nowa umowa AI↔AI na turę
        }
      }
    }

    function breakTreatiesOnWar(a: number, b: number, breakerIsPlayer: boolean): void {
      suspendZlozeOnWar(a, b);
      const brokenIds = treatiesBrokenByWar(activeDeals, a, b);
      if (!brokenIds.length) return;
      activeDeals = removeTreatiesById(activeDeals, brokenIds);
      for (const id of brokenIds) {
        zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, id);
      }
      const cur = getDiploRelation(a, b);
      const ev = breakerIsPlayer ? 'zlamana_obietnica' as const : 'zlamana_obietnica_ai' as const;
      setDiploRelation(a, b, applyDiploEventTracked(a, b, cur, ev));
    }

    function applyAllianceObligationsOnWar(attackerId: number, victimId: number): void {
      const obligations = allianceObligationsForWarDeclaration(activeDeals, attackerId, victimId);
      const joinedWarOwnerIds: number[] = [attackerId, victimId];

      for (const ob of obligations) {
        for (const allyId of ob.obligatedAllies) {
          if (joinedWarOwnerIds.includes(allyId)) continue;
          if (getDiploRelation(allyId, ob.mustDeclareWarOn).status === 'wojna') {
            joinedWarOwnerIds.push(allyId);
            continue;
          }

          if (allyId === 0) {
            const targetLabel = ownerDiploLabel(ob.mustDeclareWarOn);
            showHintMessage('Sojusznik wymaga wojny z: ' + targetLabel, 4500);
          } else if (ob.mustDeclareWarOn === 0) {
            showHintMessage(
              '\u2694 Sojusznik ' + ownerDiploLabel(allyId) + ' dołącza do wojny z tobą!',
              4500,
            );
          } else if (victimId === 0 || attackerId === 0) {
            showHintMessage(
              '\u2694 Sojusznik ' + ownerDiploLabel(allyId) + ' wchodzi do wojny z: ' + ownerDiploLabel(ob.mustDeclareWarOn),
              4500,
            );
          }

          breakTreatiesOnWar(allyId, ob.mustDeclareWarOn, allyId === 0);
          setDiploRelation(
            allyId,
            ob.mustDeclareWarOn,
            applyDiploEventTracked(allyId, ob.mustDeclareWarOn, getDiploRelation(allyId, ob.mustDeclareWarOn), 'wojna_wypowiedziana'),
          );
          joinedWarOwnerIds.push(allyId);
        }
      }

      const brokenTreatyIds = treatiesBrokenByRefusal(obligations, joinedWarOwnerIds);
      if (brokenTreatyIds.length) {
        const brokenSet = new Set(brokenTreatyIds);
        const playerRefusalAllies = new Set<number>();
        for (const deal of activeDeals) {
          if (!brokenSet.has(deal.id)) continue;
          if (deal.strony[0] === 0) playerRefusalAllies.add(deal.strony[1]);
          else if (deal.strony[1] === 0) playerRefusalAllies.add(deal.strony[0]);
        }
        activeDeals = removeTreatiesById(activeDeals, brokenTreatyIds);
        for (const allyId of playerRefusalAllies) {
          showHintMessage(
            'Sojusz zerwany — ' + ownerDiploLabel(allyId) + ' nie wszedł do wojny',
            4500,
          );
          syncRelationFromDeals(0, allyId);
        }
      }
    }

    /**
     * HANDEL-SUROWCE-CYKL (2026-07-24) — co turę: dla każdy aktywny ActiveDeal z
     * handelSurowiecCykliczny, przenieś pakietyPerTura surowca sprzedawca→kupujący
     * (transferSurowiecIlosc — magazyn per-miasto, suma ownera, patrz komentarz w
     * transferBasketItems case 'surowiec_ilosc') i pobierz zapłatę kupujący→sprzedawca
     * (zloto przez treasury / praca przez ownerPracaPool). ownerId-agnostyczne —
     * sellerOwnerId/buyerOwnerId mogą być gracz (0) LUB dowolne AI, w dowolnej
     * kombinacji (gracz↔AI dowolny kierunek, AI↔AI) — brak specjalnego traktowania
     * ownerId===0. Brak zapasów u dawcy tej tury → pomijamy transfer I zapłatę
     * (deal NIE jest zrywany — może się odnowić następną turą; wygasa naturalnie
     * przez wygasaTura/expireTreaties albo zrywa się wojną jak każda UmowaHandlowa).
     * Brak środków u biorcy → transfer surowca i tak następuje (już przekazany),
     * ale zapłata się nie wykonuje (applyOneShotGoldTransfer no-op przy niedoborze;
     * Praca — setOwnerPracaPool klampuje do 0, więc biorca płaci ile ma).
     */
    function tickCyclicResourceTradeDeals(): void {
      if (!activeDeals.some(d => (d.handelSurowiecCykliczny?.length ?? 0) > 0)) return;
      const treasury = buildDiploTreasury();
      for (const deal of activeDeals) {
        const items = deal.handelSurowiecCykliczny;
        if (!items?.length) continue;
        for (const item of items) {
          if (item.sellerOwnerId === item.buyerOwnerId) continue;
          const capId = capitalCityIdForOwner(item.buyerOwnerId);
          const refs = cities.map(c => ({ id: c.id, ownerId: c.ownerId, surowce: c.surowce ?? {} }));
          const totalUnits = item.pakietyPerTura * diplomacyHandelSurowcePakietWielkosc();
          const result = transferSurowiecIlosc(
            item.surowiecKey, totalUnits, item.sellerOwnerId, item.buyerOwnerId, capId, refs,
          );
          for (let i = 0; i < cities.length; i++) {
            const before = refs[i];
            const after = result.cities[i];
            if (before && after && after.surowce !== before.surowce) {
              cities[i]!.surowce = after.surowce;
            }
          }
          if (result.moved <= 0) continue; // brak zapasow dawcy ta ture -- pomijamy tez zaplate
          const zaplata = item.zaplataPerTura ?? 0;
          if (zaplata > 0 && item.zaplataTyp === 'zloto') {
            applyOneShotGoldTransfer(item.buyerOwnerId, item.sellerOwnerId, zaplata, treasury);
          } else if (zaplata > 0 && item.zaplataTyp === 'praca') {
            setOwnerPracaPool(item.buyerOwnerId, ownerPracaPool(item.buyerOwnerId) - zaplata);
            setOwnerPracaPool(item.sellerOwnerId, ownerPracaPool(item.sellerOwnerId) + zaplata);
          }
        }
      }
      if (isDiplomacyPanelOpen()) updateDiplomacyPanel();
    }

    function runDiplomacyTurnTick(): void {
      const dealsBeforeExpire = activeDeals;
      activeDeals = expireTreaties(activeDeals, turn);
      for (const d of dealsBeforeExpire) {
        if (!activeDeals.some(x => x.id === d.id)) {
          zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, d.id);
        }
      }
      tickCyclicResourceTradeDeals();
      const treasury = buildDiploTreasury();
      const payDeals = activeDealsToPaymentDeals(activeDeals, turn);
      const { broken, messages } = tickDiplomacyPayments(payDeals, treasury, turn);
      const tributeBreaks = tributeBreakPairsFromDeals(activeDeals, broken);
      for (const pair of tributeBreaks) {
        const { payerOwnerId, receiverOwnerId } = pair;
        const cur = getDiploRelation(payerOwnerId, receiverOwnerId);
        setDiploRelation(payerOwnerId, receiverOwnerId, applyDiploEventTracked(payerOwnerId, receiverOwnerId, cur, 'trybut_odmowa'));
        if (payerOwnerId === 0) {
          showHintMessage('Trybut zerwany — brak środków w skarbcu', 3500);
        } else if (receiverOwnerId === 0) {
          showHintMessage(
            'Trybut zerwany — casus belli przeciw ' + ownerDiploLabel(payerOwnerId),
            3500,
          );
        }
      }
      for (const id of broken) {
        activeDeals = removeTreatiesById(activeDeals, [id]);
        zlozeGrants = deactivateZlozeGrantsForDeal(zlozeGrants, id);
        if (!tributeBreaks.some(p => p.dealId === id)) {
          showHintMessage('Trybut zerwany — brak środków w skarbcu', 3500);
        }
      }
      for (const msg of messages) console.log('[Dyplomacja]', msg);
      for (const oid of getDiplomaticContacts()) {
        if (oid === 0) continue;
        const meta = getDiploPairMeta(0, oid);
        if (meta.dobraWolaRemainingTur > 0) {
          const rel = getDiploRelation(0, oid);
          const ticked = tickDobraWolaOnRelation(rel, meta);
          setDiploRelation(0, oid, ticked.rel);
          setDiploPairMeta(0, oid, ticked.meta);
        }
        syncRelationFromDeals(0, oid);
      }
      applyBorderMarchPenaltiesEndTurn();
    }

    function getKnownRivalsFor(partnerId: number): Array<{ ownerId: number; label: string }> {
      const contacted = getDiplomaticContacts();
      const out: Array<{ ownerId: number; label: string }> = [];
      for (const oid of contacted) {
        if (oid === partnerId || oid === 0) continue;
        if (getDiploRelation(partnerId, oid).status === 'wojna') {
          out.push({ ownerId: oid, label: ownerDiploLabel(oid) });
        }
      }
      return out;
    }

    function getSellableTechForPlayer(): Array<{ id: string; label: string; suggestedPrice: number }> {
      return Array.from(player.zbadane).map(slug => ({
        id: slug,
        label: techNameFromSlug(slug) ?? slug,
        suggestedPrice: 50 + player.era * 20,
      })).slice(0, 12);
    }

    function buildProposalEvalContext(proposerId: number, responderId: number): ProposalEvalContext {
      const relRaw = getDiploRelation(proposerId, responderId);
      const potProposer = objectivePowerByOwner.get(proposerId)?.power ?? 0;
      const potResponder = objectivePowerByOwner.get(responderId)?.power ?? 0;
      const proposerRespekt = computeRespekt(potProposer, potResponder);
      const responderRespekt = computeRespekt(potResponder, potProposer);
      const rel: Relation = {
        ...relRaw,
        respekt: proposerRespekt,
      };
      const militaryRatio = militaryRatioFromArmyM(
        sumArmyMForOwner(proposerId),
        sumArmyMForOwner(responderId),
      );
      const potSum = potProposer + potResponder;
      const respektWzgledny = potSum > 0 ? potProposer / potSum : 0.5;
      const aiCivId = aiOwnerCivMap.get(responderId) ?? aiOwnerCivMap.get(proposerId) ?? 'grecy';
      const proposerTyp = proposerId === 0
        ? ((player.civType ?? 'rzymianie') as TypCywilizacji)
        : ((aiOwnerCivMap.get(proposerId) ?? 'grecy') as TypCywilizacji);
      const responderTyp = responderId === 0
        ? ((player.civType ?? 'rzymianie') as TypCywilizacji)
        : ((aiCivId) as TypCywilizacji);
      return {
        relation: rel,
        stanWojny: rel.status === 'wojna',
        turn,
        epoka: player.era,
        proposerRespekt,
        responderRespekt,
        militaryRatio,
        respektWzgledny,
        ekspansjaPrzyGranicy:
          cities.filter(c => c.ownerId === responderId).length > 2 &&
          cities.filter(c => c.ownerId === proposerId).length > 2,
        fairTradeValue: 20,
        activeDeals,
        difficulty: _menuDifficulty,
        proposerPlayer: { ownerId: proposerId, typCywilizacji: proposerTyp } as unknown as Player,
        responderPlayer: { ownerId: responderId, typCywilizacji: responderTyp } as unknown as Player,
      };
    }

    function applyProposalOutcome(
      proposerId: number,
      responderId: number,
      result: ReturnType<typeof evaluateProposal>,
      payload: ProposalPayload,
      cywAction: string,
    ): void {
      showDiplomacyProposalBanner(result.accepted, result.reason);
      if (!result.accepted) {
        if (cywAction === 'trybut_zadanie' || cywAction === 'trybut_oferta') {
          const cur = getDiploRelation(proposerId, responderId);
          setDiploRelation(proposerId, responderId, applyDiploEventTracked(proposerId, responderId, cur, 'trybut_odmowa'));
        }
        return;
      }
      if (result.deal) {
        activeDeals = applyAcceptedProposal(activeDeals, result);
        syncRelationFromDeals(proposerId, responderId);
        if (normalizeTreatyKind(result.deal.rodzaj) === RodzajTraktatu.UmowaHandlowa) {
          const dealId = result.deal.id;
          const items = result.deal.handelPayload;
          transferBasketItems(proposerId, responderId, items?.giveItems, dealId);
          transferBasketItems(responderId, proposerId, items?.receiveItems, dealId);
          const { givePn, receivePn } = resolveProposalPn(payload);
          const isGift = payload.isGift === true
            || ((payload.giveItems?.length ?? 0) > 0 && !(payload.receiveItems?.length) && (payload.receivePn ?? 0) <= 0);
          if (cywAction === 'handel' || cywAction === 'umowa_handlowa') {
            // Audyt #16: Zaufanie tylko gdy obie strony faktycznie POSIADAJĄ zadeklarowane
            // zasoby (zloto/praca/zywnosc) — bez tego dar/handel bez pokrycia dawał darmowy trust.
            const dealTreasury = buildDiploTreasury();
            const dealCovered = basketItemsAffordable(proposerId, items?.giveItems, dealTreasury)
              && basketItemsAffordable(responderId, items?.receiveItems, dealTreasury);
            if (dealCovered) {
              applyPnTrustForPair(proposerId, responderId, givePn, receivePn, isGift);
              const cur = getDiploRelation(proposerId, responderId);
              setDiploRelation(proposerId, responderId, applyDiploEventTracked(proposerId, responderId, cur, isGift ? 'dar' : 'handel'));
            } else {
              showHintMessage('Zaufanie nie naliczone — brak pokrycia w zasobach', 3500);
            }
          }
          // E6 (2026-07-23): oslodzik jednorazowy (AI -> gracz) towarzyszacy
          // proaktywnej propozycji Umowy Handlowej — payload.goldOnce, przelew
          // NIEZALEZNY od result.oneShotTrade (ktory tu nie jest ustawiony, bo
          // deal juz obsluzyl akceptacje traktatu).
          if (cywAction === 'umowa_handlowa' && (payload.goldOnce ?? 0) > 0) {
            executePnDealTransfer(proposerId, responderId, payload);
          }
        }
      }
      if (result.oneShotTrade) {
        executePnDealTransfer(proposerId, responderId, payload);
        const { givePn, receivePn } = resolveProposalPn(payload);
        const isGift = payload.isGift === true
          || ((payload.giveItems?.length ?? 0) > 0 && !(payload.receiveItems?.length) && (payload.receivePn ?? 0) <= 0);
        if (cywAction === 'handel') {
          // Audyt #16: jak wyżej — jednorazowy dar/handel bez pokrycia (koszyk lub legacy
          // goldOnce) nie generuje Zaufania.
          const oneShotTreasury = buildDiploTreasury();
          const legacyGoldOk = !(payload.giveItems?.length) && !(payload.receiveItems?.length)
            && (payload.goldOnce ?? 0) > 0
            ? oneShotTreasury.getPieniadze(proposerId) >= (payload.goldOnce ?? 0)
            : true;
          const oneShotCovered = legacyGoldOk
            && basketItemsAffordable(proposerId, payload.giveItems, oneShotTreasury)
            && basketItemsAffordable(responderId, payload.receiveItems, oneShotTreasury);
          if (oneShotCovered) {
            applyPnTrustForPair(proposerId, responderId, givePn, receivePn, isGift);
            const cur = getDiploRelation(proposerId, responderId);
            setDiploRelation(proposerId, responderId, applyDiploEventTracked(proposerId, responderId, cur, isGift ? 'dar' : 'handel'));
          } else {
            showHintMessage('Zaufanie nie naliczone — brak pokrycia w zasobach', 3500);
          }
        } else if (cywAction === 'trybut_oferta') {
          const cur = getDiploRelation(proposerId, responderId);
          setDiploRelation(proposerId, responderId, applyDiploEventTracked(proposerId, responderId, cur, 'trybut_oferta_przyjeta'));
        }
      } else if (cywAction === 'trybut_zadanie') {
        const cur = getDiploRelation(proposerId, responderId);
        setDiploRelation(proposerId, responderId, applyDiploEventTracked(proposerId, responderId, cur, 'trybut_zaakceptowany'));
      }
    }

    /**
     * TEMAT 9 (2026-07-24, stół negocjacyjny) — wspólne złożenie payloadu UI → propozycji
     * CYW, dzielone przez podgląd (previewNegotiatedProposal, BEZ finalizacji) i faktyczne
     * zawarcie umowy (handleNegotiatedProposal, WOŁANE dopiero z „Akceptuj").
     */
    function buildProposalFromPayload(
      ownerId: number,
      payload: NegotiationPayload,
    ): {
      cywAction: string;
      uiPayload: ProposalPayload;
      proposal: {
        actionId: import('./game/diplomacy-proposals').ProposalActionId;
        proposerOwnerId: number;
        responderOwnerId: number;
        payload: ProposalPayload;
      };
    } {
      const cywAction = proposalActionIdFromPayload(payload);
      const uiPayload: ProposalPayload = {
        turns: payload.turns,
        goldPerTurn: payload.goldPerTurn,
        goldOnce: payload.goldOnce,
        resource: payload.resource,
        amount: payload.amount,
        targetOwnerId: payload.targetOwnerId,
        borderMilitary: payload.borderMilitary,
        techId: payload.techId,
        bribeGold: payload.bribeGold,
        techPrice: payload.techId ? (payload.goldOnce ?? 50) : undefined,
        givePn: (payload as NegotiationPayload & { givePn?: number }).givePn,
        receivePn: (payload as NegotiationPayload & { receivePn?: number }).receivePn,
        giveItems: (payload as NegotiationPayload & { giveItems?: BasketItem[] }).giveItems,
        receiveItems: (payload as NegotiationPayload & { receiveItems?: BasketItem[] }).receiveItems,
        isGift: (payload as NegotiationPayload & { isGift?: boolean }).isGift,
        resourceTradeMode: payload.resourceTradeMode,
      };
      const proposal = {
        actionId: cywAction as import('./game/diplomacy-proposals').ProposalActionId,
        proposerOwnerId: 0,
        responderOwnerId: ownerId,
        payload: uiPayload,
      };
      return { cywAction, uiPayload, proposal };
    }

    /**
     * TEMAT 9 — podgląd „wstępnej zgody" drugiej strony PRZED zawarciem umowy.
     * Woła evaluateProposal (czysta funkcja, patrz diplomacy-proposals.ts:297) BEZ
     * applyProposalOutcome — zero mutacji stanu gry, zero efektów ubocznych (banner/relacja).
     */
    function previewNegotiatedProposal(
      ownerId: number,
      payload: NegotiationPayload,
    ): { accepted: boolean; reason?: string } {
      const { proposal } = buildProposalFromPayload(ownerId, payload);
      const ctx = buildProposalEvalContext(0, ownerId);
      const result = evaluateProposal(proposal, ctx);
      return { accepted: result.accepted, reason: result.reason };
    }

    function handleNegotiatedProposal(ownerId: number, payload: NegotiationPayload): void {
      // Re-walidacja: ctx + evaluateProposal liczone od nowa TU (moment „Akceptuj"),
      // nie ponownie użyty wynik podglądu — relacja mogła się zmienić od czasu podglądu.
      const { cywAction, uiPayload, proposal } = buildProposalFromPayload(ownerId, payload);
      const ctx = buildProposalEvalContext(0, ownerId);
      const result = evaluateProposal(proposal, ctx);
      applyProposalOutcome(0, ownerId, result, uiPayload, cywAction);
    }

    function diplomacyActionIdFromLabel(akcja: string): string {
      const m = /^(\d+)/.exec(akcja);
      return m ? m[1]! : akcja;
    }

    /** Relacja widoczna w audiencji = Zaufanie + Respekt z mocy (jak w panelu). */
    function audienceRelTotal(ownerId: number, rel: Relation): number {
      return Math.round(Math.max(0, Math.min(200, (rel.zaufanie ?? 0) + objectiveRespektPctToward(ownerId))));
    }

    /**
     * FAZA 1 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 4) — kontekst progowy dla
     * resolveDiplomacyActionLock (diplomacy-locks.ts), wspólny dla wszystkich akcji
     * poza '1' (kontakt, bramkowany osobno). Progi REALNE z silnika
     * (getEffectiveDiplomacyParams — już przeskalowane wg trudności), NIE z makiety.
     */
    function buildDiplomacyLockContextBase(
      ownerId: number,
      rel: Relation,
      relTotal: number,
      dip: ReturnType<typeof _diplomacyParams>,
    ): Omit<DiplomacyActionLockContext, 'actionId'> {
      const atWar = rel.status === 'wojna';
      const hasSojusz = activeDeals.some(
        d => dealInvolvesOwners(d, 0, ownerId) && isAllianceDealKind(d.rodzaj),
      );
      const brokenIds = atWar ? [] : treatiesBrokenByWar(activeDeals, 0, ownerId);
      const breakingDeal = brokenIds.length > 0
        ? activeDeals.find(d => d.id === brokenIds[0])
        : undefined;
      return {
        contact: true,
        atWar,
        relTotal,
        zaufanie: rel.zaufanie ?? 0,
        respekt: rel.respekt ?? 0,
        hasNap: hasTreaty(activeDeals, 0, ownerId, RodzajTraktatu.PaktNieagresji),
        hasHandel: hasTreaty(activeDeals, 0, ownerId, RodzajTraktatu.UmowaHandlowa),
        hasSojusz,
        breaksTreatyLabel: breakingDeal ? treatyDisplayLabel(breakingDeal.rodzaj) : undefined,
        sellableTechCount: getSellableTechForPlayer().length,
        knownRivalsCount: getKnownRivalsFor(ownerId).length,
        progNapRelacja: dip.progNapRelacja,
        progHandelRelacja: dip.progHandelRelacja,
        progSojuszRelacja: dip.progSojuszRelacja,
        progSojuszZaufanie: dip.progSojuszZaufanie,
        progGraniceRelacja: dip.progGraniceRelacja,
        progGraniceZaufanie: dip.progGraniceZaufanie,
        progWymianaTechZaufanie: dip.progWymianaTechZaufanie,
        progNamowWojneZaufanie: dip.progNamowWojneZaufanie,
        progWasalizacjaRespekt: dip.progWasalizacjaRespekt,
        progTrybutZadanieMinRespekt: dip.progTrybutZadanieMinRespekt,
        progDarRelacja: diplomacyProgDarRelacja(undefined, _menuDifficulty),
      };
    }

    function buildAudienceActions(
      ownerId: number,
      layer: ReturnType<typeof diplomacyLayerForOwner>,
    ): AudienceAction[] {
      const rel = getDiploRelation(0, ownerId);
      const dip = _diplomacyParams();
      const relTotal = audienceRelTotal(ownerId, rel);
      const tier = relationTier(rel);
      const contact = diplomaticContactEstablished.has(ownerId);
      const isSimplified = layer === 'simplified';
      const akcje = (data.diplomacy as { akcje_dyplomatyczne?: Array<Record<string, string>> }).akcje_dyplomatyczne ?? [];
      const out: AudienceAction[] = [];
      const lockCtxBase = contact ? buildDiplomacyLockContextBase(ownerId, rel, relTotal, dip) : null;

      for (const row of akcje) {
        const raw = row['Akcja'] ?? '';
        const id = diplomacyActionIdFromLabel(raw);
        if (isSimplified && !AUDIENCE_BASIC_IDS.has(id)) continue;

        const label = raw.replace(/^\d+\.\s*/, '');
        let enabled = true;
        let tooltip = row['Opis'] ?? '';
        let locked: boolean | undefined;
        let lockNote: string | undefined;
        let active: boolean | undefined;

        if (!contact && id !== '1') {
          enabled = false;
          tooltip = 'Najpierw nawiąż kontakt';
        } else if (id === '1' && contact) {
          enabled = false;
          tooltip = 'Kontakt już nawiązany';
        } else if (id === '11' && !playerDiplomacyActionAllowed(layer, 'war')) {
          // Bramka warstwy uproszczonej (miasta-państwa/obcy typ) — dominuje nad progiem.
          enabled = false;
          tooltip = 'Niedostępne';
        } else if (id === '5' && !playerDiplomacyActionAllowed(layer, 'trade')) {
          enabled = false;
          tooltip = 'Handel niedostępny';
        } else if (lockCtxBase) {
          const result = resolveDiplomacyActionLock({ actionId: id, ...lockCtxBase });
          locked = result.locked;
          enabled = !result.locked;
          lockNote = result.note || undefined;
          tooltip = result.note || tooltip;
          active = result.active;
        }

        out.push({ id, label, enabled, tooltip, opis: row['Opis'], locked, lockNote, active });
      }
      return out;
    }

    function applyAudienceAction(ownerId: number, actionId: string, payload?: NegotiationPayload): void {
      const civName = ownerDiploLabel(ownerId);
      const layer = diplomacyLayerForOwner(
        ownerId,
        simplifiedDiplomacyOwners,
        foreignTypeOwners,
        getDiplomaticContacts(),
      );

      if (payload) {
        handleNegotiatedProposal(ownerId, payload);
        updateDiplomacyAudience();
        updateDiplomacyPanel();
        updateHud();
        return;
      }
      if (actionNeedsNegotiation(actionId)) return;

      if (actionId === '11') {
        showWarConfirmModal(civName, () => {
          if (!playerDiplomacyActionAllowed(layer, 'war')) return;
          breakTreatiesOnWar(0, ownerId, true);
          applyAllianceObligationsOnWar(0, ownerId);
          setDiploRelation(0, ownerId, applyDiploEventTracked(0, ownerId, getDiploRelation(0, ownerId), 'wojna_wypowiedziana'));
          showHintMessage('\u2694 Wypowiedziałeś wojnę: ' + civName, 4500);
          updateDiplomacyAudience();
          updateDiplomacyPanel();
          updateHud();
        });
        return;
      }

      switch (actionId) {
        case '1':
          diplomaticContactEstablished.add(ownerId);
          showHintMessage('Nawiązano kontakt dyplomatyczny: ' + civName, 4000);
          break;
        case '10':
          if (!playerDiplomacyActionAllowed(layer, 'peace')) return;
          setDiploRelation(0, ownerId, applyDiploEventTracked(0, ownerId, getDiploRelation(0, ownerId), 'pokoj'));
          showHintMessage('\u{1F54A} Pokój z: ' + civName, 4000);
          break;
        case '5':
          if (!playerDiplomacyActionAllowed(layer, 'trade')) return;
          showHintMessage('Handel — użyj formularza negocjacji', 3000);
          break;
        default:
          showHintMessage('Akcja dyplomatyczna (wkrótce): ' + civName, 3000);
      }
      updateDiplomacyAudience();
      updateDiplomacyPanel();
      updateHud();
    }

    /**
     * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 2) — traktat „dominujący" dla bannera
     * statusu formalnego (ten sam priorytet co resolveFormalDiplomaticStatus: sojusz >
     * pakt > handel). Dla wojna/pokój/brak — brak traktatu, baner pokazuje samą etykietę.
     */
    function dominantTreatyForFormalStatus(
      kind: FormalDiplomaticKind,
      a: number,
      b: number,
    ): ActiveDeal | null {
      const pair = activeDeals.filter(d => dealInvolvesOwners(d, a, b));
      if (kind === 'sojusz') return pair.find(d => isAllianceDealKind(d.rodzaj)) ?? null;
      if (kind === 'pakt') return pair.find(d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.PaktNieagresji) ?? null;
      if (kind === 'handel') return pair.find(d => normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.UmowaHandlowa) ?? null;
      return null;
    }

    /**
     * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 1) — „Potencjał sojuszniczy": jak blisko
     * jest TA para do progu sojuszu (DIPLOMACY_PARAMS.progSojuszZaufanie/progSojuszRelacja).
     * Metryka jest per-PARA (Zaufanie/Respekt to relacja 0↔ownerId, nie cecha "wewnętrzna"
     * jednej cywilizacji) — mockup pokazuje ją mirror na obu kartach; renderujemy tę samą
     * wartość po obu stronach (uczciwe wobec realnych danych — patrz raport integratora).
     */
    function sojuszPotencjalForPair(
      zaufanie: number,
      respekt: number,
      dip: ReturnType<typeof _diplomacyParams>,
    ): { pct: number; label: string } {
      const relTotal = zaufanie + respekt;
      const pctZaufanie = dip.progSojuszZaufanie > 0 ? (zaufanie / dip.progSojuszZaufanie) * 100 : 0;
      const pctRelacja = dip.progSojuszRelacja > 0 ? (relTotal / dip.progSojuszRelacja) * 100 : 0;
      const pct = Math.max(0, Math.min(100, Math.round(Math.min(pctZaufanie, pctRelacja))));
      const label = pct >= 90 ? 'Bardzo wysoki' : pct >= 66 ? 'Wysoki' : pct >= 33 ? 'Średni' : 'Niski';
      return { pct, label };
    }

    /**
     * FAZA 2 (Makieta DYPLOMACJA v1.1, KROK 3 pkt 1) — „Dobra handlowe": (a) technologie
     * zbadane przez WŁAŚCICIELA (to samo źródło co akcja id 6 „Wymiana/sprzedaż technologii"
     * — ownerResearchedTechs), (b) indeks realnie posiadanych surowców (zaległość #3,
     * 2026-07-23 — game/diplomacy-goods.ts przez tradableGoodsIndexForOwner). PRZED tą
     * zmianą (b) był globalny katalog (diplomacyResourceAccessCatalog) — ta sama lista po
     * OBU stronach niezależnie od faktycznego posiadania; teraz różni się realnie per owner.
     */
    function tradeGoodsForOwner(ownerId: number): string[] {
      const techs = Array.from(ownerResearchedTechs(ownerId))
        .map(slug => techNameFromSlug(slug) ?? slug)
        .slice(0, 3);
      const goods = tradableGoodsIndexForOwner(ownerId)
        .map(g => (g.ilosc != null ? g.label + ' ×' + g.ilosc : g.label))
        .slice(0, 4);
      return [...goods, ...techs].slice(0, 7);
    }

    function openDiplomacyAudience(ownerId: number): void {
      diplomacyAudienceOwnerId = ownerId;
      const playerCivName = String(player.civType || 'Gracz');
      showDiplomacyAudience({
        ownerId,
        getState: () => {
          const contacted = getDiplomaticContacts();
          if (!contacted.has(ownerId)) return null;
          const rel = getDiploRelation(0, ownerId);
          const layer = diplomacyLayerForOwner(
            ownerId,
            simplifiedDiplomacyOwners,
            foreignTypeOwners,
            contacted,
          );
          const zaufanieNorm = Math.round(Math.max(0, Math.min(100, rel.zaufanie ?? 0)));
          const playerPower = objectivePowerForOwner(0);
          const otherPower = objectivePowerForOwner(ownerId);
          const powerLine = formatPowerRelationLine(playerPower, otherPower);
          const respektNorm = powerLine.respekt;
          const pairMeta = getDiploPairMeta(0, ownerId);
          const dip = _diplomacyParams();
          let _fsAlly = false;
          let _fsPakt = false;
          let _fsTrade = false;
          for (const d of activeDeals) {
            if (!d.strony.includes(0) || !d.strony.includes(ownerId)) continue;
            const k = normalizeTreatyKind(d.rodzaj);
            if (isAllianceDealKind(d.rodzaj)) _fsAlly = true;
            else if (k === RodzajTraktatu.PaktNieagresji) _fsPakt = true;
            else if (k === RodzajTraktatu.UmowaHandlowa) _fsTrade = true;
          }
          const formalStatus = resolveFormalDiplomaticStatus({
            relationStatus: rel.status,
            hasAlliance: _fsAlly,
            hasNap: _fsPakt,
            hasTrade: _fsTrade,
            contactEstablished: diplomaticContactEstablished.has(ownerId),
          });
          const dominantTreaty = dominantTreatyForFormalStatus(formalStatus.kind, 0, ownerId);
          const formalStatusDetail = dominantTreaty ? {
            sinceTurns: dominantTreaty.zawartaTura !== undefined
              ? Math.max(0, turn - dominantTreaty.zawartaTura)
              : undefined,
            breakPenaltyLabel: treatyBreakPenaltyLabel(dominantTreaty.rodzaj),
          } : undefined;
          return {
            formalStatus,
            formalStatusDetail,
            playerTitle: 'Władca · ' + epochLabelForOwner(0),
            playerCivName,
            otherTitle: 'Przedstawiciel',
            otherCivName: ownerDiploLabel(ownerId),
            zaufanie: zaufanieNorm,
            respekt: respektNorm,
            relacjaTotal: zaufanieNorm + respektNorm,
            trustPnGainedThisTurn: pairMeta.trustPnGainedThisTurn,
            progDarRelacja: diplomacyProgDarRelacja(undefined, _menuDifficulty),
            playerPower,
            otherPower,
            powerRatioLabel: powerLine.ratioLabel,
            personalityTags: diplomacyPersonalityTags(civKeyForOwner(ownerId)),
            activeTreaties: activeTreatiesForPair(0, ownerId),
            otherEpochLabel: epochLabelForOwner(ownerId),
            otherIkonaId: civTypeForOwner(ownerId),
            otherWodz: leaderNameForOwnerId(ownerId) ?? undefined,
            otherEra: empireEpochForOwner(ownerId),
            otherKolorHex: civKolorHexFn(ownerId),
            otherIsCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
            otherCultureLabel: civCultureLabelForKey(civKeyForOwner(ownerId)),
            cultureCircleSame: sameCultureCircle(civKeyForOwner(0), civKeyForOwner(ownerId)),
            thresholds: {
              sojuszZaufanie: dip.progSojuszZaufanie,
              techZaufanie: dip.progWymianaTechZaufanie,
            },
            tier: relationTier(rel),
            layer: layer === 'pre_contact' ? 'full' : layer,
            contactEstablished: diplomaticContactEstablished.has(ownerId),
            actions: buildAudienceActions(ownerId, layer),
            relationBreakdown: getRelationBreakdown(0, ownerId),
            playerSkarbiec: Math.floor(player.skarbiec),
            playerZlotoPerTura: Math.floor(_lastPieniadzRate),
            sojuszPotencjal: sojuszPotencjalForPair(zaufanieNorm, respektNorm, dip),
            playerGoods: tradeGoodsForOwner(0),
            otherGoods: tradeGoodsForOwner(ownerId),
            playerIkonaId: civTypeForOwner(0),
            playerWodz: leaderNameForOwnerId(0) ?? undefined,
            playerKolorHex: civKolorHexFn(0),
            playerEra: empireEpochForOwner(0),
          };
        },
        onAction: applyAudienceAction,
        previewNegotiation: previewNegotiatedProposal,
        backLabel: d1bHudActive ? 'Wróć' : 'Wyjście',
        onBack: () => {
          hideDiplomacyAudience();
          diplomacyAudienceOwnerId = null;
          if (d1bHudActive) {
            showDiploListHud();
            refreshD1bHud();
          } else {
            updateDiplomacyPanel();
          }
          requestAnimationFrame(() => tryOpenNextAutoDiploAudience());
        },
        onOpenKnownFactions: () => {
          hideDiplomacyAudience();
          diplomacyAudienceOwnerId = null;
          d1bHudActive = true;
          showDiploListHud();
          refreshD1bHud();
        },
        getCivBonusy: civBonusyForOwnerId,
        getNegotiationContext: () => {
          const rel = getDiploRelation(0, ownerId);
          const dip = _diplomacyParams();
          return {
            civName: ownerDiploLabel(ownerId),
            rivalOptions: getKnownRivalsFor(ownerId),
            techOptions: getSellableTechForPlayer(),
            borderFeeCivil: 20,
            borderFeeMilitary: 40,
            relacjaTotal: audienceRelTotal(ownerId, rel),
            trustPnGainedThisTurn: getDiploPairMeta(0, ownerId).trustPnGainedThisTurn,
            progDarRelacja: diplomacyProgDarRelacja(undefined, _menuDifficulty),
            progHandelRelacja: dip.progHandelRelacja,
            // #45: miasta gracza z zapasem spichlerza — bez tego koszyk PN "zywnosc" byl martwy
            // (readItemFromForm zawsze dostawal cityId='' -> null). Transfer w silniku dziala
            // per-panstwo (empireFoodStates/zapasyPanstwa), nie per-miasto (main.ts:3592-3601).
            cityOptions: cities
              .filter(c => c.ownerId === 0)
              .map(c => ({ id: c.id, label: c.name, spichlerz: c.magazynZywnosci ?? 0 })),
            // Zaległość #3 (2026-07-23): resourceOptions PER STRONA — realnie posiadane dobra
            // (diplomacy-goods.ts), nie globalny katalog identyczny po obu stronach.
            resourceOptions: priceableTradableGoodOptions(0),
            giveResourceOptions: priceableTradableGoodOptions(0),
            receiveResourceOptions: priceableTradableGoodOptions(ownerId),
            // C-DYP-SUROWCE-Q1=B (2026-07-23): surowce ILOŚCIOWE per STRONA (magazyn miast).
            giveQuantityResourceOptions: quantityTradableGoodOptions(0),
            receiveQuantityResourceOptions: quantityTradableGoodOptions(ownerId),
            // Zaległość #1 (SZYBKA UMOWA) — górny limit złota-dopełniacza w propozycji.
            playerSkarbiec: Math.floor(player.skarbiec),
          };
        },
        onBreakTreaty: (dealId: string) => breakTreatyVoluntarily(dealId),
      });
    }

    function buildDiplomacyPanelConfig(): DiplomacyPanelConfig {
      return {
        getRelations: () => buildPlayerDiploRelations(),
        getKnownWarsBetweenOthers: collectKnownWarsBetweenOthers,
        onOpenAudience: (ownerId: number) => openDiplomacyAudience(ownerId),
      };
    }

    const HEX_NEIGHBOR_DIRS: ReadonlyArray<readonly [number, number]> = [
      [+1, 0], [-1, 0], [0, +1], [0, -1], [+1, -1], [-1, +1],
    ];

    function playerUnitsOnHex(q: number, r: number) {
      return units.filter(u => u.ownerId === 0 && u.q === q && u.r === r);
    }

    function hasAdjacentPlayerArmy(q: number, r: number): boolean {
      for (const [dq, dr] of HEX_NEIGHBOR_DIRS) {
        if (playerUnitsOnHex(q + dq, r + dr).length > 0) return true;
      }
      return false;
    }

    function buildArmyStackHudState(): ArmyStackHudState | null {
      if (selectedId === null) return null;
      const active = units.find(x => x.id === selectedId);
      if (!active || active.ownerId !== 0) return null;
      const stack = playerStackAt(active);
      if (stack.length > 1) syncStackRuchLeft(stack);
      const stackRuch = stackRuchLeft(stack);
      const cards = stack.map(u => {
        const udef = lookupUnitDef(u.typeId);
        const hpMax = unitHealth(udef);
        const movMax = normFieldVal(udef['Ruch'], 2);
        return {
          id: u.id,
          name: u.typeId,
          icon: unitIconSvg(udef, u.typeId),
          hp: u.hp ?? hpMax,
          hpMax,
          ruchLeft: stack.length > 1 ? stackRuch : u.ruchLeft,
          ruchMax: movMax,
          active: u.id === selectedId,
        };
      });
      const def = lookupUnitDef(active.typeId);
      const siegeCity = active.oblegaCityId
        ? cities.find(c => c.id === active.oblegaCityId)
        : null;
      const actions: ArmyStackHudState['actions'] = [];
      const hasPlan = plannedMarches.has(active.id);
      if (siegeCity) {
        actions.push({ id: 'siege-hold', label: 'Oblega', disabled: true });
      } else if (hasPlan) {
        actions.push({
          id: 'march-stop',
          label: 'Zatrzymaj',
          disabled: isAnimating,
        });
      }
      if (!siegeCity) {
        actions.push({ id: 'fortify', label: 'Ufortyfikuj', disabled: stackRuch <= 0 });
        // Mechanizm "Zast\u0105p" (ZASTAP-JEDNOSTKI-PLAN.md): dost\u0119pne w ca\u0142ym
        // terytorium gracza (decyzja w\u0142a\u015bciciela, nie tylko garnizon miasta),
        // jednostka jeszcze nie u\u017cy\u0142a akcji w tej turze, i istnieje >=1 zamiennik.
        const replaceDisabled = !isUnitInPlayerTerritory(active)
          || active.replaceUsedThisTurn === true
          || computeUnitReplacements(active).length === 0;
        actions.push({ id: 'replace', label: 'Zast\u0105p', disabled: replaceDisabled });
        // C-SENTRY-Q1 wariant A (Maciej 2026-07-25): "Czuwaj" -- jak Pomi\u0144/Ufort.
        // (zu\u017cywa ruch na wej\u015bciu), trwa mi\u0119dzy turami do r\u0119cznego lub
        // AUTOMATYCZNEGO budzenia (ponowny klik budzi bez zu\u017cycia ruchu; patrz te\u017c
        // wakeSentryUnitsOnEnemyContact() -- budzi automatycznie, gdy wr\u00f3g wejdzie
        // w pole widzenia jednostki, sprawdzane raz na ko\u0144cu ka\u017cdej tury).
        const enteringSentry = active.sentry !== true;
        actions.push({
          id: 'sentry',
          label: enteringSentry ? 'Czuwaj' : 'Obud\u017a',
          disabled: enteringSentry && stackRuch <= 0,
        });
      }
      actions.push({ id: 'skip', label: 'Pomi\u0144', disabled: siegeCity !== null });
      actions.push({ id: 'disband', label: 'Rozwi\u0105\u017c', danger: true });
      return {
        hexLabel: siegeCity
          ? '(' + active.q + ',' + active.r + ') \u00b7 Oblega ' + siegeCity.name
          : '(' + active.q + ',' + active.r + ')',
        unitCount: stack.length,
        cards,
        atk: unitAtak(def),
        def: unitObrona(def),
        mov: normFieldVal(def['Ruch'], 2),
        rng: normFieldVal(def['Zasi\u0119g'] ?? def['Zasieg'], 0),
        hp: active.hp ?? unitHealth(def),
        hpMax: unitHealth(def),
        actions,
      };
    }

    function hasAnySaveSlot(): boolean {
      try { return listSaves().length > 0; } catch { return false; }
    }

    function openSaveGameDialog(): void {
      showSaveGameDialog({
        defaultLabel: currentSaveLabel('manual'),
        turn,
        onSave: (slotId, label) => {
          const ok = persistSaveToSlot(slotId, label);
          if (ok) {
            showHintMessage(`Gra zapisana: «${label}» (tura ${turn})`, 3500);
            console.log('[Save] slot=' + slotId + ' label=' + label + ' tura=' + turn);
            // #69: menu pauzy zostaje otwarte pod dialogiem zapisu — odblokuj
            // „Wczytaj grę" bez czekania na pełne zamknięcie/otwarcie menu.
            refreshGamePauseMenuLoadState();
          } else {
            showHintMessage('Zapis nieudany (brak localStorage?)', 3000);
          }
        },
      });
    }

    function openLoadGameDialog(fromInGamePause = false): void {
      if (!hasAnySaveSlot()) {
        showHintMessage(
          fromInGamePause
            ? 'Brak zapisów na tym urządzeniu.'
            : 'Brak zapisów. Zapisz grę w menu pauzy lub Ctrl+S.',
          3500,
        );
        if (!fromInGamePause) openStartupMainMenu();
        return;
      }
      if (!fromInGamePause) hideMainMenu();
      showLoadGameDialog({
        onLoad: (slotId) => { void loadGameFromSlot(slotId, fromInGamePause); },
        onCancel: () => {
          if (!fromInGamePause) openStartupMainMenu();
        },
      });
    }

    function openStartupMainMenu(): void {
      resetStuckInteractiveState();
      // Wymuszamy wzajemną wykluczalność z muzyką rozgrywki: jeśli ta funkcja
      // jest wołana z jakiejś ścieżki powrotu w trakcie/awarii rozpoczynania
      // gry (już po startGameMusic()), nie chcemy, żeby synteza/kamień-pliki
      // grały RÓWNOLEGLE z intro w tle menu. Odgłosy natury analogicznie —
      // nie mają odpowiednika na ekranach przedgrowych, więc po prostu milkną.
      stopMusic();
      stopAmbience();
      // Defensywnie zdejmij ewentualną blokadę ambBattleMuted (wyjście z menu
      // pauzy w trakcie bitwy, patrz #40) — setMood('mapa') to jedyny hak
      // wpięty w ambApplyBattleMute(), więc kolejna gra nie startuje z niemą naturą.
      setMood('mapa');
      resumeIntroMusic();
      showMainMenu({
        hasSave: hasAnySaveSlot,
        onNewGame: () => {
          hideMainMenu();
          showNewGameFlow({
            data,
            onStart: (params: NewGameParams) => void doStartGame(params),
            onCancel: () => { hideNewGameFlow(); showMainMenu(); },
          });
        },
        onContinue: () => {
          hideMainMenu();
          const slot = continueSaveSlotId();
          if (slot) {
            void loadGameFromSlot(slot, false);
          } else {
            openLoadGameDialog(false);
          }
        },
        onLoad: () => openLoadGameDialog(false),
        onAbout: () => {
          showWikiHubHud({ tab: 'poradnik', layout: 'overlay' });
        },
        onPerfTest: () => showPerfTestPanel(),
        onQuit: () => { /* future - na stronie nie ma gdzie wyjść */ },
      });
    }

    configureGamePauseMenu({
      hasSave: hasAnySaveSlot,
      onResume: () => { /* gra już widoczna pod overlayem */ },
      onSave: () => { openSaveGameDialog(); },
      onLoad: () => { openLoadGameDialog(true); },
      onNewGame: () => {
        showNewGameFlow({
          data,
          onStart: (params: NewGameParams) => void doStartGame(params),
          onCancel: () => { hideNewGameFlow(); },
        });
      },
      onMainMenu: () => { resetStuckInteractiveState(); openStartupMainMenu(); },
      getMusicEnabled: () => musicEnabled,
      getMusicVolume: () => musicVolumeState,
      onMusicToggle: (enabled) => {
        // C-AUD-Q5=A: `enabled` jest ulotny (tylko bieżąca rozgrywka) — celowo
        // NIE wchodzi do saveMusicPrefs (patrz audio/musicPrefs.ts).
        musicEnabled = enabled;
        saveMusicPrefs({ volume: musicVolumeState });
        if (enabled) startMusic(getMood()); else stopMusic();
      },
      onMusicVolumeChange: (v) => {
        musicVolumeState = v;
        saveMusicPrefs({ volume: musicVolumeState });
        setMusicVolume(v);
      },
      getAmbienceEnabled: () => ambienceEnabled,
      getAmbienceVolume: () => ambienceVolumeState,
      onAmbienceToggle: (enabled) => {
        // TEMAT #9 (ten sam wzorzec co C-AUD-Q5=A): `enabled` jest ulotny
        // (tylko bieżąca rozgrywka) — celowo NIE wchodzi do
        // saveAmbiencePrefs (patrz audio/ambiencePrefs.ts).
        ambienceEnabled = enabled;
        saveAmbiencePrefs({ volume: ambienceVolumeState });
        if (enabled) startAmbience(); else stopAmbience();
      },
      onAmbienceVolumeChange: (v) => {
        ambienceVolumeState = v;
        saveAmbiencePrefs({ volume: ambienceVolumeState });
        setAmbienceVolume(v);
      },
      getAutosaveFreq: () => getAutosaveFrequency(),
      onAutosaveFreqChange: (turns) => {
        setAutosaveFrequency(turns);
        showHintMessage('Autozapis: co ' + Math.max(1, Math.round(turns)) + ' tur (10 ostatnich wstecz)', 3000);
      },
    });

    function mountD1bHud(): void {
      d1bHudActive = true;
      createCityListHud({
        getCities: buildPlayerCityListEntries,
        onSelectCity: (cityId) => {
          const c = cities.find(x => x.id === cityId);
          if (!c || c.ownerId !== 0) return;
          hideArmyListHud();
          openCityPanelForPlayer(c);
          refreshD1bHud();
        },
        onClose: () => refreshD1bHud(),
      });
      createArmyListHud({
        getArmies: buildPlayerArmyListEntries,
        onSelectArmy: (unitId) => {
          selectPlayerUnit(unitId);
          // K: po kliknięciu jednostki w panelu ARMIE wycentruj kamerę na jej heksie
          // (zachowując bieżący zoom).
          const su = units.find(x => x.id === unitId);
          if (su) {
            const { x, z } = axialToWorld(su.q, su.r, HEX_R);
            const { dist } = camCtrl.getFocusState();
            camCtrl.focusAt(x, z, dist);
          }
          refreshD1bHud();
        },
        onClose: () => refreshD1bHud(),
      });
      createDiploListHud({
        getEntries: buildPlayerDiploListEntries,
        onSelectEntry: (ownerId) => {
          hideDiploListHud();
          openDiplomacyAudience(ownerId);
          refreshD1bHud();
        },
        onClose: () => refreshD1bHud(),
      });
      createScienceHubHud({
        getProgress: () => {
          const snap = getScienceHubSnapshot(0);
          const hs = buildHudState();
          if (snap.progress) snap.progress.naukaRate = hs.naukaRate;
          return snap.progress;
        },
        getEntries: () => getScienceHubSnapshot(0).entries,
        onSelectTech: (techId) => {
          enqueueOrSetPlayerResearchSlug(techId);
          refreshD1bHud();
        },
        onOpenFullTree: () => openScienceTreeDocked(),
        onShowInTree: (techId) => openScienceTreeDocked(techId),
        onOpenTreeView: () => showTechTreeView(0),
        onClose: () => {
          hideSciencePicker();
          refreshD1bHud();
        },
        isTreeOpen: () => isSciencePickerOpen() || isTechTreeViewOpen(),
        getPlan: () => buildResearchPlanSnapshot(),
        onEnqueue: (techId) => enqueueOrSetPlayerResearchSlug(techId),
        onDequeue: (techId) => dequeuePlayerResearchSlug(techId),
        onReorder: (fromIdx, toIdx) => reorderPlayerResearchQueue(fromIdx, toIdx),
      });
      createWikiHubHud({
        onClose: () => refreshD1bHud(),
      });

      showHud({
        getState: buildHudState,
        getPowerOverlay: buildPowerOverlayData,
        getCultureOverlay: buildCultureOverlayData,
        getReligionOverlay: buildReligionOverlayData,
        getYearLabel: () => Math.max(0, 4000 - turn * 50) + ' p.n.e.',
        onExecutePending: () => executeFirstBlockingEvent(),
        canEndTurn: () => !playtestWalkaActive && !isAwaitingFirstPlayerCity(),
        hideEndTurn: () => playtestWalkaActive,
        getBlockingCount: () => countBlockingEvents(),
        onEndTurn: () => {
          if (playtestWalkaActive) return;
          window.dispatchEvent(new KeyboardEvent('keydown', { key: 'n', bubbles: true }));
        },
        onOpenMenu: () => {
          if (isMainMenuOpen() || isNewGameFlowOpen()) return;
          toggleGamePauseMenu();
        },
        onOpenDiplomacy: () => toggleDiploListFromToolbar(),
        onDiploChip: () => toggleDiploListFromToolbar(),
        onOpenScience: () => toggleScienceHubFromToolbar(),
        onOpenEmpireDetail: (section) => openEmpireDetailFromHud(section),
        onOpenWiki: () => toggleWikiFromToolbar(),
        isWikiActive: () => isWikiHubHudOpen(),
        mapToolbar: {
          onOpenCities: () => {
            clearPlayerUnitSelection();
            if (isCityListHudOpen() && !isCityPanelOpen()) {
              hideCityListHud();
              refreshD1bHud();
              return;
            }
            closeAllMapToolbarModes();
            showCityListHud();
            refreshD1bHud();
          },
          isCityListActive: () => isCityListHudOpen(),
          onOpenScience: () => {
            clearPlayerUnitSelection();
            toggleScienceHubFromToolbar();
          },
          isScienceHubActive: () => isScienceHubHudOpen() || isSciencePickerOpen(),
          onOpenCulture: () => {
            clearPlayerUnitSelection();
            toggleCultureRangeOnMap();
          },
          onOpenReligion: () => {
            clearPlayerUnitSelection();
            toggleReligionRangeOnMap();
          },
          onOpenDiplomacy: () => {
            clearPlayerUnitSelection();
            toggleDiploListFromToolbar();
          },
          onOpenArmy: () => {
            clearPlayerUnitSelection();
            if (isArmyListHudOpen()) {
              hideArmyListHud();
              refreshD1bHud();
              return;
            }
            closeAllMapToolbarModes();
            showArmyListHud();
            refreshD1bHud();
          },
          isArmyListActive: () => isArmyListHudOpen(),
          isDiploListActive: () => isDiploListHudOpen(),
          onOpenBuild: () => {
            clearPlayerUnitSelection();
            if (buildModeOpen) {
              exitBuildMode();
              refreshD1bHud();
              return;
            }
            closeAllMapToolbarModes();
            buildModeOpen = true;
            autoEnableWorkerOverlayForBuildMode();
            if (isAwaitingFirstPlayerCity()) {
              foundCityMode = true;
              activeImprovementKey = null;
            }
            refreshBuildApi();
            refreshBuildHighlight();
            refreshD1bHud();
          },
          isCultureRangeActive: () => cultureRangeVisible,
          isReligionRangeActive: () => religionRangeVisible,
        },
        buildMode: {
          listTypes: () => buildApi?.listTypes() ?? [],
          getActiveKey: () => activeImprovementKey,
          onSelectType: (key) => {
            foundCityMode = false;
            activeImprovementKey = key;
            refreshBuildApi();
            refreshBuildHighlight();
            refreshD1bHud();
          },
          onExit: () => exitBuildMode(),
          isOpen: () => buildModeOpen,
          canFoundCity: () => {
            const pc = cities.filter(c => c.ownerId === 0);
            if (pc.length === 0) return true;
            return true;
          },
          getFoundCityCostLabel: () =>
            foundCityCostLabel(!isSubsequentFoundCity(cities.filter(c => c.ownerId === 0), 0)),
          getFoundCityLockHint: () => {
            const pc = cities.filter(c => c.ownerId === 0);
            if (pc.length === 0) return null;
            const aff = evaluateFoundCityAffordance(playerPracaPool, pc, 0);
            return aff.ok ? null : aff.reason ?? null;
          },
          isFoundCityActive: () => foundCityMode,
          onSelectFoundCity: () => {
            foundCityMode = true;
            activeImprovementKey = null;
            refreshBuildHighlight();
            refreshD1bHud();
          },
          listWonders: () => wonderHudEntries(),
          getWonderTargetLabel: () => wonderHudTargetLabel(),
          onSelectWonder: (wonderId) => {
            foundCityMode = false;
            activeImprovementKey = null;
            refreshBuildHighlight();
            enqueueWonderForPlayer(wonderId);
          },
        },
        armyStack: {
          getStack: () => (isWorldMapUnitMode() ? buildArmyStackHudState() : null),
          onSelectUnit: (id) => selectPlayerUnit(id, true),
          onOpenArmyList: () => {
            showArmyListHud();
            refreshD1bHud();
          },
          canMerge: () => {
            if (selectedId === null) return false;
            const u = units.find(x => x.id === selectedId);
            if (!u || u.ownerId !== 0) return false;
            return hasAdjacentPlayerArmy(u.q, u.r);
          },
          onMerge: () => {
            const u = selectedId !== null ? units.find(x => x.id === selectedId) : null;
            if (!u || !stackCanMove(u)) return;
            for (const [dq, dr] of HEX_NEIGHBOR_DIRS) {
              const nq = u.q + dq;
              const nr = u.r + dr;
              const stack = visibleStackOnHex(units, nq, nr, u.ownerId);
              if (stack.length === 0) continue;
              if (reachable.has(keyOf(nq, nr))) {
                beginMoveSelectedUnitTo(nq, nr);
                return;
              }
            }
            showHintMessage(
              'Po\u0142\u0105czenie: klik s\u0105siedni\u0105 w\u0142asn\u0105 armi\u0119 (kursor spinacza)',
              3500,
            );
          },
          canSplit: () => {
            if (selectedId === null) return false;
            const u = units.find(x => x.id === selectedId);
            if (!u || u.ownerId !== 0) return false;
            const stack = visibleStackOnHex(units, u.q, u.r, u.ownerId);
            if (stack.length < 2) return false;
            return findAdjacentEmptyHexes(units, u.q, u.r, isHexPassableForUnit).length > 0;
          },
          onSplit: () => openSplitPanelForSelected(),
          onAction: (actionId) => {
            const u = selectedId !== null ? units.find(x => x.id === selectedId) : null;
            if (!u) return;
            const stack = playerStackAt(u);
            if (actionId === 'march-continue') {
              continuePlannedMarchForSelected();
            } else if (actionId === 'march-stop') {
              stopPlannedMarchForSelected();
            } else if (actionId === 'skip') {
              clearPlannedMarch(u.id);
              syncStackRuchLeft(stack, 0);
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
              unitRenderer.clearPathRoute();
              refreshD1bHud();
            } else if (actionId === 'fortify') {
              clearPlannedMarch(u.id);
              syncStackRuchLeft(stack, 0);
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
              unitRenderer.clearPathRoute();
              const city = cityAtUnit(u);
              if (city !== undefined && u.ownerId === city.ownerId) {
                u.inGarnizon = true;
                syncGarnizonForCity(city);
                refreshFog();
                refreshCityPanelIfOpen();
                showHintMessage(
                  u.typeId + ' w garnizonie \u2014 ' + city.name,
                  2800,
                );
                clearPlayerUnitSelection();
              } else {
                showHintMessage('Ufortyfikowano (ruch zu\u017cyty)', 2000);
              }
              refreshD1bHud();
            } else if (actionId === 'disband') {
              disbandPlayerUnit(u.id);
            } else if (actionId === 'replace') {
              openUnitReplacePicker(u);
            } else if (actionId === 'sentry') {
              // C-SENTRY-Q1 wariant A: toggle -- wejście zużywa ruch całego stosu
              // (jak Ufort./Pomiń), obudzenie NIE zużywa ruchu (gracz odzyskuje
              // kontrolę od razu). Auto-budzenie na widok wroga: patrz
              // wakeSentryUnitsOnEnemyContact() (koniec każdej tury).
              const enteringSentry = u.sentry !== true;
              if (enteringSentry) {
                clearPlannedMarch(u.id);
                syncStackRuchLeft(stack, 0);
                reachable = new Set<string>();
                unitRenderer.clearHighlight();
                unitRenderer.clearPathRoute();
                for (const su of stack) su.sentry = true;
                showHintMessage(u.typeId + ' czuwa (obudź ręcznie)', 2500);
              } else {
                for (const su of stack) su.sentry = false;
                showHintMessage('Obudzono: ' + u.typeId, 2000);
              }
              refreshD1bHud();
            }
          },
          onClose: () => {
            clearPlayerUnitSelection();
            refreshD1bHud();
          },
        },
        minimapLayers: {
          onToggleCulture: () => toggleCultureRangeOnMap(),
          onToggleReligion: () => toggleReligionRangeOnMap(),
          onToggleTerritory: () => toggleTerritoryBorderOnMap(),
          isCultureActive: () => cultureRangeVisible,
          isReligionActive: () => religionRangeVisible,
          isTerritoryActive: () => territoryBorderVisible,
        },
        minimapWorkerOverlay: {
          onToggleWorkers: () => toggleWorkerOverlayOnMap(),
          isWorkersActive: () => showWorkerOverlay,
        },
        minimapPlaytestFog: minimapPlaytestFogHooks(),
        onMinimapClick: (q, r) => {
          // Klik w minimapę → kamera leci w to miejsce (zoom bez zmian).
          const { x, z } = axialToWorld(q, r, HEX_R);
          const { dist } = camCtrl.getFocusState();
          camCtrl.focusAt(x, z, dist);
        },
        getMinimapData: () => {
          const vis = currentVisible();
          return getMinimapData(
            map,
            cameraGroundTarget(),
            cities.map(c => ({
              q: c.q,
              r: c.r,
              ownerId: c.ownerId,
              ownerColor: civColorCssForOwner(data.civs, c.ownerId, civTypeForOwner),
            })),
            units
              .filter(u => !isUnitInGarnizon(u))
              .map(u => ({
                q: u.q,
                r: u.r,
                ownerId: u.ownerId,
                ownerColor: civColorCssForOwner(data.civs, u.ownerId, civTypeForOwner),
              })),
            {
              visible: vis,
              explored: fogExploredForRender(),
              playerOwnerId: 0,
              fogOn,
            },
          );
        },
        getWarsWithPlayer: collectWarsWithPlayer,
        getEvents: collectTurnEvents,
        getContextPanelMessage: () => buildContextPanelMessage(),
        onEventClick: (id) => {
          if (id.startsWith('diplo-pend-')) {
            openDiplomacyPendingById(id);
            return;
          }
          const prodCityId = cityIdFromProdEmptyEventId(id);
          if (prodCityId) {
            const city = cities.find(c => c.id === prodCityId);
            if (city) openCityPanelForPlayer(city);
            return;
          }
          if (!id.startsWith('revolt-')) return;
          const cityId = cityIdFromRevoltEventId(id) ?? id.slice('revolt-'.length);
          const city = cities.find(c => c.id === cityId);
          if (city) {
            const pos = axialToWorld(city.q, city.r, HEX_R);
            camCtrl.focusAt(pos.x, pos.z, 22);
            openCityPanelForPlayer(city);
          }
        },
        onEventDismiss: (id) => {
          if (!id.startsWith('village-')) return;
          const idx = villageEventLog.findIndex(e => e.id === id);
          if (idx >= 0) {
            villageEventLog.splice(idx, 1);
            refreshD1bHud();
          }
        },
      });
      mountEmpireDetailPanel(() => buildEmpireDetailSnap());
    }

    function updateHud(): void {
      if (d1bHudActive) {
        refreshLiveEmpireRates();
        refreshObjectivePowerCache();
        refreshD1bHud();
        if (isEmpireDetailPanelOpen()) refreshEmpireDetailPanel();
      }
    }

    // --- Konfiguracja pickera badań (przed hubem — getScienceHubSnapshot wymaga hooków) ---
    (window as any).__civ_getResearchedTechs = () => Array.from(player.zbadane);

    configureSciencePicker({
      getResearchState: (_ownerId: number) => {
        const st = getResearchState(player, data.tech, 0, _menuDifficulty);
        return {
          pula:           st.pula,
          targetId:       st.targetId ? techToSlug(st.targetId) : null,
          kosztCelu:      st.kosztCelu,
          postepFraction: st.postepFraction,
          turnsLeft:      st.turnsLeft ?? 0,
        };
      },
      getResearchedTechs: (_ownerId: number) => {
        return Array.from(player.zbadane).map(techToSlug);
      },
      getAvailableTechs: (_ownerId: number) => {
        return availableTechs(data.tech, player.zbadane, researchGateForOwner(0)).map(t =>
          techToSlug((t.Technologia ?? '').trim()),
        );
      },
      onSelectTarget: (techSlug: string) => {
        enqueueOrSetPlayerResearchSlug(techSlug);
      },
      getPlayerEra: (_ownerId: number) => player.era,
      getTempoGry: (_ownerId: number) => player.tempoGry ?? 'standardowa',
      getDifficulty: (_ownerId: number) => _menuDifficulty,
      getPlan: (_ownerId: number) => buildResearchPlanSnapshot(),
    });

    // --- Konfiguracja grafu drzewa technologii (siatka 1E — techTreeView) ---
    // Read-only: te same haki co picker + bramki budynku/ulepszenia (powody blokad).
    configureTechTreeView({
      getResearchState: (_ownerId: number) => {
        const st = getResearchState(player, data.tech, 0, _menuDifficulty);
        return {
          pula:           st.pula,
          targetId:       st.targetId ? techToSlug(st.targetId) : null,
          kosztCelu:      st.kosztCelu,
          postepFraction: st.postepFraction,
          turnsLeft:      st.turnsLeft ?? 0,
        };
      },
      getResearchedTechs: (_ownerId: number) => Array.from(player.zbadane).map(techToSlug),
      getAvailableTechs: (_ownerId: number) =>
        availableTechs(data.tech, player.zbadane, researchGateForOwner(0)).map(t =>
          techToSlug((t.Technologia ?? '').trim()),
        ),
      getNaukaRate: (_ownerId: number) => buildHudState().naukaRate ?? 0,
      getTempoGry: (_ownerId: number) => player.tempoGry ?? 'standardowa',
      getDifficulty: (_ownerId: number) => _menuDifficulty,
      isBuildingGateMet: (ownerId: number, techName: string) => {
        const def = data.tech.find(t => (t.Technologia ?? '').trim() === techName);
        if (!def) return true;
        return buildingGateMet(def, researchGateForOwner(ownerId));
      },
      isImprovementGateMet: (ownerId: number, techName: string) => {
        const def = data.tech.find(t => (t.Technologia ?? '').trim() === techName);
        if (!def) return true;
        return improvementGateMet(def, researchGateForOwner(ownerId));
      },
      onStartResearch: (techSlug: string) => {
        selectPlayerResearchSlug(techSlug);
        refreshTechTreeViewIfOpen();
      },
    });

    // Initial HUD (D1B — moduł hud.ts)
    mountD1bHud();
    refreshObjectivePowerCache();
    updateHud();

    // Initial fog — cała mapa czarna dopóki jednostka/miasto nie odkryje (refreshFog).
    refreshFog();
    initDiplomaticContactSnapshot();

    // --- Konfiguracja panelu miasta ---
    configureCityPanel({
      data,
      difficulty: _menuDifficulty,
      getCities: () => cities,
      getTradeRoutes: () => tradeRoutes,
      getOwnerLabel: (ownerId: number) => ownerDiploLabel(ownerId),
      getTradeTreatyMissingPartners: (cityId: string) => foreignCivsMissingTradeTreatyForCity(cityId),
      getCapitalCityId: (ownerId: number) => capitalCityIdForOwner(ownerId),
      onSetCapital: (cityId: string) => { trySetPlayerCapital(cityId); },
      getCityBuildingFlags: (cityId: string) => ({
        liczbaAktywnychTrasHandlowych: tradeRouteCountByCity.get(cityId) ?? 0,
      }),
      getEpoch: (ownerId: number) => empireEpochForOwner(ownerId),
      getManpowerSnapshot: (cityId: string) => {
        const c = cities.find(x => x.id === cityId);
        if (!c) return null;
        const ep = empireEpochForOwner(c.ownerId);
        const mpMults = civManpowerMultsForOwner(c.ownerId);
        return cityManpowerSnapshot(c, ep, mpMults.regenMult, mpMults.maxMult);
      },
      getOwnerColor: civColorFn,
      getUnlockedTechs: (_ownerId: number) => Array.from(player.zbadane),
      getBuiltBuildingIds: (cityId: string) => cityBuilt.get(cityId) ?? [],
      // audyt #33: panel miasta jest tylko dla gracza (openCityPanelForPlayer) -- ulepszenia
      // WYŁĄCZNIE z terytorium gracza (owner 0), inaczej kopalnia AI odblokowywała Brąz/Żelazo.
      getPlacedImprovements: () => placedImprovementsWithBrazTradeGrant(0, placedImprovementsForOwner(0)),
      getProduction: (cityId: string) => {
        const p = cityProd.get(cityId);
        return p ? { ...p, kolejka: [...p.kolejka] } : null;
      },
      setProduction: (cityId: string, p: CityProduction) => {
        setCityProduction(cityId, p);
      },
      getTreasury: (_ownerId: number) => player.skarbiec,
      onRushBuy: (cityId: string, _item: any, koszt: number) => {
        if (player.skarbiec >= koszt) {
          player.skarbiec -= koszt;
          const rBase = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
          const r = rushProduction(rBase);
          cityProd.set(cityId, r.prod);
          if (r.completed) {
            const rc = cities.find(ct => ct.id === cityId);
            if (rc) {
              const applied = applyProductionCompleted(rc, cityId, r.completed, r.prod);
              if (applied.requeueManpower) {
                player.skarbiec += koszt;
                console.warn('[Rush] Brak Manpower — zwrot zlota, jednostka w kolejce');
              }
              cityProd.set(cityId, applied.prod);
            }
          }
          updateHud();
        }
      },
      onChange: (_cityId: string) => { updateHud(); },
      onAutoManage: (cityId: string) => {
        // Toggle auto-manage for this city (STEP D hook for UI toggle)
        if (autoManageCities.has(cityId)) {
          autoManageCities.delete(cityId);
          console.log(`[AutoManage] Wylaczono dla ${cityId}`);
        } else {
          autoManageCities.add(cityId);
          console.log(`[AutoManage] Wlaczono dla ${cityId}`);
        }
      },
      getPodzialHandlu: (cityId: string) => cities.find(c => c.id === cityId)?.podzialHandlu ?? null,
      getPodzialPracy: (cityId: string) => cities.find(c => c.id === cityId)?.podzialPracy ?? null,
      onPodzialHandluChange: (cityId: string, split) => {
        const c = cities.find(ct => ct.id === cityId);
        if (c && c.ownerId === 0) {
          c.podzialHandlu = { ...split };
          markCityStateDirty(); // D10: podział podatków/handlu → przelicz
          updateHud();
        }
      },
      onPodzialPracyChange: (cityId: string, split) => {
        const c = cities.find(ct => ct.id === cityId);
        if (c && c.ownerId === 0) {
          c.podzialPracy = { procentBudynki: split.procentBudynki };
          markCityStateDirty(); // D10: podział pracy → przelicz
          updateHud();
        }
      },
      onPurchaseUnit: (cityId: string, itemId: string, koszt: number) => {
        purchaseRecruitmentUnit(cityId, itemId, koszt);
      },
      onCancelRecruitment: (cityId: string, itemId: string, koszt: number) => {
        cancelRecruitmentPurchase(cityId, itemId, koszt);
      },
      getCivBonusy: (ownerId: number) => civBonusyForOwnerId(ownerId),
      getCivKey: (ownerId: number) => civKeyForOwnerId(ownerId),
      getOrderState: (cityId: string) => cityOrderState.get(cityId) ?? null,
      getTurn: () => turn,
      getCityHealth: (cityId: string) => {
        const city = cities.find(c => c.id === cityId);
        if (!city) return null;
        const builtIds = cityBuilt.get(cityId) ?? [];
        const tiles = cityWorkedTilesForEconomy(city, map, buildAllTerritoryNodes());
        return computeCityHealthBreakdown(
          city.population, tiles, builtIds, data.societyParams, _menuDifficulty,
          { city, map },
        );
      },
      ...extraCityPanelConfig(),
    });

    configurePreBattle({ getCivBonusy: civBonusyForOwnerId });

    // -----------------------------------------------------------------------
    // Animation state
    //
    // TOKEN_LIFT mirrors the constant in units.ts (0.01 * HEX_R).
    // sync() positions a token at:  topYAt(q,r) + TOKEN_LIFT
    // topYAt() = terrainTopY(hex) = height + yOffset  (no lift included).
    // We use the same formula for every waypoint so the token rests flush
    // on the terrain surface at the start, each intermediate hex, and the
    // final destination -- matching the snap position sync() would produce.
    // -----------------------------------------------------------------------

    /** Matches TOKEN_LIFT in units.ts exactly: 0.01 * HEX_R. */
    const TOKEN_LIFT = 0.01 * HEX_R;

    /** Duration of each per-hex glide segment in seconds. */
    const ANIM_SEG_DUR = 0.14;

    /** A3: zaplanowane marsze — cel bez natychmiastowego ruchu. */
    const plannedMarches = new Map<string, PlannedMarchDest>();
    /** Cel ataku po dotarciu marszem (unitId → enemyUnitId). */
    const marchAttackTargets = new Map<string, string>();
    let marchExecQueue: string[] = [];
    let pendingMarchHint: {
      unitId: string;
      dest: PlannedMarchDest;
      arrived: boolean;
      stopReason?: string;
      stopDetail?: string;
    } | null = null;

    function clearPlannedMarch(unitId?: string): void {
      if (unitId !== undefined) {
        plannedMarches.delete(unitId);
        marchAttackTargets.delete(unitId);
      } else {
        plannedMarches.clear();
        marchAttackTargets.clear();
      }
      if (selectedId === null || unitId === selectedId || unitId === undefined) {
        unitRenderer.clearPathRoute();
      }
    }

    function clearAutoMarch(): void {
      if (selectedId !== null) clearPlannedMarch(selectedId);
    }

    function canOccupyHexForUnit(u: RuntimeUnit, q: number, r: number): boolean {
      return canUnitOccupyCityHex(u.ownerId, q, r, cities);
    }

    function perTurnMoveForUnit(u: RuntimeUnit): number {
      return Math.max(1, normFieldVal(lookupUnitDef(u.typeId)['Ruch'], u.ruch));
    }

    function buildMarchFogContext(dest: PlannedMarchDest): MarchFogContext {
      const vis = currentVisible();
      const attackOnVisible = Boolean(
        dest.attackUnitId && vis.has(keyOf(dest.destQ, dest.destR)),
      );
      return {
        fogActive: fogOn,
        visible: vis,
        attackOnVisibleEnemy: attackOnVisible,
        keyOf,
      };
    }

    function marchPathPlan(
      mover: RuntimeUnit,
      destQ: number,
      destR: number,
      occ: Set<string>,
      perTurn: number,
      budget: number | undefined,
      fog?: MarchFogContext,
      costFn?: (hex: Hex) => number,
    ) {
      const raw = planPathTurns(mover, destQ, destR, map, occ, perTurn, budget, costFn);
      return applyFogToPathPlan(raw, map, perTurn, budget, fog);
    }

    function syncMarchAttackTarget(unitId: string, dest: PlannedMarchDest): void {
      if (dest.attackUnitId) {
        marchAttackTargets.set(unitId, dest.attackUnitId);
      } else {
        marchAttackTargets.delete(unitId);
      }
    }

    function tryLaunchMarchAttack(atkUnit: RuntimeUnit, attackTargetId: string): boolean {
      const def = units.find(x => x.id === attackTargetId);
      if (!def) return false;
      if (!currentVisible().has(keyOf(def.q, def.r))) return false;
      if (hexDistance(atkUnit.q, atkUnit.r, def.q, def.r) > 1) return false;
      clearPlannedMarch(atkUnit.id);
      openPlayerMapUnitAttack(atkUnit, def);
      return true;
    }

    function refreshPlannedMarchPreview(unitId?: string): void {
      const uid = unitId ?? selectedId;
      if (uid === null) {
        unitRenderer.clearPathRoute();
        return;
      }
      const u = units.find(x => x.id === uid);
      const dest = plannedMarches.get(uid);
      if (!u || !dest) {
        if (uid === selectedId) unitRenderer.clearPathRoute();
        return;
      }
      const stack = playerStackAt(u);
      const occ = occupiedForMove(u.ownerId, ...stack.map(s => s.id));
      const mover = unitWithStackRuch(u, stack);
      const plan = marchPathPlan(
        mover,
        dest.destQ,
        dest.destR,
        occ,
        perTurnMoveForUnit(u),
        undefined,
        buildMarchFogContext(dest),
        moveCostFnForUnit(u),
      );
      if (plan.fullPath.length === 0) {
        unitRenderer.clearPathRoute();
        return;
      }
      unitRenderer.setPathRoute(
        [{ q: u.q, r: u.r }, ...plan.fullPath],
        { turnStops: plan.turnStops },
      );
    }

    function refreshHoverPathPreview(uSel: RuntimeUnit, hitQ: number, hitR: number): void {
      const stack = playerStackAt(uSel);
      const occ = occupiedForMove(uSel.ownerId, ...stack.map(s => s.id));
      const mover = unitWithStackRuch(uSel, stack);
      const hoverCostFn = moveCostFnForUnit(uSel);
      const hoverEnemy = units.find(
        x => x.q === hitQ && x.r === hitR && x.ownerId !== uSel.ownerId,
      );
      const hoverVis = currentVisible().has(keyOf(hitQ, hitR));
      const hoverDest: PlannedMarchDest = hoverEnemy && hoverVis
        ? { destQ: hitQ, destR: hitR, attackUnitId: hoverEnemy.id }
        : { destQ: hitQ, destR: hitR };
      const plan = marchPathPlan(
        mover,
        hitQ,
        hitR,
        occ,
        perTurnMoveForUnit(uSel),
        undefined,
        buildMarchFogContext(hoverDest),
        hoverCostFn,
      );
      if (plan.fullPath.length > 0) {
        unitRenderer.setPathRoute(
          [{ q: uSel.q, r: uSel.r }, ...plan.fullPath],
          { turnStops: plan.turnStops },
        );
      } else {
        unitRenderer.clearPathRoute();
      }
    }

    function planMarchTo(destQ: number, destR: number, attackUnitId?: string): boolean {
      if (selectedId === null || isAnimating) return false;
      if (isSiegeMapPanelOpen()) {
        showHintMessage(
          'Oblężenie — najpierw OBLEGAJ, Szturm lub Odwrót w panelu u dołu ekranu.',
          3500,
        );
        return false;
      }
      if (isCityUnitPickOpen()) return false;
      const u = units.find(x => x.id === selectedId);
      if (!u || u.ownerId !== 0) return false;
      if (u.oblegaCityId) {
        const sc = cities.find(c => c.id === u.oblegaCityId);
        showHintMessage(
          (sc?.name ?? 'Miasto') + ': jednostka oblega — Odwrót lub Szturm (klik miasto).',
          4000,
        );
        return false;
      }

      const stack = playerStackAt(u);
      const occ = occupiedForMove(u.ownerId, ...stack.map(s => s.id));
      const mover = unitWithStackRuch(u, stack);

      const attackTarget = attackUnitId
        ? units.find(x => x.id === attackUnitId)
        : units.find(
          x => x.q === destQ && x.r === destR && x.ownerId !== 0 && x.ownerId !== u.ownerId,
        );
      if (attackTarget && !currentVisible().has(keyOf(attackTarget.q, attackTarget.r))) {
        showHintMessage('Cel niewidoczny (mgła).', 3500);
        return false;
      }

      const marchDest: PlannedMarchDest = attackTarget
        ? { destQ, destR, attackUnitId: attackTarget.id }
        : { destQ, destR };
      const fogCtx = buildMarchFogContext(marchDest);
      const plan = marchPathPlan(
        mover,
        destQ,
        destR,
        occ,
        perTurnMoveForUnit(u),
        stackRuchLeft(stack),
        fogCtx,
        moveCostFnForUnit(u),
      );
      if (plan.fullPath.length === 0) {
        showHintMessage('Marsz przerwany: brak trasy do celu', 3500);
        return false;
      }
      if (!attackTarget && !canOccupyHexForUnit(u, destQ, destR)) {
        showHintMessage(
          'Obce miasto — stój na sąsiednim heksie i kliknij miasto, aby atakować.',
          3800,
        );
        return false;
      }

      plannedMarches.set(u.id, marchDest);
      syncMarchAttackTarget(u.id, marchDest);
      hoverKey = null;
      refreshPlannedMarchPreview(u.id);
      refreshD1bHud();
      if (stackRuchLeft(stack) > 0) {
        executeMarchSegmentForUnit(u.id);
      }
      return true;
    }

    function startAnimatedMove(
      u: RuntimeUnit,
      movePath: { q: number; r: number }[],
      moveDestQ: number,
      moveDestR: number,
      cost: number,
    ): void {
      const stack = playerStackAt(u);
      const startPl = unitRenderer.getTokenPlacement(u.q, u.r);
      const startWP: Waypoint = {
        x: startPl.x,
        y: startPl.y,
        z: startPl.z,
      };
      const stepWPs: Waypoint[] = movePath.map((hex) => {
        const pl = unitRenderer.getTokenPlacement(hex.q, hex.r);
        return { x: pl.x, y: pl.y, z: pl.z };
      });
      anim = {
        id: u.id,
        movingStackIds: stack.map(s => s.id),
        destQ: moveDestQ,
        destR: moveDestR,
        fromQ: u.q,
        fromR: u.r,
        pathLen: movePath.length,
        cost,
        points: [startWP, ...stepWPs],
        seg: 0,
        t: 0,
      };
      isAnimating = true;
      forceVisibleUnitId = u.id;
      unitRenderer.setSelectionHex(moveDestQ, moveDestR, u.ownerId);
      syncUnitsRender();
      unitRenderer.clearPathRoute();
      hoverKey = null;
      unitRenderer.clearHighlight();
      reachable = new Set<string>();
    }

    function finishMarchSegmentHints(
      unitId: string,
      arrived: boolean,
      stopReason?: string,
      stopDetail?: string,
    ): void {
      if (arrived) {
        plannedMarches.delete(unitId);
        showHintMessage('Dotarło do celu', 2800);
        return;
      }
      if (stopReason) {
        const prefix = stopReason === 'fog' ? 'Marsz wstrzymany: ' : 'Marsz przerwany: ';
        showHintMessage(prefix + (stopDetail ?? stopReason), 3500);
        return;
      }
      if (selectedId === unitId) refreshPlannedMarchPreview(unitId);
    }

    function executeMarchSegmentForUnit(unitId: string): boolean {
      if (isAnimating) return false;
      const u = units.find(x => x.id === unitId);
      const dest = plannedMarches.get(unitId);
      if (!u || !dest || u.ownerId !== 0) return false;

      const stack = playerStackAt(u);
      const stackRuch = stackRuchLeft(stack);
      if (stackRuch <= 0) {
        showHintMessage('Marsz przerwany: brak punktów ruchu', 3000);
        return false;
      }

      const occ = occupiedForMove(u.ownerId, ...stack.map(s => s.id));
      const mover = unitWithStackRuch(u, stack);
      const fogCtx = buildMarchFogContext(dest);
      const result = executeMarchStep(
        mover,
        dest,
        map,
        occ,
        stackRuch,
        (q, r) => canOccupyHexForUnit(u, q, r) || Boolean(
          dest.attackUnitId && q === dest.destQ && r === dest.destR,
        ),
        perTurnMoveForUnit(u),
        fogCtx,
        moveCostFnForUnit(u),
      );

      if (!result.ok || result.movePath.length === 0) {
        showHintMessage('Marsz przerwany: ' + (result.stopDetail ?? 'brak ruchu'), 3500);
        return false;
      }

      const last = result.movePath[result.movePath.length - 1]!;
      pendingMarchHint = {
        unitId,
        dest,
        arrived: result.arrived,
        stopReason: result.stopReason,
        stopDetail: result.stopDetail,
      };

      if (selectedId !== unitId) selectPlayerUnit(unitId, true);
      startAnimatedMove(u, result.movePath, last.q, last.r, result.cost);
      return true;
    }

    function processMarchQueue(): void {
      while (marchExecQueue.length > 0 && !isAnimating) {
        const id = marchExecQueue.shift()!;
        if (!plannedMarches.has(id)) continue;
        if (executeMarchSegmentForUnit(id)) return;
      }
    }

    function enqueueMarchSegments(unitIds: string[]): void {
      for (const id of unitIds) {
        if (!marchExecQueue.includes(id)) marchExecQueue.push(id);
      }
      processMarchQueue();
    }

    function executePlannedMarchesEndTurn(): void {
      const ids = units
        .filter(u => u.ownerId === 0 && plannedMarches.has(u.id)
          && stackRuchLeft(playerStackAt(u)) > 0)
        .map(u => u.id);
      enqueueMarchSegments(ids);
    }

    function continuePlannedMarchForSelected(): void {
      if (selectedId === null) return;
      executeMarchSegmentForUnit(selectedId);
    }

    function stopPlannedMarchForSelected(): void {
      if (selectedId === null) return;
      if (plannedMarches.delete(selectedId)) {
        unitRenderer.clearPathRoute();
        showHintMessage('Zatrzymano', 2200);
        refreshD1bHud();
      }
    }

    function syncGarnizonForCity(city: City): void {
      city.garnizon = garnizonCountForCity(city);
    }

    function finishUnitEnterCityHex(unit: RuntimeUnit, city: City): void {
      const n = lawGarrisonCountForCity(city);
      showHintMessage(
        unit.typeId + ' w ' + city.name
        + (n > 0 ? ' — +' + n + ' jedn. daje bonus Prawo' : '')
        + ' · Ufort. = ukryty garnizon (obrona)',
        3600,
      );
      refreshD1bHud();
    }

    /**
     * WIOSKI neutralne (goodie huts): pierwsze wejście jednostki GRACZA na
     * heks z wioską -> nagroda losowa (pickVillageReward), potem wioska znika.
     * `hex.wioska.istnieje = false` jest ustawiane NATYCHMIAST (przed
     * losowaniem/efektami) -- to jest samo w sobie zabezpieczeniem przed
     * podwójnym przyznaniem: każde kolejne wejście (w tej samej turze albo
     * później) widzi już `istnieje === false` i funkcja wraca natychmiast.
     * Wołane raz na ZAKOŃCZONE przemieszczenie (nie per jednostka w stosie).
     */
    function checkVillageRewardAt(q: number, r: number): void {
      const hex = map.hexes[keyOf(q, r)];
      if (!hex?.wioska?.istnieje) return;
      hex.wioska.istnieje = false;
      hex.wioska.ludnosc = 0;
      villageHexKeyCache?.delete(keyOf(q, r)); // Audyt #57: usuń z cache syncVillageMeshes
      // Audyt #13: zapamiętaj zlupienie poza hexem — inaczej regeneracja mapy z seeda
      // przy save/load wskrzesza wioskę (hex.wioska.istnieje wraca na true).
      lootedVillageHexKeys.add(keyOf(q, r));

      // D: zbieramy JEDEN czytelny opis nagrody + ikonę + kind zdarzenia (zamiast
      // kilku nadpisujących się toastów). Na końcu: jeden toast + trwały wpis w WYDARZENIA.
      let summary = '';
      let icon = '\u{1F381}'; // 🎁
      let evKind: SidePanelEvent['kind'] = 'info';

      const grantGold = (label: string): void => {
        const amount = villageGoldAmount(player.era);
        player.skarbiec += amount;
        summary = 'Chatka (' + label + '): +' + amount + ' złota';
        icon = '\u{1F4B0}'; // 💰
        evKind = 'city';
      };

      const kind = pickVillageReward(Math.random());

      if (kind === 'zloto') {
        grantGold('skarb');
      } else if (kind === 'tech') {
        if (player.badana === null) {
          grantGold('brak aktywnych badań, w zamian');
        } else {
          const amount = villageTechProgress(player.era);
          player.nauka += amount;
          summary = 'Chatka: +' + amount + ' postępu badań (' + player.badana + ')';
          icon = '\u{1F52C}'; // 🔬
          evKind = 'science';
          const step = researchStep(player, data.tech, researchGateForOwner(0), _menuDifficulty);
          for (const done of step.completed) {
            summary += ' \xb7 zbadano ' + done.id;
            if (done.awansEpoki) summary += ' (epoka ' + done.era + ')';
          }
          if (step.completed.some(d => d.awansEpoki)) {
            overlayDepositEra = player.era;
            rebuildResourceOverlays();
            setEra(player.era);
          }
        }
      } else {
        const typeId = villageUnitForEra(player.era);
        const dest = typeId
          ? findAdjacentEmptyHexes(units, q, r, isHexPassableForUnit)[0]
          : undefined;
        if (!typeId || !dest) {
          grantGold('brak miejsca/jednostki, w zamian');
        } else {
          const def = lookupUnitDef(typeId);
          const ruch = normFieldVal(def['Ruch'], 2);
          const role = String(def['Rola'] ?? def['Rola (linia)'] ?? '');
          const isSuper = def['Super-jednostka'] === 'TAK';
          const newUnitId = 'wioska_' + turn + '_' + q + '_' + r + '_' + Math.random().toString(36).slice(2);
          units.push({
            id: newUnitId,
            ownerId: 0,
            typeId,
            category: categoryOf(typeId, role, isSuper, def['Typ']),
            q: dest.q,
            r: dest.r,
            ruch,
            ruchLeft: 0,
          });
          summary = 'Chatka: dołączyła jednostka — ' + typeId;
          icon = '⚔️'; // ⚔️
          evKind = 'unit';
          syncUnitsRender();
        }
      }

      if (summary) {
        // Jeden trwały toast (5 s) + wpis w panelu WYDARZENIA (nie ginie jak toast).
        showHintMessage(icon + ' ' + summary, 5000);
        villageEventLog.unshift({
          id: 'village-' + turn + '-' + q + '-' + r,
          icon,
          title: 'Odkryto chatkę',
          subtitle: summary,
          kind: evKind,
        });
        if (villageEventLog.length > 6) villageEventLog.length = 6;
        refreshD1bHud();
      }

      // Wioska znikła -- odśwież meshe (ta sama ścieżka co syncVillageMeshes w refreshFog).
      refreshFog();
    }

    /** Animowany ruch (merge / taktyka — natychmiast, bez planowania A3). */
    function beginMoveSelectedUnitTo(destQ: number, destR: number): boolean {
      if (selectedId === null || isAnimating) return false;
      if (isSiegeMapPanelOpen()) {
        showHintMessage(
          'Oblężenie — najpierw OBLEGAJ, Szturm lub Odwrót w panelu u dołu ekranu.',
          3500,
        );
        return false;
      }
      if (isCityUnitPickOpen()) return false;
      const u = units.find(x => x.id === selectedId);
      if (!u || u.ownerId !== 0) return false;
      if (u.oblegaCityId) {
        const sc = cities.find(c => c.id === u.oblegaCityId);
        showHintMessage(
          (sc?.name ?? 'Miasto') + ': jednostka oblega — Odwrót lub Szturm (klik miasto).',
          4000,
        );
        return false;
      }

      const stack = playerStackAt(u);
      const stackRuch = stackRuchLeft(stack);
      if (stackRuch <= 0) return false;

      const exceptIds = stack.map(s => s.id);
      const occ = occupiedForMove(u.ownerId, ...exceptIds);
      const mover = unitWithStackRuch(u, stack);
      const moveCostFn = moveCostFnForUnit(u);
      const path = computePath(mover, map, destQ, destR, occ, moveCostFn);
      if (path.length === 0) return false;
      if (!canUnitOccupyCityHex(u.ownerId, destQ, destR, cities)) {
        showHintMessage(
          'Obce miasto — stój na sąsiednim heksie i kliknij miasto, aby atakować.',
          3800,
        );
        return false;
      }

      let movePath = path;
      let moveDestQ = destQ;
      let moveDestR = destR;
      let cost = pathCost(path, map, moveCostFn);
      if (cost > stackRuch) {
        let truncated: typeof path = [];
        for (let i = 0; i < path.length; i++) {
          const sub = path.slice(0, i + 1);
          const c = pathCost(sub, map, moveCostFn);
          if (c > stackRuch) break;
          truncated = sub;
        }
        if (truncated.length === 0) return false;
        movePath = truncated;
        const last = truncated[truncated.length - 1]!;
        moveDestQ = last.q;
        moveDestR = last.r;
        cost = pathCost(truncated, map, moveCostFn);
      }

      startAnimatedMove(u, movePath, moveDestQ, moveDestR, cost);
      return true;
    }

    // Delta-time source: track the previous frame timestamp in seconds.
    let prevTime = performance.now() / 1000;
    // Średnia FPS z okna ~1 s (A4 — stabilniejszy odczyt niż chwilowe 1/dt).
    let fps1s = 60;
    let fpsAccumFrames = 0;
    let fpsAccumTime = 0;

    // TEMAT #23 — woda pozycyjna (ambience): akumulator do próbkowania udziału
    // wody w kadrze kamery co ~0.5 s (nie co klatkę, patrz computeWaterView()
    // i renderLoop() niżej). ambLastWaterVariant pamięta ostatni wybrany
    // wariant (0=rzeka/1=morze), żeby klatka bez ŻADNEJ wody w kadrze (frac=0,
    // i tak cisza) nie musiała zgadywać wariantu od nowa.
    let ambWaterSampleAccum = 0;
    let ambLastWaterVariant: 0 | 1 = 1;

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'F9') {
        e.preventDefault();
        togglePerfDebugOverlay();
        return;
      }
      if (e.key === 'F10') {
        e.preventDefault();
        toggleDiagPanel();
        return;
      }
      if (e.key === 'D' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        void copyDiagReport({
          turn,
          seed: _gameSeed,
          cities: cities.length,
          units: units.length,
          isAnimating,
          isMainMenuOpen: isMainMenuOpen(),
          isCityPanelOpen: isCityPanelOpen(),
        }).then((ok) => {
          showHintMessage(ok ? 'Raport diagnostyczny skopiowany (Ctrl+Shift+D).' : 'Nie udało się skopiować raportu.', 2500);
        });
      }
    });
    void CIV_PERF_DEBUG_MARKER;
    (window as unknown as { __civPublishMarkers?: typeof CIV_PUBLISH_MARKERS }).__civPublishMarkers = CIV_PUBLISH_MARKERS;
    // TEMAT #15 — debug weryfikacji wizualnej embarkacji: przenosi pierwszą
    // jednostkę gracza na najbliższy heks wody jako zaokrętowaną i centruje
    // kamerę. Wywołanie z konsoli/Playwright: window.__civEmbarkDebug().
    (window as unknown as { __civEmbarkDebug?: () => string }).__civEmbarkDebug = () => {
      let u = units.find(x => x.ownerId === 0 && x.inGarnizon !== true)
        ?? units.find(x => x.ownerId === 0);
      if (!u) {
        // Gra startuje bez jednostek (A-START-01) — stwórz jednostkę debugową.
        u = {
          id: 'debug_embark',
          ownerId: 0,
          typeId: 'Wojownik',
          category: 'miecznik',
          q: 0,
          r: 0,
          ruch: 2,
          ruchLeft: 2,
        };
        units.push(u);
      }
      u.inGarnizon = false;
      // Woda najbliżej AKTUALNEGO celu kamery — jednostka pojawia się w kadrze
      // bez ruszania kamerą (kamera bywa nadpisywana przez tryb playtestu).
      const st = camCtrl.getFocusState();
      let best: { q: number; r: number } | null = null;
      let bestD = Infinity;
      for (const key of Object.keys(map.hexes)) {
        const hx = map.hexes[key];
        if (!hx || !isWaterTerrain(hx.terenBazowy)) continue;
        const { x, z } = axialToWorld(hx.coords.q, hx.coords.r, HEX_R);
        const d = (x - st.x) * (x - st.x) + (z - st.z) * (z - st.z);
        if (d < bestD) { bestD = d; best = { q: hx.coords.q, r: hx.coords.r }; }
      }
      if (!best) return 'brak wody na mapie';
      u.q = best.q;
      u.r = best.r;
      u.embarked = true;
      syncUnitsRender();
      refreshFog();
      const pl = unitRenderer.getTokenPlacement(best.q, best.r);
      camCtrl.focusAt(pl.x, pl.z, 8);
      return `${u.typeId} zaokrętowana @ (${best.q},${best.r})`;
    };

    // -----------------------------------------------------------------------
    // Click vs Drag detection
    // -----------------------------------------------------------------------

    let mouseDownX = 0;
    let mouseDownY = 0;
    const DRAG_THRESHOLD = 6; // pixels

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
    });

    canvas.addEventListener('contextmenu', (e: MouseEvent) => {
      e.preventDefault();
      if (galleryOn || isAnimating || isPostBattleSummaryOpen()) return;
      if (isPointOverCityPanelUi(e.clientX, e.clientY)) return;
      // PPM w trybie budowy = anuluj wybór ulepszenia/miasta (jak Escape / lewy klik w pustkę).
      if (buildModeOpen) {
        exitBuildMode();
        return;
      }
      dismissPlayerUnitSelectionIfAny();
      // PPM na mapie zamyka panel kontekstowy heksa (D17=A — zgłoszenie: panel "utknięty").
      hideHexContextPanel();
    });

    // -----------------------------------------------------------------------
    // Hover route preview
    // Shows a path preview arrow when the cursor enters a reachable hex.
    // Recompute is skipped when the cursor stays within the same hex
    // (hoverKey guard) -- one path computation per hex transition only.
    // -----------------------------------------------------------------------

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      if (galleryOn) return;

      // Tryb budowy — ghost miasta / ulepszenia + chip przy kursorze
      if (buildModeOpen && (foundCityMode || activeImprovementKey)) {
        handleBuildModeHover(e);
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
        return;
      }

      const hitEarly = pickHexAt(e.clientX, e.clientY);

      // Kursory jednostek tylko na mapie świata (nie w panelu miasta / mockupie okolicy).
      if (!isWorldMapUnitMode()) {
        applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      // While animating or nothing selected: clear preview + domyślny kursor.
      if (isAnimating || !selectedId) {
        applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      const uSel = units.find(x => x.id === selectedId);
      if (!uSel || uSel.ownerId !== 0) {
        applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      if (!hitEarly) {
        applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      // Kursor zależy tylko od heksa pod myszą — pomijamy pełny recompute
      // (w tym kosztowne currentVisible()) dopóki mysz nie zmieni heksa (#30).
      const k = keyOf(hitEarly.q, hitEarly.r);
      if (k === hoverKey) return;

      applyMapCanvasCursor(resolveMapUnitCursor({
        selected: uSel,
        hoverQ: hitEarly.q,
        hoverR: hitEarly.r,
        reachable,
        visibleHexes: currentVisible(),
        units,
        cities,
        hexDistance,
        keyOf,
      }));

      hoverKey = k;
      lastBHex = { q: hitEarly.q, r: hitEarly.r };

      if (plannedMarches.has(uSel.id)) {
        refreshPlannedMarchPreview(uSel.id);
        return;
      }

      refreshHoverPathPreview(uSel, hitEarly.q, hitEarly.r);
    });

    canvas.addEventListener('mouseleave', () => {
      applyMapCanvasCursor(CURSOR_MAP_DEFAULT);
    });

    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      if (e.button !== 0) {
        if (e.button === 2) {
          if (buildModeOpen) { exitBuildMode(); return; }
          dismissPlayerUnitSelectionIfAny();
        }
        return;
      }

      const dx = e.clientX - mouseDownX;
      const dy = e.clientY - mouseDownY;
      const moveDist = Math.sqrt(dx * dx + dy * dy);
      const placementClick = foundCityMode || (buildModeOpen && activeImprovementKey);
      if (moveDist >= DRAG_THRESHOLD && !placementClick) return; // was a drag -- skip click logic

      // Gallery mode: disable all unit interaction.
      if (galleryOn) return;

      // Lock all unit interaction while animation is running.
      // Camera pan/zoom/WASD is NOT blocked (handled by CameraController
      // which listens on its own events independent of this handler).
      if (isAnimating) return;

      if (isPostBattleSummaryOpen()) return;

      if (isPointOverCityPanelUi(e.clientX, e.clientY)) return;
      // Osierocony modal (np. po zamknięciu panelu miasta) — nie blokuj mapy.
      if (isCityUnitPickOpen()) hideCityUnitPick();

      // Treat as a click at (e.clientX, e.clientY)
      const hit = pickHexAt(e.clientX, e.clientY);
      if (!hit) {
        if (foundCityMode) {
          showHintMessage('Kliknij w heks lądu (podświetlony obszar startu)', 2500);
          return;
        }
        if (!isCityPanelOpen()) {
          dismissMapOverlayModes();
          clearPlayerUnitSelection();
          refreshD1bHud();
        }
        return;
      }

      if (isSiegeMapPanelOpen()) {
        const clickedCity = cities.find(c => c.q === hit.q && c.r === hit.r);
        if (clickedCity?.oblegane) {
          const besieger = units.find(
            u => u.ownerId !== clickedCity.ownerId &&
              hexDistance(u.q, u.r, clickedCity.q, clickedCity.r) === 1,
          );
          if (besieger) {
            syncSiegePanelMeta(clickedCity);
            showSiegeMapPanel(
              classifyCityAttack(besieger, clickedCity, units),
              siegePanelActions,
              siegeTurnByCity.get(clickedCity.id) ?? 1,
            );
          }
        } else {
          showHintMessage(
            'Oblężenie — wybierz OBLEGAJ, Szturm lub Odwrót w panelu.',
            2800,
          );
        }
        return;
      }

      // Record the clicked hex so B (found city) can use it.
      lastBHex = { q: hit.q, r: hit.r };

      // Panel miasta (Civ V): klik heksu w okolicy = przypisz / zabierz 👤
      if (isCityPanelOpen()) {
        const panelCityId = getOpenCityPanelCityId();
        const panelCity = panelCityId ? cities.find(c => c.id === panelCityId) : undefined;
        if (panelCity && panelCity.ownerId === 0) {
          const rad = cityRangeForPopulation(panelCity.population);
          const d = hexDistance(panelCity.q, panelCity.r, hit.q, hit.r);
          if (d > 0 && d <= rad && map.hexes[keyOf(hit.q, hit.r)]) {
            toggleOkolicaTileOnMap(panelCity.id, hit.q, hit.r);
            return;
          }
        }
      }

      // Panel miasta otwarty — klik w teren poza przypisaniem 👤 → powrót na mapę świata.
      if (isCityPanelOpen()) {
        hideCityPanelFull();
        clearPlayerUnitSelection();
        refreshD1bHud();
        return;
      }

      // Załóż miasto — PRZED dismissMapOverlayModes (foundCityMode wystarczy)
      if (foundCityMode) {
        handleFoundCityMapClick(hit.q, hit.r);
        return;
      }
      if (buildModeOpen && activeImprovementKey && buildApi?.handleHexClick) {
        const req = buildApi.handleHexClick(hit.q, hit.r);
        if (req) return;
        const nodes = buildAllTerritoryNodes();
        if (!isPlayerTerritoryHex(hit.q, hit.r, playerCityNodes(), nodes, 0)) {
          showBuildTerritoryBlockedHint(hit.q, hit.r);
        } else if (!buildApi.canBuild(activeImprovementKey, hit.q, hit.r)) {
          showHintMessage('Nie można tu zbudować (teren / złoże)', 2500);
        } else {
          showHintMessage('Wymaga technologii', 2500);
        }
        return;
      }

      // Klik w mapę świata — zamknij listy toolbaru i tryb budowy.
      dismissMapOverlayModes();

      // Tryb okolicy na mapie 3D (legacy — po „Mapa” w starym drawerze)
      if (okolicaMapEditCityId) {
        const okCity = cities.find(c => c.id === okolicaMapEditCityId);
        if (okCity && okCity.ownerId === 0) {
          const rad = cityRangeForPopulation(okCity.population);
          const d = hexDistance(okCity.q, okCity.r, hit.q, hit.r);
          if (d > 0 && d <= rad && map.hexes[keyOf(hit.q, hit.r)]) {
            toggleOkolicaTileOnMap(okCity.id, hit.q, hit.r);
            return;
          }
        }
      }

      if (buildModeOpen) {
        if (isAwaitingFirstPlayerCity() && !foundCityMode) {
          foundCityMode = true;
          activeImprovementKey = null;
          refreshBuildHighlight();
          refreshD1bHud();
          const fc = canFoundPlayerCityAt(hit.q, hit.r);
          if (fc.ok) tryFoundPlayerCityAt(hit.q, hit.r);
          else showHintMessage('Nie można założyć: ' + fc.reason, 2500);
        } else {
          showHintMessage('Wybierz «Załóż miasto» lub ulepszenie w panelu 🔨', 2500);
        }
        return;
      }

      // City click: panel tylko dla miast gracza; wrogie = podpowiedź (nie „twoje miasto”).
      const clickedCity = cities.find(c => c.q === hit.q && c.r === hit.r);
      if (clickedCity) {
        const sel = selectedId !== null ? units.find(u => u.id === selectedId) : null;
        const action = resolveEnemyCityClick({
          city: clickedCity,
          selectedUnit: sel ?? null,
          units,
          playerOwnerId: 0,
        });
        switch (action.kind) {
          case 'siege_panel':
            syncSiegePanelMeta(action.ctx.city);
            showSiegeMapPanel(
              action.ctx,
              siegePanelActions,
              siegeTurnByCity.get(action.ctx.city.id) ?? 1,
            );
            return;
          case 'attack_choice':
            hideCityAttackChoice();
            showCityAttackChoice(action.ctx, {
              onSiege: () => startMapSiege(action.ctx),
              onStorm: () => launchSiegeStormFromMap(action.ctx),
              onCancel: () => {},
            });
            return;
          case 'field_battle':
            launchFieldBattleFromMap(action, mapFieldBattleDeps);
            return;
          case 'capture_empty':
            captureCityWithoutBattle(
              action.ctx.city,
              action.attacker,
              collectAtkRosterNearCity(action.ctx.city, action.attacker, units),
            );
            return;
          case 'hint_no_adjacent':
            showHintMessage(
              action.cityName + ' — miasto wrogie. Ustaw jednostkę na sąsiednim heksie i kliknij miasto.',
              4500,
            );
            clearPlayerUnitSelection();
            refreshD1bHud();
            return;
          case 'hint_civilian':
            showHintMessage(
              action.cityName + ' — jednostka cywilna (zwiadowca/osadnik/robotnik) nie może zdobywać miast. Użyj jednostki bojowej.',
              4500,
            );
            return;
          case 'hint_pick_attacker':
            showHintMessage(
              action.cityName + ' — kilka jednostek obok. Zaznacz którą atakujesz, potem kliknij miasto.',
              4500,
            );
            clearPlayerUnitSelection();
            refreshD1bHud();
            return;
          case 'not_enemy':
            break;
        }
        if (sel && sel.ownerId === 0 && stackCanMove(sel)
            && reachable.has(keyOf(clickedCity.q, clickedCity.r))) {
          if (beginMoveSelectedUnitTo(clickedCity.q, clickedCity.r)) return;
        }
        const stackOnCity = visibleStackOnHex(units, hit.q, hit.r, 0);
        if (stackOnCity.length > 0) {
          const rep = unitAtRepresentative(hit.q, hit.r, units, unitAttackScore) ?? stackOnCity[0]!;
          showCityUnitPick({
            cityName: clickedCity.name,
            unitLabel: rep.typeId,
            stackCount: stackOnCity.length,
            onCity: () => openCityPanelForPlayer(clickedCity),
            onUnit: () => selectPlayerUnit(rep.id),
          });
          return;
        }
        openCityPanelForPlayer(clickedCity);
        return;
      }

      const cu = unitAtRepresentative(hit.q, hit.r, units, unitAttackScore);

      if (cu && cu.ownerId === 0) {
        const sel = selectedId !== null ? units.find(x => x.id === selectedId) : null;
        const hitKey = keyOf(hit.q, hit.r);
        if (sel && sel.id !== cu.id && sel.q === cu.q && sel.r === cu.r) {
          selectPlayerUnit(cu.id);
        } else if (sel && sel.id !== cu.id) {
          planMarchTo(hit.q, hit.r);
        } else {
          selectPlayerUnit(cu.id);
        }
      } else if (selectedId !== null && cu !== null && cu.ownerId !== 0) {
        // MAP PLAYER ATTACK: jednostka → jednostka (sąsiad) → preBattle C-01
        const atkUnit = units.find(x => x.id === selectedId);
        if (atkUnit && atkUnit.ownerId === 0 && stackCanMove(atkUnit) &&
            hexDistance(atkUnit.q, atkUnit.r, cu.q, cu.r) <= 1) {
          openPlayerMapUnitAttack(atkUnit, cu);
        } else if (atkUnit && atkUnit.ownerId === 0) {
          if (!stackCanMove(atkUnit)) {
            showHintMessage('Brak ruchu — zakończ turę lub wybierz inną jednostkę.', 3500);
          } else if (!currentVisible().has(keyOf(cu.q, cu.r))) {
            showHintMessage('Cel niewidoczny (mgła).', 3500);
          } else if (!planMarchTo(cu.q, cu.r, cu.id)) {
            showHintMessage('Brak trasy do wroga — cel zablokowany.', 3500);
          }
        } else {
          clearPlayerUnitSelection();
          refreshD1bHud();
        }
      } else if (selectedId !== null) {
        const sel = units.find(x => x.id === selectedId);
        if (sel && sel.ownerId === 0) {
          planMarchTo(hit.q, hit.r);
        }
      } else if (cu !== null && cu.ownerId !== 0) {
        showHintMessage(
          'Zaznacz swoją jednostkę obok wroga, potem kliknij wroga — pre-bitwa.',
          4500,
        );
        clearPlayerUnitSelection();
        refreshD1bHud();
      } else {
        clearPlayerUnitSelection();
        refreshD1bHud();
      }
    });

    // -----------------------------------------------------------------------
    // Unit Gallery
    // Toggle with 'G' key: displays one token per unit type in a flat grid,
    // with a floating HTML label above each token.
    // Camera pan/zoom/WASD continue to work in gallery mode.
    // Click-to-select/move is disabled while gallery is open.
    // -----------------------------------------------------------------------

    /** RuntimeUnit instances used only in gallery mode (never added to `units`). */
    let galleryUnits: RuntimeUnit[] = [];

    /** World-space positions for each gallery token (for label projection). */
    interface GalleryPos { x: number; y: number; z: number; }
    let galleryPositions: GalleryPos[] = [];

    /** HTML label <div> elements floating above each gallery token. */
    let galleryLabels: HTMLDivElement[] = [];

    /** Title overlay shown at top-center while gallery is open. */
    let galleryTitle: HTMLDivElement | null = null;

    /**
     * Y lift above each token base for the floating name label.
     * Approximates token height (0.45*HEX_R) plus a small gap.
     */
    const GALLERY_LABEL_LIFT = 0.8 * HEX_R;

    /** Grid spacing between adjacent tokens (world units). */
    const GALLERY_SPACING = 1.6 * HEX_R;

    /** Enter gallery mode: build tokens, labels, title overlay. */
    function enterGallery(): void {
      clearPlayerUnitSelection();

      // Build gallery RuntimeUnit list -- one per unit type.
      const types = listUnitTypes(data);
      const n = types.length;

      // Grid layout: ceil(sqrt(n)) columns, centered on map center.
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);

      galleryUnits = types.map((t, i): RuntimeUnit => ({
        id: 'gal' + i,
        ownerId: 0,
        typeId: t.typeId,
        q: 0,
        r: 0,
        ruch: 2,
        ruchLeft: 2,
        category: t.category,
      }));

      // Compute world-space grid positions centered on `center`.
      // Each row is independently centered along X (last row may have fewer items).
      galleryPositions = types.map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rowStart = row * cols;
        const rowCount = Math.min(cols, n - rowStart);
        const rowW = (rowCount - 1) * GALLERY_SPACING;
        const gridH = (rows - 1) * GALLERY_SPACING;
        const gx = center.x - rowW / 2 + col * GALLERY_SPACING;
        const gz = center.z - gridH / 2 + row * GALLERY_SPACING;
        // Each gallery slot floats over a real map tile; rest the token on
        // that tile's TRUE top (height + yOffset) so units never sink into
        // elevated terrain (Wzgorza/Gory). Falls back to the flat Rownina
        // level only if the slot maps off the grid.
        const { q: gq, r: gr } = worldToAxial(gx, gz, HEX_R);
        const tileTop = unitRenderer.topYAt(gq, gr);
        const gy = (tileTop > 0 ? tileTop : 0.45) + TOKEN_LIFT;
        return { x: gx, y: gy, z: gz };
      });

      // Sync the unit renderer with gallery units (replaces real tokens).
      // Fog must NOT be applied here -- gallery shows all unit types.
      unitRenderer.sync(galleryUnits);

      // Position each gallery token at its grid slot.
      for (let i = 0; i < galleryUnits.length; i++) {
        const p = galleryPositions[i]!;
        unitRenderer.setTokenWorldPosition('gal' + i, p.x, p.y, p.z);
      }

      // Create floating HTML labels -- one per unit type.
      galleryLabels = types.map((t, i) => {
        const div = document.createElement('div') as HTMLDivElement;
        div.style.cssText = [
          'position:fixed',
          'background:rgba(0,0,0,0.72)',
          'color:#f0e6b0',
          'font:bold 10px/1.3 monospace',
          'padding:2px 5px',
          'border-radius:3px',
          'pointer-events:none',
          'z-index:200',
          'white-space:nowrap',
          // Center div horizontally on the projected point; put above it.
          'transform:translate(-50%,-100%)',
          'display:none',
        ].join(';');
        // textContent: safe -- no HTML injection.
        div.textContent = '[' + (i + 1) + '] ' + t.name;
        document.body.appendChild(div);
        return div;
      });

      // Title: GALERIA JEDNOSTEK (Polish via JS \uXXXX)
      // \u2014 = em dash, \u015b = s+acute, \u0107 = c+acute
      galleryTitle = document.createElement('div') as HTMLDivElement;
      galleryTitle.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#e8d88a',
        'font:bold 14px/1.5 monospace',
        'padding:6px 16px',
        'border-radius:6px',
        'border:1px solid rgba(232,216,138,0.4)',
        'pointer-events:none',
        'z-index:200',
        'white-space:nowrap',
      ].join(';');
      galleryTitle.textContent = 'GALERIA JEDNOSTEK \u2014 \'G\' aby wyj\u015b\u0107';
      document.body.appendChild(galleryTitle);
    }

    /** Exit gallery mode: remove labels/title, restore real unit tokens with fog. */
    function exitGallery(): void {
      // Remove all label divs.
      for (const lbl of galleryLabels) {
        lbl.remove();
      }
      galleryLabels = [];

      // Remove title overlay.
      if (galleryTitle !== null) {
        galleryTitle.remove();
        galleryTitle = null;
      }

      galleryUnits = [];
      galleryPositions = [];

      // Restore play view -- fog drives which units are shown.
      refreshFog();
    }

    // -----------------------------------------------------------------------
    // Battle helpers
    // -----------------------------------------------------------------------

    /**
     * structureDefenseBonusFor (STEP E) -- bonusy obronne za mape/budowle.
     *
     * Zwraca najwyzszy bonus procentowy dla broniaceego sie (defender) na podanej
     * pozycji (q, r). Hierarchia (najwyzszy wygrywa, nie kumuluja sie):
     *   miasto z murem (City.maMur) -> 200%
     *   fort (ulepszenie terenu 'fort') -> 100%
     *   posterunek ('posterunek') -> 50%
     *   brak struktury -> 0%
     *
     * Warunek trybu OBOZOWANIA (posterunek/fort) -- do czasu wdrozenia toggle
     * "stand-by" traktujemy kazda jednostke na polu budowli we wlasnym
     * terytorium jako obozujaca (zgodnie z ustaleniem w handoffie UNITS).
     */
    function structureDefenseBonusFor(q: number, r: number): number {
      // Sprawdz czy bronicacy jest w miescie z murem
      const cityOnHex = cities.find(c => c.q === q && c.r === r);
      if (cityOnHex && (cityOnHex as any).maMur === true) {
        return 200; // mur +200% (trojkrotnosc bazowej Obrony)
      }

      // Sprawdz ulepszenie terenu na tym heksie
      const hk = keyOf(q, r);
      const hex = map.hexes[hk];
      if (hex) {
        const ulepszenie = (hex as any).ulepszenie ?? (hex as any).improvement ?? null;
        if (typeof ulepszenie === 'string') {
          const ul = ulepszenie.toLowerCase();
          if (ul === 'fort') return 100;      // fort +100%
          if (ul === 'posterunek') return 50; // posterunek +50%
        }
      }

      return 0; // brak bonusu
    }

    /**
     * normFieldVal: read a numeric stat from a raw unit def record.
     * Handles null, undefined, '---', '\u2014' (em dash), empty string.
     */
    function normFieldVal(v: unknown, fallback: number): number {
      if (v === null || v === undefined || v === '---' || v === '\u2014' || v === '') return fallback;
      const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
      return isNaN(n) ? fallback : n;
    }

    /**
     * Look up a unit type record in data.units by typeId (Jednostka field name).
     * Falls back to a synthetic minimal combat record if not found.
     */
    function lookupUnitDef(typeId: string): any {
      const direct = (data.units as any[]).find((u: any) => u['Jednostka'] === typeId);
      if (direct) return direct;
      // Fallback: a minimal warrior-equivalent record
      return {
        'Jednostka': typeId,
        'Rola (linia)': 'Wrecz',
        'Próg dezercji (% health)': 0.25,
        meleeAttack: 5,
        meleeDefence: 5,
        chargeBonus: 2,
        armor: 2,
        piercing: 0,
        health: 30,
        weaponDamage: 4,
        missileAttack: 0,
        'Zasieg ataku (hex)': null,
        'Ilosc pociskow': null,
        'Ruch w bitwie (heksy)': 2,
        'Kara obrony z flanki (%)': 50,
        'Kara obrony z tylu (%)': 80,
      };
    }

    function unitDefFor(u: RuntimeUnit): any {
      const ov = militiaDefOverrides.get(String(u.id));
      if (ov) return ov;
      return lookupUnitDef(u.typeId);
    }

    /** Return max HP from a unit def (TW v3 `health`). */
    function unitHealth(def: any): number {
      return normFieldVal(def['health'] ?? def['Health'], 30);
    }

    /** Return meleeAttack from a unit def. */
    function unitAtak(def: any): number {
      return normFieldVal(def['meleeAttack'], 0);
    }

    /** Return meleeDefence from a unit def. */
    function unitObrona(def: any): number {
      return normFieldVal(def['meleeDefence'], 0);
    }

    function combatFromDef(def: Record<string, unknown>, typeId: string, hp?: number): CombatUnit {
      return combatUnitFromDef(def, { typNazwa: typeId, hp });
    }

    /**
     * Convert a RuntimeUnit + its stat record into a BattleUnit for BattleScene.
     */
    function runtimeToBattleUnit(u: RuntimeUnit, _def: any, ownerColor: number): BattleUnit {
      const def = unitDefFor(u);
      const maxHp = unitHealth(def);
      const hp = u.hp != null ? Math.min(maxHp, Math.max(0, u.hp)) : maxHp;
      return {
        id: u.id,
        nazwa: u.typeId,
        kategoria: u.category,
        ownerColor,
        stats: def,
        hp,
        maxHp,
      };
    }

    /** C1-Q4 / D8=A: heks kotwicy + własne jednostki w promieniu 1 heksa. */
    function collectBattleRoster(
      anchor: RuntimeUnit,
      allUnits: RuntimeUnit[],
      side: 'attacker' | 'defender' = 'attacker',
    ): RuntimeUnit[] {
      if (playtestWalkaActive) {
        // DUŻA bitwa: klik jednej jednostki zbiera cały klaster armii (owner-filtered).
        const radius = bitwaDuzaActive ? PLAYTEST_BITWA_DUZA_ROSTER_RADIUS : undefined;
        return collectPlaytestBattleRoster(anchor, allUnits, radius);
      }
      return collectBattleRosterPure(anchor, allUnits, side);
    }

    function preBattleUnitFromRuntime(u: RuntimeUnit): PreBattleUnit {
      const def = unitDefFor(u);
      const hp = unitHealth(def);
      return {
        nazwa: u.typeId,
        kategoria: u.category,
        hp,
        maxHp: hp,
        atak: unitAtak(def),
        moc: armyFieldPower(def),
      };
    }

    /** Szanse preBattle = prognoza auto-walki M v2b (identyczny stos co Auto). */
    function preBattleSzanseAtkPct(
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      terrain: string,
      structBonusPct: number,
      atkSiegeBonus: number = 0,
    ): number {
      const aLeadDef = unitDefFor(atkRoster[0]!);
      const mAtk = rosterFieldPowerM(atkRoster) + atkSiegeBonus;
      const mDef = effectiveDefenderM(defRoster, terrain, structBonusPct, aLeadDef);
      return autoBattleWinPct(mAtk, mDef);
    }

    /**
     * C-BITWA-WLADCA=B (Maciej 2026-07-25): imię władcy OSOBNE per właściciel — indeks =
     * pozycja tego właściciela wśród wszystkich właścicieli tej samej cywilizacji (państwa +
     * miasta-państwa), więc dwóch Greków dostaje różne imiona z puli 10. Barbarzyńcy: null.
     */
    function leaderNameForOwnerId(ownerId: number): string | null {
      if (isBarbarian(ownerId)) return null;
      const civ = civTypeForOwner(ownerId);
      const era = empireEpochForOwner(ownerId);
      const sameCiv = allPowerOwnerIds()
        .filter(id => !isBarbarian(id) && civTypeForOwner(id) === civ)
        .sort((a, b) => a - b);
      const idx = Math.max(0, sameCiv.indexOf(ownerId));
      return leaderNameFromPool(civ, idx, era);
    }

    function preBattleSideFromRoster(roster: RuntimeUnit[], title: string, civLabel: string): PreBattleInfo['atakujacy'] {
      const ownerId = roster[0]?.ownerId ?? 0;
      return {
        nazwa: title,
        cywilizacja: civLabel,
        ownerId,
        wodz: leaderNameForOwnerId(ownerId) ?? undefined,
        civId: civTypeForOwner(ownerId),
        era: empireEpochForOwner(ownerId),
        isCityState: isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
        // TEMAT 11 (2026-07-24): barbarzyncy (BARBARIAN_OWNER_ID) nie maja wpisu w
        // aiOwnerCivMap, wiec civTypeForOwner() spada na fallback 'grecy' -- medalion
        // dostawal portret/ikone Grecji zamiast wlasnego sygnetu. Flaga isBarbarian ma
        // pierwszenstwo nad civId w renderze (preBattle.ts / battleScene.ts).
        isBarbarian: isBarbarian(ownerId),
        units: roster.map(preBattleUnitFromRuntime),
      };
    }

    /** MAP PLAYER ATTACK: jednostka → jednostka (sąsiad) → preBattle C-01 */
    function openPlayerMapUnitAttack(atkUnit: RuntimeUnit, defUnit: RuntimeUnit): void {
      // TEMAT #15: BRAK ataku z wody — jednostka zaokrętowana musi zejść na ląd.
      if (atkUnit.embarked === true) {
        showHintMessage('Jednostka zaokrętowana nie może atakować — zejdź na ląd.', 3800);
        return;
      }
      const atkRoster = collectBattleRoster(atkUnit, units, 'attacker');
      const defRoster = collectBattleRoster(defUnit, units, 'defender');
      const dHexKey4 = keyOf(defUnit.q, defUnit.r);
      const dHex4 = map.hexes[dHexKey4];
      const dTeren4: string = dHex4 ? (dHex4.terenBazowy as string) : 'Rownina';
      const dStructBonus4 = structureDefenseBonusFor(defUnit.q, defUnit.r);
      const szanse4 = preBattleSzanseAtkPct(atkRoster, defRoster, dTeren4, dStructBonus4);
      const defCivLabel = ownerDiploLabel(defUnit.ownerId);
      const placeInfo = fieldBattlePlaceInfo(defUnit.q, defUnit.r, dTeren4, 0);
      const pbInfo4: PreBattleInfo = {
        atakujacy: preBattleSideFromRoster(
          atkRoster,
          atkRoster.length > 1 ? 'Skład (' + atkRoster.length + ')' : atkUnit.typeId,
          'Gracz',
        ),
        obronca: preBattleSideFromRoster(
          defRoster,
          defRoster.length > 1 ? 'Skład (' + defRoster.length + ')' : defUnit.typeId,
          defCivLabel,
        ),
        teren: dTeren4,
        szanseAtkPct: szanse4,
        miejsce: placeInfo.miejsce,
        lokacja: placeInfo.lokacja,
        tura: turn,
        canRetreat: true,
      };

      const atkRosterRef = atkRoster.slice();
      const defRosterRef = defRoster.slice();
      const atkStartSnap = snapshotRosterPositions(atkRosterRef);
      const battleHex = { q: defUnit.q, r: defUnit.r };

      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();

      function clearBattleUiState(): void {
        clearPlayerUnitSelection();
        refreshFog();
        updateHud();
      }

      function rosterToBattleUnits(roster: RuntimeUnit[], color: number): BattleUnit[] {
        return roster.map(u => runtimeToBattleUnit(u, lookupUnitDef(u.typeId), color));
      }

      function finishMapBattleUi(): void {
        clearBattleUiState();
      }

      function mapBattleSummaryMeta(mode: 'auto' | 'manual') {
        return {
          mode,
          atkLabel: pbInfo4.atakujacy.nazwa,
          defLabel: pbInfo4.obronca.nazwa,
          atkCivLabel: pbInfo4.atakujacy.cywilizacja,
          defCivLabel: pbInfo4.obronca.cywilizacja,
          teren: dTeren4,
          placeLabel: placeInfo.miejsce + ' · ' + placeInfo.lokacja,
        };
      }

      function doMapAutoResolve(): void {
        try {
          const atkLead = atkRosterRef[0]!;
          const aLeadDef = unitDefFor(atkLead);
          const mAtk = rosterFieldPowerM(atkRosterRef);
          const mDef = effectiveDefenderM(defRosterRef, dTeren4, dStructBonus4, aLeadDef);
          const powerRes = resolveAutoBattleByPower({ mAtk, mDef });

          if (powerRes.winner === 'none') {
            showHintMessage('Atak: brak sił bojowych w składzie', 3000);
            finishMapBattleUi();
          } else if (powerRes.winner === 'tie') {
            applyMapBattleOutcomeWithSummary(
              atkRosterRef, defRosterRef, 'remis', undefined,
              {
                lossAtkPct: powerRes.lossAtkPct,
                lossDefPct: powerRes.lossDefPct,
                battleQ: battleHex.q,
                battleR: battleHex.r,
                atkStart: atkStartSnap,
              },
              mapBattleSummaryMeta('auto'),
              finishMapBattleUi,
            );
          } else if (powerRes.winner === 'attacker') {
            applyMapBattleOutcomeWithSummary(
              atkRosterRef, defRosterRef, 'atakujacy', undefined,
              {
                lossAtkPct: powerRes.lossAtkPct,
                lossDefPct: powerRes.lossDefPct,
                battleQ: battleHex.q,
                battleR: battleHex.r,
                atkStart: atkStartSnap,
              },
              mapBattleSummaryMeta('auto'),
              finishMapBattleUi,
            );
          } else {
            applyMapBattleOutcomeWithSummary(
              atkRosterRef, defRosterRef, 'obronca', undefined,
              {
                lossAtkPct: powerRes.lossAtkPct,
                lossDefPct: powerRes.lossDefPct,
                battleQ: battleHex.q,
                battleR: battleHex.r,
                atkStart: atkStartSnap,
              },
              mapBattleSummaryMeta('auto'),
              finishMapBattleUi,
            );
          }
        } catch (eBattle4) {
          console.error('[Bitwa] Blad ataku gracza:', eBattle4);
          finishMapBattleUi();
        }
      }

      showPreBattle(pbInfo4, {
        onAuto: () => { hidePreBattle(); doMapAutoResolve(); },
        onBattlefield: () => {
          hidePreBattle();
          const atkLead = atkRosterRef[0]!;
          const defLead = defRosterRef[0]!;
          const atkBus = rosterToBattleUnits(atkRosterRef, 0xffd54a);
          const defBus = rosterToBattleUnits(defRosterRef, 0xc84040);
          setMood('bitwa');
          const bs = new BattleScene({
            attacker: atkBus,
            defender: defBus,
            teren: dTeren4,
            worldTerrain: worldTerrainFromHex(dHex4),
            data,
            deploy: true,
            deployPlayerSide: 'atk',
            attackerCivBonusy: civBonusyForOwnerId(atkLead.ownerId),
            defenderCivBonusy: civBonusyForOwnerId(defLead.ownerId),
            attackerCivLabel: pbInfo4.atakujacy.cywilizacja,
            defenderCivLabel: pbInfo4.obronca.cywilizacja,
            // BŁĄD D-weryfikacja (2026-07-25): civId liczony poprawnie w
            // preBattleSideFromRoster (civTypeForOwner) nigdy nie trafiał do
            // BattleScene — scena zgadywała civId z etykiety (fallback
            // civIconIdFromLabel/civIconIdFromCivLabel), zamiast dostać
            // gotową, pewną wartość. Przekazujemy wprost.
            attackerCivIconId: pbInfo4.atakujacy.civId,
            defenderCivIconId: pbInfo4.obronca.civId,
            attackerLeaderName: pbInfo4.atakujacy.wodz,
            defenderLeaderName: pbInfo4.obronca.wodz,
            attackerSideLabel: pbInfo4.atakujacy.nazwa,
            defenderSideLabel: pbInfo4.obronca.nazwa,
            attackerEra: empireEpochForOwner(atkLead.ownerId),
            defenderEra: empireEpochForOwner(defLead.ownerId),
            attackerIsCityState: pbInfo4.atakujacy.isCityState,
            defenderIsCityState: pbInfo4.obronca.isCityState,
            attackerIsBarbarian: pbInfo4.atakujacy.isBarbarian,
            defenderIsBarbarian: pbInfo4.obronca.isBarbarian,
            onCancel: () => setMood('mapa'),
          });
          bs.play((res) => {
            applyMapBattleOutcomeWithSummary(
              atkRosterRef, defRosterRef, res.winner, res.survivors,
              {
                battleQ: battleHex.q,
                battleR: battleHex.r,
                atkStart: atkStartSnap,
              },
              mapBattleSummaryMeta('manual'),
              () => {
                setMood('mapa');
                finishMapBattleUi();
                bs.dispose();
              },
            );
          });
        },
        onCancel: () => {
          hidePreBattle();
        },
        onSave: () => doQuickSave(false),
      }, { defaultAction: 'manual' });
    }

    function snapshotRosterForSummary(roster: RuntimeUnit[]): BattleUnitBeforeSnap[] {
      return roster.map(u => {
        const def = unitDefFor(u);
        const maxHp = unitHealth(def);
        const hp = u.hp ?? maxHp;
        return {
          id: String(u.id),
          typeId: u.typeId,
          kategoria: u.category ?? String(def['Rola (linia)'] ?? 'Wrecz'),
          hp,
          maxHp,
        };
      });
    }

    function makeHpLookupAfterBattle(): (id: string) => number | null {
      return (id: string) => {
        const u = units.find(x => String(x.id) === id);
        if (!u) return null;
        const def = unitDefFor(u);
        return u.hp ?? unitHealth(def);
      };
    }

    function presentPostBattleSummary(
      input: Parameters<typeof buildPostBattleSummary>[0],
      onContinue: () => void,
    ): void {
      showPostBattleSummary(buildPostBattleSummary(input), onContinue);
    }

    function applyMapBattleOutcomeWithSummary(
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      winner: BattleResult['winner'] | 'remis',
      survivors: BattleUnit[] | undefined,
      opts: Parameters<typeof applyMapBattleOutcome>[4],
      summary: {
        mode: 'auto' | 'manual' | 'szturm';
        atkLabel: string;
        defLabel: string;
        atkCivLabel?: string;
        defCivLabel?: string;
        teren?: string;
        placeLabel?: string;
      },
      onContinue: () => void,
    ): void {
      const atkBefore = snapshotRosterForSummary(atkRoster);
      const defBefore = snapshotRosterForSummary(defRoster);
      applyMapBattleOutcome(atkRoster, defRoster, winner, survivors, opts);
      presentPostBattleSummary({
        winner: winner as BattleSummaryWinner,
        atkLabel: summary.atkLabel,
        defLabel: summary.defLabel,
        atkCivLabel: summary.atkCivLabel,
        defCivLabel: summary.defCivLabel,
        teren: summary.teren,
        placeLabel: summary.placeLabel,
        mode: summary.mode,
        atkBefore,
        defBefore,
        lookupHp: makeHpLookupAfterBattle(),
      }, onContinue);
    }

    function mapHexPassableForUnit(q: number, r: number): boolean {
      const hk = keyOf(q, r);
      const hex = map.hexes[hk];
      if (!hex) return false;
      const t = hex.terenBazowy;
      return t !== TerenBazowy.Morze && t !== TerenBazowy.Wybrzeze && t !== TerenBazowy.Gory;
    }

    function isOccupiedHex(q: number, r: number, exceptId?: string | number): boolean {
      return units.some(u => u.q === q && u.r === r && u.id !== exceptId);
    }

    function rosterFieldPowerM(roster: RuntimeUnit[]): number {
      return sumRosterFieldM(
        roster.map(u => ({ typeId: u.typeId, def: unitDefFor(u) })),
      );
    }

    /** #51: machiny (Rola=Oblężnicza) nie liczą się w rosterFieldPowerM (decyzja 2A, pole) —
     *  ich wkład do M ataku SZTURMU muru liczy się osobno przez siegePower(). */
    function rosterSiegeMachinePowerM(roster: RuntimeUnit[]): number {
      let sum = 0;
      for (const u of roster) {
        const def = unitDefFor(u);
        if (isSiegeUnit(def)) sum += siegePower(def).total;
      }
      return Math.round(sum * 10) / 10;
    }

    function effectiveDefenderM(
      defRoster: RuntimeUnit[],
      terrain: string,
      structBonusPct: number,
      atkLeadDef: Record<string, unknown>,
    ): number {
      const raw = rosterFieldPowerM(defRoster);
      const terrMult = terrainDefenseMultiplier(
        terrain,
        String(atkLeadDef['Rola (linia)'] ?? ''),
        terrainCombatData as unknown as TerrainEntry[],
      );
      const structMult = 1 + structBonusPct / 100;
      // TEMAT #15: obrońca zaokrętowany (bitwa na wodzie) — obrona ×0,5 (−50%).
      const embarkMult = defRoster[0]?.embarked === true ? EMBARK_DEFENSE_MULT : 1;
      return Math.round(raw * terrMult * structMult * embarkMult * 10) / 10;
    }

    /** Auto-walka M v2b + wspólne skutki mapy (identyczne reguły ruchu co ręczna). */
    function doAutoPowerMapBattle(
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      battleQ: number,
      battleR: number,
      terrain: string,
      structBonusPct: number,
      atkStart?: Map<string | number, { q: number; r: number }>,
    ): ReturnType<typeof resolveAutoBattleByPower> | null {
      const start = atkStart ?? snapshotRosterPositions(atkRoster);
      const aLeadDef = unitDefFor(atkRoster[0]!);
      const mAtk = rosterFieldPowerM(atkRoster);
      const mDef = effectiveDefenderM(defRoster, terrain, structBonusPct, aLeadDef);
      const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
      if (powerRes.winner === 'none') return powerRes;

      const winner: BattleResult['winner'] =
        powerRes.winner === 'tie' ? 'remis'
          : powerRes.winner === 'attacker' ? 'atakujacy'
            : 'obronca';

      applyMapBattleOutcome(atkRoster, defRoster, winner, undefined, {
        lossAtkPct: powerRes.lossAtkPct,
        lossDefPct: powerRes.lossDefPct,
        battleQ,
        battleR,
        atkStart: start,
      });
      return powerRes;
    }

    /**
     * Atak wroga (tura AI / barbarzyńcy) na wojsko gracza — preBattle + podsumowanie.
     * Wstrzymuje dalszą pętlę AI do zamknięcia bitwy (Auto / Pole bitwy).
     */
    function launchIncomingMapFieldBattle(
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      battleQ: number,
      battleR: number,
      terrain: string,
      structBonusPct: number,
      contextLabel: string,
      onResolved: () => void,
      worldTerrain?: WorldTerrainInput,
    ): void {
      const atkRosterRef = atkRoster.slice();
      const defRosterRef = defRoster.slice();
      if (atkRosterRef.length === 0 || defRosterRef.length === 0) {
        onResolved();
        return;
      }

      const atkLead = atkRosterRef[0]!;
      const defLead = defRosterRef[0]!;
      const szanse = preBattleSzanseAtkPct(atkRosterRef, defRosterRef, terrain, structBonusPct);
      const atkOwner = atkLead.ownerId;
      const atkCivLabel = atkOwner === 0 ? 'Gracz' : ownerDiploLabel(atkOwner);
      const defCivLabel = defLead.ownerId === 0 ? 'Gracz' : ownerDiploLabel(defLead.ownerId);
      const atkSideTitle = atkOwner === 0
        ? (atkRosterRef.length > 1 ? 'Skład (' + atkRosterRef.length + ')' : atkLead.typeId)
        : (ownerDiploLabel(atkOwner) + ' — atak');
      const defSideTitle = defRosterRef.length > 1
        ? 'Twoja obrona (' + defRosterRef.length + ')'
        : defLead.typeId;
      const placeInfo = fieldBattlePlaceInfo(battleQ, battleR, terrain, 0);

      const pbInfo: PreBattleInfo = {
        atakujacy: preBattleSideFromRoster(atkRosterRef, atkSideTitle, atkCivLabel),
        obronca: preBattleSideFromRoster(defRosterRef, defSideTitle, defCivLabel),
        teren: terrain,
        szanseAtkPct: szanse,
        miejsce: isBarbarian(atkOwner)
          ? 'Atak barbarzyńców · ' + placeInfo.miejsce
          : placeInfo.miejsce,
        lokacja: placeInfo.lokacja,
        tura: turn,
        canRetreat: false,
      };

      const atkStartSnap = snapshotRosterPositions(atkRosterRef);
      const battleHex = { q: battleQ, r: battleR };

      function rosterToBattleUnits(roster: RuntimeUnit[], color: number): BattleUnit[] {
        return roster.map(u => runtimeToBattleUnit(u, lookupUnitDef(u.typeId), color));
      }

      function mapBattleSummaryMeta(mode: 'auto' | 'manual') {
        return {
          mode,
          atkLabel: pbInfo.atakujacy.nazwa,
          defLabel: pbInfo.obronca.nazwa,
          atkCivLabel: pbInfo.atakujacy.cywilizacja,
          defCivLabel: pbInfo.obronca.cywilizacja,
          teren: terrain,
          placeLabel: pbInfo.miejsce + ' · ' + pbInfo.lokacja,
        };
      }

      function finishIncomingBattleUi(): void {
        syncUnitsRender();
        refreshFog();
        updateHud();
        refreshD1bHud();
        onResolved();
      }

      function doMapAutoResolveIncoming(): void {
        try {
          const aLeadDef = unitDefFor(atkLead);
          const mAtk = rosterFieldPowerM(atkRosterRef);
          const mDef = effectiveDefenderM(defRosterRef, terrain, structBonusPct, aLeadDef);
          const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
          if (powerRes.winner === 'none') {
            showHintMessage('Bitwa: brak sił bojowych w składzie', 3000);
            finishIncomingBattleUi();
            return;
          }
          const winner: BattleResult['winner'] =
            powerRes.winner === 'tie' ? 'remis'
              : powerRes.winner === 'attacker' ? 'atakujacy'
                : 'obronca';
          applyMapBattleOutcomeWithSummary(
            atkRosterRef,
            defRosterRef,
            winner,
            undefined,
            {
              lossAtkPct: powerRes.lossAtkPct,
              lossDefPct: powerRes.lossDefPct,
              battleQ: battleHex.q,
              battleR: battleHex.r,
              atkStart: atkStartSnap,
            },
            mapBattleSummaryMeta('auto'),
            finishIncomingBattleUi,
          );
        } catch (eBattleIn) {
          console.error('[Bitwa] Błąd ataku przychodzącego:', eBattleIn);
          finishIncomingBattleUi();
        }
      }

      showHintMessage('Wróg atakuje twoje wojsko!', 5000);
      showPreBattle(pbInfo, {
        onAuto: () => { hidePreBattle(); doMapAutoResolveIncoming(); },
        onBattlefield: () => {
          hidePreBattle();
          const atkBus = rosterToBattleUnits(atkRosterRef, 0xc84040);
          const defBus = rosterToBattleUnits(defRosterRef, 0xffd54a);
          setMood('bitwa');
          const bs = new BattleScene({
            attacker: atkBus,
            defender: defBus,
            teren: terrain,
            worldTerrain,
            data,
            deploy: true,
            deployPlayerSide: 'def',
            attackerCivBonusy: civBonusyForOwnerId(atkLead.ownerId),
            defenderCivBonusy: civBonusyForOwnerId(defLead.ownerId),
            attackerCivLabel: pbInfo.atakujacy.cywilizacja,
            defenderCivLabel: pbInfo.obronca.cywilizacja,
            // BŁĄD D-weryfikacja: patrz komentarz przy attackerCivIconId powyżej
            // (analogiczny call site, bitwa przychodząca / atak AI na gracza).
            attackerCivIconId: pbInfo.atakujacy.civId,
            defenderCivIconId: pbInfo.obronca.civId,
            attackerLeaderName: pbInfo.atakujacy.wodz,
            defenderLeaderName: pbInfo.obronca.wodz,
            attackerSideLabel: pbInfo.atakujacy.nazwa,
            defenderSideLabel: pbInfo.obronca.nazwa,
            attackerEra: empireEpochForOwner(atkLead.ownerId),
            defenderEra: empireEpochForOwner(defLead.ownerId),
            attackerIsCityState: pbInfo.atakujacy.isCityState,
            defenderIsCityState: pbInfo.obronca.isCityState,
            attackerIsBarbarian: pbInfo.atakujacy.isBarbarian,
            defenderIsBarbarian: pbInfo.obronca.isBarbarian,
            onCancel: () => setMood('mapa'),
          });
          bs.play((res) => {
            applyMapBattleOutcomeWithSummary(
              atkRosterRef,
              defRosterRef,
              res.winner,
              res.survivors,
              {
                battleQ: battleHex.q,
                battleR: battleHex.r,
                atkStart: atkStartSnap,
              },
              mapBattleSummaryMeta('manual'),
              () => {
                setMood('mapa');
                finishIncomingBattleUi();
                bs.dispose();
              },
            );
          });
        },
        onCancel: () => {
          hidePreBattle();
        },
        onSave: () => doQuickSave(false),
      }, { defaultAction: 'manual' });
    }

    function applyMapBattleOutcome(
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      winner: BattleResult['winner'] | 'remis',
      survivors?: BattleUnit[],
      opts?: {
        lossAtkPct?: number;
        lossDefPct?: number;
        battleQ?: number;
        battleR?: number;
        atkStart?: Map<string | number, { q: number; r: number }>;
        /** true = szturm oblężniczy — UI zdobycia obsługuje finishSiegeStormBattle */
        siegeContext?: boolean;
        /** Jawny atak na miasto (potyczka o miasto / szturm) — inaczej wygrana polowa NIE przejmuje miasta. */
        allowCityCapture?: boolean;
      },
    ): void {
      const battleQ = opts?.battleQ ?? defRoster[0]?.q ?? atkRoster[0]?.q ?? 0;
      const battleR = opts?.battleR ?? defRoster[0]?.r ?? atkRoster[0]?.r ?? 0;
      const atkStart = opts?.atkStart ?? snapshotRosterPositions(atkRoster);
      const mapWinner: MapBattleWinner =
        winner === 'remis' ? 'remis'
          : winner === 'atakujacy' ? 'atakujacy'
            : 'obronca';

      const cityOnHex = findCityOnHex(cities, battleQ, battleR) ?? null;
      const cityOwnerBefore = cityOnHex?.ownerId;

      if (mapWinner === 'atakujacy' || mapWinner === 'obronca') {
        const winOid = mapWinner === 'atakujacy' ? atkRoster[0]?.ownerId : defRoster[0]?.ownerId;
        const loserRoster = mapWinner === 'atakujacy' ? defRoster : atkRoster;
        if (winOid !== undefined) {
          const pts = battlePowerPointsFromDefeatedEnemy(
            sumRosterFieldM(loserRoster.map(u => ({ typeId: u.typeId, def: unitDefFor(u) }))),
          );
          battlePowerPtsByOwner.set(winOid, (battlePowerPtsByOwner.get(winOid) ?? 0) + pts);
        }
      }

      applyPostBattleMap({
        units,
        map,
        cities,
        battleQ,
        battleR,
        atkAnchor: atkRoster[0]!,
        atkRoster,
        defRoster,
        atkStart,
        winner: mapWinner,
        lossAtkPct: opts?.lossAtkPct,
        lossDefPct: opts?.lossDefPct,
        manualSurvivors: survivors !== undefined
          ? survivors.map(s => ({ id: String(s.id), hp: s.hp }))
          : undefined,
        getDef: u => unitDefFor(u),
        maxHpOf: def => unitHealth(def),
        isPassableHex: mapHexPassableForUnit,
        isUnitAt: isOccupiedHex,
        cityOnBattleHex: cityOnHex,
      });

      if (
        (opts?.allowCityCapture === true || opts?.siegeContext === true)
        && mapWinner === 'atakujacy'
        && cityOnHex
        && cityOnHex.ownerId !== atkRoster[0]?.ownerId
      ) {
        const atkOwner = atkRoster[0]!.ownerId;
        applyCityCaptureToMap(cityOnHex, atkRoster, atkOwner, atkRoster[0] ?? null);
        if (!opts?.siegeContext && cityOwnerBefore !== undefined && cityOnHex.ownerId === atkOwner) {
          const lead = units.find(u => u.id === atkRoster[0]?.id) ?? null;
          refreshMapAfterCityCapture(lead);
          if (atkOwner === 0) {
            showCityCaptureNotice(cityOnHex.name, {
              subtitle: 'Potyczka wygrana — wojsko weszło na heks miasta.',
            });
          }
        }
      }

      if (mapWinner === 'obronca') selectedId = null;

      forceVisibleUnitId = null;
      syncUnitsRender();
    }

    function collectSiegeAtkRoster(city: City, anchor: RuntimeUnit): RuntimeUnit[] {
      return collectAtkRosterNearCity(city, anchor, units);
    }

    function militiaDefRecord(m: ReturnType<typeof makeMilitia>): Record<string, unknown> {
      return {
        'Jednostka': 'Milicja',
        meleeAttack: m!.Atak,
        meleeDefence: m!.Obrona,
        chargeBonus: m!.Uderzenie,
        armor: m!.Pancerz,
        piercing: m!.Przebicie,
        health: m!.Health,
        weaponDamage: Math.max(1, m!.weaponDamage ?? m!.Atak),
        missileAttack: 0,
        'Rola (linia)': m!.rola,
        'Prog dezercji (% health)': null,
        'Zasieg ataku (hex)': null,
        'Ilosc pociskow': null,
        'Ruch w bitwie (heksy)': 0,
        'Kara obrony z flanki (%)': 50,
        'Kara obrony z tylu (%)': 80,
      };
    }

    /** C3-ST-1: kanon w siegeDefenders.ts — obrońcy = jednostki dist≤1 lub garnizon>0. */
    function cityHasDefenders(city: City): boolean {
      return hasCityDefenders(city, units);
    }

    function collectSiegeDefRoster(city: City): RuntimeUnit[] {
      const roster = collectDefRosterNearCity(city, units).filter(u => u.ownerId === city.ownerId);
      if (roster.length > 0) return roster;
      if ((city.garnizon ?? 0) <= 0) return [];

      const pop = city.population ?? 0;
      const militia = makeMilitia(Math.max(pop, 5));
      if (!militia) return [];
      const id = 'militia-' + city.id;
      militiaDefOverrides.set(id, militiaDefRecord(militia));
      return [{
        id,
        ownerId: city.ownerId,
        typeId: 'Milicja',
        category: 'domyslny',
        q: city.q,
        r: city.r,
        ruch: 0,
        ruchLeft: 0,
      }];
    }

    // -----------------------------------------------------------------------
    // PRZEJĘCIE STOLICY — akcesory zasobów owner-agnostyczne (gracz ownerId 0 =
    // playerState.ts; AI ownerId>0 = mapy *ByOwner poniżej). Patrz capital-capture.ts.
    // -----------------------------------------------------------------------

    function ownerTreasury(ownerId: number): number {
      return ownerId === 0 ? player.skarbiec : (aiSkarbiecByOwner.get(ownerId) ?? 0);
    }
    function setOwnerTreasury(ownerId: number, value: number): void {
      const v = Math.max(0, value);
      if (ownerId === 0) player.skarbiec = v;
      else aiSkarbiecByOwner.set(ownerId, v);
    }
    /** D-IMPROVEMENTS: AI MA teraz pulę Pracy (aiPracaPoolByOwner) -- buduje z niej
     *  ulepszenia terenu (planCityImprovements). Podpięcie pod przejęcie stolicy:
     *  applyCapitalCapturePlunder wywołuje setPracaPool(oldOwner, 0) bezwarunkowo
     *  (pula PRZEPADA, nie do zwycięzcy) -- symetryczne z graczem. */
    function ownerPracaPool(ownerId: number): number {
      return ownerId === 0 ? playerPracaPool : (aiPracaPoolByOwner.get(ownerId) ?? 0);
    }
    function setOwnerPracaPool(ownerId: number, value: number): void {
      const v = Math.max(0, value);
      if (ownerId === 0) {
        playerPracaPool = v;
        _lastPraca = playerPracaPool;
      } else {
        aiPracaPoolByOwner.set(ownerId, v);
      }
    }
    function ownerNaukaPool(ownerId: number): number {
      return ownerId === 0 ? player.nauka : (aiNaukaPoolByOwner.get(ownerId) ?? 0);
    }
    function setOwnerNaukaPool(ownerId: number, value: number): void {
      const v = Math.max(0, value);
      if (ownerId === 0) {
        player.nauka = v;
        return;
      }
      aiNaukaPoolByOwner.set(ownerId, v);
    }

    /** Symetryczny researchStep dla AI — koszt nauki z puli, nie natychmiastowe odblokowanie. */
    function runAiResearchForOwner(ownerId: number): void {
      if (ownerId === 0 || eliminatedOwners.has(ownerId)) return;
      let done = aiResearchDone.get(ownerId);
      if (!done) {
        done = new Set<string>();
        aiResearchDone.set(ownerId, done);
      }
      const gate = researchGateForOwner(ownerId);
      const aiCitiesCount = cities.filter(c => c.ownerId === ownerId).length;
      const allBuiltForAI: string[] = [];
      for (const [cid, blt] of cityBuilt.entries()) {
        const c = cities.find(ct => ct.id === cid && ct.ownerId === ownerId);
        if (c) { for (const b of blt) allBuiltForAI.push(b); }
      }
      let badana = aiBadanaByOwner.get(ownerId) ?? null;
      const badanaStillValid = badana !== null
        && !done.has(badana)
        && availableTechs(data.tech, done, gate).some(t => t.Technologia === badana);
      if (!badanaStillValid) {
        badana = chooseAIResearch(
          data.tech as any,
          done,
          {
            myCitiesCount: aiCitiesCount,
            allBuiltBuildings: allBuiltForAI,
            techData: data.tech as any,
            researchGate: gate,
          },
        );
        aiBadanaByOwner.set(ownerId, badana);
      }
      const aiState: PlayerState = {
        skarbiec: aiSkarbiecByOwner.get(ownerId) ?? 0,
        nauka: aiNaukaPoolByOwner.get(ownerId) ?? 0,
        zbadane: new Set(done),
        badana,
        playerResearchTargetId: badana,
        researchQueue: [], // T10: AI nie ma kolejki gracza — chooseAIResearch przelicza co turę (patrz ABC C-RES-Q4)
        era: empireEpochForOwner(ownerId),
        pieniadzMnoznik: 1,
        tempoGry: player.tempoGry,
        buildingCostPace: player.buildingCostPace,
        kosztJednostekPace: player.kosztJednostekPace,
        wzrostLudnosciPace: player.wzrostLudnosciPace,
        civType: aiOwnerCivMap.get(ownerId) ?? 'grecy',
        civBonusy: [],
        rakietaWystrzelona: false,
      };
      const step = researchStep(aiState, data.tech, gate, _menuDifficulty);
      aiNaukaPoolByOwner.set(ownerId, aiState.nauka);
      aiBadanaByOwner.set(ownerId, aiState.badana);
      aiResearchDone.set(ownerId, aiState.zbadane);
      if (step.completed.length > 0) {
        refreshCityRenderIfEraChanged(syncOwnerEraFromResearch(ownerId));
        for (const c of step.completed) {
          console.log(
            `[AI ${ownerId}] Zbadano: ${c.id} (-${c.koszt} nauki)` +
            (c.awansEpoki ? ' (awans epoki)' : ''),
          );
        }
      }
    }
    function ownerResearchedTechs(ownerId: number): ReadonlySet<string> {
      return ownerId === 0 ? player.zbadane : (aiResearchDone.get(ownerId) ?? new Set<string>());
    }
    function addOwnerResearchedTechs(ownerId: number, ids: Iterable<string>): void {
      if (ownerId === 0) {
        for (const id of ids) player.zbadane.add(id);
        return;
      }
      if (!aiResearchDone.has(ownerId)) aiResearchDone.set(ownerId, new Set<string>());
      const set = aiResearchDone.get(ownerId)!;
      for (const id of ids) set.add(id);
    }

    /**
     * Follow-up „przenieś stolicę" — stolica WYZNACZONA (capitalCityIdByOwner), z
     * fallbackiem na najstarsze miasto gdy brak wpisu (gra jeszcze nic nie wyznaczyła,
     * albo stary zapis sprzed tego follow-upu). Self-healing: gdy wpis wskazuje na
     * miasto, które już nie istnieje / zmieniło właściciela poza tym systemem (nie
     * powinno się zdarzyć, ale defensywnie), też spada na fallback zamiast rzucać.
     */
    function capitalCityIdForOwner(ownerId: number): string | null {
      const explicit = capitalCityIdByOwner.get(ownerId);
      if (explicit && cities.some(c => c.id === explicit && c.ownerId === ownerId)) return explicit;
      return oldestCityOfOwner(ownerId, cities)?.id ?? null;
    }

    /**
     * Follow-up „przenieś stolicę" — akcja gracza z panelu miasta (cityPanel.ts
     * `onSetCapital`). Q1=A: za darmo, bez cooldownu — jedyny warunek to obecna
     * stolica NIE będąca pod oblężeniem. Zwraca true gdy przeniesiono.
     */
    function trySetPlayerCapital(cityId: string): boolean {
      const target = cities.find(c => c.id === cityId);
      if (!target || target.ownerId !== 0) return false;
      const currentCapId = capitalCityIdForOwner(0);
      if (currentCapId === cityId) return false; // już stolica -- nic do zrobienia
      const currentCap = currentCapId ? cities.find(c => c.id === currentCapId) : null;
      if (currentCap?.oblegane) {
        showHintMessage(
          `Nie można przenieść stolicy — ${currentCap.name} jest obecnie oblegana.`,
          4000,
        );
        return false;
      }
      capitalCityIdByOwner.set(0, cityId);
      markCityStateDirty();
      showHintMessage(`${target.name} — nowa stolica.`, 3500);
      return true;
    }

    /**
     * Follow-up „przenieś stolicę" (Q2=A + Q3=A): AI przenosi stolicę PROAKTYWNIE
     * gdy jest ZAGROŻONA (wroga jednostka w promieniu AI_CAPITAL_THREAT_RADIUS
     * heksów), ale jeszcze NIE oblegana (przeniesienie stolicy oblężonej jest
     * zablokowane — ten sam warunek "nie oblegana" co przy akcji gracza). Nowa
     * stolica = własne miasto NAJDALEJ od najbliższego wroga; przy remisie wygrywa
     * miasto wcześniej założone (kolejność iteracji `cities` po filtrze ownera —
     * `cities` zachowuje kolejność founding, bo foundCity/foundCityAt tylko pushują).
     *
     * "Zagrożenie" zdefiniowane ZACHOWAWCZO, wzorem `chooseCityProduction` w
     * game/ai.ts (linia ~613: `enemyUnits = allUnits.filter(u => u.ownerId !== playerId)`,
     * próg `ekspansja_zagroz_zasieg` domyślnie 5 heksów) — DOWOLNA jednostka innego
     * ownera (bez sprawdzania dyplomacji/wojny, spójnie z resztą AI-taktyki w tym
     * pliku). AI_CAPITAL_THREAT_RADIUS=3 (mniejszy niż domyślny próg produkcji 5,
     * bo przeniesienie stolicy to decyzja poważniejsza niż zmiana kolejki budowy —
     * PRÓG DO AKCEPTACJI WŁAŚCICIELA). Wołane raz na turę, na końcu przetwarzania
     * komend danego ownerId w pętli AI (main.ts ownerLoop, koniec ciała pętli).
     */
    const AI_CAPITAL_THREAT_RADIUS = 3;
    function maybeRelocateThreatenedAiCapital(ownerId: number): void {
      if (ownerId <= 0 || eliminatedOwners.has(ownerId)) return;
      const capId = capitalCityIdForOwner(ownerId);
      if (!capId) return;
      const capCity = cities.find(c => c.id === capId && c.ownerId === ownerId);
      if (!capCity || capCity.oblegane) return; // brak stolicy, lub już oblegana -- nie przenosimy

      const myOtherCities = cities.filter(c => c.ownerId === ownerId && c.id !== capCity.id);
      if (myOtherCities.length === 0) return; // nie ma dokąd przenieść

      const enemyUnits = units.filter(u => u.ownerId !== ownerId);
      if (enemyUnits.length === 0) return;

      let nearestToCapital = Infinity;
      for (const eu of enemyUnits) {
        const d = hexDistance(capCity.q, capCity.r, eu.q, eu.r);
        if (d < nearestToCapital) nearestToCapital = d;
      }
      if (nearestToCapital > AI_CAPITAL_THREAT_RADIUS) return; // stolica NIE zagrożona

      // Wybierz własne miasto NAJDALEJ od najbliższego wroga.
      let best: City | null = null;
      let bestDist = -1;
      for (const c of myOtherCities) {
        let minDist = Infinity;
        for (const eu of enemyUnits) {
          const d = hexDistance(c.q, c.r, eu.q, eu.r);
          if (d < minDist) minDist = d;
        }
        if (minDist > bestDist) {
          best = c;
          bestDist = minDist;
        }
      }
      if (!best || bestDist <= nearestToCapital) return; // brak lepszej lokalizacji -- zostaw jak jest

      capitalCityIdByOwner.set(ownerId, best.id);
      markCityStateDirty();
      console.log(
        `[Stolica-AI] ${civLabelForOwner(ownerId)}: stolica ${capCity.name} zagrozona `
        + `(wrog ${nearestToCapital} heks.) -> przeniesiona do ${best.name} (najblizszy wrog ${bestDist} heks.)`,
      );
    }

    const capitalCaptureResourceAccess: OwnerResourceAccess = {
      getTreasury: ownerTreasury,
      setTreasury: setOwnerTreasury,
      getPracaPool: ownerPracaPool,
      setPracaPool: setOwnerPracaPool,
      getNaukaPool: ownerNaukaPool,
      setNaukaPool: setOwnerNaukaPool,
      getResearchedTechs: ownerResearchedTechs,
      addResearchedTechs: addOwnerResearchedTechs,
    };

    /** Czy klucz pary dyplomatycznej "min_max" (diploPairKey) dotyczy ownerId. */
    function diploPairKeyHasOwner(key: string, ownerId: number): boolean {
      const parts = key.split('_');
      return parts.length === 2 && (Number(parts[0]) === ownerId || Number(parts[1]) === ownerId);
    }

    /**
     * Q5=B — pełne usunięcie skasowanej cywilizacji (ownerId, po utracie ostatniego
     * miasta) z list graczy i dyplomacji. NIE usuwa ewentualnych osamotnionych
     * jednostek w polu (poza zakresem RDZENIA) — te po prostu przestają być
     * dowodzone (ownerId filtrowany z aiOwnerList), a wszystkie *ByOwner gettery
     * mają fallback ?? domyślna wartość, więc nie ma ryzyka wyjątku w UI/rendererze.
     */
    function eliminateOwner(ownerId: number): void {
      if (ownerId === 0 || eliminatedOwners.has(ownerId)) return;
      eliminatedOwners.add(ownerId);

      aiSkarbiecByOwner.delete(ownerId);
      aiPracaPoolByOwner.delete(ownerId);
      aiNaukaPoolByOwner.delete(ownerId);
      aiBadanaByOwner.delete(ownerId);
      aiResearchDone.delete(ownerId);
      aiOwnerCivMap.delete(ownerId);
      ownerDisplayName.delete(ownerId);
      simplifiedDiplomacyOwners.delete(ownerId);
      foreignTypeOwners.delete(ownerId);
      typCityCopyOwners.delete(ownerId);
      ownerEraByOwner.delete(ownerId);
      ownerStartEraByOwner.delete(ownerId);
      clusterCapitalOwnerIds.delete(ownerId);
      diplomaticContactEstablished.delete(ownerId);
      battlePowerPtsByOwner.delete(ownerId);
      // Follow-up „przenieś stolicę"/„Power-zdobycze": cywilizacja skasowana, jej
      // wyznaczenie stolicy i (ew. własne) zdobycze nie mają już znaczenia. Zdobycze
      // pokonanego zostały już przejęte przez zwycięzcę WCZEŚNIEJ, w runCapitalCapturePlunder
      // (PRZED tym wywołaniem — snapshot musi być liczony zanim tu wyzerujemy stan).
      capitalCityIdByOwner.delete(ownerId);
      zdobyczePowerByOwner.delete(ownerId);

      for (const key of Array.from(diplomacyRelations.keys())) {
        if (diploPairKeyHasOwner(key, ownerId)) diplomacyRelations.delete(key);
      }
      for (const key of Array.from(diplomacyPairMeta.keys())) {
        if (diploPairKeyHasOwner(key, ownerId)) diplomacyPairMeta.delete(key);
      }
      for (const key of Array.from(diplomacyFactorLog.keys())) {
        if (diploPairKeyHasOwner(key, ownerId)) diplomacyFactorLog.delete(key);
      }
      activeDeals = activeDeals.filter(d => !d.strony.includes(ownerId));

      // Oblężenia PROWADZONE przez ownerId gdzie indziej (inne miasto niż to
      // właśnie przejęte) — porzucamy, bo nie ma już kto ich kontynuować.
      for (const c of cities) {
        if (c.oblegajacyOwnerId === ownerId) {
          delete c.oblegajacyOwnerId;
          c.oblegane = false;
          c.siegeCapitulationPending = false;
        }
      }
      for (const [cid, besieger] of Array.from(siegeBesiegerByCity.entries())) {
        if (besieger === ownerId) {
          siegeBesiegerByCity.delete(cid);
          siegeTurnByCity.delete(cid);
        }
      }
      const siegeKeyPrefix = ownerId + ':';
      for (const key of Array.from(siegeAiStateByKey.keys())) {
        if (key.startsWith(siegeKeyPrefix)) siegeAiStateByKey.delete(key);
      }

      console.log(`[Eliminacja] Cywilizacja ownerId=${ownerId} skasowana (utrata ostatniego miasta).`);
    }

    /**
     * RDZEŃ „przejęcie stolicy" — wołane z OBU ścieżek zdobycia (post-battle +
     * kapitulacja z głodu) TUŻ PO zmianie city.ownerId. Zwraca się cicho (no-op)
     * gdy przejęte miasto nie było stolicą oldOwner — patrz capital-capture.ts.
     *
     * Follow-up „przenieś stolicę": czyta wyznaczenie oldOwner SPRZED przejęcia
     * (`capitalCityIdByOwner.get(oldOwner)`) i po Zdarzeniu 1 (sukcesja) zapisuje
     * nowe wyznaczenie z powrotem.
     *
     * Follow-up „Power-zdobycze": przy ELIMINACJI (Zdarzenie 2) snapshot CAŁEGO
     * Power pokonanego MUSI paść PRZED eliminateOwner() — ten czyści
     * battlePowerPtsByOwner/aiResearchDone dla oldOwner, co ucięłoby składniki
     * bitwy/tech w snapshotcie, gdyby liczyć go po.
     */
    function runCapitalCapturePlunder(city: City, oldOwner: number, newOwner: number): void {
      // #25: frakcja rebeliancka (-99) nie jest realną cywilizacją — nie ma
      // skarbca/stolicy/Power. Bez tego guarda odbicie jej miasta wpadało w
      // ścieżkę "ostatnie miasto -> eliminacja": fałszywy komunikat ELIMINACJA
      // i eliminateOwner(-99) zaśmiecały eliminatedOwners/sejw wpisem -99.
      if (oldOwner === REBEL_FACTION_OWNER_ID) return;
      const designatedCapitalId = capitalCityIdByOwner.get(oldOwner) ?? undefined;
      const outcome = applyCapitalCapturePlunder(
        city, oldOwner, newOwner, cities, capitalCaptureResourceAccess, designatedCapitalId,
      );
      if (!outcome) return;

      if (outcome.event === 'przejecie_stolicy') {
        // SUKCESJA: nowa stolica oldOwner = najstarsze z pozostałych miast (lub brak wpisu).
        if (outcome.newCapitalIdForOldOwner) {
          capitalCityIdByOwner.set(oldOwner, outcome.newCapitalIdForOldOwner);
        } else {
          capitalCityIdByOwner.delete(oldOwner);
        }
        showHintMessage(
          `${city.name}: stolica ${civLabelForOwner(oldOwner)} przejęta przez ${civLabelForOwner(newOwner)} — skarbiec i pula pracy przepadły.`,
          5000,
        );
      } else {
        // Power-zdobycze: CAŁE Power pokonanego (armia/miasta[już 0]/techy/bitwy/
        // ew. jego WCZEŚNIEJSZE zdobycze z poprzednich eliminacji — rekurencyjnie
        // złożone w computeObjectivePower) -> trwały bonus zwycięzcy. Snapshot PRZED
        // eliminateOwner (patrz komentarz funkcji).
        const lostPower = buildObjectivePowerForOwner(oldOwner).power;
        if (lostPower > 0) {
          zdobyczePowerByOwner.set(newOwner, (zdobyczePowerByOwner.get(newOwner) ?? 0) + lostPower);
        }
        showHintMessage(
          `${civLabelForOwner(oldOwner)} — ELIMINACJA! Ostatnie miasto (${city.name}) przejęte przez ${civLabelForOwner(newOwner)}. Skarbiec, nauka i ${outcome.techSkopiowane.length} tech(y) przejęte. Zdobycze Power: +${lostPower}.`,
          6000,
        );
        eliminateOwner(oldOwner);
      }
      markCityStateDirty();
    }

    /** ST-2/ST-3: przejęcie miasta — tylko obrońca na centrum (B); pierścień zostaje. */
    function applyCityCaptureToMap(
      city: City,
      atkRoster: RuntimeUnit[],
      atkOwner: number,
      anchor: RuntimeUnit | null = atkRoster[0] ?? null,
    ): RuntimeUnit | null {
      const oldOwner = city.ownerId;
      const lead = applyCityCaptureAfterBattle(
        city,
        atkRoster,
        atkOwner,
        units,
        anchor?.id ?? atkRoster[0]?.id ?? '',
      );
      if (atkOwner === 0) playerEverOwnedCity = true;
      syncCityGarnizon(city);
      endMapSiege(city.id);
      runCapitalCapturePlunder(city, oldOwner, atkOwner);
      return lead;
    }

    function refreshMapAfterCityCapture(lead: RuntimeUnit | null): void {
      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      hoverKey = null;
      if (lead) {
        if (selectedId === lead.id || selectedId === null) selectedId = lead.id;
        forceVisibleUnitId = lead.id;
        unitRenderer.setSelectionHex(lead.q, lead.r, lead.ownerId);
      }
      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      updateHud();
      refreshD1bHud();
      refreshSiegeMarkers();
      if (lead?.ownerId === 0) {
        const entryCity = cities.find(c => c.q === lead.q && c.r === lead.r);
        if (entryCity) finishUnitEnterCityHex(lead, entryCity);
      }
      const leadId = lead?.id ?? null;
      requestAnimationFrame(() => {
        if (leadId && forceVisibleUnitId === leadId) forceVisibleUnitId = null;
        syncUnitsRender();
      });
    }

    /** Puste miasto — zdobycie bez preBattle / bitwy; jednostka wchodzi na heks miasta. */
    function captureCityWithoutBattle(
      city: City,
      anchor: RuntimeUnit,
      atkRoster: RuntimeUnit[],
    ): void {
      hideSiegeMapPanel();
      hideCityAttackChoice();

      const atkOwner = anchor.ownerId;
      const lead = applyCityCaptureToMap(city, atkRoster, atkOwner, anchor);
      refreshMapAfterCityCapture(lead ?? anchor);

      showCityCaptureNotice(city.name, {
        subtitle: 'Brak obrońców — wojsko weszło do miasta bez walki i bez strat.',
      });
    }

    function clearMapBattleUiState(): void {
      clearPlayerUnitSelection();
      refreshFog();
      updateHud();
    }

    const mapFieldBattleDeps = {
      cities,
      units,
      get turn() { return turn; },
      getTerrainAt: (q: number, r: number): string => {
        const h = map.hexes[keyOf(q, r)];
        return h ? String(h.terenBazowy) : 'Rownina';
      },
      getStructBonus: structureDefenseBonusFor,
      unitDefFor,
      unitHealth,
      unitAtak,
      civLabelForOwner,
      civBonusyForOwnerId,
      eraForOwnerId: empireEpochForOwner,
      civIdForOwner: civTypeForOwner,
      isCityStateForOwner: (ownerId: number) => isOwnerClusterCityState(ownerId, ownerCityStateOpts()),
      lookupUnitDef,
      runtimeToBattleUnit,
      terrainCombatData: terrainCombatData as unknown as readonly TerrainEntry[],
      battleData: data,
      showHint: showHintMessage,
      showPreBattle,
      hidePreBattle,
      applyMapBattleOutcomeWithSummary,
      clearBattleUiState: clearMapBattleUiState,
      createBattleScene: (opts: BattleOpts) => new BattleScene(opts),
      registerMilitiaDef: (id: string, def: Record<string, unknown>) => {
        militiaDefOverrides.set(id, def);
      },
      onQuickSave: () => doQuickSave(false),
    };

    function civLabelForOwner(ownerId: number): string {
      if (ownerId === 0) return String(player.civType || _menuCivId || 'Gracz');
      return ownerDiploLabel(ownerId);
    }

    function finishSiegeStormBattle(
      city: City,
      atkRoster: RuntimeUnit[],
      defRoster: RuntimeUnit[],
      // survivors opcjonalne: auto-szturm (executeSilentSiegeStorm/doSiegeAutoResolve) nie ma
      // realnej listy ocalałych — undefined pozwala applyMapBattleOutcome przejść na gałąź
      // applyAutoLosses (lossAtkPct/lossDefPct), zamiast pustego [] kasującego obie armie (#2).
      res: { winner: BattleResult['winner']; survivors?: BattleUnit[]; log: string[] },
      opts?: {
        atkStart?: Map<string | number, { q: number; r: number }>;
        lossAtkPct?: number;
        lossDefPct?: number;
        summary?: {
          mode: 'auto' | 'manual' | 'szturm';
          atkLabel: string;
          defLabel: string;
          atkCivLabel?: string;
          defCivLabel?: string;
          teren?: string;
        };
        afterSummary?: () => void;
      },
    ): void {
      const oldOwner = city.ownerId;
      const atkStart = opts?.atkStart ?? snapshotRosterPositions(atkRoster);
      const atkOwner = atkRoster[0]?.ownerId;
      const showSummary = atkOwner === 0 && opts?.summary;

      const afterSiegeUi = (): void => {
        if (res.winner === 'atakujacy' && atkOwner !== undefined && city.ownerId === atkOwner && oldOwner !== atkOwner) {
          const lead = units.find(u => u.id === atkRoster[0]?.id) ?? null;
          refreshMapAfterCityCapture(lead);
          const who = atkOwner === 0 ? 'Gracz' : ('AI ' + atkOwner);
          showHintMessage('Szturm udany — ' + city.name + ' zdobyte przez ' + who + '!', 5000);
        } else if (res.winner === 'obronca') {
          showHintMessage('Szturm odparty — oblężenie trwa.', 4500);
          syncUnitsRender();
          cityRenderer.sync(cities, _cityRenderOpts());
          refreshFog();
          updateHud();
          refreshD1bHud();
          refreshSiegeMarkers();
        } else if (res.winner === 'remis') {
          showHintMessage('Szturm: remis — oblężenie trwa.', 3500);
          syncUnitsRender();
          cityRenderer.sync(cities, _cityRenderOpts());
          refreshFog();
          updateHud();
          refreshD1bHud();
          refreshSiegeMarkers();
        }
      };

      const battleOpts = {
        battleQ: city.q,
        battleR: city.r,
        atkStart,
        lossAtkPct: opts?.lossAtkPct,
        lossDefPct: opts?.lossDefPct,
        siegeContext: true as const,
      };

      if (showSummary && opts?.summary) {
        applyMapBattleOutcomeWithSummary(
          atkRoster,
          defRoster,
          res.winner,
          res.survivors,
          battleOpts,
          {
            ...opts.summary,
            placeLabel: city.name + ' (mur)',
          },
          () => {
            afterSiegeUi();
            opts?.afterSummary?.();
          },
        );
      } else {
        applyMapBattleOutcome(atkRoster, defRoster, res.winner, res.survivors, battleOpts);
        afterSiegeUi();
      }
    }

    /** AI szturm bez preBattle (C3-Q2 T1 / gotowe machiny). */
    function executeSilentSiegeStorm(ctx: MapSiegeContext): void {
      const city = cities.find(c => c.id === ctx.city.id);
      const anchor = units.find(u => u.id === ctx.atakujacy.id);
      if (!city || !anchor || !city.maMur) return;

      let atkRoster = collectSiegeAtkRoster(city, anchor);
      atkRoster = appendReadyMachinesToRoster(atkRoster, city, anchor.ownerId);
      if (!cityHasDefenders(city)) {
        captureCityWithoutBattle(city, anchor, atkRoster);
        return;
      }
      const defRoster = collectSiegeDefRoster(city);
      if (defRoster.length === 0) {
        captureCityWithoutBattle(city, anchor, atkRoster);
        return;
      }

      const dHexKey = keyOf(city.q, city.r);
      const dHex = map.hexes[dHexKey];
      const dTeren: string = dHex ? (dHex.terenBazowy as string) : 'Rownina';
      const dStructBonus = structureDefenseBonusFor(city.q, city.r);

      try {
        const atkStartSnap = snapshotRosterPositions(atkRoster);
        const aLeadDef = unitDefFor(atkRoster[0]!);
        const mAtk = rosterFieldPowerM(atkRoster) + rosterSiegeMachinePowerM(atkRoster);
        const mDef = effectiveDefenderM(defRoster, dTeren, dStructBonus, aLeadDef);
        const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
        if (powerRes.winner === 'none') return;

        const winner: BattleResult['winner'] =
          powerRes.winner === 'tie' ? 'remis'
            : powerRes.winner === 'attacker' ? 'atakujacy'
              : 'obronca';

        finishSiegeStormBattle(
          city,
          atkRoster,
          defRoster,
          // survivors: undefined (nie []!) — puste [] = manualSurvivors=[] = kasacja
          // CAŁEJ armii obu stron w post-battle-map.ts. undefined = straty liczone
          // proporcjonalnie z lossAtkPct/lossDefPct (applyAutoLosses), patrz #2.
          { winner, log: [] },
          {
            atkStart: atkStartSnap,
            lossAtkPct: powerRes.lossAtkPct,
            lossDefPct: powerRes.lossDefPct,
          },
        );
        console.log('[Oblezenie AI] szturm auto', city.name, winner);
      } catch (e) {
        console.error('[Oblezenie AI] szturm auto fail:', e);
        startMapSiege(ctx);
      }
    }

    /** C1: szturm z panelu oblężenia → preBattle → bitwa z murem (tylko oblegający gracz). */
    function launchSiegeStormFromMap(ctx: MapSiegeContext): void {
      if (ctx.oblegajacyOwnerId !== 0) {
        showHintMessage(
          'Szturm może rozpocząć tylko oblegający. To oblężenie wroga — broń miasta (OBLEGAJ / Kontynuuj turę).',
          5000,
        );
        return;
      }

      const city = cities.find(c => c.id === ctx.city.id);
      const anchor = units.find(u => u.id === ctx.atakujacy.id);
      if (!city || !anchor) {
        showHintMessage('Szturm: brak miasta lub jednostki atakującej na mapie.', 4000);
        return;
      }
      if (!city.maMur) {
        showHintMessage('Miasto bez muru — użyj zwykłej potyczki, nie szturmu.', 4000);
        return;
      }

      // #50: peek (nie konsumuj) — machiny znikają z city.siegeMachines.ready dopiero gdy
      // gracz potwierdzi szturm (Auto / Pole bitwy), nie przy samym otwarciu preBattle.
      const atkRoster = appendReadyMachinesToRoster(
        collectSiegeAtkRoster(city, anchor),
        city,
        anchor.ownerId,
        false,
      );
      if (!cityHasDefenders(city)) {
        consumeReadyMachines(city);
        captureCityWithoutBattle(city, anchor, atkRoster);
        return;
      }
      const defRoster = collectSiegeDefRoster(city);
      if (defRoster.length === 0) {
        consumeReadyMachines(city);
        captureCityWithoutBattle(city, anchor, atkRoster);
        return;
      }

      const dHexKey = keyOf(city.q, city.r);
      const dHex = map.hexes[dHexKey];
      const dTeren: string = dHex ? (dHex.terenBazowy as string) : 'Rownina';
      const dStructBonus = structureDefenseBonusFor(city.q, city.r);

      const atkLeadDef = unitDefFor(atkRoster[0]!);
      const defSideTitle = defRoster[0]!.typeId === 'Milicja'
        ? 'Milicja (~' + Math.floor((city.population ?? 0) * 0.2) + ')'
        : (defRoster.length > 1 ? 'Garnizon (' + defRoster.length + ')' : defRoster[0]!.typeId);
      const szanse = preBattleSzanseAtkPct(
        atkRoster,
        defRoster,
        dTeren,
        dStructBonus,
        rosterSiegeMachinePowerM(atkRoster),
      );

      const atkCivLabel = civLabelForOwner(anchor.ownerId);
      const defCivLabel = civLabelForOwner(city.ownerId);
      const defCivId = city.ownerId === 0
        ? (player.civType as string || _menuCivId || 'rzymianie')
        : (aiOwnerCivMap.get(city.ownerId) ?? 'grecy');

      const pbInfo: PreBattleInfo = {
        atakujacy: preBattleSideFromRoster(
          atkRoster,
          atkRoster.length > 1 ? 'Szturm (' + atkRoster.length + ')' : anchor.typeId,
          atkCivLabel,
        ),
        obronca: preBattleSideFromRoster(
          defRoster,
          defSideTitle,
          defCivLabel,
        ),
        teren: dTeren,
        szanseAtkPct: szanse,
        miejsce: city.name + ' (mur)',
        lokacja: '(' + city.q + ',' + city.r + ')',
        tura: turn,
        canRetreat: true,
      };

      const atkRosterRef = atkRoster.slice();
      const defRosterRef = defRoster.slice();
      const atkStartSnap = snapshotRosterPositions(atkRosterRef);

      hideSiegeMapPanel();

      function rosterToBattleUnits(roster: RuntimeUnit[], color: number): BattleUnit[] {
        return roster.map(u => runtimeToBattleUnit(u, lookupUnitDef(u.typeId), color));
      }

      function clearBattleUiState(): void {
        clearPlayerUnitSelection();
        refreshFog();
        updateHud();
      }

      function siegeSummaryMeta(mode: 'auto' | 'manual') {
        return {
          mode: 'szturm' as const,
          atkLabel: pbInfo.atakujacy.nazwa,
          defLabel: pbInfo.obronca.nazwa,
          atkCivLabel: pbInfo.atakujacy.cywilizacja,
          defCivLabel: pbInfo.obronca.cywilizacja,
          teren: dTeren,
        };
      }

      function doSiegeAutoResolve(): void {
        // #50: gracz potwierdził Auto-szturm — dopiero teraz realnie zużyj machiny.
        consumeReadyMachines(city!);
        try {
          const atkLead = atkRosterRef[0]!;
          const aLeadDef = unitDefFor(atkLead);
          const mAtk = rosterFieldPowerM(atkRosterRef) + rosterSiegeMachinePowerM(atkRosterRef);
          const mDef = effectiveDefenderM(defRosterRef, dTeren, dStructBonus, aLeadDef);
          const powerRes = resolveAutoBattleByPower({ mAtk, mDef });
          if (powerRes.winner === 'none') {
            showHintMessage('Szturm: brak sił bojowych w składzie', 3000);
            clearBattleUiState();
            return;
          }
          const winner: BattleResult['winner'] =
            powerRes.winner === 'tie' ? 'remis'
              : powerRes.winner === 'attacker' ? 'atakujacy'
                : 'obronca';
          finishSiegeStormBattle(
            city!,
            atkRosterRef,
            defRosterRef,
            // survivors: undefined (nie []) — patrz komentarz w executeSilentSiegeStorm / #2.
            { winner, log: [] },
            {
              atkStart: atkStartSnap,
              lossAtkPct: powerRes.lossAtkPct,
              lossDefPct: powerRes.lossDefPct,
              summary: siegeSummaryMeta('auto'),
              afterSummary: clearBattleUiState,
            },
          );
        } catch (e) {
          console.error('[Oblezenie] auto szturm:', e);
          clearBattleUiState();
        }
      }

      showPreBattle(pbInfo, {
        onAuto: () => { hidePreBattle(); doSiegeAutoResolve(); },
        onBattlefield: () => {
          hidePreBattle();
          setMood('bitwa');
          const bs = new BattleScene({
            attacker: rosterToBattleUnits(atkRosterRef, 0xffd54a),
            defender: rosterToBattleUnits(defRosterRef, 0xc84040),
            teren: dTeren,
            worldTerrain: worldTerrainFromHex(dHex),
            data,
            deploy: true,
            deployPlayerSide: 'atk',
            siege: { defCiv: ikonaIdToBronzeCiv(defCivId) },
            attackerCivBonusy: civBonusyForOwnerId(atkRosterRef[0]?.ownerId ?? 0),
            defenderCivBonusy: civBonusyForOwnerId(defRosterRef[0]?.ownerId ?? 0),
            // BŁĄD D-weryfikacja: patrz komentarz przy pierwszym call site (~linia
            // 11258) — ten szturm oblężniczy w ogóle nie przekazywał ani
            // civLabel, ani civIconId scenie bitwy (medaliony spadały na
            // domyślne "Gracz"/"Przeciwnik" + civIconId 'grecy'). pbInfo już
            // liczy civId poprawnie (preBattleSideFromRoster/civTypeForOwner).
            attackerCivLabel: pbInfo.atakujacy.cywilizacja,
            defenderCivLabel: pbInfo.obronca.cywilizacja,
            attackerCivIconId: pbInfo.atakujacy.civId,
            defenderCivIconId: pbInfo.obronca.civId,
            attackerLeaderName: pbInfo.atakujacy.wodz,
            defenderLeaderName: pbInfo.obronca.wodz,
            attackerEra: empireEpochForOwner(atkRosterRef[0]?.ownerId ?? 0),
            defenderEra: empireEpochForOwner(defRosterRef[0]?.ownerId ?? 0),
            attackerIsCityState: pbInfo.atakujacy.isCityState,
            defenderIsCityState: pbInfo.obronca.isCityState,
            attackerIsBarbarian: pbInfo.atakujacy.isBarbarian,
            defenderIsBarbarian: pbInfo.obronca.isBarbarian,
            onCancel: () => setMood('mapa'),
          });
          bs.play((res) => {
            // #50: scena bitwy zwróciła wynik (deploy nie anulowany) — dopiero teraz
            // realnie zużyj machiny; anulowanie deployu (onCancel powyżej) ich nie traci.
            consumeReadyMachines(city);
            finishSiegeStormBattle(city, atkRosterRef, defRosterRef, res, {
              atkStart: atkStartSnap,
              summary: siegeSummaryMeta('manual'),
              afterSummary: () => {
                setMood('mapa');
                clearBattleUiState();
                bs.dispose();
              },
            });
          });
        },
        onCancel: () => {
          hidePreBattle();
          syncSiegePanelMeta(city);
          showSiegeMapPanel(ctx, siegePanelActions, siegeTurnByCity.get(city.id) ?? 1);
        },
        onSave: () => doQuickSave(false),
      }, { defaultAction: 'manual' });

      console.log('[Oblezenie] szturm preBattle', city.name, 'atk=', atkRoster.length, 'def=', defRoster.length);
    }

    /**
     * Build a synthetic BattleUnit from a units.json record (no matching
     * RuntimeUnit -- used when synthesising sample armies).
     */
    function defToBattleUnit(def: any, idx: number, ownerColor: number): BattleUnit {
      const name: string = def['Jednostka'] ?? 'Jednostka';
      const role: string = def['Rola (linia)'] ?? '';
      const isSuper: boolean = def['Super-jednostka'] === 'TAK';
      const kat = categoryOf(name, role, isSuper, def['Typ']);
      const hp = unitHealth(def);
      return {
        id: 'synth_' + idx + '_' + name,
        nazwa: name,
        kategoria: kat,
        ownerColor,
        stats: def,
        hp,
        maxHp: hp,
      };
    }

    /**
     * Convert a BattleUnit into the CombatUnit shape expected by resolveCombat.
     */
    function battleUnitToCombatUnit(bu: BattleUnit): CombatUnit {
      const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
      return combatUnitFromDef(s, {
        typNazwa: (s['Jednostka'] as string) ?? bu.kategoria,
        hp: bu.hp,
      });
    }

    /**
     * launchTestBattle — legacy dev preset (4× Hastati vs 4× Falanga).
     * Skrót T usunięty 2026-07-06 — bitwy tylko z mapy / playtestów / preBattle.
     */
    /**
     * DUŻA bitwa z presetu → prosto do BattleScene (arena taktyczna, armia vs
     * armia), z pominięciem mapy świata. BITWA-DUZA = pole; OBLEZENIE-DUZE = mur.
     */
    function launchBigPresetBattle(preset: PresetName, siege: boolean): void {
      let armies = buildTestArmies((data as any).units, preset);
      if (siege) armies = ensureSiegeMachinesPreset(armies, (data as any).units);
      if (armies.attacker.length === 0 || armies.defender.length === 0) {
        showHintMessage('Duża bitwa: brak jednostek (sprawdź dane)', 4000);
        return;
      }
      const bOpts: BattleOpts = {
        attacker: armies.attacker,
        defender: armies.defender,
        teren: armies.teren,
        data,
        deploy: true,
        attackerCivLabel: 'Rzym',
        defenderCivLabel: 'Grecja',
        attackerCivBonusy: civBonusyForOwnerId(0),
        defenderCivBonusy: civBonusyForOwnerId(1),
        attackerEra: player.era,
        defenderEra: player.era,
        onCancel: () => setMood('mapa'),
      };
      if (siege) bOpts.siege = { defCiv: 'grecja' };
      // Ten preset to jednocześnie pierwszy gest gracza w tym trybie playtest
      // (patrz doStartPlaytestWalkaMapy: gałąź bitwaDuza/oblezDuze returnuje
      // przed startGameMusic) — więc epoka + muzyka startują tu wprost w 'bitwa'.
      // Ten sam reset wyciszenia co w startGameMusic() (C-AUD-Q5=A) — to też
      // "start nowej rozgrywki", tylko inną ścieżką.
      setEra(player.era);
      musicEnabled = true;
      startMusic('bitwa');
      const bs = new BattleScene(bOpts);
      bs.play((res) => {
        const wl = res.winner === 'atakujacy' ? 'Rzym (atak)'
                 : res.winner === 'obronca'  ? 'Grecja (obrona)' : 'Remis';
        showHintMessage('Duża bitwa — wynik: <b>' + wl + '</b>', 6000);
        setMood('mapa');
        bs.dispose();
      });
    }

    function launchTestBattle(): void {
      const PLAYER_COLOR  = 0xffd54a;
      const ENEMY_COLOR   = 0xc84040;

      if (playtestWalkaActive) {
        showHintMessage('Playtest 1v1: użyj kliku wroga na mapie', 3500);
        return;
      }

      // --- Look up Hastati and Falanga from data.units ---
      // The 'Jednostka' field in the JSON is plain ASCII for these two units.
      let legDef: any = (data.units as any[]).find((u: any) => u['Jednostka'] === 'Hastati');
      let falDef: any = (data.units as any[]).find((u: any) => u['Jednostka'] === 'Falanga');

      // Fallback: first unit whose category resolves to 'miecznik'
      if (!legDef) {
        legDef = (data.units as any[]).find((u: any) => {
          const nm: string = u['Jednostka'] ?? '';
          const rl: string = u['Rola (linia)'] ?? '';
          const isSup: boolean = u['Super-jednostka'] === 'TAK';
          return categoryOf(nm, rl, isSup, u['Typ']) === 'miecznik';
        });
        console.warn('[launchTestBattle] Hastati not found, using fallback:', legDef?.['Jednostka'] ?? 'NONE');
      }
      // Fallback: first unit whose category resolves to 'wlocznik'
      if (!falDef) {
        falDef = (data.units as any[]).find((u: any) => {
          const nm: string = u['Jednostka'] ?? '';
          const rl: string = u['Rola (linia)'] ?? '';
          const isSup: boolean = u['Super-jednostka'] === 'TAK';
          return categoryOf(nm, rl, isSup, u['Typ']) === 'wlocznik';
        });
        console.warn('[launchTestBattle] Falanga not found, using fallback:', falDef?.['Jednostka'] ?? 'NONE');
      }

      // Last-resort hardcoded stubs if data has neither
      if (!legDef) {
        legDef = {
          'Jednostka': 'Hastati',
          'Rola (linia)': 'Wręcz',
          'Próg dezercji (% health)': 0.15,
          'Zasięg ataku (hex)': 2,
          'Ilość pocisków': 2,
          'Ruch w bitwie (heksy)': 3,
          'Kara obrony z flanki (%)': 15,
          'Kara obrony z tyłu (%)': 30,
          meleeAttack: 8, meleeDefence: 7, weaponDamage: 8,
          armor: 9, piercing: 4, chargeBonus: 8, health: 19, missileAttack: 15,
        };
      }
      if (!falDef) {
        falDef = {
          'Jednostka': 'Falanga',
          'Rola (linia)': 'Wręcz',
          'Próg dezercji (% health)': 0.2,
          'Zasięg ataku (hex)': null,
          'Ilość pocisków': null,
          'Ruch w bitwie (heksy)': 3,
          'Kara obrony z flanki (%)': 50,
          'Kara obrony z tyłu (%)': 80,
          meleeAttack: 5, meleeDefence: 10, weaponDamage: 5,
          armor: 6, piercing: 2, chargeBonus: 6, health: 25, missileAttack: 0,
        };
      }

      // --- Build 4 attacker BattleUnit (Hastati) ---
      const legHp  = unitHealth(legDef);
      const legAtk = unitAtak(legDef);
      // categoryOf uses normalised name -- 'Hastati' matches 'hastati' -> 'legionista'
      const legKat = 'miecznik';
      const attackerUnits: BattleUnit[] = [0, 1, 2, 3].map((i): BattleUnit => ({
        id: 'atk' + i,
        nazwa: 'Hastati',
        kategoria: legKat,
        ownerColor: PLAYER_COLOR,
        stats: legDef,
        hp: legHp,
        maxHp: legHp,
      }));

      // --- Build 4 defender BattleUnit (Falanga) ---
      const falHp  = unitHealth(falDef);
      const falAtk = unitAtak(falDef);
      // categoryOf: 'Falanga' matches 'falanga' -> 'wlocznik'
      const falKat = 'wlocznik';
      const defenderUnits: BattleUnit[] = [0, 1, 2, 3].map((i): BattleUnit => ({
        id: 'def' + i,
        nazwa: 'Falanga',
        kategoria: falKat,
        ownerColor: ENEMY_COLOR,
        stats: falDef,
        hp: falHp,
        maxHp: falHp,
      }));

      // --- TERRAIN: first player unit's hex, else 'Rownina' ---
      const playerRaw = units.filter(u => u.ownerId === 0);
      let teren = 'Rownina';
      if (playerRaw.length > 0) {
        const firstUnit = playerRaw[0]!;
        const hexKey = keyOf(firstUnit.q, firstUnit.r);
        const hex = map.hexes[hexKey];
        if (hex && hex.terenBazowy) teren = hex.terenBazowy as string;
      }

      // --- szanseAtkPct: M armii (auto-walka v2b) ---
      const mAtkDemo = armyFieldPower(legDef) * attackerUnits.length;
      const mDefRaw = armyFieldPower(falDef) * defenderUnits.length;
      const terrMultDemo = terrainDefenseMultiplier(
        teren,
        String(legDef['Rola (linia)'] ?? ''),
        terrainCombatData as unknown as TerrainEntry[],
      );
      const mDefDemo = Math.round(mDefRaw * terrMultDemo * 10) / 10;
      const szanseAtkPct = autoBattleWinPct(mAtkDemo, mDefDemo);

      // --- PreBattleInfo ---
      const pbInfo: PreBattleInfo = {
        atakujacy: {
          nazwa: 'Rzym (Legion)',
          cywilizacja: 'Rzym',
          civId: 'rzymianie',
          era: player.era,
          units: attackerUnits.map((bu): PreBattleUnit => ({
            nazwa:     bu.nazwa,
            kategoria: bu.kategoria,
            hp:        bu.hp,
            maxHp:     bu.maxHp,
            atak:      legAtk,
            moc:       armyFieldPower(legDef),
          })),
        },
        obronca: {
          nazwa: 'Grecja (Falanga)',
          cywilizacja: 'Grecja',
          civId: 'grecy',
          era: player.era,
          units: defenderUnits.map((bu): PreBattleUnit => ({
            nazwa:     bu.nazwa,
            kategoria: bu.kategoria,
            hp:        bu.hp,
            maxHp:     bu.maxHp,
            atak:      falAtk,
            moc:       armyFieldPower(falDef),
          })),
        },
        teren,
        szanseAtkPct,
        miejsce: teren,
        tura: turn,
        canRetreat: true,
      };

      // --- Open pre-battle overlay ---
      showPreBattle(pbInfo, {
        onAuto: () => {
          // Quick auto-resolve via resolveCombat on lead units
          const atkLead = attackerUnits[0];
          const defLead = defenderUnits[0];
          if (atkLead && defLead) {
            const cu_atk = battleUnitToCombatUnit(atkLead);
            const cu_def = battleUnitToCombatUnit(defLead);
            const result = resolveCombat(cu_atk, cu_def, {
              defenderTerrain: teren,
              attackerCivBonusy: civBonusyForOwnerId(0),
              defenderCivBonusy: civBonusyForCivKey('grecy', data.civs),
            });
            const winnerLabel =
              result.winner === 'attacker' ? pbInfo.atakujacy.nazwa :
              result.winner === 'defender' ? pbInfo.obronca.nazwa   : 'Remis';
            showHintMessage(
              'Bitwa (auto): <b>' + winnerLabel + '</b> wygrywa' +
              ' \xb7 Rundy: ' + result.rounds,
              4000,
            );
          } else {
            showHintMessage('Bitwa (auto): brak jednostek bojowych', 3000);
          }
        },
        onBattlefield: () => {
          setMood('bitwa');
          const bs = new BattleScene({
            attacker: attackerUnits,
            defender: defenderUnits,
            teren,
            data,
            deploy: true,
            attackerCivBonusy: civBonusyForOwnerId(0),
            defenderCivBonusy: civBonusyForOwnerId(1),
            onCancel: () => setMood('mapa'),
          });
          bs.play((res) => {
            const winnerLabel =
              res.winner === 'atakujacy' ? pbInfo.atakujacy.nazwa : pbInfo.obronca.nazwa;
            showHintMessage('Bitwa: <b>' + winnerLabel + '</b> wygrywa', 4000);
            setMood('mapa');
            bs.dispose();
          });
        },
        onCancel: () => {
          // preBattle hides itself on button click; nothing extra needed
        },
        onSave: () => doQuickSave(false),
      }, { defaultAction: 'manual' });
    }

    /** Domyślna nazwa sejwu z kontekstu bieżącej rozgrywki (stolica, rok, mapa, trudność). */
    function currentSaveLabel(kind: SaveLabelKind = 'manual'): string {
      const capId = capitalCityIdForOwner(0);
      let headline = capId ? (cities.find(c => c.id === capId)?.name ?? '') : '';
      if (!headline) headline = cities.find(c => c.ownerId === 0)?.name ?? '';
      if (!headline) {
        headline = clusterPlayerStartCityName
          || playerStartCityName(data.civs, _menuCivId, data.cityNamesPools);
      }
      return buildDefaultSaveLabel({
        kind,
        turn,
        headline,
        mapSize: _menuMapSize,
        difficulty: _menuDifficulty,
      });
    }

    /**
     * Snapshot stanu gry do SaveGame (bez zapisu na dysk).
     */
    function buildSaveGameSnapshot(label?: string): SaveGame {
      const cityProdSave: Record<string, any> = {};
      for (const [cid, prod] of cityProd.entries()) cityProdSave[cid] = prod;
      const cityBuiltSave: Record<string, string[]> = {};
      for (const [cid, blt] of cityBuilt.entries()) cityBuiltSave[cid] = blt.slice();
      const aiResSave: Array<[number, string[]]> = [];
      for (const [oid, zbadane] of aiResearchDone.entries()) aiResSave.push([oid, Array.from(zbadane)]);
      const diploSave: Record<string, any> = {};
      for (const [key, rel] of diplomacyRelations.entries()) diploSave[key] = rel;
      const savedAt = new Date().toISOString();
      const marchSave = plannedMarchesToSave(plannedMarches);
      return {
        wersja: 2,
        tura: turn,
        seed: _gameSeed,
        units: units.slice(),
        cities: cities.slice(),
        explored: Array.from(explored),
        autoMarch: marchSave.autoMarch,
        plannedMarches: marchSave.plannedMarches,
        gracz: {
          skarbiec: player.skarbiec,
          nauka:    player.nauka,
          era:      player.era,
          zbadane:  Array.from(player.zbadane),
          badana:   player.badana,
          researchQueue: player.researchQueue.slice(),
          tempoGry: player.tempoGry,
          buildingCostPace: player.buildingCostPace,
          kosztJednostekPace: player.kosztJednostekPace,
          wzrostLudnosciPace: player.wzrostLudnosciPace,
        },
        cityProd:       cityProdSave,
        cityBuilt:      cityBuiltSave,
        aiResearchDone: aiResSave,
        diploRelations: diploSave,
        tradeRoutes:    tradeRoutes.slice(),
        meta: {
          label: label ?? currentSaveLabel('manual'),
          savedAt,
          saveOrigin: _saveOrigin,
          newGameParams: _lastNewGameParams
            ? { ..._lastNewGameParams, seed: _gameSeed }
            : undefined,
          loadMapSize: _menuMapSize,
          loadTypSwiata: _menuTypSwiata,
          loadCivId: _menuCivId,
          loadLandFraction: _lastNewGameParams?.landFractionPercent ?? 30,
          empireFoodStates: Array.from(empireFoodStates.entries()),
          playerPracaPool,
          siegeTurnByCity: Array.from(siegeTurnByCity.entries()),
          siegeBesiegerByCity: Array.from(siegeBesiegerByCity.entries()),
          siegeAiStateByKey: Array.from(siegeAiStateByKey.entries()),
          pendingDiplomacyInbox: pendingDiplomacyInbox.slice(),
          aiOneShotGiftLastTurn: Array.from(aiOneShotGiftLastTurn.entries()),
          aiTradeAgreementLastProposalTurn: Array.from(aiTradeAgreementLastProposalTurn.entries()),
          aiAiTradeAgreementLastTurn: Array.from(aiAiTradeAgreementLastTurn.entries()),
          aiResourceTradeLastProposalTurn: Array.from(aiResourceTradeLastProposalTurn.entries()),
          diplomaticContactEstablished: Array.from(diplomaticContactEstablished),
          diplomaticallyDiscoveredOwners: Array.from(diplomaticallyDiscoveredOwners),
          diplomaticDiscoveryPopupShown: Array.from(diplomaticDiscoveryPopupShown),
          diplomacyDeals: activeDeals.slice(),
          diplomacyPairMeta: Array.from(diplomacyPairMeta.entries()),
          diplomacyFactorLog: Array.from(diplomacyFactorLog.entries()),
          aiOwnerCivMap: Array.from(aiOwnerCivMap.entries()),
          ownerDisplayName: Array.from(ownerDisplayName.entries()),
          zlozeGrants: zlozeGrants.slice(),
          surowiecBooleanGrants: basketTransferCtx.surowiecBooleanGrants,
          battlePowerPtsByOwner: Array.from(battlePowerPtsByOwner.entries()),
          capitalCityIdByOwner: Array.from(capitalCityIdByOwner.entries()),
          // Audyt #44: aiSkarbiecByOwner nie bylo w snapshotcie -- czyszczone przy
          // load bez odtworzenia, wiec skarbiec AI zerowal sie po kazdym wczytaniu.
          aiSkarbiecByOwner: Array.from(aiSkarbiecByOwner.entries()),
          aiPracaPoolByOwner: Array.from(aiPracaPoolByOwner.entries()),
          aiNaukaPoolByOwner: Array.from(aiNaukaPoolByOwner.entries()),
          aiBadanaByOwner: Array.from(aiBadanaByOwner.entries()),
          zdobyczePowerByOwner: Array.from(zdobyczePowerByOwner.entries()),
          lootedVillageHexKeys: Array.from(lootedVillageHexKeys),
          eliminatedOwners: Array.from(eliminatedOwners),
          ownerEraByOwner: Array.from(ownerEraByOwner.entries()),
          ownerStartEraByOwner: Array.from(ownerStartEraByOwner.entries()),
          placedImprovements: Array.from(placedImprovements.entries()),
          hexClearingStates: Array.from(hexClearingStates.entries()),
          pendingImprovementsTurn: pendingImprovementsTurn.toSave(),
          completedWorldWonders: completedWorldWonders.slice(),
          placedWorldWonders: placedWorldWonders.slice(),
          // Audyt #15: profile miast-panstw i klastrow -- byly wypelniane WYLACZNIE
          // w nowej grze (applyClusterStartPlan/spawnPendingSameTypeRivals) i nigdy
          // nie trafialy do snapshotu.
          simplifiedDiplomacyOwners: Array.from(simplifiedDiplomacyOwners),
          foreignTypeOwners: Array.from(foreignTypeOwners),
          typCityCopyOwners: Array.from(typCityCopyOwners),
          clusterCapitalOwnerIds: Array.from(clusterCapitalOwnerIds),
          clusterPlacement,
          // Audyt #42: barbCamps nie bylo w snapshotcie -- obozy z zapisu
          // przepadaly (lub zostawaly z poprzedniej gry na innej mapie).
          barbCamps: barbCamps.slice(),
          // Audyt #43: cityRelig/autoManageCities nie byly ani zapisywane, ani
          // czyszczone -- kolizja id 'cityN' po restarcie skutkowala zombie
          // stanem religii/auto-zarzadzania z poprzedniej gry.
          cityRelig: Array.from(cityRelig.entries()),
          autoManageCities: Array.from(autoManageCities),
        },
        mapQuality: _currentRenderOptions.renderQuality,
        renderQuality: _currentRenderOptions.renderQuality,
        mapDetailQuality: _currentRenderOptions.mapDetailQuality,
      };
    }

    function persistSaveToSlot(slotId: string, label: string): boolean {
      try {
        const ok = saveToLocal(slotId, buildSaveGameSnapshot(label));
        if (ok) setLastPlayedSlotId(slotId);
        return ok;
      } catch (eSave) {
        console.error('[Save] Blad:', eSave);
        return false;
      }
    }

    /**
     * Szybki zapis (Ctrl+S, przed bitwą) — slot autosave bez okna dialogowego.
     */
    function doQuickSave(showHintOnSuccess = true): boolean {
      const ok = persistSaveToSlot(AUTOSAVE_SLOT_ID, currentSaveLabel('quick'));
      if (ok) {
        if (showHintOnSuccess) showHintMessage('Szybki zapis (tura ' + turn + ')', 3000);
        console.log('[Save] autosave tura=' + turn);
      } else if (showHintOnSuccess) {
        showHintMessage('Zapis nieudany (brak localStorage?)', 3000);
      }
      return ok;
    }

    // -----------------------------------------------------------------------
    // M: rotacyjny autozapis — trzyma 10 ostatnich stanów wstecz (autosave-1..10),
    // wykonywany automatycznie co N tur (domyślnie co turę). Częstotliwość w
    // localStorage (zmienialna w Ustawieniach). Slot 'autosave' (Ctrl+S) — osobno.
    // -----------------------------------------------------------------------
    const AUTOSAVE_ROT_COUNT = 10;
    const AUTOSAVE_ROT_IDX_KEY = 'thegame.autosave.rotIdx';
    const AUTOSAVE_FREQ_KEY = 'thegame.autosave.freq';

    function getAutosaveFrequency(): number {
      try {
        const v = parseInt(localStorage.getItem(AUTOSAVE_FREQ_KEY) ?? '1', 10);
        return Number.isFinite(v) && v >= 1 ? v : 1;
      } catch { return 1; }
    }
    function setAutosaveFrequency(n: number): void {
      try { localStorage.setItem(AUTOSAVE_FREQ_KEY, String(Math.max(1, Math.round(n)))); } catch { /* brak localStorage */ }
    }

    /** Zapis do kolejnego slotu rotacji (1..10), zachowując 10 ostatnich wstecz. */
    function doRotatingAutosave(): void {
      let idx = 0;
      try {
        const prev = parseInt(localStorage.getItem(AUTOSAVE_ROT_IDX_KEY) ?? '-1', 10);
        idx = (((Number.isFinite(prev) ? prev : -1) + 1) % AUTOSAVE_ROT_COUNT + AUTOSAVE_ROT_COUNT) % AUTOSAVE_ROT_COUNT;
      } catch { idx = 0; }
      const slot = 'autosave-' + (idx + 1);
      try {
        const ok = saveToLocal(slot, buildSaveGameSnapshot(currentSaveLabel('autosave')));
        if (ok) {
          setLastPlayedSlotId(slot);
          try { localStorage.setItem(AUTOSAVE_ROT_IDX_KEY, String(idx)); } catch { /* ignore */ }
          console.log('[Autosave] rotacyjny slot=' + slot + ' tura=' + turn);
        }
      } catch (eRot) {
        console.error('[Autosave] blad rotacyjnego zapisu:', eRot);
      }
    }

    // -----------------------------------------------------------------------
    // End turn (N key) + Gallery toggle (G key) + Fog toggle (F key)
    // + City founding (B key)
    // If animation is running, snap unit to destination first.
    // -----------------------------------------------------------------------

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // --- Escape: close city panel / exit build mode ---
      if (e.key === 'Escape') {
        if (isSaveLoadDialogOpen()) {
          hideSaveLoadDialog();
          return;
        }
        if (isGamePauseMenuOpen()) {
          hideGamePauseMenu();
          return;
        }
        if (tryCloseCityUxFrameFromKeyboard() || (isCityPanelOpen() && closeCityPanelIfOpen())) {
          e.preventDefault();
          hideCityUnitPick();
          requestAnimationFrame(() => tryOpenNextAutoDiploAudience());
          return;
        }
        if (okolicaMapEditCityId) {
          exitOkolicaMapMode();
          showHintMessage('Tryb okolicy zakończony.', 2500);
          return;
        }
        if (buildModeOpen) {
          exitBuildMode();
          return;
        }
        if (dismissPlayerUnitSelectionIfAny()) {
          return;
        }
        hideCityPanelFull();
        return;
      }

      // --- Spacja: przejdź do następnej jednostki gracza z dostępnym ruchem (auto-cykl „bęben") ---
      if (e.code === 'Space' || e.key === ' ') {
        const ae = document.activeElement as HTMLElement | null;
        if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
        if (e.repeat || galleryOn || !isWorldMapUnitMode()) return;
        e.preventDefault();
        cycleToNextMovableUnit(selectedId);
        return;
      }

      // --- Gallery toggle ---
      if (e.key.toLowerCase() === 'g') {
        galleryOn = !galleryOn;
        if (galleryOn) {
          hideCityPanelFull();
          enterGallery();
        } else {
          exitGallery();
        }
        return;
      }

      // --- F: pełne wyłączenie FoW (dev) — renderuje całą mapę, wolniejsze ---
      if (e.code === 'KeyF' || e.key.toLowerCase() === 'f') {
        if (e.repeat) return;
        if (!FOG_DEV_SHORTCUTS) return;
        if (galleryOn) return;
        e.preventDefault();
        toggleDevFogFull();
        return;
      }

      // --- M: odkryj / zakryj ląd (test) — ocean ukryty, FoW przy jednostkach zostaje ---
      if (e.code === 'KeyM' || (e.key.toLowerCase() === 'm' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
        if (e.repeat) return;
        if (!FOG_DEV_SHORTCUTS) return;
        if (galleryOn) return;
        e.preventDefault();
        toggleDevRevealAllLand();
        return;
      }

      // --- B: Found a city on the last hovered/clicked hex ---
      if (e.key.toLowerCase() === 'b') {
        // Gallery mode: ignore.
        if (galleryOn) return;

        // Use the last hex the player hovered over or explicitly set (lastBHex).
        // Fallback: if a unit is selected, use that unit's position.
        let foundQ: number | null = null;
        let foundR: number | null = null;

        if (lastBHex !== null) {
          foundQ = lastBHex.q;
          foundR = lastBHex.r;
        } else if (hoverKey !== null) {
          const parts = hoverKey.split(',');
          if (parts.length === 2) {
            foundQ = parseInt(parts[0]!, 10);
            foundR = parseInt(parts[1]!, 10);
          }
        } else if (selectedId !== null) {
          const sel = units.find(x => x.id === selectedId);
          if (sel && sel.ownerId === 0) {
            foundQ = sel.q;
            foundR = sel.r;
          }
        }

        if (foundQ === null || foundR === null) {
          showHintMessage('Nie wybrano heksu — najedz na pole i nacisnij B', 3000);
          return;
        }
        tryFoundPlayerCityAt(foundQ, foundR);
        return;
      }

      // --- Ctrl+S: Save game (step K) ---
      if ((e.key.toLowerCase() === 's') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doQuickSave(true);
        return;
      }

      // --- Ctrl+L: Load game — wybór slotu ---
      if ((e.key.toLowerCase() === 'l') && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openLoadGameDialog(true);
        return;
      }

      // --- N: End turn ---
      if (e.key.toLowerCase() === 'n') {
        if (playtestWalkaActive) return;
        // R-PIERWSZE-MIASTO: nie można kończyć tury dopóki brak pierwszego miasta
        // (inaczej gracz „przeklikuje" tury bez miasta — wariant tego samego problemu).
        if (isAwaitingFirstPlayerCity()) {
          showHintMessage('Najpierw załóż pierwsze miasto (🔨 → Załóż miasto · B), potem zakończ turę.', 3500);
          return;
        }
        // #12 fix: trwa modalna bitwa / zawieszona faza AI (preBattle) — nie startuj drugiej tury.
        if (isPreBattleOpen() || aiTurnAwaitingBattle || aiCmdResume) return;
        // Gallery mode: ignore end-turn key.
        if (galleryOn) return;
        // P3b: Block turns after game over.
        if (gameOver) { showHintMessage('Gra zakonczona. Kliknij "Nowa gra" by zagrac ponownie.', 3000); return; }
        if (endTurnInProgress) return;
        e.preventDefault();
        endTurnInProgress = true;

        void (async () => {
          const nextTurnNum = turn + 1;
          beginTurnTransition(nextTurnNum);
          await yieldTurnTransitionUi();

        try {
        // B2-Q5: wyczyść flagi buntu z poprzedniej tury (chip/ikona do końca tury).
        for (const st of cityOrderState.values()) {
          if (st.bunt) st.bunt = undefined;
        }

        // Snap any in-flight animation to its destination.
        if (isAnimating && anim !== null) {
          const u = units.find(x => x.id === anim!.id);
          if (u) {
            const stack = anim.movingStackIds
              .map(sid => units.find(x => x.id === sid))
              .filter((su): su is RuntimeUnit => su != null);
            for (const su of stack) {
              su.q = anim.destQ;
              su.r = anim.destR;
            }
            deductStackRuchLeft(stack, anim.cost);
            // TEMAT #15: woda -> zaokrętowanie, ląd -> zejście na ląd.
            applyEmbarkStateAfterMove(stack, map);
          }
          anim = null;
          isAnimating = false;
        }
        // Zwiadowcy gracza: auto-zwiedzanie nieużytego ruchu (mgła + kontakt z obcymi).
        {
          const scoutExplore = runScoutsAutoExplore(units, map, explored, 0, unitSight);
          if (scoutExplore.movedUnitIds.length > 0) {
            syncUnitsRender();
            refreshFog();
          }
        }
        evictForeignUnitsFromCityHexes();
        // Restore movement for all units
        for (const u of units) {
          u.ruchLeft = u.ruch;
          if (u.oblegaCityId) u.ruchLeft = 0;
          // Mechanizm "Zastąp" (ZASTAP-JEDNOSTKI-PLAN.md): raz na turę na jednostkę.
          if (u.replaceUsedThisTurn) u.replaceUsedThisTurn = false;
        }
        selectedId = null;
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
        unitRenderer.clearPathRoute();
        hoverKey = null;
        setTurnTransition(6, 'Zakończenie ruchów gracza…', 'Gracz', nextTurnNum);
        await yieldTurnTransitionUi();
        turn++;

        // Chatki: nagroda już przyznana — wpis w WYDARZENIACH tylko do końca tury bieżącej.
        villageEventLog.length = 0;
        // TEMAT #5: log tras handlowych — ta sama zasada (widoczny do końca tury bieżącej).
        tradeRouteEventLog.length = 0;

        // M: rotacyjny autozapis co N tur (domyślnie co turę) — 10 ostatnich wstecz.
        if (turn % getAutosaveFrequency() === 0) doRotatingAutosave();

        pendingImprovementsTurn.commitTurn();

        setTurnTransition(10, 'Dyplomacja i traktaty…', 'Gracz', nextTurnNum);
        await yieldTurnTransitionUi();
        resetTrustPnGainedForPlayerTurn();

        try {
          runDiplomacyTurnTick();
        } catch (eDiploTick) {
          console.error('[Dyplomacja] Blad ticku v1.1:', eDiploTick);
        }

        // --- Per-turn economy tick (task 13B) ---
        setTurnTransition(14, 'Ekonomia imperium…', 'Gracz', nextTurnNum);
        await yieldTurnTransitionUi();
        // Advance every city's economy: terrain yields -> net food ->
        // population growth/starvation, persisting the food store on the city.
        // Wrapped defensively so a data anomaly can never break the turn loop.
        try {
          // Map runtime units to the minimal EconUnit shape for upkeep/food accounting.
          const econUnits: EconUnit[] = units.map(u => ({
            ownerId: u.ownerId,
            typeId:  u.typeId,
            camping: false,  // no camping state in v0.1; all units treated as marching
          }));
          const ownerCivMap = new Map<number, string>();
          ownerCivMap.set(0, (player.civType as string) || 'grecy');
          for (const [oid, civ] of aiOwnerCivMap) ownerCivMap.set(oid, civ);
          const popBeforeTick = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + c.population, 0);

          // --- Handel E3: odswiez trasy handlowe gracz<->obca cywilizacja ---
          // Filtr zewnetrzny + pokoj stosuje refreshTradeRoutes samo; tutaj tylko
          // wykluczamy barbarzyncow (nie sa stronami handlu) i budujemy isAtWar +
          // hasTradeTreaty (C-HANDEL-UMOWA=B, 2026-07-23: sam pokoj juz NIE wystarcza,
          // trasa wymaga aktywnej Umowy Handlowej -- ta sama bramka co activeDeals
          // uzywana gdzie indziej w tym pliku, tylko wstrzykniete jako predykat, zeby
          // trade-routes.ts nie musial znac stanu dyplomacji, analogicznie do isAtWar).
          const tradeCities = cities.filter(c => !isBarbarian(c.ownerId));
          const tradeParams = loadTradeRouteParams(
            data.econParams as unknown as Parameters<typeof loadTradeRouteParams>[0],
            _menuDifficulty,
          );
          const isAtWarFn = (a: number, b: number): boolean => getDiploRelation(a, b).status === 'wojna';
          const hasTradeTreatyFn = (a: number, b: number): boolean =>
            hasTreaty(activeDeals, a, b, RodzajTraktatu.UmowaHandlowa);
          const prevTradeRoutes = tradeRoutes;
          try {
            tradeRoutes = refreshTradeRoutes(
              tradeCities,
              tradeRoutes,
              map,
              cityBuilt,
              isAtWarFn,
              hasTradeTreatyFn,
              tradeParams,
            );
          } catch (eTrade) {
            console.error('[Handel] Blad odswiezania tras:', eTrade);
          }
          tradeRouteCountByCity = computeTradeRouteCountByCity(tradeRoutes);
          try {
            recomputeTradeRouteResourceGrants();
          } catch (eTradeGrant) {
            console.error('[Handel] Blad przeliczania grantow z trasy:', eTradeGrant);
          }
          const tradeIncomeParams = loadTradeRouteIncomeParams(
            data.econParams as unknown as Parameters<typeof loadTradeRouteIncomeParams>[0],
            _menuDifficulty,
          );
          const tradeIncomeByCity = computeTradeRouteIncomeByCity(tradeRoutes, tradeIncomeParams);
          // TEMAT #5: powiadomienia WYDARZENIA o powstaniu/zerwaniu szlaku (tylko gracz;
          // tradeRoutes zawiera WYLACZNIE trasy gracz<->obcy, AI<->AI tu nie istnieje).
          try {
            reportTradeRouteEvents(
              prevTradeRoutes, tradeRoutes, tradeCities, map, tradeParams, cityBuilt,
              isAtWarFn, hasTradeTreatyFn, tradeIncomeParams,
            );
          } catch (eTradeEv) {
            console.error('[Handel] Blad powiadomien o trasach:', eTradeEv);
          }

          const econ = advanceCityEconomy(
            cities, map, data, _menuDifficulty, econUnits, growthMultMap, cityBuilt,
            player.era, player.zbadane, ownerCivMap, orderMultMap,
            empireEpochForOwner, unlockedTechSetForOwner,
            player.wzrostLudnosciPace ?? 'wysoki',
            tradeRouteCountByCity, tradeIncomeByCity,
            cityRelig,
            // CUDA-EKON-01: dotyczy gracza I AI (ownerId-agnostic) — patrz raport C-CUDA-BONUS=A.
            buildWonderCityYieldsByOwnerMap(cities.map(c => c.ownerId)),
          );
          powerSnapshotsForTurn = buildPowerSnapshotsForTurn(econ);
          refreshObjectivePowerCache();
          lastCityKulturaTick.clear();
          aiWonderPracaTickByCity.clear();
          for (const tk of econ.perCity) {
            lastCityKulturaTick.set(tk.cityId, tk.kultura);
            aiWonderPracaTickByCity.set(tk.cityId, tk.doBudynkow);
          }
          try {
            const upkeepParams = loadUpkeepParams(data.econParams, _menuDifficulty);
            const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
            advanceEmpireFood(econ, econUnits, empireFoodStates, upkeepParams, efParams, unitFoodTbl);
            if (getEmpireFoodReserve(0) < 0) {
              showHintMessage('Głód wojska — zapasy państwa ujemne!', 3000);
              const starv = applyArmyStarvationHpLoss(
                units,
                0,
                efParams.glodWojskaHpFrac,
                (typeId) => unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {}),
              );
              if (starv.damagedCount > 0) {
                refreshFog();
              }
              if (starv.destroyedIds.length > 0) {
                // #72: sprzątanie oblężenia/garnizonu jak w disbandPlayerUnit — jednostka
                // ginąca z głodu nie może zostawić za sobą wiszącego oblegaCityId ani
                // zawyżonego licznika city.garnizon.
                const destroyedSet = new Set(starv.destroyedIds);
                const siegeCityIdsAffected = new Set<string>();
                const garnizonCitiesAffected = new Map<string, City>();
                for (const u of units) {
                  if (!destroyedSet.has(u.id)) continue;
                  if (u.oblegaCityId) siegeCityIdsAffected.add(u.oblegaCityId);
                  if (u.inGarnizon === true) {
                    const c = cityAtUnit(u);
                    if (c) garnizonCitiesAffected.set(c.id, c);
                  }
                }
                for (let i = units.length - 1; i >= 0; i--) {
                  if (destroyedSet.has(units[i]!.id)) units.splice(i, 1);
                }
                syncUnitsRender();
                for (const siegeCityId of siegeCityIdsAffected) {
                  const stillMarked = units.some(x => x.oblegaCityId === siegeCityId);
                  if (!stillMarked) {
                    const sc = cities.find(c => c.id === siegeCityId);
                    if (sc?.oblegane) {
                      const bId = sc.oblegajacyOwnerId ?? siegeBesiegerByCity.get(siegeCityId);
                      const adj = bId !== undefined && units.some(
                        x => x.ownerId === bId && hexDistance(x.q, x.r, sc.q, sc.r) === 1,
                      );
                      if (!adj) endMapSiege(siegeCityId);
                    }
                  }
                }
                for (const c of garnizonCitiesAffected.values()) syncGarnizonForCity(c);
                showHintMessage(`Głód: utracono ${starv.destroyedIds.length} jednostek`, 3500);
              } else if (starv.damagedCount > 0) {
                showHintMessage(`Głód wojska: −${Math.round(efParams.glodWojskaHpFrac * 100)}% max HP u ${starv.damagedCount} jednostek`, 2800);
              }
            }
          } catch (errEf) {
            console.error('[EmpireFood] Blad ticku:', errEf);
          }
          // P3a: HUD + pula pracy — tylko miasta gracza (econ.total* = suma WSZYSTKICH cywilizacji).
          const playerEcon = sumEconomyForPlayerCities(econ, cities);
          const playerCityCount = cities.filter(c => c.ownerId === 0).length;
          _lastPracaRate = 0;
          _lastPieniadzRate = playerEcon.pieniadz;
          _lastNaukaRate = playerEcon.nauka;
          _lastKulturaRate = playerEcon.kultura;
          _lastKultura = playerEcon.kultura;
          if (cultureRangeVisible || religionRangeVisible) refreshRangeOverlays();
          if (territoryBorderVisible) refreshTerritoryBorderOverlay();
          refreshTradeRoutesOverlay();
          for (const [hexKey, st] of hexClearingStates) {
            if (st.ownerId !== 0) continue;
            const { pracaGrant, expired } = tickHexClearing(st);
            if (pracaGrant > 0) {
              // Maciej 2026-07-24: wyrąb daje DREWNO (surowiec do puli państwa), nie Pracę —
              // koszt 5 Pracy na start (pobrany osobno), a plon to 5 drewna z wyciętego lasu.
              creditOwnerResourceStock(cities, 0, 'drewno', pracaGrant);
              showHintMessage(
                'Wyrąb: +' + pracaGrant + ' Drewna (pozostało ' + st.turnsLeft + ' tury)',
                2000,
              );
            }
            if (expired) {
              hexClearingStates.delete(hexKey);
              finalizeHexClearing(hexKey);
            }
          }
          _lastPlayerCityEcon = econ.perCity
            .filter(tk => tk.ownerId === 0)
            .map(tk => {
              const c = cities.find(x => x.id === tk.cityId);
              return {
                cityId: tk.cityId,
                name: c?.name ?? tk.cityId,
                pieniadz: Math.round(tk.pieniadz),
                doPuli: Math.round(tk.doPuli),
                doBudynkow: Math.round(tk.doBudynkow),
                nauka: Math.round(tk.nauka),
              };
            });
          _lastLudnoscRate = cities.filter(c => c.ownerId === 0).reduce((s, c) => s + c.population, 0) - popBeforeTick;
          {
            const pc = cities.filter(c => c.ownerId === 0);
            if (pc.length > 0) {
              let sumW = 0;
              let sumM = 0;
              for (const c of pc) {
                sumW += c.wealthState?.poziom ?? 1;
                const tk = econ.perCity.find(t => t.cityId === c.id);
                sumM += tk?.wealthMnoznik ?? 1;
              }
              _lastWealthLevel   = Math.round(sumW / pc.length);
              _lastWealthMnoznik = sumM / pc.length;
            }
          }
          if (cities.length > 0) {
            console.log(
              `[Ekonomia] Tura ${turn}: gracz(${playerCityCount} os.) ¤=${Math.round(playerEcon.pieniadz)}` +
              ` N=${Math.round(playerEcon.nauka)} Praca=${Math.round(playerEcon.doPuli)}` +
              ` | mapa(${econ.cities} os.) ¤=${Math.round(econ.totalPieniadz)}` +
              ` N=${Math.round(econ.totalNauka)} Praca=${Math.round(econ.totalPracaPula)}` +
              ` wzrost=${econ.growth} głód=${econ.starved}`,
            );
            if (
              playerCityCount > 0 &&
              playerEcon.pieniadz > 0 &&
              Math.abs(playerEcon.pieniadz - econ.totalPieniadz) < 1 &&
              econ.cities > playerCityCount
            ) {
              console.warn(
                '[Ekonomia] HUD gracza = suma mapy — sprawdź ownerId miast lub wczytaj build ab92fa5c+',
              );
            }
            // Surface population changes briefly so the economy is visible.
            if (econ.growth > 0) {
              showHintMessage('Wzrost populacji w ' + econ.growth + ' miastach', 2500);
            } else if (econ.starved > 0) {
              showHintMessage('Głód: spadek populacji w ' + econ.starved + ' miastach', 2500);
            }
            // Cities may have changed population -> refresh their labels.
            cityRenderer.sync(cities, _cityRenderOpts());
            if (econ.growth > 0 || econ.starved > 0) {
              refreshCityPanelIfOpen();
              syncOkolicaOverlay();
            }
          }

          // --- N3: TURA OBLEZENIA — atrycja garnizonu + kapitulacja z głodu (przejęcie miasta) ---
          try {
            for (const tick of econ.perCity) {
              if (!tick.oblegany) continue;
              const oblCity = cities.find(c => c.id === tick.cityId);
              if (!oblCity) continue;

              const realGarnizonUnits = units.filter(
                u => u.ownerId === oblCity.ownerId
                  && u.q === oblCity.q
                  && u.r === oblCity.r
                  && u.inGarnizon === true,
              );
              if (realGarnizonUnits.length > 0) {
                const garnizonBefore = realGarnizonUnits.length;
                // Atrycja zdejmuje realne HP garnizonu (nie tylko licznik pochodny) —
                // jednostki, które w ten sposób umrą, realnie znikają z obrony przy szturmie.
                const starv = applyArmyStarvationHpLoss(
                  realGarnizonUnits,
                  oblCity.ownerId,
                  0.08,
                  (typeId) => unitHealth(data.units.find(u => u.Jednostka === typeId) ?? {}),
                );
                if (starv.destroyedIds.length > 0) {
                  for (let i = units.length - 1; i >= 0; i--) {
                    if (starv.destroyedIds.includes(units[i]!.id)) units.splice(i, 1);
                  }
                }
                syncGarnizonForCity(oblCity);
                console.log(
                  '[Oblezenie] Tura ' + turn + ' ' + oblCity.name +
                  ': atrycja garnizonu ' + garnizonBefore + ' -> ' + oblCity.garnizon +
                  ' (-' + (garnizonBefore - (oblCity.garnizon ?? 0)) + ')',
                );
              }

              if (tick.obleganyGlod) {
                handleSiegeCapitulationPhase(oblCity);
              } else if (oblCity.siegeCapitulationPending) {
                resolveSiegeSurrender(oblCity.id);
              }

              const siegeT = (siegeTurnByCity.get(oblCity.id) ?? 0) + 1;
              siegeTurnByCity.set(oblCity.id, siegeT);
              tickSiegeMachinesForCity(oblCity);
              maybeAiAssaultAfterMachines(oblCity, siegeT);
              if (getActiveSiegeCityId() === oblCity.id) {
                syncSiegePanelMeta(oblCity);
                updateSiegeMapPanelTurn(siegeT, oblCity);
              }
            }
          } catch (errSiege) {
            console.error('[Oblezenie] Blad atrycji:', errSiege);
          }

          // --- Bank treasury + science, then auto-research (13B-finish + 7B) ---
          try {
            const pieniadzGracza = playerEcon.pieniadz;
            const naukaGracza = playerEcon.nauka;
            player.skarbiec += pieniadzGracza;
            player.nauka    += naukaGracza;

            // --- Subtract upkeep from treasury (economy-upkeep s.6.4) ---
            const playerBalance = econ.upkeepByOwner.get(0);
            if (playerBalance && playerBalance.utrzymanieRazem > 0) {
              player.skarbiec -= playerBalance.utrzymanieRazem;
              if (playerBalance.deficyt) {
                console.warn(
                  '[Ekonomia] Deficyt! Utrzymanie=' + playerBalance.utrzymanieRazem +
                  ' Dochod=' + Math.round(pieniadzGracza) +
                  ' Saldo=' + Math.round(playerBalance.saldo),
                );
              }
            }

            // Bank skarbca AI — per owner (nie econ.total*)
            const aiOwnerIds = new Set<number>();
            for (const c of cities) {
              if (c.ownerId > 0) aiOwnerIds.add(c.ownerId);
            }
            for (const oid of aiOwnerIds) {
              const aiEcon = sumEconomyForOwner(econ, oid);
              let aiSkarb = (aiSkarbiecByOwner.get(oid) ?? 0) + aiEcon.pieniadz;
              const aiBalance = econ.upkeepByOwner.get(oid);
              if (aiBalance && aiBalance.utrzymanieRazem > 0) {
                aiSkarb -= aiBalance.utrzymanieRazem;
              }
              aiSkarbiecByOwner.set(oid, Math.max(0, aiSkarb));

              // Pula Nauki AI — symetryczna z graczem (totalNauka z ekonomii miast).
              aiNaukaPoolByOwner.set(
                oid,
                (aiNaukaPoolByOwner.get(oid) ?? 0) + aiEcon.nauka,
              );
            }

            // AI research: bank nauka + researchStep (PRZED pętlą decideAITurn).
            for (const oid of aiOwnerIds) {
              try {
                runAiResearchForOwner(oid);
              } catch (eAiRes) {
                console.error(`[AI ${oid}] Blad badania:`, eAiRes);
              }
            }

            // Auto-research: spend banked science on the cheapest available tech.
            const step = researchStep(player, data.tech, researchGateForOwner(0), _menuDifficulty);
            for (const done of step.completed) {
              const doneIcon = techIconSvg(done.id, 16);
              const doneIconHtml = doneIcon
                ? `<span style="display:inline-flex;width:16px;height:16px;vertical-align:-3px;margin-right:5px;color:#e8d88a">${doneIcon}</span>`
                : '';
              let msg = doneIconHtml + 'Zbadano: ' + done.id + ' (-' + done.koszt + ' nauki)';
              if (done.awansEpoki) msg += ' \xb7 nowa epoka ' + done.era;
              if (done.pieniadz)   msg += ' \xb7 Pieni\u0105dz \xd710';
              console.log('[Nauka] Tura ' + turn + ': ' + msg);
              showHintMessage(msg, 3500);
            }
            if (step.completed.length > 0) {
              if (step.completed.some(d => d.awansEpoki)) {
                overlayDepositEra = player.era;
                rebuildResourceOverlays();
                setEra(player.era); // DYSPOZYCJA-MUZYKA §2 pkt 3 — awans epoki gracza (toast „nowa epoka")
              }
              console.log(
                '[Nauka] Skarbiec=' + player.skarbiec +
                ' Nauka=' + player.nauka +
                ' Epoka=' + player.era +
                ' Zbadane=' + player.zbadane.size,
              );
              refreshSciencePickerIfOpen();
              refreshTechTreeViewIfOpen();
            }
          } catch (errBank) {
            console.warn('[Nauka] B\u0142\u0105d bankowania/badania:', errBank);
          }

          // --- MIASTO: produkcja / porządek / kultura / religia ---
          try {
            const difficulty = _menuDifficulty;
            const op  = loadOrderParams(data.societyParams, difficulty);
            const cp  = loadCultureParams(data.societyParams, difficulty);
            const rp  = loadReligionParams(data.societyParams, difficulty);
            const rng = makeRng(turn);
            lastReligionSpreadByCity.clear();
            let religionSpreadThisTurn = 0;

            for (const city of cities) {
              const cid = city.id;

              // Plony tej tury
              const econTick    = econ.perCity.find(tk => tk.cityId === cid);
              const pracaRaw    = econTick ? econTick.praca   : 0;
              const kulturaTick = econTick ? econTick.kultura : 0;

              let ownCultureShare = resolveOwnCultureShare(city as { ownCultureShare?: number; kulturaOwnShare?: number });

              const builtIds = cityBuilt.get(cid) ?? [];

              // RELIGIA (stan przed konwersją)
              const ownRel = ownerReligionForOwnerId(city.ownerId);
              let curRel: ReligionState = resolvedCityReligion(city);
              let foreignReligionDominant = isForeignReligionDominant(curRel, ownRel, rp);

              // Konwersja kultury + religii (B-KULT-REL Q2A)
              const convTick = tickCityCultureReligion(
                ownCultureShare,
                curRel,
                builtIds,
                ownRel,
                foreignReligionDominant,
                cp,
                rp,
              );
              ownCultureShare = convTick.ownCultureShare;
              (city as { ownCultureShare?: number }).ownCultureShare = ownCultureShare;
              curRel = convTick.religionState;
              cityRelig.set(cid, curRel);
              foreignReligionDominant = isForeignReligionDominant(curRel, ownRel, rp);

              // KULTURA (kumulacja po konwersji share)
              const ccIn: CultureCity = { kulturaSkumulowana: (city as any).kultura ?? 0, ownCultureShare };
              const acc = accumulateCulture(ccIn, kulturaTick, cp);
              (city as any).kultura = acc.kulturaSkumulowana;
              const ccOut: CultureCity = { kulturaSkumulowana: acc.kulturaSkumulowana, ownCultureShare };
              const haKult = cultureHappiness(ccOut, cp);

              const haRel = religionHappiness(curRel, ownRel, rp, builtIds.includes('swiatynia'));

              // SPREAD RELIGION (step H): spread dominant faith to neighbours
              {
                const relNeighbors: ReligionNeighbor[] = [];
                for (const oc of cities) {
                  if (oc.id === cid) continue;
                  const dist = hexDistance(oc.q, oc.r, city.q, city.r);
                  if (dist <= (rp.szerzenieMaxDystans ?? 3)) {
                    relNeighbors.push({
                      id: oc.id,
                      distance: dist,
                      state: resolvedCityReligion(oc),
                      population: oc.population,
                    });
                  }
                }
                if (relNeighbors.length > 0) {
                  const hasSwiatynia = (cityBuilt.get(cid) ?? []).includes('swiatynia');
                  const spreadRes = spreadReligion(curRel, relNeighbors, rp, {
                    hasSwiatynia,
                    pressure: 1,
                    seed: (turn * 997 + city.q * 31 + city.r) >>> 0,
                  });
                  for (const ev of spreadRes.events) {
                    cityRelig.set(ev.id, ev.state);
                  }
                  const spreadOut = spreadRes.events.reduce((s, ev) => s + ev.added, 0);
                  lastReligionSpreadByCity.set(cid, spreadOut);
                  religionSpreadThisTurn += spreadOut;
                  if (spreadRes.reached > 0) {
                    console.log(
                      `[Religia] Tura ${turn} ${city.name}: szerzenie -> ${spreadRes.reached} miast`,
                    );
                  }
                }
              }

              // KULT-PRESJA: presja kultury/religii z sąsiednich miast w zasięgu okolicy
              {
                const cpPresja = loadCulturePressureParams(data.societyParams, difficulty);
                const pressureRange = cityRangeForPopulation(city.population);
                const stateRelMap = new Map<number, string | null>();
                for (const oid of new Set(cities.map(cc => cc.ownerId))) {
                  stateRelMap.set(oid, ownerReligionForOwnerId(oid));
                }
                const pressureCities = cities.map(cc => ({
                  id: cc.id,
                  ownerId: cc.ownerId,
                  q: cc.q,
                  r: cc.r,
                  population: cc.population,
                  kulturaSkumulowana: (cc as { kultura?: number }).kultura ?? 0,
                  ownCultureShare: resolveOwnCultureShare(cc as { ownCultureShare?: number; kulturaOwnShare?: number }),
                  religionState: resolvedCityReligion(cc),
                  religionPressurePct: (cc as { religionPressurePct?: Record<number, number> }).religionPressurePct,
                }));
                const sources = cities.filter(oc => {
                  if (oc.id === cid) return false;
                  return hexDistance(oc.q, oc.r, city.q, city.r) <= pressureRange;
                }).map(oc => ({
                  id: oc.id,
                  ownerId: oc.ownerId,
                  q: oc.q,
                  r: oc.r,
                  population: oc.population,
                  kulturaSkumulowana: (oc as { kultura?: number }).kultura ?? 0,
                  ownCultureShare: resolveOwnCultureShare(oc as { ownCultureShare?: number; kulturaOwnShare?: number }),
                }));
                const pres = applyCultureReligionPressureToTarget(
                  {
                    id: city.id,
                    ownerId: city.ownerId,
                    q: city.q,
                    r: city.r,
                    population: city.population,
                    ownCultureShare,
                    religionState: curRel,
                    religionPressurePct: (city as { religionPressurePct?: Record<number, number> }).religionPressurePct,
                  },
                  sources,
                  pressureCities,
                  cpPresja.presjaProcTura,
                  stateRelMap,
                );
                ownCultureShare = pres.ownCultureShare;
                (city as { ownCultureShare?: number }).ownCultureShare = ownCultureShare;
                (city as { religionPressurePct?: Record<number, number> }).religionPressurePct = pres.religionPressurePct;
              }

              // SZCZĘŚCIE (+1 per budynek + baza.zadowolenie — economy.ts)
              const haBuildings = sumBuildingHappinessFromBuiltIds(
                builtIds,
                data.buildings,
                bdef => buildingLevelForEpoch(
                  bdef.epokaWejscia,
                  empireEpochForOwner(city.ownerId),
                  bdef.maksPoziom,
                  bdef.poziomTechGate ?? null,
                  unlockedTechSetForOwner(city.ownerId),
                ),
              );
              const haWealth  = econTick ? econTick.wealthZadowolenie : 0;
              // CUDA-EKON-01: bonusy.miasto.zadowolenie cudów ownera (× każde jego miasto) —
              // jedyny sensowny wpiecie punkt dla zadowolenia (CityYieldResult.zadowolenie
              // nie jest propagowane do CityEconomyTick, patrz turn-economy.ts).
              const haCuda = wonderCityYieldBonusForOwner(city.ownerId).zadowolenie ?? 0;
              const podzial = city.podzialHandlu ?? DEFAULT_PODZIAL_HANDLU;
              const gCountLaw = lawGarrisonCountForCity(city);
              const conquestUnstablePen = conquestUnstableHappinessPenalty(
                ownCultureShare, foreignReligionDominant, data.societyParams, difficulty,
              );
              const conquestNoGarPen = conquestNoGarrisonLawPenalty(
                ownCultureShare, foreignReligionDominant, gCountLaw, data.societyParams, difficulty,
              );
              const playerAtWar = city.ownerId === 0 && isPlayerAtWar();
              const stolicaBonus = stolicaEasyBonusActive(difficulty, turn, city, cities, 10, capitalCityIdForOwner(0));
              const revoltParams = loadRevoltParams(data.societyParams, difficulty);

              const ordPct = evaluateOrderFromBreakdown(
                {
                  difficulty,
                  era: empireEpochForOwner(city.ownerId),
                  population: city.population,
                  buildingZadowolenie: haBuildings,
                  haKult,
                  haRel,
                  haWealth,
                  haCuda,
                  podzialHandlu: podzial,
                  atWar: playerAtWar,
                  hasSwiatynia: builtIds.includes('swiatynia'),
                  hasAmfiteatr: builtIds.includes('teatr') || builtIds.includes('akademia'),
                  ownCultureShare,
                  foreignReligionDominant,
                  conquestUnstablePenalty: conquestUnstablePen,
                  stolicaEasyBonus: stolicaBonus,
                },
                {
                  difficulty,
                  era: empireEpochForOwner(city.ownerId),
                  population: city.population,
                  garnizonCount: gCountLaw,
                  hasRatusz: builtIds.includes('ratusz'),
                  hasPretorium: builtIds.includes('pretorium'),
                  hasSad: builtIds.includes('sad'),
                  hasPalac: cityHasPalacLine(builtIds),
                  brakGarnizonuKara: city.population >= 6 && gCountLaw === 0,
                  conquestNoGarrisonPenalty: conquestNoGarPen,
                  stolicaEasyBonus: stolicaBonus,
                },
                data.societyParams,
                difficulty,
              );

              const orderEff = ordPct.effects;
              const tier = ordPct.tier;
              const conquestRevoltMult = conquestRevoltRiskMultiplier(
                ownCultureShare, foreignReligionDominant, gCountLaw,
              );
              const effectiveRevoltRisk = orderEff.revoltRisk * conquestRevoltMult;

              const osiedleImmune = isOsiedleRevoltImmune(
                city.population, data.societyParams, difficulty,
              );

              let graceUpd;
              if (osiedleImmune) {
                city.revoltGraceRemaining = null;
                graceUpd = {
                  revoltGraceRemaining: null,
                  revoltWarning: false,
                  shouldTriggerRebellion: false,
                  graceTurnsLeft: null,
                };
              } else {
                graceUpd = updateRevoltGrace(city.revoltGraceRemaining, ordPct.porPct, revoltParams);
                city.revoltGraceRemaining = graceUpd.revoltGraceRemaining;
                if (graceUpd.shouldTriggerRebellion && city.ownerId === 0 && !city.rebelState) {
                  city.rebelState = true;
                  city.ownerId = REBEL_FACTION_OWNER_ID;
                  console.log(`[Rebelia] Tura ${turn} ${city.name} → frakcja rebeliantów`);
                }
              }

              let buntFlag = false;
              if (tier !== 'neutral') {
                console.log(
                  `[Porzadek] Tura ${turn} ${city.name}: tier=${tier} porPct=${ordPct.porPct.toFixed(1)} szPct=${ordPct.sz.szPct.toFixed(1)}` +
                  (osiedleImmune ? ' [osiedle: immunitet buntu]' : ''),
                );
              }
              if (
                !osiedleImmune
                && !graceUpd.revoltWarning
                && !city.rebelState
                && orderEff.revoltRisk > 0
                && rng() < effectiveRevoltRisk
              ) {
                const targetId = pickRevoltMigrationTarget(
                  cid, city.ownerId, cities, orderValueMap,
                );
                if (targetId) {
                  const target = cities.find(c => c.id === targetId);
                  if (target && city.population > 1) {
                    city.population -= 1;
                    target.population += 1;
                    buntFlag = true;
                    console.log(`[Bunt] Tura ${turn} ${city.name} → migracja −1 do ${target.name} (risk=${orderEff.revoltRisk.toFixed(2)})`);
                  }
                }
              }
              cityOrderState.set(cid, {
                szczescie: Math.round(ordPct.sz.netto * 10) / 10,
                porzadek: ordPct.prawo.netto,
                szPct: ordPct.sz.szPct,
                prawPct: ordPct.prawo.prawPct,
                porPct: ordPct.porPct,
                bandLabel: ordPct.bandLabel,
                szLines: ordPct.sz.lines,
                prawLines: ordPct.prawo.lines,
                progT1: op.progT1,
                progT2: op.progT2,
                bunt: buntFlag || undefined,
                revoltGraceRemaining: graceUpd.graceTurnsLeft,
                revoltWarning: graceUpd.revoltWarning,
                rebelState: city.rebelState,
              });

              orderValueMap.set(cid, ordPct.porPct);
              growthMultMap.set(cid, orderEff.growthMult);
              orderMultMap.set(cid, orderEffectsToYieldMults(tier, orderEff));

              // AUTO-MANAGE (STEP D): zastosuj decyzje auto-zarzadcy jesli wlaczony
              const praca = pracaRaw;
              let prod0 = cityProd.get(cid) ?? { kolejka: [], postep: 0 };
              if (autoManageCities.has(cid)) {
                try {
                  const unlockedTechs = city.ownerId === 0
                    ? Array.from(player.zbadane)
                    : Array.from(aiResearchDone.get(city.ownerId) ?? new Set<string>());
                  const builtForCity = cityBuilt.get(cid) ?? [];
                  const ownImprovements = placedImprovementsForOwner(city.ownerId);
                  const amDecision = autoManageCity(
                    city,
                    map,
                    prod0,
                    data,
                    {
                      yieldOf: (_q: number, _r: number) => {
                        // Minimal yield stub -- returns econ tick values aggregated
                        // (full per-tile yield would need economy.ts tileYield access)
                        const tick = econ.perCity.find(tk => tk.cityId === cid);
                        return {
                          zywnosc:  tick ? tick.zywnoscNetto / Math.max(1, city.population) : 0,
                          praca:    tick ? tick.praca    / Math.max(1, city.population) : 0,
                          pieniadz: tick ? tick.pieniadz / Math.max(1, city.population) : 0,
                          nauka:    tick ? tick.nauka    / Math.max(1, city.population) : 0,
                          kultura:  tick ? tick.kultura  / Math.max(1, city.population) : 0,
                        };
                      },
                      cityPraca: praca,
                      udzialBudynki: 0.7,
                      unlockedTechs,
                      territoryNodes: buildAllTerritoryNodes(),
                      isWorkable: okolicaHexWorkable,
                      ownerSurowcePool: ownerSurowcePoolFor(city.ownerId),
                      ctx: {
                        builtBuildingIds: builtForCity,
                        productionQueue: prod0.kolejka,
                        epoch: empireEpochForOwner(city.ownerId),
                        civBonusy: civBonusyForOwnerId(city.ownerId),
                        civUnitNacja: unitNacjaForCivKey(civKeyForOwnerId(city.ownerId)),
                        placedImprovements: placedImprovementsWithBrazTradeGrant(city.ownerId, ownImprovements),
                        hasKopalniaNaZlozuZelaza: hasKopalniaNaZlozuZelazaOrTradeGrant(city.ownerId, ownImprovements),
                        // TEMAT 8 Q2 (2026-07-24, parytet AI/Zarządca z tryAutoEnqueueBuild):
                        // bez tych 4 pól bramki surowcowe/terenowe (Glina/Ceramika/Sól/Drewno/
                        // Kamień/Ruda/Port) byłyby tu zawsze niespełnione (brak etykiet = pusta
                        // tablica), więc Zarządca nigdy nie zaproponowałby tych budynków.
                        empireActiveResourceLabels: empireActiveResourceLabelsForOwner(city.ownerId),
                        empireBuiltIds: [...empireBuiltIdsForOwner(city.ownerId)],
                        empireResourceStock: citySurowceSumForOwner(city.ownerId),
                        cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city),
                      },
                    },
                  );
                  // Apply auto-enqueue suggestion (only when queue is empty)
                  if (amDecision.enqueue !== null) {
                    // TEMAT #6 / SUROW-CIV-01: pickAutoBuildItem (wewnatrz autoManageCity)
                    // juz odfiltrowal budynki bez pokrycia w puli PANSTWA — tu tylko pobieramy
                    // koszt (start budowy), rozlozony po miastach ownera.
                    if (amDecision.enqueue.kind === 'budynek') {
                      const def = data.buildings.find(b => b.id === amDecision.enqueue!.id);
                      const cost = buildingStockCost(def);
                      if (Object.keys(cost).length > 0) {
                        deductOwnerStockCost(city.ownerId, cost);
                      }
                    }
                    prod0 = enqueue(prod0, amDecision.enqueue);
                    cityProd.set(cid, prod0);
                  }
                } catch (eAM) {
                  console.error(`[AutoManage] Blad dla miasta ${city.name}:`, eAM);
                }
              } else if ((city.budowaTryb ?? DEFAULT_BUDOWA_TRYB) === 'auto') {
                // Auto-budowa bez globalnego Zarządcy (⚙)
                const enq = tryAutoEnqueueBuild(cid);
                if (enq) prod0 = cityProd.get(cid) ?? prod0;
              }

              // PRODUKCJA (D2=A: doBudynkow → kolejka; pula imperium per miasto)
              const prodPaused = prod0.wstrzymana === true;
              const queueEmpty = frontItem(prod0) === null;
              if (econTick && !prodPaused) {
                const poolGain = pracaImperialPoolGain(
                  { doBudynkow: econTick.doBudynkow, doPuli: econTick.doPuli },
                  queueEmpty,
                );
                if (poolGain > 0) {
                  if (city.ownerId === 0) {
                    playerPracaPool += poolGain;
                    _lastPraca = playerPracaPool;
                    _lastPracaRate += poolGain;
                  } else {
                    aiPracaPoolByOwner.set(
                      city.ownerId,
                      (aiPracaPoolByOwner.get(city.ownerId) ?? 0) + poolGain,
                    );
                  }
                }
              }
              const pracaBudynki = (econTick && !queueEmpty && !prodPaused) ? econTick.doBudynkow : 0;
              const { prod: prodPo, completed, overflowToPool } = advanceProduction(prod0, pracaBudynki);
              let prodFinal = prodPo;
              cityProd.set(cid, prodPo);
              // Nadwyżka po ukończeniu budynku (reszta doBudynkow) — nie dotyczy pustej kolejki.
              if (overflowToPool && overflowToPool > 0) {
                if (city.ownerId === 0) {
                  playerPracaPool += overflowToPool;
                  _lastPraca = playerPracaPool;
                  _lastPracaRate += overflowToPool;
                } else {
                  // D-IMPROVEMENTS: nadmiar Pracy kolejki AI (miasto nie ma co budować) ->
                  // pula empire-wide AI, symetryczne z graczem.
                  aiPracaPoolByOwner.set(
                    city.ownerId,
                    (aiPracaPoolByOwner.get(city.ownerId) ?? 0) + overflowToPool,
                  );
                }
              }

              if (completed) {
                const applied = applyProductionCompleted(city, cid, completed, prodPo);
                prodFinal = applied.prod;
                cityProd.set(cid, prodFinal);
                if ((city.budowaTryb ?? DEFAULT_BUDOWA_TRYB) === 'auto' && frontItem(prodFinal) === null) {
                  tryAutoEnqueueBuild(cid);
                  prodFinal = cityProd.get(cid) ?? prodFinal;
                }
              }

              const recResult = advanceRecruitmentGated(
                prodFinal, city, empireEpochForOwner(city.ownerId), 1, true,
              );
              prodFinal = recResult.prod;
              city.population = recResult.population;
              city.manpower = recResult.manpower;
              cityProd.set(cid, prodFinal);
              for (const rec of recResult.completed) {
                const def = lookupUnitDef(rec.id);
                const ruch = normFieldVal(def['Ruch'], 2);
                const role = String(def['Rola'] ?? def['Rola (linia)'] ?? '');
                const isSuper = def['Super-jednostka'] === 'TAK';
                const newUnitId = 'rec_' + turn + '_' + cid + '_' + Math.random().toString(36).slice(2);
                units.push({
                  id: newUnitId,
                  ownerId: city.ownerId,
                  typeId: rec.id,
                  category: categoryOf(rec.id, role, isSuper, def['Typ']),
                  q: city.q,
                  r: city.r,
                  ruch,
                  ruchLeft: 0,
                });
                maybeHintArmyFoodOnFirstPlayerUnit(city.ownerId);
                if (city.ownerId === 0) {
                  if (endTurnInProgress) {
                    deferredPlayerUnitRevealIds.add(newUnitId);
                  } else {
                    afterPlayerUnitSpawned(newUnitId);
                  }
                }
                console.log(`[Rekrutacja] Tura ${turn} ${city.name}: ${rec.id} gotowa @ (${city.q},${city.r})`);
              }
            }
            // ZADANIE 1 (Maciej 2026-07-23): upkeep Pracy civ-wide za ulepszenia surowcowe --
            // odjęcie RAZ na turę (nie per-miasto) z globalnej puli produkcji, PO tym jak
            // pętla per-miasto powyżej dodała tegoroczne doPuli/overflow (playerPracaPool /
            // aiPracaPoolByOwner). Praca nie schodzi < 0 (Math.max poniżej).
            try {
              const playerUpkeep = econ.pracaUpkeepByOwner.get(0) ?? 0;
              if (playerUpkeep > 0) {
                playerPracaPool = Math.max(0, playerPracaPool - playerUpkeep);
                _lastPraca = playerPracaPool;
              }
              _lastPracaUpkeep = playerUpkeep;
              for (const [oid, up] of econ.pracaUpkeepByOwner) {
                if (oid === 0 || up <= 0) continue;
                const cur = aiPracaPoolByOwner.get(oid) ?? 0;
                aiPracaPoolByOwner.set(oid, Math.max(0, cur - up));
              }
            } catch (errUpkeepPraca) {
              console.error('[Ekonomia] Błąd upkeep Pracy (ulepszenia surowcowe):', errUpkeepPraca);
            }
            _lastKultura = cities
              .filter(c => c.ownerId === 0)
              .reduce((s, c) => s + ((c as { kultura?: number }).kultura ?? 0), 0);
            _lastReligionSpreadTotal = religionSpreadThisTurn;
          } catch (errMiasto) {
            console.error('[Miasto] Błąd tury MIASTO:', errMiasto);
          }
        } catch (err) {
          console.error('[Ekonomia] Błąd w turze ekonomii:', err);
        }

        // ===================================================================
        // AI TURN LOOP: execute commands for every AI rival (ownerId > 0)
        // ===================================================================
        setTurnTransition(38, 'Tura przeciwników…', '—', nextTurnNum);
        await yieldTurnTransitionUi();
        try {
          const runAiPhase = async (): Promise<void> => {
            aiTurnAwaitingBattle = false;
            reconcileAllOwnerErasFromResearch();
            const aiOwnerList = aiCmdResume?.ownerList ?? (() => {
              const s = new Set<number>();
              for (const u of units) { if (u.ownerId > 0) s.add(u.ownerId); }
              for (const c of cities) { if (c.ownerId > 0) s.add(c.ownerId); }
              for (const oid of eliminatedOwners) s.delete(oid); // cywilizacje skasowane nie grają
              return [...s];
            })();
            const startOi = aiCmdResume?.ownerIdx ?? 0;
            const resumeCommands = aiCmdResume?.commands;
            const resumeCmdIdx = aiCmdResume?.cmdIdx ?? 0;
            aiCmdResume = null;

            ownerLoop: for (let oi = startOi; oi < aiOwnerList.length; oi++) {
              const ownerId = aiOwnerList[oi]!;
              // Bezpiecznik: gdyby lista pochodziła z aiCmdResume sprzed eliminacji
              // (skasowanie w trakcie tej samej fazy AI) — pomiń bez przetwarzania.
              if (eliminatedOwners.has(ownerId)) continue;
              const aiPct = 38 + Math.round((54 * (oi + 1)) / Math.max(1, aiOwnerList.length));
              setTurnTransition(aiPct, 'Ruchy i decyzje…', ownerDiploLabel(ownerId), nextTurnNum);
              await yieldTurnTransitionUi();
              const isCommandResume = oi === startOi && !!resumeCommands && resumeCmdIdx > 0;
              ensureAiOwnerStartEra(ownerId);
              // R-AI-KUP-JEDN: zeruj licznik zakupów-za-złoto TEGO ownera na starcie jego
              // tury -- NIE przy wznowieniu (isCommandResume) tej samej listy komend po
              // przerwie async (np. animacja bitwy), żeby nie odblokować drugiego zakupu
              // w tej samej turze.
              if (!isCommandResume) aiUnitGoldRushBoughtByOwner.set(ownerId, 0);
            // R-TRUDNOSC-1 (Maciej 2026-07-24 rozszerzenie): PER-OWNER, nie globalne --
            // miasta-państwa (defensiveCopy) dostają poziom z suwaka miast-państw, zwykłe AI
            // z głównej trudności (patrz aiDiffLevelForOwner). Zasila opts.poziomTrudnosci
            // (DifficultyParams: bonusProdukcja/bonusWalka/agresjaMnoznik/celObranie) niżej.
            const aiDiffLevel = aiDiffLevelForOwner(ownerId);
            const contactedOwners = getDiplomaticContacts();
            const opts: AITurnOpts = {
              civType: aiOwnerCivMap.get(ownerId), // nacja AI z rostera civs.json
              poziomTrudnosci: aiDiffLevel,
              defensiveCopy: typCityCopyOwners.has(ownerId),
              canEngageOwner: (targetOwnerId: number) => {
                if (targetOwnerId === 0) {
                  return getDiploRelation(ownerId, 0).status === 'wojna';
                }
                return true;
              },
              cityBuildings: Object.fromEntries(
                [...cityBuilt.entries()].filter(([cid]) => cities.find(c => c.id === cid && c.ownerId === ownerId))
              ),
              // D-IMPROVEMENTS: AI buduje ulepszenia terenu (planCityImprovements w game/ai.ts) --
              // territoryNodes świeże per owner (odzwierciedla miasta założone wcześniej W TEJ
              // SAMEJ turze przez inne AI, jak refreshBuildApi() dla gracza).
              territoryNodes: buildAllTerritoryNodes(),
              placedImprovements,
              improvementTechs: aiResearchDone.get(ownerId) ?? new Set<string>(),
              pracaAvailable: aiPracaPoolByOwner.get(ownerId) ?? 0,
              civEra: empireEpochForOwner(ownerId),
              // D-START posiłki v2: setup „Wsparcie miast-państw" -> RESUP_TIERS (ai.ts).
              citySupportLevel: _menuCitySupport,
              // TEMAT #6 (2026-07-23) / SUROW-CIV-01 (2026-07-24) / JEDNOSTKI-SUROWIEC-01
              // (2026-07-24): AI pomija budynek LUB jednostkę (skips, nie zawiesza się) gdy
              // pula PAŃSTWA ownera (suma City.surowce po wszystkich miastach — nie tylko to
              // jedno) nie starcza na koszt_surowce budynku (cegła/ceramika) LUB Surowiec/
              // Surowiec (ilość) jednostki (units.json). OWNERID-AGNOSTIC: dokladnie ta sama
              // funkcja jak dla gracza (buildingStockCost/unitStockCost w main.ts
              // cmd.type==='build' i ui/cityPanel.ts addItem) -- zero specjalnej sciezki AI.
              // Budynki/jednostki bez kosztu surowcowego zawsze "affordable". `buildingId` tu
              // to id kandydata z chooseCityProduction (ai.ts) -- moze byc id budynku (katalog
              // buildings.json) LUB nazwa jednostki (Jednostka w units.json, np. "Wojownik").
              canAfford: (cityId: string, buildingId: string) => {
                const c = cities.find(x => x.id === cityId);
                if (!c) return true;
                const def = data.buildings.find(b => b.id === buildingId);
                if (def) {
                  const cost = buildingStockCost(def);
                  if (Object.keys(cost).length === 0) return true;
                  return canAffordBuildingStock(ownerSurowcePoolFor(c.ownerId), cost);
                }
                const unitDef = data.units.find(u => u.Jednostka === buildingId);
                const unitCost = unitStockCost(unitDef);
                if (Object.keys(unitCost).length === 0) return true;
                return canAffordBuildingStock(ownerSurowcePoolFor(c.ownerId), unitCost);
              },
            };
            const myCivTyp = aiOwnerCivMap.get(ownerId);
            const tc = clusterPlacement?.klastry.find(k => k.typ === myCivTyp);
            if (tc && clusterCapitalOwnerIds.has(ownerId)) {
              const slotCount = tc.miasta.length + (tc.growthSlot ? 1 : 0);
              opts.clusterCenter = tc.centrum;
              opts.clusterRadius = clusterCityStateRadius();
              opts.clusterStateTargets = cities
                .filter(c =>
                  c.startCityState
                  && c.ownerId !== ownerId
                  && aiOwnerCivMap.get(c.ownerId) === myCivTyp
                  && hexDistance(c.q, c.r, tc.centrum.q, tc.centrum.r) <= opts.clusterRadius!,
                )
                .map(c => ({ ownerId: c.ownerId, q: c.q, r: c.r }));
            } else if (tc && !typCityCopyOwners.has(ownerId)) {
              opts.clusterCenter = tc.centrum;
              opts.clusterRadius = clusterCityStateRadius();
            } else if (tc && typCityCopyOwners.has(ownerId)) {
              // D-START posiłki w klastrze (Maciej 2026-07-20, bramkowane sojuszem
              // 2026-07-21): pozostałe miasta-siostry (profil kopia_typu_obronna) TEGO
              // SAMEGO klastra/typu — decideDefensiveCopyTurn może wysłać nadwyżkową
              // jednostkę ku zagrożonej siostrze TYLKO jeśli (ownerId, c.ownerId) są
              // aktualnie w aktywnym sojuszu (activeDeals — patrz isAllianceDealKind/
              // dealInvolvesOwners powyżej). Bez sojuszu siostra jest pominięta —
              // ai.ts nie wie nic o dyplomacji, filtrujemy TUTAJ, przed przekazaniem.
              // Ten sam promień co dla clusterStateTargets (spójność z konsolidacją
              // klastra powyżej).
              const resupRadius = clusterCityStateRadius();
              opts.sisterCityStates = cities
                .filter(c =>
                  c.ownerId !== ownerId
                  && typCityCopyOwners.has(c.ownerId)
                  && aiOwnerCivMap.get(c.ownerId) === myCivTyp
                  && hexDistance(c.q, c.r, tc.centrum.q, tc.centrum.r) <= resupRadius
                  && activeDeals.some(
                    d => isAllianceDealKind(d.rodzaj) && dealInvolvesOwners(d, ownerId, c.ownerId),
                  ),
                )
                .map(c => ({ ownerId: c.ownerId, q: c.q, r: c.r }));
            }
            let commands: AICommand[];
            let cmdStart = 0;
            if (isCommandResume && resumeCommands) {
              commands = resumeCommands;
              cmdStart = resumeCmdIdx;
            } else {
            try {
              commands = decideAITurn(ownerId, units, cities, map, data, opts);
            } catch (eAI) {
              console.error(`[AI] decideAITurn owner=${ownerId} error:`, eAI);
              continue;
            }

            // CUDA-AI (Maciej C-CUDA-AI=A, 2026-07-23): AI pełnych cywilizacji rozważa
            // budowę cudu -- miasta-państwa/kopie (opts.defensiveCopy) WYKLUCZONE (nigdy
            // nie zakładają miast/rozbudowy poza obroną, patrz decideDefensiveCopyTurn).
            // Kolejkuje TYLKO gdy: (a) evaluateWonderBuildGate przechodzi (poprzez
            // listBuildableWondersForOwner -- techy AI z aiResearchDone, epoka, ekskluzywność
            // E, brak innego egzemplarza na świecie); (b) miasto ma wolną kolejkę; (c) stać
            // AI na koszt wg progu trudności (ai-params.json cuda_poziom{1,2,3}_*, patrz
            // decideAiWonderBuild w ai.ts -- throttle + priorytet E przed R + max 1 cud w
            // budowie na cywilizację naraz, wszystko deterministyczne).
            if (!opts.defensiveCopy) {
              try {
                const myCitiesForWonder = cities.filter(c => c.ownerId === ownerId);
                const hasWonderInProgress = myCitiesForWonder.some(c =>
                  (cityProd.get(c.id)?.kolejka ?? []).some(it => parseWonderProdId(it.id) !== null),
                );
                const buildableForAi: AiWonderOption[] = listBuildableWondersForOwner(ownerId)
                  .map(w => ({ id: w.id, kosztBudowy: w.kosztBudowy, dostep: w.dostep }));
                const wonderCandidates: AiWonderCityCandidate[] = myCitiesForWonder.map(c => ({
                  cityId: c.id,
                  queueEmpty: frontItem(cityProd.get(c.id) ?? { kolejka: [], postep: 0 }) === null,
                  pracaPerTurn: aiWonderPracaTickByCity.get(c.id) ?? 0,
                }));
                const wonderDiffParams = loadAiWonderParams(data, aiDiffLevel);
                const wonderDecision = decideAiWonderBuild(
                  turn, ownerId, hasWonderInProgress, wonderCandidates, buildableForAi, wonderDiffParams,
                );
                if (wonderDecision) {
                  const wDef = getWonderById(wonderDecision.wonderId);
                  if (wDef) {
                    const wProd0 = cityProd.get(wonderDecision.cityId) ?? { kolejka: [], postep: 0 };
                    cityProd.set(wonderDecision.cityId, enqueue(wProd0, wonderProductionItem(wDef)));
                    const wCity = myCitiesForWonder.find(c => c.id === wonderDecision.cityId);
                    console.log(
                      `[Cuda][AI] Tura ${turn} ${wCity?.name ?? wonderDecision.cityId} (owner ${ownerId}): kolejka ${wDef.nazwa} (${wDef.kosztBudowy} Pracy)`,
                    );
                  }
                }
              } catch (eAiWonder) {
                console.error(`[AI] Cuda -- blad decyzji owner=${ownerId}:`, eAiWonder);
              }
            }

            // --- Diplomacy stance + computeRespekt + decideAIDiplomacy ---
            try {
              if (!diplomaticallyDiscoveredOwners.has(ownerId)) {
                // Brak odkrycia na mapie — zero dyplomacji wobec gracza (w tym darów).
              } else {
              const militaryRatio = militaryRatioFromArmyM(
                sumArmyMForOwner(ownerId),
                sumArmyMForOwner(0),
              );
              const rel = getDiploRelation(0, ownerId);
              const dipCtx: AIDiplomacyContext = {
                isMinorCiv: false,
                militaryRatio,
                currentTurn: turn,
                turnsAtWar: rel.status === 'wojna' ? 1 : 0,
              };
              // ikonaId w civs.json === wartosci enum TypCywilizacji (np. 'grecy' === TypCywilizacji.Grecy)
              const aiCivId = aiOwnerCivMap.get(ownerId) ?? 'grecy';
              const aiTyp = (aiCivId as TypCywilizacji);
              const plrTyp = ((player.civType ?? 'rzymianie') as TypCywilizacji);
              const aiStub: Player = {
                ownerId,
                typCywilizacji: aiTyp,
              } as unknown as Player;
              const humanStub: Player = {
                ownerId: 0,
                typCywilizacji: plrTyp,
              } as unknown as Player;
              const stance = aiDiplomacyStance(aiStub, humanStub, rel, dipCtx);
              const tier = relationTier(rel);

              // --- computeRespekt: obiektywny POWER (power-objective v2) ---
              const potPlr = objectivePowerByOwner.get(0)?.power ?? 0;
              const potAI  = objectivePowerByOwner.get(ownerId)?.power ?? 0;
              const respektAI = computeRespekt(potAI, potPlr);
              // Update respekt in relation
              const relWithRespekt = { ...rel, respekt: respektAI };
              setDiploRelation(0, ownerId, relWithRespekt);

              // --- tickDiplomacy: per-turn shift ---
              const relStatus = (relWithRespekt as Relation).status;
              const tickCtx: TickCtx = {
                turn,
                aktywnyHandel: activeDeals.some(
                  d => dealInvolvesOwners(d, 0, ownerId)
                    && normalizeTreatyKind(d.rodzaj) === RodzajTraktatu.UmowaHandlowa,
                ),
                pokojTrustTier: resolvePokojTrustTier(activeDeals, 0, ownerId, {
                  contactEstablished: diplomaticContactEstablished.has(ownerId),
                  atWar: relStatus === 'wojna',
                }),
                dobraWolaAktywna: false,
                wspolnyWrog: false,
                wspolnaReligia: (() => {
                  const sameCulture = sameCultureCircle(civKeyForOwner(0), civKeyForOwner(ownerId));
                  const pr = ownerReligionForOwnerId(0);
                  const ar = ownerReligionForOwnerId(ownerId);
                  return sameCulture && !!pr && !!ar && pr === ar;
                })(),
                odmiennaReligia: false,
                ekspansjaPrzyGranicy:
                  cities.filter(c => c.ownerId === ownerId).length > 2 &&
                  cities.filter(c => c.ownerId === 0).length > 2,
              };
              const relTicked = tickDiplomacy(relWithRespekt as any, tickCtx);
              setDiploRelation(0, ownerId, relTicked as unknown as Relation);

              // --- decideAIDiplomacy: AI dyplomacja (war/peace/trybut) ---
              // R-MP-DYPL-PROAKT (Maciej 2026-07-24, dokończenie): CAŁA dyplomacja
              // miast-panstw ma isc z trudnosci MP (_menuCityStateDifficulty), NIE z
              // globalnej _menuDifficulty -- (a) agresjaMnoznik/dyplomacjaAktywnosc
              // (P3/P4 wojna/trybut, P5/P6 sojusz/handel) juz per-owner przez diffParams
              // nizej (loadDifficultyParams(data, aiDiffLevel)); (b) ostatni argument
              // decideAIDiplomacy (GameDifficulty string -- progWojnaSila/progHandel przez
              // loadDefaultAIDiplomacyProgs ORAZ dary jednorazowe canAiProposeOneShotGoldGift/
              // aiOneShotGiftGoldMultiplier) teraz TEZ per-owner przez
              // effectiveGameDifficultyForOwner -- dokladnie ta sama galaz co
              // aiDiffLevelForOwner. Pelne cywilizacje AI (nie miasta-panstwa) -- bez zmian,
              // nadal globalna _menuDifficulty (typCityCopyOwners.has(ownerId) decyduje
              // w obu helperach identycznie).
              const diffParams = loadDifficultyParams(data, aiDiffLevel);
              const respektWzgledny = (potAI + potPlr) > 0
                ? potAI / (potAI + potPlr)
                : 0.5;
              // E6 (2026-07-23): "polaczenie mozliwe" geometryczne (ignoruje limit
              // slotow budynkow handlowych — patrz citiesHaveTradeConnection) miedzy
              // miastami gracza i tego AI. Tania: liczba miast na cywilizacje jest
              // mala, a wynik jest cache'owany per mapa w findCityConnection.
              const hasTradeConnectionToPlayer = citiesHaveTradeConnection(
                cities.filter(c => c.ownerId === 0),
                cities.filter(c => c.ownerId === ownerId),
                map,
                cityBuilt,
              );
              // HANDEL-SUROWCE-CYKL (2026-07-24): ownerId-agnostyczne — ta sama
              // funkcja liczy nadwyżkę AI(ownerId)→gracz(0) jak w AI↔AI (formAiAiTradeAgreementsIfEligible).
              const resourceTradeOfferRaw = !relStatus || relStatus !== 'wojna'
                ? pickResourceSurplusForOwnerPair(ownerId, 0)
                : null;
              const diploInp: DiplomacjaInputs = {
                myPlayerId: String(ownerId),
                relacje: [{
                  partnerId: '0',
                  relation: relTicked as unknown as Relation,
                  respektWzgledny,
                  stanWojny: (relTicked as any).status === 'wojna',
                  lastOneShotGiftTurn: aiOneShotGiftLastTurn.get(ownerId),
                  hasHandelTreaty: tickCtx.aktywnyHandel,
                  hasTradeConnection: hasTradeConnectionToPlayer,
                  lastTradeAgreementProposalTurn: aiTradeAgreementLastProposalTurn.get(ownerId),
                  resourceTradeOffer: resourceTradeOfferRaw
                    ? {
                        surowiecKey: resourceTradeOfferRaw.surowiecKey,
                        label: resourceTradeOfferRaw.label,
                        pakietyPerTura: resourceTradeOfferRaw.pakietyPerTura,
                        zaplataTyp: 'zloto',
                        zaplataPerTura: resourceTradeOfferRaw.zaplataPerTura,
                        turns: AI_RESOURCE_TRADE_DEFAULT_TURNS,
                      }
                    : undefined,
                  hasActiveResourceTradeDeal: hasActiveResourceTradeDealForPair(0, ownerId),
                  lastResourceTradeProposalTurn: aiResourceTradeLastProposalTurn.get(ownerId),
                }],
                agresja: resolveArchetypeAggression(aiTyp, ARCHETYPE_AGGRESSION[aiTyp] ?? 0.5),
                handlowosc: resolveArchetypeTrade(aiTyp, ARCHETYPE_TRADE[aiTyp] ?? 0.5),
                epoka: player.era,
                skarbiecGold: aiSkarbiecByOwner.get(ownerId) ?? 0,
                currentTurn: turn,
              };
              const dipLayer = diplomacyLayerForOwner(
                ownerId,
                simplifiedDiplomacyOwners,
                foreignTypeOwners,
                contactedOwners,
              );
              const dipCmdsRaw = decideAIDiplomacy(
                diploInp, undefined, diffParams.agresjaMnoznik, diffParams.dyplomacjaAktywnosc,
                effectiveGameDifficultyForOwner(ownerId),
              );
              const dipCmds: AIDiplomacyCommand[] = filterDiplomacyCommandsForEstablishedContact(
                filterDiplomacyCommandsForLayer(
                  Array.isArray(dipCmdsRaw) ? dipCmdsRaw : [],
                  dipLayer,
                ),
                diplomaticContactEstablished.has(ownerId),
              );
              for (const cmd of dipCmds) {
                try {
                  const curRel = getDiploRelation(0, ownerId);
                  if (cmd.type === 'wypowiedz_wojne') {
                    breakTreatiesOnWar(0, ownerId, false);
                    applyAllianceObligationsOnWar(ownerId, 0);
                    const newRel = applyDiploEventTracked(0, ownerId, curRel, 'wojna_wypowiedziana');
                    setDiploRelation(0, ownerId, newRel);
                    console.log(`[Dyplomacja] AI${ownerId} wypowiada wojne: ${cmd.powod}`);
                    showHintMessage('\u2694 ' + ownerDiploLabel(ownerId) + ' — ' + formatAiDiplomacyPlayerMessage(cmd), 4500);
                    if (isDiplomacyPanelOpen()) updateDiplomacyPanel();
                  } else if (cmd.type === 'zaproponuj_pokoj') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'zadaj_trybut') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'oferuj_trybut_za_pokoj') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'zaproponuj_sojusz') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'zaproponuj_handel') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'zaproponuj_umowe_handlowa') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  } else if (cmd.type === 'zaproponuj_handel_surowiec') {
                    enqueueDiplomacyPendingFromCmd(ownerId, cmd);
                  }
                } catch (eCmdDiplo) {
                  console.error(`[Dyplomacja] Blad komendy ${cmd.type}:`, eCmdDiplo);
                }
              }

              if (tier !== 2) { // 2 = Neutralny -- log only non-neutral
                console.log(
                  `[Dyplomacja] Tura ${turn} AI${ownerId}: tier=${tier}` +
                  ` war=${stance.willingnessWar.toFixed(2)}` +
                  ` peace=${stance.willingnessPeace.toFixed(2)}` +
                  ` respektAI=${respektAI}`,
                );
              }
              } // discovered owner
            } catch (eDiplo) {
              console.error(`[Dyplomacja] Blad dyplomacji AI${ownerId}:`, eDiplo);
            }
            } // !isCommandResume

            for (let ci = cmdStart; ci < commands.length; ci++) {
              const cmd = commands[ci]!;
              try {
                if (cmd.type === 'endTurn') {
                  // Nothing to do -- AI player signals end of its turn.
                  continue;
                }

                if (cmd.type === 'move') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
                  if (!canUnitOccupyCityHex(u.ownerId, cmd.toQ, cmd.toR, cities)) continue;
                  const path = computePath(u, map, cmd.toQ, cmd.toR, (() => {
                    const occ = addForeignCityBlocks(new Set<string>(), u.ownerId, cities);
                    for (const ou of units) { if (ou.id !== u.id) occ.add(keyOf(ou.q, ou.r)); }
                    return occ;
                  })(), moveCostFnForUnit(u));
                  if (path.length > 0) {
                    const last = path[path.length - 1]!;
                    if (!canUnitOccupyCityHex(u.ownerId, last.q, last.r, cities)) continue;
                    u.q = last.q;
                    u.r = last.r;
                    u.ruchLeft = 0;
                    // TEMAT #15: AI z Żeglugą też się (dez)okrętowuje wg terenu.
                    applyEmbarkStateAfterMove([u], map);
                  }
                  continue;
                }

                if (cmd.type === 'foundCity') {
                  const u = units.find(x => x.id === cmd.unitId);
                  if (!u || u.ownerId !== ownerId) continue;
                  const res = canFoundCity(u.q, u.r, cities, map);
                  if (res.ok) {
                    const ownerCities = cities.filter(c => c.ownerId === ownerId);
                    const usedNames = new Set(ownerCities.map(c => c.name));
                    const civId = aiOwnerCivMap.get(ownerId) ?? '';
                    const aiName = pickAiFoundedCityName(
                      data.cityNamesPools,
                      civId,
                      usedNames,
                      ownerCities.length,
                    );
                    const c = foundCity(u, cities, map, aiName);
                    if (c) {
                      c.ownerId = ownerId;
                      cities.push(c);
                      finalizeCityFounding(c, u.q, u.r);
                      const idx = units.indexOf(u);
                      if (idx >= 0) units.splice(idx, 1);
                      cityRenderer.sync(cities, _cityRenderOpts());
                      console.log(`[AI ${ownerId}] Zalozono miasto ${c.name} @ (${c.q},${c.r})`);
                    }
                  }
                  continue;
                }

                if (cmd.type === 'attack') {
                  const attacker = units.find(x => x.id === cmd.unitId);
                  const defender = units.find(x => x.id === cmd.targetUnitId);
                  if (!attacker || !defender || attacker.ownerId !== ownerId) continue;
                  // TEMAT #15: BRAK ataku z wody (jednostka zaokrętowana).
                  if (attacker.embarked === true) continue;
                  if (
                    defender.ownerId === 0
                    && getDiploRelation(ownerId, 0).status !== 'wojna'
                  ) {
                    console.warn(`[AI ${ownerId}] Atak na gracza bez wojny — pominięto`);
                    continue;
                  }
                  const atkRoster = collectBattleRoster(attacker, units, 'attacker');
                  const defRoster = collectBattleRoster(defender, units, 'defender');
                  const hexKey = keyOf(defender.q, defender.r);
                  const hexObj = map.hexes[hexKey];
                  const teren: string = hexObj ? (hexObj.terenBazowy as string) : 'Rownina';
                  const structBonusAI = structureDefenseBonusFor(defender.q, defender.r);
                  if (defRoster.some(u => u.ownerId === 0)) {
                    aiCmdResume = {
                      ownerList: aiOwnerList,
                      ownerIdx: oi,
                      commands,
                      cmdIdx: ci + 1,
                    };
                    aiTurnAwaitingBattle = true;
                    launchIncomingMapFieldBattle(
                      atkRoster,
                      defRoster,
                      defender.q,
                      defender.r,
                      teren,
                      structBonusAI,
                      'Atak AI — ' + ownerDiploLabel(ownerId),
                      () => { void runAiPhase(); },
                      worldTerrainFromHex(hexObj),
                    );
                    break ownerLoop;
                  }
                  const powerRes = doAutoPowerMapBattle(
                    atkRoster,
                    defRoster,
                    defender.q,
                    defender.r,
                    teren,
                    structBonusAI,
                  );
                  if (powerRes?.winner === 'attacker') {
                    console.log(`[AI ${ownerId}] Atak: ${attacker.typeId} pokonal ${defender.typeId}`);
                  } else if (powerRes?.winner === 'defender') {
                    console.log(`[AI ${ownerId}] Atak: ${attacker.typeId} przegral z ${defender.typeId}`);
                  } else if (powerRes?.winner === 'tie') {
                    console.log(`[AI ${ownerId}] Atak: remis`);
                  }
                  continue;
                }

                if (cmd.type === 'build') {
                  const city = cities.find(c => c.id === cmd.cityId && c.ownerId === ownerId);
                  if (!city) continue;
                  // #31: klasyfikacja po id budynku (katalog buildings.json), nie po nazwie --
                  // buildingProductionItem/findBuilding niżej porównują wyłącznie b.id.
                  const buildingNames = new Set(data.buildings.map(b => b.id));
                  const isBuilding = buildingNames.has(cmd.buildingId);
                  const prod0 = cityProd.get(cmd.cityId) ?? { kolejka: [], postep: 0 };
                  // Don't re-enqueue if already in queue
                  const alreadyQueued = prod0.kolejka.some(it => it.id === cmd.buildingId);
                  if (!alreadyQueued) {
                    const builtIds = cityBuilt.get(city.id) ?? [];
                    const ownImprovements = placedImprovementsForOwner(ownerId);
                    const allowed = availableProduction(
                      city,
                      data,
                      Array.from(unlockedTechSetForOwner(ownerId)),
                      {
                        epoch: empireEpochForOwner(ownerId),
                        builtBuildingIds: builtIds,
                        productionQueue: prod0.kolejka,
                        civBonusy: civBonusyForOwnerId(ownerId),
                        civUnitNacja: unitNacjaForCivKey(civKeyForOwnerId(ownerId)),
                        placedImprovements: placedImprovementsWithBrazTradeGrant(ownerId, ownImprovements),
                        hasKopalniaNaZlozuZelaza: hasKopalniaNaZlozuZelazaOrTradeGrant(ownerId, ownImprovements),
                        // audyt #11: AI też podlega limitowi 1 żywej Super-jednostka.
                        aliveUnitTypeNames: new Set(
                          units.filter(x => x.ownerId === ownerId).map(x => x.typeId),
                        ),
                        buildingCostPace: player.buildingCostPace ?? 'niski',
                        ownerId,
                        difficulty: _menuDifficulty,
                        // TEMAT 8 Q2 (2026-07-24, PARYTET AI): bez tych 4 pól bramki surowcowe/
                        // terenowe (Glina/Ceramika/Sól/Drewno/Kamień/Ruda/Port — w tym stolarnia,
                        // którą AI faktycznie proponuje w ai.ts) byłyby tu zawsze niespełnione,
                        // więc polecenie 'build' AI byłoby odrzucane mimo realnego dostępu —
                        // te same wejścia co tryAutoEnqueueBuild / cityPanel.ts (ręczna budowa gracza).
                        empireActiveResourceLabels: empireActiveResourceLabelsForOwner(ownerId),
                        empireBuiltIds: [...empireBuiltIdsForOwner(ownerId)],
                        empireResourceStock: citySurowceSumForOwner(ownerId),
                        cityHasCoastOrRiver: cityHasCoastOrRiverAccess(city),
                      },
                    );
                    const buildAllowed = allowed.some(
                      (a) => a.id === cmd.buildingId || a.nazwa === cmd.buildingId,
                    );
                    if (!buildAllowed) {
                      console.warn(
                        `[AI ${ownerId}] Build blocked (epoka/tech): ${cmd.buildingId}`,
                      );
                      continue;
                    }
                    const item = isBuilding
                      ? buildingProductionItem(
                        cmd.buildingId,
                        data,
                        1,
                        civBonusyForOwnerId(ownerId),
                        player.buildingCostPace ?? 'niski',
                        ownerId,
                        _menuDifficulty,
                      )
                      : unitProductionItem(
                        cmd.buildingId,
                        data,
                        civBonusyForOwnerId(ownerId),
                        player.kosztJednostekPace ?? 'niski',
                        ownerId,
                        _menuDifficulty,
                      );
                    if (item !== null) {
                      // TEMAT #6 (2026-07-23) / SUROW-CIV-01 (2026-07-24) / JEDNOSTKI-SUROWIEC-01
                      // (2026-07-24): siatka bezpieczeństwa — AI zwykle nie wybiera budynku/
                      // jednostki bez pokrycia (opts.canAfford w decideAITurn, patrz wyżej), ale
                      // sprawdzamy ponownie tu (jedyne miejsce, ktore faktycznie enqueue'uje i
                      // pobiera surowiec) — AI POMIJA element (continue), nie zawiesza tury.
                      // Afordancja/pobor liczone Z PULI PAŃSTWA ownera (nie tylko lokalne
                      // City.surowce tego miasta) — identycznie jak dla gracza, zero specjalnej
                      // ścieżki AI (parytet: buildingStockCost/unitStockCost, ta sama funkcja
                      // deductOwnerStockCost dla obu rodzajow kosztu).
                      if (item.kind === 'budynek') {
                        const def = data.buildings.find(b => b.id === item.id);
                        const cost = buildingStockCost(def);
                        if (Object.keys(cost).length > 0) {
                          if (!canAffordBuildingStock(ownerSurowcePoolFor(ownerId), cost)) {
                            console.warn(
                              `[AI ${ownerId}] Build skipped (brak surowca w magazynie panstwa): ${cmd.buildingId}`,
                            );
                            continue;
                          }
                          deductOwnerStockCost(ownerId, cost);
                        }
                      } else if (item.kind === 'jednostka') {
                        // R-AI-KUP-JEDN (Maciej 2026-07-24, parytet AI): przed zwykłym
                        // kolejkowaniem Pracą, spróbuj ZACHOWAWCZEGO rush-zakupu za złoto --
                        // sama decyzja to CZYSTY predykat shouldAIRushBuyUnit (game/ai.ts,
                        // testy w tools/ai-unit-rush-test.cjs). AI kupuje tylko gdy jest w
                        // stanie wojny z kimkolwiek, zostaje bufor >= reserve po zapłacie,
                        // miasto ma pokrycie Manpower i owner nie kupił jeszcze w tej turze
                        // (cap aiRushParams.maxPerTurn, R-STAWKI-STROJENIE: econ-params.json
                        // globalne.ai_rush_jednostka_max_na_ture). purchaseRecruitmentUnit
                        // (ownerId-agnostyczne, patrz definicja) sam pobiera złoto+surowiec+
                        // Manpower i kolejkuje -- NIE pobieramy nic drugi raz tutaj.
                        const atWarWithAnyone = getDiploRelation(ownerId, 0).status === 'wojna'
                          || aiOwnerList.some(
                            (other) => other !== ownerId && getDiploRelation(ownerId, other).status === 'wojna',
                          );
                        const boughtThisTurn = aiUnitGoldRushBoughtByOwner.get(ownerId) ?? 0;
                        const wantsRush = shouldAIRushBuyUnit({
                          atWar: atWarWithAnyone,
                          treasury: ownerTreasury(ownerId),
                          reserve: aiRushParams.reserve,
                          goldCost: item.koszt,
                          hasManpower: canAffordUnitManpower(
                            city, empireEpochForOwner(ownerId), civManpowerMultsForOwner(ownerId).maxMult, cmd.buildingId,
                          ),
                          boughtThisTurn,
                          maxPerTurn: aiRushParams.maxPerTurn,
                        });
                        if (wantsRush && purchaseRecruitmentUnit(cmd.cityId, cmd.buildingId, item.koszt, ownerId)) {
                          aiUnitGoldRushBoughtByOwner.set(ownerId, boughtThisTurn + 1);
                          console.log(`[AI ${ownerId}] Rush jednostki za zloto: ${cmd.buildingId}`);
                          continue;
                        }
                        const unitDef = data.units.find(u => u.Jednostka === item.id);
                        const cost = unitStockCost(unitDef);
                        if (Object.keys(cost).length > 0) {
                          if (!canAffordBuildingStock(ownerSurowcePoolFor(ownerId), cost)) {
                            console.warn(
                              `[AI ${ownerId}] Build skipped (brak surowca w magazynie panstwa): ${cmd.buildingId}`,
                            );
                            continue;
                          }
                          deductOwnerStockCost(ownerId, cost);
                        }
                      }
                      cityProd.set(cmd.cityId, enqueue(prod0, item));
                    } else {
                      console.warn(`[AI ${ownerId}] Build no-op: nieznany ${cmd.buildingId}`);
                    }
                  }
                  continue;
                }

                if (cmd.type === 'buildImprovement') {
                  // D-IMPROVEMENTS: egzekucja jak applyBuildRequest (gracz), ale AI commituje
                  // od razu -- brak pendingImprovementsTurn/cofnięcia w tej samej turze.
                  const researchedAi = aiResearchDone.get(ownerId) ?? new Set<string>();
                  if (!isImprovementTechUnlocked(cmd.key, researchedAi)) continue;
                  const meta = getImprovementMeta(cmd.key);
                  const koszt = meta?.kosztPraca ?? 0;
                  const poolBefore = aiPracaPoolByOwner.get(ownerId) ?? 0;
                  if (poolBefore < koszt) continue;
                  const hexKey = keyOf(cmd.q, cmd.r);
                  const hexForImprovement = map.hexes[hexKey];
                  if (!hexForImprovement) continue;

                  // TEMAT #8 (2026-07-23): `wyrab` (wyrąb lasu) = typ 'wycinka', NIE stała
                  // warstwa -- nie idzie do `placedImprovements` (patrz applyBuildRequest gracza
                  // wyżej, sekcja `req.action === 'wycinka'`). AI nie ma per-owner wieloturowego
                  // `hexClearingStates` (tick niżej w pętli tury liczy WYŁĄCZNIE ownerId 0 /
                  // gracza), więc AI commituje efekt końcowy od razu: usuwa nakładkę lasu,
                  // netto-zero Pracy (koszt startu zwracany przez `wycinka.praca_per_tura ×
                  // tury` z terrain-improvements.json -- dziś 5×1=5, czyli symetryczne z kosztem).
                  if (meta?.typ === 'wycinka') {
                    if (hexForImprovement.nakladka !== Nakladka.Las) continue; // już wycięte (wyścig miast)
                    const refund = meta.clearing
                      ? meta.clearing.pracaPerTura * meta.clearing.tury
                      : 0;
                    aiPracaPoolByOwner.set(ownerId, poolBefore - koszt + refund);
                    hexForImprovement.nakladka = Nakladka.Brak;
                    hideDecorAtHex(hexKey);
                    syncResourceOverlayAtHex(hexKey);
                    console.log(
                      `[AI ${ownerId}] Wyrąb @ (${cmd.q},${cmd.r}) (-${koszt}+${refund} Pracy, netto ${refund - koszt})`,
                    );
                    continue;
                  }

                  const prevLayers = placedImprovements.get(hexKey) ?? [];
                  // Bezpiecznik wyścigu: hex już ma ten klucz (np. inne miasto TEGO SAMEGO AI
                  // zdążyło go postawić wcześniej w tej samej turze) -- pomiń bez kosztu.
                  if (prevLayers.includes(cmd.key)) continue;
                  aiPracaPoolByOwner.set(ownerId, poolBefore - koszt);
                  const nextLayers: PlacedLayers = [...prevLayers, cmd.key];
                  placedImprovements.set(hexKey, nextLayers);
                  syncHexUlepszenieFields(hexKey, nextLayers);
                  spawnImprovementMesh(hexKey);
                  // Perf (patrz raport pkt d): O(1) sync zamiast pełnomapowego
                  // rebuildResourceOverlays() -- AI buduje to co turę, dla wielu właścicieli.
                  syncResourceOverlayAtHex(hexKey);
                  console.log(`[AI ${ownerId}] Ulepszenie: ${cmd.key} @ (${cmd.q},${cmd.r}) (-${koszt} Pracy)`);
                  continue;
                }

                // Unknown command type -- safe no-op.
                console.warn('[AI] Nieznany typ komendy:', (cmd as any).type);
              } catch (eCMD) {
                console.error(`[AI ${ownerId}] Blad wykonania komendy ${(cmd as { type?: string }).type}:`, eCMD);
              }
            }
            // Follow-up „przenieś stolicę" (Q2=A): raz na turę, po przetworzeniu
            // wszystkich komend tego ownera -- sprawdź zagrożenie stolicy AI.
            maybeRelocateThreatenedAiCapital(ownerId);
          }

            // D-START posiłki v2 (pkt C): po przetworzeniu WSZYSTKICH AI tej tury --
            // siostry tego samego klastra zagrożone wrogiem mogą proaktywnie
            // sprzymierzyć się (próg obniżony 30%), co odblokowuje posiłki (pkt A).
            try {
              formSisterAlliancesIfThreatened();
            } catch (eSisterAlly) {
              console.error('[Dyplomacja] Blad sojuszy siostrzanych:', eSisterAlly);
            }

            // E6 (2026-07-23): AI↔AI proaktywne Umowy Handlowe (patrz formAiAiTradeAgreementsIfEligible).
            try {
              formAiAiTradeAgreementsIfEligible();
            } catch (eAiAiTrade) {
              console.error('[Dyplomacja] Blad Umow Handlowych AI-AI:', eAiAiTrade);
            }

            if (!aiTurnAwaitingBattle) {
              scanAutoSiegesAfterAiTurn();
            }
          };
          await runAiPhase();
        } catch (eAILoop) {
          console.error('[AI] Blad petli AI:', eAILoop);
        }

        // ===================================================================
        // BARBARIANS TICK: spawn camps + move barbarian units
        // ===================================================================
        setTurnTransition(94, 'Barbarzyńcy…', 'Barbarzyńcy', nextTurnNum);
        await yieldTurnTransitionUi();
        try {
          const barbLevel = _menuAdvanced?.barbariansLevel ?? 'wielu';
          const barbLive = scaleBarbParamsForLevel(barbParams, barbLevel);
          if (barbariansActive(turn, barbLive, player.era, barbLevel)) {
            // Spawn new camps if needed (seed from turn to vary each game).
            // TEMAT #15: sloty lądowe liczone bez obozów nadmorskich (osobny limit).
            const newCamps = spawnCamps(map, barbCamps.filter(c => c.naval !== true), cities, barbLive, turn * 31337);
            barbCamps = [...barbCamps, ...newCamps];
            if (newCamps.length > 0) {
              console.log(`[Barbarzyncy] Tura ${turn}: nowe obozy: ${newCamps.length}`);
            }

            // TEMAT #15 (Ludy Morza na morzu): w epoce Brązu obozy nadmorskie
            // na Wybrzeżu/wysepkach — jednostki spawnują ZAOKRĘTOWANE na wodzie.
            const seaBarbParams = loadSeaBarbParams(data, _menuDifficulty);
            if (player.era === 2) {
              const newSeaCamps = spawnSeaCamps(map, barbCamps, cities, barbLive, seaBarbParams, turn * 31337 + 7);
              barbCamps = [...barbCamps, ...newSeaCamps];
              if (newSeaCamps.length > 0) {
                console.log(`[Ludy Morza] Tura ${turn}: nowe obozy nadmorskie: ${newSeaCamps.length}`);
              }
            }

            // Tick camps: decrement cooldowns + collect spawns.
            // Ludy Morza (BACKLOG): w epoce Brąz (2) pełne zastąpienie domyślnego
            // typu barbarzyńcy -- oba warianty naprzemiennie wg tury, wszystkie
            // poziomy trudności jednakowo (decyzja właściciela 2026-07-19).
            const barbLiveForSpawn = player.era === 2
              ? { ...barbLive, unitTypeId: pickBronzeBarbUnit(turn) }
              : barbLive;
            const barbUnitsNow = units.filter(u => isBarbarian(u.ownerId)) as BarbUnit[];
            const tickRes = tickCamps(barbCamps, barbUnitsNow, units, map, barbLiveForSpawn);
            barbCamps = tickRes.camps;

            // Instantiate spawned barbarian units.
            for (const spawn of tickRes.spawns) {
              const def = (data.units as any[]).find((u: any) => u['Jednostka'] === spawn.typeId);
              const ruch = def ? normFieldVal(def['Ruch'], 2) : 2;
              const newUnit: BarbUnit = {
                id: 'barb_' + turn + '_' + spawn.campId + '_' + Math.random().toString(36).slice(2),
                ownerId: BARBARIAN_OWNER_ID,
                typeId: spawn.typeId,
                category: 'wojownik',
                q: spawn.q,
                r: spawn.r,
                ruch,
                ruchLeft: 0,
              };
              // TEMAT #15: spawn z obozu nadmorskiego = rajder Ludów Morza,
              // na wodzie startuje zaokrętowany (permanentnie pływa do rajdu).
              const fromNavalCamp = barbCamps.find(c => c.id === spawn.campId)?.naval === true;
              if (fromNavalCamp) newUnit.seaRaider = true;
              if (spawn.embarked === true) newUnit.embarked = true;
              units.push(newUnit);
              console.log(`[Barbarzyncy] Spawn: ${spawn.typeId} @ (${spawn.q},${spawn.r})` + (spawn.embarked ? ' [na wodzie]' : ''));
            }

            // Move barbarian units.
            // TEMAT #15: rajderzy Ludów Morza (seaRaider/zaokrętowani) mają
            // własną logikę rajdową; reszta = klasyczna logika lądowa.
            const barbUnitsAfterSpawn = units.filter(u => isBarbarian(u.ownerId)) as BarbUnit[];
            const landBarbs = barbUnitsAfterSpawn.filter(u => u.seaRaider !== true && u.embarked !== true);
            const seaBarbs = barbUnitsAfterSpawn.filter(u => u.seaRaider === true || u.embarked === true);
            const playerUnitsForBarbs = units.filter(u => !isBarbarian(u.ownerId));
            const barbCmds = decideBarbarianMoves(landBarbs, playerUnitsForBarbs, cities, barbCamps, map, barbLive);
            if (seaBarbs.length > 0) {
              const raidTargets = collectSeaRaidTargets(map);
              barbCmds.push(...decideSeaPeoplesRaids(
                seaBarbs, playerUnitsForBarbs, cities, raidTargets, map, seaBarbParams, turn,
              ));
            }
            for (const bcmd of barbCmds) {
              try {
                const bu = units.find(u => u.id === bcmd.unitId);
                if (!bu) continue;
                if (bcmd.type === 'move') {
                  if (!canUnitOccupyCityHex(bu.ownerId, bcmd.toQ, bcmd.toR, cities)) continue;
                  bu.q = bcmd.toQ;
                  bu.r = bcmd.toR;
                  bu.ruchLeft = 0;
                  // TEMAT #15: woda -> zaokrętowanie, ląd -> desant.
                  applyEmbarkStateAfterMove([bu], map);
                } else if (bcmd.type === 'raid') {
                  // TEMAT #15: rajd Ludów Morza — wejście + zniszczenie ulepszenia.
                  const raidKey = keyOf(bcmd.toQ, bcmd.toR);
                  const raidHex = map.hexes[raidKey];
                  if (!raidHex || raidHex.ulepszenie === Ulepszenie.Brak) continue;
                  if (!canUnitOccupyCityHex(bu.ownerId, bcmd.toQ, bcmd.toR, cities)) continue;
                  const destroyed = raidHex.ulepszenie;
                  raidHex.ulepszenie = Ulepszenie.Brak;
                  spawnImprovementMesh(raidKey);
                  bu.q = bcmd.toQ;
                  bu.r = bcmd.toR;
                  bu.ruchLeft = 0;
                  applyEmbarkStateAfterMove([bu], map);
                  console.log(`[Ludy Morza] Rajd: zniszczono '${destroyed}' @ (${bcmd.toQ},${bcmd.toR})`);
                  showHintMessage(`Rajd Ludów Morza — zniszczone ulepszenie: ${destroyed}!`, 4500);
                } else if (bcmd.type === 'attack') {
                  const target = units.find(u => u.id === bcmd.targetUnitId);
                  if (!target) continue;
                  const atkRoster = collectBattleRoster(bu, units, 'attacker');
                  const defRoster = collectBattleRoster(target, units, 'defender');
                  const hexKey2 = keyOf(target.q, target.r);
                  const hexObj2 = map.hexes[hexKey2];
                  const teren2: string = hexObj2 ? (hexObj2.terenBazowy as string) : 'Rownina';
                  const structBonusBarb = structureDefenseBonusFor(target.q, target.r);
                  if (defRoster.some(u => u.ownerId === 0)) {
                    launchIncomingMapFieldBattle(
                      atkRoster,
                      defRoster,
                      target.q,
                      target.r,
                      teren2,
                      structBonusBarb,
                      'Atak barbarzyńców',
                      () => { /* reszta tury już poszła — tylko odśwież mapę */ },
                      worldTerrainFromHex(hexObj2),
                    );
                    continue;
                  }
                  doAutoPowerMapBattle(
                    atkRoster,
                    defRoster,
                    target.q,
                    target.r,
                    teren2,
                    structBonusBarb,
                  );
                }
              } catch (eBarbCmd) {
                console.error('[Barbarzyncy] Blad komendy:', eBarbCmd);
              }
            }
            evictForeignUnitsFromCityHexes();
            syncUnitsRender();
          }
        } catch (eBarb) {
          console.error('[Barbarzyncy] Blad ticku:', eBarb);
        }

        // ===================================================================
        // VICTORY CHECK: evaluate for human player (0) + AI owners
        // ===================================================================
        setTurnTransition(98, 'Sprawdzanie zwycięstwa…', 'Gracz', nextTurnNum);
        await yieldTurnTransitionUi();
        try {
          if (!gameOver) {
            // Build VictoryPlayer list from all non-barbarian owners.
            const allOwners = new Set<number>([0]);
            for (const u of units) { if (u.ownerId >= 0) allOwners.add(u.ownerId); }
            for (const c of cities) { if (c.ownerId >= 0) allOwners.add(c.ownerId); }
            const vPlayers: VictoryPlayer[] = [];
            for (const oid of allOwners) {
              vPlayers.push({
                id: oid,
                typCywilizacji: oid === 0 ? player.civType : (aiOwnerCivMap.get(oid) ?? 'grecy'),
                ai: oid !== 0,
              });
            }

            // Check player.
            const settlersCount = units.filter(u => u.ownerId === 0 && u.category === 'osadnik').length;
            refreshObjectivePowerCache();
            const potegiWszystkich: number[] = [];
            for (const oid of allOwners) {
              potegiWszystkich.push(objectivePowerForOwner(oid));
            }
            const scopeIds = techIdsInGameScope(data.tech, OSTATNIA_EPOKA_GRY_V1);
            const vInput: VictoryInput = {
              players: vPlayers,
              cities,
              gracz: 0,
              liczbaOsadnikow: settlersCount,
              graczKiedysMialMiasto: playerEverOwnedCity,
              potegaGracza: objectivePowerForOwner(0),
              potegiWszystkich,
              graczEra: player.era,
              ostatniaEpoka: OSTATNIA_EPOKA_GRY_V1,
              wszystkieTechZbadane: allTechInScopeResearched(player.zbadane, scopeIds),
              rakietaWystrzelona: player.rakietaWystrzelona,
              victoryMode: _menuAdvanced?.victoryMode ?? 'moc_i_dominacja',
            };
            const vResult = checkVictory(vInput);
            if (vResult !== null) {
              gameOver = true;
              const isVictory2 = vResult.rodzaj !== 'przegrana';
              const eraLabels = ['', 'Kamień', 'Brąz', 'Żelazo'];
              const screenData = buildVictoryScreenData(vResult, {
                turn,
                powerShare: potegiWszystkich.length > 0
                  ? powerShare(objectivePowerForOwner(0), potegiWszystkich)
                  : undefined,
                eraLabel: eraLabels[player.era] ?? ('Epoka ' + player.era),
                civLabel: player.civType,
              });
              showVictoryScreen(screenData, () => location.reload());
              if (isVictory2) {
                showHintMessage('<b>' + formatVictoryTitle(vResult.rodzaj, turn) + '</b>', 4000);
              }
              console.log('[Victory] ' + formatVictoryTitle(vResult.rodzaj, turn) + ' gracz=0 rodzaj=' + vResult.rodzaj);
            }
          }
        } catch (eVic) {
          console.error('[Victory] Blad sprawdzania warunkow zwyciestwa:', eVic);
        }

        markCityStateDirty(); // D10: koniec tury — siatka bezpieczeństwa (wzrost/tech/zdobycie/AI)
        updateHud();
        cityRenderer.sync(cities, _cityRenderOpts());
        refreshWorkerFieldOverlay();
        // Refresh fog after end-turn so new unit positions update visibility.
        refreshFog();
        // C-SENTRY-Q1 wariant A: pozycje wszystkich jednostek (gracz + AI) są już
        // finalne dla tej tury — teraz sprawdzamy, czy jakaś śpiąca (sentry)
        // jednostka ma wroga w polu widzenia i trzeba ją obudzić.
        wakeSentryUnitsOnEnemyContact();
        executePlannedMarchesEndTurn();
        setTurnTransition(100, `Tura ${turn} — twoja kolej`, 'Gracz', turn);
        await yieldTurnTransitionUi();
        } catch (errEndTurn) {
          console.error('[EndTurn] Blad przejscia tury:', errEndTurn);
        } finally {
          endTurnTransition();
          endTurnInProgress = false;
          flushDeferredPlayerUnitReveals();
          flushDeferredMergePrompts();
        }
        })();
        return;
      }
    });

    // -----------------------------------------------------------------------
    // Render loop (jedna instancja RAF — wielokrotne startRenderLoop ignorowane)
    // -----------------------------------------------------------------------

    let renderLoopStarted = false;

    function startRenderLoop(): void {
      if (renderLoopStarted) return;
      renderLoopStarted = true;
      prevTime = performance.now() / 1000;
      renderLoop();
    }

    function renderLoop() {
      requestAnimationFrame(renderLoop);

      // --- Delta time (capped at 100 ms to skip large jumps on tab switch) ---
      const now = performance.now() / 1000;
      const dt = Math.min(now - prevTime, 0.1);
      prevTime = now;

      // Średnia FPS z okna ~1 s (tanie: 2 dodawania/klatkę; A4 overlay F9).
      fpsAccumFrames++;
      fpsAccumTime += dt;
      if (fpsAccumTime >= 1) {
        fps1s = fpsAccumFrames / fpsAccumTime;
        fpsAccumFrames = 0;
        fpsAccumTime = 0;
      }

      // --- Drive animation (only outside gallery mode) ---
      if (!galleryOn && isAnimating && anim !== null) {
        anim.t += dt / ANIM_SEG_DUR;

        // Advance through any fully elapsed segments.
        while (anim.t >= 1 && anim.seg < anim.points.length - 2) {
          anim.t -= 1;
          anim.seg++;
        }

        const lastSeg = anim.points.length - 2; // index of the final segment

        if (anim.seg >= lastSeg && anim.t >= 1) {
          // --- Animation complete ---
          const finishedId = anim.id;
          const destQ = anim.destQ;
          const destR = anim.destR;
          const fromQ = anim.fromQ;
          const fromR = anim.fromR;
          const moveCost = anim.cost;
          const movedStackIds = anim.movingStackIds;
          const u = units.find(x => x.id === finishedId);
          if (u) {
            const stack = movedStackIds
              .map(sid => units.find(x => x.id === sid))
              .filter((su): su is RuntimeUnit => su != null);
            for (const su of stack) {
              su.q = destQ;
              su.r = destR;
            }
            deductStackRuchLeft(stack, moveCost);
            // TEMAT #15: automatyczna (dez)embarkacja wg terenu docelowego
            // (woda -> embarked, ląd -> zejście na ląd) + przebudowa tokenów.
            if (applyEmbarkStateAfterMove(stack, map)) syncUnitsRender();
          }
          anim = null;
          isAnimating = false;
          forceVisibleUnitId = null;

          refreshFog();
          validateActiveSieges();

          // GRAFIKA-TEREN-2 / WIOSKI: jednostka gracza kończy ruch na wiosce -> nagroda + znika.
          if (u && u.ownerId === 0) {
            checkVillageRewardAt(destQ, destR);
          }

          const entryCity = u && cities.find(
            c => c.q === destQ && c.r === destR && c.ownerId === u.ownerId,
          );
          if (entryCity && u) {
            finishUnitEnterCityHex(u, entryCity);
            refreshCityPanelIfOpen();
          }
          promptMergeIfCoLocated(movedStackIds.length > 0 ? movedStackIds : [finishedId], fromQ, fromR, moveCost);
          if (selectedId === finishedId) {
            const sel = units.find(x => x.id === finishedId);
            if (sel) {
              unitRenderer.setSelectionHex(sel.q, sel.r, sel.ownerId);
              if (sel && stackCanMove(sel) && !isArmyMergePanelOpen() && !isArmySplitPanelOpen()) {
                reachable = reachableWithMergeTargets(sel);
                unitRenderer.setHighlight(reachable);
              } else if (!isArmyMergePanelOpen() && !isArmySplitPanelOpen()) {
                reachable = new Set<string>();
                unitRenderer.clearHighlight();
              }
            }
          }
          if (pendingMarchHint && pendingMarchHint.unitId === finishedId) {
            const attackTargetId = marchAttackTargets.get(finishedId);
            const hint = pendingMarchHint;
            pendingMarchHint = null;
            if (u && attackTargetId && tryLaunchMarchAttack(u, attackTargetId)) {
              // preBattle uruchomione — marsz wyczyszczony w tryLaunchMarchAttack
            } else {
              finishMarchSegmentHints(
                hint.unitId,
                hint.arrived,
                hint.stopReason,
                hint.stopDetail,
              );
            }
          }
          updateHud();
          refreshD1bHud();
          processMarchQueue();
          // C: auto-cykl „bęben" — jednostka gracza wyczerpała ruch (bez marszu
          // wieloturowego w toku) → przejdź automatycznie do następnej jednostki z ruchem.
          if (u && u.ownerId === 0 && selectedId === finishedId
              && !stackCanMove(u) && !plannedMarches.has(finishedId)
              && !isAnimating && isWorldMapUnitMode()) {
            cycleToNextMovableUnit(finishedId);
          }
        } else {
          // --- Interpolate token along current segment ---
          const tc = Math.min(Math.max(anim.t, 0), 1);
          const p0 = anim.points[anim.seg]!;
          const p1 = anim.points[anim.seg + 1]!;
          unitRenderer.setTokenWorldPosition(
            anim.id,
            p0.x + (p1.x - p0.x) * tc,
            p0.y + (p1.y - p0.y) * tc,
            p0.z + (p1.z - p0.z) * tc,
          );
          for (const sid of anim.movingStackIds) {
            if (sid === anim.id) continue;
            unitRenderer.setTokenWorldPosition(
              sid,
              p0.x + (p1.x - p0.x) * tc,
              p0.y + (p1.y - p0.y) * tc,
              p0.z + (p1.z - p0.z) * tc,
            );
          }
        }
      }

      // --- Gallery label projection ---
      // Each frame in gallery mode: project each token's world position to
      // screen space using THREE.Vector3.project(camera), then convert NDC
      // coordinates to CSS pixels for the floating label div.
      //
      // Projection formula:
      //   worldPt.project(camera)  -> NDC (x,y,z) in [-1,1]^3
      //   px = (ndcX * 0.5 + 0.5) * canvasWidth   (left edge = 0)
      //   py = (-ndcY * 0.5 + 0.5) * canvasHeight  (top edge = 0)
      // If NDC z > 1: point is behind the camera near plane -> hide label.
      if (galleryOn && galleryLabels.length > 0) {
        const cw = canvas.clientWidth  || window.innerWidth;
        const ch = canvas.clientHeight || window.innerHeight;

        for (let i = 0; i < galleryLabels.length; i++) {
          const lbl = galleryLabels[i];
          if (!lbl) continue;
          const pos = galleryPositions[i];
          if (!pos) continue;

          // Lift the label anchor above the token base.
          const worldPt = new THREE.Vector3(pos.x, pos.y + GALLERY_LABEL_LIFT, pos.z);

          // Project world -> NDC (in-place mutation of worldPt).
          worldPt.project(camera);

          // Behind camera: hide.
          if (worldPt.z > 1.0) {
            lbl.style.display = 'none';
            continue;
          }

          // NDC -> CSS pixels.
          const px = ( worldPt.x * 0.5 + 0.5) * cw;
          const py = (-worldPt.y * 0.5 + 0.5) * ch;

          lbl.style.display = 'block';
          lbl.style.left    = Math.round(px) + 'px';
          lbl.style.top     = Math.round(py) + 'px';
        }
      }

      if (cities.some(c => c.oblegane)) {
        siegeMarkerRenderer.pulse(now);
        updateSiegeHtmlLabels();
      }

      // --- Camera and render (always run, even during animation) ---
      camCtrl.update();
      {
        const { dist } = camCtrl.getFocusState();
        const { minDist, maxDist } = camCtrl.getDistLimits();
        setZoomLod(dist, minDist, maxDist);
      }

      // TEMAT #23 — woda pozycyjna (ambience): próbka udziału wody w kadrze co
      // ~0.5 s, NIE co klatkę (patrz computeWaterView()). setAmbienceWaterView()
      // jest no-op zanim odgłosy natury wystartują — bezpieczne wołać zawsze.
      ambWaterSampleAccum += dt;
      if (ambWaterSampleAccum >= 0.5) {
        ambWaterSampleAccum = 0;
        const view = computeWaterView();
        setAmbienceWaterView(view.frac, view.wariant);
      }

      renderer.info.reset();
      // FPS cienie na żądanie: token jednostki (caster) rusza się co klatkę tylko podczas
      // animacji ruchu; galeria może obracać modele. Poza tym (pan/idle) shadow pass pomijany.
      if (isAnimating || galleryOn) renderer.shadowMap.needsUpdate = true;
      renderer.render(scene, camera);
      if (isPerfDebugOverlayVisible()) {
        let meshCount = 0;
        let instancedCount = 0;
        scene.traverse((obj) => {
          if (obj instanceof THREE.InstancedMesh) {
            instancedCount += obj.count;
            meshCount++;
          } else if (obj instanceof THREE.Mesh) {
            meshCount++;
          }
        });
        const { dist } = camCtrl.getFocusState();
        updatePerfDebugOverlay({
          fps: fps1s,
          drawCalls: renderer.info.render.calls,
          triangles: renderer.info.render.triangles,
          meshCount,
          instancedCount,
          zoomLod: getZoomLodLevel(),
          cameraDist: dist,
          fogMs: getLastSetFogMs(),
        });
      }
    }
    // -----------------------------------------------------------------------
    // START SCREEN - Menu overlay (shown before game starts)
    // Canvas + scene already initialized above so smoke test passes.
    // Menu is a fixed overlay (z-index:500); game renders underneath.
    // -----------------------------------------------------------------------

    function applyMenuParams(params: NewGameParams): void {
      const VALID_TYP: TypSwiata[] = ['kontynenty', 'pangea', 'wyspy', 'ziemia'];
      const resolveTypSwiata = (): TypSwiata => {
        const raw = params.typSwiata || typSwiataFromMenuLabel(params.worldType || 'Kontynenty');
        return VALID_TYP.includes(raw as TypSwiata) ? (raw as TypSwiata) : 'kontynenty';
      };
      _menuTypSwiata = resolveTypSwiata();
      _menuEpochId = params.epochId || 'kamien';

      // Map UI difficulty string to engine difficulty key
      const diffMap: Record<string, 'easy' | 'normal' | 'hard'> = {
        'Łatwy': 'easy',
        'Normalny': 'normal',
        'Trudny': 'hard',
        'easy': 'easy',
        'normal': 'normal',
        'hard': 'hard',
      };
      const diff = diffMap[params.difficulty] ?? 'normal';
      _menuDifficulty = diff;
      startRevealRadius = startRevealRadiusForDifficulty(diff);

      // R-TRUDNOSC-1 (Maciej 2026-07-24): trudność miast-państw -- suwak OSOBNY od głównej
      // trudności gry, w „Zaawansowane opcje" kreatora (params.advanced.cityStateDifficultyOverride).
      // Brak override (null/nieprawidłowa wartość -- w tym stare sejwy sprzed tego pola) ->
      // fallback = główna trudność `diff` (zero regresji domyślnej).
      const csOverrideRaw = params.advanced?.cityStateDifficultyOverride;
      _menuCityStateDifficulty =
        csOverrideRaw === 'easy' || csOverrideRaw === 'normal' || csOverrideRaw === 'hard'
          ? csOverrideRaw
          : diff;

      // D-START posiłki v2 (Maciej 2026-07-21 przeróbka ZMIANA 1, R-TRUDNOSC-1 2026-07-24
      // odpięcie od globalnej): „Wsparcie miast-państw" wynika z TRUDNOŚCI MIAST-PAŃSTW
      // (_menuCityStateDifficulty), NIE z głównej trudności gry (wyższa trudność miast-państw
      // = twardsze miasta-państwa = łatwiej sojusz + mocniejsze posiłki). Fallback 'normal'
      // gdyby _menuCityStateDifficulty miało nieoczekiwaną wartość (nie powinno się zdarzyć).
      const citySupportByDifficulty: Record<'easy' | 'normal' | 'hard', 'low' | 'normal' | 'strong'> = {
        easy:   'low',
        normal: 'normal',
        hard:   'strong',
      };
      _menuCitySupport = citySupportByDifficulty[_menuCityStateDifficulty] ?? 'normal';
      _menuCivId = params.civId || 'rzymianie';
      _menuMapSize = params.mapSize || 'Standardowy';
      _menuCivTypesCount = params.civTypesCount || defaultCivTypesFromMapLabel(_menuMapSize);
      _menuCityStates = clampMiastaPanstwaCount(
        params.cityStatesCount
        || parseInt(String(params.rivals), 10)
        || defaultMiastaPanstwaFromMapLabel(_menuMapSize),
      );
      _menuRivals = _menuCityStates;
      _menuWorldDensity = params.worldDensity ?? { ...DEFAULT_WORLD_DENSITY };

      // Epoka startowa z kreatora (Kamień=1, Brąz=2, Żelazo=3)
      const ERA_MAP: Record<string, number> = { kamien: 1, braz: 2, zelazo: 3 };
      player.era = ERA_MAP[params.epochId] ?? 1;

      // Wepnij dane nacji gracza (civType + bonusy) z civs.json
      {
        const chosenCiv = (data.civs.cywilizacje as any[]).find(
          (c: any) => (c.ikonaId ?? '') === _menuCivId,
        );
        if (chosenCiv) {
          player.civType = _menuCivId;
          player.civBonusy = Array.isArray(chosenCiv.bonusy) ? chosenCiv.bonusy : [];
          console.log(
            `[NewGame] Nacja gracza: ${chosenCiv.Cywilizacja} (${ _menuCivId})`,
            `bonusy: ${player.civBonusy.length}`,
          );
        } else {
          player.civType = _menuCivId;
          player.civBonusy = [];
          console.warn(`[NewGame] Nacja '${_menuCivId}' nie znaleziona w civs.json — brak bonusów`);
        }
        fillAiOwnerCivMap(_menuCivId, _gameSeed);
        console.log(`[NewGame] AI nacje:`, Object.fromEntries(aiOwnerCivMap));
      }

      // Map UI speed string -> TempoGry
      const tempoMap: Record<string, TempoGry> = {
        'Szybka': 'szybka',
        'Standardowa': 'standardowa',
        'Normalna': 'standardowa',
        'Długa': 'dluga',
        'szybka': 'szybka',
        'standardowa': 'standardowa',
        'dluga': 'dluga',
      };
      player.tempoGry = tempoMap[params.speed] ?? 'standardowa';
      player.buildingCostPace = params.advanced?.buildingCostPace ?? 'niski';
      player.kosztJednostekPace = params.advanced?.kosztJednostekPace ?? 'niski';
      player.wzrostLudnosciPace = params.advanced?.wzrostLudnosciPace ?? 'wysoki';
      _menuAdvanced = params.advanced ? { ...params.advanced } : undefined;
      _currentRenderOptions = mapRenderOptionsFromParams(params);
      const mqTier = mapQualityTierFromParams(params);
      const mqBundle = bundledMapQualityPreset(mqTier);
      console.log(
        '[NewGame] tempoGry =', player.tempoGry,
        '· kosztJednostekPace =', player.kosztJednostekPace,
        '· buildingCostPace =', player.buildingCostPace,
        '· wzrostLudnosciPace =', player.wzrostLudnosciPace,
        '· epoka=', player.era, '(' + (params.epochId || 'kamien') + ')',
        '· typSwiata=', _menuTypSwiata, '(' + (params.worldType || '') + ')',
        '· jakoscMapy=', qualityTierToLabel(mqTier),
        '→ render=' + mqBundle.renderQuality + ', mapDetail=' + mqBundle.mapDetailQuality,
        _menuAdvanced ? ('· advanced=' + JSON.stringify(_menuAdvanced)) : '',
      );
      // Rebuild city panel config with new difficulty
      configureCityPanel({
        data,
        difficulty: _menuDifficulty,
        getCities: () => cities,
        getTradeRoutes: () => tradeRoutes,
        getOwnerLabel: (ownerId: number) => ownerDiploLabel(ownerId),
        getCityBuildingFlags: (cityId: string) => ({
          liczbaAktywnychTrasHandlowych: tradeRouteCountByCity.get(cityId) ?? 0,
        }),
        getEpoch: (ownerId: number) => empireEpochForOwner(ownerId),
      getManpowerSnapshot: (cityId: string) => {
        const c = cities.find(x => x.id === cityId);
        if (!c) return null;
        const ep = empireEpochForOwner(c.ownerId);
        const mpMults = civManpowerMultsForOwner(c.ownerId);
        return cityManpowerSnapshot(c, ep, mpMults.regenMult, mpMults.maxMult);
      },
      getOwnerColor: civColorFn,
        getUnlockedTechs: (_ownerId: number) => Array.from(player.zbadane),
        getBuiltBuildingIds: (cityId: string) => cityBuilt.get(cityId) ?? [],
        // audyt #33: panel miasta jest tylko dla gracza (openCityPanelForPlayer) -- ulepszenia
        // WYŁĄCZNIE z terytorium gracza (owner 0), inaczej kopalnia AI odblokowywała Brąz/Żelazo.
        getPlacedImprovements: () => placedImprovementsWithBrazTradeGrant(0, placedImprovementsForOwner(0)),
        getProduction: (cityId: string) => {
          const p = cityProd.get(cityId);
          return p ? { ...p, kolejka: [...p.kolejka] } : null;
        },
        setProduction: (cityId: string, p: CityProduction) => {
          setCityProduction(cityId, p);
        },
        getTreasury: (_ownerId: number) => player.skarbiec,
        onRushBuy: (cityId: string, _item: any, koszt: number) => {
          if (player.skarbiec >= koszt) {
            player.skarbiec -= koszt;
            const rBase = cityProd.get(cityId) ?? { kolejka: [], postep: 0 };
            const r = rushProduction(rBase);
            cityProd.set(cityId, r.prod);
            if (r.completed) {
              const rc = cities.find(ct => ct.id === cityId);
              if (rc) {
                const applied = applyProductionCompleted(rc, cityId, r.completed, r.prod);
                if (applied.requeueManpower) {
                  player.skarbiec += koszt;
                  console.warn('[Rush] Brak Manpower — zwrot zlota, jednostka w kolejce');
                }
                cityProd.set(cityId, applied.prod);
              }
            }
            updateHud();
          }
        },
        onChange: (_cityId: string) => { updateHud(); },
        onAutoManage: (cityId: string) => {
          if (autoManageCities.has(cityId)) {
            autoManageCities.delete(cityId);
            console.log(`[AutoManage] Wylaczono dla ${cityId}`);
          } else {
            autoManageCities.add(cityId);
            console.log(`[AutoManage] Wlaczono dla ${cityId}`);
          }
        },
        getPodzialHandlu: (cityId: string) => cities.find(c => c.id === cityId)?.podzialHandlu ?? null,
        getPodzialPracy: (cityId: string) => cities.find(c => c.id === cityId)?.podzialPracy ?? null,
        onPodzialHandluChange: (cityId: string, split) => {
          const c = cities.find(ct => ct.id === cityId);
          if (c && c.ownerId === 0) {
            c.podzialHandlu = { ...split };
            markCityStateDirty(); // D10: podział podatków/handlu → przelicz
            updateHud();
          }
        },
        onPodzialPracyChange: (cityId: string, split) => {
          const c = cities.find(ct => ct.id === cityId);
          if (c && c.ownerId === 0) {
            c.podzialPracy = { procentBudynki: split.procentBudynki };
            markCityStateDirty(); // D10: podział pracy → przelicz
            updateHud();
          }
        },
        onPurchaseUnit: (cityId: string, itemId: string, koszt: number) => {
          purchaseRecruitmentUnit(cityId, itemId, koszt);
        },
        getCivBonusy: (ownerId: number) => civBonusyForOwnerId(ownerId),
        getCivKey: (ownerId: number) => civKeyForOwnerId(ownerId),
        getOrderState: (cityId: string) => cityOrderState.get(cityId) ?? null,
      getTurn: () => turn,
        getCityHealth: (cityId: string) => {
          const city = cities.find(c => c.id === cityId);
          if (!city) return null;
          const builtIds = cityBuilt.get(cityId) ?? [];
          const tiles = cityWorkedTilesForEconomy(city, map, buildAllTerritoryNodes());
          return computeCityHealthBreakdown(
            city.population, tiles, builtIds, data.societyParams, _menuDifficulty,
            { city, map },
          );
        },
        ...extraCityPanelConfig(),
      });
      configurePreBattle({ getCivBonusy: civBonusyForOwnerId });
      _lastNewGameParams = {
        ...params,
        seed: params.seed > 0 ? params.seed : _gameSeed,
      };
    }

    /** Parametry kreatora do odtworzenia mapy przy wczytywaniu (nowe i starsze sejwy). */
    function newGameParamsForLoad(saved: SaveGame): NewGameParams | null {
      const stored = saved.meta?.newGameParams;
      if (stored && typeof stored === 'object' && typeof (stored as NewGameParams).civId === 'string') {
        const p = stored as NewGameParams;
        return { ...p, seed: saved.seed ?? p.seed ?? _gameSeed };
      }
      if (typeof saved.seed !== 'number') return null;
      const meta = saved.meta as Record<string, unknown> | undefined;
      const typ = (meta?.loadTypSwiata as TypSwiata) || 'kontynenty';
      const typLabels: Record<TypSwiata, string> = {
        kontynenty: 'Kontynenty', pangea: 'Pangea', wyspy: 'Wyspy', ziemia: 'Ziemia',
      };
      const mapSize = (meta?.loadMapSize as string) || 'Standardowy';
      const civId = (meta?.loadCivId as string) || 'grecy';
      const era = saved.gracz?.era ?? 1;
      const epochId = era >= 3 ? 'zelazo' : era >= 2 ? 'braz' : 'kamien';
      const mq = mapQualityTierFromSave(saved);
      const bundle = bundledMapQualityPreset(mq);
      return {
        civId,
        civName: civId,
        epoch: epochId === 'zelazo' ? 'Epoka Żelaza' : epochId === 'braz' ? 'Epoka Brązu' : 'Epoka Kamienia',
        epochId,
        difficulty: 'Normalny',
        mapSize,
        rivals: String(defaultMiastaPanstwaFromMapLabel(mapSize)),
        speed: 'Standardowa',
        worldType: typLabels[typ],
        typSwiata: typ,
        seed: saved.seed,
        mapQualityLabel: qualityTierToLabel(mq),
        mapQuality: mq,
        renderQualityLabel: qualityTierToLabel(bundle.renderQuality as QualityTier),
        mapDetailQualityLabel: qualityTierToLabel(bundle.mapDetailQuality as QualityTier),
        renderQuality: bundle.renderQuality as QualityTier,
        mapDetailQuality: bundle.mapDetailQuality as QualityTier,
        civTypesCount: defaultCivTypesFromMapLabel(mapSize),
        cityStatesCount: defaultMiastaPanstwaFromMapLabel(mapSize),
        worldDensity: { ...DEFAULT_WORLD_DENSITY },
        worldDensityLabels: {
          resources: 'Średnia', rivers: 'Średnia', desert: 'Średnia', forest: 'Średnia', relief: 'Średnia',
        },
        landFractionPercent: (meta?.loadLandFraction as number) ?? 30,
      };
    }

    /** Regeneruje mapę + scenę 3D (bez resetu stanu gry — do wczytywania sejwu). */
    async function regenerateWorldForLoad(
      params: NewGameParams,
      seed: number,
      saveLabel?: string,
    ): Promise<boolean> {
      applyMenuParams({ ...params, seed });
      _gameSeed = seed;
      const rozmiar = rozmiarFromMenuLabel(_menuMapSize);
      const loading = showMapLoadingOverlay({
        seed,
        rozmiarLabel: _menuMapSize,
        typLabel: params.worldType || _menuTypSwiata,
        mode: 'load',
        saveLabel,
      });
      try {
        map = await generujSwiatAsync(seed, rozmiar, _menuTypSwiata, {
          worldDensity: _menuWorldDensity,
          mapSizeMenuLabel: _menuMapSize,
          landFraction: (params.landFractionPercent ?? 30) / 100,
          difficulty: _menuDifficulty,
          civTypesCount: _menuCivTypesCount,
          cityStatesCount: _menuCityStates,
        }, (faza, pct, phaseNum, phaseTotal) => {
          loading.setProgress(faza, pct, phaseNum, phaseTotal);
        });
        ensureDepositEraMeta(map.hexes);
        disposeOkolicaOverlay();
        try { disposeScene(); } catch { /* ignore */ }
        const newSceneResult = await buildScene(map, canvas, _currentRenderOptions, (pct) => {
          loading.setProgress('Przywracanie widoku mapy…', pct);
        });
        loading.hide();
        scene = newSceneResult.scene;
        camera = newSceneResult.camera;
        renderer = newSceneResult.renderer;
        center = newSceneResult.center;
        setFog = newSceneResult.setFog;
        hideDecorAtHex = newSceneResult.hideDecorAtHex;
        syncForestForUnits = newSceneResult.syncForestForUnits;
        setZoomLod = newSceneResult.setZoomLod;
        getZoomLodLevel = newSceneResult.getZoomLodLevel;
        terrainPickMeshes = newSceneResult.terrainPickMeshes;
        resolveTerrainPick = newSceneResult.resolveTerrainPick;
        disposeScene = newSceneResult.dispose;
        cultureRangeGroup = null;
        religionRangeGroup = null;
        territoryBorderGroup = null;
        try { camCtrl.dispose(); } catch { /* ignore */ }
        camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());
        unitRenderer = new UnitRenderer(scene, map);
        wireUnitRendererRingStance();
        cityRenderer = new CityRenderer(scene, map);
        siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
        wonderRenderer = new WonderRenderer(scene, map);
        rebuildAllKeys();
        refreshBuildApi();
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        loading.showError(msg || 'Błąd wczytywania zapisu', () => { loading.hide(); });
        return false;
      }
    }

    async function doStartGame(params: NewGameParams): Promise<void> {
      playtestWalkaActive = false;
      bitwaDuzaActive = false;
      playtestMiastoActive = false;
      _saveOrigin = 'normal';
      applyMenuParams(params);
      hideMainMenu();
      hideNewGameFlow();
      hideGamePauseMenu();

      // Reset gracza na nową grę (skarbiec/nauka/tech — era już z applyMenuParams)
      player.skarbiec = 0;
      player.nauka = 0;
      player.zbadane = grantTechEpokWczesniejszych(data.tech, params.epochId || 'kamien');
      player.badana = null;
      player.playerResearchTargetId = null;
      player.researchQueue = [];
      player.pieniadzMnoznik = 1;
      console.log('[NewGame] Tech wcześniejszych epok:', player.zbadane.size, '· epoka start=', params.epochId || 'kamien');

      // Regenerate map with size + typ + seed from menu params
      const rozmiar = rozmiarFromMenuLabel(_menuMapSize);
      const newSeed = params.seed > 0 ? params.seed : Math.floor(Math.random() * 1e9);
      _gameSeed = newSeed;
      // C1/C2: generacja mapy asynchronicznie w Web Workerze + panel postępu „Tworzenie świata".
      const loading = showMapLoadingOverlay({
        seed: newSeed,
        rozmiarLabel: _menuMapSize,
        typLabel: params.worldType || _menuTypSwiata,
      });
      let newMap;
      try {
        newMap = await generujSwiatAsync(newSeed, rozmiar, _menuTypSwiata, {
          worldDensity: _menuWorldDensity,
          mapSizeMenuLabel: _menuMapSize,
          landFraction: (params.landFractionPercent ?? 30) / 100,
          difficulty: _menuDifficulty,
          civTypesCount: _menuCivTypesCount,
          cityStatesCount: _menuCityStates,
        }, (faza, pct, phaseNum, phaseTotal) => {
          loading.setProgress(faza, pct, phaseNum, phaseTotal);
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        loading.showError(msg || 'Błąd generacji mapy', () => { loading.hide(); void doStartGame(params); });
        return;
      }
      map = newMap;
      ensureDepositEraMeta(map.hexes);

      // Rebuild scene with new map (dispose old scene first)
      disposeOkolicaOverlay();
      try { disposeScene(); } catch (_) { /* ignore if dispose fails */ }
      // C3: buildScene budowany porcjami (chunki) — overlay zostaje na ekranie i
      // pokazuje „Budowanie sceny… N%"; ukryj DOPIERO po zbudowaniu sceny.
      const newSceneResult = await buildScene(map, canvas, _currentRenderOptions, (pct) => {
        loading.setProgress('Budowanie sceny…', pct);
      });
      loading.hide();
      scene = newSceneResult.scene;
      camera = newSceneResult.camera;
      renderer = newSceneResult.renderer;
      center = newSceneResult.center;
      setFog = newSceneResult.setFog;
      hideDecorAtHex = newSceneResult.hideDecorAtHex;
      syncForestForUnits = newSceneResult.syncForestForUnits;
      setZoomLod = newSceneResult.setZoomLod;
      getZoomLodLevel = newSceneResult.getZoomLodLevel;
      terrainPickMeshes = newSceneResult.terrainPickMeshes;
      resolveTerrainPick = newSceneResult.resolveTerrainPick;
      disposeScene = newSceneResult.dispose;
      cultureRangeGroup = null;
      religionRangeGroup = null;
      territoryBorderGroup = null;

      // Rebuild camera controller with new scene center
      try { camCtrl.dispose(); } catch (_) { /* ignore */ }
      camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());

      // Rebuild unit and city renderers
      unitRenderer = new UnitRenderer(scene, map);
      wireUnitRendererRingStance();
      cityRenderer = new CityRenderer(scene, map);
      hideSiegeMapPanel();
      hideCityAttackChoice();
      clearSiegeHtmlLabels();
      siegeTurnByCity.clear();
      siegeBesiegerByCity.clear();
      siegeAiStateByKey.clear();
      militiaDefOverrides.clear();
      siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
      wonderRenderer = new WonderRenderer(scene, map);

      // Reset stanu przed klastrem
      cities.length = 0;
      tradeRoutes.length = 0;
      tradeRouteCountByCity.clear();
      tradeRouteResourceGrants.length = 0;
      clearTradeRoutesOverlay();
      explored.clear();
      rebuildAllKeys();
      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      activeDeals = [];
      aiSkarbiecByOwner.clear();
      aiPracaPoolByOwner.clear();
      aiNaukaPoolByOwner.clear();
      aiBadanaByOwner.clear();
      basketTransferCtx = createEmptyBasketTransferContext(data.tech);
      _dipUnitSeq = 0;
      pendingDiplomacyInbox.length = 0;
      aiOneShotGiftLastTurn.clear();
      aiTradeAgreementLastProposalTurn.clear();
      aiAiTradeAgreementLastTurn.clear();
      aiResourceTradeLastProposalTurn.clear();
      units.length = 0;
      plannedMarches.clear();
      marchExecQueue.length = 0;
      pendingMarchHint = null;
      playerEverOwnedCity = false;
      turn = 1;
      playerPracaPool = 0;
      _lastPraca = 0;
      _lastPracaRate = 0;
      _lastPieniadzRate = 0;
      _lastNaukaRate = 0;
      _lastKulturaRate = 0;
      _lastLudnoscRate = 0;
      _lastPlayerCityEcon = [];
      cityBuilt.clear();
      cityProd.clear();
      completedWorldWonders = [];
      placedWorldWonders = [];
      cityOrderState.clear();
      orderMultMap.clear();
      orderValueMap.clear();
      growthMultMap.clear();
      lastCityKulturaTick.clear();
      aiWonderPracaTickByCity.clear();
      aiResearchDone.clear();
      ownerEraByOwner.clear();
      ownerStartEraByOwner.clear();
      eliminatedOwners.clear();
      capitalCityIdByOwner.clear();
      zdobyczePowerByOwner.clear();
      battlePowerPtsByOwner.clear();
      lootedVillageHexKeys.clear();
      barbCamps = [];
      // Audyt #43: cityRelig/autoManageCities przezywaly restart (id 'cityN'
      // koliduja miedzy rozgrywkami) -- nowe miasto dziedziczylo zombie stan
      // religii/auto-zarzadzania z poprzedniej gry bez przeladowania strony.
      cityRelig.clear();
      autoManageCities.clear();
      gameOver = false;
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;
      buildModeOpen = false;
      activeImprovementKey = null;
      removeBuildGhosts();
      placedImprovements.clear();
      clearAllHexClearing();
      pendingImprovementsTurn = new PendingImprovementsTurn();
      for (const mesh of improvementMeshes.values()) scene.remove(mesh);
      improvementMeshes.clear();

      applyClusterStartPlan(_menuCivId, newSeed, _menuCityStates);
      initAllAiOwnersForNewGame(params.epochId || 'kamien');
      reconcileAllOwnerErasFromResearch();

      if (params.startPreview) {
        console.log(
          '[NewGame] StartPreview:',
          params.startPreview.playerCapitalName,
          '· rywale=',
          params.startPreview.sameTypeRivalCount,
          '· typy=',
          params.startPreview.activeTypesOnMap,
        );
      }
      seedStartingFog();
      refreshBuildApi();

      // Rebuild resource overlays for new map
      overlayDepositEra = player.era;
      rebuildResourceOverlays();
      syncLivestockAndPlacedMeshes();

      // Sync renderers with new state
      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      initDiplomaticContactSnapshot();
      updateHud();

      syncBasketResearchFromEngine();
      console.log('[NewGame] Mapa: ' + map.szerokoscQ + 'x' + map.wysokoscR + ' seed=' + newSeed + ' typ=' + _menuTypSwiata + ' rywale=' + _menuCityStates + ' typy=' + _menuCivTypesCount);
      beginOnboardingFoundCity();
      startGameMusic('mapa');
      startRenderLoop();
    }

    async function doStartPlaytestWalkaMapy(): Promise<void> {
      _saveOrigin = 'playtest';
      playtestWalkaActive = true;
      // DUŻE bitwy mają pierwszeństwo (ich nazwy plików łapałaby regex oblężenia 3v3).
      const bitwaDuza = isPlaytestBitwaDuzaMode();
      const oblezDuze = !bitwaDuza && isPlaytestOblezenieDuzeMode();
      bitwaDuzaActive = bitwaDuza || oblezDuze;
      if (bitwaDuza || oblezDuze) {
        // DUŻE bitwy = arena taktyczna (armia vs armia), NIE rozstawianie na mapie świata.
        playtestWalkaActive = false;
        launchBigPresetBattle(oblezDuze ? 'oblezenie_duze' : 'bitwa_duza_pole', oblezDuze);
        return;
      }
      const odskokObl = !bitwaDuzaActive && isPlaytestOdskokOblezenieMode();
      const odskok3v3 = !bitwaDuzaActive && !odskokObl && isPlaytestOdskokMode();
      const playtestSeed = (odskok3v3 || odskokObl) ? PLAYTEST_ODSKOK_SEED : PLAYTEST_WALKA_SEED;
      const mqTier = mapQualityTierFromQuery('high');
      const mqBundle = bundledMapQualityPreset(mqTier);
      const params: NewGameParams = {
        civId: 'rzymianie',
        civName: 'Rzymianie',
        epoch: 'Epoka Brzu',
        epochId: 'braz',
        difficulty: 'Normalny',
        mapSize: 'Maly',
        rivals: '1',
        speed: 'Normalna',
        worldType: 'Kontynenty',
        typSwiata: 'kontynenty',
        seed: playtestSeed,
        mapQualityLabel: qualityTierToLabel(mqTier),
        mapQuality: mqTier,
        renderQualityLabel: qualityTierToLabel(mqBundle.renderQuality),
        mapDetailQualityLabel: qualityTierToLabel(mqBundle.mapDetailQuality),
        renderQuality: mqBundle.renderQuality,
        mapDetailQuality: mqBundle.mapDetailQuality,
        civTypesCount: 3,
        cityStatesCount: 1,
        worldDensity: { ...DEFAULT_WORLD_DENSITY },
        worldDensityLabels: {
          resources: 'Normalnie',
          rivers: 'Normalnie',
          desert: 'Normalnie',
          forest: 'Normalnie',
          relief: 'Normalnie',
        },
        landFractionPercent: 50,
      };
      applyMenuParams(params);
      hideMainMenu();
      hideNewGameFlow();

      player.skarbiec = 500;
      player.nauka = 0;
      player.zbadane = new Set<string>();
      player.badana = null;
      player.playerResearchTargetId = null;
      player.researchQueue = [];
      player.pieniadzMnoznik = 1;

      const rozmiar = rozmiarFromMenuLabel('Maly');
      // C1/C2: generacja mapy asynchronicznie + panel „Tworzenie świata" (overlay RAZ przed pętlą retry).
      const loading = showMapLoadingOverlay({ seed: playtestSeed, rozmiarLabel: 'Maly', typLabel: 'Kontynenty' });
      let newMap = await generujSwiatAsync(playtestSeed, rozmiar, 'kontynenty', undefined, (faza, pct, phaseNum, phaseTotal) => {
        loading.setProgress(faza, pct, phaseNum, phaseTotal);
      });
      let preset = bitwaDuza
        ? buildBitwaDuzaPreset(newMap, data)
        : oblezDuze
          ? buildOblezenieDuzePreset(newMap, data)
          : odskokObl
            ? buildPlaytestOdskokOblezenie(newMap, data)
            : odskok3v3
              ? buildPlaytestOdskok3v3(newMap, data)
              : buildPlaytestWalkaMapy(newMap, data, resolvePlaytestWalkaVariant());
      // Duże bitwy i odskok 3v3 potrzebują konkretnego układu — jeśli brak, próbuj kolejnych seedów.
      if ((odskok3v3 || odskokObl || bitwaDuza || oblezDuze) && !preset) {
        for (let i = 1; i <= 64 && !preset; i++) {
          const trySeed = playtestSeed + i;
          loading.setProgress('Szukanie miejsca na mapie (próba ' + i + ')', Math.min(95, i * 1.5), 6, 7);
          newMap = await generujSwiatAsync(trySeed, rozmiar, 'kontynenty', undefined, (faza, pct, phaseNum, phaseTotal) => {
            loading.setProgress(faza, pct, phaseNum, phaseTotal);
          });
          preset = bitwaDuza
            ? buildBitwaDuzaPreset(newMap, data)
            : oblezDuze
              ? buildOblezenieDuzePreset(newMap, data)
              : odskokObl
                ? buildPlaytestOdskokOblezenie(newMap, data)
                : buildPlaytestOdskok3v3(newMap, data);
          if (preset) {
            console.log('[PlaytestWalka] seed fallback ' + trySeed);
          }
        }
      }
      map = newMap;
      ensureDepositEraMeta(map.hexes);
      rebuildAllKeys();

      disposeOkolicaOverlay();
      try { disposeScene(); } catch (_) { /* ignore */ }
      // C3: buildScene budowany porcjami (chunki) — overlay „Budowanie sceny… N%"
      // zostaje widoczny przez cały build; ukryj DOPIERO po jego zakończeniu.
      const newSceneResult = await buildScene(map, canvas, _currentRenderOptions, (pct) => {
        loading.setProgress('Budowanie sceny…', pct);
      });
      loading.hide();
      scene = newSceneResult.scene;
      camera = newSceneResult.camera;
      renderer = newSceneResult.renderer;
      center = newSceneResult.center;
      setFog = newSceneResult.setFog;
      hideDecorAtHex = newSceneResult.hideDecorAtHex;
      syncForestForUnits = newSceneResult.syncForestForUnits;
      setZoomLod = newSceneResult.setZoomLod;
      getZoomLodLevel = newSceneResult.getZoomLodLevel;
      terrainPickMeshes = newSceneResult.terrainPickMeshes;
      resolveTerrainPick = newSceneResult.resolveTerrainPick;
      disposeScene = newSceneResult.dispose;
      cultureRangeGroup = null;
      religionRangeGroup = null;
      territoryBorderGroup = null;

      try { camCtrl.dispose(); } catch (_) { /* ignore */ }
      camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());

      unitRenderer = new UnitRenderer(scene, map);
      wireUnitRendererRingStance();
      cityRenderer = new CityRenderer(scene, map);
      siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
      wonderRenderer = new WonderRenderer(scene, map);
      siegeTurnByCity.clear();
      siegeBesiegerByCity.clear();
      siegeAiStateByKey.clear();

      if (!preset) {
        showHintMessage('Playtest walki: brak miejsca na mapie — sprobuj inny seed', 5000);
        showMainMenu();
        return;
      }

      units.length = 0;
      for (const u of preset.units) units.push(u);

      aiOwnerCivMap.clear();
      aiOwnerCivMap.set(preset.aiOwnerId, 'grecy');
      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      setDiploRelation(0, preset.aiOwnerId, { zaufanie: 0, respekt: 30, status: 'wojna' });
      playerEverOwnedCity = false;

      cities.length = 0;
      tradeRoutes.length = 0;
      tradeRouteCountByCity.clear();
      tradeRouteResourceGrants.length = 0;
      clearTradeRoutesOverlay();
      for (const c of preset.cities) {
        ensureCitySaveDefaults(c);
        cities.push(c);
      }

      explored.clear();
      for (const k of preset.explored) explored.add(k);

      turn = 1;
      cityBuilt.clear();
      cityProd.clear();
      completedWorldWonders = [];
      placedWorldWonders = [];
      cityOrderState.clear();
      orderMultMap.clear();
      orderValueMap.clear();
      growthMultMap.clear();
      aiResearchDone.clear();
      eliminatedOwners.clear();
      capitalCityIdByOwner.clear();
      zdobyczePowerByOwner.clear();
      barbCamps = [];
      gameOver = false;
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;
      buildModeOpen = false;
      activeImprovementKey = null;
      placedImprovements.clear();
      clearAllHexClearing();
      pendingImprovementsTurn = new PendingImprovementsTurn();
      for (const mesh of improvementMeshes.values()) scene.remove(mesh);
      improvementMeshes.clear();
      refreshBuildApi();
      overlayDepositEra = player.era;
      rebuildResourceOverlays();
      syncLivestockAndPlacedMeshes();
      reapplyCityHexDecorHides();
      syncWonderRender();

      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      initDiplomaticContactSnapshot();
      updateHud();
      refreshD1bHud();

      const playerCity = preset.playerCityId
        ? cities.find(c => c.id === preset.playerCityId)
        : undefined;
      if (playerCity) {
        const autoSiege = detectAutoSiegeOnCity(playerCity, units);
        if (autoSiege) startMapSiege(autoSiege);
        const romaPos = axialToWorld(playerCity.q, playerCity.r, HEX_R);
        const playerPos = axialToWorld(preset.focusQ, preset.focusR, HEX_R);
        camCtrl.focusAt(
          (romaPos.x + playerPos.x) * 0.5,
          (romaPos.z + playerPos.z) * 0.5,
          26,
        );
      } else {
        const focusPos = axialToWorld(preset.focusQ, preset.focusR, HEX_R);
        const enemyCity = cities.find(c => c.id === preset.enemyCityId);
        if (enemyCity) {
          const cityPos = axialToWorld(enemyCity.q, enemyCity.r, HEX_R);
          camCtrl.focusAt(
            (focusPos.x + cityPos.x) * 0.5,
            (focusPos.z + cityPos.z) * 0.5,
            24,
          );
        } else {
          camCtrl.focusAt(focusPos.x, focusPos.z, 22);
        }
      }

      const enemyCity = preset.enemyCityId
        ? cities.find(c => c.id === preset.enemyCityId)
        : undefined;
      const walkaHint = resolvePlaytestWalkaVariant() === 'oblez'
        ? PLAYTEST_OBLEZ_HINT
        : PLAYTEST_WALKA_HINT;
      const primaryHint = bitwaDuza
        ? PLAYTEST_BITWA_DUZA_HINT
        : oblezDuze
          ? PLAYTEST_OBLEZENIE_DUZE_HINT
          : odskokObl
            ? PLAYTEST_ODSKOK_OBLEZENIE_HINT
            : odskok3v3
              ? PLAYTEST_ODSKOK_HINT
              : walkaHint;
      showHintMessage(primaryHint, 16000);
      if (!odskok3v3 && !odskokObl && !bitwaDuza && enemyCity) {
        showHintMessage(
          'Ateny (WRÓG, mur) — po walce / ruchu: klik miasto → Oblężaj (obóz 3D) lub Szturm.',
          12000,
        );
      }
      const trybLog = bitwaDuza ? 'bitwa-duza'
        : oblezDuze ? 'oblezenie-duze'
        : odskokObl ? 'odskok-obl'
        : odskok3v3 ? 'odskok3v3'
        : 'walka';
      console.log(
        '[PlaytestWalka] seed=' + playtestSeed +
        ' tryb=' + trybLog +
        ' jednostek=' + units.length +
        ' miast=' + cities.length +
        ' wrogie=' + (enemyCity?.name ?? '?') + ' ownerId=' + (enemyCity?.ownerId ?? '?'),
      );
      startGameMusic('mapa');
      startRenderLoop();
    }

    async function doStartPlaytestMiastoEkonomia(): Promise<void> {
      _saveOrigin = 'playtest';
      playtestWalkaActive = false;
      bitwaDuzaActive = false;
      playtestMiastoActive = true;
      const mqTier = mapQualityTierFromQuery('high');
      const mqBundle = bundledMapQualityPreset(mqTier);
      applyMenuParams({
        civId: 'rzymianie',
        civName: 'Rzymianie',
        epoch: 'Epoka Brzu',
        epochId: 'braz',
        difficulty: 'Normalny',
        mapSize: 'Maly',
        rivals: '0',
        speed: 'Normalna',
        worldType: 'Kontynenty',
        typSwiata: 'kontynenty',
        seed: PLAYTEST_MIASTO_SEED,
        mapQualityLabel: qualityTierToLabel(mqTier),
        mapQuality: mqTier,
        renderQualityLabel: qualityTierToLabel(mqBundle.renderQuality),
        mapDetailQualityLabel: qualityTierToLabel(mqBundle.mapDetailQuality),
        renderQuality: mqBundle.renderQuality,
        mapDetailQuality: mqBundle.mapDetailQuality,
        civTypesCount: 3,
        cityStatesCount: 0,
        worldDensity: { ...DEFAULT_WORLD_DENSITY },
        worldDensityLabels: {
          resources: 'Normalnie',
          rivers: 'Normalnie',
          desert: 'Normalnie',
          forest: 'Normalnie',
          relief: 'Normalnie',
        },
      } as NewGameParams);
      hideMainMenu();
      hideNewGameFlow();

      player.skarbiec = 5000;
      player.nauka = 200;
      player.pieniadzMnoznik = 1;
      player.era = 2;

      const rozmiar = rozmiarFromMenuLabel('Maly');
      // C1/C2: generacja mapy asynchronicznie + panel „Tworzenie świata".
      const loading = showMapLoadingOverlay({ seed: PLAYTEST_MIASTO_SEED, rozmiarLabel: 'Maly', typLabel: 'Kontynenty' });
      const newMap = await generujSwiatAsync(PLAYTEST_MIASTO_SEED, rozmiar, 'kontynenty', undefined, (faza, pct, phaseNum, phaseTotal) => {
        loading.setProgress(faza, pct, phaseNum, phaseTotal);
      });
      map = newMap;
      ensureDepositEraMeta(map.hexes);
      rebuildAllKeys();

      disposeOkolicaOverlay();
      try { disposeScene(); } catch (_) { /* ignore */ }
      // C3: buildScene budowany porcjami (chunki) — overlay „Budowanie sceny… N%"
      // zostaje widoczny przez cały build; ukryj DOPIERO po jego zakończeniu.
      const newSceneResult = await buildScene(map, canvas, _currentRenderOptions, (pct) => {
        loading.setProgress('Budowanie sceny…', pct);
      });
      loading.hide();
      scene = newSceneResult.scene;
      camera = newSceneResult.camera;
      renderer = newSceneResult.renderer;
      center = newSceneResult.center;
      setFog = newSceneResult.setFog;
      hideDecorAtHex = newSceneResult.hideDecorAtHex;
      syncForestForUnits = newSceneResult.syncForestForUnits;
      setZoomLod = newSceneResult.setZoomLod;
      getZoomLodLevel = newSceneResult.getZoomLodLevel;
      terrainPickMeshes = newSceneResult.terrainPickMeshes;
      resolveTerrainPick = newSceneResult.resolveTerrainPick;
      disposeScene = newSceneResult.dispose;
      cultureRangeGroup = null;
      religionRangeGroup = null;
      territoryBorderGroup = null;

      try { camCtrl.dispose(); } catch (_) { /* ignore */ }
      camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());

      unitRenderer = new UnitRenderer(scene, map);
      wireUnitRendererRingStance();
      cityRenderer = new CityRenderer(scene, map);
      siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
      wonderRenderer = new WonderRenderer(scene, map);
      siegeTurnByCity.clear();
      siegeBesiegerByCity.clear();
      siegeAiStateByKey.clear();

      const preset = buildPlaytestMiastoEkonomia(map, data);
      if (!preset) {
        showHintMessage('Playtest miasta: brak miejsca na mapie — sprobuj inny seed', 5000);
        showMainMenu();
        playtestMiastoActive = false;
        return;
      }

      units.length = 0;
      aiOwnerCivMap.clear();
      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      playerEverOwnedCity = true;

      cities.length = 0;
      tradeRoutes.length = 0;
      tradeRouteCountByCity.clear();
      tradeRouteResourceGrants.length = 0;
      clearTradeRoutesOverlay();
      for (const c of preset.cities) {
        ensureCitySaveDefaults(c);
        cities.push(c);
      }

      explored.clear();
      for (const k of preset.explored) explored.add(k);

      player.zbadane = new Set(preset.grantedTechIds);
      player.badana = null;
      player.playerResearchTargetId = null;
      player.researchQueue = [];

      turn = 1;
      cityBuilt.clear();
      cityProd.clear();
      completedWorldWonders = [];
      placedWorldWonders = [];
      cityOrderState.clear();
      orderMultMap.clear();
      orderValueMap.clear();
      growthMultMap.clear();
      autoManageCities.clear();
      aiResearchDone.clear();
      eliminatedOwners.clear();
      capitalCityIdByOwner.clear();
      zdobyczePowerByOwner.clear();
      barbCamps = [];
      gameOver = false;
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;
      buildModeOpen = false;
      activeImprovementKey = null;
      placedImprovements.clear();
      clearAllHexClearing();
      pendingImprovementsTurn = new PendingImprovementsTurn();
      for (const mesh of improvementMeshes.values()) scene.remove(mesh);
      improvementMeshes.clear();

      cityBuilt.set(preset.playerCityId, ['koszary']);
      cityProd.set(preset.playerCityId, { ...preset.initialProduction, kolejka: [...preset.initialProduction.kolejka] });

      const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
      clearLastEmpireFoodTicks();
      empireFoodStates.clear();
      empireFoodStates.set(0, freshEmpireFoodState(efParams.procentRozwojDefault));
      bindEmpireFoodRuntime(empireFoodStates);

      foundCityMode = false;
      refreshBuildApi();
      overlayDepositEra = player.era;
      rebuildResourceOverlays();
      syncLivestockAndPlacedMeshes();
      reapplyCityHexDecorHides();
      syncWonderRender();

      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      initDiplomaticContactSnapshot();
      updateHud();
      refreshD1bHud();

      const playerCity = cities.find(c => c.id === preset.playerCityId);
      if (playerCity) {
        const pos = axialToWorld(playerCity.q, playerCity.r, HEX_R);
        camCtrl.focusAt(pos.x, pos.z, 22);
        openCityPanelForPlayer(playerCity);
      }

      showHintMessage(PLAYTEST_MIASTO_HINT, 16000);
      showHintMessage(
        'Testpolis · pop 9 · skarbiec 5000 · Koszary OK · kolejka: Stolarnia. Panel otwarty.',
        10000,
      );
      console.log(
        '[PlaytestMiasto] seed=' + PLAYTEST_MIASTO_SEED +
        ' miasto=' + (playerCity?.name ?? '?') +
        ' pop=' + (playerCity?.population ?? 0),
      );
      startGameMusic('mapa');
      startRenderLoop();
    }

    async function doStartPlaytestMapaSwiata(): Promise<void> {
      _saveOrigin = 'playtest';
      playtestWalkaActive = false;
      bitwaDuzaActive = false;
      playtestMiastoActive = false;
      const mqTier = mapQualityTierFromQuery('high');
      const mqBundle = bundledMapQualityPreset(mqTier);
      const ptMapDensity = resolvePlaytestMapaWorldDensity();
      applyMenuParams({
        civId: 'rzymianie',
        civName: 'Rzymianie',
        epoch: 'Epoka Brzu',
        epochId: 'braz',
        difficulty: 'Normalny',
        mapSize: 'Maly',
        rivals: '0',
        speed: 'Normalna',
        worldType: 'Kontynenty',
        typSwiata: 'kontynenty',
        seed: PLAYTEST_MAPA_SEED,
        mapQualityLabel: qualityTierToLabel(mqTier),
        mapQuality: mqTier,
        renderQualityLabel: qualityTierToLabel(mqBundle.renderQuality),
        mapDetailQualityLabel: qualityTierToLabel(mqBundle.mapDetailQuality),
        renderQuality: mqBundle.renderQuality,
        mapDetailQuality: mqBundle.mapDetailQuality,
        civTypesCount: 3,
        cityStatesCount: 0,
        worldDensity: { ...ptMapDensity.preset },
        worldDensityLabels: { ...ptMapDensity.labels },
      } as NewGameParams);
      hideMainMenu();
      hideNewGameFlow();

      player.skarbiec = 5000;
      player.nauka = 200;
      player.pieniadzMnoznik = 1;
      player.era = 2;

      const rozmiar = rozmiarFromMenuLabel('Maly');
      // C1/C2: generacja mapy asynchronicznie + panel „Tworzenie świata".
      const loading = showMapLoadingOverlay({ seed: PLAYTEST_MAPA_SEED, rozmiarLabel: 'Maly', typLabel: 'Kontynenty' });
      const newMap = await generujSwiatAsync(PLAYTEST_MAPA_SEED, rozmiar, 'kontynenty', {
        worldDensity: ptMapDensity.preset,
        mapSizeMenuLabel: 'Maly',
        difficulty: _menuDifficulty,
        civTypesCount: _menuCivTypesCount,
        cityStatesCount: _menuCityStates,
      }, (faza, pct, phaseNum, phaseTotal) => {
        loading.setProgress(faza, pct, phaseNum, phaseTotal);
      });
      map = newMap;
      ensureDepositEraMeta(map.hexes);
      rebuildAllKeys();

      disposeOkolicaOverlay();
      try { disposeScene(); } catch (_) { /* ignore */ }
      // C3: buildScene budowany porcjami (chunki) — overlay „Budowanie sceny… N%"
      // zostaje widoczny przez cały build; ukryj DOPIERO po jego zakończeniu.
      const newSceneResult = await buildScene(map, canvas, _currentRenderOptions, (pct) => {
        loading.setProgress('Budowanie sceny…', pct);
      });
      loading.hide();
      scene = newSceneResult.scene;
      camera = newSceneResult.camera;
      renderer = newSceneResult.renderer;
      center = newSceneResult.center;
      setFog = newSceneResult.setFog;
      hideDecorAtHex = newSceneResult.hideDecorAtHex;
      syncForestForUnits = newSceneResult.syncForestForUnits;
      setZoomLod = newSceneResult.setZoomLod;
      getZoomLodLevel = newSceneResult.getZoomLodLevel;
      terrainPickMeshes = newSceneResult.terrainPickMeshes;
      resolveTerrainPick = newSceneResult.resolveTerrainPick;
      disposeScene = newSceneResult.dispose;
      cultureRangeGroup = null;
      religionRangeGroup = null;
      territoryBorderGroup = null;

      try { camCtrl.dispose(); } catch (_) { /* ignore */ }
      camCtrl = new CameraController(camera, canvas, center, cameraControllerOpts());

      unitRenderer = new UnitRenderer(scene, map);
      wireUnitRendererRingStance();
      cityRenderer = new CityRenderer(scene, map);
      siegeMarkerRenderer = new SiegeMarkerRenderer(scene, map);
      wonderRenderer = new WonderRenderer(scene, map);
      siegeTurnByCity.clear();
      siegeBesiegerByCity.clear();
      siegeAiStateByKey.clear();

      const preset = buildPlaytestMapaSwiata(map, data);
      if (!preset) {
        showHintMessage('Playtest mapy: brak miejsca — sprobuj inny seed', 5000);
        showMainMenu();
        return;
      }

      units.length = 0;
      for (const u of preset.units) units.push(u);

      aiOwnerCivMap.clear();
      aiOwnerCivMap.set(preset.aiOwnerId, 'grecy');
      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      diplomaticContactEstablished.add(preset.aiOwnerId);
      diplomaticallyDiscoveredOwners.add(preset.aiOwnerId);
      setDiploRelation(0, preset.aiOwnerId, { zaufanie: 0, respekt: 30, status: 'wojna' });

      playerEverOwnedCity = true;

      cities.length = 0;
      tradeRoutes.length = 0;
      tradeRouteCountByCity.clear();
      tradeRouteResourceGrants.length = 0;
      clearTradeRoutesOverlay();
      for (const c of preset.cities) {
        ensureCitySaveDefaults(c);
        cities.push(c);
      }
      reapplyCityHexDecorHides();
      syncWonderRender();

      explored.clear();
      for (const k of preset.explored) explored.add(k);

      player.zbadane = new Set(preset.grantedTechIds);
      player.badana = 'Metalurgia Brązu';
      player.playerResearchTargetId = null;
      player.researchQueue = [];

      turn = 1;
      cityBuilt.clear();
      cityProd.clear();
      completedWorldWonders = [];
      placedWorldWonders = [];
      cityOrderState.clear();
      orderMultMap.clear();
      orderValueMap.clear();
      growthMultMap.clear();
      autoManageCities.clear();
      aiResearchDone.clear();
      eliminatedOwners.clear();
      capitalCityIdByOwner.clear();
      zdobyczePowerByOwner.clear();
      barbCamps = [];
      gameOver = false;
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;
      buildModeOpen = false;
      activeImprovementKey = null;
      placedImprovements.clear();
      clearAllHexClearing();
      pendingImprovementsTurn = new PendingImprovementsTurn();
      for (const mesh of improvementMeshes.values()) scene.remove(mesh);
      improvementMeshes.clear();

      cityBuilt.set(preset.playerCityId, ['koszary', 'spichlerz']);
      cityProd.set(preset.playerCityId, {
        ...preset.initialProduction,
        kolejka: [...preset.initialProduction.kolejka],
      });

      const efParams = buildEmpireFoodParams(data.econParams, _menuDifficulty);
      clearLastEmpireFoodTicks();
      empireFoodStates.clear();
      empireFoodStates.set(0, freshEmpireFoodState(efParams.procentRozwojDefault));
      bindEmpireFoodRuntime(empireFoodStates);

      playerPracaPool = preset.pracaStart;
      _lastPraca = playerPracaPool;
      _lastPracaRate = preset.pracaRateStart;
      _lastKultura = preset.cities[0]?.kulturaSkumulowana ?? 120;
      _lastKulturaRate = 2;
      _lastNaukaRate = 9;
      _lastLudnoscRate = 1;
      _lastBogactwoRate = 4;
      _lastWealthLevel = preset.cities[0]?.wealthState?.pula ?? 5;
      _lastPieniadzRate = 33;

      foundCityMode = false;
      refreshBuildApi();
      overlayDepositEra = player.era;
      rebuildResourceOverlays();
      syncLivestockAndPlacedMeshes();

      syncUnitsRender();
      cityRenderer.sync(cities, _cityRenderOpts());
      refreshFog();
      initDiplomaticContactSnapshot();
      updateHud();
      refreshD1bHud();

      const playerCity = cities.find(c => c.id === preset.playerCityId);
      const playerUnit = units.find(u => u.ownerId === 0);
      if (playerUnit) {
        const pos = axialToWorld(playerUnit.q, playerUnit.r, HEX_R);
        camCtrl.focusAt(pos.x, pos.z, 24);
      } else if (playerCity) {
        const pos = axialToWorld(playerCity.q, playerCity.r, HEX_R);
        camCtrl.focusAt(pos.x, pos.z, 28);
      }

      showHintMessage(PLAYTEST_MAPA_HINT, 18000);
      console.log(
        '[PlaytestMapa] seed=' + PLAYTEST_MAPA_SEED +
        ' miasto=' + (playerCity?.name ?? '?') +
        ' wrog=' + preset.enemyCityId +
        ' jednostek=' + units.length +
        ' praca=' + _lastPraca,
      );
      startGameMusic('mapa');
      startRenderLoop();
    }

    async function loadGameFromSlot(slotId: string, fromInGamePause = false): Promise<void> {
      prepareSessionForLoad();
      hideSaveLoadDialog();
      diagInfo('load', `slot=${slotId} pause=${fromInGamePause}`);
      try {
        const saved = loadFromLocal(slotId);
        if (!saved) {
          diagWarn('load', `brak danych slot=${slotId}`);
          showHintMessage('Nie można wczytać tego zapisu.', 3000);
          if (!fromInGamePause) openStartupMainMenu();
          return;
        }

        const integrity = checkSaveIntegrity(saved);
        const fatal = integrity.filter(i => i.code === 'no_seed' || i.code === 'no_map_meta');
        if (fatal.length > 0) {
          diagWarn('load', fatal.map(f => f.message).join('; '));
          showHintMessage(
            `Ten zapis jest niekompletny (${fatal.map(f => f.message).join(', ')}). ` +
            'Usuń go z listy lub zagraj i zapisz ponownie po nowej grze.',
            6000,
          );
          if (!fromInGamePause) openStartupMainMenu();
          return;
        }

        hideGamePauseMenu();
        hideMainMenu();
        hideNewGameFlow();

        const loadParams = newGameParamsForLoad(saved);
        const loadSeed = saved.seed ?? loadParams?.seed ?? _gameSeed;

        const mustRebuildMap = loadNeedsMapRebuild(loadParams, loadSeed, fromInGamePause);

        if (!mustRebuildMap && loadParams) {
          applyMenuParams({ ...loadParams, seed: loadSeed });
        }

        if (mustRebuildMap && loadParams) {
          const saveLabel = (saved.meta?.label as string) || slotId;
          canvas.style.visibility = 'hidden';
          let ok = false;
          try {
            ok = await regenerateWorldForLoad(loadParams, loadSeed, saveLabel);
          } finally {
            canvas.style.visibility = '';
          }
          if (!ok) {
            diagError('load', 'regenerateWorldForLoad failed');
            if (!fromInGamePause) openStartupMainMenu();
            return;
          }
        }

        restoreGameFromSave(saved);
        const loadIssues = validateLoadedSave(saved);
        if (loadIssues.length > 0) {
          const msg = loadIssues.join('; ');
          diagWarn('load', `walidacja: ${msg}`);
          showHintMessage(
            `Uwaga — zapis może być niespójny: ${msg}. F10 = raport diagnostyczny.`,
            7000,
          );
        }
        for (const c of cities) {
          if (!c.centerWorkedTile) {
            const hex = map.hexes[`${c.q},${c.r}`];
            if (hex && (hex.nakladka !== Nakladka.Brak || hex.ulepszenie !== Ulepszenie.Brak)) {
              applyCityFoundingToHex(c, map, c.q, c.r);
            }
          }
        }
        reapplyCityHexDecorHides();
        syncWonderRender();
        rebuildResourceOverlays();
        syncLivestockAndPlacedMeshes();
        syncUnitsRender();
        cityRenderer.sync(cities, _cityRenderOpts());
        tradeRouteCountByCity = computeTradeRouteCountByCity(tradeRoutes);
        try {
          recomputeTradeRouteResourceGrants();
        } catch (eTradeGrantLoad) {
          console.error('[Handel] Blad przeliczania grantow z trasy (load):', eTradeGrantLoad);
        }
        refreshTradeRoutesOverlay();
        refreshSiegeMarkers();
        refreshFog();
        initDiplomaticContactSnapshot();
        updateHud();
        startGameMusic('mapa');
        startRenderLoop();
        const label = (saved.meta?.label as string) || slotId;
        showHintMessage(
          `Wczytano: «${label}» (tura ${turn})<br><span style="opacity:.85;font-size:11px">${saveContextLine(saved)}</span>`,
          4500,
        );
        console.log('[Load] slot=' + slotId + ' tura=' + turn);
        diagInfo('load', `OK tura=${turn} miasta=${cities.length} seed=${_gameSeed}`);
        setLastPlayedSlotId(slotId);
      } catch (e) {
        diagError('load', e instanceof Error ? e.message : String(e));
        showHintMessage(
          fromInGamePause
            ? 'Błąd wczytywania zapisu.'
            : 'Błąd wczytywania zapisu. Wracam do menu.',
          3000,
        );
        if (!fromInGamePause) openStartupMainMenu();
      }
    }

    /** @deprecated alias — użyj loadGameFromSlot / openLoadGameDialog */
    function doLoadGame(fromInGamePause = false): void {
      openLoadGameDialog(fromInGamePause);
    }

    /** Wspólna ścieżka wczytywania zapisu — Ctrl+L i doLoadGame (Grupa F: migracja podziału). */
    function restoreGameFromSave(saved: SaveGame): void {
      applyRenderOptionsFromSave(saved);
      if (typeof saved.seed === 'number' && saved.seed > 0) {
        _gameSeed = saved.seed;
      }
      turn = saved.tura;
      units.length = 0;
      for (const u of saved.units) units.push(u);
      plannedMarches.clear();
      marchExecQueue.length = 0;
      pendingMarchHint = null;
      const loadedMarches = plannedMarchesFromSave(saved.autoMarch, saved.plannedMarches, units, 0);
      for (const [uid, dest] of loadedMarches) {
        plannedMarches.set(uid, dest);
        syncMarchAttackTarget(uid, dest);
      }
      // Handel E3: migracja -- brak pola w starym zapisie normalizuje sie do [].
      tradeRoutes = Array.isArray(saved.tradeRoutes) ? saved.tradeRoutes.slice() : [];
      cities.length = 0;
      for (const c of saved.cities) {
        ensureCitySaveDefaults(c);
        if (c.maMur === undefined) {
          const built = saved.cityBuilt?.[c.id];
          if (built?.includes('mury') || built?.includes('fort')) c.maMur = true;
        }
        cities.push(c);
      }
      playerEverOwnedCity = cities.some(c => c.ownerId === 0);
      explored.clear();
      for (const k of saved.explored ?? []) explored.add(k);
      revealAllLand = false;
      if (saved.gracz) {
        player.skarbiec = saved.gracz.skarbiec ?? 0;
        player.nauka    = saved.gracz.nauka ?? 0;
        player.era      = saved.gracz.era ?? 1;
        player.badana   = saved.gracz.badana ?? null;
        player.researchQueue = Array.isArray(saved.gracz.researchQueue) ? saved.gracz.researchQueue.slice() : [];
        player.zbadane  = new Set<string>(saved.gracz.zbadane ?? []);
        player.tempoGry = saved.gracz.tempoGry ?? 'standardowa';
        player.buildingCostPace = saved.gracz.buildingCostPace
          ?? (saved.meta?.newGameParams as NewGameParams | undefined)?.advanced?.buildingCostPace
          ?? 'niski';
        player.kosztJednostekPace = saved.gracz.kosztJednostekPace
          ?? (saved.meta?.newGameParams as NewGameParams | undefined)?.advanced?.kosztJednostekPace
          ?? 'niski';
        player.wzrostLudnosciPace = saved.gracz.wzrostLudnosciPace
          ?? (saved.meta?.newGameParams as NewGameParams | undefined)?.advanced?.wzrostLudnosciPace
          ?? 'wysoki';
      }
      overlayDepositEra = player.era;
      cityProd.clear();
      if (saved.cityProd) {
        for (const [cid, prod] of Object.entries(saved.cityProd)) cityProd.set(cid, prod as any);
      }
      cityBuilt.clear();
      if (saved.cityBuilt) {
        for (const [cid, blt] of Object.entries(saved.cityBuilt)) cityBuilt.set(cid, blt as string[]);
      }
      completedWorldWonders = Array.isArray(saved.meta?.completedWorldWonders)
        ? (saved.meta.completedWorldWonders as string[]).slice()
        : [];
      placedWorldWonders = Array.isArray(saved.meta?.placedWorldWonders)
        ? (saved.meta.placedWorldWonders as PlacedWonder[]).slice()
        : [];
      aiResearchDone.clear();
      if (saved.aiResearchDone) {
        for (const [oid, zbadane] of saved.aiResearchDone) aiResearchDone.set(oid, new Set(zbadane));
      }
      eliminatedOwners.clear();
      const savedEliminated = saved.meta?.eliminatedOwners as number[] | undefined;
      if (savedEliminated?.length) {
        for (const oid of savedEliminated) eliminatedOwners.add(oid);
      }
      // Audyt #15: profile miast-panstw i klastrow -- odtworz z sejwu.
      simplifiedDiplomacyOwners.clear();
      const savedSimplified = saved.meta?.simplifiedDiplomacyOwners as number[] | undefined;
      if (savedSimplified?.length) {
        for (const oid of savedSimplified) simplifiedDiplomacyOwners.add(oid);
      }
      foreignTypeOwners.clear();
      const savedForeignType = saved.meta?.foreignTypeOwners as number[] | undefined;
      if (savedForeignType?.length) {
        for (const oid of savedForeignType) foreignTypeOwners.add(oid);
      }
      typCityCopyOwners.clear();
      const savedTypCityCopy = saved.meta?.typCityCopyOwners as number[] | undefined;
      if (savedTypCityCopy?.length) {
        for (const oid of savedTypCityCopy) typCityCopyOwners.add(oid);
      } else {
        // Legacy zapis sprzed tej naprawy (brak pola w meta) -- c.startCityState
        // jest rownowazne typCityCopyOwners.has(ownerId) (patrz applyClusterStartPlan/
        // spawnPendingSameTypeRivals), rekonstruuj z flagi juz obecnej w miastach.
        for (const c of cities) {
          if (c.startCityState) typCityCopyOwners.add(c.ownerId);
        }
      }
      clusterCapitalOwnerIds.clear();
      const savedClusterCapitalIds = saved.meta?.clusterCapitalOwnerIds as number[] | undefined;
      if (savedClusterCapitalIds?.length) {
        for (const oid of savedClusterCapitalIds) clusterCapitalOwnerIds.add(oid);
      }
      clusterPlacement = (saved.meta?.clusterPlacement as ClusterPlacement | undefined) ?? null;
      battlePowerPtsByOwner.clear();
      const savedPts = saved.meta?.battlePowerPtsByOwner as Array<[number, number]> | undefined;
      if (savedPts?.length) {
        for (const [oid, n] of savedPts) battlePowerPtsByOwner.set(oid, n);
      }
      capitalCityIdByOwner.clear();
      const savedCapitalIds = saved.meta?.capitalCityIdByOwner as Array<[number, string]> | undefined;
      if (savedCapitalIds?.length) {
        for (const [oid, cid] of savedCapitalIds) capitalCityIdByOwner.set(oid, cid);
      }
      aiPracaPoolByOwner.clear();
      const savedAiPracaPool = saved.meta?.aiPracaPoolByOwner as Array<[number, number]> | undefined;
      if (savedAiPracaPool?.length) {
        for (const [oid, v] of savedAiPracaPool) aiPracaPoolByOwner.set(oid, v);
      }
      aiNaukaPoolByOwner.clear();
      const savedAiNaukaPool = saved.meta?.aiNaukaPoolByOwner as Array<[number, number]> | undefined;
      if (savedAiNaukaPool?.length) {
        for (const [oid, v] of savedAiNaukaPool) aiNaukaPoolByOwner.set(oid, v);
      }
      aiBadanaByOwner.clear();
      const savedAiBadana = saved.meta?.aiBadanaByOwner as Array<[number, string | null]> | undefined;
      if (savedAiBadana?.length) {
        for (const [oid, t] of savedAiBadana) aiBadanaByOwner.set(oid, t);
      }
      zdobyczePowerByOwner.clear();
      const savedZdobycze = saved.meta?.zdobyczePowerByOwner as Array<[number, number]> | undefined;
      if (savedZdobycze?.length) {
        for (const [oid, n] of savedZdobycze) zdobyczePowerByOwner.set(oid, n);
      }
      // Audyt #13: reaplikuj zlupienie wiosek na (ewentualnie świeżo zregenerowanej
      // z seeda) mapie -- generator/placeVillages zawsze stawia je jako istnieje=true.
      lootedVillageHexKeys.clear();
      const savedLootedVillages = saved.meta?.lootedVillageHexKeys as string[] | undefined;
      if (savedLootedVillages?.length) {
        for (const hk of savedLootedVillages) {
          lootedVillageHexKeys.add(hk);
          const villageHex = map.hexes[hk];
          if (villageHex?.wioska) {
            villageHex.wioska.istnieje = false;
            villageHex.wioska.ludnosc = 0;
          }
        }
      }
      // Audyt #42: barbCamps nie bylo ani zapisywane, ani resetowane przy load --
      // obozy starej gry zostawaly w pamieci i renderowaly sie na nowej mapie.
      // Odtworz z zapisu; brak pola (stary zapis) = reset do pustej tablicy.
      const savedBarbCamps = saved.meta?.barbCamps as BarbCamp[] | undefined;
      barbCamps = Array.isArray(savedBarbCamps) ? savedBarbCamps.slice() : [];
      // Audyt #43: cityRelig/autoManageCities nie byly ani zapisywane, ani
      // czyszczone przy load -- id 'cityN' koliduja miedzy rozgrywkami, wiec
      // bez tego nowe miasto dziedziczylo zombie stan z poprzedniej gry/sejwu.
      cityRelig.clear();
      const savedCityRelig = saved.meta?.cityRelig as Array<[string, ReligionState]> | undefined;
      if (savedCityRelig?.length) {
        for (const [cid, state] of savedCityRelig) cityRelig.set(cid, state);
      }
      autoManageCities.clear();
      const savedAutoManageCities = saved.meta?.autoManageCities as string[] | undefined;
      if (savedAutoManageCities?.length) {
        for (const cid of savedAutoManageCities) autoManageCities.add(cid);
      }
      ownerEraByOwner.clear();
      ownerStartEraByOwner.clear();
      restoreAiRosterFromSave(saved);
      const loadStartEra = (() => {
        const eid = (saved.meta?.newGameParams as NewGameParams | undefined)?.epochId;
        if (eid === 'zelazo') return 3;
        if (eid === 'braz') return 2;
        if (eid === 'kamien') return 1;
        return player.era;
      })();
      const savedOwnerEra = saved.meta?.ownerEraByOwner as Array<[number, number]> | undefined;
      if (savedOwnerEra?.length) {
        for (const [oid, e] of savedOwnerEra) ownerEraByOwner.set(oid, e);
      }
      const savedStartEra = saved.meta?.ownerStartEraByOwner as Array<[number, number]> | undefined;
      if (savedStartEra?.length) {
        for (const [oid, e] of savedStartEra) ownerStartEraByOwner.set(oid, e);
      }
      repairAiRosterFromMap(loadStartEra);
      syncOwnerDisplayNamesFromCities();
      for (const oid of allAiOwnerIdsOnMap()) {
        if (!ownerStartEraByOwner.has(oid)) ownerStartEraByOwner.set(oid, loadStartEra);
      }
      let loadEraChanged = false;
      for (const oid of allAiOwnerIdsOnMap()) {
        loadEraChanged = syncOwnerEraFromResearch(oid) || loadEraChanged;
      }
      diplomacyRelations.clear();
      diplomaticContactEstablished.clear();
      diplomaticallyDiscoveredOwners.clear();
      resetDiplomaticDiscoveryUiState();
      const savedContacts = saved.meta?.diplomaticContactEstablished as number[] | undefined;
      if (savedContacts?.length) {
        for (const oid of savedContacts) diplomaticContactEstablished.add(oid);
      }
      const savedDiscovered = saved.meta?.diplomaticallyDiscoveredOwners as number[] | undefined;
      if (savedDiscovered?.length) {
        for (const oid of savedDiscovered) diplomaticallyDiscoveredOwners.add(oid);
      } else {
        for (const oid of diplomaticContactEstablished) diplomaticallyDiscoveredOwners.add(oid);
      }
      const savedDiscoveryPopups = saved.meta?.diplomaticDiscoveryPopupShown as number[] | undefined;
      if (savedDiscoveryPopups?.length) {
        for (const oid of savedDiscoveryPopups) diplomaticDiscoveryPopupShown.add(oid);
      }
      if (saved.diploRelations) {
        for (const [key, rel] of Object.entries(saved.diploRelations)) diplomacyRelations.set(key, rel as any);
      }
      empireFoodStates.clear();
      const savedEf = saved.meta?.empireFoodStates as Array<[number, EmpireFoodState]> | undefined;
      if (savedEf?.length) {
        for (const [oid, st] of savedEf) empireFoodStates.set(oid, st);
      } else {
        initEmpireFoodStates();
      }
      bindEmpireFoodRuntime(empireFoodStates);
      syncCityFoodSplitsFromEmpire();
      const savedPracaPool = saved.meta?.playerPracaPool as number | undefined;
      playerPracaPool = typeof savedPracaPool === 'number' ? savedPracaPool : 0;
      const playerCityCountOnLoad = cities.filter(c => c.ownerId === 0).length;
      const maxReasonablePracaPool = Math.max(50, playerCityCountOnLoad * 100);
      if (playerPracaPool > maxReasonablePracaPool) {
        console.warn(
          `[Save] playerPracaPool=${playerPracaPool} zawyżone (stary bug map-total) — reset do 0`,
        );
        playerPracaPool = 0;
      }
      _lastPraca = playerPracaPool;
      _lastPieniadzRate = 0;
      _lastPracaRate = 0;
      _lastNaukaRate = 0;
      _lastKulturaRate = 0;
      _lastLudnoscRate = 0;
      siegeTurnByCity.clear();
      siegeBesiegerByCity.clear();
      siegeAiStateByKey.clear();
      siegeAiStateByKey.clear();
      pendingDiplomacyInbox.length = 0;
      const savedPending = saved.meta?.pendingDiplomacyInbox as typeof pendingDiplomacyInbox | undefined;
      if (savedPending?.length) pendingDiplomacyInbox.push(...savedPending);
      for (let pi = pendingDiplomacyInbox.length - 1; pi >= 0; pi--) {
        if (!diplomaticContactEstablished.has(pendingDiplomacyInbox[pi]!.ownerId)) {
          pendingDiplomacyInbox.splice(pi, 1);
        }
      }
      aiOneShotGiftLastTurn.clear();
      const savedGiftCooldown = saved.meta?.aiOneShotGiftLastTurn as Array<[number, number]> | undefined;
      if (savedGiftCooldown?.length) {
        for (const [oid, t] of savedGiftCooldown) aiOneShotGiftLastTurn.set(oid, t);
      }
      aiTradeAgreementLastProposalTurn.clear();
      const savedTradeAgreementCooldown = saved.meta?.aiTradeAgreementLastProposalTurn as Array<[number, number]> | undefined;
      if (savedTradeAgreementCooldown?.length) {
        for (const [oid, t] of savedTradeAgreementCooldown) aiTradeAgreementLastProposalTurn.set(oid, t);
      }
      aiAiTradeAgreementLastTurn.clear();
      const savedAiAiTradeCooldown = saved.meta?.aiAiTradeAgreementLastTurn as Array<[string, number]> | undefined;
      if (savedAiAiTradeCooldown?.length) {
        for (const [key, t] of savedAiAiTradeCooldown) aiAiTradeAgreementLastTurn.set(key, t);
      }
      aiResourceTradeLastProposalTurn.clear();
      const savedResourceTradeCooldown = saved.meta?.aiResourceTradeLastProposalTurn as Array<[number, number]> | undefined;
      if (savedResourceTradeCooldown?.length) {
        for (const [oid, t] of savedResourceTradeCooldown) aiResourceTradeLastProposalTurn.set(oid, t);
      }
      activeDeals = [];
      // Audyt #44: aiSkarbiecByOwner bylo czyszczone bez petli odtwarzajacej
      // (w przeciwienstwie do symetrycznej aiPracaPoolByOwner) -- skarbiec AI
      // zerowal sie po kazdym wczytaniu zapisu.
      aiSkarbiecByOwner.clear();
      const savedAiSkarbiec = saved.meta?.aiSkarbiecByOwner as Array<[number, number]> | undefined;
      if (savedAiSkarbiec?.length) {
        for (const [oid, v] of savedAiSkarbiec) aiSkarbiecByOwner.set(oid, v);
      }
      const savedDeals = saved.meta?.diplomacyDeals as ActiveDeal[] | undefined;
      if (savedDeals?.length) activeDeals = hydrateActiveDeals(savedDeals);
      diplomacyPairMeta.clear();
      const savedPairMeta = saved.meta?.diplomacyPairMeta as Array<[string, DiploPairMeta]> | undefined;
      if (savedPairMeta?.length) {
        for (const [key, meta] of savedPairMeta) diplomacyPairMeta.set(key, meta);
      }
      // FAZA 1 pkt 6: rejestr czynników — pole opcjonalne, stary save (bez pola) = pusty
      // rejestr, bez crasha (jak diplomacyPairMeta wyżej).
      diplomacyFactorLog.clear();
      const savedFactorLog = saved.meta?.diplomacyFactorLog as Array<[string, DiploFactorLog]> | undefined;
      if (savedFactorLog?.length) {
        for (const [key, log] of savedFactorLog) diplomacyFactorLog.set(key, log);
      }
      zlozeGrants = [];
      const savedZloze = saved.meta?.zlozeGrants as ZlozeGrant[] | undefined;
      if (savedZloze?.length) zlozeGrants = savedZloze.slice();
      basketTransferCtx = createEmptyBasketTransferContext(data.tech);
      const savedSurowiecGrants = saved.meta?.surowiecBooleanGrants as SurowiecBooleanGrant[] | undefined;
      if (savedSurowiecGrants?.length) {
        basketTransferCtx = { ...basketTransferCtx, surowiecBooleanGrants: savedSurowiecGrants.slice() };
      }
      syncBasketResearchFromEngine();
      _dipUnitSeq = 0;
      for (const oid of diplomaticContactEstablished) {
        if (oid !== 0) syncRelationFromDeals(0, oid);
      }
      const savedSiegeTurns = saved.meta?.siegeTurnByCity as Array<[string, number]> | undefined;
      if (savedSiegeTurns?.length) {
        for (const [cid, t] of savedSiegeTurns) siegeTurnByCity.set(cid, t);
      }
      const savedBesiegers = saved.meta?.siegeBesiegerByCity as Array<[string, number]> | undefined;
      if (savedBesiegers?.length) {
        for (const [cid, o] of savedBesiegers) {
          siegeBesiegerByCity.set(cid, o);
          const c = cities.find(x => x.id === cid);
          if (c) c.oblegajacyOwnerId = o;
        }
      }
      const savedAiSiege = saved.meta?.siegeAiStateByKey as Array<[string, SiegeAiState]> | undefined;
      if (savedAiSiege?.length) {
        for (const [k, st] of savedAiSiege) siegeAiStateByKey.set(k, st);
      }
      const savedImps = saved.meta?.placedImprovements as Array<[string, ImprovementKey]> | undefined;
      restorePlacedImprovementsFromSave(savedImps);
      clearAllHexClearing();
      pendingImprovementsTurn = PendingImprovementsTurn.fromSave(
        saved.meta?.pendingImprovementsTurn as PendingImprovementEntry[] | undefined,
      );
      const savedClr = saved.meta?.hexClearingStates as Array<[string, HexClearingState]> | undefined;
      if (savedClr?.length) {
        for (const [hk, st] of savedClr) hexClearingStates.set(hk, st);
      }
      syncClearingMeshesFromState();
      for (const c of cities) {
        if (c.oblegane && c.oblegajacyOwnerId === undefined) {
          const o = siegeBesiegerByCity.get(c.id);
          if (o !== undefined) c.oblegajacyOwnerId = o;
        }
      }
      refreshObjectivePowerCache();
      selectedId = null;
      reachable = new Set<string>();
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      hoverKey = null;
      gameOver = false;
      if (saved.meta?.newGameParams) {
        _lastNewGameParams = saved.meta.newGameParams as NewGameParams;
      }
    }

    // Show main menu overlay; game is already initialized beneath it.
    // DUŻE bitwy pierwsze — ich nazwy plików łapałby regex oblężenia 3v3.
    const playtestBitwaDuzaUrl = typeof location !== 'undefined' && isPlaytestBitwaDuzaMode();
    const playtestOblezenieDuzeUrl = typeof location !== 'undefined' && !playtestBitwaDuzaUrl && isPlaytestOblezenieDuzeMode();
    const playtestBitwaDuzaAny = playtestBitwaDuzaUrl || playtestOblezenieDuzeUrl;
    const playtestOdskokOblUrl = typeof location !== 'undefined' && !playtestBitwaDuzaAny && isPlaytestOdskokOblezenieMode();
    const playtestOdskokUrl = typeof location !== 'undefined' && !playtestBitwaDuzaAny && !playtestOdskokOblUrl && (
      (() => {
        const pt = new URLSearchParams(location.search).get('playtest');
        return pt === 'odskok';
      })() ||
      /PLAYTEST-ODSKOK/i.test(location.pathname || '')
    );
    const playtestWalkaUrl = typeof location !== 'undefined' && !playtestBitwaDuzaAny && !playtestOdskokOblUrl && !playtestOdskokUrl && (
      (() => {
        const pt = new URLSearchParams(location.search).get('playtest');
        return pt === 'walka' || pt === 'oblez';
      })() ||
      /PLAYTEST-WALKA/i.test(location.pathname || '')
    );
    const playtestMiastoUrl = typeof location !== 'undefined' && (
      new URLSearchParams(location.search).get('playtest') === 'miasto' ||
      /PLAYTEST-MIASTO/i.test(location.pathname || '')
    );
    const playtestMapaUrl = typeof location !== 'undefined' && (
      (() => {
        const pt = new URLSearchParams(location.search).get('playtest');
        return pt === 'mapa' || pt === 'sandbox';
      })() ||
      /PLAYTEST-MAPA/i.test(location.pathname || '')
    );
    const demoUlepszeniaUrl = typeof location !== 'undefined' && (
      new URLSearchParams(location.search).get('demo') === 'ulepszenia' ||
      /DEMO-ULEPSZENIA/i.test(location.pathname || '')
    );
    if (demoUlepszeniaUrl) {
      void (async () => { await doStartPlaytestMapaSwiata(); seedDemoUlepszenia(); })();
    } else if (playtestBitwaDuzaAny || playtestOdskokOblUrl || playtestOdskokUrl || playtestWalkaUrl) {
      void doStartPlaytestWalkaMapy();
    } else if (playtestMapaUrl) {
      void doStartPlaytestMapaSwiata();
    } else if (playtestMiastoUrl) {
      void doStartPlaytestMiastoEkonomia();
    } else {
      openStartupMainMenu();
    }
    // Note: renderLoop() is now called by doStartGame() / doLoadGame(), not here.
    // For smoke test: the rAF loop starts immediately via the first render frame below.
    // We schedule a single rAF to satisfy smoke's check (c).
    requestAnimationFrame(() => {
      camCtrl.update();
      {
        const { dist } = camCtrl.getFocusState();
        const { minDist, maxDist } = camCtrl.getDistLimits();
        setZoomLod(dist, minDist, maxDist);
      }
      renderer.render(scene, camera);
    });

  } catch (err) {
    showErr('FATAL: ' + String(err) + (err instanceof Error ? '\n' + err.stack : ''));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { void boot(); });
} else {
  void boot();
}
