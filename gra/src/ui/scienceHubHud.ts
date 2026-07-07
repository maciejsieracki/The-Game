/**
 * scienceHubHud.ts — hub badań (postęp + lista tech + wejście do drzewka).
 * Q-NAUKA-1: lista + postęp; drzewko osobno (sciencePicker dock).
 */

import { scienceOwlIconHtml } from './icons/scienceOwlIcon';
import { brandIconSvg } from './icons/brandAssets';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';

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

export interface ScienceHubHudConfig {
  getProgress: () => ScienceHubProgress | null;
  getEntries: () => ScienceHubEntry[];
  onSelectTech: (techId: string) => void;
  onOpenFullTree: () => void;
  onShowInTree: (techId: string) => void;
  onClose?: () => void;
  /** Gdy drzewko otwarte — Esc obsługuje drzewko, nie hub. */
  isTreeOpen?: () => boolean;
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

const STYLE_ID = 'civ-science-hub-hud-css-v1';
const TOP_H = 56;
const BOTTOM_BAR_H = 56;
const PANEL_W = 340;
const LEFT_INSET = 'calc(58px + 10px)';

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-science-hub-hud{position:fixed;top:${TOP_H}px;left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:260px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:313;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(90deg,rgba(6,10,20,0.97) 0%,rgba(8,14,28,0.92) 88%,rgba(8,14,28,0.85) 100%);
  border-right:1px solid rgba(107,196,232,0.28);box-shadow:6px 0 28px rgba(0,0,0,0.45);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  --panel:#1e2430;--border:#2e3848;--muted:#8b97a8;--gold:#e0b24a;--sci:#6bc4e8;}
.civ-science-hub-hud.open{display:flex;}
.civ-science-hub-hud .sh-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45rem 0.5rem 0.55rem;}
.civ-science-hub-hud .sh-scroll::-webkit-scrollbar{width:6px;}
.civ-science-hub-hud .sh-scroll::-webkit-scrollbar-thumb{background:rgba(107,196,232,0.25);border-radius:3px;}
.civ-science-hub-hud .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;
  padding:0.38em 0.52em;box-shadow:0 1px 0 rgba(255,255,255,0.03);margin-bottom:0.45em;}
.civ-science-hub-hud .ptitle{font-size:0.74em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--sci);border-bottom:1px solid var(--border);padding-bottom:0.18em;margin-bottom:0.35em;
  display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-science-hub-hud .sh-title-owl{display:inline-flex;align-items:center;gap:0.35em;}
.civ-science-hub-hud .sh-title-owl .civ-science-owl-ic{width:18px;height:18px;color:var(--sci);}
.civ-science-hub-hud .sh-close{background:none;border:none;color:var(--muted);font-size:1.15em;line-height:1;
  cursor:pointer;padding:0.1em 0.25em;border-radius:4px;}
.civ-science-hub-hud .sh-close:hover{color:var(--sci);background:rgba(107,196,232,0.1);}
.civ-science-hub-hud .sh-prog{margin-bottom:0.35em;}
.civ-science-hub-hud .sh-prog-target{font-size:0.95em;font-weight:700;color:var(--gold);line-height:1.25;
  display:flex;align-items:center;gap:0.35em;}
.civ-science-hub-hud .sh-prog-target .sh-owl{display:inline-flex;align-items:center;}
.civ-science-hub-hud .sh-prog-target .civ-science-owl-ic{width:16px;height:16px;color:var(--sci);}
.civ-science-hub-hud .sh-prog-meta{font-size:0.72em;color:var(--muted);margin-top:0.2em;line-height:1.4;}
.civ-science-hub-hud .sh-bar{height:6px;background:rgba(30,40,55,0.9);border:1px solid rgba(107,196,232,0.25);
  border-radius:4px;overflow:hidden;margin-top:0.35em;}
