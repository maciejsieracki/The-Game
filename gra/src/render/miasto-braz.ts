/**
 * miasto-braz.ts — MIASTA EPOKI BRAZU per cywilizacja (GRECJA, RZYM) w stylu
 * Roblox (klockowate boxy, zywe plaskie kolory, MeshLambert flatShading, zero
 * tekstur, czytelne z lotu ptaka). Seria: miasto-kamien.ts, wioska-oboz,
 * ulepszenia-modele-p2/p3. EWOLUCJA zatwierdzonego miasta kamienia — te same
 * konwencje, granice i kompensacja skali.
 *
 * PELNA PROGRESJA 10 POZIOMOW (korekta ustrojowa): kazdy poziom 1..10 ma
 * wlasna, deterministyczna kompozycje; kamienie milowe = zatwierdzone
 * sylwetki: P3 = dawne MALE, P6 = dawne SREDNIE, P10 = dawne DUZE.
 * Budynek centralny rosnie skokowo:
 *  - GRECJA: megaron 2 kolumny (P1-3) -> megaron 4 kolumny (P4-6) ->
 *    PROSTA SWIATYNIA mykenska (P7-10),
 *  - RZYM: capanna wodza z vexillum (P1-3) -> SWIATYNKA NA PODIUM (P4-8)
 *    -> swiatynka WIEKSZA s1.22 (P9-10).
 *
 * PROGRESJA GRECJA (mykensko-egejska; tri zmierzone stats(), bez muru):
 *  FAZA MALA (uklad dawnego MALE):
 *   P1 190: MEGARON in antis (2 minojskie kolumny, proporzec gracza) + plac
 *   P2 258: + bielony dom egejski + amfora na dziedzincu
 *   P3 418: + 2 domy + amfora + oliwka + oltarz polowy          (= MALE)
 *  FAZA SREDNIA (uklad dawnego SREDNIE):
 *   P4 474: megaron ROSNIE do 4 KOLUMN (s1.12) + 2 domy (1 pietrowy) + oliwka
 *   P5 602: + STUDNIA z daszkiem + dom + amfora
 *   P6 710: + dom pietrowy + druga oliwka                       (= SREDNIE)
 *  FAZA DUZA (2 ulice; uklad dawnego DUZE):
 *   P7 746: megaron ROSNIE W PROSTA SWIATYNIE (krepidoma, 4 kolumny,
 *           tympanon) + STOA handlowa + 4 domy przy ulicach
 *   P8 850: + dom pietrowy + trzecia amfora
 *   P9 886: + dom przy bramie
 *   P10 922: + dom kwartalu SW — pelna polis                    (= DUZE)
 *  MUR CYKLOPOWY (kazdy poziom; os 0.37/0.42/0.445 wg fazy): +324 tri.
 * PROGRESJA RZYM (italsko-willanowianski):
 *  FAZA MALA:
 *   P1 196: CAPANNA WODZA z VEXILLUM + palenisko-westa + sciezka
 *   P2 298: + druga capanna + klepisko placu
 *   P3 522: + trzecia capanna + spichlerzyk na palach + zagroda  (= MALE)
 *  FAZA SREDNIA:
 *   P4 622: SWIATYNKA NA PODIUM (2 tuscanskie kolumny, vexillum) zastepuje
 *           capanne wodza + wieksza westa + 2 capanny + spichlerzyk + zagroda
 *   P5 682: + pierwszy DOM Z TUFU (rude sciany)
 *   P6 778: + trzecia capanna                                   (= SREDNIE)
 *  FAZA DUZA (2 ulice):
 *   P7 838: przebudowa w ulice + 2 domy z tufu + 3 capanny + spichlerzyk
 *   P8 898: + trzeci dom z tufu przy ulicy
 *   P9 922: swiatynka ROSNIE (s1.15 -> s1.22) + CYSTERNA z woda
 *   P10 1018: + czwarta capanna — pelne miasto                  (= DUZE)
 *  WAL AGGER (kazdy poziom): +344 tri.
 *  (Budzety: P1 <= 200, P10 <= dawne duze — spelnione; wzrost tri scisle
 *   monotoniczny; mur liczony osobno.)
 *
 * KOLOR GRACZA (opts.color, domyslnie 0xffd54a = OWNER_COLORS[0]):
 *  - Grecja: proporzec na maszcie megaronu/swiatyni (pelny kolor) + kalenica
 *    centralnego budynku barwiona subtelnie (lerp 40% koloru gracza),
 *  - Rzym: VEXILLUM na maszcie capanny wodza / przy swiatynce (pelny kolor)
 *    + kalenica swiatynki lerp 40% — jak kamien (proporzec + subtelny akcent).
 *
 * KONWENCJE (jak miasto-kamien.ts):
 *  - spod na y=0, przod = +x (brama az 72-108, wylot glownej ulicy),
 *  - wspolrzedne WEWNETRZNE znormalizowane do HEX_R=1; root zawiera dziecko
 *    przeskalowane 1/1.38 (kompensacja CITY_MODEL_SCALE, render/cities.ts:122
 *    i :383 group.scale.setScalar(1.38)) — footprint W SWIECIE = wartosci wyzej,
 *  - REZERWA SRODKA HEKSA: bez muru max r <= 0.42, z murem <= 0.49
 *    (pas ulepszen klasy ZOSTAJE r 0.50-0.82 wolny na kazdym poziomie),
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az); regula stycznej:
 *    rotY=-az(rad); kuSrodkowi: drzwi dokladnie ku srodkowi heksa.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src) — interfejs BEZ ZMIAN, settlementModel
 * per era+civ+level+walls (visualKey w cities.ts:338 zawiera juz level):
 *  1. Plik + miasto-kamien.ts skopiowac do gra/src/render/.
 *  2. render/settlementModel.ts (buildSettlementModel, galaz roblox):
 *       import { buildMiastoKamien } from './miasto-kamien';
 *       import { buildMiastoBraz } from './miasto-braz';
 *       if (style === 'roblox') {
 *         if (era >= 2) return buildMiastoBraz(civ, L, { mur: withWalls, color: ownerCol });
 *         return buildMiastoKamien(L, { mur: withWalls, color: ownerCol });
 *       }
 *  3. buildMiastoBraz routuje: 'rzym' -> Rzym, 'grecja' i pozostale typy ->
 *     Grecja (do czasu dostarczenia zestawow kolejnych cywilizacji).
 *  4. Poziom: cities.ts:334 getLevel ?? population — poziom 1..10 WPROST do
 *     buildera; rozmiarDlaPoziomu re-eksportowane dla zgodnosci.
 */
import * as THREE from 'three';
import { rozmiarDlaPoziomu, type RozmiarMiastaKamien } from './miasto-kamien';

export { rozmiarDlaPoziomu } from './miasto-kamien';
export type RozmiarMiastaBraz = RozmiarMiastaKamien;

