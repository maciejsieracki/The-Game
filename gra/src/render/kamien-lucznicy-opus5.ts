/**
 * kamien-lucznicy-opus5.ts — WARIANTY PORÓWNAWCZE cywilizacyjnych ŁUCZNIKÓW
 * EPOKI KAMIENIA (nie podpięte do gry — wpięcie robi koordynator).
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z builderami z jednostki-p3-dystans.ts:
 *   buildEgyptianArcherOpus5(ownerColor) -> buildEgyptianArcher(ownerColor)
 *   buildSumerianArcherOpus5(ownerColor) -> buildSumerianArcher(ownerColor)
 *
 * Konwencje serii BEZ ZMIAN:
 *   - figurka PRZODEM do +Z, stopy na y = 0 grupy, wysokosc sylwetki ~0.55*HEX_R
 *     (z lukiem ~0.72*HEX_R — jak modele obecne),
 *   - uklad prawoskretny: przod = +Z, gora = +Y  =>  LEWA reka = +X, PRAWA = -X,
 *   - group.userData['mats'] / ['perTokenGeos'] jak w calej serii,
 *   - geometrie wspolne = singletony modulu (perTokenGeos puste),
 *   - MeshStandardMaterial, wymiary anatomii identyczne z rodzina NI_ oraz PD_,
 *   - POZA PELNEGO NACIAGU i punkty kotwiczne GRIP/NOCK identyczne z
 *     jednostki-p3-dystans.ts => oba modele stoja w tej samej pozie co reszta
 *     lucznikow (spojnosc czytania jednostek na mapie),
 *   - BRON NA OSI DLONI (nic nie lewituje), konczyny domykane przez IK.
 *
 * KOLOR GRACZA (slot tintu — tak jak w modelach obecnych):
 *   Egipt = pas na biodrach + lotki strzal (na cieciwie i w kolczanie),
 *   Sumer = pas nad kaunakesem + lotki strzal.
 *
 * ===========================================================================
 * ZGODNOSC HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Ramy: w grze OBIE jednostki siedza w EPOCE KAMIENIA (units.json: Epoka =
 * "Kamien", Tech = "Lucznictwo", zasieg 4, atak dystansowy 5 / 4). Modele
 * musza wiec czytac sie jako pre-metalowe: krzemien, kosc, drewno, len, welna,
 * skora. Metal = tylko tam, gdzie nie da sie inaczej — a tu da sie wszedzie.
 *
 * -- LUCZNIK EGIPSKI: Egipt PREDYNASTYCZNY (Naqada II–III, ok. 3500–3000 p.n.e.)
 * 1. LUK DWUWYPUKLY ("double-convex", tzw. luk rogowy) — dwa wypukle ramiona
 *    rozdzielone waska talia rekojesci. To FORMA POSWIADCZONA IKONOGRAFICZNIE
 *    dla predynastycznego i wczesnodynastycznego Egiptu (paleta Mysliwych,
 *    Naqada III; przedstawienia lucznikow z okresu tinickiego i Starego
 *    Panstwa). Wykonany z jednego kawalka drewna (self bow) — modelowany jako
 *    laczony luk drewniany, bez rogu i sciegna.
 *    >>> NIE luk kompozytowy. Luk kompozytowy (refleksyjny, klejony
 *    drewno+rog+sciegno) wchodzi do Egiptu z HYKSOSAMI ok. 1650 p.n.e. —
 *    czyli ok. 1400 lat PO okresie modelowanym i dwie epoki gry za pozno.
 *    UWAGA DLA WLASCICIELA: pole "Uwagi" w units.json dla Lucznika egipskiego
 *    mowi wprost "luk kompozytowy (luk refleksyjny)" — to ANACHRONIZM na
 *    poziomie DANYCH (opis, nie statystyki). Model swiadomie go NIE realizuje;
 *    rekomendacja: poprawic opis w units.json na "luk dwuwypukly (self bow)".
 * 2. STRZALY Z GROTAMI POPRZECZNYMI (transverse / chisel-ended) — plaskie
 *    krzemienne ostrza z SZEROKA KRAWEDZIA TNACA W PRZOD, prostopadla do osi
 *    drzewca. Wyroznik predynastycznego Egiptu (Naqada; setki egzemplarzy z
 *    grobow i osad, tez z Fajum). Modelowane jako plaska plytka + faza tnaca
 *    + oplot sciegnem — sylwetka grotu czytelna nawet z 52°.
 * 3. SHENDYT — krotka lniana przepaska biodrowa, naga gorna czesc ciala, BOSE
 *    STOPY. Sandaly w tym okresie sa rzadkie i elitarne (paleta Narmera nosi
 *    je sandalowy giermek — a wiec przywilej), wiec szeregowy lucznik boso.
 * 4. PIORO W OPASCE — figury lucznikow/mysliwych z palety Mysliwych i z
 *    ikonografii Naqada nosza PIORO (strusie) wetkniete w opaske na wlosach;
 *    ten sam znak nosza pozniej Tjehenu/Libijczycy. To wyroznik epoki i
 *    zarazem czytelny akcent sylwetki. NIE nemes.
 *    >>> ROZNICA WOBEC MODELU OBECNEGO: obecny Lucznik egipski nosi CHUSTE
 *    TYPU NEMES z pasami blekitu. Nemes to nakrycie KROLEWSKIE (i pojawia sie
 *    dopiero w Starym Panstwie, ok. 2600 p.n.e.) — na szeregowym luczniku
 *    predynastycznym jest podwojnie bledne (ranga + o ok. 500–900 lat za
 *    wczesnie). Usuniete swiadomie.
 * 5. KOLNIERZ Z PACIORKOW (muszla, karneol, fajans) zamiast zlotego USECH.
 *    Usech-kolnierz zloty to insygnium dworskie panstwa zjednoczonego; naszyjniki
 *    paciorkowe sa natomiast masowo poswiadczone w grobach Naqada. Zloto z
 *    modelu usuniete — epoka kamienia.
 * 6. NOZ KRZEMIENNY ZA PASEM — krzemienny noz z retusza falista i rekojescia
 *    z kosci/kla (typ Gebel el-Arak, Naqada IIID) to szczytowy wyrob epoki i
 *    naturalny detal wojownika. Krzemien + kosc, zero metalu.
 * 7. KIJ MIOTANY (throwstick) wetkniety za pas — poswiadczony na palecie
 *    Mysliwych obok lukow; drugorzedny detal, ale wzmacnia "lowiecki"
 *    charakter jednostki epoki kamienia.
 * 8. KARNACJA: cieplo-czerwonobrazowa (konwencja egipskiego malarstwa dla
 *    mezczyzn) + obwiedzione GALENA (kohl) oczy — kosmetyk poswiadczony
 *    archeologicznie od Naqada I. Sluzy tez rozroznieniu obu kultur w grze.
 *
 * -- LUCZNIK SUMERYJSKI: Mezopotamia WCZESNODYNASTYCZNA (ok. 2900–2350 p.n.e.)
 * 9. KAUNAKES — kosmykowa spodnica z runa (welna w warstwach kosmykow) do
 *    polowy lydki: najlepiej rozpoznawalny strój sumeryjski (Sztandar z Ur,
 *    figury wotywne z Tell Asmar, stela Ur-Nansze). Modelowana JAKO 4 POZIOMY
 *    z osobnymi kosmykami (a nie 3 gladkie plyty jak dzis) — to jest glowny
 *    zysk sylwetki: strzepiasty, ciezki dol.
 * 10. GLOWA GOLONA, TWARZ OGOLONA. Obie opcje (broda + dlugie wlosy vs glowa
 *    golona) sa poswiadczone, ale nalezA do ROZNYCH kontekstow: brodaci,
 *    dlugowlosi to gownie figury wotywne/bostwa i wladcy pozniejsi, natomiast
 *    PIECHOTA ze Sztandaru z Ur oraz postacie ze steli Ur-Nansze sa golone.
 *    Wybieram wariant "wojskowy" — golona glowa, bez brody. Dodatkowy zysk:
 *    maksymalny kontrast sylwetki z Egipcjaninem (pioro + spiczasta brodka).
 * 11. WIELKIE OCZY I MOCNE BRWI — konwencja plastyki wczesnodynastycznej
 *    (inkrustowane oczy z muszli i lapis-lazuli, Tell Asmar). Czytelne z 52°
 *    i natychmiast "sumeryjskie".
 * 12. BRAK HELMU I BRAK METALU. Miedziane helmy (grob krolewski w Ur, ED III,
 *    ok. 2500 p.n.e.) to wyposazenie ELITY i juz epoka brazu/miedzi — a
 *    jednostka siedzi w grze w EPOCE KAMIENIA. Obecny model ma "stozkowy helm
 *    filcowo-miedziany" w materiale BRAZU (PD_BRONZE) — to czyta sie jako
 *    metal i jest o epoke za wczesnie. Usuniety.
 *    >>> Zamiast tego: golona glowa + welniana przepaska na czole.
 * 13. LUK PROSTY (self bow), krotszy i o plynniejszym luku niz egipski —
 *    zrodla ED nie znaja jeszcze luku kompozytowego (ten wchodzi do
 *    Mezopotamii w epoce akadyjskiej/starobabilonskiej). To samo zastrzezenie
 *    co w pkt 1: units.json w polu "Uwagi" Lucznika sumeryjskiego pisze
 *    "luk kompozytowy" — ANACHRONIZM DANYCH, model go nie realizuje.
 *    Groty LISCIASTE z krzemienia + oplot sciegnem (kontrast z egipskimi
 *    grotami poprzecznymi — dwie kultury poznaje sie nawet po strzale).
 * 14. NARZUTA Z RUNA przez lewe ramie (kaunakes-szal) — element stroju z
 *    ikonografii ED; laczy sylwetke gory z dolem, zeby postac nie byla
 *    "naga do pasa + kudlaty dol". WELNA BARWIONA NA TERAKOTE (decyzja
 *    wlasciciela 2026-07-25, wariant B): barwienie tkanin jest w Mezopotamii
 *    poswiadczone — czerwienie z marzanny i brazy z barwnikow roslinnych —
 *    wiec zmienia sie WYLACZNIE BARWA, nie kroj i nie material. Powod
 *    praktyczny: caly Sumeryjczyk siedzial w gamie bezowo-kremowej i gubil
 *    sie z dystansu. Sam KAUNAKES zostaje w welnie NATURALNEJ.
 * 15. BOSE STOPY — piechota ED przedstawiana jest boso.
 *
 * -- ROZROZNIALNOSC (sens jednostek cywilizacyjnych):
 *    EGIPT: wysoki luk dwuwypukly, biala przepaska shendyt, ciemna czerwono-
 *    brazowa karnacja, pioro nad czolem, spiczasta brodka, kolorowe paciorki,
 *    plaskie szerokie groty.
 *    SUMER: krotszy luk, kudlaty kaunakes do lydki (dominanta sylwetki),
 *    jasniejsza karnacja, golona glowa bez zarostu, runo na ramieniu,
 *    liscias­te groty.
 *
 * Budzet (policzony traversem): Egipt 86 mesh / 1032 tri, Sumer 94 mesh /
 * 1124 tri (modele obecne: Egipt 38/452, Sumer 37/460; wzorzec Hastati Opus 5:
 * 92/1378). Wysokosc sylwetki i obrys stopy niezmienione wobec modeli obecnych
 * (Egipt 0.744 vs 0.731, Sumer 0.690 vs 0.701 HEX_R) — tokeny zostaja wymienne.
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

// ── paleta ─────────────────────────────────────────────────────────────────
// Egipt: karnacja wg konwencji malarstwa egipskiego (mezczyzna = czerwonobraz)
const KL_SKIN_EG    = 0xb9743c;
const KL_SKIN_EG_DK = 0x995c2e;
// Sumer: karnacja jasniejsza (rozroznialnosc kultur na mapie)
const KL_SKIN_SU    = 0xdda971;
const KL_SKIN_SU_DK = 0xba8a58;

const KL_LINEN      = 0xeee6d2;   // len shendyt
const KL_LINEN_DK   = 0xd2c7ac;   // faldy/cien lnu
const KL_FLEECE     = 0xe6dcc0;   // runo kaunakes (jasne, kontrast z karnacja)
const KL_FLEECE_DK  = 0x8f7448;   // co drugi poziom kosmykow (glebia)
const KL_WOOL_BAND  = 0x8a6a48;   // welniana przepaska na czole (Sumer)
// Narzuta z runa Sumeru — WELNA BARWIONA (decyzja wlasciciela 2026-07-25,
// wariant B). Barwienie tkanin jest w Mezopotamii ED poswiadczone (czerwien
// z marzanny, brazy z barwnikow roslinnych), wiec zmienia sie WYLACZNIE BARWA
// — kroj (narzuta przez lewe ramie) i material (runo) bez zmian. Odcien
// terakoty, nie czystej czerwieni: ma dac akcent czytelny z 52 st., ale NIE
// wchodzic w konflikt ze slotem koloru gracza (pas + lotki), ktory bywa
// czerwony. Kaunakes zostaje w welnie naturalnej.
const KL_WOOL_DYED  = 0x8f4a2e;   // terakota/marzanna (narzuta Sumeru)
const KL_WOOL_DYED_D= 0x6e3722;   // ciemniejszy kosmyk barwionej narzuty
const KL_WOOD_BOW   = 0x8a6238;   // luczisko
const KL_WOOD_SHAFT = 0x9c7748;   // drzewce strzal (jasniejsze — czytelne)
const KL_LEATHER    = 0x6b4a28;
const KL_LEATHER_DK = 0x4a331b;
const KL_STRING     = 0xe8e0cc;   // cieciwa
const KL_SINEW      = 0xd8cba8;   // oplot sciegnem
const KL_FLINT      = 0x7d8288;   // krzemien (groty, noz)
const KL_FLINT_LT   = 0x9aa0a6;   // faza tnaca / odbicie na krzemieniu
const KL_BONE       = 0xe2d8ba;   // kosc / kiel (rekojesc noza)
const KL_HAIR_DK    = 0x422915;   // wlosy / brodka (ciemny braz — czern robi
                                  // z 52 st. dziure na czubku glowy)
const KL_KOHL       = 0x14100c;   // galena (obwodka oczu)
const KL_EYE_WHITE  = 0xece7db;   // muszla (inkrustacja oka — Sumer)
const KL_FEATHER    = 0xeae3d2;   // pioro strusia
const KL_FEATHER_DK = 0x8c7c64;   // cieniowana koncowka piora (strus)
const KL_BEAD_RED   = 0xa8432a;   // karneol
const KL_BEAD_TEAL  = 0x2f8f86;   // fajans/turkus

// ── wymiary sylwetki: TE SAME co rodzina NI_*/PD_* (porownywalnosc 1:1) ────
const KL_HIP_Y     = 0.208 * HEX_R;
const KL_TORSO_W   = 0.180 * HEX_R;
const KL_TORSO_H   = 0.205 * HEX_R;
const KL_TORSO_D   = 0.100 * HEX_R;
const KL_TORSO_BOT = 0.240 * HEX_R;
const KL_TORSO_CTR = KL_TORSO_BOT + KL_TORSO_H * 0.5;
const KL_TORSO_TOP = KL_TORSO_BOT + KL_TORSO_H;
const KL_NECK_H    = 0.028 * HEX_R;
const KL_HEAD_S    = 0.128 * HEX_R;
const KL_HEAD_CTR  = KL_TORSO_TOP + KL_NECK_H + KL_HEAD_S * 0.5;
const KL_HEAD_TOP  = KL_TORSO_TOP + KL_NECK_H + KL_HEAD_S;
const KL_SHLD_X    = KL_TORSO_W * 0.5 + 0.030 * HEX_R;
const KL_SHLD_Y    = KL_TORSO_TOP - 0.024 * HEX_R;
const KL_HIP_X     = 0.052 * HEX_R;

