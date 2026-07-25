/**
 * kamien-inka-opus5.ts — WARIANTY PORÓWNAWCZE (OPUS 5) dwóch jednostek
 * inkaskich EPOKI KAMIENIA. Plik NIE jest podpięty do gry — wpięcie robi
 * koordynator centralnie w `units.ts`.
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z builderami z `jednostki-p2-inka.ts`:
 *   buildMaceWarriorOpus5(ownerColor)    ⟷ buildMaceWarrior(ownerColor)
 *   buildInkaJavelineerOpus5(ownerColor) ⟷ buildInkaJavelineer(ownerColor)
 * Ta sama sygnatura `(ownerColor: number) => THREE.Group`, ten sam układ:
 *   - przód = +Z, góra = +Y, układ prawoskrętny ⇒ LEWA ręka = +X (tarcza),
 *     PRAWA = -X (broń); stopy na y = 0; broń ZAWSZE na osi dłoni,
 *   - `group.userData['mats']` + `['perTokenGeos']`, geometrie = singletony modułu,
 *   - `MeshStandardMaterial`, wymiary sylwetki identyczne z rodziną IK_, NI_, HO_,
 *     więc modele są porównywalne 1:1 ze starymi i z Hastati Opus 5.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — ANDY, KULTURA MATERIALNA BEZ ŻELAZA
 * ===========================================================================
 * ANACHRONIZM RAMOWY (świadomie przyjęty, decyzja gry): Inkowie jako państwo
 * to XV w. n.e., a gra umieszcza ich w „epoce kamienia". Konwencja gry jest
 * jednak mniej naciągana, niż wygląda: Andy NIGDY nie znały żelaza aż do
 * konkwisty, a brąz arsenowy/cynowy rozpowszechnił się dopiero w horyzoncie
 * Tiwanaku–Wari i u Inków (po ~1000 n.e.). Warstwa „kamienna" kultury
 * andyjskiej (kamienne głowice maczug, obsydianowe/chertowe groty, atlatl,
 * proca, drewno chonta, tkactwo wełniano-bawełniane) jest realna i ciągła od
 * okresu prekeramicznego. Modeluję zatem AUTENTYCZNĄ andyjską kulturę
 * materialną na poziomie przedmetalicznym — nie „generycznego jaskiniowca"
 * i nie renesansowego Inkę w złocie.
 *
 * ROZSTRZYGNIĘCIA (pełne uzasadnienia — patrz raport przy pliku):
 *
 *  1. MACZUGA = MACANA / CHAMPI z GWIAŹDZISTĄ GŁOWICĄ KAMIENNĄ.
 *     Głowica gwiaździsta („porra estrellada", star-headed mace) to ikona
 *     andyjska od Chavín/Moche po Inków: krążek z centralnym otworem na
 *     trzonek i 6 (czasem 5–8) promienistymi kolcami, ø ok. 8–12 cm, kuty
 *     i szlifowany w andezycie / diorycie / bazalcie. W epoce imperialnej
 *     odlewano je również z brązu (champi) — TU EPOKA KAMIENIA, więc głowica
 *     jest KAMIENNA (szarozielony andezyt), bez ani jednego metalowego mesha.
 *     Trzonek: twarde ciemne drewno palmy CHONTA (Bactris gasipaes), oplot
 *     rzemienny w chwycie, pętla na nadgarstek (macany noszono na temblaku).
 *  2. UNKU SZACHOWNICOWY (checkerboard tunic) — najlepiej udokumentowany
 *     STRÓJ WOJSKOWY Inków (zachowane egzemplarze m.in. w Dumbarton Oaks):
 *     prostokątna tunika bez rękawów z pól czarno-/brunatno-kremowych, z
 *     czerwonym trójkątnym jarzmem pod szyją. Kwadraty = TOCAPU, pas wzoru
 *     tkackiego. Dlatego Chaska NIE dostaje pikowanego kaftana bawełnianego
 *     (escaupil) — mimo że był autentyczny: statystyka Pancerz 2 to praktycznie
 *     brak ochrony, a kaftan zakryłby najbardziej rozpoznawalny element
 *     sylwetki. Kaftan zostaje propozycją dla jednostek Brązu.
 *  3. HEŁM (chuku) — pleciony z witek/trzciny lub wełniany pikowany, wiązany
 *     pod brodą; poświadczony ikonograficznie (Guamán Poma) i archeologicznie.
 *     Nosi go TYLKO Chaska (piechota wręcz, cel maczug); Estólica — harcownik
 *     o Pancerzu 0/2 i Health 20 — chodzi z gołą głową w samym llautu.
 *     To rozróżnienie sylwetek jest wprost wyprowadzone ze statystyk.
 *  4. TARCZA WALLQANQA/PULLCANCA — mała, PROSTOKĄTNA: rama i deski drewniane,
 *     obicie z tkaniny/skóry jelenia, frędzle u dolnej krawędzi, rzemienny
 *     chwyt. Bez metalowego umba (obecny model gry ma BRĄZOWY boss — patrz
 *     wykaz anachronizmów w raporcie).
 *  5. ESTÓLICA = andyjska nazwa ATLATLA (miotacza oszczepów, propulsora).
 *     Bez niej jednostka nie różni się od zwykłego oszczepnika, więc miotacz
 *     jest tu GŁÓWNYM elementem sylwetki: deska ~50–60 cm z ROWKIEM (dwie
 *     listwy prowadzące), ZACZEPEM/hakiem na tylnym końcu (KOŚĆ lub twarde
 *     drewno — NIE metal), uchwytem z dwoma kołkami/pętlami na palce.
 *     Oszczep leży W ROWKU, ogonem opartym o hak.
 *  6. GROTY — OBSYDIAN / chert, przywiązane rzemieniem do drzewca; lotki
 *     z piór. Zero brązu (obecny model gry ma brązowy grot i brązowy hak
 *     atlatla — anachronizm w epoce kamienia).
 *  7. LLAUTU — pleciona wielobarwna taśma wełniana owinięta wokół głowy,
 *     NIE złota obręcz. Złota opaska z frędzlą (mascapaicha) to insygnium
 *     samego Sapa Inki; obecny model gry daje zwykłemu Chasce złote llautu —
 *     poprawione na plecionkę w barwnikach roślinnych/koszenilowych.
 *     Z tego samego powodu obaj NIE mają złotych kolczyków-krążków: orejones
 *     („uszaci") to szlachta Cuzco, nie szeregowi wojownicy.
 *  8. SANDAŁY USUTA — podeszwa ze skóry lamy/łyka + rzemienie przez podbicie
 *     i kostkę (obecny model gry: jeden klocek-stopa).
 *  9. NASZYJNIK ZE SPONDYLUSA (mullu) — muszla kolczasta z ciepłych wód
 *     Ekwadoru, najcenniejszy przedmiot wymiany w Andach, noszona jako
 *     paciorki. Element drobny, ale mocno „andyjski" kolorystycznie.
 * 10. CHUSPA — tkana sakiewka na liście koki przy pasie; powszechna,
 *     wizualnie czytelna (frędzle).
 * 11. ŚWIADOME POMINIĘCIA:
 *     • PROCA HUARACA — autentyczna i często noszona razem z maczugą, ale
 *       w grze istnieje ODRĘBNA jednostka „Procarz (Huaracoc)", której proca
 *       jest znakiem rozpoznawczym. Dublowanie zatarłoby czytelność ról na
 *       mapie, więc pomijam mimo zgody w zleceniu (uzasadnienie w raporcie).
 *     • MOTYW „CHAKANY" jako świętego symbolu — schodkowy krzyż jest
 *       autentycznym motywem tkackim i architektonicznym, ale jego kult jako
 *       „świętego symbolu Inków" to w dużej mierze konstrukt XX-wieczny.
 *       Używam schodkowo-rombowych pasów jako WZORU TKACKIEGO, nie emblematu.
 *     • ZŁOTO/SREBRO — zero na obu modelach: to metale elit i kultu, nie
 *       wyposażenie szeregowca (patrz pkt 7).
 *
 * Budżet docelowy: ~85–90 mesh / ~1100–1200 tri na figurkę
 * (obecne modele gry: Chaska 35 mesh / 420 tri, Estólica 33 mesh / 392 tri;
 *  wzorzec Hastati Opus 5: 92 mesh / 1378 tri).
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

// ── paleta: barwniki i surowce andyjskie (bez metali szlachetnych) ─────────
const KI_SKIN       = 0xe0ac69;   // karnacja (Estólica — jak w starym modelu)
const KI_SKIN_DARK  = 0xc89058;   // karnacja ogorzała (Chaska — jak w starym)
const KI_SKIN_SHADE = 0xb07c46;   // cień żuchwy / dłonie
const KI_HAIR       = 0x3c2c20;   // włosy (czerń rozjaśniona do ciemnego brązu — czysta czerń
                                  //        czyta się z 52° jak dziura w modelu)
const KI_COCHINEAL  = 0xa8232c;   // czerwień koszenili (Dactylopius coccus)
const KI_OCHRE      = 0xc8932e;   // ochra / barwnik z chilca
const KI_CREAM      = 0xe4d8bc;   // niebarwiona wełna alpaki / bawełna
const KI_BROWN_DK   = 0x5e4632;   // brunat (ciemne pola szachownicy unku)
const KI_INDIGO     = 0x2e4a6e;   // indygo andyjskie (Indigofera suffruticosa)
const KI_TEAL       = 0x2a9d8f;   // turkus / chryzokola (akcent serii)
const KI_STONE_HEAD = 0x77786a;   // andezyt-diorit: głowica maczugi
const KI_STONE_LT   = 0x8f9084;   // jaśniejsze szlify kolców
const KI_OBSIDIAN   = 0x2a2430;   // obsydian: groty
const KI_CHONTA     = 0x3b2a1c;   // twarde drewno palmy chonta (trzonek macany)
const KI_WOOD       = 0x7a5c3a;   // zwykłe drewno (atlatl, deski tarczy)
const KI_WOOD_LT    = 0x94724a;   // jaśniejsze drewno (listwy rowka)
const KI_LEATHER    = 0x6b4a28;   // rzemienie, sandały usuta
const KI_LEATHER_DK = 0x4e351c;   // ciemny rzemień / oplot
const KI_BONE       = 0xd8cdb4;   // kość: hak atlatla, paciorki
const KI_SPONDYLUS  = 0xd85a2e;   // muszla spondylus (mullu)
const KI_FEATHER    = 0xf4f0e6;   // białe pióro
const KI_EYE        = 0x1a1008;   // oczy

// ── wymiary sylwetki: IDENTYCZNE z rodziną IK_* (porównywalność 1:1) ───────
const KI_HIP_Y     = 0.208 * HEX_R;
const KI_TORSO_W   = 0.180 * HEX_R;
const KI_TORSO_H   = 0.205 * HEX_R;
const KI_TORSO_D   = 0.100 * HEX_R;
const KI_TORSO_BOT = 0.240 * HEX_R;
const KI_TORSO_CTR = KI_TORSO_BOT + KI_TORSO_H * 0.5;
const KI_TORSO_TOP = KI_TORSO_BOT + KI_TORSO_H;
const KI_NECK_H    = 0.028 * HEX_R;
const KI_HEAD_S    = 0.128 * HEX_R;
const KI_HEAD_CTR  = KI_TORSO_TOP + KI_NECK_H + KI_HEAD_S * 0.5;
const KI_HEAD_TOP  = KI_TORSO_TOP + KI_NECK_H + KI_HEAD_S;
const KI_SHLD_X    = KI_TORSO_W * 0.5 + 0.030 * HEX_R;
const KI_SHLD_Y    = KI_TORSO_TOP - 0.024 * HEX_R;
const KI_HIP_X     = 0.052 * HEX_R;
const KI_THIGH_L   = 0.104 * HEX_R;
const KI_SHIN_L    = 0.096 * HEX_R;
const KI_UPARM_L   = 0.100 * HEX_R;
const KI_FOREARM_L = 0.092 * HEX_R;

// ── geometrie-singletony (lazy) ────────────────────────────────────────────
// anatomia
let gKITorso:    THREE.BoxGeometry | null = null;
let gKIChest:    THREE.BoxGeometry | null = null;
let gKINeck:     THREE.BoxGeometry | null = null;
let gKIHead:     THREE.BoxGeometry | null = null;
let gKIJaw:      THREE.BoxGeometry | null = null;
let gKINose:     THREE.BoxGeometry | null = null;
let gKIEye:      THREE.BoxGeometry | null = null;
let gKIBrow:     THREE.BoxGeometry | null = null;
let gKIHairBack: THREE.BoxGeometry | null = null;
let gKIHairFrng: THREE.BoxGeometry | null = null;
let gKIThigh:    THREE.BoxGeometry | null = null;
let gKIShin:     THREE.BoxGeometry | null = null;
let gKIUpArm:    THREE.BoxGeometry | null = null;
let gKIForearm:  THREE.BoxGeometry | null = null;
let gKIFist:     THREE.BoxGeometry | null = null;
// sandały usuta
let gKISole:     THREE.BoxGeometry | null = null;
let gKIToes:     THREE.BoxGeometry | null = null;
let gKIStrapF:   THREE.BoxGeometry | null = null;
let gKIStrapA:   THREE.BoxGeometry | null = null;
// tekstylia
let gKISkirt:    THREE.BoxGeometry | null = null;
let gKIHemBand:  THREE.BoxGeometry | null = null;
let gKIBelt:     THREE.BoxGeometry | null = null;
let gKIBeltPat:  THREE.BoxGeometry | null = null;
let gKITocapu:   THREE.BoxGeometry | null = null;
let gKIYoke:     THREE.BoxGeometry | null = null;
let gKIStripe:   THREE.BoxGeometry | null = null;
let gKIStepMotif:THREE.BoxGeometry | null = null;
let gKIDiamond:  THREE.BoxGeometry | null = null;
let gKIChuspa:   THREE.BoxGeometry | null = null;
let gKIChuspaFl: THREE.BoxGeometry | null = null;
let gKIFringe:   THREE.BoxGeometry | null = null;
let gKIBead:     THREE.BoxGeometry | null = null;
let gKIArmBand:  THREE.BoxGeometry | null = null;
// głowa: llautu + hełm chuku + pióra
let gKILlautu:   THREE.BoxGeometry | null = null;
let gKILlautuP:  THREE.BoxGeometry | null = null;
let gKIChukuBowl:THREE.CylinderGeometry | null = null;
let gKIChukuRing:THREE.CylinderGeometry | null = null;
let gKIChukuNeck:THREE.BoxGeometry | null = null;
let gKIChukuTie: THREE.BoxGeometry | null = null;
let gKIFeather:  THREE.BoxGeometry | null = null;
let gKIFeatTip:  THREE.BoxGeometry | null = null;
let gKIPlume:    THREE.BoxGeometry | null = null;
// macana (maczuga gwiaździsta)
let gKIHaft:     THREE.CylinderGeometry | null = null;
let gKIHaftWrap: THREE.CylinderGeometry | null = null;
let gKIHaftKnob: THREE.CylinderGeometry | null = null;
let gKIMaceDisc: THREE.CylinderGeometry | null = null;
let gKIMaceHub:  THREE.CylinderGeometry | null = null;
let gKIMaceSpike:THREE.ConeGeometry | null = null;
let gKIThong:    THREE.BoxGeometry | null = null;
// tarcza wallqanqa
let gKIShBoard:  THREE.BoxGeometry | null = null;
let gKIShFace:   THREE.BoxGeometry | null = null;
let gKIShRail:   THREE.BoxGeometry | null = null;
let gKIShEdgeV:  THREE.BoxGeometry | null = null;
let gKIShMotif:  THREE.BoxGeometry | null = null;
let gKIShGrip:   THREE.BoxGeometry | null = null;
let gKIShPorpax: THREE.BoxGeometry | null = null;
// estólica (atlatl) + oszczepy
let gKIAtlBody:  THREE.BoxGeometry | null = null;
let gKIAtlRail:  THREE.BoxGeometry | null = null;
let gKIAtlHook:  THREE.BoxGeometry | null = null;
let gKIAtlGrip:  THREE.BoxGeometry | null = null;
let gKIAtlPeg:   THREE.CylinderGeometry | null = null;
let gKIAtlLoop:  THREE.BoxGeometry | null = null;
let gKIDartShaft:THREE.CylinderGeometry | null = null;
let gKIDartFore: THREE.CylinderGeometry | null = null;
let gKIDartTip:  THREE.ConeGeometry | null = null;
let gKIDartLash: THREE.BoxGeometry | null = null;
let gKIFletch:   THREE.BoxGeometry | null = null;
let gKIQuiverTie:THREE.BoxGeometry | null = null;

function getKITorso():    THREE.BoxGeometry { return (gKITorso    ||= new THREE.BoxGeometry(KI_TORSO_W, KI_TORSO_H, KI_TORSO_D)); }
function getKIChest():    THREE.BoxGeometry { return (gKIChest    ||= new THREE.BoxGeometry(KI_TORSO_W * 1.04, 0.070 * HEX_R, KI_TORSO_D * 1.06)); }
function getKINeck():     THREE.BoxGeometry { return (gKINeck     ||= new THREE.BoxGeometry(0.042 * HEX_R, KI_NECK_H * 1.6, 0.042 * HEX_R)); }
function getKIHead():     THREE.BoxGeometry { return (gKIHead     ||= new THREE.BoxGeometry(KI_HEAD_S, KI_HEAD_S, KI_HEAD_S)); }
function getKIJaw():      THREE.BoxGeometry { return (gKIJaw      ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.034 * HEX_R, 0.038 * HEX_R)); }
function getKINose():     THREE.BoxGeometry { return (gKINose     ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.030 * HEX_R, 0.018 * HEX_R)); }
function getKIEye():      THREE.BoxGeometry { return (gKIEye      ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.012 * HEX_R, 0.008 * HEX_R)); }
function getKIBrow():     THREE.BoxGeometry { return (gKIBrow     ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.008 * HEX_R, 0.008 * HEX_R)); }
function getKIHairBack(): THREE.BoxGeometry { return (gKIHairBack ||= new THREE.BoxGeometry(KI_HEAD_S * 1.02, KI_HEAD_S * 0.80, 0.030 * HEX_R)); }
function getKIHairFrng(): THREE.BoxGeometry { return (gKIHairFrng ||= new THREE.BoxGeometry(KI_HEAD_S * 0.90, 0.018 * HEX_R, KI_HEAD_S * 0.88)); }
function getKIThigh():    THREE.BoxGeometry { return (gKIThigh    ||= new THREE.BoxGeometry(0.056 * HEX_R, KI_THIGH_L, 0.060 * HEX_R)); }
function getKIShin():     THREE.BoxGeometry { return (gKIShin     ||= new THREE.BoxGeometry(0.038 * HEX_R, KI_SHIN_L, 0.042 * HEX_R)); }
function getKIUpArm():    THREE.BoxGeometry { return (gKIUpArm    ||= new THREE.BoxGeometry(0.054 * HEX_R, KI_UPARM_L, 0.054 * HEX_R)); }
function getKIForearm():  THREE.BoxGeometry { return (gKIForearm  ||= new THREE.BoxGeometry(0.040 * HEX_R, KI_FOREARM_L, 0.040 * HEX_R)); }
function getKIFist():     THREE.BoxGeometry { return (gKIFist     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getKISole():     THREE.BoxGeometry { return (gKISole     ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.011 * HEX_R, 0.084 * HEX_R)); }
function getKIToes():     THREE.BoxGeometry { return (gKIToes     ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.014 * HEX_R, 0.026 * HEX_R)); }
function getKIStrapF():   THREE.BoxGeometry { return (gKIStrapF   ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.009 * HEX_R, 0.016 * HEX_R)); }
function getKIStrapA():   THREE.BoxGeometry { return (gKIStrapA   ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)); }
function getKISkirt():    THREE.BoxGeometry { return (gKISkirt    ||= new THREE.BoxGeometry(0.196 * HEX_R, 0.070 * HEX_R, 0.118 * HEX_R)); }
function getKIHemBand():  THREE.BoxGeometry { return (gKIHemBand  ||= new THREE.BoxGeometry(0.204 * HEX_R, 0.026 * HEX_R, 0.124 * HEX_R)); }
function getKIBelt():     THREE.BoxGeometry { return (gKIBelt     ||= new THREE.BoxGeometry(0.190 * HEX_R, 0.030 * HEX_R, 0.112 * HEX_R)); }
function getKIBeltPat():  THREE.BoxGeometry { return (gKIBeltPat  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R)); }
function getKITocapu():   THREE.BoxGeometry { return (gKITocapu   ||= new THREE.BoxGeometry(0.042 * HEX_R, 0.042 * HEX_R, 0.010 * HEX_R)); }
function getKIYoke():     THREE.BoxGeometry { return (gKIYoke     ||= new THREE.BoxGeometry(0.096 * HEX_R, 0.030 * HEX_R, 0.012 * HEX_R)); }
function getKIStripe():   THREE.BoxGeometry { return (gKIStripe   ||= new THREE.BoxGeometry(0.184 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }
function getKIStepMotif():THREE.BoxGeometry { return (gKIStepMotif||= new THREE.BoxGeometry(0.026 * HEX_R, 0.014 * HEX_R, 0.009 * HEX_R)); }
function getKIDiamond():  THREE.BoxGeometry { return (gKIDiamond  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.030 * HEX_R, 0.010 * HEX_R)); }
function getKIChuspa():   THREE.BoxGeometry { return (gKIChuspa   ||= new THREE.BoxGeometry(0.048 * HEX_R, 0.052 * HEX_R, 0.024 * HEX_R)); }
function getKIChuspaFl(): THREE.BoxGeometry { return (gKIChuspaFl ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.018 * HEX_R, 0.026 * HEX_R)); }
function getKIFringe():   THREE.BoxGeometry { return (gKIFringe   ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.028 * HEX_R, 0.007 * HEX_R)); }
function getKIBead():     THREE.BoxGeometry { return (gKIBead     ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.014 * HEX_R, 0.010 * HEX_R)); }
function getKIArmBand():  THREE.BoxGeometry { return (gKIArmBand  ||= new THREE.BoxGeometry(0.046 * HEX_R, 0.020 * HEX_R, 0.046 * HEX_R)); }
function getKILlautu():   THREE.BoxGeometry { return (gKILlautu   ||= new THREE.BoxGeometry(0.140 * HEX_R, 0.026 * HEX_R, 0.140 * HEX_R)); }
function getKILlautuP():  THREE.BoxGeometry { return (gKILlautuP  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.012 * HEX_R, 0.010 * HEX_R)); }
function getKIChukuBowl():THREE.CylinderGeometry { return (gKIChukuBowl ||= new THREE.CylinderGeometry(0.046 * HEX_R, 0.068 * HEX_R, 0.054 * HEX_R, 8, 1)); }
function getKIChukuRing():THREE.CylinderGeometry { return (gKIChukuRing ||= new THREE.CylinderGeometry(0.070 * HEX_R, 0.072 * HEX_R, 0.011 * HEX_R, 8, 1)); }
function getKIChukuNeck():THREE.BoxGeometry { return (gKIChukuNeck||= new THREE.BoxGeometry(0.124 * HEX_R, 0.016 * HEX_R, 0.044 * HEX_R)); }
function getKIChukuTie(): THREE.BoxGeometry { return (gKIChukuTie ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.062 * HEX_R, 0.010 * HEX_R)); }
function getKIFeather():  THREE.BoxGeometry { return (gKIFeather  ||= new THREE.BoxGeometry(0.025 * HEX_R, 0.092 * HEX_R, 0.014 * HEX_R)); }
function getKIFeatTip():  THREE.BoxGeometry { return (gKIFeatTip  ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.032 * HEX_R, 0.011 * HEX_R)); }
function getKIPlume():    THREE.BoxGeometry { return (gKIPlume    ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.078 * HEX_R, 0.024 * HEX_R)); }
function getKIHaft():     THREE.CylinderGeometry { return (gKIHaft     ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.015 * HEX_R, 0.290 * HEX_R, 6, 1)); }
function getKIHaftWrap(): THREE.CylinderGeometry { return (gKIHaftWrap ||= new THREE.CylinderGeometry(0.017 * HEX_R, 0.017 * HEX_R, 0.022 * HEX_R, 6, 1)); }
function getKIHaftKnob(): THREE.CylinderGeometry { return (gKIHaftKnob ||= new THREE.CylinderGeometry(0.019 * HEX_R, 0.014 * HEX_R, 0.018 * HEX_R, 6, 1)); }
function getKIMaceDisc():THREE.CylinderGeometry { return (gKIMaceDisc ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.030 * HEX_R, 6, 1)); }
function getKIMaceHub(): THREE.CylinderGeometry { return (gKIMaceHub  ||= new THREE.CylinderGeometry(0.021 * HEX_R, 0.021 * HEX_R, 0.052 * HEX_R, 6, 1)); }
function getKIMaceSpike():THREE.ConeGeometry { return (gKIMaceSpike||= new THREE.ConeGeometry(0.019 * HEX_R, 0.048 * HEX_R, 4)); }
function getKIThong():    THREE.BoxGeometry { return (gKIThong    ||= new THREE.BoxGeometry(0.008 * HEX_R, 0.044 * HEX_R, 0.008 * HEX_R)); }
function getKIShBoard():  THREE.BoxGeometry { return (gKIShBoard  ||= new THREE.BoxGeometry(0.100 * HEX_R, 0.126 * HEX_R, 0.013 * HEX_R)); }
function getKIShFace():   THREE.BoxGeometry { return (gKIShFace   ||= new THREE.BoxGeometry(0.092 * HEX_R, 0.118 * HEX_R, 0.008 * HEX_R)); }
function getKIShRail():   THREE.BoxGeometry { return (gKIShRail   ||= new THREE.BoxGeometry(0.108 * HEX_R, 0.014 * HEX_R, 0.019 * HEX_R)); }
function getKIShEdgeV():  THREE.BoxGeometry { return (gKIShEdgeV  ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.126 * HEX_R, 0.018 * HEX_R)); }
function getKIShMotif():  THREE.BoxGeometry { return (gKIShMotif  ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.028 * HEX_R, 0.008 * HEX_R)); }
function getKIShGrip():   THREE.BoxGeometry { return (gKIShGrip   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.013 * HEX_R, 0.013 * HEX_R)); }
function getKIShPorpax(): THREE.BoxGeometry { return (gKIShPorpax ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }
function getKIAtlBody():  THREE.BoxGeometry { return (gKIAtlBody  ||= new THREE.BoxGeometry(0.038 * HEX_R, 0.236 * HEX_R, 0.016 * HEX_R)); }
function getKIAtlRail():  THREE.BoxGeometry { return (gKIAtlRail  ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.212 * HEX_R, 0.015 * HEX_R)); }
function getKIAtlHook():  THREE.BoxGeometry { return (gKIAtlHook  ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R)); }
function getKIAtlGrip():  THREE.BoxGeometry { return (gKIAtlGrip  ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.046 * HEX_R, 0.020 * HEX_R)); }
function getKIAtlPeg():   THREE.CylinderGeometry { return (gKIAtlPeg   ||= new THREE.CylinderGeometry(0.007 * HEX_R, 0.007 * HEX_R, 0.026 * HEX_R, 6, 1)); }
function getKIAtlLoop():  THREE.BoxGeometry { return (gKIAtlLoop  ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.010 * HEX_R, 0.024 * HEX_R)); }
function getKIDartShaft():THREE.CylinderGeometry { return (gKIDartShaft||= new THREE.CylinderGeometry(0.0075 * HEX_R, 0.0075 * HEX_R, 0.300 * HEX_R, 6, 1)); }
function getKIDartFore(): THREE.CylinderGeometry { return (gKIDartFore ||= new THREE.CylinderGeometry(0.0090 * HEX_R, 0.0090 * HEX_R, 0.048 * HEX_R, 6, 1)); }
function getKIDartTip():  THREE.ConeGeometry { return (gKIDartTip  ||= new THREE.ConeGeometry(0.014 * HEX_R, 0.044 * HEX_R, 4)); }
function getKIDartLash(): THREE.BoxGeometry { return (gKIDartLash ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.013 * HEX_R, 0.017 * HEX_R)); }
function getKIFletch():   THREE.BoxGeometry { return (gKIFletch   ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.036 * HEX_R, 0.005 * HEX_R)); }
function getKIQuiverTie():THREE.BoxGeometry { return (gKIQuiverTie||= new THREE.BoxGeometry(0.024 * HEX_R, 0.014 * HEX_R, 0.048 * HEX_R)); }

// ---------------------------------------------------------------------------
// Kinematyka łańcuchowa — konwencja IDENTYCZNA z resztą serii:
// theta liczone od pionu W DÓŁ, +theta = ku przodowi (+Z);
// mesh o osi Y kładziemy z rotation.x = PI - theta.
// ---------------------------------------------------------------------------
function kiDirDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}

function kiSeg(
  group: THREE.Group, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = kiDirDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  group.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Noga w wykroku + SANDAŁ USUTA (podeszwa, palce, rzemień podbicia, kostka). */
