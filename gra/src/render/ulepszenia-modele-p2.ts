/**
 * ulepszenia-modele-p2.ts — ULEPSZENIA TERENU, PARTIA 2: budynki gospodarcze
 * w stylu Roblox (klockowate boxy, zywe plaskie kolory, MeshLambert flatShading,
 * zero tekstur, czytelne z lotu ptaka).
 *
 * MODELE (tri: box=12, cylinder6=24, cone4=8):
 *  - buildFarma({wariant:'pastwisko'})  240 tri — stodola z czerwonym dachem + snopki;
 *      miesci sie w strefie budynku pastwiska (PASTWISKO_LAYOUT.budynek, r 0.40:
 *      dach 0.60 x 0.54 => promien naroza ~0.40).
 *  - buildFarma({wariant:'solo'})       416 tri — pelny heks: stodola (obrocona) +
 *      3 poletka zboza w pierscieniu + strach na wroble + sciezka.
 *  - buildKopalnia()                    300 tri — sztolnia w skalce, stemple+oczep,
 *      tory z wozkiem urobku, brylki rudy, latarnia. Przod (tory) = +x.
 *  - buildKamieniolom()                 264 tri — tarasowe polki skalne, wyciete bloki,
 *      zuraw z blokiem na linie, drabina, gruz. Zuraw od +z, tarasy ku -z.
 *  - buildTartak()                      384 tri — wiata ze sztaplem desek (-z), bal na
 *      kozlach z pila w polowie ciecia (+z), sterta bali (+x), pieniek z siekiera (-x).
 *  - buildZagrodaDodatki()               80 tri — plotek + poidlo + stog siana do
 *      WOLNEGO sektora pastwiska (W-NW 250-335 stopni; PASTWISKO_LAYOUT.sektory.wolny).
 *
 * KONWENCJE (zgodne z pastwisko-modele.ts / styleResources.ts):
 *  - spod modelu na y=0 (powierzchnia heksa), przod = +x, obrot figury = rotation.y,
 *  - wspolrzedne znormalizowane do HEX_R=1 (hexutil.ts) — skala jak zwierzeta partii 1
 *    (stodola ~3x dlugosci krowy),
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az),
 *  - regula stycznej: rotY = -az(rad) ustawia dluga os (+x) stycznie do pierscienia.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/ulepszenia-modele-p2.ts.
 *  2. render/robloxImprovements.ts (registry BUILDERS ~linia 376):
 *       import { buildFarma, buildKopalnia, buildKamieniolom, buildTartak,
 *                buildZagrodaDodatki, ULEPSZENIA_P2_LAYOUT } from './ulepszenia-modele-p2';
 *       farma:       g => { g.add(buildFarma({ wariant: 'solo' })); },
 *       kopalnia:    g => { const m = buildKopalnia(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kopalnia.budynek.rotY; g.add(m); },
 *       popalnia_brazu: jw. (kopalnia),
 *       kamieniolom: g => { const m = buildKamieniolom(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.kamieniolom.budynek.rotY; g.add(m); },
 *       tartak:      g => { const m = buildTartak(); m.rotation.y = ULEPSZENIA_P2_LAYOUT.tartak.budynek.rotY; g.add(m); },
 *     (stare rbxFarma/rbxKopalnia/rbxKamieniolom/rbxTartak — do wycofania).
 *  3. Pastwisko z farma (finalna wizja heksa hodowli):
 *       pastwisko: g => {
 *         const f = buildFarma({ wariant: 'pastwisko' });
 *         f.rotation.y = ULEPSZENIA_P2_LAYOUT.farma.pastwisko.budynek.rotY;
 *         g.add(f, buildPastwiskoZwierzeta(), buildZagrodaDodatki());
 *       },
 *     (import buildPastwiskoZwierzeta z ./pastwisko-modele — partia 1).
 *  4. buildRobloxFoodStack (tamze, ~linia 396): kombinacje farma+bydlo/owce moga
 *     uzywac buildFarma({wariant:'pastwisko'}) w srodku + zwierzeta w pierscieniu
 *     zamiast rbxFarmSettlement.
 */
