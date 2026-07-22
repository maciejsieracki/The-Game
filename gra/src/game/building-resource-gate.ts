/**
 * building-resource-gate.ts — bramka budynków miasta vs aktywny dostęp surowca.
 * Aktywny dostęp = złoże w zasięgu miasta + wymagane ulepszenie na tym heksie
 * (resource-access.ts). Dotyczy par złoże↔ulepszenie z terrain-improvements.json.
 */
import type { BuildingDef } from '../data/loader';

const LABEL_BY_ASCII: Record<string, string> = {
  drewno: 'Drewno',
  kamien: 'Kamień',
  glina: 'Glina',
  ruda: 'Ruda',
  zelazo: 'Żelazo',
  stal: 'Stal',
  braz: 'Brąz',
  sol: 'Sól',
};

/** Budynki wymagające aktywnego dostępu (złoże + ulepszenie) — faza 1. */
const DEPOSIT_LINKED_BUILDING_LABELS: Readonly<Record<string, readonly string[]>> = {
  garncarnia: ['Glina'],
  cegielnia: ['Glina'],
};

/** Etykiety aktywnego dostępu wymagane przez budynek (pusta = brak bramki surowca). */
export function buildingRequiredActiveLabels(building: Pick<BuildingDef, 'id'> & {
  wymaganySurowiec?: string | null;
}): readonly string[] {
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) return hard;
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) return [LABEL_BY_ASCII[key]!];
  return [];
}

/** Czy miasto ma aktywny dostęp do wszystkich surowców wymaganych przez budynek. */
export function buildingResourceGateMet(
  building: Pick<BuildingDef, 'id'> & { wymaganySurowiec?: string | null },
  activeLabels: readonly string[] | undefined,
): boolean {
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  if (!activeLabels?.length) return false;
  const active = new Set(activeLabels);
  return required.every(label => active.has(label));
}
