# 07 — Root integration: building speed

DATE: 2026-10-18  
RUN: R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018  
STATUS: ACCEPTED_LOCAL_BOUNDED — `prod_szybkosc_budynku_proc` only; activation round 2/5

## Materialized root decision

Root reviewed the actual building-speed helper and main-loop raw-value path, the per-kind ETA behavior, Evaluator recheck `05-evaluator-recheck-building-speed.md`, Final Control `06-final-control-building-speed.md`, and confirmed `git diff --check` clean. Root accepts the bounded consumer scope for `prod_szybkosc_budynku_proc` locally.

The implementation resolves the value using `city.ownerId` and passes the raw value once to `advanceProduction`; the shared helper applies it only to an active building front. Empty-queue, paused, and unit-front behavior retain their existing paths. The building ETA preview uses the same owner-specific effective rate, including per-kind handling for mixed legacy queues. Final Control accepts the recorded bounded checks: owner-specific actual call paths for human owners 0, 7, 42 and AI owner 99, missing-owner neutrality, zero/nonzero rates, Work and ETA behavior, queue ordering, pause, overflow, and remainder behavior. No tests were rerun during this integration.

**Round clarification:** Final Control's phrase “r4 correction” refers to the correction within this building-speed phase's second implementation round (Phase A then its round-2 correction); it does not mean this run reached round 4. The bounded activation remains round 2/5. The Final Control file is preserved unchanged.

## Remaining production scope and limits

The original three-field production goal remains PARTIAL. `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` are still pending owner decisions and were not changed or activated. The accepted building scope does not imply that their all-zero source cells resolve future behavior.

The browser card/detail visual check was not run because the Chromium executable was absent; rendering remains `NOT_VERIFIED`. No full runtime, world behavior, product-wide acceptance, or 93×15 acceptance is implied. This bounded scope is complete for the current code lane; subsequent classifier/evidence-ledger reconciliation is a separately authorized documentation/evidence scope. Preserve the raw source receipt and existing history.

DEPLOY/PUSH: NOT AUTHORIZED
