/**
 * .zeton-tabliczka/main.ts — PODGLĄD TABLICZKI JEDNOSTKI (R-ZETON-PASKI).
 * NIE jest częścią gry.
 *
 * Woła DOKŁADNIE te funkcje, których używa UnitRenderer.sync() na mapie:
 *   applyUnitStatPlate() · applyUnitUpgradeBadgeRow() · applyUnitVeteranBadgeLevel()
 * z assetami wstrzykniętymi tak samo jak w src/main.ts. Wartości stosu liczy
 * prawdziwy game/armyMerge.ts::stackVitals — czyli to, co gracz zobaczy w grze,
 * a nie makieta.
 *
 * Budowanie (z katalogu gra/, NIGDY `npm run build`):
 *   node ./node_modules/vite/bin/vite.js build --config tools/.zeton-tabliczka/vite.config.ts
 */
import * as THREE from 'three';
import { buildUnitModel } from '../../src/render/units';
import { HEX_R, axialToWorld } from '../../src/render/hexutil';
import { leaderPortraitUrl } from '../../src/ui/leaderPortraits';
import { civIconSvg, brandIconSvg } from '../../src/ui/icons/brandAssets';
import {
  setUnitOwnerEmblemAssets,
  type UnitOwnerEmblemContext,
} from '../../src/render/unitOwnerEmblem';
import {
  applyUnitUpgradeBadgeRow,
  setUnitUpgradeBadgeAssets,
  type UpgradeBadgeLevel,
} from '../../src/render/unitUpgradeBadges';
import { applyUnitVeteranBadgeStarCount } from '../../src/render/unitVeteranBadges';
import { applyUnitStatPlate } from '../../src/render/unitStatPlate';
import { stackVitals, type StackVitalsDeps } from '../../src/game/armyMerge';
import type { RuntimeUnit } from '../../src/units/setup';


// --- assety: DOKŁADNIE to samo wstrzyknięcie co w src/main.ts ---------------
setUnitOwnerEmblemAssets({
  leaderPortraitUrl: (civId: string, era: number) => leaderPortraitUrl(civId, era),
  civSigilSvg: (civId: string) => civIconSvg(civId, 40),
  barbarianSigilSvg: () => brandIconSvg('chip-death', 40),
});
setUnitUpgradeBadgeAssets({
  barracksSvg: () => brandIconSvg('bld-koszary', 40),
  forgeSvg: () => brandIconSvg('bld-kuznia', 40),
});

const CIV_GRACZ: UnitOwnerEmblemContext = { civId: 'rzymianie', era: 2, isCityState: false, isBarbarian: false };
const CIV_MIASTO: UnitOwnerEmblemContext = { civId: 'grecy', era: 2, isCityState: true, isBarbarian: false };
const CIV_BARB: UnitOwnerEmblemContext = { civId: null, era: 1, isCityState: false, isBarbarian: true };

const KOLOR_NIEBIESKI = 0x3a7bd5;   // przypadek testowy: państwo NIEBIESKIE vs niebieski pasek Ruchu
const KOLOR_FIOLET = 0x9b59b6;
const KOLOR_CZERWONY = 0x8b1f1f;
const KOLOR_ZLOTY = 0xd8a63a;

interface Zeton {
  opis: string;
  unitKey: string;
  kolor: number;
  ctx: UnitOwnerEmblemContext;
  armor: UpgradeBadgeLevel;
  soft: UpgradeBadgeLevel;
  /** Liczba gwiazdek (0–3) = liczba wygranych bitew — model po fali 106. */
  vet: 0 | 1 | 2 | 3;
  ruchLeft: number;
  ruchMax: number;
  hp: number | undefined;
  hpMax: number | undefined;
  moc: number | undefined;
}

