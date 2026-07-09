/**
 * pastwisko-modele.ts — zwierzeta terenowe pastwiska w stylu Roblox
 * (krowa x2 pozy/x2 warianty, owca x2 pozy/x2 warianty, lama) + PASTWISKO_LAYOUT (strefy heksa).
 *
 * KOREKTA 2026-07-08 (decyzja Macieja): na pastwisku OWCE, nie kozy —
 * buildKoza -> buildOwca, sloty kozaA/kozaB -> owcaA/owcaB (sektor S-SW bez zmian).
 *
 * KONWENCJE (zgodne z gra/src/render/styleResources.ts):
 *  - skala S = 2.05/3 (ta sama co nakladki surowcowe: styledCow/styledSheep/styledLlama),
 *  - przod modelu = +x, spod nog na y = 0 (powierzchnia heksa), obrot figury = rotation.y,
 *  - MeshLambertMaterial + flatShading, castShadow = true, zero tekstur,
 *  - budzet: krowa 252 tri, owca 192 tri, lama 204 tri (box = 12 tri; dekoracje instancjonowane).
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/pastwisko-modele.ts.
 *  2. Ulepszenia (render/robloxImprovements.ts, registry BUILDERS ~linia 376):
 *       import { buildKrowa, buildOwca, buildLama, buildPastwiskoZwierzeta } from './pastwisko-modele';
 *       bydlo:     g => { g.add(buildPastwiskoZwierzeta()); },      // pelne pastwisko (bez budynku)
 *       pastwisko: g => { g.add(buildPastwiskoZwierzeta()); },
 *       lama:      g => { const l = buildLama(); l.position.set(0.63, 0, 0.04); g.add(l); },
 *     (dotychczasowe rbxBydlo/rbxLama — do wycofania; stawialy figury w srodku heksa,
 *      nowy uklad zostawia srodek WOLNY pod budynek wg PASTWISKO_LAYOUT.budynek).
 *  3. Nakladka zloza bydla (render/styleResources.ts:396-401, case Nakladka.ZlozeBydla):
 *     zamiast styledCow() -> buildKrowa({ poza: 'pasaca' }) + buildKrowa({ wariant: 'brazowa' })
 *     w slotach PASTWISKO_LAYOUT.sloty.krowaA/krowaB.
 *  4. Nakladka zloza owiec (tamze, case Nakladka.ZlozeOwiec): zamiast styledSheep() ->
 *     buildOwca({ poza: 'stojaca', wariant: 'biala' }) + buildOwca({ poza: 'skubiaca',
 *     wariant: 'czarna' }) w slotach PASTWISKO_LAYOUT.sloty.owcaA/owcaB.
 *  5. Przyszla farma/zagroda: stawiac w PASTWISKO_LAYOUT.budynek (srodek, promien 0.40 x HEX_R);
 *     kolejne assety (plot, poidlo, stog) dokladac w sektorze `wolny` (W-NW) lub na wolnych
 *     azymutach pierscienia — NIE wchodzic w strefe budynku.
 */
import * as THREE from 'three';

/** Skala figur — identyczna z S w styleResources.ts (male nakladki surowcowe). */
export const PASTWISKO_S = 2.05 / 3;

export type PozaKrowy = 'stojaca' | 'pasaca';
export type WariantKrowy = 'lacata' | 'brazowa';
export type PozaOwcy = 'stojaca' | 'skubiaca';
export type WariantOwcy = 'biala' | 'czarna';

function mat(c: number): THREE.MeshLambertMaterial {
  return new THREE.MeshLambertMaterial({ color: c, flatShading: true });
}

