# R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2 — raport Final Control (niezależny)

STATUS: PASS-WITH-NOTES
DOMAIN: GAME (wyłącznie gra/tools/*test*.cjs i *live*.cjs; kod gry bez zmian)
TEMAT: R-WEB-TEST-DEBT-BASE-RED-MAIN-Q2
GOAL: doprowadzić 7 czerwonych testów bazowych do zielonego albo jawnie sklasyfikować (A/B/C/D), bez zmian kodu gry.
ZMIANY/COMMIT: kandydat do integracji 23f4038e94069eb9e07e83b878fb858e69628837 (potomek 79abbf0bf i 7b7f97682; baza wg DODATKU; NIE jest potomkiem 63a26921c z workflow — zgodnie z DODATKIEM i z adnotacją Operatora wybrano wariant 7b7f97682 + merge 79abbf0bf). Diff vs 79abbf0bf poza dyspozycje/: wyłącznie gra/tools/*test*.cjs (w tym 3 pliki spoza listy 7: build-panel-ulepszenia-scroll-real-render, mgla-sciezka-inwariant, surow-civ-storage — to przeniesione z kandydata r1 7b7f97682, nie z tej rundy). Brak zmian w gra/src, gra/data, wikiBundle, WERSJE.md.
TESTY (ZMIERZONO, surowe wyjście, kandydat 23f4038e9, `npm ci` w worktree):
- tsc --noEmit: exit 0
- diplomacy-city-cession-r3: 72 pass / 0 fail
- json-descriptions-sync: 19 / 0
- diplo-truce-r1: 31 / 0
- diplomacy-stol-pw-sum: 168 / 0
- diplo-truce-live (Chromium): 24 pass / 0 fail, exit 0 (L2-pre, L2a–e OK)
- trade-route-remove-stock-flow-live: 12 passed / 0 failed, exit 0
- r-bitwa-etykieta real-render: PASS x2 (exit 0 oba)
- 5 bramek: logic 213/213; tech-tree 20/0; research 33/0 ALL GREEN; unit-replace 21/21; combat 6/6 — wszystkie exit 0
- dodatkowo na symulowanym merge origin/main (794ec9eda) + 23f4038e9 (merge-tree czysty, tree cfed6fa77): tsc 0; city-cession 72/0; json-desc 19/0; truce-r1 31/0; stol-pw-sum 168/0; logic 213/213; combat OK; diplo-truce-live 24/0 (zarzut 3 Evaluatora domknięty pomiarem)
- git diff --check 79abbf0bf..23f4038e9: czysto
BLOKADY: brak.
ROZSTRZYGNIĘCIE ZARZUTÓW:
1. diplo-truce-live czerwony — ODDAL/ZAMKNIĘTE: przyczyną była bramka NNS spichlerza (klasa A, dowód w logu gry i w teście), nie overlay; po SETUP setPlayerGranary(999) (hak istnieje w gra/src/main.ts:32572, tylko ?civTest=1) test zielony 24/0 u mnie. Scenariusz nie wymagał skracania.
2. `.catch` połykający timeout — ZAMKNIĘTE: usunięty, jest asercja L2-pre. L2b-odmowa pozostaje jawnym NIE_ZMIERZONO (dopuszczone dispatchem; uwaga, nie blokada).
3. Pomiar na aktualnym main + sprzątanie bundle + r-bitwa N>1 — ZAMKNIĘTE: main zmierzony (wyżej), bundle sprzątany w trade-route-live i truce-live, r-bitwa N=2 u mnie.
Żaden zarzut nie wymaga NAPRAW.
KANDYDACI KLASY B: brak.
RUNDY: FC po rundzie 2/5.
NASTĘPNY KROK: integracja orkiestratora (FF/merge 23f4038e9 do main; merge-tree z 794ec9eda czysty); po integracji sprzątnięcie /tmp (civ-trsf-bundle-21569 pozostałość po innym przebiegu).
UWAGI-DLA-ORKIESTRATORA:
- Testy live nadpisały evidence R-WEB-TRUCE-Q1/*.png — przywrócono przed commitem.
- L2b-odmowa (gałąź AI odmawia po wygaśnięciu rozejmu) bez pokrycia — kandydat na osobny temat testowy (zasiew armii).
- Z DODATKU Operatora: gałąź „tury wojny ≥20” żądania miasta martwa (zmęczenie ≥0,8 wyprzedza); test dostosowany do obecnego kodu (klasa A) — decyzja produktowa/ #376 poza zakresem.
- Obserwacja: workflow wskazywał bazę 63a26921c, która nie jest przodkiem kandydata; kod/testy zweryfikowane na 79abbf0bf-pochodnym i na merge z bieżącym main.
DEPLOY/PUSH: NIE WYKONANO
