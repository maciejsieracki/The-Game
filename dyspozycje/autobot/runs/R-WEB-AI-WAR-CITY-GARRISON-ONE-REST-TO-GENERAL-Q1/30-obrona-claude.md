# R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1 — raport obrony Operatora, runda 1 (odpowiedzi na zarzuty Evaluatora 23ab356d1)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (AI wojna / rozmieszczenie wojsk)
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: w wojnie każde miasto AI z jednostką bojową na heksie zatrzymuje JEDNĄ jednostkę jako garnizon, reszta idzie do generała; puste miasta uzupełniane (przesunięcie najbliższej wolnej albo rekrutacja najtańszej, DODATEK 1).
BAZA: `cb077b588` (origin/main). Kandydat startowy: `4609fc88d`. Poprawka obrony: commit podany w sekcji ZMIANY-COMMIT (SHA końcowy w polu `sha` zwrotu).

## ZMIANY-COMMIT
- `gra/src/game/ai.ts` (allowlista): w `applyWarAllInCapitalToCommands` jednostka z miasta NIE jest garnizonem, gdy w tym mieście stoi już jednostka bojowa z `ruchLeft <= 0` (ona i tak zostaje). Dotyczy tylko miast z ruchliwymi jednostkami; garnizon bez zmian w pozostałych przypadkach. Brak zmian w rekrutacji, parametrach, `main.ts`.
- `gra/tools/ai-war-city-garrison-test.cjs` (allowlista): T2 przepisany na miasto z DWOMA ruchliwymi jednostkami (dokładnie jedna zostaje, druga idzie); nowy T6 (miasto z unieruchomionym obrońcą: obie ruchliwe jednostki wychodzą). Dotychczasowy T2 był pusty (oba testowe oddziały w mieście C nie dostawały rozkazu ruchu ani na bazie, ani na kandydacie) — zarzut 5 przyjęty.
- `gra/tools/ai-army-scattered-merge-test.cjs` (allowlista): asercje S1 i S3 zmienione z „16 w jednym stosie” na „15 maszeruje jako jedna armia, 1 zostaje garnizonem” (zamierzona zmiana reguły właściciela, patrz zarzut 3/4).
- `gra/tools/ai-army-replacement-concentration-test.cjs` (allowlista): asercja S3 (jedyna jednostka w mieście zbiórki) zmieniona z „rusza po max czekaniu” na „jest garnizonem i nie rusza (t=null)”.
- Raport: `dyspozycje/autobot/runs/R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1/30-obrona-claude.md` (ten plik).

## ODPOWIEDZI NA ZARZUTY
1. **Rdzeń żądania (puste miasta nie są uzupełniane) — PRZYJMUJĘ, NIE WDROŻONE w tej rundzie.**
   - Wariant (a) przesunięcia najbliższej jednostki: odrzucony po pomiarze w rundzie 1 (`ai-war-defend-home-test` 3 FAIL: przesunięta jednostka odchodzi z obrony domu, miasto przechodzi). Ponownie nie mierzony w tej obronie.
   - Wariant (b) rekrutacji najtańszej w istniejącym budżecie: NIE ZROBIONY. Ścieżka zakupu jednostek (`purchaseRecruitmentUnit`, wykonanie zakupu i kolejka) jest w `gra/src/main.ts`, a allowlista tematu tego pliku zakazuje (`NIE: main.ts`). Bramka decyzji (`shouldAIPurchaseUnit`) jest w ai.ts, ale sama egzekucja i wybór miasta nie. Ten wariant wymaga rozszerzenia allowlisty na main.ts — DECISION_REQUIRED dla orkiestratora.
   - Zarzut „DODATEK wprost zakazuje tylko nowych parametrów, nie rekrutacji" — zgadzam się, rekrutacja w istniejącym budżecie jest dozwolona, ale wymaga zmiany poza allowlistą (main.ts).