export interface MiastoBrazOpts {
  /** Mur obronny: Grecja = cyklopowy z Lwia Brama, Rzym = wal agger z palisada. */
  mur?: boolean;
  /** Kolor gracza: proporzec/vexillum + subtelna kalenica centralnego budynku. */
  color?: number;
}

/** Kompensacja skali CityRenderer (render/cities.ts:122 CITY_MODEL_SCALE=1.38). */
export const MIASTO_BRAZ_CITY_MODEL_SCALE = 1.38;
/** Domyslny kolor gracza (OWNER_COLORS[0] w render/cities.ts:77). */
export const MIASTO_BRAZ_DEFAULT_COLOR = 0xffd54a;

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

/** Klocek: srodek (cx,cy,cz), opcjonalny obrot. */
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

/** Walec (seg=6 domyslnie — klockowy szesciokat serii). */
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

/** Pryzma trojkatna (cyl seg=3): os wzdluz X (ridge), wierzcholek ku +y. */
function PRISM_X(
  g: THREE.Object3D, r: number, len: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
): THREE.Mesh {
  return CYL(g, r, r, len, cx, cy, cz, m, 3, -Math.PI / 2, 0, Math.PI / 2);
}
/** Pryzma trojkatna: os wzdluz Z (np. tympanon nad brama od +x). */
function PRISM_Z(
  g: THREE.Object3D, r: number, len: number,
  cx: number, cy: number, cz: number, m: THREE.Material,
): THREE.Mesh {
  return CYL(g, r, r, len, cx, cy, cz, m, 3, -Math.PI / 2, 0, 0);
}

const azXZ = (deg: number, r: number): { x: number; z: number } => ({
  x: r * Math.sin((deg * Math.PI) / 180),
  z: -r * Math.cos((deg * Math.PI) / 180),
});
/** Dluga os (+x) stycznie do pierscienia wokol srodka heksa. */
const tangRotY = (deg: number): number => (-deg * Math.PI) / 180;
/** Obrot ustawiajacy lokalne +x (drzwi) DOKLADNIE ku srodkowi heksa. */
const kuSrodkowi = (x: number, z: number): number => Math.atan2(z, -x);

type Put = (obj: THREE.Group, az: number, r: number, rot: number) => void;

function mkPut(g: THREE.Group): Put {
  return (obj, az, r, rot) => {
    const p = azXZ(az, r);
    obj.position.set(p.x, 0, p.z);
    obj.rotation.y = rot;
    g.add(obj);
  };
}

// ========================= GRECJA (mykensko-egejska) ========================

/** Paleta grecka: biel wapienna, terakota, morski blekit, srebrzysta oliwka;
 *  kamien cyklopowy = szarosci z miasta kamienia (ciaglosc epok). */
const PG = {
  biel: 0xf6f1e4, bielDk: 0xe4dcc8, marmur: 0xefe7d2,
  terak: 0xc96f45, terakDk: 0xa8583a, terakJasna: 0xd8a06a,
  kamien: 0x9aa5b1, kamienDk: 0x717d89, kamienHi: 0xb7c0c8,
  minoan: 0xb04a35, morze: 0x3f7fae,
  oliwa: 0x9fb886, oliwaDk: 0x7f9a6a, pien: 0x8a6a42,
  glina: 0xcc8050, glinaDk: 0xa5643c,
  drewno: 0xa97b4a, drewnoDk: 0x7c5530,
  klepisko: 0xbfa678, sciezka: 0xcfb078,
  plomien: 0xffc02e, czern: 0x14100b, cien: 0x4a3a26,
} as const;

interface MG {
  biel: THREE.Material; bielDk: THREE.Material; marmur: THREE.Material;
  terak: THREE.Material; terakDk: THREE.Material; terakJasna: THREE.Material;
  kamien: THREE.Material; kamienDk: THREE.Material; kamienHi: THREE.Material;
  minoan: THREE.Material; morze: THREE.Material;
  oliwa: THREE.Material; oliwaDk: THREE.Material; pien: THREE.Material;
  glina: THREE.Material; glinaDk: THREE.Material;
  drewno: THREE.Material; drewnoDk: THREE.Material;
  klepisko: THREE.Material; sciezka: THREE.Material;
  plomien: THREE.Material; czern: THREE.Material; cien: THREE.Material;
  frakcja: THREE.Material; kalenica: THREE.Material;
}

function makeMatsG(color: number): MG {
  const kal = new THREE.Color(PG.terakDk).lerp(new THREE.Color(color & 0xffffff), 0.40);
  return {
    biel: mat(PG.biel), bielDk: mat(PG.bielDk), marmur: mat(PG.marmur),
    terak: mat(PG.terak), terakDk: mat(PG.terakDk), terakJasna: mat(PG.terakJasna),
    kamien: mat(PG.kamien), kamienDk: mat(PG.kamienDk), kamienHi: mat(PG.kamienHi),
    minoan: mat(PG.minoan), morze: mat(PG.morze),
    oliwa: mat(PG.oliwa), oliwaDk: mat(PG.oliwaDk), pien: mat(PG.pien),
    glina: mat(PG.glina), glinaDk: mat(PG.glinaDk),
    drewno: mat(PG.drewno), drewnoDk: mat(PG.drewnoDk),
    klepisko: mat(PG.klepisko), sciezka: mat(PG.sciezka),
    plomien: mat(PG.plomien), czern: mat(PG.czern), cien: mat(PG.cien),
    frakcja: mat(color & 0xffffff),
    kalenica: new THREE.MeshLambertMaterial({ color: kal, flatShading: true }),
  };
}

/** Bielony dom egejski: kubik + plaski dach-attyka w terakocie — 36/72 tri. */
function domGrecki(m: MG, s = 1, pietro = false, scianaM?: THREE.Material): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.155 * s, 0.115 * s, 0.135 * s, 0, 0.0575 * s, 0, scianaM ?? m.biel);
  B(g, 0.132 * s, 0.022 * s, 0.112 * s, 0, 0.124 * s, 0, m.terakJasna);
  B(g, 0.013 * s, 0.068 * s, 0.046 * s, 0.0785 * s, 0.034 * s, 0, m.morze);
  if (pietro) {
    B(g, 0.098 * s, 0.078 * s, 0.092 * s, -0.022 * s, 0.178 * s, 0.012 * s, m.biel);
    B(g, 0.082 * s, 0.018 * s, 0.076 * s, -0.022 * s, 0.224 * s, 0.012 * s, m.terakJasna);
    B(g, 0.011 * s, 0.032 * s, 0.028 * s, 0.028 * s, 0.19 * s, 0.012 * s, m.morze);
  }
  return g;
}

/** MEGARON in antis: podium, hala, portyk z 2/4 czerwonymi kolumnami,
 *  dwuspadowy dach z kalenica w barwie gracza, maszt z proporcem — 172/212 tri. */
