#!/usr/bin/env bash
# R-RUSTPORT-P4-1H-MOVE-MODEL-Q4 r2 (obrona): mutacje, ktore MUSZA dac FAIL testu p4_1h_move_model.
# Uruchamiac z katalogu rust-port/engine. Kazda mutacja jest cofana z kopii zapasowej.
# Wymaga: CARGO_TARGET_DIR poza repo.
set -u
B="$(mktemp -d)"
F=(src/domain/playable_movement.rs src/domain/playable.rs src/domain/save_load.rs)
cp "${F[@]}" "$B/"
restore() { cp "$B/playable_movement.rs" "$B/playable.rs" "$B/save_load.rs" src/domain/; }
run() {
  echo "== $1"
  timeout 580 cargo test --test p4_1h_move_model 2>&1 | grep -E "test result|^test .*FAILED|^error" || true
  restore
}
mut() { python3 - "$1" "$2" "$3" <<'EOF'
import sys
p, old, new = sys.argv[1], sys.argv[2], sys.argv[3]
s = open(p).read()
assert s.count(old) == 1, ("brak dopasowania", p, old)
open(p, "w").write(s.replace(old, new))
EOF
}

mut src/domain/playable_movement.rs \
"        PlayableTerrain::Hills => (TerenBazowy::Wzgorza, false),
        PlayableTerrain::Forest => (TerenBazowy::Rownina, true),
        PlayableTerrain::Water => (TerenBazowy::Morze, false)," \
"        PlayableTerrain::Hills => (TerenBazowy::Rownina, false),
        PlayableTerrain::Forest => (TerenBazowy::Rownina, false),
        PlayableTerrain::Water => (TerenBazowy::Rownina, false),"
run "M1 koszt terenu = 1 zawsze"

mut src/domain/playable_movement.rs \
"    let mut occ = build_move_occupancy(&units, mover_owner_id, &except_refs);" \
"    let mut occ = build_move_occupancy(&units, mover_owner_id, &except_refs);
    occ.pass_through.clear();"
run "M2 pominiecie passThrough"

mut src/domain/playable.rs \
"        self.state.moved_by_player_this_turn.clear();
        for unit" \
"        for unit"
run "M3 brak czyszczenia moved_by_player_this_turn w advance_turn"

mut src/domain/save_load.rs \
"    state.moved_by_player_this_turn.clear();
" ""
run "M4 brak czyszczenia moved_by_player_this_turn przy wczytaniu"

mut src/domain/playable_movement.rs \
"        occ.pass_through.remove(&key);" ""
run "M5 heks obcego miasta nie usuwany z passThrough"

mut src/domain/playable.rs \
"        self.state.mark_player_moved_unit(moved_id);" \
"        let _ = moved_id;"
run "M6 brak markPlayerMovedUnit w move_unit"

rm -rf "$B"
