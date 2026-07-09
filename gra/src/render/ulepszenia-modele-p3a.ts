/**
 * ulepszenia-modele-p3a.ts — ULEPSZENIA TERENU, PARTIA 3A: osady produkcyjne
 * w stylu Roblox (klockowate boxy, zywe plaskie kolory, MeshLambert flatShading,
 * zero tekstur, czytelne z lotu ptaka — kamera izo ~52 stopnie od S).
 *
 * MODELE (tri: box=12, cylinder6=24, cone4=8, cone5=10, cone6=12):
 *  - buildWyrab()          372 tri (stare rbxWyrab 136) — las w trakcie scinki:
 *      pienki z jasnym przekrojem, powalony pien z odziomkiem, KOZIOL z balem
 *      i pila (stanowisko drwala), sterta chrustu, pieniek z siekiera, szczapy.
 *      ODROZNIALNY od tartaku z P2 (tartak = przetwornia: wiata + sztaple desek;
 *      wyrab = surowa wycinka, zero desek).
 *  - buildObozLowiecki()   398 tri (stare 96) — tipi ze skor (stozek 5-katny,
 *      lata, zerdzie), wedzarnia z rybami i polciem nad zarem, tarcza-cel ze
 *      strzalami, ognisko z klockowym dymem (3 chmurki-boxy coraz wieksze).
 *  - buildGlinianka()      396 tri (stare 164) — wykop: obrzeze ziemne + 3 tarasy
 *      gliny (gradient ciemna->jasna ku dołowi), oczko wody na dnie, taczka,
 *      2 palety cegiel schnacych rzedami, mini-piec z zarem w czelusci i dymkiem.
 *  - buildWarzelniaSoli()  332 tri (stare 152) — 3 panwie odparowujace w luku
 *      (3 stadia/3 odcienie bieli: solanka->sol mokra->czysta biel), chatka
 *      warzelni z kominem i dymem, 2 stozki soli, worki, studnia + rynna solanki.
 *  - buildLodzieRybackie() 384 tri (stare 92) — NAKLADKA NA HEKS WODY (Wybrzeze):
 *      2 lodki (kadlub + dziob/rufa skosne, maszt, zwiniety zagiel na bomie),
 *      pomost na palach (pale wystaja nad poklad), sieci na palach, skrzynka ryb,
 *      boja. Kadluby plywaja 0.015 nad y=0; CALA geometria y>=0 — grupa laduje
 *      na powierzchni heksa jak kazde ulepszenie (main.ts improvementMeshPlacement:
 *      terrainTopY+0.01; dla Wybrzeza to poziom tafli — tak samo siedzialo stare
 *      rbxLodzie z kadlubem na y 0.02).
 *  - buildStadnina()      1176 tri (stare = alias bydla 408) — WLASNY model:
 *      mini-stajnia W SRODKU (strefa budynku r 0.40, dach deskowy — odrozn. od
 *      czerwonej stodoly farmy), zagroda-korral (5 przesel + brama) w sektorze
 *      E-S, 2 KONIE z kon-nowy-model.ts BEZ jezdzca (kasztan z jasna grzywa +
 *      siwek; skala 0.56, rozne rotY), poidlo, stog siana.
 *      UWAGA ODSTEPSTWO: kon = 380 tri/szt (model zatwierdzony w render-kon)
 *      => 2 konie = 760 tri i heks przekracza budzet 400. Wariant oszczedny:
 *      1 kon (~800 tri/heks) lub konie w LOD-lite — decyzja MASTERA.
 *
 * KONWENCJE (zgodne z pastwisko-modele.ts / ulepszenia-modele-p2.ts):
 *  - spod modelu na y=0 (powierzchnia heksa), przod = +x, obrot figury = rotation.y,
 *  - wspolrzedne znormalizowane do HEX_R=1 (hexutil.ts),
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az),
 *  - regula stycznej: rotY = -az(rad) ustawia dluga os (+x) stycznie do pierscienia,
 *  - fronty budynkow ku S-SE (kamera gry) przez rotY z ULEPSZENIA_P3A_LAYOUT.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/ulepszenia-modele-p3a.ts; obok potrzebny
 *     gra/src/render/kon-nowy-model.ts (import buildHorse; gdy INTEGRATOR wklei
 *     nowego konia do units.ts — zmienic import na './units').
 *  2. render/robloxImprovements.ts (registry BUILDERS ~linia 376):
 *       import { buildWyrab, buildObozLowiecki, buildGlinianka, buildWarzelniaSoli,
 *                buildLodzieRybackie, buildStadnina, ULEPSZENIA_P3A_LAYOUT }
 *         from './ulepszenia-modele-p3a';
 *       const L3 = ULEPSZENIA_P3A_LAYOUT;
 *       wyrab:           g => { const m = buildWyrab(); m.rotation.y = L3.wyrab.budynek.rotY; g.add(m); },
 *       oboz_lowiecki:   g => { const m = buildObozLowiecki(); m.rotation.y = L3.obozLowiecki.budynek.rotY; g.add(m); },
 *       glinianka:       g => { const m = buildGlinianka(); m.rotation.y = L3.glinianka.budynek.rotY; g.add(m); },
 *       warzelnia_soli:  g => { const m = buildWarzelniaSoli(); m.rotation.y = L3.warzelniaSoli.budynek.rotY; g.add(m); },
 *       lodzie_rybackie: g => { const m = buildLodzieRybackie(); m.rotation.y = L3.lodzieRybackie.budynek.rotY; g.add(m); },
 *       stadnina:        g => { g.add(buildStadnina()); },   // dotad: rbxBydlo (krowy!)
 *     (stare rbxWyrab/rbxObozLowiecki/rbxGlinianka/rbxWarzelniaSoli/rbxLodzie — do wycofania).
 *  3. Ikona wyrebu (main.ts spawnClearingMesh ~4266) uzywa klucza 'wyrab' — po
 *     wpieciu dostanie nowy model automatycznie (bez zmian w main.ts).
 */
