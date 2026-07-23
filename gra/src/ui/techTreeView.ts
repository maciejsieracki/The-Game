/**
 * techTreeView.ts
 * Ekran GRAFU drzewa technologii — siatka bez krawędzi (KANON: makieta Claude
 * Design „The Game — Drzewko technologii siatka v1.1 (1E)", decyzja Macieja
 * 2026-07-23: zależności wyłącznie OPISOWO na węzłach i kartach, BEZ linii).
 *
 * Pełnoekranowy overlay nad grą (ESC zamyka): pasma epok Kamień|Brąz|Żelazo,
 * kolumny wg Poziomu 1–9, 4 stany węzłów (odkryta/dostępna/w trakcie/zablokowana),
 * karta węzła na hover, zoom/pan, pasek epok, minimapa.
 *
 * DECOUPLED jak sciencePicker: dane przez haki w TechTreeViewConfig — moduł
 * TYLKO czyta stan badań i woła onStartResearch (istniejąca ścieżka silnika).
 * Zero zmian w logice silnika badań.
 *
 * LANE: src/ui/*.  Source: literalny UTF-8.
 */

import techData from '../../data/tech.json';
import { techToSlug } from './sciencePicker';
import { terrainUnlockLabelsForTech } from '../game/improvement-tech';
import { TEMPO_GRY, type TempoGry } from '../game/tech-tempo';
import { scaledResearchCost, type GameDifficulty } from '../game/difficulty-cost';
import { epochIconSvg } from './icons/brandAssets';
import { scienceProgressRingHtml } from './icons/scienceProgressRing';
import { techIconSvg } from './techIcons';

// ---------------------------------------------------------------------------
// Konfiguracja (haki wstrzykiwane przez silnik — main.ts)
// ---------------------------------------------------------------------------

export interface TechTreeViewConfig {
  /** Stan badań: pula PN, cel (slug), koszt celu, postęp, ETA. */
  getResearchState?: (ownerId: number) => {
    pula: number;
    targetId: string | null;
    kosztCelu: number;
    postepFraction: number;
    turnsLeft: number;
  } | null;
  /** Slugi technologii już zbadanych. */
  getResearchedTechs?: (ownerId: number) => string[];
  /** Slugi technologii możliwych do wyboru (prereq + bramki spełnione). */
  getAvailableTechs?: (ownerId: number) => string[];
  /** Tempo nauki gracza (PN/turę) — do „≈ N tur przy X PN/turę". */
  getNaukaRate?: (ownerId: number) => number;
  getTempoGry?: (ownerId: number) => TempoGry;
  getDifficulty?: (ownerId: number) => GameDifficulty;
  /** Bramka budynku (T-TECH-7) spełniona dla techa (nazwa kanoniczna)? */
  isBuildingGateMet?: (ownerId: number, techName: string) => boolean;
  /** Bramka ulepszenia terenu spełniona dla techa (nazwa kanoniczna)? */
  isImprovementGateMet?: (ownerId: number, techName: string) => boolean;
  /** Rozpocznij badanie (istniejąca ścieżka silnika — setPlayerResearchTarget). */
  onStartResearch?: (techSlug: string) => void;
}

let cfg: TechTreeViewConfig = {};

export function configureTechTreeView(newCfg: TechTreeViewConfig): void {
  cfg = { ...cfg, ...newCfg };
}

// ---------------------------------------------------------------------------
// Dane: tech.json → węzły siatki
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
  awansDoEpoki?: number;
}

interface TreeNode {
  id: string;
  nazwa: string;
  epoka: string;
  poziom: number;
  prereqIds: string[];
  wymaganyBudynek: string;
  wymaganeUlepszenie: string;
  odblokujeBudynki: string[];
  odblokujeJednostki: string[];
  odblokujeSurowce: string[];
  odblokujeUlepszenia: string[];
  koszt: number;
  star: string | null;
  /** Slugi techów, dla których ten tech jest prereqiem. */
  dependents: string[];
  x: number;
  y: number;
}

const EPOCH_ORDER: readonly string[] = ['Kamień', 'Brąz', 'Żelazo'];

/** Geometria świata 1:1 z makiety (klatka A). */
const WORLD_W = 2440;
const WORLD_H = 986;
const NODE_W = 168;
const COL_X: Readonly<Record<number, number>> = {
  1: 40, 2: 300, 3: 560, 4: 856, 5: 1116, 6: 1376, 7: 1672, 8: 1932, 9: 2192,
};
const ROW_Y0 = 172;
const ROW_STEP = 96;

/** Wiersze węzłów 1:1 z makiety (slug → wiersz w kolumnie Poziomu). */
const MOCK_ROWS: Readonly<Record<string, number>> = {
  murarstwo: 0, obrobka_drewna: 1, garncarstwo: 2, rolnictwo: 3,
  oswojenie_zwierzat: 4, lowiectwo: 5, mistycyzm: 6,
  wymiana: 2, gospodarka_wodna: 3, kolo: 4, lucznictwo: 5,
  brazownictwo: 1,
  jezdziectwo: 0, wojskowosc: 1, pismo: 2, religia: 3, zegluga: 4,
  matematyka: 2, kodeks: 3, handel: 4,
  budownictwo: 0, hutnictwo_zelaza: 1, astronomia: 3, waluta: 4,
  inzynieria: 0, obleznictwo: 2, filozofia: 3,
  drogi_brukowane: 0, prawo: 3, medycyna: 4,
  obrobka_zelaza: 1, sztuka_wojenna: 2,
};

/** Pasma epok 1:1 z makiety. */
const ZONES: readonly { epoka: string; iconId: string; x: number; w: number; bg: string; border: string; color: string; poziomy: string }[] = [
  { epoka: 'Kamień', iconId: 'kamien', x: 24, w: 720, bg: 'rgba(122,208,160,.04)', border: 'rgba(122,208,160,.16)', color: '#8fc9a0', poziomy: 'Poziomy 1–3' },
  { epoka: 'Brąz', iconId: 'braz', x: 840, w: 720, bg: 'rgba(216,160,90,.05)', border: 'rgba(216,160,90,.18)', color: '#d8a05a', poziomy: 'Poziomy 4–6' },
  { epoka: 'Żelazo', iconId: 'zelazo', x: 1656, w: 720, bg: 'rgba(159,184,216,.04)', border: 'rgba(159,184,216,.16)', color: '#9fb8d8', poziomy: 'Poziomy 7–9' },
];

function starLabel(r: RawTech): string | null {
  if (typeof r.awansDoEpoki === 'number') {
    if (r.awansDoEpoki === 2) return '★ awans do Brązu';
    if (r.awansDoEpoki === 3) return '★ awans do Żelaza';
    return '★ awans epoki';
  }
  const m = /ko[nń]czy Epok[eę]\s*(\d)/i.exec(r.Uwagi ?? '');
  if (m) {
    const n = m[1];
    return '★ kończy ' + (n === '1' ? 'Kamień' : n === '2' ? 'Brąz' : 'Antyk');
  }
  return null;
}

