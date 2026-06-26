/**
 * mainMenu.ts
 * Main menu + global settings screen (UI task 4).
 * Visual language matches Makieta-flow-nowa-gra.html (dark + gold, Palatino serif,
 * ornaments).  Fully DECOUPLED from game logic: no game/* imports, no THREE -- just
 * DOM + callbacks, so the engine wires it with one showMainMenu(cfg) call.
 *
 * Tunable values (settings catalogue, version) come from the UI parameter panel:
 *   UI-parametry.xlsx -> data/ui-params.json -> uiParams.ts (UI_PARAMS.menu).
 *
 * LANE: src/ui/* only.  Backend wiring (what "Nowa Gra"/"Kontynuuj" do, applying
 * settings) is the engine's job via the optional callbacks below.
 *
 * Source uses literal UTF-8 Polish strings (consistent with main.ts); symbols use
 * HTML entities so the file stays ASCII apart from Polish letters.
 */

import { UI_PARAMS } from './uiParams';

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
  /** Return true when a save exists -> enables Kontynuuj / Wczytaj. */
  hasSave?: () => boolean;
  onNewGame?: () => void;
  onContinue?: () => void;
  onLoad?: () => void;
  onAbout?: () => void;
  onQuit?: () => void;
  /** Called whenever a setting changes, with the current values keyed by setting key. */
  onSettingsChange?: (values: Record<string, string>) => void;
}

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
function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const css = `
.civ-menu{position:fixed;inset:0;z-index:500;overflow:auto;
  --gold:#C9A84C;--gold-light:#E8C97A;--gold-dim:#7A6030;--bg-deep:#0A0A0F;--bg-card:#1A1A26;
  --border-subtle:rgba(201,168,76,0.18);--border-mid:rgba(201,168,76,0.38);--border-strong:rgba(201,168,76,0.65);
  --text-primary:#F0E8D0;--text-secondary:#A09070;--text-muted:#554E3A;--text-gold:#C9A84C;--radius:6px;--radius-lg:10px;
  background:var(--bg-deep);color:var(--text-primary);
  font-family:'Palatino Linotype','Book Antiqua',Palatino,Georgia,serif;
  display:flex;flex-direction:column;align-items:center;justify-content:center;padding:3rem 1.5rem;}
.civ-menu *{box-sizing:border-box;}
.civ-menu .emblem{width:96px;height:96px;border:2px solid var(--border-mid);border-radius:50%;
  display:flex;align-items:center;justify-content:center;margin:0 auto 1.4rem;background:rgba(201,168,76,0.06);}
.civ-menu .glabel{font-size:10px;letter-spacing:0.5em;text-transform:uppercase;color:var(--text-secondary);margin-bottom:8px;font-family:Arial,sans-serif;text-align:center;}
.civ-menu .title{font-size:58px;letter-spacing:0.22em;color:var(--gold-light);font-weight:400;text-align:center;text-shadow:0 0 70px rgba(201,168,76,0.3);line-height:1;}
.civ-menu .orn{display:flex;align-items:center;justify-content:center;gap:14px;margin:14px 0 6px;}
.civ-menu .orn-line{height:1px;width:90px;background:linear-gradient(90deg,transparent,var(--gold-dim));}
.civ-menu .orn-line.r{background:linear-gradient(270deg,transparent,var(--gold-dim));}
.civ-menu .orn-d{width:7px;height:7px;background:var(--gold-dim);transform:rotate(45deg);}
.civ-menu .sub{font-size:11px;letter-spacing:0.34em;text-transform:uppercase;color:var(--text-secondary);text-align:center;font-family:Arial,sans-serif;margin-bottom:2.4rem;}
.civ-menu .menu{display:flex;flex-direction:column;gap:12px;width:100%;max-width:360px;}
.civ-menu .mbtn{background:transparent;border:1.5px solid var(--gold-dim);color:var(--text-gold);font-family:Arial,sans-serif;
  font-size:13px;letter-spacing:0.22em;text-transform:uppercase;padding:14px 22px;cursor:pointer;border-radius:var(--radius);transition:all .18s;text-align:center;}
.civ-menu .mbtn:hover:not(:disabled){border-color:var(--gold);background:rgba(201,168,76,0.1);color:var(--gold-light);box-shadow:0 0 22px rgba(201,168,76,0.12);}
.civ-menu .mbtn.primary{background:linear-gradient(135deg,rgba(201,168,76,0.22),rgba(201,168,76,0.08));border-color:var(--gold);color:var(--gold-light);font-size:15px;padding:16px 22px;}
.civ-menu .mbtn:disabled{opacity:.32;cursor:not-allowed;}
.civ-menu .mbtn .hint{display:block;font-size:9px;letter-spacing:.12em;color:var(--text-muted);margin-top:3px;text-transform:none;}
.civ-menu .footer{margin-top:2.6rem;font-family:Arial,sans-serif;font-size:10px;letter-spacing:.2em;color:var(--text-muted);text-align:center;}
.civ-menu .screen{display:none;width:100%;max-width:760px;}
.civ-menu .screen.active{display:block;}
.civ-menu .menu-screen{display:none;flex-direction:column;align-items:center;}
.civ-menu .menu-screen.active{display:flex;}
.civ-menu .sh{text-align:center;margin-bottom:1.8rem;}
.civ-menu .sh h2{font-size:28px;font-weight:400;letter-spacing:0.1em;color:var(--gold-light);}
.civ-menu .sett-grid{display:grid;grid-template-columns:1fr 1fr;gap:1.1rem;}
.civ-menu .srow{background:var(--bg-card);border:1px solid var(--border-subtle);border-radius:var(--radius-lg);padding:16px 18px;display:flex;flex-direction:column;gap:10px;}
.civ-menu .slbl{font-size:10px;letter-spacing:.35em;text-transform:uppercase;color:var(--text-secondary);font-family:Arial,sans-serif;}
.civ-menu .sctl{display:flex;align-items:center;gap:10px;}
.civ-menu .arrbtn{width:30px;height:30px;border:1px solid var(--border-mid);background:transparent;color:var(--text-gold);cursor:pointer;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:16px;font-family:Arial,sans-serif;transition:all .15s;flex-shrink:0;}
.civ-menu .arrbtn:hover{border-color:var(--gold);background:rgba(201,168,76,0.1);}
.civ-menu .sval{flex:1;text-align:center;font-size:15px;color:var(--text-primary);letter-spacing:.04em;}
.civ-menu .vdesc{font-size:10px;color:var(--text-muted);font-family:Arial,sans-serif;display:block;margin-top:2px;font-style:italic;}
.civ-menu .back-row{display:flex;justify-content:center;margin-top:1.8rem;}
.civ-menu .btn-back{background:transparent;border:1px solid var(--border-mid);color:var(--text-secondary);font-family:Arial,sans-serif;font-size:12px;letter-spacing:.2em;text-transform:uppercase;padding:10px 34px;cursor:pointer;border-radius:var(--radius);transition:all .15s;}
.civ-menu .btn-back:hover{border-color:var(--border-strong);color:var(--text-primary);}
`;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = css;
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------------

