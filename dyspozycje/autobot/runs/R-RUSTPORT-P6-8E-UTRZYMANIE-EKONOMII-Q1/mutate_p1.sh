#!/bin/bash
# Mutacje galezi sterujacych modulu economy_upkeep_p1 (turn_economy.rs). Kazda: zastosuj, testuj, przywroc.
set -u
ENG=/home/user/The-Game/.claude/worktrees/wf_0f79b3ff-a3e-1/rust-port/engine
SRC=$ENG/src/domain/turn_economy.rs
BAK=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/turn_economy.rs.bak
cp "$SRC" "$BAK"
export CARGO_INCREMENTAL=0
export CARGO_TARGET_DIR=/home/user/cargo-target-shared/wf_0f79b3ff-a3e-1
export CARGO_PROFILE_DEV_DEBUG=0
cd "$ENG" || exit 2

run_mut() {
  local name="$1" from="$2" to="$3"
  if [ -n "${ONLY:-}" ] && [[ "$name" != ${ONLY}* ]]; then return; fi
  cp "$BAK" "$SRC"
  python3 - "$SRC" "$from" "$to" <<'PY'
import sys
path, frm, to = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(path, encoding="utf-8").read()
n = s.count(frm)
if n != 1:
    print(f"MUT {name}: wzorzec wystapil {n} razy - POMINIETA")
    sys.exit(3)
open(path, "w", encoding="utf-8").write(s.replace(frm, to))
PY
  local rc=$?
  if [ $rc -ne 0 ]; then echo "MUT $name: nie zastosowano (rc=$rc)"; return; fi
  local out
  out=$(timeout 500 cargo test --test p6_8e_upkeep_p1 2>&1)
  local st=$?
  local failed
  failed=$(echo "$out" | grep -c 'FAILED\|panicked')
  if [ $st -ne 0 ]; then echo "MUT $name: ZABITA (testy padly: $failed linii FAILED/panicked) EXIT=$st"; else echo "MUT $name: PRZEZYLA (testy zielone) EXIT=$st"; fi
}

run_mut M1_clamp_zero_threshold 'if !amount.is_finite() || amount <= 0.0 {' 'if !amount.is_finite() || amount < -1.0 {'
run_mut M2_reconcile_id_tiebreak '        } else if a.id < b.id {
            Ordering::Less
        } else if a.id > b.id {' '        } else if a.id > b.id {
            Ordering::Less
        } else if a.id < b.id {'
run_mut M3_nan_comparator_less '        if diff.is_nan() {
            Ordering::Equal' '        if diff.is_nan() {
            Ordering::Less'
run_mut M4_owner_floor 'magazyn_count.floor()' 'magazyn_count'
run_mut M5_read_num_finite 'Some(RawCell::Num(v)) if v.is_finite() => *v,' 'Some(RawCell::Num(v)) => *v,'
run_mut M6_js_min_to_rust_min 'let take = js_min(have, excess);' 'let take = have.min(excess);'
run_mut M7_intake_zero_skip '            if !add.is_finite() || add == 0.0 {' '            if !add.is_finite() {'
run_mut M8_conquest_food_overflow_key 'overflow.insert("zywnosc".to_string(), food.overflow);' ''

cp "$BAK" "$SRC"
echo "RESTORED"
