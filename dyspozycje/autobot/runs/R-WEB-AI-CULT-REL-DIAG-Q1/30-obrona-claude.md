STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-AI-CULT-REL-DIAG-Q1
GOAL: ustalić LICZBAMI, dlaczego AI na „Kultura i religia: trudny” (poziom maksymalny) ma ok. 30% mniej jednostek i dużo pustych miast względem trybu zgodności. Tylko pomiar i diagnoza, zero zmian reguł i balansu.
ZMIANY/COMMIT: baza kandydat af6f8c4f9 (BAZA origin/main 5748b924f, FALA 926). Commit obrony: SHA w polu sha odpowiedzi (czubek gałęzi detached nad af6f8c4f9). Zmienione ścieżki: gra/src/main.ts (hak cityTransfersLast i liczenie przejęć miast za ?civTest=1, tylko odczyt; linie ok. 34553–34638), gra/tools/ai-cult-rel-measure-run.cjs (pole cityTransfers przy --city-state 1), gra/tools/ai-cult-rel-measure-flow.cjs (NOWY, zestawienie przepływów z JSONL), dyspozycje/analizy/AI-KULTURA-RELIGIA-DIAG-2026-11-26.md (przepisany dokument), dyspozycje/autobot/runs/R-WEB-AI-CULT-REL-DIAG-Q1/30-obrona-claude.md (ten raport). Poprawka AI: brak (przyczyna wygląda na wartości balansu, nie na błąd AI). Brak zmian reguł, parametrów ani kultury.
TESTY:
- Pomiar na poziomie maksymalnym (tempo kosztów jednostek `wysoki`, difficulty `trudny`, kultura `trudny`, Porządek `hard`), 4 biegi x 60 tur, headless Chromium, `--build 1` poza repo:
  - trudny s4242: miasta 153, jednostki 159, puste 56 (37%), Porządek śr. 21,2, miasta <14% 60, rebelia 0, nowe jednostki (t2–60) 208, rozwiązane przez AI 59.
  - zgodnosc s4242: miasta 190, jednostki 221, puste 61 (32%), Porządek śr. 44,3, miasta <14% 1, rebelia 0, nowe jednostki 278, rozwiązane przez AI 61.
  - trudny s7: miasta 149, jednostki 138, puste 59 (40%), Porządek śr. 19,1, miasta <14% 75, rebelia 0, nowe jednostki 202, rozwiązane przez AI 69.
  - zgodnosc s7: miasta 182, jednostki 230, puste 48 (26%), Porządek śr. 38,0, miasta <14% 1, bunt 2, rebelia 0, nowe jednostki 295, rozwiązane przez AI 66.
  - Wynik główny: jednostki t60 −28% (s4242) i −40% (s7); nowe jednostki −25% i −32%; zejścia przez rozwiązanie prawie równe (59 vs 61; 69 vs 66), więc luka to produkcja (i wcześniejszy rozjazd miast: t30 68/71 vs 115/125), a nie straty.
  - Kontrola zgodności z rundą 1 (tempo normalny): −31% i −39% jednostek, czyli luka utrzymuje się na poziomie maksymalnym tempa.
- Zestawienie: `node gra/tools/ai-cult-rel-measure-flow.cjs` na katalogach z biegów (wynik w dokumencie analizy).
- Bramki (surowe wyjścia po zmianie haka):
  - tsc --noEmit: exit 0.
  - logic-test: LOGIC OK (213/213).
  - tech-tree-test: 20 pass, 0 fail.
  - research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33.
  - combat-test: All sanity checks passed. (wyjście bez FAIL).
  - ai-test: 297 passed, 0 failed.
  - ai-city-order-need-wiring-test: 231 passed, 0 failed (of 231).
  - ai-unit-replace-same-rules-test: 45 passed, 0 failed.

