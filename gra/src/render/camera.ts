/**
 * camera.ts
 * Ręczna obsługa kamery — pan (drag myszą / WASD) + zoom (kółko myszy).
 * Brak OrbitControls — implementacja własna.
 *
 * Kamera zawsze patrzy na cel `target` w płaszczyźnie XZ (Y=0).
 * Pan = przesunięcie celu; zoom = zmiana odległości kamery od celu.
 */

import * as THREE from 'three';

/**
 * Martwa strefa (px) odróżniająca KLIK od PRZECIĄGNIĘCIA mapy — jedno źródło prawdy
 * dla kamery i dla obsługi kliknięcia w main.ts.
 *
 * Zgłoszenie właściciela 2026-07-26 („czasem trzeba trzy razy kliknąć w kafelek, żeby
 * przenieść jednostkę"): main.ts odrzucał klik, gdy między mousedown a mouseup kursor
 * przejechał ≥ 6 px, ale kamera panowała już od PIERWSZEGO piksela ruchu. Drobne
 * drgnięcie ręki przy kliknięciu dawało więc dwa niezależne skutki: mapa uciekała spod
 * kursora (pan ≈ 2× szybszy niż sam kursor, więc heks pod kursorem przesuwał się o ok.
 * 0,05 heksa na piksel), a przy większym drgnięciu klik znikał bez śladu. Teraz kamera
 * używa TEJ SAMEJ martwej strefy: poniżej progu nie pan-uje wcale (klik zachowuje się
 * jak klik), powyżej — startuje przeciąganie od punktu przekroczenia progu.
 */
