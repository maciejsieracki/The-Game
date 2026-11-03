STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-CITY-MILITIA-REGEN-COOLDOWN-Q1
GOAL: Po calkowitym zniszczeniu Milicji 5 tur bez Milicji, potem pelna odnowa.
OBRONA R1: zarzut 1 PRZYJETY (auto: dystans waga 0,25 nigdy nie ginie; definicja "zniszczona" w Pomin/Auto = przegrana obrona, siegeDefenders.ts militiaIdsDestroyedForCooldown, main.ts applyMapBattleOutcome). Zarzut 2 PRZYJETY (test z prawdziwym applyLossPctToRoster dla lossDefPct 0,7/0,97/1,0 + mutacja auto-win-not-destroyed). Zarzut 3 PRZYJETY (pomiar wykonany testem). Zarzut 4: odmiana tur/tury naprawiona (siegeMapPanel.ts); export-c.py OBL_MAP poza allowlista (NIE_ZMIERZONO, odnotowane).
TESTY: city-militia-regen-cooldown-test 53 PASS/0 FAIL; tsc --noEmit 0 bledow; city-militia-no-defenders 113 OK; militia-garrison-contract 17 ok; router-siege 8 ok.
NASTEPNY KROK: Evaluator R2
DEPLOY/PUSH: NIE WYKONANO
