# DYSPOZYCJE SESJI — pelny wsad do rozdania (The Game / projekt Civ)

Jak uzywac (Maciej): kazda sekcja "SESJA: X" jest samowystarczalna. Wklejasz CALA sekcje
(razem z blokiem "WSPOLNY START" na gorze) w nowy task. Agent czyta wskazane pliki MD,
poznaje projekt, zna swoj lane i pierwsze dzialanie. Potem wracasz do mnie (master) z tym,
co dany task zrobil — ja recenzuje i wydaje kolejna dyspozycje "do nazwy sesji".

Nazwy sesji (uzywaj ich w rozmowie): SILNIK, BITWA, RENDER-MAPA, DANE-CYW, LOGIKA-NOWE.

====================================================================
# WSPOLNY START — to czyta KAZDA sesja, ZANIM cokolwiek zmieni
====================================================================
Projekt "The Game": gra 4X w stylu Cywilizacji. Stack: HTML + TypeScript + Three.js (Vite,
single-file build do dwukliku). Mapa heksowa, modele low-poly w stylu Roblox.

FOLDERY:
- Dokumenty/specyfikacje: folder projektu "Civ" (ten, w ktorym jest ten plik).
- Kod gry: podfolder "gra" (Vite+TS).
- Build: w folderze gra -> `npm run build` (tworzy single-file gra/dist/index.html).
- Testy: `node tools/smoke.cjs dist/index.html`, `node tools/battle-smoke.cjs dist/index.html`,
  `node tools/logic-test.cjs`, `node tools/combat-test.cjs`.

PRZECZYTAJ NAJPIERW (w tej kolejnosci), zanim ruszysz kod:
1. PROJEKT-GRY-master.md  — pelna specyfikacja (ekonomia Praca->x10->x100, walka kanon par.5l,
   cywilizacje, zadowolenie=szczescie+porzadek, religia, miasta/budynki).
2. ARCHITEKTURA-PLIKI.md  — spis plikow + "Podzial pracy rownoleglej" (ktory plik czyj).
3. ORKIESTRACJA-ZADANIA.md — lane, zasady wspolpracy, sekcja "KTO CO ROBI TERAZ", "WERDYKT MASTERA".
4. BACKLOG-PELNY.md — pelna lista zadan A-H z DoD (kryteria odbioru) + przydzial agentow.
5. ZASADY-WSPOLPRACY.md — dodatkowe reguly projektu.
(Twoja sekcja nizej wskaze jeszcze 1-2 specy tematyczne do przeczytania.)

