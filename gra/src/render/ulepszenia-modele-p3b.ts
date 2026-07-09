/**
 * ulepszenia-modele-p3b.ts — ULEPSZENIA TERENU, PARTIA 3B: irygacja, pole
 * irygowane, fort, posterunek, nawierzchnie drog, zloza kopalne (nakladki)
 * w stylu Roblox (klockowate boxy, zywe plaskie kolory, MeshLambert
 * flatShading, zero tekstur, czytelne z lotu ptaka).
 *
 * MODELE (tri: box=12, cylinder6=24, cone4=8; STARE -> NOWE):
 *  - buildIrygacja()                 792 -> 468 tri — kanal glowny + odnoga w kamiennych
 *      klockowych korytach, sluza z uniesiona zastawka, kladka-przepust,
 *      statyczne kolo wodne, 4 zielensze poletka wzdluz kanalow.
 *  - buildPoleIrygowane()           1000 -> 480 tri — 6 rzedow upraw x 4 segmenty
 *      w 3 KOLORACH DOJRZALOSCI (mlody/dojrzewajacy/zloty), ziemne kanalki
 *      miedzy parami rzedow, kamienny doprowadzalnik z zastawka od zachodu
 *      (spojny z buildIrygacja i poletkami farmy z P2).
 *  - buildFort(ownerCol)             184 -> 416 tri — kwadratowy kamienny mur,
 *      4 wiezyczki narozne z czerwonymi dachami, brama z wrotami (+x),
 *      budynek zalogi, maszt z PROPORCEM W KOLORZE GRACZA + baner nad brama.
 *  - buildPosterunek(ownerCol)       448 -> 428 tri — wieza obserwacyjna na
 *      pochylonych palach, drabina (+x), daszek, kosz ogniowy, balustrada,
 *      PROPORZEC W KOLORZE GRACZA na szczycie.
 *  - buildDrogaNawierzchnia()        324 -> 204 tri — WSTEGA przez heks (pas wzdluz
 *      osi X, dl. 1.78 = jak stare rbxDroga): jasniejszy pas, koleiny, pobocza,
 *      kamyczki, plamy ubitej ziemi.
 *  - buildDrogaBrukowanaNawierzchnia() 396 -> 288 tri — ta sama wstega; klockowe
 *      plyty w 2 odcieniach szarosci (uklad cegielki) + jasne obrzeze.
 *  - buildZlozeMiedz/Zelazo/Wegiel/Sol/Glina() — 208/216/216/200/216 tri —
 *      wystajace z terenu klockowe mineraly w 4 skupiskach na obrzezu heksa
 *      (r 0.60-0.68); SRODEK WOLNY (r<0.45) — na tych heksach staje kopalnia.
 *      miedz=pomaranczowo-turkusowe krysztaly, zelazo=rdzawe bryly z metalicznym
 *      blikiem, wegiel=czarne blyszczace szesciany, sol=biale krysztaly+panew
 *      solankowa, glina=pomaranczowe warstwy tarasowe.
 *  - buildZlozeKlaster(typ)          ~44-56 tri — jedno skupisko (do kompozycji).
 *
 * KONWENCJE (zgodne z pastwisko-modele.ts / ulepszenia-modele-p2.ts):
 *  - spod modelu na y=0 (powierzchnia heksa), przod = +x, obrot figury = rotation.y,
 *  - wspolrzedne znormalizowane do HEX_R=1 (hexutil.ts),
 *  - azymut: 0=N(-z), 90=E(+x); x=r*sin(az), z=-r*cos(az).
 *
 * INTERFEJS KOLORU GRACZA (zachowany 1:1 ze starymi rbxFort/rbxPosterunek,
 * render/robloxImprovements.ts:322/:349): builder przyjmuje ownerCol:number,
 * maskuje `ownerCol & 0xffffff` i barwi proporzec/baner. W registry BUILDERS
 * sygnatura pozostaje (g, owner) => void — patrz nizej.
 *
 * INTERFEJS PRZEBIEGU DROGI (zachowany 1:1 ze starym rbxDroga :60 /
 * rbxDrogaBrukowana :73): droga w kanonie NIE ma lukow wejscie-wyjscie —
 * to prosty pas wzdluz osi swiata X przez srodek heksa (dl. 1.75-1.78),
 * a spawnImprovementMesh (main.ts:4303) stawia mesh w srodku heksa BEZ
 * rotacji (buildImprovementVisual main.ts:1013). Nowe nawierzchnie maja
 * ten sam footprint (1.78 x ~0.5-0.56, spod y=0) — zmieniony TYLKO wyglad.
 *
 * JAK WPIAC (drzewo kanoniczne gra/src):
 *  1. Plik skopiowac do gra/src/render/ulepszenia-modele-p3b.ts.
 *  2. render/robloxImprovements.ts (registry BUILDERS ~linia 376):
 *       import { buildIrygacja, buildPoleIrygowane, buildFort, buildPosterunek,
 *                buildDrogaNawierzchnia, buildDrogaBrukowanaNawierzchnia,
 *                ULEPSZENIA_P3B_LAYOUT } from './ulepszenia-modele-p3b';
 *       const L3B = ULEPSZENIA_P3B_LAYOUT;
 *       droga:           g => { g.add(buildDrogaNawierzchnia()); },
 *       droga_brukowana: g => { g.add(buildDrogaBrukowanaNawierzchnia()); },
 *       irygacja:        g => { const m = buildIrygacja(); m.rotation.y = L3B.irygacja.budynek.rotY; g.add(m); },
 *       pole_irygowane:  g => { const m = buildPoleIrygowane(); m.rotation.y = L3B.pole_irygowane.budynek.rotY; g.add(m); },
 *       fort:       (g, o) => { const m = buildFort(o); m.rotation.y = L3B.fort.budynek.rotY; g.add(m); },
 *       posterunek: (g, o) => { const m = buildPosterunek(o); m.rotation.y = L3B.posterunek.budynek.rotY; g.add(m); },
 *     (stare rbxDroga/rbxDrogaBrukowana/rbxIrygacjaLarge/rbxPoleIrygowane/
 *      rbxFort/rbxPosterunek — do wycofania).
 *  3. buildRobloxFoodStack (tamze, ~linia 411): galaz `hasI` (443) i `hasF && hasI`
 *     (423) -> zamiast rbxIrygacja/rbxFarmIrygacja uzyc buildIrygacja()
 *     (+ buildFarma z P2 dla kombinacji farma+irygacja).
 *  4. render/styleResources.ts, buildStyledResourceOverlay (:390-415), galaz roblox:
 *       case Nakladka.ZlozeGliny (405):  g = buildZlozeGlina(); break;   // styl roblox
 *       switch (zloze) (411-414):
 *         case 'miedz':  g = buildZlozeMiedz();  break;
 *         case 'zelazo': g = buildZlozeZelazo(); break;
 *         case 'wegiel': g = buildZlozeWegiel(); break;
 *         case 'sol':    g = buildZlozeSol();    break;
 *     (dla style !== 'roblox' zostawic stare styled*). Nakladka dostaje
 *     w main.ts (rebuildResourceOverlays ~1026) pozycje + losowy rotation.y —
 *     skupiska sa rozlozone rotacyjnie-neutralnie (pierscien), wiec OK.
 */
