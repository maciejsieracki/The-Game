STATUS: PASS
DOMAIN: GAME (WEB) - stabilizacja testow z asercjami czasowymi
TEMAT: R-WEB-TEST-TIMING-STABILIZE-Q1
GOAL: Uodpornic asercje czasowe scattered-merge i defend-home na szum CPU bez luzowania progow.
ZMIANY-COMMIT: kod do integracji = 2df4ceb9c (rodzic cd99a80a6, 4df54332a; baza fb910fcac). Allowlista czysta: 2 pliki gra/tools + runs/**; zero gra/src; progi bez zmian.
TESTY (FC, wlasne): gra/ npm ci --ignore-scripts; 6 rownoleglych scattered + 3 defend (9 procesow na 4 rdzeniach), dwie rundy: scattered 12/12 PASS (33/0); defend 5/5 PASS (30/0; T7 PRZED 81-111, PO 110-124 ms, prog 171-217). Jedyny EXIT=1 (defend) to kolizja pliku bundla przy 3 identycznych procesach startujacych jednoczesnie (SyntaxError w loadEngine), nie asercja czasu; po rozstrzeleniu startow 3/3 PASS. tsc --noEmit EXIT=0. git diff --check czysty.
DYSPOZYCJA ZARZUTOW: 1 (scattered niestabilny) ODDAL - Obrona przeszla na process.cpuUsage, odtworzone wczesniej 8/12 FAIL bazy vs 12/12 PASS, potwierdzone u FC pod ciezszym obciazeniem niz u Evaluatora. 2 (ratio chmury ~2.2-2.5x vs 3x+10) ODDAL - margines ~15-20 ms w CPU-time, brak flake w 12 przebiegach; luzowanie progu zabronione. 3 (zakres/metoda) ODDAL - zmieniono metode (CPU-time) dla wszystkich pomiarow scattered. 4 (mutacja +3 ms planera) ODDAL - ograniczenie progu bezwzglednego, zmiana progu zabroniona; +30 ms wykryte; planHomeWar +3 ms wykryte. 5 (defend) ODDAL - 10/10 PASS pod obciazeniem u Operatora, 5/5 u FC. Uwaga: T7 mierzy teraz CPU calego przebiegu symulacji (nie samo decisionMs) - rozcienczenie czulosci, ale mutacja planHomeWar +3 ms nadal wykrywana. Brak NAPRAW, brak DO DECYZJI.
BLOKADY: kandydaci ai-move-full-range-test.cjs:368 i ai-army-replacement-concentration-test.cjs:339 nie zmieniani (decyzja wlasciciela); kolizja bundla przy jednoczesnym starcie wielu defend-home (istniejaca, poza zakresem).
RUNDY: 2/5 (FC rundy 2)
NASTEPNY KROK: integracja orkiestratora 2df4ceb9c (z poprzednikami 4df54332a, cd99a80a6); brak konfliktu z origin/main (c9103e161), ktory nie dotyka tych plikow; niezalezne od origin/rust-port/parity-v2 (rust-port/**), kolejnosc dowolna - najpierw main/web.
DEPLOY-PUSH: NIE WYKONANO
