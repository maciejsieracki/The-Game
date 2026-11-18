STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-SIEGE-RELIEF-ATTACK-BESIEGERS-Q1
GOAL: AI atakuje oblegajacych swoje miasto, gdy jej sila w zasiegu >= (1 + 0,2) x sila oblegajacych, z priorytetem przed ofensywa.
ZMIANY/COMMIT: kandydat 66859718c. `git merge-base --is-ancestor 0c3fa0747 66859718c` = tak. diff --stat vs 0c3fa0747: 7 plikow, +595/-1 (ai.ts, ai-siege-relief.ts nowy, ai-params.json +1 pole, 2 testy .cjs, 2 raporty runs/**). Allowlista zgodna (bez WERSJE.md, bez gra-robocza/kanon).
TESTY (wlasny przebieg, worktree na 66859718c, npm ci --ignore-scripts):
- tsc --noEmit: exit 0
- logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0
- ai-siege-relief-test: 23 OK / 0 FAIL
- Mutacja wlasna (usuniecie wywolania applySiegeRelief w ai.ts): 13 OK / 10 FAIL; zrodlo przywrocone, git diff czysty.
- Regresje AI: civilian-filter 8/0, vs-barbarians 46/0, army-seeks-army 22/0, city-garrison 20/0, defend-home 30/0, war-gate 24/0, defend-recapture-attack-priority 55/0, army-replacement-concentration 35/0, siege-requires-war 49/0, siege-ai 17/0, siege-last-stand-sortie 71/0.
WERDYKT PER ZARZUT:
1 (barbarzyncy): ODDANY - barbarzyncy wlaczeni (brak wykluczenia ownerId -1 w kodzie), test (h).
2 (slabe asercje a): ODDANY - asercje wzmocnione; mutacja daje 10 FAIL.
3 (granice progu): ODDANY - testy 5v7/6v7/6v8 i parametryczne 0,5/0,2/0,1.
4 (mutacja): ODDANY - zmierzona przeze mnie niezaleznie.
5 (1 krok): CZESCIOWO - firstStep = farthestStepWithinBudget (ai.ts:985), nie 1 heks; krok nie konczy sie na wlasnym miescie. Atak w tej samej turze tylko dla jednostek przylegajacych; reszta dochodzi i atakuje nastepnej tury (akceptowalne).
6 (NIE_ZMIERZONO live/panstwa-miasta): UWAGA, nie FAIL.
BLOKADY: brak blokujacych.
UWAGI-DLA-ORKIESTRATORA:
- Panstwa-miasta (opts.defensiveCopy, main.ts:44900) NIE dostaja odsieczy (applySiegeRelief wychodzi wczesnie, zgodnie z reszta pipeline'u). Dispatch kazal "osobno sprawdzic" - decyzja produktowa do ABC, nie zmieniano.
- NIE_ZMIERZONO: zywa gra w Chromium; wpiecie flagi city.oblegane w petli main.ts tylko odczyt kodu.
- Zachowanie gracza nietkniete (zmiany tylko w decideAITurn).
RUNDY: 2/5
NASTEPNY KROK: integracja orkiestratora (merge, bramki, deploy ROBOCZA po osobnej autoryzacji).
DEPLOY/PUSH: NIE WYKONANO
