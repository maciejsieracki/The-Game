## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-MIASTO**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/MIASTO-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do MIASTO-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES: Excel `Status-projektu-The-Game.xlsx` (folder Civ) -> zakladka **Civ-MIASTO** (odhaczasz kroki: Status="Zrobione" -> zielony) + "Status wg grup" (filtr Task=Civ-MIASTO). [zakladka dodana do Excela po jego zamknieciu]
KANAL: czytasz dyspozycje/MIASTO.md; piszesz dyspozycje/MIASTO-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: tylko swoje pliki. Tylko Civ-SILNIK rusza main.ts + publikuje kanon. Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly pada na blokadzie OneDrive dist/) -> cp do celu. NIGDY npm run build / export-data.py.
PLIKI KODU (Twoj lane): src/game/cities.ts, production.ts
PANEL STEROWANIA (Excele dla Maciej): Budynki.xlsx -> buildings.json

---
## PLAN DZIALANIA
[ ] 1. Miasto jako obiekt: zakladanie, wzrost, granice -- cities.ts (juz istnieje, wpiete).
[ ] 2. Kolejka produkcji: production.ts (juz istnieje, niewpiety) -- co miasto buduje (jedn./budynek), postep wg Pracy.
[ ] 3. Budynki: budowa/ulepszanie per epoka wg Budynki.xlsx (panel dla Maciej).
(Wpiecie w petle tury + panel UI: Civ-SILNIK + Civ-UI. Styk z Civ-EKONOMIA: produkcja uzywa ekonomii -> handoff.)

## DO ZROBIENIA TERAZ
Czekaj na sygnal "start" (najpierw sprzatanie). Potem pkt 2 (kolejka produkcji).

## HISTORIA
- (nowy task; cities.ts wpiety, production.ts gotowy niewpiety)

## START — ZIELONE: zacznij od BUDYNKOW (Budynki.xlsx -- parametry budowy/ulepszania per epoka) + analiza cities.ts/production.ts (czytaj). production.ts NA RAZIE nie edytuj -- SILNIK go wpina; po wpieciu przejmiesz refinement. Propozycje -> _handoff/.

## AKTUALIZACJA (decyzja Maciej): SPOLECZENSTWO wchodzi do MIASTA
Porzadek/Kultura/Religia maja GLOWNY wplyw na MIASTA -> naleza do Ciebie (Civ-MIASTO), nie do osobnej domeny.
+ pliki: src/game/order.ts + culture-religion.ts.  + panel: Spoleczenstwo-parametry.xlsx -> society-params.json.
DODATKOWE KROKI:
[ ] A. Napraw bug testu order.ts ("loadOrderParams scales by difficulty") -> logic 163/163.
[ ] B. Porzadek = Szczescie + Prawo (order.ts): progi T1 (gorzej pracuja)/T2 (bunt); garnizon=Prawo, budynki=Szczescie -- wplyw na miasto.
[ ] C. Kultura/religia (culture-religion.ts): granice/zadowolenie + konwersja przez swiatynie (sec.5f) -- wplyw na miasto.
(Dane premiowe cyw. dla kultury/religii/porzadku siedza w civs.json/Cywilizacje.xlsx = Civ-DANE; Ty robisz MECHANIKE w miescie. Cross-ref przez _handoff/.)

## ODPOWIEDZ MASTERA (pytanie o scalanie paneli Excel->JSON): NIE SCALAJ
Zostaw istniejace Excele OSOBNO: Budynki.xlsx -> buildings.json  ORAZ  Spoleczenstwo-parametry.xlsx -> society-params.json.
Kazdy ma swoje mapowanie arkusz->JSON w export-data.py; scalanie zlamaloby pipeline i ownership miedzy domenami.
Panel sterowania = te istniejace Excele, bez konsolidacji. (Ewentualny zbiorczy podglad HTML to osobny, pozniejszy temat -- nie teraz.)
PRZYPOMNIENIE: nie zadawaj pytan przez AskUserQuestion -- tekst w czacie + wpis do MIASTO-DO-MASTERA.md.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.

