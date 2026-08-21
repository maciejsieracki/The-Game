/**
 * entityCards/unitAdapter.ts — `UnitDef` (`units.json`) → `EntityCardData` (T4, rozszerzone w T6).
 *
 * Treść wypełniona 1:1 wg dzisiejszego `unitInfoCard.ts::buildUnitInfoCard`
 * (sekcje: Statystyki bojowe, Koszty i utrzymanie, Wymagania i kontry — w tym
 * pole „Kontry" z `counters.json`, `unitInfoCard.ts:190`/`collectCounters()`).
 *
 * T6 MIGRACJA-KARTA-JEDNOSTKI-PANEL-MIASTA (`cityPanel.ts::buildUnitDetailCard`) dodało
 * do tego adaptera pola, które dotąd istniały TYLKO w karcie rekrutacji (`cityPanel.ts`),
 * a nie w karcie mapy (`unitInfoCard.ts`): sekcja `characteristics` („Linia", „Klasa") oraz
 * dodatkowe wiersze `combat` („Obrażenia broni", „Bonus szarży", „Ruch (bitwa)", „Pociski",
 * „Widok pola", „Kara flanki", „Kara od tyłu", „Próg dezercji", „Morale bazowe",
 * „Morale ucieczki"). Decyzja Operatora T6 (bez ABC — patrz tabela porównawcza w raporcie
 * T6): to jest CZYSTO ADDYTYWNE wzbogacenie — żadna dotychczasowa wartość nie znika z
 * żadnej karty, obie karty (mapa i rekrutacja) zaczynają pokazywać TĘ SAMĄ, pełniejszą
 * treść tej samej jednostki, zgodnie z celem tego zadania („gracz w obu miejscach patrzy
 * na tę samą jednostkę"). Ponieważ adapter jest DZIELONY z już wdrożoną kartą mapy (T4),
 * ta zmiana wzbogaca też kartę mapy (dotąd nie pokazywała tych pól) — świadomie, nie
 * przez przeoczenie.
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
import { resolveTechnologyRow, resolveUnitRow, technologyIdFromName, unitToSlug } from './registry';
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

/** 1:1 z `cityPanel.ts::unitExtraField` — odczyt pól spoza typowanego `UnitDef`
 * (kolumny arkusza bez dedykowanego typu, np. „Klasa"/„Bonus szarży"/„Morale ..."). */