ODPOWIEDZI NA ZARZUTY (raport 71782dfe1):
1. PRZYJĘTE. Pomiar powtórzony na `wysoki` (maksimum), z zapisanymi ustawieniami w dokumencie (sekcja „Poziom maksymalny”). `normalny` zostaje jako odniesienie.
2. PRZYJĘTE CZĘŚCIOWO, z poprawką. Dodane przejęcia miast per przyczyna (cityTransfersLast) i pierwsza tura budynków Prawa/Szczęścia (flow). NIE ZMIERZONO, z powodem: rozdział zakup/produkcja (wymaga haka w ścieżkach zakupu i produkcji, osobny temat) i utrzymanie żywnościowe jednostek (pole jest, nie zsumowane w tej rundzie).
3. PRZYJĘTE. Hipoteza „Porządek → produkcja” zdegradowana do hipotezy w dokumencie. Hak mierzy PorPct, a T1 jest w punktach Porządku. Kary ×0,80/×0,65 wnioskowane z data/society-params.json (hard), nie zmierzone. Rozstrzygnięcie zmienione na hipotezę.
4. PRZYJĘTE. Premisa „dużo pustych miast” zweryfikowana: t60 37% vs 32% (s4242, mała różnica), 40% vs 26% (s7). Dokument rozdziela udział pustych i liczbę miast.
5. PRZYJĘTE CZĘŚCIOWO. ODRZUCAM z dowodem: rozwiązanie przez AI nie jest przyczyną (59 vs 61; 69 vs 66). NIE ODRZUCAM: mniej złota na zakup. Skarbiec t40 jest niższy w obu ziarnach (9 581 vs 15 132; 9 873 vs 16 467), ale t60 niestabilny (3 731 vs 6 058; 4 374 vs 4 492). Brak potwierdzenia, rozdział zakupu NIE ZMIERZONO.
6. PRZYJĘTE. (a) linia haka poprawiona na main.ts:34604 (cityStateTurn) i :34638 (cityTransfersLast) zamiast „ok. 34350”. (b) Pałac: w tempie wysoki, t10: AI trudnego 0 budynków `palac`, zgodność 8 (poprzedni „1” z biegu normalny). Dlaczego 0 w trudnym: NIE ZMIERZONO. (c) analyze.py poza repo zastąpiony zacommitowanym gra/tools/ai-cult-rel-measure-flow.cjs.

RUNDY: 2/5 (runda 1: Operator, werdykt Evaluatora z zarzutami 1–6; runda 2: ta obrona). Ostatni werdykt: Evaluator zarzuty 1–6 (wyżej).
BLOKADY: brak blokad technicznych. Pomiary wykonano bez run_in_background, każdy bieg w osobnym wywołaniu Bash (poniżej 590 s). Dane surowe poza repo: /tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/aicult-r2/. Symlink gra/node_modules do cudzego worktree użyty tylko lokalnie (ignorowany przez .gitignore, nie commitowany). Brak decyzji wymaganej od właściciela w tym temacie poza DECISION_REQUIRED z dokumentu (A/B).
NASTĘPNY KROK: orkiestrator: (1) Evaluator sprawdza runda 2 względem zarzutów 1–6; (2) decyzja właściciela DECISION_REQUIRED (A: zostawić / B: zmienić parametry Porządku i kultury dla „trudny”); (3) osobne tematy NIE ZMIERZONO: rozdział zakup/produkcja jednostek (hak w ścieżkach zakupu i produkcji), wpływ kar niepokoju w punktach Porządku, warunek braku rebelii przy 60 miastach poniżej 14%, dlaczego AI trudnego zakłada mniej miast do t30 i nie buduje pałacu w t10.
UWAGI-DLA-ORKIESTRATORA: znalezisko do osobnej oceny (nie zgłaszam sesji): 60 miast AI w strefie buntu skrajnego (PorPct < 14%) przy 0 miastach w rebelii przez 60 tur. Może to być ochrona garnizonem z FALI 926 albo luka; nierozstrzygnięte. Hak cityStateTurn i cityTransfersLast zostają w main.ts jako odczyt za ?civTest=1 (bez wpływu na grę).
DEPLOY/PUSH: NIE WYKONANO
