/**
 * braz-rydwan-woly-opus5.ts — RYDWAN NA WOŁACH (Ox-Drawn Battle Cart),
 * najwcześniejszy pojazd bojowy EPOKI BRĄZU (units.json: „Rydwan (woły)",
 * Epoka=Brąz, Kultura=null → dostępny dla WSZYSTKICH cywilizacji,
 * Tech=Koło, Rola (linia)=Flanka).
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z rodziną builderów:
 *   buildRydwanWolyBrazOpus5(ownerColor) : THREE.Group
 *   disposeBrazRydwanWolyOpus5Geometries()
 *
 * Konwencje serii (jak braz-taran-opus5.ts / braz-lucznik-nubijski-opus5.ts):
 *   - token PRZODEM do +Z (kierunek jazdy — tam patrzą woły), spód kół i
 *     kopyt na y = 0 grupy,
 *   - MeshStandardMaterial, group.userData['mats'] + ['perTokenGeos'],
 *   - geometrie wspólne = singletony modułu (perTokenGeos puste),
 *   - HEX_R = 1.0 z hexutil.ts,
 *   - jeden slot koloru gracza w kilku miejscach (proporzec rufowy, płachta
 *     na prawym skrzydle skrzyni, pas kaunakes woźnicy) — jak w Taranie
 *     okutym, żeby cała rodzina pojazdów Brązu czytała się jako jedna linia.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — decyzje i uzasadnienia
 * ===========================================================================
 * WZORZEC: Sztandar z Ur (ok. 2600–2500 p.n.e., Muzeum Brytyjskie), panel
 * „Wojna" — cztery przedstawienia sumeryjskiego czteroKOŁOWEGO wozu bojowego
 * ciągniętego przez zaprzęg zwierząt w jarzmie karkowym. To NIE jest lekki
 * rydwan konny późnej epoki Brązu (ten jest w grze osobną jednostką — patrz
 * „Rydwan konny"/„Rydwan egipski"/„Rydwan mykeński" w units.ts, budowane
 * przez buildHorse ze szprychowymi końmi). Ten wóz jest wcześniejszy,
 * cięższy i wolniejszy — dokładnie zgodnie z danymi jednostki („wczesny
 * rydwan na wołach", Ruch=3 vs Ruch=4 „Rydwanu konnego").
 *
 * R1. KOŁA — CZTERY, PEŁNE, TRÓJDZIELNE (jak w Taranie okutym, pkt C1 tamtego
 *     pliku) — ŻADNYCH szprych. Szprychy to technologia ok. 2000 p.n.e.,
 *     wynaleziona WŁAŚNIE dla lekkich rydwanów konnych — dać je temu pojazdowi
 *     byłoby odwróceniem chronologii, którą progresja epok ma pokazywać.
 *     Wybrano CZTERY koła (nie dwa) świadomie: Sztandar z Ur jednoznacznie
 *     pokazuje ciężki „battle car" na 4 kołach — to definiująca cecha
 *     ikonografii, która odróżnia ten wóz od późniejszych, lekkich rydwanów
 *     2-kołowych w tej samej grze. Dwa koła + wysoka skrzynia wyglądałyby
 *     jak zwykły rydwan koński bez konia — nieczytelne. Zespół jezdny
 *     (4 koła × 6 mesh + 2 osie) to największy pojedynczy koszt budżetu,
 *     tak jak w Taranie okutym — i tak samo uzasadniony.
 * R2. ZAPRZĘG — WOŁY (nie onagry, nie konie). Dane jednostki („Rydwan
 *     (woły)") rozstrzygają wprost. Zwierzęta KRĘPE i NISKONOGIE (krótsze
 *     nogi, głębszy, szerszy tułów niż koń z kon-nowy-model.ts), Z ROGAMI
 *     (2 krótkie, zakrzywione — wół, nie koń), OPUSZCZONY ŁEB pod jarzmem
 *     (a nie dumnie wygięta szyja konia bojowego) — mają czytać się jako
 *     powolne i ciężkie, kontrastując z lekkością przyszłych rydwanów
 *     konnych. DWA woły w zaprzęgu (nie cztery, mimo że część reliefów
 *     z Ur pokazuje większe zaprzęgi) — decyzja budżetowa: dwa dobrze
 *     wymodelowane zwierzęta czytelniej niż cztery uproszczone, a para w
 *     jarzmie jest w pełni poświadczonym wariantem zaprzęgu bydła w
 *     starożytnym Bliskim Wschodzie.
 * R3. JARZMO KARKOWE (yoke), NIE CHOMĄTO. Prosta poprzeczka drewniana
 *     leżąca NA KARKACH obu wołów (za głową, przed kłębem), przypięta do
 *     dyszla i dociśnięta rzemiennymi paskami zaciskowymi na szyi — dokładnie
 *     metoda zaprzęgania bydła/wołów przed wynalezieniem chomąta
 *     (średniowiecze, poza zakresem tej epoki). Żadnego pasa piersiowego
 *     w stylu końskiej uprzęży rydwanowej z units.ts (breast/girth) — to
 *     byłby anachroniczny detal skopiowany z konia.
 * R4. SKRZYNIA Z DESEK I PLECIONKI (wiklina), WYSOKI PRZÓD. Podłoga na
 *     ramie osadzonej nad osiami, niskie boczne i tylne obrzeże (osłania
 *     nogi), WYSOKI przedni panel osłaniający załogę od pasa w dół (poziom
 *     bioder stojącego woźnicy) — powyżej panelu widoczny cały tors i głowa,
 *     zgodnie z proporcją figur na Sztandarze z Ur, gdzie skrzynia sięga
 *     mniej więcej do pasa. Panel przedni w tonacji plecionki (jaśniejszy
 *     drewniany odcień niż reszta ramy) + pozioma łata jako uproszczony
 *     wzór splotu.
 * R5. KOŁCZAN Z OSZCZEPAMI PRZYPIĘTY Z PRZODU SKRZYNI — charakterystyczny
 *     detal ze Sztandaru z Ur: pojemnik na zapasowe oszczepy przymocowany
 *     rzemieniem do zewnętrznej strony przedniego panelu, oszczepy sterczą
 *     ukośnie do góry, w zasięgu ręki woźnicy.
 * R6. ZAŁOGA — JEDNA POSTAĆ, świadomie (patrz uwaga we wskazówkach zadania:
 *     „jeśli dwie figury nie zmieszczą się w budżecie, zrób samego
 *     woźnicę"). Tu decyduje jednak PRZEDE WSZYSTKIM ZGODNOŚĆ HISTORYCZNA,
 *     nie tylko budżet: na Sztandarze z Ur KAŻDY z czterech wozów bojowych
 *     ma DOKŁADNIE JEDNEGO człowieka na pokładzie — woźnicę, który jedną
 *     ręką trzyma lejce, a drugą oszczep gotowy do rzutu (to on jest tu
 *     jednocześnie „woźnicą z lejcami" i „wojownikiem z oszczepem" z
 *     wytycznych — połączeni w jedną, poświadczoną źródłem postać, zamiast
 *     doklejać drugą figurę, które źródło nie potwierdza). Ciasna skrzynia
 *     na 4-kołowym wozie bojowym w ogóle nie mieści dwóch dorosłych mężczyzn
 *     stojących ramię w ramię — dwie figury byłyby przeciwne ikonografii,
 *     nie tylko budżetowi.
 *     Dolna połowa ciała (biodra w dół) ukryta za wysokim przednim panelem
 *     (pkt R4) — modelowany tylko tors w górę, zgodnie z tym, co faktycznie
 *     widać na reliefie. GOLONA GŁOWA, bez włosów — sumeryjska moda wojskowa
 *     Okresu Wczesnodynastycznego (patrz też ogolone głowy żołnierzy na
 *     dolnym panelu Sztandaru z Ur). KAUNAKES — spódniczka z postrzępionej
 *     wełny/skóry warstwami — jedyny strój, zero zbroi (protoplasta późniejszej
 *     zbroi łuskowej jeszcze nie istnieje w tym okresie).
 * R7. BRĄZ OSZCZĘDNIE: groty 3 oszczepów w kołczanie + grot oszczepu w dłoni
 *     woźnicy, okucie czoła dyszla przy jarzmie, pierścień na piaście
 *     każdego koła (jak w Taranie okutym) — reszta drewno/skóra/plecionka.
 * R8. CZEGO ŚWIADOMIE NIE MA: żadnych szprych, żadnych koni, żadnego
 *     chomąta, żadnych kos przy kołach (to perska legenda z epoki Żelaza —
 *     anachronizm w dwie strony: ani technika, ani epoka), żadnych oznaczeń
 *     rangi/insygniów (proporzec na rufie to slot KOLORU GRACZA — wymóg gry,
 *     nie insygnium dowódcy — dokładnie ta sama konwencja co w Taranie
 *     okutym), żadnego żelaza.
 *
 * ===========================================================================
 * BUDŻET I WYMIARY — patrz komentarz na końcu pliku (mierzone traversem
 * w dyspozycje/PODGLAD-BRAZ-RYDWAN-WOLY.html) oraz raport końcowy zadania.
 * ===========================================================================
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ── paleta ─────────────────────────────────────────────────────────────────
const RW_WOOD        = 0x7a5c3a;   // rama, oś, dyszel
const RW_WOOD_DK      = 0x4a3018;  // spoiny desek koła / cień
const RW_WICKER       = 0x9a7a48;  // plecionka przedniego panelu (jaśniejsza)
const RW_WICKER_DK    = 0x6d5230;  // łaty/pasy plecionki
const RW_BRONZE       = 0xbe8b3e;  // BRĄZ — piasty, okucia, groty
const RW_BRONZE_DK    = 0x8a5f28;
const RW_LEATHER      = 0x6b4a28;  // opony kół, rzemienie, kołczan, lejce
const RW_LEATHER_DK   = 0x4a331b;
const RW_SKIN         = 0xad7a4c;  // karnacja woźnicy
const RW_SKIN_DK      = 0x7a5636;  // cień żuchwy
const RW_KAUNAKES     = 0xd0c090;  // spódniczka kaunakes (górna warstwa)
const RW_KAUNAKES_DK  = 0xab8f62;  // dolna warstwa (cień)
const RW_EYE          = 0x140f0a;
const RW_OX_BODY      = 0x8a7458;  // krępe ciało wołu (szaro-brązowy)
const RW_OX_DK        = 0x5a4a38;  // nogi/kopyta/cień
const RW_OX_HORN      = 0xd6cbad;  // róg — jasny róg/kość
const RW_OX_MUZZLE    = 0x4a3a2c;  // pysk ciemny

// ── wymiary wiodące ────────────────────────────────────────────────────────
// koła (jak Taran okuty: 10-boczny walec, oś na apotemie opony => bieżnik y=0)
const RW_WHEEL_R  = 0.062 * HEX_R;
const RW_TYRE_R   = RW_WHEEL_R + 0.005 * HEX_R;
const RW_AXLE_Y   = RW_TYRE_R * Math.cos(Math.PI / 10);
const RW_WHEEL_X  = 0.150 * HEX_R;
const RW_AXLE_ZF  =  0.100 * HEX_R;   // oś przednia
const RW_AXLE_ZR  = -0.140 * HEX_R;   // oś tylna

// skrzynia
const RW_FLOOR_Y   = RW_AXLE_Y + 0.036 * HEX_R;
const RW_FLOOR_ZC  = -0.020 * HEX_R;
const RW_FLOOR_LEN = 0.320 * HEX_R;
const RW_FLOOR_WID = 0.260 * HEX_R;
const RW_FLOOR_FZ  = RW_FLOOR_ZC + RW_FLOOR_LEN * 0.5;   // przód skrzyni
const RW_FLOOR_RZ  = RW_FLOOR_ZC - RW_FLOOR_LEN * 0.5;   // tył skrzyni
const RW_FRONT_TOP = 0.260 * HEX_R;                       // szczyt wysokiego panelu

// woźnica (proporcje rodziny KL_/NB_, przesunięte o wysokość podłogi —
// stoi NA PODŁODZE skrzyni, nie na ziemi)
const RW_TORSO_W   = 0.170 * HEX_R;
const RW_TORSO_H   = 0.195 * HEX_R;
const RW_TORSO_D   = 0.095 * HEX_R;
const RW_TORSO_BOT = RW_FLOOR_Y + 0.240 * HEX_R;
const RW_TORSO_TOP = RW_TORSO_BOT + RW_TORSO_H;
const RW_NECK_H    = 0.026 * HEX_R;
const RW_HEAD_S    = 0.118 * HEX_R;
const RW_HEAD_CTR  = RW_TORSO_TOP + RW_NECK_H + RW_HEAD_S * 0.5;
const RW_SHLD_X    = RW_TORSO_W * 0.5 + 0.028 * HEX_R;
const RW_SHLD_Y    = RW_TORSO_TOP - 0.022 * HEX_R;
const RW_DRIVER_Z  = 0.010 * HEX_R;

// woły (dwa, w jarzmie, przodem +Z — tam gdzie łby). Rozmiar podniesiony na
// żądanie koordynatora (2026-07-25): grzbiet MA sięgać co najmniej wysokości
// górnej krawędzi skrzyni (RW_FRONT_TOP=0.260) — wcześniej wół był niższy niż
// wóz i czytał się jak cielę. Skalowane WYŁĄCZNIE tu (same zwierzęta, nie
// cała grupa) — reszta pojazdu (koła/skrzynia/woźnica) bez zmian.
const RW_OX_LEG_L     = 0.178 * HEX_R;
const RW_OX_TORSO_H   = 0.135 * HEX_R;
const RW_OX_TORSO_W   = 0.108 * HEX_R;
const RW_OX_TORSO_LEN = 0.192 * HEX_R;
const RW_OX_CTR_Y     = RW_OX_LEG_L + RW_OX_TORSO_H * 0.5;
const RW_OX_X         = 0.098 * HEX_R;     // rozstaw wołów od osi wozu (rozsunięte, by obie sztuki były czytelne z ujęcia gry)
const RW_OX_Z         = 0.360 * HEX_R;     // środek tułowia wołu
const RW_OX_HALF_LEN  = RW_OX_TORSO_LEN * 0.5;
const RW_YOKE_Y = RW_OX_CTR_Y + RW_OX_TORSO_H * 0.5 + 0.030 * HEX_R;
const RW_YOKE_Z = RW_OX_Z - RW_OX_HALF_LEN * 0.55;

// ── geometrie-singletony ───────────────────────────────────────────────────
let gRWUnit:     THREE.BoxGeometry | null = null;   // 1×1×1 — do rwStretch
let gRWWheel:    THREE.CylinderGeometry | null = null;
let gRWTyre:     THREE.CylinderGeometry | null = null;
let gRWNave:     THREE.CylinderGeometry | null = null;
let gRWNaveRing: THREE.CylinderGeometry | null = null;
let gRWSeam:     THREE.BoxGeometry | null = null;
let gRWAxle:     THREE.CylinderGeometry | null = null;
let gRWFloor:    THREE.BoxGeometry | null = null;
let gRWSideRail: THREE.BoxGeometry | null = null;
let gRWRearWall: THREE.BoxGeometry | null = null;
let gRWFrontPan: THREE.BoxGeometry | null = null;
let gRWFrontCap: THREE.BoxGeometry | null = null;
let gRWFrontWng: THREE.BoxGeometry | null = null;
let gRWLath:     THREE.BoxGeometry | null = null;
let gRWQuiver:   THREE.BoxGeometry | null = null;
let gRWQRim:     THREE.BoxGeometry | null = null;
let gRWQStrap:   THREE.BoxGeometry | null = null;
let gRWJavShaft: THREE.CylinderGeometry | null = null;
let gRWJavTip:   THREE.ConeGeometry | null = null;
let gRWYokeBar:  THREE.BoxGeometry | null = null;
let gRWYokeFit:  THREE.CylinderGeometry | null = null;
let gRWLashing:  THREE.CylinderGeometry | null = null;
let gRWMast:     THREE.BoxGeometry | null = null;
let gRWMastBar:  THREE.BoxGeometry | null = null;
let gRWBanner:   THREE.BoxGeometry | null = null;
// woźnica
let gRWTorso:    THREE.BoxGeometry | null = null;
let gRWNeck:     THREE.BoxGeometry | null = null;
let gRWHead:     THREE.BoxGeometry | null = null;
let gRWJaw:      THREE.BoxGeometry | null = null;
let gRWEye:      THREE.BoxGeometry | null = null;
let gRWKaunA:    THREE.BoxGeometry | null = null;
let gRWKaunB:    THREE.BoxGeometry | null = null;
let gRWFist:     THREE.BoxGeometry | null = null;
// woły
let gRWOxTorso:  THREE.BoxGeometry | null = null;
let gRWOxSkull:  THREE.BoxGeometry | null = null;
let gRWOxMuzzle: THREE.BoxGeometry | null = null;
let gRWOxEar:    THREE.BoxGeometry | null = null;
let gRWOxHorn:   THREE.ConeGeometry | null = null;
let gRWOxHoof:   THREE.BoxGeometry | null = null;
let gRWNoseRing: THREE.CylinderGeometry | null = null;

function getRWUnit():     THREE.BoxGeometry { return (gRWUnit     ||= new THREE.BoxGeometry(1, 1, 1)); }
function getRWWheel():    THREE.CylinderGeometry { return (gRWWheel    ||= new THREE.CylinderGeometry(RW_WHEEL_R, RW_WHEEL_R, 0.026 * HEX_R, 10, 1)); }
function getRWTyre():     THREE.CylinderGeometry { return (gRWTyre     ||= new THREE.CylinderGeometry(RW_TYRE_R, RW_TYRE_R, 0.030 * HEX_R, 10, 1, true)); }
function getRWNave():     THREE.CylinderGeometry { return (gRWNave     ||= new THREE.CylinderGeometry(0.016 * HEX_R, 0.020 * HEX_R, 0.028 * HEX_R, 6, 1)); }
function getRWNaveRing(): THREE.CylinderGeometry { return (gRWNaveRing ||= new THREE.CylinderGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.010 * HEX_R, 6, 1, true)); }
function getRWSeam():     THREE.BoxGeometry { return (gRWSeam     ||= new THREE.BoxGeometry(0.007 * HEX_R, 0.100 * HEX_R, 0.009 * HEX_R)); }
function getRWAxle():     THREE.CylinderGeometry { return (gRWAxle     ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.330 * HEX_R, 6, 1)); }
function getRWFloor():    THREE.BoxGeometry { return (gRWFloor    ||= new THREE.BoxGeometry(RW_FLOOR_WID, 0.018 * HEX_R, RW_FLOOR_LEN)); }
function getRWSideRail(): THREE.BoxGeometry { return (gRWSideRail ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.030 * HEX_R, RW_FLOOR_LEN)); }
function getRWRearWall(): THREE.BoxGeometry { return (gRWRearWall ||= new THREE.BoxGeometry(RW_FLOOR_WID, 0.100 * HEX_R, 0.018 * HEX_R)); }
function getRWFrontPan(): THREE.BoxGeometry { return (gRWFrontPan ||= new THREE.BoxGeometry(RW_FLOOR_WID * 0.94, RW_FRONT_TOP - RW_FLOOR_Y, 0.020 * HEX_R)); }
function getRWFrontCap(): THREE.BoxGeometry { return (gRWFrontCap ||= new THREE.BoxGeometry(RW_FLOOR_WID, 0.018 * HEX_R, 0.028 * HEX_R)); }
function getRWFrontWng(): THREE.BoxGeometry { return (gRWFrontWng ||= new THREE.BoxGeometry(0.020 * HEX_R, (RW_FRONT_TOP - RW_FLOOR_Y) * 0.78, 0.130 * HEX_R)); }
function getRWLath():     THREE.BoxGeometry { return (gRWLath     ||= new THREE.BoxGeometry(RW_FLOOR_WID * 0.88, 0.014 * HEX_R, 0.012 * HEX_R)); }
function getRWQuiver():   THREE.BoxGeometry { return (gRWQuiver   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.150 * HEX_R, 0.044 * HEX_R)); }
function getRWQRim():     THREE.BoxGeometry { return (gRWQRim     ||= new THREE.BoxGeometry(0.058 * HEX_R, 0.016 * HEX_R, 0.052 * HEX_R)); }
function getRWQStrap():   THREE.BoxGeometry { return (gRWQStrap   ||= new THREE.BoxGeometry(0.070 * HEX_R, 0.018 * HEX_R, 0.010 * HEX_R)); }
function getRWJavShaft(): THREE.CylinderGeometry { return (gRWJavShaft ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.008 * HEX_R, 0.150 * HEX_R, 5, 1)); }
function getRWJavTip():   THREE.ConeGeometry { return (gRWJavTip   ||= new THREE.ConeGeometry(0.013 * HEX_R, 0.042 * HEX_R, 4)); }
function getRWYokeBar():  THREE.BoxGeometry { return (gRWYokeBar  ||= new THREE.BoxGeometry(2 * RW_OX_X + 0.070 * HEX_R, 0.024 * HEX_R, 0.026 * HEX_R)); }
function getRWYokeFit():  THREE.CylinderGeometry { return (gRWYokeFit  ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.020 * HEX_R, 0.034 * HEX_R, 6, 1, true)); }
function getRWLashing():  THREE.CylinderGeometry { return (gRWLashing  ||= new THREE.CylinderGeometry(0.022 * HEX_R, 0.022 * HEX_R, 0.018 * HEX_R, 6, 1, true)); }
function getRWMast():     THREE.BoxGeometry { return (gRWMast     ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.340 * HEX_R, 0.013 * HEX_R)); }
function getRWMastBar():  THREE.BoxGeometry { return (gRWMastBar  ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.086 * HEX_R)); }
function getRWBanner():   THREE.BoxGeometry { return (gRWBanner   ||= new THREE.BoxGeometry(0.008 * HEX_R, 0.058 * HEX_R, 0.078 * HEX_R)); }
function getRWTorso():    THREE.BoxGeometry { return (gRWTorso    ||= new THREE.BoxGeometry(RW_TORSO_W, RW_TORSO_H, RW_TORSO_D)); }
function getRWNeck():     THREE.BoxGeometry { return (gRWNeck     ||= new THREE.BoxGeometry(0.044 * HEX_R, RW_NECK_H * 1.6, 0.044 * HEX_R)); }
function getRWHead():     THREE.BoxGeometry { return (gRWHead     ||= new THREE.BoxGeometry(RW_HEAD_S, RW_HEAD_S, RW_HEAD_S)); }
function getRWJaw():      THREE.BoxGeometry { return (gRWJaw      ||= new THREE.BoxGeometry(0.080 * HEX_R, 0.032 * HEX_R, 0.036 * HEX_R)); }
function getRWEye():      THREE.BoxGeometry { return (gRWEye      ||= new THREE.BoxGeometry(0.018 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R)); }
function getRWKaunA():    THREE.BoxGeometry { return (gRWKaunA    ||= new THREE.BoxGeometry(RW_TORSO_W * 1.10, 0.060 * HEX_R, RW_TORSO_D * 1.15)); }
function getRWKaunB():    THREE.BoxGeometry { return (gRWKaunB    ||= new THREE.BoxGeometry(RW_TORSO_W * 1.02, 0.058 * HEX_R, RW_TORSO_D * 1.08)); }
function getRWFist():     THREE.BoxGeometry { return (gRWFist     ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.044 * HEX_R, 0.046 * HEX_R)); }
function getRWOxTorso():  THREE.BoxGeometry { return (gRWOxTorso  ||= new THREE.BoxGeometry(RW_OX_TORSO_W, RW_OX_TORSO_H, RW_OX_TORSO_LEN)); }
function getRWOxSkull():  THREE.BoxGeometry { return (gRWOxSkull  ||= new THREE.BoxGeometry(0.065 * HEX_R, 0.065 * HEX_R, 0.078 * HEX_R)); }
function getRWOxMuzzle(): THREE.BoxGeometry { return (gRWOxMuzzle ||= new THREE.BoxGeometry(0.055 * HEX_R, 0.045 * HEX_R, 0.043 * HEX_R)); }
function getRWOxEar():    THREE.BoxGeometry { return (gRWOxEar    ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.025 * HEX_R, 0.050 * HEX_R)); }
function getRWOxHorn():   THREE.ConeGeometry { return (gRWOxHorn   ||= new THREE.ConeGeometry(0.018 * HEX_R, 0.070 * HEX_R, 5)); }
function getRWOxHoof():   THREE.BoxGeometry { return (gRWOxHoof   ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.028 * HEX_R, 0.048 * HEX_R)); }
function getRWNoseRing():  THREE.CylinderGeometry { return (gRWNoseRing ||= new THREE.CylinderGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R, 6, 1, true)); }

const RW_Y_UP = new THREE.Vector3(0, 1, 0);

/** Jednostkowy box rozciągnięty między A i B — dyszel, lejce, oszczepy,
 * nogi/szyja/ogon wołów. Skopiowane 1:1 z konwencji nbStretch. */
