# UNITS -> MASTER : pytania i raporty
ZASADA: kazde pytanie/raport pisz DWA razy -- (1) tu na DOLE (krotko, z godzina),
ORAZ (2) to samo w CZACIE do uzytkownika (zeby wiedzial, co sie dzieje). Tresc identyczna.
Odpowiedzi/zadania od mastera czytaj w: dyspozycje/UNITS.md (sekcja "DO ZROBIENIA TERAZ").
NIE edytuj innych plikow w dyspozycje/.

## 2026-06-24 ~20:00 — UNITS: fix orientacji (front +Z) + usun ambient + prog armii 25% + falanga nie goni skirmisherow
- [x] dirYaw: model front=+Z (oczy/sash w units.ts) -> jednostki staja TWARZA do wroga (bylo bokiem).
- [x] Ambient WYLACZONY (buczalo) -- zostaja SFX (stal/swist/rout/padniecie/fanfary). YouTube-track nie do wmontowania (prawa+brak hostingu w single-file); czeka decyzja A/B/C.
- [x] ARMY_MORALE_LOSS_THRESHOLD 0.20 -> 0.25.
- [x] _phalanxStep: falanga celuje w najblizszego NIE-primaryRanged; gdy zostali sami skirmisherzy -> trzyma linie (koniec poscigu za procarzami).
- [x] Jazda/rydwany: deploy na skrzydlach FORMACJI (obok piechoty) zamiast w rogach pola -> realnie sie spotykaja.
- [i] Build 873778 B, tsc 0. cityPanel.ts odtwarzany w /tmp (mount tnie ~771/779) -- repo nietkniety.

---
(brak wpisow -- dopisuj ponizej)

---
## 2026-06-22 18:06 — UNITS: partia SKONCZONA
- [x] Pas helmow (UNITS.md #2): wlocznik (+sumeryjski, Impi), wojownik, maczuga, topor maja widoczny helm; strzelcy bez. (root cause wlocznika: helm za maly/bez kontrastu/bez grzebienia -> teraz wyrazny + grzebien/opaska)
- [x] Lucznicy: luk w dloni (za kablak) + kolczan ze strzalami na plecach; Procarz: zwisajaca proca (2 linki + kieszen na pocisk). Galeria 4-widoki zaktualizowana.
- [x] UNITS.md #1: rozroznienie na MAPIE -> UnitRenderer.sync przekazuje 3. arg unit.typeId; bitwa tez (per typeId).
- [x] Bitwa (Gra-podglad-BITWA.html): zoom (kolko/+- /pan), testowa bitwa 20 Legionista + 10 Oszczepnik + 10 Lucznik / strona (80), rowne linie, fronty 3 pola (<=5), pole 26x26, teren jako tlo/flanki, bug pilum naprawiony (2 pila->miecz; klucz "Ilosc pociskow" mial polskie znaki "Ilosc pociskow"), kwadraty+facing zachowane.
- [>] DO SILNIKA: units.ts zmienione (sync typeId + helmy + luki/kolczany) -> przebuduj KANON Gra-podglad.html.
- [?] PYTANIE: kompozycje testowej bitwy 20/10/10 wstawilem w battleScene.ts (moj lane), bo main.ts.launchTestBattle jest poza moim lane (ma 4 vs 4). Zostawic override w battleScene, czy ustawic w main.ts (wtedy po stronie wlasciciela main.ts)?

---
## 2026-06-22 20:58 — UNITS: testBattle + teren (raport) + start 3 uwag
- [x] testBattle.ts (presety: maly/duzy/rzym_grecja[DOMYSLNY]/konnica). rzym_grecja: Grecja 20 Falanga+20 Oszczepnik+20 Wlocznik, Rzym 20 Legionista+20 Oszczepnik+20 Wlocznik (120). battleScene buduje z testBattle (most). MAIN_INFANTRY_COUNT=20 strojalne. SILNIK: main.ts moze wolac buildTestArmies() 1 linia.
- [x] Gestszy teren bitwy (rzeka+doplyw, wiecej wzgorz/lasow/skal ~15-20% nie-plaskich), brody/przejscia; pole 34x28, 60/strone 3 szeregi, fronty <=5.
- [~] W TOKU (nowe uwagi Macieja): (a) przyspieszenie bitwy 2x/4x/8x + przycisk; (b) atak dystansowy x2 dla wszystkich rzucajacych (Jednostki.xlsx->units.json targeted); (c) pocisk lucznika cienszy/krotszy niz oszczep oszczepnika.
- [>] DO SILNIKA: po zmianie units.json (atak dystansowy x2) przebuduj KANON.

---
## 2026-06-22 21:24 — UNITS: 3 uwagi zrobione (przyspieszenie + ranged x2 + strzala)
- [x] (a) Przyspieszenie bitwy 1x/2x/4x/8x: przycisk "Predkosc: Nx" w pasku bitwy (obok Pomin/Wyjdz), wirtualny zegar skaluje tempo, wyniki walki identyczne. Domyslnie 1x.
- [x] (b) Atak dystansowy x2 dla 12 rzucajacych: Lucznik 5->10, Procarz 4->8, Oszczepnik 4->8, Kusznik 5->10, Legionista pilum 3->6, + warianty (Zulu/Huaracoc/Estolica/egipski lucznik+rydwan/Medzaj/sumeryjski). Jednostki.xlsx (kol. "Atak dystansowy") + units.json targeted (tylko to pole). NIE export-data.py.
- [x] (c) Pocisk lucznika cienki+krotki (strzala 0.34/r0.009) vs oszczep grubszy/dluzszy (0.60/0.028); pilum jak oszczep; proca = kamyk.
- [>] DO SILNIKA: units.json zmienione (atak dyst. x2) -> przebuduj KANON Gra-podglad.html.
- Plik testowy: Gra-podglad-BITWA.html.

---
## 2026-06-22 22:20 — UNITS: fix wzgorz (raport) + start 3 uwag
- [x] Bitwa: jednostka na wzgorzu stoi na SZCZYCIE (tileTopY=HILL_SUMMIT_Y, w sync z dekoracja kopca); Y animowane przy wejsciu/zejsciu; paski/etykiety podazaja. battleScene.ts only.
- [~] W TOKU (uwagi Macieja): (a) paski nad jednostka: morale (zielony->czerwony, gora) + amunicja (niebieski, maleje) + HP; (b) morale realnie uzywane -> routowanie ponizej progu (zamiast walki do 0 HP); (c) fix predkosci + 1/2/4/8/16 + widoczny wskaznik na ekranie.
- [i] Heads-up dla SILNIKA (nie moj lane): cityPanel.ts nie kompiluje sie z economy.ts (CityYieldContext wymaga maBiblioteka, brak w cityPanel ~l.249) -> dodac maBiblioteka:false. Buildy bitwy robie w /tmp z tym patchem.

---
## 2026-06-22 22:48 — UNITS: paski + morale-rout + fix predkosci
- [x] Paski nad jednostka: morale (zielony->czerwony, gora) + amunicja (niebieski, tylko strzelcy, maleje) + HP. Podazaja za jednostka (tez na wzgorzu), billboard do kamery.
- [x] Morale uzywane: spada od obrazen + smierci sasiadow; <25% startu -> ROUT (ucieka, liczony jako OUT). Bitwy koncza sie zlamaniem morale, nie do 0 HP. "Walczy do smierci"/niezlomne nie routuja. combat.ts nietkniety.
- [x] Predkosc NAPRAWIONA (root cause: rAF-polling = 1 krok/klatke; teraz wirtualna kolejka timerow drenowana co klatke). Faktory 1/2/4/8/16x, domyslnie 1x. Wskaznik "Predkosc: Nx" lewy-gorny + przycisk cyklujacy. Sterowanie = PRZYCISK na ekranie (nie litera). Wyniki walki identyczne.
- [i] Zalozony scheduled task civ-units-self-check (co 10 min): czyta UNITS.md, wdraza nowe dyspozycje autonomicznie, raportuje tu + czat.
- Plik: Gra-podglad-BITWA.html (771 KB).
---
## 2026-06-22 23:54 — UNITS: rout-do-krawedzi + S-key + paski 40%/cienkie + ranged x1.5 (ZBUDOWANE)
- [x] Rout: jednostka ucieka do SWOJEJ krawedzi (atak->lewa, obrona->prawa), znika za krawedzia (nie gasnie w miejscu); hook routedUnits pod przyszle rally generala.
- [x] Predkosc = klawisz S (cykl 1/2/4/8/16 + indykator/flash); przycisk pomocniczo.
- [x] Paski: 40% dlugosci + 1/3 grubosci (2/3 cienszE), toggle klawiszem H.
- [x] Ranged x1.5 (na obecne, 12 jedn.): Lucznik 10->15, Procarz 8->12, Oszczepnik 8->12, Kusznik 10->15, Legionista pilum 6->9, + warianty. units.json targeted + Jednostki.xlsx; NIE export-data.py.
- [x] BUILD ODPORNY (/tmp z autorytatywnych Read, bo mount tnie wiele plikow) -> Gra-podglad-BITWA.html 792 KB OK.
- [>] DO SILNIKA: units.json zmienione (ranged x1.5) -> przebuduj KANON. Uwaga: build z mountu pada (wiele plikow ucietych) -> rob /tmp z Read.
- [~] W TOKU (nowe uwagi): ammo-bar tez dla pilum (legionista, znika po 2 rzutach); paski blizej WLASNEJ glowy; AI dystansowych = kiting (max dystans, strzelaj ASAP, nie pchac sie w zwarcie, nie lazic po gorach); AI wrecz = naprzod, nie bokami.
---
## 2026-06-23 00:06 — UNITS: self-check godzinowy — brak nowych zadan
- [i] Jedyny nowy wpis w UNITS.md od ostatniego znacznika: nota MASTER 2026-06-23T00:03Z (self-check z co 10 min -> CO GODZINE, "nic nie musisz robic"). Przyjete do wiadomosci; zero zmian w kodzie/buildzie.
- [i] Punkty 1-2 z "DO ZROBIENIA TERAZ" juz zrobione (typeId na mapie + pas helmow, raport 2026-06-22 18:06) — nie powtarzam.
---
## 2026-06-23 06:02 — UNITS: PYTANIA (AI bitwy)
Propozycja AI: targeting=najblizszy; wrecz=naprzod do najblizszego, atak gdy sasiad; dystansowe=strzelaj ASAP + kituj (cofaj sie by trzymac MAX zasieg, nie wchodz w zwarcie, stoj za linia wrecz); rout <25% morale do wlasnej krawedzi. Do ustalenia:
1. Dystansowe bez amunicji: A) cofaja sie za linie, wrecz tylko gdy osaczone [zalecane]; B) od razu wrecz jako slabe; C) wycofanie do krawedzi.
2. Teren: A) minimalnie, priorytet szybkie zwarcie [zalecane]; B) obronca trzyma wzgorza/las dla bonusu.
3. Cel: A) najblizszy wrog [zalecane]; B) sprytny: dobijaj rannych / counter.
Czekam na odpowiedz (np. "1A 2A 3A") -> implementacja battleScene.ts + rebuild BITWA.

