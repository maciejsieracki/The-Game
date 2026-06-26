## TWOJ PELNY KONTEKST (czytaj NAJPIERW)
Jestes taskiem **Civ-EKONOMIA**.
TRIGGER: gdy Maciej napisze "start" (albo "sprawdz dyspozycje") -> przeczytaj TEN plik od nowa, wykonaj NAJNOWSZA sekcje (START / DO ZROBIENIA TERAZ / ODPOWIEDZ MASTERA) i raportuj (plik + czat).
WDRAZANIE DYSPOZYCJI: to, co master wpisze Ci do tego pliku (ODPOWIEDZ MASTERA / START / DO ZROBIENIA), WDRAZAJ OD RAZU, BEZ PYTANIA. Pytaj tylko gdy: brak danych do decyzji, blokada, albo master wprost prosi o potwierdzenie.
JESLI MASZ PYTANIE/WATPLIWOSC: zadaj je Maciej W CZACIE (tresc) ORAZ dopisz do dyspozycje/EKONOMIA-DO-MASTERA.md na DOLE z godzina. NIE kasuj wczesniejszych wpisow -- to historia Q&A. NIE uzywaj narzedzia AskUserQuestion ani popupu wyboru -- pytania zadawaj WYLACZNIE zwyklym tekstem w czacie.
AUTONOMIA (lancuch): po KAZDYM ukonczonym kroku -> raport (plik + czat) -> przeczytaj swoj plik OD NOWA; jesli jest kolejny krok lub nowa dyspozycja od mastera, bierz JE OD RAZU (bez czekania na nowe "start"). Zatrzymaj sie TYLKO przy pytaniu/blokadzie albo gdy caly plan wyczerpany (wtedy czekaj na "start").
RAPORTOWANIE WATKU (transparentnosc): gdy zadasz pytanie i master odpowie, ZRAPORTUJ Maciej w CZACIE + dopisz do EKONOMIA-DO-MASTERA.md trzy rzeczy: (1) jakie pytanie zadales, (2) co master odpowiedzial, (3) jaka metode/decyzje przyjales. Maciej ma zawsze widziec caly watek Twojej rozmowy z masterem.
SZCZEGOLOWY ZAKRES: Excel `Status-projektu-The-Game.xlsx` (folder Civ) -> zakladka **Civ-EKONOMIA** (odhaczasz kroki: Status="Zrobione" -> zielony) + "Status wg grup" (filtr Task=Civ-EKONOMIA). [zakladka dodana do Excela po jego zamknieciu]
KANAL: czytasz dyspozycje/EKONOMIA.md; piszesz dyspozycje/EKONOMIA-DO-MASTERA.md ORAZ to samo w czacie.
ZASADY: tylko swoje pliki. Tylko Civ-SILNIK rusza main.ts + publikuje kanon. Build do testu: `npx vite build --outDir /tmp/civ-dist` (zwykly pada na blokadzie OneDrive dist/) -> cp do celu. NIGDY npm run build / export-data.py.
PLIKI KODU (Twoj lane): src/game/economy.ts, turn-economy.ts, upkeep.ts (nowy)
PANEL STEROWANIA (Excele dla Maciej): Ekonomia-parametry.xlsx -> econ-params.json; Surowce.xlsx -> resources.json

---
## PLAN DZIALANIA
[ ] 1. Przejrzec/dopracowac model ekonomii (economy.ts, turn-economy.ts): Praca->Pieniadz->Energia, plony/wzrost/zywnosc, skarbiec/nauka. Zasady spojne z PROJEKT-GRY-master sec.2.
[ ] 2. Napisac game/upkeep.ts: magazyny zywnosci/surowcow + utrzymanie per budynek/jednostka + test.
[ ] 3. Wartosci/wspolczynniki -> Ekonomia-parametry.xlsx + Surowce.xlsx (panel dla Maciej), targeted export do JSON.
(Wpiecie w petle tury robi Civ-SILNIK. Styk z Civ-MIASTO: produkcja konsumuje ekonomie -> handoff przez _handoff/.)

