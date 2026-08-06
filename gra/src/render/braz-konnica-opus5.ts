/**
 * braz-konnica-opus5.ts — KONNICA (Horseman), epoka BRĄZU
 * units.json: „Konnica" / EN „Horseman", Epoka=Brąz, Kultura=null,
 * Tech=Jeździectwo, Typ=Mount, Rola (linia)=Flanka → jednostka DOSTĘPNA DLA
 * WSZYSTKICH CYWILIZACJI. Zastępuje dotychczasowy, wspólny model kategorii
 * `konnica` z units.ts (case 'konnica', ~linia 3027) — czyli generyczny koń
 * z kon-nowy-model.ts + beznogi „klocek" jeźdźca bez żadnego oporządzenia.
 * ---------------------------------------------------------------------------
 * Drop-in zgodny z rodziną builderów Opus 5:
 *   buildKonnicaBrazOpus5(ownerColor) : THREE.Group
 *   disposeBrazKonnicaOpus5Geometries() : void
 *
 * Konwencje serii (jak braz-wlocznik-opus5.ts / braz-rydwan-woly-opus5.ts):
 *   - token PRZODEM do +Z (kamera gry stoi po stronie +Z i patrzy pod 52°),
 *     kopyta na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y ⇒ LEWA ręka jeźdźca = +X
 *     (wodze), PRAWA = -X (włócznia),
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie wspólne = SINGLETONY MODUŁU (lazy), `perTokenGeos` puste —
 *     nic, co _disposeToken() niszczy przy usunięciu żetonu,
 *   - `group.userData['mats']` / `['perTokenGeos']` jak w całej serii,
 *   - HEX_R = 1.0 z hexutil.ts. ZMIERZONE (harness, measureAll):
 *     wysokość 0,781×HEX_R (czubek grota; sama sylwetka koń+jeździec do
 *     czubka czapki: 0,743), maksymalny promień poziomy 0,405×HEX_R przy
 *     twardym limicie heksu 0,866 i normie zadania 0,70 — z zapasem;
 *     minY = 0,0000 (kopyta trzech nóg podporowych stoją dokładnie na ziemi,
 *     czwarta jest świadomie uniesiona w kroku).
 *
 * USTAWIENIE 3/4 (KN_YAW): cała bryła siedzi na wewnętrznym pivocie obróconym
 * o +0,58 rad wokół Y. Koń ustawiony bokiem-skosem do kamery czyta się jako
 * koń; koń „na wprost" pod kątem 52° to nieczytelna plama (sam łeb i pierś).
 * Obrót jest na PIVOCIE WEWNĘTRZNYM, więc ewentualne rotowanie żetonu przez
 * renderer (units.ts robi to np. w case 'konnica'/'rydwan') go nie kasuje.
 *
 * KOLOR GRACZA (sloty tintu): (1) CZAPRAK — derka pod jeźdźcem wraz z obiema
 * opadającymi płachtami na boki konia (duża, świetnie widoczna z góry przy
 * 52° płaszczyzna — główny nośnik koloru), (2) opaska na skórzanej czapce
 * jeźdźca. Dwa sloty, dokładnie jak w reszcie serii (Włócznik: szarfa +
 * emblemat na tarczy).
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Rama czasowa: epoka Brązu, ok. 3300–1200 p.n.e. To jest WCZESNY JEŹDZIEC,
 * z okresu, w którym koń bojowy dopiero wchodzi do użytku pod wierzch (główną
 * bronią „konną" tej epoki jest rydwan — w grze osobna jednostka). Cała
 * konstrukcja modelu jest podporządkowana jednej zasadzie: nic, czego jeszcze
 * nie wynaleziono.
 *
 * K1. BRAK STRZEMION — bezwzględnie. Strzemię to wynalazek późniejszy o
 *     kilkanaście–dwadzieścia wieków (Azja Wschodnia, ok. IV–V w. n.e.);
 *     w epoce Brązu nie istnieje w żadnej kulturze. W modelu NIE MA ani
 *     strzemion, ani puślisk, ani żadnego punktu oparcia stopy — nogi
 *     jeźdźca ZWISAJĄ SWOBODNIE wzdłuż boków konia, stopy poniżej linii
 *     brzucha. To jest widoczna, sprawdzalna z zrzutu cecha modelu.
 * K2. BRAK SIODŁA ZE SZTYWNYM DRZEWEM (łękiem). Zamiast siodła — CZAPRAK:
 *     miękka derka/mata z tkaniny i skóry, luźno przewieszona przez grzbiet,
 *     bez przedniego i tylnego łęku, bez terlicy. Utrzymuje ją POPRĘG pod
 *     brzuchem, NAPIERŚNIK z przodu i POŚLIŚNIK (crupper) do nasady ogona —
 *     dokładnie zestaw pasów, którym mocuje się miękką podkładkę pozbawioną
 *     drewnianego szkieletu (siodło z drzewem samo trzyma się na grzbiecie
 *     i takiego kompletu nie potrzebuje). Jeździec siedzi więc GŁĘBOKO,
 *     bezpośrednio na grzbiecie, ściskając konia łydkami — jedyna technika
 *     jazdy dostępna przed strzemieniem.
 * K3. UZDA Z WĘDZIDŁEM — TAK, to NIE jest anachronizm. Kiełzno w epoce Brązu
 *     jest dobrze poświadczone: najpierw z rogu/kości (policzki wędzidła
 *     z poroża, kultury stepowe II tys. p.n.e.), potem BRĄZOWE wędzidła
 *     członowe na Bliskim Wschodzie i w Egipcie późnej epoki Brązu. Model ma:
 *     nachrapnik, pas policzkowy, nagłówek, BRĄZOWE wędzidło z dwoma
 *     pierścieniami i parę wodzy biegnących do lewej dłoni jeźdźca. Wodze są
 *     w LEWEJ ręce, broń w prawej — układ wymuszony fizycznie, nie stylistyką.
 * K4. UZBROJENIE LEKKIE: krótka WŁÓCZNIA/DZIDA (ok. 1,7 m) z BRĄZOWYM
 *     grotem liściastym osadzonym w TULEJCE i owinięciem rzemiennym w
 *     miejscu osadzenia — ta sama technologia i ten sam profil grota co
 *     u Włócznika brązowego (braz-wlocznik-opus5.ts), bo to fizycznie ten
 *     sam typ broni, tylko krótszy — dostosowany do trzymania jedną ręką
 *     w siodle. Do tego BRĄZOWY SZTYLET w skórzanej pochwie przy pasie
 *     (broń zapasowa, praktyczna, nie ceremonialna).
 *     Rozważona i ODRZUCONA alternatywa: łuk. Konny łucznik to również
 *     wariant możliwy w epoce Brązu (step), ale (a) łuk czytelnie oznacza
 *     jednostkę DYSTANSOWĄ, a „Konnica" ma w units.json „Atak dystansowy": 0
 *     i „Zasięg ataku (hex)": „—" (czysta jednostka zwarcia), (b) w grze
 *     istnieje osobna „Konnica łucznicza asyryjska", której nie wolno
 *     dublować. Włócznia jest ponadto bronią jeźdźca poświadczoną
 *     najszerzej geograficznie — a to jednostka wszystkich cywilizacji.
 * K5. DOSIAD: jeździec siedzi NA GRZBIECIE, tuż za kłębem — NIE w tzw.
 *     „dosiadzie oślim" (na zadzie, tuż przed ogonem), który pokazują
 *     najstarsze bliskowschodnie przedstawienia jeźdźców III tys. p.n.e.
 *     Decyzja świadoma i uzasadniona: dosiad oślny to najwcześniejsza,
 *     przejściowa maniera przeniesiona wprost z jazdy na osiołku, a już
 *     w późnej epoce Brązu (kiedy jeździec staje się realną siłą bojową —
 *     a taką rolę ma ta jednostka w grze) przesunięcie na grzbiet było
 *     regułą, bo tylko ono pozwala kierować koniem łydką i walczyć.
 *     Wybrano wersję późniejszą, bo to jednostka BOJOWA, a nie posłaniec.
 * K6. KOŃ MAŁY I KRĘPY — to nie jest wierzchowiec późniejszych epok.
 *     Koń epoki Brązu miał w kłębie ok. 1,30–1,45 m (dzisiejszy kuc), tułów
 *     głęboki i beczkowaty, nogi krótkie, łeb duży w stosunku do ciała,
 *     szyja gruba i tylko lekko wygięta. W modelu grzbiet wypada na
 *     0,440×HEX_R, a czubek czapki jeźdźca na 0,743×HEX_R — stosunek 0,59,
 *     czyli proporcja „mały koń, duży człowiek". Dodatkowo prześwit pod
 *     brzuchem (0,224) jest praktycznie równy głębokości klatki (0,216) —
 *     sylwetka krótkonoga, kucowa, a nie długonoga jak koń nowożytny.
 *     Konsekwencja: stopy jeźdźca (kostka na 0,201×HEX_R) zwisają NIŻEJ niż
 *     linia brzucha konia. To najlepiej widoczny historyczny sygnał modelu.
 * K7. MAŚĆ I ODMIANY PIERWOTNE: sierść myszata/bułana (dun) z ciemnymi
 *     „punktami" — ciemna PRĘGA GRZBIETOWA, ciemne pęciny, ciemna grzywa
 *     i ogon. Badania kopalnego DNA wskazują na maści bułane/gniade jako
 *     typowe dla wczesnych koni domowych; pręga grzbietowa to klasyczna
 *     odmiana pierwotna. Grzywa KRÓTKA I STOJĄCA (szczotka), a nie długa
 *     opadająca — postawa pierwotna, powszechna też w ikonografii
 *     bliskowschodniej (grzywy strzyżone „w szczotkę").
 * K8. STRÓJ: krótka WEŁNIANA TUNIKA do połowy uda (jazda bez strzemion
 *     wymaga swobody w biodrze — długa szata jest wykluczona funkcjonalnie),
 *     pas skórzany, gołe łydki, SANDAŁY. NA GŁOWIE MIĘKKA CZAPKA SKÓRZANA
 *     z brązową opaską czołową — świadomie NIE brązowy hełm kopulasty
 *     Włócznika: jeździec bez strzemion balansuje ciężarem własnego ciała,
 *     więc obciążanie głowy metalem jest przeciwskuteczne, a lekkie nakrycie
 *     głowy jest tym, co pokazuje ikonografia wczesnych jeźdźców. Kopuła
 *     czapki to PEŁNA PÓŁKULA w jasnym filcu — ciemna, mała czapka przy
 *     kącie kamery 52° czytała się jako czarna dziura w czubku głowy (ten
 *     sam objaw „otwartego garnka", który naprawiano przy hełmie Włócznika).
 * K9. CZEGO ŚWIADOMIE NIE MA: strzemion, puślisk, siodła z łękami/terlicą,
 *     ostróg (żelazo + późniejsza epoka), podków (to średniowiecze), zbroi
 *     płytowej ani łuskowej, jakiegokolwiek żelaza/stali, kropierza
 *     (końskiej zbroi), oznaczeń rangi, pióropusza, proporca na włóczni.
 *
 * -- ROZRÓŻNIALNOŚĆ wobec dzisiejszego (generycznego) modelu 'konnica':
 *    DZIŚ: koń kasztanowaty z kon-nowy-model.ts + jeździec BEZ NÓG (dwa
 *      klocki-ramiona po bokach torsu), bez uzdy, bez wodzy, bez czapraka,
 *      bez poprągu, bez broni w dłoni — „karmazynowy tors na koniu".
 *    NOWY: mały bułany koń z pręgą grzbietową i stojącą grzywą, pełna uzda
 *      z brązowym wędzidłem i wodzami w lewej dłoni, czaprak w kolorze
 *      gracza na poprągu + napierśniku + pośliśniku, jeździec z NOGAMI
 *      zwisającymi bez strzemion, krótka włócznia z brązowym grotem
 *      w tulejce, sztylet przy pasie, skórzana czapka z opaską.
 *
 * BUDŻET (zmierzony traversem w harnessie podglądu, tools/
 * .konnica-braz-opus5-preview-entry.ts → measureAll()):
 *   104 mesh · 1572 trójkąty · 17 materiałów · 0 geometrii per-token.
 * Dla porównania w tym samym pomiarze: Rydwan (woły) 108 mesh / 1496 tri,
 * Włócznik 77 mesh / 1228 tri, DZISIEJSZY generyczny model konnicy
 * 44 mesh / 636 tri (ale 10 geometrii per-token, alokowanych na każdy żeton).
 *
 * REGENERACJA PODGLĄDU (z katalogu gra/, NIGDY `npm run build`):
 *   node tools/build-konnica-braz-opus5-preview.cjs <plik.html>
 *   node tools/capture-konnica-braz-opus5.cjs <plik.html> <katalog-zrzutów>
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
const KN_COAT       = 0xb08a52;   // sierść bułana/myszata (dun) — maść pierwotna
const KN_COAT_DK    = 0x6d4c26;   // „punkty": pęciny, pręga grzbietowa, cień pyska
const KN_MANE       = 0x3a2917;   // grzywa (stojąca) + ogon
const KN_HOOF       = 0x3a2c1c;   // kopyta

const KN_SKIN       = 0xdba876;
const KN_SKIN_DK    = 0xb9855a;

const KN_WOOL       = 0xc2a066;   // tunika wełniana (naturalna, niefarbowana)
const KN_WOOL_DK    = 0x977a48;   // fałdy / rąbek tuniki

const KN_LEATHER    = 0x6b4a28;   // pas, uzda, poprąg, sandały, pochwa, czapka
const KN_LEATHER_DK = 0x4a331b;   // owinięcia, rzemienie, kant czapraka

const KN_FELT       = 0xa07c4e;   // filcowo-skórzana czapka jeźdźca (jasna)
const KN_WOOD       = 0x7a5c3a;   // drzewce włóczni

const KN_BRONZE     = 0xcf9234;   // wędzidło, grot, tulejka, sztylet, opaska
const KN_BRONZE_LT  = 0xdaa84e;

const KN_HAIR       = 0x2a1c10;
const KN_EYE        = 0x14100c;

// ═══════════════════════════════════════════════════════════════════════════
// SKALA I PROPORCJE — wyprowadzone z metrów, nie „na oko"
// ═══════════════════════════════════════════════════════════════════════════
// Kotwica skali: koń epoki Brązu ma 1,35 m w kłębie (pkt K6) i siedzi na
// 0,440×HEX_R ⇒ 1 m ≈ 0,326×HEX_R. Wszystkie wymiary niżej są liczone z tej
// skali, więc proporcja jeździec/koń jest historyczna, a nie dobrana wzrokowo:
//   - człowiek w dosiadzie, od siedzenia po czubek głowy: 0,90 m ⇒ 0,293
//     (0,293 / 0,440 = 0,67 — dokładnie stosunek realny),
//   - noga jeźdźca (udo + goleń): 0,85 m ⇒ 0,277 — DŁUŻSZA niż prześwit pod
//     brzuchem konia (0,246), więc stopa MUSI wypaść niżej niż linia brzucha.
//     To jest najlepiej sprawdzalny na zrzucie dowód, że koń jest mały,
//     a jeździec siedzi bez strzemion (pkt K1/K6).
// ── wysokości / osie sylwetki (wszystko ×HEX_R) ─────────────────────────────
const KN_BODY_CTR   = 0.332;   // środek beczki tułowia konia
const KN_BACK_Y     = 0.440;   // grzbiet = dosiad jeźdźca (kłąb nieco wyżej)
const KN_BELLY_Y    = 0.224;   // spód beczki — punkt odniesienia dla stóp
// Prześwit pod brzuchem (0,224) ≈ głębokość klatki (0,216) — proporcja
// KUCOWA. Koń „nowożytny" ma nogi wyraźnie dłuższe niż głęboka klatka;
// koń epoki Brązu jest krępy i krótkonogi (pkt K6), więc te dwie liczby
// muszą być mniej więcej równe.
const KN_LEG_TOP_F  = 0.2595;  // staw barkowy (przód, +Z) — patrz knHorseLeg
const KN_LEG_TOP_R  = 0.2607;  // staw biodrowy (tył, -Z)
const KN_SEAT_Z     = 0.010;   // jeździec tuż ZA kłębem (kłąb: z ≈ +0.102)

// wymiary jeźdźca — proporcje realne (patrz wyżej), nie „rodzina piechoty":
// figurka pieszego z serii ma świadomie powiększoną głowę, ale na koniu suma
// koń+jeździec musi zmieścić się w 0,75×HEX_R, więc jeździec jest liczony
// z metrów i wychodzi smuklejszy niż piechur.
const KN_TORSO_W    = 0.140;
const KN_TORSO_H    = 0.150;
const KN_TORSO_D    = 0.084;
const KN_TORSO_TOP  = KN_BACK_Y + KN_TORSO_H;              // 0.590
const KN_NECK_H     = 0.021;
const KN_HEAD_S     = 0.100;
const KN_HEAD_CTR   = KN_TORSO_TOP + KN_NECK_H + KN_HEAD_S * 0.5;  // 0.661
const KN_SHLD_X     = KN_TORSO_W * 0.5 + 0.012;            // 0.082
const KN_SHLD_Y     = KN_TORSO_TOP - 0.019;                // 0.571
const KN_HIP_X      = 0.104;

const KN_UPARM_L    = 0.078;
const KN_FOREARM_L  = 0.072;
const KN_THIGH_L    = 0.130;
const KN_SHIN_L     = 0.130;

/** Obrót 3/4 całej bryły — patrz nagłówek („USTAWIENIE 3/4"). */
const KN_YAW        = 1.02;

