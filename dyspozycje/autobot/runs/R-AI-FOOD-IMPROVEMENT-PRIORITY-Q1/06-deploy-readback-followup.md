# Follow-up: later main/Robocza publication

The task-specific Final Control `05-final-control.md` stopped at stage 8 and said
that no release had happened at that time. The accepted product correction is now in
`main`: source commit `aa540f35` (livestock stage contains only `bydlo`, `owce`, `lama`)
and preceding stage commit `cf236daf` are ancestors of current `main` and the release
source `96d088b4`.

The Robocza release `87aa8678427109b9a109aea7797ca3c171cfd84f` was built from that
source tree; its deployment receipt `R-BITWA-KOLEJKA-ROZKAZOW-STALE-Q1/80-deploy-and-push.md`
records exact local/remote SHA-256 for the main and battlefield bundles, manifest
agreement, `SMOKE OK`, `VERIFY OK`, and `git ls-remote` readback. Current `origin/main`
contains this release. The product behavior test passed 11/11 and typecheck/build
passed in the later Operator recheck (`R-AI-FOOD-IMPROVEMENT-PRIORITY-Q1` commit
`002b039e`); the independent evaluator r2 and Final Control reports remain
PASS-WITH-NOTES.

This closes stage 11/11 for the accepted ordering. Known test baseline remains recorded:
`ai4-popyt-obywatele` 46/4 and `ai2-heks-po-heksie` 32/3 were unchanged; the final
operator recheck ran AI improvements 53/53, auto-improvements 45/45, farm 138/138,
livestock 113/113, and qualification 133/133.
