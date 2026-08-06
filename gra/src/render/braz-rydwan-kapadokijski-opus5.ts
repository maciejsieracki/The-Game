/**
 * braz-rydwan-kapadokijski-opus5.ts — RYDWAN KAPADOCKI / KAPADOKIJSKI
 * (Cappadocian Chariot), jednostka UNIKALNA HETYTÓW epoki BRĄZU
 * (units.json: „Rydwan Kapadokijski" / „Cappadocian Chariot", Epoka=„Brąz;Żelazo",
 * Kultura=Hetyci, Nacja=Hetyci, Tech=Jeździectwo, Klasa=Specjalna,
 * Typ=Mount, „W zamian za"/„Zastąp specjalnie" — jednostka narodowa).
 * ---------------------------------------------------------------------------
 * Drop-in zgodne z rodziną builderów `braz-*-opus5.ts`:
 *   buildRydwanKapadokijskiOpus5(ownerColor) : THREE.Group
 *   disposeBrazRydwanKapadokijskiOpus5Geometries() : void
 *
 * Konwencje serii (jak braz-rydwan-woly-opus5.ts / braz-taran-opus5.ts):
 *   - token PRZODEM do +Z (kierunek jazdy — tam patrzą konie i cała załoga),
 *     spód kół i kopyt na y = 0 grupy (ŻADNEGO group.rotation.y — model jest
 *     budowany od razu przodem do kamery, w odróżnieniu od generycznego
 *     `case 'rydwan'` w units.ts, który buduje tyłem i odwraca całość o 180°),
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie wspólne = SINGLETONY NA POZIOMIE MODUŁU; group.userData
 *     ['perTokenGeos'] zostaje PUSTE (nic, co niszczy `_disposeToken`,
 *     nie może trzymać współdzielonej geometrii),
 *   - group.userData['mats'] = materiały tego tokenu (per-token, bo jeden
 *     z nich niesie kolor gracza),
 *   - HEX_R = 1.0 z hexutil.ts; sylwetka ~0,75×HEX_R wysokości
 *     (najwyższy punkt = grot włóczni wojownika, patrz „WYMIARY" na końcu),
 *   - maksymalny promień poziomy ~0,64×HEX_R (twardy limit 0,866 — poza tym
 *     token wystaje poza obrys heksu),
 *   - kamera gry: elewacja 52°, patrzy z +Z — dlatego wszystko, co ma być
 *     rozpoznawalne (trzy sylwetki załogi, tarcza, łby koni), stoi w połowie
 *     przedniej tokenu.
 *
 * KOLOR GRACZA (sloty tintu, jak w całej serii): (1) POLE TARCZY ósemkowej
 * tarczownika — ten sam nośnik co w `buildPiechotaHetycka` (p8a), więc oddziały
 * hetyckie czytają się jako jedna linia; (2) skośna szarfa na torsie KAŻDEGO
 * z trzech członków załogi; (3) malowany pas na przednim panelu skrzyni.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * RAMA: państwo Hetytów (Ḫatti), stolica Ḫattuša w KAPADOCJI (środkowa
 * Anatolia) — stąd nazwa jednostki. Horyzont: późna epoka Brązu, XIV–XIII w.
 * p.n.e., kulminacja pod Kadesz (ok. 1274 p.n.e.), gdzie rydwan hetycki jest
 * NAJLEPIEJ UDOKUMENTOWANY — paradoksalnie przez reliefy EGIPSKIE (Abu Simbel,
 * Ramesseum, Luksor), bo to Egipcjanie utrwalili wygląd wroga.
 *
 * K1. ★ ZAŁOGA TRZYOSOBOWA — GŁÓWNY, DEFINIUJĄCY WYRÓŻNIK JEDNOSTKI.
 *     Reliefy Kadesz konsekwentnie pokazują rydwany hetyckie z TRZEMA ludźmi
 *     na platformie, podczas gdy egipskie mają DWÓCH (woźnica + łucznik),
 *     a mykeńskie/egejskie również dwóch. Skład hetyckiej trójki:
 *       (a) WOŹNICA (środek) — obie ręce na lejcach, bez broni w rękach,
 *       (b) WOJOWNIK (lewa strona, −X) — WŁÓCZNIA do pchnięcia, nie łuk,
 *       (c) TARCZOWNIK (prawa strona, +X) — duża tarcza ósemkowa trzymana
 *           WYSUNIĘTA DO PRZODU, osłaniająca pozostałą dwójkę.
 *     To nie jest kosmetyka, tylko inna DOKTRYNA: egipski rydwan to lekka
 *     ruchoma platforma strzelecka (ostrzał z dystansu, ucieczka przed
 *     kontaktem), hetycki — cięższy pojazd szturmowy, który dowozi
 *     włócznika do zwarcia; trzeci człowiek z tarczą jest potrzebny dokładnie
 *     dlatego, że pojazd wchodzi w kontakt. Dlatego w modelu włócznik trzyma
 *     WŁÓCZNIĘ, a nie łuk (łuk = rozpoznawalny atrybut rydwanu egipskiego,
 *     patrz buildEgyptianChariot w units.ts) — i dlatego tarcza jest wysunięta
 *     PRZED załogę, a nie zawieszona na burcie jak ozdoba.
 *     Zgodne z danymi jednostki w units.json: Atak wręcz 7 / Uderzenie 7,
 *     Atak dystansowy = 0 (rydwan hetycki NIE strzela), Ludność 2 (jedyny
 *     rydwan Brązu o koszcie 2 ludności — trzyosobowa załoga wprost).
 * K2. ★ OŚ POŚRODKU PLATFORMY (nie pod tylną krawędzią). Drugi rzeczywiście
 *     udokumentowany wyróżnik konstrukcyjny: egipski rydwan ma oś cofniętą
 *     pod sam TYŁ skrzyni (maksymalna zwrotność, minimalny ciężar na karkach
 *     koni), rydwan hetycki na reliefach ma oś PRZESUNIĘTĄ KU ŚRODKOWI —
 *     bo musi unieść trzeciego człowieka i jego tarczę. W modelu:
 *     CK_AXLE_Z == CK_BOX_ZC (oś dokładnie w geometrycznym środku podłogi),
 *     co przy oglądzie z boku widać jako koło „pod środkiem", nie „pod rufą".
 * K3. ★ SZERSZA PLATFORMA. CK_BOX_W = 0,440×HEX_R przy CK_BOX_LEN =
 *     0,320×HEX_R — skrzynia WYRAŹNIE SZERSZA NIŻ GŁĘBOKA i szersza od
 *     skrzyni generycznego rydwanu z units.ts (tam ~0,30×HEX_R), bo ma
 *     pomieścić trzech ludzi ramię w ramię. Proporcja „szeroka i płytka"
 *     jest zresztą właściwa wszystkim rydwanom bliskowschodnim epoki Brązu;
 *     tu jest tylko wyostrzona do granicy wymuszonej przez załogę.
 * K4. KOŁA SZPRYCHOWE, SZEŚĆ SZPRYCH, obręcz z surowej skóry na drewnianym
 *     dzwonie. Szprycha to technologia ok. 2000 p.n.e., wynaleziona właśnie
 *     dla lekkiego rydwanu konnego — jest tu jak najbardziej na miejscu
 *     (świadomy kontrast z „Rydwanem (woły)", braz-rydwan-woly-opus5.ts,
 *     który ma koła PEŁNE, bo jest o tysiąc lat wcześniejszy). Sześć szprych,
 *     nie cztery: reliefy Kadesz pokazują koła wielo-szprychowe, a sześć jest
 *     standardem późnej epoki Brązu na Bliskim Wschodzie.
 * K5. ZAPRZĘG: DWA KONIE (nie woły, nie onagry) pod JARZMEM z SIODEŁKAMI
 *     JARZMOWYMI (yoke saddles) opartymi na kłębie, plus PAS PIERSIOWY
 *     i POPRĘG. To poświadczona uprząż rydwanowa epoki Brązu. Świadomie
 *     BRAK CHOMĄTA (średniowiecze) i BRAK STRZEMION (późna starożytność) —
 *     oba byłyby anachronizmem. Konie mają DUMNIE WYGIĘTĄ SZYJĘ i wysoko
 *     niesiony łeb — czytelny kontrast z opuszczonym pod jarzmem łbem wołu
 *     z rydwanu wołowego. Hetyci byli zresztą znani z hodowli i tresury koni
 *     rydwanowych — zachował się hetycki traktat treningowy Kikkuliego
 *     (tabliczki z Ḫattušy), najstarszy znany podręcznik przygotowania koni.
 * K6. STRÓJ I UZBROJENIE ZAŁOGI — spójne z `buildPiechotaHetycka`
 *     (jednostki-p8a-bliskiwschod.ts), żeby cała armia hetycka wyglądała jak
 *     jedna armia: kremowa lniana tunika anatolijska + SZEROKI ciemny pas,
 *     BRĄZOWY HEŁM STOŻKOWY z nausznikami i OPADAJĄCYM KU KARKOWI
 *     pióropuszem, TARCZA ÓSEMKOWA (dwa loby) o polu w kolorze gracza.
 *     Woźnica bez pióropusza (praktyczny — nie walczy, tylko powozi).
 * K7. BRĄZ OSZCZĘDNIE I TYLKO TAM, GDZIE MIAŁ SENS: grot i stopka włóczni,
 *     hełmy, okucia piast, listwa wieńcząca przedni panel, okucie dyszla przy
 *     jarzmie, wędzidła. Reszta to drewno, skóra, plecionka i len.
 *     ŻADNEGO ŻELAZA — mimo że Hetytom przypisuje się wczesną metalurgię
 *     żelaza, w XIV–XIII w. p.n.e. żelazo było u nich materiałem rzadkim
 *     i prestiżowym (dary dyplomatyczne, przedmioty ceremonialne), a nie
 *     tworzywem uzbrojenia masowego. Rydwan bojowy = brąz.
 * K8. CZEGO ŚWIADOMIE NIE MA: łuku i kołczanu (to atrybut rydwanu
 *     EGIPSKIEGO — patrz K1), kos przy piastach (perska legenda epoki
 *     Żelaza — anachronizm w dwie strony), chomąta, strzemion, żelaza,
 *     insygniów rangi (proporzec/szarfa to slot KOLORU GRACZA — wymóg gry,
 *     nie oznaczenie dowódcy), czwartego konia (reliefy Kadesz pokazują
 *     zaprzęg dwukonny).
 *
 * ---------------------------------------------------------------------------
 * ROZRÓŻNIALNOŚĆ — co widać na pierwszy rzut oka wobec innych rydwanów w grze:
 *   GENERYK `case 'rydwan'` (units.ts ~L3160)  — JEDEN woźnica, wąska skrzynia,
 *     koło ze skrzyżowanymi „szprychami-krzyżakiem", łuk + kołczan na burcie.
 *   RYDWAN EGIPSKI (buildEgyptianChariot)      — DWÓCH ludzi, łucznik z
 *     napiętym łukiem, oś pod tyłem skrzyni.
 *   RYDWAN SUMERYJSKI (buildSumerianChariot)   — koła PEŁNE, bez szprych.
 *   RYDWAN (WOŁY) (braz-rydwan-woly-opus5)     — CZTERY koła pełne, woły,
 *     jeden woźnica.
 *   ★ RYDWAN KAPADOKIJSKI (ten plik)           — TRZY sylwetki na szerokiej
 *     platformie, wielka tarcza ósemkowa wysunięta przed załogę, włócznia
 *     (nie łuk), koło 6-szprychowe z osią POŚRODKU platformy.
 * ===========================================================================
 */

