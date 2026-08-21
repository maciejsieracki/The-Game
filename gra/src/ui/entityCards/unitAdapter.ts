/**
 * entityCards/unitAdapter.ts — `UnitDef` (`units.json`) → `EntityCardData` (T4).
 *
 * Treść wypełniona 1:1 wg dzisiejszego `unitInfoCard.ts::buildUnitInfoCard`
 * (sekcje: Statystyki bojowe, Koszty i utrzymanie, Wymagania i kontry — w tym
 * pole „Kontry" z `counters.json`, `unitInfoCard.ts:190`/`collectCounters()`).
 *
 * Adapter jest samodzielny (jak `buildingAdapter.ts`/`technologyAdapter.ts`) — czyta
 * `counters.json` bezpośrednio (ten sam wzorzec co `technologyAdapter.ts` czytający
 * `buildings.json`/`units.json`/`terrain-improvements.json` obok swojego głównego
 * pliku), nie importuje z `unitInfoCard.ts`.
 *
 * Medalion: adapter zwraca DOMYŚLNY medalion statyczny (`unitInfographicSvg`, ten sam
 * SVG co dawny nagłówek karty przed zamontowaniem 3D) — podgląd 3D
 * (`{kind:'unit3d', mount}`) jest sprawą KONKRETNEGO wywołania (zależy od
 * `ownerColor`/fallbacku przekazywanego przez opcje wołającego, nie od samych danych
 * jednostki), więc `unitInfoCard.ts` nadpisuje `medallion` po zbudowaniu danych —
 * dokładnie ten sam wzorzec co nagłówek karty technologii w T3
 * (`showTechDiscoveryNoticeViaEntityCard`, patrz `technologyAdapter.ts` nagłówek pliku:
 * „Nagłówek karty ... zostaje budowany w techDiscoveryNotice.ts").
 *
 * Sekcja „Statusy" (status bojowy jednostki + `options.statusLines` wołającego) jest
 * z tego samego powodu budowana/dopełniana w `unitInfoCard.ts` — adapter dostarcza
 * tylko część niezależną od danych jednostki (status wymogu technologii).
 */
import type { CounterDef, UnitDef } from '../../data/loader';
import countersData from '../../../data/counters.json';
import { categoryOf } from '../../units/setup';
import { unitInfographicLabel, unitInfographicSvg } from '../unitInfographic';
import { unitToSlug } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

const COUNTERS = countersData as unknown as CounterDef[];

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

/** 1:1 z `unitInfoCard.ts::collectCounters` — kontry per typ atakujący jednostki. */
function collectCounters(unit: UnitDef): string[] {
  const typ = text(unit.Typ).toLowerCase();
  if (!typ) return [];
  return COUNTERS
    .filter((row) => text(row['Typ atakujący']).toLowerCase() === typ)
    .map((row) => {
      const target = text(row['Cel (typ)']);
      const bonus = text(row.Bonus);
      return bonus ? `${target}: ${bonus}` : target;
    })
    .filter(Boolean);
}

