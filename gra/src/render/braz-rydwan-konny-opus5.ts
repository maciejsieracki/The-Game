/**
 * braz-rydwan-konny-opus5.ts — RYDWAN KONNY (War Chariot), LEKKI DWUKOŁOWY
 * RYDWAN BOJOWY EPOKI BRĄZU (units.json: „Rydwan konny"/„War Chariot",
 * Epoka=Brąz, Kultura=null → dostępny dla WSZYSTKICH cywilizacji,
 * Tech=Jeździectwo, Rola (linia)=Flanka, Ruch=4, Atak dystansowy=0).
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z rodziną builderów:
 *   buildRydwanKonnyBrazOpus5(ownerColor) : THREE.Group
 *   disposeBrazRydwanKonnyOpus5Geometries()
 *
 * Konwencje serii (jak braz-rydwan-woly-opus5.ts / braz-taran-opus5.ts):
 *   - token PRZODEM do +Z (kierunek jazdy — tam patrzą konie), spód kół
 *     i kopyt na y = 0 grupy,
 *   - MeshStandardMaterial, group.userData['mats'] + ['perTokenGeos'],
 *   - geometrie wspólne = SINGLETONY MODUŁU (perTokenGeos zostaje puste —
 *     _disposeToken kasuje tylko materiały tokenu, geometrie żyją dalej),
 *   - HEX_R = 1.0 z hexutil.ts,
 *   - trzy sloty koloru gracza (panel przedni skrzyni, tunika/szarfa woźnicy,
 *     okrągła tarcza wojownika) — dokładnie ta sama konwencja co w Rydwanie
 *     na wołach i Taranie okutym, żeby rodzina pojazdów Brązu czytała się
 *     jako jedna linia.
 *   - zero importów z ui/** (żadnych portretów/ikon) — czysty render.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — decyzje i uzasadnienia
 * ===========================================================================
 * WZORZEC: lekki, dwukołowy rydwan bojowy Bliskiego Wschodu i Egiptu okresu
 * ok. 1700–1200 p.n.e. — typ powstały po upowszechnieniu koła szprychowego
 * i udomowieniu konia zaprzęgowego, rozpowszechniony od Mitanni i Hetytów
 * po Egipt Nowego Państwa i Grecję mykeńską. To jednostka UNIWERSALNA
 * (Kultura=null), więc model CELOWO trzyma wspólny mianownik całego basenu
 * wschodniośródziemnomorskiego, a wszystkie detale rozpoznawalne jako
 * „egipskie", „hetyckie", „mykeńskie" czy „chińskie" zostają zarezerwowane
 * dla dedykowanych rydwanów kulturowych (Egipski / Mykeński / Shang /
 * Kapadokijski / Celtycki).
 *
 * K1. KOŁA — DWA, SZPRYCHOWE, CZTEROSZPRYCHOWE. To definiująca różnica wobec
 *     wcześniejszego „Rydwanu (woły)" z tej samej epoki, który ma CZTERY koła
 *     PEŁNE (Sztandar z Ur). Koło szprychowe (ok. 2000 p.n.e., stepy
 *     Sintaszta–Pietrowka, w Bliskim Wschodzie od ok. 1700 p.n.e.) zostało
 *     wynalezione WŁAŚNIE po to, żeby zbudować lekki pojazd konny — użycie go
 *     tutaj i tylko tutaj pokazuje graczowi postęp techniczny w obrębie epoki.
 *     Liczba szprych: CZTERY — wariant poświadczony wprost zachowanymi
 *     rydwanami z grobowca Tutanchamona i licznymi reliefami XVIII dynastii
 *     oraz ikonografią anatolijską; sześcioszprychowe koła to głównie
 *     późniejszy, ramessydzki standard, a przy skali żetonu (promień koła
 *     0.124·HEX_R) sześć szprych zlewa się w plamę — cztery czytają się
 *     jednoznacznie jako „szprychy, nie tarcza". Obręcz z giętego drewna
 *     (felga) + osobna opona z surowej skóry naciąganej na mokro — tak
 *     wykańczano felgi przed obręczami żelaznymi (epoka Żelaza, poza zakresem).
 * K2. OŚ PRZESUNIĘTA NA SAM TYŁ PLATFORMY. Najbardziej charakterystyczna cecha
 *     konstrukcyjna lekkiego rydwanu Późnego Brązu: oś nie pod środkiem
 *     skrzyni (jak w ciężkim wozie na wołach), lecz przy tylnej krawędzi
 *     podłogi. Przenosi to ciężar załogi na zaprzęg, skraca ramię bezwładności
 *     i pozwala zawracać niemal w miejscu — powód, dla którego ta jednostka
 *     ma Ruch=4 wobec Ruchu=3 rydwanu na wołach. Modelowane dosłownie:
 *     RK_AXLE_Z ≈ tylna krawędź podłogi.
 * K3. SKRZYNIA LEKKA: RAMA Z GIĘTEGO DREWNA OBCIĄGNIĘTA SKÓRĄ/PLECIONKĄ,
 *     OTWARTA Z TYŁU. Żadnej litej deski, żadnej burty do piersi — burta
 *     do PASA (D-kształtny obrys: pełny panel z przodu, dwa krótkie boki,
 *     tył całkiem otwarty, żeby załoga mogła wskoczyć i wyskoczyć w biegu).
 *     Podłoga plecionkowa/rzemienna, tu uproszczona do panelu z dwiema
 *     poprzeczkami. Górna krawędź burty ma osobny gięty poręcz (handrail) —
 *     realny element, którego woźnica trzymał się przy zawracaniu.
 * K4. ZAPRZĘG — DWA KONIE, JARZMO GRZBIETOWE Z SIODEŁKAMI JARZMOWYMI.
 *     Konie zaprzęgano jarzmem opartym na KŁĘBIE, a nie chomątem (chomąto to
 *     średniowiecze) i nie pasem piersiowym dławiącym tchawicę. Poprzeczka
 *     jarzma leży w poprzek karków, a na niej dwa „siodełka jarzmowe" —
 *     drewniane widełki obejmujące kłąb, unieruchomione popręgiem pod brzuchem
 *     i paskiem napierśnym. To rozwiązanie egipsko-anatolijskie, ale wspólne
 *     dla całego Bliskiego Wschodu, więc kulturowo neutralne. DWA konie (nie
 *     cztery) — para w jarzmie to standard Późnego Brązu; czterokonne zaprzęgi
 *     to dopiero epoka Żelaza / rydwany paradne.
 * K5. DYSZEL DŁUGI, POPROWADZONY POD PODŁOGĄ DO OSI. Dyszel nie zaczyna się
 *     na przedniej ścianie skrzyni — biegnie od osi POD podłogą i dopiero
 *     przed skrzynią wznosi się łukiem do jarzma. Dzięki temu naprężenie
 *     zaprzęgu idzie prosto w oś, a nie rozrywa nadwozie. Modelowane dwoma
 *     segmentami (poziomy pod podłogą + wznoszący się do jarzma).
 * K6. ZAŁOGA DWUOSOBOWA: WOŹNICA + WOJOWNIK Z WŁÓCZNIĄ. Kanoniczna obsada
 *     lekkiego rydwanu Późnego Brązu to dwie osoby (trzyosobowa — z osobnym
 *     tarczownikiem — jest specyficznie hetycka i chińska, więc zostaje
 *     rydwanom kulturowym). Wojownik dostaje WŁÓCZNIĘ i małą okrągłą tarczę,
 *     NIE ŁUK: dane jednostki mówią „Atak dystansowy = 0, Ilość pocisków = —",
 *     a rydwan-łucznik istnieje w grze jako osobna jednostka („Rydwan
 *     egipski", Atak dystansowy 6, Pociski 14). Model musi zgadzać się
 *     z mechaniką — inaczej gracz widzi łucznika, który nie strzela.
 * K7. STRÓJ NEUTRALNY KULTUROWO: prosta lniana przepaska/kilt do kolan
 *     i naga górna połowa ciała lub wąska szarfa — najmniejszy wspólny
 *     mianownik ubioru wojownika Brązu od Egiptu po Lewant. ŚWIADOMIE BEZ:
 *     nemesu i pióropusza (Egipt), hełmu z kłów dzika i tarczy „ósemkowej"
 *     (Mykeny), spiczastej czapki i długiego płaszcza (Hetyci), laki i
 *     halabardy ge (Shang), wąsów/torquesu (Celtowie).
 * K8. BRĄZ OSZCZĘDNIE — zgodnie z nazwą epoki, nie z fantazją: grot włóczni,
 *     pierścienie piast, zawleczki osi (lynchpin), okucie czoła dyszla przy
 *     jarzmie, wędzidła. Reszta to drewno, skóra, plecionka i len.
 * K9. CZEGO ŚWIADOMIE NIE MA: kół pełnych (to poprzednia jednostka), kos przy
 *     piastach (perska legenda epoki Żelaza), chomąta i strzemion (oba
 *     poepokowe), siodła (rydwan to pojazd, jeździec nie siedzi na koniu),
 *     żelaza w jakiejkolwiek postaci, kołczanu i łuku (patrz K6), godeł
 *     rangowych — proporcjonalnie do reguły gry kolor gracza idzie na panel
 *     skrzyni, szarfę i tarczę, a nie na „insygnia dowódcy".
 * ===========================================================================
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ── paleta ─────────────────────────────────────────────────────────────────
const RK_WOOD        = 0x8a6a42;   // gięte drewno ramy / felgi (jaśniejsze niż ciężki wóz)
const RK_WOOD_DK     = 0x553a1f;   // dyszel, oś, poprzeczka jarzma
const RK_HIDE        = 0xc4ab7f;   // skóra/plecionka obciągająca burtę
const RK_HIDE_DK     = 0x8e7444;   // przetarcia, rzemienne wiązania burty
const RK_BRONZE      = 0xc08f42;   // BRĄZ — groty, pierścienie piast, wędzidła
const RK_BRONZE_DK   = 0x8a5f28;
const RK_LEATHER     = 0x6b4a28;   // opona koła, uprząż, lejce
const RK_LEATHER_DK  = 0x452f18;
const RK_SKIN        = 0xb07c4e;   // karnacja załogi
const RK_SKIN_DK     = 0x7d5636;
const RK_LINEN       = 0xcdbc94;   // lniany kilt (przygaszony — nie może krzyczeć bielą)
const RK_HAIR        = 0x33200e;   // włosy załogi (ciepły ciemny brąz, nie czerń)
const RK_EYE         = 0x140f0a;
const RK_HORSE       = 0x9c6b3e;   // gniady koń
const RK_HORSE_DK    = 0x6b4526;   // cienie / dolne partie nóg
const RK_MANE        = 0x1d1108;   // grzywa i ogon (prawie czarne)
const RK_HOOF        = 0x3a2c1e;
const RK_MUZZLE      = 0x4e341c;   // ciemna chrapa — czytelny „dziób" łba z góry

// ── wymiary wiodące ────────────────────────────────────────────────────────
// KOŁA (K1): 12-boczna felga → bieżnik dotyka y=0 apotemą opony.
// ROZSTAW KÓŁ CELOWO SZEROKI (2·0.234 = 0.468 wobec skrzyni 0.272, stosunek
// ≈1.7:1). To jednocześnie fakt historyczny (rozstaw rydwanu egipskiego ok.
// 1,5–1,8 m przy skrzyni ok. 1,0 m — szeroki rozstaw stabilizował pojazd
// w ciasnym zawracaniu) i wymóg CZYTELNOŚCI: przy kamerze gry patrzącej
// wzdłuż osi pojazdu koła muszą wystawać poza obrys załogi i koni, inaczej
// jedyna rozpoznawalna cecha rydwanu — duże koło szprychowe — znika.
const RK_WHEEL_R  = 0.124 * HEX_R;                        // felga (obręcz drewniana)
const RK_TYRE_R   = RK_WHEEL_R + 0.006 * HEX_R;           // opona ze skóry surowej
const RK_AXLE_Y   = RK_TYRE_R;   // wysokość osi nad ziemią (opona 12-katna dotyka wierzcholkiem, nie apotema — N1 Evaluatora)
const RK_WHEEL_X  = 0.234 * HEX_R;                        // rozstaw kół (pół-rozstawu)
const RK_AXLE_Z   = -0.196 * HEX_R;                       // OŚ NA SAMYM TYLE (K2)

// SKRZYNIA (K3) — mała platforma, burta do pasa, tył otwarty.
const RK_FLOOR_Y   = RK_AXLE_Y + 0.022 * HEX_R;
const RK_FLOOR_WID = 0.272 * HEX_R;
const RK_FLOOR_LEN = 0.190 * HEX_R;
const RK_FLOOR_FZ  = -0.012 * HEX_R;                      // przednia krawędź podłogi
const RK_FLOOR_RZ  = RK_FLOOR_FZ - RK_FLOOR_LEN;          // tylna krawędź podłogi
const RK_FLOOR_ZC  = (RK_FLOOR_FZ + RK_FLOOR_RZ) * 0.5;
const RK_SIDE_H    = 0.140 * HEX_R;                       // wysokość burty (do pasa)
const RK_RAIL_Y    = RK_FLOOR_Y + RK_SIDE_H;              // górna krawędź burty / poręcz

// ZAŁOGA (K6) — stoi NA PODŁODZE skrzyni; biodra tuż nad krawędzią burty.
// Figury celowo DROBNE względem pojazdu: rydwan ma czytać się jako POJAZD,
// a nie jako dwóch ludzi z doklejonymi kołami.
const RK_TORSO_W   = 0.108 * HEX_R;
const RK_TORSO_H   = 0.155 * HEX_R;
const RK_TORSO_D   = 0.078 * HEX_R;
const RK_HIP_Y     = RK_RAIL_Y + 0.030 * HEX_R;
const RK_TORSO_TOP = RK_HIP_Y + RK_TORSO_H;
const RK_NECK_H    = 0.022 * HEX_R;
const RK_HEAD_S    = 0.094 * HEX_R;
const RK_HEAD_CTR  = RK_TORSO_TOP + RK_NECK_H + RK_HEAD_S * 0.5;
const RK_SHLD_X    = RK_TORSO_W * 0.5 + 0.023 * HEX_R;
const RK_SHLD_Y    = RK_TORSO_TOP - 0.018 * HEX_R;
const RK_CREW_Z    = -0.086 * HEX_R;                      // załoga w środku skrzyni
const RK_DRIVER_X  =  0.062 * HEX_R;                      // woźnica (+X)
const RK_FIGHTER_X = -0.062 * HEX_R;                      // wojownik (-X)

// KONIE (K4) — smukłe, długonogie, łeb NIESIONY WYSOKO (kontrast z krępym,
// nisko niosącym łeb wołem z braz-rydwan-woly-opus5.ts).
const RK_H_X        = 0.094 * HEX_R;    // rozstaw koni od osi pojazdu
const RK_H_Z        = 0.292 * HEX_R;    // środek beczki tułowia
const RK_H_BARREL_R = 0.058 * HEX_R;
const RK_H_BARREL_L = 0.196 * HEX_R;
/** Skręt łbów NA ZEWNĄTRZ od dyszla (rad). Para w jarzmie naturalnie rozchyla
 *  głowy — a przy ujęciu gry (wprost z przodu) łeb ustawiony w 3/4 pokazuje
 *  profil z chrapą i uszami zamiast bezkształtnego walca „na wprost". */