.civ-science-hub-hud .sh-bar-fill{height:100%;background:linear-gradient(90deg,#4a9fd4,var(--sci));transition:width .3s;}
.civ-science-hub-hud .sh-sec{font-size:0.68em;font-weight:700;text-transform:uppercase;letter-spacing:.05em;
  color:var(--muted);margin:0.35em 0 0.2em;}
.civ-science-hub-hud .sh-item{display:flex;gap:0.5em;align-items:flex-start;padding:0.42em 0.32em;
  margin-top:0.22em;border-radius:5px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s;}
.civ-science-hub-hud .sh-item:first-of-type{margin-top:0.1em;}
.civ-science-hub-hud .sh-item:hover:not(.locked){background:rgba(107,196,232,0.08);border-color:rgba(107,196,232,0.35);}
.civ-science-hub-hud .sh-item.on{border-color:rgba(224,178,74,0.55);background:rgba(224,178,74,0.08);}
.civ-science-hub-hud .sh-item.locked{opacity:0.55;cursor:help;}
.civ-science-hub-hud .sh-item.locked:hover{background:rgba(232,176,74,0.06);border-color:rgba(232,176,74,0.25);}
.civ-science-hub-hud .sh-ico{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:1.35em;height:1.35em;}
.civ-science-hub-hud .sh-ico svg{width:100%;height:100%;display:block;}
.civ-science-hub-hud .sh-close-ic{display:inline-flex;align-items:center;justify-content:center;width:1.1em;height:1.1em;}
.civ-science-hub-hud .sh-close-ic svg{width:100%;height:100%;display:block;}
.civ-science-hub-hud .sh-tree-btn .sh-tree-ic{display:inline-flex;align-items:center;margin-right:0.35em;vertical-align:middle;}
.civ-science-hub-hud .sh-tree-btn .sh-tree-ic svg{width:1.1em;height:1.1em;display:block;}
.civ-science-hub-hud .sh-body{flex:1;min-width:0;}
.civ-science-hub-hud .sh-name{font-size:0.98em;font-weight:700;color:var(--gold);line-height:1.2;}
.civ-science-hub-hud .sh-cost{font-size:0.72em;color:var(--muted);margin-top:0.1em;}
.civ-science-hub-hud .sh-unlock{font-size:0.7em;color:#a8c8e0;margin-top:0.12em;line-height:1.35;}
.civ-science-hub-hud .sh-lock{font-size:0.68em;color:#c9a060;margin-top:0.1em;}
.civ-science-hub-hud .sh-empty{font-size:0.82em;color:var(--muted);line-height:1.45;padding:0.15em 0;}
.civ-science-hub-hud .sh-tree-btn{width:100%;margin-top:0.35em;padding:0.45em 0.6em;border-radius:5px;cursor:pointer;
  border:1px solid rgba(107,196,232,0.45);background:rgba(107,196,232,0.12);color:#d4ecff;
  font-size:0.82em;font-weight:600;font-family:inherit;transition:background .15s,border-color .15s;}
.civ-science-hub-hud .sh-tree-btn:hover{background:rgba(107,196,232,0.22);border-color:rgba(107,196,232,0.65);}
.civ-science-hub-hud .sh-hint{font-size:0.7em;color:var(--muted);font-style:italic;margin-top:0.4em;line-height:1.4;}
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
    document.removeEventListener('keydown', onEsc);
    unbindOutside?.();
    unbindOutside = null;
    config.onClose?.();
  }

  function onEsc(ev: KeyboardEvent): void {
    if (ev.key !== 'Escape') return;
    if (config.isTreeOpen?.()) return;
    ev.preventDefault();
    closeHub();
  }

  function renderProgressBlock(prog: ScienceHubProgress | null): HTMLElement {
    const box = document.createElement('div');
    box.className = 'panel sh-prog';
    if (!prog || !prog.targetName || prog.kosztCelu <= 0) {
      box.innerHTML = '<div class="sh-prog-target"><span class="sh-owl">' + scienceOwlIconHtml()
        + '</span> Wybierz technologię z listy poniżej</div>'
        + '<div class="sh-prog-meta">Brak aktywnego celu badań</div>';
      return box;
    }
    const pct = Math.max(0, Math.min(100, Math.round(prog.postepFraction * 100)));
    const eta = prog.turnsLeft > 0 ? prog.turnsLeft + ' tur' : '<1 tury';
    const rate = prog.naukaRate !== undefined ? ' · +' + prog.naukaRate + ' PN/t' : '';
    box.innerHTML = '<div class="sh-prog-target"><span class="sh-owl">' + scienceOwlIconHtml()
      + '</span> ' + esc(prog.targetName) + '</div>'
      + '<div class="sh-prog-meta">Pula: ' + prog.pula + ' / ' + prog.kosztCelu + ' PN'
      + ' · ' + pct + '% · ETA ' + esc(eta) + rate + '</div>'
      + '<div class="sh-bar"><div class="sh-bar-fill" style="width:' + pct + '%"></div></div>';
    return box;
  }

  function render(): void {
    const prog = config.getProgress();
    const entries = config.getEntries();
    const available = entries.filter(e => !e.locked);
    const locked = entries.filter(e => e.locked).slice(0, 4);

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

    const treeBtn = document.createElement('button');
    treeBtn.type = 'button';
    treeBtn.className = 'sh-tree-btn';
    treeBtn.innerHTML = '<span class="sh-tree-ic">' + brandIconSvg('chip-map', 20) + '</span>Pełne drzewko technologii';
    treeBtn.addEventListener('click', () => config.onOpenFullTree());
    head.appendChild(treeBtn);

    scroll.appendChild(head);

    const listPanel = document.createElement('div');
    listPanel.className = 'panel';
    const secAvail = document.createElement('div');
    secAvail.className = 'sh-sec';
    secAvail.textContent = available.length > 0
      ? 'Możesz wybrać (' + available.length + ')'
      : 'Możesz wybrać';
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
      secLock.textContent = 'Wkrótce (zablokowane)';
      listPanel.appendChild(secLock);
      for (const e of locked) {
        listPanel.appendChild(buildEntryRow(e, true));
      }
    }

    const hint = document.createElement('div');
    hint.className = 'sh-hint';
    hint.textContent = 'Klik tech na liście lub w drzewku = ustaw cel. Esc zamyka hub (najpierw drzewko).';

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
      ico.innerHTML = lockedRow ? brandIconSvg('ui-lock', 20) : brandIconSvg('res-science', 20);
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
      const act = () => {
        if (lockedRow) config.onShowInTree(e.id);
        else config.onSelectTech(e.id);
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
    document.addEventListener('keydown', onEsc);
    unbindOutside?.();
    unbindOutside = bindHudPanelOutsideDismiss(
      el,
      () => open,
      closeHub,
      '[data-act="science"]',
    );
  }

  function hide(): void { closeHub(); }
  function toggle(): void { if (open) closeHub(); else show(); }
  function update(): void { if (open) render(); }

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

export function isScienceHubHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleScienceHubHud(): void { api?.toggle(); }
export function showScienceHubHud(): void { api?.show(); }
export function hideScienceHubHud(): void { api?.hide(); }
export function refreshScienceHubIfOpen(): void { api?.update(); }
export function destroyScienceHubHud(): void { api?.destroy(); api = null; }
