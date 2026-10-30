# Follow-up: actual integration and Robocza readback

The earlier `51-integration.md` records `eeaf0645` as the candidate, but that commit
contains only refreshed evidence images. The product implementation is `f8b31678`.
It was integrated with an equivalent product patch in `90f26b22`; a stable patch-id
comparison of the product files yields the same `f2baa9174c8e6ae6a5edf41940e82008634bbfe9`.
The source module and test are present in the integrated tree.

The later source commit `96d088b4`, used to build the Robocza release, descends from
`90f26b22` and contains `gra/src/render/buildHighlight.ts`. Its release commit is
`87aa8678427109b9a109aea7797ca3c171cfd84f`; pinned remote reads for the main Robocza
bundle and battle bundle match their local SHA-256 values, and the manifest matches
both bundle hashes and byte sizes. `git ls-remote` confirmed that release at
publication; the current `origin/main` is `6abc4ed3` and contains the release.

Together with Final Control `3b99ea8d` (lifecycle 39/39, mine 76/76, live Chromium
50/50, typecheck/build PASS), this confirms stage 11/11. This follow-up corrects the
candidate/release trace; it does not claim that the docs-only commit `eeaf0645`
contained the production fix.
