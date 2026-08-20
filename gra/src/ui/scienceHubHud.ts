/**
 * scienceHubHud.ts — hub badań (postęp + lista tech + wejście do drzewka).
 * Q-NAUKA-1: lista + postęp; drzewko osobno (sciencePicker dock).
 * Design v1 reskin (PANEL-BADANIA-v1-2026-07-26).
 */

import { scienceOwlIconHtml } from './icons/scienceOwlIcon';
import { brandIconSvg } from './icons/brandAssets';
import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { techIconSvg } from './techIcons';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';
import { RESEARCH_QUEUE_MAX } from '../game/playerState';
import type { EraGateInfo } from '../game/era-gate-ui';
import { showTechDiscoveryNotice } from './techDiscoveryNotice';

export interface ScienceHubProgress {
  targetName: string | null;
  targetId: string | null;
  pula: number;
  kosztCelu: number;
  postepFraction: number;
  turnsLeft: number;
  naukaRate?: number;
}

export interface ScienceHubEntry {
  id: string;
  name: string;
  epoka: string;
  koszt: number;
  unlockLine?: string;
  locked: boolean;
  isTarget: boolean;
  lockHint?: string;
}

/**
 * TEMAT 10 (C-RES-Q1=C): pozycja w planie badań (aktywny cel + kolejka).
 * `pos` to numer 1..RESEARCH_QUEUE_MAX (1 = aktywny cel, silnik: playerState.ts).
 */
export interface ScienceHubPlanEntry {
  id: string;
  name: string;
  isActive: boolean;
  pos: number;
}

/** Max pozycji w planie badań — mirror RESEARCH_QUEUE_MAX (playerState.ts). */
const PLAN_MAX = RESEARCH_QUEUE_MAX;

export interface ScienceHubHudConfig {
  getProgress: () => ScienceHubProgress | null;
  getEntries: () => ScienceHubEntry[];
  onSelectTech: (techId: string) => void;
  onOpenFullTree: () => void;
  onShowInTree: (techId: string) => void;
  /** Pełnoekranowy graf drzewa (siatka bez krawędzi — techTreeView). */
  onOpenTreeView?: () => void;
  onClose?: () => void;
  /** Gdy drzewko otwarte — Esc obsługuje drzewko, nie hub. */
  isTreeOpen?: () => boolean;
  /** TEMAT 10: plan badań (aktywny cel + kolejka, do RESEARCH_QUEUE_MAX pozycji). */
  getPlan?: () => ScienceHubPlanEntry[];
  /** Dodaj tech do planu (lub ustaw jako aktywny gdy plan pusty). */
  onEnqueue?: (techId: string) => void;
  /** Usuń tech z planu (aktywny cel lub pozycję w kolejce). */
  onDequeue?: (techId: string) => void;
  /** C-RES-Q2=C: drag&drop — przestaw pozycję fromIdx→toIdx (indeksy w getPlan()). */
  onReorder?: (fromIdx: number, toIdx: number) => void;
  /**
   * R-EPOKA-CUD-ZAKRES-Q1=B: stan bramki awansu epoki bieżącej (tech + cud własny E).
   * Panel renderowany TYLKO gdy `info.blocked` (patrz decyzja UX w raporcie Operatora —
   * silnik przelicza erę automatycznie tę samą turę gdy oba warunki są spełnione, więc
   * stan "spełnione, ale jeszcze nie awansowano" praktycznie nie występuje na ekranie).
   */
  getEraGateInfo?: () => EraGateInfo | null;
}

export interface ScienceHubHudApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-science-hub-hud-css-v2';
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
const PANEL_W = 340;
const LEFT_INSET = SIDE_PANEL_LEFT;

/** Ikona grafu (4 węzły) — przycisk „Drzewo technologii" (nie duplikat sowy). */
const TREE_GRAPH_ICON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><circle cx="5" cy="12" r="2"></circle><circle cx="12" cy="5" r="2"></circle><circle cx="12" cy="19" r="2"></circle><circle cx="19" cy="12" r="2"></circle></svg>';

const PLUS_ICON_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"></path></svg>';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-science-hub-hud{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:260px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:313;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(90deg,rgba(8,11,18,.98) 0%,rgba(12,16,26,.95) 88%,rgba(12,16,26,.9) 100%);
  border-right:2px solid rgba(232,216,138,.4);box-shadow:8px 0 30px rgba(0,0,0,.55);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;
  --panel-grad:linear-gradient(180deg,rgba(22,28,38,.95),rgba(10,13,20,.96));
  --border-gold:rgba(232,216,138,.28);--muted:#8a8070;--gold:#e8d88a;--gold-bright:#f4e6a8;
  --sci:#5a9bd4;--sci-light:#8fb6e0;--circle-grad:linear-gradient(180deg,#f0dc88,#c9a938);--circle-text:#2e2708;}
