/**
 * Upgrade budynków — kanon Maciej 2026-07-05 (UPG-LOC/PROD/BONUS, ABC-20…24).
 */

import { mnoznikRoleForBuildingId, cumulativeMnoznikForBuildingId } from './unit-building-bonuses';

export type BuildingUpgradeLite = {
  id: string;
  nazwa: string;
  upgradeFrom?: string;
  suppressed?: boolean;
  baza?: Record<string, number>;
  przyrost?: Record<string, number>;
};

/**
 * Jedno źródło prawdy: flaga `suppressed` w danych (`gra/data/buildings.json`).
 * ABC-21 B: Teatr ma `suppressed: true` (wchodzi w merge Akademia — nie
 * pokazuj w produkcji). Wcześniej był tu zdublowany hardkodowany
 * `Set(['teatr'])` obok tej samej flagi w danych — usunięty (2026-07-25).
 */
export function isBuildingSuppressedFromProduction(building: {
  id: string;
  suppressed?: boolean;
}): boolean {
  return building.suppressed === true;
}

/** Łańcuch upgrade: [najstarszy … aktualny]. */
export function upgradeChainSteps(
  buildingId: string,
  buildings: readonly BuildingUpgradeLite[],
): BuildingUpgradeLite[] {
  const byId = new Map(buildings.map(b => [b.id, b]));
  const chain: BuildingUpgradeLite[] = [];
  let cur = byId.get(buildingId);
  while (cur) {
    chain.unshift(cur);
    const from = (cur.upgradeFrom ?? '').trim();
    cur = from ? byId.get(from) : undefined;
  }
  return chain;
}

/** Etykieta kolejki produkcji (UPG-PROD A). */
export function upgradeProductionDisplayName(
  target: BuildingUpgradeLite,
  buildings: readonly BuildingUpgradeLite[],
): string {
  const from = (target.upgradeFrom ?? '').trim();
  if (!from) return target.nazwa;
  const prev = buildings.find(b => b.id === from);
  return `Rozbuduj ${prev?.nazwa ?? from} → ${target.nazwa}`;
}

const STAT_KEYS = [
  'praca', 'pieniadz', 'zywnosc', 'nauka', 'kultura', 'zadowolenie', 'obrona',
] as const;

function statLine(label: string, baza: number, przyrost: number): string | null {
  if (baza === 0 && przyrost === 0) return null;
  const parts: string[] = [];
  if (baza !== 0) parts.push(String(baza));
  if (przyrost !== 0) parts.push(`+${przyrost}/poz`);
  return `${label} ${parts.join(' ')}`;
}

/** Wiersze tooltip / panel składu bonusów (UPG-BONUS A+C). */
export function upgradeCompositionLines(
  buildingId: string,
  buildings: readonly BuildingUpgradeLite[],
): string[] {
  const chain = upgradeChainSteps(buildingId, buildings);
  if (chain.length <= 1) return [];
  const names = chain.map(c => c.nazwa).join(' → ');
  return [
    `Łańcuch: ${names}`,
    'Bonusy w silniku = suma poprzednich poziomów (zapisane w JSON tego budynku).',
  ];
}

/**
 * Statystyki końcowe z definicji (panel ↗).
 * `buildings` -- pełna lista budynków (data.buildings), potrzebna do policzenia
 * skumulowanego % łańcucha upgradeFrom (decyzja właściciela 2026-07-25, druga
 * tura: następca ma pokazywać sumę własnego % i % poprzedników, nie sam
 * surowy `baza.mnoznik`). Opcjonalna dla wstecznej zgodności wywołań, które
 * nie mają dostępu do pełnej listy -- wtedy pokazujemy tylko własny %.
 */
export function buildingStatSummaryLines(
  def: BuildingUpgradeLite,
  buildings?: readonly BuildingUpgradeLite[],
): string[] {
  const lines: string[] = [];
  for (const k of STAT_KEYS) {
    const b = def.baza?.[k] ?? 0;
    const p = def.przyrost?.[k] ?? 0;
    const line = statLine(k, b, p);
    if (line) lines.push(line);
  }
  // Sciezki ulepszen jednostek (2026-07-25): `mnoznik` NIE jest juz zwykla
  // staty ekonomiczna miasta (Step 5 usuniety z economy.ts) -- to trwaly bonus
  // bojowy jednostek. Pokazujemy go tu z PRAWDZIWA etykieta (Pancerz/Parametry)
  // TYLKO dla 6 rozpoznanych budynkow; dla reszty (mnoznik dawniej dolaczany
  // do Pracy, dzis calkowicie martwy) NIE pokazujemy nic -- zero fałszywych
  // obietnic w panelu "Statystyki (silnik)" (audyt: to byla najbardziej
  // myląca etykieta w kodzie). Wartosc jest SKUMULOWANA (wlasny % + cala
  // sciezka poprzednikow upgradeFrom) -- Akademia wojskowa pokazuje +40%, nie +20%.
  const role = mnoznikRoleForBuildingId(def.id);
  if (role) {
    const cumulative = buildings ? cumulativeMnoznikForBuildingId(def.id, buildings) : (def.baza?.['mnoznik'] ?? 0);
    if (cumulative !== 0) {
      const label = role === 'pancerz' ? 'Pancerz (jednostki)' : 'Parametry poza Pancerzem (jednostki)';
      lines.push(`${label} +${cumulative}%`);
    }
  }
  return lines;
}