const RK_HEAD_YAW   = 0.42;
/** Pochylenie czaszki (rad, nos w dół). CELOWO ŁAGODNE (≈18°): koń zaprzęgowy
 *  w biegu niesie łeb prawie pionowo, a przy kamerze patrzącej z góry pod 52°
 *  łeb pochylony mocniej pokazuje sam wierzch potylicy — bezkształtną kostkę
 *  zamiast pyska. Przy 18° widać całą twarz: chrapę, oczy i uszy. */
const RK_SKULL_TILT = 0.32;
const RK_H_HALF     = RK_H_BARREL_L * 0.5;
const RK_H_LEG_TOP  = 0.208 * HEX_R;    // dolna krawędź beczki = góra nóg
const RK_H_CTR_Y    = RK_H_LEG_TOP + RK_H_BARREL_R;
const RK_H_BACK_Y   = RK_H_CTR_Y + RK_H_BARREL_R;         // linia grzbietu

// JARZMO (K4) — na kłębie, tuż przed grzbietem, za nasadą szyi.
const RK_YOKE_Y = RK_H_BACK_Y + 0.026 * HEX_R;
const RK_YOKE_Z = RK_H_Z + RK_H_HALF * 0.63;

// ── geometrie-singletony modułu ────────────────────────────────────────────
let gRKUnit:      THREE.BoxGeometry | null = null;        // 1×1×1 — do rkStretch
let gRKFelloe:    THREE.CylinderGeometry | null = null;
let gRKTyre:      THREE.CylinderGeometry | null = null;
let gRKSpoke:     THREE.BoxGeometry | null = null;
let gRKNave:      THREE.CylinderGeometry | null = null;
let gRKNaveRing:  THREE.CylinderGeometry | null = null;
let gRKLynch:     THREE.BoxGeometry | null = null;
let gRKAxle:      THREE.CylinderGeometry | null = null;
let gRKFloor:     THREE.BoxGeometry | null = null;
let gRKFloorBar:  THREE.BoxGeometry | null = null;
let gRKFrontPan:  THREE.BoxGeometry | null = null;
let gRKFrontRail: THREE.BoxGeometry | null = null;
let gRKSidePan:   THREE.BoxGeometry | null = null;
let gRKSideRail:  THREE.BoxGeometry | null = null;
let gRKPost:      THREE.BoxGeometry | null = null;
let gRKPoleFit:   THREE.CylinderGeometry | null = null;
let gRKYokeBar:   THREE.BoxGeometry | null = null;
let gRKYokeSdl:   THREE.BoxGeometry | null = null;
let gRKGirth:     THREE.CylinderGeometry | null = null;
let gRKCase:      THREE.BoxGeometry | null = null;
let gRKCaseRim:   THREE.BoxGeometry | null = null;
let gRKSpearTip:  THREE.ConeGeometry | null = null;
let gRKSpearSft:  THREE.CylinderGeometry | null = null;
let gRKShield:    THREE.CylinderGeometry | null = null;
let gRKShieldBs:  THREE.CylinderGeometry | null = null;
// załoga
let gRKTorso:     THREE.BoxGeometry | null = null;
let gRKKilt:      THREE.BoxGeometry | null = null;
let gRKSash:      THREE.BoxGeometry | null = null;
let gRKNeck:      THREE.BoxGeometry | null = null;
let gRKHead:      THREE.BoxGeometry | null = null;
let gRKHair:      THREE.BoxGeometry | null = null;
let gRKEye:       THREE.BoxGeometry | null = null;
let gRKFist:      THREE.BoxGeometry | null = null;
// koń
let gRKBarrel:    THREE.CylinderGeometry | null = null;
let gRKChest:     THREE.IcosahedronGeometry | null = null;
let gRKRump:      THREE.IcosahedronGeometry | null = null;
let gRKWithers:   THREE.BoxGeometry | null = null;
let gRKNeck1:     THREE.CylinderGeometry | null = null;
let gRKNeck2:     THREE.CylinderGeometry | null = null;
let gRKNeck3:     THREE.CylinderGeometry | null = null;
let gRKSkull:     THREE.BoxGeometry | null = null;
let gRKMuzzle:    THREE.CylinderGeometry | null = null;
let gRKEar:       THREE.ConeGeometry | null = null;
let gRKMane:      THREE.BoxGeometry | null = null;
let gRKForelock:  THREE.BoxGeometry | null = null;
let gRKHEye:      THREE.BoxGeometry | null = null;
let gRKHoof:      THREE.BoxGeometry | null = null;
let gRKBit:       THREE.CylinderGeometry | null = null;
let gRKChrap:     THREE.BoxGeometry | null = null;