function extra(unit: UnitDef, key: string): string {
  const v = (unit as unknown as Record<string, unknown>)[key];
  return hasValue(v) ? text(v) : '';
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

  // --- Charakterystyka — dotąd TYLKO w karcie rekrutacji (`cityPanel.ts::buildUnitDetailCard`
  // sekcja „Charakterystyka"), T6 dodaje do wspólnego adaptera (patrz nagłówek pliku) --------
  const characteristicsRows: EntityCardRow[] = [
    { label: 'Linia', value: text(unit['Rola (linia)']) },
    { label: 'Klasa', value: extra(unit, 'Klasa') },
  ].filter((r) => hasValue(r.value));
  const characteristicsSection: EntityCardSection = {
    key: 'characteristics', title: 'Charakterystyka', rows: characteristicsRows,
  };

  // --- Statystyki bojowe — 1:1 z `unitInfoCard.ts` (`combat` sekcja); wiersze poniżej
  // „Przebicie" dodane w T6 — dotąd TYLKO w karcie rekrutacji (patrz nagłówek pliku) --------
  const progDezercji = unit['Próg dezercji (% health)'];
  const combatRows: EntityCardRow[] = [
    { label: 'Atak', value: text(unit.Atak) },
    { label: 'Obrona', value: text(unit.Obrona) },
    { label: 'HP', value: text(unit.Health) },
    { label: 'Ruch', value: hasValue(unit.Ruch) ? `${text(unit.Ruch)} hex` : '' },
    { label: 'Zasięg', value: text(unit['Zasięg ataku (hex)']), emphasize: true },
    { label: 'Atak dystansowy', value: text(unit['Atak dystansowy']), emphasize: true },
    { label: 'Pancerz', value: text(unit.Pancerz) },
    { label: 'Przebicie', value: text(unit.Przebicie) },
    { label: 'Obrażenia broni', value: text(unit.Uderzenie) },
    { label: 'Bonus szarży', value: extra(unit, 'Bonus szarży') },
    { label: 'Ruch (bitwa)', value: hasValue(unit['Ruch w bitwie (heksy)']) ? `${text(unit['Ruch w bitwie (heksy)'])} hex` : '' },
    { label: 'Pociski', value: text(unit['Ilość pocisków']) },
    { label: 'Widok pola', value: hasValue(unit['Widok pola']) ? `${text(unit['Widok pola'])} hex` : '' },
    { label: 'Kara flanki', value: hasValue(unit['Kara obrony z flanki (%)']) ? `${text(unit['Kara obrony z flanki (%)'])}%` : '' },
    { label: 'Kara od tyłu', value: hasValue(unit['Kara obrony z tyłu (%)']) ? `${text(unit['Kara obrony z tyłu (%)'])}%` : '' },
    { label: 'Próg dezercji', value: progDezercji != null ? `${Math.round(Number(progDezercji) * 100)}% HP` : '' },
    { label: 'Morale bazowe', value: extra(unit, 'Morale bazowe') },
    { label: 'Morale ucieczki', value: extra(unit, 'Morale ucieczki') },
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
  const techName = text(unit.Tech);
  // T10 LINKOWANIE-KRZYZOWE: `unit.Tech` niesie nazwę technologii, ale bywa placeholderem
  // "-"/"—" (brak wymogu) LUB (potwierdzone reconem na realnych danych, np. wiersz
  // `irygacja` w `terrain-improvements.json`) nazwą, która nie istnieje w `tech.json` —
  // link tylko gdy `resolveTechnologyRow` faktycznie znajdzie wiersz (nigdy nie zgadujemy).
  const techSlug = techName ? technologyIdFromName(techName) : null;
  const techRow: EntityCardRow = { label: 'Technologia', value: techName };
  if (techSlug != null && resolveTechnologyRow(techSlug) != null) {
    techRow.linkTo = { kind: 'technology', id: techSlug };
  }
  const replacesName = text(unit['W zamian za']);
  // "Zastępuje" — nazwa jednostki-poprzednika; link tylko gdy realnie istnieje w
  // `UNIT_MAP` (ten sam wzorzec zabezpieczenia co dla „Technologia" wyżej).
  const replacesSlug = replacesName ? unitToSlug(replacesName) : null;
  const replacesRow: EntityCardRow = { label: 'Zastępuje', value: replacesName };
  if (replacesSlug != null && resolveUnitRow(replacesSlug) != null) {
    replacesRow.linkTo = { kind: 'unit', id: replacesSlug };
  }
  const requirementsRows: EntityCardRow[] = [
    techRow,
    { label: 'Kultura', value: text(unit.Kultura) },
    replacesRow,
  ].filter((r) => hasValue(r.value));
  // „Kontry" — CELOWO bez `linkTo` (T10): `Cel (typ)`/`Typ atakujący` w `counters.json`
  // są kategoriami TYPU jednostki (np. "Mount", "Distance"), którymi dzieli się wiele
  // różnych jednostek naraz — nie ma tu jednoznacznego, pojedynczego `id` encji do podpięcia
  // (patrz dyspozycja T10: "NIE dodawaj linkTo tam gdzie nie ma jednoznacznego,
  // rozwiazywalnego ID"). Kontrakt `EntityCardRow.badge` niesie JEDEN badge na wiersz
  // (patrz `types.ts`), nie listę pigułek pod jednym wierszem jak dawny
  // `appendBadgeRow()`. Zamiast rozszerzać `types.ts`/`renderer.ts` (poza allowlistą T4),
  // kontry trafiają jako pojedynczy wiersz z wartościami połączonymi przecinkiem —
  // treść identyczna (te same pary cel/bonus), układ inny (delta świadoma, wzorem
  // precedensu T3 „treść równoważna, nie identyczny HTML").
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
    sections: [characteristicsSection, combatSection, economySection, requirementsSection, statusesSection],
    civpediaLink: null,
    statusBadges: isSuperUnit ? ['Super-jednostka'] : undefined,
  };
};