import * as THREE from 'three';
import { buildHorse } from './kon-nowy-model';

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

/** Walec (seg=6 domyslnie — klockowy szesciokat w stylu partii 1/2). */
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
  cx: number, cy: number, cz: number, m: THREE.Material, seg = 4, ry = 0,
): THREE.Mesh {
  const mesh = new THREE.Mesh(new THREE.ConeGeometry(r, h, seg), m);
  mesh.position.set(cx, cy, cz);
  if (ry) mesh.rotation.y = ry;
  mesh.castShadow = true;
  g.add(mesh);
  return mesh;
}

const azXZ = (deg: number, r: number): { x: number; z: number } => ({
  x: r * Math.sin((deg * Math.PI) / 180),
  z: -r * Math.cos((deg * Math.PI) / 180),
});
const tangRotY = (deg: number): number => (-deg * Math.PI) / 180;

/** Wspolna paleta partii 3A (jasny Roblox, spojna z P2). */
const P = {
  drewno: 0xc98a4b, drewnoDk: 0x8a5a2e, drewnoC: 0x6b4423, bal: 0xcd853f,
  drewnoSwieze: 0xe8b46b,
  sciana: 0xd9a05b, bialy: 0xf7f4ea, cien: 0x4a2f16, ciemneDrzwi: 0x7a4a22,
  kamien: 0x9aa5b1, kamienDk: 0x717d89, czern: 0x14100b, stal: 0xd7dde2,
  siano: 0xf0c34e, ziemia: 0x8a6a45, woda: 0x4ab6e8, plomien: 0xffc02e,
  ogien: 0xff6b2e, dym: 0xd8d8d4, dymDk: 0xbdbdb8,
  skora: 0xc98a4b, skoraDk: 0xa8663a, skoraHi: 0xdba76b,
  ryba: 0x7fc4d8, rybaDk: 0x5a9db3, mieso: 0xc4553a,
  glina: 0xe07830, glinaDk: 0xc9652a, glinaHi: 0xf0924a, cegla: 0xd96a3b,
  sol: 0xffffff, solSrednia: 0xf0ede2, solMokra: 0xdcd8c8, solanka: 0xbfe4f0,
  worek: 0xe8d9b8, zagiel: 0xf7f4ea, siec: 0x9a8a68, dachDeska: 0xa46a38,
  konKasztan: 0x9a5230, konKasztanGrzywa: 0xe8d9b8, konSiwy: 0xd8d2c4, konSiwyGrzywa: 0x8f8a7e,
} as const;

