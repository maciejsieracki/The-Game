/**
 * armyListHud.ts — lista armii gracza na mapie (po kliknięciu medalionu Armia w
 * toolbarze). Reskin do palety 3b — MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §3: karta
 * zamiast płaskiego wiersza, 4 plakietki stanu w 3 kolorach (złoto=stan obronny,
 * neutralny=uśpiona, błękit=auto-eksploracja), zaznaczenie z lewym paskiem 2px +
 * plakietką „ZAZNACZONA". Style współdzielone z cityListHud.ts przez sideListHud.css.ts.
 */

import { pushOverlay, popOverlay } from './escapeOverlayStack';
import { bindHudPanelOutsideDismiss } from './hudPanelDismiss';
import { brandIconSvg } from './icons/brandAssets';
import { formatJednostkiCount, formatZaznaczArmieLabel } from './formatPl';
import {
  SIDE_LIST_ROOT_CLASS,
  ensureSideListHudStyles,
  sideListBadgeHtml,
  sideListEmptyStateHtml,
  armyStatusBadge,
  pctClamped,
  hpValueColor,
  type SideListBadgeVariant,
} from './sideListHud.css';

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
   * i obudzi (sentry). Oznaczona wizualnie badge'em „w garnizonie".
   */
  inGarnizon?: boolean;
  /** Jednostka ufortyfikowana w polu (nie garnizon miasta). */
  ufortyfikowanyWPolu?: boolean;
  /** Jednostka w trybie czuwania (uśpiona do wykrycia wroga). */
  sentry?: boolean;
  /** Zwiadowca w auto-eksploracji (ruch wykonywany automatycznie na koniec tury). */
  autoExplore?: boolean;
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

const STYLE_ID = 'civ-army-list-hud-css-v2';

/** CSS wyłącznie tego panelu: paski Zdrowie/Ruch. Reszta (karta, kafelek, nagłówek,
 *  plakietki, stan pusty) — sideListHud.css.ts. */
