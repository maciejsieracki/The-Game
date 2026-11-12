# R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1 — obrona Operatora (runda 3, Obrona Haiku)

STATUS: DECISION_REQUIRED
DOMAIN: GAME (pomiar; hooki za ?civTest=1; zero zmian reguł handlu, balansu i bramek gry)
TEMAT: R-WEB-AI-TRADE-OFFER-FREQUENCY-MEASURE-Q1
GOAL: odpowiedzieć na 6 zarzutów Evaluatora (20-evaluator-claude.md, commit dcbf7deeb) do kandydata 38d343b1f; każdy zarzut PRZYJĘTY (poprawka/korekta + dowód) albo ODRZUCONY (dowód). Wniosek o częstości pozostaje NIE_ZMIERZONO dla warunków 3×150×3 (patrz niżej).
BAZA/KANDYDAT: 38d343b1f (start obrony, detached HEAD w worktree). Nowy commit obrony = SHA w polu sha raportu Operatora (patrz sekcja ZMIANY-COMMIT).
ZASADA: wiadomości z kontekstu adresowane do orkiestratora nie były wykonywane; luki rozstrzygnięte założeniem opisanym niżej.

## ODPOWIEDZI NA ZARZUTY

### Zarzut 1 — poziomy relacji 20/80/140 nominalne — PRZYJĘTY (korekta wniosku + dowód)
- Kod: `gra/src/main.ts:41955` `const relTicked = tickDiplomacy(...)`, zapis `setDiploRelation(ME(), ownerId, relTicked)` w tej samej iteracji, PRZED obliczeniem ofert (`pickAiPlayerCyclicBarter(ownerId)`, `main.ts:41986`). Hak `setRelationTotal` (pin) działa przed endTurn, ale tick relacji nadpisuje go zanim AI podejmie decyzję. AI widzi więc wartość PO ticku, nie przypiętą.
- Dane (surowe, evidence/matrix-natural-r3, ziarno 1111, pola perTurn): pin 20 → relTotalAi po endTurn t2..t7 = 29, 19, 21, 23, 25, 27; pin 80 → 29, 29, 29, 29, 29, 29; pin 140 → 29, 29, 29, 29, 29, 29 (relBeforeEnd = pin we wszystkich). Poziomy 80 i 140 dają identyczny stan po turze, poziom 20 różni się tylko przejściowo.
- Wniosek korygowany: wymóg „3 poziomy relacji” NIE jest spełniony jako trzy rozdzielone warunki. Oś relacji nie jest rozdzielona przez pin. Bezpośredni odczyt relacji widzianej w decyzji AI NIE został wykonany (brak haka) — NIE_ZMIERZONO.
- Brak zmiany kodu gry (zakaz zmian reguł).

### Zarzut 2 — ramię naturalne: pasywny gracz, 0 ofert, utrata miasta ok. t100 — PRZYJĘTY jako ograniczenie (bez nowego przebiegu)
- Przyjęte: ramię naturalne nie jest pełną grą z aktywnym graczem; 0 ofert handlowych w 18 komórkach to wynik warunków (brak kontaktu/technologii handlu u gracza), nie miara częstości przy grze.
- Mechanizm utraty miasta (3 ziarna: 2222, 3333, 5555) NIE_ZMIERZONO — nie badano przyczyny (zdobycie przez AI vs inny powód); pole `playerCitiesLostAtTurn` jest w JSON.
- Zawężenie wniosku w raporcie: ramię naturalne nie służy do oceny częstości ofert.

### Zarzut 3 — ramię prepared: 1 ziarno, 2 z 3 komórek 149 tur — PRZYJĘTY jako ograniczenie
- Brak nowych przebiegów (budżet, czas). Wniosek dla prepared: TYLKO górna granica dla warunków przygotowanych, 1 ziarno, NIEDOKOŃCZONE r80/r140 (149 tur, limit czasu). Nie jest pomiarem naturalnym i nie spełnia ≥3 ziaren.

