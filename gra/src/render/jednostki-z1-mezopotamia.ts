/**
 * jednostki-z1-mezopotamia.ts — ZELAZO P1: MEZOPOTAMIA / INDUS (4 jednostki)
 * ---------------------------------------------------------------------------
 * Bespoke modele dla 4 jednostek EPOKI ZELAZA, ktore dzis renderuja sie jako
 * generyk newBuildWojownikKamien (kamienny wojownik!):
 *   buildGwardiaHetycka(ownerColor)       "Gwardia hetycka"        (Hetyci, miecz, elita 40/9)
 *   buildPiechotaNeobabilonska(ownerColor)"Piechota neobabilonska" (Babilonia, miecz)
 *   buildMurTarcz(ownerColor)             "Mur tarcz (Sargonid)"   (Sumer, wlocznia, formacja)
 *   buildGarnizonHarappy(ownerColor)      "Garnizon Harappy"       (Harappa, miecz-tasak)
 *
 * Interfejs i konwencje BEZ ZMIAN (rodzina hastati-falangita.ts / p8a / p57):
 *   - figurka PRZODEM do +Z, stopy na y = 0, wysokosc ~0.55*HEX_R,
 *   - uklad prawoskretny: LEWA reka = +X (TARCZA), PRAWA = -X (BRON),
 *   - group.userData['mats'] i ['perTokenGeos'] jak w units.ts,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - anatomia lancuchowa z1Seg/z1BuildLeg/z1BuildArm = niSeg/niBuildLeg/
 *     niBuildArm (hastati-falangita.ts), BRON NA OSI DLONI, POZY ATAKU,
 *   - helm na KAZDEJ glowie, kolor gracza = POLE TARCZY + SZARFA.
 *
 * EWOLUCJA KREWNYCH Z BRAZU (wiecej metalu; ZELAZO = ciemniejszy, zimniejszy
 * metal niz braz):
 *   GWARDIA HETYCKA  — ciezsza siostra buildPiechotaHetycka (p8a): lamelkowy
 *     kaftan zelazny na kremowej tunice, ZELAZNY MIECZ PROSTY (ewolucja
 *     sierpowatego) w pchnieciu na wysokosci piersi, tarcza-OSEMKA wzmocniona
 *     zelaznym bosem, helm zelazny z WYSOKIM grzebieniem + nauszniki,
 *     buty z zadartymi noskami (hetycki detal), szeroki ciemny pas.
 *   PIECHOTA NEOBABILONSKA — ewolucja buildWojownikBabilonski (p8a): kaftan
 *     PIKOWANY (ceglasty, pionowe przeszycia kremowe), zigzag muru na dole
 *     (merlony — znak Babilonu), TARCZA WIEZOWA (pole = kolor gracza, zelazne
 *     listwy) ze SKROMNYM zlotym Isztar-akcentem (krzyz 8 promieni mniejszy
 *     niz u Gwardii Ishtar), zelazny miecz prosty w CIOSIE Z GORY (ta sama
 *     poza co sierpowiec przodka), helm: zelazny stozek z NAKARCZNIKIEM,
 *     broda klockowa (2 rzedy).
 *   MUR TARCZ (SARGONID) — ewolucja buildSumerianSpearman (p57): SCIANA TARCZ,
 *     WIELKA prostokatna tarcza formacyjna OKUTA zelazem (listwy poziome +
 *     pionowe okucia krawedzi + nity), wlocznia POZIOMA nad krawedzia,
 *     helm ZELAZNY (nie miedziany!) z nosalem i nakarcznikiem, czarna
 *     kwadratowa broda, tunika teal + kaunakes + 2 zelazne lamelki torsu.
 *   GARNIZON HARAPPY — ewolucja buildStraznikHarappy (p8b): plecionka
 *     trzcinowa WZMOCNIONA SKORA (pasy skorzane + zelazne nity), ZELAZNY
 *     MIECZ-TASAK nisko przy pasie (postawa garnizonowa jak przodek), TURBAN
 *     NA HELMIE SKORZANYM z karneolowym klejnotem, naszyjnik z paciorkow
 *     (karneol/turkus), biala bawelna, skora doliny Indusu, oczy odkryte.
 *
 * Budzet: <=~460 tri na figurke — realne liczby w raporcie (countTri).
 *
 * ===========================================================================
 * AUDYT R-ZELAZO-AUDYT-POZOSTALE-Q1-T5 (2026-08-25) — CO ZMIERZONO I ZMIENIONO
 * ===========================================================================
 * Ten plik powstal PRZED seria Opus 5 i nigdy nie przeszedl pomiaru zywej
 * geometrii. Audyt T5 zbudowal wszystkie cztery figurki w prawdziwym Chromium
 * (Playwright + Three.js), policzyl swiatowe OBB kazdego mesh i przepuscil
 * KAZDA PARE brył przez test SAT. Wyniki:
 *
 *   ZNALEZIONE I NAPRAWIONE (Mur tarcz — jedyna jednostka z realnymi bledami):
 *   A1. WLOCZNIA PRZECHODZILA PRZEZ WLASNE RAMIE wlocznika. Drzewce lezalo na
 *       osi PRZEDRAMIENIA (`ax = armR.axis`), a lokiec byl zgiety tylko o 0,34
 *       rad, wiec cale ramie bylo praktycznie wspolliniowe z drzewcem — w tej
 *       samej plaszczyznie x = -0,120xHEX_R, bez ucieczki bokiem. Zmierzone
 *       PRZED: odleglosc osi ramienia od osi wloczni spadala z 0,0233xHEX_R
 *       przy barku do 0,0096xHEX_R przy lokciu, przy progu stycznosci
 *       0,027+0,0095 = 0,0365; SAT dawal 0,0365xHEX_R zanurzenia drzewca w
 *       ramieniu i 0,0295 w przedramieniu. To DOKLADNIE ten sam blad, ktory
 *       T3 tej serii znalazl w dory Falangi (hastati-falangita.ts, komentarz
 *       przy niBuildArm) i T1 w lancy jezdzca. NAPRAWA wzorem T3: wlocznia
 *       dostaje WLASNA OS (`MT_SPEAR_AXIS`, pozioma-lekko w dol), odczepiona
 *       od osi przedramienia, a ramie zostaje przelozone tak, zeby nadgarstek
 *       byl WYZEJ od lokcia (thU 1,24 -> 1,00, thF 1,58 -> 2,05). Idac w tyl
 *       od chwytu drzewce sie PODNOSI, a ramie OPADA — rozjazd rosnie na calej
 *       dlugosci zamiast malec do zera.
 *   A2. LEWE PRZEDRAMIE STERCZALO NA WYLOT PRZEZ POLE TARCZY. Tarcza byla
 *       jedyna z czterech ustawiona na WPISANEJ NA SZTYWNO pozycji
 *       (`sh.position.set(0.130, 0.195, 0.105)`), a zwrot z `z1BuildArm` byl
 *       ODRZUCANY — pozostale trzy jednostki kotwicza tarcze w `armL.wrist`.
 *       Nadgarstek wypadal na z = 0,117, plyta tarczy na z = 0,091..0,112:
 *       SAT dawal 0,0373xHEX_R przez deske i 0,0303 przez POLE W KOLORZE
 *       GRACZA, czyli gola skora przedramienia wychodzila PRZED tarcza — po
 *       stronie, z ktorej patrzy kamera gry. NAPRAWA: tarcza zakotwiczona w
 *       `armL.wrist` jak u pozostalej trojki.
 *   A3. Przy okazji A2: tarcza „Mur tarcz" byla MNIEJSZA (0,184x0,354) niz
 *       tarcza Garnizonu Harappy (0,210x0,340) — mimo Obrony 10 i Pancerza 7
 *       (najwyzsze w calej czworce) wobec 8/5 Harappy. Po naprawie 0,244x0,394
 *       i przesunieta ku osi ciala, wiec faktycznie zaslania tors: jest teraz
 *       najwieksza z czterech, zgodnie z nazwa jednostki i jej statystykami.
 *
 *   ZMIERZONE I POTWIERDZONE JAKO POPRAWNE (bez zmian geometrii):
 *   B1. Gwardia hetycka, Piechota neobabilonska, Garnizon Harappy — ZERO
 *       przenikania broni przez cialo i zero przenikania konczyn przez tarcze.
 *       Jedyne zachodzenia bryl to zamierzone warstwy (lamelki na torsie, helm
 *       na czaszce, pas na spodnicy, piesc na rekojesci, dwa loby osemki).
 *   B2. Zaden z czterech modeli NIE ma bledu z T2 (tarcza obrocona tak, ze jest
 *       niewidoczna dla kamery gry). Kamera gry (`camera.ts`) stoi na stalym
 *       azymucie 0 i elewacji 52 stopni, wiec patrzy wzdluz (0; -0,788; -0,616).
 *       Normale pol tarcz w kolorze gracza: Gwardia (-0,199; 0; 0,980),
 *       Piechota (-0,179; 0; 0,984), Mur tarcz (0; 0; 1), Harappa (-0,179; 0;
 *       0,984) — iloczyn skalarny z kierunkiem patrzenia -0,60..-0,62 dla
 *       kazdej, czyli KAZDA jest zwrocona do kamery.
 *
 *   ZMIANY WSPOLNE DLA CALEJ CZWORKI (warunek mozliwosci audytu):
 *   C1. Kazdy mesh dostal `name` z prefiksem jednostki (`het-`, `nb-`, `mt-`,
 *       `gr-`) i kazda grupa `userData['anchors']` — tak jak
 *       hastati-falangita.ts i rodzina *-opus5.ts. PRZED audytem plik nie
 *       nazywal ANI JEDNEGO mesh, wiec zaden test nie mogl zaadresowac czesci,
 *       a punkty odniesienia musialyby byc wpisane liczbowo w test (czyli test
 *       mierzylby sam siebie). To jest powod, dla ktorego ten plik przez cztery
 *       tematy serii nie byl sprawdzony.
 *   C2. `units.ts` — cztery linie dispatchu dostaly ALIASY ANGIELSKIE. PRZED
 *       audytem `Hittite Guard`, `Neo-Babylonian Infantry`, `Shield Wall
 *       (Sargonid)` i `Harappan Garrison` (kolumna „Nazwa EN" z units.json)
 *       NIE trafialy w te modele — zmierzone: kazda z tych czterech nazw
 *       dawala 28-mesh generyk `miecznik` zamiast wlasnej figurki, podczas gdy
 *       nazwa polska dawala 34-37 mesh. Dodany rdzen EN jest utwardzeniem
 *       sciezki dzis nieosiagalnej w zywych wywolaniach `buildUnitModel` —
 *       wszystkie przekazuja `stats['Jednostka']` (PL), zweryfikowane w
 *       testBattle.ts/main.ts/unitMiniPreview.ts/units.ts — nie naprawa
 *       aktywnego bledu.
 *
 * ZMIERZONE PROPORCJE PO NAPRAWIE (harness real-render, nie z pamieci):
 *   Gwardia hetycka        h=0,7403  maxR=0,4243  minY=0,0000  mesh=34
 *   Piechota neobabilonska h=0,7628  maxR=0,2691  minY=0,0000  mesh=37
 *   Mur tarcz (Sargonid)   h=0,6395  maxR=0,6623  minY=0,0000  mesh=35
 *   Garnizon Harappy       h=0,6240  maxR=0,3867  minY=0,0000  mesh=37
 * Twardy limit heksu to maxR <= 0,866xHEX_R — wszystkie z zapasem.
 *
 * ZMIERZONE POLA TARCZ PO NAPRAWIE (pudelko wszystkich mesh `*-shield-*`):
 *   Mur tarcz    0,244 x 0,394 = 0,0961  <- NAJWIEKSZA (Obrona 10, Pancerz 7)
 *   Harappa      0,224 x 0,352 = 0,0789
 *   Gwardia      0,169 x 0,332 = 0,0563
 *   Piechota nb. 0,163 x 0,296 = 0,0483
 * Tarcza Muru tarcz siega od y=0,001 (ziemia) do 0,395 i obejmuje x od -0,080
 * do 0,164, czyli faktycznie zaslania tors (polowa szerokosci torsu = 0,090).
 *
 * ZMIERZONY CHWYT (styk drzewca z reka — porownanie z rodzina, nie prog z
 * sufitu): Falangita z T3 (model zaakceptowany) ma przenikanie przedramie/
 * drzewce 0,0218 i piesc/drzewce 0,0335 przy ramieniu 0,0000. Mur tarcz po
 * naprawie: przedramie 0,0244, piesc 0,0325, RAMIE 0,0000. Styk dloni z
 * drzewcem jest zamierzony — to jest chwyt; zanurzenie RAMIENIA nie jest.
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

// ── paleta (seria + ZELAZO: ciemniejszy i zimniejszy metal niz braz) ────────
const Z1_SKIN       = 0xe0ac69;   // skora (Anatolia/Mezopotamia)
const Z1_SKIN_INDUS = 0xb8824e;   // skora doliny Indusu (jak p8b)
const Z1_IRON       = 0x8f97a3;   // ZELAZO — ciemniejsze/zimniejsze niz braz
const Z1_IRON_DK    = 0x6b7280;   // zelazo ciemne (okucia, lamelki)
const Z1_BRONZE     = 0xcf9234;   // braz (akcenty przetrwale z epoki brazu)
const Z1_GOLD       = 0xd8b040;   // zloto (Isztar-akcent, garda elity)
const Z1_WOOD       = 0x7a5c3a;
const Z1_LEATHER    = 0x6b4a28;
const Z1_LEATHER_DK = 0x53381e;   // szeroki pas hetycki
const Z1_LINEN      = 0xe8e0c8;   // tunika hetycka (jak przodek)
const Z1_BRICK      = 0x9c4a2e;   // cegla mulowa Babilonu (jak przodek)
const Z1_CREAM      = 0xe6d9b8;   // przeszycia pikowania / merlony
const Z1_TEAL       = 0x1f7a78;   // tunika Sumeru (jak przodek)
const Z1_FLEECE     = 0xd8c8a0;   // kaunakes sumeryjski
const Z1_COTTON     = 0xefe9d6;   // bawelna Harappy
const Z1_REED       = 0xd8c07c;   // plecionka trzcinowa (jasna)
const Z1_REED_DARK  = 0xa07f42;   // trzcina ciemna (listwy)
const Z1_CARNELIAN  = 0xc05528;   // karneol Harappy
const Z1_TEALBEAD   = 0x2a9d8f;   // turkusowy paciorek
const Z1_DARKHAIR   = 0x2a1a0a;   // broda
const Z1_DARK       = 0x20180f;   // grzebien/kita
const Z1_EYE        = 0x1a1008;

// ── wymiary sylwetki (rodzina NI_* z hastati-falangita.ts — spojna seria) ───
const Z1_HIP_Y     = 0.208 * HEX_R;
const Z1_TORSO_W   = 0.180 * HEX_R;
const Z1_TORSO_H   = 0.205 * HEX_R;
const Z1_TORSO_D   = 0.100 * HEX_R;
const Z1_TORSO_BOT = 0.240 * HEX_R;
const Z1_TORSO_CTR = Z1_TORSO_BOT + Z1_TORSO_H * 0.5;
const Z1_TORSO_TOP = Z1_TORSO_BOT + Z1_TORSO_H;
const Z1_NECK_H    = 0.028 * HEX_R;
const Z1_HEAD_S    = 0.128 * HEX_R;
const Z1_HEAD_CTR  = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S * 0.5;
const Z1_HEAD_TOP  = Z1_TORSO_TOP + Z1_NECK_H + Z1_HEAD_S;
const Z1_SHLD_X    = Z1_TORSO_W * 0.5 + 0.030 * HEX_R;
const Z1_SHLD_Y    = Z1_TORSO_TOP - 0.024 * HEX_R;
const Z1_HIP_X     = 0.052 * HEX_R;
const Z1_THIGH_L   = 0.104 * HEX_R;
const Z1_SHIN_L    = 0.096 * HEX_R;
const Z1_UPARM_L   = 0.100 * HEX_R;
const Z1_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (cache po kluczu — wspolne miedzy tokenami) ────────
const z1GeoCache = new Map<string, THREE.BufferGeometry>();
function getG(key: string, make: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = z1GeoCache.get(key);
  if (!g) { g = make(); z1GeoCache.set(key, g); }
  return g;
}
function gBox(key: string, w: number, h: number, d: number): THREE.BufferGeometry {
  return getG(key, () => new THREE.BoxGeometry(w * HEX_R, h * HEX_R, d * HEX_R));
}

// czesci wspolne sylwetki (identyczne wymiary jak rodzina NI_*)
function gTorso()   { return gBox('torso', 0.180, 0.205, 0.100); }
function gNeck()    { return gBox('neck', 0.042, 0.028 * 1.6, 0.042); }
function gHead()    { return gBox('head', 0.128, 0.128, 0.128); }
function gThigh()   { return gBox('thigh', 0.056, 0.104, 0.060); }
function gShin()    { return gBox('shin', 0.038, 0.096, 0.042); }
function gFoot()    { return gBox('foot', 0.044, 0.026, 0.078); }
function gUpArm()   { return gBox('uparm', 0.054, 0.100, 0.054); }
function gForearm() { return gBox('forearm', 0.040, 0.092, 0.040); }
function gFist()    { return gBox('fist', 0.046, 0.046, 0.048); }
function gSkirt()   { return gBox('skirt', 0.196, 0.070, 0.118); }
function gBelt()    { return gBox('belt', 0.190, 0.034, 0.112); }
function gBeltWide(){ return gBox('beltwide', 0.192, 0.056, 0.114); }
function gSash()    { return gBox('sash', 0.052, 0.230, 0.010); }
function gToe()     { return gBox('toe', 0.030, 0.034, 0.022); }
function gEye()     { return gBox('eye', 0.020, 0.020, 0.008); }

// tarcza osemkowa (hetycka — jak przodek z p8a): fasetowany owal z lukiem
function z1OvalRing(a: number, b: number, c: number, N: number): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i < N; i++) {
    const ang = (i / N) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(ang) * a, y = Math.sin(ang) * b;
    pts.push([x, y, -c * (x / a) * (x / a)]);
  }
  return pts;
}
function z1MakeShell(a: number, b: number, c: number, t: number, N: number): THREE.BufferGeometry {
  const ring = z1OvalRing(a, b, c, N);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const F = t * 0.5, B = -t * 0.5;
  for (let i = 0; i < N; i++) {
    const p = ring[i]!, q = ring[(i + 1) % N]!;
    P(0, 0, F); P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + F);
    P(0, 0, B); P(q[0], q[1], q[2] + B); P(p[0], p[1], p[2] + B);
    P(p[0], p[1], p[2] + F); P(p[0], p[1], p[2] + B); P(q[0], q[1], q[2] + B);
    P(p[0], p[1], p[2] + F); P(q[0], q[1], q[2] + B); P(q[0], q[1], q[2] + F);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function z1MakeFace(a: number, b: number, c: number, N: number): THREE.BufferGeometry {
  const ring = z1OvalRing(a, b, c, N);
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
function gFig8Shell() { return getG('fig8shell', () => z1MakeShell(0.082 * HEX_R, 0.094 * HEX_R, 0.026 * HEX_R, 0.018 * HEX_R, 8)); }
function gFig8Face()  { return getG('fig8face',  () => z1MakeFace(0.070 * HEX_R, 0.080 * HEX_R, 0.020 * HEX_R, 8)); }

// ── anatomia lancuchowa (konwencja niSeg/niBuildLeg/niBuildArm) ─────────────
function z1DirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function z1Seg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = z1DirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}
function z1BuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mFoot: THREE.MeshStandardMaterial, hipY: number = Z1_HIP_Y,
): { footZ: number } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = z1Seg(group, gThigh(), mThigh, P, thU, Z1_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = z1Seg(group, gShin(), mShin, P, thL, Z1_SHIN_L);
  const foot = new THREE.Mesh(gFoot(), mFoot);
  foot.position.set(sx, 0.013 * HEX_R, P.z + 0.016 * HEX_R);
  group.add(foot);
  return { footZ: P.z + 0.016 * HEX_R };
}
function z1BuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, Z1_SHLD_Y, 0);
  P = z1Seg(group, gUpArm(), mUp, P, thU, Z1_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = z1Seg(group, gForearm(), mFore, P, thF, Z1_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(gFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(z1DirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: z1DirDown(thF) };
}
function z1Core(
  group: THREE.Group, mat: MatFactory, mTorso: THREE.MeshStandardMaterial,
  skinColor: number = Z1_SKIN, eyes: boolean = false,
): THREE.MeshStandardMaterial {
  const torso = new THREE.Mesh(gTorso(), mTorso);
  torso.position.set(0, Z1_TORSO_CTR, 0);
  group.add(torso);
  const mSkin = mat(skinColor, 0.05, 0.80);
  const neck = new THREE.Mesh(gNeck(), mSkin);
  neck.position.set(0, Z1_TORSO_TOP + Z1_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(gHead(), mSkin);
  head.position.set(0, Z1_HEAD_CTR, 0);
  group.add(head);
  if (eyes) {
    const mEye = mat(Z1_EYE, 0.02, 0.95);
    for (const sx of [-1, 1]) {
      const eye = new THREE.Mesh(gEye(), mEye);
      eye.position.set(sx * 0.028 * HEX_R, Z1_HEAD_CTR + 0.008 * HEX_R, Z1_HEAD_S * 0.5 + 0.004 * HEX_R);
      group.add(eye);
    }
  }
  return mSkin;
}
/** Szarfa gracza skosna przez tors (nosnik koloru gracza — jak seria). */
function z1Sash(group: THREE.Group, mOwner: THREE.MeshStandardMaterial): void {
  const s = new THREE.Mesh(gSash(), mOwner);
  s.rotation.z = 0.60;
  s.position.set(0, Z1_TORSO_CTR + 0.012 * HEX_R, Z1_TORSO_D * 0.5 + 0.007 * HEX_R);
  group.add(s);
}
/**
 * Nadaje nazwy mesh dodanym do `group` od indeksu `from` w gore — konwencja
 * `tag()` z hastati-falangita.ts. Bez nazw zaden test geometryczny nie moze
 * zaadresowac czesci i musialby porownywac wpisane liczby z wpisanymi liczbami
 * (lekcja T1/T2/T3 tej serii — patrz naglowek pliku, punkt C1).
 */
