/** Save metadata version that marks battleAlwaysManual as an active runtime policy. */
export const BATTLE_MODE_SETTING_VERSION = 1;

/**
 * Old saves also carried the former, inert battleAlwaysManual boolean in their
 * new-game parameters. Only treat it as the new auto-only policy when the save
 * explicitly carries the semantics version introduced with the live behavior.
 */
export function isAutomaticOnlyBattleMode(
  settingVersion: number | undefined,
  battleAlwaysManual: unknown,
): boolean {
  return settingVersion === BATTLE_MODE_SETTING_VERSION && battleAlwaysManual === false;
}
