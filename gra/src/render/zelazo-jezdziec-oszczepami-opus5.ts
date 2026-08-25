/**
 * zelazo-jezdziec-oszczepami-opus5.ts — JEŹDZIEC Z OSZCZEPAMI (Słowianie, ŻELAZO)
 * units.json: „Jeździec z oszczepami" (Nazwa EN „Slavic Javelin Cavalry"),
 * Epoka=Żelazo, Kultura=Słowianie, Nacja=Słowianie, Tech=Hutnictwo żelaza,
 * Typ=Mount, Klasa=Specjalna, „W zamian za": Konnica.
 * Dane rozstrzygające o wyglądzie: `Atak dystansowy: 2`, `Zasięg ataku (hex): 2`,
 * `Ilość pocisków: 5`, `Pancerz: 3` (najniższy z całej trójki konnicy Żelaza —
 * asyryjska lancowa ma 5, uniwersalna Konnica Brązu 4), `Rola (linia): Flanka`,
 * `Uwagi`: „Lekka konnica leśna; rzut oszczepami/szczepnikami przed walką wręcz".
 *
 * DZIŚ (przed tym plikiem): jednostka NIE MA własnego modelu. `categoryOf()`
 * (`src/units/setup.ts`) łapie ją słowem kluczowym `jezdz` i zwraca kategorię
 * `konnica`, więc trafiała do generycznego `case 'konnica'` w `units.ts`
 * (~linia 3494) — model z KOPIĄ/LANCĄ trzymaną nadręcznie i proporczykiem,
 * bez nóg jeźdźca, bez uzdy i bez oporządzenia. Jednostka o `Atak dystansowy: 2`
 * i `Ilość pocisków: 5` dostawała więc broń wyłącznie do zwarcia. To realny błąd
 * wizualny (dokładnie ta sama klasa błędu, którą T1 tej serii naprawił dla
 * asyryjskiej konnicy łuczniczej), nie tylko brak unikalności.
 * ---------------------------------------------------------------------------
 * Drop-in zgodny z rodziną builderów Opus 5:
 *   buildZelazoJezdziecOszczepami(ownerColor)          : THREE.Group
 *   disposeZelazoJezdziecOszczepamiOpus5Geometries()   : void
 *
 * Konwencje serii (jak `braz-konnica-opus5.ts` / `zelazo-konnica-asyryjska-opus5.ts`):
 *   - token PRZODEM do +Z, kopyta na y = 0 grupy,
 *   - układ prawoskrętny: przód = +Z, góra = +Y ⇒ LEWA ręka jeźdźca = +X,
 *     PRAWA = -X. Tu: PRAWA (-X) = ręka RZUTU, LEWA (+X) = wodze + pęk
 *     oszczepów zapasowych,
 *   - WYŁĄCZNIE MeshStandardMaterial,
 *   - geometrie wspólne = SINGLETONY MODUŁU (lazy), `perTokenGeos` puste,
 *   - `group.userData['mats']` / `['perTokenGeos']` jak w całej serii,
 *   - HEX_R = 1.0 z `hexutil.ts`,
 *   - USTAWIENIE 3/4: cała bryła na wewnętrznym pivocie obróconym o SJ_YAW.
 *
 * KOLOR GRACZA (trzy sloty):
 *   (1) CZAPRAK/derka pod siodłem + płachty na boki konia — główny nośnik,
 *       jak w całej serii konnej;
 *   (2) POLE TARCZY okrągłej niesionej NA PLECACH — dokładnie ten sam slot co
 *       w `buildDruzynnik` (`jednostki-z3-plemiona.ts`, ta sama kultura:
 *       „okragla tarcza: pole = KOLOR GRACZA");
 *   (3) TKANY PAS (krajka) na rubasze — trzeci, mały akcent widoczny z przodu,
 *       gdy tarcza jest zasłonięta plecami.
 *
 * ===========================================================================
 * ZGODNOŚĆ HISTORYCZNA — DECYZJE I UZASADNIENIA
 * ===========================================================================
 * Rama czasowa: Słowianie VI–X w. n.e. Świadomie SZEROKA, bo obejmuje dwa
 * różne stany źródeł, których nie wolno mieszać bez zaznaczenia:
 *   (a) VI–VII w. — opis BIZANTYJSKI z zewnątrz: *Strategikon* przypisywany
 *       Maurycjuszowi (powstały ok. 592–602 n.e.), księga XI rozdz. 4
 *       („Jak postępować ze Słowianami, Antami i im podobnymi"),
 *   (b) IX–X w. — materiał ARCHEOLOGICZNY z terenów słowiańskich (Wielkie
 *       Morawy, Polska wczesnopiastowska), czyli ta sama rama, w której repo
 *       osadza już istniejącego `Drużynnika` („wczesnoslowianski wojownik
 *       druzyny ksiazecej", `jednostki-z3-plemiona.ts`).
 * Każdy punkt niżej mówi WPROST, z której warstwy pochodzi — bo dokładnie na
 * tym styku leży najgroźniejsza pułapka tego tematu (patrz K3).
 *
 * K1. UZBROJENIE GŁÓWNE — OSZCZEPY DO RZUTU, NIE KOPIA. To jest jedyny punkt,
 *     w którym źródło pisane i dane jednostki mówią tym samym głosem.
 *     *Strategikon* XI.4 o Słowianach i Antach: „armed with short javelins,
 *     two to each man. Some also have nice-looking but unwieldy shields"
 *     (przekł. G.T. Dennisa) — czyli KRÓTKIE OSZCZEPY MIOTANE, po dwa na
 *     głowę, plus łuki drewniane z małymi strzałami. `units.json` niesie to
 *     samo: `Atak dystansowy: 2`, `Zasięg ataku (hex): 2`, `Ilość pocisków: 5`
 *     i wprost `Uwagi: „rzut oszczepami/szczepnikami przed walką wręcz"`.
 *     Model: oszczep w PRAWEJ (-X) dłoni w pozycji CHWYTU GÓRNEGO (nadgłownego)
 *     gotowego do rzutu — dłoń NAD linią barku, łokieć zgięty, grot skierowany
 *     w PRZÓD-w górę, pięta drzewca odchylona w tył. Rozważona i ODRZUCONA
 *     alternatywa: kopia/lanca trzymana nadręcznie (`couched`), jak w
 *     generycznym `case 'konnica'` — odrzucona wprost, bo to jest DOKŁADNIE
 *     ten błąd, który ten dispatch ma naprawić.
 * K2. LICZBA OSZCZEPÓW = `Ilość pocisków` Z DANYCH, NIE „ile ładnie wygląda".
 *     `units.json` mówi `Ilość pocisków: 5`, więc model niesie DOKŁADNIE pięć
 *     drzewc: JEDEN w dłoni rzutu (-X) i CZTERY w pęku trzymanym w LEWEJ (+X)
 *     dłoni razem z wodzami. Pęk w ręce wodzy jest standardową techniką lekkiej
 *     jazdy oszczepniczej (ręka rzutu musi zostać wolna między rzutami), a nie
 *     wymysłem kompozycyjnym; jednocześnie jest to jedyny sposób pokazać zapas
 *     pocisków tak, żeby dało się go POLICZYĆ na tokenie. Uwaga na rozbieżność:
 *     *Strategikon* mówi o DWÓCH oszczepach na wojownika — to opis pieszych
 *     drużyn VI w., a nie balans jednostki w tej grze; przy konflikcie źródła
 *     zewnętrznego z `units.json` wiążące są DANE JEDNOSTKI (to jest ich model,
 *     nie ilustracja do *Strategikonu*), a rozbieżność jest tu zapisana zamiast
 *     zamiecenia jej pod dywan.
 * K3. NAJTRUDNIEJSZY PUNKT: SŁOWIANIN NA KONIU. *Strategikon* XI.4 opisuje
 *     Słowian jako piechotę leśną i radzi wojsku bizantyjskiemu wyprawiać się
 *     przeciw nim „lightly equipped and without many horsemen" — czyli teren
 *     ich osadnictwa („nearly impenetrable forests, rivers, lakes, and
 *     marshes") jest wprost opisany jako NIEDOBRY DLA JAZDY. Uczciwe
 *     postawienie sprawy: dla warstwy (a), VI–VII w., słowiańska jazda
 *     oszczepnicza jako formacja NIE JEST poświadczona i nie wolno udawać, że
 *     jest. Jednostka jest natomiast dobrze osadzona w warstwie (b): w IX–X w.
 *     konny orszak zbrojny jest na ziemiach słowiańskich faktem
 *     archeologicznym — w Mikulčicach (wielkomorawski ośrodek książęcy)
 *     wydobyto ponad 570 ostróg, a zestawy „ostroga + oporządzenie jeździeckie"
 *     poza terenem awarskim są w literaturze wiązane właśnie z elitami, z
 *     których wyrosła władza wielkomorawska. Model odwzorowuje więc warstwę
 *     (b) — konnego harcownika książęcego orszaku — z uzbrojeniem i taktyką
 *     opisaną w warstwie (a). Tak samo, tylko w piechocie, ustawiony jest już
 *     w tym repo `Drużynnik`. To jest DECYZJA, nie przeoczenie.
 * K4. STRZEMIONA — SĄ, i to jest ŚWIADOME ODWRÓCENIE reguły dwóch
 *     wcześniejszych modeli konnych tej rodziny. `braz-konnica-opus5.ts` (K1)
 *     i `zelazo-konnica-asyryjska-opus5.ts` (Z1) NIE MAJĄ strzemion, bo ich
 *     ramy czasowe (Brąz, Bliski Wschód epoki Żelaza) są o wieki wcześniejsze.
 *     Tutaj rama jest inna i sprawdzona osobno: pierwsza w Europie wzmianka
 *     pisana o strzemionach to właśnie *Strategikon* (ks. I, wykaz oporządzenia
 *     jazdy) z przełomu VI/VII w.; żelazne strzemiona przyniosli do Kotliny
 *     Karpackiej Awarowie, a najwcześniejsze strzemiona awarskie datuje się na
 *     drugą połowę VI w. Słowianie żyli w bezpośrednim, wielopokoleniowym
 *     kontakcie z kaganatem awarskim, a w warstwie (b) strzemię jest na
 *     ziemiach słowiańskich elementem standardowego rynsztunku jeździeckiego.
 *     Model: stopa OPARTA W STRZEMIENIU, puślisko biegnie od przedniej części
 *     siodła w dół do kabłąka. Konsekwencja konstrukcyjna, nie ozdoba: strzemię
 *     przenosi ciężar na SZTYWNE DRZEWO SIODŁA, więc razem ze strzemieniem
 *     wchodzi terlica i łęki (K5) — czego oba wcześniejsze modele konne
 *     świadomie nie mają.
 * K5. SIODŁO Z DRZEWEM I ŁĘKAMI, nie sama derka. Wynika bezpośrednio z K4:
 *     strzemię obciążone stopą musi mieć na czym wisieć. Model: niskie
 *     siedzisko na terlicy, PRZEDNI i TYLNI ŁĘK (tylni wyższy), pod spodem
 *     derka koloru gracza, całość trzymana POPRĄGIEM, NAPIERŚNIKIEM i
 *     POŚLIŚNIKIEM. Łęki są celowo NISKIE: to siodło harcownika, który musi
 *     się swobodnie obracać w rzucie, a nie wysokie siodło kopijnika.
 * K6. OSTROGI HACZYKOWATE na piętach. Poświadczone masowo w warstwie (b) —
 *     ponad 570 egzemplarzy z samych Mikulčic, a hakowate ostrogi poza
 *     terytorium awarskim są w literaturze łączone z elitami przedwielkomorawskimi.
 *     Świadomy kontrast wobec `zelazo-konnica-asyryjska-opus5.ts`, gdzie ostrogi
 *     są na liście rzeczy JAWNIE ODRZUCONYCH (Z8) jako anachronizm tamtej ramy.
 * K7. PANCERZ — MINIMALNY, ZGODNIE Z `Pancerz: 3`. Brak kolczugi, brak łusek,
 *     brak metalowego hełmu. Model: lniana rubacha, na niej krótki SKÓRZANY
 *     KAFTAN i tkany pas, wełniane nogawice, skórzane buty — czyli ten sam
 *     zestaw warstw co `buildDruzynnik` (spójność kulturowa, K10), bez jego
 *     stalowego hełmu. Uzasadnienie różnicy jest w danych i w źródle
 *     jednocześnie: hełm stożkowy z nosalem typu czarnomogilskiego to
 *     przedmiot PRESTIŻOWY ciężkiej drużyny książęcej, a ta jednostka jest w
 *     `units.json` opisana jako „lekka konnica leśna" o roli `Flanka`;
 *     *Strategikon* XI.4 opisuje Słowian jako walczących bez ciężkiego
 *     oporządzenia. Zamiast hełmu: CZAPKA skórzana z futrzanym otokiem.
 * K8. TARCZA NA PLECACH, NIE NA PRZEDRAMIENIU. To jest wniosek WPROST ze
 *     zdania *Strategikonu* XI.4 o słowiańskich tarczach: „nice-looking but
 *     unwieldy" — gr. δυσμετακόμιστα, dosł. „trudne do przenoszenia".
 *     Harcownik konny ma obie dłonie zajęte (jedna rzuca, druga trzyma wodze
 *     i pęk zapasu), więc tarcza jedzie na pasie naramiennym na plecach i
 *     wraca do ręki dopiero przy zwarciu. Kształt i konstrukcja BEZ ZMIAN
 *     wobec kanonu kulturowego repo (`buildDruzynnik`): okrągła, deski
 *     promieniste, stalowe UMBO, skórzany rant, pole = kolor gracza — czyli
 *     ODRÓŻNIA ją od asyryjskiej tarczy lancera (T1) miejscem noszenia, nie
 *     nowym, wymyślonym kształtem.
 * K9. KOŃ MAŁY. Warstwa (b), pomiary osteologiczne koni wczesnośredniowiecznych
 *     z ziem polskich: populacja mieści się w kategorii koni małych i średnich,
 *     ze średnią wysokością w kłębie rzędu ok. 135 cm (pojedyncze osobniki
 *     poniżej 130 cm). To jest koń wyraźnie mniejszy niż wierzchowiec
 *     asyryjski z T1, gdzie źródła (pobór koni z Medii i Urartu) uzasadniały
 *     skalę +6% wobec Brązu. Stąd `SJ_S = 0.92`: ok. -8% wobec konia Brązu
 *     i ok. -13% wobec konia asyryjskiego. Wielkość jest tu NOŚNIKIEM
 *     INFORMACJI, nie ozdobą — mały, krępy koń leśny to najszybciej czytelna
 *     różnica sylwetki na tokenie.
 * K10. MAŚĆ — decyzja jawnie TRÓJczłonowa, bo źródła jej NIE rozstrzygają.
 *     Maści konkretnych koni nie da się odczytać z materiału kostnego, więc
 *     (i) przesłanka historyczna: koń strefy leśnej wyrasta na podłożu
 *     tarpanowatym (linia, z której wywodzi się konik polski), więc cechy
 *     „pierwotne" są uzasadnione; (ii) przesłanka rozróżnialności w tym repo:
 *     `braz-konnica-opus5.ts` zajmuje już maść BUŁANĄ/MYSZATĄ z PRĘGĄ
 *     GRZBIETOWĄ (`KN_COAT = 0xb08a52`, „maść pierwotna"), a
 *     `zelazo-konnica-asyryjska-opus5.ts` — nasyconą GNIADĄ/KASZTANOWATĄ
 *     (`AC_COAT = 0x7a4527`); (iii) przesłanka CZYTELNOŚCI TOKENU, ustalona
 *     POMIAREM NA ŻYWYM RENDERZE, nie z góry: pierwsza wersja tego pliku
 *     miała maść ciemnogniadą `0x4a3826`, praktycznie nieodróżnialną od
 *     wełnianych nogawic jeźdźca (`SJ_WOOL_DK = 0x4a3a2e`, wartość narzucona
 *     przez kanon kulturowy `Drużynnika` i nietykalna) — nogi jeźdźca
 *     ZNIKAŁY w sylwetce konia, mimo że wszystkie asercje geometryczne
 *     świeciły na zielono. Stąd maść jest GNIADA SPŁOWIAŁA (mysznobrunatna,
 *     `0x7d6247`): zimniejsza i mniej nasycona niż asyryjska, wyraźnie
 *     ciemniejsza niż bułana Brązu, i o tyle jaśniejsza od nogawic, żeby noga
 *     w strzemieniu w ogóle była widoczna. Rozjaśnienie typu „mealy"/pangaré
 *     (jasny pysk, podbrzusze, wewnętrzne strony nóg) jest cechą pierwotną tak
 *     samo jak pręga, więc niesie ten sam sygnał „koń leśny", nie duplikując
 *     znaku rozpoznawczego Brązu. Obie przesłanki nieźródłowe są tu zapisane
 *     WPROST, bo współdecydowały.
 * K11. GRZYWA OPADAJĄCA, nie stojąca. `zelazo-konnica-asyryjska-opus5.ts` ma
 *     grzywę STOJĄCĄ (za płaskorzeźbami asyryjskimi, gdzie grzywy są
 *     przycinane w sztywny grzebień). Tu grzywa opada swobodnie na jeden bok
 *     szyi — koń użytkowy orszaku, nie koń dworskiej ceremonii; to
 *     jednocześnie druga (po wielkości) czytelna różnica sylwetki łba i szyi.
 * K12. SPÓJNOŚĆ KULTUROWA Z `Drużynnikiem` — MIERZONA, NIE DEKLAROWANA.
 *     Wartości kolorów wspólne z `jednostki-z3-plemiona.ts` są tu powtórzone
 *     LICZBOWO (`SJ_HAIR_SLAV`, `SJ_LINEN`, `SJ_LEATHER`, `SJ_WOOL_DK`,
 *     `SJ_STEEL`), a nie zaimportowane — plik `Drużynnika` jest poza
 *     allowlistą tego tematu i nie wolno go dotykać nawet importem, który
 *     zmieniałby jego graf zależności. Test tematu czyta OBA pliki i
 *     porównuje te wartości, więc rozjazd kulturowy zapali się na czerwono
 *     zamiast cicho przejść. WSPÓLNE: ciemnoblond WĄSY bez brody (kanon
 *     „Słowianin / Gal"), lniana rubacha, skórzany kaftan, wełniane nogawice,
 *     okrągła tarcza z umbem i deskami promienistymi, pole tarczy = kolor
 *     gracza. WŁASNE (bo to jazda, nie piechota): cała geometria konia,
 *     siodła i dosiadu, poza rzutu, pęk oszczepów, czapka zamiast hełmu.
 * K13. CZEGO ŚWIADOMIE NIE MA: kolczugi i hełmu (K7), podków (upowszechniają
 *     się później), zbroi konia, łuku (jednostka ma w danych `Ilość pocisków`
 *     przypisaną oszczepom, a łuk miałby ten sam problem co lanca — mówiłby
 *     o innej broni niż `Uwagi`), sztandaru/proporca (generyczny `case
 *     'konnica'` niesie proporczyk na lancy — jego brak jest tu dodatkowym,
 *     celowym sygnałem odróżniającym), oraz brody (kanon repo dla Słowianina
 *     to WĄSY bez brody, w odróżnieniu od długobrodego Asyryjczyka z T1).
 *
 * ŹRÓDŁA (rząd 1–3 wg `R-PROC-AUTOBOT.md` §13a; cytaty za przekładem
 * G.T. Dennisa, *Maurice's Strategikon: Handbook of Byzantine Military
 * Strategy*):
 *   - *Strategikon* ks. XI.4 — uzbrojenie i taktyka Słowian/Antów, teren
 *     osadnictwa, rada „lightly equipped and without many horsemen";
 *   - *Strategikon* ks. I — pierwszy europejski zapis o strzemionach w wykazie
 *     oporządzenia jazdy;
 *   - archeologia awarska Kotliny Karpackiej — żelazne strzemiona, druga
 *     połowa VI w.;
 *   - Mikulčice (Wielkie Morawy, IX w.) — ponad 570 ostróg, oporządzenie
 *     jeździeckie elit;
 *   - zooarcheologia koni wczesnośredniowiecznych z ziem polskich — konie
 *     małe i średnie, średnia w kłębie rzędu 135 cm.
 *
 * BUDŻET: jeden koń + jeden jeździec + 5 drzewc + tarcza; wszystkie geometrie
 * są singletonami modułu, `perTokenGeos` puste.
 *
 * Uruchamiać z katalogu gra/, NIGDY `npm run build`/`npm run dev` (C-001).
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
// KOŃ (K10): gniada spłowiała (mysznobrunatna) + rozjaśnienie pangaré.
const SJ_COAT       = 0x7d6247;   // maść zasadnicza — NIE bułana (Brąz), NIE gniada nasycona (Asyria)
const SJ_COAT_LT    = 0xb09777;   // „mealy"/pangaré: pysk, podbrzusze, wewnętrzne strony nóg
const SJ_COAT_DK    = 0x3a2c1e;   // pęciny, cienie
const SJ_MANE       = 0x1c140d;   // grzywa OPADAJĄCA (K11) i ogon
const SJ_HOOF       = 0x241a10;

// JEŹDZIEC — kanon kulturowy Słowian, wartości WSPÓLNE z jednostki-z3-plemiona.ts
// (K12; tam odpowiednio TR_SKIN / TR_HAIR_SLAV / TR_LINEN / TR_LEATHER /
// TR_WOOL_DK / TR_STEEL — powtórzone liczbowo, nie zaimportowane).
const SJ_SKIN       = 0xe0ac69;   // = TR_SKIN
const SJ_SKIN_DK    = 0xbb8a52;
const SJ_HAIR_SLAV  = 0xa07840;   // = TR_HAIR_SLAV — ciemnoblond WĄSY (bez brody)
// Włosy do ramion: ciemniejszy wariant TEGO SAMEGO koloru. Osobna wartość, bo
// `Drużynnik` chowa włosy pod hełmem i kanon ich nie definiuje, a przy samym
// 0xa07840 pod czapką potylica zlewała się z karnacją (0xe0ac69) w jedną
// bryłę — widać to dopiero na renderze, nie w asercji. Wąsy zostają przy
// wartości kanonicznej.
const SJ_HAIR_DK    = 0x74532c;
const SJ_LINEN      = 0xe8e0c8;   // = TR_LINEN — lniana rubacha
const SJ_LEATHER    = 0x6b4a28;   // = TR_LEATHER — kaftan, uprząż, rant tarczy
const SJ_WOOL_DK    = 0x4a3a2e;   // = TR_WOOL_DK — nogawice
const SJ_STEEL      = 0xc2cad2;   // = TR_STEEL — umbo tarczy (kanon Drużynnika)
const SJ_LEATH_DK   = 0x44301a;   // rzemienie, wodze, puślisko
const SJ_FUR        = 0x5a3c20;   // futrzany otok czapki (K7)
const SJ_IRON       = 0x6c7480;   // żelazo: groty, strzemiona, ostrogi, wędzidło
const SJ_IRON_LT    = 0x99a2ab;
const SJ_WOOD       = 0x7a5c3a;   // drzewce oszczepów, deski tarczy
const SJ_EYE        = 0x14100c;

// ── skala konia (K9): -8% wobec braz-konnica-opus5.ts, -13% wobec T1 ───────
const SJ_S = 0.92;

// ── wysokości / osie sylwetki KONIA (×HEX_R×SJ_S) ──────────────────────────
const SJ_BODY_CTR   = 0.330;
const SJ_BACK_Y     = 0.438;    // linia grzbietu (pod derką)
const SJ_LEG_TOP_F  = 0.2595;
const SJ_LEG_TOP_R  = 0.2607;
const SJ_SEAT_Z     = 0.010;

/** Grzbiet w jednostkach bezwzględnych (×HEX_R) — punkt odniesienia siodła. */
const SJ_BACK_ABS   = SJ_BACK_Y * SJ_S;
/** Wysokość siedziska nad grzbietem (siodło z terlicą, K5). */
const SJ_SADDLE_H   = 0.026;
/** Dosiad jeźdźca: NA SIODLE, nie na gołym grzbiecie. */
const SJ_SEAT_Y     = SJ_BACK_ABS + SJ_SADDLE_H;
const SJ_SEAT_ZA    = SJ_SEAT_Z * SJ_S;