const KL_THIGH_L   = 0.104 * HEX_R;
const KL_SHIN_L    = 0.096 * HEX_R;
const KL_UPARM_L   = 0.100 * HEX_R;
const KL_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ────────────────────────────────────────────
// anatomia
let gKLTorso:   THREE.BoxGeometry | null = null;
let gKLChest:   THREE.BoxGeometry | null = null;
let gKLNeck:    THREE.BoxGeometry | null = null;
let gKLHead:    THREE.BoxGeometry | null = null;
let gKLJaw:     THREE.BoxGeometry | null = null;
let gKLNose:    THREE.BoxGeometry | null = null;
let gKLEar:     THREE.BoxGeometry | null = null;
let gKLEye:     THREE.BoxGeometry | null = null;
let gKLEyeBig:  THREE.BoxGeometry | null = null;
let gKLPupil:   THREE.BoxGeometry | null = null;
let gKLBrow:    THREE.BoxGeometry | null = null;
let gKLKohl:    THREE.BoxGeometry | null = null;
let gKLThigh:   THREE.BoxGeometry | null = null;
let gKLShin:    THREE.BoxGeometry | null = null;
let gKLSole:    THREE.BoxGeometry | null = null;
let gKLToes:    THREE.BoxGeometry | null = null;
let gKLUpArm:   THREE.BoxGeometry | null = null;
let gKLForearm: THREE.BoxGeometry | null = null;
let gKLFist:    THREE.BoxGeometry | null = null;
let gKLUnit:    THREE.BoxGeometry | null = null;   // jednostkowy box (rozciagany)
// stroj wspolny
let gKLBelt:    THREE.BoxGeometry | null = null;
let gKLKnot:    THREE.BoxGeometry | null = null;
let gKLBracer:  THREE.BoxGeometry | null = null;
let gKLArmBand: THREE.BoxGeometry | null = null;
// Egipt
let gKLKilt:    THREE.BoxGeometry | null = null;
let gKLKiltPan: THREE.BoxGeometry | null = null;
let gKLPleat:   THREE.BoxGeometry | null = null;
let gKLBandEg:  THREE.BoxGeometry | null = null;
let gKLFeather: THREE.BoxGeometry | null = null;
let gKLFeatTip: THREE.BoxGeometry | null = null;
let gKLBeard:   THREE.BoxGeometry | null = null;
let gKLHairCap: THREE.BoxGeometry | null = null;
let gKLCord:    THREE.BoxGeometry | null = null;
let gKLBead:    THREE.BoxGeometry | null = null;
let gKLKnife:   THREE.BoxGeometry | null = null;
let gKLKnifeHlt:THREE.BoxGeometry | null = null;
let gKLKnifeShe:THREE.BoxGeometry | null = null;
let gKLStick:   THREE.BoxGeometry | null = null;
let gKLAnklet:  THREE.BoxGeometry | null = null;
// Sumer
let gKLKaunTier:THREE.BoxGeometry | null = null;
let gKLTuft:    THREE.BoxGeometry | null = null;
let gKLShawl:   THREE.BoxGeometry | null = null;
let gKLHeadBand:THREE.BoxGeometry | null = null;
// luk / strzaly / kolczan
let gKLGrip:    THREE.BoxGeometry | null = null;
let gKLGripWrap:THREE.BoxGeometry | null = null;
let gKLNock:    THREE.BoxGeometry | null = null;
let gKLTransv:  THREE.BoxGeometry | null = null;   // grot poprzeczny (Egipt)
let gKLTransvEd:THREE.BoxGeometry | null = null;   // faza tnaca grotu
let gKLLeafTip: THREE.ConeGeometry | null = null;  // grot lisciasty (Sumer)
let gKLBinding: THREE.BoxGeometry | null = null;   // oplot sciegnem
let gKLFletch:  THREE.BoxGeometry | null = null;
let gKLQuiver:  THREE.BoxGeometry | null = null;
let gKLQRim:    THREE.BoxGeometry | null = null;
let gKLQStrap:  THREE.BoxGeometry | null = null;
let gKLQArrow:  THREE.BoxGeometry | null = null;