function z1Tagger(group: THREE.Group, prefix: string) {
  return (from: number, ...labels: string[]): void => {
    for (let i = 0; i < labels.length; i++) {
      const child = group.children[from + i];
      if (child !== undefined) child.name = prefix + labels[i];
    }
  };
}

/** Broda klockowa (styl mezopotamski): schodkowane rzedy. */
function z1Beard(group: THREE.Group, mHair: THREE.MeshStandardMaterial, rows: number): void {
  const z0 = Z1_HEAD_S * 0.5 - 0.004 * HEX_R;
  const geos = [gBox('beard1', 0.088, 0.026, 0.026), gBox('beard2', 0.074, 0.026, 0.022), gBox('beard3', 0.056, 0.026, 0.018)];
  for (let i = 0; i < rows; i++) {
    const b = new THREE.Mesh(geos[i], mHair);
    b.position.set(0, Z1_HEAD_CTR - (0.052 + i * 0.026) * HEX_R, z0 + (0.012 - i * 0.003) * HEX_R);
    group.add(b);
  }
}

// ---------------------------------------------------------------------------
// 1. GWARDIA HETYCKA (Hetyci, ZELAZO, ELITA 40/9) — POZA: pchniecie zelaznym
// mieczem prostym na wysokosci piersi, tarcza-osemka oslania korpus, gleboki
// wykrok. Ciezsza siostra Piechoty hetyckiej (p8a): lamelkowy kaftan zelazny
// na kremowej tunice, helm ZELAZNY z WYSOKIM grzebieniem + nauszniki, tarcza
// osemkowa wzmocniona zelaznym bosem, buty z zadartymi noskami, szeroki pas.
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Gwardia hetycka)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura=Hetyci, Tech=Hutnictwo zelaza, Typ=
// Swordsman, Atak 9 / Obrona 8 / Pancerz 5, Health 40 (najwyzsze z czworki),
// Uwagi: „Elitarna gwardia palacowa zelaza". Nazwa EN „Hittite Guard".
//
// K1. RAMA CZASOWA — NAJPIERW ROZSTRZYGNIETA, BO JEST PUŁAPKA. Imperium
//     hetyckie UPADA ok. 1180 p.n.e., czyli dokladnie na progu epoki zelaza:
//     „hetycka jednostka epoki zelaza" nie moze byc jednostka Hattusy.
//     Model osadzono w panstwach NEOHETYCKICH (syro-hetyckich) — Karkemisz,
//     Melid/Malatya, Tabal, Gurgum, Sam'al/Zincirli, Hamat — ok. 1180-700
//     p.n.e., ktore przejely hetycki jezyk hieroglificzny, tytulature i sztuke
//     dworska. Domkniecie ramy: Sargon II anektuje Karkemisz w 717 p.n.e.
//     To jest ta sama operacja, ktora T4 tej serii wykonal dla Slowian
//     (rozdzielenie warstwy VI-VII i IX-X w.): jednostka siedzi w warstwie
//     pozniejszej, bo tylko ta istnieje w epoce, ktora przypisuje jej gra.
// K2. ZELAZO — I DLACZEGO NIE JEST TU RECEPCJA MITU. „Hetycki monopol na
//     zelazo" to teza dzis odrzucana: w epoce brazu zelazo jest u Hetytow
//     metalem RZADKIM i prestizowym, nie surowcem uzbrojenia masowego.
//     Zrodlo pierwszego rzedu: list Hattusilego III do krola asyryjskiego
//     (KBo 1.14, tzw. „list o zelazie") tlumaczy, ze dobrego zelaza w
//     Kizzuwatnie akurat brak i wysyla jedno ostrze. Dopiero po 1200 p.n.e.
//     zelazo staje sie w Anatolii i polnocnej Syrii metalem uzytkowym — czyli
//     dokladnie w warstwie neohetyckiej z K1. Zelazny kaftan i zelazny miecz
//     tej figurki sa wiec poprawne WYLACZNIE dzieki decyzji K1.
// K3. MIECZ PROSTY, NIE SIERPOWATY. Przodek z brazu (buildPiechotaHetycka,
//     p8a) nosi bron sierpowata (sappara/khopesh) — forma z II tys. p.n.e.,
//     odlewana z brazu, bijaca krawedzia zewnetrzna. Zelazo pozwala kuc dluga,
//     obosieczna glownie sztywna na pchniecie i taka jest tu pokazana: prosta
//     klinga na osi przedramienia, w PCHNIECIU (nie w cieciu). Ewolucja broni,
//     nie ewolucja ruchu — to jest widoczna, sprawdzalna roznica wobec przodka.
// K4. HELM STOZKOWY Z NAUSZNIKAMI I WYSOKIM GRZEBIENIEM. Reliefy z Karkemisz
//     (tzw. Dluga Sciana Rzezb i Sciana Herolda, X-IX w. p.n.e.; publikacja:
//     C. L. Woolley, „Carchemish" II-III, British Museum) pokazuja piechure
//     w helmach z grzebieniem i osłona policzkow. Grzebien jest tu CELOWO
//     wysoki i biegnie przod-tyl: to znacznik ELITY (Health 40, „gwardia
//     palacowa"), odrozniajacy te figurke od zwyklej piechoty hetyckiej
//     w tej samej grze.
// K5. BUTY Z ZADARTYMI NOSKAMI — najmocniejszy pojedynczy znacznik anatolijski
//     w calym modelu. Wystepuja konsekwentnie w sztuce hetyckiej: Brama Krolow
//     w Hattusie, procesje bogow z Yazilikaya, a takze w egipskich
//     przedstawieniach Hetytow spod Kadesz (reliefy Ramzesa II). Forma
//     przezywa upadek imperium i widac ja dalej w rzezbie neohetyckiej.
// K6. TARCZA-OSEMKA — WYBOR SWIADOMY, Z JAWNIE NAZWANYM NAPIECIEM. Tarcza
//     „w ksztalcie osemki" (z wcieciami po bokach) to forma II tys. p.n.e.,
//     egejsko-anatolijska. Na reliefach NEOHETYCKICH dominuje juz tarcza
//     OKRAGLA — czyli sciśle rzecz biorac osemka jest w X-VIII w. p.n.e.
//     forma ARCHAICZNA. Zostawiono ja mimo to, z trzech powodow, ktore
//     zapisuje sie tu zamiast zamiatac: (a) to jednostka GWARDII PALACOWEJ,
//     a wlasnie uzbrojenie gwardii jest w kulturach dworskich najbardziej
//     archaizujace i heraldyczne; (b) w tej grze figurka ma czytac sie jako
//     CIEZSZA SIOSTRA hetyckiej piechoty z brazu — wspolna sylwetka tarczy
//     jest nosnikiem tej ciaglosci; (c) tarcz okraglych roster juz uzywa i
//     osemka jest jedynym ksztaltem w calej czworce Mezopotamii, ktory nie
//     powtarza sie u sasiada (kryterium odroznialnosci). Zelazny bos w talii
//     osemki jest natomiast zmiana epokowa wobec przodka — braz -> zelazo.
// K7. KAFTAN LAMELKOWY na tunice, nie pelna zbroja plytowa. Zbroja lamelkowa
//     i luskowa jest na Bliskim Wschodzie epoki zelaza dobrze poswiadczona
//     (m.in. zelazne luski z Nimrud, Fort Salmanassara), ale zawsze jako
//     rzedy malych plytek naszytych na podklad — i tak jest tu pokazana:
//     trzy pasy lamelek na kremowej tunice lnianej, nie skorupa. Pancerz=5
//     w units.json to wartosc srednia rosteru, nie maksymalna — zbroja ma
//     wygladac na czesciowa i tak wyglada.
// K8. KOLOR GRACZA: pole obu lobow osemki + skosna szarfa na torsie. Dwa
//     sloty, jak w calej serii. Kremowy len i ciemna skora pasa sa neutralne
//     kulturowo i nie konkuruja z kolorem gracza o uwage.
// K9. CZEGO SWIADOMIE NIE MA: rydwanu (osobna jednostka w grze), luku
//     (units.json: „Atak dystansowy": 0 — to czysta jednostka zwarcia),
//     brody (odroznienie od Mezopotamczykow wlasciwych — Piechota
//     neobabilonska i Mur tarcz maja brody, Hetyta jest golony, zgodnie
//     z ikonografia anatolijska).
// ---------------------------------------------------------------------------
export function buildGwardiaHetycka(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const tag = z1Tagger(group, 'het-');
  let k = 0;

  const mLinen  = mat(Z1_LINEN,      0.06, 0.82);
  const mIron   = mat(Z1_IRON,       0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,    0.50, 0.46);
  const mGold   = mat(Z1_GOLD,       0.55, 0.35);
  const mOwner  = mat(ownerColor_,   0.14, 0.64);
  const mLeath  = mat(Z1_LEATHER,    0.06, 0.82);
  const mLeathD = mat(Z1_LEATHER_DK, 0.05, 0.85);
  const mSkin   = mat(Z1_SKIN,       0.05, 0.80);
  const mDark   = mat(Z1_DARK,       0.05, 0.88);

  const HIP_Y = Z1_HIP_Y - 0.012 * HEX_R;   // gleboki wykrok (elita napiera)

  // korpus: kremowa tunika + LAMELKOWY KAFTAN ZELAZNY (3 pasy lamelek)
  k = group.children.length;
  z1Core(group, mat, mLinen);
  tag(k, 'torso', 'neck', 'head');
  k = group.children.length;
  for (let i = 0; i < 3; i++) {
    const lam = new THREE.Mesh(gBox('hetlam', 0.184, 0.040, 0.106), (i % 2 === 0) ? mIron : mIronD);
    lam.position.set(0, Z1_TORSO_TOP - (0.052 + i * 0.048) * HEX_R, 0);
    group.add(lam);
  }
  tag(k, 'lamella-1', 'lamella-2', 'lamella-3');
  const skirt = new THREE.Mesh(gSkirt(), mLinen);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'het-skirt';
  group.add(skirt);
  const belt = new THREE.Mesh(gBeltWide(), mLeathD);   // szeroki pas hetycki
  belt.position.set(0, 0.258 * HEX_R, 0);
  belt.name = 'het-belt';
  group.add(belt);
  k = group.children.length;
  z1Sash(group, mOwner);
  tag(k, 'sash');

  // nogi: LEWA (+X) wykroczna; BUTY Z ZADARTYMI NOSKAMI (hetycki detal)
  k = group.children.length;
  const legL = z1BuildLeg(group,  Z1_HIP_X,  0.58,  0.34, mLinen, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-left-thigh', 'leg-left-shin', 'leg-left-foot');
  k = group.children.length;
  const legR = z1BuildLeg(group, -Z1_HIP_X, -0.52, -0.20, mLinen, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-right-thigh', 'leg-right-shin', 'leg-right-foot');
  k = group.children.length;
  for (const [sx, fz] of [[Z1_HIP_X, legL.footZ], [-Z1_HIP_X, legR.footZ]] as [number, number][]) {
    const toe = new THREE.Mesh(gToe(), mLeath);
    toe.rotation.x = -0.55;
    toe.position.set(sx, 0.030 * HEX_R, fz + 0.042 * HEX_R);
    group.add(toe);
  }
  tag(k, 'boot-toe-left', 'boot-toe-right');

  // HELM ZELAZNY stozkowy + nauszniki + WYSOKI GRZEBIEN przod-tyl (elita)
  const cone = new THREE.Mesh(getG('hetcone', () => new THREE.CylinderGeometry(0.040 * HEX_R, 0.098 * HEX_R, 0.115 * HEX_R, 8, 1)), mIron);
  cone.position.set(0, Z1_HEAD_CTR + 0.042 * HEX_R, 0);
  cone.name = 'het-helmet-cone';
  group.add(cone);
  k = group.children.length;
  for (const sx of [-1, 1]) {
    const ck = new THREE.Mesh(gBox('hetcheek', 0.020, 0.052, 0.044), mIron);
    ck.position.set(sx * (Z1_HEAD_S * 0.5 + 0.004 * HEX_R), Z1_HEAD_CTR - 0.012 * HEX_R, 0.014 * HEX_R);
    group.add(ck);
  }
  tag(k, 'helmet-cheek-right', 'helmet-cheek-left');
  const crest = new THREE.Mesh(gBox('hetcrest', 0.024, 0.088, 0.150), mDark);  // WYSOKI grzebien
  crest.rotation.x = 0.10;
  crest.position.set(0, Z1_HEAD_TOP + 0.088 * HEX_R, -0.008 * HEX_R);
  crest.name = 'het-helmet-crest';
  group.add(crest);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ PROSTY: pchniecie na wysokosci piersi,
  // klinga NA OSI przedramienia (ewolucja: sierpowaty -> prosty zelazny)
  k = group.children.length;
  const armR = z1BuildArm(group, -Z1_SHLD_X, 1.02, 1.40, mLinen, mSkin, mLeath);
  tag(k, 'arm-right-upper', 'arm-right-fore', 'arm-right-fist');
  const swAxis = armR.axis;
  const guard = new THREE.Mesh(gBox('hetguard', 0.056, 0.018, 0.024), mGold);
  guard.rotation.x = Math.PI - 1.40;
  guard.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.032 * HEX_R));
  guard.name = 'het-sword-guard';
  group.add(guard);
  const blade = new THREE.Mesh(gBox('hetblade', 0.026, 0.150, 0.014), mIron);
  blade.rotation.x = Math.PI - 1.40;
  blade.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.110 * HEX_R));
  blade.name = 'het-sword-blade';
  group.add(blade);
  const tip = new THREE.Mesh(getG('hettip', () => new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)), mIron);
  tip.rotation.x = Math.PI - 1.40;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.206 * HEX_R));
  tip.name = 'het-sword-tip';
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA-OSEMKA WZMOCNIONA (pole gracza, zelazny bos)
  k = group.children.length;
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.50, 1.08, mLinen, mSkin, null);
  tag(k, 'arm-left-upper', 'arm-left-fore');
  const sh = new THREE.Group();
  sh.name = 'het-shield';
  sh.position.set(
    armL.wrist.x - 0.025 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.045 * HEX_R,
  );
  sh.rotation.y = -0.20;
  let lobe = 0;
  for (const dy of [0.072, -0.072]) {                  // dwa loby osemki
    const lname = (lobe++ === 0) ? 'upper' : 'lower';
    const shell = new THREE.Mesh(gFig8Shell(), mLeath);
    shell.position.set(0, dy * HEX_R, 0);
    shell.name = 'het-shield-shell-' + lname;
    sh.add(shell);
    const face = new THREE.Mesh(gFig8Face(), mOwner);
    face.position.set(0, dy * HEX_R, 0.013 * HEX_R);
    face.name = 'het-shield-face-' + lname;
    sh.add(face);
  }
  const boss = new THREE.Mesh(gBox('hetboss', 0.040, 0.040, 0.022), mIron);  // zelazny bos (talia osemki)
  boss.rotation.z = Math.PI / 4;
  boss.position.set(0, 0, 0.018 * HEX_R);
  boss.name = 'het-shield-boss';
  sh.add(boss);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  // Kotwice do asercji geometrycznych — punkty odniesienia BIORA SIE Z MODELU,
  // nie sa wpisane liczbowo w tescie (lekcja T1/T2 serii).
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z1_HEAD_TOP, headCtrY: Z1_HEAD_CTR,
    torsoTopY: Z1_TORSO_TOP, torsoBotY: Z1_TORSO_BOT,
    torsoHalfW: Z1_TORSO_W * 0.5, torsoHalfD: Z1_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z1_SHLD_Y, shoulderX: Z1_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: swAxis.toArray(),
    shieldKind: 'figure-8',
    shieldFaceW: 0.140 * HEX_R, shieldFaceH: 0.376 * HEX_R,
  };
  return group;
}

