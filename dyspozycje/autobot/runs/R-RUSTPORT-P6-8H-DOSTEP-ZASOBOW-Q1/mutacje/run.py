import os
import re
import subprocess
import sys
import signal
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mutants_r2 import M  # noqa: E402

# Sciezki wzgledne do korzenia repo: mutacje -> run -> runs -> autobot -> dyspozycje -> korzen.
ENGINE = os.environ.get("P6_8H_ENGINE") or os.path.normpath(
    os.path.join(HERE, "..", "..", "..", "..", "..", "rust-port", "engine"))
SRC = os.path.join(ENGINE, "src", "domain", "resource_access.rs")
# Kopia oryginalu i wynik poza repo (wynik przenoszony do runu przez commit).
SCRATCH = tempfile.mkdtemp(prefix="p6-8h-mut-")
OUT = os.path.join(HERE, "wynik-4-" + os.environ.get("RUN_TAG", "main") + ".txt")

lo, hi = int(sys.argv[1]), int(sys.argv[2])
# SIGTERM (np. timeout) ma przejsc przez finally, zeby zrodlo zawsze wrocilo do oryginalu.
signal.signal(signal.SIGTERM, lambda s, f: sys.exit(143))
with open(SRC, encoding="utf-8") as f:
    orig = f.read()
if "    if !mix_active || foreign_pct <= 0.0 {" not in orig:
    sys.exit("ZRODLO NIE JEST STANEM BAZOWYM - przerwano przed mutacjami")
with open(os.path.join(SCRATCH, "resource_access.rs.orig"), "w", encoding="utf-8") as f:
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
