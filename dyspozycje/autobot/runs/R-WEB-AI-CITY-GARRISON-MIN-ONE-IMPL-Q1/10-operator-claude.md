STATUS: DECISION_REQUIRED (kod i pomiar gotowe; 3 oryginalne asercje kolidują z regułą właściciela)
DOMAIN: GAME
TEMAT: R-WEB-AI-CITY-GARRISON-MIN-ONE-IMPL-Q1
GOAL: każde miasto AI trzyma min. 1 jednostkę bojową także w pokoju; garnizon nie dołącza do armii.
ZMIANY/COMMIT: baza b6302fcc2 + merge origin/main (ae1cdbe99); 3aa4355a5 (typ garnizonu = najtańsza dostępna jednostka, Wojownik jest tylko w Kamieniu); KOD r4 = SHA tego raportu (patrz pole sha) na 1e7ccb816 + commit testów/raportu. Zmiany: ai-war-home-defense.ts (garnizon poza pulą P1/P2), ai.ts (fallbacki typów garnizonu, garrisonIds, garnizon miasta-państwa nie zbiera chatek), main.ts (priorytet dla każdego typu garnizonu, sufit z parametru), data/ai-params.json (garnizon_rezerwa_max_miast=3, założenie robocze), testy.

DIAGNOZA (hak per miasto, seed 4242, 60 tur; surowe: dowody-r4/):
- Brak rekrutacji: Wojownik dostępny tylko w epoce Kamień -> po awansie pickNull (poprawione: najtańsza dostępna). Reszta: wł. 13 t30 Drewno=10 < 13 potrzebne (Brąz=0) = brak surowca; 97 odmów nnsHold (bramka NNS AI).
- Odejścia garnizonu (79 -> 49 w 60 turach): planHomeWar/odsiecz (ai:3790 ~49), chatki miast-państw (ai:6007 26) -> naprawione (0). Zostają: homeDefenderPool 39 + obrona przed barbarzyńcami w kampanii 9 + 1 inne; pokój poza obrońcą domu <= 1 (kryterium <=20 spełnione).

POMIAR PRZED -> PO (puste miasta AI, seed 4242):
- t60 razem: 49/196 (r3) -> 16/188 = 8,5% (kryterium <=10% SPEŁNIONE); wojna 10/149, pokój 6/39.
- t30 pokój: 78/91 (audyt) -> 36/96 (37,5%); NIE spełnione, zmierzona przyczyna: wł. 13 10/10 (brak drewna), reszta 2-3 miasta na właściciela przy skarbcu <10-60 i nnsHold. Wzrost utrzymania jednostek AI t60 (Pieniądz/turę) 3420, wojsko 360 (czysty bieg przed poprawką cs).
- Uwaga: bieg z instrumentacją diagnostyczną (diag-patch.py, kopia poza repo, tylko liczniki).

TESTY: tsc 0; logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; ai-war-city-garrison 21/0; defend-home 30/0; civilian-filter 8/0; seeks-army 22/0; siege-ai 17/0; sortie 71/0; siege-relief 23/0; min-one 32/0 (nowe D1-D8: mutacje kampanii x3, csGarrisonUnitIds, front-merge ~4443 czerwienią; planHomeWar z/bez garnizonu; ranking typów).
CZERWONE (oryginały przywrócone obok zmienionych, DECISION_REQUIRED): home-defense-vs-barbarians 50/2 (T2-ORYGINAŁ(b), T4-ORYGINAŁ(b)), army-concentration 56/2 (sc.4 `<10` i `<=6`).

DECISION_REQUIRED (ABC): oryginalne scenariusze zakładają, że JEDYNA jednostka miasta maszeruje (T2/T4) albo garnizony liczą się do scalania (sc.4: 5 garnizonów + 5 obrońców = 10 klastrów). A) uznać je za sprzeczne z regułą właściciela i zastąpić nowymi (wersje z garnizonem już są); B) dopuścić marsz jedynej jednostki. Rekomendacja A. Druga: homeDefenderPool (39+9 odejść, nie ruszany) – czy garnizon ma bronić domu poza miastem.

BLOKADY: brak. RUNDY: 4/5. NASTĘPNY KROK: Evaluator; decyzja ABC o testach; opcjonalnie parametr nnsHold dla garnizonu.
DEPLOY/PUSH: NIE WYKONANO
