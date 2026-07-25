/**
 * armyStackHud.ts — dolny pasek armii (A-06 · 1E).
 * Karty jednostek na stosie + statystyki aktywnej + akcje.
 */

import type { UnitPanelAction } from './unitPanelHud';
import {
  ensureMapUnitBrandScope,
  mapUnitBrandIconHtml,
  mapUnitCloseBtnHtml,
  MAP_UNIT_1E_SHARED_CSS,
} from './mapUnitHudSkin';
import { formatJednostkiCount } from './formatPl';
import { unitIconSvg } from './icons/brandAssets';

export interface ArmyStackCard {
  id: string;
  name: string;
  icon: string;
  hp: number;
  hpMax: number;
  ruchLeft: number;
  ruchMax: number;
  active: boolean;
}

export interface ArmyStackHudState {
  hexLabel: string;
  unitCount: number;
  cards: ArmyStackCard[];
  atk: number;
  def: number;
  mov: number;
  rng: number;
  hp: number;
  hpMax: number;
  actions: UnitPanelAction[];
}

export interface ArmyStackHudConfig {
  getStack: () => ArmyStackHudState | null;
  onSelectUnit: (unitId: string) => void;
  onAction: (actionId: string) => void;
  onClose: () => void;
  onMerge?: () => void;
  canMerge?: () => boolean;
  onSplit?: () => void;
  canSplit?: () => boolean;
  onOpenArmyList?: () => void;
}