import * as THREE from 'three';
import { HEX_R } from './hexutil';

// ── PALETA ─────────────────────────────────────────────────────────────────
// Rdzeń wspólny z jednostki-p8a-bliskiwschod.ts (armia hetycka = jedna linia).
const CK_WOOD        = 0x7a5c3a;   // rama skrzyni, dzwony kół, dyszel, jarzmo
const CK_WOOD_DK     = 0x4a3018;   // oś, spoiny, cienie
const CK_WICKER      = 0x9a7a48;   // plecionka burt (jaśniejsza od ramy)
const CK_BRONZE      = 0xcf9234;   // BRĄZ — groty, hełmy, okucia
const CK_BRONZE_LT   = 0xd0a050;   // brąz polerowany (grot, listwa)
const CK_LEATHER     = 0x6b4a28;   // obręcze kół, rzemienie, uprząż
const CK_LEATHER_DK  = 0x53381e;   // pas, lejce, ciemniejsze rzemienie
const CK_LINEN       = 0xe8e0c8;   // tunika anatolijska (len)
const CK_SKIN        = 0xe0ac69;   // karnacja
const CK_SKIN_DK     = 0xb07f45;   // pięści/cień
const CK_DARK        = 0x20180f;   // pióropusz opadający
const CK_EYE         = 0x140f0a;
const CK_HORSE       = 0xa06c40;   // gniady koń rydwanowy (jasny — żeby łeb
                                   // odczytał się na tle ciemnego pojazdu)
const CK_HORSE_DK    = 0x2a1a0a;   // grzywa, ogon, chrapy
const CK_HOOF        = 0x3a2c1e;

// ── WYMIARY WIODĄCE ────────────────────────────────────────────────────────
// KOŁA (K4): dzwon 12-boczny; oś na apotemie obręczy => bieżnik dokładnie y=0.
const CK_WHEEL_R   = 0.098 * HEX_R;
const CK_TYRE_R    = CK_WHEEL_R + 0.006 * HEX_R;
const CK_AXLE_Y    = CK_TYRE_R * Math.cos(Math.PI / 12);
const CK_WHEEL_X   = 0.245 * HEX_R;
const CK_SPOKES    = 6;

// SKRZYNIA (K2 + K3): oś DOKŁADNIE w środku podłogi, skrzynia szersza niż głębsza.
const CK_BOX_W     = 0.440 * HEX_R;          // ← szerokość na TRZECH ludzi (K3)
const CK_BOX_LEN   = 0.320 * HEX_R;
const CK_BOX_ZC    = -0.040 * HEX_R;
const CK_AXLE_Z    = CK_BOX_ZC;              // ← K2: oś pośrodku, nie pod rufą
const CK_FLOOR_Y   = CK_AXLE_Y + 0.030 * HEX_R;
const CK_BOX_FZ    = CK_BOX_ZC + CK_BOX_LEN * 0.5;   // przednia krawędź
const CK_BOX_RZ    = CK_BOX_ZC - CK_BOX_LEN * 0.5;   // tylna krawędź (OTWARTA)
const CK_RAIL_TOP  = CK_FLOOR_Y + 0.160 * HEX_R;     // szczyt burty (do pasa)

// DYSZEL + JARZMO (K5) — jarzmo leży na kłębach koni, tuż przed łopatkami.
const CK_YOKE_Z    = 0.430 * HEX_R;
const CK_YOKE_Y    = 0.305 * HEX_R;

// KONIE (K5)
const CK_H_X        = 0.118 * HEX_R;         // rozstaw pary od osi pojazdu
const CK_H_Z        = 0.360 * HEX_R;         // środek tułowia
const CK_H_LEG      = 0.180 * HEX_R;
const CK_H_TORSO_H  = 0.120 * HEX_R;
const CK_H_TORSO_W  = 0.086 * HEX_R;
const CK_H_TORSO_L  = 0.210 * HEX_R;
const CK_H_CTR_Y    = CK_H_LEG + CK_H_TORSO_H * 0.5;
const CK_H_HALF_L   = CK_H_TORSO_L * 0.5;

