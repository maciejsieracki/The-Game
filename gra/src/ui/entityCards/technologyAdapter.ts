/**
 * entityCards/technologyAdapter.ts — `RawTech` (`tech.json`) → `EntityCardData` (T3).
 *
 * Treść wypełniona 1:1 wg dzisiejszego `techDiscoveryNotice.ts::buildBody`
 * (linie ~338-444 w wersji sprzed T3 — Budynki, Jednostki, Ulepszenia terenu,
 * Kolejne technologie, Zmiany ekonomiczne, „Co możesz teraz zrobić", Wymagania),
 * przeportowana na kontrakt T1b (`collapsible`/`openDefault`/`highlighted` dla
 * akordeonu, `icon`/`trailing`/`badge` per wiersz,
 * `layout: 'pills'` dla Wymagań). Sekcja Jednostki NIE ustawia `previewLimit` —
 * pokazuje zawsze wszystkie jednostki od razu
 * (P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1).
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
 *
 * Kolejność `sections` (P-KARTA-PRZEBUDOWA-UKLAD-TECH-Q1, `00-dispatch.md`): Wymagania →
 * Charakterystyka (NOWA — Koszt nauki/Epoka/Poziom/Surowiec-wymóg) → [Rys historyczny,
 * wstawiany przez `renderer.ts::renderEntityCard` na NIETKNIĘTYM, stałym indeksie 2] →
 * Co możesz teraz zrobić → Budynki → Jednostki → Ulepszenia terenu → Kolejne technologie
 * (4 sekcje odblokowań, ABC Q1 właściciela: NIE scalać, tylko przenieść) → Zmiany
 * ekonomiczne → (pusta, gdy brak odblokowań). Wzajemna kolejność tej ostatniej piątki
 * zostaje jak przed tym tematem — tylko przesunięta niżej, za miejsce wstawienia historii.
 *
 * R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1 (etap 1 kart odkryć): Wymagania → Charakterystyka →
 * [Rys historyczny] → Top 5 korzyści (NOWA, indeks 2) → Co możesz teraz zrobić (CZYNNOŚĆ →
 * KORZYŚĆ z `data/tech-cards-top5.json`, bez wiersza „Nie oznacza”) → Budynki → Jednostki →
 * Ulepszenia terenu (z `terrain-improvements.json`) → Cuda (NOWA) → Kolejne technologie →
 * Zmiany ekonomiczne. Efekty martwe (Teatr, Wielka odlewnia, Wielka Kuźnia, …) są ukryte.
 */
import buildingsData from '../../../data/buildings.json';
import unitsData from '../../../data/units.json';
import terrainImprovementsData from '../../../data/terrain-improvements.json';
import techData from '../../../data/tech.json';
import techCardsTop5Data from '../../../data/tech-cards-top5.json';
import wondersData from '../../../data/wonders.json';
import civsData from '../../../data/civs.json';
import { terrainUnlockLabelsForTech } from '../../game/improvement-tech';
import { techIconSvg } from '../techIcons';
import { buildingIconSvg, unitIconSvg, improvementIconSvg } from '../icons/brandAssets';
import { naukaCostSuffix } from '../naukaLabel';
import { humanizeId, nazwaCywilizacji, nazwaWyswietlana, nazwyZListyId } from '../../game/text-names';
import { hiddenTechEffectNames, isDeadTechCardBuilding } from './techDeadEffects';
import type { RawTech } from './registry';
import { resolveBuildingRow, resolveUnitRow, resolveWonderRow, technologyIdFromName, unitToSlug } from './registry';
import type { EntityCardAdapter, EntityCardRow, EntityCardSection } from './types';

const PLACEHOLDER_ICON_SVG =
  '<svg viewBox="0 0 24 24" width="34" height="34" aria-hidden="true">' +
  '<polygon points="12,2 22,12 12,22 2,12" fill="currentColor" opacity=".15"/>' +
  '<text x="12" y="16" text-anchor="middle" font-size="11" fill="currentColor">T</text></svg>';

// P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1: sekcja „Jednostki" karty
// technologii pokazuje ZAWSZE wszystkie jednostki od razu (bez paginacji
// `previewLimit`/„Pokaż pozostałe N"). Usunięty tu lokalny `UNIT_PREVIEW` NIE
// jest tym samym co `UNIT_PREVIEW` w `techDiscoveryNotice.ts` (popup odkrycia
// technologii) — ten drugi zostaje NIETKNIĘTY, poza zakresem tego tematu.