## DO ZROBIENIA TERAZ
Czekaj na sygnal "start" (najpierw sprzatanie). Potem pkt 1.

## HISTORIA
- (nowy task; economy.ts + turn-economy.ts juz istnieja i sa wpiete)

## START — ZIELONE: zacznij od upkeep.ts (NOWY plik, zero kolizji) + przeglad parametrow w Ekonomia-parametry.xlsx / Surowce.xlsx. economy.ts/turn-economy.ts NA RAZIE tylko czytaj -- SILNIK wlasnie wpina ekonomie; zmiany w nich uzgodnij z SILNIK przez _handoff/.

[MASTER 2026-06-23T00:03Z] Self-check przestawiony z co 10 min na CO GODZINE (cron ustawil master, rozlozony w godzinie). Nic nie musisz robic — chodzi dalej, tylko rzadziej.


## [2026-06-24] DYSPOZYCJA MASTERA — model docelowy + decyzje
OBOWIAZUJE CIE PLAYBOOK: Civ/PLAYBOOK-operacyjny-Civ.md, sekcje 11-14 (limity iteracji, wspolpraca/handoffy, 6 technik, sedzia). Pelne zasady czytaj stamtad.
TWARDE LIMITY: loop max 3 przebiegi; verify max 2 cykle; fan-out pilot 2 -> max 10 (Haiku); max 12 subagentow/zadanie; tournament <=6 rund.
WSPOLPRACA: dzial<->dzial NIGDY wprost -> handoff dyspozycje/_handoff/ + meldunek masterowi. Edytujesz TYLKO swoje pliki. Integracja do silnika/kanonu = WYLACZNIE master. Dane wspoldzielone = raz w DANE/JSON, reszta czyta.
SEDZIA: tylko deliverable wysokiej stawki (do silnika/kanonu lub cross-lane) -> osobny swiezy agent wg DoD; rutyna = wlasne testy.
TRYB: event-driven — ruszasz gdy Maciej Cie wywola; bez auto-petli.
DECYZJE: Q2 awans budynkow = +10% SKLADANY (zatwierdzone). Podatki v0.1 = floor(populacja*stawka), stawka DOMYSLNIE 0. player-economy.ts -> SKONSOLIDOWAC do upkeep.ts. STATUS: logika dowieziona -> standby integracyjny (wpina master). Przy hydracji: regen swojego Excela. Technika: loop-until-done na testach; tournament przy wariantach balansu.


## [2026-06-24] OGLOSZENIE: SILNIK = MASTER
Dzial SILNIK zostal WCHLONIETY do mastera — to MASTER jest teraz silnikiem i integratorem. NIE ma osobnego okna Civ-SILNIK.
WSZYSTKO zwiazane ze spinaniem/wpinaniem do silnika lub kanonu (moduly, kontrakty, instrukcje wpiecia + DoD) zglaszaj MASTEROWI:
handoff w dyspozycje/_handoff/<TWOJ>-do-MASTER_<temat>.md + meldunek w <LANE>-DO-MASTERA.md. Master decyduje o wpieciu i publikuje kanon.
Pliki SILNIK (Civ/SILNIK/) zostaja jako referencja.


## [2026-06-24] REGULA: BACKUP PRZED ZMIANA (rolling)
Przed KAZDA zmiana pliku: `cp <plik> <plik>.bak-<TWOJ_DZIAL>` (1 rolling backup = ostatnia ZIELONA wersja). Edytuj plik roboczy, backup zostaje. Raportuj „zrobione" DOPIERO po: testy zielone (+ sedzia OK przy wysokiej stawce). Nastepny cykl: nadpisz backup swiezym z aktualnej dobrej wersji; nowe zmiany ZAWSZE do pliku roboczego, NIGDY do backupu. Padnie -> `cp .bak -> plik` (revert).

