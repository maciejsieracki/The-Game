STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-STACK-LIMIT-Q1
GOAL: Jedna armia (wszystkie własne jednostki jednego właściciela na jednym heksie, także w mieście) nie może mieć więcej jednostek niż limit bitwy na stronę (`BATTLE_MAX_PER_SIDE` = 500, jedno źródło prawdy w `battleScene.ts`).
ZMIANY/COMMIT: SHA — patrz `git log` brancha worktree (commit "R-WEB-ARMY-STACK-LIMIT-Q1: Operator r1"); pliki:
- NOWY `gra/src/game/army-stack-limit.ts` (czysty moduł; limit zawsze parametrem, zero kopii liczby)
- `gra/src/main.ts` (bramki + migracja; import + `armyStackLimit()` = `BATTLE_MAX_PER_SIDE`)
- NOWY `gra/tools/army-stack-limit-test.cjs` (41 asercji)
- ten plik raportu
BAZA: worktree na `0e1de593d` (zawiera CAP500 `36ed6e6da`). `battleScene.ts`, `armyMerge.ts`, `ai*.ts` NIE zmienione (niepotrzebne).

BRAMKI (gdzie powstaje/rośnie stos):
1. Narodziny jednostki z produkcji (`applyProductionCompleted`): pełny stos w mieście -> pozycja wraca na front kolejki (`requeueManpower`; rush-buy zwraca złoto); gracz widzi komunikat.
2. Narodziny z kolejki rekrutacji: `recMaxPerTurn = min(pojemność, wolne miejsca w stosie)`; 0 wolnych = kolejka stoi (jak oblężenie), opłacone zostaje.
3. Zakup (`purchaseRecruitmentUnit`, `purchaseRecruitmentUnits`): jednostki w mieście + kolejka rekrutacji miasta + nowa partia <= limit, inaczej odmowa z komunikatem "Armia nie może mieć więcej niż 500 jednostek (limit bitwy)." (gracz i AI jedna ścieżka; AI po prostu nie kupuje).
4. Ruch gracza: `planMarchTo` (cel), ruch bezpośredni (`moveDest`), segmenty marszu animowany i natychmiastowy (`trimPathToStackRoom` — stos urósł od planowania), `reachableWithMergeTargets` (pełny stos nie jest celem scalenia, więc nie ma też monitu o scalenie).
5. Ruch AI: `truncatePath` w egzekutorze `executeAiCityMove` przycina trasę do ostatniego heksu z miejscem; pusta trasa = AI nie wykonuje ruchu (zostaje, przy następnej decyzji szuka innego).
6. MIGRACJA zapisu (`enforceArmyStackLimit('wczytanie zapisu')`) + SIATKA BEZPIECZEŃSTWA na starcie każdej tury (`enforceArmyStackLimit('start tury')`): stos > limit dzielony deterministycznie (`planOversizedStackSplits`): w stosie zostaje pierwsze 500 wg kolejności tablicy, nadwyżka na najbliższe wolne heksy (pierścienie 1..6; własne miasta dozwolone, obce jednostki/woda/góry/obce miasta pomijane), każdy nowy stos dostaje własny `stackGroupId`, garnizon/fortyfikacja zdejmowane, nic nie jest usuwane; komunikat dla gracza.
7. `battleReserveNotice` zostaje bez zmian (zabezpieczenie).

TESTY (gra/):
- `node ./node_modules/typescript/bin/tsc --noEmit`: 0 błędów
- `node tools/logic-test.cjs`: 213/213
- `node tools/ai-test.cjs`: 274 passed / 20 failed — IDENTYCZNY zbiór 20 FAIL na bazie (`git archive HEAD`, diff list FAIL pusty) = bez zmian względem bazy
- `node tools/army-stack-limit-test.cjs`: 41/41 (A źródło limitu, B funkcje czyste, C migracja 1300 jedn. -> 800 przeniesionych, determinizm, pierścienie 6/12, obca jednostka/teren, D pętla 60 tur modelu z bramkami + wczytanie 1300 + rekrutacja + narodziny + ruch/scalenie: max stos <= 500, E mutacja: ta sama pętla BEZ bramek łamie niezmiennik, F okablowanie main.ts — skan punktów bramek). Na bazie test pada (brak modułu). Mutacja na źródle: wyłączenie bramki `planMarchTo` -> F4 czerwone (sprawdzone, przywrócone).
- Regresje pomocnicze zielone: battle-cap-500 (59), army-merge-stackgroupid (11045/0), army-merge-colocated (4/0), generals-limit-invariant (ALL PASS), ai-army-scattered-merge (33/0), army-recruitment-concentration (30/0).
- `mgla-sciezka-inwariant-test.cjs`: baza 39 pass/3 fail (battleScene/siege-enter-city/Object.assign), po zmianie TEN SAM zestaw 3 fail; lista niesklasyfikowanych zapisów pozycji rośnie o 1 linię (`main.ts` `u.q = mv.toQ; u.r = mv.toR;` w `enforceArmyStackLimit` — relokacja nadwyżki, nie marsz). Klasyfikacja w tym teście jest POZA allowlistą — do zrobienia osobno (decyzja Evaluatora/orkiestratora).

BLOKADY / OGRANICZENIA (jawnie):
- Pętla 60 tur PRAWDZIWEGO silnika AI (headless, pełna gra) NIE uruchomiona: wymaga buildu + Chromium; zamiast tego pętla 60 tur modelu na tych samych funkcjach bramek. Dowód na żywej grze = zadanie dla Evaluatora/orkiestratora.
- Nagroda wioski (`findVillageRewardSpawnHex`), spawn barbarzyńców, bonus trudności AI, post-battle (rout/odwrót/zdobycie miasta) NIE mają osobnych bramek: pokrywa je siatka bezpieczeństwa na starcie tury (nadwyżka jest dzielona), a retreat/fan-out i tak ląduje tylko na pustych heksach. Możliwe krótkie przekroczenie w trakcie tury do startu następnej.
- AI "szuka innego heksu" tylko pośrednio (przy kolejnej decyzji); jednostka AI z celem na pełnym stosie może stać w miejscu.
- Brak weryfikacji wizualnej (temat logiczny, nie wizualny); komunikaty przez istniejące `showHintMessage`.
- Limit liczy WSZYSTKIE własne jednostki na heksie (także cywili i garnizon), konserwatywnie.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator (zarzuty, w tym ew. dopisanie bramek dla nagrody wioski / spawnu AI, klasyfikacja `mgla-sciezka-inwariant`), potem Final Control.
DEPLOY/PUSH: NIE WYKONANO