// =========================== WYRAB (oboz drwala) ===========================
export function buildWyrab(): THREE.Group {
  const g = new THREE.Group();
  const balM = mat(P.bal), przekrojM = mat(P.drewnoSwieze), koraM = mat(P.drewnoDk),
    ciemnyM = mat(P.drewnoC), stalM = mat(P.stal), galazM = mat(0x9a6a3a);

  // pienki po wycince (kora + jasny przekroj: splaszczony stozek 6-katny = 12 tri)
  for (const [px, pz, r, h] of [[-0.36, -0.20, 0.075, 0.10], [-0.10, -0.50, 0.062, 0.085], [-0.58, 0.16, 0.058, 0.075]] as const) {
    CYL(g, r, r * 1.12, h, px, h / 2, pz, koraM);
    CONE(g, r * 0.95, 0.014, px, h + 0.007, pz, przekrojM, 6);
  }
  // powalony pien (lezy na NW) + kikut galezi + jasny przekroj odziomka
  const pien = new THREE.Group();
  CYL(pien, 0.068, 0.082, 0.72, 0, 0, 0, koraM, 6, 0, 0, Math.PI / 2);
  const odz = new THREE.Mesh(new THREE.ConeGeometry(0.085, 0.016, 6), przekrojM);
  odz.position.set(-0.368, 0, 0);
  odz.rotation.z = Math.PI / 2;
  odz.castShadow = true;
  pien.add(odz);
  B(pien, 0.16, 0.045, 0.045, 0.18, 0.07, 0.02, koraM, 0, 0, 0.5);
  pien.position.set(-0.16, 0.078, -0.35);
  pien.rotation.y = 0.62;
  g.add(pien);
  // KOZIOL z balem w polowie przerzynania — stanowisko drwala (przod SE)
  const koziol = new THREE.Group();
  for (const kx of [-0.14, 0.14] as const) {
    B(koziol, 0.035, 0.26, 0.035, kx, 0.125, 0.055, ciemnyM, 0.5, 0, 0);
    B(koziol, 0.035, 0.26, 0.035, kx, 0.125, -0.055, ciemnyM, -0.5, 0, 0);
  }
  CYL(koziol, 0.058, 0.058, 0.52, 0, 0.235, 0, balM, 6, 0, 0, Math.PI / 2);
  B(koziol, 0.014, 0.17, 0.05, 0.07, 0.29, 0, stalM, 0, 0, 0.08);   // pila wbita od gory
  B(koziol, 0.11, 0.028, 0.028, 0.07, 0.385, 0, ciemnyM);           // uchwyt pily
  koziol.position.set(0.30, 0, 0.22);
  koziol.rotation.y = 0.55;
  g.add(koziol);
  // sterta galezi (chrust na krzyz)
  const sterta = new THREE.Group();
  B(sterta, 0.42, 0.030, 0.030, 0, 0.018, 0.02, galazM, 0, 0.28, 0);
  B(sterta, 0.38, 0.028, 0.028, 0.02, 0.042, -0.02, galazM, 0, -0.35, 0);
  B(sterta, 0.40, 0.028, 0.028, -0.02, 0.068, 0.01, galazM, 0, 0.62, 0);
  B(sterta, 0.32, 0.025, 0.025, 0.02, 0.092, 0.01, galazM, 0, 0.1, 0);
  sterta.position.set(-0.30, 0, 0.50);
  sterta.rotation.y = -0.3;
  g.add(sterta);
  // pieniek roboczy z wbita siekiera + szczapy
  CYL(g, 0.072, 0.080, 0.13, 0.54, 0.065, -0.22, koraM);
  B(g, 0.02, 0.18, 0.02, 0.58, 0.21, -0.18, ciemnyM, 0.25, 0, -0.5);   // trzonek
  B(g, 0.055, 0.055, 0.016, 0.525, 0.155, -0.215, stalM, 0.25, 0, 0);  // ostrze
  B(g, 0.055, 0.045, 0.14, 0.40, 0.0225, -0.02, balM, 0, 0.4, 0);      // szczapy
  B(g, 0.05, 0.04, 0.13, 0.48, 0.02, 0.06, balM, 0, -0.25, 0);
  return g; // 372 tri
}