function splitList(raw: string | null | undefined, sep: RegExp): string[] {
  return (raw ?? '').split(sep).map(s => s.trim()).filter(s => s !== '' && s !== '—' && s !== '-');
}

/** „Odblokowuje budynek" → budynki + jednostki (segment „Jednostki: A, B"). */
function parseUnlockBuildings(raw: string | null): { budynki: string[]; jednostki: string[] } {
  const budynki: string[] = [];
  const jednostki: string[] = [];
  for (const part of splitList(raw, /;/)) {
    const m = /^Jednostki:\s*(.*)$/i.exec(part);
    if (m) jednostki.push(...splitList(m[1] ?? '', /,/));
    else budynki.push(part);
  }
  return { budynki, jednostki };
}

function buildTreeNodes(): Map<string, TreeNode> {
  const rawList = (techData as unknown as { technologie: RawTech[] }).technologie;
  const map = new Map<string, TreeNode>();
  // Zajęte wiersze kolumn (fallback dla techów spoza tabeli makiety).
  const usedRows = new Map<number, Set<number>>();

  for (const r of rawList) {
    const id = techToSlug(r['Technologia']);
    const { budynki, jednostki } = parseUnlockBuildings(r['Odblokowuje budynek']);
    const terenFromCode = terrainUnlockLabelsForTech(r['Technologia']);
    const teren = terenFromCode.length > 0
      ? terenFromCode
      : splitList(r['Odblokowuje ulepszenie terenu'], /,/);
    const poziom = r['Poziom'];
    let row = MOCK_ROWS[id];
    const used = usedRows.get(poziom) ?? new Set<number>();
    if (row === undefined || used.has(row)) {
      row = 0;
      while (used.has(row)) row++;
    }
    used.add(row);
    usedRows.set(poziom, used);

    map.set(id, {
      id,
      nazwa: r['Technologia'],
      epoka: r['Epoka'],
      poziom,
      prereqIds: [],
      wymaganyBudynek: (r['wymagany budynek'] ?? '').trim(),
      wymaganeUlepszenie: (r['wymagane ulepszenie'] ?? '').trim(),
      odblokujeBudynki: budynki,
      odblokujeJednostki: jednostki,
      odblokujeSurowce: splitList(r['Odblokowuje surowiec.'], /,/),
      odblokujeUlepszenia: teren,
      koszt: r['Koszt nauki'],
      star: starLabel(r),
      dependents: [],
      x: COL_X[poziom] ?? (40 + (poziom - 1) * 260),
      y: ROW_Y0 + row * ROW_STEP,
    });
  }

  // Prereki (AND) po slugach + odwrotność (dependents).
  for (const r of rawList) {
    const id = techToSlug(r['Technologia']);
    const node = map.get(id);
    if (!node) continue;
    const raw = (r['Wymaga (prereq)'] ?? '').trim();
    if (raw === '' || raw === '—' || raw === '-') continue;
    for (const part of raw.split(/\s*\+\s*/)) {
      const pid = techToSlug(part.trim());
      if (map.has(pid)) {
        node.prereqIds.push(pid);
        map.get(pid)?.dependents.push(id);
      }
    }
  }
  return map;
}

const NODES: Map<string, TreeNode> = buildTreeNodes();

// ---------------------------------------------------------------------------
// Stany węzłów
// ---------------------------------------------------------------------------

type TtvStatus = 'od' | 'av' | 'ip' | 'lk';

interface TtvState {
  researched: Set<string>;
  available: Set<string>;
  targetId: string | null;
  pula: number;
  kosztCelu: number;
  postepFraction: number;
  turnsLeft: number;
  naukaRate: number;
  tempo: TempoGry;
  difficulty: GameDifficulty;
}

function readState(ownerId: number): TtvState {
  const st = cfg.getResearchState?.(ownerId) ?? null;
  return {
    researched: new Set(cfg.getResearchedTechs?.(ownerId) ?? []),
    available: new Set(cfg.getAvailableTechs?.(ownerId) ?? []),
    targetId: st?.targetId ?? null,
    pula: st?.pula ?? 0,
    kosztCelu: st?.kosztCelu ?? 0,
    postepFraction: st?.postepFraction ?? 0,
    turnsLeft: st?.turnsLeft ?? 0,
    naukaRate: cfg.getNaukaRate?.(ownerId) ?? 0,
    tempo: cfg.getTempoGry?.(ownerId) ?? 'standardowa',
    difficulty: cfg.getDifficulty?.(ownerId) ?? 'normal',
  };
}

function statusOf(node: TreeNode, s: TtvState): TtvStatus {
  if (s.researched.has(node.id)) return 'od';
  if (s.targetId === node.id) return 'ip';
  if (s.available.has(node.id)) return 'av';
  return 'lk';
}

function effectiveCost(node: TreeNode, s: TtvState): number {
  return scaledResearchCost(node.koszt, s.tempo, activeOwner, s.difficulty);
}

/** Powody blokady (realne dane): brakujące techy AND, budynek, ulepszenie, tier. */
function lockReasons(node: TreeNode, s: TtvState): string[] {
  const out: string[] = [];
  const missing = node.prereqIds
    .filter(pid => !s.researched.has(pid))
    .map(pid => NODES.get(pid)?.nazwa ?? pid);
  if (missing.length > 0) out.push('brak: ' + missing.join(' · '));
  if (node.wymaganyBudynek !== '' && cfg.isBuildingGateMet
    && !cfg.isBuildingGateMet(activeOwner, node.nazwa)) {
    out.push('wymaga budynku: ' + node.wymaganyBudynek);
  }
  if (node.wymaganeUlepszenie !== '' && cfg.isImprovementGateMet
    && !cfg.isImprovementGateMet(activeOwner, node.nazwa)) {
    out.push('wymaga ulepszenia: ' + node.wymaganeUlepszenie);
  }
  if (out.length === 0) out.push('wymaga wcześniejszych badań epoki');
  return out;
}

