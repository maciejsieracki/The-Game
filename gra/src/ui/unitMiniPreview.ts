/**
 * Miniatura 3D jednostki (buildUnitModel) — statyczny render z shared WebGL.
 */
import * as THREE from 'three';
import { buildUnitModel } from '../render/units';
import { categoryOf } from '../units/setup';
import type { UnitDef } from '../data/loader';

const VIEW_W = 80;
const VIEW_H = 80;
const OWNER_DEFAULT = 0x3b7dd8;
const MODEL_CENTER_Y = 0.27;
const FIT_RADIUS = 0.42;
const SKY = 0x87ceeb;

const cache = new Map<string, HTMLCanvasElement>();

type GlBundle = {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
};

let gl: GlBundle | null = null;

function ensureGl(): GlBundle | null {
  if (gl) return gl;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = VIEW_W;
    canvas.height = VIEW_H;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (typeof renderer.render !== 'function') return null;
    renderer.setSize(VIEW_W, VIEW_H, false);
    renderer.setClearColor(SKY, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(SKY);
    scene.add(new THREE.HemisphereLight(0xd4eaff, 0x5a5040, 0.9));
    const sun = new THREE.DirectionalLight(0xfff0cc, 1.4);
    sun.position.set(2, 3.4, 1.4);
    scene.add(sun);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(0, 1.2, 3);
    scene.add(fill);

    const camera = new THREE.PerspectiveCamera(32, VIEW_W / VIEW_H, 0.01, 100);
    gl = { renderer, scene, camera };
    return gl;
  } catch {
    return null;
  }
}

function disposeUnit(group: THREE.Group): void {
  const mats = (group.userData['mats'] as THREE.Material[]) ?? [];
  for (const m of mats) m.dispose();
  const geos = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];
  for (const g of geos) g.dispose();
}

function placeCamera(camera: THREE.PerspectiveCamera): void {
  const dir = new THREE.Vector3(0, 0, 1);
  const vFov = (camera.fov * Math.PI) / 180;
  const dist = (FIT_RADIUS / Math.sin(vFov / 2)) * 1.18;
  camera.position.set(0, MODEL_CENTER_Y + dist * 0.18, dist);
  camera.lookAt(0, MODEL_CENTER_Y, 0);
  camera.updateProjectionMatrix();
}

function renderUnitThumbCanvas(u: UnitDef, ownerColor: number): HTMLCanvasElement | null {
  const name = u.Jednostka ?? '';
  if (!name) return null;
  const key = `${name}:${ownerColor}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const bundle = ensureGl();
  if (!bundle) return null;

  const isSuper = u['Super-jednostka'] === 'TAK';
  const cat = categoryOf(name, u['Rola (linia)'] ?? '', isSuper, u['Typ']);
  let group: THREE.Group;
  try {
    group = buildUnitModel(cat, ownerColor, name);
  } catch {
    return null;
  }

  const { renderer, scene, camera } = bundle;
  while (scene.children.length > 3) {
    scene.remove(scene.children[scene.children.length - 1]!);
  }
  scene.add(group);
  placeCamera(camera);
  renderer.render(scene, camera);

  const out = document.createElement('canvas');
  out.width = VIEW_W;
  out.height = VIEW_H;
  const ctx = out.getContext('2d');
  if (ctx) ctx.drawImage(renderer.domElement, 0, 0);

  scene.remove(group);
  disposeUnit(group);
  cache.set(key, out);
  return out;
}

const queue: { u: UnitDef; color: number; container: HTMLElement }[] = [];
let draining = false;

function drainQueue(): void {
  if (draining || queue.length === 0) return;
  draining = true;
  const job = queue.shift()!;
  requestAnimationFrame(() => {
    try {
      const canvas = renderUnitThumbCanvas(job.u, job.color);
      job.container.innerHTML = '';
      if (canvas) {
        canvas.className = 'unit-mini-canvas';
        job.container.appendChild(canvas);
      } else {
        job.container.textContent = '⚔';
        job.container.classList.add('unit-mini-fallback');
      }
    } finally {
      draining = false;
      drainQueue();
    }
  });
}

/** Wstaw miniaturę 3D (lazy) do kontenera. */
export function mountUnitMiniPreview(
  container: HTMLElement,
  u: UnitDef,
  ownerColor: number = OWNER_DEFAULT,
): void {
  container.classList.add('unit-mini-preview');
  container.innerHTML = '<span class="unit-mini-loading">…</span>';
  queue.push({ u, color: ownerColor, container });
  drainQueue();
}

export function defaultOwnerColor(): number {
  return OWNER_DEFAULT;
}