/** Żeton zbudowany PRAWDZIWĄ ścieżką render/ — tak jak w UnitRenderer.sync(). */
function zeton(z: Zeton): THREE.Group {
  const g = new THREE.Group();
  try {
    g.add(buildUnitModel(z.unitKey, z.kolor) as THREE.Object3D);
  } catch {
    const f = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12 * HEX_R, 0.4 * HEX_R, 4, 8),
      new THREE.MeshStandardMaterial({ color: z.kolor }),
    );
    f.position.y = 0.35 * HEX_R;
    g.add(f);
  }
  applyUnitUpgradeBadgeRow(g, z.armor, z.soft, z.vet);
  applyUnitVeteranBadgeStarCount(g, z.vet);
  applyUnitStatPlate(g, z.ctx, {
    ruchLeft: z.ruchLeft,
    ruchMax: z.ruchMax,
    hp: z.hp,
    hpMax: z.hpMax,
    fieldPowerM: z.moc,
    ownerColor: z.kolor,
  });
  return g;
}

// ---------------------------------------------------------------------------
// Kafelek i obwódka właściciela (kopia stałych z units.ts — jak w .zeton-max)
// ---------------------------------------------------------------------------
const OWNER_RING_OUTER = HEX_R * 0.9;
const OWNER_RING_INNER = OWNER_RING_OUTER - 0.045 * HEX_R;

function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse = false): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    if (j === 0) path.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else path.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  path.closePath();
}

function hexTile(kolor: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, HEX_R * 0.985);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color: kolor, roughness: 0.95, metalness: 0 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function ownerRing(kolor: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, OWNER_RING_OUTER);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, OWNER_RING_INNER, true);
  shape.holes.push(hole);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: kolor, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide,
    }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006 * HEX_R;
  return m;
}

function swiatlo(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));
  const d = new THREE.DirectionalLight(0xffffff, 1.08);
  d.position.set(3, 6, 4);
  scene.add(d);
}

const ELEV = (52 * Math.PI) / 180;

function makeRenderer(canvas: HTMLCanvasElement, clear: number): THREE.WebGLRenderer {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true });
  r.setPixelRatio(1);
  r.setSize(canvas.width, canvas.height, false);
  r.setClearColor(clear, 1);
  r.outputColorSpace = THREE.SRGBColorSpace;
  return r;
}

/** Rząd żetonów w zbliżeniu (kamera 52°, fov 30). */
function renderRow(canvas: HTMLCanvasElement, lista: Zeton[], tloHeksu: number[]): () => void {
  const renderer = makeRenderer(canvas, 0x0e1318);
  const scene = new THREE.Scene();
  swiatlo(scene);
  const step = Math.sqrt(3) * HEX_R * 1.06;
  lista.forEach((z, i) => {
    const g = new THREE.Group();
    g.add(hexTile(tloHeksu[i % tloHeksu.length]!));
    g.add(ownerRing(z.kolor));
    g.add(zeton(z));
    g.position.x = (i - (lista.length - 1) / 2) * step;
    scene.add(g);
  });
  const cam = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 0.1, 100);
  const dist = 1.18 * lista.length + 1.35;
  cam.position.set(0, Math.sin(ELEV) * dist + 0.30, Math.cos(ELEV) * dist);
  cam.lookAt(0, 0.80 * HEX_R, 0);
  return () => renderer.render(scene, cam);
}

/** Siatka heksów + żetony w REALNEJ skali rozgrywki (kamera gry: fov 50, elewacja 52°). */
function renderGameScale(canvas: HTMLCanvasElement, lista: Zeton[], dist = 11): () => void {
  const renderer = makeRenderer(canvas, 0x6f8f4a);
  const scene = new THREE.Scene();
  swiatlo(scene);

  const W = 11, H = 9;
  let sx = 0, sz = 0, n = 0;
  const h01 = (q: number, r: number): number => {
    const s = Math.sin(q * 12.9898 + r * 78.233) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let r = 0; r < H; r++) {
    for (let q = 0; q < W; q++) {
      const { x, z } = axialToWorld(q - (r - (r & 1)) / 2, r, HEX_R);
      sx += x; sz += z; n++;
      const t = h01(q, r);
      // jeden pas „wody”, żeby było widać niebieski pasek Ruchu nad błękitnym terenem
      const kolor = r === 6 ? 0x2f6f9e : (t > 0.7 ? 0x6f8f4a : t > 0.4 ? 0x5d7f3e : 0x7a8a46);
      const tile = hexTile(kolor);
      tile.position.set(x, 0, z);
      scene.add(tile);
    }
  }

  // Żetony: rząd środkowy (sąsiadujące heksy!) + dwa na pasie wody.
  const miejsca: Array<[number, number]> = [
    [3, 4], [4, 4], [5, 4], [6, 4], [7, 4],
    [4, 6], [6, 6],
  ];
  lista.forEach((z, i) => {
    const m = miejsca[i % miejsca.length]!;
    const [q, r] = m;
    const { x, z: zz } = axialToWorld(q - (r - (r & 1)) / 2, r, HEX_R);
    const g = new THREE.Group();
    g.add(ownerRing(z.kolor));
    g.add(zeton(z));
    g.position.set(x, 0.002, zz);
    scene.add(g);
  });

  const cam = new THREE.PerspectiveCamera(50, canvas.width / canvas.height, 0.5, 500);
  const cx = sx / n, cz = sz / n;
  cam.position.set(cx, Math.sin(ELEV) * dist, cz + Math.cos(ELEV) * dist);
  cam.lookAt(cx, 0, cz);
  return () => renderer.render(scene, cam);
}