// =========================== OBOZ LOWIECKI =================================
export function buildObozLowiecki(): THREE.Group {
  const g = new THREE.Group();
  const skoraM = mat(P.skora), skoraHiM = mat(P.skoraHi),
    drewnoM = mat(P.drewnoDk), ciemnyM = mat(P.drewnoC), czernM = mat(P.czern),
    kamienM = mat(P.kamienDk), ogienM = mat(P.ogien), plomienM = mat(P.plomien),
    dymM = mat(P.dym), dymDkM = mat(P.dymDk), rybaM = mat(P.ryba), miesoM = mat(P.mieso),
    bialyM = mat(P.bialy), celM = mat(0xd93a2b);

  // TIPI ze skor (w glebi, -z) — stozek 5-katny + lata + ciemne wejscie od +x
  const tipi = new THREE.Group();
  CONE(tipi, 0.30, 0.46, 0, 0.23, 0, skoraM, 5, 0.3);
  B(tipi, 0.10, 0.13, 0.09, 0.175, 0.075, 0.04, czernM, 0, 0.32, 0);        // wejscie
  B(tipi, 0.015, 0.20, 0.015, 0.045, 0.50, 0.02, drewnoM, 0.35, 0, 0.30);   // zerdzie
  B(tipi, 0.015, 0.20, 0.015, -0.02, 0.50, -0.045, drewnoM, -0.40, 0, -0.22);
  B(tipi, 0.015, 0.19, 0.015, -0.03, 0.495, 0.045, drewnoM, 0.30, 0, -0.35);
  B(tipi, 0.09, 0.11, 0.012, -0.10, 0.20, 0.155, skoraHiM, 0.42, -0.55, 0); // lata skory
  tipi.position.set(-0.30, 0, -0.28);
  g.add(tipi);
  // WEDZARNIA: rama z 2 poprzeczkami — ryby u gory, polec nizej, zar pod spodem
  const wedz = new THREE.Group();
  B(wedz, 0.032, 0.32, 0.032, 0, 0.16, 0.15, drewnoM);
  B(wedz, 0.032, 0.32, 0.032, 0, 0.16, -0.15, drewnoM);
  B(wedz, 0.026, 0.026, 0.34, 0, 0.30, 0, ciemnyM);
  B(wedz, 0.026, 0.026, 0.34, 0, 0.185, 0, ciemnyM);
  B(wedz, 0.022, 0.105, 0.05, 0, 0.245, 0.085, rybaM, 0, 0, 0.14);   // ryby
  B(wedz, 0.022, 0.10, 0.048, 0, 0.248, -0.005, rybaM, 0, 0, -0.10);
  B(wedz, 0.055, 0.10, 0.038, 0, 0.132, -0.09, miesoM, 0, 0, 0.06);  // polec miesa
  B(wedz, 0.07, 0.035, 0.10, 0, 0.0175, 0.01, ogienM, 0, 0.4, 0);    // zar
  B(wedz, 0.05, 0.03, 0.05, 0.045, 0.015, -0.075, kamienM, 0, 0.5, 0);
  wedz.position.set(0.50, 0, -0.30);
  wedz.rotation.y = 0.55;
  g.add(wedz);
  // TARCZA-CEL ze strzalami (tarcza ku ognisku/srodkowi)
  const cel = new THREE.Group();
  B(cel, 0.035, 0.16, 0.035, 0, 0.08, 0, drewnoM);
  CYL(cel, 0.11, 0.11, 0.035, 0, 0.24, 0, bialyM, 6, Math.PI / 2, 0, 0);
  B(cel, 0.075, 0.075, 0.042, 0, 0.24, 0, celM, 0, 0, Math.PI / 4);  // czerwony diament
  for (const [ax, ay, rx, rz] of [[-0.035, 0.275, 0.35, 0.3], [0.04, 0.215, -0.2, -0.35], [0.005, 0.25, 0.1, -0.6]] as const) {
    B(cel, 0.016, 0.016, 0.17, ax, ay, 0.09, mat(P.drewno), rx, 0, rz); // strzaly
  }
  cel.position.set(-0.52, 0, 0.34);
  cel.rotation.y = 2.65;
  g.add(cel);
  // OGNISKO z klockowym dymem — 3 chmurki-boxy rozdzielone, coraz wieksze
  const ogn = new THREE.Group();
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    B(ogn, 0.05, 0.04, 0.05, Math.cos(a) * 0.10, 0.02, Math.sin(a) * 0.10, kamienM, 0, a, 0);
  }
  B(ogn, 0.16, 0.032, 0.032, 0, 0.03, 0.01, ciemnyM, 0, 0.5, 0);     // polana
  B(ogn, 0.15, 0.030, 0.030, 0, 0.032, -0.01, ciemnyM, 0, -0.6, 0);
  CONE(ogn, 0.055, 0.11, 0, 0.095, 0, ogienM, 4, 0.2);               // plomien
  CONE(ogn, 0.03, 0.07, 0, 0.10, 0, plomienM, 4, 0.6);
  B(ogn, 0.055, 0.05, 0.055, 0.02, 0.185, 0.015, dymDkM, 0.2, 0.5, 0.15);
  B(ogn, 0.075, 0.068, 0.075, 0.035, 0.275, 0.035, dymM, -0.15, 0.2, 0.3);
  B(ogn, 0.096, 0.086, 0.096, 0.05, 0.385, 0.05, dymM, 0.25, 0.7, -0.2);
  ogn.position.set(0.20, 0, 0.40);
  g.add(ogn);
  return g; // 398 tri
}

