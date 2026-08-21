/**
 * entityCards/technologyAdapter.ts — `RawTech` (`tech.json`) → `EntityCardData` (T3).
 *
 * Treść wypełniona 1:1 wg dzisiejszego `techDiscoveryNotice.ts::buildBody`
 * (linie ~338-444 w wersji sprzed T3 — Budynki, Jednostki, Ulepszenia terenu,
 * Kolejne technologie, Zmiany ekonomiczne, „Co możesz teraz zrobić", Wymagania),
 * przeportowana na kontrakt T1b (`collapsible`/`openDefault`/`highlighted` dla
 * akordeonu, `icon`/`trailing`/`badge` per wiersz, `previewLimit` +
 * `compactHeaderOnExpand` dla paginacji jednostek, `layout: 'pills'` dla Wymagań).
 *
 * Adapter jest samodzielny (jak `buildingAdapter.ts`/`unitAdapter.ts`/
 * `improvementAdapter.ts`) — czyta `buildings.json`/`units.json`/
 * `terrain-improvements.json`/`tech.json` bezpośrednio, nie importuje z
 * `techDiscoveryNotice.ts` (uniknięcie zależności w drugą stronę; ten plik jest
 * już i tak importowany PRZEZ `techDiscoveryNotice.ts`).
 *
 * Nagłówek karty (kicker/status/epoka/poziom/kamień milowy, zależne od
 * `opts.kind`/`opts.eraIndex` przekazywanych do `showTechDiscoveryNotice`, NIE
 * od samych danych technologii) zostaje budowany w `techDiscoveryNotice.ts` —
 * ten adapter dostarcza tylko treść niezależną od trybu otwarcia karty
 * (sekcje + domyślny `subtitle`/medalion), tak jak pozostałe trzy adaptery.
 */
import buildingsData from '../../../data/buildings.json';
import unitsData from '../../../data/units.json';
import terrainImprovementsData from '../../../data/terrain-improvements.json';
import techData from '../../../data/tech.json';
import { techIconSvg } from '../techIcons';
import { buildingIconSvg, unitIconSvg, improvementIconSvg } from '../icons/brandAssets';
import type { RawTech } from './registry';
import { technologyIdFromName } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="16" text-anchor="middle" font-size="11" fill="currentColor">T</text></svg>';

/** Ile jednostek pokazać domyślnie w sekcji „Jednostki" przed „Pokaż pozostałe N"
 * — ta sama wartość co `UNIT_PREVIEW` w `techDiscoveryNotice.ts` (dziś przypięta
 * regexem `technology-discovery-card-visual-test.cjs`, `const UNIT_PREVIEW = 3`). */
const UNIT_PREVIEW = 3;

type BuildingRow = {
  id: string;
  nazwa?: string;
  techUnlock?: string | null;
  baza?: Record<string, number>;
  przyrost?: Record<string, number>;
  uwagi?: string;
  kategoria?: string;
  wymagania?: string | null;
  utrzymanie?: number | null;
};

type UnitRow = {
  Jednostka: string;
  Tech?: string | null;
  'Rola (linia)'?: string | null;
  Typ?: string | null;
  'Super-jednostka'?: string | null;
};

function list(raw: string | null | undefined): string[] {
  return (raw ?? '').split(/[;,+]/).map((x) => x.trim())
    .filter((x) => x !== '' && x !== '-' && x !== '—');
}

function buildingEffectText(building: BuildingRow): string {
  const effects: string[] = [];
  for (const [key, value] of Object.entries(building.przyrost ?? {})) {
    if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
  }
  if (effects.length === 0) {
    for (const [key, value] of Object.entries(building.baza ?? {})) {
      if (value) effects.push(`${key} ${value > 0 ? '+' : ''}${value}`);
    }
  }
  return effects.join(', ');
}

/** Mapa nazwa gracza → `ImprovementKey`, odtworzona z `terrain-improvements.json`
 * (klucz obiektu = `ImprovementKey`, pole `nazwa` = etykieta gracza) — ten sam
 * wzorzec co `IMPROVEMENT_NAME_TO_KEY` w `techDiscoveryNotice.ts` (Bug B,
 * R-TECH-ULEPSZENIA-TERENU-SYNC-Q1). Fallback na samą nazwę dla nierozpoznanych
 * etykiet — `improvementIconSvg` i tak spada na `_default` (imp-farm). */
