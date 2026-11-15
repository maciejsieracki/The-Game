import sys
f, n = sys.argv[1], sys.argv[2]
s = open(f).read()
M = {
 "M1": ("let mut v = battle_units_for_map_export(input.atk)?;\n            v.extend(battle_units_for_map_export(input.def)?);",
        "let mut v = battle_units_for_map_export(input.def)?;\n            v.extend(battle_units_for_map_export(input.atk)?);"),
 "M2": (".map(EndPath::end_winner)\n        .unwrap_or(input.screen_winner);", ".map(|_| input.screen_winner)\n        .unwrap_or(input.screen_winner);"),
 "M3": ("Some(wall_ever_breached)\n", "Some(false && wall_ever_breached)\n"),
 "M4": (".filter(|u| u.hp > 0.0 && (!u.dead || u.routed))", ".filter(|u| u.hp >= 0.0 && (!u.dead || u.routed))"),
}
a, b = M[n]
assert s.count(a) == 1, n
open(f, "w").write(s.replace(a, b))
