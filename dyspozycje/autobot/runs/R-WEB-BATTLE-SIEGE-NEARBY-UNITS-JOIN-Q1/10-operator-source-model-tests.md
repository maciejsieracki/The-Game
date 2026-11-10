# R-WEB-BATTLE-SIEGE-NEARBY-UNITS-JOIN-Q1 — operator source/model/tests

## Baseline and reproduction

Isolated branch `codex/siege-nearby-609` at base `2b0f49da4`. This is a source-level reproduction with the real roster helpers bundled by esbuild; no browser or game-state mutation was used.

Fixture: city owner 2 at `(0,0)`; besieger owner 1 at `(1,0)`; owner 1 reinforcement at `(0,1)`; owner 3 at `(-1,1)`; neutral owner 4 at `(0,-1)`; city-owner units at `(0,0)` and `(-1,0)`; owner 5 at `(1,-1)`. Each is within distance 1 of the city.

Observed production builders:

| Side | Current call chain | Selected IDs | Omitted eligible nearby units |
|---|---|---|---|
| Attacker | `main.ts::collectSiegeAtkRoster` → `collectAtkRosterNearCity` → `collectUnitsInRadius` | `atk-anchor`, `atk-own-neighbor` | `atk-ally` (owner 3) |
| Defender | `main.ts::collectSiegeDefRoster` → `collectCityDefRoster` → `defenderUnitsNearCity` | `def-garrison`, `def-neighbor` | `def-ally` (owner 5) |

The raw `collectDefRosterNearCity` helper selects all units at distance 1, but production `defenderUnitsNearCity` narrows this to `u.ownerId === city.ownerId`. The attacker helper has an equivalent exact-owner restriction inside `collectUnitsInRadius`. The existing spatial radius already is city hex plus six neighbors (distance `<= 1`); the failure is side-owner membership, not a radius, fog, movement, or siege-lock issue. Neutral owner 4 is currently excluded from both production rosters.

## Entry-path inventory

| Entry | Roster source | Subsequent behavior |
|---|---|---|
| Human wall storm, Manual | `launchSiegeStormFromMap` snapshots `collectSiegeAtkRoster` and `collectSiegeDefRoster`, builds prebattle from those lists, then passes both full lists to `BattleScene` and `finishSiegeStormBattle`. | Scene slices each side at `BATTLE_MAX_PER_SIDE` (500). Scene `eventLog` identifies the units actually instantiated; post-battle applies losses to the full roster using those IDs, preserving un-deployed reserve units. Siege path has no visible `battleReserveNotice` today. |
| Human wall storm, Auto | Same rosters and prebattle; `doSiegeAutoResolve` computes power from the full lists and `finishSiegeStormBattle` uses proportional auto losses. | Existing Auto behavior is not capped to the manual scene's deployed slice. Do not alter without a specific instruction; adding legal units naturally changes the full Auto roster. |
| AI silent wall storm | `executeSilentSiegeStorm` uses the same two roster builders and auto power/loss flow. | No prebattle/scene. Preserve current automatic casualty behavior. |
| AI siege stance / machine readiness | `scanAutoSiegesAfterAiTurn` and `maybeAiAssaultAfterMachines` call `collectSiegeAtkRoster` to assess siege strength. | If that helper changes to allies, ally strength affects stance/readiness too. This is a direct consumer and should be audited with the roster change. |
| Besieged-owner sortie | `lastStandSortieCmdsForOwner` emits ordinary unit-vs-unit attack commands; normal field battle roster collection is used for each attack, not the city siege roster builders. | Out of scope for city-ring siege roster collection unless the attack is specifically the wall storm. Preserve existing sortie war/visibility gates. |
| Open/unwalled city battle | Separate `launchFieldBattleFromMap`/`mapFieldBattle.ts` roster path. | Not a wall siege entry; preserve unchanged. |