function rwStretch(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getRWUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(RW_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

/**
 * KOŁO TRÓJDZIELNE — 6 mesh, identyczna konstrukcja jak w Taranie okutym
 * (pkt R1): tarcza z desek, opona ze skóry surowej, dwie spoiny desek,
 * wystająca piasta, brązowy pierścień u nasady piasty.
 */
function rwWheel(
  group: THREE.Group, sx: number, z: number,
  mWood: THREE.MeshStandardMaterial, mSeam: THREE.MeshStandardMaterial,
  mTyre: THREE.MeshStandardMaterial, mBronze: THREE.MeshStandardMaterial,
): void {
  const x = sx * RW_WHEEL_X;
  const disc = new THREE.Mesh(getRWWheel(), mWood);
  disc.rotation.z = Math.PI / 2;
  disc.position.set(x, RW_AXLE_Y, z);
  group.add(disc);

  const tyre = new THREE.Mesh(getRWTyre(), mTyre);
  tyre.rotation.z = Math.PI / 2;
  tyre.position.set(x, RW_AXLE_Y, z);
  group.add(tyre);

  for (const dz of [-0.026, 0.026]) {
    const seam = new THREE.Mesh(getRWSeam(), mSeam);
    seam.position.set(x + sx * 0.015 * HEX_R, RW_AXLE_Y, z + dz * HEX_R);
    group.add(seam);
  }

  const nave = new THREE.Mesh(getRWNave(), mWood);
  nave.rotation.z = -sx * Math.PI / 2;
  nave.position.set(x + sx * 0.025 * HEX_R, RW_AXLE_Y, z);
  group.add(nave);

  const ring = new THREE.Mesh(getRWNaveRing(), mBronze);
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x + sx * 0.016 * HEX_R, RW_AXLE_Y, z);
  group.add(ring);
}

/**
 * WÓŁ — 17 mesh: tułów, szyja opuszczona ku jarzmu, łeb z pyskiem/rogami/
 * uszami, 4 proste nogi + kopyta, ogon, pierścień nosowy (do lejców).
 * Krępy, niskonogi, opuszczony łeb — kontrast z dumną szyją konia
 * z kon-nowy-model.ts (pkt R2). Przodem +Z.
 */
function rwOx(
  group: THREE.Group, sx: number,
  mBody: THREE.MeshStandardMaterial, mDk: THREE.MeshStandardMaterial,
  mHorn: THREE.MeshStandardMaterial, mMuzzle: THREE.MeshStandardMaterial,
  mBronze: THREE.MeshStandardMaterial,
): THREE.Vector3 {
  const x = sx * RW_OX_X;
  const torso = new THREE.Mesh(getRWOxTorso(), mBody);
  torso.position.set(x, RW_OX_CTR_Y, RW_OX_Z);
  group.add(torso);

  // nogi proste + kopyta (przednie i tylne pary) — grubsze, masywniejsze
  // (koordynator 2026-07-25: "mają wyglądać ciężko i masywnie")
  const legTopY = RW_OX_CTR_Y - RW_OX_TORSO_H * 0.5;
  for (const lz of [RW_OX_Z + RW_OX_HALF_LEN * 0.62, RW_OX_Z - RW_OX_HALF_LEN * 0.62]) {
    for (const lx of [-0.036, 0.036]) {
      rwStretch(group, mBody, new THREE.Vector3(x + lx * HEX_R, legTopY, lz),
        new THREE.Vector3(x + lx * HEX_R, 0.015 * HEX_R, lz), 0.036 * HEX_R, 0.040 * HEX_R);
      const hoof = new THREE.Mesh(getRWOxHoof(), mDk);
      hoof.position.set(x + lx * HEX_R, 0.012 * HEX_R, lz);
      group.add(hoof);
    }
  }

  // szyja: od przodu tułowia w górę-przód do punktu jarzma (opuszczona,
  // nie wygięta dumnie jak u konia — pkt R2)
  const neckA = new THREE.Vector3(x, RW_OX_CTR_Y + RW_OX_TORSO_H * 0.30, RW_OX_Z + RW_OX_HALF_LEN);
  const neckB = new THREE.Vector3(x, RW_YOKE_Y - 0.007 * HEX_R, RW_YOKE_Z);
  rwStretch(group, mBody, neckA, neckB, 0.056 * HEX_R);

  // łeb: ciągnięty dalej do przodu i lekko w dół spod jarzma
  const headC = neckB.clone().add(new THREE.Vector3(0, -0.021 * HEX_R, 0.060 * HEX_R));
  const skull = new THREE.Mesh(getRWOxSkull(), mBody);
  skull.position.copy(headC);
  group.add(skull);
  const muzzle = new THREE.Mesh(getRWOxMuzzle(), mMuzzle);
  muzzle.position.copy(headC.clone().add(new THREE.Vector3(0, -0.012 * HEX_R, 0.054 * HEX_R)));
  group.add(muzzle);
  const ring = new THREE.Mesh(getRWNoseRing(), mBronze);   // pierścień nosowy — punkt lejców
  ring.rotation.x = Math.PI / 2;
  const noseP = headC.clone().add(new THREE.Vector3(0, -0.019 * HEX_R, 0.074 * HEX_R));
  ring.position.copy(noseP);
  group.add(ring);
  for (const s of [-1, 1]) {
    const horn = new THREE.Mesh(getRWOxHorn(), mHorn);     // róg krótki, zakrzywiony na zewnątrz
    horn.rotation.z = s * 0.62;
    horn.rotation.x = -0.30;
    horn.position.copy(headC.clone().add(new THREE.Vector3(s * 0.034 * HEX_R, 0.036 * HEX_R, -0.012 * HEX_R)));
    group.add(horn);
    const ear = new THREE.Mesh(getRWOxEar(), mDk);          // ucho zwisające na bok
    ear.rotation.z = s * 1.30;
    ear.position.copy(headC.clone().add(new THREE.Vector3(s * 0.038 * HEX_R, 0.007 * HEX_R, -0.017 * HEX_R)));
    group.add(ear);
  }

  // ogon zwisający z tyłu tułowia
  const tailA = new THREE.Vector3(x, RW_OX_CTR_Y + RW_OX_TORSO_H * 0.30, RW_OX_Z - RW_OX_HALF_LEN);
  const tailB = tailA.clone().add(new THREE.Vector3(0, -0.100 * HEX_R, -0.028 * HEX_R));
  rwStretch(group, mDk, tailA, tailB, 0.019 * HEX_R);

  return noseP;
}

// ---------------------------------------------------------------------------
// RYDWAN NA WOŁACH (Ox-Drawn Battle Cart) — Sztandar z Ur, panel „Wojna".
// Front = +Z (kierunek zaprzęgu), spód kół/kopyt na y = 0. Cztery koła pełne
// trójdzielne (pkt R1), para wołów w jarzmie karkowym (pkt R2–R3), wysoka
// skrzynia z plecionki (pkt R4), kołczan oszczepów na przedzie (pkt R5),
// jeden woźnica — lejce + oszczep gotowy do rzutu (pkt R6).
// ---------------------------------------------------------------------------
export function buildRydwanWolyBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = (color: number, metalness = 0.1, roughness = 0.7): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats.push(m);
    return m;
  };

  const mWood     = mat(RW_WOOD,       0.06, 0.82);
  const mWoodDk   = mat(RW_WOOD_DK,    0.04, 0.88);
  const mWicker   = mat(RW_WICKER,     0.05, 0.86);
  const mWickerDk = mat(RW_WICKER_DK,  0.05, 0.88);
  const mBronze   = mat(RW_BRONZE,     0.60, 0.38);
  const mBronzeDk = mat(RW_BRONZE_DK,  0.55, 0.46);
  const mLeather  = mat(RW_LEATHER,    0.05, 0.86);
  const mLeatherD = mat(RW_LEATHER_DK, 0.05, 0.88);
  const mSkin     = mat(RW_SKIN,       0.05, 0.80);
  const mSkinDk   = mat(RW_SKIN_DK,    0.05, 0.85);
  const mKaunA    = mat(RW_KAUNAKES,   0.04, 0.92);
  const mKaunB    = mat(RW_KAUNAKES_DK,0.04, 0.92);
  const mEye      = mat(RW_EYE,        0.05, 0.86);
  const mOxBody   = mat(RW_OX_BODY,    0.04, 0.90);
  const mOxDk     = mat(RW_OX_DK,      0.04, 0.92);
  const mOxHorn   = mat(RW_OX_HORN,    0.10, 0.60);
  const mOxMuzzle = mat(RW_OX_MUZZLE,  0.05, 0.85);
  const mOwner    = mat(ownerColor_,   0.12, 0.70);

  // ═══ ZESPÓŁ JEZDNY: 4 KOŁA PEŁNE + 2 OSIE STAŁE (pkt R1) ═════════════════
  for (const z of [RW_AXLE_ZF, RW_AXLE_ZR]) {
    for (const sx of [-1, 1]) rwWheel(group, sx, z, mWood, mWoodDk, mLeather, mBronze);
    const axle = new THREE.Mesh(getRWAxle(), mWoodDk);
    axle.rotation.z = Math.PI / 2;
    axle.position.set(0, RW_AXLE_Y, z);
    group.add(axle);
  }

  // ═══ SKRZYNIA: podłoga + boczne listwy + tylna ścianka (pkt R4) ══════════
  const floor = new THREE.Mesh(getRWFloor(), mWood);
  floor.position.set(0, RW_FLOOR_Y, RW_FLOOR_ZC);
  group.add(floor);
  for (const sx of [-1, 1]) {
    const rail = new THREE.Mesh(getRWSideRail(), mWood);
    rail.position.set(sx * RW_FLOOR_WID * 0.5, RW_FLOOR_Y + 0.024 * HEX_R, RW_FLOOR_ZC);
    group.add(rail);
  }
  const rear = new THREE.Mesh(getRWRearWall(), mWood);
  rear.position.set(0, RW_FLOOR_Y + 0.050 * HEX_R, RW_FLOOR_RZ);
  group.add(rear);

  // ═══ WYSOKI PRZEDNI PANEL Z PLECIONKI + SKRZYDEŁKA (pkt R4) ══════════════
  const front = new THREE.Mesh(getRWFrontPan(), mWicker);
  front.position.set(0, RW_FLOOR_Y + (RW_FRONT_TOP - RW_FLOOR_Y) * 0.5, RW_FLOOR_FZ);
  group.add(front);
  const cap = new THREE.Mesh(getRWFrontCap(), mWoodDk);
  cap.position.set(0, RW_FRONT_TOP, RW_FLOOR_FZ);
  group.add(cap);
  for (const dy of [-0.055, 0.015]) {
    const lath = new THREE.Mesh(getRWLath(), mWickerDk);   // uproszczony wzór splotu
    lath.position.set(0, RW_FRONT_TOP + dy * HEX_R, RW_FLOOR_FZ + 0.011 * HEX_R);
    group.add(lath);
  }
  const wngL = new THREE.Mesh(getRWFrontWng(), mWicker);          // lewe skrzydło
  wngL.rotation.y = 0.30;
  wngL.position.set(-RW_FLOOR_WID * 0.48, RW_FLOOR_Y + (RW_FRONT_TOP - RW_FLOOR_Y) * 0.42, RW_FLOOR_FZ - 0.040 * HEX_R);
  group.add(wngL);
  const wngR = new THREE.Mesh(getRWFrontWng(), mOwner);           // prawe skrzydło = KOLOR GRACZA
  wngR.rotation.y = -0.30;
  wngR.position.set(RW_FLOOR_WID * 0.48, RW_FLOOR_Y + (RW_FRONT_TOP - RW_FLOOR_Y) * 0.42, RW_FLOOR_FZ - 0.040 * HEX_R);
  group.add(wngR);

  // ═══ KOŁCZAN Z OSZCZEPAMI NA PRZEDZIE SKRZYNI (pkt R5) ═══════════════════
  const QX = -0.078 * HEX_R;
  const QY = RW_FLOOR_Y + (RW_FRONT_TOP - RW_FLOOR_Y) * 0.66;
  const QZ = RW_FLOOR_FZ + 0.026 * HEX_R;
  const quiver = new THREE.Mesh(getRWQuiver(), mLeather);
  quiver.rotation.x = -0.16;
  quiver.position.set(QX, QY, QZ);
  group.add(quiver);
  const qRim = new THREE.Mesh(getRWQRim(), mLeatherD);
  qRim.rotation.x = -0.16;
  qRim.position.set(QX, QY + 0.080 * HEX_R, QZ - 0.012 * HEX_R);
  group.add(qRim);
  const qStrap = new THREE.Mesh(getRWQStrap(), mLeatherD);
  qStrap.rotation.z = Math.PI / 2;
  qStrap.position.set(QX, QY - 0.010 * HEX_R, RW_FLOOR_FZ + 0.001 * HEX_R);
  group.add(qStrap);
  for (const [dx, dz] of [[-0.014, 0.0], [0.006, -0.006], [0.020, -0.012]] as [number, number][]) {
    const A = new THREE.Vector3(QX + dx * HEX_R, QY + 0.050 * HEX_R, QZ + dz * HEX_R);
    const B = A.clone().add(new THREE.Vector3(dx * 0.35 * HEX_R, 0.150 * HEX_R, -dz * 0.4 * HEX_R));
    rwStretch(group, mLeatherD, A, B, 0.014 * HEX_R);
    const tip = new THREE.Mesh(getRWJavTip(), mBronze);
    tip.quaternion.setFromUnitVectors(RW_Y_UP, B.clone().sub(A).normalize());
    tip.position.copy(B.clone().addScaledVector(B.clone().sub(A).normalize(), 0.021 * HEX_R));
    group.add(tip);
  }

  // ═══ DYSZEL + JARZMO KARKOWE, NIE CHOMĄTO (pkt R3) ═══════════════════════
  const poleA = new THREE.Vector3(0, RW_FLOOR_Y + 0.014 * HEX_R, RW_FLOOR_FZ);
  const poleB = new THREE.Vector3(0, RW_YOKE_Y, RW_YOKE_Z);
  rwStretch(group, mWood, poleA, poleB, 0.026 * HEX_R);
  const poleFit = new THREE.Mesh(getRWYokeFit(), mBronzeDk);       // okucie dyszla przy jarzmie
  poleFit.rotation.x = Math.PI / 2;
  poleFit.position.copy(poleB);
  group.add(poleFit);
  const yokeBar = new THREE.Mesh(getRWYokeBar(), mWoodDk);         // poprzeczka jarzmowa
  yokeBar.position.set(0, RW_YOKE_Y, RW_YOKE_Z);
  group.add(yokeBar);
  const lash = new THREE.Mesh(getRWLashing(), mLeatherD);          // węzeł dyszel-jarzmo
  lash.rotation.x = Math.PI / 2;
  lash.position.set(0, RW_YOKE_Y, RW_YOKE_Z);
  group.add(lash);

  // ═══ PARA WOŁÓW W JARZMIE (pkt R2) — zwraca punkty nosowe do lejców ══════
  const noseL = rwOx(group, -1, mOxBody, mOxDk, mOxHorn, mOxMuzzle, mBronze);
  const noseR = rwOx(group,  1, mOxBody, mOxDk, mOxHorn, mOxMuzzle, mBronze);
  for (const sx of [-1, 1]) {                                       // pasek dociskowy jarzma na karku
    const strapA = new THREE.Vector3(sx * RW_OX_X, RW_YOKE_Y, RW_YOKE_Z + 0.006 * HEX_R);
    const strapB = strapA.clone().add(new THREE.Vector3(0, -0.048 * HEX_R, 0.014 * HEX_R));
    rwStretch(group, mLeatherD, strapA, strapB, 0.020 * HEX_R);
  }

  // ═══ WOŹNICA: tors w górę (biodra w dół ukryte za panelem, pkt R6) ═══════
  const torso = new THREE.Mesh(getRWTorso(), mKaunA);
  torso.position.set(0, RW_TORSO_BOT + RW_TORSO_H * 0.5, RW_DRIVER_Z);
  group.add(torso);
  const kaunB = new THREE.Mesh(getRWKaunB(), mKaunB);              // dolna warstwa kaunakes (nad panelem)
  kaunB.position.set(0, RW_TORSO_BOT - 0.010 * HEX_R, RW_DRIVER_Z);
  group.add(kaunB);
  const kaunA = new THREE.Mesh(getRWKaunA(), mOwner);              // górna warstwa = KOLOR GRACZA
  kaunA.position.set(0, RW_TORSO_BOT + 0.026 * HEX_R, RW_DRIVER_Z);
  group.add(kaunA);
  const neck = new THREE.Mesh(getRWNeck(), mSkin);
  neck.position.set(0, RW_TORSO_TOP + RW_NECK_H * 0.5, RW_DRIVER_Z);
  group.add(neck);
  const head = new THREE.Mesh(getRWHead(), mSkin);                 // głowa GOLONA — moda sumeryjska (pkt R6)
  head.position.set(0, RW_HEAD_CTR, RW_DRIVER_Z);
  group.add(head);
  const jaw = new THREE.Mesh(getRWJaw(), mSkinDk);
  jaw.position.set(0, RW_HEAD_CTR - RW_HEAD_S * 0.36, RW_DRIVER_Z + RW_HEAD_S * 0.5 - 0.006 * HEX_R);
  group.add(jaw);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(getRWEye(), mEye);
    eye.position.set(sx * 0.024 * HEX_R, RW_HEAD_CTR + 0.012 * HEX_R, RW_DRIVER_Z + RW_HEAD_S * 0.5 + 0.001 * HEX_R);
    group.add(eye);
  }

  // LEWA ręka (+X): lejce nisko-w-przód, ku pierścieniom nosowym wołów
  const shldL = new THREE.Vector3(RW_SHLD_X, RW_SHLD_Y, RW_DRIVER_Z);
  const handL = shldL.clone().add(new THREE.Vector3(0.030 * HEX_R, -0.150 * HEX_R, 0.110 * HEX_R));
  const elbowL = shldL.clone().lerp(handL, 0.52).add(new THREE.Vector3(0.014 * HEX_R, 0, 0));
  rwStretch(group, mSkin, shldL, elbowL, 0.050 * HEX_R);
  rwStretch(group, mSkin, elbowL, handL, 0.038 * HEX_R);
  const fistL = new THREE.Mesh(getRWFist(), mSkinDk);
  fistL.position.copy(handL);
  group.add(fistL);
  rwStretch(group, mLeather, handL, noseL, 0.010 * HEX_R);          // lejec lewy
  rwStretch(group, mLeather, handL, noseR, 0.010 * HEX_R);          // lejec prawy — z tej samej dłoni

  // PRAWA ręka (-X): oszczep gotowy do rzutu, uniesiony ukośnie w górę-przód
  const shldR = new THREE.Vector3(-RW_SHLD_X, RW_SHLD_Y, RW_DRIVER_Z);
  const handR = shldR.clone().add(new THREE.Vector3(0.028 * HEX_R, 0.130 * HEX_R, 0.090 * HEX_R));
  const elbowR = shldR.clone().lerp(handR, 0.50).add(new THREE.Vector3(-0.020 * HEX_R, 0, 0.010 * HEX_R));
  rwStretch(group, mSkin, shldR, elbowR, 0.050 * HEX_R);
  rwStretch(group, mSkin, elbowR, handR, 0.038 * HEX_R);
  const fistR = new THREE.Mesh(getRWFist(), mSkinDk);
  fistR.position.copy(handR);
  group.add(fistR);
  const javDir = new THREE.Vector3(0.10, 0.86, 0.50).normalize();
  const javTail = handR.clone().addScaledVector(javDir, -0.030 * HEX_R);
  const javShaft = new THREE.Mesh(getRWJavShaft(), mLeather);
  javShaft.quaternion.setFromUnitVectors(RW_Y_UP, javDir);
  javShaft.position.copy(javTail.clone().addScaledVector(javDir, 0.075 * HEX_R));
  group.add(javShaft);
  const javTip = new THREE.Mesh(getRWJavTip(), mBronze);
  javTip.quaternion.setFromUnitVectors(RW_Y_UP, javDir);
  javTip.position.copy(javTail.clone().addScaledVector(javDir, 0.150 * HEX_R + 0.021 * HEX_R));
  group.add(javTip);

  // ═══ PROPORZEC RUFOWY — KOLOR GRACZA (jak w Taranie okutym) ══════════════
  // Maszt wyraźnie WYŻSZY niż tylna ścianka (0.20), żeby proporzec był
  // czytelny z dystansu (nie ginął w cieniu skrzyni) — szczyt ~0.54, wciąż
  // niżej niż głowa woźnicy (~0.68) i uniesiony oszczep (~0.79).
  const RW_MAST_BASE = RW_FLOOR_Y + 0.100 * HEX_R;
  const mast = new THREE.Mesh(getRWMast(), mWood);
  mast.position.set(0, RW_MAST_BASE + 0.170 * HEX_R, RW_FLOOR_RZ - 0.006 * HEX_R);
  group.add(mast);
  const mastBar = new THREE.Mesh(getRWMastBar(), mWood);
  mastBar.position.set(0, RW_MAST_BASE + 0.350 * HEX_R, RW_FLOOR_RZ - 0.006 * HEX_R);
  group.add(mastBar);
  const banner = new THREE.Mesh(getRWBanner(), mOwner);
  banner.position.set(0.004 * HEX_R, RW_MAST_BASE + 0.312 * HEX_R, RW_FLOOR_RZ - 0.006 * HEX_R - 0.039 * HEX_R);
  group.add(banner);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazRydwanWolyOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gRWUnit, gRWWheel, gRWTyre, gRWNave, gRWNaveRing, gRWSeam, gRWAxle,
    gRWFloor, gRWSideRail, gRWRearWall, gRWFrontPan, gRWFrontCap, gRWFrontWng,
    gRWLath, gRWQuiver, gRWQRim, gRWQStrap, gRWJavShaft, gRWJavTip,
    gRWYokeBar, gRWYokeFit, gRWLashing, gRWMast, gRWMastBar, gRWBanner,
    gRWTorso, gRWNeck, gRWHead, gRWJaw, gRWEye, gRWKaunA, gRWKaunB, gRWFist,
    gRWOxTorso, gRWOxSkull, gRWOxMuzzle, gRWOxEar, gRWOxHorn, gRWOxHoof, gRWNoseRing,
  ];
  for (const g of all) { g?.dispose(); }
  gRWUnit = gRWWheel = gRWTyre = gRWNave = gRWNaveRing = gRWSeam = gRWAxle = null;
  gRWFloor = gRWSideRail = gRWRearWall = gRWFrontPan = gRWFrontCap = gRWFrontWng = null;
  gRWLath = gRWQuiver = gRWQRim = gRWQStrap = gRWJavShaft = gRWJavTip = null;
  gRWYokeBar = gRWYokeFit = gRWLashing = gRWMast = gRWMastBar = gRWBanner = null;
  gRWTorso = gRWNeck = gRWHead = gRWJaw = gRWEye = gRWKaunA = gRWKaunB = gRWFist = null;
  gRWOxTorso = gRWOxSkull = gRWOxMuzzle = gRWOxEar = gRWOxHorn = gRWOxHoof = gRWNoseRing = null;
}

// ===========================================================================
// BUDŻET (mierzone traversem — patrz dyspozycje/PODGLAD-BRAZ-RYDWAN-WOLY.html)
// i wymiary — patrz raport końcowy zadania.
// ===========================================================================