// ============================== GLINIANKA ==================================
export function buildGlinianka(): THREE.Group {
  const g = new THREE.Group();
  const glinaM = mat(P.glina), glinaDkM = mat(P.glinaDk), glinaHiM = mat(P.glinaHi),
    ziemiaM = mat(P.ziemia), wodaM = mat(P.woda), drewnoM = mat(P.drewnoDk),
    ceglaM = mat(P.cegla), czernM = mat(P.czern), kamienM = mat(P.kamien);

  // WYKOP: obrzeze ziemne + dno gliny + 3 WYRAZNE tarasy (gradient ku dołowi)
  CYL(g, 0.54, 0.58, 0.045, -0.06, 0.0225, -0.04, ziemiaM);
  CYL(g, 0.45, 0.45, 0.028, -0.06, 0.059, -0.02, glinaDkM);
  B(g, 0.64, 0.09, 0.19, -0.06, 0.105, -0.35, glinaDkM, 0, 0.08, 0);   // taras gorny (ciemny)
  B(g, 0.52, 0.068, 0.15, -0.09, 0.086, -0.165, glinaM, 0, -0.05, 0);  // taras srodkowy
  B(g, 0.40, 0.044, 0.12, -0.04, 0.069, 0.0, glinaHiM, 0, 0.10, 0);    // taras dolny (jasny)
  CYL(g, 0.13, 0.13, 0.016, -0.02, 0.075, 0.185, wodaM);               // oczko wody na dnie
  B(g, 0.085, 0.05, 0.07, -0.33, 0.095, 0.10, glinaM, 0, 0.4, 0);      // gruda urobku
  // TACZKA z glina (na obrzezu, kolem ku kamerze)
  const taczka = new THREE.Group();
  B(taczka, 0.15, 0.075, 0.115, 0, 0.085, 0, mat(P.drewno));
  B(taczka, 0.11, 0.05, 0.085, 0, 0.135, 0, glinaM, 0, 0.3, 0);        // glina w korycie
  CYL(taczka, 0.05, 0.05, 0.035, 0.105, 0.05, 0, mat(P.drewnoC), 6, Math.PI / 2, 0, 0);
  B(taczka, 0.20, 0.022, 0.022, -0.115, 0.075, 0.045, drewnoM, 0, 0, -0.12); // dyszle
  B(taczka, 0.20, 0.022, 0.022, -0.115, 0.075, -0.045, drewnoM, 0, 0, -0.12);
  B(taczka, 0.022, 0.055, 0.022, -0.09, 0.028, 0, drewnoM);            // nozka
  taczka.position.set(0.42, 0, 0.34);
  taczka.rotation.y = -2.35;
  g.add(taczka);
  // FORMY CEGIEL schnace rzedami (2 palety po 4 cegly, przy E)
  for (const [px, pz, ry] of [[0.47, -0.02, 0.30], [0.40, -0.23, 0.18]] as const) {
    const paleta = new THREE.Group();
    B(paleta, 0.20, 0.022, 0.15, 0, 0.011, 0, drewnoM);
    for (let i = 0; i < 4; i++) {
      B(paleta, 0.052, 0.038, 0.11, -0.069 + i * 0.046, 0.041, 0, i % 2 ? ceglaM : glinaHiM);
    }
    paleta.position.set(px, 0, pz);
    paleta.rotation.y = ry;
    g.add(paleta);
  }
  // MINI-PIEC do wypalu (czelusc z zarem ku SSE po zlozeniu z layout rotY 0.20)
  const piec = new THREE.Group();
  B(piec, 0.17, 0.13, 0.15, 0, 0.065, 0, kamienM);
  B(piec, 0.13, 0.075, 0.11, 0, 0.16, 0, ceglaM, 0, 0.25, 0);          // kopulka
  B(piec, 0.02, 0.075, 0.062, 0.082, 0.05, 0, czernM);                 // czelusc
  B(piec, 0.014, 0.05, 0.04, 0.088, 0.048, 0, mat(P.plomien));         // zar
  B(piec, 0.035, 0.10, 0.035, -0.03, 0.22, -0.02, kamienM);            // komin
  B(piec, 0.055, 0.05, 0.055, -0.02, 0.30, -0.01, mat(P.dym), 0.3, 0.5, 0.2);
  piec.position.set(-0.50, 0, 0.30);
  piec.rotation.y = -1.25;
  g.add(piec);
  return g; // 396 tri
}