export interface ArmyStackHudApi {
  el: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-army-stack-hud-css-v2-1e';
const BOTTOM_BAR_H = 56;

function ensureStyles(): void {
  ensureMapUnitBrandScope();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
${MAP_UNIT_1E_SHARED_CSS}
.civ-army-stack{position:fixed;left:50%;transform:translateX(-50%);bottom:${BOTTOM_BAR_H}px;
  z-index:311;width:min(760px,calc(100vw - 24px));display:none;flex-direction:column;
  background:linear-gradient(180deg,rgba(18,24,32,.98) 0%,rgba(8,10,16,.96) 100%);
  border:2px solid rgba(232,216,138,.32);border-bottom:none;border-radius:12px 12px 0 0;
  box-shadow:0 -8px 40px rgba(0,0,0,.65);font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);
  color:var(--civ-text-primary,#e8e0c8);}
.civ-army-stack.open{display:flex;}
.civ-army-stack .ash-hdr{display:flex;align-items:center;gap:8px;padding:10px 14px 8px;
  border-bottom:1px solid rgba(232,216,138,.18);}
.civ-army-stack .ash-title-wrap{flex:1;display:flex;align-items:flex-start;gap:8px;min-width:0;}
.civ-army-stack .ash-title-ic{width:22px;height:22px;color:var(--civ-gold-primary,#e8d88a);margin-top:1px;}
.civ-army-stack .ash-title{font-family:var(--civ-font-title,Georgia,serif);font-size:0.95em;font-weight:400;
  color:var(--civ-gold-primary,#e8d88a);letter-spacing:.04em;line-height:1.2;}
.civ-army-stack .ash-meta{font-family:var(--civ-font-ui,'Segoe UI',Tahoma,sans-serif);
  font-size:0.68em;color:var(--civ-text-muted,#8a8070);margin-top:2px;font-weight:400;
  letter-spacing:.06em;text-transform:uppercase;}
.civ-army-stack .ash-hdr-actions{display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end;}
.civ-army-stack .ash-cards{display:flex;gap:8px;padding:10px 14px;overflow-x:auto;scrollbar-width:thin;}
.civ-army-stack .ash-cards::-webkit-scrollbar{height:4px;}
.civ-army-stack .ash-cards::-webkit-scrollbar-thumb{background:rgba(232,216,138,.25);border-radius:2px;}
.civ-army-stack .ash-card{flex:0 0 auto;width:92px;padding:8px 6px 6px;border-radius:8px;cursor:pointer;
  border:1px solid rgba(232,216,138,.18);background:linear-gradient(180deg,rgba(24,30,42,.92),rgba(12,16,24,.88));
  transition:border-color .15s,box-shadow .15s,background .15s;}
.civ-army-stack .ash-card:hover{border-color:rgba(232,216,138,.38);}
.civ-army-stack .ash-card.on{border-color:rgba(232,216,138,.62);background:linear-gradient(180deg,rgba(36,32,18,.95),rgba(18,16,10,.92));
  box-shadow:0 0 18px rgba(232,216,138,.12);}
.civ-army-stack .ash-card-ic{font-size:22px;line-height:1;text-align:center;min-height:24px;}
.civ-army-stack .ash-card-name{font-size:0.68em;font-weight:700;color:var(--civ-text-primary,#e8e0c8);margin-top:5px;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-align:center;}
.civ-army-stack .ash-card-hp{height:4px;background:rgba(0,0,0,.35);border-radius:2px;margin-top:5px;overflow:hidden;}
.civ-army-stack .ash-card-hp i{display:block;height:100%;background:linear-gradient(90deg,#1a6020,#50b070);}
.civ-army-stack .ash-card-mv{font-size:0.62em;color:var(--civ-text-muted,#8a8070);text-align:center;margin-top:4px;
  letter-spacing:.04em;}
.civ-army-stack .ash-body{padding:0 14px 12px;display:flex;gap:14px;align-items:flex-end;}
.civ-army-stack .ash-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;flex:1;}
.civ-army-stack .ash-actions{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;max-width:240px;}
.civ-army-stack .ash-act-danger{border-color:rgba(200,64,64,.45)!important;color:#ffb0b0!important;}
.civ-army-stack .ash-act-danger:hover:not(:disabled){border-color:rgba(200,64,64,.65)!important;color:#ffd0d0!important;}
.civ-army-stack .ash-act-icon{min-width:0;width:34px;height:34px;padding:0;flex:none;}
.civ-army-stack .ash-act-ic{width:17px;height:17px;display:block;}
.civ-army-stack .ash-act-ic svg{width:100%;height:100%;display:block;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Ikony przycisków akcji jednostki (R-ARMYSTACK-IKONY, Maciej 2026-07-24) --
 * infografiki zamiast słów, styl inline-SVG jak preBattle.ts (PB_ICON_*):
 * viewBox 24x24, stroke=currentColor. Manifest brand-book (icons-manifest.json)
 * nie ma dopasowań dla "zastąp/pomiń/czuwaj" -- tylko fortyfikacja ma bliski
 * odpowiednik (chip-garrison), ale zostaje custom SVG dla spójności całego rzędu.
 * Tooltip (title/aria-label) niesie PEŁNĄ nazwę akcji z a.label.
 */
const ASH_ACTION_ICONS: Partial<Record<string, string>> = {
  // Ufortyfikuj -- fort/palisada z blankami.
  fortify:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M4 21V10l3-2.5V6h2v1.5L12 5l3 2.5V6h2v1.5l3 2.5v11z"/>'
    + '<path d="M4 21h16M9.5 21v-5h5v5"/>'
    + '</svg>',
  // Zastąp -- strzałki góra/dół (swap).
  replace:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M7.5 3v14"/><path d="M4.5 6 7.5 3l3 3"/>'
    + '<path d="M16.5 21V7"/><path d="M19.5 18l-3 3-3-3"/>'
    + '</svg>',
  // Pomiń -- podwójny chevron "skip/dalej" (step-over).
  skip:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
    + '<path d="M5 5l6.5 7-6.5 7"/><path d="M12.5 5l6.5 7-6.5 7"/>'
    + '</svg>',
  // Czuwaj/Obudź (Sentry, C-SENTRY-Q1) -- półksiężyc, uniwersalny symbol
  // "uśpienia/wartowania" w grach strategicznych (czytelniejszy w 24px niż
  // zamknięte oko/„Zzz" -- patrz raport dla uzasadnienia wyboru).
  sentry:
    '<svg viewBox="0 0 24 24" fill="currentColor" stroke="none">'
    + '<path d="M20.7 14.9A9 9 0 1 1 9.4 3.3a7.2 7.2 0 0 0 11.3 11.6z"/>'
    + '</svg>',
};

function outlineBtn(label: string, dataAttr: string, extraClass = '', disabled = false, title = ''): string {
  return `<button type="button" class="mu-outline-btn ${extraClass}" ${dataAttr}`
    + (disabled ? ' disabled' : '')
    + (title ? ` title="${esc(title)}"` : '')
    + `>${esc(label)}</button>`;
}

/** Dolny pasek stosu armii (karty + staty + akcje). */
export function createArmyStackHud(config: ArmyStackHudConfig): ArmyStackHudApi {
  ensureStyles();
  const el = document.createElement('div');
  el.className = 'civ-army-stack';

  function render(): void {
    const st = config.getStack();
    if (st === null || st.cards.length === 0) {
      el.classList.remove('open');
      return;
    }
    el.classList.add('open');
    const mergeOk = config.canMerge?.() ?? false;
    const splitOk = config.canSplit?.() ?? false;
    const armyIc = mapUnitBrandIconHtml('tb-army', 24, 'ash-title-ic');
    const menuIc = mapUnitBrandIconHtml('ui-menu', 24, 'mu-ic');

    let html = '<div class="ash-hdr"><div class="ash-title-wrap">'
      + armyIc
      + '<div><div class="ash-title">Armia · ' + esc(st.hexLabel) + '</div>'
      + '<div class="ash-meta">' + formatJednostkiCount(st.unitCount) + ' na heksie</div></div></div>'
      + '<div class="ash-hdr-actions">';

    if (config.onOpenArmyList) {
      html += `<button type="button" class="mu-outline-btn" data-list>${menuIc}<span>Lista</span></button>`;
    }
    html += outlineBtn(
      'Rozdziel',
      'data-split',
      'accent-violet',
      !splitOk,
      splitOk ? 'Rozdziel stos na sąsiedni heks' : 'Potrzeba co najmniej 2 jednostek',
    );
    html += outlineBtn(
      'Połącz',
      'data-merge',
      'accent-blue',
      !mergeOk,
      mergeOk ? 'Połącz z sąsiednią armią' : 'Brak sąsiedniej armii do połączenia',
    );
    html += mapUnitCloseBtnHtml('Odznacz');
    html += '</div></div>';

    html += '<div class="ash-cards">';
    for (const c of st.cards) {
      const hpPct = c.hpMax > 0 ? Math.round((c.hp / c.hpMax) * 100) : 0;
      html += '<div class="ash-card' + (c.active ? ' on' : '') + '" data-unit="' + esc(c.id) + '" role="button" tabindex="0">'
        + '<div class="ash-card-ic">' + (c.icon || unitIconSvg(undefined)) + '</div>'
        + '<div class="ash-card-name">' + esc(c.name) + '</div>'
        + '<div class="ash-card-hp"><i style="width:' + hpPct + '%"></i></div>'
        + '<div class="ash-card-mv">' + c.ruchLeft + '/' + c.ruchMax + ' ruch</div>'
        + '</div>';
    }
    html += '</div>';

    html += '<div class="ash-body"><div class="ash-stats">'
      + '<div class="mu-stat"><div class="l">Atak</div><div class="v">' + st.atk + '</div></div>'
      + '<div class="mu-stat"><div class="l">Obrona</div><div class="v">' + st.def + '</div></div>'
      + '<div class="mu-stat"><div class="l">Ruch</div><div class="v">' + st.mov + '</div></div>'
      + '<div class="mu-stat"><div class="l">Zasięg</div><div class="v">' + st.rng + '</div></div>'
      + '</div><div class="ash-actions">';
    for (const a of st.actions) {
      let cls = a.primary ? 'mu-gold-btn' : 'mu-muted-btn';
      if (a.danger) cls += ' ash-act-danger';
      const icon = ASH_ACTION_ICONS[a.id];
      const body = icon ? '<span class="ash-act-ic">' + icon + '</span>' : esc(a.label);
      if (icon) cls += ' ash-act-icon';
      html += '<button type="button" class="' + cls + '" data-act="' + esc(a.id) + '"'
        + ' title="' + esc(a.label) + '" aria-label="' + esc(a.label) + '"'
        + (a.disabled ? ' disabled' : '') + '>' + body + '</button>';
    }
    html += '</div></div>';

    el.innerHTML = html;

    el.querySelector('.mu-close-btn')?.addEventListener('click', () => config.onClose());
    el.querySelector('[data-list]')?.addEventListener('click', () => config.onOpenArmyList?.());
    el.querySelector('[data-merge]')?.addEventListener('click', () => {
      if (mergeOk) config.onMerge?.();
    });
    el.querySelector('[data-split]')?.addEventListener('click', () => {
      if (splitOk) config.onSplit?.();
    });
    el.querySelectorAll('[data-unit]').forEach(card => {
      const go = () => {
        const id = (card as HTMLElement).getAttribute('data-unit');
        if (id) config.onSelectUnit(id);
      };
      card.addEventListener('click', go);
      card.addEventListener('keydown', (ev: Event) => {
        const ke = ev as KeyboardEvent;
        if (ke.key === 'Enter' || ke.key === ' ') { ke.preventDefault(); go(); }
      });
    });
    el.querySelectorAll('[data-act]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = (btn as HTMLElement).getAttribute('data-act');
        if (id !== null) config.onAction(id);
      });
    });
  }

  document.body.appendChild(el);
  render();
  return { el, update: render, destroy: () => el.remove() };
}
