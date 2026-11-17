STATUS: FAIL
DOMAIN: GAME (test-only preset)
TEMAT: R-WEB-TEST-HOOK-PLAYTEST-MAPA-DIRTY-FORECAST-Q1
GOAL: po starcie presetu `?playtest=mapa` prognoza bramki "Zakończ turę" jest dostępna w t1.
ZMIANY/COMMIT: oceniany kandydat 6eb50922d (potomek bazy bc4d62365 — merge-base --is-ancestor: tak). Diff vs baza: main.ts +4 linie (markCityStateDirty w doStartPlaytestMiastoEkonomia), nowy gra/tools/playtest-mapa-dirty-forecast-test.cjs, raport 30-obrona. Allowlista zachowana. git diff --check czysto.
TESTY (zmierzone w tej rundzie na 6eb50922d, po npm ci --ignore-scripts): tsc --noEmit exit 0; logic-test 213/213; tech-tree-test 20/20; research-test 33/33; unit-replace-test 21/21; combat-test 6/6; playtest-mapa-dirty-forecast-test 5 pass/0 fail; mutant (usunięte markCityStateDirty) 2 pass/3 fail, exit 1. Chromium/live: NIE_ZMIERZONO.
BLOKADY / USTALENIE DECYDUJĄCE:
- main.ts:50897-50901: `?playtest=mapa` (i `sandbox`) uruchamia doStartPlaytestMapaSwiata() (l.49133, wywołanie l.50952). `?playtest=miasto` (l.50893) uruchamia doStartPlaytestMiastoEkonomia() (l.48903) — TĘ funkcję poprawił kandydat.
- doStartPlaytestMapaSwiata dokłada miasta cities.push(c) (~l.49266) i w całym ciele (49133-49383) nie ma markCityStateDirty(); jest tylko updateHud() (l.49350). Pomiar NNSDIAG (prognoza null w t1) dotyczył `?playtest=mapa`, czyli ścieżki NIEnaprawionej. Numer linii ~48994 w raporcie NNSDIAG wskazywał funkcję "miasto" (błędna atrybucja), a decyzja i GOAL mówią o presecie playtest=mapa.
- Test statyczny sprawdza wyłącznie doStartPlaytestMiastoEkonomia, więc jest zielony mimo że GOAL (playtest=mapa) nie jest spełniony.
ZARZUTY: 1 (brak testu/mutacji) — rozwiązane w kandydacie, ale test celuje w złą funkcję: NAPRAW. 2 (brak K1) — częściowo: dodane w złej ścieżce: NAPRAW. 3 (bramki) — zmierzone, zielone: ODDAL. 4, 5, 6 (proces/dispatch/baza) — fakty procesowe, bez wpływu na kod: ODDAL.
WYMAGANE NAPRAWY (Operator r3, ten sam ID): (a) dodać markCityStateDirty() po pętli cities.push w doStartPlaytestMapaSwiata (przed explored/updateHud ~49350); (b) rozstrzygnąć założeniem, czy zostawić też poprawkę w ścieżce miasto (rekomendacja: zostawić — ten sam wzorzec, tylko preset testowy); (c) test ma obejmować OBIE funkcje (ciało doStartPlaytestMapaSwiata: push -> dirty; mutacja per funkcja czerwona); (d) idealnie dowód live: ?playtest=mapa t1, prognoza != null.
RUNDY: 2/5 zużyte przez Operatora; FC werdykt FAIL -> runda 3.
NASTĘPNY KROK: Operator r3 na bazie 6eb50922d, potem Evaluator i Final Control.
DEPLOY/PUSH: NIE WYKONANO
integration_sha: brak (nie integrować)
