STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1
GOAL: Dopłata D sojuszy AI↔AI: mnożnik 1,0 → 0,5 w jednym źródle prawdy (gra/data/ai-ai-treaty-params.json, klucz dopłataDMnoznikAiAi), bez zmian reszty dyplomacji.
ZMIANY/COMMIT: baza aa96cfc618de124e48b74408870115854293e6c5 (origin/main, detached). Zmienione pliki:
  - gra/data/ai-ai-treaty-params.json: dopłataDMnoznikAiAi 1.0 -> 0.5 (+ aktualizacja komentarza _uwaga_dopłata_d).
  - gra/src/game/ai-ai-treaty-evaluate.ts: tylko komentarz doc przy aiAiDopłataMnoznik (domyślnie 0,5). Logika bez zmian; fallback (ujemny/NaN/Infinity -> 1,0) bez zmian.
  - gra/tools/ai-ai-alliance-surcharge-test.cjs: re-pin D1 (1,0 -> 0,5), D5 (powrót do danych = round(D*0,5)), D2 (mnożnik 1,0 ustawiany jawnie setterem, bit-w-bit jak przed zmianą), nowe D11 (pin wartości w JSON = 0,5), nowa mutacja M5 (powrót do 1,0 w ścieżce danych).
  - gra/tools/ai-ai-treaty-evaluate-test.cjs: re-pin A4a/A4b (paymentGold = round(D*0,5) zamiast D), A5a/A5b (skarbiec progowy = round(D*0,5)); uzasadnienie: test pinował płatność 1,0 przy domyślnym mnożniku.
  - dyspozycje/autobot/runs/R-WEB-DIPLO-ALLIANCE-SURCHARGE-D-HALF-Q1/10-operator-claude.md (ten raport).
  Uwaga do allowlisty: dispatch wskazywał nowy plik gra/tools/diplo-alliance-surcharge-d-test.cjs. Nie utworzono go; dowodowy test dopłaty D to istniejący gra/tools/ai-ai-alliance-surcharge-test.cjs (zmodyfikowany, zgodnie z dopuszczeniem "nowy/zmodyfikowany"). Nie wykonano żadnej zmiany poza allowlistą.
  Nie zmieniono: progi, sojusze, koalicje, NAP, przemarsz, gracz, inne parametry dyplomacji (diplomacy.json nietknięte).
  Commit: patrz SHA w polu sha odpowiedzi (commit obejmuje tylko 4 pliki kodu/testów + raport).
TESTY:
  - tsc --noEmit (gra/): exit 0 (po zmianie).
  - logic-test: LOGIC OK (213/213) (po zmianie).
  - tech-tree-test: 20 pass, 0 fail (po zmianie).
  - research-test: PASSED: 33 / FAILED: 0 / TOTAL: 33 (po zmianie).
  - unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21) (po zmianie).
  - combat-test: COMBAT TEST: 6/6 pass (po zmianie).
  - ai-ai-alliance-surcharge-test (nowy dowód D1..D11 + mutanty): RESULT: ALL GREEN (live + mutants detected); M1..M5 = MUT-OK (wszystkie wykryte), w tym M5 "powrót do 1,0 w ścieżce danych" -> czerwony test D1 (mutacja pokazana: mnożnik 1,0 wykryty).
  - ai-ai-treaty-evaluate-test: 21 pass / 0 fail; mutanty niewykryte: 0 (po re-pinie A4/A5; przed re-pinem 18 pass / 3 fail: A4a paymentGold=3000 D=6000, A4b to samo, A5a zaakceptowano przy za małym skarbcu).
  - ai-ai-alliance-limit-test, ai-ai-alliance-tick-test, ai-ai-coalition-test, ai-ai-treaty-nap-wiring-test, ai-ai-alliance-measure-hook-test: exit 0 (po zmianie).
  - diplomacy-alliance-strength-unit-test: Wynik: 34 OK, 0 FAIL.
  - diplo-alliance-gate-test: 21 PASS, 0 FAIL.
  - diplomacy-alliance-sim: exit 0.
  - diplomacy-proposal-test: 200/200 PASS. diplomacy-treaties-test: 17/17 PASS. diplomacy-test: 149 passed, 0 failed (total 149).
  - diplomacy-war-level-test: OK: wszystkie asercje zielone, wszystkie mutanty wykryte. diplomacy-zero-trust-unit-test: PASS=44 FAIL=0.
  - Runnery pomijane w bramkach (nie są testami): ai-ai-alliance-measure-analyze (exit 2 także przed zmianą), ai-ai-treaty-live-proof-breach-test / -wiring-test (exit 2 także przed zmianą), ai-ai-alliance-measure-run i ai-ai-treaty-live-proof-wiring-run (długie runnery pomiarowe, przerwane po timeoucie; wynik nieistotny dla bramek). Przed zmianą exit 2 i 124 — ten sam obraz.
  - git diff --check: czysto.
  - Uwaga: w gra/ai-economy-out/ powstał nieśledzony katalog (artefakt runnera, którego uruchomiłem przypadkowo); NIE jest w allowlist i NIE jest w commicie.
BLOKADY: brak.
RUNDY: 1/5 (Operator, Haiku 5.5). Ostatni werdykt: n/d (pierwsza runda).
NASTĘPNY KROK: Evaluator — weryfikacja re-pinów (A4/A5 w ai-ai-treaty-evaluate-test, D1/D2/D5 w surcharge-test) i pełnych bramek; następnie Final Control.
DEPLOY/PUSH: NIE WYKONANO

NIE ZMIERZONO: skutek zmiany dopłaty D w grze (balans, częstość sojuszy, skarbce AI). Pomiar kierunkowy nie był wymagany.

UWAGI-DLA-ORKIESTRATORA:
  - Stary komentarz w ai-ai-treaty-evaluate.ts mówił "domyślnie 1,0"; zaktualizowano na 0,5 (tylko komentarz).
  - Dyspozycja wspomina test gra/tools/diplo-alliance-surcharge-d-test.cjs; nie powstał (użyto istniejącego ai-ai-alliance-surcharge-test.cjs). Jeśli orkiestrator wymaga dokładnie nowego pliku, to decyzja do podjęcia przy integracji.
  - Testy measure-run / live-proof-wiring-run są wolne (>300 s) — nie nadają się do bramki foreground.
