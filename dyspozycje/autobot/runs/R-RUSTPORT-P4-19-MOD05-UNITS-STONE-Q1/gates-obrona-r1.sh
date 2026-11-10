#!/usr/bin/env bash
# Gates of the Operator defence round 1 (R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1):
# raw logs into ./logi/obrona-r1/ (Operator round-1 logs in ./logi/ stay untouched).
# Usage (from the repository root): bash dyspozycje/autobot/runs/R-RUSTPORT-P4-19-MOD05-UNITS-STONE-Q1/gates-obrona-r1.sh
set -u
RUN="$(cd "$(dirname "$0")" && pwd)"
L="$RUN/logi/obrona-r1"
mkdir -p "$L"
cd "$RUN/../../../../rust-port/renderer" || exit 2
run() {
  local out="$1"; shift
  { echo "\$ $*"; "$@" 2>&1; echo "EXIT=$?"; } > "$L/$out"
}
run fmt.txt cargo fmt --all -- --check
run clippy.txt cargo clippy --locked --all-targets -- -D warnings
run clippy-gpu.txt cargo clippy --locked --all-targets --features gpu -- -D warnings
run test.txt cargo test --locked --all-targets -- --nocapture
(cd tests/fixtures/units_kamien && sha256sum -c units_kamien.json.sha256) > "$L/sha256.txt" 2>&1; echo "EXIT=$?" >> "$L/sha256.txt"
tail -n1 "$L"/*.txt
