# CYWILIZACJE (dzial scalony: DANE + DYPLOMACJA)
Kanal master->dzial. Raporty: CYWILIZACJE-DO-MASTERA.md. Obowiazuje PLAYBOOK (sekcje 11-15).

## ZAKRES
Jedno zrodlo wszystkich danych PER-CYWILIZACJA. Plik: Cywilizacje.xlsx (4 arkusze):
1. Cywilizacje (roster/tozsamosc) -> civs.json
2. AI-zachowanie -> civ-ai.json (czyta AI / ai.ts)
3. Dyplomacja (per-nacja + globalne params) -> diplomacy.json (czyta diplomacy.ts)
4. Parametry-cyw -> civ-params.json (AI priorytety + MIASTO/EKONOMIA)
Kod: diplomacy.ts nalezy do tego dzialu. ai.ts = osobny dzial AI (tylko czyta civ-ai/civ-params).

## DO ZROBIENIA (wartosci ustala Maciej w tym oknie)
- Uzupelnic 3 nowe arkusze (szkielety gotowe, niebieskie komorki).
- Re-eksport: civs.json + civ-ai.json + diplomacy.json + civ-params.json (targeted, NIGDY export-data.py/npm build).
- Flaga: society-params religie 7->9 (re-eksport robi master/silnik).
- Dyplomacja: re-analiza zalozen (a)/(b) turniejem (z poprzedniej dyspozycji) — nadal aktualna.

## BACKUP przed kazda zmiana (cp plik plik.bak-CYWILIZACJE).


## [2026-06-24] ROZSZERZENIE: dzial AI SCALONY do CYWILIZACJE
Dzial AI wchloniety. CYWILIZACJE obejmuje teraz TEZ:
- DANE AI: arkusz 'AI-zachowanie' w Cywilizacje.xlsx = zakladka AI (juz istnieje).
- KOD AI: ai.ts (strategia rywala na mapie), barbarians.ts, victory.ts (zwyciestwo). Te moduly = ten dzial; master wpina je do petli tury.
ZAKRES AI (korekta): strategia komputera NA MAPIE — osadnictwo, ekspansja, priorytety budowy, kiedy/kogo atakowac, ruch armii, poscig za zwyciestwem, trudnosc. Taktyka BITWY = UNITS (nie tu).
Dane czyta z WLASNYCH arkuszy (AI-zachowanie + Parametry-cyw) -> zero cross-lane, zero dublowania.

## DO ZROBIENIA (AI — dzial byl pusty)
1. Barbarzyncy (barbarians.ts).
2. AI rywala (ai.ts) czytajace AI-zachowanie + civ-params + mape.
3. Domkniecie warunkow zwyciestwa (victory.ts).

## [2026-06-24] DYSPOZYCJA: CO PRZEJMUJESZ Z AI (stan zweryfikowany)

KOD — wszystko ISTNIEJE, ale NIEwpięte w pętlę tury (wpięcie do main.ts robi MASTER):
- gra/src/game/ai.ts (610 lin) — decideAITurn(...) -> AICommand[] (ruch/zakładanie/atak/budowa). Strategia rywala na mapie.
- gra/src/game/victory.ts (223 lin) — checkVictory(...): dominacja typu + statek kosmiczny + eliminacja.
- gra/src/game/barbarians.ts (561 lin) — ISTNIEJE (wbrew starej notatce). Logika barbarzyńców.
DANE:
- gra/data/ai-params.json — parametry trudności (poziom 1/2/3).
- arkusze Cywilizacje.xlsx: AI-zachowanie + Parametry-cyw (puste, do uzupełnienia per nacja).
DOK: brak osobnego doc AI; sygnatury modułów w SILNIK/SILNIK-ARCHITEKTURA-DEWELOPER.md.

ZAKRES (granica): strategia komputera NA MAPIE — osadnictwo, ekspansja, priorytety budowy, kiedy/kogo atakować, ruch armii, pościg za zwycięstwem, trudność, barbarzyńcy. NIE taktyka bitwy (= UNITS).