## [2026-06-24] DECYZJE MACIEJ
- Q2 awans budynkow = +10% SKLADANY (10%) — POTWIERDZONE.
- PODATEK: baza do potwierdzenia przez Maciej (od populacji / od pieniadza-dochodu miasta / od luksusu). Do tego czasu stawka 0. Po decyzji dodasz param+funkcje.
- player-economy.ts: ZWERYFIKOWANE = duplikat + orphan. Konsolidacja (usun player-economy.ts + rename upkeep.ts -> economy-upkeep.ts + aktualizacja importow) ROBI MASTER w plastrze EKONOMIA. Ty: standby na wpiecie.

## [2026-06-24] ZAŁOŻENIA: system WEALTH (po recenzji sędziego) + PYTANIA do Maciej

PODZIAŁ PIENIĄDZA (istnieje, zostaje): M_base/turę miasta -> suwaki: %nauka (R) + %skarbiec/podatek (T) + reszta dla społeczeństwa (S=100−R−T, "w kieszeniach obywateli").

NOWE — WEALTH (W):
1. W = poziom, cap epoki: W_max(epoka)=epoka×10 (e1=10 ... e10=100).
2. WZROST (jak zboże->populacja): S akumuluje pulę_W; pula_W ≥ prog_W[poziom] -> W+1; kolejny poziom = większy próg.
3. MNOŻNIK: M_eff = M_base × (funkcja W). Niższe podatki -> wyższe W -> większa gospodarka -> finalnie większy skarbiec.
4. UTRZYMANIE+DECAY: każdy poziom wymaga uzupełniania (upkeep_W); S<upkeep -> pula maleje -> poziom spada. Nagła podwyżka podatków -> szybki spadek W.

SĘDZIA — 3 SPRAWY BLOKUJĄCE (do rozstrzygnięcia przed Excelem):
- Mnożnik ×W (×10 na maxie) = runaway/śnieżna kula bez kontry. Rekomendacja: złagodzony 1+(W−1)×k z górnym capem.
- Przepływ niejasny: czy S NAPRAWDĘ znika z kieszeni do puli_W (czuje się jak podatek), czy pula tylko ODWZOROWUJE majątek (S nadal "wolne"). Trzeba wybrać.
- Dominująca strategia „T=0,R=0,S=100% na start": bez kary za niskie W i przy znanych progach optymalizacja jest trywialna/nudna.

PYTANIA DO MACIEJ (odpowiada w tym oknie):
[BLOKUJĄCE]
P1. Mnożnik: ×W czy złagodzony 1+(W−1)×k (+ cap)?
P2. W=0 w mnożniku = 0 (zabójcze) czy 1 (baseline)? Jakie startowe W?
P3. Przepływ: S znika do puli_W czy pula tylko odwzorowuje majątek?
P4. Kara za bardzo niskie W (rebelia/utrata) + progi znane czy ukryte? (przeciw degeneracji)
[WAŻNE]
P5. Wealth per MIASTO czy globalny? Jeśli per miasto — agregacja na cyw (średnia/suma/najsłabsze)?
P6. Mnożnik dotyczy całego pieniądza miasta czy tylko skarbca? Czy podnosi też koszty utrzymania w bogatym mieście?
P7. Próg kolejnego poziomu liniowo czy kwadratowo? Ile tur do W=5 przy "normalnym" S?
P8. S napędza zadowolenie ORAZ Wealth (potwierdzić) — czy to nie czyni S zawsze optymalnym?
P9. Decay: rozdzielić odpływ z puli (bufor) od spadku poziomu?
[PROJEKTOWE — później]
P10. Czy W wpływa na coś poza pieniądzem (zadowolenie/militaria/dyplomacja)?
P11. W przy podboju/zniszczeniu miasta?  P12. Czy inni widzą W gracza?  P13. Redystrybucja między miastami?  P14. Interakcja z inflacją?

