#!/bin/bash
# Mutacje P4-1I1B: kazda musi dac FAIL testu p4_1i1b_battle_instant.
# Uzycie: mut-p4-1i1b.sh <katalog rust-port/engine> <katalog roboczy poza repo>
E=${1:?katalog rust-port/engine}
W=${2:?katalog roboczy}
HERE=$(cd "$(dirname "$0")" && pwd)
cd "$E" || exit 2
mkdir -p "$W"
for f in src/domain/siege_tactics_instant.rs src/domain/siege_tactics_outcome.rs; do cp "$f" "$W/$(basename "$f").bak"; done
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0 CARGO_TARGET_DIR="$W/tgt"
restore() { for f in src/domain/siege_tactics_instant.rs src/domain/siege_tactics_outcome.rs; do cp "$W/$(basename "$f").bak" "$f"; done; }
for m in M1 M2 M3 M4 M5 M6 M7 M8 M9; do
  restore
  python3 "$HERE/mut-p4-1i1b.py" "$E" "$m" >/dev/null || { echo "$m APPLY-FAIL"; continue; }
  out=$(cargo test --test p4_1i1b_battle_instant 2>&1)
  rc=$?
  echo "$m rc=$rc $(echo "$out" | grep -E '^test result')"
  echo "$out" | grep -E '^test .* FAILED$' | sed "s/^/  $m /"
done
restore
cargo test --test p4_1i1b_battle_instant 2>&1 | grep -E '^test result' | sed 's/^/RESTORED /'
