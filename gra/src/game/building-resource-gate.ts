/**
 * building-resource-gate.ts — bramka budynków miasta vs aktywny dostęp surowca.
 * B-SUROW-BUD (2026-07-23): bramki epokowe (dostęp AND, nie stock).
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
  cegla: 'Cegła',
  ceramika: 'Ceramika',
};

/** Bramki per epoka budynku — aktywny dostęp imperium (B-SUROW-BUD). */
const ERA_ACCESS_LABELS: Readonly<Record<number, readonly string[]>> = {
  1: ['Drewno'],
  2: ['Drewno', 'Kamień'],
  3: ['Drewno', 'Kamień', 'Cegła'],
  4: ['Drewno', 'Kamień', 'Cegła'],
};

/** Budynki wymagające aktywnego dostępu złoże + ulepszenie lub stock. */
const DEPOSIT_LINKED_BUILDING_LABELS: Readonly<Record<string, readonly string[]>> = {
  garncarnia: ['Glina'],
  cegielnia: ['Glina'],
  spichlerz: ['Ceramika'],
  spichlerz_ii: ['Sól'],
};

/** Label → klucz ASCII w City.surowce / puli państwa (odwrotność LABEL_BY_ASCII). */
const ASCII_BY_LABEL: Record<string, string> = Object.fromEntries(
  Object.entries(LABEL_BY_ASCII).map(([ascii, label]) => [label, ascii]),
);

/**
 * Bramka spełniona etykietą, gdy: aktywne ŹRÓDŁO surowca (activeLabels), LUB budynek-konwerter
 * (Cegielnia/Garncarnia), LUB — Maciej 2026-07-24 — surowiec jest w ZAPASIE puli państwa
 * (`empireStock` > 0). Poprawka realnego buga: gracz miał 8 drewna w puli (i las/Tartak w zasięgu),
 * a bramka „dostępu" i tak blokowała Pałac, bo sprawdzała tylko aktywne źródło. Dokładną ILOŚĆ
 * i tak egzekwuje osobno `koszt_surowce` przy kliknięciu „Buduj".
 */
function empireLabelSatisfied(
  label: string,
  activeLabels: readonly string[],
  empireBuiltIds: readonly string[] | undefined,
  empireStock: Readonly<Record<string, number>> | undefined,
): boolean {
  if (activeLabels.includes(label)) return true;
  if (label === 'Cegła' && empireBuiltIds?.includes('cegielnia')) return true;
  if (label === 'Ceramika' && empireBuiltIds?.includes('garncarnia')) return true;
  const asciiKey = ASCII_BY_LABEL[label];
  if (asciiKey && empireStock && (empireStock[asciiKey] ?? 0) > 0) return true;
  return false;
}

export function eraAccessLabels(epokaWejscia: number): readonly string[] {
  if (epokaWejscia >= 4) return ERA_ACCESS_LABELS[4] ?? [];
  return ERA_ACCESS_LABELS[epokaWejscia] ?? [];
}

export function buildingRequiredActiveLabels(building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & {
  wymaganySurowiec?: string | null;
}): readonly string[] {
  const out = new Set<string>();
  const hard = DEPOSIT_LINKED_BUILDING_LABELS[building.id];
  if (hard) hard.forEach(l => out.add(l));
  const key = building.wymaganySurowiec?.trim().toLowerCase();
  if (key && LABEL_BY_ASCII[key]) out.add(LABEL_BY_ASCII[key]!);
  for (const l of eraAccessLabels(building.epokaWejscia ?? 1)) out.add(l);
  return [...out];
}

export function buildingResourceGateMet(
  building: Pick<BuildingDef, 'id' | 'epokaWejscia'> & { wymaganySurowiec?: string | null },
  activeLabels: readonly string[] | undefined,
  empireBuiltIds?: readonly string[],
  empireStock?: Readonly<Record<string, number>>,
): boolean {
  const required = buildingRequiredActiveLabels(building);
  if (required.length === 0) return true;
  const active = activeLabels ?? [];
  return required.every(label => empireLabelSatisfied(label, active, empireBuiltIds, empireStock));
}
