STATUS: PASS-WITH-NOTES
DOMAIN: GAME (audyt, zero zmian w grze)
TEMAT: R-WEB-SAVE-STATE-AUDIT-Q1 (tag SAVEAUDIT)
GOAL: Ustalić, które zmienne modułowe gry nie trafiają do zapisu i czy ich brak po wczytaniu zmienia decyzje AI/gracza. Runda obrony po FC FAIL: odpowiedź na zarzuty 1–7 Evaluatora (commit 5eb91ff57669999c1618ba5f7c16d17d9cfe0341).
BAZA: 618fc67e332428686bde08c014b7181d064763c4 (kandydat, detached), merge-base z origin/main 1dbd21efc: patrz pole sha.
ZMIANY/COMMIT: allowlista — gra/tools/save-state-audit-scan.cjs (poprawiony), gra/tools/save-state-audit-ablation.cjs (nowe), dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md (przepisany), dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/scan-output.txt (ponownie wygenerowany), dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/ablation-wonder-stuck-output.txt (nowe), ten raport. Zero zmian w gra/src i gra/data (git diff --stat -- gra/src gra/data: puste).

ODPOWIEDZI NA ZARZUTY:
1. PRZYJMUJĘ (częściowo wykonane). Ablacja B≠A dla aiWonderStuckTurnsByOwner wykonana na czystej funkcji relaxedWonderCostThreshold (bundle ai.ts do katalogu tymczasowego, poza repo): stuckRelaxTurMax=30, base=1; licznik 12 (A) → próg 1,6667; licznik 0 po wczytaniu (B) → próg 1,0000; B≠A dla progu = TAK. Wpływ na decyzję cudu w grze (B≠A w biegu) = NIE ZMIERZONO (harness nie uruchamiany). Werdykt D opisany jako „D (kod + ablacja wejścia progu; wpływ na grę NIE ZMIERZONO)”. Wynik: dyspozycje/autobot/runs/R-WEB-SAVE-STATE-AUDIT-Q1/ablation-wonder-stuck-output.txt.
2. PRZYJMUJĘ. Zbadano 5 kandydatów z wstępną klasą D? (wszystkie z listy skanu): aiWonderStuckTurnsByOwner = D (ablacja progu); aiGarrisonUnitIdByOwner = D warunkowe (main.ts:40103/40104/48959, brak clear i brak w save/restore, fallback 'Wojownik' ai.ts:1989); wiarygodnoscCyclicDeliveryOkThisTurn = R (clear/set/odczyt w jednej funkcji, 26694–26825); objectivePowerByOwner = R (refreshObjectivePowerCache 3134–3140 + fallback 12504, 44141); lastCityKulturaTick = S (UI, odczyt 9698; odtwarzany 44145–44148). Dwa D-werdykty (#10 i aiGarrisonUnitIdByOwner) z łącznie pięciu zbadanych D?. Pozostałe follow-upy (playerStartHexByOwner, aiTurnAwaitingBattle) jawnie oznaczone jako NIE ZBADANE.
3. PRZYJMUJĘ i naprawiono. Skan obejmuje teraz wszystkie inicjalizatory: null, undefined, literały tekstowe/obiektowe/tablicowe, new X(...), brak inicjalizatora. Liczba deklaracji: 533 (poprzednio 330). aiCmdResume (main.ts:14947, Null) jest w tabeli (D?, nie w zapisie, 48 odwołań).
4. PRZYJMUJĘ i naprawiono. Komentarze // i /* */ są usuwane przed dopasowaniem (literały tekstowe zachowane). Test mutacyjny (kopia main.ts w scratchpad, komentarz z nazwami w ciele buildSaveGameSnapshot): stary skan (618fc67) gubi zmienne z listy (fałszywe „tak”), nowy skan zachowuje „nie” (aiGoldIncomeByOwner 11194, aiWonderStuckTurnsByOwner 6033) — zgodnie z oryginałem.
5. PRZYJMUJĘ i naprawiono. scan-output.txt wygenerowany poleceniem z dokumentu (z katalogu głównego repo: node gra/tools/save-state-audit-scan.cjs --md > .../scan-output.txt); nagłówek „# save-state-audit-scan: gra/src/main.ts”, format tabeli Markdown; 384 wiersze niezapisywanych + nagłówek.
6. PRZYJMUJĘ i poprawiono. Ścieżka w dokumencie: gra/src/game/ai.ts:2743–2757 (relaxedWonderCostThreshold).
7. PRZYJMUJĘ i wykonano. npm ci w gra/ (gra/node_modules w .gitignore, nie w commicie); bramki zmierzone: tsc exit 0; logic-test LOGIC OK (213/213); ai-test 297 passed, 0 failed. Brak npm run build/dev.

ZMIANY W DOKUMENCIE (dyspozycje/analizy/ZAPIS-STAN-AUDYT-2026-11-28.md): przepisany §2 (liczby 533/384; D?=76, S?=56), §3 (dodane §3.4–3.7, ablacja w §3.1), §4 (lista follow-upów: aiGarrisonUnitIdByOwner jako pozycja 2), §5 (bramki zmierzone; NIE ZMIERZONO: B≠A w grze).

TESTY:
- node gra/tools/save-state-audit-scan.cjs --md — exit 0, 533 deklaracji, 384 niezapisywane (surowe wyjście w scan-output.txt).
- Mutacja komentarzy (opis w pkt 4): zgodna z oczekiwaniem (stary skan: fałszywe usunięcie; nowy: bez zmian).
- node gra/tools/save-state-audit-ablation.cjs — exit 0; B≠A dla progu = TAK (1,6667 vs 1,0000).
- npx tsc --noEmit — exit 0.
- node tools/logic-test.cjs — LOGIC OK (213/213).
- node tools/ai-test.cjs — 297 passed, 0 failed.
- git diff --stat -- gra/src gra/data — puste.
- B≠A w grze (harness na żywo): NIE ZMIERZONO.

BLOKADY: brak. Ograniczenia: harness na żywo nie był uruchamiany (ablacja gry NIE ZMIERZONO dla D #10 i #aiGarrisonUnitIdByOwner).

RUNDY: 2/5 (runda 1: PASS-WITH-NOTES; runda 2: obrona po FC FAIL-zarzutach 1–7, ten raport).
NASTĘPNY KROK: Evaluator (ponowna ocena tego SHA); decyzja orkiestratora o temacie fixu #10 + aiGarrisonUnitIdByOwner (test round-trip + mutacja + B≠A w grze przy maksimum).
DEPLOY/PUSH: NIE WYKONANO