function megaron(m: MG, s = 1, kolumny: 2 | 4 = 2): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.30 * s, 0.03 * s, 0.21 * s, 0, 0.015 * s, 0, m.kamien);
  B(g, 0.20 * s, 0.135 * s, 0.175 * s, -0.035 * s, 0.0975 * s, 0, m.biel);
  B(g, 0.10 * s, 0.10 * s, 0.018 * s, 0.065 * s, 0.08 * s, 0.078 * s, m.biel);
  B(g, 0.10 * s, 0.10 * s, 0.018 * s, 0.065 * s, 0.08 * s, -0.078 * s, m.biel);
  const zs = kolumny === 2 ? [-0.05, 0.05] : [-0.075, -0.026, 0.026, 0.075];
  for (const z of zs) {
    CYL(g, 0.0155 * s, 0.019 * s, 0.095 * s, 0.105 * s, 0.0775 * s, z * s, m.minoan, 5);
  }
  B(g, 0.06 * s, 0.022 * s, 0.19 * s, 0.105 * s, 0.136 * s, 0, m.drewno);
  B(g, 0.27 * s, 0.026 * s, 0.108 * s, -0.02 * s, 0.192 * s, 0.048 * s, m.terak, 0.60, 0, 0);
  B(g, 0.27 * s, 0.026 * s, 0.108 * s, -0.02 * s, 0.192 * s, -0.048 * s, m.terak, -0.60, 0, 0);
  B(g, 0.27 * s, 0.026 * s, 0.048 * s, -0.02 * s, 0.216 * s, 0, m.kalenica);
  B(g, 0.013 * s, 0.075 * s, 0.05 * s, 0.066 * s, 0.0675 * s, 0, m.czern);
  B(g, 0.013 * s, 0.14 * s, 0.013 * s, -0.09 * s, 0.27 * s, 0, m.drewnoDk);
  B(g, 0.011 * s, 0.085 * s, 0.065 * s, -0.09 * s, 0.285 * s, 0.038 * s, m.frakcja);
  return g;
}

/** Prosta swiatynia mykenska (P7+): krepidoma, cella, 4 kolumny, dach-pryzma
 *  z bialym tympanonem od +x, kalenica gracza, proporzec — 200 tri. */
function swiatyniaMykenska(m: MG, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.345 * s, 0.026 * s, 0.245 * s, -0.03 * s, 0.013 * s, 0, m.kamienHi);
  B(g, 0.315 * s, 0.026 * s, 0.22 * s, -0.03 * s, 0.039 * s, 0, m.marmur);
  B(g, 0.19 * s, 0.13 * s, 0.165 * s, -0.075 * s, 0.117 * s, 0, m.biel);
  for (const z of [-0.075, -0.026, 0.026, 0.075]) {
    CYL(g, 0.016 * s, 0.0195 * s, 0.108 * s, 0.075 * s, 0.106 * s, z * s, m.marmur, 5);
  }
  B(g, 0.075 * s, 0.024 * s, 0.205 * s, 0.075 * s, 0.172 * s, 0, m.marmur);
  PRISM_X(g, 0.098 * s, 0.37 * s, -0.03 * s, 0.231 * s, 0, m.terak);
  B(g, 0.37 * s, 0.02 * s, 0.045 * s, -0.03 * s, 0.332 * s, 0, m.kalenica);
  PRISM_X(g, 0.080 * s, 0.026 * s, 0.168 * s, 0.231 * s, 0, m.marmur);
  B(g, 0.013 * s, 0.078 * s, 0.05 * s, 0.021 * s, 0.091 * s, 0, m.czern);
  B(g, 0.013 * s, 0.15 * s, 0.013 * s, -0.155 * s, 0.39 * s, 0, m.drewnoDk);
  B(g, 0.011 * s, 0.09 * s, 0.068 * s, -0.155 * s, 0.405 * s, 0.04 * s, m.frakcja);
  return g;
}

/** Stoa (portyk handlowy): podest, tylna sciana, 3 kolumienki, pulpit — 84 tri. */
function stoa(m: MG, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.26 * s, 0.02 * s, 0.095 * s, 0, 0.01 * s, 0, m.kamien);
  B(g, 0.26 * s, 0.088 * s, 0.02 * s, 0, 0.064 * s, -0.036 * s, m.biel);
  for (const x of [-0.10, 0, 0.10]) {
    CYL(g, 0.011 * s, 0.013 * s, 0.078 * s, x * s, 0.059 * s, 0.03 * s, m.marmur, 4);
  }
  B(g, 0.28 * s, 0.02 * s, 0.115 * s, 0, 0.112 * s, 0.002 * s, m.terak, 0.12, 0, 0);
  return g;
}

/** Amfora: brzusiec + szyjka — 32 tri. */
function amfora(m: MG, s = 1, ciemna = false): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.011 * s, 0.0195 * s, 0.052 * s, 0, 0.026 * s, 0, ciemna ? m.glinaDk : m.glina, 5);
  B(g, 0.015 * s, 0.017 * s, 0.015 * s, 0, 0.06 * s, 0, ciemna ? m.glina : m.glinaDk);
  return g;
}

/** Oliwka: krzywy pien + 2 srebrzyste korony — 36 tri. */
function oliwka(m: MG, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.017 * s, 0.075 * s, 0.017 * s, 0, 0.0375 * s, 0, m.pien, 0, 0, 0.15);
  B(g, 0.075 * s, 0.05 * s, 0.07 * s, 0.008 * s, 0.092 * s, 0, m.oliwa, 0, 0.5, 0.1);
  B(g, 0.05 * s, 0.04 * s, 0.048 * s, -0.012 * s, 0.124 * s, 0.008 * s, m.oliwaDk, 0.2, 0.2, 0);
  return g;
}

/** Studnia: cembrowina, 2 slupki, daszek terakota — 60 tri. */
function studniaGr(m: MG): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.032, 0.036, 0.04, 0, 0.02, 0, m.kamien, 6);
  B(g, 0.011, 0.085, 0.011, -0.03, 0.0425, 0, m.drewno);
  B(g, 0.011, 0.085, 0.011, 0.03, 0.0425, 0, m.drewno);
  B(g, 0.085, 0.014, 0.06, 0, 0.092, 0, m.terak);
  return g;
}

/** Oltarz polowy: blok + plomien — 20 tri. */
function oltarz(m: MG): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.05, 0.035, 0.042, 0, 0.0175, 0, m.kamienHi);
  CONE(g, 0.014, 0.035, 0, 0.052, 0, m.plomien, 4);
  return g;
}

/** MUR CYKLOPOWY: 2 rzedy masywnych glazow-blokow + Lwia Brama (weglary,
 *  nadproze, trojkatny tympanon) od +x (az 70-110) — 324 tri (BEZ ZMIAN). */