TWOJE ZADANIA (priorytet):
1. Przegląd 3 modułów (ai/victory/barbarians) — czy logika OK, czy czytają dane.
2. Podłącz ai.ts pod dane: ma czytać AI-zachowanie (agresja/ekspansja/priorytety/ryzyko) + Parametry-cyw (preferowane budynki/jednostki), zamiast/oprócz sztywnych wartości.
3. Uzupełnij arkusze AI-zachowanie + Parametry-cyw (wartości wpisuje Maciej w oknie) -> re-eksport civ-ai.json + civ-params.json (targeted; NIGDY export-data.py / npm build).
4. Testy własne modułów (jeśli są harnessy ai/victory/barbarians).
5. HANDOFF do mastera: "ai.ts/victory.ts/barbarians.ts gotowe do wpięcia" + dokładna instrukcja wpięcia (handler "N": decideAITurn -> wykonać AICommand[]; checkVictory; tick barbarzyńców) + DoD. Master wpina + sędzia + kanon.

REGUŁY: backup przed zmianą (cp plik plik.bak-CYWILIZACJE); NIE ruszasz main.ts (to master); wpięcie zgłaszasz handoffem; pytania w oknie + dopis do CYWILIZACJE-DO-MASTERA.md.


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

## [2026-06-24] OD MIASTO (przez master): JEDNO ZRODLO religii cyw.
Religia cywilizacji jest w DWOCH miejscach: civs.json (Wasze) + society-params.religie_cywilizacji (panel spoleczenstwa). culture-religion.civReligion to czyta -> potrzebne JEDNO zrodlo. Propozycja: civs.json = ZRODLO, blok w society-params = referencja/usunac. Wplywa na Dyplomacje + Kulture/Religie. Przy re-eksporcie zsynchronizuj (religie 7->9 robi master/silnik).


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

## [2026-06-24] OD MAPA (przez master): nazwy klastrow per typ
MAPA przygotowala propozycje 10 nazw/typ -> dyspozycje/_handoff/MAPA-do-MASTER_nazwy-klastrow.md. To DANE per-cyw (Cywilizacje.xlsx -> civs.json). Wykorzystaj wariant INKOWIE (roster=Inkowie). Wpisz nazwy klastrow do swoich danych + re-eksport civs.json.

