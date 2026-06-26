/**
 * mappreview/main.ts (lane Civ-MAPA / F1 + podglad miast na mapie)
 * generateMap -> buildScene (teren/rzeki) + kilka MIAST (stoneCity) na pozycjach startowych.
 * Start owiniety w DOMContentLoaded. Sterowanie: drag=obrot, kolko=zoom, WASD=przesuw.
 *
 * URL parametry:
 *   ?seed=   ziarno (domyslnie 7, 0=losowy)
 *   ?w=      szerokosc w heksach
 *   ?h=      wysokosc w heksach
 *   ?typ=    typ swiata: kontynenty (domyslnie) | pangea | wyspy
 *   ?rozmiar= rozmiar predefiniowany: malenki|maly|standardowy|duzy|ogromny
 *             (nadpisuje ?w=/?h= gdy podany)
 */
import { generateMap, type GameMapWithStarts } from '../map/generator';
import type { TypSwiata } from '../map/gen-helpers';
import { buildScene } from '../render/scene';
import { buildStoneAgeCity } from '../render/stoneCity';
import { axialToWorld, HEX_R } from '../render/hexutil';
import { TerenBazowy, Nakladka } from '../types/hex';
import { buildResourceOverlay } from '../render/resources';

const TERR_TOP: Partial<Record<TerenBazowy, number>> = {
  [TerenBazowy.Morze]: 0.30, [TerenBazowy.Wybrzeze]: 0.40, [TerenBazowy.Laka]: 0.45,
  [TerenBazowy.Rownina]: 0.53, [TerenBazowy.Pustynia]: 0.45, [TerenBazowy.Wzgorza]: 0.65, [TerenBazowy.Gory]: 0.80,
};

// Predefiniowane rozmiary (musi byc zgodne z generator.ts ROZMIAR_DIMS)
const ROZMIAR_DIMS: Record<string, [number, number]> = {
  malenki:     [38,  26],
  maly:        [54,  37],
  standardowy: [84,  60],
  duzy:        [120, 84],
  ogromny:     [168, 119],
};

const VALID_TYPES: TypSwiata[] = ['kontynenty', 'pangea', 'wyspy'];

function clampInt(v: string | null, def: number, lo: number, hi: number): number {
  if (v === null) return def;
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return def;
  return Math.min(hi, Math.max(lo, n));
}

function parseTyp(v: string | null): TypSwiata {
  if (v && (VALID_TYPES as string[]).includes(v)) return v as TypSwiata;
  return 'kontynenty';
}

function setUrlParam(key: string, value: string): void {
  const p = new URLSearchParams(location.search);
  p.set(key, value);
  location.search = p.toString();
}

