#!/bin/bash
# Mutacje galezi sterujacych modulu economy_upkeep_p2 (turn_economy.rs). Kazda: zastosuj, testuj, przywroc.
set -u
ENG=/home/user/The-Game/.claude/worktrees/wf_0f79b3ff-a3e-1/rust-port/engine
SRC=$ENG/src/domain/turn_economy.rs
BAK=/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/turn_economy_p2.rs.bak
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
    print(f"MUT wzorzec wystapil {n} razy - POMINIETA")
    sys.exit(3)
open(path, "w", encoding="utf-8").write(s.replace(frm, to))
PY
  local rc=$?
  if [ $rc -ne 0 ]; then echo "MUT $name: nie zastosowano (rc=$rc)"; return; fi
  local out
  out=$(timeout 500 cargo test --test p6_8e_upkeep_p2 2>&1)
  local st=$?
  local failed
  failed=$(echo "$out" | grep -c 'FAILED\|panicked')
  if [ $st -ne 0 ]; then echo "MUT $name: ZABITA (linii FAILED/panicked: $failed) EXIT=$st"; else echo "MUT $name: PRZEZYLA (testy zielone) EXIT=$st"; fi
}

run_mut M9_unit_upkeep_zero_category '    if by_cat == Some(0.0) {
            return 0.0;
        }' ''
run_mut M10_camping_ratio '        if unit.camping {' '        if false {'
run_mut M11_fala2_floor '        let fala2_upkeep = (raw * r_stawki_fala2_mult()).floor();' '        let fala2_upkeep = (raw * r_stawki_fala2_mult());'
run_mut M12_hint_inverted '        if can_afford_unit_recruit_stock(pool, unit) {
            None' '        if !can_afford_unit_recruit_stock(pool, unit) {
            None'
run_mut M13_table_prefix 'UnitCell::Num(v) if k.starts_with("Utrzymanie") && v.is_finite()' 'UnitCell::Num(v) if k.starts_with("Utrzymanie (") && v.is_finite()'
run_mut M14_food_fallback_null '            None | Some(UnitCell::Null) => row_cell(row, "zywnosc/ture"),' '            None => row_cell(row, "zywnosc/ture"),'
run_mut M15_or_one_removed '        let ratio = p.zywnosc_jednostka_oboz / or_one(p.zywnosc_jednostka_ruch);' '        let ratio = p.zywnosc_jednostka_oboz / p.zywnosc_jednostka_ruch;'
run_mut M16_deficit_le '            deficyt: saldo < 0.0,' '            deficyt: saldo <= 0.0,'
run_mut M17_reserve_turns_branch '        if turns == 1.0 {
            return upkeep;' '        if turns == 2.0 {
            return upkeep;'
run_mut M18_building_resource_gt '                if x.is_finite() && *x > 0.0 {
                    out.insert' '                if x.is_finite() {
                    out.insert'
run_mut M19_upkeep_level_clamp '        let lvl = if level >= 1.0 { level } else { 1.0 };' '        let lvl = level;'
run_mut M20_unit_food_owntrerr '        let own = unit.on_own_territory.unwrap_or(true);' '        let own = unit.on_own_territory.unwrap_or(false);'

cp "$BAK" "$SRC"
echo "RESTORED"