2. **Faza 1 i kryterium dodatkowe NIE ZMIERZONE — PRZYJMUJĘ.** Brak tabeli % miast AI bez jednostki (tury 10/30/60/100, ≥3 ziarna, wojna/pokój), brak biegu 3 ziarna × 100 tur i czasu tury. Powód: żywy bieg wymaga przeglądarki (`ai-economy-measure-run.cjs`, Chromium + bundle vite, max 1 naraz), a sim zastępczy `ai-war-defend-home-measure.cjs` nie liczy metryki „miasto bez jednostki” ani nie ma przełącznika garnizonu. NIE ZMIERZONO.
3. **Regresje w istniejących testach — PRZYJMUJĘ CZĘŚCIOWO, z dowodem.**
   - `ai-army-scattered-merge-test` S1 i S3: zmiana oczekiwania z 16 na 15 (1 garnizon). Po zmianie: `33 passed, 0 failed` (kandydat 4609fc88d dawał 31/2). To jest zamierzona zmiana reguły właściciela („w każdym mieście zostaje jedna jednostka”), a nie regresja jakości; asercje zmienione, nie usunięte. DECISION_REQUIRED: akceptacja zmiany asercji przez właściciela/orkiestratora.
   - `ai-army-replacement-concentration-test` S3 (jedyna jednostka w mieście zbiórki): zmiana oczekiwania na „garnizon, nie rusza”. Na bazie cb077b588 ta sama asercja daje `FAIL ... (t=6)` (baza rusza po 6 turach), na kandydacie PASS.
   - `atrybucja` — ODRZUCAM jako regresję tego tematu. Dowód: po podmianie `gra/src/game/ai.ts` na wersję z `cb077b588` (`git show cb077b588:gra/src/game/ai.ts`, tymczasowo, przywrócone cmp-em) test daje `33 passed, 2 failed`, a jednym z dwóch FAIL jest `FAIL: atrybucja: nowa bramka zbiorki stosu nie pogarsza udzialu marszow ponizej progu wzgledem czystego main`. Czyli asercja jest czerwona także na bazie (dług bazowy, zgodny z zarzutem Evaluatora dla bazy). Na kandydacie wynik: `34 passed, 1 failed` (tylko `atrybucja`) — ta sama asercja, tylko S3 już zgodna z nową regułą.
4. **Zmiana zachowania wykracza poza GOAL (stos/muster/armia zastępcza) — PRZYJMUJĘ JAKO RYZYKO, NIE ZMIENIONE.** Reguła garnizonu zatrzymuje jedną jednostkę także w mieście ze stosem zbiórki. To zamierzone wg DODATKU 1 („każde miasto AI ma być pilnowane”), ale ma dwa skutki uboczne, które wymagają decyzji właściciela: (a) stos 16 w mieście wysyła 15 (osłabienie ofensywy o ~6%); (b) pojedyncza jednostka w mieście zbiórki zostaje garnizonem i nigdy nie dołącza do armii (`ai-army-replacement-concentration-test` S3, t=null). Nie zmierzono na żywym biegu. Możliwe zawężenie (np. nie garnizonować miasta będącego punktem zbiórki aktywnej armii) to osobna decyzja — NIE wdrażam bez zgody.
5. **Test T2 słaby i brak asercji dla ruchLeft==0 / cywilnej / zwiadowcy / keep / pokoju — PRZYJMUJĘ, WZMOCNIONE.**
   - T2 przepisany (dwie ruchliwe jednostki w A: dokładnie jedna zostaje). Dowód: na bazie `GARRISON_BASELINE=1` z `cb077b588` daje `FAIL T2 ... (rozkazow: 1,1)` (obie wychodzą), na kandydacie PASS.
   - Zarzut „brak asercji dla ruchLeft==0” — PRZYJĘTY I NAPRAWIONY w ai.ts (patrz ZMIANY). Nowy T6: miasto A z unieruchomionym obrońcą (ruchLeft 0) i dwoma ruchliwymi: obie wychodzą. Dowód: kandydat `4609fc88d` daje `FAIL T6 ... (rozkazow: 0,1)` (druga jednostka była niepotrzebnie zatrzymana), poprawka `6 PASS, 0 FAIL`.
   - Cywilna/zwiadowca: `isCivilianUnit`/`isScoutUnit` są filtrowane przed garnizonem (kod: `atCity` i `eligible`). Test nie dodany: próbny fixture z `typeId: 'Osadnik'` został w harnessie potraktowany jako wojskowy, a nie zweryfikowałem, jakie pola rozpoznaje `isCivilianUnit`. NIE ZMIERZONO (do zrobienia z poprawnym fixturem).
   - Scenariusz pokoju: garnizon wchodzi wyłącznie przez `applyWarAllInCapitalToCommands`, wołany tylko z gałęzi wojny (`opts.warAllIn.targets.length > 0`). Brak osobnego testu pokoju — NIE DODANO.
