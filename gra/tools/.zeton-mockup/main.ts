/**
 * .zeton-mockup/main.ts — PODGLĄD (makieta) nowego układu żetonu jednostki
 * wg decyzji C-OBCE-JEDN-Q2. NIE jest częścią gry i NIE jest wpięty w render.
 *
 * Cel: pokazać właścicielowi, jak żeton BĘDZIE wyglądał, zanim wpięcie
 * w UnitRenderer się skończy. Używa PRAWDZIWYCH assetów gry (portrety władców,
 * ikony cywilizacji, ikona czaszki, ikony budynków koszary/kuźnia),
 * PRAWDZIWYCH modeli jednostek (buildUnitModel) i PRAWDZIWEJ kamery 52°.
 *
 * Budowanie (z katalogu gra/, NIGDY `npm run build`):
 *   node ./node_modules/vite/bin/vite.js build --config tools/.zeton-mockup/vite.config.ts
 */
import * as THREE from 'three';
import { buildUnitModel } from '../../src/render/units';
import { HEX_R } from '../../src/render/hexutil';
import { leaderPortraitUrl } from '../../src/ui/leaderPortraits';
import { civIconSvg, brandIconSvg } from '../../src/ui/icons/brandAssets';

// ---------------------------------------------------------------------------
// Wymiary makiety (wszystko względem HEX_R = 1.0, tak jak w render/)
// ---------------------------------------------------------------------------

/** Wysokość rządka odznak nad głową figurki — stała z unitUpgradeBadges.ts. */
const BADGE_ROW_Y = 0.92 * HEX_R;
/** Rozstaw: ikona koszar ← gwiazdki → ikona kuźni. */
const BADGE_GAP_X = 0.30 * HEX_R;
/** Bok ikony ulepszenia (sprite kwadratowy). */
const BADGE_SIZE = 0.26 * HEX_R;
/** Bok gwiazdki weterana. */
const STAR_SIZE = 0.17 * HEX_R;
/** Rozstaw gwiazdek. */
const STAR_SPACING = 0.15 * HEX_R;

/** Medalion właściciela — lewa krawędź żetonu. */
const EMBLEM_X = -0.52 * HEX_R;
const EMBLEM_Y = 0.42 * HEX_R;
const EMBLEM_SIZE = 0.40 * HEX_R;

/** Kolory poziomu odznaki ULEPSZENIA (1/2/3) — brąz / srebro / złoto. */
const LEVEL_COLOR: Record<1 | 2 | 3, string> = {
  1: '#c9762c', // brąz
  2: '#c3ced9', // srebro
  3: '#f0b429', // złoto odznaki (chłodniejsze i ciemniejsze niż złoto gwiazdki)
};
/** Złoto GWIAZDKI weterana — jaśniejsze, bardziej cytrynowe niż złoto odznaki. */
const VETERAN_GOLD = '#ffd24a';

// ---------------------------------------------------------------------------
// Pomocnicze: rysowanie sprite'ów z canvasa
// ---------------------------------------------------------------------------

const PX = 192; // rozdzielczość tekstury medalionu/odznaki

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('nie wczytano: ' + src.slice(0, 60)));
    img.src = src;
  });
}

function svgToDataUri(svg: string, color: string): string {
  const painted = svg.replace(/currentColor/g, color);
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(painted);
}

function spriteFromCanvas(cv: HTMLCanvasElement, size: number): THREE.Sprite {
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  sp.scale.set(size, size, 1);
  sp.renderOrder = 10;
  return sp;
}

/** Okrągły medalion: obraz przycięty do koła + metalowa obwódka. */
async function medallionSprite(imgSrc: string, ringColor: string, size: number): Promise<THREE.Sprite> {
  const cv = document.createElement('canvas');
  cv.width = cv.height = PX;
  const ctx = cv.getContext('2d')!;
  const r = PX / 2;

  // tło (żeby ikona SVG nie wisiała w powietrzu)
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 8, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = '#1b232b';
  ctx.fill();
  ctx.clip();
  try {
    const img = await loadImage(imgSrc);
    ctx.drawImage(img, 6, 6, PX - 12, PX - 12);
  } catch {
    /* brak assetu — zostaje samo tło */
  }
  ctx.restore();

  // obwódka
  ctx.beginPath();
  ctx.arc(r, r, r - 8, 0, Math.PI * 2);
  ctx.lineWidth = 10;
  ctx.strokeStyle = ringColor;
  ctx.stroke();

  return spriteFromCanvas(cv, size);
}