// ---------------------------------------------------------------------------
// 1) ZBLIŻENIE — trzy warianty właściciela w konfiguracji MAKSYMALNEJ
//    (Pancerz 45 pp → Kuźnia III, Parametry 50 pp → Koszary III, weteran 3)
// ---------------------------------------------------------------------------
const BLISKO: Zeton[] = [
  {
    opis: 'GRACZ — portret władcy · barwa państwa NIEBIESKA (test: ramka Mocy vs niebieski pasek Ruchu) · Moc 128 (3 cyfry)',
    unitKey: 'wlocznik', kolor: KOLOR_NIEBIESKI, ctx: CIV_GRACZ,
    armor: 3, soft: 3, vet: 3, ruchLeft: 2, ruchMax: 4, hp: 38, hpMax: 48, moc: 128,
  },
  {
    opis: 'MIASTO-PAŃSTWO — sygnet kultury (pierścień SREBRNY) · Moc 62',
    unitKey: 'wlocznik', kolor: KOLOR_FIOLET, ctx: CIV_MIASTO,
    armor: 3, soft: 3, vet: 3, ruchLeft: 4, ruchMax: 4, hp: 48, hpMax: 48, moc: 62,
  },
  {
    opis: 'BARBARZYŃCY — czaszka (pierścień CZERWONY) · Moc 9',
    unitKey: 'wojownik', kolor: KOLOR_CZERWONY, ctx: CIV_BARB,
    armor: 3, soft: 3, vet: 3, ruchLeft: 1, ruchMax: 3, hp: 12, hpMax: 44, moc: 9,
  },
];

// ---------------------------------------------------------------------------
// 2) STANY PASKÓW
// ---------------------------------------------------------------------------
const STANY: Zeton[] = [
  {
    opis: 'pełny ruch + pełne HP',
    unitKey: 'wlocznik', kolor: KOLOR_ZLOTY, ctx: CIV_GRACZ,
    armor: 2, soft: 2, vet: 2, ruchLeft: 4, ruchMax: 4, hp: 48, hpMax: 48, moc: 47,
  },
  {
    opis: 'ruch zużyty DO ZERA + pełne HP',
    unitKey: 'wlocznik', kolor: KOLOR_ZLOTY, ctx: CIV_GRACZ,
    armor: 2, soft: 2, vet: 2, ruchLeft: 0, ruchMax: 4, hp: 48, hpMax: 48, moc: 47,
  },
  {
    opis: 'pełny ruch + HP ~25% (pasek czerwony)',
    unitKey: 'wlocznik', kolor: KOLOR_ZLOTY, ctx: CIV_GRACZ,
    armor: 2, soft: 2, vet: 2, ruchLeft: 4, ruchMax: 4, hp: 12, hpMax: 48, moc: 47,
  },
  {
    opis: 'bez ulepszeń, bez weterana, Moc 0 → BEZ pola Mocy (sam pasek + ikona właściciela)',
    unitKey: 'zwiadowca', kolor: KOLOR_ZLOTY, ctx: CIV_GRACZ,
    armor: 0, soft: 0, vet: 0, ruchLeft: 3, ruchMax: 4, hp: undefined, hpMax: undefined, moc: 0,
  },
];