function murCyklopowy(m: MG, r: number): THREE.Group {
  const g = new THREE.Group();
  const gates = (az: number): boolean => az > 58 && az < 122;
  const picks = [m.kamien, m.kamienDk, m.kamienHi];
  for (let i = 0; i < 20; i++) {
    const az = i * 18 + 4;
    if (gates(az % 360)) continue;
    const { x, z } = azXZ(az, r);
    const h = 0.09 + 0.035 * ((i * 31) % 3) / 2;
    B(g, 0.112, h, 0.070, x, h / 2, z, picks[i % 3]!,
      ((i * 13) % 5 - 2) * 0.025, tangRotY(az), ((i * 7) % 3 - 1) * 0.03);
  }
  for (let i = 0; i < 8; i++) {
    const az = i * 45 + 22.5;
    if (gates(az)) continue;
    const { x, z } = azXZ(az, r * 0.995);
    B(g, 0.082, 0.06, 0.062, x, 0.128, z, picks[(i + 1) % 3]!, 0, tangRotY(az), (i % 2) * 0.05 - 0.025);
  }
  const b1 = azXZ(70, r), b2 = azXZ(110, r);
  B(g, 0.052, 0.16, 0.066, b1.x, 0.08, b1.z, m.kamienDk, 0, tangRotY(70), 0);
  B(g, 0.052, 0.16, 0.066, b2.x, 0.08, b2.z, m.kamienDk, 0, tangRotY(110), 0);
  const mx = (b1.x + b2.x) / 2;
  B(g, 0.068, 0.042, Math.abs(b2.z - b1.z) + 0.02, mx, 0.181, 0, m.kamienHi);
  PRISM_Z(g, 0.052, 0.10, mx - 0.002, 0.228, 0, m.kamien);
  return g;
}

// ------------------- kompozycje GRECJA — poziomy 1-10 ----------------------
// Fazy = pozycje zatwierdzonych kompozycji; wewnatrz fazy poziomy DOKLADAJA
// deterministyczne elementy. P3 = dawne MALE, P6 = SREDNIE, P10 = DUZE.

function placGrecki(g: THREE.Group, m: MG, rozmiar: RozmiarMiastaBraz): void {
  if (rozmiar === 'male') {
    const plac = new THREE.Mesh(new THREE.CircleGeometry(0.135, 6), m.klepisko);
    plac.rotation.x = -Math.PI / 2;
    plac.position.set(0.13, 0.011, 0.02);
    g.add(plac);
    B(g, 0.16, 0.01, 0.07, 0.27, 0.005, 0.02, m.sciezka);
    return;
  }
  if (rozmiar === 'srednie') {
    const plac = new THREE.Mesh(new THREE.CircleGeometry(0.15, 6), m.klepisko);
    plac.rotation.x = -Math.PI / 2;
    plac.position.set(0.14, 0.011, 0.03);
    g.add(plac);
    B(g, 0.18, 0.01, 0.075, 0.28, 0.005, 0.03, m.sciezka);
    B(g, 0.17, 0.01, 0.065, -0.24, 0.005, 0.15, m.sciezka, 0, 0.6, 0);
    return;
  }
  const plac = new THREE.Mesh(new THREE.CircleGeometry(0.15, 6), m.klepisko);
  plac.rotation.x = -Math.PI / 2;
  plac.position.set(0.14, 0.011, 0.06);
  g.add(plac);
  B(g, 0.72, 0.01, 0.08, 0.05, 0.005, 0.03, m.sciezka);
  B(g, 0.07, 0.01, 0.55, 0.09, 0.0052, -0.02, m.sciezka);
}

/** FAZA MALA (P1-3) — przysiolek egejski wokol megaronu in antis.
 *  P1: megaron | P2: + dom, amfora | P3: + 2 domy, amfora, oliwka, oltarz. */
function skladFazaMalaG(g: THREE.Group, m: MG, L: number): void {
  const put = mkPut(g);
  const meg = megaron(m, 1, 2);
  meg.position.set(-0.09, 0, 0);
  g.add(meg);
  if (L >= 2) {
    const p1 = azXZ(322, 0.245);
    put(domGrecki(m, 1), 322, 0.245, kuSrodkowi(p1.x, p1.z));
    put(amfora(m, 1), 126, 0.185, 0.3);
  }
  if (L >= 3) {
    const p2 = azXZ(38, 0.25);
    put(domGrecki(m, 0.95), 38, 0.25, kuSrodkowi(p2.x, p2.z) - 0.1);
    const p3 = azXZ(205, 0.245);
    put(domGrecki(m, 0.92, false, m.bielDk), 205, 0.245, kuSrodkowi(p3.x, p3.z) + 0.1);
    put(amfora(m, 0.9, true), 118, 0.155, 1.1);
    put(oliwka(m, 1), 258, 0.29, 0.4);
    put(oltarz(m), 68, 0.20, 0.5);
  }
}

/** FAZA SREDNIA (P4-6) — miasteczko z megaronem 4-kolumnowym.
 *  P4: megaron rosnie (4 kolumny) + 2 domy | P5: + studnia, dom, amfora |
 *  P6: + dom pietrowy, oliwka. */
function skladFazaSredniaG(g: THREE.Group, m: MG, L: number): void {
  const put = mkPut(g);
  const meg = megaron(m, 1.12, 4);
  meg.position.set(-0.10, 0, -0.02);
  g.add(meg);
  const d1 = azXZ(318, 0.27);
  put(domGrecki(m, 1, true), 318, 0.27, kuSrodkowi(d1.x, d1.z));
  const d2 = azXZ(352, 0.275);
  put(domGrecki(m, 0.95), 352, 0.275, kuSrodkowi(d2.x, d2.z) + 0.12);
  const d4 = azXZ(152, 0.27);
  put(domGrecki(m, 0.92, false, m.bielDk), 152, 0.27, kuSrodkowi(d4.x, d4.z));
  put(amfora(m, 1), 122, 0.20, 0.5);
  put(oliwka(m, 1), 252, 0.305, 0.2);
  put(oltarz(m), 335, 0.175, 0.2);
  if (L >= 5) {
    put(studniaGr(m), 100, 0.235, tangRotY(100));
    const d5 = azXZ(208, 0.265);
    put(domGrecki(m, 0.95), 208, 0.265, kuSrodkowi(d5.x, d5.z) - 0.12);
    put(amfora(m, 0.92, true), 113, 0.165, 1.3);
  }
  if (L >= 6) {
    const d3 = azXZ(42, 0.265);
    put(domGrecki(m, 0.98, true), 42, 0.265, kuSrodkowi(d3.x, d3.z) - 0.1);
    put(oliwka(m, 0.9), 68, 0.30, 1.5);
  }
}

/** FAZA DUZA (P7-10) — polis ze swiatynia, stoa i 2 ulicami.
 *  P7: swiatynia + stoa + 4 domy | P8: + dom pietrowy, amfora |
 *  P9: + dom przy bramie | P10: + dom kwartalu SW (pelna polis). */
