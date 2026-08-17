/**
 * P-AI-BRAK-POJECIA-MGLY-Q1 — trwała pamięć celów AI.
 *
 * Pamięć przechowuje wyłącznie ostatnią znaną pozycję celu. Nie jest dowodem
 * widoczności i nie może być używana do egzekucji ataku.
 */

export type AiTargetKind = 'unit' | 'city';

export interface AiTargetMemoryEntry {
  targetId: string;
  targetOwnerId: number;
  kind: AiTargetKind;
  q: number;
  r: number;
}

export type AiTargetMemoryByOwner = Map<number, Map<string, AiTargetMemoryEntry>>;

export interface AiFogTarget {
  id: string;
  ownerId: number;
  q: number;
  r: number;
}

function memoryKey(kind: AiTargetKind, targetId: string): string {
  return `${kind}:${targetId}`;
}

/** Aktualizuje pamięć tylko celami, których heks jest w bieżącej widoczności AI. */
export function rememberVisibleAiTargets(
  memory: AiTargetMemoryByOwner,
  ownerId: number,
  visibleHexes: ReadonlySet<string>,
  units: readonly AiFogTarget[],
  cities: readonly AiFogTarget[],
  keyOf: (q: number, r: number) => string,
): void {
  let ownerMemory = memory.get(ownerId);
  if (ownerMemory === undefined) {
    ownerMemory = new Map();
    memory.set(ownerId, ownerMemory);
  }
  const targetGroups: Array<[AiTargetKind, readonly AiFogTarget[]]> = [
    ['unit', units],
    ['city', cities],
  ];
  for (const [kind, targets] of targetGroups) {
    for (const target of targets) {
      if (target.ownerId === ownerId || !visibleHexes.has(keyOf(target.q, target.r))) continue;
      ownerMemory.set(memoryKey(kind, target.id), {
        targetId: target.id,
        targetOwnerId: target.ownerId,
        kind,
        q: target.q,
        r: target.r,
      });
    }
  }
}

/** Zwraca pamięć do planowania; nigdy nie jest używana jako lista celów ataku. */
export function rememberedAiTargets(
  memory: AiTargetMemoryByOwner | undefined,
  ownerId: number,
): AiTargetMemoryEntry[] {
  return Array.from(memory?.get(ownerId)?.values() ?? [], entry => ({ ...entry }));
}

/** Serializacja Map do plain JSON. */
export function snapshotAiTargetMemory(memory: AiTargetMemoryByOwner): Array<[number, AiTargetMemoryEntry[]]> {
  return Array.from(memory.entries(), ([ownerId, entries]) => [
    ownerId,
    Array.from(entries.values(), entry => ({ ...entry })),
  ]);
}

/** Wsteczna migracja: brak pola lub wadliwe wpisy daje pustą pamięć. */
export function restoreAiTargetMemory(
  raw: unknown,
): AiTargetMemoryByOwner {
  const restored: AiTargetMemoryByOwner = new Map();
  if (!Array.isArray(raw)) return restored;
  for (const item of raw) {
    if (!Array.isArray(item) || typeof item[0] !== 'number' || !Array.isArray(item[1])) continue;
    const entries = new Map<string, AiTargetMemoryEntry>();
    for (const candidate of item[1]) {
      if (
        candidate === null
        || typeof candidate !== 'object'
        || !('targetId' in candidate)
        || !('targetOwnerId' in candidate)
        || !('kind' in candidate)
        || !('q' in candidate)
        || !('r' in candidate)
      ) continue;
      const entry = candidate as AiTargetMemoryEntry;
      if (
        typeof entry.targetId !== 'string'
        || typeof entry.targetOwnerId !== 'number'
        || (entry.kind !== 'unit' && entry.kind !== 'city')
        || !Number.isFinite(entry.q)
        || !Number.isFinite(entry.r)
      ) continue;
      entries.set(memoryKey(entry.kind, entry.targetId), { ...entry });
    }
    if (entries.size > 0) restored.set(item[0], entries);
  }
  return restored;
}
