/**
 * battleScene.ts
 * Tactical 3D auto-battle overlay scene for The Game (SS5h: AI controls both
 * sides, player watches or skips).
 *
 * Renders a small flat hex battlefield over a full-window canvas overlay.
 * Attacker units are placed on the left side; defenders on the right.
 * A clock-driven loop advances units toward enemies, resolves individual
 * clashes with resolveCombat (SS5l), drains HP bars, and fades dead units.
 *
 * ASCII-only source file (Polish UI strings encoded via \uXXXX where needed).
 *
 * buildUnitModel IS exported from ../render/units -- confirmed at line 532.
 * If that ever changes, the try/catch in _placeUnits falls back to
 * makeFallbackAvatar (a plain box) without breaking compilation.
 *
 * Usage:
 *   const scene = new BattleScene({ attacker, defender, teren, data });
 *   scene.play((result) => { console.log(result.winner, result.log); });
 *   // or instant skip:
 *   scene.skip();
 */

import * as THREE from 'three';
import { resolveCombat } from '../game/combat';
import type { CombatUnit } from '../game/combat';
import { axialToWorld, HEX_R, SQRT3 } from '../render/hexutil';
import { buildUnitModel } from '../render/units';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BattleUnit {
  id: string;
  /** Display name (Polish chars fine; UTF-8 source is safe). */
  nazwa: string;
  /** Category string matching buildUnitModel keys (e.g. 'miecznik'). */
  kategoria: string;
  /** Hex colour integer, e.g. 0xe53935. */
  ownerColor: number;
  /** The units.json record (CombatUnit-compatible stats). */
  stats: any;
  hp: number;
  maxHp: number;
}

export interface BattleOpts {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  /** Terrain name for the battlefield colour, e.g. 'Laka', 'Wzgorza'. */
  teren: string;
  /** Raw game data object (passed through for future use). */
  data?: any;
  /** Called when the user clicks "Wyjście" without finishing the battle. */
  onCancel?: () => void;
}

export interface BattleResult {
  winner: 'atakujacy' | 'obronca';
  survivors: BattleUnit[];
  log: string[];
}

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

/** Columns of hexes per side of the battlefield. */
const FIELD_COLS = 5;
/** Rows of hexes per side. */
const FIELD_ROWS = 4;
/** Width of the neutral gap between the two armies (columns). */
const GAP_COLS   = 2;

/** Hex radius reused from hexutil. */
const BF_R = HEX_R;

/** Camera height and isometric z-offset. */
const CAM_Y    = 18;
const CAM_TILT_Z = -18 * Math.tan(THREE.MathUtils.degToRad(30));

/** Per-wave movement animation duration (ms). */
const MOVE_DURATION_MS = 600;
/** Pause between waves (ms). */
const WAVE_PAUSE_MS    = 300;
/** Fade-out duration for dead/routed units (ms). */
const DEATH_FADE_MS    = 450;

/** HP bar dimensions in world units. */
const HPBAR_W = 0.70;
const HPBAR_H = 0.07;
/** Height above unit base. */
const HPBAR_Y = 0.82;

// ---------------------------------------------------------------------------
// Terrain floor colours (normalised key lookup)
// ---------------------------------------------------------------------------

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

