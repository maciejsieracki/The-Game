/**
 * sceneTimingReport.ts — nieblokujący raport czasów generatora + buildScene (FALA 155/156).
 * pointer-events:none na panelu · przycisk X z auto · min. 15 s widoczności.
 */
import type { MapGenPhaseTimings } from '../map/mapGenProgress';
import { MAP_GEN_PHASE_LABELS } from '../map/mapGenProgress';
import type { SceneBuildTimings } from '../render/scene';
import { CIV_BRAND_SCOPE_VARS, ensureBrandRootTokens } from './brandTokenVars';

const STYLE_ID = 'civ-scene-timing-css';
/** Nad loading overlay (3_000_000) i HUD — widoczny bez F12. */
const PANEL_Z_INDEX = 3_000_002;
const DEFAULT_HIDE_MS = 15_000;

export interface SceneTimingReportOptions {
  mapGen?: MapGenPhaseTimings;
  scene?: SceneBuildTimings;
  typLabel?: string;
  hideAfterMs?: number;
}

function ensureStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  ensureBrandRootTokens();
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
.civ-scene-timing{
  ${CIV_BRAND_SCOPE_VARS}
  position:fixed;top:12px;right:12px;z-index:${PANEL_Z_INDEX};
  max-width:min(420px,92vw);max-height:min(88vh,640px);overflow:auto;
  padding:.85rem 2rem .85rem 1rem;
  background:rgba(8,12,18,.92);
  border:1px solid var(--border-mid,#3a4555);
  border-radius:var(--radius-lg,8px);
  box-shadow:0 8px 32px rgba(0,0,0,.55);
  font-family:var(--civ-font-ui,system-ui,sans-serif);
  font-size:.72rem;line-height:1.45;
  color:var(--text-primary,#e8e6e3);
  pointer-events:none;
  user-select:text;
}
.civ-scene-timing h3{
  margin:0 0 .45rem;font-size:.82rem;
  font-family:var(--civ-font-title,serif);
  color:var(--text-gold,#e8d88a);
}
.civ-scene-timing h4{
  margin:.55rem 0 .25rem;font-size:.74rem;
  color:var(--text-gold,#e8d88a);font-weight:600;
}
.civ-scene-timing table{width:100%;border-collapse:collapse}
.civ-scene-timing td{padding:.1rem 0}
.civ-scene-timing td:last-child{text-align:right;font-variant-numeric:tabular-nums;color:var(--text-muted,#9aa3ad)}
.civ-scene-timing .total td{font-weight:600;color:var(--text-gold,#e8d88a)}
.civ-scene-timing .meta{font-size:.68rem;color:var(--text-muted,#9aa3ad);margin-bottom:.35rem}
.civ-scene-timing .missing{color:var(--text-muted,#9aa3ad);font-style:italic;margin:.2rem 0}
.civ-scene-timing-close{
  position:absolute;top:6px;right:8px;
  width:26px;height:26px;padding:0;
  border:1px solid var(--border-mid,#3a4555);
  border-radius:var(--radius,4px);
  background:rgba(255,255,255,.06);
  color:var(--text-gold,#e8d88a);
  font-size:1rem;line-height:1;cursor:pointer;
  pointer-events:auto;
}
.civ-scene-timing-close:hover{background:rgba(255,255,255,.12)}
`;
  document.head.appendChild(style);
}

function row(label: string, ms: number, totalClass = false): string {
  const cls = totalClass ? ' class="total"' : '';
  return `<tr${cls}><td>${label}</td><td>${ms} ms</td></tr>`;
}

function emptySceneTimings(): SceneBuildTimings {
  return {
    hexes: 0,
    coast: 0,
    overlays: 0,
    rivers: 0,
    tail: 0,
    total: 0,
    hexCount: 0,
    overlayTotal: 0,
    riverStage: 0,
  };
}

function buildReportHtml(opts: SceneTimingReportOptions): string {
  const s = opts.scene ?? emptySceneTimings();
  const d = s.detail;
  const gen = opts.mapGen;
  const meta = opts.typLabel
    ? `<div class="meta">${opts.typLabel} · ${s.hexCount} heksów · nakładek ${s.overlayTotal}</div>`
    : '';

  let genBlock = '';
  if (gen) {
    const genRows = [
      row(MAP_GEN_PHASE_LABELS.prep, gen.prep),
      row(MAP_GEN_PHASE_LABELS.terrain, gen.terrain),
      row(MAP_GEN_PHASE_LABELS.landSea, gen.landSea),
      row(MAP_GEN_PHASE_LABELS.relief, gen.relief),
      row(MAP_GEN_PHASE_LABELS.coast, gen.coast),
      row(MAP_GEN_PHASE_LABELS.riversMain, gen.riversMain),
      row(MAP_GEN_PHASE_LABELS.riversFill, gen.riversFill),
      row(MAP_GEN_PHASE_LABELS.forest, gen.forest),
      row(MAP_GEN_PHASE_LABELS.deposits, gen.deposits),
      row(MAP_GEN_PHASE_LABELS.starts, gen.starts),
      row('RAZEM generator', gen.total, true),
    ].join('');
    genBlock = `<h4>GENERATOR (ms)</h4><table>${genRows}</table>`;
  } else {
    genBlock = '<h4>GENERATOR (ms)</h4><p class="missing">generator: brak danych</p>';
  }

  const sceneTop = [
    row('Heksy (razem)', s.hexes),
    row('Brzeg', s.coast),
    row('Nakładki (razem)', s.overlays),
    row('Rzeki', s.rivers),
    row('Finał', s.tail),
    row('RAZEM scena', s.total, true),
  ].join('');

  let hexDetail = '';
  let overlayDetail = '';
  if (d) {
    const h = d.heksy;
    hexDetail = [
      '<h4>Heksy — podetapy</h4><table>',
      row('Alokacja meshy', h.alokacja),
      row('Pryzmy + kolory', h.pryzmy),
      row('Instancje reliefu', h.instancjeReliefu),
      row('Styled w pętli', h.styledWPetli),
      row('Brzeg w pętli', h.brzegWPetli),
      row('Pustynia/oazy', h.pustynia),
      row('Finalizacja buforów', h.finalizacja),
      '</table>',
    ].join('');
    const n = d.nakladki;
    overlayDetail = [
      '<h4>Nakładki — podetapy</h4><table>',
      row('Scal merge', n.scalMerge),
      row('Plaże/wydmy/oazy inst.', n.instancjePlazaWydmy),
      '</table>',
    ].join('');
  }

  const grandTotal = (gen?.total ?? 0) + s.total;
  const grandRow = row('RAZEM (generator + scena)', grandTotal, true);

  return `${meta}<h3>Czasy ładowania</h3>${genBlock}<h4>SCENA (ms)</h4><table>${sceneTop}</table>${hexDetail}${overlayDetail}<table>${grandRow}</table>`;
}

/** Pokazuje raport na ekranie (nieblokujący) + loguje do konsoli. */
export function showSceneTimingReport(opts: SceneTimingReportOptions): void {
  ensureStyles();
  document.querySelectorAll('.civ-scene-timing').forEach((el) => el.remove());

  const html = buildReportHtml(opts);
  console.info('[civ] timing report\n' + html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());

  const root = document.createElement('div');
  root.className = 'civ-scene-timing';
  root.setAttribute('aria-live', 'polite');
  root.setAttribute('data-civ-timing-panel', '1');
  root.innerHTML = `<button type="button" class="civ-scene-timing-close" title="Zamknij" aria-label="Zamknij raport">×</button>${html}`;
  document.body.appendChild(root);

  const hideMs = opts.hideAfterMs ?? DEFAULT_HIDE_MS;
  let hideTimer = window.setTimeout(() => root.remove(), hideMs);

  const closeBtn = root.querySelector('.civ-scene-timing-close') as HTMLButtonElement | null;
  closeBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    window.clearTimeout(hideTimer);
    root.remove();
  });
}
