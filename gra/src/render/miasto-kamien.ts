/**
 * miasto-kamien.ts — MIASTO EPOKI KAMIENIA (paleolit/neolit) w stylu Roblox
 * (klockowate boxy, zywe plaskie kolory, MeshLambert flatShading, zero tekstur,
 * czytelne z lotu ptaka). Seria: ulepszenia-modele-p2/p3a/p3b, wioska-oboz.
 *
 * PELNA PROGRESJA 10 POZIOMOW (korekta ustrojowa): kazdy poziom 1..10 ma
 * WLASNA, deterministyczna kompozycje — poziom wyzej = widoczny przyrost
 * zabudowy. Kamienie milowe zgodne z zatwierdzonymi sylwetkami: P3 = dawne
 * MALE, P6 = dawne SREDNIE, P10 = dawne DUZE (te same budynki i pozycje).
 * Srodek rosnie skokowo: OGNISKO (P1-3) -> TOTEM + chata wodza przy placu
 * (P4-6) -> DUZY MENHIR-KRAG centralnie (P7-10).
 *
 * PROGRESJA (tri zmierzone stats(); bez muru):
 *  FAZA MALA — obozowisko, pozycje dawnego MALE, plac maly + sciezka:
 *   P1  176: OGNISKO z dymem + tipi ze skor (oboz zalozycielski)
 *   P2  296: + lepianka prostokatna + suszarnia skor
 *   P3  468: + okragla chata + TOTEM z proporcem gracza + menhir  (= MALE)
 *  FAZA SREDNIA — osada, pozycje dawnego SREDNIE, plac + 2 sciezki:
 *   P4  528: przebudowa na szerszy pierscien + DLUGA CHATA WODZA (kalenica
 *            w barwie gracza); totem przy placu
 *   P5  608: + kamienny krag-SPICHLERZ + kosze zapasow
 *   P6  784: + druga lepianka + WEDZARNIA + menhir            (= SREDNIE)
 *  FAZA DUZA — 2 ULICE (osie E-W i N-S przez brame), plac targowy:
 *   P7  832: przebudowa w ulice + DUZY MENHIR-KRAG centralnie + duze
 *            ognisko przy placu targowym
 *   P8  892: + chata przy ulicy E (kwartal NE)
 *   P9  964: + okragla chata przy bramie
 *   P10 1024: + lepianka kwartalu NW — pelna zabudowa          (= DUZE)
 *  WAL = PALISADA W STYLU BISKUPIN (opcja mur, DOSTEPNY NA KAZDYM POZIOMIE —
 *  steruje flaga City.maMur z danych gry, ustawiana przez budynek „Palisada
 *  drewniana" / „Mury"; os 0.37 / 0.42 / 0.445 wg fazy):
 *  skarpa + zerdzie na skos + sciana z belkami + nierowna korona + brama,
 *  +1428 / +1608 / +1644 tri (119 / 134 / 137 klockow).
 *  Wyglad zatwierdzony 2026-07-29 — referencja
 *  docs/ux/preview-palisada/ref-styl-biskupin-kamien.png.
 *
 * TRI budynkow (box=12, cone4=8, cone5=10, cone6=12, cyl6=24, cyl8=32,
 * circle6=6): chata 60, chata wodza 72, tipi 58, okragla 72, ognisko 100/124,
 * totem 76, menhir maly 24, DUZY MENHIR 108, suszarnia 60, wedzarnia 92,
 * spichlerz 56, kosze 24.
 *
 * KONWENCJE (jak wioska-oboz.ts / ulepszenia-modele-p2.ts):
 *  - spod modelu na y=0 (powierzchnia heksa), przod = +x (brama walu az 72-108,
 *    totem, wylot glownej ulicy), obrot calosci = rotation.y,
 *  - wspolrzedne WEWNETRZNE znormalizowane do HEX_R=1, ale zwracany root
 *    zawiera dziecko przeskalowane 1/CITY_MODEL_SCALE (1/1.38), bo
 *    render/cities.ts:383 robi group.scale.setScalar(1.38) na modelu osady.
 *    Po przejsciu przez CityRenderer footprint W SWIECIE = wartosci wyzej.
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az);
 *    regula stycznej: rotY=-az(rad) klade dluga os (+x) stycznie do pierscienia.
 *  - REZERWA SRODKA HEKSA: bez muru max r <= 0.42, z murem <= 0.49-0.50
 *    (pas ulepszen klasy ZOSTAJE r 0.50-0.82 wolny na kazdym poziomie).
 *
 * KOLOR GRACZA (opts.color, domyslnie zloto 0xffd54a = OWNER_COLORS[0],
 * render/cities.ts:77):
 *  - plachta-proporzec na totemie (pelny kolor) — od P3,
 *  - kalenica chaty wodza (P4+) barwiona SUBTELNIE: mieszanka 45% koloru
 *    gracza + 55% strzechy (THREE.Color.lerp).
 *
 * JAK WPIAC (drzewo kanoniczne gra/src) — interfejs BEZ ZMIAN:
 *  1. Plik skopiowac do gra/src/render/miasto-kamien.ts.
 *  2. render/settlementModel.ts (buildSettlementModel, galaz roblox):
 *       import { buildMiastoKamien } from './miasto-kamien';
 *       if (style === 'roblox') {
 *         if (era >= 2) return buildMiastoBraz(civ, L, { mur: withWalls, color: ownerCol });
 *         return buildMiastoKamien(L, { mur: withWalls, color: ownerCol });
 *       }
 *     (visualKey w cities.ts:307 zawiera juz level+walls, wiec kazdy z 10
 *      poziomow przelacza sie bez zmian w integracji).
 *  3. Poziom miasta: cities.ts:311 getLevel ?? population (1..10) — poziom
 *     idzie WPROST do buildera. Mur: cities.ts:312 getWalls (kazdy poziom).
 *  4. Epoka kamienia wspolna dla cywilizacji (roznice per-cyw od Brazu) —
 *     parametr civ zbedny.
 */
