/**
 * empire-resource-access.ts — surowce imperium pokazywane jako „dostęp" (nie magazynowane)
 * w panelu SUROWCE (empireDetailPanel.ts filtruje `cap == null`).
 *
 * R-SUROWCE-DOSTEP: Ceramika, Sól, Koń, Złoto — wiersz boolean masz/brak + źródło,
 * bez paska stock/cap (nawet gdy silnik trzyma zapas w City.surowce).
 */
export const EMPIRE_ACCESS_RESOURCE_IDS: ReadonlySet<string> = new Set([
  'ceramika',
  'sol',
  'kon',
  'zloto',
]);

export function isEmpireAccessResource(id: string): boolean {
  return EMPIRE_ACCESS_RESOURCE_IDS.has(id);
}

/** Podział wierszy na magazynowane vs dostęp — ten sam kontrakt co panel imperium. */
export function partitionEmpireResourceRows<T extends { id: string; cap?: number | null }>(
  rows: readonly T[],
): { stored: T[]; access: T[] } {
  const stored: T[] = [];
  const access: T[] = [];
  for (const r of rows) {
    if (isEmpireAccessResource(r.id) || r.cap == null) {
      access.push(r);
    } else {
      stored.push(r);
    }
  }
  return { stored, access };
}
