/**
 * manualBattle.ts
 * RECZNIE STEROWANA bitwa taktyczna (player-controlled) dla "The Game" (4X Civ-style).
 *
 * Roznice wzgledem battleScene.ts (auto-bitwa):
 *   - Wieksza, w pelni nawigowalna plansza heksow (~20 kol x 12 wierszy), teren-kolor.
 *   - Kamera: pan (drag myszka / WASD) + zoom (kolko) -- wlasny CameraController (jak src/render/camera.ts).
 *   - Gracz steruje swoja strona: klik jednostki -> podswietlenie zasiegu ruchu;
 *     klik heksu -> ruch (animowany); klik sasiedniego wroga -> ATAK -> resolveCombat (SS5l)
 *     -> animowana wymiana cios-za-cios z paskami HP + liczbami obrazen (jak battleScene).
 *   - Tury: gracz rusza/atakuje swoimi jednostkami, potem AI wroga, az jedna strona zostanie
 *     wyeliminowana; wtedy wywolanie onFinish(result).
 *
 * Buduje siatke TAK SAMO jak src/render/scene.ts (sprawdzony sposob):
 *   CylinderGeometry(R*0.998, R*0.998, h, 6) -- BEZ rotateY (CylinderGeometry(6) jest juz
 *   pointy-top jak axialToWorld) -> kafelki bez szczelin. Pozycja przez axialToWorld(q, r, R).
 *
 * Zachowuje ten sam ksztalt BattleUnit co battleScene.ts.
 * API: constructor(opts) -> start(onFinish) -> dispose().
 *
 * Plik samowystarczalny: NIE edytuje battleScene.ts. Male pomocnicze funkcje
 * (toCombatUnit, norm, terrainFloorColor, lighten, styleButton, makeFallbackAvatar,
 * makeHpBar, worldToScreen, lerp/easeOut/easeIn) sa zduplikowane lokalnie, bo w
 * battleScene.ts sa prywatne dla modulu. ASCII-only zrodlo.
 */

import * as THREE from 'three';
import { resolveCombat } from '../game/combat';
import type { CombatUnit, CombatResult } from '../game/combat';
import { combatUnitFromDef } from '../game/combat';
import { applyVeteranFracToCombatUnit } from '../game/veteran';
import { applyArmyHungerStatMultToCombatUnit } from '../game/army-starvation';
import type { CivBonusEntry } from '../game/civ-bonuses';
import { axialToWorld, HEX_R, SQRT3 } from '../render/hexutil';
import { buildUnitModel } from '../render/units';

// ===========================================================================
// Public types -- IDENTYCZNY ksztalt jak battleScene.ts
// ===========================================================================

export interface BattleUnit {
  id: string;
  nazwa: string;
  kategoria: string;
  ownerColor: number;
  stats: any;
  hp: number;
  maxHp: number;
  /** Sciezki ulepszen jednostek (2026-07-25) -- patrz battleScene.ts BattleUnit. */
  pancerzBonusFrac?: number;
  parametryBonusFrac?: number;
  /** TRZECI SYSTEM -- weterani (2026-07-25) -- patrz battleScene.ts BattleUnit / game/veteran.ts. */
  veteranBonusFrac?: number;
  /** Głód wojska (PYTANIE-85) — osłabienie statów bojowych bez armor. */
  armyHungry?: boolean;
}

export interface ManualBattleOpts {
  /** Jednostki gracza (strona sterowana recznie). */
  player: BattleUnit[];
  /** Jednostki wroga (sterowane prostym AI). */
  enemy: BattleUnit[];
  /** Nazwa terenu (kolor podlogi + ew. modyfikatory obrony w resolveCombat). */
  teren: string;
  /** Opcjonalne dane terenowe / liczniki przekazywane do resolveCombat. */
  data?: { terrainData?: any[]; counters?: any[] };
  /** Wywolanie gdy gracz nacisnie "Wyjscie" / anuluje. */
  onCancel?: () => void;
  /** Liczba kolumn planszy (domyslnie 20). */
  cols?: number;
  /** Liczba wierszy planszy (domyslnie 12). */
  rows?: number;
  /** RDY-01 / D4-Q3: bonusy cyw gracza (atakujacy). */
  attackerCivBonusy?: readonly CivBonusEntry[];
  /** RDY-01 / D4-Q3: bonusy cyw wroga (obronca). */
  defenderCivBonusy?: readonly CivBonusEntry[];
  /** Mnożnik statów bojowych przy głodzie wojska (domyślnie 0.75). */
  armyHungerStatMult?: number;
}

export interface ManualBattleResult {
  winner: 'gracz' | 'wrog' | 'remis';
  survivors: BattleUnit[];
  log: string[];
}

// ===========================================================================
// Stale
// ===========================================================================

const MB_R = HEX_R; // promien heksu planszy bitewnej (1.0)

const DEFAULT_COLS = 20;
const DEFAULT_ROWS = 12;

const TILE_H = 0.10; // wysokosc kafelka; gorna sciana na y=0
const UNIT_Y = 0;    // jednostki stoja na gornej scianie

// Animacje (z battleScene.ts)
const LUNGE_MS        = 180;
const RECOIL_MS       = 130;
const ROUND_PAUSE_MS  = 140;
const HALF_MS         = LUNGE_MS + RECOIL_MS + ROUND_PAUSE_MS;
const VIS_ROUND_MS    = HALF_MS * 2;        // jedna runda wizualna = 900 ms
const MAX_VIS_ROUNDS  = 10;
const DEATH_FADE_MS   = 500;
const MOVE_STEP_MS    = 220;                // czas przejscia jednego heksu w ruchu

// Paski HP (z battleScene.ts)
const HPBAR_W = 0.80;
const HPBAR_H = 0.08;
const HPBAR_Y = 1.05;

// Kolory podswietlen
const COLOR_MOVE_HL   = 0x2f80ff; // zasieg ruchu (niebieski)
const COLOR_ATTACK_HL = 0xff3030; // mozliwy cel ataku (czerwony)
const COLOR_SELECT_HL = 0xffd000; // wybrana jednostka (zloty pierscien)

// Kolory terenu planszy bitewnej (z battleScene.ts)
const TERRAIN_COLORS: Record<string, number> = {
  laka:     0x5a8a3a,
  rownina:  0x7daa52,
  wzgorza:  0xa08850,
  gory:     0x8a8880,
  pustynia: 0xc8a862,
  wybrzeze: 0xd8c880,
  morze:    0x3068a0,
  las:      0x2e6830,
};

// ===========================================================================
// Pomocnicze (zduplikowane z battleScene.ts -- tam prywatne dla modulu)
// ===========================================================================

