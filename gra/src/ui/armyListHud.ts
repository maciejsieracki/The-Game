/**
 * armyListHud.ts — lista armii gracza na mapie (po kliknięciu ⚔ w toolbarze).
 * Ten sam układ co cityListHud (lewy panel, ✕, Esc, toggle).
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { brandIconSvg } from './icons/brandAssets';
import { SIDE_PANEL_LEFT, SIDE_PANEL_TOP } from './sidePanelLayout';
import { formatJednostkiCount, formatZaznaczArmieLabel } from './formatPl';

export interface ArmyListEntry {
  /** Id reprezentatywnej jednostki (do zaznaczenia). */
  id: string;
  /** Nazwa stosu / typu. */
  name: string;
  unitCount: number;
  hexLabel: string;
  detailLine?: string;
  metaLine?: string;
  ruchLeft?: number;
  ruchMax?: number;
  /** Łączne HP stosu (suma jednostek) — pasek zdrowia, patrz `al-hpbar`. */
  hp?: number;
  hpMax?: number;
  /**
   * C-GARN-Q1 rozszerzenie (Maciej 2026-07-26): jednostka ukryta w garnizonie
   * (Ufort.) — widoczna i zaznaczalna na liście, ale wydanie jej rozkazu
   * ruchu (klik na mapie po zaznaczeniu) automatycznie ją odfortyfikuje
   * i obudzi (sentry). Oznaczona wizualnie badge'em „w garnizonie”.
   */
  inGarnizon?: boolean;
  /** Jednostka ufortyfikowana w polu (nie garnizon miasta). */
  ufortyfikowanyWPolu?: boolean;
  /** Jednostka w trybie czuwania (uśpiona do wykrycia wroga). */
  sentry?: boolean;
}

export interface ArmyListHudConfig {
  getArmies: () => ArmyListEntry[];
  onSelectArmy: (unitId: string) => void;
  onClose?: () => void;
}

