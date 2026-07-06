## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-UNITS**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/UNITS-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do UNITS-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-UNITS** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-UNITS).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/UNITS.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/UNITS-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-UNITS (jednostki + bitwa)
Lane: src/render/units.ts + src/battle/*. JEDYNY wlasciciel units.ts. BUILD do osobnego podgladu (npx vite build). Kanal: UNITS-DO-MASTERA.md + czat.

## PLAN DZIALANIA
[x] 1. Linia typeId w UnitRenderer.sync (~3461/3477): buildUnitModel(category, ownerColor, unit.typeId) -- rozroznienie jednostek na mapie. Razem z pasem helmow (jeden dotyk units.ts). **GOTOWE 2026-06-29**
[x] 2. Dokoncz pas helmow (kazda jednostka wrecz ma widoczny helm; strzelcy moga bez). **GOTOWE 2026-06-29**
[>] 3. Zglos SILNIKOWI -> rebuild kanonu (wizualia wejda do gry). **→ INTEGRATOR: GOTOWE** — handoff `UNITS-do-INTEGRATOR_map-units-typeId-P1.md`
[ ] 4. Dopieszczenie bitwy wizualnie (po B7) wg uwag.
[ ] 5. (przyszle) Jednostki Celtow/Germanow wg spec od Civ-DANE.

## DO ZROBIENIA TERAZ

**[2026-06-29] C4-Q1=A balans macierzy — GOTOWE (→ SILNIK)**

| Stan | Notatka |
|------|---------|
| **C4-Q1** | **A** — macierz v2.0 w `units.json` (9 jednostek) + formuła v2 w `combat.ts` |
| **Testy** | combat 6/6 · battle-smoke OK |
| **Handoff** | `_handoff/UNITS-do-SILNIK_C4-balans-macierz.md` → **→ SILNIK: GOTOWE** |
| **C1/C2/C3** | W kanonie — nie dotykać |

**SILNIK:** wpięcie `Obrażenia` w `main.ts` + ROBOCZA.

---

**[2026-06-29] C4-Q1 balans macierzy — CZEKA ABC Macieja (ARCHIWUM — zamknięte A)**

**[2026-06-29] SILNIK = router** — manifest `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`. UNITS P1 (typeId/helmy) po P0 lane.

**[2026-06-27] P0 — Grupa D / D4-Q3=A: bonusy walki bitwa 3D + jednostki spec.**

**Status: GOTOWE** (2026-06-27) — combat 6/6, battle-smoke OK. Meldunek: `UNITS-DO-MASTERA.md`.

**→ SILNIK:** batch **D-P0-4** w `CYWILIZACJE-do-SILNIK_F-GRUPA-D-P0-integracja.md` (wiązanie bonusów w main.ts).

Handoff źródłowy: `dyspozycje/_handoff/CYWILIZACJE-do-UNITS_bonusy-walka-bitwa-jednostki-spec.md`

---

Punkt 1-2 (na zhydratowanym units.ts; jak bash pokaze uciety -> sprawdz Read, NIE sklejaj).

## HISTORIA
- B7 kwadraty + facing + B6 amunicja/pilum; kolory/super/galea.


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD: src/render/units.ts + src/battle/*.
PANEL STEROWANIA:
- Jednostki.xlsx -> units.json + counters.json + terrain-combat.json  (Atak/Obrona/HP/zasieg/countery/efekty terenu)
- Macierz-walki.xlsx -> (analiza) tu wpisuj wyniki/analizy balansu walki dla Maciej (kto kogo bije, ile rund)
REGULA: stroisz w Jednostki.xlsx -> targeted export units/counters/terrain-combat. Nie export-data.py.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
DECYZJE: nowe jednostki (Celtowie/Germanie itd.) = NA RAZIE TYLKO DANE; modele renderu POZNIEJ (po integracji rdzenia). Bitwa (Gra-podglad-BITWA.html) ZOSTAJE OSOBNO do v0.1 — scalimy z kanonem pozniej. Technika typowa: tournament do balansu starc.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJE MACIEJ: 9B + 10A
- 9B: nowe jednostki (Celtowie/Germanie itd.) — buduj MODELE RENDERU TERAZ (rownolegle), nie odkladaj (units.ts wg referencji; backup przed zmiana).
- 10A: bitwa SCALA sie z glownym kanonem. Przygotuj swoja czesc gotowa do wpiecia + handoff 'co i jak wpiac'; samo SCALENIE do kanonu robi master (silnik).


## [2026-06-24] KOREKTA MODELU: pytania -> do MACIEJ (w tym oknie)
Pytania zadajesz MACIEJ bezposrednio w TYM oknie (zwykly tekst). NIE kierujesz pytan do mastera.
Wczesniejsze reguly typu "pytaj mastera / dopisz pytanie do DO-MASTERA" SA NIEAKTUALNE dla PYTAN.
Master = tylko integracja/spinanie. Tylko gdy Maciej sam nie zna odpowiedzi, MACIEJ przekaze pytanie masterowi.
Do mastera nadal idą TYLKO: (1) RAPORT statusu (co zrobione / co nowego do wdrozenia), (2) HANDOFF gotowego modulu do wpiecia (+ instrukcja + DoD). Nie pytania projektowe.


## ROUTING — GDZIE CO (obowiazuje, zastepuje wczesniejsze reguly kierowania)
- PYTANIA (decyzje projektowe, watpliwosci, opcje) -> MACIEJ, w TYM oknie (zwykly czat). NIGDY do mastera. (Tylko gdy Maciej sam nie wie, Maciej przekaze masterowi.)
- RAPORT ZMIAN / POSTEPU (co zrobiles) -> MACIEJ, w TYM oknie (czat). Ty tu pracujesz z Maciej.
- GOTOWE DO WPIECIA (modul/dane do integracji w silnik/kanon) -> MASTER: plik dyspozycje/_handoff/<DZIAL>-do-MASTER_<temat>.md + KROTKI wpis w <LANE>-DO-MASTERA.md. Ten plik = TYLKO handoffy + status integracji, NIE pytania.
Master = integracja + sedzia + kanon. Nie rozstrzyga pytan projektowych dzialu.


## PROTOKOL ZAKLADKI (aktualny — zastepuje wczesniejsze reguly triggera/kierowania)

TRIGGER (re-czytanie): gdy Maciej napisze "SPRAWDZ" (lub "przeczytaj dyspozycje") -> przeczytaj swoj <LANE>.md od ostatniego znacznika: sekcje DO ZROBIENIA / nowe zadania / ZMIANY PRIORYTETOW. Wykonaj. (Brak auto-petli — ruszasz na trigger Macieja.)

ROUTING:
- Pytania o TWOJE zmiany / rozwojowe / decyzje projektowe -> MACIEJ, w tym oknie (czat).
- Chcesz cos skierowac do INNEJ zakladki/zadania -> przez MASTER: handoff dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md. NIGDY bezposrednio do innej zakladki.
- Gotowe do wpiecia / integracja w silnik -> MASTER: handoff + krotki wpis w <LANE>-DO-MASTERA.md.
MASTER = przepinanie miedzy zakladkami + spinanie w silnik + sedzia + kanon. Pytan projektowych dzialu NIE rozstrzyga.


## =========================================================
## ROUTING KOMUNIKACJI — WERSJA OSTATECZNA
## (ZASTEPUJE wszystkie wczesniejsze reguly kierowania w tym pliku)
## =========================================================
1. PYTANIA OGOLNE / PROJEKTOWE / DECYZJE (kierunek, co i jak, akceptacje, balans) -> MACIEJ, w TYM oknie (zwykly czat). Tylko Maciej decyduje o merytoryce.
2. PYTANIE LUB PROSBA DO INNEGO DZIALU (potrzebujesz czegos / odpowiedzi od innej zakladki) -> NIE pytasz jej wprost. Kierujesz do MASTERA: dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + krotki wpis w <LANE>-DO-MASTERA.md. MASTER rozdysponowuje do wlasciwego dzialu i odsyla odpowiedz.
3. SPIECIE / INTEGRACJA W SILNIK (modul gotowy do wpiecia, kanon, kontrakt wpiecia + DoD) -> MASTER (handoff + wpis <LANE>-DO-MASTERA.md). Master wpina, sedzia, kanon, i rozdziela dalej co trzeba.
4. RAPORT POSTEPU (co zrobiles) -> MACIEJ w oknie.

MASTER (silnik) = ROUTER miedzy dzialami + integracja w silnik + sedzia + kanon. Nigdy nie rozstrzyga pytan projektowych — te ida do Macieja.
TRIGGER: Maciej pisze "SPRAWDZ" (lub "przeczytaj dyspozycje") -> czytasz swoj <LANE>.md (nowe zadania + zmiany priorytetow) i dzialasz. Bez auto-petli.


## [2026-06-24] TRYB MODELU: SONNET (oszczednosc tokenow)
Pracuj DOMYSLNIE na Sonnecie. Wiekszosc Twojej roboty (wpinanie wg specow, implementacja, dane, testy, render) jest na Sonnecie w sam raz.
ESKALACJA: jesli trafisz na problem, ktorego NIE ogarniasz na Sonnecie (zbyt zlozone rozumowanie/architektura/balans), NIE bruteforce —
ZATRZYMAJ sie i napisz Maciejowi w czacie: "POTRZEBNY OPUS do: <co dokladnie>". Maciej przelaczy to okno na Opus na ten fragment, potem wracasz na Sonnet.


## [2026-06-24] TRYB WYKONANIA: PRACA PRZEZ SONNET-SUBAGENTOW (OBOWIAZEK)
Tego okna nie da sie przelaczyc na Sonnet, wiec: KAZDA istotna prace ZLECASZ SUBAGENTOWI na Sonnecie.
- Narzedzie Agent/Task z parametrem model: "sonnet". Subagent robi: implementacje, edycje wielu plikow, wiekszy research/analize, render, testy, budowanie.
- Sama sesja-dzial zostaje CHUDA: tylko (1) zbrief subagenta, (2) odbierz wynik, (3) zraportuj Maciejowi / zrob handoff do mastera. NIE rob ciezkiej roboty inline w tym oknie.
- Drobiazgi (1-2 linijki, szybka odpowiedz) mozesz inline. Wszystko wieksze -> Sonnet-subagent.
- Subagent ma trzymac sie Twoich regul (backup przed zmiana, testy, NIE publikuj kanonu, build do /tmp, NIGDY npm run build).
- ESKALACJA: jesli subagent na Sonnecie nie ogarnia (zbyt zlozone) -> zglos Maciejowi "POTRZEBNY OPUS do: <co>" i czekaj.

## [2026-06-24] DOMKNIECIE v0.1 — co Ci brakuje (od mastera). Rob przez Sonnet-subagenta.
1. [ROB, 9B] Nowe jednostki (Celtowie/Germanie itd.) — MODELE RENDERU w units.ts. Dokoncz.
2. [ROB, 10A] Bitwa -> KANON: przygotuj handoff "co i jak wpiac" battleScene do glownego kanonu; SCALENIE robi master.
3. [ROB] Jednostka NIESTRZELAJACA = tylko 2 paski (HP+morale) + obwodka na 2 paskach (decyzja Maciela). Ammo-bar tez dla pilum (legionista, znika po 2 rzutach).
4. [BLOK: Q2-Q7 Maciela] UX bitwy (tryb B sterowanie + faza deploymentu) — przygotuj czesc battleScene gotowa, czekaj na odpowiedzi UX.

## [2026-06-25] DECYZJE MACIEJA (przez master)
- 5A: bonus obrony FORTU wymaga OBOZOWANIA (jak posterunek).
- Bonusy obrony struktur (jednostki obozujace): mur miasta +200%, fort +100%, posterunek +50%. Twoj model: mnoznik na FINALNEJ Obronie, jeden budowlany bonus naraz (najwyzszy wygrywa). Wpiecie do walki/siege scala master.
- 4A: mur = flaga `maMur` (budynek „Mury" doda MIASTO); Ty konsumujesz +200% gdy maMur.

## [2026-06-25] DECYZJA MACIEJA (przez master): oblezenie wg epok
- TARAN = epoka KAMIENIA.
- Machiny oblezenicze (ogolne) = epoka BRAZU.
- KATAPULTA = epoka ZELAZA.
Zaktualizuj epoki tych jednostek w units.json + Jednostki.xlsx (Epoka / Dostepna w epokach). Reszta machin/balans wg poprzedniego handoffu oblezenia.


## [2026-06-25] PYTANIE MASTERA (PILNE, odpisz w -DO-MASTERA): KOSZTY / SUBAGENCI
Czy na pewno ciezka robote (kod/build/testy) realizujesz przez SUBAGENTOW na SONECIE (tanszy),
czy nadal robisz wszystko w glownym oknie BEZ wywolania subagenta? Odpowiedz wprost: TAK-subagenci-Sonnet / NIE-glowne-okno.
Jesli NIE: od teraz OBOWIAZKOWO deleguj kod do subagenta na Sonecie. Palimy limit za szybko.

## [2026-06-25] DECYZJE MACIEJA -> UNITS (relay)
- 10B: polish bitwy (UX Q2-Q7) + balans (Wlocznik/Falanga deadlock, Falanga 100%, super-jedn. tiery, slabe Impi/Galera) idziemy PO KOLEI. NIE rob hurtem. Master bedzie pytal Macieja pytanie po pytaniu i przekazywal decyzje. Na teraz: przygotuj te pytania zwiezle (1 ABC kazde) do mnie, zebym podawal Maciejowi pojedynczo. Reszta Twojej roboty (modele jednostek, oblezenie wg epok) leci normalnie.


## [2026-06-25] OBOWIAZEK: format pytan = ABC (polecenie Macieja)
KAZDE pytanie do mastera/Macieja zadawaj ZAWSZE w formacie ponumerowanym z opcjami:
1) <pytanie> -- A) ... B) ... (C) ...)  [oznacz rekomendacje]
2) <pytanie> -- A) ... B) ... (C) ...)
Najpierw ZNAJDZ kilka realnych rozwiazan/opcji, potem podaj jako 1 ABC / 2 ABC. Zero pytan otwartych, zero dowolnej formy. To OBOWIAZEK -- ujednolicamy obieg, bo kazdy pyta inaczej.

## [2026-06-25] GRANICA WLASNOSCI: UNITS startuje od PLANSZY WALKI (decyzja Macieja)
Twoj PUNKT STARTU = pojawienie sie planszy walki (ekran przed-bitewny: auto-rozegranie / przejscie na pole bitwy). Wszystko PRZED tym (ruch jednostek na mapie, pozycjonowanie, oblezenie-podejscie, tryb obozowania jako stan) = MAPA.
TWOJE (UNITS): ekran przed-bitewny + rozstrzygniecie walki (resolveCombat -- TU liczone bonusy obrony struktur) + taktyczna bitwa (mur/brama/machiny na polu bitwy, morale).
WEJSCIE od MAPA: kontekst walki (napastnik/obronca/teren/flagi obrony/pozycje). WYJSCIE do MAPA: wynik (kto wygral, straty).

## [2026-06-25] KOREKTA GRANICY (superseduje poprzedni wpis): OBLEZENIE = UNITS od startu
Doprecyzowanie Macieja: OBLEZENIE przechodzi do Ciebie JUZ w momencie rozpoczecia (nie dopiero plansza walki). To u Ciebie sie ustala. Dopoki jednostka tylko porusza sie po mapie = MAPA.
TWOJE (UNITS): oblezenie (od startu) + plansza walki/przed-bitwa + resolveCombat (bonusy obrony struktur) + taktyczna bitwa (mur/brama/machiny, morale).
WEJSCIE od MAPA: kontekst gdy zaczyna sie oblezenie/atak. WYJSCIE do MAPA: wynik (kto wygral, straty).

## [2026-06-25] MASTER -> UNITS: granica ruchu potwierdzona; spec przekazany MAPIE
Twoj podzial 'reguly vs wykonanie' przyjety (reguly=Ty; wykonanie=MAPA+SILNIK; bazowy koszt terenu=MAPA, Ty sie odwolujesz+modyfikatory). Spec _model-ruchu-mapa.md przekazany do MAPA do implementacji.
Twoje 4 otwarte decyzje (min.1 pole / zakres ZoC / stack-armia / zaokretowanie) ODDALEM Maciejowi jako ABC. Czekaj na decyzje, potem doprecyzujesz spec.

## [2026-06-25] DECYZJE MODELU RUCHU/ARMII -> UNITS (relay Macieja)
1C: min.1 pole — jednostka z resztka pkt ruchu zawsze wejdzie >=1 pole PRZEJEZDNE (koszt moze przekroczyc reszte pkt); WYJATEK: pola nieprzejezdne (gory/morze). [reguly Twoje, wykonanie MAPA]
2 (reakcja, BRAK ZoC): gdy GRACZ wejdzie obok wroga -> AI wroga wybiera BITWA albo ODWROT. Twoja czesc: rozegranie BITWY gdy AI wybierze walke. (trigger=MAPA, decyzja=CYWILIZACJE, odwrot=MAPA).
3 (stacking/armia): bez limitu jednostek na heksie; wejscie na zajety heks -> okno 'polacz/nie lacz' (UI). Twoja czesc: MODEL ARMII + MERGE (masz mechanike) + SKLAD BITWY ZBIOROWEJ: gdy heks atakowany LUB jedna jednostka z heksa atakuje -> do bitwy ida WSZYSTKIE jednostki z tego heksa. Zdefiniuj jak sklad heksa (N jednostek) wchodzi do przed-bitwy/resolveCombat.
4 (zaokretowanie) ROBOCZO A (do potwierdzenia Macieja): jednostki ladowe wchodza na morze PO wynalezieniu Zeglarstwa; zdefiniuj warunek(tech) + zmiane jednostki na morzu.
-> Doprecyzuj spec _model-ruchu-mapa.md o powyzsze i oddaj MAPA/SILNIK.

## [2026-06-25] DECYZJA -> UNITS: ZARZADZANIE ARMIA (model; wzorzec Total War)
Maciej: potrzebny model+UX laczenia/zarzadzania armiami PO JEDNOSTKACH (dodawanie, przenoszenie, usuwanie, dzielenie). Twoja czesc = MODEL/LOGIKA (panele robi UI), oddaj UI kontrakt operacji.
- ARMIA = zbior jednostek (kart). Operacje: TRANSFER jednostek miedzy armiami, PODZIAL armii (split), USUNIECIE jednostki, scalenie.
- TRANSFER: po wskazaniu armii A i armii B -> przeniesienie wybranych jednostek (drag&drop kart = UI; Ty: logika+walidacja). Przeniesienie WSZYSTKICH -> druga armia pusta (general sam/znika lub wraca do puli rekrutacji — ZDEFINIUJ).
- LACZENIE RANNYCH ODDZIALOW tego samego typu: dwa niepelne oddzialy tego samego typu -> jeden pelniejszy (sumowanie liczebnosci do maks., nadwyzka -> ZDEFINIUJ). Wyzwalacze (UI): M = auto-scal pasujace ranne; Ctrl+M na zaznaczonych; drag karty na karte.
- Spojnosc z #3: jednostki na 1 heksie moga byc osobnymi armiami LUB scalone; walka zbiorowa heksa bez zmian.
Kontrakt do UI: transfer(unit, armiaA->armiaB), split(armia,[jednostki])->nowaArmia, mergeWounded(typ), remove(unit). Stany kart: typ/liczebnosc(HP)/staty.

## [2026-06-25] DECYZJA -> UNITS: POSILKI = zasieg 1 heks (Maciej)
Rozstrzygniecie posilkow: gdy zaczyna sie bitwa (atakujacy vs broniacy), do bitwy MOGA wejsc WSZYSTKIE armie w odleglosci 1 HEKSA od ATAKUJACEGO (po stronie ataku) oraz wszystkie w odleglosci 1 HEKSA od BRONIACEGO (po stronie obrony). Plus (#3) wszystkie jednostki na samych heksach atak/obrona.
Twoja czesc — SKLAD BITWY:
  strona ATAK = jednostki heksa atak + armie sojusznicze <=1 heks od atakujacego
  strona OBRONA = jednostki heksa obrona + armie sojusznicze <=1 heks od broniacego
Sub-detal do zdefiniowania: posilki AUTO czy na wybor wlasciciela (rekom.: auto dla sojuszniczych gracza; AI wg heurystyki fight/flee #2). MAPA/SILNIK poda heksy w zasiegu 1; Ty komponujesz bitwe.

## [2026-06-25] MASTER -> UNITS: potrzebny KONTRAKT multi-unit combat (blokuje #3 + posilki)
Walka zbiorowa (#3: wszystkie jednostki z heksa) i posilki 1-heks nie da sie wpiac, bo dzis resolveCombat/preBattle = 1 vs 1. Zdefiniuj kontrakt walki GRUPOWEJ: strona ATAK = [jednostki], strona OBRONA = [jednostki] -> wynik (kto padl, straty per jednostka). Jak ma wygladac sklad/kolejnosc/agregacja w resolveCombat i co dostaje preBattle/scena bitwy. Po kontrakcie silnik wpina zbieranie skladu z heksa(+posilki).

## [2026-06-25] MASTER -> UNITS: kontrakt STARTU oblezenia (silnik gotowy na reszte)
Wpialem EKONOMIE oblezenia w ture: miasto oblegane -> dochod pol=0, magazyn -= (pop+garnizon), atrycja 8% garnizonu/ture, kapitulacja przy magazyn<=0. Brakuje STARTU — silnik nie wie KIEDY ustawic city.oblegane=true. Zdefiniuj kontrakt:
- WARUNEK STARTU oblezenia (wroga armia adjacent do miasta + akcja 'oblegaj'? auto gdy otoczone? jak inicjuje gracz/AI),
- HP GARNIZONU per jednostka (dzis garnizon=licznik; do procentowej atrycji i progu upadku 30-40% potrzebne HP),
- KOLEJKA MACHIN 1/ture (Taran/Wieza/Katapulta) + przejscie do SZTURMU,
- po kapitulacji: wskazanie atakujacego do captureCity (przejecie miasta).
Panel oblezenia = Ty/UI. Gdy oddasz start+HP+machiny -> silnik dopina w jednym batchu.

## [2026-06-25] ZAWIESZONE (Maciej): Zelazo + Robotnik
Maciej ZAWIESIL obie. ZAMROZ w obecnym stanie:
- ZELAZO: nie dorabiaj jednostek Zelaza; rename Hastati/Triari WSTRZYMANY (zostaje jak jest).
- ROBOTNIK: NIE usuwam odwolan Robotnika z main.ts/setup — Robotnik ZOSTAJE jak teraz (status quo), do odwieszenia. Nie wprowadzaj 'ulepszenia z mapy zamiast Robotnika' do czasu decyzji.
Czekamy na ODWIESZENIE przez Macieja.

## [2026-06-25] ODWOLANIE ZAMROZENIA (Maciej: nie zamrazamy)
Freeze Zelaza+Robotnika ANULOWANY. Status quo, decyzja wkrotce od Macieja.

## [2026-06-25] DECYZJA MACIEJA: machiny oblez. wymagaja Warsztatu oblezniczego
Taran, Katapulta, Wieza oblezicza = budowane TYLKO gdy miasto ma Warsztat oblezniczy. Podepnij `maWarsztatOblezniczy` (flaga od EKONOMII) jako PREREQ tych machin. Epoki machin bez zmian; uzgodnij z EKONOMIA od kiedy warsztat dostepny (ma pokrywac epoke danej machiny).

## [2026-06-25] KOREKTA (superseduje poprzednia): podzial machin oblez.
Maciej rozstrzygnal:
- KATAPULTA: budowana w miescie z Warsztatem oblezniczym (prereq maWarsztatOblezniczy; epoka Zelaza). Jedyna machina z warsztatu.
- TARAN + WIEZA OBLEZICZA: budowane PRZY OBLEZENIU miasta (in-siege, w ramach oblezenia — kolejka machin 1/ture w turze oblezenia), BEZ warsztatu, od swoich epok (Taran=Kamien, Wieza=Braz). NIE wymagaja maWarsztatOblezniczy.
Zdejmij maWarsztatOblezniczy z prereq Tarana/Wiezy (zostaw tylko na Katapulcie).

## [2026-06-25] KOREKTA epok machin (Maciej) — FINALNY podzial:
- TARAN: epoka KAMIEN, budowany PRZY OBLEZENIU (in-siege).
- WIEZA OBLEZICZA: epoka BRAZ, budowana PRZY OBLEZENIU (in-siege).
- KATAPULTA: epoka SREDNIOWIECZE (NIE Zelazo!), budowana w WARSZTACIE OBLEZNICZYM (dobudowywana do armii w miescie z warsztatem). POZA v0.1.
Dla v0.1 (Kamien+Braz): machiny = TYLKO Taran + Wieza, oba in-siege, bez warsztatu. Popraw epoke Katapulty w units.json (Zelazo->Sredniowiecze) i zdejmij ja z v0.1.

## [2026-06-25] DECYZJE MACIEJA: 1A Zelazo GO + 2A Robotnik USUNIETY
1A: Zelazo wchodzi. Dokoncz jednostki Zelaza + epoki w units.json (Hastati/Triari=Zelazo). Rename Legionista->Hastati w main.ts robi MASTER. Machiny wg korekty (Taran=Kamien/Wieza=Braz in-siege; Katapulta=Sredniowiecze).
2A: ROBOTNIK USUNIETY. Ulepszenia = AKCJA Z MAPY (jak zakladanie miast), bez jednostki. Zwiadowca ZOSTAJE. Twoje: usun Robotnika z units.json + SPEC akcji 'buduj ulepszenie z mapy' (typy ulepszen, koszt z puli Pracy, warunki) -> dla MAPA(front)+MASTER(akcja). Odwolania Robotnika w main.ts/setup usuwa MASTER (teraz).

## [2026-06-26] D5=B — IMPLEMENTACJA Q2–Q7 (Decyzje Maciej → Work)

**Spec:** `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` (zatwierdzone domyślne TW:Pharaoh).

**UNITS (battleScene.ts):**
- Q2: `getBattleMinimapData()` + canvas minimapa lewy-dolny róg
- Q3: hover tooltip 0.3s + panel boczny rozkazów (szkielet)
- Q4: górny pasek (faza, prędkość, morale×2, straty, pauza, pomiń)
- Q6: kolory ciemny+złoto z handoffu
- Q7: skróty S/P/H/M + ikony dolny pasek

**UI (preBattle.ts):** Q5 — layout 2 kolumny sił (bez zmiany API PreBattleInfo).

**Testy:** `node tools/battle-smoke.cjs`, `node tools/combat-test.cjs`. NIE main.ts.

**Meldunek:** append UNITS-DO-MASTERA + UI-DO-MASTERA.


**D5=B:** Przeczytaj `_handoff/UI-do-UNITS_ux-bitwy-q2-q7-totalwar.md` gdy UI dostarczy; uzupełnij techniczne uwagi UNITS (battleScene, preBattle, manualBattle).

**D10=A Katapulta=Żelazo:** Koordynuj z CYWILIZACJE — units.json epoka Katapulty = Zelazo (3). Taran=Kamien, Wieza=Braz in-siege bez zmian.

**Meldunek:** append `UNITS-DO-MASTERA.md`. NIE main.ts.

---

## [2026-06-27] § PILNE — kolejka Macieja

**Source of truth:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| ID | Zadanie | Status |
|----|---------|--------|
| **UN-P1-01** | C3-Q2 AI 3 poziomy oblężenia | **✅ GOTOWE** → `UNITS-do-SILNIK_AI-siege-3poziomy.md` |
| **UN-P1-02** | Milicja szturm kontrakt | **✅ GOTOWE** (SILNIK `collectSiegeDefRoster`) |
| **UN-P1-03** | Machiny bitwa 3D kontrakt | **GOTOWE** — czeka OBL-S5 w SILNIK |

**START:** czekaj na SIL-INT-3 (OBL-S5 machiny) lub `start` po meldunku SILNIK.
