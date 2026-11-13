STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ARMY-SCOUT-NOT-LEADER-Q1
Obrona po FAIL Evaluatora (baza 1358a312f).
Z1 PRZYJMUJE: nowe combatAnchorFor (stack-leader.ts) + uzycie w openPlayerMapUnitAttackCore (main.ts) - kazdy atak na jednostke (klik, tryLaunchMarchAttack) idzie przez to; zwiadowca nie jest kotwica/atkRoster[0]/etykieta preBattle. Test T5 (+ mutacja: wylaczenie guardu -> FAIL).
Z2 CZESCIOWO: kolejnosc kart sprawdzona czysta funkcja (T3); Chromium/zrzut NIE_ZMIERZONO (army-stack-commander-identity-test wymaga /usr/bin/chromium - brak).
Z3 CZESCIOWO: ai.ts nie zmieniany; AI wyklucza cywili z ataku miasta (ai.ts ~4106) - tylko odczyt, brak testu ai-*.
Z4 PRZYJMUJE: armyLeaderForSelection przyjmuje strengthOf; main podaje unitAttackScore (atak, nie HP). Test T6 (ranny wojownik vs lucznik HP). hint_civilian przy bojowych bez ruchu - test T6.
Z5 NIE_ZMIERZONO: siege-blockade-no-recruit (Chromium), pelna unia widocznosci.
Testy: gate-regression-r2.txt, gate-tsc-r2.txt (tsc EXIT=0, scout test 19/0).