ZASADY ZELAZNE (wszyscy):
- main.ts oraz publikacja kanonu Gra-podglad.html = TYLKO sesja SILNIK. Inni NIE dotykaja main.ts.
- Edytuj wylacznie pliki swojego lane (sekcja nizej). Tworzyc NOWE czyste pliki game/*.ts wolno kazdemu.
- Po zmianie kodu: `npm run build` musi przejsc + odpalic odpowiednie testy node tools/*.cjs.
- NIE nadpisuj Gra-podglad.html (chyba ze jestes SILNIK). Efekt pokazuj w OSOBNYM podgladzie HTML
  (np. Gra-podglad-BITWA.html, Gra-podglad-MAPA.html).
- PULAPKA OneDrive: bash w piaskownicy bywa NIESWIEZY. Jak build padnie na "Unexpected end of file"
  (plik wyglada na ucięty) -> NAJPIERW sprawdz narzedziem Read (widok chmury). Jesli Read pokazuje
  plik CALY = to tylko nieswiezy mount, NIE sklejaj pliku z backupu (skasujesz najnowsza prace).
  Sklejaj tylko, gdy Read TEZ pokazuje uciecie. Duzo bledow tsc "Invalid character" w jednym pliku
  = dehydratacja (bajty NUL), tez nie ruszac.
- Kod ASCII (polskie znaki przez \uXXXX albo komentarze ASCII). Po edycji duzego pliku ZAWSZE build.
- Na koniec zdaj raport: co zmienione, gdzie, wyniki testow (tsc/build/smoke), co zostaje.

====================================================================
# SESJA: SILNIK   (integrator / pętla tury / kanon)
====================================================================
LANE (Twoje pliki): src/main.ts + WPINANIE modulow z src/game/* + JEDYNY publisher Gra-podglad.html.
Dodatkowo przeczytaj: Spec-ekonomia.md, Schemat-dzialania-miasta.md, Spec-AI.md.
CEL: wlaczyc gotowe (juz napisane) moduly logiki do petli tury, zeby gra ich realnie uzywala,
i po kazdej fali wydac jeden swiezy kanon Gra-podglad.html.

JUZ ZROBIONE (wpiete i dziala): mapa+ruch+mgla+miasta; ekonomia miasta (turn-economy: plony/wzrost/
zywnosc); playerState (skarbiec/nauka/auto-badania/epoka + HUD); walka (combat par.5l) + bitwa pod "T"
+ facing + B6 (amunicja 2 pila->miecz + pilum); panel miasta podstawowy; preBattle.

GOTOWE MODULY CZEKAJACE NA TWOJE WPIECIE (sa na dysku w src/game, NIE trzeba ich pisac):
production.ts, victory.ts, save.ts, ai.ts, diplomacy.ts, siege.ts, culture-religion.ts, order.ts.
(research.ts i player-economy.ts = ORPHAN-DUBLE wzgledem playerState — NIE wpinac, do usuniecia.)

DO ZROBIENIA (po kolei, po KAZDYM: build + testy + nowy kanon):
1. KONSOLIDACJA: przebuduj i opublikuj Gra-podglad.html z aktualnego src (wciagnie najnowsze
   wizualia jednostek od RENDER + rozroznienie jednostek na mapie, gdy RENDER je dostarczy).
   NIE ruszaj units.ts ani render/* (lane RENDER) -- Ty tylko build + publikacja kanonu.
   [SPROSTOWANIE: rozroznienie jednostek na mapie to NIE main.ts, tylko 1 zmiana w render/units.ts
    -> robi RENDER-MAPA; Ty potem tylko przebuduj.]
2. A1+A4 ekonomia: wepnij game/production.ts (kolejka produkcji w miescie, postep wg Pracy,
   ukonczenie dodaje jednostke/budynek) + budowa/ulepszenie budynkow.
3. C1+C2 AI: wepnij game/ai.ts (po turze gracza rywale: ruch/zakladanie/atak/budowa) + game/victory.ts
   (sprawdzanie zwyciestwa co ture: dominacja typu + nauka, + ekran konca gry).
4. B1+B3 walka z mapy: atak jednostka na wroga w zasiegu -> preBattle -> auto/pole -> wynik na mape
   (usun/ran/zdobadz); wepnij game/siege.ts (atak na miasto: mury, zdobycie).
5. D1+D4+D3 spoleczenstwo: wepnij game/diplomacy.ts (+panel), game/order.ts (Porzadek, progi T1/T2
   w panelu miasta), game/culture-religion.ts (granice/zadowolenie/konwersja przez swiatynie).
   UWAGA: order.ts ma blad testu "loadOrderParams scales by difficulty" — napraw przed wpieciem.
6. E1 save: wepnij game/save.ts (zbierz stan units/cities/tura/fog/skarbiec -> zapis/odczyt + sloty).
7. (M6) menu glowne + HUD w grze (makiety gotowe: Makieta-HUD..., Makieta-flow-nowa-gra).

PIERWSZE DZIALANIE: punkt 1 (konsolidacja kanonu + rozroznienie jednostek na mapie). Szczegoly DoD
masz w BACKLOG-PELNY.md (bloki A,B,C,D,E).
CZEGO NIE RUSZAC: render/* (RENDER), battle/* wewnetrznie (BITWA), Excel (DANE). Ty tylko WPINASZ.
DoD kazdego kroku: build OK + smoke + battle-smoke + logic + combat zielone + funkcja realnie dziala;
po fali jeden swiezy Gra-podglad.html (pelna bramka).

====================================================================
# SESJA: BITWA   (modul bitew / pole walki)
====================================================================
LANE: src/battle/battleScene.ts + src/battle/facing.ts + src/battle/manualBattle.ts.
(units.ts tylko CZYTASZ — modele jednostek — NIE piszesz w nim.)
Dodatkowo przeczytaj: Macierz-walki-analiza.md + par.5l w PROJEKT-GRY-master.md + BACKLOG sekcja B (B7).
CEL: dopracowac pole walki i facing.

JUZ ZROBIONE: bitwa testowa pod "T" (Legionista vs Falanga), tura-po-turze (1 akcja/jedn., wszyscy
naraz), facing na heksach (B4), B6 amunicja (2 pila -> miecz) + pilum. manualBattle.ts gotowy, niewpiety.

DO ZROBIENIA:
1. B7 — POLE NA KWADRATY + facing (decyzja Maciej, ZASTEPUJE heksowy B4):
   - siatka kwadratowa NxM (plaskie kafle), ruch 4-kierunkowy (N/E/S/W), dystans Manhattan;
   - facing=4 strony: front ku wrogowi, tyl naprzeciw, lewa/prawa=flanki;
   - przy ataku jednostka OBRACA SIE frontem do bitego kafla; obronca ZACHOWUJE swoj front ->
     atak z boku/tylu -> combat.ts dolicza kary par.5l (juz istnieja);
   - ustawienie: obie armie w czystych KOLUMNACH naprzeciw (wyrazna linia frontu);
   - ZACHOWAJ B6 bez zmian (canShoot/ammoLeft/rangedBase + pilum — logika grid-agnostyczna,
     podmieniasz tylko dystans/zasieg na kwadratowy).
   - Mapa swiata zostaje HEKSOWA — zmienia sie TYLKO pole bitwy.
   - Zbuduj do OSOBNEGO Gra-podglad-BITWA.html (NIE kanon), do oceny pod "T".
2. (pozniej) doszlif wizualny bitwy wg uwag mastera/Maciej.

PIERWSZE DZIALANIE: B7 (pelna dyspozycja w BACKLOG-PELNY.md, sekcja "B7"). Najpierw WCZYTAJ aktualny
battleScene.ts (ma juz B6) — masz to zachowac.
CZEGO NIE RUSZAC: main.ts (wpiecie walki-z-mapy/manual robi SILNIK), combat.ts, mapa swiata.
DoD: kafle przylegaja; armie w linii; jednostka obraca sie do bitego; atak z boku/tylu nalicza
kare par.5l; Legionista dalej 2 pila->miecz; build + battle-smoke zielone; osobny podglad HTML.

====================================================================
# SESJA: RENDER-MAPA   (wizual mapy i jednostek)
====================================================================
LANE: src/render/scene.ts + src/render/units.ts + src/render/cities.ts + src/map/*. Galerie HTML.
Dodatkowo przeczytaj: Spec-generator-mapy.md + sekcja jednostek/stylu w PROJEKT-GRY-master.md.
CEL: wyglad mapy i jednostek ku Civ VI.

JUZ ZROBIONE: heksy przylegaja, paleta terenu, mgla; modele Roblox; zatapianie na wzgorzach
naprawione; konne frontem; zywsze kolory per kultura; 7 super-jednostek rozroznionych; helmy na
jednostkach wrecz; Legionista galea; Galeria-jednostek-4widoki.html; E1 generator (gen-helpers)
zrefaktoryzowany (wynik identyczny).

DO ZROBIENIA:
1. F1 — MAPA KU CIV VI: rzeki na KRAWEDZIACH heksow (nie przez srodek, laczone w wierzcholkach;
   dane w map.riverPaths), bogatsze biomy + miekkie przejscia kolorow + cieniowanie, ramka swiata.
   Geometrie heksow ZOSTAW (pointy-top, ZERO rotateY — inaczej rozjedzie tiling). Osobny podglad HTML.
2. ROZROZNIENIE JEDNOSTEK NA MAPIE (drobne, priorytet): w UnitRenderer.sync (render/units.ts)
   przekaz unit.typeId jako 3. argument: buildUnitModel(category, ownerColor, unit.typeId).
   Mechanika roznicowania (super + kultura) JUZ jest w buildUnitModel -- brakuje tylko podania nazwy
   w sciezce MAPY (teraz sync wola bez nazwy). main.ts NIE wymaga zmian (RuntimeUnit niesie typeId).
   Efekt: jednostki na mapie roznia sie jak w galerii. Potem zglos SILNIKowi do przebudowy kanonu.
3. F2 — dalszy re-render jednostek wg uwag z galerii (po feedbacku Maciej).

PIERWSZE DZIALANIE: F1 (DoD w BACKLOG-PELNY.md sekcja F).
CZEGO NIE RUSZAC: main.ts, battle/* (BITWA), game/* logika. NIE nadpisuj kanonu.
DoD: heksy przylegaja (bez szczelin), rzeki po krawedziach i laczone, biomy czytelne, build+smoke OK,
osobny podglad HTML do oceny.

====================================================================
# SESJA: DANE-CYW   (cywilizacje / dane)
====================================================================
LANE: Cywilizacje.xlsx + TYLKO docelowy gra/data/civs.json. NIE odpalaj pelnego export-data.py
(przepisalby cudze JSON-y). Dodatkowo przeczytaj: sekcja cywilizacji w PROJEKT-GRY-master.md.
CEL: pelne 50 cywilizacji + religie.

JUZ ZROBIONE: civs.json istnieje, ale maly (~4,4 KB) = czesciowy (glowne cywilizacje + Egipt/Sumer/
Inka/Zulu itd.).
DO ZROBIENIA: D2 — uzupelnic do 50 cywilizacji (7 glownych typow + inicjalne) + religia kazdej
cywilizacji; re-eksport TYLKO civs.json; sprawdzic, ze loader.ts czyta bez bledu.

PIERWSZE DZIALANIE: przeczytaj sekcje cywilizacji w master + obecny civs.json, dopisz brakujace
do 50 + religie, re-eksportuj wylacznie civs.json.
CZEGO NIE RUSZAC: kod src/*, inne pliki JSON.
DoD: civs.json = 50 cyw. + religie; loader czyta bez bledu; zaden inny plik nie nadpisany.

====================================================================
# SESJA: LOGIKA-NOWE   (brakujace czyste moduly)
====================================================================
LANE: NOWE pliki src/game/*.ts (czyste: bez THREE/DOM, bez main.ts) + wlasny test w tools.
Dodatkowo przeczytaj: Spec-AI.md (barbarzyncy) + Spec-ekonomia.md (utrzymanie).
CEL: dopisac moduly logiki, ktorych jeszcze NIE MA (reszta modulow juz istnieje — nie pisz ich).

JUZ ISTNIEJE (NIE dotykac — czeka na wpiecie przez SILNIK): production, victory, save, ai, diplomacy,
siege, order, culture-religion, economy, turn-economy, playerState, combat, cities, visibility.

DO ZROBIENIA (kazdy = osobny plik, mozesz rozbic na 2 taski rownolegle):
1. C4  src/game/barbarians.ts — neutralni wrogowie/barbarzyncy: spawning (obozy), prosta agresja,
   ruch ku najblizszemu graczowi/miastu. API + test.
2. A3  src/game/upkeep.ts — magazyny zywnosci/surowcow + utrzymanie per budynek/jednostka.
   (Alternatywa: zdecydowac z masterem czy nie uzyc istniejacego player-economy.ts zamiast.)

PIERWSZE DZIALANIE: barbarians.ts (C4) — czysty modul + test; potem upkeep.ts (A3).
CZEGO NIE RUSZAC: main.ts, istniejace moduly, render, battle, Excel.
DoD: tsc=0 dla nowego pliku, wlasny test (N asercji), API czyste i udokumentowane; SILNIK wepnie pozniej.

====================================================================
# UWAGI KOORDYNACYJNE (dla Maciej + mastera)
====================================================================
- Rownolegle BEZPIECZNIE (rozne pliki): BITWA + RENDER-MAPA + DANE-CYW + LOGIKA-NOWE. SILNIK osobno (seryjnie main.ts).
- order.ts (D5) ma blad testu "loadOrderParams scales by difficulty" (logic 124/125) — SILNIK naprawia przed wpieciem D4/D6.
- Orphany research.ts + player-economy.ts = duble playerState -> do usuniecia (SILNIK, po potwierdzeniu).
- Sprzatanie dist-* + _sizetest.tmp: SPRZATANIE.ps1 — uruchom lokalnie (OneDrive blokuje tutaj).
- Kanon Gra-podglad.html publikuje TYLKO SILNIK. Reszta = osobne podglady HTML.
- Master (sesja nadrzedna) NIE koduje — recenzuje kazda dostawe wg DoD i wydaje kolejne dyspozycje.

====================================================================
## AKTUALNE SESJE I LANE (stan 2026-06-22 — NADPISUJE wczesniejszy podzial)
====================================================================
4 sesje Civ otwarte:
- **Civilization-master** = MASTER (ja): koordynacja + recenzja, NIE koduje.
- **Civ silnik** = SILNIK: src/main.ts + wpinanie game/* + JEDYNY publisher Gra-podglad.html.
- **Civilization Units** = UNITS+BITWA: src/render/units.ts (modele, kolory, helmy, F2)
  + src/battle/* (B7 kwadraty, facing, wizual bitwy). *** JEDYNY wlasciciel units.ts. ***
- **Civilization RENDER-MAPA** = MAPA: src/render/scene.ts + src/map/* + src/render/cities.ts
  (F1: rzeki na krawedziach, biomy, ramka). NIE units.ts, NIE battle.

REGULY:
- units.ts ma JEDNEGO wlasciciela = Civilization Units. RENDER-MAPA NIE rusza units.ts.
- Rozroznienie jednostek na mapie (1 linia: buildUnitModel(category, ownerColor, unit.typeId)
  w UnitRenderer.sync, render/units.ts) robi *** Civilization UNITS ***, nie RENDER-MAPA.
- battle/* nalezy do Civilization Units (B7), nie do RENDER-MAPA.
- main.ts + kanon = tylko Civ silnik.

JESZCZE NIEOTWARTE (otworz w razie potrzeby):
- DANE-CYW: Cywilizacje.xlsx -> civs.json (D2: 50 cyw. + religie).
- LOGIKA-NOWE: nowe game/barbarians.ts (C4) + game/upkeep.ts (A3).

====================================================================
## USTALENIA z investigacji SILNIK (2026-06-22 wieczor)
1. TRWALY CURE na ucinanie plikow (OneDrive dehydratacja): w Windows ustaw CALY folder Civ
   na "Zawsze zachowuj na tym urzadzeniu" (Always keep on this device) -> zielony ptaszek na wszystkim.
   Eliminuje ucinanie w sandboxie dla WSZYSTKICH sesji na stale. Robic raz.
2. BUILD: NIGDY `npm run build`. Odpala felerny prebuild = export-data.py (zaszyta obca sciezka
   /sessions/.../ + regeneruje WSZYSTKIE JSON-y incl. civs.json -> kasuje prace DANE-CYW i moze paść).
   Buduj zawsze: `npx vite build` (pomija prebuild).
3. FIX-REPO (maly task do przydzialu): export-data.py ma zaszyta absolutna sciezke sandboxa
   -> zrobic relatywna; build nie powinien regenerowac cudzych JSON. Niski priorytet, ale do zrobienia.
4. typeId-line (rozroznienie jednostek na mapie) = robi *** Civilization UNITS *** (wlasciciel units.ts),
   NIE SILNIK. Konkret: UnitRenderer.sync, linie ~3461 i ~3477 -> buildUnitModel(category, ownerColor, unit.typeId).
   typeId potwierdzony w RuntimeUnit (l.46). SILNIK tylko przebudowuje + publikuje po fakcie.
5. SILNIK po hydracji: OD RAZU konsolidacyjny `npx vite build` + publish (wciagnie helmy/kolory/super
   od UNITS, ktorych nie ma w kanonie 11:17). NIE czekac na typeId-line; ta wejdzie kolejnym buildem.
