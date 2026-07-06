
export {
  canResearch, availableTechs, createResearchState, buildingGateMet,
  resolveRequiredBuildingId,
} from '../src/game/research';
export {
  availableProduction, applyCompletedBuildingIds, isBuildingSupersededByUpgrade,
} from '../src/game/production';
export { setPlayerResearchTarget, availableTechs as playerAvailableTechs, createPlayerState } from '../src/game/playerState';