## [2026-06-24] WLASNOSC AI (domkniecie niespojnosci) + odp. tech.json
- AI jest CZESCIA Cywilizacje (decyzja Macieja, ta sesja). ai.ts / barbarians.ts / victory.ts NALEZA do Cywilizacje — NIE "osobny dzial Civ-AI". Dane zachowania AI = arkusz AI-zachowanie w Cywilizacje.xlsx (ew. ai-params.json archetype_* — wybor wewnetrzny dzialu; wazne: JEDNO zrodlo, NIE osobny blok w civs.json/DANE — DANE i tak wchloniete).
- tech.json: TAK — czytaj gra/data/tech.json WPROST (read-only) do heurystyki nauki AI. Bez handoffu.
- Osobne okno "Civ-AI" jest teraz REDUNDANTNE (wchloniete). Jego otwarte punkty (#1/#2 blokujace, archetypy) obsluguje Cywilizacje.


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

## [2026-06-24] OD MASTERA: zielone na targeted export-civs + nazwy klastrow
- TAK: dodaj kolumne nazw klastra do Cywilizacje.xlsx + zrob targeted export-civs.py (wzor: export-diplomacy.py), zeby nazwyKlastra nie zniknely. NIGDY export-data.py.
- Potwierdzam: MAPA czyta nazwy z cywilizacje[i].nazwyKlastra — przekaze MAPIE. Handoff nazwy-klastrow zamkniety.
- Pisownia obca (UTF-8) OK; ew. korekta przez Macieja.

## [2026-06-24] DOMKNIECIE v0.1 — co Ci brakuje (od mastera). Rob przez Sonnet-subagenta.
1. [ROB] AI: zbuduj HARNESS testowy dla ai.ts (brak zielonego testu fixu wartosc<->wartosc) — AI ma byc weryfikowalne.
2. [ROB] Archetypy 7->9 (dodaj Celtowie/Germanie) + ZAPROPONUJ wartosci startowe (trudnosc, profil, nastawienie bazowe 0-100). Maciej skoryguje w oknie.
3. [ROB] Heurystyka nauki AI: czytaj gra/data/tech.json WPROST (zatwierdzone).
4. [ROB] targeted export-civs.py (chroni nazwyKlastra przed export-data.py) — zrob (wzor export-diplomacy.py).
5. [ROB] Religia: jedno zrodlo = civs.json; zsynchronizuj (society-params religie 7->9 = re-eksport po stronie danych; master/silnik dopnie wpiecie).
6. [DECYZJA] Dyplomacja re-analiza (a)/(b): rekomendacja mastera = ZAMKNAC (zalozenia stoja). Jesli Maciej chce turniej — rob na Sonnecie.

## [2026-06-25] DECYZJA MACIEJA (przez master): per-cyw mnoznik Handel->Pieniadz
Dodaj do danych cywilizacji per-nacja MNOZNIK Handel->Pieniadz: BAZA=2, kazda nacja troche wiecej/mniej (charakter ekonomiczny). Dane = CYWILIZACJE (civs.json / Parametry-cyw). Mechanike realizuje EKONOMIA (mnoznik na poziomie cyw, gated Waluta+Mennica).

## [2026-06-25] KOREKTA: referencja tempa nauki przyjdzie z MIASTO+EKONOMIA
Nauka jest w MIASTO (nie EKONOMIA). MIASTO+EKONOMIA ustala model nauki (podzial pieniadza + magazyn), master poda Ci REFERENCJE tempa. Czekaj na nia; nie zmieniaj kosztow tech przed referencja (1a). Drzewko/koszty = nadal Twoje.

## [2026-06-25] MASTER -> CYWILIZACJE (techniczne, od reki)
- REFERENCJA tempa nauki GOTOWA: _handoff/EKONOMIA-do-MASTER_tempo-nauki.md (wzor + widelki + Biblioteka x1.5). Uzyj do strojenia kosztow tech.
- Kontrakty zlecone: pkt3 -> MAPA wystawia format startowego rozmieszczenia; pkt5 -> EKONOMIA wystawia kontrakt koszt-vs-skarbiec.
- Wpiecie modulow AI do petli (ai-wpiecie.md) robi MASTER w batchu silnika (technika), nie blokuje Ciebie.
- mnoznikHandelPieniadz per-cyw (1.7-2.4) oddalem Maciejowi do ABC (parametr gameplay).


## [2026-06-25] PYTANIE MASTERA (PILNE, odpisz w -DO-MASTERA): KOSZTY / SUBAGENCI
Czy na pewno ciezka robote (kod/build/testy) realizujesz przez SUBAGENTOW na SONECIE (tanszy),
czy nadal robisz wszystko w glownym oknie BEZ wywolania subagenta? Odpowiedz wprost: TAK-subagenci-Sonnet / NIE-glowne-okno.
Jesli NIE: od teraz OBOWIAZKOWO deleguj kod do subagenta na Sonecie. Palimy limit za szybko.

## [2026-06-25] DECYZJE MACIEJA -> CYWILIZACJE (relay)
- NOTATKA-DO-PRZYJECIA (docelowo Wasze, AI+dyplomacja): warstwa "podzial puli miasta zalezny od ROZWOJU/EPOK" — wieksze udzialy BADAN/ROZWOJU z postepem cywilizacji (na podstawie epok lub kolejnych badan). Teraz EKONOMIA daje tylko HOOK; wy przejmiecie REGULY tej zaleznosci pozniej. Zanotuj w swoim zakresie.
- 5 (przyjete): mnoznik Handel->Pieniadz baza 2, per-cyw 1.7-2.4 — wpisz wartosci per nacja do civs (mechanika = EKONOMIA).


## [2026-06-25] OBOWIAZEK: format pytan = ABC (polecenie Macieja)
KAZDE pytanie do mastera/Macieja zadawaj ZAWSZE w formacie ponumerowanym z opcjami:
1) <pytanie> -- A) ... B) ... (C) ...)  [oznacz rekomendacje]
2) <pytanie> -- A) ... B) ... (C) ...)
Najpierw ZNAJDZ kilka realnych rozwiazan/opcji, potem podaj jako 1 ABC / 2 ABC. Zero pytan otwartych, zero dowolnej formy. To OBOWIAZEK -- ujednolicamy obieg, bo kazdy pyta inaczej.