function getKLTorso():   THREE.BoxGeometry { return (gKLTorso   ||= new THREE.BoxGeometry(KL_TORSO_W, KL_TORSO_H, KL_TORSO_D)); }
function getKLChest():   THREE.BoxGeometry { return (gKLChest   ||= new THREE.BoxGeometry(KL_TORSO_W * 1.05, 0.072 * HEX_R, KL_TORSO_D * 1.06)); }
function getKLNeck():    THREE.BoxGeometry { return (gKLNeck    ||= new THREE.BoxGeometry(0.042 * HEX_R, KL_NECK_H * 1.6, 0.042 * HEX_R)); }
function getKLHead():    THREE.BoxGeometry { return (gKLHead    ||= new THREE.BoxGeometry(KL_HEAD_S, KL_HEAD_S, KL_HEAD_S)); }
function getKLJaw():     THREE.BoxGeometry { return (gKLJaw     ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getKLNose():    THREE.BoxGeometry { return (gKLNose    ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getKLEar():     THREE.BoxGeometry { return (gKLEar     ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getKLEye():     THREE.BoxGeometry { return (gKLEye     ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getKLEyeBig():  THREE.BoxGeometry { return (gKLEyeBig  ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.020 * HEX_R, 0.008 * HEX_R)); }
function getKLPupil():   THREE.BoxGeometry { return (gKLPupil   ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.012 * HEX_R, 0.006 * HEX_R)); }
function getKLBrow():    THREE.BoxGeometry { return (gKLBrow    ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.010 * HEX_R, 0.010 * HEX_R)); }
function getKLKohl():    THREE.BoxGeometry { return (gKLKohl    ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.007 * HEX_R, 0.007 * HEX_R)); }
function getKLThigh():   THREE.BoxGeometry { return (gKLThigh   ||= new THREE.BoxGeometry(0.056 * HEX_R, KL_THIGH_L, 0.060 * HEX_R)); }
function getKLShin():    THREE.BoxGeometry { return (gKLShin    ||= new THREE.BoxGeometry(0.038 * HEX_R, KL_SHIN_L, 0.042 * HEX_R)); }
function getKLSole():    THREE.BoxGeometry { return (gKLSole    ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.018 * HEX_R, 0.062 * HEX_R)); }
function getKLToes():    THREE.BoxGeometry { return (gKLToes    ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getKLUpArm():   THREE.BoxGeometry { return (gKLUpArm   ||= new THREE.BoxGeometry(0.054 * HEX_R, KL_UPARM_L, 0.054 * HEX_R)); }
function getKLForearm(): THREE.BoxGeometry { return (gKLForearm ||= new THREE.BoxGeometry(0.040 * HEX_R, KL_FOREARM_L, 0.040 * HEX_R)); }
function getKLFist():    THREE.BoxGeometry { return (gKLFist    ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getKLUnit():    THREE.BoxGeometry { return (gKLUnit    ||= new THREE.BoxGeometry(1, 1, 1)); }
function getKLBelt():    THREE.BoxGeometry { return (gKLBelt    ||= new THREE.BoxGeometry(0.200 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)); }
function getKLKnot():    THREE.BoxGeometry { return (gKLKnot    ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.034 * HEX_R, 0.020 * HEX_R)); }
function getKLBracer():  THREE.BoxGeometry { return (gKLBracer  ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.046 * HEX_R, 0.050 * HEX_R)); }
function getKLArmBand(): THREE.BoxGeometry { return (gKLArmBand ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.018 * HEX_R, 0.058 * HEX_R)); }
function getKLKilt():    THREE.BoxGeometry { return (gKLKilt    ||= new THREE.BoxGeometry(0.206 * HEX_R, 0.094 * HEX_R, 0.130 * HEX_R)); }
function getKLKiltPan(): THREE.BoxGeometry { return (gKLKiltPan ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.112 * HEX_R, 0.016 * HEX_R)); }
function getKLPleat():   THREE.BoxGeometry { return (gKLPleat   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.078 * HEX_R, 0.012 * HEX_R)); }
function getKLBandEg():  THREE.BoxGeometry { return (gKLBandEg  ||= new THREE.BoxGeometry(0.136 * HEX_R, 0.022 * HEX_R, 0.136 * HEX_R)); }
function getKLFeather(): THREE.BoxGeometry { return (gKLFeather ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.086 * HEX_R, 0.010 * HEX_R)); }
function getKLFeatTip(): THREE.BoxGeometry { return (gKLFeatTip ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.032 * HEX_R, 0.008 * HEX_R)); }
function getKLBeard():   THREE.BoxGeometry { return (gKLBeard   ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.040 * HEX_R, 0.024 * HEX_R)); }
function getKLHairCap(): THREE.BoxGeometry { return (gKLHairCap ||= new THREE.BoxGeometry(0.132 * HEX_R, 0.028 * HEX_R, 0.132 * HEX_R)); }
function getKLCord():    THREE.BoxGeometry { return (gKLCord    ||= new THREE.BoxGeometry(0.168 * HEX_R, 0.012 * HEX_R, 0.104 * HEX_R)); }
function getKLBead():    THREE.BoxGeometry { return (gKLBead    ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.019 * HEX_R, 0.014 * HEX_R)); }
function getKLKnife():   THREE.BoxGeometry { return (gKLKnife   ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.048 * HEX_R, 0.007 * HEX_R)); }
function getKLKnifeHlt():THREE.BoxGeometry { return (gKLKnifeHlt||= new THREE.BoxGeometry(0.018 * HEX_R, 0.022 * HEX_R, 0.011 * HEX_R)); }
function getKLKnifeShe():THREE.BoxGeometry { return (gKLKnifeShe||= new THREE.BoxGeometry(0.022 * HEX_R, 0.034 * HEX_R, 0.013 * HEX_R)); }
function getKLStick():   THREE.BoxGeometry { return (gKLStick   ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.120 * HEX_R, 0.012 * HEX_R)); }
function getKLAnklet():  THREE.BoxGeometry { return (gKLAnklet  ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.012 * HEX_R, 0.046 * HEX_R)); }
function getKLKaunTier():THREE.BoxGeometry { return (gKLKaunTier||= new THREE.BoxGeometry(0.188 * HEX_R, 0.030 * HEX_R, 0.118 * HEX_R)); }
function getKLTuft():    THREE.BoxGeometry { return (gKLTuft    ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.038 * HEX_R, 0.032 * HEX_R)); }
function getKLShawl():   THREE.BoxGeometry { return (gKLShawl   ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.160 * HEX_R, 0.086 * HEX_R)); }
function getKLHeadBand():THREE.BoxGeometry { return (gKLHeadBand||= new THREE.BoxGeometry(0.136 * HEX_R, 0.030 * HEX_R, 0.136 * HEX_R)); }
function getKLGrip():    THREE.BoxGeometry { return (gKLGrip    ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.076 * HEX_R, 0.026 * HEX_R)); }
function getKLGripWrap():THREE.BoxGeometry { return (gKLGripWrap||= new THREE.BoxGeometry(0.029 * HEX_R, 0.038 * HEX_R, 0.031 * HEX_R)); }
function getKLNock():    THREE.BoxGeometry { return (gKLNock    ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.020 * HEX_R, 0.018 * HEX_R)); }
function getKLTransv():  THREE.BoxGeometry { return (gKLTransv  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.022 * HEX_R, 0.007 * HEX_R)); }
function getKLTransvEd():THREE.BoxGeometry { return (gKLTransvEd||= new THREE.BoxGeometry(0.038 * HEX_R, 0.008 * HEX_R, 0.004 * HEX_R)); }
function getKLLeafTip(): THREE.ConeGeometry{ return (gKLLeafTip ||= new THREE.ConeGeometry(0.014 * HEX_R, 0.050 * HEX_R, 4)); }
function getKLBinding(): THREE.BoxGeometry { return (gKLBinding ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.016 * HEX_R)); }
function getKLFletch():  THREE.BoxGeometry { return (gKLFletch  ||= new THREE.BoxGeometry(0.006 * HEX_R, 0.048 * HEX_R, 0.024 * HEX_R)); }
function getKLQuiver():  THREE.BoxGeometry { return (gKLQuiver  ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.156 * HEX_R, 0.048 * HEX_R)); }
function getKLQRim():    THREE.BoxGeometry { return (gKLQRim    ||= new THREE.BoxGeometry(0.056 * HEX_R, 0.018 * HEX_R, 0.056 * HEX_R)); }
function getKLQStrap():  THREE.BoxGeometry { return (gKLQStrap  ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.230 * HEX_R, 0.010 * HEX_R)); }
function getKLQArrow():  THREE.BoxGeometry { return (gKLQArrow  ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.090 * HEX_R, 0.009 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kinematyka — konwencja identyczna z hastati-falangita / jednostki-p3-dystans:
// theta liczone od pionu W DOL, +theta = ku przodowi (+Z).
// ---------------------------------------------------------------------------
const KL_Y_UP = new THREE.Vector3(0, 1, 0);

function klDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function klSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = klDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Segment stalej geometrii od A wzdluz kierunku jednostkowego D. */
function klSegDir(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, D: THREE.Vector3, len: number,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(KL_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  group.add(mesh);
  return A.clone().addScaledVector(D, len);
}

/** Jednostkowy box rozciagniety miedzy A i B (cieciwa, strzala, ramie luku). */
function klStretch(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getKLUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(KL_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

/** Noga: udo + golen + BOSA STOPA (podeszwa + palce) plasko na y = 0. */
function klBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  hipY: number,
): { ankle: THREE.Vector3; footZ: number } {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = klSeg(group, getKLThigh(), mSkin, P, thU, KL_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = klSeg(group, getKLShin(), mSkin, P, thL, KL_SHIN_L);
  const footZ = P.z + 0.012 * HEX_R;
  const sole = new THREE.Mesh(getKLSole(), mSkin);
  sole.position.set(sx, 0.009 * HEX_R, footZ);
  group.add(sole);
  const toes = new THREE.Mesh(getKLToes(), mSkinDk);
  toes.position.set(sx, 0.007 * HEX_R, footZ + 0.038 * HEX_R);
  group.add(toes);
  return { ankle: P, footZ };
}

/**
 * RAMIE PRZEZ IK (jak pdArmIK): bark S -> cel dloni T, biegun lokcia `pole`.
 * Zwraca pozycje dloni i os przedramienia — bron/naramiennik ida NA TEJ OSI.
 */
function klArmIK(
  group: THREE.Group, S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 } {
  const L1 = KL_UPARM_L, L2 = KL_FOREARM_L;
  const dv = T.clone().sub(S);
  const dist = Math.min(dv.length(), (L1 + L2) * 0.999);
  const dn = dv.clone().normalize();
  const a = (dist * dist + L1 * L1 - L2 * L2) / (2 * dist);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const C = S.clone().addScaledVector(dn, a);
  const pp = pole.clone().sub(dn.clone().multiplyScalar(pole.dot(dn)));
  if (pp.lengthSq() < 1e-8) pp.set(0, -1, 0);
  pp.normalize();
  const E = C.clone().addScaledVector(pp, h);
  const dU = E.clone().sub(S).normalize();
  klSegDir(group, getKLUpArm(), mUp, S, dU, L1);
  const elbow = S.clone().addScaledVector(dU, L1);
  const axis = T.clone().sub(elbow).normalize();
  const hand = klSegDir(group, getKLForearm(), mFore, elbow, axis, L2);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getKLFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(KL_Y_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.012 * HEX_R));
    group.add(fist);
  }
  return { hand, axis, elbow };
}

/** Tors + klatka + szyja + glowa + zuchwa + nos + uszy (twarz dodaje kultura). */
function klBuildCore(
  group: THREE.Group,
  mTorso: THREE.MeshStandardMaterial, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial,
): void {
  const torso = new THREE.Mesh(getKLTorso(), mTorso);
  torso.position.set(0, KL_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getKLChest(), mTorso);
  chest.position.set(0, KL_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  const neck = new THREE.Mesh(getKLNeck(), mSkin);
  neck.position.set(0, KL_TORSO_TOP + KL_NECK_H * 0.5, 0);
  group.add(neck);
  const head = new THREE.Mesh(getKLHead(), mSkin);
  head.position.set(0, KL_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getKLJaw(), mSkinDk);
  jaw.position.set(0, KL_HEAD_CTR - KL_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getKLNose(), mSkin);
  nose.position.set(0, KL_HEAD_CTR - 0.004 * HEX_R, KL_HEAD_S * 0.5 + 0.006 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const ear = new THREE.Mesh(getKLEar(), mSkinDk);
    ear.position.set(sx * (KL_HEAD_S * 0.5 + 0.004 * HEX_R), KL_HEAD_CTR - 0.006 * HEX_R, 0);
    group.add(ear);
  }
}

// ---------------------------------------------------------------------------
// POZA PELNEGO NACIAGU — kotwice IDENTYCZNE z jednostki-p3-dystans.ts, zeby
// wszyscy lucznicy serii stali tak samo:
//   GRIP — lewa (+X) dlon na rekojesci luku, reka wyprostowana przed piersia,
//   NOCK — prawa (-X) dlon z nasada strzaly cofnieta za prawy policzek.
// Strzal przekatny w lewo-przod (czytelny z kazdego 3/4 i z 52°).
// ---------------------------------------------------------------------------
const KL_GRIP = new THREE.Vector3(0.088 * HEX_R, 0.442 * HEX_R, 0.185 * HEX_R);
const KL_NOCK = new THREE.Vector3(-0.052 * HEX_R, 0.458 * HEX_R, -0.020 * HEX_R);

/**
 * LUCZISKO z profilu (polowa, lokalnie: y = wzdluz ramion, z = ku celowi).
 * Profil podawany jako lista [y, z]; ramie dolne = lustro gornego. Luk siedzi
 * w podgrupie obroconej o yaw strzaly, wiec zawsze jest PROSTOPADLY do strzaly.
 * Zwraca swiatowe pozycje obu koncowek (do naciagniecia cieciwy).
 */
function klAddBowLimbs(
  group: THREE.Group, profile: [number, number][], widths: number[],
  mBow: THREE.MeshStandardMaterial, mWrap: THREE.MeshStandardMaterial,
): { tipTop: THREE.Vector3; tipBot: THREE.Vector3; yaw: number } {
  const dirA = KL_GRIP.clone().sub(KL_NOCK).normalize();
  const yaw = Math.atan2(dirA.x, dirA.z);

  const bow = new THREE.Group();
  bow.position.copy(KL_GRIP);
  bow.rotation.y = yaw;

  // rekojesc + oplot skorzany
  const grip = new THREE.Mesh(getKLGrip(), mBow);
  bow.add(grip);
  const wrap = new THREE.Mesh(getKLGripWrap(), mWrap);
  bow.add(wrap);

  for (const sg of [1, -1]) {
    for (let i = 0; i < profile.length - 1; i++) {
      const p = profile[i]!, q = profile[i + 1]!;
      const A = new THREE.Vector3(0, sg * p[0] * HEX_R, p[1] * HEX_R);
      const B = new THREE.Vector3(0, sg * q[0] * HEX_R, q[1] * HEX_R);
      klStretch(bow, mBow, A, B, widths[i]! * HEX_R, (widths[i]! + 0.004) * HEX_R);
    }
    const last = profile[profile.length - 1]!;
    const nock = new THREE.Mesh(getKLNock(), mBow);
    nock.position.set(0, sg * last[0] * HEX_R, last[1] * HEX_R);
    bow.add(nock);
  }
  group.add(bow);

  const last = profile[profile.length - 1]!;
  const rotY = new THREE.Matrix4().makeRotationY(yaw);
  const tipTop = new THREE.Vector3(0,  last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(KL_GRIP);
  const tipBot = new THREE.Vector3(0, -last[0] * HEX_R, last[1] * HEX_R).applyMatrix4(rotY).add(KL_GRIP);
  return { tipTop, tipBot, yaw };
}

/** Cieciwa naciagnieta w V (od obu koncowek lucziska do nasady w NOCK). */
function klAddString(
  group: THREE.Group, tipTop: THREE.Vector3, tipBot: THREE.Vector3,
  mString: THREE.MeshStandardMaterial,
): void {
  klStretch(group, mString, tipTop, KL_NOCK, 0.008 * HEX_R);
  klStretch(group, mString, tipBot, KL_NOCK, 0.008 * HEX_R);
}

/**
 * STRZALA NA OSI NACIAGU: nasada w NOCK, drzewce przez rekojesc, grot przed
 * lucziskiem. `head`:
 *   'transverse' — egipski grot POPRZECZNY (plaska plytka, krawedz tnaca w przod),
 *   'leaf'       — mezopotamski grot LISCIASTY (krzemienny ostrosluk).
 */
function klAddArrow(
  group: THREE.Group, head: 'transverse' | 'leaf',
  mShaft: THREE.MeshStandardMaterial, mFlint: THREE.MeshStandardMaterial,
  mFlintLt: THREE.MeshStandardMaterial, mSinew: THREE.MeshStandardMaterial,
  mFletch: THREE.MeshStandardMaterial,
): void {
  const dirA = KL_GRIP.clone().sub(KL_NOCK).normalize();
  const yaw = Math.atan2(dirA.x, dirA.z);
  const shaftEnd = KL_GRIP.clone().addScaledVector(dirA, 0.058 * HEX_R);
  klStretch(group, mShaft, KL_NOCK, shaftEnd, 0.012 * HEX_R);

  // oplot sciegnem na osadzie grotu
  const bind = new THREE.Mesh(getKLBinding(), mSinew);
  bind.quaternion.setFromUnitVectors(KL_Y_UP, dirA);
  bind.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.004 * HEX_R));
  group.add(bind);

  if (head === 'transverse') {
    // plaska plytka krzemienna PROSTOPADLA do lotu + faza tnaca na przodzie
    const blade = new THREE.Mesh(getKLTransv(), mFlint);
    blade.rotation.y = yaw;
    blade.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.022 * HEX_R));
    group.add(blade);
    const edge = new THREE.Mesh(getKLTransvEd(), mFlintLt);
    edge.rotation.y = yaw;
    edge.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.036 * HEX_R));
    group.add(edge);
  } else {
    const tip = new THREE.Mesh(getKLLeafTip(), mFlint);
    tip.quaternion.setFromUnitVectors(KL_Y_UP, dirA);
    tip.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.026 * HEX_R));
    group.add(tip);
    const barb = new THREE.Mesh(getKLBinding(), mFlintLt);
    barb.scale.set(1.4, 0.5, 0.7);
    barb.quaternion.setFromUnitVectors(KL_Y_UP, dirA);
    barb.position.copy(shaftEnd.clone().addScaledVector(dirA, 0.012 * HEX_R));
    group.add(barb);
  }

  // lotki KOLORU GRACZA (2 chorag., przy nasadzie)
  for (const rz of [0, Math.PI / 2]) {
    const fl = new THREE.Mesh(getKLFletch(), mFletch);
    fl.quaternion.setFromUnitVectors(KL_Y_UP, dirA);
    fl.rotateY(rz);
    fl.position.copy(KL_NOCK.clone().addScaledVector(dirA, 0.030 * HEX_R));
    group.add(fl);
  }
}

