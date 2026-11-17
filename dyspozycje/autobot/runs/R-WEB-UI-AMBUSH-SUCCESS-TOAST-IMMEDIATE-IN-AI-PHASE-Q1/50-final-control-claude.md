STATUS: PASS
DOMAIN: GAME (UI komunikatow)
TEMAT: R-WEB-UI-AMBUSH-SUCCESS-TOAST-IMMEDIATE-IN-AI-PHASE-Q1
GOAL: toast "Zasadzka sie powiodla" od razu w fazie ruchu AI; wpis "Wazne" zostaje; reszta komunikatow fazy AI bez zmian.
ZMIANY/COMMIT: kandydat 5b38b2cf4ebbf023d3e5433ff6f153ed623e4043 (potomek bazy bc4d623655f71c36eee1621389357961bc6d2641: merge-base --is-ancestor = TAK, 1 commit). Diff vs baza: gra/src/main.ts (+6/-3, showHintMessage 5. parametr showNowDuringEot, 2 wywolania ambush), gra/tools/ambush-live-test.cjs, gra/tools/ambush-live-vite.config.ts, raport operatora. Allowlista zachowana (brak gra-robocza, WERSJE.md, innych src). Uwaga: origin/main poszedl dalej (cc3c80b17, FALA 802); baza kandydata to bc4d623 - integracja = merge, konflikt w main.ts mozliwy tylko w okolicy showHintMessage.
TESTY (surowe wyjscie, z gra/, node_modules npm ci --ignore-scripts):
  - tsc --noEmit: exit 0
  - ambush-core 48/0; ambush-ui-reason 10/0; ambush-wiring 28/0; ambush-realstep 16/0
  - Bramki referencyjne: logic 213/213; tech-tree 20/0; research 33/33; unit-replace 21/21; combat 6/6; unit-power 6/0 (wszystkie zielone, brak czerwonych do porownania z baza)
  - ZYWY Chromium (Vite, TMPDIR=/tmp/amb4): ambush-live-test 26 PASS / 0 FAIL; B5 PASS (DOM ["Zasadzka się powiodła"]), B6, B7 PASS; asercja B5 niezmieniona vs baza
  - MUTACJA (showNowDuringEot=false w obu wywolaniach): 25 PASS / 1 FAIL, B5 czerwony (DOM []); main.ts przywrocony (git status czysty)
BLOKADY: brak. NIE ZMIERZONO: widocznosc pikselowa toastu pod overlayem przejscia tury (test sprawdza DOM); ambush-deploy-* i identity nie powtarzane (poza zakresem diffu; Operator raportowal zielone).
RUNDY: 1/5 (FC)
ZARZUTY: brak (zarzuty=[]), obrona=null.
NASTEPNY KROK: integracja orkiestratora 5b38b2cf4 (merge do aktualnego main, sprawdzic konflikt main.ts), potem deploy po osobnej autoryzacji.
UWAGI-DLA-ORKIESTRATORA: pliki 00-dispatch.md/DODATEK nie istnieja na origin/main; dispatch tylko na galezi claude/sprawdzenie-funkcjonalnosci-ek4ra0 (DODATEK nie znaleziony) - ocena wg tego dispatchu.
DEPLOY/PUSH: NIE WYKONANO
