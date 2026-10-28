# AutoBot Operator Dispatch

STATUS: OPERATOR — READ-ONLY AUDIT
DOMAIN: PERFORMANCE / UI RETENTION
TASK: R-PERF-CITY-PANEL-DOM-RETENTION-Q1
BASE: `a1d8621290d107adc3ece82978d64aa6b7c4c0dc` (ROBOCZA with transient GPU cleanup)

## Goal
Determine whether repeated city-panel open/close retains DOM nodes or listeners, and explain the T1 CDP observation of nodes 6,764→16,138 and JS listeners 420→1,413 after five open/close cycles.

## Scope
Read-only inspection of the real city panel lifecycle, global listener/timer registration and current measurement harness. No source edits, no gameplay behavior change, no deploy/push.

## Acceptance
Report the cleanup paths and their limits; distinguish evidence of detached-node retention from counts collected before garbage collection; give a reproducible experiment that can confirm or reject per-cycle growth.
