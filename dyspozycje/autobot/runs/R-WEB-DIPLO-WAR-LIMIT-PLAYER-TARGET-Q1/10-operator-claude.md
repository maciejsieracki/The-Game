STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-WAR-LIMIT-PLAYER-TARGET-Q1
GOAL: wojna, w ktorej gracz jest celem ataku AI, liczy sie do limitu wojen tej AI (za flaga limitWojenAktywny; OFF = parytet).
ZMIANY/COMMIT: gra/src/main.ts (+2 linie: bramka warLimitAllowsDeclaration dla wojny panstwa-miasta na gracza, ok. linia 45165); gra/tools/diplomacy-war-limit-unit-test.cjs (+6 asercji); ten raport. SHA: patrz pole sha.

TABELA (stan przed zmiana, plik:linia):
- AI -> gracz (ownerDeclareWarOn 14235; petla AI 46792): TAK, bramka; liczy wojny AI z innymi (warTypesForOwner 25880) i gracza jako ofiare.
- gracz -> AI: gracz nieograniczony (isMe); wojna liczy sie jako stan do limitu AI: TAK.
- AI <-> AI: TAK (14235, 46792).
- AI <-> panstwo-miasto: TAK dla deklaracji AI (14235, 46792); panstwo-miasto liczy sie jak cywilizacja.
- panstwo-miasto -> gracz (klaster 45163): NIE przed zmiana (bramka tylko R1/R2). PO zmianie: TAK.
- barbarzyncy: poza limitem (isBarbarian w collectWarTypes).
- wojny wymuszone (force=true, bunt 14296, Zelazo): omijaja bramke deklaracji; liczą sie jako stan.
- sojusznik dolaczajacy do wojny (26067): TAK, bramka.
- kryzys z progu (12512): TAK, bramka.

ZALOZENIE: wojna wymuszona po ataku gracza (sojusznik AI dolacza) liczy sie jako wojna AI (obrona), zgodnie z 26067.

TESTY:
- node tools/diplomacy-war-limit-unit-test.cjs: pass=54 fail=0 (48 starych + 6 nowych).
- node tools/diplomacy-war-limit-analyze-test.cjs: pass=17 fail=0.
- tsc --noEmit: exit 0.
- logic-test: LOGIC OK (213/213); tech-tree-test: 20 pass, 0 fail; research-test: 33/33; unit-replace-test: 21/21; combat-test: 6/6.
- NIE ZMIERZONO: czerwona mutacja kopii main.ts (poprawka lezy w main.ts, bez testu czystego modulu).
- Pomiar: bundle poza repo, runner --all-flags 1 --player-ai 1 seed 4242: zapisano 43 tury (t44 ostatnia; t45 nie zdazono w limicie 585 s). Wojna z graczem od t40 (gracz 0 vs civ 25, typ epoki). Max wojen na cywilizacje = 1; max wojen epoki = 1; tury z >1 wojna = 0.
- NIE ZMIERZONO: bieg OFF; wplyw poprawki na 45 tur (przypadek panstwo-miasto -> gracz nie wystapil w biegu).

BLOKADY: brak.
RUNDY: 1/5
NASTEPNY KROK: Evaluator weryfikuje tabele i poprawke (main.ts:45165); Final Control przed integracja.
UWAGI-DLA-ORKIESTRATORA: procesy node "--seed 4242 --turns 150" (/tmp/allflags-*) to cudze biegi, nie ruszane. node_modules w worktree zostawione (rm zakazany).
DEPLOY/PUSH: NIE WYKONANO
