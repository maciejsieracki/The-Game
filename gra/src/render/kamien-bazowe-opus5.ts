/**
 * kamien-bazowe-opus5.ts — WARIANT PORÓWNAWCZY: 4 jednostki BAZOWE epoki KAMIENIA
 * ---------------------------------------------------------------------------
 * Drop-in zgodny z builderami z `jednostki-p1-rdzen.ts`:
 *   buildWojownikOpus5(c)   <->  buildWojownikKamien(c)   (Swordsman, „Wojownik")
 *   buildOszczepnikOpus5(c) <->  buildOszczepnik(c)       (Distance,  „Oszczepnik")
 *   buildLucznikOpus5(c)    <->  buildLucznik(c)          (Distance,  „Łucznik")
 *   buildZwiadowcaOpus5(c)  <->  buildZwiadowca(c)        (Civilian,  „Zwiadowca")
 *
 * Ta sama sygnatura `(ownerColor: number) => THREE.Group`, ta sama rodzina
 * wymiarów (P1_… / HO_… → KB_…), stopy na y = 0, przód = +Z, układ prawoskrętny
 * => LEWA ręka = +X (tarcza / łuk), PRAWA = -X (broń miotana / obuchowa).
 * `userData['mats']` + `userData['perTokenGeos']` jak w całej serii; wszystkie
 * geometrie są SINGLETONAMI modułu (perTokenGeos zawsze puste), zwalnianie
 * przez `disposeKamienBazoweOpus5Geometries()`.
 *
 * NIE MODYFIKUJE istniejących modeli — to osobny wariant do porównania
 * wizualnego (dyspozycje/PODGLAD-KAMIEN-BAZOWE.html).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — NEOLIT / CHALKOLIT ŚRODKOWEJ EUROPY, ok. 5500–2500 p.n.e.
 * ===========================================================================
 * ZASADA NADRZĘDNA: **ZERO METALU.** Żadnego brązu, żelaza, stali, ani nawet
 * miedzi. Wszystkie ostrza, groty i okucia: krzemień, poroże, kość, kamień
 * gładzony. Oprawa: drewno, ścięgno, rzemień, łyko lipowe, żywica brzozowa.
 *
 * Podstawa faktograficzna (zespoły referencyjne, nie filmy):
 *   [Ö]  Ötzi / „Człowiek z Similaun", ok. 3300 p.n.e. — jedyny KOMPLETNY
 *        zestaw wyposażenia neolitycznego wojownika-wędrowca, jaki mamy:
 *        czapa z niedźwiedziej skóry na rzemieniu podbródkowym; kaftan ze
 *        zszytych pasów skóry kozy; legginsy skórzane osobne na każdą nogę,
 *        podwiązane do pasa; buty (podeszwa z niedźwiedziej skóry, cholewka
 *        z jeleniej, wyplot z łyka lipowego, wypełnienie trawą); PŁASZCZ
 *        PLECIONY Z TRAWY; plecak na RAMIE Z LESZCZYNY; kołczan ze skóry
 *        kozicy usztywniony leszczynowym prętem; łuk cisowy dł. 1,82 m
 *        (niedokończony); nóż krzemienny w pochewce z łyka; zestaw krzesiwa.
 *   [H]  Łuki typu Holmegaard (mezolit/neolit, Dania) — wiąz, szerokie płaskie
 *        ramiona, wąskie końce, długość ~150–180 cm. NIE łuk refleksyjny/
 *        kompozytowy (ten pojawia się w Eurazji dopiero w epoce brązu).
 *   [T]  Toporki krzemienne gładzone w oprawie z PORÓŻA (mufa amortyzująca)
 *        na drewnianym trzonku — standard neolityczny od kultury wstęgowej po
 *        pucharowe; poroże chroni drewno przed rozłupaniem przy uderzeniu.
 *   [B]  Kultura pucharów dzwonowatych (ok. 2500 p.n.e.): kamienne/kościane
 *        NARAMIENNIKI ŁUCZNICZE (wristguard, „bracer”) wiązane do lewego
 *        przedramienia — najbardziej rozpoznawalny atrybut łucznika epoki
 *        kamienia; trójkątne groty strzał z zadziorami i wklęsłą podstawą.
 *   [A]  Atlatl / propulsor (miotacz oszczepów) — technologia górnopaleolityczna
 *        (magdalenien, propulsory z poroża), używana równolegle z łukiem;
 *        patrz DECYZJE, pkt 2.
 *
 * DECYZJE (świadome, z uzasadnieniem — nie zgadywanie):
 *   1. WOJOWNIK — TOPÓR KRZEMIENNY W MUFIE Z POROŻA, nie „maczugo-miecz”.
 *      Krzemień jest kruchy i nie znosi obciążeń giętnych, więc długie ostrze
 *      sieczne z krzemienia jest fizycznie nierealne. Model obecny w grze ma
 *      płaską klingę krzemienną ~2× dłuższą niż szeroką osadzoną na trzonku —
 *      to sylwetka macuahuitl (aztecka maczuga obsydianowa, XV w. n.e.,
 *      Mezoameryka), a nie broń neolitycznej Europy. Zastąpione toporem [T].
 *   2. OSZCZEPNIK — ATLATL (miotacz) świadomie DODANY. W neolicie Europy łuk
 *      wypiera atlatl, ale (a) atlatl nie znika nagle i współistnieje z łukiem,
 *      (b) w grze Oszczepnik i Łucznik to DWIE odrębne jednostki dystansowe
 *      i muszą się różnić sylwetką z 52°, (c) statystyki z units.json wprost
 *      to potwierdzają: Oszczepnik ma zasięg 2 heksy i 6 pocisków, Łucznik 3
 *      heksy i 12 pocisków — czyli krótszy zasięg i mniejszy zapas, dokładnie
 *      profil miotacza oszczepów. Uwaga w units.json dla inkaskiej wersji
 *      jednostki mówi wprost „estólica/atlatl”, więc atlatl jest już przyjęty
 *      w danych gry jako broń tej linii. Świadomie POMINIĘTO obciążnik
 *      typu „bannerstone” — to artefakt archaicznej Ameryki Północnej, nie
 *      Europy, a jego funkcja jest sporna.
 *   3. ŁUCZNIK — łuk PROSTY (self bow) typu Holmegaard [H], długi (rozpiętość
 *      ~0,62×HEX_R przy figurce 0,75×HEX_R, czyli prawie wzrost strzelca —
 *      obecny model ma łuczek o promieniu 0,14×HEX_R, tj. ~1/3 wzrostu, co
 *      odpowiada łukowi jeździeckiemu z epoki żelaza). Ramiona szerokie
 *      i płaskie, końce wąskie, cięciwa ze ścięgna. Naramiennik łuczniczy [B]
 *      na LEWYM przedramieniu. Kołczan skórzany z prętem usztywniającym [Ö].
 *      Groty strzał: krzemienne, trójkątne, z ZADZIORAMI [B]. Lotki po TRZY
 *      (nie dwie — pióra klei się w trójkę, inaczej strzała nie stabilizuje).
 *   4. ZWIADOWCA — kompletny „Ötzi” [Ö]: czapa z niedźwiedziej skóry z paskiem
 *      podbródkowym, PŁASZCZ PLECIONY Z TRAWY, plecak na ramie z leszczyny,
 *      nóż krzemienny w pochewce z łyka, sakwa z krzesiwem, kij leszczynowy.
 *      BEZ broni ofensywnej — statystyki: Atak 0, Pancerz 0, Widok 5, typ
 *      Civilian. Świadomie POMINIĘTO procę: Procarz to osobna jednostka
 *      (epoka brązu) i duplikowanie jego atrybutu psułoby czytelność ról.
 *   5. TARCZA WOJOWNIKA — statystyki uzasadniają (Obrona 6, Pancerz 4 —
 *      najwyższe w czwórce). Z neolitu Europy nie zachowała się ŻADNA tarcza
 *      (drewno/skóra/wiklina nie przetrwają), więc forma jest rekonstrukcją:
 *      rama drewniana wielobocznа (prostą ramę łatwiej zbić niż okrągłą),
 *      wyplot wikliny, lico obciągnięte skórą. ŚWIADOMIE ODRZUCONO okrągłą
 *      tarczę z metalowym UMBEM z modelu obecnego — umbo to konstrukcja
 *      epoki brązu/żelaza (wymaga blachy), w kamieniu nie ma z czego go zrobić.
 *   6. FIGURY MĘSKIE, brodate, opalone — populacja neolitycznej Europy;
 *      malowanie ochrą na twarzy (Oszczepnik) — ochra czerwona to najlepiej
 *      poświadczony pigment pradziejowy, obecny w pochówkach od paleolitu.
 *   7. NIE użyto obsydianu: w Europie Środkowej występuje śladowo (Karpaty),
 *      krzemień jest surowcem właściwym dla regionu odniesienia.
 *
 * Budżet docelowy: ~65–85 mesh / ~900–1400 tri na figurkę
 * (modele obecne w grze: ~35–50 mesh / ~380–520 tri).
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

type MatFactory = (color: number, metalness?: number, roughness?: number,
                   transparent?: boolean, opacity?: number) => THREE.MeshStandardMaterial;

function makeMats(): { mats: THREE.Material[]; mat: MatFactory } {
  const mats: THREE.Material[] = [];
  const mat: MatFactory = (color, metalness = 0.1, roughness = 0.7, transparent = false, opacity = 1.0) => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness, transparent, opacity });
    mats.push(m);
    return m;
  };
  return { mats, mat };
}

// ── paleta: rozszerzenie palety serii (jednostki-p1-rdzen) — ZERO METALI ───
const KB_SKIN      = 0xd9a464;   // karnacja opalona
const KB_SKIN_DK   = 0xbb8548;   // cień twarzy / dłonie
const KB_SKIN_DEEP = 0xa87439;   // korpus odsłonięty (Oszczepnik)
const KB_HAIR      = 0x4d3a26;   // włosy / broda (rozjaśnione — z 52° nie mogą czernieć)
const KB_FUR_DK    = 0x5f4a30;   // futro ciemne (niedźwiedź)
const KB_FUR_LT    = 0x8a6f4d;   // futro jaśniejsze / skóra surowa
const KB_FUR_WH    = 0xbfae90;   // futro jasne (kozica) — tobołek zwiadowcy
const KB_LEATHER   = 0x6b4a28;
const KB_LEATH_DK  = 0x4b3319;
const KB_LEATH_LT  = 0x96703f;
const KB_WOOD      = 0x7a5c3a;   // drewno sezonowane (trzonki)
const KB_WOOD_DK   = 0x5c452c;
const KB_WOOD_LT   = 0x9c7a4e;   // leszczyna / cis świeży
const KB_FLINT     = 0x8d9298;   // krzemień (chłodny szary, szklisty przełam)
const KB_FLINT_DK  = 0x6d737a;   // krzemień w cieniu / negatywy odłupań
const KB_ANTLER    = 0xcbb489;   // poroże (mufa toporu, hak atlatla)
const KB_BONE      = 0xe6ddc2;   // kość / kły / lotki
const KB_SINEW     = 0xd8cfb4;   // ścięgno: cięciwa i wiązania
const KB_RESIN     = 0x33261a;   // żywica brzozowa (klej) — prawie czarna
const KB_OCHRE     = 0xb4652a;   // ochra czerwona (barwnik, malowanie twarzy)
const KB_GRASS     = 0xb9a877;   // trawa pleciona (płaszcz Ötziego)
const KB_WICKER    = 0xa8875a;   // wiklina (wyplot tarczy)
const KB_LINEN     = 0xcfc3a4;   // len / plecionka lipowa

// ── wymiary sylwetki: TE SAME co rodzina P1_*/HO_* (porównywalność 1:1) ────
const KB_HIP_Y     = 0.208 * HEX_R;
const KB_TORSO_W   = 0.180 * HEX_R;
const KB_TORSO_H   = 0.205 * HEX_R;
const KB_TORSO_D   = 0.100 * HEX_R;
const KB_TORSO_BOT = 0.240 * HEX_R;
const KB_TORSO_CTR = KB_TORSO_BOT + KB_TORSO_H * 0.5;
const KB_TORSO_TOP = KB_TORSO_BOT + KB_TORSO_H;
const KB_NECK_H    = 0.028 * HEX_R;
const KB_HEAD_S    = 0.128 * HEX_R;
const KB_HEAD_CTR  = KB_TORSO_TOP + KB_NECK_H + KB_HEAD_S * 0.5;
const KB_HEAD_TOP  = KB_TORSO_TOP + KB_NECK_H + KB_HEAD_S;
const KB_SHLD_X    = KB_TORSO_W * 0.5 + 0.030 * HEX_R;
const KB_SHLD_Y    = KB_TORSO_TOP - 0.024 * HEX_R;
const KB_HIP_X     = 0.052 * HEX_R;
const KB_THIGH_L   = 0.104 * HEX_R;
const KB_SHIN_L    = 0.096 * HEX_R;
const KB_UPARM_L   = 0.100 * HEX_R;
const KB_FOREARM_L = 0.092 * HEX_R;

