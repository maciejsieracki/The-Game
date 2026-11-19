#!/usr/bin/env python3
"""Mutanty Evaluatora (adwersarialne) R-RUSTPORT-P6-K5LOOP-ADAPTER-Q1. Jeden naraz, przywrocenie po kazdym."""
import os, subprocess, sys, time

ROOT = "/home/user/The-Game/.claude/worktrees/wf_aa003b5d-05f-2/rust-port/engine"
D = ROOT + "/src/domain/"
B = D + "siege_battle_adapter_body.rs"
U = D + "siege_battle_adapter_unit.rs"
A = D + "siege_battle_adapter.rs"
P = D + "siege_battle_adapter_playable.rs"

M = [
 ("E01", P, "Some(RelationStatus::War) => {\n                    relations.wars", "Some(RelationStatus::Alliance) => {\n                    relations.wars", "playable: wojna mapowana z sojuszu"),
 ("E02", P, '["mury", "mury_kamienne", "fort", "palisada"]', '["mury", "fort", "fort", "palisada"]', "playable: maMur bez mury_kamienne"),
 ("E03", P, "ru.hp = rep.and_then(|r| r.hp);", "ru.hp = None;", "playable: HP ze stanu pominiete"),
 ("E04", P, "ru.battles_survived = rep.and_then(|r| r.battles_survived);", "ru.battles_survived = None;", "playable: weteran ze stanu pominiety"),
 ("E05", A, "if city.garnizon.unwrap_or(0.0) > 0.0 {", "if city.garnizon.unwrap_or(0.0) >= 0.0 {", "hasCityDefenders garnizon >0 -> >=0"),
 ("E06", A, "RosterSide::Attacker => u.id == anchor_id,", "RosterSide::Attacker => true,", "cywile atakujacego wlaczani"),
 ("E07", A, "    if allowed.is_none() {\n        return out;\n    }\n    let Some(lead)", "    if allowed.is_some() {\n        return out;\n    }\n    let Some(lead)", "kolejnosc rostera szturmu (kotwica/wlasni/sojusznicy)"),
 ("E08", A, "    if e >= 3.0 {\n        2", "    if e > 3.0 {\n        2", "militiaEraKey >=3 -> >3"),
 ("E09", A, "UVal::Num(base.min(scaled))", "UVal::Num(scaled)", "buildMilitiaDef bez min(base)"),
 ("E10", A, "    if let Some(g) = atk.iter().find(|u| u.is_general) {", "    if let Some(g) = atk.iter().find(|u| u.is_general && false) {", "general atakujacego nie blokuje"),
 ("E11", B, "        dry_col: -1.0,", "        dry_col: 0.0,", "activate dry_col -1 -> 0"),
 ("E12", B, "    body.tower_range = scene.towers.tower_range;\n", "", "install_body_inputs bez tower_range"),
 ("E13", B, "            tower_range: DEFAULT_TOWER_MIN_RANGE,\n            tower_shot: None,", "            tower_range: 0.0,\n            tower_shot: None,", "bez wiezyczek towerRange 2 -> 0"),
 ("E14", B, "if layout.wall_col < 0 || layout.gate_col != layout.wall_col || layout.gate_row < 0 {", "if layout.wall_col < 0 || layout.gate_row < 0 {", "InvalidGate bez kontroli kolumny bramy"),
 ("E15", B, "if spawn.range_base.is_nan() || spawn.range_base < min {", "if spawn.range_base < min {", "Z4 bez NaN"),
 ("E16", B, "r.clamp(1.0, 3.0)", "r.clamp(1.0, 4.0)", "clamp_era gorna granica 3 -> 4"),
 ("E17", A, "        anchor.owner_id,\n        inp.turn,\n        inp.ready_machines,", "        city.owner_id,\n        inp.turn,\n        inp.ready_machines,", "machiny z wlascicielem miasta"),
 ("E18", A, "    if militia_regen_turns_left(city.militia_regen_at_turn, opts.current_turn) > 0.0 {\n        return empty(roster);", "    if militia_regen_turns_left(city.militia_regen_at_turn, opts.current_turn) > 1.0 {\n        return empty(roster);", "odnowa milicji >0 -> >1"),
 ("E19", B, "        body.ranged_base[s][i] = u.ranged_base;\n", "", "install_body_inputs bez ranged_base"),
 ("E20", A, "        Some(UVal::Num(n)) => Some(*n),\n        _ => None,", "        Some(UVal::Num(n)) => Some(*n + 0.0),\n        Some(UVal::Str(_)) => Some(0.0),\n        _ => None,", "num_of: napis jako 0 (ciche zero)"),
]

only = set(sys.argv[1:])
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0",
           CARGO_TARGET_DIR="/tmp/claude-0/-home-user-The-Game/b3259bfd-6985-5166-9861-4edd4aa89b33/scratchpad/adapter/t2")
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