// --- R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1: treść kart odkryć z `data/tech-cards-top5.json`
// (generator `tools/gen-tech-cards-top5.cjs` z `odkrycia-top5.csv`, FC 58339997b). ----------
/** Pozycja „Top 5 korzyści” — decyzja właściciela Q1: tytuł z liczbą + jedno zdanie. */
export interface TechTop5Item { tytul: string; liczba?: string; zdanie: string; dowod?: string }
/** „Co możesz teraz zrobić” — schemat CZYNNOŚĆ → KORZYŚĆ (decyzja właściciela Q6). */
export interface TechCmzItem { czynnosc: string; korzysc: string }
/** `ukryte` — nazwy efektów martwych/niedostępnych ukrytych z karty (decyzja Q3/Q4). */
export interface TechCardContent { top5: TechTop5Item[]; cmz: TechCmzItem[]; ukryte: string[] }

const TECH_CARD_CONTENT = techCardsTop5Data as unknown as Record<string, TechCardContent | undefined>;

/** Treść karty odkrycia albo `undefined`, gdy odkrycie nie ma wpisu (fallback adaptera). */
export function techCardContentOf(techName: string): TechCardContent | undefined {
  if (techName.startsWith('_')) return undefined;
  return TECH_CARD_CONTENT[techName];
}

/** Jedno zdanie „Co możesz teraz zrobić”: „[CZYNNOŚĆ], aby [KORZYŚĆ].” (ANALIZA §4 pkt 7). */
export function cmzSentence(item: TechCmzItem): string {
  return `${item.czynnosc}, aby ${item.korzysc}.`;
}

// R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1: reguła efektów martwych (`isDeadTechCardBuilding`,
// `hiddenTechEffectNames`) żyje we WSPÓLNYM module `techDeadEffects.ts` (re-eksport dla
// dotychczasowych importerów, np. techDiscoveryNotice.ts).
export { isDeadTechCardBuilding } from './techDeadEffects';

