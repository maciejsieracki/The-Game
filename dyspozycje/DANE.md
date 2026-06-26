## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-DANE**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/DANE-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do DANE-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES TWOICH ZADAN JEST W EXCELU `Status-projektu-The-Game.xlsx` (folder Civ):
- zakladka **Civ-DANE** = Twoja lista krokow; po wykonaniu ustaw Status = "Zrobione" -> wiersz sie zazieleni.
- "Status wg grup" = pelny spis (filtruj kolumne Task = Civ-DANE).
- "Podsumowanie" = statystyka; "Taski" = kto za co + pliki + panel sterowania.
INSTRUKCJE OPERACYJNE + KANAL = TEN plik (dyspozycje/DANE.md): za co odpowiadasz, PLAN DZIALANIA, pliki kodu,
PANEL STEROWANIA (Excele-parametry). Pytania/raporty -> dyspozycje/DANE-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: dzialasz TYLKO na swoich plikach. Tylko Civ-SILNIK rusza main.ts i publikuje kanon Gra-podglad.html.
Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly `npx vite build` pada na blokadzie OneDrive `dist/`),
potem `cp /tmp/civ-dist/index.html` do celu. NIGDY `npm run build` / `export-data.py`.
KOLEJNOSC: najpierw zakladka w Excelu (co i w jakiej kolejnosci), potem szczegoly w tym pliku.
Po kroku: odhacz w Excelu + raport do skrzynki i w czat.

---

# MAILBOX: Civ-DANE (cywilizacje / dane)
Lane: Cywilizacje.xlsx + civs.json. ZAKAZ export-data.py / npm run build. Kanal: DANE-DO-MASTERA.md + czat.
SPROSTOWANIE: roster = TYPY (nie 50 nacji); "50/70/90" = miasta na mapie ze spawnu (robota generatora, nie DANE).

## PLAN DZIALANIA
[x] 0. Korekta: cofniete 43 wymyslone cyw.; 7 typow + religie (poprawne).
[ ] 1. Dodac CELTOW + GERMANOW jako PELNE typy (9 typow) w Cywilizacje.xlsx + civs.json: styl, religia, bonus/minus, jednostka specjalna.
[ ] 2. Spec JEDNOSTEK dla Celtow/Germanow (tabela: nazwa|rola/bron|epoka|wzor) -> przekazac Civ-UNITS przez DO-MASTERA + czat.
[ ] 3. Przejrzec bonusy 7 istniejacych typow (zeby nie byly "do dopracowania").
[ ] 4. Re-eksport TYLKO civs.json (celowany skrypt). loader czyta bez bledu.

## DO ZROBIENIA TERAZ
Punkt 1-2.

## HISTORIA
- D2 blednie 7->50 -> cofniete. 7 typow + pole Religia: zrobione (poprawne).


## PLIKI + PANEL STEROWANIA (parametry dla Maciej)
KOD/DANE: Cywilizacje.xlsx.
PANEL STEROWANIA:
- Cywilizacje.xlsx -> civs.json  (typy, religia, bonus/minus, jednostka specjalna)
- (religie/spoleczenstwo tez w Spoleczenstwo-parametry.xlsx -- arkusz "Religie cywilizacji", w razie potrzeby uzgodnij z Civ-SILNIK)
REGULA: stroisz w Cywilizacje.xlsx -> targeted export TYLKO civs.json. Nie export-data.py.


## ODPOWIEDZ MASTERA (decyzja Maciej 1B): nazwa = CELTOWIE
- Zmien "Galowie" -> "CELTOWIE" (1 pole) w Cywilizacje.xlsx + civs.json. "Germanie" zostaja.
- Reszta jak zrobiles: 9 typow + religie (Celtowie=druidyzm, Germanie=Wotan/Odyn).
- CivDef (Religia:string|null) doda SILNIK przy wpinaniu -- Ty nic w kodzie nie robisz.
- Re-eksport TYLKO civs.json. Zglos gotowe (plik + czat).

## ODPOWIEDZ MASTERA (cd. — domkniecie pytan):
- Q1: AKCEPTUJE roster 9 typow + religie (etap zamkniety dla v0.1).
- Q3 (pole "Typ glowny" w schemacie): NA v0.1 POMIN — wszystkie 9 to typy glowne; sub-nacje to
  satelity TEGO SAMEGO typu (bez osobnych danych). Dodamy, gdy pojawia sie realne sub-nacje.
- Q4: regula 90 miast / klaster 10 POTWIERDZONA (9 typow x 10). To robota map-gen
  (Civ-MAPA / Civ-SILNIK), nie Twoja — juz w Excelu jako pozycja. Ty nic z tym nie robisz.
Czyli: wykonaj tylko zmiane Galowie->Celtowie + re-eksport civs.json i zglos.

## KOREKTA Q3 (decyzja Maciej/master): dodaj "Typ glowny" jako pole ADDYTYWNE
Pole "Typ glowny" w civs.json -> dodaj (wszystkie 9 = true). Addytywne, nieszkodliwe, pod przyszle sub-nacje.
(Zmiana wzgledem wczesniejszego "pomin na v0.1".)

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
NOWE ZADANIE (priorytet): dodaj blok 'Profil AI / charakter' per cywilizacja w Cywilizacje.xlsx -> civs.json: militarnosc, ekspansja, sklonnosc do sojuszy/lojalnosc, nastawienie nauka/kultura/ekonomia, tolerancja ryzyka, zapal religijny. WSPOLNE ZRODLO czytane przez AI (decyzje mapowe) i Dyplomacje (modulacja relacji) — definiujemy RAZ tutaj. Re-eksport TYLKO civs.json. Flaga do mastera: society-params religie 7->9 (robi master/silnik).


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJA MACIEJ: 8A + panel Excel
Blok 'Profil AI / charakter' per cyw = w DANE/civs.json (wspolne zrodlo dla AI i Dyplomacji) — POTWIERDZONE. DODATKOWO ma byc STEROWALNY z EXCELA: dodaj te parametry do Cywilizacje.xlsx jako panel (kolumna per os: militarnosc/ekspansja/sojusze-lojalnosc/nauka-kultura-ekonomia/ryzyko/zapal religijny; niebieskie=edytowalne) -> eksport TYLKO civs.json. Excel = panel sterowania profilem AI. Backup przed zmiana.


## [2026-06-24] SCALONE -> CYWILIZACJE
Ten dzial polaczony w jeden: CYWILIZACJE (DANE+DYPLOMACJA). Kanal: dyspozycje/CYWILIZACJE.md + CYWILIZACJE-DO-MASTERA.md. Tu juz nie pracujemy.
