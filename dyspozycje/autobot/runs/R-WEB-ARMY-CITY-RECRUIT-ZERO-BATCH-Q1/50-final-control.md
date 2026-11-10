# R-WEB-ARMY-CITY-RECRUIT-ZERO-BATCH-Q1 — Final Control

STATUS: PASS WITH SCOPE NOTE — release evidence is adequate for the requested recruitment behavior.
FINAL CONTROL: independent source/scope review of candidate `10c3cdec6a25f93859b69d7611fe24d705e42e2c` (`codex/army-city-recruit`); reviewed at evaluator HEAD `b30a53071a02a1a9e70760c869600342cc2493a2`.

## Evidence reviewed

The independent evaluator report records these results on the candidate using real Chromium over HTTP (no `file://`):

- `empire-mass-recruitment-test.cjs`: **45 passed, 0 failed** — two cities and unit types, zero initial drafts, per-city/type isolation, exact callback arguments, top and bottom Army actions, partial acceptance and remaining draft message, one-at-a-time purchase, reload/remount persistence, ordinary City panel default 1, and 150% zoom visibility/clickability.
- `empire-recruit-all-test.cjs`: **31 passed, 0 failed** — one upper button remains in the civilization-wide panel and its purchase/refusal/partial-result behavior works.
- `recruit-card-quantity-real-render-test.cjs`: **25 passed, 0 failed** — ordinary recruitment card quantity behavior remains intact.
- TypeScript check: **PASS**. `git diff --check`: **PASS**.

The candidate diff is limited to the task allowlist: recruitment UI/callback files, two recruitment gates, and the run dispatch. Source review confirms the Army submission sends positive quantities only to their selected current-player cities through the existing purchase path; it does not redirect entries. New-game and load preparation clear the draft store and batch status. No balance or data changes were found.

## Scope and ownership note

The evaluator's statement that there is no owner-seat switching path is too broad. The default new-game state initializes one human seat, but the current game code has a production `advanceSeat()` path that calls `switchActiveHuman()` for the next saved human seat. The tested recruitment scenario did not exercise two active human seats, so owner-seat isolation remains unverified.

Draft storage is keyed by `cityId|unitId`, without an owner ID. Submission filters out cities not currently owned by the active human. Thus another seat cannot submit a foreign-owned city's draft, and new/load resets prevent cross-save carryover. If a city is lost and later recaptured by the same player before a session reset, its old draft can reappear. This is a narrow persistence edge case; it does not invalidate the tested request behavior or dispatch contract, which requires city/type identity and current ownership filtering.

No source files were changed during final control. No stage, commit, push, or deploy was performed.