// ===========================================================================
// GEOMETRIE — SINGLETONY MODUŁU (lazy). Zero alokacji per token.
// ===========================================================================
// koń — tułów
let gKNBarrel:  THREE.CylinderGeometry | null = null;
let gKNChest:   THREE.IcosahedronGeometry | null = null;
let gKNRump:    THREE.IcosahedronGeometry | null = null;
let gKNWithers: THREE.BoxGeometry | null = null;
let gKNStripe:  THREE.BoxGeometry | null = null;
// koń — szyja / łeb
let gKNNeck1:   THREE.CylinderGeometry | null = null;
let gKNNeck2:   THREE.CylinderGeometry | null = null;
let gKNNeck3:   THREE.CylinderGeometry | null = null;
let gKNSkull:   THREE.BoxGeometry | null = null;
let gKNMuzzle:  THREE.CylinderGeometry | null = null;
let gKNNostril: THREE.BoxGeometry | null = null;
let gKNEar:     THREE.ConeGeometry | null = null;
let gKNEye:     THREE.BoxGeometry | null = null;
let gKNManeTuft: THREE.BoxGeometry | null = null;
let gKNForelock: THREE.BoxGeometry | null = null;
// koń — nogi
let gKNUpFrnt:  THREE.BoxGeometry | null = null;
let gKNUpRear:  THREE.BoxGeometry | null = null;
let gKNLower:   THREE.BoxGeometry | null = null;
let gKNPastern: THREE.BoxGeometry | null = null;
let gKNHoof:    THREE.BoxGeometry | null = null;
// koń — ogon
let gKNTail1:   THREE.CylinderGeometry | null = null;
let gKNTail2:   THREE.CylinderGeometry | null = null;
// oporządzenie
let gKNPadTop:  THREE.BoxGeometry | null = null;
let gKNPadFlap: THREE.BoxGeometry | null = null;
let gKNPadHem:  THREE.BoxGeometry | null = null;
let gKNGirth:   THREE.CylinderGeometry | null = null;
let gKNBreast:  THREE.BoxGeometry | null = null;
let gKNNoseBand: THREE.BoxGeometry | null = null;
let gKNBrowBand: THREE.BoxGeometry | null = null;
let gKNBit:     THREE.BoxGeometry | null = null;
let gKNBitRing: THREE.TorusGeometry | null = null;
// jeździec
let gKNTorso:   THREE.BoxGeometry | null = null;
let gKNChestR:  THREE.BoxGeometry | null = null;
let gKNNeckR:   THREE.BoxGeometry | null = null;
let gKNHead:    THREE.BoxGeometry | null = null;
let gKNJaw:     THREE.BoxGeometry | null = null;
let gKNNose:    THREE.BoxGeometry | null = null;
let gKNBrow:    THREE.BoxGeometry | null = null;
let gKNEarR:    THREE.BoxGeometry | null = null;
let gKNEyeR:    THREE.BoxGeometry | null = null;
let gKNUpArm:   THREE.BoxGeometry | null = null;
let gKNForearm: THREE.BoxGeometry | null = null;
let gKNFist:    THREE.BoxGeometry | null = null;
let gKNThigh:   THREE.BoxGeometry | null = null;
let gKNShin:    THREE.BoxGeometry | null = null;
let gKNSole:    THREE.BoxGeometry | null = null;
let gKNToes:    THREE.BoxGeometry | null = null;
let gKNAnkStrap: THREE.BoxGeometry | null = null;
let gKNTunicHem: THREE.BoxGeometry | null = null;
let gKNFold:    THREE.BoxGeometry | null = null;
let gKNBelt:    THREE.BoxGeometry | null = null;
let gKNBuckle:  THREE.BoxGeometry | null = null;
let gKNSheath:  THREE.BoxGeometry | null = null;
let gKNHilt:    THREE.BoxGeometry | null = null;
let gKNCapDome: THREE.SphereGeometry | null = null;
let gKNCapBand: THREE.CylinderGeometry | null = null;
let gKNNape:    THREE.BoxGeometry | null = null;
// włócznia
let gKNShaft:   THREE.CylinderGeometry | null = null;
let gKNSocket:  THREE.CylinderGeometry | null = null;
let gKNBind:    THREE.BoxGeometry | null = null;
let gKNGrip:    THREE.BoxGeometry | null = null;
let gKNSpearHd: THREE.BufferGeometry | null = null;
let gKNButt:    THREE.ConeGeometry | null = null;
// uniwersalne pudełko 1×1×1 do pasów rysowanych „od punktu do punktu"
let gKNUnit:    THREE.BoxGeometry | null = null;