function terrainFloorColor(teren: string): number {
  // Strip diacritics, lowercase, remove whitespace for robust lookup
  const key = teren
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '');
  for (const [k, v] of Object.entries(TERRAIN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 0x6a9448; // default green
}

// ---------------------------------------------------------------------------
// Stat normaliser
// ---------------------------------------------------------------------------

function norm(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
  return isNaN(n) ? fallback : n;
}

/** Convert a BattleUnit into a CombatUnit snapshot for resolveCombat. */
function toCombatUnit(bu: BattleUnit): CombatUnit {
  const s: Record<string, unknown> = (bu.stats as Record<string, unknown>) ?? {};
  return {
    typNazwa:                    (s['Jednostka'] as string)       ?? bu.kategoria,
    rola:                        (s['Rola (linia)'] as string)    ?? 'Wrecz',
    Atak:                        norm(s['Atak'],                    5),
    Obrona:                      norm(s['Obrona'],                  5),
    Uderzenie:                   norm(s['Uderzenie'],               0),
    Pancerz:                     norm(s['Pancerz'],                 0),
    Przebicie:                   norm(s['Przebicie'],               0),
    Health:                      bu.hp,
    'Prog dezercji (% health)':  norm(s['Prog dezercji (% health)'], 0.25),
    'Atak dystansowy':           norm(s['Atak dystansowy'],         0),
    'Zasieg ataku (hex)':        (s['Zasieg ataku (hex)'] as (number | string | null)) ?? null,
    'Ilosc pociskow':            (s['Ilosc pociskow'] as (number | string | null))     ?? null,
    'Ruch w bitwie (heksy)':     (s['Ruch w bitwie (heksy)'] as (number | string | null)) ?? null,
    'Kara obrony z flanki (%)':  norm(s['Kara obrony z flanki (%)'], 50),
    'Kara obrony z tylu (%)':    norm(s['Kara obrony z tylu (%)'],   80),
  };
}

// ---------------------------------------------------------------------------
// Internal runtime unit data
// ---------------------------------------------------------------------------

interface RuntimeBattleUnit {
  bu: BattleUnit;
  group: THREE.Group;
  hpBarFg: THREE.Mesh;
  hpBarBg: THREE.Mesh;
  hpBarGroup: THREE.Group;
  position: THREE.Vector3;
  targetPosition: THREE.Vector3 | null;
  side: 'atk' | 'def';
  dead: boolean;
  fadingOut: boolean;
  fadeStart: number;
  mats: THREE.Material[];
  perTokenGeos: THREE.BufferGeometry[];
}

// ---------------------------------------------------------------------------
// BattleScene
// ---------------------------------------------------------------------------

export class BattleScene {
  // THREE
  private canvas:   HTMLCanvasElement;
  private overlay:  HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;

  // Units
  private atk: RuntimeBattleUnit[] = [];
  private def: RuntimeBattleUnit[] = [];

  // Resource tracking
  private ownedMats: THREE.Material[]       = [];
  private ownedGeos: THREE.BufferGeometry[] = [];

  // Animation
  private animFrameId: number | null = null;
  private started  = false;
  private finished = false;

  // Simulation
  private log:        string[]                               = [];
  private onFinishCb: ((r: BattleResult) => void) | null    = null;
  private onCancelCb: (() => void) | null                   = null;

  // Phase machine
  private phase:     'idle' | 'moving' | 'pause' | 'done' = 'idle';
  private phaseStart = 0;
  private movePairs: Array<{ atk: RuntimeBattleUnit; def: RuntimeBattleUnit }> = [];
  private fadingUnits: RuntimeBattleUnit[] = [];

  // -------------------------------------------------------------------------
  constructor(opts: BattleOpts) {
    this.onCancelCb = opts.onCancel ?? null;

    // --- Overlay ---
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position:        'fixed',
      inset:           '0',
      zIndex:          '9999',
      background:      'rgba(0,0,0,0.85)',
      display:         'flex',
      flexDirection:   'column',
      alignItems:      'center',
      justifyContent:  'flex-start',
    });
    document.body.appendChild(this.overlay);

    // --- Title ---
    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
      color:          '#f0d080',
      fontFamily:     'sans-serif',
      fontSize:       '18px',
      fontWeight:     'bold',
      padding:        '10px 20px 0',
      textAlign:      'center',
      textShadow:     '0 1px 4px #000',
      letterSpacing:  '0.04em',
    });
    // "Bitwa Automatyczna" -- teren name appended
    titleBar.textContent = 'Bitwa Automatyczna — ' + opts.teren;
    this.overlay.appendChild(titleBar);

    // --- Canvas ---
    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      flex:    '1',
      width:   '100%',
      display: 'block',
    });
    this.overlay.appendChild(this.canvas);

    // --- Button bar ---
    const btnBar = document.createElement('div');
    Object.assign(btnBar.style, {
      display: 'flex',
      gap:     '12px',
      padding: '8px 0 12px',
    });
    this.overlay.appendChild(btnBar);

    const btnSkip = document.createElement('button');
    // "Pomiń → wynik" = "Pomin -> wynik"
    btnSkip.textContent = 'Pomiń → wynik';
    styleButton(btnSkip, '#c08030', '#fff');
    btnSkip.onclick = () => { if (!this.finished) this.skip(); };
    btnBar.appendChild(btnSkip);

    const btnExit = document.createElement('button');
    // "Wyjście" = "Wyjscie"
    btnExit.textContent = 'Wyjście';
    styleButton(btnExit, '#8a2020', '#fff');
    btnExit.onclick = () => {
      this.dispose();
      if (this.onCancelCb) this.onCancelCb();
    };
    btnBar.appendChild(btnExit);

    // --- THREE renderer ---
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled  = true;
    this.renderer.shadowMap.type     = THREE.PCFSoftShadowMap;

    // --- Scene ---
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1510);
    this.scene.fog = new THREE.FogExp2(0x1a1510, 0.025);

    // --- Camera (isometric perspective) ---
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 200);
    const totalCols   = FIELD_COLS * 2 + GAP_COLS;
    const cx = axialToWorld(totalCols / 2, FIELD_ROWS / 2, BF_R).x;
    const cz = axialToWorld(totalCols / 2, FIELD_ROWS / 2, BF_R).z;
    this.camera.position.set(cx, CAM_Y, cz + CAM_TILT_Z);
    this.camera.lookAt(cx, 0, cz);

    // --- Lights ---
    this.scene.add(new THREE.AmbientLight(0xfff8e0, 0.50));
    const sun = new THREE.DirectionalLight(0xfff5c0, 1.2);
    sun.position.set(8, 16, -6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.35);
    fill.position.set(-6, 6, 10);
    this.scene.add(fill);

    // --- Battlefield ---
    this._buildBattlefield(opts.teren);

    // --- Units ---
    this._placeUnits(opts.attacker, opts.defender);

    // --- Resize ---
    window.addEventListener('resize', this._onResize);

    // --- Start loop ---
    this._startLoop();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Start the visual auto-battle.
   * onFinish is called once one side is eliminated.
   */
  play(onFinish: (result: BattleResult) => void): void {
    this.onFinishCb = onFinish;
    this.started    = true;
    this.phase      = 'idle';
    this._startNextWave(performance.now());
  }

  /**
   * Instantly resolve the battle (no animation) and call onFinish.
   */
  skip(): void {
    if (this.finished) return;
    this.finished = true;
    const result = computeInstantResult(
      this.atk.filter(u => !u.dead),
      this.def.filter(u => !u.dead),
    );
    this._showResultBanner(result.winner);
    // Give the banner 1.8 s to breathe before firing the callback
    setTimeout(() => {
      if (this.onFinishCb) this.onFinishCb(result);
    }, 1800);
  }

  /**
   * Tear down: remove overlay, dispose THREE resources, stop the loop.
   */
  dispose(): void {
    this.finished = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this._onResize);

    for (const ru of [...this.atk, ...this.def]) {
      for (const m of ru.mats) m.dispose();
      for (const g of ru.perTokenGeos) g.dispose();
    }
    for (const m of this.ownedMats) m.dispose();
    for (const g of this.ownedGeos) g.dispose();
    this.renderer.dispose();

    if (this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
  }

  // -------------------------------------------------------------------------
  // Private: battlefield
  // -------------------------------------------------------------------------

  private _buildBattlefield(teren: string): void {
    const floorColor = terrainFloorColor(teren);
    const totalCols  = FIELD_COLS * 2 + GAP_COLS;

    // Shared hex tile geometry (flat-top, 6-sided cylinder)
    const hexGeo = new THREE.CylinderGeometry(BF_R * 0.96, BF_R * 0.96, 0.12, 6, 1);
    this.ownedGeos.push(hexGeo);

    for (let c = 0; c < totalCols; c++) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        const isGap = c >= FIELD_COLS && c < FIELD_COLS + GAP_COLS;
        const col   = isGap ? 0x3a3020 : (c < FIELD_COLS ? floorColor : lighten(floorColor, 0.10));
        const mat   = new THREE.MeshLambertMaterial({ color: col });
        this.ownedMats.push(mat);

        const mesh = new THREE.Mesh(hexGeo, mat);
        const { x, z } = axialToWorld(c, r, BF_R);
        mesh.position.set(x, -0.06, z);
        mesh.receiveShadow = true;
        mesh.rotation.y    = Math.PI / 6; // pointy-top -> flat-top orientation
        this.scene.add(mesh);
      }
    }

    // Ground plane beneath hexes
    const gGeo = new THREE.PlaneGeometry(80, 60);
    const gMat = new THREE.MeshLambertMaterial({ color: 0x0e0d08 });
    this.ownedGeos.push(gGeo);
    this.ownedMats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    const midW = axialToWorld(totalCols / 2, FIELD_ROWS / 2, BF_R);
    ground.position.set(midW.x, -0.14, midW.z);
    this.scene.add(ground);

    // Side marker strips (coloured pillars at each flank)
    const mkStrip = (color: number, x: number) => {
      const sg = new THREE.BoxGeometry(0.10, 0.60, FIELD_ROWS * BF_R * SQRT3 * 0.55);
      const sm = new THREE.MeshLambertMaterial({ color });
      this.ownedGeos.push(sg);
      this.ownedMats.push(sm);
      const mesh = new THREE.Mesh(sg, sm);
      mesh.position.set(x, 0.20, axialToWorld(0, FIELD_ROWS / 2, BF_R).z);
      this.scene.add(mesh);
    };
    // Attacker = warm red strip, far left
    mkStrip(0xcc3010, axialToWorld(-1, 0, BF_R).x - BF_R * SQRT3 * 0.3);
    // Defender = cool blue strip, far right
    mkStrip(0x1040c0, axialToWorld(totalCols, 0, BF_R).x + BF_R * SQRT3 * 0.3);
  }

  // -------------------------------------------------------------------------
  // Private: place units
  // -------------------------------------------------------------------------

  private _placeUnits(attackers: BattleUnit[], defenders: BattleUnit[]): void {
    const place = (
      units: BattleUnit[],
      side: 'atk' | 'def',
      colStart: number,
      facingRight: boolean,
    ): RuntimeBattleUnit[] =>
      units.map((bu, idx) => {
        const col = colStart + (idx % FIELD_COLS);
        const row = Math.floor(idx / FIELD_COLS) % FIELD_ROWS;
        const { x, z } = axialToWorld(col, row, BF_R);
        const y = 0.12;

        let group: THREE.Group;
        try {
          group = buildUnitModel(bu.kategoria, bu.ownerColor);
        } catch (_) {
          group = makeFallbackAvatar(bu.ownerColor);
        }
        group.position.set(x, y, z);
        if (!facingRight) group.rotation.y = Math.PI;
        this.scene.add(group);

        const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
        const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

        const { hpBarGroup, hpBarFg, hpBarBg } = makeHpBar();
        hpBarGroup.position.set(x, y + HPBAR_Y, z);
        this.scene.add(hpBarGroup);

        return {
          bu,
          group,
          hpBarFg,
          hpBarBg,
          hpBarGroup,
          position:       new THREE.Vector3(x, y, z),
          targetPosition: null,
          side,
          dead:       false,
          fadingOut:  false,
          fadeStart:  0,
          mats,
          perTokenGeos,
        };
      });

    // Attackers on the left (columns 0..FIELD_COLS-1), face right (default +Z)
    this.atk = place(attackers, 'atk', 0, true);
    // Defenders on the right (columns FIELD_COLS+GAP_COLS..end), face left
    this.def = place(defenders, 'def', FIELD_COLS + GAP_COLS, false);
  }

  // -------------------------------------------------------------------------
  // Private: render loop
  // -------------------------------------------------------------------------

  private _startLoop(): void {
    const loop = (t: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      this._syncRendererSize();
      this._tick(t);
      // Billboard HP bars toward camera
      for (const ru of [...this.atk, ...this.def]) {
        if (!ru.dead) {
          ru.hpBarGroup.lookAt(this.camera.position);
        }
      }
      this.renderer.render(this.scene, this.camera);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  private _syncRendererSize(): void {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (
      this.renderer.domElement.width  !== w ||
      this.renderer.domElement.height !== h
    ) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  // -------------------------------------------------------------------------
  // Private: tick (phase machine)
  // -------------------------------------------------------------------------

  private _tick(t: number): void {
    if (!this.started || this.finished) return;

    // Process fading-out units
    for (const ru of this.fadingUnits) {
      const progress = Math.min(1, (t - ru.fadeStart) / DEATH_FADE_MS);
      const opacity  = 1 - progress;
      for (const m of ru.mats) {
        const lm = m as THREE.MeshLambertMaterial;
        lm.transparent = true;
        lm.opacity     = opacity;
      }
      ru.group.scale.setScalar(1 - progress * 0.5);
      if (progress >= 1) {
        ru.dead      = true;
        ru.fadingOut = false;
        ru.group.visible       = false;
        ru.hpBarGroup.visible  = false;
      }
    }
    this.fadingUnits = this.fadingUnits.filter(ru => ru.fadingOut);

    switch (this.phase) {
      case 'idle':
        break;

      case 'moving': {
        const progress = Math.min(1, (t - this.phaseStart) / MOVE_DURATION_MS);
        for (const { atk: a, def: d } of this.movePairs) {
          if (a.targetPosition) {
            a.group.position.lerpVectors(a.position, a.targetPosition, progress);
            a.hpBarGroup.position.lerpVectors(
              a.position.clone().add(new THREE.Vector3(0, HPBAR_Y, 0)),
              a.targetPosition.clone().add(new THREE.Vector3(0, HPBAR_Y, 0)),
              progress,
            );
          }
          if (d.targetPosition) {
            d.group.position.lerpVectors(d.position, d.targetPosition, progress);
            d.hpBarGroup.position.lerpVectors(
              d.position.clone().add(new THREE.Vector3(0, HPBAR_Y, 0)),
              d.targetPosition.clone().add(new THREE.Vector3(0, HPBAR_Y, 0)),
              progress,
            );
          }
        }
        if (progress >= 1) {
          // Snap positions
          for (const { atk: a, def: d } of this.movePairs) {
            if (a.targetPosition) {
              a.position.copy(a.targetPosition);
              a.group.position.copy(a.position);
              a.hpBarGroup.position.copy(a.position).y += HPBAR_Y;
            }
            if (d.targetPosition) {
              d.position.copy(d.targetPosition);
              d.group.position.copy(d.position);
              d.hpBarGroup.position.copy(d.position).y += HPBAR_Y;
            }
          }
          this._resolveClashes();
          this.phase      = 'pause';
          this.phaseStart = t;
        }
        break;
      }

      case 'pause': {
        if (t - this.phaseStart >= WAVE_PAUSE_MS) {
          const aliveA = this.atk.filter(u => !u.dead && !u.fadingOut);
          const aliveD = this.def.filter(u => !u.dead && !u.fadingOut);
          if (aliveA.length === 0 || aliveD.length === 0) {
            this._onBattleOver();
          } else {
            this._startNextWave(t);
          }
        }
        break;
      }

      case 'done':
        break;
    }
  }

  // -------------------------------------------------------------------------
  // Private: wave advance
  // -------------------------------------------------------------------------

  private _startNextWave(t: number): void {
    const aliveA = this.atk.filter(u => !u.dead && !u.fadingOut);
    const aliveD = this.def.filter(u => !u.dead && !u.fadingOut);
    if (aliveA.length === 0 || aliveD.length === 0) {
      this._onBattleOver(); return;
    }

    this.movePairs = [];
    const pairedD = new Set<RuntimeBattleUnit>();

    for (const a of aliveA) {
      const nearest = nearestUnit(a, aliveD);
      if (!nearest) continue;
      const mid = new THREE.Vector3()
        .addVectors(a.position, nearest.position)
        .multiplyScalar(0.5);

      a.targetPosition       = new THREE.Vector3().lerpVectors(a.position, mid, 0.55);
      a.targetPosition.y     = a.position.y;
      nearest.targetPosition = new THREE.Vector3().lerpVectors(nearest.position, mid, 0.55);
      nearest.targetPosition.y = nearest.position.y;

      this.movePairs.push({ atk: a, def: nearest });
      pairedD.add(nearest);
    }

    // Unpaired defenders shuffle forward on their own
    for (const d of aliveD) {
      if (pairedD.has(d)) continue;
      const nearest = nearestUnit(d, aliveA);
      if (!nearest) continue;
      const mid = new THREE.Vector3()
        .addVectors(d.position, nearest.position)
        .multiplyScalar(0.5);
      d.targetPosition   = new THREE.Vector3().lerpVectors(d.position, mid, 0.45);
      d.targetPosition.y = d.position.y;
    }

    this.phase      = 'moving';
    this.phaseStart = t;
  }

  // -------------------------------------------------------------------------
  // Private: clash resolution
  // -------------------------------------------------------------------------

  private _resolveClashes(): void {
    for (const { atk: a, def: d } of this.movePairs) {
      if (a.dead || d.dead || a.fadingOut || d.fadingOut) continue;

      const cu_a = toCombatUnit(a.bu);
      const cu_d = toCombatUnit(d.bu);
      cu_a.Health = a.bu.hp;
      cu_d.Health = d.bu.hp;

      // Short clash per wave (maxRounds=5); battle continues next wave
      const res = resolveCombat(cu_a, cu_d, { maxRounds: 5 });

      const atkDmg = Math.max(0, cu_a.Health - res.attackerHpLeft);
      const defDmg = Math.max(0, cu_d.Health - res.defenderHpLeft);

      a.bu.hp = Math.max(0, a.bu.hp - atkDmg);
      d.bu.hp = Math.max(0, d.bu.hp - defDmg);

      this._updateHpBar(a);
      this._updateHpBar(d);

      this.log.push(
        `${a.bu.nazwa} vs ${d.bu.nazwa}: `
        + (res.winner === 'attacker' ? 'wygrywa ATK' : res.winner === 'defender' ? 'wygrywa DEF' : 'remis')
        + ` (rundy:${res.rounds} | ATK HP:${a.bu.hp} DEF HP:${d.bu.hp})`,
      );

      if (a.bu.hp <= 0 || res.routed.includes('attacker')) {
        this.log.push(`  -> ${a.bu.nazwa} wyeliminowany`);
        this._startFade(a);
      }
      if (d.bu.hp <= 0 || res.routed.includes('defender')) {
        this.log.push(`  -> ${d.bu.nazwa} wyeliminowany`);
        this._startFade(d);
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: helpers
  // -------------------------------------------------------------------------

  private _updateHpBar(ru: RuntimeBattleUnit): void {
    const ratio = Math.max(0, Math.min(1, ru.bu.hp / ru.bu.maxHp));
    ru.hpBarFg.scale.x    = ratio;
    ru.hpBarFg.position.x = (ratio - 1) * HPBAR_W * 0.5;
  }

  private _startFade(ru: RuntimeBattleUnit): void {
    if (ru.fadingOut || ru.dead) return;
    ru.fadingOut = true;
    ru.fadeStart = performance.now();
    this.fadingUnits.push(ru);
  }

  private _onBattleOver(): void {
    if (this.finished) return;
    this.finished = true;
    this.phase    = 'done';

    const aliveA = this.atk.filter(u => !u.dead && !u.fadingOut);
    const aliveD = this.def.filter(u => !u.dead && !u.fadingOut);

    let winner: 'atakujacy' | 'obronca';
    let survivors: BattleUnit[];

    if (aliveA.length > 0 && aliveD.length === 0) {
      winner    = 'atakujacy';
      survivors = aliveA.map(u => u.bu);
    } else if (aliveD.length > 0 && aliveA.length === 0) {
      winner    = 'obronca';
      survivors = aliveD.map(u => u.bu);
    } else {
      const hpA = aliveA.reduce((s, u) => s + u.bu.hp, 0);
      const hpD = aliveD.reduce((s, u) => s + u.bu.hp, 0);
      winner    = hpA >= hpD ? 'atakujacy' : 'obronca';
      survivors = (winner === 'atakujacy' ? aliveA : aliveD).map(u => u.bu);
    }

    const winMsg = winner === 'atakujacy' ? 'ATAKUJĄCEGO' : 'OBROŃCY';
    this.log.push(`=== Koniec bitwy: zwycięstwo ${winMsg} ===`);

    this._showResultBanner(winner);
    setTimeout(() => {
      if (this.onFinishCb) this.onFinishCb({ winner, survivors, log: this.log });
    }, 2000);
  }

  private _showResultBanner(winner: 'atakujacy' | 'obronca'): void {
    const banner = document.createElement('div');
    banner.textContent = winner === 'atakujacy'
      ? 'Zwycięstwo atakującego!'
      : 'Zwycięstwo obrońcy!';
    Object.assign(banner.style, {
      position:      'absolute',
      top:           '40%',
      left:          '50%',
      transform:     'translate(-50%, -50%)',
      color:         '#f0e060',
      fontFamily:    'serif',
      fontSize:      '36px',
      fontWeight:    'bold',
      textShadow:    '0 0 20px #ff8800, 2px 2px 4px #000',
      pointerEvents: 'none',
      zIndex:        '10001',
    });
    this.overlay.appendChild(banner);
  }

  private readonly _onResize = (): void => { this._syncRendererSize(); };
}

// ---------------------------------------------------------------------------
// Instant (skip) resolver -- pure logic, no DOM/THREE rendering
// ---------------------------------------------------------------------------

function computeInstantResult(
  aliveAtk: RuntimeBattleUnit[],
  aliveDef: RuntimeBattleUnit[],
): BattleResult {
  const log: string[] = [];

  // Work on mutable hp copies so we don't mutate BattleUnit during skip
  const atkState = aliveAtk.map(u => ({ ru: u, hp: u.bu.hp }));
  const defState = aliveDef.map(u => ({ ru: u, hp: u.bu.hp }));

  const maxWaves = (atkState.length + defState.length) * 6 + 10;
  let wave = 0;

  while (wave < maxWaves) {
    wave++;
    const lA = atkState.filter(u => u.hp > 0);
    const lD = defState.filter(u => u.hp > 0);
    if (lA.length === 0 || lD.length === 0) break;

    const pairs = Math.max(lA.length, lD.length);
    for (let i = 0; i < pairs; i++) {
      const a = lA[i % lA.length];
      const d = lD[i % lD.length];
      if (!a || !d || a.hp <= 0 || d.hp <= 0) continue;

      const cu_a = toCombatUnit(a.ru.bu);
      const cu_d = toCombatUnit(d.ru.bu);
      cu_a.Health = a.hp;
      cu_d.Health = d.hp;

      const res = resolveCombat(cu_a, cu_d, { maxRounds: 30 });
      for (const line of res.log) log.push(line);

      a.hp = Math.max(0, a.hp - Math.max(0, cu_a.Health - res.attackerHpLeft));
      d.hp = Math.max(0, d.hp - Math.max(0, cu_d.Health - res.defenderHpLeft));
    }
  }

  const survivorsA = atkState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));
  const survivorsD = defState.filter(u => u.hp > 0).map(u => ({ ...u.ru.bu, hp: u.hp }));

  let winner: 'atakujacy' | 'obronca';
  let survivors: BattleUnit[];

  if (survivorsA.length > 0 && survivorsD.length === 0) {
    winner = 'atakujacy'; survivors = survivorsA;
  } else if (survivorsD.length > 0 && survivorsA.length === 0) {
    winner = 'obronca'; survivors = survivorsD;
  } else {
    const hpA = survivorsA.reduce((s, u) => s + u.hp, 0);
    const hpD = survivorsD.reduce((s, u) => s + u.hp, 0);
    winner    = hpA >= hpD ? 'atakujacy' : 'obronca';
    survivors = winner === 'atakujacy' ? survivorsA : survivorsD;
  }

  log.push(`=== Natychmiastowy wynik: ${winner === 'atakujacy' ? 'ATAKUJACY' : 'OBRONCA'} wygrywa ===`);
  return { winner, survivors, log };
}

// ---------------------------------------------------------------------------
// Fallback avatar (plain box) -- used when buildUnitModel throws
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// HP bar factory
// ---------------------------------------------------------------------------

function makeHpBar(): {
  hpBarGroup: THREE.Group;
  hpBarFg:    THREE.Mesh;
  hpBarBg:    THREE.Mesh;
} {
  const group = new THREE.Group();

  // Background (dark red)
  const bgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H);
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x882020, side: THREE.DoubleSide });
  const bg    = new THREE.Mesh(bgGeo, bgMat);
  group.add(bg);

  // Foreground (green), sits 1 mm in front of bg
  const fgGeo = new THREE.PlaneGeometry(HPBAR_W, HPBAR_H * 0.72);
  const fgMat = new THREE.MeshBasicMaterial({ color: 0x30c030, side: THREE.DoubleSide });
  const fg    = new THREE.Mesh(fgGeo, fgMat);
  fg.position.z = 0.002;
  group.add(fg);

  return { hpBarGroup: group, hpBarFg: fg, hpBarBg: bg };
}

