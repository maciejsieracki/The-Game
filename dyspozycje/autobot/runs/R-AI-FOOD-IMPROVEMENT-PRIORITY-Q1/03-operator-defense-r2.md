# Operator Defense — round 2

Date: 2026-10-29
Candidate reviewed: `6f9085fe`

Evaluator verdict: FAIL, one acceptance-scope correction.

## Evaluator finding

The original `FOOD_LIVESTOCK_STAGE_KEYS` included `oboz_lowiecki`, `lodzie_rybackie`, and `warzelnia_soli`. These are hunting, fishing, and salt improvements, not livestock. Their availability could keep irrigation/terraces waiting after the actual livestock fields were complete.

## Correction

The staged sequence is now:

0. river forest preparation;
1. farms;
2. livestock only: `bydlo`, `owce`, `lama`;
3. irrigation/terraces;
4. remaining food improvements: hunting camp, fishing boats, and salt works.

Thus other food improvements cannot block irrigation/terraces once eligible livestock is exhausted. The common picker retains its eligible-target/technology/Work blocking behavior within the actual earlier phase.

## Regression proof

The staged behavior test now adds a worked salt deposit alongside eligible river irrigation fields. It separately confirms the salt works candidate remains available when ordinary (non-staged) selection is forced to that improvement, while the staged picker chooses irrigation/terraces next. The full targeted behavior/mutation test passes **11/11**, including live AI turn planning. `tsc --noEmit` passes.

No merge, push, or deploy performed. Awaiting a fresh independent evaluation.