function getRKUnit():      THREE.BoxGeometry { return (gRKUnit      ||= new THREE.BoxGeometry(1, 1, 1)); }
function getRKFelloe():    THREE.CylinderGeometry { return (gRKFelloe    ||= new THREE.CylinderGeometry(RK_WHEEL_R, RK_WHEEL_R, 0.024 * HEX_R, 12, 1, true)); }
function getRKTyre():      THREE.CylinderGeometry { return (gRKTyre      ||= new THREE.CylinderGeometry(RK_TYRE_R, RK_TYRE_R, 0.030 * HEX_R, 12, 1, true)); }
function getRKSpoke():     THREE.BoxGeometry { return (gRKSpoke     ||= new THREE.BoxGeometry(0.018 * HEX_R, RK_WHEEL_R * 1.94, 0.019 * HEX_R)); }
function getRKNave():      THREE.CylinderGeometry { return (gRKNave      ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.026 * HEX_R, 0.044 * HEX_R, 6, 1)); }
function getRKNaveRing():  THREE.CylinderGeometry { return (gRKNaveRing  ||= new THREE.CylinderGeometry(0.028 * HEX_R, 0.028 * HEX_R, 0.011 * HEX_R, 6, 1, true)); }
function getRKLynch():     THREE.BoxGeometry { return (gRKLynch     ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.034 * HEX_R, 0.010 * HEX_R)); }
function getRKAxle():      THREE.CylinderGeometry { return (gRKAxle      ||= new THREE.CylinderGeometry(0.013 * HEX_R, 0.013 * HEX_R, RK_WHEEL_X * 2 + 0.020 * HEX_R, 6, 1)); }
function getRKFloor():     THREE.BoxGeometry { return (gRKFloor     ||= new THREE.BoxGeometry(RK_FLOOR_WID, 0.016 * HEX_R, RK_FLOOR_LEN)); }
function getRKFloorBar():  THREE.BoxGeometry { return (gRKFloorBar  ||= new THREE.BoxGeometry(RK_FLOOR_WID * 0.96, 0.010 * HEX_R, 0.013 * HEX_R)); }
function getRKFrontPan():  THREE.BoxGeometry { return (gRKFrontPan  ||= new THREE.BoxGeometry(RK_FLOOR_WID * 0.98, RK_SIDE_H * 0.90, 0.017 * HEX_R)); }
function getRKFrontRail(): THREE.BoxGeometry { return (gRKFrontRail ||= new THREE.BoxGeometry(RK_FLOOR_WID + 0.016 * HEX_R, 0.019 * HEX_R, 0.026 * HEX_R)); }
function getRKSidePan():   THREE.BoxGeometry { return (gRKSidePan   ||= new THREE.BoxGeometry(0.016 * HEX_R, RK_SIDE_H * 0.84, RK_FLOOR_LEN * 0.72)); }
function getRKSideRail():  THREE.BoxGeometry { return (gRKSideRail  ||= new THREE.BoxGeometry(0.021 * HEX_R, 0.019 * HEX_R, RK_FLOOR_LEN * 0.80)); }
function getRKPost():      THREE.BoxGeometry { return (gRKPost      ||= new THREE.BoxGeometry(0.020 * HEX_R, RK_SIDE_H + 0.014 * HEX_R, 0.020 * HEX_R)); }
function getRKPoleFit():   THREE.CylinderGeometry { return (gRKPoleFit   ||= new THREE.CylinderGeometry(0.021 * HEX_R, 0.021 * HEX_R, 0.030 * HEX_R, 6, 1, true)); }
function getRKYokeBar():   THREE.BoxGeometry { return (gRKYokeBar   ||= new THREE.BoxGeometry(RK_H_X * 2 + 0.086 * HEX_R, 0.022 * HEX_R, 0.024 * HEX_R)); }
function getRKYokeSdl():   THREE.BoxGeometry { return (gRKYokeSdl   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.038 * HEX_R, 0.030 * HEX_R)); }
function getRKGirth():     THREE.CylinderGeometry { return (gRKGirth     ||= new THREE.CylinderGeometry(RK_H_BARREL_R + 0.004 * HEX_R, RK_H_BARREL_R + 0.004 * HEX_R, 0.016 * HEX_R, 7, 1, true)); }
function getRKCase():      THREE.BoxGeometry { return (gRKCase      ||= new THREE.BoxGeometry(0.030 * HEX_R, 0.036 * HEX_R, 0.115 * HEX_R)); }
function getRKCaseRim():   THREE.BoxGeometry { return (gRKCaseRim   ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.014 * HEX_R, 0.022 * HEX_R)); }
function getRKSpearTip():  THREE.ConeGeometry { return (gRKSpearTip  ||= new THREE.ConeGeometry(0.016 * HEX_R, 0.052 * HEX_R, 4)); }
function getRKSpearSft():  THREE.CylinderGeometry { return (gRKSpearSft  ||= new THREE.CylinderGeometry(0.009 * HEX_R, 0.009 * HEX_R, 0.320 * HEX_R, 5, 1)); }
function getRKShield():    THREE.CylinderGeometry { return (gRKShield    ||= new THREE.CylinderGeometry(0.076 * HEX_R, 0.076 * HEX_R, 0.016 * HEX_R, 12, 1)); }
function getRKShieldBs():  THREE.CylinderGeometry { return (gRKShieldBs  ||= new THREE.CylinderGeometry(0.021 * HEX_R, 0.026 * HEX_R, 0.016 * HEX_R, 8, 1)); }
function getRKTorso():     THREE.BoxGeometry { return (gRKTorso     ||= new THREE.BoxGeometry(RK_TORSO_W, RK_TORSO_H, RK_TORSO_D)); }
function getRKKilt():      THREE.BoxGeometry { return (gRKKilt      ||= new THREE.BoxGeometry(RK_TORSO_W * 1.06, 0.072 * HEX_R, RK_TORSO_D * 1.10)); }
function getRKSash():      THREE.BoxGeometry { return (gRKSash      ||= new THREE.BoxGeometry(RK_TORSO_W * 1.08, 0.048 * HEX_R, RK_TORSO_D * 1.08)); }
function getRKNeck():      THREE.BoxGeometry { return (gRKNeck      ||= new THREE.BoxGeometry(0.042 * HEX_R, RK_NECK_H * 1.7, 0.042 * HEX_R)); }
function getRKHead():      THREE.BoxGeometry { return (gRKHead      ||= new THREE.BoxGeometry(RK_HEAD_S, RK_HEAD_S, RK_HEAD_S)); }
function getRKHair():      THREE.BoxGeometry { return (gRKHair      ||= new THREE.BoxGeometry(RK_HEAD_S * 1.04, RK_HEAD_S * 0.28, RK_HEAD_S * 1.04)); }
function getRKEye():       THREE.BoxGeometry { return (gRKEye       ||= new THREE.BoxGeometry(0.017 * HEX_R, 0.009 * HEX_R, 0.008 * HEX_R)); }
function getRKFist():      THREE.BoxGeometry { return (gRKFist      ||= new THREE.BoxGeometry(0.041 * HEX_R, 0.041 * HEX_R, 0.043 * HEX_R)); }
function getRKBarrel():    THREE.CylinderGeometry { return (gRKBarrel    ||= new THREE.CylinderGeometry(RK_H_BARREL_R * 0.94, RK_H_BARREL_R, RK_H_BARREL_L, 7, 1)); }
function getRKChest():     THREE.IcosahedronGeometry { return (gRKChest     ||= new THREE.IcosahedronGeometry(0.062 * HEX_R, 0)); }
function getRKRump():      THREE.IcosahedronGeometry { return (gRKRump      ||= new THREE.IcosahedronGeometry(0.060 * HEX_R, 0)); }
function getRKWithers():   THREE.BoxGeometry { return (gRKWithers   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.044 * HEX_R, 0.090 * HEX_R)); }
function getRKNeck1():     THREE.CylinderGeometry { return (gRKNeck1     ||= new THREE.CylinderGeometry(0.043 * HEX_R, 0.053 * HEX_R, 0.060 * HEX_R, 6, 1, true)); }
function getRKNeck2():     THREE.CylinderGeometry { return (gRKNeck2     ||= new THREE.CylinderGeometry(0.036 * HEX_R, 0.043 * HEX_R, 0.054 * HEX_R, 6, 1, true)); }
function getRKNeck3():     THREE.CylinderGeometry { return (gRKNeck3     ||= new THREE.CylinderGeometry(0.031 * HEX_R, 0.036 * HEX_R, 0.046 * HEX_R, 6, 1, true)); }
function getRKSkull():     THREE.BoxGeometry { return (gRKSkull     ||= new THREE.BoxGeometry(0.060 * HEX_R, 0.068 * HEX_R, 0.080 * HEX_R)); }
function getRKMuzzle():    THREE.CylinderGeometry { return (gRKMuzzle    ||= new THREE.CylinderGeometry(0.021 * HEX_R, 0.028 * HEX_R, 0.072 * HEX_R, 5, 1)); }
function getRKEar():       THREE.ConeGeometry { return (gRKEar       ||= new THREE.ConeGeometry(0.015 * HEX_R, 0.048 * HEX_R, 3)); }
function getRKMane():      THREE.BoxGeometry { return (gRKMane      ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.020 * HEX_R, 0.048 * HEX_R)); }
function getRKChrap():     THREE.BoxGeometry { return (gRKChrap     ||= new THREE.BoxGeometry(0.026 * HEX_R, 0.018 * HEX_R, 0.014 * HEX_R)); }
function getRKForelock():  THREE.BoxGeometry { return (gRKForelock  ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.040 * HEX_R, 0.016 * HEX_R)); }
function getRKHEye():      THREE.BoxGeometry { return (gRKHEye      ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.012 * HEX_R, 0.011 * HEX_R)); }
function getRKHoof():      THREE.BoxGeometry { return (gRKHoof      ||= new THREE.BoxGeometry(0.028 * HEX_R, 0.022 * HEX_R, 0.032 * HEX_R)); }
function getRKBit():       THREE.CylinderGeometry { return (gRKBit       ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.007 * HEX_R, 6, 1, true)); }

