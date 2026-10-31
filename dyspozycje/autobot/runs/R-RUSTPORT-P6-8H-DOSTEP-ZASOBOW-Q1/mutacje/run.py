import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mutants import M  # noqa: E402

ENGINE = "/home/user/The-Game/.claude/worktrees/wf_340cae56-806-1/rust-port/engine"
SRC = ENGINE + "/src/domain/resource_access.rs"
SCRATCH = "/tmp/claude-0/-home-user-The-Game/cbf4a126-dca3-5f50-bfb0-2a747b18a590/scratchpad/p6-8h/mut"
OUT = SCRATCH + "/results_" + os.environ.get("RUN_TAG", "main") + ".txt"

lo, hi = int(sys.argv[1]), int(sys.argv[2])
with open(SRC, encoding="utf-8") as f:
    orig = f.read()
with open(SCRATCH + "/resource_access.rs.orig", "w", encoding="utf-8") as f:
    f.write(orig)

env = dict(os.environ)
env.update({
    "CARGO_TARGET_DIR": "/dev/shm/p6-8h-target",
    "CARGO_INCREMENTAL": "0",
    "CARGO_PROFILE_DEV_DEBUG": "0",
    "CARGO_PROFILE_TEST_DEBUG": "0",
})

try:
    for mid, old, new, klass in M[lo:hi]:
        n = orig.count(old)
        if n != 1:
            line = f"{mid} BLAD-DOPASOWANIA count={n} klasa={klass}"
        else:
            with open(SRC, "w", encoding="utf-8") as f:
                f.write(orig.replace(old, new, 1))
            p = subprocess.run(
                ["cargo", "test", "--test", "p6_8h_access"],
                cwd=ENGINE, env=env, capture_output=True, text=True, timeout=400,
            )
            text = p.stdout + p.stderr
            m = re.search(r"test result: (\w+)\. (\d+) passed; (\d+) failed", text)
            if "error[" in text or "could not compile" in text:
                verdict = "COMPILE-ERROR"
            elif p.returncode == 0 and m and m.group(1) == "ok":
                verdict = "SURVIVED"
            else:
                verdict = "KILLED"
            failed = sorted(set(re.findall(r"^---- (\S+) stdout", text, re.M)))
            summary = m.group(0) if m else "brak"
            line = (f"{mid} {verdict} klasa={klass} exit={p.returncode} "
                    f"wynik={summary} padle={','.join(failed)}")
        print(line, flush=True)
        with open(OUT, "a", encoding="utf-8") as f:
            f.write(line + "\n")
finally:
    with open(SRC, "w", encoding="utf-8") as f:
        f.write(orig)
    print("RESTORED", flush=True)
