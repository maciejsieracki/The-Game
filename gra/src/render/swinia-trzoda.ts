/**
 * swinia-trzoda.ts — SWINIA (2 pozy x 2 warianty) + kompozycja TRZODA
 * w stylu Roblox. Decyzja Macieja 2026-07-09: zasob "bydlo" staje sie
 * "TRZODA" — symbol krowa+swinia razem (owce = osobny temat).
 *
 * MODELE (tri: box=12, cone3=6):
 *  - buildSwinia({poza,wariant})  192 tri (rozowa) / 216 tri (laciata)
 *      pozy: 'stojaca' | 'ryjaca' (leb nisko przy ziemi — obrot podgrupy glowy),
 *      warianty: 'rozowa' | 'laciata' (rozowa z ciemnymi latami).
 *  - buildTrzoda({jakosc,hexR})   zloze trzody w sektorze N-NE pierscienia:
 *      WYSOKA = krowa lacata + swinia, NISKA/NORMALNA = 1 krowa;
 *      srodek heksa (r<0.40) ZOSTAJE WOLNY — rezerwa pod miasto.
 *
 * KONWENCJE (jak pastwisko-modele.ts / styleResources.ts):
 *  - skala S = PASTWISKO_S = 2.05/3, spod nog na y=0, przod modelu = +x,
 *    obrot figury = rotation.y, MeshLambert + flatShading, zero tekstur,
 *  - swinia vs krowa: nizsza (grzbiet 0.130 vs 0.185), proporcjonalnie dluzsza
 *    i "beczkowata" (przekroj osmiokatny: rdzen + box obrocony 45 st.),
 *    krotkie nogi, duzy prostokatny RYJ z nozdrzami, trojkatne klapniete uszy
 *    (cone3), zakrecony ogonek 3-segmentowy; bez rogow i wymion.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/swinia-trzoda.ts (obok pastwisko-modele.ts).
 *  2. render/robloxImprovements.ts (registry BUILDERS ~linia 376):
 *       import { buildTrzoda } from './swinia-trzoda';
 *       bydlo: g => { g.add(buildTrzoda()); },   // dawne "bydlo" = trzoda
 *     (rbxBydlo / buildPastwiskoZwierzeta dla zloza — do wycofania).
 *  3. Nakladka zloza (render/styleResources.ts, case Nakladka.ZlozeBydla):
 *     buildTrzoda({ jakosc }) — jakosc zloza steruje liczba zwierzat.
 *  4. DANE/UI: zasob "Bydlo" przemianowac na "Trzoda" (nazwa w danych zasobow
 *     + panele Excel); ikona 2D docelowo krowa+swinia.
 *  5. Kompozycja pelnego heksa hodowli (macierz): trzoda N-NE (ten plik),
 *     farma 'pastwisko' w sektorze W-NW 250-335 st. (ulepszenia-modele-p2),
 *     kon w sektorze E 70-120 st. — srodek wolny pod miasto (TRZODA_LAYOUT.miasto).
 */
import * as THREE from 'three';
import { PASTWISKO_S, buildKrowa } from './pastwisko-modele';

export type PozaSwini = 'stojaca' | 'ryjaca';
export type WariantSwini = 'rozowa' | 'laciata';
export type JakoscTrzody = 'niska' | 'normalna' | 'wysoka';

/** Obrot wierzcholkow podstawy stozka ucha wokol jego osi (dobrany wizualnie). */
const EAR_TWIST = Math.PI / 3;

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

