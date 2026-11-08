# 08 — Root integration record: semantic consumer consistency

DATE: 2026-10-18  
RUN: R-PR141-CODEX-SEMANTIC-CONSUMER-CONSISTENCY-20261018  
DECISION: ACCEPTED_LOCAL_BOUNDED  
ROUND: 3/5  
AUTHORITY: Root review of exact classifier changes, Evaluator recheck 06, Final Control 07, focused evidence, and clean diff check.

## Accepted bounded scope

Root accepts the current semantic classifier and focused evidence for four consumer IDs: `walka_ruch_bitwa_proc`, `walka_ruch_rydwany`, `walka_ruch_piechota_teren_plytkie_morze`, and `walka_koszt_rekrutacji_proc`. The Egypt general battle-movement cell remains intentionally `BLOCKED` under owner decision 1B, with the centrally enforced chariot-specific precedence; this is one excluded cell, not a claim of uniform per-cell behavior. Accepted evidence counts are 52 focused consumer/API checks and 479 semantic-label checks passing.

Root also accepts beneficial polarity for the three positive discount fields `prod_koszt_budynku_proc`, `prod_koszt_jednostki_proc`, and `walka_koszt_rekrutacji_proc`, consistent with their current price-reduction consumers and previously approved values. `prod_rush_koszt_proc` remains harmful and `UNWIRED` pending its owner decision.

This adds four consumer IDs to the previously accepted 30 bounded IDs, for 34 new IDs over the preserved 33-ID baseline. The classifier now derives 67 distinct IDs with bounded consumer evidence across 1,005 cells: 1,004 `REAL_GAMEPLAY` cells and one intentionally blocked Egypt cell. These are classifier counts and bounded scope only; they do not claim 15-cell execution or full gameplay acceptance.

## Limits and next gate

This record is local bounded integration only. It does not establish full runtime, visual/browser behavior, save/load, map generation, all-civilization parity, or 93×15 product acceptance. The v1 and v2 ledger artifacts remain byte-preserved historical snapshots; v2's former integration hold is superseded for future reconciliation but its historical contents are not retroactively updated. A new v3 snapshot is planned under its separate ledger dispatch and must derive current counts and preserve v1/v2 history.

The two F-04 owner questions `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` remain pending. No runtime values, product readiness, publication, commit, or deployment are accepted here.
