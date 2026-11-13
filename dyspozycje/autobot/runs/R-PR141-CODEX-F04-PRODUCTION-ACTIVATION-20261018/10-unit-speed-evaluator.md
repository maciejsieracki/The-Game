# Unit-speed independent evaluator review

STATUS: PASS for the bounded `prod_szybkosc_jednostki_proc` activation scope. This accepts the unit-speed phase only; rush remains pending and the classifier/ledger is not thereby updated.
DATE: 2026-10-18

I compared the implementation against the three unit-speed pre-edit snapshots and reviewed the amended D10 test. The implementation delta is confined to the shared integer-capacity helper in `production.ts`, owner-resolved capacity at the live recruitment call in `main.ts`, and owner-specific queue cadence/ETA in `cityPanel.ts`. I found no other unit-speed source change in those snapshots.

The helper preserves the stated contract: for positive base capacity it returns `max(1, floor(base * (1 + raw)))`, treats non-finite raw input as neutral, and returns zero when base capacity is disabled. With the live base of 1, `+0.20` floors to 1, `+1` gives 2, `+2` gives 3, and `-0.20` is kept at the previously specified minimum of 1; a zero base remains zero. This applies no fractional carry or persistence state. The main turn path resolves the matrix value from `city.ownerId` and passes the resulting capacity into the existing `advanceRecruitmentGated` call, retaining the existing owner-specific Manpower multipliers and payment path. The panel resolves the same owner's key, uses the same capacity helper, and reports `ceil((queueIndex + 1) / unitsPerTurn)`; its zero-capacity branch avoids division and displays no rate.

The bounded test executes the actual helper, source expressions/call, gated consumer, owner routing and queue ETA expression. It checks all 15 current source values remain zero, human owners 0/7/42, AI owners 99/101, missing-owner fallback, positive and negative synthetic values, the disabled-base case, and matching completion/cadence. I found no fixture-only substitute for the source call path. D10 now parses the actual TypeScript call, checks its first two production arguments, checks the owner guard precedes it within the same city loop, and retains the one-consumer condition. It still exercises its existing AI and behavior controls.

Independent validation passed:

- `node gra/tools/pr141-f04-unit-speed-activation-test.cjs` — PASS.
- `node gra/tools/ai-jednostki-tylko-zakup-test.cjs` — 44 passed, 0 failed, including D10 and D11.
- `node gra/tools/recruitment-batch-contract-test.cjs` — 17 passed, 0 failed.
- `node gra/tools/building-queue-refund-test.cjs` — 5 passed, 0 failed.
- `node gra/tools/pr141-hotseat-production-owner-routing-test.cjs` — PASS.
- `node gra/tools/impi-recruitment-discount-test.cjs` — 705 passed, 0 failed.
- `node gra/tools/manpower-matrix-sensitivity-test.cjs` — 223 passed, 0 failed.
- `node gra/tools/manpower-test.cjs` — 76 passed, 0 failed.
- `git diff --check` on the implementation and test paths — clean.

No rush-price behavior, source matrix value, save schema, queue payment/refund semantics, recruitment spawn behavior, or unrelated implementation was accepted as part of this review. No browser or world runtime was run; visual in-world behavior remains outside this bounded acceptance evidence.
