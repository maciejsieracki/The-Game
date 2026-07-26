/**
 * mainMenu.ts
 * Main menu + global settings screen (UI task 4).
 * Visual language matches Gra-podglad-MENU.html (S0 hybryda 5=C, wideo 7=A).
 * Fully DECOUPLED from game logic: DOM + callbacks only.
 *
 * Tunable values: UI-parametry.xlsx -> data/ui-params.json -> uiParams.ts
 * LANE: src/ui/* only — NIE main.ts.
 */

import { UI_PARAMS } from './uiParams';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';
import {
  brandMenuEmblemSvg,
  brandMenuBackgroundCss,
  brandMenuComponentsCss,
  brandMotionCss,
  menuIconSvg,
} from './icons/brandAssets';
import heroMenuUrl from './assets/hero/hero-menu.png?url';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

/** One adjustable global setting (audio/video/UI). */
export interface MenuSetting {
  key: string;
  label: string;
  opts: string[];
  descs: string[];
  idx: number;
}

export interface MainMenuConfig {
  /** Version string shown in the subtitle (default UI_PARAMS.menu.wersja). */
  version?: string;
  /** Optional looped hero video (muted). Missing file → gradient fallback. */
  backgroundVideoUrl?: string;
  /** Return true when a save exists -> enables Kontynuuj / Wczytaj in „Więcej". */
  hasSave?: () => boolean;
  onNewGame?: () => void;
  onContinue?: () => void;
  onLoad?: () => void;
  onAbout?: () => void;
  onQuit?: () => void;
  /** Called whenever a setting changes, with the current values keyed by setting key. */
  onSettingsChange?: (values: Record<string, string>) => void;
  /** Dev: panel testu wydajności (CPU/GPU). */
  onPerfTest?: () => void;
}

/** Default hero video path when asset exists under gra/public or bundled URL. */
export const DEFAULT_MENU_VIDEO_URL = 'assets/menu-hero.webm';

let cfg: MainMenuConfig = {};

// ---------------------------------------------------------------------------
// Settings state (built from the UI param panel; persists while the app runs)
// ---------------------------------------------------------------------------

const SETTINGS: MenuSetting[] = UI_PARAMS.menu.ustawienia.map(s => ({
  key: s.key,
  label: s.label,
  opts: s.opts,
  descs: s.descs,
  idx: s.domyslny,
}));

/** Current settings as a {key: chosen-option} map. */
export function getMenuSettings(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const s of SETTINGS) out[s.key] = s.opts[s.idx] ?? '';
  return out;
}

// ---------------------------------------------------------------------------
// Styles (scoped under .civ-menu)
// ---------------------------------------------------------------------------

const STYLE_ID = 'civ-main-menu-css';
const BRAND_MENU_STYLE_ID = 'civ-brand-menu-css';

