# Dispatch — R-WOJSKO-ARMIA-REKRUTACJA-DO-WODZA-Q1

**GOAL:** give the player explicit control over whether newly recruited units should rally toward their leader.
**User intent:** in the main-map army menu, find “Przygotuj” and provide a visible “Idź do wodza” toggle. When enabled, newly recruited units path toward the leader and track the leader's current position. When disabled, new units have this per-unit option disabled and receive no automatic order; the player may still toggle “Idź do wodza” on any selected unit. This allows only part of the army to rally.
**SCOPE:** inspect existing rally/leader flow; menu control, per-unit control, recruitment from city and army panel, turn/movement behavior, persistence and migration. Keep the user-selected per-unit preference coherent with the global default; do not redirect existing units unexpectedly when changing the default.
**Operator worktree:** `/workspace/leader-rally-operator`, branch `autobot/leader-rally-recruit-toggle-q1`, base `origin/main@9f6f7771`.
**Acceptance:** toggle is visible and accurately labeled; enabled default affects new units from every recruitment entry point; disabled default is preserved on new units but can be overridden individually; an enabled unit follows the leader's current location; save/load preserves both default and unit overrides; existing saves migrate safely; focused UI/domain and production-render tests pass; independent Evaluator and Final Control required.
**Restrictions:** no integration, push, or deployment by Operator.

**Operator artifact:** `10-operator.md`.