/** Biblioteka lub Akademia (merge ABC-21). */
export function cityHasBibliotekaLine(builtIds: readonly string[]): boolean {
  return builtIds.includes('biblioteka') || builtIds.includes('akademia');
}

/** Teatr lub Akademia (kultura / amfiteatr). */
export function cityHasAmfiteatrLine(builtIds: readonly string[]): boolean {
  return builtIds.includes('teatr') || builtIds.includes('akademia');
}

/** Mury lub Cytadela (fort). */
export function cityHasMurLine(builtIds: readonly string[]): boolean {
  return builtIds.includes('mury') || builtIds.includes('fort');
}

/** Pałac I / II / III (łańcuch upgrade B-PALAC-TIER). */
export function cityHasPalacLine(builtIds: readonly string[]): boolean {
  return builtIds.includes('palac')
    || builtIds.includes('palac_ii')
    || builtIds.includes('palac_iii');
}

/**
 * Który tier Pałacu stoi w mieście — dla Prawa rosnącego z tierem
 * (B-PALAC-TIER-PRAWO, decyzja Macieja 2026-07-25, Pytanie 27=A).
 * Jeśli w danych miasta znalazłoby się kilka wpisów pałacowych naraz
 * (nie powinno się zdarzyć w normalnym łańcuchu upgrade), liczy się
 * NAJWYŻSZY tier — nigdy suma. `null` = brak Pałacu w mieście.
 */
export function cityPalacTier(builtIds: readonly string[]): 1 | 2 | 3 | null {
  if (builtIds.includes('palac_iii')) return 3;
  if (builtIds.includes('palac_ii')) return 2;
  if (builtIds.includes('palac')) return 1;
  return null;
}

// ---------------------------------------------------------------------------
// GRUPY-BUDYNKOW (decyzja Macieja 2026-07-25): panel „Budynki w mieście"
// grupuje 38 typów budynków w osiem grup dziedzinowych zamiast płaskiej listy.
// Przypisanie budynek→grupa jest DANYMI (pole `grupa` w buildings.json /
// BuildingDef, data/loader.ts) — kolejny budynek dostaje grupę w JSON, bez
// zmiany UI. Kolejność grup poniżej to WYŁĄCZNIE porządek wyświetlania
// (prezentacja), nie dane gry.
// ---------------------------------------------------------------------------

/** Osiem grup dziedzinowych panelu miasta, w kolejności wyświetlania. */
export const BUILDING_GROUP_ORDER = [
  'Prawo i administracja',
  'Wojsko i obrona',
  'Handel i pieniądz',
  'Nauka i kultura',
  'Wiara',
  'Zdrowie',
  'Produkcja surowców',
  'Żywność',
] as const;

export type BuildingGroupName = typeof BUILDING_GROUP_ORDER[number];

/** Grupa „koszyk" dla budynków, którym brakuje pola `grupa` w danych (nie powinno się zdarzyć — patrz tools/grupy-budynkow-test.cjs). */
export const BUILDING_GROUP_FALLBACK = 'Inne';

export type BuildingGroupLite = { id: string; grupa?: string | null };

export interface BuildingGroupBucket {
  grupa: string;
  /** Puste = miasto nie ma jeszcze żadnego budynku z tej grupy (grupa nadal ma być widoczna, patrz WYMAGANIA TWARDE #3). */
  ids: string[];
}

/**
 * Grupuje zbudowane budynki miasta (`builtIds`, kolejność zachowana wewnątrz
 * grupy) wg pola `grupa` z definicji, w stałej kolejności `BUILDING_GROUP_ORDER`
 * — każda z ośmiu grup zawsze obecna w wyniku (nawet pusta), żeby UI mogło
 * pokazać "grupa istnieje, ale jeszcze bez budynków" zamiast ją pomijać.
 * Budynek bez rozpoznanej grupy trafia do koszyka `BUILDING_GROUP_FALLBACK`
 * (dopisywanego na końcu) — sygnał błędu danych, nie oczekiwany w praniu.
 */
export function groupBuiltBuildingIds(
  builtIds: readonly string[],
  buildings: readonly BuildingGroupLite[],
): BuildingGroupBucket[] {
  const byId = new Map(buildings.map(b => [b.id, b] as const));
  const buckets = new Map<string, string[]>();
  for (const g of BUILDING_GROUP_ORDER) buckets.set(g, []);
  for (const id of builtIds) {
    const raw = byId.get(id)?.grupa;
    const g = typeof raw === 'string' && raw.trim().length > 0 ? raw.trim() : BUILDING_GROUP_FALLBACK;
    if (!buckets.has(g)) buckets.set(g, []);
    buckets.get(g)!.push(id);
  }
  return Array.from(buckets.entries()).map(([grupa, ids]) => ({ grupa, ids }));
}