/** Kwadratowa odznaka ulepszenia: ikona budynku w kolorze poziomu, na ciemnej płytce. */
async function upgradeBadgeSprite(svg: string, level: 1 | 2 | 3, size: number): Promise<THREE.Sprite> {
  const cv = document.createElement('canvas');
  cv.width = cv.height = PX;
  const ctx = cv.getContext('2d')!;
  const color = LEVEL_COLOR[level];

  // płytka z zaokrąglonymi rogami
  const pad = 8;
  const rad = 26;
  ctx.beginPath();
  ctx.moveTo(pad + rad, pad);
  ctx.arcTo(PX - pad, pad, PX - pad, PX - pad, rad);
  ctx.arcTo(PX - pad, PX - pad, pad, PX - pad, rad);
  ctx.arcTo(pad, PX - pad, pad, pad, rad);
  ctx.arcTo(pad, pad, PX - pad, pad, rad);
  ctx.closePath();
  ctx.fillStyle = 'rgba(14,19,24,0.88)';
  ctx.fill();
  ctx.lineWidth = 9;
  ctx.strokeStyle = color;
  ctx.stroke();

  try {
    const img = await loadImage(svgToDataUri(svg, color));
    ctx.drawImage(img, 30, 30, PX - 60, PX - 60);
  } catch {
    /* brak ikony — zostaje sama płytka w kolorze poziomu */
  }
  return spriteFromCanvas(cv, size);
}

/** Gwiazdka weterana — złota, ostre ramiona (sylwetka inna niż płytka ulepszenia). */
function veteranStarSprite(size: number): THREE.Sprite {
  const cv = document.createElement('canvas');
  cv.width = cv.height = PX;
  const ctx = cv.getContext('2d')!;
  const cx = PX / 2;
  const cy = PX / 2;
  const rOut = PX * 0.46;
  const rIn = PX * 0.20;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? rOut : rIn;
    const x = cx + rr * Math.cos(a);
    const y = cy + rr * Math.sin(a);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = VETERAN_GOLD;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#6b4a00';
  ctx.stroke();
  return spriteFromCanvas(cv, size);
}

// ---------------------------------------------------------------------------
// Budowa jednego żetonu
// ---------------------------------------------------------------------------

type EmblemKind = 'portret' | 'sygnet' | 'czaszka';

interface TokenSpec {
  label: string;
  unitKey: string;
  ownerColor: number;
  emblem: EmblemKind;
  civId: string;
  era: number;
  /** Poziom ścieżki B (Parametry / koszary) — 0 = brak odznaki. */
  koszary: 0 | 1 | 2 | 3;
  /** Poziom ścieżki A (Pancerz / kuźnia) — 0 = brak odznaki. */
  kuznia: 0 | 1 | 2 | 3;
  /** Liczba gwiazdek weterana (0–3). */
  gwiazdki: 0 | 1 | 2 | 3;
}

const OWNER_RING_OUTER = HEX_R * 0.9;
const OWNER_RING_INNER = OWNER_RING_OUTER - 0.045 * HEX_R;

function appendPointyTopHex(path: THREE.Path | THREE.Shape, radius: number, reverse: boolean): void {
  const order = reverse ? [5, 4, 3, 2, 1, 0] : [0, 1, 2, 3, 4, 5];
  for (let j = 0; j < 6; j++) {
    const i = order[j]!;
    const a = Math.PI / 2 + (i * Math.PI) / 3;
    if (j === 0) path.moveTo(radius * Math.cos(a), radius * Math.sin(a));
    else path.lineTo(radius * Math.cos(a), radius * Math.sin(a));
  }
  path.closePath();
}

function hexTile(color: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, HEX_R * 0.985, false);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0.0 }),
  );
  m.rotation.x = -Math.PI / 2;
  return m;
}

function ownerRing(color: number): THREE.Mesh {
  const shape = new THREE.Shape();
  appendPointyTopHex(shape, OWNER_RING_OUTER, false);
  const hole = new THREE.Path();
  appendPointyTopHex(hole, OWNER_RING_INNER, true);
  shape.holes.push(hole);
  const m = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.55, depthWrite: false, side: THREE.DoubleSide }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.006 * HEX_R;
  return m;
}

