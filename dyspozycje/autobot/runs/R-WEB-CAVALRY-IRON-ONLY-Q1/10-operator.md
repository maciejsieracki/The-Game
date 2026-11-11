# Operator report — R-WEB-CAVALRY-IRON-ONLY-Q1

## Implementation

- Moved Konnica and Jeździec chiński from Brąz/Jeździectwo to Żelazo/Sztuka wojenna. All 27 Iron-era units now use Sztuka wojenna. Costs, stats, identities, replacement links, and save roster entries are unchanged.
- Removed Konnica and Jeździec chiński from Jeździectwo's unlock summary and added the six remaining Bronze chariots. Chariot era/tech gates are unchanged.
- Moved Katapulta's research gate to Sztuka wojenna, including the paid active-siege build option shared by humans and AI. Katapulta remains excluded from normal city recruitment and replacement; other siege engines retain their existing individual tech gates and active-siege-only path.
- Updated the source CSVs and generated tech/building cards, Civpedia generator outputs, and the directly affected technology/building/unit wiki entries. Siege-machine wiki entries now describe active-siege construction rather than city recruitment.
- Added an explicit migration contract test: new Konnica recruitment is blocked before Iron, while a legitimately paid old Konnica queue item can finish. Existing paid recruitment is not cancelled or refunded. This does not change FALA614's legacy siege-queue behavior.

## Audit result

The production catalogue used by human city recruitment and AI excludes every `Typ: Siege` unit. Replacement has its own Siege exclusion, and the active-siege build option checks the unit's current `Tech` for both human and AI callers. The current siege suite covers save/load pending, ready, and runtime siege machines; the follow-up run found no concrete normal-recruitment leak, so there was no unrelated recruitment-path fix.

## Validation

- `iron-gating-impl-test.cjs`: **153 passed, 0 failed** (all Iron unit techs, cavalry era/tech, unchanged chariots, player production, replacement, new purchase gate, paid old queue behavior, prereqs, AI research).
- `siege-engines-built-during-siege-test.cjs`: **28 passed, 0 failed** (added Katapulta's old-Oblężnictwo blocked / Sztuka wojenna enabled check; existing save and siege cases included).
- `tech-unlock-units-test.cjs`: **119 passed, 0 failed**.
- `general-eligible-unit-roster-test.cjs`: **137 checks passed**; `unit-recruit-nazwa-test.cjs`: **17 passed**; `super-unit-limit-one-test.cjs`: **40 passed**.
- `gen-tech-cards-top5.cjs --check` and `gen-building-cards-top5.cjs --check`: both pass.
- `npm run typecheck -- --pretty false` and `git diff --check`: pass.
- Browser-backed `building-cards-top5-test.cjs` and `tech-cards-top5-test.cjs` could not launch: this environment has no Chromium executable at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. The generated card output and generator `--check` pass; browser screenshots were not measured.
