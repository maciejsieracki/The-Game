/**
 * .zeton-tabliczka/kat.ts — DOWÓD, ŻE PASKI SIĘ NIE ROZJEŻDŻAJĄ.
 * NIE jest częścią gry.
 *
 * Zgłoszenie właściciela (Maciej, 2026-07-29): „trochę rozjeżdżają się te paski
 * zielony i niebieski, zwłaszcza przy bocznej perspektywie”.
 *
 * ── DWA RZĘDY, DWA RÓŻNE PYTANIA ─────────────────────────────────────────
 * RZĄD 1 — REALNY PRZYPADEK Z GRY. Kamera gry ma azymut na stałe 0
 * (render/camera.ts: pole `yaw` z komentarzem „kamera stała”), więc „boczna
 * perspektywa” w grze znaczy: ŻETON DALEKO OD ŚRODKA EKRANU. Tam błąd
 * dzielenia perspektywicznego jest największy — w środku kadru X_widoku = 0
 * i wada znika, dlatego pomiar w centrum niczego by nie wykrył.
 * Miara: najbardziej wysunięty w lewo piksel niebieskiego i zielonego
 * wypełnienia. Przy azymucie 0 pionowa oś tabliczki rzutuje się na pionową
 * linię ekranu, więc ta miara jest wprost porównywalna. MA WYJŚĆ 0 px.
 *
 * RZĄD 2 — TEST SZTYWNOŚCI przy obrocie kamery (gra tego nie robi, to stres-test).
 * Po obrocie pionowa oś tabliczki rzutuje się na linię SKOŚNĄ, więc „najbardziej
 * wysunięty w lewo piksel” dwóch pasków RÓŻNI SIĘ już z samej geometrii i sam
 * w sobie nic nie dowodzi. Dlatego mierzymy RESZTĘ: pozycję każdej krawędzi
 * porównujemy z jej WŁASNYM rzutem analitycznym wspólnej prostej
 * x = PLATE_BAR_LEFT_X. Reszta = (zmierzone − zrzutowane)_Ruch
 *                              − (zmierzone − zrzutowane)_Życie.
 * Zero znaczy: obie krawędzie leżą dokładnie na tej samej prostej w 3D.
 * Tolerancja ±1 px pochodzi z rasteryzacji (krawędź wygładzona antyaliasingiem).
 *
 * Budowanie (z katalogu gra/, NIGDY `npm run build`):
 *   node ./node_modules/vite/bin/vite.js build --config tools/.zeton-tabliczka/vite-kat.config.ts
 */
import * as THREE from 'three';
import { buildUnitModel } from '../../src/render/units';
import { HEX_R } from '../../src/render/hexutil';
import { leaderPortraitUrl } from '../../src/ui/leaderPortraits';
import { civIconSvg, brandIconSvg } from '../../src/ui/icons/brandAssets';
import {
  setUnitOwnerEmblemAssets,
  type UnitOwnerEmblemContext,
} from '../../src/render/unitOwnerEmblem';
import {
  applyUnitUpgradeBadgeRow,
  setUnitUpgradeBadgeAssets,
} from '../../src/render/unitUpgradeBadges';
import { applyUnitVeteranBadgeStarCount } from '../../src/render/unitVeteranBadges';
import {
  applyUnitStatPlate,
  PLATE_BAR_DY,
  PLATE_BAR_LEFT_X,
  PLATE_FILL_Z,
} from '../../src/render/unitStatPlate';

setUnitOwnerEmblemAssets({
  leaderPortraitUrl: (civId: string, era: number) => leaderPortraitUrl(civId, era),
  civSigilSvg: (civId: string) => civIconSvg(civId, 40),
  barbarianSigilSvg: () => brandIconSvg('chip-death', 40),
});
setUnitUpgradeBadgeAssets({
  barracksSvg: () => brandIconSvg('bld-koszary', 40),
  forgeSvg: () => brandIconSvg('bld-kuznia', 40),
});

