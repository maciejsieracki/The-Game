STATUS: PASS-WITH-NOTES
DOMAIN: GAME (pomiar, bez zmian gry)
TEMAT: R-WEB-MEASURE-LIMITS-FLEE-FORTRING-Q1
GOAL: Zmierzyć na żywej grze cztery funkcje (limit wojen, limit 2 sojuszy, FORTRING, FLEEMANUAL) i zapisać werdykty z liczbami albo NIE ZMIERZONO z powodem.
ZMIANY/COMMIT: nowe `gra/tools/limits-measure.cjs` (analizator JSONL, odczyt), nowe `dyspozycje/analizy/POMIAR-LIMITY-FLEE-FORTRING-2026-11-25.md`, ten raport. Commit zawiera tylko te pliki. Baza 35f601ae304471593c4921a61bfecbddbb9de14a, zero zmian w gra/src i gra/data.
TESTY:
- tsc --noEmit: exit 0
- logic-test: LOGIC OK (213/213)
- tech-tree-test: 20 pass, 0 fail
- research-test: PASSED 33 / FAILED 0 / TOTAL 33
- unit-replace-test: WSZYSTKIE TESTY ZIELONE (21/21)
- combat-test: COMBAT TEST 6/6 pass
- ai-test: 297 passed, 0 failed
- Pomiar live (seed 4242, Chromium, flagi ON i OFF, tury 2–67): wyniki i werdykty w pliku analizy. Seed 7 NIE ZMIERZONO (brak czasu). 90 tur NIE OSIĄGNIĘTO (limit polecenia 590 s; wznowienie slotu kończy się SIGSEGV Chromium).
BLOKADY:
- (c) FORTRING: NIE ZMIERZONO — brak hooka/runnera przełączania pierścienia i pomiaru wydajności; round-trip zapisu NIE ZMIERZONO (SIGSEGV przy wznowieniu, harness).
- (d) FLEEMANUAL: NIE ZMIERZONO — brak runnera scenariusza odwrotu (nie wykonano w tej rundzie).
- Wznowienie biegu (--stop-at) kończy się SIGSEGV Chromium po pierwszym udanym wznowieniu (zob. #90).
RUNDY: 1/5
NASTĘPNY KROK: Orkiestrator decyduje o R-WEB-* dla naruszenia limitu wojen naturalnych u AI 28 (tury 60–67, seed 4242, flagi ON): najpierw ustalić ścieżkę deklaracji (kandydaci: ownerDeclareWarOn z force=true; przyłączanie przez sojusz, main.ts ~26237), potem minimalne odtworzenie. Osobno: runner FORTRING i FLEEMANUAL, naprawa wznowienia harnessu.
DEPLOY/PUSH: NIE WYKONANO

UWAGI-DLA-ORKIESTRATORA:
- Werdykt (a): NIE DZIAŁA w tym biegu — w turach 60–67 AI 28 ma dwie wojny naturalne (1↔28 i 22↔28) przy limicie 1; kontrola OFF tego nie pokazuje (bez flagi limit nie działa). Nie zweryfikowano źródła deklaracji 22↔28.
- Werdykt (b): DZIAŁA w tym biegu — maks. 2 sojusze per AI w 66 turach, 0 naruszeń.
- Dane surowe poza repo: katalog scratchpad sesji (runB1/seed4242-all1.jsonl, runB0/seed4242-all0.jsonl).
- Bramka gry: gra/node_modules zainstalowany na czas bramek; usuwany po commicie.
- Brak spawn_task/create_session/create_trigger/send_later; brak run_in_background.
