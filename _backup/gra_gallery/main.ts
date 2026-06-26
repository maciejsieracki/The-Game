/**
 * main.ts
 * Punkt wejscia The Game -- M1 Step 1: 3D hex map renderer.
 *
 * Pipeline:
 *   loadGameData() -> generateMap(seed) -> buildScene() -> CameraController -> render loop
 */

// Global Error Overlay
// Catches any JS error or unhandled promise and shows it as a red overlay
// so a black screen never silently hides what went wrong.

function showErr(msg: string): void {
  let el = document.getElementById('__err_overlay__') as HTMLDivElement | null;
  if (!el) {
    el = document.createElement('div');
    el.id = '__err_overlay__';
    el.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%',
      'background:rgba(180,0,0,0.92)', 'color:#fff',
      'font:bold 13px/1.5 monospace', 'padding:16px 20px',
      'z-index:99999', 'white-space:pre-wrap', 'word-break:break-all',
      'max-height:50vh', 'overflow-y:auto',
      'border-bottom:3px solid #ff4444',
    ].join(';');
    el.innerHTML = '<b>THE GAME \u2014 ERROR</b>\n';
    document.body.appendChild(el);
  }
  el.innerHTML += '\n' + msg;
  console.error('[TheGame]', msg);
}

window.addEventListener('error', (e) => {
  showErr(e.message + ' @' + e.filename + ':' + e.lineno + ':' + e.colno);
});
window.addEventListener('unhandledrejection', (e) => {
  showErr('Unhandled promise rejection: ' + String(e.reason));
});

// Imports

import * as THREE from 'three';
import { loadGameData } from './data/loader';
import { generateMap, DEFAULT_WIDTH, DEFAULT_HEIGHT } from './map/generator';
import { buildScene } from './render/scene';
import { CameraController } from './render/camera';
import { HEX_R, axialToWorld } from './render/hexutil';
import { placeStartingUnits, computeReachable, computePath, listUnitTypes } from './units/setup';
import type { RuntimeUnit } from './units/setup';
import { UnitRenderer } from './render/units';
// Import keyOf from picker only (avoids duplicate identifier with setup.ts keyOf)
import { pixelToHex, unitAt, keyOf } from './input/picker';

// Bootstrap
// Wrapped in boot() so we can defer execution until DOMContentLoaded.
// Classic (non-module) scripts in <head> run before <body> is parsed --
// without this guard, document.body is null and appendChild throws.