/** Kolczan na plecach (skora) + rzemien przez piers + 3 strzaly z lotkami. */
function klAddQuiver(
  group: THREE.Group, mLeath: THREE.MeshStandardMaterial,
  mLeathDk: THREE.MeshStandardMaterial, mShaft: THREE.MeshStandardMaterial,
  mFletchOwner: THREE.MeshStandardMaterial,
): void {
  const QX = -0.056 * HEX_R;
  const QZ = -(KL_TORSO_D * 0.5 + 0.032 * HEX_R);
  const q = new THREE.Mesh(getKLQuiver(), mLeath);
  q.rotation.x = -0.24;
  q.rotation.z = 0.22;
  q.position.set(QX, KL_TORSO_CTR + 0.050 * HEX_R, QZ);
  group.add(q);
  const rim = new THREE.Mesh(getKLQRim(), mLeathDk);
  rim.rotation.x = -0.24;
  rim.rotation.z = 0.22;
  rim.position.set(QX - 0.018 * HEX_R, KL_TORSO_CTR + 0.126 * HEX_R, QZ - 0.020 * HEX_R);
  group.add(rim);
  // rzemien: na plecach i przez piers (przez PRAWY bark, zeby nie kolidowal
  // z cieciwa po lewej)
  const strapB = new THREE.Mesh(getKLQStrap(), mLeathDk);
  strapB.rotation.set(0.10, 0, -0.62);
  strapB.position.set(-0.012 * HEX_R, KL_TORSO_CTR + 0.010 * HEX_R, -(KL_TORSO_D * 0.5 + 0.008 * HEX_R));
  group.add(strapB);
  const strapF = new THREE.Mesh(getKLQStrap(), mLeath);
  strapF.rotation.set(-0.10, 0, 0.60);
  strapF.position.set(-0.010 * HEX_R, KL_TORSO_CTR + 0.008 * HEX_R, KL_TORSO_D * 0.5 + 0.006 * HEX_R);
  group.add(strapF);
  for (const [dx, dy] of ([[-0.022, 0.0], [0.002, 0.012], [0.020, -0.006]] as [number, number][])) {
    const sh = new THREE.Mesh(getKLQArrow(), mShaft);
    sh.rotation.x = -0.24; sh.rotation.z = 0.22;
    sh.position.set(QX + dx * HEX_R, KL_TORSO_CTR + (0.140 + dy) * HEX_R, QZ - 0.020 * HEX_R);
    group.add(sh);
    const f = new THREE.Mesh(getKLFletch(), mFletchOwner);
    f.rotation.x = -0.24; f.rotation.z = 0.22;
    f.scale.set(1.0, 0.66, 0.66);
    f.position.set(QX + (dx - 0.012) * HEX_R, KL_TORSO_CTR + (0.180 + dy) * HEX_R, QZ - 0.030 * HEX_R);
    group.add(f);
  }
}