function kiBuildLeg(
  group: THREE.Group, sx: number, thU: number, thL: number,
  mThigh: THREE.MeshStandardMaterial, mShin: THREE.MeshStandardMaterial,
  mSole: THREE.MeshStandardMaterial, mStrap: THREE.MeshStandardMaterial,
  hipY: number,
): void {
  let P = new THREE.Vector3(sx, hipY, 0);
  P = kiSeg(group, getKIThigh(), mThigh, P, thU, KI_THIGH_L);
  P.z -= 0.004 * HEX_R;  P.y += 0.008 * HEX_R;
  P = kiSeg(group, getKIShin(), mShin, P, thL, KI_SHIN_L);

  const fz = P.z + 0.016 * HEX_R;
  const sole = new THREE.Mesh(getKISole(), mSole);
  sole.position.set(sx, 0.006 * HEX_R, fz);
  group.add(sole);
  const toes = new THREE.Mesh(getKIToes(), mSole);        // palce wystają — sandał, nie but
  toes.position.set(sx, 0.008 * HEX_R, fz + 0.042 * HEX_R);
  group.add(toes);
  const sf = new THREE.Mesh(getKIStrapF(), mStrap);       // rzemień przez podbicie
  sf.rotation.x = 0.22;
  sf.position.set(sx, 0.018 * HEX_R, fz + 0.014 * HEX_R);
  group.add(sf);
  const sa = new THREE.Mesh(getKIStrapA(), mStrap);       // rzemień wokół kostki
  sa.position.set(sx, 0.026 * HEX_R, fz - 0.024 * HEX_R);
  group.add(sa);
}

