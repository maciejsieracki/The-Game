/**
 * R-WEB-BATTLE-RETREAT-LIMIT-3-PER-TURN-THEN-DESTROYED-Q1 (Maciej 2026-11-14 + ABC):
 * armia może wykonać do TRZECH odwrotów w jednej turze. Odwrót = (a) wycofanie
 * obrońcy przed bitwą (przycisk „Wycofaj"), albo (b) odwrót ocalałych przegranej
 * strony o 2 heksy (post-battle-map). Po wyczerpaniu limitu KOLEJNA przegrana bitwa
 * w tej turze kończy się unicestwieniem armii. Licznik zeruje się na początku
 * następnej tury (main.ts, EOT).
 *
 * Wspólny licznik na rosterze (decyzja orkiestratora: jeden licznik na turę per
 * armia; obie formy odwrotu liczą się razem). Odwrót obrońców w garnizonie miasta
 * jest zablokowany przez allDefendersFortifiedInGarnizon i NIE jest tu liczony.
 *
 * / EN: an army may retreat up to three times per turn. The (N+1)th lost battle in
 * the same turn destroys the army. Counter is shared per battle roster.
 */
import combatParamsRaw from '../../data/combat-params.json';
import type { RuntimeUnit } from '../units/setup';

const odwrotCfg = (combatParamsRaw as { odwrot?: { max_na_ture?: number } }).odwrot;

/** Limit odwrotów na turę (combat-params.json `odwrot.max_na_ture`, domyślnie 3). */
export const MAX_ODWROTOW_NA_TURE: number = Number.isFinite(odwrotCfg?.max_na_ture)
  ? Math.max(0, Math.floor(odwrotCfg!.max_na_ture as number))
  : 3;

/** Komunikat unicestwienia (wydarzenie dla gracza). */
export const ARMIA_UNICESTWIONA_KOMUNIKAT =
  'Armia unicestwiona — wyczerpano trzy odwroty w tej turze';

/** Komunikat unicestwienia armii PRZECIWNIKA (AI) — ta sama reguła, inna strona. */
export const ARMIA_WROGA_UNICESTWIONA_KOMUNIKAT =
  'Armia przeciwnika unicestwiona — wyczerpano trzy odwroty w tej turze';

/** Powód wyszarzenia przycisku „Wycofaj" po wyczerpaniu limitu. */
export const ODWROT_WYCZERPANY_POWOD =
  'Wycofanie niedostępne — wyczerpano trzy odwroty w tej turze; kolejna przegrana oznacza unicestwienie armii';

/** Licznik odwrotów pojedynczej jednostki (migracja: stary boolean retreatedThisTurn -> 1/0). */
export function retreatCountOfUnit(u: RuntimeUnit): number {
  if (typeof u.odwrotyWTurze === 'number' && Number.isFinite(u.odwrotyWTurze)) {
    return Math.max(0, Math.floor(u.odwrotyWTurze));
  }
  return u.retreatedThisTurn === true ? 1 : 0;
}

/** Licznik odwrotów armii (rosteru) = maksimum po jednostkach rosteru. */
export function retreatCountOfRoster(roster: readonly RuntimeUnit[]): number {
  let max = 0;
  for (const u of roster) {
    const c = retreatCountOfUnit(u);
    if (c > max) max = c;
  }
  return max;
}

/** Czy armia wyczerpała limit odwrotów w tej turze. */
export function retreatBudgetExhausted(roster: readonly RuntimeUnit[]): boolean {
  return retreatCountOfRoster(roster) >= MAX_ODWROTOW_NA_TURE;
}

/** Zapisuje kolejny odwrót: licznik +1 na każdej jednostce rosteru (wspólny licznik armii). */
export function recordRetreatOnRoster(roster: readonly RuntimeUnit[]): number {
  const next = retreatCountOfRoster(roster) + 1;
  for (const u of roster) {
    u.odwrotyWTurze = next;
    u.retreatedThisTurn = undefined;
  }
  return next;
}

/** Zerowanie licznika na początku tury (dla każdej jednostki). */
export function resetRetreatCountOfUnit(u: RuntimeUnit): void {
  u.odwrotyWTurze = 0;
  u.retreatedThisTurn = undefined;
}