function skladFazaDuzaG(g: THREE.Group, m: MG, L: number): void {
  const put = mkPut(g);
  const sw = swiatyniaMykenska(m, 1.15);
  sw.position.set(-0.115, 0, -0.045);
  g.add(sw);
  const d1 = azXZ(315, 0.285);
  put(domGrecki(m, 1, true), 315, 0.285, kuSrodkowi(d1.x, d1.z));
  const d2 = azXZ(345, 0.29);
  put(domGrecki(m, 0.93), 345, 0.29, kuSrodkowi(d2.x, d2.z) + 0.1);
  const d3 = azXZ(25, 0.285);
  put(domGrecki(m, 0.98, true), 25, 0.285, kuSrodkowi(d3.x, d3.z) - 0.1);
  const d5 = azXZ(145, 0.285);
  put(domGrecki(m, 0.95), 145, 0.285, kuSrodkowi(d5.x, d5.z) + 0.1);
  put(stoa(m, 1), 135, 0.27, tangRotY(135) + Math.PI);
  put(amfora(m, 1), 128, 0.205, 0.4);
  put(amfora(m, 0.9, true), 108, 0.19, 1.2);
  put(oliwka(m, 1), 250, 0.315, 0.6);
  put(oliwka(m, 0.92), 70, 0.325, 1.8);
  put(studniaGr(m), 92, 0.245, tangRotY(92));
  put(oltarz(m), 84, 0.14, 0.1);
  if (L >= 8) {
    const d6 = azXZ(175, 0.29);
    put(domGrecki(m, 1, true), 175, 0.29, kuSrodkowi(d6.x, d6.z));
    put(amfora(m, 0.95), 99, 0.215, 2.0);
  }
  if (L >= 9) {
    const d4 = azXZ(55, 0.30);
    put(domGrecki(m, 0.9, false, m.bielDk), 55, 0.30, kuSrodkowi(d4.x, d4.z));
  }
  if (L >= 10) {
    const d7 = azXZ(215, 0.28);
    put(domGrecki(m, 0.92, false, m.bielDk), 215, 0.28, kuSrodkowi(d7.x, d7.z) - 0.1);
  }
}

// ========================= RZYM (italsko-willanowianski) ====================

/** Paleta rzymska: sloma, glina-lepianka, rudy tuf, terakota, ziemia walu. */
const PR = {
  strzecha: 0xcda45c, strzechaDk: 0xa38147,
  daub: 0xdcbe93, daubDk: 0xc7a97c,
  tuf: 0xc4693a, tufDk: 0x9f5330,
  tynk: 0xeee0c0,
  terakota: 0xb5502f, terakotaDk: 0x93402a,
  podium: 0xb3a591, kamien: 0x9d9080, kamienDk: 0x7f7466,
  drewno: 0x8a5f36, drewnoDk: 0x6b4527, zebro: 0x7a5a33, pal: 0x77502c,
  ziemia: 0x9b7a4e, ziemiaDk: 0x83653f,
  woda: 0x5a8bb0, swinia: 0xdf9d96,
  ogien: 0xff6b2e, plomien: 0xffc02e, dym: 0xd2d2c8,
  klepisko: 0xac9166, sciezka: 0xbd9a5f,
  czern: 0x14100b,
} as const;

interface MR {
  strzecha: THREE.Material; strzechaDk: THREE.Material;
  daub: THREE.Material; daubDk: THREE.Material;
  tuf: THREE.Material; tufDk: THREE.Material; tynk: THREE.Material;
  terakota: THREE.Material; terakotaDk: THREE.Material;
  podium: THREE.Material; kamien: THREE.Material; kamienDk: THREE.Material;
  drewno: THREE.Material; drewnoDk: THREE.Material; zebro: THREE.Material; pal: THREE.Material;
  ziemia: THREE.Material; ziemiaDk: THREE.Material;
  woda: THREE.Material; swinia: THREE.Material;
  ogien: THREE.Material; plomien: THREE.Material; dym: THREE.Material;
  klepisko: THREE.Material; sciezka: THREE.Material; czern: THREE.Material;
  frakcja: THREE.Material; kalenica: THREE.Material;
}

function makeMatsR(color: number): MR {
  const kal = new THREE.Color(PR.terakotaDk).lerp(new THREE.Color(color & 0xffffff), 0.40);
  return {
    strzecha: mat(PR.strzecha), strzechaDk: mat(PR.strzechaDk),
    daub: mat(PR.daub), daubDk: mat(PR.daubDk),
    tuf: mat(PR.tuf), tufDk: mat(PR.tufDk), tynk: mat(PR.tynk),
    terakota: mat(PR.terakota), terakotaDk: mat(PR.terakotaDk),
    podium: mat(PR.podium), kamien: mat(PR.kamien), kamienDk: mat(PR.kamienDk),
    drewno: mat(PR.drewno), drewnoDk: mat(PR.drewnoDk), zebro: mat(PR.zebro), pal: mat(PR.pal),
    ziemia: mat(PR.ziemia), ziemiaDk: mat(PR.ziemiaDk),
    woda: mat(PR.woda), swinia: mat(PR.swinia),
    ogien: mat(PR.ogien), plomien: mat(PR.plomien), dym: mat(PR.dym),
    klepisko: mat(PR.klepisko), sciezka: mat(PR.sciezka), czern: mat(PR.czern),
    frakcja: mat(color & 0xffffff),
    kalenica: new THREE.MeshLambertMaterial({ color: kal, flatShading: true }),
  };
}

/** Vexillum: maszt + poprzeczka + zwisajaca plachta w kolorze gracza — 36 tri. */
function vexillum(m: MR, s = 1): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.012 * s, 0.21 * s, 0.012 * s, 0, 0.105 * s, 0, m.drewnoDk);
  B(g, 0.012 * s, 0.012 * s, 0.078 * s, 0, 0.206 * s, 0, m.drewno);
  B(g, 0.011 * s, 0.068 * s, 0.064 * s, 0.005 * s, 0.168 * s, 0, m.frakcja);
  return g;
}

/** CAPANNA — owalna chata willanowianska: wysoka stozkowa strzecha, drewniane
 *  zebra na polaci, skrzyzowane belki u szczytu — 96 tri (wodz +36 vexillum). */
function capanna(m: MR, s = 1, wodz = false): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.066 * s, 0.078 * s, 0.062 * s, 0, 0.031 * s, 0, m.daub, 6).scale.z = 0.84;
  CONE(g, 0.115 * s, 0.15 * s, 0, 0.137 * s, 0, m.strzecha, 6).scale.z = 0.84;
  const zr = (a: number): void => {
    B(g, 0.013 * s, 0.155 * s, 0.013 * s,
      Math.cos(a) * 0.060 * s, 0.132 * s, Math.sin(a) * 0.060 * s * 0.84, m.zebro, 0, -a, 0.66);
  };
  zr(0.72); zr(-0.72);
  B(g, 0.012 * s, 0.062 * s, 0.012 * s, 0, 0.219 * s, 0.011 * s, m.zebro, 0.5, 0, 0);
  B(g, 0.012 * s, 0.062 * s, 0.012 * s, 0, 0.219 * s, -0.011 * s, m.zebro, -0.5, 0, 0);
  B(g, 0.013 * s, 0.05 * s, 0.04 * s, 0.072 * s, 0.025 * s, 0, m.czern);
  if (wodz) {
    const v = vexillum(m, s);
    v.position.set(0, 0.10 * s, 0);
    g.add(v);
  }
  return g;
}