function getKNBarrel():  THREE.CylinderGeometry  { return (gKNBarrel  ||= new THREE.CylinderGeometry(0.108 * HEX_R, 0.100 * HEX_R, 0.256 * HEX_R, 7, 1)); }
function getKNChest():   THREE.IcosahedronGeometry { return (gKNChest ||= new THREE.IcosahedronGeometry(0.094 * HEX_R, 0)); }
function getKNRump():    THREE.IcosahedronGeometry { return (gKNRump  ||= new THREE.IcosahedronGeometry(0.096 * HEX_R, 0)); }
function getKNWithers(): THREE.BoxGeometry { return (gKNWithers ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.056 * HEX_R, 0.110 * HEX_R)); }
function getKNStripe():  THREE.BoxGeometry { return (gKNStripe  ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.012 * HEX_R, 0.150 * HEX_R)); }
function getKNNeck1():   THREE.CylinderGeometry { return (gKNNeck1 ||= new THREE.CylinderGeometry(0.052 * HEX_R, 0.064 * HEX_R, 0.082 * HEX_R, 6, 1, true)); }
function getKNNeck2():   THREE.CylinderGeometry { return (gKNNeck2 ||= new THREE.CylinderGeometry(0.043 * HEX_R, 0.052 * HEX_R, 0.072 * HEX_R, 6, 1, true)); }
function getKNNeck3():   THREE.CylinderGeometry { return (gKNNeck3 ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.043 * HEX_R, 0.058 * HEX_R, 6, 1, true)); }
function getKNSkull():   THREE.BoxGeometry { return (gKNSkull ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.080 * HEX_R, 0.096 * HEX_R)); }
function getKNMuzzle():  THREE.CylinderGeometry { return (gKNMuzzle ||= new THREE.CylinderGeometry(0.023 * HEX_R, 0.032 * HEX_R, 0.082 * HEX_R, 5, 1)); }
function getKNNostril(): THREE.BoxGeometry { return (gKNNostril ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.011 * HEX_R, 0.008 * HEX_R)); }
function getKNEar():     THREE.ConeGeometry { return (gKNEar ||= new THREE.ConeGeometry(0.015 * HEX_R, 0.042 * HEX_R, 4)); }
function getKNEye():     THREE.BoxGeometry { return (gKNEye ||= new THREE.BoxGeometry(0.008 * HEX_R, 0.014 * HEX_R, 0.014 * HEX_R)); }
function getKNManeTuft(): THREE.BoxGeometry { return (gKNManeTuft ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.034 * HEX_R, 0.026 * HEX_R)); }
function getKNForelock(): THREE.BoxGeometry { return (gKNForelock ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.042 * HEX_R, 0.022 * HEX_R)); }
function getKNUpFrnt():  THREE.BoxGeometry { return (gKNUpFrnt ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.118 * HEX_R, 0.056 * HEX_R)); }
function getKNUpRear():  THREE.BoxGeometry { return (gKNUpRear ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.124 * HEX_R, 0.064 * HEX_R)); }
function getKNLower():   THREE.BoxGeometry { return (gKNLower ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.118 * HEX_R, 0.032 * HEX_R)); }
function getKNPastern(): THREE.BoxGeometry { return (gKNPastern ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.038 * HEX_R, 0.032 * HEX_R)); }
function getKNHoof():    THREE.BoxGeometry { return (gKNHoof ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.032 * HEX_R, 0.040 * HEX_R)); }
function getKNTail1():   THREE.CylinderGeometry { return (gKNTail1 ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.020 * HEX_R, 0.052 * HEX_R, 4, 1)); }
function getKNTail2():   THREE.CylinderGeometry { return (gKNTail2 ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.017 * HEX_R, 0.128 * HEX_R, 4, 1)); }
function getKNPadTop():  THREE.BoxGeometry { return (gKNPadTop ||= new THREE.BoxGeometry(0.150 * HEX_R, 0.020 * HEX_R, 0.238 * HEX_R)); }
function getKNPadFlap(): THREE.BoxGeometry { return (gKNPadFlap ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.096 * HEX_R, 0.212 * HEX_R)); }
function getKNPadHem():  THREE.BoxGeometry { return (gKNPadHem ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.014 * HEX_R, 0.216 * HEX_R)); }
function getKNGirth():   THREE.CylinderGeometry { return (gKNGirth ||= new THREE.CylinderGeometry(0.114 * HEX_R, 0.114 * HEX_R, 0.022 * HEX_R, 7, 1, true)); }
function getKNBreast():  THREE.BoxGeometry { return (gKNBreast ||= new THREE.BoxGeometry(0.136 * HEX_R, 0.018 * HEX_R, 0.020 * HEX_R)); }
function getKNNoseBand(): THREE.BoxGeometry { return (gKNNoseBand ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.012 * HEX_R, 0.036 * HEX_R)); }
function getKNBrowBand(): THREE.BoxGeometry { return (gKNBrowBand ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.011 * HEX_R, 0.018 * HEX_R)); }
function getKNBit():     THREE.BoxGeometry { return (gKNBit ||= new THREE.BoxGeometry(0.052 * HEX_R, 0.009 * HEX_R, 0.009 * HEX_R)); }
function getKNBitRing(): THREE.TorusGeometry { return (gKNBitRing ||= new THREE.TorusGeometry(0.014 * HEX_R, 0.004 * HEX_R, 4, 8)); }
function getKNTorso():   THREE.BoxGeometry { return (gKNTorso ||= new THREE.BoxGeometry(KN_TORSO_W * HEX_R, KN_TORSO_H * HEX_R, KN_TORSO_D * HEX_R)); }
function getKNChestR():  THREE.BoxGeometry { return (gKNChestR ||= new THREE.BoxGeometry(KN_TORSO_W * 1.05 * HEX_R, 0.064 * HEX_R, KN_TORSO_D * 1.06 * HEX_R)); }
function getKNNeckR():   THREE.BoxGeometry { return (gKNNeckR ||= new THREE.BoxGeometry(0.040 * HEX_R, KN_NECK_H * 1.6 * HEX_R, 0.040 * HEX_R)); }
function getKNHead():    THREE.BoxGeometry { return (gKNHead ||= new THREE.BoxGeometry(KN_HEAD_S * HEX_R, KN_HEAD_S * HEX_R, KN_HEAD_S * HEX_R)); }
function getKNJaw():     THREE.BoxGeometry { return (gKNJaw ||= new THREE.BoxGeometry(0.068 * HEX_R, 0.027 * HEX_R, 0.031 * HEX_R)); }
function getKNNose():    THREE.BoxGeometry { return (gKNNose ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.020 * HEX_R, 0.013 * HEX_R)); }
function getKNBrow():    THREE.BoxGeometry { return (gKNBrow ||= new THREE.BoxGeometry(0.080 * HEX_R, 0.010 * HEX_R, 0.012 * HEX_R)); }
function getKNEarR():    THREE.BoxGeometry { return (gKNEarR ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.026 * HEX_R, 0.017 * HEX_R)); }
function getKNEyeR():    THREE.BoxGeometry { return (gKNEyeR ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.009 * HEX_R, 0.007 * HEX_R)); }
function getKNUpArm():   THREE.BoxGeometry { return (gKNUpArm ||= new THREE.BoxGeometry(0.042 * HEX_R, KN_UPARM_L * HEX_R, 0.042 * HEX_R)); }
function getKNForearm(): THREE.BoxGeometry { return (gKNForearm ||= new THREE.BoxGeometry(0.032 * HEX_R, KN_FOREARM_L * HEX_R, 0.032 * HEX_R)); }
function getKNFist():    THREE.BoxGeometry { return (gKNFist ||= new THREE.BoxGeometry(0.037 * HEX_R, 0.037 * HEX_R, 0.039 * HEX_R)); }
function getKNThigh():   THREE.BoxGeometry { return (gKNThigh ||= new THREE.BoxGeometry(0.044 * HEX_R, KN_THIGH_L * HEX_R, 0.050 * HEX_R)); }
function getKNShin():    THREE.BoxGeometry { return (gKNShin ||= new THREE.BoxGeometry(0.031 * HEX_R, KN_SHIN_L * HEX_R, 0.035 * HEX_R)); }
function getKNSole():    THREE.BoxGeometry { return (gKNSole ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.012 * HEX_R, 0.066 * HEX_R)); }
function getKNToes():    THREE.BoxGeometry { return (gKNToes ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.012 * HEX_R, 0.017 * HEX_R)); }
function getKNAnkStrap(): THREE.BoxGeometry { return (gKNAnkStrap ||= new THREE.BoxGeometry(0.039 * HEX_R, 0.009 * HEX_R, 0.012 * HEX_R)); }
function getKNTunicHem(): THREE.BoxGeometry { return (gKNTunicHem ||= new THREE.BoxGeometry(0.188 * HEX_R, 0.044 * HEX_R, 0.100 * HEX_R)); }
function getKNFold():    THREE.BoxGeometry { return (gKNFold ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.038 * HEX_R, 0.009 * HEX_R)); }
function getKNBelt():    THREE.BoxGeometry { return (gKNBelt ||= new THREE.BoxGeometry(0.147 * HEX_R, 0.021 * HEX_R, 0.091 * HEX_R)); }
function getKNBuckle():  THREE.BoxGeometry { return (gKNBuckle ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.019 * HEX_R, 0.012 * HEX_R)); }
function getKNSheath():  THREE.BoxGeometry { return (gKNSheath ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.054 * HEX_R, 0.012 * HEX_R)); }
function getKNHilt():    THREE.BoxGeometry { return (gKNHilt ||= new THREE.BoxGeometry(0.019 * HEX_R, 0.019 * HEX_R, 0.012 * HEX_R)); }
const KN_CAP_R = 0.068;
function getKNCapDome(): THREE.SphereGeometry { return (gKNCapDome ||= new THREE.SphereGeometry(KN_CAP_R * HEX_R, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)); }
// Rant czapki MUSI być szerszy niż połowa PRZEKĄTNEJ głowy-sześcianu
// (0.100·√2/2 = 0.0707), inaczej rogi głowy sterczą spod nakrycia i przy
// kącie 52° czapka czyta się jako „otwarty garnek" (ten sam błąd naprawiany
// w braz-wlocznik-opus5.ts przy hełmie).
function getKNCapBand(): THREE.CylinderGeometry { return (gKNCapBand ||= new THREE.CylinderGeometry(0.075 * HEX_R, 0.078 * HEX_R, 0.017 * HEX_R, 10, 1)); }
function getKNNape():    THREE.BoxGeometry { return (gKNNape ||= new THREE.BoxGeometry(0.076 * HEX_R, 0.036 * HEX_R, 0.015 * HEX_R)); }
function getKNShaft():   THREE.CylinderGeometry { return (gKNShaft ||= new THREE.CylinderGeometry(0.010 * HEX_R, 0.012 * HEX_R, 0.440 * HEX_R, 7, 1)); }
function getKNSocket():  THREE.CylinderGeometry { return (gKNSocket ||= new THREE.CylinderGeometry(0.014 * HEX_R, 0.017 * HEX_R, 0.034 * HEX_R, 7, 1)); }
function getKNBind():    THREE.BoxGeometry { return (gKNBind ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.014 * HEX_R, 0.017 * HEX_R)); }
function getKNGrip():    THREE.BoxGeometry { return (gKNGrip ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.044 * HEX_R, 0.015 * HEX_R)); }
function getKNButt():    THREE.ConeGeometry { return (gKNButt ||= new THREE.ConeGeometry(0.012 * HEX_R, 0.038 * HEX_R, 5)); }
function getKNUnit():    THREE.BoxGeometry { return (gKNUnit ||= new THREE.BoxGeometry(1, 1, 1)); }