import * as THREE from 'three';

export type RozmiarMiastaKamien = 'male' | 'srednie' | 'duze';

export interface MiastoKamienOpts {
  /** Wal obronny: palisada z zerdzi i glazow z brama-przelazem od +x. */
  mur?: boolean;
  /** Kolor gracza: proporzec na totemie + kalenica chaty wodza. */
  color?: number;
}

/** Kompensacja skali CityRenderer (render/cities.ts:122 CITY_MODEL_SCALE=1.38). */
export const MIASTO_KAMIEN_CITY_MODEL_SCALE = 1.38;

/** Domyslny kolor gracza (OWNER_COLORS[0] w render/cities.ts:77). */
export const MIASTO_KAMIEN_DEFAULT_COLOR = 0xffd54a;

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
/** Dluga os (+x) stycznie do pierscienia wokol srodka heksa. */
const tangRotY = (deg: number): number => (-deg * Math.PI) / 180;
/** Obrot ustawiajacy lokalne +x (drzwi/wejscie) DOKLADNIE ku srodkowi heksa. */
const kuSrodkowi = (x: number, z: number): number => Math.atan2(z, -x);

/** Paleta (spojna z wioska-oboz.ts / p2; skory i kamien jak oboz/kamieniolom). */
const P = {
  sciana: 0xd9a05b, scianaDk: 0xc08a4a, glina: 0xc49a62,
  strzecha: 0xf0c34e, strzechaDk: 0xc0913a, strzechaKal: 0xdba044,
  drewno: 0xc98a4b, drewnoDk: 0x8a5a2e, drewnoC: 0x6b4423, pal: 0x77502c,
  // Palisada w stylu Biskupin: dab zwietrzaly (szarosc) + ziemia skarpy.
  walDrewno: 0x7a7268, walDrewnoDk: 0x5c554e, walDrewnoHi: 0x8f877c,
  walZiemia: 0x6b7a4a, walZiemiaDk: 0x556640,
  kamien: 0x9aa5b1, kamienDk: 0x717d89, kamienHi: 0xb7c0c8,
  skora: 0x9a6b45, skoraDk: 0x7d5233, skoraHi: 0xb5854f,
  klepisko: 0xa08a68, sciezka: 0xbb9059,
  ogien: 0xff6b2e, plomien: 0xffc02e, dym: 0xd2d2c8, dymDk: 0xb0b0a4,
  zboze: 0xe9c34e, czern: 0x14100b, cien: 0x4a2f16,
} as const;

interface M {
  sciana: THREE.Material; scianaDk: THREE.Material; glina: THREE.Material;
  strzecha: THREE.Material; strzechaDk: THREE.Material; strzechaKal: THREE.Material;
  drewno: THREE.Material; drewnoDk: THREE.Material; drewnoC: THREE.Material; pal: THREE.Material;
  walDrewno: THREE.Material; walDrewnoDk: THREE.Material; walDrewnoHi: THREE.Material;
  walZiemia: THREE.Material; walZiemiaDk: THREE.Material;
  kamien: THREE.Material; kamienDk: THREE.Material; kamienHi: THREE.Material;
  skora: THREE.Material; skoraDk: THREE.Material; skoraHi: THREE.Material;
  klepisko: THREE.Material; sciezka: THREE.Material;
  ogien: THREE.Material; plomien: THREE.Material; dym: THREE.Material; dymDk: THREE.Material;
  zboze: THREE.Material; czern: THREE.Material; cien: THREE.Material;
  frakcja: THREE.Material; kalenicaWodza: THREE.Material;
}

function makeMats(color: number): M {
  const kal = new THREE.Color(P.strzechaKal).lerp(new THREE.Color(color & 0xffffff), 0.45);
  return {
    sciana: mat(P.sciana), scianaDk: mat(P.scianaDk), glina: mat(P.glina),
    strzecha: mat(P.strzecha), strzechaDk: mat(P.strzechaDk), strzechaKal: mat(P.strzechaKal),
    drewno: mat(P.drewno), drewnoDk: mat(P.drewnoDk), drewnoC: mat(P.drewnoC), pal: mat(P.pal),
    walDrewno: mat(P.walDrewno), walDrewnoDk: mat(P.walDrewnoDk), walDrewnoHi: mat(P.walDrewnoHi),
    walZiemia: mat(P.walZiemia), walZiemiaDk: mat(P.walZiemiaDk),
    kamien: mat(P.kamien), kamienDk: mat(P.kamienDk), kamienHi: mat(P.kamienHi),
    skora: mat(P.skora), skoraDk: mat(P.skoraDk), skoraHi: mat(P.skoraHi),
    klepisko: mat(P.klepisko), sciezka: mat(P.sciezka),
    ogien: mat(P.ogien), plomien: mat(P.plomien), dym: mat(P.dym), dymDk: mat(P.dymDk),
    zboze: mat(P.zboze), czern: mat(P.czern), cien: mat(P.cien),
    frakcja: mat(color & 0xffffff),
    kalenicaWodza: new THREE.MeshLambertMaterial({ color: kal, flatShading: true }),
  };
}

