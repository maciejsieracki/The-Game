# Graphical picker browser evidence — corrected visual iteration

- Initial task base readback: `4bd9b522aae2a2ed0c770965f5eeaacc7d6eeb8d` (`HEAD=origin/main` before parallel integrations advanced the shared branch).
- Final screenshot/test run shared-tree readback: `HEAD=98e0ad9e93a14d37f192725fadb5a69900d34bd8`; `origin/main=39e24b65c470964cebb84bbb574747a6321c67ea`.
- The commits added to the shared tree after initial work were unrelated. `git diff --name-only 4bd9b522aae2a2ed0c770965f5eeaacc7d6eeb8d..HEAD -- gra/src/main.ts gra/src/ui/armySplitPanel.ts gra/tools/army-split-graphical-hex-picker-test.cjs` and the corresponding `origin/main` command returned no paths.
- Browser: `/usr/bin/chromium`, Playwright, headless.
- Final normal screenshot: `army-split-picker-1280x800.png` (1280×800).
- Final 150% equivalent screenshot: `army-split-picker-150-percent-equivalent.png` (853×533 CSS viewport, matching 1280×800 at 150% zoom).
- Corrected focused run log: `graphical-picker-test.log` — 14 PASS, 0 FAIL, including visible graphical text without coordinates, exact direction-to-q/r callbacks, source city, unavailable terrain reason, 150% equivalent fit, narrow viewport fit, and keyboard focus.
- Existing scroll-grid test was already run after the earlier compatibility edit: 15 PASS, 0 FAIL. The corrected visual change affects only the graphical mode and did not change the legacy path.
- First iteration screenshots with visible coordinates are preserved as `army-split-picker-r1-1280x800-with-coordinates.png` and `army-split-picker-r1-150-percent-equivalent-with-coordinates.png`; they are historical and superseded by the final screenshots above.

SHA-256 final evidence:
- 1280×800: `065117e78d347ecc51e6a3151909fd8e392d11d4d19552b07837b3e2fab0dec2`
- 150% equivalent: `ac272207de98102593a08e810d9533f56c45e2a0b727cfb0252b2d47a4dd9888`
- Corrected focused log: `6aaad9b47ba480a520d57a68f1598d31e0fd21744f53387ee99750fa97b17136`
