import os
import re
import subprocess
import sys

ENGINE = "/home/user/The-Game/.claude/worktrees/wf_19de3d10-d8a-4/rust-port/engine"
P = ENGINE + "/src/domain/production_units.rs"
SCR = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad"
TARGET = SCR + "/target"
LOGDIR = SCR + "/mut"
CLEAN = SCR + "/production_units.clean.rs"

MUTS = [
    ("M4", "        })\n        .then_with(|| a.cmp(b))\n", "        })\n"),
    ("M5", "        cap.trunc() as usize", "        cap.ceil() as usize"),
    ("M6", "    let raw = if modifier.is_finite() { modifier } else { 0.0 };", "    let raw = modifier;"),
    ("M7", "let Some(front) = prod.kolejka.first() else {\n        return 0.0;", "let Some(front) = prod.kolejka.first() else {\n        return 1.0;"),
    ("M8", "    let remaining = js_max(0.0, (front.koszt - prod.postep).ceil());", "    let remaining = js_max(0.0, (front.koszt - prod.postep));"),
    ("M9", "                kolejka: Vec::new(),\n                postep: 0.0,", "                kolejka: Vec::new(),\n                postep: prod.postep,"),
    ("M10", "        if next.postep.is_some() {\n            next.postep = None;\n", "        if next.postep.is_some() {\n            let _keep = ();\n"),
    ("M11", "|f| f.postep.unwrap_or(0.0)) + remainder", "|f| f.postep.unwrap_or(1.0)) + remainder"),
    ("M12", "    while n < max_per_turn && !rq.is_empty() {\n        if cost_already_paid {", "    while n < max_per_turn && !rq.is_empty() {\n        if cost_already_paid && false {"),
    ("M13", "        if !d.ok {\n            break;\n", "        if !d.ok && false {\n            break;\n"),
    ("M14", "    while n < max_per_turn && !rq.is_empty() {", "    while n <= max_per_turn && !rq.is_empty() {"),
    ("M15", "            produkcja: t,\n", "            produkcja: 0.0,\n"),
    ("M16", "    let rozwoj = t - produkcja - pieniadz - nauka;", "    let rozwoj = (t * rr / sum).floor();"),
    ("M17", "    let pieniadz = (t * rpi / sum).floor();", "    let pieniadz = (t * rpi / sum).round();"),
    ("M18", "    let fix = |v: f64| if v.is_finite() && v >= 0.0 { v } else { 0.0 };", "    let fix = |v: f64| if v >= 0.0 { v } else { 0.0 };"),
    ("M18b", "    let fix = |v: f64| if v.is_finite() && v >= 0.0 { v } else { 0.0 };", "    let fix = |v: f64| if v.is_finite() { v } else { 0.0 };"),
    ("M19", "    let t = if total.is_finite() && total > 0.0 {", "    let t = if total.is_finite() {"),
    ("M31", "    if t == 0.0 {", "    if false {"),
    ("M20", "    let next: Vec<ProductionItem> = if index < 0 || index >= rq.len() as i64 {", "    let next: Vec<ProductionItem> = if false {"),
    ("M21", "    if queue_empty {\n        split.do_puli + split.do_budynkow", "    if !queue_empty {\n        split.do_puli + split.do_budynkow"),
    ("M22", "        if paused.and_then(|p| p.get(i)).copied().unwrap_or(false) {", "        if false && paused.and_then(|p| p.get(i)).copied().unwrap_or(false) {"),
    ("M23", "        let qe = queue_empty.get(i).copied().unwrap_or(true);", "        let qe = queue_empty.get(i).copied().unwrap_or(false);"),
    ("M24", "            Self::Queued => 2,\n            Self::Built => 3,", "            Self::Queued => 3,\n            Self::Built => 2,"),
    ("M25", "lite_of(&row.avail)) {\n            continue;\n        }\n        if id == \"palisada\" && (built.contains(&\"mury\") || built.contains(&\"fort\")) {", "lite_of(&row.avail)) {\n            continue;\n        }\n        if id == \"palisada\" && false && (built.contains(&\"mury\") || built.contains(&\"fort\")) {"),
    ("M26", "} else if !row.wielokrotny.unwrap_or(false) && built.contains(&id) {", "} else if built.contains(&id) {"),
    ("M27", "(BuildingCatalogStatus::Locked, b.lokalizacja.clone())", "(BuildingCatalogStatus::Locked, None)"),
    ("M28", "let tech_ok = tech.is_empty() || tech == \"-\" || tech == \"\\u{2014}\" || techs.contains(&tech);", "let tech_ok = tech.is_empty() || tech == \"\\u{2014}\" || techs.contains(&tech);"),
    ("M29", "    if rq.is_empty() || max_per_turn <= 0.0 {", "    if rq.is_empty() {"),
]


def run(sel):
    orig = open(CLEAN, encoding="utf-8").read()
    for mid, old, new in MUTS:
        if sel and mid not in sel:
            continue
        cnt = orig.count(old)
        if cnt != 1:
            print(mid, "COUNT_NOT_1", cnt, flush=True)
            continue
        mutated = orig.replace(old, new)
        try:
            open(P, "w", encoding="utf-8").write(mutated)
            env = dict(os.environ)
            env.update({
                "CARGO_INCREMENTAL": "0",
                "CARGO_PROFILE_DEV_DEBUG": "0",
                "CARGO_PROFILE_TEST_DEBUG": "0",
                "CARGO_TARGET_DIR": TARGET,
            })
            r = subprocess.run(
                ["cargo", "test", "--test", "p6_8b2_p2_vectors", "--test", "p6_8b2_p2_gaps"],
                cwd=ENGINE, env=env, capture_output=True, text=True, timeout=900,
            )
            out = r.stdout + r.stderr
            with open(LOGDIR + "/" + mid + ".log", "w", encoding="utf-8") as f:
                f.write(out)
            failed = re.findall(r"^test (\S+) \.\.\. FAILED", out, re.M)
            if "error[" in out or ("error:" in out and not failed):
                status = "BUILD_ERR"
            elif failed:
                status = "KILLED"
            else:
                status = "SURVIVED"
            print(mid, status, "exit=" + str(r.returncode), "failed=" + (",".join(failed) if failed else "-"), flush=True)
        finally:
            open(P, "w", encoding="utf-8").write(orig)
    print("RESTORED_CLEAN", flush=True)


if __name__ == "__main__":
    run(sys.argv[1:])