const IMPROVEMENT_NAME_TO_KEY: Record<string, string> = (() => {
  const map: Record<string, string> = {};
  for (const [key, row] of Object.entries(terrainImprovementsData as Record<string, { nazwa?: string }>)) {
    if (key.startsWith('_')) continue;
    const nazwa = row?.nazwa;
    if (typeof nazwa === 'string' && nazwa) map[nazwa] = key;
  }
  return map;
})();

const ALL_TECHS = (techData as unknown as { technologie: RawTech[] }).technologie;

export const technologyAdapter: EntityCardAdapter<RawTech> = (tech) => {
  const buildings = (buildingsData as BuildingRow[]).filter((b) => b.techUnlock === tech['Technologia']);
  const units = (unitsData as UnitRow[]).filter((u) => u.Tech === tech['Technologia']);
  const nextTechRows = ALL_TECHS.filter((t) => list(t['Wymaga (prereq)']).includes(tech['Technologia']));
  const improvementNames = list(tech['Odblokowuje ulepszenie terenu']);
  const resourceUnlocked = tech['Odblokowuje surowiec.'] || null;
  const requirements = list(tech['Wymaga (prereq)']);
  const epokaLabel = tech['Epoka'] ? (tech['Epoka'] === 'Kamień' ? 'Kamienia' : tech['Epoka']) : null;

  // --- „Co możesz teraz zrobić" — PIERWSZA sekcja, przed Budynkami (odstępstwo świadome,
  // patrz nagłówek `techDiscoveryNotice.ts` pkt 2: szablony wypełnione realnymi nazwami). ---
  const actionRows: EntityCardRow[] = [];
  if (resourceUnlocked) {
    actionRows.push({
      label: 'Możesz teraz', value: `Sprawdź dostęp do surowca: ${resourceUnlocked}.`,
      badge: { kind: 'ok', label: 'Możesz teraz' },
    });
  }
  const buildingNames = buildings.map((b) => b.nazwa ?? b.id);
  if (buildingNames.length > 0) {
    actionRows.push({
      label: 'Najpierw spełnij', value: `Zbuduj ${buildingNames.join(' lub ')}, jeśli spełniasz ich wymagania.`,
      badge: { kind: 'warn', label: 'Najpierw spełnij' },
    });
  }
  if (improvementNames.length > 0) {
    actionRows.push({
      label: 'Najpierw spełnij', value: `Przygotuj ${improvementNames.join(', ')} na odpowiednim złożu.`,
      badge: { kind: 'warn', label: 'Najpierw spełnij' },
    });
  }
  if (nextTechRows.length > 0) {
    actionRows.push({
      label: 'Możesz teraz', value: 'Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.',
      badge: { kind: 'ok', label: 'Możesz teraz' },
    });
  }
  if (actionRows.length > 0) {
    actionRows.push({
      label: 'Nie oznacza',
      value: 'Odkrycie nie buduje automatycznie budynków ani ulepszeń i nie dodaje zapasu surowców.',
      badge: { kind: 'muted', label: 'Nie oznacza' },
    });
  }
  const actionsSection: EntityCardSection = {
    key: 'actions', title: 'Co możesz teraz zrobić', rows: actionRows,
    collapsible: true, openDefault: true, highlighted: true,
  };

  // --- Budynki ---------------------------------------------------------------------------
  const buildingsRows: EntityCardRow[] = buildings.map((b) => ({
    label: b.nazwa ?? b.id,
    value: [epokaLabel ? `Epoka ${epokaLabel}` : null, b.wymagania ?? (buildingEffectText(b) || null)]
      .filter((x): x is string => !!x).join(' · '),
    icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
  }));
  const buildingsSection: EntityCardSection = {
    key: 'buildings', title: 'Budynki', rows: buildingsRows, collapsible: true, openDefault: true,
  };

  // --- Jednostki (paginacja: previewLimit=UNIT_PREVIEW, sprzężone z compactHeaderOnExpand) ---
  const unitsRows: EntityCardRow[] = units.map((u) => ({
    label: u.Jednostka,
    value: '',
    trailing: u['Rola (linia)'] ?? u.Typ ?? undefined,
    icon: { kind: 'svg', svg: unitIconSvg(undefined, u.Jednostka) },
  }));
  const unitsSection: EntityCardSection = {
    key: 'units', title: 'Jednostki', rows: unitsRows, collapsible: true, openDefault: true,
    previewLimit: unitsRows.length > UNIT_PREVIEW ? UNIT_PREVIEW : undefined,
  };
  // UWAGA (delta świadoma, T3): `renderer.ts` (poza allowlistą tego kroku) generuje
  // przycisk jako „Pokaż pozostałe N" — bez polskiej odmiany rzeczownika po liczbie
  // (`jednostkę/jednostki/jednostek`), którą miał oryginalny `unitsBody` w
  // `techDiscoveryNotice.ts` (`pluralPl()`). Kontrakt T1b nie niesie miejsca na
  // rzeczownik per sekcja — to jest treściowo równoważne (ta sama liczba, ten sam
  // mechanizm ujawniania), ale mniej precyzyjne językowo niż dzisiejszy tekst.

  // --- Ulepszenia terenu -------------------------------------------------------------------
  const improvementsRows: EntityCardRow[] = improvementNames.map((name) => ({
    label: name, value: '',
    icon: { kind: 'svg', svg: improvementIconSvg(IMPROVEMENT_NAME_TO_KEY[name] ?? name) },
  }));
  const improvementsSection: EntityCardSection = {
    key: 'improvements', title: 'Ulepszenia terenu', rows: improvementsRows,
    collapsible: true, openDefault: false,
  };

  // --- Kolejne technologie -------------------------------------------------------------------
  const nextTechsRows: EntityCardRow[] = nextTechRows.map((t) => {
    const otherPrereqs = list(t['Wymaga (prereq)']).filter((name) => name !== tech['Technologia']);
    if (otherPrereqs.length === 0) {
      return { label: 'Możesz badać', value: t['Technologia'], badge: { kind: 'ok', label: 'Możesz badać' } };
    }
    const icon = techIconSvg(t['Technologia'], 14);
    return {
      label: t['Technologia'], value: `Wymaga też: ${otherPrereqs.join(', ')}`,
      icon: icon ? { kind: 'svg', svg: icon } : undefined,
    };
  });
  const nextTechsSection: EntityCardSection = {
    key: 'next', title: 'Kolejne technologie', rows: nextTechsRows, collapsible: true, openDefault: true,
  };

  // --- Zmiany ekonomiczne --------------------------------------------------------------------
  const econRows: EntityCardRow[] = [];
  for (const b of buildings) {
    const effect = buildingEffectText(b);
    if (effect) {
      econRows.push({
        label: b.nazwa ?? b.id, value: effect,
        icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
      });
    }
    if (b.utrzymanie != null) {
      econRows.push({
        label: `${b.nazwa ?? b.id} — utrzymanie`, value: `${b.utrzymanie} złota na turę`,
        icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
      });
    }
  }
  if (resourceUnlocked) {
    econRows.push({ label: 'Dostęp do surowca', value: resourceUnlocked });
  }
  const econSection: EntityCardSection = {
    key: 'econ', title: 'Zmiany ekonomiczne', rows: econRows, collapsible: true, openDefault: false,
  };

  // --- Wymagania (pigułki z checkmarkiem, layout='pills') -------------------------------------
  const requirementsSection: EntityCardSection = {
    key: 'requirements', title: 'Wymagania', layout: 'pills',
    rows: requirements.map((r) => ({ label: r, value: '' })),
    badges: requirements.length > 0 ? [`${requirements.length} · spełnione`] : undefined,
  };

  const anyContent = actionRows.length > 0 || buildingsRows.length > 0 || unitsRows.length > 0
    || improvementsRows.length > 0 || nextTechsRows.length > 0 || econRows.length > 0
    || requirements.length > 0;
  const emptySection: EntityCardSection = {
    key: 'empty', title: 'Informacja',
    rows: anyContent ? [] : [{ label: '', value: 'Ta technologia nie odblokowuje bezpośrednio nowych elementów.' }],
  };

  const iconSvg = techIconSvg(tech['Technologia'], 28) ?? PLACEHOLDER_ICON_SVG;

  return {
    kind: 'technology',
    id: technologyIdFromName(tech['Technologia']),
    title: tech['Technologia'],
    subtitle: tech['Epoka'] ? `Epoka ${tech['Epoka']}` : undefined,
    medallion: { kind: 'icon', svg: iconSvg },
    sections: [
      actionsSection, buildingsSection, unitsSection, improvementsSection,
      nextTechsSection, econSection, requirementsSection, emptySection,
    ],
    civpediaLink: null,
    // Paginacja jednostek (previewLimit) sprzęga się z kompaktowym nagłówkiem karty —
    // wzorem `tdn-card--compact`/`wireInteractions()` w `techDiscoveryNotice.ts` (T1b).
    compactHeaderOnExpand: true,
  };
};