/** Ramię: bark→łokieć→nadgarstek (+ opcjonalna pięść). Zwraca OŚ przedramienia. */
function kiBuildArm(
  group: THREE.Group, sx: number, thU: number, thF: number,
  mUp: THREE.MeshStandardMaterial, mFore: THREE.MeshStandardMaterial,
  mFist: THREE.MeshStandardMaterial | null,
): { wrist: THREE.Vector3; axis: THREE.Vector3 } {
  let P = new THREE.Vector3(sx, KI_SHLD_Y, 0);
  P = kiSeg(group, getKIUpArm(), mUp, P, thU, KI_UPARM_L);
  P.y += 0.010 * HEX_R;
  const wrist = kiSeg(group, getKIForearm(), mFore, P, thF, KI_FOREARM_L);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getKIFist(), mFist);
    fist.rotation.x = Math.PI - thF;
    fist.position.copy(wrist.clone().addScaledVector(kiDirDown(thF), 0.014 * HEX_R));
    group.add(fist);
  }
  return { wrist, axis: kiDirDown(thF) };
}

/** Tors + szyja: wspólny rdzeń obu jednostek. */
function kiTorso(group: THREE.Group, mTunic: THREE.MeshStandardMaterial,
                 mSkin: THREE.MeshStandardMaterial): void {
  const torso = new THREE.Mesh(getKITorso(), mTunic);
  torso.position.set(0, KI_TORSO_CTR, 0);
  group.add(torso);
  const chest = new THREE.Mesh(getKIChest(), mTunic);   // klatka szersza od talii
  chest.position.set(0, KI_TORSO_TOP - 0.038 * HEX_R, 0);
  group.add(chest);
  const neck = new THREE.Mesh(getKINeck(), mSkin);
  neck.position.set(0, KI_TORSO_TOP + KI_NECK_H * 0.5, 0);
  group.add(neck);
}

