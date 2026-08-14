/**
 * droga-6-ramion.ts — DROGA jako SZEŚCIORAMIENNA GWIAZDA (render, Opus 5).
 * Temat R-DROGA-WZOR-6-RAMION (dokument designerski Macieja, 2026-08-14).
 *
 * CO ZASTĘPUJE: sztywny pas N–S przez środek heksa (buildDrogaNawierzchnia /
 * buildDrogaBrukowanaNawierzchnia z ulepszenia-modele-p3b.ts + blok DROGA_KEYS
 * w improvements.ts, komentarz z 2026-07-09: „Łączenie dróg rozwiążemy inaczej
 * w przyszłości"). Pas rysował się identycznie niezależnie od sąsiadów, więc drogi
 * się nie łączyły — kończyły się na krawędzi heksa i zaczynały „obok".
 *
 * ZASADA: jedno ramię na AKTYWNY kierunek maski (map/road-network.ts), zakończone
 * PŁASKO dokładnie w połowie ścianki heksa (port). Port kafla = port sąsiada, więc
 * szew jest niewidoczny bez dopasowywania. Węzeł (placyk) TYLKO przy 3+ ramionach.
 * Zero tabeli 64 wariantów, zero sprite'ów per kombinacja — jeden algorytm.
 * / EN: one arm per active mask direction, flat-ended exactly at the hex edge midpoint
 * (port). A tile's port is the neighbour's port, so seams need no art matching. The
 * central node is drawn only at 3+ arms. No 64-variant table, no per-combination sprites.
 *
 * ORIENTACJA: silnik ma heks POINTY-TOP (hexutil.ts / hexShape.ts), a makieta była
 * flat-topem spłaszczonym pionowo — ten sam heks obrócony o 30°. Porty liczy
 * roadPortOffset() wprost z axialToWorld, więc trafiają w środki ŚCIANEK silnika
 * (kąty 0°, ±60°, ±120°, 180° w płaszczyźnie XZ), a nie w piksele makiety.
 * / EN: the engine hex is POINTY-TOP while the mockup was a squashed flat-top (same hex,
 * rotated 30°). Ports come from axialToWorld, so they land on the engine's real edge
 * midpoints instead of the mockup's raw pixels.
 *
 * KONWENCJE: spód nawierzchni na y=0 (wierzch kafla), jednostki znormalizowane do HEX_R=1,
 * MeshLambert + flatShading (styl roblox). NAJWYŻSZY punkt całej gwiazdy = 0.0736 przy HEX_R=1
 * (pełna gwiazda BRUKOWANA: płyta węzła 0.052+0.011+0.014/2 = 0.070 plus 6×0.0006 mikro-schodka
 * przeciw z-fightingowi); gruntowa jest niższa. Dzięki temu droga zostaje POD propsami kafla
 * (budynki/drzewa startują od y=0 i są o rząd wielkości wyższe) i NAD teksturą terenu.
 * Liczbę pilnuje `tools/droga-6-ramion-geom-test.cjs` — poprzednia wersja tego komentarza
 * deklarowała „< 0.07", czyli mniej niż realne maksimum (znalezisko Evaluatora 2026-08-14).
 * / EN: surface bottom at y=0, units normalised to HEX_R=1; the tallest point of the whole star
 * is 0.0736 at HEX_R=1 (full COBBLED star), so the road stays UNDER tile props and ABOVE the
 * terrain surface. The figure is pinned by tools/droga-6-ramion-geom-test.cjs.
 */
import * as THREE from 'three';
import {
  ROAD_ARM_WIDTH_RATIO,
  ROAD_NODE_RADIUS_RATIO,
  roadArmLength,
  roadMaskArms,
  roadMaskHasNode,
  roadMaskIsLonePatch,
  roadPortRotationY,
} from '../map/road-network';

export type RoadTyp = 'droga' | 'droga_brukowana';

/** Paleta 1:1 z ulepszenia-modele-p3b.ts (P.droga* / P.bruk*) — ta sama droga, inny przebieg. */
const P = {
  drogaPas: 0xd2b184, drogaKoleina: 0xa8895e, drogaPlama: 0xc3a173,
  brukBaza: 0x7b8794, brukA: 0xb9c2ca, brukB: 0x939ea9,
  kamien: 0x9aa5b1, kamienDk: 0x717d89,
} as const;

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

function B(
  g: THREE.Object3D, w: number, h: number, d: number,
  cx: number, cy: number, cz: number, m: THREE.Material, ry = 0,
): void {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  mesh.position.set(cx, cy, cz);
  if (ry) mesh.rotation.y = ry;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  g.add(mesh);
}

function CYL(
  g: THREE.Object3D, r: number, h: number, cy: number, m: THREE.Material, seg = 6,
): void {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), m);
  mesh.position.set(0, cy, 0);
  mesh.receiveShadow = true;
  g.add(mesh);
}

/** Grubość nawierzchni gruntowej / brukowanej (spód y=0). */
const H_GRUNT = 0.045;
const H_BRUK = 0.052;

/**
 * Ramię gruntowe: pas od ŚRODKA heksa (x=0) do portu (x=len), zakończenie płaskie.
 * Koleiny biegną wzdłuż ramienia, kamyki rozrzucone — czytelne z lotu ptaka.
 * / EN: dirt arm from the hex centre (x=0) to the port (x=len), flat end.
 */
