# 02 — Evaluator

Status: oczekuje na niezależny przegląd; nie uruchomiono osobnego operatora ewaluacyjnego w tym worktree.

Operator evidence: typecheck PASS; cyclic-trade domain 53/53; rendered UI 9/9; broad proposal test 186/188 with two unrelated peace-in-war assertions failing. Details in `01-operator.md`.

Punkty do niezależnego sprawdzenia:
1. `undefined` w payloadach AI/starszych ofert nie może zostać potraktowane jako `null`.
2. Limit 30 dotyczy wyłącznie terminu wymiany; `treatyTurns` pozostaje odrębne.
3. Wycena infinite offer zachowuje skończone `turns` i nie używa dużej liczby jako sentinela.
4. Counteroffer zachowuje `exchangeDurationTurns`.
5. Zapisy istniejących finite `ActiveDeal` nie ulegają migracji.
