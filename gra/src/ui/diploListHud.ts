/**
 * diploListHud.ts — lista cywilizacji do dyplomacji (toolbar tb-diplomacy).
 */

import { tierLabel } from './diplomacyPanel';
import {
  civPennantHtml,
  dipBrandIconHtml,
  dipCloseBtnHtml,
  DIPLO_1E_SHARED_CSS,
  ensureDiploBrandScope,
  tierBadgeHtml,
  treatyChipsHtml,
} from './diploUiSkin';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';

export interface DiploListEntry {
  id: string;
  name: string;
  tier: number;
  detailLine: string;
  metaLine?: string;
  /** Aktywne traktaty z silnika (etykiety PL). */
  treatyLabels?: readonly string[];
}

export interface DiploListHudConfig {
  getEntries: () => DiploListEntry[];
  onSelectEntry: (ownerId: number) => void;
  onClose?: () => void;
}

export interface DiploListHudApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-diplo-list-hud-css-1e';
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
const PANEL_W = 440;
const LEFT_INSET = SIDE_PANEL_LEFT;

function ensureStyles(): void {
  ensureDiploBrandScope();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${DIPLO_1E_SHARED_CSS}
.civ-diplo-list-hud{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(28vw,${PANEL_W}px);min-width:280px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:311;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(180deg,rgba(8,10,18,.97),rgba(6,8,14,.94));
  border-right:2px solid rgba(232,216,138,.22);box-shadow:8px 0 32px rgba(0,0,0,.55);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8e0c8;}
.civ-diplo-list-hud.open{display:flex;}
.civ-diplo-list-hud .dl-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.55rem 0.65rem 0.7rem;}
.civ-diplo-list-hud .dl-scroll::-webkit-scrollbar{width:6px;}
.civ-diplo-list-hud .dl-scroll::-webkit-scrollbar-thumb{background:rgba(232,216,138,.22);border-radius:3px;}
.civ-diplo-list-hud .dl-head{padding:0.35rem 0.15rem 0.55rem;border-bottom:1px solid rgba(232,216,138,.18);
  display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-diplo-list-hud .dl-head-left{display:flex;align-items:center;gap:0.35em;}
.civ-diplo-list-hud .dl-head-text{display:flex;flex-direction:column;align-items:center;text-align:center;}
.civ-diplo-list-hud .dl-head-title{font-family:Georgia,'Times New Roman',serif;font-size:1.35em;color:#e8d88a;letter-spacing:.04em;}
.civ-diplo-list-hud .dl-head-sub{font-size:0.62em;letter-spacing:.28em;text-transform:uppercase;color:#8a8070;margin-top:0.12em;text-align:center;}
.civ-diplo-list-hud .dl-head-ic{display:flex;align-items:center;gap:0.35em;color:#e8d88a;}
.civ-diplo-list-hud .dl-head-ic .dip-ic{width:22px;height:22px;}
.civ-diplo-list-hud .dl-empty{font-size:0.86em;color:#8a8070;line-height:1.5;padding:0.65em 0.35em;font-style:italic;}
.civ-diplo-list-hud .dl-item{display:flex;gap:0.85em;align-items:center;padding:0.85em 0.95em;margin-top:0.55em;
  border-radius:12px;border:1px solid rgba(232,216,138,.16);background:rgba(255,255,255,.02);
  cursor:pointer;transition:border-color .15s,box-shadow .15s,background .15s;}
.civ-diplo-list-hud .dl-item:first-of-type{margin-top:0.35em;}
.civ-diplo-list-hud .dl-item:hover{border-color:rgba(232,216,138,.45);
  background:linear-gradient(180deg,rgba(232,216,138,.08),rgba(232,216,138,.02));
  box-shadow:0 0 18px rgba(232,216,138,.12);}
.civ-diplo-list-hud .dl-item.dl-war{border-color:rgba(200,64,64,.3);background:rgba(200,64,64,.04);}
.civ-diplo-list-hud .dl-item.dl-war:hover{border-color:rgba(200,64,64,.45);box-shadow:0 0 18px rgba(200,64,64,.12);}
.civ-diplo-list-hud .dl-body{flex:1;min-width:0;}
.civ-diplo-list-hud .dl-name{font-family:Georgia,'Times New Roman',serif;font-size:1.12em;font-weight:700;color:#e8e0c8;line-height:1.2;}
.civ-diplo-list-hud .dl-meta{font-size:0.72em;color:#8a8070;margin-top:0.18em;line-height:1.35;}
.civ-diplo-list-hud .dl-tier-row{margin-top:0.35em;display:flex;flex-direction:column;align-items:flex-start;gap:3px;}
.civ-diplo-list-hud .dl-hint{font-size:0.72em;color:#8a8070;margin-top:0.65em;line-height:1.45;padding:0 0.15em;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: DiploListHudApi | null = null;

export function createDiploListHud(config: DiploListHudConfig): DiploListHudApi {
  ensureStyles();
  if (api !== null) api.destroy();

  const el = document.createElement('div');
  el.className = 'civ-diplo-list-hud';
  document.body.appendChild(el);

  let open = false;
  let unbindOutside: (() => void) | null = null;

  function closeList(): void {
    if (!open) return;
    open = false;
    el.classList.remove('open');
    document.removeEventListener('keydown', onEsc);
    unbindOutside?.();
    unbindOutside = null;
    config.onClose?.();
  }

  function onEsc(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') {
      ev.preventDefault();
      closeList();
    }
  }

  function render(): void {
    const entries = config.getEntries();
    const scroll = document.createElement('div');
    scroll.className = 'dl-scroll';

    const head = document.createElement('div');
    head.className = 'dl-head';
    const headLeft = document.createElement('div');
    headLeft.className = 'dl-head-left';
    const dipIc = dipBrandIconHtml('tb-diplomacy', 24, 'dip-ic');
    headLeft.innerHTML =
      (dipIc ? `<div class="dl-head-ic">${dipIc}</div>` : '') +
      '<div class="dl-head-text"><div class="dl-head-title">Dyplomacja</div><div class="dl-head-sub">THE GAME</div></div>';
    head.appendChild(headLeft);
    const closeWrap = document.createElement('div');
    closeWrap.innerHTML = dipCloseBtnHtml('Zamknij listę (Esc)');
    closeWrap.querySelector('button')?.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeList();
    });
    head.appendChild(closeWrap);
    scroll.appendChild(head);

    if (entries.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'dl-empty';
      empty.textContent = 'Nie spotkałeś jeszcze obcej cywilizacji — zbadaj mapę lub spotkaj posłańców.';
      scroll.appendChild(empty);
    } else {
      for (const e of entries) {
        const row = document.createElement('div');
        row.className = e.tier === 0 ? 'dl-item dl-war' : 'dl-item';
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = 'Audiencja — ' + e.name;

        const pennant = document.createElement('div');
        pennant.innerHTML = civPennantHtml(e.name, e.tier);

        const body = document.createElement('div');
        body.className = 'dl-body';
        const name = document.createElement('div');
        name.className = 'dl-name';
        name.textContent = e.name;
        body.appendChild(name);
        if (e.metaLine) {
          const meta = document.createElement('div');
          meta.className = 'dl-meta';
          meta.textContent = e.metaLine;
          body.appendChild(meta);
        }
        const tierRow = document.createElement('div');
        tierRow.className = 'dl-tier-row';
        tierRow.innerHTML = tierBadgeHtml(e.tier, tierLabel(e.tier))
          + (e.treatyLabels?.length ? treatyChipsHtml(e.treatyLabels) : '');
        body.appendChild(tierRow);
        if (e.detailLine) {
          const stats = document.createElement('div');
          stats.className = 'dl-meta';
          stats.textContent = e.detailLine;
          body.appendChild(stats);
        }
        row.appendChild(pennant.firstElementChild ?? pennant);
        row.appendChild(body);
        const go = () => {
          const oidGo = parseInt(e.id, 10);
          if (!Number.isFinite(oidGo)) return;
          config.onSelectEntry(oidGo);
        };
        row.addEventListener('click', go);
        row.addEventListener('keydown', (ev: KeyboardEvent) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            go();
          }
        });
        scroll.appendChild(row);
      }
      const hint = document.createElement('div');
      hint.className = 'dl-hint';
      hint.textContent = 'Kliknij cywilizację, aby otworzyć audiencję. Esc — powrót. Ponowne uścisk dłoni w toolbarze — zamknij listę.';
      scroll.appendChild(hint);
    }

    el.innerHTML = '';
    el.appendChild(scroll);
  }

  function show(): void {
    open = true;
    render();
    el.classList.add('open');
    document.addEventListener('keydown', onEsc);
    unbindOutside?.();
    unbindOutside = bindHudPanelOutsideDismiss(
      el,
      () => open,
      closeList,
      '[data-act="diplo"]',
    );
  }

  function hide(): void {
    closeList();
  }

  function toggle(): void {
    if (open) closeList();
    else show();
  }

  function update(): void {
    if (open) render();
  }

  function destroy(): void {
    document.removeEventListener('keydown', onEsc);
    unbindOutside?.();
    unbindOutside = null;
    el.remove();
    if (api?.el === el) api = null;
  }

  api = { el, isOpen: () => open, toggle, show, hide, update, destroy };
  return api;
}

export function isDiploListHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleDiploListHud(): void {
  api?.toggle();
}

export function showDiploListHud(): void {
  api?.show();
}

export function hideDiploListHud(): void {
  api?.hide();
}

export function refreshDiploListHudIfOpen(): void {
  api?.update();
}

export function destroyDiploListHud(): void {
  api?.destroy();
  api = null;
}

/** Relacja widoczna w liście = Zaufanie + Respekt z mocy (jak audiencja). */
function listRelTotal(zaufanie: number, respekt: number): number {
  return Math.round(Math.max(0, Math.min(200, zaufanie + respekt)));
}

/** Pomocnik: wpis listy z relacji silnika. */
export function diploListEntryFromRelation(rel: {
  ownerId?: number;
  civ: string;
  tier: number;
  zaufanie?: number;
  respekt?: number;
  contactEstablished?: boolean;
  activeTreaties?: readonly string[];
}): DiploListEntry | null {
  if (rel.ownerId === undefined) return null;
  const zauf = rel.zaufanie ?? 0;
  const relTotal = listRelTotal(zauf, rel.respekt ?? 0);
  return {
    id: String(rel.ownerId),
    name: rel.civ,
    tier: rel.tier,
    detailLine: 'Relacja: ' + relTotal + ' · Zaufanie: ' + zauf,
    metaLine: rel.contactEstablished ? 'Audiencja — kontakt nawiązany' : 'Audiencja — nawiąż kontakt',
    treatyLabels: rel.activeTreaties?.length ? rel.activeTreaties : undefined,
  };
}