`BattleScene` currently exports `BATTLE_MAX_PER_SIDE` from `MAX_PER_SIDE = 500`. The stale 120 figure is not current. The existing manual siege scene already caps deployment internally and returns event IDs for deployed units. The new/manual siege path should use the same reserve notice convention as other manual battle paths if additional allies can make rosters exceed 500; this does not authorize changing the cap or changing Auto casualty allocation.

## Eligibility boundary from source

The available shared legality predicate is `areEnemyOwners(a,b)` in `main.ts`: same owner is false, barbarian is always hostile to every other owner, and other relations are hostile only when diplomacy says `status === 'wojna'`. Formal alliance treaties are not themselves a war relation; an ally that has legally joined the war is represented by the war relation and therefore passes this gate.

The side-membership rule was settled by the root operator decision below: a principal and its active formal allies participating in this war, checked against hostility to the opposing principal. A separate war relation without a formal alliance to the siege principal is insufficient.

Do not include independent third parties, including a barbarian hostile to both principals, just because they pass the general hostility predicate. The approved membership check excludes them absent a formal alliance with exactly the side they support and war participation against the other principal.

## Approved side membership model (root decision)

Include the principal side owner and its currently active formal allies that are participating in this war, with a check that each ally is hostile to the opposing principal. Being at war with the opposing principal by itself is insufficient. Do not pull an independent third party or a barbarian that is hostile to both sides into this two-sided battle. This keeps the existing two-side battle model and avoids dragging neutral owners into war.

## Concrete code allowlist before implementation

Proposed touched paths only:

- `gra/src/units/battleRoster.ts` — pure distance-1 roster collection that can accept already-approved owners while preserving anchor/civilian rules.
- `gra/src/game/siegeDefenders.ts` — keep current owner-only helpers intact for non-siege callers; expose only the minimum shared collection seam if required.
- `gra/src/battle/battleScene.ts` — carry per-unit owner civ/difficulty combat context, falling back to current per-side options for existing/synthetic callers.
- `gra/src/battle/battle-unit-context.ts` — pure resolver for per-unit context and compatibility fallbacks, directly covered by the focused Node test.
- `gra/src/main.ts` — select eligible owners at the siege boundary for every manual/Auto/AI stance/AI assault consumer; preserve existing war predicate, cap, event-log reserve semantics, and add the existing reserve notice for manual storm. Calculate siege storm morale bonus per owner's own roster.
- `gra/tools/battle-siege-nearby-units-join-test.cjs` — exercise the real roster selection and siege wiring for attacker/defender, alliance joined-to-war, neutral owner, exact radius, 500 cap/reserve event handling, manual/Auto/silent/sortie boundaries.
- `gra/tools/battle-undeployed-units-test.cjs` — update its existing structural count from two to three reserve notices because siege Manual now uses the established notice too.
- This task folder's `10-operator-source-model-tests.md` — evidence and decisions.

`gra/data/battle-params.json` is named in the inherited dispatch allowlist but does not exist in this checkout. The current radius is a literal existing distance-1 rule in `battleRoster.ts`, and the requested radius equals that rule; no data file is needed unless the owner specifically wants radius configurable. No build output, `gra-robocza/`, `dyspozycje/WERSJE.md`, registry/ledger, or unrelated battle/map code is in this allowlist.

## Tests to run after eligibility rule is settled

- New `battle-siege-nearby-units-join-test.cjs`: real helpers select all distance-0/1 same-side units; exclude distance-2, civilians on adjacent hexes, peaceful/neutral owners; include currently-at-war allied owners on the correct side; ensure anchor remains first and IDs are unique.
- Positive multi-owner fixture on both sides plus negative neutral/peace fixture, and a boundary case with an owner hostile to both principals once the owner decides its handling.
- Cap fixture at 501+ eligible units per side: scene limit remains exactly 500; manual reserve notice and `eventLog` preserve undeployed units; no reserve is silently removed from the world roster. Auto/silent loss semantics remain their existing full-roster semantics.
- Structural coverage of Manual wall storm, Auto wall storm, AI silent storm, AI siege-strength consumers, and the ordinary sortie/open-city paths remaining separate.
- Existing siege and battle tests covering roster construction, battle event IDs, post-battle reserves, siege storm and sortie.
- Node tests only; no Chromium assumed because of the task's no-Chrome constraint.

