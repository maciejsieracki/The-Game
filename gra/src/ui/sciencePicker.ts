/**
 * sciencePicker.ts
 * Drzewko technologii — układ strefowy (port z Makieta-drzewko-technologii.html).
 * Gracz wybiera CEL badań klikając węzeł na SVG drzewku.
 *
 * DOM-only, DECOUPLED: dane przez haki w SciencePickerConfig; bez haka — tryb podglądu.
 * Overlay pełnoekranowy z scrollowalnym SVG drzewkiem, zamykany przez ✕ lub Esc.
 * Panel ZOSTAJE otwarty po wyborze celu — gracz widzi nowy cel podświetlony.
 *
 * LANE: src/ui/*.  Source: literalny UTF-8.
 */

import type {} from '../../data/tech.json';
import techData from '../../data/tech.json';
import { terrainUnlockLabelsForTech } from '../game/improvement-tech';
import type { TempoGry } from '../game/tech-tempo';
import { scaledResearchCost, type GameDifficulty } from '../game/difficulty-cost';
import { scienceOwlIconHtml } from './icons/scienceOwlIcon';
import { techIconSvg } from './techIcons';
import type { ScienceHubEntry, ScienceHubPlanEntry, ScienceHubProgress } from './scienceHubHud';
import { refreshScienceHubIfOpen } from './scienceHubHud';
import { buildHubTechEntries } from './scienceHubSnapshotLogic';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';

// ---------------------------------------------------------------------------
// Typy wewnętrzne (dane z tech.json)
// ---------------------------------------------------------------------------

interface RawTech {
  'Technologia': string;
  'Epoka': string;
  'Poziom': number;
  'Wymaga (prereq)': string;
  'wymagany budynek'?: string | null;
  'wymagane ulepszenie'?: string | null;
  'Odblokowuje budynek': string | null;
  'Odblokowuje surowiec.': string | null;
  'Odblokowuje ulepszenie terenu'?: string | null;
  'Koszt nauki': number;
  'Uwagi': string | null;
}

// ---------------------------------------------------------------------------
// Typy publiczne
// ---------------------------------------------------------------------------

/** Konfiguracja pickera — wstrzykiwana przez silnik. */
export interface SciencePickerConfig {
  /**
   * Hak stanu badań: silnik zwraca pułę, cel i ETA.
   * Brak haka → placeholder.
   */
  getResearchState?: (ownerId: number) => {
    pula: number;
    targetId: string | null;
    kosztCelu: number;
    postepFraction: number;
    turnsLeft: number;
  } | null;
  /**
   * Hak zbadanych technologii: silnik zwraca listę id już zbadanych.
   */
  getResearchedTechs?: (ownerId: number) => string[];
  /**
   * Hak dostępnych technologii: silnik zwraca id technologii które gracz może wybrać
   * (prereq spełnione, jeszcze nie zbadane).
   */
  getAvailableTechs?: (ownerId: number) => string[];
  /**
   * Callback po kliknięciu technologii przez gracza.
   * Panel ZOSTAJE otwarty — odśwież widok po wywołaniu.
   */
  onSelectTarget?: (techId: string) => void;
  /**
   * D1-Q1: numer epoki gracza (1=Kamień, 2=Brąz, 3=Żelazo).
   * Brak haka → pokaz wszystkie epoki (tryb podglądu).
   */
  getPlayerEra?: (ownerId: number) => number;
  /**
   * Tempo gry (szybka/standardowa/dluga) — mnoznik kosztu badan w UI drzewka.
   */
  getTempoGry?: (ownerId: number) => TempoGry;
  /**
   * Poziom trudnosci — asymetria kosztow badan (latwa/normalna/trudna).
   */
  getDifficulty?: (ownerId: number) => GameDifficulty;
  /**
   * TEMAT 10 (C-RES-Q1=C): plan badań (aktywny cel + kolejka) — węzły w planie
   * dostają widoczny numerek 1..RESEARCH_QUEUE_MAX na drzewku. Brak haka → bez numerków.
   */
  getPlan?: (ownerId: number) => ScienceHubPlanEntry[];
}

// ---------------------------------------------------------------------------
// Parsowanie tech.json → wewnętrzna mapa
// ---------------------------------------------------------------------------

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

/** T-TECH-2A: etykiety ulepszeń z kodu (terrain JSON + multi-tech); fallback z tech.json. */
function resolveTerrainUnlockLabel(techName: string, jsonField: string | null | undefined): string {
  const fromCode = terrainUnlockLabelsForTech(techName);
  if (fromCode.length > 0) return fromCode.join(', ');
  return (jsonField ?? '').trim();
}

interface TechNode {
  id: string;
  nazwa: string;
  epoka: string;
  poziom: number;
  prereqRaw: string;
  prereqIds: string[];
  wymaganyBudynek: string;
  wymaganeUlepszenie: string;
  odblokujeBudynek: string;
  odblokujeSurowiec: string;
  odblokujeUlepszenie: string;
  koszt: number;
  uwagi: string | null;
  // Layout
  zoneCol: number;
  _row: number;
  _bary: number;
  x: number;
  y: number;
}

const rawList = (techData as unknown as { technologie: RawTech[] }).technologie;

function buildNodes(): Map<string, TechNode> {
  const map = new Map<string, TechNode>();
  for (const r of rawList) {
    const id = slugify(r['Technologia']);
    map.set(id, {
      id,
      nazwa: r['Technologia'],
      epoka: r['Epoka'],
      poziom: r['Poziom'],
      prereqRaw: r['Wymaga (prereq)'],
      prereqIds: [],
      wymaganyBudynek: (r['wymagany budynek'] ?? '').trim(),
      wymaganeUlepszenie: (r['wymagane ulepszenie'] ?? '').trim(),
      odblokujeBudynek: r['Odblokowuje budynek'] ?? '',
      odblokujeSurowiec: r['Odblokowuje surowiec.'] ?? '',
      odblokujeUlepszenie: resolveTerrainUnlockLabel(r['Technologia'], r['Odblokowuje ulepszenie terenu']),
      koszt: r['Koszt nauki'],
      uwagi: r['Uwagi'],
      zoneCol: 0,
      _row: 0,
      _bary: 9999,
      x: 0,
      y: 0,
    });
  }
  // Resolve prereqs by slug
  for (const node of map.values()) {
    const raw = node.prereqRaw;
    if (!raw || raw === '—' || raw === '') {
      node.prereqIds = [];
      continue;
    }
    const parts = raw.split(/\s*\+\s*/);
    const ids: string[] = [];
    for (const part of parts) {
      const s = slugify(part.trim());
      if (map.has(s)) {
        ids.push(s);
      } else {
        // Fuzzy fallback: match first 6 chars
        const prefix = s.substring(0, Math.min(s.length, 6));
        for (const [key] of map) {
          if (key.startsWith(prefix)) {
            ids.push(key);
            break;
          }
        }
      }
    }
    node.prereqIds = ids;
  }
  return map;
}

const TECH_MAP: Map<string, TechNode> = buildNodes();

/** Slug węzła drzewka z nazwy technologii (silnik używa nazw z tech.json). */
export function techToSlug(nameOrSlug: string): string {
  const raw = (nameOrSlug ?? '').trim();
  if (raw === '') return '';
  if (TECH_MAP.has(raw)) return raw;
  const slug = slugify(raw);
  if (TECH_MAP.has(slug)) return slug;
  for (const [id, node] of TECH_MAP) {
    if (node.nazwa === raw) return id;
  }
  return slug;
}

/** Nazwa kanoniczna (Technologia) z slugu węzła — do setPlayerResearchTarget. */
export function techNameFromSlug(slug: string): string | null {
  return TECH_MAP.get(slug)?.nazwa ?? null;
}

/** Skrót odblokowań tech (hub badań). */
export function techUnlockSummary(slug: string): string {
  const node = TECH_MAP.get(slug);
  if (!node) return '';
  const parts: string[] = [];
  const bud = node.odblokujeBudynek.trim();
  if (bud) parts.push('\u{1F3DB} ' + (bud.split(',')[0]?.trim() ?? bud));
  const sur = node.odblokujeSurowiec.trim();
  if (sur) parts.push('\u{1F48E} ' + (sur.split(',')[0]?.trim() ?? sur));
  const ter = node.odblokujeUlepszenie.trim();
  if (ter) parts.push('\u{1F33E} ' + (ter.split(',')[0]?.trim() ?? ter));
  return parts.join(' \u00B7 ');
}