function terrainFloorColor(teren: string): number {
  const key = teren
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  for (const [k, v] of Object.entries(TERRAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 0x6a9448;
}

function norm(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
  return isNaN(n) ? fallback : n;
}

function toCombatUnit(bu: BattleUnit, armyHungerStatMult = 0.75): CombatUnit {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const cu = combatUnitFromDef(s, {
    typNazwa: (s['Jednostka'] as string) ?? bu.kategoria,
    hp: bu.hp,
  });
  // TRZECI SYSTEM (weterani) -- patrz battleScene.ts toCombatUnit / game/veteran.ts.
  let scaled = applyVeteranFracToCombatUnit(cu, bu.veteranBonusFrac ?? 0);
  if (bu.armyHungry) {
    scaled = applyArmyHungerStatMultToCombatUnit(scaled, armyHungerStatMult);
  }
  return scaled;
}

/** Punkty ruchu w bitwie dla jednostki (heksy/ture). Domyslnie 3, min 1. */
function movementPoints(bu: BattleUnit): number {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  const mv = norm(s['Ruch w bitwie (heksy)'], 3);
  return Math.max(1, Math.round(mv));
}

function makeFallbackAvatar(color: number): THREE.Group {
  const group   = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(0.18, 0.28, 0.12);
  const headGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
  const mat     = new THREE.MeshLambertMaterial({ color });
  const body    = new THREE.Mesh(bodyGeo, mat);
  const head    = new THREE.Mesh(headGeo, mat);
  body.position.y = 0.14;
  head.position.y = 0.35;
  body.castShadow = true;
  head.castShadow = true;
  group.add(body);
  group.add(head);
  group.userData['mats']         = [mat];
  group.userData['perTokenGeos'] = [bodyGeo, headGeo];
  return group;
}

function makeHpBar(): { hpBarGroup: THREE.Group; hpBarFg: THREE.Mesh; hpBarBg: THREE.Mesh } {
  const group = new THREE.Group();

  const bgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x441010, side: THREE.DoubleSide });
  const bg    = new THREE.Mesh(bgGeo, bgMat);
  group.add(bg);

  const fgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H * 0.75);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x30c030, side: THREE.DoubleSide });
  const fg    = new THREE.Mesh(fgGeo, fgMat);
  fg.position.z = 0.002;
  group.add(fg);

  return { hpBarGroup: group, hpBarFg: fg, hpBarBg: bg };
}

function worldToScreen(
  worldPos: THREE.Vector3,
  camera:   THREE.PerspectiveCamera,
  canvas:   HTMLCanvasElement,
): { x: number; y: number } | null {
  const v = worldPos.clone().project(camera);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  return { x: ((v.x + 1) / 2) * w, y: ((-v.y + 1) / 2) * h };
}

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function easeIn(t: number): number  { return t * t; }

function lighten(hex: number, amt: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + Math.round(255 * amt));
  const g = Math.min(255, ((hex >>  8) & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, ( hex        & 0xff)  + Math.round(255 * amt));
  return (r << 16) | (g << 8) | b;
}

function styleButton(btn: HTMLButtonElement, bg: string, fg: string): void {
  Object.assign(btn.style, {
    background:    bg,
    color:         fg,
    border:        'none',
    borderRadius:  '6px',
    padding:       '8px 20px',
    fontSize:      '15px',
    fontFamily:    'sans-serif',
    fontWeight:    'bold',
    cursor:        'pointer',
    letterSpacing: '0.03em',
    boxShadow:     '0 2px 8px rgba(0,0,0,0.5)',
  });
}

// ===========================================================================
// Heksowa geometria pomocnicza (axial, pointy-top -- zgodna z hexutil)
// ===========================================================================

/** 6 kierunkow sasiedztwa w ukladzie axial pointy-top. */
const HEX_DIRS: ReadonlyArray<readonly [number, number]> = [
  [ 1, 0], [ 1, -1], [ 0, -1],
  [-1, 0], [-1,  1], [ 0,  1],
];

function hexKey(q: number, r: number): string { return q + ',' + r; }

/** Odleglosc heksowa w ukladzie axial. */
function hexDistance(aq: number, ar: number, bq: number, br: number): number {
  const dq = aq - bq;
  const dr = ar - br;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
}

// ===========================================================================
// Runtime unit (wewnetrzny)
// ===========================================================================

interface RuntimeUnit {
  bu:           BattleUnit;
  group:        THREE.Group;
  hpBarGroup:   THREE.Group;
  hpBarFg:      THREE.Mesh;
  hpBarBg:      THREE.Mesh;
  q:            number;
  r:            number;
  side:         'player' | 'enemy';
  dead:         boolean;
  fadingOut:    boolean;
  fadeStart:    number;
  acted:        boolean;   // czy juz dzialala w tej turze (ruch/atak)
  moveLeft:     number;    // pozostale punkty ruchu w tej turze
  facingRight:  boolean;
  mats:         THREE.Material[];
  perTokenGeos: THREE.BufferGeometry[];
}

interface FloatLabel {
  elem:      HTMLDivElement;
  startTime: number;
  duration:  number;
  worldPos:  THREE.Vector3;
  riseRate:  number;
}

// ===========================================================================
// Wlasny kontroler kamery (wzorzec z src/render/camera.ts), dopasowany do bitwy.
// Pan = przesuniecie celu w XZ; zoom = zmiana odleglosci. Staly kat patrzenia.
// ===========================================================================

class BattleCamera {
  private camera: THREE.PerspectiveCamera;
  private canvas: HTMLCanvasElement;
  private target: THREE.Vector3;
  private dist:   number;

  private isDragging = false;
  private dragMoved  = false;
  private lastX = 0;
  private lastY = 0;
  private downX = 0;
  private downY = 0;

  private keys = new Set<string>();

  private minDist: number;
  private maxDist: number;

  constructor(
    camera: THREE.PerspectiveCamera,
    canvas: HTMLCanvasElement,
    target: { x: number; z: number },
    dist:   number,
    minDist: number,
    maxDist: number,
  ) {
    this.camera  = camera;
    this.canvas  = canvas;
    this.target  = new THREE.Vector3(target.x, 0, target.z);
    this.dist    = dist;
    this.minDist = minDist;
    this.maxDist = maxDist;
    this._sync();
    this._bind();
  }

  private _sync(): void {
    const elevation = THREE.MathUtils.degToRad(55);
    const cosEl = Math.cos(elevation);
    const sinEl = Math.sin(elevation);
    this.camera.position.set(
      this.target.x,
      this.target.y + this.dist * sinEl,
      this.target.z + this.dist * cosEl,
    );
    this.camera.lookAt(this.target);
  }

  private _pan(dx: number, dz: number): void {
    this.target.x += dx;
    this.target.z += dz;
    this._sync();
  }

  private _zoom(dir: number): void {
    this.dist = THREE.MathUtils.clamp(this.dist * (1 + dir * 0.12), this.minDist, this.maxDist);
    this._sync();
  }

  private _onDown = (e: MouseEvent): void => {
    if (e.button !== 0) return;
    this.isDragging = true;
    this.dragMoved  = false;
    this.lastX = e.clientX; this.lastY = e.clientY;
    this.downX = e.clientX; this.downY = e.clientY;
  };