6. **Braki procesowe — PRZYJMUJĘ, z uwagą.**
   - Kryterium (e) (stała lista deployu): w repo jest bramka referencyjna w `docs/decyzje/R-PROC-AUTOBOT.md` §6 („Nowa bramka istnieje dopiero wtedy, gdy jest w tej tabeli”). Nowy test `ai-war-city-garrison-test.cjs` NIE został wpisany do §6 — to dokument poza allowlistą tematu. DECISION_REQUIRED: wpis do §6 przez orkiestratora.
   - Kryterium (f) (dług Rust): w `rust-port/` nie ma odpowiednika `applyWarAllInCapitalToCommands` ani reguły garnizonu (`grep -ril "allin|all_in|garrison|garnizon" rust-port` trafia tylko w `recruitment.rs`, `building_costs.rs`, `barbarians.rs` i testy do nich — inne zakresy). Dług do REPIN: reguła garnizonu wojny w `applyWarAllInCapitalToCommands` (ai.ts) i jej test `ai-war-city-garrison-test.cjs`; po stronie Rust brak miejsca do portu w obecnym stanie.

## TESTY (ZMIERZONO na drzewie po poprawce; liczby z surowego wyjścia)
- `node node_modules/typescript/bin/tsc --noEmit` (`node_modules/.bin/tsc --noEmit`): exit 0.
- `node tools/ai-war-city-garrison-test.cjs`: `6 PASS, 0 FAIL` (kandydat 4609fc88d: T6 FAIL `rozkazow: 0,1`).
- `GARRISON_BASELINE=1` na `cb077b588` (ai.ts z bazy): `3 PASS, 2 FAIL` (T1, T2 czerwone — dowód, że testy odróżniają bazę).
- `node tools/ai-army-scattered-merge-test.cjs`: `33 passed, 0 failed` (kandydat 4609fc88d: `31 passed, 2 failed`).
- `node tools/ai-army-replacement-concentration-test.cjs`: `34 passed, 1 failed` (jedyny FAIL = `atrybucja`, czerwony także na bazie; baza cb077b588: `33 passed, 2 failed`).
- `node tools/ai-war-defend-home-test.cjs`: `30 passed, 0 failed`.
- `node tools/ai-army-all-civs-general-muster-test.cjs`: `26 PASS, 0 FAIL`.
- `node tools/ai-war-gate-test.cjs`: `24 passed, 0 failed`.
- `node tools/ai-general-war-campaign-test.cjs`: `51 passed, 0 failed`.
- `node tools/ai-home-defense-civilian-filter-test.cjs`: `8 passed, 0 failed`.
- `node tools/determinism-same-seed-test.cjs`: `WYNIK: PASS`.
- `node tools/load-game-regression-test.cjs`: `34 PASS / 0 FAIL`.
- Bramki referencyjne: `logic-test` `LOGIC OK (213/213)`; `tech-tree-test` `20 pass, 0 fail`; `research-test` `ALL GREEN`; `unit-replace-test` `WSZYSTKIE TESTY ZIELONE (21/21)`; `combat-test` `All sanity checks passed.`
- NIE ZMIERZONO: `ai-army-composition-per-civ`, `ai-defend-recapture-attack-priority`, `ai-move-full-range`, `ai-move-range-collision` (nie uruchamiane w tej rundzie obrony; wyniki Evaluatora 23ab356d1 dla kandydata 4609fc88d nie zostały powtórzone po poprawce); żywy bieg AI 3 ziarna × 100 tur (poza zakresem, patrz zarzut 2).

