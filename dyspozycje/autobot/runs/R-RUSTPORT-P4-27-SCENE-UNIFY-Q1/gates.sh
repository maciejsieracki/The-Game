#!/usr/bin/env bash
# Gates of R-RUSTPORT-P4-27-SCENE-UNIFY-Q1: raw logs into ./logi/.
# Usage (from the repository root): bash dyspozycje/autobot/runs/R-RUSTPORT-P4-27-SCENE-UNIFY-Q1/gates.sh [mutate]
set -u
RUN="$(cd "$(dirname "$0")" && pwd)"
L="$RUN/logi"
mkdir -p "$L"
cd "$RUN/../../../../rust-port/renderer" || exit 2
run() {
  local out="$1"; shift
  { echo "\$ $*; echo \"EXIT=\$?\""; "$@" 2>&1; echo "EXIT=$?"; } > "$L/$out"
}
if [ "${1:-}" = "mutate" ]; then
  run mutate.txt python3 "$RUN/mutate.py"
  tail -n3 "$L"/mutate.txt
  exit 0
fi
run fmt.txt cargo fmt --all -- --check
run clippy.txt cargo clippy --locked --all-targets -- -D warnings
run clippy-gpu.txt cargo clippy --locked --all-targets --features gpu -- -D warnings
run test.txt cargo test --locked --all-targets
run test-nocapture.txt cargo test --locked --all-targets -- --nocapture
run fixtures-unchanged.txt git diff --stat --exit-code 9ec9c9d8 -- tests/fixtures
tail -n1 "$L"/fmt.txt "$L"/clippy.txt "$L"/clippy-gpu.txt "$L"/test.txt "$L"/test-nocapture.txt "$L"/fixtures-unchanged.txt