import * as THREE from 'three';

export type ZlozeTyp = 'miedz' | 'zelazo' | 'wegiel' | 'sol' | 'glina';

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
  cx: number, cy: number, cz: number, m: THREE.Material,
  seg = 4, ry = 0, rx = 0, rz = 0,
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

/** Paleta partii 3B (kamien/drewno/woda spojne z P2). */
export const P3B = {
  drewno: 0xc98a4b, drewnoDk: 0x8a5a2e, drewnoC: 0x6b4423,
  kamien: 0x9aa5b1, kamienDk: 0x717d89, kamienHi: 0xb7c0c8,
  dachCzerw: 0xd93a2b, dachCzerwDk: 0xb02a1f, czern: 0x14100b,
  woda: 0x4ab6e8, wodaDk: 0x2f96cc, ziemia: 0x8a6a45, ziemiaDk: 0x6e5436,
  krzewMlody: 0x5ec74a, krzewMlodyDk: 0x4bb03a, krzewSredni: 0xa9c93f, krzewSredniDk: 0x8fb32f,
  zboze: 0xe9c34e, zbozeDk: 0xc99f35,
  drogaPas: 0xd2b184, drogaKoleina: 0xa8895e, drogaPobocze: 0x8a6a45, drogaPlama: 0xc3a173,
  brukBaza: 0x7b8794, brukA: 0xb9c2ca, brukB: 0x939ea9, brukObrzeze: 0xd2d9df,
  miedz: 0xe07b2f, miedzTurkus: 0x39c6b2,
  rdza: 0x9a4f26, rdzaHi: 0xb46435, metalPolysk: 0xcdd3d9, rdzaDk: 0x6e3a1e,
  wegiel: 0x17171b, wegielHi: 0x40454d, wegielBaza: 0x2c2e33,
  sol: 0xf7fbff, solDk: 0xdfe9f2, solanka: 0xbfe4f2,
  glinaA: 0xb85c33, glinaB: 0xd97742, glinaC: 0xe8935a, glinaMokra: 0xc44f22,
  plomien: 0xffc02e, plomienDk: 0xff7a1a, metal: 0x545d66,
} as const;
const P = P3B;