## [2026-06-25] DECYZJA -> CYWILIZACJE (AI na mapie): reakcja fight/flee (relay Macieja)
2: gdy jednostka GRACZA wejdzie obok jednostki AI (sasiedztwo) -> AI decyduje: BITWA czy ODWROT (BRAK ZoC, gracz moze przejsc obok). Twoja czesc: heurystyka decyzji (np. sila wzgledna atak/obrona, relacja/dyplomacja, wartosc jednostki, czy w terytorium). Zwracasz decyzje; wykonanie: bitwa=UNITS, odwrot=MAPA. Zdefiniuj wejscia + prog decyzji.

## [2026-06-25] UZUPELNIENIE -> CYWILIZACJE: posilki AI (1 heks)
Rozszerzenie #2: AI-owe armie w zasiegu 1 heksa od starcia tez sa kandydatami na posilki — Twoja heurystyka decyduje czy AI je dorzuca do bitwy (czy trzyma/wycofuje). Wejscia jak przy fight/flee.

## [2026-06-25] MASTER -> CYWILIZACJE: techniczne
- enum TypCywilizacji -> WYROWNAJ do ROSTERA 9 (dodaj Celtow + Germanow); roster=9 typow (ustalone).
- 'Typ glowny=false' martwa flaga -> usun/ignoruj.
- self-check civ-dane-self-check czyta martwy DANE.md -> repoint na CYWILIZACJE.md albo wylacz (DANE scalone).
- budzet-AI od EKONOMII masz (canAfford/itemCost/skarbiec; Kamien=Praca) -> uzyj w chooseAIBuild.
- Decyzje T1-T4 + propozycja kosztow nauki + 4 pytania balansu: PODAJE Maciejowi; nie wpinaj do decyzji.

## [2026-06-25] WLASNOSC STARTU: master ownuje, Wy = DOSTAWCA DANYCH (decyzja Macieja: A)
Ekran startu / inicjalizacja gry = MASTER (silnik). Wy dostarczacie DANE do startu: per nacja w civs.json -> typCywilizacji + ARCHETYP AI + bonusy[] {typ,cel,wartosc,realizuje}. Master aplikuje je na starcie (gracz: jego nacja+bonusy; AI: ich nacje+archetypy zamiast fallbacku 'grecy'). Po starcie Wy ozywiacie przeciwnikow. Upewnijcie sie ze civs.json ma komplet (typ+archetyp+bonusy per 9 nacji) + enum=roster 9.

## [2026-06-25] MASTER -> CYWILIZACJE: format klastrow GOTOWY + fix Sumerowie
- MAPA dostarczyla FORMAT ROZMIESZCZENIA KLASTROW (Twoj pkt3): gra/src/map/clusters.ts computeClusters -> ClusterPlacement (_handoff/MAPA-do-MASTER_format-rozmieszczenia-klastrow.md). Uzyj do ekspansji klastrowej AI. Klucz nacji = ikonaId z civs.json.
- FIX (techniczny): niespojnosc Sumerowie vs Babilon — civs.json ikonaId='sumerowie', enum TypCywilizacji='babilon' (ARCHETYPE_AGGRESSION klucz 'Babilon'). AI-Sumerowie dostaje fallback 0.5 zamiast archetypu. Ujednolic spojnie (Sumerowie=rename Babilon): albo ikonaId->'babilon' w civs.json, albo dodaj 'sumerowie' do enum+archetypu.

## [2026-06-25] DECYZJA MACIEJA: 1A — Zelazo wchodzi do v0.1
Swiadome: 3 epoki (Kamien/Braz/Zelazo). AI moze badac/budowac Zelazo. tech.json Zelazo zostaje.