// ---------------------------------------------------------------------------
// 3) REALNA SKALA ROZGRYWKI
// ---------------------------------------------------------------------------
const DALEKO: Zeton[] = [
  { opis: '', unitKey: 'wlocznik', kolor: KOLOR_NIEBIESKI, ctx: CIV_GRACZ, armor: 3, soft: 3, vet: 3, ruchLeft: 2, ruchMax: 4, hp: 38, hpMax: 48, moc: 128 },
  { opis: '', unitKey: 'wlocznik', kolor: KOLOR_NIEBIESKI, ctx: CIV_GRACZ, armor: 1, soft: 0, vet: 0, ruchLeft: 4, ruchMax: 4, hp: 48, hpMax: 48, moc: 41 },
  { opis: '', unitKey: 'wojownik', kolor: KOLOR_CZERWONY, ctx: CIV_BARB, armor: 0, soft: 0, vet: 2, ruchLeft: 0, ruchMax: 3, hp: 11, hpMax: 44, moc: 24 },
  { opis: '', unitKey: 'wlocznik', kolor: KOLOR_FIOLET, ctx: CIV_MIASTO, armor: 2, soft: 2, vet: 0, ruchLeft: 3, ruchMax: 4, hp: 30, hpMax: 48, moc: 76 },
  { opis: '', unitKey: 'zwiadowca', kolor: KOLOR_ZLOTY, ctx: CIV_GRACZ, armor: 0, soft: 0, vet: 0, ruchLeft: 4, ruchMax: 4, hp: undefined, hpMax: undefined, moc: 0 },
  { opis: '', unitKey: 'wlocznik', kolor: KOLOR_NIEBIESKI, ctx: CIV_GRACZ, armor: 0, soft: 3, vet: 2, ruchLeft: 1, ruchMax: 4, hp: 20, hpMax: 48, moc: 205 },
  { opis: '', unitKey: 'wojownik', kolor: KOLOR_CZERWONY, ctx: CIV_BARB, armor: 0, soft: 0, vet: 0, ruchLeft: 2, ruchMax: 3, hp: 44, hpMax: 44, moc: 18 },
];

// ---------------------------------------------------------------------------
// 4) STOS — wartości liczy PRAWDZIWY game/armyMerge.ts::stackVitals
// ---------------------------------------------------------------------------

interface Def { health: number; fieldPower: number }

const DEFS: Record<string, Def> = {
  'Włócznik':  { health: 48, fieldPower: 44 },
  'Miecznik':  { health: 52, fieldPower: 61 },
  'Łucznik':   { health: 40, fieldPower: 33 },
  'Zwiadowca': { health: 30, fieldPower: 8 },
};

const DEPS: StackVitalsDeps = {
  maxHpOf: (u) => DEFS[u.typeId]?.health ?? 40,
  defOf: (u) => (DEFS[u.typeId] ?? { health: 40, fieldPower: 0 }) as never,
};

function ru(
  id: string, typeId: string, ruch: number, ruchLeft: number,
  hp: number | undefined, extra: Partial<RuntimeUnit> = {},
): RuntimeUnit {
  return {
    id, ownerId: 0, typeId, category: 'wlocznik', q: 0, r: 0,
    ruch, ruchLeft, hp, ...extra,
  } as RuntimeUnit;
}

/** Armia 4 jednostek: jedna mocno ranna, jedna z zerowym ruchem, jedna oweteranowana. */
const ARMIA: RuntimeUnit[] = [
  ru('a1', 'Włócznik', 4, 3, 48, { pancerzBonusProc: 45 }),
  ru('a2', 'Miecznik', 4, 0, 52, { parametryBonusProc: 50 }),         // ruch 0 → pul stosu = 0
  ru('a3', 'Łucznik', 4, 2, 5, { battlesSurvived: 3 }),               // mocno ranny + weteran 3
  ru('a4', 'Włócznik', 4, 4, 44),
];
const SAMOTNA: RuntimeUnit[] = [ru('s1', 'Miecznik', 4, 2, 31, { parametryBonusProc: 20 })];
const ZWIADY: RuntimeUnit[] = [
  ru('z1', 'Zwiadowca', 5, 5, undefined),
  ru('z2', 'Zwiadowca', 5, 5, 18),
  ru('z3', 'Zwiadowca', 5, 5, undefined),
];