/** Dom z tufu: rude sciany, dachowka, kalenica — 60 tri. */
function domTufu(m: MR, s = 1, ciemny = false): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.16 * s, 0.115 * s, 0.14 * s, 0, 0.0575 * s, 0, ciemny ? m.tufDk : m.tuf);
  B(g, 0.185 * s, 0.028 * s, 0.10 * s, 0, 0.132 * s, 0.042 * s, m.terakota, 0.68, 0, 0);
  B(g, 0.185 * s, 0.028 * s, 0.10 * s, 0, 0.132 * s, -0.042 * s, m.terakota, -0.68, 0, 0);
  B(g, 0.18 * s, 0.026 * s, 0.05 * s, 0, 0.163 * s, 0, m.terakotaDk);
  B(g, 0.013 * s, 0.065 * s, 0.045 * s, 0.081 * s, 0.0325 * s, 0, m.czern);
  return g;
}

/** Swiatynka etruska na podium: frontowe schody, 2 tuscanskie kolumny,
 *  szeroki okap, akroterion; opcjonalny vexillum obok — 160/196 tri. */
function swiatynkaEtruska(m: MR, s = 1, vex = true): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.26 * s, 0.065 * s, 0.20 * s, -0.02 * s, 0.0325 * s, 0, m.podium);
  B(g, 0.05 * s, 0.022 * s, 0.11 * s, 0.138 * s, 0.011 * s, 0, m.kamienDk);
  B(g, 0.05 * s, 0.022 * s, 0.11 * s, 0.118 * s, 0.033 * s, 0, m.kamien);
  B(g, 0.15 * s, 0.105 * s, 0.165 * s, -0.055 * s, 0.1175 * s, 0, m.tynk);
  CYL(g, 0.0145 * s, 0.0175 * s, 0.088 * s, 0.062 * s, 0.099 * s, -0.055 * s, m.drewno, 5);
  CYL(g, 0.0145 * s, 0.0175 * s, 0.088 * s, 0.062 * s, 0.099 * s, 0.055 * s, m.drewno, 5);
  B(g, 0.05 * s, 0.02 * s, 0.185 * s, 0.062 * s, 0.153 * s, 0, m.drewnoDk);
  B(g, 0.30 * s, 0.026 * s, 0.13 * s, -0.005 * s, 0.185 * s, 0.058 * s, m.terakota, 0.55, 0, 0);
  B(g, 0.30 * s, 0.026 * s, 0.13 * s, -0.005 * s, 0.185 * s, -0.058 * s, m.terakota, -0.55, 0, 0);
  B(g, 0.30 * s, 0.024 * s, 0.05 * s, -0.005 * s, 0.214 * s, 0, m.kalenica);
  B(g, 0.022 * s, 0.03 * s, 0.022 * s, 0.132 * s, 0.228 * s, 0, m.terakotaDk);
  B(g, 0.012 * s, 0.062 * s, 0.045 * s, 0.021 * s, 0.086 * s, 0, m.czern);
  if (vex) {
    const v = vexillum(m, s * 1.05);
    v.position.set(-0.165 * s, 0, 0.085 * s);
    g.add(v);
  }
  return g;
}

/** Palenisko-westa: kamienny krag, ogien, plomien, dym (+lawa gdy duza) — 52/76. */
function westa(m: MR, duza = false): THREE.Group {
  const g = new THREE.Group();
  CYL(g, 0.045, 0.05, 0.03, 0, 0.015, 0, m.kamienDk, 6);
  CONE(g, 0.028, 0.065, 0, 0.062, 0, m.ogien, 4);
  CONE(g, 0.015, 0.042, 0.004, 0.098, 0.004, m.plomien, 4);
  B(g, 0.042, 0.042, 0.042, 0.012, 0.15, 0.008, m.dym, 0.2, 0.4, 0.15);
  if (duza) {
    B(g, 0.052, 0.046, 0.052, 0.03, 0.208, 0.024, m.dym, -0.1, 0.2, 0.3);
    B(g, 0.085, 0.02, 0.03, -0.075, 0.014, 0.03, m.drewno, 0, 0.5, 0);
  }
  return g;
}

/** Spichlerzyk na palach (horreum): 4 pale, skrzynia, strzechowy stozek — 68. */
function spichlerzykRz(m: MR): THREE.Group {
  const g = new THREE.Group();
  for (const [px, pz] of [[-0.032, -0.026], [0.032, -0.026], [-0.032, 0.026], [0.032, 0.026]] as const) {
    B(g, 0.014, 0.05, 0.014, px, 0.025, pz, m.pal);
  }
  B(g, 0.095, 0.058, 0.078, 0, 0.079, 0, m.drewno);
  CONE(g, 0.078, 0.055, 0, 0.135, 0, m.strzechaDk, 4);
  return g;
}

/** Zagroda: 3 plotki + swinka (seria swinia-trzoda) — 60 tri. */
function zagroda(m: MR): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.115, 0.026, 0.012, 0, 0.026, -0.045, m.pal);
  B(g, 0.115, 0.026, 0.012, 0, 0.026, 0.045, m.pal);
  B(g, 0.012, 0.026, 0.09, -0.057, 0.026, 0, m.pal);
  B(g, 0.04, 0.026, 0.024, 0.012, 0.013, 0.008, m.swinia, 0, 0.4, 0);
  B(g, 0.017, 0.015, 0.017, 0.034, 0.017, 0.014, m.swinia, 0, 0.4, 0);
  return g;
}

/** Cysterna-studnia: kamienny blok z woda — 24 tri. */
function cysterna(m: MR): THREE.Group {
  const g = new THREE.Group();
  B(g, 0.06, 0.035, 0.06, 0, 0.0175, 0, m.kamien);
  B(g, 0.044, 0.012, 0.044, 0, 0.037, 0, m.woda);
  return g;
}

/** WAL AGGER: nasyp ziemny + palisada na koronie + wiezyczka bramna — 344 tri
 *  (BEZ ZMIAN — mur liczony osobno od budzetu progresji). */
