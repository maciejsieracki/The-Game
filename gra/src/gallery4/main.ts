/**
 * gallery4/main.ts
 * Standalone 4-view unit gallery (NOT the in-game map gallery).
 *
 * Renders every unit type from data/units.json using the REAL model builder
 * (buildUnitModel from ../render/units), one block per unit, top-to-bottom:
 *   1) unit NAME (+ model category)
 *   2) basic PARAMS (era + Atak/Uderzenie/Obrona/Health/Ruch + Rola + Koszt)
 *   3) FOUR views side by side: FRONT (+Z), LEWY (-X), PRAWY (+X), TYŁ (-Z)
 *   4) a <textarea> for the reviewer's comments
 *
 * Performance: a SINGLE WebGLRenderer drawn into one offscreen canvas; for each
 * unit we render the 4 camera angles and copy the pixels into 4 small 2D
 * canvases.  Blocks are rendered lazily via IntersectionObserver so the browser
 * never has to draw ~38x4 views at once.
 *
 * file:// safety: the page is built to a single self-contained HTML via Vite +
 * vite-plugin-singlefile.  If a WebGL context cannot be created (e.g. jsdom
 * smoke test), we show a banner and skip rendering instead of throwing.
 */

import * as THREE from 'three';
import { buildUnitModel } from '../render/units';
import { loadGameData } from '../data/loader';
import type { UnitDef } from '../data/loader';
import { categoryOf } from '../units/setup';

// ---------------------------------------------------------------------------
// Constants — match the in-game scene look (scene.ts) for consistent lighting.
// ---------------------------------------------------------------------------
const SKY = 0x87ceeb;          // sky-blue background, same as the game
const VIEW_W = 150;
const VIEW_H = 190;
const OWNER_COLOR = 0xc23b3b;   // a neutral "owner" red so owner-tinted parts read

// HEX_R in the game is 1.0; an avatar is ~0.55 tall with feet at y=0.
const MODEL_CENTER_Y = 0.27;    // vertical look-at target (mid-body)
const FIT_RADIUS = 0.42;        // half-extent we want to frame (incl. weapons/shields)

// Camera directions for the four views (unit faces +Z by convention).
const VIEWS: { key: string; label: string; dir: THREE.Vector3 }[] = [
  { key: 'front', label: 'PRZÓD',  dir: new THREE.Vector3(0, 0, 1) },
  { key: 'left',  label: 'LEWY',   dir: new THREE.Vector3(-1, 0, 0) },
  { key: 'right', label: 'PRAWY',  dir: new THREE.Vector3(1, 0, 0) },
  { key: 'back',  label: 'TYŁ',    dir: new THREE.Vector3(0, 0, -1) },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Number-or-dash formatting for stat chips. */
function statVal(v: unknown): string {
  if (v === null || v === undefined || v === '' || v === '—' || v === '-') return '—';
  return String(v);
}

/** True when a unit row is flagged as a super-unit (per units.json convention). */
function isSuperUnit(u: UnitDef): boolean {
  return u['Super-jednostka'] === 'TAK';
}

/**
 * Single shared offscreen renderer + scene + camera.
 * Returns null if WebGL is unavailable (so the page can still load).
 */
function makeRenderer(): {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
} | null {
  let renderer: THREE.WebGLRenderer;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  } catch (_e) {
    return null;
  }
  // Runtime guard: on some headless stacks the renderer constructs but has no
  // usable context, so verify .render exists before relying on it.
  if (!renderer || typeof renderer.render !== 'function') return null;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(VIEW_W, VIEW_H, false);
  renderer.setClearColor(SKY, 1);
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);

  // Lights identical to the game (scene.ts): hemisphere + warm directional sun.
  const hemi = new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
  sun.position.set(2.0, 3.4, 1.4);
  scene.add(sun);
  // A gentle fill from the front so back/side views are not too dark.
  const fill = new THREE.DirectionalLight(0xffffff, 0.35);
  fill.position.set(0, 1.2, 3);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(32, VIEW_W / VIEW_H, 0.01, 100);

  return { renderer, scene, camera };
}