/**
 * Głowa: czaszka + żuchwa + nos + oczy + brwi + CZARNE WŁOSY (tył + grzywka).
 * Twarze andyjskie zostają ODKRYTE (żadna z tych jednostek nie ma maski).
 */
function kiHead(
  group: THREE.Group, mSkin: THREE.MeshStandardMaterial,
  mSkinDk: THREE.MeshStandardMaterial, mHair: THREE.MeshStandardMaterial,
  mEye: THREE.MeshStandardMaterial,
): void {
  const head = new THREE.Mesh(getKIHead(), mSkin);
  head.position.set(0, KI_HEAD_CTR, 0);
  group.add(head);
  const jaw = new THREE.Mesh(getKIJaw(), mSkinDk);
  jaw.position.set(0, KI_HEAD_CTR - KI_HEAD_S * 0.38, 0.010 * HEX_R);
  group.add(jaw);
  const nose = new THREE.Mesh(getKINose(), mSkin);       // wydatny profil andyjski
  nose.position.set(0, KI_HEAD_CTR - 0.002 * HEX_R, KI_HEAD_S * 0.5 + 0.007 * HEX_R);
  group.add(nose);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getKIEye(), mEye);
    eye.position.set(sx * 0.026 * HEX_R, KI_HEAD_CTR + 0.014 * HEX_R, KI_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(eye);
    const brow = new THREE.Mesh(getKIBrow(), mHair);
    brow.position.set(sx * 0.026 * HEX_R, KI_HEAD_CTR + 0.026 * HEX_R, KI_HEAD_S * 0.5 + 0.002 * HEX_R);
    group.add(brow);
  }
  const hairB = new THREE.Mesh(getKIHairBack(), mHair);
  hairB.position.set(0, KI_HEAD_CTR - 0.006 * HEX_R, -(KI_HEAD_S * 0.5 + 0.011 * HEX_R));
  group.add(hairB);
  const hairF = new THREE.Mesh(getKIHairFrng(), mHair);  // czupryna na czubku, POD llautu
  hairF.position.set(0, KI_HEAD_CTR + KI_HEAD_S * 0.46, 0.002 * HEX_R);
  group.add(hairF);
}

