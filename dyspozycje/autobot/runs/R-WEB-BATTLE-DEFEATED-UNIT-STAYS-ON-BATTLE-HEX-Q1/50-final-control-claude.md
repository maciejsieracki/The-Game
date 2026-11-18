STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-DEFEATED-UNIT-STAYS-ON-BATTLE-HEX-Q1
GOAL: Przegrana grupa, gdy kierunek wprost od zwyciezcy jest zablokowany, odskakuje na inny heks (2, potem 1), a nie zostaje na heksie bitwy.
ZMIANY/COMMIT: kandydat a2f362d65fcd5159893e0d27ab8b241f1c6f75d3; baza 2d2c425f80babc40d257be3324e88f1d898d9000 jest przodkiem (merge-base --is-ancestor: OK). diff --stat: 5 plikow, +240/-3: post-battle-map.ts (kaskada kierunkow: retreatDirectionCascade, tryRetreatCascade, wywolanie w placeFanOutGroup), nowy battle-defeat-retreat-blocked-direction-test.cjs, korekta asercji 4 w battle-defeat-survivor-retreat-two-hex-test.cjs (uzasadniona), 2 raporty runs/. Allowlista zachowana, brak main.ts/battleScene/combat/ai/JSON.
TESTY (wlasny przebieg w swiezym worktree, npm ci --ignore-scripts): tsc --noEmit 0; logic-test 213/213; tech-tree-test 20 pass 0 fail; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; battle-retreat-limit-test 43 pass 0 fail; battle-defeat-survivor-retreat-two-hex-test 44 pass 0 fail; battle-defeat-retreat-blocked-direction-test 16 pass 0 fail. Mutacja: stary post-battle-map.ts (z bazy) podstawiony pod nowy test -> 9 pass, 7 fail (czerwien); plik przywrocony, git status czysty.
OCENA ZARZUTOW: (1) AUTO: naprawione w obronie (S6/S7 AUTO zielone) - OK. (2) wybor kierunku "wprost" (kwadrat euklidesowy w osiowych) - zachowanie sprzed zmiany, lagodzone kaskada, poza zakresem: ODDAL (uwaga). (3) retreatAtkRosterToStart bez kaskady - poza zakresem: ODDAL. (4) hipoteza liczebnosci: liczebnosc wplywa tylko przez zajetosc heksow; S8 (3 heksy od zwyciezcy zajete) -> fallback (13,20), nie zostaje; "zostaje" tylko gdy wszystkie sasiednie zablokowane (S3/S7). Pelnego 71 jednostek nie odtworzono (NIE ZMIERZONO). Zadny zarzut nie wymaga NAPRAW.
BLOKADY: brak. NIE ZMIERZONO: zywy Chromium (opcjonalny w dispatchu), scenariusz 71 jednostek.
RUNDY: FC po 2/5 rundach Operatora.
NASTEPNY KROK: integracja orkiestratora (FF/merge kodu a2f362d, sprawdzic is-ancestor), deploy po osobnej autoryzacji.
UWAGI-DLA-ORKIESTRATORA: kandydaci na osobne tematy: (a) pickRetreatTargetAwayFromAttacker - kierunek wprost liczony w osiowych (np. zwyciezca (11,23) -> wybiera (12,21) zamiast (11,21)); (b) retreatAtkRosterToStart bez kaskady, jeden kierunek.
DEPLOY/PUSH: NIE WYKONANO
