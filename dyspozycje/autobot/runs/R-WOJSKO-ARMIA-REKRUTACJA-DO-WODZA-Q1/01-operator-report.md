# Operator report — R-WOJSKO-ARMIA-REKRUTACJA-DO-WODZA-Q1

## Implemented

- Added a visible, checked-by-default **Idź do wodza** toggle to the Army recruitment section. Its helper text states that newly completed units march toward and track the leader.
- Applied the current default to newly completed player units from both production completion and city recruitment completion. Turning the default off sets each new unit's individual `followGeneral` preference to false and prevents the automatic march.
- Made the selected-unit **Idź do wodza** action a per-unit toggle. Enabling it issues the existing tracked march; disabling it clears that unit's leader-follow march. This keeps partial rally available.
- Persisted the global default and each unit preference in saves. Older saves without the setting use the historical enabled default; missing per-unit fields do not cause existing units to be redirected.

## Checks

- `cd gra && npm run typecheck` — passed.
- `cd gra && node tools/recruit-rally-default-ui-test.cjs` — passed; exercises the production Army recruitment renderer in jsdom and confirms the change handler updates the default.
- `cd gra && node tools/recruit-rally-default-save-test.cjs` — passed; confirms roundtrip persistence of both settings and safe legacy omissions.
- `cd gra && node tools/general-quick-follow-action-test.cjs` — passed, 15/15; includes live Chromium click, pathing, tracked leader movement, and unit action rendering.
- `cd gra && npm run build` — passed.

## Review state

Operator implementation and checks are complete. Independent Evaluator and Final Control remain required by dispatch. No push, integration, or deployment was performed.