// ============================ IRYGACJA =====================================
/** Kanaly w kamiennych korytach + sluza + kladka + kolo wodne + poletka. 468 tri. */
export function buildIrygacja(): THREE.Group {
  const g = new THREE.Group();
  const brzegM = mat(P.kamien), brzegDkM = mat(P.kamienDk), wodaM = mat(P.woda), wodaDkM = mat(P.wodaDk);
  const drewnoM = mat(P.drewnoDk), drewnoCM = mat(P.drewnoC), deskaM = mat(P.drewno);
  const ziemiaM = mat(P.ziemia);

  // kanal glowny wzdluz X (koryto: woda + brzegi rozciete odnoga)
  const KW = 0.105;
  B(g, 1.56, 0.055, 0.13, 0, 0.0325, 0, wodaM);
  for (const sz of [-1, 1] as const) {
    B(g, 1.10, 0.09, 0.055, -0.23, 0.045, sz * KW, sz < 0 ? brzegM : brzegDkM);
    B(g, 0.38, 0.09, 0.055, 0.59, 0.045, sz * KW, sz < 0 ? brzegDkM : brzegM);
  }
  // odnoga ku +z na x=+0.30
  B(g, 0.13, 0.05, 0.62, 0.30, 0.028, 0.36, wodaDkM);
  for (const sx of [-1, 1] as const) {
    B(g, 0.055, 0.085, 0.52, 0.30 + sx * KW, 0.0425, 0.40, sx < 0 ? brzegDkM : brzegM);
  }
  B(g, 0.15, 0.06, 0.15, 0.30, 0.033, 0.02, wodaM);          // rozlewisko (kryje szew)

  // sluza (x=-0.25): zastawka uniesiona do polowy
  const slz = -0.25;
  B(g, 0.05, 0.26, 0.05, slz, 0.13, KW + 0.02, drewnoM);
  B(g, 0.05, 0.26, 0.05, slz, 0.13, -KW - 0.02, drewnoM);
  B(g, 0.055, 0.05, 0.34, slz, 0.285, 0, drewnoCM);          // oczep z kolowrotem
  B(g, 0.022, 0.13, 0.20, slz, 0.135, 0, deskaM);            // zastawka
  B(g, 0.03, 0.03, 0.10, slz, 0.325, 0, deskaM, 0.5, 0, 0);  // korba

  // kladka-przepust nad odnoga (z=+0.40)
  B(g, 0.30, 0.045, 0.15, 0.30, 0.115, 0.40, brzegM);
  B(g, 0.34, 0.03, 0.04, 0.30, 0.155, 0.34, brzegDkM);
  B(g, 0.34, 0.03, 0.04, 0.30, 0.155, 0.46, brzegDkM);

  // kolo wodne (statyczne) na x=+0.68, os wzdluz z
  const kx = 0.68, kyc = 0.135;
  CYL(g, 0.045, 0.045, 0.055, kx, kyc, 0, drewnoCM, 6, Math.PI / 2, 0, 0);   // piasta
  CYL(g, 0.016, 0.016, 0.30, kx, kyc, 0, drewnoM, 6, Math.PI / 2, 0, 0);     // os
  for (let i = 0; i < 4; i++) {                              // 4 deski = 8 lopat
    const a = (i / 4) * Math.PI;
    B(g, 0.055, 0.235, 0.042, kx, kyc, 0, deskaM, 0, 0, a);
  }
  B(g, 0.05, 0.20, 0.05, kx, 0.10, 0.145, drewnoM);          // podpory osi
  B(g, 0.05, 0.20, 0.05, kx, 0.10, -0.145, drewnoM);

  // 4 zielensze poletka wzdluz kanalow
  const mlodyM = mat(P.krzewMlody), mlodyDkM = mat(P.krzewMlodyDk), sredniM = mat(P.krzewSredni);
  const poletka: Array<{ x: number; z: number; ry: number; c: [THREE.Material, THREE.Material] }> = [
    { x: -0.33, z: -0.42, ry: 0.06, c: [mlodyM, mlodyDkM] },
    { x: -0.33, z: 0.44, ry: -0.08, c: [mlodyDkM, sredniM] },
    { x: 0.60, z: -0.40, ry: 0.12, c: [mlodyM, sredniM] },
    { x: 0.66, z: 0.44, ry: -0.05, c: [sredniM, mlodyM] },
  ];
  for (const pl of poletka) {
    const p = new THREE.Group();
    B(p, 0.44, 0.032, 0.30, 0, 0.016, 0, ziemiaM);
    B(p, 0.38, 0.085, 0.075, 0, 0.06, -0.065, pl.c[0]);
    B(p, 0.38, 0.085, 0.075, 0, 0.06, 0.065, pl.c[1]);
    p.position.set(pl.x, 0, pl.z);
    p.rotation.y = pl.ry;
    g.add(p);
  }
  return g; // 468 tri
}

