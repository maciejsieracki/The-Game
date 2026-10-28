# AutoBot dispatch — new-game civilization profile and navigation

## Owner request
The civilization-selection wizard's long right-side profile forces players to scroll to the bottom to reach “Dalej”. Add a foldable profile panel and keep wizard navigation visible.

## Scope
- Base: deployed `origin/main` `39d020aed3921d7188284dd1fee3bc524707c3db`.
- Keep the selected civilization and profile available; the profile can be hidden and revealed from a keyboard-accessible control.
- Constrain scrolling to wizard content and pin Back/Next in the wizard footer.
- Verify desktop, small viewport and a 150%-zoom-equivalent CSS viewport, including select/collapse/reopen/continue.
- No deploy, commit, merge or push in the operator task.