export interface ArmyListHudApi {
  el: HTMLDivElement;
  isOpen: () => boolean;
  toggle: () => void;
  show: () => void;
  hide: () => void;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-army-list-hud-css-v1';
const TOP_H = SIDE_PANEL_TOP;
const BOTTOM_BAR_H = 56;
const PANEL_W = 340;
const LEFT_INSET = SIDE_PANEL_LEFT;

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-army-list-hud{position:fixed;top:${TOP_H};left:${LEFT_INSET};bottom:calc(${BOTTOM_BAR_H}px + 2mm);
  width:min(24vw,${PANEL_W}px);min-width:260px;max-width:calc(100vw - ${LEFT_INSET} - 12px);z-index:311;display:none;flex-direction:column;
  pointer-events:auto;overflow:hidden;
  background:linear-gradient(90deg,rgba(6,10,20,0.97) 0%,rgba(8,14,28,0.92) 88%,rgba(8,14,28,0.85) 100%);
  border-right:1px solid rgba(212,175,90,0.28);box-shadow:6px 0 28px rgba(0,0,0,0.45);
  font:14px 'Segoe UI',Tahoma,sans-serif;color:#e8ebf0;
  --panel:#1e2430;--border:#2e3848;--muted:#8b97a8;--gold:#e0b24a;}
.civ-army-list-hud.open{display:flex;}
.civ-army-list-hud .al-scroll{flex:1;overflow-y:auto;overflow-x:hidden;padding:0.45rem 0.5rem 0.55rem;}
.civ-army-list-hud .al-scroll::-webkit-scrollbar{width:6px;}
.civ-army-list-hud .al-scroll::-webkit-scrollbar-thumb{background:rgba(212,175,90,0.25);border-radius:3px;}
.civ-army-list-hud .panel{background:var(--panel);border:1px solid var(--border);border-radius:6px;
  padding:0.38em 0.52em;box-shadow:0 1px 0 rgba(255,255,255,0.03);}
.civ-army-list-hud .ptitle{font-size:0.74em;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
  color:var(--gold);border-bottom:1px solid var(--border);padding-bottom:0.18em;margin-bottom:0.35em;
  display:flex;justify-content:space-between;align-items:center;gap:0.5em;}
.civ-army-list-hud .al-close{background:none;border:none;color:var(--muted);font-size:1.15em;line-height:1;
  cursor:pointer;padding:0.1em 0.25em;border-radius:4px;}
.civ-army-list-hud .al-close:hover{color:var(--gold);background:rgba(224,178,74,0.1);}
.civ-army-list-hud .al-empty{font-size:0.82em;color:var(--muted);line-height:1.45;padding:0.2em 0.1em;}
.civ-army-list-hud .al-item{display:flex;gap:0.55em;align-items:flex-start;padding:0.45em 0.35em;
  margin-top:0.28em;border-radius:5px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s;}
.civ-army-list-hud .al-item:first-of-type{margin-top:0.15em;}
.civ-army-list-hud .al-item:hover{background:rgba(224,178,74,0.08);border-color:rgba(224,178,74,0.35);}
.civ-army-list-hud .al-item.on{border-color:rgba(120,200,140,0.55);background:rgba(40,100,50,0.12);}
.civ-army-list-hud .al-ico{font-size:1.35em;line-height:1;flex-shrink:0;margin-top:0.05em;}
.civ-army-list-hud .al-body{flex:1;min-width:0;}
.civ-army-list-hud .al-name{font-size:1.05em;font-weight:700;color:var(--gold);line-height:1.2;}
.civ-army-list-hud .al-hex{font-size:0.78em;color:var(--muted);margin-top:0.12em;}
.civ-army-list-hud .al-detail{font-size:0.78em;color:#d4cba0;margin-top:0.18em;line-height:1.35;}
.civ-army-list-hud .al-bar-lbl{display:flex;justify-content:space-between;align-items:baseline;
  font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:0.32em;}
.civ-army-list-hud .al-bar-lbl .al-bar-val{color:#d4d9e2;font-weight:700;text-transform:none;letter-spacing:0;}
.civ-army-list-hud .al-mvbar{height:5px;background:rgba(0,0,0,.35);border-radius:3px;margin-top:0.14em;overflow:hidden;}
.civ-army-list-hud .al-mvbar i{display:block;height:100%;background:linear-gradient(90deg,#1d4e8f,#6fb0f0);transition:width .2s;}
.civ-army-list-hud .al-hpbar{height:5px;background:rgba(0,0,0,.35);border-radius:3px;margin-top:0.14em;overflow:hidden;}
.civ-army-list-hud .al-hpbar i{display:block;height:100%;transition:width .2s,background-color .2s;}
.civ-army-list-hud .al-meta{font-size:0.72em;color:var(--muted);margin-top:0.1em;}
.civ-army-list-hud .al-garnizon-badge{display:inline-block;font-size:0.7em;font-weight:600;
  letter-spacing:.02em;color:#e0b24a;background:rgba(224,178,74,0.14);
  border:1px solid rgba(224,178,74,0.4);border-radius:4px;padding:0.1em 0.45em;margin-top:0.28em;}
.civ-army-list-hud .al-hint{font-size:0.72em;color:var(--muted);font-style:italic;margin-top:0.45em;line-height:1.4;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

let api: ArmyListHudApi | null = null;
let selectedHighlightId: string | null = null;

export function createArmyListHud(config: ArmyListHudConfig): ArmyListHudApi {
  ensureStyles();
  if (api !== null) api.destroy();

  const el = document.createElement('div');
  el.className = 'civ-army-list-hud';
  document.body.appendChild(el);

  let open = false;
  let unbindOutside: (() => void) | null = null;

  function closeList(): void {
    if (!open) return;
    open = false;
    el.classList.remove('open');
    popOverlay('army-list');
    unbindOutside?.();
    unbindOutside = null;
    config.onClose?.();
  }

  function render(): void {
    const armies = config.getArmies();
    const scroll = document.createElement('div');
    scroll.className = 'al-scroll';
    const panel = document.createElement('div');
    panel.className = 'panel';
    const titleRow = document.createElement('div');
    titleRow.className = 'ptitle';
    const titleLbl = document.createElement('span');
    titleLbl.textContent = 'Armie';
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'al-close';
    closeBtn.title = 'Zamknij listę (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij listę armii');
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeList();
    });
    titleRow.appendChild(titleLbl);
    titleRow.appendChild(closeBtn);
    panel.appendChild(titleRow);

    if (armies.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'al-empty';
      empty.textContent = 'Brak jednostek na mapie — zrekrutuj wojsko w mieście.';
      panel.appendChild(empty);
    } else {
      for (const a of armies) {
        const row = document.createElement('div');
        row.className = 'al-item' + (selectedHighlightId === a.id ? ' on' : '');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = a.inGarnizon
          ? 'Zaznacz ' + a.name + ' — w garnizonie; rozkaz ruchu ją odfortyfikuje i obudzi'
          : a.sentry
            ? 'Zaznacz ' + a.name + ' — uśpiona; rozkaz ruchu ją obudzi'
            : a.ufortyfikowanyWPolu
              ? 'Zaznacz ' + a.name + ' — ufortyfikowana w polu; rozkaz ruchu zdejmie fortyfikację'
              : a.unitCount > 1
            ? formatZaznaczArmieLabel(a.unitCount)
            : 'Zaznacz ' + a.name;
        const ico = document.createElement('span');
        ico.className = 'al-ico';
        ico.innerHTML = brandIconSvg('tb-army', 18);
        const body = document.createElement('div');
        body.className = 'al-body';
        const name = document.createElement('div');
        name.className = 'al-name';
        name.textContent = a.name;
        body.appendChild(name);
        const hex = document.createElement('div');
        hex.className = 'al-hex';
        hex.textContent = 'Heks ' + a.hexLabel
          + (a.unitCount > 1 ? ' · ' + formatJednostkiCount(a.unitCount) : '');
        body.appendChild(hex);
        if (a.inGarnizon) {
          const badge = document.createElement('div');
          badge.className = 'al-garnizon-badge';
          badge.textContent = 'w garnizonie';
          body.appendChild(badge);
        } else if (a.ufortyfikowanyWPolu) {
          const badge = document.createElement('div');
          badge.className = 'al-garnizon-badge';
          badge.textContent = 'ufortyfikowana w polu';
          body.appendChild(badge);
        } else if (a.sentry) {
          const badge = document.createElement('div');
          badge.className = 'al-garnizon-badge';
          badge.textContent = 'uśpiona';
          body.appendChild(badge);
        }
        if (typeof a.hpMax === 'number' && a.hpMax > 0) {
          const hpVal = Math.round(a.hp ?? 0);
          const hpMax = Math.round(a.hpMax);
          const pct = Math.max(0, Math.min(100, Math.round((hpVal / hpMax) * 100)));
          // Czerwień (ranna armia) → zieleń (pełne zdrowie), interpolacja po hue HSL.
          const hue = Math.round(pct * 1.2);
          const hpLbl = document.createElement('div');
          hpLbl.className = 'al-bar-lbl';
          hpLbl.innerHTML = '<span>Zdrowie</span><span class="al-bar-val">' + hpVal + '/' + hpMax + '</span>';
          body.appendChild(hpLbl);
          const hpbar = document.createElement('div');
          hpbar.className = 'al-hpbar';
          hpbar.title = 'Zdrowie: ' + pct + '%';
          const fill = document.createElement('i');
          fill.style.width = pct + '%';
          fill.style.backgroundColor = `hsl(${hue},65%,45%)`;
          hpbar.appendChild(fill);
          body.appendChild(hpbar);
        }
        if (typeof a.ruchMax === 'number' && a.ruchMax > 0) {
          const ruchVal = a.ruchLeft ?? 0;
          const pct = Math.max(0, Math.min(100, Math.round((ruchVal / a.ruchMax) * 100)));
          const mvLbl = document.createElement('div');
          mvLbl.className = 'al-bar-lbl';
          mvLbl.innerHTML = '<span>Ruch</span><span class="al-bar-val">' + ruchVal + '/' + a.ruchMax + '</span>';
          body.appendChild(mvLbl);
          const mvbar = document.createElement('div');
          mvbar.className = 'al-mvbar';
          mvbar.title = 'Ruch: ' + ruchVal + ' z ' + a.ruchMax;
          const fill = document.createElement('i');
          fill.style.width = pct + '%';
          mvbar.appendChild(fill);
          body.appendChild(mvbar);
        }
        if (a.detailLine) {
          const det = document.createElement('div');
          det.className = 'al-detail';
          det.textContent = a.detailLine;
          body.appendChild(det);
        }
        if (a.metaLine) {
          const meta = document.createElement('div');
          meta.className = 'al-meta';
          meta.textContent = a.metaLine;
          body.appendChild(meta);
        }
        row.appendChild(ico);
        row.appendChild(body);
        const go = () => config.onSelectArmy(a.id);
        row.addEventListener('click', go);
        row.addEventListener('keydown', (ev: KeyboardEvent) => {
          if (ev.key === 'Enter' || ev.key === ' ') {
            ev.preventDefault();
            go();
          }
        });
        panel.appendChild(row);
      }
      const hint = document.createElement('div');
      hint.className = 'al-hint';
      hint.textContent = 'Kliknij armię, aby ją zaznaczyć na mapie. ✕ lub Esc — powrót. Ponowne ⚔ — zamknij listę.';
      panel.appendChild(hint);
    }

    scroll.appendChild(panel);
    el.innerHTML = '';
    el.appendChild(scroll);
  }

  function show(): void {
    open = true;
    render();
    el.classList.add('open');
    pushOverlay('army-list', closeList);
    unbindOutside?.();
    unbindOutside = bindHudPanelOutsideDismiss(
      el,
      () => open,
      closeList,
      '[data-act="army"]',
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
    popOverlay('army-list');
    unbindOutside?.();
    unbindOutside = null;
    el.remove();
    if (api?.el === el) api = null;
  }

  api = { el, isOpen: () => open, toggle, show, hide, update, destroy };
  return api;
}

export function setArmyListSelectedId(unitId: string | null): void {
  selectedHighlightId = unitId;
  api?.update();
}

export function isArmyListHudOpen(): boolean {
  return api?.isOpen() ?? false;
}

export function toggleArmyListHud(): void {
  api?.toggle();
}

export function showArmyListHud(): void {
  api?.show();
}

export function hideArmyListHud(): void {
  api?.hide();
}

export function refreshArmyListHudIfOpen(): void {
  api?.update();
}

export function destroyArmyListHud(): void {
  api?.destroy();
  api = null;
}