// ZAŁOGA (K1) — proporcje rodziny BW_* z p8a przeskalowane CK_CS, żeby trzy
// sylwetki zmieściły się ramię w ramię na platformie CK_BOX_W.
const CK_CS         = 0.86;
const CK_C_TOR_W    = 0.180 * CK_CS * HEX_R;
const CK_C_TOR_H    = 0.205 * CK_CS * HEX_R;
const CK_C_TOR_D    = 0.100 * CK_CS * HEX_R;
const CK_C_TOR_BOT  = CK_FLOOR_Y + 0.240 * CK_CS * HEX_R;   // nogi kryte burtą
const CK_C_TOR_TOP  = CK_C_TOR_BOT + CK_C_TOR_H;
const CK_C_NECK_H   = 0.028 * CK_CS * HEX_R;
const CK_C_HEAD_S   = 0.128 * CK_CS * HEX_R;
const CK_C_HEAD_CTR = CK_C_TOR_TOP + CK_C_NECK_H + CK_C_HEAD_S * 0.5;
const CK_C_HEAD_TOP = CK_C_TOR_TOP + CK_C_NECK_H + CK_C_HEAD_S;
const CK_C_SHLD_X   = CK_C_TOR_W * 0.5 + 0.026 * HEX_R;
const CK_C_SHLD_Y   = CK_C_TOR_TOP - 0.021 * HEX_R;

// Stanowiska trzech ludzi na platformie (K1). Woźnica pośrodku i NAJBARDZIEJ
// z przodu (musi widzieć konie), wojownik i tarczownik pół kroku za nim.
const CK_POS_DRIVER = new THREE.Vector3(0.000 * HEX_R, 0, -0.012 * HEX_R);
const CK_POS_SPEAR  = new THREE.Vector3(-0.140 * HEX_R, 0, -0.088 * HEX_R);
const CK_POS_SHIELD = new THREE.Vector3(0.140 * HEX_R, 0, -0.078 * HEX_R);

// ── GEOMETRIE-SINGLETONY (poziom modułu — NIGDY per-token) ──────────────────
let gCKUnit:      THREE.BoxGeometry | null = null;   // 1×1×1 do ckStretch
let gCKFelloe:    THREE.CylinderGeometry | null = null;
let gCKTyre:      THREE.CylinderGeometry | null = null;
let gCKSpoke:     THREE.BoxGeometry | null = null;
let gCKHub:       THREE.CylinderGeometry | null = null;
let gCKHubRing:   THREE.CylinderGeometry | null = null;
let gCKAxle:      THREE.CylinderGeometry | null = null;
let gCKFloor:     THREE.BoxGeometry | null = null;
let gCKFrontPan:  THREE.BoxGeometry | null = null;
let gCKFrontBand: THREE.BoxGeometry | null = null;
let gCKFrontRail: THREE.BoxGeometry | null = null;
let gCKSidePan:   THREE.BoxGeometry | null = null;
let gCKSideRail:  THREE.BoxGeometry | null = null;
let gCKStud:      THREE.BoxGeometry | null = null;
let gCKYokeBar:   THREE.BoxGeometry | null = null;
let gCKYokeSaddle:THREE.BoxGeometry | null = null;
let gCKPoleFit:   THREE.CylinderGeometry | null = null;
// koń
let gCKHTorso:    THREE.BoxGeometry | null = null;
let gCKHRump:     THREE.BoxGeometry | null = null;
let gCKHSkull:    THREE.BoxGeometry | null = null;
let gCKHMuzzle:   THREE.BoxGeometry | null = null;
let gCKHEar:      THREE.BoxGeometry | null = null;
let gCKHHoof:     THREE.BoxGeometry | null = null;
let gCKHEye:      THREE.BoxGeometry | null = null;
let gCKHBit:      THREE.CylinderGeometry | null = null;
// załoga
let gCKTorso:     THREE.BoxGeometry | null = null;
let gCKSkirt:     THREE.BoxGeometry | null = null;
let gCKBelt:      THREE.BoxGeometry | null = null;
let gCKSash:      THREE.BoxGeometry | null = null;
let gCKNeck:      THREE.BoxGeometry | null = null;
let gCKHead:      THREE.BoxGeometry | null = null;
let gCKEye:       THREE.BoxGeometry | null = null;
let gCKFist:      THREE.BoxGeometry | null = null;
let gCKHelm:      THREE.CylinderGeometry | null = null;
let gCKHelmRim:   THREE.CylinderGeometry | null = null;
let gCKCheek:     THREE.BoxGeometry | null = null;
let gCKPlumeTop:  THREE.BoxGeometry | null = null;
let gCKPlumeFall: THREE.BoxGeometry | null = null;
// broń / tarcza
let gCKSpShaft:   THREE.CylinderGeometry | null = null;
let gCKSpTip:     THREE.ConeGeometry | null = null;
let gCKSpButt:    THREE.CylinderGeometry | null = null;
let gCKSpCollar:  THREE.CylinderGeometry | null = null;
let gCKFig8Shell: THREE.CylinderGeometry | null = null;
let gCKFig8Face:  THREE.CylinderGeometry | null = null;