/** Dół unku: spódnica + pas graniczny (obrzeże tkackie) + pas chumpi. */
function kiSkirtSet(
  group: THREE.Group, mSkirt: THREE.MeshStandardMaterial,
  mBorder: THREE.MeshStandardMaterial, mBelt: THREE.MeshStandardMaterial,
): void {
  const skirt = new THREE.Mesh(getKISkirt(), mSkirt);
  skirt.position.set(0, KI_TORSO_BOT - 0.018 * HEX_R, 0);
  group.add(skirt);
  const border = new THREE.Mesh(getKIHemBand(), mBorder);
  border.position.set(0, KI_TORSO_BOT - 0.050 * HEX_R, 0);
  group.add(border);
  const belt = new THREE.Mesh(getKIBelt(), mBelt);
  belt.position.set(0, 0.252 * HEX_R, 0);
  group.add(belt);
}

/** CHUSPA — tkana sakiewka na koce/koka przy pasie, z frędzlami. */
function kiChuspa(
  group: THREE.Group, sx: number, mBag: THREE.MeshStandardMaterial,
  mFlap: THREE.MeshStandardMaterial, mFringe: THREE.MeshStandardMaterial,
): void {
  const x = sx * (KI_TORSO_W * 0.5 + 0.020 * HEX_R);
  const bag = new THREE.Mesh(getKIChuspa(), mBag);
  bag.position.set(x, KI_TORSO_BOT - 0.044 * HEX_R, 0.024 * HEX_R);
  group.add(bag);
  const flap = new THREE.Mesh(getKIChuspaFl(), mFlap);
  flap.position.set(x, KI_TORSO_BOT - 0.012 * HEX_R, 0.024 * HEX_R);
  group.add(flap);
  for (const dx of [-0.014, 0.014]) {
    const fr = new THREE.Mesh(getKIFringe(), mFringe);
    fr.scale.set(1.0, 0.7, 1.0);
    fr.position.set(x + dx * HEX_R, KI_TORSO_BOT - 0.080 * HEX_R, 0.024 * HEX_R);
    group.add(fr);
  }
}

/** Naszyjnik z paciorków SPONDYLUSA (mullu) — 5 krążków pod szyją. */
function kiSpondylus(group: THREE.Group, mShell: THREE.MeshStandardMaterial): void {
  let i = 0;
  for (const dx of [-0.042, -0.021, 0.0, 0.021, 0.042]) {
    const dip = (dx === 0) ? 0.0 : (Math.abs(dx) < 0.03 ? 0.005 : 0.012);
    const b = new THREE.Mesh(getKIBead(), mShell);
    b.rotation.z = (i++ - 2) * 0.22;
    b.position.set(dx * HEX_R, KI_TORSO_TOP - 0.016 * HEX_R + dip * HEX_R,
                   KI_TORSO_D * 0.5 + 0.012 * HEX_R);
    group.add(b);
  }
}

/**
 * MACANA — kamienna maczuga gwiaździsta NA OSI przedramienia.
 * Trzonek chonta (cylinder) + oplot rzemienny w chwycie + gałka + pętla na
 * nadgarstek; głowica = piasta + krążek + 6 KOLCÓW rozchodzących się
 * promieniście PROSTOPADLE do trzonka (talerz gwiazdy). Nic nie lewituje:
 * cała grupa siedzi w pięści i dziedziczy jej obrót.
 */
function kiMacana(
  group: THREE.Group, fist: THREE.Vector3, thF: number,
  mWood: THREE.MeshStandardMaterial, mWrap: THREE.MeshStandardMaterial,
  mStone: THREE.MeshStandardMaterial, mStoneLt: THREE.MeshStandardMaterial,
): void {
  const wg = new THREE.Group();
  wg.position.copy(fist);
  wg.rotation.x = Math.PI - thF;

  const haft = new THREE.Mesh(getKIHaft(), mWood);
  haft.position.set(0, 0.098 * HEX_R, 0);
  wg.add(haft);
  for (const dy of [-0.014, 0.030]) {                 // oplot rzemienny chwytu
    const wrap = new THREE.Mesh(getKIHaftWrap(), mWrap);
    wrap.position.set(0, dy * HEX_R, 0);
    wg.add(wrap);
  }
  const knob = new THREE.Mesh(getKIHaftKnob(), mWood);   // zgrubienie końca trzonka
  knob.rotation.x = Math.PI;
  knob.position.set(0, -0.050 * HEX_R, 0);
  wg.add(knob);
  for (const [dx, rz] of [[-0.010, 0.55], [0.010, -0.55]] as [number, number][]) {
    const th = new THREE.Mesh(getKIThong(), mWrap);      // pętla na nadgarstek
    th.rotation.z = rz;
    th.position.set(dx * HEX_R, -0.070 * HEX_R, 0.008 * HEX_R);
    wg.add(th);
  }

  // ── głowica gwiaździsta ──────────────────────────────────────────────────
  const HEAD_Y = 0.222 * HEX_R;
  const hub = new THREE.Mesh(getKIMaceHub(), mStone);    // piasta obejmująca trzonek
  hub.position.set(0, HEAD_Y, 0);
  wg.add(hub);
  const disc = new THREE.Mesh(getKIMaceDisc(), mStone);  // krążek nośny kolców
  disc.position.set(0, HEAD_Y, 0);
  wg.add(disc);
  const YUP = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < 6; i++) {                          // 6 kolców promienistych
    const az = (i / 6) * Math.PI * 2;
    const dir = new THREE.Vector3(Math.cos(az), 0, Math.sin(az));
    const spike = new THREE.Mesh(getKIMaceSpike(), (i % 2 === 0) ? mStone : mStoneLt);
    spike.quaternion.setFromUnitVectors(YUP, dir);
    spike.position.set(dir.x * 0.054 * HEX_R, HEAD_Y, dir.z * 0.054 * HEX_R);
    wg.add(spike);
  }
  group.add(wg);
}

