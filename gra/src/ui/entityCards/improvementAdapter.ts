/**
 * entityCards/improvementAdapter.ts — pełne wypełnienie (T7b, KARTA-ULEPSZENIA-TERENU):
 * surowy wiersz `terrain-improvements.json` (`ImprovementRow`, `registry.ts`) →
 * `EntityCardData`. Budowany od razu na kontrakcie — nie ma dziś żadnej istniejącej
 * karty ulepszeń do migracji (plan §4); to jest pierwsza pełna treść tego adaptera.
 *
 * Civpedia: `terrain-improvements.json` ma klucze wiele-do-jednego wobec plików
 * CivPedii (np. warianty kopalni → `kopalnia.md`) — mostek `gra-id` to T9; `null` do T9.
 *
 * `registry.ts` (poza allowlistą T7b) nie niesie klucza `ImprovementKey` samego
 * wiersza — reeksport `ImprovementRow` z registry.ts nie ma pola `nazwa`→klucz.
 * Ten adapter odtwarza mapę `nazwa → klucz` bezpośrednio z `terrain-improvements.json`
 * (ten sam wzorzec co `IMPROVEMENT_NAME_TO_KEY` w `techDiscoveryNotice.ts`/
 * `technologyAdapter.ts`, Bug B R-TECH-ULEPSZENIA-TERENU-SYNC-Q1) — wyłącznie po to,
 * żeby dobrać właściwą ikonę (`improvementIconSvg` jest kluczowany po `ImprovementKey`,
 * nie po polskiej nazwie).
 */
import terrainImprovementsData from '../../../data/terrain-improvements.json';
import { improvementIconSvg } from '../icons/brandAssets';
import { resolveImprovementRow, resolveTechnologyRow, technologyIdFromName } from './registry';
import type { ImprovementRow } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<rect x="4" y="10" width="16" height="10" fill="currentColor" opacity=".15"/>' +
  '<polygon points="4,10 12,3 20,10" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="18" text-anchor="middle" font-size="10" fill="currentColor">U</text></svg>';

/** Pola realnie obecne w `terrain-improvements.json`, ale nie zadeklarowane
 * w `ImprovementRow` (`registry.ts`, poza allowlistą T7b) — lokalne rozszerzenie
 * typu, zero zmian w registrze. */
interface ImprovementRowExtra {
  bonus_obrona_proc?: number;
  bonus_ruch?: number;
  bonus_ruch_uwaga?: string;
  bonus_wymaga_obozowania?: boolean;
  cywilizacje?: string[];
  cywilizacje_uwaga?: string;
  surowiecOdblokowany_uwaga?: string;
  surowiec_ilosc_tura?: number;
  tech_uwaga?: string;
  typ?: string;
  upgradeFrom?: string;
  uwagi?: string;
  wycinka?: boolean;
  zasieg_kontroli?: number;
  zasieg_pol?: number;
  zasieg_terytorium?: number;
}

type FullImprovementRow = ImprovementRow & ImprovementRowExtra;

/** Mapa nazwa gracza (`row.nazwa`) → klucz obiektu (`ImprovementKey`) w
 * `terrain-improvements.json` — wyłącznie do doboru ikony (Bug B). */
const NAME_TO_KEY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, row] of Object.entries(terrainImprovementsData as Record<string, { nazwa?: string }>)) {
    if (key.startsWith('_')) continue;
    const nazwa = row?.nazwa;
    if (typeof nazwa === 'string' && nazwa) map[nazwa] = key;
  }
  return map;
})();

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
};

