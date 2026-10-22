// Reference generator — browser half — for MOD-08 unit overlays
// (R-RUSTPORT-P4-32-MOD08-UNIT-OVERLAY-Q1).
//
// Bundled by esbuild 0.24.0 (with three@0.169.0) into an IIFE and executed in
// headless Chromium 141 by gen.mjs. It imports the FOUR web modules of pin
// edb8fb56 UNCHANGED (git archive edb8fb56 gra/src gra/data → ../websrc):
//   render/unitOwnerEmblem.ts, render/unitStatPlate.ts,
//   render/unitUpgradeBadges.ts, render/unitVeteranBadges.ts
// and calls their REAL exported entry points (the ones render/units.ts and
// main.ts call: setUnitOwnerEmblemAssets, setUnitUpgradeBadgeAssets,
// ownerEmblemKey, ownerEmblemTexture, applyUnitStatPlate,
// applyUnitUpgradeBadgeRow, applyUnitVeteranBadgeStarCount, …) on a REAL
// Canvas 2D. No web function is transcribed here: every canvas pixel and every
// number below is produced by the web code itself.
//
// Environment adaptations (NOT web code changes), done by gen.mjs before this
// bundle runs:
//   - CanvasRenderingContext2D.prototype.font setter maps the web font stacks
//     onto the bundled faces (mapFont, same mapping as tests/fixtures/image/gen.mjs
//     = raster::image::emoji::source_chain), so Chromium and Rust use the same
//     font files;
//   - window.Image is wrapped to record every image the web code creates, so the
//     generator can wait for all `onload` callbacks (loadImageInto) to run.
//
// The page global `OVERLAY_INPUT` carries the asset strings: normalised SVGs
// (ui/icons/brandAssets.ts::normalizeSvg output, as main.ts:8526-8541 injects
// them) and JPG portraits as data: URIs.

import * as THREE from 'three';
import {
  ownerEmblemKey, ownerEmblemTexture, setUnitOwnerEmblemAssets, applyUnitOwnerEmblem,
  prepareSvgForCanvas,
} from '../websrc/gra/src/render/unitOwnerEmblem';
import * as Plate from '../websrc/gra/src/render/unitStatPlate';
import * as Upg from '../websrc/gra/src/render/unitUpgradeBadges';
import * as Vet from '../websrc/gra/src/render/unitVeteranBadges';

type Ctx = { civId: string | null; era: number; isCityState: boolean; isBarbarian: boolean };

declare const OVERLAY_INPUT: {
  svgs: Record<string, string>;
  portraits: Record<string, string>; // "<civ>|<era>" -> data URI
};
declare const OVERLAY_PENDING: Promise<unknown>[];

// ------------------------------------------------------------------ numbers
function hx(v: number): string {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, v, false);
  let s = '';
  for (let i = 0; i < 8; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}
function hx32(v: number): string {
  const dv = new DataView(new ArrayBuffer(4));
  dv.setFloat32(0, v, false);
  let s = '';
  for (let i = 0; i < 4; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}

// ------------------------------------------------------------------ textures
interface TexRec { id: string; tex: THREE.Texture; first: string; initial?: string }
const texById = new Map<THREE.Texture, TexRec>();
const snapshots: Record<string, string> = {}; // id -> base64 RGBA (straight)
function b64(u8: Uint8ClampedArray): string {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + 0x8000)));
  return btoa(s);
}
function snap(canvas: HTMLCanvasElement): string {
  const c = canvas.getContext('2d')!;
  return b64(c.getImageData(0, 0, canvas.width, canvas.height).data);
}
/** Registers a texture; on first sight takes the synchronous ("initial") snapshot. */
function texId(t: THREE.Texture | null | undefined, where: string): string | null {
  if (!t) return null;
  let r = texById.get(t);
  if (!r) {
    r = { id: 't' + texById.size, tex: t, first: where };
    r.initial = snap(t.image as HTMLCanvasElement);
    texById.set(t, r);
  }
  return r.id;
}

