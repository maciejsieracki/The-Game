## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-UI**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/UI-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do UI-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-UI** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-UI).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/UI.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/UI-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-UI (interfejs / panele / HUD / menu)  [TASK DO OTWARCIA]
Lane: src/ui/*. Wpiecie do main.ts UZGADNIA z Civ-SILNIK. BUILD do osobnego podgladu. Kanal: UI-DO-MASTERA.md + czat.

## PLAN DZIALANIA
[ ] 1. Panel miasta: realne plony + kolejka produkcji + lista budynkow + przyciski Buduj/Ulepsz (dane od Civ-SILNIK).
[ ] 2. Licznik bilansu zasobow co ture (panel "Bilans").
[ ] 3. HUD w grze: pasek zasobow + minimapa + panele 1-12 (makieta Makieta-HUD).
[ ] 4. Menu glowne + ustawienia (makieta gotowa).
[ ] 5. Ekran nowej gry (flow startu -> parametry) -- UI czesc.
[ ] 6. Panel Zadowolenia/Porzadku (progi T1/T2, bunt).
(Gotowy element -> zglos Civ-SILNIK do wpiecia w main.ts.)

## DO ZROBIENIA TERAZ
Punkt 1.

## HISTORIA
- (nowy task)


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD: src/ui/*.
PANEL STEROWANIA: BRAK wspolczynnikow gry (UI = prezentacja). Ewentualne ustawienia interfejsu nie ida do Exceli-parametrow.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
Kontynuuj: kreator nowej gry (newGameFlow) + regula 'miasta rywali read-only' (ownerId!=0 -> ukryj Buduj/Ulepsz/Wykup/kolejke). Hooki cityPanel wpina master. Reszta standby na wpiecie.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] STATUS
Bez nowych decyzji. Kontynuuj: kreator nowej gry + read-only miast AI. Hooki cityPanel wpina master.


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

## [2026-06-24] OD MIASTO (przez master): kontrakt produkcji gotowy
MIASTO czeka na paczke zwrotna od Ciebie. Kontrakt: dyspozycje/_handoff/MIASTO-do-UI_kontrakt-produkcji.md (AKT 1+2). Addytywne API do cityPanel:
- poziomy compound: buildingLevelForEpoch / buildingEffectAtLevel ('Ulepsz' = gating po epoce; NIE liczcie 1,10^ sami),
- Wykup: rushCost / rushProduction,  - Wstrzymaj: setPaused + pole wstrzymana?,  - rekrutacja: populationCostOf.
Odczyt {kolejka, postep} bez zmian. Twoja paczka zwrotna (lista importow z production.ts + czego brakuje) -> handoff do mastera.


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

## [2026-06-24] OD MASTERA: odpowiedzi (konwencje/silnik)
1. prodMap (stan kolejek) -> OSOBNY modul game/productionState.ts, master go importuje do main.ts (nie pchaj do main.ts inline). Kontrakt uzgodnie przy wpieciu.
2. Model poziomow budynku przy "Ulepsz" -> COMPOUND/epokowy (decyzja MIASTO: buildingLevelForEpoch/buildingEffectAtLevel; 'Ulepsz' = gating po epoce). Porzuc 1->2 na sztywno.
3. Napisy polskie w kodzie UI -> literalny UTF-8 (jak main.ts). Zostaw jak masz.
4. Makiety wspolne (Widok-miasta/HUD/flow) -> mozesz przeniesc do Civ/UI/; file-map (ARCHITEKTURA-PLIKI) uzgodnimy pozniej, niski prio.


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

## [2026-06-24] OD MASTERA: odpowiedzi kontrakt produkcji (E.2-E.5)
- E.2 etaTurns: zostan przy lokalnym (niebloker); MIASTO wystawi eksport etaTurns przy okazji, wtedy podmienisz.
- E.3 wstrzymana: TAK — zapis gry (save.ts gdy wpiety) serializuje pole wstrzymana?:boolean. Potwierdzone.
- E.4 rushProduction vs onRushBuy: UI wola cfg.onRushBuy -> SILNIK realizuje (sprawdza skarbiec, wola rushProduction, konczy front). UI NIE wola rushProduction lokalnie. Jeden wlasciciel ukonczenia = silnik.
- E.5 nazwyPoziomow: to dane budynkow (MIASTO/buildings.json) — przekazuje MIASTO; do tego czasu uzyj nazwy bazowej + nr poziomu.

## [2026-06-24] DOMKNIECIE v0.1 — co Ci brakuje (od mastera). Rob przez Sonnet-subagenta.
1. [ROB, WYSOKI] HUD W GRZE: pasek zasobow (Pieniadz/Praca/nauka/kultura) + minimapa + panele. To realnie brakuje do grania (#36).
2. [ROB] Licznik BILANSU surowcow co ture (panel Bilans) (#15).
3. [ROB] Panel produkcji: sfinalizuj wg moich odpowiedzi E.2-E.5 (onRushBuy->silnik konczy, wstrzymana, etaTurns lokalnie).
4. [PRZYGOTUJ] Stub panelu DYPLOMACJI: panel relacji + etykiety statusu (5 tierow) — z propozycji Civ7; podlaczysz gdy CYWILIZACJE da dane.

## [2026-06-25] DECYZJE MACIEJA (przez master)
- 8B: WIOSKI USPIONE w v0.1 (miasta zakladane z trybu budowania/mapy). Nie rob wiosek -> usun/placeholder w widoku. Wrocimy w przyszlosci.
- 9A: NAGLOWEK miasta = WSZYSTKIE 3 akcje: Zarzadca automatyczny, Zmien nazwe, Widok artystyczny. Rob przyciski + wolaj callbacki. Logika: Zmien nazwe (proste, UI/silnik), Zarzadca automatyczny (auto-zarzadzanie = MIASTO/silnik), Widok artystyczny (widok miasta = MAPA/UI). Czego potrzebujesz od MIASTO/silnika -> handoff przez mastera.


## [2026-06-25] PYTANIE MASTERA (PILNE, odpisz w -DO-MASTERA): KOSZTY / SUBAGENCI
Czy na pewno ciezka robote (kod/build/testy) realizujesz przez SUBAGENTOW na SONECIE (tanszy),
czy nadal robisz wszystko w glownym oknie BEZ wywolania subagenta? Odpowiedz wprost: TAK-subagenci-Sonnet / NIE-glowne-okno.
Jesli NIE: od teraz OBOWIAZKOWO deleguj kod do subagenta na Sonecie. Palimy limit za szybko.

## [2026-06-25] DECYZJE MACIEJA -> UI (relay)
- 7A: HUD zaakceptowany; plaster EKONOMIA(miasto)+UI (splitPraca/kup-za-Pieniadz/gate terytorialny) wpina MASTER w batchu silnika. Po wpieciu dostosujesz cityPanel haczykami (bez nowego UX). Standby do sygnalu wpiecia.


## [2026-06-25] OBOWIAZEK: format pytan = ABC (polecenie Macieja)
KAZDE pytanie do mastera/Macieja zadawaj ZAWSZE w formacie ponumerowanym z opcjami:
1) <pytanie> -- A) ... B) ... (C) ...)  [oznacz rekomendacje]
2) <pytanie> -- A) ... B) ... (C) ...)
Najpierw ZNAJDZ kilka realnych rozwiazan/opcji, potem podaj jako 1 ABC / 2 ABC. Zero pytan otwartych, zero dowolnej formy. To OBOWIAZEK -- ujednolicamy obieg, bo kazdy pyta inaczej.

## [2026-06-25] DECYZJA -> UI: okno 'polacz armie' (relay Macieja)
3 (stacking): gdy jednostka/armia wchodzi na ZAJETY heks -> OKNO WYBORU: [Polacz armie] / [Nie lacz]. Po 'nie lacz' jednostki stoja osobno na tym samym heksie (moze byc ich duzo). Bez nowego rozbudowanego UX poza tym oknem. Stan/model merge trzyma UNITS; Ty pytasz i zwracasz wybor.

## [2026-06-25] DECYZJA -> UI: PANEL ZARZADZANIA ARMIA (wzorzec Total War)
Maciej: zbuduj UX laczenia/zarzadzania armiami po jednostkach. Najpierw MOCKUP panelu transferu do akceptacji Macieja, potem implementacja. Logike daje UNITS (kontrakt transfer/split/mergeWounded/remove).
- TRANSFER/LACZENIE ARMII: lewy klik na 1. armie -> prawy klik na 2. armie -> OKNO WYMIANY/TRANSFERU (dwie kolumny KART jednostek) -> DRAG&DROP kart miedzy armiami. Przeniesienie wszystkich -> 1. armia pusta.
- LACZENIE RANNYCH ODDZIALOW: klawisz M (auto-scal pasujace ranne) ; Ctrl+M na zaznaczonych ; drag karty na karte.
- PODZIAL ARMII: wydzielenie jednostek do nowej armii (drag na puste pole/mape).
- KARTA JEDNOSTKI: nazwa/typ/liczebnosc(HP)/staty. Slowniczek: Merge armies=laczenie armii, Merge units=laczenie oddzialow, Unit card=karta jednostki, Reinforcements=posilki.
- To rozszerza wczesniejsze okno #3 'polacz/nie lacz' w pelny panel transferu.

## [2026-06-25] UI: doprecyzowanie EKRANU WYMIANY (Maciej)
- EKRAN WYMIANY (Exchange/Transfer) po P-kliku na 2. armie: panel podzielony na DWIE POLOWY (lewy general | prawy general). Przenoszenie jednostki = KLIK na karte LUB drag karty z jednej polowy do drugiej.
- DOLNY PASEK = pojedyncze jednostki/oddzialy. Scalanie rannych: przeciagniecie karty rannego oddzialu na DRUGA TAKA SAMA karte (lub skrot M) -> scala zolnierzy w jeden pelny oddzial. Pokaz to na schemacie interfejsu armii.

## [2026-06-25] MASTER -> UI: PICKER BADAN (nauka sterowana graczem, decyzja 1a)
Nauka sterowana przez gracza: gracz wybiera CEL badan. Potrzebny prosty UI wyboru technologii do badania (lista/drzewko dostepnych: prereqi spelnione, nie-ukonczone) -> wola setPlayerResearchTarget(techId) (silnik wystawi). Pokaz postep: pula nauki vs koszt celu. Silnik ustawia domyslny cel (pierwsza dostepna), Ty pozwalasz zmienic. Uzyj istniejacego drzewka tech jesli prosto; inaczej mockup -> akceptacja.

## [2026-06-25] UI: HAKI nauki GOTOWE w silniku (uzyj tych nazw)
Silnik wystawil na window (podlacz picker badan do nich):
- window.__civ_setResearchTarget(techId) -> boolean (ustaw cel; waliduje prereqi/nieukonczona)
- window.__civ_getResearchState(naukaPerTurn?) -> {pula, targetId, kosztCelu, postepFraction, turnsLeft}
- window.__civ_getAvailableTechs() -> string[] (dostepne do wyboru)
Domyslny cel ustawia silnik (pierwsza dostepna); Ty pozwalasz zmienic + pokazujesz postep (pula vs koszt).

## [2026-06-25] MASTER -> UI: okolica — czytanie danych
Potwierdzony wariant B (jedno zrodlo prawdy: wspolny selektor stanu z EKONOMIA/SILNIK; nie dubluj hooków UI vs MAPA). Overlay v0.1 = A (tylko zaznaczone miasto). Render statyczny (range + pola obrabiane + linia granicy kultury) OK na v0.1.

## [2026-06-25] MASTER -> UI: picker badan WPIETY (live w kanonie)
sciencePicker.ts byl orphanem (poza buildem) -> silnik wpial go w main.ts + przycisk '🔬 Nauka' w HUD, podlaczony do hakow nauki. Nauka sterowana graczem dziala. Jakbys dopracowywal UX pickera — pracuj na sciencePicker.ts (juz w grafie kanonu).

## [2026-06-25] WLASNOSC STARTU: master ownuje, Wy = EKRANY (decyzja Macieja: A)
Ekran startu = MASTER (inicjalizacja). Wy: same ekrany (mainMenu/newGameFlow) — pickery, render, zwrot wyborow. Master sklada wybory w gre.

## [2026-06-26] MASTER WYKONAL (info): wpiete Wasze UI
- sciencePicker.ts: przepiete configureSciencePicker na NOWE API (getResearchState/getResearchedTechs/getAvailableTechs:string[]/onSelectTarget) + window.__civ_getResearchedTechs. Drzewko pokazuje ZBADANE. Blad TS2322 naprawiony.
- diplomacyPanel.ts: WPIETY (import + przycisk 'Dyplomacja' + notyfikacje zdarzen AI przez hint). Gracz widzi wojne/pokoj.
- HUD: rozszerzony tekstowy HUD o Praca + Kultura (pelny hud.ts wciaz NIE wpiety — jak chcesz pelny HUD z ikonami/minimapa, to nastepny krok; daj sygnal).