/** Klocek: srodek (cx,cy,cz), opcjonalny obrot — wymiary/pozycje w jedn. swiata. */
function B(
  g: THREE.Object3D, w: number, h: number, d: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
  rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(cx, cy, cz);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

/**
 * Trojkatne KLAPNIETE ucho (cone 3-seg = 6 tri, splaszczone): podstawa
 * zakotwiczona w (ax,ay,az) przy czaszce, czubek opada w kierunku (dx,dy,dz).
 */
function EAR(
  g: THREE.Object3D, r: number, h: number,
  ax: number, ay: number, az: number,
  dx: number, dy: number, dz: number,
  m: THREE.Material, flat = 0.45, twist = 0,
): THREE.Mesh {
  const geo = new THREE.ConeGeometry(r, h, 3);
  if (twist) geo.rotateY(twist);
  const mesh = new THREE.Mesh(geo, m);
  const dir = new THREE.Vector3(dx, dy, dz).normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.position.set(ax + dir.x * h / 2, ay + dir.y * h / 2, az + dir.z * h / 2);
  mesh.scale.z = flat;
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

// ============================== SWINIA =====================================
// 192 tri (rozowa: 15 boxow + 2 uszy cone3) / 216 tri (laciata: +2 laty).
// Cieplo-rozowa, ciemniejszy ryj/racice/uszy; nizsza i dluzsza od krowy.
export function buildSwinia(opts: { poza?: PozaSwini; wariant?: WariantSwini } = {}): THREE.Group {
  const poza = opts.poza ?? 'stojaca';
  const wariant = opts.wariant ?? 'rozowa';
  const s = PASTWISKO_S;
  const roz  = mat(0xf2a7b3); // cialo — cieply roz
  const roz2 = mat(0xd9808f); // ryj / racice-nogi / uszy / ogonek (ciemniejszy roz)
  const noz  = mat(0xb3596b); // nozdrza
  const oko  = mat(0x2a2226);
  const lata = mat(0x503a3e); // ciemne laty (wariant laciata)
  const g = new THREE.Group();

  // krotkie nogi-racice (ciemniejszy roz)
  const legH = 0.036 * s, legW = 0.026 * s;
  for (const [lx, lz] of [[-0.066, 0.036], [-0.066, -0.036], [0.062, 0.036], [0.062, -0.036]] as const) {
    B(g, legW, legH, legW, lx * s, legH / 2, lz * s, roz2);
  }
  // TULOW-BECZKA: rdzen + box obrocony 45 st. => osmiokatny, "kielbaskowaty" przekroj
  B(g, 0.205 * s, 0.096 * s, 0.108 * s, -0.008 * s, 0.082 * s, 0, roz);
  B(g, 0.195 * s, 0.086 * s, 0.086 * s, -0.008 * s, 0.082 * s, 0, roz, Math.PI / 4, 0, 0);
  if (wariant === 'laciata') { // laty przenikaja tulow, wystaja po bokach
    B(g, 0.058 * s, 0.100 * s, 0.114 * s, -0.062 * s, 0.086 * s, 0, lata);
    B(g, 0.044 * s, 0.088 * s, 0.112 * s, 0.026 * s, 0.076 * s, 0, lata);
  }
  // ZAKRECONY OGONEK — 3 segmenty zwiniete w kreciolek za zadem (petla widoczna z boku)
  B(g, 0.017 * s, 0.038 * s, 0.017 * s, -0.114 * s, 0.120 * s, 0.004 * s, roz2, 0, 0, 0.60);
  B(g, 0.016 * s, 0.034 * s, 0.016 * s, -0.130 * s, 0.128 * s, 0.009 * s, roz2, 0, 0, 1.75);
  B(g, 0.015 * s, 0.030 * s, 0.015 * s, -0.136 * s, 0.113 * s, 0.014 * s, roz2, 0, 0, 2.85);

  // GLOWA — podgrupa z pivotem przy karku (poza ryjaca = obrot calosci w dol)
  const head = new THREE.Group();
  head.position.set(0.098 * s, 0.082 * s, 0);
  g.add(head);
  const H = (w: number, h: number, d: number, cx: number, cy: number, cz: number, m: THREE.Material, rx = 0, ry = 0, rz = 0) =>
    B(head, w * s, h * s, d * s, cx * s, cy * s, cz * s, m, rx, ry, rz);
  H(0.075, 0.068, 0.088, 0.016, 0.004, 0, roz);              // LEB klockowy
  H(0.046, 0.050, 0.064, 0.070, -0.006, 0, roz2);            // duzy prostokatny RYJ
  H(0.010, 0.017, 0.015, 0.0925, -0.004, 0.015, noz);        // nozdrze L
  H(0.010, 0.017, 0.015, 0.0925, -0.004, -0.015, noz);       // nozdrze P
  H(0.013, 0.016, 0.013, 0.046, 0.020, 0.0405, oko);         // oko L (na lbie, wystaje bokiem)
  H(0.013, 0.016, 0.013, 0.046, 0.020, -0.0405, oko);        // oko P
  // trojkatne KLAPNIETE uszy (cone3 splaszczony, czubkiem w przod-dol-bok)
  EAR(head, 0.028 * s, 0.060 * s, 0.034 * s, 0.038 * s, 0.026 * s, 0.45, -0.35, 0.82, roz2, 0.45, EAR_TWIST);
  EAR(head, 0.028 * s, 0.060 * s, 0.034 * s, 0.038 * s, -0.026 * s, 0.45, -0.35, -0.82, roz2, 0.45, -EAR_TWIST);

  if (poza === 'ryjaca') { // leb wysuniety przed piers, pivot nizej, obrot w dol:
    head.position.set(0.112 * s, 0.072 * s, 0); // koniec ryja laduje na y~0 (trawa)
    head.rotation.z = -0.80;
  }
  return g;
}

// ============================ TRZODA_LAYOUT ================================
export interface TrzodaSlot { x: number; z: number; rotY: number; poza: string; wariant: string; }

const az = (deg: number, r: number): { x: number; z: number } => ({
  x: +(r * Math.sin((deg * Math.PI) / 180)).toFixed(3),
  z: +(-r * Math.cos((deg * Math.PI) / 180)).toFixed(3),
});

/**
 * Uklad heksa TRZODY — wspolrzedne znormalizowane do HEX_R (jak PASTWISKO_LAYOUT).
 * Azymut: 0 = N(-z), 90 = E(+x); x = r*sin(az), z = -r*cos(az).
 * Zwierzeta WYLACZNIE w sektorze N-NE pierscienia (r 0.55-0.70) — srodek heksa
 * (okrag r 0.40) zostaje WOLNY jako rezerwa pod miasto; sektory W-NW (farma)
 * i E (kon) wg PASTWISKO_LAYOUT.sektory / ULEPSZENIA_P2_LAYOUT.
 */
export const TRZODA_LAYOUT = {
  hexR: 1.0,
  /** REZERWA pod miasto: okrag w srodku heksa (nie stawiac tu zadnych figur). */
  miasto: { x: 0, z: 0, r: 0.40 },
  pierscien: { rMin: 0.55, rMax: 0.70 },
  sektor: { azOd: -25, azDo: 70, opis: 'N-NE' },
  sloty: {
    krowa:  { ...az(6, 0.63), rotY: 2.25, poza: 'pasaca', wariant: 'lacata' },
    swinia: { ...az(52, 0.60), rotY: -0.95, poza: 'stojaca', wariant: 'rozowa' },
  },
} as const;

/**
 * Zloze TRZODY (dawne "bydlo"): WYSOKA jakosc = krowa lacata + swinia,
 * NISKA/NORMALNA = 1 krowa. Srodek heksa zostaje wolny (rezerwa pod miasto).
 */
export function buildTrzoda(
  opts: { jakosc?: JakoscTrzody; hexR?: number } = {},
): THREE.Group {
  const jakosc = opts.jakosc ?? 'wysoka';
  const hexR = opts.hexR ?? TRZODA_LAYOUT.hexR;
  const g = new THREE.Group();
  const put = (fig: THREE.Group, slot: { x: number; z: number; rotY: number }): void => {
    fig.position.set(slot.x * hexR, 0, slot.z * hexR);
    fig.rotation.y = slot.rotY;
    g.add(fig);
  };
  put(buildKrowa({ poza: 'pasaca', wariant: 'lacata' }), TRZODA_LAYOUT.sloty.krowa);
  if (jakosc === 'wysoka') {
    put(buildSwinia({ poza: 'stojaca', wariant: 'rozowa' }), TRZODA_LAYOUT.sloty.swinia);
  }
  return g;
}