function walAgger(m: MR, r: number): THREE.Group {
  const g = new THREE.Group();
  const gates = (az: number): boolean => az > 58 && az < 122;
  for (let i = 0; i < 16; i++) {
    const az = i * 22.5 + 3;
    if (gates(az % 360)) continue;
    const { x, z } = azXZ(az, r - 0.008);
    B(g, 0.19, 0.05, 0.08, x, 0.025, z, i % 2 ? m.ziemiaDk : m.ziemia, 0, tangRotY(az), 0);
  }
  for (let i = 0; i < 18; i++) {
    const az = i * 20 + 10;
    if (gates(az)) continue;
    const { x, z } = azXZ(az, r - 0.008);
    const h = 0.125 + 0.03 * ((i * 37) % 3) / 2;
    CONE(g, 0.034, h, x, 0.042 + h / 2, z, m.pal, 4,
      0.04 * Math.cos((az * Math.PI) / 180), (i % 3) * 0.4, -0.04 * Math.sin((az * Math.PI) / 180));
  }
  const b1 = azXZ(72, r), b2 = azXZ(108, r);
  B(g, 0.045, 0.185, 0.045, b1.x, 0.0925, b1.z, m.drewnoDk);
  B(g, 0.045, 0.185, 0.045, b2.x, 0.0925, b2.z, m.drewnoDk);
  const mx = (b1.x + b2.x) / 2;
  B(g, 0.052, 0.024, Math.abs(b2.z - b1.z) + 0.05, mx, 0.172, 0, m.drewno);
  B(g, 0.075, 0.058, 0.085, mx + 0.002, 0.213, 0, m.drewno);
  CONE(g, 0.060, 0.052, mx + 0.002, 0.268, 0, m.strzechaDk, 4);
  B(g, 0.08, 0.016, 0.06, azXZ(90, r - 0.022).x, 0.008, azXZ(90, r - 0.022).z, m.ziemiaDk);
  return g;
}

// -------------------- kompozycje RZYM — poziomy 1-10 -----------------------

/** Plac rzymski: na P1 sama sciezka (klepisko-deptak od P2 — budzet P1). */
function placRzymski(g: THREE.Group, m: MR, rozmiar: RozmiarMiastaBraz, L: number): void {
  if (rozmiar === 'male') {
    if (L >= 2) {
      const plac = new THREE.Mesh(new THREE.CircleGeometry(0.125, 6), m.klepisko);
      plac.rotation.x = -Math.PI / 2;
      plac.position.set(0.08, 0.011, 0.03);
      g.add(plac);
    }
    B(g, 0.16, 0.01, 0.07, 0.26, 0.005, 0.02, m.sciezka);
    return;
  }
  if (rozmiar === 'srednie') {
    const plac = new THREE.Mesh(new THREE.CircleGeometry(0.145, 6), m.klepisko);
    plac.rotation.x = -Math.PI / 2;
    plac.position.set(0.12, 0.011, 0.04);
    g.add(plac);
    B(g, 0.18, 0.01, 0.075, 0.28, 0.005, 0.03, m.sciezka);
    B(g, 0.17, 0.01, 0.065, -0.22, 0.005, 0.17, m.sciezka, 0, 0.55, 0);
    return;
  }
  const plac = new THREE.Mesh(new THREE.CircleGeometry(0.15, 6), m.klepisko);
  plac.rotation.x = -Math.PI / 2;
  plac.position.set(0.14, 0.011, 0.07);
  g.add(plac);
  B(g, 0.72, 0.01, 0.08, 0.05, 0.005, 0.04, m.sciezka);
  B(g, 0.07, 0.01, 0.55, 0.10, 0.0052, -0.01, m.sciezka);
}

/** FAZA MALA (P1-3) — wies willanowianska wokol westy.
 *  P1: capanna wodza + westa | P2: + capanna | P3: + capanna, spichlerzyk,
 *  zagroda. */
function skladFazaMalaR(g: THREE.Group, m: MR, L: number): void {
  const put = mkPut(g);
  const wodz = capanna(m, 1.05, true);
  wodz.position.set(-0.08, 0, -0.04);
  wodz.rotation.y = 0.1;
  g.add(wodz);
  const w = westa(m, false);
  w.position.set(0.07, 0.012, 0.04);
  g.add(w);
  if (L >= 2) {
    const c1 = azXZ(210, 0.24);
    put(capanna(m, 0.95), 210, 0.24, kuSrodkowi(c1.x, c1.z));
  }
  if (L >= 3) {
    const c2 = azXZ(322, 0.25);
    put(capanna(m, 0.9), 322, 0.25, kuSrodkowi(c2.x, c2.z) + 0.15);
    put(spichlerzykRz(m), 145, 0.26, tangRotY(145));
    put(zagroda(m), 52, 0.27, tangRotY(52) + 0.3);
  }
}

/** FAZA SREDNIA (P4-6) — osada ze swiatynka etruska.
 *  P4: SWIATYNKA NA PODIUM zamiast capanny wodza + wieksza westa |
 *  P5: + pierwszy dom z tufu | P6: + trzecia capanna. */
function skladFazaSredniaR(g: THREE.Group, m: MR, L: number): void {
  const put = mkPut(g);
  const sw = swiatynkaEtruska(m, 1, true);
  sw.position.set(-0.10, 0, -0.02);
  g.add(sw);
  const w = westa(m, true);
  w.position.set(0.11, 0.012, 0.08);
  g.add(w);
  const c1 = azXZ(210, 0.265);
  put(capanna(m, 0.95), 210, 0.265, kuSrodkowi(c1.x, c1.z));
  const c2 = azXZ(318, 0.27);
  put(capanna(m, 1), 318, 0.27, kuSrodkowi(c2.x, c2.z) - 0.1);
  put(spichlerzykRz(m), 250, 0.28, tangRotY(250));
  put(zagroda(m), 115, 0.30, tangRotY(115) - 0.2);
  if (L >= 5) {
    const t1 = azXZ(152, 0.27);
    put(domTufu(m, 1), 152, 0.27, kuSrodkowi(t1.x, t1.z));
  }
  if (L >= 6) {
    const c3 = azXZ(40, 0.265);
    put(capanna(m, 0.9), 40, 0.265, kuSrodkowi(c3.x, c3.z) + 0.1);
  }
}

/** FAZA DUZA (P7-10) — miasto z ulica domow z tufu.
 *  P7: ulice + 2 domy z tufu + 3 capanny | P8: + dom z tufu |
 *  P9: swiatynka ROSNIE (s1.22) + cysterna | P10: + czwarta capanna. */
function skladFazaDuzaR(g: THREE.Group, m: MR, L: number): void {
  const put = mkPut(g);
  const sw = swiatynkaEtruska(m, L >= 9 ? 1.22 : 1.15, true);
  sw.position.set(-0.115, 0, -0.05);
  g.add(sw);
  const w = westa(m, true);
  w.position.set(0.14, 0.012, 0.09);
  g.add(w);
  const t1 = azXZ(305, 0.28);
  put(domTufu(m, 1), 305, 0.28, kuSrodkowi(t1.x, t1.z));
  const t3 = azXZ(25, 0.285);
  put(domTufu(m, 1), 25, 0.285, kuSrodkowi(t3.x, t3.z) - 0.1);
  const c1 = azXZ(60, 0.295);
  put(capanna(m, 0.92), 60, 0.295, kuSrodkowi(c1.x, c1.z));
  const c2 = azXZ(145, 0.285);
  put(capanna(m, 0.98), 145, 0.285, kuSrodkowi(c2.x, c2.z) + 0.1);
  const c4 = azXZ(215, 0.28);
  put(capanna(m, 0.95), 215, 0.28, kuSrodkowi(c4.x, c4.z));
  put(spichlerzykRz(m), 245, 0.30, tangRotY(245));
  put(zagroda(m), 112, 0.31, tangRotY(112) - 0.2);
  if (L >= 8) {
    const t2 = azXZ(335, 0.29);
    put(domTufu(m, 0.95, true), 335, 0.29, kuSrodkowi(t2.x, t2.z) + 0.1);
  }
  if (L >= 9) {
    put(cysterna(m), 95, 0.245, 0.3);
  }
  if (L >= 10) {
    const c3 = azXZ(175, 0.29);
    put(capanna(m, 0.9), 175, 0.29, kuSrodkowi(c3.x, c3.z) - 0.1);
  }
}

