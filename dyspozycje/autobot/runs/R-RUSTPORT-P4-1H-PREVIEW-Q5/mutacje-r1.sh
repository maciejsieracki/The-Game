#!/usr/bin/env bash
# R-RUSTPORT-P4-1H-PREVIEW-Q5 r1: mutacje kodu preview_path. Kazda mutacja MUSI dac FAIL
# `cargo test --test p4_1h_preview_path`. Uruchamiac z katalogu glownego repo; CARGO_TARGET_DIR poza repo.
set -u
ROOT="$(git rev-parse --show-toplevel)"
F="$ROOT/rust-port/engine/src/domain/playable_movement.rs"
cd "$ROOT/rust-port/engine" || exit 2
export CARGO_INCREMENTAL=0 CARGO_PROFILE_DEV_DEBUG=0 CARGO_PROFILE_TEST_DEBUG=0
cp "$F" "$F.orig"
run() {
  local name="$1" old="$2" new="$3"
  cp "$F.orig" "$F"
  python3 - "$F" "$old" "$new" <<'PY'
import sys
p, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
assert s.count(old) == 1, ("brak/wiele dopasowan", old)
open(p, "w").write(s.replace(old, new))
PY
  if cargo test --test p4_1h_preview_path >/dev/null 2>&1; then
    echo "MUTACJA $name: PASS (ZLE - mutant przezyl)"
  else
    echo "MUTACJA $name: FAIL (dobrze)"
  fi
}
run "a-budget-some" "let budget: Option<f64> = None;" "let budget: Option<f64> = Some(mover.ruch_left);"
run "b-bez-turn-stops" "Some(PathRouteDto { hexes, turn_stops })" "{ let _ = turn_stops; Some(PathRouteDto { hexes, turn_stops: Vec::new() }) }"
run "c-zapis-planu" "pub fn preview_path(
    state: &PlayableState," "pub fn preview_path(
    state: &mut PlayableState,"
run "d-plan-ignorowany" "    if let Some(plan) = state.planned_marches.iter().find(|p| p.unit_id == unit_id) {" "    if let Some(plan) = state.planned_marches.iter().find(|p| p.unit_id == unit_id && destination.is_none()) {"
run "e-bez-heksa-jednostki" "    hexes.push(HexCoord::new(uq, ur));" "    let _ = (uq, ur);"
run "f-per-turn-z-ruch-left" "    1.0_f64.max(unit.ruch)" "    1.0_f64.max(unit.ruch_left)"
run "g-stos-pusta-pula" "    let pooled = if stack.is_empty() {
        0.0" "    let pooled = if true {
        0.0"
cp "$F.orig" "$F" && rm -f "$F.orig"