/** Klocek: srodek (cx,cy,cz), opcjonalny obrot — wymiary/pozycje juz w jednostkach swiata. */
function B(
  g: THREE.Group, w: number, h: number, d: number,
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

// ============================== KROWA (252 tri) ============================
export function buildKrowa(opts: { poza?: PozaKrowy; wariant?: WariantKrowy } = {}): THREE.Group {
  const wariant = opts.wariant ?? 'lacata';
  const poza = opts.poza ?? 'stojaca';
  const s = PASTWISKO_S;
  const cialo = mat(wariant === 'lacata' ? 0xf5f2ec : 0x9a6238);
  const lata  = mat(wariant === 'lacata' ? 0x26221e : 0x59361b);
  const rog = mat(0xf2ead0);
  const roz = mat(0xe8a0a8);
  const ciemny = mat(0x26221e);
  const g = new THREE.Group();

  const legH = 0.075 * s, legW = 0.032 * s;
  for (const [lx, lz] of [[-0.062, 0.042], [-0.062, -0.042], [0.058, 0.042], [0.058, -0.042]] as const) {
    B(g, legW, legH, legW, lx * s, legH / 2, lz * s, lata);
  }
  // tulow + laty (przenikaja tulow, wystaja po 0.004 na boki)
  B(g, 0.21 * s, 0.115 * s, 0.13 * s, -0.015 * s, 0.128 * s, 0, cialo);
  B(g, 0.062 * s, 0.092 * s, 0.138 * s, 0.042 * s, 0.138 * s, 0, lata);
  B(g, 0.052 * s, 0.075 * s, 0.138 * s, -0.038 * s, 0.108 * s, 0, lata);
  B(g, 0.055 * s, 0.1 * s, 0.138 * s, -0.096 * s, 0.132 * s, 0, lata);
  // wymie + ogon z kitka
  B(g, 0.055 * s, 0.032 * s, 0.05 * s, -0.055 * s, 0.062 * s, 0, roz);
  B(g, 0.013 * s, 0.075 * s, 0.013 * s, -0.128 * s, 0.135 * s, 0, cialo, 0, 0, -0.35);
  B(g, 0.02 * s, 0.028 * s, 0.02 * s, -0.142 * s, 0.092 * s, 0, ciemny, 0, 0, -0.35);

  // GLOWA — podgrupa z pivotem przy tulowiu (poza pasaca = obrot calej glowy w dol)
  const head = new THREE.Group();
  head.position.set(0.085 * s, 0.155 * s, 0);
  g.add(head);
  const H = (w: number, h: number, d: number, cx: number, cy: number, cz: number, m: THREE.Material, rx = 0, ry = 0, rz = 0) =>
    B(head, w * s, h * s, d * s, cx * s, cy * s, cz * s, m, rx, ry, rz);
  H(0.055, 0.07, 0.085, 0.012, 0, 0, cialo);                     // szyja
  H(0.09, 0.088, 0.105, 0.068, 0.008, 0, cialo);                 // LEB — duzy, klockowy
  H(0.048, 0.052, 0.082, 0.132, -0.008, 0, roz);                 // morda
  H(0.05, 0.012, 0.05, 0.128, 0.02, 0, cialo);                   // grzywka nad morda
  H(0.014, 0.02, 0.014, 0.098, 0.02, 0.055, ciemny);             // oko L
  H(0.014, 0.02, 0.014, 0.098, 0.02, -0.055, ciemny);            // oko P
  H(0.042, 0.018, 0.03, 0.048, 0.042, 0.062, lata, 0.5, 0, 0);   // ucho L
  H(0.042, 0.018, 0.03, 0.048, 0.042, -0.062, lata, -0.5, 0, 0); // ucho P
  H(0.018, 0.048, 0.018, 0.062, 0.062, 0.034, rog, 0.55, 0, 0);  // rog L
  H(0.018, 0.048, 0.018, 0.062, 0.062, -0.034, rog, -0.55, 0, 0); // rog P

  if (poza === 'pasaca') head.rotation.z = -1.05; // morda przy trawie
  return g;
}

// ============================== OWCA (192 tri) =============================
// Klockowa "chmurka" runa: rdzen + szersza warstwa gorna + puch piersi/zadu
// (lekko skrecone klocki = zaokraglony, puszysty obrys). Ciemniejszy leb i nogi.
// Warianty: biala (runo jasne, leb/nogi ciemne) i czarna (runo ciemne, JASNY pysk).
export function buildOwca(opts: { poza?: PozaOwcy; wariant?: WariantOwcy } = {}): THREE.Group {
  const poza = opts.poza ?? 'stojaca';
  const wariant = opts.wariant ?? 'biala';
  const s = PASTWISKO_S;
  const runo  = mat(wariant === 'biala' ? 0xf4f1e6 : 0x2f2a25); // welna-chmurka
  const skora = mat(wariant === 'biala' ? 0x332d27 : 0x241f1b); // leb + nogi (ciemniejsze)
  const pysk  = mat(wariant === 'biala' ? 0x5a4f44 : 0xe3d8c4); // czarna owca = jasny pysk
  const oko   = mat(0xe9e2d2);                                  // jasne oko na ciemnym lbie
  const g = new THREE.Group();

  const legH = 0.055 * s, legW = 0.02 * s;
  for (const [lx, lz] of [[-0.042, 0.027], [-0.042, -0.027], [0.042, 0.027], [0.042, -0.027]] as const) {
    B(g, legW, legH, legW, lx * s, legH / 2, lz * s, skora);
  }
  // KADLUB-CHMURKA (4 przenikajace sie klocki runa + ogonek-pomponik)
  B(g, 0.135 * s, 0.082 * s, 0.098 * s, 0, 0.093 * s, 0, runo);                      // rdzen
  B(g, 0.15 * s, 0.046 * s, 0.112 * s, -0.004 * s, 0.14 * s, 0, runo, 0, 0.14, 0);   // warstwa gorna (szersza = puch)
  B(g, 0.052 * s, 0.062 * s, 0.104 * s, 0.062 * s, 0.108 * s, 0, runo, 0, -0.12, 0); // puch piersi
  B(g, 0.054 * s, 0.066 * s, 0.106 * s, -0.062 * s, 0.112 * s, 0, runo, 0, 0.16, 0); // puch zadu
  B(g, 0.028 * s, 0.03 * s, 0.03 * s, -0.088 * s, 0.148 * s, 0, runo, 0, 0, 0.35);   // ogonek-pomponik

  // GLOWA — podgrupa z pivotem przy piersi (poza skubiaca = obrot w dol jak u krowy)
  const head = new THREE.Group();
  head.position.set(0.065 * s, 0.125 * s, 0);
  g.add(head);
  const H = (w: number, h: number, d: number, cx: number, cy: number, cz: number, m: THREE.Material, rx = 0, ry = 0, rz = 0) =>
    B(head, w * s, h * s, d * s, cx * s, cy * s, cz * s, m, rx, ry, rz);
  H(0.052, 0.055, 0.05, 0.03, 0.008, 0, skora);                   // LEB (ciemny)
  H(0.026, 0.03, 0.036, 0.066, -0.004, 0, pysk);                  // pysk
  H(0.046, 0.022, 0.058, 0.02, 0.042, 0, runo);                   // welniana czapeczka
  H(0.032, 0.013, 0.02, 0.026, 0.026, 0.036, skora, 0.6, 0, -0.15);  // ucho L (opadajace)
  H(0.032, 0.013, 0.02, 0.026, 0.026, -0.036, skora, -0.6, 0, -0.15); // ucho P
  H(0.011, 0.014, 0.011, 0.05, 0.018, 0.027, oko);                // oko L
  H(0.011, 0.014, 0.011, 0.05, 0.018, -0.027, oko);               // oko P

  if (poza === 'skubiaca') head.rotation.z = -1.35; // pysk przy trawie
  return g;
}

// ============================== LAMA (204 tri) =============================
export function buildLama(): THREE.Group {
  const s = PASTWISKO_S * 0.9; // zgodnosc skali ze stara lama (styledLlama)
  const bez = mat(0xd9b98c);
  const puch = mat(0xeedcb6);
  const ciemnybez = mat(0xb08a58);
  const ciemny = mat(0x2a2622);
  const g = new THREE.Group();

  const legH = 0.082 * s, legW = 0.024 * s;
  for (const [lx, lz] of [[-0.046, 0.03], [-0.046, -0.03], [0.046, 0.03], [0.046, -0.03]] as const) {
    B(g, legW, legH, legW, lx * s, legH / 2, lz * s, ciemnybez);
  }
  B(g, 0.135 * s, 0.09 * s, 0.095 * s, 0, 0.122 * s, 0, bez);            // tors
  B(g, 0.148 * s, 0.048 * s, 0.108 * s, 0, 0.158 * s, 0, puch);          // runo grzbietu (szersze = puch)
  B(g, 0.055 * s, 0.075 * s, 0.102 * s, -0.055 * s, 0.132 * s, 0, puch); // puch zadu
  B(g, 0.032 * s, 0.038 * s, 0.032 * s, -0.082 * s, 0.155 * s, 0, puch, 0, 0, 0.5); // ogon-pompon
  B(g, 0.046 * s, 0.135 * s, 0.052 * s, 0.055 * s, 0.24 * s, 0, bez);    // dluga PIONOWA szyja
  B(g, 0.062 * s, 0.05 * s, 0.068 * s, 0.055 * s, 0.182 * s, 0, puch);   // kolnierz puchu
  B(g, 0.052 * s, 0.056 * s, 0.056 * s, 0.062 * s, 0.325 * s, 0, bez);   // glowa (mala)
  B(g, 0.03 * s, 0.032 * s, 0.036 * s, 0.096 * s, 0.318 * s, 0, ciemnybez); // pyszczek
  B(g, 0.034 * s, 0.016 * s, 0.042 * s, 0.06 * s, 0.358 * s, 0, puch);   // grzywka-czapeczka
  B(g, 0.012 * s, 0.02 * s, 0.012 * s, 0.08 * s, 0.334 * s, 0.03 * s, ciemny);  // oko L
  B(g, 0.012 * s, 0.02 * s, 0.012 * s, 0.08 * s, 0.334 * s, -0.03 * s, ciemny); // oko P
  B(g, 0.015 * s, 0.052 * s, 0.017 * s, 0.052 * s, 0.388 * s, 0.021 * s, bez, -0.14, 0, -0.1); // ucho-banan L
  B(g, 0.015 * s, 0.052 * s, 0.017 * s, 0.052 * s, 0.388 * s, -0.021 * s, bez, 0.14, 0, -0.1); // ucho-banan P
  return g;
}

// ========================= PASTWISKO_LAYOUT ================================
export interface PastwiskoSlot { x: number; z: number; rotY: number; poza?: string; wariant?: string; }

const az = (deg: number, r: number): { x: number; z: number } => ({
  x: +(r * Math.sin((deg * Math.PI) / 180)).toFixed(3),
  z: +(-r * Math.cos((deg * Math.PI) / 180)).toFixed(3),
});

/**
 * Strefy heksa pastwiska — wspolrzedne ZNORMALIZOWANE do promienia heksa (HEX_R z hexutil.ts).
 * Konwencja: N = -z, E = +x (pointy-top); azymut 0 stopni = N, rosnie ku E (z gory po zegarze);
 * x = r*sin(az), z = -r*cos(az). Kolejne assety DOKLADAJA SIE do wolnych sektorow — srodek
 * heksa zostaje pusty pod budynek (farma/zagroda).
 */
export const PASTWISKO_LAYOUT = {
  /** Odniesienie: mnoz x/z przez HEX_R uzywany w scenie. */
  hexR: 1.0,
  /** REZERWA pod budynek: okrag w srodku heksa, promien 0.40 (40% srednicy heksa). */
  budynek: { x: 0, z: 0, r: 0.40 },
  /** Pierscien dekoracji: zwierzeta wylacznie w r 0.50..0.80 (za strefa budynku, przed krawedzia). */
  pierscien: { rMin: 0.50, rMax: 0.80 },
  /** Sektory katowe (azymuty w stopniach). */
  sektory: {
    krowy: { azOd: -25, azDo: 70, opis: 'N-NE' },
    lama:  { azOd: 70, azDo: 120, opis: 'E' },
    owce:  { azOd: 155, azDo: 250, opis: 'S-SW' },
    wolny: { azOd: 250, azDo: 335, opis: 'W-NW — rezerwa na przyszle assety (plot, poidlo, stog)' },
  },
  /** Sloty zwierzat (x,z znormalizowane; rotY = rotation.y figury). */
  sloty: {
    krowaA: { ...az(8, 0.60), rotY: 2.25, poza: 'pasaca', wariant: 'lacata' },
    krowaB: { ...az(47, 0.67), rotY: -0.55, poza: 'stojaca', wariant: 'brazowa' },
    lama:   { ...az(94, 0.63), rotY: 0.35 },
    owcaA:  { ...az(196, 0.62), rotY: -1.95, poza: 'stojaca', wariant: 'biala' },
    owcaB:  { ...az(233, 0.58), rotY: 2.75, poza: 'skubiaca', wariant: 'czarna' },
  },
} as const;

/** Sklada komplet zwierzat pastwiska wg PASTWISKO_LAYOUT (bez budynku — srodek zostaje wolny). */
export function buildPastwiskoZwierzeta(hexR: number = PASTWISKO_LAYOUT.hexR): THREE.Group {
  const g = new THREE.Group();
  const L = PASTWISKO_LAYOUT;
  const put = (fig: THREE.Group, slot: { x: number; z: number; rotY: number }): void => {
    fig.position.set(slot.x * hexR, 0, slot.z * hexR);
    fig.rotation.y = slot.rotY;
    g.add(fig);
  };
  put(buildKrowa({ poza: 'pasaca', wariant: 'lacata' }), L.sloty.krowaA);
  put(buildKrowa({ poza: 'stojaca', wariant: 'brazowa' }), L.sloty.krowaB);
  put(buildLama(), L.sloty.lama);
  put(buildOwca({ poza: 'stojaca', wariant: 'biala' }), L.sloty.owcaA);
  put(buildOwca({ poza: 'skubiaca', wariant: 'czarna' }), L.sloty.owcaB);
  return g;
}

/** Złoże bydła (surowe, przed ulepszeniem): 2 krowy w slotach krowaA/krowaB — środek wolny. */
export function buildZlozeKrowy(hexR: number = PASTWISKO_LAYOUT.hexR): THREE.Group {
  const g = new THREE.Group();
  const L = PASTWISKO_LAYOUT;
  const put = (fig: THREE.Group, slot: { x: number; z: number; rotY: number }): void => {
    fig.position.set(slot.x * hexR, 0, slot.z * hexR);
    fig.rotation.y = slot.rotY;
    g.add(fig);
  };
  put(buildKrowa({ poza: 'pasaca', wariant: 'lacata' }), L.sloty.krowaA);
  put(buildKrowa({ poza: 'stojaca', wariant: 'brazowa' }), L.sloty.krowaB);
  return g;
}

/** Złoże owiec (surowe, przed ulepszeniem): 2 owce w slotach owcaA/owcaB — środek wolny. */
export function buildZlozeOwce(hexR: number = PASTWISKO_LAYOUT.hexR): THREE.Group {
  const g = new THREE.Group();
  const L = PASTWISKO_LAYOUT;
  const put = (fig: THREE.Group, slot: { x: number; z: number; rotY: number }): void => {
    fig.position.set(slot.x * hexR, 0, slot.z * hexR);
    fig.rotation.y = slot.rotY;
    g.add(fig);
  };
  put(buildOwca({ poza: 'stojaca', wariant: 'biala' }), L.sloty.owcaA);
  put(buildOwca({ poza: 'skubiaca', wariant: 'czarna' }), L.sloty.owcaB);
  return g;
}