// ---------------------------------------------------------------------------
// Nearest-unit helper
// ---------------------------------------------------------------------------

function nearestUnit(
  from:       RuntimeBattleUnit,
  candidates: RuntimeBattleUnit[],
): RuntimeBattleUnit | null {
  let best: RuntimeBattleUnit | null = null;
  let bestDist = Infinity;
  for (const c of candidates) {
    if (c.dead || c.fadingOut) continue;
    const d = from.position.distanceTo(c.position);
    if (d < bestDist) { bestDist = d; best = c; }
  }
  return best;
}

// ---------------------------------------------------------------------------
// Colour lighten helper
// ---------------------------------------------------------------------------

function lighten(hex: number, amt: number): number {
  const r = Math.min(255, ((hex >> 16) & 0xff) + Math.round(255 * amt));
  const g = Math.min(255, ((hex >>  8) & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, ( hex        & 0xff)  + Math.round(255 * amt));
  return (r << 16) | (g << 8) | b;
}

// ---------------------------------------------------------------------------
// Button style helper
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SELF-TEST
// Exercises computeInstantResult (the skip() path) with fake units.
// Safe to call in Node.js: does NOT touch DOM or THREE rendering.
// Returns a PASS string or throws on failure.
// ---------------------------------------------------------------------------

export function selfTest(): string {
  const makeStats = (atk: number, obrona: number, hp: number, ranged = false) => ({
    'Jednostka':                   ranged ? 'Lucznik' : 'Miecznik',
    'Rola (linia)':                ranged ? 'Dystans' : 'Wrecz',
    'Atak':                        atk,
    'Obrona':                      obrona,
    'Uderzenie':                   2,
    'Pancerz':                     1,
    'Przebicie':                   0,
    'Prog dezercji (% health)':    0.25,
    'Atak dystansowy':             ranged ? 5 : 0,
    'Zasieg ataku (hex)':          ranged ? 3 : null,
    'Ilosc pociskow':              ranged ? 6 : null,
    'Ruch w bitwie (heksy)':       null,
    'Kara obrony z flanki (%)':    50,
    'Kara obrony z tylu (%)':      80,
    'Health':                      hp,
  });

  const fakeAtk: BattleUnit[] = [
    { id: 'a1', nazwa: 'Miecznik-1', kategoria: 'miecznik', ownerColor: 0xffd54a, stats: makeStats(6, 4, 30), hp: 30, maxHp: 30 },
    { id: 'a2', nazwa: 'Miecznik-2', kategoria: 'miecznik', ownerColor: 0xffd54a, stats: makeStats(5, 5, 25), hp: 25, maxHp: 25 },
  ];
  const fakeDef: BattleUnit[] = [
    { id: 'd1', nazwa: 'Wlocznik-1', kategoria: 'wlocznik', ownerColor: 0xe53935, stats: makeStats(4, 6, 28), hp: 28, maxHp: 28 },
    { id: 'd2', nazwa: 'Wlocznik-2', kategoria: 'wlocznik', ownerColor: 0xe53935, stats: makeStats(4, 5, 22), hp: 22, maxHp: 22 },
    { id: 'd3', nazwa: 'Lucznik-1',  kategoria: 'lucznik',  ownerColor: 0xe53935, stats: makeStats(3, 4, 18, true), hp: 18, maxHp: 18 },
  ];

  // Stub RuntimeBattleUnit minimally (computeInstantResult only reads .bu and .hp)
  const toRU = (bu: BattleUnit, side: 'atk' | 'def'): RuntimeBattleUnit => ({
    bu,
    group:         null as unknown as THREE.Group,
    hpBarFg:       null as unknown as THREE.Mesh,
    hpBarBg:       null as unknown as THREE.Mesh,
    hpBarGroup:    null as unknown as THREE.Group,
    position:      new THREE.Vector3(0, 0, 0),
    targetPosition: null,
    side,
    dead:       false,
    fadingOut:  false,
    fadeStart:  0,
    mats:       [],
    perTokenGeos: [],
  });

  const atkRU = fakeAtk.map(bu => toRU(bu, 'atk'));
  const defRU = fakeDef.map(bu => toRU(bu, 'def'));

  const result = computeInstantResult(atkRU, defRU);

  if (result.winner !== 'atakujacy' && result.winner !== 'obronca') {
    throw new Error(`selfTest FAIL: unexpected winner "${result.winner}"`);
  }
  if (!Array.isArray(result.survivors)) {
    throw new Error('selfTest FAIL: survivors is not an array');
  }
  if (!Array.isArray(result.log) || result.log.length === 0) {
    throw new Error('selfTest FAIL: log is empty');
  }

  return (
    `PASS | winner="${result.winner}" | survivors=${result.survivors.length}` +
    ` | log_lines=${result.log.length}`
  );
}