.civ-science-hub-hud.open{display:flex;}
.civ-science-hub-hud .sh-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45rem 0.5rem 0.55rem;}
.civ-science-hub-hud .sh-scroll::-webkit-scrollbar{width:6px;}
.civ-science-hub-hud .sh-scroll::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:3px;}
.civ-science-hub-hud .panel{background:var(--panel-grad);border:1px solid var(--border-gold);border-radius:8px;
  padding:0.55em 0.65em;box-shadow:0 1px 0 rgba(255,255,255,.02);margin-bottom:0.45em;}
.civ-science-hub-hud .ptitle{font-family:Georgia,'Times New Roman',serif;font-size:0.95em;font-weight:600;
  letter-spacing:.05em;color:var(--gold);border-bottom:1px solid rgba(232,216,138,.18);padding-bottom:0.4em;margin-bottom:0.5em;
  display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-science-hub-hud .sh-title-owl{display:inline-flex;align-items:center;gap:0.4em;}
.civ-science-hub-hud .sh-title-owl .civ-science-owl-ic{width:19px;height:19px;color:var(--gold);}
.civ-science-hub-hud .sh-close{background:none;border:none;color:var(--muted);font-size:1.15em;line-height:1;
  cursor:pointer;padding:0.1em 0.25em;border-radius:4px;}
.civ-science-hub-hud .sh-close:hover{color:var(--gold);background:rgba(232,216,138,.1);}
.civ-science-hub-hud .sh-prog{margin-bottom:0.35em;}
.civ-science-hub-hud .sh-prog-target{font-family:Georgia,'Times New Roman',serif;font-size:1em;font-weight:600;
  color:var(--gold);line-height:1.25;display:flex;align-items:center;gap:0.4em;}
.civ-science-hub-hud .sh-prog-target.sh-clickable{cursor:pointer;border-radius:4px;padding:2px 3px;margin:-2px -3px;}
.civ-science-hub-hud .sh-prog-target.sh-clickable:hover{background:rgba(232,216,138,.08);}
.civ-science-hub-hud .sh-prog-target .sh-owl{display:inline-flex;align-items:center;}
.civ-science-hub-hud .sh-prog-meta{font-size:0.72em;color:var(--muted);margin-top:0.2em;line-height:1.4;font-variant-numeric:tabular-nums;}
.civ-science-hub-hud .sh-prog-meta b{color:var(--sci-light);font-weight:600;}
.civ-science-hub-hud .sh-bar{height:6px;background:rgba(16,22,34,.9);border:1px solid rgba(90,155,212,.3);
  border-radius:4px;overflow:hidden;margin-top:0.35em;}
.civ-science-hub-hud .sh-bar-fill{height:100%;background:linear-gradient(90deg,#3a6ad0,var(--sci-light));transition:width .3s;}
.civ-science-hub-hud .sh-sec{display:flex;align-items:baseline;justify-content:space-between;gap:0.5em;
  font-size:0.68em;font-weight:700;text-transform:uppercase;letter-spacing:.16em;color:var(--muted);
  margin:0.35em 0 0.28em;}
.civ-science-hub-hud .sh-sec .sh-sec-count{color:var(--gold);font-variant-numeric:tabular-nums;}
.civ-science-hub-hud .sh-sec.sh-sec-muted .sh-sec-count{color:var(--muted);}
.civ-science-hub-hud .sh-item{display:flex;gap:0.5em;align-items:flex-start;padding:0.42em 0.35em;
  margin-top:0.18em;border-radius:6px;border:1px solid transparent;cursor:pointer;
  transition:background .15s,border-color .15s;}
.civ-science-hub-hud .sh-item:first-of-type{margin-top:0.08em;}
.civ-science-hub-hud .sh-item:hover:not(.locked){background:rgba(232,216,138,.07);border-color:rgba(232,216,138,.4);}
.civ-science-hub-hud .sh-item:hover:not(.locked) .sh-plan-act{opacity:1;}
.civ-science-hub-hud .sh-item.on{border-color:rgba(232,216,138,.45);background:rgba(232,216,138,.07);}
.civ-science-hub-hud .sh-item.locked{opacity:0.6;cursor:pointer;}
.civ-science-hub-hud .sh-item.locked:hover{background:rgba(232,216,138,.05);border-color:rgba(232,216,138,.22);}
.civ-science-hub-hud .sh-item:focus-visible,.civ-science-hub-hud .sh-plan-item:focus-visible{
  outline:2px solid #f4e6a8;outline-offset:2px;}
.civ-science-hub-hud .sh-ico{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:1.5em;height:1.5em;
  border-radius:50%;border:1px solid rgba(232,216,138,.35);background:radial-gradient(circle at 38% 30%,#1c2432,#0a0d14);}
.civ-science-hub-hud .sh-ico svg{width:72%;height:72%;display:block;}
.civ-science-hub-hud .sh-close-ic{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;}
.civ-science-hub-hud .sh-close-ic svg{width:100%;height:100%;display:block;}
.civ-science-hub-hud .sh-tree-btn .sh-tree-ic{display:inline-flex;align-items:center;margin-right:0.35em;vertical-align:middle;}
.civ-science-hub-hud .sh-tree-btn .sh-tree-ic svg{width:1.1em;height:1.1em;display:block;}
.civ-science-hub-hud .sh-body{flex:1;min-width:0;}
.civ-science-hub-hud .sh-name{font-family:Georgia,'Times New Roman',serif;font-size:0.92em;font-weight:600;
  color:var(--gold);line-height:1.2;}
.civ-science-hub-hud .sh-item:hover:not(.locked) .sh-name{color:var(--gold-bright);}
.civ-science-hub-hud .sh-cost{font-size:0.7em;color:var(--muted);margin-top:0.1em;font-variant-numeric:tabular-nums;}
.civ-science-hub-hud .sh-unlock{font-size:0.68em;color:#9fb8d8;margin-top:0.1em;line-height:1.35;}
.civ-science-hub-hud .sh-lock{font-size:0.66em;color:#c9a060;margin-top:0.1em;}
.civ-science-hub-hud .sh-empty{font-size:0.78em;color:var(--muted);line-height:1.45;padding:0.15em 0;}
.civ-science-hub-hud .sh-plan-act{flex-shrink:0;font-size:0.62em;font-weight:700;letter-spacing:.08em;
  color:var(--gold-bright);border:1px solid rgba(232,216,138,.5);border-radius:4px;padding:2px 6px;
  white-space:nowrap;opacity:0;transition:opacity .15s;align-self:center;}
.civ-science-hub-hud .sh-tree-btn{width:100%;margin-top:0.45em;padding:0.5em 0.65em;border-radius:7px;cursor:pointer;
  border:1px solid #6a5212;border-top-color:#f8eea8;color:var(--circle-text);
  background:linear-gradient(180deg,#f0dc88,#b99a28);box-shadow:inset 0 1px 0 rgba(255,255,255,.4);
  font-size:0.72em;font-weight:700;letter-spacing:.07em;text-transform:uppercase;font-family:inherit;
  transition:filter .15s,box-shadow .15s;display:inline-flex;align-items:center;justify-content:center;gap:0.35em;}
.civ-science-hub-hud .sh-tree-btn:hover{filter:brightness(1.06);box-shadow:inset 0 1px 0 rgba(255,255,255,.5),0 0 10px rgba(232,216,138,.25);}
.civ-science-hub-hud .sh-hint{font-size:9.5px;color:#b7c9df;line-height:1.5;margin-top:0.55em;padding-top:0.5em;
  border-top:1px solid rgba(232,216,138,.12);font-style:normal;}
.civ-science-hub-hud .sh-plan-empty-wrap{display:flex;align-items:flex-start;gap:0.45em;padding:0.55em 0.65em;
  border-radius:7px;border:1px dashed rgba(232,216,138,.28);background:rgba(232,216,138,.03);}
.civ-science-hub-hud .sh-plan-empty-plus{color:var(--muted);display:flex;flex-shrink:0;margin-top:1px;}
.civ-science-hub-hud .sh-plan-empty{font-size:0.78em;color:var(--muted);line-height:1.45;font-style:normal;padding:0;}
.civ-science-hub-hud .sh-plan-item{display:flex;align-items:center;gap:0.45em;padding:0.35em 0.45em;
  margin-top:0.2em;border-radius:7px;border:1px solid rgba(232,216,138,.28);background:rgba(232,216,138,.05);
  cursor:grab;}
.civ-science-hub-hud .sh-plan-item.active{border-color:rgba(232,216,138,.55);
  background:linear-gradient(180deg,rgba(46,42,24,.9),rgba(22,19,11,.94));}
.civ-science-hub-hud .sh-plan-item.dragging{opacity:0.4;}
.civ-science-hub-hud .sh-plan-item.drop-target{border-color:var(--sci);background:rgba(90,155,212,.1);
  box-shadow:inset 0 0 0 2px var(--sci);}
.civ-science-hub-hud .sh-plan-item.drop-target .sh-drop-label{display:inline;}
.civ-science-hub-hud .sh-drop-label{display:none;font-size:0.62em;font-weight:700;letter-spacing:.08em;
  color:var(--sci-light);white-space:nowrap;flex-shrink:0;}
.civ-science-hub-hud .sh-plan-num{flex-shrink:0;width:1.25em;height:1.25em;border-radius:50%;
  background:var(--circle-grad);color:var(--circle-text);font-size:0.68em;font-weight:800;
  display:flex;align-items:center;justify-content:center;}
.civ-science-hub-hud .sh-plan-name{flex:1;min-width:0;font-family:Georgia,'Times New Roman',serif;
  font-size:0.82em;font-weight:600;color:#e8dcb8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.civ-science-hub-hud .sh-plan-item.active .sh-plan-name{color:var(--gold-bright);}
.civ-science-hub-hud .sh-plan-chip{font-size:0.58em;font-weight:700;letter-spacing:.1em;color:var(--sci-light);
  border:1px solid rgba(143,182,224,.45);border-radius:4px;padding:1px 6px;white-space:nowrap;flex-shrink:0;}
.civ-science-hub-hud .sh-plan-del{flex-shrink:0;background:none;border:none;color:var(--muted);
  font-size:1.05em;line-height:1;cursor:pointer;padding:0.1em 0.3em;border-radius:4px;}
.civ-science-hub-hud .sh-plan-del:hover{color:#e07a5f;background:rgba(224,122,95,.12);}
.civ-science-hub-hud .sh-plan-slot{display:flex;align-items:center;gap:0.45em;padding:0.35em 0.45em;
  margin-top:0.2em;border-radius:7px;border:1px dashed rgba(232,216,138,.2);}
.civ-science-hub-hud .sh-plan-slot-num{flex-shrink:0;width:1.25em;height:1.25em;border-radius:50%;
  border:1px dashed rgba(232,216,138,.35);color:#6f6a5e;font-size:0.65em;font-weight:800;
  display:flex;align-items:center;justify-content:center;}
.civ-science-hub-hud .sh-plan-slot-label{flex:1;font-size:0.72em;color:#6f6a5e;}
.civ-science-hub-hud .sh-item .sh-num-badge{flex-shrink:0;width:1.2em;height:1.2em;border-radius:50%;
  background:var(--circle-grad);color:var(--circle-text);font-size:0.62em;font-weight:800;
  display:flex;align-items:center;justify-content:center;margin-top:0.15em;}
.civ-science-hub-hud .sh-era-gate{border-color:rgba(224,122,95,.45);
  background:linear-gradient(180deg,rgba(40,22,18,.95),rgba(18,11,9,.96));}
.civ-science-hub-hud .sh-era-gate-title{color:#e8a888;border-bottom-color:rgba(224,122,95,.28);
  font-size:0.86em;}
.civ-science-hub-hud .sh-gate-row{font-size:0.76em;line-height:1.45;display:flex;gap:0.4em;
  align-items:flex-start;margin-top:0.3em;}
.civ-science-hub-hud .sh-gate-row:first-of-type{margin-top:0;}
.civ-science-hub-hud .sh-gate-row.ok{color:#a8d0a0;}
.civ-science-hub-hud .sh-gate-row.ok.muted{color:var(--muted);}
.civ-science-hub-hud .sh-gate-row.bad{color:#e0b0a0;}
.civ-science-hub-hud .sh-gate-mark{flex-shrink:0;font-weight:800;width:1em;text-align:center;}
.civ-science-hub-hud .sh-gate-row.ok .sh-gate-mark{color:#7fc46a;}
.civ-science-hub-hud .sh-gate-row.bad .sh-gate-mark{color:#e07a5f;}
.civ-science-hub-hud .sh-gate-detail{color:var(--gold-bright);}
.civ-science-hub-hud .sh-gate-hint{font-size:0.68em;color:var(--muted);margin-top:0.35em;font-style:italic;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: ScienceHubHudApi | null = null;

export function createScienceHubHud(config: ScienceHubHudConfig): ScienceHubHudApi {
  ensureStyles();
  if (api !== null) api.destroy();

  const el = document.createElement('div');
  el.className = 'civ-science-hub-hud';
  document.body.appendChild(el);

  let open = false;
  let unbindOutside: (() => void) | null = null;

  function closeHub(): void {
    if (!open) return;
    open = false;
    el.classList.remove('open');
    popOverlay('science-hub');
    unbindOutside?.();
    unbindOutside = null;
    config.onClose?.();
  }

  function handleScienceHubEscape(): void {
    if (config.isTreeOpen?.()) return;
    closeHub();
  }

  function renderProgressBlock(prog: ScienceHubProgress | null): HTMLElement {
    const box = document.createElement('div');
    box.className = 'sh-prog';
    if (!prog || !prog.targetName || prog.kosztCelu <= 0) {
      box.innerHTML = '<div class="sh-prog-target"><span class="sh-owl">' + scienceOwlIconHtml()
        + '</span> Wybierz technologię z listy poniżej</div>'
        + '<div class="sh-prog-meta">Brak aktywnego celu badań</div>';
      return box;
    }
    const pct = Math.max(0, Math.min(100, Math.round(prog.postepFraction * 100)));
    const eta = prog.turnsLeft > 0 ? prog.turnsLeft + ' tur' : '<1 tury';
    const rate = prog.naukaRate !== undefined ? ' · +' + prog.naukaRate + ' PN/t' : '';
    const targetIcon = techIconSvg(prog.targetName, 16) ?? scienceOwlIconHtml();
    box.innerHTML = '<div class="sh-prog-target"><span class="sh-owl">' + targetIcon
      + '</span> ' + esc(prog.targetName) + '</div>'
      + '<div class="sh-prog-meta">Pula ' + Math.round(prog.pula) + ' / ' + Math.round(prog.kosztCelu) + ' PN'
      + ' · <b>' + pct + '%</b> · ETA ' + esc(eta) + rate + '</div>'
      + '<div class="sh-bar"><div class="sh-bar-fill" style="width:' + pct + '%"></div></div>';
    box.querySelector('.sh-prog-target')?.addEventListener('click', () => showTechDiscoveryNotice({
      techName: prog.targetName!, eraIndex: 1, kind: 'preview', onOpenTree: config.onOpenTreeView,
    }));
    (box.querySelector('.sh-prog-target') as HTMLElement | null)?.setAttribute('title', 'Kliknij, aby otworzyć kartę technologii');
    (box.querySelector('.sh-prog-target') as HTMLElement | null)?.classList.add('sh-clickable');
    return box;
  }

  /**
   * R-EPOKA-CUD-ZAKRES-Q1=B: "czego brakuje do awansu epoki" — widoczny WYŁĄCZNIE gdy
   * `info.blocked` (decyzja UX, patrz raport Operatora). Pokazuje oba warunki bramki
   * (`allEraTechsResearched` / `eraOwnWonderSatisfied`) zawsze parą, żeby gracz od razu
   * widział, że warunek cudu jest nieaktywny, gdy cywilizacja go nie ma — nie tylko
   * milczący brak wzmianki. / EN: shown ONLY when blocked; both gate conditions are
   * always rendered together so "no wonder assigned" reads as an explicit non-blocker,
   * not a silent omission.
   */
  function renderEraGatePanel(info: EraGateInfo): HTMLElement {
    const box = document.createElement('div');
    box.className = 'panel sh-era-gate';

    const title = document.createElement('div');
    title.className = 'ptitle sh-era-gate-title';
    title.textContent = 'Awans do epoki ' + info.nextEraLabel + ' — zablokowany';
    box.appendChild(title);

    // (a) technologie epoki bieżącej
    const techRow = document.createElement('div');
    techRow.className = 'sh-gate-row' + (info.techsComplete ? ' ok' : ' bad');
    if (info.techsComplete) {
      techRow.innerHTML = '<span class="sh-gate-mark">✓</span> Technologie epoki '
        + esc(info.eraLabel) + ': wszystkie odkryte';
    } else {
      const names = info.missingTechs.map(t => esc(t.name)).join(', ');
      techRow.innerHTML = '<span class="sh-gate-mark">✗</span> Technologie epoki '
        + esc(info.eraLabel) + ': brakuje ' + info.missingTechs.length
        + ' — <span class="sh-gate-detail">' + names + '</span>';
    }
    box.appendChild(techRow);

    // (b)/(c) cud wyłączny (E) epoki bieżącej — LUB jawne potwierdzenie braku wymogu
    if (!info.wonderRequired) {
      const wonderRow = document.createElement('div');
      wonderRow.className = 'sh-gate-row ok muted';
      wonderRow.innerHTML = '<span class="sh-gate-mark">–</span> Brak wymogu cudu w tej epoce';
      box.appendChild(wonderRow);
    } else {
      for (const w of info.wonders) {
        const wonderRow = document.createElement('div');
        wonderRow.className = 'sh-gate-row' + (w.built ? ' ok' : ' bad');
        const status = w.built
          ? 'zbudowany'
          : (w.inProgress ? 'w budowie' : 'jeszcze nie zakolejkowany');
        wonderRow.innerHTML = '<span class="sh-gate-mark">' + (w.built ? '✓' : '✗') + '</span> Cud epoki: '
          + '<span class="sh-gate-detail">' + esc(w.name) + '</span> — ' + status;
        box.appendChild(wonderRow);
      }
      if (info.wonders.length > 1) {
        const hint = document.createElement('div');
        hint.className = 'sh-gate-hint';
        hint.textContent = 'Wystarczy zbudować JEDEN z powyższych cudów.';
        box.appendChild(hint);
      }
    }

    return box;
  }

  function renderPlanPanel(plan: ScienceHubPlanEntry[]): HTMLElement {
    const box = document.createElement('div');
    box.className = 'panel';

    const title = document.createElement('div');
    title.className = 'sh-sec' + (plan.length === 0 ? ' sh-sec-muted' : '');
    const titleLabel = document.createElement('span');
    titleLabel.textContent = 'Plan badań';
    const titleCount = document.createElement('span');
    titleCount.className = 'sh-sec-count';
    titleCount.textContent = plan.length + ' / ' + PLAN_MAX;
    title.appendChild(titleLabel);
    title.appendChild(titleCount);
    box.appendChild(title);

    if (plan.length === 0) {
      const emptyWrap = document.createElement('div');
      emptyWrap.className = 'sh-plan-empty-wrap';
      const plus = document.createElement('span');
      plus.className = 'sh-plan-empty-plus';
      plus.innerHTML = PLUS_ICON_SVG;
      const empty = document.createElement('div');
      empty.className = 'sh-plan-empty';
      empty.textContent = 'Pusty — kliknij technologię na liście lub w drzewku, by dodać do planu.';
      emptyWrap.appendChild(plus);
      emptyWrap.appendChild(empty);
      box.appendChild(emptyWrap);
      return box;
    }

    let dragFromIdx: number | null = null;

    plan.forEach((entry, idx) => {
      const row = document.createElement('div');
      row.className = 'sh-plan-item' + (entry.isActive ? ' active' : '');
      row.tabIndex = 0;
      const canDrag = config.onReorder !== undefined;
      row.draggable = canDrag;

      const num = document.createElement('span');
      num.className = 'sh-plan-num';
      num.textContent = String(entry.pos);
      row.appendChild(num);

      const name = document.createElement('span');
      name.className = 'sh-plan-name';
      name.title = entry.name;
      name.textContent = entry.name;
      row.appendChild(name);

      if (entry.isActive) {
        const chip = document.createElement('span');
        chip.className = 'sh-plan-chip';
        chip.textContent = 'BADA SIĘ';
        row.appendChild(chip);
      }

      const dropLabel = document.createElement('span');
      dropLabel.className = 'sh-drop-label';
      dropLabel.textContent = 'TU UPUŚĆ';
      row.appendChild(dropLabel);

      if (config.onDequeue) {
        const del = document.createElement('button');
        del.type = 'button';
        del.className = 'sh-plan-del';
        del.title = 'Usuń z planu';
        del.setAttribute('aria-label', 'Usuń ' + entry.name + ' z planu badań');
        del.innerHTML = '<span class="sh-close-ic">' + brandIconSvg('ui-close', 16) + '</span>';
        del.addEventListener('click', (ev) => { ev.stopPropagation(); config.onDequeue?.(entry.id); });
        row.appendChild(del);
      }

      if (canDrag) {
        row.addEventListener('dragstart', (ev: DragEvent) => {
          dragFromIdx = idx;
          row.classList.add('dragging');
          ev.dataTransfer?.setData('text/plain', String(idx));
          if (ev.dataTransfer) ev.dataTransfer.effectAllowed = 'move';
        });
        row.addEventListener('dragend', () => {
          dragFromIdx = null;
          box.querySelectorAll('.sh-plan-item').forEach(r => r.classList.remove('dragging', 'drop-target'));
        });
        row.addEventListener('dragover', (ev: DragEvent) => {
          if (dragFromIdx === null) return;
          ev.preventDefault();
          if (ev.dataTransfer) ev.dataTransfer.dropEffect = 'move';
          if (idx !== dragFromIdx) row.classList.add('drop-target');
        });
        row.addEventListener('dragleave', () => row.classList.remove('drop-target'));
        row.addEventListener('drop', (ev: DragEvent) => {
          ev.preventDefault();
          row.classList.remove('drop-target');
          const from = dragFromIdx;
          dragFromIdx = null;
          if (from === null || from === idx) return;
          config.onReorder?.(from, idx);
        });
      }

      row.addEventListener('click', (ev) => {
        if ((ev.target as Element | null)?.closest('.sh-plan-del')) return;
        showTechDiscoveryNotice({
          techName: entry.name, eraIndex: 1, kind: 'preview', onOpenTree: config.onOpenTreeView,
        });
      });

      box.appendChild(row);
    });

    for (let slot = plan.length + 1; slot <= PLAN_MAX; slot++) {
      const slotRow = document.createElement('div');
      slotRow.className = 'sh-plan-slot';
      const slotNum = document.createElement('span');
      slotNum.className = 'sh-plan-slot-num';
      slotNum.textContent = String(slot);
      const slotLabel = document.createElement('span');
      slotLabel.className = 'sh-plan-slot-label';
      slotLabel.textContent = 'wolne miejsce';
      slotRow.appendChild(slotNum);
      slotRow.appendChild(slotLabel);
      box.appendChild(slotRow);
    }

    return box;
  }

  function render(): void {
    const prog = config.getProgress();
    const entries = config.getEntries();
    const plan = config.getPlan?.() ?? [];
    const planPosById = new Map<string, number>();
    for (const p of plan) planPosById.set(p.id, p.pos);
    const available = entries.filter(e => !e.locked);
    const locked = entries.filter(e => e.locked).slice(0, 4);
    const canEnqueue = config.onEnqueue !== undefined || config.getPlan !== undefined;

    const scroll = document.createElement('div');
    scroll.className = 'sh-scroll';

    const head = document.createElement('div');
    head.className = 'panel';
    const titleRow = document.createElement('div');
    titleRow.className = 'ptitle';
    titleRow.innerHTML = '<span class="sh-title-owl">' + scienceOwlIconHtml() + ' Badania</span>';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sh-close';
    closeBtn.title = 'Zamknij (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij hub badań');
    closeBtn.innerHTML = '<span class="sh-close-ic">' + brandIconSvg('ui-close', 20) + '</span>';
    closeBtn.addEventListener('click', (ev) => { ev.stopPropagation(); closeHub(); });
    titleRow.appendChild(closeBtn);
    head.appendChild(titleRow);
    head.appendChild(renderProgressBlock(prog));

    if (config.onOpenTreeView) {
      const gridBtn = document.createElement('button');
      gridBtn.type = 'button';
      gridBtn.className = 'sh-tree-btn';
      gridBtn.innerHTML = '<span class="sh-tree-ic">' + TREE_GRAPH_ICON_SVG + '</span>Drzewo technologii';
      gridBtn.addEventListener('click', () => config.onOpenTreeView?.());
      head.appendChild(gridBtn);
    }

    scroll.appendChild(head);

    const eraGateInfo = config.getEraGateInfo?.() ?? null;
    if (eraGateInfo && eraGateInfo.blocked) {
      scroll.appendChild(renderEraGatePanel(eraGateInfo));
    }

    if (config.getPlan) {
      scroll.appendChild(renderPlanPanel(plan));
    }

    const listPanel = document.createElement('div');
    listPanel.className = 'panel';
    const secAvail = document.createElement('div');
    secAvail.className = 'sh-sec';
    const availLabel = document.createElement('span');
    availLabel.textContent = 'Możesz wybrać';
    const availCount = document.createElement('span');
    availCount.className = 'sh-sec-count';
    availCount.textContent = String(available.length);
    secAvail.appendChild(availLabel);
    secAvail.appendChild(availCount);
    listPanel.appendChild(secAvail);

    if (available.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'sh-empty';
      empty.textContent = 'Brak dostępnych technologii w tej epoce — zbadaj wymagane tech lub otwórz drzewko.';
      listPanel.appendChild(empty);
    } else {
      for (const e of available) {
        listPanel.appendChild(buildEntryRow(e, false));
      }
    }

    if (locked.length > 0) {
      const secLock = document.createElement('div');
      secLock.className = 'sh-sec';
      const lockLabel = document.createElement('span');
      lockLabel.textContent = 'Wkrótce · zablokowane';
      secLock.appendChild(lockLabel);
      listPanel.appendChild(secLock);
      for (const e of locked) {
        listPanel.appendChild(buildEntryRow(e, true));
      }
    }

    const hint = document.createElement('div');
    hint.className = 'sh-hint';
    hint.textContent = 'Klik technologii/ikony = otwórz kartę podglądu. Wybór badania lub dodanie do planu to osobna akcja. Esc zamyka kartę/hub.';

    listPanel.appendChild(hint);
    scroll.appendChild(listPanel);

    el.innerHTML = '';
    el.appendChild(scroll);

    function buildEntryRow(e: ScienceHubEntry, lockedRow: boolean): HTMLElement {
      const row = document.createElement('div');
      row.className = 'sh-item' + (e.isTarget ? ' on' : '') + (lockedRow ? ' locked' : '');
      row.setAttribute('role', 'button');
      row.tabIndex = 0;
      const ico = document.createElement('span');
      ico.className = 'sh-ico';
      ico.innerHTML = lockedRow
        ? brandIconSvg('ui-lock', 20)
        : (techIconSvg(e.name, 20) ?? brandIconSvg('res-science', 20));
      const body = document.createElement('div');
      body.className = 'sh-body';
      const name = document.createElement('div');
      name.className = 'sh-name';
      name.textContent = e.name;
      body.appendChild(name);
      const cost = document.createElement('div');
      cost.className = 'sh-cost';
      cost.textContent = e.koszt + ' PN · ' + e.epoka;
      body.appendChild(cost);
      if (e.unlockLine) {
        const ul = document.createElement('div');
        ul.className = 'sh-unlock';
        ul.textContent = 'Odblok.: ' + e.unlockLine;
        body.appendChild(ul);
      }
      if (e.lockHint) {
        const lk = document.createElement('div');
        lk.className = 'sh-lock';
        lk.textContent = e.lockHint;
        body.appendChild(lk);
      }
      row.appendChild(ico);
      row.appendChild(body);

      const planPos = planPosById.get(e.id);
      if (planPos !== undefined) {
        const badge = document.createElement('span');
        badge.className = 'sh-num-badge';
        badge.title = 'Pozycja ' + planPos + ' w planie badań';
        badge.textContent = String(planPos);
        row.appendChild(badge);
      } else if (!lockedRow && canEnqueue) {
        const planAct = document.createElement('span');
        planAct.className = 'sh-plan-act';
        planAct.textContent = '+ PLAN';
        planAct.setAttribute('aria-hidden', 'true');
        row.appendChild(planAct);
      }

      const act = () => {
        showTechDiscoveryNotice({
          techName: e.name,
          eraIndex: 1,
          kind: 'preview',
          onStartResearch: lockedRow ? undefined : () => config.onSelectTech(e.id),
          onOpenTree: config.onOpenTreeView ?? (() => config.onShowInTree(e.id)),
        });
      };
      row.addEventListener('click', act);
      row.addEventListener('keydown', (ev: KeyboardEvent) => {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); act(); }
      });
      return row;
    }
  }

  function esc(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function show(): void {
    open = true;
    render();
    el.classList.add('open');
    pushOverlay('science-hub', handleScienceHubEscape);
    unbindOutside?.();
    unbindOutside = bindHudPanelOutsideDismiss(
      el,
      () => open,
      closeHub,
      '[data-act="science"], .civ-ttv-overlay, .civ-ttv-confirm-back',
    );
  }

  function hide(): void { closeHub(); }
  function toggle(): void { if (open) closeHub(); else show(); }
  function update(): void { if (open) render(); }

  function destroy(): void {
    popOverlay('science-hub');
    unbindOutside?.();
    unbindOutside = null;
    el.remove();
    if (api?.el === el) api = null;
  }

  api = { el, isOpen: () => open, toggle, show, hide, update, destroy };
  return api;
}

export function isScienceHubHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleScienceHubHud(): void { api?.toggle(); }
export function showScienceHubHud(): void { api?.show(); }
export function hideScienceHubHud(): void { api?.hide(); }
export function refreshScienceHubIfOpen(): void { api?.update(); }
export function destroyScienceHubHud(): void { api?.destroy(); api = null; }
