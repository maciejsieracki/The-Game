# Final control — R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1

**Wynik: PASS WITH NOTES** for live UI entry and visibility in the recorded `Testpolis` fixture. This control does not establish recruitment execution, a full campaign, the user's device/session, or an exact published bundle.

## Evidence reviewed

- `evidence/live-http-chromium.json` records the HTTP URL, one visible aggregate HUD entry, 12 aggregate unit rows with quantity `0`, two disabled `Rekrutuj wszystkie` buttons, the manpower HUD entry, a mounted Armia list for `Testpolis`, and `errors: []`.
- `evidence/01-hud-empire-recruit-panel.png` visibly shows the `REKRUTACJA` HUD entry, aggregate panel, 12 rows at zero, and disabled bulk action. `evidence/02-empire-army-recruitment-list.png` shows the separate Armia panel and `Testpolis` unit catalogue.
- `evidence/live-http-chromium.cjs` reproduces the browser route and captures both screens. It verifies presence, non-empty rows, zero quantities, two bulk controls, and mounted city-list content. It records the disabled state and row count but does not assert either value, so the saved JSON and screenshots are direct evidence for those two details.
- The referenced `evidence/live-http-chromium.log` exists in this worktree and duplicates the JSON receipt. The evaluator note saying that log is missing is stale and should not be carried forward.
- Source wiring agrees with the observed paths: `gra/src/ui/hud.ts` creates the aggregate button only when `!mapChromeSuppressed`; `gra/src/main.ts` connects it to `toggleEmpireRecruitFromHud()`. The Armia city catalogue is reached separately through the manpower chip. Thus suppression of map chrome explains why the aggregate button is absent in city view; it does not establish which view or build the user had open.

## Provenance and limits

The README documents a Vite production build in `/dev/shm/empire-recruit-live-187`, served over HTTP at `127.0.0.1:18787`, then opened in system Chromium. The saved receipt and screenshots are consistent with that route. The run does not retain a build log, build manifest, bundle hash, or source revision tied to that bundle, so the evidence cannot identify an exact published/deployed bundle.

At control time, the shared worktree contains unrelated uncommitted Haamonga/CivPedia changes, including `gra/src/data/wikiBundle.json`. The recruitment HUD source files are clean relative to `HEAD`; this supports the UI wiring review but does not retroactively prove which exact tree produced the saved build. Describe the result as a production-mode HTTP build run from the documented worktree, not as proof of a specific published release.

The browser script does not click a recruitment action or verify an order, resource deduction, or resulting unit. Its zero-quantity aggregate state intentionally leaves both bulk buttons disabled. The evidence establishes UI visibility and catalogue mounting only. No browser rerun was needed for this control because the saved JSON, script, and screenshots jointly cover the requested observation; the original build-to-source association remains undocumented.

## Disposition

Accept the evidence for visibility and correct entry-path explanation in the recorded fixture, with the provenance and scope limits above. No product change or deployment is indicated. This file is the only final-control artifact added for this run.
