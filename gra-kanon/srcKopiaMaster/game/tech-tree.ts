/**
 * tech-tree.ts — B1-Q3 drzewko liniowe (Maciej 2026-06-28, opcja B).
 *
 * Model „liniowe”: w obrębie epoki technologie mają oś wg pola Poziom i kolejności
 * w tech.json; gałęzie równoległe (L1 bez prereq) i prereq AND pozostają —
 * dostępność badań nadal liczy research.ts (parsePrerequisites).
 *
 * Pure module — bez DOM / THREE.
 */

import {
  parsePrerequisites,
  type ResearchTechDef,
} from './research';

/** Kanon modelu drzewka z tech.json (B1-Q3). */
export const TECH_TREE_MODEL_LINEAR = 'liniowe' as const;

export type TechTreeModel = typeof TECH_TREE_MODEL_LINEAR | 'rozgałęzione';

export interface TechGraphValidation {
  ok: boolean;
  errors: string[];
}

/** Odczyt pola drzewko_model z tech.json (domyślnie liniowe po B1-Q3). */
export function readTechTreeModel(
  root: { drzewko_model?: string | null },
): TechTreeModel {
  const raw = (root.drzewko_model ?? TECH_TREE_MODEL_LINEAR).trim().toLowerCase();
  return raw === 'rozgałęzione' || raw === 'rozgalozione' ? 'rozgałęzione' : TECH_TREE_MODEL_LINEAR;
}

function techByName(techs: readonly ResearchTechDef[]): Map<string, ResearchTechDef> {
  const map = new Map<string, ResearchTechDef>();
  for (const t of techs) {
    if (t.Technologia) map.set(t.Technologia, t);
  }
  return map;
}

/** Tech w epoce posortowane liniowo: Poziom rosnąco, potem kolejność w tablicy. */
export function orderedTechsInEpoch(
  techs: readonly ResearchTechDef[],
  epoch: string,
): ResearchTechDef[] {
  const inEpoch: { t: ResearchTechDef; idx: number }[] = [];
  techs.forEach((t, idx) => {
    if ((t.Epoka ?? '').trim() === epoch) inEpoch.push({ t, idx });
  });
  inEpoch.sort((a, b) => {
    const pa = typeof a.t.Poziom === 'number' ? a.t.Poziom : 0;
    const pb = typeof b.t.Poziom === 'number' ? b.t.Poziom : 0;
    if (pa !== pb) return pa - pb;
    return a.idx - b.idx;
  });
  return inEpoch.map((x) => x.t);
}

/** Głębokość w epoke (0 = brak prereq w tej samej epoce). */
export function linearDepthInEpoch(
  techName: string,
  techs: readonly ResearchTechDef[],
): number {
  const byName = techByName(techs);
  const node = byName.get(techName);
  if (!node) return 0;
  const epoch = (node.Epoka ?? '').trim();
  const depthMap = new Map<string, number>();

  function depth(name: string): number {
    if (depthMap.has(name)) return depthMap.get(name)!;
    const t = byName.get(name);
    if (!t) {
      depthMap.set(name, 0);
      return 0;
    }
    const sameEpochPrereqs = parsePrerequisites(t['Wymaga (prereq)']).filter((p) => {
      const pr = byName.get(p);
      return pr !== undefined && (pr.Epoka ?? '').trim() === epoch;
    });
    if (sameEpochPrereqs.length === 0) {
      depthMap.set(name, 0);
      return 0;
    }
    const d = Math.max(...sameEpochPrereqs.map((p) => depth(p))) + 1;
    depthMap.set(name, d);
    return d;
  }

  return depth(techName);
}

/** Łańcuch prereq (najgłębsza gałąź) — do podglądu w panelu / hubie nauki. */
export function techPrereqChain(
  techName: string,
  techs: readonly ResearchTechDef[],
): string[] {
  const byName = techByName(techs);
  const chain: string[] = [];
  let cur = techName.trim();
  const seen = new Set<string>();

  while (cur && !seen.has(cur)) {
    seen.add(cur);
    chain.unshift(cur);
    const t = byName.get(cur);
    if (!t) break;
    const prereqs = parsePrerequisites(t['Wymaga (prereq)']);
    if (prereqs.length === 0) break;
    // B1-Q3 liniowe: śledź pierwszy prereq (główna oś); AND pozostaje w research.ts
    cur = prereqs[0]!;
  }

  return chain;
}

/** Walidacja spójności tech.json (referencje prereq, brak cykli). */
export function validateTechGraph(techs: readonly ResearchTechDef[]): TechGraphValidation {
  const byName = techByName(techs);
  const errors: string[] = [];
  const names = new Set(byName.keys());

  for (const t of techs) {
    const id = t.Technologia;
    if (!id) {
      errors.push('Wiersz bez pola Technologia');
      continue;
    }
    for (const p of parsePrerequisites(t['Wymaga (prereq)'])) {
      if (!names.has(p)) {
        errors.push(`${id}: brak prereq „${p}"`);
      }
    }
  }

  const visiting = new Set<string>();
  const done = new Set<string>();

  function dfs(name: string): boolean {
    if (done.has(name)) return true;
    if (visiting.has(name)) {
      errors.push(`Cykl prereq przy „${name}"`);
      return false;
    }
    visiting.add(name);
    const t = byName.get(name);
    if (t) {
      for (const p of parsePrerequisites(t['Wymaga (prereq)'])) {
        if (names.has(p) && !dfs(p)) return false;
      }
    }
    visiting.delete(name);
    done.add(name);
    return true;
  }

  for (const name of names) dfs(name);

  return { ok: errors.length === 0, errors };
}
