/**
 * buildModeHud.ts — tryb 🔨 Budowa (A4-Q1=A, A4-D4-Q1=A).
 * Panel 15 ulepszeń + banner; dane/kwalifikacja od MAPA (SILNIK wpina API).
 * LANE: src/ui/* — bez main.ts.
 */

import type { ImprovementKey } from '../render/improvements';
import { improvementIconSvg } from './icons/brandAssets';
import { techIconSvg } from './techIcons';

export interface BuildTypeInfo {
  key: ImprovementKey;
  label: string;
  kosztPraca: number;
  epoka: number;
  typ?: 'wycinka' | 'ulepszenie';
  techId?: string | null;
  techUnlocked?: boolean;
  techLabel?: string | null;
  /** Pełny tekst wymagań gdy zablokowane (hover). */
  lockHint?: string | null;
}

/** Cud świata dostępny do kolejki produkcji (CUDA — panel budowy). */
export interface WonderBuildTypeInfo {
  id: string;
  label: string;
  kosztPraca: number;
  epokaWejscia: number;
  /** E = wyłączny cywilizacji, R = wyścig światowy. */
  dostep?: string;
  /** Już w kolejce miasta docelowego. */
  queued?: boolean;
  lockHint?: string | null;
}

export interface BuildModeHudConfig {
  /** Lista typów (np. createImprovementBuildApi().listTypes). */
  listTypes: () => BuildTypeInfo[];
  getActiveKey: () => ImprovementKey | null;
  onSelectType: (key: ImprovementKey | null) => void;
  onExit: () => void;
  /** Czy tryb budowy aktywny (pokaz panel). */
  isOpen: () => boolean;
  /** Cuda świata — lista na dole panelu (tylko aktualnie dostępne dla cywilizacji). */
  listWonders?: () => WonderBuildTypeInfo[];
  onSelectWonder?: (wonderId: string) => void;
  /** Podtytuł sekcji cudów (np. miasto docelowe kolejki). */
  getWonderTargetLabel?: () => string | null;
  /** A-START-05: gracz bez miasta — przycisk Załóż miasto. */
  canFoundCity?: () => boolean;
  isFoundCityActive?: () => boolean;
  onSelectFoundCity?: () => void;
  /** Etykieta kosztu założenia miasta (np. „20 P · 1 👤"). */
  getFoundCityCostLabel?: () => string;
  /** Podpowiedź gdy założenie zablokowane (za mało P / ludności). */
  getFoundCityLockHint?: () => string | null;
  /** R-PIERWSZE-MIASTO: tylko przycisk Załóż miasto (bez ulepszeń/cudów). */
  isFoundCityOnly?: () => boolean;
}

export interface BuildModeHudApi {
  el: HTMLDivElement;
  bannerEl: HTMLDivElement;
  update: () => void;
  destroy: () => void;
}

const STYLE_ID = 'civ-build-mode-hud-css';