// ========================= BUDYNKI SKLADOWE ================================
// Kazdy builder: spod na y=0, drzwi/wejscie od +x, zwarty footprint.
// (ZATWIERDZONY STYL — bez zmian wygladu elementow.)

/** Lepianka prostokatna: gliniany korpus + strome polacie strzechy — 60 tri. */
function chataProsta(m: M, s = 1, scianaM?: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.20 * s, 0.145 * s, 0.165 * s, 0, 0.0725 * s, 0, scianaM ?? m.sciana);
  B(g, 0.23 * s, 0.032 * s, 0.125 * s, 0, 0.168 * s, 0.052 * s, m.strzecha, 0.72, 0, 0);
  B(g, 0.23 * s, 0.032 * s, 0.125 * s, 0, 0.168 * s, -0.052 * s, m.strzecha, -0.72, 0, 0);
  B(g, 0.225 * s, 0.032 * s, 0.055 * s, 0, 0.203 * s, 0, m.strzechaKal);
  B(g, 0.014 * s, 0.085 * s, 0.055 * s, 0.102 * s, 0.0425 * s, 0, m.cien);
  return g;
}

/** Szalas-tipi ze skor na zerdziach, lata z jasniejszej skory — 58 tri. */
function tipi(m: M, s = 1): THREE.Group {
  const g = new THREE.Group();
  CONE(g, 0.105 * s, 0.27 * s, 0, 0.135 * s, 0, m.skora, 5, 0, 0.3, 0);
  B(g, 0.045 * s, 0.085 * s, 0.06 * s, 0.088 * s, 0.04 * s, 0, m.czern);
  B(g, 0.013 * s, 0.15 * s, 0.013 * s, 0.02 * s, 0.245 * s, 0.015 * s, m.pal, 0.35, 0, 0.2);
  B(g, 0.013 * s, 0.15 * s, 0.013 * s, -0.02 * s, 0.245 * s, -0.01 * s, m.pal, -0.3, 0, -0.25);
  B(g, 0.07 * s, 0.085 * s, 0.012 * s, -0.045 * s, 0.115 * s, 0.093 * s, m.skoraHi, 0.3, -0.35, 0);
  return g;
}

/** Okragla lepianka: kamienna podmurowka, gliniany walec, stozek strzechy — 72 tri. */
function chataOkragla(m: M, s = 1): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.088 * s, 0.096 * s, 0.035 * s, 0, 0.0175 * s, 0, m.kamienDk, 6);
  CYL(g, 0.082 * s, 0.09 * s, 0.085 * s, 0, 0.077 * s, 0, m.glina, 6);
  CONE(g, 0.128 * s, 0.125 * s, 0, 0.2245 * s, 0, m.strzecha, 6, 0, 0.26, 0);
  B(g, 0.013 * s, 0.075 * s, 0.05 * s, 0.088 * s, 0.0375 * s, 0, m.cien);
  return g;
}

/** Dluga chata wodza: kalenica w subtelnej barwie gracza, zerdz — 72 tri. */
function chataWodza(m: M, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.30 * s, 0.155 * s, 0.155 * s, 0, 0.0775 * s, 0, m.sciana);
  B(g, 0.335 * s, 0.034 * s, 0.12 * s, 0, 0.18 * s, 0.05 * s, m.strzechaDk, 0.72, 0, 0);
  B(g, 0.335 * s, 0.034 * s, 0.12 * s, 0, 0.18 * s, -0.05 * s, m.strzechaDk, -0.72, 0, 0);
  B(g, 0.33 * s, 0.034 * s, 0.055 * s, 0, 0.216 * s, 0, m.kalenicaWodza);
  B(g, 0.014 * s, 0.09 * s, 0.06 * s, 0.152 * s, 0.045 * s, 0, m.cien);
  B(g, 0.016 * s, 0.10 * s, 0.016 * s, 0.10 * s, 0.235 * s, 0, m.pal, 0, 0, 0.1);
  return g;
}

