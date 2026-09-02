/**
 * entityCards/wonderAdapter.ts — R-KARTY-HISTORIA-INFRA-CUDA-Q1: surowy wiersz
 * `wonders.json.cuda[]` (`WonderRow`, `registry.ts`) → `EntityCardData`.
 *
 * Piąta i ostatnia z pięciu kategorii encji migrowanych na wspólny system kart —
 * budowana wzorem `improvementAdapter.ts` (ten sam pattern: `hasValue()`, sekcje
 * filtrowane po niepustych wierszach, `historicalNote` na końcu z `historia`,
 * pole `uwagi` CELOWO nierenderowane — dev-tekst, ta sama zasada co pozostałe 4
 * kategorie zapobiegająca wyciekowi tekstu deweloperskiego graczowi).
 *
 * Ta runda to WYŁĄCZNIE mechanizm: `historia` nie jest jeszcze wypełnione w
 * `wonders.json` dla żadnego z 19 aktywnych cudów — treść dochodzi kolejnym,
 * osobnym dispatchem (17., ostatnim tematem serii R-KARTY-HISTORIA-Q1).
 */
import { resolveTechnologyRow, technologyIdFromName } from './registry';
import type { WonderRow, WonderTerrainBonus, WonderSpecialBonus } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

/** Placeholder medalionu — brak dziś dedykowanej ikonografii cudów w `brandAssets.ts`
 * (w odróżnieniu od budynków/ulepszeń), wzorem `PLACEHOLDER_ICON_SVG` w
 * `improvementAdapter.ts`: prosty motyw świątynny (kolumny + fronton), spójny z
 * emoji „🏛" już użytym dla cudów w `buildModeHud.ts`. */
const WONDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<polygon points="12,3 21,10 3,10" fill="currentColor" opacity=".18"/>' +
  '<rect x="4" y="10" width="2" height="9" fill="currentColor" opacity=".55"/>' +
  '<rect x="8" y="10" width="2" height="9" fill="currentColor" opacity=".55"/>' +
  '<rect x="12" y="10" width="2" height="9" fill="currentColor" opacity=".55"/>' +
  '<rect x="16" y="10" width="2" height="9" fill="currentColor" opacity=".55"/>' +
  '<rect x="20" y="10" width="2" height="9" fill="currentColor" opacity=".55"/>' +
  '<rect x="3" y="19" width="18" height="2" fill="currentColor" opacity=".7"/></svg>';

function text(value: unknown): string {
  return value == null ? '' : String(value).trim();
}

function hasValue(value: unknown): boolean {
  const t = text(value);
  return t !== '' && t !== '—';
}

const BONUS_LABEL: Record<string, string> = {
  zywnosc: 'Żywność',
  praca: 'Praca',
  handel: 'Handel',
  pieniadz: 'Pieniądz',
  kamien: 'Kamień',
  drewno: 'Drewno',
  kultura: 'Kultura',
  nauka: 'Nauka',
  wiara: 'Wiara',
};

const DOSTEP_LABEL: Record<string, string> = {
  E: 'Wyłączny (tylko wskazane cywilizacje)',
  R: 'Wyścig (dowolna z cywilizacji listy — kto pierwszy)',
};