function ensureBrandMenuStyles(): void {
  if (document.getElementById(BRAND_MENU_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BRAND_MENU_STYLE_ID;
  style.textContent = brandMotionCss + '\n' + brandMenuBackgroundCss + '\n' + brandMenuComponentsCss;
  document.head.appendChild(style);
}

function ensureStyles(): void {
  ensureBrandRootTokens();
  ensureBrandMenuStyles();
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-menu{position:fixed;inset:0;z-index:500;overflow:auto;
  ${CIV_BRAND_SCOPE_VARS}
  color:var(--text-primary);font-family:var(--civ-font-title);background:#080a12;}
.civ-menu *{box-sizing:border-box;}
.civ-menu .cm-hero-root{position:fixed;inset:0;z-index:0;pointer-events:none;}
.civ-menu .cm-hero-art{position:absolute;inset:0;width:100%;height:100%;}
.civ-menu .cm-hero-art img{width:100%;height:100%;object-fit:cover;object-position:right top;display:block;}
.civ-menu .cm-hero-fade-l{position:absolute;inset:0;background:linear-gradient(90deg,#080a12 0%,#080a12 22%,rgba(8,10,18,.92) 32%,rgba(8,10,18,.45) 44%,transparent 58%);}
.civ-menu .cm-hero-vignette{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,10,18,.35),transparent 22%,transparent 70%,rgba(8,10,18,.55));}
.civ-menu .cm-shell{position:relative;z-index:2;min-height:100%;width:min(640px,92vw);flex:none;display:flex;flex-direction:column;justify-content:center;padding:0 clamp(1.5rem,5vw,4.4rem);
  background:linear-gradient(90deg,#080a12 0%,rgba(8,10,18,.95) 78%,transparent 100%);}
.civ-menu .cm-layout{display:flex;min-height:100%;align-items:stretch;}
.civ-menu .emblem-row{display:flex;align-items:center;gap:18px;margin-bottom:30px;}
.civ-menu .emblem{width:78px;height:78px;flex:none;border:2px solid var(--border-mid);border-radius:50%;
  display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 40% 34%,#151b26,#080a12);
  box-shadow:inset 0 2px 6px rgba(232,216,138,.22),0 0 30px rgba(232,216,138,.16);
  animation:tg-glow 5s ease-in-out infinite;color:var(--gold);}
.civ-menu .emblem svg{width:44px;height:44px;display:block;}
.civ-menu .emblem-tag{font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:var(--text-secondary);font-family:var(--civ-font-ui);line-height:1.45;}
.civ-menu .glabel{display:none;}
.civ-menu .title{font-size:clamp(42px,6vw,74px);letter-spacing:.1em;color:var(--gold-light);font-weight:400;text-align:left;
  text-shadow:0 2px 16px rgba(0,0,0,.7),0 0 34px rgba(232,216,138,.2);line-height:1;font-family:Georgia,'Times New Roman',serif;}
.civ-menu .orn{display:flex;align-items:center;gap:14px;margin:18px 0 10px;}
.civ-menu .orn-line{height:1px;width:90px;background:linear-gradient(90deg,var(--gold-dim),transparent);}
.civ-menu .orn-d{color:var(--gold-dim);font-size:12px;}
.civ-menu .sub{font-size:13px;letter-spacing:.24em;text-transform:uppercase;color:var(--text-secondary);text-align:left;font-family:var(--civ-font-ui);margin-bottom:46px;}
.civ-menu .menu{display:flex;flex-direction:column;gap:14px;width:100%;max-width:440px;}
.civ-menu .mbtn{position:relative;display:inline-flex;align-items:center;justify-content:flex-start;gap:12px;
  width:100%;font-family:var(--civ-font-ui);font-size:14px;letter-spacing:.16em;text-transform:uppercase;
  padding:0 26px;height:58px;cursor:pointer;border-radius:8px;transition:all .18s;text-align:left;}
.civ-menu .mbtn-ic{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;}
.civ-menu .mbtn-ic svg{width:20px;height:20px;display:block;}
.civ-menu .mbtn-lbl{display:inline-block;}
.civ-menu .mbtn.primary{height:64px;font-size:16px;font-weight:700;letter-spacing:.16em;justify-content:flex-start;}
.civ-menu .mbtn:disabled,.civ-menu .mbtn.soon{opacity:1;color:#5a564c;cursor:not-allowed;
  background:linear-gradient(180deg,#12141a,#0a0c10);border:1px solid rgba(255,255,255,.1);}
.civ-menu .mbtn.soon:hover{filter:none;background:linear-gradient(180deg,#12141a,#0a0c10);}
.civ-menu .mbtn .hint{display:block;font-size:10px;letter-spacing:.12em;color:#5a564c;margin-top:0;margin-left:8px;text-transform:uppercase;font-style:normal;}
.civ-menu .mbtn .badge-soon{font-size:10px;letter-spacing:.12em;color:#5a564c;margin-left:8px;vertical-align:middle;font-weight:400;}
.civ-menu .more-panel{display:none;width:100%;max-width:440px;margin-top:4px;background:rgba(18,18,26,0.92);border:1px solid var(--border-mid);
  border-radius:var(--radius-lg);padding:8px;gap:6px;flex-direction:column;backdrop-filter:blur(8px);}
.civ-menu .more-panel.open{display:flex;}
.civ-menu .more-panel .mbtn{font-size:12px;height:52px;padding:0 18px;letter-spacing:.18em;}
.civ-menu .footer{margin-top:44px;font-family:Arial,sans-serif;font-size:12px;letter-spacing:.24em;color:#5a564c;text-align:left;}
.civ-menu .screen{display:none;width:100%;max-width:760px;}
.civ-menu .screen.active{display:block;}
.civ-menu .menu-screen{display:none;flex-direction:column;align-items:flex-start;width:100%;}
.civ-menu .menu-screen.active{display:flex;}
.civ-menu .sh{text-align:center;margin-bottom:1.8rem;}
.civ-menu .sh h2{font-size:28px;font-weight:400;letter-spacing:0.1em;color:var(--gold-light);}
.civ-menu .sett-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;}
.civ-menu .srow{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:16px 18px;display:flex;flex-direction:column;gap:10px;}
.civ-menu .slbl{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:var(--text-secondary);font-family:Arial,sans-serif;display:flex;align-items:center;gap:8px;}
.civ-menu .slbl-ic{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;color:var(--text-gold);}
.civ-menu .slbl-ic svg{width:18px;height:18px;display:block;}
.civ-menu .sctl{display:flex;align-items:center;gap:10px;}
.civ-menu .arrbtn{width:30px;height:30px;border:1px solid var(--border-mid);background:transparent;color:var(--text-gold);cursor:pointer;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px;font-family:Arial,sans-serif;transition:all .15s;flex-shrink:0;}
.civ-menu .arrbtn:hover{border-color:var(--gold);background:rgba(201,168,76,0.1);}
.civ-menu .sval{flex:1;text-align:center;font-size:15px;color:var(--text-primary);letter-spacing:.04em;}
.civ-menu .vdesc{font-size:10px;color:var(--text-muted);font-family:Arial,sans-serif;display:block;margin-top:2px;font-style:italic;}
.civ-menu .back-row{display:flex;justify-content:center;margin-top:1.8rem;}
.civ-menu .btn-back{background:transparent;border:1px solid var(--border-mid);color:var(--text-secondary);font-family:Arial,sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;padding:10px 34px;cursor:pointer;border-radius:var(--radius);transition:all .15s;}
.civ-menu .btn-back:hover{border-color:var(--border-strong);color:var(--text-primary);}
.civ-menu .cm-toast{position:fixed;bottom:26px;left:50%;transform:translateX(-50%);z-index:560;
  background:var(--bg-card);border:1px solid var(--border-mid);color:var(--gold-light);
  font-family:Arial,sans-serif;font-size:12px;letter-spacing:.05em;padding:10px 20px;border-radius:var(--radius);
  opacity:0;transition:opacity .25s;pointer-events:none;box-shadow:0 6px 24px rgba(0,0,0,.6);}
.civ-menu .cm-toast.show{opacity:1;}
`;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const MENU_EMBLEM_HTML = () => brandMenuEmblemSvg();

let toastEl: HTMLDivElement | null = null;
let toastTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(msg: string): void {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'cm-toast';
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add('show');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl?.classList.remove('show'), 2600);
}

function menuIconHtml(id: string): string {
  const svg = menuIconSvg(id, 24);
  return svg ? '<span class="mbtn-ic">' + svg + '</span>' : '';
}

function btn(
  label: string,
  hint: string,
  primary: boolean,
  enabled: boolean,
  on: () => void,
  extraClass = '',
  iconId?: string,
): HTMLButtonElement {
  const b = document.createElement('button');
  const styleCls = primary ? ' tg-btn-primary primary' : ' tg-btn-outline';
  b.className = 'mbtn' + styleCls + (extraClass ? ' ' + extraClass : '');
  const icon = iconId ? menuIconHtml(iconId) : '';
  b.innerHTML = icon + '<span class="mbtn-lbl">' + label + (hint ? '<span class="hint">' + hint + '</span>' : '') + '</span>';
  b.disabled = !enabled;
  if (enabled) b.addEventListener('click', on);
  return b;
}

function soonBtn(label: string, toastMsg: string, iconId: string): HTMLButtonElement {
  const b = btn(
    label + '<span class="badge-soon">WKRÓTCE</span>',
    '',
    false,
    true,
    () => showToast(toastMsg),
    'soon tg-btn-disabled',
    iconId,
  );
  b.classList.add('soon');
  return b;
}

function mountMenuHeroBackground(container: HTMLElement): void {
  const wrap = document.createElement('div');
  wrap.className = 'cm-hero-root';
  wrap.innerHTML =
    '<div class="cm-hero-art">' +
    '<img src="' + heroMenuUrl + '" alt="" />' +
    '<div class="cm-hero-fade-l"></div>' +
    '<div class="cm-hero-vignette"></div>' +
    '</div>';
  container.appendChild(wrap);
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;
let moreOpen = false;
let morePanelEl: HTMLElement | null = null;
let moreToggleEl: HTMLButtonElement | null = null;

/**
 * Ekran pożegnalny — pokazywany, gdy przeglądarka odmówi zamknięcia karty.
 *
 * Powód istnienia: `window.close()` działa wyłącznie na oknie otwartym skryptem. Kartę, którą
 * użytkownik otworzył sam, może zamknąć tylko on. Bez tego ekranu przycisk „Wyjdź" sprawiałby
 * wrażenie zepsutego — a taki właśnie był przed 2026-07-26 (pusta funkcja `onQuit`).
 */
function showFarewellScreen(): void {
  if (document.getElementById('civ-farewell')) return;
  const box = document.createElement('div');
  box.id = 'civ-farewell';
  box.setAttribute('role', 'dialog');
  box.setAttribute('aria-modal', 'true');
  box.style.cssText =
    'position:fixed;inset:0;z-index:2147483646;display:grid;place-items:center;' +
    'background:rgba(6,8,14,0.96);font-family:Georgia,"Times New Roman",serif;color:#e8d88a;' +
    'text-align:center;padding:24px;';
  box.innerHTML =
    '<div style="max-width:520px">' +
      '<div style="font-size:30px;letter-spacing:.08em;margin-bottom:14px">THE GAME</div>' +
      '<div style="font-size:17px;color:#c8b898;line-height:1.6;margin-bottom:10px">' +
        'Dziękujemy za grę. Postęp jest zapisany.</div>' +
      '<div style="font-family:\'Segoe UI\',Tahoma,sans-serif;font-size:13.5px;color:#8a8070;line-height:1.6">' +
        'Przeglądarka nie pozwala stronie zamknąć karty, którą otworzyłeś samodzielnie — ' +
        'zamknij ją klawiszem <b style="color:#c8b898">Ctrl + W</b> albo krzyżykiem karty.</div>' +
      '<button id="civ-farewell-back" type="button" style="margin-top:22px;font-family:\'Segoe UI\',Tahoma,sans-serif;' +
        'font-size:13px;padding:9px 20px;border-radius:6px;background:transparent;color:#e8d88a;' +
        'border:2px solid #e8d88a;cursor:pointer">Wróć do menu</button>' +
    '</div>';
  document.body.appendChild(box);
  const back = box.querySelector('#civ-farewell-back') as HTMLButtonElement | null;
  back?.addEventListener('click', () => box.remove());
}

function closeMore(): void {
  moreOpen = false;
  morePanelEl?.classList.remove('open');
  if (moreToggleEl) moreToggleEl.innerHTML = menuIconHtml('menu-more') + '<span class="mbtn-lbl">Więcej &#9662;</span>';
}

function toggleMore(): void {
  moreOpen = !moreOpen;
  morePanelEl?.classList.toggle('open', moreOpen);
  if (moreToggleEl) moreToggleEl.innerHTML = menuIconHtml('menu-more') + '<span class="mbtn-lbl">' + (moreOpen ? 'Więcej &#9652;' : 'Więcej &#9662;') + '</span>';
}

/** Menu icon for a settings row key (only keys with a matching brand icon). */
const SETTING_ROW_ICON: Record<string, string> = {
  muzyka: 'menu-audio',
  efekty: 'menu-audio',
  jezyk: 'menu-language',
};

function settingRowIconHtml(key: string): string {
  const id = SETTING_ROW_ICON[key];
  if (!id) return '';
  const svg = menuIconSvg(id, 24);
  return svg ? '<span class="slbl-ic">' + svg + '</span>' : '';
}

function renderSettings(grid: HTMLElement): void {
  grid.innerHTML = '';
  SETTINGS.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'srow';
    const val = () => (s.opts[s.idx] ?? '') + '<span class="vdesc">' + (s.descs[s.idx] ?? '') + '</span>';
    row.innerHTML = '<div class="slbl">' + settingRowIconHtml(s.key) + s.label + '</div><div class="sctl"></div>';
    const ctl = row.querySelector('.sctl') as HTMLElement;
    const left = document.createElement('button'); left.className = 'arrbtn'; left.innerHTML = '&#8249;';
    const sval = document.createElement('div'); sval.className = 'sval'; sval.id = 'cm-sv-' + i; sval.innerHTML = val();
    const right = document.createElement('button'); right.className = 'arrbtn'; right.innerHTML = '&#8250;';
    const change = (d: number) => {
      s.idx = (s.idx + d + s.opts.length) % s.opts.length;
      sval.innerHTML = val();
      cfg.onSettingsChange?.(getMenuSettings());
    };
    left.addEventListener('click', () => change(-1));
    right.addEventListener('click', () => change(1));
    ctl.appendChild(left); ctl.appendChild(sval); ctl.appendChild(right);
    grid.appendChild(row);
  });
}

function build(): void {
  if (rootEl === null) return;
  const ver = cfg.version ?? UI_PARAMS.menu.wersja;
  const etap = (UI_PARAMS.menu.etap ?? '').trim();
  const hasSave = cfg.hasSave?.() ?? false;
  moreOpen = false;
  rootEl.innerHTML = '';

  mountMenuHeroBackground(rootEl);

  const layout = document.createElement('div');
  layout.className = 'cm-layout';

  const shell = document.createElement('div');
  shell.className = 'cm-shell';
  shell.innerHTML =
    '<div class="menu-screen active" id="cm-menu">' +
      '<div class="emblem-row"><div class="emblem">' + MENU_EMBLEM_HTML() + '</div>' +
      '<div class="emblem-tag">Cywilizacja<br>The Game</div></div>' +
      '<div class="title">THE GAME</div>' +
      '<div class="orn"><span class="orn-line"></span><span class="orn-d">◆</span></div>' +
      '<div class="sub">Wersja ' + ver + '</div>' +
      '<div class="menu" id="cm-buttons"></div>' +
      '<div class="more-panel" id="cm-more"></div>' +
      // Wersja NIE jest już zahardkodowana (Maciej 2026-07-26: „to już nie jest prototyp 0.1").
      // Jedno źródło prawdy: data/ui-params.json → menu.wersja + menu.etap. Dotąd numer stał
      // w DWÓCH miejscach naraz (tu jako „prototyp v0.1” i w danych jako „0.1”) — zmiana
      // w danych nie ruszała stopki.
      '<div class="footer">The Game · ' + etap + ' ' + ver + '</div>' +
    '</div>' +
    '<div class="screen" id="cm-settings">' +
      '<div class="sh"><h2>Ustawienia</h2></div>' +
      '<div class="sett-grid" id="cm-settgrid"></div>' +
      '<div class="back-row"><button class="btn-back" id="cm-back">&#8592; Wstecz do menu</button></div>' +
    '</div>';
  layout.appendChild(shell);
  rootEl.appendChild(layout);

  const menuScreen = shell.querySelector('#cm-menu') as HTMLElement;
  const setScreen = shell.querySelector('#cm-settings') as HTMLElement;
  const showSettings = () => { closeMore(); menuScreen.classList.remove('active'); setScreen.classList.add('active'); };
  const showMenu = () => { setScreen.classList.remove('active'); menuScreen.classList.add('active'); };

  const buttons = shell.querySelector('#cm-buttons') as HTMLElement;
  buttons.appendChild(btn('<span style="color:#8a6418;">▶</span> Rozpocznij grę', '', true, true, () => cfg.onNewGame?.(), 'primary', 'menu-play'));
  buttons.appendChild(soonBtn('Kampania', 'Kampania — wkrótce', 'menu-campaign'));
  buttons.appendChild(soonBtn('Multiplayer', 'Multiplayer — wkrótce', 'menu-multiplayer'));
  buttons.appendChild(btn('Ustawienia', '', false, true, showSettings, '', 'menu-settings'));

  moreToggleEl = btn('Więcej &#9662;', '', false, true, toggleMore, '', 'menu-more');
  buttons.appendChild(moreToggleEl);

  // WYJDŹ — pozycja MENU GŁÓWNEGO (Maciej 2026-07-26), nie podpozycja „Więcej".
  //
  // Ograniczenie przeglądarki, którego nie da się obejść: `window.close()` działa TYLKO na
  // oknie otwartym skryptem (`window.open`). Karty otwartej ręcznie przez użytkownika żadna
  // strona nie zamknie — to zabezpieczenie przeglądarki, nie brak implementacji. Dlatego
  // próbujemy zamknąć, a gdy przeglądarka odmówi (okno nadal istnieje po tiku), pokazujemy
  // jednoznaczny ekran pożegnalny zamiast udawać, że przycisk nie zadziałał.
  buttons.appendChild(btn('Wyjdź', '', false, true, () => {
    closeMore();
    cfg.onQuit?.();
    try { window.close(); } catch { /* przeglądarka odmówiła — obsłużone niżej */ }
    window.setTimeout(() => {
      if (window.closed) return;              // udało się — nic więcej nie robimy
      showFarewellScreen();
    }, 120);
  }, '', 'menu-exit'));

  morePanelEl = shell.querySelector('#cm-more') as HTMLElement;
  morePanelEl.appendChild(btn(
    'Kontynuuj',
    hasSave ? '' : 'brak zapisów',
    false,
    hasSave,
    () => { closeMore(); cfg.onContinue?.(); },
    '',
    'menu-load',
  ));
  morePanelEl.appendChild(btn(
    'Wczytaj grę',
    hasSave ? '' : 'brak zapisów',
    false,
    hasSave,
    () => { closeMore(); cfg.onLoad?.(); },
    '',
    'menu-save',
  ));
  morePanelEl.appendChild(btn('O grze', '', false, true, () => { closeMore(); cfg.onAbout?.(); }, '', 'menu-info'));
  // „Wyjdź" NIE jest już pozycją w „Więcej" (Maciej 2026-07-26): tam zachowywał się jak „wróć",
  // bo jedyne, co realnie robił, to closeMore() — cfg.onQuit było PUSTĄ funkcją
  // (main.ts: „future - na stronie nie ma gdzie wyjść"). Teraz stoi w menu głównym, poniżej.

  if (cfg.onPerfTest) {
    morePanelEl.appendChild(btn(
      '&#9881;&nbsp; Test wydajności',
      'dev',
      false,
      true,
      () => { closeMore(); cfg.onPerfTest?.(); },
    ));
  }

  const back = shell.querySelector('#cm-back') as HTMLElement;
  back.addEventListener('click', showMenu);
  renderSettings(shell.querySelector('#cm-settgrid') as HTMLElement);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Show the main menu overlay.  Optionally (re)configure callbacks. */
export function showMainMenu(config?: MainMenuConfig): void {
  if (config) cfg = { ...cfg, ...config };
  ensureStyles();
  if (rootEl === null) {
    rootEl = document.createElement('div');
    rootEl.className = 'civ-menu';
    document.body.appendChild(rootEl);
  }
  build();
  rootEl.style.display = 'block';
}

/** Hide the main menu overlay. */
export function hideMainMenu(): void {
  if (rootEl !== null) rootEl.style.display = 'none';
}

/** True when the main menu is currently visible. */
export function isMainMenuOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}