import * as THREE from 'three';

export type WariantFarmy = 'pastwisko' | 'solo';

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

/** Walec (seg=6 domyslnie — klockowy oktagon w stylu partii 1). */
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

/** Wspolna paleta partii 2 (jasny Roblox). */
const P = {
  drewno: 0xc98a4b, drewnoDk: 0x8a5a2e, drewnoC: 0x6b4423, bal: 0xcd853f,
  dachCzerw: 0xd93a2b, dachCzerwDk: 0xb02a1f,
  sciana: 0xd9a05b, bialy: 0xf7f4ea, cien: 0x4a2f16, ciemneDrzwi: 0x7a4a22,
  kamien: 0x9aa5b1, kamienDk: 0x717d89, kamienHi: 0xb7c0c8, blok: 0xcdd5db,
  czern: 0x14100b, metal: 0x545d66, stal: 0xd7dde2,
  ruda: 0xffa726, siano: 0xf0c34e, ziemia: 0x8a6a45, sciezka: 0xc4a574,
  zboze: 0xe9c34e, zbozeDk: 0xc99f35, woda: 0x4ab6e8, plomien: 0xffc02e,
} as const;

// ============================ FARMA (stodola) ==============================
export function buildFarma(opts: { wariant?: WariantFarmy } = {}): THREE.Group {
  const wariant = opts.wariant ?? 'pastwisko';
  const stodola = new THREE.Group();
  const scianaM = mat(P.sciana), cokolM = mat(P.kamien), dachM = mat(P.dachCzerw),
    dachDkM = mat(P.dachCzerwDk), bialyM = mat(P.bialy), drzwiM = mat(P.ciemneDrzwi),
    cienM = mat(P.cien), sianoM = mat(P.siano);

  B(stodola, 0.56, 0.05, 0.44, 0, 0.025, 0, cokolM);                    // cokol kamienny
  B(stodola, 0.52, 0.24, 0.40, 0, 0.17, 0, scianaM);                    // korpus
  B(stodola, 0.52, 0.10, 0.30, 0, 0.34, 0, scianaM);                    // szczyt dolny
  B(stodola, 0.52, 0.09, 0.10, 0, 0.435, 0, scianaM);                   // szczyt gorny
  B(stodola, 0.60, 0.045, 0.34, 0, 0.378, 0.135, dachM, 0.647, 0, 0);   // polac +z
  B(stodola, 0.60, 0.045, 0.34, 0, 0.378, -0.135, dachM, -0.647, 0, 0); // polac -z
  B(stodola, 0.62, 0.055, 0.115, 0, 0.482, 0, dachDkM);                 // kalenica
  B(stodola, 0.02, 0.17, 0.17, 0.262, 0.135, 0, drzwiM);                // wrota (sciana +x)
  B(stodola, 0.016, 0.21, 0.042, 0.274, 0.135, 0, bialyM, 0.66, 0, 0);  // biale X na wrotach
  B(stodola, 0.016, 0.21, 0.042, 0.274, 0.135, 0, bialyM, -0.66, 0, 0);
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    B(stodola, 0.035, 0.25, 0.035, sx * 0.255, 0.175, sz * 0.195, bialyM); // slupki narozne
  }
  for (const sz of [1, -1] as const) {                                  // okna boczne
    B(stodola, 0.11, 0.10, 0.02, -0.07, 0.19, sz * 0.205, bialyM);
    B(stodola, 0.08, 0.07, 0.022, -0.07, 0.19, sz * 0.212, cienM);
  }
  if (wariant !== 'solo') {
    B(stodola, 0.10, 0.09, 0.10, -0.315, 0.045, 0.10, sianoM, 0, 0.35, 0); // snopki za stodola
    B(stodola, 0.08, 0.07, 0.08, -0.30, 0.035, -0.06, sianoM, 0, -0.2, 0);
    return stodola; // 240 tri
  }

  // ---- WARIANT SOLO: pelny heks ----
  const g = new THREE.Group();
  const L = ULEPSZENIA_P2_LAYOUT.farma.solo;
  stodola.rotation.y = L.budynek.rotY;
  g.add(stodola);
  const ziemiaM = mat(P.ziemia), zbozeM = mat(P.zboze), zbozeDkM = mat(P.zbozeDk),
    palM = mat(P.drewnoDk), sciezkaM = mat(P.sciezka);
  for (const pl of L.poletka) {                                          // poletka zboza
    const p = new THREE.Group();
    B(p, 0.38, 0.035, 0.30, 0, 0.0175, 0, ziemiaM);
    for (let i = 0; i < 3; i++) {
      B(p, 0.34, 0.10, 0.055, 0, 0.067, -0.09 + i * 0.09, i % 2 ? zbozeDkM : zbozeM);
    }
    const c = azXZ(pl.az, pl.r);
    p.position.set(c.x, 0, c.z);
    p.rotation.y = tangRotY(pl.az);
    g.add(p);
  }
  const st = new THREE.Group();                                          // strach na wroble
  B(st, 0.025, 0.30, 0.025, 0, 0.15, 0, palM);
  B(st, 0.025, 0.025, 0.26, 0, 0.235, 0, palM);
  B(st, 0.07, 0.07, 0.065, 0, 0.315, 0, sianoM);
  CONE(st, 0.062, 0.06, 0, 0.38, 0, mat(P.drewnoC), 4, 0.4);
  const sc = azXZ(L.strach.az, L.strach.r);
  st.position.set(sc.x, 0, sc.z);
  st.rotation.y = 0.6;
  g.add(st);
  const pc = azXZ(L.sciezka.az, L.sciezka.r);                            // sciezka od wrot
  const path = B(g, 0.26, 0.018, 0.15, pc.x, 0.009, pc.z, sciezkaM);
  path.rotation.y = Math.PI / 2 - (L.sciezka.az * Math.PI) / 180;
  return g; // 416 tri
}