function getCKUnit():      THREE.BoxGeometry      { return (gCKUnit      ||= new THREE.BoxGeometry(1, 1, 1)); }
function getCKFelloe():    THREE.CylinderGeometry { return (gCKFelloe    ||= new THREE.CylinderGeometry(CK_WHEEL_R, CK_WHEEL_R, 0.026 * HEX_R, 12, 1, true)); }
function getCKTyre():      THREE.CylinderGeometry { return (gCKTyre      ||= new THREE.CylinderGeometry(CK_TYRE_R, CK_TYRE_R, 0.038 * HEX_R, 12, 1, true)); }
function getCKSpoke():     THREE.BoxGeometry      { return (gCKSpoke     ||= new THREE.BoxGeometry(0.014 * HEX_R, CK_WHEEL_R * 1.94, 0.014 * HEX_R)); }
function getCKHub():       THREE.CylinderGeometry { return (gCKHub       ||= new THREE.CylinderGeometry(0.020 * HEX_R, 0.024 * HEX_R, 0.040 * HEX_R, 8, 1)); }
function getCKHubRing():   THREE.CylinderGeometry { return (gCKHubRing   ||= new THREE.CylinderGeometry(0.026 * HEX_R, 0.026 * HEX_R, 0.010 * HEX_R, 8, 1, true)); }
function getCKAxle():      THREE.CylinderGeometry { return (gCKAxle      ||= new THREE.CylinderGeometry(0.012 * HEX_R, 0.012 * HEX_R, CK_WHEEL_X * 2, 6, 1)); }
function getCKFloor():     THREE.BoxGeometry      { return (gCKFloor     ||= new THREE.BoxGeometry(CK_BOX_W, 0.016 * HEX_R, CK_BOX_LEN)); }
function getCKFrontPan():  THREE.BoxGeometry      { return (gCKFrontPan  ||= new THREE.BoxGeometry(CK_BOX_W, CK_RAIL_TOP - CK_FLOOR_Y, 0.018 * HEX_R)); }
function getCKFrontBand(): THREE.BoxGeometry      { return (gCKFrontBand ||= new THREE.BoxGeometry(CK_BOX_W * 0.82, 0.042 * HEX_R, 0.008 * HEX_R)); }
function getCKFrontRail(): THREE.BoxGeometry      { return (gCKFrontRail ||= new THREE.BoxGeometry(CK_BOX_W + 0.010 * HEX_R, 0.016 * HEX_R, 0.028 * HEX_R)); }
function getCKSidePan():   THREE.BoxGeometry      { return (gCKSidePan   ||= new THREE.BoxGeometry(0.016 * HEX_R, CK_RAIL_TOP - CK_FLOOR_Y, CK_BOX_LEN * 0.78)); }
function getCKSideRail():  THREE.BoxGeometry      { return (gCKSideRail  ||= new THREE.BoxGeometry(0.024 * HEX_R, 0.016 * HEX_R, CK_BOX_LEN * 0.80)); }
function getCKStud():      THREE.BoxGeometry      { return (gCKStud      ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.016 * HEX_R, 0.008 * HEX_R)); }
function getCKYokeBar():   THREE.BoxGeometry      { return (gCKYokeBar   ||= new THREE.BoxGeometry(CK_H_X * 2 + 0.086 * HEX_R, 0.020 * HEX_R, 0.024 * HEX_R)); }
function getCKYokeSaddle():THREE.BoxGeometry      { return (gCKYokeSaddle||= new THREE.BoxGeometry(0.048 * HEX_R, 0.026 * HEX_R, 0.052 * HEX_R)); }
function getCKPoleFit():   THREE.CylinderGeometry { return (gCKPoleFit   ||= new THREE.CylinderGeometry(0.019 * HEX_R, 0.019 * HEX_R, 0.030 * HEX_R, 6, 1, true)); }
function getCKHTorso():    THREE.BoxGeometry      { return (gCKHTorso    ||= new THREE.BoxGeometry(CK_H_TORSO_W, CK_H_TORSO_H, CK_H_TORSO_L)); }
function getCKHRump():     THREE.BoxGeometry      { return (gCKHRump     ||= new THREE.BoxGeometry(CK_H_TORSO_W * 1.06, CK_H_TORSO_H * 0.92, 0.060 * HEX_R)); }
function getCKHSkull():    THREE.BoxGeometry      { return (gCKHSkull    ||= new THREE.BoxGeometry(0.062 * HEX_R, 0.072 * HEX_R, 0.084 * HEX_R)); }
function getCKHMuzzle():   THREE.BoxGeometry      { return (gCKHMuzzle   ||= new THREE.BoxGeometry(0.050 * HEX_R, 0.046 * HEX_R, 0.048 * HEX_R)); }
function getCKHEar():      THREE.BoxGeometry      { return (gCKHEar      ||= new THREE.BoxGeometry(0.013 * HEX_R, 0.036 * HEX_R, 0.013 * HEX_R)); }
function getCKHHoof():     THREE.BoxGeometry      { return (gCKHHoof     ||= new THREE.BoxGeometry(0.032 * HEX_R, 0.024 * HEX_R, 0.036 * HEX_R)); }
function getCKHEye():      THREE.BoxGeometry      { return (gCKHEye      ||= new THREE.BoxGeometry(0.010 * HEX_R, 0.010 * HEX_R, 0.008 * HEX_R)); }
function getCKHBit():      THREE.CylinderGeometry { return (gCKHBit      ||= new THREE.CylinderGeometry(0.009 * HEX_R, 0.009 * HEX_R, 0.052 * HEX_R, 6, 1, true)); }
function getCKTorso():     THREE.BoxGeometry      { return (gCKTorso     ||= new THREE.BoxGeometry(CK_C_TOR_W, CK_C_TOR_H, CK_C_TOR_D)); }
function getCKSkirt():     THREE.BoxGeometry      { return (gCKSkirt     ||= new THREE.BoxGeometry(CK_C_TOR_W * 1.06, 0.070 * HEX_R, CK_C_TOR_D * 1.10)); }
function getCKBelt():      THREE.BoxGeometry      { return (gCKBelt      ||= new THREE.BoxGeometry(CK_C_TOR_W * 1.09, 0.028 * HEX_R, CK_C_TOR_D * 1.12)); }
function getCKSash():      THREE.BoxGeometry      { return (gCKSash      ||= new THREE.BoxGeometry(CK_C_TOR_W * 1.24, 0.034 * HEX_R, 0.010 * HEX_R)); }
function getCKNeck():      THREE.BoxGeometry      { return (gCKNeck      ||= new THREE.BoxGeometry(0.042 * HEX_R, CK_C_NECK_H * 1.7, 0.042 * HEX_R)); }
function getCKHead():      THREE.BoxGeometry      { return (gCKHead      ||= new THREE.BoxGeometry(CK_C_HEAD_S, CK_C_HEAD_S, CK_C_HEAD_S)); }
function getCKEye():       THREE.BoxGeometry      { return (gCKEye       ||= new THREE.BoxGeometry(0.016 * HEX_R, 0.009 * HEX_R, 0.008 * HEX_R)); }
function getCKFist():      THREE.BoxGeometry      { return (gCKFist      ||= new THREE.BoxGeometry(0.040 * HEX_R, 0.040 * HEX_R, 0.042 * HEX_R)); }
function getCKHelm():      THREE.CylinderGeometry { return (gCKHelm      ||= new THREE.CylinderGeometry(0.006 * HEX_R, CK_C_HEAD_S * 0.60, 0.082 * HEX_R, 8, 1)); }
function getCKHelmRim():   THREE.CylinderGeometry { return (gCKHelmRim   ||= new THREE.CylinderGeometry(CK_C_HEAD_S * 0.62, CK_C_HEAD_S * 0.62, 0.016 * HEX_R, 8, 1, true)); }
function getCKCheek():     THREE.BoxGeometry      { return (gCKCheek     ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.048 * HEX_R, 0.052 * HEX_R)); }
function getCKPlumeTop():  THREE.BoxGeometry      { return (gCKPlumeTop  ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.030 * HEX_R, 0.030 * HEX_R)); }
function getCKPlumeFall(): THREE.BoxGeometry      { return (gCKPlumeFall ||= new THREE.BoxGeometry(0.022 * HEX_R, 0.110 * HEX_R, 0.026 * HEX_R)); }
function getCKSpShaft():   THREE.CylinderGeometry { return (gCKSpShaft   ||= new THREE.CylinderGeometry(0.011 * HEX_R, 0.011 * HEX_R, 0.400 * HEX_R, 6, 1)); }
function getCKSpTip():     THREE.ConeGeometry     { return (gCKSpTip     ||= new THREE.ConeGeometry(0.019 * HEX_R, 0.062 * HEX_R, 4)); }
function getCKSpButt():    THREE.CylinderGeometry { return (gCKSpButt    ||= new THREE.CylinderGeometry(0.008 * HEX_R, 0.013 * HEX_R, 0.030 * HEX_R, 5, 1)); }
function getCKSpCollar():  THREE.CylinderGeometry { return (gCKSpCollar  ||= new THREE.CylinderGeometry(0.014 * HEX_R, 0.014 * HEX_R, 0.020 * HEX_R, 6, 1, true)); }
function getCKFig8Shell(): THREE.CylinderGeometry { return (gCKFig8Shell ||= new THREE.CylinderGeometry(0.092 * HEX_R, 0.092 * HEX_R, 0.024 * HEX_R, 10, 1)); }
function getCKFig8Face():  THREE.CylinderGeometry { return (gCKFig8Face  ||= new THREE.CylinderGeometry(0.076 * HEX_R, 0.076 * HEX_R, 0.012 * HEX_R, 10, 1)); }

const CK_Y_UP = new THREE.Vector3(0, 1, 0);

type CKMat = THREE.MeshStandardMaterial;

/** Materiały jednego tokenu — jeden zestaw, przekazywany do podbuilderów. */
interface CKMats {
  wood: CKMat; woodDk: CKMat; wicker: CKMat;
  bronze: CKMat; bronzeLt: CKMat;
  leather: CKMat; leatherDk: CKMat;
  linen: CKMat; skin: CKMat; skinDk: CKMat; dark: CKMat; eye: CKMat;
  horse: CKMat; horseDk: CKMat; hoof: CKMat;
  owner: CKMat;
}

/**
 * Jednostkowy box rozciągnięty między A i B — kończyny, lejce, dyszel, nogi
 * i szyje koni. Konwencja identyczna z rwStretch / nbStretch w serii.
 */