/** Ognisko: krag kamieni + polana + plomienie + klockowy dym — 100/124 tri. */
function ognisko(m: M, duze: boolean): THREE.Group {
  const g = new THREE.Group();
  const rr = duze ? 0.062 : 0.052;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.5;
    B(g, 0.038, 0.03, 0.036, Math.cos(a) * rr, 0.015, Math.sin(a) * rr,
      i % 2 ? m.kamien : m.kamienDk, 0, a * 0.7, 0);
  }
  B(g, 0.10, 0.024, 0.026, 0.005, 0.02, 0.01, m.drewnoC, 0, 0.55, 0);
  CONE(g, 0.042, 0.085, 0, 0.032, 0, m.ogien, 4, 0, 0.2, 0);
  CONE(g, 0.024, 0.055, 0.005, 0.062, 0.005, m.plomien, 4, 0, 0.6, 0);
  B(g, 0.046, 0.042, 0.046, 0.012, 0.145, 0.004, m.dymDk, 0.2, 0.5, 0.15);
  B(g, 0.058, 0.052, 0.058, 0.032, 0.215, 0.022, m.dym, -0.15, 0.2, 0.3);
  if (duze) {
    B(g, 0.05, 0.046, 0.05, 0.05, 0.285, 0.04, m.dym, 0.1, 0.45, -0.2);
    B(g, 0.09, 0.022, 0.024, -0.01, 0.018, -0.015, m.drewnoDk, 0, -0.35, 0);
  }
  return g;
}

/** Totem: rzezbiony slup + rogi + PLACHTA-PROPORZEC w kolorze gracza — 76 tri. */
function totemProporzec(m: M, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.042 * s, 0.34 * s, 0.042 * s, 0, 0.17 * s, 0, m.pal);
  B(g, 0.062 * s, 0.055 * s, 0.058 * s, 0, 0.365 * s, 0, m.drewnoDk);
  B(g, 0.052 * s, 0.045 * s, 0.05 * s, 0, 0.30 * s, 0, m.drewnoC);
  CONE(g, 0.02 * s, 0.11 * s, -0.075 * s, 0.415 * s, 0, m.drewnoC, 4, 0, 0, 1.15);
  CONE(g, 0.02 * s, 0.11 * s, 0.075 * s, 0.415 * s, 0, m.drewnoC, 4, 0, 0, -1.15);
  B(g, 0.10 * s, 0.014 * s, 0.014 * s, 0, 0.255 * s, 0.02 * s, m.drewno);
  B(g, 0.015 * s, 0.13 * s, 0.10 * s, 0, 0.20 * s, 0.03 * s, m.frakcja);
  return g;
}

/** Menhir maly: pochylony glaz + towarzysz — 24 tri. */
function menhirMaly(m: M): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.055, 0.17, 0.045, 0, 0.085, 0, m.kamien, 0.06, 0.4, 0.1);
  B(g, 0.04, 0.05, 0.038, 0.05, 0.025, 0.02, m.kamienDk, 0, 0.8, 0);
  return g;
}

/** DUZY MENHIR: wielki glaz + 2 straznicy + lezacy + krag 5 glazow — 108 tri. */
function menhirDuzy(m: M): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.11, 0.28, 0.085, 0, 0.14, 0, m.kamienHi, 0.03, 0.35, 0.05);
  B(g, 0.055, 0.16, 0.05, -0.09, 0.08, 0.03, m.kamien, -0.05, 0.9, -0.06);
  B(g, 0.05, 0.135, 0.046, 0.085, 0.0675, -0.045, m.kamien, 0.04, -0.5, 0.07);
  B(g, 0.095, 0.042, 0.065, 0.02, 0.021, 0.085, m.kamienDk, 0, 0.3, 0);
  const ringR = 0.15;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.35;
    B(g, 0.034, 0.07 + (i % 2) * 0.028, 0.03, Math.cos(a) * ringR, 0.038 + (i % 2) * 0.012,
      Math.sin(a) * ringR, i % 2 ? m.kamienDk : m.kamien, 0, a, 0);
  }
  return g;
}

/** Suszace sie skory na ramie z zerdzi — 60 tri. */
function suszarniaSkor(m: M): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.022, 0.155, 0.022, -0.075, 0.0775, 0, m.pal);
  B(g, 0.022, 0.155, 0.022, 0.075, 0.0775, 0, m.pal);
  B(g, 0.20, 0.018, 0.018, 0, 0.145, 0, m.drewnoDk);
  B(g, 0.062, 0.095, 0.012, -0.032, 0.095, 0.004, m.skoraHi, 0, 0.05, 0.08);
  B(g, 0.056, 0.082, 0.012, 0.042, 0.10, -0.004, m.skora, 0, -0.04, -0.06);
  return g;
}

/** Wedzarnia: rama z zerdzi nad zarem, polcie, smuzka dymu — 92 tri. */
function wedzarnia(m: M): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.024, 0.17, 0.024, -0.07, 0.085, 0, m.pal, 0, 0, 0.08);
  B(g, 0.024, 0.17, 0.024, 0.07, 0.085, 0, m.pal, 0, 0, -0.08);
  B(g, 0.19, 0.02, 0.02, 0, 0.158, 0, m.drewnoDk);
  B(g, 0.03, 0.06, 0.018, -0.035, 0.105, 0, m.skoraDk, 0, 0, 0.1);
  B(g, 0.028, 0.055, 0.018, 0.03, 0.108, 0.004, m.skoraDk, 0, 0.2, -0.08);
  B(g, 0.05, 0.022, 0.05, 0, 0.011, 0, m.kamienDk, 0, 0.4, 0);
  CONE(g, 0.02, 0.05, 0, 0.022, 0, m.plomien, 4, 0, 0.3, 0);
  B(g, 0.042, 0.05, 0.042, 0.008, 0.20, 0.006, m.dym, 0.2, 0.4, 0.15);
  return g;
}

