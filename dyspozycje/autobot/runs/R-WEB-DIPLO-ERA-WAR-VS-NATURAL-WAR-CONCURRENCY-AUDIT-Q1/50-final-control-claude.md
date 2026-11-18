STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, bez zmian logiki gry)
TEMAT: R-WEB-DIPLO-ERA-WAR-VS-NATURAL-WAR-CONCURRENCY-AUDIT-Q1
GOAL: Niezależny werdykt końcowy audytu: czy wojna naturalna AI wobec cywilizacji w wojnie epoki łamie ustalenia.
ZMIANY/COMMIT: kandydat 40ae56b36 (baza 468488084cf8). `git merge-base --is-ancestor` = OK. `git diff --stat`: 3 pliki, +133 (10-operator-claude.md, 30-obrona-claude.md, gra/tools/era-war-vs-natural-war-concurrency-measure.cjs). Allowlista zachowana, brak zmian w gra/src, danych, WERSJE.md, manifeście.
TESTY (własne, surowe):
- tsc --noEmit w gra/ (po npm ci --ignore-scripts, EXIT 0): EXIT 0.
- probe: EXIT 0, 10 wierszy; Kamień t60 stone_limit_target_r2, Brąz t60 ok, Żelazo t60 ok, t39 delay_r1, napastnik Kamień stone_limit_attacker_r2, civ-cap-target. Zgodne z raportem. Brak unlink/writeFile w probe (write:false).
- logic-test/tech-tree/research/unit-replace/combat: NIE DOTYCZY (brak zmian w gra/src).
- Symulacja 3x150: NIE ZMIERZONO (przyjęte, uzasadnione; werdykt scenariusza = wniosek z kodu).
WERYFIKACJA KODU: ai.ts:7501-7511 warunek wojny naturalnej = !stanWojny, !peaceLocked, !hasNapTreaty, !earlyNoMajorWarWindow, willingnessWar>0, zaufanie<PROG, przewaga militarna, effAgresja. Brak sprawdzenia liczby wojen celu/wojny epoki. war-rules-multiwar.ts:121-127 (Kamień=1, od Brązu null), :152-165 evaluateInterCivWarGate; main.ts:46023-46035 jedyna bramka liczby wojen. war-rules-params.json: maxConcurrentWarsFromBronze null, maxEraForcedWarsPerCivPerEra 1. Potwierdzone.
OCENA ZARZUTÓW EVALUATORA:
1. Błędny cytat ai.ts: zasadny, naprawiony w 30-obrona (7501-7511). Nota: 10-operator zachowuje stary cytat, nadrzędny jest 30. ODDAL (uwaga).
2. Brak FAL/R8/REJESTR 5012, 8190-8197, liczb trafień: zasadny, uzupełnione w 30. Nie zmienia werdyktu.
3. Źródło R3: uzupełnione (R-WEB-ERA-WAR-COUNTER-Q1/00-dispatch.md:6). Dotyczy tylko wojen epoki.
4. Brak symulacji: uczciwie oznaczone NIE ZMIERZONO; nie unieważnia audytu kodu.
5. unlink: naprawione, probe identyczny bajtowo.
Żaden zarzut nie wymaga NAPRAW.
WERDYKT: C. Błąd kodu względem ustaleń: NIE STWIERDZONO. Brak ustalenia połączonego limitu „jedna wojna epoki + jedna naturalna" od Brązu: TAK. Scenariusz właściciela jest od Brązu dopuszczony przez kod (z kodu, nie z pomiaru). Czy w grze właściciela to była wojna naturalna czy epoki: NIE ZMIERZONO.
BLOKADY: decyzja właściciela (pytanie ABC z 10-operator, rekomendacja A).
RUNDY: Final Control po rundzie 2/5.
NASTĘPNY KROK: orkiestrator zadaje pytanie ABC właścicielowi; bez decyzji kodu nie zmieniać.
UWAGI-DLA-ORKIESTRATORA: dopisać do REJESTR zmianę R3 (licznik per cywilizacja, decyzja 2026-10-30); sprzątnąć /home/user/The-Game/.claude/worktrees/wf_baseline.txt i /tmp/x; gra/node_modules z npm ci jest nieśledzony.
DEPLOY/PUSH: NIE WYKONANO
