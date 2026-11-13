# 21-operator-response — R-WEB-ARMY-SPLIT-GRAPHICAL-HEX-PICKER-Q1

FEEDBACK: Root visual review observed that the first screenshots still printed `(q,r)` in every neighbor and in the source cell. That made coordinates part of the primary picker despite the graphical-picker requirement.

CHANGE: Accepted. In graphical mode, neighbor cells now show direction, terrain, and relevant overlay/reason without coordinate text; the center shows `ARMIA`, unit count, and city marker where applicable. The panel subtitle also omits source coordinates. Internal destination coordinates and the `onSplit(ids,q,r)` callback remain unchanged. Legacy mode without the six-neighbor adapter retains its coordinate source header and visible coordinate destination controls; only graphical mode suppresses them.

VALIDATION: Added a focused assertion that visible graphical cell text has no `(q,r)` labels, while the existing six direction assertions continue to verify the exact `q,r` values passed to `onSplit`. After the D-FOG browser lock was released, reran the focused test on `/usr/bin/chromium`: 14 PASS, 0 FAIL. Refreshed normal and 150%-equivalent captures are in `evidence/`; the first-iteration screenshots are retained with `r1` names and are explicitly superseded. Hashes and base readbacks are recorded in `evidence/readback.md`.
