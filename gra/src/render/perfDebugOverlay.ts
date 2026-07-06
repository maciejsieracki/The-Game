/**
 * perfDebugOverlay.ts — overlay diagnostyczny F9 (BATCH 3 / A4).
 * FPS, draw calls, trójkąty, instancje terenu, poziom zoom LOD.
 */

export interface PerfDebugSnapshot {
  fps: number;
  drawCalls: number;
  triangles: number;
  meshCount: number;
  instancedCount: number;
  zoomLod: number;
  cameraDist: number;
  /** Czas ostatniego pełnego przebiegu setFog w ms (A4/A5 — pomiar dirty-set). Undefined = brak danych. */
  fogMs?: number;
}

let root: HTMLDivElement | null = null;
let visible = false;

function ensureRoot(): HTMLDivElement {
  if (root) return root;
  root = document.createElement('div');
  root.id = 'civ-perf-debug-overlay';
  root.style.cssText = [
    'position:fixed',
    'top:8px',
    'left:8px',
    'z-index:100700',
    'padding:10px 12px',
    'background:rgba(0,0,0,.78)',
    'color:#b8f0c8',
    'font:12px/1.45 ui-monospace,Consolas,monospace',
    'border:1px solid rgba(120,200,140,.35)',
    'border-radius:6px',
    'pointer-events:none',
    'white-space:pre',
    'display:none',
  ].join(';');
  document.body.appendChild(root);
  return root;
}

export function isPerfDebugOverlayVisible(): boolean {
  return visible;
}

export function togglePerfDebugOverlay(): boolean {
  visible = !visible;
  const el = ensureRoot();
  el.style.display = visible ? 'block' : 'none';
  return visible;
}

export function setPerfDebugOverlayVisible(on: boolean): void {
  visible = on;
  ensureRoot().style.display = on ? 'block' : 'none';
}

export function updatePerfDebugOverlay(snap: PerfDebugSnapshot): void {
  if (!visible) return;
  const el = ensureRoot();
  const fogLine = snap.fogMs === undefined
    ? ''
    : `\nfog ${snap.fogMs.toFixed(1)} ms`;
  el.textContent =
    `F9 perf · LOD ${snap.zoomLod}\n`
    + `FPS ${snap.fps.toFixed(0)}\n`
    + `draw ${snap.drawCalls} · tri ${snap.triangles}\n`
    + `mesh ${snap.meshCount} · inst ${snap.instancedCount}\n`
    + `cam dist ${snap.cameraDist.toFixed(0)}`
    + fogLine;
}

/** Marker grep w bundlu (verify-publish). */
export const CIV_PERF_DEBUG_MARKER = 'civ-perf-debug-overlay';