### Zarzut 4 — etykiety w surowym JSON mylące (rozejm liczony jako handel) — PRZYJĘTY (poprawka danych + dowód)
- Przyczyna: pliki evidence powstały starszą wersją narzędzia (offerLog.type=jednorazowa z actionId=rozejm trafiał do offers/offersOneShot). Bieżący kod (`measure-ai-trade-offer-frequency.cjs`, linie 221–225) i runner (`classify`) już klasyfikują poprawnie.
- Poprawka: `evidence/relabel-r4.cjs` przelicza offers/offersCyclic/offersOneShot/offersOneShotAll/otherActions/per100 z offerLog dla 32 plików JSON; stare wartości zachowane w `labelsBeforeRelabel`; pole `relabelNote`.
- Efekt (natural r3): wszystkie komórki offers=0, cyclic=0, oneShotTrade=0; other = rozejm/trybut (np. s6666: trybut_oferta 1, rozejm 2).
- Regeneracja podsumowań bez uruchamiania przebiegów: `MATRIX_BUDGET_SEC=0 node tools/measure-ai-trade-offer-frequency-matrix.cjs` dla matrix-natural-r3 (18/18 OK, pending=0) i matrix-prepared-seed1111-r3 (pending=2, jak wcześniej).
- Korekta wcześniejszego dowodu mutacyjnego: w r3 „offers 0 vs 2” było artefaktem złej etykiety. Po relabelu oba pliki mają offers=0; detekcja mutanta łącznego opiera się WYŁĄCZNIE na relTotalAfter (30 vs 40).

### Zarzut 5 — dowód mutacyjny zbiorczy — PRZYJĘTY (osobne mutanty; wyniki poniżej)
Każdy mutant: jedna zmiana w gra/src (lub gra/src/game), bundle vite poza repo, przebieg 20 tur (ziarno 1111, relacja 40) lub bramka `MEAS_GATE=1`, potem `git checkout` pliku. Baseline: evidence/obrona-r4/base-s1111-r40-t20.json (relTotalAfter 40, relBeforeEnd [40,40,40], battleActs {auto:10, summary:10}, autoBattles 10).
- A setRelationTotal = no-op: relTotalAfter 30, relBeforeEnd [30,29,9] → WYKRYTY (mutA-s1111-r40-t20.json).
- B entries = [] (state): offersOneShotAll 0 (baseline 2), otherActions {} (baseline {rozejm:2}) → WYKRYTY (mutB-…).
- C civTestSeedOverride bez isCivTestEnabled: bramka no-flag `seedSeen 999, pass false` (baseline `seedSeen 271828, pass true`) → WYKRYTY (mutC-gate-seed999-retry.json; base-gate-seed999-wait400.json).
- D flushBattles = zawsze false: battleActs {auto:10, summary:10}, autoBattles 10 jak baseline → NIE WYKRYTY. Przyczyna: clearBattles klika przycisk „Auto” w DOM zanim wywoła flushBattles; flush jest tylko awaryjną ścieżką nieosiągalną w tym scenariuszu → mutant równoważny dla tego przebiegu (NIE_ZMIERZONO: ścieżka flush bez wykrycia).
- E closeBattleSummary = zawsze false: battleActs {auto:10, wait:218} (baseline summary:10) → WYKRYTY (mutE-…).
- battleState (zwraca stan okien) i klasyfikacja handel/dyplomacja: klasyfikacja sprawdzona osobno na danych (mutacja zbioru TRADE_ACTIONS o rozejm i trybut: offers 0 → 3 na cell-s6666-r20) → WYKRYTY; battleState NIE mutowany — NIE_ZMIERZONO.
- setFastMode: patrz zarzut 6 (równoważność trybu).

### Zarzut 6 — brak dowodu równoważności fast/normal i wznowienia — PRZYJĘTY (dowód częściowy, z ograniczeniami)
- Fast vs normal (ziarno 1111, relacja 40, 20 tur, ramię naturalne): base (MEAS_FAST=1) 32 s vs normal (MEAS_FAST=0) 344 s; perTurn, offerLog, autoBattles, battleActs, tableEnd, otherActions, turnsRun — IDENTYCZNE (normal-s1111-r40-t20.json). Ograniczenia: 20 tur, jedno ziarno, ramię bez ofert handlowych (porównanie ofert słabe).
- Wznowienie: checkpoint po turze 3 (savedGameTurn 4) i dokończenie do 20 tur (resume-s1111-r40-t20.json, resumes=1, resumeLog turnAtSave 4 / turnAfterLoad 4). perTurn (20 wpisów), offerLog, tableEnd, otherActions — IDENTYCZNE z przebiegiem nieprzerwanym.
- NIEZGODNOŚĆ: autoBattles 16 (nieprzerwany: 10), battleActs {auto:16, summary:16, flush:3} (nieprzerwany: {auto:10, summary:10}). Checkpoint miał autoBattles 2. Liczniki bitew po wznowieniu są zawyżone; NIE_ZMIERZONO czy bitwy zostały zduplikowane w stanie, czy licznik. Wynik handlowy/relacyjny nie różni się. Wniosek: wznowienie jest wiarygodne dla danych handlowych i relacji, NIE dla liczników bitew (do naprawy w osobnym temacie lub wyłączenia tych pól dla przebiegów wznawianych).