// ── wymiary JEŹDŹCA (×HEX_R, BEZ SJ_S — człowiek nie skaluje się z koniem) ─
const SJ_TORSO_W    = 0.136;
const SJ_TORSO_H    = 0.148;
const SJ_TORSO_D    = 0.082;   // smuklejszy niż lancer asyryjski (0.090) — Pancerz 3, bez łusek
const SJ_TORSO_TOP  = SJ_SEAT_Y + SJ_TORSO_H;
const SJ_NECK_H     = 0.020;
const SJ_HEAD_S     = 0.098;
const SJ_HEAD_CTR   = SJ_TORSO_TOP + SJ_NECK_H + SJ_HEAD_S * 0.5;
const SJ_HEAD_TOP   = SJ_TORSO_TOP + SJ_NECK_H + SJ_HEAD_S;
const SJ_SHLD_X     = SJ_TORSO_W * 0.5 + 0.014;
const SJ_SHLD_Y     = SJ_TORSO_TOP - 0.019;
const SJ_HIP_X      = 0.098;

const SJ_UPARM_L    = 0.078;
const SJ_FOREARM_L  = 0.072;
const SJ_THIGH_L    = 0.120;
const SJ_SHIN_L     = 0.118;

/** Obrót 3/4 całej bryły — konwencja rodziny konnej. */
const SJ_YAW = 1.02;