/** Kamienny krag-spichlerz ze strzechowym daszkiem — 56 tri. */
function spichlerz(m: M): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.092, 0.10, 0.095, 0, 0.0475, 0, m.kamien, 8);
  CONE(g, 0.13, 0.105, 0, 0.20, 0, m.strzechaDk, 6, 0, 0.2, 0);
  B(g, 0.013, 0.06, 0.045, 0.096, 0.03, 0, m.cien);
  return g;
}

/** Kosze z zapasami przy spichlerzu — 24 tri. */
function kosze(m: M): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.045, 0.04, 0.045, 0, 0.02, 0, m.drewnoDk, 0, 0.3, 0);
  B(g, 0.036, 0.03, 0.036, 0.001, 0.052, 0.002, m.zboze, 0, 0.1, 0);
  return g;
}

// ========================= WAL / PALISADA ==================================

/** Pochylenie zerdzi NA ZEWNATRZ pierscienia (rx, rz) dla azymutu az. */
function naZewnatrz(azDeg: number, lean: number): [number, number] {
  const rad = (azDeg * Math.PI) / 180;
  return [-lean * Math.cos(rad), -lean * Math.sin(rad)];
}

/**
 * WAL — PALISADA W STYLU BISKUPIN (wyglad zatwierdzony 2026-07-29;
 * referencja: docs/ux/preview-palisada/ref-styl-biskupin-kamien.png).
 * Cztery warstwy od zewnatrz do gory:
 *  1. SKARPA — pierscien plyt ziemi stycznie do obwodu (r*0.90) + zerdzie
 *     wbite na skos NA ZEWNATRZ (przeszkoda u stopy walu),
 *  2. SCIANA — pionowe pale (r*0.98) spiete 3 rzedami BELEK POZIOMYCH,
 *  3. KORONA — nierowne ostrza nad scianka (rytm wysokosci + przechylen),
 *  4. BRAMA-PRZELAZ od +x (az 72-108): 2 slupy, nadproze WZDLUZ cieciwy,
 *     prog z glazow.
 * Drewno: dab zwietrzaly (szarosc walDrewno*), ziemia skarpy przygaszona
 * zielen. Rytm wysokosci/przechylen deterministyczny (zero randomu) — te same
 * pale przy kazdym przebudowaniu modelu.
 * Max r footprintu W SWIECIE (zmierzone, tools/.palisada-obrys-entry.ts):
 * 0.42 (male) / 0.47 (srednie) / 0.49 (duze), wysokosc korony 0.46 — rezerwa
 * srodka heksa (<=0.50) zachowana, pas ulepszen r 0.50-0.82 wolny.
 * Mur liczony osobno od budzetu progresji poziomow.
 */
function wal(m: M, r: number): THREE.Group {
  const g = new THREE.Group();
  const gapOd = 72, gapDo = 108;
  const n = Math.max(20, Math.round(r * 64));
  const rSkarpy = r * 0.90;
  const rSciany = r * 0.98;
  const yStopa = 0.055;   // korona skarpy = stopa sciany
  const yKorona = 0.24;   // gora sciany = stopa ostrzy korony

  // 1. SKARPA: plyty ziemi stycznie + zerdzie na skos (pochylone na zewnatrz)
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 8 && az < gapDo + 8) continue;
    const { x, z } = azXZ(az, rSkarpy);
    const segW = ((2 * Math.PI * rSkarpy) / n) * 1.15;
    const rozjazd = 0.10 * (((i * 13) % 3) - 1);
    B(g, segW, yStopa, 0.14, x, yStopa / 2, z, i % 2 ? m.walZiemia : m.walZiemiaDk,
      0, tangRotY(az) + rozjazd, 0);
    const zerdzH = 0.09 + 0.03 * ((i * 17) % 4) / 3;
    // zerdzie na zewnetrznej krawedzi skarpy — widoczna przeszkoda u stopy walu
    const zer = azXZ(az, rSkarpy + 0.058);
    const [zrx, zrz] = naZewnatrz(az, 0.28);
    B(g, 0.022, zerdzH, 0.022, zer.x, yStopa * 0.7 + zerdzH / 2, zer.z, m.walDrewnoDk,
      zrx, tangRotY(az), zrz);
  }

  // 2. SCIANA: pionowe pale + 3 rzedy belek poziomych miedzy nimi
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 5 && az < gapDo + 5) continue;
    const { x, z } = azXZ(az, rSciany);
    const palH = 0.19 + 0.04 * ((i * 23) % 5) / 4;
    B(g, 0.028, palH, 0.028, x, yStopa + palH / 2, z, i % 3 ? m.walDrewno : m.walDrewnoDk,
      0, tangRotY(az), 0);
    if (i % 2 !== 0) continue;
    const azDo = ((i + 1) / n) * 360;
    if (azDo > gapOd - 5 && azDo < gapDo + 5) continue;
    const p2 = azXZ(azDo, rSciany);
    const dx = p2.x - x, dz = p2.z - z;
    const len = Math.hypot(dx, dz) * 1.02;
    const ang = Math.atan2(dx, dz);
    for (const dy of [0.085, 0.135, 0.185]) {
      B(g, 0.024, 0.022, len, (x + p2.x) / 2, yStopa + dy, (z + p2.z) / 2, m.walDrewnoHi, 0, ang, 0);
    }
  }

  // 3. KORONA: nierowne ostrza nad sciana
  for (let i = 0; i < n; i++) {
    const az = (i / n) * 360;
    if (az > gapOd - 6 && az < gapDo + 6) continue;
    const { x, z } = azXZ(az, rSciany);
    const ostrzeH = 0.12 + 0.10 * ((i * 41) % 7) / 6;
    const przechyl = 0.08 * (((i * 13) % 3) - 1);
    const [krx, krz] = naZewnatrz(az, przechyl);
    B(g, 0.020, ostrzeH, 0.020, x, yKorona + ostrzeH / 2, z,
      i % 2 ? m.walDrewnoHi : m.walDrewno, krx, tangRotY(az), krz);
  }

  // 4. BRAMA-PRZELAZ od +x: slupy + nadproze wzdluz cieciwy + prog z glazow
  const b1 = azXZ(gapOd, rSciany), b2 = azXZ(gapDo, rSciany);
  B(g, 0.05, 0.26, 0.05, b1.x, yStopa + 0.13, b1.z, m.walDrewnoDk);
  B(g, 0.05, 0.26, 0.05, b2.x, yStopa + 0.13, b2.z, m.walDrewnoDk);
  const cieciwa = Math.hypot(b2.x - b1.x, b2.z - b1.z);
  B(g, 0.05, 0.04, cieciwa + 0.06, (b1.x + b2.x) / 2, yStopa + 0.28, (b1.z + b2.z) / 2,
    m.walDrewnoHi, 0, Math.atan2(b2.x - b1.x, b2.z - b1.z), 0);
  B(g, 0.055, 0.036, 0.05, b1.x + 0.008, 0.018, b1.z + 0.05, m.kamien, 0, 0.5, 0);
  B(g, 0.05, 0.032, 0.046, b2.x + 0.01, 0.016, b2.z - 0.046, m.kamienDk, 0, -0.4, 0);
  return g;
}