/** Position the camera along `dir`, framing the model centered. */
function placeCamera(camera: THREE.PerspectiveCamera, dir: THREE.Vector3): void {
  // Distance so FIT_RADIUS fits in the vertical FOV with a small margin.
  const vFov = (camera.fov * Math.PI) / 180;
  const dist = (FIT_RADIUS / Math.sin(vFov / 2)) * 1.18;
  const d = dir.clone().normalize();
  camera.position.set(
    d.x * dist,
    MODEL_CENTER_Y + dist * 0.18, // slight downward tilt
    d.z * dist,
  );
  camera.lookAt(0, MODEL_CENTER_Y, 0);
  camera.updateProjectionMatrix();
}

/** Dispose a built unit group's tracked materials + geometries (matches scene.ts). */
function disposeUnit(group: THREE.Group): void {
  const mats = (group.userData['mats'] as THREE.Material[]) ?? [];
  for (const m of mats) m.dispose();
  const geos = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  for (const g of geos) g.dispose();
}

// ---------------------------------------------------------------------------
// State for comment export (in-memory only, no localStorage).
// ---------------------------------------------------------------------------
const comments = new Map<string, HTMLTextAreaElement>();

function collectComments(): string {
  const lines: string[] = [];
  for (const [name, ta] of comments) {
    const v = ta.value.trim();
    if (v) lines.push(`${name}: ${v}`);
  }
  return lines.join('\n');
}

function setStatus(msg: string): void {
  const s = document.getElementById('status');
  if (s) {
    s.textContent = msg;
    if (msg) window.setTimeout(() => { if (s.textContent === msg) s.textContent = ''; }, 2500);
  }
}

async function copyComments(): Promise<void> {
  const text = collectComments();
  if (!text) { setStatus('Brak uwag'); return; }
  try {
    await navigator.clipboard.writeText(text);
    setStatus('Skopiowano!');
  } catch (_e) {
    // Fallback for file:// where the async clipboard API may be blocked.
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); setStatus('Skopiowano!'); }
    catch (_e2) { setStatus('Nie udało się — pobierz .txt'); }
    document.body.removeChild(ta);
  }
}

