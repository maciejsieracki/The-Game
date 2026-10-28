# AutoBot Final Control — ROBOCZA current candidate

**Decision: READY_FOR_DEPLOY_WITH_NOTES.** I independently checked the exact staged bundle, manifest, hub, source fingerprints, and the operator/evaluator evidence. The user explicitly leaves only the large-empire performance gate for later; I excluded that gate from this release decision. No other non-performance issue blocks the Robocza package.

## Exact artifact

- Candidate parent: `origin/main` / HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`; product and Robocza release files are still uncommitted.
- Bundle: `gra-robocza/Gra-ROBOCZA.html`
- MD5: `b897f519a377631081bd29b49c76fef2`
- SHA-256: `accb2ee99c74ba7bbc70da060ed62fabf905cf2f021d6e37bacad4a9398ed798`
- Size: `70,011,909` bytes.
- `node gra/tools/verify-robocza-bundle.cjs`: **VERIFY OK**; file, manifest top-level digest, and `bundles[]` digest/size agree.
- START hub metadata points to the same bundle and short MD5.
- The embedded self-MD5 stamp reports a different digest (`b8c1e030…`) because the bundle contains the hash it attempts to display. The verifier reports this as its documented nonfatal stamp warning; the actual file and manifest hashes agree exactly.

## Build and exact-package smoke

- Fresh `npm run typecheck -- --pretty false`: **PASS**.
- Fresh `npm run build`: **PASS**, 914 modules.
- `CIV_SMOKE_HTML=dist/index.html node tools/smoke.cjs`: **SMOKE OK**.
- Exact staged bundle served locally over HTTP: **200**, title “The Game — 4X”, two connected canvases, menu and HUD visible, stamp visible, no page errors or console errors. Chromium was configured to return 204 for the absent optional favicon.

## Topic and independent-review evidence

The exact source fingerprints I checked match the recorded operator/evaluator reports:

- AI war campaign owner-0 fix: `main.ts` `4a152bd0…`; helper `ai-general-war-campaign.ts` `8b1f394c…`. Evaluator report 62 is **PASS**. Campaign regression is 25/25 and bounded Chromium replay is 16/16, covering a human owner-0 target, physical leader recruitment/spawn, five muster turns, sixth-turn attack order, and campaign save-metadata roundtrip.
- Battle and leadership: `battleScene.ts` `0ba23c48…`; leadership helper `c5954833…`. Operator report 61 and earlier evaluator 52 cover shared Wódz/Generał rout, death, morale, manual-control gating, formation rules, and a 28v28 rendered battle return without browser errors.
- Recruitment UI: `armyMergePanel.ts` `9deab30d…`; panel checks pass at the 150%-equivalent viewport with 40 units, fixed/clickable actions, and reachable final row (24/24).
- Economy, food, costs, music, and Manpower: operator report 60 records the fresh focused suites, including Mint 61/61, route HUD 63/63, route income 131/131, building epoch costs 20/20, citizen food 34/34, population wiring 122/122, music 7/7, and Manpower 60/60.
- AI era improvements, unit promotion/Chariot, Barracks gates, and era panel refresh: report 60 records all focused suites green.
- Wars, peace locks, and capture execution: report 23 plus the later live campaign evidence record 50/56/58 multi-era war suites and 21/21 capture integration.

The only source/test correction found during these closeouts was stale population-growth test fixture data; it changed tests, not product behavior. The exact AI owner-0 defects found by the live replay were fixed and independently evaluated.

## Notes and explicitly excluded gate

- The full large-empire run remains unresolved: Chromium closed at turn 47. This is the sole release exception explicitly requested by the user; this decision does not claim the performance gate passed.
- Battle-return proof uses a synthetic 28v28 map with software WebGL and does not recreate the user’s exact long campaign save/GPU.
- Era-panel refresh has focused production-getter coverage, not a full research-to-open-panel browser replay. No defect was found.
- No independent hosted-site verification applies: Robocza is published as the GitHub repository bundle, per the user’s clarification.

**Final Control result: READY_FOR_DEPLOY_WITH_NOTES** for the exact bundle above, with large-empire performance excluded. This report does not itself publish, commit, or push.