// ============================ WARZELNIA SOLI ===============================
export function buildWarzelniaSoli(): THREE.Group {
  const g = new THREE.Group();
  const ramaM = mat(P.drewnoC), solankaM = mat(P.solanka), solMokraM = mat(P.solMokra),
    solSrM = mat(P.solSrednia), solM = mat(P.sol), drewnoM = mat(P.drewnoDk),
    scianaM = mat(P.sciana), dachM = mat(P.dachDeska), workM = mat(P.worek),
    dymM = mat(P.dym), czernM = mat(P.czern);

  // 3 PANWIE w luku przed chatka — kolejne stadia odparowania (3 odcienie bieli)
  const panwie = [
    { az: 96, r: 0.52, tresc: solankaM, poziom: 0.052 },   // swieza solanka
    { az: 148, r: 0.55, tresc: solMokraM, poziom: 0.058 }, // sol mokra
    { az: 197, r: 0.52, tresc: solM, poziom: 0.064 },      // czysta biel
  ];
  for (const pw of panwie) {
    const p = new THREE.Group();
    B(p, 0.30, 0.075, 0.24, 0, 0.0375, 0, ramaM);
    B(p, 0.26, 0.03, 0.20, 0, pw.poziom + 0.015, 0, pw.tresc);
    const c = azXZ(pw.az, pw.r);
    p.position.set(c.x, 0, c.z);
    p.rotation.y = tangRotY(pw.az);
    g.add(p);
  }
  // CHATKA WARZELNI z kominem i dymem (N od srodka), drzwi ku S-SE
  const chata = new THREE.Group();
  B(chata, 0.40, 0.05, 0.30, 0, 0.025, 0, mat(P.kamien));              // podmurowka
  B(chata, 0.36, 0.20, 0.26, 0, 0.15, 0, scianaM);
  B(chata, 0.42, 0.04, 0.19, 0, 0.305, 0.075, dachM, 0.62, 0, 0);      // polacie
  B(chata, 0.42, 0.04, 0.19, 0, 0.305, -0.075, dachM, -0.62, 0, 0);
  B(chata, 0.44, 0.045, 0.08, 0, 0.365, 0, mat(P.drewnoC));            // kalenica
  B(chata, 0.02, 0.13, 0.11, 0.185, 0.115, 0, mat(P.ciemneDrzwi));     // drzwi (+x)
  B(chata, 0.06, 0.16, 0.06, -0.10, 0.40, -0.05, mat(P.kamienDk));     // komin
  B(chata, 0.075, 0.065, 0.075, -0.098, 0.515, -0.048, dymM, 0.2, 0.4, 0.1); // dym
  B(chata, 0.092, 0.078, 0.092, -0.085, 0.60, -0.03, dymM, -0.1, 0.9, 0.25);
  B(chata, 0.022, 0.09, 0.09, 0.185, 0.13, 0.09, czernM, 0, 0, 0);     // czeluc paleniska
  chata.position.set(-0.02, 0, -0.34);
  chata.rotation.y = -1.05;
  g.add(chata);
  // STOZKI SOLI (zbiory) + WORKI przy chatce
  CONE(g, 0.115, 0.19, 0.38, 0.095, -0.26, solM, 5, 0.2);
  CONE(g, 0.085, 0.13, 0.55, 0.065, -0.08, solSrM, 5, 0.5);
  for (const [wx, wz, ry] of [[-0.42, 0.16, 0.3], [-0.34, 0.26, -0.2], [-0.45, 0.33, 0.7]] as const) {
    B(g, 0.09, 0.10, 0.09, wx, 0.05, wz, workM, 0, ry, 0);
    B(g, 0.05, 0.03, 0.05, wx, 0.115, wz, mat(0xd4c49a), 0, ry + 0.3, 0);
  }
  // STUDNIA solankowa + rynna pochyla ku panwiom
  CYL(g, 0.075, 0.085, 0.10, 0.42, 0.05, -0.52, mat(P.kamienDk));
  B(g, 0.34, 0.028, 0.05, 0.30, 0.115, -0.36, drewnoM, 0.12, 0.75, 0);
  B(g, 0.022, 0.10, 0.022, 0.175, 0.05, -0.24, drewnoM);
  return g; // 332 tri
}

