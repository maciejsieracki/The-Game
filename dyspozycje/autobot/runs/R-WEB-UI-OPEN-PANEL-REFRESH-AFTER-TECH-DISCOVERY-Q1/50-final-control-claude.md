STATUS: PASS-WITH-NOTES
DOMAIN: GAME (UI)
TEMAT: R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1
GOAL: otwarty panel miasta (lista budowy) i panel Rekrutacja imperium odświeżają się po odkryciu technologii bez ponownego otwierania; reguły dostępności bez zmian.
ZMIANY/COMMIT: ocena kandydata dd4ec930c (potomek e12764b59 i 1dd3958be; main 899667a91 scala się czysto: git merge-tree bez konfliktów). Allowlista OK: vs 1dd3958be zmienione tylko gra/src/main.ts (wspólne refreshOpenPanelsAfterTechDiscovery + 3 wywołania + hak test-only prepareNonEraCompletion), gra/tools/open-panel-refresh-after-tech-live-test.cjs, raporty runs/<ID>/**. Kod gra/src nie zmieniony w r2 (vs e12764b59 tylko test + raporty). git diff --check czysty. Commit FC: tylko ten raport + dowody/final-control/*.log.
INTEGRACJA: integration_sha = dd4ec930c (merge do main; kod = main.ts z e12764b59 + naprawiony test).
TESTY (własne, surowe wyjście):
- tsc --noEmit: exit 0.
- logic-test 213/213; tech-tree-test 20/0; research-test 33/0; unit-replace-test 21/21; combat-test 6/6; unit-power-test 6/0 (wszystkie zgodne z wartościami referencyjnymi, brak czerwonych, więc porównanie z bazą zbędne).
- Panelowe (źródłowe): army-panel-recruit-remove-test 21/0; army-auto-recruit-general-ui-test 11/0; administrators-wizard-test 58/0.
- Build kandydata poza repo (vite build exit 0), Chromium przez ROBOCZA_HTML:
  (a) kandydat Murarstwo: PASS (era 2->2, blockLinesA 34, diffy puste); Obróbka drewna: PASS.
  (b) mutacja = refreshOpenPanelsAfterTechDiscovery z pustym ciałem (kopia poza repo): Murarstwo FAIL, nowe wiersze „Stela / Pomnik”, „Warsztat kamieniarski”, „Mury kamienne”; Obróbka drewna FAIL, „Stolarnia”. Test czerwony bez poprawki, zielony z nią.
  (c) kontrola bez techu (MODE=control): BLOCKED exit 2, diffy puste (brak różnicy; konstrukcja zamierzona).
- Kolejność w teście naprawiona poprawnie: prepareNonEraCompletion PRZED pierwszym otwarciem panelu i odczytem A; wymagane A != C (visibleChange), więc A==C z konstrukcji daje BLOCKED, nie PASS.
Dowody: dyspozycje/autobot/runs/R-WEB-UI-OPEN-PANEL-REFRESH-AFTER-TECH-DISCOVERY-Q1/dowody/final-control/*.log.
ZARZUTY EVALUATORA:
1. rekrutacja imperium/handel/wioska nie testowane: ODDAL (poza zakresem DODATKU 2); NIE ZMIERZONO w żywo. Wywołanie jest w kodzie (ukończenie badania, nagroda wioski), tsc zielone.
2. scroll/zaznaczenia/wyszarzenie po odświeżeniu: ODDAL, NIE ZMIERZONO (refreshCityPanelIfOpen/refreshEmpireRecruitPanel to istniejące funkcje używane w wielu miejscach main.ts).
3. powtarzalność (1 przebieg na konfigurację): ODDAL; w FC także jeden przebieg każdej konfiguracji, zgodny z Operatorem.
4. hak prepareNonEraCompletion: ODDAL jako nota (test-only w __eraTestDebug).
5. pliki z r1 w korzeniu dowody/: ODDAL jako nota.
6. kontrola BLOCKED: ODDAL (kryterium = brak różnicy, spełnione).
Brak zarzutu NAPRAW.
BLOKADY: brak. NIE ZMIERZONO: rekrutacja imperium w żywo, handel, nagroda wioski, scroll/zaznaczenia, powtarzalność, pełna regresja pozostałych testów paneli (uruchomiono 3 reprezentatywne).
UWAGI-DLA-ORKIESTRATORA: (1) integrować dd4ec930c merge'em do main 899667a91 (czysty). (2) Sprzątnąć poza repo: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/fc-cand (build ~150 MB, kopia z mutacją, node_modules) oraz kopie Operatora pr-build/pr-noop. (3) Panel miasta po samym EOT bez techu nie jest odświeżany (osobny temat, wg Obrony). (4) Po wdrożeniu można zamknąć punkt „odświeżanie panelu po odkryciu techu (W18)” w #492/#501.
RUNDY: 2/5
NASTĘPNY KROK: integracja orkiestratora (merge dd4ec930c + raport FC), bramki, potem decyzja o deployu.
DEPLOY/PUSH: NIE WYKONANO
