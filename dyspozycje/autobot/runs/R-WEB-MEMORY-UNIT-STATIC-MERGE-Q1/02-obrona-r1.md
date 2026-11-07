STATUS: PASS
DOMAIN: GAME (WEB) — pamięć i wydajność renderu jednostek
TEMAT: R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1
GOAL: statyczne części żetonu scalone w jeden mesh na materiał; zachowane picking, zaznaczenie, animacje, deferred dim, mgła, kolory właściciela, SmallPartLod, pule; różnica obrazu ≤ ~120 px z 1,6 mln.

ZMIANY-COMMIT:
- stan odtworzony z commita Operatora `e866e18899c60c8ccce7eb25472fa5dceae71b7b` (baza `6a673c838b306dbad47dd33d58f5f5a72882a71c`), gałąź `autobot/R-WEB-MEMORY-UNIT-STATIC-MERGE-Q1-obrona`;
- kod gry (`gra/src/**`) BEZ ZMIAN w obronie;
- zmieniony tylko test z allowlisty: `gra/tools/memory-unit-static-merge-game-frame.cjs`;
- doszły: ten raport, `gate-obrona-r1-*.txt` (4 pliki), `zrzuty/gra-K1..K5-{A-przed,B-po,roznica}.png` (15 plików; 3 starsze nadpisane);
- SHA commitu obrony: w odpowiedzi do orkiestratora (`git log -1` gałęzi).

## Odpowiedzi na zarzuty

**Z1 (miara pełnej klatki) — PRZYJMUJĘ.**
Poprawka: test pełnej klatki liczy teraz piksele różne w DOWOLNYM kanale, bez progu 8/255 (tak jak S3 i GOAL). Każdy build uruchamia się dwa razy (A1, A2, B1, B2), więc mierzy też szum A vs A i B vs B.
Dowód (`gate-obrona-r1-game-frame.txt`, EXIT=0):
- szum we wszystkich kadrach K1–K5: 0 px;
- A vs B: K1 0, K2 0, K3 1, K4 1, K5 1 px z 1,6 mln, maks. różnica kanału 1/255.

Skąd 313 px u Operatora: we wcześniejszych przebiegach tej obrony K1 **A1 vs A2** (ten sam build) dał dokładnie 313 px (maks. 2/255, kwadrat 20×20 px). To był szum klatki, a nie skutek scalenia.
Drugie źródło szumu: podpowiedź DOM `#civ-hint-toast` (55 414 px). Znika po 18 s czasu strony, więc jej stan zależy od długości ładowania. Test chowa ją stylem, bo to element UI bez związku z żetonami.
Czułość testu: mutacja (scalony mesh niewidoczny, build poza repo, zmiana cofnięta) daje FAIL w 5/5 kadrach: 1 141 / 10 213 / 34 183 / 33 930 / 34 183 px (`gate-obrona-r1-game-frame-mutacja.txt`). Test na pewno widzi scalone meshe w klatce gry.

**Z2 (zakres pełnej klatki) — PRZYJMUJĘ marsz i wiele żetonów; ODRZUCAM porównanie pikseli w t.50 (dowód niżej).**
Poprawka: doszły 3 kadry w prawdziwej grze, z prawdziwą pętlą renderu z `main.ts`. Od K3 zegar strony jest zatrzymany (`page.clock`), a render idzie stałymi krokami:
- K3: 60 dodatkowych żetonów dwóch właścicieli, kamera na żetonie, który potem rusza;
- K4: prawdziwy ruch o 1 heks (`moveStep` → `startAnimatedMove` → `setTokenWorldPosition`), klatka w trakcie odcinka (48 z 140 ms; sprawdzone: animacja trwa, heks startowy i docelowy w kadrze);
- K5: po zakończeniu ruchu.
Wynik: 1 / 1 / 1 px A vs B.
Atak na mapie idzie tą samą ścieżką co marsz: `main.ts` 41959–41972 przesuwa wyłącznie korzeń żetonu. „Wypad” ataku jest dodatkowo pokryty przez S3 (2 px).
t.50 — ODRZUCAM: świat w t.50 nie jest deterministyczny. Ten sam build przy tym samym seedzie daje 424 / 385 / 412 jednostek (pre1–3, `pomiar-gra/raw-pre.jsonl`). A i B pokazywałyby więc różne światy, a porównanie pikseli nic by nie mierzyło. Gęstą scenę zastępuje deterministyczny K3. Obraz w t.50 pozostaje NIE_ZMIERZONY.