export const improvementAdapter: EntityCardAdapter<ImprovementRow> = (improvementRaw) => {
  const improvement = improvementRaw as FullImprovementRow;
  const nazwa = text(improvement.nazwa) || '(bez nazwy)';
  const key = NAME_TO_KEY[nazwa];

  // --- Bonusy (per obrabiane pole) -----------------------------------------------------------
  const bonus = improvement.bonus ?? {};
  const bonusRows: EntityCardRow[] = Object.entries(bonus)
    .filter(([, v]) => typeof v === 'number' && v !== 0)
    .map(([k, v]) => ({ label: BONUS_LABEL[k] ?? k, value: `${v > 0 ? '+' : ''}${v}`, emphasize: true }));
  if (hasValue(improvement.bonus_obrona_proc)) {
    bonusRows.push({ label: 'Obrona', value: `+${text(improvement.bonus_obrona_proc)}%` });
  }
  if (hasValue(improvement.bonus_ruch)) {
    bonusRows.push({
      label: 'Ruch',
      value: `${text(improvement.bonus_ruch)}${improvement.bonus_ruch_uwaga ? ` (${text(improvement.bonus_ruch_uwaga)})` : ''}`,
    });
  }
  const bonusSection: EntityCardSection = {
    key: 'bonus', title: 'Bonusy (obrabiane pole)', rows: bonusRows,
  };

  // --- Wymagania (teren, warunek, technologia, koszt) ----------------------------------------
  // T10 LINKOWANIE-KRZYZOWE: `improvement.tech` bywa placeholderem "-"/"—" LUB (potwierdzone
  // reconem na realnych danych, np. `irygacja`) nazwą bez odpowiednika w `tech.json` —
  // link tylko gdy `resolveTechnologyRow` faktycznie znajdzie wiersz.
  const techName = text(improvement.tech);
  const techSlug = techName ? technologyIdFromName(techName) : null;
  const techLinkTo = techSlug != null && resolveTechnologyRow(techSlug) != null
    ? ({ kind: 'technology', id: techSlug } as const) : undefined;
  // „Ulepszenie bazowe" (`upgradeFrom`) jest już kluczem obiektu `terrain-improvements.json`
  // (nie nazwą gracza) — resolver bierze go wprost, weryfikacja przez `resolveImprovementRow`.
  const upgradeFromKey = text(improvement.upgradeFrom);
  const upgradeFromLinkTo = upgradeFromKey && resolveImprovementRow(upgradeFromKey) != null
    ? ({ kind: 'improvement', id: upgradeFromKey } as const) : undefined;
  const requirementRows: EntityCardRow[] = [
    { label: 'Teren', value: text(improvement.teren) },
    {
      label: 'Technologia',
      value: techName + (hasValue(improvement.tech_uwaga) ? ` (${text(improvement.tech_uwaga)})` : ''),
      linkTo: techLinkTo,
    },
    { label: 'Koszt (Praca)', value: hasValue(improvement.koszt_praca) ? `${text(improvement.koszt_praca)} P` : '' },
    { label: 'Warunek', value: text(improvement.warunek) },
    {
      label: 'Cywilizacje',
      value: Array.isArray(improvement.cywilizacje) && improvement.cywilizacje.length > 0
        ? improvement.cywilizacje.join(', ') + (hasValue(improvement.cywilizacje_uwaga) ? ` (${text(improvement.cywilizacje_uwaga)})` : '')
        : '',
    },
    { label: 'Ulepszenie bazowe', value: upgradeFromKey, linkTo: upgradeFromLinkTo },
  ].filter((r) => hasValue(r.value));
  const requirementsSection: EntityCardSection = {
    key: 'requirements', title: 'Wymagania', rows: requirementRows,
  };

  // --- Surowce i terytorium --------------------------------------------------------------------
  const resourceRows: EntityCardRow[] = [];
  if (hasValue(improvement.surowiecOdblokowany)) {
    resourceRows.push({
      label: 'Odblokowuje surowiec',
      value: text(improvement.surowiecOdblokowany),
    });
  }
  if (hasValue(improvement.surowiec_ilosc_tura)) {
    resourceRows.push({ label: 'Produkcja surowca', value: `${text(improvement.surowiec_ilosc_tura)} / turę` });
  }
  if (hasValue(improvement.zasieg_terytorium)) {
    resourceRows.push({ label: 'Zasięg terytorium', value: `${text(improvement.zasieg_terytorium)} pól` });
  }
  if (hasValue(improvement.zasieg_kontroli)) {
    resourceRows.push({ label: 'Zasięg kontroli', value: `${text(improvement.zasieg_kontroli)} pól` });
  }
  if (hasValue(improvement.zasieg_pol)) {
    resourceRows.push({ label: 'Zasięg wpływu na pola', value: `${text(improvement.zasieg_pol)} pól` });
  }
  const resourceSection: EntityCardSection = {
    key: 'resources', title: 'Surowce i terytorium', rows: resourceRows,
  };

  // --- Odblokowuje / uwagi -----------------------------------------------------------------------
  const unlockRows: EntityCardRow[] = [];
  if (hasValue(improvement.odblokowuje)) {
    unlockRows.push({ label: 'Odblokowuje', value: text(improvement.odblokowuje) });
  }
  if (hasValue(improvement.uwagi)) {
    unlockRows.push({ label: 'Uwagi', value: text(improvement.uwagi) });
  }
  if (improvement.wycinka === true) {
    unlockRows.push({ label: 'Wycinka lasu', value: 'Tak — usuwa nakładkę Las' });
  }
  if (improvement.bonus_wymaga_obozowania === true) {
    unlockRows.push({ label: 'Wymaga obozowania', value: 'Tak' });
  }
  const unlockSection: EntityCardSection = {
    key: 'unlocks', title: 'Dodatkowe informacje', rows: unlockRows,
  };

  const subtitleParts = [
    hasValue(improvement.epoka) ? `Epoka ${text(improvement.epoka)}` : null,
    hasValue(improvement.typ) ? text(improvement.typ) : null,
  ].filter((x): x is string => !!x);

  return {
    kind: 'improvement',
    // Nadpisywane przez `renderer.ts:buildEntityCardData` prawdziwym `id` zapytania
    // (patrz komentarz tam) — tu tylko najlepszy dostępny placeholder (klucz, jeśli
    // udało się go odtworzyć z nazwy, inaczej sama nazwa).
    id: key ?? nazwa,
    title: nazwa,
    subtitle: subtitleParts.length > 0 ? subtitleParts.join(' · ') : undefined,
    medallion: { kind: 'icon', svg: key ? improvementIconSvg(key, 34) : PLACEHOLDER_ICON_SVG },
    sections: [bonusSection, requirementsSection, resourceSection, unlockSection],
    civpediaLink: null,
  };
};
