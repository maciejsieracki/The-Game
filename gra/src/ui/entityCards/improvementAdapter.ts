/**
 * entityCards/improvementAdapter.ts — adapter-szkielet (T1): surowy wiersz
 * `terrain-improvements.json` (`ImprovementRow`, `registry.ts`) → `EntityCardData`.
 * Budowany od razu na kontrakcie — nie ma dziś żadnej istniejącej karty ulepszeń do
 * migracji (plan §4); pełne wypełnienie treścią + 3 miejsca wywołania to T7b.
 * Civpedia: `terrain-improvements.json` ma klucze wiele-do-jednego wobec plików
 * CivPedii (np. warianty kopalni → `kopalnia.md`) — mostek `gra-id` to T9; `null` do T9.
 */
import type { ImprovementRow } from './registry';
import type { EntityCardAdapter, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<rect x="4" y="10" width="16" height="10" fill="currentColor" opacity=".15"/>' +
  '<polygon points="4,10 12,3 20,10" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="18" text-anchor="middle" font-size="10" fill="currentColor">U</text></svg>';

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  const t = text(value);
  return t !== '' && t !== '—';
}

export const improvementAdapter: EntityCardAdapter<ImprovementRow> = (improvement) => {
  const bonus = improvement.bonus ?? {};
  const bonusRows = Object.entries(bonus)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => ({ label: k, value: String(v) }));

  const requirementsSection: EntityCardSection = {
    key: 'requirements',
    title: 'Wymagania',
    rows: [
      { label: 'Teren', value: text(improvement.teren) },
      { label: 'Technologia', value: text(improvement.tech) },
      { label: 'Koszt (Praca)', value: text(improvement.koszt_praca) },
    ].filter((r) => hasValue(r.value)),
  };

  const bonusSection: EntityCardSection = {
    key: 'bonus',
    title: 'Bonusy',
    rows: bonusRows,
  };

  return {
    kind: 'improvement',
    // Wiersz `terrain-improvements.json` nie niesie własnego klucza obiektu (to
    // wywołujący go zna — patrz `registry.ts:resolveImprovementRow`), więc adapter
    // nie może wyliczyć `id` samodzielnie; `renderer.ts:buildEntityCardData`
    // nadpisuje to pole prawdziwym `id` po wywołaniu adaptera (kontrakt: `data.id`
    // zawsze równe id zapytania). Tu tylko placeholder niepusty.
    id: text(improvement.nazwa) || 'improvement',
    title: text(improvement.nazwa) || '(bez nazwy)',
    subtitle: hasValue(improvement.epoka) ? `Epoka ${text(improvement.epoka)}` : undefined,
    medallion: { kind: 'icon', svg: PLACEHOLDER_ICON_SVG },
    sections: [requirementsSection, bonusSection],
    civpediaLink: null,
  };
};
