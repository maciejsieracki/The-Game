/**
 * wioska-oboz.ts — WIOSKA NEUTRALNA + OBOZ BARBARZYNCOW w stylu Roblox
 * (klockowate boxy, zywe plaskie kolory, MeshLambert flatShading, zero tekstur,
 * czytelne z lotu ptaka). Seria: ulepszenia-modele-p2/p3a/p3b.
 *
 * MODELE (tri: box=12, cylinder6=24, cone4=8, cone5=10, cone6=12; DZIS -> NOWE):
 *  - buildWioska()                 0 -> 438 tri — 3 chatki gliniano-drewniane
 *      (strzechy w 2 odcieniach: jasna + ciemna, jedna chata okragla-lepianka),
 *      studnia z ZURAWIEM (slup, ramie, przeciwwaga, linka, wiaderko), 2 plotki
 *      z zerdzia, klepiskowy placyk + 2 sciezki, stragan z czerwona plachta
 *      i towarem. Cieple, przyjazne kolory — neutralna nagroda do odwiedzenia.
 *  - buildObozBarbarzyncow(color)  0 -> 444 tri — luk PALISADY z 10 zaostrzonych
 *      pali (cone4) z przerwa-BRAMA od +x (2 slupy + nadproze + BANER
 *      W KOLORZE FRAKCJI jak baner fortu P3B), 2 namioty ze skor (ciemniejsze i brutalniejsze niz
 *      tipi obozu lowieckiego P3A), ognisko z klockowym dymem, TOTEM z klockowa
 *      czaszka zwierzeca (rogi cone4) i plachta frakcji, stojak z bronia
 *      (wlocznia + topor), ciemne klepisko. Grozny, ale zabawkowy (zero gore).
 *
 * STAN DZIS (badanie kanonu gra/src, 2026-07-10):
 *  - WIOSKA: istnieje TYLKO w mechanice — types/hex.ts:77 (interface Wioska,
 *    hex.wioska.istnieje), map/generator.ts:226 (init), game/ai.ts:979+1136
 *    (findNearestVillage — AI aktywnie ich szuka), game/cities.ts:343
 *    (foundCityFromVillage). RENDER: BRAK (0 tri) — zaden plik render/ nie
 *    czyta hex.wioska; wioska jest na mapie NIEWIDOCZNA.
 *  - OBOZ BARBARZYNCOW: game/barbarians.ts:63 (interface BarbCamp {id,q,r,
 *    spawnCooldown}), spawnCamps/tickCamps wpiete w main.ts:3131 (stan
 *    barbCamps) i main.ts:10719-10760 (tick). RENDER: BRAK (0 tri) — komentarz
 *    w barbarians.ts:60 ("terrain features the engine renders") jest na wyrost,
 *    silnik obozow nie rysuje.
 *  - KOLOR FRAKCJI BARBARZYNCOW: BARBARIAN_OWNER_ID = -1 (game/barbarians.ts:47)
 *    NIE MA dedykowanej barwy — civColorFn(-1) spada na fallback 'grecy'
 *    #1E5AA8 (main.ts:1193). Jedyne faktyczne oznaczenie wroga w renderze to
 *    czerwony war-ring 0xff4444 (render/units.ts:233 WAR_RING_COLOR, stance
 *    'hostile' z main.ts:2739 isBarbarian). Dlatego DOMYSLNY kolor proporca
 *    obozu = 0xff4444 (BARB_FACTION_COLOR ponizej).
 *
 * KONWENCJE (zgodne z pastwisko-modele.ts / ulepszenia-modele-p2/p3a/p3b):
 *  - spod modelu na y=0 (powierzchnia heksa), przod = +x (brama obozu,
 *    wejscia chatek ku sciezce), obrot calosci = rotation.y,
 *  - wspolrzedne znormalizowane do HEX_R=1 (hexutil.ts), footprint r<=0.58
 *    (mniejszy niz miasto: mur miasta siega 0.70*HEX_R po CITY_MODEL_SCALE
 *    1.38, render/cities.ts:122+383) — pierwszoplanowy, ale nie przerasta miast,
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az).
 *
 * INTERFEJS KOLORU FRAKCJI (jak buildFort/buildPosterunek, p3b:270/:313):
 *  buildObozBarbarzyncow(color?: number) — maskuje color & 0xffffff i barwi
 *  baner bramy + plachte totemu. Default BARB_FACTION_COLOR = 0xff4444.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src) — obiekty NIE sa ulepszeniami
 * (nie wchodza w sektorowy uklad buildImprovementSectored), tylko obiektami
 * srodka heksa jak miasto:
 *  1. Plik skopiowac do gra/src/render/wioska-oboz.ts.
 *  2. WIOSKA — main.ts przy budowie/odswiezaniu heksow (obok
 *     spawnImprovementMesh, main.ts:4408): dla heksa z hex.wioska.istnieje
 *     i bez miasta:
 *       const m = buildWioska();
 *       const wp = axialToWorld(q, r, HEX_R);
 *       m.position.set(wp.x, terrainTopY(hex), wp.z);
 *       m.rotation.y = WIOSKA_OBOZ_LAYOUT.wioska.budynek.rotY;
 *       scene.add(m);  // + collapseToMergedMesh(m) jak ulepszenia (FPS)
 *     Usunac mesh gdy foundCityFromVillage zamienia wioske w miasto.
 *  3. OBOZ — main.ts po tickCamps (main.ts:10737, zmiana listy barbCamps):
 *     sync mesh per camp.id (wzor: CityRenderer.sync render/cities.ts:374):
 *       const m = buildObozBarbarzyncow();          // 0xff4444
 *       m.rotation.y = WIOSKA_OBOZ_LAYOUT.obozBarbarzyncow.budynek.rotY;
 *     Usunac mesh gdy oboz znika z listy (zniszczony).
 *  4. Oba modele: skala 1.0 (bez CITY_MODEL_SCALE — celowo mniejsze od miast).
 */
