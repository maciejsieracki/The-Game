/**
 * hastati-falangita.ts — proceduralne modele piechoty, KOREKTA v2 (render-jednostki)
 * ---------------------------------------------------------------------------
 * Zamienniki 1:1 dla starych tokenow z render/units.ts:
 *   buildHastati(ownerColor)   -> units.ts:1579 buildHastati (dispatch units.ts:1064)
 *   buildFalangita(ownerColor) -> „Falanga": dispatch PO NAZWIE w buildNamedUnit
 *     (units.ts, sekcja GRECJA); `case 'falanga'` w buildCategoryModel zostaje
 *     jako fallback kategorii. Patrz sekcja ZGODNOSC HISTORYCZNA przy funkcji.
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
let gNIEpisema:  THREE.RingGeometry | null = null;   // neutralny pierscien na aspis
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
// EPISEMA — plaski, malowany pierscien na polu aspis. RingGeometry lezy w
// plaszczyznie XY i patrzy w +Z, czyli DOKLADNIE w normalna tarczy w lokalnym
// ukladzie grupy `sh` — zero rotacji, wiec nie da sie jej zorientowac bokiem
// (blad, ktory w T2 tej serii uczynil tarcze Gaesatae niewidoczna dla kamery).
// 12 segmentow x 2 tri = 24 tri — dokladnie tyle, ile zajmowaly dwie belki
// zastapionej lambdy, wiec budzet 404 tri bez zmian.
function getGNIEpisema(): THREE.RingGeometry { return (gNIEpisema ||= new THREE.RingGeometry(0.058 * HEX_R, 0.082 * HEX_R, 12, 1)); }
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
// Helm koryncki z grzebieniem, linothorax + pteruges, okragly wypukly ASPIS
// (pole = kolor gracza + neutralna episema + brazowy rant) na LEWYM (+X)
// przedramieniu PRZED KORPUSEM, dory 0.74*HEX_R w PRAWEJ (-X) dloni
// NADRECZNIE: lokiec nad barkiem, grot w przod lekko w dol NA OSI wloczni;
// nagolenniki na obu goleniach, wykrok (biodra -0.010).
//
// DISPATCH: jednostka „Falanga" (units.json: Epoka=Zelazo, Kultura=Grecka,
// Typ=Falangite) trafia tu przez JAWNE rozpoznanie PO NAZWIE w buildNamedUnit()
// (units.ts, sekcja GRECJA). `case 'falanga'` w buildCategoryModel() zostaje
// jako fallback dla ewentualnych przyszlych jednostek tej kategorii.
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — hoplita grecki, ok. 500-350 p.n.e.
// ===========================================================================
// Rama czasowa: klasyczna falanga hoplicka, od wojen perskich do Cheronei.
// W grze jednostka nalezy do epoki Zelazo cywilizacji „Grecy", ktora jest
// JEDNA cywilizacja obejmujaca wszystkie polis (data/civs.json: jeden wpis
// „Grecy"; data/city-names-pools.json: Ateny, Sparta, Korynt, Teby, Argos,
// Mykeny, Milet, Rodos, Syrakuzy, Delfy — dziesiec ROWNORZEDNYCH nazw miast
// i miast-panstw tej samej cywilizacji). To ustalenie rozstrzyga K7 nizej.
//
// K1. LINOTHORAX (tors). Pancerz z klejonych warstw lnu, od ok. 500 p.n.e.
//   wypiera drozszy brazowy „dzwon" i staje sie standardem hoplity. Stad tors
//   w barwie surowego lnu (NI_LINEN), a nie brazu — brazowy pozostaje helm i
//   nagolenniki, czyli te elementy, ktore faktycznie kuto z brazu.
// K2. NARAMIENNIKI (yoke). Charakterystyczne sztywne klapy linothoraxu
//   zarzucane z plecow na barki i wiazane z przodu — jedyny element, po ktorym
//   linothorax rozpoznaje sie w sylwetce z dystansu. Ten sam material co tors.
// K3. PTERUGES. Pas skorzano-lnianych jezykow chroniacych biodra i uda, wiszacy
//   spod dolnej krawedzi pancerza. Uproszczone do jednej bryly — na skali
//   tokena pojedyncze jezyki zlalyby sie w szum.
// K4. HELM KORYNCKI. Kuty z jednego plata brazu, zakrywajacy cala twarz,
//   z waska szczelina oczna i nosalem; ikoniczny dla hoplity. Grzebien biegnie
//   WZDLUZ (przod-tyl), nie w poprzek — poprzeczny grzebien to oznaka oficera
//   (a u Rzymian centuriona), wiec dla szeregowego falangity byloby to bledne.
//   Barwa grzebienia: karmazyn (NI_CRIMSON) — najczestszy barwnik wojskowy.
//   Swiadome uproszczenie: dolna krawedz dzwonu zostawia ~0.014*HEX_R odslonietej
//   szczeki; prawdziwy helm koryncki schodzil do podstawy szyi, ale na skali
//   tokena calkowite zamkniecie twarzy zamienia glowe w jednolita bryle.
// K5. DORY. Wlocznia jednoreczna 2-2,5 m, NIE sarissa — sarissa (5-6 m, chwyt
//   oburacz, mala tarcza pelte przy barku) to pozniejsza falanga macedonska
//   Filipa II i bylaby tu anachronizmem oraz zla sylwetka. Drzewce dereniowe
//   (NI_WOOD), grot zelazny, na drugim koncu SAUROTER — brazowy kolec sluzacy
//   do dobijania i do wbicia wloczni w ziemie na postoju. Chwyt w punkcie
//   ROWNOWAGI, przesunietym ku tylowi wlasnie przez ciezar sauroter: 0.240
//   drzewca za dlonia, 0.500 przed nia (32%/68% dlugosci) — dlatego drzewce
//   MUSI wystawac za reke, a poza musi to pomiescic (patrz naprawa przy armR).
// K6. POZA NADRECZNA. units.json daje tej jednostce „Atak dystansowy"=0 —
//   wlocznia nie jest miotana, wiec poza musi byc jednoznacznie do walki
//   wrecz. Chwyt nadreczny (dlon na wysokosci skroni, grot skierowany w dol
//   ku przeciwnikowi) to najczestsze ujecie hoplity w malarstwie wazowym i
//   jedyne, ktore w zwartym szyku pozwala zadac cios ponad krawedzia tarczy.
// K7. ASPIS I EPISEMA — ROZSTRZYGNIETA KWESTIA BLAZONU (2026-08-25).
//   Aspis/hoplon: okragla, wypukla tarcza ~90 cm, niesiona na LEWYM
//   przedramieniu na uchwycie PORPAX (stad przedramie CALKOWICIE za polem
//   tarczy, nie obok niej). Aspis NIE MA umba — centralny guz to cecha tarczy
//   rzymskiej (scutum) i celtyckiej; jego dodanie byloby bledem, wiec go tu nie
//   ma, w odroznieniu od buildHastati() w tym samym pliku.
//   Do 2026-08-25 pole tarczy nioslo blazon LAMBDA (Λ). Λ = Lakedaimon, godlo
//   SPARTY — jednej polis, nie Grecji. W tej grze Sparta nie jest ani kultura,
//   ani nacja, ani osobna jednostka: jest JEDNA Z DZIESIECIU rownorzednych nazw
//   miast greckich (city-names-pools.json), obok Aten, Koryntu i Teb. „Falanga"
//   jest natomiast jednostka liniowa CALEJ cywilizacji Grecy — wystawia ja tak
//   samo gracz o stolicy w Atenach, jak ten o stolicy w Koryncie. Co wiecej,
//   jedyna jednostka grecka w tej grze przypisana konkretnej polis to „Hieros
//   Lochos (Swiety Zastep)", czyli tebanski Swiety Zastep — spartanska lambda
//   na generycznej falandze przeczylaby wiec wprost wlasnemu rosterowi.
//   Osobno: jednolite godla miejskie to zjawisko dopiero pozniejszego V i IV w.
//   p.n.e.; wczesniej hoplita malowal na aspisie godlo WLASNE (gorgoneion, zwierze,
//   wzor geometryczny), a wiele tarcz zostawalo bez godla.
//   DECYZJA: lambda usunieta, w jej miejsce neutralna EPISEMA — malowany
//   pierscien wspolsrodkowy z polem tarczy. Wzor geometryczny nie przypisuje
//   jednostki zadnej polis, jest attestowany jako zdobienie aspis i — inaczej
//   niz krzyz czy gwiazda — nie czyta sie jako godlo pozniejszej epoki. Pole
//   tarczy pozostaje kolorem gracza, bo to ono niesie przynaleznosc na mapie;
//   to samo miejsce, w ktorym prawdziwy hoplita mial swoja episeme.
// K8. NAGOLENNIKI (knemides). Brazowe, na OBU goleniach, zakladane na docisk
//   bez rzemieni — czesc pelnej panoplii hoplickiej. To NIE jest luka: sa w
//   modelu (materialem golenia w niBuildLeg jest braz), inaczej niz u hastati
//   z tego samego pliku, ktory ma tylko jedna nagolennice na nodze wykrocznej.
// K9. WYKROK. Biodra obnizone o 0.010*HEX_R wzgledem postawy neutralnej —
//   lewa (tarczowa) noga wykroczna, prawa zakroczna: postawa parcia w zwartym
//   szyku, w ktorym falanga napiera na przeciwnika masa szeregow.
// ===========================================================================
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

  // Nazwy mesh (instrumentacja pomiarowa dla real-render testu). Helpery
  // niBuildCore/niBuildLeg/niBuildArm sa WSPOLNE z buildHastati, wiec NIE
  // wolno ich modyfikowac — zamiast tego nazywamy dzieci dodane przez helper
  // po zakresie indeksow. Kolejnosc dodawania jest kontraktem helpera:
  //   niBuildCore -> [tors, szyja, glowa]
  //   niBuildLeg  -> [udo, golen, stopa]
  //   niBuildArm  -> [ramie, przedramie, (piesc jesli mFist != null)]
  const tag = (from: number, ...labels: string[]): void => {
    for (let i = 0; i < labels.length; i++) {
      const child = group.children[from + i];
      if (child !== undefined) child.name = 'falangita-' + labels[i];
    }
  };

  // korpus: tors = linothorax (chiton woad na udach/ramionach); twarz pod helmem
  let k = group.children.length;
  niBuildCore(group, mat, mLinen);
  tag(k, 'torso', 'neck', 'head');
  for (const sx of [-1, 1]) {                       // naramienniki (yoke)
    const yoke = new THREE.Mesh(getGNIYoke(), mLinen);
    yoke.position.set(sx * 0.056 * HEX_R, NI_TORSO_TOP - 0.006 * HEX_R, 0);
    yoke.name = sx < 0 ? 'falangita-yoke-right' : 'falangita-yoke-left';
    group.add(yoke);
  }
  const skirt = new THREE.Mesh(getGNISkirt(), mLeath);
  skirt.position.set(0, NI_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'falangita-pteruges';
  group.add(skirt);

  // nogi: LEWA (+X) wykroczna, PRAWA (-X) zakroczna; golenie = nagolenniki
  k = group.children.length;
  niBuildLeg(group,  NI_HIP_X,  0.55,  0.30, mWoad, mBronzL, mLeath, HIP_Y);
  tag(k, 'leg-left-thigh', 'leg-left-greave', 'leg-left-foot');
  k = group.children.length;
  niBuildLeg(group, -NI_HIP_X, -0.50, -0.16, mWoad, mBronzL, mLeath, HIP_Y);
  tag(k, 'leg-right-thigh', 'leg-right-greave', 'leg-right-foot');

  // HELM KORYNCKI (bez zmian): dzwon na twarz + szczelina + grzebien
  const dome = new THREE.Mesh(getGNICorDome(), mBronze);
  dome.position.set(0, NI_HEAD_CTR + 0.014 * HEX_R, 0);
  dome.name = 'falangita-helmet-dome';
  group.add(dome);
  const slit = new THREE.Mesh(getGNISlit(), mDark);
  slit.position.set(0, NI_HEAD_CTR + 0.002 * HEX_R, 0.062 * HEX_R);
  slit.name = 'falangita-helmet-slit';
  group.add(slit);
  const crestB = new THREE.Mesh(getGNICrestBase(), mBronzL);
  crestB.position.set(0, NI_HEAD_TOP + 0.026 * HEX_R, -0.004 * HEX_R);
  crestB.name = 'falangita-crest-base';
  group.add(crestB);
  const crestH = new THREE.Mesh(getGNICrestHair(), mCrest);
  crestH.rotation.x = 0.12;
  crestH.position.set(0, NI_HEAD_TOP + 0.076 * HEX_R, -0.008 * HEX_R);
  crestH.name = 'falangita-crest-hair';
  group.add(crestH);

  // PRAWE (-X) RAMIE + DORY NADRECZNIE: lokiec NAD barkiem i ZA nim, przedramie
  // w przod-w gore do dloni na wysokosci skroni, wlocznia NA OSI DLONI pozioma-
  // lekko w dol (grot ku wrogowi, sauroter w gore-tyl ponad ramieniem).
  //
  // NAPRAWA 2026-08-25 (temat R-ZELAZO-MODELE-BRAKUJACE-Q1-T3, pomiar w zywym
  // Three.js, nie odczyt zrodla). Kat przedramienia byl 1.32 — czyli PRAWIE
  // DOKLADNIE os wloczni (1.371 w tej samej konwencji, roznica 0.05 rad = 2.9°).
  // Przy chwycie w punkcie rownowagi dory 0.240*HEX_R drzewca wystaje ZA dlon,
  // a skoro przedramie bylo wspolliniowe z drzewcem, ta czesc drzewca szla
  // wzdluz przedramienia PROSTO W LOKIEC i dalej w ramie. Zmierzone PRZED:
  // odleglosc osi ramienia od osi wloczni spadala z 0.0747*HEX_R przy barku do
  // 0.0044*HEX_R przy lokciu, przy progu stycznosci 0.027+0.0105=0.0375 —
  // drzewce bylo zanurzone w gornych ~45% ramienia, w tej samej plaszczyznie X
  // (drzewce -0.1305..-0.1095, ramie -0.147..-0.093), wiec bez ucieczki bokiem.
  // To ten sam typ bledu, ktory w T1 tej serii wychwycily dopiero asercje
  // mierzace RELACJE geometryczne (lanca w udzie jezdzca) — niewidoczny dla
  // testu liczacego same nazwy mesh.
  // POPRAWKA: przedramie 1.32 -> 1.85 (dlon idzie w gore-w przod, nadgarstek
  // zalamany jak przy realnym chwycie nadrecznym). Lokiec schodzi teraz 0.049
  // PONIZEJ osi wloczni, bark byl i jest 0.135 ponizej — cale ramie po tej
  // samej stronie drzewca, klirens na calej dlugosci > progu. Sam kat ramienia
  // (-2.55) i punkt chwytu (rownowaga dory) BEZ ZMIAN — chwyt jest historyczny.
  k = group.children.length;
  const armR = niBuildArm(group, -NI_SHLD_X, -2.55, 1.85, mWoad, mSkin, mLeath);
  tag(k, 'arm-right-upper', 'arm-right-fore', 'arm-right-fist');
  const spearTh = Math.PI * 0.5 + 0.20;              // os: przod +Z, 0.20 w dol
  const spearAxis = new THREE.Vector3(0, -Math.sin(0.20), Math.cos(0.20));
  const grip = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const shaft = new THREE.Mesh(getGNIDoryShaft(), mWood);
  shaft.rotation.x = spearTh;
  shaft.position.copy(grip.clone().addScaledVector(spearAxis, 0.130 * HEX_R));
  shaft.name = 'falangita-dory-shaft';
  group.add(shaft);
  const dtip = new THREE.Mesh(getGNIDoryTip(), mSteel);
  dtip.rotation.x = spearTh;
  dtip.rotation.y = Math.PI / 4;
  dtip.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 + 0.370 + 0.028) * HEX_R));
  dtip.name = 'falangita-dory-tip';
  group.add(dtip);
  const sauro = new THREE.Mesh(getGNISauroter(), mBronze);
  sauro.rotation.x = spearTh;
  sauro.position.copy(grip.clone().addScaledVector(spearAxis, (0.130 - 0.370 - 0.024) * HEX_R));
  sauro.name = 'falangita-sauroter';
  group.add(sauro);

  // LEWE (+X) RAMIE + ASPIS PRZED KORPUSEM (porpax: przedramie za polem tarczy)
  k = group.children.length;
  const armL = niBuildArm(group, NI_SHLD_X, 0.52, 1.05, mWoad, mSkin, null);
  tag(k, 'arm-left-upper', 'arm-left-fore');
  const sh = new THREE.Group();
  sh.position.set(
    armL.wrist.x - 0.055 * HEX_R,
    armL.wrist.y + 0.065 * HEX_R,
    armL.wrist.z + 0.052 * HEX_R,
  );
  sh.rotation.y = -0.20;                            // lekko ku osi ciala — oslona
  const face = new THREE.Mesh(getGNIAspisFace(), mOwner);  // zwezany walec = wypuklosc
  face.rotation.x = Math.PI / 2;
  face.name = 'falangita-aspis-face';
  sh.add(face);
  const rim = new THREE.Mesh(getGNIAspisRim(), mBronzL);
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0, 0, -0.004 * HEX_R);
  rim.name = 'falangita-aspis-rim';
  sh.add(rim);
  // EPISEMA — patrz K7. Neutralny malowany pierscien zamiast lambdy (Λ =
  // Lakedaimon, godlo JEDNEJ z dziesieciu greckich polis w tej grze).
  const epis = new THREE.Mesh(getGNIEpisema(), mLinen);
  epis.position.set(0, 0, 0.022 * HEX_R);
  epis.name = 'falangita-aspis-episema';
  sh.add(epis);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  // Kotwice do asercji geometrycznych — punkty odniesienia BIORĄ SIĘ Z MODELU,
  // nie są wpisane liczbowo w teście (lekcja T1/T2 serii).
  group.userData['anchors'] = {
    headTopY: NI_HEAD_TOP,
    headCtrY: NI_HEAD_CTR,
    torsoTopY: NI_TORSO_TOP,
    torsoBotY: NI_TORSO_BOT,
    torsoHalfW: NI_TORSO_W * 0.5,
    torsoHalfD: NI_TORSO_D * 0.5,
    hipY: HIP_Y,
    shoulderY: NI_SHLD_Y,
    shoulderX: NI_SHLD_X,
    grip: grip.toArray(),
    spearAxis: spearAxis.toArray(),
    doryLen: 0.740 * HEX_R,
    hexR: HEX_R,
  };
  return group;
}