type BuildingRow = {
  id: string;
  nazwa?: string;
  techUnlock?: string | null;
  suppressed?: boolean;
  epokaWejscia?: number;
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
    if (value) effects.push(`${nazwaWyswietlana(key)} ${value > 0 ? '+' : ''}${value}`);
  }
  if (effects.length === 0) {
    for (const [key, value] of Object.entries(building.baza ?? {})) {
      if (value) effects.push(`${nazwaWyswietlana(key)} ${value > 0 ? '+' : ''}${value}`);
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

/** `Historia` (capitalizowane, konwencja `tech.json` — zgodna z istniejącym
 * `Uwagi`/`Technologia`) — pole NIE jest jeszcze zadeklarowane w `RawTech` (dodadzą
 * je dopiero batche treści, T-KARTY-HISTORIA-INFRA-Q1 to wyłącznie infrastruktura),
 * więc czytamy je bezpiecznie spoza typowanego kształtu. Zwraca `undefined` (nie
 * pusty string) gdy pole brakuje lub jest puste. */
function historicalNoteOf(tech: RawTech): string | undefined {
  const v = (tech as unknown as Record<string, unknown>)['Historia'];
  const t = typeof v === 'string' ? v.trim() : '';
  return t !== '' ? t : undefined;
}

/** `Dostęp do surowca.` (kropka w nazwie pola z `tech.json` — konwencja tego pliku,
 * patrz analogiczne `Odblokowuje surowiec.`) — pole NIE jest zadeklarowane w `RawTech`
 * (`registry.ts` poza allowlistą tego tematu, patrz `00-dispatch.md`), więc czytamy je
 * bezpiecznie spoza typowanego kształtu, tym samym wzorcem co `historicalNoteOf` wyżej.
 * To jest surowiec WYMAGANY do zbadania tej technologii (np. „Dostęp do drewna" dla
 * „Łucznictwo") — inne pole niż `Odblokowuje surowiec.` (surowiec, który technologia
 * ODBLOKOWUJE, już czytany niżej jako `resourceUnlocked`); brak duplikacji treści. */
function resourceAccessOf(tech: RawTech): string | undefined {
  const v = (tech as unknown as Record<string, unknown>)['Dostęp do surowca.'];
  const t = typeof v === 'string' ? v.trim() : '';
  return t !== '' ? t : undefined;
}

type WonderRowLite = { id: string; nazwa?: string; dostep?: string; cywilizacje?: string[]; techUnlock?: string[] };
const ALL_WONDERS = (wondersData as unknown as { cuda: WonderRowLite[] }).cuda;
const CIV_NAME_BY_ID: Record<string, string> = Object.fromEntries(
  (civsData as unknown as { cywilizacje: { ikonaId?: string; Cywilizacja?: string }[] }).cywilizacje
    .filter((c) => c.ikonaId && c.Cywilizacja)
    .map((c) => [c.ikonaId as string, c.Cywilizacja as string]),
);

/** Budynek martwy dziś (Q3/Q4 właściciela — ukryć do czasu naprawy): `suppressed` (np. Teatr)
 * albo `epokaWejscia` powyżej grywalnej epoki (Wielka odlewnia, Wielka Kuźnia). */
function isDeadBuilding(b: BuildingRow): boolean {
  return isDeadTechCardBuilding(b);
}

/** Cuda odblokowywane przez technologię — Q6 (założenie Operatora): sekcja „Cuda” z oznaczeniem
 * cudu narodowego (dostęp E — tylko wskazane cywilizacje) albo wyścigowego (dostęp R); oba
 * typy mają `maxNaSwiecie = 1`, więc dopisek „maks. 1 na świecie” jest zawsze prawdziwy. */
function wonderTrailing(w: WonderRowLite, techName: string): string {
  const parts: string[] = [];
  if (w.dostep === 'R') parts.push('Wyścig wszystkich państw, maks. 1 na świecie');
  else {
    const civs = (w.cywilizacje ?? []).map((id) => CIV_NAME_BY_ID[id] ?? nazwaCywilizacji(id));
    parts.push(`Cud narodowy: ${civs.join(', ')} · maks. 1 na świecie`);
  }
  const other = (w.techUnlock ?? []).filter((t) => t !== techName);
  if (other.length > 0) parts.push(`wymaga też: ${other.join(', ')}`);
  return parts.join(' · ');
}

export const technologyAdapter: EntityCardAdapter<RawTech> = (tech) => {
  const techName = tech['Technologia'];
  const content = techCardContentOf(techName);
  const hidden = hiddenTechEffectNames(techName);
  // Q3/Q4 właściciela: efekty martwe UKRYTE we wszystkich sekcjach odblokowań (bez napisu
  // „niedostępne”). Źródła: `ukryte` z danych + ta sama reguła budynków co w generatorze.
  const buildings = (buildingsData as BuildingRow[]).filter((b) => b.techUnlock === techName
    && !isDeadBuilding(b) && !hidden.has(b.nazwa ?? b.id));
  const units = (unitsData as UnitRow[]).filter((u) => u.Tech === techName && !hidden.has(u.Jednostka));
  const nextTechRows = ALL_TECHS.filter((t) => list(t['Wymaga (prereq)']).includes(techName)
    && !hidden.has(t['Technologia']));
  // Q5 (założenie Operatora): ulepszenia terenu ze ŹRÓDŁA PRAWDY bramki gry
  // (`terrain-improvements.json` przez `improvement-tech.ts::terrainUnlockLabelsForTech`), nie z
  // opisowego pola `tech.json` — dopisuje Kopalnie miedzi/cyny/żelaza i Stadninę.
  const improvementNames = terrainUnlockLabelsForTech(techName).filter((n) => !hidden.has(n));
  const wonders = ALL_WONDERS.filter((w) => (w.techUnlock ?? []).includes(techName) && !hidden.has(w.nazwa ?? w.id));
  const resourceUnlocked = nazwyZListyId(tech['Odblokowuje surowiec.']) || null;
  const requirements = list(tech['Wymaga (prereq)']);

  // --- „Top 5 korzyści” (R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1) — wstawiana na indeks 2 tablicy
  // `sections`, więc `renderer.ts::renderEntityCard` (HISTORIA_SECTION_INDEX = 2, NIETKNIĘTY)
  // stawia Rys historyczny tuż PRZED nią: Top 5 jest zawsze bezpośrednio po Rysie (Q5
  // właściciela). Format pozycji: tytuł z liczbą + jedno zdanie (Q1), tylko realne pozycje (Q2)
  // — layout `top3` renderera numeruje dowolną liczbę pozycji (1–5).
  const top5Rows: EntityCardRow[] = (content?.top5 ?? []).slice(0, 5)
    .map((item) => ({ label: item.tytul, value: item.zdanie }));
  const top5Section: EntityCardSection = {
    key: 'top5', title: 'Top 5 korzyści', rows: top5Rows, layout: 'top3',
  };

  // --- „Co możesz teraz zrobić" — CZYNNOŚĆ → KORZYŚĆ z danych (Q6 właściciela). Wiersz
  // „Nie oznacza” usunięty (Q3, założenie Operatora). Fallback na dawne szablony TYLKO gdy
  // odkrycie nie ma wpisu w `tech-cards-top5.json` (test pilnuje, że dziś: 0/32). ---
  const actionRows: EntityCardRow[] = [];
  if (content) {
    for (const item of content.cmz) actionRows.push({ label: '', value: cmzSentence(item) });
  } else {
    actionRows.push(...legacyActionRows(resourceUnlocked, buildings, improvementNames, nextTechRows.length));
  }
  const actionsSection: EntityCardSection = {
    key: 'actions', title: 'Co możesz teraz zrobić', rows: actionRows,
    collapsible: true, openDefault: true, highlighted: true,
    layout: content ? 'prose' : undefined,
  };

  // --- Budynki ---------------------------------------------------------------------------
  // T10 LINKOWANIE-KRZYZOWE: `b.id` pochodzi wprost z `buildingsData` (ten sam plik co
  // `resolveBuildingRow`), więc jest ZAWSZE kanonicznym, rozwiązywalnym id budynku —
  // weryfikacja przez `resolveBuildingRow` mimo to (spójny wzorzec zabezpieczenia z
  // resztą tego zadania, nie zakładamy cichej niezmienności między plikami danych).
  const buildingsRows: EntityCardRow[] = buildings.map((b) => {
    const linkTo = resolveBuildingRow(b.id) != null ? ({ kind: 'building', id: b.id } as const) : undefined;
    return {
      label: b.nazwa ?? humanizeId(b.id),
      // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 (GOAL 1): tekst "Szczegóły →" ZNIKA, a
      // przyciskiem staje się SAMA NAZWA budynku (`label`) — dokładnie tak, jak od początku
      // wyglądała pigułka Wymagań (`button.entity-card-pill-text`), którą właściciel wskazał
      // jako jedyny poprawnie zrobiony wiersz. To odwrócenie R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A,
      // które ujednoliciło te wiersze do OSOBNEGO przycisku akcji po prawej — właściciel
      // prosił o coś innego: "brązowienie powinno być przyciskiem [...] otoczone ramką".
      value: '',
      icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
      linkTo,
      linkAnchor: 'label',
    };
  });
  const buildingsSection: EntityCardSection = {
    key: 'buildings', title: 'Budynki', rows: buildingsRows, collapsible: true, openDefault: true,
  };

  // --- Jednostki (bez paginacji — zawsze wszystkie, P-CIVPEDIA-KARTA-JEDNOSTKI-POKAZ-POZOSTALE-N-Q1) ---
  const unitsRows: EntityCardRow[] = units.map((u) => {
    const slug = unitToSlug(u.Jednostka);
    const linkTo = resolveUnitRow(slug) != null ? ({ kind: 'unit', id: slug } as const) : undefined;
    return {
      label: u.Jednostka,
      // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1: patrz komentarz przy buildingsRows wyżej.
      value: '',
      icon: { kind: 'svg', svg: unitIconSvg(undefined, u.Jednostka) },
      linkTo,
      linkAnchor: 'label',
    };
  });
  const unitsSection: EntityCardSection = {
    key: 'units', title: 'Jednostki', rows: unitsRows, collapsible: true, openDefault: true,
  };

  // --- Ulepszenia terenu -------------------------------------------------------------------
  const improvementsRows: EntityCardRow[] = improvementNames.map((name) => {
    const key = IMPROVEMENT_NAME_TO_KEY[name];
    return {
      label: name, value: '',
      icon: { kind: 'svg', svg: improvementIconSvg(key ?? name) },
      // Link tylko gdy nazwa realnie odtworzyła się do klucza `terrain-improvements.json`
      // (`IMPROVEMENT_NAME_TO_KEY`) — bez tego nie mamy jednoznacznego `id` ulepszenia.
      linkTo: key != null ? { kind: 'improvement', id: key } : undefined,
      // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 (GOAL 1): przyciskiem jest nazwa ulepszenia.
      linkAnchor: 'label',
    };
  });
  const improvementsSection: EntityCardSection = {
    key: 'improvements', title: 'Ulepszenia terenu', rows: improvementsRows,
    collapsible: true, openDefault: true,
  };

  // --- Cuda (Q6, założenie Operatora: TAK, z oznaczeniem narodowy/wyścig, maks. 1 na świecie) ---
  const wondersRows: EntityCardRow[] = wonders.map((w) => ({
    label: w.nazwa ?? humanizeId(w.id), value: '', trailing: wonderTrailing(w, techName),
    linkTo: resolveWonderRow(w.id) != null ? ({ kind: 'wonder', id: w.id } as const) : undefined,
    linkAnchor: 'label',
  }));
  const wondersSection: EntityCardSection = {
    key: 'wonders', title: 'Cuda', rows: wondersRows, collapsible: true, openDefault: true,
  };

  // --- Kolejne technologie -------------------------------------------------------------------
  const nextTechsRows: EntityCardRow[] = nextTechRows.map((t) => {
    const otherPrereqs = list(t['Wymaga (prereq)']).filter((name) => name !== tech['Technologia']);
    const nextSlug = technologyIdFromName(t['Technologia']);
    if (otherPrereqs.length === 0) {
      return {
        label: 'Możesz badać', value: t['Technologia'], badge: { kind: 'ok', label: 'Możesz badać' },
        linkTo: { kind: 'technology', id: nextSlug },
      };
    }
    const icon = techIconSvg(t['Technologia'], 14);
    // P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1 (GOAL pkt 3, opcja (a) — właściciel:
    // "te przyciski po prawej stronie nie są potrzebne"): `value` NIE niesie już tekstu
    // "Wymaga też: X, Y" — ten tekst wymienia INNE technologie niż `linkTo` (cel wiersza
    // to `t['Technologia']`, np. "Wymiana"), więc jako jedyny klikalny element sugerował
    // fałszywy cel. Info zostaje (nie zubaża karty) jako `trailing` — zwykły, NIEinteraktywny
    // `<span>` (renderer.ts `buildGridRowEl`, linia `if (row.trailing) ...`), a `label`
    // (nazwa technologii docelowej) jest teraz głównym, w pełni klikalnym elementem
    // dzięki rozszerzonemu fallbackowi `entity-card-row--linked` na całym wierszu.
    // R-CIVPEDIA-KARTY-SPOJNOSC-Q1-A: `trailing` (info "Wymaga też: ...") zostaje
    // nietknięty (nie jest celem linku, patrz komentarz wyżej) — `value` dostaje ten sam
    // widoczny przycisk-link co pozostałe trzy typy wierszy w tym zgłoszeniu.
    return {
      label: t['Technologia'], value: '', trailing: `Wymaga też: ${otherPrereqs.join(', ')}`,
      icon: icon ? { kind: 'svg', svg: icon } : undefined,
      linkTo: { kind: 'technology', id: nextSlug },
      // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1 (GOAL 1): przyciskiem jest nazwa technologii
      // docelowej (`label`), a nie osobne "Szczegóły →". `trailing` ("Wymaga też: ...")
      // zostaje NIEtknięty — wymienia INNE technologie niż cel wiersza, więc jest adnotacją,
      // nie przyciskiem (granica dispatchu).
      linkAnchor: 'label',
    };
  });
  const nextTechsSection: EntityCardSection = {
    key: 'next', title: 'Kolejne technologie', rows: nextTechsRows, collapsible: true, openDefault: true,
  };

  // --- Zmiany ekonomiczne --------------------------------------------------------------------
  // P-CIVPEDIA-KARTY-CALY-WIERSZ-PRZYCISKIEM-Q1 (GOAL pkt 4): `value` tutaj (efekt budynku /
  // koszt utrzymania) opisuje WŁASNY budynek wiersza, nie inną encję — inaczej niż "Kolejne
  // technologie" (pkt 3), gdzie `value` wymieniał INNE technologie niż cel linku. Bug zgłoszony
  // przez recon dla tej sekcji był wyłącznie strukturalny (klik działał tylko na wąskim
  // przycisku `value`, klik na `label`/nazwę budynku nic nie robił) — naprawiony już
  // uniwersalnie w `renderer.ts::buildGridRowEl` (fallback `entity-card-row--linked` na całym
  // wierszu, bez warunku `value===''`). Żadna zmiana treści `value` tutaj nie jest więc
  // potrzebna — przenoszenie tego tekstu do `trailing` tylko zubożyłoby kartę wizualnie
  // (opacity .7, mniejsza czcionka) bez żadnej korzyści funkcjonalnej.
  const econRows: EntityCardRow[] = [];
  for (const b of buildings) {
    const buildingLinkTo = resolveBuildingRow(b.id) != null
      ? ({ kind: 'building', id: b.id } as const) : undefined;
    const effect = buildingEffectText(b);
    if (effect) {
      econRows.push({
        label: b.nazwa ?? humanizeId(b.id), value: effect,
        icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
        linkTo: buildingLinkTo,
        // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1: pudełko przycisku MUSI trafić na nazwę
        // budynku (`label`), nie na `value` — `value` to tu efekt ("+2 nauki"), czyli opis
        // wiersza, nie nazwa encji, którą otwiera klik.
        linkAnchor: 'label',
      });
    }
    if (b.utrzymanie != null) {
      econRows.push({
        label: `${b.nazwa ?? humanizeId(b.id)} — utrzymanie`, value: `${b.utrzymanie} złota na turę`,
        icon: { kind: 'svg', svg: buildingIconSvg(undefined, b.id) },
        linkTo: buildingLinkTo,
        // P-CIVPEDIA-KARTY-NAZWA-PRZYCISKIEM-Q1: jw. — `value` to kwota utrzymania.
        linkAnchor: 'label',
      });
    }
  }
  if (resourceUnlocked) {
    econRows.push({ label: 'Dostęp do surowca', value: resourceUnlocked });
  }
  const econSection: EntityCardSection = {
    key: 'econ', title: 'Zmiany ekonomiczne', rows: econRows, collapsible: true, openDefault: true,
  };

  // --- Wymagania (pigułki z checkmarkiem, layout='pills') — sections[0] wg nowego układu
  // (P-KARTA-PRZEBUDOWA-UKLAD-TECH-Q1, 00-dispatch.md GOAL pkt 1). ---------------------------
  const requirementsSection: EntityCardSection = {
    key: 'requirements', title: 'Wymagania', layout: 'pills',
    rows: requirements.map((r) => {
      const reqSlug = technologyIdFromName(r);
      return { label: r, value: '', linkTo: { kind: 'technology', id: reqSlug } as const };
    }),
    badges: requirements.length > 0 ? [`${requirements.length} · spełnione`] : undefined,
  };

  // --- Charakterystyka (NOWA, P-KARTA-PRZEBUDOWA-UKLAD-TECH-Q1 GOAL pkt 2) — sections[1],
  // zaraz po Wymaganiach i zaraz PRZED miejscem wstawienia Rysu historycznego przez
  // `renderer.ts::renderEntityCard` (`HISTORIA_SECTION_INDEX = 2`, NIETKNIĘTY w tym temacie).
  // Styl analogiczny do `buildingAdapter.ts`/`unitAdapter.ts` (`characteristics` key, prosta
  // lista `label`/`value`, wiersz pominięty gdy brak danych — zero wymyślonej treści).
  // ŚWIADOMIE bez „Dostęp do surowca" pod tą etykietą — ten tekst już istnieje w `econSection`
  // (`resourceUnlocked`, linia niżej w tym samym pliku), ale opisuje INNE pole (`Odblokowuje
  // surowiec.` — co ta technologia DAJE), podczas gdy tu chodzi o `Dostęp do surowca.` — co
  // ta technologia WYMAGA do zbadania (patrz `resourceAccessOf` wyżej). Etykieta „Surowiec
  // (wymóg badania)" żeby uniknąć wizualnej duplikacji z „Dostęp do surowca" w Zmianach
  // ekonomicznych mimo wspólnego rdzenia słownego. -------------------------------------------
  const resourceAccess = resourceAccessOf(tech);
  const charRows: EntityCardRow[] = [
    { label: 'Koszt nauki', value: `${tech['Koszt nauki']}${naukaCostSuffix()}` },
    tech['Epoka'] ? { label: 'Epoka', value: tech['Epoka'] } : null,
    tech['Poziom'] != null ? { label: 'Poziom', value: String(tech['Poziom']) } : null,
    resourceAccess ? { label: 'Surowiec (wymóg badania)', value: nazwyZListyId(resourceAccess) } : null,
  ].filter((r): r is EntityCardRow => r != null);
  const characteristicsSection: EntityCardSection = {
    key: 'characteristics', title: 'Charakterystyka', rows: charRows,
  };

  const anyContent = top5Rows.length > 0 || actionRows.length > 0 || buildingsRows.length > 0
    || unitsRows.length > 0 || improvementsRows.length > 0 || wondersRows.length > 0
    || nextTechsRows.length > 0 || econRows.length > 0 || requirements.length > 0;
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
    // P-KARTA-PRZEBUDOWA-UKLAD-TECH-Q1 (00-dispatch.md GOAL): sections[0]=Wymagania,
    // sections[1]=Charakterystyka — `renderer.ts::renderEntityCard` wstawia Rys historyczny
    // na STAŁYM, NIETKNIĘTYM indeksie 2, więc ląduje dokładnie „zaraz po Charakterystyce"
    // (odpowiednik „zaraz po Opisie" dla budynku/jednostki). Reszta (4 osobne sekcje
    // odblokowań, Q1 właściciela: NIE scalać) i Zmiany ekonomiczne zostają w niezmienionej
    // WZAJEMNEJ kolejności, tylko przesunięte niżej za miejsce wstawienia historii.
    // R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1: `top5Section` na INDEKSIE 2 = pierwsza sekcja po
    // Rysie historycznym (renderer wstawia Rys PRZED indeksem 2); „Cuda” (Q6) między
    // Ulepszeniami terenu a Kolejnymi technologiami (ANALIZA-KART-ODKRYC §7).
    sections: [
      requirementsSection, characteristicsSection, top5Section, actionsSection, buildingsSection,
      unitsSection, improvementsSection, wondersSection, nextTechsSection, econSection, emptySection,
    ],
    // P-ENTITYCARD-CIVPEDIA-KLIK-MARTWY-Q1 — uzasadnienie jak w `unitAdapter.ts`.
    // Folder = katalog `docs/encyklopedia/technologie/`.
    civpediaLink: { folder: 'technologie', slug: technologyIdFromName(tech['Technologia']) },
    historicalNote: historicalNoteOf(tech),
  };
};

/** Dawne szablony „Co możesz teraz zrobić” — WYŁĄCZNIE fallback dla odkrycia BEZ wpisu w
 * `tech-cards-top5.json` (dziś 0/32 — pilnuje `tools/tech-cards-top5-test.cjs`). Wiersz
 * „Nie oznacza” usunięty globalnie (Q3, założenie Operatora R-WEB-TECH-CARDS-TOP5-IMPLEMENT-Q1). */
function legacyActionRows(
  resourceUnlocked: string | null, buildings: BuildingRow[], improvementNames: string[], nextTechCount: number,
): EntityCardRow[] {
  const actionRows: EntityCardRow[] = [];
  if (resourceUnlocked) {
    actionRows.push({
      label: 'Możesz teraz', value: `Sprawdź dostęp do surowca: ${resourceUnlocked}.`,
      badge: { kind: 'ok', label: 'Możesz teraz' },
    });
  }
  const buildingNames = buildings.map((b) => b.nazwa ?? humanizeId(b.id));
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
  if (nextTechCount > 0) {
    actionRows.push({
      label: 'Możesz teraz', value: 'Wybierz dalszy kierunek badań, jeśli pozostałe wymagania są spełnione.',
      badge: { kind: 'ok', label: 'Możesz teraz' },
    });
  }
  return actionRows;
}
