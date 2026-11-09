STATUS: PASS-WITH-NOTES
DOMAIN: PROCESS
TEMAT: R-RUSTPORT-P6-WIRE-WAR-TURN-PLAN-Q1
GOAL: Odpowiedź Operatora na zarzuty Evaluatora r1 (FAIL) — poprawka planu P6-WIRE-WAR-TURN-PLAN.md.
ZMIANY/COMMIT: baza `1dbc66013` (Operator r1); commit r2 z allowlisty: `dyspozycje/rust-port/p6/P6-WIRE-WAR-TURN-PLAN.md` (+36/−11). Worktree: `/home/user/The-Game/.claude/worktrees/wf_50683ebf-e8d-3`. Bez zmian w `gra/**`, `rust-port/**`, bez `cargo`.
TESTY: Nie dotyczy (dokumentacja). Odczyt web: `git show 60a18c60d:gra/src/main.ts` (plik tymczasowy w worktree, usunięty). `git diff --check` czysto.

ODPOWIEDZI NA ZARZUTY:
1. Kolejność ownerLoop — PRZYJMUJĘ. Odczyt potwierdza: w `ownerLoop` (`main.ts:39152`) per właściciel: prune fal `39335` → `prepareAiGeneralWarCampaign` `39353` → `tickDiplomacy` gracz↔AI `39726` → `decideAIDiplomacy` `40130` → komendy (`40413`, `41206`) → `decideAITurn` `40470`. Sekcja 3 przepisana. Dodatkowo odnaleziono brakujący krok na początku tury: `runDiplomacyTurnTick` `36618` (def. `23101`) przed ekonomią `36757`. Sekwencja tury: dyplomacja tury → ekonomia → oblężenie → runAiPhase → tiki AI↔AI → scan oblężeń → checkVictory `41805`. D2 i W8 zaktualizowane.
2. Moduł `diplomacy_tick_war_brake` — PRZYJMUJĘ z korektą wskazania. Zarzut miał rację co do braku partii, ale wołający nie jest w `tickDiplomacy` `39726` (to base `tickDiplomacy` gracz↔AI). Prawdziwe wołania: `runDiplomacyTurnTick` `23195` → `tickDiploAiAiPairsWithBrake` `11115`; funkcje kryzysu `10959–11069`; kontekst `diploBrakeBonusFlags` `11004` → `TickCtx` w `39726`; zapis flagowany `35747–35749`. Przydział: W6 (DIPLO-TURN, LOC 586 ≤ 600). Zakup jednostki AI przeniesiony z W6 do W4 (LOC 534), żeby zmieścić W6 w limicie. Razem 8 partii.
3. Stan oblężenia — PRZYJMUJĘ. `siegeTurnByCity`, `siegeBesiegerByCity`, `siegeAiStateByKey` — zapis `35705–35707`; dopisane do tabeli 4 i do W1 (LOC 450→520). Lista zapisu uzupełniona o pola dyplomacji/oblężenia z pełnego przeglądu `buildSaveGameSnapshot` (`35587–35890`): umowy, skrzynki, wiarygodność (5 pól), liczniki cooldownów AI, kontakt/odkrycia, pomocnicze planerów. Pola ekonomii/mapy/UI oznaczone jako poza zakresem P6. Uczciwie: klasyfikacja nie jest pełna dla pól poza wojną/dyplomacją (świadomie wyłączone), a `serialize` do JSON pozostaje `NIE_ZMIERZONO`.
4. Drobne numery i ścieżki — PRZYJMUJĘ. `sweepStaleForcedWarEntries()` = `main.ts:38872` (było 38873, poprawione w sekcji 1 i 3); Krok A od `38874`. Dodana konwencja ścieżek (`ai.ts` = `gra/src/game/ai.ts`). Zakup AI: definicja `gra/src/game/ai.ts:7212` (`shouldAIPurchaseUnit`), wołający `main.ts:41206`.

RUNDY: 2/5
NASTĘPNY KROK: Evaluator r2 sprawdza korekty (sekcje 1, 3, 4, 6, 7 D2/W1/W4/W6/W8). Po PASS orkiestrator zadaje ABC D1–D8 i rozpisuje dispatche W1–W8.
DEPLOY/PUSH: NIE WYKONANO
