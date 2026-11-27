STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-ENDTURN-SYNC-PERF-Q1
GOAL: Weryfikacja FALI 933 (cykl syncEndTurnState co 500 ms w bottomBarHud.ts): koszt wydajnościowy, konsola, zawieszony activeEndTurnPointers, odwrotny przypadek aria/canEnd; konfiguracja MAKSIMUM; poprawka kodu tylko po odtworzeniu problemu.
ZMIANY/COMMIT: allowlista: gra/tools/endturn-perf-probe.cjs (nowy, pomiar), dyspozycje/analizy/KONIEC-TURY-CYKL-WYDAJNOSC-2026-11-27.md (wyniki i ocena), dyspozycje/autobot/runs/R-WEB-ENDTURN-SYNC-PERF-Q1/10-operator-claude.md (ten raport). Kod gry (gra/src) NIE zmieniony. Brak poprawki bottomBarHud.ts (brak odtworzenia problemu kosztowego ani poprawności przycisku). Commit: patrz sekcja SHA w StructuredOutput.
TESTY:
- npm ci --ignore-scripts: exit 0
- npx tsc --noEmit: exit 0
- node tools/logic-test.cjs: LOGIC OK (213/213)
- node tools/ai-test.cjs: ai-test: 297 passed, 0 failed
- node tools/endturn-aria-sync-test.cjs: Wynik: 5 PASS / 0 FAIL
- Pomiar live (Chromium headless, konfiguracja MAKSIMUM, bundle z tools/test-hook-setcitylimit-live-bundle.cjs):
  - seed 4242, tura 1: gateInfo() (zawiera canPlayerInitiateEndTurn) n=200: mediana 0 ms, p95 0 ms, max 0,1 do 3,5 ms (3 przebiegi); canEnd=true; konsola 30 s: 0 warn/error/log; rAF mediana ~470 ms (środowisko bez GPU, nieużyteczne do narzutu klatki).
  - seed 7, tura 1: mediana 0 ms, p95 0 ms, max 3,8 ms; canEnd=true; konsola 30 s: 0; rAF mediana 550 ms.
  - seed 4242, t1→t2: klik działa (przebieg z checkpointem 2). Tury 30 i 60: NIE ZMIERZONO.
  - Zablokowana tura (konsola [EndTurn] blocked przy cyklu): NIE ZMIERZONO.
  - Liczba wywołań cyklu w 10 s: NIE ZMIERZONO (brak licznika bez zmiany gra/src).
  - Zawieszony activeEndTurnPointers (pointerdown bez pointerup, odtworzenie mysz poza oknem): NIE ZMIERZONO (kod: bottomBarHud.ts l.190, 198, 340–344).
  - Odwrotny przypadek (aria=true, canEnd=false, klik): NIE ZMIERZONO.
BLOKADY:
- Niestabilność klikania w harnessie: przy wieloturowym pomiarze (1,30) przejście t2→t3 nie zmieniało tury w 120–240 s mimo aria=false, canEnd=true, brak bitwy i trafienia w [data-end] (elementFromPoint). Potwierdzone w 3 przebiegach. Nierozstrzygnięte, czy to artefakt harnessu (klik w fazie AI przy ~2 klatkach/s), czy ścieżka bez efektu kliku. Blokuje pomiary t30/t60.
- Brak trybu bez GPU do pomiaru klatek.
RUNDY: 1/5
NASTĘPNY KROK: (1) temat harnessu: ponowienie kliku po 20 s przy niezmienionej turze i odczyt fazy AI, żeby odblokować t30/t60; (2) pomiar stanu zablokowanego z licznikiem console.warn w 30 s; (3) test live zawieszonego pointera (mousedown na przycisku, mouseup poza oknem). Ocena kodu do rozstrzygnięcia w osobnym temacie: healStaleEndTurnBlockers() wywoływane co 500 ms poza gestem gracza (main.ts l.43607, 43378).
UWAGI-DLA-ORKIESTRATORA:
- Cykl 500 ms wywołuje canPlayerInitiateEndTurn(), które zaczyna się od healStaleEndTurnBlockers() (efekty uboczne) i zawiera 10 wywołań console.warn '[EndTurn] blocked' — w stanie zablokowanym może to dać ~2 wpisy/s. Do oceny jako osobny temat, nie wdrażane.
- Narzędzie gra/tools/endturn-perf-probe.cjs: argumenty <katalog_poza_repo> <seed> <tury=1,30,60> <seg=25>; wynik JSONL w katalogu poza repo.
- Bieg bez commita w pliku wyników nie był wymagany; dane surowe w /tmp/claude-0/endperf-out (poza repo).
- Procesy chromium tego tematu zakończone po każdym przebiegu (browser.close w finally); sprawdzono pgrep endturn-perf-probe: 0.
DEPLOY/PUSH: NIE WYKONANO