## BLOKADY
1. DECYZJA: rozszerzenie allowlisty na `gra/src/main.ts` (ścieżka rekrutacji AI do pustych miast — wariant b) albo zgoda na pozostawienie tego długu na osobny temat.
2. DECYZJA: akceptacja zmienionych asercji (scattered-merge S1/S3, replacement S3) jako zamierzonej zmiany reguły.
3. DECYZJA: czy garnizon ma obowiązywać także w mieście będącym punktem zbiórki armii (zarzut 4).
4. Faza 1 (metryka „% miast bez jednostki”, 3 ziarna × 100 tur, czas tury): NIE ZMIERZONO.
5. Wpis nowej bramki do `R-PROC-AUTOBOT.md` §6 — poza allowlistą.

## RUNDY
1/5 (obrona Operatora, Haiku 5.5). Status DECISION_REQUIRED: rdzeń zarzutu 1 (uzupełnianie pustych miast) wymaga zmiany poza allowlistą.

## NASTĘPNY KROK
Orkiestrator: (a) decyzje BLOKAD 1–3; (b) jeśli zgoda na main.ts — runda 2 z wariantem rekrutacji (priorytet w istniejącym budżecie, bez nowych parametrów) i tabelą Fazy 1 (pomiar %, 3 ziarna × 100 tur); (c) jeśli nie — FC na zakresie garnizonu z przyjętymi asercjami.