// ==================== KOMPOZYCJE — PROGRESJA POZIOMOW 1-10 =================
// Trzy FAZY ukladu (pozycje zatwierdzonych kompozycji male/srednie/duze);
// wewnatrz fazy kazdy poziom DOKLADA deterministyczna liste elementow
// (zadnego randomu). P3 = dawne MALE, P6 = dawne SREDNIE, P10 = dawne DUZE.
// Pozycje na azymutach (az, r) — drzwi ku srodkowi (kuSrodkowi) albo dluga os
// stycznie (tangRotY). Max r footprintu: faza mala 0.35, srednia 0.40,
// duza 0.42 (bez walu; os walu 0.37/0.42/0.445).

type Put = (obj: THREE.Group, az: number, r: number, rot: number) => void;

function mkPut(g: THREE.Group): Put {
  return (obj, az, r, rot) => {
    const p = azXZ(az, r);
    obj.position.set(p.x, 0, p.z);
    obj.rotation.y = rot;
    g.add(obj);
  };
}

function placIsciezki(g: THREE.Group, m: M, rozmiar: RozmiarMiastaKamien): void {
  if (rozmiar === 'male') {
    const plac = new THREE.Mesh(new THREE.CircleGeometry(0.145, 6), m.klepisko);
    plac.rotation.x = -Math.PI / 2;
    plac.position.set(0.015, 0.011, 0.02);
    g.add(plac);
    B(g, 0.17, 0.01, 0.07, 0.24, 0.005, 0.05, m.sciezka, 0, 0.25, 0);
    return;
  }
  if (rozmiar === 'srednie') {
    const plac = new THREE.Mesh(new THREE.CircleGeometry(0.17, 6), m.klepisko);
    plac.rotation.x = -Math.PI / 2;
    plac.position.set(0.02, 0.011, 0.03);
    g.add(plac);
    B(g, 0.20, 0.01, 0.075, 0.27, 0.005, 0.05, m.sciezka, 0, 0.22, 0);
    B(g, 0.18, 0.01, 0.065, -0.25, 0.005, -0.13, m.sciezka, 0, -0.5, 0);
    return;
  }
  // duze: 2 ULICE — os E-W (przez brame +x) i os N-S, plac przy skrzyzowaniu
  const plac = new THREE.Mesh(new THREE.CircleGeometry(0.155, 6), m.klepisko);
  plac.rotation.x = -Math.PI / 2;
  plac.position.set(0.12, 0.011, 0.10);
  g.add(plac);
  B(g, 0.76, 0.01, 0.085, 0.03, 0.005, 0.02, m.sciezka);
  B(g, 0.075, 0.01, 0.60, 0.05, 0.0052, -0.04, m.sciezka);
}

/** FAZA MALA (P1-3) — obozowisko-osada wokol OGNISKA (uklad dawnego MALE).
 *  P1: ognisko + tipi | P2: + lepianka, suszarnia | P3: + okragla, totem, menhir. */
