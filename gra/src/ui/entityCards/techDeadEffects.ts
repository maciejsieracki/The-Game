/**
 * R-WEB-CITYPANEL-TECH-TILE-DEAD-EFFECTS-Q1 — WSPÓLNY filtr efektów martwych dla odblokowań
 * technologii. Używa go karta odkrycia (`technologyAdapter.ts`, `techDiscoveryNotice.ts`) oraz
 * kafelek „Technologie” w karcie budynku (`cityPanel.ts::appendTechDetailBlock`), żeby oba
 * miejsca ukrywały TE SAME efekty martwe bez dwóch kopii listy.
 *
 * Źródła (bez duplikowania danych):
 *   - `ukryte` z `data/tech-cards-top5.json` (per technologia; Q3/Q4 właściciela),
 *   - reguła budynków martwych: `suppressed` albo `epokaWejscia` > grywalna epoka
 *     (`production.ts:966` blokuje budynki z wyższej epoki).
 */
import buildingsData from '../../../data/buildings.json';
import techCardsTop5Data from '../../../data/tech-cards-top5.json';

/** Kamień=1, Brąz=2, Żelazo=3 (improvement-tech.ts EPOKA_LABEL). */
export const MAX_GRYWALNA_EPOKA = 3;

/** Budynek martwy dziś: `suppressed` (np. Teatr) albo epoka wyższa niż grywalna (Wielka odlewnia, Wielka Kuźnia). */
export function isDeadTechCardBuilding(b: { suppressed?: unknown; epokaWejscia?: unknown }): boolean {
  const epoka = typeof b.epokaWejscia === 'number' ? b.epokaWejscia : 1;
  return b.suppressed === true || epoka > MAX_GRYWALNA_EPOKA;
}

type TechCardsEntry = { ukryte?: string[] } | undefined;
const TECH_CARDS = techCardsTop5Data as unknown as Record<string, TechCardsEntry>;

/** Nazwy efektów martwych ukryte dla danej technologii (`ukryte` z `tech-cards-top5.json`). */
export function hiddenTechEffectNames(techName: string | null | undefined): ReadonlySet<string> {
  if (!techName || techName.startsWith('_')) return new Set<string>();
  return new Set(TECH_CARDS[techName]?.ukryte ?? []);
}

let deadBuildingNamesCache: readonly string[] | null = null;

/** Nazwy (`nazwa` ?? `id`) wszystkich budynków martwych wg reguły powyżej. */
export function deadBuildingNames(): readonly string[] {
  if (deadBuildingNamesCache === null) {
    deadBuildingNamesCache = (buildingsData as unknown as {
      id: string; nazwa?: string; suppressed?: unknown; epokaWejscia?: unknown;
    }[])
      .filter((b) => isDeadTechCardBuilding(b))
      .map((b) => b.nazwa ?? b.id);
  }
  return deadBuildingNamesCache;
}

/**
 * Filtruje tekst wiersza kafelka/karty odkrycia: dzieli po „;" i wycina człony, w których
 * wystąpił efekt martwy (ukryty dla tej technologii albo budynek martwy). Zwraca `null`, gdy
 * nic legalnego nie zostaje — wiersz się wtedy nie renderuje (jak pusta wartość w danych).
 * Np. „Akademia; Teatr” → „Akademia”; „Akademia = … (nauka++); Teatr = … (kultura++)” →
 * „Akademia = … (nauka++)”.
 */
export function filterDeadEffectText(text: string | null | undefined, techName: string | null | undefined): string | null {
  if (text == null) return null;
  const raw = String(text).trim();
  if (raw === '') return null;
  const dead = [...hiddenTechEffectNames(techName), ...deadBuildingNames()].filter((n) => n.length > 0);
  const kept = raw.split(';')
    .map((p) => p.trim())
    .filter((p) => p !== '' && !dead.some((n) => p.includes(n)));
  return kept.length > 0 ? kept.join('; ') : null;
}
