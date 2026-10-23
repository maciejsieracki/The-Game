// Reference generator — browser half — for MOD-10 city overlays
// (R-RUSTPORT-P4-33-MOD10-CITY-CHIP-Q1).
//
// Bundled by esbuild 0.24.0 (with three@0.169.0) into an IIFE and executed in
// headless Chromium 141 (canvases) and in node 22 (numbers) by gen.mjs. It
// imports the THREE web modules of pin edb8fb56 UNCHANGED
// (git archive edb8fb56 gra/src gra/data → ../websrc):
//   render/cityMapStatChip.ts, render/cityOkolicaOverlay.ts,
//   render/workerFieldOverlay.ts
// and calls their REAL exported entry points (the ones render/cities.ts and
// main.ts call: setCityMapBadgeCivSigil / LeaderPortrait / ProdIcon,
// makeCityMapBadgeSprite, cityMapBadgeKey, disposeCityMapBadgeTexturesForOtherLod,
// wallKindFromBuilt, defenseTierFromCity, civInitialForIconId,
// buildCityOkolicaOverlayGroup, buildWorkerFieldOverlayGroup,
// syncWorkerFieldOverlay, syncWorkerFieldOverlayFog, workerOwnerColor(Rgba)).
// The game-rule input of the okolica overlay (`hexHasCoveringTerrainImprovement`)
// is computed by the REAL game function and handed to Rust as data.
//
// Environment adaptations (NOT web code changes), done by gen.mjs before this
// bundle runs: the canvas `font` setter maps the web font stacks onto the
// bundled faces (mapFont); window.Image is wrapped to wait for every onload;
// the setters fillStyle / shadowColor / shadowBlur / shadowOffsetY and the
// calls clearRect / fillText / save / restore are wrapped to RECORD a draw
// trace per canvas (canvas.__civTrace, reset by clearRect = start of a paint;
// the text event carries the RAW font string the web set, before mapFont).
// The wrappers only record and then call the native implementation.

import * as THREE from 'three';
import * as Chip from '../websrc/gra/src/render/cityMapStatChip';
import * as Oko from '../websrc/gra/src/render/cityOkolicaOverlay';
import * as Wf from '../websrc/gra/src/render/workerFieldOverlay';
import { hexHasCoveringTerrainImprovement } from '../websrc/gra/src/game/terrain-improvements';
import { TerenBazowy } from '../websrc/gra/src/types/hex';

declare const CITY_INPUT: {
  svgs: Record<string, string>; // id -> normalised SVG
  portraits: Record<string, string>; // "<civ>|<era>" -> data URI
  page: string; // 'main' | 'dpr2' | 'dpr15' | 'node'
};
declare const CITY_PENDING: Promise<unknown>[];

// ------------------------------------------------------------------ numbers
function hx(v: number): string {
  const dv = new DataView(new ArrayBuffer(8));
  dv.setFloat64(0, v, false);
  let s = '';
  for (let i = 0; i < 8; i++) s += dv.getUint8(i).toString(16).padStart(2, '0');
  return s;
}
function hxa(a: ArrayLike<number>): string {
  let s = '';
  for (let i = 0; i < a.length; i++) s += hx(a[i]!);
  return s;
}
function hx32a(a: ArrayLike<number>): string {
  const dv = new DataView(new ArrayBuffer(4));
  let s = '';
  for (let i = 0; i < a.length; i++) {
    dv.setFloat32(0, a[i]!, false);
    for (let k = 0; k < 4; k++) s += dv.getUint8(k).toString(16).padStart(2, '0');
  }
  return s;
}