function skladFazaMala(g: THREE.Group, m: M, L: number): void {
  const put = mkPut(g);
  const ogn = ognisko(m, false);
  ogn.position.set(0.015, 0.012, 0.02);
  g.add(ogn);
  const pT = azXZ(213, 0.22);
  put(tipi(m, 1.0), 213, 0.22, kuSrodkowi(pT.x, pT.z) + 0.15);
  if (L >= 2) {
    const p1 = azXZ(318, 0.235);
    put(chataProsta(m, 0.95), 318, 0.235, kuSrodkowi(p1.x, p1.z) - 0.1);
    put(suszarniaSkor(m), 152, 0.26, tangRotY(152));
  }
  if (L >= 3) {
    const p2 = azXZ(96, 0.23);
    put(chataOkragla(m, 0.9), 96, 0.23, kuSrodkowi(p2.x, p2.z));
    put(totemProporzec(m, 0.92), 48, 0.20, -1.2);
    put(menhirMaly(m), 263, 0.285, 0.4);
  }
}

/** FAZA SREDNIA (P4-6) — osada z CHATA WODZA (uklad dawnego SREDNIE).
 *  P4: pierscien szerzej + chata wodza | P5: + spichlerz, kosze |
 *  P6: + druga lepianka, wedzarnia, menhir. */
function skladFazaSrednia(g: THREE.Group, m: M, L: number): void {
  const put = mkPut(g);
  const ogn = ognisko(m, false);
  ogn.position.set(0.02, 0.012, 0.03);
  g.add(ogn);
  put(chataWodza(m, 1.0), 285, 0.235, tangRotY(285) + 0.08);
  const pT = azXZ(207, 0.26);
  put(tipi(m, 0.9), 207, 0.26, kuSrodkowi(pT.x, pT.z) + 0.2);
  const p1 = azXZ(338, 0.27);
  put(chataProsta(m, 0.95), 338, 0.27, kuSrodkowi(p1.x, p1.z) - 0.12);
  const p2 = azXZ(63, 0.26);
  put(chataOkragla(m, 0.95), 63, 0.26, kuSrodkowi(p2.x, p2.z));
  put(totemProporzec(m, 1.0), 99, 0.235, -1.3);
  put(suszarniaSkor(m), 20, 0.28, tangRotY(20));
  if (L >= 5) {
    put(spichlerz(m), 310, 0.27, kuSrodkowi(azXZ(310, 0.27).x, azXZ(310, 0.27).z));
    put(kosze(m), 322, 0.19, 0.5);
  }
  if (L >= 6) {
    const p3 = azXZ(163, 0.27);
    put(chataProsta(m, 0.9, m.scianaDk), 163, 0.27, kuSrodkowi(p3.x, p3.z) + 0.15);
    put(wedzarnia(m), 243, 0.27, tangRotY(243));
    put(menhirMaly(m), 132, 0.30, 1.2);
  }
}

/** FAZA DUZA (P7-10) — osada z 2 ULICAMI i DUZYM MENHIREM (uklad dawnego DUZE).
 *  P7: ulice + menhir-krag + duze ognisko | P8: + chata kwartalu NE |
 *  P9: + okragla przy bramie | P10: + lepianka kwartalu NW (pelna zabudowa). */
function skladFazaDuza(g: THREE.Group, m: M, L: number): void {
  const put = mkPut(g);
  const men = menhirDuzy(m);
  men.position.set(-0.05, 0, -0.05);
  men.rotation.y = 0.3;
  g.add(men);

  const ogn = ognisko(m, true);
  ogn.position.set(0.17, 0.012, 0.13);
  g.add(ogn);

  // ULICA N-S, strona W: chata wodza + spichlerz (kwartal SW)
  put(chataWodza(m, 0.95), 232, 0.245, tangRotY(232) + 0.06);
  put(spichlerz(m), 197, 0.295, kuSrodkowi(azXZ(197, 0.295).x, azXZ(197, 0.295).z));
  put(kosze(m), 207, 0.20, 0.9);
  // kwartal NW: chata przy ulicy E-W
  const pA = azXZ(300, 0.29);
  put(chataProsta(m, 0.95), 300, 0.29, kuSrodkowi(pA.x, pA.z) - 0.1);
  // kwartal SE: okragla + tipi + wedzarnia
  const pD = azXZ(138, 0.29);
  put(chataOkragla(m, 0.9), 138, 0.29, kuSrodkowi(pD.x, pD.z));
  const pT = azXZ(167, 0.295);
  put(tipi(m, 0.85), 167, 0.295, kuSrodkowi(pT.x, pT.z) - 0.2);
  put(wedzarnia(m), 126, 0.30, tangRotY(126));
  // totem z proporcem przy bramie (+x), po poludniowej stronie ulicy
  put(totemProporzec(m, 1.05), 107, 0.30, -1.25);
  put(suszarniaSkor(m), 55, 0.31, tangRotY(55) + 0.2);
  if (L >= 8) {
    const pC = azXZ(30, 0.295);
    put(chataProsta(m, 0.9), 30, 0.295, kuSrodkowi(pC.x, pC.z) + 0.1);
  }
  if (L >= 9) {
    const pF = azXZ(2, 0.285);
    put(chataOkragla(m, 0.9), 2, 0.285, kuSrodkowi(pF.x, pF.z));
  }
  if (L >= 10) {
    const pB = azXZ(332, 0.295);
    put(chataProsta(m, 0.9, m.scianaDk), 332, 0.295, kuSrodkowi(pB.x, pB.z) + 0.12);
  }
}

