STATUS: PASS
DOMAIN: GAME
TEMAT: R-WEB-HUD-ME-MIGRATION-Q1
GOAL: Dokończyć migrację literału `0` -> `ME()` w dwóch miejscach HUD/respektu gracza w gra/src/main.ts (pozostałość migracji hotseat) i dodać strażnika regresji.
ZMIANY/COMMIT: baza 6d38cbfae (origin/main). Zmieniono gra/src/main.ts (2 podstawienia), dodano gra/tools/hud-me-literal-zero-test.cjs, dodano raport dyspozycje/autobot/runs/R-WEB-HUD-ME-MIGRATION-Q1/10-operator-claude.md. Commit: SHA w polu `sha` raportu StructuredOutput (commit zawiera wyłącznie te trzy ścieżki).

Podstawienia (grep po `objectivePowerForOwnerEffective(0` w main.ts znalazł dokładnie 2 wystąpienia literału, oba zamienione):
1. main.ts ~3140, objectiveRespektPctTowardEffective: strona gracza `objectivePowerForOwnerEffective(0)` -> `objectivePowerForOwnerEffective(ME())`. Uzasadnienie: funkcja liczy respekt widoczny dla gracza, a jej strona „nasza” ma być aktywnym fotelem człowieka (ME()), nie stałym właścicielem 0. W grze 1-graczowej ME()=0 (humanSeats.activeHumanOwnerId), więc zachowanie jednoosobowe bez zmian.
2. main.ts ~24044, buildHudState (linia `const power = ...`): `objectivePowerForOwnerEffective(0)` -> `objectivePowerForOwnerEffective(ME())`. Uzasadnienie: licznik Mocy w HUD ma pokazywać moc aktywnego gracza (zgodnie z sąsiednimi wywołaniami w tej samej funkcji i panelem Mocy otwieranym z HUD).
Sąsiednie wywołania (`objectivePowerForOwnerEffective(ME())` w militaryPower, playerPower, bazaPaskaAudiencji, objectivePowerForOwnerEffective(o)) były już na ME() / na zmiennym właścicielu — nie zmieniane.

Nie zmieniano logiki gry, asercji w hud-moc-warstwa-test.cjs (plik nietknięty).

Test strażnika: gra/tools/hud-me-literal-zero-test.cjs — sprawdza (a) ciało objectiveRespektPctTowardEffective nie zawiera `objectivePowerForOwnerEffective(0)` i zawiera `(ME())`, (b) linia `const power = objectivePowerForOwnerEffective(...)` w buildHudState nie używa literału 0. Wspiera HUD_ME_GUARD_MAIN=<ścieżka> do mutacji.

TESTY (surowe wyjście):
- tsc --noEmit: exit 0 (bez błędów)
- hud-moc-warstwa-test.cjs: `WYNIK: 28 PASS, 0 FAIL`, exit 0 (asercje bez zmian)
- hud-me-literal-zero-test.cjs (HEAD + zmiany): `Wynik: 5 PASS / 0 FAIL`, exit 0
- MUTACJA (przywrócenie 0 w obu miejscach, kopia main.ts w scratchpad, nie w repo): `Wynik: 2 PASS / 3 FAIL`, exit 1 — strażnik czerwony
- logic-test.cjs: `LOGIC OK (213/213)`, exit 0
- tech-tree-test.cjs: `20 pass, 0 fail`, exit 0
- research-test.cjs: `PASSED: 33 / FAILED: 0 / TOTAL: 33`, exit 0
- unit-replace-test.cjs: `WSZYSTKIE TESTY ZIELONE (21/21)`, exit 0
- combat-test.cjs: `COMBAT TEST: 6/6 pass`, exit 0
- ai-test.cjs: `ai-test: 297 passed, 0 failed`, exit 0
- moc-ranking-rozjazd-test.cjs: `WYNIK: 19 PASS, 0 FAIL`, exit 0
- era-war-pairing-alliance-test.cjs: `19 pass, 0 fail`, exit 0
- hotseat-etap6d-podetap-e-source-test.cjs: `77 PASS, 0 FAIL`, exit 0
- granice (granice-relacja-dyplomatyczna-test.cjs): `52 passed, 0 failed`, exit 0
- git diff --check: czysto

BLOKADY: brak. Uwaga: w worktree doinstalowano node_modules (npm ci, nie build/dev); katalog jest ignorowany przez git i do usunięcia przed sprzątaniem.
RUNDY: 1/5
NASTĘPNY KROK: Evaluator (Sonnet) weryfikuje diff i bramki; po FC integracja przez orkiestratora (FALA 894).
UWAGI-DLA-ORKIESTRATORA: pliki `granice-styk-nakladanie-test.cjs` (57/0) też przeszły — nie były wymagane przez dispatch. Dispatch nazwał „hotseat granice 52/0”; przyjąłem to jako granice-relacja-dyplomatyczna-test.cjs (52/0).
DEPLOY/PUSH: NIE WYKONANO
