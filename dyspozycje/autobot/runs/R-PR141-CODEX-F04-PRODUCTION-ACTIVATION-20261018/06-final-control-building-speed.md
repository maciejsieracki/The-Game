# 06 — Final Control: building-speed field

DATE: 2026-10-18  
RUN: R-PR141-CODEX-F04-PRODUCTION-ACTIVATION-20261018  
STATUS: PASS — bounded `prod_szybkosc_budynku_proc` phase only; three-field GOAL remains partial.

## Bounded acceptance

The current source applies the owner-resolved `prod_szybkosc_budynku_proc` value exactly once, at the active building Work consumer. `main.ts` resolves from `city.ownerId` and passes the raw value to `advanceProduction`; it does not pre-scale the base budget. `advanceProduction` applies the fractional rate only when the front item is a building. The empty-queue path returns the original Work budget to the pool before the modifier, paused production adds no Work, and legacy unit fronts retain the base Work rate. Existing completion carry and last-item remainder behavior remain in place.

Building ETA paths use the same owner-specific effective rate. The r4 correction closes the mixed-legacy-queue issue: `queueItemCumulativeEta` now selects a rate by each queued item's kind, so building entries use the adjusted rate while unit entries retain the original rate. The per-item ceiling, minimum-one-turn, pause-to-null, and no-Work null behavior remain intact.

The independent Evaluator recheck reports the focused source-execution test passing and no findings. Its fixtures execute actual owner resolution, matrix lookup, turn budget/call, `advanceProduction`, and city-panel ETA paths for human owners 0, 7, and 42 and AI owner 99; missing owner keys remain neutral and do not fall back to owner 0. They demonstrate zero neutrality, unrounded 2.25 Work scaling to 2.7 / 1.8, matching 11-Work ETAs of 4 / 5 / 6 at +20% / zero / -20%, both mixed queue orders, all-building and all-unit queues, empty-queue overflow, pause, and existing completion/remainder behavior. The current 15 source values remain zero. The bounded regression results are accepted as recorded in `02`, `04`, and `05`; no tests or runtime were rerun during Final Control.

## Remaining boundaries

This accepts only the bounded building-speed consumer. `prod_szybkosc_jednostki_proc` and `prod_rush_koszt_proc` remain unchanged and pending owner choices; the original three-field production goal is therefore PARTIAL. Their all-zero source cells do not resolve their behavior or count as consumer activation. The production-recon contract still treats their raw receipt approval and `UNWIRED` consumer status as separate facts.

The bundled browser card test did not run because its Playwright Chromium executable is absent. No alternate browser or visual check was run, so card rendering remains `NOT_VERIFIED`. No full game/runtime, world, or product acceptance is implied. The shared product source is frozen for this lane; any subsequent classifier/evidence-ledger work is a separate scope and needs its own root authorization.

DEPLOY/PUSH: NOT AUTHORIZED
