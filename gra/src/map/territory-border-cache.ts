/**
 * R-WEB-PERF-LATE-GAME-LAG-HUD-Q2 (runda 2): czysty predykat rownosci wejsc granicy terytorium.
 * Geometria obwodki zalezy wylacznie od (heksy per owner, kolory tozsamosci/relacji) i statycznej
 * mapy; gdy oba zbiory sie nie zmienily, istniejaca grupa zostaje (bez kosztownej przebudowy).
 */
export interface TerritoryBorderInputs {
  byOwner: ReadonlyMap<number, ReadonlySet<string>>;
  colors: ReadonlyMap<number, string>;
}

export function territoryBorderInputsEqual(
  prev: TerritoryBorderInputs | null,
  byOwner: ReadonlyMap<number, ReadonlySet<string>>,
  colors: ReadonlyMap<number, string>,
): boolean {
  if (!prev) return false;
  if (prev.byOwner.size !== byOwner.size) return false;
  for (const [owner, keys] of byOwner) {
    const pk = prev.byOwner.get(owner);
    if (!pk || pk.size !== keys.size) return false;
    if (prev.colors.get(owner) !== colors.get(owner)) return false;
    for (const k of keys) if (!pk.has(k)) return false;
  }
  return true;
}
