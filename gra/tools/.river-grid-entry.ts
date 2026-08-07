export { generateMap } from '../src/map/generator';
export { resolveRiverMapParams } from '../src/map/newGameMapDefaults';
export {
  groupLandMassKeys,
  assertRiverGridCoverage,
  riverGridCoverageRatio,
  cellHasRiverSourceInCell,
  cellHasRiverHex,
  buildSeaDistanceField,
  minLandHexesForRiverCell,
  landHexesByCoverageCell,
  pathHasValidRiverOutlet,
  collectPathHexKeysForKinds,
  nearestRiverHexDistance,
  SHORT_RIVER_MAX_DIST_FROM_MEDIUM,
  pathReachesRealSea,
  maxDryLowlandPatchSize,
  maxLandHexDistanceToRiver,
  RIVER_PROXIMITY_MAX_DIST,
  riverProximityMaxDist,
  MAX_DRY_LOWLAND_PATCH_HEXES,
} from '../src/map/gen-helpers';