async function buildToken(spec: TokenSpec): Promise<THREE.Group> {
  const g = new THREE.Group();
  g.add(hexTile(0x4a6b3a));
  g.add(ownerRing(spec.ownerColor));

  // figurka jednostki — PRAWDZIWY model z gry
  try {
    const model = buildUnitModel(spec.unitKey, spec.ownerColor) as THREE.Object3D;
    g.add(model);
  } catch {
    const fallback = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.12 * HEX_R, 0.4 * HEX_R, 4, 8),
      new THREE.MeshStandardMaterial({ color: spec.ownerColor }),
    );
    fallback.position.y = 0.35 * HEX_R;
    g.add(fallback);
  }

  // --- medalion właściciela (lewa krawędź żetonu) ---
  let src = '';
  let ring = '#d8c37a';
  if (spec.emblem === 'portret') {
    src = leaderPortraitUrl(spec.civId, spec.era) ?? '';
    ring = '#e8d88a';
  } else if (spec.emblem === 'sygnet') {
    src = svgToDataUri(civIconSvg(spec.civId, 64), '#dfe9f2');
    ring = '#9fb4c8';
  } else {
    src = svgToDataUri(brandIconSvg('chip-death', 64), '#e6e6e6');
    ring = '#8b1f1f';
  }
  const emblem = await medallionSprite(src, ring, EMBLEM_SIZE);
  emblem.position.set(EMBLEM_X, EMBLEM_Y, 0.1 * HEX_R);
  g.add(emblem);

  // --- rządek nad głową: koszary ← gwiazdki → kuźnia ---
  if (spec.koszary > 0) {
    const b = await upgradeBadgeSprite(brandIconSvg('bld-koszary', 64), spec.koszary, BADGE_SIZE);
    b.position.set(-BADGE_GAP_X, BADGE_ROW_Y, 0);
    g.add(b);
  }
  if (spec.kuznia > 0) {
    const b = await upgradeBadgeSprite(brandIconSvg('bld-kuznia', 64), spec.kuznia, BADGE_SIZE);
    b.position.set(+BADGE_GAP_X, BADGE_ROW_Y, 0);
    g.add(b);
  }
  for (let i = 0; i < spec.gwiazdki; i++) {
    const s = veteranStarSprite(STAR_SIZE);
    const start = -((spec.gwiazdki - 1) / 2) * STAR_SPACING;
    s.position.set(start + i * STAR_SPACING, BADGE_ROW_Y, 0);
    g.add(s);
  }

  return g;
}

// ---------------------------------------------------------------------------
// Scena
// ---------------------------------------------------------------------------

const TOKENS: TokenSpec[] = [
  {
    label: 'Pełna cywilizacja — PORTRET WŁADCY\nkoszary II (srebro) · ★★ · kuźnia III (złoto)',
    unitKey: 'wlocznik', ownerColor: 0x3a7bd5, emblem: 'portret', civId: 'rzymianie', era: 2,
    koszary: 2, kuznia: 3, gwiazdki: 2,
  },
  {
    label: 'Miasto-państwo — SYGNET KULTURY\nkuźnia I (brąz), bez koszar, bez weterana',
    unitKey: 'wlocznik', ownerColor: 0x9b59b6, emblem: 'sygnet', civId: 'grecy', era: 2,
    koszary: 0, kuznia: 1, gwiazdki: 0,
  },
  {
    label: 'Barbarzyńcy — SYGNET CZASZKI\nbez ulepszeń, bez weterana',
    unitKey: 'wojownik', ownerColor: 0x8b1f1f, emblem: 'czaszka', civId: '', era: 1,
    koszary: 0, kuznia: 0, gwiazdki: 0,
  },
  {
    label: 'Maksimum — PORTRET\nkoszary III (złoto) · ★★★ · kuźnia III (złoto)',
    unitKey: 'wlocznik', ownerColor: 0xd94f4f, emblem: 'portret', civId: 'egipt', era: 2,
    koszary: 3, kuznia: 3, gwiazdki: 3,
  },
];

async function renderRow(canvas: HTMLCanvasElement, which: number[], dist: number): Promise<void> {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x0e1318, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.add(new THREE.AmbientLight(0xffffff, 0.75));
  const dir = new THREE.DirectionalLight(0xffffff, 1.05);
  dir.position.set(3, 6, 4);
  scene.add(dir);

  // heksy pointy-top stykające się bokami: odstęp = sqrt(3)·HEX_R
  const step = Math.sqrt(3) * HEX_R;
  const n = which.length;
  for (let i = 0; i < n; i++) {
    const t = await buildToken(TOKENS[which[i]!]!);
    t.position.x = (i - (n - 1) / 2) * step;
    scene.add(t);
  }

  const aspect = canvas.width / canvas.height;
  const cam = new THREE.PerspectiveCamera(30, aspect, 0.1, 100);
  // KĄT KAMERY GRY: 52° elewacji
  const elev = (52 * Math.PI) / 180;
  cam.position.set(0, Math.sin(elev) * dist + 0.35, Math.cos(elev) * dist);
  cam.lookAt(0, 0.45 * HEX_R, 0);

  renderer.render(scene, cam);
}

async function main(): Promise<void> {
  await renderRow(document.getElementById('scena') as HTMLCanvasElement, [0, 1, 2, 3], 7.6);
  await renderRow(document.getElementById('zblizenie') as HTMLCanvasElement, [0, 3], 4.2);

  const legend = document.getElementById('legenda')!;
  legend.innerHTML = TOKENS.map(t => `<div>${t.label.replace(/\n/g, '<br>')}</div>`).join('');
  document.body.dataset['gotowe'] = '1';
}

void main();
