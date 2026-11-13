# Final Control — R-WOJSKO-ARMIA-REKRUTACJA-DO-WODZA-Q1

**Verdict: PASS**
**Candidate:** `2a504c8c140d2d0b1c38f34f9254ca76e7ea010e`
**Product fix:** `21f8f2bda3b99eeb37c67a59e91b0432f9dbb7ec`
**Base:** `9f6f7771`

The candidate meets the registered scope. The Army recruitment panel has a visible checked-by-default “Idź do wodza” control; the selected-unit action remains individually toggleable, including for an opted-in unit on the commander’s hex. Changing the global default affects new recruits only. Both player city-production completion paths set the unit preference from the default, while AI-owned completions do not inherit the player setting.

The round-2 correction is present in the product commit: after each successful instant end-turn march segment, the game synchronizes tracked leader targets, plans opted-in units that have become separated, and enqueues new followers only once. The march-attack return path also synchronizes. Existing tracked followers are retargeted rather than duplicated.

The change is limited to rally preference, recruitment application, march synchronization, save support, UI, and the corresponding tests. The six candidate commits are based on the declared `9f6f7771` base; the branch is ahead 6 / behind 9 from `origin/main` because of unrelated accepted changes. It was reviewed against its declared base and was not rebased.

## Independent verification

- `node tools/general-quick-follow-action-test.cjs` — **20/20 PASS**, including same-hex opt-in, leader movement, instant end-turn follower activation and retargeting, no duplicate order, per-unit action, and Chromium click behavior.
- `node tools/recruit-rally-default-ui-test.cjs` — **PASS**; verifies the production Army-panel toggle, checked default, explanatory text, and change callback.
- `node tools/recruit-rally-default-save-test.cjs` — **PASS**; verifies global default and per-unit overrides roundtrip and that legacy omissions load safely.
- `npm run typecheck` — **PASS** (`tsc --noEmit`).
- `git diff --check 9f6f7771..HEAD` — **PASS**.

Legacy saves with no global setting retain the historical enabled default. Missing per-unit flags are left absent on loaded units and do not redirect them. The optional global boolean and unit flags serialize with the save; existing march state remains loaded through its established fields.

No product edits, integration, rebase, push, or deployment were performed during Final Control. The candidate remains unintegrated.