// ============================ KOPALNIA =====================================
export function buildKopalnia(): THREE.Group {
  const g = new THREE.Group();
  const skalaM = mat(P.kamien), skalaDkM = mat(P.kamienDk), skalaHiM = mat(P.kamienHi);
  const belkaM = mat(P.drewnoDk), belkaCM = mat(P.drewnoC), czernM = mat(P.czern);
  const metalM = mat(P.metal), rudaM = mat(P.ruda), plomienM = mat(P.plomien);

  B(g, 0.52, 0.36, 0.46, -0.10, 0.18, 0, skalaM, 0, 0.12, 0);        // skalka — bryla glowna
  B(g, 0.34, 0.26, 0.36, -0.02, 0.13, 0.24, skalaDkM, 0, 0.55, 0);   // bok +z
  B(g, 0.32, 0.24, 0.34, -0.08, 0.12, -0.26, skalaHiM, 0, -0.4, 0);  // bok -z
  B(g, 0.30, 0.20, 0.26, -0.14, 0.365, -0.02, skalaHiM, 0, 0.3, 0.08); // czapa
  B(g, 0.055, 0.24, 0.055, 0.17, 0.12, 0.115, belkaM);               // portal — stemple
  B(g, 0.055, 0.24, 0.055, 0.17, 0.12, -0.115, belkaM);
  B(g, 0.06, 0.055, 0.31, 0.17, 0.262, 0, belkaCM);                  // oczep
  B(g, 0.02, 0.20, 0.17, 0.15, 0.10, 0, czernM);                     // czarne wejscie
  for (let i = 0; i < 4; i++) {                                      // podklady
    B(g, 0.055, 0.022, 0.17, 0.26 + i * 0.13, 0.011, 0, belkaCM);
  }
  B(g, 0.50, 0.022, 0.026, 0.45, 0.033, 0.055, metalM);              // szyny
  B(g, 0.50, 0.022, 0.026, 0.45, 0.033, -0.055, metalM);
  const wx = 0.56;                                                   // wozek z urobkiem
  CYL(g, 0.045, 0.045, 0.155, wx - 0.052, 0.045, 0, metalM, 6, Math.PI / 2, 0, 0);
  CYL(g, 0.045, 0.045, 0.155, wx + 0.052, 0.045, 0, metalM, 6, Math.PI / 2, 0, 0);
  B(g, 0.17, 0.105, 0.135, wx, 0.14, 0, belkaM);
  B(g, 0.06, 0.05, 0.055, wx - 0.03, 0.20, 0.02, rudaM, 0, 0.3, 0);
  B(g, 0.05, 0.045, 0.05, wx + 0.035, 0.195, -0.025, rudaM, 0, -0.2, 0);
  B(g, 0.085, 0.075, 0.085, 0.30, 0.038, 0.20, rudaM, 0, 0.5, 0);    // brylki przy wejsciu
  B(g, 0.075, 0.065, 0.075, 0.24, 0.033, -0.21, skalaDkM, 0, -0.3, 0);
  B(g, 0.02, 0.15, 0.02, 0.235, 0.075, 0.165, belkaCM);              // latarnia
  B(g, 0.038, 0.05, 0.038, 0.235, 0.155, 0.165, plomienM);
  return g; // 300 tri
}

