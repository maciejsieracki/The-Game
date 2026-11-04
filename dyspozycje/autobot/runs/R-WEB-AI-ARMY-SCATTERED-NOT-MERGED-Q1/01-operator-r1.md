STATUS: PASS-WITH-NOTES
DOMAIN: GAME (WEB)
TEMAT: R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1
GOAL: ustalić, czemu AI nadal prowadzi wojsko jako rozproszone pojedyncze armie (zrzuty 37/38), i naprawić minimalnie.

PRZYCZYNA (zmierzona na prawdziwym decideAITurn, tools/ai-army-scattered-merge-test.cjs):
Bramka zbiórki zastępczej (R-WEB-AI-ARMY-CONCENTRATION-REPLACEMENT-Q1) liczy "armię" jako skupisko >=3 w promieniu 4,
a planer marszu wojny (planWarAllInCapital, rezerwacja heksu końcowego z R-WEB-AI-MOVE-FULL-RANGE-Q1) ustawia każdą
jednostkę skupiska na OSOBNYM heksie końcowym i nigdy ich nie łączy. Stos powstaje tylko, gdy jednostki STARTUJĄ z jednego
heksu (wspólny krok + allowFriendlyStack). Skupisko rozstawione po heksach (rekrutacja w różnych miastach, rozbicie stosu,
kolumna po utracie stosu) maszeruje całą wojnę jako chmura jednoosobowych armii. To przyczyny (c)+(d) z dispatchu;
(a) nie: łączenie na tym samym heksie działa; (e)-(h) nie wyjaśniają zrzutów.
Histogram przyczyn z plik:linia z pomiaru LIVE: NIE_ZMIERZONO (patrz BLOKADY).

NAPRAWA (ai.ts, applyWarAllInCapitalToCommands, blok "R-WEB-AI-ARMY-SCATTERED-NOT-MERGED-Q1"; army-concentration.ts
planFieldStackGather / noteStackGatherTurn):
przed marszem skupisko >=2 jednostek na różnych heksach (promień 4 od kotwicy = heks z największą liczbą) schodzi się na
JEDEN heks (allowFriendlyStack -> assignSharedStackGroupId w main.ts), dopiero stos rusza na cel. Za flagą ARMY_CONSOLIDATION,
tylko gdy gateLooseUnits; zbiórka osobno per armia wojenna (partitionWarArmies liczone raz przed zbiórką); grupa w
kontakcie z wrogą armią (engageRadius) nie zbiera się; brak trasy -> normalny marsz; limit zastoju 6 kolejnych tur
(WAR_STACK_GATHER_MAX_TURNS) wypuszcza utknięte jednostki; maruderzy w WAR_ALLIN_MERGE_RADIUS dołączają do najbliższej grupy.
Zero zmian balansu. main.ts, armyMerge.ts, warAllInCapital.ts BEZ zmian.

ZMIANY/COMMIT: gra/src/game/ai.ts, gra/src/game/army-concentration.ts; nowy gra/tools/ai-army-scattered-merge-test.cjs
(31 asercji + mutacja bramki), nowy gra/tools/ai-army-live-measure.cjs (narzędzie pomiaru live, NIE uruchomione w tej rundzie);
zaktualizowane: ai-army-replacement-concentration-test.cjs, ai-army-replacement-sim.cjs, army-consolidation-e2e-test.cjs
(wcześniejsze niezacommitowane zmiany w worktree, dostosowane do bramki), army-consolidation-test.cjs (pin tekstowy
`planWarArmiesByEnemy(... data)` -> `(... n, warOpts, data, armyGroups)`: zmiana sygnatury, nie zachowania).
SHA: commit zawierający ten raport (git log -1 na gałęzi worktree).

TESTY (logi gate-*.txt, każdy z EXIT=):
- ai-army-scattered-merge-test: 31 passed / 0 failed, EXIT=0 (mutacja bramki łamie scenariusze). Czas: decideAITurn stos 40 PO=132 ms vs bez bramki 124 ms; faza zbierania chmury 40: 30 vs 14 ms (tylko podczas zbierania); planFieldStackGather chmura 100 = 2.4 ms.
- RED przed / GREEN po: RED = mutacja bez bramki w tym samym teście; osobny RED na czystym main NIE_ZMIERZONO.
- army-concentration 56/0; army-consolidation (po poprawce pinu) zielone, mutacje KILLED, EXIT=0; consolidation-e2e 6/0; replacement-concentration 34/0; ai-move-full-range 20/0; planned-march 18/0; ai-move-range 46/0; war-allin-capital-quick EXIT=0; tsc --noEmit EXIT=0.
- army-recruitment-concentration-test: 26 passed / 3 FAIL (EXIT=1): trzy asercje "call-site contract" czytające źródło main.ts; main.ts nie jest zmieniony w tym temacie, więc awaria jest odziedziczona z bazy origin/main c4a541a27 (uruchomienie na czystej bazie: NIE_ZMIERZONO). Do potwierdzenia przez Evaluatora.

BLOKADY:
- Pomiar LIVE (Chromium, 100-150 tur, kilka ziaren, Egipt/Inkowie, histogram przyczyn, liczba armii ≈ liczba wojen, odsetek samotnych): NIE_ZMIERZONO w tej rundzie (narzędzie gotowe: tools/ai-army-live-measure.cjs, wymaga build vite z kopii poza repo; wolne 4.1 GB dysku). Sukcesu nie ogłaszam na zrzutach; test na prawdziwym decideAITurn odtwarza mechanizm, nie sam zrzut.
- Hash determinizmu: tylko wewnątrz testów (war-allin-quick ON hash 11c252a67bca53c4).
- Konflikt z R-WEB-SIEGE-LAST-STAND-SORTIE-Q1: bramka decyzji obleganego miasta niedotknięta.
- Worktree zawierał przy starcie niezacommitowane zmiany tego tematu z wcześniejszej próby; przejrzane, przetestowane i włączone.

RUNDY: 1/5
NASTĘPNY KROK: Evaluator: (1) pomiar live pre/post, (2) potwierdzić awarię army-recruitment-concentration na czystej bazie, (3) przegląd diffu ai.ts.
DEPLOY-PUSH: NIE WYKONANO