PO ODPOWIEDZIACH: parametry -> Excel EKONOMIA (prog_W_base, prog_W_wzrost, W_max=epoka×10, mnożnik+k+cap, upkeep_W, decay_W, prog_spadku); implementacja w module; testy; handoff do mastera (wpięcie do tury). Backup przed zmianą.


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

## [2026-06-24] OD MIASTO (cross-lane, przez master): COMPOUND + growthMult
- economy.ts buildingValue liczy LINIOWO. Decyzja Maciej (Q2)=COMPOUND baza×1,10^(poziom-1). Helper gotowy (MIASTO): production.buildingEffectAtLevel + BUILDING_LEVEL_FACTOR. Zmigruj: economy.ts (buildingValue), player-economy.ts (utrzymanie), siege.ts; buildings.json 'przyrost' do migracji.
- order.ts zwraca growthMult -> potrzebny HOOK w turn-economy (produkcja juz x productionMult po stronie MIASTO). Wpiecie growthMult do tury robi master w plastrze EKONOMIA — uzgodnij kontrakt z turn-economy.


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
1. [BLOK: W1-W6 Maciela] WEALTH (game/wealth.ts): przygotuj SZKIELET modulu + testy juz teraz, zeby wpiac OD RAZU po decyzji.
2. [ROB] Konwertery/upkeep w runtime sa no-op: brak city.surowce + listy zbudowanych budynkow per miasto (upkeep budynkow=0). Uzgodnij kontrakt z MIASTO/master, zeby dane realnie splywaly — bez tego ekonomia jest okrojona.
3. [BLOK: baza podatku] przygotuj funkcje taxIncome gotowa do wpiecia.

## [2026-06-25] OD CYWILIZACJE (przez master): kontrakt TEMPO NAUKI
CYWILIZACJE stroi koszty technologii i potrzebuje od Was REFERENCJI (kosztow nie zmieniaja, 1a):
1. Ile Nauki/ture produkuje miasto wg turn-economy/economy.ts — bazowo + z czego (udzial z Handlu, budynek_biblioteka_bonus_nauki itd.).
2. Rzad wielkosci wczesnej gry: Nauka/ture przy 1 / 3 / 5 miastach.
3. Czy jest globalny mnoznik tempa nauki (do strojenia) i gdzie.
Odpowiedz handoffem -> ja przekaze CYWILIZACJE. (Produkcja nauki = Wasze; drzewko/koszty = CYWILIZACJE.)

## [2026-06-25] DECYZJE MACIEJA (przez master)
- 1A: Surowiec = TYLKO DOSTEP (boolean); NIE zliczamy ilosci produkcji surowca. converters/ilosciowe zaparkowane.
- 2A (z korekta): Handel->Pieniadz = MNOZNIK (nie plaski), na POZIOMIE CYWILIZACJI, gated po Walucie+Mennicy. BAZA mnoznika = 2 (byl za wysoki). Per-nacja wariacja (troche wiecej/mniej) przychodzi z CYWILIZACJE. Mennica = pole `mnoznik` w buildings.json (odblokowuje/realizuje mnoznik).
- Zelazo = pusty SHELL w v0.1 (1A) — nie projektuj budynkow Zelaza teraz.

## [2026-06-25] KOREKTA MASTERA: NAUKA = MIASTO (cofam "kontrakt do Was")
Cofniete: wczesniejszy "kontrakt tempo nauki -> EKONOMIA". Nauka NIE jest u Was jako wlasciciel — jest w MIASTO (podzial pieniadza miasta: jednostki/skarbiec/nauka/rozwoj). WASZA ROLA: wspol-ustalic z MIASTO zalozenia ekonomiczne (podatek, handel->nauka na starcie, magazyn). Nie odpowiadajcie "ile nauki" solo — wypracujcie z MIASTO. Wynik master przekaze CYWILIZACJE.


