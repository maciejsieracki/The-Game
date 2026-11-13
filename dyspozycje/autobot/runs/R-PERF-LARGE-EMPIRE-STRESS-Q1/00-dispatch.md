# AutoBot dispatch — late-game performance stress

## Objective
Run the requested large-imperium scenario (player with 40 cities, six AI civilizations with at least 15 cities each, terrain improvements and developed cities) against the deployed ROBOCZA source, then inspect turn-time, renderer activity, heap, DOM, and process RSS.

## Scope and constraints
- Baseline source: deployed `origin/main` commit `a1d8621290d107adc3ece82978d64aa6b7c4c0dc`.
- This is a diagnostic run only; no production-source changes are made by this run.
- Do not interpret headless SwiftShader CPU/FPS as equivalent to the user's Windows GPU.
- Distinguish app JS heap, Chromium process RSS, and the test harness process.
- Record incomplete runs as incomplete; do not claim a completed 100-turn test unless all requested turns finish.