## Reproduction performed before source edits

Bundled and executed the actual `collectAtkRosterNearCity` and `collectCityDefRoster` production functions against the fixture above. Output:

```json
{"attack":["atk-anchor","atk-own-neighbor"],"defense":["def-garrison","def-neighbor"]}
```

This reproduces the owner-based omission. The implementation below changes the siege roster owner filters while keeping the same distance and civilian filters.

Existing Node baseline checks also passed before source edits:

- `battle-cap-500-test.cjs`: 59 assertions (500v500 setup/performance included).
- `battle-undeployed-units-test.cjs`: 35 assertions.
- `siege-defenders-test.cjs`: 12 assertions.
- `siege-manual-battle-behavior-test.cjs`: 40 assertions.
- `siege-last-stand-sortie-test.cjs`: 71 assertions.

No Chromium run is part of this lane.

## Mixed-owner behavior confirmed before implementation

- `runtimeToBattleUnit` preserves each unit's own type stats, current HP, veteran/upgrade bonuses, and hungry/deficit flags. Keep this path per runtime unit.
- Siege roster titles and capture ownership use the anchor/primary owner; keep that owner as the coalition's lead and city recipient.
- Keep side order deterministic with the principal's units first (anchor first on attack, city-owner units first on defense), then formal allies. This preserves the lead-owner labels and makes the existing 500-unit cap select the siege principals before allied reinforcements.
- `post-battle-map.ts::registerVeteranProgressAfterBattle` grants victory progress only to deployed winning roster IDs from the event log and iterates each runtime unit; undeployed reserves do not gain progress. Dead losses are counted per `RuntimeUnit.ownerId` before `noteBattleOutcome`.
- Manual scene results include event IDs only for the up-to-500 instantiated units. Keep the complete eligible rosters passed to post-battle so undeployed reserves stay untouched. Manual siege currently lacks the field battle reserve toast; add it when the coalition exceeds 500.
- Civ combat effects and difficulty combat multiplier are currently selected once per side from `roster[0].ownerId`; siege storm also currently computes one leader morale bonus for the whole side. Those would incorrectly give allies the principal owner's bonuses. Preserve each unit owner's civ/difficulty context in the tactical scene and calculate commander morale using the unit's own owner group. Group the siege defender's prebattle bonus breakdown by owner as well. Existing homogeneous sides remain unchanged because each unit gets the same owner context as before.

## Final verification

- `npm run typecheck -- --pretty false`: PASS.
- `battle-siege-nearby-units-join-test.cjs`: 14 assertions PASS (owner membership, exact radius/civilian filters, principal-first ordering, reserve/casualty/event wiring, owner-specific tactical bonuses, sortie/open-city separation).
- `battle-cap-500-test.cjs`: 59 assertions PASS.
- `battle-undeployed-units-test.cjs`: 35 assertions PASS after updating the expected reserve notice count to include siege manual.
- `siege-defenders-test.cjs`: 12 assertions PASS.
- `siege-manual-battle-behavior-test.cjs`: 40 assertions PASS.
- `siege-last-stand-sortie-test.cjs`: 71 assertions PASS.
- `ai-siege-requires-war-test.cjs`: 49 assertions PASS.
- `map-siege-test.cjs`: 6 assertions PASS.
- `battle-skip-siege-parity-test.cjs`: 13 assertions PASS.
- `siege-nearby-lock-join-test.cjs`: 23 assertions PASS; its browser portion reports NIE_ZMIERZONO because Chromium is unavailable.
- `siege-blockade-no-recruit-reinforce-test.cjs`: Node logic/structural sections passed; its script then failed launching the absent Chromium executable at `/opt/pw-browsers/chromium`, so browser verification is NIE_ZMIERZONO.
- An exploratory `defense-breakdown-test.cjs` run fails at its existing fixture lookup (`grecy.bonusy` is undefined) before reaching the changed siege path; the new focused test covers owner grouping wiring directly.
