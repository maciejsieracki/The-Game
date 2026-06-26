# BACKLOG PELNY — wszystko co zostalo (do rozdania na subagentow)

Prowadzi MASTER (sesja nadrzedna). Master NIE implementuje — tylko recenzuje i ocenia
kazda dostawe wg "DoD" (Definition of Done) ponizej. Ty rozdajesz zadania sesjom.

## LANE (zeby sesje nie wchodzily sobie w pliki)
- **[SILNIK]** = jedyna sesja dotykajaca `main.ts` + wpinajaca moduly + PUBLIKUJACA kanon `Gra-podglad.html`. Wpiecia robi SERYJNIE (jeden edytor main.ts naraz).
- **[RENDER]** = `src/render/*` (units.ts/scene.ts/cities.ts) + `src/map/*`. Buduje do testow, NIE publikuje kanonu.
- **[LOGIC]** = NOWY czysty plik `src/game/*.ts` (bez THREE/DOM, bez main.ts). Moze ruszyc rownolegle wiele sesji (rozne pliki).
- **[DATA]** = przypisany `*.xlsx` + tylko jego docelowy JSON (NIE pelny export-data.py).
- **[UI]** = panele/DOM (`src/ui/*`) + drobne wpiecie — koordynacja z [SILNIK] o main.ts.

## DoD ogolne (kryteria odbioru = co sprawdza master)
- LOGIC: `tsc --noEmit` = 0 dla swojego pliku, wlasny test (N asercji), API czyste, pure.
- WPIECIE [SILNIK]: `npm run build` OK + `node tools/{smoke,battle-smoke,logic-test,combat-test}.cjs` zielone + funkcja realnie dziala.
- RENDER: build OK + screeny do oceny mastera (brak tonienia/clippingu, styl Roblox).
- DATA: tylko docelowy JSON re-eksport, loader czyta, nic nie peka.
- UWAGA OneDrive: po edycji units.ts/main.ts ZAWSZE `npm run build` (tsc nie lapie uciecia); duzo bledow tsc w 1 pliku = dehydratacja, czytaj Read, nie obcinaj.

====================================================================
## A. M2 — EKONOMIA / MIASTO (dokonczyc)
- **A1 [SILNIK]** Wpiac `production.ts` (kolejka) w miasto + ture: miasto buduje jedn./budynek za Prace, ukonczenie dodaje do gry.
  Pliki: main.ts + cities.ts. Zalezy: production.ts (gotowy na dysku). DoD: w grze widac postep i ukonczenie produkcji.
- **A2 [UI]** Panel miasta: realne plony (Praca/Pieniadz/Zywnosc/Nauka/Kultura) + wzrost + kolejka + lista budynkow + przyciski Buduj/Ulepsz.
  Pliki: ui/cityPanel.ts + drobne main.ts. Zalezy: A1. DoD: panel pokazuje liczby z silnika, klik buduje.
- **A3 [LOGIC]** `game/upkeep.ts`: magazyny zywnosci/surowcow + utrzymanie per budynek/jednostka (LUB decyzja: uzyc orphana player-economy.ts).
  DoD: funkcje czyste + test; master decyduje modul vs player-economy.