// ========================= API GLOWNE ======================================

/** Zgodnosc wstecz: nazwy progow mapuja na reprezentatywny poziom fazy. */
function poziomZArgumentu(a: RozmiarMiastaBraz | number): number {
  if (typeof a === 'number') return Math.max(1, Math.min(10, Math.round(a)));
  return a === 'male' ? 3 : a === 'srednie' ? 6 : 10;
}

function zapakuj(inner: THREE.Group, model: string, rz: RozmiarMiastaBraz, L: number): THREE.Group {
  const root = new THREE.Group();
  inner.scale.setScalar(1 / MIASTO_BRAZ_CITY_MODEL_SCALE);
  root.add(inner);
  root.userData['model'] = model;
  root.userData['poziom'] = L;
  root.userData['rozmiar'] = rz;
  return root;
}

/** Os muru wg fazy (jak kamien: 0.37 / 0.42 / 0.445). */
const OS_MURU: Record<RozmiarMiastaBraz, number> = { male: 0.37, srednie: 0.42, duze: 0.445 };

/**
 * Miasto epoki brazu — GRECJA (mykensko-egejska), PROGRESJA 10 POZIOMOW.
 * @param poziom 1..10 (P3/P6/P10 = dawne male/srednie/duze); dla zgodnosci
 *               przyjmuje tez nazwy progow ('male'->3, 'srednie'->6, 'duze'->10).
 * @param opts   { mur, color } — mur cyklopowy (KAZDY poziom) + kolor gracza.
 * Root zawiera dziecko przeskalowane 1/1.38 (kompensacja CITY_MODEL_SCALE).
 */
export function buildMiastoBrazGrecja(
  poziom: RozmiarMiastaBraz | number = 10,
  opts: MiastoBrazOpts = {},
): THREE.Group {
  const L = poziomZArgumentu(poziom);
  const rz = rozmiarDlaPoziomu(L);
  const m = makeMatsG(opts.color ?? MIASTO_BRAZ_DEFAULT_COLOR);
  const inner = new THREE.Group();
  placGrecki(inner, m, rz);
  if (rz === 'male') skladFazaMalaG(inner, m, L);
  else if (rz === 'srednie') skladFazaSredniaG(inner, m, L);
  else skladFazaDuzaG(inner, m, L);
  if (opts.mur) inner.add(murCyklopowy(m, OS_MURU[rz]));
  return zapakuj(inner, 'miasto-braz-grecja', rz, L);
}

/**
 * Miasto epoki brazu — RZYM (italsko-willanowianski), PROGRESJA 10 POZIOMOW.
 * @param poziom 1..10 (P3/P6/P10 = dawne male/srednie/duze); dla zgodnosci
 *               przyjmuje tez nazwy progow ('male'->3, 'srednie'->6, 'duze'->10).
 * @param opts   { mur, color } — wal agger (KAZDY poziom) + kolor gracza.
 * Root zawiera dziecko przeskalowane 1/1.38 (kompensacja CITY_MODEL_SCALE).
 */
export function buildMiastoBrazRzym(
  poziom: RozmiarMiastaBraz | number = 10,
  opts: MiastoBrazOpts = {},
): THREE.Group {
  const L = poziomZArgumentu(poziom);
  const rz = rozmiarDlaPoziomu(L);
  const m = makeMatsR(opts.color ?? MIASTO_BRAZ_DEFAULT_COLOR);
  const inner = new THREE.Group();
  placRzymski(inner, m, rz, L);
  if (rz === 'male') skladFazaMalaR(inner, m, L);
  else if (rz === 'srednie') skladFazaSredniaR(inner, m, L);
  else skladFazaDuzaR(inner, m, L);
  if (opts.mur) inner.add(walAgger(m, OS_MURU[rz]));
  return zapakuj(inner, 'miasto-braz-rzym', rz, L);
}

/** Cywilizacje z gotowym zestawem brazu. */
export type CywBrazu = 'grecja' | 'rzym';

/**
 * Router per cywilizacja pod settlementModel.ts (era >= 2, styl roblox).
 * Nieznane typy dostaja na razie zestaw grecki (jak stary fallback 'grecja').
 */
export function buildMiastoBraz(
  civ: string,
  poziom: RozmiarMiastaBraz | number,
  opts: MiastoBrazOpts = {},
): THREE.Group {
  if (civ === 'rzym') return buildMiastoBrazRzym(poziom, opts);
  return buildMiastoBrazGrecja(poziom, opts);
}

/** Layout / progi / granice — do integracji i testow kolizji z ulepszeniami. */
export const MIASTO_BRAZ_LAYOUT = {
  hexR: 1.0,
  cityModelScale: MIASTO_BRAZ_CITY_MODEL_SCALE,
  progi: { male: [1, 3], srednie: [4, 6], duze: [7, 10] } as const,
  /** Tri per poziom 1..10 (bez muru; zmierzone stats()). */
  triPoziomy: {
    grecja: [190, 258, 418, 474, 602, 710, 746, 850, 886, 922],
    rzym:   [196, 298, 522, 622, 682, 778, 838, 898, 922, 1018],
  } as const,
  /** Tri muru (staly per cywilizacja; liczony osobno). */
  triMuru: { grecja: 324, rzym: 344 } as const,
  /** Max promien footprintu W SWIECIE (po CityRenderer; zmierzone per wierzcholek). */
  granice: {
    grecja: {
      male:    { bezMuru: 0.36, zMurem: 0.42 },
      srednie: { bezMuru: 0.38, zMurem: 0.47 },
      duze:    { bezMuru: 0.42, zMurem: 0.49 },
    },
    rzym: {
      male:    { bezMuru: 0.35, zMurem: 0.42 },
      srednie: { bezMuru: 0.38, zMurem: 0.47 },
      duze:    { bezMuru: 0.42, zMurem: 0.49 },
    },
  },
  /** Os muru (przed kompensacja skali; w swiecie te same wartosci). */
  osMuru: OS_MURU,
  rezerwaSrodka: 0.40,
  /** Przod = +x: brama (az 70-110), wylot glownej ulicy E-W. */
  przod: '+x',
} as const;