const RK_Y_UP = new THREE.Vector3(0, 1, 0);

/** Jednostkowy box rozciągnięty między A i B — dyszel, rzemienie, lejce, nogi.
 *  Konwencja przeniesiona 1:1 z rwStretch (braz-rydwan-woly-opus5.ts). */
function rkStretch(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getRKUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(RK_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

/**
 * KOŁO SZPRYCHOWE (K1) — 7 mesh: felga z giętego drewna (obręcz otwarta,
 * 12-boczna), opona ze skóry surowej, DWIE belki dające CZTERY szprychy,
 * wystająca piasta, brązowy pierścień piasty, brązowa zawleczka osi.
 * Oś wzdłuż X, więc tarcza koła leży w płaszczyźnie YZ.
 */
function rkWheel(
  group: THREE.Group, sx: number,
  mWood: THREE.MeshStandardMaterial, mTyre: THREE.MeshStandardMaterial,
  mBronze: THREE.MeshStandardMaterial, mBronzeDk: THREE.MeshStandardMaterial,
): void {
  const x = sx * RK_WHEEL_X;

  const felloe = new THREE.Mesh(getRKFelloe(), mWood);
  felloe.rotation.z = Math.PI / 2;
  felloe.position.set(x, RK_AXLE_Y, RK_AXLE_Z);
  group.add(felloe);

  const tyre = new THREE.Mesh(getRKTyre(), mTyre);
  tyre.rotation.z = Math.PI / 2;
  tyre.position.set(x, RK_AXLE_Y, RK_AXLE_Z);
  group.add(tyre);

  // CZTERY szprychy = dwie przecinające się belki w płaszczyźnie koła
  for (const rot of [0, Math.PI / 2]) {
    const spoke = new THREE.Mesh(getRKSpoke(), mWood);
    spoke.rotation.x = rot;
    spoke.position.set(x, RK_AXLE_Y, RK_AXLE_Z);
    group.add(spoke);
  }

  const nave = new THREE.Mesh(getRKNave(), mWood);   // piasta wystaje na zewnątrz
  nave.rotation.z = -sx * Math.PI / 2;
  nave.position.set(x + sx * 0.016 * HEX_R, RK_AXLE_Y, RK_AXLE_Z);
  group.add(nave);

  const ring = new THREE.Mesh(getRKNaveRing(), mBronze);
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x + sx * 0.006 * HEX_R, RK_AXLE_Y, RK_AXLE_Z);
  group.add(ring);

  const lynch = new THREE.Mesh(getRKLynch(), mBronzeDk);   // zawleczka osi
  lynch.position.set(x + sx * 0.034 * HEX_R, RK_AXLE_Y + 0.006 * HEX_R, RK_AXLE_Z);
  group.add(lynch);
}

/** Materiały konia — jeden pakiet, żeby nie ciągnąć siedmiu argumentów. */
interface RKHorseMats {
  body: THREE.MeshStandardMaterial;
  dark: THREE.MeshStandardMaterial;
  mane: THREE.MeshStandardMaterial;
  hoof: THREE.MeshStandardMaterial;
  muzzle: THREE.MeshStandardMaterial;
  eye: THREE.MeshStandardMaterial;
  leather: THREE.MeshStandardMaterial;
  leatherDk: THREE.MeshStandardMaterial;
  bronze: THREE.MeshStandardMaterial;
  wood: THREE.MeshStandardMaterial;
}

/** Noga konia: ramię/udo → nadpęcie → kopyto (3 mesh, staw zaznaczony kątem). */
function rkLeg(
  group: THREE.Group, m: RKHorseMats,
  x: number, topY: number, topZ: number,
  midY: number, midZ: number, hoofY: number, hoofZ: number,
): void {
  const top = new THREE.Vector3(x, topY, topZ);
  const mid = new THREE.Vector3(x, midY, midZ);
  const low = new THREE.Vector3(x, hoofY + 0.012 * HEX_R, hoofZ);
  rkStretch(group, m.body, top, mid, 0.032 * HEX_R, 0.038 * HEX_R);
  rkStretch(group, m.dark, mid, low, 0.019 * HEX_R, 0.022 * HEX_R);
  const hoof = new THREE.Mesh(getRKHoof(), m.hoof);
  hoof.position.set(x, hoofY, hoofZ);
  group.add(hoof);
}

/**
 * KOŃ ZAPRZĘGOWY (K4) — smukła beczka tułowia, wygięta w łuk szyja, łeb
 * niesiony WYSOKO (odwrotnie niż wół), cztery nogi ze stawami w kłusie,
 * grzywa i ogon prawie czarne. Uprząż: siodełko jarzmowe na kłębie, popręg
 * pod brzuchem, pasek napierśny, wędzidło. Przodem +Z.
 * Zwraca punkt wędzidła (pysk) — zaczep lejców.
 */
function rkHorse(group: THREE.Group, sx: number, lift: boolean, m: RKHorseMats): THREE.Vector3 {
  const x = sx * RK_H_X;

  // ── tułów ────────────────────────────────────────────────────────────────
  const barrel = new THREE.Mesh(getRKBarrel(), m.body);
  barrel.rotation.x = Math.PI / 2;
  barrel.position.set(x, RK_H_CTR_Y, RK_H_Z);
  group.add(barrel);
  const chest = new THREE.Mesh(getRKChest(), m.body);
  chest.position.set(x, RK_H_CTR_Y - 0.004 * HEX_R, RK_H_Z + RK_H_HALF * 0.86);
  group.add(chest);
  const rump = new THREE.Mesh(getRKRump(), m.body);
  rump.position.set(x, RK_H_CTR_Y + 0.006 * HEX_R, RK_H_Z - RK_H_HALF * 0.88);
  group.add(rump);
  const withers = new THREE.Mesh(getRKWithers(), m.body);
  withers.position.set(x, RK_H_BACK_Y - 0.014 * HEX_R, RK_H_Z + RK_H_HALF * 0.52);
  group.add(withers);

  // ── nogi w kłusie (przednia wewnętrzna uniesiona przy lift=true) ─────────
  const legX = 0.030 * HEX_R;
  const frontZ = RK_H_Z + RK_H_HALF * 0.66;
  const rearZ  = RK_H_Z - RK_H_HALF * 0.72;
  const shoulderY = RK_H_CTR_Y - 0.010 * HEX_R;
  for (const s of [-1, 1]) {
    const lx = x + s * legX;
    const raise = lift && s === -sx;      // jedna przednia noga w powietrzu
    if (raise) {
      rkLeg(group, m, lx, shoulderY, frontZ, 0.140 * HEX_R, frontZ + 0.040 * HEX_R,
        0.086 * HEX_R, frontZ + 0.086 * HEX_R);
    } else {
      rkLeg(group, m, lx, shoulderY, frontZ, 0.108 * HEX_R, frontZ + 0.012 * HEX_R,
        0.013 * HEX_R, frontZ + 0.018 * HEX_R);
    }
    // tylna: wyraźny staw skokowy odchylony do tyłu
    rkLeg(group, m, lx, RK_H_CTR_Y + 0.006 * HEX_R, rearZ, 0.116 * HEX_R, rearZ - 0.030 * HEX_R,
      0.013 * HEX_R, rearZ - 0.006 * HEX_R);
  }

  // ── szyja w ŁUKU KU GÓRZE: trzy zwężające się segmenty; kąt od pionu maleje
  //    (0.70 → 0.36 rad), więc szyja wznosi się i prostuje — dumna postawa
  //    konia bojowego, przeciwieństwo opuszczonego karku wołu.
  let p = new THREE.Vector3(x, RK_H_BACK_Y - 0.026 * HEX_R, RK_H_Z + RK_H_HALF * 0.94);
  const segs: [THREE.CylinderGeometry, number, number][] = [
    [getRKNeck1(), 0.70, 0.060 * HEX_R],
    [getRKNeck2(), 0.54, 0.054 * HEX_R],
    [getRKNeck3(), 0.36, 0.046 * HEX_R],
  ];
  for (const [geo, ang, len] of segs) {
    const dir = new THREE.Vector3(0, Math.cos(ang), Math.sin(ang));
    const nrm = new THREE.Vector3(0, Math.sin(ang), -Math.cos(ang));   // „w tył-górę"
    const ctr = p.clone().addScaledVector(dir, len * 0.5);
    const seg = new THREE.Mesh(geo, m.body);
    seg.rotation.x = ang;
    seg.position.copy(ctr);
    group.add(seg);
    const crest = new THREE.Mesh(getRKMane(), m.mane);    // grzywa przylegająca do karku
    crest.rotation.x = ang;
    crest.position.copy(ctr.clone().addScaledVector(nrm, 0.023 * HEX_R));
    group.add(crest);
    p = p.clone().addScaledVector(dir, len);
  }

  // ── ŁEB w podgrupie skręconej NA ZEWNĄTRZ (RK_HEAD_YAW) — czaszka pochylona
  //    pyskiem w dół-przód, ciemna chrapa, wysokie uszy, oko. Skręt sprawia,
  //    że przy ujęciu gry widać profil łba, a nie sam walec szyi od czoła.
  const headC = p.clone().add(new THREE.Vector3(0, -0.004 * HEX_R, 0.024 * HEX_R));
  const headG = new THREE.Group();
  headG.position.copy(headC);
  headG.rotation.y = -sx * RK_HEAD_YAW;
  group.add(headG);

  const skull = new THREE.Mesh(getRKSkull(), m.body);
  skull.rotation.x = -RK_SKULL_TILT;
  headG.add(skull);
  const muzDir = new THREE.Vector3(0, -Math.sin(RK_SKULL_TILT), Math.cos(RK_SKULL_TILT));
  const muzC = muzDir.clone().multiplyScalar(0.054 * HEX_R);
  const muzzle = new THREE.Mesh(getRKMuzzle(), m.body);
  muzzle.quaternion.setFromUnitVectors(RK_Y_UP, muzDir);
  muzzle.position.copy(muzC);
  headG.add(muzzle);
  const chrap = new THREE.Mesh(getRKChrap(), m.muzzle);      // ciemna chrapa
  chrap.quaternion.setFromUnitVectors(RK_Y_UP, muzDir);
  chrap.position.copy(muzDir.clone().multiplyScalar(0.086 * HEX_R));
  headG.add(chrap);
  const forelock = new THREE.Mesh(getRKForelock(), m.mane);
  forelock.position.set(0, 0.034 * HEX_R, 0.014 * HEX_R);
  headG.add(forelock);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(getRKEar(), m.body);
    ear.rotation.z = s * 0.26;
    ear.rotation.x = 0.06;                     // ucho lekko do przodu — sylwetka
    ear.position.set(s * 0.022 * HEX_R, 0.058 * HEX_R, 0.000);
    headG.add(ear);
    const eye = new THREE.Mesh(getRKHEye(), m.eye);
    eye.position.set(s * 0.030 * HEX_R, 0.012 * HEX_R, 0.020 * HEX_R);
    headG.add(eye);
  }

  // ── ogon: nasada uniesiona, potem spływ (2 mesh) ─────────────────────────
  const tailA = new THREE.Vector3(x, RK_H_CTR_Y + 0.030 * HEX_R, RK_H_Z - RK_H_HALF * 1.02);
  const tailB = tailA.clone().add(new THREE.Vector3(0, 0.004 * HEX_R, -0.040 * HEX_R));
  const tailC = tailB.clone().add(new THREE.Vector3(0, -0.130 * HEX_R, -0.026 * HEX_R));
  rkStretch(group, m.mane, tailA, tailB, 0.021 * HEX_R);
  rkStretch(group, m.mane, tailB, tailC, 0.024 * HEX_R, 0.018 * HEX_R);

  // ── UPRZĄŻ (K4): siodełko jarzmowe na kłębie + popręg + pasek napierśny ──
  const saddle = new THREE.Mesh(getRKYokeSdl(), m.wood);
  saddle.position.set(x, RK_YOKE_Y - 0.024 * HEX_R, RK_YOKE_Z);
  group.add(saddle);
  const girth = new THREE.Mesh(getRKGirth(), m.leatherDk);   // popręg pod brzuchem
  girth.rotation.x = Math.PI / 2;
  girth.position.set(x, RK_H_CTR_Y, RK_H_Z + RK_H_HALF * 0.30);
  group.add(girth);
  const breastA = new THREE.Vector3(x - 0.040 * HEX_R, RK_H_CTR_Y + 0.010 * HEX_R, RK_H_Z + RK_H_HALF * 0.82);
  const breastB = new THREE.Vector3(x + 0.040 * HEX_R, RK_H_CTR_Y + 0.010 * HEX_R, RK_H_Z + RK_H_HALF * 0.82);
  rkStretch(group, m.leather, breastA, breastB, 0.017 * HEX_R, 0.030 * HEX_R);
  // rzemień od siodełka do popręgu (podtrzymuje jarzmo)
  rkStretch(group, m.leatherDk,
    new THREE.Vector3(x, RK_YOKE_Y - 0.030 * HEX_R, RK_YOKE_Z),
    new THREE.Vector3(x, RK_H_CTR_Y - 0.010 * HEX_R, RK_H_Z + RK_H_HALF * 0.34), 0.014 * HEX_R);

  // ── ogłowie: policzkowy pasek + wędzidło (zaczep lejców) ────────────────
  const bitLocal = muzDir.clone().multiplyScalar(0.086 * HEX_R);
  rkStretch(headG, m.leather, new THREE.Vector3(0, 0.026 * HEX_R, 0), bitLocal, 0.010 * HEX_R);
  const bit = new THREE.Mesh(getRKBit(), m.bronze);
  bit.rotation.z = Math.PI / 2;
  bit.position.copy(bitLocal);
  headG.add(bit);

  // punkt wędzidła w układzie tokenu (headG nie jest jeszcze w scenie, więc
  // przekształcamy ręcznie tym samym obrotem Y, jaki dostała podgrupa łba)
  const bitP = bitLocal.clone()
    .applyAxisAngle(RK_Y_UP, headG.rotation.y)
    .add(headC);
  return bitP;
}