// ---------------------------------------------------------------------------
// Grot LIŚCIASTY (taper) — ten sam PROFIL co grot włóczni piechura
// (braz-wlocznik-opus5.ts / kamien-bazowe-opus5.ts): to fizycznie ten sam typ
// brązowego grota w tulejce, tylko krótszy (broń jednoręczna jeźdźca).
// Zakotwiczony w y = 0 (podstawa/trzpień), rośnie ku +Y.
// ---------------------------------------------------------------------------
function knMakeLeafHeadGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  const sections: [number, number, number][] = ([
    [0.00, 0.34, 0.60], [0.14, 0.82, 1.00], [0.40, 1.00, 0.90],
    [0.74, 0.62, 0.56], [1.00, 0.04, 0.12],
  ] as [number, number, number][]).map(([y, w, t]) => [y * len, w * wMax * 0.5, t * tMax * 0.5]);
  const pos: number[] = [];
  const P = (x: number, y: number, z: number) => { pos.push(x, y, z); };
  const quad = (
    a: [number, number, number], b: [number, number, number],
    c: [number, number, number], d: [number, number, number],
  ) => { P(...a); P(...b); P(...c); P(...a); P(...c); P(...d); };
  for (let i = 0; i < sections.length - 1; i++) {
    const s0 = sections[i]!, s1 = sections[i + 1]!;
    const [y0, w0, t0] = s0, [y1, w1, t1] = s1;
    quad([-w0, y0, t0], [w0, y0, t0], [w1, y1, t1], [-w1, y1, t1]);
    quad([w0, y0, -t0], [-w0, y0, -t0], [-w1, y1, -t1], [w1, y1, -t1]);
    quad([w0, y0, t0], [w0, y0, -t0], [w1, y1, -t1], [w1, y1, t1]);
    quad([-w0, y0, -t0], [-w0, y0, t0], [-w1, y1, t1], [-w1, y1, -t1]);
  }
  const b = sections[0]!;
  quad([-b[1], b[0], -b[2]], [b[1], b[0], -b[2]], [b[1], b[0], b[2]], [-b[1], b[0], b[2]]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}
