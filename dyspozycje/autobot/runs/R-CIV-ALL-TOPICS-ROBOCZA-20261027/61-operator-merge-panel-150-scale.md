# AutoBot Operator — army merge panel at 150% effective viewport scale

**Result: PASS.** Added a bounded Chromium case to the existing merge-panel real-render harness. The new case uses `deviceScaleFactor: 1.5` and a `600x413` CSS viewport, equivalent to `900x620` physical pixels at 150% scaling. With 40 existing units, the list scrolls to its last unit while both fixed actions remain visible; a mouse click on “Połącz armie” invokes the callback and closes the panel.

## Identity and evidence

- Base HEAD: `99bb834c6fe158d3bc59eb741f8fde9637b77027`; dirty candidate worktree.
- No product source change.
- `gra/src/ui/armyMergePanel.ts`: `9deab30da44906eafa0411509773f705f041f6df5c2c44a8391dfff192e23ccb`.
- `gra/tools/army-merge-panel-scroll-real-render-test.cjs`: `ef261fa968774c870dc63f34634040d50477336ec0c0d37e8e5076a52a766cc4`.
- `node tools/army-merge-panel-scroll-real-render-test.cjs` — **24 passed, 0 failed**. New assertions verify device scale and effective CSS viewport, fixed CTA visibility and list reachability with 40 units, and actual merge-button click behavior at that scale.
- `npm run typecheck -- --pretty false` — **PASS**.
- `git diff --check` — **PASS**.

The scale is emulated using Chromium's verifiable device scale factor plus the correspondingly reduced CSS viewport, not by changing the desktop browser's zoom menu. At maximum scroll Chromium rounded the final grid extent such that the last card was clipped by a few CSS pixels; the test scrolls to within 10 px of the bottom, where the final card is fully visible and both actions remain fixed. This confirms ordinary user scrolling reaches the final item without changing the panel implementation.

No commit, push, merge, or deploy was performed.