// ── POZA RZUTU I ZAPASU (K1, K2) ───────────────────────────────────────────
/**
 * Nachylenie drzewca od pionu, rad. 1.15 ≈ 24° nad poziomem: grot w PRZÓD-w
 * górę, pięta odchylona w tył — pozycja „zamachu", nie lotu pocisku.
 * Ta sama wartość dla oszczepu rzutowego i dla pęku zapasowego, żeby oba
 * czytały się jako ten sam typ broni.
 */
const SJ_JAV_TILT   = 1.15;
/** Chwyt oszczepu rzutowego względem PRAWEGO barku: nad nim i lekko w tył. */
const SJ_THROW_OFF  = new THREE.Vector3(-0.040, 0.104, -0.026);
/** Podział drzewca w chwycie rzutowym (×HEX_R): przed dłonią / za dłonią. */
const SJ_JAV_FRONT  = 0.250;
const SJ_JAV_BACK   = 0.150;
/**
 * Chwyt pęku zapasowego (LEWA dłoń, razem z wodzami) — pozycja bezwzględna.
 * Uniesiony do wysokości piersi i wysunięty na bok: przy niższym chwycie
 * (0.505) drzewca kładły się poziomo NA TLE torsu i na żywym renderze czytały
 * się jako „patyki wbite w klatkę piersiową", mimo że geometrycznie mijały
 * jeźdźca o 0.074×HEX_R. Poprawka z oglądu renderu, nie z asercji.
 */
const SJ_SHEAF_GRIP = new THREE.Vector3(0.148, 0.535, 0.060);
/**
 * Nachylenie pęku zapasowego od pionu — STROMSZE niż oszczepu w zamachu
 * (0.72 ≈ 49° nad poziomem). Powód jest czytelnościowy i zarazem praktyczny:
 * zapas niesiony płasko zasłania sylwetkę konia i jeźdźca, a niesiony stromo
 * czyta się jako pęk trzymany w garści. Nie jest to ta sama liczba co
 * `SJ_JAV_TILT` właśnie dlatego, że jedno drzewce jest w zamachu, a cztery
 * pozostałe tylko czekają.
 */
const SJ_SHEAF_TILT  = 0.72;
/** Podział drzewc w pęku: chwyt bliżej pięt, żeby groty jechały wysoko. */
const SJ_SHEAF_FRONT = 0.300;
const SJ_SHEAF_BACK  = 0.120;
/** Ile drzewc w pęku. RAZEM z oszczepem rzutowym musi dać `Ilość pocisków`=5. */
const SJ_SHEAF_N = 4;

// ── STRZEMIĘ (K4) ──────────────────────────────────────────────────────────
/** Kąt uda od pionu (w przód) — dosiad ze strzemieniem, kolano wyraźnie zgięte. */
const SJ_THIGH_TH = 0.62;
/** Kąt goleni od pionu (ujemny = stopa cofnięta pod kolano). */
const SJ_SHIN_TH  = -0.12;
/**
 * Zaczep puśliska na PRZEDNIEJ krawędzi siedziska (siedzisko ma głębokość
 * 0.184, więc 0.072 to okolica jego przedniego skraju — tam, gdzie w siodle
 * z terlicą siedzi hak puśliska). Wartość NIE jest dobrana „na oko": przy
 * pozie nogi (SJ_THIGH_TH / SJ_SHIN_TH) ucho kabłąka wypada na z ≈ 0.081,
 * więc taki zaczep daje puślisko wiszące niemal PIONOWO — jak pod obciążeniem
 * stopą. Asercja (H5) mierzy dokładnie to odchylenie od pionu.
 */
const SJ_STIRRUP_ANCHOR_Z = SJ_SEAT_ZA + 0.072;

// ===========================================================================
// GEOMETRIE — SINGLETONY MODUŁU (lazy). Zero alokacji per token.
// ===========================================================================
let gSJBarrel: THREE.CylinderGeometry | null = null;
let gSJChest: THREE.IcosahedronGeometry | null = null;
let gSJRump: THREE.IcosahedronGeometry | null = null;
let gSJWithers: THREE.BoxGeometry | null = null;
let gSJBelly: THREE.BoxGeometry | null = null;
let gSJNeck1: THREE.CylinderGeometry | null = null;
let gSJNeck2: THREE.CylinderGeometry | null = null;
let gSJNeck3: THREE.CylinderGeometry | null = null;
let gSJSkull: THREE.BoxGeometry | null = null;
let gSJMuzzle: THREE.CylinderGeometry | null = null;
let gSJNostril: THREE.BoxGeometry | null = null;
let gSJEar: THREE.ConeGeometry | null = null;
let gSJEyeH: THREE.BoxGeometry | null = null;
let gSJManeLock: THREE.BoxGeometry | null = null;
let gSJForelock: THREE.BoxGeometry | null = null;
let gSJUpFrnt: THREE.BoxGeometry | null = null;
let gSJUpRear: THREE.BoxGeometry | null = null;
let gSJLower: THREE.BoxGeometry | null = null;
let gSJPastern: THREE.BoxGeometry | null = null;
let gSJHoof: THREE.BoxGeometry | null = null;
let gSJTail1: THREE.CylinderGeometry | null = null;
let gSJTail2: THREE.CylinderGeometry | null = null;

let gSJPadTop: THREE.BoxGeometry | null = null;
let gSJPadFlap: THREE.BoxGeometry | null = null;
let gSJSeat: THREE.BoxGeometry | null = null;
let gSJArchF: THREE.BoxGeometry | null = null;
let gSJArchR: THREE.BoxGeometry | null = null;
let gSJSkirt: THREE.BoxGeometry | null = null;
let gSJGirth: THREE.CylinderGeometry | null = null;
let gSJBreast: THREE.BoxGeometry | null = null;
let gSJNoseBand: THREE.BoxGeometry | null = null;
let gSJBrowBand: THREE.BoxGeometry | null = null;
let gSJBit: THREE.BoxGeometry | null = null;
let gSJBitRing: THREE.TorusGeometry | null = null;
let gSJStirrup: THREE.TorusGeometry | null = null;
let gSJStirrupTread: THREE.BoxGeometry | null = null;
let gSJSpur: THREE.ConeGeometry | null = null;

let gSJTorso: THREE.BoxGeometry | null = null;
let gSJKaftan: THREE.BoxGeometry | null = null;
let gSJBelt: THREE.BoxGeometry | null = null;
let gSJNeckR: THREE.BoxGeometry | null = null;
let gSJHead: THREE.BoxGeometry | null = null;
let gSJJaw: THREE.BoxGeometry | null = null;
let gSJWasy: THREE.BoxGeometry | null = null;
let gSJHairBack: THREE.BoxGeometry | null = null;
let gSJCap: THREE.CylinderGeometry | null = null;
let gSJCapBand: THREE.CylinderGeometry | null = null;
let gSJEarR: THREE.BoxGeometry | null = null;
let gSJEyeR: THREE.BoxGeometry | null = null;
let gSJUpArm: THREE.BoxGeometry | null = null;
let gSJForearm: THREE.BoxGeometry | null = null;
let gSJFist: THREE.BoxGeometry | null = null;
let gSJThigh: THREE.BoxGeometry | null = null;
let gSJShin: THREE.BoxGeometry | null = null;
let gSJSole: THREE.BoxGeometry | null = null;
let gSJBootCuff: THREE.BoxGeometry | null = null;

let gSJJavShaft: THREE.CylinderGeometry | null = null;
let gSJJavGrip: THREE.BoxGeometry | null = null;
let gSJJavHead: THREE.BufferGeometry | null = null;
let gSJJavButt: THREE.ConeGeometry | null = null;
let gSJSpareShaft: THREE.CylinderGeometry | null = null;
let gSJSpareHead: THREE.BufferGeometry | null = null;

let gSJShieldFace: THREE.CylinderGeometry | null = null;
let gSJShieldRim: THREE.TorusGeometry | null = null;
let gSJShieldPlank: THREE.BoxGeometry | null = null;
let gSJShieldBoss: THREE.SphereGeometry | null = null;

let gSJUnit: THREE.BoxGeometry | null = null;