// =========================== LODZIE RYBACKIE ===============================
export function buildLodzieRybackie(): THREE.Group {
  const g = new THREE.Group();
  const kadlubM = mat(P.drewnoDk), kadlubBM = mat(P.drewnoC), wnetrzeM = mat(P.cien),
    masztM = mat(P.drewnoC), zagielM = mat(P.zagiel), drewnoM = mat(P.drewno),
    palM = mat(P.drewnoC), siecM = mat(P.siec), rybaM = mat(P.ryba), bojaM = mat(0xd93a2b);

  // LODKA A (wieksza, przy pomoscie): kadlub + dziob/rufa skosne + zwiniety zagiel
  const lodkaA = new THREE.Group();
  B(lodkaA, 0.34, 0.075, 0.15, 0, 0.052, 0, kadlubM);
  B(lodkaA, 0.11, 0.07, 0.11, 0.185, 0.068, 0, kadlubM, 0, 0, 0.38);   // dziob zadarty
  B(lodkaA, 0.07, 0.065, 0.12, -0.185, 0.058, 0, kadlubM, 0, 0, -0.35); // rufa
  B(lodkaA, 0.26, 0.02, 0.10, 0, 0.095, 0, wnetrzeM);                  // wnetrze
  B(lodkaA, 0.025, 0.34, 0.025, 0.04, 0.26, 0, masztM);                // maszt
  B(lodkaA, 0.30, 0.05, 0.045, 0.02, 0.36, 0, zagielM, 0, 0, 0.06);    // zwiniety zagiel
  B(lodkaA, 0.34, 0.022, 0.022, 0.02, 0.325, 0, drewnoM);              // bom
  lodkaA.position.set(0.10, 0.015, 0.30);
  lodkaA.rotation.y = 0.35;
  g.add(lodkaA);
  // LODKA B (mniejsza) + wioslo oparte o burte
  const lodkaB = new THREE.Group();
  B(lodkaB, 0.26, 0.065, 0.12, 0, 0.045, 0, kadlubBM);
  B(lodkaB, 0.09, 0.06, 0.09, 0.145, 0.056, 0, kadlubBM, 0, 0, 0.34);
  B(lodkaB, 0.20, 0.018, 0.08, 0, 0.082, 0, wnetrzeM);
  B(lodkaB, 0.02, 0.26, 0.02, -0.02, 0.20, 0, masztM);
  B(lodkaB, 0.22, 0.04, 0.038, -0.03, 0.28, 0, zagielM, 0, 0, -0.05);
  B(lodkaB, 0.24, 0.016, 0.05, 0.06, 0.05, 0.09, drewnoM, 0, 0.3, 0.55); // wioslo
  lodkaB.position.set(-0.38, 0.015, 0.42);
  lodkaB.rotation.y = -0.65;
  g.add(lodkaB);
  // POMOST na palach — pale wystaja PONAD poklad (czytelnosc), 3 pary
  const pomost = new THREE.Group();
  for (const [px, pz] of [[-0.075, 0.16], [0.075, 0.16], [-0.075, -0.07], [0.075, -0.07], [-0.075, -0.30], [0.075, -0.30]] as const) {
    B(pomost, 0.034, 0.13, 0.034, px, 0.065, pz, palM);
  }
  B(pomost, 0.15, 0.024, 0.60, 0, 0.095, -0.07, drewnoM);              // pokladnica
  B(pomost, 0.17, 0.013, 0.055, 0, 0.113, 0.10, kadlubBM);             // deska poprzeczna
  pomost.position.set(-0.02, 0, -0.16);
  pomost.rotation.y = 0.22;
  g.add(pomost);
  // SIECI rozwieszone na palach (suszenie, NE)
  const sieci = new THREE.Group();
  B(sieci, 0.035, 0.30, 0.035, -0.16, 0.15, 0, palM);
  B(sieci, 0.035, 0.30, 0.035, 0.16, 0.15, 0, palM);
  B(sieci, 0.36, 0.022, 0.022, 0, 0.285, 0, drewnoM);
  B(sieci, 0.30, 0.16, 0.014, 0, 0.195, 0.012, siecM, 0.16, 0, 0.05);  // plachta
  B(sieci, 0.13, 0.10, 0.012, -0.075, 0.07, 0.015, siecM, -0.1, 0, -0.14); // zwisy
  B(sieci, 0.09, 0.08, 0.012, 0.09, 0.065, -0.01, siecM, 0.12, 0, 0.1);
  sieci.position.set(0.34, 0.02, -0.40);
  sieci.rotation.y = -0.55;
  g.add(sieci);
  // skrzynka ryb na pomoscie + boja na wodzie
  B(g, 0.11, 0.05, 0.08, -0.095, 0.132, -0.32, kadlubBM, 0, 0.25, 0);
  B(g, 0.032, 0.028, 0.02, -0.11, 0.167, -0.325, rybaM, 0, 0.5, 0);
  B(g, 0.03, 0.026, 0.018, -0.08, 0.164, -0.305, rybaM, 0, -0.3, 0);
  B(g, 0.06, 0.055, 0.06, 0.52, 0.03, 0.52, bojaM, 0, 0.4, 0);         // boja
  B(g, 0.014, 0.07, 0.014, 0.52, 0.09, 0.52, masztM);
  return g; // 384 tri
}

