#!/usr/bin/env python3
"""Mutanty adaptera R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1 (Operator r1c). Jeden mutant naraz, przywrocenie pliku po kazdym."""
import os, subprocess, sys, time

ROOT = "/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/adapter/ms/rust-port/engine"
D = ROOT + "/src/domain/"
B = D + "siege_battle_adapter_body.rs"
U = D + "siege_battle_adapter_unit.rs"
A = D + "siege_battle_adapter.rs"
P = D + "siege_battle_adapter_playable.rs"

M = [
 ("M01", B, "side_def && on_wall_walkway && ranged_base && !is_catapult && range_base > 0.0", "on_wall_walkway && ranged_base && !is_catapult && range_base > 0.0", "crown shooter bez side_def"),
 ("M02", B, "let range = js_max(0.0, ru.range_base + terrain_delta);", "let range = ru.range_base + terrain_delta;", "apply_terrain_range bez max(0)"),
 ("M03", B, "        6.0\n    } else {\n        1.0", "        5.0\n    } else {\n        1.0", "siege_machine_range katapulta 6->5"),
 ("M04", B, "    if r >= 1.0 {\n        r", "    if r > 1.0 {\n        r", "siege_machine_range >=1 -> >1"),
 ("M05", B, "            6.0\n        } else {\n            2.0", "            2.0\n        } else {\n            2.0", "Z4 min katapulty korony 6->2"),
 ("M06", B, "        shooting_enabled: true,", "        shooting_enabled: false,", "D-B11 shooting_enabled"),
 ("M07", B, "layout.gate_hp.is_finite() && layout.gate_hp > 0.0", "layout.gate_hp.is_finite() && layout.gate_hp >= 0.0", "InvalidGate gate_hp >0 -> >=0"),
 ("M08", B, "&& layout.gate_hp > 0.0) || layout.gate_open {", "&& layout.gate_hp > 0.0) {", "InvalidGate bez gate_open"),
 ("M09", B, "        doctrine_auto,\n        doctrine_manual,", "        doctrine_auto: true,\n        doctrine_manual,", "doctrine_auto stala true"),
 ("M10", B, "let r = (e + 0.5).floor();", "let r = e.floor();", "clamp_era bez +0.5"),
 ("M11", B, "gate_row_lo: layout.gate_row - 1,", "gate_row_lo: layout.gate_row,", "wiezyczki gate_row_lo"),
 ("M12", U, "pub const DEF_CATAPULT_CROWN_RANGE: f64 = 6.0;", "pub const DEF_CATAPULT_CROWN_RANGE: f64 = 5.0;", "zasieg katapulty korony 6->5"),
 ("M13", U, "pub const DEFENDER_MORALE_MULT: f64 = 1.5;", "pub const DEFENDER_MORALE_MULT: f64 = 1.0;", "morale obroncow x1.5 -> x1"),
 ("M14", U, "pub const WALL_CROWN_RANGE_MULT: f64 = 2.0;", "pub const WALL_CROWN_RANGE_MULT: f64 = 1.0;", "korona x2 -> x1"),
 ("M15", U, "(r * WALL_CROWN_RANGE_MULT).ceil()", "(r * WALL_CROWN_RANGE_MULT).floor()", "korona ceil -> floor"),
 ("M16", U, "(p.sufit_proc / 100.0).min(raw)", "raw", "kara morale bez sufitu"),
 ("M17", U, "(p.wspolczynnik_proc / 100.0) * js_log10(ratio)", "(p.wspolczynnik_proc / 100.0) * ratio.log10()", "log10 V8 -> libm"),
 ("M18", U, "let podloga = f.morale.min(flee + eps);", "let podloga = flee + eps;", "kara morale podloga bez min(morale)"),
 ("M19", U, "f.morale = podloga.max(ukarane).max(0.0);", "f.morale = ukarane.max(0.0);", "kara morale bez podlogi"),
 ("M20", U, "        (Some(Side::Def), m_atk / m_def)", "        (Some(Side::Atk), m_atk / m_def)", "power_advantage slabsza strona"),
 ("M21", U, "    js_round(sum * 10.0) / 10.0\n}", "    sum\n}", "hp_weighted bez zaokraglenia 0.1"),
 ("M22", U, "                rf >= 2.0,\n                false,", "                rf >= 1.0,\n                false,", "DefenderInner ranged >=2 -> >=1"),
 ("M23", U, "group_id.is_some_and(|g| !g.is_empty())", "group_id.is_some()", "doctrine_auto_for pusty group_id"),
 ("M24", U, "map_or(counter_mult, |f| 1.0 + f)", "map_or(1.0, |f| 1.0 + f)", "kontra bez COUNTER_MULT dla nieparsowalnego bonusu"),
 ("M25", A, "        if !owner_ok {\n            continue;\n        }\n        if hex_distance(u.q, u.r, city.0, city.1) > 1 {", "        if !owner_ok {\n            continue;\n        }\n        if hex_distance(u.q, u.r, city.0, city.1) > 2 {", "roster szturmu promien 1->2"),
 ("M26", A, "pub const BATTLE_MAX_PER_SIDE: usize = 500;", "pub const BATTLE_MAX_PER_SIDE: usize = 120;", "MAX_PER_SIDE pin 500 -> renderer 120"),
 ("M27", A, "RosterSide::Defender => u.q == hex.0 && u.r == hex.1,", "RosterSide::Defender => true,", "cywile obroncy spoza heksu"),
 ("M28", A, "let wrecz = (c / 2.0).ceil();", "let wrecz = (c / 2.0).floor();", "militia_split ceil -> floor"),
 ("M29", A, "        roster: owner_first(res.roster, city.owner_id),", "        roster: res.roster,", "collectSiegeDefRoster bez owner_first"),
 ("M30", A, "js_num_to_string(turn), i);", "js_num_to_string(turn), i + 1);", "id machin indeks"),
 ("M31", P, '["mury", "mury_kamienne", "fort", "palisada"]', '["mury", "mury_kamienne", "fort", "fort"]', "maMur bez palisady"),
]

only = set(sys.argv[1:])
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0",
           CARGO_TARGET_DIR="/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/adapter/t")
res = []
for mid, path, old, new, desc in M:
    if only and mid not in only:
        continue
    src = open(path).read()
    n = src.count(old)
    if n != 1:
        print(f"{mid} BAD-PATTERN count={n} ({desc})", flush=True)
        res.append((mid, "BAD", desc)); continue
    open(path, "w").write(src.replace(old, new))
    t0 = time.time()
    try:
        p = subprocess.run(["cargo", "test", "--test", "p6_k5loop_adapter"], cwd=ROOT, env=env,
                           capture_output=True, text=True, timeout=900)
        out = p.stdout + p.stderr
        if p.returncode == 0:
            st = "SURVIVED"
        elif "error[" in out or "could not compile" in out:
            st = "COMPILE-ERR"
        else:
            st = "KILLED"
        failed = [l.split()[1] for l in out.splitlines() if l.startswith("test ") and l.rstrip().endswith("FAILED")]
    finally:
        open(path, "w").write(src)
    print(f"{mid} {st} {int(time.time()-t0)}s ({desc}) failed={failed}", flush=True)
    res.append((mid, st, desc))
k = sum(1 for r in res if r[1] == "KILLED")
print(f"SUMMARY killed={k} total={len(res)} survived={[r[0] for r in res if r[1]=='SURVIVED']} other={[r[0] for r in res if r[1] not in ('KILLED','SURVIVED')]}", flush=True)
