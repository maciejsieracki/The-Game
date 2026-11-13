# R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1 — Dispatch

STATUS: OPERATOR
DOMAIN: INFORMATIONAL
TEMAT: R-WEB-PR141-F04-YIELDS-TEST-DEBT-Q1
GOAL: Reproduce the queued PR141 F04 yields regression-test debt, distinguish a stale test expectation from a current product defect, and correct the owned test if the evidence supports doing so.

## Trigger and authorization

The 2026-11-10 four-topic queue marks `pr141-f04-yields-activation-test.cjs` as waiting for a current-main reproduction and F04 acceptance check. The root delegated this bounded operator task and explicitly limited its initial scope to the owned test and this run; product helpers and approved data are read-only because another active task is performing major economy-test reconnaissance.

This dispatch records that delegation and scope. The first baseline command was run before this file was written; no source or data was changed during that baseline.

## Scope

- Owned test: `gra/tools/pr141-f04-yields-activation-test.cjs`.
- Own run records: this directory.
- Read-only evidence: current F04-approved matrix values, `cityYieldPerTurn`, route settlement call sites, and the accepted F04 yields integration record.
- No production helper, gameplay data, global registry, browser/build, commit, or push work.

## Baseline and criteria

Run from `gra/` with `node tools/pr141-f04-yields-activation-test.cjs`.

PASS requires a recorded baseline, a diagnosis tied to current helper boundaries and approved source data, a focused test correction that keeps the 15-owner × 9-field coverage and unrelated behavioral assertions, a passing rerun, and no product/data changes. If source behavior is defective, stop at diagnosis and report the exact source scope for serialization.

## Routing

Operator: `gpt-6-luna` / `high`. Evaluator and later roles remain sequential and are not included in this dispatch.