## [2026-06-25] WCHLONIECIE: MIASTO scalone do EKONOMIA (decyzja Macieja)
Dzial EKONOMIA = teraz MIASTO + GOSPODARKA w jednym (koniec rozjazdu/dublowania). Przejmujesz CALY zakres MIASTO.
KOD (Twoje): cities.ts, production.ts, order.ts, culture-religion.ts + economy.ts, turn-economy.ts, economy-upkeep.ts, converters.ts.
DANE/EXCELE (Twoje): Budynki.xlsx, miasto-params.json, Spoleczenstwo-parametry.xlsx, terrain-improvements.json + Ekonomia-parametry.xlsx + econ-params/society-params/buildings.json.
ZAKRES: produkcja + budynki (compound) + porzadek + kultura + religia + zadowolenie + zakladanie miast (canFoundCity/foundCityAt) + plony/wzrost + PODZIAL PIENIADZA miasta (jednostki/skarbiec/NAUKA/rozwoj) + magazyn nauki + utrzymanie + konwertery + dostep surowcow + Wealth + podatek + mnoznik Handel->Pieniadz + zasiegi terytorium (liczby) + maMur/budynek 'Mury'.
DYSPOZYCJE I HANDOFFY MIASTO sa teraz TWOJE (kontekst/historia): dyspozycje/MIASTO.md + MIASTO-DO-MASTERA.md + dyspozycje/_handoff/MIASTO-* + folder Civ/MIASTO/. PRZECZYTAJ je, to Twoja pamiec dzialu.
Tematy ktore byly handoffem MIASTO<->EKONOMIA (nauka, compound, growthMult, podzial pieniadza) = juz NIE handoff, robisz wewnatrz.
Kanal/self-check zostaje: dyspozycje/EKONOMIA.md + EKONOMIA-DO-MASTERA.md.


## [2026-06-25] ZADANIE (po scaleniu): MODEL NAUKI = WSPOLNA PULA (decyzja Macieja)
Trafia do Ciebie, bo wchlonelas MIASTO. Zbuduj mechanike:
- podatek miasta dzieli sie m.in. na NAUKE (suwak/udzial),
- nauka kapie do JEDNEJ globalnej PULI gracza (magazyn nauki),
- gracz kupuje dowolna technologie spelniajaca prereqi gdy pula >= Koszt nauki (koszty z tech.json, bez zmian).
Zrodlo/specyfikacja: _handoff/CYWILIZACJE-do-MASTER_model-nauki-dla-MIASTO.md.
Podzial: TY = UI magazynu + suwak podzialu pieniadza + zakup tech z puli (+ agregacja globalna). MASTER = wpiecie research.ts (postep->pula+kup) w petle tury. CYWILIZACJE = chooseAIResearch GOTOWE (kompatybilne, nie blokuje).

- DOMKNIECIE listy KOD EKONOMIA: dochodzi tez `src/game/auto-manage.ts` (autoManageCity, zarzadca automatyczny 9A, test 26/26). Wpiecie w peltle tury = kolejka SILNIKA (handoff _handoff/MIASTO-do-MASTER_zarzadca-automatyczny.md).

## [2026-06-25] MASTER -> EKONOMIA (techniczne, od reki)
- GRANICA potwierdzona: playerState.ts (skarbiec + PULA NAUKI + HUD) = MASTER. Produkujesz Nauke/ture per miasto i oddajesz do puli; puli nie trzymasz. Twoja propozycja OK.
- KONTRAKT dla CYWILIZACJE (ich pkt5 budzet AI): wystaw prosty kontrakt koszt jednostki/budynku vs skarbiec (getProductionBudget/canAfford). Zloz handoff EKONOMIA->CYWILIZACJE.
- Model ekonomii (zdrowie/rozwoj/podatek-baza/konwersja wioski) = pytam Macieja ABC; po decyzji robimy wspolny dokument.


