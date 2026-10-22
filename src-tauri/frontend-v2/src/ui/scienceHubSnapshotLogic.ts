/**
 * scienceHubSnapshotLogic.ts — czysta logika listy „Możesz wybrać" (hub badań).
 * Bez DOM/SVG; testowalna z Node (science-hub-test.cjs).
 */

export interface HubTechNode {
  id: string;
  nazwa: string;
  epoka: string;
  koszt: number;
  prereqIds: string[];
}

export interface HubEntryDraft {
  id: string;
  name: string;
  epoka: string;
  koszt: number;
  locked: boolean;
  isTarget: boolean;
}

/** Normalizuje id tech (nazwa kanoniczna lub slug) do slugu węzła drzewka. */
export function normalizeTechSlug(
  raw: string,
  slugify: (name: string) => string,
  techById: ReadonlyMap<string, HubTechNode>,
): string {
  const trimmed = (raw ?? '').trim();
  if (trimmed === '') return '';
  if (techById.has(trimmed)) return trimmed;
  const slug = slugify(trimmed);
  if (techById.has(slug)) return slug;
  for (const [id, node] of techById) {
    if (node.nazwa === trimmed) return id;
  }
  return slug;
}

export function normalizeSlugSet(
  ids: readonly string[],
  slugify: (name: string) => string,
  techById: ReadonlyMap<string, HubTechNode>,
): Set<string> {
  const out = new Set<string>();
  for (const raw of ids) {
    const slug = normalizeTechSlug(raw, slugify, techById);
    if (slug !== '') out.add(slug);
  }
  return out;
}

const EPOCH_ORDER: readonly string[] = ['Kamień', 'Brąz', 'Żelazo'];

/** Epoka widoczna w hubie: epoka aktywnego celu (gdy jest), inaczej epoka gracza. */
export function hubEpochLabel(
  playerEra: number | undefined,
  targetSlug: string | null,
  techById: ReadonlyMap<string, HubTechNode>,
  slugify: (name: string) => string,
): string | null {
  if (targetSlug) {
    const norm = normalizeTechSlug(targetSlug, slugify, techById);
    const targetNode = techById.get(norm);
    if (targetNode) return targetNode.epoka;
  }
  if (playerEra === undefined) return null;
  const idx = Math.max(0, Math.min(EPOCH_ORDER.length - 1, Math.round(playerEra) - 1));
  return EPOCH_ORDER[idx] ?? 'Kamień';
}

/**
 * Buduje wpisy sidebara: wszystkie pickable tech z silnika w bieżącej epoce +
 * podgląd do 4 zablokowanych.
 */
export function buildHubTechEntries(input: {
  techById: ReadonlyMap<string, HubTechNode>;
  slugify: (name: string) => string;
  researchedRaw: readonly string[];
  availableRaw: readonly string[];
  targetSlug: string | null;
  playerEra: number | undefined;
  costFor: (baseKoszt: number, epoka?: string) => number;
}): HubEntryDraft[] {
  const {
    techById, slugify, researchedRaw, availableRaw, targetSlug, playerEra, costFor,
  } = input;

  const researched = normalizeSlugSet(researchedRaw, slugify, techById);
  const available = normalizeSlugSet(availableRaw, slugify, techById);
  const targetNorm = targetSlug ? normalizeTechSlug(targetSlug, slugify, techById) : null;
  if (targetNorm && !researched.has(targetNorm)) available.add(targetNorm);

  const eraLabel = hubEpochLabel(playerEra, targetNorm, techById, slugify);
  const eraNodes = eraLabel === null
    ? [...techById.values()]
    : [...techById.values()].filter(n => n.epoka === eraLabel);

  const entries: HubEntryDraft[] = [];
  const added = new Set<string>();
  let lockedCount = 0;

  // Primary: każdy pickable slug z silnika w tej epoce (nie polegamy na kolejności eraNodes).
  for (const slug of available) {
    const node = techById.get(slug);
    if (!node || researched.has(slug)) continue;
    if (eraLabel !== null && node.epoka !== eraLabel) continue;
    if (added.has(slug)) continue;
    added.add(slug);
    entries.push({
      id: node.id,
      name: node.nazwa,
      epoka: node.epoka,
      koszt: costFor(node.koszt, node.epoka),
      locked: false,
      isTarget: slug === targetNorm,
    });
  }

  // Podgląd zablokowanych (max 4) z tej samej epoki.
  for (const node of eraNodes) {
    if (researched.has(node.id) || added.has(node.id)) continue;
    if (lockedCount >= 4) break;
    added.add(node.id);
    entries.push({
      id: node.id,
      name: node.nazwa,
      epoka: node.epoka,
      koszt: costFor(node.koszt, node.epoka),
      locked: true,
      isTarget: false,
    });
    lockedCount++;
  }

  entries.sort((a, b) => {
    if (a.locked !== b.locked) return a.locked ? 1 : -1;
    return a.name.localeCompare(b.name, 'pl');
  });

  return entries;
}
