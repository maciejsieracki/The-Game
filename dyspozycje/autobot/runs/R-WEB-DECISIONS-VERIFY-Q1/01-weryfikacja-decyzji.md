# R-WEB-DECISIONS-VERIFY-Q1 — weryfikacja decyzji właściciela 2026-10-31 (runda 1/5, Operator)

Baza: `origin/main` = `9e54b96f8` (worktree z tego commitu; ROBOCZA `e20eea75`). Zero zmian w `gra/src`, `gra/data`.
Skrypt pomiarowy (nowy): `gra/tools/verify-decisions-picker.cjs` (realny `pickAutoImprovements` + `decideAITurn`, esbuild; wynik: `evidence/verify-decisions-picker.log`).
Live: bundle z `vite build` do scratch poza repo (`/tmp/.../scratchpad/b`, usunięty po etapie), Chromium `/opt/pw-browsers/chromium`.
Konteksty: K1 = gracz „Żywność”, K2 = gracz „Zrównoważone”, K3 = AI cywilizacji.

## 1. Tabela decyzji (23 wiersze rejestru)

Skróty testów: AS = `autoimprove-stages-q1-test` 184/0; WR0/WR2/WRD1 = `wyrab-rzeka-krok0` 3/0, `-r2` 10/0, `-d1` 2/0; AI = `auto-improvements-test` 46/0; AII = `ai-improvements-test` 53/0; AFP = `ai-food-improvement-priority-stages` 13/0; A2H = `ai2-heks-po-heksie` 37/0; HL = `hodowla-las` 113/0; A4P = `ai4-popyt-obywatele` 55/0; AMB = `ai-ulepszenia-malo-budowane` 13/0; SHP = `spichlerz-hud-params-parity` 66/0; CCF = `city-clears-forest` 18/0. Logi: `gate-*.txt` w katalogu runu. M* = pomiar z `verify-decisions-picker.cjs`.

