#!/bin/bash
# R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — comparison sheets (Chromium | Rust | |difference|x4, x3 scale)
# for a selection of scenes. Usage: 09-sheets.sh <dir with Rust textures from LABELS_DUMP=<dir>>
set -eu
D="$(cd "$(dirname "$0")" && pwd)"
R="$D/../../../../../rust-port/renderer/tests/fixtures/labels"
DUMP="${1:?LABELS_DUMP directory}"
mkdir -p "$D/png"
while read -r scene; do
  line=$(grep -P "^scene\t$scene\t" "$R/scenes.tsv")
  w=$(echo "$line" | cut -f4); h=$(echo "$line" | cut -f5); dsf=$(echo "$line" | cut -f7)
  W=$((w * dsf)); H=$((h * dsf))
  python3 "$D/09-sheet.py" "$D/png/$scene.png" "$W" "$H" "$R/ref/$scene.rgba" "$DUMP/$scene.rgba"
  echo "$scene ${W}x${H} -> png/$scene.png"
done <<'EOF'
r4_valid_00
r4_invalid_road_reason
r5_3
r5_dsf2
r15a_23
r15b_breach
float_r15b_p050
EOF
