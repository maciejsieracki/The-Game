# Operator audit — R-WEB-CAVALRY-IRON-ONLY-Q1

Baseline: `4919be9dc`, captured before edits on 2026-11-11.

## Change allowlist

- `gra/data/units.json`: only `Epoka`/`Tech` eligibility fields for mounted cavalry and `Tech` for Katapulta; preserve all costs, stats, names, replacement links, and other units.
- `gra/data/tech.json`: update only the `Odblokowuje budynek` and `Uwagi` lists on Sztuka wojenna and Oblężnictwo to match those unit eligibility changes.
- Source CSV/corrections for the current tech/building cards, the generated card JSON, the Civpedia generator, and only the affected unit/tech Civpedia pages.
- Existing focused recruitment test and siege-engine gate test; narrowly update the building card suite for the changed siege description.
- New/updated focused test assertions for general production, replacement, human active-siege build option, and AI active-siege build path. No unrelated AI or siege behavior changes.

## Baseline roster facts

- There are 25 Iron-era units at baseline. Twenty-four have `Tech: Sztuka wojenna`; Katapulta alone has `Tech: Oblężnictwo`.
- There are 13 `Typ: Mount` units. Five are non-chariot cavalry: Konnica and Jeździec chiński (Bronze) plus the three Iron cavalry. The rest are chariots, which keep their current era and tech. All existing Iron cavalry already require Sztuka wojenna.
- Current total Iron units after planned edits will be 27: 24 existing Iron units + Katapulta + two moved Bronze cavalry.

## Consumer audit at baseline

- `gra/src/game/production.ts::availableProduction` is the shared player and AI catalogue source. It filters by era, `Tech`, nation, barracks, and stock; it explicitly excludes every `Typ: Siege` row.
- `gra/src/game/production.ts::availableReplacementsFor` independently checks era, `Tech`, nation, barracks, and stock; it explicitly excludes `Typ: Siege` from replacement.
- Human replacement and AI era replacement both call `availableReplacementsFor` with owner technology and epoch. AI city production receives the production-availability callback wired by `main.ts`, keeping the shared gates.
- Human city recruit HUD uses `availableProduction`; its execution path validates the selected item against current availability. No direct normal city recruitment path for Siege was found.
- Siege engines have a separate paid active-siege path in `main.ts::siegeEngineOptions/buildSiegeEngine/buildAiSiegeEngine`; `siegeEngineBuildOption` checks the unit Tech against owner research, and both human/AI invoke it. City recruitment and replacement remain excluded.
- Existing same-topic suite `gra/tools/siege-engines-built-during-siege-test.cjs` already covers human/AI siege build gates, city/replacement exclusion, and old-save state behavior. The prior report is 27/27 passing. This audit found no concrete normal-game siege recruitment leak, so no unrelated fix is planned; rerun the suite after the Tech change.
- Paid city recruitment is persisted separately from the Praca queue and `advanceRecruitmentGated` completes already-paid entries without rechecking eligibility. New purchases use current `availableProduction`; the focused test will assert both the new Iron-era block and preservation of a legitimately paid old queue item.

## Expected changed allowlist after edits

- `Konnica`: Brąz/Jeździectwo → Żelazo/Sztuka wojenna.
- `Jeździec chiński`: Brąz/Jeździectwo → Żelazo/Sztuka wojenna.
- `Katapulta`: Żelazo/Oblężnictwo → Żelazo/Sztuka wojenna, including its paid active-siege human/AI availability.
- No chariot data changes; all existing units remain present for save compatibility.