function getSJBarrel(): THREE.CylinderGeometry { return (gSJBarrel ||= new THREE.CylinderGeometry(0.110 * SJ_S * HEX_R, 0.102 * SJ_S * HEX_R, 0.244 * SJ_S * HEX_R, 7, 1)); }
function getSJChest(): THREE.IcosahedronGeometry { return (gSJChest ||= new THREE.IcosahedronGeometry(0.096 * SJ_S * HEX_R, 0)); }
function getSJRump(): THREE.IcosahedronGeometry { return (gSJRump ||= new THREE.IcosahedronGeometry(0.100 * SJ_S * HEX_R, 0)); }
function getSJWithers(): THREE.BoxGeometry { return (gSJWithers ||= new THREE.BoxGeometry(0.064 * SJ_S * HEX_R, 0.052 * SJ_S * HEX_R, 0.104 * SJ_S * HEX_R)); }
function getSJBelly(): THREE.BoxGeometry { return (gSJBelly ||= new THREE.BoxGeometry(0.122 * SJ_S * HEX_R, 0.036 * SJ_S * HEX_R, 0.196 * SJ_S * HEX_R)); }
function getSJNeck1(): THREE.CylinderGeometry { return (gSJNeck1 ||= new THREE.CylinderGeometry(0.054 * SJ_S * HEX_R, 0.066 * SJ_S * HEX_R, 0.076 * SJ_S * HEX_R, 6, 1, true)); }
function getSJNeck2(): THREE.CylinderGeometry { return (gSJNeck2 ||= new THREE.CylinderGeometry(0.046 * SJ_S * HEX_R, 0.054 * SJ_S * HEX_R, 0.066 * SJ_S * HEX_R, 6, 1, true)); }
function getSJNeck3(): THREE.CylinderGeometry { return (gSJNeck3 ||= new THREE.CylinderGeometry(0.038 * SJ_S * HEX_R, 0.046 * SJ_S * HEX_R, 0.052 * SJ_S * HEX_R, 6, 1, true)); }
function getSJSkull(): THREE.BoxGeometry { return (gSJSkull ||= new THREE.BoxGeometry(0.064 * SJ_S * HEX_R, 0.076 * SJ_S * HEX_R, 0.090 * SJ_S * HEX_R)); }
function getSJMuzzle(): THREE.CylinderGeometry { return (gSJMuzzle ||= new THREE.CylinderGeometry(0.025 * SJ_S * HEX_R, 0.033 * SJ_S * HEX_R, 0.076 * SJ_S * HEX_R, 5, 1)); }
function getSJNostril(): THREE.BoxGeometry { return (gSJNostril ||= new THREE.BoxGeometry(0.010 * SJ_S * HEX_R, 0.011 * SJ_S * HEX_R, 0.008 * SJ_S * HEX_R)); }
function getSJEar(): THREE.ConeGeometry { return (gSJEar ||= new THREE.ConeGeometry(0.015 * SJ_S * HEX_R, 0.040 * SJ_S * HEX_R, 4)); }
function getSJEyeH(): THREE.BoxGeometry { return (gSJEyeH ||= new THREE.BoxGeometry(0.008 * SJ_S * HEX_R, 0.014 * SJ_S * HEX_R, 0.014 * SJ_S * HEX_R)); }
/** Kosmyk grzywy OPADAJĄCEJ (K11) — dłuższy i węższy niż stojący pęk asyryjski. */
function getSJManeLock(): THREE.BoxGeometry { return (gSJManeLock ||= new THREE.BoxGeometry(0.014 * SJ_S * HEX_R, 0.058 * SJ_S * HEX_R, 0.026 * SJ_S * HEX_R)); }
function getSJForelock(): THREE.BoxGeometry { return (gSJForelock ||= new THREE.BoxGeometry(0.020 * SJ_S * HEX_R, 0.046 * SJ_S * HEX_R, 0.020 * SJ_S * HEX_R)); }
function getSJUpFrnt(): THREE.BoxGeometry { return (gSJUpFrnt ||= new THREE.BoxGeometry(0.046 * SJ_S * HEX_R, 0.116 * SJ_S * HEX_R, 0.058 * SJ_S * HEX_R)); }
function getSJUpRear(): THREE.BoxGeometry { return (gSJUpRear ||= new THREE.BoxGeometry(0.052 * SJ_S * HEX_R, 0.122 * SJ_S * HEX_R, 0.066 * SJ_S * HEX_R)); }
function getSJLower(): THREE.BoxGeometry { return (gSJLower ||= new THREE.BoxGeometry(0.030 * SJ_S * HEX_R, 0.116 * SJ_S * HEX_R, 0.034 * SJ_S * HEX_R)); }
function getSJPastern(): THREE.BoxGeometry { return (gSJPastern ||= new THREE.BoxGeometry(0.030 * SJ_S * HEX_R, 0.036 * SJ_S * HEX_R, 0.034 * SJ_S * HEX_R)); }
function getSJHoof(): THREE.BoxGeometry { return (gSJHoof ||= new THREE.BoxGeometry(0.036 * SJ_S * HEX_R, 0.032 * SJ_S * HEX_R, 0.042 * SJ_S * HEX_R)); }
function getSJTail1(): THREE.CylinderGeometry { return (gSJTail1 ||= new THREE.CylinderGeometry(0.017 * SJ_S * HEX_R, 0.021 * SJ_S * HEX_R, 0.050 * SJ_S * HEX_R, 4, 1)); }
function getSJTail2(): THREE.CylinderGeometry { return (gSJTail2 ||= new THREE.CylinderGeometry(0.009 * SJ_S * HEX_R, 0.018 * SJ_S * HEX_R, 0.132 * SJ_S * HEX_R, 4, 1)); }

function getSJPadTop(): THREE.BoxGeometry { return (gSJPadTop ||= new THREE.BoxGeometry(0.152 * SJ_S * HEX_R, 0.018 * SJ_S * HEX_R, 0.236 * SJ_S * HEX_R)); }
function getSJPadFlap(): THREE.BoxGeometry { return (gSJPadFlap ||= new THREE.BoxGeometry(0.014 * SJ_S * HEX_R, 0.082 * SJ_S * HEX_R, 0.204 * SJ_S * HEX_R)); }
/** Siedzisko na TERLICY (K5) — sztywna deska, nie miękka derka. */
function getSJSeat(): THREE.BoxGeometry { return (gSJSeat ||= new THREE.BoxGeometry(0.132 * HEX_R, 0.024 * HEX_R, 0.184 * HEX_R)); }
function getSJArchF(): THREE.BoxGeometry { return (gSJArchF ||= new THREE.BoxGeometry(0.112 * HEX_R, 0.032 * HEX_R, 0.022 * HEX_R)); }
function getSJArchR(): THREE.BoxGeometry { return (gSJArchR ||= new THREE.BoxGeometry(0.120 * HEX_R, 0.044 * HEX_R, 0.024 * HEX_R)); }
function getSJSkirt(): THREE.BoxGeometry { return (gSJSkirt ||= new THREE.BoxGeometry(0.012 * HEX_R, 0.052 * HEX_R, 0.104 * HEX_R)); }
function getSJGirth(): THREE.CylinderGeometry { return (gSJGirth ||= new THREE.CylinderGeometry(0.116 * SJ_S * HEX_R, 0.116 * SJ_S * HEX_R, 0.022 * SJ_S * HEX_R, 7, 1, true)); }
function getSJBreast(): THREE.BoxGeometry { return (gSJBreast ||= new THREE.BoxGeometry(0.134 * SJ_S * HEX_R, 0.018 * SJ_S * HEX_R, 0.020 * SJ_S * HEX_R)); }
function getSJNoseBand(): THREE.BoxGeometry { return (gSJNoseBand ||= new THREE.BoxGeometry(0.046 * SJ_S * HEX_R, 0.012 * SJ_S * HEX_R, 0.036 * SJ_S * HEX_R)); }
function getSJBrowBand(): THREE.BoxGeometry { return (gSJBrowBand ||= new THREE.BoxGeometry(0.064 * SJ_S * HEX_R, 0.011 * SJ_S * HEX_R, 0.018 * SJ_S * HEX_R)); }
function getSJBit(): THREE.BoxGeometry { return (gSJBit ||= new THREE.BoxGeometry(0.052 * SJ_S * HEX_R, 0.009 * SJ_S * HEX_R, 0.009 * SJ_S * HEX_R)); }
function getSJBitRing(): THREE.TorusGeometry { return (gSJBitRing ||= new THREE.TorusGeometry(0.014 * SJ_S * HEX_R, 0.004 * SJ_S * HEX_R, 4, 8)); }
/** Kabłąk strzemienia (K4) — otwarty łuk żelazny, płaszczyzna = YZ. */
function getSJStirrup(): THREE.TorusGeometry { return (gSJStirrup ||= new THREE.TorusGeometry(0.030 * HEX_R, 0.006 * HEX_R, 4, 10, Math.PI * 1.15)); }
function getSJStirrupTread(): THREE.BoxGeometry { return (gSJStirrupTread ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.008 * HEX_R, 0.056 * HEX_R)); }
/** Ostroga HACZYKOWATA (K6) — krótki, zagięty bodziec za piętą. */
function getSJSpur(): THREE.ConeGeometry { return (gSJSpur ||= new THREE.ConeGeometry(0.011 * HEX_R, 0.038 * HEX_R, 4)); }

function getSJTorso(): THREE.BoxGeometry { return (gSJTorso ||= new THREE.BoxGeometry(SJ_TORSO_W * HEX_R, SJ_TORSO_H * HEX_R, SJ_TORSO_D * HEX_R)); }
function getSJKaftan(): THREE.BoxGeometry { return (gSJKaftan ||= new THREE.BoxGeometry(SJ_TORSO_W * 1.06 * HEX_R, 0.086 * HEX_R, SJ_TORSO_D * 1.08 * HEX_R)); }
function getSJBelt(): THREE.BoxGeometry { return (gSJBelt ||= new THREE.BoxGeometry(SJ_TORSO_W * 1.09 * HEX_R, 0.024 * HEX_R, SJ_TORSO_D * 1.10 * HEX_R)); }
function getSJNeckR(): THREE.BoxGeometry { return (gSJNeckR ||= new THREE.BoxGeometry(0.038 * HEX_R, SJ_NECK_H * 1.6 * HEX_R, 0.038 * HEX_R)); }
function getSJHead(): THREE.BoxGeometry { return (gSJHead ||= new THREE.BoxGeometry(SJ_HEAD_S * HEX_R, SJ_HEAD_S * HEX_R, SJ_HEAD_S * HEX_R)); }
function getSJJaw(): THREE.BoxGeometry { return (gSJJaw ||= new THREE.BoxGeometry(0.066 * HEX_R, 0.026 * HEX_R, 0.030 * HEX_R)); }
/** Wąs — klocek opadający (kanon „Słowianin / Gal", K12). */
// Proporcje przeniesione Z KANONU: u Drużynnika wąs to 0.026×0.052 przy głowie
// 0.128, czyli 0.20×0.41 szerokości głowy. Ta głowa ma 0.098, więc 0.020×0.040.
// Pierwsza wersja użyła wymiarów Drużynnika WPROST i na renderze wąsy zwisały
// poniżej brody, czytając się jako maska na twarzy — poprawka z oglądu.
function getSJWasy(): THREE.BoxGeometry { return (gSJWasy ||= new THREE.BoxGeometry(0.020 * HEX_R, 0.040 * HEX_R, 0.013 * HEX_R)); }
function getSJHairBack(): THREE.BoxGeometry { return (gSJHairBack ||= new THREE.BoxGeometry(0.086 * HEX_R, 0.062 * HEX_R, 0.026 * HEX_R)); }
/** Czapka skórzana (K7) — miękki stożek ścięty, NIE hełm. */
function getSJCap(): THREE.CylinderGeometry { return (gSJCap ||= new THREE.CylinderGeometry(0.034 * HEX_R, 0.058 * HEX_R, 0.062 * HEX_R, 8, 1)); }
// Otok MUSI być węższy niż dolna krawędź czapki (0.058) na swojej wysokości —
// przy 0.061 wystawał poza stożek i cała czapka czytała się jako kapelusz
// z rondem. Poprawka z oglądu renderu.
function getSJCapBand(): THREE.CylinderGeometry { return (gSJCapBand ||= new THREE.CylinderGeometry(0.059 * HEX_R, 0.059 * HEX_R, 0.022 * HEX_R, 8, 1)); }
function getSJEarR(): THREE.BoxGeometry { return (gSJEarR ||= new THREE.BoxGeometry(0.009 * HEX_R, 0.025 * HEX_R, 0.016 * HEX_R)); }
function getSJEyeR(): THREE.BoxGeometry { return (gSJEyeR ||= new THREE.BoxGeometry(0.014 * HEX_R, 0.010 * HEX_R, 0.007 * HEX_R)); }
function getSJUpArm(): THREE.BoxGeometry { return (gSJUpArm ||= new THREE.BoxGeometry(0.040 * HEX_R, SJ_UPARM_L * HEX_R, 0.040 * HEX_R)); }
function getSJForearm(): THREE.BoxGeometry { return (gSJForearm ||= new THREE.BoxGeometry(0.031 * HEX_R, SJ_FOREARM_L * HEX_R, 0.031 * HEX_R)); }
function getSJFist(): THREE.BoxGeometry { return (gSJFist ||= new THREE.BoxGeometry(0.036 * HEX_R, 0.036 * HEX_R, 0.038 * HEX_R)); }
function getSJThigh(): THREE.BoxGeometry { return (gSJThigh ||= new THREE.BoxGeometry(0.044 * HEX_R, SJ_THIGH_L * HEX_R, 0.050 * HEX_R)); }
function getSJShin(): THREE.BoxGeometry { return (gSJShin ||= new THREE.BoxGeometry(0.031 * HEX_R, SJ_SHIN_L * HEX_R, 0.034 * HEX_R)); }
function getSJSole(): THREE.BoxGeometry { return (gSJSole ||= new THREE.BoxGeometry(0.034 * HEX_R, 0.011 * HEX_R, 0.062 * HEX_R)); }
function getSJBootCuff(): THREE.BoxGeometry { return (gSJBootCuff ||= new THREE.BoxGeometry(0.044 * HEX_R, 0.036 * HEX_R, 0.048 * HEX_R)); }

