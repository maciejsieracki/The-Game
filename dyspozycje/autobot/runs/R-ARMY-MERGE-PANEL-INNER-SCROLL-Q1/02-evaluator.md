# Independent Evaluator — R-ARMY-MERGE-PANEL-INNER-SCROLL-Q1

Verdict: **PASS**, no blocking issue.

Source review confirms 24 px overlay padding, a viewport-bounded flex panel (`vh`/`dvh`), hidden outer overflow, and `.civ-amp-body` as the sole scroll region. Header, result and footer stay outside the scrolling body.

The expanded real Chromium test checks 54 rendered rows at 900×620 and at 600×413 CSS px / DPR 1.5, reaches the final existing and arriving rows, verifies 28.24 px top and 27.95 px bottom gaps, and exercises mouse callbacks for merge and separate, including merge at 150%.

Scope note: callbacks use a fixture counter, so this proves the panel invokes its unchanged `onMerge` contract; it does not exercise a full game transaction. No product merge logic changed.
