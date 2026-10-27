/** Preserve the manpower count and show the number of full unit costs it can cover. */
export function recruitHudLabel(rekruciLabel: string, rekrutEkw: number | undefined): string {
  const fullUnits = Number.isSafeInteger(rekrutEkw) && (rekrutEkw ?? 0) > 0 ? rekrutEkw : 0;
  return `${rekruciLabel} (${fullUnits} pełnych jedn.)`;
}