/**
 * FIGURA ZAŁOGI (K6/K7) — modelowana od bioder w górę (nogi za burtą skrzyni):
 * kilt lniany, tors, opcjonalna szarfa w kolorze gracza, szyja, głowa
 * z krótkimi włosami i oczami. Ramiona domykają wywołujący (różne pozy).
 */
function rkCrewBody(
  group: THREE.Group, x: number,
  mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  mLinen: THREE.MeshStandardMaterial, mHair: THREE.MeshStandardMaterial,
  mEye: THREE.MeshStandardMaterial, mSash: THREE.MeshStandardMaterial | null,
): void {
  const kilt = new THREE.Mesh(getRKKilt(), mLinen);
  kilt.position.set(x, RK_HIP_Y - 0.014 * HEX_R, RK_CREW_Z);
  group.add(kilt);
  const torso = new THREE.Mesh(getRKTorso(), mSkin);
  torso.position.set(x, RK_HIP_Y + RK_TORSO_H * 0.5, RK_CREW_Z);
  group.add(torso);
  if (mSash) {
    const sash = new THREE.Mesh(getRKSash(), mSash);
    sash.position.set(x, RK_HIP_Y + RK_TORSO_H * 0.62, RK_CREW_Z);
    group.add(sash);
  }
  const neck = new THREE.Mesh(getRKNeck(), mSkin);
  neck.position.set(x, RK_TORSO_TOP + RK_NECK_H * 0.5, RK_CREW_Z);
  group.add(neck);
  const head = new THREE.Mesh(getRKHead(), mSkin);
  head.position.set(x, RK_HEAD_CTR, RK_CREW_Z);
  group.add(head);
  const hair = new THREE.Mesh(getRKHair(), mHair);
  hair.position.set(x, RK_HEAD_CTR + RK_HEAD_S * 0.36, RK_CREW_Z - 0.004 * HEX_R);
  group.add(hair);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(getRKEye(), mEye);
    eye.position.set(x + s * 0.023 * HEX_R, RK_HEAD_CTR + 0.010 * HEX_R,
      RK_CREW_Z + RK_HEAD_S * 0.5 + 0.001 * HEX_R);
    group.add(eye);
  }
  void mSkinDk;
}