  private _onMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    const ddx = e.clientX - this.lastX;
    const ddy = e.clientY - this.lastY;
    this.lastX = e.clientX; this.lastY = e.clientY;
    if (Math.abs(e.clientX - this.downX) > 4 || Math.abs(e.clientY - this.downY) > 4) {
      this.dragMoved = true;
    }
    const speed = this.dist * 0.0016;
    this._pan(-ddx * speed, -ddy * speed);
  };

  private _onUp = (): void => { this.isDragging = false; };

  private _onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this._zoom(e.deltaY > 0 ? 1 : -1);
  };

  private _onKeyDown = (e: KeyboardEvent): void => { this.keys.add(e.key.toLowerCase()); };
  private _onKeyUp   = (e: KeyboardEvent): void => { this.keys.delete(e.key.toLowerCase()); };

  private _bind(): void {
    this.canvas.addEventListener('mousedown', this._onDown);
    window.addEventListener('mousemove', this._onMove);
    window.addEventListener('mouseup',   this._onUp);
    this.canvas.addEventListener('wheel', this._onWheel, { passive: false });
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup',   this._onKeyUp);
  }

  /** True jesli ostatni gest myszy byl przeciagnieciem (kamera), nie klikiem. */
  consumedDrag(): boolean { return this.dragMoved; }

  update(): void {
    const speed = 0.30 * (this.dist / 25);
    let dx = 0, dz = 0;
    if (this.keys.has('w') || this.keys.has('arrowup'))    dz -= speed;
    if (this.keys.has('s') || this.keys.has('arrowdown'))  dz += speed;
    if (this.keys.has('a') || this.keys.has('arrowleft'))  dx -= speed;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += speed;
    if (dx !== 0 || dz !== 0) this._pan(dx, dz);
  }

  dispose(): void {
    this.canvas.removeEventListener('mousedown', this._onDown);
    window.removeEventListener('mousemove', this._onMove);
    window.removeEventListener('mouseup',   this._onUp);
    this.canvas.removeEventListener('wheel', this._onWheel);
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup',   this._onKeyUp);
  }
}

// ===========================================================================
// ManualBattle
// ===========================================================================

type Phase = 'player' | 'enemy' | 'anim' | 'done';

export class ManualBattle {
  // DOM / Three
  private overlay:  HTMLDivElement;
  private canvas:   HTMLCanvasElement;
  private hint:     HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;
  private cam:      BattleCamera;

  private raycaster = new THREE.Raycaster();

  // Plansza
  private cols: number;
  private rows: number;
  private teren: string;
  private tileMeshes: THREE.Mesh[] = [];
  private tileByKey   = new Map<string, THREE.Mesh>();
  private baseTileColor = new Map<string, number>();

  // Jednostki
  private players: RuntimeUnit[] = [];
  private enemies: RuntimeUnit[] = [];
  private occByKey = new Map<string, RuntimeUnit>();

  // Podswietlenia (overlay meshes nad kafelkami)
  private highlightGroup = new THREE.Group();
  private highlightGeos: THREE.BufferGeometry[] = [];
  private highlightMats: THREE.Material[]       = [];
  private selectRing: THREE.Mesh | null = null;
  private reachable = new Map<string, number>(); // klucz -> koszt dojscia (dla wybranej jedn.)

  // Stan
  private selected: RuntimeUnit | null = null;
  private phase: Phase = 'player';
  private finished = false;
  private started  = false;

  // Pamiec zasobow do dispose
  private ownedGeos: THREE.BufferGeometry[] = [];
  private ownedMats: THREE.Material[]       = [];

  private floatLabels: FloatLabel[] = [];
  private fadingUnits:  RuntimeUnit[] = [];
  private log: string[] = [];

  private animFrameId: number | null = null;
  private onFinishCb: ((r: ManualBattleResult) => void) | null = null;
  private onCancelCb: (() => void) | null = null;

  // dane do resolveCombat
  private terrainData: any[];
  private counters:    any[];
  private attackerCivBonusy: readonly CivBonusEntry[] = [];
  private defenderCivBonusy: readonly CivBonusEntry[] = [];
  private armyHungerStatMult = 0.75;