const CTX: UnitOwnerEmblemContext = { civId: 'rzymianie', era: 2, isCityState: false, isBarbarian: false };
// Barwa państwa CELOWO ciepła (złoto): niebieski tint figurki i obwódki heksu
// myliłby się klasyfikatorowi z niebieskim paskiem Ruchu i psuł pomiar.
const KOLOR = 0xd8a63a;
const ELEV = (52 * Math.PI) / 180;

/** Ułamki CELOWO różne — przy równych rozjazd szerokości niczego by nie ujawnił. */
const RUCH = { left: 2, max: 4 };   // 50 %
const ZYCIE = { hp: 38, max: 48 };  // 79 %

function zeton(): THREE.Group {
  const g = new THREE.Group();
  try {
    g.add(buildUnitModel('wlocznik', KOLOR) as THREE.Object3D);
  } catch { /* podgląd bez modelu — tabliczka i tak się rysuje */ }
  applyUnitUpgradeBadgeRow(g, 3, 3, 3);
  applyUnitVeteranBadgeStarCount(g, 3);
  applyUnitStatPlate(g, CTX, {
    ruchLeft: RUCH.left, ruchMax: RUCH.max,
    hp: ZYCIE.hp, hpMax: ZYCIE.max,
    fieldPowerM: 128, ownerColor: KOLOR,
  });
  return g;
}

function swiatlo(scene: THREE.Scene): void {
  scene.add(new THREE.AmbientLight(0xffffff, 0.78));
  const d = new THREE.DirectionalLight(0xffffff, 1.08);
  d.position.set(3, 6, 4);
  scene.add(d);
}

// --- klasyfikacja pikseli --------------------------------------------------
// Dopasowanie DO KONKRETNEJ barwy z unitVitalsPalette.ts, z wąską tolerancją.
// Klasyfikator „byle niebieski / byle zielony” łapał tint figurki i psuł pomiar.
const RGB_MOVE: readonly [number, number, number] = [0x60, 0xa8, 0xe8];
const RGB_HP: readonly [number, number, number] = [0x50, 0xb0, 0x70];
const TOL = 22;

function blisko(r: number, g: number, b: number, ref: readonly [number, number, number]): boolean {
  return Math.abs(r - ref[0]) <= TOL && Math.abs(g - ref[1]) <= TOL && Math.abs(b - ref[2]) <= TOL;
}

interface Krawedzie { xMove: number; xHp: number }

function zmierzKrawedzie(canvas: HTMLCanvasElement): Krawedzie {
  const c2 = document.createElement('canvas');
  c2.width = canvas.width; c2.height = canvas.height;
  const ctx = c2.getContext('2d')!;
  ctx.drawImage(canvas, 0, 0);
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  let xMove = Number.POSITIVE_INFINITY;
  let xHp = Number.POSITIVE_INFINITY;
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const r = img[i]!, g = img[i + 1]!, b = img[i + 2]!;
      if (x < xMove && blisko(r, g, b, RGB_MOVE)) xMove = x;
      else if (x < xHp && blisko(r, g, b, RGB_HP)) xHp = x;
    }
  }
  return { xMove, xHp };
}

/** Rzut analityczny lewej krawędzi paska (wspólna prosta w płaszczyźnie tabliczki) na piksele. */
function rzutKrawedzi(token: THREE.Object3D, cam: THREE.Camera, w: number, dy: number): number {
  const plate = token.getObjectByName('unitStatPlate');
  if (!plate) return NaN;
  plate.updateMatrixWorld(true);
  const v = new THREE.Vector3(PLATE_BAR_LEFT_X, dy, PLATE_FILL_Z)
    .applyMatrix4(plate.matrixWorld)
    .project(cam);
  return (v.x * 0.5 + 0.5) * w;
}

interface Panel {
  id: string;
  etykieta: string;
  az: number;      // azymut kamery [°]
  tx: number;      // przesunięcie celu kamery w osi X (żeton zostaje w 0,0)
  reszta: boolean; // true = miara „reszty” (rząd 2), false = prosta różnica (rząd 1)
}