---
## 2026-06-24 06:43 — UNITS: AI 1A/2A/3A + obwodki + log + flanki + speed32 (ZBUDOWANE)
- [x] AI bitwy (decyzja Macieja 1A/2A/3A): targeting=najblizszy; wrecz=najkrotsza droga naprzod (bez bokow); dystansowe=strzelaj ASAP + kiting (MAX zasieg, cofaj sie gdy wrog za blisko, nie wchodz w zwarcie); BEZ AMUNICJI -> cofaja sie za linie (nowy _fallBackStep), wrecz tylko gdy osaczone; Legionista po 2 pila idzie do miecza; teren minimalnie.
- [x] Obwodka paskow wg strony: atak=czerwony, obrona=niebieski (sideColor, rozszerzalne pod sojusze).
- [x] Log 10 ostatnich starc (panel prawy-gora): "atk (strona)->def (strona): -X HP" +(padl)/(rout); hook w _singleBlow (combat.ts nietkniety).
- [x] testBattle rzym_grecja: lucznicy (nie wlocznicy) + 2 Konnica + 2 Rydwan na FLANKACH/strone -> 64/strone, 128 razem (arrangeFlankCavalry).
- [x] Predkosc 32 (SPEED_STEPS 1/2/4/8/16/32, klawisz S).
- [x] BUILD Gra-podglad-BITWA.html 805 KB OK (/tmp z Read; smoke OK). Brak zmian danych -> kanon bez rebuildu z tego tytulu.
- [i] Dokumentacja: Dokumentacja-UNITS-BITWA.md (318 lin.) + Bitwa-parametry.xlsx (85 param). §6 = realne dzialy + GRANICA AI (taktyczna=UNITS, strategiczna="AI opponent intelligence") DO UZGODNIENIA.
---
## 2026-06-24 06:55 — UNITS: ranged AI dopiet + PYTANIE o sklad testu
- [x] AI dystansowych: >=2 pola od wrogich jednostek WRECZ (kite gdy blizej), po amunicji wycofanie na WLASNA krawedz (tyly), moga ostrzeliwac wrogich strzelcow, wrecz tylko gdy osaczone. Legionista pila->miecz bez zmian. Build Gra-podglad-BITWA.html 806 KB OK.
- [?] PYTANIE (sklad testu rzym_grecja rozjechal sie miedzy wiadomosciami: wlocznik/lucznik/oszczepnik). Obecnie /strona = 20 main + 20 Oszczepnik + 20 Lucznik + 2 Konnica + 2 Rydwan (flanki) = 64/strone. To juz: oszczepnicy SA (zero wlocznikow), 2 rydwany + 2 konnice/strone. Drugi oddzial ranged: A) zostaje Oszczepnik+Lucznik [zalecane]; B) tylko Oszczepnik (40, bez lucznikow); C) inny uklad. Jazda/rydwany 2+2/strone czy wiecej?