function impIconHtml(key: ImprovementKey | string): string {
  const svg = improvementIconSvg(key, 18);
  return svg ? svg.replace('<svg ', '<svg class="civ-build-imp-ic" ') : '';
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-build-banner{position:fixed;top:48px;left:50%;transform:translateX(-50%);z-index:312;
  display:none;align-items:center;gap:12px;padding:8px 16px;
  background:rgba(48,32,8,.94);border:1px solid rgba(232,176,74,.55);border-radius:6px;
  font:12px 'Segoe UI',Tahoma,sans-serif;color:#ffe8c0;box-shadow:0 4px 20px rgba(0,0,0,.5);}
.civ-build-banner.open{display:flex;}
.civ-build-banner button{background:rgba(255,255,255,.08);border:1px solid rgba(232,176,74,.4);
  color:#ffe8c0;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:11px;}
.civ-build-panel{position:fixed;top:90px;right:12px;z-index:311;width:240px;max-height:calc(100vh - 180px);
  overflow-y:auto;display:none;flex-direction:column;gap:4px;padding:8px;
  background:rgba(12,18,35,.94);border:1px solid rgba(232,216,138,.28);border-radius:8px;
  font:12px 'Segoe UI',Tahoma,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.55);}
.civ-build-panel.open{display:flex;}
.civ-build-panel .lbl{font-size:8px;text-transform:uppercase;letter-spacing:1px;color:#7a7055;margin-bottom:4px;}
.civ-build-item{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:5px;cursor:pointer;
  border:1px solid transparent;color:#d4cba0;transition:background .15s,border-color .15s;}
.civ-build-item:hover{background:rgba(232,216,138,.06);border-color:rgba(232,216,138,.25);}
.civ-build-item.sel{background:rgba(232,216,138,.12);border-color:rgba(232,216,138,.5);color:#f0e8b8;}
.civ-build-item .ic{display:flex;align-items:center;justify-content:center;width:22px;height:18px;flex-shrink:0;color:#e8d88a;}
.civ-build-item .ic svg{display:block;}
.civ-build-item .meta{font-size:9px;color:#7a7055;margin-left:auto;}
.civ-build-item.disabled{opacity:.38;pointer-events:none;filter:grayscale(.85);}
.civ-build-item.locked{opacity:.48;cursor:help;}
.civ-build-item.locked:hover{background:rgba(232,176,74,.08);border-color:rgba(232,176,74,.35);}
.civ-build-item.locked .meta{color:#c9a060;font-size:8px;max-width:95px;text-align:right;line-height:1.2;}
.civ-build-lock-tip{position:fixed;z-index:320;max-width:240px;padding:8px 10px;
  background:rgba(24,16,8,.96);border:1px solid rgba(232,176,74,.5);border-radius:6px;
  font:11px 'Segoe UI',Tahoma,sans-serif;color:#ffe8c0;pointer-events:none;
  box-shadow:0 4px 16px rgba(0,0,0,.55);display:none;}
.civ-build-wonders-gap{margin-top:10px;padding-top:8px;border-top:1px solid rgba(232,216,138,.22);}
.civ-build-wonders-sub{font-size:9px;color:#9a9070;line-height:1.35;margin:-2px 0 6px 2px;}
.civ-build-item.wonder{border-color:rgba(212,175,95,.12);}
.civ-build-item.wonder:hover{border-color:rgba(212,175,95,.38);}
.civ-build-item.wonder.sel{background:rgba(212,175,95,.14);border-color:rgba(212,175,95,.55);}
.civ-build-item.wonder .ic{color:#e8c878;}
.civ-build-wonders-empty{font-size:10px;color:#7a7055;line-height:1.4;padding:4px 2px 2px;}
`;
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = css;
  document.head.appendChild(s);
}

/** Montuje banner + panel wyboru ulepszeń (D1B mockup G2). */
export function createBuildModeHud(config: BuildModeHudConfig): BuildModeHudApi {
  ensureStyles();

  const bannerEl = document.createElement('div');
  bannerEl.className = 'civ-build-banner';
  bannerEl.innerHTML = '<span id="civ-build-banner-text">🔨 TRYB BUDOWY — wybierz ulepszenie, kliknij hex (ESC = wyjście)</span>'
    + '<button type="button" data-exit>✕ Wyjdź</button>';
  bannerEl.querySelector('[data-exit]')?.addEventListener('click', () => config.onExit());

  const el = document.createElement('div');
  el.className = 'civ-build-panel';

  const lockTip = document.createElement('div');
  lockTip.className = 'civ-build-lock-tip';
  document.body.appendChild(lockTip);

  let unbindOutside: (() => void) | null = null;

  function syncOutsideDismiss(): void {
    unbindOutside?.();
    unbindOutside = null;
    if (!config.isOpen()) return;

    const onPointer = (ev: PointerEvent): void => {
      if (!config.isOpen()) return;
      const target = ev.target;
      if (!(target instanceof Node)) return;
      if (el.contains(target) || bannerEl.contains(target)) return;
      // Cały lewy toolbar — przełączenie trybu w jednym kliknięciu (nie dismiss przed click).
      if (target instanceof Element && target.closest('.civ-map-toolbar')) return;
      // Klik w mapę — zawsze obsługuje main.ts (mouseup); nie zamykaj trybu przed założeniem miasta.
      if (target instanceof Element && target.closest('canvas')) return;
      config.onExit();
    };
    document.addEventListener('pointerdown', onPointer, true);
    unbindOutside = () => document.removeEventListener('pointerdown', onPointer, true);
  }

  function showLockTip(text: string, anchor: HTMLElement): void {
    lockTip.textContent = '🔒 ' + text;
    lockTip.style.display = 'block';
    const r = anchor.getBoundingClientRect();
    lockTip.style.left = Math.max(8, r.left - 250) + 'px';
    lockTip.style.top = r.top + 'px';
  }
  function hideLockTip(): void {
    lockTip.style.display = 'none';
  }

  function render(): void {
    const open = config.isOpen();
    bannerEl.classList.toggle('open', open);
    el.classList.toggle('open', open);
    if (!open) {
      syncOutsideDismiss();
      return;
    }

    const active = config.getActiveKey();
    const foundCityOnly = config.isFoundCityOnly?.() ?? false;
    const types = foundCityOnly
      ? []
      : config.listTypes().filter(t => t.key !== 'pole_irygowane');
    const showFound = config.canFoundCity?.() ?? false;
    const foundActive = config.isFoundCityActive?.() ?? false;
    const bannerText = bannerEl.querySelector('#civ-build-banner-text');
    if (bannerText) {
      bannerText.textContent = foundActive
        ? '🏛️ ZAŁÓŻ MIASTO — kliknij podświetlony hex (ESC = wyjście)'
        : foundCityOnly
          ? '🏛️ ZAŁÓŻ PIERWSZE MIASTO — wybierz «Załóż miasto» w panelu'
          : '🔨 TRYB BUDOWY — wybierz ulepszenie, kliknij hex (ESC = wyjście)';
    }
    let html = '';
    if (showFound) {
      const fcLabel = config.getFoundCityCostLabel?.() ?? '';
      const fcHint = config.getFoundCityLockHint?.() ?? null;
      html += '<div class="lbl">Miasto</div>';
      html += '<div class="civ-build-item' + (foundActive ? ' sel' : '') + (fcHint ? ' locked' : '') + '" data-found-city="1"'
        + (fcHint ? ' data-lock-hint="' + fcHint.replace(/"/g, '&quot;') + '"' : '')
        + ' title="' + (fcHint ? fcHint : 'Załóż nowe miasto') + '">'
        + '<span class="ic">🏛️</span><span>Załóż miasto</span>'
        + (fcLabel ? '<span class="meta">' + fcLabel + '</span>' : '')
        + '</div>';
    }
    if (!foundCityOnly) {
      const wonders = config.listWonders?.() ?? [];
      const wonderTarget = config.getWonderTargetLabel?.() ?? null;
      if (wonders.length > 0) {
        html += '<div class="civ-build-wonders-gap"></div>';
        html += '<div class="lbl">Cuda świata</div>';
        if (wonderTarget) {
          html += '<div class="civ-build-wonders-sub">Kolejka produkcji: ' + wonderTarget + '</div>';
        }
        for (const w of wonders) {
          const locked = w.queued === true;
          const hint = w.lockHint ?? (locked ? 'Już w kolejce tego miasta' : null);
          const tag = w.dostep === 'R' ? ' · wyścig' : '';
          const costLabel = w.kosztPraca + ' P';
          html += '<div class="civ-build-item wonder' + (locked ? ' locked' : '') + '" data-wonder-id="' + w.id + '"'
            + (locked && hint ? ' data-lock-hint="' + hint.replace(/"/g, '&quot;') + '"' : '')
            + ' title="' + (locked && hint ? hint : (w.label + ' — epoka ' + w.epokaWejscia)) + '">'
            + '<span class="ic">🏛</span>'
            + '<span>' + w.label + '</span>'
            + '<span class="meta">' + (locked && hint ? hint : ('E' + w.epokaWejscia + ' · ' + costLabel + tag)) + '</span></div>';
        }
      }
      html += '<div class="lbl">Ulepszenia terenu</div>';
    }
    for (const t of types) {
      const locked = t.techUnlocked === false;
      const sel = t.key === active ? ' sel' : '';
      const ic = impIconHtml(t.key);
      const costLabel = t.kosztPraca <= 0 ? 'FREE' : t.kosztPraca + ' P';
      const hint = locked ? (t.lockHint ?? (t.techLabel ? 'Technologia: «' + t.techLabel + '»' : 'Zablokowane')) : '';
      const techHint = locked ? ' · 🔒' : '';
      const hintTechIc = (locked && t.techLabel) ? (techIconSvg(t.techLabel, 12) ?? '') : '';
      const hintTechIcWrap = hintTechIc
        ? '<span style="display:inline-flex;width:12px;height:12px;vertical-align:-2px;margin-right:3px">' + hintTechIc + '</span>'
        : '';
      html += '<div class="civ-build-item' + sel + (locked ? ' locked' : '') + '" data-key="' + t.key + '"'
        + (locked && hint ? ' data-lock-hint="' + hint.replace(/"/g, '&quot;') + '"' : '')
        + ' title="' + (locked && hint ? hint : t.label) + '">'
        + '<span class="ic">' + ic + '</span>'
        + '<span>' + t.label + '</span>'
        + '<span class="meta">' + (locked && hint ? (hintTechIcWrap + hint) : ('E' + t.epoka + ' · ' + costLabel + techHint)) + '</span></div>';
    }

    el.innerHTML = html;

    el.querySelector('[data-found-city]')?.addEventListener('click', () => {
      const fcHint = config.getFoundCityLockHint?.() ?? null;
      if (fcHint) {
        flashBanner('🔒 ' + fcHint);
        return;
      }
      config.onSelectFoundCity?.();
      render();
    });

    el.querySelectorAll('.civ-build-item[data-key]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (hint) {
        elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
        elItem.addEventListener('mouseleave', hideLockTip);
      }
      elItem.addEventListener('click', () => {
        const key = elItem.getAttribute('data-key') as ImprovementKey;
        if (elItem.classList.contains('locked')) {
          if (hint) flashBanner('🔒 ' + hint);
          return;
        }
        config.onSelectType(key === active ? null : key);
        render();
      });
    });

    el.querySelectorAll('[data-found-city][data-lock-hint]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (!hint) return;
      elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
      elItem.addEventListener('mouseleave', hideLockTip);
    });

    el.querySelectorAll('.civ-build-item[data-wonder-id]').forEach(item => {
      const elItem = item as HTMLElement;
      const hint = elItem.getAttribute('data-lock-hint');
      if (hint) {
        elItem.addEventListener('mouseenter', () => showLockTip(hint, elItem));
        elItem.addEventListener('mouseleave', hideLockTip);
      }
      elItem.addEventListener('click', () => {
        if (elItem.classList.contains('locked')) {
          if (hint) flashBanner('🔒 ' + hint);
          return;
        }
        const id = elItem.getAttribute('data-wonder-id');
        if (id) config.onSelectWonder?.(id);
        render();
      });
    });

    syncOutsideDismiss();
  }

  function flashBanner(msg: string): void {
    const bannerText = bannerEl.querySelector('#civ-build-banner-text');
    if (!bannerText) return;
    const prev = bannerText.textContent ?? '';
    bannerText.textContent = msg;
    setTimeout(() => { bannerText.textContent = prev; }, 3500);
  }

  document.body.appendChild(bannerEl);
  document.body.appendChild(el);
  render();

  return {
    el,
    bannerEl,
    update: render,
    destroy: () => {
      unbindOutside?.();
      unbindOutside = null;
      hideLockTip();
      lockTip.remove();
      bannerEl.remove();
      el.remove();
    },
  };
}