export const DRAG_THRESHOLD_PX = 6;

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
  /** Gdy true — nie obsługuj drag/pan (np. kursor nad panelem miasta, tryb zakładania miasta/
   *  stawiania ulepszenia — tam klik ma trafić w placement, nie w pan kamery). */
  blockPointerAt?: (clientX: number, clientY: number) => boolean;
  /**
   * Gdy true — nie obsługuj zoomu kółkiem. Osobny predykat od `blockPointerAt`
   * (BUG-ZOOM-ZABLOKOWANY-TRYB-ULEPSZEN, Maciej 2026-08-08): tryb budowania ulepszeń/cudu
   * blokował dotąd zoom razem z panem, bo oba korzystały z tego samego `blockPointerAt` —
   * gracz nie mógł przybliżyć/oddalić mapy przy wskazywaniu heksu docelowego. Domyślnie (gdy
   * nieustawione) = `blockPointerAt`, więc wywołania bez tej opcji zachowują stare zachowanie.
   */
  blockWheelAt?: (clientX: number, clientY: number) => boolean;
  /**
   * C-EDGEPAN-Q1 = **B** (Maciej 2026-07-25): edge-pan aktywny na mapie świata,
   * gdy predykat zwraca true (w main.ts: `isWorldMapUnitMode()` — nie wymaga
   * zaznaczonej jednostki). Brak funkcji = edge-pan wyłączony.
   */
  edgePanActive?: () => boolean;
  /** Szerokość strefy krawędziowej ekranu w px, licząc od brzegu canvasu (domyślnie 32). */
  edgePanZonePx?: number;
  /** Prędkość edge-pan przy samej krawędzi (jedn./klatkę, skalowana dystansem jak WASD). */
  edgePanSpeed?: number;
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
  /** Pozycja wciśnięcia LPM — punkt odniesienia martwej strefy klik/drag. */
  private pressX = 0;
  private pressY = 0;
  /** true dopiero po przekroczeniu DRAG_THRESHOLD_PX — wcześniej kamera stoi. */
  private dragArmed = false;

  // Klawisze
  private keys: Set<string> = new Set();

  // Edge-pan: ostatnia znana pozycja kursora w oknie (client coords); null = kursor
  // poza oknem (opuścił dokument) — edge-pan wtedy nieaktywny.
  private mouseClientX: number | null = null;
  private mouseClientY: number | null = null;

  // Opcje
  private minDist: number;
  private maxDist: number;
  private keyPanSpeed: number;
  private mousePanFactor: number;
  private zoomFactor: number;
  private blockPointerAt?: (clientX: number, clientY: number) => boolean;
  private blockWheelAt?: (clientX: number, clientY: number) => boolean;
  private edgePanActive?: () => boolean;
  private edgePanZonePx: number;
  private edgePanSpeed: number;

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
    // Domyślnie = blockPointerAt (stare zachowanie), gdy wywołujący nie poda osobnego
    // predykatu dla kółka — patrz komentarz przy `blockWheelAt` w interfejsie wyżej.
    this.blockWheelAt   = opts.blockWheelAt ?? opts.blockPointerAt;
    this.edgePanActive  = opts.edgePanActive;
    this.edgePanZonePx  = opts.edgePanZonePx  ?? 32;
    this.edgePanSpeed   = opts.edgePanSpeed   ?? this.keyPanSpeed;

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
    this.dragArmed = false;
    this.pressX = e.clientX;
    this.pressY = e.clientY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
  };

  private _onMouseMove = (e: MouseEvent) => {
    // Edge-pan: zapamiętaj pozycję kursora ZAWSZE (nie tylko przy drag) — update()
    // sprawdza ją co klatkę. Musi być przed early-returnem poniżej.
    this.mouseClientX = e.clientX;
    this.mouseClientY = e.clientY;

    if (!this.isDragging) return;

    // Martwa strefa: dopóki kursor nie odjechał od punktu wciśnięcia o DRAG_THRESHOLD_PX,
    // to jeszcze KLIK, nie przeciąganie — mapa ma stać w miejscu, żeby heks pod kursorem
    // nie uciekł przed mouseup (main.ts liczy trafienie dopiero na mouseup).
    if (!this.dragArmed) {
      const px = e.clientX - this.pressX;
      const py = e.clientY - this.pressY;
      if (px * px + py * py < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX) return;
      this.dragArmed = true;
      // Przeciąganie startuje OD progu (nie od punktu wciśnięcia) — brak skoku mapy.
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
      return;
    }

    const ddx = e.clientX - this.lastMouseX;
    const ddy = e.clientY - this.lastMouseY;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    // Przesuń target w płaszczyźnie XZ proporcjonalnie do odległości
    const speed = this.dist * this.mousePanFactor;
    // ddx → ruch wzdłuż X; ddy → ruch wzdłuż Z
    this._pan(-ddx * speed, -ddy * speed);
  };

  private _onMouseUp = () => { this.isDragging = false; this.dragArmed = false; };

  // Kursor opuścił okno/dokument (alt-tab, drugi monitor…) — edge-pan musi się zatrzymać,
  // inaczej mapa "ucieka" bez kontroli gracza.
  private _onWindowBlur = () => { this.mouseClientX = null; this.mouseClientY = null; };
  private _onDocMouseLeave = () => { this.mouseClientX = null; this.mouseClientY = null; };

  private _onWheel = (e: WheelEvent) => {
    if (this.blockWheelAt?.(e.clientX, e.clientY)) return;
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
    window.addEventListener     ('blur',        this._onWindowBlur);
    document.addEventListener   ('mouseleave',  this._onDocMouseLeave);
  }

  dispose() {
    this.canvas.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener      ('mousemove', this._onMouseMove);
    window.removeEventListener      ('mouseup',   this._onMouseUp);
    this.canvas.removeEventListener ('wheel',     this._onWheel);
    window.removeEventListener      ('keydown',   this._onKeyDown);
    window.removeEventListener      ('keyup',     this._onKeyUp);
    window.removeEventListener      ('blur',      this._onWindowBlur);
    document.removeEventListener    ('mouseleave', this._onDocMouseLeave);
  }

  // ── Edge-pan: przesuwanie mapy gdy kursor jest w wąskiej strefie przy krawędzi
  // ekranu — C-EDGEPAN-Q1=B (zawsze na mapie świata, patrz main.ts edgePanActive).
  // Prędkość rośnie liniowo im bliżej samej krawędzi (0 na granicy strefy, max na
  // krawędzi viewportu). Kierunki = te same znaki co WASD (patrz update() niżej).
  private _edgePanDelta(): { dx: number; dz: number } | null {
    if (!this.edgePanActive?.()) return null;
    if (this.mouseClientX === null || this.mouseClientY === null) return null;
    if (this.isDragging) return null; // drag ma priorytet, bez konfliktu z pan-em
    if (this.blockPointerAt?.(this.mouseClientX, this.mouseClientY)) return null;

    const rect = this.canvas.getBoundingClientRect();
    const mx = this.mouseClientX - rect.left;
    const my = this.mouseClientY - rect.top;
    // Kursor poza canvasem (np. nad panelem HTML nachodzącym na okno) — bez edge-panu.
    if (mx < 0 || my < 0 || mx > rect.width || my > rect.height) return null;

    const zone = this.edgePanZonePx;
    const speed = this.edgePanSpeed * (this.dist / 30);
    let dx = 0, dz = 0;
    if (mx < zone)                dx -= speed * ((zone - mx) / zone);
    if (mx > rect.width - zone)   dx += speed * ((zone - (rect.width - mx)) / zone);
    if (my < zone)                dz -= speed * ((zone - my) / zone);
    if (my > rect.height - zone)  dz += speed * ((zone - (rect.height - my)) / zone);
    if (dx === 0 && dz === 0) return null;
    return { dx, dz };
  }

  /** Wywoływać każdą klatkę renderowania (obsługa WASD + edge-pan). */
  update() {
    const speed = this.keyPanSpeed * (this.dist / 30);
    let dx = 0, dz = 0;
    if (this.keys.has('w') || this.keys.has('arrowup'))    dz -= speed;
    if (this.keys.has('s') || this.keys.has('arrowdown'))  dz += speed;
    if (this.keys.has('a') || this.keys.has('arrowleft'))  dx -= speed;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += speed;

    // Edge-pan: niezależny od WASD, ale nie dublujemy ruchu — jeśli gracz jednocześnie
    // trzyma klawisz w tym samym kierunku, WASD i tak da ten sam znak (sumowanie OK).
    const edge = this._edgePanDelta();
    if (edge) { dx += edge.dx; dz += edge.dz; }

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