// ---------------------------------------------------------------------------
// Style (tokeny 1E z makiety: złoto #e8d88a, granat, Georgia, tabular-nums)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-ttv-css-v1';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-ttv-overlay{position:fixed;inset:0;z-index:450;display:flex;flex-direction:column;
  background:radial-gradient(1200px 700px at 50% 0%,#10141f,#080a12 75%);
  color:#e8e0c8;font-family:'Segoe UI',Tahoma,sans-serif;}
.civ-ttv-overlay *{box-sizing:border-box;margin:0;padding:0;}
.civ-ttv-hd{display:flex;align-items:center;gap:16px;padding:10px 22px;flex-shrink:0;
  border-bottom:1px solid rgba(232,216,138,.2);
  background:linear-gradient(90deg,rgba(232,216,138,.08),transparent 45%);}
.civ-ttv-hd .emb{width:40px;height:40px;border-radius:50%;flex-shrink:0;
  background:radial-gradient(circle at 38% 30%,#2a2416,#12100a);border:2px solid #e8d88a;
  display:flex;align-items:center;justify-content:center;color:#f4e6a8;}
.civ-ttv-hd .emb svg{width:20px;height:20px;}
.civ-ttv-hd h2{font-family:Georgia,serif;font-size:19px;font-weight:600;color:#e8d88a;line-height:1.1;white-space:nowrap;}
.civ-ttv-hd .m{font-size:11px;color:#8a8070;margin-top:2px;white-space:nowrap;}
.civ-ttv-hd .sp{flex:1;}
.civ-ttv-lgd{display:flex;gap:14px;align-items:center;flex-wrap:wrap;font-size:10.5px;color:#c8b898;}
.civ-ttv-lgd .li{display:inline-flex;align-items:center;gap:6px;white-space:nowrap;}
.civ-ttv-lgd .sw{width:13px;height:13px;border-radius:4px;flex-shrink:0;}
.civ-ttv-close{background:none;border:1px solid rgba(232,216,138,.3);border-radius:8px;color:#c8b898;
  font-size:16px;width:34px;height:34px;line-height:1;cursor:pointer;flex-shrink:0;}
.civ-ttv-close:hover{color:#e8d88a;border-color:#e8d88a;}
.civ-ttv-vp{position:relative;flex:1;overflow:hidden;cursor:grab;touch-action:none;min-height:0;}
.civ-ttv-vp.grabbing{cursor:grabbing;}
.civ-ttv-world{position:absolute;left:0;top:0;width:${WORLD_W}px;height:${WORLD_H}px;transform-origin:0 0;}
.civ-ttv-zone{position:absolute;border-radius:12px;border:1px solid;}
.civ-ttv-zlab{position:absolute;top:10px;left:0;right:0;display:flex;align-items:center;justify-content:center;
  gap:8px;font-family:Georgia,serif;font-size:13px;letter-spacing:.24em;text-transform:uppercase;}
.civ-ttv-zlab .zic{display:inline-flex;width:20px;height:20px;opacity:.9;color:currentColor;}
.civ-ttv-zlab .zic svg{width:100%;height:100%;}
.civ-ttv-zlab .tur{font-family:'Segoe UI',Tahoma,sans-serif;font-size:9px;letter-spacing:.1em;color:#8a8070;
  border:1px solid rgba(232,216,138,.2);border-radius:999px;padding:1px 8px;text-transform:none;}
.civ-ttv-tn{position:absolute;width:${NODE_W}px;min-height:64px;border-radius:9px;padding:7px 9px 6px;
  display:flex;gap:8px;align-items:flex-start;
  background:linear-gradient(180deg,rgba(24,30,42,.96),rgba(10,13,20,.97));
  border:1.5px solid rgba(232,216,138,.28);box-shadow:0 3px 10px rgba(0,0,0,.45);}
.civ-ttv-tn .ti{flex-shrink:0;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;
  justify-content:center;background:radial-gradient(circle at 38% 30%,rgba(232,216,138,.14),rgba(10,13,20,.4));
  border:1.5px solid rgba(232,216,138,.4);color:#e8d88a;}
.civ-ttv-tn .ti svg{width:19px;height:19px;}
.civ-ttv-tn .ti:empty{display:none;}
.civ-ttv-tn .tx{flex:1;min-width:0;}
.civ-ttv-tn .tx b{display:block;font-size:11.5px;color:#e8e0c8;line-height:1.2;}
.civ-ttv-tn .tx i{display:block;font-style:normal;font-size:9px;color:#8a8070;margin-top:2px;
  font-variant-numeric:tabular-nums;}
.civ-ttv-tn .tx .why{display:block;font-size:8.5px;color:#c88a7a;margin-top:2px;line-height:1.25;}
.civ-ttv-tn .st{position:absolute;top:-7px;right:-7px;width:18px;height:18px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;}
.civ-ttv-tn .st svg{width:10px;height:10px;}
.civ-ttv-tn.od{border-color:rgba(232,216,138,.55);
  background:linear-gradient(180deg,rgba(46,42,24,.92),rgba(20,17,10,.96));}
.civ-ttv-tn.od .st{background:#e8d88a;color:#2e2708;}
.civ-ttv-tn.av{border-color:#f4e6a8;cursor:pointer;
  box-shadow:0 0 14px rgba(232,216,138,.35),0 3px 10px rgba(0,0,0,.45);}
.civ-ttv-tn.av:hover{box-shadow:0 0 20px rgba(232,216,138,.5),0 3px 10px rgba(0,0,0,.45);}
.civ-ttv-tn.av .st{background:#161c28;border:1.5px solid #f4e6a8;color:#f4e6a8;}
.civ-ttv-tn.ip{border-color:#8fb6e0;box-shadow:0 0 12px rgba(58,106,208,.35);}
.civ-ttv-tn.ip .tx .ipct{display:inline;color:#8fb6e0;font-size:9px;font-weight:700;}
.civ-ttv-tn.ip .prg{display:block;height:3px;border-radius:2px;background:rgba(255,255,255,.12);
  overflow:hidden;margin-top:3px;}
.civ-ttv-tn.ip .prg i{display:block;height:100%;background:linear-gradient(90deg,#3a6ad0,#8fb6e0);margin:0;}
.civ-ttv-tn.ip .st{width:22px;height:22px;top:-9px;right:-9px;background:#0c1626;border:1.5px solid #8fb6e0;color:#8fb6e0;}
.civ-ttv-tn.ip .st svg{width:16px;height:16px;}
.civ-ttv-tn.lk{opacity:.5;}
.civ-ttv-tn.lk .st{background:#20242e;border:1.5px solid rgba(200,138,122,.6);color:#c88a7a;}
/* nawigacja (klatka C) */
.civ-ttv-chrome{position:absolute;z-index:8;display:flex;align-items:center;gap:8px;}
.civ-ttv-zpill{display:inline-flex;align-items:center;gap:2px;border-radius:9px;
  border:1px solid rgba(232,216,138,.35);
  background:linear-gradient(180deg,rgba(22,28,40,.9),rgba(8,10,16,.92));
  box-shadow:0 6px 16px rgba(0,0,0,.5);overflow:hidden;}
.civ-ttv-zpill button{width:34px;height:34px;border:none;background:transparent;color:#e8d88a;cursor:pointer;
  display:flex;align-items:center;justify-content:center;font:700 15px 'Segoe UI',Tahoma,sans-serif;}
.civ-ttv-zpill button:hover{background:rgba(232,216,138,.1);}
.civ-ttv-zpill .pc{min-width:52px;text-align:center;font:700 11px 'Segoe UI',Tahoma,sans-serif;color:#c8b898;
  font-variant-numeric:tabular-nums;}
.civ-ttv-ejump{display:inline-flex;gap:6px;}
.civ-ttv-ejump button{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 13px;border-radius:9px;
  border:1px solid rgba(232,216,138,.3);
  background:linear-gradient(180deg,rgba(22,28,40,.9),rgba(8,10,16,.92));color:#c8b898;
  font:600 10.5px 'Segoe UI',Tahoma,sans-serif;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;white-space:nowrap;}
.civ-ttv-ejump button .eic{display:inline-flex;width:15px;height:15px;}
.civ-ttv-ejump button .eic svg{width:100%;height:100%;}
.civ-ttv-ejump button:hover{border-color:#e8d88a;color:#e8d88a;}
.civ-ttv-hint{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:9;font-size:10px;
  letter-spacing:.16em;text-transform:uppercase;color:#c8b898;border:1px solid rgba(232,216,138,.25);
  border-radius:999px;padding:6px 16px;background:rgba(14,18,26,.8);white-space:nowrap;pointer-events:none;}
.civ-ttv-mini{position:absolute;right:18px;bottom:18px;z-index:9;width:236px;border-radius:11px;overflow:hidden;
  border:2px solid rgba(232,216,138,.45);background:rgba(10,13,20,.92);box-shadow:0 12px 30px rgba(0,0,0,.6);}
.civ-ttv-mini .mh{font:700 9px 'Segoe UI',Tahoma,sans-serif;letter-spacing:.12em;text-transform:uppercase;
  color:#8a8070;padding:6px 10px;border-bottom:1px solid rgba(232,216,138,.2);}
.civ-ttv-mini svg{display:block;background:rgba(8,10,16,.6);cursor:pointer;}
/* karta węzła (klatka B) */
.civ-ttv-tt{position:fixed;display:none;z-index:465;width:340px;border-radius:12px;
  border:2px solid rgba(232,216,138,.5);
  background:linear-gradient(180deg,rgba(22,28,38,.99),rgba(8,10,16,.99));
  box-shadow:0 18px 44px rgba(0,0,0,.7);overflow:hidden;pointer-events:none;
  font-family:'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-ttv-tt.lk{border-color:rgba(200,90,70,.45);}
.civ-ttv-tt.ip{border-color:rgba(143,182,224,.55);}
.civ-ttv-tt .h{padding:12px 15px 10px;border-bottom:1px solid rgba(232,216,138,.2);
  background:linear-gradient(90deg,rgba(232,216,138,.1),transparent);}
.civ-ttv-tt .h .r1{display:flex;align-items:center;justify-content:space-between;gap:10px;}
.civ-ttv-tt .h .tic{display:inline-flex;width:15px;height:15px;flex-shrink:0;color:#e8d88a;}
.civ-ttv-tt .h .tic svg{width:100%;height:100%;}
.civ-ttv-tt .h .tic:empty{display:none;}
.civ-ttv-tt .h b{font-family:Georgia,serif;font-size:16px;color:#e8d88a;font-weight:600;}
.civ-ttv-tt.lk .h b{color:#d8c8a0;}
.civ-ttv-tt.ip .h b{color:#cfe0f4;}
.civ-ttv-tt .h .ep{display:inline-flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.08em;
  text-transform:uppercase;color:#c8b898;border:1px solid rgba(232,216,138,.3);border-radius:999px;
  padding:2px 8px;white-space:nowrap;}
.civ-ttv-tt .h .ep .eic{display:inline-flex;width:12px;height:12px;}
.civ-ttv-tt .h .ep .eic svg{width:100%;height:100%;}
.civ-ttv-tt .h .sub{font-size:10.5px;color:#8a8070;margin-top:3px;}
.civ-ttv-tt .b{padding:11px 15px;display:flex;flex-direction:column;gap:9px;}
.civ-ttv-tt .row{display:flex;align-items:flex-start;gap:10px;font-size:12px;line-height:1.35;}
.civ-ttv-tt .row .k{color:#8a8070;min-width:76px;letter-spacing:.04em;text-transform:uppercase;
  font-size:9.5px;font-weight:700;padding-top:2px;flex-shrink:0;}
.civ-ttv-tt .row .v{color:#e8e0c8;flex:1;font-variant-numeric:tabular-nums;}
.civ-ttv-tt .chips{display:flex;flex-wrap:wrap;gap:5px;}
.civ-ttv-tt .ch{display:inline-flex;align-items:center;gap:5px;font-size:10px;border-radius:999px;
  padding:2px 9px;border:1px solid rgba(232,216,138,.3);color:#e8d0a8;background:rgba(232,216,138,.05);
  white-space:nowrap;}
.civ-ttv-tt .ch.u{border-color:rgba(143,182,224,.4);color:#8fb6e0;background:rgba(58,106,208,.06);}
.civ-ttv-tt .ch.s{border-color:rgba(200,168,120,.4);color:#c8a878;background:rgba(200,168,120,.06);}
.civ-ttv-tt .dep{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;border-radius:6px;
  padding:3px 9px;white-space:nowrap;}
.civ-ttv-tt .dep .di{display:inline-flex;width:12px;height:12px;flex-shrink:0;}
.civ-ttv-tt .dep .di svg{width:100%;height:100%;}
.civ-ttv-tt .dep .di:empty{display:none;}
.civ-ttv-tt .dep.ok{color:#7ad0a0;border:1px solid rgba(122,208,160,.35);background:rgba(122,208,160,.06);}
.civ-ttv-tt .dep.no{color:#ff9b8a;border:1px solid rgba(200,90,70,.4);background:rgba(200,90,70,.07);}
.civ-ttv-tt .ft{padding:9px 15px;border-top:1px solid rgba(232,216,138,.16);font-size:10px;color:#8a8070;
  background:rgba(232,216,138,.03);}
.civ-ttv-tt.lk .ft{color:#c88a7a;}
.civ-ttv-tt.ip .ft{color:#8fb6e0;}
/* potwierdzenie zmiany celu */
.civ-ttv-confirm-back{position:fixed;inset:0;z-index:470;background:rgba(0,0,0,.55);
  display:flex;align-items:center;justify-content:center;}
.civ-ttv-confirm{width:400px;max-width:92vw;border-radius:12px;border:2px solid rgba(232,216,138,.5);
  background:linear-gradient(180deg,rgba(22,28,38,.99),rgba(8,10,16,.99));
  box-shadow:0 18px 44px rgba(0,0,0,.7);padding:16px 18px;color:#e8e0c8;
  font-family:'Segoe UI',Tahoma,sans-serif;}
.civ-ttv-confirm h3{font-family:Georgia,serif;font-size:15px;color:#e8d88a;font-weight:600;margin-bottom:8px;}
.civ-ttv-confirm p{font-size:12px;line-height:1.5;color:#c8b898;margin-bottom:14px;
  font-variant-numeric:tabular-nums;}
.civ-ttv-confirm p b{color:#e8d88a;}
.civ-ttv-confirm .btns{display:flex;gap:8px;justify-content:flex-end;}
.civ-ttv-confirm button{height:32px;padding:0 16px;border-radius:8px;cursor:pointer;
  font:600 11.5px 'Segoe UI',Tahoma,sans-serif;}
.civ-ttv-confirm .ok{border:1px solid #f4e6a8;color:#2e2708;background:#e8d88a;}
.civ-ttv-confirm .ok:hover{background:#f4e6a8;}
.civ-ttv-confirm .no{border:1px solid rgba(232,216,138,.3);color:#c8b898;background:transparent;}
.civ-ttv-confirm .no:hover{border-color:#e8d88a;color:#e8d88a;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

// ---------------------------------------------------------------------------
// Pomocnicze
// ---------------------------------------------------------------------------

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const SVG_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.2"><path d="M4.5 12.5 10 18 19.5 7"></path></svg>';
const SVG_CHEV = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6"><path d="M8 5l8 7-8 7"></path></svg>';
const SVG_LOCK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="11" width="14" height="9" rx="2"></rect><path d="M8 11V8a4 4 0 0 1 8 0v3"></path></svg>';
const SVG_EMB = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="5" cy="12" r="2.2"></circle><circle cx="12" cy="5" r="2.2"></circle><circle cx="12" cy="19" r="2.2"></circle><circle cx="19" cy="12" r="2.2"></circle><path d="M7 11 10 6M7 13l3 5M14 6l3 5M14 18l3-5"></path></svg>';
const SVG_FIT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"></path></svg>';

function epochIconIdFor(epoka: string): string {
  if (epoka === 'Brąz') return 'braz';
  if (epoka === 'Żelazo') return 'zelazo';
  return 'kamien';
}

const TEMPO_LABEL: Readonly<Record<TempoGry, string>> = {
  szybka: 'szybkie', standardowa: 'standardowe', dluga: 'długie',
};

// ---------------------------------------------------------------------------
// Stan modułu / DOM
// ---------------------------------------------------------------------------

let overlayEl: HTMLDivElement | null = null;
let vpEl: HTMLDivElement | null = null;
let worldEl: HTMLDivElement | null = null;
let tooltipEl: HTMLDivElement | null = null;
let miniSvgEl: SVGSVGElement | null = null;
let miniVpRect: SVGRectElement | null = null;
let zoomPctEl: HTMLSpanElement | null = null;
let confirmBackEl: HTMLDivElement | null = null;
let activeOwner = 0;

// Transformacja widoku
let scale = 0.6;
let tx = 0;
let ty = 0;
const MIN_SCALE = 0.2;
const MAX_SCALE = 2.5;

// Pan
let panActive = false;
let panMoved = false;
let panStartX = 0;
let panStartY = 0;
let panStartTx = 0;
let panStartTy = 0;

function clampScale(s: number): number {
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, s));
}

function applyTransform(): void {
  if (worldEl === null) return;
  worldEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  if (zoomPctEl !== null) zoomPctEl.textContent = Math.round(scale * 100) + '%';
  updateMiniViewport();
}

function fitToView(): void {
  if (vpEl === null) return;
  const vw = vpEl.clientWidth;
  const vh = vpEl.clientHeight;
  if (vw <= 0 || vh <= 0) return;
  scale = clampScale(Math.min(vw / WORLD_W, vh / WORLD_H));
  tx = Math.round((vw - WORLD_W * scale) / 2);
  ty = Math.round((vh - WORLD_H * scale) / 2);
  applyTransform();
}

function zoomAt(cx: number, cy: number, factor: number): void {
  const ns = clampScale(scale * factor);
  if (ns === scale) return;
  const wx = (cx - tx) / scale;
  const wy = (cy - ty) / scale;
  scale = ns;
  tx = cx - wx * scale;
  ty = cy - wy * scale;
  applyTransform();
}

function jumpToZone(zoneX: number): void {
  if (vpEl === null) return;
  tx = -zoneX * scale + 24;
  applyTransform();
}

function updateMiniViewport(): void {
  if (miniVpRect === null || vpEl === null) return;
  const sx = 232 / WORLD_W;
  const sy = 104 / WORLD_H;
  const x = Math.max(0, (-tx / scale) * sx);
  const y = Math.max(0, (-ty / scale) * sy);
  const w = Math.min(232, (vpEl.clientWidth / scale) * sx);
  const h = Math.min(104, (vpEl.clientHeight / scale) * sy);
  miniVpRect.setAttribute('x', x.toFixed(1));
  miniVpRect.setAttribute('y', y.toFixed(1));
  miniVpRect.setAttribute('width', Math.max(4, w - Math.max(0, x + w - 232)).toFixed(1));
  miniVpRect.setAttribute('height', Math.max(4, h - Math.max(0, y + h - 104)).toFixed(1));
}

// ---------------------------------------------------------------------------
// Render świata (pasma + węzły)
// ---------------------------------------------------------------------------

function nodeInfoLine(node: TreeNode, st: TtvStatus, s: TtvState): string {
  const parts: string[] = [effectiveCost(node, s) + ' PN', 'Poziom ' + node.poziom];
  if (node.star !== null) parts.push(node.star);
  if (st === 'av') parts.push('kliknij, by badać');
  return parts.join(' · ');
}

function renderWorldHTML(s: TtvState): string {
  const out: string[] = [];
  // Pasma epok
  for (const z of ZONES) {
    const count = Array.from(NODES.values()).filter(n => n.epoka === z.epoka).length;
    out.push(
      `<div class="civ-ttv-zone" style="left:${z.x}px;top:14px;width:${z.w}px;bottom:110px;background:${z.bg};border-color:${z.border}">`
      + `<div class="civ-ttv-zlab" style="color:${z.color}">`
      + `<span class="zic">${epochIconSvg(z.iconId, 20)}</span>`
      + `Epoka ${esc(z.epoka === 'Kamień' ? 'Kamienia' : z.epoka === 'Brąz' ? 'Brązu' : 'Żelaza')} `
      + `<span class="tur">${z.poziomy} · ${count} technologii</span>`
      + `</div></div>`,
    );
  }
  // Węzły
  for (const node of NODES.values()) {
    const st = statusOf(node, s);
    let inner = `<span class="ti">${techIconSvg(node.nazwa, 19) ?? ''}</span>`;
    inner += `<span class="tx"><b>${esc(node.nazwa)}</b>`;
    if (st === 'ip') {
      const pct = Math.max(0, Math.min(100, Math.round(s.postepFraction * 100)));
      const eta = s.turnsLeft > 0 ? s.turnsLeft + ' tur' : '<1 tury';
      const parts: string[] = [effectiveCost(node, s) + ' PN', 'Poziom ' + node.poziom];
      if (node.star !== null) parts.push(node.star);
      inner += `<i>${esc(parts.join(' · '))} · <b class="ipct">${pct}% · ${esc(eta)}</b></i>`
        + `<span class="prg"><i style="width:${pct}%"></i></span>`;
    } else {
      inner += `<i>${esc(nodeInfoLine(node, st, s))}</i>`;
      if (st === 'lk') {
        inner += `<span class="why">${esc(lockReasons(node, s).join(' · '))}</span>`;
      }
    }
    inner += '</span>';
    const badge = st === 'od' ? SVG_CHECK
      : st === 'av' ? SVG_CHEV
        : st === 'ip' ? scienceProgressRingHtml(s.postepFraction, 18, 3)
          : SVG_LOCK;
    inner += `<span class="st">${badge}</span>`;
    out.push(
      `<div class="civ-ttv-tn ${st}" style="left:${node.x}px;top:${node.y}px" data-id="${esc(node.id)}" data-st="${st}">${inner}</div>`,
    );
  }
  return out.join('');
}

function renderMini(s: TtvState): void {
  if (miniSvgEl === null) return;
  const NS = 'http://www.w3.org/2000/svg';
  miniSvgEl.innerHTML = '';
  const sx = 232 / WORLD_W;
  const sy = 104 / WORLD_H;
  for (const z of ZONES) {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', (z.x * sx).toFixed(1));
    r.setAttribute('y', '4');
    r.setAttribute('width', (z.w * sx).toFixed(1));
    r.setAttribute('height', '96');
    r.setAttribute('rx', '3');
    r.setAttribute('fill', z.bg.replace(/\.0[45]\)/, '.14)'));
    miniSvgEl.appendChild(r);
  }
  for (const node of NODES.values()) {
    const st = statusOf(node, s);
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', ((node.x + 40) * sx).toFixed(1));
    r.setAttribute('y', ((node.y + 12) * sy).toFixed(1));
    r.setAttribute('width', '9');
    r.setAttribute('height', '4');
    r.setAttribute('rx', '1');
    const fill = st === 'od' ? '#e8d88a'
      : st === 'av' ? '#f4e6a8'
        : st === 'ip' ? '#8fb6e0'
          : 'rgba(200,184,152,.35)';
    r.setAttribute('fill', fill);
    miniSvgEl.appendChild(r);
  }
  miniVpRect = document.createElementNS(NS, 'rect') as SVGRectElement;
  miniVpRect.setAttribute('fill', 'none');
  miniVpRect.setAttribute('stroke', 'rgba(232,216,138,.85)');
  miniVpRect.setAttribute('stroke-width', '1.5');
  miniVpRect.setAttribute('rx', '3');
  miniSvgEl.appendChild(miniVpRect);
  updateMiniViewport();
}

// ---------------------------------------------------------------------------
// Karta węzła (hover)
// ---------------------------------------------------------------------------

function depChip(ok: boolean, label: string, iconHtml?: string | null): string {
  const icon = iconHtml ? `<span class="di">${iconHtml}</span>` : '';
  return `<span class="dep ${ok ? 'ok' : 'no'}">${icon}${ok ? '✓' : '✗'} ${esc(label)}</span>`;
}

function unlockChips(node: TreeNode): string {
  const chips: string[] = [];
  for (const b of node.odblokujeBudynki) chips.push(`<span class="ch">${esc(b)}</span>`);
  for (const u of node.odblokujeUlepszenia) chips.push(`<span class="ch">teren: ${esc(u)}</span>`);
  for (const su of node.odblokujeSurowce) chips.push(`<span class="ch s">surowiec: ${esc(su)}</span>`);
  for (const j of node.odblokujeJednostki) chips.push(`<span class="ch u">${esc(j)}</span>`);
  return chips.join('');
}

function buildCardHTML(node: TreeNode, st: TtvStatus, s: TtvState): string {
  const eff = effectiveCost(node, s);
  const mult = TEMPO_GRY[s.tempo];
  const tempoTxt = `tempo ${TEMPO_LABEL[s.tempo]} ×${mult}`;
  const rate = s.naukaRate;
  const deps = node.dependents.map(d => NODES.get(d)?.nazwa ?? d);

  const tIcon = techIconSvg(node.nazwa, 15);
  let h = `<div class="h"><div class="r1"><span class="tic">${tIcon ?? ''}</span><b>${esc(node.nazwa)}</b>`
    + `<span class="ep"><span class="eic">${epochIconSvg(epochIconIdFor(node.epoka), 12)}</span>`
    + `${esc(node.epoka)} · Poziom ${node.poziom}</span></div>`;
  if (node.star !== null) h += `<div class="sub">${esc(node.star)}</div>`;
  h += '</div><div class="b">';

  // Koszt / postęp
  if (st === 'ip') {
    const pct = Math.max(0, Math.min(100, Math.round(s.postepFraction * 100)));
    const etaTxt = s.turnsLeft > 0
      ? `<b style="color:#8fb6e0">${s.turnsLeft} tur do końca</b>` + (rate > 0 ? ` przy ${rate} PN/turę` : '')
      : '<b style="color:#8fb6e0">&lt;1 tury do końca</b>';
    h += `<div class="row"><span class="k">Postęp</span><span class="v">`
      + `<b style="color:#8fb6e0">${pct}%</b> · ${Math.round(s.pula)} / ${Math.round(s.kosztCelu)} PN · ${etaTxt}</span></div>`;
  } else {
    h += `<div class="row"><span class="k">Koszt nauki</span><span class="v">`
      + `<b style="color:#e8d88a">${eff} PN</b> · baza ${node.koszt} PN · ${esc(tempoTxt)}</span></div>`;
    if (st === 'av') {
      const remaining = Math.max(0, eff - s.pula);
      const czas = rate > 0
        ? `≈ ${Math.max(1, Math.ceil(remaining / rate))} tur przy ${rate} PN/turę`
        : '— (brak przychodu Nauki)';
      h += `<div class="row"><span class="k">Czas</span><span class="v">${esc(czas)}</span></div>`;
    }
  }

  // Wymagania AND (techy + budynek + ulepszenie)
  const reqChips: string[] = [];
  for (const pid of node.prereqIds) {
    const pname = NODES.get(pid)?.nazwa ?? pid;
    reqChips.push(depChip(s.researched.has(pid), pname, techIconSvg(pname, 12)));
  }
  if (node.wymaganyBudynek !== '') {
    const ok = cfg.isBuildingGateMet ? cfg.isBuildingGateMet(activeOwner, node.nazwa) : true;
    reqChips.push(depChip(ok, 'budynek: ' + node.wymaganyBudynek));
  }
  if (node.wymaganeUlepszenie !== '') {
    const ok = cfg.isImprovementGateMet ? cfg.isImprovementGateMet(activeOwner, node.nazwa) : true;
    reqChips.push(depChip(ok, 'ulepszenie: ' + node.wymaganeUlepszenie));
  }
  if (reqChips.length > 0) {
    h += `<div class="row"><span class="k">Wymaga</span><span class="v chips">${reqChips.join('')}</span></div>`;
  }

  // Odblokowania
  const chips = unlockChips(node);
  if (chips !== '') {
    h += `<div class="row"><span class="k">Odblokowuje</span><span class="v chips">${chips}</span></div>`;
  } else if (deps.length > 0) {
    h += `<div class="row"><span class="k">Odblokowuje</span><span class="v">— (prereq dla: ${esc(deps.join(' · '))})</span></div>`;
  }

  h += '</div>';

  // Stopka wg stanu
  let ft: string;
  if (st === 'av') {
    ft = 'Kliknij = rozpocznij badanie' + (deps.length > 0 ? ' · prereq dla: ' + esc(deps.join(' · ')) : '');
  } else if (st === 'ip') {
    ft = 'W trakcie — pierścień postępu jak chip Nauki w HUD';
  } else if (st === 'od') {
    ft = '✓ Odkryta' + (deps.length > 0 ? ' · prereq dla: ' + esc(deps.join(' · ')) : '');
  } else {
    ft = 'Zablokowana — ' + esc(lockReasons(node, s).join(' · '));
  }
  h += `<div class="ft">${ft}</div>`;
  return h;
}

function showCardFor(nodeEl: HTMLElement, node: TreeNode, s: TtvState): void {
  if (tooltipEl === null) return;
  const st = (nodeEl.getAttribute('data-st') ?? 'lk') as TtvStatus;
  tooltipEl.className = 'civ-ttv-tt ' + st;
  tooltipEl.innerHTML = buildCardHTML(node, st, s);
  tooltipEl.style.display = 'block';
  const r = nodeEl.getBoundingClientRect();
  const tw = tooltipEl.offsetWidth;
  const th = tooltipEl.offsetHeight;
  let x = r.right + 12;
  let y = r.top;
  if (x + tw > window.innerWidth - 8) x = r.left - tw - 12;
  if (x < 8) x = 8;
  if (y + th > window.innerHeight - 8) y = window.innerHeight - th - 8;
  if (y < 8) y = 8;
  tooltipEl.style.left = x + 'px';
  tooltipEl.style.top = y + 'px';
}

function hideCard(): void {
  if (tooltipEl !== null) tooltipEl.style.display = 'none';
}

// ---------------------------------------------------------------------------
// Potwierdzenie zmiany celu
// ---------------------------------------------------------------------------

function closeConfirm(): void {
  confirmBackEl?.remove();
  confirmBackEl = null;
}

function openConfirm(node: TreeNode, s: TtvState): void {
  closeConfirm();
  const curNode = s.targetId !== null ? NODES.get(s.targetId) : undefined;
  const pct = Math.max(0, Math.min(100, Math.round(s.postepFraction * 100)));
  confirmBackEl = document.createElement('div');
  confirmBackEl.className = 'civ-ttv-confirm-back';
  confirmBackEl.innerHTML =
    '<div class="civ-ttv-confirm">'
    + '<h3>Zmiana celu badań</h3>'
    + `<p>W trakcie: <b>${esc(curNode?.nazwa ?? s.targetId ?? '?')}</b> (${pct}%). `
    + `Pula PN zostaje w banku — rozpocząć badanie: <b>${esc(node.nazwa)}</b>?</p>`
    + '<div class="btns">'
    + '<button type="button" class="no">Anuluj</button>'
    + '<button type="button" class="ok">Rozpocznij badanie</button>'
    + '</div></div>';
  confirmBackEl.addEventListener('click', (e) => {
    if (e.target === confirmBackEl) closeConfirm();
  });
  confirmBackEl.querySelector('.no')?.addEventListener('click', () => closeConfirm());
  confirmBackEl.querySelector('.ok')?.addEventListener('click', () => {
    closeConfirm();
    cfg.onStartResearch?.(node.id);
    render();
  });
  document.body.appendChild(confirmBackEl);
}

function tryStartResearch(node: TreeNode): void {
  const s = readState(activeOwner);
  if (statusOf(node, s) !== 'av') return;
  // Potwierdzenie tylko gdy inne ZNANE badanie w trakcie (targetId spoza
  // tech.json — np. relikt starej nazwy w savie — traktujemy jak brak celu,
  // spójnie z hubem badań).
  const cur = s.targetId !== null ? NODES.get(s.targetId) : undefined;
  if (cur !== undefined && cur.id !== node.id && !s.researched.has(cur.id)) {
    openConfirm(node, s);
    return;
  }
  cfg.onStartResearch?.(node.id);
  render();
}

// ---------------------------------------------------------------------------
// Render główny
// ---------------------------------------------------------------------------

function render(): void {
  if (worldEl === null) return;
  try {
    const s = readState(activeOwner);
    worldEl.innerHTML = renderWorldHTML(s);
    renderMini(s);
    hideCard();
  } catch (err) {
    console.warn('[Drzewko] Błąd renderu widoku siatki:', err);
  }
}

// ---------------------------------------------------------------------------
// Interakcje
// ---------------------------------------------------------------------------

function onKeyDownCapture(e: KeyboardEvent): void {
  if (e.key !== 'Escape') return;
  e.preventDefault();
  e.stopPropagation();
  if (confirmBackEl !== null) { closeConfirm(); return; }
  hideTechTreeView();
}

function bindViewportInteractions(): void {
  if (vpEl === null) return;
  const vp = vpEl;

  vp.addEventListener('wheel', (e: WheelEvent) => {
    e.preventDefault();
    const r = vp.getBoundingClientRect();
    zoomAt(e.clientX - r.left, e.clientY - r.top, e.deltaY < 0 ? 1.15 : 1 / 1.15);
  }, { passive: false });

  vp.addEventListener('pointerdown', (e: PointerEvent) => {
    const t = e.target as Element | null;
    if (t?.closest('.civ-ttv-chrome, .civ-ttv-mini')) return;
    panActive = true;
    panMoved = false;
    panStartX = e.clientX;
    panStartY = e.clientY;
    panStartTx = tx;
    panStartTy = ty;
    vp.classList.add('grabbing');
    // UWAGA: capture dopiero przy realnym ruchu (pointermove) — capture w
    // pointerdown przekierowuje pointerup na viewport i zabija 'click' na węźle.
  });

  vp.addEventListener('pointermove', (e: PointerEvent) => {
    if (!panActive) return;
    const dx = e.clientX - panStartX;
    const dy = e.clientY - panStartY;
    if (!panMoved && Math.abs(dx) + Math.abs(dy) > 5) {
      panMoved = true;
      hideCard();
      try { vp.setPointerCapture(e.pointerId); } catch { /* noop */ }
    }
    if (panMoved) {
      tx = panStartTx + dx;
      ty = panStartTy + dy;
      applyTransform();
    }
  });

  const endPan = (e: PointerEvent): void => {
    if (!panActive) return;
    panActive = false;
    vp.classList.remove('grabbing');
    try { vp.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };
  vp.addEventListener('pointerup', endPan);
  vp.addEventListener('pointercancel', endPan);

  vp.addEventListener('click', (e: MouseEvent) => {
    if (panMoved) { panMoved = false; return; }
    const el = (e.target as Element | null)?.closest('.civ-ttv-tn');
    if (!(el instanceof HTMLElement)) return;
    const id = el.getAttribute('data-id');
    if (id === null) return;
    const node = NODES.get(id);
    if (node === undefined) return;
    if (el.getAttribute('data-st') === 'av') tryStartResearch(node);
  });

  vp.addEventListener('mouseover', (e: MouseEvent) => {
    if (panActive && panMoved) return;
    const el = (e.target as Element | null)?.closest('.civ-ttv-tn');
    if (!(el instanceof HTMLElement)) return;
    const id = el.getAttribute('data-id');
    const node = id !== null ? NODES.get(id) : undefined;
    if (node === undefined) return;
    showCardFor(el, node, readState(activeOwner));
  });

  vp.addEventListener('mouseout', (e: MouseEvent) => {
    const from = (e.target as Element | null)?.closest('.civ-ttv-tn');
    const to = (e.relatedTarget as Element | null)?.closest('.civ-ttv-tn');
    if (from !== null && from === to) return;
    hideCard();
  });
}

// ---------------------------------------------------------------------------
// Budowa DOM
// ---------------------------------------------------------------------------

function buildDom(): void {
  if (overlayEl !== null) return;
  ensureStyles();

  overlayEl = document.createElement('div');
  overlayEl.className = 'civ-ttv-overlay';

  // Nagłówek (jak .hd z makiety)
  const hd = document.createElement('div');
  hd.className = 'civ-ttv-hd';
  hd.innerHTML =
    `<span class="emb">${SVG_EMB}</span>`
    + '<div><h2>Badania — drzewo technologii</h2>'
    + '<div class="m">Kamień → Brąz → Żelazo · oś: Poziom 1–9 · bramki AND · zależności opisowo (bez krawędzi)</div></div>'
    + '<span class="sp"></span>'
    + '<div class="civ-ttv-lgd">'
    + '<span class="li"><span class="sw" style="background:rgba(232,216,138,.25);border:1.5px solid rgba(232,216,138,.6)"></span>odkryta</span>'
    + '<span class="li"><span class="sw" style="background:#161c28;border:1.5px solid #f4e6a8;box-shadow:0 0 6px rgba(232,216,138,.5)"></span>dostępna</span>'
    + '<span class="li"><span class="sw" style="background:#0c1626;border:1.5px solid #8fb6e0"></span>w trakcie</span>'
    + '<span class="li"><span class="sw" style="background:#20242e;border:1.5px solid rgba(200,138,122,.5);opacity:.6"></span>zablokowana</span>'
    + '</div>'
    + '<button type="button" class="civ-ttv-close" aria-label="Zamknij drzewko (Esc)" title="Zamknij (Esc)">✕</button>';
  overlayEl.appendChild(hd);
  hd.querySelector('.civ-ttv-close')?.addEventListener('click', () => hideTechTreeView());

  // Viewport + świat
  vpEl = document.createElement('div');
  vpEl.className = 'civ-ttv-vp';
  worldEl = document.createElement('div');
  worldEl.className = 'civ-ttv-world';
  vpEl.appendChild(worldEl);

  // Nawigacja: zoom (lewo-góra)
  const zc = document.createElement('div');
  zc.className = 'civ-ttv-chrome';
  zc.style.top = '14px';
  zc.style.left = '18px';
  zc.innerHTML =
    '<span class="civ-ttv-zpill">'
    + '<button type="button" data-z="out" title="Oddal">−</button>'
    + '<span class="pc">100%</span>'
    + '<button type="button" data-z="in" title="Przybliż">+</button>'
    + `<button type="button" data-z="fit" title="Dopasuj do okna" style="border-left:1px solid rgba(232,216,138,.2)">${SVG_FIT}</button>`
    + '</span>';
  vpEl.appendChild(zc);
  zoomPctEl = zc.querySelector('.pc');
  zc.querySelector('[data-z="out"]')?.addEventListener('click', () => {
    if (vpEl) zoomAt(vpEl.clientWidth / 2, vpEl.clientHeight / 2, 1 / 1.25);
  });
  zc.querySelector('[data-z="in"]')?.addEventListener('click', () => {
    if (vpEl) zoomAt(vpEl.clientWidth / 2, vpEl.clientHeight / 2, 1.25);
  });
  zc.querySelector('[data-z="fit"]')?.addEventListener('click', () => fitToView());

  // Nawigacja: skok do epoki (środek-góra)
  const ec = document.createElement('div');
  ec.className = 'civ-ttv-chrome';
  ec.style.top = '14px';
  ec.style.left = '50%';
  ec.style.transform = 'translateX(-50%)';
  const ej = document.createElement('span');
  ej.className = 'civ-ttv-ejump';
  for (const z of ZONES) {
    const b = document.createElement('button');
    b.type = 'button';
    b.innerHTML = `<span class="eic">${epochIconSvg(z.iconId, 15)}</span>${esc(z.epoka)}`;
    b.addEventListener('click', () => jumpToZone(z.x));
    ej.appendChild(b);
  }
  ec.appendChild(ej);
  vpEl.appendChild(ec);

  // Podpowiedź (dół-środek)
  const hint = document.createElement('div');
  hint.className = 'civ-ttv-hint';
  hint.textContent = 'Scroll = zoom · przeciągnij = pan · klik epoki = skok · Esc = zamknij';
  vpEl.appendChild(hint);

  // Minimapa (prawo-dół)
  const mini = document.createElement('div');
  mini.className = 'civ-ttv-mini';
  mini.innerHTML = '<div class="mh">Minimapa drzewa</div>'
    + '<svg width="232" height="104" viewBox="0 0 232 104"></svg>';
  vpEl.appendChild(mini);
  miniSvgEl = mini.querySelector('svg');
  miniSvgEl?.addEventListener('click', (e: MouseEvent) => {
    if (vpEl === null || miniSvgEl === null) return;
    const r = miniSvgEl.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / 232) * WORLD_W;
    const wy = ((e.clientY - r.top) / 104) * WORLD_H;
    tx = vpEl.clientWidth / 2 - wx * scale;
    ty = vpEl.clientHeight / 2 - wy * scale;
    applyTransform();
  });

  overlayEl.appendChild(vpEl);
  document.body.appendChild(overlayEl);

  // Karta węzła
  tooltipEl = document.createElement('div');
  tooltipEl.className = 'civ-ttv-tt';
  document.body.appendChild(tooltipEl);

  bindViewportInteractions();
}

// ---------------------------------------------------------------------------
// API publiczne
// ---------------------------------------------------------------------------

/** Pokaż pełnoekranowy graf drzewa technologii (siatka bez krawędzi). */
export function showTechTreeView(ownerId: number = 0): void {
  activeOwner = ownerId;
  buildDom();
  if (overlayEl === null) return;
  overlayEl.style.display = 'flex';
  render();
  fitToView();
  document.addEventListener('keydown', onKeyDownCapture, true);
}

/** Ukryj graf (bez usuwania z DOM). */
export function hideTechTreeView(): void {
  closeConfirm();
  hideCard();
  if (overlayEl !== null) overlayEl.style.display = 'none';
  document.removeEventListener('keydown', onKeyDownCapture, true);
}

export function isTechTreeViewOpen(): boolean {
  return overlayEl !== null && overlayEl.style.display !== 'none' && overlayEl.style.display !== '';
}

/** Odśwież widok gdy otwarty (np. po zmianie celu / końcu tury). */
export function refreshTechTreeViewIfOpen(): void {
  if (isTechTreeViewOpen()) render();
}