function prereqHint(node: TechNode): string {
  if (node.prereqIds.length === 0) return 'Wymaga wcześniejszych badań';
  const names = node.prereqIds.map(pid => TECH_MAP.get(pid)?.nazwa ?? pid);
  return 'Wymaga: ' + names.join(' + ');
}

/** Snapshot danych dla scienceHubHud (postęp + lista tech). */
export function getScienceHubSnapshot(ownerId: number): {
  progress: ScienceHubProgress | null;
  entries: ScienceHubEntry[];
} {
  const state = cfg.getResearchState?.(ownerId) ?? null;
  const targetId = state?.targetId ?? null;
  const targetSlug = targetId ? techToSlug(targetId) : null;
  const targetNode = targetSlug ? TECH_MAP.get(targetSlug) : null;

  const progress: ScienceHubProgress | null = state
    ? {
      targetName: targetNode?.nazwa ?? (targetSlug ? techNameFromSlug(targetSlug) : null),
      targetId: targetSlug,
      pula: state.pula,
      kosztCelu: state.kosztCelu,
      postepFraction: state.postepFraction,
      turnsLeft: state.turnsLeft,
    }
    : null;

  const drafts = buildHubTechEntries({
    techById: TECH_MAP,
    slugify,
    researchedRaw: cfg.getResearchedTechs?.(ownerId) ?? [],
    availableRaw: cfg.getAvailableTechs?.(ownerId) ?? [],
    targetSlug,
    playerEra: cfg.getPlayerEra?.(ownerId),
    costFor: (base) => effectiveTechCost(base, ownerId),
  });

  const entries: ScienceHubEntry[] = drafts.map(d => {
    const node = TECH_MAP.get(d.id);
    return {
      id: d.id,
      name: d.name,
      epoka: d.epoka,
      koszt: d.koszt,
      unlockLine: techUnlockSummary(d.id) || undefined,
      locked: d.locked,
      isTarget: d.isTarget,
      lockHint: d.locked && node ? prereqHint(node) : undefined,
    };
  });

  return { progress, entries };
}

// Unique epochs in order
const EPOCH_ORDER: readonly string[] = ['Kamień', 'Brąz', 'Żelazo'];

/** D1-Q1: epoka widoczna na drzewku (ukryte tech z przyszłych epok). */
function currentEpochLabel(ownerId: number): string | null {
  const era = cfg.getPlayerEra?.(ownerId);
  if (era === undefined) return null;
  const idx = Math.max(0, Math.min(EPOCH_ORDER.length - 1, Math.round(era) - 1));
  return EPOCH_ORDER[idx] ?? 'Kamień';
}

function filterNodesForEpoch(nodes: TechNode[], ownerId: number): TechNode[] {
  const ep = currentEpochLabel(ownerId);
  if (ep === null) return nodes;
  return nodes.filter(n => n.epoka === ep);
}

// ---------------------------------------------------------------------------
// Layout computation (port of makieta logic)
// ---------------------------------------------------------------------------

const NW         = 162;
const NH         = 72;
const COL_STEP   = 260;
const ROW_STEP   = 100;
const PAD_L      = 36;
const PAD_T      = 90;
const DIVIDER_GAP = 52;
const CROSS_LANE_STEP = 8;
const LANE_STEP = 6;

interface ZoneInfo {
  epoch: string;
  numCols: number;
  startX: number;
}

function computeLayout(nodes: TechNode[]): { svgW: number; svgH: number; dividers: number[]; zoneInfos: ZoneInfo[]; bottomLaneYStart: number } {
  // Build byId map
  const byId = new Map<string, TechNode>();
  for (const n of nodes) byId.set(n.id, n);

  // Assign intra-zone column = depth within zone
  // depth 0 = no prereqs in same epoch
  // depth N = max prereq depth in same epoch + 1
  const depthMap = new Map<string, number>();

  function computeDepth(id: string): number {
    if (depthMap.has(id)) return depthMap.get(id)!;
    const node = byId.get(id);
    if (!node) return 0;
    const sameEpochPrereqs = node.prereqIds.filter(pid => {
      const p = byId.get(pid);
      return p !== undefined && p.epoka === node.epoka;
    });
    if (sameEpochPrereqs.length === 0) {
      depthMap.set(id, 0);
      return 0;
    }
    const maxD = sameEpochPrereqs.length === 0
      ? 0
      : Math.max(...sameEpochPrereqs.map(pid => computeDepth(pid)));
    const d = maxD + 1;
    depthMap.set(id, d);
    return d;
  }

  for (const n of nodes) {
    n.zoneCol = computeDepth(n.id);
  }

  // Compute zone start X positions and dividers
  const activeEpochs: string[] = [];
  for (const ep of EPOCH_ORDER) {
    if (nodes.some(n => n.epoka === ep)) activeEpochs.push(ep);
  }

  const zoneInfos: ZoneInfo[] = [];
  const dividers: number[] = [];
  let curX = PAD_L;

  for (let zi = 0; zi < activeEpochs.length; zi++) {
    const ep = activeEpochs[zi];
    const epNodes = nodes.filter(n => n.epoka === ep);
    const numCols = epNodes.length === 0
      ? 1
      : Math.max(...epNodes.map(n => n.zoneCol)) + 1;
    zoneInfos.push({ epoch: ep ?? '', numCols, startX: curX });
    curX += numCols * COL_STEP;
    if (zi < activeEpochs.length - 1) {
      dividers.push(curX + Math.round(DIVIDER_GAP / 2));
      curX += DIVIDER_GAP;
    }
  }

  // Update node X positions by zone
  for (const n of nodes) {
    const zi = zoneInfos.findIndex(z => z.epoch === n.epoka);
    if (zi < 0) continue;
    const z = zoneInfos[zi];
    if (z === undefined) continue;
    n.x = z.startX + n.zoneCol * COL_STEP;
  }

  // Group by zone+col
  const groups = new Map<string, TechNode[]>();
  for (const n of nodes) {
    const key = n.epoka + '_' + n.zoneCol;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(n);
  }

  // Initial row order by array order
  for (const grp of groups.values()) {
    grp.forEach((t, i) => { t._row = i; });
  }

  // Barycenter sort (3 passes)
  for (let pass = 0; pass < 3; pass++) {
    for (const grp of groups.values()) {
      for (const t of grp) {
        const prevReqs = t.prereqIds.filter(pid => {
          const p = byId.get(pid);
          if (!p) return false;
          if (p.epoka !== t.epoka) return true;
          return p.zoneCol < t.zoneCol;
        });
        if (prevReqs.length === 0) { t._bary = 9999; continue; }
        let rowSum = 0;
        for (const pid of prevReqs) {
          const p = byId.get(pid);
          rowSum += p ? p._row : 0;
        }
        t._bary = rowSum / prevReqs.length;
      }
      grp.sort((a, b) => a._bary - b._bary);
      grp.forEach((t, i) => { t._row = i; });
    }
  }

  // Assign Y
  for (const n of nodes) {
    n.y = PAD_T + n._row * ROW_STEP;
  }

  // SVG dims
  const lastZone = zoneInfos[zoneInfos.length - 1];
  const svgW = lastZone !== undefined
    ? lastZone.startX + lastZone.numCols * COL_STEP + NW + 30
    : 800;

  let maxRows = 0;
  for (const grp of groups.values()) {
    if (grp.length > maxRows) maxRows = grp.length;
  }
  const bottomLaneYStart = PAD_T + maxRows * ROW_STEP + 20;
  const svgH = bottomLaneYStart + 80;

  return { svgW, svgH, dividers, zoneInfos, bottomLaneYStart };
}

// ---------------------------------------------------------------------------
// Edge routing (port of makieta logic)
// ---------------------------------------------------------------------------

interface RoutedEdge {
  d: string;
  color: string;
  dashArr: string | null;
  dy: number;
  dx: number;
  srcEpoka: string;
  dstEpoka: string;
}