/** Ramię: bark → łokieć → dłoń (3 mesh). Zwraca pozycję pięści. */
function rkArm(
  group: THREE.Group, mSkin: THREE.MeshStandardMaterial, mSkinDk: THREE.MeshStandardMaterial,
  shoulder: THREE.Vector3, hand: THREE.Vector3, elbowOff: THREE.Vector3,
): THREE.Vector3 {
  const elbow = shoulder.clone().lerp(hand, 0.52).add(elbowOff);
  rkStretch(group, mSkin, shoulder, elbow, 0.047 * HEX_R);
  rkStretch(group, mSkin, elbow, hand, 0.036 * HEX_R);
  const fist = new THREE.Mesh(getRKFist(), mSkinDk);
  fist.position.copy(hand);
  group.add(fist);
  return hand;
}

// ---------------------------------------------------------------------------
// RYDWAN KONNY (War Chariot) — lekki dwukołowy rydwan bojowy Późnego Brązu.
// Front = +Z (kierunek jazdy, tam patrzą konie), spód kół i kopyt na y = 0.
// Dwa koła szprychowe z osią na tyle platformy (K1–K2), lekka skrzynia
// z ramy obciągniętej skórą, otwarta z tyłu (K3), para koni w jarzmie
// grzbietowym z siodełkami jarzmowymi (K4), długi dyszel biegnący pod
// podłogą do osi (K5), załoga: woźnica z lejcami + wojownik z włócznią
// i okrągłą tarczą (K6).
// ---------------------------------------------------------------------------
export function buildRydwanKonnyBrazOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mat = (color: number, metalness = 0.1, roughness = 0.7): THREE.MeshStandardMaterial => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats.push(m);
    return m;
  };

  const mWood     = mat(RK_WOOD,       0.06, 0.80);
  const mWoodDk   = mat(RK_WOOD_DK,    0.05, 0.86);
  const mHide     = mat(RK_HIDE,       0.04, 0.88);
  const mHideDk   = mat(RK_HIDE_DK,    0.04, 0.90);
  const mBronze   = mat(RK_BRONZE,     0.62, 0.36);
  const mBronzeDk = mat(RK_BRONZE_DK,  0.55, 0.46);
  const mLeather  = mat(RK_LEATHER,    0.05, 0.86);
  const mLeatherD = mat(RK_LEATHER_DK, 0.05, 0.88);
  const mSkin     = mat(RK_SKIN,       0.05, 0.80);
  const mSkinDk   = mat(RK_SKIN_DK,    0.05, 0.85);
  const mLinen    = mat(RK_LINEN,      0.03, 0.92);
  const mHair     = mat(RK_HAIR,       0.05, 0.88);
  const mEye      = mat(RK_EYE,        0.05, 0.86);
  const mHorse    = mat(RK_HORSE,      0.05, 0.84);
  const mHorseDk  = mat(RK_HORSE_DK,   0.05, 0.88);
  const mMane     = mat(RK_MANE,       0.05, 0.90);
  const mHoof     = mat(RK_HOOF,       0.10, 0.70);
  const mChrap    = mat(RK_MUZZLE,     0.05, 0.88);
  const mOwner    = mat(ownerColor_,   0.12, 0.70);

  // ═══ ZESPÓŁ JEZDNY: 2 KOŁA SZPRYCHOWE + OŚ NA TYLE (K1–K2) ═══════════════
  for (const sx of [-1, 1]) rkWheel(group, sx, mWood, mLeather, mBronze, mBronzeDk);
  const axle = new THREE.Mesh(getRKAxle(), mWoodDk);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, RK_AXLE_Y, RK_AXLE_Z);
  group.add(axle);

  // ═══ SKRZYNIA: podłoga rzemienna + burta do pasa, TYŁ OTWARTY (K3) ═══════
  const floor = new THREE.Mesh(getRKFloor(), mHideDk);
  floor.position.set(0, RK_FLOOR_Y, RK_FLOOR_ZC);
  group.add(floor);
  for (const dz of [-0.048, 0.020]) {
    const bar = new THREE.Mesh(getRKFloorBar(), mWood);   // poprzeczki ramy podłogi
    bar.position.set(0, RK_FLOOR_Y + 0.011 * HEX_R, RK_FLOOR_ZC + dz * HEX_R);
    group.add(bar);
  }
  // panel przedni obciągnięty skórą = KOLOR GRACZA (główny slot identyfikacji)
  const front = new THREE.Mesh(getRKFrontPan(), mOwner);
  front.position.set(0, RK_FLOOR_Y + RK_SIDE_H * 0.48, RK_FLOOR_FZ);
  group.add(front);
  const frontRail = new THREE.Mesh(getRKFrontRail(), mWood);   // gięta poręcz górna
  frontRail.position.set(0, RK_RAIL_Y, RK_FLOOR_FZ);
  group.add(frontRail);
  for (const sx of [-1, 1]) {
    const sidePan = new THREE.Mesh(getRKSidePan(), mHide);     // bok obciągnięty skórą
    sidePan.position.set(sx * RK_FLOOR_WID * 0.5, RK_FLOOR_Y + RK_SIDE_H * 0.45,
      RK_FLOOR_ZC + RK_FLOOR_LEN * 0.10);
    group.add(sidePan);
    const sideRail = new THREE.Mesh(getRKSideRail(), mWood);
    sideRail.position.set(sx * RK_FLOOR_WID * 0.5, RK_RAIL_Y, RK_FLOOR_ZC + RK_FLOOR_LEN * 0.08);
    group.add(sideRail);
    const post = new THREE.Mesh(getRKPost(), mWood);           // słupek narożny ramy
    post.position.set(sx * RK_FLOOR_WID * 0.5, RK_FLOOR_Y + RK_SIDE_H * 0.5, RK_FLOOR_FZ);
    group.add(post);
  }

  // ═══ FUTERAŁ NA WŁÓCZNIE ZAPASOWE, PRZYTROCZONY DO BURTY (+X) ════════════
  const CX = RK_FLOOR_WID * 0.5 + 0.018 * HEX_R;
  const CY = RK_FLOOR_Y + RK_SIDE_H * 0.62;
  const CZ = RK_FLOOR_ZC + 0.010 * HEX_R;
  const kase = new THREE.Mesh(getRKCase(), mLeather);
  kase.rotation.x = 0.10;
  kase.position.set(CX, CY, CZ);
  group.add(kase);
  const kaseRim = new THREE.Mesh(getRKCaseRim(), mLeatherD);
  kaseRim.position.set(CX, CY + 0.010 * HEX_R, CZ + 0.052 * HEX_R);
  group.add(kaseRim);
  for (const dx of [-0.008, 0.008]) {
    const A = new THREE.Vector3(CX + dx * HEX_R, CY + 0.020 * HEX_R, CZ + 0.050 * HEX_R);
    const B = A.clone().add(new THREE.Vector3(dx * 0.9 * HEX_R, 0.086 * HEX_R, 0.052 * HEX_R));
    rkStretch(group, mWoodDk, A, B, 0.010 * HEX_R);
    const tip = new THREE.Mesh(getRKSpearTip(), mBronze);
    tip.scale.set(0.62, 0.62, 0.62);
    tip.quaternion.setFromUnitVectors(RK_Y_UP, B.clone().sub(A).normalize());
    tip.position.copy(B.clone().addScaledVector(B.clone().sub(A).normalize(), 0.016 * HEX_R));
    group.add(tip);
  }

  // ═══ DYSZEL (K5): pod podłogą od osi, potem łukiem w górę do jarzma ══════
  const poleA = new THREE.Vector3(0, RK_AXLE_Y + 0.006 * HEX_R, RK_AXLE_Z);
  const poleB = new THREE.Vector3(0, RK_FLOOR_Y - 0.012 * HEX_R, RK_FLOOR_FZ + 0.030 * HEX_R);
  const poleC = new THREE.Vector3(0, RK_YOKE_Y, RK_YOKE_Z);
  rkStretch(group, mWoodDk, poleA, poleB, 0.024 * HEX_R);
  rkStretch(group, mWoodDk, poleB, poleC, 0.023 * HEX_R);
  const poleFit = new THREE.Mesh(getRKPoleFit(), mBronzeDk);   // okucie czoła dyszla
  poleFit.rotation.x = Math.PI / 2;
  poleFit.position.copy(poleC);
  group.add(poleFit);

  // ═══ JARZMO GRZBIETOWE (K4) ══════════════════════════════════════════════
  const yokeBar = new THREE.Mesh(getRKYokeBar(), mWoodDk);
  yokeBar.position.set(0, RK_YOKE_Y, RK_YOKE_Z);
  group.add(yokeBar);

  // ═══ PARA KONI — zwracają punkty wędzideł do lejców ══════════════════════
  const hm: RKHorseMats = {
    body: mHorse, dark: mHorseDk, mane: mMane, hoof: mHoof, muzzle: mChrap, eye: mEye,
    leather: mLeather, leatherDk: mLeatherD, bronze: mBronze, wood: mWood,
  };
  const bitL = rkHorse(group, -1, true,  hm);
  const bitR = rkHorse(group,  1, false, hm);

  // ═══ ZAŁOGA (K6): woźnica (+X) i wojownik z włócznią (-X) ════════════════
  rkCrewBody(group, RK_DRIVER_X, mSkin, mSkinDk, mLinen, mHair, mEye, mOwner);
  rkCrewBody(group, RK_FIGHTER_X, mSkin, mSkinDk, mLinen, mHair, mEye, null);

  // WOŹNICA: obie ręce wyciągnięte nisko w przód, lejce do obu wędzideł.
  for (const s of [-1, 1]) {
    const shoulder = new THREE.Vector3(RK_DRIVER_X + s * RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
    const hand = new THREE.Vector3(RK_DRIVER_X + s * 0.048 * HEX_R, RK_SHLD_Y - 0.086 * HEX_R,
      RK_CREW_Z + 0.104 * HEX_R);
    rkArm(group, mSkin, mSkinDk, shoulder, hand, new THREE.Vector3(s * 0.014 * HEX_R, 0, 0));
    rkStretch(group, mLeather, hand, s < 0 ? bitL : bitR, 0.009 * HEX_R);
  }

  // WOJOWNIK: prawa ręka z włócznią uniesioną do pchnięcia, lewa z tarczą.
  const shR = new THREE.Vector3(RK_FIGHTER_X + RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
  const handR = shR.clone().add(new THREE.Vector3(0.010 * HEX_R, 0.078 * HEX_R, 0.026 * HEX_R));
  rkArm(group, mSkin, mSkinDk, shR, handR, new THREE.Vector3(0.014 * HEX_R, -0.018 * HEX_R, 0));
  const spearDir = new THREE.Vector3(0.10, 0.90, 0.42).normalize();
  const spearTail = handR.clone().addScaledVector(spearDir, -0.120 * HEX_R);
  const shaft = new THREE.Mesh(getRKSpearSft(), mWoodDk);
  shaft.quaternion.setFromUnitVectors(RK_Y_UP, spearDir);
  shaft.position.copy(spearTail.clone().addScaledVector(spearDir, 0.160 * HEX_R));
  group.add(shaft);
  const spearTip = new THREE.Mesh(getRKSpearTip(), mBronze);
  spearTip.quaternion.setFromUnitVectors(RK_Y_UP, spearDir);
  spearTip.position.copy(spearTail.clone().addScaledVector(spearDir, 0.320 * HEX_R + 0.026 * HEX_R));
  group.add(spearTip);

  const shL = new THREE.Vector3(RK_FIGHTER_X - RK_SHLD_X, RK_SHLD_Y, RK_CREW_Z);
  const handL = shL.clone().add(new THREE.Vector3(-0.020 * HEX_R, -0.072 * HEX_R, 0.046 * HEX_R));
  rkArm(group, mSkin, mSkinDk, shL, handL, new THREE.Vector3(-0.016 * HEX_R, 0, 0));
  // okrągła tarcza na lewym przedramieniu — TARCZA = KOLOR GRACZA (drugi slot)
  const shieldC = handL.clone().add(new THREE.Vector3(-0.008 * HEX_R, 0.020 * HEX_R, 0.028 * HEX_R));
  const shield = new THREE.Mesh(getRKShield(), mOwner);
  shield.rotation.x = Math.PI / 2;
  shield.rotation.z = 0.16;
  shield.position.copy(shieldC);
  group.add(shield);
  const boss = new THREE.Mesh(getRKShieldBs(), mBronze);
  boss.rotation.x = Math.PI / 2;
  boss.position.copy(shieldC.clone().add(new THREE.Vector3(0, 0, 0.012 * HEX_R)));
  group.add(boss);

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

// ═══════════════════════════════════════════════════════════════════════════
/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazRydwanKonnyOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gRKUnit, gRKFelloe, gRKTyre, gRKSpoke, gRKNave, gRKNaveRing, gRKLynch, gRKAxle,
    gRKFloor, gRKFloorBar, gRKFrontPan, gRKFrontRail, gRKSidePan, gRKSideRail, gRKPost,
    gRKPoleFit, gRKYokeBar, gRKYokeSdl, gRKGirth, gRKCase, gRKCaseRim,
    gRKSpearTip, gRKSpearSft, gRKShield, gRKShieldBs,
    gRKTorso, gRKKilt, gRKSash, gRKNeck, gRKHead, gRKHair, gRKEye, gRKFist,
    gRKBarrel, gRKChest, gRKRump, gRKWithers, gRKNeck1, gRKNeck2, gRKNeck3,
    gRKSkull, gRKMuzzle, gRKEar, gRKMane, gRKForelock, gRKHEye, gRKHoof, gRKBit, gRKChrap,
  ];
  for (const g of all) { g?.dispose(); }
  gRKUnit = gRKFelloe = gRKTyre = gRKSpoke = gRKNave = gRKNaveRing = gRKLynch = gRKAxle = null;
  gRKFloor = gRKFloorBar = gRKFrontPan = gRKFrontRail = gRKSidePan = gRKSideRail = gRKPost = null;
  gRKPoleFit = gRKYokeBar = gRKYokeSdl = gRKGirth = gRKCase = gRKCaseRim = null;
  gRKSpearTip = gRKSpearSft = gRKShield = gRKShieldBs = null;
  gRKTorso = gRKKilt = gRKSash = gRKNeck = gRKHead = gRKHair = gRKEye = gRKFist = null;
  gRKBarrel = gRKChest = gRKRump = gRKWithers = gRKNeck1 = gRKNeck2 = gRKNeck3 = null;
  gRKSkull = gRKMuzzle = gRKEar = gRKMane = gRKForelock = gRKHEye = gRKHoof = gRKBit = null;
  gRKChrap = null;
}

// ===========================================================================
// BUDŻET I WYMIARY — mierzone traversem w harnessie
// gra/tools/.rydwan-konny-mockup (patrz raport końcowy zadania).
// ===========================================================================