import * as THREE from 'three';

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

/** Klocek: srodek (cx,cy,cz), opcjonalny obrot — wymiary/pozycje w jednostkach swiata. */
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

/** Walec (seg=6 domyslnie — klockowy szesciokat w stylu serii). */
function CYL(
  g: THREE.Object3D, rt: number, rb: number, h: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
  seg = 6, rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m);
  mesh.position.set(cx, cy, cz);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

function CONE(
  g: THREE.Object3D, r: number, h: number,
  cx: number, cy: number, cz: number, m: THREE.Material, seg = 4,
  rx = 0, ry = 0, rz = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m);
  mesh.position.set(cx, cy, cz);
  if (rx || ry || rz) mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

const azXZ = (deg: number, r: number): { x: number; z: number } => ({
  x: r * Math.sin((deg * Math.PI) / 180),
  z: -r * Math.cos((deg * Math.PI) / 180),
});

/** Paleta (spojna z P2/P3A/P3B; strzechaDk i skory obozu — nowe odcienie). */
const P = {
  sciana: 0xd9a05b, scianaHi: 0xe8b877, bialy: 0xf7f4ea,
  strzecha: 0xf0c34e, strzechaDk: 0xc0913a, strzechaKal: 0xdba044,
  drewno: 0xc98a4b, drewnoDk: 0x8a5a2e, drewnoC: 0x6b4423,
  drzwi: 0x7a4a22, cien: 0x4a2f16,
  kamien: 0x9aa5b1, kamienDk: 0x717d89,
  sciezka: 0xbb9059, ziemia: 0x8a6a45, klepisko: 0xa08a68,
  woda: 0x4ab6e8, plachta: 0xd93a2b,
  towarDynia: 0xffa726, towarWarzywo: 0x94bf78,
  skora: 0x9a6b45, skoraDk: 0x7d5233, skoraLata: 0xb5854f,
  czern: 0x14100b, kosc: 0xede3cc, pal: 0x77502c,
  ogien: 0xff6b2e, plomien: 0xffc02e, dym: 0xd2d2c8, dymDk: 0xb0b0a4,
  stal: 0xd7dde2,
} as const;

