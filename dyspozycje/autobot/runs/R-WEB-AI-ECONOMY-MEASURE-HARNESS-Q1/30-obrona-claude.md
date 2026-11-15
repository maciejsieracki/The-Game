STATUS: BLOCK (runda 2/5, Obrona/Operator HAIKU 5.5 — kod zmieniony i zmierzony; kryterium (a) wartość AI i kryterium (c) pozostają CZERWONE; decyzja orkiestratora wymagana, patrz NASTĘPNY KROK)
DOMAIN: GAME (narzędzia pomiarowe + hak civTest; bez zmian logiki gry)
TEMAT: R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1
GOAL: (1) metryki AI per owner/tura w haku civTest; (2) runner wznawialny 100+ tur; (3) obejście bramki NNS gracza z licznikiem; (4) dowód 100 tur x2 + test wznowienia; (5) instrukcja #415. Runda 2: odpowiedzieć na każdy zarzut FC r1 (PRZYJMUJĘ/ODRZUCAM z dowodem).
BAZA: d32ae67ede1bd34dbecf907b46b5a482091e3663 (kandydat r2, zawiera merge 7ac79dafb) → zmiany tej rundy w commicie z tą wiadomością (SHA w polu sha wyniku).
ZMIANY-COMMIT: gra/src/main.ts (blok `__aiEconomyMeasure` WYŁĄCZNIE: pola glodKaraStatProc, glodAtrycjaHpProc, utrzymanieJednostekPieniadz, utrzymanieJednostekSurowce, diag.ownersBezMiastIJednostek); gra/tools/ai-economy-measure-hook-test.cjs (przepisany: start newgame + foundFirstCity, asercje obejścia, wartości AI, mutacja); gra/tools/ai-economy-measure-README.md (stan r2, tabela przebiegów, diagnoza AI, #415 jako NIE DODANE); dyspozycje/autobot/runs/R-WEB-AI-ECONOMY-MEASURE-HARNESS-Q1/30-obrona-claude.md; runs/.../evidence/r2-* (JSONL 100 tur ×2, summary, resume, log hooka). Runner (gra/tools/ai-economy-measure-run.cjs) BEZ zmian. `git diff --check`: czysto.

ODPOWIEDZI NA ZARZUTY EVALUATORA (r1 FC, 20-evaluator-claude.md):
- Zarzut 1 (kryterium a: AI=0). ODRZUCAM naprawę przez ścieżkę `?playtest=mapa&civTest=1` jako rozwiązanie. Dowód: sonda w tym bundlu (probe3, scratchpad) — playtest, 11 endTurn, owners 1..6: miasta=0, jednostki=0 w każdej turze. PRZYJMUJĘ, że przyczyny nie zlokalizowano w allowlistcie. Nie naprawiam defektu startu gry (zakaz: logika startu poza allowlistą). Asercja „wartość AI” w teście haka: CZERWONA (wynik: `wartosc: ... AI [[1,0,0],...,[6,0,0]]`, `ownersBezMiastIJednostek:[1,2,3,4,5,6]`).
- Zarzut 2 (diagnoza nieudowodniona; DODATEK: sprawdź ścieżkę playtest). PRZYJMUJĘ: ścieżkę playtest sprawdziłem (wynik jak w zarzucie 1). Obserwacja Evaluatora „AI ma miasto po turze 8” nie jest powtarzalna: w sondzie z czekaniem na zmianę tury (waitForFunction) AI=0 przez 11 tur, a skok licznika tury 8→1 pojawił się tylko w sondzie z szybkim endTurn bez czekania (stan niespójny, nie traktuję jako wynik). Diagnoza „defekt startu gry” pozostaje HIPOTEZĄ.
- Zarzut 3 (gałąź obejścia NNS bez testu i mutacji). PRZYJMUJĘ i dowodzę: test haka (r2, log `evidence/r2-hook-test.log`): ZIELONE „warunek wstępny: tura 1 bramka NNS gracza BLOKUJE” (nnsGateBlocked=true); ZIELONE „kontrola negatywna obejścia: dosypka 0/0 NIE odblokowuje” (true po 0/0); ZIELONE „obejście: dosypka 200/200 ODBLOKOWUJE” (false); ZIELONE „realny endTurn po dosypce przechodzi turę 1 -> 2”. Mutacja obejścia = dosypka 0/0 (musi zostać zablokowana). Przebieg runnera: bypassApplied=1 (tura 1) na obu ziarnach.
- Zarzut 4 (brak % kary głodu i utrzymania jednostek; przychód/utrata). PRZYJMUJĘ dla % kary i utrzymania jednostek: dodano `glodKaraStatProc` = (1−glodWojskaStatMult)·100 (0 bez głodu), `glodAtrycjaHpProc` = glodWojskaHpFrac·100 (0 bez atrycji), `utrzymanieJednostekPieniadz` = totalUnitUpkeep po jednostkach wojskowych (ta sama tablica i parametry co garnizon), `utrzymanieJednostekSurowce` = totalUnitResourceUpkeep. ODRZUCAM dodanie przychodu/utraty na turę w tej rundzie: wymagałoby wyprowadzenia z ledgera tury (gra/src/game/turn-economy.ts, poza allowlistą) — pozostaje jawnie NIE ZMIERZONO (lista `niezmierzone`). Uzasadnienie: brak zweryfikowanego pojedynczego źródła w allowlistcie; nie zgaduję.
- Zarzut 5 (README bez instrukcji #415; błędna diagnoza „zapis nie zawiera podzialPracy”). PRZYJMUJĘ diagnozę (błędna wersja usunięta, README przepisany: przyczyna = `ensureCityPodzialDefaults` po wczytaniu, poza tym tematem). ODRZUCAM instrukcję jednego polecenia ON/OFF dla #415: flaga nie istnieje w main; `refs/keep/R-WEB-AI-UPKEEP-Q2-fc` (ebb51cde7) ma bazę w starszej historii — jej diff z 7ac79dafb obejmuje setki zmian poza bramką (np. battleScene.ts, cofa FULL-MOVE), więc wprowadzenie flagi nie jest jednym krokiem w tym temacie. Pozostaje jawnie NIE DODANE w README.
- Zarzut 6 (kryterium b: dowód 100×2 bez AI; fantomowi owners z aiStartHexes). PRZYJMUJĘ częściowo: 100 tur × 2 ziarna wykonano na tej bazie (tabela niżej), z jawnym AI=0. Fantomowych owners nie usunięto (to są właściciele AI z aiStartHexes), ale dodano sygnał `diag.ownersBezMiastIJednostek` (listę ownerów bez miasta i jednostki), który test wartości AI czerwieni.
- Zarzut 7 (kryterium c: wznowienie i mutacja nie zmierzone na finalnym kodzie). ZMIERZONO wznowienie na tej bazie: `allEqual=false`, `compared=10`, zgodnych 0 (`evidence/r2-resume-test-seed4242-summary.json`; przyczyna wg r1 = SAVE-LOAD `ensureCityPodzialDefaults`, NIE ponownie zdiagnozowana). Mutacja wznowienia NIE ZMIERZONO — dispatch: dopiero przy zielonej bazie, a baza czerwona.

ZMIERZONE NA KANDYDACIE (surowe wyniki):
- tsc: `npx tsc --noEmit` w gra/ → exit 0 (po zmianach main.ts, przed i po mutancie).
- build: `vite build --outDir <scratchpad>/dist` → built in 24.25 s (bundle poza repo).
- `git diff --check` → brak wyjścia (czysto).
- Bramki referencyjne (exit 0): logic-test „LOGIC OK (213/213)”; tech-tree-test „20 pass, 0 fail”; research-test „ALL GREEN”; unit-replace-test „WSZYSTKIE TESTY ZIELONE (21/21)”; combat-test „All sanity checks passed.”; resource-ledger-hook-gate-test „6 passed, 0 failed”.
- Hook test (r2, log `evidence/r2-hook-test.log`, rerun z mutantem: `r2-hook-test.log` z ostatniego przebiegu): PODSUMOWANIE 8/9 zielone; jedyna czerwona = wartość AI (oczekiwana, patrz wyżej). Mutacja realna (zepsuty bundle bez `glodKaraStatProc`): CZERWONA („owner 0 bez glodKaraStatProc; …”).

TABELA PRZEBIEGÓW 100 TUR × 2 ZIARNA (runner `--start newgame`, `--every 10`, `--bypass 1`, JSONL w evidence/):
| ziarno | tura końcowa | tury z aktywną bramką NNS (przed endTurn) | dosypki (bypassApplied) | czas | AI miasta (suma wszystkich tur) | AI jednostki (suma) |
|---|---|---|---|---|---|---|
| 4242 | 100 | 1 (tura 1) | 1 | 69 s | 0 | 0 |
| 777 | 100 | 1 (tura 1) | 1 | 73 s | 0 | 0 |
Wiersze JSONL: 99 na ziarno (tura 2..100). Pliki: `evidence/r2-seed4242-100t.jsonl`, `evidence/r2-seed777-100t.jsonl`, `evidence/r2-seed*.summary.json`, `evidence/r2-run-seed*.log`.

DIAGNOZA AI=0 (zebrane dowody, NIE rozstrzygnięte):
1. Nowa gra (`startGame`) + `foundFirstCity`: bramka NNS blokuje turę 1 (canEnd=false); dosypka 200/200 odblokowuje (canEnd=true) i endTurn przechodzi 1→2.
2. Bez dosypek i bez foundFirstCity bramka nie blokowała (nnsGateBlocked=false) — gate wymaga założonego miasta gracza.
3. Po 15 turach nowej gry z dosypkami: owners 1..6 = miasta 0, jednostki 0; `diag`: aiStartHexes=6, pendingForeignSpawnCities=0, pendingSameTypeRivalHexes=0, citiesAll=1, ownersOfCities=[0].
4. Ścieżka `?playtest=mapa&civTest=1`: 11 endTurn, AI nadal 0 miast i 0 jednostek (sonda probe3 w scratchpad, nie w repo).
5. `setTaxSplit` NIE istnieje w tym bundlu (`typeof` = undefined); wcześniejsze wywołania były bezskuteczne (błąd połknięty przez try/catch w sondzie).
Wniosek: defekt startu AI (owners bez miast i jednostek od startu) — poza allowlistą. Kandydat do osobnego tematu GAME, np. R-WEB-AI-START-NO-CITIES-IN-HARNESS-Q1 (do rejestracji przez orkiestratora; NIE zakładam go sam).

BLOKADY:
- Kryterium (a) wartość AI: CZERWONE (defekt startu AI, poza allowlistą).
- Kryterium (c) wznowienie: CZERWONE (SAVE-LOAD, poza allowlistą). Mutacja wznowienia: NIE ZMIERZONO.
- #415 instrukcja jednego polecenia: NIE DODANA (flaga poza main; wymaga osobnego tematu integracji flagi).
- Przychód/utrata na turę: NIE ZMIERZONO (brak źródła w allowlistce).

RUNDY: runda 2/5 (Obrona HAIKU). Kolejna runda tylko po decyzji orkiestratora (patrz NASTĘPNY KROK).
NASTĘPNY KROK: DECISION_REQUIRED dla orkiestratora: (a) osobny temat GAME na start AI w trybie harnessu (kandydat jw.) i dopiero potem runda 3; albo (b) zmiana kryterium (a) na pomiar bez AI z jawnym oznaczeniem (wtedy runda 3 domyka mutację wznowienia po zielonym SAVE-LOAD i #415 po integracji flagi).
UWAGI-DLA-ORKIESTRATORA:
- Obserwacja poza zakresem: gracz w obu 100-turowych przebiegach ma 1 miasto i 7 obywateli (licznik `miasta`/`obywatele`); nie zbadane — kandydat do audytu startu/ekspansji gracza w harnessie.
- `setTaxSplit` z dispatchu/DODATKU nie istnieje w bundlu; nie wprowadzałem go.
- Sondy (probe2/probe3) są w scratchpad (poza repo), nie commitowane.
- Nie tworzyłem sesji, zadań ani harmonogramów.
DEPLOY-PUSH: NIE WYKONANO