// ------------------------------------------------------------------ canvases
const snapshots: Record<string, string> = {};
/** Draw trace of the paint behind each snapshot id (P4-33 r2, gen.mjs hooks). */
const traces: Record<string, unknown> = {};
const traceConflicts: string[] = [];
function b64(u8: Uint8ClampedArray): string {
  let s = '';
  for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, Array.from(u8.subarray(i, i + 0x8000)));
  return btoa(s);
}
/** Snapshot of a canvas (getImageData), deduplicated by content; returns the file id. */
function snap(canvas: HTMLCanvasElement): string {
  const c = canvas.getContext('2d')!;
  const data = c.getImageData(0, 0, canvas.width, canvas.height).data;
  const s = b64(data);
  const tr = JSON.stringify((canvas as any).__civTrace ?? null);
  for (const [id, v] of Object.entries(snapshots)) {
    if (v === s) {
      if (JSON.stringify(traces[id]) !== tr) traceConflicts.push(id);
      return id;
    }
  }
  const id = 'r' + Object.keys(snapshots).length;
  snapshots[id] = s;
  traces[id] = JSON.parse(tr);
  return id;
}
async function settle(): Promise<void> {
  // every img created so far has fired load/error; the onload handlers ran in the same dispatch
  while (CITY_PENDING.length) await Promise.all(CITY_PENDING.splice(0));
  await new Promise((r) => setTimeout(r, 0));
  if (CITY_PENDING.length) await settle();
}
function texMeta(t: THREE.Texture): Record<string, unknown> {
  const cv = t.image as HTMLCanvasElement;
  return {
    w: cv.width, h: cv.height, minFilter: t.minFilter, magFilter: t.magFilter,
    generateMipmaps: t.generateMipmaps, colorSpace: t.colorSpace, flipY: t.flipY, version: t.version,
  };
}

// ------------------------------------------------------------------ sprites / overlay groups
function spriteRec(s: THREE.Sprite): Record<string, unknown> {
  const m = s.material as THREE.SpriteMaterial;
  return {
    type: s.type, name: s.name,
    p: hxa([s.position.x, s.position.y, s.position.z]),
    r: hxa([s.rotation.x, s.rotation.y, s.rotation.z]),
    s: hxa([s.scale.x, s.scale.y, s.scale.z]),
    c: hxa([s.center.x, s.center.y]),
    ro: s.renderOrder, visible: s.visible,
    ud: s.userData.hexKey !== undefined || s.userData.labelWorldHeight !== undefined
      ? { hexKey: s.userData.hexKey ?? null, lwh: s.userData.labelWorldHeight === undefined ? null : hx(s.userData.labelWorldHeight) }
      : null,
    mat: {
      type: m.type, color: hxa([m.color.r, m.color.g, m.color.b]), map: !!m.map,
      transparent: m.transparent, depthTest: m.depthTest, depthWrite: m.depthWrite, toneMapped: m.toneMapped,
      opacity: hx(m.opacity), fogBase: m.userData.fogBaseOpacity === undefined ? null : hx(m.userData.fogBaseOpacity),
      rotation: hx(m.rotation), sizeAttenuation: m.sizeAttenuation,
    },
  };
}
function kindOf(o: THREE.Object3D): string {
  if ((o as THREE.InstancedMesh).isInstancedMesh) return 'InstancedMesh';
  if ((o as THREE.Mesh).isMesh) return 'Mesh';
  if ((o as THREE.Sprite).isSprite) return 'Sprite';
  if ((o as THREE.LineSegments).isLineSegments) return 'LineSegments';
  if ((o as THREE.Line).isLine) return 'Line';
  if ((o as THREE.Group).isGroup) return 'Group';
  return 'Object3D';
}
function overlayRec(group: THREE.Object3D): Record<string, unknown> {
  const objects: unknown[] = [];
  for (const o of group.children) {
    const m = o as THREE.Mesh;
    const g = m.geometry;
    const mat = m.material as THREE.MeshBasicMaterial;
    const rec: Record<string, unknown> = {
      k: kindOf(o), name: o.name, ro: o.renderOrder, fc: o.frustumCulled,
      p: hxa([o.position.x, o.position.y, o.position.z]), s: hxa([o.scale.x, o.scale.y, o.scale.z]),
      mat: {
        t: mat.type, color: mat.color.getHex(), lin: hxa([mat.color.r, mat.color.g, mat.color.b]),
        transparent: mat.transparent, opacity: hx(mat.opacity), dw: mat.depthWrite, dt: mat.depthTest, side: mat.side,
        po: mat.polygonOffset, pof: hx(mat.polygonOffsetFactor), pou: hx(mat.polygonOffsetUnits),
      },
      pos: hx32a(g.getAttribute('position').array as Float32Array),
      nor: g.getAttribute('normal') ? hx32a(g.getAttribute('normal').array as Float32Array) : null,
      uv: g.getAttribute('uv') ? hx32a(g.getAttribute('uv').array as Float32Array) : null,
      idx: g.index ? Array.from(g.index.array) : null,
    };
    if ((o as THREE.InstancedMesh).isInstancedMesh) {
      const im = o as THREE.InstancedMesh;
      rec.count = im.count;
      rec.inst = hx32a(im.instanceMatrix.array as Float32Array);
    }
    objects.push(rec);
  }
  return { name: group.name, type: group.type, objects };
}

