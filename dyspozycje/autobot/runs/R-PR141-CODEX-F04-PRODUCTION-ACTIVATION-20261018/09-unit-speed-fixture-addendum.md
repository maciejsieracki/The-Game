# Unit-speed fixture compatibility addendum — D10

STATUS: FIXED; compatibility test and unit-speed test PASS; frozen for independent Evaluator review.
DATE: 2026-10-18
SCOPE: One existing source-contract test assertion only. No app source changes.

The post-unit-speed adjacent run found `ai-jednostki-tylko-zakup-test.cjs` at 43 passed / 1 failed. D10 searched for the exact two-argument string `advanceProduction(prod0, pracaBudynki)`, while the already-accepted building-speed phase A passes the third approved modifier argument. The failure was a stale fixture anchor; the queue guard and building-speed call order remained intact.

Within the root-approved single-test allowlist, D10 now parses `main.ts` with the TypeScript AST. It locates the guard call for `city.ownerId`/`prod0` and the unique production call with first arguments `prod0`/`pracaBudynki`, regardless of the approved third argument. It checks their source order and that both nodes have the same enclosing city `for..of` iteration statement. D11's single-consumer assertion and the remaining D0-D13, behavior, mutation, and AI assertions were preserved.

Validation:

- `node gra/tools/ai-jednostki-tylko-zakup-test.cjs` — 44 passed, 0 failed (includes real AI path and all existing behavior/mutation controls).
- `node gra/tools/pr141-f04-unit-speed-activation-test.cjs` — PASS.
- `git diff --check` on the amended test and run documents — clean.

No production file was changed in this compatibility addendum. No browser/world runtime, build, or TypeScript rerun was needed; app TypeScript source is unchanged from the preceding successful direct typecheck. The earlier 43/1 result remains in `08-unit-speed-operator.md` as the original finding, with this file recording its resolution.