// ------------------------------------------------------------------ geometries / materials
const geoById = new Map<THREE.BufferGeometry, string>();
const geoRecs: unknown[] = [];
function geoId(g: THREE.BufferGeometry): string {
  let id = geoById.get(g);
  if (id) return id;
  id = 'g' + geoById.size;
  geoById.set(g, id);
  const arr = (name: string) => {
    const a = g.getAttribute(name);
    return a ? Array.from(a.array as Float32Array, hx32) : null;
  };
  geoRecs.push({
    id, type: g.type, params: JSON.parse(JSON.stringify((g as any).parameters ?? {}, (k, v) => (k === 'uuid' ? undefined : v))), // uuid is random
    vtx: g.getAttribute('position').count,
    index: g.index ? Array.from(g.index.array) : null,
    groups: g.groups.map((x) => [x.start, x.count, x.materialIndex ?? 0]),
    position: arr('position'), normal: arr('normal'), uv: arr('uv'),
  });
  return id;
}
const col = (c: THREE.Color | undefined) => (c ? [hx(c.r), hx(c.g), hx(c.b)] : null);
function matRec(m: THREE.Material, where: string): unknown {
  const a = m as any;
  return {
    type: m.type,
    color: col(a.color), emissive: col(a.emissive),
    map: texId(a.map, where + '.map'), emissiveMap: texId(a.emissiveMap, where + '.emissiveMap'),
    transparent: m.transparent, depthTest: m.depthTest, depthWrite: m.depthWrite, toneMapped: m.toneMapped,
    side: m.side, opacity: hx(m.opacity),
    roughness: a.roughness === undefined ? null : hx(a.roughness),
    metalness: a.metalness === undefined ? null : hx(a.metalness),
    flatShading: !!a.flatShading,
  };
}

// ------------------------------------------------------------------ trees
function dumpTree(root: THREE.Object3D, caseId: string): unknown[] {
  const nodes: unknown[] = [];
  const index = new Map<THREE.Object3D, number>();
  root.traverse((o) => {
    index.set(o, nodes.length);
    const rec: any = {
      type: o.type, name: o.name, parent: o.parent && index.has(o.parent) ? index.get(o.parent) : -1,
      p: [hx(o.position.x), hx(o.position.y), hx(o.position.z)],
      r: [hx(o.rotation.x), hx(o.rotation.y), hx(o.rotation.z), o.rotation.order],
      s: [hx(o.scale.x), hx(o.scale.y), hx(o.scale.z)],
      renderOrder: o.renderOrder, visible: o.visible,
      ud: Object.fromEntries(Object.entries(o.userData).filter(([, v]) => typeof v !== 'object')),
    };
    const where = `${caseId}#${nodes.length}`;
    if ((o as any).isMesh) {
      const m = o as THREE.Mesh;
      rec.geo = geoId(m.geometry);
      rec.mat = matRec(m.material as THREE.Material, where);
    }
    if ((o as any).isSprite) {
      const s = o as THREE.Sprite;
      rec.center = [hx(s.center.x), hx(s.center.y)];
      rec.mat = matRec(s.material, where);
    }
    nodes.push(rec);
  });
  return nodes;
}

// ------------------------------------------------------------------ inputs
const svg = (k: string) => OVERLAY_INPUT.svgs[k] ?? '';
const EMBLEM_ASSETS = {
  // ui/leaderPortraits.ts::leaderPortraitUrl is Vite-only (import.meta.glob); the
  // generator resolves the three portraits of the fixture set by (civ, era).
  leaderPortraitUrl: (civId: string, era: number) => OVERLAY_INPUT.portraits[`${civId}|${era}`] ?? null,
  civSigilSvg: (civId: string) => svg(`civ:${civId}`),
  barbarianSigilSvg: () => svg('chip-death'),
};
const BADGE_ASSETS = { barracksSvg: () => svg('bld-koszary'), forgeSvg: () => svg('bld-kuznia') };

