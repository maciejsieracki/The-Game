/**
 * stateAdministratorRow.ts — wiersz „Administrator państwa” w panelu Państwa (skarbiec imperium).
 *
 * Jeden administrator na Państwo; tryb auto ulepszeń terenu działa dla całego Państwa.
 * Dane (liczby z silnika) przychodzą przez `HudState.administratorPanstwa` (main.ts buildHudState).
 */
import type { HudState } from './hud';

export type StateAdministratorPanelRow = NonNullable<HudState['administratorPanstwa']>;

const TIP = 'Jeden administrator na całe Państwo. Tryb auto ulepszeń terenu działa dla wszystkich miast Państwa.';

/** HTML wartości wiersza: stan (zatrudniony / pracuje), utrzymanie na turę albo koszt zatrudnienia. */
export function stateAdministratorStatusHtml(sa: StateAdministratorPanelRow): string {
  const upkeep = Math.round(sa.upkeep);
  const title = ` title="${TIP}"`;
  if (!sa.hired) {
    return `<span class="civ-emp-adm-state off"${title}>nie zatrudniony — koszt ${Math.round(sa.hireCost)}, `
      + `utrzymanie ${upkeep}/turę</span>`;
  }
  if (sa.working) {
    return `<span class="civ-emp-adm-state on"${title}>zatrudniony · pracuje · −${upkeep}/turę</span>`;
  }
  return `<span class="civ-emp-adm-state off"${title}>zatrudniony · nie pracuje (brak środków w skarbcu państwa)</span>`;
}
