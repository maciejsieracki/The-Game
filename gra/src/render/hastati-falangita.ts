/**
 * hastati-falangita.ts — proceduralne modele piechoty, KOREKTA v2 (render-jednostki)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z render/units.ts:
 *   buildHastati(ownerColor)   -> units.ts:1579 buildHastati (dispatch units.ts:1064)
 *   buildFalangita(ownerColor) -> units.ts:4006 case 'falanga' w buildCategoryModel
 * Interfejs i konwencje BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy, wysokosc ~0.55*HEX_R,
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste).
 *
 * UKLAD STRON (zweryfikowany rachunkiem i na renderach v2):
 *   przod = +Z, gora = +Y, uklad prawoskretny  =>  LEWA reka = +X, PRAWA = -X.
 *   (Figurka patrzy w +Z: jej lewa dlon jest po stronie +X — kamera stojaca
 *   naprzeciw twarzy widzi tarcze po SWOJEJ prawej.) W v1 bylo ODWROTNIE.
 *
 * KOREKTY WLASCICIELA (v2):
 *   1. TARCZA zawsze na LEWYM przedramieniu (+X), BRON w PRAWEJ dloni (-X) —
 *      obie figurki.
 *   2. SCUTUM = OWALNA, PODLUZNA, WYPUKLA tarcza wczesnorepublikanska:
 *      fasetowana skorupa o 10-segmentowym obrysie elipsy 0.21 x 0.38 *HEX_R,
 *      LUK POPRZECZNY zagiety ku zolnierzowi (krawedzie boczne -0.052 w glab),
 *      pole tarczy = KOLOR GRACZA, rant/plecy skorzane (kontrast),
 *      zlote UMBO + pionowa listwa SPINA. (Zamiast prostokata z 3 listew.)
 *   3. Referencja obrazkowa hastati: montefortino ZLOTY/mosiezny, czarna KITA
 *      + 3 fioletowo-purpurowe PIORA (klockowe, kolor staly — kolor gracza
 *      przeniesiony na pole tarczy), CZERWONA tunika, zlote kwadratowe
 *      PECTORALE na skrzyzowanych pasach (kolczuga usunieta), brazowy PAS,
 *      JEDNA zlota nagolennica na lewej (wykrocznej) nodze, sandaly,
 *      pterugesy uproszczone do czerwonej spodnicy tuniki.
 *   4. POZY ATAKU: hastati = pchniecie gladiusem w przod na wysokosci piersi,
 *      tarcza oslania korpus, gleboki wykrok (biodra obnizone o 0.012);
 *      falangita = pchniecie wlocznia NADRECZNE (lokiec nad barkiem, grot
 *      w przod lekko w dol), aspis przed korpusem, wykrok (biodra -0.010).
 *      Stopy na y = 0, srodek ciezkosci nad podstawa — token stabilny.
 *   5. Helm OBOWIAZKOWO na kazdej glowie (montefortino / koryncki bez zmian).
 *
 * Anatomia dalej SPOJNA z jezdzcem konnicy (kon-nowy-model.ts): konczyny
 * lancuchowe (niSeg / niBuildLeg / niBuildArm jak nhBuildLeg / addRiderLegs),
 * BRON NA OSI DLONI, TARCZA NA PRZEDRAMIENIU (porpax/uchwyt za polem).
 * Budzet: Hastati 462 tri (424 w v1 — detale referencji: piora, pectorale,
 * pasy, pas, skorupa owalna), Falangita 404 tri (416 w v1 — usunieta
 * niewidoczna miednica i oczy zawsze zakryte helmem).
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

// ── kolory serii (zgodne z paleta units.ts) ────────────────────────────────
const NI_SKIN       = 0xe0ac69;
const NI_STEEL      = 0xc2cad2;
const NI_BRONZE     = 0xcf9234;
const NI_BRONZE_LT  = 0xd0a050;
const NI_WOOD       = 0x7a5c3a;
const NI_LEATHER    = 0x6b4a28;
const NI_GOLD       = 0xd8b040;
const NI_LINEN      = 0xe8e0c8;
const NI_ROMAN_RED  = 0xa42a22;
const NI_CRIMSON    = 0xa01f2e;
const NI_WOAD       = 0x2f5aa0;
const NI_PURPLE     = 0x7a2c96;   // piora hastati (staly, referencja)
const NI_BLACK      = 0x171310;   // kita montefortino

// ── wymiary sylwetki (rodzina AV_* / jezdziec) ─────────────────────────────
const NI_HIP_Y     = 0.208 * HEX_R;   // biodro (staw udowy, postawa neutralna)
const NI_TORSO_W   = 0.180 * HEX_R;
const NI_TORSO_H   = 0.205 * HEX_R;
const NI_TORSO_D   = 0.100 * HEX_R;
const NI_TORSO_BOT = 0.240 * HEX_R;   // dol torsu (nad miednica)
const NI_TORSO_CTR = NI_TORSO_BOT + NI_TORSO_H * 0.5;
const NI_TORSO_TOP = NI_TORSO_BOT + NI_TORSO_H;
const NI_NECK_H    = 0.028 * HEX_R;
const NI_HEAD_S    = 0.128 * HEX_R;
const NI_HEAD_CTR  = NI_TORSO_TOP + NI_NECK_H + NI_HEAD_S * 0.5;
const NI_HEAD_TOP  = NI_TORSO_TOP + NI_NECK_H + NI_HEAD_S;
const NI_SHLD_X    = NI_TORSO_W * 0.5 + 0.030 * HEX_R;  // staw barkowy (|x|)
const NI_SHLD_Y    = NI_TORSO_TOP - 0.024 * HEX_R;
const NI_HIP_X     = 0.052 * HEX_R;   // rozstaw ud

// dlugosci segmentow konczyn (szerokosci = rodzina jezdzca addRiderLegs)
const NI_THIGH_L = 0.104 * HEX_R;
const NI_SHIN_L  = 0.096 * HEX_R;
const NI_UPARM_L = 0.100 * HEX_R;
const NI_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy; wspolne dla wszystkich tokenow) ────────────
let gNITorso:   THREE.BoxGeometry | null = null;
let gNINeck:    THREE.BoxGeometry | null = null;
let gNIHead:    THREE.BoxGeometry | null = null;
let gNIThigh:   THREE.BoxGeometry | null = null;
let gNIShin:    THREE.BoxGeometry | null = null;
let gNIFoot:    THREE.BoxGeometry | null = null;
let gNIUpArm:   THREE.BoxGeometry | null = null;
let gNIForearm: THREE.BoxGeometry | null = null;
let gNIFist:    THREE.BoxGeometry | null = null;
let gNISkirt:   THREE.BoxGeometry | null = null;   // pteruges / spodnica tuniki
let gNIGreave:  THREE.BoxGeometry | null = null;
// Hastati
let gNIMontBowl: THREE.CylinderGeometry | null = null;  // miska montefortino (8-kat)
let gNIMontNeck: THREE.BoxGeometry | null = null;
let gNICheek:    THREE.BoxGeometry | null = null;
let gNIKita:     THREE.BoxGeometry | null = null;       // czarna kita na guzie
let gNIFeather:  THREE.BoxGeometry | null = null;       // klockowe pioro (x3)
let gNIScutShell:THREE.BufferGeometry | null = null;    // owalna skorupa (rant+plecy)
let gNIScutFace: THREE.BufferGeometry | null = null;    // pole tarczy (kolor gracza)
let gNISpina:    THREE.BoxGeometry | null = null;       // pionowa listwa
let gNIUmbo:     THREE.BoxGeometry | null = null;
let gNIPect:     THREE.BoxGeometry | null = null;       // kwadratowe pectorale
let gNIStrap:    THREE.BoxGeometry | null = null;       // pas krzyzowy pectorale
let gNIBelt:     THREE.BoxGeometry | null = null;       // pas brzuszny
let gNIBlade:    THREE.BoxGeometry | null = null;
let gNIBladeTip: THREE.ConeGeometry | null = null;
let gNIGuard:    THREE.BoxGeometry | null = null;
// Falangita
let gNICorDome:  THREE.CylinderGeometry | null = null;  // dzwon koryncki (9-kat)
let gNISlit:     THREE.BoxGeometry | null = null;
let gNICrestBase:THREE.BoxGeometry | null = null;
let gNICrestHair:THREE.BoxGeometry | null = null;
let gNIYoke:     THREE.BoxGeometry | null = null;
let gNIAspisFace:THREE.CylinderGeometry | null = null;
let gNIAspisRim: THREE.CylinderGeometry | null = null;
let gNILambda:   THREE.BoxGeometry | null = null;
let gNIDoryShaft:THREE.BoxGeometry | null = null;
let gNIDoryTip:  THREE.ConeGeometry | null = null;
let gNISauroter: THREE.BoxGeometry | null = null;

// ---------------------------------------------------------------------------
// OWALNA SKORUPA SCUTUM — fasetowany obrys elipsy (N segmentow) z lukiem
// poprzecznym: kazdy wierzcholek obrysu cofniety o c*(x/a)^2 ku zolnierzowi
// (-Z lokalnie; front tarczy = +Z lokalnie). Skorupa = przod + plecy + rant
// (3*N tri + ... = 4N tri); pole (fan, N tri) klade sie NA skorupie z ta sama
// krzywizna. Singletony — liczone raz.
// ---------------------------------------------------------------------------
function niOvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;   // wierzcholek na gorze
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}

function makeOvalShellGeo(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = niOvalRing(a, b, c, N);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const F = t * 0.5, B = -t * 0.5;
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    P(0, 0, F); P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + F);          // przod
    P(0, 0, B); P(q[0], q[1], q[2] + B); P(p[0], p[1], p[2] + B);          // plecy
    P(p[0], p[1], p[2] + F); P(p[0], p[1], p[2] + B); P(q[0], q[1], q[2] + B);  // rant
    P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + B); P(q[0], q[1], q[2] + F);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function makeOvalFaceGeo(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = niOvalRing(a, b, c, N);
  const pos: number[] = [];
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    pos.push(0, 0, 0, p[0], p[1], p[2], q[0], q[1], q[2]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

function getGNITorso():   THREE.BoxGeometry { return (gNITorso   ||= new THREE.BoxGeometry(NI_TORSO_W, NI_TORSO_H, NI_TORSO_D)); }
function getGNINeck():    THREE.BoxGeometry { return (gNINeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, NI_NECK_H * 1.6, 0.042 * HEX_R)); }
function getGNIHead():    THREE.BoxGeometry { return (gNIHead    ||= new THREE.BoxGeometry(NI_HEAD_S, NI_HEAD_S, NI_HEAD_S)); }
function getGNIThigh():   THREE.BoxGeometry { return (gNIThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, NI_THIGH_L, 0.060 * HEX_R)); }
function getGNIShin():    THREE.BoxGeometry { return (gNIShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, NI_SHIN_L, 0.042 * HEX_R)); }
function getGNIFoot():    THREE.BoxGeometry { return (gNIFoot    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.026 * HEX_R, 0.078 * HEX_R)); }
function getGNIUpArm():   THREE.BoxGeometry { return (gNIUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, NI_UPARM_L, 0.054 * HEX_R)); }
function getGNIForearm(): THREE.BoxGeometry { return (gNIForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, NI_FOREARM_L, 0.040 * HEX_R)); }
function getGNIFist():    THREE.BoxGeometry { return (gNIFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getGNISkirt():   THREE.BoxGeometry { return (gNISkirt   ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getGNIGreave():  THREE.BoxGeometry { return (gNIGreave  ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.098 * HEX_R, 0.050 * HEX_R)); }
function getGNIMontBowl(): THREE.CylinderGeometry { return (gNIMontBowl ||= new THREE.CylinderGeometry(0.050 * HEX_R, 0.093 * HEX_R, 0.092 * HEX_R, 8, 1)); }
function getGNIMontNeck(): THREE.BoxGeometry { return (gNIMontNeck ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R)); }
function getGNICheek():    THREE.BoxGeometry { return (gNICheek    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.052 * HEX_R, 0.044 * HEX_R)); }
function getGNIKita():     THREE.BoxGeometry { return (gNIKita     ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.056 * HEX_R, 0.028 * HEX_R)); }
function getGNIFeather():  THREE.BoxGeometry { return (gNIFeather  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.108 * HEX_R, 0.012 * HEX_R)); }
function getGNIScutShell():THREE.BufferGeometry { return (gNIScutShell ||= makeOvalShellGeo(0.104 * HEX_R, 0.190 * HEX_R, 0.052 * HEX_R, 0.020 * HEX_R, 10)); }
function getGNIScutFace(): THREE.BufferGeometry { return (gNIScutFace  ||= makeOvalFaceGeo(0.0874 * HEX_R, 0.1596 * HEX_R, 0.0367 * HEX_R, 10)); }
function getGNISpina():    THREE.BoxGeometry { return (gNISpina    ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.300 * HEX_R, 0.014 * HEX_R)); }
function getGNIUmbo():     THREE.BoxGeometry { return (gNIUmbo     ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.052 * HEX_R, 0.026 * HEX_R)); }
function getGNIPect():     THREE.BoxGeometry { return (gNIPect     ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.096 * HEX_R, 0.018 * HEX_R)); }
function getGNIStrap():    THREE.BoxGeometry { return (gNIStrap    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.120 * HEX_R, 0.008 * HEX_R)); }
function getGNIBelt():     THREE.BoxGeometry { return (gNIBelt     ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.034 * HEX_R, 0.112 * HEX_R)); }
function getGNIBlade():    THREE.BoxGeometry { return (gNIBlade    ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.135 * HEX_R, 0.014 * HEX_R)); }
function getGNIBladeTip(): THREE.ConeGeometry{ return (gNIBladeTip ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.040 * HEX_R, 4)); }
function getGNIGuard():    THREE.BoxGeometry { return (gNIGuard    ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.024 * HEX_R)); }
function getGNICorDome():  THREE.CylinderGeometry { return (gNICorDome ||= new THREE.CylinderGeometry(0.066 * HEX_R, 0.084 * HEX_R, 0.128 * HEX_R, 9, 1)); }
function getGNISlit():     THREE.BoxGeometry { return (gNISlit     ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.020 * HEX_R, 0.012 * HEX_R)); }
function getGNICrestBase():THREE.BoxGeometry { return (gNICrestBase||= new THREE.BoxGeometry(0.022 * HEX_R, 0.030 * HEX_R, 0.128 * HEX_R)); }
function getGNICrestHair():THREE.BoxGeometry { return (gNICrestHair||= new THREE.BoxGeometry(0.028 * HEX_R, 0.080 * HEX_R, 0.170 * HEX_R)); }
function getGNIYoke():     THREE.BoxGeometry { return (gNIYoke     ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.024 * HEX_R, 0.120 * HEX_R)); }
function getGNIAspisFace():THREE.CylinderGeometry { return (gNIAspisFace ||= new THREE.CylinderGeometry(0.128 * HEX_R, 0.100 * HEX_R, 0.034 * HEX_R, 12, 1)); }
function getGNIAspisRim(): THREE.CylinderGeometry { return (gNIAspisRim  ||= new THREE.CylinderGeometry(0.140 * HEX_R, 0.140 * HEX_R, 0.020 * HEX_R, 12, 1, true)); }
function getGNILambda():   THREE.BoxGeometry { return (gNILambda   ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.120 * HEX_R, 0.012 * HEX_R)); }
function getGNIDoryShaft():THREE.BoxGeometry { return (gNIDoryShaft||= new THREE.BoxGeometry(0.021 * HEX_R, 0.740 * HEX_R, 0.021 * HEX_R)); }
function getGNIDoryTip():  THREE.ConeGeometry{ return (gNIDoryTip  ||= new THREE.ConeGeometry(0.020 * HEX_R, 0.062 * HEX_R, 4)); }
function getGNISauroter(): THREE.BoxGeometry { return (gNISauroter ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.055 * HEX_R, 0.022 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kierunek segmentu konczyny: theta od pionu W DOL, +theta = ku przodowi (+Z).
// Zwraca wektor jednostkowy; mesh o osi Y klasc z rotation.x = PI - theta.
// (Ta sama konwencja lancuchowa co nhBuildLeg konia / addRiderLegs jezdzca.)
// ---------------------------------------------------------------------------
function niDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

/** Segment od punktu P wzdluz dir o dlugosci len; zwraca punkt koncowy. */
function niSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = niDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/**
 * Noga ze stawem kolanowym w wykroku: udo (thU) + golen (thL) + stopa PLASKO
 * na ziemi (y=0) pod kostka. hipY — wysokosc stawu udowego (pozy ataku maja
 * biodra obnizone: glebszy wykrok przy stopach wciaz na ziemi).
 */
function niBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = NI_HIP_Y,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = niSeg(group, getGNIThigh(), mThigh, P, thU, NI_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;      // zakladka w kolanie
  P = niSeg(group, getGNIShin(), mShin, P, thL, NI_SHIN_L);
  const foot = new THREE.Mesh(getGNIFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);  // podeszwa na y=0
  group.add(foot);
}

/**
 * Ramie ze stawem lokciowym: ramie od barku (thU; ujemne = w tyl/w gore za
 * plecami przy thU < -PI/2) + przedramie (thF) + opcjonalna piesc na koncu.
 * Zwraca pozycje nadgarstka i os przedramienia (BRON ZAWSZE NA TEJ OSI).
 */
function niBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, NI_SHLD_Y, 0);
  P = niSeg(group, getGNIUpArm(), mUp, P, thU, NI_UPARM_L);
  P.y += 0.010 * HEX_R;                                // zakladka w lokciu
  const wrist = niSeg(group, getGNIForearm(), mFore, P, thF, NI_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getGNIFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(niDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: niDirDown(thF) };
}

/**
 * Wspolny korpus: tors + szyja + glowa. (Miednica usunieta — byla w calosci
 * zakryta spodnica/pterugesami obu figurek; oczy usuniete — montefortino
 * i koryncki zakrywaja strefe oczu, klocki byly niewidoczne.)
 */
