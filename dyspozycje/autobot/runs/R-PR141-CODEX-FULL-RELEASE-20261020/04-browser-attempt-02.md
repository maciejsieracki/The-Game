# 04 — Predeploy browser attempt 02

Run: `R-PR141-CODEX-FULL-RELEASE-20261020`, round 1/5. Root explicitly authorized one additional predeploy attempt after the first failed run and the browser harness was revised. The product bundle remained byte-identical throughout.

## Exact inputs

- Served bundle over local HTTP: SHA-256 `234dff75036b22e423b33f9d6134428c559b612922b866399346f0e94ebfca4a`, HTTP 200, exact bytes verified.
- Browser: Chromium `/usr/bin/chromium`.
- Visible setup: Rome, Iron Age, seed 141, Egypt AI, Standard/Continents, hot-seat off.
- Exact raw report: `/workspace/pr141-publish-20261020/browser-operator/predeploy-02/report.json`, SHA-256 `b1be5b5bbb67ac1b95992494cbb066586879bc311f6ba317c8cda95646eaa41a`.

## Result

**FAIL** for the complete predeploy flow. Map lifecycle completed and the ordinary first-city click passed: `city0`, owner 0, actual hex `(125,60)`, `awaitingFirstPlayerCity=false`, active human owner 0, canvas hit. The failure screenshot shows the diplomacy audience with an enabled `Wróć` button. The harness recorded 0 successful audience dismissals and 0 lists closed, then timed out at `TIMEOUT:dismiss-audience`; the JSON counts are completed actions, not visibility counts. The timeout took 4,444 ms. No turn, save, or battle was attempted. This second attempt is terminal; no further attempt is included or implied by this report.

The exact Standard/Continents seed-141 map lifecycle took about 195,987 ms from New Game to hidden loading overlay for a 168×120 / 20,160-hex map. Its own breakdown attributed 93,676 ms to main-river generation and 95,555 ms to river fill. This is an observed timing from this one browser attempt, not a multi-seed performance conclusion or release acceptance.

Selected failure screenshot is preserved at `evidence/browser-predeploy-02/04-failure-first-city.png`; all original attempt files remain external and unchanged. The run report and screenshot are separate from product source. This result does not establish full browser/gameplay acceptance, and it does not turn the earlier failure into a pass.


## Correction to the initial operator summary

The first draft of this report incorrectly described the audience/list as not visible. The preserved screenshot `evidence/browser-predeploy-02/04-failure-first-city.png` shows the diplomacy audience and enabled `Wróć` control. The raw browser JSON is unchanged; its zero values count successful dismissals/list closures. The actual failure is that the helper did not complete dismissal before timing out, despite the visible control. This correction does not change the terminal FAIL result.
