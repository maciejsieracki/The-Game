/**
 * entityCards/unitAdapter.ts — adapter-szkielet (T1): `UnitDef` surowy wiersz →
 * `EntityCardData`. Pełne wypełnienie treścią (parytet z `unitInfoCard.ts`) jest
 * zakresem T4 — tu wystarczy poprawny typ i sensowne dane podstawowe dla test fixture.
 * NIE przenosi jeszcze logiki z `unitInfoCard.ts` (zero edycji tego pliku w T1).
 */
import type { UnitDef } from '../../data/loader';
import { unitToSlug } from './registry';
import type { EntityCardAdapter, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="10" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="16" text-anchor="middle" font-size="11" fill="currentColor">J</text></svg>';

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  const t = text(value);
  return t !== '' && t !== '—';
}

export const unitAdapter: EntityCardAdapter<UnitDef> = (unit) => {
  const combatSection: EntityCardSection = {
    key: 'combat',
    title: 'Walka',
    rows: [
      { label: 'Atak', value: text(unit.Atak) },
      { label: 'Obrona', value: text(unit.Obrona) },
      { label: 'Ruch', value: text(unit.Ruch) },
      { label: 'Punkty życia', value: text(unit.Health) },
    ].filter((r) => hasValue(r.value)),
  };

  const economySection: EntityCardSection = {
    key: 'economy',
    title: 'Koszt i utrzymanie',
    rows: [
      { label: 'Koszt (Pieniądz)', value: text(unit['Pieniądz (koszt)']) },
      { label: 'Ludność', value: text(unit.Ludność) },
      { label: 'Surowiec', value: text(unit.Surowiec) },
      { label: 'Utrzymanie (Pieniądz/turę)', value: text(unit['Utrzymanie (Pieniądz/turę)']) },
    ].filter((r) => hasValue(r.value)),
  };

  return {
    kind: 'unit',
    id: unitToSlug(unit.Jednostka),
    title: unit.Jednostka,
    subtitle: text(unit.Epoka) || undefined,
    medallion: { kind: 'icon', svg: PLACEHOLDER_ICON_SVG },
    sections: [combatSection, economySection],
    civpediaLink: null,
  };
};