export const unitAdapter: EntityCardAdapter<UnitDef> = (unit) => {
  const isSuperUnit = unit['Super-jednostka'] === 'TAK';
  const category = categoryOf(
    text(unit.Jednostka),
    text(unit['Rola (linia)']),
    isSuperUnit,
    unit.Typ,
  );

  // --- Statystyki bojowe — 1:1 z `unitInfoCard.ts` (`combat` sekcja) ------------------------
  const combatRows: EntityCardRow[] = [
    { label: 'Atak', value: text(unit.Atak) },
    { label: 'Obrona', value: text(unit.Obrona) },
    { label: 'HP', value: text(unit.Health) },
    { label: 'Ruch', value: hasValue(unit.Ruch) ? `${text(unit.Ruch)} hex` : '' },
    { label: 'Zasięg', value: text(unit['Zasięg ataku (hex)']), emphasize: true },
    { label: 'Atak dystansowy', value: text(unit['Atak dystansowy']), emphasize: true },
    { label: 'Pancerz', value: text(unit.Pancerz) },
    { label: 'Przebicie', value: text(unit.Przebicie) },
  ].filter((r) => hasValue(r.value));
  const combatSection: EntityCardSection = { key: 'combat', title: 'Statystyki bojowe', rows: combatRows };

  // --- Koszty i utrzymanie — 1:1 z `unitInfoCard.ts` (`economy` sekcja) ---------------------
  const economyRows: EntityCardRow[] = [
    { label: 'Koszt Pieniądza', value: text(unit['Pieniądz (koszt)']) },
    {
      label: 'Koszt surowca',
      value: hasValue(unit.Surowiec) ? `${text(unit.Surowiec)} × ${text(unit['Surowiec (ilość)'])}` : '',
    },
    { label: 'Utrzymanie Pieniądza/turę', value: text(unit['Utrzymanie (Pieniądz/turę)']) },
    {
      label: 'Utrzymanie surowca/turę',
      value: hasValue(unit['Utrzymanie surowiec'])
        ? `${text(unit['Utrzymanie surowiec'])} × ${text(unit['Utrzymanie surowiec (ilość)'])}` : '',
    },
    { label: 'Ludność', value: text(unit.Ludność) },
    { label: 'Żywność/turę', value: text(unit['żywność/turę']) },
  ].filter((r) => hasValue(r.value));
  const economySection: EntityCardSection = { key: 'economy', title: 'Koszty i utrzymanie', rows: economyRows };

  // --- Wymagania i kontry — 1:1 z `unitInfoCard.ts` (`requirements` sekcja, w tym „Kontry") --
  const counters = collectCounters(unit);
  const requirementsRows: EntityCardRow[] = [
    { label: 'Technologia', value: text(unit.Tech) },
    { label: 'Kultura', value: text(unit.Kultura) },
    { label: 'Zastępuje', value: text(unit['W zamian za']) },
  ].filter((r) => hasValue(r.value));
  // „Kontry" — kontrakt `EntityCardRow.badge` niesie JEDEN badge na wiersz (patrz
  // `types.ts`), nie listę pigułek pod jednym wierszem jak dawny `appendBadgeRow()`.
  // Zamiast rozszerzać `types.ts`/`renderer.ts` (poza allowlistą T4), kontry trafiają
  // jako pojedynczy wiersz z wartościami połączonymi przecinkiem — treść identyczna
  // (te same pary cel/bonus), układ inny (delta świadoma, wzorem precedensu T3
  // „treść równoważna, nie identyczny HTML").
  if (counters.length > 0) {
    requirementsRows.push({ label: 'Kontry', value: counters.join(', ') });
  }
  const requirementsSection: EntityCardSection = {
    key: 'requirements', title: 'Wymagania i kontry', rows: requirementsRows,
  };

  // --- Statusy — część niezależna od `options.statusLines` (dopełniane w unitInfoCard.ts) ---
  const statusesSection: EntityCardSection = {
    key: 'statuses',
    title: 'Statusy',
    rows: [],
    badges: [hasValue(unit.Tech) ? 'wymaga technologii z danych' : 'brak wymogu'],
  };

  const iconSvg = unitInfographicSvg(unit, unit.Jednostka, 34) || PLACEHOLDER_ICON_SVG;
  const subtitle = [text(unit.Epoka), text(unit.Typ), unitInfographicLabel(category)]
    .filter(Boolean).join(' · ') || undefined;

  return {
    kind: 'unit',
    id: unitToSlug(unit.Jednostka),
    title: unit.Jednostka,
    subtitle,
    medallion: { kind: 'icon', svg: iconSvg },
    sections: [combatSection, economySection, requirementsSection, statusesSection],
    civpediaLink: null,
    statusBadges: isSuperUnit ? ['Super-jednostka'] : undefined,
  };
};
