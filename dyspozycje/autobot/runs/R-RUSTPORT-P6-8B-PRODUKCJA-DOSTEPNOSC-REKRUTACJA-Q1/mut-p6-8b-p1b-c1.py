import os, subprocess, sys
ENG = "/home/user/The-Game/.claude/worktrees/wf_76dd249b-13f-1/rust-port/engine"
SRC = os.path.join(ENG, "src/domain/production_units.rs")
BAK = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/pu-backup.rs"
orig = open(BAK, encoding="utf8").read()
muts = [
    ('Some(format!("Brak w magazynie państwa: {label}"))', 'None'),
    ('ProductionKind::Jednostka => UNIT_POPULATION_COST,', 'ProductionKind::Jednostka => 0.0,'),
    ('unwrap_or(0.0) > 0.0', 'unwrap_or(0.0) >= 0.0'),
    ('ProductionKind::Budynek => 0.0,', 'ProductionKind::Budynek => UNIT_POPULATION_COST,'),
]
env = dict(os.environ, CARGO_INCREMENTAL="0", CARGO_PROFILE_DEV_DEBUG="0", CARGO_PROFILE_TEST_DEBUG="0")
try:
    for i, (a, b) in enumerate(muts, 1):
        assert orig.count(a) == 1, f"M{i}: pattern count {orig.count(a)}"
        open(SRC, "w", encoding="utf8").write(orig.replace(a, b))
        p = subprocess.run(["cargo", "test", "--test", "p6_8b_p1b_vectors"], cwd=ENG, env=env,
                           capture_output=True, text=True, timeout=500)
        out = p.stdout + p.stderr
        status = "COMPILE-ERROR" if "error[" in out else ("KILLED" if p.returncode != 0 else "SURVIVED")
        print(f"M{i}: {status}")
finally:
    open(SRC, "w", encoding="utf8").write(orig)
    print("restored", open(SRC, encoding="utf8").read() == orig)