// =============================== STADNINA ==================================
export function buildStadnina(): THREE.Group {
  const g = new THREE.Group();
  const scianaM = mat(P.sciana), dachM = mat(P.dachDeska), ciemnyM = mat(P.drewnoC),
    bialyM = mat(P.bialy), drzwiM = mat(P.ciemneDrzwi), sianoM = mat(P.siano),
    palM = mat(P.drewnoDk), ryglM = mat(P.drewno), wodaM = mat(P.woda);

  // MINI-STAJNIA w srodku (dach deskowy — odroznia od czerwonej stodoly farmy)
  const stajnia = new THREE.Group();
  B(stajnia, 0.46, 0.05, 0.34, 0, 0.025, 0, mat(P.kamien));            // podmurowka
  B(stajnia, 0.42, 0.21, 0.30, 0, 0.155, 0, scianaM);
  B(stajnia, 0.48, 0.042, 0.21, 0, 0.315, 0.083, dachM, 0.60, 0, 0);   // polacie
  B(stajnia, 0.48, 0.042, 0.21, 0, 0.315, -0.083, dachM, -0.60, 0, 0);
  B(stajnia, 0.50, 0.048, 0.09, 0, 0.378, 0, ciemnyM);                 // kalenica
  B(stajnia, 0.02, 0.15, 0.15, 0.212, 0.125, 0, drzwiM);               // wrota (+x)
  B(stajnia, 0.016, 0.045, 0.17, 0.222, 0.175, 0, bialyM);             // nadproze
  B(stajnia, 0.10, 0.085, 0.02, -0.08, 0.20, 0.155, mat(P.cien));      // okno boksu
  B(stajnia, 0.11, 0.095, 0.10, -0.26, 0.048, -0.05, sianoM, 0, 0.3, 0); // snopek
  stajnia.rotation.y = -1.15;   // wrota ku S-SE, w strone korralu
  g.add(stajnia);
  // KORRAL — 5 przesel plotu w sektorze E-S (az 82..186), pierscien r 0.66
  for (const pr of [{ az: 82 }, { az: 108 }, { az: 134 }, { az: 160 }, { az: 186 }]) {
    const seg = new THREE.Group();
    B(seg, 0.035, 0.17, 0.035, -0.165, 0.085, 0, palM);
    B(seg, 0.035, 0.17, 0.035, 0.165, 0.085, 0, palM);
    B(seg, 0.38, 0.028, 0.026, 0, 0.075, 0, ryglM);
    B(seg, 0.38, 0.028, 0.026, 0, 0.135, 0, ryglM);
    const c = azXZ(pr.az, 0.66);
    seg.position.set(c.x, 0, c.z);
    seg.rotation.y = tangRotY(pr.az);
    g.add(seg);
  }
  // brama korralu od strony stajni (SW, otwarta — slupki + belka)
  const brama = new THREE.Group();
  B(brama, 0.045, 0.24, 0.045, -0.10, 0.12, 0, palM);
  B(brama, 0.045, 0.24, 0.045, 0.10, 0.12, 0, palM);
  B(brama, 0.26, 0.035, 0.035, 0, 0.255, 0, ciemnyM);
  const bc = azXZ(213, 0.63);
  brama.position.set(bc.x, 0, bc.z);
  brama.rotation.y = tangRotY(213);
  g.add(brama);
  // 2 KONIE z kon-nowy-model.ts (bez jezdzca; mHarn=null), skala stadniny 0.56
  // (kopyta zostaja na y=0; kon-nowy: przod = -z, wiec rotY wg azymutu lba)
  const kon = (cialoHex: number, grzywaHex: number, az: number, r: number, rotY: number): void => {
    const k = new THREE.Group();
    buildHorse(
      k,
      null as never,
      mat(cialoHex) as unknown as THREE.MeshStandardMaterial,
      mat(grzywaHex) as unknown as THREE.MeshStandardMaterial,
      null, 0, 0,
    );
    k.scale.setScalar(0.56);
    const c = azXZ(az, r);
    k.position.set(c.x, 0, c.z);
    k.rotation.y = rotY;
    g.add(k);
  };
  kon(P.konKasztan, P.konKasztanGrzywa, 90, 0.40, 2.90);   // kasztan skosem, leb ku S-SW
  kon(P.konSiwy, P.konSiwyGrzywa, 152, 0.53, 2.0);         // siwek bokiem, leb ku bramie
  // poidlo + stog siana w zagrodzie
  const poidlo = new THREE.Group();
  B(poidlo, 0.19, 0.065, 0.105, 0, 0.0325, 0, ciemnyM);
  B(poidlo, 0.16, 0.016, 0.078, 0, 0.058, 0, wodaM);
  const pc = azXZ(137, 0.38);
  poidlo.position.set(pc.x, 0, pc.z);
  poidlo.rotation.y = tangRotY(137) + 0.35;
  g.add(poidlo);
  CONE(g, 0.10, 0.16, azXZ(46, 0.47).x, 0.08, azXZ(46, 0.47).z, sianoM, 4, 0.4);
  return g; // 1176 tri (2 konie po 380)
}

// ========================= LAYOUT PARTII 3A ================================
/**
 * Osadzenie na heksie (wspolrzedne znormalizowane do HEX_R):
 * modele-sceny (wyrab/oboz/glinianka/warzelnia/lodzie) maja dekoracje wbudowane —
 * rotY calego modelu ustawia fronty ku S-SE (kamera gry). Stadnina: stajnia
 * W SRODKU (strefa budynku r 0.40 — budynek dominuje), konie/poidlo/stog
 * w pierscieniu zagrody wg slotow ponizej.
 */
export const ULEPSZENIA_P3A_LAYOUT = {
  hexR: 1.0,
  /** Strefa budynku glownego — spojna z PASTWISKO_LAYOUT.budynek (r 0.40). */
  budynekCentrum: { x: 0, z: 0, r: 0.40 },
  wyrab: { budynek: { x: 0, z: 0, rotY: -0.35 } },        // koziol/pila ku SE
  obozLowiecki: { budynek: { x: 0, z: 0, rotY: -0.15 } }, // ognisko+wejscie tipi ku S
  glinianka: { budynek: { x: 0, z: 0, rotY: 0.20 } },     // tarasy ku N, piec/taczka ku S
  warzelniaSoli: { budynek: { x: 0, z: 0, rotY: 0.0 } },  // panwie E-S, chata N
  /** Heks WODY (Wybrzeze): grupa na powierzchni heksa, kadluby plywaja y=0.015. */
  lodzieRybackie: { budynek: { x: 0, z: 0, rotY: 0.15 }, yLift: 0.0 },
  stadnina: {
    stajnia: { x: 0, z: 0, rotY: -1.15 },
    korral: { sektor: { azOd: 82, azDo: 213 }, r: 0.66 },
    konie: [
      { az: 90, r: 0.40, rotY: 2.90, masc: 'kasztan' },
      { az: 152, r: 0.53, rotY: 2.0, masc: 'siwek' },
    ],
    poidlo: { az: 137, r: 0.38 },
    stog: { az: 46, r: 0.47 },
  },
} as const;
