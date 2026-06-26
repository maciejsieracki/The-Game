# MAPA -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika (zeby wiedzial, co sie dzieje). Tresc identyczna.
Odpowiedzi/zadania od mastera czytaj w: dyspozycje/MAPA.md (sekcja "DO ZROBIENIA TERAZ").
NIE edytuj innych plikow w dyspozycje/.

---
(brak wpisow -- dopisuj ponizej)

---
[22.06 ~17:36] MAPA — F1 GOTOWE do oceny.
Zrobione w src/render/scene.ts (moj lane):
- rzeki na KRAWEDZIACH heksow, laczone w wierzcholkach -- liczone geometrycznie z map.riverPaths (wezsza wstega: woda + brzeg);
- bogatsze biomy + miekkie przejscia kolorow (blend do sredniej sasiadow) + doswietlenie/mniej mgly (cieniowanie);
- ocean wokol kontynentu + ramka swiata;
- geometria heksow nietknieta (pointy-top, ZERO rotateY).
Build: osobny harness src/mappreview/* -> npx vite build (NIE kanon). Podglad: Gra-podglad-MAPA.html (interaktywny: przeciagnij=obrot, kolko=zoom, "Nowy seed").
Srodowisko: mount OneDrive w sandboxie tnie swiezo zapisany scene.ts -> build zrobilem z kopii cloud-truth; plik w chmurze KOMPLETNY (1083 linie). Zrzutu nie zrobilem sam (sandbox bez przegladarki; Chrome blokuje file://) -- prosze otworz Gra-podglad-MAPA.html i ocen.
Do sprzatniecia: zostal pomocniczy gra/src/render/_scene_tail.txt (nie kompiluje sie; bash nie mial uprawnien usunac).
PYTANIE: kierunek wizualny OK, czy dopieszczac (szerokosc rzek, intensywnosc biomow, styl ramki)?

---
[22.06 ~20:35] MAPA — F1 podglad NAPRAWIONY (byl boot error).
Przyczyna: w single-file buildzie inline skrypt ruszal PRZED DOM -> document.getElementById('map') = null -> WebGLRenderer czytal null.width (blad "Cannot read properties of null (reading 'width')"). Niebieskie tlo to tylko body z CSS.
Fix: start harnessu owiniety w DOMContentLoaded (src/mappreview/main.ts). Przebudowane + wgrane: Gra-podglad-MAPA.html (~500 KB, @20:34).
PROSBA: odswiez/otworz ponownie Gra-podglad-MAPA.html i wrzuc screenshot -> ocenie F1 i dopieszcze.
Uwaga srodowiskowa: mount OneDrive w sandboxie dehydratuje moje swieze pliki (NUL/uciecia) -> buduje z oczyszczonej kopii lokalnej; pliki zrodlowe w chmurze sa POPRAWNE.

---
[22.06 ~20:56] MAPA — F1 iteracja po feedbacku Maciej. Wgrane (ODSWIEZ Gra-podglad-MAPA.html):
- PAN: WASD/strzalki przesuwaja mape (byl tylko obrot); drag=obrot, kolko=zoom.
- Wzgorza obnizone (prism 0.70->0.55, yOffset 0.15->0.10) -- zostaje jasnozielony nasyp.
- Gory: sniezne "obwarzanki" (plaski dysk) -> bialy STOZEK-czapa na szczycie.
- Rzeki: wiecej (maxRivers 2->5) + szersze/jasniejsze/uniesione -> powinny byc widoczne (popanuj WASD).
- Wybrzeze: biale -> jasnoniebieskie (0x9bd9ef / Wybrzeze 0x5bb8d8).
REGULA do zapamietania (generacja): kazdy lad musi miec >=1 heks wybrzeza -- zanotowane, zmiana w generatorze osobno.
Uwaga: iteruje na lokalnej kopii buildu (mount OneDrive ucina swieze zapisy Write); zrodla scene.ts/main.ts/generator.ts zsync do OneDrive PO akceptacji wygladu.
PROSBA: odswiez + screenshot (najlepiej z widoczna rzeka).

---
[22.06 ~21:00] MAPA — dodana REGULA wybrzeza (generator, moj lane src/map/*).
- Post-przebieg 1b w generator.ts: kazdy lad sasiadujacy z Morzem -> pierscien Wybrzeza (gwarancja >=1 heks coast; brak ladu wprost przy glebokim morzu).
- Reszta jak 20:56 (pan WASD, nizsze wzgorza, biale czapy gor, 5 rzek, jasnoniebieskie wybrzeze). Wgrane: Gra-podglad-MAPA.html @20:59.
- Zrodla (scene.ts/main.ts/generator.ts) nadal w lokalnej kopii buildu; sync do OneDrive po akceptacji wygladu (mount ucina swieze Write).
PROSBA: odswiez + screenshot (z widoczna rzeka i wybrzezem).

---
[22.06 ~21:09] MAPA — iteracja po screenie + DOPIESZCZANIE (odswiez Gra-podglad-MAPA.html @21:09).
- Rzeki RENDERUJA SIE (potwierdzone na screenie). Byly ciemne/braz -> teraz jasny BLEKIT 0x6cc8f5 + emissive (swieca), brzeg niebieski (nie braz).
- Rzeki KONCZA SIE NA LADZIE: przycinam trailing Wybrzeze/Morze z trasy (juz nie "wchodza na nadbrzeze"). DELTA na ladzie u ujscia = nastepny krok.
- Gory: -50% wysokosci (height 1.20->0.60, peak cone ~/2). Czapy sniegu zostaja (OK wg Maciej).
- Wybrzeze: bylo za jasne -> glebszy lazur (Wybrzeze 0x46a3d6, pierscien 0x5fb7e6).
- Smieci _scene_tail.txt: SKASOWANY (delete wlaczony).
- Regula rzek (gory->wzgorza->doliny->morze): generator tak trasuje (generateRivers) -- OK.
TODO nast.: delta na ladzie u ujscia (rozgalezienie/fan). Sync zrodel do OneDrive po akceptacji.
PROSBA: screenshot -> ocena koloru/ujscia rzek + proporcji gor.

---
[22.06 ~21:25] MAPA — rzeki: PRZEPISANA logika na krawedzie + dochodzenie do wybrzeza (odswiez @21:25).
- Rzeki ida po OBWODZIE heksow (krawedziami), nie przez srodek. (Bug byl na prostych odcinkach -> skok na przeciwlegla krawedz przez srodek.) Teraz na prostym odcinku rzeka obchodzi heks bokiem; 2 sasiednie heksy dziela krawedz rzeki (bonus).
- Rzeka KONCZY na heksie WYBRZEZA (styk lad-morze) -- juz nie w srodku ladu ani w morzu.
- Czarne obwodki rzek USUNIETE (czysta blekitna woda, bez brzegu, mniejsze unoszenie).
TODO: delta-fan u ujscia (po potwierdzeniu trasy). Jesli obejscia na prostych odcinkach wygladaja zle -> czystszy fix = generowanie rzek jako sciezek-KRAWEDZI w generatorze (wieksza zmiana, do decyzji).
PROSBA: screenshot -> czy rzeki sa na granicach heksow i ladnie dochodza do wybrzeza?

---
[22.06 ~21:38] MAPA — rzeki: trasowanie WIERZCHOLKOWE + stonowanie (odswiez @21:37).
- ODNOGI/U-objazdy USUNIETE: rzeka trasowana po WIERZCHOLKACH (graf rogow heksow), splyw w dol do morza -> jeden ciag po krawedziach, bez objazdow. Konczy na wierzcholku stykajacym sie z morzem.
- Kolor: emissive OFF, stonowany blekit 0x4a93c4, wezsza (0.20) -- blizej referencji Civ VI (Maciej przyslal screen).
DO DECYZJI (Maciej) -- rzeka jako DOL (nizej niz lad): w naszym stylu heksy to OSOBNE pelne pryzmy (InstancedMesh). Zatopiona rzeka znika pod wierzchami sasiednich heksow (okluzja). Prawdziwy wciety kanal wymaga NACINANIA geometrii heksow wzdluz rzeki (per-hex -> wieksza zmiana architektury). Opcje:
  (A) czysta rzeka na poziomie dolin (jak teraz),
  (B) inwestycja w nacinane koryto (terrain notch) -> realny "dol".
- Ujscie/estuarium (rozszerzenie do morza wg referencji) -> po decyzji A/B.
PYTANIE Maciej: "gniazda" (obozy/spawny?) -- czyj lane? Ja: teren + miasta (render/cities.ts). Modele jednostek = UNITS. Gniazda do przypisania przez mastera.
PROSBA: screenshot -> czy odnogi zniknely i rzeka spokojniejsza?

---
[22.06 ~21:52] MAPA — MIASTA epoki kamienia: 10 poziomow (NOWY podglad: Gra-podglad-MIASTA.html).
- Rzeka: naprawione ZNIKANIE pod heksami (zatopienie chowalo ja -> uniesienie -0.012, zawsze widoczna) @21:46.
- Miasta (lane render/cities.ts): nowy modul src/render/stoneCity.ts + podglad src/citypreview/*. 10 poziomow w rzedzie (lewo=wioska -> prawo=miasto).
  L1-5: prymityw -- lepianki/szalasy (glina + stozkowa strzecha) + ognisko (L3+) + proto-kamienie (L4-5).
  L6-10: pojawia sie CEGLA (prostokatne domki) + centralna SWIATYNIA = MEGALIT (krag stojacych kamieni + dolmen/oltarz), rosnaca. Sztandar wodza (L5+), kamienny murek (L7+).
- Referencje per-cyw od Maciej: Grecja=biale kubiki/plaskie dachy; Sumer=cegla + zikkuraty/wieze; Egipt (mulobrick/Nil); Aztek -> rozne SWIATYNIE/styl na epoke BRAZU+ (zanotowane, kazda cyw inny srodek-swiatynia).
PROSBA: screenshot/ocena 10 poziomow kamienia -> dociagne (chaty, swiatynia, gestosc, kolory).

---
[22.06 ~22:15] MAPA — miasta: MURY niezalezne od poziomu (2 wersje) (odswiez Gra-podglad-MIASTA.html).
- Usuniete dziwne "podwyzszenie a la mury" z progresji (bylo L7+).
- buildStoneAgeCity(level, owner, withWalls): mur dokladany przy DOWOLNYM poziomie (czysty kamienny wal + brama, DoubleSide).
- Podglad: 2 rzedy -- PRZOD = 10 poziomow BEZ murow, TYL = 10 poziomow Z murami.
PROSBA: ocena obu rzedow (chaty/swiatynia + wal).

---
[22.06 ~22:45] MAPA — miasta + SUROWCE na mapie swiata (odswiez Gra-podglad-MAPA.html).
- MIASTA na mapie: kilka osad (stoneCity) na pozycjach startowych, rozne poziomy (2..10), czesc z murami, posadzone na wysokosci terenu.
- SUROWCE (nakladki, NOWY src/render/resources.ts): MALE dekoracje heksa (mniejsze niz jednostka) -- kon, owca, krowa(bydlo), lama + glina (dzbany) + ruda (skaly). Renderowane na heksach wg enum Nakladka (ZlozeKonia/Owiec/Bydla/Lamy/Gliny/Rudy), lekko z boku heksa.
PROSBA: screenshot/ocena -- miasta + surowce w kontekscie terenu (skala, kolory, rozmieszczenie).

---
[22.06 ~22:58] MAPA — rzeki: fix ZNIKANIA + przywrocona DELTA (odswiez Gra-podglad-MAPA.html).
- ZNIKANIE: wysokosc rzeki liczona jako MAX sasiednich heksow + uniesienie 0.02 (bylo MIN -> wpadala pod wyzsze heksy). Teraz zawsze na wierzchu, nie znika. (Poprzedni "fix" nie wszedl do scene.ts -- teraz wszedl.)
- DELTA: przy przepisaniu rzek na trasowanie wierzcholkowe delta wypadla z petli -> PRZYWROCONA (wachlarz cienkich strug z ujscia do wodnych krawedzi mouth-heksa).
- Zwierzeta/surowce + miasta: Maciej zaakceptowal ("wygladaja super, rewelacja").
PROSBA: screenshot -> czy rzeka juz NIE znika i czy DELTA widoczna u ujscia do morza.

---
[22.06 ~23:06] MAPA — rzeka: KONIEC na styku z woda (koniec pelzania brzegiem).
- Bug: rzeka pelzla WZDLUZ wybrzeza (po granicy lad-woda) az do morza, bo stop byl tylko na Morze, a wybrzeze niskie.
- Fix: rzeka konczy sie na PIERWSZYM wierzcholku stykajacym sie z WODA (Morze LUB Wybrzeze) -> dotarla do wody = koniec rzeki (+ delta u ujscia). Juz nie idzie brzegiem dalej.
- Wysokosc rzeki = MAX sasiadow (nie znika) -- potwierdzone na screenie Maciej.
PROSBA: screenshot -> czy rzeka konczy sie logicznie na wybrzezu (bez pelzania).

---
[22.06 ~23:12] MAPA — delta: usuniete "oplecenie" wzdluz krawedzi wodnych.
- Przyczyna "rzeki wzdluz wybrzeza": w delcie mialem 2 elementy -- (1) wachlarz strug z nurtu do krawedzi (dobre) + (2) strugi WZDLUZ krawedzi wodnych heksa (oplecenie) -> to wygladalo jak rzeka biegnaca brzegiem.
- Fix: usuniete (2). Zostaje sam WACHLARZ delty. Glowna rzeka konczy na pierwszym styku z woda (Morze/Wybrzeze).
PROSBA: screenshot -> potwierdzenie, ze nie ma juz "rzeki wzdluz wybrzeza".

====================================================================
[22.06 ~23:16] DYSPOZYCJA DO MASTERA -> przekaz do SILNIK do WPIECIA.
Maciej ZAAKCEPTOWAL: F1 mapa + miasta + surowce. Excel Civ-MAPA #1 = Zrobione.
Zrodla ZSYNCHRONIZOWANE do projektu (gra/src). Do wpiecia:

1) MAPA (teren/biomy/rzeki-krawedziowe+delta/ocean/ramka) -- src/render/scene.ts (buildScene).
   main.ts JUZ uzywa buildScene -> SILNIK: wystarczy REBUILD kanonu (zaden dodatkowy wpiec).
2) GENERATOR -- src/map/generator.ts: pierscien wybrzeza (kazdy lad >=1 heks Wybrzeze) + maxRivers 2->5. Moj lane, gotowe.
3) MIASTA (NOWY src/render/stoneCity.ts): buildStoneAgeCity(level 1..10, ownerColor, withWalls).
   SILNIK: w CityRenderer (src/render/cities.ts) podmienic stary model na buildStoneAgeCity
   (level = poziom rozwoju miasta; withWalls = czy gracz wybudowal mury).
4) SUROWCE (NOWY src/render/resources.ts): buildResourceOverlay(nakladka) -> male nakladki
   (kon/owca/krowa/lama/glina/ruda). SILNIK: renderowac na heksach wg hex.nakladka
   (wzor gotowy w src/mappreview/main.ts -- petla po hexes + buildResourceOverlay).
Podglady referencyjne: Gra-podglad-MAPA.html (teren+rzeki+miasta+surowce), Gra-podglad-MIASTA.html (10 poziomow + mury).
Uwaga (cleanup, NIE blokuje builda esbuild): w scene.ts jest martwy buildRiverEdgePoints (niewpiety) + kilka nieuzywanych stalych RIVER_BANK_* po usunieciu brzegu.
NASTEPNE (czekam na dyspozycje w MAPA.md): per-cyw style miast na epoke BRAZU (Grecja/Sumer/Egipt/Aztek -- rozne swiatynie).
====================================================================

---
[23.06 ~06:06] MAPA — START epoki BRAZU (autonomicznie, za zgoda Maciej): Grecja + Rzym.
- NOWY src/render/bronzeCity.ts: buildBronzeCity(civ 'grecja'|'rzym', level 1..10, ownerColor, withWalls).
- Grecja: biale kubiczne domy (plaski dach) + swiatynia z kolumnami i trojkatnym frontonem (biala).
- Rzym: biale sciany + czerwone dachowki (spadziste) + swiatynia frontalna na podium, czerwony dach.
- 10 poziomow, mury niezalezne (withWalls). Podglad: Gra-podglad-MIASTA-BRAZ.html (4 rzedy: Grecja bez/z murem, Rzym bez/z murem).
- Kolejne nacje (Sumer/Egipt/Aztek) na tym samym wzorze, po akceptacji Grecji/Rzymu.
PROSBA: ocena Grecji i Rzymu (domy + swiatynia + proporcje) -> dociagne, potem reszta cyw.

---
[23.06 ~06:30] MAPA — DOKUMENTACJA deweloperska + PANEL parametrow (dla SILNIK/dev).
- DOKUMENTACJA-Civ-MAPA.md (folder Civ): pelna struktura dzialu MAPA/RENDER -- architektura+graf zaleznosci, konwencje geometrii (pointy-top/ZERO rotateY), model danych, generator (przebiegi + pierscien wybrzeza), renderer terenu (paleta/jitter/blend/nakladki/swiatlo/ocean/ramka/fog), rzeki (trasowanie wierzcholkowe + reguly + delta), miasta kamien+braz, surowce, podglady, build/deploy, parametry->JSON, INTERAKCJE z dzialami (SILNIK/DANE/UNITS/LOGIKA-AI/UI/EPOKI), zebrane REGULY, dlug techniczny/TODO.
- Parametry-Civ-MAPA.xlsx (panel): zakladki Teren/Rzeki/Biomy-swiatlo/Miasta-kamien/Miasta-braz/Surowce/Mapowanie-JSON. Kazdy parametr: wartosc(do strojenia, niebieska)+zakres+jedn.+opis+docelowy JSON. Refactor TS->data/*.json = TODO.
- Sekcja INTERAKCJE uzupelnie po zdjeciu struktury dzialow od Maciej (zwlaszcza: kto trzyma stan miasta level+mury+cyw, kto "gniazda", jak epoka steruje renderem).

---
[23.06 ~06:40] MAPA — otrzymano STRUKTURE DZIALOW (9 sesji): Civ-Master, Civ-SILNIK, Civ-MIASTO, Civ-Dane Cywilizacji, Civ-Units/Battle, Civ-EKONOMIA, Civ-Dyplomacja, Civ-UI, Civ-AI opponent intelligence. Zaktualizowano DOKUMENTACJA-Civ-MAPA.md §13.
KLUCZOWE: istnieje osobny dzial **Civ-MIASTO** -- moje buildery miast (stoneCity/bronzeCity) sie z nim pokrywaja. Proponowana GRANICA:
- Civ-MAPA = wizualne buildery miast (level/walls/civ -> THREE.Group) + teren/rzeki/surowce (render).
- Civ-MIASTO = STAN/LOGIKA miasta (poziom 1-10, mury, cywilizacja, produkcja, ludnosc) -> wola builder.
- Civ-EKONOMIA: produkcja->poziom. Civ-AI: klastry miast + gniazda (logika; model moze byc w MAPA).
PYTANIA DO MASTERA: (1) buildery miast zostaja w render/ (MAPA) czy ida do Civ-MIASTO? (2) "gniazda" -- model w MAPA, logika w AI? (3) kto wpina render miast/surowcow do kanonu -- SILNIK czy MIASTO? Czekam na decyzje; do tego czasu rozwijam buildery u siebie (Grecja/Rzym -> reszta cyw).

---
[24.06 ~07:55] MAPA — KONSOLIDACJA PLIKOW DZIALU do jednego katalogu.
Utworzono **Civ/Civ-MAPA/** i PRZENIESIONO tam wszystkie moje pliki nie-kodowe (oryginaly z top-level usuniete). Zawartosc:
- DOKUMENTACJA-Civ-MAPA.md, Parametry-Civ-MAPA.xlsx (panel), MAPA-TASKOW.md
- Gra-podglad-MAPA.html, Gra-podglad-MIASTA.html, Gra-podglad-MIASTA-BRAZ.html
- hex_A_unrotated.png, hex_B_rotated30.png
- README-Civ-MAPA.md (spis zawartosci + zakres)
**UWAGA dla mastera/innych sesji:** jesli gdzies linkujecie te pliki po samej nazwie (DYSPOZYCJE-SESJI.md, ORKIESTRACJA-ZADANIA.md, PLAYBOOK), sciezka zmienila sie na `Civ-MAPA/<plik>`.

NIE przenioslem (celowo):
- dyspozycje/MAPA.md + MAPA-DO-MASTERA.md — skrzynka/protokol, zostaje w dyspozycje/.
- gra/src/* — kod gry, zostaje.
- Spec-generator-mapy.md — to spec PROJEKTOWY (input ode mnie, ale wspoldzielony; wlasnosc master/design). Zostawiam na top-level; jak chcesz, przeniose.

ARCHIWUM: nic MOJEGO historycznego do archiwizacji nie znalazlem (moj zestaw jest aktualny). 
DO POTWIERDZENIA przez mastera (pliki w moim temacie, ale NIE moje autorstwo — nie ruszam sam):
- **Widok-miasta.html** ("Biskupin", 21.06) — stary samodzielny widok miasta, prawdopodobnie zastapiony przez Gra-podglad-MIASTA.html. Jesli to artefakt historyczny -> do archiwum (czyja decyzja: MIASTO/master).
- **renders/** (render_konnica/lucznik/miecznik...) — to rendery JEDNOSTEK (lane UNITS), nie moje.
- **Makieta-HUD-mapa-swiata.html** — makieta UI (lane UI), nie moja mimo "mapa" w nazwie.

---
[24.06 ~19:45] MAPA — MIASTA BRAZU: pozostale nacje + nazwy klastrow (research).
1) bronzeCity.ts: BYLO tylko w kopii buildu -> ZSYNCOWANE do gra/src/render (backup .bak-MAPA). Rozszerzone z 2 do 10 stylow:
   grecja, rzym (byly) + sumer (zikkurat), egipt (pylon+obeliski), inka (tarasy+zlota platforma),
   aztek (piramida schodkowa+podwojna swiatynka), chiny (uniesiona hala+szerokie okapy),
   zulu (kraal+wielka chata), celtowie (nemeton: krag kamieni+idol), germanie (longhouse+drewniany hof).
   Kazda: swiatynia-CENTRUM per cyw, 10 poziomow, mury (kamienne lub PALISADA dla zulu/celt/german).
   Podglad: Civ-MAPA/Gra-podglad-MIASTA-BRAZ.html — przyciski przelaczaja nacje; "Wszystkie" = przeglad 10 stylow.
   Zrodla zsync do gra/src (bronzeCity.ts + bronzepreview/*). Do wpiecia do kanonu: TY (master).
2) NAZWY KLASTROW (pomysl Maciej, 10 nazw/typ) — propozycja research w: dyspozycje/_handoff/MAPA-do-MASTER_nazwy-klastrow.md.
   To dane DANE (Cywilizacje.xlsx->civs.json) — NIE nadpisuje sam, przekazuje do DANE przez Ciebie.
DECYZJA POTRZEBNA: roster DANE = INKOWIE, Maciej mowi "Aztekowie". Zrobilem OBA style (inka + aztek) — wybierzcie ktory zostaje w rosterze (wplywa na nazwy i na swiatynie miasta).

---
[24.06 ~20:05] MAPA — ROZSTRZYGNIECIE Inka/Aztek (Maciej): roster = INKOWIE (kanon, zgodnie z Cywilizacje.xlsx). Styl 'aztek' ZOSTAJE w bronzeCity.ts jako gotowy ZAPAS na przyszlosc (gdyby dodawac Aztekow). Nazwy klastrow: uzyc wariantu INKOWIE z handoffu. Bez dalszych zmian.

---
[24.06 ~20:40] MAPA — POSTERUNKI: draft definicji w dyspozycje/_handoff/MAPA-do-MASTER_posterunki.md.
Spina sie ze "Straznica" (zakladanie miast) i "drogi tylko miasta+posterunki". Posterunek = wezel drog + przedluzenie zasiegu + wizja/garnizon; NIE miasto.
STATUS: PROPOZYCJA — czekam na akceptacje Macieja (decyzje projektowe: sposob zakladania, promien kontroli, czy baza do zakladania miast, poziom kosztu). NIE wpinac przed akceptacja. Po akceptacji: render+placement u mnie, koszt/efekty -> MIASTO, przeplyw tury -> master.

---
[24.06 ~20:55] MAPA — ULEPSZENIA TERENU: lista + bonusy w dyspozycje/_handoff/MAPA-do-MASTER_ulepszenia-terenu.md.
Zasada Macieja: IRYGACJA tylko na heksie sasiadujacym z RZEKA (brak lancuchow); gdzie brak rzeki -> FARMA (slabszy +Zywnosc).
Lista: Farma, Irygacja, Pastwisko, Kopalnia, Glinianka, Kamieniolom, Oboz lowiecki, Wyrab, Tarasy, Lodzie rybackie, Droga, Posterunek.
PODZIAL: MAPA = placement(ograniczenia)+render+stan heksu; MIASTO = liczby bonusow+koszt; master = przeplyw tury. STATUS: propozycja, czeka na akceptacje Macieja; potem master rozdziela liczby do MIASTO.

---
[24.06 ~21:20] MAPA — RENDER ULEPSZEN TERENU (nowy modul gra/src/render/improvements.ts).
12 ulepszen: droga, irygacja, farma, pastwisko, kopalnia, glinianka, kamieniolom, oboz lowiecki, wyrab, tarasy, lodzie rybackie, STRAZNICA (posterunek).
Podglad: Civ-MAPA/Gra-podglad-ULEPSZENIA.html — przyciski przelaczaja ulepszenie; "Wszystkie" = siatka ulepszenie x teren (7 terenow). Irygacja pokazana z pasem RZEKI obok kafla.
Zrodla zsync do gra/src (improvements.ts + improvepreview/*). Do wpiecia na mape: master (stan heksu typ+postep -> wybor modelu, jak przy miastach/surowcach).

---
[24.06 ~21:55] MAPA — RENDER ULEPSZEN zgrany ze specem MIASTO (15 pozycji).
Klucze modeli = klucze gra/data/terrain-improvements.json (silnik mapuje stan heksu -> model po kluczu).
Dolozone wg MIASTO: PLANTACJA (trejaze winorosli), WARZELNIA SOLI (baseny solne), FORT (kwadratowe umocnienie+blokhauzy). Zmiana kluczy: lodzie->lodzie_rybackie, straznica->posterunek. Dodane pole epoka (1/2/3) w legendzie podgladu.
Podglad: Civ-MAPA/Gra-podglad-ULEPSZENIA.html (siatka ulepszenie x teren + tryb pojedynczy). Zrodla zsync do gra/src/render/improvements.ts. Do wpiecia na mape: master.

---
[24.06 ~22:40] MAPA — PLACEMENT + WIDOK GLOWNY + ghost-preview gotowe (podglady w Civ-MAPA/).
WIDOK-GLOWNY: HUD 13 elementow (wg Civ7) nad zywa mapa; ikona Budowa -> tryb placement z ghost-preview (polprzezroczysty model na hover, solidny po kliku).
HANDOFF szczegoly: dyspozycje/_handoff/MAPA-do-MASTER_placement-i-widok-glowny.md.
- DLA MIASTO (przez Ciebie): kontrakt isInTerritory(q,r) -> potrzebne realne granice (teraz stub promien 3). Do integracji placement.
- DLA UX (po akceptacji Macieja): widok glowny = mockup do przejecia (lista TODO w handoffie). Zrodla: gra/src/mainview/*, placementpreview/*.
Nie wpinam do kanonu — czekam na Twoja integracje + decyzje Macieja o przekazaniu UX.

---
[25.06 ~06:10] MAPA — OBRONA + ZASIEGI (dane Macieja) -> handoff dyspozycje/_handoff/MAPA-do-MASTER_obrona-i-zasiegi.md.
Zasiegi terytorium: miasto r5 (okolica robocza), posterunek r5 (epoka Braz), fort r10 (epoka Zelazo). Budowac tylko w zasiegu; ekspansja lancuchowa; narzedzia gated epoka.
Bonusy OBRONY (dla UNITS/walka): mur miasta +200%, fort +100%, posterunek +50% — jednostkom w trybie OBOZOWANIA przy strukturze.
ROZDZIAL: liczby zasiegow/epoki -> MIASTO (terrain-improvements.json: posterunek zasieg 3->5 + epoka 1->2; fort zasieg=10). Bonusy walki -> UNITS. MAPA egzekwuje zasiegi na mapie (stub do podmiany).

---
[25.06 ~06:40] MAPA — ZASIEG MIASTA = TIERY ROZWOJU (dane Macieja, dla MIASTO).
Promien terytorium miasta rosnie z rozwojem: start r5 -> po 5 LUDNOSCI r10 -> po POZIOMIE 10 r15.
Granica cywilizacji = suma: miasta (5/10/15) + posterunki (+5) + forty (+10). Budowac tylko w tym zasiegu; granica rosnie z rozwojem.
DLA MIASTO: progi (ludnosc=5 -> r10; poziom=10 -> r15) + bazowe r5 do terrain-improvements/spec. MAPA: egzekwuje + rysuje granice (przelacznik "Zasieg cywilizacji" na mapie; stub rozwoju do podmiany realnymi danymi).

---
[25.06 ~07:00] MAPA — nowy WARIANT renderu: 'pole_irygowane' (uprawa + irygacja na jednym polu) w improvements.ts. W galerii Gra-podglad-ULEPSZENIA.html. Zrodlo zsync do gra/src.
DLA MIASTO (przez Ciebie): jesli ma byc pelnoprawne ulepszenie (bonus/koszt/tech) -> dodac klucz "pole_irygowane" do gra/data/terrain-improvements.json. Na razie to tylko model wizualny.

---
[25.06 ~07:30] MAPA — STATUS ZBIORCZY (czym sie zajmuje / decyzje / co zostalo).

CZYM SIE ZAJMUJE (dzial MAPA): render swiata (teren/rzeki/biomy/ocean/ramka), miasta (kamien 10 poz + braz 9 nacji per-cyw), surowce-nakladki, ULEPSZENIA terenu (15 + 'pole_irygowane'), placement UX (klik+podswietlenie+ghost-preview+kursor), WIDOK GLOWNY/HUD (13 el.) + tryb Budowa, ZASIEG CYWILIZACJI (granica-linia + aura), tiery zasiegu miast.

GOTOWE (zsync do gra/src; podglady w Civ-MAPA/):
- Mapa swiata F1 (zaakceptowana), miasta kamien (zaakceptowane), miasta braz 9 nacji.
- improvements.ts: 15 ulepszen + pole_irygowane; galeria + matryca xlsx.
- mainview: HUD 13 el. + tryb Budowa (placement, ghost-preview, kursor-mlotek, badge ESC, zakladki klikalne, ESC/toggle wyjscie).
- Zasieg: ciagla linia granicy + aura jasnoniebieska 0.20 (w budowie); fort+10/posterunek+5/miasto 5-10-15 (3A); ekspansja lancuchowa (granica rosnie po dostawieniu wezla).
- Podglad stylow granicy (A/B/C/D). Makieta panelu miasta (okolica r5 = 91 pol + przydzial do pracy). Dokumentacja + Excel parametrow.

DECYZJE WISZACE — OD MACIEJA (projektowe; wg routingu ida do Niego):
1. 6B: akceptacja ukladu WIDOKU GLOWNEGO/HUD (warunek wpiecia do kanonu).
2. Ocena miast BRAZU: Sumer / Egipt / Inkowie / Zulusi (reszta nacji OK).
3. Wybor docelowego STYLU GRANICY (rekom.: C=tint+linia w grze, A=mocna linia na hover/klik miasta).
4. Czy renderowac NAZWY miast na mapie (z nazwyKlastra) — jak tak, podepne.

DECYZJE/DANE WISZACE — OD INNYCH DZIALOW (przez Ciebie, masterze):
A. MIASTO: realne dane granic/zasiegu miast (ludnosc/poziom) -> kontrakt isInTerritory; koszty/bonusy ulepszen. (handoffy: placement-i-widok-glowny, obrona-i-zasiegi).
B. MIASTO: czy 'pole_irygowane' = pelne ulepszenie -> dodac klucz do terrain-improvements.json.
C. UNITS/walka: bonusy obrony (mur +200%, fort +100%, posterunek +50% dla jednostek obozujacych).
D. MASTER: wpiecie renderu miast/ulepszen/widoku do kanonu — PO akceptacji Macieja (6B).

CO ZOSTALO MI DO WYKONANIA (moje):
1. Narzedzie "Zaloz miasto" w trybie Budowa (per-cyw, start L1) — rozpisane, bylo wstrzymane na zasieg; zasieg POTWIERDZONY (5/10/15) -> MOGE robic na sygnal Macieja.
2. Wpiecie wybranego stylu granicy jako docelowego (po decyzji #3).
3. Render nazw miast (po decyzji #4).
4. Podmiana stubow (isInTerritory + rozwoj miast) realnymi danymi MIASTA (po pkt A).
5. (Opc.) przelacznik granicy zasiegu na mapie swiata poza widokiem glownym.

NIE wpinam nic do kanonu (6B). Czekam na akceptacje Macieja + dane od MIASTO/UNITS przez Ciebie.

---
[25.06 ~07:55] MAPA — ZAKLADANIE MIAST Z MAPY (UX) gotowe w trybie Budowa (mainview). Odpowiedz na DZIURE po usunieciu Osadnika (UNITS-do-MASTER_osadnik-zakladanie-z-mapy).
Narzedzie "Zaloz miasto" + wybor cywilizacji -> miasto L1 per cyw; warunki: teren ladowy, dystans >=5 od miast, w terytorium; nowe miasto rozszerza granice (r5), granica odswieza sie od razu.
KONTRAKT (do wpiecia w silnik): docelowo MIASTO.cities.canFoundCity(opts.withinTerritory = predykat isInTerritory dostarczany przez MAPA) + regula dystansu >=5 (MIASTO). Reszta = front-end mapowy gotowy.
DLA MASTERA: wpiac AKCJE zalozenia miasta w main.ts/petle tury (zamiast Osadnika). Podglad UX: Civ-MAPA/Gra-podglad-WIDOK-GLOWNY.html (tryb Budowa -> Zaloz miasto).
PRZYJALEM od UNITS: Gra-podglad-OBLEZENIE.html + gra/src/siegepreview/* = material MAPA (galeria 9 miast z murami). Trzymam jako dodatkowa galerie miast.

---
[25.06 ~08:20] MAPA — GRANICA RUCHU PO MAPIE (zgoda na propozycje UNITS). Podzial "reguly vs wykonanie":
- UNITS = wartosci+reguly jednostki: Ruch/Ruch-w-bitwie (units.json), ZoC, przeprawa/zaokretowanie, stack, ograniczenia machin/konnicy, koszt terenu z perspektywy jednostki.
- MAPA/SILNIK = wykonanie: pathfinding po heksach, zuzywanie punktow ruchu w petli tury, mgla wojny, animacja, UX ruchu na heksach (klik-by-isc + podglad sciezki).
ODRZUCAM wariant "calosc ruchu do UNITS" (map-traversal wplata sie w petle tury/mgle/render = nasz lane; unikamy konfliktow miedzylane'owych).
PROSBA KOORDYNACYJNA: BAZOWY koszt wejscia na teren = MAPA (terrain-movement.json, 99=nieprzejezdny); spec UNITS niech sie do niego ODWOLUJE, a UNITS doklada modyfikatory jednostkowe. Jedno zrodlo: koszt bazowy terenu=MAPA, reguly jednostki=UNITS.
DLA MASTERA: potwierdz granice + poprosic UNITS o spec modelu ruchu (format pkt ruchu, odczyt kosztu terenu, ZoC, przeprawa, stack, modyfikatory per klasa) -> handoff do MAPA/SILNIK. Po otrzymaniu specu implementuje traversal + UI ruchu na heksach.

---
[25.06 ~16:10] MAPA — RUCH JEDNOSTEK PO MAPIE: prototyp gotowy (Civ-MAPA/Gra-podglad-RUCH.html; zrodla gra/src/movepreview/*).
Wg spec UNITS (_handoff/UNITS-do-MASTER-MAPA_model-ruchu-mapa) + decyzje Macieja:
- jednostki na mapie przez buildUnitModel (realne modele); select + KLIK-BY-ISC z PODGLADEM SCIEZKI (Dijkstra), pkt ruchu z units.json Ruch, koszty z terrain-movement.json (99=nieprzejezdny, Las +1).
- 1C MIN.1 POLE: tak. BRAK ZoC + HOOK REAKCJI przy wrogu (stub: flee=odsuniecie wroga / fight=stub bitwy). STACKING bez limitu + licznik nad heksem. Mgla. Koniec tury = reset pkt.
- STUB: droga 0.5 i przeprawa przez rzeke (konczy ture) — TODO.
KONTRAKTY STYKU (do wpiecia przez SILNIK/rozdzielenia):
- isInTerritory(q,r,nodes) wyeksportowany: gra/src/map/territory.ts (dla zakladania miast — SILNIK).
- HOOK REAKCJI: decyzje fight/flee podejmuje CYWILIZACJE (AI) — ja wykonuje FLEE (odwrot), FIGHT -> oddaje do UNITS.
- WEJSCIE W BITWE: ruch na wroga/miasto -> oddaje do UNITS (stub). POSILKI 1 HEKS: na starcie bitwy moge podac liste jednostek w zasiegu 1 heksa od atakujacego/broniacego (gotowy do dostarczenia).
DLA SILNIKA: wpiac pathfinding/zuzycie pkt ruchu w petli tury + mgle; front-end (UX ruchu) gotowy u mnie.

---
[25.06 ~17:05] MAPA — TEST OBLĘŻENIA (Civ-MAPA/Gra-podglad-RUCH.html): miasto wroga z murem + garnizon + atakujacy obok. Atak gracza na heks miasta -> MAPA wykrywa i SKLADA KONTEKST OBLEZENIA (atakujacy/obronca/miasto/teren/struktury mur-fort-posterunek/posilki 1-heks/pozycje) + overlay "TRYB OBLEZENIA -> UNITS". Scena samej bitwy NIE renderowana (granica = UNITS).
Handoff styku + lista brakow: _handoff/MAPA-do-MASTER_oblezenie-kontekst.md (dla UNITS/SILNIK: scena oblezenia, wartosci bonusow, wynik zwrotny -> MAPA aktualizuje owner).

---
[25.06 ~17:30] MAPA — WNIOSKI + CO DALEJ (granica ruch/oblężenie; prototyp RUCH.html stabilny, boot naprawiony).

GDZIE KOŃCZY SIĘ MOJA PRACA (dowiezione, zsync do gra/src, NIE w kanonie):
- Jednostki na mapie (modele) + RUCH: klik-by-iść, ścieżka z NUMERAMI TUR (odległość w turach), pkt ruchu (units.json), koszty terenu (terrain-movement.json), min.1 pole, nieprzejezdne (99), stacking + licznik, BRAK ZoC + HOOK REAKCJI, mgła, koniec tury.
- Zakładanie miast (tryb Budowa) + terytorium/granica + EKSPORT isInTerritory (gra/src/map/territory.ts).
- Wykrycie ataku + złożenie KONTEKSTU oblężenia (struktury mur/fort/posterunek = flagi, POSIŁKI 1-heks per strona, pozycje) + overlay przejścia do UNITS.

CZEGO DALEJ POTRZEBA, BY DOMKNĄĆ PĘTLĘ (per lane):
- SILNIK: w pętli tury wpiąć pathfinding/zużycie pkt ruchu + mgłę; akcję „załóż miasto" + bramkę isInTerritory; WYWOŁANIE sceny bitwy gdy MAPA zgłosi atak + POWRÓT WYNIKU → MAPA aktualizuje stan pola (owner/usun pokonanych).
- UNITS: scena bitwy OBLĘŻNICZEJ (konsumuje mój kontekst): HP muru/bramy (siegeWall.ts), machiny, szturm/rundy/morale, ZASTOSOWANIE bonusów obrony.
- CYWILIZACJE (AI): decyzja fight/flee dla hooka reakcji (ja wykonuję FLEE=odwrót jedn. AI; FIGHT=oddaję do bitwy).
- EKONOMIA: wartości bonusów obrony (mur+200%/fort+100%/posterunek+50%) + dostępne surowce (kontrakt już wysłany).

MOJE WNIOSKI/REKOMENDACJE:
1. Granica MAPA↔UNITS jest CZYSTA i potwierdzona w teście: „do startu bitwy = MAPA, scena bitwy = UNITS". Kontekst zawiera komplet (struktury, posiłki, pozycje, teren).
2. Najwartościowszy następny krok = SILNIK wpina RUCH + ZAKŁADANIE MIAST (kontrakty gotowe: territory.ts, kontekst oblężenia, posiłki 1-heks) → da grywalny szkielet tury.
3. TODO u mnie (gdy potrzebne): droga 0.5 i przeprawa przez rzekę kończąca turę (zastubowane), oraz nanoszenie WYNIKU bitwy na mapę (po dostarczeniu sygnału zwrotnego przez SILNIK).
Handoff styku oblężenia: _handoff/MAPA-do-MASTER_oblezenie-kontekst.md.

---
[25.06 ~19:20] MAPA — ZASIEG MIASTA = POPULACJA (decyzja Macieja) wdrozone w gra/src/map/territory.ts.
cityTerritoryRadius(miasto) = cityRangeForPopulation(pop) = min(floor(pop),15); fort +10 / posterunek +5 BEZ zmian. Granica nadal LINIA. Build mainview zielony, zsync.
EKSPORTY dla SILNIK/EKONOMIA: cityRangeForPopulation(pop) + CITY_RANGE_CAP=15 (mozecie importowac do logiki okolicy/zasiegu). EKONOMIA owns formule/cap — jak zmienicie cap/formule, podmiencie w jednym miejscu (lub dajcie znac, dostosuje territory.ts).

---
[25.06 ~19:45] MAPA — ROZMIESZCZENIE KLASTROW (pkt 2 werdyktu / zaleznosc AI pkt3) DOSTARCZONE.
Modul: gra/src/map/clusters.ts -> computeClusters(map, opts) zwraca FORMAT ClusterPlacement { rozmiarMapy, aktywneTypy(3/5/7/9), minDystans(9), playerTypIndex, klastry:[{typIndex, typ(z civs.json), centrum, miasta:[{q,r,isCapital}]}] }. Czysta funkcja (bez THREE/DOM) — AI/SILNIK konsumuja.
Algorytm: Voronoi srodki typow (>=15 od siebie) + Poisson miasta w regionie (min_dist 9), stolica=najblizej srodka.
FORMAT DLA AI (pkt3 ekspansja klastrowa): _handoff/MAPA-do-MASTER_format-rozmieszczenia-klastrow.md -> przekaz do Civ-AI.
Podglad: Civ-MAPA/Gra-podglad-KLASTRY.html (regiony per typ + miasta + stolice). Zrodla zsync do gra/src.
UWAGA (do ew. decyzji EKONOMIA/Maciej): przy min_dist=9 na mapie SREDNIEJ wychodzi 5-7 miast/klaster (region maly); pelne 10 na DUZEJ/OGROMNEJ. min_dist=5 daje 8-10 nawet na sredniej. Param latwo zmienic.

---
[25.06 ~19:55] MAPA — KLASTRY: min_dist ADAPTACYJNY wg mapy (decyzja Macieja "mniejsza mapa = gęściej"): mala 4 / srednia 6 / duza 8 / ogromna 9. Cel: pełne ~10 miast/klaster na każdym rozmiarze (srednia teraz ~8-10). opts.minDystans nadal nadpisuje; ClusterPlacement.minDystans = faktycznie uzyta. Zsync gra/src/map/clusters.ts; podglad KLASTRY.html. Format dla AI bez zmian.

---
[26.06 ~07:30] MAPA — GENERATOR SWIATA: TYP (kontynenty/pangea/wyspy) + API gotowe.
- generateMap(width,height,seed, typ?='kontynenty') — addytywnie (stare wywolania bez zmian).
- NOWE: generujSwiat(seed, rozmiar, typ) -> rozmiar:'malenki'(~1000)/'maly'(~2000)/'standardowy'(~5000)/'duzy'(~10000)/'ogromny'(~20000) -> width×height. seed=0/undef -> losowy (Date.now), zwracany w map.seed.
- 3 TYPY lądu w gen-helpers.ts (kontynenty=2-4 masy, pangea=1 kontynent, wyspy=archipelag). Wybrzeze/rzeki/zloza zachowane.
- Podglad: Civ-MAPA/Gra-podglad-MAPA.html (przyciski Typ + Rozmiar, ?typ=/?rozmiar=). Zrodla zsync (generator.ts, gen-helpers.ts, mappreview/*).
HANDOFF API: _handoff/MAPA-do-MASTER_generator-swiat.md -> master podmieni tymczasowa tabele wymiarow na generujSwiat.
FOLLOW-UP (do decyzji mastera): [WYSOKI] dekoracje (las/gory/surowce) nie-instancjonowane -> przy ~20k heksow moga dlawic FPS; rekom. InstancedMesh per nakladka. [NISKI] computeStartPositions O(n^2) przy 20k.

---
[26.06 ~07:35] MAPA — KSZTALT ENCJI "WIOSKI" na heksie (dla EKONOMIA, odp. na EKONOMIA-do-MASTER_mapa-terytorium-wioski). Stan heksu = MAPA; oto kontrakt:
WioskaEntity = { q, r, typ:'wioska', owner: 'neutralna' | <civId>, populacja: number (domyslnie 1 = kazdy zamieszkiwalny heks >=1 zywnosc), przypisanaDoMiasta?: <cityId> (null jesli niezalezna/neutralna) }.
Reguly: przejecie terytorium -> owner staje sie nasz + przypisanaDoMiasta = najblizsze wlasne miasto; konwersja WIOSKA->MIASTO = zalozenie miasta na heksie (tryb Budowa "Zaloz miasto") => encja zmienia typ na 'miasto' (poziom 1) i staje sie wlasnym wezlem terytorium. MAPA trzyma owner/pozycje/przypisanie; EKONOMIA liczy plony/ludnosc z tego. Pelny render wioski (model) dorobie jak ustalimy wyglad (na razie ludnosc per heks = nakladka/wioska wizualnie do projektu).

---
[26.06 ~08:00] MAPA — DECYZJE MACIEJA: 1A + typ świata domyślny (bez blokady).
- 1A: instancjonuję dekoracje (las/góry -> InstancedMesh) dla płynności na 20k (w toku, subagent).
- TYP ŚWIATA domyślny = KONTYNENTY; ekran „Nowa gra" NIE blokuje — domyślne wstępnie zaznaczone, „Dalej" działa od razu, gracz zmienia jeśli chce.
- LISTA DOMYŚLNYCH DECYZJI (dla UI/menu): _handoff/MAPA-do-MASTER_domyslne-decyzje-nowa-gra.md (typ=Kontynenty, rozmiar=Średnia, seed=losowy, typy/min_dist=auto; cross-lane: cyw gracza/DANE, trudność/AI, tempo/EKONOMIA — domyślne do potwierdzenia przez właścicieli).

---
[26.06 ~08:10] MAPA — KOREKTA 1A: LAS i GORY w scene.ts JUZ BYLY instancjonowane (forestMesh/trunk, peakMesh/snow, hillBump/shrub, beach, dune) -> glowne ryzyko FPS na 20k juz ograniczone. Doinstancjonowano OAZY (basen+palmy). Pozostaje (NISKI priorytet): surowce (resources.ts/improvements.ts — rzadkie, rozne geometrie) i rzeki (unikalne) — nie instancjonowane, ale rzadkie/lekkie. Build zielony, wyglad bez zmian, zsync.
WNIOSEK: wpiecie generatora swiata do kanonu nie grozi juz dlawieniem na Ogromnej od strony dekoracji terenu (gesta zielen/gory zinstancjonowana). Ew. surowce do instancji dopiero gdyby ich gestosc mocno wzrosla.

---
[26.06 ~08:25] MAPA — PYTANIE + PROŚBA do MASTERA: KONFIGURACJA STARTU GRY (jedno źródło prawdy).
USTALIŁEM (śledztwo): rozmiary mapy = WŁASNOŚĆ MAPA (gra/src/map/generator.ts ROZMIAR_DIMS: malenki 38×26 / maly 54×37 / standardowy 84×60 / duzy 120×84 / ogromny 168×119 ≈ 1000/2000/5000/10000/20000 hex). CYWILIZACJE NIE definiuje rozmiarów (dostarcza tylko civs.json + tempo).
ROZBIEŻNOŚĆ: Ty (SILNIK) masz w main.ts TYMCZASOWĄ tabelę mapSizeToDims (mala 30×22 / srednia 50×36 / duza 80×55 / ogromna 100×70) — inną niż kanon MAPA, oraz 4 nazwy menu vs 5 nazw generatora. Spec-generator-mapy.md ma stare wartości (5 typów, min_dist 5) — nieaktualne.

PYTANIE: czy masz USTALENIA odnośnie startu gry (które rozmiary trafiają do menu: 4 czy 5; jakie wymiary docelowe; czy podmieniamy tymczasową tabelę na generujSwiat)?
PROŚBA: przygotuj CAŁE ZESTAWIENIE opcji startu + co DOMYŚLNE (jedno źródło prawdy), spinając właścicieli:
 1. ROZMIAR mapy (nazwy+wymiary; reconcile 4 menu vs 5 generator; podmiana mapSizeToDims -> MAPA.generujSwiat) — MAPA owns wymiary.
 2. TYP świata (Kontynenty/Pangea/Wyspy; domyślny Kontynenty) — MAPA.
 3. SEED (losowy) — MAPA.
 4. Liczba rywali/aktywnych typów (auto z rozmiaru 3/5/7/9; min_dist adaptacyjny) — MAPA (clusters.ts).
 5. Cywilizacja gracza (domyślnie?) — DANE/CYWILIZACJE.
 6. Poziom trudności AI (domyślnie?) — Civ-AI.
 7. Tempo gry (szybka/standard/długa; domyślne) — CYWILIZACJE/EKONOMIA.
 8. Epoka startu (domyślnie Kamień?) — SILNIK/EKONOMIA.
Gdy oddasz zestawienie, dostosuję po swojej stronie generujSwiat + mapowanie nazw menu->rozmiar. Do tego czasu trzymam kanon ROZMIAR_DIMS (5 rozmiarów).
