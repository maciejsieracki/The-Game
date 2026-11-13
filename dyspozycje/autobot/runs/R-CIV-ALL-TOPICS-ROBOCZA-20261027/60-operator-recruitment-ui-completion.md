# AutoBot Operator — recruitment and army UI completion

**Result: PASS-WITH-NOTES.** The current recruitment and merge interfaces pass their focused Chromium checks. Two browser harnesses had stale assumptions about the available roster and a fixed Chromium install path; I made their tests portable and aligned their assertions to the current 12-card fixture. No product UI source was changed in this round.

## Scope and source identity

- Candidate: `/workspace/all-topics-candidate`, HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`; validation applies to the uncommitted working tree.
- The Army screen uses the shared city recruitment renderer and per-city mounts; no unit dropdown remains.
- Recruitment counts, quantity controls, batch preflight, current/prior-era and Barracks gates, era-change refresh, and merge panel layout were checked against the working tree.
- Relevant source SHA-256:
  - `gra/src/ui/cityPanel.ts`: `f4a74708c3ee7bf1880140297cee8caff2fb5a204a7ec45853e091f9fc464f0d`
  - `gra/src/ui/unitRecruitCard.ts`: `ee94931f506303e6d5c5befb9ac0dff49e661b500bd470a7fccc72ca74269806`
  - `gra/src/ui/armyMergePanel.ts`: `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb`
  - `gra/src/ui/hud.ts`: `7007363bfa2a279c11e40b8c4a35028bc00a5838bd4f94e374c32f22f3c5f219`
  - `gra/src/ui/recruitHudLabel.ts`: `082108775b898d4b50c559c2cbf4b55206c0185dd2dc926effef182fcfd52911`
  - `gra/src/game/production.ts`: `f382de35b3262c301b51ac0319540e96f8f65bf2908c9a4e29626ea24a9a2361`

## Checks

All checks below passed on the current source:

- `node tools/empire-mass-recruitment-test.cjs` — **21/21**; real Chromium renders shared recruitment cards under each city and checks atomic resource/manpower preflight.
- `node tools/recruit-card-quantity-real-render-test.cjs` — **25/25**; mouse/keyboard quantity selection, max/min, delayed resource deduction, batch submit, and disabled cards.
- `node tools/recruit-list-visibility-ui-test.cjs` — **15/15**; unavailable units remain visible with a disabled state and missing-resource reason.
- `node tools/hud-armia-chip-jednostki-test.cjs` — **60/60**; Manpower HUD and empire panel calculate recruitable full-unit counts from the shared cost function.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **21/21**; Chromium verifies 16/40-unit rosters, three columns, a scrollable list, visible fixed merge/separate controls, and no horizontal overflow at `900x620`.
- `node tools/recruitment-panel-height-real-render-test.cjs --no-shots` — **13/13**; small and large viewport heights, one active list scrollbar, rows staying in the panel, and negative control.
- `node tools/recruitment-panel-compact-row-test.cjs --no-shots` — **39/39**; 340/307/280px panel widths, compact rows, manpower shortfall labels/tooltips, and negative control.
- `node tools/era-recruit-panel-refresh-test.cjs` — **4/4**; entering Bronze refreshes an open recruit panel, keeps Stone units, and preserves Bronze Barracks gating.
- `node tools/koszary-gate-test.cjs` — **26/26**; Stone/Bronze/Iron availability, Barracks, replacement gate, and Ox Chariot after Wheel.
- `npm run typecheck -- --pretty false` and `git diff --check` — **PASS**.

## Test-harness corrections

`recruitment-panel-height-real-render-test.cjs` and `recruitment-panel-compact-row-test.cjs` previously fell back only to a Chromium path absent in this environment. They now select an installed executable from `CHROME_PATH`, the prior packaged path, `/usr/bin/chromium`, or `/usr/bin/chromium-browser`. The compact-row test expected at least thirteen live cards and twelve manpower shortfalls, but its current Iron-era fixture renders twelve legal cards, one of which has no manpower requirement. Assertions now validate all twelve cards and every actual shortfall instead of a stale roster count.

## Limits

The merge-panel test now includes a separate Chromium run at a `600x413` CSS viewport with device scale factor `1.5`, corresponding to a `900x620` physical viewport at 150% scale; it does not change Chromium's desktop zoom menu. The era-change refresh test calls the production availability getter through the panel refresh seam rather than replaying technology research in a full game. No product defect was found in this scope. No commit, push, merge, or deploy was performed.