function niBuildCore(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getGNITorso(), mTorso);
  torso.position.set(0, NI_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(NI_SKIN, 0.05, 0.80);
  const neck = new THREE.Mesh(getGNINeck(), mSkin);
  neck.position.set(0, NI_TORSO_TOP + NI_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getGNIHead(), mSkin);
  head.position.set(0, NI_HEAD_CTR, 0);
  group.add(head);
}

// ---------------------------------------------------------------------------
// HASTATI (Rzym, Zelazo) — 462 tri, POZA ATAKU
// Zloty montefortino (czarna kita + 3 purpurowe piora), czerwona tunika,
// zlote kwadratowe pectorale na skrzyzowanych pasach, brazowy pas, OWALNY
// wypukly SCUTUM (pole = kolor gracza, skorzany rant, zlote umbo + spina)
// na LEWYM (+X) przedramieniu przed korpusem, GLADIUS w PRAWEJ (-X) dloni
// w pchnieciu w przod NA OSI przedramienia, 1 zlota nagolennica na lewej
// (wykrocznej) nodze, sandaly, gleboki wykrok (biodra -0.012).
// ---------------------------------------------------------------------------
export function buildHastati(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mGold   = mat(NI_GOLD,      0.55, 0.35);
  const mBronzL = mat(NI_BRONZE_LT, 0.52, 0.38);
  const mOwner  = mat(ownerColor_,  0.15, 0.65);
  const mRed    = mat(NI_ROMAN_RED, 0.05, 0.80);
  const mSteel  = mat(NI_STEEL,     0.55, 0.35);
  const mLeath  = mat(NI_LEATHER,   0.05, 0.82);
  const mSkin   = mat(NI_SKIN,      0.05, 0.80);
  const mPurple = mat(NI_PURPLE,    0.08, 0.72);
  const mBlack  = mat(NI_BLACK,     0.05, 0.85);

  const HIP_Y = NI_HIP_Y - 0.012 * HEX_R;   // biodra obnizone — wypad

  // korpus: tors = CZERWONA TUNIKA (referencja; kolczuga usunieta)
  niBuildCore(group, mat, mRed);
  // spodnica tuniki (pterugesy uproszczone) + brazowy pas
  const skirt = new THREE.Mesh(getGNISkirt(), mRed);
  skirt.position.set(0, NI_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const belt = new THREE.Mesh(getGNIBelt(), mLeath);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);

  // PECTORALE: zloty kwadrat na piersi + skrzyzowane pasy przez barki
  const pect = new THREE.Mesh(getGNIPect(), mGold);
  pect.position.set(0, 0.386 * HEX_R, NI_TORSO_D * 0.5 + 0.010 * HEX_R);
  group.add(pect);
  for (const s of [-1, 1]) {
    const strap = new THREE.Mesh(getGNIStrap(), mLeath);
    strap.rotation.set(-0.55, 0, s * 0.62);
    strap.position.set(s * 0.020 * HEX_R, 0.446 * HEX_R, 0.040 * HEX_R);
    group.add(strap);
  }

  // nogi: LEWA (+X) wykroczna, PRAWA (-X) zakroczna — gleboki wypad
  niBuildLeg(group,  NI_HIP_X,  0.58,  0.34, mRed, mSkin, mLeath, HIP_Y);
  niBuildLeg(group, -NI_HIP_X, -0.52, -0.20, mRed, mSkin, mLeath, HIP_Y);
  // JEDNA zlota nagolennica — lewa (wykroczna) golen
  const greave = new THREE.Mesh(getGNIGreave(), mGold);
  greave.rotation.x = Math.PI - 0.34;
  greave.position.set(NI_HIP_X, 0.072 * HEX_R, 0.069 * HEX_R);
  group.add(greave);

  // HELM MONTEFORTINO ZLOTY: miska + karczek + policzki + czarna kita + 3 piora
  const bowl = new THREE.Mesh(getGNIMontBowl(), mGold);
  bowl.position.set(0, NI_HEAD_CTR + 0.030 * HEX_R, 0);
  group.add(bowl);
  const neckG = new THREE.Mesh(getGNIMontNeck(), mBronzL);
  neckG.rotation.x = -0.35;
  neckG.position.set(0, NI_HEAD_CTR - 0.014 * HEX_R, -(NI_HEAD_S * 0.5 + 0.020 * HEX_R));
  group.add(neckG);
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(getGNICheek(), mGold);
    ck.position.set(sx * (NI_HEAD_S * 0.5 + 0.004 * HEX_R), NI_HEAD_CTR - 0.014 * HEX_R, 0.018 * HEX_R);
    group.add(ck);
  }
  const kita = new THREE.Mesh(getGNIKita(), mBlack);
  kita.position.set(0, NI_HEAD_TOP + 0.030 * HEX_R, 0);
  group.add(kita);
  for (const sx of [-1, 0, 1]) {                    // 3 purpurowe piora (staly kolor)
    const f = new THREE.Mesh(getGNIFeather(), mPurple);
    f.rotation.z = -sx * 0.16;
    f.position.set(sx * 0.034 * HEX_R, NI_HEAD_TOP + (sx === 0 ? 0.098 : 0.088) * HEX_R, 0);
    group.add(f);
  }

  // PRAWE (-X) RAMIE + GLADIUS: pchniecie w przod na wysokosci piersi,
  // klinga NA OSI przedramienia (nic nie lewituje)
  const armR = niBuildArm(group, -NI_SHLD_X, 0.95, 1.50, mRed, mSkin, mLeath);
  const bladeDir = armR.axis;
  const blade = new THREE.Mesh(getGNIBlade(), mSteel);
  blade.rotation.x = Math.PI - 1.50;
  blade.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.098 * HEX_R));
  group.add(blade);
  const tip = new THREE.Mesh(getGNIBladeTip(), mSteel);
  tip.rotation.x = Math.PI - 1.50;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.1875 * HEX_R));
  group.add(tip);
  const guard = new THREE.Mesh(getGNIGuard(), mGold);
  guard.rotation.x = Math.PI - 1.50;
  guard.position.copy(armR.wrist.clone().addScaledVector(bladeDir, 0.030 * HEX_R));
  group.add(guard);

  // LEWE (+X) RAMIE + OWALNY SCUTUM przed korpusem (przedramie za polem)
  const armL = niBuildArm(group, NI_SHLD_X, 0.50, 1.10, mRed, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.034 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.22;                            // lekko ku osi ciala — oslona
  const shell = new THREE.Mesh(getGNIScutShell(), mLeath);   // rant + plecy (kontrast)
  sh.add(shell);
  const face = new THREE.Mesh(getGNIScutFace(), mOwner);     // POLE = KOLOR GRACZA
  face.position.set(0, 0, 0.016 * HEX_R);
  sh.add(face);
  const spina = new THREE.Mesh(getGNISpina(), mBronzL);      // pionowa listwa
  spina.position.set(0, 0, 0.024 * HEX_R);
  sh.add(spina);
  const umbo = new THREE.Mesh(getGNIUmbo(), mGold);          // centralne umbo
  umbo.position.set(0, 0, 0.034 * HEX_R);
  sh.add(umbo);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ---------------------------------------------------------------------------
// FALANGITA (Grecja, hoplita falangi) — 404 tri, POZA ATAKU
// Helm koryncki z grzebieniem (bez zmian), linothorax + pteruges, okragly
// wypukly ASPIS (pole = kolor gracza + lambda + brazowy rant) na LEWYM (+X)
// przedramieniu PRZED KORPUSEM, dory 0.74*HEX_R w PRAWEJ (-X) dloni
// NADRECZNIE: lokiec nad barkiem, grot w przod lekko w dol NA OSI wloczni;
// nagolenniki na obu goleniach, wykrok (biodra -0.010).
// ---------------------------------------------------------------------------
export function buildFalangita(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mLinen  = mat(NI_LINEN,     0.06, 0.82);
  const mBronze = mat(NI_BRONZE,    0.35, 0.50);
  const mBronzL = mat(NI_BRONZE_LT, 0.55, 0.35);
  const mSteel  = mat(NI_STEEL,     0.50, 0.40);
  const mOwner  = mat(ownerColor_,  0.16, 0.62);
  const mWood   = mat(NI_WOOD,      0.05, 0.85);
  const mCrest  = mat(NI_CRIMSON,   0.08, 0.74);
  const mLeath  = mat(NI_LEATHER,   0.06, 0.82);
  const mWoad   = mat(NI_WOAD,      0.05, 0.85);
  const mSkin   = mat(NI_SKIN,      0.05, 0.80);
  const mDark   = mat(0x20180f,     0.05, 0.90);

  const HIP_Y = NI_HIP_Y - 0.010 * HEX_R;   // biodra obnizone — wykrok bojowy

  // korpus: tors = linothorax (chiton woad na udach/ramionach); twarz pod helmem
  niBuildCore(group, mat, mLinen);
  for (const sx of [-1, 1]) {                       // naramienniki (yoke)
    const yoke = new THREE.Mesh(getGNIYoke(), mLinen);
    yoke.position.set(sx * 0.056 * HEX_R, NI_TORSO_TOP - 0.006 * HEX_R, 0);
    group.add(yoke);
  }
  const skirt = new THREE.Mesh(getGNISkirt(), mLeath);
  skirt.position.set(0, NI_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);

  // nogi: LEWA (+X) wykroczna, PRAWA (-X) zakroczna; golenie = nagolenniki
  niBuildLeg(group,  NI_HIP_X,  0.55,  0.30, mWoad, mBronzL, mLeath, HIP_Y);
  niBuildLeg(group, -NI_HIP_X, -0.50, -0.16, mWoad, mBronzL, mLeath, HIP_Y);

  // HELM KORYNCKI (bez zmian): dzwon na twarz + szczelina + grzebien
  const dome = new THREE.Mesh(getGNICorDome(), mBronze);
  dome.position.set(0, NI_HEAD_CTR + 0.014 * HEX_R, 0);
  group.add(dome);
  const slit = new THREE.Mesh(getGNISlit(), mDark);
  slit.position.set(0, NI_HEAD_CTR + 0.002 * HEX_R, 0.062 * HEX_R);
  group.add(slit);
  const crestB = new THREE.Mesh(getGNICrestBase(), mBronzL);
  crestB.position.set(0, NI_HEAD_TOP + 0.026 * HEX_R, -0.004 * HEX_R);
  group.add(crestB);
  const crestH = new THREE.Mesh(getGNICrestHair(), mCrest);
  crestH.rotation.x = 0.12;
  crestH.position.set(0, NI_HEAD_TOP + 0.076 * HEX_R, -0.008 * HEX_R);
  group.add(crestH);

  // PRAWE (-X) RAMIE + DORY NADRECZNIE: lokiec NAD barkiem, przedramie w przod,
  // wlocznia NA OSI DLONI pozioma-lekko w dol (grot ku wrogowi, sauroter w gore-tyl)
  const armR = niBuildArm(group, -NI_SHLD_X, -2.55, 1.32, mWoad, mSkin, mLeath);
  const spearTh = Math.PI * 0.5 + 0.20;              // os: przod +Z, 0.20 w dol
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGNIDoryShaft(), mWood);
  shaft.rotation.x = spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.130 * HEX_R));
  group.add(shaft);
  const dtip = new THREE.Mesh(getGNIDoryTip(), mSteel);
  dtip.rotation.x = spearTh;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 + 0.370 + 0.028) * HEX_R));
  group.add(dtip);
  const sauro = new THREE.Mesh(getGNISauroter(), mBronze);
  sauro.rotation.x = spearTh;
  sauro.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 - 0.370 - 0.024) * HEX_R));
  group.add(sauro);

  // LEWE (+X) RAMIE + ASPIS PRZED KORPUSEM (porpax: przedramie za polem tarczy)
  const armL = niBuildArm(group, NI_SHLD_X, 0.52, 1.05, mWoad, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.055 * HEX_R,
    armL.wrist.y + 0.065 * HEX_R,
    armL.wrist.z + 0.052 * HEX_R,
  );
  sh.rotation.y = -0.20;                            // lekko ku osi ciala — oslona
  const face = new THREE.Mesh(getGNIAspisFace(), mOwner);  // zwezany walec = wypuklosc
  face.rotation.x = Math.PI / 2;
  sh.add(face);
  const rim = new THREE.Mesh(getGNIAspisRim(), mBronzL);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  sh.add(rim);
  for (const s of [-1, 1]) {                        // LAMBDA (blazon lniany)
    const bar = new THREE.Mesh(getGNILambda(), mLinen);
    bar.rotation.z = s * 0.40;
    bar.position.set(s * 0.026 * HEX_R, -0.010 * HEX_R, 0.022 * HEX_R);
    sh.add(bar);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}