function getKNSpearHd(): THREE.BufferGeometry {
  return (gKNSpearHd ||= knMakeLeafHeadGeo(0.088 * HEX_R, 0.033 * HEX_R, 0.013 * HEX_R));
}

// ===========================================================================
// KINEMATYKA — konwencja serii, ale PRZÓD = +Z (koń idzie ku kamerze).
//   theta liczone od pionu; +theta = ku PRZODOWI (+Z).
//   „w dół":  dir = (0, -cos θ, +sin θ)   → kończyny
//   „w górę": dir = (0, +cos φ, +sin φ)   → szyja konia, ogon
// ===========================================================================
const KN_UP = new THREE.Vector3(0, 1, 0);

function knDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function knUpDir(phi: number): THREE.Vector3 {
  return new THREE.Vector3(0, Math.cos(phi), Math.sin(phi));
}

/** Segment „w dół" od punktu P; zwraca koniec segmentu. */
function knSegDown(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number,
): THREE.Vector3 {
  const dir = knDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Segment „w górę" od punktu P (szyja/ogon); zwraca koniec segmentu. */
function knSegUp(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, phi: number, len: number, spin = 0,
): THREE.Vector3 {
  const dir = knUpDir(phi);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = phi;
  if (spin !== 0) mesh.rotation.y = spin;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

/** Mesh o stałej geometrii w punkcie P, z osią +Y ustawioną wzdłuż D. */
function knAlong(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, D: THREE.Vector3,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(KN_UP, D.clone().normalize());
  mesh.position.copy(P);
  parent.add(mesh);
  return mesh;
}

/**
 * Pas / rzemień OD PUNKTU A DO PUNKTU B (wodze, pas policzkowy, pośliśnik).
 * Używa WSPÓLNEGO pudełka 1×1×1 przeskalowanego przez mesh.scale — geometria
 * pozostaje singletonem modułu, zero alokacji per token.
 */
function knStrap(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, t: number,
): THREE.Mesh {
  const d = B.clone().sub(A);
  const len = d.length();
  const mesh = new THREE.Mesh(getKNUnit(), mtl);
  mesh.scale.set(w, Math.max(len, 1e-5), t);
  if (len > 1e-6) {
    if (d.y / len < -0.9999) mesh.rotation.x = Math.PI;
    else mesh.quaternion.setFromUnitVectors(KN_UP, d.clone().normalize());
  }
  mesh.position.copy(A).addScaledVector(d, 0.5);
  parent.add(mesh);
  return mesh;
}

/**
 * Noga konia: ramię/udo → nadpęcie → pęcina → kopyto, licząc łańcuchowo w dół.
 * Kąty dobrane tak, żeby kopyta nóg podporowych siadały na y = 0.
 */
// Długości segmentów nogi konia. Wysokości stawów (KN_LEG_TOP_F/R) są
// DOBRANE POD TE DŁUGOŚCI I KĄTY NÓG PODPOROWYCH tak, żeby spód kopyta
// wypadał dokładnie na y = 0 (kontrola: minY w measureAll() harnessu).
const KN_LEG_UP_F = 0.118;
const KN_LEG_LO_F = 0.118;
const KN_LEG_UP_R = 0.124;
const KN_LEG_LO_R = 0.118;
const KN_LEG_JOINT_OVERLAP = 0.008;   // zakładka w stawie (podnosi drugi segment)
const KN_HOOF_H = 0.032;

function knHorseLeg(
  parent: THREE.Object3D, mCoat: THREE.MeshStandardMaterial,
  mDark: THREE.MeshStandardMaterial, mHoof: THREE.MeshStandardMaterial,
  sx: number, zPiv: number, yPiv: number, thU: number, thL: number, rear: boolean,
): void {
  const Lu = (rear ? KN_LEG_UP_R : KN_LEG_UP_F) * HEX_R;
  const Ll = (rear ? KN_LEG_LO_R : KN_LEG_LO_F) * HEX_R;
  let P = new THREE.Vector3(sx * HEX_R, yPiv * HEX_R, zPiv * HEX_R);
  P = knSegDown(parent, rear ? getKNUpRear() : getKNUpFrnt(), mCoat, P, thU, Lu);
  P.y += KN_LEG_JOINT_OVERLAP * HEX_R;
  P = knSegDown(parent, getKNLower(), mCoat, P, thL, Ll);
  // PĘCINA — ciemna („punkty" maści pierwotnej, pkt K7)
  const past = new THREE.Mesh(getKNPastern(), mDark);
  past.position.copy(P.clone().addScaledVector(knDown(thL), 0.004 * HEX_R));
  parent.add(past);
  // kopyto: środek pół wysokości nad końcem łańcucha ⇒ spód kopyta = P.y - KN_HOOF_H
  const hoof = new THREE.Mesh(getKNHoof(), mHoof);
  hoof.position.set(P.x, P.y - KN_HOOF_H * 0.5 * HEX_R, P.z + 0.004 * HEX_R);
  parent.add(hoof);
}

// ===========================================================================
// KONNICA BRĄZ — OPUS 5
// ===========================================================================
export function buildKonnicaBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();

  // Pivot 3/4 — patrz nagłówek. Cała bryła wisi na nim, żeby zewnętrzne
  // ustawianie group.rotation.y (renderer) nie skasowało ustawienia modelu.
  const root = new THREE.Group();
  root.rotation.y = KN_YAW;
  group.add(root);

  const mCoat     = mat(KN_COAT,       0.04, 0.86);
  const mCoatDk   = mat(KN_COAT_DK,    0.04, 0.88);
  const mMane     = mat(KN_MANE,       0.04, 0.90);
  const mHoof     = mat(KN_HOOF,       0.08, 0.72);
  const mSkin     = mat(KN_SKIN,       0.05, 0.80);
  const mSkinDk   = mat(KN_SKIN_DK,    0.05, 0.82);
  const mWool     = mat(KN_WOOL,       0.03, 0.88);
  const mWoolDk   = mat(KN_WOOL_DK,    0.03, 0.90);
  const mLeather  = mat(KN_LEATHER,    0.05, 0.85);
  const mLeathDk  = mat(KN_LEATHER_DK, 0.05, 0.88);
  const mFelt     = mat(KN_FELT,       0.04, 0.88);
  const mWood     = mat(KN_WOOD,       0.05, 0.84);
  const mBronze   = mat(KN_BRONZE,     0.50, 0.42);
  const mBronzeLt = mat(KN_BRONZE_LT,  0.55, 0.36);
  const mHair     = mat(KN_HAIR,       0.04, 0.90);
  const mEye      = mat(KN_EYE,        0.05, 0.86);
  const mOwner    = mat(ownerColor_,   0.10, 0.70);

  // ═══════════════════════════════════════════════════════════════════════
  // KOŃ — mały, krępy koń epoki Brązu (kłąb 0.42×HEX_R ≈ 1,35 m); przód +Z
  // ═══════════════════════════════════════════════════════════════════════
  const barrel = new THREE.Mesh(getKNBarrel(), mCoat);
  barrel.rotation.x = Math.PI / 2;        // oś walca wzdłuż Z, szerszy koniec ku piersi
  barrel.rotation.y = Math.PI / 7;        // krawędź 7-kąta ku górze → płaski grzbiet
  barrel.scale.set(0.72, 1, 1.0);         // wąska, ale GŁĘBOKA klatka (typ pierwotny)
  barrel.position.set(0, KN_BODY_CTR * HEX_R, 0.004 * HEX_R);
  root.add(barrel);

  const chest = new THREE.Mesh(getKNChest(), mCoat);
  chest.scale.set(0.80, 1.00, 0.95);
  chest.position.set(0, (KN_BODY_CTR + 0.006) * HEX_R, 0.140 * HEX_R);
  root.add(chest);

  const rump = new THREE.Mesh(getKNRump(), mCoat);
  rump.scale.set(0.88, 1.00, 1.10);
  rump.position.set(0, (KN_BODY_CTR - 0.002) * HEX_R, -0.144 * HEX_R);
  root.add(rump);

  const withers = new THREE.Mesh(getKNWithers(), mCoat);
  withers.rotation.x = 0.20;
  withers.position.set(0, 0.408 * HEX_R, 0.104 * HEX_R);
  root.add(withers);

  // PRĘGA GRZBIETOWA (odmiana pierwotna, pkt K7) — widoczna na zadzie, za
  // czaprakiem; przednia część grzbietu jest przykryta derką.
  const stripe = new THREE.Mesh(getKNStripe(), mCoatDk);
  stripe.position.set(0, 0.436 * HEX_R, -0.140 * HEX_R);
  root.add(stripe);

  // ── SZYJA: 3 segmenty, gruba i tylko lekko wygięta (typ kucowy) ─────────
  const neckPhi  = [0.92, 0.66, 0.42];
  const neckLen  = [0.082 * HEX_R, 0.072 * HEX_R, 0.058 * HEX_R];
  const neckGeo  = [getKNNeck1(), getKNNeck2(), getKNNeck3()];
  let NP = new THREE.Vector3(0, 0.386 * HEX_R, 0.136 * HEX_R);
  const neckPts: THREE.Vector3[] = [NP.clone()];
  for (let i = 0; i < 3; i++) {
    NP = knSegUp(root, neckGeo[i]!, mCoat, NP, neckPhi[i]!, neckLen[i]!, Math.PI / 6);
    neckPts.push(NP.clone());
  }

  // ── ŁEB: czaszka + pysk + nozdrza + oczy + uszy ─────────────────────────
  const headP = new THREE.Vector3(0, NP.y + 0.013 * HEX_R, NP.z + 0.021 * HEX_R);
  const skull = new THREE.Mesh(getKNSkull(), mCoat);
  skull.rotation.x = 0.22;                // nos lekko w dół
  skull.position.copy(headP);
  root.add(skull);

  const muzDir = new THREE.Vector3(0, -0.31, 0.951);
  const muzBase = headP.clone().add(new THREE.Vector3(0, -0.018 * HEX_R, 0.030 * HEX_R));
  const muzzle = knAlong(root, getKNMuzzle(), mCoat, muzBase.clone().addScaledVector(muzDir, 0.041 * HEX_R), muzDir);
  muzzle.rotation.y = Math.PI / 4;
  const muzEnd = muzBase.clone().addScaledVector(muzDir, 0.082 * HEX_R);
  for (const s of [-1, 1] as const) {
    const nos = new THREE.Mesh(getKNNostril(), mCoatDk);
    nos.position.set(s * 0.013 * HEX_R, muzEnd.y + 0.009 * HEX_R, muzEnd.z - 0.008 * HEX_R);
    root.add(nos);
    const eye = new THREE.Mesh(getKNEye(), mEye);
    eye.position.set(s * 0.034 * HEX_R, headP.y + 0.018 * HEX_R, headP.z + 0.014 * HEX_R);
    root.add(eye);
    const ear = new THREE.Mesh(getKNEar(), mCoat);
    ear.position.set(s * 0.021 * HEX_R, headP.y + 0.054 * HEX_R, headP.z - 0.012 * HEX_R);
    ear.rotation.z = -s * 0.28;
    ear.rotation.x = 0.16;
    root.add(ear);
  }

  // ── GRZYWA STOJĄCA („szczotka", pkt K7) + grzywka ───────────────────────
  // Kępki ustawione PROSTOPADLE do grzbietowej krawędzi szyi — sterczą w górę,
  // nie opadają na bok. To odmiana pierwotna / grzywa strzyżona, nie „koński
  // ogon" na szyi znany z późniejszych, udomowionych ras.
  const maneRad = [0.056 * HEX_R, 0.047 * HEX_R, 0.040 * HEX_R];
  for (let i = 0; i < 3; i++) {
    const phi = neckPhi[i]!;
    const crest = new THREE.Vector3(0, Math.sin(phi), -Math.cos(phi));  // strona grzbietowa szyi
    const mid = neckPts[i]!.clone().add(neckPts[i + 1]!).multiplyScalar(0.5);
    for (const f of [-0.28, 0.28] as const) {
      const along = knUpDir(phi).multiplyScalar(neckLen[i]! * f);
      const tuft = new THREE.Mesh(getKNManeTuft(), mMane);
      tuft.rotation.x = phi;
      tuft.position.copy(mid.clone().add(along).addScaledVector(crest, maneRad[i]!));
      root.add(tuft);
    }
  }
  const forelock = new THREE.Mesh(getKNForelock(), mMane);
  forelock.rotation.x = 0.62;
  forelock.position.set(0, headP.y + 0.040 * HEX_R, headP.z + 0.028 * HEX_R);
  root.add(forelock);

  // ── NOGI: 3 podporowe (spód kopyta dokładnie na y = 0) + lewa przednia
  //    uniesiona w kroku (jedyna, która nie dotyka ziemi — to zamierzone).
  const LX = 0.058;
  knHorseLeg(root, mCoat, mCoatDk, mHoof,  LX,  0.122, KN_LEG_TOP_F,  0.08, -0.05, false);
  knHorseLeg(root, mCoat, mCoatDk, mHoof, -LX,  0.126, KN_LEG_TOP_F,  0.42,  0.30, false);  // w kroku
  knHorseLeg(root, mCoat, mCoatDk, mHoof, -LX, -0.130, KN_LEG_TOP_R, -0.26,  0.14, true);
  knHorseLeg(root, mCoat, mCoatDk, mHoof,  LX, -0.134, KN_LEG_TOP_R, -0.28,  0.16, true);

  // ── OGON: nasada w górę-tył, potem swobodny spływ ───────────────────────
  let TP = new THREE.Vector3(0, 0.392 * HEX_R, -0.196 * HEX_R);
  TP = knSegUp(root, getKNTail1(), mMane, TP, -1.20, 0.052 * HEX_R);
  knSegUp(root, getKNTail2(), mMane, TP, -2.98, 0.124 * HEX_R);

  // ═══════════════════════════════════════════════════════════════════════
  // OPORZĄDZENIE — CZAPRAK BEZ ŁĘKÓW + poprąg + napierśnik + pośliśnik
  // (pkt K2) — NIGDZIE strzemienia ani puśliska.
  // ═══════════════════════════════════════════════════════════════════════
  const padTop = new THREE.Mesh(getKNPadTop(), mOwner);        // KOLOR GRACZA
  padTop.position.set(0, 0.436 * HEX_R, (KN_SEAT_Z - 0.018) * HEX_R);
  root.add(padTop);
  for (const s of [-1, 1] as const) {
    const flap = new THREE.Mesh(getKNPadFlap(), mOwner);       // KOLOR GRACZA
    flap.rotation.z = -s * 0.10;
    flap.position.set(s * 0.081 * HEX_R, 0.378 * HEX_R, (KN_SEAT_Z - 0.012) * HEX_R);
    root.add(flap);
    const padHem = new THREE.Mesh(getKNPadHem(), mLeathDk);     // kant skórzany
    padHem.position.set(s * 0.086 * HEX_R, 0.328 * HEX_R, (KN_SEAT_Z - 0.012) * HEX_R);
    root.add(padHem);
  }
  // POPRĄG (pod brzuchem — jedyne, co trzyma miękką derkę)
  const girth = new THREE.Mesh(getKNGirth(), mLeather);
  girth.rotation.x = Math.PI / 2;
  girth.rotation.y = Math.PI / 7;
  girth.scale.set(0.72, 1, 1);
  girth.position.set(0, KN_BODY_CTR * HEX_R, (KN_SEAT_Z + 0.006) * HEX_R);
  root.add(girth);
  // NAPIERŚNIK — nie pozwala derce zsunąć się do tyłu
  const breast = new THREE.Mesh(getKNBreast(), mLeather);
  breast.position.set(0, 0.358 * HEX_R, 0.208 * HEX_R);
  root.add(breast);
  // POŚLIŚNIK (crupper) — pas od tyłu derki do nasady ogona: nie pozwala
  // derce zsunąć się do przodu. Komplet pas-poprąg-napierśnik-pośliśnik to
  // podpis oporządzenia BEZ sztywnego drzewa siodła.
  for (const s of [-1, 1] as const) {
    knStrap(
      root, mLeather,
      new THREE.Vector3(s * 0.050 * HEX_R, 0.432 * HEX_R, -0.092 * HEX_R),
      new THREE.Vector3(s * 0.020 * HEX_R, 0.394 * HEX_R, -0.190 * HEX_R),
      0.011 * HEX_R, 0.011 * HEX_R,
    );
  }

  // ── UZDA + BRĄZOWE WĘDZIDŁO (pkt K3) ────────────────────────────────────
  const noseBand = new THREE.Mesh(getKNNoseBand(), mLeather);
  noseBand.rotation.x = -0.31;
  noseBand.position.set(0, muzEnd.y + 0.022 * HEX_R, muzEnd.z - 0.030 * HEX_R);
  root.add(noseBand);
  const browBand = new THREE.Mesh(getKNBrowBand(), mLeather);
  browBand.position.set(0, headP.y + 0.032 * HEX_R, headP.z + 0.028 * HEX_R);
  root.add(browBand);
  // Wędzidło leży w KĄCIE PYSKA (cofnięte od nozdrzy), nie na czubku nosa.
  const bitY = muzEnd.y + 0.011 * HEX_R;
  const bitZ = muzEnd.z - 0.030 * HEX_R;
  const bit = new THREE.Mesh(getKNBit(), mBronze);
  bit.position.set(0, bitY, bitZ);
  root.add(bit);
  for (const s of [-1, 1] as const) {
    const ring = new THREE.Mesh(getKNBitRing(), mBronzeLt);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * 0.026 * HEX_R, bitY, bitZ);
    root.add(ring);
    // pas policzkowy: od pierścienia wędzidła do nagłówka za uchem
    knStrap(
      root, mLeather,
      new THREE.Vector3(s * 0.026 * HEX_R, bitY, bitZ),
      new THREE.Vector3(s * 0.030 * HEX_R, headP.y + 0.034 * HEX_R, headP.z - 0.004 * HEX_R),
      0.010 * HEX_R, 0.010 * HEX_R,
    );
  }

  // ═══════════════════════════════════════════════════════════════════════
  // JEŹDZIEC — dosiad na grzbiecie, NOGI ZWISAJĄ SWOBODNIE (brak strzemion)
  // ═══════════════════════════════════════════════════════════════════════
  const SZ = KN_SEAT_Z;

  const torso = new THREE.Mesh(getKNTorso(), mWool);
  torso.rotation.x = -0.06;                       // minimalne pochylenie do przodu
  torso.position.set(0, (KN_BACK_Y + KN_TORSO_H * 0.5) * HEX_R, SZ * HEX_R);
  root.add(torso);
  const chestR = new THREE.Mesh(getKNChestR(), mWool);
  chestR.position.set(0, (KN_TORSO_TOP - 0.028) * HEX_R, SZ * HEX_R);
  root.add(chestR);

  // rąbek tuniki (krótka, do połowy uda — pkt K8) + fałdy
  const tunicHem = new THREE.Mesh(getKNTunicHem(), mWool);
  tunicHem.position.set(0, (KN_BACK_Y + 0.024) * HEX_R, (SZ + 0.005) * HEX_R);
  root.add(tunicHem);
  for (const s of [-1, 0, 1] as const) {
    const fold = new THREE.Mesh(getKNFold(), mWoolDk);
    fold.position.set(s * 0.042 * HEX_R, (KN_BACK_Y + 0.020) * HEX_R, (SZ + KN_TORSO_D * 0.5 + 0.010) * HEX_R);
    root.add(fold);
  }
  const belt = new THREE.Mesh(getKNBelt(), mLeather);
  belt.position.set(0, (KN_BACK_Y + 0.052) * HEX_R, SZ * HEX_R);
  root.add(belt);
  const buckle = new THREE.Mesh(getKNBuckle(), mBronzeLt);
  buckle.position.set(0, (KN_BACK_Y + 0.052) * HEX_R, (SZ + KN_TORSO_D * 0.5 + 0.009) * HEX_R);
  root.add(buckle);

  // SZTYLET BRĄZOWY w pochwie przy lewym biodrze (broń zapasowa, pkt K4)
  const sheath = new THREE.Mesh(getKNSheath(), mLeather);
  sheath.rotation.z = -0.12;
  sheath.position.set(0.079 * HEX_R, (KN_BACK_Y + 0.024) * HEX_R, (SZ + 0.012) * HEX_R);
  root.add(sheath);
  const hilt = new THREE.Mesh(getKNHilt(), mBronzeLt);
  hilt.rotation.z = -0.12;
  hilt.position.set(0.083 * HEX_R, (KN_BACK_Y + 0.060) * HEX_R, (SZ + 0.012) * HEX_R);
  root.add(hilt);

  // ── głowa jeźdźca ───────────────────────────────────────────────────────
  const neckR = new THREE.Mesh(getKNNeckR(), mSkin);
  neckR.position.set(0, (KN_TORSO_TOP + KN_NECK_H * 0.5) * HEX_R, SZ * HEX_R);
  root.add(neckR);
  const head = new THREE.Mesh(getKNHead(), mSkin);
  head.position.set(0, KN_HEAD_CTR * HEX_R, SZ * HEX_R);
  root.add(head);
  const jaw = new THREE.Mesh(getKNJaw(), mSkinDk);
  jaw.position.set(0, (KN_HEAD_CTR - KN_HEAD_S * 0.38) * HEX_R, (SZ + 0.010) * HEX_R);
  root.add(jaw);
  const nose = new THREE.Mesh(getKNNose(), mSkin);
  nose.position.set(0, (KN_HEAD_CTR - 0.004) * HEX_R, (SZ + KN_HEAD_S * 0.5 + 0.006) * HEX_R);
  root.add(nose);
  const brow = new THREE.Mesh(getKNBrow(), mSkinDk);
  brow.rotation.x = 0.12;
  brow.position.set(0, (KN_HEAD_CTR + 0.026) * HEX_R, (SZ + KN_HEAD_S * 0.5 + 0.003) * HEX_R);
  root.add(brow);
  for (const s of [-1, 1] as const) {
    const eye = new THREE.Mesh(getKNEyeR(), mEye);
    eye.position.set(s * 0.021 * HEX_R, (KN_HEAD_CTR + 0.010) * HEX_R, (SZ + KN_HEAD_S * 0.5 + 0.002) * HEX_R);
    root.add(eye);
    const ear = new THREE.Mesh(getKNEarR(), mSkinDk);
    ear.position.set(s * (KN_HEAD_S * 0.5 + 0.004) * HEX_R, (KN_HEAD_CTR - 0.006) * HEX_R, SZ * HEX_R);
    root.add(ear);
  }
  // MIĘKKA CZAPKA SKÓRZANA + opaska w KOLORZE GRACZA (pkt K8) — świadomie
  // NIE brązowy hełm kopulasty Włócznika (jeździec bez strzemion balansuje
  // ciałem, więc nie obciąża głowy metalem).
  // Kopuła = PEŁNA PÓŁKULA w JASNYM filcu — ciemna, mała czapka pod kątem
  // 52° czytała się jako czarna dziura w czubku głowy (ten sam objaw
  // „otwartego garnka" co przy hełmie Włócznika).
  const capY = (KN_HEAD_CTR + 0.014) * HEX_R;
  const capDome = new THREE.Mesh(getKNCapDome(), mFelt);
  capDome.position.set(0, capY, SZ * HEX_R);
  root.add(capDome);
  const capBand = new THREE.Mesh(getKNCapBand(), mOwner);     // KOLOR GRACZA
  capBand.position.set(0, (KN_HEAD_CTR + 0.016) * HEX_R, SZ * HEX_R);
  root.add(capBand);
  const nape = new THREE.Mesh(getKNNape(), mHair);
  nape.position.set(0, (KN_HEAD_CTR + 0.004) * HEX_R, (SZ - KN_HEAD_S * 0.5 - 0.006) * HEX_R);
  root.add(nape);

  // ── NOGI JEŹDŹCA: zwisają swobodnie, stopa NIŻEJ niż brzuch konia ───────
  // Brak strzemion (pkt K1): udo leży skośnie na boku konia, łydka opada
  // niemal pionowo, kostka wypada na y ≈ 0.201×HEX_R — czyli PONIŻEJ linii
  // brzucha (KN_BELLY_Y = 0.224). Ten jeden pomiar jest wizualnym dowodem
  // i na mały wzrost konia (K6), i na brak punktu oparcia stopy (K1).
  for (const s of [-1, 1] as const) {
    let P = new THREE.Vector3(s * KN_HIP_X * HEX_R, KN_BACK_Y * HEX_R, SZ * HEX_R);
    P = knSegDown(root, getKNThigh(), mSkin, P, 0.45, KN_THIGH_L * HEX_R);
    P.x += s * 0.006 * HEX_R;
    P.y += 0.008 * HEX_R;
    P = knSegDown(root, getKNShin(), mSkin, P, 0.05, KN_SHIN_L * HEX_R);
    // SANDAŁ (podeszwa + palce + rzemień na kostce) — stopa zwisa swobodnie
    const sole = new THREE.Mesh(getKNSole(), mLeather);
    sole.position.set(P.x, P.y - 0.006 * HEX_R, P.z + 0.012 * HEX_R);
    root.add(sole);
    const toes = new THREE.Mesh(getKNToes(), mSkin);
    toes.position.set(P.x, P.y - 0.004 * HEX_R, P.z + 0.044 * HEX_R);
    root.add(toes);
    const ank = new THREE.Mesh(getKNAnkStrap(), mLeather);
    ank.position.set(P.x, P.y + 0.018 * HEX_R, P.z + 0.002 * HEX_R);
    root.add(ank);
  }

  // ── LEWE (+X) RAMIĘ: WODZE ──────────────────────────────────────────────
  let LA = new THREE.Vector3(KN_SHLD_X * HEX_R, KN_SHLD_Y * HEX_R, SZ * HEX_R);
  LA = knSegDown(root, getKNUpArm(), mSkin, LA, 0.55, KN_UPARM_L * HEX_R);
  LA.y += 0.007 * HEX_R;
  const wristL = knSegDown(root, getKNForearm(), mSkin, LA, 1.15, KN_FOREARM_L * HEX_R);
  const fistL = new THREE.Mesh(getKNFist(), mSkin);
  fistL.rotation.x = Math.PI - 1.15;
  fistL.position.copy(wristL.clone().addScaledVector(knDown(1.15), 0.010 * HEX_R));
  root.add(fistL);
  // WODZE: od obu pierścieni wędzidła do dłoni (pkt K3). Dwa osobne rzemienie,
  // policzone z realnych punktów — nie „lewitujące" paski.
  for (const s of [-1, 1] as const) {
    knStrap(
      root, mLeathDk,
      new THREE.Vector3(s * 0.026 * HEX_R, bitY, bitZ),
      new THREE.Vector3(wristL.x - s * 0.005 * HEX_R, wristL.y + 0.006 * HEX_R, wristL.z),
      0.007 * HEX_R, 0.007 * HEX_R,
    );
  }

  // ── PRAWE (-X) RAMIĘ: KRÓTKA WŁÓCZNIA PIONOWO PRZY BOKU ─────────────────
  // Broń trzymana „na spoczynek", drzewce prawie pionowe (odchylone o 0,16 rad
  // ku przodowi). Pionowa oś = footprint broni w rzucie z góry to praktycznie
  // sama grubość drzewca — cały żeton mieści się w obrysie heksu.
  let RA = new THREE.Vector3(-KN_SHLD_X * HEX_R, KN_SHLD_Y * HEX_R, SZ * HEX_R);
  RA = knSegDown(root, getKNUpArm(), mSkin, RA, 0.22, KN_UPARM_L * HEX_R);
  RA.y += 0.007 * HEX_R;
  const wristR = knSegDown(root, getKNForearm(), mSkin, RA, 0.75, KN_FOREARM_L * HEX_R);
  const fistR = new THREE.Mesh(getKNFist(), mSkin);
  fistR.rotation.x = Math.PI - 0.75;
  fistR.position.copy(wristR.clone().addScaledVector(knDown(0.75), 0.010 * HEX_R));
  root.add(fistR);

  const SPEAR_TILT = 0.16;
  const dSpear = knUpDir(SPEAR_TILT);                          // oś drzewca
  const grip = new THREE.Vector3(
    wristR.x - 0.018 * HEX_R,
    wristR.y + 0.002 * HEX_R,
    wristR.z + 0.010 * HEX_R,
  );
  const atS = (t: number): THREE.Vector3 => grip.clone().addScaledVector(dSpear, t * HEX_R);

  // Drzewce 0.440 (≈1,35 m) + grot 0.088 ⇒ włócznia ok. 1,62 m: broń
  // JEDNORĘCZNA jeźdźca, wyraźnie krótsza niż 2-metrowa włócznia piechura.
  knAlong(root, getKNShaft(), mWood, atS(0), dSpear);           // drzewce: -0.220..+0.220
  knAlong(root, getKNGrip(), mLeathDk, atS(0), dSpear);         // owinięcie w dłoni
  knAlong(root, getKNSocket(), mBronze, atS(0.236), dSpear);    // TULEJKA (osadzenie grota)
  knAlong(root, getKNBind(), mLeathDk, atS(0.222), dSpear);     // owinięcie rzemienne 1
  knAlong(root, getKNBind(), mLeathDk, atS(0.250), dSpear);     // owinięcie rzemienne 2
  // grot zakotwiczony w y=0 swojej geometrii → position = PODSTAWA grota
  knAlong(root, getKNSpearHd(), mBronzeLt, atS(0.246), dSpear);
  const buttMesh = knAlong(root, getKNButt(), mBronze, atS(-0.216), dSpear);
  buttMesh.rotateX(Math.PI);                                   // apeks stożka w dół

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazKonnicaOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gKNBarrel, gKNChest, gKNRump, gKNWithers, gKNStripe,
    gKNNeck1, gKNNeck2, gKNNeck3, gKNSkull, gKNMuzzle, gKNNostril, gKNEar, gKNEye,
    gKNManeTuft, gKNForelock,
    gKNUpFrnt, gKNUpRear, gKNLower, gKNPastern, gKNHoof,
    gKNTail1, gKNTail2,
    gKNPadTop, gKNPadFlap, gKNPadHem, gKNGirth, gKNBreast,
    gKNNoseBand, gKNBrowBand, gKNBit, gKNBitRing,
    gKNTorso, gKNChestR, gKNNeckR, gKNHead, gKNJaw, gKNNose, gKNBrow, gKNEarR, gKNEyeR,
    gKNUpArm, gKNForearm, gKNFist, gKNThigh, gKNShin,
    gKNSole, gKNToes, gKNAnkStrap,
    gKNTunicHem, gKNFold, gKNBelt, gKNBuckle, gKNSheath, gKNHilt,
    gKNCapDome, gKNCapBand, gKNNape,
    gKNShaft, gKNSocket, gKNBind, gKNGrip, gKNSpearHd, gKNButt, gKNUnit,
  ];
  for (const g of all) { g?.dispose(); }
  gKNBarrel = gKNWithers = gKNStripe = null;
  gKNChest = gKNRump = null;
  gKNNeck1 = gKNNeck2 = gKNNeck3 = gKNMuzzle = null;
  gKNSkull = gKNNostril = gKNEye = gKNManeTuft = gKNForelock = null;
  gKNEar = null;
  gKNUpFrnt = gKNUpRear = gKNLower = gKNPastern = gKNHoof = null;
  gKNTail1 = gKNTail2 = null;
  gKNPadTop = gKNPadFlap = gKNPadHem = gKNBreast = null;
  gKNGirth = null;
  gKNNoseBand = gKNBrowBand = gKNBit = null;
  gKNBitRing = null;
  gKNTorso = gKNChestR = gKNNeckR = gKNHead = gKNJaw = gKNNose = gKNBrow = gKNEarR = gKNEyeR = null;
  gKNUpArm = gKNForearm = gKNFist = gKNThigh = gKNShin = null;
  gKNSole = gKNToes = gKNAnkStrap = null;
  gKNTunicHem = gKNFold = gKNBelt = gKNBuckle = gKNSheath = gKNHilt = null;
  gKNCapDome = null;
  gKNCapBand = null;
  gKNNape = null;
  gKNShaft = gKNSocket = null;
  gKNBind = gKNGrip = null;
  gKNSpearHd = null;
  gKNButt = null;
  gKNUnit = null;
}