// ---------------------------------------------------------------------------
// 2. PIECHOTA NEOBABILONSKA (Babilonia, ZELAZO) — POZA: CIOS Z GORY zelaznym
// mieczem prostym (ta sama poza co sierpowiec przodka z brazu — ewolucja
// broni, nie ruchu). Kaftan PIKOWANY (ceglasty + pionowe przeszycia kremowe),
// merlony zigzagu muru na dole (znak Babilonu), TARCZA WIEZOWA z zelaznymi
// listwami i SKROMNYM zlotym Isztar-akcentem, helm: zelazny stozek z
// NAKARCZNIKIEM, broda klockowa (2 rzedy).
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Piechota neobabilonska)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura=Babilonia, Tech=Hutnictwo zelaza, Typ=
// Swordsman, Atak 8 / Obrona 8 / Pancerz 5, Uwagi: „Piechota neobabilonska;
// zbalansowana elita zelaza". Nazwa EN „Neo-Babylonian Infantry".
//
// K1. RAMA CZASOWA jest tu wyjatkowo ostra i nie wymaga zadnej akrobacji:
//     panstwo nowobabilonskie (chaldejskie) trwa od 626 p.n.e. (Nabopolassar)
//     do 539 p.n.e., gdy Cyrus zajmuje Babilon. Cale mieści sie w epoce
//     zelaza. Szczyt to panowanie Nabuchodonozora II (605-562 p.n.e.).
// K2. NAJWAZNIEJSZE ZASTRZEZENIE ZRODLOWE — I NIE ZAMIATAM GO. W odroznieniu
//     od Asyrii, ktora zostawila setki metrow palacowych reliefow z
//     dokladnymi wizerunkami zolnierzy, BABILONIA NOWOBABILONSKA NIE MA
//     ZACHOWANEJ NARRACYJNEJ SZTUKI WOJENNEJ. Wiemy o jej armii glownie
//     z TEKSTOW administracyjnych: archiwa swiatynne Eanny w Uruk i Ebabbar
//     w Sippar rejestruja pobor, ekwipunek wydawany rekrutom i system
//     nadan ziemi za sluzbe (pozniej u Achemenidow sformalizowany jako
//     bit qasti — „lan luku" — i bit sisi — „lan konia"). Wniosek uczciwy:
//     KAZDY szczegol wizualny tej figurki jest ekstrapolacja z ogolnej
//     praktyki bliskowschodniej epoki zelaza (przede wszystkim asyryjskiej,
//     ktora Babilonia przejela wraz z panstwem po 612 p.n.e.), a nie odczytem
//     z babilonskiego przedstawienia. Tak to trzeba czytac.
// K3. HELM: ZELAZNY STOZEK Z NAKARCZNIKIEM. To forma kanoniczna dla
//     Mezopotamii epoki zelaza — spiczasty helm z nakarcznikiem widac
//     na reliefach z Nimrud i Niniwy, a same egzemplarze zelaznych helmow
//     i zelaznych lusek pancerza wydobyto w Nimrud (Fort Salmanassara).
//     Po upadku Niniwy w 612 p.n.e. armia babilonska dziedziczy asyryjski
//     park uzbrojenia razem z terytorium — to jest najlepsza dostepna
//     przeslanka, i jest wprost nazwana.
// K4. BRODA KLOCKOWA, DWA RZEDY. Broda gesta, ciezka, ukladana w regularne
//     rzedy loków to konwencja przedstawieniowa mezopotamska ciagnaca sie
//     od Sumeru po Asyrie i Babilonie. Dwa rzedy (a nie trzy, jak u brodatych
//     dostojnikow) — bo to szeregowy, nie krol.
// K5. ZNAK ISZTAR: OSMIOPROMIENNA GWIAZDA na tarczy, ZLOTO, MALA. Osmioramienna
//     gwiazda to ustalony symbol Isztar (planeta Wenus) — wystepuje masowo na
//     kudurru (kamieniach granicznych) i pieczeciach cylindrycznych. Isztar
//     jest boginia patronka miasta, ktorego brame — Brame Isztar Nabuchodonozora
//     II, ok. 575 p.n.e., dzis w Pergamonmuseum — zdobia glazurowane cegly.
//     UWAGA NA DOKLADNOSC: sama Brama Isztar nie nosi gwiazd, tylko smoki
//     musznuszu i tury; gwiazda jest znakiem BOGINI, nie ornamentem tej bramy.
//     Rozmiar znaku jest tu CELOWO maly — wieksza, dominujaca rozeta Isztar
//     nalezy w tej grze do „Gwardii Isztar" (jednostka brazu) i nie wolno jej
//     zdublowac.
// K6. MERLONY I KOLOR CEGLY. Dwa schodkowe zabki na dole kaftana to merlony —
//     zwienczenie murow babilonskich, powtarzajace sie na rekonstrukcji Bramy
//     Isztar. Ceglasta barwa pikowanego kaftana odsyla do cegly mulowej, z
//     ktorej zbudowany jest caly Babilon (glazurowana ceglana licowka jest
//     tylko naskorkiem reprezentacyjnym). To jest ZNACZNIK CZYTELNOSCI W GRZE,
//     nie ustalenie zrodlowe — barwy babilonskich tunik wojskowych nie znamy
//     i tak to nalezy traktowac.
// K7. MIECZ PROSTY W CIOSIE Z GORY. Poza jest ta sama co u przodka z brazu
//     (buildWojownikBabilonski, p8a), bron inna: prosta obosieczna glownia
//     zelazna zamiast sierpowatej sappary. Powtorzenie ruchu przy zmianie
//     broni jest zamierzone — to czyni ewolucje widoczna. units.json daje
//     „Atak dystansowy": 0, wiec zadnego luku ani procy tu nie ma, mimo ze
//     luk byl w armiach mezopotamskich bronia najliczniejsza; dane jednostki
//     rozstrzygaja przeciw statystyce historycznej i to jest swiadome.
// K8. KAFTAN PIKOWANY (dwa pionowe przeszycia). Pikowany/watowany podklad
//     tekstylny jest najtansza i najpowszechniejsza ochrona korpusu w calej
//     epoce; przy Pancerzu=5 (srodek skali rosteru) to trafna forma —
//     figurka NIE ma dostac lusek, bo luski nosi w tej grupie Gwardia hetycka
//     (Health 40) i Mur tarcz (Pancerz 7).
// K9. KOLOR GRACZA: pole tarczy wiezowej (duza plaszczyzna, doskonale widoczna
//     pod katem 52 stopni) + szarfa. Dwa sloty, jak w calej serii.
// ---------------------------------------------------------------------------
export function buildPiechotaNeobabilonska(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const tag = z1Tagger(group, 'nb-');
  let k = 0;

  const mBrick  = mat(Z1_BRICK,    0.05, 0.84);
  const mCream  = mat(Z1_CREAM,    0.06, 0.82);
  const mIron   = mat(Z1_IRON,     0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,  0.50, 0.46);
  const mGold   = mat(Z1_GOLD,     0.55, 0.35);
  const mOwner  = mat(ownerColor_, 0.14, 0.64);
  const mWood   = mat(Z1_WOOD,     0.05, 0.85);
  const mLeath  = mat(Z1_LEATHER,  0.06, 0.82);
  const mSkin   = mat(Z1_SKIN,     0.05, 0.80);
  const mHair   = mat(Z1_DARKHAIR, 0.05, 0.88);

  const HIP_Y = Z1_HIP_Y - 0.010 * HEX_R;

  // korpus: kaftan PIKOWANY — ceglasty tors + 2 pionowe przeszycia kremowe
  k = group.children.length;
  z1Core(group, mat, mBrick);
  tag(k, 'torso', 'neck', 'head');
  k = group.children.length;
  for (const sx of [-0.045, 0.045]) {
    const seam = new THREE.Mesh(gBox('nbseam', 0.014, 0.190, 0.008), mCream);
    seam.position.set(sx * HEX_R, Z1_TORSO_CTR, Z1_TORSO_D * 0.5 + 0.005 * HEX_R);
    group.add(seam);
  }
  tag(k, 'quilt-seam-right', 'quilt-seam-left');
  const skirt = new THREE.Mesh(gSkirt(), mBrick);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'nb-skirt';
  group.add(skirt);
  const hem = new THREE.Mesh(gBox('nbhem', 0.198, 0.026, 0.120), mCream);
  hem.position.set(0, Z1_TORSO_BOT - 0.052 * HEX_R, 0);
  hem.name = 'nb-hem';
  group.add(hem);
  k = group.children.length;
  for (const sx of [-1, 1]) {                          // merlony zigzagu muru
    const mer = new THREE.Mesh(gBox('nbmerlon', 0.024, 0.020, 0.008), mBrick);
    mer.position.set(sx * 0.062 * HEX_R, Z1_TORSO_BOT - 0.044 * HEX_R, 0.062 * HEX_R);
    group.add(mer);
  }
  tag(k, 'merlon-right', 'merlon-left');
  const belt = new THREE.Mesh(gBelt(), mLeath);
  belt.position.set(0, 0.256 * HEX_R, 0);
  belt.name = 'nb-belt';
  group.add(belt);
  k = group.children.length;
  z1Sash(group, mOwner);
  tag(k, 'sash');

  // nogi
  k = group.children.length;
  z1BuildLeg(group,  Z1_HIP_X,  0.55,  0.30, mBrick, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-left-thigh', 'leg-left-shin', 'leg-left-foot');
  k = group.children.length;
  z1BuildLeg(group, -Z1_HIP_X, -0.50, -0.16, mBrick, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-right-thigh', 'leg-right-shin', 'leg-right-foot');

  // HELM: ZELAZNY stozek + NAKARCZNIK + broda klockowa (2 rzedy)
  const cone = new THREE.Mesh(getG('nbcone', () => new THREE.CylinderGeometry(0.038 * HEX_R, 0.096 * HEX_R, 0.120 * HEX_R, 8, 1)), mIron);
  cone.position.set(0, Z1_HEAD_CTR + 0.044 * HEX_R, 0);
  cone.name = 'nb-helmet-cone';
  group.add(cone);
  const neckG = new THREE.Mesh(gBox('nbneckg', 0.130, 0.042, 0.020), mIronD);
  neckG.rotation.x = -0.38;
  neckG.position.set(0, Z1_HEAD_CTR - 0.018 * HEX_R, -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R));
  neckG.name = 'nb-helmet-neckguard';
  group.add(neckG);
  k = group.children.length;
  z1Beard(group, mHair, 2);
  tag(k, 'beard-row-1', 'beard-row-2');

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ w CIOSIE Z GORY (poza przodka-sierpowca)
  k = group.children.length;
  const armR = z1BuildArm(group, -Z1_SHLD_X, -2.15, 2.45, mBrick, mSkin, mLeath);
  tag(k, 'arm-right-upper', 'arm-right-fore', 'arm-right-fist');
  const swAxis = armR.axis;
  const grip = new THREE.Mesh(gBox('nbgrip', 0.024, 0.062, 0.024), mWood);
  grip.rotation.x = Math.PI - 2.45;
  grip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.016 * HEX_R));
  grip.name = 'nb-sword-grip';
  group.add(grip);
  const guard = new THREE.Mesh(gBox('nbguard', 0.056, 0.018, 0.024), mIronD);
  guard.rotation.x = Math.PI - 2.45;
  guard.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.052 * HEX_R));
  guard.name = 'nb-sword-guard';
  group.add(guard);
  const blade = new THREE.Mesh(gBox('nbblade', 0.026, 0.150, 0.014), mIron);
  blade.rotation.x = Math.PI - 2.45;
  blade.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.132 * HEX_R));
  blade.name = 'nb-sword-blade';
  group.add(blade);
  const tip = new THREE.Mesh(getG('nbtip', () => new THREE.ConeGeometry(0.016 * HEX_R, 0.042 * HEX_R, 4)), mIron);
  tip.rotation.x = Math.PI - 2.45;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(armR.wrist.clone().addScaledVector(swAxis, 0.228 * HEX_R));
  tip.name = 'nb-sword-tip';
  group.add(tip);

  // LEWE (+X) RAMIE + TARCZA WIEZOWA (pole gracza, zelazne listwy,
  // SKROMNY zloty Isztar-akcent: krzyz 8 promieni w gornej czesci)
  k = group.children.length;
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.46, 1.02, mBrick, mSkin, null);
  tag(k, 'arm-left-upper', 'arm-left-fore');
  const sh = new THREE.Group();
  sh.name = 'nb-shield';
  sh.position.set(
    armL.wrist.x - 0.020 * HEX_R,
    armL.wrist.y + 0.045 * HEX_R,
    armL.wrist.z + 0.048 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const face = new THREE.Mesh(gBox('nbshface', 0.156, 0.296, 0.020), mOwner);
  face.name = 'nb-shield-face';
  sh.add(face);
  let bi = 0;
  for (const fy of [-0.118, 0.118]) {                  // zelazne listwy okuc
    const bar = new THREE.Mesh(gBox('nbshbar', 0.164, 0.022, 0.010), mIronD);
    bar.position.set(0, fy * HEX_R, 0.012 * HEX_R);
    bar.name = 'nb-shield-bar-' + (bi++ === 0 ? 'lower' : 'upper');
    sh.add(bar);
  }
  let ri = 0;
  for (const rot of [0, Math.PI / 4, Math.PI / 2, -Math.PI / 4]) {  // Isztar: 8 malych promieni
    const ray = new THREE.Mesh(gBox('nbray', 0.014, 0.084, 0.008), mGold);
    ray.rotation.z = rot;
    ray.position.set(0, 0.056 * HEX_R, 0.014 * HEX_R);
    ray.name = 'nb-ishtar-ray-' + (ri++);
    sh.add(ray);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z1_HEAD_TOP, headCtrY: Z1_HEAD_CTR,
    torsoTopY: Z1_TORSO_TOP, torsoBotY: Z1_TORSO_BOT,
    torsoHalfW: Z1_TORSO_W * 0.5, torsoHalfD: Z1_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z1_SHLD_Y, shoulderX: Z1_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: swAxis.toArray(),
    shieldKind: 'tower',
    shieldFaceW: 0.156 * HEX_R, shieldFaceH: 0.296 * HEX_R,
  };
  return group;
}

