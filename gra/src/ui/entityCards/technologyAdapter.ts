/**
 * entityCards/technologyAdapter.ts — adapter-szkielet (T1): surowy wiersz `tech.json`
 * (`RawTech`, `registry.ts`) → `EntityCardData`. Pełne wypełnienie treścią (parytet
 * z `techDiscoveryNotice.ts`) jest zakresem T3. `id` = `techToSlug()` z
 * `sciencePicker.ts` (WARIANT A) — patrz `registry.ts` nagłówek dla uzasadnienia.
 * Civpedia dla technologii NIE istnieje jeszcze jako kategoria (plan §5, T8) — link
 * pozostaje `null` do T8/T9.
 */
import type { RawTech } from './registry';
import { technologyIdFromName } from './registry';
import type { EntityCardAdapter, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="16" text-anchor="middle" font-size="11" fill="currentColor">T</text></svg>';

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  const t = text(value);
  return t !== '' && t !== '—';
}

export const technologyAdapter: EntityCardAdapter<RawTech> = (tech) => {
  const requirementsSection: EntityCardSection = {
    key: 'requirements',
    title: 'Wymagania',
    rows: [
      { label: 'Wymaga', value: text(tech['Wymaga (prereq)']) },
      { label: 'Wymagany budynek', value: text(tech['wymagany budynek']) },
      { label: 'Wymagane ulepszenie', value: text(tech['wymagane ulepszenie']) },
      { label: 'Koszt nauki', value: text(tech['Koszt nauki']) },
    ].filter((r) => hasValue(r.value)),
  };

  const unlocksSection: EntityCardSection = {
    key: 'unlocks',
    title: 'Odblokowuje',
    rows: [
      { label: 'Budynek', value: text(tech['Odblokowuje budynek']) },
      { label: 'Surowiec', value: text(tech['Odblokowuje surowiec.']) },
      { label: 'Ulepszenie terenu', value: text(tech['Odblokowuje ulepszenie terenu']) },
    ].filter((r) => hasValue(r.value)),
  };

  return {
    kind: 'technology',
    id: technologyIdFromName(tech['Technologia']),
    title: tech['Technologia'],
    subtitle: text(tech['Epoka']) || undefined,
    medallion: { kind: 'icon', svg: PLACEHOLDER_ICON_SVG },
    sections: [requirementsSection, unlocksSection],
    civpediaLink: null,
  };
};