/** Drzewce oszczepu: cieńsze i KRÓTSZE niż lanca asyryjska (0.620×HEX_R). */
function getSJJavShaft(): THREE.CylinderGeometry { return (gSJJavShaft ||= new THREE.CylinderGeometry(0.0085 * HEX_R, 0.0100 * HEX_R, (SJ_JAV_FRONT + SJ_JAV_BACK) * HEX_R, 6, 1)); }
function getSJJavGrip(): THREE.BoxGeometry { return (gSJJavGrip ||= new THREE.BoxGeometry(0.015 * HEX_R, 0.036 * HEX_R, 0.015 * HEX_R)); }
function getSJJavButt(): THREE.ConeGeometry { return (gSJJavButt ||= new THREE.ConeGeometry(0.010 * HEX_R, 0.026 * HEX_R, 5)); }
function getSJSpareShaft(): THREE.CylinderGeometry { return (gSJSpareShaft ||= new THREE.CylinderGeometry(0.0080 * HEX_R, 0.0095 * HEX_R, (SJ_SHEAF_FRONT + SJ_SHEAF_BACK) * HEX_R, 5, 1)); }

function getSJShieldFace(): THREE.CylinderGeometry { return (gSJShieldFace ||= new THREE.CylinderGeometry(0.090 * HEX_R, 0.090 * HEX_R, 0.013 * HEX_R, 12, 1)); }
function getSJShieldRim(): THREE.TorusGeometry { return (gSJShieldRim ||= new THREE.TorusGeometry(0.090 * HEX_R, 0.007 * HEX_R, 4, 14)); }
function getSJShieldPlank(): THREE.BoxGeometry { return (gSJShieldPlank ||= new THREE.BoxGeometry(0.170 * HEX_R, 0.014 * HEX_R, 0.006 * HEX_R)); }
function getSJShieldBoss(): THREE.SphereGeometry { return (gSJShieldBoss ||= new THREE.SphereGeometry(0.021 * HEX_R, 8, 6)); }

function getSJUnit(): THREE.BoxGeometry { return (gSJUnit ||= new THREE.BoxGeometry(1, 1, 1)); }

