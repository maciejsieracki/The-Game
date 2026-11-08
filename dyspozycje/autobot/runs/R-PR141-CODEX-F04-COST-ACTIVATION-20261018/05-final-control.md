# 05 — Final Control

STATUS: PASS-WITH-NOTES — bounded cost activation evidence is ready for root integration review.
TEMAT: R-PR141-CODEX-F04-COST-ACTIVATION-20261018
DATA: 2026-10-18
SCOPE: source, bounded implementation/test, and evaluator record review. No tests or runtime were run by Final Control.

## Werdykt

**GOAL: PASS w granicach bounded cost activation.** The implementation applies the two approved F-04 price effects by resolved civ owner, preserves explicit zero as same-effect replacement, keeps the G11 Impi-only rebate separate and additive, and leaves pace/difficulty ordering and payment/refund contracts intact. The reviewed proof is static/source-backed and targeted; it does not establish whole-game acceptance, browser rendering, or runtime readiness.

## Kryteria

1. **Source and exact scope — PASS.** Dispatch identifies the approved Variant B workbook by SHA-256 `c285c410012d0fca67acf40200f03ace4cf98bd538fde40c3ea3799c79a62f32`; the defense test checks that hash and both parameter values for every one of the 15 actual matrix rows. Rome is `.20` for building cost, Zulu is `.10` for unit cost, and the remaining cells are explicit zero. The production helper emits one marker per parameter for each recognized civ and none for an unknown key. No matrix values or labels are modified.
2. **All relevant price paths — PASS-WITH-NOTES.** Evaluator source review found owner-resolved bonuses wired through player/AI production catalogs, replacement and purchase quotes, plus building quotes/payment. The defense test executes the actual owner resolver declarations for human owner 0, human seat 42, AI owner 99, missing owner 77, and fallback 777. It executes the actual `buildingWorkCost` expressions from both UI quote routes with the production helper and main owner callback. This proves numeric quote/projection inputs, not browser/DOM output; static source readback confirms those values feed the displayed Work rows.
3. **Three decisive unit cases — PASS.** Bounded pricing checks and the existing G11 regression test distinguish ordinary Zulu (`.10` F-04 only), Impi (`.10` F-04 plus distinct `.10` G11, summed before one floor/minimum-1 and then pace/difficulty), and non-Impi/non-Zulu controls. The stale `walka_wygaszone` civ note is not treated as an active third reduction. Evaluator reports the fresh Impi suite at 705 passed.
4. **Precedence and zero cells — PASS.** `buildingWorkCost` replaces only the same legacy building effect when an F-04 marker exists, including zero; Roman `.20` is applied once. `unitMoneyCost` similarly lets an F-04 marker replace overlapping general legacy recruitment reduction while preserving separate Impi-only G11 behavior. Unrelated legacy effects remain. No all-zero speed/rush consumers were added.
5. **Payment/refund consistency — PASS-WITH-NOTES.** Evaluator traced recruitment payment to the same `ProductionItem.koszt` quote and cancellation to the stored paid amount; building stock refund remains symmetric with its stock deduction. The existing bounded tempo/refund tests passed in the operator/evaluator records (6/6 and 5/5). This lane adds no Manpower-cost rule. The refund evidence validates the existing contracts; it is not a newly exercised live transaction.
6. **Owner parity/negative controls — PASS.** Human, mapped human seat, AI, missing-owner, and fallback resolution are covered in the defense test; all 15 civ rows and unknown-key behavior are checked. Impi-only and non-Impi controls, explicit zero replacement, Roman no-double-discount, and no cross-owner Roman leak are present. The owner-specific player/AI call sites were inspected by evaluator.
7. **Bounded validation — PASS per recorded evidence.** Operator and evaluator report: target test 19 passed; defense test 66 passed; G11/Impi test 705 passed; building pace test 6 passed; building stock/refund test 5 passed; TypeScript check passed; `git diff --check` passed. Final Control did not rerun these. The UI check is a bounded numeric source-expression test and does not claim browser acceptance.
8. **Allowlist/integrity — PASS-WITH-NOTES.** Dispatch authorized production, owner-context, UI quote, and bounded test paths; defense was limited to the new defense test and report. The operator records preservation of concurrent WORK changes and no edits to raw matrix data, labels, Manpower behavior, speed/rush behavior, save state, or `civ-bonuses.ts`. The checkout is shared and dirty; root must review only this lane's exact hunks before integration and preserve all other writers' work.

## Granice i następny krok

Source approval is complete for the exact workbook revision; this lane consumes its two cost values. Passing this cost lane does not itself approve consumer wiring as an entire product, full-game acceptance, or deployment. There was no browser, full-world, build, or runtime acceptance. Root may include the bounded cost implementation in its local integration review after checking current shared diffs and writer ownership. No further autonomous work is evidenced within this lane's stated goal.

DEPLOY/PUSH: NIE WYKONANO
