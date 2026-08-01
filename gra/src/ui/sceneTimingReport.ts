/**
 * sceneTimingReport.ts — raport czasów mapy (FALA 159: plik + localStorage + chip HUD).
 * Żółty panel opcjonalny (domyślnie wyłączony); priorytet = persistPerfReport.
 */
import type { MapGenPhaseTimings } from '../map/mapGenProgress';
import { MAP_GEN_PHASE_LABELS } from '../map/mapGenProgress';
import { getRiverGenEnabled } from '../map/riverGenSwitch';
import type { SceneBuildTimings } from '../render/scene';
import { buildPerfReportText, persistPerfReport, type PerfReportPersistOptions } from './perfReport';

const PANEL_ID = 'civ-perf-report';

const PANEL_STYLE =
  'position:fixed;top:12px;right:12px;z-index:2147483647;'
  + 'background:#111;color:#fff;padding:12px 28px 12px 12px;'
  + 'font:12px/1.4 monospace;max-height:90vh;overflow:auto;'
  + 'border:2px solid #f5c542;box-sizing:border-box;'
  + 'pointer-events:none;user-select:text;';

const CLOSE_STYLE =
  'position:absolute;top:4px;right:4px;width:22px;height:22px;padding:0;'
  + 'border:1px solid #f5c542;border-radius:3px;background:#222;color:#f5c542;'
  + 'font:14px/1 monospace;cursor:pointer;pointer-events:auto;';

