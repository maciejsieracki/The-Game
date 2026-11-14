STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-NNS-AI-BALANCE-FROM-TURN1-Q1
GOAL: równoważenie skarbca/spichlerza AI aktywne od tury 1 (NNS_AI_BALANCE_TURN_MIN = 1); gracz bez zmian (wyjątek tur 1–10 i NNS_WOLNE_TURY = 10 zostają); ten sam kod dla wszystkich AI.
BAZA: b0311c92f (origin/main, ROBOCZA e40ee34e, FALA 706)

ZMIANY/COMMIT:
- gra/src/game/no-negative-stocks.ts: NNS_AI_BALANCE_TURN_MIN = NNS_WOLNE_TURY + 1 zmienione na = 1; komentarze (nagłówek „Tury 1–10” -> gracz bez blokady, AI od tury 1; komentarz stałej).
- gra/tools/no-negative-stocks-c2-test.cjs: asercja progu 11 -> 1; asercja „tura 10: brak równoważenia” -> „AI równoważy”; dodana asercja tury 1; nagłówek.
- gra/tools/no-negative-stocks-ai-from-turn1-test.cjs (NOWY): AI aktywne w T1/T5/T10/T11 przy minusie, minus spichlerza w T1, brak aktywacji bez minusa w T1, determinizm, mutacja flagi (wyłączona -> T1 nieaktywne), gracz T1/5/10 bez blokady, gracz T11 z blokadą.
- main.ts: NIE zmieniano. Wywołanie nnsAiPreTickBalance (l. ~7522, `if (turn < NNS_AI_BALANCE_TURN_MIN) return;`) działa poprawnie z progiem 1 (turn startuje od 1, l. 14274). Ścieżka AI bez miast: `if (ownerCities.length === 0) continue;` — brak błędu w T1.
- Testy tury 1–10 gracza (no-negative-stocks-test.cjs, endturn, gate-levers) nie zmieniane — wyjątek gracza zostaje.
- Commit: patrz pole SHA w StructuredOutput (commit z kodem + raportem, tylko allowlista).

TESTY:
- Nowy test na bazie (kod źródłowy b0311c92f przywrócony tymczasowo): 16 passed, 11 failed -> CZERWONY na bazie (dowód nietautologiczności).
- Nowy test po zmianie: 27 passed, 0 failed.
- no-negative-stocks-c2-test: 44 passed, 0 failed.
- no-negative-stocks-test: 25 passed, 0 failed.
- no-negative-stocks-ai-test: 8 passed, 0 failed.
- no-negative-stocks-endturn-test: 19 passed, 0 failed.
- no-negative-stocks-end-turn-gate-levers-test: 34 passed, 0 failed.
- no-negative-stocks-projection-test: 49 passed, 0 failed.
- diplo-peace-ai-ai-nonnegative-test: 21 PASS, 0 FAIL.
- Bramki referencyjne (§6 playbook): tsc --noEmit exit 0 (0 błędów); logic-test LOGIC OK (213/213); tech-tree-test 20 pass, 0 fail; research-test PASSED 33/33; unit-replace-test 21/21; combat-test 6/6.
- git diff --check: czysto (przed commitem i w cached).
- NIE_ZMIERZONO: pomiar headless przed/po (3 ziarna, T1–30; no-negative-stocks-headless-measure.cjs) — NIE uruchomiono (wymaga bundla vite poza repo i wielominutowego przebiegu; nie wykonano w tej rundzie). Brak danych o wpływie na tempo AI w T1–30.
- NIE_ZMIERZONO: weryfikacja live w Chromium (10 tur z AI, bez ujemnych stanów AI po turach 1–10) — NIE wykonano w tej rundzie. c3-turn-test sprawdza tylko tury >= 12, więc nie pokrywa T1–10.
- Uwaga: npm ci --ignore-scripts w gra/ (instalacja zależności, bez build/dev); node_modules w worktree, nie w git.

BLOKADY: brak blokad kodowych. Pomiar headless i live nie wykonane (jw.).

RUNDY: 1/5 (ostatni werdykt: brak; decyzja wymagana: nie)

DECYZJA DLA ORKIESTRATORA (UWAGI-DLA-ORKIESTRATORA):
- Dispatch w origin/main nie istnieje (00-dispatch.md brak w origin/main); użyto DODATKU z origin/claude/sprawdzenie-funkcjonalnosci-ek4ra0.
- Ryzyko z dispatchu (AI wstrzymuje zakupy wcześniej) pozostaje NIEZMIERZONE — zalecany pomiar headless przed deployem.
- Dług Rust z dispatchu (REPIN progu równoważenia AI) — do założenia przez orkiestratora, nie wykonano.
- Testy dotyczące wyłącznie gracza (no-negative-stocks-test, endturn, gate-levers) nie wymagały zmian.

NASTĘPNY KROK: Evaluator (SONNET) — weryfikacja diffu vs allowlista; pomiar headless T1–30 i live 10 tur przed FC/deployem (jeśli wymagane przez właściciela).
DEPLOY/PUSH: NIE WYKONANO