// ========================= POLE IRYGOWANE ==================================
/** Rzedy upraw (3 kolory dojrzalosci) + kanalki + doprowadzalnik. 480 tri. */
export function buildPoleIrygowane(): THREE.Group {
  const g = new THREE.Group();
  const brzegM = mat(P.kamien), brzegDkM = mat(P.kamienDk), wodaM = mat(P.woda), wodaDkM = mat(P.wodaDk);
  const ziemiaM = mat(P.ziemia), drewnoM = mat(P.drewnoDk), deskaM = mat(P.drewno);

  // doprowadzalnik od zachodu (koryto kamienne wzdluz z) + zastawka wpustu
  B(g, 0.12, 0.05, 1.18, -0.70, 0.028, 0, wodaM);
  B(g, 0.05, 0.085, 1.18, -0.795, 0.0425, 0, brzegM);
  B(g, 0.05, 0.085, 1.18, -0.605, 0.0425, 0, brzegDkM);
  B(g, 0.045, 0.15, 0.045, -0.60, 0.075, -0.085, drewnoM);
  B(g, 0.045, 0.15, 0.045, -0.60, 0.075, 0.085, drewnoM);
  B(g, 0.02, 0.09, 0.13, -0.60, 0.10, 0, deskaM);

  // baza pola
  B(g, 1.26, 0.035, 1.24, 0.06, 0.0175, 0, ziemiaM);

  // 6 rzedow upraw x 4 segmenty; 3 kolory dojrzalosci
  const mlodyM = mat(P.krzewMlody), mlodyDkM = mat(P.krzewMlodyDk);
  const sredniM = mat(P.krzewSredni), sredniDkM = mat(P.krzewSredniDk);
  const zlotyM = mat(P.zboze), zlotyDkM = mat(P.zbozeDk);
  const kolory: Array<[THREE.Material, THREE.Material]> = [[mlodyM, mlodyDkM], [zlotyM, zlotyDkM], [sredniM, sredniDkM],
    [mlodyDkM, mlodyM], [sredniDkM, sredniM], [zlotyDkM, zlotyM]];
  const rowZ = [-0.545, -0.325, -0.105, 0.115, 0.335, 0.555];
  const segX = [-0.39, -0.09, 0.21, 0.51];
  const segH = [0.095, 0.115, 0.10, 0.12];
  for (let ri = 0; ri < rowZ.length; ri++) {
    const [cA, cB] = kolory[ri]!;
    for (let si = 0; si < segX.length; si++) {
      const h = segH[(ri + si) % 4]!;
      B(g, 0.27, h, 0.135, segX[si]!, 0.035 + h / 2, rowZ[ri]!, (ri + si) % 2 ? cB : cA);
    }
  }
  // klosy-akcenty na dojrzalych rzedach (2. warstwa)
  for (const [ax, az2] of [[-0.09, -0.325], [0.51, -0.325], [-0.39, 0.555], [0.21, 0.555], [0.51, 0.115], [-0.39, -0.105]] as const) {
    B(g, 0.10, 0.05, 0.08, ax + 0.03, 0.16, az2, zlotyM, 0, 0.3, 0);
  }
  // ziemne kanalki miedzy parami rzedow
  for (const kz of [-0.435, 0.005, 0.445] as const) {
    B(g, 1.22, 0.045, 0.075, 0.03, 0.038, kz, wodaDkM);
  }
  return g; // 480 tri
}

// =============================== FORT ======================================
/**
 * Kwadratowy kamienny mur z 4 wiezyczkami, brama z wrotami (+x), budynek
 * zalogi, maszt z proporcem + baner nad brama W KOLORZE GRACZA. 416 tri.
 * Interfejs koloru zachowany ze starego rbxFort(g, ownerCol).
 */