---
## 2026-06-24 08:05 — UNITS: partia bitwy + REORGANIZACJA PLIKOW (Civ-UNITS/)
- [x] Partia bitwy zbudowana (Gra-podglad-BITWA.html ~812 KB): falanga-advance, ranged-engage, atak-za-atak + szarza, morale armii <50% = przegrana strony + paski L/R, ranged ÷1.5, 40 recznych/strone.
- [x] REORGANIZACJA: nowy folder **Civ-UNITS/** (+ _archiwum/) zbiera nie-growe pliki UNITS z ~50 plikow roota.
  - Przeniesione (mv, oryginaly w roocie znikly): Dokumentacja-UNITS-BITWA.md, Bitwa-parametry.xlsx, Macierz-walki-analiza.md, Galeria-jednostek-4widoki.html, Makieta-pasek-armii.html, Makieta-przed-bitwa.html, renders/, Referencje-jednostek/.
  - ZOSTALO w roocie (pipeline-coupled): **Jednostki.xlsx** (export-data.py->units.json, +gen-dashboard/gen-panel), **Macierz-walki.xlsx** (gen-dashboard/gen-panel) — do ewentualnej relokacji przez mastera (wymaga aktualizacji sciezek). ZOSTAL tez grywalny **Gra-podglad-BITWA.html** (otwierany w roocie, cel buildow).
  - _archiwum/ puste — historyczne makiety (Podglad-armii/roblox/Porownanie A-B) juz wczesniej w root/_archiwum/, nie ruszane.
  - Wszystkie mv sie powiodly -> NIE bylo potrzeby skryptu PowerShell.
  - Manifest: Civ-UNITS/README-UNITS.md.
- [i] Nietkniete: gra/, data/JSON, inne lane, Gra-podglad-BITWA.html.

---
## 2026-06-24 12:32 — UNITS: Jednostki.xlsx PRZEBUDOWANY (grupowanie wg epok + tagi Epoka/Typ/Nacja)
- [x] Przebudowa Jednostki.xlsx: wiersze POGRUPOWANE WG EPOK (Kamień -> Brąz -> Żelazo); w każdej epoce najpierw STANDARDOWE, potem SPECJALNE (per-nacja). Każda jednostka tylko w swojej epoce. 47 jednostek.
- [x] Nowe kolumny dopisane NA KOŃCU schematu (nie psują pipeline): **Typ** (standardowa/specjalna) + **Nacja** (per-nacja, puste dla standardowych). Kolumna Epoka już była — teraz porządkuje grupowanie. Wszystkie 29 oryginalnych kolumn statystyk nietknięte.
- [x] SUPER-JEDNOSTKI -> ŻELAZO (statystyki bez zmian): Hieros Lochos, Evocati, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Królewska Sumeru. (Kusznik został też w Żelazie.)
- [x] DODANE NOWE jednostki specjalne (research historyczny, oznaczone 'NOWA' w Uwagach; statystyki spójne z istniejącymi jednostkami tej samej roli/epoki):
  - BRĄZ: Wojownik mykeński + Rydwan mykeński (Grecja); Wojownik Sherden/Ludy Morza (region Rzymu — brak Rzymu w epoce brązu); Halabardnik Shang (ge) + Rydwan Shang (Chiny); Łucznik akadyjski / łuk kompozytowy (Sumer).
  - ŻELAZO (poprawnie oznaczone, bo Celtowie/Germanie = epoka żelaza, nie brąz): Wojownik celtycki (długi miecz), Gaesatae (nadzy wojownicy), Rydwan celtycki (Celtowie); Wojownik germański (framea), Berserker germański (Germanie).
- [i] CAVEAT: sub-saharyjska epoka brązu dla Zulusów jest anachronizmem — zostawiono istniejące Izijula/Impi/uThulwana bez dodawania nowych „brązowych" jednostek zuluskich.
- [x] PIPELINE BEZPIECZNY: arkusz 'Jednostki' pozostał maszynowo-czytelny (1 wiersz notatki, 1 nagłówek, czysty blok danych — BEZ wierszy-sekcji, bo export-data.py pomija 'section-label'). Dry-run logiki export-data.py: units.json=47 rek., counters=5, terrain=7, brak braków Epoki, brak fallbacku col_. Export NIE pęknie.
- [x] Pretty widok epokowy w OSOBNYM arkuszu 'Przeglad-epoki' (nie czytany przez export) + arkusz 'Legenda' opisujący nowy układ i kolumny Epoka/Typ/Nacja. Countery/Teren bez zmian.
- [x] Backup: _backup/Jednostki.xlsx.bak-epoki. Plik został w roocie (czytany przez export-data.py).
- [i] NIE ruszane: gra/, units.json i inne JSON-y, inne lane, kod gry. export-data.py NIE uruchamiany na żywym drzewie.
- [>] DO ZROBIENIA (przyszłość): NOWE jednostki wymagają modeli renderu (units.ts) + podpięcia w grze, zanim pojawią się w rozgrywce.
---
## 2026-06-24 12:46 — UNITS: fix dystansowych + predkosc 64 + morale armii 20% (ZBUDOWANE)
- [x] Dystansowi NAPRAWIENI (wciaz bladzili): root cause = approach BFS celowal w PIERSCIEN pol w zasiegu wokol wroga -> wybieral bok. Teraz ida prosto na linie wroga (nowy _firstStepTowardMelee, cel = pole przy najblizszym wrogu) i strzelaja. Priorytet: (1) wrog wrecz <=2 -> kite; (2) cel w zasiegu + amunicja -> STRZELAJ-STOJ; (3) inaczej -> marsz na wroga az w zasieg; (4) bez amunicji -> cofnij 3.
- [x] Predkosc 64 (SPEED_STEPS 1/2/4/8/16/32/64, klawisz S).
- [x] Morale ARMII: prog przegranej 50% -> 20% (ARMY_MORALE_LOSS_THRESHOLD=0.20; per-unit rout 0.25 bez zmian; komunikat "<20%").
- [x] BUILD Gra-podglad-BITWA.html 813 KB OK (/tmp z Read). Bez zmian danych -> kanon bez rebuildu z tego tytulu.
LAST-PROCESSED: 2026-06-24 12:46 — fix dystansowych + speed64 + morale armii 20% (BITWA 813KB)

---
## 2026-06-24 13:07 — UNITS: MODELE dla 11 NOWYCH jednostek + units.json + galeria (ZBUDOWANE)
- [x] DODANE 11 rekordow do data/units.json (36 -> 47): Brąz — Wojownik mykeński, Rydwan mykeński, Wojownik Sherden (Ludy Morza, Kultura=null), Halabardnik Shang, Rydwan Shang, Łucznik akadyjski (Kultura=Sumerowie); Żelazo — Wojownik celtycki, Gaesatae, Rydwan celtycki (Celtowie), Wojownik germański, Berserker germański (Germanie). Schemat 1:1 z istniejacymi; oznaczone 'NOWA' w Uwagach.
- [x] MODELE proceduralne w units.ts: dyspozytor PO NAZWIE (buildNamedUnit, NIE po epoce) w buildUnitModel — jednostka zachowa model nawet po przeniesieniu miedzy epokami w Excelu. 11 buildersow + helpery (torc, owalna tarcza celtycka, dlugi miecz, framea/wlocznia, was/dlugie wlosy, helm z klow dzika, rogaty helm Sherden, ge Shang, kompozytowy luk akadyjski, skora-wilka berserk). Rydwany (celtycki/mykenski/Shang) = baza 'rydwan' + decorateChariot (akcent kulturowy). Wszystkie geo per-token rejestrowane do disposal.
- [x] WERYFIKACJA (build /tmp z autorytatywnych Read, bo mount tnie pliki): tsc — 0 bledow w units.ts (6 bledow PRE-EXISTING w converters.ts/upkeep.ts, inny lane, NIE moje); logic-test 163/163 OK; gra vite build OK (826KB); galeria build OK -> Civ-UNITS/Galeria-jednostek-4widoki.html 643867 B (file://-ready, 0×type=module/crossorigin, DOMContentLoaded). Smoke jsdom: 47 blokow, brak wyjatkow. Test modeli (esbuild+node): kazda nowa jednostka buduje 23-49 mesh, dispatch epoko-niezalezny potwierdzony.
- [?] OGRANICZENIE DANYCH: mount serwuje USZKODZONA/uciety kopie Jednostki.xlsx (24306 B, brak EOCD — nie da sie odczytac przez bash/openpyxl; Read nie czyta binarki). Wzialem epoke/typ/nacje z noty 12:32 (UNITS-DO-MASTERA) + handoffu DANE, a STATY sklonowalem z najblizszej istniejacej jednostki tej samej roli/epoki (zgodnie z zalozeniem "spojne z istniejacymi"). PROSBA: jesli xlsx ma INNE konkretne staty dla tych 11 — przeslij wartosci (lub odswiez OneDrive), zaktualizuje units.json punktowo. Modele sa OK niezaleznie (dispatch po nazwie).
- [>] DO SILNIKA: data/units.json zmienione (+11 rek.) ORAZ units.ts (nowe modele) -> przebuduj KANON Gra-podglad.html. Backupy: _backup/units.json.bak-newunits (36 rek.), _backup/units.ts.bak-newunits.

---
## 2026-06-24 13:33 — UNITS: 4 zmiany bitwy W KODZIE (build ZABLOKOWANY — przeciazenie serwera)
- [~] Zaaplikowane do src/battle/battleScene.ts (tsc 0, sim OK), ALE Gra-podglad-BITWA.html NIE przebudowany (wciaz 813KB z 12:46). Powod buildu: (1) mount tnie units.ts/units.json; (2) build-agenci padaja na 529 Overloaded (serwer). Ponowie gdy serwer wroci.
- [x] (A) Dystansowi PROSTO do przodu po osi natarcia (min. lateral), stop+strzal w zasiegu; melee<=2 -> krok w tyl. Zastapiono BFS-do-wroga (_rangedForwardStep/_bestForwardStep/_advanceDir/_rangedBackStep). Sim: dryf boczny 0, dystans malejacy monotonicznie.
- [x] (B) Paski dol->gora: HP, MORALE, AMUNICJA (gora). Pusta amunicja = czarny pusty prostokat (ammoBarBg 0x000000 widoczny, fill ukryty) — koniec mylacego czerwonego/niebieskiego. Tylko dla strzelajacych.
- [x] (C) SPEED_STEPS = 1/2/4/8/16/32/64/128 (S cykluje, wskaznik pokazuje).
- [x] (D) Koniec bitwy: pauza + panel zwyciezca + staty per strona (straty=polegli+rout, pozostali zywi, HP) + przycisk "Zakoncz bitwe" (wyjscie). _checkEnd nie auto-konczy; _showEndScreen/_sideEndStats.
- [i] Tylko battleScene.ts ruszany. Dane bez zmian -> bez noty do SILNIKA.
LAST-PROCESSED: 2026-06-24 13:33 — 4 zmiany bitwy w kodzie; BUILD do ponowienia (529)

---
## 2026-06-24 14:30 — UNITS: pole +50 + konnica na krawedzi + BUILD WRESZCIE ZBUDOWANY (sam, bez agenta)
- [x] BF_ROWS 28 -> 78 (wysokosc +50, by wszystkie jednostki sie miescily; BF_COLS=34 bez zmian).
- [x] Rozmieszczenie: piechota centrowana w szeregach; KONNICA/RYDWANY na skrajnych wierszach pola (gora 0,1.. / dol 77,76..) na froncie. Przebudowa funkcji place() (footIdx/mountIdx + idealRow/idealCol). Kolizje: skan po wlasnej kolumnie potem cofanie w glab.
- [x] BUILD wykonany RECZNIE w sandbox (subagenci padali na 529 ~15+ min): doklejenie autorytatywnego ogona battleScene (mount tnie na 4401/4836) do glowy z mount + reuzycie dzialajacego /tmp drzewa task52 (units.ts+units.json niezmienione) -> npx vite build -> dist 835174 B. tsc battleScene = 0 bledow (po fix idealRow[idx]!/idealCol[idx]!; noUncheckedIndexedAccess). Zawiera "Zakoncz bitwe" + speed [..,128], czysty singlefile (0x type=module).
- [x] WDROZONE: Gra-podglad-BITWA.html 835 KB. Zrodlo battleScene.ts poprawione (te same dwa `!`) -> type-clean pod przyszly kanon.
- [i] RAZEM z tym buildem weszly tez 4 zmiany z 13:33 (dystansowi prosto naprzod, paski HP/MORALE/AMUNICJA + pusta amunicja czarna, speed128, ekran konca + "Zakoncz bitwe"). Wszystko w jednym pliku BITWA.
- [i] Dane bez zmian -> bez noty do SILNIKA. (units.ts: build uzyl rekonstrukcji task52 z /tmp; OneDrive units.ts=4603 niezmienione.)
LAST-PROCESSED: 2026-06-24 14:30 — pole+50 + konnica na krawedzi + BITWA 835KB ZBUDOWANA

---
## 2026-06-24 14:45 — UNITS: ekran konca -> przycisk "Szczegoly" (listy jednostek per strona)
- [x] _showEndScreen: dodany przycisk "Szczegoly" (obok "Zakoncz bitwe"). Otwiera panel modalny _showEndDetails: 2 kolumny (LEWO=Atakujacy, PRAWO=Obronca), w kazdej 3 sekcje: Zniszczone / Zrootowane / Ocalale — jednostki po NAZWIE z licznikiem (xN) + suma na naglowku sekcji. Przycisk "Zamknij" wraca do podsumowania.
- [x] Helper _sideUnitFates(side): grupuje roster po u.bu.nazwa do 3 map (dead / routed&!dead / alive), sortuje malejaco po liczbie.
- [x] Edytowane ZRODLO OneDrive (battleScene.ts) + zbudowane recznie (te same wstawki python w /tmp/gra, agenci wciaz 529). tsc battleScene 0 bledow. Build dist 837824 B, zawiera Szczegoly/Zniszczone/Zrootowane/Ocalale.
- [x] WDROZONE: Gra-podglad-BITWA.html 838 KB. Dane bez zmian -> bez noty do SILNIKA.
LAST-PROCESSED: 2026-06-24 14:45 — ekran konca + przycisk Szczegoly (BITWA 838KB)

---
## 2026-06-24 15:05 — UNITS: pauza P + etykiety 2s realne + PROG UCIECZKI per-jednostka
- [x] PAUZA klawisz P (+ przycisk "Pauza (P)" + badge "|| PAUZA"): zamraza wirtualny zegar (_advanceVClock return gdy paused) -> ruchy/ataki/pociski stoja; kamera/zoom dziala.
- [x] Etykiety strat HP teraz na ZEGARZE REALNYM (wall) ~2 s niezaleznie od predkosci gry (byly 900ms wirtualne -> przy x64 znikaly w ~14ms). _tickFloatLabels(t wall), startTime=vLastWall, duration=2000, wolniejszy rise.
- [x] NOWY PARAM per-jednostka 'Próg ucieczki (% morale)' w data/units.json (47 szt.). _checkRout uzywa ru.routThreshold (zamiast globalnego). Domyslny prog PODNIESIONY 25%->35% (czesciej rotuja). Heurystyka wartosci: super/"walczy do smierci"/niezlomny=15; Legion/Falanga/hoplici/halabard/sarissa=22; lucznicy/procarze/oszczepnicy/lekkie/milicja/zwiad/Gaesatae/akadyjski=45; konnica/jazda/rydwany/berserk=38; reszta=33. Strojalne per jednostka.
- [x] Build 840572 B, zsync zrodel do OneDrive (battleScene.ts + units.json). tsc battleScene 0.
- [>] DO SILNIKA: data/units.json zmienione (nowe pole 'Próg ucieczki (% morale)') -> przebuduj KANON.
- [?] DO ZROBIENIA (xlsx): dodac kolumne 'Próg ucieczki (% morale)' do Jednostki.xlsx (zestawienie) — mount serwuje xlsx USZKODZONY, wiec dodam przy najblizszej przebudowie pliku / gdy bedzie czytelny. Wartosci sa juz w units.json.
- [i] Trupy zabitych zostajace na polu: ODLOZONE (brak renderu trupow) — zgodnie z decyzja Macieja.
LAST-PROCESSED: 2026-06-24 15:05 — pauza P + etykiety 2s + prog ucieczki per-jednostka (BITWA 840KB)

---
## 2026-06-24 15:40 — UNITS: MODEL MORALE wg ustalen Macieja (bazowe + ucieczki) + koniec duplikatu progu
- [x] Dwa pola per jednostka (units.json): 'Morale bazowe' i 'Morale ucieczki' (absolutny poziom). Stara '% morale' usunieta.
- [x] Mechanika: morale start = Morale bazowe; strata = (utracone HP/max HP)*100 — liczona od STALEJ 100, nie od bazy (10% HP => -10 morale u kazdego). Rout gdy morale <= Morale ucieczki. Nizsza baza => ten sam spadek bliżej progu => ucieka wczesniej. MORALE_HIT_LOSS_SCALE 60->100. moraleBaseFor/fleeMoraleFor; _checkRout uproszczony; isNeverRout odpiety od HP-progu (teraz Uwagi/blank).
- [x] Wartosci startowe (do strojenia): super 120/25, heavy(Legion/Falanga/Halabardnik) 110/25, berserk 120/10, mount 100/40, standard 100/35, light/dyst 85/45, naval 90/40, niebojowe(Osadnik/Robotnik/Zwiadowca) 60/50.
- [x] Build 849989 B, zrodla zsync (battleScene.ts + units.json). tsc battleScene 0.
- [>] DO SILNIKA: HP-owy 'Próg dezercji (% health)' to RESZTKA starej bitwy; morale/rout ma byc TYLKO na mapie bitwy. Na mapie swiata (combat.ts/siege/main.ts) rout-on-HP do USUNIECIA — nie moj lane. Pole zostawione w danych, by nie psuc kanonu.
- [i] CZEKA na decyzje Macieja (duza restrukturyzacja, osobny build): 1) zakres ang. nazw, 2) bonusy vs typ (tabela), 3) typy Swordsman/Spearman/Falangite/Offensive/Distance/Mount + niebojowe. Excel odblokowany — odbuduje przy tej restrukturyzacji.
LAST-PROCESSED: 2026-06-24 15:40 — model morale bazowe+ucieczki (BITWA 850KB)

---
## 2026-06-24 15:55 — UNITS: korekty morale (mount=20, fix diakrytyki łucznika)
- [x] Konnica/rydwany: Morale ucieczki 40 -> 20 (ucieka ~przy 20% HP) wg Macieja.
- [x] FIX: nazwy z 'ł' (Łucznik) nie lapaly sie na 'luczn' -> wpadaly do standard. Klasyfikacja teraz po NORMALIZACJI (bez diakrytyk). Dystansowe (85/45): Łucznik+egipski/sumeryjski/akadyjski, Procarz+Huaracoc, Oszczepnik+Zulu/Estolica, Kusznik, Gaesatae. Dodany tez 'kuszn'.
- [x] Build 849985 B, units.json zsync. tsc 0.
LAST-PROCESSED: 2026-06-24 15:55 — mount=20 + fix łucznik->dystansowa (BITWA 850KB)

---
## 2026-06-24 17:00 — UNITS: RESTRUKTURYZACJA modelu danych jednostek + bonusy vs typ + bitwa po angielsku
- [x] DANE (data/units.json, 47 jednostek): dodano pola do KAZDEGO rekordu, ZACHOWUJAC "Jednostka" (PL) jako klucz dopasowania dla innych lane.
  - "Nazwa EN" — kanoniczna nazwa ang. (pelne mapowanie PL->EN wg ustalen; 0 brakow, wszystkie 47 zmapowane).
  - "Typ" (klasa bojowa): Civilian 3, Swordsman 19, Distance 10, Mount 9, Spearman 3, Offensive 2, Falangite 1.
  - "Klasa": Standardowa 14, Specjalna 26, Super 7.
  - "Nacja": (generic) 13, Grecja 4, Chiny 5, Inkowie 5, Sumer 5, Egipt 4, Zulu 3, Celtowie 3, Rzym 2, Germanie 2, Ludy Morza 1.
  - 6 kolumn "Bonus vs <Typ> %" (calkowite %). Ziarna domyslne: Spearman/Falangite +50% vs Mount; Mount +50% vs Distance, +25% vs Offensive; Offensive +25% vs Swordsman; Swordsman +15% vs Spearman; reszta 0 (do strojenia).
  - Zachowane: Morale bazowe/ucieczki, Próg dezercji (% health) — kanon mapy nadal czyta.
- [x] KOD (moj lane):
  - testBattle.ts: displayName = "Nazwa EN" || "Jednostka"; findUnitRow dopasowuje po PL LUB EN (tolerancja diakrytyk). Model-kategoria liczona z nazwy PL (stabilny klucz modelu).
  - battleScene.ts: dispatch modelu uzywa stats["Jednostka"] (PL) — modele NIE regresuja do fallbacku; wyswietla EN. Dodano attackerBonusVsType(): po resolveCombat mnozy zadane obrazenia przez (1 + bonus vs Typ obroncy/100), clamp [-90%, +200%], w sciezce _singleBlow (melee + ranged + label HP). To ZASTEPUJE poleganie na counters.json w bitwie testowej (counters.json NIETKNIETY).
  - units.ts buildNamedUnit + units/setup.ts categoryOf + testBattle categoryFor: dodano aliasy ANG. (celtic/germanic/mycenaean/sherden/shang/akkadian warrior+chariot; phalanx, crossbow, mace) obok PL — model rozwiazuje sie tak samo z EN i PL.
- [x] Jednostki.xlsx (root repo): odbudowany od finalnego units.json (openpyxl). Kol A=Nazwa EN, potem Nazwa PL, Typ, Klasa, Nacja, dalej staty + 6 Bonus vs + epoka/koszty/Uwagi/Rola/Super. Row1=nota, Row2=naglowki, Row3+ dane (47). Arkusz "Legenda" opisuje Typ/Klasa/Nacja/bonusy/morale. Stary plik backup: Jednostki.xlsx.bak-units-lane. Sheety: Jednostki, Legenda.
- [x] BUILD: tsc 0 bledow w MOICH plikach (battleScene/units/setup/testBattle). vite build OK -> 861255 B, konczy </html>, brak type=module/crossorigin, embeduje nowe units.json (Nazwa EN, Bonus vs *, Legionary/Phalanx/Archer obecne). Deploy: Gra-podglad-BITWA.html. Zrodla zsync do repo (units.json, battleScene.ts, testBattle.ts, units.ts, setup.ts).
- [i] Pre-existujace bledy tsc w converters.ts/upkeep.ts/main.ts (CultureAccrualResult.after) — NIE moj lane, nie ruszane, nie blokuja vite.
- [>] DO MASTERA (poza zakresem): GLOBALNA zamiana glownego klucza na angielski (menu/tech/cywilizacje/main.ts) NIE wykonana — celowo. "Jednostka" (PL) zostaje kluczem dopasowania zeby caly build nie czernial. Gdy zdecydujesz o globalnej zmianie klucza, to osobny lane (main.ts + game/*).
LAST-PROCESSED: 2026-06-24 17:00 — restrukturyzacja modelu jednostek + bonus vs typ + bitwa EN (BITWA 861KB, xlsx odbudowany)

---
## 2026-06-24 17:20 — UNITS: epoki=zakladki + kolumna "Zmiana na" + REGULA awansu dla Mastera
- [x] Jednostki.xlsx przebudowany: zakladka PER EPOKA (Epoka Kamień / Brąz / Żelazo) = co dostepne do BUDOWY w epoce; w kazdej grupowanie: najpierw STANDARDOWE, potem kazda NACJA osobno (Specjalne+Super). + zakladka "Wszystkie (47)" + "Legenda + reguła". Stary plik backup: Jednostki.xlsx.bak-epoki-tabs.
- [x] units.json: dodane pola "Zmiana na" (lancuch awansu; propozycje: Wojownik->Wojownik z mieczem; Wojownik z maczugą->Wojownik z toporem; Łucznik->Kusznik; Rydwan (woły)->Rydwan konny; reszta "—" do uzupelnienia) oraz "Dostępna w epokach" (domyslnie CARRY-FORWARD: od swojej epoki w gore -> w Żelazie widac brazowe i kamienne; do przyciecia).
- [>] REGULA DLA MASTERA (awans/dostepnosc — do wpiecia w mechanike, NIE moj lane): 
  1) roster budowy w epoce E = jednostki ktorych "Dostępna w epokach" zawiera E (+ filtr nacja gracza + Tech).
  2) gdy pojawia sie nastepca ("Zmiana na") lub jednostka znika z dostepnosci -> PRZESTARZALA (nie mozna BUDOWAC, istniejace dzialaja).
  3) AWANS: gracz ulepsza istniejaca jednostke do "Zmiana na" za koszt (Praca/surowiec); opcjonalnie przelacznik auto-przy-epoce; domyslnie recznie.
  4) Super (1/nacje) zwykle sie nie dezaktualizuja; "Zmiana na"="—".
  5) Nacja ma pierwszenstwo: awans w nacyjny wariant tego samego Typu jesli istnieje, inaczej w generyczny.
- [i] Bez zmiany kodu bitwy -> BITWA 861KB bez przebudowy (dane nie wplywaja na walke). Reguła+legenda tez w zakladce "Legenda + reguła" w xlsx.
LAST-PROCESSED: 2026-06-24 17:20 — epoki=zakladki + Zmiana na + regula awansu (xlsx)

---
## 2026-06-24 17:40 — UNITS: okno 2 epok + niebojowe osobno + analiza luk + Zmiana na (konkret/typ)
- [x] DOSTEPNOSC = OKNO 2 EPOK: w epoce E dostepne jednostki E + E-1 (Żelazo=Żelazo+Brąz, juz nie Kamień). units.json "Dostępna w epokach" przeliczone. Niebojowe (Civilian) = WYJATEK, dostepne zawsze.
- [x] Jednostki.xlsx: zakladki epok = TYLKO WOJSKO (grupy Standardowe + per Nacja); NIEBOJOWE na osobnej zakladce "Jednostki niebojowe". + Wszystkie(47) + Legenda+reguła. Backup: Jednostki.xlsx.bak-okno2.
- [x] "Zmiana na" wg reguly Macieja: KONKRETNA jednostka jesli istnieje nastepca tego samego TYPU w nowej epoce, inaczej sam TYP (system podmienia na dowolna dostepna tego rodzaju). Civilian/Super = "—". (Wojownik->Wojownik z mieczem; kamienni strzelcy->Kusznik; reszta->typ.)
- [x] ANALIZA LUK (3 epoki): brak realnych luk. Spearman/Mount startuja w Brazie; Distance w Żelazie pokryty (Kusznik generyczny + akadyjski). Falangite/Offensive z natury nacyjne (brak generycznej) — nie luka.
- [>] DO MASTERA: regula na przyszlosc (Sredniowiecze+): kazda nowa epoka MUSI dac generyczna jednostke dla kazdego zywego typu, inaczej typ zniknie epoke pozniej (okno=2). Reguła dostepnosci/awansu w zakladce "Legenda + reguła".
- [i] PYTANIE Macieja (dwa pliki bitwy): Gra-podglad.html=kanon (zostaje); Gra-podglad-BITWA.html=podglad do testow bitwy (najnowszy kod) — usunac dopiero po wpieciu bitwy w kanon. Czekam na decyzje, nic nie kasuje.
LAST-PROCESSED: 2026-06-24 17:40 — okno 2 epok + niebojowe osobno + analiza luk (xlsx)

---
## 2026-06-24 18:10 — UNITS: fix "nie rotuja + pat" — wyzsze progi ucieczki + watchdog
- [x] DIAGNOZA: model morale=base-100*(1-HP%). Dla heavy (Legionista/Falanga, baza110/ucieczka25) rout dopiero ~15% HP => bily sie do smierci; armia mielila sie wolno i utykala na 23% (>20% prog -> bitwa nie konczyla sie, "leca tury i nic").
- [x] Podniesione progi ucieczki (units.json "Morale ucieczki"): super 35, heavy 50 (~40% HP), standard 45, light 50 (~65% HP), mount 20 (wg Macieja), berserk 10 (walczy do konca), civ 50, naval 40. -> jednostki rotuja wczesniej/CZESCIOWO.
- [x] WATCHDOG anty-pat (battleScene): jesli przez STALL_TURN_LIMIT=6 tur brak zmiany HP/morale/strat -> bitwa rozstrzygana po morale armii (slabsza przegrywa). _updateStallWatch + injekcja w _checkEnd.
- [x] Build 864578 B, tsc 0, zrodla zsync (battleScene.ts + units.json).
- [i] Dane morale spojne z xlsx (Morale ucieczki). Reszta modelu bez zmian.
LAST-PROCESSED: 2026-06-24 18:10 — wyzsze progi ucieczki + watchdog anty-pat (BITWA 865KB)

---
## 2026-06-24 18:30 — UNITS: FIX zero-routow (rout-before-death) + liczenie zrootowanych
- [x] ROOT CAUSE: w _singleBlow lethalny cios -> _startFade + return PRZED _applyMoraleDamage. Przy malym HP/duzych ciosach jednostka ginela, zanim morale zdazylo peknac -> 0 routow mimo modelu.
- [x] FIX1 rout-before-death: jesli cios obnizylby morale <= fleeMorale, jednostka PEKA I UCIEKA zamiast ginac (hp cap=1, _applyMoraleDamage -> _startRout). Tylko cios nielamiacy morale zabija od razu; neverRout (berserk) nie pekaja.
- [x] FIX2 _sideUnitFates: routed ma pierwszenstwo nad dead (uciekinier ktory znikl za krawedzia byl liczony jako Zniszczony -> teraz Zrootowany).
- [x] Build 864787 B, tsc 0, battleScene zsync. Tylko kod bitwy (dane bez zmian).
LAST-PROCESSED: 2026-06-24 18:30 — fix zero-routow (rout-before-death) + liczenie (BITWA 865KB)

---
## 2026-06-24 18:45 — UNITS: niestrzelajacy = 2 paski + ramka na 2
- [x] makeUnitBars(outlineColor, showAmmo): ramka obejmuje 3 paski tylko dla strzelajacych (amunicja>0), inaczej 2 (HP+morale); pasek amunicji u niestrzelajacych niewidoczny. ammoShown liczone PRZED makeUnitBars. Build 864777 B, tsc 0, battleScene zsync.
LAST-PROCESSED: 2026-06-24 18:45 — niestrzelajacy 2 paski + ramka na 2 (BITWA 865KB)

---
## 2026-06-24 — UNITS: rout = NORMALNY ruch turowy + skirmiszer "kite & strzal w tej samej turze"
- [x] FIX1 ucieczka NORMALNYM ruchem (koniec ciaglego glide'u):
  - _startRout: usuniety setup glide (fleeStartX/Z/T0 + routingUnits.push); zostaje routed=true, obrot ku wlasnej krawedzi, zwolnienie kafla (occByKey), log, routedUnits.push. acted=true tylko na BIEZACA ture (resetowane co ture w _beginTurn).
  - NOWY _fleeStep(ru,done): co ture jednostka idzie do swojej krawedzi domowej (atakujacy -> kol 0/zachod, obronca -> kol BF_COLS-1/wschod), po 1 kaflu na krok przez _doMove (dekrementuje moveLeft), lancuch przez _schedule(STEP_GAP_MS) dopoki moveLeft>0 — analogicznie do _fallBackStep/_advanceStep. Preferuje ten sam wiersz, przy blokadzie probuje wiersz +-1, +-2 (occByKey + passable + granice). Po wejsciu na kolumne krawedzi -> _removeUnitFromScene + _shakeAlliesOnLoss (znika z pola).
  - Petla tur: _beginTurn snapshot teraz WLACZA zrootowane (filtr !removed zamiast !routed), _activateNext nie pomija routed, reset moveLeft co ture ich obejmuje; _activateUnit ma PIERWSZY branch `if (ru.routed) { this._fleeStep(ru,done); return; }` — nigdy nie atakuja.
  - Usuniety ciagly glide: skasowane wywolanie this._tickRouting(vt) w petli renderu ORAZ cale cialo _tickRouting; usuniete pole routingUnits, stale FLEE_SPEED/FLEE_TILES_PER_S oraz nieuzywane pola interfejsu routTargetX/routEdgeX/fleeStartX/fleeStartZ/fleeT0 i ich inicjalizacja (bez bledow tsc).
  - Zrootowani nadal licza sie jako OUT (flaga routed) i jako "Zrootowane" na ekranie koncowym — bez zmian.
- [x] FIX2 skirmiszer KITE konczy ZAWSZE strzalem w tej samej turze:
  - _rangedAction branch 1 (wrog melee w MELEE_SAFE_GAP, Manhattan<=2): zamiast _rangedBackStep (cofal sie kilka kafli i nie strzelal) — cofamy sie o JEDEN kafel tak, by po ruchu cel (lub jakikolwiek wrog) byl nadal w zasiegu [1..range], a NASTEPNIE _doAttack w tym samym callbacku _doMove.
  - NOWY helper _bestKiteShotStep(ru,threat): skanuje 4 sasiadow ku tylowi; przyjmuje kafel tylko jesli z niego ktorys wrog jest w zasiegu (inRangeOfSome) i NIE jest sasiedni do zadnego wroga; maksymalizuje gap do threat (premia za czysty krok w osi tyl), tie-break minimalny lateral. Reuse wzorca z _bestBackStep.
  - Jesli zaden kafel nie zachowuje celu w zasiegu -> bez ruchu, strzal w miejscu (_rangedTargetInRange ?? nearest). Branche 2 (SHOOT-stay) i 3 (ADVANCE) bez zmian. Efekt: skirmiszer cofa sie ~1 kafel i STRZELA co ture zamiast uciekac 3 kafle po cichu.
- [x] tsc --noEmit: battleScene.ts 0 bledow (pre-existing w converters.ts/upkeep.ts/main.ts — nie moje). vite build OK.
- [x] Deploy: Gra-podglad-BITWA.html 865442 B (>700KB, konczy </html>, brak type="module"/crossorigin); battleScene.ts (5131 linii) zsync do repo.
- [i] UWAGA build: Edit/Write na pliku w OneDrive UCINA plik (5068->5050) — edytowano wylacznie kopie /tmp/gb przez python, build w /tmp, deploy przez cp. Reuse: _bestBackStep (wzorzec), _doMove/_schedule/_removeUnitFromScene/_shakeAlliesOnLoss.
LAST-PROCESSED: 2026-06-24 — rout=normalny ruch turowy + kite&strzal (BITWA 865KB)

---
## 2026-06-24 19:05 — UNITS: progi ucieczki /2 + Excel
- [x] Wszystkie "Morale ucieczki" obnizone O POLOWE (zostaja dluzej na polu, czesc ginie zamiast 100% routu). units.json + Jednostki.xlsx przebudowany (te same zakladki: Wszystkie/Epoki/Niebojowe/Legenda). Backup: Jednostki.xlsx.bak-flee-half.
- [i] Razem z tym: pakiet SFX + ambient (osobny wpis powyzej). BITWA 872KB.
LAST-PROCESSED: 2026-06-24 19:05 — progi ucieczki /2 + Excel + SFX/ambient (BITWA 872KB)

[2026-06-24 19:56] Naprawa audio bitwy: gesture-init przeniesiony na window (capture), klawisz M teraz tworzy+wznawia AudioContext i startuje ambient; 3 podmiany w battleScene.ts. Build zielony (tsc 0 bledow battleScene, vite 872KB single-file) -> Gra-podglad-BITWA.html.
LAST-PROCESSED: src/battle/battleScene.ts (5423 linie, zsynchronizowane z dist).

[2026-06-24 20:24] Redesign dzwiekow bitwy (tylko cialo 3 metod w battleScene.ts):
- _sfxMelee: stal o stal — 3 niharmoniczne partiale (osc ~2100/3100/4500 Hz, ±8% losowo per cios, atak 0.003s, ring exp decay 0.18–0.30s) + krotki jasny transient z _noiseBuf przez highpass 3000 Hz. Wynik = metaliczny "TING", nie kamien.
- _sfxShot: swist strzaly/oszczepu — sinus zjezdzajacy 1900→650 Hz w ~0.18–0.22s (miekka obwiednia) + warstwa powietrza z _noiseBuf przez bandpass 2300→1500 Hz, niski gain. Lekki losowy pitch.
- _startAmbient: lekka muzyka zamiast buczenia — petla melodii (motyw 8 nut ze skali pentatonicznej/dorian wg terenu, nuta co ~0.95–1.25s przez _ambDrumTimer, triangle/sine -> lowpass 1200 Hz, miekka obwiednia release 0.8–1
---
## 2026-06-24 — AMBIENT (spokojny) PRZYWRÓCONY
Re-enabled ambient w battleScene.ts. `_onAudioGesture` -> `_ensureAudio()`+`_startAmbient()`; `_onKeyMute` -> po toggle `if(!_audioMuted) _startAmbient()`. Nowy `_startAmbient`: cichy bus (`_ambBaseGain`=0.05), PAD przez SWELLE (akord 3xsine root+tercja+kwinta, lowpass ~820Hz, atak 1.5s/release 3.5s co ~6.2s — żadnego ciągłego drone'a), MELODIA pentatonika (sine/triangle, lowpass 1100Hz, atak 0.08s/release 1.4s co ~2.5s) przez subtelny feedback DELAY (0.38s, fb 0.25, wet 0.18). Faint epoch flavour z `terrain` (las/góry/pustynia) zmienia root+tempo+skalę. Teardown czysty: nowe pole `_ambTimers[]` czyszczone w `_teardownAudio` + wszystkie oscylatory w `_ambNodes`. SFX nietknięte. tsc: 0 błędów battleScene; vite build OK 874KB; deploy Gra-podglad-BITWA.html.
LAST-PROCESSED: ambient-calm-rewrite 2026-06-24

---
## 2026-06-24 — BATTLE MORALE MODIFIERS (pełny zestaw)
8 czynników morale wpiętych w istniejący model (morale/moraleMax/fleeMorale/neverRout); rout-before-death działa nadal. Stałe top-level (tunable):
- F1 FLANKA/TYŁ: `MORALE_FLANK_HIT=8`, `MORALE_REAR_HIT=15` — w `_singleBlow` przy trafieniu, dorzucone do `extraMorale` (wliczone w projekcję rout-before-death i `_applyMoraleDamage(...,extra)`).
- F2 SZARŻA: `MORALE_CHARGE_HIT=15` — gdy `attacker.mounted` i cios szarży (`isCharge`/pierwszy cios), +15 do straty obrońcy.
- F3 ZABICIE/ROUT → zysk atakującego: `MORALE_KILL_GAIN=6` — `_gainMorale(attacker)` w gałęzi śmierci ORAZ gdy cios łamie morale (rout-before-death i finalny).
- F4 WRÓG PĘKA OBOK → zysk drugiej strony: `MORALE_ENEMY_BREAK_GAIN=5`, promień `MORALE_DEATH_RADIUS=3` — `_boostEnemiesOnBreak(fallen)` przy śmierci (obok `_shakeAlliesOnLoss`) i w `_startRout`.
- F5 OTOCZENIE: `MORALE_SURROUND_HIT=10`, RAZ (`surroundApplied`) — start `_activateUnit`: >=3 wrogów Manhattan==1 → -10 + `_checkRout`.
- F6 TEREN OBRONNY: `MORALE_TERRAIN_RESIST=5` — w `_checkRout`, na wzgórzu/lesie (terrainDefenseMultiplier>1) próg ucieczki = `fleeMorale-5` (clamp >=0), trzyma dłużej.
- F7 ZAŁAMANIE ARMII: `MORALE_ARMY_COLLAPSE_RATIO=0.40`, `MORALE_ARMY_COLLAPSE_MULT=1.3` — w `_applyMoraleDamage` jeśli `_armyMoraleRatio(side)<0.40`, strata HP-based ×1.3 (tylko straty, nie zyski/flat).
- F8 GENERAŁ: PLACEHOLDER `MORALE_GENERAL_AURA=0` + stub `_generalMoraleAura(_ru){return MORALE_GENERAL_AURA;}` (niewpięte).
Bezpieczeństwo: zyski (`_gainMorale`/`_boostEnemiesOnBreak`) NIGDY nie wywołują rout (brak pętli); surround/screen z flagami once. Nowe pole interfejsu: `surroundApplied` (init false). Rout potwierdzony działa (`_checkRout`/`_startRout` nienaruszone w logice progu poza F6).
tsc: 0 błędów battleScene.ts/cityPanel.ts/ai.ts (9 pozostałych błędów = preexisting main.ts/converters.ts/upkeep.ts/bronzepreview — NIE moje). vite build OK 876KB, kończy </html>, brak type="module"/crossorigin. Deploy: Gra-podglad-BITWA.html (876171 B) + repo src/battle/battleScene.ts (5644 linii).
LAST-PROCESSED: battle-morale-modifiers 2026-06-24

## 2026-06-24 — UNITS: panel Bitwa-parametry.xlsx zaktualizowany (sekcja MORALE)
- [x] Dodana sekcja "MORALE — model + czynniki": wszystkie stale (flank/rear/charge/kill/enemy-break/surround/terrain/army-collapse/general-placeholder + bazowe/ucieczki/scale/threshold/ally-death/radius/screen-lost) z wartosciami + znaczeniem. Poprawione BF_ROWS 28->78. Backup: _backup/Bitwa-parametry.xlsx.bak-morale.
- [i] Generał = placeholder (MORALE_GENERAL_AURA=0, stub _generalMoraleAura) — miejsce zarezerwowane, niewpiete.

## 2026-06-24 — UNITS → MASTER (do UX): nakładka UX na bitwę
- [>] HANDOFF: dyspozycje/_handoff/UNITS-do-MASTER_UX-bitwa.md — brief dla UX: inwentarz obecnego HUD bitwy, propozycje (górny/dolny pasek, panel jednostki, minimapa, ekran przed-bitwą, styl), co mogę zaprezentować (Gra-podglad-BITWA.html, galeria, panel parametrów), 7 pytań do ustalenia. Plik referencyjny: Gra-podglad-BITWA.html.
- [?] Kontratak zweryfikowany: JEST (_doMeleeAttack: cios + cios zwrotny gdy obrońca wręcz przeżyje). Jednostronne straty = śmierć/rout od 1. ciosu, strzelec z amunicją nie kontruje, pudło. Pytanie do Macieja: zostawić, czy dodać „cios konający" / kontrę strzelca.

## 2026-06-24 — UNITS: DO PRZEMYSLENIA (przyszlosc) — kara -50% dla strzelcow bez oslony wrecz
- [~] Obecna regula (_checkMeleeScreenLost): gdy strona traci OSTATNIA jedn. wrecz -> strzelcy -50% morale. Problem: krzywdzi cywilizacje DYSTANSOWE-OD-POCZATKU (nigdy nie mialy oslony).
- [>] Plan: odpalac kare TYLKO jesli strona STARTOWALA z jednostka wrecz (flaga "miala screen" liczona przy starcie bitwy); armia ranged-only zwolniona. Alt: skalowac kare udzialem jedn. wrecz w skladzie. NIE wdrazac do decyzji Macieja.

## 2026-06-24 — UNITS → MASTER: Osadnik do wycofania (zakladanie miast z MAPY)
- [>] HANDOFF: _handoff/UNITS-do-MASTER_osadnik-zakladanie-z-mapy.md. Decyzja Macieja: miasta zakladane z mapy -> Osadnik zbedny. Zaleznosc: obecnie miasto zaklada Osadnik (main.ts/B); wyciecie przed migracja silnika zepsuje zakladanie. Master: zrob zakladanie-z-mapy, potem sygnal -> usune Osadnika z units.json/Jednostki.xlsx.
- [?] Maciej wybiera kolejnosc: A) usun Osadnika teraz + pilna migracja silnika (ryzyko dziury), B) [zalec.] zostaw do czasu zakladania-z-mapy.

## 2026-06-24 — UNITS: WARIANT A — Osadnik USUNIETY z danych (PILNE: zakladanie z mapy)
- [x] Osadnik usuniety z units.json (47->46) + Jednostki.xlsx (niebojowe=Robotnik,Zwiadowca). Backup: _backup/Jednostki.xlsx.bak-osadnik.
- [>] PILNE DO MASTERA (handoff zaktualizowany): bez Osadnika NIE DA SIE zalozyc miasta -> wpiac zakladanie z MAPY ASAP; przebudowac KANON (units.json -X Osadnik); usunac odwolania do Osadnik/Settler w main.ts/menu/tutorial.

## 2026-06-24 — UNITS → MASTER (UX): Q1=B+AUTO + faza ROZSTAWIANIA przed bitwa
- [>] Handoff UX zaktualizowany: tryb B (gracz steruje + przelacznik AUTO) ORAZ nowe wymaganie: faza deploymentu (gracz rozstawia jednostki przed Start; strefa startowa, drag&drop, auto-ustaw/reset, potem Start). Q2-Q7 do dosłania.
- [i] Tryb B + deployment = DUZA zmiana bitwy (input gracza, stany deployment->walka, rozkazy). Po projekcie UX: czesc po stronie battleScene + handoff do Mastera na scalenie.
- [i] "SPRAWDZ" — przeczytano UNITS.md; brak nowego zadania od Mastera w DO-ZROBIENIA (tryb event-driven, praca przez Sonnet-subagentow przyjeta).

## 2026-06-25 — UNITS: ANALIZA BALANSU WALKI 1v1 (LAST-PROCESSED)
- [x] ZROBIONE: Combat-balance tournament 44 jednostek bojowych × baseline (Wojownik z mieczem i tarczą). Monte Carlo 300 rep/matchup, macierz typów 500 rep/matchup, seed=42. Model = wierna replika combat.ts §5l.
- [>] PLIK: `/Civ/Macierz-walki.xlsx` (4 arkusze: Macierz typow, Ranking jednostek, Outliery i uwagi, Zalozenia). Backup starego pliku w _backup/.
- [!] KLUCZOWE USTALENIA (do decyzji Macieja):
  1. DEADLOCK: Włócznik vs Włócznik / Włócznik vs Falanga = remis po 50 rundach (limit). Przebicie zbyt małe by przebić Pancerz 6. Sugestia: +2 Przebicie dla jednej z klas LUB -10 HP Włócznika.
  2. FALANGA DOMINUJE: Win% vs baseline = 100% i pobija każdy typ poza inną Falangą/Włócznikiem. Jako Specjalna Grecja może być OK, ale rozważyć czy zbyt tania.
  3. SUPER-JEDNOSTKI jednorodne: Hieros Lochos, Evocati, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Sumeru = wszystkie 100% vs baseline. Zróżnicowanie między super-jednostkami ZEROWE — nie ma wyraźnego hierarchy. Sugestia: obniżyć HP 2-3 z nich o ~10-12%.
  4. SŁABE JEDNOSTKI: Wojownik (epoka Kamień, brak Przebicia), Galera, Impi, Procarz — poniżej 5% vs baseline. Może być intencja (tania/specyficzna rola), ale Impi (Spearman) z 0% jest zaskakujące — ma ATK=3.
  5. RYZYKOWNE: Gaesatae (ATK=10, DEF=2, ARM=0) i Berserker germański (ATK=10, DEF=2, ARM=0) — gamblerzy: albo oneshot albo giną szybko. Win% OK (57-80%) ale wariancja bardzo duża.
  6. Typ Offensive (Wojownik z toporem) bije Mieczników (95%) ale słaby vs Dystansowych (26%) — poprawna rock-paper-scissors asym.
  7. Kusznik (Distance, Chiny) wygrywa 97% vs baseline — silny dla dystansowego.
- [?] Pytania do Macieja: (a) Włócznik deadlock — podnieść Przebicie czy obniżyć HP? (b) Super-jednostki — czy celowo wszystkie 100%? (c) Impi (ATK=3) — design intent? (d) Falanga — koszt odpowiedni?
- [i] LAST-PROCESSED: 2026-06-25 przez subagent combat-analysis (Sonnet 4.6). Tylko odczyt danych; units.json NIE zmieniony.

## 2026-06-25 — UNITS: BESPOKE 3D MODELS dla jednostek SPECJALNYCH (LAST-PROCESSED)
- [x] ZROBIONE: dodano 12 dedykowanych modeli 3D (bespoke) do `src/render/units.ts`; każdy ma branch PL+EN w `buildNamedUnit`.
  - **Impi** (Zulu) — krótka iklwa (stabbing spear) + wielka owalna tarcza cowhide (isiHlangu) z białym wzorem, nagie ochre ciało, loincloth.
  - **Oszczepnik Zulu (Izijula)** — wiązka 3 lekkich oszczepu (isijula) + mała tarcza hide ze strefą białą, nagie ochre ciało.
  - **Włócznik sumeryjski** — wysoka prostokątna tower shield (właśc. Sumeru) + włócznia + fleece-trimmed kaunakes (3 poziomy frędzel) + miedziany stożkowy helm.
  - **Łucznik sumeryjski** — łuk kompozytowy + kaunakes fleece + miedziany stożkowy helm + kołczan; barwa teal/miedź odróżnia od zielonego generic archera.
  - **Rydwan sumeryjski** — PEŁNE (lite) koła bez szprych (SOLID DISC) + onager-look (dun horses), cięższy kadłub, miedziany helm kierowcy, fleece hem.
  - **Łucznik egipski** — łuk kompozytowy + biały lniany kilt + niebiesko-pasiasty nemes (chusty faraońska), złoty usekh collar; wyraźnie inny od generic i Akkadian.
  - **Wojownik z khopesh** — zakrzywiony sierpowy miecz (khopesh, 4-segmentowy hook) + mała tarcza, nemes headcloth + złoty kołnierz egipski.
  - **Rydwan egipski** — zbudowany na generic chariot + dodany łuk composite na pokładzie + złoty trim + niebieski pasek na froncie skrzyni.
  - **Oszczepnik (Estólica)** — atlatl (spear-thrower) + oszczep załadowany + wiązka zapasowych drzewc, andyjski uncu tunic, złoty kołnierz, czerwona llautu-opaska + pióro.
  - **Procarz (Huaracoc)** — andyjska proca (huaraca) ze sznurami + sakwa na kamienie + złote ear-spools (qinpu), czerwona opaska, andyjski tunic.
  - **Jeździec chiński** — zbudowany na generic cavalry + lakierowana lamellar coat (lak-czerwona) + dagger-axe (ge) zamiast lancy + miedziany helm z szpikulcem + neck-flap.
  - **Kusznik (Crossbowman)** — CROSSBOW: poziomy stock + HORIZONTAL prod bar + loaded quarrel (bolt) + fleche na tyłku boltu; lamellar lak-czerwony + chiński helm; ZASTĄPIŁ wadliwy fallback do archer.
- [i] tsc: 0 błędów w units.ts (błędy pre-istniejące w main.ts/converters.ts/upkeep.ts pozostawione bez zmian).
- [i] Vite build: 938 KB dist/index.html, brak type="module"/crossorigin.
- [i] Deployed: `Gra-podglad-BITWA.html` (938 668 B).
- [i] Backup: `src/render/_backup/units.ts.bak-specials` (w repo).
- [!] SILNIK: units.ts zmieniony → SILNIK powinien przebudować kanon (setup.ts/units-setup) jeśli był cache'owany z poprzedniej kompilacji. Dane units.json NIE zmienione.
- [i] LAST-PROCESSED: 2026-06-25 przez subagent LANE/units (Sonnet 4.6).

## 2026-06-25 — GALERIA 4-WIDOKI: rebuild z 46 jednostkami (LAST-PROCESSED)
- [x] ZROBIONE: przebudowano `Civ-UNITS/Galeria-jednostek-4widoki.html` z aktualnego src/gallery4 + data/units.json.
- Liczba jednostek: **46** (po usunięciu Osadnika; dedupe by Jednostka name).
- Nowe bespoke specjale obecne: Impi, Oszczepnik Zulu (Izijula), uThulwana, Kusznik (crossbow), Jeździec chiński, Wojownik celtycki, Gaesatae, Rydwan celtycki, Wojownik germański, Berserker germański, Khopesh, Medżaj, Rydwany sumeryjskie/egipskie itp.
- Ulepszenia galerii vs poprzednia wersja: dodano **Nazwa EN** (błękitna kursywa pod polską nazwą), chipy **Typ/Klasa/Nacja** (Nacja wyróżniona złotym kolorem).
- Patch w /tmp/gg (src/gallery4/main.ts + index.html + src/data/loader.ts: dodano pola Nazwa EN/Typ/Klasa/Nacja do UnitDef).
- Backup starej galerii: `Civ-UNITS/_backup/Galeria-jednostek-4widoki_<timestamp>.html`.
- Output: `Civ-UNITS/Galeria-jednostek-4widoki.html` — 678 165 B, file://-ready (type="text/javascript", brak crossorigin), ends </html>.
- [i] LAST-PROCESSED: 2026-06-25 przez subagent LANE/units (Sonnet 4.6).

## 2026-06-25 — UNITS: fix zamrozonych uciekinierow przy krawedzi + speed 256/512
- [x] _fleeStep: zrootowany z zablokowana droga do krawedzi (rzeka/teren/jednostki w oknie +-2) nie "trzymal" w nieskonczonosc -> po 2 turach utkniecia _removeUnitFromScene (pole fleeStuck). Koniec jednostek zamarzajacych "bez reakcji" przy krawedzi.
- [x] SPEED_STEPS += 256, 512 (klawisz S). Build 939662 B, tsc 0.
- [i] Runda 1+2 (subagenci Sonnet): 12 bespoke modeli nacyjnych + Kusznik=kusza (units.ts), Macierz-walki.xlsx (turniej balansu), galeria 4-widoki 46 jedn. -> units.ts zmienione -> SILNIK przebuduj kanon.
- [?] BALANS (z Macierz-walki.xlsx) do decyzji Macieja: 1) Wlocznik vs Wlocznik/Falanga deadlock (Przebicie/HP); 2) Falanga 100% (koszt vs nerf); 3) super-jedn. jednorodne 100% (tiery?); 4) slabe Impi/Galera (podbic?).

## 2026-06-25 — QA VERIFY (regresja po bespoke models / speed 256-512 / fleeStuck / role-deploy / audio)
- LAST-PROCESSED: QA verify — tsc 0 błędów (battleScene/units/testBattle/setup); testy logic 163/163, combat 6/6, barbarians 53/53, diplomacy 89/89, wealth 25/25, converters 30/30 — BRAK nowych regresji; vite build 935 260 B, markery obecne, wdrożony plik zgodny z buildem. ZIELONO.

## 2026-06-25 — DOC REFRESH: Dokumentacja-UNITS-BITWA.md
- [i] LAST-PROCESSED: 2026-06-25 doc refresh (Sonnet 4.6) — zaktualizowano §2.7 MODEL MORALE (8 czynników, rout-before-death, ARMY_MORALE_LOSS_THRESHOLD), §2.8 (obwódka frakcji, 2/3 paski), §2.9 (SPEED_STEPS 1..512, pauza P), §2.11 (deployment wg roli: linia/oszczepnicy/łucznicy/jazda-skrzydła), §2.12 (AI: phalanx nie goni, kite+shoot, out-of-ammo fallback, cavalry priority), §2.14 (Szczegoly + Zakoncz bitwe), §2.15 (AUDIO proceduralny: 5 SFX + ambient), §3.1 (46 jedn., Morale bazowe/ucieczki, Typ/Klasa/Nacja/Bonus vs, Zmiana na, Dostepna). Backup: _backup/Dokumentacja-UNITS-BITWA.md.bak-20260625-053239.

---
## 2026-06-25 — UNITS → MASTER: Posiłki 1-heks (decyzja Macieja Q4)
- [x] Rozstrzygnięte (DZIENNIK §2026-06-25 POSILKI): strona ATAK = heks atakującego + armie sojusznicze **≤1 heks** od niego; strona OBRONA = heks broniącego + armie **≤1 heks** od niego. Superseduje wcześniejszy model „tylko ten sam heks".
- [>] Właściciele: UNITS (skład bitwy), MAPA (lista heksów w zasięgu), CYWILIZACJE (heurystyka dolączania AI), SILNIK (zbieranie składu przy starcie bitwy).
- [>] Kontrakt API: `_handoff/UNITS-do-MASTER_kontrakt-walka-multi.md` §1.

---
## 2026-06-26 — UNITS → MASTER: Robotnik usunięty (decyzja 2A) — status silnika
- [x] Decyzja Macieja 2A: Robotnik USUNIĘTY → ulepszenia terenowe = akcja z mapy (nie jednostka). Zwiadowca zostaje.
- [x] UNITS (lane): Robotnik usunięty z units.json + Jednostki.xlsx (niebojowe = tylko Zwiadowca). Ulepszenia = akcja mapy (spec po stronie MAPA/MASTER).
- [x] SILNIK (ENGINE BATCH 1A/2A, kanon 5a0f886c → 0dbf75d8): odwołania Robotnika w main.ts/setup usunięte (anty-crash); brak aktywnych refs; gra startuje z miecznikiem; martwy kod zostaje. Rename Legionista→Hastati DONE.
- [>] ZOSTAJE (poza UNITS): akcja „Buduj ulepszenie" z mapy — MAPA (front UI) + MASTER (wpięcie akcji w pętlę). Bez tego gracz nie ma zamiennika Robotnika w rozgrywce.
- [i] Backfill z DZIENNIK-MASTERA §2026-06-25 DECYZJE + ENGINE BATCH 1A/2A.

---
## 2026-06-26 — UNITS → MASTER: Model oblężenia zatwierdzony (atrycja 8%, kapitulacja)
- [x] Parametry domyślne UNITS (do ewent. strojenia Macieja):
  - **Atrycja garnizonu:** 8% maxHP/turę (zegar oblężenia).
  - **Próg upadku:** średnie HP garnizonu 30–40% → miasto podatne na szturm/kapitulację.
  - **Kapitulacja:** 1 tura po wyzerowaniu zapasów żywności → automatyczne zdobycie (transfer właściciela), BEZ jawnej akcji/bitwy.
  - **Mur:** +200% obrony struktur (`structureDefenseBonusFor`, konsumować `maMur`).
- [x] SILNIK PARTIAL (batch 4, kanon 9faa7ebf): tura oblężenia — głód + atrycja 8% + kapitulacja DONE (oblezenie-test 27/27). EKONOMIA: kontrakt zapasów (`city.oblegane`, `getCityFood()`, garnizon) DONE.
- [>] DEFERRED (czeka UNITS kontrakt startu + MASTER): flaga `oblegane` przy starcie, panel oblężenia, kolejka machin 1/turę, HP per jednostka garnizonu, `captureCity` po szturmie/kapitulacji.
- [i] v0.1 oblężenie kompletne bez Katapulty/Warsztatu (Taran=Kamień in-siege, Wieża=Brąz in-siege; Katapulta=Średniowiecze, poza v0.1).

---
## 2026-06-26 — UNITS → MASTER: Kontrakty multi-unit + posiłki 1-heks (GOTOWE)
- [>] HANDOFF GOTOWE — `_handoff/UNITS-do-MASTER_kontrakt-walka-multi.md`:
  - **Skład bitwy (decyzja Macieja Q4):** heks ATAKUJĄCEGO + heks OBROŃCY + wszystkie jednostki w promieniu **1 heksa** od każdego (posiłki). Dalsze heksy NIE wchodzą.
  - **AUTO-rozstrzyganie (Q1):** osobny dopracowany model siły efektywnej (nie 1v1!) dla AI vs AI, trybu Auto i bitew bez udziału gracza. Propozycja: Σ(Atak_eff×HP×morale) + countery typów + teren + struktury (+200% mur); stosunek sił → straty proporcjonalne per jednostka.
  - **TAKTYCZNA:** gracz wybiera „Pole bitwy" → pełna BattleScene; ten sam skład.
  - Input/output API opisane w kontrakcie (Unit[], winner, straty per id).
- [>] HANDOFF GOTOWE — `_handoff/UNITS-do-MASTER_kontrakt-start-oblezenia.md`:
  - **Start (Q2):** gracz atakuje → ZAWSZE jawna „Oblężaj"; AI blokuje → auto `oblegane=true`; AI szturmuje → jawna akcja; głód=0 → auto zdobycie.
  - **Garnizon (Q3A):** realne jednostki wojskowe w mieście + milicja z populacji; HP per jednostka do atrycji i bitwy taktycznej.
  - **Przebieg:** kolejka machin 1/turę (Taran/Wieża in-siege), szturm → bitwa UNITS, po zdobyciu → `captureCity`.
  - Konsumuje kontrakt EKONOMII (zapasy/garnizon).
- [i] Posiłki 1-heks: zgodne z DZIENNIK §2026-06-25 POSILKI (atak = heks atakującego + sojusznicy ≤1 heks; obrona analogicznie). MAPA dostarcza listę heksów; SILNIK zbiera skład przy starcie bitwy.
- [>] MASTER: wpięcie obu kontraktów odblokowuje pełną bitwę z mapy (P4 preBattle obecnie = fallback Auto) + start oblężenia.

---
## 2026-06-26 — UNITS → MASTER: Q1 bitwa UX = B + AUTO (decyzja Macieja)
- [x] **Q1 = B**: gracz **STERUJE** jednostkami (zaznaczanie + rozkazy ruch/atak/cel), z **przełącznikiem AUTO** (oddanie sterowania AI taktycznej). UX projektuje: zaznaczanie/grupy, rozkazy, toggle AUTO↔ręczne.
- [x] **Faza rozstawiania** przed „Start": gracz ustawia jednostki w strefie startowej (drag&drop, auto-ustaw, reset) → dopiero Start odpala symulację.
- [>] HANDOFF UX: `_handoff/UNITS-do-MASTER_UX-bitwa.md` — §5 (Q1), §5a (Total War HUD: kursor kontekstowy łuk/miecz, rozkazy wycofanie/stand-by/dystans ON-OFF/strzał ON-OFF, roster Frontalne/Dystansowe/Mounted + slot generała, panel jednostki).
- [~] Q2–Q7 UX (minimapa, górny pasek, styl, sterowanie) — czeka Maciej; UI lane czeka na projekt.
- [>] Po projekcie UX: implementacja w battleScene (lane UNITS) + handoff scalenia do MASTER.
- [i] Rozróżnienie: UX **Q1=B** (sterowanie gracza) ≠ kontrakt **auto-rozstrzyganie** (decyzja „auto" = model siły dla Auto/AI vs AI) — patrz wpis „Kontrakty multi-unit".

---
## 2026-06-26 — UNITS: Ambient bitwy — decyzja B (proceduralny spokojny)
- [x] Decyzja Macieja: **B** — spokojniejszy proceduralny podkład (delikatny pad + rzadka melodia, cicho, bez stałego drona/buczenia), NIE utwór z YouTube (A = bez ambientu; C = prawdziwy utwór przez Mastera).
- [x] Wdrożony ambient v3 (`_startAmbient` w battleScene.ts): cichy bus, pad przez SWELLE (akord 3×sine, atak/release), melodia pentatonika co ~2.5s, subtelny delay; faint flavour z terenu. SFX nietknięte (stal, świst, rout, padnięcie, fanfary). M = wycisz.
- [x] Potwierdzenie Macieja (raw/04-UNITS): „muzyka jest ok, jak najbardziej" → ambient v3 **ZOSTAJE**.
- [i] W kanonie gry (Gra-podglad.html) ambient może nie być jeszcze — dotyczy podglądu bitwy (Gra-podglad-BITWA.html / oblężenie). Wpięcie do kanonu = batch SILNIK po review.

---
## 2026-06-26 — UNITS → MASTER: OTWARTE — balans Macierz-walki (czeka Macieja)
- [~] Analiza balansu 1v1 DONE (2026-06-25): turniej 44 jednostek × baseline, Monte Carlo 300 rep/matchup, wynik w `Macierz-walki.xlsx` (4 arkusze). units.json NIE zmieniony — czeka decyzja Macieja przed korektami.
- [!] KLUCZOWE USTALENIA (pytania ABC do Macieja):
  1. **DEADLOCK:** Włócznik vs Włócznik / Włócznik vs Falanga = remis po 50 rundach (Przebicie vs Pancerz 6). Sugestia: +2 Przebicie LUB −10 HP Włócznika.
  2. **FALANGA DOMINUJE:** 100% vs baseline i prawie wszystkie typy. Pytanie: koszt odpowiedni vs nerf?
  3. **SUPER-JEDNOSTKI jednorodne:** Hieros Lochos, Evocati, Hu Ben Wei, uThulwana, Królewska Gwardia, Medżaj, Gwardia Sumeru — wszystkie 100% vs baseline, brak hierarchii. Sugestia: obniżyć HP 2–3 o ~10–12%.
  4. **SŁABE:** Wojownik (Kamień), Galera, Impi, Procarz — <5% vs baseline. Impi (Spearman, ATK=3) = 0% — design intent?
  5. **GAMBLERZY:** Gaesatae/Berserker (ATK=10, DEF=2, ARM=0) — wysoka wariancja, Win% OK (57–80%).
  6. **Offensive vs Distance:** rock-paper-scissors działa (Topornik 95% vs Mieczników, 26% vs dystansowych).
- [?] Czekam na odpowiedź Macieja (np. „1A 2B 3C 4…") zanim wdrożę korekty do units.json + targeted export.
- [i] AUTO-rozstrzyganie (kontrakt multi-unit) ma być spójne z wagami Macierz-walki — strojenie po decyzji balansu.

---
## 2026-06-26 — UNITS Sprint 1 (D5=B, D10=A) — meldunek lane

### D5=B — UX bitwy
- [x] `UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` — **BRAK** (UI nie dostarczyło).
- [x] Utworzono `_handoff/UNITS-do-UI_battle-ux-constraints.md` — ograniczenia techniczne z `preBattle.ts`, `battleScene.ts`, `manualBattle.ts` (API, fazy deploy/manual/AUTO, hooki DOM, luki rozkazów vs §5a Total War).
- [i] `battleScene`: `deploy:true` + `_manualMode` (R) + roster 3 grupy — częściowo pod D5=B; brak kursorów łuk/miecz, hold, ranged/shoot toggle (czeka mockup UI).

### D10=A — Katapulta=Żelazo (weryfikacja vs siege)
- [x] **units.json epoki ZGODNE z D10=A:**
  - Taran: Epoka **Kamień**, in-siege (Uwagi: „budowana podczas oblężenia").
  - Wieża oblężnicza: Epoka **Brąz**, in-siege (Uwagi OK).
  - Katapulta: Epoka **Żelazo**, `Dostępna w epokach: Żelazo`.
- [x] **buildings.json:** `warsztat_oblezniczy` epokaWejscia=**3 (Żelazo)** — spójne z Katapultą=warsztat.
- [x] **siege.ts:** czysta matematyka garnizonu/murów — **nie** koduje budowy machin (OK; reguły w kontraktach + dane).
- [x] **battleScene.ts:** taktyka oblężenia OK (Taran→brama, Katapulta→mur z dystansu) — niezależne od epoki budowy.
- [!] **ROZBIEŻNOŚĆ danych (CYWILIZACJE):** Katapulta `Uwagi` nadal mówi „budowana podczas oblężenia (1 tura)" — powinno: **Warsztat obleżniczy w mieście** (`maWarsztatOblezniczy`), dołączana do armii przed oblężeniem. Taran/Wieża = kolejka 1/turę in-siege (bez warsztatu).
- [!] **buildings.json uwagi** (l.712): wymienia wszystkie 3 machiny — korekta copy: warsztat = **tylko Katapulta**.

### Testy
- [!] `node tools/combat-test.cjs` + `node tools/battle-smoke.cjs` — **NIE URUCHOMIONE** (shell Cursor: `node` not in PATH). Ostatni zielony QA lane: 2026-06-25 (combat 6/6, logic 163/163). **MASTER:** uruchomić lokalnie przed kanonem.

### Handoffy
- [>] `_handoff/UNITS-do-UI_battle-ux-constraints.md` — GOTOWE dla UI lane.
- [i] Istniejące: `_handoff/UNITS-do-MASTER_UX-bitwa.md`, kontrakty multi + start oblężenia — bez zmian.

### Notatka CYWILIZACJE (units.json D10=A)
1. Katapulta: potwierdzić Epoka=Żelazo (już OK); poprawić **Uwagi** → warsztat, nie in-siege.
2. Opcjonalnie pole prereq w danych: `"Wymaga budynku": "warsztat_oblezniczy"` (Taran/Wieża = puste/„in-siege").
3. `tech.json` Oblężnictwo: powiązać z Katapultą + warsztatem (Żelazo).
4. `buildings.json` uwagi warsztatu: tylko Katapulta (nie Taran/Wieża).
5. Jednostki.xlsx: zsynchronizować epokę + kolumnę budowy (warsztat vs oblężenie).

LAST-PROCESSED: 2026-06-26 Sprint 1 — UX constraints + D10 verify

---
## 2026-06-26 — UNITS: D5=B implementacja Q2–Q7 (battleScene)

**Decyzja Macieja:** D5=B (Total War: Pharaoh). Spec: `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md`.

### Pliki
- [x] `gra/src/battle/battleScene.ts` (+ backup `.bak-UNITS`)
- [x] `gra/src/battle/battleMinimap.ts` (NOWY — renderer + typy minimapy)

### Q2 — Minimapa
- [x] `getBattleMinimapData()` public API → `{ cols, rows, terrain[], units[{q,r,color}], viewport }`
- [x] Canvas 180×120 px, lewy-dolny róg (nad rosterem)
- [x] Teren + kropki jednostek (frakcje #c84040 / #4090c8)
- [x] Biały prostokąt viewport; klik = skok kamery; drag = pan

### Q3 — Tooltip + panel
- [x] Hover tooltip 0.3 s: nazwa, typ (Frontalne/Dystans/Mounted), HP, morale, atk/obr
- [x] Prawy panel rozkazów 220 px (szkielet: Wycofaj, Stoj, Kituj/Strzal dla ranged) — istniejący `_selPanel` + motyw Q6

### Q4 — Górny pasek
- [x] Faza: Deployment / Przygotowanie / Bitwa — tura N
- [x] Prędkość ×N w pasku
- [x] Morale armii ×2 (paski)
- [x] Straty: zabici/uciekli/pozostali per strona
- [x] Badge ‖ PAUZA (skrót P)
- [x] Prawy róg: Pomiń → wynik + Wyjście

### Q6 — Styl
- [x] Motyw ciemny+złoto: `rgba(12,18,35,0.92)`, `#e8d88a`, `#d4cba0`, frakcje ATK/DEF z handoffu
- [x] Segoe UI / Tahoma w HUD bitwy

### Q7 — Sterowanie
- [x] Skróty S (cykl 1→512), P, H, M — bez zmian logiki
- [x] Dolny pasek ikon z legendami skrótów (S/P/H/M + Pauza, Pomiń, Wyjście)

### Odroczone / poza zakresem UNITS (D5=B)
- [ ] Q5 preBattle layout 2 kolumny — lane **UI** (`preBattle.ts`), bez zmiany API
- [ ] Kursor łuk/miecz, linie rozkazów billboards — §5a, wymaga dalszej iteracji manual mode
- [ ] Reuse `minimapHud.ts` wspólnego renderera — v1.1 UI (lokalny canvas w battleScene OK na v1.0)
- [ ] Ctrl+M scalanie rannych w rosterze — model armii, nie w tym batchu

### Testy
- [!] `node tools/battle-smoke.cjs` + `node tools/combat-test.cjs` — **NIE URUCHOMIONE** w shellu subagenta (brak output `node`). **MASTER/Maciej:** uruchomić lokalnie przed kanonem; `npx tsc --noEmit` zalecane.

### Do MASTER
- [>] Moduł gotowy w lane UNITS; **wpiecie do kanonu** = batch SILNIK (main.ts bez zmian w tym kroku).
- [i] Q5 meldunek UI → append `UI-DO-MASTERA.md` po stronie UI lane (preBattle layout).

---

## [2026-06-26] C2-Q7=A + efekty TW v1.0 (Grupa C)

Decyzja Macieja: **C2-Q2…Q6=A**, **C2-Q7=A** + wdrożyć efekty TW (nie odkładać).

### Zrobione (`battleScene.ts`)
- [x] Kursor kontekstowy: **łuk** (atak dystansowy) / **miecz** (wręcz) / crosshair (ruch)
- [x] Linie rozkazów na ziemi: **żółta** = ruch, **czerwona** = atak (podgląd + po wydaniu rozkazu, fade ~4.5 s)
- [x] **Scalanie rannych:** Ctrl+M (2 zaznaczone, ten sam typ) + drag karty roster → karta
- [x] Backup: `battleScene.ts.bak-UNITS-20260626-twfx`

### Testy
- [!] `node tools/battle-smoke.cjs` — uruchomić lokalnie (sandbox bez node)

→ **SILNIK: GOTOWE DO WPIĘCIA** (C2 zamknięte; kanon bitwy po PASS)

---

## [2026-06-26] C1 — preBattle TW → SILNIK (decyzje zamknięte)

Grupa C: `preBattle.ts` GOTOWE · C1-Q1…Q5 zamknięte (`C1-wejscie-walke.md`).  
SILNIK dokańcza `main.ts`: Q4 multi-unit (kontrakt `UNITS-do-MASTER_kontrakt-walka-multi.md`), Q2b opts.  
Handoff: `C1-do-SILNIK_batch-test.md` → test → Master → kanon.

→ **SILNIK/Grupa F:** wpięcie + bramka (nie pytaj Macieja o C1-Q2b…Q5)

---

## [2026-06-27] UN-P1-01 — C3-Q2 AI oblężenie 3 poziomy (pure logic)

Decyzja Macieja **C3-Q2=custom:** silna→szturm, średnia→machiny, słaba→głodzenie.

### Zrobione
- [x] `gra/src/game/siegeAi.ts` — `decideAISiegeStance()`, `evaluateSiegeAiAction()` (alias)
- [x] Progi: T1≥180%, T2 140–180%, T3 110–140%, unsafe<110%
- [x] T2: `siege_build` → `assault` gdy `machinesReady≥1` lub timeout 5 tur
- [x] T3: `siege_starve` — nigdy preBattle
- [x] C3-Q8 hint: `machinesPerTurn` = 1 + floor(armyCount/10)
- [x] Testy: `gra/tools/siege-ai-test.cjs`
- [x] Handoff: `dyspozycje/_handoff/UNITS-do-SILNIK_AI-siege-3poziomy.md`

### Testy
- [!] `node tools/siege-ai-test.cjs` — **NIE URUCHOMIONE** w shellu (brak `node` w PATH); **MASTER/Maciej:** uruchomić lokalnie przed wpięciem F

→ **SILNIK: GOTOWE** (UN-P1-01 · wpięcie main.ts = Grupa F)

---

## [2026-06-27] P0 Grupa D — D4-Q3=A: bonusy walki bitwa 3D + jednostki spec.

**Flaga:** → **SILNIK: GOTOWE** (wpięcie `attackerCivBonusy`/`defenderCivBonusy` w main.ts = Grupa F)

### Zrobione

| AC | Plik | Status |
|----|------|--------|
| 1 | `gra/src/battle/battleScene.ts` | `_singleBlow` + `computeInstantResult` → `civCombatStatMultipliers` z `isChargeRound` w rundzie szarży; opts `attackerCivBonusy`/`defenderCivBonusy` |
| 2 | `gra/src/battle/manualBattle.ts` | `resolveCombat` z `attackerCivBonusy`/`defenderCivBonusy` |
| 3 | `gra/src/game/production.ts` | Filtr `jednostka_specjalna` z `bonusy[]` — spec. zamiast bazowej (np. Grecy: Falanga zamiast Włócznik) |
| 4 | Backup | `*.bak-UNITS-2026-06-27` (battleScene, manualBattle, production) |

### Testy

- **combat-test.cjs:** PASS (6/6)
- **battle-smoke.cjs:** PASS (BATTLE SMOKE OK)

### Do Grupy F / SILNIK

- Przekazać `attackerCivBonusy` / `defenderCivBonusy` do `BattleScene` i `ManualBattleScene` z `civBonusyForOwnerId` (wzór już w main.ts auto-resolve mapy).
- `getCivBonusy` w cityPanel → `availableProduction` już obsługuje spec. jednostki gdy `ctx.civBonusy` ustawione.

**NIE edytowano `main.ts`.**