// ---------------------------------------------------------------------------
// GROT OSZCZEPU — wąski liść na tulei. Ten sam profil-generator co grot lancy
// w T1, ale WYRAŹNIE węższy i krótszy: oszczep miotany ma lekki, przebijający
// grot, nie szeroki liść broni do pchnięcia (K1). Zakotwiczony w y=0.
// ---------------------------------------------------------------------------
function sjMakeLeafHeadGeo(len: number, wMax: number, tMax: number): THREE.BufferGeometry {
  const sections: [number, number, number][] = ([
    [0.00, 0.30, 0.60], [0.16, 0.78, 1.00], [0.42, 1.00, 0.88],
    [0.76, 0.54, 0.50], [1.00, 0.04, 0.10],
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
function getSJJavHead(): THREE.BufferGeometry {
  return (gSJJavHead ||= sjMakeLeafHeadGeo(0.075 * HEX_R, 0.024 * HEX_R, 0.010 * HEX_R));
}
function getSJSpareHead(): THREE.BufferGeometry {
  return (gSJSpareHead ||= sjMakeLeafHeadGeo(0.066 * HEX_R, 0.022 * HEX_R, 0.009 * HEX_R));
}

// ===========================================================================
// KINEMATYKA — konwencja rodziny konnej: PRZÓD = +Z, theta liczone od pionu.
// ===========================================================================
const SJ_UP = new THREE.Vector3(0, 1, 0);

function sjDown(theta: number): THREE.Vector3 {
  return new THREE.Vector3(0, -Math.cos(theta), Math.sin(theta));
}
function sjUpDir(phi: number): THREE.Vector3 {
  return new THREE.Vector3(0, Math.cos(phi), Math.sin(phi));
}

function sjSegDown(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, theta: number, len: number, name?: string,
): THREE.Vector3 {
  const dir = sjDown(theta);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = Math.PI - theta;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  if (name !== undefined) mesh.name = name;
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

function sjSegUp(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, phi: number, len: number, spin = 0,
): THREE.Vector3 {
  const dir = sjUpDir(phi);
  const mesh = new THREE.Mesh(geo, mtl);
  mesh.rotation.x = phi;
  if (spin !== 0) mesh.rotation.y = spin;
  mesh.position.copy(P.clone().addScaledVector(dir, len * 0.5));
  parent.add(mesh);
  return P.clone().addScaledVector(dir, len);
}

function sjAlong(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  P: THREE.Vector3, D: THREE.Vector3, name?: string,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(SJ_UP, D.clone().normalize());
  mesh.position.copy(P);
  if (name !== undefined) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

/** Segment stałej długości od A wzdłuż jednostkowego kierunku D. */
function sjAlongLen(
  parent: THREE.Object3D, geo: THREE.BufferGeometry, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, D: THREE.Vector3, len: number, name?: string,
): THREE.Vector3 {
  const mesh = new THREE.Mesh(geo, mtl);
  if (D.y < -0.9999) mesh.rotation.x = Math.PI;
  else mesh.quaternion.setFromUnitVectors(SJ_UP, D);
  mesh.position.copy(A.clone().addScaledVector(D, len * 0.5));
  if (name !== undefined) mesh.name = name;
  parent.add(mesh);
  return A.clone().addScaledVector(D, len);
}

/**
 * RAMIĘ NA DWUKOSTNYM IK — ta sama technika co `acArmIK` w T1
 * (`zelazo-konnica-asyryjska-opus5.ts`), przeniesiona świadomie.
 *
 * POWÓD (lekcja rundy 1 tematu T1, spisana tam wprost): przy ramieniu
 * budowanym dwoma odcinkami o zadanych kątach dłoń ląduje tam, gdzie wypadnie,
 * a nie tam, gdzie ma trzymać broń — a gdy oba odcinki dostaną TEN SAM
 * kierunek, ramię wychodzi proste jak kij i mija swój cel o dowolną odległość.
 * Tu `T` jest twardym CELEM dłoni (chwyt drzewca), zasięg jest przycinany do
 * `(L1+L2)*0.999`, a `pole` rozstrzyga, w którą stronę wypada łokieć.
 */
function sjArmIK(
  parent: THREE.Object3D, S: THREE.Vector3, T: THREE.Vector3, pole: THREE.Vector3,
  mArm: THREE.MeshStandardMaterial, mFist: THREE.MeshStandardMaterial | null,
  namePrefix?: string,
): { hand: THREE.Vector3; elbow: THREE.Vector3; axis: THREE.Vector3 } {
  const L1 = SJ_UPARM_L * HEX_R, L2 = SJ_FOREARM_L * HEX_R;
  const dv = T.clone().sub(S);
  const dist = Math.min(dv.length(), (L1 + L2) * 0.999);
  const dn = dv.clone().normalize();
  const a = (dist * dist + L1 * L1 - L2 * L2) / (2 * dist);
  const h = Math.sqrt(Math.max(L1 * L1 - a * a, 0));
  const C = S.clone().addScaledVector(dn, a);
  const pp = pole.clone().sub(dn.clone().multiplyScalar(pole.dot(dn)));
  if (pp.lengthSq() < 1e-8) pp.set(0, -1, 0);
  pp.normalize();
  const elbow = C.clone().addScaledVector(pp, h);
  const dU = elbow.clone().sub(S).normalize();
  sjAlongLen(parent, getSJUpArm(), mArm, S, dU, L1, namePrefix ? namePrefix + '-uparm' : undefined);
  const E = S.clone().addScaledVector(dU, L1);
  const axis = T.clone().sub(E).normalize();
  const hand = sjAlongLen(parent, getSJForearm(), mArm, E, axis, L2, namePrefix ? namePrefix + '-forearm' : undefined);
  if (mFist !== null) {
    const fist = new THREE.Mesh(getSJFist(), mFist);
    if (axis.y < -0.9999) fist.rotation.x = Math.PI;
    else fist.quaternion.setFromUnitVectors(SJ_UP, axis);
    fist.position.copy(hand.clone().addScaledVector(axis, 0.010 * HEX_R));
    if (namePrefix !== undefined) fist.name = namePrefix + '-fist';
    parent.add(fist);
  }
  return { hand, elbow: E, axis };
}

function sjStrap(
  parent: THREE.Object3D, mtl: THREE.MeshStandardMaterial,
  A: THREE.Vector3, B: THREE.Vector3, w: number, t: number, name?: string,
): THREE.Mesh {
  const d = B.clone().sub(A);
  const len = d.length();
  const mesh = new THREE.Mesh(getSJUnit(), mtl);
  mesh.scale.set(w, Math.max(len, 1e-5), t);
  if (len > 1e-6) {
    if (d.y / len < -0.9999) mesh.rotation.x = Math.PI;
    else mesh.quaternion.setFromUnitVectors(SJ_UP, d.clone().normalize());
  }
  mesh.position.copy(A).addScaledVector(d, 0.5);
  if (name !== undefined) mesh.name = name;
  parent.add(mesh);
  return mesh;
}

// ── noga konia ─────────────────────────────────────────────────────────────
const SJ_LEG_UP_F = 0.116;
const SJ_LEG_LO_F = 0.116;
const SJ_LEG_UP_R = 0.122;
const SJ_LEG_LO_R = 0.116;
const SJ_LEG_JOINT_OVERLAP = 0.008;
const SJ_HOOF_H = 0.032;

function sjHorseLeg(
  parent: THREE.Object3D, mCoat: THREE.MeshStandardMaterial,
  mDark: THREE.MeshStandardMaterial, mHoof: THREE.MeshStandardMaterial,
  sx: number, zPiv: number, yPiv: number, thU: number, thL: number, rear: boolean,
): void {
  const Lu = (rear ? SJ_LEG_UP_R : SJ_LEG_UP_F) * SJ_S * HEX_R;
  const Ll = (rear ? SJ_LEG_LO_R : SJ_LEG_LO_F) * SJ_S * HEX_R;
  let P = new THREE.Vector3(sx * SJ_S * HEX_R, yPiv * SJ_S * HEX_R, zPiv * SJ_S * HEX_R);
  P = sjSegDown(parent, rear ? getSJUpRear() : getSJUpFrnt(), mCoat, P, thU, Lu);
  P.y += SJ_LEG_JOINT_OVERLAP * SJ_S * HEX_R;
  P = sjSegDown(parent, getSJLower(), mCoat, P, thL, Ll);
  const past = new THREE.Mesh(getSJPastern(), mDark);
  past.position.copy(P.clone().addScaledVector(sjDown(thL), 0.004 * SJ_S * HEX_R));
  parent.add(past);
  const hoof = new THREE.Mesh(getSJHoof(), mHoof);
  hoof.position.set(P.x, P.y - SJ_HOOF_H * 0.5 * SJ_S * HEX_R, P.z + 0.004 * SJ_S * HEX_R);
  parent.add(hoof);
}

interface SJMats {
  mCoat: THREE.MeshStandardMaterial; mCoatLt: THREE.MeshStandardMaterial;
  mCoatDk: THREE.MeshStandardMaterial; mMane: THREE.MeshStandardMaterial;
  mHoof: THREE.MeshStandardMaterial;
  mSkin: THREE.MeshStandardMaterial; mSkinDk: THREE.MeshStandardMaterial;
  mHair: THREE.MeshStandardMaterial; mHairDk: THREE.MeshStandardMaterial;
  mEye: THREE.MeshStandardMaterial;
  mLinen: THREE.MeshStandardMaterial; mLeather: THREE.MeshStandardMaterial;
  mLeathDk: THREE.MeshStandardMaterial; mWool: THREE.MeshStandardMaterial;
  mFur: THREE.MeshStandardMaterial; mSteel: THREE.MeshStandardMaterial;
  mIron: THREE.MeshStandardMaterial; mIronLt: THREE.MeshStandardMaterial;
  mWood: THREE.MeshStandardMaterial; mOwner: THREE.MeshStandardMaterial;
}

function sjMakeMaterials(mat: MatFactory, ownerColor_: number): SJMats {
  return {
    mCoat:    mat(SJ_COAT,      0.04, 0.87),
    mCoatLt:  mat(SJ_COAT_LT,   0.04, 0.88),
    mCoatDk:  mat(SJ_COAT_DK,   0.04, 0.89),
    mMane:    mat(SJ_MANE,      0.04, 0.90),
    mHoof:    mat(SJ_HOOF,      0.08, 0.72),
    mSkin:    mat(SJ_SKIN,      0.05, 0.80),
    mSkinDk:  mat(SJ_SKIN_DK,   0.05, 0.82),
    mHair:    mat(SJ_HAIR_SLAV, 0.04, 0.86),
    mHairDk:  mat(SJ_HAIR_DK,   0.04, 0.88),
    mEye:     mat(SJ_EYE,       0.05, 0.86),
    mLinen:   mat(SJ_LINEN,     0.05, 0.84),
    mLeather: mat(SJ_LEATHER,   0.06, 0.82),
    mLeathDk: mat(SJ_LEATH_DK,  0.05, 0.86),
    mWool:    mat(SJ_WOOL_DK,   0.05, 0.88),
    mFur:     mat(SJ_FUR,       0.04, 0.92),
    mSteel:   mat(SJ_STEEL,     0.55, 0.35),
    mIron:    mat(SJ_IRON,      0.55, 0.40),
    mIronLt:  mat(SJ_IRON_LT,   0.58, 0.34),
    mWood:    mat(SJ_WOOD,      0.05, 0.84),
    mOwner:   mat(ownerColor_,  0.10, 0.70),
  };
}

// ===========================================================================
// KOŃ — mały koń leśny (K9), maść ciemnogniada z pangaré (K10), grzywa
// opadająca (K11), siodło z terlicą i łękami (K5) na derce koloru gracza.
// Zwraca punkty zaczepienia potrzebne wyżej (wodze, puślisko).
// ===========================================================================
function sjBuildMount(root: THREE.Object3D, m: SJMats): {
  headP: THREE.Vector3; muzEnd: THREE.Vector3; bitY: number; bitZ: number;
} {
  const S = SJ_S;

  const barrel = new THREE.Mesh(getSJBarrel(), m.mCoat);
  barrel.rotation.x = Math.PI / 2;
  barrel.rotation.y = Math.PI / 7;
  barrel.scale.set(0.74, 1, 1.0);
  barrel.position.set(0, SJ_BODY_CTR * S * HEX_R, 0.004 * S * HEX_R);
  root.add(barrel);

  // PANGARÉ (K10): jasne podbrzusze — cecha „pierwotna" bez pręgi grzbietowej.
  const belly = new THREE.Mesh(getSJBelly(), m.mCoatLt);
  belly.position.set(0, (SJ_BODY_CTR - 0.086) * S * HEX_R, 0.004 * S * HEX_R);
  root.add(belly);

  const chest = new THREE.Mesh(getSJChest(), m.mCoat);
  chest.scale.set(0.82, 1.00, 0.94);
  chest.position.set(0, (SJ_BODY_CTR + 0.006) * S * HEX_R, 0.134 * S * HEX_R);
  root.add(chest);

  const rump = new THREE.Mesh(getSJRump(), m.mCoat);
  rump.scale.set(0.88, 1.00, 1.06);
  rump.position.set(0, (SJ_BODY_CTR - 0.002) * S * HEX_R, -0.140 * S * HEX_R);
  rump.name = 'sj-horse-rump';     // punkt odniesienia OSI PRZÓD-TYŁ dla asercji
  root.add(rump);

  const withers = new THREE.Mesh(getSJWithers(), m.mCoat);
  withers.rotation.x = 0.20;
  withers.position.set(0, 0.406 * S * HEX_R, 0.100 * S * HEX_R);
  root.add(withers);

  // ── SZYJA: 3 segmenty, krótsza i grubsza niż u konia asyryjskiego ────────
  const neckPhi = [0.94, 0.68, 0.44];
  const neckLen = [0.076 * S * HEX_R, 0.066 * S * HEX_R, 0.052 * S * HEX_R];
  const neckGeo = [getSJNeck1(), getSJNeck2(), getSJNeck3()];
  let NP = new THREE.Vector3(0, 0.384 * S * HEX_R, 0.132 * S * HEX_R);
  const neckPts: THREE.Vector3[] = [NP.clone()];
  for (let i = 0; i < 3; i++) {
    NP = sjSegUp(root, neckGeo[i]!, m.mCoat, NP, neckPhi[i]!, neckLen[i]!, Math.PI / 6);
    neckPts.push(NP.clone());
  }

  // ── ŁEB ──────────────────────────────────────────────────────────────────
  const headP = new THREE.Vector3(0, NP.y + 0.012 * S * HEX_R, NP.z + 0.020 * S * HEX_R);
  const skull = new THREE.Mesh(getSJSkull(), m.mCoat);
  skull.rotation.x = 0.22;
  skull.position.copy(headP);
  skull.name = 'sj-horse-skull';   // punkt odniesienia OSI PRZÓD-TYŁ dla asercji
  root.add(skull);

  const muzDir = new THREE.Vector3(0, -0.31, 0.951);
  const muzBase = headP.clone().add(new THREE.Vector3(0, -0.018 * S * HEX_R, 0.028 * S * HEX_R));
  // PANGARÉ (K10): jasny pysk — druga, najlepiej widoczna cecha pierwotna.
  const muzzle = sjAlong(root, getSJMuzzle(), m.mCoatLt, muzBase.clone().addScaledVector(muzDir, 0.038 * S * HEX_R), muzDir);
  muzzle.rotation.y = Math.PI / 4;
  const muzEnd = muzBase.clone().addScaledVector(muzDir, 0.076 * S * HEX_R);
  for (const s of [-1, 1] as const) {
    const nos = new THREE.Mesh(getSJNostril(), m.mCoatDk);
    nos.position.set(s * 0.013 * S * HEX_R, muzEnd.y + 0.009 * S * HEX_R, muzEnd.z - 0.008 * S * HEX_R);
    root.add(nos);
    const eye = new THREE.Mesh(getSJEyeH(), m.mEye);
    eye.position.set(s * 0.033 * S * HEX_R, headP.y + 0.017 * S * HEX_R, headP.z + 0.013 * S * HEX_R);
    root.add(eye);
    const ear = new THREE.Mesh(getSJEar(), m.mCoat);
    ear.position.set(s * 0.020 * S * HEX_R, headP.y + 0.050 * S * HEX_R, headP.z - 0.012 * S * HEX_R);
    ear.rotation.z = -s * 0.26;
    ear.rotation.x = 0.16;
    root.add(ear);
  }

  // ── GRZYWA OPADAJĄCA (K11) — kosmyki zwisają na LEWY (+X) bok szyi ───────
  const maneRad = [0.058 * S * HEX_R, 0.049 * S * HEX_R, 0.042 * S * HEX_R];
  for (let i = 0; i < 3; i++) {
    const phi = neckPhi[i]!;
    const crest = new THREE.Vector3(0, Math.sin(phi), -Math.cos(phi));
    const mid = neckPts[i]!.clone().add(neckPts[i + 1]!).multiplyScalar(0.5);
    for (const f of [-0.30, 0.30] as const) {
      const along = sjUpDir(phi).multiplyScalar(neckLen[i]! * f);
      const lock = new THREE.Mesh(getSJManeLock(), m.mMane);
      lock.rotation.x = phi * 0.35;          // OPADA, nie stoi na grzebieniu
      lock.rotation.z = -0.30;
      lock.position.copy(
        mid.clone().add(along)
          .addScaledVector(crest, maneRad[i]! * 0.62)
          .add(new THREE.Vector3(0.030 * S * HEX_R, -0.014 * S * HEX_R, 0)),
      );
      root.add(lock);
    }
  }
  const forelock = new THREE.Mesh(getSJForelock(), m.mMane);
  forelock.rotation.x = 0.58;
  forelock.position.set(0, headP.y + 0.038 * S * HEX_R, headP.z + 0.026 * S * HEX_R);
  root.add(forelock);

  // ── NOGI: 3 podporowe + 1 uniesiona w kroku ─────────────────────────────
  const LX = 0.058;
  sjHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, LX, 0.118, SJ_LEG_TOP_F, 0.08, -0.05, false);
  sjHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, -LX, 0.122, SJ_LEG_TOP_F, 0.42, 0.30, false);
  sjHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, -LX, -0.126, SJ_LEG_TOP_R, -0.26, 0.14, true);
  sjHorseLeg(root, m.mCoat, m.mCoatDk, m.mHoof, LX, -0.130, SJ_LEG_TOP_R, -0.28, 0.16, true);

  // ── OGON ─────────────────────────────────────────────────────────────────
  let TP = new THREE.Vector3(0, 0.388 * S * HEX_R, -0.192 * S * HEX_R);
  TP = sjSegUp(root, getSJTail1(), m.mMane, TP, -1.20, 0.050 * S * HEX_R);
  sjSegUp(root, getSJTail2(), m.mMane, TP, -2.98, 0.132 * S * HEX_R);

  // ── DERKA (kolor gracza, slot 1) ─────────────────────────────────────────
  const padTop = new THREE.Mesh(getSJPadTop(), m.mOwner);
  padTop.position.set(0, SJ_BACK_Y * S * HEX_R, (SJ_SEAT_Z - 0.016) * S * HEX_R);
  padTop.name = 'sj-horse-pad';     // linia GRZBIETU — odniesienie dla asercji (H)
  root.add(padTop);
  for (const s of [-1, 1] as const) {
    const flap = new THREE.Mesh(getSJPadFlap(), m.mOwner);
    flap.rotation.z = -s * 0.10;
    flap.position.set(s * 0.082 * S * HEX_R, 0.382 * S * HEX_R, (SJ_SEAT_Z - 0.010) * S * HEX_R);
    root.add(flap);
  }

  // ── SIODŁO Z TERLICĄ I ŁĘKAMI (K5) — bez niego strzemię nie ma na czym wisieć
  const seat = new THREE.Mesh(getSJSeat(), m.mLeather);
  seat.position.set(0, (SJ_BACK_ABS + SJ_SADDLE_H * 0.5) * HEX_R, SJ_SEAT_ZA * HEX_R);
  seat.name = 'sj-saddle-seat';
  root.add(seat);
  const archF = new THREE.Mesh(getSJArchF(), m.mLeathDk);   // przedni łęk (niski)
  archF.position.set(0, (SJ_BACK_ABS + SJ_SADDLE_H + 0.006) * HEX_R, (SJ_SEAT_ZA + 0.086) * HEX_R);
  archF.name = 'sj-saddle-arch-front';
  root.add(archF);
  const archR = new THREE.Mesh(getSJArchR(), m.mLeathDk);   // tylni łęk (wyższy)
  archR.position.set(0, (SJ_BACK_ABS + SJ_SADDLE_H + 0.012) * HEX_R, (SJ_SEAT_ZA - 0.088) * HEX_R);
  archR.name = 'sj-saddle-arch-rear';
  root.add(archR);
  for (const s of [-1, 1] as const) {
    const skirt = new THREE.Mesh(getSJSkirt(), m.mLeather);
    skirt.position.set(s * 0.068 * HEX_R, (SJ_BACK_ABS - 0.012) * HEX_R, SJ_STIRRUP_ANCHOR_Z * HEX_R);
    root.add(skirt);
  }

  // ── POPRĄG / NAPIERŚNIK / POŚLIŚNIK ─────────────────────────────────────
  const girth = new THREE.Mesh(getSJGirth(), m.mLeather);
  girth.rotation.x = Math.PI / 2;
  girth.rotation.y = Math.PI / 7;
  girth.scale.set(0.74, 1, 1);
  girth.position.set(0, SJ_BODY_CTR * S * HEX_R, (SJ_SEAT_Z + 0.006) * S * HEX_R);
  girth.name = 'sj-horse-girth';    // linia BRZUCHA — odniesienie dla asercji (H)
  root.add(girth);
  const breast = new THREE.Mesh(getSJBreast(), m.mLeather);
  breast.position.set(0, 0.352 * S * HEX_R, 0.200 * S * HEX_R);
  root.add(breast);
  for (const s of [-1, 1] as const) {
    sjStrap(
      root, m.mLeather,
      new THREE.Vector3(s * 0.050 * S * HEX_R, 0.430 * S * HEX_R, -0.090 * S * HEX_R),
      new THREE.Vector3(s * 0.020 * S * HEX_R, 0.390 * S * HEX_R, -0.186 * S * HEX_R),
      0.011 * S * HEX_R, 0.011 * S * HEX_R,
    );
  }

  // ── UZDA + ŻELAZNE WĘDZIDŁO ─────────────────────────────────────────────
  // Świadoma różnica wobec T1 (Z3: tam wędzidło BRĄZOWE, bo brąz był tańszy w
  // drobnych odlewach): w tej ramie czasowej okucia jeździeckie są już
  // rutynowo żelazne (te same warsztaty co ostrogi i strzemiona, K4/K6).
  const noseBand = new THREE.Mesh(getSJNoseBand(), m.mLeather);
  noseBand.rotation.x = -0.31;
  noseBand.position.set(0, muzEnd.y + 0.022 * S * HEX_R, muzEnd.z - 0.030 * S * HEX_R);
  root.add(noseBand);
  const browBand = new THREE.Mesh(getSJBrowBand(), m.mLeather);
  browBand.position.set(0, headP.y + 0.030 * S * HEX_R, headP.z + 0.026 * S * HEX_R);
  root.add(browBand);
  const bitY = muzEnd.y + 0.011 * S * HEX_R;
  const bitZ = muzEnd.z - 0.030 * S * HEX_R;
  const bit = new THREE.Mesh(getSJBit(), m.mIron);
  bit.position.set(0, bitY, bitZ);
  bit.name = 'sj-bit';
  root.add(bit);
  for (const s of [-1, 1] as const) {
    const ring = new THREE.Mesh(getSJBitRing(), m.mIronLt);
    ring.rotation.y = Math.PI / 2;
    ring.position.set(s * 0.026 * S * HEX_R, bitY, bitZ);
    root.add(ring);
    sjStrap(
      root, m.mLeather,
      new THREE.Vector3(s * 0.026 * S * HEX_R, bitY, bitZ),
      new THREE.Vector3(s * 0.030 * S * HEX_R, headP.y + 0.032 * S * HEX_R, headP.z - 0.004 * S * HEX_R),
      0.010 * S * HEX_R, 0.010 * S * HEX_R,
    );
  }

  return { headP, muzEnd, bitY, bitZ };
}

interface SJRiderAnchors {
  /** Bark LEWY (+X) — wodze + pęk oszczepów zapasowych. */
  shldL: THREE.Vector3;
  /** Bark PRAWY (-X) — ręka RZUTU. */
  shldR: THREE.Vector3;
  torsoCtr: THREE.Vector3;
  headCtr: THREE.Vector3;
}

/**
 * KORPUS JEŹDŹCA — lniana rubacha + skórzany kaftan + tkany pas (K7, K12),
 * wąsy bez brody, czapka skórzana z futrzanym otokiem (K7), nogi ZGIĘTE
 * w kolanach ze stopami W STRZEMIONACH (K4) i ostrogami haczykowatymi (K6).
 * NIE dodaje ramion ani broni — to robi wywołujący.
 */
function sjBuildRiderCore(root: THREE.Object3D, m: SJMats): SJRiderAnchors {
  const SZ = SJ_SEAT_ZA;

  // ── korpus: rubacha, kaftan, pas koloru gracza (slot 3) ─────────────────
  const torso = new THREE.Mesh(getSJTorso(), m.mLinen);
  torso.rotation.x = -0.05;
  torso.position.set(0, (SJ_SEAT_Y + SJ_TORSO_H * 0.5) * HEX_R, SZ * HEX_R);
  torso.name = 'sj-rider-torso';
  root.add(torso);
  const kaftan = new THREE.Mesh(getSJKaftan(), m.mLeather);
  kaftan.position.set(0, (SJ_TORSO_TOP - 0.052) * HEX_R, SZ * HEX_R);
  root.add(kaftan);
  const belt = new THREE.Mesh(getSJBelt(), m.mOwner);
  belt.position.set(0, (SJ_SEAT_Y + 0.030) * HEX_R, SZ * HEX_R);
  belt.name = 'sj-rider-belt';
  root.add(belt);

  // ── głowa: wąsy (bez brody), włosy do ramion, czapka skórzana ───────────
  const neckR = new THREE.Mesh(getSJNeckR(), m.mSkin);
  neckR.position.set(0, (SJ_TORSO_TOP + SJ_NECK_H * 0.5) * HEX_R, SZ * HEX_R);
  root.add(neckR);
  const head = new THREE.Mesh(getSJHead(), m.mSkin);
  head.position.set(0, SJ_HEAD_CTR * HEX_R, SZ * HEX_R);
  head.name = 'sj-rider-head';
  root.add(head);
  const jaw = new THREE.Mesh(getSJJaw(), m.mSkinDk);
  jaw.position.set(0, (SJ_HEAD_CTR - SJ_HEAD_S * 0.38) * HEX_R, (SZ + 0.010) * HEX_R);
  root.add(jaw);
  for (const s of [-1, 1] as const) {
    const w = new THREE.Mesh(getSJWasy(), m.mHair);
    w.rotation.z = s * 0.35;
    w.position.set(
      s * 0.021 * HEX_R,
      (SJ_HEAD_CTR - 0.022) * HEX_R,
      (SZ + SJ_HEAD_S * 0.5 + 0.005) * HEX_R,
    );
    w.name = 'sj-rider-wasy';
    root.add(w);
    const ear = new THREE.Mesh(getSJEarR(), m.mSkinDk);
    ear.position.set(s * (SJ_HEAD_S * 0.5 + 0.004) * HEX_R, (SJ_HEAD_CTR - 0.006) * HEX_R, SZ * HEX_R);
    root.add(ear);
  }
  const hairBack = new THREE.Mesh(getSJHairBack(), m.mHairDk);
  hairBack.position.set(0, (SJ_HEAD_CTR - 0.014) * HEX_R, (SZ - SJ_HEAD_S * 0.5 - 0.010) * HEX_R);
  root.add(hairBack);
  const cap = new THREE.Mesh(getSJCap(), m.mLeather);
  cap.position.set(0, (SJ_HEAD_CTR + 0.058) * HEX_R, SZ * HEX_R);
  cap.name = 'sj-rider-cap';
  root.add(cap);
  const band = new THREE.Mesh(getSJCapBand(), m.mFur);
  // Otok na LINII WŁOSÓW, nie na oczach: przy +0.030 ośmiokątny walec przecinał
  // twarz na wysokości oczu i czytał się jako przepaska na oczach (ogląd renderu).
  band.position.set(0, (SJ_HEAD_CTR + 0.042) * HEX_R, SZ * HEX_R);
  root.add(band);

  // OCZY — dwa ciemne punkty. Bez nich (pierwsza wersja) twarz pod czapką była
  // pustym blokiem; generyczny `case 'konnica'` w units.ts też daje jeźdźcowi
  // punkty oczu, więc to konwencja repo, nie odstępstwo.
  for (const s of [-1, 1] as const) {
    const eye = new THREE.Mesh(getSJEyeR(), m.mEye);
    eye.position.set(
      s * 0.022 * HEX_R,
      (SJ_HEAD_CTR + 0.010) * HEX_R,
      (SZ + SJ_HEAD_S * 0.5 + 0.003) * HEX_R,
    );
    root.add(eye);
  }

  // ── NOGI: kolano ZGIĘTE, stopa W STRZEMIENIU, ostroga haczykowata ──────
  for (const s of [-1, 1] as const) {
    let P = new THREE.Vector3(s * SJ_HIP_X * HEX_R, SJ_SEAT_Y * HEX_R, SZ * HEX_R);
    P = sjSegDown(root, getSJThigh(), m.mWool, P, SJ_THIGH_TH, SJ_THIGH_L * HEX_R,
      s > 0 ? 'sj-leg-thigh' : undefined);
    P.x += s * 0.005 * HEX_R;
    P.y += 0.008 * HEX_R;
    P = sjSegDown(root, getSJShin(), m.mWool, P, SJ_SHIN_TH, SJ_SHIN_L * HEX_R,
      s > 0 ? 'sj-leg-shin' : undefined);

    const cuff = new THREE.Mesh(getSJBootCuff(), m.mLeather);
    cuff.position.set(P.x, P.y + 0.016 * HEX_R, P.z + 0.006 * HEX_R);
    root.add(cuff);
    const sole = new THREE.Mesh(getSJSole(), m.mLeathDk);
    sole.position.set(P.x, P.y - 0.005 * HEX_R, P.z + 0.012 * HEX_R);
    sole.name = 'sj-boot-sole';
    root.add(sole);

    // OSTROGA HACZYKOWATA (K6) — bodziec za piętą, zagięty ku dołowi.
    const spur = new THREE.Mesh(getSJSpur(), m.mIron);
    spur.rotation.x = Math.PI * 0.5 - 0.42;
    spur.position.set(P.x, P.y + 0.002 * HEX_R, P.z - 0.040 * HEX_R);
    spur.name = 'sj-spur';
    root.add(spur);

    // STRZEMIĘ (K4): kabłąk pod podeszwą + stopka; puślisko biegnie od
    // PRZEDNIEJ części siodła w dół do ucha kabłąka. Kabłąk jest wyprowadzony
    // Z FAKTYCZNEJ pozycji stopy, a puślisko ze STAŁEGO zaczepu na siodle —
    // gdyby poza nogi się rozjechała, puślisko położy się skośnie i asercja
    // (H5) to złapie. To NIE jest zależność wpisana ręcznie w obie strony.
    const treadY = P.y - 0.019 * HEX_R;
    const treadZ = P.z + 0.012 * HEX_R;
    const tread = new THREE.Mesh(getSJStirrupTread(), m.mIron);
    tread.position.set(P.x, treadY, treadZ);
    tread.name = 'sj-stirrup-tread';
    root.add(tread);
    // Nazwa 'sj-stirrup-hoop', NIE '...-bow': ciąg „bow" jest w tym repo
    // zarezerwowany dla ŁUKU (`ac-lucznicza-bow`, T1), a asercja
    // odróżnialności (C1) szuka w nazwach właśnie „bow"/„lance"/„pennon".
    const hoop = new THREE.Mesh(getSJStirrup(), m.mIronLt);
    hoop.rotation.y = Math.PI / 2;
    hoop.rotation.z = -Math.PI * 0.075;
    hoop.position.set(P.x, treadY + 0.030 * HEX_R, treadZ);
    hoop.name = 'sj-stirrup-hoop';
    root.add(hoop);
    const eye = new THREE.Vector3(P.x, treadY + 0.058 * HEX_R, treadZ);
    sjStrap(
      root, m.mLeathDk,
      new THREE.Vector3(s * (SJ_HIP_X - 0.008) * HEX_R, (SJ_BACK_ABS + 0.006) * HEX_R, SJ_STIRRUP_ANCHOR_Z * HEX_R),
      eye,
      0.010 * HEX_R, 0.010 * HEX_R,
      'sj-stirrup-leather',
    );
  }

  const shldL = new THREE.Vector3(SJ_SHLD_X * HEX_R, SJ_SHLD_Y * HEX_R, SZ * HEX_R);
  const shldR = new THREE.Vector3(-SJ_SHLD_X * HEX_R, SJ_SHLD_Y * HEX_R, SZ * HEX_R);
  return {
    shldL, shldR,
    torsoCtr: new THREE.Vector3(0, (SJ_SEAT_Y + SJ_TORSO_H * 0.5) * HEX_R, SZ * HEX_R),
    headCtr: new THREE.Vector3(0, SJ_HEAD_CTR * HEX_R, SZ * HEX_R),
  };
}

/** Jeden oszczep wzdłuż `dir`, zakotwiczony w punkcie chwytu `grip`. */
function sjBuildJavelin(
  root: THREE.Object3D, m: SJMats, grip: THREE.Vector3, dir: THREE.Vector3,
  front: number, back: number, shaftGeo: THREE.BufferGeometry,
  headGeo: THREE.BufferGeometry, nameShaft: string, nameHead: string,
  withGrip: boolean, nameButt?: string,
): void {
  const at = (t: number): THREE.Vector3 => grip.clone().addScaledVector(dir, t * HEX_R);
  // Drzewce jest NIESYMETRYCZNE względem chwytu, stąd przesunięty środek walca.
  const shaftMid = (front - back) * 0.5;
  sjAlong(root, shaftGeo, m.mWood, at(shaftMid), dir, nameShaft);
  if (withGrip) sjAlong(root, getSJJavGrip(), m.mLeathDk, at(0), dir);
  sjAlong(root, headGeo, m.mIronLt, at(front), dir, nameHead);
  if (nameButt !== undefined) {
    const butt = sjAlong(root, getSJJavButt(), m.mIron, at(-back), dir, nameButt);
    butt.rotateX(Math.PI);
  }
}

// ===========================================================================
// JEŹDZIEC Z OSZCZEPAMI — OPUS 5 (Żelazo, Słowianie)
// units.json: Atak dystansowy=2, Zasięg=2, Ilość pocisków=5, Pancerz=3.
// ===========================================================================
export function buildZelazoJezdziecOszczepami(ownerColor_: number): THREE.Group {
  const group = new THREE.Group();
  const { mats, mat } = makeMats();
  const root = new THREE.Group();
  root.rotation.y = SJ_YAW;
  group.add(root);

  const m = sjMakeMaterials(mat, ownerColor_);
  const mount = sjBuildMount(root, m);
  const anc = sjBuildRiderCore(root, m);

  // ── PRAWE (-X) RAMIĘ: OSZCZEP W CHWYCIE GÓRNYM, GOTOWY DO RZUTU (K1) ────
  // Dłoń NAD linią barku i lekko za nią, łokieć zgięty — poza zamachu.
  // Ręka idzie przez IK, żeby dłoń FAKTYCZNIE trafiła w drzewce (lekcja T1).
  const throwGrip = anc.shldR.clone().add(SJ_THROW_OFF.clone().multiplyScalar(HEX_R));
  sjArmIK(root, anc.shldR, throwGrip, new THREE.Vector3(-0.80, -0.35, -0.45),
    m.mLinen, m.mSkin, 'sj-throw');

  const dJav = sjUpDir(SJ_JAV_TILT);
  sjBuildJavelin(
    root, m, throwGrip, dJav, SJ_JAV_FRONT, SJ_JAV_BACK,
    getSJJavShaft(), getSJJavHead(),
    'sj-jav-shaft', 'sj-jav-head', true, 'sj-jav-butt',
  );

  // ── LEWE (+X) RAMIĘ: WODZE + PĘK 4 OSZCZEPÓW ZAPASOWYCH (K2) ───────────
  const sheafGrip = SJ_SHEAF_GRIP.clone().multiplyScalar(HEX_R);
  const armL = sjArmIK(root, anc.shldL, sheafGrip, new THREE.Vector3(0.85, -0.30, -0.40),
    m.mLinen, m.mSkin, 'sj-rein');

  const dSheaf = sjUpDir(SJ_SHEAF_TILT);
  // Cztery drzewca rozsunięte wokół osi chwytu — pęk, nie jedno drzewce.
  const sheafOff: [number, number][] = [[-0.011, 0.009], [0.011, 0.009], [-0.007, -0.011], [0.013, -0.008]];
  for (let i = 0; i < SJ_SHEAF_N; i++) {
    const off = sheafOff[i]!;
    const g = sheafGrip.clone().add(new THREE.Vector3(off[0] * HEX_R, off[1] * HEX_R, 0));
    sjBuildJavelin(
      root, m, g, dSheaf, SJ_SHEAF_FRONT, SJ_SHEAF_BACK,
      getSJSpareShaft(), getSJSpareHead(),
      'sj-spare-jav-shaft', 'sj-spare-jav-head', false,
    );
  }

  // WODZE: od PRAWDZIWEGO pierścienia wędzidła (bitY/bitZ z sjBuildMount) do
  // lewego nadgarstka — ta sama dyscyplina co w T1 rundzie 2, gdzie runda 1
  // zaczynała wodze „na oko" w powietrzu pod pyskiem konia.
  const wristL = armL.hand.clone();
  sjStrap(root, m.mLeathDk,
    new THREE.Vector3(0.026 * SJ_S * HEX_R, mount.bitY, mount.bitZ),
    new THREE.Vector3(wristL.x - 0.008 * HEX_R, wristL.y - 0.004 * HEX_R, wristL.z),
    0.007 * HEX_R, 0.007 * HEX_R, 'sj-rein-strap');

  // ── TARCZA OKRĄGŁA NA PLECACH (K8) ─────────────────────────────────────
  // Kanon Drużynnika: pole = kolor gracza, deski promieniste, stalowe UMBO,
  // skórzany rant — ale niesiona na pasie naramiennym, nie na przedramieniu.
  const shieldCtr = new THREE.Vector3(
    0,
    (SJ_SEAT_Y + 0.098) * HEX_R,
    (SJ_SEAT_ZA - SJ_TORSO_D * 0.5 - 0.030) * HEX_R,
  );
  const sh = new THREE.Group();
  sh.position.copy(shieldCtr);
  sh.rotation.x = Math.PI / 2 + 0.16;    // płaszczyzna tarczy ≈ płaszczyzna pleców
  sh.rotation.z = 0.10;
  const face = new THREE.Mesh(getSJShieldFace(), m.mOwner);
  face.name = 'sj-shield-back';
  sh.add(face);
  const rimS = new THREE.Mesh(getSJShieldRim(), m.mLeather);
  rimS.rotation.x = Math.PI / 2;
  rimS.name = 'sj-shield-rim';
  sh.add(rimS);
  for (const a of [0, Math.PI / 3, -Math.PI / 3]) {
    const pl = new THREE.Mesh(getSJShieldPlank(), m.mWood);
    pl.rotation.y = a;
    pl.position.set(0, 0.009 * HEX_R, 0);
    sh.add(pl);
  }
  const boss = new THREE.Mesh(getSJShieldBoss(), m.mSteel);
  boss.position.set(0, -0.014 * HEX_R, 0);   // umbo NA ZEWNĄTRZ (od pleców)
  boss.name = 'sj-shield-boss';
  sh.add(boss);
  root.add(sh);

  // PAS NARAMIENNY tarczy — od lewego barku ukośnie pod prawą pachę.
  sjStrap(root, m.mLeather,
    anc.shldL.clone().add(new THREE.Vector3(-0.006 * HEX_R, 0.012 * HEX_R, -0.006 * HEX_R)),
    new THREE.Vector3(-SJ_SHLD_X * 0.85 * HEX_R, (SJ_SEAT_Y + 0.044) * HEX_R, (SJ_SEAT_ZA - 0.026) * HEX_R),
    0.014 * HEX_R, 0.010 * HEX_R, 'sj-shield-baldric');

  group.userData['mats'] = mats;
  group.userData['perTokenGeos'] = [];
  return group;
}

/** Zwolnienie singletonów modułu (konwencja disposeUnitGeometries z units.ts). */
export function disposeZelazoJezdziecOszczepamiOpus5Geometries(): void {
  const all: (THREE.BufferGeometry | null)[] = [
    gSJBarrel, gSJChest, gSJRump, gSJWithers, gSJBelly,
    gSJNeck1, gSJNeck2, gSJNeck3, gSJSkull, gSJMuzzle, gSJNostril, gSJEar, gSJEyeH,
    gSJManeLock, gSJForelock,
    gSJUpFrnt, gSJUpRear, gSJLower, gSJPastern, gSJHoof,
    gSJTail1, gSJTail2,
    gSJPadTop, gSJPadFlap, gSJSeat, gSJArchF, gSJArchR, gSJSkirt,
    gSJGirth, gSJBreast, gSJNoseBand, gSJBrowBand, gSJBit, gSJBitRing,
    gSJStirrup, gSJStirrupTread, gSJSpur,
    gSJTorso, gSJKaftan, gSJBelt, gSJNeckR, gSJHead, gSJJaw, gSJWasy, gSJHairBack,
    gSJCap, gSJCapBand, gSJEarR, gSJEyeR,
    gSJUpArm, gSJForearm, gSJFist, gSJThigh, gSJShin, gSJSole, gSJBootCuff,
    gSJJavShaft, gSJJavGrip, gSJJavHead, gSJJavButt, gSJSpareShaft, gSJSpareHead,
    gSJShieldFace, gSJShieldRim, gSJShieldPlank, gSJShieldBoss,
    gSJUnit,
  ];
  for (const g of all) { g?.dispose(); }
  gSJBarrel = null; gSJChest = null; gSJRump = null; gSJWithers = null; gSJBelly = null;
  gSJNeck1 = gSJNeck2 = gSJNeck3 = gSJMuzzle = null;
  gSJSkull = gSJNostril = gSJEyeH = gSJManeLock = gSJForelock = null;
  gSJEar = null;
  gSJUpFrnt = gSJUpRear = gSJLower = gSJPastern = gSJHoof = null;
  gSJTail1 = gSJTail2 = null;
  gSJPadTop = gSJPadFlap = gSJSeat = gSJArchF = gSJArchR = gSJSkirt = null;
  gSJGirth = null;
  gSJBreast = gSJNoseBand = gSJBrowBand = gSJBit = null;
  gSJBitRing = null;
  gSJStirrup = null;
  gSJStirrupTread = gSJSpur = null;
  gSJTorso = gSJKaftan = gSJBelt = gSJNeckR = gSJHead = gSJJaw = gSJWasy = gSJHairBack = null;
  gSJCap = gSJCapBand = null;
  gSJEarR = gSJEyeR = null;
  gSJUpArm = gSJForearm = gSJFist = gSJThigh = gSJShin = gSJSole = gSJBootCuff = null;
  gSJJavShaft = gSJSpareShaft = null;
  gSJJavGrip = null;
  gSJJavHead = gSJSpareHead = null;
  gSJJavButt = null;
  gSJShieldFace = null;
  gSJShieldRim = null;
  gSJShieldPlank = gSJShieldBoss = null;
  gSJUnit = null;
}