// ============================ KAMIENIOLOM ==================================
export function buildKamieniolom(): THREE.Group {
  const g = new THREE.Group();
  const kamM = mat(P.kamien), kamDkM = mat(P.kamienDk), kamHiM = mat(P.kamienHi), blokM = mat(P.blok);
  const drewnoM = mat(P.drewnoDk), linaM = mat(0x6b5334);

  CYL(g, 0.58, 0.62, 0.07, 0, 0.035, 0, kamDkM, 6);                  // dno wyrobiska
  B(g, 0.72, 0.13, 0.30, -0.02, 0.135, -0.30, kamM);                 // taras 1
  B(g, 0.58, 0.13, 0.26, -0.05, 0.265, -0.35, kamHiM, 0, 0.06, 0);   // taras 2
  B(g, 0.42, 0.13, 0.22, -0.02, 0.395, -0.38, kamM, 0, -0.05, 0);    // taras 3
  B(g, 0.26, 0.11, 0.30, -0.36, 0.125, -0.12, kamHiM, 0, 0.25, 0);   // polka W
  B(g, 0.24, 0.10, 0.26, 0.32, 0.12, -0.18, kamM, 0, -0.3, 0);       // polka E
  B(g, 0.14, 0.12, 0.14, 0.30, 0.13, 0.24, blokM);                   // wyciete bloki
  B(g, 0.13, 0.11, 0.13, 0.45, 0.125, 0.30, blokM, 0, 0.4, 0);
  B(g, 0.12, 0.10, 0.12, 0.36, 0.24, 0.265, blokM, 0, 0.15, 0);
  B(g, 0.05, 0.50, 0.05, -0.16, 0.32, 0.30, drewnoM);                // zuraw — slup
  B(g, 0.46, 0.05, 0.05, 0.02, 0.545, 0.30, drewnoM);                // wysiegnik
  B(g, 0.035, 0.28, 0.035, -0.045, 0.435, 0.30, drewnoM, 0, 0, -0.72); // zastrzal
  B(g, 0.014, 0.17, 0.014, 0.21, 0.435, 0.30, linaM);                // lina
  B(g, 0.11, 0.10, 0.11, 0.21, 0.30, 0.30, blokM, 0, 0.25, 0);       // blok na linie
  const drab = new THREE.Group();                                    // drabina na taras 1
  B(drab, 0.024, 0.36, 0.02, -0.05, 0.18, 0, drewnoM);
  B(drab, 0.024, 0.36, 0.02, 0.05, 0.18, 0, drewnoM);
  for (let i = 0; i < 3; i++) B(drab, 0.115, 0.022, 0.018, 0, 0.08 + i * 0.09, 0, drewnoM);
  drab.position.set(0.10, 0.07, -0.115);
  drab.rotation.x = -0.42;
  g.add(drab);
  B(g, 0.07, 0.05, 0.07, -0.28, 0.095, 0.22, kamDkM, 0, 0.4, 0);     // gruz
  B(g, 0.055, 0.045, 0.055, -0.19, 0.09, 0.30, kamHiM, 0, -0.3, 0);
  return g; // 264 tri
}

