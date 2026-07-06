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

## DO ZROBIENIA (AI — aktualne P0 lane)

**[2026-06-29] SILNIK = router** — moduły CYW GOTOWE → SILNIK wpina (`CYWILIZACJE-do-SILNIK_*.md`). Lane CYW tylko przy diplomacy FAIL.

**[2026-06-28] MACIEJ → CYWILIZACJE (przekazuje SILNIK) — WYKONAJ TERAZ**

**Od Macieja:** to **Twoja** robota, nie SILNIK. W czacie **Civ-CYWILIZACJE** napisz **`start`**.

| Priorytet | ID | Temat | Handoff |
|-----------|-----|-------|---------|
| **P0** | **D-P0-01…03** | Excel AI kopie typu (Grupa D 5A) | `MASTER-do-CYWILIZACJE_D-START-kopie-pilne.md` | **✅ DONE u CYW** (2026-06-27) — Silnik: 1 linia 5A w main.ts |
| **P0** | **E-P0-06** | Zwycięstwo Power+rakieta (10=A*) | `_handoff/GRUPA-E-do-CYWILIZACJE_victory-10A-star.md` | **✅ DONE lane** → `CYWILIZACJE-do-SILNIK_victory-10A.md` |
| **P0** | **E2-11** | Barbarzyńcy reguła epok (11=C*) | `docs/grupa-e/decyzje/PACZKA-ABC-BLOKERY.md` | **✅ DONE lane** → `CYWILIZACJE-do-SILNIK_barbarians-11C.md` |
| **P1** | **diplomacy-test** | 3 FAIL (132/135) — eskalacja SILNIK | lane DYPLO/CYW |

**Manifest Macieja:** `dyspozycje/MACIEJ-DELEGACJA-LANE-2026-06-28.md`  
**Po GOTOWE:** `CYWILIZACJE-DO-MASTERA.md` + `→ SILNIK: GOTOWE` · **NIE** `main.ts` (victory: moduł tu, wpiec F później)

---

**[2026-06-28] MASTER → CYWILIZACJE: PILNE**

| ID | Status | Co | Handoff |
|----|--------|-----|---------|
| **D-P0-01** | **✅ DONE** | Profil `kopia_typu_obronna` + export 5A | handoff excel |
| **D-P0-02** | **✅ DONE** | civ-bonusy 30/30 | — |
| **D-P0-03** | **✅ DONE** | Bonusy v1.0 rdzeń | handoff UNITS/UI |
| **E-P0-06** | **✅ DONE lane** | victory 10=A* | `…-do-SILNIK_victory-10A.md` |
| **E2-11** | **✅ DONE lane** | barbarians 11=C* | `…-do-SILNIK_barbarians-11C.md` |

**WPIETE (nie powtarzaj):** P0-01 diplomacy guard · P0-03 kontakt · P0-05 `defensiveCopy` · **OBL-S7** (`siegeAi.ts` — SILNIK wpiął).

**Trigger:** `start` → D-P0-01 → meldunek → `→ SILNIK: GOTOWE` gdy JSON gotowy.

**NIE ruszaj `main.ts`.**

---

## DO ZROBIENIA (AI — dzial byl pusty)
1. Barbarzyncy (barbarians.ts).
2. AI rywala (ai.ts) czytajace AI-zachowanie + civ-params + mape.
3. Domkniecie warunkow zwyciestwa (victory.ts).

## [2026-06-27] P0/P1 — Backlog pilny (audyt Macieja)

**Backlog:** `dyspozycje/_handoff/MASTER-do-SILNIK_backlog-pilne-2026-06-27.md`  
**Handoff szczegółowy:** `MASTER-do-CYWILIZACJE_D-START-kopie-pilne.md`