## UWAGI-DLA-ORKIESTRATORA
- `ai-army-replacement-concentration-test` ma `atrybucja` czerwoną już na `cb077b588` (dług bazowy, nie z tego tematu).
- Dispatch 00-dispatch.md jest na gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`, nie na `origin/main` (potwierdzone `git show`).
- Commit kandydata 4609fc88d nie zawiera się w gałęzi `claude/sprawdzenie-funkcjonalnosci-ek4ra0`; jego rodzicem jest cb077b588 (sprawdzone `git merge-base --is-ancestor`).

DEPLOY/PUSH: NIE WYKONANO


---

# RUNDA 3/5 — obrona Operatora (Haiku 5.5), kandydat 3967f73f6 (kod r1 bez zmian)

STATUS: BLOCK
DOMAIN: GAME (AI wojna / rozmieszczenie wojsk)
TEMAT: R-WEB-AI-WAR-CITY-GARRISON-ONE-REST-TO-GENERAL-Q1
GOAL: wojna AI pilnuje KAZDEGO miasta co najmniej jedna jednostka bojowa; puste miasta uzupelniane (przesuniecie nadwyzki, a gdy brak — rekrutacja najtanszej w istniejacym budzecie); reszta do generala.
BAZA: 3967f73f6 (= 3524f5f38 + raport r2). Pre-round baza cb077b588. origin/main w chwili pracy: 774fd0eec.

## ODPOWIEDZI NA ZARZUTY EVALUATORA (036853da9)
- Zarzut 1 (KRYTYCZNY, puste miasta): ODRZUCAM wdrozenie w tej rundzie — PRZYJMUJE, ze rdzen NIE jest zalatwiony. Trzy proby wariantu (b) (ponizej) daly regresje w testach bramek i zostaly cofniete. Wariant (a) (rekrutacja) NIE wdrozony (BLOKADA 1).
- Zarzut 2 (Faza 1 NIE ZMIERZONO): PRZYJMUJE. Metryki % niepilnowanych miast nie napisano w tej rundzie. Nie twierdze, ze pomiar jest niewykonalny w Node — po prostu nie zostal zbudowany.
- Zarzut 3 (r2 pominal decyzje DODATKU 2): PRZYJMUJE czesciowo. Wariant (a) nie zrobiony (BLOKADA 1). Wariant (b) probowany 3 razy w tej rundzie, kazdy odrzucony dowodem.
- Zarzut 4 (brak bramek referencyjnych/determinizmu/load): PRZYJMUJE. Teraz zmierzone, patrz TESTY.
- Zarzut 5 (T2 slaba): PRZYJMUJE i naprawiam: dodano T2b (wychodzaca jednostka zbliza sie do celu wojny) i asercje mutanta dla T2. Baseline cb077b588 daje T1/T2 czerwone.
- Zarzut 6 (integracja/merge do main): PRZYJMUJE — integracja nie wykonana w tej rundzie, patrz NASTEPNY KROK (wynik merge-tree w TESTY).
- Zarzut 7 (dlug Rust, pelna lista): PRZYJMUJE czesciowo — patrz DLUG RUST.

## ZMIANY / COMMIT
- `gra/tools/ai-war-city-garrison-test.cjs` — T2b (kierunek ruchu wychodzacej jednostki do celu wojny) + asercja "mutant lamie T2". Kod gry `gra/src/game/ai.ts` NIE zmieniony wzgledem 3967f73f6 (eksperymenty cofniete `git checkout`).
- Ten raport (sekcja rundy 3).
- Commit: SHA HEAD podany w zwrocie orkiestratorowi.

## EKSPERYMENTY WARIANTU (b) — wszystkie ODRZUCONE, kod cofniety
Miejsce: `applyWarAllInCapitalToCommands`, po wyjeciu garnizonow, przed kolejka zbiorki; jeden krok `firstStep` ku pustemu miastu; max 1 na miasto na ture.
- V1 — najblizsza jednostka z `planned` (nadwyzka = wszystko poza garnizonami i obroncami domu): ai-war-defend-home-test 27 passed / 3 failed (FAIL: "PRZED: A traci miasto mimo garnizonu (utracone=0)", "PO: najezdzcy zwalczeni po 15 turach (zywych=3)", "stan po 8 turach identyczny OFF vs ON"); ai-army-scattered-merge-test 31/2 (S1/S3 — zmiana "1 zostaje"); ai-army-replacement-concentration-test 32/3 (S3, S5, regresja "skupisko 4 rusza najpozniej w turze 2"); ai-army-all-civs-general-muster-test 24/2 (P6, P7).
- V2 — jak V1 + wykluczenie jednostek w kontakcie z wroga armia (promien zaangazowania): wynik IDENTYCZNY jak V1.
- V3 — jak V2 + tylko nadwyzka (jednostka stoi z inna jednostka bojowa na heksie): defend-home 25/5 (FAIL: "PRZED: A traci miasto mimo garnizonu", "PRZED: A zdobywa miasto B...", "PO: wraca tylko oddzial 1..3 z 10 (wrocilo=4)", "PO: agresor zdobywa miasta (zdobyte=0, PRZED=0)", "M1 brak P2: mutacja wykryta (T2)"); scattered-merge 26/7; replacement 32/3; muster 25/1; garrison-test 6/0.
WNIOSEK: przesuniecie nadwyzki psuje obrone domu i zbiorke. Zadna wersja nie przechodzi bez regresji; dalsza praca wymaga projektu filtra (BLOKADA 2).

## FAZA 1 (pomiar)
NIE ZMIERZONO. Nie napisano metryki "% miast AI bez jednostki" (tury 10/30/60/100, >=3 ziarna, wojna/pokoj, zdobyte miasta w 30 turach, czas tury). Nie uruchomiono zywego biegu (Chromium `ai-economy-measure-run.cjs`). To zaniedbanie Operatora w tej rundzie, nie dowod niewykonalnosci.

## TESTY (liczby z surowego wyjscia; kod r1 = 3967f73f6, ai.ts bez zmian)
- `node node_modules/typescript/bin/tsc --noEmit`: exit 0.
- ai-war-city-garrison-test: 8 PASS / 0 FAIL (po wzmocnieniu T2/T2b i mutancie T2).
- Baseline garrison-test na zrodle cb077b588 (overlay poza worktree, GARRISON_BASELINE=1): 4 PASS / 2 FAIL — T1 i T2 czerwone.
- ai-war-defend-home-test: 30 passed / 0 failed.
- ai-army-scattered-merge-test: 33 passed / 0 failed. UWAGA: Evaluator podal 31/2 dla tego samego kodu; u mnie 33/0 (uruchomione w tej rundzie). Rozbieznosc NIE WYJASNIONA.
- ai-army-replacement-concentration-test: 34 passed / 1 failed (`atrybucja` — dlug bazowy, czerwony takze na cb077b588).
- ai-army-all-civs-general-muster-test: 26 PASS / 0 FAIL.
- ai-war-gate-test: 24 passed / 0 failed.
- ai-general-war-campaign-test: 51 passed / 0 failed.
- ai-home-defense-vs-barbarians-test: 46 passed / 0 failed.
- logic-test: LOGIC OK (213/213).
- tech-tree-test: 20 pass / 0 fail.
- research-test: PASSED 33 / FAILED 0.
- unit-replace-test: exit 0, wszystkie [OK].
- combat-test: exit 0, "All sanity checks passed."
- determinism-same-seed-test: WYNIK PASS (exit 0).
- load-game-regression-test: 34 PASS / 0 FAIL.
- NIE ZMIERZONO w tej rundzie: ai-move-full-range-test, ai-army-composition, pelny pomiar ekonomii AI.

## DLUG RUST (zarzut 7)
- W tej worktree (sparse) `grep -rln "warAllIn|WAR_ALLIN|applyWarAllIn" rust-port` nie zwrocil trafien — NIE ZMIERZONO, czy istnieje odpowiednik w rust-port.
- Zmiana r1 dotyczy wylacznie `gra/src/game/ai.ts` w `applyWarAllInCapitalToCommands` (blok `garrisonIds`: sortowanie po id, zatrzymanie pierwszej jednostki bojowej na heksie miasta). REPIN: ta regula przy deployu do Rust.

## BLOKADY
1. DECYZJA (ABC): uzupelnianie pustych miast — wariant (a) rekrutacja najtanszej jednostki z priorytetem w ISTNIEJACYM budzecie wymaga zmiany `gra/src/main.ts` (sciezka zakupu AI, ~linia 45840: `wantsPurchase`, `shouldAIPurchaseUnit`, `aiPurchaseReserveInputs`) i nowej reguly kolejnosci zakupu. Propozycja: osobna runda z jedna regula "garnizon pustego miasta wojennego ma pierwszenstwo przed reszta zakupu" (bez nowej kwoty).
2. TECHNICZNA: wariant (b) wymaga projektu filtra nadwyzki, ktory nie psuje ai-war-defend-home (V1–V3). Propozycja: nadwyzka tylko z miasta, ktore po ruchu zostaje z garnizonem i nie jest celem obrony domu; do zaprojektowania i zmierzenia.
3. POMIAR: Faza 1 nie wykonana.
4. ASERCJE: scattered-merge S1/S3 i replacement S3 przy regule "1 zostaje" — decyzja wlasciciela (DODATEK 2 pkt c). Na 3967f73f6 scattered-merge przechodzi (33/0) — najpierw wyjasnic rozbieznosc z Evaluatorem.

## RUNDY
3/5 zuzyta (Operator, Haiku 5.5). Status: BLOCK (brak zmiany kodu gry; zmiana tylko testu i raport).

## NASTEPNY KROK
Orkiestrator: (a) decyzja BLOKADY 1 — jesli TAK, osobny temat z regula priorytetu zakupu (main.ts) i testem; (b) BLOKADA 2 — osobny temat projektowy z pomiarem Fazy 1 przed kodem; (c) ponowny run scattered-merge u Evaluatora na tym SHA.

## UWAGI-DLA-ORKIESTRATORA
- Dispatch i dodatek czytane z galezi `claude/sprawdzenie-funkcjonalnosci-ek4ra0` (origin/main nie ma katalogu runs tego tematu).
- Zadanie wlasciciela "zmeczenie wojna 100% => pokoj" (temat #463) jest poza zakresem tego tematu; nie wykonywane.
- `gra/node_modules` z `npm ci` (71 pakietow) na potrzeby testow; usuwane po zakonczeniu.

## DEPLOY/PUSH
NIE WYKONANO (brak integracji, brak push na main, brak deployu — zgodnie z zakazami dispatchu).