const PANELE: Panel[] = [
  // RZĄD 1 — kamera gry (azymut 0), żeton w czterech miejscach kadru.
  { id: 'p1', etykieta: 'azymut 0° · żeton SKRAJNIE PO LEWEJ', az: 0, tx: 0.92, reszta: false },
  { id: 'p2', etykieta: 'azymut 0° · żeton po lewej', az: 0, tx: 0.38, reszta: false },
  { id: 'p3', etykieta: 'azymut 0° · żeton po prawej', az: 0, tx: -0.38, reszta: false },
  { id: 'p4', etykieta: 'azymut 0° · żeton SKRAJNIE PO PRAWEJ', az: 0, tx: -0.92, reszta: false },
  // RZĄD 2 — stres-test obrotu kamery (gra go nie wykonuje).
  { id: 'p5', etykieta: 'obrót kamery 0°', az: 0, tx: -0.70, reszta: true },
  { id: 'p6', etykieta: 'obrót kamery 15°', az: 15, tx: -0.70, reszta: true },
  { id: 'p7', etykieta: 'obrót kamery 30°', az: 30, tx: -0.70, reszta: true },
  { id: 'p8', etykieta: 'obrót kamery 45°', az: 45, tx: -0.70, reszta: true },
];

interface Wynik { id: string; etykieta: string; xMove: number; xHp: number; wartosc: number; reszta: boolean }

function renderPanel(p: Panel): Wynik {
  const canvas = document.getElementById('cv-' + p.id) as HTMLCanvasElement;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1);
  renderer.setSize(canvas.width, canvas.height, false);
  renderer.setClearColor(0x101820, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  swiatlo(scene);
  const token = zeton();
  scene.add(token);

  const cam = new THREE.PerspectiveCamera(34, canvas.width / canvas.height, 0.1, 100);
  const dist = 3.15;
  const a = (p.az * Math.PI) / 180;
  const ty = 0.95 * HEX_R;
  cam.position.set(
    p.tx + Math.cos(ELEV) * Math.sin(a) * dist,
    ty + Math.sin(ELEV) * dist,
    Math.cos(ELEV) * Math.cos(a) * dist,
  );
  cam.lookAt(p.tx, ty, 0);
  cam.updateMatrixWorld(true);
  renderer.render(scene, cam);

  const k = zmierzKrawedzie(canvas);
  let wartosc: number;
  if (p.reszta) {
    const projMove = rzutKrawedzi(token, cam, canvas.width, +PLATE_BAR_DY);
    const projHp = rzutKrawedzi(token, cam, canvas.width, -PLATE_BAR_DY);
    wartosc = Math.round(((k.xMove - projMove) - (k.xHp - projHp)) * 10) / 10;
  } else {
    wartosc = k.xMove - k.xHp;
  }
  return { id: p.id, etykieta: p.etykieta, xMove: k.xMove, xHp: k.xHp, wartosc, reszta: p.reszta };
}

function main(): void {
  PANELE.forEach(renderPanel);
  // Portret i SVG ikon dociągają się asynchronicznie — mierzymy PONOWNIE po chwili.
  setTimeout(() => {
    const w = PANELE.map(renderPanel);
    const kartka = (x: Wynik): string => {
      const ok = Math.abs(x.wartosc) <= (x.reszta ? 1 : 0);
      const nazwa = x.reszta ? 'reszta (odchyłka od wspólnej prostej)' : 'różnica lewych krawędzi';
      return `<div><b>${x.etykieta}</b><br>Ruch: ${x.xMove} px · Życie: ${x.xHp} px<br>`
        + `<span style="color:${ok ? '#6ddc8a' : '#e46a5a'}">${nazwa}: <b>${x.wartosc} px</b></span></div>`;
    };
    document.getElementById('leg-1')!.innerHTML = w.slice(0, 4).map(kartka).join('');
    document.getElementById('leg-2')!.innerHTML = w.slice(4).map(kartka).join('');
    document.body.dataset['pomiar'] = JSON.stringify(w.map(x => ({ e: x.etykieta, v: x.wartosc })));
    document.body.dataset['gotowe'] = '1';
  }, 2500);
}

main();