## [2026-06-25] PYTANIE MASTERA (PILNE, odpisz w -DO-MASTERA): KOSZTY / SUBAGENCI
Czy na pewno ciezka robote (kod/build/testy) realizujesz przez SUBAGENTOW na SONECIE (tanszy),
czy nadal robisz wszystko w glownym oknie BEZ wywolania subagenta? Odpowiedz wprost: TAK-subagenci-Sonnet / NIE-glowne-okno.
Jesli NIE: od teraz OBOWIAZKOWO deleguj kod do subagenta na Sonecie. Palimy limit za szybko.

## [2026-06-25] DECYZJE MACIEJA -> EKONOMIA (relay)
1 (ZDROWIE): zrob PELNY model zdrowia miasta — bonusy, minusy, zaleznosci. (nie wycinamy)
2 (PODZIAL w miescie): PRACA = osobny suwak (budynki<->pula Pracy). HANDEL/PIENIADZ = JEDEN kubelek dzielony % na: SKARBIEC + WEALTH + BADANIA. Po wynalezieniu PIENIADZA (tech Waluta) odblokuj konwersje PRACA->Pieniadz.
3 (PODATEK/DEFAULTY): bazowa stawka podatku = 10%. Domyslny podzial puli ~70% skarbiec / 20% badania / 10% podatek; gracz potem ustawia suwaki sam. Warstwa "udzial badan/rozwoju rosnie z rozwojem/epokami" = NIE teraz, zostaw HOOK (wlasciciel docelowy = CYWILIZACJE). Jesli 70/20/10 nie spina sie z kubelkiem (skarbiec/wealth/badania) — NIE zgaduj, opisz rozjazd w dokumencie modelu i oddaj do Macieja.
5 (MNOZNIK Handel->Pieniadz): przyjete — baza 2, widelki 1.7-2.4 per nacja (mechanika u Ciebie; wartosci per-cyw wpisuje CYWILIZACJE; gated Waluta+Mennica).
6 (ULEPSZENIA TERENU): zamiast przyjmowac wartosci — wyeksportuj je do EDYTOWALNEGO Excela (bonusy/koszty ulepszen + posterunek: promien 3?, utrzymanie?) do DECYZJI i ustawienia przez Macieja. Ty wybierasz kanoniczna lokalizacje arkusza (Twoje Excele).
9 (WEALTH): przyjmij swoj SZKIELET jako baze, dostroimy pozniej. Mozesz isc.
Tryb: ciezka robota = subagent Sonnet, build do /tmp, bez kanonu; pytania projektowe -> Maciej (przeze mnie).


## [2026-06-25] OBOWIAZEK: format pytan = ABC (polecenie Macieja)
KAZDE pytanie do mastera/Macieja zadawaj ZAWSZE w formacie ponumerowanym z opcjami:
1) <pytanie> -- A) ... B) ... (C) ...)  [oznacz rekomendacje]
2) <pytanie> -- A) ... B) ... (C) ...)
Najpierw ZNAJDZ kilka realnych rozwiazan/opcji, potem podaj jako 1 ABC / 2 ABC. Zero pytan otwartych, zero dowolnej formy. To OBOWIAZEK -- ujednolicamy obieg, bo kazdy pyta inaczej.

## [2026-06-25] KOREKTA MODELU NAUKI (decyzja Macieja: 1a)
Nauka = STEROWANA PRZEZ GRACZA. Gracz sam wybiera CEL badan i kieruje pula; ZNIKA auto-zakup "gdy pula >= koszt". Pula zbiera sie na wskazany cel; gracz moze cel zmienic.
- Mechanika u Ciebie (EKONOMIA): wybor celu badan (stan + UI) + akumulacja puli na cel + odblokowanie po osiagnieciu kosztu wybranej tech.
- Przeciwnicy-AI: BEZ ZMIAN — dalej wybieraja wlasne tech (chooseAIResearch). Korekta dotyczy tylko automatu GRACZA.
- Silnik (master): research.ts — usuwam auto-zakup gracza, wpinam cel ustawiany przez gracza; wejdzie w kolejnym batchu silnika.

