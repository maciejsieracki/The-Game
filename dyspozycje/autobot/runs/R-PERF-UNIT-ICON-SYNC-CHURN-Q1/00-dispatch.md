# AutoBot Dispatch — Unit overlay sync churn

**Base:** deployed `main` SHA `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` (`a1d86212`).

**Operator scope:** In an isolated worktree, prototype a narrow optimization to avoid rebuilding unchanged unit stack badges and hunger/gold-deficit overlay sprites during `UnitRenderer.sync()`. Preserve existing visuals and behavior, add a regression test that checks unchanged-state allocation stability and updates on changed count/status, and run relevant tests, typecheck, and production build.

**Constraints:** Keep this as an isolated candidate. Do not commit, integrate, merge, deploy, or modify the active large-empire stress worktree. Report evidence and limits; do not claim this alone explains reported memory growth.

**Intended verification:** Focused overlay allocation/state regression, existing memory-leak regression, TypeScript typecheck, Vite production build, and `git diff --check`.