// ── rejestr geometrii-singletonów (wspólny dla 4 builderów) ────────────────
const kbGeos: Record<string, THREE.BufferGeometry> = {};

function getG<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = kbGeos[key] as T | undefined;
  if (g === undefined) { g = make(); kbGeos[key] = g; }
  return g;
}
const gBox = (k: string, w: number, h: number, d: number): THREE.BoxGeometry =>
  getG(k, () => new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R));
const gCyl = (k: string, rt: number, rb: number, h: number, seg: number, open = false): THREE.CylinderGeometry =>
  getG(k, () => new THREE.CylinderGeometry(rt * HEX_R, rb * HEX_R, h * HEX_R, seg, 1, open));
const gCone = (k: string, r: number, h: number, seg: number): THREE.ConeGeometry =>
  getG(k, () => new THREE.ConeGeometry(r * HEX_R, h * HEX_R, seg, 1));

/** Zwolnienie WSZYSTKICH singletonów modułu (konwencja disposeUnitGeometries). */
export function disposeKamienBazoweOpus5Geometries(): void {
  for (const k of Object.keys(kbGeos)) {
    kbGeos[k]?.dispose();
    delete kbGeos[k];
  }
}

// ---------------------------------------------------------------------------
// GEOMETRIA ZBIEŻNA (taper) — bryła z pierścieni prostokątnych [y, halfW, halfT].
// Służy do wszystkiego, co w epoce kamienia jest ODŁUPANE albo GŁADZONE:
// siekiera-celt, grot liściowaty oszczepu, grot strzały. Oś Y, baza w y = 0.
// ---------------------------------------------------------------------------
function makeTaperGeo(sections: [number, number, number][]): THREE.BufferGeometry {
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const quad = (
    a: [number, number, number], b: [number, number, number],
    c: [number, number, number], d: [number, number, number],
  ) => { P(...a); P(...b); P(...c); P(...a); P(...c); P(...d); };

  for (let i = 0; i < sections.length - 1; i++) {
    const s0 = sections[i]!, s1 = sections[i + 1]!;
    const [y0, w0, t0] = s0, [y1, w1, t1] = s1;
    // przód (+Z) i tył (-Z)
    quad([-w0, y0, t0], [w0, y0, t0], [w1, y1, t1], [-w1, y1, t1]);
    quad([w0, y0, -t0], [-w0, y0, -t0], [-w1, y1, -t1], [w1, y1, -t1]);
    // krawędzie boczne
    quad([w0, y0, t0], [w0, y0, -t0], [w1, y1, -t1], [w1, y1, t1]);
    quad([-w0, y0, -t0], [-w0, y0, t0], [-w1, y1, t1], [-w1, y1, -t1]);
  }
  // domknięcie podstawy (obuch)
  const b = sections[0]!;
  quad([-b[1], b[0], -b[2]], [b[1], b[0], -b[2]], [b[1], b[0], b[2]], [-b[1], b[0], b[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/** Siekierka gładzona (celt): obuch wąski → ostrze szerokie i cienkie. */
function makeCeltGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  return makeTaperGeo(([
    [0.00, 0.50, 0.82], [0.34, 0.66, 1.00], [0.76, 0.94, 0.70], [1.00, 1.00, 0.10],
  ] as [number, number, number][]).map(([y, w, t]) => [y * len, w * wMax * 0.5, t * tMax * 0.5]));
}

/** Grot liściowaty (oszczep): trzpień → największa szerokość w 1/2 → ostrze. */
function makeLeafPointGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  return makeTaperGeo(([
    [0.00, 0.30, 0.55], [0.16, 0.80, 1.00], [0.46, 1.00, 0.92],
    [0.76, 0.66, 0.60], [1.00, 0.05, 0.14],
  ] as [number, number, number][]).map(([y, w, t]) => [y * len, w * wMax * 0.5, t * tMax * 0.5]));
}

/** Grot strzały: trójkątny, ZADZIORY u podstawy (kultura pucharów dzwonowatych). */
function makeBarbedPointGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  return makeTaperGeo(([
    [0.00, 0.16, 0.40], [0.10, 1.00, 0.90], [0.24, 0.86, 1.00],
    [0.66, 0.48, 0.66], [1.00, 0.05, 0.16],
  ] as [number, number, number][]).map(([y, w, t]) => [y * len, w * wMax * 0.5, t * tMax * 0.5]));
}

// ---------------------------------------------------------------------------
// Kinematyka łańcuchowa — konwencja serii: theta od pionu W DÓŁ,
// +theta = ku przodowi (+Z); mesh o osi Y kładzie się z rotation.x = PI - theta.
// ---------------------------------------------------------------------------
function kbDir(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function kbSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = kbDir(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Mesh o osi Y i bazowej wysokości `baseH` rozpięty między punktami A→B. */
function kbSpan(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, baseH: number,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  const dir = B.clone().sub(A);
  const len = dir.length();
  dir.normalize();
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
  mesh.scale.y = len / baseH;
  mesh.position.copy(A.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return mesh;
}

/**
 * BUT NEOLITYCZNY [Ö]: podeszwa z niedźwiedziej skóry + cholewka z jeleniej
 * + oplot z łyka lipowego (2 wiązania). Obecny model gry ma tu jeden klocek.
 */
function kbBoot(
  group: THREE.Group, sx: number, footZ: number,
  mSole: THREE.MeshStandardMaterial, mUpper: THREE.MeshStandardMaterial,
  mBind: THREE.MeshStandardMaterial,
): void {
  const sole = new THREE.Mesh(gBox('kbSole', 0.050, 0.014, 0.086), mSole);
  sole.position.set(sx, 0.007 * HEX_R, footZ);
  group.add(sole);
  const upper = new THREE.Mesh(gBox('kbBootUp', 0.046, 0.036, 0.062), mUpper);
  upper.position.set(sx, 0.030 * HEX_R, footZ - 0.006 * HEX_R);
  group.add(upper);
  const toe = new THREE.Mesh(gBox('kbBootToe', 0.042, 0.020, 0.028), mUpper);
  toe.position.set(sx, 0.020 * HEX_R, footZ + 0.036 * HEX_R);
  group.add(toe);
  for (const dz of [-0.014, 0.012]) {
    const bd = new THREE.Mesh(gBox('kbBootBind', 0.052, 0.008, 0.030), mBind);
    bd.position.set(sx, 0.040 * HEX_R, footZ + dz * HEX_R);
    group.add(bd);
  }
}

/** Stopa bosa z rzemieniem na kostce (Oszczepnik — lekki, bez obuwia). */
function kbBareFoot(
  group: THREE.Group, sx: number, footZ: number,
  mSkin: THREE.MeshStandardMaterial, mBind: THREE.MeshStandardMaterial,
): void {
  const f = new THREE.Mesh(gBox('kbFoot', 0.044, 0.026, 0.082), mSkin);
  f.position.set(sx, 0.013 * HEX_R, footZ);
  group.add(f);
  const toes = new THREE.Mesh(gBox('kbToes', 0.042, 0.016, 0.020), mSkin);
  toes.position.set(sx, 0.008 * HEX_R, footZ + 0.048 * HEX_R);
  group.add(toes);
  const bd = new THREE.Mesh(gBox('kbAnkBind', 0.046, 0.010, 0.036), mBind);
  bd.position.set(sx, 0.036 * HEX_R, footZ - 0.014 * HEX_R);
  group.add(bd);
}

type FootFn = (group: THREE.Group, sx: number, footZ: number) => void;

/** Noga: udo (thU) + goleń (thL) + stopa (dostarczona przez FootFn). */
function kbBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  foot: FootFn, hipY: number,
): THREE.Vector3 {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = kbSeg(group, gBox('kbThigh', 0.056, 0.104, 0.060), mThigh, P, thU, KB_THIGH_L);
  P.z -= 0.004 * HEX_R; P.y += 0.008 * HEX_R;
  const knee = new THREE.Mesh(gBox('kbKnee', 0.048, 0.026, 0.050), mThigh);
  knee.position.copy(P.clone().add(new THREE.Vector3(0, 0.006 * HEX_R, 0.004 * HEX_R)));
  group.add(knee);
  P = kbSeg(group, gBox('kbShin', 0.038, 0.096, 0.042), mShin, P, thL, KB_SHIN_L);
  foot(group, sx, P.z + 0.016 * HEX_R);
  return P;
}

/** Ramię: ramię + przedramię + pięść. Zwraca nadgarstek i OŚ PRZEDRAMIENIA. */
function kbBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, KB_SHLD_Y, 0);
  P = kbSeg(group, gBox('kbUpArm', 0.054, 0.100, 0.054), mUp, P, thU, KB_UPARM_L);
  const elbow = P.clone();
  P.y += 0.010 * HEX_R;
  const wrist = kbSeg(group, gBox('kbForearm', 0.040, 0.092, 0.040), mFore, P, thF, KB_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(gBox('kbFist', 0.046, 0.046, 0.048), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(kbDir(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: kbDir(thF), elbow };
}

/** Bark (deltoid) — dodaje masy sylwetce widzianej z 52°. */
function kbShoulder(group: THREE.Group, sx: number, mtl: THREE.MeshStandardMaterial): void {
  const d = new THREE.Mesh(gBox('kbDelt', 0.052, 0.052, 0.072), mtl);
  d.position.set(sx * (KB_TORSO_W * 0.5 + 0.014 * HEX_R), KB_SHLD_Y + 0.014 * HEX_R, 0);
  group.add(d);
}

/** Tors: brzuch + szersza klatka piersiowa + oba barki. */
function kbBuildTorso(group: THREE.Group, mTorso: THREE.MeshStandardMaterial): void {
  const torso = new THREE.Mesh(gBox('kbTorso', 0.180, 0.205, 0.100), mTorso);
  torso.position.set(0, KB_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(gBox('kbChest', 0.187, 0.072, 0.106), mTorso);
  chest.position.set(0, KB_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  kbShoulder(group, 1, mTorso);
  kbShoulder(group, -1, mTorso);
}

/** Szyja + głowa + twarz (żuchwa, nos, łuk brwiowy, oczy) + włosy + broda. */
function kbBuildHead(
  group: THREE.Group,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  mHair: THREE.MeshStandardMaterial, mDark: THREE.MeshStandardMaterial,
  beard: boolean,
): void {
  const neck = new THREE.Mesh(gBox('kbNeck', 0.044, 0.046, 0.044), mSkin);
  neck.position.set(0, KB_TORSO_TOP + KB_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(gBox('kbHead', 0.128, 0.128, 0.128), mSkin);
  head.position.set(0, KB_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(gBox('kbJaw', 0.086, 0.034, 0.040), mSkinDk);
  jaw.position.set(0, KB_HEAD_CTR - KB_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(gBox('kbNose', 0.020, 0.028, 0.018), mSkin);
  nose.position.set(0, KB_HEAD_CTR - 0.002 * HEX_R, KB_HEAD_S * 0.5 + 0.007 * HEX_R);
  group.add(nose);
  const brow = new THREE.Mesh(gBox('kbBrow', 0.104, 0.014, 0.016), mSkinDk);
  brow.rotation.x = 0.12;
  brow.position.set(0, KB_HEAD_CTR + 0.032 * HEX_R, KB_HEAD_S * 0.5 + 0.003 * HEX_R);
  group.add(brow);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(gBox('kbEye', 0.018, 0.011, 0.008), mDark);
    eye.position.set(sx * 0.026 * HEX_R, KB_HEAD_CTR + 0.014 * HEX_R, KB_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
  }
  const hairB = new THREE.Mesh(gBox('kbHairB', 0.126, 0.104, 0.026), mHair);
  hairB.position.set(0, KB_HEAD_CTR - 0.006 * HEX_R, -(KB_HEAD_S * 0.5 + 0.011 * HEX_R));
  group.add(hairB);
  for (const sx of [-1, 1]) {
    const hs = new THREE.Mesh(gBox('kbHairS', 0.018, 0.082, 0.086), mHair);
    hs.position.set(sx * (KB_HEAD_S * 0.5 + 0.006 * HEX_R), KB_HEAD_CTR - 0.010 * HEX_R, -0.018 * HEX_R);
    group.add(hs);
  }
  if (beard) {
    const bd = new THREE.Mesh(gBox('kbBeard', 0.082, 0.050, 0.034), mHair);
    bd.position.set(0, KB_HEAD_CTR - 0.070 * HEX_R, 0.022 * HEX_R);
    group.add(bd);
  }
}

/** Szarfa koloru gracza na piersi — slot tintu, jak w całej serii. */
function kbOwnerSash(group: THREE.Group, mOwner: THREE.MeshStandardMaterial): void {
  const s = new THREE.Mesh(gBox('kbSash', 0.186, 0.032, 0.106), mOwner);
  s.position.set(0, KB_TORSO_CTR - 0.014 * HEX_R, 0);
  group.add(s);
}

/** Spódnica ze skór + pas + (opcjonalnie) frędzle dolnej krawędzi. */
function kbSkirtBelt(
  group: THREE.Group, mSkirt: THREE.MeshStandardMaterial,
  mBelt: THREE.MeshStandardMaterial, mFringe: THREE.MeshStandardMaterial | null,
): void {
  const skirt = new THREE.Mesh(gBox('kbSkirt', 0.196, 0.070, 0.118), mSkirt);
  skirt.position.set(0, KB_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(gBox('kbBelt', 0.192, 0.030, 0.114), mBelt);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
  const bone = new THREE.Mesh(gBox('kbBuckle', 0.030, 0.024, 0.014), mFringe ?? mBelt);
  bone.position.set(0, 0.252 * HEX_R, KB_TORSO_D * 0.5 + 0.014 * HEX_R);
  group.add(bone);
  if (mFringe) {
    for (const sx of [-2, -1, 0, 1, 2]) {
      const fr = new THREE.Mesh(gBox('kbFringe', 0.022, 0.050, 0.010), mFringe);
      fr.position.set(sx * 0.040 * HEX_R, 0.176 * HEX_R, KB_TORSO_D * 0.5 + 0.010 * HEX_R);
      group.add(fr);
    }
  }
}

/** Czapa ze skóry z sierścią [Ö] — czasza + rant + pasek podbródkowy. */
function kbFurCap(
  group: THREE.Group, mFur: THREE.MeshStandardMaterial,
  mRim: THREE.MeshStandardMaterial, chinStrap: boolean,
): void {
  const cap = new THREE.Mesh(gCyl('kbCapBowl', 0.056, 0.086, 0.078, 10), mFur);
  cap.position.set(0, KB_HEAD_CTR + 0.054 * HEX_R, 0);
  group.add(cap);
  const rim = new THREE.Mesh(gCyl('kbCapRim', 0.090, 0.092, 0.026, 10), mRim);
  rim.position.set(0, KB_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(rim);
  const top = new THREE.Mesh(gBox('kbCapTop', 0.052, 0.022, 0.052), mFur);
  top.position.set(0, KB_HEAD_CTR + 0.100 * HEX_R, 0);
  group.add(top);
  if (chinStrap) {
    for (const sx of [-1, 1]) {
      const st = new THREE.Mesh(gBox('kbChin', 0.010, 0.086, 0.010), mRim);
      st.rotation.z = sx * 0.16;
      st.position.set(sx * (KB_HEAD_S * 0.5 + 0.006 * HEX_R), KB_HEAD_CTR - 0.010 * HEX_R, 0.020 * HEX_R);
      group.add(st);
    }
  }
}

/** Wiązanie ścięgnem/rzemieniem — pierścionek prostopadły do osi `dir`. */
function kbLashing(
  group: THREE.Group, key: string, w: number, h: number, d: number,
  mtl: THREE.MeshStandardMaterial, at: THREE.Vector3, rotX: number,
): void {
  const m = new THREE.Mesh(gBox(key, w, h, d), mtl);
  m.rotation.x = rotX;
  m.position.copy(at);
  group.add(m);
}

// ===========================================================================
// 1. WOJOWNIK (Swordsman, Atak 6 / Obrona 6 / Pancerz 4 / Ruch 2)
//    POZA: topór uniesiony do cięcia znad prawego barku, tarcza wysunięta.
//    UZBROJENIE: topór z krzemienia gładzonego w MUFIE Z POROŻA [T];
//    tarcza z wyplotu wikliny na ramie drewnianej, lico obciągnięte skórą
//    (kolor gracza); nóż krzemienny w pochewce z łyka za pasem [Ö].
//    STRÓJ: czapa z niedźwiedziej skóry [Ö], kaftan futrzany, legginsy
//    skórzane, buty neolityczne [Ö], naszyjnik z kłów.
// ===========================================================================
export function buildWojownikOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(KB_SKIN,      0.05, 0.80);
  const mSkinDk = mat(KB_SKIN_DK,   0.05, 0.82);
  const mHair   = mat(KB_HAIR,      0.04, 0.90);
  const mDark   = mat(0x14110d,     0.04, 0.88);
  const mFur    = mat(KB_FUR_DK,    0.03, 0.94);
  const mFurL   = mat(KB_FUR_LT,    0.03, 0.92);
  const mLeath  = mat(KB_LEATHER,   0.05, 0.86);
  const mLeathD = mat(KB_LEATH_DK,  0.05, 0.88);
  const mWood   = mat(KB_WOOD,      0.05, 0.85);
  const mWoodD  = mat(KB_WOOD_DK,   0.05, 0.87);
  const mFlint  = mat(KB_FLINT,     0.09, 0.38);
  const mFlintD = mat(KB_FLINT_DK,  0.09, 0.44);
  const mAntler = mat(KB_ANTLER,    0.05, 0.66);
  const mBone   = mat(KB_BONE,      0.05, 0.72);
  const mSinew  = mat(KB_SINEW,     0.02, 0.92);
  const mWicker = mat(KB_WICKER,    0.04, 0.88);
  const mOwner  = mat(ownerColor_,  0.08, 0.72);

  const HIP_Y = KB_HIP_Y - 0.012 * HEX_R;      // głęboki wypad

  // ═══ KORPUS: kaftan futrzany ════════════════════════════════════════════
  kbBuildTorso(group, mFur);
  kbBuildHead(group, mSkin, mSkinDk, mHair, mDark, true);
  kbSkirtBelt(group, mLeath, mLeathD, mFurL);
  kbOwnerSash(group, mOwner);

  // poły kaftana z przodu (dwa płaty zszytej skóry koziej) + kołnierz futrzany
  for (const sx of [-1, 1]) {
    const lap = new THREE.Mesh(gBox('wojLap', 0.078, 0.176, 0.020), mFurL);
    lap.rotation.z = sx * 0.05;
    lap.position.set(sx * 0.046 * HEX_R, KB_TORSO_CTR + 0.006 * HEX_R, KB_TORSO_D * 0.5 + 0.010 * HEX_R);
    group.add(lap);
  }
  const collar = new THREE.Mesh(gBox('wojCollar', 0.150, 0.028, 0.118), mFurL);
  collar.position.set(0, KB_TORSO_TOP - 0.004 * HEX_R, 0);
  group.add(collar);

  // naszyjnik z kłów (3 zawieszki kościane na rzemieniu)
  const cord = new THREE.Mesh(gBox('wojCord', 0.108, 0.008, 0.010), mLeathD);
  cord.position.set(0, KB_TORSO_TOP - 0.014 * HEX_R, KB_TORSO_D * 0.5 + 0.018 * HEX_R);
  group.add(cord);
  for (const sx of [-1, 0, 1]) {
    const fang = new THREE.Mesh(gCone('wojFang', 0.011, 0.040, 4), mBone);
    fang.rotation.x = Math.PI;
    fang.rotation.z = sx * 0.18;
    fang.position.set(sx * 0.034 * HEX_R, KB_TORSO_TOP - 0.040 * HEX_R, KB_TORSO_D * 0.5 + 0.018 * HEX_R);
    group.add(fang);
  }

  // ═══ NOGI: legginsy skórzane [Ö] + buty ═════════════════════════════════
  const boot: FootFn = (g, sx, fz) => kbBoot(g, sx, fz, mLeathD, mLeath, mSinew);
  kbBuildLeg(group,  KB_HIP_X,  0.60,  0.36, mLeath, mLeath, boot, HIP_Y);
  kbBuildLeg(group, -KB_HIP_X, -0.54, -0.22, mLeath, mLeath, boot, HIP_Y);
  // podwiązki legginsów do pasa (Ötzi: osobne nogawki, nie spodnie)
  for (const sx of [-1, 1]) {
    const gt = new THREE.Mesh(gBox('wojGarter', 0.012, 0.052, 0.012), mSinew);
    gt.position.set(sx * (KB_HIP_X + 0.026 * HEX_R), 0.222 * HEX_R, 0.028 * HEX_R);
    group.add(gt);
  }

  // ═══ GŁOWA: czapa z niedźwiedziej skóry + opaska koloru gracza ══════════
  kbFurCap(group, mFur, mLeathD, true);
  const band = new THREE.Mesh(gCyl('wojBand', 0.093, 0.093, 0.018, 10), mOwner);
  band.position.set(0, KB_HEAD_CTR + 0.044 * HEX_R, 0);
  group.add(band);

  // ═══ PRAWA (-X): TOPÓR KRZEMIENNY W MUFIE Z POROŻA [T] ══════════════════
  // Wszystko na osi przedramienia; ostrze PROSTOPADLE do trzonka, zwrócone
  // w kierunku uderzenia (przód-dół) — jak w prawdziwym toporze.
  const armR = kbBuildArm(group, -KB_SHLD_X, -2.18, 2.62, mFurL, mSkin, mSkinDk);
  const ax = armR.axis;
  const at = (d: number): THREE.Vector3 => armR.wrist.clone().addScaledVector(ax, d * HEX_R);
  const rotHaft = Math.PI - 2.62;

  const haft = new THREE.Mesh(gCyl('wojHaft', 0.014, 0.017, 0.330, 6), mWood);
  haft.rotation.x = rotHaft;
  haft.position.copy(at(0.108));
  group.add(haft);
  const butt = new THREE.Mesh(gBox('wojHaftButt', 0.026, 0.026, 0.026), mWoodD);
  butt.rotation.x = rotHaft;
  butt.position.copy(at(-0.062));
  group.add(butt);
  const thong = new THREE.Mesh(gBox('wojThong', 0.024, 0.012, 0.024), mLeathD);
  thong.rotation.x = rotHaft;
  thong.position.copy(at(-0.042));
  group.add(thong);
  // mufa z poroża jelenia — amortyzuje uderzenie, chroni trzonek przed pęknięciem
  const socket = new THREE.Mesh(gCyl('wojSocket', 0.023, 0.026, 0.060, 8), mAntler);
  socket.rotation.x = rotHaft;
  socket.position.copy(at(0.256));
  group.add(socket);
  for (const d of [0.226, 0.288]) {                    // wiązania ścięgnem
    kbLashing(group, 'wojLash', 0.036, 0.011, 0.036, mSinew, at(d), rotHaft);
  }
  // ostrze: siekierka gładzona, oś prostopadła do trzonka w płaszczyźnie YZ
  const perp = new THREE.Vector3(0, -ax.z, ax.y).normalize();   // przód-dół
  const celt = new THREE.Mesh(
    getG('wojCelt', () => makeCeltGeo(0.114 * HEX_R, 0.058 * HEX_R, 0.026 * HEX_R)), mFlint);
  celt.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), perp);
  celt.position.copy(at(0.268).addScaledVector(perp, 0.014 * HEX_R));
  group.add(celt);
  const celtShade = new THREE.Mesh(gBox('wojCeltSh', 0.052, 0.010, 0.018), mFlintD);
  celtShade.quaternion.copy(celt.quaternion);
  celtShade.position.copy(at(0.268).addScaledVector(perp, 0.086 * HEX_R));
  group.add(celtShade);
  // klin drewniany rozklinowujący ostrze w mufie
  const wedge = new THREE.Mesh(gBox('wojWedge', 0.020, 0.030, 0.014), mWoodD);
  wedge.quaternion.copy(celt.quaternion);
  wedge.position.copy(at(0.268).addScaledVector(perp, -0.012 * HEX_R));
  group.add(wedge);

  // ═══ NÓŻ KRZEMIENNY w pochewce z łyka za pasem [Ö] ══════════════════════
  const knX = -(KB_TORSO_W * 0.5 + 0.020 * HEX_R);
  const sheath = new THREE.Mesh(gBox('wojSheath', 0.026, 0.084, 0.016), mWicker);
  sheath.rotation.z = -0.14;
  sheath.position.set(knX, 0.208 * HEX_R, 0.026 * HEX_R);
  group.add(sheath);
  const knHilt = new THREE.Mesh(gBox('wojKnHilt', 0.020, 0.034, 0.014), mWood);
  knHilt.rotation.z = -0.14;
  knHilt.position.set(knX - 0.008 * HEX_R, 0.262 * HEX_R, 0.026 * HEX_R);
  group.add(knHilt);

  // ═══ LEWA (+X): TARCZA — rama drewniana, wyplot wikliny, lico ze skóry ══
  const armL = kbBuildArm(group, KB_SHLD_X, 0.48, 1.06, mFurL, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.026 * HEX_R,
    armL.wrist.y + 0.040 * HEX_R,
    armL.wrist.z + 0.046 * HEX_R,
  );
  sh.rotation.y = -0.22;
  sh.rotation.z = 0.05;

  // rama: ośmiobok wydłużony pionowo (prostą ramę łatwiej zbić niż okrąg)
  const frame = new THREE.Mesh(gCyl('wojShFrame', 0.108, 0.108, 0.030, 8, true), mWood);
  frame.rotation.x = Math.PI / 2;
  frame.scale.set(1.0, 1.0, 1.34);
  sh.add(frame);
  // lico obciągnięte skórą barwioną = KOLOR GRACZA (slot tintu)
  const face = new THREE.Mesh(gCyl('wojShFace', 0.100, 0.094, 0.020, 8), mOwner);
  face.rotation.x = Math.PI / 2;
  face.scale.set(1.0, 1.0, 1.34);
  face.position.set(0, 0, 0.004 * HEX_R);
  sh.add(face);
  // wyplot wikliny widoczny przez/na licu — 4 pręty poziome + 2 pionowe
  for (const [dy, w, key] of [
    [0.108, 0.108, 'wojShRodS'], [0.040, 0.176, 'wojShRodL'],
    [-0.040, 0.176, 'wojShRodL'], [-0.108, 0.108, 'wojShRodS'],
  ] as [number, number, string][]) {
    const rod = new THREE.Mesh(gBox(key, w, 0.014, 0.010), mWicker);
    rod.position.set(0, dy * HEX_R, 0.014 * HEX_R);
    sh.add(rod);
  }
  for (const dx of [-0.044, 0.044]) {
    const rod = new THREE.Mesh(gBox('wojShRodV', 0.013, 0.250, 0.009), mWicker);
    rod.position.set(dx * HEX_R, 0, 0.017 * HEX_R);
    sh.add(rod);
  }
  // wzmocnienie środkowe z twardego drewna (zamiast metalowego umba — patrz nagłówek pkt 5)
  const bossW = new THREE.Mesh(gBox('wojShBoss', 0.056, 0.056, 0.022), mWoodD);
  bossW.position.set(0, 0, 0.022 * HEX_R);
  sh.add(bossW);
  const bossPeg = new THREE.Mesh(gCyl('wojShPeg', 0.010, 0.016, 0.024, 6), mAntler);
  bossPeg.rotation.x = Math.PI / 2;
  bossPeg.position.set(0, 0, 0.036 * HEX_R);
  sh.add(bossPeg);
  // obszycie krawędzi rzemieniem (4 klamry) — skóra przyszyta do ramy
  for (const [dx, dy] of [[0, 0.140], [0, -0.140], [0.102, 0], [-0.102, 0]] as [number, number][]) {
    const st = new THREE.Mesh(gBox('wojShStitch', 0.026, 0.016, 0.034), mLeathD);
    st.position.set(dx * HEX_R, dy * HEX_R, 0.004 * HEX_R);
    sh.add(st);
  }
  // chwyt z tyłu: poprzeczka + pętla skórzana na przedramię
  const grip = new THREE.Mesh(gBox('wojShGrip', 0.056, 0.016, 0.016), mWood);
  grip.position.set(0, -0.020 * HEX_R, -0.030 * HEX_R);
  sh.add(grip);
  const loop = new THREE.Mesh(gBox('wojShLoop', 0.072, 0.020, 0.012), mLeathD);
  loop.position.set(0, 0.026 * HEX_R, -0.026 * HEX_R);
  sh.add(loop);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// 2. OSZCZEPNIK (Distance, Atak dyst. 5 / zasięg 2 hex / 6 pocisków)
//    POZA: rzut z ATLATLEM — prawa ręka odwiedziona w tył-górę, oszczep leży
//    na miotaczu, hak z poroża opiera się o piętkę drzewca.
//    UZBROJENIE: atlatl [A] + oszczep z grotem krzemiennym liściowatym
//    (wiązanie ścięgnem + żywica brzozowa), 2 zapasowe oszczepy w lewej.
//    STRÓJ: minimalny — przepaska, opaska na włosach (kolor gracza), pióro,
//    malowanie ochrą na twarzy, bose stopy z rzemieniem na kostce.
// ===========================================================================
export function buildOszczepnikOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(KB_SKIN_DEEP, 0.05, 0.78);
  const mSkinDk = mat(KB_SKIN_DK,   0.05, 0.82);
  const mHair   = mat(KB_HAIR,      0.04, 0.90);
  const mDark   = mat(0x14110d,     0.04, 0.88);
  const mLeath  = mat(KB_LEATHER,   0.05, 0.86);
  const mLeathD = mat(KB_LEATH_DK,  0.05, 0.88);
  const mFurL   = mat(KB_FUR_LT,    0.03, 0.92);
  const mWood   = mat(KB_WOOD,      0.05, 0.84);
  const mWoodL  = mat(KB_WOOD_LT,   0.05, 0.82);
  const mFlint  = mat(KB_FLINT,     0.09, 0.38);
  const mAntler = mat(KB_ANTLER,    0.05, 0.66);
  const mBone   = mat(KB_BONE,      0.05, 0.72);
  const mSinew  = mat(KB_SINEW,     0.02, 0.92);
  const mResin  = mat(KB_RESIN,     0.06, 0.60);
  const mOchre  = mat(KB_OCHRE,     0.04, 0.84);
  const mOwner  = mat(ownerColor_,  0.08, 0.72);

  const HIP_Y = KB_HIP_Y - 0.012 * HEX_R;

  // ═══ KORPUS: naga opalona skóra + przepaska + pas ukośny ════════════════
  kbBuildTorso(group, mSkin);
  kbBuildHead(group, mSkin, mSkinDk, mHair, mDark, false);
  kbSkirtBelt(group, mFurL, mLeath, null);
  kbOwnerSash(group, mOwner);

  // baldryk skórzany (na nim wisi zapas) — ukośnie przez pierś
  const baldric = new THREE.Mesh(gBox('oszBaldric', 0.026, 0.238, 0.014), mLeath);
  baldric.rotation.z = 0.58;
  baldric.position.set(0, KB_TORSO_CTR + 0.028 * HEX_R, KB_TORSO_D * 0.5 + 0.007 * HEX_R);
  group.add(baldric);
  const baldricB = new THREE.Mesh(gBox('oszBaldricB', 0.026, 0.230, 0.012), mLeathD);
  baldricB.rotation.z = -0.54;
  baldricB.position.set(0, KB_TORSO_CTR + 0.026 * HEX_R, -(KB_TORSO_D * 0.5 + 0.007 * HEX_R));
  group.add(baldricB);
  // żebra / muskulatura zaznaczona (torso odsłonięte)
  for (const dy of [0.036, 0.006]) {
    const rib = new THREE.Mesh(gBox('oszRib', 0.120, 0.010, 0.012), mSkinDk);
    rib.position.set(0, KB_TORSO_CTR + dy * HEX_R, KB_TORSO_D * 0.5 + 0.004 * HEX_R);
    group.add(rib);
  }
  // naszyjnik z przewierconych muszli
  for (const sx of [-1, 0, 1]) {
    const sl = new THREE.Mesh(gCyl('oszShell', 0.012, 0.012, 0.007, 6), mBone);
    sl.rotation.x = Math.PI / 2;
    sl.position.set(sx * 0.026 * HEX_R, KB_TORSO_TOP - 0.020 * HEX_R, KB_TORSO_D * 0.5 + 0.014 * HEX_R);
    group.add(sl);
  }

  // ═══ NOGI: bose, rzemienie na kostkach ══════════════════════════════════
  const bare: FootFn = (g, sx, fz) => kbBareFoot(g, sx, fz, mSkin, mLeathD);
  kbBuildLeg(group,  KB_HIP_X,  0.66,  0.40, mSkin, mSkin, bare, HIP_Y);
  kbBuildLeg(group, -KB_HIP_X, -0.58, -0.24, mSkin, mSkin, bare, HIP_Y);

  // ═══ GŁOWA: opaska koloru gracza + pióro + malowanie ochrą ══════════════
  const hb = new THREE.Mesh(gCyl('oszBand', 0.070, 0.070, 0.024, 10), mOwner);
  hb.position.set(0, KB_HEAD_CTR + 0.044 * HEX_R, 0);
  group.add(hb);
  const knot = new THREE.Mesh(gBox('oszKnot', 0.026, 0.026, 0.030), mOwner);
  knot.position.set(0, KB_HEAD_CTR + 0.044 * HEX_R, -(KB_HEAD_S * 0.5 + 0.018 * HEX_R));
  group.add(knot);
  for (const [sx, tilt] of [[-1, -0.30], [1, 0.34]] as [number, number][]) {
    const f = new THREE.Mesh(gBox('oszFeather', 0.018, 0.098, 0.010), mBone);
    f.rotation.set(-0.38, 0, tilt);
    f.position.set(sx * 0.030 * HEX_R, KB_HEAD_TOP + 0.046 * HEX_R, -0.040 * HEX_R);
    group.add(f);
    const fq = new THREE.Mesh(gBox('oszQuill', 0.008, 0.030, 0.008), mLeathD);
    fq.rotation.set(-0.38, 0, tilt);
    fq.position.set(sx * 0.024 * HEX_R, KB_HEAD_TOP + 0.004 * HEX_R, -0.024 * HEX_R);
    group.add(fq);
  }
  for (const sx of [-1, 1]) {                      // dwa pasy ochry na policzkach
    const pn = new THREE.Mesh(gBox('oszPaint', 0.024, 0.030, 0.008), mOchre);
    pn.rotation.z = sx * 0.22;
    pn.position.set(sx * 0.040 * HEX_R, KB_HEAD_CTR - 0.014 * HEX_R, KB_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(pn);
  }

  // ═══ PRAWA (-X): ATLATL + OSZCZEP na nim ════════════════════════════════
  // Miotacz leży na przedłużeniu przedramienia; oszczep spoczywa NA miotaczu,
  // jego piętka opiera się o hak z poroża na końcu deszczułki.
  const armR = kbBuildArm(group, -KB_SHLD_X, -2.42, 1.94, mSkin, mSkin, mSkinDk);
  const ax = armR.axis;
  const at = (d: number): THREE.Vector3 => armR.wrist.clone().addScaledVector(ax, d * HEX_R);
  const rotAt = Math.PI - 1.94;

  const board = new THREE.Mesh(gBox('oszAtlatl', 0.026, 0.230, 0.016), mWood);
  board.rotation.x = rotAt;
  board.position.copy(at(0.058));
  group.add(board);
  const boardTip = new THREE.Mesh(gBox('oszAtlTip', 0.022, 0.038, 0.024), mWood);
  boardTip.rotation.x = rotAt;
  boardTip.position.copy(at(0.190));
  group.add(boardTip);
  const hook = new THREE.Mesh(gCone('oszHook', 0.012, 0.038, 5), mAntler);   // HAK z poroża
  hook.rotation.x = rotAt - 0.42;
  hook.position.copy(at(0.212).add(new THREE.Vector3(0, 0.012 * HEX_R, 0.006 * HEX_R)));
  group.add(hook);
  for (const d of [-0.028, 0.014]) {                                          // pętle na palce
    const lp = new THREE.Mesh(gBox('oszLoop', 0.034, 0.012, 0.028), mLeathD);
    lp.rotation.x = rotAt;
    lp.position.copy(at(d));
    group.add(lp);
  }
  const gripWrap = new THREE.Mesh(gBox('oszGripWrap', 0.030, 0.036, 0.024), mSinew);
  gripWrap.rotation.x = rotAt;
  gripWrap.position.copy(at(-0.008));
  group.add(gripWrap);

  // OSZCZEP na miotaczu — ta sama oś, uniesiony o grubość deszczułki
  const lift = new THREE.Vector3(0, ax.z, -ax.y).normalize().multiplyScalar(0.022 * HEX_R);
  const jav = (d: number): THREE.Vector3 => at(d).add(lift);
  const shaft = new THREE.Mesh(gCyl('oszShaft', 0.010, 0.012, 0.520, 6), mWoodL);
  shaft.rotation.x = rotAt;
  shaft.position.copy(jav(0.170));
  group.add(shaft);
  const nockEnd = new THREE.Mesh(gBox('oszNock', 0.016, 0.024, 0.016), mWoodL);
  nockEnd.rotation.x = rotAt;
  nockEnd.position.copy(jav(-0.098));
  group.add(nockEnd);
  const point = new THREE.Mesh(
    getG('oszPoint', () => makeLeafPointGeo(0.092 * HEX_R, 0.036 * HEX_R, 0.014 * HEX_R)), mFlint);
  point.rotation.x = rotAt;
  point.position.copy(jav(0.428));
  group.add(point);
  const resin = new THREE.Mesh(gBox('oszResin', 0.020, 0.030, 0.018), mResin);
  resin.rotation.x = rotAt;
  resin.position.copy(jav(0.420));
  group.add(resin);
  for (const d of [0.402, 0.434]) {                                            // wiązanie grotu
    kbLashing(group, 'oszLash', 0.024, 0.010, 0.024, mSinew, jav(d), rotAt);
  }

  // ═══ LEWA (+X): 2 ZAPASOWE OSZCZEPY pionowo w garści ════════════════════
  const armL = kbBuildArm(group, KB_SHLD_X, 0.30, 0.42, mSkin, mSkin, mSkinDk);
  for (const [dz, dx] of [[-0.016, -0.004], [0.016, 0.006]] as [number, number][]) {
    const bx = armL.wrist.x + dx * HEX_R;
    const bz = armL.wrist.z + dz * HEX_R;
    const sp = new THREE.Mesh(gCyl('oszSpareSh', 0.009, 0.011, 0.440, 6), mWoodL);
    sp.position.set(bx, armL.wrist.y + 0.078 * HEX_R, bz);
    group.add(sp);
    const st = new THREE.Mesh(
      getG('oszSparePt', () => makeLeafPointGeo(0.076 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)), mFlint);
    st.position.set(bx, armL.wrist.y + 0.298 * HEX_R, bz);
    group.add(st);
    const sl = new THREE.Mesh(gBox('oszSpareLash', 0.020, 0.010, 0.020), mSinew);
    sl.position.set(bx, armL.wrist.y + 0.292 * HEX_R, bz);
    group.add(sl);
    const sb = new THREE.Mesh(gBox('oszSpareBut', 0.014, 0.020, 0.014), mWood);
    sb.position.set(bx, armL.wrist.y - 0.146 * HEX_R, bz);
    group.add(sb);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// 3. ŁUCZNIK (Distance, Atak dyst. 5 / zasięg 3 hex / 12 pocisków)
//    POZA: pełny naciąg do policzka.
//    UZBROJENIE: łuk prosty typu Holmegaard [H] — DŁUGI (rozpiętość ~0,62
//    HEX_R), szerokie płaskie ramiona, wąskie końce, nasady z rowkiem;
//    cięciwa ze ścięgna; strzała z grotem krzemiennym z ZADZIORAMI [B]
//    i TRZEMA lotkami; naramiennik łuczniczy [B] na lewym przedramieniu;
//    kołczan skórzany z prętem usztywniającym [Ö] = kolor gracza.
// ===========================================================================
export function buildLucznikOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(KB_SKIN,      0.05, 0.80);
  const mSkinDk = mat(KB_SKIN_DK,   0.05, 0.82);
  const mHair   = mat(KB_HAIR,      0.04, 0.90);
  const mDark   = mat(0x14110d,     0.04, 0.88);
  const mVest   = mat(KB_LEATH_LT,  0.05, 0.84);
  const mLeath  = mat(KB_LEATHER,   0.05, 0.86);
  const mLeathD = mat(KB_LEATH_DK,  0.05, 0.88);
  const mWood   = mat(KB_WOOD,      0.05, 0.82);
  const mWoodL  = mat(KB_WOOD_LT,   0.05, 0.80);
  const mFlint  = mat(KB_FLINT,     0.09, 0.38);
  const mFlintD = mat(KB_FLINT_DK,  0.07, 0.52);
  const mBone   = mat(KB_BONE,      0.05, 0.72);
  const mSinew  = mat(KB_SINEW,     0.02, 0.92);
  const mLinen  = mat(KB_LINEN,     0.03, 0.90);
  const mOwner  = mat(ownerColor_,  0.08, 0.72);

  const HIP_Y = KB_HIP_Y - 0.008 * HEX_R;

  // ═══ KORPUS: kamizela skórzana bez rękawów ══════════════════════════════
  kbBuildTorso(group, mVest);
  kbBuildHead(group, mSkin, mSkinDk, mHair, mDark, true);
  kbSkirtBelt(group, mLeath, mLeathD, null);
  kbOwnerSash(group, mOwner);
  for (const sx of [-1, 1]) {                      // szwy kamizeli
    const seam = new THREE.Mesh(gBox('lucSeam', 0.012, 0.180, 0.012), mLeathD);
    seam.position.set(sx * 0.080 * HEX_R, KB_TORSO_CTR + 0.004 * HEX_R, KB_TORSO_D * 0.5 - 0.006 * HEX_R);
    group.add(seam);
  }

  // ═══ NOGI ══════════════════════════════════════════════════════════════
  const boot: FootFn = (g, sx, fz) => kbBoot(g, sx, fz, mLeathD, mLeath, mLinen);
  kbBuildLeg(group,  KB_HIP_X,  0.46,  0.24, mLeath, mSkin, boot, HIP_Y);
  kbBuildLeg(group, -KB_HIP_X, -0.44, -0.16, mLeath, mSkin, boot, HIP_Y);

  // ═══ GŁOWA: czapka skórzana z klapami usznymi + pióro boczne ════════════
  kbFurCap(group, mLeath, mLeathD, false);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(gBox('lucEar', 0.014, 0.056, 0.044), mLeath);
    ear.rotation.z = sx * 0.12;
    ear.position.set(sx * (KB_HEAD_S * 0.5 + 0.010 * HEX_R), KB_HEAD_CTR + 0.010 * HEX_R, -0.004 * HEX_R);
    group.add(ear);
  }
  const feather = new THREE.Mesh(gBox('lucFeather', 0.016, 0.096, 0.010), mBone);
  feather.rotation.set(-0.16, 0, -0.52);
  feather.position.set(0.058 * HEX_R, KB_HEAD_TOP + 0.048 * HEX_R, -0.012 * HEX_R);
  group.add(feather);

  // ═══ LEWA (+X): ŁUK PROSTY (self bow) — wyciągnięta ręka ════════════════
  const armL = kbBuildArm(group, KB_SHLD_X, 1.44, 1.52, mVest, mSkin, mSkinDk);
  const gripP = armL.wrist.clone().addScaledVector(armL.axis, 0.022 * HEX_R);

  // NARAMIENNIK ŁUCZNICZY [B] — płytka z gładzonego łupku na 2 rzemieniach
  const bracer = new THREE.Mesh(gBox('lucBracer', 0.048, 0.046, 0.046), mFlintD);
  bracer.rotation.x = Math.PI - 1.52;
  bracer.position.copy(armL.wrist.clone().addScaledVector(armL.axis, -0.042 * HEX_R));
  group.add(bracer);
  for (const d of [-0.062, -0.020]) {
    kbLashing(group, 'lucBracerTie', 0.054, 0.010, 0.052, mLeathD,
      armL.wrist.clone().addScaledVector(armL.axis, d * HEX_R), Math.PI - 1.52);
  }

  // profil łuku: 11 punktów, wygięcie do tyłu (końce bliżej strzelca)
  const LIMB = 0.310 * HEX_R;      // półdługość ramienia
  const BEND = 0.120 * HEX_R;      // cofnięcie końców przy pełnym naciągu
  const bowPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = -1 + i * 0.2;
    bowPts.push(new THREE.Vector3(
      gripP.x,
      gripP.y + t * LIMB,
      gripP.z - BEND * t * t,
    ));
  }
  // ramiona SZEROKIE I PŁASKIE w środku, wąskie na końcach (Holmegaard)
  const gLimbW = getG('lucLimbW', () => new THREE.BoxGeometry(0.013 * HEX_R, 1, 0.030 * HEX_R));
  const gLimbN = getG('lucLimbN', () => new THREE.BoxGeometry(0.011 * HEX_R, 1, 0.019 * HEX_R));
  for (let i = 0; i < 10; i++) {
    const wide = i >= 2 && i <= 7;
    kbSpan(group, wide ? gLimbW : gLimbN, mWoodL, bowPts[i]!, bowPts[i + 1]!, 1);
  }
  // chwyt owinięty skórą + nasady (nocks) z rogu
  const bowGrip = new THREE.Mesh(gBox('lucBowGrip', 0.020, 0.062, 0.036), mLeathD);
  bowGrip.position.copy(bowPts[5]!);
  group.add(bowGrip);
  for (const idx of [0, 10]) {
    const nk = new THREE.Mesh(gBox('lucNock', 0.014, 0.026, 0.022), mBone);
    nk.rotation.x = idx === 0 ? 0.34 : -0.34;
    nk.position.copy(bowPts[idx]!);
    group.add(nk);
  }

  // ═══ PRAWA (-X): dłoń przy policzku (pełny naciąg) ══════════════════════
  const armR = kbBuildArm(group, -KB_SHLD_X, 1.26, -2.02, mVest, mSkin, mSkinDk);
  const nock = new THREE.Vector3(
    armR.wrist.x + 0.032 * HEX_R, armR.wrist.y + 0.004 * HEX_R, armR.wrist.z + 0.026 * HEX_R);

  // cięciwa ze ścięgna — dwa odcinki w literę V
  const gStr = getG('lucString', () => new THREE.BoxGeometry(0.0065 * HEX_R, 1, 0.0065 * HEX_R));
  kbSpan(group, gStr, mSinew, bowPts[0]!, nock, 1);
  kbSpan(group, gStr, mSinew, bowPts[10]!, nock, 1);
  const serving = new THREE.Mesh(gBox('lucServing', 0.012, 0.030, 0.012), mSinew);
  serving.position.copy(nock);
  group.add(serving);

  // strzała: drzewce + grot z zadziorami + TRZY lotki + wiązania
  const arrDir = gripP.clone().add(new THREE.Vector3(0, 0.010 * HEX_R, 0.030 * HEX_R)).sub(nock).normalize();
  const arrEnd = nock.clone().addScaledVector(arrDir, 0.352 * HEX_R);
  kbSpan(group, getG('lucArrow', () => new THREE.CylinderGeometry(
    0.0055 * HEX_R, 0.0055 * HEX_R, 1, 5)), mWood, nock, arrEnd, 1);
  const aTip = new THREE.Mesh(
    getG('lucBarb', () => makeBarbedPointGeo(0.056 * HEX_R, 0.028 * HEX_R, 0.009 * HEX_R)), mFlint);
  aTip.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arrDir);
  aTip.position.copy(arrEnd);
  group.add(aTip);
  const aLash = new THREE.Mesh(gBox('lucArrLash', 0.014, 0.012, 0.014), mSinew);
  aLash.quaternion.copy(aTip.quaternion);
  aLash.position.copy(arrEnd.clone().addScaledVector(arrDir, -0.006 * HEX_R));
  group.add(aLash);
  for (let k = 0; k < 3; k++) {                     // 3 lotki co 120°
    const fl = new THREE.Mesh(gBox('lucFletch', 0.005, 0.034, 0.026), mLinen);
    fl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), arrDir);
    fl.rotateZ((k * 2 * Math.PI) / 3);
    fl.position.copy(nock.clone().addScaledVector(arrDir, 0.030 * HEX_R));
    group.add(fl);
  }

  // ═══ KOŁCZAN [Ö] na plecach — pole = KOLOR GRACZA ═══════════════════════
  const qx = -0.052 * HEX_R;
  const qz = -(KB_TORSO_D * 0.5 + 0.032 * HEX_R);
  const quiver = new THREE.Mesh(gCyl('lucQuiver', 0.034, 0.030, 0.190, 8), mOwner);
  quiver.rotation.x = -0.32;
  quiver.position.set(qx, KB_TORSO_CTR + 0.040 * HEX_R, qz);
  group.add(quiver);
  const qStiff = new THREE.Mesh(gBox('lucQStiff', 0.010, 0.200, 0.010), mWoodL);   // pręt leszczynowy
  qStiff.rotation.x = -0.32;
  qStiff.position.set(qx - 0.036 * HEX_R, KB_TORSO_CTR + 0.040 * HEX_R, qz - 0.006 * HEX_R);
  group.add(qStiff);
  const qLid = new THREE.Mesh(gBox('lucQLid', 0.062, 0.024, 0.052), mLeathD);
  qLid.rotation.x = -0.32;
  qLid.position.set(qx, KB_TORSO_CTR + 0.140 * HEX_R, qz - 0.034 * HEX_R);
  group.add(qLid);
  const qStrap = new THREE.Mesh(gBox('lucQStrap', 0.026, 0.220, 0.012), mLeath);
  qStrap.rotation.z = -0.56;
  qStrap.position.set(0, KB_TORSO_CTR + 0.030 * HEX_R, -(KB_TORSO_D * 0.5 + 0.008 * HEX_R));
  group.add(qStrap);
  for (const dx of [-0.016, 0.002, 0.018]) {        // 3 strzały wystające z kołczanu
    const s2 = new THREE.Mesh(gCyl('lucQArr', 0.0055, 0.0055, 0.080, 5), mWood);
    s2.rotation.x = -0.32;
    s2.position.set(qx + dx * HEX_R, KB_TORSO_CTR + 0.170 * HEX_R, qz - 0.044 * HEX_R);
    group.add(s2);
    const f2 = new THREE.Mesh(gBox('lucQFletch', 0.005, 0.032, 0.024), mLinen);
    f2.rotation.x = -0.32;
    f2.position.set(qx + dx * HEX_R, KB_TORSO_CTR + 0.198 * HEX_R, qz - 0.054 * HEX_R);
    group.add(f2);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// 4. ZWIADOWCA (Civilian, Atak 0 / Pancerz 0 / Ruch 3 / Widok 5)
//    POZA: marszowy wykrok, lewa dłoń-daszek nad oczami, prawa na kiju.
//    WYPOSAŻENIE „Ötzi” [Ö]: czapa z niedźwiedziej skóry z paskiem
//    podbródkowym, PŁASZCZ PLECIONY Z TRAWY, plecak na RAMIE Z LESZCZYNY,
//    sakwa z krzesiwem (klapa = kolor gracza), nóż krzemienny w pochewce
//    z łyka, kij leszczynowy z rozwidleniem. BEZ BRONI OFENSYWNEJ.
// ===========================================================================
export function buildZwiadowcaOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin   = mat(KB_SKIN,      0.05, 0.80);
  const mSkinDk = mat(KB_SKIN_DK,   0.05, 0.82);
  const mHair   = mat(KB_HAIR,      0.04, 0.90);
  const mDark   = mat(0x14110d,     0.04, 0.88);
  const mFur    = mat(KB_FUR_DK,    0.03, 0.94);
  const mFurW   = mat(KB_FUR_WH,    0.03, 0.92);
  const mHide   = mat(KB_LEATH_LT,  0.05, 0.84);
  const mLeath  = mat(KB_LEATHER,   0.05, 0.86);
  const mLeathD = mat(KB_LEATH_DK,  0.05, 0.88);
  const mWoodL  = mat(KB_WOOD_LT,   0.05, 0.80);
  const mWoodD  = mat(KB_WOOD_DK,   0.05, 0.86);
  const mGrass  = mat(KB_GRASS,     0.02, 0.94);
  const mFlint  = mat(KB_FLINT,     0.09, 0.38);
  const mBone   = mat(KB_BONE,      0.05, 0.72);
  const mLinen  = mat(KB_LINEN,     0.03, 0.90);
  const mOwner  = mat(ownerColor_,  0.08, 0.72);

  const HIP_Y = KB_HIP_Y - 0.014 * HEX_R;      // najgłębszy wykrok (Ruch 3)

  // ═══ KORPUS: kaftan ze zszytych pasów skóry [Ö] ═════════════════════════
  kbBuildTorso(group, mHide);
  kbBuildHead(group, mSkin, mSkinDk, mHair, mDark, true);
  kbSkirtBelt(group, mLeath, mLeathD, null);
  kbOwnerSash(group, mOwner);
  for (const dy of [0.050, 0.012, -0.026]) {   // poziome szwy kaftana Ötziego
    const seam = new THREE.Mesh(gBox('zwSeam', 0.184, 0.008, 0.104), mLeathD);
    seam.position.set(0, KB_TORSO_CTR + dy * HEX_R, 0);
    group.add(seam);
  }

  // ═══ PŁASZCZ PLECIONY Z TRAWY [Ö] — 6 pasm zwisających z barków ════════
  for (const sx of [-2.0, -1.2, -0.4, 0.4, 1.2, 2.0]) {
    const str = new THREE.Mesh(gBox('zwGrass', 0.038, 0.232, 0.014), mGrass);
    str.rotation.set(0.06, 0, -sx * 0.035);
    str.position.set(sx * 0.038 * HEX_R, KB_TORSO_CTR + 0.006 * HEX_R,
      -(KB_TORSO_D * 0.5 + 0.020 * HEX_R));
    group.add(str);
  }
  const yoke = new THREE.Mesh(gBox('zwYoke', 0.196, 0.030, 0.126), mGrass);
  yoke.position.set(0, KB_TORSO_TOP - 0.010 * HEX_R, -0.008 * HEX_R);
  group.add(yoke);
  for (const sx of [-1, 1]) {          // poły płaszcza opadające z przodu ramion
    const front = new THREE.Mesh(gBox('zwGrassF', 0.042, 0.150, 0.016), mGrass);
    front.rotation.z = -sx * 0.10;
    front.position.set(sx * 0.074 * HEX_R, KB_TORSO_CTR + 0.036 * HEX_R, KB_TORSO_D * 0.5 + 0.012 * HEX_R);
    group.add(front);
  }

  // ═══ PLECAK NA RAMIE Z LESZCZYNY [Ö] ════════════════════════════════════
  const packZ = -(KB_TORSO_D * 0.5 + 0.060 * HEX_R);
  for (const sx of [-1, 1]) {                  // dwa pionowe pręty ramy (U)
    const rail = new THREE.Mesh(gCyl('zwRail', 0.008, 0.008, 0.250, 5), mWoodL);
    rail.rotation.z = sx * 0.05;
    rail.position.set(sx * 0.072 * HEX_R, KB_TORSO_CTR + 0.020 * HEX_R, packZ);
    group.add(rail);
  }
  for (const dy of [0.086, -0.070]) {          // poprzeczki
    const cross = new THREE.Mesh(gCyl('zwCross', 0.007, 0.007, 0.150, 5), mWoodL);
    cross.rotation.z = Math.PI / 2;
    cross.position.set(0, KB_TORSO_CTR + dy * HEX_R, packZ);
    group.add(cross);
  }
  const bundle = new THREE.Mesh(gBox('zwBundle', 0.130, 0.120, 0.060), mFurW);
  bundle.position.set(0, KB_TORSO_CTR + 0.014 * HEX_R, packZ - 0.020 * HEX_R);
  group.add(bundle);
  for (const dy of [0.048, -0.024]) {          // rzemienie mocujące tobołek
    const tie = new THREE.Mesh(gBox('zwTie', 0.146, 0.012, 0.070), mLeathD);
    tie.position.set(0, KB_TORSO_CTR + dy * HEX_R, packZ - 0.020 * HEX_R);
    group.add(tie);
  }
  for (const sx of [-1, 1]) {                  // szelki przez barki
    const strap = new THREE.Mesh(gBox('zwPackStrap', 0.024, 0.150, 0.012), mLeath);
    strap.rotation.set(0.20, 0, sx * 0.22);
    strap.position.set(sx * 0.062 * HEX_R, KB_TORSO_TOP - 0.056 * HEX_R, KB_TORSO_D * 0.5 + 0.004 * HEX_R);
    group.add(strap);
  }

  // ═══ NOGI: legginsy + buty ══════════════════════════════════════════════
  const boot: FootFn = (g, sx, fz) => kbBoot(g, sx, fz, mLeathD, mHide, mLinen);
  kbBuildLeg(group,  KB_HIP_X,  0.78,  0.42, mLeath, mLeath, boot, HIP_Y);
  kbBuildLeg(group, -KB_HIP_X, -0.66, -0.28, mLeath, mLeath, boot, HIP_Y);

  // ═══ GŁOWA: czapa z niedźwiedziej skóry + pasek podbródkowy [Ö] ═════════
  kbFurCap(group, mFur, mLeathD, true);
  const capBadge = new THREE.Mesh(gBox('zwCapBadge', 0.040, 0.018, 0.030), mOwner);
  capBadge.position.set(0, KB_HEAD_CTR + 0.052 * HEX_R, KB_HEAD_S * 0.5 + 0.020 * HEX_R);
  group.add(capBadge);

  // ═══ LEWA (+X): dłoń-daszek nad oczami (Widok 5) ════════════════════════
  const armL = kbBuildArm(group, KB_SHLD_X, 1.88, 2.96, mHide, mSkin, null);
  const palm = new THREE.Mesh(gBox('zwPalm', 0.052, 0.016, 0.070), mSkin);
  palm.rotation.x = 0.16;
  palm.position.copy(armL.wrist.clone().add(new THREE.Vector3(-0.028 * HEX_R, 0.014 * HEX_R, 0.012 * HEX_R)));
  group.add(palm);
  const thumb = new THREE.Mesh(gBox('zwThumb', 0.014, 0.014, 0.036), mSkinDk);
  thumb.position.copy(armL.wrist.clone().add(new THREE.Vector3(-0.050 * HEX_R, 0.012 * HEX_R, 0.006 * HEX_R)));
  group.add(thumb);

  // ═══ PRAWA (-X): KIJ LESZCZYNOWY z rozwidleniem ═════════════════════════
  const armR = kbBuildArm(group, -KB_SHLD_X, 0.40, 0.66, mHide, mSkin, mSkinDk);
  const stX = armR.wrist.x - 0.004 * HEX_R;
  const stZ = armR.wrist.z + 0.018 * HEX_R;
  const staff = new THREE.Mesh(gCyl('zwStaff', 0.011, 0.014, 0.460, 6), mWoodL);
  staff.rotation.x = 0.05;
  staff.position.set(stX, 0.230 * HEX_R, stZ);
  group.add(staff);
  for (const sx of [-1, 1]) {                  // rozwidlenie na szczycie
    const fk = new THREE.Mesh(gBox('zwFork', 0.010, 0.058, 0.010), mWoodL);
    fk.rotation.z = sx * 0.34;
    fk.position.set(stX + sx * 0.012 * HEX_R, 0.484 * HEX_R, stZ);
    group.add(fk);
  }
  const wrap = new THREE.Mesh(gBox('zwStaffWrap', 0.024, 0.044, 0.024), mLeathD);
  wrap.position.copy(armR.wrist.clone().add(new THREE.Vector3(-0.004 * HEX_R, 0.004 * HEX_R, 0.018 * HEX_R)));
  group.add(wrap);
  const ferrule = new THREE.Mesh(gCone('zwFerrule', 0.012, 0.030, 5), mBone);
  ferrule.rotation.x = Math.PI;
  ferrule.position.set(stX, 0.016 * HEX_R, stZ - 0.010 * HEX_R);
  group.add(ferrule);

  // ═══ SAKWA z krzesiwem (klapa = KOLOR GRACZA) + NÓŻ w pochewce z łyka ═══
  const bag = new THREE.Mesh(gBox('zwBag', 0.066, 0.076, 0.036), mLeath);
  bag.position.set(0.104 * HEX_R, 0.246 * HEX_R, 0.020 * HEX_R);
  group.add(bag);
  const flap = new THREE.Mesh(gBox('zwFlap', 0.070, 0.028, 0.042), mOwner);
  flap.position.set(0.104 * HEX_R, 0.284 * HEX_R, 0.020 * HEX_R);
  group.add(flap);
  const toggle = new THREE.Mesh(gBox('zwToggle', 0.014, 0.016, 0.012), mBone);
  toggle.position.set(0.104 * HEX_R, 0.258 * HEX_R, 0.042 * HEX_R);
  group.add(toggle);
  const bagStrap = new THREE.Mesh(gBox('zwBagStrap', 0.024, 0.248, 0.012), mLeathD);
  bagStrap.rotation.z = -0.62;
  bagStrap.position.set(0, KB_TORSO_CTR + 0.028 * HEX_R, KB_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(bagStrap);

  const knX = -(KB_TORSO_W * 0.5 + 0.018 * HEX_R);
  const sheath = new THREE.Mesh(gBox('zwSheath', 0.024, 0.070, 0.014), mLinen);   // pochewka z łyka
  sheath.rotation.z = -0.12;
  sheath.position.set(knX, 0.214 * HEX_R, 0.024 * HEX_R);
  group.add(sheath);
  const blade = new THREE.Mesh(
    getG('zwBlade', () => makeLeafPointGeo(0.044 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)), mFlint);
  blade.rotation.z = -0.12;
  blade.position.set(knX - 0.004 * HEX_R, 0.250 * HEX_R, 0.024 * HEX_R);
  group.add(blade);
  const hilt = new THREE.Mesh(gBox('zwHilt', 0.018, 0.026, 0.014), mWoodD);
  hilt.rotation.z = -0.12;
  hilt.position.set(knX - 0.006 * HEX_R, 0.244 * HEX_R, 0.024 * HEX_R);
  group.add(hilt);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
