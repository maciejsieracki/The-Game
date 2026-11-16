"""Mutacje P4-1I1B: python3 mut-p4-1i1b.py <katalog rust-port/engine> <ID>; kazda musi dac FAIL testu p4_1i1b_battle_instant."""
import sys

root, n = sys.argv[1], sys.argv[2]
INST = "src/domain/siege_tactics_instant.rs"
OUT = "src/domain/siege_tactics_outcome.rs"
M = {
    # Dispatch: odwrocenie `hpA >= hpD` na `>` (:20587).
    "M1": (INST, "if hp_a >= hp_d {", "if hp_a > hp_d {"),
    # Dispatch: pominiecie `defOnWall` (:20466).
    "M2": (INST, "let def_on_wall = d.on_wall_walkway;", "let def_on_wall = false && d.on_wall_walkway;"),
    # Dispatch: usuniecie `wallBreached` przy machinie (:3720-3722).
    "M3": (INST, "if siege_wall_col >= 0.0 && attacker_has_live_siege_unit(atk) {",
           "if false && siege_wall_col >= 0.0 && attacker_has_live_siege_unit(atk) {"),
    # Dodatkowo: parowanie `lD[i % lD.length]` (:20441) -> zawsze pierwszy obronca.
    "M4": (INST, "let di = l_d[i % l_d.len()];", "let di = l_d[0];"),
    # Dodatkowo: E4 bez `result.log` w DTO (:3744).
    "M5": (OUT, "    dto.log = skip.result.log.clone();\n", "    let _ = &skip.result.log;\n"),
    # Dodatkowo: regula machiny w producencie DTO (E4, :3720-3722).
    "M6": (OUT, "if is_siege && d.attacker_has_live_siege_unit {", "if false && is_siege && d.attacker_has_live_siege_unit {"),
}
f, a, b = M[n]
p = f"{root}/{f}"
s = open(p, encoding="utf-8").read()
assert s.count(a) == 1, n
open(p, "w", encoding="utf-8").write(s.replace(a, b))
print(f)
