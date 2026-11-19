STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ERA-WAR-DEFER-NOT-CANCEL-WHEN-PREVIOUS-WAR-ACTIVE-Q1
GOAL: wojna epoki Brązu/Żelaza odroczona przez trwającą wojnę (Kamień, wojna naturalna) ma wybuchnąć po zniknięciu blokady, a nie wisieć bez celu.
ZMIANY-COMMIT: kandydat d6424cc14 (baza kodu runda 2), poprawka runda 3 w commicie zapisanym przez Operatora (SHA w polu sha). Pliki: gra/src/game/forced-war-common.ts, gra/src/main.ts (1 linia + filtr), gra/tools/era-war-defer-not-cancel-test.cjs (T9 + zmieniony T8), gra/tools/forced-war-iron-main-guard-test.cjs (pin). Progi, koszty, war-rules-params.json bez zmian.

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ, naprawione: pin regex w forced-war-iron-main-guard-test.cjs akceptuje linię freeTargetCandidates (także z komentarzami przed nią). Wynik: 34 PASS / 1 FAIL = jak baza 4643c43ce (jedyny FAIL to "finalizePeaceTreatyBetween uzbraja odpoczynek Żelaza", niezwiązany ze zmianą).
2. PRZYJMUJĘ, bieg NIEKOMPLETNY: patrz BLOKADY.
3. PRZYJMUJĘ, raportuję liczby z surowego wyjścia (bez zmian progów): forced-war-bronze-test 45/3, forced-war-iron-test 54/1, forced-war-reguly-multi-turn 43/5 (porażki = asercje progu 20 tur przy JSON 40; baza: wg Evaluatora 45/3, 54/1, 43/5). era-war-delays-test 55 OK/0 FAIL (dispatch podawał 41; liczba asercji różni się od dispatchu, wynik zielony). era-war-ignore-treaties-test 22/0. tech-tree 20/0. research 33/0. logic-test ostatni PASS [213] (bez wypisanego podsumowania w tym wyjściu). unit-replace-archer-slinger 51 OK/0 (dispatch 21). combat-test "All sanity checks passed". tsc --noEmit exit 0.
4. PRZYJMUJĘ, naprawione: freeTargetCandidates = forcedWarMajorAiSubjects.filter(wolne od wszystkich wojen: countActiveWarsForOwnerExcludingBarbarians === 0). Zgodne z warunkiem partnera z puli (alreadyAtWarAnyRole). Mutacja (usunięcie filtra) -> T8 czerwony.
5. CZĘŚCIOWO PRZYJMUJĘ: kolejność krok 4 przywrócona (dołączenie do pary pierwsze, fallback dopiero po nieudanym dołączeniu). Dołączanie Brązu/Żelaza do PARY KAMIENIA wyłączone (pair.era === 'stone'), bo to jest przyczyna probe B. Mutacja tej linii -> 3 FAIL w T9. ODRZUCAM część "exhausted(cand.ownerId, actor.era)": ścieżka dołączenia liczy licznik w epoce WOJNY (exhausted(pair.targetId, pair.era), forced-war-common.ts ~l.553), a R-WEB-ERA-WAR-COUNTER-Q1 liczy napastnika i cel w epoce wojny; dowód: ta sama konwencja w kodzie.
6. PRZYJMUJĘ: brak testu silnikowego. T1-T9 nadal czysta logika + wiring źródłowy. Pełny test silnika wymaga biegu (patrz BLOKADY).
7. ODRZUCAM z dowodem: gracz nie jest celem fallbacku. data/ui-params.json l.185: "Gracz nie jest celem wojny epoki (wojny tylko między AI)"; fallback ma `cand.ownerId === 0` continue. Gracz jako cel pozostaje w primary (playerFirst, bez zmiany). Bieg nie wykazał, że gracz jest w puli i traci wojnę przez odroczenie, więc reguła zachowana.

DIAGNOZA (kod, plik:linia, bez biegu):
- Pending Brązu (bronzeForceWarPendingOwners) nie jest kasowany przy odroczeniu; kasują go tylko eliminacja i faktyczne wypowiedzenie.
- Pending owner wchodzi do puli tylko gdy !alreadyAtWarAnyRole (main.ts ~l.45405-45413, shouldSearch). Stan jest przeliczany KAŻDEJ tury, bez okna i bez zużycia licznika -> próba jest ponawiana co turę, nie wygasa.
- Lone pending bez partnera trafiał do unresolved (dowód: probe A z raportu Operatora); naprawione fallbackiem wolnego celu.
- Probe B: pending dołączał jako trzeci do pary Kamienia -> stanWojny w ai.ts odrzuca -> wisi. Naprawione wyłączeniem pary Kamienia.

TESTY:
- era-war-defer-not-cancel-test.cjs: 28 passed, 0 failed. Mutacje: usunięcie filtra main.ts -> 27/1; usunięcie wyjątku pary Kamienia -> 25/3 (czerwone).
- Bieg dymny: patrz BLOKADY.

BLOKADY:
- BIEG DYMNY 120 tur seed 4242: NIE ZAKOŃCZONY. Bundle zbudowany poza repo (21 s, ok). Runner ai-economy-measure-run.cjs (--player-ai 1 --rebalance 1) doszedł do tury 75 (74 wiersze jsonl, tury 2..75) i zakończył się endturn-timeout (zamknięcie strony Chromium). Wznowienie z tego samego --profile nie działało (strona zamykała się po ~3 s). Nie zmierzono: tabeli tur wejścia w Brąz, pending, prób i wypowiedzeń.
- Runner nie zapisuje ani epoki per cywilizacja, ani etykiet wojny wymuszonej (pola wars = active/pairs bez epoki); konsola nie zawierała linii [war-limit] ani R-EPOKA-BRAZU-WYMUSZONA-WOJNA. Dane z biegu nie rozstrzygają mechanizmu w silniku. NIE ZMIERZONO.
- Kamień bez fallbacku: twardy limit R2 celu, decyzja poza zakresem (pozostaje).
- Dysk: 11 GB wolne w chwili biegu.
- Uwagi: symlink gra/node_modules w tym worktree wskazuje na node_modules innego worktree (nieśledzony); /tmp/none utworzony przez pomyłkę przy skrypcie (pusty); nie usuwałem (zakaz rm).

NASTĘPNY KROK: FC: sprawdzić diff (T9, filtr Z4, kolejność), a bieg silnikowy 120 tur dokończyć osobnym tematem z runnerem zapisującym epokę i logi wojen wymuszonych.
UWAGI-DLA-ORKIESTRATORA: runner nie loguje wojen epoki; wymagana zmiana narzędzia pomiarowego (poza allowlistą Operatora) przed kolejnym biegiem.
RUNDY: 3/5 (r1 BLOCK bez kodu; r2 BLOCK bez biegu; r3 poprawki kodu i testów, bieg niekompletny)
DEPLOY/PUSH: NIE WYKONANO