// ===========================================================================
// 1. CHASKA — WOJOWNIK Z MACZUGĄ (Inkowie, Kamień) — OPUS 5
// ---------------------------------------------------------------------------
// Statystyki (units.json): Atak 8 / Obrona 4 / Pancerz 2 / Ruch 3 / Health 80,
// Przebicie 6, bonus +25% vs Swordsman, morale 100 „walczy do śmierci".
// Czytam to jako: SZYBKA, AGRESYWNA piechota bez pancerza, której cała siła
// siedzi w kruszącej broni obuchowej. Stąd: poza szczytowego zamachu, żadnej
// zbroi (tylko tkanina), pleciony hełm chuku jako jedyna ochrona, mała tarcza.
// KOLOR GRACZA: lico tarczy + 2 boczne pióra (dokładnie jak w starym modelu).
// ===========================================================================
export function buildMaceWarriorOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin    = mat(KI_SKIN_DARK,  0.05, 0.80);
  const mSkinDk  = mat(KI_SKIN_SHADE, 0.05, 0.82);
  const mHair    = mat(KI_HAIR,       0.04, 0.88);
  const mEye     = mat(KI_EYE,        0.02, 0.95);
  const mCream   = mat(KI_CREAM,      0.04, 0.86);   // jasne pola szachownicy
  const mBrown   = mat(KI_BROWN_DK,   0.04, 0.88);   // ciemne pola szachownicy
  const mRed     = mat(KI_COCHINEAL,  0.05, 0.78);   // jarzmo + akcenty
  const mOchre   = mat(KI_OCHRE,      0.05, 0.82);
  const mTeal    = mat(KI_TEAL,       0.06, 0.78);
  const mIndigo  = mat(KI_INDIGO,     0.05, 0.80);
  const mStone   = mat(KI_STONE_HEAD, 0.06, 0.88);   // andezyt głowicy
  const mStoneLt = mat(KI_STONE_LT,   0.06, 0.84);
  const mChonta  = mat(KI_CHONTA,     0.05, 0.82);   // trzonek z palmy chonta
  const mWood    = mat(KI_WOOD,       0.05, 0.86);
  const mLeath   = mat(KI_LEATHER,    0.05, 0.84);
  const mLeathDk = mat(KI_LEATHER_DK, 0.05, 0.88);
  const mShell   = mat(KI_SPONDYLUS,  0.08, 0.66);
  const mFeath   = mat(KI_FEATHER,    0.03, 0.92);
  const mOwner   = mat(ownerColor_,   0.12, 0.68);

  const HIP_Y = KI_HIP_Y - 0.010 * HEX_R;

  // ═══ KORPUS + GŁOWA ══════════════════════════════════════════════════════
  kiTorso(group, mCream, mSkin);
  kiHead(group, mSkin, mSkinDk, mHair, mEye);

  // ═══ UNKU SZACHOWNICOWY (tunika wojskowa) ════════════════════════════════
  // Pola tocapu 3 rzędy × 2 kolumny z przodu + 2 z tyłu; jarzmo pod szyją
  // czerwone (koszenila) — układ wprost z zachowanych tunik wojskowych.
  let ri = 0;
  for (const dy of [0.056, 0.008, -0.040]) {
    let cj = 0;
    for (const dx of [-0.043, 0.043]) {
      const sq = new THREE.Mesh(getKITocapu(), ((ri + cj++) % 2 === 0) ? mBrown : mCream);
      sq.position.set(dx * HEX_R, KI_TORSO_CTR + dy * HEX_R, KI_TORSO_D * 0.5 + 0.006 * HEX_R);
      group.add(sq);
    }
    ri++;
  }
  ri = 0;
  for (const dy of [0.040, -0.012]) {
    let cj = 0;
    for (const dx of [-0.043, 0.043]) {
      const sq = new THREE.Mesh(getKITocapu(), ((ri + cj++) % 2 === 0) ? mCream : mBrown);
      sq.position.set(dx * HEX_R, KI_TORSO_CTR + dy * HEX_R, -(KI_TORSO_D * 0.5 + 0.006 * HEX_R));
      group.add(sq);
    }
    ri++;
  }
  const yokeF = new THREE.Mesh(getKIYoke(), mRed);     // czerwone jarzmo (przód)
  yokeF.position.set(0, KI_TORSO_TOP - 0.020 * HEX_R, KI_TORSO_D * 0.5 + 0.008 * HEX_R);
  group.add(yokeF);
  const yokeB = new THREE.Mesh(getKIYoke(), mRed);     // i tył
  yokeB.position.set(0, KI_TORSO_TOP - 0.020 * HEX_R, -(KI_TORSO_D * 0.5 + 0.008 * HEX_R));
  group.add(yokeB);

  // dół unku + tkany pas chumpi z wzorem + chuspa na prawym biodrze
  kiSkirtSet(group, mBrown, mRed, mOchre);
  for (const dx of [-0.048, 0.0, 0.048]) {
    const p = new THREE.Mesh(getKIBeltPat(), mIndigo);
    p.rotation.z = Math.PI / 4;
    p.position.set(dx * HEX_R, 0.252 * HEX_R, KI_TORSO_D * 0.5 + 0.014 * HEX_R);
    group.add(p);
  }
  kiChuspa(group, -1, mTeal, mRed, mOchre);
  kiSpondylus(group, mShell);

  // ═══ NOGI: LEWA (+X) wykroczna, PRAWA (-X) zakroczna; sandały usuta ══════
  kiBuildLeg(group,  KI_HIP_X,  0.55,  0.30, mBrown, mSkin, mLeath, mLeathDk, HIP_Y);
  kiBuildLeg(group, -KI_HIP_X, -0.50, -0.18, mBrown, mSkin, mLeath, mLeathDk, HIP_Y);

  // ═══ GŁOWA: llautu + PLECIONY HEŁM CHUKU + 3 pióra ═══════════════════════
  const llautu = new THREE.Mesh(getKILlautu(), mRed);
  llautu.position.set(0, KI_HEAD_CTR + 0.034 * HEX_R, 0);
  group.add(llautu);
  for (const dx of [-0.034, 0.034]) {                 // wzór plecionki llautu
    const p = new THREE.Mesh(getKILlautuP(), mOchre);
    p.position.set(dx * HEX_R, KI_HEAD_CTR + 0.034 * HEX_R, KI_HEAD_S * 0.5 + 0.008 * HEX_R);
    group.add(p);
  }
  const bowl = new THREE.Mesh(getKIChukuBowl(), mWood);
  bowl.position.set(0, KI_HEAD_TOP + 0.026 * HEX_R, 0);
  group.add(bowl);
  for (const dy of [0.000, 0.030]) {                  // obręcze plecionki z witek
    const ring = new THREE.Mesh(getKIChukuRing(), mLeath);
    ring.scale.set(1.0 - dy * 4.4, 1.0, 1.0 - dy * 4.4);
    ring.position.set(0, KI_HEAD_TOP + (0.006 + dy) * HEX_R, 0);
    group.add(ring);
  }
  const nape = new THREE.Mesh(getKIChukuNeck(), mWood);   // nakarczek
  nape.rotation.x = -0.40;
  nape.position.set(0, KI_HEAD_TOP - 0.012 * HEX_R, -(KI_HEAD_S * 0.5 + 0.026 * HEX_R));
  group.add(nape);
  for (const sx of [-1, 1]) {                            // troki pod brodę
    const tie = new THREE.Mesh(getKIChukuTie(), mLeathDk);
    tie.rotation.z = sx * 0.10;
    tie.position.set(sx * (KI_HEAD_S * 0.5 + 0.005 * HEX_R), KI_HEAD_CTR - 0.018 * HEX_R, 0.008 * HEX_R);
    group.add(tie);
  }
  // 3 pióra w gnieździe hełmu — boczne = KOLOR GRACZA, środkowe białe
  for (const [fx, rz, colF] of [
    [-0.046, 0.28, mOwner], [0.0, 0.0, mFeath], [0.046, -0.28, mOwner],
  ] as [number, number, THREE.MeshStandardMaterial][]) {
    const f = new THREE.Mesh(getKIFeather(), colF);
    f.rotation.z = rz;
    f.position.set(fx * HEX_R + Math.sin(rz) * 0.020 * HEX_R, KI_HEAD_TOP + 0.092 * HEX_R, -0.006 * HEX_R);
    group.add(f);
    const ft = new THREE.Mesh(getKIFeatTip(), colF);
    ft.rotation.z = rz;
    ft.position.set(fx * HEX_R + Math.sin(rz) * 0.062 * HEX_R, KI_HEAD_TOP + 0.150 * HEX_R, -0.006 * HEX_R);
    group.add(ft);
  }

  // ═══ PRAWE (-X) RAMIĘ + MACANA w zamachu szczytowym ══════════════════════
  const THF_R = 2.75;
  const armR = kiBuildArm(group, -KI_SHLD_X, -2.60, THF_R, mCream, mSkin, mSkinDk);
  const fistR = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  kiMacana(group, fistR, THF_R, mChonta, mLeathDk, mStone, mStoneLt);
  const bandR = new THREE.Mesh(getKIArmBand(), mOchre);    // tkana opaska na ramieniu
  bandR.position.set(-KI_SHLD_X, KI_SHLD_Y - 0.062 * HEX_R, 0.008 * HEX_R);
  group.add(bandR);

  // ═══ LEWE (+X) RAMIĘ + TARCZA WALLQANQA ══════════════════════════════════
  const armL = kiBuildArm(group, KI_SHLD_X, 0.50, 1.10, mCream, mSkin, null);
  const sh = new THREE.Group();
  sh.position.set(armL.wrist.x - 0.014 * HEX_R, armL.wrist.y + 0.028 * HEX_R, armL.wrist.z + 0.036 * HEX_R);
  sh.rotation.y = -0.20;
  const board = new THREE.Mesh(getKIShBoard(), mWood);     // deski nośne
  sh.add(board);
  const face = new THREE.Mesh(getKIShFace(), mOwner);      // obicie = KOLOR GRACZA
  face.position.set(0, 0, 0.010 * HEX_R);
  sh.add(face);
  for (const dy of [0.064, -0.064]) {                      // rzemienne obszycie góra/dół
    const rail = new THREE.Mesh(getKIShRail(), mLeath);
    rail.position.set(0, dy * HEX_R, 0.002 * HEX_R);
    sh.add(rail);
  }
  for (const dx of [-0.052, 0.052]) {                      // listwy boczne ramy
    const ev = new THREE.Mesh(getKIShEdgeV(), mWood);
    ev.position.set(dx * HEX_R, 0, 0.002 * HEX_R);
    sh.add(ev);
  }
  for (const [dy, colM] of [[0.030, mRed], [-0.010, mIndigo]] as [number, THREE.MeshStandardMaterial][]) {
    const mo = new THREE.Mesh(getKIShMotif(), colM);       // wzór tkacki na licu
    mo.rotation.z = Math.PI / 4;
    mo.position.set(0, dy * HEX_R, 0.016 * HEX_R);
    sh.add(mo);
  }
  for (const dx of [-0.030, -0.010, 0.010, 0.030]) {       // frędzle dolnej krawędzi
    const fr = new THREE.Mesh(getKIFringe(), (dx < 0) ? mRed : mOchre);
    fr.position.set(dx * HEX_R, -0.082 * HEX_R, 0.004 * HEX_R);
    sh.add(fr);
  }
  const porpax = new THREE.Mesh(getKIShPorpax(), mLeathDk);  // opaska na przedramię
  porpax.position.set(0, 0.010 * HEX_R, -0.020 * HEX_R);
  sh.add(porpax);
  const grip = new THREE.Mesh(getKIShGrip(), mWood);         // poprzeczny chwyt
  grip.position.set(0, -0.022 * HEX_R, -0.026 * HEX_R);
  sh.add(grip);
  group.add(sh);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ===========================================================================