**Z3 (komplet zrzutów) — PRZYJMUJĘ.**
W `zrzuty/` jest 15 plików `gra-K1..K5-A-przed.png`, `-B-po.png` i `-roznica.png` (magenta = dowolna różnica). Przejrzałem K2, K3 i K4: gęsta scena, żeton w ruchu między heksami, bez artefaktów. Mapy różnic są praktycznie czarne (1 px).

**Z4 (baza render-all) — PRZYJMUJĘ.**
Poprawka: własny przebieg bazowy 79 narzędzi `*render*` na `origin/main 6a673c838` w osobnym worktree poza repo. Runner i timeouty takie same jak u Operatora (`gate-obrona-r1-render-all-baza.txt`).
Wynik: 54 przechodzą w obu, 22 nie przechodzą tak samo jak na bazie, 3 rozbieżności:
- `sidepanel-diplo-dismiss`: teraz 1, baza 0. Powtórzony na kodzie tematu: 35/0, EXIT=0, więc niestabilny;
- `garrison-panel-pinning`: teraz 1, baza 0. Na kodzie tematu 3× 16/0;
- `tartak-wzgorze-las`: teraz 0, baza 1, czyli lepiej niż baza.
Regresji: 0. `render-unit-sharpness-measure` daje 0 na bazie i 0 teraz.

**Z5 (koszt budowy) — PRZYJMUJĘ jako uwagę; kod bez zmian.**
Trzeci pomiar (`gate-obrona-r1-heap.txt`): sync 475 żetonów od zera 572 → 836 ms (+46%), H3 ≤ 2,5× spełnione; sterta 67,0 → 29,3 MB.
Razem z pomiarami Operatora (675 → 858) i Evaluatora (605 → 832) koszt budowy żetonów od zera rośnie o +27–46%, czyli około +0,4–0,6 ms na żeton. Przy wczytaniu gry z około 400 jednostkami to jednorazowo około +0,2 s.
Przejście tury jest szybsze: syncUnitsRender w t.50 186,6 → 108,0 ms. Uwaga zostaje w BLOKADY dla Final Control.

TESTY (obrona, wszystkie w pierwszym planie, każde wywołanie < 10 min):
- game-frame (nowa wersja): 7/0, EXIT=0;
- mutacja game-frame: wykryta 5/5;
- render-all, baza obrony: 79 narzędzi, 0 regresji;
- powtórki rozbieżnych narzędzi: sidepanel-diplo-dismiss 35/0, garrison-panel-pinning 3× 16/0;
- heap: 3/0, EXIT=0;
- `node --check` narzędzia: OK; `git diff --check`: czysto.
Pozostałe bramki Operatora (tsc, logic, S-testy, pomiar w grze) nie wymagały powtórki, bo kod gry się nie zmienił. Evaluator odtworzył je na e866e18.

BLOKADY: brak. Uwagi dla Final Control:
- (a) Z5: jednorazowy koszt budowy żetonów +27–46%;
- (b) obraz w t.50: NIE_ZMIERZONO (świat niedeterministyczny);
- (c) możliwy konflikt w `units.ts` z R-WEB-PERF-ENDTURN-RENDER-HUD-Q1 przy integracji;
- (d) buildy, cache i worktree bazy obrony usunięte po pracy.

RUNDY: 1/5 (obrona rundy 1)
NASTĘPNY KROK: Final Control → integracja orkiestratora.
DEPLOY-PUSH: NIE WYKONANO