const CTX: Record<string, Ctx> = {
  civ_grecy_2: { civId: 'grecy', era: 2, isCityState: false, isBarbarian: false },
  civ_zulusi_3: { civId: 'zulusi', era: 3, isCityState: false, isBarbarian: false },
  civ_egipt_1: { civId: 'egipt', era: 1, isCityState: false, isBarbarian: false },
  civ_grecy_1_noportrait: { civId: 'grecy', era: 1, isCityState: false, isBarbarian: false },
  civ_unknown_sigil: { civId: 'nieznana', era: 2, isCityState: false, isBarbarian: false },
  civ_nosigil: { civId: 'brak', era: 2, isCityState: false, isBarbarian: false },
  civ_null: { civId: null, era: 2, isCityState: false, isBarbarian: false },
  cs_grecy: { civId: 'grecy', era: 2, isCityState: true, isBarbarian: false },
  cs_zulusi: { civId: 'zulusi', era: 3, isCityState: true, isBarbarian: false },
  cs_nosigil: { civId: 'brak', era: 1, isCityState: true, isBarbarian: false },
  // whitespace around the civId: the key trims + lower-cases, the asset lookup only trims (:308 vs :365)
  cs_spaced: { civId: ' nieznana ', era: 1, isCityState: true, isBarbarian: false },
  barb: { civId: null, era: 2, isCityState: false, isBarbarian: true },
  barb_cs: { civId: 'grecy', era: 2, isCityState: true, isBarbarian: true },
};

const KEY_CTX: Ctx[] = [];
for (const civId of [null, '', '  ', 'grecy', ' Grecy ', 'RZYMIANIE', 'zulusi', 'x y']) {
  for (const era of [1, 2, 3, 0, -3, 2.5, 2.4999, 3.5, -0.5, NaN, Infinity, -Infinity, 1e9]) {
    for (const [cs, barb] of [[false, false], [true, false], [false, true], [true, true]] as const) {
      KEY_CTX.push({ civId, era, isCityState: cs, isBarbarian: barb });
    }
  }
}

type Vitals = Plate.UnitStatPlateVitals;
const U = undefined;
const VITALS: Record<string, Vitals> = {
  full: { ruchLeft: 2, ruchMax: 2, hp: 100, hpMax: 100, fieldPowerM: 42, ownerColor: 0x1e88e5 },
  half_move: { ruchLeft: 1, ruchMax: 2, hp: 75, hpMax: 100, fieldPowerM: 7, ownerColor: 0xe53935 },
  hp_mid_edge: { ruchLeft: 3, ruchMax: 3, hp: 60, hpMax: 100, fieldPowerM: 173, ownerColor: 0x43a047 },
  hp_mid: { ruchLeft: 0.5, ruchMax: 3, hp: 45, hpMax: 100, fieldPowerM: 1234, ownerColor: 0xffd54a },
  hp_low_edge: { ruchLeft: 1, ruchMax: 3, hp: 30, hpMax: 100, fieldPowerM: 99999, ownerColor: 0x8e24aa },
  hp_low: { ruchLeft: 0, ruchMax: 2, hp: 4, hpMax: 48, fieldPowerM: 0.5, ownerColor: 0x000000 },
  hp_zero: { ruchLeft: 2, ruchMax: 2, hp: 0, hpMax: 48, fieldPowerM: 0.4 },
  tiny: { ruchLeft: 0.001, ruchMax: 0.5, hp: 0.1, hpMax: 48, fieldPowerM: -5, ownerColor: 0xffffff },
  edge_0021: { ruchLeft: 0.0021, ruchMax: 1, hp: 0.002, hpMax: 1, fieldPowerM: 10, ownerColor: 0xff00ff },
  undef: { ruchLeft: U, ruchMax: U, hp: U, hpMax: U },
  undef_max: { ruchLeft: 1, ruchMax: U, hp: 10, hpMax: U, fieldPowerM: NaN },
  nan: { ruchLeft: NaN, ruchMax: 2, hp: 10, hpMax: NaN, fieldPowerM: Infinity, ownerColor: 0x123456 },
  inf: { ruchLeft: Infinity, ruchMax: 2, hp: -Infinity, hpMax: 10, fieldPowerM: 3 },
  neg: { ruchLeft: -1, ruchMax: 2, hp: -5, hpMax: 10, fieldPowerM: 100 },
  max_zero: { ruchLeft: 1, ruchMax: 0, hp: 5, hpMax: -3, fieldPowerM: 9 },
  over: { ruchLeft: 5, ruchMax: 2, hp: 200, hpMax: 100, fieldPowerM: 1000 },
  third: { ruchLeft: 1, ruchMax: 3, hp: 2, hpMax: 3, fieldPowerM: 2.5 },
  digits_568: { ruchLeft: 2, ruchMax: 3, hp: 61, hpMax: 100, fieldPowerM: 568, ownerColor: 0x00897b },
  pack_round: { ruchLeft: 0.12345, ruchMax: 1, hp: 0.6004, hpMax: 1, fieldPowerM: 1e21, ownerColor: 0xabcdef },
};

