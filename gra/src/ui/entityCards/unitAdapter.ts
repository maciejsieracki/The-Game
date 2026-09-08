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

/** `Opis`/`Top3` (P-KARTA-PRZEBUDOWA-UKLAD-Q1) — pola NIE istnieją jeszcze w `UnitDef`
 * (batche treści dopiszą je osobno, ten temat jest wyłącznie strukturalny — patrz
 * `00-dispatch.md` GOAL). Czytamy bezpiecznie spoza typowanego kształtu, wzorem `extra()`
 * wyżej. Zwraca `[]` gdy dane brakują — sekcja renderuje się wtedy pusta (renderer pomija
 * puste sekcje), zero wymyślonej treści. */
interface Top3Entry { tytul?: unknown; tekst?: unknown }

function top3Of(unit: UnitDef): EntityCardRow[] {
  const raw = (unit as unknown as Record<string, unknown>).Top3;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (typeof item === 'string') return { label: text(item), value: '' };
      const o = (item ?? {}) as Top3Entry;
      return { label: text(o.tytul), value: text(o.tekst) };
    })
    .filter((r) => r.label !== '' || r.value !== '');
}

export const unitAdapter: EntityCardAdapter<UnitDef> = (unit) => {
  const isSuperUnit = unit['Super-jednostka'] === 'TAK';
  const category = categoryOf(
    text(unit.Jednostka),
    text(unit['Rola (linia)']),
    isSuperUnit,
    unit.Typ,
  );

  // ============================================================================================
  // P-KARTA-PRZEBUDOWA-UKLAD-Q1 — układ zaakceptowany przez właściciela 2026-09-08 (patrz
  // `00-dispatch.md`): Nagłówek → Wymagania → Opis → [Rys historyczny, wspólny punkt
  // pozycjonowania w renderer.ts, stały indeks 2] → Top 3 → Charakterystyka → Statystyki
  // podstawowe → Statystyki zaawansowane (collapsible) → Kontry → Koszt rekrutacji →
  // Utrzymanie. Sekcje „Wymagania"/„Opis" MUSZĄ zostać pierwsze dwie w `sections` (indeksy
  // 0/1) — patrz komentarz analogiczny w `buildingAdapter.ts` i w `renderer.ts`.
  // ============================================================================================

  // --- 2. WYMAGANIA — technologia / kultura / budynek rekrutujący (ZNANY BLOKER (b) z
  // dispatchu: `units.json` nie niesie dziś takiego pola dla żadnej jednostki — wiersz
  // powstaje TYLKO gdy dane je dostarczą, zero pustego/wymyślonego wiersza) -------------------
  const techName = text(unit.Tech);
  // T10 LINKOWANIE-KRZYZOWE: `unit.Tech` niesie nazwę technologii, ale bywa placeholderem
  // "-"/"—" (brak wymogu) LUB (potwierdzone reconem na realnych danych, np. wiersz
  // `irygacja` w `terrain-improvements.json`) nazwą, która nie istnieje w `tech.json` —
  // link tylko gdy `resolveTechnologyRow` faktycznie znajdzie wiersz (nigdy nie zgadujemy).
  const techSlug = techName ? technologyIdFromName(techName) : null;
  // Etykieta „Technologia" (NIE „Wymagana technologia") zachowana 1:1 wobec sprzed tego
  // tematu — inne testy (`entity-card-cross-links-nested-overlay-test.cjs`) i realne
  // karty w grze linkują po tej dokładnej etykiecie wiersza; zmiana samego słowa nie
  // była wymagana przez dispatch (konsoliduje TREŚĆ sekcji, nie nazwy wierszy).
  const techRow: EntityCardRow = { label: 'Technologia', value: techName };
  if (techSlug != null && resolveTechnologyRow(techSlug) != null) {
    techRow.linkTo = { kind: 'technology', id: techSlug };
  }
  const reqRows: EntityCardRow[] = [
    techRow,
    { label: 'Kultura', value: text(unit.Kultura) },
    { label: 'Budynek rekrutujący', value: extra(unit, 'Budynek') },
  ].filter((r) => hasValue(r.value));
  if (reqRows.length === 0) reqRows.push({ label: 'Wymagania', value: 'brak — dostępna od startu' });
  const requirementsSection: EntityCardSection = { key: 'requirements', title: 'Wymagania', rows: reqRows };

  // --- 3. OPIS — proza, slot ZAWSZE obecny na indeksie 1 (patrz komentarz nad adapterem) —
  // dopóki `Opis` nie istnieje w danych (dziś: 0/75), sekcja jest zawsze niewidoczna
  // (renderer pomija pustą sekcję), zero wymyślonej treści. -----------------------------------
  const opis = extra(unit, 'Opis');
  const descriptionSection: EntityCardSection = {
    key: 'description', title: 'Opis',
    rows: opis ? [{ label: '', value: opis }] : [],
    layout: 'prose',
  };

  const sections: EntityCardSection[] = [requirementsSection, descriptionSection];

  // --- 5. TOP 3 — jeśli dane istnieją (dziś: 0/75, batch przyszłej fali) ---------------------
  const top3 = top3Of(unit);
  if (top3.length > 0) sections.push({ key: 'top3', title: 'Top 3', rows: top3, layout: 'top3' });

  // --- 6. CHARAKTERYSTYKA — Linia/Klasa/Typ/Zastępuje -----------------------------------------
  const replacesName = text(unit['W zamian za']);
  // "Zastępuje" — nazwa jednostki-poprzednika; link tylko gdy realnie istnieje w
  // `UNIT_MAP` (ten sam wzorzec zabezpieczenia co dla „Wymagana technologia" wyżej).
  const replacesSlug = replacesName ? unitToSlug(replacesName) : null;
  const replacesRow: EntityCardRow = { label: 'Zastępuje', value: replacesName };
  if (replacesSlug != null && resolveUnitRow(replacesSlug) != null) {
    replacesRow.linkTo = { kind: 'unit', id: replacesSlug };
  }
  const characteristicsRows: EntityCardRow[] = [
    { label: 'Linia', value: text(unit['Rola (linia)']) },
    { label: 'Klasa', value: extra(unit, 'Klasa') },
    { label: 'Typ', value: text(unit.Typ) },
    replacesRow,
  ].filter((r) => hasValue(r.value));
  sections.push({ key: 'characteristics', title: 'Charakterystyka', rows: characteristicsRows });

  // --- 7a. STATYSTYKI BOJOWE — PODSTAWOWE, zawsze widoczne ------------------------------------
  const basicRows: EntityCardRow[] = [
    { label: 'Atak', value: text(unit.Atak) },
    { label: 'Obrona', value: text(unit.Obrona) },
    { label: 'HP', value: text(unit.Health) },
    { label: 'Pancerz', value: text(unit.Pancerz) },
    { label: 'Przebicie', value: text(unit.Przebicie) },
    { label: 'Ruch', value: hasValue(unit.Ruch) ? `${text(unit.Ruch)} hex` : '' },
    { label: 'Zasięg', value: hasValue(unit['Zasięg ataku (hex)']) ? `${text(unit['Zasięg ataku (hex)'])} hex` : '' },
  ].filter((r) => hasValue(r.value));
  sections.push({ key: 'combat', title: 'Statystyki bojowe', rows: basicRows });

  // --- 7b. STATYSTYKI ZAAWANSOWANE — sekcja ROZWIJANA, domyślnie ZWINIĘTA ---------------------
  const progDezercji = unit['Próg dezercji (% health)'];
  const advancedRows: EntityCardRow[] = [
    { label: 'Atak dystansowy', value: text(unit['Atak dystansowy']) },
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
  if (advancedRows.length > 0) {
    sections.push({
      key: 'combat-advanced',
      title: `Statystyki zaawansowane (${advancedRows.length})`,
      rows: advancedRows,
      collapsible: true,
      openDefault: false,
    });
  }

  // --- 8. KONTRY — własny blok (dotąd sklejone z Wymaganiami pod tytułem „Wymagania i
  // kontry" — dwie niepowiązane treści pod jednym tytułem, dispatch każe je rozdzielić).
  // CELOWO bez `linkTo` (T10, bez zmian): `Cel (typ)`/`Typ atakujący` w `counters.json` są
  // kategoriami TYPU jednostki, nie pojedynczą, rozwiązywalną encją. ---------------------------
  const counters = collectCounters(unit);
  if (counters.length > 0) {
    sections.push({
      key: 'counters',
      title: 'Kontry (bonusy przeciw typom)',
      rows: counters.map((c) => ({ label: c, value: '' })),
      layout: 'pills',
    });
  }

  // --- 9. KOSZTY — DWIE osobne pod-sekcje: „Koszt rekrutacji" i „Utrzymanie" (dotąd jedna
  // sekcja „Koszty i utrzymanie" mieszała jednorazowy wydatek z co-turowym) -------------------
  const recruitRows: EntityCardRow[] = [
    { label: 'Koszt Pieniądza', value: text(unit['Pieniądz (koszt)']) },
    {
      label: 'Koszt surowca',
      value: hasValue(unit.Surowiec) ? `${text(unit.Surowiec)} × ${text(unit['Surowiec (ilość)'])}` : '',
    },
    { label: 'Ludność', value: text(unit.Ludność) },
  ].filter((r) => hasValue(r.value));
  sections.push({ key: 'cost-recruit', title: 'Koszt rekrutacji', rows: recruitRows });

  const upkeepRows: EntityCardRow[] = [
    { label: 'Utrzymanie Pieniądza/turę', value: text(unit['Utrzymanie (Pieniądz/turę)']) },
    {
      label: 'Utrzymanie surowca/turę',
      value: hasValue(unit['Utrzymanie surowiec'])
        ? `${text(unit['Utrzymanie surowiec'])} × ${text(unit['Utrzymanie surowiec (ilość)'])}` : '',
    },
    { label: 'Żywność/turę', value: text(unit['żywność/turę']) },
  ].filter((r) => hasValue(r.value));
  sections.push({ key: 'cost-upkeep', title: 'Utrzymanie', rows: upkeepRows });

  // --- Statusy — część niezależna od `options.statusLines` (dopełniane w unitInfoCard.ts).
  // Sekcja MUSI zostać (klucz `statuses`) — `unitInfoCard.ts:86` mapuje po tym kluczu i
  // dopina `options.statusLines` do jej `badges`; usunięcie ucięłoby te linie po cichu. -------
  const statusesSection: EntityCardSection = {
    key: 'statuses',
    title: 'Statusy',
    rows: [],
    badges: [hasValue(unit.Tech) ? 'wymaga technologii z danych' : 'brak wymogu'],
  };
  sections.push(statusesSection);

  const iconSvg = unitInfographicSvg(unit, unit.Jednostka, 34) || PLACEHOLDER_ICON_SVG;
  const subtitle = [text(unit.Epoka), text(unit.Typ), unitInfographicLabel(category)]
    .filter(Boolean).join(' · ') || undefined;

  return {
    kind: 'unit',
    id: unitToSlug(unit.Jednostka),
    title: unit.Jednostka,
    subtitle,
    medallion: { kind: 'icon', svg: iconSvg },
    sections,
    // P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1: do tego tematu było tu `null`, więc stopka
    // z przyciskiem „Więcej informacji (Civpedia)" w ogóle NIE POWSTAWAŁA dla jednostek
    // (`renderer.ts` renderuje ją wyłącznie pod `if (data.civpediaLink)`) — defekt głębszy
    // niż „klik nie działa". Folder = katalog `docs/encyklopedia/jednostki/`; `slug` i tak
    // zostaje znormalizowany do kanonicznego `id` zapytania przez `buildEntityCardData`.
    civpediaLink: { folder: 'jednostki', slug: unitToSlug(unit.Jednostka) },
    statusBadges: isSuperUnit ? ['Super-jednostka'] : undefined,
    // `Historia` (capitalizowane, konwencja `units.json` — zgodna z `Jednostka`/
    // `Surowiec`) — pole NIE jest jeszcze zadeklarowane w `UnitDef` (dodadzą je
    // dopiero batche treści, T-KARTY-HISTORIA-INFRA-Q1 to wyłącznie infrastruktura);
    // `extra()` już bezpiecznie czyta pola spoza typowanego kształtu i zwraca ''
    // (→ undefined tu) gdy brak/puste, patrz definicja `extra()` wyżej. Pozycja na
    // karcie: WSPÓLNY punkt w renderer.ts (indeks 2 tablicy `sections`, patrz komentarz
    // tam), nie stałe miejsce zaraz pod nagłówkiem (P-KARTA-OPIS-PRZED-STATYSTYKAMI-Q1,
    // uchylona w całości przez ABC 2026-09-08).
    historicalNote: extra(unit, 'Historia') || undefined,
  };
};