  // ------------------------------------------------------------------------
  constructor(opts: ManualBattleOpts) {
    this.cols  = opts.cols ?? DEFAULT_COLS;
    this.rows  = opts.rows ?? DEFAULT_ROWS;
    this.teren = opts.teren;
    this.onCancelCb  = opts.onCancel ?? null;
    this.terrainData = opts.data?.terrainData ?? [];
    this.counters    = opts.data?.counters ?? [];
    this.attackerCivBonusy = opts.attackerCivBonusy ?? [];
    this.defenderCivBonusy = opts.defenderCivBonusy ?? [];
    this.armyHungerStatMult = opts.armyHungerStatMult ?? 0.75;

    // ---- Overlay + UI ----
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9999',
      background: 'rgba(0,0,0,0.90)',
      display: 'flex', flexDirection: 'column',
    });

    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
      padding: '8px 16px', color: '#f0e6d0', fontFamily: 'sans-serif',
      fontSize: '16px', fontWeight: 'bold', display: 'flex',
      alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(20,16,12,0.95)',
    });
    const titleTxt = document.createElement('span');
    titleTxt.textContent = 'Bitwa taktyczna -- sterowanie reczne  (' + this.teren + ')';
    titleBar.appendChild(titleTxt);

    const btnBox = document.createElement('div');
    btnBox.style.display = 'flex';
    btnBox.style.gap = '10px';

    const btnEnd = document.createElement('button');
    btnEnd.textContent = 'Zakoncz ture';
    styleButton(btnEnd, '#3a5a8a', '#fff');
    btnEnd.onclick = () => this._endPlayerTurn();

    const btnExit = document.createElement('button');
    btnExit.textContent = 'Wyjscie';
    styleButton(btnExit, '#7a2a2a', '#fff');
    btnExit.onclick = () => { this.dispose(); if (this.onCancelCb) this.onCancelCb(); };

    btnBox.appendChild(btnEnd);
    btnBox.appendChild(btnExit);
    titleBar.appendChild(btnBox);
    this.overlay.appendChild(titleBar);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, { flex: '1', display: 'block', width: '100%', cursor: 'pointer' });
    this.overlay.appendChild(this.canvas);

    this.hint = document.createElement('div');
    Object.assign(this.hint.style, {
      padding: '6px 16px', color: '#cfc4a8', fontFamily: 'sans-serif',
      fontSize: '13px', background: 'rgba(20,16,12,0.95)',
      minHeight: '20px',
    });
    this.hint.textContent = 'Klik jednostke (zlota), klik heks = ruch, klik wroga obok = atak. WASD/przeciaganie = kamera, kolko = zoom.';
    this.overlay.appendChild(this.hint);

    document.body.appendChild(this.overlay);

    // ---- Renderer / scena ----
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12100e);
    this.scene.fog = new THREE.FogExp2(0x12100e, 0.010);
    this.scene.add(this.highlightGroup);

    // ---- Kamera ----
    const midQ = (this.cols - 1) / 2;
    const midR = (this.rows - 1) / 2;
    const { x: cx, z: cz } = axialToWorld(midQ, midR, MB_R);
    const worldW = MB_R * SQRT3 * this.cols;
    const worldH = MB_R * 1.5 * this.rows;
    const span   = Math.max(worldW, worldH);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 600);
    this.cam = new BattleCamera(
      this.camera, this.canvas,
      { x: cx, z: cz },
      span * 0.75,            // poczatkowa odleglosc
      MB_R * 4,               // min zoom
      span * 1.6,             // max zoom
    );

    // ---- Swiatla ----
    this.scene.add(new THREE.AmbientLight(0xfff8e0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5c0, 1.25);
    sun.position.set(span * 0.4, span * 0.9, -span * 0.3);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far  = span * 3;
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = -worldW; sc.right = worldW; sc.top = worldH; sc.bottom = -worldH;
    sc.updateProjectionMatrix();
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.30);
    fill.position.set(-span * 0.3, span * 0.4, span * 0.5);
    this.scene.add(fill);

    // ---- Budowa ----
    this._buildBoard();
    this._placeUnits(opts.player, opts.enemy);

    // ---- Eventy ----
    this.canvas.addEventListener('click', this._onCanvasClick);
    window.addEventListener('resize', this._onResize);
  }

  // ------------------------------------------------------------------------
  // Public API
  // ------------------------------------------------------------------------

  /** Uruchamia petle bitwy. onFinish wywolane gdy jedna ze stron zostanie wyeliminowana. */
  start(onFinish: (result: ManualBattleResult) => void): void {
    if (this.started) return;
    this.started = true;
    this.onFinishCb = onFinish;
    this.phase = 'player';
    this._beginPlayerTurn();
    this._startLoop();
  }

  dispose(): void {
    this.finished = true;
    if (this.animFrameId !== null) { cancelAnimationFrame(this.animFrameId); this.animFrameId = null; }

    this.canvas.removeEventListener('click', this._onCanvasClick);
    window.removeEventListener('resize', this._onResize);
    this.cam.dispose();

    for (const fl of this.floatLabels) { if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem); }
    this.floatLabels = [];

    for (const ru of [...this.players, ...this.enemies]) {
      for (const m of ru.mats) m.dispose();
      for (const g of ru.perTokenGeos) g.dispose();
    }
    for (const g of this.highlightGeos) g.dispose();
    for (const m of this.highlightMats) m.dispose();
    for (const g of this.ownedGeos) g.dispose();
    for (const m of this.ownedMats) m.dispose();
    this.renderer.dispose();

    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
  }

  // ------------------------------------------------------------------------
  // Budowa planszy -- TAK SAMO jak scene.ts: CylinderGeometry(R*0.998,R*0.998,h,6) bez rotateY
  // ------------------------------------------------------------------------

  private _buildBoard(): void {
    const floorColor = terrainFloorColor(this.teren);
    const hexGeo = new THREE.CylinderGeometry(MB_R * 0.998, MB_R * 0.998, TILE_H, 6, 1);
    this.ownedGeos.push(hexGeo);

    for (let q = 0; q < this.cols; q++) {
      for (let r = 0; r < this.rows; r++) {
        // delikatna szachownica dla czytelnosci heksow
        const tint = ((q + r) % 2 === 0) ? 0.0 : 0.05;
        const col  = lighten(floorColor, tint);
        const mat  = new THREE.MeshLambertMaterial({ color: col });
        this.ownedMats.push(mat);

        const mesh = new THREE.Mesh(hexGeo, mat);
        const { x, z } = axialToWorld(q, r, MB_R);
        mesh.position.set(x, -TILE_H * 0.5, z); // gorna sciana na y=0
        mesh.receiveShadow = true;
        mesh.userData['q'] = q;
        mesh.userData['r'] = r;
        // BEZ rotacji -- CylinderGeometry(6) jest juz pointy-top.
        this.scene.add(mesh);
        this.tileMeshes.push(mesh);
        const key = hexKey(q, r);
        this.tileByKey.set(key, mesh);
        this.baseTileColor.set(key, col);
      }
    }

    // Podloga pod plansza (cien / glebia)
    const midQ = (this.cols - 1) / 2;
    const midR = (this.rows - 1) / 2;
    const { x: mx, z: mz } = axialToWorld(midQ, midR, MB_R);
    const worldW = MB_R * SQRT3 * this.cols;
    const worldH = MB_R * 1.5 * this.rows;
    const gGeo = new THREE.PlaneGeometry(worldW * 1.6, worldH * 1.6);
    const gMat = new THREE.MeshLambertMaterial({ color: 0x0a0908 });
    this.ownedGeos.push(gGeo); this.ownedMats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(mx, -0.14, mz);
    ground.receiveShadow = true;
    this.scene.add(ground);

    // Paski stron (lewo = gracz, prawo = wrog)
    const stripH = worldH * 0.9;
    const mkStrip = (color: number, xPos: number) => {
      const sg = new THREE.BoxGeometry(0.12, 0.6, stripH);
      const sm = new THREE.MeshLambertMaterial({ color });
      this.ownedGeos.push(sg); this.ownedMats.push(sm);
      const m = new THREE.Mesh(sg, sm);
      m.position.set(xPos, 0.2, mz);
      this.scene.add(m);
    };
    mkStrip(0x2f80ff, axialToWorld(-1, midR, MB_R).x - MB_R * 0.4);
    mkStrip(0xff3030, axialToWorld(this.cols, midR, MB_R).x + MB_R * 0.4);
  }

  // ------------------------------------------------------------------------
  // Rozmieszczenie jednostek (gracz po lewej, wrog po prawej)
  // ------------------------------------------------------------------------

  private _placeUnits(players: BattleUnit[], enemies: BattleUnit[]): void {
    const place = (
      units: BattleUnit[],
      side:  'player' | 'enemy',
      qBase: number,
      qStep: number,
      facingRight: boolean,
    ): RuntimeUnit[] =>
      units.map((bu, idx) => {
        // Ustaw w kolumnie (qBase, qBase+qStep) i rozlozonych wierszach wokol srodka
        const perCol = this.rows;
        const colIdx = Math.floor(idx / perCol);
        const rowIdx = idx % perCol;
        const q = qBase + colIdx * qStep;
        let r = Math.floor((this.rows - Math.min(units.length, perCol)) / 2) + rowIdx;
        r = Math.max(0, Math.min(this.rows - 1, r));

        // jesli zajete, znajdz najblizszy wolny
        let key = hexKey(q, r);
        if (this.occByKey.has(key)) {
          for (let rr = 0; rr < this.rows; rr++) {
            const k2 = hexKey(q, rr);
            if (!this.occByKey.has(k2)) { r = rr; key = k2; break; }
          }
        }

        const { x, z } = axialToWorld(q, r, MB_R);

        let group: THREE.Group;
        try { group = buildUnitModel(bu.kategoria, bu.ownerColor); }
        catch (_) { group = makeFallbackAvatar(bu.ownerColor); }
        group.position.set(x, UNIT_Y, z);
        if (!facingRight) group.rotation.y = Math.PI;
        this.scene.add(group);

        const mats         = (group.userData['mats']         as THREE.Material[])      ?? [];
        const perTokenGeos = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

        const { hpBarGroup, hpBarFg, hpBarBg } = makeHpBar();
        hpBarGroup.position.set(x, UNIT_Y + HPBAR_Y, z);
        this.scene.add(hpBarGroup);

        const ru: RuntimeUnit = {
          bu, group, hpBarGroup, hpBarFg, hpBarBg,
          q, r, side,
          dead: false, fadingOut: false, fadeStart: 0,
          acted: false, moveLeft: movementPoints(bu),
          facingRight, mats, perTokenGeos,
        };
        this.occByKey.set(key, ru);
        return ru;
      });

    // gracz: lewe kolumny; wrog: prawe kolumny
    this.players = place(players, 'player', 1, 1, true);
    this.enemies = place(enemies, 'enemy', this.cols - 2, -1, false);
  }

  // ------------------------------------------------------------------------
  // Petla renderowania
  // ------------------------------------------------------------------------

  private _startLoop(): void {
    const loop = (t: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      this._syncRendererSize();
      this.cam.update();
      this._tickFades(t);
      this._tickFloatLabels(t);
      for (const ru of [...this.players, ...this.enemies]) {
        if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
      }
      if (this.selectRing) this.selectRing.rotation.z += 0.02;
      this.renderer.render(this.scene, this.camera);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private _syncRendererSize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (this.renderer.domElement.width !== w || this.renderer.domElement.height !== h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  private readonly _onResize = (): void => { this._syncRendererSize(); };

  // ------------------------------------------------------------------------
  // Klikanie planszy: wybor jednostki / ruch / atak
  // ------------------------------------------------------------------------

  private readonly _onCanvasClick = (e: MouseEvent): void => {
    if (this.finished) return;
    if (this.cam.consumedDrag()) return;      // to bylo przeciaganie kamery, nie klik
    if (this.phase !== 'player') return;      // tura wroga / animacja -- ignoruj

    const hit = this._pickHex(e);
    if (!hit) return;
    const { q, r } = hit;
    const key = hexKey(q, r);
    const occupant = this.occByKey.get(key) ?? null;

    // 1) klik wlasnej, zdolnej do dzialania jednostki -> wybierz
    if (occupant && occupant.side === 'player' && !occupant.dead) {
      this._select(occupant);
      return;
    }

    // 2) mamy wybrana jednostke?
    if (this.selected && !this.selected.acted) {
      const sel = this.selected;

      // 2a) klik wroga obok -> atak
      if (occupant && occupant.side === 'enemy' && !occupant.dead) {
        const d = hexDistance(sel.q, sel.r, occupant.q, occupant.r);
        if (d === 1) {
          this._doAttack(sel, occupant, () => {
            this._afterPlayerAction();
          });
        } else {
          this.hint.textContent = 'Wrog poza zasiegiem -- podejdz na sasiedni heks.';
        }
        return;
      }

      // 2b) klik pustego heksu w zasiegu -> ruch
      if (!occupant && this.reachable.has(key)) {
        const cost = this.reachable.get(key) ?? 0;
        this._doMove(sel, q, r, cost, () => {
          // po ruchu: jesli zostaly punkty i obok jest wrog, gracz moze jeszcze atakowac
          this._select(sel); // odswiez podswietlenia
          if (sel.moveLeft <= 0 && !this._hasAdjacentEnemy(sel)) {
            sel.acted = true;
            this._afterPlayerAction();
          }
        });
        return;
      }
    }

    // klik gdzie indziej -> odznacz
    this._deselect();
  };

  /** Rzut promienia z ekranu na kafelki; zwraca (q,r) trafionego heksu. */
  private _pickHex(e: MouseEvent): { q: number; r: number } | null {
    const rect = this.canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1,
    );
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.tileMeshes, false);
    if (hits.length === 0) return null;
    const obj = hits[0]!.object;
    const q = obj.userData['q'];
    const r = obj.userData['r'];
    if (typeof q !== 'number' || typeof r !== 'number') return null;
    return { q, r };
  }

  // ------------------------------------------------------------------------
  // Wybor jednostki + podswietlenia
  // ------------------------------------------------------------------------

  private _select(ru: RuntimeUnit): void {
    this.selected = ru;
    this._computeReachable(ru);
    this._renderHighlights(ru);
    const adj = this._hasAdjacentEnemy(ru);
    this.hint.textContent =
      ru.bu.nazwa + ' -- ruch: ' + ru.moveLeft + ' hex' +
      (adj ? '  | wrog obok: kliknij go aby ATAKOWAC.' : '  | podejdz do wroga aby zaatakowac.');
  }

  private _deselect(): void {
    this.selected = null;
    this.reachable.clear();
    this._clearHighlights();
  }

  /** BFS po heksach w zasiegu punktow ruchu (puste, w granicach). */
  private _computeReachable(ru: RuntimeUnit): void {
    this.reachable.clear();
    if (ru.moveLeft <= 0) return;
    const start = hexKey(ru.q, ru.r);
    const frontier: Array<{ q: number; r: number; cost: number }> = [{ q: ru.q, r: ru.r, cost: 0 }];
    const visited = new Map<string, number>();
    visited.set(start, 0);
    while (frontier.length > 0) {
      const cur = frontier.shift()!;
      if (cur.cost >= ru.moveLeft) continue;
      for (const [dq, dr] of HEX_DIRS) {
        const nq = cur.q + dq;
        const nr = cur.r + dr;
        if (nq < 0 || nq >= this.cols || nr < 0 || nr >= this.rows) continue;
        const nk = hexKey(nq, nr);
        const nextCost = cur.cost + 1;
        if (this.occByKey.has(nk)) continue;          // zajete -- nie wchodzimy
        if (visited.has(nk) && (visited.get(nk) ?? 0) <= nextCost) continue;
        visited.set(nk, nextCost);
        this.reachable.set(nk, nextCost);
        frontier.push({ q: nq, r: nr, cost: nextCost });
      }
    }
  }

  private _hasAdjacentEnemy(ru: RuntimeUnit): boolean {
    for (const [dq, dr] of HEX_DIRS) {
      const occ = this.occByKey.get(hexKey(ru.q + dq, ru.r + dr));
      if (occ && occ.side !== ru.side && !occ.dead) return true;
    }
    return false;
  }

  private _adjacentEnemies(ru: RuntimeUnit): RuntimeUnit[] {
    const out: RuntimeUnit[] = [];
    for (const [dq, dr] of HEX_DIRS) {
      const occ = this.occByKey.get(hexKey(ru.q + dq, ru.r + dr));
      if (occ && occ.side !== ru.side && !occ.dead) out.push(occ);
    }
    return out;
  }

  // ---- Podswietlenia jako cienkie cylindry nad kafelkami ----

  private _clearHighlights(): void {
    for (const child of [...this.highlightGroup.children]) this.highlightGroup.remove(child);
    for (const g of this.highlightGeos) g.dispose();
    for (const m of this.highlightMats) m.dispose();
    this.highlightGeos = [];
    this.highlightMats = [];
    this.selectRing = null;
  }

  private _renderHighlights(ru: RuntimeUnit): void {
    this._clearHighlights();

    const diskGeo = new THREE.CylinderGeometry(MB_R * 0.86, MB_R * 0.86, 0.02, 6, 1);
    this.highlightGeos.push(diskGeo);

    // zasieg ruchu
    for (const key of this.reachable.keys()) {
      const [q, r] = key.split(',').map(Number);
      const { x, z } = axialToWorld(q!, r!, MB_R);
      const mat = new THREE.MeshBasicMaterial({ color: COLOR_MOVE_HL, transparent: true, opacity: 0.30 });
      this.highlightMats.push(mat);
      const m = new THREE.Mesh(diskGeo, mat);
      m.position.set(x, 0.012, z);
      this.highlightGroup.add(m);
    }

    // mozliwe cele ataku
    for (const en of this._adjacentEnemies(ru)) {
      const { x, z } = axialToWorld(en.q, en.r, MB_R);
      const mat = new THREE.MeshBasicMaterial({ color: COLOR_ATTACK_HL, transparent: true, opacity: 0.45 });
      this.highlightMats.push(mat);
      const m = new THREE.Mesh(diskGeo, mat);
      m.position.set(x, 0.014, z);
      this.highlightGroup.add(m);
    }

    // pierscien wokol wybranej jednostki
    const ringGeo = new THREE.TorusGeometry(MB_R * 0.55, 0.04, 8, 24);
    this.highlightGeos.push(ringGeo);
    const ringMat = new THREE.MeshBasicMaterial({ color: COLOR_SELECT_HL });
    this.highlightMats.push(ringMat);
    const ring = new THREE.Mesh(ringGeo, ringMat);
    const { x: sx, z: sz } = axialToWorld(ru.q, ru.r, MB_R);
    ring.position.set(sx, 0.05, sz);
    ring.rotation.x = -Math.PI / 2;
    this.highlightGroup.add(ring);
    this.selectRing = ring;
  }

  // ------------------------------------------------------------------------
  // Ruch jednostki (animowany, krok po heksie wzdluz prostej linii)
  // ------------------------------------------------------------------------

  private _doMove(ru: RuntimeUnit, q: number, r: number, cost: number, done: () => void): void {
    const oldKey = hexKey(ru.q, ru.r);
    const newKey = hexKey(q, r);
    this.occByKey.delete(oldKey);
    this.occByKey.set(newKey, ru);

    this.phase = 'anim';
    this._clearHighlights();

    const from = axialToWorld(ru.q, ru.r, MB_R);
    const to   = axialToWorld(q, r, MB_R);
    // zwroc jednostke w kierunku ruchu (lewo/prawo)
    if (to.x > from.x + 0.001) ru.group.rotation.y = 0;
    else if (to.x < from.x - 0.001) ru.group.rotation.y = Math.PI;

    ru.q = q; ru.r = r;
    ru.moveLeft = Math.max(0, ru.moveLeft - cost);

    const dur = Math.max(MOVE_STEP_MS, MOVE_STEP_MS * cost);
    const t0 = performance.now();
    const step = () => {
      if (this.finished) return;
      const p = Math.min(1, (performance.now() - t0) / dur);
      const e = easeOut(p);
      const x = lerp(from.x, to.x, e);
      const z = lerp(from.z, to.z, e);
      const hop = Math.sin(p * Math.PI) * 0.12; // lekki podskok
      ru.group.position.set(x, UNIT_Y + hop, z);
      ru.hpBarGroup.position.set(x, UNIT_Y + HPBAR_Y, z);
      if (p < 1) { requestAnimationFrame(step); }
      else {
        ru.group.position.set(to.x, UNIT_Y, to.z);
        ru.hpBarGroup.position.set(to.x, UNIT_Y + HPBAR_Y, to.z);
        this.phase = 'player';
        done();
      }
    };
    requestAnimationFrame(step);
  }

  // ------------------------------------------------------------------------
  // Atak: resolveCombat (SS5l) + animacja cios-za-cios (jak battleScene)
  // ------------------------------------------------------------------------

  private _doAttack(attacker: RuntimeUnit, defender: RuntimeUnit, done: () => void): void {
    this.phase = 'anim';
    this._clearHighlights();

    // ustaw na siebie
    const aw = axialToWorld(attacker.q, attacker.r, MB_R);
    const dw = axialToWorld(defender.q, defender.r, MB_R);
    attacker.group.rotation.y = (dw.x >= aw.x) ? 0 : Math.PI;
    defender.group.rotation.y = (aw.x >  dw.x) ? 0 : Math.PI;

    const cuA = toCombatUnit(attacker.bu, this.armyHungerStatMult);
    const cuD = toCombatUnit(defender.bu, this.armyHungerStatMult);
    const result: CombatResult = resolveCombat(cuA, cuD, {
      maxRounds: 30,
      attackerMoved: true,
      defenderTerrain: this.teren,
      terrainData: this.terrainData,
      counters: this.counters,
      attackerCivBonusy: this.attackerCivBonusy,
      defenderCivBonusy: this.defenderCivBonusy,
      attackerBuildingBonus: { pancerz: attacker.bu.pancerzBonusFrac ?? 0, other: attacker.bu.parametryBonusFrac ?? 0 },
      defenderBuildingBonus: { pancerz: defender.bu.pancerzBonusFrac ?? 0, other: defender.bu.parametryBonusFrac ?? 0 },
    });

    this.log.push(
      attacker.bu.nazwa + ' atakuje ' + defender.bu.nazwa + ' -> ' +
      (result.winner === 'attacker' ? 'wygrana' : result.winner === 'defender' ? 'przegrana' : 'remis'),
    );

    const atkStartHp = attacker.bu.hp;
    const defStartHp = defender.bu.hp;
    const atkLoss = Math.max(0, atkStartHp - result.attackerHpLeft);
    const defLoss = Math.max(0, defStartHp - result.defenderHpLeft);
    const visRounds = Math.min(MAX_VIS_ROUNDS, Math.max(1, result.rounds));

    const aHome = new THREE.Vector3(aw.x, UNIT_Y, aw.z);
    const dHome = new THREE.Vector3(dw.x, UNIT_Y, dw.z);
    const midX = (aw.x + dw.x) * 0.5;
    const midZ = (aw.z + dw.z) * 0.5;
    const aLunge = { x: aw.x + (midX - aw.x) * 0.6, z: aw.z + (midZ - aw.z) * 0.6 };
    const dLunge = { x: dw.x + (midX - dw.x) * 0.6, z: dw.z + (midZ - dw.z) * 0.6 };

    let currentRound = 0;
    const t0 = performance.now();

    const applyRoundDamage = (rIdx: number) => {
      const perA = Math.floor(atkLoss / visRounds);
      const aDmg = rIdx < visRounds ? perA : atkLoss - perA * (visRounds - 1);
      const perD = Math.floor(defLoss / visRounds);
      const dDmg = rIdx < visRounds ? perD : defLoss - perD * (visRounds - 1);
      if (!attacker.dead && !attacker.fadingOut && aDmg > 0) {
        attacker.bu.hp = Math.max(0, attacker.bu.hp - aDmg);
        this._updateHpBar(attacker);
        this._spawnDamageLabel(attacker, aDmg);
      }
      if (!defender.dead && !defender.fadingOut && dDmg > 0) {
        defender.bu.hp = Math.max(0, defender.bu.hp - dDmg);
        this._updateHpBar(defender);
        this._spawnDamageLabel(defender, dDmg);
      }
    };

    const setPos = (ru: RuntimeUnit, home: THREE.Vector3, x: number, z: number) => {
      ru.group.position.set(x, home.y, z);
      ru.hpBarGroup.position.set(x, home.y + HPBAR_Y, z);
    };

    const animStep = () => {
      if (this.finished) return;
      const localT = performance.now() - t0;
      const roundsDone = Math.floor(localT / VIS_ROUND_MS);

      while (currentRound < roundsDone && currentRound < visRounds) {
        currentRound++;
        applyRoundDamage(currentRound);
      }

      if (currentRound < visRounds) {
        const rt = localT - currentRound * VIS_ROUND_MS;
        // pierwsza polowa: atakujacy wypada i wraca
        if (!attacker.dead && !attacker.fadingOut) {
          let ax = aHome.x, az = aHome.z;
          if (rt < LUNGE_MS) { const p = rt / LUNGE_MS; ax = lerp(aHome.x, aLunge.x, easeOut(p)); az = lerp(aHome.z, aLunge.z, easeOut(p)); }
          else if (rt < LUNGE_MS + RECOIL_MS) { const p = (rt - LUNGE_MS) / RECOIL_MS; ax = lerp(aLunge.x, aHome.x, easeIn(p)); az = lerp(aLunge.z, aHome.z, easeIn(p)); }
          setPos(attacker, aHome, ax, az);
        }
        // druga polowa: obronca wypada i wraca
        if (!defender.dead && !defender.fadingOut) {
          const rt2 = rt - HALF_MS;
          let dx = dHome.x, dz = dHome.z;
          if (rt2 >= 0 && rt2 < LUNGE_MS) { const p = rt2 / LUNGE_MS; dx = lerp(dHome.x, dLunge.x, easeOut(p)); dz = lerp(dHome.z, dLunge.z, easeOut(p)); }
          else if (rt2 >= LUNGE_MS && rt2 < LUNGE_MS + RECOIL_MS) { const p = (rt2 - LUNGE_MS) / RECOIL_MS; dx = lerp(dLunge.x, dHome.x, easeIn(p)); dz = lerp(dLunge.z, dHome.z, easeIn(p)); }
          setPos(defender, dHome, dx, dz);
        }
        requestAnimationFrame(animStep);
      } else {
        // koniec: wroc do domu, dosuniecie HP do dokladnych wartosci, ew. smierc
        if (!attacker.dead && !attacker.fadingOut) setPos(attacker, aHome, aHome.x, aHome.z);
        if (!defender.dead && !defender.fadingOut) setPos(defender, dHome, dHome.x, dHome.z);

        attacker.bu.hp = Math.max(0, result.attackerHpLeft);
        defender.bu.hp = Math.max(0, result.defenderHpLeft);
        this._updateHpBar(attacker);
        this._updateHpBar(defender);

        if (!attacker.dead && (attacker.bu.hp <= 0 || result.routed.includes('attacker'))) {
          this.log.push('  -> ' + attacker.bu.nazwa + ' wyeliminowany');
          this._startFade(attacker);
        }
        if (!defender.dead && (defender.bu.hp <= 0 || result.routed.includes('defender'))) {
          this.log.push('  -> ' + defender.bu.nazwa + ' wyeliminowany');
          this._startFade(defender);
        }

        attacker.acted = true; // atak konczy ture jednostki
        this.phase = 'player';
        done();
      }
    };
    requestAnimationFrame(animStep);
  }

  private _updateHpBar(ru: RuntimeUnit): void {
    const ratio = Math.max(0, Math.min(1, ru.bu.hp / ru.bu.maxHp));
    ru.hpBarFg.scale.x    = ratio;
    ru.hpBarFg.position.x = (ratio - 1) * HPBAR_W * 0.5;
    let color: number;
    if (ratio > 0.60) color = 0x30c030;
    else if (ratio > 0.30) color = 0xd0a020;
    else color = 0xd02020;
    (ru.hpBarFg.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  private _spawnDamageLabel(ru: RuntimeUnit, dmg: number): void {
    const el = document.createElement('div');
    el.textContent = '-' + dmg;
    Object.assign(el.style, {
      position: 'absolute', pointerEvents: 'none', color: '#ff4444',
      fontFamily: 'sans-serif', fontSize: '15px', fontWeight: 'bold',
      textShadow: '0 0 6px #000, 1px 1px 2px #000', whiteSpace: 'nowrap',
      transform: 'translate(-50%, -50%)', zIndex: '10010',
    });
    this.overlay.appendChild(el);
    const wp = axialToWorld(ru.q, ru.r, MB_R);
    this.floatLabels.push({
      elem: el, startTime: performance.now(), duration: 900,
      worldPos: new THREE.Vector3(wp.x, UNIT_Y + HPBAR_Y + 0.20, wp.z),
      riseRate: 0.0006,
    });
  }

  private _tickFloatLabels(t: number): void {
    this.floatLabels = this.floatLabels.filter(fl => {
      const age = t - fl.startTime;
      const p = Math.min(1, age / fl.duration);
      if (p >= 1) { if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem); return false; }
      const wp = fl.worldPos.clone();
      wp.y += age * fl.riseRate;
      const sp = worldToScreen(wp, this.camera, this.canvas);
      if (sp) {
        fl.elem.style.left = sp.x + 'px';
        fl.elem.style.top  = sp.y + 'px';
        fl.elem.style.opacity = String(1 - p * p);
      }
      return true;
    });
  }

  // ------------------------------------------------------------------------
  // Smierc / zanikanie
  // ------------------------------------------------------------------------

  private _startFade(ru: RuntimeUnit): void {
    ru.fadingOut = true;
    ru.fadeStart = performance.now();
    this.fadingUnits.push(ru);
    this.occByKey.delete(hexKey(ru.q, ru.r));
  }

  private _tickFades(t: number): void {
    if (this.fadingUnits.length === 0) return;
    this.fadingUnits = this.fadingUnits.filter(ru => {
      const p = Math.min(1, (t - ru.fadeStart) / DEATH_FADE_MS);
      for (const m of ru.mats) {
        (m as any).transparent = true;
        (m as any).opacity = 1 - p;
      }
      ru.group.scale.setScalar(1 - p * 0.6);
      if (p >= 1) {
        ru.dead = true;
        ru.group.visible = false;
        ru.hpBarGroup.visible = false;
        return false;
      }
      return true;
    });
  }

  // ------------------------------------------------------------------------
  // Tury
  // ------------------------------------------------------------------------

  private _beginPlayerTurn(): void {
    this.phase = 'player';
    for (const ru of this.players) {
      if (!ru.dead) { ru.acted = false; ru.moveLeft = movementPoints(ru.bu); }
    }
    this.hint.textContent = 'Twoja tura -- klik jednostke (zlota), potem heks (ruch) lub wroga obok (atak). "Zakoncz ture" konczy.';
  }

  /** Po kazdej akcji gracza: sprawdz koniec bitwy; jesli wszystkie dzialaly -> tura wroga. */
  private _afterPlayerAction(): void {
    this._deselect();
    if (this._checkEnd()) return;
    const anyLeft = this.players.some(ru => !ru.dead && !ru.acted);
    if (!anyLeft) this._endPlayerTurn();
  }

  private _endPlayerTurn(): void {
    if (this.phase !== 'player') return;
    this._deselect();
    if (this._checkEnd()) return;
    this._runEnemyTurn();
  }

  /** Prosty AI wroga: kazda jednostka, jesli ma wroga obok -> atak; inaczej krok ku najblizszemu. */
  private _runEnemyTurn(): void {
    this.phase = 'enemy';
    this.hint.textContent = 'Tura wroga...';
    for (const ru of this.enemies) if (!ru.dead) { ru.acted = false; ru.moveLeft = movementPoints(ru.bu); }

    const queue = this.enemies.filter(ru => !ru.dead);
    let i = 0;

    const nextUnit = () => {
      if (this.finished) return;
      if (this._checkEnd()) return;
      // znajdz nastepna zywa, nie-dzialajaca jednostke
      while (i < queue.length && (queue[i]!.dead || queue[i]!.acted)) i++;
      if (i >= queue.length) { this._beginPlayerTurn(); return; }
      const ru = queue[i]!;
      this._enemyAct(ru, () => { i++; nextUnit(); });
    };
    nextUnit();
  }

  /** Pojedyncza akcja jednostki AI: atak jesli wrog obok, inaczej ruch ku celowi. */
  private _enemyAct(ru: RuntimeUnit, done: () => void): void {
    if (ru.dead) { done(); return; }

    // 1) atak jesli wrog obok
    const adj = this._adjacentEnemies(ru);
    if (adj.length > 0) {
      // wybierz cel o najnizszym HP
      adj.sort((a, b) => a.bu.hp - b.bu.hp);
      this._doAttack(ru, adj[0]!, () => done());
      return;
    }

    // 2) inaczej znajdz najblizszego wroga (gracza) i podejdz
    const target = this._nearestEnemyOf(ru);
    if (!target) { ru.acted = true; done(); return; }

    const stepKey = this._stepToward(ru, target);
    if (!stepKey) { ru.acted = true; done(); return; }
    const [nq, nr] = stepKey.split(',').map(Number);
    // koszt = 1 heks na krok; ruch do tylu az do wyczerpania punktow lub dojscia
    this._doMove(ru, nq!, nr!, 1, () => {
      // po kroku: jesli teraz wrog obok i zostaly punkty traktowane jako akcja -> atak
      const adj2 = this._adjacentEnemies(ru);
      if (adj2.length > 0) {
        adj2.sort((a, b) => a.bu.hp - b.bu.hp);
        this._doAttack(ru, adj2[0]!, () => done());
      } else if (ru.moveLeft > 0) {
        // kontynuuj zblizanie w tej samej turze
        this._enemyContinueMove(ru, target, done);
      } else {
        ru.acted = true; done();
      }
    });
  }

  private _enemyContinueMove(ru: RuntimeUnit, target: RuntimeUnit, done: () => void): void {
    if (ru.moveLeft <= 0 || ru.dead) { ru.acted = true; done(); return; }
    const stepKey = this._stepToward(ru, target);
    if (!stepKey) { ru.acted = true; done(); return; }
    const [nq, nr] = stepKey.split(',').map(Number);
    this._doMove(ru, nq!, nr!, 1, () => {
      const adj = this._adjacentEnemies(ru);
      if (adj.length > 0) {
        adj.sort((a, b) => a.bu.hp - b.bu.hp);
        this._doAttack(ru, adj[0]!, () => done());
      } else if (ru.moveLeft > 0) {
        this._enemyContinueMove(ru, target, done);
      } else {
        ru.acted = true; done();
      }
    });
  }

  private _nearestEnemyOf(ru: RuntimeUnit): RuntimeUnit | null {
    const foes = (ru.side === 'enemy' ? this.players : this.enemies).filter(u => !u.dead);
    let best: RuntimeUnit | null = null;
    let bestD = Infinity;
    for (const f of foes) {
      const d = hexDistance(ru.q, ru.r, f.q, f.r);
      if (d < bestD) { bestD = d; best = f; }
    }
    return best;
  }

  /** Zwraca klucz sasiedniego, wolnego heksu, ktory najbardziej zbliza do celu. */
  private _stepToward(ru: RuntimeUnit, target: RuntimeUnit): string | null {
    let best: string | null = null;
    let bestD = hexDistance(ru.q, ru.r, target.q, target.r);
    for (const [dq, dr] of HEX_DIRS) {
      const nq = ru.q + dq;
      const nr = ru.r + dr;
      if (nq < 0 || nq >= this.cols || nr < 0 || nr >= this.rows) continue;
      const nk = hexKey(nq, nr);
      if (this.occByKey.has(nk)) continue;
      const d = hexDistance(nq, nr, target.q, target.r);
      if (d < bestD) { bestD = d; best = nk; }
    }
    return best;
  }

  // ------------------------------------------------------------------------
  // Koniec bitwy
  // ------------------------------------------------------------------------

  private _checkEnd(): boolean {
    if (this.finished) return true;
    const playersAlive = this.players.some(ru => !ru.dead && !ru.fadingOut);
    const enemiesAlive = this.enemies.some(ru => !ru.dead && !ru.fadingOut);
    if (playersAlive && enemiesAlive) return false;

    this.phase = 'done';
    const winner: ManualBattleResult['winner'] =
      playersAlive && !enemiesAlive ? 'gracz' :
      enemiesAlive && !playersAlive ? 'wrog'  : 'remis';

    const survivors = (winner === 'gracz' ? this.players : winner === 'wrog' ? this.enemies : [])
      .filter(ru => !ru.dead).map(ru => ru.bu);

    this.log.push('=== KONIEC: ' + winner.toUpperCase() + ' ===');
    this._showBanner(winner);

    // krotka pauza, zanim oddamy kontrole
    window.setTimeout(() => {
      if (this.onFinishCb) this.onFinishCb({ winner, survivors, log: this.log.slice() });
    }, 1600);
    return true;
  }

  private _showBanner(winner: ManualBattleResult['winner']): void {
    const banner = document.createElement('div');
    const txt = winner === 'gracz' ? 'ZWYCIESTWO!' : winner === 'wrog' ? 'PORAZKA' : 'REMIS';
    const col = winner === 'gracz' ? '#5fd07a' : winner === 'wrog' ? '#e05050' : '#d0c070';
    banner.textContent = txt;
    Object.assign(banner.style, {
      position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
      color: col, fontFamily: 'sans-serif', fontSize: '54px', fontWeight: 'bold',
      textShadow: '0 0 18px #000, 0 2px 6px #000', pointerEvents: 'none', zIndex: '10020',
    });
    this.overlay.appendChild(banner);
  }
}

// ===========================================================================
// Self-test (lekki -- nie wymaga WebGL): sprawdza geometrie heksow i BFS.
// ===========================================================================

export function selfTest(): boolean {
  // axial distance
  const ok1 = hexDistance(0, 0, 2, 0) === 2 && hexDistance(0, 0, 0, 2) === 2;
  // sasiedztwo: kazdy z 6 kierunkow ma dystans 1
  const ok2 = HEX_DIRS.every(([dq, dr]) => hexDistance(0, 0, dq, dr) === 1);
  // axialToWorld: sasiad (+1,0) odlegly o R*sqrt(3)
  const a = axialToWorld(0, 0, MB_R);
  const b = axialToWorld(1, 0, MB_R);
  const dist = Math.hypot(b.x - a.x, b.z - a.z);
  const ok3 = Math.abs(dist - MB_R * SQRT3) < 1e-9;
  return ok1 && ok2 && ok3;
}
