/**
 * mapLoadingOverlay.ts — panel postępu generacji mapy (DYSPOZYCJA-WYDAJNOSC C2 + C2b).
 */
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';
import { MAP_GEN_PHASE_TOTAL } from '../map/mapGenProgress';

const MAP_LOADING_PHASE_TOTAL = MAP_GEN_PHASE_TOTAL;

export interface MapLoadingOverlayHandle {
  setProgress: (faza: string, pct: number, phaseNum?: number, phaseTotal?: number) => void;
  showError: (message: string, onRetry: () => void) => void;
  hide: () => void;
}

/** create = nowa gra / playtest; load = wczytywanie sejwu (mapa odtwarzana ze ziarna). */
export type MapLoadingOverlayMode = 'create' | 'load';

export interface MapLoadingOverlayOptions {
  seed: number;
  rozmiarLabel: string;
  typLabel: string;
  /** np. „Super Huge (672×476 · ~319 872 heksów)" */
  mapSizeMetric?: string;
  /** Domyślnie create — przy load inny tytuł i opis (nie „Tworzenie świata”). */
  mode?: MapLoadingOverlayMode;
  /** Etykieta sejwu — tylko tryb load. */
  saveLabel?: string;
}

const STYLE_ID = 'civ-map-loading-css';

function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  ensureBrandRootTokens();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.civ-map-load-overlay{
  ${CIV_BRAND_SCOPE_VARS}
  position:fixed;inset:0;z-index:100600;
  background:rgba(8,12,18,.88);
  display:flex;align-items:center;justify-content:center;
  font-family:var(--civ-font-ui,system-ui,sans-serif);
  color:var(--text-primary);
}
.civ-map-load-panel{
  min-width:min(420px,92vw);
  padding:1.75rem 2rem;
  background:var(--bg-card);
  border:1px solid var(--border-mid);
  border-radius:var(--radius-lg);
  box-shadow:0 12px 48px rgba(0,0,0,.45);
  text-align:center;
}
.civ-map-load-title{
  font-family:var(--civ-font-title,serif);
  font-size:1.35rem;
  color:var(--text-gold);
  margin:0 0 .35rem;
}
.civ-map-load-meta{
  font-size:.85rem;
  color:var(--text-muted);
  margin:0 0 .75rem;
}
.civ-map-load-hint{
  font-size:.78rem;
  color:var(--text-muted);
  line-height:1.45;
  margin:0 0 .65rem;
  opacity:.92;
}
.civ-map-load-phase{
  font-size:.95rem;
  margin:0 0 .35rem;
  min-height:1.4em;
}
.civ-map-load-elapsed{
  font-size:.8rem;
  color:var(--text-muted);
  margin:0 0 .75rem;
  font-variant-numeric:tabular-nums;
}
.civ-map-load-bar-wrap{
  height:8px;
  background:rgba(255,255,255,.08);
  border-radius:4px;
  overflow:hidden;
  margin-bottom:1rem;
}
.civ-map-load-bar{
  height:100%;
  width:0%;
  background:linear-gradient(90deg,var(--gold-dim),var(--gold));
  border-radius:4px;
  transition:width .25s ease-out;
}
.civ-map-load-spinner{
  width:28px;height:28px;margin:0 auto;
  border:3px solid rgba(232,216,138,.25);
  border-top-color:var(--gold);
  border-radius:50%;
  animation:civ-map-load-spin .85s linear infinite;
}
@keyframes civ-map-load-spin{to{transform:rotate(360deg)}}
.civ-map-load-overlay--load{
  background:rgba(4,6,10,.97);
}
.civ-map-load-retry{
  margin-top:.5rem;padding:.45rem 1.1rem;
  background:transparent;border:1px solid var(--border-mid);
  color:var(--text-gold);border-radius:var(--radius);
  cursor:pointer;font:inherit;
}
.civ-map-load-retry:hover{background:var(--bg-sel);}
`;
  document.head.appendChild(style);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function overlayCopy(opts: MapLoadingOverlayOptions): { title: string; meta: string; hint: string; phaseStart: string } {
  const sizePart = opts.mapSizeMetric ?? opts.rozmiarLabel;
  if (opts.mode === 'load') {
    // Tylko etykieta zapisu dla gracza — bez ziarna i bez technicznego opisu regeneracji mapy.
    const meta = opts.saveLabel?.trim()
      ? `«${escapeHtml(opts.saveLabel.trim())}»`
      : `${escapeHtml(sizePart)} · ${escapeHtml(opts.typLabel)}`;
    return {
      title: 'Wczytywanie zapisu',
      meta,
      hint: '',
      phaseStart: 'Wczytywanie…',
    };
  }
  return {
    title: 'Tworzenie świata',
    meta: `${escapeHtml(sizePart)} · ${escapeHtml(opts.typLabel)}`,
    hint: '',
    phaseStart: 'Przygotowanie…',
  };
}

export function showMapLoadingOverlay(opts: MapLoadingOverlayOptions): MapLoadingOverlayHandle {
  ensureStyles();
  const copy = overlayCopy(opts);
  const root = document.createElement('div');
  root.className = opts.mode === 'load'
    ? 'civ-map-load-overlay civ-map-load-overlay--load'
    : 'civ-map-load-overlay';
  root.setAttribute('aria-live', 'polite');
  const hintHtml = copy.hint
    ? `<p class="civ-map-load-hint">${copy.hint}</p>`
    : '';
  root.innerHTML = `
    <div class="civ-map-load-panel">
      <h2 class="civ-map-load-title">${copy.title}</h2>
      <p class="civ-map-load-meta">${copy.meta}</p>
      ${hintHtml}
      <p class="civ-map-load-phase" id="civ-map-load-phase">${copy.phaseStart}</p>
      <p class="civ-map-load-elapsed" id="civ-map-load-elapsed">Upłynęło: 0:00</p>
      <div class="civ-map-load-bar-wrap"><div class="civ-map-load-bar" id="civ-map-load-bar"></div></div>
      <div class="civ-map-load-spinner" id="civ-map-load-spin"></div>
      <div id="civ-map-load-err-wrap"></div>
    </div>`;
  document.body.appendChild(root);

  const phaseEl = root.querySelector('#civ-map-load-phase') as HTMLParagraphElement;
  const elapsedEl = root.querySelector('#civ-map-load-elapsed') as HTMLParagraphElement;
  const barEl = root.querySelector('#civ-map-load-bar') as HTMLDivElement;
  const spinEl = root.querySelector('#civ-map-load-spin') as HTMLDivElement;
  const errWrap = root.querySelector('#civ-map-load-err-wrap') as HTMLDivElement;

  const startedAt = Date.now();
  const tickElapsed = () => {
    elapsedEl.textContent = `Upłynęło: ${formatElapsed(Date.now() - startedAt)}`;
  };
  tickElapsed();
  const elapsedTimer = window.setInterval(tickElapsed, 1000);

  return {
    setProgress(faza: string, pct: number, phaseNum?: number, phaseTotal?: number) {
      const total = phaseTotal ?? MAP_LOADING_PHASE_TOTAL;
      const prefix = phaseNum && phaseNum > 0 ? `${phaseNum}/${total} · ` : '';
      phaseEl.textContent = prefix + faza;
      barEl.style.width = `${Math.min(100, Math.max(0, pct))}%`;
    },
    showError(message: string, onRetry: () => void) {
      spinEl.style.display = 'none';
      errWrap.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'civ-map-load-err';
      p.textContent = message;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'civ-map-load-retry';
      btn.textContent = 'Spróbuj ponownie';
      btn.addEventListener('click', () => {
        errWrap.innerHTML = '';
        spinEl.style.display = '';
        onRetry();
      });
      errWrap.append(p, btn);
    },
    hide() {
      window.clearInterval(elapsedTimer);
      root.remove();
    },
  };
}