// ------------------------------------------------------------------ chip assets (main.ts:8531-8535)
const svg = (id: string) => CITY_INPUT.svgs[id] ?? '';
const civSigil = (id: string) => {
  const k = (id || '').trim().toLowerCase();
  return k === 'brak' ? '' : svg('civ:' + k) || svg('civ:nieznana'); // civIconSvg falls back to civ-default
};
// Test portrait source: the three bundled portraits by "<trimmed lower civ>|<max(1, round(era) || 1)>"
// (the real leaderPortraitUrl needs import.meta.glob; same keying rule as leaderPortraitCacheKey).
const portraitUrl = (civ: string, era: number) => {
  const k = `${(civ || '').trim().toLowerCase()}|${Math.max(1, Math.round(era) || 1)}`;
  return CITY_INPUT.portraits[k] ?? null;
};
const prodIcon = (kind: string, id: string) => {
  if (kind === 'budynek') return id === 'spichlerz' ? svg('bld-spichlerz') : '';
  return id === 'Wlocznik' ? svg('unit-spear') : '';
};
function setChipAssets(): void {
  Chip.setCityMapBadgeCivSigil(civSigil);
  Chip.setCityMapBadgeLeaderPortrait(portraitUrl);
  Chip.setCityMapBadgeProdIcon(prodIcon as never);
}