function ckStretch(
  parent: THREE.Object3D, mtl: CKMat,
  A: THREE.Vector3, B: THREE.Vector3, w: number, d?: number,
): THREE.Mesh {
  const v = B.clone().sub(A);
  const len = v.length();
  const D = v.clone().normalize();
  const mesh = new THREE.Mesh(getCKUnit(), mtl);
  mesh.scale.set(w, len, d ?? w);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(CK_Y_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  parent.add(mesh);
  return mesh;
}

// ---------------------------------------------------------------------------
// KOŁO SZPRYCHOWE (K4) — dzwon + obręcz skórzana + 6 szprych + piasta z
// brązowym pierścieniem. Świadomy kontrast z pełnym kołem rydwanu wołowego.
// ---------------------------------------------------------------------------
function ckWheel(group: THREE.Group, sx: number, M: CKMats): void {
  const x = sx * CK_WHEEL_X;

  const felloe = new THREE.Mesh(getCKFelloe(), M.wood);
  felloe.rotation.z = Math.PI / 2;
  felloe.position.set(x, CK_AXLE_Y, CK_AXLE_Z);
  group.add(felloe);

  // Obręcz ze SKÓRY SUROWEJ, świadomie ciemniejsza od dzwonu i wyraźnie grubsza
  // niż w pierwszej wersji: z kamery gry (52°, patrzy z +Z) koło pojazdu
  // jadącego NA WPROST widać wyłącznie krawędzią — cienki, jasny wieniec
  // znikał na tle skrzyni. Gruby ciemny wieniec czyta się jako koło.
  const tyre = new THREE.Mesh(getCKTyre(), M.leatherDk);
  tyre.rotation.z = Math.PI / 2;
  tyre.position.set(x, CK_AXLE_Y, CK_AXLE_Z);
  group.add(tyre);

  // 6 szprych = 3 belki przechodzące przez piastę, obrócone co 60°
  for (let i = 0; i < CK_SPOKES / 2; i++) {
    const sp = new THREE.Mesh(getCKSpoke(), M.wood);
    sp.rotation.z = Math.PI / 2;                       // płaszczyzna koła = YZ
    sp.rotation.x = (i * Math.PI) / (CK_SPOKES / 2);
    sp.position.set(x, CK_AXLE_Y, CK_AXLE_Z);
    group.add(sp);
  }

  const hub = new THREE.Mesh(getCKHub(), M.wood);
  hub.rotation.z = -sx * Math.PI / 2;
  hub.position.set(x + sx * 0.013 * HEX_R, CK_AXLE_Y, CK_AXLE_Z);
  group.add(hub);

  const ring = new THREE.Mesh(getCKHubRing(), M.bronze);
  ring.rotation.z = Math.PI / 2;
  ring.position.set(x + sx * 0.020 * HEX_R, CK_AXLE_Y, CK_AXLE_Z);
  group.add(ring);
}

// ---------------------------------------------------------------------------
// KOŃ RYDWANOWY (K5) — tułów + zad, cztery nogi z kopytami, DUMNIE WYGIĘTA
// szyja, łeb z chrapami/uszami/oczami, grzywa, ogon, uprząż epoki Brązu
// (pas piersiowy + popręg, BEZ chomąta i strzemion), wędzidło.
// Zwraca punkt zaczepu lejców (wędzidło).
// ---------------------------------------------------------------------------
function ckHorse(group: THREE.Group, sx: number, M: CKMats): THREE.Vector3 {
  const x = sx * CK_H_X;
  const frontZ = CK_H_Z + CK_H_HALF_L;
  const rearZ = CK_H_Z - CK_H_HALF_L;

  const torso = new THREE.Mesh(getCKHTorso(), M.horse);
  torso.position.set(x, CK_H_CTR_Y, CK_H_Z);
  group.add(torso);

  const rump = new THREE.Mesh(getCKHRump(), M.horse);
  rump.position.set(x, CK_H_CTR_Y + 0.006 * HEX_R, rearZ - 0.018 * HEX_R);
  group.add(rump);

  // nogi: przednie wyprostowane, tylne lekko odchylone (koń w kłusie)
  const legTopY = CK_H_CTR_Y - CK_H_TORSO_H * 0.5;
  for (const [lz, tilt] of [[frontZ - 0.036 * HEX_R, 0.030], [rearZ + 0.032 * HEX_R, -0.034]] as [number, number][]) {
    for (const lx of [-0.026, 0.026]) {
      const top = new THREE.Vector3(x + lx * HEX_R, legTopY, lz);
      const bot = new THREE.Vector3(x + lx * HEX_R, 0.016 * HEX_R, lz + tilt * HEX_R);
      ckStretch(group, M.horse, top, bot, 0.028 * HEX_R, 0.032 * HEX_R);
      const hoof = new THREE.Mesh(getCKHHoof(), M.hoof);
      hoof.position.set(x + lx * HEX_R, 0.014 * HEX_R, lz + tilt * HEX_R);
      group.add(hoof);
    }
  }

  // SZYJA WYGIĘTA W GÓRĘ (kontrast z opuszczonym łbem wołu) — dwa segmenty.
  // Szyja świadomie SMUKLEJSZA niż w pierwszej wersji: gruby wałek zasłaniał
  // łeb przy oglądzie z góry (kamera 52°) i para koni czytała się jako jedna
  // ciemna bryła bez głów.
  const neckA = new THREE.Vector3(x, CK_H_CTR_Y + CK_H_TORSO_H * 0.34, frontZ - 0.012 * HEX_R);
  const neckB = new THREE.Vector3(x, CK_H_CTR_Y + 0.098 * HEX_R, frontZ + 0.040 * HEX_R);
  const neckC = new THREE.Vector3(x, CK_H_CTR_Y + 0.128 * HEX_R, frontZ + 0.070 * HEX_R);
  ckStretch(group, M.horse, neckA, neckB, 0.046 * HEX_R, 0.052 * HEX_R);
  ckStretch(group, M.horse, neckB, neckC, 0.038 * HEX_R, 0.044 * HEX_R);

  // GRZYWA wzdłuż karku — celowo szeroka i ciemna: z kamery 52° widzi się
  // kark koni OD GÓRY, więc to grzywa (a nie bok szyi) jest tym, co rozdziela
  // dwa zwierzęta i mówi „to koń", zamiast dwóch jasnych słupków.
  ckStretch(group, M.horseDk,
    neckA.clone().add(new THREE.Vector3(0, 0.022 * HEX_R, -0.014 * HEX_R)),
    neckC.clone().add(new THREE.Vector3(0, 0.018 * HEX_R, -0.012 * HEX_R)),
    0.030 * HEX_R, 0.030 * HEX_R);

  // łeb: WYSUNIĘTY DO PRZODU i pochylony w dół spod wygiętej szyi — tak, żeby
  // przy patrzeniu z góry-przodu (kamera gry) wystawał PRZED sylwetkę szyi
  const headC = neckC.clone().add(new THREE.Vector3(0, -0.022 * HEX_R, 0.048 * HEX_R));
  const skull = new THREE.Mesh(getCKHSkull(), M.horse);
  skull.rotation.x = 0.42;
  skull.position.copy(headC);
  group.add(skull);
  // CIEMNE CHRAPY (gniady koń ma czarny pysk) — z kamery gry łeb konia jadącego
  // NA WPROST jest mocno skrócony perspektywicznie; ciemny pysk na końcu jasnej
  // szyi jest jedynym elementem, który jednoznacznie kończy sylwetkę „to głowa".
  const muzzle = new THREE.Mesh(getCKHMuzzle(), M.horseDk);
  muzzle.position.copy(headC.clone().add(new THREE.Vector3(0, -0.034 * HEX_R, 0.038 * HEX_R)));
  group.add(muzzle);
  const noseband = new THREE.Mesh(getCKHBit(), M.leatherDk);   // nachrapnik uprzęży
  noseband.rotation.z = Math.PI / 2;
  noseband.position.copy(headC.clone().add(new THREE.Vector3(0, -0.010 * HEX_R, 0.030 * HEX_R)));
  group.add(noseband);
  for (const s of [-1, 1]) {
    const ear = new THREE.Mesh(getCKHEar(), M.horseDk);
    ear.rotation.z = s * 0.28;
    ear.position.copy(headC.clone().add(new THREE.Vector3(s * 0.024 * HEX_R, 0.052 * HEX_R, -0.026 * HEX_R)));
    group.add(ear);
    const eye = new THREE.Mesh(getCKHEye(), M.eye);
    eye.position.copy(headC.clone().add(new THREE.Vector3(s * 0.031 * HEX_R, 0.006 * HEX_R, 0.024 * HEX_R)));
    group.add(eye);
  }

  // WĘDZIDŁO (brąz) + nachrapnik — punkt zaczepu lejców
  const bitP = headC.clone().add(new THREE.Vector3(0, -0.030 * HEX_R, 0.032 * HEX_R));
  const bit = new THREE.Mesh(getCKHBit(), M.bronze);
  bit.rotation.z = Math.PI / 2;
  bit.position.copy(bitP);
  group.add(bit);

  // ogon
  const tailA = new THREE.Vector3(x, CK_H_CTR_Y + CK_H_TORSO_H * 0.34, rearZ - 0.034 * HEX_R);
  ckStretch(group, M.horseDk, tailA,
    tailA.clone().add(new THREE.Vector3(0, -0.120 * HEX_R, -0.026 * HEX_R)), 0.020 * HEX_R);

  // UPRZĄŻ EPOKI BRĄZU (K5): pas piersiowy + popręg. Bez chomąta, bez strzemion.
  ckStretch(group, M.leatherDk,
    new THREE.Vector3(x - CK_H_TORSO_W * 0.5, CK_H_CTR_Y + 0.010 * HEX_R, frontZ - 0.004 * HEX_R),
    new THREE.Vector3(x + CK_H_TORSO_W * 0.5, CK_H_CTR_Y + 0.010 * HEX_R, frontZ - 0.004 * HEX_R),
    0.014 * HEX_R, 0.016 * HEX_R);
  ckStretch(group, M.leatherDk,
    new THREE.Vector3(x - CK_H_TORSO_W * 0.52, CK_H_CTR_Y, CK_H_Z + 0.010 * HEX_R),
    new THREE.Vector3(x + CK_H_TORSO_W * 0.52, CK_H_CTR_Y, CK_H_Z + 0.010 * HEX_R),
    0.012 * HEX_R, CK_H_TORSO_H * 0.92);

  return bitP;
}

/** Wynik budowy tułowia członka załogi — punkty barków do zawieszenia rąk. */
interface CKCrew { shldL: THREE.Vector3; shldR: THREE.Vector3; }

/**
 * KORPUS CZŁONKA ZAŁOGI (K1 + K6) — tunika lniana, szeroki pas, szarfa w
 * kolorze gracza, hełm stożkowy z nausznikami (+ opadający pióropusz dla
 * dwóch walczących; woźnica bez pióropusza). Nóg NIE MA świadomie: burta
 * skrzyni sięga powyżej bioder, więc nogi byłyby niewidoczne z każdego kąta
 * kamery gry — to ten sam zabieg co u woźnicy rydwanu wołowego.
 */
function ckCrewman(group: THREE.Group, M: CKMats, at: THREE.Vector3, plume: boolean): CKCrew {
  const X = at.x, Z = at.z;

  const torso = new THREE.Mesh(getCKTorso(), M.linen);
  torso.position.set(X, CK_C_TOR_BOT + CK_C_TOR_H * 0.5, Z);
  group.add(torso);

  const skirt = new THREE.Mesh(getCKSkirt(), M.linen);        // krótka spódnica anatolijska
  skirt.position.set(X, CK_C_TOR_BOT - 0.020 * HEX_R, Z);
  group.add(skirt);

  const belt = new THREE.Mesh(getCKBelt(), M.leatherDk);      // SZEROKI pas hetycki
  belt.position.set(X, CK_C_TOR_BOT + 0.016 * HEX_R, Z);
  group.add(belt);

  const sash = new THREE.Mesh(getCKSash(), M.owner);          // ← KOLOR GRACZA
  sash.rotation.z = 0.62;
  sash.position.set(X, CK_C_TOR_BOT + CK_C_TOR_H * 0.55, Z + CK_C_TOR_D * 0.5 + 0.004 * HEX_R);
  group.add(sash);

  const neck = new THREE.Mesh(getCKNeck(), M.skin);
  neck.position.set(X, CK_C_TOR_TOP + CK_C_NECK_H * 0.5, Z);
  group.add(neck);

  const head = new THREE.Mesh(getCKHead(), M.skin);
  head.position.set(X, CK_C_HEAD_CTR, Z);
  group.add(head);
  for (const s of [-1, 1]) {
    const eye = new THREE.Mesh(getCKEye(), M.eye);
    eye.position.set(X + s * 0.024 * HEX_R, CK_C_HEAD_CTR + 0.006 * HEX_R, Z + CK_C_HEAD_S * 0.5 + 0.001 * HEX_R);
    group.add(eye);
  }

  // HEŁM STOŻKOWY Z BRĄZU + rant + nauszniki (K6)
  const helm = new THREE.Mesh(getCKHelm(), M.bronze);
  helm.position.set(X, CK_C_HEAD_TOP + 0.020 * HEX_R, Z);
  group.add(helm);
  const rim = new THREE.Mesh(getCKHelmRim(), M.bronzeLt);
  rim.position.set(X, CK_C_HEAD_CTR + CK_C_HEAD_S * 0.34, Z);
  group.add(rim);
  for (const s of [-1, 1]) {
    const cheek = new THREE.Mesh(getCKCheek(), M.bronze);
    cheek.position.set(X + s * (CK_C_HEAD_S * 0.5 + 0.004 * HEX_R), CK_C_HEAD_CTR - 0.012 * HEX_R, Z + 0.010 * HEX_R);
    group.add(cheek);
  }
  if (plume) {
    const top = new THREE.Mesh(getCKPlumeTop(), M.dark);
    top.position.set(X, CK_C_HEAD_TOP + 0.070 * HEX_R, Z - 0.004 * HEX_R);
    group.add(top);
    const fall = new THREE.Mesh(getCKPlumeFall(), M.dark);    // OPADA ku karkowi
    fall.rotation.x = -2.30;
    fall.position.set(X, CK_C_HEAD_TOP + 0.020 * HEX_R, Z - 0.064 * HEX_R);
    group.add(fall);
  }

  return {
    shldL: new THREE.Vector3(X + CK_C_SHLD_X, CK_C_SHLD_Y, Z),
    shldR: new THREE.Vector3(X - CK_C_SHLD_X, CK_C_SHLD_Y, Z),
  };
}

/** Ramię łańcuchowe bark→łokieć→nadgarstek + pięść. Broń siada NA OSI dłoni. */
function ckArm(group: THREE.Group, M: CKMats, shld: THREE.Vector3, hand: THREE.Vector3,
               bow: THREE.Vector3): void {
  const elbow = shld.clone().lerp(hand, 0.52).add(bow);
  ckStretch(group, M.skin, shld, elbow, 0.046 * HEX_R);
  ckStretch(group, M.skin, elbow, hand, 0.036 * HEX_R);
  const fist = new THREE.Mesh(getCKFist(), M.skinDk);
  fist.position.copy(hand);
  group.add(fist);
}

// ===========================================================================
// RYDWAN KAPADOKIJSKI — jednostka unikalna Hetytów, epoka Brązu.
// Front = +Z (kierunek jazdy), spód kół i kopyt na y = 0.
// Dwa koła 6-szprychowe z osią POŚRODKU platformy (K2/K4), szeroka skrzynia
// (K3), para koni pod jarzmem (K5) i TRZYOSOBOWA ZAŁOGA: woźnica + włócznik
// + tarczownik z wysuniętą tarczą ósemkową (K1).
// ===========================================================================
export function buildRydwanKapadokijskiOpus5(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const mats: THREE.Material[] = [];
  const mk = (color: number, metalness = 0.1, roughness = 0.7): CKMat => {
    const m = new THREE.MeshStandardMaterial({ color, metalness, roughness });
    mats.push(m);
    return m;
  };

  const M: CKMats = {
    wood:      mk(CK_WOOD,        0.06, 0.82),
    woodDk:    mk(CK_WOOD_DK,     0.04, 0.88),
    wicker:    mk(CK_WICKER,      0.05, 0.86),
    bronze:    mk(CK_BRONZE,      0.42, 0.46),
    bronzeLt:  mk(CK_BRONZE_LT,   0.58, 0.34),
    leather:   mk(CK_LEATHER,     0.05, 0.86),
    leatherDk: mk(CK_LEATHER_DK,  0.05, 0.88),
    linen:     mk(CK_LINEN,       0.05, 0.84),
    skin:      mk(CK_SKIN,        0.05, 0.80),
    skinDk:    mk(CK_SKIN_DK,     0.05, 0.84),
    dark:      mk(CK_DARK,        0.05, 0.88),
    eye:       mk(CK_EYE,         0.05, 0.86),
    horse:     mk(CK_HORSE,       0.05, 0.84),
    horseDk:   mk(CK_HORSE_DK,    0.04, 0.90),
    hoof:      mk(CK_HOOF,        0.10, 0.70),
    owner:     mk(ownerColor_,    0.14, 0.64),
  };

  // ═══ ZESPÓŁ JEZDNY: DWA KOŁA 6-SZPRYCHOWE + OŚ POŚRODKU (K2, K4) ═════════
  for (const sx of [-1, 1]) ckWheel(group, sx, M);
  const axle = new THREE.Mesh(getCKAxle(), M.woodDk);
  axle.rotation.z = Math.PI / 2;
  axle.position.set(0, CK_AXLE_Y, CK_AXLE_Z);
  group.add(axle);

  // ═══ SZEROKA PLATFORMA NA TRZECH LUDZI (K3) ══════════════════════════════
  const floor = new THREE.Mesh(getCKFloor(), M.wood);
  floor.position.set(0, CK_FLOOR_Y, CK_BOX_ZC);
  group.add(floor);

  const PAN_CY = CK_FLOOR_Y + (CK_RAIL_TOP - CK_FLOOR_Y) * 0.5;
  const front = new THREE.Mesh(getCKFrontPan(), M.wicker);       // przód: plecionka na ramie
  front.position.set(0, PAN_CY, CK_BOX_FZ);
  group.add(front);
  const band = new THREE.Mesh(getCKFrontBand(), M.owner);        // ← KOLOR GRACZA
  band.position.set(0, CK_FLOOR_Y + 0.062 * HEX_R, CK_BOX_FZ + 0.012 * HEX_R);
  group.add(band);
  const frail = new THREE.Mesh(getCKFrontRail(), M.bronzeLt);    // listwa wieńcząca (K7)
  frail.position.set(0, CK_RAIL_TOP, CK_BOX_FZ);
  group.add(frail);
  for (const dx of [-0.150, -0.050, 0.050, 0.150]) {
    const stud = new THREE.Mesh(getCKStud(), M.bronze);
    stud.position.set(dx * HEX_R, CK_FLOOR_Y + 0.122 * HEX_R, CK_BOX_FZ + 0.011 * HEX_R);
    group.add(stud);
  }
  for (const sx of [-1, 1]) {                                    // burty boczne, TYŁ OTWARTY
    const side = new THREE.Mesh(getCKSidePan(), M.wicker);
    side.position.set(sx * CK_BOX_W * 0.5, PAN_CY, CK_BOX_ZC + CK_BOX_LEN * 0.10);
    group.add(side);
    const srail = new THREE.Mesh(getCKSideRail(), M.wood);
    srail.position.set(sx * CK_BOX_W * 0.5, CK_RAIL_TOP, CK_BOX_ZC + CK_BOX_LEN * 0.09);
    group.add(srail);
  }

  // ═══ DYSZEL + JARZMO Z SIODEŁKAMI (K5) ═══════════════════════════════════
  const poleA = new THREE.Vector3(0, CK_FLOOR_Y + 0.012 * HEX_R, CK_BOX_FZ - 0.010 * HEX_R);
  const poleB = new THREE.Vector3(0, CK_YOKE_Y, CK_YOKE_Z);
  ckStretch(group, M.wood, poleA, poleB, 0.022 * HEX_R);
  const pfit = new THREE.Mesh(getCKPoleFit(), M.bronze);
  pfit.rotation.x = Math.PI / 2;
  pfit.position.copy(poleB);
  group.add(pfit);
  const yoke = new THREE.Mesh(getCKYokeBar(), M.woodDk);
  yoke.position.set(0, CK_YOKE_Y, CK_YOKE_Z);
  group.add(yoke);
  for (const s of [-1, 1]) {
    const saddle = new THREE.Mesh(getCKYokeSaddle(), M.leather);   // siodełko jarzmowe
    saddle.position.set(s * CK_H_X, CK_YOKE_Y - 0.018 * HEX_R, CK_YOKE_Z);
    group.add(saddle);
  }

  // ═══ PARA KONI (K5) — zwraca punkty wędzideł do lejców ═══════════════════
  const bitXneg = ckHorse(group, -1, M);   // koń po stronie −X
  const bitXpos = ckHorse(group, 1, M);    // koń po stronie +X

  // ═══════════════════════════════════════════════════════════════════════
  // ZAŁOGA TRZYOSOBOWA (K1) — GŁÓWNY WYRÓŻNIK JEDNOSTKI
  // ═══════════════════════════════════════════════════════════════════════

  // ── (a) WOŹNICA — środek, bez pióropusza, obie ręce na lejcach ──────────
  const drv = ckCrewman(group, M, CK_POS_DRIVER, false);
  const drvHandL = new THREE.Vector3(CK_POS_DRIVER.x + 0.082 * HEX_R, CK_C_SHLD_Y - 0.100 * HEX_R, CK_POS_DRIVER.z + 0.100 * HEX_R);
  const drvHandR = new THREE.Vector3(CK_POS_DRIVER.x - 0.082 * HEX_R, CK_C_SHLD_Y - 0.100 * HEX_R, CK_POS_DRIVER.z + 0.100 * HEX_R);
  ckArm(group, M, drv.shldL, drvHandL, new THREE.Vector3(0.016 * HEX_R, -0.006 * HEX_R, 0));
  ckArm(group, M, drv.shldR, drvHandR, new THREE.Vector3(-0.016 * HEX_R, -0.006 * HEX_R, 0));
  // LEJCE — każda dłoń do wędzidła konia po TEJ SAMEJ stronie. (W pierwszej
  // wersji lejce szły na krzyż i z kamery gry tworzyły wielki, czytelny X
  // przez cały przód tokenu — artefakt widoczny nawet na zoomie rozgrywki.)
  ckStretch(group, M.leatherDk, drvHandL, bitXpos, 0.009 * HEX_R);
  ckStretch(group, M.leatherDk, drvHandR, bitXneg, 0.009 * HEX_R);

  // ── (b) WOJOWNIK (−X) — WŁÓCZNIA do pchnięcia, uniesiona ukośnie ────────
  // Włócznia, NIE łuk: to jest sedno różnicy doktrynalnej wobec rydwanu
  // egipskiego (K1). Grot = najwyższy punkt całego tokenu.
  const war = ckCrewman(group, M, CK_POS_SPEAR, true);
  const gripW = new THREE.Vector3(CK_POS_SPEAR.x - 0.062 * HEX_R, CK_C_SHLD_Y - 0.060 * HEX_R, CK_POS_SPEAR.z + 0.030 * HEX_R);
  ckArm(group, M, war.shldR, gripW, new THREE.Vector3(-0.024 * HEX_R, -0.014 * HEX_R, 0));
  // lewa ręka wojownika trzyma się burty (stabilizacja w pędzącym pojeździe)
  const braceW = new THREE.Vector3(CK_POS_SPEAR.x + 0.048 * HEX_R, CK_RAIL_TOP + 0.012 * HEX_R, CK_BOX_FZ - 0.030 * HEX_R);
  ckArm(group, M, war.shldL, braceW, new THREE.Vector3(0.026 * HEX_R, -0.030 * HEX_R, 0));

  // KIERUNEK WŁÓCZNI — dobrany pod KAMERĘ, nie „na oko". Oś patrzenia kamery
  // gry to (0, −sin52°, −cos52°) = (0, −0.788, −0.616). Włócznia wycelowana
  // do przodu-w górę, czyli ≈(0, 0.84, 0.54), leży PRAWIE DOKŁADNIE na tej osi
  // — w pierwszej wersji rzutowała się na ekran jako kilkupikselowy punkt
  // (dokładnie ta klasa błędu, o której mówi CLAUDE.md: „broń nieczytelna").
  // Tu włócznia jest niesiona PIONOWO Z ODCHYŁEM NA ZEWNĄTRZ (−X) i lekko
  // w tył: składowa prostopadła do osi patrzenia wynosi ~0.78 długości
  // drzewca, więc drzewce widać niemal w pełnej długości.
  const spDir = new THREE.Vector3(-0.300, 0.930, -0.200).normalize();
  const spShaft = new THREE.Mesh(getCKSpShaft(), M.wood);
  spShaft.quaternion.setFromUnitVectors(CK_Y_UP, spDir);
  spShaft.position.copy(gripW.clone().addScaledVector(spDir, 0.070 * HEX_R));
  group.add(spShaft);
  const spCollar = new THREE.Mesh(getCKSpCollar(), M.bronze);       // tulejka osadzenia grotu
  spCollar.quaternion.setFromUnitVectors(CK_Y_UP, spDir);
  spCollar.position.copy(gripW.clone().addScaledVector(spDir, 0.258 * HEX_R));
  group.add(spCollar);
  const spTip = new THREE.Mesh(getCKSpTip(), M.bronzeLt);           // grot liściasty
  spTip.quaternion.setFromUnitVectors(CK_Y_UP, spDir);
  spTip.position.copy(gripW.clone().addScaledVector(spDir, 0.300 * HEX_R));
  group.add(spTip);
  const spButt = new THREE.Mesh(getCKSpButt(), M.bronze);           // stopka (sauroter)
  spButt.quaternion.setFromUnitVectors(CK_Y_UP, spDir);
  spButt.position.copy(gripW.clone().addScaledVector(spDir, -0.142 * HEX_R));
  group.add(spButt);

  // ── (c) TARCZOWNIK (+X) — WIELKA TARCZA ÓSEMKOWA WYSUNIĘTA PRZED ZAŁOGĘ ──
  // Trzeci człowiek to właśnie ta jednostka: tarcza stoi PRZED przednim
  // panelem i przesłania sylwetki woźnicy i włócznika (K1).
  const shb = ckCrewman(group, M, CK_POS_SHIELD, true);
  // Tarcza podniesiona i powiększona wobec pierwszej wersji: przy poprzednim
  // ustawieniu jej szczyt kończył się na wysokości pasa załogi i czytała się
  // jak dwa krążki na burcie, a nie jak PARAWAN chroniący trzech ludzi (K1).
  // Teraz sięga od bioder po brodę — dokładnie tak, jak nosi się tarczę
  // ósemkową i dokładnie po to, po co na pokładzie jest trzeci człowiek.
  const SH_X = 0.132 * HEX_R;
  const SH_Y = CK_FLOOR_Y + 0.300 * HEX_R;
  const SH_Z = CK_BOX_FZ + 0.046 * HEX_R;
  const shieldG = new THREE.Group();
  shieldG.position.set(SH_X, SH_Y, SH_Z);
  shieldG.rotation.y = -0.34;                     // lekko na zewnątrz, licem do +Z
  group.add(shieldG);
  for (const dy of [0.086, -0.086]) {             // dwa loby ósemki
    const shell = new THREE.Mesh(getCKFig8Shell(), M.leather);
    shell.rotation.x = Math.PI / 2;
    shell.position.set(0, dy * HEX_R, 0);
    shieldG.add(shell);
    const face = new THREE.Mesh(getCKFig8Face(), M.owner);   // ← KOLOR GRACZA
    face.rotation.x = Math.PI / 2;
    face.position.set(0, dy * HEX_R, 0.014 * HEX_R);
    shieldG.add(face);
  }
  // pion wzmacniający w przewężeniu ósemki
  ckStretch(shieldG, M.leatherDk,
    new THREE.Vector3(0, -0.090 * HEX_R, 0.006 * HEX_R),
    new THREE.Vector3(0, 0.090 * HEX_R, 0.006 * HEX_R), 0.044 * HEX_R, 0.020 * HEX_R);

  const gripS = new THREE.Vector3(SH_X + 0.020 * HEX_R, SH_Y + 0.010 * HEX_R, SH_Z - 0.048 * HEX_R);
  ckArm(group, M, shb.shldL, gripS, new THREE.Vector3(0.028 * HEX_R, -0.026 * HEX_R, 0.010 * HEX_R));
  // druga ręka tarczownika oparta o burtę
  const braceS = new THREE.Vector3(CK_POS_SHIELD.x - 0.030 * HEX_R, CK_C_SHLD_Y - 0.070 * HEX_R, CK_POS_SHIELD.z + 0.062 * HEX_R);
  ckArm(group, M, shb.shldR, braceS, new THREE.Vector3(-0.022 * HEX_R, -0.014 * HEX_R, 0));

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];   // ← wszystkie geometrie są singletonami modułu
  return group;
}

