# Independent Defense — R3 live manual battle

**Verdict: PASS.** Defense independently checked the trace and response. The actor was unacted and before its turn-order index when attack-march was issued; the test waits only for events appended after that order. A fresh strike routed the route threat (HP stayed at 1, `routed=true`), and natural round-4 activation moved the actor `(24,60)→(25,60)` toward its waypoint while keeping the order. No stale-event false positive remains. The 28v28 queue, exact-target hit, and no-browser-error assertions also pass.

The exact-target subcase's controlled reset of `acted` remains a stated test limitation; it does not affect the attack-march result. No product defect found.
