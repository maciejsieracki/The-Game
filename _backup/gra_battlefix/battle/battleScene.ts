/**
 * battleScene.ts
 * Tactical 3D auto-battle overlay scene for The Game (SS5h: AI controls both
 * sides, player watches or skips).
 *
 * Renders a flat hex battlefield (pointy-top, NO rotateY) using the same
 * proven math as scene.ts / hexutil.ts:
 *   axialToWorld(q, r, R)  =>  x = R*sqrt(3)*(q + r*0.5),  z = R*1.5*r
 *   CylinderGeometry(R*0.998, R*0.998, h, 6)  --  NO rotateY.
 *
 * Combat is blow-for-blow driven by resolveCombat (SS5l real stats):
 *   - For each clash pair call resolveCombat once -> get {winner, attackerHpLeft,
 *     defenderHpLeft, rounds, routed, log}.
 *   - Animate up to MAX_VIS_ROUNDS visual rounds (capped, ~0.45 s each):
 *       ATK lunges forward, DEF HP bar steps down + floating '-N' number pops.
 *       DEF lunges back, ATK HP bar steps down + floating '-N' number pops.
 *   - HP loss per visual round distributed uniformly so bars end exactly at
 *     the stat-correct final HP.
 *   - At end of rounds: loser falls over / fades; winner stays.
 *
 * ASCII-only source file (Polish UI strings via \uXXXX where needed).
 *
 * Public API (UNCHANGED):
 *   constructor(opts: BattleOpts)
 *   play(onFinish: (r: BattleResult) => void): void
 *   skip(): void
 *   dispose(): void
 */

import * as THREE from 'three';
import { resolveCombat } from '../game/combat';
import type { CombatUnit, CombatResult } from '../game/combat';
import { axialToWorld, HEX_R, SQRT3 } from '../render/hexutil';
import { buildUnitModel } from '../render/units';

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface BattleUnit {
  id: string;
  nazwa: string;
  kategoria: string;
  ownerColor: number;
  stats: any;
  hp: number;
  maxHp: number;
}

export interface BattleOpts {
  attacker: BattleUnit[];
  defender: BattleUnit[];
  teren: string;
  data?: any;
  onCancel?: () => void;
}

export interface BattleResult {
  winner: 'atakujacy' | 'obronca';
  survivors: BattleUnit[];
  log: string[];
}

// ---------------------------------------------------------------------------
// Battlefield layout constants
// ---------------------------------------------------------------------------

const ATK_COLS   = 7;
const DEF_COLS   = 7;
const GAP_COLS   = 2;
const FIELD_ROWS = 7;
const TOTAL_COLS = ATK_COLS + GAP_COLS + DEF_COLS;
const BF_R = HEX_R;

// ---------------------------------------------------------------------------
// Combat animation constants
// ---------------------------------------------------------------------------

const MAX_VIS_ROUNDS = 12;

// Per-round timeline (blow-for-blow, deliberately slow):
//   ATK lunge (LUNGE_MS) -> DEF HP hit -> pause REACT_DELAY_MS
//   -> DEF lunge (LUNGE_MS) -> ATK HP hit -> pause ROUND_GAP_MS
// Total per round: LUNGE_MS + REACT_DELAY_MS + LUNGE_MS + ROUND_GAP_MS
//   = 300 + 1000 + 300 + 2000 = 3600 ms
// 12 rounds * 3.6 s ~= 43 s  (watchable, skip available)
const LUNGE_MS        = 300;   // time to lunge forward and snap back
const REACT_DELAY_MS  = 1000;  // pause after ATK hits DEF before DEF counter-attacks
const ROUND_GAP_MS    = 2000;  // pause after DEF hits ATK before next round begins
const VIS_ROUND_MS    = LUNGE_MS + REACT_DELAY_MS + LUNGE_MS + ROUND_GAP_MS; // 3600 ms

const PAIR_STAGGER_MS = 120;
const DEATH_FADE_MS   = 500;
const HPBAR_W = 0.80;
const HPBAR_H = 0.08;
const HPBAR_Y = 1.05;

// ---------------------------------------------------------------------------
// Terrain floor colours
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

// ---------------------------------------------------------------------------
// Stat normaliser
// ---------------------------------------------------------------------------

function norm(v: unknown, fallback: number): number {
  if (v === null || v === undefined || v === '---' || v === '') return fallback;
  const n = typeof v === 'string' ? parseFloat(v as string) : (v as number);
  return isNaN(n) ? fallback : n;
}

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
// Internal runtime unit
// ---------------------------------------------------------------------------