// ===========================================================================
/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeBrazRydwanKapadokijskiOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gCKUnit, gCKFelloe, gCKTyre, gCKSpoke, gCKHub, gCKHubRing, gCKAxle,
    gCKFloor, gCKFrontPan, gCKFrontBand, gCKFrontRail, gCKSidePan, gCKSideRail,
    gCKStud, gCKYokeBar, gCKYokeSaddle, gCKPoleFit,
    gCKHTorso, gCKHRump, gCKHSkull, gCKHMuzzle, gCKHEar, gCKHHoof, gCKHEye, gCKHBit,
    gCKTorso, gCKSkirt, gCKBelt, gCKSash, gCKNeck, gCKHead, gCKEye, gCKFist,
    gCKHelm, gCKHelmRim, gCKCheek, gCKPlumeTop, gCKPlumeFall,
    gCKSpShaft, gCKSpTip, gCKSpButt, gCKSpCollar, gCKFig8Shell, gCKFig8Face,
  ];
  for (const g of all) { g?.dispose(); }
  gCKUnit = gCKFelloe = gCKTyre = gCKSpoke = gCKHub = gCKHubRing = gCKAxle = null;
  gCKFloor = gCKFrontPan = gCKFrontBand = gCKFrontRail = gCKSidePan = gCKSideRail = null;
  gCKStud = gCKYokeBar = gCKYokeSaddle = gCKPoleFit = null;
  gCKHTorso = gCKHRump = gCKHSkull = gCKHMuzzle = gCKHEar = gCKHHoof = gCKHEye = gCKHBit = null;
  gCKTorso = gCKSkirt = gCKBelt = gCKSash = gCKNeck = gCKHead = gCKEye = gCKFist = null;
  gCKHelm = gCKHelmRim = gCKCheek = gCKPlumeTop = gCKPlumeFall = null;
  gCKSpShaft = gCKSpTip = gCKSpButt = gCKSpCollar = gCKFig8Shell = gCKFig8Face = null;
}