## WERDYKT MASTERA [2026-06-22 21:45] -- order.ts: KONKRET DO KROKU A
Snapshot testow (master): logic 162/163; JEDYNY czerwony = "order: loadOrderParams scales by difficulty (easy T1=-1, hard T1=1)".
Oczekiwanie testu: loadOrderParams ma SKALOWAC prog T1 wg trudnosci -> easy T1 = -1, normal T1 = 0, hard T1 = +1 (analogicznie T2). Teraz nie skaluje.
To jest krok A -- zrob przed B/C i przed wpieciem M5 przez SILNIK. Reszta logiki order/kultura/religia = ZIELONA (testy 123-163 pass).

## WERDYKT MASTERA [2026-06-22 21:55] -- KROK A: ZWERYFIKOWANY ZIELONY (juz zrobione)
Master sprawdzil: data/society-params.json ma juz porzadek_prog_t1 = {easy:-1, normal:0, hard:1}, a loadOrderParams to czyta ->
test "loadOrderParams scales by difficulty" PRZECHODZI (zweryfikowane bundlem order.ts standalone: easy=-1/normal=0/hard=1).
Czyli krok A = ZROBIONY (poprawka w warstwie danych, kod order.ts byl OK). Odhacz A i przejdz do kroku B (order T1/T2) i C (kultura/religia).
UWAGA SRODOWISKO: pelny `node tools/logic-test.cjs` w piaskownicy potrafi PADAC na "Unterminated string literal data/diplomacy.json:545"
-- to NIESWIEZY mount OneDrive (chmura ma plik CALY, sprawdzone Read), NIE realne uszkodzenie. Lek: folder Civ -> "Always keep on this device".


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
WPIETE DO SILNIKA przez mastera (produkcja/porzadek/kultura/religia; logic-test 163/163). Standby. Etap 2 (spreadReligion, tradeMult na pieniadz per-city) = pozniejsza iteracja na sygnal mastera. Przy hydracji: regen Excela.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] GRANICA (Maciej)
MIASTO = wewnetrzna MECHANIKA miasta (po wejsciu do srodka). WIDOK miasta na mapie swiata (model 3D) = MAPA (render). Twoja logika bez zmian. Standby na kolejne plastry.


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

## [2026-06-24] OD MASTERA: Twoja paczka JUZ WPIETA
Integracja produkcja/porzadek/kultura/religia ZROBIONA przez mastera (main.ts, petla tury): build 46 modulow, logic-test 163/163, kanon opublikowany (Gra-podglad.html md5 e6bd460). NIE czekasz na wpiecie.
ETAP 2 (na pozniej): spreadReligion (sasiedzi), growthMult hook (z EKONOMIA/turn-economy), tradeMult na pieniadz per-city — zglosze gdy ruszam.
ROUTING ZROBIONY przeze mnie: ② UI (kontrakt), ③ EKONOMIA (compound+growthMult), ④ religia -> CYWILIZACJE. Gra-podglad-MIASTA(.html/-BRAZ) = pliki MAPA (buildery miast = MAPA, decyzja 5A) — nie Twoje.
PYTANIE 'wioska->miasto (Schemat §7.4) w v0.1?' = DECYZJA PROJEKTOWA -> zadaj Maciejowi w tym oknie (nie master).


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

## [2026-06-24] DECYZJA (turniej; master rozstrzygnal na prosbe Macieja): ulepszenia terenu = HYBRYDA (C)
Model: MIASTO generuje Prace i jej NADMIAR; nadmiar (po budynkach) zasila zlecenia ulepszen na polach W ZASIEGU miasta. Placement = klik pola na MAPIE, NIE pozycja w kolejce budynkow.
TWOJA CZESC: production.ts generuje Prace; nadmiar -> przydzielany do AKTYWNYCH zlecen ulepszen na polach w zasiegu; sledzenie postepu zlecenia. STAN ulepszenia pola trzyma MAPA (dane heksu), nie Ty. Kontrakt z MAPA/silnikiem -> przez mastera.

## [2026-06-24] KOREKTA: ulepszenia terenu = LEAD ma MAPA; Ty dajesz 2 kontrakty
ZASTEPUJE poprzednia notatke C. Ulepszenia robione z mapy (MAPA = lead). Twoja czesc (kontrakty -> przez mastera do MAPA/silnika):
1. KOSZT + ZRODLO PRACY: production dzieli Prace budynki <-> teren; ulepszenie kosztuje X pracy; przekaz jak liczyc koszt i skad praca.
2. GRANICE MIASTA: dane "ktore pola sa w granicach miasta" (zasieg/kultura) dla ulepszen ograniczonych do miasta.
NIE trzymasz stanu pola (to MAPA). NIE robisz placementu (to MAPA).

