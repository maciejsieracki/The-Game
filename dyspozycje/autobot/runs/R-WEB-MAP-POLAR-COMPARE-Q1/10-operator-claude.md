STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar generatora)
TEMAT: R-WEB-MAP-POLAR-COMPARE-Q1
GOAL: Zmierzyć metryki mapy „kontynenty” PRZED (6fe46acef) i PO polarze (c93090bc5) dla rozmiarów malenki/maly/standardowy i seedów 1, 7, 42, 99, 4242, z werdyktem per metryka. Dane z SHA256 w repo.
ZMIANY/COMMIT: nowe pliki: gra/tools/polar-before-after-measure.cjs (skrypt pomiarowy), dyspozycje/analizy/POLAR-PRZED-PO-2026-11-25.md (dokument z tabelą i werdyktami), dyspozycje/autobot/runs/R-WEB-MAP-POLAR-COMPARE-Q1/10-operator-claude.md (ten raport), dyspozycje/autobot/runs/R-WEB-MAP-POLAR-COMPARE-Q1/dane/ (PRZED-kontynenty.jsonl.gz, PO-kontynenty.jsonl.gz, compare-PRZED-PO.md, SHA256SUMS.txt). Zero zmian w gra/src i gra/data. Commit: patrz pole sha w odpowiedzi.
TESTY:
- tsc --noEmit (gra/): exit 0.
- logic-test.cjs: LOGIC OK (213/213).
- ai-test.cjs: 297 passed, 0 failed.
- map-polar-continents-test.cjs na kandydacie: PASS (polar 387/402/404/371 dla seedów 1/7/42/4242; malenki/42 = 57; ziemia/42 = 0).
- Pomiar metryk (15 map na wersję, sekwencyjnie): PRZED i PO wykonane w całości dla malenki, maly i standardowy.
- Oficjalny map-coast-buffer-test.cjs na kandydacie: przerwany po 580 s (exit 124). Zgłosił FAIL „ląd w buforze brzegu” dla wszystkich typów i seedów, które zdążył wykonać (23 FAIL). Pełny wynik NIE ZMIERZONO.
- Pełne ciężkie testy (land-sea-ratio, stranded-land, map-gen-regression, map-continents-rivers, relief-grid-coverage, world-density, deposit-coast, map-coast-buffer) NIE URUCHAMIANE w całości. Metryki odtworzone skryptem (dispatch zakazuje pełnych ciężkich testów).
- Werdykty per metryka (szczegóły i tabela w dyspozycje/analizy/POLAR-PRZED-PO-2026-11-25.md):
  - landDev: BEZ REGRESJI (w tolerancji 0,04; max |dev| 0,0009).
  - specks (stranded): BEZ REGRESJI (8 → 0).
  - pustOcean, dryTouchSea, inlandWater, badOutlet, badReal, depositsOnWater, ironFail, copperFail, livestockGory: BEZ REGRESJI (zera w PRZED i PO).
  - polar: BEZ REGRESJI (PRZED zero na 13/15 map; PO 28–404 na każdej mapie, w sufitach ≤600).
  - borderLand: REGRESJA kierunkowa (suma 737 → 837; PO > PRZED na 9/15, max +43 przy standardowy/7). Asercja testu (zero) NIE SPEŁNIONA w PRZED i PO: baza ma 10–111 heksów na każdej mapie.
  - inlandSea: REGRESJA kierunkowa, bez asercji testu dla generujSwiat (suma 4078 → 4978; PO > PRZED na 8/15; standardowy 4 z 5 seedów wyżej). Zmiana mieszana w znaku dla malenki/maly.
  - masses, sea, riverPaths, riverLen, riverHexes, forest, desert, hills: INFO (bez asercji; riverPaths 1996 → 2133, riverLen 24104 → 25719).
  - ms: NIE ZMIERZONO czysto (maszyna współdzielona); suma 378 s → 547 s; test map-gen-regression ma limit 7 s (WARN, obie wersje go przekraczają).
BLOKADY:
- Oficjalny map-coast-buffer-test nie zakończony (limit czasu 580 s). Wynik częściowy tylko.
- Czas generacji nieizolowany (wpływ współbieżnych sesji na hoście).
- Typy ziemia, wyspy, pangea, superogromny NIE mierzone (zakres dispatchu).
RUNDY: 1/5 (ostatni werdykt: PASS-WITH-NOTES; decyzja wymagana: patrz NASTĘPNY KROK).
NASTĘPNY KROK: Orkiestrator / właściciel decyduje, czy regresje borderLand (asercja czerwona już w bazie, +9/15 map) i inlandSea (kierunkowo, bez asercji) blokują deploy POLAR A1. Ewentualnie: osobny temat naprawy borderLand (oficjalny map-coast-buffer-test w bazie już czerwony). Do rozstrzygnięcia też: czy pełne ciężkie testy generatora uruchamiać w osobnym oknie czasowym (Q14-E2).
DEPLOY/PUSH: NIE WYKONANO
UWAGI-DLA-ORKIESTRATORA:
- Oficjalny map-coast-buffer-test na kandydacie wykazuje FAIL „ląd w buforze brzegu” (wszystkie typy). Metryka PRZED potwierdza, że ta asercja była czerwona także w bazie 6fe46acef. Warto potwierdzić oficjalnym runem na bazie (nie wykonane, brak czasu).
- Skrypt gra/tools/polar-before-after-measure.cjs wymaga ESBUILD_MODULE (esbuild) i zależności `three` w katalogu bundla; w tej sesji zainstalowano je w scratchpadzie.
- Zauważony nie-pomiarowo: map-gen-regression ma limit 7 s na standardowy, którego baza nie spełnia na tej maszynie (40–110 s). Do rozważenia przez właściciela, nie przez ten temat.
