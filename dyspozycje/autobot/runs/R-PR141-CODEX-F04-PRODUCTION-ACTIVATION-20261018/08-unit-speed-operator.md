# Unit-speed operator report

STATUS: IMPLEMENTED; focused checks PASS; frozen for Evaluator review.
DATE: 2026-10-18
SCOPE: `prod_szybkosc_jednostki_proc` only. Rush polarity remains unresolved and untouched.

The paid recruitment turn limit now uses the approved no-carry A contract with the existing engineering minimum: `max(1, floor(baseCapacity * (1 + rawOwnerValue)))` for a positive base capacity. A disabled zero base remains zero. With base capacity 1, `+0.20` intentionally remains 1 completion/turn, `-0.20` also remains 1 under the previously documented minimum-one rule, `+1.00` yields 2, and `+2.00` yields 3. No fractional carry, persistence field, backlog, or save-schema change was added.

The actual city-turn caller resolves the value from `city.ownerId`, passes the resulting integer limit to `advanceRecruitmentGated`, and retains the existing paid queue, Manpower, spawn, and refund behavior. The city-panel recruitment queue cadence preview uses the same owner-specific capacity and calculates each item's ETA as `ceil((queueIndex + 1) / unitsPerTurn)`; its label now reports the same per-turn capacity.

The new bounded test executes actual source functions and expressions for main's owner resolver, matrix resolver, `recMaxPerTurn` initializer, the actual `advanceRecruitmentGated` call expression and consumer, the city-panel owner helper, and the actual recruitment ETA expression. Synthetic fixtures prove the 15 approved source values are all still zero; human owners 0, 7, and 42, AI owners 99 and 101, and an unresolved UI key remain independently routed. Values exercised are 0, `+0.20`, `+1.00`, `+2.00`, and `-0.20`; the disabled zero-base helper case remains 0. Paid queue completions and UI cadence are checked through the same capacities.

Files used under the approved unit-speed allowlist:

- `gra/src/game/production.ts` — pure integer capacity helper with floor/no-carry and existing minimum-one behavior.
- `gra/src/main.ts` — actual owner-resolved capacity passed to the live gated recruitment consumer.
- `gra/src/ui/cityPanel.ts` — owner-aware per-turn recruitment cadence and ETA preview.
- `gra/tools/pr141-f04-unit-speed-activation-test.cjs` — bounded actual-source execution proof.

Validation:

- `node gra/tools/pr141-f04-unit-speed-activation-test.cjs` — PASS.
- Direct `node ./node_modules/typescript/bin/tsc --noEmit` from `gra/` — PASS (exit 0).
- `recruitment-batch-contract-test.cjs` — 17 passed, 0 failed.
- `building-queue-refund-test.cjs` — 5 passed, 0 failed.
- `pr141-hotseat-production-owner-routing-test.cjs` — PASS.
- `impi-recruitment-discount-test.cjs` — 705 passed, 0 failed.
- Adjacent regressions: `ai-rekrutacja-parytet-test.cjs` — 7/7; `army-recruitment-concentration-test.cjs` — 29/29; `manpower-matrix-sensitivity-test.cjs` — 223/223; `manpower-test.cjs` — 76/76.
- `ai-jednostki-tylko-zakup-test.cjs` — 43 passed, 1 failed at D10. The stale source-contract assertion searches for the old literal `advanceProduction(prod0, pracaBudynki)` call. Accepted building-speed phase A already added its third modifier argument; the unit-speed diff did not modify that call. The failure predates this unit-speed change in scope; no out-of-allowlist test was edited.
- `git diff --check` on the four allowlisted implementation/test paths — clean.

No source data, rush pricing, building speed, save schema, or unrelated recruitment costs were changed. No build, browser, world runtime, publication, or push was performed. Independent Evaluator review is the next gate.