interface RuntimeBattleUnit {
  bu:             BattleUnit;
  group:          THREE.Group;
  hpBarFg:        THREE.Mesh;
  hpBarBg:        THREE.Mesh;
  hpBarGroup:     THREE.Group;
  homePos:        THREE.Vector3;
  side:           'atk' | 'def';
  dead:           boolean;
  fadingOut:      boolean;
  fadeStart:      number;
  mats:           THREE.Material[];
  perTokenGeos:   THREE.BufferGeometry[];
}

// ---------------------------------------------------------------------------
// Floating damage number
// ---------------------------------------------------------------------------

interface FloatLabel {
  elem:      HTMLDivElement;
  startTime: number;
  duration:  number;
  worldPos:  THREE.Vector3;
  riseRate:  number;
  done:      boolean;
}

// ---------------------------------------------------------------------------
// Clash descriptor
// ---------------------------------------------------------------------------

interface ClashDesc {
  atkRu:              RuntimeBattleUnit;
  defRu:              RuntimeBattleUnit;
  result:             CombatResult;
  atkTotalLoss:       number;
  defTotalLoss:       number;
  visRounds:          number;
  atkDiesOnLastRound: boolean;
  defDiesOnLastRound: boolean;
  startOffset:        number;
  animStarted:        boolean;
  animT0:             number;
  currentRound:       number;
  // tracks which half-hits have already been applied for the current round
  defHitApplied:      boolean; // DEF bar stepped down after ATK lunge this round
  atkHitApplied:      boolean; // ATK bar stepped down after DEF lunge this round
  done:               boolean;
}

// ---------------------------------------------------------------------------
// BattleScene
// ---------------------------------------------------------------------------

export class BattleScene {
  private canvas:   HTMLCanvasElement;
  private overlay:  HTMLDivElement;
  private renderer: THREE.WebGLRenderer;
  private scene:    THREE.Scene;
  private camera:   THREE.PerspectiveCamera;

  private atk: RuntimeBattleUnit[] = [];
  private def: RuntimeBattleUnit[] = [];

  private ownedMats: THREE.Material[]       = [];
  private ownedGeos: THREE.BufferGeometry[] = [];

  private animFrameId: number | null = null;
  private started  = false;
  private finished = false;

  private log:        string[]                               = [];
  private onFinishCb: ((r: BattleResult) => void) | null    = null;
  private onCancelCb: (() => void) | null                   = null;

  private clashes:      ClashDesc[]    = [];
  private floatLabels:  FloatLabel[]   = [];
  private battleStartT: number         = 0;
  private fadingUnits: RuntimeBattleUnit[] = [];