type In = Chip.CityMapBadgeInput;
const BASE: In = { cityName: 'Ateny', population: 3, defenseTier: 0, civIconId: 'grecy' };
const CHIPS: Array<[string, In]> = [
  ['minimal', BASE],
  ['major_full', { cityName: 'Sparta', population: 7, defenseTier: 2, civIconId: 'grecy', ownerColor: 0x1e88e5, prodActive: true, prodKind: 'budynek', prodId: 'spichlerz', growthPercent: 5.5, isCapital: true, era: 2 }],
  ['zulu_capital_long', { cityName: 'uMgungundlovu', population: 12, defenseTier: 1, civIconId: 'zulusi', ownerColor: 0xe53935, prodActive: true, prodKind: 'jednostka', prodId: 'Wlocznik', growthPercent: -99.9, isCapital: true, era: 3 }],
  ['widest', { cityName: 'Kartagena Hiszpańska Wielka', population: 23, defenseTier: 2, civIconId: 'zulusi', ownerColor: 0x43a047, prodActive: true, prodKind: 'budynek', prodId: 'spichlerz', growthPercent: -100.5, isCapital: true, era: 3 }],
  ['city_state', { cityName: 'Delfy', population: 4, defenseTier: 1, civIconId: 'zulusi', ownerColor: 0xe53935, isCityState: true, era: 3 }],
  ['cs_nosigil', { cityName: 'Bez Sygnetu', population: 2, defenseTier: 0, civIconId: 'brak', isCityState: true }],
  ['egipt', { cityName: 'Memfis', population: 5, defenseTier: 0, civIconId: 'egipt', ownerColor: 0xfb8c00, era: 1, growthPercent: 0 }],
  ['unknown_civ', { cityName: 'Nowe Miasto', population: 1, defenseTier: 2, civIconId: 'nieznana', ownerColor: 0x8e24aa, era: 2, growthPercent: 12.25 }],
  ['spaced_civ', { cityName: '  Teby  ', population: 2.9, defenseTier: 0, civIconId: ' Grecy ', era: 2.4 }],
  ['starving', { cityName: 'Głodów', population: 6, defenseTier: 1, civIconId: 'grecy', growthPercent: 3, growthStarving: true, era: 1 }],
  ['neg_zero', { cityName: 'Zero', population: 0, defenseTier: 0, civIconId: 'grecy', growthPercent: -0.04 }],
  ['nan_pop', { cityName: 'straße łódź', population: NaN, defenseTier: 0, civIconId: 'grecy', ownerColor: 0x000000 }],
  ['empty_name', { cityName: '', population: 1234, defenseTier: 0, civIconId: '' }],
  ['blank_name', { cityName: '   ', population: 99, defenseTier: 1, civIconId: 'grecy', era: 2 }],
  ['prod_no_kind', { cityName: 'Bez Rodzaju', population: 3, defenseTier: 0, civIconId: 'grecy', prodActive: true, prodKind: null, prodId: 'spichlerz', era: 2 }],
  ['prod_unknown_icon', { cityName: 'Pusta Ikona', population: 3, defenseTier: 0, civIconId: 'grecy', prodActive: true, prodKind: 'budynek', prodId: 'nieistnieje', era: 1 }],
  ['hover_full', { cityName: 'Korynt', population: 8, defenseTier: 2, civIconId: 'grecy', ownerColor: 0x00acc1, prodActive: true, prodKind: 'budynek', prodId: 'spichlerz', growthPercent: 2.5, hoverExpanded: true, prodCategoryLabel: 'Budynek', prodItemName: 'Spichlerz', resourceWarning: true, era: 2 }],
  ['hover_paused', { cityName: 'Argos', population: 2, defenseTier: 0, civIconId: 'zulusi', hoverExpanded: true, prodPaused: true, era: 3 }],
  ['hover_paused_item', { cityName: 'Megara', population: 2, defenseTier: 0, civIconId: 'zulusi', hoverExpanded: true, prodPaused: true, prodItemName: ' Koszary ', prodCategoryLabel: '  ', era: 3 }],
  ['hover_warning_only', { cityName: 'Ur', population: 3, defenseTier: 0, civIconId: 'egipt', hoverExpanded: true, resourceWarning: true, era: 1 }],
  ['hover_truncated', { cityName: 'Uruk', population: 3, defenseTier: 0, civIconId: 'egipt', hoverExpanded: true, prodCategoryLabel: 'Jednostka', prodItemName: 'Bardzo długa nazwa jednostki oblężniczej z epoki brązu', resourceWarning: true, era: 1 }],
  ['hover_no_detail', { cityName: 'Pella', population: 3, defenseTier: 0, civIconId: 'grecy', hoverExpanded: true, prodCategoryLabel: '', era: 2 }],
  ['capital_only', { cityName: 'Stolica', population: 10, defenseTier: 0, civIconId: 'grecy', isCapital: true, era: 2 }],
  ['lod1', { cityName: 'Ur', population: 3, defenseTier: 2, civIconId: 'egipt', era: 1, lodLevel: 1, isCapital: true, growthPercent: 1.5 }],
  ['lod2', { cityName: 'Ur', population: 3, defenseTier: 1, civIconId: 'zulusi', era: 3, lodLevel: 2, prodActive: true, prodKind: 'budynek', prodId: 'spichlerz' }],
  ['lod15', { cityName: 'Ur', population: 3, defenseTier: 0, civIconId: 'grecy', era: 2, lodLevel: 1.5 }],
];
// no injected assets at all (setters never called): disc + ◆, no production icon
const CHIPS_NO_ASSETS: Array<[string, In]> = [
  ['na_major', CHIPS[1]![1]],
  ['na_city_state', CHIPS[4]![1]],
];
const DPR_CHIPS: Record<string, string[]> = {
  main: [],
  dpr2: ['major_full', 'lod2', 'hover_full'],
  dpr15: ['zulu_capital_long'],
};

async function chip(name: string, input: In, out: any, cache: Map<string, THREE.CanvasTexture>): Promise<void> {
  const key = Chip.cityMapBadgeKey(input);
  const had = cache.has(key);
  const sprite = Chip.makeCityMapBadgeSprite(input, cache);
  const tex = (sprite.material as THREE.SpriteMaterial).map as THREE.CanvasTexture;
  // the synchronous first paint is kept only for the ×1 badges (fixture size; the LOD / DPI
  // variants differ from their ×1 badge only by the canvas scale)
  const big = CITY_INPUT.page !== 'main' || input.lodLevel != null;
  const initial = big ? null : snap(tex.image as HTMLCanvasElement);
  const initialMeta = texMeta(tex);
  await settle();
  const fin = snap(tex.image as HTMLCanvasElement);
  out.chips.push({
    id: name, page: CITY_INPUT.page, dpr: window.devicePixelRatio, key, cached: had,
    initial, final: fin, initialMeta, meta: texMeta(tex), sprite: spriteRec(sprite),
  });
}