// ------------------------------------------------------------------ run
export async function run(): Promise<unknown> {
  const out: any = { keys: [], trees: [], textures: [], geos: geoRecs, consts: {}, labels: [], prepare: [] };

  // the inputs themselves (so the Rust test reads them instead of re-typing them)
  out.inputs = {
    ctx: Object.fromEntries(Object.entries(CTX).map(([k, c]) => [k, { ...c, era: hx(c.era) }])),
    vitals: Object.fromEntries(Object.entries(VITALS).map(([k, v]) => [k, Object.fromEntries(
      (['ruchLeft', 'ruchMax', 'hp', 'hpMax', 'fieldPowerM', 'ownerColor'] as const)
        .map((f) => [f, v[f] === undefined ? null : hx(v[f] as number)]),
    )])),
    portraits: Object.keys(OVERLAY_INPUT.portraits),
  };

  // keys (pure)
  for (const c of KEY_CTX) out.keys.push([c.civId, hx(c.era), c.isCityState, c.isBarbarian, ownerEmblemKey(c)]);

  // exported constants (bit-exact)
  const C: Record<string, number> = {
    PLATE_BAR_W: Plate.PLATE_BAR_W, PLATE_BAR_H: Plate.PLATE_BAR_H, PLATE_HP_BAR_Y: Plate.PLATE_HP_BAR_Y,
    PLATE_MOVE_BAR_Y: Plate.PLATE_MOVE_BAR_Y, PLATE_BAR_LEFT_X: Plate.PLATE_BAR_LEFT_X,
    PLATE_OWNER_ICON_SIZE: Plate.PLATE_OWNER_ICON_SIZE, PLATE_BAR_DY: Plate.PLATE_BAR_DY,
    BADGE_ROW_Y: Plate.BADGE_ROW_Y, GENERAL_SLOT_Y: Plate.GENERAL_SLOT_Y, GENERAL_SLOT_SIZE: Plate.GENERAL_SLOT_SIZE,
    PLATE_MAX_HALF_WIDTH: Plate.PLATE_MAX_HALF_WIDTH, PLATE_TILT_RAD: Plate.PLATE_TILT_RAD, PLATE_FILL_Z: Plate.PLATE_FILL_Z,
    VETERAN_BADGE_RESERVED_Y: Upg.VETERAN_BADGE_RESERVED_Y, VETERAN_STAR_R: Upg.VETERAN_STAR_R,
    VETERAN_STAR_SPACING: Upg.VETERAN_STAR_SPACING, VETERAN_STAR_OUTLINE_SCALE: Upg.VETERAN_STAR_OUTLINE_SCALE,
    BADGE_ROW_TILT_RAD: Upg.BADGE_ROW_TILT_RAD,
    PATH_BADGE_COLOR_1: Upg.PATH_BADGE_COLOR[1], PATH_BADGE_COLOR_2: Upg.PATH_BADGE_COLOR[2], PATH_BADGE_COLOR_3: Upg.PATH_BADGE_COLOR[3],
    VETERAN_BADGE_COLOR: Vet.VETERAN_BADGE_COLOR, VETERAN_BADGE_OUTLINE_COLOR: Vet.VETERAN_BADGE_OUTLINE_COLOR,
  };
  for (const [k, v] of Object.entries(C)) out.consts[k] = hx(v);
  out.consts.VETERAN_BADGE_HIT_UD = Vet.VETERAN_BADGE_HIT_UD;
  for (const l of [0, 1, 2, 3] as const) out.labels.push([l, Upg.pathBadgeLabel(l)]);

  // ---- phase 1: assets injected (game configuration, main.ts:8526-8541)
  setUnitOwnerEmblemAssets(EMBLEM_ASSETS);
  Upg.setUnitUpgradeBadgeAssets(BADGE_ASSETS);
  for (const [name, c] of Object.entries(CTX)) {
    out.textures.push({ role: 'emblem', phase: 'assets', ctx: name, key: ownerEmblemKey(c), tex: texId(ownerEmblemTexture(c), 'emblem:' + name) });
  }
  // stat plates
  const plateCtx: Array<[string, Ctx | null]> = [['none', null], ['civ_grecy_2', CTX.civ_grecy_2], ['cs_zulusi', CTX.cs_zulusi], ['barb', CTX.barb]];
  for (const [cn, c] of plateCtx) {
    for (const [vn, v] of Object.entries(VITALS)) {
      if (cn !== 'civ_grecy_2' && !['full', 'hp_mid', 'undef'].includes(vn)) continue;
      const g = new THREE.Group(); g.name = 'token';
      Plate.applyUnitStatPlate(g, c, v);
      const id = `plate:${cn}:${vn}`;
      out.trees.push({ id, kind: 'plate', ctx: cn, vitals: vn, nodes: dumpTree(g, id) });
    }
  }
  // history: same token driven through several states, then a final state (sync() semantics)
  const HIST: Array<[string, Array<[string, string]>]> = [
    ['h1', [['civ_grecy_2', 'full'], ['civ_grecy_2', 'hp_low'], ['civ_grecy_2', 'half_move']]],
    ['h2', [['barb', 'hp_zero'], ['civ_grecy_2', 'hp_zero'], ['civ_grecy_2', 'over']]],
    ['h3', [['none', 'full'], ['none', 'full'], ['cs_zulusi', 'undef'], ['cs_zulusi', 'hp_mid']]],
    ['h4', [['civ_grecy_2', 'hp_mid'], ['civ_grecy_2', 'tiny'], ['civ_grecy_2', 'hp_mid']]],
  ];
  for (const [hn, steps] of HIST) {
    const g = new THREE.Group(); g.name = 'token';
    for (const [cn, vn] of steps) Plate.applyUnitStatPlate(g, cn === 'none' ? null : CTX[cn], VITALS[vn]);
    const [lc, lv] = steps[steps.length - 1];
    const id = `hist:${hn}`;
    out.trees.push({ id, kind: 'plate', ctx: lc, vitals: lv, history: steps, nodes: dumpTree(g, id) });
  }
  // upgrade badge rows (levels per path + star count)
  for (const armor of [0, 1, 2, 3] as const) {
    for (const soft of [0, 1, 2, 3] as const) {
      for (const stars of [0, 1, 2, 3, 4]) {
        if (stars === 4 && !(armor === 3 && soft === 3)) continue;
        const g = new THREE.Group(); g.name = 'token';
        Upg.applyUnitUpgradeBadgeRow(g, armor, soft, stars);
        const id = `badges:${armor}:${soft}:${stars}`;
        out.trees.push({ id, kind: 'badges', armor, soft, stars, nodes: dumpTree(g, id) });
      }
    }
  }
  {
    const g = new THREE.Group(); g.name = 'token';
    Upg.applyUnitUpgradeBadgeRow(g, 3, 1, 3);
    Upg.applyUnitUpgradeBadgeRow(g, 0, 0, 2);
    Upg.applyUnitUpgradeBadgeRow(g, 2, 0, 1);
    out.trees.push({ id: 'hist:badges', kind: 'badges', armor: 2, soft: 0, stars: 1, nodes: dumpTree(g, 'hist:badges') });
  }
  // veteran stars
  for (const n of [0, 1, 2, 3] as const) {
    const g = new THREE.Group(); g.name = 'token';
    Vet.applyUnitVeteranBadgeStarCount(g, n);
    out.trees.push({ id: `vet:${n}`, kind: 'veteran', stars: n, nodes: dumpTree(g, `vet:${n}`) });
  }
  for (const lv of [1, 2, 3] as const) {
    const g = new THREE.Group(); g.name = 'token';
    Vet.applyUnitVeteranBadgeLevel(g, lv);
    out.trees.push({ id: `vetLevel:${lv}`, kind: 'veteranLevel', level: lv, nodes: dumpTree(g, `vetLevel:${lv}`) });
  }
  {
    const g = new THREE.Group(); g.name = 'token';
    Vet.applyUnitVeteranBadgeStarCount(g, 3);
    Vet.applyUnitVeteranBadgeStarCount(g, 0);
    Vet.applyUnitVeteranBadgeStarCount(g, 2);
    out.trees.push({ id: 'hist:vet', kind: 'veteran', stars: 2, nodes: dumpTree(g, 'hist:vet') });
  }
  // legacy medallion sprite (tools/.zeton-max previews only; the game does not call it)
  for (const cn of ['civ_grecy_2', 'barb']) {
    const g = new THREE.Group(); g.name = 'token';
    applyUnitOwnerEmblem(g, CTX[cn]);
    out.trees.push({ id: `legacy:${cn}`, kind: 'legacyEmblem', ctx: cn, nodes: dumpTree(g, `legacy:${cn}`) });
  }
  {
    const g = new THREE.Group(); g.name = 'token';
    applyUnitOwnerEmblem(g, CTX.barb);
    applyUnitOwnerEmblem(g, null);
    out.trees.push({ id: 'legacy:null', kind: 'legacyEmblem', ctx: 'none', nodes: dumpTree(g, 'legacy:null') });
  }

  // ---- phase 2: NO injected assets (previews / gallery / tests: disc + glyph, plate only)
  setUnitOwnerEmblemAssets(null);
  Upg.setUnitUpgradeBadgeAssets(null);
  // barb_cs (barbarian AND city-state) is the FIRST context of key 'barb' in this phase:
  // the variant must be 'barbarian' (checked before isCityState, :340-344).
  for (const name of ['civ_grecy_2', 'cs_grecy', 'barb_cs']) {
    const c = CTX[name];
    out.textures.push({ role: 'emblem', phase: 'noassets', ctx: name, key: ownerEmblemKey(c), tex: texId(ownerEmblemTexture(c), 'emblem-noassets:' + name) });
  }
  for (const [armor, soft] of [[1, 2], [3, 0]] as const) {
    const g = new THREE.Group(); g.name = 'token';
    Upg.applyUnitUpgradeBadgeRow(g, armor, soft, 2);
    const id = `badges-noassets:${armor}:${soft}:2`;
    out.trees.push({ id, kind: 'badges', noAssets: true, armor, soft, stars: 2, nodes: dumpTree(g, id) });
  }

  // ---- wait for every image the web code created, then one more task so that
  // every `img.onload` (loadImageInto) has redrawn its canvas.
  await Promise.all(OVERLAY_PENDING);
  await new Promise((r) => setTimeout(r, 50));

  const texList: unknown[] = [];
  for (const r of texById.values()) {
    const t = r.tex as THREE.CanvasTexture;
    const cv = t.image as HTMLCanvasElement;
    const fin = snap(cv);
    snapshots[r.id] = fin;
    texList.push({
      id: r.id, first: r.first, w: cv.width, h: cv.height, minFilter: t.minFilter, magFilter: t.magFilter,
      generateMipmaps: t.generateMipmaps, colorSpace: t.colorSpace, flipY: t.flipY, version: t.version,
      initialEqualsFinal: r.initial === fin,
    });
    if (r.initial !== fin) snapshots[r.id + '.initial'] = r.initial!;
  }
  out.textureList = texList;
  out.snapshots = snapshots;
  out.prepareCheck = prepareSvgForCanvas(svg('bld-koszary'), '#b9762e', 1.6).length;
  return out;
}
(window as any).OVERLAY_RUN = run;