const EMBLEM_SVG =
  '<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<polygon points="32,4 40,24 60,24 44,38 50,58 32,46 14,58 20,38 4,24 24,24" stroke="#7A6030" stroke-width="1.5" fill="none"/>' +
  '<circle cx="32" cy="32" r="8" stroke="#7A6030" stroke-width="1.5"/>' +
  '<line x1="32" y1="24" x2="32" y2="40" stroke="#7A6030" stroke-width="1"/>' +
  '<line x1="24" y1="32" x2="40" y2="32" stroke="#7A6030" stroke-width="1"/></svg>';

function btn(label: string, hint: string, primary: boolean, enabled: boolean, on: () => void): HTMLButtonElement {
  const b = document.createElement('button');
  b.className = 'mbtn' + (primary ? ' primary' : '');
  b.innerHTML = label + (hint ? '<span class="hint">' + hint + '</span>' : '');
  b.disabled = !enabled;
  if (enabled) b.addEventListener('click', on);
  return b;
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------

let rootEl: HTMLDivElement | null = null;

function renderSettings(grid: HTMLElement): void {
  grid.innerHTML = '';
  SETTINGS.forEach((s, i) => {
    const row = document.createElement('div');
    row.className = 'srow';
    const val = () => (s.opts[s.idx] ?? '') + '<span class="vdesc">' + (s.descs[s.idx] ?? '') + '</span>';
    row.innerHTML = '<div class="slbl">' + s.label + '</div><div class="sctl"></div>';
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
  const hasSave = cfg.hasSave?.() ?? false;
  rootEl.innerHTML =
    '<div class="menu-screen active" id="cm-menu">' +
      '<div class="emblem">' + EMBLEM_SVG + '</div>' +
      '<div class="glabel">Gra Cywilizacyjna 4X</div>' +
      '<div class="title">THE GAME</div>' +
      '<div class="orn"><div class="orn-line"></div><div class="orn-d"></div><div class="orn-line r"></div></div>' +
      '<div class="sub">Wersja ' + ver + '</div>' +
      '<div class="menu" id="cm-buttons"></div>' +
      '<div class="footer">THE GAME · prototyp v0.1</div>' +
    '</div>' +
    '<div class="screen" id="cm-settings">' +
      '<div class="sh"><h2>Ustawienia</h2></div>' +
      '<div class="sett-grid" id="cm-settgrid"></div>' +
      '<div class="back-row"><button class="btn-back" id="cm-back">&#8592; Wstecz do menu</button></div>' +
    '</div>';

  const menuScreen = rootEl.querySelector('#cm-menu') as HTMLElement;
  const setScreen = rootEl.querySelector('#cm-settings') as HTMLElement;
  const showSettings = () => { menuScreen.classList.remove('active'); setScreen.classList.add('active'); };
  const showMenu = () => { setScreen.classList.remove('active'); menuScreen.classList.add('active'); };

  const buttons = rootEl.querySelector('#cm-buttons') as HTMLElement;
  buttons.appendChild(btn('&#9670;&nbsp; Nowa Gra', '', true, true, () => cfg.onNewGame?.()));
  buttons.appendChild(btn('Kontynuuj', hasSave ? '' : 'brak zapisów', false, hasSave, () => cfg.onContinue?.()));
  buttons.appendChild(btn('Wczytaj Grę', hasSave ? '' : 'brak zapisów', false, hasSave, () => cfg.onLoad?.()));
  buttons.appendChild(btn('Ustawienia', '', false, true, showSettings));
  buttons.appendChild(btn('O Grze', '', false, true, () => cfg.onAbout?.()));
  buttons.appendChild(btn('Wyjdź', '', false, true, () => cfg.onQuit?.()));

  const back = rootEl.querySelector('#cm-back') as HTMLElement;
  back.addEventListener('click', showMenu);
  renderSettings(rootEl.querySelector('#cm-settgrid') as HTMLElement);
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
  rootEl.style.display = 'flex';
}

/** Hide the main menu overlay. */
export function hideMainMenu(): void {
  if (rootEl !== null) rootEl.style.display = 'none';
}

/** True when the main menu is currently visible. */
export function isMainMenuOpen(): boolean {
  return rootEl !== null && rootEl.style.display !== 'none';
}