function downloadComments(): void {
  const text = collectComments();
  const blob = new Blob([text || '(brak uwag)'], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'uwagi-jednostki.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  setStatus('Pobrano .txt');
}

// ---------------------------------------------------------------------------
// Build the page.
// ---------------------------------------------------------------------------
let _built = false;
function build(): void {
  if (_built) return; // idempotent: never render twice
  _built = true;
  const wrap = document.getElementById('wrap');
  if (!wrap) return;

  // Wire the header buttons regardless of WebGL availability.
  document.getElementById('btn-copy')?.addEventListener('click', () => { void copyComments(); });
  document.getElementById('btn-download')?.addEventListener('click', () => { downloadComments(); });

  const data = loadGameData();

  // Dedupe by name, preserve units.json order.
  const seen = new Set<string>();
  const units: UnitDef[] = [];
  for (const u of data.units) {
    const name = u.Jednostka ?? '';
    if (!name || seen.has(name)) continue;
    seen.add(name);
    units.push(u);
  }

  const gl = makeRenderer();
  if (!gl) {
    const banner = document.createElement('div');
    banner.style.cssText =
      'background:#3a3a22;border:1px solid #ffd479;color:#ffe199;border-radius:8px;' +
      'padding:12px 14px;margin-bottom:16px;font-size:13px;';
    banner.textContent =
      'WebGL nie jest dostępny w tym środowisku — modele 3D nie zostaną wyrenderowane. ' +
      'Lista jednostek, parametry i pole uwag działają normalnie.';
    wrap.appendChild(banner);
  }

  // Lazy-render queue keyed by element.
  const renderJobs = new Map<Element, () => void>();
  let observer: IntersectionObserver | null = null;
  if (gl && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          const job = renderJobs.get(e.target);
          if (job) { job(); renderJobs.delete(e.target); observer?.unobserve(e.target); }
        }
      }
    }, { rootMargin: '200px 0px' });
  }

  for (const u of units) {
    const name = u.Jednostka ?? '(bez nazwy)';
    const role = u['Rola (linia)'] ?? '';
    const category = categoryOf(name, role, isSuperUnit(u));

    const block = document.createElement('div');
    block.className = 'unit';

    // (1) name + category
    const h2 = document.createElement('h2');
    h2.textContent = name;
    const catSpan = document.createElement('span');
    catSpan.className = 'cat';
    catSpan.textContent = `   (model: ${category})`;
    h2.appendChild(catSpan);
    block.appendChild(h2);

    // (2) params
    const params = document.createElement('div');
    params.className = 'params';
    const chips: { label: string; value: string; cls?: string }[] = [
      { label: 'Epoka', value: statVal(u.Epoka), cls: 'era' },
      { label: 'Rola', value: statVal(role) },
      { label: 'Atak', value: statVal(u.Atak) },
      { label: 'Uderzenie', value: statVal(u.Uderzenie) },
      { label: 'Obrona', value: statVal(u.Obrona) },
      { label: 'Health', value: statVal(u.Health) },
      { label: 'Ruch', value: statVal(u.Ruch) },
      { label: 'Koszt', value: statVal(u['Pieniądz (koszt)']) },
    ];
    for (const c of chips) {
      const p = document.createElement('span');
      p.className = 'p' + (c.cls ? ' ' + c.cls : '');
      p.innerHTML = `${c.label}: <b>${c.value}</b>`;
      params.appendChild(p);
    }
    block.appendChild(params);

    // (3) four views
    const views = document.createElement('div');
    views.className = 'views';
    const cellCanvases: { canvas: HTMLCanvasElement; dir: THREE.Vector3 }[] = [];
    for (const v of VIEWS) {
      const cell = document.createElement('div');
      cell.className = 'view';
      const lbl = document.createElement('div');
      lbl.className = 'lbl';
      lbl.textContent = v.label;
      cell.appendChild(lbl);
      const cv = document.createElement('canvas');
      cv.width = VIEW_W;
      cv.height = VIEW_H;
      cv.style.width = VIEW_W + 'px';
      cv.style.height = VIEW_H + 'px';
      cell.appendChild(cv);
      views.appendChild(cell);
      cellCanvases.push({ canvas: cv, dir: v.dir });
    }
    block.appendChild(views);

    // (4) comment textarea
    const ta = document.createElement('textarea');
    ta.className = 'cmt';
    ta.placeholder = `Uwagi do: ${name}`;
    block.appendChild(ta);
    comments.set(name, ta);

    wrap.appendChild(block);

    // Schedule the actual 3D render for when the block scrolls into view.
    if (gl) {
      const job = () => {
        let group: THREE.Group | null = null;
        try {
          // Pass the unit NAME so per-culture / per-super distinctions render
          // (e.g. the Zulu "uThulwana" vs the Roman "Evocati" look different).
          group = buildUnitModel(category, OWNER_COLOR, name);
          gl.scene.add(group);
          for (const { canvas, dir } of cellCanvases) {
            placeCamera(gl.camera, dir);
            gl.renderer.render(gl.scene, gl.camera);
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(gl.renderer.domElement, 0, 0, canvas.width, canvas.height);
            }
          }
        } catch (err) {
          // Never let one bad unit break the whole page.
          // eslint-disable-next-line no-console
          console.warn('[gallery4] render failed for', name, err);
        } finally {
          if (group) { gl.scene.remove(group); disposeUnit(group); }
        }
      };
      if (observer) { renderJobs.set(block, job); observer.observe(block); }
      else { job(); } // no IntersectionObserver -> render eagerly
    }
  }
}

// ---------------------------------------------------------------------------
// Bootstrap on DOMContentLoaded (so file:// + inlined script order is safe).
// ---------------------------------------------------------------------------
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', build);
} else {
  build();
}
