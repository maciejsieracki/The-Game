# R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1 — live verification

Read-only verification of the already merged recruitment UI (FALA 576/587). No product code changed.

## Reproduction

From `gra/`, build the production app outside the repository and serve it over HTTP:

```sh
node ./node_modules/vite/bin/vite.js build --outDir /dev/shm/empire-recruit-live-187 --emptyOutDir
: > /dev/shm/empire-recruit-live-187/favicon.ico
python3 -m http.server 18787 --directory /dev/shm/empire-recruit-live-187 --bind 127.0.0.1
```

In another shell from the repository root, run the real system Chromium route test:

```sh
node dyspozycje/autobot/runs/R-WEB-UI-EMPIRE-RECRUIT-PANEL-RECRUIT-ALL-LIVE-VERIFY-Q1/evidence/live-http-chromium.cjs
```

The browser loads `http://127.0.0.1:18787/index.html?playtest=mapa&civTest=1`; it does not use `file://`. The empty favicon in the temporary build directory avoids unrelated 404 console messages. The test starts one Chromium instance and performs both checks in sequence.

## Result

PASS. HTTP production build loaded in `/usr/bin/chromium` with zero page, console, or failed-request errors. The visible top HUD `Rekrutacja` button opened `#civ-empire-recruit-panel`; the real panel contained 12 military types, each quantity was `0`, and its top and bottom `Rekrutuj wszystkie` buttons were both disabled. The test then clicked the HUD manpower/recruiter chip, which opened Empire details at Armia, and confirmed the per-city recruitment list mounted for `Testpolis` with live unit cards.

The screenshot [01-hud-empire-recruit-panel.png](evidence/01-hud-empire-recruit-panel.png) shows the HUD entry and aggregate panel. [02-empire-army-recruitment-list.png](evidence/02-empire-army-recruitment-list.png) shows the Armia per-city catalogue. Exact DOM receipt is [live-http-chromium.json](evidence/live-http-chromium.json); the reproducible test is [live-http-chromium.cjs](evidence/live-http-chromium.cjs), with stdout in [live-http-chromium.log](evidence/live-http-chromium.log).

## Missing-button path

The aggregate entry is the top-right HUD button labelled `REKRUTACJA`; it opens the all-civilization panel. The Armia section reached through the HUD manpower chip contains separate per-city recruitment cards. The aggregate button is intentionally omitted whenever `mapChromeSuppressed` is true (`gra/src/ui/hud.ts`, `recruitBtn` condition), which is the city-view presentation; return to the world-map HUD to use the aggregate entry. The callback is wired from `gra/src/main.ts` to `toggleEmpireRecruitFromHud()` and `toggleEmpireRecruitPanel(...)`. This was reproduced against the live production build: the world-map HUD entry was visible and functional, and the Armia catalog mounted after the manpower-chip click.