// ---------------------------------------------------------------------------
// 3. MUR TARCZ (SARGONID) (Sumer, ZELAZO, formacja 6/10) — POZA: SCIANA TARCZ
// (ewolucja wlocznika sumeryjskiego z p57). WIELKA prostokatna tarcza
// formacyjna OKUTA ZELAZEM (pole = kolor gracza, listwy poziome + okucia
// krawedzi + nity) frontem przed cialem, dol tuz nad ziemia; wlocznia POZIOMA
// nad krawedzia tarczy (lokiec uniesiony). Helm ZELAZNY (nie miedziany!)
// z nosalem i nakarcznikiem, czarna kwadratowa broda, tunika teal + kaunakes
// + 2 zelazne lamelki torsu (wiecej metalu niz u przodka).
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Mur tarcz / Sargonid)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura=Sumerowie, Nacja=Sumer, Tech=Hutnictwo
// zelaza, Typ=Spearman, Atak 6 / Obrona 10 / Pancerz 7 (NAJWYZSZE w calej
// czworce), „Bonus vs Mount %": 50, „W zamian za": Wlocznik sumeryjski,
// Uwagi: „Zelazna formacja tarczowa Sargonidow; mur tarcz + wlocznie".
// Nazwa EN „Shield Wall (Sargonid)".
//
// K1. ROZJAZD W SAMYCH DANYCH — NAZYWAM GO, ZAMIAST UDAWAC, ZE GO NIE MA.
//     Wpis laczy dwie rzeczy, ktore historycznie dzieli okolo 1300 lat:
//     „Sumerowie" (Sumer polityczny konczy sie z III dynastia z Ur, ok. 2004
//     p.n.e.; sumeryjski wymiera jako jezyk mowiony na poczatku II tys.) oraz
//     „Sargonid" — a to w asyriologii termin techniczny na OSTATNIA DYNASTIE
//     ASYRYJSKA: Sargon II (722-705), Sennacheryb, Asarhaddon, Assurbanipal,
//     do upadku Niniwy w 612 p.n.e. Termin bywa mylony z Sargonem Akkadzkim
//     (ok. 2334-2279 p.n.e.) — ale ten byl Akkadyjczykiem i czlowiekiem epoki
//     brazu, wiec do „Epoka=Zelazo" nie pasuje tym bardziej.
//     ROZSTRZYGNIECIE (decyzja Operatora, R-PROC-AUTOBOT.md par. 10 — to jest
//     kwestia badawcza, nie pytanie do wlasciciela; units.json jest POZA
//     allowlista tego tematu i nie zostal ruszony): figurka czyta sie jako
//     MEZOPOTAMSKA FORMACJA TARCZOWA EPOKI ZELAZA W WYDANIU SARGONIDZKIM,
//     dziedziczaca po sumeryjskim przodku ciaglosc wizualna (barwa tuniki,
//     tiery na biodrach), a nie uzbrojenie. Uzbrojenie jest zelazne i
//     sargonidzkie, bo tego wymaga Epoka i Tech.
// K2. DLACZEGO „MUR TARCZ" TO W OGOLE MOTYW SUMERYJSKI. Najstarsze
//     przedstawienie zwartej formacji piechoty ze SCIANA WIELKICH TARCZ,
//     z ktorej wystaja wlocznie, to Stela Sepow Eannatuma z Lagasz (ok. 2450
//     p.n.e., Luwr); pokrewny motyw ma „Sztandar z Ur" (ok. 2600 p.n.e.,
//     British Museum). Ta ikonografia jest powodem, dla ktorego gra wiaze
//     „mur tarcz" z Sumerem — i dlatego ten wybor jest w grze sensowny mimo
//     K1. Model dziedziczy z niej UKLAD (tarcza wieksza od czlowieka w pionie,
//     wlocznia ponad jej krawedzia), nie materialy.
// K3. UZBROJENIE JEST SARGONIDZKIE, BO EPOKA JEST ZELAZNA. Reliefy palacowe
//     z Niniwy i Nimrud (m.in. cykl zdobycia Lakisz przez Sennacheryba,
//     701 p.n.e., British Museum) pokazuja stala pare: WLOCZNIK plus
//     TARCZOWNIK z wielka tarcza, oraz helm stozkowy. Zelazne luski pancerza
//     i zelazne oporzadzenie wydobyto w Nimrud (Fort Salmanassara). Stad:
//     helm zelazny z NOSALEM i NAKARCZNIKIEM (nie miedziany helm z Ur!),
//     wielka prostokatna tarcza okuta zelazem, wlocznia z zelaznym grotem
//     i zelazna piecia (sauroterem).
// K4. „Bonus vs Mount 50%" w units.json ma pokrycie w geometrii, nie tylko
//     w liczbie: wlocznia jest pokazana POZIOMO, opartym chwytem, PONAD
//     krawedzia tarczy — czyli w pozycji przyjmowania szarzy, a nie w
//     zamachu. Po audycie T5 ta krawedz faktycznie istnieje pod wlocznia
//     (przed audytem wlocznia byla ponizej gornej krawedzi tarczy i szla
//     przez wlasne ramie wlocznika — patrz naglowek pliku, punkt A1).
// K5. KAUNAKES — ANACHRONIZM ZOSTAWIONY SWIADOMIE I TU ZAPISANY. Trzy rzedy
//     runa na biodrach to kaunakes: strojr wczesnodynastyczny (ok. 2900-2350
//     p.n.e.), a wiec o okolo 1800 lat starszy niz rama zelazna tej jednostki.
//     Zostawiony, bo (a) jest JEDYNYM nosnikiem sumeryjskiej tozsamosci, ktora
//     units.json tej jednostce przypisuje, a jednostka „zastepuje Wlocznika
//     sumeryjskiego" i musi czytac sie jako jego nastepca; (b) w skali zetonu
//     trzy tiery czytaja sie rownie dobrze jako FRedzlasty, warstwowy dol
//     tuniki, ktory na reliefach sargonidzkich wystepuje powszechnie — czyli
//     odczyt anachroniczny nie jest jedynym mozliwym; (c) usuniecie go
//     wymagaloby przebudowy sylwetki, czyli zmiany geometrii NIE wynikajacej
//     z pomiaru, a taka jest w tym temacie zakazana. Alternatywe rozwazono
//     i odrzucono — nie przeoczono.
// K6. BRODA KWADRATOWA, CZARNA. Konwencja mezopotamska od Sumeru po Asyrie
//     (Sztandar z Ur, reliefy asyryjskie). Odrozniona od Piechoty
//     neobabilonskiej ksztaltem: tam dwa schodkowane rzedy lokow, tu jeden
//     zwarty blok — dwie rozne konwencje fryzjerskie w tej samej grupie.
// K7. GOLENIE NAGIE, SANDALY. Piechota mezopotamska epoki zelaza na reliefach
//     nosi albo wysokie sznurowane buty (jednostki krolewskie), albo nic —
//     tu wybrano wersje uboższa, bo to formacja liniowa, nie gwardia.
// K8. KOLOR GRACZA: pole wielkiej tarczy (najwieksza plaszczyzna barwna z
//     calej czworki po naprawie A3) + szarfa. Dwa sloty, jak w calej serii.
// K9. CZEGO SWIADOMIE NIE MA: luku (units.json: „Atak dystansowy": 0), rydwanu,
//     miedzianego helmu typu Meskalamdug (to zabytek wczesnodynastyczny —
//     należy do epoki brazu i do przodka, nie tutaj).
// ---------------------------------------------------------------------------
export function buildMurTarcz(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const tag = z1Tagger(group, 'mt-');
  let k = 0;

  const mTeal   = mat(Z1_TEAL,     0.05, 0.85);
  const mFleece = mat(Z1_FLEECE,   0.04, 0.96);
  const mIron   = mat(Z1_IRON,     0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,  0.50, 0.46);
  const mWood   = mat(Z1_WOOD,     0.05, 0.85);
  const mOwner  = mat(ownerColor_, 0.12, 0.66);
  const mLeath  = mat(Z1_LEATHER,  0.06, 0.82);
  const mSkin   = mat(Z1_SKIN,     0.05, 0.80);
  const mBlack  = mat(Z1_DARK,     0.04, 0.90);

  const HIP_Y = Z1_HIP_Y - 0.006 * HEX_R;   // lekki wykrok — mur stoi

  // korpus: tunika teal + 2 ZELAZNE LAMELKI (ewolucja: metal na torsie)
  k = group.children.length;
  z1Core(group, mat, mTeal);
  tag(k, 'torso', 'neck', 'head');
  k = group.children.length;
  for (let i = 0; i < 2; i++) {
    const lam = new THREE.Mesh(gBox('mtlam', 0.184, 0.038, 0.106), (i === 0) ? mIron : mIronD);
    lam.position.set(0, Z1_TORSO_TOP - (0.050 + i * 0.046) * HEX_R, 0);
    group.add(lam);
  }
  tag(k, 'lamella-1', 'lamella-2');
  k = group.children.length;
  z1Sash(group, mOwner);
  tag(k, 'sash');

  // kaunakes: 3 rzedy runa (dziedzictwo sumeryjskie — K5)
  const rows: [THREE.BufferGeometry, number][] = [
    [gBox('mtfl1', 0.206, 0.034, 0.134), Z1_TORSO_BOT - 0.010 * HEX_R],
    [gBox('mtfl2', 0.198, 0.034, 0.130), Z1_TORSO_BOT - 0.044 * HEX_R],
    [gBox('mtfl3', 0.190, 0.034, 0.126), Z1_TORSO_BOT - 0.078 * HEX_R],
  ];
  k = group.children.length;
  for (const [geo, fy] of rows) {
    const r = new THREE.Mesh(geo, mFleece);
    r.position.set(0, fy, 0);
    group.add(r);
  }
  tag(k, 'kaunakes-1', 'kaunakes-2', 'kaunakes-3');

  // nogi: lekki wykrok (mur stoi), golenie nagie, sandaly
  k = group.children.length;
  z1BuildLeg(group,  Z1_HIP_X,  0.26,  0.10, mTeal, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-left-thigh', 'leg-left-shin', 'leg-left-foot');
  k = group.children.length;
  z1BuildLeg(group, -Z1_HIP_X, -0.26, -0.08, mTeal, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-right-thigh', 'leg-right-shin', 'leg-right-foot');

  // HELM ZELAZNY stozkowy + nosal + nakarcznik + czarna kwadratowa broda
  const helm = new THREE.Mesh(getG('mthelm', () => new THREE.CylinderGeometry(0.018 * HEX_R, 0.090 * HEX_R, 0.125 * HEX_R, 8, 1)), mIron);
  helm.position.set(0, Z1_HEAD_CTR + 0.040 * HEX_R, 0);
  helm.name = 'mt-helmet-cone';
  group.add(helm);
  const nose = new THREE.Mesh(gBox('mtnose', 0.018, 0.058, 0.016), mIronD);
  nose.position.set(0, Z1_HEAD_CTR - 0.008 * HEX_R, Z1_HEAD_S * 0.5 + 0.006 * HEX_R);
  nose.name = 'mt-helmet-nasal';
  group.add(nose);
  const neckG = new THREE.Mesh(gBox('mtneckg', 0.120, 0.040, 0.020), mIron);
  neckG.rotation.x = -0.38;
  neckG.position.set(0, Z1_HEAD_CTR - 0.020 * HEX_R, -(Z1_HEAD_S * 0.5 + 0.010 * HEX_R));
  neckG.name = 'mt-helmet-neckguard';
  group.add(neckG);
  const beard = new THREE.Mesh(gBox('mtbeard', 0.084, 0.052, 0.024), mBlack);
  beard.position.set(0, Z1_HEAD_CTR - 0.052 * HEX_R, Z1_HEAD_S * 0.5 - 0.004 * HEX_R);
  beard.name = 'mt-beard';
  group.add(beard);

  // PRAWE (-X) RAMIE + WLOCZNIA POZIOMA nad krawedzia tarczy.
  //
  // NAPRAWA A1 (audyt T5, pomiar w zywym Three.js — patrz naglowek pliku).
  // PRZED: `ax = armR.axis`, thU=1.24, thF=1.58 — drzewce lezalo DOKLADNIE na
  // osi przedramienia, a lokiec byl zgiety o 0.34 rad, wiec cale ramie bylo
  // praktycznie wspolliniowe z wloznia i lezalo w tej samej plaszczyznie
  // x = -Z1_SHLD_X. Zmierzone: odleglosc osi ramienia od osi wloczni 0.0233
  // przy barku i 0.0096 przy lokciu, przy progu stycznosci 0.027 + 0.0095 =
  // 0.0365 — drzewce bylo zanurzone w ramieniu. To ta sama klasa bledu co
  // dory Falangi w T3 i lanca jezdzca w T1.
  // PO: wlocznia dostaje WLASNA OS (MT_SPEAR_AXIS), odczepiona od osi
  // przedramienia, a ramie ma teraz NADGARSTEK WYZEJ OD LOKCIA (thU 1.24 ->
  // 1.00 opuszcza lokiec, thF 1.58 -> 2.05 podnosi dlon). Idac w tyl od
  // chwytu drzewce sie PODNOSI (grot lekko w dol), a ramie OPADA — rozjazd
  // rosnie zamiast malec do zera. Tylny zwis skrocony (0.600 drzewca, chwyt
  // przesuniety do tylnej jednej trzeciej), zeby pieta minela bark.
  const MT_SPEAR_TILT = 0.15;                            // grot lekko w dol
  const MT_SPEAR_AXIS = new THREE.Vector3(0, -Math.sin(MT_SPEAR_TILT), Math.cos(MT_SPEAR_TILT));
  const MT_SPEAR_ROTX = Math.PI * 0.5 + MT_SPEAR_TILT;   // z1Seg: rotX = PI - theta
  k = group.children.length;
  const armR = z1BuildArm(group, -Z1_SHLD_X, 0.95, 2.15, mTeal, mSkin, mSkin);
  tag(k, 'arm-right-upper', 'arm-right-fore', 'arm-right-fist');
  const grip = armR.wrist.clone();
  const shaft = new THREE.Mesh(gBox('mtshaft', 0.019, 0.520, 0.019), mWood);
  shaft.rotation.x = MT_SPEAR_ROTX;
  shaft.position.copy(grip.clone().addScaledVector(MT_SPEAR_AXIS, 0.175 * HEX_R));
  shaft.name = 'mt-spear-shaft';
  group.add(shaft);
  const tip = new THREE.Mesh(getG('mttip', () => new THREE.ConeGeometry(0.019 * HEX_R, 0.058 * HEX_R, 4)), mIron);
  tip.rotation.x = MT_SPEAR_ROTX;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(grip.clone().addScaledVector(MT_SPEAR_AXIS, (0.175 + 0.260 + 0.029) * HEX_R));
  tip.name = 'mt-spear-tip';
  group.add(tip);
  const butt = new THREE.Mesh(gBox('mtbutt', 0.024, 0.030, 0.024), mIronD);
  butt.rotation.x = MT_SPEAR_ROTX;
  butt.position.copy(grip.clone().addScaledVector(MT_SPEAR_AXIS, (0.175 - 0.260 - 0.015) * HEX_R));
  butt.name = 'mt-spear-butt';
  group.add(butt);

  // LEWE (+X) RAMIE za WIELKA TARCZA FORMACYJNA OKUTA (frontem — mur tarcz)
  //
  // NAPRAWA A2+A3 (audyt T5). PRZED: tarcza byla jedyna z czterech ustawiona
  // na WPISANEJ NA SZTYWNO pozycji (0.130, 0.195, 0.105), a zwrot z
  // z1BuildArm szedl do kosza — nadgarstek wypadal na z = 0.117, plyta na
  // 0.091..0.112, wiec gole przedramie sterczalo NA WYLOT przez pole tarczy
  // w kolorze gracza (SAT: 0.0303xHEX_R), po stronie kamery. Dodatkowo tarcza
  // jednostki o Obronie 10 i Pancerzu 7 byla MNIEJSZA (0.184x0.354) niz tarcza
  // Garnizonu Harappy o Obronie 8 i Pancerzu 5 (0.210x0.340).
  // PO: kotwica w `armL.wrist` jak u pozostalej trojki (przedramie ZA polem,
  // chwyt centralny za deska — uklad, ktory na reliefach sargonidzkich niesie
  // tarczownik), plyta powiekszona do 0.244x0.394 i przesunieta ku osi ciala,
  // wiec faktycznie zaslania tors. Jest teraz najwieksza z czworki.
  k = group.children.length;
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.42, 0.98, mTeal, mSkin, null);
  tag(k, 'arm-left-upper', 'arm-left-fore');
  const sh = new THREE.Group();
  sh.name = 'mt-shield';
  sh.position.set(
    armL.wrist.x - 0.078 * HEX_R,
    0.198 * HEX_R,                       // dol tuz nad ziemia — mur tarcz
    armL.wrist.z + 0.050 * HEX_R,
  );
  const back = new THREE.Mesh(gBox('mtshback', 0.244, 0.394, 0.012), mWood);
  back.position.set(0, 0, -0.008 * HEX_R);
  back.name = 'mt-shield-back';
  sh.add(back);
  const face = new THREE.Mesh(gBox('mtshface', 0.230, 0.380, 0.014), mOwner);
  face.name = 'mt-shield-face';
  sh.add(face);
  let bi = 0;
  for (const fy of [-0.112, 0.112]) {                  // ZELAZNE listwy poziome
    const bar = new THREE.Mesh(gBox('mtshbar', 0.244, 0.026, 0.010), mIronD);
    bar.position.set(0, fy * HEX_R, 0.008 * HEX_R);
    bar.name = 'mt-shield-bar-' + (bi++ === 0 ? 'lower' : 'upper');
    sh.add(bar);
  }
  let ei = 0;
  for (const fx of [-0.108, 0.108]) {                  // okucia pionowe krawedzi
    const edge = new THREE.Mesh(gBox('mtshedge', 0.020, 0.394, 0.010), mIron);
    edge.position.set(fx * HEX_R, 0, 0.006 * HEX_R);
    edge.name = 'mt-shield-edge-' + (ei++ === 0 ? 'inner' : 'outer');
    sh.add(edge);
  }
  let si = 0;
  for (const fy of [-0.036, 0.036]) {                  // nity w osi
    const st = new THREE.Mesh(gBox('mtstud', 0.024, 0.024, 0.010), mIron);
    st.rotation.z = Math.PI / 4;
    st.position.set(0, fy * HEX_R, 0.009 * HEX_R);
    st.name = 'mt-shield-stud-' + (si++);
    sh.add(st);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z1_HEAD_TOP, headCtrY: Z1_HEAD_CTR,
    torsoTopY: Z1_TORSO_TOP, torsoBotY: Z1_TORSO_BOT,
    torsoHalfW: Z1_TORSO_W * 0.5, torsoHalfD: Z1_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z1_SHLD_Y, shoulderX: Z1_SHLD_X,
    grip: grip.toArray(),
    weaponAxis: MT_SPEAR_AXIS.toArray(),
    forearmAxis: armR.axis.toArray(),
    shieldKind: 'formation-tower',
    shieldFaceW: 0.230 * HEX_R, shieldFaceH: 0.380 * HEX_R,
  };
  return group;
}

// ---------------------------------------------------------------------------
// 4. GARNIZON HARAPPY (Harappa, ZELAZO, 8/8) — POZA: postawa garnizonowa
// (obrona miasta-planu; ewolucja Straznika bram z p8b): WIELKA prostokatna
// tarcza plecionkowa WZMOCNIONA SKORA (pasy skorzane + zelazne nity, pas
// centralny = KOLOR GRACZA) przed korpusem, ZELAZNY MIECZ-TASAK nisko przy
// pasie (grot ku wrogowi — pchniecie zza tarczy). TURBAN NA HELMIE SKORZANYM
// z karneolowym klejnotem, naszyjnik z paciorkow (karneol/turkus), biala
// bawelna, skora doliny Indusu, oczy odkryte.
//
// ===========================================================================
// ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA (Garnizon Harappy)
// ===========================================================================
// units.json: Epoka=Zelazo, Kultura=Harappa, Nacja=Harappa, Tech=Hutnictwo
// zelaza, Typ=Swordsman, Atak 8 / Obrona 8 / Pancerz 5, Uwagi: „Zelazny
// garnizon miasta-planu; silna obrona terytorium". Nazwa EN „Harappan
// Garrison".
//
// K1. NAJWIEKSZE NAPIECIE W CALEJ CZWORCE — I NIE DA SIE GO PRZEMILCZEC.
//     Cywilizacja doliny Indusu (harappanska) w fazie dojrzalej to ok.
//     2600-1900 p.n.e. — EPOKA BRAZU. Zelazo pojawia sie w Azji Poludniowej
//     dopiero ok. 1800-1200 p.n.e. (Malhar, Raja Nala ka Tila, Dadupur w
//     dolinie Gangesu), a powszechne staje sie ok. 1000 p.n.e. wraz z
//     horyzontem Painted Grey Ware. „Harappanski garnizon epoki zelaza" jest
//     wiec z definicji anachronizmem — o jakies 700-1300 lat.
//     ROZSTRZYGNIECIE (decyzja Operatora, R-PROC-AUTOBOT.md par. 10; units.json
//     poza allowlista i nietkniety): model czyta sie jako POZNO-/POSTHARAPPANSKI
//     I WCZESNOZELAZNY garnizon miast Pendzabu i doliny Indusu — czyli
//     kontynuacja materialna i osadnicza Harappy w ramie czasowej, ktora gra
//     jednostce przypisuje. Praktycznie znaczy to: zelazna bron, ale ZERO
//     harappanskiej ikonografii wojennej (patrz K2), plus te elementy
//     kultury materialnej Harappy, ktore realnie przezyly upadek miast —
//     bawelna, karneol, plecionka trzcinowa.
// K2. DRUGIE ZASTRZEZENIE, ROWNIE WAZNE: HARAPPA NIE ZOSTAWILA SZTUKI WOJENNEJ.
//     Brak scen bitewnych, brak przedstawien uzbrojonych oddzialow, brak
//     jednoznacznie bojowych typow broni — miedziane i brazowe groty oraz
//     plaskie siekiery sa cienkie i nieuzebrowane. Militarna interpretacja
//     „cytadeli" Mohendzo-Daro i Harappy (Mortimer Wheeler, wraz z jego teza
//     o „masakrze" i najezdzie aryjskim) jest dzis w archeologii poludniowoazjatyckiej
//     w zasadzie odrzucona — mury czyta sie jako ochrone przeciwpowodziowa,
//     kontrole dostepu i manifestacje statusu (m.in. J. M. Kenoyer). Kazdy
//     szczegol UZBROJENIA tej figurki jest wiec ekstrapolacja, nie odczytem
//     ze zrodla harappanskiego, i tak nalezy go czytac.
// K3. SKAD BIERZE SIE MIECZ-TASAK — ZE ZRODEL GRECKICH O INDIACH EPOKI ZELAZA.
//     Arrian, „Indike" 16, za Nearchosem i Megastenesem, opisuje indyjska
//     piechote: luk dlugosci wlasnego wzrostu, TARCZA Z SUROWEJ WOLOWEJ SKORY
//     wezsza od czlowieka ale niemal tak dluga, oraz — u czesci — oszczepy
//     i SZEROKI MIECZ (machaira) dlugosci trzech lokci. Ten szeroki, ciezki,
//     tnacy miecz jest bezposrednim uzasadnieniem szerokiej klingi tasaka
//     w tym modelu; wersja zelazna, bo Epoka=Zelazo. To jest najmocniejsze
//     zrodlo, jakie ta figurka ma.
// K4. TARCZA: PLECIONKA TRZCINOWA WZMOCNIONA SKORA — SYNTEZA, NAZWANA WPROST.
//     Zrodla antyczne daja dwa materialy, nie jeden. Herodot VII.65 opisuje
//     indyjski kontyngent w armii Kserksesa (480 p.n.e.): szaty z „welny
//     drzewnej" (czyli BAWELNY), luki z trzciny i strzaly trzcinowe z
//     zelaznymi grotami. Arrian (K3) daje tarcze ze SKORY. Model laczy oba:
//     pole plecione z trzciny + poziome PASY SKORZANE + zelazne nity. Jest to
//     kompromis, a nie odczyt jednego zrodla — i dlatego jest tu zapisany
//     zamiast podany jako fakt. Duza, prostokatna, prawie wzrostu czlowieka —
//     zgodnie z opisem Arriana i z rola „garnizonu" (obrona, nie manewr).
// K5. TURBAN NA HELMIE SKORZANYM I KLEJNOT CZOLOWY. Metalowych helmow w
//     Harappie nie znamy — stad skorzany dzwon zamiast helmu, i stad twarz
//     ODKRYTA (oczy widoczne — jedyna figurka w tej czworce, ktora ma
//     zaznaczone oczy). Zawoj bawelniany i KOLISTY ORNAMENT NA CZOLE maja
//     natomiast konkretne oparcie: steatytowa figurka „Kaplana-Krola" z
//     Mohendzo-Daro (ok. 2000 p.n.e., Muzeum Narodowe w Karaczi) nosi opaske
//     z okraglym ornamentem posrodku czola i druga taka sama na ramieniu.
//     Klejnot jest karneolowy — patrz K6.
// K6. KARNEOL I PACIORKI TO PODPIS HARAPPY. Dlugie cylindryczne paciorki
//     karneolowe i paciorki trawione (etched carnelian) sa jednym z
//     najlepiej rozpoznawalnych wyrobow harappanskich; znajdowano je az w
//     Mezopotamii, m.in. w Grobach Krolewskich w Ur. Naszyjnik karneolowo-
//     turkusowy i czolowy klejnot to wiec NIE ozdobnik, tylko znacznik
//     kulturowy — i jedyny w tej czworce element, ktorego nie da sie pomylic
//     z Mezopotamia.
// K7. BAWELNA. Dolina Indusu to najstarszy znany osrodek uprawy i tkania
//     bawelny: wlokna z Mehrgarh (VI tys. p.n.e.) i odciski tkaniny
//     bawelnianej z Mohendzo-Daro. Biala bawelniana tunika jest wiec jednym
//     z nielicznych elementow stroju tej figurki, ktory ma bezposrednie
//     poparcie archeologiczne — i pokrywa sie z opisem Herodota z K4.
// K8. ODCIEN SKORY (Z1_SKIN_INDUS) jest CIEMNIEJSZY niz u trzech figurek
//     mezopotamskich (Z1_SKIN) — to swiadome odroznienie regionalne odziedziczone
//     po przodku (buildStraznikHarappy, p8b), a nie ustalenie antropologiczne;
//     zrodla takiego nie rozstrzygaja i tak to nalezy traktowac.
// K9. KOLOR GRACZA: pas centralny tarczy + pas biodrowy (dwa sloty, jak u
//     przodka). Pole tarczy zostaje trzcinowe, bo to plecionka jest znakiem
//     rozpoznawczym tej jednostki — kolor gracza wchodzi pasem przez srodek.
// K10. CZEGO SWIADOMIE NIE MA: luku (units.json: „Atak dystansowy": 0 — mimo
//     ze wlasnie luk jest w zrodlach greckich bronia indyjska najczesciej
//     wymieniana; dane jednostki rozstrzygaja przeciw zrodlu i to jest
//     swiadome), slonia bojowego (rama czasowa i osobna kategoria w grze),
//     metalowego helmu (K5), brody (odroznienie od Mezopotamczykow).
// ---------------------------------------------------------------------------
export function buildGarnizonHarappy(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const tag = z1Tagger(group, 'gr-');
  let k = 0;

  const mCotton = mat(Z1_COTTON,     0.04, 0.86);
  const mOwner  = mat(ownerColor_,   0.15, 0.65);
  const mReed   = mat(Z1_REED,       0.04, 0.88);
  const mReedD  = mat(Z1_REED_DARK,  0.04, 0.88);
  const mIron   = mat(Z1_IRON,       0.55, 0.40);
  const mIronD  = mat(Z1_IRON_DK,    0.50, 0.46);
  const mCarn   = mat(Z1_CARNELIAN,  0.20, 0.45);
  const mTeal   = mat(Z1_TEALBEAD,   0.18, 0.50);
  const mLeath  = mat(Z1_LEATHER,    0.06, 0.82);
  const mWood   = mat(Z1_WOOD,       0.05, 0.85);

  const HIP_Y = Z1_HIP_Y - 0.008 * HEX_R;   // lekki wykrok obronny

  // korpus: biala tunika bawelniana; twarz ODKRYTA => oczy
  k = group.children.length;
  const mSkin = z1Core(group, mat, mCotton, Z1_SKIN_INDUS, true);
  tag(k, 'torso', 'neck', 'head', 'eye-right', 'eye-left');
  const skirt = new THREE.Mesh(gSkirt(), mCotton);
  skirt.position.set(0, Z1_TORSO_BOT - 0.018 * HEX_R, 0);
  skirt.name = 'gr-skirt';
  group.add(skirt);
  const belt = new THREE.Mesh(gBelt(), mOwner);        // pas = KOLOR GRACZA (jak przodek)
  belt.position.set(0, 0.252 * HEX_R, 0);
  belt.name = 'gr-belt';
  group.add(belt);

  // NASZYJNIK Z PACIORKOW (karneol/turkus, luk) — znak Harappy
  let bi = 0;
  k = group.children.length;
  for (const bx of [-0.040, 0.0, 0.040]) {
    const bead = new THREE.Mesh(gBox('grbead', 0.024, 0.024, 0.014), (bi++ % 2 === 0) ? mCarn : mTeal);
    const arc = (Math.abs(bx) < 0.02) ? -0.008 : 0.0;
    bead.position.set(bx * HEX_R, Z1_TORSO_TOP - 0.014 * HEX_R + arc * HEX_R, Z1_TORSO_D * 0.5 + 0.008 * HEX_R);
    group.add(bead);
  }
  tag(k, 'bead-carnelian-right', 'bead-turquoise-mid', 'bead-carnelian-left');

  // nogi: postawa garnizonowa (lekki wykrok obronny)
  k = group.children.length;
  z1BuildLeg(group,  Z1_HIP_X,  0.42,  0.24, mCotton, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-left-thigh', 'leg-left-shin', 'leg-left-foot');
  k = group.children.length;
  z1BuildLeg(group, -Z1_HIP_X, -0.38, -0.14, mCotton, mSkin, mLeath, HIP_Y);
  tag(k, 'leg-right-thigh', 'leg-right-shin', 'leg-right-foot');

  // TURBAN NA HELMIE SKORZANYM: skorzany dzwon + bawelniany zawoj + KLEJNOT
  const cap = new THREE.Mesh(getG('grcap', () => new THREE.CylinderGeometry(0.046 * HEX_R, 0.068 * HEX_R, 0.058 * HEX_R, 8, 1)), mLeath);
  cap.position.set(0, Z1_HEAD_CTR + 0.058 * HEX_R, 0);
  cap.name = 'gr-leather-cap';
  group.add(cap);
  const wrap = new THREE.Mesh(gBox('grwrap', 0.172, 0.034, 0.172), mCotton);  // BIALY zawoj turbanu
  wrap.rotation.y = Math.PI / 8;
  wrap.position.set(0, Z1_HEAD_CTR + 0.030 * HEX_R, 0);
  wrap.name = 'gr-turban-wrap';
  group.add(wrap);
  const jewel = new THREE.Mesh(gBox('grjewel', 0.026, 0.038, 0.012), mCarn);  // klejnot czolowy na zawoju
  jewel.position.set(0, Z1_HEAD_CTR + 0.030 * HEX_R, 0.092 * HEX_R);
  jewel.name = 'gr-turban-jewel';
  group.add(jewel);

  // PRAWE (-X) RAMIE + ZELAZNY MIECZ-TASAK nisko (pchniecie zza tarczy):
  // przedramie w przod, klinga NA OSI dloni, szeroki grzbiet tasaka
  k = group.children.length;
  const armR = z1BuildArm(group, -Z1_SHLD_X, 0.85, 1.52, mCotton, mSkin, mSkin);
  tag(k, 'arm-right-upper', 'arm-right-fore', 'arm-right-fist');
  const ax = armR.axis;
  const guard = new THREE.Mesh(gBox('grguard', 0.052, 0.016, 0.022), mIronD);
  guard.rotation.x = Math.PI - 1.52;
  guard.position.copy(armR.wrist.clone().addScaledVector(ax, 0.034 * HEX_R));
  guard.name = 'gr-cleaver-guard';
  group.add(guard);
  const blade = new THREE.Mesh(gBox('grblade', 0.038, 0.130, 0.012), mIron);   // SZEROKA klinga tasaka
  blade.rotation.x = Math.PI - 1.52;
  blade.position.copy(armR.wrist.clone().addScaledVector(ax, 0.102 * HEX_R));
  blade.name = 'gr-cleaver-blade';
  group.add(blade);
  const tip = new THREE.Mesh(gBox('grtip', 0.030, 0.036, 0.011), mIron);       // skosny czub tasaka
  tip.rotation.x = Math.PI - 1.52;
  tip.rotation.z = 0.42;
  tip.position.copy(armR.wrist.clone().addScaledVector(ax, 0.180 * HEX_R));
  tip.name = 'gr-cleaver-tip';
  group.add(tip);

  // LEWE (+X) RAMIE + WIELKA TARCZA plecionkowa WZMOCNIONA SKORA
  k = group.children.length;
  const armL = z1BuildArm(group, Z1_SHLD_X, 0.50, 1.10, mCotton, mSkin, null);
  tag(k, 'arm-left-upper', 'arm-left-fore');
  const sh = new THREE.Group();
  sh.name = 'gr-shield';
  sh.position.set(
    armL.wrist.x - 0.030 * HEX_R,
    armL.wrist.y + 0.052 * HEX_R,
    armL.wrist.z + 0.050 * HEX_R,
  );
  sh.rotation.y = -0.18;
  const base = new THREE.Mesh(gBox('grshbase', 0.210, 0.340, 0.014), mReed);   // pole plecionki
  base.name = 'gr-shield-wicker';
  sh.add(base);
  let hi = 0;
  for (const vy of [-0.110, 0.110]) {                  // pasy SKORZANE (wzmocnienie)
    const h = new THREE.Mesh(gBox('grshstrap', 0.222, 0.036, 0.020), mLeath);
    h.position.set(0, vy * HEX_R, 0.010 * HEX_R);
    h.name = 'gr-shield-strap-' + (hi++ === 0 ? 'lower' : 'upper');
    sh.add(h);
  }
  let vi = 0;
  for (const vx of [-0.056, 0.056]) {                  // listwy pionowe trzcinowe
    const v = new THREE.Mesh(gBox('grshv', 0.034, 0.352, 0.026), mReedD);
    v.position.set(vx * HEX_R, 0, 0.016 * HEX_R);
    v.name = 'gr-shield-rib-' + (vi++ === 0 ? 'inner' : 'outer');
    sh.add(v);
  }
  const band = new THREE.Mesh(gBox('grshband', 0.222, 0.044, 0.024), mOwner);  // pas = KOLOR GRACZA
  band.position.set(0, 0, 0.020 * HEX_R);
  band.name = 'gr-shield-band';
  sh.add(band);
  let si = 0;
  for (const [vx, vy] of [[-0.056, -0.110], [0.056, -0.110], [-0.056, 0.110], [0.056, 0.110]] as [number, number][]) {
    const st = new THREE.Mesh(gBox('grstud', 0.020, 0.020, 0.010), mIron);     // ZELAZNE nity
    st.rotation.z = Math.PI / 4;
    st.position.set(vx * HEX_R, vy * HEX_R, 0.022 * HEX_R);
    st.name = 'gr-shield-stud-' + (si++);
    sh.add(st);
  }
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  group.userData['anchors'] = {
    hexR: HEX_R,
    headTopY: Z1_HEAD_TOP, headCtrY: Z1_HEAD_CTR,
    torsoTopY: Z1_TORSO_TOP, torsoBotY: Z1_TORSO_BOT,
    torsoHalfW: Z1_TORSO_W * 0.5, torsoHalfD: Z1_TORSO_D * 0.5,
    hipY: HIP_Y, shoulderY: Z1_SHLD_Y, shoulderX: Z1_SHLD_X,
    grip: armR.wrist.toArray(),
    weaponAxis: ax.toArray(),
    shieldKind: 'wicker-tower',
    shieldFaceW: 0.210 * HEX_R, shieldFaceH: 0.340 * HEX_R,
  };
  return group;
}