// 2. ESTÓLICA — OSZCZEPNIK Z MIOTACZEM (Inkowie, Kamień) — OPUS 5
// ---------------------------------------------------------------------------
// Statystyki (units.json): Atak dystansowy 4 / zasięg 2 / POCISKÓW 6 /
// Health 20 / Pancerz 0–2 / meleeAttack 1 / kara z flanki 50%, z tyłu 80%.
// Czytam to jako: skrajnie lekki harcownik, którego jedyną wartością jest
// rzut. Stąd: BRAK hełmu i tarczy, goła głowa w llautu, krótsze unku,
// a cały „ciężar" modelu idzie w ESTÓLICĘ i zapas oszczepów (6 pocisków
// → 1 na miotaczu + 3 w lewej dłoni + 2 w pęku na plecach = dokładnie 6).
// KOLOR GRACZA: pas dolny unku + pióropusz (dokładnie jak w starym modelu).
// ===========================================================================
export function buildInkaJavelineerOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  const mSkin    = mat(KI_SKIN,       0.05, 0.80);
  const mSkinDk  = mat(KI_SKIN_SHADE, 0.05, 0.82);
  const mHair    = mat(KI_HAIR,       0.04, 0.88);
  const mEye     = mat(KI_EYE,        0.02, 0.95);
  const mOchre   = mat(KI_OCHRE,      0.05, 0.86);   // unku
  const mCream   = mat(KI_CREAM,      0.04, 0.86);
  const mRed     = mat(KI_COCHINEAL,  0.05, 0.78);
  const mTeal    = mat(KI_TEAL,       0.06, 0.78);
  const mIndigo  = mat(KI_INDIGO,     0.05, 0.80);
  const mWood    = mat(KI_WOOD,       0.05, 0.86);   // atlatl + drzewca
  const mWoodLt  = mat(KI_WOOD_LT,    0.05, 0.84);
  const mBone    = mat(KI_BONE,       0.10, 0.70);   // hak miotacza, kołki
  const mObsid   = mat(KI_OBSIDIAN,   0.30, 0.28);   // groty obsydianowe
  const mLeath   = mat(KI_LEATHER,    0.05, 0.84);
  const mLeathDk = mat(KI_LEATHER_DK, 0.05, 0.88);
  const mShell   = mat(KI_SPONDYLUS,  0.08, 0.66);
  const mFeath   = mat(KI_FEATHER,    0.03, 0.92);
  const mOwner   = mat(ownerColor_,   0.10, 0.68);

  const HIP_Y = KI_HIP_Y - 0.012 * HEX_R;

  // ═══ KORPUS + GŁOWA ══════════════════════════════════════════════════════
  kiTorso(group, mOchre, mSkin);
  kiHead(group, mSkin, mSkinDk, mHair, mEye);

  // ═══ UNKU W PASY + MOTYW SCHODKOWY (wzór tkacki, nie emblemat) ═══════════
  for (const [dy, colS] of [[0.060, mRed], [-0.048, mIndigo]] as [number, THREE.MeshStandardMaterial][]) {
    for (const zs of [1, -1]) {
      const st = new THREE.Mesh(getKIStripe(), colS);
      st.position.set(0, KI_TORSO_CTR + dy * HEX_R, zs * (KI_TORSO_D * 0.5 + 0.006 * HEX_R));
      group.add(st);
    }
  }
  for (const dx of [-0.048, 0.0, 0.048]) {              // rząd rombów tkackich
    const d = new THREE.Mesh(getKIDiamond(), (dx === 0) ? mRed : mTeal);
    d.rotation.z = Math.PI / 4;
    d.position.set(dx * HEX_R, KI_TORSO_CTR + 0.008 * HEX_R, KI_TORSO_D * 0.5 + 0.006 * HEX_R);
    group.add(d);
  }
  for (const dx of [-0.032, 0.032]) {                   // motyw schodkowy nad pasem
    const s = new THREE.Mesh(getKIStepMotif(), mCream);
    s.position.set(dx * HEX_R, KI_TORSO_CTR - 0.028 * HEX_R, KI_TORSO_D * 0.5 + 0.006 * HEX_R);
    group.add(s);
  }
  kiSkirtSet(group, mOchre, mOwner, mLeath);            // pas dolny = KOLOR GRACZA
  kiChuspa(group, 1, mIndigo, mCream, mRed);
  kiSpondylus(group, mShell);

  // ═══ NOGI: głęboki wykrok miotacza ═══════════════════════════════════════
  kiBuildLeg(group,  KI_HIP_X,  0.62,  0.36, mOchre, mSkin, mLeath, mLeathDk, HIP_Y);
  kiBuildLeg(group, -KI_HIP_X, -0.55, -0.22, mOchre, mSkin, mLeath, mLeathDk, HIP_Y);

  // ═══ GŁOWA: samo llautu (bez hełmu) + pióropusz KOLORU GRACZA ════════════
  const llautu = new THREE.Mesh(getKILlautu(), mRed);
  llautu.position.set(0, KI_HEAD_CTR + 0.034 * HEX_R, 0);
  group.add(llautu);
  for (const dx of [-0.034, 0.0, 0.034]) {
    const p = new THREE.Mesh(getKILlautuP(), (dx === 0) ? mCream : mIndigo);
    p.position.set(dx * HEX_R, KI_HEAD_CTR + 0.034 * HEX_R, KI_HEAD_S * 0.5 + 0.008 * HEX_R);
    group.add(p);
  }
  const plume = new THREE.Mesh(getKIPlume(), mOwner);
  plume.rotation.x = -0.12;
  plume.position.set(0, KI_HEAD_TOP + 0.042 * HEX_R, -0.006 * HEX_R);
  group.add(plume);
  const plumeTip = new THREE.Mesh(getKIFeatTip(), mFeath);
  plumeTip.rotation.x = -0.12;
  plumeTip.position.set(0, KI_HEAD_TOP + 0.098 * HEX_R, -0.012 * HEX_R);
  group.add(plumeTip);

  // ═══ PRAWE (-X) RAMIĘ + ESTÓLICA (ATLATL) W ZAMACHU ══════════════════════
  // Miotacz siedzi NA OSI przedramienia: korpus deski, dwie listwy tworzące
  // ROWEK, hak kościany na końcu, uchwyt z 2 kołkami na palce, pętla rzemienna.
  const THF_R = 1.95;
  const armR = kiBuildArm(group, -KI_SHLD_X, -2.35, THF_R, mOchre, mSkin, mSkinDk);
  const fistR = armR.wrist.clone().addScaledVector(armR.axis, 0.014 * HEX_R);
  const wg = new THREE.Group();
  wg.position.copy(fistR);
  wg.rotation.x = Math.PI - THF_R;
  const body = new THREE.Mesh(getKIAtlBody(), mWoodLt);
  body.position.set(0, 0.062 * HEX_R, 0.008 * HEX_R);
  wg.add(body);
  for (const dx of [-0.014, 0.014]) {                    // listwy prowadzące rowka
    const rail = new THREE.Mesh(getKIAtlRail(), mWood);
    rail.position.set(dx * HEX_R, 0.066 * HEX_R, 0.017 * HEX_R);
    wg.add(rail);
  }
  const hook = new THREE.Mesh(getKIAtlHook(), mBone);     // ZACZEP — kość, nie metal
  hook.position.set(0, 0.170 * HEX_R, 0.020 * HEX_R);
  wg.add(hook);
  const gripA = new THREE.Mesh(getKIAtlGrip(), mWoodLt);  // pogrubiony uchwyt
  gripA.position.set(0, -0.024 * HEX_R, 0.006 * HEX_R);
  wg.add(gripA);
  for (const dx of [-0.017, 0.017]) {                     // kołki na palce
    const peg = new THREE.Mesh(getKIAtlPeg(), mBone);
    peg.rotation.z = Math.PI / 2;
    peg.position.set(dx * HEX_R, -0.030 * HEX_R, 0.008 * HEX_R);
    wg.add(peg);
  }
  const loop = new THREE.Mesh(getKIAtlLoop(), mLeathDk);  // pętla rzemienna
  loop.position.set(0, -0.052 * HEX_R, 0.006 * HEX_R);
  wg.add(loop);
  group.add(wg);

  // ── oszczep zaparty o hak, leżący w rowku, grot ku wrogowi ───────────────
  const DART_A = 1.00;                                   // stromy kąt wyrzutu
  const dartDir = new THREE.Vector3(0, Math.sin(DART_A), Math.cos(DART_A));
  const tail = fistR.clone().addScaledVector(armR.axis, 0.168 * HEX_R);
  tail.z += 0.022 * HEX_R;
  const dartRot = Math.atan2(dartDir.z, dartDir.y);
  const at = (d: number): THREE.Vector3 => tail.clone().addScaledVector(dartDir, d * HEX_R);

  const shaft = new THREE.Mesh(getKIDartShaft(), mWood);
  shaft.rotation.x = dartRot;
  shaft.position.copy(at(0.150));
  group.add(shaft);
  const fore = new THREE.Mesh(getKIDartFore(), mWoodLt); // pogrubiony przedni odcinek
  fore.rotation.x = dartRot;
  fore.position.copy(at(0.302));
  group.add(fore);
  const lash = new THREE.Mesh(getKIDartLash(), mLeathDk); // rzemień mocujący grot
  lash.rotation.x = dartRot;
  lash.position.copy(at(0.322));
  group.add(lash);
  const tip = new THREE.Mesh(getKIDartTip(), mObsid);     // GROT OBSYDIANOWY
  tip.rotation.x = dartRot;
  tip.rotation.y = Math.PI / 4;
  tip.position.copy(at(0.352));
  group.add(tip);
  for (const [ang, colF] of [[0.0, mFeath], [2.09, mFeath], [4.19, mFeath]] as [number, THREE.MeshStandardMaterial][]) {
    const fl = new THREE.Mesh(getKIFletch(), colF);       // 3 lotki
    fl.rotation.x = dartRot;
    fl.rotation.z = ang;
    fl.position.copy(at(0.028));
    group.add(fl);
  }

  // ═══ LEWE (+X) RAMIĘ: 3 zapasowe oszczepy w dłoni ════════════════════════
  const armL = kiBuildArm(group, KI_SHLD_X, 0.30, 0.85, mOchre, mSkin, mSkinDk);
  const fistL = armL.wrist.clone().addScaledVector(armL.axis, 0.014 * HEX_R);
  for (const [dx, dz] of [[-0.014, -0.004], [0.0, 0.010], [0.014, -0.004]] as [number, number][]) {
    const sd = new THREE.Mesh(getKIDartShaft(), mWood);
    sd.rotation.x = -0.12;
    sd.position.set(fistL.x + dx * HEX_R, fistL.y + 0.046 * HEX_R, fistL.z + dz * HEX_R);
    group.add(sd);
    const st = new THREE.Mesh(getKIDartTip(), mObsid);
    st.rotation.x = -0.12;
    st.rotation.y = Math.PI / 4;
    st.position.set(fistL.x + dx * HEX_R, fistL.y + 0.217 * HEX_R, fistL.z + (dz - 0.021) * HEX_R);
    group.add(st);
    const sl = new THREE.Mesh(getKIFletch(), mFeath);
    sl.rotation.x = -0.12;
    sl.position.set(fistL.x + dx * HEX_R, fistL.y - 0.093 * HEX_R, fistL.z + (dz + 0.017) * HEX_R);
    group.add(sl);
  }
  const wrapL = new THREE.Mesh(getKIArmBand(), mIndigo);   // opaska na przedramieniu
  wrapL.position.set(KI_SHLD_X + 0.006 * HEX_R, KI_SHLD_Y - 0.118 * HEX_R, 0.052 * HEX_R);
  group.add(wrapL);

  // ═══ PĘK 2 ZAPASOWYCH OSZCZEPÓW NA PLECACH (razem 6 pocisków) ════════════
  const tie = new THREE.Mesh(getKIQuiverTie(), mLeath);
  tie.rotation.x = 0.30;
  tie.position.set(-0.034 * HEX_R, 0.360 * HEX_R, -(KI_TORSO_D * 0.5 + 0.018 * HEX_R));
  group.add(tie);
  for (const dx of [-0.046, -0.024]) {
    const bs = new THREE.Mesh(getKIDartShaft(), mWoodLt);
    bs.rotation.x = 0.30;
    bs.scale.set(1.0, 0.86, 1.0);
    bs.position.set(dx * HEX_R, 0.372 * HEX_R, -(KI_TORSO_D * 0.5 + 0.030 * HEX_R));
    group.add(bs);
  }

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeKamienInkaOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gKITorso, gKIChest, gKINeck, gKIHead, gKIJaw, gKINose, gKIEye, gKIBrow,
    gKIHairBack, gKIHairFrng, gKIThigh, gKIShin, gKIUpArm, gKIForearm, gKIFist,
    gKISole, gKIToes, gKIStrapF, gKIStrapA,
    gKISkirt, gKIHemBand, gKIBelt, gKIBeltPat, gKITocapu, gKIYoke, gKIStripe,
    gKIStepMotif, gKIDiamond, gKIChuspa, gKIChuspaFl, gKIFringe, gKIBead, gKIArmBand,
    gKILlautu, gKILlautuP, gKIChukuBowl, gKIChukuRing, gKIChukuNeck, gKIChukuTie,
    gKIFeather, gKIFeatTip, gKIPlume,
    gKIHaft, gKIHaftWrap, gKIHaftKnob, gKIMaceDisc, gKIMaceHub, gKIMaceSpike, gKIThong,
    gKIShBoard, gKIShFace, gKIShRail, gKIShEdgeV, gKIShMotif, gKIShGrip, gKIShPorpax,
    gKIAtlBody, gKIAtlRail, gKIAtlHook, gKIAtlGrip, gKIAtlPeg, gKIAtlLoop,
    gKIDartShaft, gKIDartFore, gKIDartTip, gKIDartLash, gKIFletch, gKIQuiverTie,
  ];
  for (const g of all) { g?.dispose(); }
  gKITorso = gKIChest = gKINeck = gKIHead = gKIJaw = gKINose = gKIEye = gKIBrow = null;
  gKIHairBack = gKIHairFrng = gKIThigh = gKIShin = gKIUpArm = gKIForearm = gKIFist = null;
  gKISole = gKIToes = gKIStrapF = gKIStrapA = null;
  gKISkirt = gKIHemBand = gKIBelt = gKIBeltPat = gKITocapu = gKIYoke = gKIStripe = null;
  gKIStepMotif = gKIDiamond = gKIChuspa = gKIChuspaFl = gKIFringe = gKIBead = gKIArmBand = null;
  gKILlautu = gKILlautuP = gKIChukuNeck = gKIChukuTie = null;
  gKIChukuBowl = gKIChukuRing = null;
  gKIFeather = gKIFeatTip = gKIPlume = null;
  gKIHaft = gKIHaftWrap = gKIHaftKnob = gKIMaceDisc = gKIMaceHub = null;
  gKIMaceSpike = null;
  gKIThong = null;
  gKIShBoard = gKIShFace = gKIShRail = gKIShEdgeV = gKIShMotif = gKIShGrip = gKIShPorpax = null;
  gKIAtlBody = gKIAtlRail = gKIAtlHook = gKIAtlGrip = gKIAtlLoop = null;
  gKIAtlPeg = null;
  gKIDartShaft = gKIDartFore = gKIDartLash = gKIFletch = gKIQuiverTie = null;
  gKIDartTip = null;
}
