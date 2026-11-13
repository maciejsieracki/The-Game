STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-WAR-ALLIN-GENERAL-PATH-BARB-DEFENSE-Q1
GOAL: Ścieżka kampanii wodza (etap attacking) nie przejmuje obrońców domu przed barbarzyńcami; zasada: obrońca przed barbarzyńcami nie jest przejmowany przez war-allin w żadnej ścieżce.
ZMIANY/COMMIT: fb2c351ee (kod + test; allowlista: gra/src/game/ai.ts, gra/tools/war-allin-general-path-barb-defense-test.cjs). Raport: commit tej wiadomości. Baza: origin/main ee269b6ed.

Pomiar PRZED (plik:linia, stan ee269b6ed): gra/src/game/ai.ts:4856-4868 (drugie wywołanie applyWarAllInCapitalToCommands). Scenariusz: wódz w etapie attacking, miasto AI c1 (pop 5, bramka 9 hex), barbarzyńca thr1 na (25,32), obrońca def1 na (25,27). Wynik: def1 dostaje move do (23,27) z targetCityId ec1 (marsz na stolicę), mimo że barbarzyńca stoi 5 hex od niego. Liczba przejętych obrońców w scenariuszu: 1 z 1.
UWAGA ODCHYLENIA OD DISPATCHU: dispatch zakłada, że w ścieżce kampanii istnieje krok 4b2 i zbiór homeDefenseMoveIds. Nie istnieje: appendAiGeneralCampaignOrders jest wołana przed krokiem 4 (ai.ts ~3594) i zwraca wcześnie, więc przydział obrony (assignHomeDefenders, ~3700) nie działa w tej ścieżce wcale. Zbiór nie był pusty, lecz nie był liczony. Naprawa dodaje brakujący przydział dla barbarzyńców (nowa funkcja planCampaignBarbarianHomeDefense), a nie tylko przekazanie zbioru.

NAPRAWA (ai.ts):
1. planCampaignBarbarianHomeDefense: przydział assignHomeDefenders wyłącznie dla ownerId -1 (groupSize jak w 4b2); adjacent -> attack, inaczej firstStep ku zagrożeniu (jak 4b2). Zwraca komendy i zbiór defenderIds.
2. Drugie wywołanie applyWarAllInCapitalToCommands dostaje defenderIds (zachowane przez war-allin).
3. Ekspansja stosów kampanii pomija obrońców (inaczej dostaliby drugi rozkaz na stolicę).
4. applyWarAllInCapitalToCommands: zatrzymany obrońca nie jest kotwicą planWarReplacementRally (kontekst klastrów).
Zakres barbarzyńców; najeźdźcy cywilizacji bez zmian (nakładka applyHomeWarPriorities).

TESTY:
- RED przed (wersja testu przed naprawą): EXIT=1 (T1, T4 FAIL: def1 -> toQ 23, targetCityId ec1). Logi: gate-red-before.txt.
- GREEN po: war-allin-general-path-barb-defense-test 15 passed, 0 failed (T1-T7). gate-green-after.txt.
- Mutacje (każda ma FAIL): M1 bez defenderIds w drugim wywołaniu -> 5 FAIL (T1,T4); M2 bez pominięcia obrońców w ekspansji stosu -> FAIL T4 (zduplikowany rozkaz na stolicę; T4 poprawiony, by liczyć wszystkie rozkazy obrońcy); M3 bez wykluczenia z kotwic -> FAIL T7. Logi: gate-mutant-*.txt.
- Regresje PRZED = PO (wszystkie EXIT=0): war-allin-keep-barb-defense 8/8; war-allin-capital-test 98/98; war-allin-capital-regress NIEZIELONE 0; ai-home-defense-vs-barbarians 46/46; ai-war-defend-home 30/30; ai-general-war-campaign 51/51; army-concentration 56/56; ai-army-scattered-merge 33/33; ai-move-full-range 20/20.
- Determinizm: war-allin-capital-quick 30 tur, 8 hashy identyczne przed/po (np. OFF aiVsAi be060bceec8cef33, ON aiVsAi 5eae07cc3b4cafa7, ON barbarians c879b6d48293589c).
- Czas: war-allin-capital-perf, mediana ms/tura ON: baza 65.2 (zakres 57.6-95.3), po 68.4 (63.1-77.5); moves 1773 i battles 153 bez zmian. Różnica mieści się w szumie; NIE jest to pomiar na scenariuszu kampanii.
- tsc (node ./node_modules/typescript/bin/tsc --noEmit): EXIT=0.
- Chromium / test live (ai-general-war-campaign-live): NIE_ZMIERZONO (zmiana bez wpływu wizualnego; nie uruchamiano vite build).
- git diff --check: czysto.

BLOKADY: brak. Uwaga: pełny przebieg testów regresji dotyczy wyłącznie listy z dispatchu.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) -> Final Control; weryfikacja mutacji i dowodu RED/GREEN; decyzja o zakresie barbarzyńców (najeźdźcy cywilizacji nadal poza zakresem wg testu T4 w war-allin-keep-barb-defense).
DEPLOY/PUSH: NIE WYKONANO