export const wonderAdapter: EntityCardAdapter<WonderRow> = (wonder) => {
  const nazwa = text(wonder.nazwa) || wonder.id;

  // --- Dostępność ---------------------------------------------------------------------------
  const cywilizacje = Array.isArray(wonder.cywilizacje) ? wonder.cywilizacje : [];
  const wymagaTerenu = Array.isArray(wonder.wymagaTerenu) ? wonder.wymagaTerenu : [];
  const availabilityRows: EntityCardRow[] = [
    { label: 'Cywilizacje', value: cywilizacje.length > 0 ? cywilizacje.join(', ') : '' },
    { label: 'Dostęp', value: wonder.dostep ? (DOSTEP_LABEL[wonder.dostep] ?? text(wonder.dostep)) : '' },
    { label: 'Epoka wejścia', value: hasValue(wonder.epokaWejscia) ? text(wonder.epokaWejscia) : '' },
    { label: 'Wymagany teren', value: wymagaTerenu.length > 0 ? wymagaTerenu.join(', ') : '' },
  ].filter((r) => hasValue(r.value));
  const availabilitySection: EntityCardSection = {
    key: 'availability', title: 'Dostępność', rows: availabilityRows,
  };

  // --- Koszt i utrzymanie ---------------------------------------------------------------------
  const costRows: EntityCardRow[] = [
    { label: 'Koszt budowy', value: hasValue(wonder.kosztBudowy) ? `${text(wonder.kosztBudowy)} P` : '' },
    { label: 'Utrzymanie', value: hasValue(wonder.utrzymanie) ? `${text(wonder.utrzymanie)} / turę` : '' },
    { label: 'Maks. na świecie', value: hasValue(wonder.maxNaSwiecie) ? text(wonder.maxNaSwiecie) : '' },
  ].filter((r) => hasValue(r.value));
  const costSection: EntityCardSection = {
    key: 'cost', title: 'Koszt i utrzymanie', rows: costRows,
  };

  // --- Technologie (odblokowanie) -------------------------------------------------------------
  // `techUnlock` bywa listą (najczęściej 1 element) nazw technologii — link tylko gdy
  // `resolveTechnologyRow` faktycznie znajdzie wiersz (wzorem `improvementAdapter.ts`).
  const techUnlock = Array.isArray(wonder.techUnlock) ? wonder.techUnlock : [];
  const techRows: EntityCardRow[] = techUnlock
    .filter((t) => hasValue(t))
    .map((t) => {
      const techName = text(t);
      const techSlug = technologyIdFromName(techName);
      const linkTo = resolveTechnologyRow(techSlug) != null
        ? ({ kind: 'technology', id: techSlug } as const) : undefined;
      return { label: 'Technologia', value: techName, linkTo };
    });
  const technologySection: EntityCardSection = {
    key: 'technology', title: 'Technologia', rows: techRows,
  };

  // --- Bonusy ---------------------------------------------------------------------------------
  const bonusy = wonder.bonusy ?? {};
  const bonusRows: EntityCardRow[] = [];
  const miasto = bonusy.miasto ?? {};
  for (const [k, v] of Object.entries(miasto)) {
    if (typeof v === 'number' && v !== 0) {
      bonusRows.push({ label: `Miasto — ${BONUS_LABEL[k] ?? k}`, value: `${v > 0 ? '+' : ''}${v}`, emphasize: true });
    }
  }
  const teren = Array.isArray(bonusy.teren) ? bonusy.teren : [];
  for (const t of teren as WonderTerrainBonus[]) {
    const typTerenu = text(t.typTerenu);
    const parts: string[] = [];
    for (const [k, v] of Object.entries(t)) {
      if (k === 'typTerenu' || k === 'warunek') continue;
      if (typeof v === 'number' && v !== 0) parts.push(`${v > 0 ? '+' : ''}${v} ${BONUS_LABEL[k] ?? k}`);
    }
    if (parts.length > 0) {
      bonusRows.push({
        label: `Teren${typTerenu ? ` (${typTerenu})` : ''}`,
        value: parts.join(', ') + (hasValue(t.warunek) ? ` — ${text(t.warunek)}` : ''),
      });
    }
  }
  const specjalne = Array.isArray(bonusy.specjalne) ? bonusy.specjalne : [];
  for (const s of specjalne as WonderSpecialBonus[]) {
    if (hasValue(s.opis)) bonusRows.push({ label: 'Specjalny', value: text(s.opis) });
  }
  const bonusSection: EntityCardSection = {
    key: 'bonus', title: 'Bonusy', rows: bonusRows,
  };

  const subtitleParts = [
    hasValue(wonder.epokaWejscia) ? `Epoka ${text(wonder.epokaWejscia)}` : null,
    hasValue(wonder.nazwaAlt) ? text(wonder.nazwaAlt) : null,
  ].filter((x): x is string => !!x);

  return {
    kind: 'wonder',
    // Nadpisywane przez `renderer.ts:buildEntityCardData` prawdziwym `id` zapytania
    // (wzorem `improvementAdapter.ts`) — tu najlepszy dostępny placeholder.
    id: wonder.id,
    title: nazwa,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
    medallion: { kind: 'icon', svg: WONDER_ICON_SVG },
    sections: [availabilitySection, costSection, technologySection, bonusSection],
    civpediaLink: null,
    // `wonder.uwagi` CELOWO nierenderowane — patrz nagłówek pliku.
    historicalNote: hasValue(wonder.historia) ? text(wonder.historia) : undefined,
  };
};
