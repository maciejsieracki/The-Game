# Retrospective dispatch record — R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1

**Registered:** 2026-11-10, after the work and FALA 607 publication were already complete. This record is retrospective and does not claim the dispatch artifact existed before execution.

STATUS: COMPLETE — 11/11
DOMAIN: GAME
TEMAT: `R-WEB-AI-UNIT-REPLACE-LIMIT-CONFIG-Q1`
GOAL: Przenieść istniejący limit zamian wojsk AI wynoszący 10% armii do `ai-params.json`, zachowując wartość i zachowanie.
MODEL/EFFORT: Operator gpt-6-luna / high; Evaluator gpt-6-luna / high; Final Control gpt-6-luna / high. Defense skipped; no objections. Integration used the then-configured orchestrator route.
ALLOWLISTA: `gra/data/ai-params.json`; `gra/src/game/ai-unit-replace-plan.ts`; scoped cap wiring in `gra/src/main.ts`; `gra/tools/ai-unit-replace-same-rules-test.cjs`; run evidence and receipts.
BAZA OPERATORA: `d0ccc260edb35c952e6cd9eb5477cff02a4e2b3f` (as stated in the operator receipt).
SOURCE / PUBLICATION: source `79a6c778e`; FALA 607 publication `2da63d941ac704cb8c3e2e1ca37a3d3a8f3979ec`.
FINAL RECEIPT: `90-release-607.json`, 11/11 `DEPLOYED_PUSHED_GIT_READBACK_PASS`; remote Git readback via ls-remote, fresh fetch, and byte-identical bundle/manifest/START. HTTP Raw readback was not claimed.
EVIDENCE: `10-operator.md`, `20-evaluator.md`, `50-final-control.md`, `evidence/release3-audio-validation.md`, `90-release-607.json`.
REGISTRATION NOTE: Added to close the artifact-registration gap. It records available evidence and does not recreate or backdate an earlier dispatch.