| # | Decyzja | Kod (plik:linia) | Test + wynik | Żywy pomiar (liczby) | Werdykt |
|---|---|---|---|---|---|
| 1 | Kolejność żywności: farma (rzeka, bez lasu) → wycinka+farma → trzoda (rzeka) → irygacja; potem poza rzeką wycinka+farmy | `auto-improvements.ts:519-526` (FOOD_STAGES E1..E6), `:635-733` (kroki), hodowla tylko rzeka `:1354` | AS 184/0, AFP 13/0, WR2 10/0 | M9-K2: `0:wyrab@20,18 0:wyrab@20,17 1:farma 2:bydlo 3:irygacja` (rzeka+las, K2) | ZGODNE (z zastrzeżeniem #P1: wycinka nie sprawdza, czy po niej da się postawić farmę) |
| 2 | „Wolno wycinać las” + „tylko z obywatelami” razem (iloczyn) | `auto-improvements.ts:965-967` (citySkipWyrab), `:987-993` (workedKeys), `main.ts:36176` (getSkipWyrab), `main.ts:36190` (getOnlyWorked) | AS (c3) w ramach 184/0 | M15: toggle OFF → `wyrab@rzeka=2`, `wyrab@poza=0` | ZGODNE z pinem testu (c3). UWAGA: toggle OFF NIE wyłącza wycinki przy rzece (`:965` — `riverForestClearingOnly` ignoruje `skipWyrab`) — zamierzone w kodzie, intencja do potwierdzenia przez właściciela (pytanie ABC dla orkiestratora; nie błąd) |
| 3 | Wycinka przy rzece bez progu lasu i bez wymogu tartaku/obozu; gdzie tartak, tam nie wycinamy | `auto-improvements.ts:1256-1268` (riverKrok0Ok bez lesneMin), `:1377-1391` (strażnik tartak/obóz per heks `:1389`), FAZA 2 `:1476` | WR0 3/0, WRD1 2/0, AS (c) | AS (c): `heks z tartakiem 14,13 NIE jest wycinany` | ZGODNE |
| 4 | Trzoda nie wymaga złoża/zasobów; trzoda i owce NIE na lesie; lama na lesie zostaje | `livestock-unlock.ts:174` (bez wymogu złoża), `improvement-build.ts:452-465` (bydlo/owce w FOREST_BLOCKED), `:443-446` (lama w FOREST_COEXIST), JSON `terrain-improvements.json` bydlo/owce/lama `warunek` | HL 113/0 | M9-K2: `hodowla@las=0`, wycinka przed trzodą | ZGODNE |
| 5 | Trzoda i irygacja poza limitem % puli Pracy; rezerwacja budżetu na najdroższą pozycję | `auto-improvements.ts:522-523` (`exemptPercentCap`), `:669` (`reserveBudgetForMostExpensive`), `:1354-1356` | AS (h) w 184/0 | M12-K2: pct=10% z 400 → `bydlo` ×3 (koszt 20) i `irygacja` ×3 (koszt 60) mimo limitu | ZGODNE |
| 6 | Profil „Żywność”: tylko żywność, bez niedoborów, bez tartaku i obozu | `auto-improvements.ts:73-75` (lista K1), `:82` + `:976` (filtr FOREST_BUILDING_KEYS dla `zywnosc`), `:635` (krok niedoboru tylko `zrownowazone`) | AS (d), AFP | M7-K1: niedobór drewno+glina, las → klucze `farma,wyrab`; zero tartak/obóz/glinianka/droga/fort/posterunek | ZGODNE |
| 7 | „Zrównoważone” gracza = te same zasady co AI; niedobór przestawia priorytet, po zaspokojeniu powrót do żywności | jedna implementacja `pickAutoImprovements`; gracz `main.ts:36163-36240`, AI `ai.ts:2636-2675` | AS (i),(j) | M13-K2/K3: niedobór drewna t4-7 → tartak wyłącznie w t4, po t≥8 zero tartaków; M14: K2 i K3 identyczny zbiór (tura:klucz@heks), n=89=89 | ZGODNE |
| 8 | Tartak tylko przy niedoborze drewna; obóz tylko na heksie z tartakiem | `auto-improvements.ts:1319` (`tartakDozwolony`), `:1358` (blokada), `improvement-build.ts:633` (obóz wymaga tartaku), lista food-only `:90-92` | AS, A4P 55/0 | M2-K2/K3: bez niedoboru tartak=0, obóz=0 (las wokół, wyrąb 16/12) | ZGODNE (część „nie na rzece+las” i „limit” → R5, patrz #P1-#P2) |
| 9 | Próg niedoboru „<10 szt.” zostaje | `data/econ-params.json:834-839` (`pakiet_wielkosc` = 10), `ai-resource-needs.ts:93-110` (`detectPricedResourceDeficits`), `main.ts:20854` | — (bez zmiany kodu) | Pomiar „aktywny w 100% tur” z tematu `R-WEB-LIVE-MEASURE-CLEARING-DEFICIT-Q1` (`3e26efc64`) — nie powtarzany | ZGODNE (kod: próg 10); żywy pomiar: NIE_ZMIERZONO w tej rundzie (poza zakresem, wcześniejszy dowód) |
| 10 | AI bez limitu 1 budowa/miasto | `ai.ts:2648-2650` (brak `maxItemsPerCity` w `sharedOpts`), etap ograniczony `auto-improvements.ts:487` (3) | AS (j), AMB 13/0 | M10-K3: 3 rozkazy w turze 1 (`farma@20,20 farma@17,20 farma@17,21`) | ZGODNE (limit etapu `FOOD_STAGE_MAX_ITEMS_PER_CITY=3` zostaje — INFO) |
| 11 | Niedobór otwiera TYLKO ulepszenia brakującego surowca (bez dróg/fortów/posterunków) | `auto-improvements.ts:535-548` (IMPROVEMENT_FOR_DEFICIT), `:557-565`, `:974-985` (filtr `basePriority`), `:1134-1136` (`defensePriority` puste przy `demandActive`) | AS (R4 testy) | M5-K2/K3 (niedobór drewno+złoto): fort=posterunek=0 | ZGODNE |
| 12 | Centrum miasta = zwykły heks (farma/trzoda/irygacja…), tartaku nie ma (nie ma lasu) | `auto-improvements.ts:987-993` (centrum dopisane do workedKeys dla `zywnosc`/`zrownowazone`), `:1081-1083` (brak filtra centrum), `city-hex-clear.ts:56` | AS (k3), A2H 37/0 | M1-K1/K2/K3: przy pustym zbiorze pracowanych pierwszy pick = `farma@20,20` (centrum) w każdym kontekście | ZGODNE |
| 13 | Drogi na końcu — po zaspokojeniu żywności i surowców | `auto-improvements.ts:735-784` (KROK 3, `roadsPass`), `:974-985` | AS (R4) | M6-K2/K3 (pop 60): drogi=12, firstRoad=21 ≥ lastFood=20; M5: firstRoad=24 ≥ lastNonRoad=23 | ZGODNE |
| 14 | Miasto automatycznie wycina las pod sobą (stare zapisy, presety, granica tury) | `city-hex-clear.ts:56` (`clearForestUnderCity`), `main.ts:14424`, `:14463`, `:41161`, `:41430`, `:41601`, `:41846` | CCF 18/0, live `city-clears-forest-live-test` 17/0 | Chromium: 16 miast na mapie, żadne nie stoi na Las; stary zapis z lasem+tartakiem pod 16 miastami → 0 po wczytaniu; idempotentne (1359=1359); las pod miastem znika po realnym endTurn (1→2) | ZGODNE |
| 15 | Posterunek r=3, fort r=5 = twarde terytorium jak miasto; obcy nic nie zbuduje; limit miast nie dotyczy | `map/territory.ts:5,86`, `fort-territory.ts:109-124` (`fortTerritoryNodes`), `:126-147`, `main.ts:4991`, JSON `terrain-improvements.json:278` (fort 5), `:402` (posterunek 3) | `fort-outpost-hard-territory` 80/0, `territory-border` 9/0, `-dense` 15/0, `improvement-territory-gate` 6/0, `fort-strazniaca-zasieg-zakladania` 85/0, `fort-nodes-save-load` 18/0; live `fort-outpost-territory-live-test` 33/0 | Chromium: fort → 91 heksów (r=5) gracza, posterunek → 37 (r=3); obcy nie buduje ulepszeń ani miasta; właściciel tak; zrzut `evidence/fort-territory-border.png` | ZGODNE |
| 16 | Zdobycie fortu: wejście wojska w stanie wojny; w pokoju nie; armia właściciela → bitwa | `fort-territory.ts:328-349` (`applyFortCaptureByOccupation`: właściciel ma jednostkę → brak zdobycia; tylko `areEnemyOwners`), `main.ts:11683-11687` (wojna), `:14393-14412`, `:13483`, `:31218` | `fort-outpost-hard-territory` 80/0; live 33/0 | Chromium: bez wejścia wojska brak zdobycia; fort zdobyty, terytorium przeszło razem (heksy A: obcy→gracz), stary właściciel 0 heksów; zdobycie także przez koniec animowanego ruchu; zrzut `evidence/fort-territory-border-captured.png` | ZGODNE. Pokój/sojusz: pin w teście jednostkowym (nie powtórzony live) — NIE_ZMIERZONO live. INFO: barbarzyńcy NIE zdobywają fortów (`fort-territory.ts:339` — `!isBarbarianOwner`) — założenie kodu, nie wynika wprost z dyspozycji |
| 17 | Spór fortów: wcześniejszy fort; zdobyty zachowuje wiek; fort w obcym terytorium zablokowany | `fort-territory.ts:69-90` (`nextFortSeq`, `backfillFortOrder`), `:126-165` (`isHexInForeignFortTerritory`, `isHexReservedByRivalFort`) | `fort-nodes-save-load` 18/0; live | Chromium: seq A<B; sporny heks (bliżej B) należy do wcześniejszego A; znacznik kolejności zostaje po zdobyciu | ZGODNE |
| 18 | Bitwa dwóch wojowników bez wodza nie stoi w miejscu | `battle/battleScene.ts:3471` (w `_startBattle` `:3450`) (`_battleAwaitingOrders = true` przy `_startBattle`), `:3509`; test cytuje naprawę `_startBattle` | `battle-standoff-two-warriors-test` 9/9 (w tym `_startBattle without commander 1v1/2v2`) | Chromium na realnej bitwie: NIE_ZMIERZONO w tej rundzie (test na prawdziwej pętli tury, stubuje tylko render/timery/ciosy) | ZGODNE (test); żywy pomiar NIE_ZMIERZONO |
| 19 | Przegrana po utracie ostatniego miasta (także na rzecz barbarzyńców) | `game/victory.ts:211-220` (`checkDefeat`), `:136` (`isEliminated`) | `defeat-last-city-test` 14/0; live `defeat-last-city-live-test` 19/0 (S1,S2,S3) | Chromium: S1 (miasto+osadnik), S2 (bez osadnika) → ekran przegranej po `endTurn`, `gameOver=true`, kolejny endTurn nie rusza tury; S3 (2 miasta, traci jedno) → gra trwa; zrzut `evidence/defeat-S1-osadnik-utrata-miasta.png` | ZGODNE |
| 20 | Rozejm AI na stole i zapis w rozejmie | `main.ts:18085-18205` (`enqueueNegotiationFromAiCmd`, gałąź `neededPn<=0`), `:26278`, `:26362` (zapis/odczyt `truceUntilTurn`), `:10781-10797` (wygaśnięcie) | `diplo-truce-r1` 30/0, `-n6-saveload` 8/0, `-r4-ai` 24/0; live `diplo-truce-ai-table` PASS; live `diplo-truce-saveload` PASS (save 9+, load 9/0, expire 6/0, legacy 4/0) | Chromium: tura 2 — na stole wpis `rozejm` (turns=10) od AI, karta widoczna, akceptacja klikiem; zapis→NOWA strona→pola rozejmu/flaga agresora/casus belli/licznik epoki zgodne; rozejm wygasa w turze U (6) bez kary i bez flagi; stary zapis bez pól wczytuje się; czasy 100 s / 85-91 s per faza | ZGODNE |
| 21 | Spichlerz z JSON + podgląd w panelu miasta | `building-resource-gate.ts:330-362` (`loadSpichlerzDrainParams`), `:411` (drain), `turn-economy.ts:1797` (JEDEN realny drain, `dryRun=false`; `:1358` dry-run), `ui/cityPanel.ts:1283-1288`, `:9295` (te same parametry), `econ-params.json` | `spichlerz-drain-keys` 44/0, `-drain-pipeline` 21/0, `-hud-params-parity` 66/0, `-panel-food-parity` 11/0 | NIE_ZMIERZONO live (parytet podgląd↔silnik pinowany testem SHP) | ZGODNE (test + kod); żywy pomiar NIE_ZMIERZONO |
| 22 | Pula Pracy w zapisie: naprawić, nie zerować | `main.ts:42667-42674`: nadal `maxReasonablePracaPool = max(50, miasta*100)` → `playerPracaPool = 0` | brak testu pinującego nową regułę | Dowód z tematu `R-WEB-LIVE-MEASURE…` (405 → 0); kod identyczny jak w dispatchu | **W TOKU** (R-WEB-SAVELOAD-PRACA-POOL-Q1, runda 1) — w `origin/main` `9e54b96f8` NIEZGODNE (pula 405 przy 1 mieście → reset do 0); oznaczone W TOKU, nie do ponownego dispatchu |
| 23 | Po zakończeniu: merge do main + deploy do ROBOCZEJ + push (stała zgoda) | `LEDGER.md` (proces) | — | — | PROCES — poza zakresem pomiaru kodu (NIE_ZMIERZONO) |

Dodatkowo wprost z dispatchów (dosłowne cytaty / podpunkty):

| Podpunkt | Wynik |
|---|---|
| R5 „tartak nie na heksie rzeka+las; tylko las bez rzeki” | **W TOKU (R5)**; NIEZGODNE w `9e54b96f8`: M4-K2/K3 przy niedoborze drewna i wyłączonej wycince — `tartak@rzeka+las=2`, `oboz_lowiecki@rzeka+las=2` (`tartak@20,18, tartak@20,17`) — brak reguły; strażnik `:1441` działa tylko gdy wycinka na tym heksie jest możliwa |
| R5 „żadnego limitu w niedoborze” | **W TOKU (R5)**; NIEZGODNE: M3 — tartak=2 przy pop 12 (=ceil(12/10)), tartak=3 przy pop 30, a lasów z obywatelami jest 16 (K2 i K3) |
| R5 „wycinka tylko pod farmy, nigdy na zapas” | **NIEZGODNE (nowe, patrz P1 niżej)**: M8 — las na wzgórzach: K1, K2 i K3 wycinają 16/16/12 heksów, farm po wycince 0 (`farma` tylko na centrum) |
| Korekta F (centrum jako zwykły heks, K1/K2/K3) | ZGODNE (wiersz 12) |
| „Drogi na końcu” | ZGODNE (wiersz 13) |
| „Niedobór otwiera tylko ulepszenia brakującego surowca” | ZGODNE (wiersz 11) |
| „Brak limitów” (R5 w toku) | oznaczone W TOKU, lista limitów w sekcji 3 |
| Miasto bez lasu po wczytaniu zapisu | ZGODNE (wiersz 14, live L4: tartak i las pod 16 miastami znikają po wczytaniu) |
| K2=K3 parytet | ZGODNE (M14, `AS (j)`) |
| Profil „Żywność” bez tartaku/obozu | ZGODNE (M7-K1) |
| AI bez limitu 1/miasto | ZGODNE (M10-K3) |
| Spichlerz JEDEN drain + podgląd HUD | ZGODNE (kod + testy), live NIE_ZMIERZONO |

Czerwony test spoza listy decyzji: `food-hodowla-test.cjs` 20 OK / 4 FAIL (`gate-food-hodowla-test.txt`, EXIT=1) — zepsuty przed tą rundą: oczekuje `bydlo` praca +3 (dane 4, `:73`, `:89`) i etykiety dostępu „Trzoda (krowa/świnia)” (`:126`, `:189`). Nie dotyczy decyzji (trzoda bez złoża jest w `livestock-unlock.ts:174`); to martwy/nieaktualny test (patrz sekcja 3, „TEST PINUJĄCY STARE”).

## 2. DO NAPRAWY (priorytet)

**P1 — wycinka lasu bez farmy po wycince (NIE jest w opisie R5; nowa niezgodność).** Decyzja: „wycinka tylko pod farmy, nigdy na zapas / hurtowo”. Pomiar `verify-decisions-picker.cjs` M8: las na terenie bazowym `wzgorza` w zasięgu obywateli — K1 `wyrab=16 farma=1`, K2 `wyrab=16 farma=1`, K3 `wyrab=12 farma=1` (jedyna farma = centrum), kontrola na równinie: `wyrab=16 farma=17`. Przyczyna: wycinka E2/E5/KROK 0 (`auto-improvements.ts:1256-1268`, `:1377-1391`, FAZA 2 `:1476`) sprawdza tylko `qualifies('wyrab')`, nie czy po zniknięciu lasu heks przyjmie farmę (farma tylko Łąka/Równina bez lasu, `improvement-build.ts:369-388`, a `farma` jest w `FOREST_BLOCKED` `:452-457`). Proponowany zakres: bramka „farma po wycięciu możliwa” (teren bazowy łąka/równina; ewentualnie tarasy na wzgórzach po osobnej decyzji) w `riverKrok0Ok` i w gałęzi poza rzeką oraz FAZA 2; test czerwony/zielony na `terenBazowy='wzgorza'` + mutacja; pomiar K1/K2/K3. NIE_ZMIERZONO: inne tereny bez farmy (góry, pustynia) i częstość lasu na wzgórzach w realnych mapach. Uwaga: właściciel wskazał „wycinka tylko pod farmy” w R5 (b), więc może być objęte R5 — do decyzji orkiestratora, czy dopisać do R5.

**P2 — R5 (W TOKU) limit tartaków/obozów `ceil(pop/10)` w kroku niedoboru.** Dowód: M3 (tartak=2 przy pop 12, 3 przy pop 30, 16 lasów dostępnych; K2 i K3). Źródło: `auto-improvements.ts:649, 671, 715, 759` (`limitForestKeysToMinimum: true`), `keyBlockedOnHex` `:1359-1365`, `lesneMin` `:1306`, `JEDEN_NA_ILU_OBYWATELI=10` `:183`. Zakres: R5 (usunąć limit w kroku „brakujący surowiec”; `defenseCap` `:1164` nie dotyczy K2/K3 — `defensePriority` puste przy `demandActive`, `:1133`).

**P3 — R5 (W TOKU) tartak/obóz na heksie rzeka+las.** Dowód: M4 — przy niedoborze drewna i wyłączonej wycince `tartak@rzeka+las=2`, `oboz_lowiecki@rzeka+las=2` (K2=K3). Zakres: reguła w `keyBlockedOnHex` (`:1353`) / w kroku niedoboru: tartak i obóz tylko na heksie z lasem bez rzeki; test (czerwony/zielony) + mutacja.

**P4 — #22 (W TOKU, runda 1).** `main.ts:42667-42674` zeruje pulę Pracy > max(50, miasta×100) przy wczytaniu. Zakres: R-WEB-SAVELOAD-PRACA-POOL-Q1 (bez zmian względem dispatchu).

**P5 (niski) — komunikaty/opisy.** Patrz sekcja 3 (opis profilu `buildModeHud.ts:211`, komentarze).

**Do potwierdzenia przez właściciela (pytanie ABC dla orkiestratora; nie jest defektem kodu).** Czy „Wolno wycinać las = OFF” ma wyłączać także wycinkę przy rzece (dziś nie wyłącza: `auto-improvements.ts:965-967`, pin `AS (c3)`; M15: OFF → rzeka 2, poza 0). Opcje: A zostaw (jak dziś), B OFF wyłącza wszystko, C OFF wyłącza tylko poza rzeką (jak dziś, ale opisać w UI).

## 3. Stare, sprzeczne ustalenia w repo (plik:linia, klasyfikacja)

AKTYWNA SPRZECZNOŚĆ (zmienia zachowanie; wszystko dotyczy R5 w toku, poza P1):
- `gra/src/game/auto-improvements.ts:183`, `:1306`, `:1359-1365` — „1 tartak/obóz na 10 obywateli” jako reguła budowy w kroku niedoboru (K2/K3) przez `limitForestKeysToMinimum` (`:421`, `:649`, `:671`, `:715`, `:759`).
- `gra/src/game/auto-improvements.ts:1319-1343` — `lesneMinSpelnione` bramkuje wycinkę poza rzeką w przebiegach bez `offRiverClearing` (ścieżka zapasowa K2/K3 przy niedoborze drewna: wymaga minimum tartaków i obozów przed wycinką) — pozostałość reguły 1/10.
- brak reguły „tartak nie na rzece+las” (patrz P3) — pozostałość „FOREST_COEXIST” (`gra/src/map/improvement-build.ts:443-446`, tartak i obóz współistnieją z lasem także na rzece).
- `gra/src/game/auto-improvements.ts:1476` (FAZA 2) i wycinka poza rzeką wg `qualifies('wyrab')` — wycinka bez sprawdzenia farmy (P1).
- Aktywne, ale zgodne z decyzją o profilach jawnych: `defenseCap` `:1164` (`ceil(pop/10)`) tylko dla profili „surowce”/„infrastruktura” oraz wywołań bez `demandDriven` — decyzja „bez zmian” (nie sprzeczność).

TYLKO KOMENTARZ/OPIS:
- `gra/src/game/auto-improvements.ts:170-177` (ECHO „1 na 10 obywateli”), `:418-421`, `:514` (E6: „w granicach minimum leśnego ceil(pop/10)”), `:1302-1306`, `:1350-1352` — komentarze opisujące starą regułę jako aktywną (zmienić razem z R5).
- `gra/src/game/fort-territory.ts:4-6`, `:26-28` — „miękka rezerwacja… granice się nie przesuwają”; nagłówek ma adnotację ZASTĄPIONE (`:8-15`), zostaje jako historia.
- `gra/src/types/resources.ts:18` — „Typ hodowla: wymaga zloza startowego + pastwiska” (nieaktualne: trzoda bez złoża, `livestock-unlock.ts:174`).
- `gra/src/ui/buildModeHud.ts:211` — opis profilu „Zrównoważone — żywność, surowce, infra” (sugeruje równoległą budowę surowców i infrastruktury; faktycznie: żywność, niedobór → tylko brakujący surowiec, drogi na końcu).
- `gra/src/game/resource-access.ts:7`, `:50`, `:169-187`, `livestock-unlock.ts:2`, `:141` — „Model B” (historia; zgodne: hodowla bez złoża).
- `docs/archiwum/dyspozycje/MAPA.md:212`, `docs/archiwum/dyspozycje/MAPA-DO-MASTERA.md:265` — „fort 10 / posterunek 5” (archiwum, nie wpływa na grę).
- `gra/tools/fort-outpost-hard-territory-test.cjs:6` — cytuje starą regułę jako zastąpioną.
- Opisy dla gracza (`gra/data/terrain-improvements.json`, `wikiBundle.json`, `docs/PORADNIK-GRACZA/12-dyplomacja.md:319`): fort 5, posterunek 3 — ZGODNE; brak natomiast w opisach tartaku/obozu informacji „tylko przy niedoborze, nie na rzece” (do uzupełnienia po R5).

TEST PINUJĄCY STARE:
- `gra/tools/autoimprove-stages-q1-test.cjs:343-350` (k2) — pinuje limit `ceil(pop/10)` tartaków i obozów w K2/K3 (do zmiany w R5; dziś zielony: 184/0).
- `gra/tools/wyrab-rzeka-d1-test.cjs:7-15` — scenariusz oparty o `lesneMin` (pop 30 → 3); pinuje bramkę minimum leśnego jako istniejącą (sprawdzić w R5).
- `gra/tools/food-hodowla-test.cjs:73`, `:89`, `:126`, `:189` — nieaktualny (czerwony 20/4 na bazie: `bydlo` praca 4≠3; etykieta „Trzoda (krowa/świnia)”); „Model B” — zepsuty niezależnie od decyzji.
- `gra/tools/ai2-heks-po-heksie-test.cjs:264-331` — pinuje `ceil(pop/10)` jako pułap obrony (tylko profile bez `demandDriven`; zgodne z „profile bez zmian”).

## 4. Zakres/ograniczenia pomiaru

- Nie uruchomiono (poza zakresem; zero zmian w kodzie): `diplomacy` 148, `war-era-counter` 82, `ring` 15.
- Live NIE_ZMIERZONO: #9 (próg niedoboru — pomiar wcześniejszy), #18 (bitwa w Chromium), #21 (podgląd HUD), #16 pokój/sojusz live, P1 na realnych mapach.
- Wszystkie żywe testy uruchomiono na bundlu zbudowanym z worktree (`origin/main` `9e54b96f8`), nie na `Gra-ROBOCZA.html`; po etapie scratch (bundle 70 MB) i `gra/node_modules` usunięte.