| ID | Priorytet | Co | Pliki |
|----|-----------|-----|-------|
| **DST-S3** | P1 | AI defensywne — profil `kopia_typu_obronna` | `ai.ts`, `civ-ai.json` |
| **DST-S4** | P1 | Grupa D 5A — Excel AI → targeted export | arkusze → JSON |
| **OBL-S7** | P0 | ~~AI oblężenie 3 poziomy~~ | **✅ WPIETE** (siegeAi.ts + SILNIK) |

**NIE ruszaj `main.ts`.** Po GOTOWE → flaga w `CYWILIZACJE-DO-MASTERA.md` → SILNIK wpina.

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

## [2026-06-26] SPRINT 1 — START (RDY-09, D10=A, D13=A, D14=A)

**RDY-09 Sumer/Babilon:** Ujednolić `civs.json` — ikonaId vs TypCywilizacji (Sumerowie/Babilon). ARCHETYPE_AGGRESSION spójny.

**D10=A Katapulta=Żelazo:** W `units.json` (lub danych machin) epoka Katapulty = Zelazo (3). Warsztat obleżniczy = Żelazo (korekta Macieja 2026-06-26 w EKONOMIA-DO-MASTERA). Handoff `_handoff/CYWILIZACJE-do-UNITS_katapulta-D10A.md`.

**D13=A defaulty startu:** Dokument `_handoff/CYWILIZACJE-do-MASTER_defaulty-startu-D13A.md` — propozycja: Rzym/Normal/Normal/Kamień/Mała mapa/3 rywali.

**D14=A surowce żelazo/stal:** Upewnij się złoża w danych mapy/terrain + flagi dostępu w resources.json (koordynacja MAPA). Handoff jeśli brakuje.

**Meldunek:** append `CYWILIZACJE-DO-MASTERA.md`. NIE main.ts.

## [2026-06-27] PRIORYTET P0 — D-START miasta-kopie-typu (Maciej)

**Czytaj:** `docs/decyzje/D-START-miasta-kopie-typu.md` + `docs/grupa-d/MODELE-MIAST-TYPU.md`

**Model:** Wszystkie miasta AI = kopie typu cywilizacji (ten sam `ikonaId`, bonusy, gospodarka). Obcy typ na mapie (np. Chińczycy) = klaster chińskich nazw — **do podbicia**. AI **tylko obrona** — bez zakładania miast, bez ekspansji.

**Twoje zadania:**
1. **AI-zachowanie** (Excel): profil `kopia_typu_obronna` per typ (agresja↓, ekspansja=0, zakladanieMiast=0).
2. **`ai.ts`:** if owner isTypCityCopy → skip ekspansja/osadnik; tylko garnizon/obrona.
3. **Audyt bonusów:** każdy owner klastra dostaje `civBonusyForCivKey(typ)` — bez wyjątków.
4. **Handoff** po MAPA+SILNIK: pełny spawn klastra obcych typów (nie 1 stolica).
5. Meldunek append `CYWILIZACJE-DO-MASTERA.md`.

**NIE pytaj Macieja** — decyzja zamknięta. Pytania tylko techniczne (np. garnizon startowy) → Master.

**Handoff gotowy:** `dyspozycje/_handoff/CYWILIZACJE-do-MASTER_miasta-kopie-typu.md`

---

## [2026-06-27] § PILNE — kolejka Macieja

**Source of truth:** `dyspozycje/PILNE-KOLEJKA-2026-06-27.md`

| ID | Zadanie | Status |
|----|---------|--------|
| **CYW-P1-01** | AI defensywne kopie typu | **✅ GOTOWE** → `CYWILIZACJE-do-SILNIK_AI-defensywne-kopie.md` |
| **CYW-P1-02** | civ-bonusy-test 30/30 | **✅ GOTOWE** |
| **CYW-P1-03** | D4-Q3 pełne bonusy v1.0 (reszta) | **DO ZROBIENIA** — po playtest |
| **CYW-P1-04** | Grupa D 5A AI Excel | **DO ZROBIENIA** |

**START:** `start CYW-P1-04` (Excel AI-zachowanie) lub czekaj na SILNIK integrację.