function boot(): void {
  const canvas = document.getElementById('map') as HTMLCanvasElement | null;
  if (!canvas) { console.error('mappreview: brak <canvas id="map">'); return; }

  const params = new URLSearchParams(location.search);

  // Typ swiata
  const TYP = parseTyp(params.get('typ'));

  // Rozmiar — ?rozmiar= nadpisuje ?w=/?h=
  let W: number, H: number;
  const rozmiarParam = params.get('rozmiar');
  if (rozmiarParam && ROZMIAR_DIMS[rozmiarParam]) {
    [W, H] = ROZMIAR_DIMS[rozmiarParam]!;
  } else {
    W = clampInt(params.get('w'), 46, 12, 200);
    H = clampInt(params.get('h'), 32, 10, 140);
  }

  // Seed: 0 → losowy (generowany tu, by pokazac w HUD)
  const seedParam = params.get('seed');
  const SEED = seedParam !== null
    ? (parseInt(seedParam, 10) || ((Date.now() ^ 0xdeadbeef) >>> 0))
    : 7;

  const map: GameMapWithStarts = generateMap(W, H, SEED, TYP);
  const effectiveSeed = (map as { seed?: number }).seed ?? SEED;

  const { scene, camera, renderer, center, setFog } = buildScene(map, canvas);

  const allKeys = new Set<string>(Object.keys(map.hexes));
  setFog(allKeys, new Set<string>());

  // --- Kilka MIAST na mapie ---
  const starts = ((map as unknown as { startPositions?: { q: number; r: number }[] }).startPositions) ?? [];
  const ownerCols = [0xffd54a, 0xe53935, 0x43a047, 0x1e88e5, 0xfb8c00, 0x8e24aa];
  const levelSeq = [2, 5, 8, 10, 3, 7, 4, 9, 6, 1];
  let ci = 0, cityCount = 0;
  for (const sp of starts) {
    const hex = map.hexes[`${sp.q},${sp.r}`];
    if (!hex) continue;
    const t = hex.terenBazowy;
    if (t === TerenBazowy.Morze || t === TerenBazowy.Gory) continue;
    const level = levelSeq[ci % levelSeq.length]!;
    const walls = ci % 3 === 0;
    const city = buildStoneAgeCity(level, ownerCols[ci % ownerCols.length]!, walls);
    const { x, z } = axialToWorld(sp.q, sp.r, HEX_R);
    city.position.set(x, (TERR_TOP[t] ?? 0.45) + 0.01, z);
    scene.add(city);
    ci++; cityCount++;
    if (cityCount >= 8) break;
  }

  // --- Surowce (nakladki) ---
  let resCount = 0;
  for (const hex of Object.values(map.hexes)) {
    if (hex.nakladka === Nakladka.Brak || hex.nakladka === Nakladka.Las) continue;
    const ov = buildResourceOverlay(hex.nakladka);
    if (!ov) continue;
    const { x, z } = axialToWorld(hex.coords.q, hex.coords.r, HEX_R);
    ov.position.set(x + 0.2, (TERR_TOP[hex.terenBazowy] ?? 0.45) + 0.01, z + 0.12);
    ov.rotation.y = hex.coords.q * 1.3 + hex.coords.r * 0.7;
    scene.add(ov);
    resCount++;
  }

  // --- HUD meta ---
  const hexTotal = W * H;
  const typLabel: Record<TypSwiata, string> = {
    kontynenty: 'Kontynenty',
    pangea: 'Pangea',
    wyspy: 'Wyspy',
  };
  const meta = document.getElementById('meta');
  if (meta) meta.textContent =
    `${W}×${H} hex (${hexTotal} razem) · typ: ${typLabel[TYP]} · seed ${effectiveSeed} · rzek: ${map.riverPaths.length} · miast: ${cityCount} · surowce: ${resCount}`;

  // --- Aktywny przycisk typu ---
  for (const t of VALID_TYPES) {
    const btn = document.getElementById(`btn-typ-${t}`);
    if (btn) {
      if (t === TYP) {
        btn.classList.add('active');
      } else {
        btn.addEventListener('click', () => setUrlParam('typ', t));
      }
    }
  }

  // --- Aktywny przycisk rozmiaru ---
  for (const r of Object.keys(ROZMIAR_DIMS)) {
    const btn = document.getElementById(`btn-roz-${r}`);
    if (btn) {
      const dims = ROZMIAR_DIMS[r]!;
      const isActive = (dims[0] === W && dims[1] === H && !params.get('w') && !params.get('h')) ||
        (params.get('rozmiar') === r);
      if (isActive) {
        btn.classList.add('active');
      } else {
        btn.addEventListener('click', () => {
          const p = new URLSearchParams(location.search);
          p.set('rozmiar', r);
          p.delete('w'); p.delete('h');
          location.search = p.toString();
        });
      }
    }
  }

  // --- Kamera: orbit wokol RUCHOMEGO celu ---
  let tx = center.x, tz = center.z;
  const initPos = camera.position.clone();
  let radius = Math.hypot(initPos.x - tx, initPos.y, initPos.z - tz);
  let theta  = Math.atan2(initPos.x - tx, initPos.z - tz);
  let phi    = Math.acos(Math.min(1, Math.max(-1, initPos.y / radius)));
  const init = { radius, theta, phi, tx, tz };

  function updateCam(): void {
    const s = Math.sin(phi);
    camera.position.set(tx + radius * s * Math.sin(theta), radius * Math.cos(phi), tz + radius * s * Math.cos(theta));
    camera.lookAt(tx, 0, tz);
  }

  let dragging = false, lx = 0, ly = 0;
  canvas.addEventListener('pointerdown', (e) => { dragging = true; lx = e.clientX; ly = e.clientY; });
  window.addEventListener('pointerup', () => { dragging = false; });
  window.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    theta -= (e.clientX - lx) * 0.005;
    phi = Math.min(1.45, Math.max(0.12, phi - (e.clientY - ly) * 0.005));
    lx = e.clientX; ly = e.clientY; updateCam();
  });
  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    radius = Math.min(520, Math.max(4, radius * (1 + Math.sign(e.deltaY) * 0.08)));
    updateCam();
  }, { passive: false });

  const pressed = new Set<string>();
  const panKeys = ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'];
  window.addEventListener('keydown', (e) => { const k = e.key.toLowerCase(); if (panKeys.includes(k)) { pressed.add(k); e.preventDefault(); } });
  window.addEventListener('keyup', (e) => { pressed.delete(e.key.toLowerCase()); });
  function applyPan(): void {
    if (pressed.size === 0) return;
    const st = radius * 0.012, fx = -Math.sin(theta), fz = -Math.cos(theta), rx = Math.cos(theta), rz = -Math.sin(theta);
    if (pressed.has('w') || pressed.has('arrowup')) { tx += fx * st; tz += fz * st; }
    if (pressed.has('s') || pressed.has('arrowdown')) { tx -= fx * st; tz -= fz * st; }
    if (pressed.has('d') || pressed.has('arrowright')) { tx += rx * st; tz += rz * st; }
    if (pressed.has('a') || pressed.has('arrowleft')) { tx -= rx * st; tz -= rz * st; }
    updateCam();
  }

  let autoRot = false;
  const bS = document.getElementById('btn-seed'), bR = document.getElementById('btn-reset'), bO = document.getElementById('btn-rot');
  if (bS) bS.addEventListener('click', () => {
    const s = Math.floor(Math.random() * 100000) + 1;
    const p = new URLSearchParams(location.search);
    p.set('seed', String(s));
    location.search = p.toString();
  });
  if (bR) bR.addEventListener('click', () => { radius = init.radius; theta = init.theta; phi = init.phi; tx = init.tx; tz = init.tz; updateCam(); });
  if (bO) bO.addEventListener('click', () => { autoRot = !autoRot; bO.textContent = autoRot ? 'Obrot: on' : 'Obrot: off'; });

  updateCam();
  renderer.setAnimationLoop(() => { applyPan(); if (autoRot) { theta += 0.0016; updateCam(); } renderer.render(scene, camera); });
  (window as unknown as { __mapReady?: boolean }).__mapReady = true;
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