function armGruntowe(len: number, w: number, pasM: THREE.Material, koleinaM: THREE.Material,
  kamM: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  B(g, len, H_GRUNT, w, len / 2, H_GRUNT / 2, 0, pasM);
  for (const sz of [-1, 1] as const) {
    B(g, len - w * 0.22, 0.012, w * 0.19, len / 2, H_GRUNT + 0.004, sz * w * 0.27, koleinaM);
  }
  B(g, w * 0.30, 0.014, w * 0.24, len * 0.42, H_GRUNT + 0.005, w * 0.10, kamM, 0.6);
  B(g, w * 0.24, 0.014, w * 0.20, len * 0.78, H_GRUNT + 0.005, -w * 0.12, kamM, -0.4);
  return g;
}

/**
 * Ramię brukowane: podbudowa + 2 rzędy płyt w układzie cegiełki (przesunięty co drugi rząd).
 * / EN: cobbled arm: sub-base + two staggered rows of slabs (brick bond).
 */
function armBrukowane(len: number, w: number, bazaM: THREE.Material, plytaA: THREE.Material,
  plytaB: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  B(g, len, H_BRUK, w, len / 2, H_BRUK / 2, 0, bazaM);
  const plytaLen = len / 3.6;
  for (let row = 0; row < 2; row++) {
    const rz = (row === 0 ? -1 : 1) * w * 0.25;
    const off = row === 1 ? plytaLen * 0.45 : 0;
    for (let col = 0; col < 3; col++) {
      // Ostatnia płyta dosunięta do portu, żeby brukowanie dochodziło do samej ścianki
      // (na styku kafli widać wtedy bruk, a nie goły podkład).
      // / EN: the last slab is clamped to the port so the paving reaches the very edge.
      const px = Math.min(plytaLen * 0.62 + col * plytaLen * 1.14 + off, len - plytaLen / 2);
      B(g, plytaLen, 0.014, w * 0.42, px, H_BRUK + 0.004, rz, (row + col) % 2 ? plytaA : plytaB);
    }
  }
  return g;
}

/** Węzeł (3+ ramion): placyk szerszy od ramienia, żeby skrzyżowanie było czytelne. */
function wezel(typ: RoadTyp, promien: number): THREE.Group {
  const g = new THREE.Group();
  if (typ === 'droga_brukowana') {
    CYL(g, promien, H_BRUK + 0.004, (H_BRUK + 0.004) / 2, mat(P.brukBaza), 6);
    CYL(g, promien * 0.55, 0.014, H_BRUK + 0.011, mat(P.brukA), 6);
  } else {
    CYL(g, promien, H_GRUNT + 0.004, (H_GRUNT + 0.004) / 2, mat(P.drogaPas), 6);
    CYL(g, promien * 0.52, 0.014, H_GRUNT + 0.011, mat(P.drogaPlama), 6);
  }
  return g;
}

/**
 * Gwiazda drogi dla maski sąsiedztwa. `mask` — 6 bitów (map/road-network.ts,
 * bit i = sąsiad w kierunku ROAD_DIRS[i] ma drogę).
 *
 * DWA TYPY DRÓG na styku (decyzja Operatora, dokument tego nie rozstrzyga): KAŻDY kafel
 * rysuje swoje ramiona WŁASNYM materiałem — bruk kończy się brukiem, grunt gruntem,
 * a przejście typu wypada na wspólnej krawędzi. Nie mieszamy materiałów w połowie ramienia:
 * to rzadki przypadek brzegowy, a szew na granicy kafli i tak jest naturalnym miejscem
 * zmiany nawierzchni (i nie wymaga wiedzy o typie sąsiada w geometrii).
 * / EN: two road types meeting (Operator decision, not settled by the doc): every tile draws
 * its own arms in its own material, so the surface changes exactly on the shared edge. No
 * mid-arm material blending — rare edge case, and the tile border is the natural seam.
 */
export function buildDrogaGwiazda(typ: RoadTyp, mask: number, hexR = 1): THREE.Group {
  const g = new THREE.Group();
  const w = ROAD_ARM_WIDTH_RATIO * hexR;
  const len = roadArmLength(hexR);
  const nodeR = ROAD_NODE_RADIUS_RATIO * hexR;

  // Materiały tworzone RAZ na gwiazdę (jeden mesh po collapseToMergedMesh i tak scala geometrię,
  // ale bez tego każde ramię trzymałoby własny materiał). / EN: materials created once per star.
  const pasM = mat(P.drogaPas), koleinaM = mat(P.drogaKoleina), kamM = mat(P.kamien);
  const bazaM = mat(P.brukBaza), plytaA = mat(P.brukA), plytaB = mat(P.brukB);

  const arms = roadMaskArms(mask);
  arms.forEach((dir, i) => {
    const arm = typ === 'droga_brukowana'
      ? armBrukowane(len, w, bazaM, plytaA, plytaB)
      : armGruntowe(len, w, pasM, koleinaM, kamM);
    arm.rotation.y = roadPortRotationY(dir);
    // Ramiona nachodzą na siebie w środku heksa; identyczne Y dawałoby migotanie
    // współpłaszczyznowych ścian (z-fighting). Mikro-schodek 0.6 mm na ramię jest
    // niewidoczny, a rozstrzyga kolejność rysowania.
    // / EN: arms overlap at the hex centre; equal Y would z-fight, so each arm is nudged
    // by a sub-millimetre step — invisible, but resolves the coplanar faces.
    arm.position.y = i * 0.0006;
    g.add(arm);
  });

  if (roadMaskHasNode(mask)) {
    const n = wezel(typ, nodeR);
    n.position.y = arms.length * 0.0006;
    g.add(n);
  } else if (roadMaskIsLonePatch(mask)) {
    // Droga bez ani jednego sąsiada z drogą — sam placyk, żeby świeżo postawione
    // ulepszenie było widoczne (uzasadnienie: road-network.ts, roadMaskIsLonePatch).
    // / EN: road with no road neighbour — a bare patch so a freshly built tile is visible.
    g.add(wezel(typ, w * 0.62));
  }
  return g;
}