  // -------------------------------------------------------------------------
  constructor(opts: BattleOpts) {
    this.onCancelCb = opts.onCancel ?? null;

    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position:       'fixed',
      inset:          '0',
      zIndex:         '9999',
      background:     'rgba(0,0,0,0.88)',
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'flex-start',
    });
    document.body.appendChild(this.overlay);

    const titleBar = document.createElement('div');
    Object.assign(titleBar.style, {
      color:         '#f0d080',
      fontFamily:    'sans-serif',
      fontSize:      '18px',
      fontWeight:    'bold',
      padding:       '10px 20px 0',
      textAlign:     'center',
      textShadow:    '0 1px 4px #000',
      letterSpacing: '0.04em',
    });
    titleBar.textContent = 'Bitwa Automatyczna — ' + opts.teren;
    this.overlay.appendChild(titleBar);

    this.canvas = document.createElement('canvas');
    Object.assign(this.canvas.style, {
      flex:     '1',
      width:    '100%',
      display:  'block',
      position: 'relative',
    });
    this.overlay.appendChild(this.canvas);

    const btnBar = document.createElement('div');
    Object.assign(btnBar.style, {
      display: 'flex',
      gap:     '12px',
      padding: '8px 0 12px',
    });
    this.overlay.appendChild(btnBar);

    const btnSkip = document.createElement('button');
    btnSkip.textContent = 'Pomin → wynik';
    styleButton(btnSkip, '#c08030', '#fff');
    btnSkip.onclick = () => { if (!this.finished) this.skip(); };
    btnBar.appendChild(btnSkip);

    const btnExit = document.createElement('button');
    btnExit.textContent = 'Wyjscie';
    styleButton(btnExit, '#8a2020', '#fff');
    btnExit.onclick = () => {
      this.dispose();
      if (this.onCancelCb) this.onCancelCb();
    };
    btnBar.appendChild(btnExit);

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type    = THREE.PCFSoftShadowMap;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x12100e);
    this.scene.fog = new THREE.FogExp2(0x12100e, 0.018);

    const midQ = (TOTAL_COLS - 1) / 2;
    const midR = (FIELD_ROWS - 1) / 2;
    const { x: cx, z: cz } = axialToWorld(midQ, midR, BF_R);
    const fieldWorldW = BF_R * SQRT3 * TOTAL_COLS;
    const fieldWorldH = BF_R * 1.5 * FIELD_ROWS;
    const camDist = Math.max(fieldWorldW, fieldWorldH) * 1.05;
    this.camera = new THREE.PerspectiveCamera(45, 1, 0.1, 300);
    this.camera.position.set(cx, camDist * 0.75, cz + camDist * 0.70);
    this.camera.lookAt(cx, 0, cz);

    this.scene.add(new THREE.AmbientLight(0xfff8e0, 0.55));
    const sun = new THREE.DirectionalLight(0xfff5c0, 1.3);
    sun.position.set(10, 20, -8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    this.scene.add(sun);
    const fill = new THREE.DirectionalLight(0x8090c0, 0.30);
    fill.position.set(-8, 6, 12);
    this.scene.add(fill);

    this._buildBattlefield(opts.teren);
    this._placeUnits(opts.attacker, opts.defender);

    window.addEventListener('resize', this._onResize);
    this._startLoop();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  play(onFinish: (result: BattleResult) => void): void {
    this.onFinishCb  = onFinish;
    this.started     = true;
    this.battleStartT = performance.now();
    this._buildClashes();
  }

  skip(): void {
    if (this.finished) return;
    this.finished = true;
    const result = computeInstantResult(
      this.atk.filter(u => !u.dead),
      this.def.filter(u => !u.dead),
    );
    this._showResultBanner(result.winner);
    setTimeout(() => {
      if (this.onFinishCb) this.onFinishCb(result);
    }, 1800);
  }

  dispose(): void {
    this.finished = true;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    window.removeEventListener('resize', this._onResize);

    for (const fl of this.floatLabels) {
      if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
    }
    this.floatLabels = [];

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
    const gapColor   = 0x2a2010;
    const defColor   = lighten(floorColor, 0.08);

    // Pointy-top hex tile: CylinderGeometry(R*0.998, R*0.998, h, 6) -- NO rotateY.
    // Identical to scene.ts (world map) which tiles without gaps.
    const hexH   = 0.10;
    const hexGeo = new THREE.CylinderGeometry(BF_R * 0.998, BF_R * 0.998, hexH, 6, 1);
    this.ownedGeos.push(hexGeo);

    for (let q = 0; q < TOTAL_COLS; q++) {
      for (let r = 0; r < FIELD_ROWS; r++) {
        const isGap = q >= ATK_COLS && q < ATK_COLS + GAP_COLS;
        const isAtk = q < ATK_COLS;
        const col   = isGap ? gapColor : (isAtk ? floorColor : defColor);
        const mat   = new THREE.MeshLambertMaterial({ color: col });
        this.ownedMats.push(mat);

        const mesh = new THREE.Mesh(hexGeo, mat);
        const { x, z } = axialToWorld(q, r, BF_R);
        // Hex center at y = -hexH*0.5 so top face is at y = 0
        mesh.position.set(x, -hexH * 0.5, z);
        mesh.receiveShadow = true;
        // NO rotation -- CylinderGeometry(6) is already pointy-top.
        this.scene.add(mesh);
      }
    }

    const midQ = (TOTAL_COLS - 1) / 2;
    const midR = (FIELD_ROWS - 1) / 2;
    const { x: mx, z: mz } = axialToWorld(midQ, midR, BF_R);
    const gGeo = new THREE.PlaneGeometry(120, 80);
    const gMat = new THREE.MeshLambertMaterial({ color: 0x0a0908 });
    this.ownedGeos.push(gGeo);
    this.ownedMats.push(gMat);
    const ground = new THREE.Mesh(gGeo, gMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(mx, -0.12, mz);
    this.scene.add(ground);

    const leftEdge  = axialToWorld(-1, midR, BF_R).x - BF_R * 0.3;
    const rightEdge = axialToWorld(TOTAL_COLS, midR, BF_R).x + BF_R * 0.3;
    const stripH    = BF_R * 1.5 * FIELD_ROWS * 0.55;
    const mkStrip   = (color: number, xPos: number) => {
      const sg = new THREE.BoxGeometry(0.10, 0.70, stripH);
      const sm = new THREE.MeshLambertMaterial({ color });
      this.ownedGeos.push(sg);
      this.ownedMats.push(sm);
      const m  = new THREE.Mesh(sg, sm);
      m.position.set(xPos, 0.25, mz);
      this.scene.add(m);
    };
    mkStrip(0xcc3010, leftEdge);
    mkStrip(0x1040c0, rightEdge);
  }

  // -------------------------------------------------------------------------
  // Private: place units
  // -------------------------------------------------------------------------

  private _placeUnits(attackers: BattleUnit[], defenders: BattleUnit[]): void {
    const hexH  = 0.10;
    const unitY = 0; // top face of hex is at y=0

    const place = (
      units:       BattleUnit[],
      side:        'atk' | 'def',
      qStart:      number,
      facingRight: boolean,
    ): RuntimeBattleUnit[] =>
      units.map((bu, idx) => {
        const qOff = idx % ATK_COLS;
        const rOff = Math.floor(idx / ATK_COLS) % FIELD_ROWS;
        const q    = qStart + qOff;
        const r    = rOff;
        const { x, z } = axialToWorld(q, r, BF_R);

        let group: THREE.Group;
        try {
          group = buildUnitModel(bu.kategoria, bu.ownerColor);
        } catch (_) {
          group = makeFallbackAvatar(bu.ownerColor);
        }
        group.position.set(x, unitY, z);
        if (!facingRight) group.rotation.y = Math.PI;
        this.scene.add(group);

        const mats:         THREE.Material[]       = (group.userData['mats']         as THREE.Material[]      ) ?? [];
        const perTokenGeos: THREE.BufferGeometry[] = (group.userData['perTokenGeos'] as THREE.BufferGeometry[]) ?? [];

        const { hpBarGroup, hpBarFg, hpBarBg } = makeHpBar();
        hpBarGroup.position.set(x, unitY + HPBAR_Y, z);
        this.scene.add(hpBarGroup);

        return {
          bu,
          group,
          hpBarFg,
          hpBarBg,
          hpBarGroup,
          homePos:   new THREE.Vector3(x, unitY, z),
          side,
          dead:      false,
          fadingOut: false,
          fadeStart: 0,
          mats,
          perTokenGeos,
        };
      });

    this.atk = place(attackers, 'atk', 0, true);
    this.def = place(defenders, 'def', ATK_COLS + GAP_COLS, false);
  }

  // -------------------------------------------------------------------------
  // Private: pre-compute all clashes using resolveCombat (real stats)
  // -------------------------------------------------------------------------

  private _buildClashes(): void {
    this.clashes = [];

    const aliveA = [...this.atk];
    const aliveD = [...this.def];
    const count  = Math.max(aliveA.length, aliveD.length);

    let stagger = 0;

    for (let i = 0; i < count; i++) {
      const atkRu = aliveA[i % aliveA.length];
      const defRu = aliveD[i % aliveD.length];
      if (!atkRu || !defRu) continue;

      const cu_a = toCombatUnit(atkRu.bu);
      const cu_d = toCombatUnit(defRu.bu);
      cu_a.Health = atkRu.bu.hp;
      cu_d.Health = defRu.bu.hp;

      // THE canonical combat resolution -- real stats, real SS5l formulas
      const result = resolveCombat(cu_a, cu_d, { maxRounds: 30 });

      const atkLoss   = Math.max(0, atkRu.bu.hp - result.attackerHpLeft);
      const defLoss   = Math.max(0, defRu.bu.hp - result.defenderHpLeft);
      const visRounds = Math.min(MAX_VIS_ROUNDS, Math.max(1, result.rounds));

      this.log.push(
        `${atkRu.bu.nazwa} vs ${defRu.bu.nazwa}: `
        + (result.winner === 'attacker' ? 'wygrywa ATK' : result.winner === 'defender' ? 'wygrywa DEF' : 'remis')
        + ` (rundy:${result.rounds} | ATK HP ${atkRu.bu.hp}->${result.attackerHpLeft}`
        + ` DEF HP ${defRu.bu.hp}->${result.defenderHpLeft})`,
      );

      this.clashes.push({
        atkRu,
        defRu,
        result,
        atkTotalLoss:        atkLoss,
        defTotalLoss:        defLoss,
        visRounds,
        atkDiesOnLastRound:  atkLoss >= atkRu.bu.hp,
        defDiesOnLastRound:  defLoss >= defRu.bu.hp,
        startOffset:         stagger,
        animStarted:         false,
        animT0:              0,
        currentRound:        0,
        defHitApplied:       false,
        atkHitApplied:       false,
        done:                false,
      });

      stagger += PAIR_STAGGER_MS;
    }
  }

  // -------------------------------------------------------------------------
  // Private: render loop
  // -------------------------------------------------------------------------

  private _startLoop(): void {
    const loop = (t: number) => {
      this.animFrameId = requestAnimationFrame(loop);
      this._syncRendererSize();
      if (this.started && !this.finished) this._tick(t);
      for (const ru of [...this.atk, ...this.def]) {
        if (!ru.dead) ru.hpBarGroup.lookAt(this.camera.position);
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
  // Private: main tick
  // -------------------------------------------------------------------------

  private _tick(t: number): void {
    const elapsed = t - this.battleStartT;

    // Update fading units
    this.fadingUnits = this.fadingUnits.filter(ru => {
      const progress = Math.min(1, (t - ru.fadeStart) / DEATH_FADE_MS);
      const opacity  = 1 - progress;
      for (const m of ru.mats) {
        const lm      = m as THREE.MeshLambertMaterial;
        lm.transparent = true;
        lm.opacity     = opacity;
        lm.needsUpdate = true;
      }
      ru.group.scale.setScalar(1 - progress * 0.6);
      if (progress >= 1) {
        ru.dead               = true;
        ru.fadingOut          = false;
        ru.group.visible      = false;
        ru.hpBarGroup.visible = false;
        return false;
      }
      return true;
    });

    // Update float labels
    this.floatLabels = this.floatLabels.filter(fl => {
      const age = t - fl.startTime;
      const p   = Math.min(1, age / fl.duration);
      if (fl.done || p >= 1) {
        if (fl.elem.parentNode) fl.elem.parentNode.removeChild(fl.elem);
        return false;
      }
      const wPos = fl.worldPos.clone();
      wPos.y += age * fl.riseRate;
      const screenPos = worldToScreen(wPos, this.camera, this.canvas);
      if (screenPos) {
        fl.elem.style.left    = screenPos.x + 'px';
        fl.elem.style.top     = screenPos.y + 'px';
        fl.elem.style.opacity = String(1 - p * p);
      }
      return true;
    });

    // Drive clash animations
    let allDone = true;
    for (const clash of this.clashes) {
      if (clash.done) continue;
      allDone = false;

      if (elapsed < clash.startOffset) continue;

      if (!clash.animStarted) {
        clash.animStarted  = true;
        clash.animT0       = t;
        clash.currentRound = 0;
      }

      this._driveClash(clash, t);
    }

    if (allDone && this.clashes.length > 0 && !this.finished) {
      if (this.fadingUnits.length === 0) {
        this._onBattleOver();
      }
    }
  }

  // -------------------------------------------------------------------------
  // Private: animate one clash frame
  //
  // Per-round timeline (blow-for-blow):
  //   [0 .. LUNGE_MS)              ATK lunges toward DEF, then snaps back
  //   at t == LUNGE_MS             DEF HP bar steps down; floating '-N' spawns
  //   [LUNGE_MS .. LUNGE_MS+REACT_DELAY_MS)   both units stand idle (REACT pause)
  //   [LUNGE_MS+REACT_DELAY_MS .. *+LUNGE_MS) DEF lunges toward ATK, snaps back
  //   at t == LUNGE_MS+REACT_DELAY_MS+LUNGE_MS  ATK HP bar steps down; '-N' spawns
  //   [.. .. VIS_ROUND_MS)         both units stand idle (ROUND_GAP pause)
  // -------------------------------------------------------------------------

  private _driveClash(clash: ClashDesc, t: number): void {
    const { atkRu, defRu, visRounds, atkTotalLoss, defTotalLoss } = clash;
    const localT = t - clash.animT0;

    // Which round we are currently inside (0-based)
    const roundIdx = Math.floor(localT / VIS_ROUND_MS);

    // Advance currentRound counter to catch any rounds we skipped (fast frames)
    // and flush any pending hit events for completed rounds
    while (clash.currentRound < roundIdx && clash.currentRound < visRounds) {
      // Make sure both hits for the outgoing round are applied
      if (!clash.defHitApplied) this._applyDefHit(clash);
      if (!clash.atkHitApplied) this._applyAtkHit(clash);
      clash.currentRound++;
      clash.defHitApplied = false;
      clash.atkHitApplied = false;
    }

    if (clash.currentRound >= visRounds) {
      // All visual rounds are done -- snap units home, lock final HP, start fades
      if (!atkRu.dead && !atkRu.fadingOut) {
        atkRu.group.position.copy(atkRu.homePos);
        atkRu.hpBarGroup.position.set(atkRu.homePos.x, atkRu.homePos.y + HPBAR_Y, atkRu.homePos.z);
      }
      if (!defRu.dead && !defRu.fadingOut) {
        defRu.group.position.copy(defRu.homePos);
        defRu.hpBarGroup.position.set(defRu.homePos.x, defRu.homePos.y + HPBAR_Y, defRu.homePos.z);
      }

      // Snap to exact stat-correct final HP from resolveCombat
      atkRu.bu.hp = Math.max(0, clash.result.attackerHpLeft);
      defRu.bu.hp = Math.max(0, clash.result.defenderHpLeft);
      this._updateHpBar(atkRu);
      this._updateHpBar(defRu);

      if (!atkRu.dead && !atkRu.fadingOut) {
        if (atkRu.bu.hp <= 0 || clash.result.routed.includes('attacker')) {
          this.log.push('  -> ' + atkRu.bu.nazwa + ' wyeliminowany');
          this._startFade(atkRu);
        }
      }
      if (!defRu.dead && !defRu.fadingOut) {
        if (defRu.bu.hp <= 0 || clash.result.routed.includes('defender')) {
          this.log.push('  -> ' + defRu.bu.nazwa + ' wyeliminowany');
          this._startFade(defRu);
        }
      }

      clash.done = true;
      return;
    }

    // Time within the current round
    const roundLocalT = localT - clash.currentRound * VIS_ROUND_MS;

    // Phase boundaries within a round
    // Phase 0: [0 .. LUNGE_MS)              -- ATK lunge
    // Hit DEF at LUNGE_MS
    // Phase 1: [LUNGE_MS .. LUNGE_MS+REACT_DELAY_MS)   -- idle REACT pause
    // Phase 2: [LUNGE_MS+REACT .. LUNGE_MS+REACT+LUNGE_MS)  -- DEF lunge
    // Hit ATK at LUNGE_MS+REACT+LUNGE_MS
    // Phase 3: rest until VIS_ROUND_MS      -- idle ROUND_GAP pause

    const DEF_HIT_T = LUNGE_MS;
    const DEF_LUNGE_START = LUNGE_MS + REACT_DELAY_MS;
    const ATK_HIT_T = DEF_LUNGE_START + LUNGE_MS;

    // Fire DEF hit (ATK just connected) -- once per round, after ATK lunge completes
    if (roundLocalT >= DEF_HIT_T && !clash.defHitApplied) {
      this._applyDefHit(clash);
    }

    // Fire ATK hit (DEF just connected) -- once per round, after DEF lunge completes
    if (roundLocalT >= ATK_HIT_T && !clash.atkHitApplied) {
      this._applyAtkHit(clash);
    }

    // Drive unit positions
    this._animateRound(clash, roundLocalT);
  }

  // Apply DEF's HP step-down (attacker lunged and hit)
  private _applyDefHit(clash: ClashDesc): void {
    clash.defHitApplied = true;
    const { defRu, visRounds, defTotalLoss } = clash;
    const rIdx = clash.currentRound; // 0-based
    const perRound    = Math.floor(defTotalLoss / visRounds);
    const isLastRound = rIdx === visRounds - 1;
    const dmg = isLastRound
      ? defTotalLoss - perRound * (visRounds - 1)
      : perRound;
    if (dmg > 0 && !defRu.dead && !defRu.fadingOut) {
      defRu.bu.hp = Math.max(0, defRu.bu.hp - dmg);
      this._updateHpBar(defRu);
      this._spawnDamageLabel(defRu, dmg);
    }
  }

  // Apply ATK's HP step-down (defender lunged and hit)
  private _applyAtkHit(clash: ClashDesc): void {
    clash.atkHitApplied = true;
    const { atkRu, visRounds, atkTotalLoss } = clash;
    const rIdx = clash.currentRound; // 0-based
    const perRound    = Math.floor(atkTotalLoss / visRounds);
    const isLastRound = rIdx === visRounds - 1;
    const dmg = isLastRound
      ? atkTotalLoss - perRound * (visRounds - 1)
      : perRound;
    if (dmg > 0 && !atkRu.dead && !atkRu.fadingOut) {
      atkRu.bu.hp = Math.max(0, atkRu.bu.hp - dmg);
      this._updateHpBar(atkRu);
      this._spawnDamageLabel(atkRu, dmg);
    }
  }

  // -------------------------------------------------------------------------
  // Private: animate lunge/recoil within one visual round
  //
  // Phase boundaries (matching _driveClash):
  //   [0 .. LUNGE_MS)                          ATK lunge toward DEF, snap back
  //   [LUNGE_MS .. LUNGE_MS+REACT_DELAY_MS)    both stand idle (REACT pause)
  //   [LUNGE_MS+REACT .. *+LUNGE_MS)           DEF lunge toward ATK, snap back
  //   [*+LUNGE_MS .. VIS_ROUND_MS)             both stand idle (ROUND_GAP pause)
  // -------------------------------------------------------------------------

  private _animateRound(clash: ClashDesc, roundLocalT: number): void {
    const { atkRu, defRu } = clash;

    const midX = (atkRu.homePos.x + defRu.homePos.x) * 0.5;
    const midZ = (atkRu.homePos.z + defRu.homePos.z) * 0.5;

    const atkLungeX = atkRu.homePos.x + (midX - atkRu.homePos.x) * 0.60;
    const atkLungeZ = atkRu.homePos.z + (midZ - atkRu.homePos.z) * 0.60;
    const defLungeX = defRu.homePos.x + (midX - defRu.homePos.x) * 0.60;
    const defLungeZ = defRu.homePos.z + (midZ - defRu.homePos.z) * 0.60;

    // Phase boundary constants (same as in _driveClash)
    const DEF_LUNGE_START = LUNGE_MS + REACT_DELAY_MS;

    // --- ATK position ---
    if (!atkRu.dead && !atkRu.fadingOut) {
      let ax: number;
      let az: number;
      // ATK lunge: go forward in first half of LUNGE_MS, then snap back
      if (roundLocalT < LUNGE_MS * 0.5) {
        // forward
        const p = roundLocalT / (LUNGE_MS * 0.5);
        ax = lerp(atkRu.homePos.x, atkLungeX, easeOut(p));
        az = lerp(atkRu.homePos.z, atkLungeZ, easeOut(p));
      } else if (roundLocalT < LUNGE_MS) {
        // snap back
        const p = (roundLocalT - LUNGE_MS * 0.5) / (LUNGE_MS * 0.5);
        ax = lerp(atkLungeX, atkRu.homePos.x, easeIn(p));
        az = lerp(atkLungeZ, atkRu.homePos.z, easeIn(p));
      } else {
        // idle for the rest of the round (REACT pause + DEF lunge + ROUND_GAP)
        ax = atkRu.homePos.x;
        az = atkRu.homePos.z;
      }
      atkRu.group.position.set(ax, atkRu.homePos.y, az);
      atkRu.hpBarGroup.position.set(ax, atkRu.homePos.y + HPBAR_Y, az);
    }

    // --- DEF position ---
    if (!defRu.dead && !defRu.fadingOut) {
      let dx: number;
      let dz: number;
      const rt2 = roundLocalT - DEF_LUNGE_START;
      if (rt2 < 0) {
        // idle: ATK phase + REACT pause
        dx = defRu.homePos.x;
        dz = defRu.homePos.z;
      } else if (rt2 < LUNGE_MS * 0.5) {
        // DEF lunge forward
        const p = rt2 / (LUNGE_MS * 0.5);
        dx = lerp(defRu.homePos.x, defLungeX, easeOut(p));
        dz = lerp(defRu.homePos.z, defLungeZ, easeOut(p));
      } else if (rt2 < LUNGE_MS) {
        // DEF snap back
        const p = (rt2 - LUNGE_MS * 0.5) / (LUNGE_MS * 0.5);
        dx = lerp(defLungeX, defRu.homePos.x, easeIn(p));
        dz = lerp(defLungeZ, defRu.homePos.z, easeIn(p));
      } else {
        // idle: ROUND_GAP pause
        dx = defRu.homePos.x;
        dz = defRu.homePos.z;
      }
      defRu.group.position.set(dx, defRu.homePos.y, dz);
      defRu.hpBarGroup.position.set(dx, defRu.homePos.y + HPBAR_Y, dz);
    }
  }

  // -------------------------------------------------------------------------
  // Private: helpers
  // -------------------------------------------------------------------------

  private _updateHpBar(ru: RuntimeBattleUnit): void {
    const ratio = Math.max(0, Math.min(1, ru.bu.hp / ru.bu.maxHp));
    ru.hpBarFg.scale.x    = ratio;
    ru.hpBarFg.position.x = (ratio - 1) * HPBAR_W * 0.5;

    let color: number;
    if (ratio > 0.60) {
      color = 0x30c030;
    } else if (ratio > 0.30) {
      color = 0xd0a020;
    } else {
      color = 0xd02020;
    }
    (ru.hpBarFg.material as THREE.MeshBasicMaterial).color.setHex(color);
  }

  private _startFade(ru: RuntimeBattleUnit): void {
    if (ru.fadingOut || ru.dead) return;
    ru.fadingOut = true;
    ru.fadeStart = performance.now();
    this.fadingUnits.push(ru);
  }

  private _spawnDamageLabel(ru: RuntimeBattleUnit, dmg: number): void {
    const el = document.createElement('div');
    el.textContent = '-' + dmg;
    Object.assign(el.style, {
      position:      'absolute',
      pointerEvents: 'none',
      color:         '#ff4444',
      fontFamily:    'sans-serif',
      fontSize:      '14px',
      fontWeight:    'bold',
      textShadow:    '0 0 6px #000, 1px 1px 2px #000',
      whiteSpace:    'nowrap',
      transform:     'translate(-50%, -50%)',
      zIndex:        '10010',
    });
    this.overlay.appendChild(el);

    const worldPos = ru.homePos.clone();
    worldPos.y += HPBAR_Y + 0.20;

    this.floatLabels.push({
      elem:      el,
      startTime: performance.now(),
      duration:  900,
      worldPos,
      riseRate:  0.0006,
      done:      false,
    });
  }

  private _onBattleOver(): void {
    if (this.finished) return;
    this.finished = true;

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
    this.log.push('=== Koniec bitwy: zwycięstwo ' + winMsg + ' ===');

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

  log.push('=== Natychmiastowy wynik: ' + (winner === 'atakujacy' ? 'ATAKUJACY' : 'OBRONCA') + ' wygrywa ===');
  return { winner, survivors, log };
}

// ---------------------------------------------------------------------------
// Fallback avatar
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

// ---------------------------------------------------------------------------
// Project world position to screen pixels
// ---------------------------------------------------------------------------

function worldToScreen(
  worldPos: THREE.Vector3,
  camera:   THREE.PerspectiveCamera,
  canvas:   HTMLCanvasElement,
): { x: number; y: number } | null {
  const v = worldPos.clone().project(camera);
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (w === 0 || h === 0) return null;
  return {
    x: ((v.x + 1) / 2) * w,
    y: ((-v.y + 1) / 2) * h,
  };
}

// ---------------------------------------------------------------------------
// Math helpers
// ---------------------------------------------------------------------------

function lerp(a: number, b: number, t: number): number { return a + (b - a) * t; }
function easeOut(t: number): number { return 1 - (1 - t) * (1 - t); }
function easeIn(t: number): number  { return t * t; }

// ---------------------------------------------------------------------------
// Colour lighten helper
// -----------------------------------------------------------// ---------------------------------------------------------------------------

/**
 * Lightens a 0xRRGGBB integer colour by a fractional amount (0..1).
 * amount = 0.08 blends 8% toward white.
 */
function lighten(color: number, amount: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8)  & 0xff;
  const b =  color        & 0xff;
  const rr = Math.round(r + (255 - r) * amount);
  const gg = Math.round(g + (255 - g) * amount);
  const bb = Math.round(b + (255 - b) * amount);
  return (rr << 16) | (gg << 8) | bb;
}

/**
 * Applies a dark-themed CSS button style.
 * @param btn    - The HTMLElement to style.
 * @param bgColor - CSS background colour string, e.g. '#c08030'.
 * @param fgColor - CSS foreground (text) colour string, e.g. '#fff'.
 */
function styleButton(btn: HTMLElement, bgColor: string, fgColor: string): void {
  Object.assign(btn.style, {
    padding:       '6px 18px',
    background:    bgColor,
    color:         fgColor,
    border:        '1px solid rgba(255,255,255,0.18)',
    borderRadius:  '4px',
    cursor:        'pointer',
    font:          '14px/1.4 sans-serif',
    letterSpacing: '0.03em',
  });
}