function zetonZeStosu(
  stack: RuntimeUnit[], opis: string, unitKey: string, kolor: number, ctx: UnitOwnerEmblemContext,
): { z: Zeton; opisPelny: string } {
  const v = stackVitals(stack, DEPS);
  return {
    z: {
      opis, unitKey, kolor, ctx,
      armor: v.armorBadgeLevel, soft: v.softBadgeLevel, vet: v.veteranStars as 0 | 1 | 2 | 3,
      ruchLeft: v.ruchLeft, ruchMax: v.ruchMax, hp: v.hp, hpMax: v.hpMax, moc: v.fieldPowerM,
    },
    opisPelny: `${opis}<br>ruch ${v.ruchLeft}/${v.ruchMax} · HP ${Math.round(v.hp)}/${Math.round(v.hpMax)}`
      + ` (${Math.round((v.hp / Math.max(1, v.hpMax)) * 100)}%) · Moc ${v.fieldPowerM}`,
  };
}

// ---------------------------------------------------------------------------
// Montaż
// ---------------------------------------------------------------------------

function legenda(id: string, opisy: string[]): void {
  const el = document.getElementById(id);
  if (el) el.innerHTML = opisy.map(o => `<div>${o}</div>`).join('');
}

function main(): void {
  const stos = [
    zetonZeStosu(ARMIA, 'STOS 4 jednostek (jedna ranna do 5 HP, jedna z ruchem 0)', 'wlocznik', KOLOR_NIEBIESKI, CIV_GRACZ),
    zetonZeStosu(SAMOTNA, 'POJEDYNCZA jednostka (dla porównania)', 'wlocznik', KOLOR_NIEBIESKI, CIV_GRACZ),
    zetonZeStosu(ZWIADY, 'STOS 3 ZWIADOWCÓW — Moc pola 0 → pole Mocy się NIE rysuje', 'zwiadowca', KOLOR_ZLOTY, CIV_GRACZ),
  ];

  const draws = [
    renderRow(document.getElementById('cv-blisko') as HTMLCanvasElement, BLISKO, [0x5d7f3e, 0x8a7a4a, 0x6f8f4a]),
    renderRow(document.getElementById('cv-stany') as HTMLCanvasElement, STANY, [0x5d7f3e, 0x2f6f9e, 0xb9b2a0, 0x5d7f3e]),
    renderGameScale(document.getElementById('cv-daleko') as HTMLCanvasElement, DALEKO),
    renderRow(document.getElementById('cv-stos') as HTMLCanvasElement, stos.map(s => s.z), [0x5d7f3e, 0x6f8f4a, 0x8a7a4a]),
    renderGameScale(document.getElementById('cv-zoom20') as HTMLCanvasElement, DALEKO, 20),
    renderGameScale(document.getElementById('cv-zoom30') as HTMLCanvasElement, DALEKO, 30),
  ];

  legenda('leg-blisko', BLISKO.map(z => z.opis));
  legenda('leg-stany', STANY.map(z => z.opis));
  legenda('leg-daleko', ['Kamera rozgrywki. Rząd środkowy = pięć SĄSIADUJĄCYCH heksów (test zlewania się tabliczek). Pas niebieski = woda (test niebieskiego paska Ruchu na błękitnym terenie). Moc: 128 · 41 · 24 · 76 · brak · 205 · 18.']);
  legenda('leg-stos', stos.map(s => s.opisPelny));
  legenda('leg-zoom', ['GÓRA: odległość kamery 20 (1,8× dalej niż domyślne 11). DÓŁ: odległość 30 (2,7×). Ten sam skład co sekcja 3.']);

  const draw = (): void => { for (const d of draws) d(); };
  draw();
  // sprite'y ładują portrety/SVG asynchronicznie — dorysowanie po chwili
  setTimeout(() => { draw(); document.body.dataset['gotowe'] = '1'; }, 2500);
}

main();
