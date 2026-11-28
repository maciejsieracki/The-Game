STATUS: PASS
DOMAIN: PROCESS/GAME-TEST
TEMAT: R-WEB-TEST-DEBT-Q16C (runda 3/5, Operator SONNET 5.5 — po 2 nieudanych rundach Haiku)
GOAL: rozstrzygnąć hotseat-etap4-noop (zapis t23: A/B/C) i pytanie B (Spichlerz −11 → −108) na żywo; zero zmian gra/src.
ZMIERZONO NA BAZIE: 1e7cccfa7 + merge 125b7aa14 (origin/main). Commit z pracą: SHA w polu sha odpowiedzi (czubek).
ZMIANY/COMMIT: gra/tools/hotseat-etap4-noop-test.cjs (closeBattleOverlays + normalizeStackGroupClocks), nowe gra/tools/tdq16c-diag-etap4.cjs, gra/tools/tdq16c-diag-pytb.cjs, dyspozycje/analizy/DLUG-TESTOWY-Q16C-2026-11-28.md, runs/R-WEB-TEST-DEBT-Q16C/{10,60–64}. git diff gra/src gra/data = 0.
TESTY:
- hotseat-etap4-noop-test.cjs po poprawkach: PASS 30/30 identycznych, jsExc 0/0, consErr 0/0 (runs/60: wersja bez normalizacji stackGroupId = FAIL 4/30, rozbieżność t5; runs/61: PASS 30/30).
- Przyczyna t23 (klasa A): otwarte PODSUMOWANIE BITWY blokuje Ctrl+S (celowa reguła isSaveBlockedByBattle); runs/64. Przyczyna A vs B od t5 (klasa A): Date.now() w stackGroupId (armyMerge.ts:78-81); diff 6 pól units[].stackGroupId.
- Pytanie B: ZAMIERZONE (nie defekt): −108 = stan 25 − bilans −133/turę; bilans stały, racja 0 poprawia prognozę o +36/turę; skok wynika ze spadku stanu, nie z racji. Koszt 64/Hastati = zasady (rebalans epok + ×4 + koniec okna łaski w t16). runs/62, 63. Powiązane z otwartym Q42.
- Bramki: tsc RC 0; logic 213/213; ai-test 297 passed 0 failed.
BLOKADY: brak. NIE ZMIERZONO: pytanie B na ziarnach 11/7 i na maksimum Kosztów jednostek (sandbox ?playtest=mapa, pace niski); etap4 na maksimum ustawień (hak z zaszytymi wartościami; zmiana = gra/src). Szczegóły w dokumencie.
RUNDY: 3/5
NASTĘPNY KROK: Evaluator (Sonnet) → Obrona → Final Control; Q42 czeka na właściciela (deficyt żywności pasywnego gracza po t16).
UWAGI-DLA-ORKIESTRATORA: tool Bash przeniósł pełny przebieg etap4 (~12 min) w tło po 590 s (bez własnego &/nohup); drugi zegar ścienny w zapisie (stackGroupId) — nie błąd gry, ale każdy test porównujący surowe snapshoty musi go normalizować.
DEPLOY/PUSH: NIE WYKONANO
