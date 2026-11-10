# Operator report — siege engines built only during siege

## Dispatch and confirmed rules read

Read `00-dispatch.md`, including confirmed additions 1–2 and the 2026-11-10 correction. The four `Typ: Siege` units are built in a live siege against an enemy at war, with each researched type available directly. Pay money and the unit card's resource from the besieger owner's treasury and stockpile at build time. The per-turn pool is `floor(nonSiegeArmyUnits / 10)` with the configured data parameter `unitsPerSiegeEngine = 10`, minus engines built during this turn. There is no fixed maximum; armies below ten qualify for zero. AI uses the same availability, gates, and costs. Existing save units remain intact.

## Pre-edit boundary and owner-context

Minimal intended allowlist: siege engine rules/data and shared build API; city and empire recruit filtering; AI city-recruit filtering and siege purchase integration; the existing siege/army panel for manual controls and reasons; a focused behavioral test plus only directly required existing regression fixes; this report. Candidate paths to verify during audit: `gra/src/game/siegeMachines.ts`, `siege.ts`, `siegeAi.ts`, `production.ts`, `ai.ts`, `gra/src/ui/siegeMapPanel.ts`, unit/recruit data and any city/empire recruitment UI caller. No unrelated roster, battle model, release, or nearby wave 610 work.

Save/load context: preserve legacy unit arrays and IDs as-is; inspect current turn serialization and siege state before choosing how to count builds made this turn. Any new state must have a backward-compatible default for saves without it. Prefer reconstructing same-turn builds from existing unit creation metadata if available; otherwise persist the smallest counter keyed to siege/army and turn. Do not migrate or delete existing machines.

## Planned behavioral checks

Exercise actual exported gameplay/build behavior at non-siege, peace, city recruitment, tech-locked, insufficient money/resource, and successful purchase cases. Verify limits at N=9/10/19/50/100/250, repeated same-turn purchases and reset next turn, all four tech gates and card resource costs, AI parity, and save/load preservation of both legacy machines and same-turn built-count semantics. Run the focused test and relevant siege, production, empire-recruit and super-unit-limit regressions. Browser is conditional on an available request slot before heavy use.

## Implementation and save/load findings

The final allowlist is `gra/data/siege-engine-params.json`, `gra/src/game/siege-engine-build.ts`, `gra/src/game/cities.ts`, `gra/src/game/production.ts`, `gra/src/main.ts`, `gra/src/ui/siegeMapPanel.ts`, this focused test, and this report. The shared paid-recruitment catalogue supplies city, empire, and AI city-recruit options; direct purchase and replacement execution have defense-in-depth rejection. Existing warsmith queue state remains readable from saves but the UI no longer adds free queue entries. New builds create runtime units with the canonical `obleznicza` model category and join the besieging stack.

`save.ts` serializes the live `City[]` wholesale and restores those city objects; it does not use a field allowlist. The new optional per-city `{turn,count}` counter therefore round-trips automatically. Old saves omit it and act as zero builds. Old siege-engine runtime units are not transformed or removed. The focused test round-trips the counter, existing `siegeMachines` state, and a legacy runtime engine through JSON.

## Verification

- `node tools/siege-engines-built-during-siege-test.cjs`: 24 passed, 0 failed (quota at 9/10/19/50/100/250; excludes existing engines; no cap; same-turn reset and persistence; war/siege/tech/money/resource gates; city and replacement recruitment exclusion; AI/human decision parity; model category).
- `npm run typecheck -- --pretty false`: passed.
- Siege AI, map siege, siege nearby-lock/join, siege defenders, starvation, last-stand, empire recruitment planner and all-panel, production overflow, super-unit-limit, and war-gate suites passed. `city-siege-wall-rules-test.cjs` reports 48 OK and 2 FAIL in player storm empty fortified-city wiring assertions on both this candidate and base `cb17ba921`; these failures predate this change.
- The browser-backed `siege-blockade-no-recruit-reinforce-test.cjs` passed all 57 assertions, including D1–D9 in Chromium, when served over HTTP using `/usr/bin/chromium`. The stock harness attempted `file://`, which Chromium blocked, so this live run used an otherwise identical temporary harness that replaced only the file URL with an HTTP server URL. Chromium was released afterward. `empire-recruit-live-test.cjs` and siege-tower live checks remain pending a later browser slot.
- No new product decision surfaced. The behavior test and existing source evidence cover the confirmed dispatch; no questions were repeated.
