import subprocess, shutil, sys, os

SRC = "/home/user/The-Game/.claude/worktrees/wf_a9d963c8-ef3-1/rust-port/engine/src/domain/production_units.rs"
BAK = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/production_units.rs.bak"
ENGINE = "/home/user/The-Game/.claude/worktrees/wf_a9d963c8-ef3-1/rust-port/engine"
ENV = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_TARGET_DIR="/home/user/cargo-target-shared/wf_a9d963c8-ef3-1", CARGO_PROFILE_DEV_DEBUG="0")

MUTANTS = [
    ("M1-blank-em-dash", '|| zamiast == "\\u{2014}"', ""),
    ("M2-unit-allowed-empty", "    if n.is_empty() {\n        return true;\n    }", "    if n.is_empty() {\n        return false;\n    }"),
    ("M3-gold-no-min", "        rounded.max(1.0)\n", "        rounded\n"),
    ("M4-mury-palisada", '    if completed_building_id == "mury" {', '    if false {'),
    ("M5-match-tn-starts", "            || tn.starts_with(&un)\n", ""),
    ("M6-primary-token", "                    tokens.push(primary.to_string());\n", ""),
    ("M7-lowercase-key", "    let lower = key.to_lowercase();", "    let lower = key.to_string();"),
    ("M8-committed-queue", "            .any(|it| it.kind == ProductionKind::Budynek && it.id == building_id)\n}", "            .any(|it| false)\n}"),
    ("M9-superseded-built", "        b.upgrade_from.as_deref() == Some(building_id) && built_ids.contains(&b.id.as_str())", "        b.upgrade_from.as_deref() == Some(building_id)"),
    ("M10-civ-has-rep-trim", "            && js_trim(unit.w_zamian_za.as_deref().unwrap_or(\"\")) == base_unit_name", "            && unit.w_zamian_za.as_deref().unwrap_or(\"\") == base_unit_name"),
]

orig = open(SRC, encoding="utf-8").read()
shutil.copyfile(SRC, BAK)
results = []
try:
    for name, old, new in MUTANTS:
        n = orig.count(old)
        if n != 1:
            results.append((name, f"PATTERN COUNT {n} (pominiete)"))
            continue
        open(SRC, "w", encoding="utf-8").write(orig.replace(old, new, 1))
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_helpers_vectors"], cwd=ENGINE, env=ENV,
                           capture_output=True, text=True, timeout=580)
        out = p.stdout + p.stderr
        killed = p.returncode != 0
        results.append((name, "KILLED" if killed else "SURVIVED"))
        print(name, "KILLED" if killed else "SURVIVED", flush=True)
finally:
    shutil.copyfile(BAK, SRC)
    print("RESTORED", flush=True)
print(results)