function routeEdges(
  nodes: TechNode[],
  zoneInfos: ZoneInfo[],
  bottomLaneYStart: number,
): RoutedEdge[] {
  const byId = new Map<string, TechNode>();
  for (const n of nodes) byId.set(n.id, n);

  const edges: Array<{ src: TechNode; dst: TechNode }> = [];
  for (const t of nodes) {
    for (const pid of t.prereqIds) {
      const p = byId.get(pid);
      if (p !== undefined) edges.push({ src: p, dst: t });
    }
  }

  const gutterLaneCounts = new Map<string, number>();
  let crossLaneIdx = 0;

  return edges.map(e => {
    const { src, dst } = e;
    const sx = src.x + NW;
    const sy = src.y + NH / 2;
    const dx = dst.x;
    const dy = dst.y + NH / 2;
    const isCross = src.epoka !== dst.epoka;

    let color: string;
    let dashArr: string | null;
    let d: string;

    if (isCross) {
      color = '#c09838';
      dashArr = '5,3';
      const myLane = crossLaneIdx++;
      const bottomY = bottomLaneYStart + myLane * CROSS_LANE_STEP;

      // Find divider between src and dst zones
      const srcZoneIdx = zoneInfos.findIndex(z => z.epoch === src.epoka);
      const dstZoneIdx = zoneInfos.findIndex(z => z.epoch === dst.epoka);
      const divIdx = Math.min(srcZoneIdx, dstZoneIdx);
      const srcZ = zoneInfos[srcZoneIdx];
      const dstZ = zoneInfos[dstZoneIdx];
      const srcNumCols = srcZ !== undefined ? srcZ.numCols : 1;
      const srcStartX = srcZ !== undefined ? srcZ.startX : 0;
      const dstStartX = dstZ !== undefined ? dstZ.startX : 0;
      const dividerX = srcZoneIdx < dstZoneIdx
        ? srcStartX + srcNumCols * COL_STEP + Math.round(DIVIDER_GAP / 2)
        : dstStartX + (dstZ !== undefined ? dstZ.numCols : 1) * COL_STEP + Math.round(DIVIDER_GAP / 2);
      void divIdx;

      const entryX = dividerX + 8 + myLane * CROSS_LANE_STEP;
      d = `M ${r(sx)} ${r(sy)} H ${r(sx + 12)} V ${r(bottomY)} H ${r(entryX)} V ${r(dy)} H ${r(dx)}`;
    } else {
      // Intra-zone
      const gc = dst.zoneCol;
      const zInfo = zoneInfos.find(z => z.epoch === dst.epoka);
      const zoneStartX = zInfo !== undefined ? zInfo.startX : PAD_L;

      let gutterL: number;
      let gutterR: number;
      if (gc === 0) {
        // Should not happen (depth 0 has no intra-zone prereqs), but handle it
        gutterL = zoneStartX;
        gutterR = zoneStartX + COL_STEP;
      } else {
        gutterL = zoneStartX + (gc - 1) * COL_STEP + NW;
        gutterR = zoneStartX + gc * COL_STEP;
      }
      const gutterMid = (gutterL + gutterR) / 2;
      const laneKey = dst.epoka + '_g' + gc;
      const laneIdx2 = gutterLaneCounts.get(laneKey) ?? 0;
      gutterLaneCounts.set(laneKey, laneIdx2 + 1);
      const laneX = gutterMid + (laneIdx2 % 2 === 0 ? 1 : -1) * Math.ceil(laneIdx2 / 2) * LANE_STEP;

      if (dst.epoka === 'Kamień') {
        color = '#4a9030';
      } else if (dst.epoka === 'Brąz') {
        color = '#b07028';
      } else {
        color = '#4080c0';
      }
      dashArr = null;

      d = `M ${r(sx)} ${r(sy)} H ${r(laneX)} V ${r(dy)} H ${r(dx)}`;
    }

    return { d, color, dashArr, dy, dx, srcEpoka: src.epoka, dstEpoka: dst.epoka };
  });
}

function r(n: number): string {
  return String(Math.round(n * 10) / 10);
}

// ---------------------------------------------------------------------------
// Epoch styling
// ---------------------------------------------------------------------------

interface EpochStyle {
  bg: string;
  border: string;
  label: string;
  nodeFill: string;
  nodeStroke: string;
  glowColor: string;
}

function epochStyle(epoka: string, glass = false): EpochStyle {
  if (epoka === 'Kamień') return {
    bg: glass ? 'rgba(18,30,10,0.10)' : 'rgba(18,30,10,0.5)',
    border: glass ? 'rgba(80,140,40,0.35)' : 'rgba(80,140,40,0.18)',
    label: '#8ecf58',
    nodeFill: glass ? 'rgba(36,58,20,0.88)' : '#243a14',
    nodeStroke: '#6aaa38',
    glowColor: glass ? 'rgba(100,200,60,0.10)' : 'rgba(100,200,60,0.16)',
  };
  if (epoka === 'Brąz') return {
    bg: glass ? 'rgba(36,16,4,0.10)' : 'rgba(36,16,4,0.5)',
    border: glass ? 'rgba(180,100,20,0.35)' : 'rgba(180,100,20,0.18)',
    label: '#e8a050',
    nodeFill: glass ? 'rgba(62,32,8,0.88)' : '#3e2008',
    nodeStroke: '#d08030',
    glowColor: glass ? 'rgba(210,130,40,0.10)' : 'rgba(210,130,40,0.16)',
  };
  return {
    bg: glass ? 'rgba(10,18,36,0.10)' : 'rgba(10,18,36,0.5)',
    border: glass ? 'rgba(40,80,180,0.35)' : 'rgba(40,80,180,0.18)',
    label: '#78b8f0',
    nodeFill: glass ? 'rgba(14,30,56,0.88)' : '#0e1e38',
    nodeStroke: '#4080c0',
    glowColor: glass ? 'rgba(60,120,220,0.10)' : 'rgba(60,120,220,0.16)',
  };
}

// ---------------------------------------------------------------------------
// SVG rendering helpers
// ---------------------------------------------------------------------------

function svgAttr(attrs: Record<string, string | number>): string {
  return Object.entries(attrs).map(([k, v]) => `${k}="${v}"`).join(' ');
}

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ---------------------------------------------------------------------------
// Word-wrap helper (max 17 chars per line, max 2 lines)
// ---------------------------------------------------------------------------

function wrapText(name: string): string[] {
  const words = name.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (test.length > 17 && cur.length > 0) { lines.push(cur); cur = w; }
    else { cur = test; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 2);
}

// ---------------------------------------------------------------------------
// Build SVG string
// ---------------------------------------------------------------------------

type NodeStatus = 'researched' | 'target' | 'available' | 'locked';

function computeStatus(
  nodeId: string,
  targetId: string | null,
  researchedIds: Set<string>,
  availableIds: Set<string>,
): NodeStatus {
  if (researchedIds.has(nodeId)) return 'researched';
  if (nodeId === targetId) return 'target';
  if (availableIds.has(nodeId)) return 'available';
  return 'locked';
}