export function buildFort(ownerCol = 0xffd54a): THREE.Group {
  const g = new THREE.Group();
  const ownerM = mat(ownerCol & 0xffffff);
  const murM = mat(P.kamien), murDkM = mat(P.kamienDk), murHiM = mat(P.kamienHi);
  const drewnoM = mat(P.drewnoDk), deskaM = mat(P.drewno), dachM = mat(P.dachCzerw), dachDkM = mat(P.dachCzerwDk);

  const W = 0.40;
  B(g, 0.96, 0.05, 0.96, 0, 0.025, 0, murDkM);               // podest kamienny
  const wallH = 0.20, wallY = 0.05 + wallH / 2;
  B(g, 0.07, wallH, 2 * W - 0.10, -W, wallY, 0, murM);       // mur -x
  B(g, 2 * W - 0.10, wallH, 0.07, 0, wallY, -W, murM);       // mur -z
  B(g, 2 * W - 0.10, wallH, 0.07, 0, wallY, W, murM);        // mur +z
  B(g, 0.07, wallH, 0.255, W, wallY, -0.2725, murM);         // mur +x — segmenty bramy
  B(g, 0.07, wallH, 0.255, W, wallY, 0.2725, murM);
  B(g, 0.075, 0.07, 0.22, W, 0.285, 0, murHiM);              // nadproze
  B(g, 0.022, 0.15, 0.145, W - 0.006, 0.125, 0, deskaM);     // wrota
  B(g, 0.028, 0.028, 0.15, W - 0.002, 0.16, 0, drewnoM);     // rygiel wrot
  for (const [bx, bz] of [[-W, -0.16], [-W, 0.16], [-0.16, -W], [0.16, -W], [-0.16, W], [0.16, W]] as const) {
    const onX = Math.abs(bx) === W;                          // blanki
    B(g, onX ? 0.085 : 0.07, 0.055, onX ? 0.07 : 0.085, bx, 0.2775, bz, murHiM);
  }
  B(g, 0.085, 0.05, 0.09, W, 0.345, 0, murHiM);              // merlon nad nadprozem
  for (const sx of [-1, 1] as const) for (const sz of [-1, 1] as const) {  // wiezyczki
    B(g, 0.155, 0.34, 0.155, sx * W, 0.22, sz * W, sx * sz > 0 ? murM : murHiM);
    B(g, 0.21, 0.06, 0.21, sx * W, 0.42, sz * W, murDkM);
    CONE(g, 0.135, 0.135, sx * W, 0.5175, sz * W, sz > 0 ? dachM : dachDkM, 4, Math.PI / 4);
  }
  B(g, 0.26, 0.14, 0.17, -0.09, 0.12, 0.04, deskaM);         // budynek zalogi
  B(g, 0.29, 0.045, 0.115, -0.09, 0.205, 0.085, dachM, 0.62, 0, 0);
  B(g, 0.29, 0.045, 0.115, -0.09, 0.205, -0.005, dachM, -0.62, 0, 0);
  CYL(g, 0.014, 0.018, 0.34, 0.10, 0.42, -0.06, drewnoM, 6); // maszt
  B(g, 0.02, 0.085, 0.17, 0.10, 0.555, 0.035, ownerM);       // proporzec gracza
  B(g, 0.022, 0.045, 0.07, 0.10, 0.535, 0.135, ownerM, 0, 0, 0.35);
  B(g, 0.024, 0.11, 0.075, W + 0.02, 0.20, 0, ownerM);       // baner nad brama
  return g; // 416 tri
}

// ============================ POSTERUNEK ===================================
/**
 * Wieza obserwacyjna na palach: drabina (+x), daszek, balustrada, kosz
 * ogniowy, proporzec W KOLORZE GRACZA. 428 tri.
 * Interfejs koloru zachowany ze starego rbxPosterunek(g, ownerCol).
 */
export function buildPosterunek(ownerCol = 0xffd54a): THREE.Group {
  const g = new THREE.Group();
  const ownerM = mat(ownerCol & 0xffffff);
  const palM = mat(P.drewnoDk), deskaM = mat(P.drewno), belkaM = mat(P.drewnoC);
  const metalM = mat(P.metal), plomienM = mat(P.plomien), plomienDkM = mat(P.plomienDk);

  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {  // pale
    B(g, 0.045, 0.36, 0.045, sx * 0.145, 0.18, sz * 0.145, palM, sz * -0.10, 0, sx * 0.10);
  }
  B(g, 0.34, 0.035, 0.045, 0, 0.155, 0, belkaM);             // rygle
  B(g, 0.045, 0.035, 0.34, 0, 0.235, 0, belkaM);
  B(g, 0.36, 0.04, 0.36, 0, 0.38, 0, deskaM);                // podest
  B(g, 0.30, 0.045, 0.30, 0, 0.345, 0, belkaM);              // oczep
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {  // balustrada
    B(g, 0.03, 0.12, 0.03, sx * 0.165, 0.46, sz * 0.165, palM);
  }
  B(g, 0.36, 0.028, 0.024, 0, 0.505, -0.165, deskaM);
  B(g, 0.36, 0.028, 0.024, 0, 0.505, 0.165, deskaM);
  B(g, 0.024, 0.028, 0.36, -0.165, 0.505, 0, deskaM);
  B(g, 0.024, 0.028, 0.30, 0.165, 0.505, -0.04, deskaM);     // od +x krotsza (wejscie)
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const) {  // slupki dachu
    B(g, 0.032, 0.20, 0.032, sx * 0.125, 0.50, sz * 0.125, palM);
  }
  CONE(g, 0.24, 0.15, 0, 0.675, 0, mat(P.dachCzerw), 4, Math.PI / 4);      // daszek
  B(g, 0.30, 0.028, 0.30, 0, 0.588, 0, belkaM);              // okap
  const drab = new THREE.Group();                            // drabina
  B(drab, 0.026, 0.44, 0.026, 0, 0.22, -0.055, palM);
  B(drab, 0.026, 0.44, 0.026, 0, 0.22, 0.055, palM);
  for (let i = 0; i < 4; i++) B(drab, 0.022, 0.024, 0.13, 0, 0.09 + i * 0.10, 0, deskaM);
  drab.position.set(0.21, 0, 0);
  drab.rotation.z = -0.24;
  g.add(drab);
  const ko = new THREE.Group();                              // kosz ogniowy
  B(ko, 0.05, 0.16, 0.05, 0, 0.08, 0, palM);
  B(ko, 0.115, 0.075, 0.115, 0, 0.20, 0, metalM);
  B(ko, 0.085, 0.055, 0.085, 0, 0.26, 0, plomienDkM, 0, 0.5, 0);
  B(ko, 0.05, 0.06, 0.05, 0, 0.30, 0, plomienM, 0, 0.2, 0);
  ko.position.set(0.42, 0, 0.30);
  g.add(ko);
  CYL(g, 0.011, 0.014, 0.20, 0, 0.83, 0, palM, 6);           // proporzec gracza
  B(g, 0.018, 0.075, 0.15, 0, 0.885, 0.09, ownerM);
  B(g, 0.02, 0.04, 0.06, 0, 0.868, 0.175, ownerM, 0, 0, 0.3);
  return g; // 428 tri
}