// ------------------------------------------------------------------ okolica / worker map
const T = TerenBazowy;
const TERRAINS = [T.Laka, T.Rownina, T.Wzgorza, T.Laka, T.PlytkieMorze, T.Pustynia, T.Rownina, T.Polarny, T.Laka, T.Gory, T.Morze];
interface Hx { coords: { q: number; r: number }; terenBazowy: TerenBazowy; ulepszenie?: string; ulepszenia?: string[] }
const hexes: Record<string, Hx> = {};
for (let q = -5; q <= 5; q++) {
  for (let r = -5; r <= 5; r++) {
    if (Math.abs(q + r) > 5) continue;
    if (q === 4 && r === -1) continue; // a hole inside the area
    const i = ((q * 7 + r * 3) % TERRAINS.length + TERRAINS.length) % TERRAINS.length;
    const h: Hx = { coords: { q, r }, terenBazowy: TERRAINS[i]! };
    const m = ((q * 5 - r * 11) % 9 + 9) % 9;
    if (m === 0) h.ulepszenie = 'farma';
    else if (m === 1) h.ulepszenie = 'droga';
    else if (m === 2) h.ulepszenia = ['droga', 'droga_brukowana'];
    else if (m === 3) h.ulepszenia = ['droga', 'kopalnia_miedzi'];
    else if (m === 4) h.ulepszenie = 'brak';
    hexes[`${q},${r}`] = h;
  }
}
hexes['0,0']!.terenBazowy = T.Laka;
hexes['0,0']!.ulepszenie = 'farma'; // centre with a covering improvement: still labelled (:292)
const MAP = { hexes, seed: 12345, width: 11, height: 11 };
function yieldOf(q: number, r: number): { zywnosc?: number; praca?: number; handel?: number } {
  // the centre (covering improvement 'farma') has real yields: its label must stay (:286-292)
  if (q === 0 && r === 0) return { zywnosc: 2, praca: 1, handel: 1 };
  const v = ((q * 13 + r * 7) % 11 + 11) % 11;
  switch (v) {
    case 0: return {};
    case 1: return { zywnosc: 2 };
    case 2: return { zywnosc: 3, praca: 1 };
    case 3: return { zywnosc: 1, praca: 2, handel: 1 };
    case 4: return { praca: 0, handel: 2 };
    case 5: return { zywnosc: 12, praca: 1.5, handel: 0.25 };
    case 6: return { zywnosc: -1, praca: NaN, handel: 3 };
    case 7: return { zywnosc: 0 };
    case 8: return { zywnosc: 4, praca: 4, handel: 4 };
    case 9: return { zywnosc: 1e21, handel: 1e-7 };
    default: return { zywnosc: 2, handel: 1 };
  }
}
interface OkoCase { id: string; cityQ: number; cityR: number; range: number; worked: string[]; showYields?: boolean; ownerId?: number }
const OKO: OkoCase[] = [
  { id: 'r2_default', cityQ: 0, cityR: 0, range: 2, worked: ['1,0', '0,1', '-1,1', '2,-1'] },
  { id: 'r3_owner3', cityQ: 0, cityR: 0, range: 3, worked: ['1,-1', '-2,1', '0,-3', '3,0', '2,1'], ownerId: 3, showYields: true },
  { id: 'r1_no_worked_hidden', cityQ: 1, cityR: 1, range: 1, worked: [], showYields: false },
  { id: 'r25_owner9', cityQ: -1, cityR: 0, range: 2.5, worked: ['-1,1', '0,0', '-2,0'], ownerId: 9 },
  { id: 'nan_range', cityQ: 0, cityR: 0, range: NaN, worked: ['1,0'] },
  { id: 'edge', cityQ: 3, cityR: -1, range: 2, worked: ['4,-2', '3,0', '9,9'], ownerId: 1 },
  { id: 'r1_no_worked', cityQ: -2, cityR: 2, range: 1, worked: [] },
];
interface WfCase { id: string; worked: Array<[string, number]>; player?: number }
const WFC: WfCase[] = [
  { id: 'mixed', worked: [['1,0', 0], ['0,1', 1], ['2,-1', 0], ['-1,1', 9], ['1,1', -1], ['0,2', 1.5], ['-2,1', 2], ['9,9', 1], ['-1,-1', 3], ['3,0', 7], ['2,2', 0]] },
  { id: 'player2', worked: [['1,0', 0], ['0,1', 2], ['-1,2', 2], ['2,-2', 5]], player: 2 },
  { id: 'empty', worked: [] },
];

