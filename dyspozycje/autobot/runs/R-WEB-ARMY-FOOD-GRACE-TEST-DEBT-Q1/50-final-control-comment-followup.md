# Final-control follow-up — fixture comment

**PASS.** Read back `21-operator-response.md` and the scoped test diff. The first-turn fixture comment now states that 20 units at base upkeep 1 incur cost 80 under the approved FALA1×FALA2 multiplier, with a zero reserve and an 80-food deficit. This resolves the prior non-blocking clarity note.

The follow-up changes only that comment: no assertion, fixture value, or behavior changed. `git diff --check -- gra/tools/glod-wojska-karencja-test.cjs` passes. The previously recorded 40/40 focused result remains applicable; I did not rerun it for a comment-only correction. No product source edit or commit was made.