// ===================== DROGA — NAWIERZCHNIA GRUNTOWA =======================
/**
 * WSTEGA przez heks jak stare rbxDroga: pas wzdluz osi X, dl. 1.78, srodek
 * w (0,0), spod y=0 — registry stawia bez rotacji (przebieg zachowany 1:1).
 * Jasniejszy pas z koleinami, poboczami i kamyczkami. 204 tri.
 */
export function buildDrogaNawierzchnia(): THREE.Group {
  const g = new THREE.Group();
  const pasM = mat(P.drogaPas), koleinaM = mat(P.drogaKoleina), poboczeM = mat(P.drogaPobocze);
  const plamaM = mat(P.drogaPlama), kamMs = [mat(P.kamien), mat(P.kamienHi), mat(P.kamienDk)];

  B(g, 1.78, 0.045, 0.50, 0, 0.0225, 0, pasM);               // pas jezdny
  B(g, 1.78, 0.028, 0.05, 0, 0.014, 0.265, poboczeM);        // pobocza
  B(g, 1.78, 0.028, 0.05, 0, 0.014, -0.265, poboczeM);
  B(g, 1.72, 0.012, 0.055, 0, 0.048, 0.105, koleinaM);       // koleiny
  B(g, 1.72, 0.012, 0.055, 0, 0.048, -0.105, koleinaM);
  for (const [px, pz, s2] of [[-0.62, 0.01, 1.2], [0.11, -0.02, 1.0], [0.66, 0.03, 1.15]] as const) {
    B(g, 0.17 * s2, 0.01, 0.11 * s2, px, 0.048, pz, plamaM, 0, px, 0);  // plamy
  }
  const kamyki = [[-0.80, 0.19], [-0.55, -0.17], [-0.33, 0.21], [-0.10, -0.20],
    [0.14, 0.185], [0.38, -0.16], [0.60, 0.20], [0.80, -0.19], [0.02, 0.02]] as const;
  kamyki.forEach(([px, pz], i) => {
    const s2 = 0.035 + (i % 3) * 0.009;
    B(g, s2, 0.028, s2, px, 0.045, pz, kamMs[i % 3]!, 0, px * 3 + i, 0);
  });
  return g; // 204 tri
}

// ===================== DROGA BRUKOWANA — NAWIERZCHNIA ======================
/**
 * Ta sama wstega przez heks co stare rbxDrogaBrukowana (pas wzdluz X, 1.78).
 * Klockowe plyty w 2 odcieniach szarosci (cegielka) + jasne obrzeze. 288 tri.
 */
export function buildDrogaBrukowanaNawierzchnia(): THREE.Group {
  const g = new THREE.Group();
  const bazaM = mat(P.brukBaza), plytaA = mat(P.brukA), plytaB = mat(P.brukB), obrzezeM = mat(P.brukObrzeze);

  B(g, 1.78, 0.055, 0.56, 0, 0.0275, 0, bazaM);              // podbudowa
  for (const sz of [-1, 1] as const) {                       // obrzeze — po 3 segmenty
    for (let i = 0; i < 3; i++) {
      B(g, 0.56, 0.032, 0.05, -0.59 + i * 0.59, 0.062, sz * 0.255, obrzezeM);
    }
  }
  for (let row = 0; row < 3; row++) {                        // plyty (cegielka)
    const rz = -0.17 + row * 0.17;
    const off = row === 1 ? 0.145 : 0;
    for (let col = 0; col < 6; col++) {
      const px = -0.725 + col * 0.29 + off;
      if (px > 0.86) continue;
      B(g, 0.26, 0.032, 0.145, px, 0.066, rz, (row + col) % 2 ? plytaA : plytaB);
    }
  }
  return g; // 288 tri
}

// ===================== ZLOZA KOPALNE — NAKLADKI ============================
/**
 * Jedno skupisko zloza w origin (spod y=0). `du` — wariacja obrotu brył,
 * pelne zloza daja du=0/0.9 naprzemiennie. ~44-56 tri.
 */
