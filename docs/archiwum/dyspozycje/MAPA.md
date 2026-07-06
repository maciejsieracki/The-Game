## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-MAPA**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/MAPA-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do MAPA-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-MAPA** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-MAPA).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/MAPA.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/MAPA-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-MAPA (mapa / teren / generator)
Lane: src/render/scene.ts + src/map/* + src/render/cities.ts. NIE units.ts, NIE battle. BUILD do osobnego podgladu. Kanal: MAPA-DO-MASTERA.md + czat.

## PLAN DZIALANIA
[ ] 1. F1 -- mapa ku Civ VI: rzeki na KRAWEDZIACH heksow (dane map.riverPaths) + bogatsze biomy + cieniowanie + ramka swiata. Geometrie heksow ZOSTAW (ZERO rotateY). Osobny podglad.
[ ] 2. (przyszle) Spawn klastrow na mapie: rozmieszczenie N typow x10 miast (>=9 pol odstepu) -- wspolnie z Civ-SILNIK/AI.

## DO ZROBIENIA TERAZ

**[2026-06-29] SILNIK = router lane** — manifest `SILNIK-ROZDYSponowANIE-LANE-2026-06-29.md`. Czat **Civ-MAPA** → `start`.

**[2026-06-28] MACIEJ → MAPA (przekazuje SILNIK) — WYKONAJ TERAZ**

**Od Macieja:** to **Twoja** robota, nie SILNIK. W czacie **Civ-MAPA** napisz **`start`**.

| Priorytet | ID | Temat | Handoff |
|-----------|-----|-------|---------|
| **P0** | **OBL-S6** | Obóz 3D oblężenia (Q10=C) | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` | **✅ DONE lane** → `MAPA-do-INTEGRATOR_oboz-3D-OBL-S6.md` |
| **P0** | **E-P0-04/05** | Złoża epok (8=B*, 9=B) | `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` | **✅ DONE lane** → `MAPA-do-INTEGRATOR_zloza-epoki-E-P0.md` |
| **P2** | **MAP-S1** | Miasta 10 poz + mury | `_handoff/A5-do-MAPA_miasta-10poziomow-mury.md` |
| **P2** | **E1 presety** | 3 wyglądy mapy | `docs/grupa-e/SPEC-jakosc-render-i-mapa.md` |

**Manifest Macieja:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md` · **NIE** `main.ts`

---

**[2026-06-28] MASTER → MAPA: PILNE (OBL-S5 w silniku ✅ — start OBL-S6)**

| Priorytet | ID | Akcja | Handoff |
|-----------|-----|-------|---------|
| **P0 TERAZ** | **OBL-S6** | Obóz oblężniczy 3D (C3-Q10=C) — model z `siegepreview/` | `_handoff/MASTER-do-MAPA_oboz-3D-OBL-S6.md` |
| **P0** | **E-P0-04/05** | Złoża miedź/żelazo + ukryte przed epoką (8=B, 9=B) | `_handoff/GRUPA-E-do-MAPA_zloza-epoki-8B-star.md` |
| P2 | **MAP-S1** | A5-Q1: 10 poziomów miast + mury per cyw | `_handoff/A5-do-MAPA_miasta-10poziomow-mury.md` |

**WPIETE (nie powtarzaj):** DST-S2 pełny klaster — `cluster-spawn.ts` + SILNIK.

**Trigger:** napisz `start` → wykonaj wiersz P0 TERAZ → meldunek `MAPA-DO-MASTERA.md` → flaga `→ SILNIK: GOTOWE` jeśli dotyka kontraktu.

**NIE ruszaj `main.ts`.**

---

**[2026-06-27] P0 MAPA — DST-S2 WPIETE przez Master (batch P0-02)**

Pełny klaster obcych typów w `cluster-spawn.ts` — **GOTOWE**, SILNIK wpiął w `applyClusterStartPlan`.  
**Następne lane MAPA:** E-P0-04/05 (złoża epoki) · OBL-S6 (po S5) · MAP-S1 (P2).

---

## [2026-06-27] P1 — Backlog pilny (audyt Macieja: częściowe → zadania)

**Backlog:** `dyspozycje/_handoff/MASTER-do-SILNIK_backlog-pilne-2026-06-27.md`

| ID | Priorytet | Co | Pliki | Handoff |
|----|-----------|-----|-------|---------|
| **DST-S2** | P1 | Pełny klaster obcych typów (nie 1 stolica) | `cluster-spawn.ts` | **WPIETE** (P0-02 Master) |
| **MAP-S1** | P2 | A5-Q1: 10 poziomów miast + mury per cyw | `cities.ts`, `bronzeCity` | decyzja A5 w docs |
| **OBL-S6** | P0 | Obóz 3D Q10=C | `siegeMarker`, `siegepreview/` | `MASTER-do-MAPA_oboz-3D-OBL-S6.md` — **po OBL-S5** |

**NIE ruszaj `main.ts`.** Meldunek: `MAPA-DO-MASTERA.md`.

## HISTORIA
- gen-helpers + generator zrefakt (wynik identyczny).


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD: src/render/scene.ts + src/map/* + src/render/cities.ts.
PANEL STEROWANIA:
- Plony-terenow.xlsx -> terrain-yields.json + terrain-movement.json  (plony per teren, koszty ruchu, 99=nieprzejezdny)
REGULA: stroisz w Plony-terenow.xlsx -> targeted export terrain-yields/terrain-movement. Nie export-data.py.


## ODPOWIEDZ MASTERA (decyzja Maciej 2B): DOPIESZCZAJ WSZYSTKO
- Kierunek OK -> idz w jakosc: rzeki (szerokosc/styl), intensywnosc biomow, styl ramki.
- Build do osobnego Gra-podglad-MAPA.html (nie kanon). Po dopieszczeniu zglos do oceny.
- Smieci `gra/src/render/_scene_tail.txt` -> sprobuj skasowac; jak OneDrive blokuje, zglos do lokalnego sprzatania (nie psuje builda, to .txt). [master rozszerzyl SPRZATANIE.ps1 -- ogarnie to lokalnie]

## WERDYKT MASTERA [2026-06-22 21:45] -- PO F1: AKTYWUJ PKT 2 (SPAWN KLASTROW)
Po dopieszczeniu F1 wejdz w pkt 2 (lancuch autonomii). Spec gotowy: Spec-generator-mapy.md sekcja "0.1 AKTUALIZACJA v0.1".
Model: 9 TYPOW (z civs.json), wszystkie miasta = klastry typow (BRAK osobnych nacji poczatkowych), liczba aktywnych typow
skaluje sie z mapa (Mala 3 / Srednia 5 / Duza 7 / Ogromna 9), miasta = typy x 10, min_dystans = 9 heksow.
Algorytm (Voronoi regiony + Poisson-disk + mgla + kolejnosc odkrywania "najpierw swoj typ") zostaje. Twoja czesc =
ROZMIESZCZENIE klastrow na mapie (src/map/*); SILNIK/AI konsumuja (osadzanie + ekspansja). Gotowa paczke zglos do _handoff/.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
DECYZJE: buildery miast ZOSTAJA w render/ (Twoje), wpina je master. Grecja+Rzym (braz) ZAAKCEPTOWANE -> rob reszte nacji (Sumer/Egipt/Aztek) tym samym wzorem. Render miast/surowcow wpina master. Technika: generate&filter przy wariantach wizualnych.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJE MACIEJ: 5A + 6A
- 5A POTWIERDZONE (uzasadnienie Maciej): buildery miast = WIDOK miasta na MAPIE SWIATA (model 3D, Twoje, render/). Wewnetrzna mechanika miasta po wejsciu = dzial MIASTO. Wpina master.
- 6A: Grecja+Rzym OK -> rob reszte nacji (Sumer/Egipt/Aztek) tym samym wzorem.


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

## [2026-06-24] DECYZJA (turniej): ulepszenia terenu = HYBRYDA (C)
STAN ulepszenia trzyma MAPA: dane heksu (farma/irygacja/droga/kopalnia + postep) + render ulepszen + placement UX (klik pola na mapie strategicznej). Praca pochodzi z MIASTA (nadmiar produkcji w zasiegu).
DROGI MIEDZYMIASTOWE = segment po segmencie: kazde pole-segment ulepsza miasto, ktore ma je w zasiegu. Brak osobnej puli regionalnej, brak special-case.

## [2026-06-24] KOREKTA + WLASNOSC (Maciej): ulepszenia terenu = TWOJ DZIAL (lead)
ZASTEPUJE poprzednia notatke "hybryda C/nadmiar". Model wg Macieja:
- WSZYSTKIE ulepszenia terenu robione Z MAPY strategicznej (placement = klik pola). Powod: drogi nie daloby sie inaczej (mapowe, miedzy miastami).
- Czesc ulepszen BEZ ograniczen (np. drogi); czesc TYLKO w GRANICACH miasta (np. farma/irygacja) — ale nadal klikane z mapy.
TWOJA WLASNOSC (lead): model danych ulepszenia na heksie (typ + postep) + render ulepszen + placement UX (klik pola, podswietlenie pol kwalifikujacych) + drogi mapowe (segment po segmencie).
DOSTAJESZ OD MIASTA (przez mastera): (1) koszt w pracy/produkcji + zrodlo pracy, (2) dane "w granicach miasta" (ktore pola kwalifikuja sie do ograniczonych ulepszen). Wpiecie przeplywu w ture + check granic = silnik (master).

## [2026-06-24] DESIGN (Maciej): zakladanie miast + panel budowania = z mapy strategicznej
- ZAKLADANIE NOWYCH MIAST: z poziomu MAPY strategicznej globalnej (lepsza widocznosc). Placement UX po Twojej stronie. ZMIANA wzgledem wczesniejszej 'lokalnej mapki miasta'. Logike zalozenia + regule dystansu trzyma MIASTO; Ty robisz interakcje na mapie + pokazujesz gdzie wolno.
- PANEL BUDOWANIA (ulepszen) MUSI pokazywac ZASIEG obecnych miast. Ulepszenia ograniczone = tylko w granicach tych miast (podswietl kwalifikujace pola, blokuj poza). Dane zasiegu/granic -> od MIASTA przez mastera.
- DROGI: tylko POMIEDZY miastami i POSTERUNKAMI (segment po segmencie). 
- POSTERUNKI = NOWY element (wezel laczacy drogi poza miastem). Definicja (czym jest, wlasciwosci, koszt) = do doprecyzowania przez Macieja — na razie placeholder.

## [2026-06-24] REFINMENT (Maciej): MAPA projektuje WYGLAD ulepszen
MAPA = jak ulepszenia WYGLADAJA: projekt wizualny + render na heksach (farma, irygacja, droga, kopalnia, posterunek). Bonusy/efekty = MIASTO. Stan na heksie + placement + drogi = MAPA (jak wczesniej).


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

## [2026-06-24] OD CYWILIZACJE (przez master): nazwy klastrow
Render czyta nazwy z cywilizacje[i].nazwyKlastra (kolejnosc: stolica, potem klaster). Dane juz w civs.json (wariant INKOWIE).

## [2026-06-24] DOMKNIECIE v0.1 — co Ci brakuje (od mastera). Rob przez Sonnet-subagenta.
1. [ROB] Miasta BRAZU — dokoncz reszte nacji (Sumer, Egipt, Chiny, Zulusi, Inkowie, Celtowie, Germanie) tym samym wzorem co Grecja/Rzym.
2. [GOTOWE, BLOK: akceptacja Maciela] Ulepszenia terenu (improvements.ts) + posterunki — render gotowy; po akceptacji listy master wpina. Trzymaj gotowe.
3. [DROBNE] cleanup martwego buildRiverEdgePoints + nieuzywane stale, zeby nie smiecic.

## [2026-06-25] DECYZJE MACIEJA (przez master)
- 3A: FORT rozszerza terytorium budowy o promien 10; fort = ULEPSZENIE EPOKI ZELAZA. Egzekwuj: miasto r10 + posterunek +5 (Braz) + fort +10 (Zelazo) = terytorium cyw; budowac TYLKO w zasiegu.
- 6B: Maciej chce NAJPIERW ZOBACZYC uklad widoku glownego/HUD przed wpieciem. Wskaz/przygotuj podglad HTML (mainview) do obejrzenia i czekaj na jego uwagi. NIE wpinam do kanonu poki nie zaakceptuje.

## [2026-06-25] MASTER -> MAPA (techniczne, od reki)
- KONTRAKT dla CYWILIZACJE (ich pkt3 ekspansja klastrowa ~9 typow): wystaw format startowego rozmieszczenia (typy/klastry -> wspolrzedne). Zloz handoff MAPA->CYWILIZACJE.
- 'Zaloz miasto z trybu Budowa' (per-cyw, L1): zasieg 5/10/15 POTWIERDZONY (decyzja modelu jest) -> mozesz robic, to technika, bez osobnego sygnalu.
- HUD / styl granicy / nazwy miast / miasta Brazu = pytam Macieja ABC; do kanonu nie wpinaj do akceptacji.


## [2026-06-25] PYTANIE MASTERA (PILNE, odpisz w -DO-MASTERA): KOSZTY / SUBAGENCI
Czy na pewno ciezka robote (kod/build/testy) realizujesz przez SUBAGENTOW na SONECIE (tanszy),
czy nadal robisz wszystko w glownym oknie BEZ wywolania subagenta? Odpowiedz wprost: TAK-subagenci-Sonnet / NIE-glowne-okno.
Jesli NIE: od teraz OBOWIAZKOWO deleguj kod do subagenta na Sonecie. Palimy limit za szybko.

## [2026-06-25] DECYZJE MACIEJA -> MAPA (relay)
- 7A: Maciej akceptuje uklad HUD + STYL GRANICY = C (tint+linia w grze). Wpiecie do kanonu robi MASTER (technika). Mozesz finalizowac granice C jako docelowa.
- 8B: nazwy miast na mapie = TAK (podepnij render z nazwyKlastra). Miasta BRAZU (Sumer/Egipt/Inkowie/Zulusi) — Maciej chce je ZOBACZYC i ew. poprawic: przygotuj PODGLAD tych 4 do oceny (nie wpinaj do kanonu do akceptacji).


## [2026-06-25] OBOWIAZEK: format pytan = ABC (polecenie Macieja)
KAZDE pytanie do mastera/Macieja zadawaj ZAWSZE w formacie ponumerowanym z opcjami:
1) <pytanie> -- A) ... B) ... (C) ...)  [oznacz rekomendacje]
2) <pytanie> -- A) ... B) ... (C) ...)
Najpierw ZNAJDZ kilka realnych rozwiazan/opcji, potem podaj jako 1 ABC / 2 ABC. Zero pytan otwartych, zero dowolnej formy. To OBOWIAZEK -- ujednolicamy obieg, bo kazdy pyta inaczej.

## [2026-06-25] MASTER -> MAPA (techniczne): eksport isInTerritory
Silnik potrzebuje `isInTerritory(q,r)` do (1) BRAMKI TERYTORIALNEJ przy zakladaniu/budowie i (2) granicy C. Zasiegi ZDECYDOWANE: miasto 5/10/15 wg populacji + posterunek. Wystaw funkcje jako eksport/callback, ktory main.ts wepnie (jak `withinTerritory` w canFoundCity). To technika, bez osobnej decyzji. Gdy gotowe -> master wepnie bramke + granice C w kolejnym batchu. (Alternatywnie silnik zrobi wlasna prosta kopie z tych samych zasiegow.)

## [2026-06-25] GRANICA WLASNOSCI: oblezenie/jednostki na mapie -> MAPA (decyzja Macieja)
Punkt styku: UNITS startuje DOPIERO gdy pojawia sie PLANSZA WALKI (ekran przed-bitewny: auto-rozegranie lub wejscie na pole bitwy). WSZYSTKO WCZESNIEJ = Ty.
TWOJE (MAPA): jednostki na mapie + ruch + pozycjonowanie/podejscie + oblezenie jako ZACHOWANIE NA MAPIE (otoczenie miasta, stan oblezenia, tryb obozowania jako stan na mapie) -- az do planszy walki.
HANDOFF do UNITS w punkcie startu: przekazujesz KONTEKST WALKI (napastnik, obronca, teren, flagi obrony struktur mur/fort/posterunek, pozycje). UNITS oddaje WYNIK -> nanosisz na mape (usun pokonanych, ew. przejmij pole).
Bonusy obrony: WARTOSCI = dane (EKONOMIA), OBECNOSC struktur + stan = Ty, ZASTOSOWANIE w walce = UNITS.

## [2026-06-25] KOREKTA GRANICY (superseduje poprzedni wpis): OBLEZENIE -> UNITS
Doprecyzowanie Macieja: w momencie OBLEZENIA temat przechodzi do UNITS (ustala sie z nimi). MAPA = TYLKO dopoki jednostka PORUSZA SIE po mapie.
TWOJE (MAPA): ruch jednostek po mapie + pozycjonowanie -- do momentu rozpoczecia oblezenia/ataku.
NIEAKTUALNE: poprzedni wpis dajacy Ci "oblezenie jako zachowanie na mapie / stan oblezenia / tryb obozowania". To oddajesz do UNITS.
Handoff: gdy zaczyna sie oblezenie/atak -> przekazujesz UNITS kontekst (napastnik/obronca/teren/struktury/pozycje); UNITS oddaje WYNIK -> nanosisz na mape.

## [2026-06-25] MASTER -> MAPA: granica RUCHU potwierdzona + masz spec UNITS
Potwierdzam podzial: REGULY jednostki (Ruch, ZoC, przeprawa, stack, limity machin/konnicy, koszt terenu z perspektywy jednostki) = UNITS; WYKONANIE (pathfinding po heksach, zuzycie pkt ruchu w turze, mgla, animacja, klik-by-isc, podglad sciezki) = MAPA+SILNIK; BAZOWY koszt wejscia na teren = MAPA (terrain-movement.json, 99=nieprzejezdny), UNITS sie odwoluje + doklada modyfikatory. Jedno zrodlo kosztu bazowego = Ty.
SPEC OD UNITS gotowy: _handoff/UNITS-do-MASTER-MAPA_model-ruchu-mapa.md -> implementuj traversal + UI ruchu na heksach wg niego.
ZAKLADANIE MIAST: front-end (tryb Budowa) GOTOWY u Ciebie. Akcje 'zaloz miasto' w petli tury + bramke isInTerritory wepnie SILNIK w nast. batchu -> czekam na Twoj eksport isInTerritory(q,r).

## [2026-06-25] DECYZJE MODELU RUCHU -> MAPA (relay Macieja)
1C: WYKONANIE min.1 pole — pozwol wejsc >=1 pole przejezdne nawet gdy koszt > reszty pkt; blokuj tylko nieprzejezdne (99).
2 (BRAK ZoC + reakcja): NIE blokuj ruchu adjacencja. Wykryj wejscie jednostki GRACZA na pole SASIADUJACE z wrogiem -> wywolaj hook reakcji. Decyzje fight/flee podejmuje CYWILIZACJE (AI). FLEE -> Ty wykonujesz ODWROT jednostki AI; FIGHT -> oddajesz do bitwy (UNITS).
3 (stacking): pozwol wielu jednostkom/armiom na 1 heksie (bez limitu) + render stacku (licznik/oznaczenie liczby jednostek na heksie).

## [2026-06-25] DECYZJA -> MAPA: posilki 1 heks (Maciej)
Przy STARCIE BITWY podaj UNITS liste armii/jednostek w zasiegu 1 HEKSA od ATAKUJACEGO i osobno od BRONIACEGO (kandydaci na posilki, per strona). Sklad bitwy komponuje UNITS.

## [2026-06-25] MASTER -> MAPA: potwierdzenia + granica C
- Dzieki za isInTerritory (gra/src/map/territory.ts) — SILNIK wepnie bramke zakladania + akcje 'zaloz miasto' w batchu.
- GRANICA C: odblokowana (7A + isInTerritory) -> renderuj styl C jako docelowy w widoku glownym.
- UI okolica (jak czytac dane): POTWIERDZAM wariant B (jedno zrodlo prawdy = wspolny selektor stanu z EKONOMIA/SILNIK, nie dubluj). Overlay v0.1 = A (tylko zaznaczone miasto).
- Posilki 1-heks: przyjmuje gotowosc dostarczenia listy na starcie bitwy — silnik poprosi przy wpinaniu skladu.
- Ruch po mapie (prototyp RUCH.html): SILNIK wepnie pathfinding/zuzycie pkt ruchu + mgle w petli tury w jednym z batchy.

## [2026-06-25] DECYZJA MACIEJA: zasieg miasta = POPULACJA (1:1), ujednolicony okolica+terytorium
Model: radius = populacja (pop2->r2, pop5->r5, pop8->r8...), cap = zasieg_okolicy_max (15). JEDEN wspolny zasieg dla okolicy roboczej I terytorium na mapie -> wzrost miasta = wzrost terytorium.
TWOJE (territory.ts): cityTerritoryRadius dla MIASTA zmien ze schodkowego (5/10/15) na = cityRangeForPopulation(pop) (radius=pop). Struktury BEZ zmian: fort +10, posterunek +5 (stale).
GRANICA rysowana LINIA (jak dotad) — zostaje (osobna kwestia wizualna). EKONOMIA owns formule/cap; Ty egzekwujesz + rysujesz linie.

## [2026-06-25] DECYZJE MACIEJA: 1A Zelazo + 2A ulepszenia z mapy
1A: surowce ZELAZO + STAL na mapie (zloza/render) — koordynuj z EKONOMIA/DANE.
2A: Robotnik usuniety -> ulepszenia terenu budowane AKCJA Z MAPY (wzorzec jak 'Zaloz miasto' w trybie Budowa): wybor pola w terytorium -> typ ulepszenia -> koszt z puli Pracy. Ty robisz UX wyboru; akcje w turze wepnie MASTER.

## [2026-06-25] DECYZJA MACIEJA: GENERATOR SWIATA (buduj) — ZASADA: wszystkie wybory gracza stosowane
Zbuduj PRAWDZIWY generator (zastap staly seed 12345 + state wymiary):
- LOSOWY SEED za kazdym razem (inny swiat co gre).
- ROZMIARY (gracz wybiera) -> wymiary wg liczby heksow: Malenki 1000 / Maly 2000 / Standardowy 5000 / Duzy 10000 / Ogromny 20000. Dobierz szer×wys ~ tej liczbie.
- TYP SWIATA (gracz wybiera przy nowej grze): KONTYNENTY (lad+morze) / PANGEA (jeden lad) / WYSPY. Zaimplementuj wszystkie trzy ksztalty.
- WYDAJNOSC: dla 10k/20k heksow render INSTANCJONOWANY (InstancedMesh) — inaczej przymula.
- API: generuj(seed, rozmiar, typ) -> mapa. Master wepnie wybory z menu.
ZASADA NACZELNA: wszystko co gracz wybierze (rozmiar/typ/nacja/trudnosc/tempo/rywale) MA byc zastosowane w nowym swiecie.

## [2026-06-26] SPRINT 1 — START (D4=A, D12=A, D15=B)

**D15=B getMinimapData:** Eksportuj API `getMinimapData(map, camera, cities, units)` z `gra/src/map/` lub `render/` — zwraca siatkę kolorów/heksów dla UI minimapy. Handoff `_handoff/MAPA-do-UI_minimap-data.md`.

**D4=A ulepszenia:** Front akcji „buduj ulepszenie z mapy" — wybór pola w terytorium, typ z terrain-improvements.json, koszt Pracy. Handoff `_handoff/MAPA-do-MASTER_ulepszenia-D4A.md` dla MASTER wpiecia.

**D12=A miasta BRAZU:** Przygotuj podgląd 4 nacji (Sumer/Egipt/Inkowie/Zulusi) — HTML preview lub mappreview route. Handoff `_handoff/MAPA-do-MASTER_miasta-brazu-D12A.md`.

**Meldunek:** append `MAPA-DO-MASTERA.md`. NIE main.ts.

---

## [2026-06-27] § PILNE — kolejka Macieja

**Source of truth:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| ID | Zadanie | Status |
|----|---------|--------|
| **MAP-P1-01** | Pełny klaster obcych typów | **✅ GOTOWE** → `MAPA-do-SILNIK_spawn-obcy-klaster.md` |
| **MAP-P1-02** | OBL-S6 obóz 3D (C3-Q10) | **DO ZROBIENIA** — po OBL-S5 w SILNIK |
| **MAP-P1-03** | A5 10 poziomów miasta | **BACKLOG v1.1** |
| **MAP-P1-04** | A4-D4 ulepszenia audit | **DO ZROBIENIA** |

**START:** `start MAP-P1-02` gdy SILNIK zamknie OBL-S5, albo `start MAP-P1-04`.