function buildSVG(
  nodes: TechNode[],
  layout: ReturnType<typeof computeLayout>,
  routedEdges: RoutedEdge[],
  targetId: string | null,
  researchedIds: Set<string>,
  availableIds: Set<string>,
  glass = false,
  planPosById: Map<string, number> = new Map(),
): string {
  const { svgW, svgH, dividers, zoneInfos, bottomLaneYStart } = layout;
  void bottomLaneYStart;

  const lines: string[] = [];

  lines.push(`<svg id="civ-sci-svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`);

  // DEFS: filters for glows
  lines.push('<defs>');
  // Base glow filter
  lines.push(`<filter id="glow-k" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="bl"/>
    <feMerge><feMergeNode in="bl"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);
  lines.push(`<filter id="glow-b" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="bl"/>
    <feMerge><feMergeNode in="bl"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);
  lines.push(`<filter id="glow-z" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="2.5" result="bl"/>
    <feMerge><feMergeNode in="bl"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);
  // Golden glow for current target
  lines.push(`<filter id="glow-target" x="-30%" y="-30%" width="160%" height="160%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="bl"/>
    <feMerge><feMergeNode in="bl"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>`);
  lines.push('</defs>');

  const textStroke = glass
    ? ' paint-order="stroke fill" stroke="rgba(0,0,0,0.72)" stroke-width="3" stroke-linejoin="round"'
    : '';

  // ZONE BACKGROUNDS
  for (let zi = 0; zi < zoneInfos.length; zi++) {
    const z = zoneInfos[zi];
    if (z === undefined) continue;
    const st = epochStyle(z.epoch, glass);
    const zoneW = z.numCols * COL_STEP + (zi < zoneInfos.length - 1 ? Math.round(DIVIDER_GAP * 0.42) : NW + 16);
    const zoneX = z.startX - 16;
    if (glass) {
      lines.push(`<rect id="civ-sci-zone-${esc(z.epoch)}" x="${r(zoneX)}" y="${r(PAD_T - 46)}" width="${r(zoneW)}" height="${r(svgH - (PAD_T - 46) - 4)}" rx="8" fill="${st.bg}" stroke="${st.border}" stroke-width="1.2" stroke-dasharray="6,4"/>`);
    } else {
      lines.push(`<rect id="civ-sci-zone-${esc(z.epoch)}" x="${r(zoneX)}" y="${r(PAD_T - 46)}" width="${r(zoneW)}" height="${r(svgH - (PAD_T - 46) - 4)}" rx="8" fill="${st.bg}" stroke="${st.border}" stroke-width="1"/>`);
    }
  }

  // DIVIDERS
  for (const divX of dividers) {
    const divOp = glass ? '0.45' : '0.85';
    lines.push(`<line x1="${r(divX)}" y1="${r(PAD_T - 46)}" x2="${r(divX)}" y2="${r(svgH - 4)}" stroke="#8a6a00" stroke-width="${glass ? '2' : '3.5'}" stroke-linecap="square" stroke-opacity="${divOp}"/>`);
    if (!glass) {
      lines.push(`<line x1="${r(divX)}" y1="${r(PAD_T - 46)}" x2="${r(divX)}" y2="${r(svgH - 4)}" stroke="rgba(240,190,30,0.10)" stroke-width="10" stroke-linecap="butt"/>`);
    }
  }

  // EPOCH ZONE LABELS
  for (let zi = 0; zi < zoneInfos.length; zi++) {
    const z = zoneInfos[zi];
    if (z === undefined) continue;
    const st = epochStyle(z.epoch, glass);
    const labelX = z.startX + (z.numCols * COL_STEP) / 2;
    const labelRight = z.startX + z.numCols * COL_STEP - 8;
    const labelLeft = z.startX - 8;

    lines.push(`<text x="${r(labelX)}" y="${r(PAD_T - 52)}" text-anchor="middle" fill="${st.label}" font-size="14" font-family="${glass ? 'Segoe UI,sans-serif' : 'Georgia,serif'}" font-weight="bold" letter-spacing="2"${textStroke}>EPOKA ${esc(z.epoch.toUpperCase())}</text>`);
    lines.push(`<line x1="${r(labelLeft)}" y1="${r(PAD_T - 43)}" x2="${r(labelRight)}" y2="${r(PAD_T - 43)}" stroke="${st.label}" stroke-width="1" stroke-opacity="${glass ? '0.55' : '0.35'}"/>`);
  }

  // COLUMN LABELS
  for (const z of zoneInfos) {
    const st = epochStyle(z.epoch, glass);
    const prefix = z.epoch === 'Kamień' ? 'K' : z.epoch === 'Brąz' ? 'B' : 'Z';
    for (let c = 0; c < z.numCols; c++) {
      const colX2 = z.startX + c * COL_STEP + NW / 2;
      const lbl = c === 0 && z.epoch === 'Brąz' ? `${prefix}0 (Bramkowy)` : `${prefix}${c}`;
      lines.push(`<text x="${r(colX2)}" y="${r(PAD_T - 26)}" text-anchor="middle" fill="${st.label}" font-size="9" font-family="monospace" opacity="0.55">${esc(lbl)}</text>`);
    }
  }

  // GUTTER GUIDE LINES
  for (const z of zoneInfos) {
    for (let gc = 1; gc < z.numCols; gc++) {
      const gutterMidX = z.startX + gc * COL_STEP - Math.round((COL_STEP - NW) / 2);
      lines.push(`<line x1="${r(gutterMidX)}" y1="${r(PAD_T - 20)}" x2="${r(gutterMidX)}" y2="${r(svgH - 10)}" stroke="rgba(70,50,10,0.12)" stroke-width="1" stroke-dasharray="2,8"/>`);
    }
  }

  // EDGES
  for (const re of routedEdges) {
    const pathAttrs: Record<string, string> = {
      d: re.d,
      fill: 'none',
      stroke: re.color,
      'stroke-width': '1.9',
      'stroke-opacity': '0.80',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round',
    };
    if (re.dashArr !== null) pathAttrs['stroke-dasharray'] = re.dashArr;
    lines.push(`<path ${svgAttr(pathAttrs)}/>`);
    // Arrowhead
    const al = 7, aw = 3.5;
    lines.push(`<path d="M ${r(re.dx)} ${r(re.dy)} L ${r(re.dx - al)} ${r(re.dy - aw)} L ${r(re.dx - al)} ${r(re.dy + aw)} Z" fill="${re.color}" fill-opacity="0.90"/>`);
  }

  // NODES
  for (const node of nodes) {
    const status = computeStatus(node.id, targetId, researchedIds, availableIds);
    const st = epochStyle(node.epoka, glass);
    const glowId = node.epoka === 'Kamień' ? 'glow-k' : node.epoka === 'Brąz' ? 'glow-b' : 'glow-z';
    const isClickable = status === 'available' || status === 'target';
    const isResearched = status === 'researched';
    const isLocked = status === 'locked';
    const isTarget = status === 'target';

    const nodeX = node.x;
    const nodeY = node.y;

    let opacity = '1';
    if (isResearched) opacity = '0.55';
    if (isLocked) opacity = '0.35';

    const pickClass = isClickable ? ' civ-sci-node--pick' : '';
    const pickAttr = isClickable ? ' data-pick="1"' : '';

    lines.push(`<g class="civ-sci-node${pickClass}" transform="translate(${r(nodeX)},${r(nodeY)})" style="opacity:${opacity};" data-tech-id="${esc(node.id)}"${pickAttr} id="snode-${esc(node.id)}">`);

    // Outer glow ring
    if (!glass || isTarget) {
      lines.push(`<rect x="-3" y="-3" width="${NW + 6}" height="${NH + 6}" rx="10" fill="none" stroke="${st.glowColor}" stroke-width="${glass ? '4' : '7'}" filter="url(#${glowId})"/>`);
    }

    // Target golden glow
    if (isTarget) {
      lines.push(`<rect x="-5" y="-5" width="${NW + 10}" height="${NH + 10}" rx="12" fill="none" stroke="#e0b24a" stroke-width="3" stroke-opacity="0.9" filter="url(#glow-target)"/>`);
    }

    // Main box
    const boxStroke = isTarget ? '#e0b24a' : isResearched ? st.nodeStroke : st.nodeStroke;
    const boxStrokeW = isTarget ? '2.5' : '1.5';
    lines.push(`<rect class="civ-sci-node-box" x="0" y="0" width="${NW}" height="${NH}" rx="8" fill="${st.nodeFill}" stroke="${boxStroke}" stroke-width="${boxStrokeW}"/>`);

    // Top highlight
    lines.push(`<rect x="1" y="1" width="${NW - 2}" height="${Math.round(NH * 0.38)}" rx="7" fill="rgba(255,255,255,0.05)"/>`);

    // Status badge overlay (✓ for researched, 🔒 for locked)
    if (isResearched) {
      lines.push(`<text x="${r(NW - 8)}" y="14" text-anchor="end" fill="#5ad05a" font-size="12" font-family="Georgia,serif">✓</text>`);
    }
    if (isLocked) {
      lines.push(`<text x="${r(NW - 8)}" y="14" text-anchor="end" fill="#6a7585" font-size="11" font-family="Georgia,serif">🔒</text>`);
    }

    // Name text
    const lines2 = wrapText(node.nazwa);
    const textBlockH = lines2.length * 16;
    const hasNote = node.uwagi !== null && node.uwagi !== '';
    const textY0 = Math.round((NH - textBlockH) / 2) + 14 - (hasNote ? 6 : 0);

    const textFill = isTarget ? '#f0e070' : '#f2e5b8';
    const nameFont = glass ? 'Segoe UI,sans-serif' : 'Georgia,serif';
    for (let li = 0; li < lines2.length; li++) {
      const ln = lines2[li];
      if (ln === undefined) continue;
      lines.push(`<text x="${r(NW / 2)}" y="${r(textY0 + li * 16)}" text-anchor="middle" fill="${textFill}" font-size="12.5" font-family="${nameFont}" font-weight="bold" pointer-events="none"${textStroke}>${esc(ln)}</text>`);
    }

    // Note (epoch marker)
    if (hasNote && node.uwagi !== null) {
      const noteColor = node.epoka === 'Kamień' ? '#a0e060' : node.epoka === 'Brąz' ? '#f0b840' : '#80c0f0';
      lines.push(`<text x="${r(NW / 2)}" y="${r(NH - 16)}" text-anchor="middle" fill="${noteColor}" font-size="8" font-family="Georgia,serif" font-style="italic" pointer-events="none">★ ${esc(node.uwagi.substring(0, 30))}</text>`);
    }

    // Epoch badge bottom
    const bw = 56, bh = 13;
    lines.push(`<rect x="${r((NW - bw) / 2)}" y="${r(NH - bh - 2)}" width="${bw}" height="${bh}" rx="3" fill="${st.nodeFill}" stroke="${st.nodeStroke}" stroke-width="0.6" fill-opacity="0.8"/>`);
    lines.push(`<text x="${r(NW / 2)}" y="${r(NH - 4)}" text-anchor="middle" fill="${st.nodeStroke}" font-size="8.5" font-family="Georgia,serif" pointer-events="none">${esc(node.epoka)}</text>`);

    // Zone-column micro-label top-left
    const prefix2 = node.epoka === 'Kamień' ? 'K' : node.epoka === 'Brąz' ? 'B' : 'Z';
    lines.push(`<text x="4" y="11" fill="rgba(180,140,50,0.40)" font-size="7.5" font-family="monospace" pointer-events="none">${esc(prefix2 + node.zoneCol)}</text>`);

    // Ikona technologii — mały medalion top-left (pod etykietą strefy)
    const nodeIcon = techIconSvg(node.nazwa, 14);
    if (nodeIcon !== null) {
      lines.push(`<g transform="translate(4,15)" style="color:${textFill};opacity:0.85" pointer-events="none">${nodeIcon}</g>`);
    }

    // Cost top-right (po mnozniku tempa gry)
    lines.push(`<text x="${r(NW - 4)}" y="11" text-anchor="end" fill="rgba(120,180,90,0.45)" font-size="7.5" font-family="monospace" pointer-events="none">${effectiveTechCost(node.koszt, activeOwner)}PN</text>`);

    if (isClickable) {
      lines.push(`<rect class="civ-sci-hit" x="0" y="0" width="${NW}" height="${NH}" rx="8" fill="rgba(0,0,0,0.001)" stroke="none" pointer-events="all"/>`);
    }

    // TEMAT 10 (C-RES-Q1=C): numerek 1..RESEARCH_QUEUE_MAX gdy tech jest w planie badań (aktywny cel lub kolejka).
    const planPos = planPosById.get(node.id);
    if (planPos !== undefined) {
      lines.push(`<circle cx="-2" cy="-2" r="9" fill="#e0b24a" stroke="#1a1400" stroke-width="1.2" pointer-events="none"/>`);
      lines.push(`<text x="-2" y="1.5" text-anchor="middle" fill="#1a1400" font-size="10" font-family="Georgia,serif" font-weight="bold" pointer-events="none">${planPos}</text>`);
    }

    lines.push('</g>');
  }

  lines.push('</svg>');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Tooltip (HTML, positioned fixed)
// ---------------------------------------------------------------------------

function buildTooltipHTML(node: TechNode, status: NodeStatus): string {
  const st = epochStyle(node.epoka);
  const statusLabel: Record<NodeStatus, string> = {
    researched: '✓ Zbadana',
    target: '◉ Aktualny cel',
    available: '▶ Dostępna',
    locked: '🔒 Zablokowana',
  };

  const ttIcon = techIconSvg(node.nazwa, 15);
  const ttIconHtml = ttIcon !== null
    ? `<span style="display:inline-flex;width:15px;height:15px;vertical-align:-3px;margin-right:5px;color:${st.label}">${ttIcon}</span>`
    : '';
  let h = `<div class="tt-name" style="color:${st.label}">${ttIconHtml}${esc(node.nazwa)}</div>`;
  h += `<div class="tt-meta" style="color:#7a6028">Epoka: <strong>${esc(node.epoka)}</strong> | Kolumna: ${node.epoka === 'Kamień' ? 'K' : node.epoka === 'Brąz' ? 'B' : 'Z'}${node.zoneCol}</div>`;
  h += `<div class="tt-cost" style="color:#78b058">⚗ Koszt nauki: ${effectiveTechCost(node.koszt, activeOwner)} PN</div>`;
  h += `<div class="tt-status" style="margin-top:4px;font-size:0.73em;font-weight:700">${statusLabel[status]}</div>`;

  if (node.prereqIds.length > 0) {
    const prereqNames = node.prereqIds.map(pid => TECH_MAP.get(pid)?.nazwa ?? pid);
    h += `<div class="tt-section" style="margin-top:6px;color:#907030;font-size:0.68em;text-transform:uppercase">Wymaga:</div>`;
    h += `<ul class="tt-items">${prereqNames.map(n => {
      const pic = techIconSvg(n, 12);
      const picHtml = pic !== null
        ? `<span style="display:inline-flex;width:12px;height:12px;vertical-align:-2px;margin-right:4px">${pic}</span>`
        : '';
      return `<li>${picHtml}${esc(n)}</li>`;
    }).join('')}</ul>`;
  }
  // Warunek odblokowania badania: budynek w mieście i/lub ulepszenie na mapie.
  if (node.wymaganyBudynek || node.wymaganeUlepszenie) {
    const reqs: string[] = [];
    if (node.wymaganyBudynek) reqs.push('🏛 budynek: ' + esc(node.wymaganyBudynek));
    if (node.wymaganeUlepszenie) reqs.push('🌾 ulepszenie: ' + esc(node.wymaganeUlepszenie));
    h += `<div class="tt-section" style="margin-top:6px;color:#c08830;font-size:0.68em;text-transform:uppercase">Warunek badania:</div>`;
    h += `<ul class="tt-items">${reqs.map(rq => `<li>${rq}</li>`).join('')}</ul>`;
  }
  if (node.odblokujeBudynek) {
    h += `<div class="tt-section" style="margin-top:6px;color:#907030;font-size:0.68em;text-transform:uppercase">Odblokowuje budynki:</div>`;
    h += `<ul class="tt-items">${node.odblokujeBudynek.split(',').map(b => `<li>${esc(b.trim())}</li>`).join('')}</ul>`;
  }
  if (node.odblokujeSurowiec) {
    h += `<div class="tt-section" style="margin-top:6px;color:#907030;font-size:0.68em;text-transform:uppercase">Odblokowuje surowce:</div>`;
    h += `<ul class="tt-items">${node.odblokujeSurowiec.split(',').map(s => `<li>${esc(s.trim())}</li>`).join('')}</ul>`;
  }
  if (node.odblokujeUlepszenie) {
    h += `<div class="tt-section" style="margin-top:6px;color:#907030;font-size:0.68em;text-transform:uppercase">Odblokowuje na mapie:</div>`;
    h += `<ul class="tt-items">${node.odblokujeUlepszenie.split(',').map(s => `<li>${esc(s.trim())}</li>`).join('')}</ul>`;
  }
  if (node.uwagi) {
    h += `<div class="tt-star" style="margin-top:5px;color:#c09830;font-size:0.71em">★ ${esc(node.uwagi)}</div>`;
  }

  return h;
}

// ---------------------------------------------------------------------------
// Stan modułu
// ---------------------------------------------------------------------------

let cfg: SciencePickerConfig = {};

/** Koszt badania po mnozniku tempa gry + asymetrii trudnosci. */
function effectiveTechCost(baseKoszt: number, ownerId = 0): number {
  const tempo = cfg.getTempoGry?.(ownerId) ?? 'standardowa';
  const difficulty = cfg.getDifficulty?.(ownerId) ?? 'normal';
  return scaledResearchCost(baseKoszt, tempo, ownerId, difficulty);
}
let overlayEl: HTMLDivElement | null = null;
let panelEl: HTMLDivElement | null = null;
let dimBackdropEl: HTMLDivElement | null = null;
let tooltipEl: HTMLDivElement | null = null;
let activeOwner = 0;
let displayMode: 'legacy' | 'dock' = 'legacy';
let focusTechId: string | null = null;
let onTreeCloseHook: (() => void) | null = null;

/** Dock drzewka stoi obok panelu Badań (scienceHubHud, PANEL_W=340) — patrz sidePanelLayout.ts. */
const HUB_LEFT = `calc(${SIDE_PANEL_LEFT} + min(24vw, 340px) + 8px)`;
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_H = 'calc(56px + 2mm)';

// ---------------------------------------------------------------------------
// Style (scoped .civ-sci, wstrzykiwane RAZ)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-sci-css-v4-dim-hide';

function ensureStyles(): void {
  document.getElementById('civ-sci-css-v2')?.remove();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-sci-dim-backdrop{
  position:fixed;inset:0;z-index:312;background:transparent;pointer-events:auto;display:none;}
.civ-sci-overlay{
  position:fixed;inset:0;z-index:400;display:flex;align-items:flex-start;justify-content:center;
  background:rgba(0,0,0,0.78);backdrop-filter:blur(3px);overflow-y:auto;padding:20px 10px 40px;}
.civ-sci-overlay.dock{
  z-index:314;inset:auto;left:${HUB_LEFT};top:${TOP_H};bottom:${BOTTOM_H};right:12px;
  background:transparent;backdrop-filter:none;overflow:hidden;padding:0;pointer-events:none;}
.civ-sci{
  --gold:#e0b24a;--muted:#9aa6b6;--sub:#c0c8d4;--sci:#6bc4e8;
  --border:rgba(224,178,74,0.3);
  display:flex;flex-direction:column;
  background:rgba(10,8,2,0.97);color:#e8d5a0;
  border:1px solid var(--border);border-radius:12px;
  font:12.5px 'Georgia',serif;box-shadow:0 12px 48px rgba(0,0,0,0.90);}
.civ-sci.dock{
  position:relative;width:100%;height:100%;max-height:none;border-radius:8px;
  font:13px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  background:rgba(8,14,28,0.28);
  backdrop-filter:blur(5px) saturate(1.08);
  -webkit-backdrop-filter:blur(5px) saturate(1.08);
  border:1px solid rgba(107,196,232,0.22);
  box-shadow:0 4px 20px rgba(0,0,0,0.18);
  pointer-events:auto;}
.civ-sci *{box-sizing:border-box;}
/* Header */
.civ-sci .cs-header{
  display:flex;align-items:center;justify-content:space-between;
  padding:12px 18px 11px;border-bottom:2px solid #b08a00;flex-shrink:0;
  background:linear-gradient(135deg,#130f00 0%,#221a00 50%,#130f00 100%);}
.civ-sci.dock .cs-header{
  padding:10px 14px;border-bottom:1px solid rgba(107,196,232,0.2);
  background:rgba(10,16,28,0.55);backdrop-filter:blur(8px);gap:10px;}
.civ-sci .cs-header-left{display:flex;align-items:center;gap:8px;min-width:0;flex:1;}
.civ-sci .cs-back{background:rgba(107,196,232,0.1);border:1px solid rgba(107,196,232,0.35);
  color:#a8d4f0;border-radius:5px;padding:4px 10px;font-size:11px;cursor:pointer;font-family:inherit;}
.civ-sci .cs-back:hover{background:rgba(107,196,232,0.2);}
.civ-sci .cs-title{font-size:1.1em;font-weight:700;letter-spacing:2px;color:#f0c840;
  text-shadow:0 0 14px rgba(240,200,64,0.45);}
.civ-sci.dock .cs-title{font-size:0.95em;letter-spacing:0.04em;color:#e8f4ff;text-shadow:0 1px 3px rgba(0,0,0,0.65);font-weight:700;}
.civ-sci .cs-close{background:none;border:none;color:#907830;font-size:18px;
  cursor:pointer;padding:0 3px;line-height:1;transition:color .15s;}
.civ-sci .cs-close:hover{color:#f0c840;}
.civ-sci.dock .cs-close{color:#b8c4d4;font-size:16px;text-shadow:0 1px 2px rgba(0,0,0,0.5);}
.civ-sci.dock .cs-close:hover{color:#6bc4e8;}
.civ-sci .cs-epoch-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:6px 12px 8px;
  border-bottom:1px solid rgba(46,56,72,0.8);background:rgba(10,16,28,0.6);flex-shrink:0;}
.civ-sci.dock .cs-epoch-tabs{
  border-bottom:1px solid rgba(107,196,232,0.15);
  background:rgba(10,16,28,0.42);backdrop-filter:blur(6px);}
.civ-sci .cs-epoch-tab{background:rgba(255,255,255,0.04);border:1px solid rgba(107,196,232,0.2);
  color:#8b97a8;border-radius:4px;padding:3px 10px;font-size:10px;cursor:pointer;font-family:inherit;}
.civ-sci .cs-epoch-tab:hover{border-color:rgba(107,196,232,0.45);color:#c8e4ff;}
.civ-sci .cs-epoch-tab.on{border-color:rgba(107,196,232,0.6);background:rgba(107,196,232,0.15);color:#d4ecff;}
.civ-sci .cs-jump-target{margin-left:auto;background:rgba(224,178,74,0.1);border:1px solid rgba(224,178,74,0.35);
  color:#e0b24a;border-radius:4px;padding:3px 8px;font-size:10px;cursor:pointer;font-family:inherit;}
.civ-sci.dock .cs-jump-target{background:rgba(224,178,74,0.18);text-shadow:0 1px 2px rgba(0,0,0,0.45);}
/* Progress bar */
.civ-sci .cs-progress{
  display:flex;flex-direction:column;gap:5px;
  padding:10px 18px 9px;border-bottom:1px solid #302200;flex-shrink:0;
  background:#0e0c04;}
.civ-sci .cs-prog-row{display:flex;justify-content:space-between;align-items:baseline;
  font-size:0.82em;color:#c0a050;}
.civ-sci .cs-prog-row .cs-val{color:#f0c840;font-weight:700;}
.civ-sci .cs-prog-row .cs-eta{color:#907830;font-size:0.85em;}
.civ-sci .cs-owl-ic{display:inline-flex;align-items:center;margin-right:0.35em;vertical-align:middle;}
.civ-sci .cs-owl-ic .civ-science-owl-ic{width:18px;height:18px;color:#f0c840;}
.civ-sci .cs-bar{height:7px;background:rgba(50,35,0,0.8);border:1px solid rgba(176,138,0,0.35);
  border-radius:4px;overflow:hidden;}
.civ-sci .cs-bar-fill{height:100%;background:#f0c840;transition:width .35s ease;}
.civ-sci .cs-prog-hint{font-size:0.71em;color:#5a4820;font-style:italic;}
/* Tree scroll container */
.civ-sci .cs-tree-scroll{overflow-x:auto;flex:1;padding:18px 24px 48px;min-height:0;}
.civ-sci.dock .cs-tree-scroll{overflow:auto;padding:12px 16px 24px;background:transparent;}
.civ-sci.dock .cs-tree-scroll svg{background:transparent;}
.civ-sci .civ-sci-node--pick{cursor:pointer;}
.civ-sci .civ-sci-node--pick:hover .civ-sci-hit{fill:rgba(107,196,232,0.14);stroke:rgba(107,196,232,0.55);stroke-width:2;}
.civ-sci .civ-sci-node--pick:hover .civ-sci-node-box{stroke-width:2.2;filter:brightness(1.08);}
/* Tooltip */
.civ-sci-tooltip{
  position:fixed;display:none;
  background:#160e00;border:1px solid #b08800;border-radius:12px;
  padding:20px 26px;max-width:600px;font-size:1.54rem;color:#e0d098;
  box-shadow:0 8px 36px rgba(0,0,0,0.88);pointer-events:none;z-index:1000;line-height:1.55;
  font-family:'Georgia',serif;}
.civ-sci-tooltip .tt-name{font-size:1.82rem;font-weight:bold;margin-bottom:6px;}
.civ-sci-tooltip .tt-section{margin-top:12px;color:#907030;font-size:0.68em;text-transform:uppercase;letter-spacing:0.5px;}
.civ-sci-tooltip .tt-items{margin-top:4px;padding-left:26px;color:#cebe70;}
.civ-sci-tooltip .tt-items li{list-style:disc;margin:2px 0;font-size:1.48rem;}
/* Legend */
.civ-sci .cs-legend{
  display:flex;flex-wrap:wrap;gap:8px 20px;
  padding:8px 18px;border-bottom:1px solid #302200;flex-shrink:0;
  background:#0a0800;font-size:0.73em;color:#907830;align-items:center;}
.civ-sci .cs-legend-item{display:flex;align-items:center;gap:6px;}
.civ-sci .cs-legend-swatch{width:12px;height:12px;border-radius:3px;flex-shrink:0;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Render: górny pasek postępu
// ---------------------------------------------------------------------------

function renderProgress(state: {
  pula: number; targetId: string | null;
  kosztCelu: number; postepFraction: number; turnsLeft: number;
} | null): string {
  const owl = '<span class="cs-owl-ic">' + scienceOwlIconHtml() + '</span>';
  let html = '<div class="cs-progress">';

  if (state === null || state.targetId === null || state.kosztCelu <= 0) {
    html += '<div class="cs-prog-row"><span>' + owl + ' Wybierz technologi&#x0119;, klikaj&#x0105;c w&#x0119;ze&#x0142; na drzewku</span></div>';
    html += '<div class="cs-bar"><div class="cs-bar-fill" style="width:0%"></div></div>';
    html += '</div>';
    return html;
  }

  const targetNode = TECH_MAP.get(state.targetId);
  const targetName = targetNode ? targetNode.nazwa : state.targetId;
  const pct = Math.max(0, Math.min(100, Math.round(state.postepFraction * 100)));
  const eta = state.turnsLeft > 0 ? state.turnsLeft + ' tur' : '<1 tury';

  html += '<div class="cs-prog-row">'
    + '<span>' + owl + ' Cel: <strong class="cs-val">' + esc(targetName) + '</strong></span>'
    + '<span class="cs-eta">ETA: ' + esc(eta) + '</span>'
    + '</div>';
  html += '<div class="cs-prog-row">'
    + '<span>Pula:</span>'
    + '<span class="cs-val">' + Math.round(state.pula) + ' / ' + Math.round(state.kosztCelu) + ' PN</span>'
    + '</div>';
  html += '<div class="cs-bar"><div class="cs-bar-fill" style="width:' + pct + '%"></div></div>';
  html += '<div class="cs-prog-hint">Post&#x0119;p: ' + pct + '% &middot; ETA: ' + esc(eta) + '</div>';
  html += '</div>';
  return html;
}

// ---------------------------------------------------------------------------
// Render główny
// ---------------------------------------------------------------------------

function render(): void {
  if (panelEl === null) return;

  try {
  const hasHooks = cfg.getResearchState !== undefined || cfg.getAvailableTechs !== undefined;
  const state = cfg.getResearchState ? cfg.getResearchState(activeOwner) : null;
  const targetId = state?.targetId ?? null;

  let researchedIds: Set<string>;
  let availableIds: Set<string>;

  if (!hasHooks) {
    researchedIds = new Set<string>();
    availableIds = new Set<string>(TECH_MAP.keys());
  } else {
    const rList = cfg.getResearchedTechs ? cfg.getResearchedTechs(activeOwner) : [];
    const aList = cfg.getAvailableTechs ? cfg.getAvailableTechs(activeOwner) : [];
    researchedIds = new Set<string>(rList);
    availableIds = new Set<string>(aList);
    if (targetId !== null && !researchedIds.has(targetId)) {
      availableIds.add(targetId);
    }
  }

  const nodes = filterNodesForEpoch(Array.from(TECH_MAP.values()), activeOwner);
  const layout = computeLayout(nodes);
  const routedEdges = routeEdges(nodes, layout.zoneInfos, layout.bottomLaneYStart);
  const isDock = displayMode === 'dock';
  // TEMAT 10 (C-RES-Q1=C): numerki 1..RESEARCH_QUEUE_MAX na węzłach, które są w planie badań.
  const planPosById = new Map<string, number>();
  for (const p of cfg.getPlan?.(activeOwner) ?? []) planPosById.set(p.id, p.pos);
  const svgStr = buildSVG(nodes, layout, routedEdges, targetId, researchedIds, availableIds, isDock, planPosById);

  const ph = hasHooks ? '' : ' <span style="font-size:0.68em;color:#5a4820;font-weight:400">[podgl&#x0105;d]</span>';

  let headerHtml = '';
  if (isDock) {
    headerHtml = '<div class="cs-header">'
      + '<div class="cs-header-left">'
      + '<button type="button" class="cs-back" aria-label="Wróć do listy">\u2190 Lista</button>'
      + '<span class="cs-title">Drzewko technologii</span>'
      + '</div>'
      + '<button type="button" class="cs-close" aria-label="Zamknij drzewko">\u2715</button>'
      + '</div>';
    const visibleEpochs = [...new Set(nodes.map(n => n.epoka))];
    headerHtml += '<div class="cs-epoch-tabs">';
    for (const ep of EPOCH_ORDER) {
      if (!visibleEpochs.includes(ep)) continue;
      headerHtml += '<button type="button" class="cs-epoch-tab" data-epoch="' + esc(ep) + '">' + esc(ep) + '</button>';
    }
    if (targetId) {
      headerHtml += '<button type="button" class="cs-jump-target" data-jump-target="1">Skocz do celu</button>';
    }
    headerHtml += '</div>';
  } else {
    headerHtml = '<div class="cs-header">'
      + '<span class="cs-title">Drzewko technologii &#x2014; wybierz cel bada&#x0144;' + ph + '</span>'
      + '<button class="cs-close" aria-label="Zamknij">&#x2715;</button>'
      + '</div>'
      + renderProgress(state)
      + '<div class="cs-legend">'
      + '<strong style="color:#f0c840">Legenda:</strong>'
      + '<div class="cs-legend-item"><div class="cs-legend-swatch" style="background:#243a14;border:1px solid #6aaa38"></div> Epoka Kamienia</div>'
      + '<div class="cs-legend-item"><div class="cs-legend-swatch" style="background:#3e2008;border:1px solid #d08030"></div> Epoka Br&#x0105;zu</div>'
      + '<div class="cs-legend-item"><div class="cs-legend-swatch" style="background:#0e1e38;border:1px solid #4080c0"></div> Epoka &#x17B;elaza</div>'
      + '<div class="cs-legend-item" style="color:#f0c840">&#x25CF; z&#x0142;ota po&#x015B;wiata = aktualny cel</div>'
      + '<div class="cs-legend-item" style="color:#5ad05a">&#x2713; zbadana</div>'
      + '<div class="cs-legend-item" style="color:#6a7585">&#x1F512; zablokowana</div>'
      + '</div>';
  }

  panelEl.className = 'civ-sci' + (isDock ? ' dock' : '');
  panelEl.innerHTML = headerHtml
    + '<div class="cs-tree-scroll">' + svgStr + '</div>';

  bindClose();
  bindDockChrome(targetId);
  ensureTreeInteractionHandlers();
  scrollToFocusTech(targetId);
  } catch (err) {
    console.warn('[Nauka] Blad renderu drzewka:', err);
    panelEl.innerHTML =
      '<div class="cs-header">'
      + '<span class="cs-title">Drzewko technologii</span>'
      + '<button class="cs-close" aria-label="Zamknij">&#x2715;</button>'
      + '</div>'
      + '<p style="padding:24px;color:#c88">Nie udalo sie odswiezyc drzewka. Zamknij i otworz ponownie.</p>';
    bindClose();
  }
}

function bindClose(): void {
  if (panelEl === null) return;
  const btn = panelEl.querySelector<HTMLButtonElement>('.cs-close');
  if (btn !== null) {
    btn.addEventListener('click', hideSciencePicker, { once: true });
  }
  const back = panelEl.querySelector<HTMLButtonElement>('.cs-back');
  if (back !== null) {
    back.addEventListener('click', hideSciencePicker, { once: true });
  }
}

function bindDockChrome(targetId: string | null): void {
  if (panelEl === null || displayMode !== 'dock') return;
  const scroll = panelEl.querySelector('.cs-tree-scroll');
  panelEl.querySelectorAll<HTMLButtonElement>('.cs-epoch-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const ep = tab.getAttribute('data-epoch');
      if (!ep || scroll === null) return;
      const zone = scroll.querySelector('#civ-sci-zone-' + ep);
      if (zone) {
        zone.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
      }
      panelEl?.querySelectorAll('.cs-epoch-tab').forEach(t => t.classList.remove('on'));
      tab.classList.add('on');
    });
  });
  const jump = panelEl.querySelector<HTMLButtonElement>('[data-jump-target]');
  if (jump && targetId) {
    jump.addEventListener('click', () => scrollToTechNode(targetId));
  }
}

function scrollToTechNode(techId: string): void {
  if (panelEl === null) return;
  const scroll = panelEl.querySelector('.cs-tree-scroll');
  const node = scroll?.querySelector('#snode-' + techId);
  if (node) node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
}

function scrollToFocusTech(fallbackTargetId: string | null): void {
  const id = focusTechId ?? fallbackTargetId;
  focusTechId = null;
  if (id) scrollToTechNode(id);
}

function readTreeInteractionSets(): {
  researchedIds: Set<string>;
  availableIds: Set<string>;
  targetId: string | null;
} {
  const state = cfg.getResearchState?.(activeOwner) ?? null;
  const targetId = state?.targetId ?? null;
  const researchedIds = new Set(cfg.getResearchedTechs?.(activeOwner) ?? []);
  const availableIds = new Set(cfg.getAvailableTechs?.(activeOwner) ?? []);
  if (targetId !== null && !researchedIds.has(targetId)) availableIds.add(targetId);
  return { researchedIds, availableIds, targetId };
}

let treeInteractionBound = false;

function ensureTreeInteractionHandlers(): void {
  if (panelEl === null || treeInteractionBound) return;
  treeInteractionBound = true;

  panelEl.addEventListener('click', (e: Event) => {
    const pick = (e.target as Element | null)?.closest('[data-pick="1"]');
    if (!pick || cfg.onSelectTarget === undefined) return;
    const nodeId = pick.getAttribute('data-tech-id');
    if (nodeId === null) return;
    e.preventDefault();
    e.stopPropagation();
    cfg.onSelectTarget(nodeId);
    refreshScienceHubIfOpen();
    render();
  });

  panelEl.addEventListener('mouseover', (e: Event) => {
    const nodeEl = (e.target as Element | null)?.closest('[data-tech-id]');
    if (!nodeEl || tooltipEl === null) return;
    const nodeId = nodeEl.getAttribute('data-tech-id');
    if (nodeId === null) return;
    const node = TECH_MAP.get(nodeId);
    if (node === undefined) return;
    const { researchedIds, availableIds, targetId } = readTreeInteractionSets();
    tooltipEl.innerHTML = buildTooltipHTML(node, computeStatus(nodeId, targetId, researchedIds, availableIds));
    tooltipEl.style.display = 'block';
    moveTooltip(e as MouseEvent);
  });

  panelEl.addEventListener('mousemove', (e: Event) => {
    if (tooltipEl === null || tooltipEl.style.display === 'none') return;
    moveTooltip(e as MouseEvent);
  });

  panelEl.addEventListener('mouseout', (e: Event) => {
    if (tooltipEl === null) return;
    const me = e as MouseEvent;
    const from = (e.target as Element | null)?.closest('[data-tech-id]');
    const to = (me.relatedTarget as Element | null)?.closest('[data-tech-id]');
    if (from !== null && from === to) return;
    tooltipEl.style.display = 'none';
  });
}

function moveTooltip(e: MouseEvent): void {
  if (tooltipEl === null) return;
  let x = e.clientX + 16;
  let y = e.clientY + 12;
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;
  if (x + tw > window.innerWidth - 8) x = e.clientX - tw - 10;
  if (y + th > window.innerHeight - 8) y = e.clientY - th - 10;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top = y + 'px';
}

// ---------------------------------------------------------------------------
// Esc
// ---------------------------------------------------------------------------

function onKeyDown(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  hideSciencePicker();
}

function ensureDimBackdrop(): void {
  if (dimBackdropEl !== null) return;
  dimBackdropEl = document.createElement('div');
  dimBackdropEl.className = 'civ-sci-dim-backdrop';
  dimBackdropEl.addEventListener('click', () => hideSciencePicker());
  document.body.appendChild(dimBackdropEl);
}

// ---------------------------------------------------------------------------
// API publiczne — NIEZMIENIONE NAZWY EKSPORTOW
// ---------------------------------------------------------------------------

/**
 * Skonfiguruj picker (wstrzykuje haki silnika).
 * Moze byc wywolane wielokrotnie — nadpisuje poprzednia konfiguracje.
 */
export function configureSciencePicker(newCfg: SciencePickerConfig): void {
  cfg = { ...cfg, ...newCfg };
}

/**
 * Pokaz drzewko technologii dla podanego wlasciciela (domyslnie 0 = gracz).
 * Buduje DOM przy pierwszym wywolaniu; kolejne odswiezaja dane.
 */
export function showSciencePicker(ownerId: number = 0): void {
  displayMode = 'legacy';
  focusTechId = null;
  onTreeCloseHook = null;
  showSciencePickerInternal(ownerId);
}

/** Drzewko obok huba badań — mapa widoczna, lekko przyciemniona (Q-NAUKA-2 A). */
export function showSciencePickerDocked(
  ownerId: number = 0,
  opts?: { focusTechId?: string; onClose?: () => void },
): void {
  displayMode = 'dock';
  focusTechId = opts?.focusTechId ?? null;
  onTreeCloseHook = opts?.onClose ?? null;
  showSciencePickerInternal(ownerId);
}

function showSciencePickerInternal(ownerId: number): void {
  activeOwner = ownerId;
  ensureStyles();

  if (displayMode === 'dock') {
    ensureDimBackdrop();
    if (dimBackdropEl !== null) dimBackdropEl.style.display = 'block';
  }

  if (overlayEl === null) {
    overlayEl = document.createElement('div');
    overlayEl.className = 'civ-sci-overlay';
    overlayEl.addEventListener('click', (e) => {
      if (displayMode === 'legacy' && e.target === overlayEl) hideSciencePicker();
    });

    panelEl = document.createElement('div');
    panelEl.className = 'civ-sci';
    overlayEl.appendChild(panelEl);
    document.body.appendChild(overlayEl);

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'civ-sci-tooltip';
    document.body.appendChild(tooltipEl);
  }

  overlayEl.className = 'civ-sci-overlay' + (displayMode === 'dock' ? ' dock' : '');

  render();

  overlayEl.style.display = displayMode === 'dock' ? 'block' : 'flex';
  document.addEventListener('keydown', onKeyDown);
}

/**
 * Ukryj drzewko (bez usuwania z DOM).
 */
export function hideSciencePicker(): void {
  if (overlayEl !== null) overlayEl.style.display = 'none';
  if (dimBackdropEl !== null) dimBackdropEl.style.display = 'none';
  if (tooltipEl !== null) tooltipEl.style.display = 'none';
  document.removeEventListener('keydown', onKeyDown);
  const hook = onTreeCloseHook;
  onTreeCloseHook = null;
  hook?.();
}

/**
 * Czy drzewko jest aktualnie widoczne.
 */
export function isSciencePickerOpen(): boolean {
  return overlayEl !== null && overlayEl.style.display !== 'none';
}

export function isSciencePickerDocked(): boolean {
  return isSciencePickerOpen() && displayMode === 'dock';
}

/** Odśwież drzewko gdy otwarte (np. po ukończeniu tech na koniec tury). */
export function refreshSciencePickerIfOpen(): void {
  if (isSciencePickerOpen()) render();
}