// ===========================================================================
// WYMIARY — ZMIERZONE traversem po ZBUDOWANYM tokenie (Box3.setFromObject),
// harness gra/tools/.rydwan-kapadokijski-mockup, w jednostkach HEX_R = 1.0:
//   wysokość sylwetki (grot włóczni)     = 0,750   ← norma serii „~0,75"
//   promień poziomy (chrapy konia)       = 0,645   (limit 0,866; cel ≤0,70)
//   spód (bieżnik koła / kopyta)         = −0,004  (praktycznie y = 0)
//   budżet                               = 149 mesh / ~2096 tri
// Dla porównania, w tym samym harnessie GENERYCZNY „Rydwan konny"
// (buildCategoryModel('rydwan')): wysokość 0,669 · promień 0,810 · 95 mesh.
// Nowy model jest WYŻSZY (czytelna włócznia) i WĘŻSZY w obrysie heksu.
//
// Wielkości pochodne (z powyższych stałych):
//   szczyt hełmu / pióropusza wojownika  ≈ 0,708 / 0,732
//   szczyt tarczy ósemkowej              ≈ 0,609  (od bioder po brodę załogi)
//   grzbiet konia / szczyt burty         ≈ 0,300 / 0,290
//   szerokość platformy                  = 0,440  (generyk units.ts ≈ 0,30)
//   oś kół                               Z = −0,040 = ŚRODEK podłogi (K2)
// ===========================================================================