/** Nogi w rozkroku strzeleckim (te same katy co reszta lucznikow serii). */
function klArcherLegs(
  group: THREE.Group, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial,
): void {
  const HIP = KL_HIP_Y - 0.006 * HEX_R;
  klBuildLeg(group,  KL_HIP_X,  0.30,  0.16, mSkin, mSkinDk, HIP);
  klBuildLeg(group, -KL_HIP_X, -0.34, -0.14, mSkin, mSkinDk, HIP);
}

/** Ramiona w naciagu: lewe (+X) do rekojesci, prawe (-X) do nasady przy policzku. */
function klArcherArms(
  group: THREE.Group, mUp: THREE.MeshStandardMaterial,
  mFore: THREE.MeshStandardMaterial, mFist: THREE.MeshStandardMaterial,
): { left: { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 };
     right: { hand: THREE.Vector3; axis: THREE.Vector3; elbow: THREE.Vector3 } } {
  const left = klArmIK(group, new THREE.Vector3(KL_SHLD_X, KL_SHLD_Y, 0), KL_GRIP,
                       new THREE.Vector3(0.55, -0.70, 0.20), mUp, mFore, mFist);
  const right = klArmIK(group, new THREE.Vector3(-KL_SHLD_X, KL_SHLD_Y, 0), KL_NOCK,
                        new THREE.Vector3(-0.55, 0.85, -0.25), mUp, mFore, mFist);
  return { left, right };
}