// ============================ TARTAK =======================================
export function buildTartak(): THREE.Group {
  const g = new THREE.Group();
  const slupM = mat(P.drewnoDk), dachM = mat(0xa46a38), dachDkM = mat(P.drewnoC),
    balM = mat(P.bal), stalM = mat(P.stal), uchwytM = mat(P.drewnoC), deskaM = mat(P.drewno);

  const wiata = new THREE.Group();                                   // wiata-magazyn w glebi
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {
    B(wiata, 0.045, 0.24, 0.045, sx * 0.21, 0.12, sz * 0.13, slupM);
  }
  B(wiata, 0.54, 0.038, 0.22, 0, 0.30, 0.085, dachM, 0.5, 0, 0);     // polac przednia
  B(wiata, 0.54, 0.038, 0.22, 0, 0.30, -0.085, dachM, -0.5, 0, 0);   // polac tylna
  B(wiata, 0.56, 0.045, 0.06, 0, 0.355, 0, dachDkM);                 // kalenica
  B(wiata, 0.42, 0.045, 0.17, 0, 0.0225, 0, deskaM);                 // sztapel desek
  B(wiata, 0.38, 0.045, 0.14, 0.01, 0.0675, 0.01, deskaM, 0, 0.05, 0);
  B(wiata, 0.34, 0.045, 0.11, -0.01, 0.1125, 0, deskaM, 0, -0.04, 0);
  wiata.position.set(-0.06, 0, -0.30);
  g.add(wiata);
  for (const kx of [-0.15, 0.15] as const) {                         // kozly z balem — przod
    B(g, 0.035, 0.24, 0.035, kx - 0.02, 0.12, 0.32, slupM, 0.45, 0, 0);
    B(g, 0.035, 0.24, 0.035, kx - 0.02, 0.12, 0.20, slupM, -0.45, 0, 0);
  }
  CYL(g, 0.062, 0.062, 0.56, -0.02, 0.235, 0.26, balM, 6, 0, 0, Math.PI / 2); // bal w cieciu
  B(g, 0.014, 0.19, 0.06, 0.045, 0.315, 0.26, stalM);                // pila wbita w bal
  B(g, 0.13, 0.03, 0.03, 0.045, 0.415, 0.26, uchwytM);               // uchwyt pily
  const sterta = new THREE.Group();                                  // sterta bali
  for (const [bz, by] of [[-0.066, 0.058], [0, 0.058], [0.066, 0.058], [-0.033, 0.152], [0.033, 0.152]] as const) {
    CYL(sterta, 0.058, 0.058, 0.46, 0, by, bz, balM, 6, Math.PI / 2, 0, 0);
  }
  sterta.position.set(0.44, 0, -0.10);
  sterta.rotation.y = -0.18;
  g.add(sterta);
  CYL(g, 0.07, 0.078, 0.13, -0.42, 0.065, 0.14, slupM, 6);           // pieniek
  B(g, 0.02, 0.19, 0.02, -0.38, 0.155, 0.16, uchwytM, 0, 0, -0.6);   // siekiera — trzonek
  B(g, 0.055, 0.06, 0.016, -0.445, 0.20, 0.15, stalM);               // ostrze
  return g; // 384 tri
}

