STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-BATTLE-FULL-MOVE-RESIDUAL-INFANTRY-Q2
GOAL: T5 zielony (wastedInf = 0): piechota/strzelcy po zderzeniu nie tracą ruchu przy wolnej drodze, bez wyjątku doktryny; bez regresji konnicy, FALI 731 i równego wejścia.
ZMIANY/COMMIT: kandydat 0c74bd52d7a2a33cf65d4f5caca9e00fa5caccbd (rodzic 9cbadc54a = FALA 745 w main). Allowlista OK: battleScene.ts (+26/-12, gałąź strzelców: BFS _firstStepAlongPathToAttack gdy prosty krok zablokowany, bramkowane _fullMoveRuleActive), battle-pursuit-move-behavior-test.cjs (mutD), 10-operator-claude.md. git diff --check czysty. integration_sha = SHA commita tego raportu (potomek kandydata); kod = 0c74bd52d.
UWAGA ANCESTRY: kandydat NIE jest potomkiem SHA z dispatchu bd239cf4f (to gałąź dispatchów claude/..., historia równoległa); jest potomkiem 9cbadc54a, który jest przodkiem origin/main (0e03e9165). Różnica kod-vs-9cbadc54a to wyłącznie 3 pliki z allowlisty. Integracja: merge do main (nie FF z bd239cf).
TESTY (surowe wyjście, worktree z npm ci):
- tsc --noEmit: 0 błędów.
- battle-pursuit-move-behavior: 13/13, mutacje 1/1; T3 freeRatio 1; T5 wastedInf=0 (73 aktywacji piechoty). Części osobno: mutA 2/2, mutB 2/2, mutC 3/3 (wastedInf 11), mutD 2/2 (wastedInf 2 > 0 -> T5 czerwony po wyłączeniu poprawki).
- battle-full-move-strike: 8/8, mutacje 4/4 (M1-M3 + strzelcy) w 3 pełnych przebiegach; det x3 hash d5c8bff7... identyczny w 14 z 15 trójek (kandydat) i 7/7 trójek bazy. JEDEN niepowtórzony rozjazd (run 1 hash e20cd0b5..., w pierwszym pełnym przebiegu kandydata); hash seeda 1 identyczny z bazą, więc nie wynika ze zmiany; NIE ZMIERZONO przyczyny (podejrzenie obciążenie/timing harnessu).
- pace-latch 5/5 (mutacja wykryta); line-advance-uniform 17 PASS, 0 FAIL; pace-equal-line-live 18/0 (base,sym) + 23/0 (mut).
- Bramki: logic 213/213, tech-tree 20/0, research 33/0, unit-replace 21/21, combat 6/6, unit-power 6/0.
- doctrine-live r4: kandydat = baza: 4 PASS + 1 FAIL "no browser page or console errors" ("Unexpected token '<'", sidecar HTML) = dług bazowy.
- large-mixed-doctrine-matrix: obie wersje "36 scenarios, 0 red conditions"; różnią się 2 wiersze steady/engaged: archer idle 1->0 i 2->0, więcej ruchów (poprawa, nie pogorszenie).
BLOKADY: brak. Chromium przez HTTP/Vite (testy live) wykonane; zmiana nie wizualna.
RUNDY: FC r1/5 nowego ID.
NASTĘPNY KROK: integracja orkiestratora (merge 0c74bd52d + ten raport do main), rejestr; REPIN Rust (dług); #410 może startować.
UWAGI-DLA-ORKIESTRATORA: (1) jednorazowy niepowtórzony rozjazd det w battle-full-move-strike (rozważ uruchomienie ×3 jeszcze raz po integracji); (2) bd239cf4f != main, patrz ANCESTRY.
DEPLOY/PUSH: NIE WYKONANO