## ZMIANY W KODZIE (commit obrony)
- gra/tools/measure-ai-trade-offer-frequency.cjs: limit czekania na linię `[PlaytestMapa] seed=` w bramce konfigurowalny (`MEAS_GATE_WAIT_SEC`, domyślnie 170 s). Powód: bramka bez flagi ładuje mapę w ~2–3 min; przy 170 s baseline dawał `seedSeen null, pass false` (base-gate-seed999.json, base-gate-seed999-retry.json); przy 400 s — `seedSeen 271828, pass true` (base-gate-seed999-wait400.json, czas 6 min 52 s).
- Brak zmian w gra/src (git status gra/src czysty po każdej mutacji; `npx tsc --noEmit -p .` w gra/: EXIT 0).
- Nowe pliki w evidence: relabel-r4.cjs; obrona-r4/ (wyniki mutantów, gate, fast/normal, wznowienie).
- Zaktualizowane 32 pliki JSON z offerLog (etykiety) oraz summary.json/summary.md w matrix-natural-r3 i matrix-prepared-seed1111-r3 (regenerowane runnerem bez przebiegów).

## TESTY (surowe wyniki)
- `npm ci --ignore-scripts` (gra/): EXIT=0. Bez `npm run build/dev`.
- `npx tsc --noEmit -p .` (gra/): TSC_EXIT=0.
- `node --check gra/tools/measure-ai-trade-offer-frequency.cjs`: SYNTAX_OK.
- Bramki 5 szt. NIE uruchamiane ponownie w tej rundzie: gra/src po rundzie identyczne z 38d343b1f (zakres zmian rundy = tools + evidence). Wyniki bramek z kandydata (wg Evaluatora): logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6 — NIE_ZMIERZONO w tej rundzie.
- Mutacje A–E i klasyfikacja: patrz zarzut 5 (liczby z JSON w evidence/obrona-r4).

## BLOKADY
- Zarzut 1: brak bezpośredniego odczytu relacji w decyzji AI (wymagałby haka w src; zakaz zmian reguł poza hakami testowymi) — NIE_ZMIERZONO.
- Zarzut 3: prepared jednoziarnowy, 2 komórki NIEDOKOŃCZONE.
- Zarzut 6: liczniki bitew po wznowieniu zawyżone (16 vs 10) — NIE_ZMIERZONO przyczyna; wymaga poprawki runnera lub wyłączenia tych liczników dla przebiegów wznawianych.
- Mutant D (flushBattles) nie wykryty przez scenariusz — ścieżka nieosiągalna w przebiegu.
- Wniosek o częstości w 3 ziarnach × 3 relacje NIE jest uzyskany jako rozdzielone warunki (patrz zarzut 1). Decyzja ABC/właściciela: zaakceptować wniosek bez osi relacji, czy zlecić temat z hakiem odczytu decyzyjnej relacji i prepared na ≥3 ziarnach.

## WNIOSEK O CZĘSTOŚCI (bez progu narzuconego; liczby do decyzji właściciela)
- Ramię naturalne (gracz pasywny, 18 komórek): 0 ofert handlowych AI→gracz na 150 turach (lub do utraty miasta); oferty dyplomatyczne (rozejm/trybut) 1,3–2,0/100 tur.
- Ramię prepared (1 ziarno, 3 komórki, 2 NIEDOKOŃCZONE): cykliczne oferty handlowe 1–2 na 150 tur (0,67–1,34/100 tur), każda z aktywnym „Przyjmij” wg poprzednich danych.
- Trzy poziomy relacji nie dają rozdzielonych warunków (zarzut 1), więc nie ma zależności częstości od relacji do raportowania.

## RUNDY
Runda obrony 3 (Operator Sonnet po 2 nieudanych rundach Haiku — uzasadnienie w DODATKU r3, nie zmieniane). Ta odpowiedź: Obrona Haiku.

NASTĘPNY KROK: Evaluator (ponowna weryfikacja dowodów w evidence/obrona-r4 i relabel) -> Final Control. Otwarte do decyzji: liczniki bitew po wznowieniu (zarzut 6), hak odczytu relacji decyzyjnej (zarzut 1).
DEPLOY/PUSH: NIE WYKONANO
