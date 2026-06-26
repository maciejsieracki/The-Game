## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-SILNIK**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/SILNIK-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do SILNIK-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-SILNIK** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-SILNIK).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/SILNIK.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/SILNIK-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-SILNIK (silnik / integracja / kanon)
Lane: src/main.ts + wpinanie game/* + JEDYNY publisher Gra-podglad.html. NIE ruszaj units.ts/render/battle-internal/Excel.
BUILD: ZAWSZE `npx vite build` (NIGDY npm run build). Kanal: raport do SILNIK-DO-MASTERA.md ORAZ w czat.

## PLAN DZIALANIA (po kolei; po KAZDYM: build + testy + nowy kanon; odhacz [x])
[ ] 1. KONSOLIDACJA: po hydracji `npx vite build` + smoke/battle-smoke/logic/combat + publikacja Gra-podglad.html
       (wciagnie wizualia Units: kolory/super/helmy). NIE czekaj na linie typeId.
[ ] 2. M2 produkcja: wepnij production.ts (kolejka, postep wg Pracy, ukonczenie) + budowa/ulepszanie budynkow.
[ ] 3. M4 AI: wepnij ai.ts (tura rywali) + victory.ts (zwyciestwo + ekran konca).
[ ] 4. M3 walka z mapy: atak->przedbitwa->wynik na mape; wepnij siege.ts + manualBattle.ts.
[ ] 5. M5 spoleczenstwo: wepnij diplomacy.ts + culture-religion.ts + order.ts (NAJPIERW napraw bug testu order).
[ ] 6. M6 save: wepnij save.ts (zebrac stan -> zapis/odczyt + sloty).
[ ] 7. Nowa gra: flow startu -> generacja -> gra (UI od Civ-UI).
[ ] 8. Higiena: fix export-data.py (zaszyta sciezka) + usun orphany research.ts/player-economy.ts.

## DO ZROBIENIA TERAZ
Punkt 1 (czeka na hydracje folderu Civ -> "Always keep on this device").

## HISTORIA
- rdzen wpiety: turn-economy, playerState, combat, battleScene, cityPanel, preBattle.


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD: src/main.ts + wpinanie src/game/* (+ build/kanon).
PANEL STEROWANIA (Excele, ktore utrzymujesz dla Maciej -- on tam stroi wspolczynniki):
- Ekonomia-parametry.xlsx  -> econ-params.json   (Praca/Pieniadz/wzrost/zywnosc, easy/normal/hard)
- Budynki.xlsx             -> buildings.json      (baza+przyrost per param, koszty, epoki)
- Surowce.xlsx             -> resources.json
- Technologie-drzewko.xlsx -> tech.json           (koszty nauki, prereq, odblokowania)
- AI-parametry.xlsx        -> ai-params.json
- Dyplomacja.xlsx          -> diplomacy.json       (Zaufanie/Respekt, progi)
- Spoleczenstwo-parametry.xlsx -> society-params.json (Zadowolenie=Szczescie+Porzadek, progi T1/T2)
REGULA: zmiany wspolczynnikow wpisuj do tych Exceli (to panel Maciej), potem TARGETED export TYLKO danego JSON
(celowany skrypt na 1 arkusz). NIGDY export-data.py / npm run build (regeneruja wszystkie JSON -> kasuja cudza prace).

## START — ZIELONE (Maciej): rusz KROK 2 (produkcja).
Wepnij istniejacy production.ts + budowa/ulepszanie budynkow w petle tury (main.ts). Moduly juz sa na dysku. Po wpieciu: build (--outDir /tmp/civ-dist) + testy + publikacja kanonu. Styk: jak MUSISZ tknac production.ts/economy.ts (cudze lane) -> popros o wersje przez _handoff/, nie edytuj rownolegle.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.

## WERDYKT MASTERA [2026-06-22 21:45] -- (a) REBUILD KANONU  (b) CivDef.Religia  (c) spawn-konsument
(a) UNITS zmienil units.ts (helmy/luki + typeId na mapie) i prosi o rebuild -> zrob krok 1 TERAZ: `npx vite build --outDir /tmp/civ-dist` -> cp do Civ/Gra-podglad.html; testy smoke/battle-smoke/logic/combat. POTEM krok 2 produkcja.
(b) CivDef w src/data/loader.ts NIE ma pola Religia (sprawdzone) -- dodaj 1 linie `Religia: string | null;` (civs.json juz je niesie). Drobne, przy okazji M2/M5.
(c) Spawn klastrow: spec = Spec-generator-mapy.md "0.1". MAPA rozmieszcza, Ty osadzasz w petli tury (M4/nowa gra), AI ekspanduje; konsumujesz paczke MAPA z _handoff/.
SNAPSHOT TESTOW (master 21:40): logic 162/163 (jedyny czerwony: "order: loadOrderParams scales by difficulty"), barbarians 53/0, diplomacy 78/0, upkeep 51/0; combat-test nieweryfikowalny w sandbox (esbuild /tmp). Bug order.ts naprawia MIASTO przed M5.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
ZAKRES PRZEJAL MASTER: silnik + integracja prowadzi master. Dzial = standby; pod-zadania zleci master.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] (kanal standby — silnik prowadzi master)
