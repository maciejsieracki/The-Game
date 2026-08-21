/**
 * entityCards/buildingAdapter.ts — adapter-szkielet (T1): `BuildingDef` surowy wiersz →
 * `EntityCardData`. Pełne wypełnienie treścią (parytet z `cityPanel.ts`
 * `buildBuildingDetailCard`/`buildBuildingBuildTabDetailCard`) jest zakresem T5.
 */
import type { BuildingDef } from '../../data/loader';
import type { EntityCardAdapter, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18" rx="3" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="16" text-anchor="middle" font-size="11" fill="currentColor">B</text></svg>';

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

export const buildingAdapter: EntityCardAdapter<BuildingDef> = (building) => {
  const economySection: EntityCardSection = {
    key: 'economy',
    title: 'Produkcja bazowa',
    rows: [
      { label: 'Praca', value: text(building.baza?.praca) },
      { label: 'Pieniądz', value: text(building.baza?.pieniadz) },
      { label: 'Żywność', value: text(building.baza?.zywnosc) },
      { label: 'Nauka', value: text(building.baza?.nauka) },
    ].filter((r) => r.value !== '' && r.value !== '0'),
  };

  return {
    kind: 'building',
    id: building.id,
    title: building.nazwa,
    subtitle: text(building.kategoria) || undefined,
    medallion: { kind: 'icon', svg: PLACEHOLDER_ICON_SVG },
    sections: [economySection],
    civpediaLink: { folder: 'budynki', slug: building.id },
  };
};