export interface SceneTimingReportOptions extends PerfReportPersistOptions {
  hideAfterMs?: number;
  /** Ścieżka wywołania — diagnostyka gdy brak danych. */
  sourcePath?: string;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function row(label: string, ms: number, bold = false): string {
  const w = bold ? 'font-weight:bold;color:#f5c542;' : '';
  return `<tr><td style="padding:1px 8px 1px 0;${w}">${esc(label)}</td>`
    + `<td style="text-align:right;${w}">${ms} ms</td></tr>`;
}

function emptySceneTimings(): SceneBuildTimings {
  return {
    hexes: 0, coast: 0, overlays: 0, rivers: 0, tail: 0, total: 0,
    hexCount: 0, overlayTotal: 0, riverStage: 0,
  };
}

function buildHtml(opts: SceneTimingReportOptions): string {
  const s = opts.scene ?? emptySceneTimings();
  const gen = opts.mapGen;
  const hasData = !!gen || (s.total > 0) || !!s.detail || !!opts.error;

  if (!hasData) {
    const path = opts.sourcePath ?? 'showSceneTimingReport';
    return `<div style="color:#f5c542;font-weight:bold;margin-bottom:6px;">BRAK DANYCH TIMING</div>`
      + `<div style="color:#ccc;">ścieżka: ${esc(path)}</div>`
      + `<div style="color:#888;margin-top:4px;">Kod raportu działa — sprawdź F12 [civ-perf]</div>`;
  }

  const meta = opts.typLabel
    ? `<div style="color:#aaa;margin-bottom:6px;">${esc(opts.typLabel)} · ${s.hexCount} heks · nakł. ${s.overlayTotal}</div>`
    : '';

  let genBlock = '';
  if (gen) {
    const riverOffNote = !getRiverGenEnabled()
      ? `<div style="color:#888;font-style:italic;margin-bottom:4px;">Rzeki (gen): WYŁĄCZONE</div>`
      : '';
    const rows = [
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
    genBlock = `${riverOffNote}<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">GENERATOR (ms)</div>`
      + `<table style="width:100%;border-collapse:collapse;">${rows}</table>`;
  } else {
    genBlock = `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">GENERATOR (ms)</div>`
      + `<div style="color:#888;font-style:italic;">brak danych</div>`;
  }

  const sceneRows = [
    row('Heksy (razem)', s.hexes),
    row('Brzeg', s.coast),
    row('Nakładki (razem)', s.overlays),
    row('Rzeki', s.rivers),
    row('Finał', s.tail),
    row('RAZEM scena', s.total, true),
  ].join('');

  let detailBlock = '';
  const d = s.detail;
  if (d) {
    const h = d.heksy;
    const hRows = [
      row('Alokacja meshy', h.alokacja),
      row('Pryzmy + kolory', h.pryzmy),
      row('Instancje reliefu', h.instancjeReliefu),
      row('Styled w pętli', h.styledWPetli),
      row('Brzeg w pętli', h.brzegWPetli),
      row('Pustynia/oazy', h.pustynia),
      row('Finalizacja buforów', h.finalizacja),
    ].join('');
    const n = d.nakladki;
    const nRows = [
      row('Scal merge', n.scalMerge),
      row('Plaże/wydmy/oazy inst.', n.instancjePlazaWydmy),
    ].join('');
    detailBlock = `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">Heksy — podetapy</div>`
      + `<table style="width:100%;border-collapse:collapse;">${hRows}</table>`
      + `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">Nakładki — podetapy</div>`
      + `<table style="width:100%;border-collapse:collapse;">${nRows}</table>`;
  }

  const grand = (gen?.total ?? 0) + s.total;
  const grandRow = row('RAZEM (generator + scena)', grand, true);

  let postBlock = '';
  const handoff = opts.mapGenHandoffMs ?? 0;
  const postScene = opts.postSceneMs ?? 0;
  const wall = opts.wallClockMs ?? 0;
  if (handoff > 0 || postScene > 0 || wall > 0) {
    const postRows = [
      handoff > 0 ? row('Przekazanie z workera', handoff) : '',
      postScene > 0 ? row('Po scenie / finishLoading', postScene) : '',
      wall > 0 ? row('WALL-CLOCK → hide', wall, true) : '',
    ].filter(Boolean).join('');
    postBlock = `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">PO SCENIE / CAŁOŚĆ (ms)</div>`
      + `<table style="width:100%;border-collapse:collapse;">${postRows}</table>`;
  }

  const steps = opts.postSceneSteps;
  if (steps?.length) {
    const stepRows = steps.map((st) => row(st.label, st.ms)).join('');
    const sumSteps = steps.reduce((a, st) => a + st.ms, 0);
    postBlock += `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">POST-SCENE — podkroki</div>`
      + `<table style="width:100%;border-collapse:collapse;">${stepRows}${row('RAZEM podkroki', sumSteps, true)}</table>`;
  }

  const errBlock = opts.error
    ? `<div style="color:#ff6b6b;font-weight:bold;margin-bottom:8px;white-space:pre-wrap;word-break:break-word;">`
      + `BŁĄD buildScene:<br>${esc(opts.error)}</div>`
    : '';

  return `${errBlock}${meta}`
    + `<div style="color:#f5c542;font-weight:bold;font-size:13px;margin-bottom:4px;">Czasy ładowania</div>`
    + genBlock
    + `<div style="color:#f5c542;font-weight:bold;margin:8px 0 4px;">SCENA (ms)</div>`
    + `<table style="width:100%;border-collapse:collapse;">${sceneRows}</table>`
    + detailBlock
    + `<table style="width:100%;border-collapse:collapse;margin-top:6px;">${grandRow}</table>`
    + postBlock;
}

function mountPanel(opts: SceneTimingReportOptions, hideMs: number): void {

  document.getElementById(PANEL_ID)?.remove();
  document.querySelectorAll('.civ-scene-timing').forEach((el) => el.remove());

  const root = document.createElement('div');
  root.id = PANEL_ID;
  root.setAttribute('data-civ-timing-panel', '1');
  root.setAttribute('aria-live', 'polite');
  root.style.cssText = PANEL_STYLE;
  root.innerHTML = `<button type="button" title="Zamknij" aria-label="Zamknij" style="${CLOSE_STYLE}">×</button>`
    + buildHtml(opts);

  // html, nie body — zoom UI (transform scale na body) psuje position:fixed na body
  const mount = document.documentElement;
  mount.appendChild(root);

  let hideTimer = window.setTimeout(() => root.remove(), hideMs);
  const closeBtn = root.querySelector('button');
  closeBtn?.addEventListener('click', (ev) => {
    ev.stopPropagation();
    window.clearTimeout(hideTimer);
    root.remove();
  });
}

function panelStillVisible(): boolean {
  const el = document.getElementById(PANEL_ID);
  return !!el && el.isConnected;
}

/** Zapisuje raport (plik + localStorage + chip); opcjonalnie żółty panel gdy hideAfterMs > 0. */
export function showSceneTimingReport(opts: SceneTimingReportOptions): void {
  const summary = buildPerfReportText(opts);
  console.info('[civ-perf]', summary);
  persistPerfReport(opts);

  const hideMs = opts.hideAfterMs ?? 0;
  if (hideMs <= 0) return;

  mountPanel(opts, hideMs);
  window.setTimeout(() => {
    if (!panelStillVisible()) mountPanel(opts, hideMs);
  }, 0);
  window.setTimeout(() => {
    if (!panelStillVisible()) mountPanel(opts, hideMs);
  }, 500);
}
