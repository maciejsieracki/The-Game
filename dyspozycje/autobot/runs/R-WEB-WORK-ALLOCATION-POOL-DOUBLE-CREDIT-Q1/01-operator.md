# Operator audit — Work allocation and empire pool

Status: **no confirmed double-credit defect; source unchanged**  
Base: `4919be9dc` (`codex/work-pool`, `/tmp/work-pool`)  
Audit date: 2026-11-11

## Finding

The observed values do not establish a conservation failure. The screenshots are not proven to be from the same turn; the dispatch itself records that the `+13295/t`, `+9857 pool`, and separate `-910 auto` / `-2765 upkeep` readings may belong to different frames. The actual end-turn writer has one per-city allocation credit and one distinct completion-overflow credit. An idle queue explicitly routes its unused building allocation to the empire pool. These are documented returns of unspent city work, not two credits of the same unit.

A 38-city ledger using the real `splitPraca`, `pracaImperialPoolGain`, and `advanceProduction` helpers reproduces the headline values exactly at 100% buildings / 0% improvements:

| Work split (pool/buildings) | Cities | Work/t | Direct pool allocation | Idle queue return | Completion overflow | Busy queue work | Pool start | Drains | Pool end |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 0/100 (0% pool, 100% buildings; screenshot setting) | 38 | 13295 | 0 | 9800 | 57 | 3438 | 48235 | 0 | 58092 |
| 50/50 | 38 | 13295 | 6645 | 4900 | 0 | 1750 | 48235 | 0 | 59780 |
| 100/0 (pure helper boundary; UI clamps buildings to at least 50%) | 38 | 13295 | 13295 | 0 | 0 | 0 | 48235 | 0 | 61530 |

Fixture details: yields are 33 cities × 350 plus 5 × 349. For the first row, 28 cities have empty queues, one queue has 293 Work remaining and returns 57, and nine queues remain busy and receive 3438 Work. Thus `48235 + 9800 + 57 = 58092` and all 13295 Work is accounted for. This is a constructive conservation witness, not proof that the screenshot had this queue distribution. Upkeep and automation are zero in this controlled fixture; each must be subtracted once when comparing a real frame. The UI's building share is clamped to 50–100%, so the 100/0 pool/buildings boundary is accepted by the pure splitter but cannot be selected in the interface.

## Source trace

- `production.ts::splitPraca` rounds `doBudynkow` once and defines `doPuli = total - doBudynkow`, preserving each city's integer yield exactly.
- `pracaImperialPoolGain` sends only `doPuli` for a busy queue; an empty queue gets `doPuli + doBudynkow`.
- End turn calls that helper once per unpaused city, then calls `advanceProduction` with the building share only for a busy queue. Only `advanceProduction`'s returned completion remainder is separately credited. The two amounts are disjoint: the first never includes busy-city building work; the second is the remainder after queue cost.
- UI's `previewPracaPoolBrutto` matches idle/busy routing but intentionally omits completion overflow and production multipliers. The actual live next-turn forecast separately applies the production multiplier and adds completion overflow, then subtracts upkeep. A stale UI cache can therefore differ from the actual next turn; that is a forecast-timing difference, not a second pool write.
- Sliders use `procentBudynki` as the building share, clamped to 50–100%; the pool share is its complement. 100/0, 50/50, and 0/100 are each represented without a reversed multiplier.
- AI and human end-turn writes use the same split/gain helpers. The write targets differ by owner: human seat pool accessor versus `aiPracaPoolByOwner`. Auto-improvement spend is later taken from the cumulative owner pool.
- Save serialization keeps the player pool in `meta.playerPracaPool`; restore sanitizes and restores it. Hot-seat seats 0+ are also serialized as `meta.pracaPoolByHuman`.

## Checks

- `node tools/production-overflow-test.cjs`: pass; covers idle 100% buildings, busy queue, completion overflow, preview idle/busy behavior, and split conservation.
- `node tools/praca-pula-rate-parity-test.cjs`: pass, 20/20; covers gross/net drains and differences between live refresh and end-of-turn values.
- `node tools/saveload-praca-pool-live-test.cjs`: pass, 13/13 under `/usr/bin/chromium` with the built bundle served over HTTP; pool round-trip, sanitizer boundaries, one-city player pool.
- `node tools/praca-jeden-podzial-kontrakt-test.cjs`: 635 pass, 2 fail on this unchanged base. Failures are negative-control assertions at 24 and 36 Work/t expecting zero automation spend under the retired per-turn-budget model; observed spend is 1460 and 1520 respectively. The same 635/2 result was reproduced in the original `/workspace/The-Game` checkout at exact base `4919be9dc`. These tests are not evidence of allocation double-credit and were not edited.
- `node tools/ai-praca-split-parity-test.cjs`: 23 pass, 4 fail on this unchanged base. Failures are picker-count assertions (expected 1, got 2) and a retired cap-25 mutation expectation (got 1, expected 0). The same 23/4 result was reproduced in the original `/workspace/The-Game` checkout at exact base `4919be9dc`. Source/write path unchanged; these failures need a separate test-baseline review before they can be attributed to this issue.
- `node tools/civ-ai-allocation-test.cjs`: pass, 11/11; confirms AI owner profiles draw automation cap from the cumulative owner pool and share the same allocation policy.
- `node tools/saveload-praca-pool-hotseat-live-test.cjs`: pass, 22/22 under `/usr/bin/chromium` with the built bundle served over HTTP; per-seat snapshot, fresh-page reload, legacy saves, and invalid values.

## Disposition

No root cause is confirmed from the available screenshot facts, so there is no justified production edit, baseline-RED test, or economy adjustment. To prove the reported turn, capture one same-turn snapshot containing pre-turn pool, 38 city work yields, sliders, queue states/progress, production multiplier, pool credits, upkeep, auto/manual spend, and post-turn pool. The code currently conserves work when idle returns and completion overflow are counted as documented.
