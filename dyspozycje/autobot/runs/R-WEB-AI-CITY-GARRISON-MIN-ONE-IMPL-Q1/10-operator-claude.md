STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: Każde miasto AI trzyma stały garnizon (min. 1 jednostka bojowa), także w pokoju; garnizon nie dołącza do armii (wariant C).
RUNDY: 3/5 (Operator SONNET 5.5, uzasadnienie w dodatku 2 dispatchu: dwie nieudane rundy Haiku). Baza 1484bdc1e.

ZMIANY/COMMIT (kod; SHA czubka w polu sha):
- eb7a7ad21: wspólna funkcja garnizonu użyta w ruchu wojennym (all-in, zamiast lokalnej reguły "stayers[0]"), kampanii wodza (zbiórka, rezerwa, rozwijanie stosów), zbiórce w stolicy w pokoju, posiłkach/ofensywie miast-państw. armyMerge.ts: AI go nie używa (tylko stos wizualny/UI), bez zmian.
- 29fce7727: czysta `garrisonGoldReserve` z sufitem 3 miast (ZAŁOŻENIE do zatwierdzenia; main.ts tylko wpięcie), testy H8–H10; army-concentration sc.4: zamiast poluzowania progu na 9 -- (1) garnizony 4 miast zostają na heksach przez 40 tur, (2) klastry POZA miastami <=6 (próg przywrócony).
- 224288dfc: DIAGNOZA z pomiaru (po pierwszym biegu w pokoju 437 odejść): garnizon odchodził pętlą jednostek po wioski/marsz/patrol/idle. Dodana bramka: garnizon po ataku sąsiedniego wroga nie opuszcza miasta, wyjątek przydział obrońcy domu. Test C3/C3b; setup T2/T4 w home-defense-vs-barbarians (dodany garnizon `a0`; asercje bez zmian -- jedyna jednostka miasta jest teraz garnizonem wg reguły właściciela).
- Odsiecz (ai-siege-relief) i zwiad: brak w bazie 1484bdc1e / zwiadowca nie jest garnizonem -- NIE DOTYCZY. homeDefenderPool NIE ZMIENIONY (zgodnie z dispatchem).

POMIAR NA ŻYWEJ GRZE (seed 4242, runner ai-economy-measure-run + analizator z bazy; PRZED = kod 04f870acd zbudowany i uruchomiony tym samym runnerem; surowe: dowody-r3/):
- t30 pokój: puste/miasta 78/91 -> 32/90
- t40 pokój 66/71 -> 12/62; wojna 72/79 -> 44/85
- t50 pokój 81/86 -> 4/68; wojna 77/92 -> 23/109
- t60 wojna 118/138 -> 7/125; pokój 51/54 -> 42/71
- t10/t20 bez zmian (11/41, 12/41 vs 11/41, 13/41)
- odejścia garnizonu (analizator): 73 (42 wojna/31 pokój) -> 162 (103 wojna/59 pokój); bramka z 224288dfc zbiła pokój z 437 (bieg przed bramką).
EKONOMIA PRZED -> PO (t60, 14 właścicieli AI): wojsko 232 -> 397; utrzymanie jednostek 2744 -> 3468 Pieniądz/turę (+26%); suma skarbców 49816 -> 52265 (brak zamrożenia, deficyt 0 właścicieli); t30 skarbiec 3520 -> 3114.

NASTĘPNA PRZYCZYNA (diagnoza, NIE naprawiona): w t60 nadal 49 pustych miast, skupione u 3 właścicieli: 28 (15/15 pustych, 1530 zł, 4 jednostki -- ubogi skarbiec 18-73 zł w t40-50 przy utrzymaniu budynków 526; przyczyna braku rekrutacji po wzbogaceniu NIE ZMIERZONA), 10 (13/15, 45 jednostek poza miastem) i 22 (11/15, 39 poza) -- właściciele pokojowi, jednostki poza miastem; podejrzani: homeDefenderPool vs barbarzyńcy (decyzja właściciela) i kampania wodza (`keep`). 22 z 49 nigdy nie miało wojska. Wymaga osobnej rundy z danymi per-miasto.

MUTACJE (źródło przywrócone, cmp OK): getCityGarrisonUnitIds -> pusta mapa: min-one 12/4... czerwone, ai-war-city-garrison 19/2 (T1,T2), army-concentration sc.4 1/4 miast (czerwone); usunięcie bramki pętli: min-one C3 czerwone.

TESTY (surowe): tsc 0; min-one 21/0; ai-war-city-garrison 21/0; army-concentration 57/0; ai-war-defend-home 30/0; home-defense-vs-barbarians 46/0; civilian-filter 8/0; army-seeks-army 22/0; siege-ai 17/0; siege-last-stand-sortie 71/0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6.
BLOKADY: brak. UWAGA: stolica w sc.4 wysyła obie jednostki na barbarzyńcę (kworum homeDefender) -- zmierzony wyjątek, nietknięty.
ZAŁOŻENIA do zatwierdzenia: sufit rezerwy = 3 miasta; garnizon = najsłabsza kwalifikująca się jednostka na heksie miasta.
NASTĘPNY KROK: Evaluator/FC; opcjonalnie runda o właścicielach 28/10/22.
DEPLOY/PUSH: NIE WYKONANO