/** Domyslna barwa frakcji barbarzyncow = WAR_RING_COLOR (render/units.ts:233). */
export const BARB_FACTION_COLOR = 0xff4444;

export const WIOSKA_OBOZ_LAYOUT = {
  hexR: 1.0,
  /** Wejscia chatek ku placykowi, stragan ku NE — lekki obrot dla kompozycji. */
  wioska: { budynek: { x: 0, z: 0, rotY: 0.10 }, skala: 1.0 },
  /** Brama obozu = +x (przod); obrot calosci wg sasiedztwa (np. ku graczowi). */
  obozBarbarzyncow: { budynek: { x: 0, z: 0, rotY: -0.15 }, skala: 1.0 },
} as const;

// ================================ WIOSKA ===================================
/**
 * Neutralna wioska: 3 chatki (2 prostokatne + okragla lepianka), studnia
 * z zurawiem, plotki, klepiskowy placyk ze sciezkami, stragan. 438 tri.
 */
export function buildWioska(): THREE.Group {
  const g = new THREE.Group();
  const scianaM = mat(P.sciana), scianaHiM = mat(P.scianaHi),
    strzechaM = mat(P.strzecha), strzechaDkM = mat(P.strzechaDk),
    drewnoM = mat(P.drewno), drewnoDkM = mat(P.drewnoDk), belkaM = mat(P.drewnoC),
    drzwiM = mat(P.drzwi), oknoM = mat(P.cien), kamienM = mat(P.kamien),  // oknoM: okiennice chaty B
    sciezkaM = mat(P.sciezka), plachtaM = mat(P.plachta);

  // KLEPISKO: placyk (szesciokatny plaski disc, 6 tri) + 2 sciezki — 30 tri
  const plac = new THREE.Mesh(new THREE.CircleGeometry(0.165, 6), sciezkaM);
  plac.rotation.x = -Math.PI / 2;
  plac.position.set(0.02, 0.012, 0.05);
  g.add(plac);
  B(g, 0.32, 0.011, 0.11, -0.20, 0.0055, -0.10, sciezkaM, 0, 0.75, 0);  // ku chacie A
  B(g, 0.28, 0.011, 0.10, 0.21, 0.0055, -0.04, sciezkaM, 0, -0.25, 0);  // ku chacie B

  // CHATA A (duza, NW, strzecha JASNA, front ku placykowi) — 60 tri
  const chA = new THREE.Group();
  B(chA, 0.30, 0.19, 0.23, 0, 0.095, 0, scianaM);                       // korpus glina
  B(chA, 0.34, 0.038, 0.155, 0, 0.225, 0.066, strzechaM, 0.63, 0, 0);   // polac +z
  B(chA, 0.34, 0.038, 0.155, 0, 0.225, -0.066, strzechaM, -0.63, 0, 0); // polac -z
  B(chA, 0.33, 0.038, 0.075, 0, 0.267, 0, mat(P.strzechaKal));          // kalenica
  B(chA, 0.016, 0.105, 0.075, 0.152, 0.0525, 0.02, drzwiM);             // drzwi (+x)
  chA.position.set(-0.36, 0, -0.30);
  chA.rotation.y = -0.85;
  g.add(chA);

  // CHATA B (E, strzecha CIEMNA, bielone sciany, front ku placykowi) — 72 tri
  const chB = new THREE.Group();
  B(chB, 0.26, 0.165, 0.20, 0, 0.0825, 0, scianaHiM);
  B(chB, 0.30, 0.036, 0.135, 0, 0.196, 0.058, strzechaDkM, 0.63, 0, 0);
  B(chB, 0.30, 0.036, 0.135, 0, 0.196, -0.058, strzechaDkM, -0.63, 0, 0);
  B(chB, 0.32, 0.042, 0.075, 0, 0.238, 0, strzechaM);
  B(chB, 0.015, 0.095, 0.07, 0.132, 0.0475, 0, drzwiM);
  B(chB, 0.05, 0.045, 0.014, -0.055, 0.075, 0.103, oknoM);              // okno (+z)
  chB.position.set(0.37, 0, -0.08);
  chB.rotation.y = -2.05;
  g.add(chB);

  // CHATA C (S, okragla lepianka, stozkowa strzecha jasna) — 48 tri
  const chC = new THREE.Group();
  CYL(chC, 0.105, 0.115, 0.13, 0, 0.065, 0, scianaM);
  CONE(chC, 0.155, 0.15, 0, 0.205, 0, strzechaM, 6, 0, 0.26, 0);
  B(chC, 0.015, 0.09, 0.065, 0.108, 0.045, 0, drzwiM);
  chC.position.set(-0.02, 0, 0.42);
  chC.rotation.y = -1.55;
  g.add(chC);

  // STUDNIA Z ZURAWIEM (przy placyku) — 84 tri
  const st = new THREE.Group();
  CYL(st, 0.075, 0.085, 0.075, 0, 0.0375, 0, kamienM);                  // cembrowina
  B(st, 0.032, 0.24, 0.032, 0.14, 0.12, 0.02, drewnoDkM);               // slup zurawia
  B(st, 0.25, 0.024, 0.024, 0.05, 0.25, 0.02, drewnoM, 0, 0, 0.42);     // ramie
  B(st, 0.048, 0.05, 0.048, 0.15, 0.295, 0.02, drewnoDkM);              // przeciwwaga
  B(st, 0.012, 0.10, 0.012, -0.045, 0.145, 0.02, belkaM);               // linka
  B(st, 0.046, 0.04, 0.046, -0.045, 0.078, 0.02, drewnoDkM);            // wiaderko
  st.position.set(0.11, 0, 0.15);
  st.rotation.y = 2.9;
  g.add(st);

  // PLOTKI (2 segmenty: 2 slupki + zerdz) — 72 tri
  const plot = (x: number, z: number, ry: number): void => {
    const p = new THREE.Group();
    B(p, 0.028, 0.10, 0.028, -0.10, 0.05, 0, drewnoDkM);
    B(p, 0.028, 0.10, 0.028, 0.10, 0.05, 0, drewnoDkM);
    B(p, 0.28, 0.026, 0.02, 0, 0.082, 0, drewnoM);
    p.position.set(x, 0, z);
    p.rotation.y = ry;
    g.add(p);
  };
  plot(0.34, 0.28, 0.90);   // przy sciezce S-E
  plot(-0.42, 0.14, 0.35);  // przy chacie A / lepiance

  // STRAGAN (NE, czerwona plachta, lada z towarem) — 72 tri
  const str = new THREE.Group();
  B(str, 0.032, 0.19, 0.032, 0.095, 0.095, -0.085, drewnoDkM);          // slupki
  B(str, 0.032, 0.19, 0.032, 0.095, 0.095, 0.085, drewnoDkM);
  B(str, 0.19, 0.015, 0.21, 0.015, 0.208, 0, plachtaM, 0, 0, -0.30);    // plachta (skos ku tylowi)
  B(str, 0.15, 0.055, 0.17, 0.045, 0.0825, 0, drewnoM);                 // lada
  B(str, 0.05, 0.048, 0.05, 0.05, 0.134, -0.042, mat(P.towarDynia));    // dynie
  B(str, 0.055, 0.04, 0.05, 0.045, 0.130, 0.046, mat(P.towarWarzywo));  // warzywa
  str.position.set(0.15, 0, -0.36);
  str.rotation.y = 0.95;
  g.add(str);

  return g; // 438 tri
}