## [2026-06-25] MASTER -> EKONOMIA: odpowiedz UI ws. OKOLICY (2 handoffy)
UI czeka na Ciebie (wchlonelas MIASTO): _handoff/UI-do-EKONOMIA_zasieg-okolicy.md + _okolica-jak-podejsc.md. Pytania: (1) ktory zasieg dla v0.1 + liczenie plonow vs terytorium, (2) progi pop->promien r5/10/15 i czyj to parametr, (3) hak dla UI (getCityWorkedRange / getWorkedTiles), (4) render okolicy: panel vs mapa swiata, (5) scope v0.1 (pelny zasieg vs skalowanie wydajnosci). Odpowiedz UI handoffem; co wymaga decyzji Macieja (gameplay/scope) -> oznacz i podaj mi jako ABC, NIE zgaduj.

## [2026-06-25] MASTER -> EKONOMIA: dane zapasow do OBLEZENIA (od UNITS)
UNITS buduje oblezenie i potrzebuje od Ciebie (handoff _handoff/UNITS-do-EKONOMIA_zapasy-oblezenie.md):
- POLE zapasu zywnosci miasta do czytania w turze oblezenia (jest juz City.magazynZywnosci? + City.population) -> potwierdz/formalizuj kontrakt (np. getCityFood(cityId) + pole).
- FLAGA 'miasto oblegane': gdy oblegane -> dochod zywnosci z pol = 0 (magazyn TYLKO maleje: magazyn -= populacja+garnizon). Dodaj obsluge w turn-economy (nie naliczaj dochodu pol przy obleganiu).
Odpowiedz UNITS kontraktem: nazwa pola zapasu + jak ustawiana/odczytywana flaga oblezenia.

## [2026-06-25] DECYZJA MACIEJA: zasieg = populacja (1:1); okolica = terytorium
okolica.ts cityRangeForPopulation = min(pop, cap) -> to JUZ jest radius=pop, OK (potwierdz). Cap (zasieg_okolicy_max=15) = WSPOLNY dla okolicy I terytorium. Terytorium na mapie (MAPA territory.ts) ma uzywac tej samej formuly (radius=pop). Owniesz liczbe/cap — jak chcesz inny cap niz 15, daj znac.

## [2026-06-25] ZAWIESZONE (Maciej): Epoka Zelaza
Maciej ZAWIESIL decyzje o Zelazie. ZAMROZ kaskade w obecnym stanie: NIE buduj wiecej Zelaza (tech.json + 11 budynkow co JUZ jest — zostaje, ale nie rozszerzaj: brak nowych budynkow/surowcow/jednostek Zelaza). Czekamy az Maciej ODWIESI. Test gra dalej na Kamien+Braz (+ to co juz w danych).

## [2026-06-25] ODWOLANIE ZAMROZENIA (Maciej: nie zamrazamy)
Freeze Zelaza ANULOWANY. Decyzja A/B/C wkrotce od Macieja. Pracuj normalnie, czekaj na decyzje.

## [2026-06-25] DECYZJA MACIEJA: Warsztat oblezniczy = odblokowuje machiny
Budynek 'Warsztat oblezniczy' UMOZLIWIA budowe dodatkowych machin oblezniczych: Taran, Katapulta, Wieza oblezicza. Twoja czesc (budynki): warsztat nadaje flage-enabler (maWarsztatOblezniczy) + odblokowuje produkcje machin w miescie. EPOKI: machiny sa od roznych epok (Taran=Kamien, machiny=Braz, Katapulta=Zelazo) -> warsztat musi byc dostepny OD epoki najwczesniejszej machiny ktora odblokowuje (jak ma odblokowywac Taran -> warsztat od Kamienia; ew. warsztat podstawowy/rozbudowany per epoka). Uzgodnij z UNITS.

