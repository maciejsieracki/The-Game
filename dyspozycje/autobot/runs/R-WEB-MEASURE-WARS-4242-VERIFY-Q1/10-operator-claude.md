STATUS: PASS-WITH-NOTES
DOMAIN: GAME
TEMAT: R-WEB-MEASURE-WARS-4242-VERIFY-Q1
GOAL: Zmierzyć po FALACH 891 i 896 na seed 4242 limit wojen naturalnych, limit 2 sojuszy AI↔AI oraz parowanie wojen epoki (pending Brązu).
ZMIANY/COMMIT: allowlista: dyspozycje/analizy/POMIAR-WOJNY-4242-PO-FALACH-891-896-2026-11-25.md, dyspozycje/autobot/runs/R-WEB-MEASURE-WARS-4242-VERIFY-Q1/** (w tym dane/). Zero zmian w gra/src i gra/data. Commit: SHA w polu sha wyniku.
TESTY:
- tsc --noEmit (gra/): exit 0
- node tools/logic-test.cjs: LOGIC OK (213/213)
- node tools/ai-test.cjs: ai-test: 297 passed, 0 failed
- Limity wojen (diplo, seed 4242, 67 tur, flagi domyślne, 66 wierszy): max wojen naturalnych na AI = 1, naruszeń 0; gracz max naturalnych 0.
- Limit sojuszy AI↔AI (limit 2): max 3 na AI, naruszenie w turach 66 i 67 (AI 1 z sojuszami 10, 13, 19 wg pola status; pole pokoj dla 1–13 jest sprzeczne, do weryfikacji).
- Wojny epoki (seed 4242, 86 tur, stop wall-limit): pairing-unresolved 3 (przed 24), pending Brązu 37–50 tur (przed 68), wypowiedzenia Brązu tury 80, 81, 84.
- Dane: dane/diplo-seed4242-harder0.jsonl.gz, dane/era-seed4242.jsonl.gz, SHA256 w dane/SHA256SUMS.txt.
BLOKADY:
- Wojny epoki nie do 120 tur (wall-limit 540 s, wznawianie SIGSEGV, temat #90); zatrzymanie na turze 86.
- Sojusz 2 nie zamknięty: NIE DZIAŁA wg analizatora.
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje o R-WEB-* dla limitu sojuszy AI↔AI (tury 66–67, seed 4242, AI 1) oraz o dokończeniu pomiaru wojen epoki do tury 120.
UWAGI-DLA-ORKIESTRATORA: bundle w /tmp/wars4242-dist do usunięcia po zakończeniu; gra/node_modules w worktree (npm ci --ignore-scripts) do usunięcia przed sprzątaniem worktree.
DEPLOY/PUSH: NIE WYKONANO
