#!/bin/bash
# R-RUSTPORT-P4-34-ANCHORS-DOM-Q1 — the label tests with full tables (--nocapture), release.
cd "$(dirname "$0")/../../../../../rust-port/renderer" || exit 1
echo '$ cargo test --locked --release --lib labels -- --nocapture'
cargo test --locked --release --lib labels -- --nocapture 2>&1 | grep -vE '^\s+(Compiling|Finished|Running|Blocking)'; echo "EXIT=${PIPESTATUS[0]}"
for t in labels_layout labels_anchors labels_scenes; do
  echo; echo "\$ cargo test --locked --release --test $t -- --nocapture --test-threads=1"
  cargo test --locked --release --test $t -- --nocapture --test-threads=1 2>&1 | grep -vE '^\s+(Compiling|Finished|Running|Blocking)'; echo "EXIT=${PIPESTATUS[0]}"
done