export function buildZlozeKlaster(typ: ZlozeTyp, du = 0): THREE.Group {
  const g = new THREE.Group();
  if (typ === 'miedz') {
    const skalaM = mat(P.kamienDk), m1 = mat(P.miedzTurkus), m2 = mat(P.miedz);
    B(g, 0.16, 0.095, 0.14, 0, 0.048, 0, skalaM, 0, 0.35 + du, 0.05);
    B(g, 0.065, 0.21, 0.065, 0.015, 0.135, -0.015, m1, -0.12, 0.5 + du, 0.14);
    B(g, 0.05, 0.13, 0.05, -0.055, 0.10, 0.045, m2, 0.1, du, -0.32);
    B(g, 0.048, 0.045, 0.048, 0.095, 0.022, 0.06, m2, 0, 0.4 + du, 0);
    if (du === 0) CONE(g, 0.042, 0.06, 0.015, 0.267, -0.015, m1, 4, 0.5, -0.12, 0.14);
  } else if (typ === 'zelazo') {
    const b1 = mat(P.rdza), b2 = mat(P.rdzaHi), hiM = mat(P.metalPolysk), dkM = mat(P.rdzaDk);
    B(g, 0.155, 0.115, 0.135, 0, 0.058, 0, b1, 0, 0.3 + du, 0.07);
    B(g, 0.10, 0.085, 0.10, 0.075, 0.042, -0.06, b2, 0, -0.25 + du, -0.05);
    B(g, 0.052, 0.045, 0.052, -0.01, 0.135, 0.01, hiM, 0.2, 0.55 + du, 0.2);  // metaliczny blik
    B(g, 0.05, 0.045, 0.05, -0.085, 0.022, 0.055, dkM, 0, du, 0.3);
  } else if (typ === 'wegiel') {
    const czM = mat(P.wegiel), hiM = mat(P.wegielHi), bazaM = mat(P.wegielBaza);
    B(g, 0.15, 0.05, 0.13, 0, 0.025, 0, bazaM, 0, 0.25 + du, 0);
    B(g, 0.105, 0.10, 0.105, -0.01, 0.095, 0.01, czM, 0, 0.62 + du, 0.08);
    B(g, 0.075, 0.075, 0.075, 0.06, 0.155, -0.03, czM, 0.3, 0.3 + du, 0.25);  // kostka na kant
    B(g, 0.045, 0.045, 0.045, -0.065, 0.13, -0.045, hiM, 0.25, du, 0.45);     // blyszczaca krawedz
  } else if (typ === 'sol') {
    const solM = mat(P.sol), solDkM = mat(P.solDk);
    B(g, 0.13, 0.022, 0.11, 0, 0.011, 0, solDkM, 0, 0.3 + du, 0);             // rozsypisko
    B(g, 0.06, 0.17, 0.06, -0.01, 0.095, 0.01, solM, 0.06, 0.45 + du, -0.10);
    B(g, 0.048, 0.095, 0.048, 0.055, 0.048, -0.04, solDkM, -0.1, du, 0.22);
    CONE(g, 0.043, 0.075, -0.014, 0.213, 0.017, solM, 4, 0.45 + du, 0.06, -0.10);
  } else {
    const gA = mat(P.glinaA), gB = mat(P.glinaB), gC = mat(P.glinaC), mokraM = mat(P.glinaMokra);
    B(g, 0.175, 0.05, 0.15, 0, 0.025, 0, gA, 0, 0.2 + du, 0);                 // warstwy tarasowe
    B(g, 0.14, 0.05, 0.115, 0.015, 0.073, -0.012, gB, 0, 0.45 + du, 0);
    B(g, 0.10, 0.045, 0.08, -0.012, 0.118, 0.012, gC, 0, 0.05 + du, 0);
    B(g, 0.055, 0.016, 0.045, 0.01, 0.146, 0.005, mokraM, 0, 0.3 + du, 0);    // mokry wierzch
  }
  return g;
}

type SlotZloza = { az: number; r: number; s: number; rotY: number };

function zlozeZeSkupisk(typ: ZlozeTyp, sloty: readonly SlotZloza[], extra?: (g: THREE.Group) => void): THREE.Group {
  const g = new THREE.Group();
  for (let i = 0; i < sloty.length; i++) {
    const s = sloty[i]!;
    const k = buildZlozeKlaster(typ, i % 2 ? 0.9 : 0);
    const c = azXZ(s.az, s.r);
    k.position.set(c.x, 0, c.z);
    k.rotation.y = s.rotY;
    k.scale.setScalar(s.s);
    g.add(k);
  }
  if (extra) extra(g);
  return g;
}

const ZL = () => ULEPSZENIA_P3B_LAYOUT.zloza;