// ========================= OBOZ BARBARZYNCOW ===============================
/**
 * Oboz barbarzyncow: luk palisady z zaostrzonych pali z brama od +x,
 * proporzec frakcji na nadprozu, 2 ciemne namioty ze skor, ognisko z dymem,
 * totem z klockowa czaszka, stojak z bronia, klepisko. 444 tri.
 * @param color barwa frakcji (proporzec + plachta totemu); default 0xff4444
 *              = WAR_RING_COLOR (render/units.ts:233) — patrz naglowek.
 */
export function buildObozBarbarzyncow(color: number = BARB_FACTION_COLOR): THREE.Group {
  const g = new THREE.Group();
  const frakcjaM = mat(color & 0xffffff);
  const palM = mat(P.pal), belkaM = mat(P.drewnoDk),
    skoraM = mat(P.skora), skoraDkM = mat(P.skoraDk), lataM = mat(P.skoraLata),
    czernM = mat(P.czern), koscM = mat(P.kosc), kamienM = mat(P.kamienDk),
    ogienM = mat(P.ogien), plomienM = mat(P.plomien),
    dymM = mat(P.dym), dymDkM = mat(P.dymDk), stalM = mat(P.stal);

  // KLEPISKO: udeptana ziemia (jasniejsza od namiotow — czytelnosc z gory) — 12 tri
  B(g, 0.54, 0.011, 0.46, -0.02, 0.0055, 0.02, mat(P.klepisko), 0, 0.35, 0);

  // PALISADA: 10 zaostrzonych pali (cone4) na luku r=0.50, przerwa-brama
  // od +x (az 70..110 wolne); pale lekko pochylone na zewnatrz — 80 tri
  for (let i = 0; i < 10; i++) {
    const az = 110 + i * (320 / 9);                 // 110..430 (=70)
    const { x, z } = azXZ(az, 0.50);
    const h = 0.34 + 0.06 * ((i * 37) % 3) / 2;     // 0.34-0.40 (rytm 3 wysokosci)
    const lean = 0.06;
    CONE(g, 0.062, h, x, h / 2, z, palM, 4,
      -lean * Math.cos((az * Math.PI) / 180), (i % 3) * 0.4, lean * Math.sin((az * Math.PI) / 180));
  }
  // zerdz wiazaca (cieg poziomy na luku S-W) — 12 tri
  {
    const n1 = azXZ(250, 0.475);
    B(g, 0.032, 0.032, 0.50, n1.x, 0.14, n1.z, belkaM, 0, (-250 * Math.PI) / 180 + Math.PI / 2, 0);
  }

  // BRAMA (az 70 i 110, r=0.50): 2 slupy + nadproze — 36 tri
  const b1 = azXZ(70, 0.50), b2 = azXZ(110, 0.50);
  B(g, 0.065, 0.32, 0.065, b1.x, 0.16, b1.z, belkaM);
  B(g, 0.065, 0.32, 0.065, b2.x, 0.16, b2.z, belkaM);
  B(g, 0.055, 0.055, 0.45, b1.x, 0.345, 0, belkaM);                     // nadproze

  // PROPORZEC FRAKCJI: baner wiszacy z nadproza (jak baner fortu p3b) — 12 tri
  B(g, 0.016, 0.15, 0.11, b1.x + 0.02, 0.26, 0, frakcjaM);

  // NAMIOT WODZA (NW, wiekszy, ciemna skora, zerdz z czubka) — 46 tri
  const nam1 = new THREE.Group();
  CONE(nam1, 0.21, 0.30, 0, 0.15, 0, skoraM, 5, 0, 0.3, 0);
  B(nam1, 0.05, 0.10, 0.075, 0.135, 0.045, 0, czernM);                  // wejscie (+x)
  B(nam1, 0.015, 0.18, 0.015, 0.03, 0.32, 0.02, palM, 0.4, 0, 0.25);    // zerdz z czubka
  B(nam1, 0.085, 0.10, 0.013, -0.09, 0.13, 0.155, lataM, 0.35, -0.5, 0);// lata
  nam1.position.set(-0.18, 0, -0.18);
  nam1.rotation.y = 0.55;
  g.add(nam1);

  // NAMIOT 2 (S, mniejszy, najciemniejsza skora) — 34 tri
  const nam2 = new THREE.Group();
  CONE(nam2, 0.165, 0.24, 0, 0.12, 0, skoraDkM, 5, 0, 1.1, 0);
  B(nam2, 0.045, 0.085, 0.065, 0.105, 0.04, 0, czernM);
  B(nam2, 0.014, 0.15, 0.014, 0.01, 0.255, 0.015, palM, 0.3, 0, -0.35);
  nam2.position.set(-0.06, 0, 0.30);
  nam2.rotation.y = -0.35;
  g.add(nam2);

  // OGNISKO z klockowym dymem (srodek, przy bramie) — 76 tri
  const ogn = new THREE.Group();
  B(ogn, 0.05, 0.04, 0.05, 0.09, 0.02, 0.03, kamienM, 0, 0.4, 0);       // kamienie
  B(ogn, 0.048, 0.038, 0.048, -0.05, 0.019, -0.06, kamienM, 0, 1.1, 0);
  B(ogn, 0.16, 0.03, 0.03, 0, 0.03, 0.01, czernM, 0, 0.55, 0);          // polano
  CONE(ogn, 0.055, 0.11, 0, 0.095, 0, ogienM, 4, 0, 0.2, 0);            // plomienie
  CONE(ogn, 0.03, 0.07, 0, 0.10, 0, plomienM, 4, 0, 0.6, 0);
  B(ogn, 0.068, 0.058, 0.068, 0.005, 0.285, 0.005, dymDkM, 0.2, 0.5, 0.15); // dym
  B(ogn, 0.092, 0.08, 0.092, 0.025, 0.415, 0.025, dymM, -0.15, 0.2, 0.3);
  ogn.position.set(0.20, 0, 0.02);
  g.add(ogn);

  // TOTEM z klockowa czaszka zwierzeca + plachta frakcji (N przy bramie) — 64 tri
  const tot = new THREE.Group();
  B(tot, 0.048, 0.40, 0.048, 0, 0.20, 0, palM);                         // slup
  B(tot, 0.10, 0.082, 0.105, 0, 0.435, 0.005, koscM);                   // czaszka
  B(tot, 0.062, 0.042, 0.05, 0, 0.402, 0.078, koscM);                   // pysk
  CONE(tot, 0.024, 0.14, -0.098, 0.462, 0, koscM, 4, 0, 0, 1.25);       // rogi na boki
  CONE(tot, 0.024, 0.14, 0.098, 0.462, 0, koscM, 4, 0, 0, -1.25);
  B(tot, 0.016, 0.13, 0.09, 0, 0.315, 0.005, frakcjaM);                 // plachta frakcji
  tot.position.set(0.20, 0, -0.38);
  tot.rotation.y = 1.35;                                                // pyskiem ku bramie
  g.add(tot);

  // STOJAK Z BRONIA (SE przy bramie): rama + wlocznia + topor — 72 tri
  const stj = new THREE.Group();
  B(stj, 0.03, 0.20, 0.03, 0, 0.10, -0.11, palM, 0.12, 0, 0);
  B(stj, 0.03, 0.20, 0.03, 0, 0.10, 0.11, palM, -0.12, 0, 0);
  B(stj, 0.026, 0.026, 0.30, 0, 0.185, 0, belkaM);                      // zerdz
  B(stj, 0.02, 0.30, 0.02, 0.055, 0.145, -0.05, belkaM, 0.15, 0, 0.30); // wlocznia
  B(stj, 0.022, 0.24, 0.022, 0.05, 0.115, 0.055, belkaM, -0.1, 0, 0.26); // trzonek topora
  B(stj, 0.075, 0.058, 0.022, 0.08, 0.228, 0.065, stalM, 0, 0, 0.26);   // glowica
  stj.position.set(0.24, 0, 0.27);
  stj.rotation.y = 0.55;
  g.add(stj);

  return g; // 444 tri
}
