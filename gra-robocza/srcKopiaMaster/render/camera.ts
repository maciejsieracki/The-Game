/**
 * camera.ts
 * Ręczna obsługa kamery — pan (drag myszą / WASD) + zoom (kółko myszy).
 * Brak OrbitControls — implementacja własna.
 *
 * Kamera zawsze patrzy na cel `target` w płaszczyźnie XZ (Y=0).
 * Pan = przesunięcie celu; zoom = zmiana odległości kamery od celu.
 */

import * as THREE from 'three';

export interface CameraControllerOptions {
  /** Minimalna odległość (zoom in). */
  minDist?: number;
  /** Maksymalna odległość (zoom out). */
  maxDist?: number;
  /** Prędkość klawiszowego przesunięcia (jedn. na klatkę). */
  keyPanSpeed?: number;
  /** Prędkość przesunięcia myszą (proporcjonalna do odległości). */
  mousePanFactor?: number;
  /** Współczynnik zoomu na jedno "kliknięcie" kółka. */
  zoomFactor?: number;
  /** Gdy true — nie obsługuj drag/zoom (np. kursor nad panelem miasta). */
  blockPointerAt?: (clientX: number, clientY: number) => boolean;
}

export class CameraController {
  private camera:  THREE.PerspectiveCamera;
  private canvas:  HTMLCanvasElement;
  private target:  THREE.Vector3;     // punkt patrzenia
  private dist:    number;            // odległość od celu
  private yaw:     number;            // obrót poziomy (nie zmieniamy — kamera stała)

  // Stan myszy
  private isDragging = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Klawisze
  private keys: Set<string> = new Set();

  // Opcje
  private minDist: number;
  private maxDist: number;
  private keyPanSpeed: number;
  private mousePanFactor: number;
  private zoomFactor: number;
  private blockPointerAt?: (clientX: number, clientY: number) => boolean;

  constructor(
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    initialTarget: { x: number; z: number },
    opts: CameraControllerOptions = {},
  ) {
    this.camera  = camera;
    this.canvas  = canvas;
    this.target  = new THREE.Vector3(initialTarget.x, 0, initialTarget.z);
    this.minDist = opts.minDist    ?? 5;
    this.maxDist = opts.maxDist    ?? 200;
    this.keyPanSpeed    = opts.keyPanSpeed    ?? 0.25;
    this.mousePanFactor = opts.mousePanFactor ?? 0.002;
    this.zoomFactor     = opts.zoomFactor     ?? 0.12;
    this.blockPointerAt = opts.blockPointerAt;

    // Oblicz dist i yaw z aktualnej pozycji kamery
    const offset = new THREE.Vector3().subVectors(camera.position, this.target);
    this.dist = offset.length();
    this.yaw  = 0; // fixed angle — kamera zawsze patrzy z SE

    this._bind();
    this._syncCamera();
  }

  // ── Synchronizacja pozycji kamery z target + dist ───────────────────────
  private _syncCamera() {
    // Stały kąt: elewacja ~50°, azymut 0 (kamera patrzy z południa)
    const elevation = THREE.MathUtils.degToRad(52);
    const azimut    = this.yaw;

    const cosEl = Math.cos(elevation);
    const sinEl = Math.sin(elevation);

    this.camera.position.set(
      this.target.x + this.dist * cosEl * Math.sin(azimut),
      this.target.y + this.dist * sinEl,
      this.target.z + this.dist * cosEl * Math.cos(azimut),
    );
    this.camera.lookAt(this.target);
  }

  // ── Pan w płaszczyźnie XZ (w kierunkach screen-aligned) ────────────────
  private _pan(dx: number, dz: number) {
    this.target.x += dx;
    this.target.z += dz;
    this._syncCamera();
  }

  // ── Zoom ────────────────────────────────────────────────────────────────
  private _zoom(delta: number) {
    this.dist = THREE.MathUtils.clamp(
      this.dist * (1 + delta * this.zoomFactor),
      this.minDist,
      this.maxDist,
    );
    this._syncCamera();
  }

  // ── Event bindings ──────────────────────────────────────────────────────
  private _onMouseDown = (e: MouseEvent) => {
    if (e.button !== 0) return;
    if (this.blockPointerAt?.(e.clientX, e.clientY)) return;
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private _onMouseMove = (e: MouseEvent) => {
    if (!this.isDragging) return;
    const ddx = e.clientX - this.lastMouseX;
    const ddy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Przesuń target w płaszczyźnie XZ proporcjonalnie do odległości
    const speed = this.dist * this.mousePanFactor;
    // ddx → ruch wzdłuż X; ddy → ruch wzdłuż Z
    this._pan(-ddx * speed, -ddy * speed);
  };

  private _onMouseUp = () => { this.isDragging = false; };

  private _onWheel = (e: WheelEvent) => {
    if (this.blockPointerAt?.(e.clientX, e.clientY)) return;
    e.preventDefault();
    const dir = e.deltaY > 0 ? 1 : -1; // >0 = scroll down = zoom out
    this._zoom(dir);
  };

  private _onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.key.toLowerCase()); };
  private _onKeyUp   = (e: KeyboardEvent) => { this.keys.delete(e.key.toLowerCase()); };

  private _bind() {
    this.canvas.addEventListener('mousedown',   this._onMouseDown);
    window.addEventListener     ('mousemove',   this._onMouseMove);
    window.addEventListener     ('mouseup',     this._onMouseUp);
    this.canvas.addEventListener('wheel',       this._onWheel, { passive: false });
    window.addEventListener     ('keydown',     this._onKeyDown);
    window.addEventListener     ('keyup',       this._onKeyUp);
  }

  dispose() {
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener      ('mousemove', this._onMouseMove);
    window.removeEventListener      ('mouseup',   this._onMouseUp);
    this.canvas.removeEventListener ('wheel',     this._onWheel);
    window.removeEventListener      ('keydown',   this._onKeyDown);
    window.removeEventListener      ('keyup',     this._onKeyUp);
  }

  /** Wywoływać każdą klatkę renderowania (obsługa WASD). */
  update() {
    const speed = this.keyPanSpeed * (this.dist / 30);
    let dx = 0, dz = 0;
    if (this.keys.has('w') || this.keys.has('arrowup'))    dz -= speed;
    if (this.keys.has('s') || this.keys.has('arrowdown'))  dz += speed;
    if (this.keys.has('a') || this.keys.has('arrowleft'))  dx -= speed;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += speed;
    if (dx !== 0 || dz !== 0) this._pan(dx, dz);
  }

  /** Przesun kamere na punkt mapy (wspolrzedne swiata XZ). */
  focusAt(x: number, z: number, dist?: number): void {
    this.target.set(x, 0, z);
    if (dist !== undefined) {
      this.dist = THREE.MathUtils.clamp(dist, this.minDist, this.maxDist);
    }
    this._syncCamera();
  }

  /** Aktualny cel i odległość (przywracanie po panelu miasta). */
  getFocusState(): { x: number; z: number; dist: number } {
    return { x: this.target.x, z: this.target.z, dist: this.dist };
  }

  /** Limity zoomu — do normalizacji LOD (0 = blisko, 1 = max oddalenie). */
  getDistLimits(): { minDist: number; maxDist: number } {
    return { minDist: this.minDist, maxDist: this.maxDist };
  }
}