## [2026-06-25] KOREKTA (superseduje poprzednia): Warsztat oblezniczy = TYLKO Katapulty
Maciej: Warsztat oblezniczy (budynek Zelaza) buduje TYLKO Katapulty. Flaga maWarsztatOblezniczy = prereq KATAPULTY (nie Tarana/Wiezy). Taran + Wieza oblezicza NIE wymagaja warsztatu — budowane przy OBLEZENIU (in-siege), patrz UNITS/SILNIK. Warsztat zostaje budynkiem Zelaza.

## [2026-06-25] KOREKTA (Maciej): Warsztat oblezniczy -> SREDNIOWIECZE (nie Zelazo)
Katapulta wchodzi od SREDNIOWIECZA (nie Zelaza). Warsztat oblezniczy = budynek od Sredniowiecza (buduje/dobudowuje Katapulty do armii). PRZENIES Warsztat oblezniczy z zestawu budynkow ZELAZA na SREDNIOWIECZE (poza v0.1) -> zmniejsza zestaw Zelaza. Dla v0.1 oblezenie = Taran(Kamien)+Wieza(Braz) in-siege, BEZ warsztatu.

## [2026-06-25] DECYZJA MACIEJA: 1A — ZELAZO WCHODZI do v0.1 (3 epoki)
Domykamy Zelazo (GO). Twoje: dokoncz budynki Zelaza (11 minus Warsztat oblezniczy -> przeszedl na Sredniowiecze, czyli ~10), surowce ZELAZO + STAL (resources.json, koordynuj z MAPA/DANE), efekty budynkow Zelaza w ekonomii.

## [2026-06-25] MASTER -> EKONOMIA: fix lazaret epokaWejscia (test pada)
koszary-gate-test pada: lazaret.epokaWejscia=5 w buildings.json, test oczekuje 4. To Twoj budynek (medyczny, Zelazo). Ustal POPRAWNA epoke lazaretu i zsynchronizuj buildings.json <-> koszary-gate-test (dane na 4 ALBO test na 5 — wg Twojej intencji). Po fixie master przebuduje kanon. Nie zgaduje za Ciebie epoki.

## [2026-06-26] MASTER WYKONAL (info): wpiete Wasze
- walutaOdkryta: ustawiana z player.zbadane('Waluta') w turn-economy -> mnoznik Handel->Pieniadz x2 AKTYWUJE sie po Walucie (Twoj currency-final wpiety).
- Naprawione flagi budynkow w advanceCityEconomy: maTargowisko/maMlyn/maCegielnia/maBiblioteka/maMennica brane z builtIds (byly na stale false!). Sygnatura advanceCityEconomy rozszerzona o playerZbadane.
- DECYZJA MACIEJA wciaz otwarta: czy x2 na CALA pule Handlu (nauka+Wealth) czy tylko Skarbiec — podam mu.

## [2026-06-26] DECYZJA MACIEJA: Waluta x2 = CALA pula Handlu
Mnoznik x2 po Walucie dziala na CALA pule Handel->Pieniadz: Skarbiec + Badania/nauka + Wealth (wszystkie czesci podzialu), NIE tylko Skarbiec. Stosuj x2 na cala pule Handlu PRZED/PONAD podzialem, zeby kazdy kubelek dostal x2. Engine juz ustawia walutaOdkryta; Ty pilnujesz zakresu mnoznika = cala pula.
Druga kwestia (Efekt 2 Praca->Pieniadz z doPuli/nadwyzki po budowach): jedz wg swojej rekomendacji (nadwyzka), chyba ze Maciej zmieni.

## [2026-06-26] DECYZJA MACIEJA: Lazaret = SREDNIOWIECZE (przyszlosc), nic teraz
Lazaret nie nalezy do v0.1 (to budynek/jednostka SREDNIOWIECZA). NIE gate'uj go, nie poprawiaj teraz — zostaje na przyszlosc. Jak masz go w zestawie budynkow Zelaza, to bledne przypisanie (do poprawy pozniej, nie teraz). Test koszary-gate na epoce lazaretu = ZNANY/OCZEKIWANY czerwony do czasu wdrozenia Sredniowiecza; nie liczyc jako regresja.
