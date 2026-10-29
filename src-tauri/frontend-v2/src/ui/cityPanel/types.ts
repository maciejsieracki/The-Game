// P5.8 K02: wspolne typy kawalkow cityPanel (dispatch: tylko tu, prefiks k02- dla plikow K02).
// ZALOZENIE P5.8-K02-Z3: BreakdownLine skopiowany 1:1 z gra/src/ui/cityPanel.ts (pin edb8fb56:4376).
// Przy scaleniu z K01 (typy K01) ten duplikat zostaje usuniety, a import idzie z K01.
export type BreakdownLine = { label: string; value: number; neg?: boolean };
// P5.8 K02 (runda 3, partia 1): typ wskaznikow zakladek z pin:4236 (`type TabIndicatorChip`), 1:1.
export type TabIndicatorChip = { icon: string; label: string; value: string; cls?: string; title?: string };
// P5.8 K02 (runda 3, partia 3): typy chipow wymagan budynku z pin:6812-6818, 1:1.
export type BuildingReqChipKind = 'tech' | 'stock' | 'other';
export interface BuildingReqChip {
  label: string;
  met: boolean;
  iconHtml?: string;
  kind: BuildingReqChipKind;
}