// ===========================================================================
// LUCZNIK EGIPSKI — OPUS 5
// Egipt predynastyczny (Naqada II–III). Naga piers, biala przepaska SHENDYT
// z pasem koloru gracza, kolnierz z paciorkow karneolu i fajansu, opaska z
// PIOREM strusia, spiczasta brodka, obwiedzione kohlem oczy. LUK DWUWYPUKLY
// (double-convex self bow) w lewej, strzala z GROTEM POPRZECZNYM na cieciwie.
// Za pasem krzemienny noz z rekojescia z kla i kij miotany. Boso.
// ===========================================================================
export function buildEgyptianArcherOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin    = mat(KL_SKIN_EG,    0.05, 0.80);
  const mSkinDk  = mat(KL_SKIN_EG_DK, 0.05, 0.82);
  const mLinen   = mat(KL_LINEN,      0.04, 0.88);
  const mLinenDk = mat(KL_LINEN_DK,   0.04, 0.90);
  const mOwner   = mat(ownerColor_,   0.10, 0.70);
  const mWood    = mat(KL_WOOD_BOW,   0.05, 0.82);
  const mShaft   = mat(KL_WOOD_SHAFT, 0.05, 0.84);
  const mLeath   = mat(KL_LEATHER,    0.06, 0.82);
  const mLeathDk = mat(KL_LEATHER_DK, 0.06, 0.86);
  const mString  = mat(KL_STRING,     0.02, 0.95);
  const mSinew   = mat(KL_SINEW,      0.03, 0.92);
  const mFlint   = mat(KL_FLINT,      0.20, 0.52);
  const mFlintLt = mat(KL_FLINT_LT,   0.24, 0.44);
  const mBone    = mat(KL_BONE,       0.06, 0.76);
  const mHair    = mat(KL_HAIR_DK,    0.04, 0.90);
  const mKohl    = mat(KL_KOHL,       0.05, 0.86);
  const mFeath   = mat(KL_FEATHER,    0.03, 0.92);
  const mFeathDk = mat(KL_FEATHER_DK, 0.04, 0.90);
  const mBeadR   = mat(KL_BEAD_RED,   0.12, 0.60);
  const mBeadT   = mat(KL_BEAD_TEAL,  0.14, 0.55);

  // ═══ KORPUS (naga piers = karnacja) + NOGI ═══════════════════════════════
  klBuildCore(group, mSkin, mSkin, mSkinDk);
  klArcherLegs(group, mSkin, mSkinDk);

  // ═══ TWARZ: oczy obwiedzione GALENA (kohl) — kosmetyk od Naqada I ════════
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getKLEye(), mKohl);
    eye.position.set(sx * 0.026 * HEX_R, KL_HEAD_CTR + 0.014 * HEX_R, KL_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
  }
  const kohl = new THREE.Mesh(getKLKohl(), mKohl);   // przedluzone kreski
  kohl.position.set(0, KL_HEAD_CTR + 0.020 * HEX_R, KL_HEAD_S * 0.5 + 0.001 * HEX_R);
  kohl.scale.set(1.6, 1.0, 1.0);
  group.add(kohl);
  const beard = new THREE.Mesh(getKLBeard(), mHair);  // krotka SPICZASTA brodka
  beard.rotation.x = 0.22;
  beard.position.set(0, KL_HEAD_CTR - 0.056 * HEX_R, KL_HEAD_S * 0.5 - 0.008 * HEX_R);
  group.add(beard);

  // ═══ WLOSY + OPASKA Z PIOREM (paleta Mysliwych) ══════════════════════════
  const hair = new THREE.Mesh(getKLHairCap(), mHair);
  hair.position.set(0, KL_HEAD_TOP - 0.008 * HEX_R, 0);
  group.add(hair);
  const band = new THREE.Mesh(getKLBandEg(), mLinen);   // LNIANA opaska — odcina
  band.position.set(0, KL_HEAD_CTR + 0.036 * HEX_R, 0); // sie od ciemnych wlosow
  group.add(band);
  for (const [sx, tilt] of ([[0.032, -0.30], [-0.010, -0.12]] as [number, number][])) {
    const f = new THREE.Mesh(getKLFeather(), mFeath);
    f.rotation.z = tilt;
    f.rotation.x = -0.26;
    f.position.set(sx * HEX_R, KL_HEAD_TOP + 0.038 * HEX_R, -0.026 * HEX_R);
    group.add(f);
    const ft = new THREE.Mesh(getKLFeatTip(), mFeathDk);
    ft.rotation.z = tilt;
    ft.rotation.x = -0.26;
    ft.position.set((sx + 0.024 * Math.sin(-tilt)) * HEX_R, KL_HEAD_TOP + 0.086 * HEX_R, -0.048 * HEX_R);
    group.add(ft);
  }

  // ═══ KOLNIERZ Z PACIORKOW (muszla / karneol / fajans) ════════════════════
  const cord = new THREE.Mesh(getKLCord(), mLeathDk);
  cord.position.set(0, KL_TORSO_TOP - 0.014 * HEX_R, 0);
  group.add(cord);
  for (let i = 0; i < 5; i++) {
    const bd = new THREE.Mesh(getKLBead(), i % 2 === 0 ? mBeadR : mBeadT);
    const t = (i - 2) / 2;                      // -1 .. 1
    bd.position.set(t * 0.058 * HEX_R,
                    KL_TORSO_TOP - (0.014 + Math.abs(t) * -0.008) * HEX_R,
                    KL_TORSO_D * 0.5 + (0.014 - Math.abs(t) * 0.008) * HEX_R);
    group.add(bd);
  }

  // ═══ SHENDYT: lniana przepaska + zaklad + faldy + PAS KOLORU GRACZA ══════
  const kilt = new THREE.Mesh(getKLKilt(), mLinen);
  kilt.position.set(0, KL_TORSO_BOT - 0.026 * HEX_R, 0);
  group.add(kilt);
  const panel = new THREE.Mesh(getKLKiltPan(), mLinen);   // trojkatny zaklad z przodu
  panel.rotation.x = -0.10;
  panel.position.set(0, KL_TORSO_BOT - 0.038 * HEX_R, KL_TORSO_D * 0.5 + 0.022 * HEX_R);
  group.add(panel);
  for (const sx of [-0.062, -0.020, 0.020, 0.062]) {
    const pl = new THREE.Mesh(getKLPleat(), mLinenDk);
    pl.position.set(sx * HEX_R, KL_TORSO_BOT - 0.034 * HEX_R, KL_TORSO_D * 0.5 + 0.014 * HEX_R);
    group.add(pl);
  }
  const belt = new THREE.Mesh(getKLBelt(), mOwner);
  belt.position.set(0, KL_TORSO_BOT + 0.012 * HEX_R, 0);
  group.add(belt);
  const knot = new THREE.Mesh(getKLKnot(), mOwner);
  knot.position.set(0.030 * HEX_R, KL_TORSO_BOT + 0.006 * HEX_R, KL_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(knot);

  // ═══ NOZ KRZEMIENNY (typ Gebel el-Arak: krzemien + rekojesc z kla) ═══════
  const knX = KL_TORSO_W * 0.5 + 0.008 * HEX_R;
  const sheath = new THREE.Mesh(getKLKnifeShe(), mLeathDk);
  sheath.rotation.z = 0.20;
  sheath.position.set(knX, KL_TORSO_BOT - 0.026 * HEX_R, -0.018 * HEX_R);
  group.add(sheath);
  const blade = new THREE.Mesh(getKLKnife(), mFlint);
  blade.rotation.z = 0.20;
  blade.position.set(knX + 0.004 * HEX_R, KL_TORSO_BOT - 0.008 * HEX_R, -0.018 * HEX_R);
  group.add(blade);
  const hilt = new THREE.Mesh(getKLKnifeHlt(), mBone);
  hilt.rotation.z = 0.20;
  hilt.position.set(knX + 0.010 * HEX_R, KL_TORSO_BOT + 0.024 * HEX_R, -0.018 * HEX_R);
  group.add(hilt);

  // ═══ KIJ MIOTANY za pasem (paleta Mysliwych) ═════════════════════════════
  const stick = new THREE.Mesh(getKLStick(), mWood);
  stick.rotation.set(0.24, 0, -0.34);
  stick.position.set(-(KL_TORSO_W * 0.5 + 0.008 * HEX_R), KL_TORSO_BOT - 0.026 * HEX_R, -0.014 * HEX_R);
  group.add(stick);
  const stick2 = new THREE.Mesh(getKLStick(), mWood);      // zagiete ramie kija
  stick2.scale.set(1.0, 0.55, 1.0);
  stick2.rotation.set(0.24, 0, -0.88);
  stick2.position.set(-(KL_TORSO_W * 0.5 + 0.038 * HEX_R), KL_TORSO_BOT - 0.086 * HEX_R, -0.002 * HEX_R);
  group.add(stick2);

  // ═══ RAMIONA + OZDOBY NARAMIENNE ═════════════════════════════════════════
  const arms = klArcherArms(group, mSkin, mSkin, mSkinDk);
  // skorzany OCHRANIACZ na lewym (lukowym) przedramieniu — chroni od cieciwy
  const bracer = new THREE.Mesh(getKLBracer(), mLeath);
  bracer.quaternion.setFromUnitVectors(KL_Y_UP, arms.left.axis);
  bracer.position.copy(arms.left.hand.clone().addScaledVector(arms.left.axis, -0.040 * HEX_R));
  group.add(bracer);
  for (const a of [arms.left, arms.right]) {              // opaski nad bicepsem
    const ab = new THREE.Mesh(getKLArmBand(), mBeadT);
    ab.quaternion.setFromUnitVectors(KL_Y_UP, a.elbow.clone().sub(new THREE.Vector3(
      Math.sign(a.hand.x) * KL_SHLD_X, KL_SHLD_Y, 0)).normalize());
    ab.position.copy(a.elbow.clone().lerp(new THREE.Vector3(
      Math.sign(a.hand.x) * KL_SHLD_X, KL_SHLD_Y, 0), 0.72));
    group.add(ab);
  }
  // obraczki na kostkach (paciorki) — detal grobowy Naqada
  for (const sx of [-1, 1]) {
    const an = new THREE.Mesh(getKLAnklet(), mBeadR);
    an.position.set(sx * KL_HIP_X, 0.026 * HEX_R, sx > 0 ? 0.030 * HEX_R : -0.024 * HEX_R);
    group.add(an);
  }

  // ═══ LUK DWUWYPUKLY + CIECIWA + STRZALA Z GROTEM POPRZECZNYM ═════════════
  // profil polowy lucziska [y, z] w HEX_R: wypuklosc ku celowi (+z) w polowie
  // ramienia, koncowka zawracajaca ku cieciwie — sylwetka "rogowa".
  const EG_PROFILE: [number, number][] = [
    [0.038,  0.006],
    [0.116,  0.026],
    [0.192,  0.032],
    [0.252,  0.014],
    [0.292, -0.016],
  ];
  const EG_W = [0.019, 0.018, 0.016, 0.014];
  const eg = klAddBowLimbs(group, EG_PROFILE, EG_W, mWood, mLeath);
  klAddString(group, eg.tipTop, eg.tipBot, mString);
  klAddArrow(group, 'transverse', mShaft, mFlint, mFlintLt, mSinew, mOwner);
  klAddQuiver(group, mLeath, mLeathDk, mShaft, mOwner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// LUCZNIK SUMERYJSKI — OPUS 5
// Mezopotamia wczesnodynastyczna (ok. 2900–2350 p.n.e.). KAUNAKES: kosmykowa
// spodnica z runa w 4 poziomach (dominanta sylwetki) + narzuta z runa przez
// lewe ramie. Glowa GOLONA, twarz ogolona, wielkie inkrustowane oczy i mocne
// brwi (konwencja Tell Asmar). ZERO METALU (epoka kamienia w grze). Luk prosty
// krotszy, strzaly z krzemiennymi grotami lisciastymi. Boso.
// ===========================================================================
export function buildSumerianArcherOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin    = mat(KL_SKIN_SU,    0.05, 0.80);
  const mSkinDk  = mat(KL_SKIN_SU_DK, 0.05, 0.82);
  const mFleece  = mat(KL_FLEECE,     0.03, 0.96);
  const mFleecD  = mat(KL_FLEECE_DK,  0.03, 0.97);
  const mWoolBd  = mat(KL_WOOL_BAND,  0.03, 0.94);
  const mDyed    = mat(KL_WOOL_DYED,  0.04, 0.90);
  const mDyedDk  = mat(KL_WOOL_DYED_D,0.04, 0.92);
  const mOwner   = mat(ownerColor_,   0.10, 0.70);
  const mWood    = mat(KL_WOOD_BOW,   0.05, 0.82);
  const mShaft   = mat(KL_WOOD_SHAFT, 0.05, 0.84);
  const mLeath   = mat(KL_LEATHER,    0.06, 0.82);
  const mLeathDk = mat(KL_LEATHER_DK, 0.06, 0.86);
  const mString  = mat(KL_STRING,     0.02, 0.95);
  const mSinew   = mat(KL_SINEW,      0.03, 0.92);
  const mFlint   = mat(KL_FLINT,      0.20, 0.52);
  const mFlintLt = mat(KL_FLINT_LT,   0.24, 0.44);
  const mEyeW    = mat(KL_EYE_WHITE,  0.04, 0.72);
  const mDark    = mat(KL_HAIR_DK,    0.04, 0.90);

  // ═══ KORPUS (naga piers nad kaunakesem) + NOGI ═══════════════════════════
  klBuildCore(group, mSkin, mSkin, mSkinDk);
  klArcherLegs(group, mSkin, mSkinDk);

  // ═══ TWARZ: WIELKIE oczy (muszla + lapis) + mocne brwi — Tell Asmar ══════
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getKLEyeBig(), mEyeW);
    eye.position.set(sx * 0.028 * HEX_R, KL_HEAD_CTR + 0.014 * HEX_R, KL_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
    const pup = new THREE.Mesh(getKLPupil(), mDark);
    pup.position.set(sx * 0.028 * HEX_R, KL_HEAD_CTR + 0.014 * HEX_R, KL_HEAD_S * 0.5 + 0.005 * HEX_R);
    group.add(pup);
    const brow = new THREE.Mesh(getKLBrow(), mDark);
    brow.rotation.z = -sx * 0.16;
    brow.position.set(sx * 0.028 * HEX_R, KL_HEAD_CTR + 0.032 * HEX_R, KL_HEAD_S * 0.5 + 0.003 * HEX_R);
    group.add(brow);
  }
  // GLOWA GOLONA: bez wlosow i bez brody (piechota ze Sztandaru z Ur);
  // jedyne nakrycie to welniana przepaska na czole
  const scalp = new THREE.Mesh(getKLHairCap(), mSkinDk);   // golona czaszka —
  scalp.position.set(0, KL_HEAD_TOP - 0.006 * HEX_R, 0);   // czytelna z 52 st.
  group.add(scalp);
  const hb = new THREE.Mesh(getKLHeadBand(), mWoolBd);
  hb.position.set(0, KL_HEAD_CTR + 0.050 * HEX_R, 0);
  group.add(hb);

  // ═══ KAUNAKES: 4 poziomy kosmykow runa (do polowy lydki) ═════════════════
  // co drugi poziom ciemniejszy — z 52° czyta sie strzepiasta faktura.
  const TIER_Y = [0.238, 0.194, 0.150, 0.106];
  for (let t = 0; t < TIER_Y.length; t++) {
    const mt = t % 2 === 0 ? mFleece : mFleecD;
    const s = 1.0 - t * 0.035;
    const tier = new THREE.Mesh(getKLKaunTier(), mt);
    tier.scale.set(s, 1.0, s);
    tier.position.set(0, TIER_Y[t]! * HEX_R, 0);
    group.add(tier);
    for (let j = 0; j < 6; j++) {
      const ang = -Math.PI * 0.5 + (j / 5) * Math.PI * 1.35;   // przod + boki
      const tuft = new THREE.Mesh(getKLTuft(), mt);
      tuft.rotation.y = ang;
      tuft.rotation.x = 0.30;
      tuft.position.set(
        Math.sin(ang) * 0.100 * s * HEX_R,
        (TIER_Y[t]! - 0.018) * HEX_R,
        Math.cos(ang) * 0.066 * s * HEX_R,
      );
      group.add(tuft);
    }
  }
  // PAS KOLORU GRACZA nad kaunakesem + wezel
  const belt = new THREE.Mesh(getKLBelt(), mOwner);
  belt.scale.set(0.98, 1.0, 0.98);
  belt.position.set(0, KL_TORSO_BOT + 0.024 * HEX_R, 0);
  group.add(belt);
  const knot = new THREE.Mesh(getKLKnot(), mOwner);
  knot.position.set(-0.028 * HEX_R, KL_TORSO_BOT + 0.018 * HEX_R, KL_TORSO_D * 0.5 + 0.012 * HEX_R);
  group.add(knot);

  // ═══ NARZUTA Z RUNA BARWIONEGO przez LEWE (+X) ramie ═════════════════════
  const shawl = new THREE.Mesh(getKLShawl(), mDyed);
  shawl.rotation.z = -0.18;
  shawl.position.set(KL_TORSO_W * 0.5 - 0.002 * HEX_R, KL_TORSO_CTR + 0.026 * HEX_R, 0.002 * HEX_R);
  group.add(shawl);
  for (let j = 0; j < 3; j++) {
    const tuft = new THREE.Mesh(getKLTuft(), j % 2 === 0 ? mDyed : mDyedDk);
    tuft.scale.set(0.72, 0.62, 0.72);
    tuft.position.set((KL_TORSO_W * 0.5 + 0.008) * HEX_R,
                      (KL_TORSO_CTR - 0.036 + j * 0.032) * HEX_R,
                      0.030 * HEX_R);
    group.add(tuft);
  }

  // ═══ RAMIONA + ochraniacz cieciwy ════════════════════════════════════════
  const arms = klArcherArms(group, mSkin, mSkin, mSkinDk);
  const bracer = new THREE.Mesh(getKLBracer(), mLeath);
  bracer.quaternion.setFromUnitVectors(KL_Y_UP, arms.left.axis);
  bracer.position.copy(arms.left.hand.clone().addScaledVector(arms.left.axis, -0.040 * HEX_R));
  group.add(bracer);
  const armBand = new THREE.Mesh(getKLArmBand(), mLeathDk);
  armBand.quaternion.setFromUnitVectors(KL_Y_UP, arms.right.axis);
  armBand.position.copy(arms.right.hand.clone().addScaledVector(arms.right.axis, -0.052 * HEX_R));
  group.add(armBand);

  // ═══ LUK PROSTY (krotszy, plynny luk) + CIECIWA + STRZALA LISCIASTA ══════
  const SU_PROFILE: [number, number][] = [
    [0.036,  0.006],
    [0.108,  0.022],
    [0.176,  0.026],
    [0.238,  0.012],
  ];
  const SU_W = [0.020, 0.018, 0.015];
  const su = klAddBowLimbs(group, SU_PROFILE, SU_W, mWood, mLeath);
  klAddString(group, su.tipTop, su.tipBot, mString);
  klAddArrow(group, 'leaf', mShaft, mFlint, mFlintLt, mSinew, mOwner);
  klAddQuiver(group, mLeath, mLeathDk, mShaft, mOwner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonow modulu (konwencja disposeUnitGeometries z units.ts). */
export function disposeKamienLucznicyOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gKLTorso, gKLChest, gKLNeck, gKLHead, gKLJaw, gKLNose, gKLEar,
    gKLEye, gKLEyeBig, gKLPupil, gKLBrow, gKLKohl,
    gKLThigh, gKLShin, gKLSole, gKLToes, gKLUpArm, gKLForearm, gKLFist, gKLUnit,
    gKLBelt, gKLKnot, gKLBracer, gKLArmBand,
    gKLKilt, gKLKiltPan, gKLPleat, gKLBandEg, gKLFeather, gKLFeatTip,
    gKLBeard, gKLHairCap, gKLCord, gKLBead,
    gKLKnife, gKLKnifeHlt, gKLKnifeShe, gKLStick, gKLAnklet,
    gKLKaunTier, gKLTuft, gKLShawl, gKLHeadBand,
    gKLGrip, gKLGripWrap, gKLNock, gKLTransv, gKLTransvEd, gKLLeafTip,
    gKLBinding, gKLFletch, gKLQuiver, gKLQRim, gKLQStrap, gKLQArrow,
  ];
  for (const g of all) { g?.dispose(); }
  gKLTorso = gKLChest = gKLNeck = gKLHead = gKLJaw = gKLNose = gKLEar = null;
  gKLEye = gKLEyeBig = gKLPupil = gKLBrow = gKLKohl = null;
  gKLThigh = gKLShin = gKLSole = gKLToes = gKLUpArm = gKLForearm = gKLFist = gKLUnit = null;
  gKLBelt = gKLKnot = gKLBracer = gKLArmBand = null;
  gKLKilt = gKLKiltPan = gKLPleat = gKLBandEg = gKLFeather = gKLFeatTip = null;
  gKLBeard = gKLHairCap = gKLCord = gKLBead = null;
  gKLKnife = gKLKnifeHlt = gKLKnifeShe = gKLStick = gKLAnklet = null;
  gKLKaunTier = gKLTuft = gKLShawl = gKLHeadBand = null;
  gKLGrip = gKLGripWrap = gKLNock = gKLTransv = gKLTransvEd = null;
  gKLBinding = gKLFletch = gKLQuiver = gKLQRim = gKLQStrap = gKLQArrow = null;
  gKLLeafTip = null;
}