- **A4 [SILNIK]** Budowa/ulepszenie budynkow (poziom per epoka, wg buildings.json). Zalezy: A1. DoD: budynek wchodzi, plony rosna.
- **A5 [UI]** Licznik zasobow co ture — panel "Bilans" (#15). DoD: pasek pokazuje delty na ture.

## B. M3 — WALKA (dokonczyc)
- **B1 [SILNIK]** Walka z mapy: atak jednostka na wroga w zasiegu -> ekran przed-bitewny -> auto/pole -> wynik wraca na mape (usun/ran/zdobadz).
  Pliki: main.ts (uzywa combat.ts/preBattle/battleScene — gotowe). DoD: realny atak na mapie konczy sie wynikiem na mapie.
- **B2 [BATTLE]** Wpiac `manualBattle.ts`: przycisk "Sterowanie reczne" na ekranie przed-bitewnym. DoD: gracz steruje bitwa recznie.
- **B3 [SILNIK]** Wpiac `siege.ts`: atak na miasto z mapy (mury, bonus obrony, zdobycie, milicja). Zalezy: siege.ts (gotowy). DoD: miasto da sie zdobyc.
- **B4 [RENDER]** Bitwa: wskaznik kierunku (front) + potwierdzenie czystej linii formacji. Zalezy: review screenow przez mastera. DoD: widac front/flanke/tyl.
- **B5 [RENDER]** Bitwa: pociski jednostek dystansowych (lot pocisku) jesli brak. DoD: strzal widoczny.

## C. M4 — AI
- **C1 [SILNIK]** Wpiac `ai.ts`: po turze gracza rywale wykonuja decideAITurn (ruch/zakladanie/atak/budowa). DoD: rywale realnie graja.
- **C2 [SILNIK]** Wpiac `victory.ts`: sprawdzanie zwyciestwa co ture (dominacja typu + nauka) + ekran konca gry. Zalezy: victory.ts (gotowy). DoD: gra konczy sie zwyciestwem.
- **C3 [SILNIK+UI]** Nowa gra: ekran startu (makieta flow gotowa) -> parametry -> generacja swiata (generator gotowy) -> gra. DoD: pelny start nowej gry.
- **C4 [LOGIC]** `game/barbarians.ts`: neutralni wrogowie + spawning + prosta agresja. DoD: czysty modul + test.
- **C5 [SILNIK]** Wpiac barbarians w ture. Zalezy: C4, C1.

## D. M5 — DYPLOMACJA / CYWILIZACJE / SPOLECZENSTWO
- **D1 [SILNIK+UI]** Wpiac `diplomacy.ts` (Relacja=Zaufanie+Respekt) + panel dyplomacji. Zalezy: diplomacy.ts (gotowy). DoD: panel + relacje zmieniaja sie.
- **D2 [DATA]** (W TOKU: Render) 50 cyw. + religie -> civs.json. DoD: loader czyta 50 cyw.
- **D3 [LOGIC]** (W TOKU: Render) `culture-religion.ts`: kultura (granice/zadowolenie) + konwersja przez swiatynie. DoD: modul + test.
- **D4 [SILNIK]** Wpiac culture-religion w ture (granice rosna, konwersja dziala). Zalezy: D3.
- **D5 [LOGIC]** (W TOKU: Render) `order.ts`: Porzadek = Szczescie + Prawo, progi T1 (gorzej pracuja)/T2 (bunt), garnizon=Prawo, budynki=Szczescie. DoD: modul + test.
- **D6 [SILNIK+UI]** Wpiac order + Zadowolenie w panelu miasta (progi, bunt). Zalezy: D5, A2.

## E. M6 — SAVE / MENU / HUD
- **E1 [SILNIK]** Wpiac `save.ts`: zebrac stan (units/cities/tura/fog/skarbiec) -> zapis/odczyt + sloty. Zalezy: save.ts (gotowy) + stabilny stan po falach wpiec. DoD: zapis i wczytanie dzialaja.
- **E2 [UI]** Menu glowne + ustawienia w grze (makieta gotowa). DoD: menu startowe + powrot.
- **E3 [UI]** HUD w grze: gorny pasek zasobow + minimapa + panele 1-12 (makieta HUD gotowa). DoD: HUD nad mapa.

## F. RENDER / WIZUAL
- **F1 [RENDER]** Mapa krok ku Civ VI: rzeki na krawedziach heksow, lepsze biomy/cieniowanie, ramka. DoD: screeny do oceny.
- **F2 [RENDER]** Re-render jednostek: poprawki wg uwag z Galeria-jednostek-4widoki.html (po review mastera). DoD: zaakceptowane wizualnie.
- **F3 [RENDER]** Bitwa: dopieszczenie wizualne (G2) wg uwag. DoD: screeny do oceny.

## G. HIGIENA / PORZADEK
- **G1 [SILNIK]** Dedup: usun orphan `research.ts` + `player-economy.ts` (po potwierdzeniu, ze playerState je pokrywa). DoD: build dalej zielony.
- **G2 [USER lokalnie]** Uruchom `SPRZATANIE.ps1` (dist-* + _sizetest.tmp).
- **G3 [SILNIK]** Po kazdej fali wpiec: JEDEN swiezy kanon Gra-podglad.html pelna bramka. Retire WIZUAL/RERENDER.

## H. M7 — PRZYSZLOSC (NIE teraz)
- Epoki 3-10 (Zelazo+), przejscia walut, ustroje, cuda, tryb RTS, backend/multiplayer. Rozbic pozniej.

====================================================================
## KOLEJNOSC / ROWNOLEGLOSC (rekomendacja mastera)
1. ROWNOLEGLE teraz (rozne pliki, zero kolizji): A3, C4, D3*, D5*, D2* (*=w toku Render), F1, B5.
2. [SILNIK] SERYJNIE (jeden main.ts naraz): A1->A4->C1->C2->B1->B3->D1->D4->D6->E1. Po grupie -> G3 (kanon).
3. [UI] po swojej logice: A2, A5, D6(UI), E2, E3, C3(UI).
4. RENDER ciaglym torem: F1,F2,F3,B4 (+ przekazuje units.ts tylko ta sesja).
5. Na koncu: G1 dedup, H (przyszlosc).

## CO ROBI MASTER (ja)
- NIC nie implementuje. Recenzuje kazda dostawe wg DoD: uruchamiam tsc/build/smoke/battle-smoke/logic, ogladam screeny renderu, oceniam balans, pilnuje 3 lane i 1 kanonu. Zglaszam pass/fail + poprawki.

====================================================================
## PRZYDZIAL NA AGENTOW (rekomendacja mastera) -- 4 robocze + master
Ograniczenie: rownoleglosc limituja PLIKI, nie liczba zadan. main.ts = JEDEN tor.

- AGENT 1 "SILNIK" (1, SERYJNIE main.ts+build+kanon): A1,A4 -> C1,C2 -> B1,B3 -> D1,D4,D6 -> C3,E1 + G1,G3.
- AGENT 2 "RENDER" (1, render/*+map+wizual bitwy): F1,F2,F3,B4,B5,B2 (+ D2 dane jesli trzyma).
- AGENT 3 "LOGIC-1" (1, nowe game/*.ts): A3 upkeep -> D3 culture-religion.
- AGENT 4 "LOGIC-2" (1, nowe game/*.ts): C4 barbarians -> D5 order.
- (opcjonalny AGENT 5 "UI": pliki ui/* A2,A5,E2,E3 -> SILNIK je wpina; tylko gdy SILNIK ma luz)
- MASTER (ja): tylko recenzja wg DoD.

Dlaczego nie wiecej: 2 agenty na main.ts = nadpisanie. Bezpiecznie rownolegle: 1 silnik + 1 render + N logic (rozne pliki) + dane.

====================================================================
## B6 [BATTLE] Amunicja (2 pila -> wrecz) + pilum zamiast kuli ognia  (zgloszenie Maciej)
Plik: src/battle/battleScene.ts (JEDEN agent, bo oba dotykaja tego pliku). NIE rusza main.ts/combat.ts.

(a) AMUNICJA — logika:
- Dodaj ammoLeft per BattleUnit = 'Ilosc pociskow' (gdy skonczona liczba). Pole jest juz czytane (l.228) ale nieuzywane.
- Atak dystansowy dozwolony TYLKO gdy ammoLeft>0; kazdy strzal -1.
- Gdy ammoLeft==0 -> jednostka przestaje byc ranged (isRanged=false): musi podejsc i bic WRECZ (melee Atak/gladius).
- 'Ilosc pociskow' null/puste = bez limitu (czysci lucznicy/procarze wg ich wartosci). Legionista=2 -> 2 pila, potem miecz.

(b) WIZUAL pocisku — pilum:
- Zamien swiecaca kule na PILUM: cienki dlugi drzewiec (walec, braz/drewno) + maly zelazny grot (szary stozek), obrocony wzdluz toru lotu (od atakujacego do celu). Bez emisji "fireball".

DoD (master sprawdzi pod 'T'): Legionista rzuca DOKLADNIE 2 pila, potem podchodzi i bije mieczem; pocisk wyglada jak wlocznia, nie kula ognia. tsc=0 + build + battle-smoke zielone.

====================================================================
## B7 [BATTLE] POLE BITWY NA KWADRATY (decyzja Maciej) -- ZASTEPUJE B4 (heks+facing)
Powod: na heksach nie widac linii frontu ani jednoznacznego boku. Kwadrat = 4 jednoznaczne strony.
WAZNE: zmienia sie TYLKO pole bitwy. Mapa swiata zostaje HEKSOWA (bez zmian).
Plik: src/battle/battleScene.ts + przepisany src/battle/facing.ts. NIE rusza main.ts / combat.ts / mapy.

ZAKRES:
- Siatka KWADRATOWA NxM (plaskie kafle Box zamiast heks-cylindrow). Wsp. (kol,wiersz): world_x=kol*S, world_z=wiersz*S.
- Sasiedztwo/ruch/zwarcie: 4-kierunkowe N/E/S/W (REKOMENDACJA; 8-kier. z przekatnymi = opcja, ale facing mniej czysty). Dystans=Manhattan; zasieg dystansowy w kaflach.
- FACING = 4 strony. Front=strona do wroga; tyl=naprzeciw; lewa+prawa=flanki.
  * Przy ATAKU jednostka OBRACA SIE frontem do atakowanego kafla (fix: "nie zawsze obraca sie frontem").
  * Obronca ZACHOWUJE facing -> atak z boku=flanka, z tylu=tyl -> sec.5l kary (Kara obrony z flanki/tylu %).
- Ustawienie: obie armie w czystych KOLUMNACH naprzeciw (atakujacy lewo front=E; obronca prawo front=W). Linia frontu=kolumna, wyrazna.
- BEZ ZMIAN: petla tury (1 akcja/jedn.), cios-za-cios, tempo, resolveCombat, amunicja B6.

DoD (master pod 'T'): kafle kwadratowe przylegaja; armie w wyraznej linii; jednostka obraca sie frontem do bitej; atak z boku/tylu nalicza kare sec.5l; tsc=0 + build + battle-smoke zielone.

>>> B6 + B7 = TEN SAM agent bitwy (oba ruszaja battleScene.ts -> jeden edytor naraz). Kolejnosc: B7 (siatka) potem B6 (amunicja+pilum), albo razem.
>>> B4 (heks+facing) ZASTAPIONE -- NIE realizowac.