## [2026-06-24] DESIGN (Maciej): zakladanie miast z mapy strategicznej
- ZAKLADANIE NOWYCH MIAST robione z MAPY strategicznej (placement UX = MAPA). TY trzymasz: logike zalozenia (cities.ts), regule dystansu/zasiegu (min ~5 pol), stan miasta. ZMIANA: wczesniej z lokalnej mapki miasta -> teraz z globalnej.
- Dostarcz MAPIE (przez mastera) DANE ZASIEGU/GRANIC miast — panel budowania ma pokazywac zasiegi i ograniczac ulepszenia do granic miast.

## [2026-06-24] REFINMENT (Maciej): MIASTO ustala BONUSY ulepszen
Per ulepszenie pola MIASTO definiuje BONUS/EFEKT na miasto (co daje do plonow/ekonomii: farma +zywnosc, irygacja +zywnosc, kopalnia +produkcja, droga +ruch/handel itd.). To dane efektow (panel/Excel po Twojej stronie). Stan pola + wyglad = MAPA. Koszt(produkcja) + dane granic = jak wczesniej.


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
1. [ROB] splitPraca (production.ts) + opcjonalny territory-check w canFoundCity (5. arg) — Wasze, niezalezne, dokoncz + test.
2. [ROB] OBRABIANE POLA: automat "N populacji = N najlepszych pol okolicy (5)" (z propozycji Civ7, WYSOKI prio). Zaprojektuj + wystaw + test.
3. [GOTOWE->WPNE JA] Etap 2 religii: spreadReligion (sasiedzi) + tradeMult na pieniadz per-city — dokoncz modul, zglos handoff.
4. [BLOK: decyzja Maciela o liscie ulepszen] przygotuj wartosci bonusow ulepszen w terrain-improvements.json, gotowe do wpiecia.
5. [DROBNE] regen swojego Excela przy hydracji.

## [2026-06-25] DECYZJE MACIEJA (przez master)
- 4A: MUR MIASTA = flaga miasta `maMur` + nowy budynek/ulepszenie „Mury" w buildings.json (odblokowuje maMur). Bonus +200% obrony liczy UNITS/silnik.
- Zasiegi terytorium do terrain-improvements.json: posterunek zasieg_terytorium=5 (epoka Braz/2), fort zasieg_terytorium=10 (epoka Zelazo/3), miasto zasieg=10.
- 1A: dostep surowca = boolean (zloze+ulepszenie w zasiegu + przetworczy budynek).

## [2026-06-25] OD MASTERA: ZARZADCA AUTOMATYCZNY (9A)
Maciej zatwierdzil w nagłowku miasta akcje "Zarzadca automatyczny" (auto-zarzadzanie miastem: auto-produkcja/auto-przydzial Pracy/pol). To LOGIKA po Twojej stronie — wystaw funkcje auto-decyzji miasta (np. autoManageCity) do wpiecia; UI tylko wlacza/wylacza przez callback.

## [2026-06-25] KOREKTA MASTERA: NAUKA = TWOJ TEMAT (nie EKONOMIA)
Nauka jest w MIESCIE. Model (Maciej): pieniadz miasta z PODATKU dzieli sie na: jednostki / skarbiec / NAUKA / rozwoj. Czesc HANDLU zamienia sie na nauke (zwlaszcza na starcie). Nauka akumuluje sie w MAGAZYNIE (pula nauki) -> wydawana na technologie (research).
TWOJE: model produkcji nauki w miescie (podzial pieniadza + handel->nauka + magazyn). USTAL Z EKONOMIA wspolne zalozenia ekonomiczne (podatek, handel->nauka, ile nauki/ture). Po ustaleniu MASTER przekaze REFERENCJE tempa nauki do CYWILIZACJE (one stroja koszty tech). Drzewko/koszty = CYWILIZACJE; produkcja nauki = TY.


## [2026-06-25] SCALONE -> EKONOMIA
Ten dzial polaczony w EKONOMIA (miasto+gospodarka). Kanal: dyspozycje/EKONOMIA.md. Tu juz nie pracujemy. Pliki MIASTO (kod/Excele/handoffy/folder Civ/MIASTO) = referencja EKONOMIA.
