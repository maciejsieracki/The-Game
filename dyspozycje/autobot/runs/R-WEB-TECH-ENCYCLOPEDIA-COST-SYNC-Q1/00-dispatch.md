TEMAT: R-WEB-TECH-ENCYCLOPEDIA-COST-SYNC-Q1
RUNDA: 1/5
DATA: 2026-11-10
DOMAIN: INFORMATIONAL
ŚCIEŻKA: B (prompt)
MODEL + EFFORT per rola: Operator Codex GPT-6 Luna / High; Evaluator Codex GPT-6 Luna / High; Final Control Codex GPT-6 Luna / High
BAZA: main @ 87253ca4b (readback at dispatch); shared checkout contains unrelated pre-existing modifications, which are outside this allowlist and must remain untouched.

## WYZWALACZ
Handover debt explicitly identified in `dyspozycje/autobot/runs/R-WEB-TECH-POTTERY-FIFTH-AFTER-FOUR-BASICS-Q1/02-operator-r2.md`: four technology encyclopedia pages list costs that differ from `gra/data/tech.json`. Root orchestration dispatched this exact task and ID for the narrow documentation correction on 2026-11-10. Existing-ID search found no run, register entry, or open-question entry with this ID.

## GOAL
Encyclopedia costs for Wymiana, Brązownictwo, Pismo, and Religia match their corresponding `Koszt nauki` values in the current `gra/data/tech.json`, and the generated wiki bundle reflects those four corrected pages.

## KRYTERIA KOŃCA — binarne PRAWDA/FAŁSZ
- PRAWDA: both the Wiki-S and Wiki-M cost strings in each of the four pages match the source JSON values (64, 180, 180, 192 PN respectively).
- PRAWDA: `node gra/tools/bundle-wiki-for-game.cjs` regenerates `gra/src/data/wikiBundle.json`; generated entries reflect only these cost corrections in the four technology pages relative to their pre-edit entries.
- PRAWDA: `node gra/tools/civpedia-technologie-rys-historyczny-test.cjs` passes; additionally verify four costs in docs and bundle by a focused readback/script.

## ALLOWLISTA — nic poza tym
- `docs/encyklopedia/technologie/wymiana.md`
- `docs/encyklopedia/technologie/brazownictwo.md`
- `docs/encyklopedia/technologie/pismo.md`
- `docs/encyklopedia/technologie/religia.md`
- `gra/src/data/wikiBundle.json` (generator output only)
- `dyspozycje/autobot/runs/R-WEB-TECH-ENCYCLOPEDIA-COST-SYNC-Q1/**`
No tech/data, balance, process/global queue, gameplay code, unrelated docs, commit, deploy, or push changes.

## IZOLACJA
Current shared checkout on `main`, base commit `87253ca4b`. The checkout has unrelated pre-existing work; touch only the explicit allowlist and review all paths after every operation. Do not stash, reset, clean, or stage anything.

## REGUŁA PRZECIW SAMOOSZUKIWANIU
Observed mode: work can be declared done from the prose edit while the UI-consumed bundle remains stale. Regenerate with `gra/tools/bundle-wiki-for-game.cjs` and inspect the four serialized entries, rather than relying on the Markdown diff alone.

## PROCEDURA NAPRAWCZA PRZY FAIL
Evaluator identifies a specific page or bundle mismatch. Correct only that allowlisted documentation/source-output discrepancy in this same run/ID and re-run the named checks. Any conflict or ambiguity with source JSON requires DECISION_REQUIRED; do not infer costs.

## GRANICE
`gra/data/tech.json` is the read-only source for this docs-only task; preserve all product/gameplay data and costs. No product balance changes, no changes outside allowlist, no broad queue/register edits, no commit/deploy/push.

## OBIEG
Operator → Evaluator → Final Control → integracja orkiestratora → READY_FOR_DEPLOY → osobna bramka deploy/push. Operator does not evaluate, integrate, commit, deploy, or push.