// ==================== ZAGRODA — DODATKI (sektor W-NW) ======================
/** Plotek + poidlo + stog siana w wolnym sektorze pastwiska (250-335 st.), 80 tri. */
export function buildZagrodaDodatki(hexR = 1.0): THREE.Group {
  const g = new THREE.Group();
  const L = ULEPSZENIA_P2_LAYOUT.zagrodaDodatki.sloty;
  const palM = mat(P.drewnoDk), ryglM = mat(P.drewno), korytoM = mat(P.drewnoC),
    wodaM = mat(P.woda), sianoM = mat(P.siano);
  const plot = new THREE.Group();                                    // plotek (1 przeslo)
  B(plot, 0.035, 0.17, 0.035, -0.145, 0.085, 0, palM);
  B(plot, 0.035, 0.17, 0.035, 0.145, 0.085, 0, palM);
  B(plot, 0.34, 0.028, 0.024, 0, 0.078, 0, ryglM);
  B(plot, 0.34, 0.028, 0.024, 0, 0.138, 0, ryglM);
  const pp = azXZ(L.plotek.az, L.plotek.r);
  plot.position.set(pp.x * hexR, 0, pp.z * hexR);
  plot.rotation.y = tangRotY(L.plotek.az);
  g.add(plot);
  const poj = new THREE.Group();                                     // poidlo
  B(poj, 0.19, 0.065, 0.105, 0, 0.0325, 0, korytoM);
  B(poj, 0.16, 0.016, 0.078, 0, 0.058, 0, wodaM);
  const wp = azXZ(L.poidlo.az, L.poidlo.r);
  poj.position.set(wp.x * hexR, 0, wp.z * hexR);
  poj.rotation.y = L.poidlo.rotY;
  g.add(poj);
  const sp = azXZ(L.stog.az, L.stog.r);                              // stog siana
  CONE(g, 0.115, 0.18, sp.x * hexR, 0.09, sp.z * hexR, sianoM, 4, 0.3);
  return g; // 80 tri
}

// ========================= LAYOUT PARTII 2 =================================
/**
 * Osadzenie na heksie (wspolrzedne znormalizowane do HEX_R):
 * budynek glowny w SRODKU heksa, dekoracje w pierscieniu 0.50-0.80 (wzorzec pastwiska).
 * Srodek zostaje WOLNY tylko tam, gdzie budynek nie jest glownym obiektem
 * (pastwisko bez farmy — zob. PASTWISKO_LAYOUT.budynek w pastwisko-modele.ts).
 */
export const ULEPSZENIA_P2_LAYOUT = {
  hexR: 1.0,
  /** Strefa budynku glownego — spojna z PASTWISKO_LAYOUT.budynek (r 0.40). */
  budynekCentrum: { x: 0, z: 0, r: 0.40 },
  farma: {
    /** Heks pastwiska: stodola w strefie budynku, zwierzeta wg PASTWISKO_LAYOUT. */
    pastwisko: { budynek: { x: 0, z: 0, rotY: -1.15 } }, // wrota ku S-SE (kamera gry)
    /** Solo (wlasny heks): budynek + poletka w pierscieniu 0.50-0.80. */
    solo: {
      budynek: { x: 0, z: 0, rotY: -1.15 },
      poletka: [{ az: 85, r: 0.63 }, { az: 205, r: 0.62 }, { az: 287, r: 0.65 }],
      strach: { az: 57, r: 0.53 },
      sciezka: { az: 156, r: 0.45 },
    },
  },
  /** Dodatki do WOLNEGO sektora pastwiska (W-NW 250-335 st.). */
  zagrodaDodatki: {
    sektor: { azOd: 250, azDo: 335 },
    sloty: {
      plotek: { az: 303, r: 0.71 },
      poidlo: { az: 264, r: 0.58, rotY: 0.22 },
      stog: { az: 310, r: 0.72 },
    },
  },
  /** Budynki-glowne-obiekty: model w srodku heksa (dekoracje wbudowane w model). */
  kopalnia: { budynek: { x: 0, z: 0, rotY: -0.95 } },   // tory wybiegaja ku SE
  kamieniolom: { budynek: { x: 0, z: 0, rotY: 0.25 } }, // zuraw od strony S, tarasy ku N
  tartak: { budynek: { x: 0, z: 0, rotY: -0.2 } },      // bal+kozly od S, sterta E, wiata N
} as const;