/** Miedz — pomaranczowo-turkusowe krysztaly na skalkach. 208 tri. */
export function buildZlozeMiedz(): THREE.Group {
  return zlozeZeSkupisk('miedz', ZL().miedz);
}
/** Zelazo — rdzawe bryly z metalicznym blikiem. 216 tri. */
export function buildZlozeZelazo(): THREE.Group {
  return zlozeZeSkupisk('zelazo', ZL().zelazo, g => {
    const c1 = azXZ(155, 0.56), c2 = azXZ(330, 0.52);
    B(g, 0.05, 0.045, 0.05, c1.x, 0.022, c1.z, mat(P.rdzaHi), 0, 0.4, 0);
    B(g, 0.045, 0.04, 0.045, c2.x, 0.02, c2.z, mat(P.rdzaDk), 0, -0.3, 0);
  });
}
/** Wegiel — czarne blyszczace szesciany. 216 tri. */
export function buildZlozeWegiel(): THREE.Group {
  return zlozeZeSkupisk('wegiel', ZL().wegiel, g => {
    const c1 = azXZ(80, 0.54), c2 = azXZ(228, 0.55);
    B(g, 0.055, 0.05, 0.055, c1.x, 0.025, c1.z, mat(P.wegiel), 0, 0.5, 0);
    B(g, 0.045, 0.042, 0.045, c2.x, 0.021, c2.z, mat(P.wegielHi), 0, -0.2, 0);
  });
}
/** Sol — biale krysztaly + panew solankowa. 200 tri. */
export function buildZlozeSol(): THREE.Group {
  return zlozeZeSkupisk('sol', ZL().sol, g => {
    const c = azXZ(140, 0.60);
    B(g, 0.17, 0.035, 0.14, c.x, 0.018, c.z, mat(P.kamienDk), 0, 0.25, 0);
    B(g, 0.13, 0.014, 0.10, c.x, 0.042, c.z, mat(P.solanka), 0, 0.25, 0);
  });
}
/** Glina — pomaranczowe warstwy tarasowe. 216 tri. */
export function buildZlozeGlina(): THREE.Group {
  return zlozeZeSkupisk('glina', ZL().glina, g => {
    const c1 = azXZ(20, 0.54), c2 = azXZ(200, 0.56);
    B(g, 0.06, 0.04, 0.055, c1.x, 0.02, c1.z, mat(P.glinaB), 0, 0.7, 0);
    B(g, 0.05, 0.035, 0.05, c2.x, 0.017, c2.z, mat(P.glinaC), 0, -0.4, 0);
  });
}

// ========================= LAYOUT PARTII 3B ================================
/**
 * Osadzenie na heksie (wspolrzedne znormalizowane do HEX_R):
 * fort/posterunek w SRODKU heksa frontem (brama/drabina, +x) ku S-SE kamery gry;
 * irygacja/pole lekki skos dla czytelnosci; drogi bez rotacji (wstega wzdluz X);
 * zloza w pierscieniu 0.60-0.68 — srodek heksa WOLNY pod kopalnie.
 */
export const ULEPSZENIA_P3B_LAYOUT = {
  hexR: 1.0,
  fort: { budynek: { x: 0, z: 0, rotY: -1.05 } },
  posterunek: { budynek: { x: 0, z: 0, rotY: -1.15 } },
  irygacja: { budynek: { x: 0, z: 0, rotY: -0.30 } },
  pole_irygowane: { budynek: { x: 0, z: 0, rotY: -0.18 } },
  droga: { rotY: 0 },
  zloza: {
    miedz: [
      { az: 15, r: 0.62, s: 1.0, rotY: 0.4 }, { az: 105, r: 0.66, s: 0.85, rotY: 2.1 },
      { az: 190, r: 0.60, s: 0.92, rotY: -0.7 }, { az: 295, r: 0.68, s: 0.78, rotY: 1.2 },
    ],
    zelazo: [
      { az: 40, r: 0.64, s: 1.0, rotY: -0.3 }, { az: 130, r: 0.60, s: 0.88, rotY: 1.5 },
      { az: 235, r: 0.66, s: 0.95, rotY: 0.6 }, { az: 320, r: 0.62, s: 0.8, rotY: -1.1 },
    ],
    wegiel: [
      { az: 10, r: 0.60, s: 1.0, rotY: 0.2 }, { az: 120, r: 0.66, s: 0.9, rotY: -0.8 },
      { az: 205, r: 0.62, s: 0.85, rotY: 1.7 }, { az: 300, r: 0.64, s: 0.95, rotY: 0.9 },
    ],
    sol: [
      { az: 30, r: 0.62, s: 1.0, rotY: 0.5 }, { az: 210, r: 0.64, s: 0.9, rotY: -0.4 },
      { az: 280, r: 0.60, s: 0.82, rotY: 1.3 }, { az: 345, r: 0.68, s: 0.9, rotY: 2.2 },
    ],
    glina: [
      { az: 55, r: 0.62, s: 1.0, rotY: 0.3 }, { az: 145, r: 0.64, s: 0.9, rotY: -1.2 },
      { az: 250, r: 0.62, s: 0.95, rotY: 0.8 }, { az: 330, r: 0.60, s: 0.85, rotY: 1.9 },
    ],
  },
} as const;