// ========================= API GLOWNE ======================================

/** Progi poziomow miasta (cities.ts getLevel 1..10) -> faza ukladu.
 *  ZOSTAJE dla zgodnosci (mapuje na progi) — buildery przyjmuja poziom wprost. */
export function rozmiarDlaPoziomu(level: number): RozmiarMiastaKamien {
  const L = Math.max(1, Math.min(10, Math.round(level)));
  if (L <= 3) return 'male';
  if (L <= 6) return 'srednie';
  return 'duze';
}

/** Zgodnosc wstecz: nazwy progow mapuja na reprezentatywny poziom fazy. */
function poziomZArgumentu(a: RozmiarMiastaKamien | number): number {
  if (typeof a === 'number') return Math.max(1, Math.min(10, Math.round(a)));
  return a === 'male' ? 3 : a === 'srednie' ? 6 : 10;
}

/** Os walu wg fazy (jak dotad: 0.37 / 0.42 / 0.445). */
const OS_WALU: Record<RozmiarMiastaKamien, number> = { male: 0.37, srednie: 0.42, duze: 0.445 };

/**
 * Miasto epoki kamienia — PELNA PROGRESJA 10 POZIOMOW.
 * @param poziom 1..10 (kazdy poziom = wlasna kompozycja; P3/P6/P10 = dawne
 *               male/srednie/duze). Dla zgodnosci przyjmuje tez nazwy progow
 *               ('male'->3, 'srednie'->6, 'duze'->10).
 * @param opts   { mur, color } — wal obronny (DOSTEPNY NA KAZDYM POZIOMIE,
 *               sterowany flaga z danych gry) + kolor gracza.
 * Root zawiera dziecko przeskalowane 1/1.38 (kompensacja CITY_MODEL_SCALE,
 * render/cities.ts:383) — footprinty W SWIECIE jak w MIASTO_KAMIEN_LAYOUT.granice.
 */
export function buildMiastoKamien(
  poziom: RozmiarMiastaKamien | number = 10,
  opts: MiastoKamienOpts = {},
): THREE.Group {
  const L = poziomZArgumentu(poziom);
  const rz = rozmiarDlaPoziomu(L);
  const m = makeMats(opts.color ?? MIASTO_KAMIEN_DEFAULT_COLOR);

  const inner = new THREE.Group();
  placIsciezki(inner, m, rz);
  if (rz === 'male') skladFazaMala(inner, m, L);
  else if (rz === 'srednie') skladFazaSrednia(inner, m, L);
  else skladFazaDuza(inner, m, L);

  if (opts.mur) inner.add(wal(m, OS_WALU[rz]));

  const root = new THREE.Group();
  inner.scale.setScalar(1 / MIASTO_KAMIEN_CITY_MODEL_SCALE);
  root.add(inner);
  root.userData['model'] = 'miasto-kamien';
  root.userData['poziom'] = L;
  root.userData['rozmiar'] = rz;
  return root;
}

/** Drewniany wał/palisada Biskupin — współdzielony z epoką Brązu (PALISADA-BRAZ-Q1=A). */
export function buildPalisadaWal(
  rozmiar: RozmiarMiastaKamien,
  color?: number,
): THREE.Group {
  const m = makeMats(color ?? MIASTO_KAMIEN_DEFAULT_COLOR);
  return wal(m, OS_WALU[rozmiar]);
}

/** Layout / progi / granice — do integracji i testow kolizji z ulepszeniami. */
export const MIASTO_KAMIEN_LAYOUT = {
  hexR: 1.0,
  /** render/cities.ts:122 — model niesie kompensacje w dziecku roota. */
  cityModelScale: MIASTO_KAMIEN_CITY_MODEL_SCALE,
  progi: { male: [1, 3], srednie: [4, 6], duze: [7, 10] } as const,
  /** Tri per poziom 1..10 (bez muru; zmierzone stats()). */
  triPoziomy: [176, 296, 468, 528, 608, 784, 832, 892, 964, 1024] as const,
  /** Tri walu (palisada Biskupin) wg fazy — mur liczony osobno od progresji. */
  triWalu: { male: 1428, srednie: 1608, duze: 1644 } as const,
  /** Max promien footprintu W SWIECIE (po CityRenderer; zmierzone per wierzcholek). */
  granice: {
    male:    { bezMuru: 0.35, zMurem: 0.42 },
    srednie: { bezMuru: 0.40, zMurem: 0.47 },
    duze:    { bezMuru: 0.42, zMurem: 0.49 },
  },
  /** Os walu (przed kompensacja skali; w swiecie = te same wartosci). */
  osWalu: OS_WALU,
  /** Rezerwa srodka heksa r<0.40 (ULEPSZENIA_P2_LAYOUT.farma.solo.miastoRezerwa);
   *  ulepszenia klasy ZOSTAJE komponowane na pierscieniu r 0.50-0.82. */
  rezerwaSrodka: 0.40,
  /** Przod = +x: brama walu (az 72-108), totem, wylot glownej ulicy E-W. */
  przod: '+x',
} as const;