// ------------------------------------------------------------------ run
export async function run(): Promise<unknown> {
  const out: any = { chips: [], helpers: {}, consts: {}, okolica: [], worker: [], workerTex: [], inputs: {} };
  const page = CITY_INPUT.page;
  const cache = new Map<string, THREE.CanvasTexture>();

  if (page !== 'node') {
    const list = page === 'main' ? CHIPS : CHIPS.filter(([n]) => DPR_CHIPS[page]!.includes(n));
    if (page === 'main') for (const [n, i] of CHIPS_NO_ASSETS) await chip(n, i, out, cache);
    // the injected-assets phase uses its own caller cache (the no-asset badges share keys with it)
    cache.clear();
    setChipAssets();
    for (const [n, i] of list) {
      setChipAssets(); // clears the image caches: every badge goes the cold path (initial = no image)
      await chip(n, i, out, cache);
    }
    if (page === 'main') {
      // a key already in the caller's cache: the same texture object, no new paint
      await chip('cached_minimal', BASE, out, cache);
      // legacy overload (cityName, population); cold image caches like every other badge
      setChipAssets();
      const s = Chip.makeCityMapBadgeSprite('Legacy', 4, cache);
      const tex = (s.material as THREE.SpriteMaterial).map as THREE.CanvasTexture;
      const initial = snap(tex.image as HTMLCanvasElement);
      const initialMeta = texMeta(tex);
      await settle();
      out.chips.push({ id: 'legacy', page, dpr: window.devicePixelRatio, key: Chip.cityMapBadgeKey('Legacy', 4), legacyKey: true, cached: false, initial, final: snap(tex.image as HTMLCanvasElement), initialMeta, meta: texMeta(tex), sprite: spriteRec(s) });
      // drawCityMapBadgeCanvas without images
      out.drawCanvas = snap(Chip.drawCityMapBadgeCanvas(CHIPS[16]![1]));
      out.drawCanvasLegacy = snap(Chip.drawCityMapBadgeCanvasLegacy('Legacy', 4));
      // LOD purge on the cache keys
      out.purge = [0, 1, 2, 1.5, undefined].map((l) => {
        const m = new Map<string, THREE.CanvasTexture>();
        for (const k of cache.keys()) m.set(k, { dispose() {} } as never);
        const before = [...m.keys()];
        const n = Chip.disposeCityMapBadgeTexturesForOtherLod(m, l as number);
        return { lod: l === undefined ? null : hx(l), freed: n, kept: [...m.keys()], before };
      });
    }
  }

  if (page === 'main' || page === 'node') {
    out.inputs.chips = Object.fromEntries([...CHIPS, ...CHIPS_NO_ASSETS].map(([n, i]) => [n, {
      ...i,
      population: hx(i.population),
      growthPercent: i.growthPercent == null ? null : hx(i.growthPercent),
      era: i.era == null ? null : hx(i.era),
      lodLevel: i.lodLevel == null ? null : hx(i.lodLevel),
    }]));
    out.inputs.legacy = { cityName: 'Legacy', population: 4 };
    // helpers (pure)
    const built = [null, [], ['palisada'], ['mury'], ['fort'], ['palisada', 'fort'], ['koszary'], ['palisada', 'mury']];
    out.helpers.walls = built.map((b) => [b, Chip.wallKindFromBuilt(b), Chip.defenseTierFromCity(b, true)]);
    out.helpers.tiers = (['none', 'palisada', 'stone'] as const).map((k) => [k, Chip.defenseTierFromWallKind(k)]);
    out.helpers.initials = ['grecy', ' Grecy ', 'RZYM', 'zulusi', 'celtowie', 'germanie', 'mongolowie', 'bizancjum', 'łotysze',
      'śląsk', 'ßab', '9lives', '', '   ', 'x', 'ąb', 'émigré', '\u{1F600}x', 'Æsir', 'nieznana']
      .map((s) => [s, Chip.civInitialForIconId(s)]);
    out.helpers.keys = [...CHIPS, ...CHIPS_NO_ASSETS].map(([n, i]) => [n, Chip.cityMapBadgeKey(i)]);
    out.helpers.ownerColors = [0, 1, 7, 8, 9, -1, 1.5, -0, NaN, 1e9, 16].map((o) => [hx(o), Wf.workerOwnerColor(o) ?? null, Wf.workerOwnerColorRgba(o, 0.72), Wf.workerOwnerColorRgba(o, 1)]);
    out.consts.styles = {
      range: Oko.CITY_RANGE_OVERLAY_STYLE, center: Oko.CITY_CENTER_OVERLAY_STYLE, worked: Oko.CITY_WORKED_OVERLAY_STYLE,
    };
    out.consts.workerOwnerColors = Wf.WORKER_OWNER_COLORS;

    // map inputs (terrain, covering improvements by the REAL game function, yields)
    out.inputs.map = Object.values(hexes).map((h) => [h.coords.q, h.coords.r, h.terenBazowy, hexHasCoveringTerrainImprovement(h as never)]);
    out.inputs.seed = MAP.seed;
    out.inputs.yields = Object.values(hexes).map((h) => {
      const y = yieldOf(h.coords.q, h.coords.r);
      return [h.coords.q, h.coords.r, ...(['zywnosc', 'praca', 'handel'] as const).map((k) => (y[k] === undefined ? null : hx(y[k]!)))];
    });
    out.inputs.okolica = OKO.map((c) => ({ ...c, range: hx(c.range), ownerId: c.ownerId === undefined ? null : hx(c.ownerId) }));
    out.inputs.worker = WFC.map((c) => ({ ...c, worked: c.worked.map(([k, o]) => [k, hx(o)]), player: c.player === undefined ? null : hx(c.player) }));

    for (const c of OKO) {
      const g = Oko.buildCityOkolicaOverlayGroup(MAP as never, {
        cityQ: c.cityQ, cityR: c.cityR, range: c.range, workedKeys: new Set(c.worked), yieldOf: yieldOf as never,
        showYields: c.showYields, ownerId: c.ownerId,
      });
      const rec: any = { id: c.id, name: g.name, type: g.type, children: [] };
      for (const ch of g.children) {
        if (ch.name === 'okolica-yields') {
          rec.children.push({
            name: ch.name, type: ch.type, labels: ch.children.map((s) => {
              const sp = s as THREE.Sprite;
              const t = (sp.material as THREE.SpriteMaterial).map as THREE.CanvasTexture;
              return { ...spriteRec(sp), tex: page === 'node' ? null : snap(t.image as HTMLCanvasElement), texMeta: texMeta(t) };
            }),
          });
        } else rec.children.push(overlayRec(ch));
      }
      out.okolica.push(rec);
    }

    const texSeen = new Map<THREE.Texture, number>();
    for (const c of WFC) {
      const g = Wf.syncWorkerFieldOverlay(new THREE.Scene(), null, MAP as never, new Map(c.worked), c.player);
      if (!g) { out.worker.push({ id: c.id, group: null }); continue; }
      const sprites = () => g.children.map((s) => {
        const sp = s as THREE.Sprite;
        const t = (sp.material as THREE.SpriteMaterial).map as THREE.CanvasTexture;
        if (!texSeen.has(t)) {
          texSeen.set(t, out.workerTex.length);
          out.workerTex.push({ tex: page === 'node' ? null : snap(t.image as HTMLCanvasElement), meta: texMeta(t) });
        }
        return { ...spriteRec(sp), texIndex: texSeen.get(t) };
      });
      const rec: any = { id: c.id, group: { name: g.name, type: g.type, sprites: sprites() } };
      if (c.id === 'mixed') {
        const vis = new Set(['1,0', '-1,1', '3,0']);
        const explored = new Set(['0,1', '2,-1', '1,1', '-1,-1']);
        Wf.syncWorkerFieldOverlayFog(g, vis, explored, true);
        rec.fog = { vis: [...vis], explored: [...explored], sprites: sprites() };
        Wf.syncWorkerFieldOverlayFog(g, new Set(), new Set(), false);
        rec.fogOff = sprites();
      }
      out.worker.push(rec);
    }
  }
  if (page !== 'node') await settle();
  out.snapshots = snapshots;
  out.traces = traces;
  out.traceConflicts = traceConflicts;
  return out;
}
(globalThis as any).CITY_RUN = run;
