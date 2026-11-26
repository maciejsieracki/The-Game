# R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1 — rozejm to pauza tej samej wojny: limit wojen nadal ją liczy

STATUS: DISPATCH | DOMAIN: GAME (naprawa błędu logiki) | TEMAT: R-WEB-WAR-LIMIT-TRUCE-COUNT-Q1 (tag WARTRUCECOUNT)
GOAL: para cywilizacji w rozejmie (status „pokój” z truceUntilTurn albo truceEndOffer) liczy się w limicie wojen (1 naturalna + 1 epoki na cywilizację) jako wojna tego typu, którą była przed rozejmem; dopiero pokój zwalnia limit. Wznowienie wojny po rozejmie (declareWarAfterTruce) NIE jest nowym wypowiedzeniem i NIGDY nie jest blokowane limitem.
Źródło decyzji: właściciel 2026-11-26 („Póki jest rozejm, te cywilizacje nadal prowadzą działania wojenne, jedynie przerwane. Dopiero pokój przerywa ten limit.”).
BAZA: cand = SHA origin/main w chwili startu. Kandydat WARBYPASS-wip/fc (0a9e260ac: blokada wznowienia + przedłużanie rozejmu) jest ODRZUCONY — nie używać, nie cherry-pickować.