function boot(): void {
  try {
    const data = loadGameData();
    console.group('[The Game] Dane wczytane');
    console.log(`Jednostki: ${data.units.length}, Technologie: ${data.tech.length}`);
    console.groupEnd();

    const SEED = 12345;

    document.body.style.margin   = '0';
    document.body.style.padding  = '0';
    document.body.style.overflow = 'hidden';
    document.body.style.background = '#000';

    // Canvas 3D -- full-window, sized by JS (not CSS vw/vh) so renderer.setSize works
    const canvas = document.createElement('canvas');
    canvas.style.display  = 'block';
    canvas.style.position = 'fixed';
    canvas.style.top      = '0';
    canvas.style.left     = '0';
    canvas.style.width    = '100%';
    canvas.style.height   = '100%';
    document.body.appendChild(canvas);

    // HUD
    const hud = document.createElement('div');
    hud.id = 'hud';
    hud.style.cssText = [
      'position:fixed', 'top:12px', 'left:12px',
      'background:rgba(0,0,0,0.55)', 'color:#e8d88a',
      'font:600 13px/1.6 monospace', 'padding:6px 12px',
      'border-radius:6px', 'border:1px solid rgba(232,216,138,0.25)',
      'pointer-events:none', 'z-index:100',
    ].join(';');

    const map = generateMap(DEFAULT_WIDTH, DEFAULT_HEIGHT, SEED);
    document.body.appendChild(hud);

    // Instrukcja sterowania (bottom hint)
    const hint = document.createElement('div');
    hint.style.cssText = [
      'position:fixed', 'bottom:12px', 'left:12px',
      'background:rgba(0,0,0,0.45)', 'color:#aaa',
      'font:11px/1.5 monospace', 'padding:5px 10px',
      'border-radius:4px', 'pointer-events:none', 'z-index:100',
    ].join(';');
    document.body.appendChild(hint);

    const { scene, camera, renderer, center } = buildScene(map, canvas);

    const camCtrl = new CameraController(camera, canvas, center, {
      minDist: 8,
      maxDist: 160,
      keyPanSpeed: 0.3,
    });

    // -----------------------------------------------------------------------
    // Units
    // -----------------------------------------------------------------------

    const units: RuntimeUnit[] = placeStartingUnits(map, data);
    const unitRenderer = new UnitRenderer(scene, map);
    unitRenderer.sync(units);

    // Game state
    let selectedId: string | null = null;
    let reachable = new Set<string>();
    let turn = 1;

    /** Set of occupied hex keys for all units except the given id. */
    function occupiedExcept(id: string): Set<string> {
      const occ = new Set<string>();
      for (const u of units) {
        if (u.id !== id) occ.add(keyOf(u.q, u.r));
      }
      return occ;
    }

    /** Update HUD and hint text. */
    function updateHud(): void {
      // \xb7 = middle dot, \xd7 = multiplication sign x
      let hudText = 'Tura ' + turn + ' \xb7 seed: ' + SEED + ' \xb7 mapa: ' + map.szerokoscQ + '\xd7' + map.wysokoscR;
      if (selectedId !== null) {
        const sel = units.find(u => u.id === selectedId);
        if (sel) {
          hudText += '<br>Jednostka: ' + sel.typeId +
            ' | W\u0142a\u015bciciel: ' + (sel.ownerId === 0 ? 'Gracz' : 'AI ' + sel.ownerId) +
            ' | Ruch: ' + sel.ruchLeft + '/' + sel.ruch;
        }
      }
      hud.innerHTML = hudText;

      // Bottom hint with Polish characters as JS \uXXXX escapes.
      hint.innerHTML =
        'Pan: przeci\u0105ganie / WASD \xb7 Zoom: k\u00f3\u0142ko myszy' +
        ' \xb7 Klik jednostk\u0119 = zaznacz' +
        ' \xb7 Klik pole = ruch' +
        ' \xb7 N = koniec tury' +
        ' \xb7 G = galeria jednostek';
    }

    // Initial HUD
    updateHud();

    // -----------------------------------------------------------------------
    // Animation state
    //
    // TOKEN_LIFT mirrors the constant in units.ts (0.01 * HEX_R).
    // sync() positions a token at:  topYAt(q,r) + TOKEN_LIFT
    // topYAt() = terrainTopY(hex) = height + yOffset  (no lift included).
    // We use the same formula for every waypoint so the token rests flush
    // on the terrain surface at the start, each intermediate hex, and the
    // final destination -- matching the snap position sync() would produce.
    // -----------------------------------------------------------------------

    /** Matches TOKEN_LIFT in units.ts exactly: 0.01 * HEX_R. */
    const TOKEN_LIFT = 0.01 * HEX_R;

    /** Duration of each per-hex glide segment in seconds. */
    const ANIM_SEG_DUR = 0.14;

    interface Waypoint { x: number; y: number; z: number; }

    interface AnimState {
      id: string;         // id of the unit being animated
      destQ: number;      // logical destination (written to unit on completion)
      destR: number;
      pathLen: number;    // number of path steps (for ruchLeft deduction)
      points: Waypoint[]; // world-space positions: [start, step1, ..., dest]
      seg: number;        // active segment index; lerps points[seg]->points[seg+1]
      t: number;          // interpolation param in [0,1) for the active segment
    }

    let anim: AnimState | null = null;
    let isAnimating = false;

    // Hover route preview state: key of the hex currently under the cursor,
    // or null when no preview is active.
    let hoverKey: string | null = null;

    // Delta-time source: track the previous frame timestamp in seconds.
    let prevTime = performance.now() / 1000;

    // -----------------------------------------------------------------------
    // Click vs Drag detection
    // -----------------------------------------------------------------------

    let mouseDownX = 0;
    let mouseDownY = 0;
    const DRAG_THRESHOLD = 6; // pixels

    canvas.addEventListener('mousedown', (e: MouseEvent) => {
      mouseDownX = e.clientX;
      mouseDownY = e.clientY;
    });

    // -----------------------------------------------------------------------
    // Hover route preview
    // Shows a path preview arrow when the cursor enters a reachable hex.
    // Recompute is skipped when the cursor stays within the same hex
    // (hoverKey guard) -- one path computation per hex transition only.
    // -----------------------------------------------------------------------

    canvas.addEventListener('mousemove', (e: MouseEvent) => {
      // Gallery mode: no route preview.
      if (galleryOn) return;

      // While animating or nothing selected: clear any active preview.
      if (isAnimating || !selectedId) {
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      const hit = pixelToHex(e.clientX, e.clientY, canvas, camera, HEX_R);
      if (!hit) {
        if (hoverKey !== null) { hoverKey = null; unitRenderer.clearPathRoute(); }
        return;
      }

      const k = keyOf(hit.q, hit.r);
      // Same hex as last processed frame -- skip expensive recompute.
      if (k === hoverKey) return;
      hoverKey = k;

      // Hovering a non-reachable hex: clear route and stop.
      if (!reachable.has(k)) { unitRenderer.clearPathRoute(); return; }

      const u = units.find(x => x.id === selectedId);
      if (!u) { unitRenderer.clearPathRoute(); return; }

      const path = computePath(u, map, hit.q, hit.r, occupiedExcept(u.id));
      if (path.length > 0) {
        unitRenderer.setPathRoute([{ q: u.q, r: u.r }, ...path]);
      } else {
        unitRenderer.clearPathRoute();
      }
    });

    canvas.addEventListener('mouseup', (e: MouseEvent) => {
      const dx = e.clientX - mouseDownX;
      const dy = e.clientY - mouseDownY;
      const moveDist = Math.sqrt(dx * dx + dy * dy);
      if (moveDist >= DRAG_THRESHOLD) return; // was a drag -- skip click logic

      // Gallery mode: disable all unit interaction.
      if (galleryOn) return;

      // Lock all unit interaction while animation is running.
      // Camera pan/zoom/WASD is NOT blocked (handled by CameraController
      // which listens on its own events independent of this handler).
      if (isAnimating) return;

      // Treat as a click at (e.clientX, e.clientY)
      const hit = pixelToHex(e.clientX, e.clientY, canvas, camera, HEX_R);
      if (!hit) return;

      const cu = unitAt(hit.q, hit.r, units);

      if (cu && cu.ownerId === 0) {
        // Select player unit
        // Clear any stale hover route from the previous selection.
        unitRenderer.clearPathRoute();
        hoverKey = null;
        selectedId = cu.id;
        reachable = (cu.ruchLeft > 0)
          ? computeReachable(cu, map, occupiedExcept(cu.id))
          : new Set<string>();
        unitRenderer.setHighlight(reachable);
        updateHud();
      } else if (selectedId !== null && reachable.has(keyOf(hit.q, hit.r))) {
        // Start animated move for the selected unit.
        const u = units.find(x => x.id === selectedId);
        if (u) {
          const occ = occupiedExcept(u.id);
          const path = computePath(u, map, hit.q, hit.r, occ);
          if (path.length === 0) return; // dest == start or unreachable

          // Build world-space waypoints: current hex, then each path step.
          const startPos = axialToWorld(u.q, u.r, HEX_R);
          const startWP: Waypoint = {
            x: startPos.x,
            y: unitRenderer.topYAt(u.q, u.r) + TOKEN_LIFT,
            z: startPos.z,
          };
          const stepWPs: Waypoint[] = path.map((hex) => {
            const wp = axialToWorld(hex.q, hex.r, HEX_R);
            return {
              x: wp.x,
              y: unitRenderer.topYAt(hex.q, hex.r) + TOKEN_LIFT,
              z: wp.z,
            };
          });

          anim = {
            id: u.id,
            destQ: hit.q,
            destR: hit.r,
            pathLen: path.length,
            points: [startWP, ...stepWPs],
            seg: 0,
            t: 0,
          };
          isAnimating = true;

          // Clear hover route preview when the move begins.
          unitRenderer.clearPathRoute();
          hoverKey = null;

          // Clear highlights for the duration of the animation.
          unitRenderer.clearHighlight();
          reachable = new Set<string>();
        }
      } else {
        // Deselect
        selectedId = null;
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
        unitRenderer.clearPathRoute();
        hoverKey = null;
        updateHud();
      }
    });

    // -----------------------------------------------------------------------
    // Unit Gallery
    // Toggle with 'G' key: displays one token per unit type in a flat grid,
    // with a floating HTML label above each token.
    // Camera pan/zoom/WASD continue to work in gallery mode.
    // Click-to-select/move is disabled while gallery is open.
    // -----------------------------------------------------------------------

    /** Whether the unit gallery overlay is active. */
    let galleryOn = false;

    /** RuntimeUnit instances used only in gallery mode (never added to `units`). */
    let galleryUnits: RuntimeUnit[] = [];

    /** World-space positions for each gallery token (for label projection). */
    interface GalleryPos { x: number; y: number; z: number; }
    let galleryPositions: GalleryPos[] = [];

    /** HTML label <div> elements floating above each gallery token. */
    let galleryLabels: HTMLDivElement[] = [];

    /** Title overlay shown at top-center while gallery is open. */
    let galleryTitle: HTMLDivElement | null = null;

    /**
     * Y lift above GALLERY_TOKEN_Y for the floating name label.
     * Approximates token height (0.45*HEX_R) plus a small gap.
     */
    const GALLERY_LABEL_LIFT = 0.8 * HEX_R;

    /** Flat Y level for all gallery tokens (Rownina surface ~0.53). */
    const GALLERY_TOKEN_Y = 0.45 + TOKEN_LIFT;

    /** Grid spacing between adjacent tokens (world units). */
    const GALLERY_SPACING = 1.6 * HEX_R;

    /** Enter gallery mode: build tokens, labels, title overlay. */
    function enterGallery(): void {
      // Clear any selection / route / highlight from play mode.
      unitRenderer.clearHighlight();
      unitRenderer.clearPathRoute();
      selectedId = null;
      reachable = new Set<string>();
      hoverKey = null;

      // Build gallery RuntimeUnit list -- one per unit type.
      const types = listUnitTypes(data);
      const n = types.length;

      // Grid layout: ceil(sqrt(n)) columns, centered on map center.
      const cols = Math.ceil(Math.sqrt(n));
      const rows = Math.ceil(n / cols);

      galleryUnits = types.map((t, i): RuntimeUnit => ({
        id: 'gal' + i,
        ownerId: 0,
        typeId: t.typeId,
        q: 0,
        r: 0,
        ruch: 2,
        ruchLeft: 2,
        category: t.category,
      }));

      // Compute world-space grid positions centered on `center`.
      // Each row is independently centered along X (last row may have fewer items).
      galleryPositions = types.map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const rowStart = row * cols;
        const rowCount = Math.min(cols, n - rowStart);
        const rowW = (rowCount - 1) * GALLERY_SPACING;
        const gridH = (rows - 1) * GALLERY_SPACING;
        const gx = center.x - rowW / 2 + col * GALLERY_SPACING;
        const gz = center.z - gridH / 2 + row * GALLERY_SPACING;
        return { x: gx, y: GALLERY_TOKEN_Y, z: gz };
      });

      // Sync the unit renderer with gallery units (replaces real tokens).
      unitRenderer.sync(galleryUnits);

      // Position each gallery token at its grid slot.
      for (let i = 0; i < galleryUnits.length; i++) {
        const p = galleryPositions[i]!;
        unitRenderer.setTokenWorldPosition('gal' + i, p.x, p.y, p.z);
      }

      // Create floating HTML labels -- one per unit type.
      galleryLabels = types.map((t, i) => {
        const div = document.createElement('div') as HTMLDivElement;
        div.style.cssText = [
          'position:fixed',
          'background:rgba(0,0,0,0.72)',
          'color:#f0e6b0',
          'font:bold 10px/1.3 monospace',
          'padding:2px 5px',
          'border-radius:3px',
          'pointer-events:none',
          'z-index:200',
          'white-space:nowrap',
          // Center div horizontally on the projected point; put above it.
          'transform:translate(-50%,-100%)',
          'display:none',
        ].join(';');
        // textContent: safe -- no HTML injection.
        div.textContent = '[' + (i + 1) + '] ' + t.name;
        document.body.appendChild(div);
        return div;
      });

      // Title: GALERIA JEDNOSTEK (Polish via JS \uXXXX)
      galleryTitle = document.createElement('div') as HTMLDivElement;
      galleryTitle.style.cssText = [
        'position:fixed',
        'top:12px',
        'left:50%',
        'transform:translateX(-50%)',
        'background:rgba(0,0,0,0.75)',
        'color:#e8d88a',
        'font:bold 14px/1.5 monospace',
        'padding:6px 16px',
        'border-radius:6px',
        'border:1px solid rgba(232,216,138,0.4)',
        'pointer-events:none',
        'z-index:200',
        'white-space:nowrap',
      ].join(';');
      galleryTitle.textContent = 'GALERIA JEDNOSTEK \u2014 \'G\' aby wyj\u015b\u0107';
      document.body.appendChild(galleryTitle);
    }

    /** Exit gallery mode: remove labels/title, restore real unit tokens. */
    function exitGallery(): void {
      // Remove all label divs.
      for (const lbl of galleryLabels) {
        lbl.remove();
      }
      galleryLabels = [];

      // Remove title overlay.
      if (galleryTitle !== null) {
        galleryTitle.remove();
        galleryTitle = null;
      }

      // Restore real unit tokens.
      unitRenderer.sync(units);

      galleryUnits = [];
      galleryPositions = [];
    }

    // -----------------------------------------------------------------------
    // End turn (N key) + Gallery toggle (G key)
    // If animation is running, snap unit to destination first.
    // -----------------------------------------------------------------------

    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // --- Gallery toggle ---
      if (e.key.toLowerCase() === 'g') {
        galleryOn = !galleryOn;
        if (galleryOn) {
          enterGallery();
        } else {
          exitGallery();
        }
        return;
      }

      // --- N: End turn ---
      if (e.key.toLowerCase() === 'n') {
        // Gallery mode: ignore end-turn key.
        if (galleryOn) return;

        // Snap any in-flight animation to its destination.
        if (isAnimating && anim !== null) {
          const u = units.find(x => x.id === anim!.id);
          if (u) {
            u.q = anim.destQ;
            u.r = anim.destR;
            u.ruchLeft = Math.max(0, u.ruchLeft - anim.pathLen);
          }
          anim = null;
          isAnimating = false;
        }
        // Restore movement for all units
        for (const u of units) {
          u.ruchLeft = u.ruch;
        }
        selectedId = null;
        reachable = new Set<string>();
        unitRenderer.clearHighlight();
        unitRenderer.clearPathRoute();
        hoverKey = null;
        unitRenderer.sync(units);
        turn++;
        updateHud();
      }
    });

    // -----------------------------------------------------------------------
    // Render loop
    // -----------------------------------------------------------------------

    function renderLoop() {
      requestAnimationFrame(renderLoop);

      // --- Delta time (capped at 100 ms to skip large jumps on tab switch) ---
      const now = performance.now() / 1000;
      const dt = Math.min(now - prevTime, 0.1);
      prevTime = now;

      // --- Drive animation (only outside gallery mode) ---
      if (!galleryOn && isAnimating && anim !== null) {
        anim.t += dt / ANIM_SEG_DUR;

        // Advance through any fully elapsed segments.
        while (anim.t >= 1 && anim.seg < anim.points.length - 2) {
          anim.t -= 1;
          anim.seg++;
        }

        const lastSeg = anim.points.length - 2; // index of the final segment

        if (anim.seg >= lastSeg && anim.t >= 1) {
          // --- Animation complete ---
          const u = units.find(x => x.id === anim!.id);
          if (u) {
            u.q = anim.destQ;
            u.r = anim.destR;
            u.ruchLeft = Math.max(0, u.ruchLeft - anim.pathLen);
          }
          const finishedId = anim.id;
          anim = null;
          isAnimating = false;

          // Snap token to logical resting position.
          unitRenderer.sync(units);

          // Restore highlight if unit still selected and has moves remaining.
          if (selectedId === finishedId) {
            const sel = units.find(x => x.id === finishedId);
            if (sel && sel.ruchLeft > 0) {
              reachable = computeReachable(sel, map, occupiedExcept(sel.id));
              unitRenderer.setHighlight(reachable);
            } else {
              reachable = new Set<string>();
              unitRenderer.clearHighlight();
            }
          }
          updateHud();
        } else {
          // --- Interpolate token along current segment ---
          const tc = Math.min(Math.max(anim.t, 0), 1);
          const p0 = anim.points[anim.seg]!;
          const p1 = anim.points[anim.seg + 1]!;
          unitRenderer.setTokenWorldPosition(
            anim.id,
            p0.x + (p1.x - p0.x) * tc,
            p0.y + (p1.y - p0.y) * tc,
            p0.z + (p1.z - p0.z) * tc,
          );
        }
      }

      // --- Gallery label projection ---
      // Each frame in gallery mode: project each token's world position to
      // screen space using THREE.Vector3.project(camera), then convert NDC
      // coordinates to CSS pixels for the floating label div.
      //
      // Projection formula:
      //   worldPt.project(camera)  -> NDC (x,y,z) in [-1,1]^3
      //   px = (ndcX * 0.5 + 0.5) * canvasWidth   (left edge = 0)
      //   py = (-ndcY * 0.5 + 0.5) * canvasHeight  (top edge = 0)
      // If NDC z > 1: point is behind the camera near plane -> hide label.
      if (galleryOn && galleryLabels.length > 0) {
        const cw = canvas.clientWidth  || window.innerWidth;
        const ch = canvas.clientHeight || window.innerHeight;

        for (let i = 0; i < galleryLabels.length; i++) {
          const lbl = galleryLabels[i];
          if (!lbl) continue;
          const pos = galleryPositions[i];
          if (!pos) continue;

          // Lift the label anchor above the token base.
          const worldPt = new THREE.Vector3(pos.x, pos.y + GALLERY_LABEL_LIFT, pos.z);

          // Project world -> NDC (in-place mutation of worldPt).
          worldPt.project(camera);

          // Behind camera: hide.
          if (worldPt.z > 1.0) {
            lbl.style.display = 'none';
            continue;
          }

          // NDC -> CSS pixels.
          const px = ( worldPt.x * 0.5 + 0.5) * cw;
          const py = (-worldPt.y * 0.5 + 0.5) * ch;

          lbl.style.display = 'block';
          lbl.style.left    = Math.round(px) + 'px';
          lbl.style.top     = Math.round(py) + 'px';
        }
      }

      // --- Camera and render (always run, even during animation) ---
      camCtrl.update();
      renderer.render(scene, camera);
    }
    renderLoop();

  } catch (err) {
    showErr('FATAL: ' + String(err) + (err instanceof Error ? '\n' + err.stack : ''));
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