function ensureStyles(): void {
  ensureSideListHudStyles();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-army-list-hud .al-bar-lbl{display:flex;justify-content:space-between;align-items:baseline;
  font-size:0.68em;color:var(--muted);text-transform:uppercase;letter-spacing:.04em;margin-top:0.32em;}
.civ-army-list-hud .al-bar-lbl .al-bar-val{color:#d4d9e2;font-weight:700;text-transform:none;letter-spacing:0;}
.civ-army-list-hud .al-mvbar{height:6px;background:rgba(0,0,0,.35);border-radius:999px;margin-top:0.14em;overflow:hidden;}
.civ-army-list-hud .al-mvbar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#1d4e8f,#6fb0f0);transition:width .2s;}
.civ-army-list-hud .al-hpbar{height:6px;background:rgba(0,0,0,.35);border-radius:999px;margin-top:0.14em;overflow:hidden;}
.civ-army-list-hud .al-hpbar i{display:block;height:100%;border-radius:999px;transition:width .2s,background-color .2s;}
.civ-army-list-hud .al-hex{font-size:11px;color:var(--muted);margin-top:.2em;}
.civ-army-list-hud .al-detail{font-size:0.78em;color:#d4cba0;margin-top:0.18em;line-height:1.35;}
.civ-army-list-hud .al-meta{font-size:0.72em;color:var(--muted);margin-top:0.1em;}
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
  el.className = `civ-army-list-hud ${SIDE_LIST_ROOT_CLASS}`;
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

    const header = document.createElement('div');
    header.className = 'sl-header';
    header.innerHTML = `<span class="sl-header-ic">${brandIconSvg('tb-army', 18)}</span>`
      + `<span class="sl-title">Armie</span>`;
    if (armies.length > 0) {
      const totalUnits = armies.reduce((s, a) => s + a.unitCount, 0);
      const count = document.createElement('span');
      count.className = 'sl-count';
      count.textContent = `${armies.length} · ${totalUnits} jedn.`;
      header.appendChild(count);
    }
    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'sl-close';
    closeBtn.title = 'Zamknij listę (Esc)';
    closeBtn.setAttribute('aria-label', 'Zamknij listę armii');
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      closeList();
    });
    header.appendChild(closeBtn);

    const scroll = document.createElement('div');
    scroll.className = 'sl-scroll';

    if (armies.length === 0) {
      scroll.innerHTML = sideListEmptyStateHtml(
        brandIconSvg('tb-army', 32),
        'Brak jednostek na mapie — zrekrutuj wojsko w mieście.',
      );
    } else {
      for (const a of armies) {
        const selected = selectedHighlightId === a.id;
        const row = document.createElement('div');
        row.className = 'sl-item' + (selected ? ' selected' : '');
        row.setAttribute('role', 'button');
        row.tabIndex = 0;
        row.title = a.inGarnizon
          ? 'Zaznacz ' + a.name + ' — w garnizonie; rozkaz ruchu ją odfortyfikuje i obudzi'
          : a.sentry
            ? 'Zaznacz ' + a.name + ' — uśpiona; rozkaz ruchu ją obudzi'
            : a.ufortyfikowanyWPolu
              ? 'Zaznacz ' + a.name + ' — ufortyfikowana w polu; rozkaz ruchu zdejmie fortyfikację'
              : a.autoExplore
                ? 'Zaznacz ' + a.name + ' — w auto-eksploracji; pomijana przez Spację, rusza się sama na koniec tury'
                : a.unitCount > 1
            ? formatZaznaczArmieLabel(a.unitCount)
            : 'Zaznacz ' + a.name;

        const ico = document.createElement('span');
        ico.className = 'sl-ico';
        ico.innerHTML = brandIconSvg('tb-army', 18);

        const body = document.createElement('div');
        body.className = 'sl-body';

        const badges: Array<{ text: string; variant: SideListBadgeVariant }> = [];
        const statusBadge = armyStatusBadge(a);
        if (statusBadge) badges.push(statusBadge);
        if (selected) badges.push({ text: 'ZAZNACZONA', variant: 'green' });

        const nameRow = document.createElement('div');
        nameRow.className = 'sl-name-row';
        const name = document.createElement('div');
        name.className = 'sl-name';
        name.textContent = a.name;
        name.title = a.name;
        nameRow.appendChild(name);
        if (badges.length > 0) {
          const badgesWrap = document.createElement('span');
          badgesWrap.className = 'sl-badges';
          badgesWrap.innerHTML = badges.map(b => sideListBadgeHtml(b.text, b.variant)).join('');
          nameRow.appendChild(badgesWrap);
        }
        body.appendChild(nameRow);

        const hex = document.createElement('div');
        hex.className = 'al-hex';
        hex.textContent = 'Heks ' + a.hexLabel
          + (a.unitCount > 1 ? ' · ' + formatJednostkiCount(a.unitCount) : '');
        body.appendChild(hex);

        if (typeof a.hpMax === 'number' && a.hpMax > 0) {
          const hpVal = Math.round(a.hp ?? 0);
          const hpMax = Math.round(a.hpMax);
          const pct = pctClamped(hpVal, hpMax);
          // Czerwień (ranna armia) → zieleń (pełne zdrowie), interpolacja po hue HSL — BEZ ZMIAN
          // (MIASTA-ARMIE-PANEL-LEWY-2026-08-14 §3.4: „jedyny kolor w panelu liczony z danych").
          const hue = Math.round(pct * 1.2);
          const hpColor = hpValueColor(pct);
          const hpLbl = document.createElement('div');
          hpLbl.className = 'al-bar-lbl';
          hpLbl.innerHTML = '<span>Zdrowie</span><span class="al-bar-val"'
            + (hpColor ? ` style="color:${hpColor}"` : '')
            + '>' + hpVal + '/' + hpMax + '</span>';
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
          const pct = pctClamped(ruchVal, a.ruchMax);
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
        scroll.appendChild(row);
      }
      const hint = document.createElement('div');
      hint.className = 'sl-hint';
      hint.textContent = 'Kliknij armię, aby ją zaznaczyć na mapie. ✕ lub Esc — powrót. Ponowne ⚔ — zamknij listę.';
      scroll.appendChild(hint);
    }

    el.innerHTML = '';
    el.appendChild(header);
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
