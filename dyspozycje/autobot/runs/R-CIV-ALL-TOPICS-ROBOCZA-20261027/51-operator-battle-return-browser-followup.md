# AutoBot Operator — bounded large-battle return browser follow-up

**VERDICT: PASS.** The earlier run appeared stalled because the harness had no phase logging and was stopped while the playtest world was still generating. The browser remained responsive, reported generation progress, completed the map, opened and skipped the 28v28 battle, returned to a visible world map, and passed every cleanup/input/error assertion. No product runtime change was needed.

## Source identity and evidence

- Workspace: `/workspace/all-topics-candidate`; git HEAD `99bb834c6fe158d3bc59eb741f8fde9637b77027`.
- Harness `gra/tools/battle-large-return-live-test.cjs` SHA-256: `d262cb7d903ae38e68ab344bd22fc2bacf98035fcfa28f2ac892a29ed691a2b5`.
- `gra/src/main.ts` SHA-256: `9853426d44f0f9e6b34cb42323cad29508a83831c60a9186ccb6a00f94e6f68a`.
- `gra/src/battle/battleScene.ts` SHA-256: `0ba23c48bcd1088d84246ccce60d7cc11d52799a4e6b133f1a0f69b5adde7a04`.
- Temporary Vite single-file bundle SHA-256: `5b9aa9fd7c636a797794e05dfd384d7a646d48685382aa29914d7f6cc2e142b4` (70,011,714 bytes; temporary build directory was removed by harness cleanup).
- Retained evidence: [post-return screenshot](evidence/battle-return-followup/1793174914872-map-after-return.png), SHA-256 `da487bd487e107d4d74af349593fa0cea1f50f2471512ee9ba30c0ccb6b1b029`; [post-return state JSON](evidence/battle-return-followup/1793174914872-map-after-return.json), SHA-256 `415ee4bd9d8944b09872ae37651e0dbac9980f8e35e9ac2633822f47e9073307`.
- Original evidence directory: `/tmp/battle-large-return-evidence-70389-i8xl9l/`.

## Harness changes and bounded repro

The harness now prints timestamped phase boundaries, samples page readiness/canvases/overlay/debug hooks and recent browser errors, and saves JSON plus screenshots before battle, during battle, at result, after return, and on failures. Map startup has a configurable bounded wait (`BATTLE_RETURN_MAP_BOOT_MS`, default 120 seconds), 5-second progress heartbeats, and 3-second JavaScript responsiveness probes. It saves evidence on timeout instead of silently waiting up to 15 minutes.

The single repro was run with:

```sh
timeout 210s env BATTLE_RETURN_MAP_BOOT_MS=90000 node tools/battle-large-return-live-test.cjs
```

The total run took about 143 seconds including a 16.9-second build. World generation was visible and progressing: at startup it displayed step 6/10, advanced to 7/10, and removed the load overlay about 64 seconds after the map-ready wait began. That aligns with the earlier ~65-second stop. Page probes kept answering and browser errors stayed empty throughout, so this was slow startup rather than a white-screen or a frozen page.

## Result

- Before battle: world-map canvas connected, 1440×900, WebGL context alive; no load overlay.
- During battle: production preset had 28 attackers and 28 defenders; world map and battle canvases both stayed connected (four canvases including minimaps).
- Result screen: battle finished and remained visible until the actual return button was clicked.
- After return: battle canvas disconnected, world-map canvas remained connected at 1440×900, only the two map canvases remained, and the load overlay was absent. Screenshot inspection shows the world map and HUD rendered normally.
- The persistent map render counter advanced from frame 80 to 86 during the post-return wait and to 95 after input. Mouse wheel changed camera distance from 24 to 21.12.
- Battle context reported lost after disposal; persistent map context remained alive.
- Page errors, console errors, and failed requests: none. All six harness assertions passed, including post-return camera input and no browser errors.

No product files were edited for this follow-up. Validation covered one real Chromium/Playwright 28v28 run on the synthetic `?playtest=mapa` fixture; it does not establish startup timing for all hardware, maps, or world-generation settings. `git diff --check` passed.
